// DOMINION (Evil Mode rework; design plans/evil-mode-rework, build plan BUILD_SLICES.md slice D1): the title card, the
// setup pages, the opening scene and the HQ with its clock. The scene is the controller: it keeps the cursors and the
// setup draft, and asks the session to start the Dominion or step the clock (saved at every step). Drawn in the New
// look only: with Old selected, the New layer is mounted for this screen (the setting is never changed).

import Phaser from 'phaser';
import { getArchetype } from '../core/archetypes';
import { pokemonAssetIds, type AssetManifest } from '../assets/catalog';
import { DOMINION_DATA } from '../core/dominion/data';
import { dominionBlock } from '../core/dominion/session';
import { hqModel, newSetup, openingLines, SETUP_PAGES, toggleType, typeGrid, type SetupDraft } from '../core/dominion/screens';
import type { DominionAction } from '../core/dominion/schema';
import { services } from '../game/services';
import { onInputAction, type InputAction } from '../ui/input';
import { rxFileOf } from '../ui/redux/assets';
import { mountRedux, type ReduxView } from '../ui/redux/stage';
import { hqView, openingView, setupView, titleView, type SetupFiles } from '../ui/redux/screens/dominion/views';
import { CrewController } from './dominion/crewController';

type Screen = 'title' | 'setup' | 'opening' | 'hq' | 'crew';

const TAB_KEYS: Record<string, number> = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5 };

export class DominionScene extends Phaser.Scene {
  private view: ReduxView | null = null;
  private screen: Screen = 'title';
  private titleAt = 0;
  private setup: SetupDraft = newSetup();
  private shown = 1;
  private at = 0;
  private notice: string | null = null;
  private leaving = false;
  private files: SetupFiles | null = null;
  /** D3: the Morning (mockup 2) and the Crew File (mockup 5). */
  private crew = new CrewController(this);

  constructor() {
    super('Dominion');
  }

  create(): void {
    this.screen = 'title';
    this.setup = newSetup();
    this.shown = 1;
    this.at = 0;
    this.notice = null;
    this.leaving = false;
    this.crew = new CrewController(this);
    const { session } = services();
    const run = session.run;
    if (!run) return void this.scene.start('MainMenu');
    this.titleAt = dominionBlock(run) ? 1 : 0;
    const manifest = this.cache.json.get('manifest') as AssetManifest | undefined;
    const archetype = getArchetype(session.content, run.archetypeId);
    const level = run.party[0]?.level ?? 5;
    const d = DOMINION_DATA.start;
    this.files = {
      boss: { name: archetype.name, file: rxFileOf(manifest, archetype.spriteAssetId)?.file ?? null },
      starters: run.starterChoices.slice(0, 3).map((id) => {
        const sp = session.content.species.get(id);
        return { name: sp?.name ?? id, level, file: sp ? rxFileOf(manifest, pokemonAssetIds(sp.assets).front)?.file ?? null : null };
      }),
      types: d.types,
      grunt: { name: d.members.grunt.name, pitch: d.members.grunt.pitch, facts: d.members.grunt.facts },
      admin: { pitch: d.members.admin.pitch, facts: d.members.admin.facts, looks: d.members.admin.looks },
    };
    this.view = mountRedux(this, {
      render: () => this.render(),
      acts: {
        title: (i) => { this.titleAt = Number(i); this.confirm(); },
        type: (i) => { this.setup = toggleType({ ...this.setup, at: Number(i) }); this.view?.refresh(); },
        member: (i) => { this.setup = { ...this.setup, member: i === '0' ? 'grunt' : 'admin', problem: null }; this.view?.refresh(); },
        next: () => this.next(),
        more: () => this.confirm(),
        order: (i) => { this.at = Number(i); this.confirm(); },
        tab: (i) => this.tab(Number(i)),
        ...this.crew.acts(),
      },
      overs: {
        typeOver: (i) => { this.setup = { ...this.setup, at: Number(i) }; this.view?.refresh(); },
        orderOver: (i) => { this.at = Number(i); this.view?.refresh(); },
        ...this.crew.overs(),
      },
    });
    onInputAction(this, (a) => this.key(a));
    const kb = this.input.keyboard;
    const raw = (e: KeyboardEvent): void => {
      if ((this.screen !== 'hq' && this.screen !== 'crew') || this.leaving) return;
      if (this.crew.raw(e.code)) return;
      if (e.code in TAB_KEYS) this.tab(TAB_KEYS[e.code]!);
      else if (e.code === 'KeyN') this.step({ t: 'toNight' });
      else if (e.code === 'KeyE') this.step({ t: 'endDay' });
    };
    kb?.on('keydown', raw);
    this.events.once('shutdown', () => kb?.off('keydown', raw));
  }

  private block() {
    return dominionBlock(services().session.run);
  }

  private memberLook(): { look: string; atlas: boolean } {
    const m = this.block()?.members[0];
    const look = m?.look ?? DOMINION_DATA.start.members.grunt.look;
    return { look, atlas: !look.endsWith('.png') };
  }

  private render(): string {
    const b = this.block();
    switch (this.screen) {
      case 'title':
        return titleView({ at: this.titleAt, started: !!b, cont: b ? `${b.teamName ?? 'Unnamed Crew'} · Kanto · Day ${b.day}` : null });
      case 'setup':
        return setupView(this.setup, this.files!);
      case 'opening':
        return openingView(b ? openingLines(b) : [], this.shown, this.memberLook());
      case 'hq':
        if (b && this.crew.owns()) return this.crew.render(this.notice);
        return b ? hqView(hqModel(b), this.notice, this.at, this.memberLook()) : '';
      case 'crew':
        return this.crew.render(this.notice);
    }
  }

  private key(a: InputAction): void {
    if (this.leaving) return;
    if (this.crew.key(a)) return void this.view?.refresh();
    if (a === 'back') return this.back();
    if (a === 'confirm') return this.confirm();
    if (this.screen === 'title' && (a === 'up' || a === 'down')) this.titleAt = this.titleAt ? 0 : 1;
    else if (this.screen === 'setup') this.setupMove(a);
    else if (this.screen === 'hq' && (a === 'up' || a === 'down')) {
      const n = hqModel(this.block()!).orders.length;
      if (n) this.at = (this.at + (a === 'up' ? -1 : 1) + n) % n;
    }
    this.view?.refresh();
  }

  private setupMove(a: InputAction): void {
    const d = this.setup;
    if (d.page === 'types') {
      const n = typeGrid().length, dx = a === 'left' ? -1 : a === 'right' ? 1 : a === 'up' ? -4 : 4;
      this.setup = { ...d, at: (d.at + dx + n) % n };
    } else if (d.page === 'member') {
      if (a === 'left' || a === 'right') this.setup = { ...d, member: d.member === 'grunt' ? 'admin' : 'grunt', problem: null };
      else if (d.member === 'admin') {
        const n = DOMINION_DATA.start.members.admin.looks.length;
        this.setup = { ...d, look: (d.look + (a === 'up' ? -1 : 1) + n) % n };
      }
    }
  }

  private confirm(): void {
    const b = this.block();
    if (this.screen === 'title') {
      if (this.titleAt === 0 && !b) this.screen = 'setup';
      else if (this.titleAt === 1 && b) this.screen = b.opened ? 'hq' : 'opening';
    } else if (this.screen === 'setup') {
      if (this.setup.page === 'types') this.setup = toggleType(this.setup);
      else return this.next();
    } else if (this.screen === 'opening') {
      const lines = b ? openingLines(b) : [];
      if (this.shown < lines.length) this.shown += 1;
      else {
        services().session.dominionStep({ t: 'open' });
        this.screen = 'hq';
      }
    } else if (this.screen === 'hq' && b) {
      const m = hqModel(b);
      const order = m.orders[this.at];
      if (m.panel === 'orders' && order) return void this.step(b.phase === 'day' ? { t: 'do', order: order.id } : { t: 'plan', order: order.id });
      return this.next();
    }
    this.view?.refresh();
  }

  /** The page's or the clock's one button. */
  private next(): void {
    if (this.screen === 'setup') {
      const d = this.setup;
      const i = SETUP_PAGES.indexOf(d.page);
      if (d.page === 'types' && d.types.length !== 2) this.setup = { ...d, problem: 'Pick two Team Types.' };
      else if (i < SETUP_PAGES.length - 1) this.setup = { ...d, page: SETUP_PAGES[i + 1]!, problem: null };
      else {
        const problem = services().session.dominionStart({ types: [d.types[0]!, d.types[1]!], member: d.member, look: d.look });
        if (problem) this.setup = { ...d, problem };
        else {
          this.screen = 'opening';
          this.shown = 1;
        }
      }
      return this.view?.refresh();
    }
    if (this.screen !== 'hq') return this.confirm();
    const b = this.block();
    if (!b) return;
    const by: Record<string, DominionAction> = { evening: { t: 'toNight' }, night: { t: 'rest' }, morning: { t: 'toDay' }, day: { t: 'endDay' } };
    this.step(by[b.phase]!);
  }

  /** Exposed for the crew controller. */
  get screenName(): Screen {
    return this.screen;
  }
  set screenName(s: Screen) {
    this.screen = s;
  }
  setNotice(n: string | null): void {
    this.notice = n;
  }
  refresh(): void {
    this.view?.refresh();
  }

  step(action: DominionAction): boolean {
    const out = services().session.dominionStep(action);
    if (out.ok) {
      this.notice = out.notice;
      const n = hqModel(this.block()!).orders.length;
      this.at = Math.min(this.at, Math.max(0, n - 1));
    } else if (out.notice) this.notice = out.notice;
    this.view?.refresh();
    return out.ok;
  }

  private tab(i: number): void {
    if (this.screen !== 'hq' && this.screen !== 'crew') return;
    if (this.crew.tab(i)) return void this.view?.refresh();
    this.notice = i === 0 ? null : DOMINION_DATA.start.lockedTab;
    this.view?.refresh();
  }

  private back(): void {
    if (this.screen === 'setup') {
      const i = SETUP_PAGES.indexOf(this.setup.page);
      if (i > 0) this.setup = { ...this.setup, page: SETUP_PAGES[i - 1]!, problem: null };
      else this.screen = 'title';
      return this.view?.refresh();
    }
    if (this.screen === 'hq' && this.notice) {
      this.notice = null;
      return this.view?.refresh();
    }
    this.leave();
  }

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    if (!services().session.saveAndLeaveRun()) {
      this.leaving = false;
      this.notice = 'The run could not be saved.';
      return this.view?.refresh();
    }
    this.scene.start('MainMenu');
  }
}

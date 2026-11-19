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
import { setLogKeyTaken } from '../ui/overlays';
import { rxFileOf } from '../ui/redux/assets';
import { mountRedux, type ReduxView } from '../ui/redux/stage';
import { hqView, openingView, setupView, titleView, type SetupFiles } from '../ui/redux/screens/dominion/views';
import { CrewController } from './dominion/crewController';
import { HqController } from './dominion/hqController';
import { cardModel, gridPages, mapModel, newCursor, pageFor, type MapCursor } from '../core/dominion/fieldScreens';
import { cardView, mapView } from '../ui/redux/screens/dominion/fieldViews';
import { ledgerModel, SPREADS } from '../core/dominion/ledgerScreens';
import { ledgerView } from '../ui/redux/screens/dominion/ledger';
import { foundedLines, foundingOpen, initialOf, nameIdeas, newDraft, teamColours } from '../core/dominion/founding';
import { FOUNDING_ROWS, foundedView, foundingView, type FoundingUi } from '../ui/redux/screens/dominion/founding';

type Screen = 'title' | 'setup' | 'opening' | 'hq' | 'map' | 'card' | 'crew' | 'ledger' | 'founding' | 'founded' | 'base';

/** The screen to come back to after a battle (D2: the map the action was picked on, or the HQ for a fight at the door). */
let resume: Screen | null = null;

const TAB_KEYS: Record<string, number> = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5 };
/** Letters the input layer also reads as moves (WASD); the HQ menu uses A (View Assets) and S (Sell). */
const MOVE_LETTERS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyZ', 'KeyX']);

export class DominionScene extends Phaser.Scene {
  private view: ReduxView | null = null;
  private screen: Screen = 'title';
  private titleAt = 0;
  private setup: SetupDraft = newSetup();
  private shown = 1;
  private at = 0;
  private notice: string | null = null;
  private leaving = false;
  /** A letter the HQ menu used that is also a move key (A = left, S = down): its move is dropped. */
  private ate = false;
  private files: SetupFiles | null = null;
  private cursor: MapCursor | null = null;
  private garage = false;
  private manifest: AssetManifest | undefined;
  /** D3: the Morning (mockup 2) and the Crew File (mockup 5). */
  private crew = new CrewController(this);
  /** D6: the Ledger's open spread (0 Money | Empire, 1 Territory | Notoriety, 2 Crew | Stores) and where L goes back to. */
  private spread = 0;
  private ledgerFrom: Screen = 'hq';
  /** D7: the Founding page's draft and cursor, where Esc goes back to, and the scene's lines shown. */
  private founding: FoundingUi | null = null;
  private foundingFrom: Screen = 'hq';
  private foundedShown = 1;
  /** D5: the HQ menu (mockup 6). */
  private hq = new HqController(this);

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
    this.founding = null;
    this.foundedShown = 1;
    this.hq = new HqController(this);
    const { session } = services();
    const run = session.run;
    if (!run) return void this.scene.start('MainMenu');
    this.titleAt = dominionBlock(run) ? 1 : 0;
    const manifest = this.cache.json.get('manifest') as AssetManifest | undefined;
    this.manifest = manifest;
    this.garage = false;
    this.cursor = null;
    // D2: back from a battle (or a battle lost with a closed tab): settle what's left, then return to where it started.
    const stale = session.dominionSettle();
    if (stale?.length) this.notice = stale.join(' ');
    const back = resume;
    resume = null;
    const blk = dominionBlock(session.run);
    if (back && blk?.opened) {
      this.screen = back === 'card' ? 'map' : back;
      if (this.screen === 'map') this.cursor = newCursor(blk);
    }
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
        district: (id) => this.pickDistrict(id),
        target: (i) => { if (this.cursor) this.cursor = { ...this.cursor, target: Number(i) }; this.view?.refresh(); },
        grid: (i) => { if (!this.cursor) return; const at = Number(i); const again = this.cursor.focus === 'grid' && this.cursor.at === at; this.cursor = { ...this.cursor, at, focus: 'grid' }; if (again) this.openCard(); else this.view?.refresh(); },
        page: (d) => this.turnPage(Number(d)),
        card: () => this.openCard(),
        doit: () => this.doIt(),
        back: () => this.back(),
        bring: () => this.bring(),
        buy: (id) => this.buy(id),
        dismiss: () => { this.notice = null; this.view?.refresh(); },
        ledgerTab: (i) => { this.spread = Number(i); this.view?.refresh(); },
        ledgerPage: (d) => this.turnLedger(Number(d)),
        founding: () => this.openFounding(),
        fRow: (i) => {
          const f = this.founding;
          if (!f) return;
          const r = FOUNDING_ROWS[Number(i)];
          if (f.typing && f.typing !== r) this.endTyping();
          f.row = Number(i);
          if (r === 'name' || r === 'motto') this.startTyping(r);
          this.view?.refresh();
        },
        fPrimary: (id) => this.pickColour('primary', id),
        fSecondary: (id) => this.pickColour('secondary', id),
        fLogo: (id) => { if (this.founding) this.founding.d = { ...this.founding.d, logo: id }; this.view?.refresh(); },
        fFound: () => this.submitFounding(),
        ...this.crew.acts(),
        ...this.hq.acts(),
        base: () => { this.hq.open(); this.view?.refresh(); },
      },
      overs: {
        typeOver: (i) => { this.setup = { ...this.setup, at: Number(i) }; this.view?.refresh(); },
        orderOver: (i) => { this.at = Number(i); this.view?.refresh(); },
        ...this.crew.overs(),
      },
    });
    const kb = this.input.keyboard;
    const seen = new WeakSet<KeyboardEvent>(); // Phaser can hand the same press over again within a frame
    const raw = (e: KeyboardEvent): void => {
      if (seen.has(e)) return;
      seen.add(e);
      if (this.leaving) return;
      if (this.screen === 'founding') return;
      if (e.code === 'KeyO' && (this.screen === 'hq' || this.screen === 'map' || this.screen === 'crew')) return this.openFounding();
      if (this.screen === 'ledger') {
        if (e.code in TAB_KEYS) this.tab(TAB_KEYS[e.code]!);
        else if (e.code === 'KeyL') this.closeLedger();
        return;
      }
      if (e.code === 'KeyL' && (this.screen === 'map' || this.screen === 'hq' || this.screen === 'crew') && this.block()?.opened) return this.openLedger();
      if (this.screen === 'map') {
        if (e.code in TAB_KEYS) this.tab(TAB_KEYS[e.code]!);
        else if (e.code === 'KeyT') this.nextTarget();
        else if (e.code === 'KeyV') { this.garage = !this.garage; this.view?.refresh(); }
        else if (e.code === 'BracketLeft') this.turnPage(-1);
        else if (e.code === 'BracketRight') this.turnPage(1);
        return;
      }
      if (this.screen === 'card') {
        if (e.code === 'KeyB') this.bring();
        return;
      }
      if (this.screen === 'base') {
        if (this.hq.raw(e.code)) return void (this.ate = MOVE_LETTERS.has(e.code));
        if (e.code in TAB_KEYS) this.tab(TAB_KEYS[e.code]!);
        return;
      }
      if (this.screen !== 'hq' && this.screen !== 'crew') return;
      if (this.crew.raw(e.code)) return;
      // D5: B opens the HQ menu (mockup 6) from the HQ.
      if (this.screen === 'hq' && e.code === 'KeyB') return void (this.hq.open(), this.view?.refresh());
      if (e.code in TAB_KEYS) this.tab(TAB_KEYS[e.code]!);
      else if (e.code === 'KeyN') this.step({ t: 'toNight' });
      else if (e.code === 'KeyE') this.step({ t: 'endDay' });
    };
    kb?.on('keydown', raw);
    // After `raw`, so a letter the HQ menu took (A, S) is not also read as a move.
    onInputAction(this, (a) => this.key(a));
    // L is the Ledger on the HQ, the map and the Crew File (D6) and Money on the HQ menu (D5, mockup 6), so it doesn't
    // open the game's interaction log there (Shift+L still does).
    setLogKeyTaken(() => this.scene.isActive() && (this.screen === 'base' || (!!this.block()?.opened && ['hq', 'map', 'crew', 'ledger'].includes(this.screen))));
    this.events.once('shutdown', () => {
      kb?.off('keydown', raw);
      setLogKeyTaken(null);
      window.removeEventListener('keydown', this.typeKey, true);
      if (kb) kb.enabled = true;
    });
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
        return titleView({ at: this.titleAt, started: !!b, cont: b ? `${b.teamName ?? 'Unnamed Crew'} · Kanto · Day ${b.day}` : null, colours: b ? teamColours(b) : null });
      case 'founding':
        return this.founding ? foundingView(this.founding) : '';
      case 'founded': {
        const c = b ? teamColours(b) : null;
        const m = b?.members[0];
        return b && c && m ? foundedView(foundedLines(b), this.foundedShown, c, b.team!.name, { look: m.look, name: m.name }) : '';
      }
      case 'setup':
        return setupView(this.setup, this.files!);
      case 'opening':
        return openingView(b ? openingLines(b) : [], this.shown, this.memberLook());
      case 'hq':
        if (b && this.crew.owns()) return this.crew.render(this.notice);
        return b ? hqView(hqModel(b), this.notice, this.at, this.memberLook()) : '';
      case 'map':
        return b && this.cursor ? mapView(mapModel(b, services().session.run!, this.cursor), this.notice, this.garage) : '';
      case 'card': {
        const c = b && this.cursor ? this.cardOf() : null;
        if (!b || !c) return '';
        const sp = c.battle?.species ? services().session.content.species.get(c.battle.species) : undefined;
        const file = sp ? rxFileOf(this.manifest, pokemonAssetIds(sp.assets).front)?.file ?? null : null;
        return cardView(c, file, b.teamName?.[0]?.toUpperCase() ?? '');
      }
      case 'crew':
        return this.crew.render(this.notice);
      case 'ledger':
        return b ? ledgerView(ledgerModel(b, services().session.run!, this.spread), this.notice) : '';
      case 'base':
        return this.hq.render(this.notice);
    }
  }

  // ---------- D6: the Empire Ledger (mockup 7) ----------

  private openLedger(): void {
    if (this.screen !== 'ledger') this.ledgerFrom = this.screen === 'card' ? 'map' : this.screen;
    this.screen = 'ledger';
    this.notice = null;
    this.garage = false;
    this.view?.refresh();
  }
  private closeLedger(): void {
    this.screen = this.ledgerFrom;
    if (this.screen === 'map' && !this.cursor) this.cursor = newCursor(this.block()!);
    this.view?.refresh();
  }
  private turnLedger(d: number): void {
    this.spread = (this.spread + d + SPREADS) % SPREADS;
    this.view?.refresh();
  }

  // ---------- D7: the Founding (Part 9 A15) ----------

  private openFounding(): void {
    const b = this.block();
    if (!b?.opened || this.screen === 'founding') return;
    if (!foundingOpen(b)) {
      this.notice = b.team ? null : DOMINION_DATA.founding.lines.notYet;
      return void this.view?.refresh();
    }
    const { session } = services();
    const lead = session.run?.party[0];
    const ace = lead ? session.content.species.get(lead.speciesId)?.name ?? null : null;
    const m = b.members[0];
    this.foundingFrom = this.screen === 'founded' || this.screen === 'ledger' || this.screen === 'card' ? 'hq' : this.screen;
    this.founding = {
      d: this.founding?.d ?? newDraft(b, ace), row: 0, typing: null, ideas: nameIdeas(b, ace), problem: null,
      member: { look: m?.look ?? DOMINION_DATA.start.members.grunt.look, name: m?.name ?? 'Rook' },
    };
    this.notice = null;
    this.screen = 'founding';
    this.view?.refresh();
  }

  private closeFounding(): void {
    this.screen = this.foundingFrom;
    if (this.screen === 'map' && !this.cursor) this.cursor = newCursor(this.block()!);
    this.notice = DOMINION_DATA.founding.lines.later;
    this.view?.refresh();
  }

  private pickColour(which: 'primary' | 'secondary', id: string): void {
    const f = this.founding;
    if (!f) return;
    const other = which === 'primary' ? f.d.secondary : f.d.primary;
    if (id !== other) f.d = { ...f.d, [which]: id };
    f.problem = null;
    this.view?.refresh();
  }

  /** ◀ ▶ on a row: the next name idea, colour, letter, mark, motto idea or Goal. */
  private cycle(dir: number): void {
    const f = this.founding;
    if (!f) return;
    const F = DOMINION_DATA.founding;
    const next = <T,>(list: readonly T[], now: T): T => list[(Math.max(0, list.indexOf(now)) + dir + list.length) % list.length]!;
    const r = FOUNDING_ROWS[f.row];
    const d = f.d;
    if (r === 'name') {
      const at = f.ideas.indexOf(d.name);
      const name = f.ideas[((at < 0 ? (dir > 0 ? -1 : 0) : at) + dir + f.ideas.length) % f.ideas.length]!;
      f.d = { ...d, name, initial: initialOf(name) || d.initial };
    } else if (r === 'primary' || r === 'secondary') {
      const ids = F.colours.map((c) => c.id).filter((id) => id !== (r === 'primary' ? d.secondary : d.primary));
      f.d = { ...d, [r]: next(ids, d[r]) };
    } else if (r === 'initial') f.d = { ...d, initial: next('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), d.initial) };
    else if (r === 'logo') f.d = { ...d, logo: next(F.logos.map((l) => l.id), d.logo) };
    else if (r === 'motto') {
      const goal = d.goal ? F.goals.find((g) => g.id === d.goal)?.quote : undefined;
      const ideas = [...F.motto.ideas, ...(goal && goal.length <= F.motto.max ? [goal] : [])];
      f.d = { ...d, motto: next(ideas, d.motto) };
    } else if (r === 'goal') f.d = { ...d, goal: next([null, ...F.goals.map((g) => g.id)], d.goal) };
    f.problem = null;
  }

  private foundingKey(a: InputAction): void {
    const f = this.founding;
    if (!f || f.typing) return;
    const r = FOUNDING_ROWS[f.row];
    if (a === 'back') return this.closeFounding();
    if (a === 'up' || a === 'down') f.row = (f.row + (a === 'up' ? -1 : 1) + FOUNDING_ROWS.length) % FOUNDING_ROWS.length;
    else if (a === 'left' || a === 'right') this.cycle(a === 'left' ? -1 : 1);
    else if (a === 'confirm') {
      if (r === 'name' || r === 'motto') this.startTyping(r);
      else if (r === 'found') return this.submitFounding();
      else f.row += 1;
    }
    this.view?.refresh();
  }

  /**
   * Typing into the Name or Motto field. Phaser hands over a frame's key presses in one batch, so while typing the
   * scene's keyboard is switched off and the page listens to the window directly: every press lands once, in order.
   * The press that ends the typing never reaches the game actions (the keyboard comes back after that frame).
   */
  private startTyping(field: 'name' | 'motto'): void {
    const f = this.founding;
    if (!f || f.typing) return;
    f.typing = field;
    if (this.input.keyboard) this.input.keyboard.enabled = false;
    window.addEventListener('keydown', this.typeKey, true);
  }

  private endTyping(): void {
    const f = this.founding;
    if (f) f.typing = null;
    window.removeEventListener('keydown', this.typeKey, true);
    this.game.events.once(Phaser.Core.Events.POST_STEP, () => {
      if (this.input?.keyboard && !this.founding?.typing) this.input.keyboard.enabled = true;
    });
  }

  private readonly typeKey = (e: KeyboardEvent): void => {
    const f = this.founding;
    if (!f?.typing || this.screen !== 'founding') return this.endTyping();
    const F = DOMINION_DATA.founding;
    const field = f.typing;
    const max = field === 'name' ? F.name.max : F.motto.max;
    let text = field === 'name' ? f.d.name : f.d.motto;
    if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Escape') this.endTyping();
    else if (e.code === 'Backspace') text = text.slice(0, -1);
    else if (e.key.length === 1 && /[A-Za-z0-9 '\-.,!?]/.test(e.key) && text.length < max) text += e.key;
    else return;
    e.preventDefault();
    if (field === 'name') f.d = { ...f.d, name: text, initial: initialOf(text) || f.d.initial };
    else f.d = { ...f.d, motto: text };
    f.problem = null;
    this.view?.refresh();
  };

  private submitFounding(): void {
    const f = this.founding;
    if (!f) return;
    if (f.typing) this.endTyping();
    const out = services().session.dominionStep({ t: 'found', team: f.d });
    if (!out.ok) {
      f.problem = out.notice;
      return void this.view?.refresh();
    }
    this.founding = null;
    this.notice = out.notice;
    this.foundedShown = 1;
    this.screen = 'founded';
    this.view?.refresh();
  }

  private key(a: InputAction): void {
    if (this.ate) return void (this.ate = false);
    if (this.leaving) return;
    if (this.screen === 'founding') return this.foundingKey(a);
    if (this.crew.key(a)) return void this.view?.refresh();
    if (this.screen === 'ledger') {
      if (a === 'back') return this.closeLedger();
      if (a === 'left' || a === 'right') return this.turnLedger(a === 'left' ? -1 : 1);
      return;
    }
    if (this.hq.key(a)) return void this.view?.refresh();
    if (a === 'back') return this.back();
    if (a === 'confirm') return this.confirm();
    if (this.screen === 'title' && (a === 'up' || a === 'down')) this.titleAt = this.titleAt ? 0 : 1;
    else if (this.screen === 'setup') this.setupMove(a);
    else if (this.screen === 'map') this.mapMove(a);
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
    } else if (this.screen === 'founded') {
      const b2 = this.block();
      if (b2 && this.foundedShown < foundedLines(b2).length) this.foundedShown += 1;
      else this.screen = 'hq';
    } else if (this.screen === 'opening') {
      const lines = b ? openingLines(b) : [];
      if (this.shown < lines.length) this.shown += 1;
      else {
        services().session.dominionStep({ t: 'open' });
        this.screen = 'hq';
      }
    } else if (this.screen === 'map' && this.cursor) {
      if (this.notice) this.notice = null;
      else if (this.cursor.focus === 'map') this.cursor = { ...this.cursor, focus: 'grid' };
      else return this.openCard();
    } else if (this.screen === 'card') {
      return this.doIt();
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
    // D2: Looker or a raid at the door is fought before the day starts.
    if (b.phase === 'morning' && b.field.fight && !b.field.fight.begun) return this.fight('hq');
    const by: Record<string, DominionAction> = { evening: { t: 'toNight' }, night: { t: b.nightActions < 1 ? 'skipNight' : 'rest' }, morning: { t: 'toDay' }, day: { t: 'endDay' } };
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
  /** D5: Hire Grunt and Manage Team on the HQ menu open the Crew File (with the hire list for Hire Grunt). */
  openCrew(hire: boolean): void {
    this.screen = 'hq';
    this.crew.tab(2);
    if (hire) this.crew.raw('KeyH');
    this.view?.refresh();
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
    if (this.screen !== 'hq' && this.screen !== 'map' && this.screen !== 'crew' && this.screen !== 'ledger' && this.screen !== 'base') return;
    if (i === 5) return this.openLedger();
    if (this.screen === 'ledger') this.screen = 'hq';
    if (this.screen === 'base' && i === 0) {
      this.screen = 'hq';
      this.notice = null;
      return void this.view?.refresh();
    }
    if (this.screen === 'base' && i === 2) this.screen = 'hq';
    if (this.crew.tab(i)) return void this.view?.refresh();
    const b = this.block();
    this.notice = null;
    this.garage = false;
    if (i === 0) this.screen = 'hq';
    else if (i === 1 && b) {
      this.screen = 'map';
      this.cursor = this.cursor ?? newCursor(b);
      this.cursor = { ...this.cursor, page: pageFor(b), at: 0 };
    } else this.notice = DOMINION_DATA.start.lockedTab;
    this.view?.refresh();
  }

  // ---------- D2: the Region Map and the Card ----------

  private cardOf() {
    const b = this.block(), c = this.cursor;
    if (!b || !c) return null;
    const id = gridPages(b)[c.page]?.[c.at];
    const d = DOMINION_DATA.field.districts.find((x) => x.id === c.district);
    if (!id || !d) return null;
    return cardModel(b, services().session.run!, id, d.targets[c.target]?.id ?? null, d.id, c.bring);
  }

  private pickDistrict(id: string): void {
    if (!this.cursor) return;
    const same = this.cursor.district === id;
    this.cursor = { ...this.cursor, district: id, target: same ? this.cursor.target : 0, focus: same ? 'grid' : 'map' };
    this.view?.refresh();
  }

  /** Arrows on the map: to the nearest district that way; on the grid: round the 3x3. */
  private mapMove(a: InputAction): void {
    const c = this.cursor;
    if (!c) return;
    if (c.focus === 'grid') {
      const n = gridPages(this.block()!)[c.page]?.length ?? 9;
      const d = a === 'left' ? -1 : a === 'right' ? 1 : a === 'up' ? -3 : a === 'down' ? 3 : 0;
      this.cursor = { ...c, at: Math.max(0, Math.min(n - 1, c.at + d)) };
      return;
    }
    const all = DOMINION_DATA.field.districts;
    const here = all.find((x) => x.id === c.district)!;
    const [dx, dy] = a === 'left' ? [-1, 0] : a === 'right' ? [1, 0] : a === 'up' ? [0, -1] : a === 'down' ? [0, 1] : [0, 0];
    let best: { id: string; score: number } | null = null;
    for (const o of all) {
      if (o.id === here.id) continue;
      const vx = o.x - here.x, vy = o.y - here.y;
      const along = vx * dx + vy * dy;
      if (along <= 0) continue;
      const score = along + 2 * Math.abs(vx * dy + vy * dx);
      if (!best || score < best.score) best = { id: o.id, score };
    }
    if (best) this.cursor = { ...c, district: best.id, target: 0 };
  }

  private nextTarget(): void {
    const c = this.cursor;
    const d = c ? DOMINION_DATA.field.districts.find((x) => x.id === c.district) : undefined;
    if (!c || !d) return;
    this.cursor = { ...c, target: (c.target + 1) % d.targets.length };
    this.view?.refresh();
  }

  private turnPage(dir: number): void {
    const b = this.block(), c = this.cursor;
    if (!b || !c) return;
    const n = gridPages(b).length;
    this.cursor = { ...c, page: (c.page + dir + n) % n, at: 0, focus: 'grid' };
    this.view?.refresh();
  }

  private openCard(): void {
    if (!this.cursor || !this.cardOf()) return;
    this.notice = null;
    this.garage = false;
    this.screen = 'card';
    this.view?.refresh();
  }

  /** Bring crew (up to two): none, then each member in turn. D3 adds more members. */
  private bring(): void {
    const b = this.block(), c = this.cursor;
    if (!b || !c) return;
    const ids = b.members.map((m) => m.id);
    const now = c.bring[0];
    const i = now ? ids.indexOf(now) : -1;
    this.cursor = { ...c, bring: i + 1 < ids.length ? [ids[i + 1]!] : [] };
    this.view?.refresh();
  }

  private doIt(): void {
    const b = this.block(), c = this.cursor, card = this.cardOf();
    if (!b || !c || !card) return;
    if (card.blocked) return this.view?.refresh();
    const id = gridPages(b)[c.page]![c.at]!;
    const d = DOMINION_DATA.field.districts.find((x) => x.id === c.district)!;
    const out = services().session.dominionStep({ t: 'act', action: id, target: d.targets[c.target]?.id ?? null, district: d.id, bring: c.bring });
    this.screen = 'map';
    this.notice = out.notice;
    if (out.ok && out.fight) return this.fight('map');
    this.view?.refresh();
  }

  /** Starts the battle the block waits on; the scene comes back to `from` afterwards. */
  private fight(from: Screen): void {
    resume = from;
    if (services().session.dominionFight()) {
      this.leaving = true;
      this.scene.start('Battle');
      return;
    }
    resume = null;
    this.notice = 'Nobody can fight: rest first.';
    this.view?.refresh();
  }

  private buy(id: string): void {
    const out = services().session.dominionStep({ t: 'buy', vehicle: id });
    this.notice = out.notice;
    this.view?.refresh();
  }

  private back(): void {
    if (this.screen === 'founded') {
      this.screen = 'hq';
      return this.view?.refresh();
    }
    if (this.screen === 'setup') {
      const i = SETUP_PAGES.indexOf(this.setup.page);
      if (i > 0) this.setup = { ...this.setup, page: SETUP_PAGES[i - 1]!, problem: null };
      else this.screen = 'title';
      return this.view?.refresh();
    }
    if (this.screen === 'card') {
      this.screen = 'map';
      return this.view?.refresh();
    }
    if (this.screen === 'map') {
      if (this.notice || this.garage) {
        this.notice = null;
        this.garage = false;
      } else if (this.cursor?.focus === 'grid') this.cursor = { ...this.cursor, focus: 'map' };
      else this.screen = 'hq';
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

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
import { districtModel, districtOrder } from '../core/dominion/districtScreen';
import { districtView } from '../ui/redux/screens/dominion/district';
import { ChairController } from './dominion/chairController';
import { ReserveController } from './dominion/reserveController';
import { typeBoxOpen } from '../ui/typeBox';
import { DeskController } from './dominion/deskController';
import { waiting as deskWaiting, deskOpen } from '../core/dominion/desk';
import { SquadController } from './dominion/squadController';
import { HqController } from './dominion/hqController';
import { RivalController } from './dominion/rivalController';
import { SpyController } from './dominion/spyController';
import { TakeoverController } from './dominion/takeoverController';
import { DebateController } from './dominion/debateController';
import { PoliceController } from './dominion/policeController';
import { SnatchController } from './dominion/snatchController';
import { VoicesController } from './dominion/voicesController';
import { NavController, type Here } from './dominion/navController';
import { PAD_WHEEL_EVENT } from '../ui/gamepad';
import { jumpable, OPENS, type PageId } from '../core/dominion/nav';
import { paperNote } from '../core/dominion/voices';
import { threatRow } from '../core/dominion/rivalScreens';
import { cardModel, gridPages, mapModel, newCursor, pageFor, type MapCursor } from '../core/dominion/fieldScreens';
import { cardView, mapView } from '../ui/redux/screens/dominion/fieldViews';
import { ledgerModel, SPREADS } from '../core/dominion/ledgerScreens';
import { ledgerView } from '../ui/redux/screens/dominion/ledger';
import { meetModel } from '../core/dominion/town';
import { foundedLines, foundingOpen, initialOf, nameIdeas, newDraft, teamColours } from '../core/dominion/founding';
import { FOUNDING_ROWS, foundedView, foundingView, type FoundingUi } from '../ui/redux/screens/dominion/founding';
import { heroModel, interruptModel } from '../core/dominion/heroScreens';
import { heroView, interruptView, type MonFiles } from '../ui/redux/screens/dominion/heroViews';
import { BossMenuController, SETTINGS_CATS } from './dominion/bossMenuController';
import { fxClasses, fxOf } from '../core/dominion/fx';
import { JobController } from './dominion/jobController';

type Screen = 'title' | 'setup' | 'opening' | 'hq' | 'map' | 'card' | 'crew' | 'reserve' | 'pyramid' | 'base' | 'rival' | 'ledger' | 'hero' | 'interrupt' | 'desk' | 'squads' | 'founding' | 'founded' | 'debate' | 'spy' | 'takeover' | 'broadcast' | 'assign' | 'district';

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
  /** D29: where the Card was opened from (the map's grid or the District file page): Esc and the act go back there. */
  private cardFrom: 'map' | 'district' = 'map';
  private manifest: AssetManifest | undefined;
  /** D3: the Morning (mockup 2) and the Crew File (mockup 5). */
  private crew = new CrewController(this);
  /** D12: the Chair (mockups c1-c3), open in the Evening before the Night. */
  private chair = new ChairController(this);
  /** D6: the Ledger's open spread (0 Money | Empire, 1 Territory | Notoriety, 2 Crew | Stores) and where L goes back to. */
  private spread = 0;
  private ledgerFrom: Screen = 'hq';
  /** D6b: the picked answer of a street meeting on the map. */
  private meetAt = 0;
  /** D7: the Founding page's draft and cursor, where Esc goes back to, and the scene's lines shown. */
  private founding: FoundingUi | null = null;
  private foundingFrom: Screen = 'hq';
  private foundedShown = 1;
  private res = new ReserveController(this);
  /** D5: the HQ menu (mockup 6). */
  private hq = new HqController(this);
  /** D11: where the Hero's file (H) goes back to, and the m11 choice under the cursor. */
  private heroFrom: Screen = 'hq';
  private intAt = 0;
  /** D9: the Rival File (key R). */
  private rival = new RivalController(this);
  /** D22: Confront, the spy on the crew (F on the Crew File). */
  private spy = new SpyController(this);
  /** D14: the Takeover page (key K), its Holdings, and the hijacked broadcast. */
  private tk = new TakeoverController(this);
  /** D13: the Debate (mockup 8). */
  private debate = new DebateController(this);
  /** D24: police questioning (owns the screen while a case is open or its release page unread). */
  private police = new PoliceController(this);
  /** D23: the Holding Cell's questioning (owns the screen while a captive is in the room). */
  private snatch = new SnatchController(this);
  /** D21: the applications desk (Rotom mockup k5). */
  private desk = new DeskController(this);
  /** D8: the Squads page (mockup 13, U on the Crew File). */
  private sq = new SquadController(this, this);
  /** D25: the Evening voices scene (mockup a10), an overlay on the HQ. */
  /** D27: the Boss Menu (v4 m1, Esc from the HQ) and Settings (m2). */
  private menu = new BossMenuController(this.menuHost());
  /** D28: the hold-Q command wheel, the Boss's board and the shutter between pages. */
  private nav = new NavController(this.navHost());
  // D30: the job moments after Do it (m8-m10) and the morning paper (m12).
  private job = new JobController({
    refresh: () => this.view?.refresh(),
    later: (ms, fn) => void this.time.delayedCall(ms, fn),
    fight: () => this.fight('map'),
    interrupt: () => { this.screen = 'interrupt'; this.intAt = 0; this.view?.refresh(); },
    toMap: (next, notice) => this.afterJob(next, notice),
    onMorningHq: () => this.screen === 'hq' && !this.police.owns() && !this.voices.on,
  });
  private voices = new VoicesController({ refresh: () => this.view?.refresh(), onHq: () => this.screen === 'hq' && !this.crew.owns() && !this.police.owns() && !this.snatch?.owns() && !this.block()?.crew?.talks.length });

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
    this.chair = new ChairController(this);
    this.founding = null;
    this.foundedShown = 1;
    this.hq = new HqController(this);
    this.res = new ReserveController(this);
    this.rival = new RivalController(this);
    this.tk = new TakeoverController(this);
    this.debate = new DebateController(this);
    this.police = new PoliceController(this);
    this.snatch = new SnatchController(this);
    this.desk = new DeskController(this);
    this.sq = new SquadController(this, this);
    this.menu = new BossMenuController(this.menuHost());
    this.spy.destroy();
    this.spy = new SpyController(this);
    this.voices.close();
    this.nav = new NavController(this.navHost());
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
      if (this.screen === 'hero' && !blk.hero) this.screen = 'hq';
      if (this.screen === 'broadcast') this.screen = 'hq';
    }
    // D14: back from one fight of a Takeover chain (a Raid, the storm, the League): Enter starts the next.
    const tch = blk?.takeover?.chain, tNext = tch?.sides[tch.step];
    if (tch && tNext && blk?.field.fight?.why === 'takeover' && !blk.field.fight.begun && !this.notice) {
      this.notice = `${DOMINION_DATA.takeover.lines.chainNext!.replace('{n}', String(tch.step + 1)).replace('{of}', String(tch.sides.length)).replace('{name}', tNext.name)} Enter to go on.`;
    }
    if (back === 'takeover') this.tk.resume(null);
    // D14: a town taken plays the hijacked broadcast once.
    this.tk.maybeBroadcast();
    // D10: back from one fight of a chain (a Raid, a Gym's trainers): the map says who's next; Enter starts it.
    const ch = blk?.growth?.chain, nextSide = ch?.sides[ch.step];
    if (ch && nextSide && blk?.field.fight && !blk.field.fight.begun && !this.notice) {
      this.notice = `${DOMINION_DATA.growth.lines.chainNext!.replace('{n}', String(ch.step + 1)).replace('{of}', String(ch.sides.length)).replace('{name}', nextSide.name)} Enter to go on.`;
    }
    // D11: the Hero stepped into a job and the tab closed before a choice (m11 waits).
    if (blk?.opened && this.heroPending()) this.screen = 'interrupt';
    // D27: back from the battle that spent the Day's last action: the Day ends by itself when the setting says so.
    else if (back && blk?.opened && !ch) this.autoEnd();
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
        ...this.job.acts(),
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
        dfile: () => this.openDistrict(),
        dfAct: (i) => this.dfPick(Number(i)),
        dfTarget: (i) => { if (this.cursor) this.cursor = { ...this.cursor, target: Number(i) }; this.view?.refresh(); },
        dfPage: (d) => this.turnPage(Number(d)),
        dfCard: () => this.openCard('district'),
        doit: () => this.doIt(),
        back: () => this.back(),
        bring: () => this.bring(),
        opt: (id) => { if (this.cursor) this.cursor = { ...this.cursor, opt: String(id) }; this.view?.refresh(); },
        buy: (id) => this.buy(id),
        townMeet: (i) => this.answerMeet(Number(i)),
        dismiss: () => { this.notice = null; this.rival.dismiss(); this.debate.dismiss(); this.spy.dismiss(); this.tk.dismiss(); this.view?.refresh(); },
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
        heroFile: () => this.openHero(),
        legend: (id) => this.heroAct({ t: 'legend', legend: id }),
        meet: (i) => this.heroAct({ t: 'meet', choice: Number(i) }),
        after: (how) => this.heroAct({ t: 'after', how: how === 'recruit' ? 'recruit' : 'leave' }),
        interrupt: (i) => this.interrupt(Number(i)),
        ...this.crew.acts(),
        ...this.chair.acts(),
        ...this.res.acts(),
        ...this.hq.acts(),
        ...this.rival.acts(),
        ...this.spy.acts(),
        ...this.tk.acts(),
        takeover: () => { if (this.tk.open(this.screen)) this.view?.refresh(); },
        ...this.debate.acts(),
        ...this.police.acts(),
        ...this.snatch.acts(),
        ...this.voices.acts(),
        base: () => { this.hq.open(); this.view?.refresh(); },
        ...this.desk.acts(),
        desk: () => this.desk.open(),
        ...this.sq.acts(),
        ...this.nav.acts(),
        ...this.menu.acts(),
      },
      overs: {
        typeOver: (i) => { this.setup = { ...this.setup, at: Number(i) }; this.view?.refresh(); },
        orderOver: (i) => { this.at = Number(i); this.view?.refresh(); },
        ...this.crew.overs(),
        ...this.chair.overs(),
        ...this.res.overs(),
        ...this.rival.overs(),
        ...this.spy.overs(),
        ...this.tk.overs(),
        ...this.desk.overs(),
        ...this.sq.overs(),
        ...this.nav.overs(),
        ...this.menu.overs(),
      },
    });
    const kb = this.input.keyboard;
    const seen = new WeakSet<KeyboardEvent>(); // Phaser can hand the same press over again within a frame
    const raw = (e: KeyboardEvent): void => {
      if (seen.has(e)) return;
      seen.add(e);
      if (this.leaving) return;
      // D22: the Confront room's text box keeps its own keys; a letter pressed elsewhere on it starts a typed line.
      if ((e.target as HTMLElement | null)?.matches?.('[data-testid="dom-spy-type"]')) return;
      if (this.screen === 'spy') return void (this.spy.raw(e) && (this.ate = MOVE_LETTERS.has(e.code)));
      // Round 4 (D26): End saves and quits to the title from any Dominion page (not mid-interrupt: the Hero's three
      // choices must be answered first; not while typing in the desk's Type box). Q stays free on every page for the hold-Q command wheel (D28): no screen reads it.
      if (e.code === 'End' && this.screen !== 'interrupt' && !typeBoxOpen()) return this.leave();
      // D28: hold Q for the command wheel; while the wheel or the board is up it reads every key first.
      const wheelUp = this.nav.wheel;
      if (this.nav.raw(e)) return void (this.ate = wheelUp && (e.code === 'Backspace' || e.code === 'KeyX'));
      // D27: the Boss Menu and Settings read their letters and numbers first (S, R, D, 1-6); a move letter they take isn't also a move.
      if (this.menu.owns()) {
        if (this.menu.raw(e.code)) {
          if (e.code === 'Tab') e.preventDefault();
          this.ate = MOVE_LETTERS.has(e.code);
        }
        return;
      }
      // D24: the interview room and the release page read their keys first (typing included).
      // D30: a job moment or the morning paper keeps every key while it is up (N is Next action on a result page).
      if (this.inRun() && this.job.raw(e.code)) return;
      if (this.inRun() && this.police.raw(e)) return;
      // D23: the questioning room reads its keys next (typing included).
      if (this.inRun() && this.snatch.raw(e)) return;
      if (this.screen === 'founding') return;
      if (this.debate.raw(e.code, e)) return;
      // D12: while the Chair sits, O is its settings, not the Founding.
      if (e.code === 'KeyO' && (this.screen === 'hq' || this.screen === 'map' || this.screen === 'crew') && !this.chair.owns()) return this.openFounding();
      if (this.screen === 'desk') {
        this.desk.raw(e);
        return;
      }
      if (this.voices.raw(e.code)) return void (this.ate = MOVE_LETTERS.has(e.code));
      if (this.tk.raw(e.code)) return;
      // D14: K opens the Takeover page from the HQ, the map and the Ledger.
      if (e.code === 'KeyK' && (this.screen === 'hq' || this.screen === 'map' || this.screen === 'ledger')) return void (this.tk.open(this.screen) && this.view?.refresh());
      if (this.heroRaw(e.code)) return;
      if (this.screen === 'ledger') {
        if (e.code in TAB_KEYS) this.tab(TAB_KEYS[e.code]!);
        else if (e.code === 'KeyL') this.closeLedger();
        return;
      }
      if (e.code === 'KeyL' && (this.screen === 'map' || this.screen === 'hq' || this.screen === 'crew') && this.block()?.opened) return this.openLedger();
      if (this.screen === 'district') return this.districtRaw(e.code);
      if (this.screen === 'assign') {
        if (this.crew.raw(e.code)) return;
        if (e.code in TAB_KEYS) this.tab(TAB_KEYS[e.code]!);
        return;
      }
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
      if (this.screen === 'rival') {
        if (this.rival.raw(e.code)) return;
        if (e.code in TAB_KEYS) this.tab(TAB_KEYS[e.code]!);
        return;
      }
      if (this.screen !== 'hq' && this.screen !== 'crew' && this.screen !== 'reserve' && this.screen !== 'pyramid' && this.screen !== 'squads') return;
      if (this.chair.raw(e.code)) return;
      // D8: the Squads page reads its letters first. WASD stay moves; X (break up) is not also Back.
      if (this.sq.raw(e.code)) {
        if (e.code === 'Tab') e.preventDefault();
        return void (this.ate = e.code === 'KeyX');
      }
      // D4: the Reserve and the Pyramid read their letters first; a move letter they use (W, A, S, D, X) isn't also a move.
      if (this.res.raw(e.code)) {
        if (e.code === 'Tab') e.preventDefault();
        return void (this.ate = MOVE_LETTERS.has(e.code));
      }
      if (this.crew.raw(e.code)) return;
      // D9: R opens the Rival File from the HQ and the Morning (on the Crew File R is the leads list).
      if (this.screen === 'hq' && e.code === 'KeyR' && !this.block()?.crew?.talks.length) return void (this.rival.open() && this.view?.refresh());
      // D5: B opens the HQ menu (mockup 6) from the HQ.
      if (this.screen === 'hq' && e.code === 'KeyB') return void (this.hq.open(), this.view?.refresh());
      if (e.code === 'KeyI') this.desk.open();
      else if (e.code in TAB_KEYS) this.tab(TAB_KEYS[e.code]!);
      else if (e.code === 'KeyN') this.step({ t: 'toNight' });
      else if (e.code === 'KeyE') this.step({ t: 'endDay' });
    };
    kb?.on('keydown', raw);
    const up = (e: KeyboardEvent): void => this.nav.up(e);
    kb?.on('keyup', up);
    // D28: a controller's Select held is the hold-Q of the pad.
    const pad = (e: Event): void => { if (!this.leaving && this.scene.isActive()) this.nav.pad(!!(e as CustomEvent<boolean>).detail); };
    window.addEventListener(PAD_WHEEL_EVENT, pad);
    // After `raw`, so a letter the HQ menu took (A, S) is not also read as a move.
    onInputAction(this, (a) => this.key(a), { onceEach: true });
    // L is the Ledger on the HQ, the map and the Crew File (D6) and Money on the HQ menu (D5, mockup 6), so it doesn't
    // open the game's interaction log there; the Confront room's text box keeps L (D22) (Shift+L still does).
    setLogKeyTaken(() => this.scene.isActive() && (this.screen === 'base' || this.screen === 'spy' || (!!this.block()?.opened && ['hq', 'map', 'crew', 'ledger', 'hero'].includes(this.screen))));
    // D21: the desk hears every key first, so A and D stamp there instead of moving (the game's key map has them as ◀ ▶).
    const note = (e: KeyboardEvent): void => this.desk.note(e);
    window.addEventListener('keydown', note, true);
    this.events.once('shutdown', () => {
      kb?.off('keydown', raw);
      kb?.off('keyup', up);
      window.removeEventListener(PAD_WHEEL_EVENT, pad);
      setLogKeyTaken(null);
      window.removeEventListener('keydown', this.typeKey, true);
      if (kb) kb.enabled = true;
      window.removeEventListener('keydown', note, true);
      this.desk.shutdown();
      this.spy.destroy();
      this.police.shutdown();
      this.debate.shutdown();
      this.snatch.shutdown();
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

  /** Past the title, the setup and the opening: a run page (where a police case can take over). */
  private inRun(): boolean {
    return this.screen !== 'title' && this.screen !== 'setup' && this.screen !== 'opening';
  }

  /** D27: what the Boss Menu controller may reach. */
  private menuHost() {
    const sc = this;
    return {
      refresh: () => sc.view?.refresh(),
      tabTo: (i: number) => { sc.screen = 'hq'; sc.notice = null; sc.tab(i); },
      hide: () => sc.leave(),
      openBoard: () => sc.nav.openBoard(),
      bossFile: () => sc.files?.boss.file ?? null,
    };
  }

  /** D27: every page wears the Effects & motion classes (fx.css turns the spectacle down; presentation only). */
  private render(): string {
    const fx = fxOf(services().session.settings);
    const page = this.nav.boardOn() && this.navHere() ? this.nav.wrap(this.nav.boardRender(), 'board', fx.level) : this.nav.wrap(this.renderPage(), this.navHere() as Here, fx.level);
    return `<div class="domfx ${fxClasses(fx)}">${page}</div>`;
  }

  private renderPage(): string {
    if (this.menu.owns()) return this.menu.render();
    const b = this.block();
    if (b && this.inRun() && this.job.owns()) return this.job.render();
    if (b && this.inRun() && this.police.owns()) return this.police.render();
    if (b && this.inRun() && this.snatch.owns()) return this.snatch.render();
    if (b && this.inRun() && this.job.paperOwns()) return this.job.renderPaper();
    if (this.voices.on && this.screen === 'hq') return this.voices.render();
    // D13: a Debate on the table takes the screen (after the Debate action, a card answered, or a reload).
    if (b?.debate?.live && (this.screen === 'hq' || this.screen === 'map' || this.screen === 'card' || this.screen === 'rival' || this.screen === 'crew' || this.screen === 'reserve' || this.screen === 'pyramid' || this.screen === 'ledger' || this.screen === 'base')) this.debate.claim();
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
        if (b && this.chair.owns()) return this.chair.render(this.notice);
        if (b && this.crew.owns()) return this.crew.render(this.notice);
        return b ? hqView(hqModel(b), this.notice, this.at, this.memberLook(), threatRow(b), deskOpen(b) ? deskWaiting(b) : null, paperNote(b)) : '';
      case 'map':
        return b && this.cursor ? mapView(mapModel(b, services().session.run!, this.cursor), this.notice, this.garage, this.meetPanel()) : '';
      case 'card': {
        const c = b && this.cursor ? this.cardOf() : null;
        if (!b || !c) return '';
        const sp = c.battle?.species ? services().session.content.species.get(c.battle.species) : undefined;
        const file = sp ? rxFileOf(this.manifest, pokemonAssetIds(sp.assets).front)?.file ?? null : null;
        return cardView(c, file, b.teamName?.[0]?.toUpperCase() ?? '', services().session.settings.expansion.dominionPrefs.showOdds);
      }
      case 'crew':
      case 'assign':
        return this.crew.render(this.notice);
      case 'district':
        return b && this.cursor ? districtView(districtModel(b, services().session.run!, this.cursor), this.notice) : '';
      case 'ledger':
        return b ? ledgerView(ledgerModel(b, services().session.run!, this.spread), this.notice) : '';
      case 'hero': {
        if (!b?.hero) return '';
        const m = heroModel(b, services().session.run!);
        return heroView(m, this.monFiles(m.legends.map((l) => l.id)), this.notice);
      }
      case 'interrupt': {
        const m = b ? interruptModel(b, services().session.run!.inventory) : null;
        if (!m) return '';
        const lead = services().session.run!.party.find((p) => p.hp > 0) ?? services().session.run!.party[0];
        return interruptView(m, this.memberLook(), lead ? this.monFiles([lead.speciesId])[lead.speciesId] ?? null : null, this.intAt, this.notice);
      }
      case 'reserve':
      case 'pyramid':
        return this.res.render(this.notice);
      case 'squads':
        return this.sq.render(this.notice);
      case 'base':
        return this.hq.render(this.notice);
      case 'rival':
        return this.rival.render();
      case 'spy':
        return this.spy.render();
      case 'takeover':
      case 'broadcast':
        return this.tk.render(this.notice);
      case 'debate':
        return this.debate.render();
      case 'desk':
        return this.desk.render(this.notice);
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
    if (this.nav.key(a)) return;
    if (this.menu.key(a)) return void this.view?.refresh();
    if (this.spy.key(a)) return void this.view?.refresh();
    if (this.debate.key(a)) return void this.view?.refresh();
    if (this.inRun() && this.job.key(a)) return void this.view?.refresh();
    if (this.inRun() && this.police.key(a)) return void this.view?.refresh();
    if (this.inRun() && this.snatch.key(a)) return void this.view?.refresh();
    if (this.screen === 'founding') return this.foundingKey(a);
    if (this.voices.key(a)) return void this.view?.refresh();
    if (this.tk.owns() && this.notice && (a === 'confirm' || a === 'back')) {
      this.notice = null;
      return void this.view?.refresh();
    }
    if (this.tk.key(a)) return void this.view?.refresh();
    if (this.screen === 'interrupt') {
      if (a === 'left' || a === 'up') this.intAt = (this.intAt + 2) % 3;
      else if (a === 'right' || a === 'down') this.intAt = (this.intAt + 1) % 3;
      else if (a === 'confirm') return this.interrupt(this.intAt);
      // Esc never leaves the run from here: the Hero waits for an answer.
      return void this.view?.refresh();
    }
    if (this.screen === 'hero') {
      if (this.notice && (a === 'confirm' || a === 'back')) {
        this.notice = null;
        return void this.view?.refresh();
      }
      if (a === 'back') return this.closeHero();
      if (a === 'confirm') return this.heroCta();
      return;
    }
    if (this.chair.key(a)) return void this.view?.refresh();
    if (this.sq.key(a)) return void this.view?.refresh();
    if (this.res.key(a)) return void this.view?.refresh();
    if (this.rival.key(a)) return void this.view?.refresh();
    if (this.desk.key(a)) return void this.view?.refresh();
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
    else if (this.screen === 'map' && this.meetPanel() && !this.notice && (a === 'up' || a === 'down')) {
      const n = this.meetPanel()!.choices.length;
      this.meetAt = (this.meetAt + (a === 'up' ? -1 : 1) + n) % n;
    } else if (this.screen === 'map') this.mapMove(a);
    else if (this.screen === 'district') this.districtMove(a);
    else if (this.screen === 'card' && (a === 'left' || a === 'right')) this.cycleOpt(a === 'left' ? -1 : 1);
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
      else if (this.titleAt === 1 && b) {
        this.screen = !b.opened ? 'opening' : this.heroPending() ? 'interrupt' : 'hq';
        this.tk.maybeBroadcast(); // D14: a town taken while away is announced first
      }
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
      if (this.chainWaiting()) return this.fight('map');
      if (this.notice) this.notice = null;
      else if (this.meetPanel()) return this.answerMeet(this.meetAt);
      // D29: Enter on the map opens the District file page (round-4 mockup m4); the grid's own Enter still opens the Card.
      else if (this.cursor.focus === 'map') return this.openDistrict();
      else return this.openCard();
    } else if (this.screen === 'district' && this.cursor) {
      if (this.chainWaiting()) return this.fight('map');
      if (this.notice) this.notice = null;
      else return this.openCard('district');
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
    if (this.heroPending()) {
      this.screen = 'interrupt';
      return this.view?.refresh();
    }
    const by: Record<string, DominionAction> = { evening: { t: 'toNight' }, night: { t: b.nightActions < 1 ? 'skipNight' : 'rest' }, morning: { t: 'toDay' }, day: { t: 'endDay' } };
    this.step(by[b.phase]!);
  }

  // ---------- D28: getting around (the wheel, the board, the shutter) ----------

  private navHost() {
    const scene = (): DominionScene => this; // the scene's clock is set up after the fields
    return {
      get time() { return scene().time; },
      refresh: () => this.view?.refresh(),
      navBlock: () => this.block() ?? null,
      navHere: () => this.navHere(),
      navFree: () => this.navFree(),
      navJump: (p: PageId) => this.navJump(p),
      setNotice: (n: string | null) => { this.notice = n; },
    };
  }

  /** The page on screen, as the board and the wheel name it (null before the run opens). */
  private navHere(): PageId | null {
    const b = this.block();
    if (!b?.opened || !this.inRun()) return null;
    if (this.menu.owns()) return this.menu.page!;
    if (this.police.owns()) return 'police';
    switch (this.screen) {
      case 'hq':
        if (this.voices.on) return 'voices';
        if (this.chair.owns()) return 'chair';
        return this.crew.owns() ? 'morning' : 'hq';
      case 'crew': return this.crew.personaOn() ? 'persona' : 'crew';
      case 'founded': return 'founding';
      // D14's hijacked broadcast plays over the Takeover page.
      case 'broadcast': return 'takeover';
      case 'title': case 'setup': case 'opening': return null;
      default: return this.screen;
    }
  }

  /** The wheel and the board stay shut where the game holds you: the Hero stepping in, questioning, a Debate, a
   *  Confront, the Founding form, and while typing (the desk's Type box). */
  private navFree(): boolean {
    const p = this.navHere();
    if (!p || this.leaving || typeBoxOpen()) return false;
    if (this.block()?.debate?.live) return false;
    return !['interrupt', 'police', 'debate', 'spy', 'founding'].includes(p);
  }

  /** D28: go to a page the way its own key would, from wherever you are. */
  private navJump(p: PageId): void {
    const b = this.block();
    if (!b?.opened || !jumpable(p)) return;
    const to = OPENS[p] ?? p;
    if (to === 'title') return this.leave();
    // D27: the Boss Menu and its Settings open over the page you are on (Rotom is a tab of Settings).
    if (to === 'menu') return this.menu.open();
    if (to === 'settings' || to === 'rotom') return this.menu.openSettings(to === 'rotom' ? SETTINGS_CATS.findIndex((c) => c.id === 'rotom') : 0);
    this.menu.close();
    // Leave the page you are on the way its own keys would (overlays and sub-pages closed), from the HQ.
    if (this.voices.on) this.voices.close();
    if (this.screen === 'crew') this.crew.tab(0);
    else if (this.res.owns()) this.res.tab(0);
    else if (this.sq.owns()) this.sq.tab(0);
    this.screen = 'hq';
    this.notice = null;
    this.garage = false;
    switch (to) {
      case 'map': return this.tab(1);
      case 'crew': return this.tab(2);
      case 'reserve': return this.tab(3);
      case 'ledger': return this.openLedger();
      case 'persona': this.tab(2); this.crew.raw('KeyC'); break;
      case 'pyramid': this.tab(2); this.res.raw('KeyP'); break;
      case 'squads': this.tab(2); this.sq.raw('KeyU'); break;
      case 'base': this.hq.open(); break;
      case 'rival':
        if (b.crew?.talks.length) this.notice = 'Answer the crew first.';
        else this.rival.open();
        break;
      case 'hero': return this.openHero();
      case 'desk': return this.desk.open();
      case 'voices': if (!this.voices.raw('KeyV')) this.notice = 'The voices come in the evening, at the HQ.'; break;
      case 'founding': return this.openFounding();
    }
    this.view?.refresh();
  }

  /** D28: the Boss's board (M on the wheel; public so a Controls page can open it too). */
  openBoard(): void {
    this.nav.openBoard();
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
  /** D24: an answer in the interview room, or the release page read (saved). */
  policeStep(action: DominionAction): { ok: boolean; notice: string | null } {
    return services().session.dominionStep(action);
  }
  /** D23: a line, the Goal or the ending in the questioning room (saved). */
  snatchStep(action: DominionAction): { ok: boolean; notice: string | null } {
    return services().session.dominionStep(action);
  }
  /** D23: the room closed; its line shows on the page underneath. */
  roomDone(notice: string | null): void {
    this.notice = notice;
    this.view?.refresh();
  }
  /** D24: the release page is read. */
  toHq(): void {
    this.screen = 'hq';
    this.notice = null;
    this.view?.refresh();
  }
  /** A species' front atlas (the CCTV still, a Pokémon held as evidence). */
  monFile(species: string): string | null {
    const sp = services().session.content.species.get(species);
    return sp ? rxFileOf(this.manifest, pokemonAssetIds(sp.assets).front)?.file ?? null : null;
  }
  /** The Boss's sprite on the release page. */
  bossLook(): string | null {
    return this.files?.boss.file ?? null;
  }
  /** D9: an answer on the Rival File (saved). */
  rivalStep(action: DominionAction): { ok: boolean; fight: boolean; notice: string | null } {
    return services().session.dominionStep(action);
  }
  /** D14: a choice on the Takeover page (saved). */
  takeoverStep(action: DominionAction): { ok: boolean; fight: boolean; notice: string | null } {
    const out = services().session.dominionStep(action);
    if (out.ok && !out.fight) this.tk.maybeBroadcast();
    return out;
  }
  startFightFrom(from: Screen): void {
    this.notice = null;
    this.fight(from);
  }
  monFilesOf(ids: string[]): MonFiles {
    return this.monFiles(ids);
  }

  /** D22: F on the Crew File opens the Confront room. */
  confront(member: string): void {
    this.spy.open(member);
  }

  /** D13: a turn at the Leader's Table (saved). */
  debateStep(action: DominionAction): { ok: boolean; notice: string | null } {
    return services().session.dominionStep(action);
  }
  /** D9: a challenge answered with Fight starts at once; the Rival File's HQ is where it comes back to. */
  startFight(): void {
    this.screen = 'hq';
    this.fight('hq');
  }

  step(action: DominionAction): boolean {
    const out = services().session.dominionStep(action);
    if (out.ok) {
      this.notice = out.notice;
      this.tk.maybeBroadcast();
      if (action.t === 'do') this.autoEnd();
      const n = hqModel(this.block()!).orders.length;
      this.at = Math.min(this.at, Math.max(0, n - 1));
    } else if (out.notice) this.notice = out.notice;
    this.view?.refresh();
    return out.ok;
  }

  private tab(i: number): void {
    if (this.screen === 'rival') this.screen = 'hq';
    if (this.screen !== 'hq' && this.screen !== 'map' && this.screen !== 'crew' && this.screen !== 'assign' && this.screen !== 'reserve' && this.screen !== 'pyramid' && this.screen !== 'ledger' && this.screen !== 'base' && this.screen !== 'squads') return;
    if (this.sq.tab(i)) return void this.view?.refresh();
    if (i === 5) return this.openLedger();
    if (this.screen === 'ledger') this.screen = 'hq';
    if (this.screen === 'base' && i === 0) {
      this.screen = 'hq';
      this.notice = null;
      return void this.view?.refresh();
    }
    if (this.screen === 'base' && i === 2) this.screen = 'hq';
    if (this.res.tab(i)) return void this.view?.refresh();
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
    return cardModel(b, services().session.run!, id, d.targets[c.target]?.id ?? null, d.id, c.bring, c.opt);
  }

  /** D10: Left/Right on the Card picks the next choice (a Gym way, a bribe, a design, a specialist). */
  private cycleOpt(dir: number): void {
    const c = this.cursor, card = this.cardOf();
    if (!c || !card || !card.opts.length) return;
    const i = Math.max(0, card.opts.findIndex((o) => o.id === card.opt));
    this.cursor = { ...c, opt: card.opts[(i + dir + card.opts.length) % card.opts.length]!.id };
  }

  /** D10: a Raid, a Gym's trainers, the Gauntlet: the chain's next fight waits on the map. */
  private chainWaiting(): boolean {
    const f = this.block()?.field.fight;
    return !!f && !f.begun && (f.why === 'growth' || f.why === 'takeover');
  }

  private pickDistrict(id: string): void {
    if (!this.cursor) return;
    const same = this.cursor.district === id;
    this.cursor = { ...this.cursor, district: id, target: same ? this.cursor.target : 0, focus: same ? 'grid' : 'map' };
    this.view?.refresh();
  }

  // ---------- D29: the District file page (round-4 mockup m4) ----------

  /** Opens the District file for the district under the map's cursor, on its first shown action. */
  private openDistrict(): void {
    const b = this.block(), c = this.cursor;
    if (!b || !c || this.meetPanel()) return;
    if (this.chainWaiting()) return this.fight('map');
    const order = districtOrder(b, c.page);
    this.cursor = { ...c, focus: 'grid', at: order.includes(c.at) && c.focus === 'grid' ? c.at : order[0] ?? 0 };
    this.notice = null;
    this.garage = false;
    this.screen = 'district';
    this.view?.refresh();
  }

  /** A click on an action: the first picks it, the second opens its Card. */
  private dfPick(slot: number): void {
    const c = this.cursor;
    if (!c) return;
    if (c.at === slot) return this.openCard('district');
    this.cursor = { ...c, at: slot };
    this.view?.refresh();
  }

  /** Arrows on the District file: the actions sit in columns of three (Money, Muscle, Shadow). */
  private districtMove(a: InputAction): void {
    const b = this.block(), c = this.cursor;
    if (!b || !c) return;
    const order = districtOrder(b, c.page);
    const n = order.length;
    let p = Math.max(0, order.indexOf(c.at));
    if (a === 'up' && p % 3 > 0) p -= 1;
    else if (a === 'down' && p % 3 < 2 && p + 1 < n) p += 1;
    else if (a === 'left' && p >= 3) p -= 3;
    else if (a === 'right' && p + 3 < n) p += 3;
    else if (a === 'right' && Math.floor(p / 3) < Math.floor((n - 1) / 3)) p = n - 1;
    this.cursor = { ...c, at: order[p] ?? c.at };
  }

  /** Letter and number keys on the District file: 1-9 pick an action (again: its Card), T the next target, [ ] the page. */
  private districtRaw(code: string): void {
    const b = this.block(), c = this.cursor;
    if (!b || !c) return;
    const digit = /^(?:Digit|Numpad)([1-9])$/.exec(code);
    if (digit) {
      const slot = districtOrder(b, c.page)[Number(digit[1]) - 1];
      if (slot !== undefined) this.dfPick(slot);
      return;
    }
    if (code === 'KeyT') return this.nextTarget();
    if (code === 'BracketLeft') return this.turnPage(-1);
    if (code === 'BracketRight') return this.turnPage(1);
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
    const page = (c.page + dir + n) % n;
    this.cursor = { ...c, page, at: this.screen === 'district' ? districtOrder(b, page)[0] ?? 0 : 0, focus: 'grid' };
    this.view?.refresh();
  }

  private openCard(from: 'map' | 'district' = this.screen === 'district' ? 'district' : 'map'): void {
    if (!this.cursor || !this.cardOf()) return;
    if (this.chainWaiting()) return this.fight('map');
    this.cardFrom = from;
    this.notice = null;
    this.garage = false;
    this.cursor = { ...this.cursor, opt: null, bring: [] };
    this.screen = 'card';
    this.view?.refresh();
  }

  /** Bring crew: none, then each member in turn. D10: a squad action (Raid: three) adds one more member each press. */
  private bring(): void {
    const b = this.block(), c = this.cursor;
    if (!b || !c) return;
    const ids = b.members.map((m) => m.id);
    const squad = this.cardOf()?.squad ?? 1;
    if (squad > 1) {
      const next = ids.find((id) => !c.bring.includes(id));
      this.cursor = { ...c, bring: next && c.bring.length < squad ? [...c.bring, next] : [] };
      return this.view?.refresh();
    }
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
    const input = { action: id, target: d.targets[c.target]?.id ?? null, district: d.id, bring: c.bring, opt: card.opt };
    const before = structuredClone(b);
    const out = services().session.dominionStep({ t: 'act', ...input });
    this.screen = this.cardFrom;
    this.notice = out.notice;
    // D30: the act is played and saved; the Boss order cut-in and the result page only show it.
    if (out.ok && this.job.start(before, input, out.roll, out.notice, out.fight ? 'fight' : this.heroPending() ? 'hero' : 'result')) {
      this.notice = null;
      return;
    }
    if (out.ok && out.fight) return this.fight('map');
    // D11 (m11): the Hero stepped into the job; the choice comes before any battle.
    if (out.ok && this.heroPending()) {
      this.screen = 'interrupt';
      this.intAt = 0;
    } else if (out.ok) this.autoEnd();
    this.view?.refresh();
  }

  /** D27 (Settings · Dominion "End the day when no actions are left"): the last action spent ends the Day by itself. */
  private autoEnd(): void {
    const b = this.block();
    if (!b || !services().session.settings.expansion.dominionPrefs.autoEndDay) return;
    if (b.phase !== 'day' || b.actions > 0 || (b.field.fight && !b.field.fight.begun) || this.heroPending()) return;
    const was = this.notice;
    const out = services().session.dominionStep({ t: 'endDay' });
    if (out.ok) this.notice = [was, out.notice].filter(Boolean).join(' ');
  }

  /** D30: a result page closed: back to the Map, or (`next`) straight to the Card of the next action on the board. */
  private afterJob(next: boolean, notice: string | null = null): void {
    this.screen = 'map';
    this.notice = notice;
    const b = this.block(), c = this.cursor;
    if (next && b && c) {
      const n = gridPages(b)[c.page]?.length ?? 0;
      if (n) {
        this.cursor = { ...c, focus: 'grid', at: (c.at + 1) % n };
        return this.openCard();
      }
    }
    // D27 x D30: with job moments on, the Day can only end itself once the result page closes.
    this.autoEnd();
    this.view?.refresh();
  }

  /** D6b: the street meeting waiting on the map, drawn as a panel. */
  private meetPanel(): import('../ui/redux/screens/dominion/fieldViews').MeetPanel | null {
    const b = this.block();
    const m = b ? meetModel(b) : null;
    if (!m) return null;
    const L = DOMINION_DATA.town.lines;
    return { ...m, at: Math.min(this.meetAt, m.choices.length - 1), title: L.panel!, hint: L.pick! };
  }
  private answerMeet(i: number): void {
    const out = services().session.dominionStep({ t: 'townMeet', choice: i });
    this.notice = out.notice;
    if (out.ok) this.meetAt = 0;
    if (out.ok && out.fight) return this.fight('map');
    this.view?.refresh();
  }

  // ---------- D11: the Hero's file (mockup s9) and the Hero interrupt (m11) ----------

  /** A job the Hero stepped into, waiting on Battle / Run / Smoke Ball. */
  private heroPending(): boolean {
    const f = this.block()?.field.fight;
    return !!f && f.why === 'hero' && !f.begun;
  }

  /** Pokémon atlas files for the given species (missing art falls back to nothing). */
  private monFiles(ids: string[]): MonFiles {
    const out: MonFiles = {};
    for (const id of ids) {
      const sp = services().session.content.species.get(id);
      out[id] = sp ? rxFileOf(this.manifest, pokemonAssetIds(sp.assets).front)?.file ?? null : null;
    }
    return out;
  }

  private openHero(): void {
    const b = this.block();
    if (!b?.opened || this.screen === 'hero') return;
    if (!b.hero) {
      this.notice = 'Nobody has heard of a Hero yet. End the day first.';
      return void this.view?.refresh();
    }
    this.heroFrom = this.screen === 'card' ? 'map' : this.screen === 'ledger' ? this.ledgerFrom : this.screen;
    this.screen = 'hero';
    this.notice = null;
    this.garage = false;
    this.view?.refresh();
  }

  private closeHero(): void {
    this.screen = this.heroFrom;
    this.notice = null;
    if (this.screen === 'map' && !this.cursor) this.cursor = newCursor(this.block()!);
    this.view?.refresh();
  }

  /** The Hero file's big button: fight the Legendary that's out, or go back. */
  private heroCta(): void {
    const b = this.block();
    if (!b?.hero) return this.closeHero();
    const m = heroModel(b, services().session.run!);
    if (m.cta.act === 'legend' && m.cta.id) return this.heroAct({ t: 'legend', legend: m.cta.id });
    this.closeHero();
  }

  private heroAct(action: DominionAction): void {
    const out = services().session.dominionStep(action);
    this.notice = out.notice;
    if (out.ok && out.fight) return this.fight('hero');
    this.view?.refresh();
  }

  /** m11: 0 battle, 1 run, 2 Smoke Ball. */
  private interrupt(i: number): void {
    if (!this.heroPending()) return;
    const how = (['fight', 'run', 'smoke'] as const)[i];
    if (!how) return;
    this.intAt = i;
    const out = services().session.dominionStep({ t: 'interrupt', how });
    if (!out.ok) {
      this.notice = out.notice;
      return void this.view?.refresh();
    }
    if (out.fight) {
      this.notice = out.notice;
      return this.fight('map');
    }
    this.screen = 'map';
    if (!this.cursor) this.cursor = newCursor(this.block()!);
    this.notice = out.notice;
    this.view?.refresh();
  }

  /** H opens the Hero's file (not on the Crew File, where H hires); on the file: 1-3 answer, F fights, L/R after the stand. */
  private heroRaw(code: string): boolean {
    if (this.screen === 'interrupt') {
      const i = { Digit1: 0, Digit2: 1, Digit3: 2 }[code];
      if (i !== undefined) this.interrupt(i);
      return true;
    }
    if (this.screen === 'hero') {
      const b = this.block();
      const m = b?.hero ? heroModel(b, services().session.run!) : null;
      if (code === 'KeyH') this.closeHero();
      else if (code in TAB_KEYS && m?.meet?.open && TAB_KEYS[code]! < m.meet.choices.length) this.heroAct({ t: 'meet', choice: TAB_KEYS[code]! });
      else if (code === 'KeyF' && m?.cta.act === 'legend') this.heroCta();
      else if (m?.choose && (code === 'KeyL' || code === 'KeyR')) this.heroAct({ t: 'after', how: code === 'KeyR' ? 'recruit' : 'leave' });
      return true;
    }
    if (code === 'KeyH' && (this.screen === 'hq' || this.screen === 'map' || this.screen === 'ledger')) {
      this.openHero();
      return true;
    }
    return false;
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
      this.screen = this.cardFrom;
      return this.view?.refresh();
    }
    if (this.screen === 'district') {
      if (this.notice) this.notice = null;
      else this.screen = 'map';
      return this.view?.refresh();
    }
    if (this.screen === 'desk') {
      this.screen = 'hq';
      this.notice = null;
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
    // D27 (v4 m1): Esc at the top of a run page opens the Boss Menu (End still saves and quits from anywhere).
    if (this.inRun() && this.block()?.opened) {
      this.menu.open();
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

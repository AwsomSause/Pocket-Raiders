// DOMINION (Evil Mode rework; design plans/evil-mode-rework, build plan BUILD_SLICES.md slice D1): the title card, the
// setup pages, the opening scene and the HQ with its clock. The scene is the controller: it keeps the cursors and the
// setup draft, and asks the session to start the Dominion or step the clock (saved at every step). Drawn in the New
// look only: with Old selected, the New layer is mounted for this screen (the setting is never changed).

import Phaser from 'phaser';
import { getArchetype } from '../core/archetypes';
import { pokemonAssetIds, type AssetManifest } from '../assets/catalog';
import { DOMINION_DATA } from '../core/dominion/data';
import { dominionBlock } from '../core/dominion/session';
import { bossStart } from '../core/dominion/bossTraits';
import { monName } from '../core/dominion/crew';
import { charterRows, hqModel, newSetup, openingLines, SETUP_PAGES, toggleType, typeGrid, type SetupDraft } from '../core/dominion/screens';
import type { DominionAction, DominionBlock } from '../core/dominion/schema';
import { STAT_IDS } from '../core/dominion/schema';
import { services } from '../game/services';
import { onInputAction, type InputAction } from '../ui/input';
import { setLogKeyTaken } from '../ui/overlays';
import { rxFileOf } from '../ui/redux/assets';
import { mountRedux, type ReduxView } from '../ui/redux/stage';
import { emblem, type SetupFiles } from '../ui/redux/screens/dominion/views';
import { foundingModel, r5Cold, r5Founding, r5Setup, r5Sign, r5Title, type R5Actor, type R5SetupModel, type R5TitleRow } from '../ui/redux/screens/dominion/r50/start';
import { r5PreRun } from '../ui/redux/screens/dominion/r50/run';
import type { R5Run } from '../ui/redux/screens/dominion/r50/kit';
import { districtDef } from '../core/dominion/field';
import { hqName } from '../core/dominion/hq';
import { mini, tall } from '../ui/redux/kit';
import { monFile } from '../ui/redux/game';
import { pngSrc, tallTeam } from '../ui/redux/screens/dominion/teamPic';
import { hubScr, r5Hq, r5Start, START_ITEMS } from '../ui/redux/screens/dominion/r50/hub';
import { bossPic, r5Hub, r5Run, R5StartMenu } from './dominion/r50Bridge';
import { EventPages } from './dominion/r6Events';
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
import { EmpireController } from './dominion/empireController';
import { completion } from '../core/dominion/ending';
import { PartnersController } from './dominion/partnersController';
import { EndingController } from './dominion/endingController';
import { TURN_FLAG } from '../core/dominion/charters';
import { DebateController } from './dominion/debateController';
import { PoliceController } from './dominion/policeController';
import { SnatchController } from './dominion/snatchController';
import { VoicesController } from './dominion/voicesController';
import { NavController, type Here } from './dominion/navController';
import { PAD_WHEEL_EVENT } from '../ui/gamepad';
import { jumpable, OPENS, type PageId } from '../core/dominion/nav';
import { paperNote } from '../core/dominion/voices';
import { threatRow } from '../core/dominion/rivalScreens';
import { cardModel, gridPages, mapModel, newCursor, pageFor, type CardModel, type MapCursor } from '../core/dominion/fieldScreens';
import { mapView } from '../ui/redux/screens/dominion/fieldViews';
import { ledgerModel, SPREADS } from '../core/dominion/ledgerScreens';
import { ledgerView } from '../ui/redux/screens/dominion/ledger';
import { meetModel } from '../core/dominion/town';
import { foundedLines, foundingOpen, foundingPaper, initialOf, nameIdeas, newDraft, teamColours } from '../core/dominion/founding';
import { FOUNDING_ROWS, type FoundingUi } from '../ui/redux/screens/dominion/founding';
import { heroModel, interruptModel } from '../core/dominion/heroScreens';
import { heroView, type MonFiles } from '../ui/redux/screens/dominion/heroViews';
import { BossMenuController, SETTINGS_CATS } from './dominion/bossMenuController';
import { fxClasses, fxOf } from '../core/dominion/fx';
import { JobController } from './dominion/jobController';
import { JobsX } from './dominion/r4Jobs';
import type { LiveAnswer } from '../core/dominion/schema';
import { TutorialController } from './dominion/tutorialController';
import type { TutWhere } from '../core/dominion/tutorial';

type Screen = 'title' | 'setup' | 'opening' | 'hq' | 'map' | 'card' | 'crew' | 'reserve' | 'pyramid' | 'base' | 'rival' | 'ledger' | 'hero' | 'interrupt' | 'desk' | 'squads' | 'founding' | 'founded' | 'debate' | 'spy' | 'takeover' | 'broadcast' | 'assign' | 'district' | 'empire' | 'partners';

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
  /** R1 follow-up: the opening talk's Log (every line so far) and Auto (the next line every few seconds, until the last). */
  private coldLog = false;
  private coldAuto = false;
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
  /** R6: a street meeting played as an event (Talk, Choose, Result, Reward, the Text log). */
  private ev = this.newEvents();
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
  /** D15: the Empire across regions (key G) and the Leaving page (L once the region is Taken). */
  private em = new EmpireController(this);
  /** D16: the Partnership page (key J). */
  private pt = new PartnersController(this);
  /** D17: the ending page (opens once the run is complete; Enter closes the books). */
  private end = new EndingController(this);
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
  /** The tutorial and the opening (tutorial-mockups a1-e9). */
  private tut = new TutorialController(this.tutHost());
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
    r5: () => this.r4People(),
    callingDue: () => this.jx.callingDue(),
    openCalling: () => this.jx.openCalling(),
  });
  /** Redesign R4: the Job board, the live question, the calling card, the Black Market, the cargo and Gym pages. */
  private jx = this.newJx();
  /** Redesign R4: Pick the crew over the Card (mockup `crewpick`). */
  private cp = new CrewPick();
  /** Redesign R4: the Boss card is up (mockup `tcard`, from the Start menu). */
  private bcard = false;
  /** Redesign R0: the Start menu over the HQ (mockup `start`). */
  private start = new R5StartMenu((id) => this.r5go(id), () => this.view?.refresh());
  private voices = new VoicesController({ refresh: () => this.view?.refresh(), onHq: () => this.screen === 'hq' && !this.crew.owns() && !this.police.owns() && !this.snatch?.owns() && !this.block()?.crew?.talks.length });

  constructor() {
    super('Dominion');
  }

  create(): void {
    this.screen = 'title';
    this.setup = newSetup();
    this.shown = 1;
    this.coldLog = false;
    this.coldAuto = false;
    // Auto (R1 follow-up): presentation only; it presses "Go on" for the player and stops on the last line.
    this.time.addEvent({ delay: DOMINION_DATA.start.boss.autoMs, loop: true, callback: () => this.coldTick() });
    this.at = 0;
    this.notice = null;
    this.leaving = false;
    this.crew = new CrewController(this);
    this.chair = new ChairController(this);
    this.founding = null;
    this.foundedShown = 1;
    this.hq = new HqController(this);
    this.res = new ReserveController(this);
    this.ev = this.newEvents();
    this.rival = new RivalController(this);
    this.tk = new TakeoverController(this);
    this.em = new EmpireController(this);
    this.pt = new PartnersController(this);
    this.end = new EndingController(this);
    this.debate = new DebateController(this);
    this.police = new PoliceController(this);
    this.snatch = new SnatchController(this);
    this.desk = new DeskController(this);
    this.sq = new SquadController(this, this);
    this.menu = new BossMenuController(this.menuHost());
    this.tut = new TutorialController(this.tutHost());
    this.spy.destroy();
    this.spy = new SpyController(this);
    this.voices.close();
    this.nav = new NavController(this.navHost());
    this.start = new R5StartMenu((id) => this.r5go(id), () => this.view?.refresh());
    this.cp = new CrewPick();
    this.bcard = false;
    this.jx = this.newJx();
    const { session } = services();
    const run = session.run;
    if (!run) return void this.scene.start('MainMenu');
    this.titleAt = 0;
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
    if (back === 'empire') this.em.resume(stale?.length ? stale.join(' ') : null);
    if (back === 'partners') this.pt.resume(stale?.length ? stale.join(' ') : null);
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
      charters: { open: session.dominionChartersOpen(), lockLine: DOMINION_DATA.charters.lockLine, pickLine: DOMINION_DATA.charters.pickLine, rows: charterRows() },
    };
    this.view = mountRedux(this, {
      render: () => this.render(),
      acts: {
        ...this.job.acts(),
        ...this.tut.acts(),
        title: (i) => { this.titleAt = Number(i); this.confirm(); },
        type: (i) => { this.setup = toggleType({ ...this.setup, at: Number(i) }); this.view?.refresh(); },
        member: (i) => { this.setup = { ...this.setup, member: i === '0' ? 'grunt' : 'admin', problem: null }; this.view?.refresh(); },
        next: () => this.next(),
        setupBack: () => this.back(),
        more: () => this.confirm(),
        coldLog: () => this.coldToggle('log'),
        coldAuto: () => this.coldToggle('auto'),
        order: (i) => { this.at = Number(i); this.confirm(); },
        tab: (i) => this.tab(Number(i)),
        // D16: the Charters page (C on the Boss page) and a click on one of its rows (a second click begins).
        charters: () => this.openCharters(),
        hall: () => this.openHall(),
        charterRow: (i) => { const again = this.setup.cAt === Number(i); this.setup = { ...this.setup, cAt: Number(i), problem: null }; if (again) this.next(); else this.view?.refresh(); },
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
        crewpick: () => this.openCrewPick(),
        crewPick: (i) => this.crewPick(Number(i)),
        crewBack: () => { this.cp.close(); this.view?.refresh(); },
        tcardBack: () => { this.bcard = false; this.view?.refresh(); },
        ...this.jx.acts(),
        opt: (id) => { if (this.cursor) this.cursor = { ...this.cursor, opt: String(id) }; this.view?.refresh(); },
        buy: (id) => this.buy(id),
        ...this.ev.acts(),
        dismiss: () => { this.notice = null; this.res.dismiss(); this.rival.dismiss(); this.debate.dismiss(); this.spy.dismiss(); this.tk.dismiss(); this.em.dismiss(); this.pt.dismiss(); this.view?.refresh(); },
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
        ...this.em.acts(),
        ...this.pt.acts(),
        ...this.end.acts(),
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
        r5go: (id) => this.r5go(id),
        r8StayUp: () => { this.stayUp = this.block()?.day ?? 0; this.view?.refresh(); },
        r5start: (i) => this.start.pick(Number(i)),
      },
      overs: {
        typeOver: (i) => { this.setup = { ...this.setup, at: Number(i) }; this.view?.refresh(); },
        titleOver: (i) => { if (this.titleAt !== Number(i)) { this.titleAt = Number(i); this.view?.refresh(); } },
        charterOver: (i) => { this.setup = { ...this.setup, cAt: Number(i) }; this.view?.refresh(); },
        orderOver: (i) => { this.at = Number(i); this.view?.refresh(); },
        ...this.jx.overs(),
        ...this.crew.overs(),
        ...this.chair.overs(),
        ...this.res.overs(),
        ...this.ev.overs(),
        ...this.rival.overs(),
        ...this.spy.overs(),
        ...this.tk.overs(),
        ...this.pt.overs(),
        ...this.desk.overs(),
        ...this.sq.overs(),
        ...this.nav.overs(),
        ...this.menu.overs(),
        r5startOver: (i) => { this.start.at = Number(i); this.view?.refresh(); },
        crewOver: (i) => { this.cp.at = Number(i); this.view?.refresh(); },
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
      // The tutorial's pages and the lesson that holds the page read every key first (X stops the tips).
      const tr = this.tut.raw(e.code, this.screen);
      if (tr) return void (this.ate = tr === 'eat');
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
      // Redesign R0: the Start menu over the HQ keeps every key (its moves come through key()).
      if (this.start.on || this.bcard) return;
      // Redesign R4: the Job board, the live question, the calling card and the Black Market keep their keys.
      if (this.inRun() && this.jx.raw(e.code)) return;
      // D24: the interview room and the release page read their keys first (typing included).
      // D30: a job moment or the morning paper keeps every key while it is up (N is Next action on a result page).
      if (this.inRun() && this.job.raw(e.code)) return;
      if (this.inRun() && this.police.raw(e)) return;
      // D23: the questioning room reads its keys next (typing included).
      if (this.inRun() && this.snatch.raw(e)) return;
      // R6: a street event reads L (its Text log) and 1-9 (answers) first.
      if (this.inRun() && this.ev.raw(e.code)) return;
      // R1 follow-up: the opening talk's L (Log); Esc or L closes it. Auto is its chip (A is a move key).
      if (this.screen === 'opening' && e.code === 'KeyL') return this.coldToggle('log');
      if (this.screen === 'opening' && this.coldLog && e.code === 'Escape') return this.coldToggle('log');
      if (this.screen === 'founding') return;
      if (this.screen === 'setup') return void (e.code === 'KeyC' ? this.openCharters() : e.code === 'KeyH' && this.openHall());
      if (this.debate.raw(e.code, e)) return;
      // D12: while the Chair sits, O is its settings, not the Founding.
      if (e.code === 'KeyO' && (this.screen === 'hq' || this.screen === 'map' || this.screen === 'crew') && !this.chair.owns()) return this.openFounding();
      if (this.screen === 'desk') {
        this.desk.raw(e);
        return;
      }
      if (this.voices.raw(e.code)) return void (this.ate = MOVE_LETTERS.has(e.code));
      // D17: once the run is complete, L on the Empire or Takeover page opens the ending (there's nowhere left to sail).
      if (this.end.raw(e.code)) return;
      if (e.code === 'KeyL' && (this.screen === 'empire' || this.screen === 'takeover') && this.block() && completion(this.block()!)) return void (this.end.open() && this.view?.refresh());
      if (this.tk.raw(e.code)) return;
      if (e.code === 'KeyJ' && this.screen === 'empire') return void (this.pt.open() && this.view?.refresh());
      if (this.em.raw(e.code)) return void ((this.ate = MOVE_LETTERS.has(e.code)), this.view?.refresh());
      // D16: J opens the Partnership page from the HQ, the map, the Ledger and the Empire page (J again closes it).
      if (this.pt.raw(e.code)) return void this.view?.refresh();
      if (this.screen === 'partners') return;
      if (e.code === 'KeyJ' && (this.screen === 'hq' || this.screen === 'map' || this.screen === 'ledger' || this.screen === 'empire') && this.block()?.opened) return void (this.pt.open() && this.view?.refresh());
      // D15: G opens the Empire page from the HQ, the map, the Ledger and the Takeover page.
      if (e.code === 'KeyG' && (this.screen === 'hq' || this.screen === 'map' || this.screen === 'ledger') && this.block()?.opened) return void (this.em.open(this.screen) && this.view?.refresh());
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
        // Redesign R4: B opens Pick the crew (and closes it again).
        if (e.code === 'KeyB') return this.cp.on ? (this.cp.close(), void this.view?.refresh()) : this.openCrewPick();
        if (!this.cp.on && this.jx.cardRaw(e.code)) return;
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
    const up = (e: KeyboardEvent): void => { this.nav.up(e); this.tut.keyup(); };
    kb?.on('keyup', up);
    // D28: a controller's Select held is the hold-Q of the pad.
    const pad = (e: Event): void => { if (!this.leaving && this.scene.isActive()) this.nav.pad(!!(e as CustomEvent<boolean>).detail); };
    window.addEventListener(PAD_WHEEL_EVENT, pad);
    // After `raw`, so a letter the HQ menu took (A, S) is not also read as a move.
    onInputAction(this, (a) => this.key(a), { onceEach: true });
    // L is the Ledger on the HQ, the map and the Crew File (D6) and Money on the HQ menu (D5, mockup 6), so it doesn't
    // open the game's interaction log there; the Confront room's text box keeps L (D22) (Shift+L still does).
    setLogKeyTaken(() => this.scene.isActive() && (this.screen === 'base' || this.screen === 'spy' || this.screen === 'empire' || (this.screen === 'takeover' && !!this.block()?.takeover?.taken)
      || (!!this.block()?.opened && ['hq', 'map', 'crew', 'ledger', 'hero'].includes(this.screen))));
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

  /** The help level picked on the tutorial's first page goes with the run (none: no tutorial, the old flow). */
  private tutSetup(): { tutorial?: 'full' | 'tips' | 'off' } {
    const m = this.tut.mode();
    return m ? { tutorial: m } : {};
  }

  /** Where the tutorial may draw: the HQ only when nothing else (a moment, a case, the Chair...) owns it. */
  private tutWhere(): TutWhere {
    if (this.leaving) return 'other';
    if (this.nav.wheel) return 'wheel';
    if (this.nav.boardOn()) return 'other';
    if (this.menu.owns()) return this.menu.page === 'menu' ? 'menu' : 'other';
    const b = this.block();
    if (!b?.opened) return 'other';
    if (this.job.owns() || this.police.owns() || this.snatch.owns() || this.job.paperOwns() || this.voices.on || b.debate?.live || this.heroPending()) return 'other';
    switch (this.screen) {
      // The Morning is the HQ too (the crew controller draws it).
      case 'hq': return this.chair.owns() || b.crew?.talks.length ? 'other' : 'hq';
      case 'map': return this.notice || this.meetPanel() ? 'other' : 'map';
      case 'card': return 'card';
      case 'assign': return 'assign';
      case 'founding': return 'founding';
      default: return 'other';
    }
  }

  private tutHost() {
    const sc = (): DominionScene => this;
    return {
      refresh: () => sc().view?.refresh(),
      where: () => sc().tutWhere(),
      foundingStep: () => {
        const r = FOUNDING_ROWS[sc().founding?.row ?? 0];
        return r === 'name' ? 0 : r === 'primary' || r === 'secondary' ? 1 : r === 'initial' || r === 'logo' || r === 'motto' ? 2 : 3;
      },
      member: () => {
        const m = sc().block()?.members[0];
        return { ...sc().memberLook(), name: m?.name ?? DOMINION_DATA.start.members.grunt.name, grunt: !m || m.name === DOMINION_DATA.start.members.grunt.name };
      },
      startSetup: () => { sc().screen = 'setup'; sc().setup = newSetup(); },
      toTitle: () => { sc().screen = 'title'; },
      planHere: () => {
        const b = sc().block();
        if (!b || b.phase !== 'evening') return;
        const m = hqModel(b), o = m.orders[sc().at];
        if (m.panel === 'orders' && o) sc().step({ t: 'plan', order: o.id });
      },
      hqNext: () => sc().next(),
      setupState: () => (sc().screen === 'setup' ? { page: sc().setup.page, types: sc().setup.types.length, problem: !!sc().setup.problem } : null),
      firstTitle: () => sc().screen === 'title' && !sc().block() && !sc().files?.charters.open,
      r5pre: () => sc().r5pre(),
    };
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
      replay: (lesson: string) => sc.tut.replay(lesson),
      r5run: () => { const b = sc.block(); return b ? r5Run(sc, b) : null; },
      r5pre: () => sc.r5pre(),
      hubHtml: () => { const b = sc.block(); return b?.opened ? sc.hubHtml(b) : null; },
    };
  }

  /** Redesign R1: the chrome's data before the run has a Dominion block (the title, the setup, the help choice). */
  r5pre(): R5Run {
    return r5PreRun(r5Party(this));
  }

  /** Redesign R1: the HQ hub's page, for Rotom's X-ray over it. */
  hubHtml(b: DominionBlock): string {
    const x = r5Hub(b, { look: this.memberLook().look, bossFile: this.files?.boss.file ?? null, notice: null, at: this.at, threat: threatRow(b), desk: deskOpen(b) ? deskWaiting(b) : null, paper: paperNote(b) });
    return hubScr(hqModel(b), x, r5Run(this, b));
  }

  // ---------- Redesign R1 (pass 50): the Start pages ----------

  /** The title's rows (mockup `title`): Continue when there is a run, New Dominion, the Lesson Book, Settings, leave. */
  private titleRows(): R5TitleRow[] {
    const b = this.block();
    const open = !!this.files?.charters.open;
    const rows: R5TitleRow[] = [];
    if (b) rows.push({ id: 'continue', label: 'Continue', sub: '', on: true, testid: 'dom-title-1' });
    rows.push({ id: 'new', label: 'New Dominion', sub: b ? 'End this run first' : open ? 'A run finished · Charters open' : 'One Grunt and a leaky warehouse', on: !b, testid: 'dom-title-0' });
    rows.push({ id: 'lessons', label: 'Tutorial', sub: 'Rotom’s lessons · replay any', on: true, testid: 'dom-title-tut' });
    rows.push({ id: 'settings', label: 'Settings', sub: '', on: true, testid: 'dom-title-set' });
    rows.push({ id: 'leave', label: 'Back to Pocket Raiders', sub: '', on: true, testid: 'dom-title-leave' });
    return rows;
  }

  private bossFace(sz: number): string {
    const h = Math.round(sz * 2.5);
    return `<span style="display:block;margin-left:${-Math.round(sz * 0.14)}px;margin-top:${-Math.round(sz * 0.08)}px">${bossPic(this.files?.boss.file ?? null, h)}</span>`;
  }

  /** A member's full picture at a height (a png look in the team's colours, or a trainer atlas). */
  private memberTall(look: string, b: DominionBlock | null, h: number): string {
    const tc = b ? teamColours(b) : null;
    return look.endsWith('.png') ? `<img class="px" src="${pngSrc(look, tc)}" alt="" style="height:${h}px;width:auto">` : tallTeam(look, h, tc);
  }

  private titlePage(): string {
    const b = this.block();
    const run = b ? r5Run(this, b) : this.r5pre();
    const party = (services().session.run?.party ?? []).slice(0, 6).map((m) => { const f = monFile(this, m.speciesId, 'icon', !!m.shiny); return f ? mini(f, 20) : ''; });
    const lead = services().session.run?.party[0];
    const leadFile = lead ? monFile(this, lead.speciesId, 'front', !!lead.shiny) : null;
    const crew = [b ? this.memberTall(this.memberLook().look, b, 108) : '', bossPic(this.files?.boss.file ?? null, 200), leadFile ? mini(leadFile, 92) : ''].filter(Boolean);
    return r5Title({
      at: Math.min(this.titleAt, this.titleRows().length - 1),
      rows: this.titleRows(),
      cont: b ? { pic: this.bossFace(58), line: `${b.teamName ?? 'Unnamed Crew'} · Day ${b.day} · ${run.funds}`, party, goal: run.goalPct } : null,
      initial: b?.team?.initial ?? b?.teamName?.[0]?.toUpperCase() ?? 'N',
      goal: run.goalPct,
      crew,
    }, run);
  }

  private typeMons: Record<string, string> | null = null;
  /** Four first-stage Kanto and Johto Pokémon of each type (the types rows' examples). Display only. */
  private monsByType(): Record<string, string> {
    if (this.typeMons) return this.typeMons;
    const all = [...services().session.content.species.values()].filter((sp) => sp.dex <= 251 && sp.evolutionStage === 1 && !/-(?!f$|m$)/.test(sp.id)).sort((a, b) => a.dex - b.dex);
    const out: Record<string, string> = {};
    for (const t of typeGrid()) out[t] = all.filter((sp) => sp.types.some((x) => x.toLowerCase() === t)).slice(0, 4).map((sp) => sp.name).join(', ');
    return (this.typeMons = out);
  }

  /** A Pokémon of the picked types (both if one has them), for the types page's detail. */
  private typePic(types: readonly string[]): string {
    const every = [...services().session.content.species.values()].filter((sp) => !/-(?!f$|m$)/.test(sp.id)).sort((a, b) => a.dex - b.dex);
    const all = every.filter((sp) => sp.dex <= 251);
    const has = (sp: (typeof all)[number], t: string): boolean => sp.types.some((x) => x.toLowerCase() === t);
    // Both types if any Pokémon has them (Kanto/Johto first, then any region), else the first type.
    const both = (x: (typeof all)[number]): boolean => types.length > 1 && types.every((t) => has(x, t));
    const sp = all.find(both) ?? every.find(both) ?? all.find((x) => has(x, types[0] ?? 'poison'));
    const f = sp ? monFile(this, sp.id, 'front') : null;
    return f ? mini(f, 110) : '';
  }

  private setupPage(): string {
    const f = this.files!, d = this.setup, D = DOMINION_DATA.start;
    const grid = typeGrid();
    const picked = d.types.length ? d.types : [grid[d.at] ?? 'poison'];
    const look = D.members.admin.looks[d.look] ?? D.members.admin.looks[0]!;
    const mem = d.member === 'grunt' ? D.members.grunt : D.members.admin;
    const m: R5SetupModel = {
      page: d.page,
      problem: d.problem,
      boss: { name: f.boss.name, pic: bossPic(f.boss.file, 190), ...this.bossFacts() },
      starters: f.starters.map((x) => ({ name: x.name, level: x.level, pic: x.file ? mini(x.file, 64) : '' })),
      funds: `₽${D.start.funds.toLocaleString('en-US')}`,
      home: `${districtDef(DOMINION_DATA.field.hq)?.name ?? 'Pewter'} back streets`,
      types: { rows: grid, banned: f.types.banned, at: d.at, picked: d.types, mons: d.page === 'types' ? this.monsByType() : {}, pic: d.page === 'types' ? this.typePic(picked) : '', hint: f.types.hint },
      member: {
        which: d.member, name: d.member === 'grunt' ? f.grunt.name : look.name, rank: look.cls,
        pic: d.member === 'grunt' ? this.memberTall(D.members.grunt.look, null, 190) : tall(look.file, 190),
        stats: Object.entries(mem.stats) as [string, number][], facts: d.member === 'grunt' ? f.grunt.facts : f.admin.facts, pitch: d.member === 'grunt' ? f.grunt.pitch : f.admin.pitch,
        wage: mem.wage, lv: mem.monLevel, loyalty: mem.loyalty, look: d.look, looks: D.members.admin.looks.length,
      },
      charters: {
        open: f.charters.open, lockLine: f.charters.lockLine, pickLine: f.charters.pickLine, at: d.cAt,
        rows: f.charters.rows.map((c) => ({ id: c.id, team: c.team, initial: c.initial, colours: c.colours, question: c.question, patron: c.patron.name, motto: c.motto, from: c.from })),
      },
      hall: this.hallModel(),
    };
    return r5Setup(m, this.r5pre());
  }

  /** R1 follow-up: the Boss's starting Edge and traits (by trainer), and the title a finished run earned. */
  private bossFacts(): { stats: [string, number][]; traits: [string, string][]; title: string | null } {
    const s = bossStart(services().session.run?.archetypeId ?? '');
    return { stats: STAT_IDS.map((k) => [k, s.edge[k]]), traits: s.traits.map((t) => [t.name, t.text]), title: services().session.dominionBossTitle() };
  }

  /** R1 follow-up: the newest Hall of Infamy entry, with its pictures (the Hall page reuses R8's pedestals). */
  private hallModel(): R5SetupModel['hall'] {
    const all = services().session.dominionHall(), h = all[0];
    if (!h) return null;
    const session = services().session;
    const arch = session.content.archetypes.get(h.boss);
    const bossFile = arch ? rxFileOf(this.manifest, arch.spriteAssetId)?.file ?? null : this.files?.boss.file ?? null;
    const peds = [
      { pic: bossPic(bossFile, 150), name: arch?.name ?? this.files?.boss.name ?? 'Boss', role: session.dominionBossTitle() ?? 'The Boss', top: true },
      ...h.crew.map((c) => ({ pic: tall(c.look, 110), name: c.name, role: c.role })),
      ...(h.ace ? [{ pic: (() => { const f = monFile(this, h.ace!.speciesId, 'front'); return f ? mini(f, 110) : ''; })(), name: monName(h.ace.speciesId), role: `Ace · Lv ${h.ace.level}` }] : []),
    ];
    return { team: h.team, region: h.region, day: h.day, runs: all.length, peds };
  }

  private openingPage(b: DominionBlock | null): string {
    if (!b) return '';
    const mb = b.members[0];
    const look = this.memberLook().look;
    const member: R5Actor = { name: mb?.name ?? 'Rook', role: mb?.rank === 'grunt' || !mb ? 'Your only Grunt' : 'Your first Admin', pic: this.memberTall(look, b, 250), face: facePic(look, b, 62), colour: '#3f7fd9' };
    const boss: R5Actor = { name: this.files?.boss.name ?? 'Boss', role: 'The Boss', pic: `<span class="flip r5blk">${bossPic(this.files?.boss.file ?? null, 250)}</span>`, face: this.bossFace(62), colour: '#e0294a' };
    return r5Cold(openingLines(b), this.shown, member, boss, r5Run(this, b), { log: this.coldLog, auto: this.coldAuto });
  }

  private foundedPage(b: DominionBlock | null): string {
    const c = b ? teamColours(b) : null;
    const m = b?.members[0];
    if (!b || !c || !m || !b.team) return '';
    const lines = foundedLines(b);
    const t = b.team;
    const goal = DOMINION_DATA.founding.goals.find((g) => g.id === t.goal);
    const changes = [
      { up: true, b: 'Armbands', e: `${DOMINION_DATA.founding.colours.find((x) => x.id === t.primary)?.name ?? ''} and ${DOMINION_DATA.founding.colours.find((x) => x.id === t.secondary)?.name ?? ''}, with the ${t.initial}` },
      { up: true, b: 'Crew', e: `${m.name} wears it first` },
      { up: true, b: 'Goal', e: goal?.name ?? DOMINION_DATA.founding.noGoal.name },
    ];
    // R1 follow-up: the morning paper runs the story (its Dread and Regard are real, set by the Founding).
    const paper = foundingPaper(b);
    changes.push({ up: false, b: `${paper.district} talks`, e: paper.fx });
    return r5Sign({ name: t.name, where: `Day ${b.day} · ${hqName(b)}`, changes, line: lines[Math.max(0, Math.min(this.foundedShown, lines.length) - 1)] ?? '', last: this.foundedShown >= lines.length, emblem: emblem(c, 70, 62, 42), paper }, r5Run(this, b));
  }

  /** Redesign R0 (pass 50): the HQ hub, or the Start menu over it. */
  private hqPage(b: DominionBlock): string {
    const m = hqModel(b);
    if (this.nightPage()) {
      const label = m.next.label === 'Rest' ? `Sleep to Day ${b.day + 1}` : `${m.next.label} · Day ${b.day + 1}`;
      return r5Night({ day: b.day, phase: m.top.phaseWord, rows: nightRows(b), says: m.says, who: speaker(b, b.members[0]), next: label, pics: r5Pics(this, b), notice: this.notice }, r5Run(this, b));
    }
    const x = r5Hub(b, { look: this.memberLook().look, bossFile: this.files?.boss.file ?? null, notice: this.notice, at: this.at, threat: threatRow(b), desk: deskOpen(b) ? deskWaiting(b) : null, paper: paperNote(b) });
    const run = r5Run(this, b);
    if (!this.start.on) return r5Hq(m, x, run);
    return r5Start(hubScr(m, x, run), START_ITEMS, this.start.at, { name: this.files?.boss.name ?? 'Boss', pic: `<span style="display:block;margin-left:-6px;margin-top:-3px">${bossPic(this.files?.boss.file ?? null, 100)}</span>`, funds: run.funds }, run);
  }

  /** Redesign R0: the pass-50 chrome's links (mockup page ids) go to the screens the game has; the rest wait for their slice. */
  private r5go(id: string): void {
    const b = this.block();
    if (!b) return;
    const TAB: Record<string, number> = { hq: 0, map: 1, roster: 2, reserve: 3, card: 4, jobs: 4, ledger: 5 };
    if (id in TAB) return this.tab(TAB[id]!);
    if (id === 'start' && this.screen === 'hq') return this.start.open();
    if (id === 'tcard') { this.bcard = true; return void this.view?.refresh(); }
    if (id === 'menu') { this.menu.open(); return void this.view?.refresh(); }
    // Redesign R9: Settings, Options, Save and quit, Rotom and the vault are the Boss Menu controller's pages.
    if (['set', 'options', 'save', 'rotom', 'vault', 'controls', 'calm', 'access', 'hud'].includes(id)) { this.menu.go(id); return void this.view?.refresh(); }
    if ((id === 'war' || id === 'rival' || id === 'rivals') && this.screen === 'hq') return void (this.rival.open() && this.view?.refresh());
    if (id === 'herotrack' && b.hero) return this.openHero();
    // R6: the party chip, the Start menu's Bag and the Summary are pages of the Pokémon tab.
    if (id === 'party' || id === 'summary' || id === 'bag') { this.notice = null; this.res.openPage(id); return void this.view?.refresh(); }
    if (id === 'save') { this.notice = 'Saved. Dominion saves every step.'; return void this.view?.refresh(); }
    if (id === 'base' && this.screen === 'hq') { this.hq.open(); return void this.view?.refresh(); }
    // Redesign R8: the Empire's and the Chair's pages.
    const EM: Record<string, 'cards' | 'world' | 'holder' | 'underworld' | 'gymcase'> = { regions: 'cards', empire: 'cards', world: 'world', holder: 'holder', sail: 'holder', underworld: 'underworld', gymcase: 'gymcase' };
    if (id in EM && b.opened) { const from = this.screen === 'empire' ? 'hq' : this.screen; return void (this.em.openAt(from, EM[id]!) && this.view?.refresh()); }
    if ((id === 'takeover' || id === 'fronts') && b.opened) { if (this.tk.open(this.screen === 'takeover' ? 'hq' : this.screen)) { if (id === 'fronts') this.tk.acts().tkHoldings!(''); this.view?.refresh(); } return; }
    if ((id === 'ending' || id === 'credits' || id === 'infamy') && this.end.open()) { if (id !== 'ending') this.end.acts()[id === 'credits' ? 'r8Credits' : 'r8Infamy']!(''); return void this.view?.refresh(); }
    if ((id === 'queue' || id === 'favours') && this.chair.owns()) return this.chair.acts()[id === 'queue' ? 'r8Queue' : 'r8Favours']!('');
    if (id === 'chair' && this.screen === 'hq') return this.tab(0);
  }

  /** D27: every page wears the Effects & motion classes (fx.css turns the spectacle down; presentation only). */
  private render(): string {
    const fx = fxOf(services().session.settings);
    const page = this.nav.boardOn() && this.navHere() ? this.nav.wrap(this.nav.boardRender(this.block() ? r5Run(this, this.block()!) : null), 'board', fx.level) : this.nav.wrap(this.renderPage(), this.navHere() as Here, fx.level);
    return `<div class="domfx ${fxClasses(fx)}">${page}${this.tut.overlay(this.screen)}</div>`;
  }

  private renderPage(): string {
    if (this.menu.owns()) return this.menu.render();
    if (this.tut.ownsPage()) return this.tut.renderPage();
    const b = this.block();
    if (b && this.inRun() && this.jx.owns()) return this.jx.render();
    if (b && this.inRun() && this.job.owns()) return this.job.render();
    if (b && this.inRun() && this.police.owns()) return this.police.render();
    if (b && this.inRun() && this.snatch.owns()) return this.snatch.render();
    if (b && this.inRun() && this.job.paperOwns()) return this.job.renderPaper();
    if (this.voices.on && this.screen === 'hq') return this.voices.render();
    // D13: a Debate on the table takes the screen (after the Debate action, a card answered, or a reload).
    if (b?.debate?.live && (this.screen === 'hq' || this.screen === 'map' || this.screen === 'card' || this.screen === 'rival' || this.screen === 'crew' || this.screen === 'reserve' || this.screen === 'pyramid' || this.screen === 'ledger' || this.screen === 'base')) this.debate.claim();
    // D17: the first time a hub page is drawn with the run complete, the ending opens over it.
    if (b && this.inRun() && (this.end.owns() || this.end.maybeOpen())) return this.end.render(this.notice);
    if (b && this.bcard && this.inRun()) return this.bossCardPage(b);
    switch (this.screen) {
      case 'title':
        return this.titlePage();
      case 'founding': {
        const f = this.founding;
        return f && b ? r5Founding(foundingModel(f.d, f.row, f.typing, f.ideas, f.problem), r5Run(this, b)) : '';
      }
      case 'founded':
        return this.foundedPage(b ?? null);
      case 'setup':
        return this.setupPage();
      case 'opening':
        return this.openingPage(b ?? null);
      case 'hq':
        if (b && this.chair.owns()) return this.chair.render(this.notice);
        if (b && this.crew.owns()) return this.crew.render(this.notice);
        return b ? this.hqPage(b) : '';
      case 'map':
        if (b && this.ev.owns()) return this.ev.render();
        return b && this.cursor ? mapView(mapModel(b, services().session.run!, this.cursor), this.notice, this.garage, this.meetPanel()) : '';
      case 'card': {
        const c = b && this.cursor ? this.cardOf() : null;
        if (!b || !c) return '';
        return this.cp.on ? this.crewPickPage(b) : this.jx.cardPage(b, r5Run(this, b)) ?? this.cardPage(b, c);
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
        if (!m || !b) return '';
        const mem = b.members[0];
        const left = mem ? memberPerson(mem, b, 250) : bossPerson(this.files?.boss.name ?? 'Boss', this.files?.boss.file ?? null);
        return r5HeroHit(m, left, heroPerson(m.hero, m.look), this.intAt, this.notice, r5Run(this, b));
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
      case 'empire':
        return this.em.render(this.notice);
      case 'partners':
        return this.pt.render(this.notice);
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
    if (this.tut.key(a)) return void this.view?.refresh();
    if (this.nav.key(a)) return;
    if (this.menu.key(a)) return void this.view?.refresh();
    if (this.start.key(a)) return;
    if (this.bcard) {
      if (a === 'back' || a === 'confirm') this.bcard = false;
      return void this.view?.refresh();
    }
    if (this.inRun() && this.jx.key(a)) return;
    if (this.end.key(a)) return;
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
    if (this.em.owns() && this.notice && (a === 'confirm' || a === 'back')) {
      this.notice = null;
      return void this.view?.refresh();
    }
    if (this.em.key(a)) return void this.view?.refresh();
    if (this.pt.key(a)) return void this.view?.refresh();
    if (this.screen === 'card' && this.cp.on) return this.crewPickKey(a);
    if (this.screen === 'card' && this.jx.cardKey(a)) return;
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
    if (this.ev.key(a)) return void this.view?.refresh();
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
    if (a === 'back' && this.nightPage() && !this.notice) { this.stayUp = this.block()!.day; return void this.view?.refresh(); }
    if (a === 'back') return this.back();
    if (a === 'confirm') return this.confirm();
    if (this.screen === 'title' && (a === 'up' || a === 'down')) { const n = this.titleRows().length; this.titleAt = (this.titleAt + (a === 'up' ? -1 : 1) + n) % n; }
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
    if (d.page === 'charter') {
      const n = DOMINION_DATA.charters.charters.length;
      if (a === 'up' || a === 'down') this.setup = { ...d, cAt: (d.cAt + (a === 'up' ? -1 : 1) + n) % n, problem: null };
    } else if (d.page === 'types') {
      // Redesign R1: the types are one list (mockup `setup`); every arrow walks it.
      const n = typeGrid().length, dx = a === 'left' || a === 'up' ? -1 : 1;
      this.setup = { ...d, at: (d.at + dx + n) % n };
    } else if (d.page === 'member') {
      if (a === 'left' || a === 'right') this.setup = { ...d, member: d.member === 'grunt' ? 'admin' : 'grunt', problem: null };
      else if (d.member === 'admin') {
        const n = DOMINION_DATA.start.members.admin.looks.length;
        this.setup = { ...d, look: (d.look + (a === 'up' ? -1 : 1) + n) % n };
      }
    }
  }

  private coldToggle(which: 'log' | 'auto'): void {
    if (which === 'log') this.coldLog = !this.coldLog;
    else this.coldAuto = !this.coldAuto;
    this.view?.refresh();
  }

  private coldTick(): void {
    const b = this.block();
    if (this.screen !== 'opening' || !this.coldAuto || this.coldLog || !b || this.shown >= openingLines(b).length) return;
    this.shown += 1;
    this.view?.refresh();
  }

  private confirm(): void {
    const b = this.block();
    if (this.screen === 'opening' && this.coldLog) return this.coldToggle('log');
    if (this.screen === 'title') {
      const id = this.titleRows()[this.titleAt]?.id;
      if (id === 'leave') return this.leave();
      if (id === 'lessons') this.menu.openFromTitle('replay');
      else if (id === 'settings') this.menu.openFromTitle('settings');
      else if (id === 'new' && !b) { if (!this.tut.begin()) this.screen = 'setup'; }
      else if (id === 'continue' && b) {
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

  /** R1 follow-up: H on the Charters page: the Hall of Infamy (the newest finished run's team); Esc comes back. */
  private openHall(): void {
    if (this.screen !== 'setup' || this.setup.page !== 'charter' || !services().session.dominionHall().length) return;
    this.setup = { ...this.setup, page: 'hall', problem: null };
    this.view?.refresh();
  }

  /** The page's or the clock's one button. */
  /** D16: C on the Boss page: the Charters (locked until a Dominion run is finished; the page says so). */
  private openCharters(): void {
    if (this.screen !== 'setup' || this.setup.page !== 'boss') return;
    // The Turn starts as it is: one Grunt, the warehouse.
    if (services().session.run?.story.flags[TURN_FLAG] === 'pending') this.setup = { ...this.setup, problem: DOMINION_DATA.charters.turn.text };
    else this.setup = { ...this.setup, page: 'charter', problem: null };
    this.view?.refresh();
  }

  private next(): void {
    if (this.screen === 'setup' && this.setup.page === 'charter') {
      const d = this.setup, c = DOMINION_DATA.charters.charters[d.cAt];
      const problem = !c ? 'Pick a Charter.' : services().session.dominionStart({ types: [c.types[0], c.types[1]], member: 'admin', look: 0, charter: c.id, ...this.tutSetup() });
      if (problem) this.setup = { ...d, problem };
      else {
        this.screen = 'opening';
        this.shown = 1;
      }
      return this.view?.refresh();
    }
    if (this.screen === 'setup') {
      const d = this.setup;
      const i = SETUP_PAGES.indexOf(d.page as (typeof SETUP_PAGES)[number]);
      if (d.page === 'types' && d.types.length !== 2) this.setup = { ...d, problem: 'Pick two Team Types.' };
      else if (i < SETUP_PAGES.length - 1) this.setup = { ...d, page: SETUP_PAGES[i + 1]!, problem: null };
      else {
        const problem = services().session.dominionStart({ types: [d.types[0]!, d.types[1]!], member: d.member, look: d.look, ...this.tutSetup() });
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
      r5run: () => { const b = this.block(); return b ? r5Run(this, b) : null; },
    };
  }

  /** The page on screen, as the board and the wheel name it (null before the run opens). */
  private navHere(): PageId | null {
    const b = this.block();
    if (!b?.opened || !this.inRun()) return null;
    if (this.menu.owns()) { const mp = this.menu.page!; return mp === 'menu' || mp === 'settings' ? mp : 'menu'; }
    if (this.police.owns()) return 'police';
    if (this.end.owns()) return null;
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
    if (to === 'settings' || to === 'rotom') return this.menu.go(to === 'rotom' ? 'rotom' : 'set');
    this.menu.close();
    // Leave the page you are on the way its own keys would (overlays and sub-pages closed), from the HQ.
    if (this.voices.on) this.voices.close();
    if (this.screen === 'crew' || this.screen === 'assign') this.crew.tab(0);
    else if (this.res.owns()) this.res.tab(0);
    else if (this.sq.owns()) this.sq.tab(0);
    this.screen = 'hq';
    this.notice = null;
    this.garage = false;
    switch (to) {
      case 'map': return this.tab(1);
      // D29's pages: the District file for the district under the map's cursor, and Assign on the Morning's task.
      case 'district': this.tab(1); return this.openDistrict();
      case 'assign': this.notice = this.crew.assignHere(); break;
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
      case 'empire': this.em.open('hq'); break;
      case 'partners': this.pt.open(); break;
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
  /** Redesign R8: the Boss's picture at a height, and name. */
  r8Boss(h: number): string {
    return bossPic(this.files?.boss.file ?? null, h);
  }
  bossName(): string {
    return this.files?.boss.name ?? 'Boss';
  }
  /** Redesign R8: the boat leaves from the region's harbour. */
  harbour(): string {
    const H: Record<string, string> = { kanto: 'Vermilion', johto: 'Olivine', hoenn: 'Slateport', sinnoh: 'Canalave', unova: 'Castelia', kalos: 'Coumarine', alola: 'Hau’oli', galar: 'Hulbury', paldea: 'Porto Marinada' };
    return `${H[this.block()?.realm?.at ?? 'kanto'] ?? 'The'} harbour`;
  }
  /** Redesign R8: the Gym case's "Plan" opens that Gym's district file on the map. */
  planDistrict(id: string): void {
    this.tab(1);
    if (this.cursor) this.cursor = { ...this.cursor, district: id, target: 0, focus: 'map' };
    this.openDistrict();
    this.view?.refresh();
  }
  /** The Boss's sprite on the release page. */
  bossLook(): string | null {
    return this.files?.boss.file ?? null;
  }
  /** D9: an answer on the Rival File (saved). */
  rivalStep(action: DominionAction): { ok: boolean; fight: boolean; notice: string | null } {
    return services().session.dominionStep(action);
  }
  /** D17: the books are closed: the run is over, and the run-end page pays it. */
  closeBooks(): void {
    this.leaving = true;
    this.scene.start('GameOver');
  }
  /** D16: a choice on the Partnership page (saved). */
  partnerStep(action: DominionAction): { ok: boolean; fight: boolean; notice: string | null } {
    return services().session.dominionStep(action);
  }
  /** D14: a choice on the Takeover page (saved). */
  takeoverStep(action: DominionAction): { ok: boolean; fight: boolean; notice: string | null } {
    const out = services().session.dominionStep(action);
    if (out.ok && !out.fight) this.tk.maybeBroadcast();
    return out;
  }
  /** D15: after leaving a region, its opening scene (the new region's arrival). */
  openOpening(): void {
    this.screen = 'opening';
    this.shown = 1;
    this.notice = null;
    this.view?.refresh();
  }
  /** D15: the Takeover page's "Leave" opens the Leaving page. */
  openLeave(): void {
    if (this.block() && completion(this.block()!)) return void (this.end.open() && this.view?.refresh());
    if (this.em.open('takeover', true)) this.view?.refresh();
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
    } else if (i === 4 && b) {
      // Redesign R4: the Jobs tab is the Job board (mockup `jobs`).
      this.screen = 'map';
      this.cursor = this.cursor ?? newCursor(b);
      return this.jx.openBoard();
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

  // ---------- Redesign R4: the Card and Pick the crew (pass 50, mockups `card` and `crewpick`) ----------

  /** The Card: who goes (the first member brought, else the Boss), the target's Pokémon, a line from the crew. */
  private cardPage(b: DominionBlock, c: CardModel): string {
    const run = r5Run(this, b);
    const going = this.cursor?.bring.map((id) => b.members.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => !!m) ?? [];
    const who: string[] = going.slice(0, 2).map((m) => memberPerson(m, b, 64).pic);
    if (!going.length) who.push(bossPic(this.files?.boss.file ?? null, 64));
    if (c.battle?.species) who.push(monPic(this, c.battle.species, 64));
    const talker = going[0] ?? b.members[0];
    return r5Card(c, {
      who: who.filter(Boolean),
      speaker: talker ? memberSpeaker(talker, b) : null,
      line: c.note && !c.opts.length ? c.note : going.length ? 'Say the word, Boss.' : 'Going alone, Boss? Press B to take one of us.',
      showOdds: services().session.settings.expansion.dominionPrefs.showOdds,
    }, run, this.cardLesson());
  }

  /** The tutorial's lesson on the Card (mockup `lessonjob`), drawn inside the page when it is due. */
  private cardLesson(): string {
    const ov = this.tut.overlay('card');
    return ov.startsWith('<div data-r5in') ? ov : '';
  }

  private openCrewPick(): void {
    if (this.screen !== 'card' || !this.cardOf() || !this.block()?.members.length) return;
    this.cp.open();
    this.view?.refresh();
  }

  private crewPickPage(b: DominionBlock): string {
    const c = this.cursor, card = this.cardOf();
    if (!c || !card) return '';
    const id = gridPages(b)[c.page]?.[c.at];
    const def = id ? actionDef(id) : undefined;
    const stat = def?.stat && def.stat !== 'all' ? def.stat : null;
    const d = DOMINION_DATA.field.districts.find((x) => x.id === c.district);
    const alone = cardModel(b, services().session.run!, id!, d?.targets[c.target]?.id ?? null, c.district, [], c.opt)?.chance ?? card.chance;
    const STAT = stat ? `${stat[0]!.toUpperCase()}${stat.slice(1)}` : '';
    const cells: R5CrewCell[] = b.members.map((m) => {
      const with1 = card.roll ? (cardModel(b, services().session.run!, id!, d?.targets[c.target]?.id ?? null, c.district, [m.id], c.opt)?.chance ?? alone) - alone : 0;
      const out = m.crew?.out;
      const p = memberPerson(m, b, 64);
      return {
        id: m.id, name: m.name, pic: p.pic, colour: p.colour,
        stars: DOMINION_DATA.pyramid.ranks.find((r) => r.id === m.rank)?.band ?? 1,
        line: [stat ? `${STAT} ${m.stats[stat]}` : `Lv ${m.level}`, out ? (out.why === 'jail' ? 'in jail' : out.why === 'held' ? 'held by a rival' : 'resting') : card.roll ? `${with1 >= 0 ? '+' : '−'}${Math.abs(with1)}%` : ''].filter(Boolean).join(' · '),
        picked: c.bring.includes(m.id),
        tag: out ? 'Out' : null,
      };
    });
    return r5CrewPick({ job: card.title, most: card.squad, stat: STAT, cells, at: this.cp.at, note: this.cp.note ?? (c.bring.length ? `Bringing ${card.brought.join(', ')} · Esc back to the Card` : 'Nobody picked: the Boss goes alone.') }, r5Run(this, b));
  }

  /** Picks or drops a member for this Card (the cursor's bring list; Do it takes them). */
  private crewPick(i: number): void {
    const b = this.block(), c = this.cursor, card = this.cardOf(), m = b?.members[i];
    if (!c || !card || !m) return;
    this.cp.at = i;
    const t = CrewPick.toggle(c.bring, m.id, card.squad);
    this.cp.note = t.full ? `${card.squad} at most on this job. Drop one first.` : null;
    this.cursor = { ...c, bring: t.bring };
    this.view?.refresh();
  }

  private crewPickKey(a: InputAction): void {
    const n = this.block()?.members.length ?? 0;
    if (a === 'back') this.cp.close();
    else if (a === 'confirm') return this.crewPick(this.cp.at);
    else if (a === 'up' || a === 'down' || a === 'left' || a === 'right') this.cp.move(a, n);
    this.view?.refresh();
  }

  /** Redesign R4: the Boss card (mockup `tcard`). Everything on it is read from the run. */
  private bossCardPage(b: DominionBlock): string {
    const run = r5Run(this, b), g = bossMenuModel(b, 0, { card: null, slot: 1 }).glance;
    const seed = services().session.run?.seed ?? '';
    let h = 7;
    for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 100000;
    const lv = DOMINION_DATA.hq.levels[b.hqLevel - 1]?.name ?? '';
    const owned = ownedGyms(b);
    const next = DOMINION_DATA.growth.gyms.find((x) => !owned.includes(x.id))?.id;
    const best = Object.entries(b.field.mastery).sort((x, y) => y[1] - x[1])[0];
    const bestDef = best ? actionDef(best[0]) : undefined;
    const stats = b.field.edge.stats;
    const m = b.members[0];
    return r5BossCard({
      name: this.files?.boss.name ?? 'Boss',
      idNo: String(h).padStart(5, '0'),
      pic: bossPic(this.files?.boss.file ?? null, 150),
      facts: [['Name', (this.files?.boss.name ?? 'Boss').toUpperCase()], ['Level', `HQ Lv ${b.hqLevel}${lv ? ` · ${lv}` : ''}`], ['Money', run.funds], ['Crew', `${b.members.length} of ${b.rosterCap}`], ['Heat', `${b.heat}%`], ['Day', String(b.day)]],
      goal: { pct: g.goalPct, label: `${g.goalPct}% · ${g.goal.replace(/^Goal · /, '')}` },
      gyms: DOMINION_DATA.growth.gyms.map((x) => ({ k: `bd-${x.type}`, who: owned.includes(x.id) ? 'nova' as const : x.id === next ? 'next' as const : 'free' as const, name: `${x.leader} · ${x.badge} Badge` })),
      back: [
        ['Skills', (Object.keys(stats) as (keyof typeof stats)[]).map((k) => `${k[0]!.toUpperCase()}${k.slice(1)} ${stats[k]}`).join(' · ')],
        ['Best job', bestDef && best![1] > 0 ? `${bestDef.name} · Lv ${masteryLevel(best![1])} (${DOMINION_DATA.field.mastery.names[masteryLevel(best![1]) - 1] ?? ''})` : 'None yet'],
        ['Hero', g.hero ? `${g.hero.name} · Threat ${g.hero.threat}` : 'No Hero on your trail yet'],
        ['Gyms', `${owned.length} of ${DOMINION_DATA.growth.gyms.length} yours`],
      ],
      speaker: m ? memberSpeaker(m, b) : null,
      line: owned.length ? `“${owned.length} Gym${owned.length === 1 ? '' : 's'} and counting. Not bad, Boss.”` : '“No Gyms yet, Boss. Give it time.”',
    }, run);
  }

  /** People for the job moments (order, done, botched): the Boss and the member who went. */
  private newJx(): JobsX {
    return new JobsX({
      block: () => this.block() ?? null,
      refresh: () => this.view?.refresh(),
      people: () => this.r4People(),
      input: () => {
        const b = this.block(), c = this.cursor;
        const id = b && c ? gridPages(b)[c.page]?.[c.at] : undefined;
        const d = c ? DOMINION_DATA.field.districts.find((x) => x.id === c.district) : undefined;
        return id && c && d ? { action: id, target: d.targets[c.target]?.id ?? null, district: d.id, bring: c.bring, opt: c.opt } : null;
      },
      setOpt: (opt) => { if (this.cursor) this.cursor = { ...this.cursor, opt }; this.view?.refresh(); },
      take: (j) => {
        const b = this.block();
        if (!b) return;
        const pages = gridPages(b);
        const page = pages.findIndex((p) => p.includes(j.action));
        const d = DOMINION_DATA.field.districts.find((x) => x.id === j.district);
        if (page < 0 || !d) return;
        this.screen = 'map';
        this.cursor = { ...(this.cursor ?? newCursor(b)), district: d.id, target: Math.max(0, d.targets.findIndex((t) => t.id === j.target)), page, at: pages[page]!.indexOf(j.action), focus: 'grid', bring: [], opt: null };
        this.openCard('map');
      },
      doIt: (live) => this.doIt(live),
      toMap: () => { const b = this.block(); this.screen = 'map'; if (b) this.cursor = this.cursor ?? newCursor(b); this.view?.refresh(); },
      monPic: (sp, h) => monPic(this, sp, h),
      bossPic: (h) => bossPic(this.files?.boss.file ?? null, h),
      say: (line) => this.job.say(line),
    });
  }

  private r4People(): { run: R5Run; boss: R5Person; member: (id: string | null, name?: string) => R5Person | null } | null {
    const b = this.block();
    if (!b) return null;
    return {
      run: r5Run(this, b),
      boss: bossPerson(this.files?.boss.name ?? 'Boss', this.files?.boss.file ?? null),
      member: (id, name) => {
        const m = b.members.find((x) => (id && x.id === id) || (name && x.name === name)) ?? null;
        return m ? memberPerson(m, b, 250, true) : null;
      },
    };
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

  private doIt(live?: LiveAnswer): void {
    const b = this.block(), c = this.cursor, card = this.cardOf();
    if (!b || !c || !card) return;
    if (card.blocked) return this.view?.refresh();
    const id = gridPages(b)[c.page]![c.at]!;
    const d = DOMINION_DATA.field.districts.find((x) => x.id === c.district)!;
    const input = { action: id, target: d.targets[c.target]?.id ?? null, district: d.id, bring: c.bring, opt: card.opt };
    // Redesign R4 (mockup `live`): on a stealth job something may happen first; the answer comes back here.
    if (!live && this.jx.maybeLive(input)) return;
    const before = structuredClone(b);
    const out = services().session.dominionStep({ t: 'act', ...input, ...(live ? { live } : {}) });
    this.screen = this.cardFrom;
    this.notice = out.notice;
    // A Smoke Ball: a clean escape, nothing rolled; the line shows on the Map.
    if (live === 'smoke' && out.ok && !out.roll) {
      this.autoEnd();
      return void this.view?.refresh();
    }
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

  /** R6: the event pages' host (the street meeting). */
  private newEvents(): EventPages {
    return new EventPages(this, { refresh: () => this.view?.refresh(), fight: () => this.fight('map'), block: () => this.block() ?? null, onMap: () => this.screen === 'map' && this.inRun() });
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
      if (this.setup.page === 'charter' || this.setup.page === 'hall') {
        this.setup = { ...this.setup, page: this.setup.page === 'hall' ? 'charter' : 'boss', problem: null };
        return this.view?.refresh();
      }
      const i = SETUP_PAGES.indexOf(this.setup.page as (typeof SETUP_PAGES)[number]);
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

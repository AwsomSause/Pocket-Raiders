// Evil Mode (design plans/evil-mode, build plan slice 1 "the shell"): Founding, then the day's frame.
// The scene is the controller: it keeps the founding draft and the input, and asks the session to found the team or
// step the day (saved at the end of every beat). Evil Mode is drawn in the New look only: with Old selected, the New
// layer is mounted for this screen and one line says so; the setting itself is never changed.

import Phaser from 'phaser';
import { getArchetype } from '../core/archetypes';
import { BEAT_END } from '../core/evilMode/day';
import { EVIL_DATA } from '../core/evilMode/data';
import { allSuggestions, choiceOf, FOUNDING_PAGES, foundingModel, frameModel, LOOK_ROWS, moveLine, newDraft, pageReady, turnLook, type FoundingDraft, type LookRow } from '../core/evilMode/screens';
import type { EvilAction } from '../core/evilMode/day';
import { pokemonAssetIds, type AssetManifest } from '../assets/catalog';
import { services } from '../game/services';
import { onInputAction, type InputAction } from '../ui/input';
import { rxFileOf } from '../ui/redux/assets';
import { mountRedux, reduxOn, type ReduxView } from '../ui/redux/stage';
import { charterView, foundingView, frameView, turnView } from '../ui/redux/screens/evilFounding';
import { charterTabModel, chartersOpen, houseActs, meetingModel, type MeetAnswer } from '../core/evilMode/charters';
import { flameAt } from '../core/evilMode/fires';
import { boardView } from '../ui/redux/screens/evilBoard';
import { crossActOf, crossingModel } from '../core/evilMode/crossing';
import { boardModel, dispatchRows, methodsShown, newDispatch, type DispatchDraft } from '../core/evilMode/boardScreens';
import { JOB_METHODS, type JobMethod } from '../core/evilMode/schema';
import { GAME_WIDTH } from '../ui/theme';
import { gateKey, gateSeen, openGate, otherWay, type CardGate } from '../core/evilMode/card';
import { jobProblem } from '../core/evilMode/dispatch';
import type { JobDraft } from '../core/evilMode/odds';
import type { StoredCard } from '../core/evilMode/schema';
import { cardModel, LEDGER_ACTS, ledgerModel, newLedger, type LedgerDraft } from '../core/evilMode/ledgerScreens';
import { cardView, filedCorner, ledgerView } from '../ui/redux/screens/evilLedger';
import { applicantActs, faceOf, isQuestionAct, newRoster, personActs, refusalModel, rosterModel, type RosterDraft } from '../core/evilMode/rosterScreens';
import { moleSceneView, officeView, refusalView, rosterView, suspicionsView } from '../ui/redux/screens/evilRoster';
import { moleSceneModel, suspicionsModel, type MoleAnswer } from '../core/evilMode/mole';
import type { StayReason } from '../core/evilMode/quest';
import { fileModel } from '../core/evilMode/heroScreens';
import { fileView } from '../ui/redux/screens/evilFile';
import { newNight, nightModel, type NightDraft } from '../core/evilMode/nightScreens';
import { nightView } from '../ui/redux/screens/evilNight';
import { lineModel } from '../core/evilMode/lineScreens';
import { gymView } from '../ui/redux/screens/evilGym';
import { neighbourView } from '../ui/redux/screens/evilNeighbour';
import { schemeView } from '../ui/redux/screens/evilScheme';
import { edgesView } from '../ui/redux/screens/evilEdges';
import { edgesModel } from '../core/evilMode/edgesScreens';
import { edgesTabShown, tearChip } from '../core/evilMode/edges';
import { schemeModel } from '../core/evilMode/schemeScreens';
import { neighbourModel } from '../core/evilMode/neighbourScreens';
import { gymModel } from '../core/evilMode/gymScreens';
import { newTrade, tradeModel, type TradeSel } from '../core/evilMode/tradeScreens';
import { tradeView } from '../ui/redux/screens/evilTrade';
import { lineView } from '../ui/redux/screens/evilLine';
import { baseView } from '../ui/redux/screens/evilBase';
import { BASE_TABS, baseModel, newBaseSel, type BaseSel } from '../core/evilMode/baseScreens';
import { raidOn } from '../core/evilMode/raid';
import { LINE_IDS } from '../core/evilMode/schema';
import { crossers } from '../core/evilMode/people';
import { roadChoice, roadForced, roadModel } from '../core/evilMode/roadScreens';
import { roadView } from '../ui/redux/screens/evilRoad';
import { barkView, postView } from '../ui/redux/screens/evilPost';
import { postAction, postModel } from '../core/evilMode/voiceScreens';
import { bark, type BarkMoment } from '../core/evilMode/voice';
import { cardsOf } from '../core/evilMode/pack';

/** Keys that confirm (input.ts KEY_MAP), read raw on the Card so a held key can be told from a press. */
const CONFIRM_CODES = new Set(['Enter', 'NumpadEnter', 'Space', 'KeyZ']);

type OpenCard = { job: JobDraft; gate: CardGate; scroll: number } | { read: StoredCard; scroll: number };

export class EvilScene extends Phaser.Scene {
  private view: ReduxView | null = null;
  private draft: FoundingDraft = newDraft();
  private disp: DispatchDraft = newDispatch();
  /** Slice 22: on a phone, which edge tab is slid in (the day's text on the left, the holding on the right). */
  private rail: '' | 'left' | 'right' = '';
  private notice: string | null = null;
  private input_: HTMLInputElement | null = null;
  private leaving = false;
  /** The Honest Card overlay (slice 3): a job being confirmed, or a kept Card read from the Ledger. */
  private card: OpenCard | null = null;
  private ledger: LedgerDraft | null = null;
  /** The last line filed, shown in the Ledger's corner. */
  private filed: string | null = null;
  private cardOpenedAt = 0;
  /** Slice 4: the Roster (and the Office inside it), and the cursor on the yard's three answers. */
  private roster: RosterDraft | null = null;
  /** Slice 17: the Suspicions page's chosen card, or null when it's shut. */
  private susp: number | null = null;
  private refuseSel = 0;
  /** Slice 5: the File's open tab, or null when it's shut. */
  private file: number | null = null;
  /** Slice 7: the Office at Night; who answered the door last (for their reply). */
  private night: NightDraft = newNight();
  private lastWho: { name: string; ref: string | null } | null = null;
  /** Slice 6: the Line page's chosen stop, or null when it's shut; when a hold to confirm began, and the timer that redraws it. */
  private line: number | null = null;
  private lineHeldAt: number | null = null;
  private lineTimer: Phaser.Time.TimerEvent | null = null;
  /** Slice 8: the Gym page's chosen door, or null when it's shut. */
  private gym: number | null = null;
  /** Slice 11: the Trade page's tab, row and street/holding, or null when it's shut. */
  private trade: TradeSel | null = null;
  /** Slice 13: the neighbour page's chosen row, or null when it's shut. */
  private nb: number | null = null;
  /** Slice 14: the Scheme page's chosen row, or null when it's shut. */
  private sc: number | null = null;
  /** Slice 21: the Edges page's selected row, or null when closed. */
  private edge: number | null = null;
  /** Slice 10: the Base page's tab, square and option, or null when it's shut (Walk it and a Raid hold it open). */
  private base: BaseSel | null = null;
  /** Slice 12: the Road page's picked choice (null: closed), the typed line's box, and the region whose last room was seen out. */
  private road: number | null = null;
  /** Slice 18: the post page's chosen button (null: closed); the beat's bark, and the lines already said this district (never saved). */
  private post: number | null = null;
  private barkAt = '';
  private barked: { name: string; line: string } | null = null;
  private barkSaid = new Set<string>();
  private saidIn = '';
  private own_: HTMLInputElement | null = null;
  private roomSeen: number | null = null;
  private bgOf: (id: string) => string | null = () => null;
  /** Slice 22: the Charters tab (its row and confirm), and the Turn card's button and confirm. */
  private charter: { at: number; confirming: boolean } | null = null;
  private turnSel = 0;
  private turnConfirm = false;

  constructor() {
    super('Evil');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#141414');
    this.draft = newDraft();
    this.disp = newDispatch();
    this.notice = null;
    this.leaving = false;
    this.card = null;
    this.ledger = null;
    this.filed = null;
    this.roster = null;
    this.susp = null;
    this.refuseSel = 0;
    this.file = null;
    this.night = newNight();
    this.lastWho = null;
    this.line = null;
    this.lineHeldAt = null;
    this.lineTimer = null;
    this.gym = null;
    this.trade = null;
    this.nb = null;
    this.sc = null;
    this.edge = null;
    this.base = null;
    this.road = null;
    this.post = null;
    this.barkAt = '';
    this.barked = null;
    this.barkSaid = new Set();
    this.saidIn = '';
    this.roomSeen = null;
    this.charter = null;
    this.turnSel = 0;
    this.turnConfirm = false;
    const { session } = services();
    if (!session.run) return void this.scene.start('MainMenu');
    session.evilEnsure();
    const manifest = this.cache.json.get('manifest') as AssetManifest | undefined;
    const run = session.run;
    const archetype = getArchetype(session.content, run.archetypeId);
    const lead = run.party[0];
    const species = lead ? session.content.species.get(lead.speciesId) : undefined;
    const bossFile = rxFileOf(manifest, archetype.spriteAssetId)?.file ?? null;
    const starterFile = species ? rxFileOf(manifest, pokemonAssetIds(species.assets).front)?.file ?? null : null;
    const oldLook = !reduxOn();
    this.bgOf = (id) => rxFileOf(manifest, id)?.file ?? null;
    this.view = mountRedux(this, {
      render: (c) => {
        const r = services().session.run;
        const block = r?.expansion?.evilMode;
        // Slice 15: an ending holds the screen even with no district laid.
        if (block?.ending && !block.district) {
          const em = roadModel(block);
          return frameView(c, frameModel(block, archetype.name), null, em ? roadView(em, this.road ?? 0, this.notice) : '');
        }
        if (block?.district) {
          const frame = frameModel(block, archetype.name);
          // Slice 22: the fire reminder (Settings), a Morning line while the flame's on the road.
          if (block.here.beat === 'morning' && services().session.settings.expansion.evilFireReminder && block.district && flameAt(block) !== null) frame.chips = [...frame.chips, `A fire's lit on the road, step ${flameAt(block)}. A fire missed is gone.`];
          // The Card takes the whole stage; the frame falls away (design Part 29 section 3).
          if (this.card) return cardView(cardModel(block, this.card), block.team.look.a, block.team.look.b);
          if (block.district.end && block.region.crossing) frame.button = 'The Crossing';
          else if (block.district.end) frame.button = EVIL_DATA.region.on && block.region.phase === 'tally' ? (block.here.stage >= 8 ? 'The end' : 'The Road') : EVIL_DATA.region.on && block.region.phase === 'road' ? 'Go on' : 'Leave';
          const ledger = this.ledger ? ledgerView(ledgerModel(block, this.ledger)) : undefined;
          const rm = this.roster ? rosterModel(block, this.roster) : null;
          const roster = rm ? rosterView(rm) : undefined;
          const fm = this.file !== null ? fileModel(block, this.file, this.heroTeam(), (id) => services().session.content.species.get(id)?.name ?? id) : null;
          const file = fm ? fileView(fm) : undefined;
          const line = this.line !== null && !ledger && !roster && !file ? lineView(lineModel(block, this.line), this.lineHeldAt === null ? null : Math.min(1, (this.time.now - this.lineHeldAt) / 2000), this.notice) : undefined;
          const gm = this.gym !== null && !ledger && !roster && !file && !line ? gymModel(block, this.gym) : null;
          const gym = gm ? gymView(gm, this.notice) : undefined;
          const tm = this.trade !== null && !ledger && !roster && !file && !line && !gym ? tradeModel(block, this.trade) : null;
          const trade = tm ? tradeView(tm, this.notice) : undefined;
          // Slice 13: the neighbour page; a Sit-Down going on keeps it open.
          const nm = (this.nb !== null || block.neighbour?.sitting) && !ledger && !roster && !file && !line && !gym && !trade ? neighbourModel(block, this.nb ?? 0) : null;
          const nbPage = nm ? neighbourView(nm, this.notice) : undefined;
          // Slice 14: the Scheme page; a heist's rooms keep it open.
          const smod = (this.sc !== null || block.scheme?.heist?.stage === 'rooms') && !block.fight && !ledger && !roster && !file && !line && !gym && !trade && !nbPage ? schemeModel(block, this.sc ?? 0) : null;
          const scPage = smod ? schemeView(smod, this.notice) : undefined;
          // Slice 21: the Edges page (I; U is slice 22's house rule, J slice 17's Suspicions).
          const em = this.edge !== null && !block.fight && !ledger && !roster && !file && !line && !gym && !trade && !nbPage && !scPage && this.susp === null ? edgesModel(block, this.edge) : null;
          const edPage = em ? edgesView(em, this.notice) : undefined;
          const edTag = edgesTabShown(block) || edPage ? tearChip(block) ?? 'Edges' : undefined;
          // Slice 17: the Suspicions page.
          const suspicions = this.susp !== null && !ledger && !roster && !file && !line && !gym && !trade && !nbPage && !scPage ? suspicionsView(suspicionsModel(block, this.susp), this.notice) : undefined;
          // Slice 10: the Base page. Walk it and a Raid hold it open over everything else.
          const bsel = this.baseSel();
          const bm = bsel && (this.baseForced() || (!ledger && !roster && !file && !line && !gym && !trade && !nbPage && !scPage && !edPage)) ? baseModel(block, bsel) : null;
          const base = bm ? baseView(bm, this.notice, bm.bg ? this.bgOf(bm.bg) : null) : undefined;
          // Slice 18: the post page (P), like the other pages.
          const pm = this.post !== null && !ledger && !roster && !file && !line && !gym && !trade && !nbPage && !scPage && !base ? postModel(block) : null;
          const postPage = pm ? postView(pm, Math.min(this.post ?? 0, pm.acts.length - 1), this.notice) : undefined;
          if (block.fight) frame.button = 'Fight';
          // Slice 12: the fire and the last room hold the screen; the Road page (O) takes the board's place like the File.
          const forced = this.roadOn();
          const rdm = forced || (this.road !== null && !ledger && !roster && !file && !line && !gym && !base) ? roadModel(block, this.roomSeen === block.here.region) : null;
          // The fire's and the room's own lines are already on the page: only a refusal is said again under them.
          const road = rdm ? roadView(rdm, this.road ?? 0, this.notice && !rdm.lines.includes(this.notice) ? this.notice : null) : undefined;
          if (forced && road) return frameView(c, frame, this.notice, `<div style="--team-a:${block.team.look.a};--team-b:${block.team.look.b}">${boardView(boardModel(block, this.disp, EVIL_DATA, { seed: services().session.settings.expansion.evilRollSeed }), frame, this.notice, { road, filed: filedCorner(this.filed) })}</div>`);
          // An order across a line is answered in the yard before anything else moves (Part 7 section 11.1).
          const yard = refusalModel(block);
          const ms = moleSceneModel(block);
          const over = yard ? refusalView(yard, this.refuseSel) : ms ? moleSceneView(ms, faceOf(ms.ref)) : rm?.office ? officeView(rm.office) : '';
          const look = `<div style="--team-a:${block.team.look.a};--team-b:${block.team.look.b}">`;
          // Slice 7: at Night the Office takes the board's place (design Part 29 section 11).
          const night = block.here.beat === 'night' && !block.district.end && !ledger && !roster && !file && !line && !gym && !base && !trade && !nbPage && !scPage && !road && !suspicions && !edPage && !postPage ? nightView(nightModel(block, this.night, this.lastWho), this.notice) : undefined;
          return frameView(c, frame, this.notice, `${look}${boardView(boardModel(block, this.disp, EVIL_DATA, { seed: services().session.settings.expansion.evilRollSeed }), frame, this.notice, { rail: this.rail, ...(ledger ? { ledger } : {}), ...(roster && !ledger ? { roster } : {}), ...(file && !ledger && !roster ? { file } : {}), ...(line ? { line } : {}), ...(gym ? { gym } : {}), ...(trade ? { trade } : {}), ...(nbPage ? { neighbour: nbPage } : {}), ...(scPage ? { scheme: scPage } : {}), ...(suspicions ? { suspicions } : {}), ...(edPage ? { edges: edPage } : {}), ...(edTag ? { edgesTag: edTag } : {}), ...(base ? { base } : {}), ...(road ? { road } : {}), ...(postPage && !road ? { post: postPage } : {}), ...(night ? { night } : {}), filed: filedCorner(this.filed) })}${over}${!night && !postPage && !road && !ledger && !roster && !file && !line && !gym && !trade && !nbPage && !scPage && !base && !yard && !suspicions && !edPage ? barkView(this.barkFor(block)) : ''}</div>`);
        }
        if (block) return frameView(c, frameModel(block, archetype.name), this.notice);
        // Slice 22: a main-game run that won its takeover sees the Turn's card here; a new team may take a Charter.
        const offer = services().session.evilTurnOffer();
        if (offer && r && r.rules.modeId !== 'evil-mode') return turnView(c, offer, this.turnConfirm, oldLook, this.turnSel);
        if (this.charter) return charterView(c, charterTabModel(this.charter.at, this.charter.confirming));
        return foundingView(c, foundingModel(this.draft, { bossName: archetype.name, bossFile, starter: species?.name ?? '—', starterFile, oldLook, length: services().session.settings.expansion.evilRunLength }));
      },
      acts: {
        pick: (i) => this.pick(Number(i)),
        charters: () => this.openCharters(),
        charterPick: (i) => { if (this.charter) this.charter = { at: Number(i), confirming: false }; this.view?.refresh(); },
        charterBack: () => { this.charter = null; this.syncInput(); this.view?.refresh(); },
        charterTake: () => this.takeCharter(),
        house: (i) => this.houseAct(Number(i)),
        meet: (k) => this.meet(String(k) as MeetAnswer),
        rail: (k) => { this.rail = this.rail === k ? '' : (String(k) as 'left' | 'right'); this.view?.refresh(); },
        turnTake: () => { this.turnSel = 0; this.turnChoose(); },
        turnWalk: () => { this.turnSel = 1; this.turnChoose(); },
        next: () => this.next(),
        back: () => this.back(),
        suggest: (n) => this.setName(n),
        advance: () => this.advance(),
        cell: (i) => this.cell(Number(i)),
        crew: (id) => this.toggleCrew(id),
        how: () => this.toHow(),
        // Slice 22: on a phone a method's tap opens the Card straight away once somebody's picked: where, who, how, confirm.
        method: (i) => { this.disp = { ...this.disp, how: Number(i), step: 'how' }; if (document.body.classList.contains('rx-phone') && this.disp.squad.length) return this.openCard(false); this.view?.refresh(); },
        offer: (pct) => { this.disp = { ...this.disp, offer: Number(pct) }; this.view?.refresh(); },
        queue: () => this.openCard(false),
        cardConfirm: () => this.confirmCard(),
        cardClose: () => this.closeCard(),
        cardSwap: () => this.swapCard(),
        ledger: () => this.toggleLedger(),
        ltab: (i) => { if (this.ledger) this.ledger = { tab: Number(i), row: 0, act: null }; this.view?.refresh(); },
        lrow: (i) => { if (this.ledger) this.ledger = { ...this.ledger, row: Number(i), act: 0 }; this.view?.refresh(); },
        lact: (arg) => { const [i, j] = arg.split(':').map(Number); if (this.ledger) { this.ledger = { ...this.ledger, row: i!, act: j! }; this.ledgerAct(); } },
        lcard: (id) => this.readCard(id),
        roster: () => this.toggleRoster(),
        susp: () => this.toggleSuspicions(),
        urow: (i) => { if (this.susp !== null) this.susp = Number(i); this.view?.refresh(); },
        udo: (id) => this.suspicionsDo(id),
        mans: (id) => this.evil({ type: 'moleAnswer', answer: id as MoleAnswer }),
        rtab: (i) => { if (this.roster) this.roster = newRoster(Number(i)); this.view?.refresh(); },
        rrow: (i) => { if (this.roster && !this.roster.office) this.roster = { ...this.roster, row: Number(i), act: this.roster.row === Number(i) && this.roster.act !== null ? this.roster.act : 0 }; this.view?.refresh(); },
        ract: (arg) => { const [i, j] = arg.split(':').map(Number); if (this.roster) { this.roster = { ...this.roster, row: i!, act: j! }; this.rosterAct(); } },
        oanswer: (i) => this.officeAnswer(Number(i)),
        ocancel: () => { if (this.roster) this.roster = { ...this.roster, office: null }; this.view?.refresh(); },
        refuse: (id) => this.answer(id as 'withdraw' | 'swap' | 'insist' | 'shadowOrder'),
        nanswer: (i) => this.knockAnswer(Number(i)),
        nreply: () => this.replyNext(),
        ndesk: (i) => this.deskAct(Number(i)),
        nhear: (i) => this.hearOut(Number(i)),
        nwall: (i) => this.wallPick(Number(i)),
        ndown: (i) => this.wallDown(Number(i)),
        nkeep: () => { this.night = { ...this.night, confirm: null }; this.view?.refresh(); },
        clear: (id) => { services().session.evilStep({ type: 'clearJob', holdingId: id }); this.view?.refresh(); },
        file: () => this.toggleFile(),
        ftab: (i) => { if (this.file !== null) this.file = Number(i); this.view?.refresh(); },
        hold: () => this.hold(),
        unpost: (id) => { services().session.evilStep({ type: 'unpost', holdingId: id }); this.view?.refresh(); },
        go: (id) => this.goYourself(id),
        thing: (id) => { this.disp = { ...this.disp, thing: id as DispatchDraft['thing'] }; this.view?.refresh(); },
        line: () => this.toggleLine(),
        gym: () => this.toggleGym(),
        gdoor: (i) => { if (this.gym !== null) { this.gym = Number(i); this.view?.refresh(); } },
        gdo: () => this.gymDo(),
        trade: () => this.toggleTrade(),
        ttab: (i) => { if (this.trade) { this.trade = newTrade(Number(i)); this.notice = null; } this.view?.refresh(); },
        trow: (i) => { if (this.trade) this.trade = { ...this.trade, row: Number(i), pick: 0 }; this.view?.refresh(); },
        tpick: () => { if (this.trade) this.trade = { ...this.trade, pick: this.trade.pick + 1 }; this.view?.refresh(); },
        tbtn: (i) => this.tradeDo(Number(i)),
        nb: () => this.toggleNeighbour(),
        scheme: () => this.toggleScheme(),
        srow: (i) => { this.sc = Number(i); this.schemeDo(); },
        edges: () => this.toggleEdges(),
        erow: (i) => { this.edge = Number(i); this.view?.refresh(); },
        edo: () => this.edgesDo(),
        nrow: (i) => { this.nb = Number(i); this.neighbourDo(); },
        base: () => this.toggleBase(),
        btab: (i) => { if (this.base) { this.base = { ...this.base, tab: Number(i), opt: 0 }; this.view?.refresh(); } },
        bsq: (at) => this.baseSquare(at),
        bopt: (i) => { const s = this.baseSel(); if (s) { this.base = { ...s, opt: Number(i) }; this.view?.refresh(); } },
        bdo: () => this.baseDo(),
        bsite: (id) => this.baseAct({ type: 'pickSite', site: id }),
        bnight: (i) => { const b = this.block(); const n = b && this.base ? baseModel(b, this.base).night[Number(i)] : undefined; if (n) this.baseAct(n.action); },
        bwalk: () => this.baseAct({ type: 'walkIt' }),
        blatch: () => this.baseAct({ type: 'latch', on: !this.block()?.base?.latch }),
        bwarn: (id) => this.baseAct({ type: 'warnChoice', choice: id as 'move' | 'empty' | 'hold' | 'station' }),
        wclose: () => this.baseAct({ type: 'closeWalk' }),
        wfight: () => this.startFight(),
        rdoor: (o) => this.baseAct({ type: 'raidDoor', open: o === '1' }),
        rorder: (arg) => { const [wing, order] = arg.split(':'); this.baseAct({ type: 'raidOrder', wing: wing as never, order: order as never }); },
        rup: (id) => { const q = this.block()?.raid?.queue ?? []; const i = q.indexOf(id); if (i > 0) { const n = [...q]; [n[i - 1], n[i]] = [n[i]!, n[i - 1]!]; this.baseAct({ type: 'raidQueue', queue: n }); } },
        rturn: () => this.baseAct({ type: 'raidTurn' }),
        roffice: (id) => this.baseAct({ type: 'raidOffice', choice: id as 'battle' | 'charge' | 'pen' | 'window' }),
        rdone: () => this.baseAct({ type: 'raidDone' }),
        lookPrev: (id) => { this.draft = turnLook(this.draft, id as LookRow, -1); this.view?.refresh(); },
        lookNext: (id) => { this.draft = turnLook(this.draft, id as LookRow, 1); this.view?.refresh(); },
        stay: (id) => this.evil({ type: 'goOn', stay: id || null }),
        cross: (code) => { const c = crossActOf(code); if (c) this.evil({ type: 'cross', ...c }); },
        clock: (code) => this.evil(code === 'letter' ? { type: 'letter' } : code.startsWith('stop:') ? { type: 'stopClock', how: code === 'stop:boss' ? 'boss' : 'hero' } : { type: 'regionAct', code }),
        recall: (id) => this.evil({ type: 'recall', id }),
        road: () => this.toggleRoad(),
        post: () => this.togglePost(),
        pact: (code) => this.postDo(code),
        rpick: (id) => this.roadPick(id),
        rsay: (id) => this.roadPick(id, this.own_?.value ?? ''),
        lstop: (i) => { if (this.line !== null) { this.line = Number(i); this.cancelLineHold(); } },
      },
      overs: { over: (i) => { if (!this.founded()) { this.draft = { ...this.draft, at: Number(i) }; this.view?.refresh(); } } },
    });
    onInputAction(this, (a) => this.key(a));
    // The Card reads confirm keys raw: a held key (a repeat) scrolls and never confirms; confirm wants its own press.
    const kb = this.input.keyboard;
    const down = (e: KeyboardEvent) => this.rawKey(e, 'down');
    const up = (e: KeyboardEvent) => this.rawKey(e, 'up');
    kb?.on('keydown', down);
    kb?.on('keyup', up);
    const onScroll = (e: Event) => this.cardScrolled(e);
    this.view.el.addEventListener('scroll', onScroll, true);
    // Slice 6: the Line's button is pressed and held (a tap that lets go early cancels).
    const holdTarget = (e: Event) => !!(e.target as HTMLElement | null)?.closest?.('[data-hold]');
    this.view.el.addEventListener('pointerdown', (e) => { if (holdTarget(e)) this.startLineHold(); });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) this.view.el.addEventListener(ev, () => this.cancelLineHold());
    this.events.once('shutdown', () => { kb?.off('keydown', down); kb?.off('keyup', up); });
    this.events.on('postupdate', this.place, this);
    this.events.once('shutdown', () => {
      this.events.off('postupdate', this.place, this);
      this.dropInput();
      this.dropOwn();
    });
    this.syncInput();
    if (this.roadOn()) this.time.delayedCall(0, () => this.redrawRoad());
  }

  private founded(): boolean {
    return !!services().session.run?.expansion?.evilMode;
  }

  private key(a: InputAction): void {
    if (this.leaving) return;
    if (this.founded()) return this.dayKey(a);
    if (services().session.evilTurnOffer()) return this.turnKey(a);
    if (this.charter) return this.charterKey(a);
    const d = this.draft;
    if (a === 'confirm') return this.next();
    if (a === 'back') return this.back();
    if (d.page === 'line' && (a === 'left' || a === 'right')) return this.pick(['clean', 'grey', 'whatever'].indexOf(moveLine(d.line, a === 'left' ? -1 : 1)));
    // Slice 9: the Look page: Up/Down picks a row, Left/Right changes it.
    if (d.page === 'look') {
      if (a === 'up' || a === 'down') this.draft = { ...d, at: (d.at + (a === 'up' ? -1 : 1) + LOOK_ROWS.length) % LOOK_ROWS.length };
      if (a === 'left' || a === 'right') this.draft = turnLook(d, LOOK_ROWS[d.at]!, a === 'left' ? -1 : 1);
      return this.view?.refresh();
    }
    const n = d.page === 'creed' ? EVIL_DATA.creeds.length : d.page === 'doctrine' ? EVIL_DATA.doctrines.length : d.page === 'name' ? allSuggestions().length : d.page === 'patron' ? EVIL_DATA.region.patrons.length : d.page === 'region' ? EVIL_DATA.region.regions.length : 0;
    if (!n) return;
    // Cards sit in rows of three (Creeds, Patrons, tickets) or four (Doctrines); suggestions are one list.
    const row = d.page === 'creed' || d.page === 'patron' || d.page === 'region' ? 3 : d.page === 'doctrine' ? 4 : 1;
    const step = a === 'up' ? -row : a === 'down' ? row : a === 'left' ? -1 : a === 'right' ? 1 : 0;
    if (!step) return;
    const at = (d.at + step + n) % n;
    this.draft = { ...d, at };
    if (d.page === 'name') return this.setName(allSuggestions()[at]!);
    this.pick(at);
  }

  /** Choosing a card or a stop on the current page. */
  private pick(i: number): void {
    const d = this.draft;
    if (d.page === 'creed') this.draft = { ...d, at: i, creed: EVIL_DATA.creeds[i]?.id ?? d.creed };
    else if (d.page === 'doctrine') this.draft = { ...d, at: i, doctrine: EVIL_DATA.doctrines[i]?.id ?? d.doctrine };
    else if (d.page === 'line') this.draft = { ...d, at: i, line: (['clean', 'grey', 'whatever'] as const)[i] ?? d.line };
    else if (d.page === 'look') this.draft = { ...d, at: i };
    else if (d.page === 'patron') this.draft = { ...d, at: i, patron: EVIL_DATA.region.patrons[i]?.id ?? d.patron };
    // A ticket that isn't open yet can be looked at but not chosen.
    else if (d.page === 'region') {
      const r = EVIL_DATA.region.regions[i];
      this.draft = { ...d, at: i, region: r && r.status !== 'disabled' ? r.id : d.region };
    }
    this.view?.refresh();
  }

  // ---- Slice 22: Charters, the house rule, the Turn ----

  private openCharters(): void {
    if (this.founded()) return;
    this.charter = { at: 0, confirming: false };
    this.syncInput();
    this.view?.refresh();
  }

  private charterKey(a: InputAction): void {
    const c = this.charter!;
    const n = chartersOpen().length;
    if (a === 'back') { if (c.confirming) this.charter = { ...c, confirming: false }; else this.charter = null; this.syncInput(); return void this.view?.refresh(); }
    if (a === 'up' || a === 'down' || a === 'left' || a === 'right') this.charter = { at: (c.at + (a === 'up' || a === 'left' ? -1 : 1) + n) % n, confirming: false };
    if (a === 'confirm') return this.takeCharter();
    this.view?.refresh();
  }

  /** "Take it", then again to confirm (the same confirm as Found it). */
  private takeCharter(): void {
    const c = this.charter;
    if (!c) return;
    if (!c.confirming) { this.charter = { ...c, confirming: true }; return void this.view?.refresh(); }
    const id = chartersOpen()[c.at]?.id;
    const problem = id ? services().session.evilCharter(id) : 'Choose a Charter.';
    this.notice = problem;
    if (!problem) this.charter = null;
    this.syncInput();
    this.view?.refresh();
  }

  /** The Turn's first meeting: one of the three answers. */
  private meet(answer: MeetAnswer): void {
    const cues = services().session.evilStep({ type: 'turnMeet', answer });
    const said = cues.filter((x) => x.id === 'said' || x.id === 'refused');
    this.notice = said.length ? said.map((x) => (x.id === 'said' ? x.line : x.id === 'refused' ? x.reason : '')).join(' ') : null;
    this.view?.refresh();
  }

  /** The house rule's button (i), or the first that can be pressed (-1, the U key). */
  private houseAct(i: number): void {
    const block = this.block();
    if (!block) return;
    const acts = houseActs(block, undefined, { at: block.district?.holdings[this.disp.at]?.id ?? '' });
    const a = i < 0 ? acts.find((x) => !x.problem) : acts[i];
    if (!a) return;
    const cues = services().session.evilStep({ type: 'charterAct', act: a.act });
    const said = cues.find((x) => x.id === 'said' || x.id === 'refused');
    this.notice = said ? (said.id === 'said' ? said.line : said.id === 'refused' ? said.reason : null) : null;
    this.view?.refresh();
  }

  private turnKey(a: InputAction): void {
    if (a === 'left' || a === 'right' || a === 'up' || a === 'down') { this.turnSel = 1 - this.turnSel; this.turnConfirm = false; }
    else if (a === 'back') this.turnConfirm = false;
    else if (a === 'confirm') return this.turnChoose();
    this.view?.refresh();
  }

  /** Take the chair (with its confirm), or walk away: today's ending, and the map again. */
  private turnChoose(): void {
    const { session } = services();
    if (this.turnSel === 1) {
      session.evilWalkAway();
      this.leaving = true;
      return void this.scene.start('Map');
    }
    if (!this.turnConfirm) { this.turnConfirm = true; return void this.view?.refresh(); }
    this.turnConfirm = false;
    if (session.evilTurn()) this.scene.restart();
    else this.view?.refresh();
  }

  private setName(name: string): void {
    this.draft = { ...this.draft, name };
    if (this.input_) this.input_.value = name;
    this.view?.refresh();
  }

  private next(): void {
    const d = this.draft;
    if (!pageReady(d)) return;
    if (d.page === 'summary') {
      if (!d.confirming) {
        this.draft = { ...d, confirming: true };
        return this.view?.refresh();
      }
      const problem = services().session.evilFound(choiceOf(d));
      if (problem) this.notice = problem;
      this.syncInput();
      return this.view?.refresh();
    }
    const i = FOUNDING_PAGES.indexOf(d.page);
    const page = FOUNDING_PAGES[i + 1]!;
    const at = page === 'creed' ? Math.max(0, EVIL_DATA.creeds.findIndex((c) => c.id === d.creed)) : page === 'doctrine' ? Math.max(0, EVIL_DATA.doctrines.findIndex((x) => x.id === d.doctrine)) : page === 'line' ? ['clean', 'grey', 'whatever'].indexOf(d.line) : page === 'patron' ? Math.max(0, EVIL_DATA.region.patrons.findIndex((x) => x.id === d.patron)) : page === 'region' ? Math.max(0, EVIL_DATA.region.regions.findIndex((x) => x.id === d.region)) : 0;
    this.draft = { ...d, page, at, confirming: false };
    this.syncInput();
    this.view?.refresh();
  }

  private back(): void {
    const d = this.draft;
    if (d.confirming) {
      this.draft = { ...d, confirming: false };
      return this.view?.refresh();
    }
    const i = FOUNDING_PAGES.indexOf(d.page);
    // Back on the first page leaves (the run stays saved; Continue comes back to Founding).
    if (i === 0) return this.leave();
    this.draft = { ...d, page: FOUNDING_PAGES[i - 1]!, at: 0 };
    this.syncInput();
    this.view?.refresh();
  }

  /** The beat strip's button: ends the beat. When the district's over it leaves (the run is saved). */
  private advance(): void {
    const block = services().session.run?.expansion?.evilMode;
    if (!block) return;
    // Slice 9: after a district, Enter reads on: the tally, then the Road (leaving nobody), then the region's end.
    if (block.district?.end && EVIL_DATA.region.on && block.region.phase === 'tally') return this.evil({ type: 'toRoad' });
    if (block.district?.end && EVIL_DATA.region.on && block.region.phase === 'road') return this.evil({ type: 'goOn', stay: null });
    // Slice 16: at the Crossing, Enter takes the first open choice of the step.
    if (block.district?.end && block.region.crossing) {
      const first = crossingModel(block)?.choices.find((c) => !c.off);
      const c = first ? crossActOf(first.code) : null;
      if (c) return this.evil({ type: 'cross', ...c });
    }
    if (block.district?.end) return this.leave();
    if (block.fight) return this.startFight();
    const cues = services().session.evilStep({ type: BEAT_END[block.here.beat] });
    if (cues.some((c) => c.id === 'fight')) return this.startFight();
    const refused = cues.find((c) => c.id === 'refused');
    this.notice = refused && 'reason' in refused ? refused.reason : null;
    this.disp = { ...newDispatch(), at: this.disp.at };
    this.night = newNight();
    this.view?.refresh();
  }

  /** One region action (slice 9), then a redraw; a refusal shows as the notice. */
  private evil(action: EvilAction): void {
    const cues = services().session.evilStep(action);
    const refused = cues.find((c) => c.id === 'refused');
    const said = cues.find((c) => c.id === 'said');
    this.notice = refused && 'reason' in refused ? refused.reason : said && 'line' in said ? said.line : null;
    this.disp = newDispatch();
    this.view?.refresh();
  }

  private block() {
    return services().session.run?.expansion?.evilMode;
  }

  /** Keys on the Board and in Dispatch (design Part 29 section 18): every job can be built and queued without a pointer. */
  private dayKey(a: InputAction): void {
    if (this.card) return this.cardKey(a);
    if (this.block()?.refusal) return this.refusalKey(a);
    if (this.roadOn() || this.road !== null) return this.roadKey(a);
    if (this.ledger) return this.ledgerKey(a);
    // Slice 17: a scene in the Office takes Enter as its first answer.
    const scene = this.block() ? moleSceneModel(this.block()!) : null;
    if (scene && a === 'confirm') return this.evil({ type: 'moleAnswer', answer: scene.answers[0]!.id });
    if (this.roster) return this.rosterKey(a);
    if (this.susp !== null) {
      const b = this.block();
      const n = b ? suspicionsModel(b, this.susp).people.length : 0;
      if (a === 'back') this.susp = null;
      else if ((a === 'up' || a === 'down' || a === 'left' || a === 'right') && n) this.susp = (this.susp + (a === 'up' || a === 'left' ? -1 : 1) + n) % n;
      else if (a === 'confirm') return this.suspicionsDo(b?.here.beat === 'night' ? 'name' : 'feed');
      return void this.view?.refresh();
    }
    if (this.file !== null) return this.fileKey(a);
    if (this.post !== null) return this.postKey(a);
    if (this.baseForced()) return this.baseKey(a);
    if (this.line !== null) return this.lineKey(a);
    if (this.gym !== null) return this.gymKey(a);
    if (this.trade !== null) return this.tradeKey(a);
    if (this.nb !== null || this.block()?.neighbour?.sitting) return this.neighbourKey(a);
    if (this.sc !== null || this.block()?.scheme?.heist?.stage === 'rooms') return this.schemeKey(a);
    if (this.edge !== null) return this.edgesKey(a);
    if (this.base !== null) return this.baseKey(a);
    const nb = this.block();
    if (nb?.district && !nb.district.end && nb.here.beat === 'night' && !this.baseForced()) return this.nightKey(a);
    const block = this.block();
    if (!block?.district) return a === 'confirm' ? this.advance() : a === 'back' ? this.leave() : undefined;
    const d = this.disp;
    const dispatching = block.here.beat === 'dispatch' && !block.district.end;
    if (!dispatching) {
      if (a === 'confirm') return this.advance();
      if (a === 'back') return this.leave();
      const by = a === 'left' ? -1 : a === 'right' ? 1 : a === 'up' ? -10 : a === 'down' ? 10 : 0;
      this.disp = { ...d, at: Math.max(0, Math.min(19, d.at + by)) };
      return this.view?.refresh();
    }
    if (d.step === 'where') {
      const rows = dispatchRows(block);
      if (a === 'back') return this.leave();
      if (a === 'confirm') return d.onSend ? this.advance() : this.cell(d.at);
      const by = a === 'up' || a === 'left' ? -1 : a === 'down' || a === 'right' ? 1 : 0;
      // The list's rows, then "Send them" as one more row.
      const pos = d.onSend ? rows.length : Math.max(0, rows.indexOf(d.at));
      const next = (pos + by + rows.length + 1) % (rows.length + 1);
      this.disp = next === rows.length ? { ...d, onSend: true } : { ...d, onSend: false, at: rows[next]! };
      return this.view?.refresh();
    }
    if (d.step === 'who') {
      const n = block.crew.length + 1;
      if (a === 'back') this.disp = { ...d, step: 'where' };
      else if (a === 'up' || a === 'down') this.disp = { ...d, who: (d.who + (a === 'up' ? -1 : 1) + n) % n };
      else if (a === 'confirm') return d.who === block.crew.length ? this.toHow() : this.toggleCrew(block.crew[d.who]!.id);
      return this.view?.refresh();
    }
    // How: left/right the seven methods; up/down the Pay offer; Enter queues.
    if (a === 'back') this.disp = { ...d, step: 'who' };
    else if (a === 'left' || a === 'right') { const n = methodsShown(block).length; this.disp = { ...d, how: (d.how + (a === 'left' ? -1 : 1) + n) % n }; }
    else if ((a === 'up' || a === 'down') && methodsShown(block)[d.how]?.id === 'take') {
      const things = EVIL_DATA.line.things.map((t) => t.id);
      this.disp = { ...d, thing: things[(things.indexOf(d.thing) + (a === 'up' ? -1 : 1) + things.length) % things.length]! };
    } else if (a === 'up' || a === 'down') {
      const offers = EVIL_DATA.district.methods.pay.offers.map((o) => o.pct);
      const i = offers.indexOf(d.offer);
      this.disp = { ...d, offer: offers[(i + (a === 'up' ? -1 : 1) + offers.length) % offers.length]! };
    } else if (a === 'confirm') return this.openCard(true);
    this.view?.refresh();
  }

  /** A holding pressed: on the Board it's looked at; in Dispatch it's where the job goes, and Who is next. */
  private cell(i: number): void {
    const block = this.block();
    if (!block?.district) return;
    const dispatching = block.here.beat === 'dispatch' && !block.district.end;
    this.disp = { ...this.disp, at: i, onSend: false, ...(dispatching ? { step: 'who' as const, who: 0 } : {}) };
    this.notice = null;
    this.view?.refresh();
  }

  private toggleCrew(id: string): void {
    const d = this.disp;
    const squad = d.squad.includes(id) ? d.squad.filter((x) => x !== id) : [...d.squad, id];
    this.disp = { ...d, squad, step: 'who' };
    this.view?.refresh();
  }

  private toHow(): void {
    const block = this.block();
    if (!block) return;
    const d = this.disp;
    // Start on the first built method that this holding offers (the screen never recommends one; this is only the cursor).
    const first = methodsShown(block).findIndex((m) => (JOB_METHODS as readonly string[]).includes(m.id));
    this.disp = { ...d, step: 'how', how: d.step === 'how' ? d.how : first };
    this.view?.refresh();
  }

  /** The job being built in How, or null. */
  private draftJob(): JobDraft | null {
    const d = this.disp;
    const b = this.block();
    const h = b?.district?.holdings[d.at];
    const m = b ? methodsShown(b)[d.how] : undefined;
    if (!h || !m || !(JOB_METHODS as readonly string[]).includes(m.id)) return null;
    const method = m.id as JobMethod;
    return { holdingId: h.id, method, squad: d.squad, ...(method === 'pay' ? { offer: d.offer } : {}), ...(method === 'take' ? { thing: d.thing } : {}) };
  }

  /** "Read the Card": no job goes without its Honest Card. `byKey`: the press that opened it is still down. */
  private openCard(byKey: boolean): void {
    const block = this.block();
    const job = this.draftJob();
    if (!block || !job) return;
    const problem = jobProblem(block, job);
    if (problem) {
      this.notice = problem;
      return this.view?.refresh();
    }
    // Opened as "not yet seen"; the first draw measures whether all thirteen fit, and lights CONFIRM at once if they do.
    this.card = { job, gate: openGate(false, byKey), scroll: 0 };
    this.cardOpenedAt = performance.now();
    this.notice = null;
    this.redrawCard();
  }

  private closeCard(): void {
    const read = this.card && 'read' in this.card;
    this.card = null;
    if (!read) this.disp = { ...this.disp, step: 'how' };
    this.view?.refresh();
  }

  /** Field 13's button: the Card is swapped for the other way's job (a Pay under the price becomes the fair price). */
  private swapCard(): void {
    const c = this.card;
    if (!c || 'read' in c) return;
    const job = otherWay(c.job);
    if (!job) return;
    this.disp = { ...this.disp, offer: job.offer ?? this.disp.offer };
    this.card = { job, gate: openGate(false, false), scroll: 0 };
    this.cardOpenedAt = performance.now();
    this.redrawCard();
  }

  /** CONFIRM: queues the job and files the Card. Does nothing until field 13's been seen. With a line crossed it's "Ask anyway". */
  private confirmCard(): void {
    const c = this.card;
    if (!c || 'read' in c || !c.gate.seen) return;
    const block0 = this.block();
    if (block0 && crossers(block0, c.job).length) {
      const cues = services().session.evilStep({ type: 'askAnyway', job: c.job });
      this.card = null;
      const refused = cues.find((x) => x.id === 'refused');
      const filed = cues.find((x) => x.id === 'filed');
      this.notice = refused && 'reason' in refused ? refused.reason : null;
      if (filed && 'text' in filed) this.filed = filed.text;
      this.refuseSel = 0;
      this.disp = { ...newDispatch(), at: this.disp.at };
      return this.view?.refresh();
    }
    const m = EVIL_DATA.methods.find((x) => x.id === c.job.method)!;
    const h = this.block()?.district?.holdings.find((x) => x.id === c.job.holdingId);
    const cues = services().session.evilStep({ type: 'confirmCard', job: c.job });
    this.card = null;
    const refused = cues.find((x) => x.id === 'refused');
    const filed = cues.find((x) => x.id === 'filed');
    if (refused && 'reason' in refused) this.notice = refused.reason;
    else {
      // The card folds to its twelfth line, which drops into the Ledger's corner.
      this.filed = filed && 'text' in filed ? filed.text : null;
      this.notice = `Queued: step ${h?.step ?? '?'}, ${m.name}.`;
      this.disp = { ...newDispatch(), at: this.disp.at };
    }
    this.view?.refresh();
  }

  private cardKey(a: InputAction): void {
    if (a === 'back') return this.closeCard();
    if (a === 'up' || a === 'down') this.scrollCard(a === 'up' ? -80 : 80);
    // Confirm keys are read raw (rawKey), so a held one can be told apart.
  }

  private rawKey(e: KeyboardEvent, type: 'down' | 'up'): void {
    // Slice 22: C opens the Charters tab before a team exists (not on the name page, where C is a letter); U is the house rule's act.
    if (e.code === 'KeyC' && type === 'down' && !e.repeat && !this.founded() && !this.charter && this.draft.page !== 'name' && !services().session.evilTurnOffer()) return this.openCharters();
    if (e.code === 'KeyU' && type === 'down' && !e.repeat && !this.card && this.block()?.district) return this.houseAct(-1);
    // The Turn's first meeting: 1, 2, 3 answer the Hero.
    const mt = this.block() ? meetingModel(this.block()!) : null;
    if (mt && type === 'down' && !e.repeat && /^(Digit|Numpad)[123]$/.test(e.code)) return this.meet(mt.answers[Number(e.code.slice(-1)) - 1]!.key);
    if (e.code === 'KeyN' && this.block()?.charter?.id === 'staff-room') return;
    if (e.code === 'KeyN' && type === 'down' && !e.repeat && !this.card && !this.block()?.refusal && this.block()?.district) return this.toggleLine();
    // The Line: Enter held two seconds moves it; letting go early cancels (Part 3 section 7.1).
    if (this.line !== null && !this.card && CONFIRM_CODES.has(e.code)) {
      if (type === 'down' && !e.repeat) return this.startLineHold();
      if (type === 'up') return this.cancelLineHold();
      return;
    }
    if (e.code === 'KeyT' && type === 'down' && !e.repeat && !this.card && !this.block()?.refusal && this.block()?.district) return this.toggleTrade();
    // Slice 11: the Trade page's letter keys (P the street or holding; V waive, E end, M make honest, B the back room).
    if (this.trade && type === 'down' && !e.repeat && !this.card) {
      if (e.code === 'KeyP') { this.trade = { ...this.trade, pick: this.trade.pick + 1 }; return void this.view?.refresh(); }
      const by: Record<string, string> = { KeyV: 'Waive', KeyE: 'End', KeyM: 'Make it honest', KeyB: 'back room' };
      if (by[e.code]) return this.tradeDo(-1, by[e.code]);
    }
    if (e.code === 'KeyP' && type === 'down' && !e.repeat && !this.card && !this.trade && !this.block()?.refusal && this.block()?.district) return this.togglePost();
    if (e.code === 'KeyI' && type === 'down' && !e.repeat && !this.card && !this.block()?.refusal && this.block()?.district) return this.toggleEdges();
    if (e.code === 'KeyC' && type === 'down' && !e.repeat && !this.card && !this.block()?.refusal && this.block()?.district) return this.toggleScheme();
    if (e.code === 'KeyK' && type === 'down' && !e.repeat && !this.card && !this.block()?.refusal && this.block()?.district) return this.toggleNeighbour();
    if (e.code === 'KeyY' && type === 'down' && !e.repeat && !this.card && !this.block()?.refusal && this.block()?.district) return this.toggleGym();
    if (e.code === 'KeyB' && type === 'down' && !e.repeat && !this.card && !this.block()?.refusal && this.block()?.district) return this.toggleBase();
    if (e.code === 'KeyQ' && type === 'down' && !e.repeat && !this.card && this.base) { this.base = { ...this.base, tab: (this.base.tab + 1) % BASE_TABS.length, opt: 0 }; return void this.view?.refresh(); }
    if (e.code === 'KeyL' && type === 'down' && !e.repeat && !this.card && this.block()?.district) return this.toggleLedger();
    if (e.code === 'KeyR' && type === 'down' && !e.repeat && !this.card && !this.block()?.refusal && this.block()?.district) return this.toggleRoster();
    if (e.code === 'KeyJ' && type === 'down' && !e.repeat && !this.card && !this.block()?.refusal && this.block()?.district) return this.toggleSuspicions();
    if (e.code === 'KeyO' && type === 'down' && !e.repeat && !this.card && !this.block()?.refusal && this.block()?.district) return this.toggleRoad();
    if (e.code === 'KeyF' && type === 'down' && !e.repeat && !this.card && !this.block()?.refusal && this.block()?.district) return this.toggleFile();
    if (e.code === 'KeyH' && type === 'down' && !e.repeat && !this.card && this.block()?.here.beat === 'dispatch' && this.disp.step === 'how') return this.hold();
    if (e.code === 'KeyG' && type === 'down' && !e.repeat && !this.card && this.block()?.here.beat === 'inPerson') {
      const h = this.block()?.district?.holdings[this.disp.at];
      const j = this.block()?.queue.find((x) => x.method === 'outplay' && !x.played && (!h || x.holdingId === h.id)) ?? this.block()?.queue.find((x) => x.method === 'outplay' && !x.played);
      if (j) return this.goYourself(j.holdingId);
    }
    const c = this.card;
    if (!c || !CONFIRM_CODES.has(e.code)) return;
    // The press that opened the Card reaches this listener too (after the action listener opened it): skip it.
    if (e.type === 'keydown' && e.timeStamp <= this.cardOpenedAt) return;
    if ('read' in c) {
      if (type === 'down' && !e.repeat) this.closeCard();
      return;
    }
    const r = gateKey(c.gate, { type, repeat: e.repeat });
    this.card = { ...c, gate: r.gate };
    if (r.act === 'confirm') return this.confirmCard();
    if (r.act === 'scroll') this.scrollCard(80);
    else if (r.gate !== c.gate) this.view?.refresh();
  }

  private scrollEl(): HTMLElement | null {
    return this.view?.el.querySelector<HTMLElement>('[data-card-scroll]') ?? null;
  }

  private scrollCard(by: number): void {
    const el = this.scrollEl();
    if (!el || !this.card) return;
    el.scrollTop += by;
    this.card = { ...this.card, scroll: el.scrollTop };
    this.checkSeen();
  }

  private cardScrolled(e: Event): void {
    const el = e.target as HTMLElement | null;
    if (!this.card || !el?.dataset?.cardScroll) return;
    this.card = { ...this.card, scroll: el.scrollTop };
    this.checkSeen();
  }

  /** Field 13 is "seen" once its whole line has been inside the Card's window. */
  private checkSeen(): void {
    const c = this.card;
    if (!c || 'read' in c || c.gate.seen) return;
    const box = this.scrollEl();
    const f13 = this.view?.el.querySelector<HTMLElement>('[data-testid="evil-card-f13"]');
    if (!box || !f13) return;
    if (f13.getBoundingClientRect().bottom <= box.getBoundingClientRect().bottom + 1) {
      this.card = { ...c, gate: gateSeen(c.gate) };
      this.redrawCard();
    }
  }

  /** Every redraw replaces the view's HTML: put the Card's scroll back, then measure. */
  private redrawCard(): void {
    this.view?.refresh();
    requestAnimationFrame(() => {
      const el = this.scrollEl();
      if (el && this.card) el.scrollTop = this.card.scroll;
      this.checkSeen();
    });
  }

  private readCard(id: string): void {
    const b = this.block();
    const card = b ? cardsOf(b).find((c) => c.id === id) : undefined;
    if (!card) return;
    this.card = { read: card, scroll: 0 };
    this.cardOpenedAt = performance.now();
    this.redrawCard();
  }

  private toggleLedger(): void {
    if (this.card) return;
    this.ledger = this.ledger ? null : newLedger();
    this.roster = null;
    this.susp = null;
    this.file = null;
    this.notice = null;
    this.view?.refresh();
  }

  /** Keys in the Ledger: Left/Right the tabs (or the actions under a line), Up/Down the lines, Enter opens or does. */
  private ledgerKey(a: InputAction): void {
    const block = this.block();
    const L = this.ledger;
    if (!block || !L) return;
    const m = ledgerModel(block, L);
    if (a === 'back') this.ledger = L.act !== null ? { ...L, act: null } : null;
    else if (L.act !== null && (a === 'left' || a === 'right')) this.ledger = { ...L, act: (L.act + (a === 'left' ? -1 : 1) + LEDGER_ACTS.length) % LEDGER_ACTS.length };
    else if (a === 'left' || a === 'right') this.ledger = { tab: (L.tab + (a === 'left' ? -1 : 1) + m.tabs.length) % m.tabs.length, row: 0, act: null };
    else if ((a === 'up' || a === 'down') && m.rows) this.ledger = { ...L, row: (L.row + (a === 'up' ? -1 : 1) + m.rows) % m.rows, act: null };
    else if (a === 'confirm') {
      if (L.tab === 0 && m.rows) {
        if (L.act === null) this.ledger = { ...L, act: 0 };
        else return this.ledgerAct();
      } else if (L.tab === 1 && m.run?.[L.row]) return this.readCard(m.run[L.row]!.cardId);
    }
    this.view?.refresh();
  }

  /** Waive, Halve or Ask about on the chosen income line. */
  private ledgerAct(): void {
    const block = this.block();
    const L = this.ledger;
    if (!block || !L || L.act === null) return;
    const line = ledgerModel(block, L).today?.in[L.row];
    if (!line) return;
    const cues = services().session.evilStep({ type: LEDGER_ACTS[L.act]!, holdingId: line.holdingId });
    const refused = cues.find((c) => c.id === 'refused');
    const asked = cues.find((c) => c.id === 'asked');
    this.notice = refused && 'reason' in refused ? refused.reason : asked && 'line' in asked ? asked.line : null;
    this.filed = !refused ? services().session.run?.expansion?.evilMode?.log.at(-1)?.text ?? this.filed : this.filed;
    this.ledger = { ...L, act: null };
    this.view?.refresh();
  }

  // ---- Slice 5: the Hero, Hold, going in person, and the File ----

  /** The Hero's team as the rival record has it (read there, never copied). */
  private heroTeam(): string[] {
    const run = services().session.run;
    const id = run?.expansion?.evilMode?.hero?.rivalId;
    return (id ? run?.story.rivals.find((r) => r.id === id)?.memory?.lastBattle?.team : undefined) ?? [];
  }

  private toggleFile(): void {
    if (this.card) return;
    if (!this.block()?.hero) {
      this.notice = "Nobody's on the road yet.";
      return void this.view?.refresh();
    }
    this.file = this.file === null ? 0 : null;
    this.ledger = null;
    this.roster = null;
    this.susp = null;
    this.notice = null;
    this.view?.refresh();
  }

  private toggleLine(): void {
    if (this.card) return;
    const block = this.block();
    this.line = this.line === null ? Math.max(0, LINE_IDS.indexOf(block?.team.line ?? 'grey')) : null;
    this.ledger = null;
    this.roster = null;
    this.susp = null;
    this.file = null;
    this.cancelLineHold();
    this.view?.refresh();
  }

  // ---- Slice 11: the Trade page ----

  private toggleTrade(): void {
    if (this.card) return;
    const block = this.block();
    if (this.trade === null && (!block || !tradeModel(block, newTrade()))) {
      this.notice = 'There is no trade here yet.';
      return void this.view?.refresh();
    }
    if (block?.neighbour?.sitting) return;
    this.trade = this.trade === null ? newTrade() : null;
    this.ledger = null;
    this.roster = null;
    this.susp = null;
    this.file = null;
    this.line = null;
    this.gym = null;
    this.notice = null;
    this.cancelLineHold();
    this.view?.refresh();
  }

  // ---- Slice 10: the Base page, Walk it and the Raid ----

  /** Walk it and a Raid can't be closed: the day waits on them. */
  private baseForced(): boolean {
    const b = this.block();
    return !!b && (!!b.base?.walk || raidOn(b) || b.raid?.state === 'done');
  }

  private baseSel(): BaseSel | null {
    return this.base ?? (this.baseForced() ? newBaseSel() : null);
  }

  private toggleBase(): void {
    if (this.card) return;
    if (this.baseForced()) return;
    this.base = this.base === null ? newBaseSel() : null;
    this.ledger = null;
    this.roster = null;
    this.susp = null;
    this.file = null;
    this.line = null;
    this.gym = null;
    this.notice = null;
    this.cancelLineHold();
    this.view?.refresh();
  }

  private tradeKey(a: InputAction): void {
    const t = this.trade!;
    if (a === 'back') { this.trade = null; this.notice = null; return void this.view?.refresh(); }
    if (a === 'left' || a === 'right') { this.trade = newTrade((t.tab + (a === 'left' ? 3 : 1)) % 4); this.notice = null; return void this.view?.refresh(); }
    if (a === 'up' || a === 'down') { this.trade = { ...t, row: Math.max(0, t.row + (a === 'up' ? -1 : 1)), pick: 0 }; return void this.view?.refresh(); }
    if (a === 'confirm') this.tradeDo(0);
  }

  /** A button under the Card (by index, or by a word in its label for the letter keys). The step refuses anything the page wouldn't allow. */
  private tradeDo(i: number, label?: string): void {
    const block = this.block();
    const m = block && this.trade ? tradeModel(block, this.trade) : null;
    const b = m ? (label ? m.buttons.find((x) => x.label.includes(label)) : m.buttons[i]) : undefined;
    if (!b) return;
    const cues = services().session.evilStep(b.act);
    const refused = cues.find((c) => c.id === 'refused') as { reason?: string } | undefined;
    const said = cues.filter((c) => c.id === 'said').map((c) => (c as { line: string }).line);
    this.notice = refused?.reason ?? (said.length ? said.join(' ') : null);
    // A new thing running: show it on the Running tab.
    if (!refused && b.act.type === 'trade') this.trade = newTrade(3);
    this.view?.refresh();
  }

  /** A square or a door pressed: chosen (while a room's being moved, an empty square is where it goes). */
  private baseSquare(at: string): void {
    const s = this.baseSel();
    if (!s) return;
    this.base = { ...s, at, opt: 0 };
    this.view?.refresh();
  }

  /** The chosen option: its action through the step (which refuses what the page shouldn't allow), or Move's second step. */
  private baseDo(): void {
    const b = this.block();
    const s = this.baseSel();
    if (!b || !s) return;
    const m = baseModel(b, s);
    if (m.mode === 'walk') return m.walk?.end ? this.baseAct({ type: 'closeWalk' }) : m.walk?.fight ? this.startFight() : undefined;
    if (m.mode === 'raid') return m.raid?.fight ? this.startFight() : m.raid?.state === 'turns' ? this.baseAct({ type: 'raidTurn' }) : m.raid?.state === 'done' ? this.baseAct({ type: 'raidDone' }) : undefined;
    const o = m.options[m.opt];
    if (!o) return;
    if (o.move !== undefined) { this.base = { ...s, moving: o.move || null, opt: 0 }; this.notice = null; return void this.view?.refresh(); }
    if (o.action) {
      if (o.action.type === 'moveRoom') this.base = { ...s, moving: null };
      this.baseAct(o.action);
    }
  }

  private baseAct(action: EvilAction): void {
    const cues = services().session.evilStep(action);
    if (cues.some((c) => c.id === 'fight')) { this.notice = null; return this.startFight(); }
    const refused = cues.find((c) => c.id === 'refused') as { reason?: string } | undefined;
    const said = cues.filter((c) => c.id === 'said').map((c) => (c as { line: string }).line);
    this.notice = refused?.reason ?? (said.length ? said.join(' ') : null);
    if (action.type === 'closeWalk' || action.type === 'raidDone') this.base = this.base ?? newBaseSel();
    this.view?.refresh();
  }

  /** Keys on the Base page: Left/Right the square (doors after squares), Up/Down the option, Enter does it, Esc closes. */
  private baseKey(a: InputAction): void {
    const b = this.block();
    const s = this.baseSel();
    if (!b || !s) return;
    if (a === 'back') { if (s.moving) { this.base = { ...s, moving: null }; return void this.view?.refresh(); } if (!this.baseForced()) this.base = null; return void this.view?.refresh(); }
    if (a === 'confirm') return this.baseDo();
    const m = baseModel(b, s);
    if (a === 'up' || a === 'down') { this.base = { ...s, opt: Math.max(0, Math.min(m.options.length - 1, m.opt + (a === 'up' ? -1 : 1))) }; return void this.view?.refresh(); }
    if ((a === 'left' || a === 'right') && m.grid) {
      const all = [...m.grid.cells.map((c) => c.at), ...m.grid.doors.map((d) => d.at)];
      const i = s.at ? all.indexOf(s.at) : -1;
      const n = (i + (a === 'left' ? -1 : 1) + all.length) % all.length;
      this.base = { ...s, at: all[n] ?? null, opt: 0 };
      this.view?.refresh();
    }
  }

  // ---- Slice 8: the Gym page ----

  private toggleGym(): void {
    if (this.card) return;
    const block = this.block();
    if (this.gym === null && (!block || !gymModel(block, 0))) {
      this.notice = 'The Gym has nothing to show yet.';
      return void this.view?.refresh();
    }
    this.gym = this.gym === null ? 0 : null;
    this.ledger = null;
    this.roster = null;
    this.susp = null;
    this.file = null;
    this.line = null;
    this.notice = null;
    this.cancelLineHold();
    this.view?.refresh();
  }

  // ---- Slice 14: the Scheme page ----

  private toggleScheme(): void {
    if (this.card) return;
    const block = this.block();
    if (block?.scheme?.heist?.stage === 'rooms' || block?.neighbour?.sitting) return;
    if (this.sc === null && (!block || !schemeModel(block, 0))) {
      this.notice = 'The Scheme is switched off.';
      return void this.view?.refresh();
    }
    this.sc = this.sc === null ? 0 : null;
    this.ledger = null;
    this.roster = null;
    this.susp = null;
    this.file = null;
    this.line = null;
    this.gym = null;
    this.trade = null;
    this.nb = null;
    this.notice = null;
    this.cancelLineHold();
    this.view?.refresh();
  }

  private schemeKey(a: InputAction): void {
    const block = this.block();
    const m = block ? schemeModel(block, this.sc ?? 0) : null;
    if (a === 'back') { if (block?.scheme?.heist?.stage !== 'rooms') this.sc = null; return void this.view?.refresh(); }
    if (!m) { this.sc = null; return void this.view?.refresh(); }
    const n = Math.max(1, m.rows.length);
    if (a === 'up' || a === 'down' || a === 'left' || a === 'right') { this.sc = ((this.sc ?? 0) + (a === 'up' || a === 'left' ? n - 1 : 1)) % n; return void this.view?.refresh(); }
    if (a === 'confirm') this.schemeDo();
  }

  /** Enter (or a tap) on the chosen row: the step refuses anything the page wouldn't allow. A heist's battle goes to the battle. */
  private schemeDo(): void {
    const block = this.block();
    const m = block ? schemeModel(block, this.sc ?? 0) : null;
    const row = m?.rows.find((r) => r.sel);
    if (!row) return;
    const cues = services().session.evilStep(row.action);
    const refused = cues.find((c) => c.id === 'refused') as { reason?: string } | undefined;
    const said = cues.filter((c) => c.id === 'said').map((c) => (c as { line: string }).line);
    this.notice = refused?.reason ?? (said.length ? said.join(' ') : null);
    if (cues.some((c) => c.id === 'fight')) { this.sc = 0; return this.startFight(); }
    if (this.sc === null) this.sc = 0;
    const after = this.block();
    const rows = after ? schemeModel(after, 0)?.rows.length ?? 0 : 0;
    if ((this.sc ?? 0) >= rows) this.sc = 0;
    this.view?.refresh();
  }

  // ---- Slice 21: the Edges page ----

  private toggleEdges(): void {
    if (this.card) return;
    const block = this.block();
    if (!block || block.scheme?.heist?.stage === 'rooms' || block.neighbour?.sitting) return;
    this.edge = this.edge === null ? 0 : null;
    this.ledger = null;
    this.roster = null;
    this.file = null;
    this.line = null;
    this.gym = null;
    this.trade = null;
    this.nb = null;
    this.sc = null;
    this.notice = null;
    this.cancelLineHold();
    this.view?.refresh();
  }

  private edgesKey(a: InputAction): void {
    const block = this.block();
    if (a === 'back' || !block) { this.edge = null; return void this.view?.refresh(); }
    const n = Math.max(1, edgesModel(block, this.edge ?? 0).rows.length);
    if (a === 'up' || a === 'down' || a === 'left' || a === 'right') { this.edge = ((this.edge ?? 0) + (a === 'up' || a === 'left' ? n - 1 : 1)) % n; return void this.view?.refresh(); }
    if (a === 'confirm') this.edgesDo();
  }

  /** CONFIRM on the chosen row: the step refuses anything the page wouldn't allow. Going through a Tear goes to the battle. */
  private edgesDo(): void {
    const block = this.block();
    const row = block ? edgesModel(block, this.edge ?? 0).rows.find((r) => r.sel) : undefined;
    if (!row) return;
    const cues = services().session.evilStep(row.action);
    const refused = cues.find((c) => c.id === 'refused') as { reason?: string } | undefined;
    const said = cues.filter((c) => c.id === 'said').map((c) => (c as { line: string }).line);
    this.notice = refused?.reason ?? (said.length ? said.join(' ') : null);
    if (cues.some((c) => c.id === 'fight')) { this.edge = null; return this.startFight(); }
    this.edge = 0;
    this.view?.refresh();
  }

  // ---- Slice 13: the neighbour page ----

  private toggleNeighbour(): void {
    if (this.card) return;
    const block = this.block();
    if (block?.neighbour?.sitting) return;
    if (this.nb === null && (!block || !neighbourModel(block, 0))) {
      this.notice = 'There is no neighbour here yet.';
      return void this.view?.refresh();
    }
    if (this.baseForced()) return;
    this.nb = this.nb === null ? 0 : null;
    this.base = null;
    this.trade = null;
    this.ledger = null;
    this.roster = null;
    this.susp = null;
    this.file = null;
    this.line = null;
    this.gym = null;
    this.notice = null;
    this.cancelLineHold();
    this.view?.refresh();
  }

  private neighbourKey(a: InputAction): void {
    const block = this.block();
    const m = block ? neighbourModel(block, this.nb ?? 0) : null;
    if (a === 'back') { if (!block?.neighbour?.sitting) this.nb = null; return void this.view?.refresh(); }
    if (!m) { this.nb = null; return void this.view?.refresh(); }
    const n = Math.max(1, m.rows.length);
    if (a === 'up' || a === 'down' || a === 'left' || a === 'right') { this.nb = ((this.nb ?? 0) + (a === 'up' || a === 'left' ? n - 1 : 1)) % n; return void this.view?.refresh(); }
    if (a === 'confirm') this.neighbourDo();
  }

  /** Enter (or a tap) on the chosen row: the step refuses anything the page wouldn't allow. The Chair and the cave go to the battle. */
  private neighbourDo(): void {
    const block = this.block();
    const m = block ? neighbourModel(block, this.nb ?? 0) : null;
    const row = m?.rows.find((r) => r.sel);
    if (!row) return;
    const cues = services().session.evilStep(row.action);
    const refused = cues.find((c) => c.id === 'refused') as { reason?: string } | undefined;
    const said = cues.filter((c) => c.id === 'said').map((c) => (c as { line: string }).line);
    this.notice = refused?.reason ?? (said.length ? said.join(' ') : null);
    if (cues.some((c) => c.id === 'fight')) { this.nb = null; return this.startFight(); }
    if (this.nb === null) this.nb = 0;
    const after = this.block();
    const rows = after ? neighbourModel(after, 0)?.rows.length ?? 0 : 0;
    if ((this.nb ?? 0) >= rows) this.nb = 0;
    this.view?.refresh();
  }

  private gymKey(a: InputAction): void {
    if (a === 'back') { this.gym = null; return void this.view?.refresh(); }
    if (a === 'left' || a === 'right') { this.gym = ((this.gym ?? 0) + (a === 'left' ? 4 : 1)) % 5; return void this.view?.refresh(); }
    if (a === 'confirm') this.gymDo();
  }

  /** Enter (or "Do it") on the chosen door: the step refuses anything the page wouldn't allow. A Beat or a challenge goes to the battle. */
  private gymDo(): void {
    const block = this.block();
    const m = block && this.gym !== null ? gymModel(block, this.gym) : null;
    if (!m) return;
    const door = m.doors.find((d) => d.sel)!;
    const cues = services().session.evilStep({ type: 'gymWay', way: door.way });
    if (cues.some((c) => c.id === 'fight')) { this.gym = null; return this.startFight(); }
    const refused = cues.find((c) => c.id === 'refused') as { reason?: string } | undefined;
    const said = cues.filter((c) => c.id === 'said').map((c) => (c as { line: string }).line);
    this.notice = refused?.reason ?? (said.length ? said.join(' ') : null);
    this.view?.refresh();
  }

  private lineKey(a: InputAction): void {
    if (a === 'back') { this.line = null; this.cancelLineHold(); return; }
    if (a === 'left' || a === 'right') { this.line = ((this.line ?? 0) + (a === 'left' ? -1 : 1) + LINE_IDS.length) % LINE_IDS.length; this.cancelLineHold(); }
    // Confirm is read raw (rawKey), so the hold can be timed.
  }

  private startLineHold(): void {
    if (this.line === null || this.lineHeldAt !== null) return;
    const block = this.block();
    if (!block || lineModel(block, this.line).problem) return;
    this.lineHeldAt = this.time.now;
    this.lineTimer = this.time.addEvent({ delay: 100, loop: true, callback: () => {
      if (this.lineHeldAt === null) return;
      if (this.time.now - this.lineHeldAt >= 2000) return this.commitLine();
      this.view?.refresh();
    } });
    this.view?.refresh();
  }

  private cancelLineHold(): void {
    this.lineTimer?.remove();
    this.lineTimer = null;
    if (this.lineHeldAt === null) return void this.view?.refresh();
    this.lineHeldAt = null;
    this.view?.refresh();
  }

  private commitLine(): void {
    const to = LINE_IDS[this.line ?? 0]!;
    this.lineTimer?.remove();
    this.lineTimer = null;
    this.lineHeldAt = null;
    this.said(services().session.evilStep({ type: 'moveLine', to }));
    this.view?.refresh();
  }

  private fileKey(a: InputAction): void {
    if (a === 'back' || a === 'confirm') this.file = null;
    else if (a === 'left' || a === 'right') this.file = ((this.file ?? 0) + (a === 'left' ? 2 : 1)) % 3;
    this.view?.refresh();
  }

  /** Hold: the one person picked stands at the holding the cursor's on (Dispatch; no Card). */
  private hold(): void {
    const block = this.block();
    const h = block?.district?.holdings[this.disp.at];
    if (!block || !h) return;
    const cues = services().session.evilStep({ type: 'post', holdingId: h.id, id: this.disp.squad[0] ?? '' });
    this.said(cues);
    if (!cues.some((c) => c.id === 'refused')) this.disp = { ...newDispatch(), at: this.disp.at };
    this.view?.refresh();
  }

  private goYourself(holdingId: string): void {
    const cues = services().session.evilStep({ type: 'goYourself', holdingId });
    if (cues.some((c) => c.id === 'fight')) return this.startFight();
    this.said(cues);
    this.view?.refresh();
  }

  /** The battle the day's waiting on: into the battle scene; its end comes back here (sceneForRun). */
  // ---- Slice 12: the Road, the fire, the last room ----

  /** The fire, or a last room not yet seen out, holds the screen. */
  /** Slice 18: the post page (P). */
  private togglePost(): void {
    if (this.card || this.roadOn()) return;
    this.post = this.post === null ? 0 : null;
    this.ledger = null;
    this.roster = null;
    this.file = null;
    this.road = null;
    this.notice = null;
    this.view?.refresh();
  }

  private postDo(code: string): void {
    const action = postAction(code);
    if (!action) { this.post = null; this.notice = null; return void this.view?.refresh(); }
    const cues = services().session.evilStep(action);
    const refused = cues.find((c) => c.id === 'refused');
    const said = cues.filter((c) => c.id === 'said').map((c) => ('line' in c ? c.line : ''));
    this.notice = refused && 'reason' in refused ? refused.reason : action.type === 'postAct' && action.act.what === 'open' ? null : said.join(' ') || null;
    this.post = 0;
    this.view?.refresh();
  }

  private postKey(a: InputAction): void {
    const b = this.block();
    const m = b ? postModel(b) : null;
    if (!m || a === 'back') { this.post = null; this.notice = null; return void this.view?.refresh(); }
    const n = m.acts.length;
    const at = Math.min(this.post ?? 0, n - 1);
    if (a === 'up' || a === 'down' || a === 'left' || a === 'right') this.post = (at + (a === 'up' || a === 'left' ? -1 : 1) + n) % n;
    else if (a === 'confirm' && m.acts[at]) return this.postDo(m.acts[at]!.code);
    this.view?.refresh();
  }

  /** Slice 18: this beat's bark (one a beat at most). Presentation only: a hash of the seed picks it; nothing's saved. */
  private barkFor(block: NonNullable<ReturnType<EvilScene['block']>>): { name: string; line: string } | null {
    const d = block.district;
    if (!d || d.end) return null;
    const where = `${d.region}:${d.n}`;
    if (where !== this.saidIn) { this.saidIn = where; this.barkSaid = new Set(); }
    const at = `${block.here.day}|${block.here.beat}`;
    if (at === this.barkAt) return this.barked;
    this.barkAt = at;
    const beat = block.here.beat;
    const won = block.sheets.find((x) => x.won);
    const moment: BarkMoment | null = block.team.heat >= 8 && beat !== 'morning' ? 'raidNear'
      : beat === 'morning' ? 'board' : beat === 'dispatch' ? 'dispatchGo' : beat === 'evening' ? (block.sheets.length ? (won ? 'jobWon' : 'jobLost') : 'mess')
      : beat === 'night' ? 'mess' : beat === 'hero' && block.hero ? 'heroNear' : null;
    let b: { name: string; line: string } | null = null;
    try {
      b = moment ? bark(block, moment, this.barkSaid, { ...(won ? { method: won.method, who: won.squad } : {}) }) : null;
    } catch { b = null; }
    if (b) this.barkSaid.add(b.line);
    this.barked = b;
    return b;
  }

  private roadOn(): boolean {
    const b = this.block();
    return !!b && (!!b.ending || (!!b.district && roadForced(b, this.roomSeen === b.here.region)));
  }

  private toggleRoad(): void {
    if (this.card || this.roadOn()) return;
    if (!this.block()?.hero) {
      this.notice = "Nobody's on the road yet.";
      return void this.view?.refresh();
    }
    this.road = this.road === null ? 0 : null;
    this.ledger = null;
    this.roster = null;
    this.susp = null;
    this.file = null;
    this.notice = null;
    this.redrawRoad();
  }

  private roadPick(id: string, text = ''): void {
    const b = this.block();
    if (!b) return;
    if (id === 'fight') return this.startFight();
    // Slice 15: the ending's last page read; the run ends, and the run-end page follows.
    if (id === 'endDone') {
      if (!services().session.evilFinish()) { this.notice = 'Not yet.'; return this.redrawRoad(); }
      this.leaving = true;
      return void this.scene.start('GameOver');
    }
    if (id.startsWith('pr:handOff:')) text = this.own_?.value ?? '';
    if (id === 'roomDone') {
      this.roomSeen = b.here.region;
      this.road = null;
      this.notice = null;
      return this.redrawRoad();
    }
    const action = roadChoice(id, text);
    if (!action) return;
    const cues = services().session.evilStep(action);
    const refused = cues.find((c) => c.id === 'refused');
    const said = cues.find((c) => c.id === 'said');
    this.notice = refused && 'reason' in refused ? refused.reason : said && 'line' in said ? said.line : null;
    if (!refused && this.own_ && (action.type === 'fireOwn' || action.type === 'writeNotebook' || action.type === 'endAct' || action.type === 'endPress')) this.own_.value = '';
    this.road = this.roadOn() || this.road !== null ? 0 : null;
    this.redrawRoad();
  }

  private roadKey(a: InputAction): void {
    const b = this.block();
    const m = b ? roadModel(b, this.roomSeen === b.here.region) : null;
    if (!m) { this.road = null; return this.redrawRoad(); }
    const n = m.choices.length;
    const at = Math.min(this.road ?? 0, Math.max(0, n - 1));
    if (a === 'back') { if (!m.forced) this.road = null; return this.redrawRoad(); }
    if ((a === 'up' || a === 'down' || a === 'left' || a === 'right') && n) this.road = (at + (a === 'up' || a === 'left' ? -1 : 1) + n) % n;
    else if (a === 'confirm' && m.choices[at]) return this.roadPick(m.choices[at]!.id);
    this.redrawRoad();
  }

  /** Redraw; the typed line's box follows its field while one is open (phones show their own keyboard). */
  private redrawRoad(): void {
    this.view?.refresh();
    // The stage redraws on the next frame: scroll and place the box after it.
    requestAnimationFrame(() => {
      // A fire and the room read top-down, newest at the bottom: keep the newest line and the choices in view.
      const page = this.view?.el.querySelector<HTMLElement>('[data-testid="evil-roadpage"]');
      const body = page?.querySelector<HTMLElement>('[data-testid="evil-road-body"]');
      if (body && page?.dataset.mode !== 'road') {
        body.scrollTop = body.scrollHeight;
        // A line of your own: its box in view, the list to pick from under it.
        const field = body.querySelector<HTMLElement>('.ev-own');
        if (field) body.scrollTop += field.getBoundingClientRect().top - body.getBoundingClientRect().top - 40;
      }
      this.placeOwn();
    });
  }

  private placeOwn(): void {
    const field = this.view?.el.querySelector<HTMLElement>('.ev-own');
    if (!field) return this.dropOwn();
    if (!this.own_) {
      const el = document.createElement('input');
      el.type = 'text';
      el.maxLength = EVIL_DATA.fires.rules.ownMax;
      el.autocomplete = 'off';
      el.setAttribute('aria-label', 'Your own line');
      el.dataset.testid = 'evil-own-input';
      Object.assign(el.style, { position: 'fixed', zIndex: '41', boxSizing: 'border-box', border: '0', background: 'transparent', padding: '0 8px', outline: 'none' } satisfies Partial<CSSStyleDeclaration>);
      el.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') { const say = this.view?.el.querySelector<HTMLElement>('[data-testid="evil-own-say"]'); say?.click(); }
        else if (e.key === 'Escape') el.blur();
      });
      document.body.appendChild(el);
      this.own_ = el;
    }
    const f = field.getBoundingClientRect(), look = getComputedStyle(field);
    // Scrolled out of its page: hide the box rather than float it over something else.
    const body = field.closest<HTMLElement>('[data-testid="evil-road-body"]')?.getBoundingClientRect();
    if (body && (f.top < body.top || f.bottom > body.bottom)) return void (this.own_.style.display = 'none');
    Object.assign(this.own_.style, { display: '', left: `${f.left}px`, top: `${f.top}px`, width: `${f.width}px`, height: `${f.height}px`, fontSize: '16px', fontFamily: look.fontFamily, color: look.color });
  }

  private dropOwn(): void {
    this.own_?.remove();
    this.own_ = null;
  }

  private startFight(): void {
    if (!services().session.evilFight()) {
      this.notice = 'The fight could not start.';
      return void this.view?.refresh();
    }
    this.leaving = true;
    this.scene.start('Battle');
  }

  // ---- Slice 4: the Roster, the Office and the yard ----

  private toggleRoster(): void {
    if (this.card) return;
    this.roster = this.roster ? null : newRoster();
    this.ledger = null;
    this.file = null;
    this.notice = null;
    this.view?.refresh();
  }

  // ---- Slice 17: the Suspicions page ----

  private toggleSuspicions(): void {
    if (this.card) return;
    const open = this.susp === null;
    this.roster = null;
    this.susp = open ? 0 : null;
    this.ledger = null;
    this.file = null;
    this.notice = null;
    this.view?.refresh();
  }

  /** Name them (at Night) or feed them a false job (at Dispatch), for the chosen card. */
  private suspicionsDo(id: string): void {
    const block = this.block();
    if (!block || this.susp === null) return;
    const m = suspicionsModel(block, this.susp);
    const p = m.people.find((x) => x.sel);
    const a = m.acts.find((x) => x.id === id);
    if (!p || !a) return;
    if (!a.on) { this.notice = a.why; return void this.view?.refresh(); }
    this.said(services().session.evilStep(id === 'name' ? { type: 'nameThem', id: p.id } : { type: 'feed', id: p.id }));
    this.view?.refresh();
  }

  private said(cues: { id: string }[]): void {
    const refused = cues.find((c) => c.id === 'refused') as { reason?: string } | undefined;
    const said = cues.find((c) => c.id === 'said') as { line?: string } | undefined;
    this.notice = refused?.reason ?? said?.line ?? null;
  }

  /** The actions under the chosen card: on the Roster, promote or let go; at the notice board, hire, ask, or say no. */
  private rosterAct(): void {
    const block = this.block();
    const R = this.roster;
    if (!block || !R || R.act === null) return;
    const m = rosterModel(block, R);
    if (R.tab === 0) {
      const p = m.people?.[R.row];
      const a = p ? personActs(block, p.id)[R.act] : undefined;
      if (!p || !a) return;
      if (!a.on) { this.notice = a.why; return this.view?.refresh(); }
      if (a.id === 'promote') { this.roster = { ...R, office: p.id }; return this.view?.refresh(); }
      // Slice 17: a quest's step or ending; Ask them to stay.
      if (a.id === 'qstep' || a.id.startsWith('qend:')) this.said(services().session.evilStep({ type: 'questStep', id: p.id, ...(a.id === 'qstep' ? {} : { ending: a.id.slice(5) }) }));
      else if (a.id.startsWith('stay:')) this.said(services().session.evilStep({ type: 'askStay', id: p.id, reason: a.id === 'stay:none' ? null : (a.id.slice(5) as StayReason) }));
      else this.said(services().session.evilStep({ type: 'letGo', id: p.id, kindly: a.id === 'letGoKind' }));
    } else {
      const ap = m.applicants?.[R.row];
      const a = ap ? applicantActs(block, ap.ref)[R.act] : undefined;
      if (!ap || !a) return;
      if (!a.on) { this.notice = a.why; return this.view?.refresh(); }
      const q = isQuestionAct(a.id);
      this.said(services().session.evilStep(q ? { type: 'question', ref: ap.ref, q } : a.id === 'hire' ? { type: 'hire', ref: ap.ref } : { type: 'turnAway', ref: ap.ref, rude: a.id === 'turnRude' }));
      if (!q) this.roster = { ...R, row: 0, act: null };
    }
    this.view?.refresh();
  }

  private officeAnswer(i: number): void {
    const R = this.roster;
    if (!R?.office) return;
    this.said(services().session.evilStep({ type: 'promote', id: R.office, answer: i }));
    this.roster = { ...R, office: null, act: null };
    this.view?.refresh();
  }

  /** Keys on the Roster: Left/Right tabs (or actions under a card), Up/Down cards, Enter opens or does, Esc backs out. */
  private rosterKey(a: InputAction): void {
    const block = this.block();
    const R = this.roster;
    if (!block || !R) return;
    if (R.office) {
      if (a === 'back') this.roster = { ...R, office: null };
      else if (a === 'confirm') return this.officeAnswer(0);
      return this.view?.refresh();
    }
    const m = rosterModel(block, R);
    const acts = R.tab === 0 ? (m.people?.[R.row] ? personActs(block, m.people[R.row]!.id) : []) : m.applicants?.[R.row] ? applicantActs(block, m.applicants[R.row]!.ref) : [];
    if (a === 'back') this.roster = R.act !== null ? { ...R, act: null } : null;
    else if (R.act !== null && (a === 'left' || a === 'right') && acts.length) this.roster = { ...R, act: (R.act + (a === 'left' ? -1 : 1) + acts.length) % acts.length };
    else if (a === 'left' || a === 'right') this.roster = newRoster((R.tab + 1) % 2);
    else if ((a === 'up' || a === 'down') && m.rows) this.roster = { ...R, row: (R.row + (a === 'up' ? -1 : 1) + m.rows) % m.rows, act: null };
    else if (a === 'confirm' && m.rows && acts.length) {
      if (R.act === null) this.roster = { ...R, act: 0 };
      else return this.rosterAct();
    }
    this.view?.refresh();
  }

  /** The yard: Left/Right the three answers, Enter answers. */
  private refusalKey(a: InputAction): void {
    const block = this.block();
    const ids = (block ? refusalModel(block)?.answers.map((x) => x.id) : null) ?? ['withdraw', 'swap', 'insist'];
    if (a === 'left' || a === 'right') this.refuseSel = (this.refuseSel + (a === 'left' ? ids.length - 1 : 1)) % ids.length;
    else if (a === 'confirm') return this.answer(ids[this.refuseSel] as 'withdraw' | 'swap' | 'insist' | 'shadowOrder');
    this.view?.refresh();
  }

  private answer(id: 'withdraw' | 'swap' | 'insist' | 'shadowOrder'): void {
    const cues = services().session.evilStep(id === 'shadowOrder' ? { type: 'shadowOrder' } : { type: 'answerRefusal', answer: id });
    this.said(cues);
    const filed = services().session.run?.expansion?.evilMode?.log.at(-1)?.text;
    if (!cues.some((c) => c.id === 'refused') && filed) this.filed = filed;
    this.view?.refresh();
  }

  // ---- Slice 7: the Office at Night ----

  private knockAnswer(i: number): void {
    const block = this.block();
    const k = block?.night.knock;
    if (!block || !k) return;
    const p = k.who ? block.crew.find((c) => c.id === k.who) : undefined;
    const who = { name: p?.name ?? (EVIL_DATA.night.knocks.find((x) => x.n === k.n)?.who.outside ?? 'Nobody'), ref: p?.ref ?? null };
    const cues = services().session.evilStep({ type: 'answerKnock', answer: i });
    const refused = cues.find((c) => c.id === 'refused');
    if (refused && 'reason' in refused) { this.notice = refused.reason; return this.view?.refresh(); }
    const said = cues.find((c) => c.id === 'said');
    const moved = cues.find((c) => c.id === 'moved');
    this.lastWho = who;
    this.notice = null;
    this.night = { ...newNight(), reply: { line: said && 'line' in said ? said.line : '', moved: moved && 'line' in moved ? moved.line : EVIL_DATA.night.text.nothingMoved!, step: 0 } };
    this.view?.refresh();
  }

  /** After an answer: a press shows what moved, as one line; another and they go. */
  private replyNext(): void {
    const r = this.night.reply;
    if (!r) return;
    this.night = r.step === 0 ? { ...this.night, reply: { ...r, step: 1 } } : newNight();
    this.view?.refresh();
  }

  private deskAct(i: number): void {
    const block = this.block();
    if (!block || this.night.reply || block.night.knock && i !== 3 && i !== 2) return;
    const id = ['hear', 'sleep', 'wall', 'lights'][i];
    if (id === 'lights') return this.advance();
    if (id === 'wall') this.night = { ...newNight(), pane: 'wall' };
    else if (id === 'hear') {
      if (this.block()?.night.actedOn === block.here.day) { this.notice = EVIL_DATA.night.text.acted!; return this.view?.refresh(); }
      this.night = { ...newNight(), pane: 'hear' };
    } else this.said(services().session.evilStep({ type: 'nightAction', action: 'sleep' }));
    this.view?.refresh();
  }

  private hearOut(i: number): void {
    const block = this.block();
    const p = block ? block.crew.filter((c) => c.where === 'in')[i] : undefined;
    if (!p) return;
    this.said(services().session.evilStep({ type: 'nightAction', action: 'hear', id: p.id }));
    this.night = newNight();
    this.view?.refresh();
  }

  private wallPick(i: number): void {
    const w = this.block()?.night.wall[i];
    const desk = w ? EVIL_DATA.night.wall.find((x) => x.id === w.item)?.kind === 'desk' : true;
    this.night = { ...this.night, pane: 'wall', row: i, confirm: w && w.down === null && !desk ? i : null };
    this.view?.refresh();
  }

  private wallDown(i: number): void {
    this.said(services().session.evilStep({ type: 'takeDown', index: i }));
    this.night = { ...this.night, confirm: null };
    this.view?.refresh();
  }

  /** Keys in the Office: Up/Down the answers or the desk, Enter does, Esc backs out (to the desk, or leaves from it). */
  private nightKey(a: InputAction): void {
    const block = this.block()!;
    const N = this.night;
    if (N.reply) return a === 'confirm' ? this.replyNext() : undefined;
    const m = nightModel(block, N, this.lastWho);
    const by = a === 'up' || a === 'left' ? -1 : a === 'down' || a === 'right' ? 1 : 0;
    if (by && m.rows) { this.night = { ...N, row: (N.row + by + m.rows) % m.rows, confirm: null }; return this.view?.refresh(); }
    if (a === 'back') {
      if (N.pane === 'room') return this.leave();
      this.night = N.confirm !== null ? { ...N, confirm: null } : newNight();
      return this.view?.refresh();
    }
    if (a !== 'confirm') return;
    if (N.pane === 'hear') return this.hearOut(N.row);
    if (N.pane === 'wall') return N.confirm === N.row ? this.wallDown(N.row) : this.wallPick(N.row);
    if (m.door) return this.knockAnswer(N.row);
    return this.deskAct(N.row);
  }

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    const { session } = services();
    if (!session.saveAndLeaveRun()) {
      this.leaving = false;
      this.notice = 'The run could not be saved.';
      return this.view?.refresh();
    }
    this.scene.start('MainMenu');
  }

  /** The name page's real text box (phones show their own keyboard), laid over the page's field. */
  private syncInput(): void {
    const want = !this.founded() && !this.charter && !services().session.evilTurnOffer() && this.draft.page === 'name';
    if (!want) return this.dropInput();
    if (this.input_) return;
    const el = document.createElement('input');
    el.type = 'text';
    el.value = this.draft.name;
    el.maxLength = EVIL_DATA.founding.names.maxLength;
    el.autocomplete = 'off';
    el.spellcheck = false;
    el.setAttribute('aria-label', 'Team name');
    el.dataset.testid = 'evil-name-input';
    Object.assign(el.style, { position: 'fixed', zIndex: '41', boxSizing: 'border-box', border: '0', background: 'transparent', padding: '0 10px', outline: 'none', fontWeight: '700' } satisfies Partial<CSSStyleDeclaration>);
    el.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') this.next();
      else if (e.key === 'Escape') this.back();
    });
    el.addEventListener('input', () => {
      this.draft = { ...this.draft, name: el.value };
      this.view?.refresh();
    });
    document.body.appendChild(el);
    this.input_ = el;
    this.place();
    el.focus({ preventScroll: true });
  }

  private dropInput(): void {
    this.input_?.remove();
    this.input_ = null;
  }

  private place(): void {
    this.placeOwn();
    const el = this.input_;
    if (!el) return;
    const field = this.view?.el.querySelector<HTMLElement>('.ev-field');
    if (!field) return void (el.style.display = 'none');
    const f = field.getBoundingClientRect(), look = getComputedStyle(field);
    const k = this.game.canvas.getBoundingClientRect().width / GAME_WIDTH;
    Object.assign(el.style, { display: '', left: `${f.left}px`, top: `${f.top}px`, width: `${f.width}px`, height: `${f.height}px`, fontSize: `${Math.max(16, 22 * k)}px`, fontFamily: look.fontFamily, color: look.color });
  }
}

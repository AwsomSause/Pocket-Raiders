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
import { foundingView, frameView } from '../ui/redux/screens/evilFounding';
import { boardView } from '../ui/redux/screens/evilBoard';
import { boardModel, dispatchRows, newDispatch, type DispatchDraft } from '../core/evilMode/boardScreens';
import { JOB_METHODS, type JobMethod } from '../core/evilMode/schema';
import { GAME_WIDTH } from '../ui/theme';
import { gateKey, gateSeen, openGate, otherWay, type CardGate } from '../core/evilMode/card';
import { jobProblem } from '../core/evilMode/dispatch';
import type { JobDraft } from '../core/evilMode/odds';
import type { StoredCard } from '../core/evilMode/schema';
import { cardModel, LEDGER_ACTS, ledgerModel, newLedger, type LedgerDraft } from '../core/evilMode/ledgerScreens';
import { cardView, filedCorner, ledgerView } from '../ui/redux/screens/evilLedger';
import { applicantActs, isQuestionAct, newRoster, personActs, refusalModel, rosterModel, type RosterDraft } from '../core/evilMode/rosterScreens';
import { officeView, refusalView, rosterView } from '../ui/redux/screens/evilRoster';
import { fileModel } from '../core/evilMode/heroScreens';
import { fileView } from '../ui/redux/screens/evilFile';
import { lineModel } from '../core/evilMode/lineScreens';
import { gymView } from '../ui/redux/screens/evilGym';
import { gymModel } from '../core/evilMode/gymScreens';
import { newTrade, tradeModel, type TradeSel } from '../core/evilMode/tradeScreens';
import { tradeView } from '../ui/redux/screens/evilTrade';
import { lineView } from '../ui/redux/screens/evilLine';
import { LINE_IDS } from '../core/evilMode/schema';
import { crossers } from '../core/evilMode/people';

/** Keys that confirm (input.ts KEY_MAP), read raw on the Card so a held key can be told from a press. */
const CONFIRM_CODES = new Set(['Enter', 'NumpadEnter', 'Space', 'KeyZ']);

type OpenCard = { job: JobDraft; gate: CardGate; scroll: number } | { read: StoredCard; scroll: number };

export class EvilScene extends Phaser.Scene {
  private view: ReduxView | null = null;
  private draft: FoundingDraft = newDraft();
  private disp: DispatchDraft = newDispatch();
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
  private refuseSel = 0;
  /** Slice 5: the File's open tab, or null when it's shut. */
  private file: number | null = null;
  /** Slice 6: the Line page's chosen stop, or null when it's shut; when a hold to confirm began, and the timer that redraws it. */
  private line: number | null = null;
  private lineHeldAt: number | null = null;
  private lineTimer: Phaser.Time.TimerEvent | null = null;
  /** Slice 8: the Gym page's chosen door, or null when it's shut. */
  private gym: number | null = null;
  /** Slice 11: the Trade page's tab, row and street/holding, or null when it's shut. */
  private trade: TradeSel | null = null;

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
    this.refuseSel = 0;
    this.file = null;
    this.line = null;
    this.lineHeldAt = null;
    this.lineTimer = null;
    this.gym = null;
    this.trade = null;
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
    this.view = mountRedux(this, {
      render: (c) => {
        const r = services().session.run;
        const block = r?.expansion?.evilMode;
        if (block?.district) {
          const frame = frameModel(block, archetype.name);
          // The Card takes the whole stage; the frame falls away (design Part 29 section 3).
          if (this.card) return cardView(cardModel(block, this.card), block.team.look.a, block.team.look.b);
          if (block.district.end) frame.button = EVIL_DATA.region.on && block.region.phase === 'tally' ? (block.here.stage >= 8 ? 'The end' : 'The Road') : EVIL_DATA.region.on && block.region.phase === 'road' ? 'Go on' : 'Leave';
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
          if (block.fight) frame.button = 'Fight';
          // An order across a line is answered in the yard before anything else moves (Part 7 section 11.1).
          const yard = refusalModel(block);
          const over = yard ? refusalView(yard, this.refuseSel) : rm?.office ? officeView(rm.office) : '';
          const look = `<div style="--team-a:${block.team.look.a};--team-b:${block.team.look.b}">`;
          return frameView(c, frame, this.notice, `${look}${boardView(boardModel(block, this.disp), frame, this.notice, { ...(ledger ? { ledger } : {}), ...(roster && !ledger ? { roster } : {}), ...(file && !ledger && !roster ? { file } : {}), ...(line ? { line } : {}), ...(gym ? { gym } : {}), ...(trade ? { trade } : {}), filed: filedCorner(this.filed) })}${over}</div>`);
        }
        if (block) return frameView(c, frameModel(block, archetype.name), this.notice);
        return foundingView(c, foundingModel(this.draft, { bossName: archetype.name, bossFile, starter: species?.name ?? '—', starterFile, oldLook, length: services().session.settings.expansion.evilRunLength }));
      },
      acts: {
        pick: (i) => this.pick(Number(i)),
        next: () => this.next(),
        back: () => this.back(),
        suggest: (n) => this.setName(n),
        advance: () => this.advance(),
        cell: (i) => this.cell(Number(i)),
        crew: (id) => this.toggleCrew(id),
        how: () => this.toHow(),
        method: (i) => { this.disp = { ...this.disp, how: Number(i), step: 'how' }; this.view?.refresh(); },
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
        rtab: (i) => { if (this.roster) this.roster = newRoster(Number(i)); this.view?.refresh(); },
        rrow: (i) => { if (this.roster && !this.roster.office) this.roster = { ...this.roster, row: Number(i), act: this.roster.row === Number(i) && this.roster.act !== null ? this.roster.act : 0 }; this.view?.refresh(); },
        ract: (arg) => { const [i, j] = arg.split(':').map(Number); if (this.roster) { this.roster = { ...this.roster, row: i!, act: j! }; this.rosterAct(); } },
        oanswer: (i) => this.officeAnswer(Number(i)),
        ocancel: () => { if (this.roster) this.roster = { ...this.roster, office: null }; this.view?.refresh(); },
        refuse: (id) => this.answer(id as 'withdraw' | 'swap' | 'insist'),
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
        lookPrev: (id) => { this.draft = turnLook(this.draft, id as LookRow, -1); this.view?.refresh(); },
        lookNext: (id) => { this.draft = turnLook(this.draft, id as LookRow, 1); this.view?.refresh(); },
        stay: (id) => this.evil({ type: 'goOn', stay: id || null }),
        recall: (id) => this.evil({ type: 'recall', id }),
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
    });
    this.syncInput();
  }

  private founded(): boolean {
    return !!services().session.run?.expansion?.evilMode;
  }

  private key(a: InputAction): void {
    if (this.leaving) return;
    if (this.founded()) return this.dayKey(a);
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
    if (block.district?.end) return this.leave();
    if (block.fight) return this.startFight();
    const cues = services().session.evilStep({ type: BEAT_END[block.here.beat] });
    if (cues.some((c) => c.id === 'fight')) return this.startFight();
    const refused = cues.find((c) => c.id === 'refused');
    this.notice = refused && 'reason' in refused ? refused.reason : null;
    this.disp = { ...newDispatch(), at: this.disp.at };
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
    if (this.ledger) return this.ledgerKey(a);
    if (this.roster) return this.rosterKey(a);
    if (this.file !== null) return this.fileKey(a);
    if (this.line !== null) return this.lineKey(a);
    if (this.gym !== null) return this.gymKey(a);
    if (this.trade !== null) return this.tradeKey(a);
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
    else if (a === 'left' || a === 'right') this.disp = { ...d, how: (d.how + (a === 'left' ? -1 : 1) + EVIL_DATA.methods.length) % EVIL_DATA.methods.length };
    else if ((a === 'up' || a === 'down') && EVIL_DATA.methods[d.how]?.id === 'take') {
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
    const first = EVIL_DATA.methods.findIndex((m) => (JOB_METHODS as readonly string[]).includes(m.id));
    this.disp = { ...d, step: 'how', how: d.step === 'how' ? d.how : first };
    this.view?.refresh();
  }

  /** The job being built in How, or null. */
  private draftJob(): JobDraft | null {
    const d = this.disp;
    const h = this.block()?.district?.holdings[d.at];
    const m = EVIL_DATA.methods[d.how];
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
    if (e.code === 'KeyY' && type === 'down' && !e.repeat && !this.card && !this.block()?.refusal && this.block()?.district) return this.toggleGym();
    if (e.code === 'KeyL' && type === 'down' && !e.repeat && !this.card && this.block()?.district) return this.toggleLedger();
    if (e.code === 'KeyR' && type === 'down' && !e.repeat && !this.card && !this.block()?.refusal && this.block()?.district) return this.toggleRoster();
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
    const card = this.block()?.cards.find((c) => c.id === id);
    if (!card) return;
    this.card = { read: card, scroll: 0 };
    this.cardOpenedAt = performance.now();
    this.redrawCard();
  }

  private toggleLedger(): void {
    if (this.card) return;
    this.ledger = this.ledger ? null : newLedger();
    this.roster = null;
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
    this.notice = null;
    this.view?.refresh();
  }

  private toggleLine(): void {
    if (this.card) return;
    const block = this.block();
    this.line = this.line === null ? Math.max(0, LINE_IDS.indexOf(block?.team.line ?? 'grey')) : null;
    this.ledger = null;
    this.roster = null;
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
    this.trade = this.trade === null ? newTrade() : null;
    this.ledger = null;
    this.roster = null;
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
    this.file = null;
    this.line = null;
    this.notice = null;
    this.cancelLineHold();
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
      this.said(services().session.evilStep({ type: 'letGo', id: p.id, kindly: a.id === 'letGoKind' }));
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
    if (a === 'left' || a === 'right') this.refuseSel = (this.refuseSel + (a === 'left' ? 2 : 1)) % 3;
    else if (a === 'confirm') return this.answer((['withdraw', 'swap', 'insist'] as const)[this.refuseSel]!);
    this.view?.refresh();
  }

  private answer(id: 'withdraw' | 'swap' | 'insist'): void {
    const cues = services().session.evilStep({ type: 'answerRefusal', answer: id });
    this.said(cues);
    const filed = services().session.run?.expansion?.evilMode?.log.at(-1)?.text;
    if (!cues.some((c) => c.id === 'refused') && filed) this.filed = filed;
    this.view?.refresh();
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
    const want = !this.founded() && this.draft.page === 'name';
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
    const el = this.input_;
    if (!el) return;
    const field = this.view?.el.querySelector<HTMLElement>('.ev-field');
    if (!field) return void (el.style.display = 'none');
    const f = field.getBoundingClientRect(), look = getComputedStyle(field);
    const k = this.game.canvas.getBoundingClientRect().width / GAME_WIDTH;
    Object.assign(el.style, { display: '', left: `${f.left}px`, top: `${f.top}px`, width: `${f.width}px`, height: `${f.height}px`, fontSize: `${Math.max(16, 22 * k)}px`, fontFamily: look.fontFamily, color: look.color });
  }
}

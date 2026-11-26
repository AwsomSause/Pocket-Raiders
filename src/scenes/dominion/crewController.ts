// DOMINION slice D3: the controller for the Morning (mockup 2) and the Crew File (mockup 5), kept beside DominionScene so
// the scene only forwards to it. It keeps the cursors; every change goes through GameSession.dominionStep (saved).

import { pokemonAssetIds, type AssetManifest } from '../../assets/catalog';
import { crewOf } from '../../core/dominion/crew';
import { fileModel, hireModel, leadsModel, morningModel, personaModel } from '../../core/dominion/crewScreens';
import { DOMINION_DATA } from '../../core/dominion/data';
import { dominionBlock } from '../../core/dominion/session';
import type { DominionAction } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { rxFileOf } from '../../ui/redux/assets';
import { hireOverlay, leadsOverlay, morningView } from '../../ui/redux/screens/dominion/crew';
import { assignCount, assignModel, assignTaskAt, ASSIGN_PAGE } from '../../core/dominion/assignScreen';
import { assignView } from '../../ui/redux/screens/dominion/assign';
import { personaView } from '../../ui/redux/screens/dominion/persona';
import { r5Band, r5Loyalty, r5Member, r5Members, r5Mole as r5MoleModel, r5Payday, r5People as r5PeopleModel, r5Pull as r5PullModel, r5RosterHead, r5Training } from '../../core/dominion/crewR50';
import { withCrew } from '../../core/dominion/crew';
import { teamColours } from '../../core/dominion/founding';
import type { R5Run } from '../../ui/redux/screens/dominion/r50/kit';
import { r5File, r5Id, r5Loyalty as r5LoyaltyView, r5Mole, r5Payday as r5PaydayView, r5People, r5Person, r5Heart, r5Pull, r5Roster, r5Train, r5Uniform, type R5CrewCtx } from '../../ui/redux/screens/dominion/r50/crew';

/** Redesign R5: the pages of the Crew tab (pass 50). The file is the old Crew File's rules; the rest read the block. */
export type R5CrewPage = 'roster' | 'file' | 'idcard' | 'loyalty' | 'payday' | 'uniform' | 'school' | 'mole' | 'people';
const R5_PAGES: readonly string[] = ['roster', 'file', 'idcard', 'loyalty', 'payday', 'uniform', 'school', 'mole', 'people'];
/** The old view kit's overlays (talk card, hire list, leads) over a pass-50 page. */
const overStage = (html: string): string => (html ? `<div class="dom" style="position:absolute;left:0;top:0;width:960px;height:540px;z-index:40"><div class="st" style="background:transparent">${html}</div></div>` : '');

interface Host {
  screenName: 'title' | 'setup' | 'opening' | 'hq' | 'map' | 'card' | 'crew' | 'reserve' | 'pyramid' | 'base' | 'rival' | 'ledger' | 'hero' | 'interrupt' | 'desk' | 'squads' | 'founding' | 'founded' | 'debate' | 'spy' | 'takeover' | 'broadcast' | 'assign' | 'district' | 'empire' | 'partners';
  setNotice(n: string | null): void;
  refresh(): void;
  step(a: DominionAction): boolean;
  /** D22: F opens the Confront room for this member. */
  confront(member: string): void;
  /** Redesign R0: the pass-50 chrome's live data. */
  r5run(): R5Run | null;
  r5boss(h: number): { pic: string; name: string };
  cache: { json: { get(k: string): unknown } };
}

export class CrewController {
  private sel = 0;
  /** -1: the Start the day button has the focus. */
  private taskAt = -1;
  private all = false;
  private talkAt = 0;
  private overlay: 'hire' | 'leads' | null = null;
  private pickAt = 0;
  private pitchAt = 0;
  /** D19: the personality card page of the Crew File (C opens it, Esc goes back to the file). */
  private persona = false;
  /** D29: the task under the cursor on the Assign page (an index into the whole list it shows). */
  private asAt = 0;
  /** Redesign R5: which page of the Crew tab is up, and the cursor on the Payday and Loyalty lists. */
  private pg: R5CrewPage = 'roster';
  private rowAt = 0;
  /** Redesign R5: the member who just joined (New card, mockup `pull`), shown over the page until Enter or Esc. */
  private pull: string | null = null;

  constructor(private readonly host: Host) {}

  private block() {
    return dominionBlock(services().session.run);
  }
  private talking(): boolean {
    return !!this.block()?.crew?.talks.length;
  }
  /** D28: the personality card is up (its own page on the board and the shutter). */
  personaOn(): boolean {
    return this.persona && this.host.screenName === 'crew' && !this.talking();
  }
  /** The HQ draws the Morning while it's morning (D3 replaces D1's Night Report panel). */
  owns(): boolean {
    return this.host.screenName === 'hq' && this.block()?.phase === 'morning';
  }
  private active(): boolean {
    return this.owns() || this.host.screenName === 'crew' || this.host.screenName === 'assign';
  }

  render(notice: string | null): string {
    const b = this.block();
    if (!b) return '';
    this.sel = Math.min(this.sel, b.members.length - 1);
    if (this.host.screenName === 'assign') return assignView(assignModel(b, this.sel, this.asAt, this.all), notice);
    if (this.host.screenName === 'crew') {
      const seed = services().session.run!.seed;
      const run = this.host.r5run();
      if (!run) return '';
      const x: R5CrewCtx = { run, team: teamColours(b), monFile: (s) => this.monFile(s), notice };
      const wb = withCrew(b);
      const m = r5Member(wb, wb.members[this.sel]!);
      if (this.pull && !this.talking()) {
        const p = r5PullModel(b, this.pull);
        if (p) return r5Pull(p, b.members.findIndex((q) => q.id === this.pull), x);
        this.pull = null;
      }
      if (this.persona && !this.talking()) return r5Person(personaModel(b, this.sel, seed, services().session.run?.ai), m, this.sel, x);
      const overlay = this.overlay === 'hire' ? hireOverlay(hireModel(b, seed), this.pickAt) : this.overlay === 'leads' ? leadsOverlay(leadsModel(b, seed), this.pickAt, this.pitchAt) : '';
      const f = fileModel(b, this.sel);
      // A talk card waiting for an answer is a heart-to-heart scene of its own (mockup `heart`).
      if (f.talk && !this.overlay) {
        const wi = b.members.findIndex((q) => q.name === f.talk!.name);
        const w = wi >= 0 ? r5Member(wb, wb.members[wi]!) : null;
        return r5Heart(f.talk, w ? { look: w.look, i: wi, sub: `${w.rank} · Loyalty ${w.loyalty}` } : null, this.host.r5boss(250), this.talkAt, x);
      }
      const over = overStage(overlay);
      const idx = (id: string): number => b.members.findIndex((q) => q.id === id);
      const voiceOf = (i: number, line: string) => ({ m: b.members[i]!, i, line });
      switch (this.pg) {
        case 'roster': return r5Roster({ members: r5Members(b), sel: this.sel, head: r5RosterHead(b) }, x) + over;
        case 'idcard': return r5Id(m, this.sel, r5Band(b, m), x, f.now.line) + over;
        case 'loyalty': {
          const ly = r5Loyalty(b);
          const rows = ly.rows.map((r) => ({ ...r, i: idx(r.id) }));
          const top = rows[0];
          const line = ly.low ? `${ly.low} is close to walking, Boss. Just saying.` : 'Everyone’s with you, Boss. For now.';
          return r5LoyaltyView(rows, Math.min(this.rowAt, rows.length - 1), x, top ? voiceOf(top.i, line) : null) + over;
        }
        case 'payday': {
          const p = r5Payday(b);
          const r = p.rows[Math.min(this.rowAt, p.rows.length - 1)];
          const line = r ? (r.owed ? `${r.name}: “You still owe me, Boss.”` : `${r.name}: ${r.wage ? `₽${r.wage} a week. ${r.mood}.` : 'No wage at this rank yet.'}`) : '';
          return r5PaydayView(p, idx, Math.min(this.rowAt, p.rows.length - 1), x, r ? voiceOf(idx(r.id), line.replace(/^[^:]+: /, '')) : null) + over;
        }
        case 'uniform': {
          const tc = teamColours(b);
          return r5Uniform(r5Members(b), this.sel, { initial: tc?.initial ?? '', colour: tc?.primary ?? null }, x, voiceOf(this.sel, tc ? 'Pressed and ready, Boss.' : 'Grey bands, Boss. Give us colours at the Founding.')) + over;
        }
        case 'people': return r5People(r5PeopleModel(b), this.sel, x) + over;
        case 'school': return r5Train(r5Training(b, this.sel), this.rowAt, this.sel, x) + over;
        case 'mole': {
          const w = r5MoleModel(b);
          // The voice: the most loyal member not on the wall.
          const v = [...b.members.keys()].filter((i) => !w.suspects.some((q) => q.i === i)).sort((a, z) => b.members[z]!.loyalty - b.members[a]!.loyalty)[0];
          return r5Mole(w, this.rowAt, x, v === undefined ? null : { m: b.members[v]!, i: v }) + over;
        }
        default: return r5File(f, m, this.sel, x) + over;
      }
    }
    return morningView(morningModel(b, this.sel, this.taskAt, this.all), notice, this.talkAt);
  }

  private monFile(species: string): string | null {
    const manifest = this.host.cache.json.get('manifest') as AssetManifest | undefined;
    const sp = services().session.content.species.get(species);
    return sp ? rxFileOf(manifest, pokemonAssetIds(sp.assets).front)?.file ?? null : null;
  }

  private member(): string | null {
    return this.block()?.members[this.sel]?.id ?? null;
  }
  private tasks(): string[] {
    const b = this.block();
    return b ? morningModel(b, this.sel, this.taskAt, this.all).tasks.map((t) => t.id) : [];
  }

  private answer(i: number): void {
    if (this.host.step({ t: 'talk', choice: i })) this.talkAt = 0;
  }
  /**
   * D29 (round-4 mockup m3): picking a task on the Morning opens the Assign a task page on it; the order is given there.
   * The order itself is D3's 'assign' step, unchanged.
   */
  private openAssign(i: number): void {
    const b = this.block();
    if (!b || this.talking()) return;
    this.asAt = Math.max(0, i);
    this.taskAt = i;
    this.host.screenName = 'assign';
    this.host.setNotice(null);
    this.host.refresh();
  }
  /** D28 + D29: the board's Assign photo opens the Assign page on the task under the Morning's cursor (else the first). */
  assignHere(): string | null {
    if (!this.owns()) return 'Orders are given in the Morning, at the HQ.';
    if (this.talking()) return 'Answer the crew first.';
    if (!this.tasks().length) return 'Nobody has a task to take today.';
    this.openAssign(Math.max(0, this.taskAt));
    return null;
  }
  private closeAssign(): void {
    this.host.screenName = 'hq';
    this.taskAt = this.asAt < this.tasks().length ? this.asAt : -1;
    this.host.setNotice(null);
  }
  /** Give the order: the member under the page takes the task under the cursor (D3's 'assign'). */
  private give(): void {
    const b = this.block();
    const m = this.member();
    const id = b ? assignTaskAt(b, this.sel, this.all, this.asAt) : null;
    if (!id || !m) return;
    if (this.host.step({ t: 'assign', member: m, task: id })) this.host.setNotice(null);
  }
  private asPick(k: number): void {
    const at = Math.floor(this.asAt / ASSIGN_PAGE) * ASSIGN_PAGE + k;
    if (at === this.asAt) return this.give();
    this.asAt = at;
    this.host.refresh();
  }
  private asToggleAll(): void {
    this.all = !this.all;
    this.asAt = 0;
    this.host.setNotice(null);
    this.host.refresh();
  }

  /** Tap targets (data-act). */
  acts(): Record<string, (arg: string) => void> {
    return {
      talk: (i) => this.answer(Number(i)),
      task: (i) => this.openAssign(Number(i)),
      asTask: (k) => this.asPick(Number(k)),
      asGive: () => this.give(),
      asAll: () => this.asToggleAll(),
      asWhere: () => this.cycleWhere(),
      asMember: (i) => { this.sel = Number(i); this.host.setNotice(null); this.host.refresh(); },
      asFlip: (d) => this.flip(Number(d)),
      crewMember: (i) => { this.sel = Number(i); this.taskAt = -1; this.host.refresh(); },
      moreTasks: () => { this.all = !this.all; this.taskAt = 0; this.host.refresh(); },
      flip: (d) => this.flip(Number(d)),
      hire: (i) => { this.pickAt = Number(i); this.pickConfirm(); },
      lead: (i) => { this.pickAt = Number(i); this.pitchAt = 0; this.host.refresh(); },
      pitch: (i) => { this.pitchAt = Number(i); this.pickConfirm(); },
      admit: () => this.pickConfirm(),
      crewWhere: () => this.cycleWhere(),
      persona: () => this.togglePersona(),
      r5c: (pg) => this.r5open(pg),
      r5cSel: (i) => this.r5sel(Number(i)),
      r5cPay: (k) => { this.rowAt = Number(k); this.host.refresh(); },
      r5train: (k) => (k === 'send' ? this.train() : this.trainPick(Number(k))),
      r5mole: (k) => (k === 'ask' ? this.moleAsk() : this.molePick(Number(k))),
    };
  }
  overs(): Record<string, (arg: string) => void> {
    return {
      talkOver: (i) => { this.talkAt = Number(i); this.host.refresh(); },
      taskOver: (i) => { this.taskAt = Number(i); this.host.refresh(); },
      asOver: (k) => { this.asAt = Math.floor(this.asAt / ASSIGN_PAGE) * ASSIGN_PAGE + Number(k); this.host.refresh(); },
      pickOver: (i) => { this.pickAt = Number(i); this.host.refresh(); },
    };
  }

  private flip(d: number): void {
    const n = this.block()?.members.length ?? 1;
    this.sel = (this.sel + d + n) % n;
    this.host.setNotice(null);
    this.host.refresh();
  }

  /** Redesign R5: open a page of the Crew tab (a button, a key or the crumb). */
  private r5open(pg: string): void {
    const b = this.block();
    if (!b || this.host.screenName !== 'crew') return;
    this.host.setNotice(null);
    if (pg === 'person') { if (!this.persona) this.togglePersona(); return; }
    if (pg === 'assign') {
      if (b.phase !== 'morning') { this.host.setNotice('Orders are given in the Morning, at the HQ.'); return this.host.refresh(); }
      return this.openAssign(0);
    }
    if (!R5_PAGES.includes(pg)) return;
    this.pull = null;
    this.persona = false;
    this.overlay = null;
    if (pg !== this.pg) this.rowAt = 0;
    this.pg = pg as R5CrewPage;
    this.host.refresh();
  }
  /** Training: the first tap picks a task, a second sends the member (D3's 'assign' step, Morning only). */
  private trainPick(k: number): void {
    if (k === this.rowAt) return this.train();
    this.rowAt = k;
    this.host.setNotice(null);
    this.host.refresh();
  }
  private train(): void {
    const b = this.block();
    const m = b?.members[this.sel];
    const row = b ? r5Training(b, this.sel).rows[this.rowAt] : undefined;
    if (!b || !m || !row) return;
    if (row.locked) { this.host.setNotice(row.locked); return this.host.refresh(); }
    if (b.phase !== 'morning') { this.host.setNotice('Orders are given in the Morning, at the HQ.'); return this.host.refresh(); }
    this.host.step({ t: 'assign', member: m.id, task: row.id });
  }
  /** Mole hunt: the first tap picks a suspect, a second (or Question) opens Confront for them. */
  private molePick(k: number): void {
    if (k === this.rowAt) return this.moleAsk();
    this.rowAt = k;
    this.host.setNotice(null);
    this.host.refresh();
  }
  private moleAsk(): void {
    const b = this.block();
    const q = b ? r5MoleModel(b).suspects[this.rowAt] : undefined;
    if (!b || !q) return;
    this.sel = q.i;
    this.host.confront(q.id);
  }
  /** The New card after a hire or an admitted lead: Enter goes to the roster, Esc back to the page under it. */
  private endPull(to: 'roster' | null): void {
    this.pull = null;
    if (to) this.r5open(to);
    else this.host.refresh();
  }
  /** A tap on a member: the first picks them, a second opens their file. */
  private r5sel(i: number): void {
    const b = this.block();
    if (!b || !b.members[i]) return;
    if (this.pg === 'loyalty') {
      const at = r5Loyalty(b).rows.findIndex((r) => r.id === b.members[i]!.id);
      if (at === this.rowAt && i === this.sel) return this.r5open('file');
      this.rowAt = Math.max(0, at);
      this.sel = i;
      return this.host.refresh();
    }
    if (i === this.sel) return this.r5open('file');
    this.sel = i;
    this.host.setNotice(null);
    this.host.refresh();
  }
  /** Redesign R5: a link to a Crew page from elsewhere (the pass-50 chrome's `r5go`). */
  openPage(pg: string): void {
    if (!R5_PAGES.includes(pg) || !this.block()) return;
    this.host.screenName = 'crew';
    this.r5open(pg);
  }
  /** The page of the Crew tab that is up (tests, the Start menu). */
  r5page(): R5CrewPage | 'person' {
    return this.persona ? 'person' : this.pg;
  }

  private togglePersona(): void {
    this.persona = !this.persona;
    this.overlay = null;
    this.host.setNotice(null);
    this.host.refresh();
  }

  private pickConfirm(): void {
    const b = this.block();
    if (!b) return;
    const had = new Set(b.members.map((m) => m.id));
    const joined = (): void => {
      const nb = this.block();
      const nu = nb?.members.find((m) => !had.has(m.id));
      if (nu) { this.pull = nu.id; this.overlay = null; this.host.refresh(); }
    };
    if (this.overlay === 'hire') { this.host.step({ t: 'hire', index: this.pickAt }); joined(); }
    else if (this.overlay === 'leads') {
      const lead = b.crew?.leads[this.pickAt];
      if (!lead) return;
      const pitch = DOMINION_DATA.crew.recruit.pitches[this.pitchAt]!.id;
      this.host.step(lead.waiting ? { t: 'admit', lead: lead.id } : { t: 'approach', lead: lead.id, pitch });
      joined();
      this.pickAt = Math.min(this.pickAt, Math.max(0, (this.block()?.crew?.leads.length ?? 1) - 1));
    }
  }

  /** Tab keys: Roster (3) opens the Crew File; HQ (1) goes back. Returns true when handled. */
  tab(i: number): boolean {
    if (i === 2) {
      // Redesign R5: the Crew tab opens the roster; pressing it again on the roster opens the member's file.
      this.pg = this.host.screenName === 'crew' && this.pg === 'roster' && !this.persona && !this.overlay ? 'file' : 'roster';
      this.host.screenName = 'crew';
      this.overlay = null;
      this.pull = null;
      this.persona = false;
      this.host.setNotice(null);
      return true;
    }
    if (i === 0 && this.host.screenName === 'assign') {
      this.closeAssign();
      return true;
    }
    if (i === 0 && this.host.screenName === 'crew') {
      this.host.screenName = 'hq';
      this.overlay = null;
      this.persona = false;
      this.host.setNotice(null);
      return true;
    }
    return false;
  }

  /** Letter keys on the Crew File and the Morning. Returns true when handled. */
  raw(code: string): boolean {
    const b = this.block();
    if (!b || !this.active()) return false;
    if (this.host.screenName === 'assign') {
      if (code === 'KeyP') return this.cycleWhere(), true;
      if (code === 'KeyM') return this.asToggleAll(), true;
      return false;
    }
    if (this.owns() && code === 'KeyP' && !this.talking()) return this.cycleWhere(), true;
    if (this.owns() && code === 'KeyM' && !this.talking()) {
      this.all = !this.all;
      this.taskAt = 0;
      this.host.refresh();
      return true;
    }
    if (this.host.screenName !== 'crew' || this.overlay || this.talking()) return false;
    const m = b.members[this.sel];
    if (!m) return false;
    // A page key leaves the New card and does its job (C opens the card, M the wall...).
    if (this.pull) this.pull = null;
    if (code === 'KeyC') return this.togglePersona(), true;
    // On the card page the arrow keys flip members (key()); no letters (Q is the round-4 command wheel).
    if (this.persona) return false;
    // Redesign R5: Y Loyalty, K Payday, V the Crew ID, J Uniforms.
    const R5_KEYS: Record<string, R5CrewPage> = { KeyY: 'loyalty', KeyK: 'payday', KeyV: 'idcard', KeyJ: 'uniform', KeyM: 'mole' };
    if (R5_KEYS[code]) return this.r5open(R5_KEYS[code]!), true;
    const go = (a: DominionAction): boolean => (this.host.step(a), true);
    switch (code) {
      case 'KeyF':
        return this.host.confront(m.id), true;
      case 'KeyT':
        return go({ t: 'evTalk', member: m.id });
      case 'KeyB':
        return go({ t: 'bail', member: m.id });
      case 'KeyG': {
        const run = services().session.run!;
        const item = (run.inventory['rare-candy'] ?? 0) > 0 ? 'rare-candy' : Object.keys(run.looseHeld ?? {}).sort().find((k) => (run.looseHeld![k] ?? 0) > 0);
        if (!item) {
          this.host.setNotice('Nothing to give: a Rare Candy (+1 member level) or a held item (+Morale).');
          this.host.refresh();
          return true;
        }
        return go({ t: 'gift', member: m.id, item });
      }
      case 'KeyH':
        this.overlay = 'hire';
        this.pickAt = 0;
        this.host.setNotice(null);
        this.host.refresh();
        return true;
      case 'KeyR':
        this.overlay = 'leads';
        this.pickAt = 0;
        this.pitchAt = 0;
        this.host.setNotice(null);
        this.host.refresh();
        return true;
    }
    return false;
  }

  /** Arrow keys, Enter and Esc. Returns true when handled. */
  key(a: InputAction): boolean {
    if (!this.active()) return false;
    const b = this.block()!;
    if (this.talking()) {
      const n = b.crew!.talks.length ? (morningModel(b, this.sel, this.taskAt, this.all).talk?.choices.length ?? 1) : 1;
      if (a === 'up' || a === 'down') this.talkAt = (this.talkAt + (a === 'up' ? -1 : 1) + n) % n;
      else if (a === 'confirm') this.answer(this.talkAt);
      return a !== 'back';
    }
    if (this.host.screenName === 'assign') {
      const n = assignCount(b, this.sel, this.all);
      if (a === 'left' || a === 'right') this.flip(a === 'left' ? -1 : 1);
      else if ((a === 'up' || a === 'down') && n) this.asAt = (this.asAt + (a === 'up' ? -1 : 1) + n) % n;
      else if (a === 'confirm') this.give();
      else if (a === 'back') this.closeAssign();
      return true;
    }
    if (this.host.screenName === 'crew') {
      if (this.overlay) {
        const rows = this.overlay === 'hire' ? hireModel(b, services().session.run!.seed).rows.length : b.crew?.leads.length ?? 0;
        if (a === 'back') this.overlay = null;
        else if ((a === 'up' || a === 'down') && rows) this.pickAt = (this.pickAt + (a === 'up' ? -1 : 1) + rows) % rows;
        else if (this.overlay === 'leads' && (a === 'left' || a === 'right')) this.pitchAt = (this.pitchAt + (a === 'left' ? -1 : 1) + 4) % 4;
        else if (a === 'confirm') this.pickConfirm();
        return true;
      }
      if (this.pull) {
        if (a === 'confirm') this.endPull('roster');
        else if (a === 'back') this.endPull(null);
        return true;
      }
      if (this.pg === 'school' || this.pg === 'mole') {
        const n = this.pg === 'school' ? r5Training(b, this.sel).rows.length : r5MoleModel(b).suspects.length;
        const fwd = this.pg === 'school' ? ['up', 'down'] : ['left', 'right'];
        if (fwd.includes(a) && n) this.rowAt = (this.rowAt + (a === fwd[0] ? -1 : 1) + n) % n;
        else if (a === 'confirm') (this.pg === 'school' ? this.train() : this.moleAsk());
        else if (a === 'back') this.r5open('roster');
        return true;
      }
      if (this.persona) {
        if (a === 'left' || a === 'right') this.flip(a === 'left' ? -1 : 1);
        else if (a === 'back') this.togglePersona();
        return true;
      }
      const pg = this.pg;
      if (pg === 'loyalty' || pg === 'payday') {
        const n = b.members.length;
        if ((a === 'up' || a === 'down') && n) {
          this.rowAt = (this.rowAt + (a === 'up' ? -1 : 1) + n) % n;
          if (pg === 'loyalty') this.sel = Math.max(0, b.members.findIndex((m) => m.id === r5Loyalty(b).rows[this.rowAt]!.id));
        } else if (a === 'confirm' && pg === 'loyalty') this.r5open('file');
        else if (a === 'back') this.r5open(pg === 'payday' ? 'loyalty' : 'roster');
        return true;
      }
      if (a === 'left' || a === 'right') this.flip(a === 'left' ? -1 : 1);
      else if (a === 'confirm' && pg === 'file') this.r5open('assign');
      else if (a === 'confirm') this.r5open('file');
      else if (a === 'back' && pg !== 'roster') this.r5open('roster');
      else if (a === 'back') {
        this.host.screenName = 'hq';
        this.host.setNotice(null);
      }
      return true;
    }
    // The Morning: ◀ ▶ pick the member, ▲ ▼ the task (from the Start button), Enter assigns or starts the day.
    const n = this.tasks().length;
    if (a === 'left' || a === 'right') {
      const k = b.members.length;
      this.sel = (this.sel + (a === 'left' ? -1 : 1) + k) % k;
      return true;
    }
    if (a === 'up' || a === 'down') {
      const next = this.taskAt + (a === 'up' ? -1 : 1);
      this.taskAt = next < -1 ? n - 1 : next >= n ? -1 : next;
      return true;
    }
    if (a === 'confirm' && this.taskAt >= 0) {
      this.openAssign(this.taskAt);
      return true;
    }
    if (a === 'back' && this.all) {
      this.all = false;
      this.taskAt = -1;
      return true;
    }
    return false;
  }

  /** D6: the next district for the selected member's district task (Patrol, Hold, Chant...). */
  private cycleWhere(): void {
    const b = this.block();
    const m = b?.members[this.sel];
    if (!b || !m) return;
    const ids = DOMINION_DATA.field.districts.map((d) => d.id);
    const now = crewOf(m).where ?? DOMINION_DATA.field.hq;
    this.host.step({ t: 'where', member: m.id, district: ids[(ids.indexOf(now) + 1) % ids.length]! });
  }

  /** Who the selected member is (tests). */
  current(): string | null {
    const m = this.block()?.members[this.sel];
    return m ? crewOf(m).task : null;
  }
}

// DOMINION redesign R4 (pass 50): the scene's side of the Jobs pages that got their own rules (core/dominion/jobs.ts).
// The Job board (the Jobs tab), "something happens" before a stealth job's roll, the calling card (C on Job done), the
// Black Market (M on the board, after dark), and the Smuggle and Gym takeover Cards drawn as the Smuggling run and the
// Gym plan (with the Leader's choice before Walk in). Cursors live here; every change to the run is a session step.

import { DOMINION_DATA } from '../../core/dominion/data';
import { card as coreCard, districtDef, type Card } from '../../core/dominion/field';
import { wayDef } from '../../core/dominion/growth';
import { bestFor, callingDue, callingRival, cargoOf, cargoOpt, JOBX, jobBoard, liveChance, liveOf, marketOpen, marketStock, type BoardJob, type LiveEvent } from '../../core/dominion/jobs';
import type { DominionBlock, GymWay, LiveAnswer } from '../../core/dominion/schema';
import type { InputAction } from '../../ui/input';
import { services } from '../../game/services';
import { rxImage } from '../../ui/redux/assets';
import { img } from '../../ui/redux/kit';
import { R5_SIZES } from '../../ui/redux/screens/dominion/r50/sizes';
import { SP, type R5Run, type R5Speaker } from '../../ui/redux/screens/dominion/r50/kit';
import type { R5Choice, R5Person } from '../../ui/redux/screens/dominion/r50/jobs';
import { money, r5Calling, r5Cargo, r5GymPlan, r5GymTalk, r5JobBoard, r5Live, r5Market, type R5BoardJob } from '../../ui/redux/screens/dominion/r50/jobs2';
import { memberColour, memberSpeaker } from './r4Bridge';

/** What the Card is set to (the scene's map cursor, read as an act's input). */
export interface JobInput { action: string; target: string | null; district: string; bring: string[]; opt: string | null }

interface Host {
  block(): DominionBlock | null;
  refresh(): void;
  people(): { run: R5Run; boss: R5Person; member: (id: string | null, name?: string) => R5Person | null } | null;
  /** The Card the map cursor points at, as an act's input. */
  input(): JobInput | null;
  setOpt(opt: string | null): void;
  /** Point the map cursor at a board job and open its Card. */
  take(j: BoardJob): void;
  doIt(live?: LiveAnswer): void;
  toMap(): void;
  monPic(species: string, h: number): string;
  bossPic(h: number): string;
  /** A line on the Job done page under the calling card. */
  say(line: string | null): void;
}

type Mode = 'board' | 'live' | 'calling' | 'market' | 'gymtalk';

/** Each target kind's building on the board and the live job (the mockups' town sprites). */
const KIND_ART: Record<string, string> = { shop: 'tw-mart2', site: 'tw-tower', route: 'tw-pine', center: 'tw-pc', street: 'tw-lamp', ghost: 'tw-memories', gym: 'tw-dojo', crowd: 'tw-eventhall', cave: 'tw-arch', dock: 'tw-counter', police: 'tw-statue' };
const TYPE_COL: Record<string, string> = { rock: '#b8a038', water: '#3f7fd9', electric: '#f0c020', grass: '#4caf50', poison: '#a040a0', psychic: '#f85888', fire: '#f08030', ground: '#e0c068' };
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export class JobsX {
  private mode: Mode | null = null;
  private at = 0;
  private from: 'map' | 'board' = 'map';
  private line: string | null = null;
  private live: { input: JobInput; ev: LiveEvent; card: Card } | null = null;
  private cargoAt = 0;

  constructor(private readonly host: Host) {}

  reset(): void {
    this.mode = null;
    this.at = 0;
    this.line = null;
    this.live = null;
    this.cargoAt = 0;
  }

  owns(): boolean {
    return this.mode !== null;
  }

  private run() {
    return services().session.run!;
  }

  // ---------- opening ----------

  openBoard(): void {
    this.mode = 'board';
    this.at = 0;
    this.line = null;
    this.host.refresh();
  }

  /** M on the board (or the map after dark): the Black Market, when a contact opens it. */
  openMarket(from: 'map' | 'board'): boolean {
    const b = this.host.block();
    if (!b) return false;
    this.from = from;
    this.mode = 'market';
    this.at = 0;
    this.line = marketOpen(b) ? null : JOBX.market.closed;
    this.host.refresh();
    return true;
  }

  /** C on Job done: the calling card for the job just done (when one can be left). */
  openCalling(): boolean {
    const b = this.host.block();
    if (!b || !callingDue(b)) return false;
    this.mode = 'calling';
    this.at = 1;
    this.host.refresh();
    return true;
  }

  callingDue(): boolean {
    const b = this.host.block();
    return !!b && !!callingDue(b);
  }

  /** Do it on a stealth job: when something happens, the question comes first (true: the scene waits for the answer). */
  maybeLive(input: JobInput): boolean {
    const b = this.host.block();
    if (!b) return false;
    const c = coreCard(b, this.run(), input.action, input.target, input.district, input.bring, input.opt);
    const ev = c ? liveOf(b, this.run().seed, c) : null;
    if (!c || !ev) return false;
    this.live = { input, ev, card: c };
    this.mode = 'live';
    this.at = 0;
    this.host.refresh();
    return true;
  }

  private close(): void {
    const was = this.mode;
    this.mode = was === 'market' && this.from === 'board' ? 'board' : null;
    this.at = 0;
    this.line = null;
    this.live = null;
    if (was === 'board' || (was === 'market' && this.from === 'map')) this.host.toMap();
    this.host.refresh();
  }

  // ---------- drawing ----------

  render(): string {
    const b = this.host.block(), q = this.host.people();
    if (!b || !q) return '';
    const p = { ...q, run: placed(q.run, b) };
    switch (this.mode) {
      case 'board': return this.board(b, p.run);
      case 'live': return this.livePage(b, p);
      case 'calling': return this.calling(b, p.run);
      case 'market': return this.market(b, p.run);
      case 'gymtalk': return this.gymTalk(b, p);
      default: return '';
    }
  }

  private jobs(b: DominionBlock): BoardJob[] {
    return jobBoard(b, this.run());
  }

  private board(b: DominionBlock, run: R5Run): string {
    const jobs = this.jobs(b);
    this.at = Math.min(this.at, Math.max(0, jobs.length - 1));
    const rows: R5BoardJob[] = jobs.map((j) => {
      const c = j.card, m = bestFor(b, c);
      const lo = c.range[0], hi = c.range[1];
      const pay = c.pay ? `${money(c.pay[0])}${c.pay[1] !== c.pay[0] ? `–${money(c.pay[1]).slice(1)}` : ''}${c.weekly ? `, then ${money(c.weekly)} a week` : ''}` : c.crate ? 'A crate of goods' : c.weekly ? `${money(c.weekly)} a week` : 'Intel';
      return {
        title: `${c.def.name} · ${c.target?.name ?? c.district.name}`,
        sub: `${c.district.name} · ${cap(c.def.stat ?? 'any')} job`,
        art: SP(KIND_ART[c.target?.kind ?? 'street'] ?? 'tw-lamp', 130),
        pct: c.exact ? c.chance : Math.round((lo + hi) / 2),
        pay, heat: `+${c.heat}`,
        faces: m ? [`<span class="face" data-nocheck="" style="--c:${memberColour(m.look, b)};width:34px;height:34px">${this.host.people()!.member(m.id)!.face(34)}</span>`] : [],
        colour: m ? memberColour(m.look, b) : '#3f7fd9',
      };
    });
    const cur = jobs[this.at];
    const m = cur ? bestFor(b, cur.card) : b.members[0] ?? null;
    const L = JOBX.board.lines;
    const line = this.line ?? (cur ? L[this.at % L.length]!.replace('{target}', cur.card.target?.name ?? cur.card.district.name) : JOBX.board.empty);
    const left = b.phase === 'day' ? `${b.actions} action${b.actions === 1 ? '' : 's'} left today` : b.phase === 'night' ? `${b.nightActions} night action${b.nightActions === 1 ? '' : 's'} left` : 'Evening errands';
    return r5JobBoard({ jobs: rows, at: this.at, orders: left, speaker: m ? memberSpeaker(m, b) : null, line, empty: JOBX.board.empty }, run);
  }

  private livePage(b: DominionBlock, p: NonNullable<ReturnType<Host['people']>>): string {
    const l = this.live;
    if (!l) return '';
    const L = JOBX.live, c = l.card;
    const smoke = (this.run().inventory[DOMINION_DATA.hero.foil.smokeItem] ?? 0) > 0;
    const going = l.input.bring[0] ? p.member(l.input.bring[0]) : null;
    const who = going ? `<span style="display:block;height:74px;overflow:hidden">${going.pic.replace(/height:\d+px/, 'height:74px').replace(/width:\d+px;/, '')}</span>` : this.host.bossPic(74);
    const mon = c.target?.foe.species[0] ? this.host.monPic(c.target.foe.species[0], 46) : '';
    const answers = [
      { label: L.still, sub: `Stealth ${l.ev.stat} vs ${l.ev.watch} · ${liveChance(c, l.ev, 'still')}%` },
      { label: L.smoke, sub: smoke ? L.smokeSub : L.noSmoke, dim: !smoke },
      { label: L.run, sub: `Heat +${L.runHeat} · ${liveChance(c, l.ev, 'run')}%` },
    ];
    return r5Live({
      job: `${c.def.name} · ${c.target?.name ?? c.district.name}`, art: SP(KIND_ART[c.target?.kind ?? 'street'] ?? 'tw-lamp', 211).replace('class="px', 'class="px lv-bld'),
      who, mon, steps: L.steps, now: 2, q: this.line ?? l.ev.text, answers, at: this.at, odds: c.chance,
    }, p.run);
  }

  private calling(b: DominionBlock, run: R5Run): string {
    const j = callingDue(b);
    if (!j) return '';
    const C = JOBX.calling, d = districtDef(j.at);
    const place = DOMINION_DATA.field.districts.flatMap((x) => x.targets).find((t) => t.id === j.t)?.name ?? d?.name ?? j.at;
    const rv = callingRival();
    const rows = [
      { up: C.dread >= 0, label: `Dread in ${d?.name ?? j.at}`, val: (C.dread >= 0 ? '+' : '−') + Math.abs(C.dread) },
      { up: C.regard >= 0, label: `Regard in ${d?.name ?? j.at}`, val: (C.regard >= 0 ? '+' : '−') + Math.abs(C.regard) },
      { up: false, label: 'Heat', val: `+${C.heat}` },
      ...(rv ? [{ up: false, label: rv.name, val: 'notices you' }] : []),
    ];
    const m = (j.who && b.members.find((x) => x.id === j.who)) || b.members[0];
    const night = b.phase === 'night' ? 'Night' : b.phase === 'evening' ? 'Evening' : 'Day';
    return r5Calling({
      night: `${night} ${b.day}`, place, team: b.teamName ?? 'Your crew', motto: C.motto, rows, at: this.at,
      speaker: m ? memberSpeaker(m, b) : null, line: C.lines[b.day % C.lines.length]!,
    }, run);
  }

  private stock(b: DominionBlock) {
    return marketStock(this.run().seed, b.day);
  }

  private market(b: DominionBlock, run: R5Run): string {
    const inv = this.run().inventory;
    const items = this.stock(b).map((x) => ({ ...x, dim: b.funds < x.price, have: inv[x.id] ?? 0 }));
    const M = JOBX.market, k = 't-rich', s = R5_SIZES[k] ?? [30, 60];
    const seller: R5Speaker = { name: M.seller, k };
    const sellerPic = SP(k, Math.min(150, s[1] * 2.5));
    return r5Market({ items, at: this.at, seller, sellerPic, line: this.line ?? M.line, place: `${districtDef(b.field.at)?.name ?? 'Town'} · back room` }, run);
  }

  // ---------- the Smuggle and Gym takeover Cards ----------

  /** The Card drawn as the Smuggling run or the Gym plan; null for every other action. */
  cardPage(b: DominionBlock, r: R5Run): string | null {
    const run = placed(r, b);
    const input = this.host.input();
    if (!input || (input.action !== 'smuggle' && input.action !== 'gym-takeover')) return null;
    const c = coreCard(b, this.run(), input.action, input.target, input.district, input.bring, input.opt);
    if (!c) return null;
    const m = c.bring[0] ? b.members.find((x) => x.id === c.bring[0]) : b.members[0];
    const speaker = m ? memberSpeaker(m, b) : null;
    if (input.action === 'smuggle') {
      const load = new Set(cargoOf(c.opt).map((x) => x.id));
      const rows = JOBX.cargo.items.map((x) => ({ ...x, on: load.has(x.id) }));
      const C = JOBX.cargo;
      const word = c.chance >= 60 ? C.check[0]! : c.chance >= 35 ? C.check[1]! : C.check[2]!;
      const pay = c.pay ? `${money(c.pay[0])}–${money(c.pay[1]).slice(1)}` : '';
      const from = districtDef(b.field.at)?.name ?? '';
      return r5Cargo({ route: `${from} → ${c.district.name}`, rows, at: this.cargoAt, check: c.chance, checkWord: word, pay, speaker, line: C.lines[load.has('pup') ? 0 : 1]!, blocked: c.blocked }, run);
    }
    const gym = DOMINION_DATA.growth.gyms.find((g) => g.district === c.district.id);
    if (!gym || !c.opts.length) return null;
    const rows = c.opts.map((o) => {
      const w = wayDef(o.id as GymWay), x = coreCard(b, this.run(), input.action, input.target, input.district, input.bring, o.id);
      const pct = !x ? '' : x.blocked ? 'not yet' : x.roll ? `${x.chance}%` : 'sure';
      const tone: 'ok' | 'mid' | 'bad' = !x || x.blocked ? 'bad' : !x.roll || x.chance >= 60 ? 'ok' : x.chance >= 35 ? 'mid' : 'bad';
      return { id: o.id, name: w.name, text: w.text, tone, pct };
    });
    const at = Math.max(0, c.opts.findIndex((o) => o.id === c.opt));
    const trainers = gym.trainers.map((_, i) => SP(i % 2 ? 't-applicant' : 't-acetrainer-m', 52));
    const w = wayDef(c.opt as GymWay);
    return r5GymPlan({
      gym: `${c.district.name} Gym · ${cap(gym.type)}`, leader: { name: gym.leader, pic: leaderPic(gym.leaderId, 70) }, trainers, me: this.host.bossPic(46),
      rows, at, speaker, line: (JOBX.gym.plan[w.id] ?? `“${w.text}”`).replace('{leader}', gym.leader), blocked: c.blocked,
    }, run);
  }

  /** Keys on the Smuggling run and the Gym plan (true: taken). */
  cardKey(a: InputAction): boolean {
    const b = this.host.block(), input = this.host.input();
    if (!b || !input) return false;
    if (input.action === 'smuggle') {
      const n = JOBX.cargo.items.length;
      if (a === 'up' || a === 'down') this.cargoAt = (this.cargoAt + (a === 'up' ? n - 1 : 1)) % n;
      else if (a === 'left' || a === 'right') this.toggleCargo(this.cargoAt);
      else return false;
      this.host.refresh();
      return true;
    }
    if (input.action === 'gym-takeover') {
      const c = coreCard(b, this.run(), input.action, input.target, input.district, input.bring, input.opt);
      if (!c?.opts.length) return false;
      const i = Math.max(0, c.opts.findIndex((o) => o.id === c.opt)), n = c.opts.length;
      if (a === 'up' || a === 'down' || a === 'left' || a === 'right') {
        this.host.setOpt(c.opts[(i + (a === 'up' || a === 'left' ? n - 1 : 1)) % n]!.id);
        return true;
      }
      if (a === 'confirm') {
        if (c.blocked) return false;
        this.mode = 'gymtalk';
        this.at = 0;
        this.host.refresh();
        return true;
      }
    }
    return false;
  }

  toggleCargo(i: number): void {
    const input = this.host.input(), it = JOBX.cargo.items[i];
    if (!input || !it) return;
    this.cargoAt = i;
    const ids = cargoOf(input.opt).map((x) => x.id);
    this.host.setOpt(cargoOpt(ids.includes(it.id) ? ids.filter((x) => x !== it.id) : [...ids, it.id]));
  }

  // ---------- the Leader's choice ----------

  private talkChoices(b: DominionBlock): { label: string; way: string | null }[] {
    const input = this.host.input();
    if (!input) return [];
    const c = coreCard(b, this.run(), input.action, input.target, input.district, input.bring, input.opt);
    const way = c?.opt ?? 'beat';
    const out: { label: string; way: string | null }[] = [{ label: JOBX.gym.ask[way] ?? wayDef(way as GymWay).name, way }];
    if (way !== 'beat' && c?.opts.some((o) => o.id === 'beat')) out.push({ label: JOBX.gym.ask.beat ?? 'Battle for the Gym', way: 'beat' });
    out.push({ label: JOBX.gym.walk, way: null });
    return out;
  }

  private gymTalk(b: DominionBlock, p: NonNullable<ReturnType<Host['people']>>): string {
    const input = this.host.input();
    const gym = input ? DOMINION_DATA.growth.gyms.find((g) => g.district === input.district) : undefined;
    if (!input || !gym) return '';
    const col = TYPE_COL[gym.type] ?? '#4caf50';
    const leader: R5Person = {
      pic: leaderPic(gym.leaderId, 250, true), face: (sz) => `<span style="display:block;margin-left:${-Math.round(sz * 0.25)}px;margin-top:${-Math.round(sz * 0.08)}px">${leaderPic(gym.leaderId, Math.round(sz * 2.5))}</span>`,
      name: gym.leader, role: `${districtDef(gym.district)?.name ?? ''} Gym Leader`, colour: col,
    };
    const chs: R5Choice[] = this.talkChoices(b).map((x, i) => ({ label: x.label, act: 'gymAns', arg: i, on: i === this.at, testid: `dom-gymtalk-${i}` }));
    const way = coreCard(b, this.run(), input.action, input.target, input.district, input.bring, input.opt)?.opt ?? 'beat';
    return r5GymTalk({ boss: p.boss, leader, line: JOBX.gym.talk[way] ?? JOBX.gym.talk.beat!, chs }, p.run);
  }

  private gymAnswer(i: number): void {
    const b = this.host.block();
    if (!b) return;
    const ch = this.talkChoices(b)[i];
    if (!ch) return;
    this.mode = null;
    this.at = 0;
    if (!ch.way) return this.host.refresh();
    this.host.setOpt(ch.way);
    this.host.doIt();
  }

  // ---------- answers ----------

  private liveAnswer(i: number): void {
    const l = this.live;
    if (!l) return;
    const ans: LiveAnswer = i === 0 ? 'still' : i === 1 ? 'smoke' : 'run';
    if (ans === 'smoke' && (this.run().inventory[DOMINION_DATA.hero.foil.smokeItem] ?? 0) < 1) {
      this.line = JOBX.live.noSmoke;
      this.at = i;
      return this.host.refresh();
    }
    this.mode = null;
    this.live = null;
    this.line = null;
    this.host.doIt(ans);
  }

  private callingAnswer(leave: boolean): void {
    if (leave) this.host.say(services().session.dominionStep({ t: 'calling' }).notice);
    this.mode = null;
    this.at = 0;
    this.host.refresh();
  }

  private buy(i: number): void {
    const b = this.host.block(), it = b ? this.stock(b)[i] : undefined;
    if (!b || !it) return;
    this.at = i;
    if (!marketOpen(b)) this.line = JOBX.market.closed;
    else this.line = services().session.dominionStep({ t: 'market', item: it.id }).notice;
    this.host.refresh();
  }

  key(a: InputAction): boolean {
    const b = this.host.block();
    if (!this.mode || !b) return false;
    if (this.mode === 'board') {
      const n = this.jobs(b).length;
      if ((a === 'left' || a === 'right') && n) this.at = (this.at + (a === 'left' ? n - 1 : 1)) % n;
      else if (a === 'confirm') { const j = this.jobs(b)[this.at]; if (j) { this.mode = null; this.host.take(j); } return true; }
      else if (a === 'back') this.close();
      this.line = null;
      this.host.refresh();
      return true;
    }
    if (this.mode === 'live') {
      if (a === 'up' || a === 'left') this.at = (this.at + 2) % 3;
      else if (a === 'down' || a === 'right') this.at = (this.at + 1) % 3;
      else if (a === 'confirm') return this.liveAnswer(this.at), true;
      else if (a === 'back') { this.mode = null; this.live = null; this.line = null; }
      this.host.refresh();
      return true;
    }
    if (this.mode === 'calling') {
      if (a === 'left' || a === 'right') this.at = this.at ? 0 : 1;
      else if (a === 'confirm') return this.callingAnswer(this.at === 1), true;
      else if (a === 'back') return this.callingAnswer(false), true;
      this.host.refresh();
      return true;
    }
    if (this.mode === 'market') {
      const n = this.stock(b).length;
      const d = a === 'left' ? -1 : a === 'right' ? 1 : a === 'up' ? -3 : a === 'down' ? 3 : 0;
      if (d) this.at = (this.at + d + n) % n;
      else if (a === 'confirm') return this.buy(this.at), true;
      else if (a === 'back') return this.close(), true;
      this.host.refresh();
      return true;
    }
    if (this.mode === 'gymtalk') {
      const n = this.talkChoices(b).length;
      if (a === 'up' || a === 'left') this.at = (this.at + n - 1) % n;
      else if (a === 'down' || a === 'right') this.at = (this.at + 1) % n;
      else if (a === 'confirm') return this.gymAnswer(this.at), true;
      else if (a === 'back') { this.mode = null; this.at = 0; }
      this.host.refresh();
      return true;
    }
    return false;
  }

  /** Number keys on the live question and the Leader's choice, M on the board; every other letter is eaten while a page is up. */
  raw(code: string): boolean {
    if (!this.mode) return false;
    const d = ['Digit1', 'Digit2', 'Digit3'].indexOf(code);
    if (this.mode === 'live' && d >= 0) return this.liveAnswer(d), true;
    if (this.mode === 'gymtalk' && d >= 0) return this.gymAnswer(d), true;
    if (this.mode === 'board' && code === 'KeyM') return this.openMarket('board');
    return true;
  }

  /** Space on the Smuggling run loads or unloads the cargo under the cursor. */
  cardRaw(code: string): boolean {
    const input = this.host.input();
    if (code !== 'Space' || input?.action !== 'smuggle') return false;
    this.toggleCargo(this.cargoAt);
    return true;
  }

  acts(): Record<string, (arg: string) => void> {
    return {
      boardTake: (i) => { const b = this.host.block(), j = b ? this.jobs(b)[Number(i) || 0] : undefined; if (j) { this.mode = null; this.host.take(j); } },
      boardBack: () => this.close(),
      marketOpen: () => void this.openMarket(this.mode === 'board' ? 'board' : 'map'),
      marketBuy: (i) => this.buy(i === '' ? this.at : Number(i)),
      marketBack: () => this.close(),
      liveAns: (i) => this.liveAnswer(Number(i)),
      liveGo: () => this.liveAnswer(this.at),
      liveBack: () => { this.mode = null; this.live = null; this.line = null; this.host.refresh(); },
      callingOpen: () => void this.openCalling(),
      callingLeave: () => this.callingAnswer(true),
      callingSkip: () => this.callingAnswer(false),
      callingGo: () => this.callingAnswer(this.at === 1),
      cargoToggle: (i) => this.toggleCargo(i === '' ? this.cargoAt : Number(i)),
      gymWalk: () => void this.cardKey('confirm'),
      gymAns: (i) => this.gymAnswer(Number(i)),
      gymTalkGo: () => this.gymAnswer(this.at),
    };
  }

  overs(): Record<string, (arg: string) => void> {
    return {
      boardOver: (i) => { if (this.mode === 'board') { this.at = Number(i); this.host.refresh(); } },
      liveOver: (i) => { if (this.mode === 'live') { this.at = Number(i); this.host.refresh(); } },
      marketOver: (i) => { if (this.mode === 'market') { this.at = Number(i); this.host.refresh(); } },
    };
  }
}

/** The place sign: the town the Boss is in and the time of day. */
function placed(run: R5Run, b: DominionBlock): R5Run {
  const t = b.phase === 'night' ? 'night' : b.phase === 'evening' ? 'evening' : 'day';
  return { ...run, place: `${districtDef(b.field.at)?.name ?? 'Kanto'} · ${t}` };
}

/** A Gym Leader standing `h` px tall: the mockups' sprite when they drew one, else the game's boss picture. */
export function leaderPic(id: string | null, h: number, flip = false): string {
  const k = id ? `t-${id}` : '';
  if (k && R5_SIZES[k]) return SP(k, h, flip ? 'flip' : '');
  const f = id ? `bosses/${id}.png` : '';
  const d = f ? rxImage(f) : undefined;
  if (d) return img(f, h / d[1], undefined, `display:block${flip ? ';transform:scaleX(-1)' : ''}`);
  return SP('t-acetrainer-m', h, flip ? 'flip' : '');
}

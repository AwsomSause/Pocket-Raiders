// DOMINION redesign R4 (pass 50): simple real rules for the mockups' Jobs pages that had no mechanic (director,
// 2026-11-21: "build them too"). The Job board (today's best three jobs), "something happens" on a stealth job (live),
// the calling card, the Black Market, smuggling cargo, and the battle album (Snapshot). Numbers in data/dominion/jobs.json.
// Determinism: the live event and the market's stock are pure hashes of the run seed (no stream is drawn); a preview
// never changes the block.

import { z } from 'zod';
import raw from '../../data/dominion/jobs.json';
import { hashSeed, Rng } from '../rng';
import type { RunState } from '../state';
import { DOMINION_DATA } from './data';
import { actionDef, addCardHook, addFightHook, addHeat, card, hops, playOf, setLiveHook, syncHeat, type Card } from './field';
import { addPart, hasContact } from './growth';
import { spend } from './hqFx';
import { addTension, teamsHere } from './rivals';
import type { DominionBlock, FieldFight, JobNote, JobXState, LiveAnswer, Member, Snap } from './schema';
import { fill } from './worldTurn';

const S = z.string().min(1), I = z.number().int(), N0 = I.min(0);
const Lines = z.array(S).min(1);
const JobsFileSchema = z.object({
  _source: S,
  board: z.object({ size: I.min(1).max(3), lines: Lines, empty: S }).strict(),
  live: z.object({
    chance: I.min(0).max(100), watch: z.tuple([I.min(1), I.min(1)]), per: N0, runOdds: I, runHeat: N0, steps: z.array(S).length(4), events: Lines,
    still: S, smoke: S, smokeSub: S, run: S, smokeLine: S, noSmoke: S,
  }).strict(),
  calling: z.object({ dread: I, regard: I, heat: I, tension: N0, motto: S, lines: Lines, left: S, notNow: S }).strict(),
  market: z.object({
    stock: I.min(1), seller: S, line: S, closed: S, noMoney: S, bought: S,
    items: z.array(z.object({ id: S, name: S, about: S, price: I.min(1), pic: S }).strict()).min(1),
  }).strict(),
  cargo: z.object({
    riskOdds: N0, items: z.array(z.object({ id: z.string().regex(/^[a-z]+$/), name: S, where: S, risk: I.min(1), pay: N0, pic: S }).strict()).min(1),
    lines: Lines, check: z.array(S).length(3),
  }).strict(),
  gym: z.object({ plan: S, talk: z.record(S, S), ask: z.record(S, S), walk: S }).strict(),
}).strict().superRefine((f, ctx) => {
  if (f.market.stock > f.market.items.length) ctx.addIssue({ code: 'custom', message: 'market stock is more than its items' });
  if (f.live.watch[0] > f.live.watch[1]) ctx.addIssue({ code: 'custom', message: 'live watch range is upside down' });
});
export type JobsFile = z.infer<typeof JobsFileSchema>;
export const JOBX: JobsFile = JobsFileSchema.parse(raw);

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));
const O = () => DOMINION_DATA.field.odds;

export const jobxOf = (b: DominionBlock): JobXState => (b.jobx ??= { called: null, album: [], snap: null });

// ---------- the Job board (mockup `jobs`) ----------

export interface BoardJob { action: string; target: string | null; district: string; card: Card; score: number }

/**
 * Today's three best jobs within a step of the Boss: every rolled action of this phase (the starting nine and the ones
 * practised) at every target it fits, scored by the odds times what it pays. Uses the Card's own numbers; never rolls.
 */
export function jobBoard(b: DominionBlock, run: Pick<RunState, 'party'>): BoardJob[] {
  if (b.phase !== 'day' && b.phase !== 'evening' && b.phase !== 'night') return [];
  const f = b.field;
  const ids = [...new Set([...DOMINION_DATA.field.starting, ...Object.keys(f.mastery).sort()])].filter((id) => actionDef(id)?.slot === b.phase && playOf(id)?.chance !== undefined);
  const near = DOMINION_DATA.field.districts.filter((d) => (hops(f, f.at, d.id) ?? 9) <= 1);
  const all: BoardJob[] = [];
  for (const id of ids) {
    const play = playOf(id)!;
    for (const d of near) {
      const ts = !play.kinds || play.kinds.includes('any') ? [null] : d.targets.filter((t) => play.kinds!.includes(t.kind));
      for (const t of ts) {
        const c = card(b, run, id, t?.id ?? null, d.id);
        if (!c || c.blocked || !c.roll) continue;
        const value = (c.pay ? (c.pay[0] + c.pay[1]) / 2 : 0) + (c.weekly ?? 0) * 4 + (c.crate ? 250 : 0) || 100;
        all.push({ action: id, target: t?.id ?? null, district: d.id, card: c, score: Math.round((c.chance * value) / 100) });
      }
    }
  }
  all.sort((x, y) => y.score - x.score || x.action.localeCompare(y.action) || x.district.localeCompare(y.district) || (x.target ?? '').localeCompare(y.target ?? ''));
  const out: BoardJob[] = [];
  for (const j of all) if (out.length < JOBX.board.size && !out.some((o) => o.action === j.action)) out.push(j);
  return out;
}

/** The member best at a job's stat (the board's face and line), else null. */
export function bestFor(b: DominionBlock, c: Card): Member | null {
  const stat = c.def.stat && c.def.stat !== 'all' ? c.def.stat : null;
  const ok = b.members.filter((m) => !m.crew?.out);
  if (!stat || !ok.length) return ok[0] ?? null;
  return [...ok].sort((x, y) => y.stats[stat] - x.stats[stat] || x.id.localeCompare(y.id))[0]!;
}

// ---------- "something happens" on a stealth job (mockup `live`) ----------

export interface LiveEvent { watch: number; text: string; stat: number; who: string }

/** Whether something happens on this Card's job (a stealth job that rolls): a pure hash of the seed and the act count. */
export function liveOf(b: DominionBlock, seed: string, c: Card): LiveEvent | null {
  const L = JOBX.live;
  if (!c.roll || c.def.stat !== 'stealth' || c.def.slot === 'evening' || c.blocked) return null;
  const r = new Rng(hashSeed(`${seed}::dominion-live::${b.field.rolls}::${c.def.id}`));
  if (r.int(1, 100) > L.chance) return null;
  const watch = r.int(L.watch[0], L.watch[1]);
  const text = L.events[r.int(0, L.events.length - 1)]!;
  const going = c.bring.map((id) => b.members.find((m) => m.id === id)).filter((m): m is Member => !!m);
  const stat = Math.max(b.field.edge.stats.stealth, ...going.map((m) => m.stats.stealth));
  const who = going[0]?.name ?? 'The Boss';
  return { watch, text: fill(text, { who }), stat, who };
}

/** The job's odds after an answer (Stay still: your Stealth against their watch; Grab it and run: worse odds, more Heat). */
export function liveChance(c: Card, ev: LiveEvent, ans: LiveAnswer): number {
  const L = JOBX.live;
  if (ans === 'smoke') return 0;
  const n = ans === 'still' ? c.chance + (ev.stat - ev.watch) * L.per : c.chance + L.runOdds;
  return clamp(n, O().min, O().max);
}

const smokeItem = (): string => DOMINION_DATA.hero.foil.smokeItem;

setLiveHook({
  check(b, run, c, ans) {
    const ev = liveOf(b, run.seed, c);
    if (ev && ans === 'smoke' && (run.inventory[smokeItem()] ?? 0) < 1) return JOBX.live.noSmoke;
    return null;
  },
  apply(b, run, c, ans) {
    const ev = liveOf(b, run.seed, c);
    if (!ev) return null;
    if (ans === 'smoke') {
      const id = smokeItem();
      run.inventory[id] = (run.inventory[id] ?? 0) - 1;
      if (!run.inventory[id]) delete run.inventory[id];
      // the next stealth job asks its own question
      b.field.rolls += 1;
      return [fill(JOBX.live.smokeLine, { who: ev.who })];
    }
    c.chance = liveChance(c, ev, ans);
    if (ans === 'run') c.heat += JOBX.live.runHeat;
    return null;
  },
});

// ---------- the calling card (mockup `calling`) ----------

const keyOf = (j: JobNote, i: number): string => `${i}|${j.d}|${j.a}|${j.at}|${j.t ?? ''}`;

/** The job a calling card can sign now: today's last job, done in a town (not the HQ, not an Evening errand), not yet signed. */
export function callingDue(b: DominionBlock): JobNote | null {
  const jobs = b.paper?.jobs ?? [];
  const j = jobs[jobs.length - 1];
  if (!j || j.d !== b.day || !(j.res === 'done' || j.res === 'big' || j.res === 'won')) return null;
  if (actionDef(j.a)?.slot === 'evening' || playOf(j.a)?.where === 'hq') return null;
  if (b.jobx?.called === keyOf(j, jobs.length - 1)) return null;
  return j;
}

/** Who notices a card: the first rival team in this region (their Tension goes up), else nobody. */
export const callingRival = (): { id: string; name: string } | null => {
  const t = teamsHere()[0];
  return t ? { id: t.id, name: t.name } : null;
};

function leaveCard(b: DominionBlock): { ok: boolean; notice: string } {
  const j = callingDue(b);
  if (!j) return { ok: false, notice: JOBX.calling.notNow };
  const C = JOBX.calling, ds = b.field.districts[j.at];
  if (!ds) return { ok: false, notice: JOBX.calling.notNow };
  ds.dread += C.dread;
  ds.regard += C.regard;
  addHeat(b, j.at, C.heat);
  const rv = callingRival();
  if (rv && C.tension) addTension(b, rv.id, C.tension);
  jobxOf(b).called = keyOf(j, (b.paper?.jobs.length ?? 1) - 1);
  syncHeat(b);
  const name = DOMINION_DATA.field.districts.find((d) => d.id === j.at)?.name ?? j.at;
  return { ok: true, notice: fill(C.left, { district: name, team: b.teamName ?? 'your crew' }) };
}

// ---------- the Black Market (mockup `market`) ----------

export type MarketItem = JobsFile['market']['items'][number];

/** Open after dark (Evening and Night) to a Boss with a Fence or a Black Market contact. */
export const marketOpen = (b: DominionBlock): boolean => (b.phase === 'evening' || b.phase === 'night') && hasContact(b);

/** Tonight's stock: `stock` of the list, picked by a hash of the seed and the day (the same all day). */
export function marketStock(seed: string, day: number): MarketItem[] {
  const r = new Rng(hashSeed(`${seed}::dominion-market::${day}`));
  const left = [...JOBX.market.items];
  const out: MarketItem[] = [];
  while (out.length < JOBX.market.stock && left.length) out.push(left.splice(r.int(0, left.length - 1), 1)[0]!);
  return out;
}

function buy(b: DominionBlock, run: RunState, id: string): { ok: boolean; notice: string } {
  const M = JOBX.market;
  if (!marketOpen(b)) return { ok: false, notice: M.closed };
  const it = marketStock(run.seed, b.day).find((x) => x.id === id);
  if (!it) return { ok: false, notice: M.closed };
  if (b.funds < it.price) return { ok: false, notice: M.noMoney };
  spend(b, it.price);
  run.inventory[it.id] = (run.inventory[it.id] ?? 0) + 1;
  return { ok: true, notice: fill(M.bought, { item: it.name, price: it.price.toLocaleString('en-US') }) };
}

// ---------- smuggling cargo (mockup `cargo`): the Smuggle Card's load ----------

export type CargoItem = JobsFile['cargo']['items'][number];

/** What a Smuggle Card's choice loads: ids joined by "+" (none is an empty van). */
export const cargoOf = (opt: string | null): CargoItem[] => {
  const ids = new Set((opt ?? '').split('+'));
  return JOBX.cargo.items.filter((x) => ids.has(x.id));
};
export const cargoOpt = (ids: readonly string[]): string | null => {
  const s = JOBX.cargo.items.filter((x) => ids.includes(x.id)).map((x) => x.id);
  return s.length ? s.join('+') : null;
};

addCardHook((_b, _run, c) => {
  if (c.def.id !== 'smuggle') return;
  c.opts = JOBX.cargo.items.map((x) => ({ id: x.id, label: x.name }));
  const load = cargoOf(c.opt);
  c.opt = cargoOpt(load.map((x) => x.id));
  const risk = load.reduce((a, x) => a + x.risk, 0), pay = load.reduce((a, x) => a + x.pay, 0);
  if (risk) addPart(c, `Cargo (risk ${risk})`, -risk * JOBX.cargo.riskOdds);
  if (pay && c.pay) c.pay = [c.pay[0] + pay, c.pay[1] + pay];
});

// ---------- the battle album (mockup `snap`) ----------

/** The fights worth a snapshot when won: the Hero, a Legendary, a Gym Leader, a rival Boss, a takeover. */
const BIG: readonly FieldFight['why'][] = ['hero', 'heroRaid', 'stand', 'legend', 'growth', 'rival', 'takeover', 'realm'];
const nice = (id: string): string => id.replace(/-/g, ' ').replace(/\b\w/g, (x) => x.toUpperCase());

addFightHook((b, run, fight, outcome) => {
  if (outcome !== 'win' || !BIG.includes(fight.why)) return [];
  const mine = run.party.find((m) => m.hp > 0)?.speciesId ?? run.party[0]?.speciesId;
  const foe = fight.lead;
  if (!mine || !foe) return [];
  jobxOf(b).snap = { d: b.day, mine, foe, text: `${nice(mine)} vs ${nice(foe)} · Day ${b.day}` };
  return [];
});

function keepSnap(b: DominionBlock, keep: boolean): { ok: boolean; notice: string | null } {
  const x = jobxOf(b);
  if (!x.snap) return { ok: false, notice: null };
  if (keep) {
    x.album.push(x.snap);
    if (x.album.length > 40) x.album.shift();
  }
  x.snap = null;
  return { ok: true, notice: null };
}
export const albumOf = (b: DominionBlock): readonly Snap[] => b.jobx?.album ?? [];

// ---------- the steps (session.ts sends them here) ----------

export function jobxStep(run: RunState, a: { t: 'calling' } | { t: 'market'; item: string } | { t: 'snap'; keep: boolean }): { ok: boolean; block: DominionBlock; notice: string | null } {
  const b = structuredClone(run.expansion!.dominion!);
  const out = a.t === 'calling' ? leaveCard(b) : a.t === 'market' ? buy(b, run, a.item) : keepSnap(b, a.keep);
  return { ok: out.ok, block: b, notice: out.notice };
}

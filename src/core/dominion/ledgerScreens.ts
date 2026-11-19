// DOMINION D6: the Empire Ledger's view model (mockup 7; Part 3 §1). Three spreads, one per index tab: MONEY (money |
// empire, the mockup's own spread), EMPIRE (territory | the Notoriety ladder) and CREW (crew | Pokémon, items, days).
// Plain data, no rolls.

import type { RunState } from '../state';
import { crewOf, rankWord, taskById } from './crew';
import { DOMINION_DATA } from './data';
import { heldIds, notorietyOf, peakOf, stepNow, type NotorietyParts } from './empire';
import { bandOf, statusOf } from './field';
import { stageIndex } from './hero';
import { cleanOf } from './hqFx';
import type { DominionBlock } from './schema';
import { fill } from './worldTurn';

const E = () => DOMINION_DATA.empire;
const F = () => DOMINION_DATA.field;
const money = (n: number): string => `${n < 0 ? '−' : ''}₽${Math.abs(n).toLocaleString('en-US')}`;
const signed = (n: number): string => `${n < 0 ? '−' : '+'}₽${Math.abs(n).toLocaleString('en-US')}`;

export const SPREADS = 3;

export interface LedgerLine { label: string; n: string; plus: boolean; due: string | null }
export interface LedgerModel {
  week: number;
  spread: number;
  tabs: { word: string; colour: string; on: boolean }[];
  stamp: string;
  pages: [number, number];
  money: {
    clean: string; dirty: string;
    /** Graph points, oldest first (closed weeks, then now), already scaled to the mockup's 344x108 box. */
    clean6: [number, number][]; dirty6: [number, number][]; from: string; to: string;
    lines: LedgerLine[]; net: string; netPlus: boolean; scribble: string | null;
  };
  empire: {
    held: string; buildings: string; rackets: string; pokemon: string;
    regard: number; dread: number; wanted: { word: string; n: number };
    tension: { name: string; word: string; n: number | null; look: string };
    hero: { word: string; n: number };
  };
  territory: { name: string; word: string; cls: string; control: number; regard: number; dread: number; heat: number; here: boolean }[];
  ladder: {
    steps: { word: string; min: number; calls: string; on: boolean; done: boolean }[];
    parts: NotorietyParts;
    next: { word: string; need: number } | null;
    opens: string[];
  };
  crew: { count: string; ranks: [string, number][]; wages: string; members: { name: string; rank: string; task: string; loyalty: number }[] };
  stores: { rows: [string, string][]; keyItems: string[] };
}

const STATUS_CLS: Record<string, string> = { owned: 'g', held: 'g', contested: 'y', foot: 'y', out: 'mu', rival: 'rd' };

/** The graph's points: a value per week mapped into the 344x108 box (y 96 at 0, 18 at the top value). */
function points(vals: number[], top: number): [number, number][] {
  const n = vals.length;
  return vals.map((v, i) => [n <= 1 ? 340 : Math.round((340 * i) / (n - 1)), Math.round(96 - (Math.max(0, v) / Math.max(1, top)) * 78)]);
}

export function ledgerModel(b: DominionBlock, run: Pick<RunState, 'party' | 'inventory' | 'box'>, spread: number): LedgerModel {
  const e = b.empire, L = E().ledger, N = E().notoriety;
  const weekLen = DOMINION_DATA.start.clock.weekLength;
  const week = Math.floor(b.day / weekLen) + 1;
  const clean = cleanOf(b);
  const dirty = b.funds - clean;

  // money: this week's lines, then the bills still due before the week closes
  const lines: LedgerLine[] = [];
  const page = e?.week ?? {};
  const count: Record<string, number> = { rackets: b.field.rackets.length, wages: b.members.length };
  for (const [key, def] of Object.entries(L.lines)) {
    const n = page[key];
    if (!n) continue;
    lines.push({ label: fill(def.label, { n: count[key] ?? 0 }), n: signed(n), plus: n > 0, due: null });
  }
  const billDay = Math.ceil((b.day + (b.day % weekLen === 0 ? 1 : 0)) / weekLen) * weekLen;
  let due = 0;
  if (!page.wages && b.members.length) {
    const w = b.members.reduce((a, m) => a + m.wage, 0);
    due -= w;
    lines.push({ label: fill(L.lines.wages!.label, { n: b.members.length }), n: signed(-w), plus: false, due: fill(L.due, { day: billDay }) });
  }
  if (!page.rent) {
    const r = DOMINION_DATA.start.clock.rent;
    due -= r;
    lines.push({ label: L.lines.rent!.label, n: signed(-r), plus: false, due: fill(L.due, { day: billDay }) });
  }
  const net = Object.values(page).reduce((a, n) => a + n, 0) + due;
  const past = (e?.weeks ?? []).slice(-(L.graph - 1));
  // One point is a flat line across the page (the first week), so there's always a line to read.
  const cs = past.length ? [...past.map((w) => w.clean), clean] : [clean, clean];
  const ds = past.length ? [...past.map((w) => w.dirty), dirty] : [dirty, dirty];
  const top = Math.max(1, ...cs, ...ds);
  const best = Math.max(0, ...(e?.weeks ?? []).map((w) => w.net));
  const scribble = net > 0 && (e?.weeks.length ?? 0) > 0 && net > best ? (best > 0 ? fill(L.best, { pct: Math.round(((net - best) / best) * 100) }) : L.bestFirst) : null;

  // empire
  const held = heldIds(b).length;
  const rackets = b.field.rackets.map((r) => F().districts.flatMap((d) => d.targets).find((t) => t.id === r.target)?.name ?? r.target);
  const crewMons = b.members.reduce((a, m) => a + m.team.length, 0);
  const stores = b.crew?.stores.length ?? 0;
  const band = bandOf(b.heat);
  const towns = Object.values(b.field.districts);

  // the ladder
  const parts = notorietyOf(b);
  const now = stepNow(b), peak = peakOf(b);
  const next = N.steps[now + 1];

  return {
    week,
    spread,
    tabs: L.tabs.map((t, i) => ({ word: t.word, colour: t.colour, on: i === spread })),
    stamp: N.steps[now]!.word.toUpperCase(),
    pages: [spread * 2 + 1, spread * 2 + 2],
    money: {
      clean: money(clean), dirty: money(dirty),
      clean6: points(cs, top), dirty6: points(ds, top),
      from: `W${past[0]?.w ?? week}`, to: `W${week}`,
      lines, net: signed(net), netPlus: net >= 0, scribble,
    },
    empire: {
      held: `${held} of ${F().districts.length}`,
      // Safehouses, outposts and other buildings come with the HQ slice (D5).
      buildings: 'HQ',
      rackets: rackets.length ? rackets.slice(0, 3).join(', ') + (rackets.length > 3 ? ` +${rackets.length - 3}` : '') : 'none yet',
      pokemon: `Team ${run.party.length} · Crew ${crewMons} · Stores ${stores}`,
      regard: towns.reduce((a, d) => a + Math.max(0, d.regard), 0),
      dread: towns.reduce((a, d) => a + Math.max(0, d.dread), 0),
      wanted: { word: band.word, n: b.heat },
      // Tension with the rival team arrives with D9. D11: the Hero's Threat (Part 4 §7) and its stage word.
      tension: { name: F().rivalTeam, word: L.noRival, n: null, look: L.rivalLook },
      hero: b.hero ? { word: DOMINION_DATA.hero.threat.stages[stageIndex(b.hero.threat)]!.word, n: Math.min(100, b.hero.threat) } : { word: L.heroWord, n: 0 },
    },
    territory: F().districts.map((d) => {
      const s = b.field.districts[d.id]!;
      const st = statusOf(s);
      return { name: d.name, word: E().control.short[st], cls: STATUS_CLS[st]!, control: s.control, regard: s.regard, dread: s.dread, heat: s.heat, here: d.id === F().hq };
    }),
    ladder: {
      steps: N.steps.map((s, i) => ({ word: s.word, min: s.min, calls: s.calls, on: i === now, done: i <= peak })),
      parts,
      next: next ? { word: next.word, need: next.min - parts.total } : null,
      opens: next ? next.unlocks : N.steps[now]!.unlocks,
    },
    crew: {
      count: `${b.members.length} / ${b.rosterCap}`,
      ranks: Object.entries(b.members.reduce<Record<string, number>>((a, m) => ({ ...a, [rankWord(m.rank)]: (a[rankWord(m.rank)] ?? 0) + 1 }), {})),
      wages: money(b.members.reduce((a, m) => a + m.wage, 0)),
      members: b.members.slice(0, 7).map((m) => ({ name: m.name, rank: rankWord(m.rank), task: taskById(crewOf(m).task)?.name ?? '—', loyalty: m.loyalty })),
    },
    stores: {
      rows: [
        ['Boss team', `${run.party.length}`],
        ['Crew teams', `${crewMons}`],
        ['Stores', `${stores}`],
        ['Box', `${run.box?.length ?? 0}`],
        ['Bag', `${Object.values(run.inventory).reduce((a, n) => a + (n > 0 ? n : 0), 0)} items`],
        ['Day', `${b.day} · Week ${week}`],
      ],
      keyItems: b.keyItems,
    },
  };
}

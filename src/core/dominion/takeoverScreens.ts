// DOMINION D14: what the Takeover screens show (v4 mockup s9 with the four path cards, the Holdings list, a Turning
// Point, and m13 the hijacked broadcast). Plain data out; never rolls and never changes the block.

import { DOMINION_DATA } from './data';
import type { DominionBlock, HoldingDef } from './schema';
import { topModel, type TopModel } from './screens';
import {
  broadcastOf, goalOf, momentProblem, pathsOf, placesHere, priceOf, stormProblem, takeCost, takeoverOf, takeProblem,
} from './takeover';

const T = () => DOMINION_DATA.takeover;
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const dname = (id: string): string => DOMINION_DATA.field.districts.find((d) => d.id === id)?.name ?? id;

export interface PathCard { id: string; name: string; icon: string; colour: string; dial: number; rows: { text: string; ok: boolean }[]; lead: boolean; pill: string | null; pillTone: 'y' | 'g' | 'k' }
export type TakeoverCta = { act: 'fight' | 'moment' | 'storm' | 'holdings' | 'back'; label: string; key: string };
export interface TakeoverModel {
  top: TopModel;
  region: string;
  cards: PathCard[];
  rib: string;
  alerts: { tone: 'r' | 'y' | 'v'; title: string; text: string }[];
  cta: TakeoverCta;
  /** A Turning Point waiting to be read (the Goal Track crossed a stage). */
  tp: { stage: number; name: string; title: string; scene: string; track: string } | null;
  held: number;
}

/** Mockup s9 with D14's four paths: the lead card (your Goal, else the furthest) wears the crown. */
export function takeoverModel(b: DominionBlock): TakeoverModel {
  const t = takeoverOf(structuredClone(b)), g = goalOf(b), paths = pathsOf(b);
  const best = paths.filter((p) => p.open).sort((x, y) => y.dial - x.dial)[0];
  const leadId = t.won?.path ?? (g ? 'goal' : best?.id);
  // Each card shows three lines, what's left first (as the mockup).
  const cards: PathCard[] = paths.map((p) => {
    const def = T().paths.find((x) => x.id === p.id)!;
    const won = t.paths.includes(p.id);
    const name = p.id === 'goal' && g ? g.track.toUpperCase() : def.name.toUpperCase();
    const pill = won ? (t.won?.path === p.id ? 'TOOK THE REGION' : 'DONE') : p.id === 'goal' && g ? 'YOUR GOAL' : p.id === 'goal' ? 'NO GOAL' : null;
    return { id: p.id, name, icon: def.icon, colour: def.colour, dial: p.dial, rows: [...p.rows.filter((r) => !r.ok), ...p.rows.filter((r) => r.ok)].slice(0, 3), lead: p.id === leadId, pill, pillTone: won ? 'g' : p.id === 'goal' && g ? 'y' : 'k' };
  });
  const region = cap(DOMINION_DATA.field.region);
  const wonName = t.won ? T().paths.find((p) => p.id === t.won!.path)!.name : '';
  const rib = t.taken
    ? `${region} is Taken by ${wonName}. Nobody is coming to save it.`
    : t.won
      ? `${wonName} took ${region}. Now the Hero makes a final stand.`
      : `The first path to finish takes ${region}. Then the Hero comes for you.`;
  const alerts: TakeoverModel['alerts'] = [];
  const st = t.goal, G = T().goal;
  if (g && st.cost >= G.warn) alerts.push({ tone: 'r', title: `${g.cost.name.toUpperCase()} ${Math.floor(st.cost)}`, text: `${g.opposition.line} At ${G.max} they strike back.` });
  for (const [id, h] of Object.entries(t.hold)) {
    const def = placesHere().find((x) => x.id === id);
    if (!def) continue;
    if (h.until !== null) alerts.push({ tone: 'y', title: 'SEIZING', text: `${def.place}: hold on until Day ${h.until} (${h.cond}%).` });
    else if (h.cond < 100) alerts.push({ tone: 'r', title: 'UNDER ATTACK', text: `${def.place} is at ${h.cond}%. At 0 it is lost.` });
    if (alerts.length >= 2) break;
  }
  if (g && st.track >= 100 && !st.done && g.finish && alerts.length < 2) alerts.push({ tone: 'v', title: 'THE MOMENT', text: `${g.opposition.name} stands between you and ${g.name}.` });
  const fightWaits = b.field.fight?.why === 'takeover' && !b.field.fight.begun;
  const cta: TakeoverCta = fightWaits
    ? { act: 'fight', label: '⚔ Next fight ▶', key: 'Enter' }
    : !momentProblem(b)
      ? { act: 'moment', label: `★ Face ${g!.opposition.name} ▶`, key: 'M' }
      : !stormProblem(b)
        ? { act: 'storm', label: '⚑ Storm the rival HQ ▶', key: 'S' }
        : { act: 'holdings', label: `▦ Holdings · ${Object.values(t.hold).filter((h) => h.until === null).length} held ▶`, key: 'P' };
  const tp = g && st.tp !== null ? { stage: st.tp + 1, name: g.stages[st.tp]!.name, title: g.stages[st.tp]!.title, scene: g.stages[st.tp]!.scene, track: g.track } : null;
  return { top: topModel(b, 'TAKEOVER'), region, cards, rib, alerts, cta, tp, held: Object.values(t.hold).filter((h) => h.until === null).length };
}

// ---------- the Holdings list (takeover-bonuses.md, Kanto) ----------

export interface HoldingRow { id: string; place: string; town: string; kind: string; size: string; bonus: string; text: string; state: 'held' | 'seizing' | 'open' | 'locked'; why: string | null; cost: number; cond: number | null; limited: string | null }
export interface HoldingsModel { rows: HoldingRow[]; at: number; page: number; pages: number; per: number; held: number; weekly: number; region: string; notice: string | null }
const KIND_WORD: Record<string, string> = { buyout: 'Buy out', home: 'Buy', infiltrate: 'Infiltrate', seize: 'Seize', raid: 'Raid', annex: 'Annex the town', gym: 'Take the Gym', league: 'Beat the League' };

export function holdingsModel(b: DominionBlock, at: number, notice: string | null = null): HoldingsModel {
  const t = takeoverOf(structuredClone(b));
  const rows: HoldingRow[] = placesHere().map((h: HoldingDef) => {
    const hd = t.hold[h.id];
    const why = hd ? null : takeProblem(b, h.id);
    const state: HoldingRow['state'] = hd ? (hd.until === null ? 'held' : 'seizing') : why ? 'locked' : 'open';
    return {
      id: h.id, place: h.place, town: dname(h.district ?? ''), kind: KIND_WORD[h.kind] ?? h.kind, size: h.size, bonus: h.bonus.name, text: h.bonus.text,
      state, why, cost: takeCost(h), cond: hd ? hd.cond : null, limited: h.status === 'limited' ? h.note ?? null : null,
    };
  });
  // Yours first, then what you can take now, then the rest.
  const order = { held: 0, seizing: 1, open: 2, locked: 3 };
  const town = (id: string): number => DOMINION_DATA.field.districts.findIndex((d) => d.id === placesHere().find((h) => h.id === id)?.district);
  rows.sort((x, y) => order[x.state] - order[y.state] || town(x.id) - town(y.id));
  const per = 8, pages = Math.max(1, Math.ceil(rows.length / per));
  const a = Math.max(0, Math.min(at, rows.length - 1));
  const weekly = placesHere().filter((h) => t.hold[h.id]?.until === null).reduce((s, h) => s + (h.fx.find((f) => f.k === 'income')?.n ?? 0) - (t.hold[h.id]!.way === 'via' ? 0 : Math.round((priceOf(h) * T().holding.upkeepPct) / 100)), 0);
  return { rows, at: a, page: Math.floor(a / per), pages, per, held: rows.filter((r) => r.state === 'held').length, weekly, region: cap(DOMINION_DATA.field.region), notice };
}

// ---------- m13: the hijacked broadcast ----------

export interface BroadcastModel { onAir: string; small: string; head: string; say: string; ticker: string[]; team: string; region: boolean }
export function broadcastModel(b: DominionBlock): BroadcastModel | null {
  const v = broadcastOf(b);
  if (!v) return null;
  return { onAir: T().broadcast.onAir, small: v.small, head: v.head, say: v.say, ticker: v.ticker, team: v.team, region: v.region };
}

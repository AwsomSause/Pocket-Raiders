// The Trade Stop screen's model (trade stops redesign): one shape for the Trade Post service and the
// Plaza's specialist traders, built from their existing option lists. Read-only: picking an offer still
// goes through useService / usePlaza, so what a trade does is unchanged.
import type { Content } from '../contentSchema';
import { getSpecies } from '../pokemon';
import { PLAZA } from '../plaza/schema';
import { sectionView, traderGift } from '../plaza/flow';
import { generateTradeOffer, serviceView, tradeArrivalLevel } from '../services/flow';
import { TRADES } from '../tradePools';
import type { RunState } from '../state';

export type TradeSource = 'service' | 'plaza';

export interface TradeSide {
  speciesId: string;
  name: string;
  level: number;
  types: string[];
}

export interface TradeTrader {
  id: string;
  name: string;
  line: string;
  /** Trainer art id (a registered `boss.npc_*`), drawn by the style; the scene checks it exists. */
  art: string;
}

export interface TradeOffer {
  /** The option id passed back to useService / usePlaza. */
  id: string;
  trader: TradeTrader;
  /** Your Pokémon that leaves (null when you have nothing the trader wants). */
  give: TradeSide | null;
  /** What you get. */
  get: TradeSide;
  cost: number;
  /** Why it cannot be picked now, or null. */
  problem: string | null;
  /** One-line summary ("Base total 320 > 405 · moves start fresh"). */
  note: string;
}

export interface TradeView {
  source: TradeSource;
  sideId: string;
  /** "TRADE POST" or "TRAINER PLAZA". */
  place: string;
  money: number;
  offers: TradeOffer[];
}

/** Trader art by Plaza trader id (Pokemon Memories / boss-pack NPC sprites already in the catalog). */
export const TRADER_ART: Record<string, string> = {
  'post-clerk': 'boss.npc_gentleman',
  't-pikachu': 'boss.npc_rocker',
  't-eevee': 'boss.npc_pokemonbreeder',
  't-baby': 'boss.npc_lady',
  't-onix': 'boss.npc_hiker',
  't-farfetchd': 'boss.npc_aromalady',
  't-dragon': 'boss.npc_cooltrainer_m',
  't-kanga': 'boss.npc_cooltrainer_f',
  't-lapras': 'boss.npc_sailor',
  't-porygon': 'boss.npc_scientist',
  't-legend': 'boss.npc_channeler',
};
const FALLBACK_ART = 'boss.npc_gentleman';

const CLERK: TradeTrader = { id: 'post-clerk', name: 'Trade Post Clerk', line: 'Pick one of yours. I always have something of a similar strength.', art: TRADER_ART['post-clerk']! };

const bst = (content: Content, id: string): number => Object.values(getSpecies(content, id).baseStats).reduce((a, b) => a + b, 0);

function side(content: Content, speciesId: string, level: number): TradeSide {
  const sp = getSpecies(content, speciesId);
  return { speciesId, name: sp.name, level, types: [...sp.types] };
}

/** The Trade Stop model for a Trade Post (`service`) or a Plaza (`plaza`) stop. */
export function tradeView(content: Content, run: RunState, source: TradeSource, sideId: string): TradeView {
  const offers: TradeOffer[] = [];
  if (source === 'service') {
    for (const o of serviceView(content, run, sideId).options) {
      const [, uid, to] = o.id.split(':');
      const mon = run.party.find((m) => m.uid === uid);
      if (!mon || !to) continue;
      const gen = generateTradeOffer(content, run, sideId, mon);
      offers.push({ id: o.id, trader: CLERK, give: side(content, mon.speciesId, mon.level), get: side(content, to, tradeArrivalLevel(content, run, sideId, mon, to)), cost: o.cost, problem: o.problem, note: `${gen && gen.speciesId === to ? `${TRADES.pools[gen.pool].name} · ` : ''}Base total ${bst(content, mon.speciesId)} > ${bst(content, to)} · moves and friendship start fresh` });
    }
  } else {
    for (const o of sectionView(content, run, sideId, 'traders').options) {
      const [, traderId, uid] = o.id.split(':');
      const def = PLAZA.traders.find((t) => t.id === traderId);
      if (!def) continue;
      const trader: TradeTrader = { id: def.id, name: def.name, line: def.line, art: TRADER_ART[def.id] ?? FALLBACK_ART };
      const mon = run.party.find((m) => m.uid === uid);
      const gift = traderGift(content, run, def.id, mon?.level ?? 5);
      offers.push({ id: o.id, trader, give: mon ? side(content, mon.speciesId, mon.level) : null, get: side(content, gift.speciesId, gift.level), cost: o.cost, problem: o.problem, note: mon ? `Wants ${def.want.label} · base total ${bst(content, mon.speciesId)} > ${bst(content, gift.speciesId)}` : `Wants ${def.want.label}` });
    }
  }
  return { source, sideId, place: source === 'service' ? 'TRADE POST' : 'TRAINER PLAZA', money: run.money, offers };
}

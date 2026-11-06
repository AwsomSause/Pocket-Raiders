// Beta 4.4: the next stage is built from the stage the player just finished.
//
// Nothing about a stage is decided before the player reaches it. When a stage starts, this reads what the player
// did on the last one (counters compared with a snapshot taken when that stage began): Pokémon caught, battles
// won, events played, money moved, heals and wipes. The strongest one or two of those "signals" then
//   1. weight which theme the stage gets (more new types for a catcher, a tougher matchup for a team that
//      has been winning easily, a kinder one for a team that struggled), and
//   2. add one fitting stop each (a rare-Pokémon stop for a catcher, a dojo or tower for a fighter, a detour
//      for an explorer, a merchant for a big spender, a rest and a heal stop for a team that struggled).
// The player sees why on the stage banner and on the map's item list ("Route plan").
//
// Determinism: the theme pick still uses the 'map' stream (with no signal it is the same plain pick as before);
// the extra stops use their own generator seeded by the run seed and the stage, so no other roll moves.

import type { Content, EventDef, Theme, TypeName } from './contentSchema';
import { typeEffectiveness } from './battle/damage';
import { eligibleEvents } from './events';
import { stageKey } from './mapItems';
import { getSpecies } from './pokemon';
import { hashSeed, Rng } from './rng';
import type { RunState, StageMap } from './state';

/** The counters the plan compares between stages. */
export const PLAN_COUNTERS = ['pokemonCaught', 'battlesWon', 'eventsCompleted', 'moneySpent', 'moneyEarned', 'healStopsUsed'] as const;

export type SignalId = 'catcher' | 'fighter' | 'explorer' | 'shopper' | 'struggled';

export interface StageSignal {
  id: SignalId;
  /** How far past its threshold the player went (1 = exactly at it); the strongest signals win. */
  strength: number;
  /** Why, in the player's words ("You caught 4 Pokémon"). */
  why: string;
}

/** Event stop types (events.json `stop`) each signal adds one of. */
export const SIGNAL_STOPS: Record<SignalId, string[]> = {
  catcher: ['rare', 'swarm', 'wild', 'special'],
  fighter: ['dojo', 'tower', 'ambush'],
  explorer: ['detour', 'shrine', 'landmark', 'treasure', 'library'],
  shopper: ['merchant', 'casino'],
  struggled: ['rest', 'camp'],
};

const SIGNAL_LINES: Record<SignalId, { theme: string; stop: string }> = {
  catcher: { theme: 'more types you have not caught yet', stop: 'a rare Pokémon stop' },
  fighter: { theme: 'a route that tests your team', stop: 'a battle challenge' },
  explorer: { theme: 'a new place to explore', stop: 'a detour worth exploring' },
  shopper: { theme: 'a new market', stop: 'a merchant' },
  struggled: { theme: 'a route your team can handle', stop: 'a rest stop and an extra heal' },
};

/** Takes the snapshot the next stage will be compared with (mutates `run`). */
export function snapshotStagePlan(run: RunState, lines: string[]): void {
  run.stagePlan = {
    counters: Object.fromEntries(PLAN_COUNTERS.map((k) => [k, run.log.counters[k] ?? 0])),
    wipes: run.rules.wipes,
    lines,
  };
}

/** What stood out on the last stage, strongest first (empty on the first stage of a run). */
export function stageSignals(content: Content, run: RunState): StageSignal[] {
  const snap = run.stagePlan;
  if (!snap) return [];
  const cfg = content.balance.stagePlan;
  const d = (k: (typeof PLAN_COUNTERS)[number]) => Math.max(0, (run.log.counters[k] ?? 0) - (snap.counters[k] ?? 0));
  const wipes = Math.max(0, run.rules.wipes - snap.wipes);
  const heals = d('healStopsUsed');
  const out: StageSignal[] = [];
  const struggled = wipes >= cfg.wipes || heals >= cfg.heals;
  if (struggled) {
    out.push({ id: 'struggled', strength: Math.max(wipes / cfg.wipes, heals / cfg.heals), why: wipes > 0 ? `Your team wiped out ${wipes === 1 ? 'once' : `${wipes} times`}` : `You needed ${heals} healing stops` });
  }
  const caught = d('pokemonCaught');
  if (caught >= cfg.catcher) out.push({ id: 'catcher', strength: caught / cfg.catcher, why: `You caught ${caught} Pokémon` });
  const won = d('battlesWon');
  if (!struggled && won >= cfg.fighter) out.push({ id: 'fighter', strength: won / cfg.fighter, why: `You won ${won} battles without trouble` });
  const events = d('eventsCompleted');
  if (events >= cfg.explorer) out.push({ id: 'explorer', strength: events / cfg.explorer, why: `You stopped at ${events} events` });
  const moved = d('moneySpent') + d('moneyEarned');
  if (moved >= cfg.shopper) out.push({ id: 'shopper', strength: moved / cfg.shopper, why: `₽${moved.toLocaleString('en-US')} changed hands` });
  // Strongest first; ties keep the order above (struggling first, so help is never crowded out).
  return out.map((s, i) => ({ s, i })).sort((a, b) => b.s.strength - a.s.strength || a.i - b.i).slice(0, cfg.maxSignals).map((x) => x.s);
}

const partyTypes = (content: Content, run: RunState): TypeName[][] => run.party.map((m) => getSpecies(content, m.speciesId).types as TypeName[]);

/** How much `signal` favours `theme` (0 = no pull). */
function pull(content: Content, run: RunState, signal: SignalId, theme: Theme): number {
  const types = theme.types as TypeName[];
  const team = partyTypes(content, run);
  if (signal === 'catcher') {
    const caughtTypes = new Set(run.log.speciesCaught.flatMap((id) => (content.species.has(id) ? getSpecies(content, id).types : [])));
    return types.some((t) => !caughtTypes.has(t)) ? 1 : 0;
  }
  if (signal === 'fighter') {
    // A theme whose types hit at least half the team super-effectively.
    const hit = team.filter((own) => types.some((t) => typeEffectiveness(content.typeChart, t, own) > 1)).length;
    return team.length > 0 && hit * 2 >= team.length ? 1 : 0;
  }
  if (signal === 'struggled') {
    // A theme the team's own types hit super-effectively.
    return team.some((own) => own.some((t) => typeEffectiveness(content.typeChart, t, types) > 1)) ? 1 : 0;
  }
  return 0;
}

/**
 * The stage's theme: a theme not used yet this run, weighted toward what the last stage's signals ask for. With no
 * signal (or none that cares about themes) this is the plain uniform pick. Returns the reason line when a signal won.
 */
export function pickPlannedTheme(content: Content, run: RunState, signals: StageSignal[], rng: Rng): { theme: Theme; line: string | null } {
  const all = [...content.themes.values()];
  const fresh = all.filter((t) => !run.usedThemes.includes(t.id));
  const pool = fresh.length > 0 ? fresh : all;
  const bonus = content.balance.stagePlan.themeBonus;
  const weights = pool.map((t) => ({ t, w: 1 + signals.reduce((sum, s) => sum + bonus * pull(content, run, s.id, t), 0) }));
  if (weights.every((x) => x.w === 1)) return { theme: rng.pick(pool), line: null };
  const theme = rng.weighted(weights.map((x) => ({ item: x.t, weight: x.w })));
  const why = signals.find((s) => pull(content, run, s.id, theme) > 0);
  return { theme, line: why ? `${why.why}, so this stage brings ${SIGNAL_LINES[why.id].theme}.` : null };
}

/** The events a signal can add, not already on the map. */
function stopPool(content: Content, run: RunState, signal: SignalId, onMap: Set<string>): EventDef[] {
  const kinds = SIGNAL_STOPS[signal];
  return eligibleEvents(content, run).filter((e) => !!e.stop && kinds.includes(e.stop) && !onMap.has(e.id));
}

/**
 * Adds one stop per signal to the new stage (mutates `run.stage.map`): an event of the signal's stop type, and for a
 * team that struggled also a heal stop halfway along. Returns the reason lines.
 */
export function tailorStage(content: Content, run: RunState, signals: StageSignal[]): string[] {
  const stage = run.stage;
  if (!stage || stage.kind !== 'stage' || signals.length === 0) return [];
  const map: StageMap = stage.map;
  const rng = new Rng(hashSeed(`${run.seed}::stage-plan::${stageKey(run)}`));
  // Early-to-middle levels, so the stop is reachable on any route before the gym.
  const candidates = map.nodes.filter((n) => n.column >= 2 && n.column < map.columns - 1);
  if (candidates.length === 0) return [];
  const onMap = new Set(map.nodes.flatMap((n) => n.sides.map((s) => s.eventId).filter((id): id is string => !!id)));
  const lines: string[] = [];
  for (const signal of signals) {
    const pool = stopPool(content, run, signal.id, onMap);
    let placed = false;
    if (pool.length > 0) {
      const e = rng.pick(pool);
      const node = rng.pick(candidates);
      onMap.add(e.id);
      node.sides.push({ id: `plan-${node.sides.length + 1}-${node.id}`, kind: 'event', used: false, eventId: e.id });
      placed = true;
    }
    if (signal.id === 'struggled') {
      const mid = Math.max(2, Math.floor(map.columns / 2));
      const column = map.nodes.filter((n) => n.column === mid);
      for (const node of column) if (!node.sides.some((s) => s.kind === 'heal')) node.sides.push({ id: `plan-heal-${node.id}`, kind: 'heal', used: false });
      placed = true;
    }
    if (placed) lines.push(`${signal.why}: ${SIGNAL_LINES[signal.id].stop} added.`);
  }
  return lines;
}

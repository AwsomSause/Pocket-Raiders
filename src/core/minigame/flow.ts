// Running a minigame from a map stop: start (limited attempts), act/tick, and one reward payout when it ends. The
// reward is applied the moment the game finishes and the finished outcome is stored, so a reload never pays twice.

import { addItem } from '../items';
import { hashSeed, Rng } from '../rng';
import { maxHp } from '../pokemon';
import { requireStage } from '../run';
import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { gameModule, type MinigameView } from './games';
import type { Medal, MinigameDef } from './schema';
import { SAFARI_ID, type SafariState } from '../greenneedle/safari';
import { pausedPark, safariBegin, safariFinish, safariStepBack, safariStepOut } from '../greenneedle/safariEnd';
import { SNAKE_ID, type SnakeState } from '../greenneedle/snake';
import { psyduckBegin, psyduckFinish } from '../greenneedle/snakeEnd';
import { ARCADE_ID, type ArcadeState } from '../greenneedle/arcade';
import { arcadeFinish, arcadeLeave } from '../greenneedle/arcadeEnd';

export function getMinigame(content: Content, id: string): MinigameDef {
  const g = content.minigames.games.find((m) => m.id === id);
  if (!g) throw new Error(`No minigame "${id}"`);
  return g;
}

export interface MinigamePreview {
  id: string; name: string; /** The game's kind (memory, skill, timing, resource, knowledge, puzzle). */ category: string; blurb: string; instructions: string; scoring: string; failure: string; replay: string;
  attemptsLeft: number; recommendedTier: number; /** Each tier: its money multiplier and whether a medal there can pay an item. */
  tiers: { label: string; index: number; money: number; items: boolean }[]; best: Medal; medals: string;
}

export function minigamePreview(content: Content, run: RunState, sideId: string, difficulty: 'easy' | 'normal' | 'hard' = 'normal'): MinigamePreview {
  const side = findStop(run, sideId);
  const def = getMinigame(content, side.minigameId!);
  const used = run.minigames.attempts[sideId] ?? 0;
  const m = def.medals;
  return {
    id: def.id, name: def.name, category: def.category, blurb: def.blurb, instructions: def.instructions, scoring: def.scoringRules, failure: def.failureOutcome, replay: def.replayRules,
    attemptsLeft: Math.max(0, def.attemptLimit - used), recommendedTier: Math.min(def.difficultyTiers.length - 1, { easy: 0, normal: 1, hard: 3 }[difficulty]), tiers: def.difficultyTiers.map((t, index) => ({ label: t.label, index, money: content.minigames.economy.tierMultipliers[index] ?? 1, items: index + 1 >= content.minigames.economy.itemMinTier })), best: run.minigames.best[def.id] ?? 'none',
    medals: `Bronze ${Math.round(m.bronze * 100)}% · Silver ${Math.round(m.silver * 100)}% · Gold ${Math.round(m.gold * 100)}%`,
  };
}

function findStop(run: RunState, sideId: string) {
  const stage = requireStage(run);
  if (stage.current === null) throw new Error('Choose a node first');
  const node = stage.map.nodes.find((n) => n.id === stage.current)!;
  const side = node.sides.find((s) => s.id === sideId && s.kind === 'minigame' && s.minigameId);
  if (!side) throw new Error(`No minigame stop "${sideId}" here`);
  return side;
}

/** Starts an attempt at difficulty tier (0 Easy to 2 Hard; 3 Master where the game has it). Walking away mid-game counts as an attempt and pays nothing. */
export function beginMinigame(content: Content, current: RunState, sideId: string, tier: number): RunState {
  if (current.phase !== 'map') throw new Error('Minigames start from the map');
  const side = findStop(current, sideId);
  const def = getMinigame(content, side.minigameId!);
  if (!Number.isInteger(tier) || tier < 0 || tier >= def.difficultyTiers.length) throw new Error('Unknown difficulty');
  const used = current.minigames.attempts[sideId] ?? 0;
  if (side.used || used >= def.attemptLimit) throw new Error('No attempts left at this stop');
  const run = structuredClone(current);
  run.minigames.attempts[sideId] = used + 1;
  if (used + 1 >= def.attemptLimit) findStop(run, sideId).used = true;
  const stage = requireStage(run);
  const rs = new Rng(hashSeed(`${run.seed}::minigame::${stage.index}:${sideId}:${used}:${tier}`)).state;
  run.minigame = { id: def.id, sideId, tier, state: gameModule(def.id).start(content, { ...def.difficultyTiers[tier]!.params, ...conditionParams(run) }, rs), outcome: null };
  if (def.id === SAFARI_ID) safariBegin(content, run, run.minigame.state as SafariState);
  if (def.id === SNAKE_ID) psyduckBegin(run, run.minigame.state as SnakeState);
  run.phase = 'minigame';
  return run;
}

/** The conditions of your lead Pokémon as game parameters c0..c4 (S487); every game ignores the ones it does not read. */
function conditionParams(run: RunState): Record<string, number> {
  const lead = run.party.find((m) => m.hp > 0) ?? run.party[0];
  const c = (lead && run.minigames.contest[lead.uid]) || [0, 0, 0, 0, 0];
  return Object.fromEntries(c.map((v, i) => [`c${i}`, v]));
}

/** Poffin (S489): the flavour that dominates a blended pot raises one condition of your lead (bronze 1, silver 2, gold 3). */
function poffinConditions(run: RunState, state: { names: string[]; have: number[] }, medal: Medal): string | null {
  const gain = RANK[medal];
  const lead = run.party.find((m) => m.hp > 0) ?? run.party[0];
  if (!lead || gain === 0) return null;
  let top = 0;
  state.have.forEach((v, i) => (v > state.have[top]! ? (top = i) : null));
  const cond = (run.minigames.contest[lead.uid] ??= [0, 0, 0, 0, 0]);
  cond[top] = Math.min(CONDITION_MAX, cond[top]! + gain);
  return `${CONDITIONS[top]} +${gain} (${state.names[top]} Poffin).`;
}

function session(run: RunState) {
  if (run.phase !== 'minigame' || !run.minigame) throw new Error('No minigame in progress');
  return run.minigame;
}

export function minigameView(content: Content, run: RunState): MinigameView {
  const s = session(run);
  return gameModule(s.id).view(content, s.state as never);
}

export function minigameAct(content: Content, current: RunState, cellId: string): RunState {
  const run = structuredClone(current);
  const s = session(run);
  if (s.outcome) return run;
  const mod = gameModule(s.id);
  mod.act(content, s.state as never, cellId);
  // gn.18: an event inside the park (Kanto's Stampede and Gold Teeth) plays on the map phase; the visit waits for it.
  if (s.id === SAFARI_ID && safariStepOut(content, run, s.state as SafariState)) return run;
  return settle(content, run);
}

/** gn.18: whether a Safari Land visit is waiting while an event inside the park plays (the run is on the map phase meanwhile). */
export const parkWaiting = (run: RunState): boolean => pausedPark(run) !== null;

/**
 * gn.18: after an event inside the park closes. `sideId` is the next room that event opened (play it next), or null once the visit
 * is back on (the minigame phase again). If the node no longer holds the park (the event led somewhere else), the visit ends there and pays out.
 */
export function continuePark(content: Content, current: RunState): { run: RunState; sideId: string | null } {
  if (!pausedPark(current)) return { run: current, sideId: null };
  const run = structuredClone(current);
  const m = run.minigame!;
  const node = requireStage(run).map.nodes.find((n) => n.id === run.stage!.current);
  if (!node?.sides.some((x) => x.id === m.sideId)) {
    const s = m.state as SafariState;
    s.away = null;
    s.done = true;
    run.phase = 'minigame';
    return { run: settle(content, run), sideId: null };
  }
  return { run, sideId: safariStepBack(run) };
}

/** gn.18: the stop of the event the waiting visit stepped out to (the screen opens it). */
export const parkEventSide = (run: RunState): string | null => pausedPark(run)?.away?.opened.at(-1) ?? null;

/** gn.18: the stop of the door taken at the far gate, once the visit has ended (the screen opens it after the outcome). */
export function parkDoorSide(run: RunState): string | null {
  const m = run.minigame;
  return m?.id === SAFARI_ID && m.outcome ? ((m.state as SafariState).doorSide ?? null) : null;
}

export function minigameTick(content: Content, current: RunState): RunState {
  const run = structuredClone(current);
  const s = session(run);
  const mod = gameModule(s.id);
  if (s.outcome || !mod.tick) return run;
  mod.tick(content, s.state as never);
  return settle(content, run);
}

function settle(content: Content, run: RunState): RunState {
  const s = session(run);
  const mod = gameModule(s.id);
  if (!(s.state as { done: boolean }).done || s.outcome) return run;
  const { score, max } = mod.result(s.state as never);
  s.outcome = payout(content, run, getMinigame(content, s.id), s.tier, score, max);
  if (s.id === SAFARI_ID) s.outcome.lines.push(...safariFinish(content, run, s.state as SafariState));
  if (s.id === SNAKE_ID) s.outcome.lines.push(...psyduckFinish(content, run, s.state as SnakeState));
  // gn.new.14: the cabinet pays no medal money; what it leaves behind is the story's (the Porygon, or the walk away).
  if (s.id === ARCADE_ID) s.outcome.lines = arcadeFinish(content, run, s.state as ArcadeState);
  if (s.id === 'berry-blending') {
    const line = poffinConditions(run, s.state as never, s.outcome.medal);
    if (line) s.outcome.lines.push(line);
  }
  return run;
}

export function medalFor(def: MinigameDef, score: number, max: number): Medal {
  const share = max > 0 ? score / max : 0;
  return share >= def.medals.gold ? 'gold' : share >= def.medals.silver ? 'silver' : share >= def.medals.bronze ? 'bronze' : 'none';
}

export const CONDITIONS = ['Cool', 'Beauty', 'Cute', 'Smart', 'Tough'] as const;
export const CONDITION_MAX = 30;
const RANK: Record<Medal, number> = { none: 0, bronze: 1, silver: 2, gold: 3 };

/** Pays the medal's reward once. Money is capped per stage, repeats of one game pay less, items need a harder tier and are capped. */
export function payout(content: Content, run: RunState, def: MinigameDef, tier: number, score: number, max: number) {
  const eco = content.minigames.economy;
  const stage = requireStage(run);
  const log = run.minigames;
  if (log.stage !== stage.index) Object.assign(log, { stage: stage.index, money: 0, items: 0, plays: {}, effects: 0 });
  const medal = medalFor(def, score, max);
  const lines = [`Score ${score} / ${max}: ${medal === 'none' ? 'no medal' : `${medal} medal`}.`];
  let money = 0;
  let item: string | null = null;
  const plays = log.plays[def.id] ?? 0;
  log.plays[def.id] = plays + 1;
  if (medal === 'none') lines.push(def.failureOutcome);
  else {
    const reward = def.rewardTable[medal];
    const cap = eco.stageMoneyCap * (run.regionIndex + 1);
    const want = Math.round(reward.money * eco.tierMultipliers[tier]! * Math.pow(eco.diminishing, plays));
    money = Math.max(0, Math.min(want, cap - log.money));
    if (money < want) lines.push('This stage will not pay any more money.');
    if (plays > 0) lines.push('Repeats pay less.');
    if (reward.item && tier + 1 >= eco.itemMinTier && log.items < eco.itemCapPerStage) {
      const roll = new Rng(hashSeed(`${run.seed}::minigame-reward::${stage.index}:${def.id}:${plays}`));
      if (roll.chance(reward.item.chance)) item = reward.item.item;
    }
    if (reward.effect && tier + 1 >= eco.itemMinTier && log.effects < eco.effectCapPerStage) {
      const roll = new Rng(hashSeed(`${run.seed}::minigame-effect::${stage.index}:${def.id}:${plays}`));
      if (roll.chance(reward.effect.chance)) lines.push(applyEffect(content, run, reward.effect.kind, reward.effect.amount));
    }
    const fr = eco.frontier;
    if (fr.games.includes(def.id)) {
      const pts = fr.points[medal] * (tier + 1);
      log.frontierPoints = (log.frontierPoints ?? 0) + pts;
      if (pts > 0) lines.push(`+${pts} Frontier Points.`);
    }
    run.money += money;
    log.money += money;
    if (item) {
      addItem(run.inventory, item, 1);
      log.items += 1;
    }
    lines.push(`+₽${money}${item ? `, ${item.replace(/-/g, ' ')}` : ''}.`);
  }
  if (RANK[medal] > RANK[log.best[def.id] ?? 'none']) log.best[def.id] = medal;
  return { score, max, medal, money, item, lines };
}

/** One bonus from a medal; returns the line shown to the player. */
function applyEffect(content: Content, run: RunState, kind: 'heal' | 'research' | 'discount', amount: number): string {
  run.minigames.effects += 1;
  if (kind === 'research') {
    run.totems.research += amount;
    return `+${amount} research.`;
  }
  if (kind === 'discount') {
    const stageIndex = requireStage(run).index;
    const old = run.minigames.discount;
    run.minigames.discount = { percent: old && old.stage === stageIndex ? Math.max(old.percent, amount) : amount, stage: stageIndex };
    return `Shops are ${amount}% cheaper for the rest of this stage.`;
  }
  for (const m of run.party) if (m.hp > 0) m.hp = Math.min(maxHp(content, m), m.hp + Math.ceil((maxHp(content, m) * amount) / 100));
  return `The party recovers ${amount}% of its health.`;
}

/** Back to the map. Leaving before the end forfeits the attempt (it was already counted) and pays nothing. */
export function leaveMinigame(current: RunState): RunState {
  const run = structuredClone(current);
  const s = session(run);
  if (s.id === ARCADE_ID && !s.outcome) arcadeLeave(run, s.state as ArcadeState);
  run.minigame = null;
  run.phase = 'map';
  return run;
}

/** Spends Frontier Points on a prize from the Frontier shop (S490). Throws when you cannot afford it. */
export function buyFrontierPrize(content: Content, current: RunState, prizeId: string): RunState {
  const run = structuredClone(current);
  const prize = content.minigames.economy.frontier.prizes.find((p) => p.id === prizeId);
  if (!prize) throw new Error(`No Frontier prize "${prizeId}"`);
  if (run.minigames.frontierPoints < prize.cost) throw new Error('Not enough Frontier Points');
  run.minigames.frontierPoints -= prize.cost;
  addItem(run.inventory, prize.item, prize.count);
  return run;
}

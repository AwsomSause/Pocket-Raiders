// Beta 0.7 U1 Ultra Beast Incursions: the in-run state machine (plan: docs/plans/instrumentality/notes-pack/ULTRA_BEAST_INCURSIONS.md).
//
//   Appetites (hidden tallies) -> Static (one stage) -> Tear (a map stop, its Ultra Rule leaks into the stage)
//   -> Crossing (the Tear's event, optional) or Incursion (Tear left alone: the Beast takes a wild fight).
//   A caught Beast brings its rule everywhere and gets Homesick; at 10 it leaves.
//
// In-run only (Kice, 2026-11-14): no Faller rank, Faller's Log or Souvenirs. No random stream is touched: the Beast is
// the Appetite that was fed most, ties go to the plan's order, and the one item Devour eats comes from a hash of the
// seed and the battle count, so old seeds play exactly as before when the setting is off (`run.expansion.ultra` absent).
import { z } from 'zod';
import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import type { BattleEvent } from '../battle/engine';
import { maxHp } from '../pokemon';
import { addItem } from '../items';
import { Rng, hashSeed } from '../rng';
import { freshWorldSim } from '../worldSim/schema';
import { BEAST_BY_ID, BEAST_BY_SPECIES, INVADERS, UltraRuleIdSchema, type Appetite, type UltraBeast, type UltraRuleId } from './beasts';
import { DEVOUR_HEAL } from './rules';
import { CurSchema, UltraRunStateSchema } from './schema';
export { UltraRunStateSchema };

export type UltraRunState = z.infer<typeof UltraRunStateSchema>;
export const freshUltra = (): UltraRunState => UltraRunStateSchema.parse({});

/** Stage 3 is the earliest Static. */
export const EARLIEST_STATIC_STAGE = 3;
export const SHARDS_PER_BALL = 3;
export const SHARD_FLAG = 'ev:ultra-shard';
export const CROSSED_FLAG = 'ev:ultra-crossed';
export const HOMESICK_LEAVES_AT = 10;

export const ultraOf = (run: RunState): UltraRunState | undefined => run.expansion?.ultra;
export const ultraOn = (run: RunState): boolean => !!run.expansion?.ultra;

/** Run start: the system is on for this run only if the setting was on. */
export function startUltra(run: RunState): void {
  run.expansion = { ...run.expansion, ultra: freshUltra() };
}

const bump = (u: UltraRunState, a: Appetite, n = 1): void => { u.appetites[a] = (u.appetites[a] ?? 0) + n; };

/** The party Pokémon that is an Ultra Beast taken home (never Necrozma), or undefined. */
export function heldBeast(run: RunState): { mon: RunState['party'][number]; beast: UltraBeast } | undefined {
  for (const mon of run.party) {
    const beast = BEAST_BY_SPECIES.get(mon.speciesId);
    if (beast) return { mon, beast };
  }
  return undefined;
}

/** Ultra Rules in force for a battle fought now: the open Tear's (this stage) and the held Beast's. */
export function activeRules(run: RunState): UltraRuleId[] {
  const u = ultraOf(run);
  if (!u) return [];
  const rules: UltraRuleId[] = [];
  if ((u.contact === 'tear' || u.contact === 'incursion') && u.beastId) rules.push(BEAST_BY_ID.get(u.beastId)!.ultraRule);
  const held = heldBeast(run);
  if (held && held.beast.ultraRule !== 'cling') rules.push(held.beast.ultraRule);
  return [...new Set(rules)];
}

/** Called when a battle begins: stamps the rules on it and resets the per-battle facts. */
export function markBattle(run: RunState): void {
  const u = ultraOf(run);
  if (!u || !run.battle) return;
  const rules = activeRules(run);
  // An empty list still marks the battle as one fought with the system on (ordinary balls then work at a tenth on an Ultra Beast).
  run.battle.ultra = rules;
  u.cur = CurSchema.parse({});
}

/** Counts what one action did (called with each action's events). */
export function tallyEvents(run: RunState, events: readonly BattleEvent[]): void {
  const u = ultraOf(run);
  if (!u || !run.battle) return;
  const uid = run.party[run.battle.activeIndex]?.uid;
  for (const e of events) {
    if (e.type === 'damage') {
      if (e.side === 'enemy') {
        if (uid) u.cur.dmg[uid] = (u.cur.dmg[uid] ?? 0) + e.amount;
        u.cur.hitsOnFoe += 1;
        if (e.crit) { u.cur.crits += 1; bump(u, 'precision'); }
        if (e.hpAfter <= 0 && u.cur.hitsOnFoe === 1) { u.cur.oneHitKos += 1; bump(u, 'strength'); }
      } else u.cur.taken += e.amount;
    } else if (e.type === 'faint') {
      if (e.side === 'enemy') u.cur.hitsOnFoe = 0;
      else { u.cur.faints += 1; bump(u, 'longing'); }
    } else if (e.type === 'switchIn' && e.side === 'enemy') u.cur.hitsOnFoe = 0;
    else if (e.type === 'stat' && e.side === 'player' && e.change > 0) { u.cur.boosts += 1; bump(u, 'charge'); }
    else if (e.type === 'item') { u.cur.items += 1; bump(u, 'consumption'); }
    else if (e.type === 'ohko' && e.side === 'player') { u.cur.spectacle += 1; bump(u, 'spectacle'); }
    else if (e.type === 'selfKo' && e.side === 'player') { u.cur.spectacle += 1; bump(u, 'spectacle'); }
  }
}

/** A battle ended: the per-battle Appetites, the stage facts, and Devour. Returns lines to show (usually none). */
export function settleBattle(content: Content, run: RunState, won: boolean): string[] {
  const u = ultraOf(run);
  const battle = run.battle;
  if (!u || !battle) return [];
  const lines: string[] = [];
  if (won) {
    const total = Object.values(u.cur.dmg).reduce((a, b) => a + b, 0);
    const top = Math.max(0, ...Object.values(u.cur.dmg));
    if (run.party.length >= 2 && total > 0 && top / total > 0.7) bump(u, 'dependence');
    if (u.cur.taken === 0) { bump(u, 'flawlessness'); u.stage.flawless += 1; }
    if (battle.turn - 1 >= 12) bump(u, 'patience');
    if (battle.participants.length >= 6) bump(u, 'formation');
    if (u.cur.oneHitKos > 0 && battle.enemyTeam.length === 1) u.stage.oneHit += 1;
    if (u.cur.spectacle > 0) u.stage.spectacle += 1;
    if (battle.kind === 'trainer' && (battle.trainer?.leaderId || battle.rivalId)) u.stage.bossWins += 1;
    if (battle.ultra?.includes('devour')) lines.push(...devour(content, run));
  }
  return lines;
}

/** Devour: the winner's bag loses one item (eaten) and the party recovers 20% HP. */
function devour(content: Content, run: RunState): string[] {
  const rng = new Rng(hashSeed(`${run.seed}::ultra-devour::${run.encountersCompleted}`));
  const ids = Object.keys(run.inventory).filter((id) => (run.inventory[id] ?? 0) > 0).sort();
  const eaten = ids.length ? rng.pick(ids) : null;
  if (eaten) {
    addItem(run.inventory, eaten, -1);
    if ((run.inventory[eaten] ?? 0) <= 0) delete run.inventory[eaten];
  }
  for (const mon of run.party) if (mon.hp > 0) mon.hp = Math.min(maxHp(content, mon), mon.hp + Math.ceil(maxHp(content, mon) * DEVOUR_HEAL));
  return [eaten ? `Devour: ${content.items.get(eaten)?.name ?? eaten} was eaten, and the party feels full.` : 'Devour: nothing left in the bag to eat, and the party feels full.'];
}

/** The Appetite fed most, if it is over its threshold: the Beast that comes. Ties go to the plan's order. */
export function beastToCall(u: UltraRunState): UltraBeast | null {
  let best: UltraBeast | null = null;
  let bestRatio = 0;
  for (const b of INVADERS) {
    if (u.met.includes(b.id)) continue;
    const n = u.appetites[b.appetite!] ?? 0;
    if (n < b.threshold) continue;
    const ratio = n / b.threshold;
    if (ratio > bestRatio) { best = b; bestRatio = ratio; }
  }
  return best;
}

const addRumor = (run: RunState, id: string, text: string): void => {
  run.story.sim ??= freshWorldSim();
  const rumors = run.story.sim.rumors;
  while (rumors.length >= 12) rumors.shift();
  rumors.push({ id, text, shown: false });
};

/** The Beast's Tear event id (src/data/events/ultraBeasts.json). */
export const tearEventId = (b: UltraBeast): string => `ultra-tear-${b.id}`;

/**
 * A new stage has started (`stageNo` is 1-based for the whole run). Moves contact one step, places the Tear, forges Beast
 * Balls from Shards and makes a held Beast one step more homesick. Pure writes on the run; no random numbers.
 */
export function stageTick(content: Content, run: RunState, stageNo: number, league: boolean): void {
  const u = ultraOf(run);
  if (!u) return;
  const flags = run.story.flags;
  const shards = Number(flags[SHARD_FLAG] ?? 0);
  if (shards >= SHARDS_PER_BALL) {
    const balls = Math.floor(shards / SHARDS_PER_BALL);
    addItem(run.inventory, 'beast-ball', balls);
    flags[SHARD_FLAG] = shards - balls * SHARDS_PER_BALL;
  }
  homesickTick(run, u);
  if (league && u.contact !== 'none') { endContact(u); return; }
  u.stage = { bossWins: 0, flawless: 0, oneHit: 0, spectacle: 0 };
  if (run.party.length <= 2) bump(u, 'longing');

  // Static -> Tear
  if (u.contact === 'static' && u.beastId && !league) {
    u.contact = 'tear';
    u.stageNo = stageNo;
    placeTear(run, u, BEAST_BY_ID.get(u.beastId)!);
    return;
  }
  // Tear -> Incursion (left alone for a whole stage) or closed (entered the Crossing)
  if (u.contact === 'tear') {
    const entered = Number(flags[CROSSED_FLAG] ?? 0) > 0;
    u.tearStop = null;
    if (entered) { endContact(u); return; }
    u.contact = 'incursion';
    u.incursionDone = false;
    u.stageNo = stageNo;
    return;
  }
  // Incursion over (fought, or the Beast went home)
  if (u.contact === 'incursion') { endContact(u); return; }
  // Nothing open: maybe a new Static.
  if (u.contact === 'none' && !league && stageNo >= EARLIEST_STATIC_STAGE && u.met.length === 0 && !heldBeast(run)) {
    const beast = beastToCall(u);
    if (beast) {
      u.contact = 'static';
      u.beastId = beast.id;
      u.stageNo = stageNo;
      addRumor(run, `ultra-static-${beast.id}`, 'The sky is the wrong colour tonight, and the wild ones all face the same way.');
      if (!u.parcel) {
        u.parcel = true;
        addItem(run.inventory, 'beast-ball', 1);
        addRumor(run, 'ultra-parcel', 'A parcel from Looker and Anabel: one Beast Ball, and a note that says "keep it for something from somewhere else".');
      }
    }
  }
}

function endContact(u: UltraRunState): void {
  if (u.beastId && !u.met.includes(u.beastId)) u.met.push(u.beastId);
  u.contact = 'none';
  u.beastId = null;
  u.tearStop = null;
  u.incursionDone = false;
}

function placeTear(run: RunState, u: UltraRunState, beast: UltraBeast): void {
  const map = run.stage?.map;
  if (!map) return;
  const mid = Math.max(1, Math.ceil(map.columns / 2));
  const node = map.nodes.find((n) => n.column === mid && n.kind !== 'gym' && n.kind !== 'elite' && n.kind !== 'champion') ?? map.nodes[0]!;
  const id = `tear-${beast.id}`;
  node.sides.push({ id, kind: 'event', eventId: tearEventId(beast), used: false });
  u.tearStop = id;
}

function homesickTick(run: RunState, u: UltraRunState): void {
  const held = heldBeast(run);
  if (!held) { u.homesick = null; return; }
  if (u.homesick?.uid !== held.mon.uid) u.homesick = { uid: held.mon.uid, value: 0 };
  const b = held.beast;
  let falls = 0;
  for (const f of b.homesickFalls) {
    if (f === 'holdsItem' && Object.keys(held.mon.held ?? {}).length > 0) falls += 1;
    if (f === 'bossWin') falls += Math.min(1, u.stage.bossWins);
    if (f === 'noDamage') falls += Math.min(1, u.stage.flawless);
    if (f === 'oneHit') falls += Math.min(1, u.stage.oneHit);
    if (f === 'perform') falls += Math.min(1, u.stage.spectacle);
    if (f === 'full' && run.party.length >= 6 && run.party.every((m) => m.hp > 0)) falls += 1;
  }
  const value = Math.max(0, Math.min(HOMESICK_LEAVES_AT, u.homesick.value + 1 - falls));
  u.homesick.value = value;
  if (value >= HOMESICK_LEAVES_AT) {
    run.party = run.party.filter((m) => m.uid !== held.mon.uid);
    run.box = (run.box ?? []).filter((m) => m.uid !== held.mon.uid);
    u.left.push(b.id);
    u.homesick = null;
    addRumor(run, `ultra-left-${b.id}`, `${b.name} tore a hole in the sky and went home, and took its rule with it.`);
  }
}

/** Incursion: the Beast the first wild battle of this stage turns into, or null. */
export function incursionBeast(run: RunState): UltraBeast | null {
  const u = ultraOf(run);
  return u && u.contact === 'incursion' && !u.incursionDone && u.beastId ? BEAST_BY_ID.get(u.beastId)! : null;
}
export function markIncursionFought(run: RunState): void {
  const u = ultraOf(run);
  if (u) u.incursionDone = true;
}

export { UltraRuleIdSchema };

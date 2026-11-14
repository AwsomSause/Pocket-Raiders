// Beta 0.6 workstream 18, Saffron City: the party stash (one Pokémon fights alone), Sabrina's Labyrinth ghost and its next-region return,
// the Fighting Tournament title, and the mid-fight evolution rule. Pure rules, no Phaser. Nothing here rolls the run's own streams:
// the ghost is picked with the event's roll, everything else is fixed by the state. State lives at run.expansion.canon (no save bump).

import type { BattleEvent } from '../battle/engine';
import { blocksEvolution } from '../battle/held';
import type { Content, EventEffect } from '../contentSchema';
import { evolve, evolveFully } from '../evolution';
import { discover } from '../progress';
import { maxHp, movesAtLevel, xpForLevel } from '../pokemon';
import { getSpecies } from '../pokemon';
import { Rng } from '../rng';
import { getCampaign } from '../regions';
import { newMon } from '../run';
import type { PokemonInstance, RunState } from '../state';
import { currentEnemy } from '../state';
import type { CanonState } from './canonSpaces';

type CanonEffect = Extract<EventEffect, { kind: 'canon' }>;

/** The four ghosts Sabrina's Labyrinth can send, each as its first stage, with its final form and the Mega Stone it holds on its return. */
export const LABYRINTH_GHOSTS = [
  { base: 'shuppet', final: 'banette', stone: 'banettite' },
  { base: 'duskull', final: 'dusknoir', stone: null },
  { base: 'drifloon', final: 'drifblim', stone: null },
  { base: 'gastly', final: 'gengar', stone: 'gengarite' },
] as const;
/** The ghost's level after each node (node 0 = the start): L10 up to L40, so every line reaches its forms in time. */
export const LABYRINTH_LEVELS = [10, 15, 20, 25, 30, 37, 40] as const;
/** Never picked by the heat-of-battle evolution (Annihilape needs its own Rage Fist road). */
const NEVER_MID: readonly string[] = ['annihilape'];
export const HAUNTING_MOVE = 'haunting';

const emptyCanon = (): CanonState => ({ flags: [], completed: [], menus: {} });
const canonOf = (run: RunState): CanonState => run.expansion?.canon ?? emptyCanon();
const setCanon = (run: RunState, canon: CanonState): void => {
  run.expansion = { ...run.expansion, canon };
};
const nameOf = (content: Content, mon: Pick<PokemonInstance, 'speciesId'>): string => content.species.get(mon.speciesId)?.name ?? mon.speciesId;

/** True while the party waits in the stash (a Tournament bout or the Labyrinth). */
export const isStashed = (run: RunState): boolean => Boolean(canonOf(run).solo);

/** Moves every party member but one into the stash. `keep` is the uid that stays; `ghost` is true for the Labyrinth. */
function stash(run: RunState, keep: PokemonInstance, mode: 'tournament' | 'labyrinth'): void {
  const canon = canonOf(run);
  const order = run.party.map((m) => m.uid);
  const rest = run.party.filter((m) => m.uid !== keep.uid);
  setCanon(run, { ...canon, stash: rest, solo: { keep: keep.uid, order, mode } });
  run.party = [keep];
}

/** Puts the party back as it was (the kept Pokémon where it stood); anything gained meanwhile follows. Returns whether anything was stashed. */
export function restoreStash(run: RunState): boolean {
  const canon = canonOf(run);
  if (!canon.solo) return false;
  const all = [...run.party, ...((canon.stash ?? []) as PokemonInstance[])];
  const ghostUid = canon.lab?.active ? canon.lab.ghostUid : undefined;
  const kept = canon.solo.order.map((uid) => all.find((m) => m.uid === uid)).filter((m): m is PokemonInstance => Boolean(m));
  const extras = run.party.filter((m) => !canon.solo!.order.includes(m.uid) && m.uid !== ghostUid);
  run.party = [...kept, ...extras].slice(0, 6);
  for (const m of [...kept, ...extras].slice(6)) run.box.push(m);
  const { solo: _solo, stash: _stash, ...rest } = canon;
  setCanon(run, { ...rest, lab: canon.lab ? { ...canon.lab, active: false } : undefined });
  return true;
}

/** Walking away from a stash: the party comes back and, in the Labyrinth, the lanterns fade with no reward. Called when the run leaves the node. */
export function leaveCanonStash(run: RunState): void {
  if (!isStashed(run)) return;
  const canon = canonOf(run);
  restoreStash(run);
  if (canon.lab?.active) {
    const { lab: _lab, ...rest } = canonOf(run);
    setCanon(run, { ...rest, lab: undefined });
  }
}

function pickKeeper(run: RunState, species: readonly string[]): PokemonInstance | undefined {
  const pool = run.party.filter((m) => species.includes(m.speciesId));
  return [...pool].sort((a, b) => Number(b.hp > 0) - Number(a.hp > 0) || b.level - a.level)[0];
}

const ghostLine = (base: string) => LABYRINTH_GHOSTS.find((g) => g.base === base || g.final === base)!;

/** Sets a Pokémon's level, relearns the moves of that level and evolves it by level (Haunter and Dusclops wait for the fight). */
function setGhostLevel(content: Content, mon: PokemonInstance, level: number): void {
  mon.level = level;
  mon.xp = xpForLevel(getSpecies(content, mon.speciesId).growthRate, level, content.balance.difficulty.highLevelXp);
  evolveFully(content, mon);
  const ids = movesAtLevel(content, getSpecies(content, mon.speciesId), level).filter((id) => content.moves.has(id));
  if (ids.length > 0) mon.moves = ids.slice(-4).map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  mon.hp = maxHp(content, mon);
  mon.status = null;
}

/** The effects of the `canon` kind. `rng` is the event's own roll (the ghost is picked with it). Returns the words for the outcome. */
export function applyCanonEffect(content: Content, run: RunState, e: CanonEffect, rng: Rng): string {
  const canon = canonOf(run);
  switch (e.action) {
    case 'solo': {
      if (isStashed(run)) return '';
      const keeper = pickKeeper(run, e.species);
      if (!keeper || run.party.length < 1) return '';
      stash(run, keeper, 'tournament');
      return run.expansion?.canon?.stash?.length ? `${nameOf(content, keeper)} steps into the ring alone.` : '';
    }
    case 'unsolo':
      return restoreStash(run) ? 'Your team gathers around again.' : '';
    case 'champion': {
      const mon = run.party.find((m) => e.species.includes(m.speciesId)) ?? run.party.find((m) => m.hp > 0);
      if (!mon) return '';
      mon.fixedAbility = 'champions-fury';
      mon.champion = true;
      if (mon.speciesId === 'primeape') mon.look = 'champion';
      mon.evoBlock = [...new Set([...(mon.evoBlock ?? []), 'annihilape'])];
      const move = 'dynamic-punch';
      if (content.moves.has(move) && !mon.moves.some((m) => m.id === move)) {
        const slot = { id: move, pp: content.moves.get(move)!.pp };
        if (mon.moves.length < 4) mon.moves.push(slot);
        else mon.moves[3] = slot;
      }
      return `${nameOf(content, mon)} is crowned champion: Champion's Fury, Dynamic Punch and the belt are its own.`;
    }
    case 'ghostStart': {
      if (isStashed(run) || run.party.length < 1) return '';
      const pick = LABYRINTH_GHOSTS[rng.int(0, LABYRINTH_GHOSTS.length - 1)]!;
      const ghost = newMon(content, run, pick.base, LABYRINTH_LEVELS[0], 'p');
      ghost.friendship = 255;
      ghost.hp = maxHp(content, ghost);
      const order = run.party.map((m) => m.uid);
      setCanon(run, {
        ...canon,
        stash: run.party,
        solo: { keep: ghost.uid, order, mode: 'labyrinth' },
        lab: { ghost: pick.base, ghostUid: ghost.uid, regionIndex: run.regionIndex, stageIndex: run.stage?.index ?? 0, freed: [], active: true, done: false, owed: false, returned: false },
      });
      run.party = [ghost];
      discover(run, ghost.speciesId, true);
      return `${nameOf(content, ghost)} offers to help you get your body back.`;
    }
    case 'ghostLevel': {
      const lab = canon.lab;
      const ghost = lab && run.party.find((m) => m.uid === lab.ghostUid);
      if (!lab || !ghost) return '';
      const before = ghost.speciesId;
      setGhostLevel(content, ghost, Math.max(ghost.level, e.level ?? ghost.level));
      return before !== ghost.speciesId ? `${nameOf(content, { speciesId: before })} evolves into ${nameOf(content, ghost)}!` : '';
    }
    case 'ghostFree': {
      const lab = canon.lab;
      if (!lab?.active) return '';
      const waiting = ((canon.stash ?? []) as PokemonInstance[]).find((m) => !lab.freed.includes(m.uid));
      if (!waiting) return 'The lantern is empty. Nobody is left to free here.';
      setCanon(run, { ...canon, lab: { ...lab, freed: [...lab.freed, waiting.uid] } });
      return `${nameOf(content, waiting)} is freed from its lantern and follows as a spirit.`;
    }
    case 'ghostEnd': {
      const lab = canon.lab;
      if (!lab?.active) return '';
      restoreStash(run);
      const now = canonOf(run);
      setCanon(run, { ...now, lab: { ...lab, active: false, done: true, owed: true, regionIndex: lab.regionIndex, stageIndex: lab.stageIndex } });
      for (const m of run.party) {
        m.hp = Math.max(m.hp, 1);
        m.status = null;
      }
      return 'The ghost bids you farewell and fades. Your body, and all your Pokémon, are yours again.';
    }
    case 'flawless': {
      // Mankey's Wrath: a gauntlet won with nobody fainted pays a Black Belt (it goes to the Pokémon waiting to join, else the lead).
      if (!run.party.every((m) => m.hp > 0)) return '';
      const belt = 'black-belt';
      const holder = run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))[0] ?? run.party[0];
      if (!holder || !content.catalog.has(belt)) return '';
      holder.held = { ...holder.held, [belt]: (holder.held?.[belt] ?? 0) + 1 };
      return `Flawless! ${nameOf(content, holder)} is handed a Black Belt.`;
    }
    case 'ghostReturn':
      return '';
  }
}

/** The ghost's last Pokémon at `level`, holding its Mega Stone if it has one, knowing Haunting. Offered through the usual caught decision. */
export function ghostReturns(content: Content, run: RunState, level: number): string {
  const canon = canonOf(run);
  const lab = canon.lab;
  if (!lab || !lab.owed || lab.returned) return '';
  const line = ghostLine(lab.ghost);
  const mon = newMon(content, run, line.final, Math.max(1, level), 'p');
  mon.friendship = 220;
  mon.hp = maxHp(content, mon);
  if (line.stone) mon.held = { ...mon.held, [line.stone]: 1 };
  const haunting = { id: HAUNTING_MOVE, pp: content.moves.get(HAUNTING_MOVE)?.pp ?? 5 };
  if (content.moves.has(HAUNTING_MOVE) && !mon.moves.some((m) => m.id === HAUNTING_MOVE)) {
    if (mon.moves.length < 4) mon.moves.push(haunting);
    else mon.moves[3] = haunting;
  }
  discover(run, mon.speciesId, true);
  run.pending.push({ kind: 'caught', mon });
  setCanon(run, { ...canon, lab: { ...lab, owed: false, returned: true } });
  return `${nameOf(content, mon)} asks to join your team.`;
}

/** The event that carries the ghost's return, by ghost. */
export const ghostReturnEventId = (base: string): string => `cs-kanto-saffron-return-${base}`;

/**
 * At a stage start: does the ghost return here? It does at the parallel stage (the same stage number) of the next region, or at the closest stage
 * when that region is shorter, and in the last region's League when there is no next region. Returns the event id to offer, or null.
 */
export function ghostReturnEvent(content: Content, run: RunState): string | null {
  const lab = run.expansion?.canon?.lab;
  if (!lab?.owed || lab.returned || !run.stage) return null;
  const last = run.regionOrder.length - 1;
  const stage = run.stage;
  if (lab.regionIndex >= last) return stage.kind === 'league' && run.regionIndex === last ? ghostReturnEventFor(content, lab.ghost) : null;
  if (run.regionIndex !== lab.regionIndex + 1 || stage.kind !== 'stage') return null;
  const target = Math.min(lab.stageIndex, getCampaign(content, run.campaignId).stagesPerRegion - 1);
  return stage.index === target ? ghostReturnEventFor(content, lab.ghost) : null;
}

const ghostReturnEventFor = (content: Content, base: string): string | null => (content.events.has(ghostReturnEventId(base)) ? ghostReturnEventId(base) : null);

// ---------- mid-fight evolution ----------

/** The one species a Pokémon would evolve into next in the heat of a fight (never a blocked one), or null. */
export function nextStage(content: Content, mon: PokemonInstance): string | null {
  if (blocksEvolution(content, mon)) return null;
  return getSpecies(content, mon.speciesId).evolutions.find((v) => content.species.has(v.to) && !NEVER_MID.includes(v.to) && !(mon.evoBlock ?? []).includes(v.to))?.to ?? null;
}

/**
 * Called when a turn's events are final and the battle isn't over: with the `evolveMid` rule each active Pokémon that has a next stage evolves once
 * (turn 3 or later, or at half HP or less). The evolution keeps level, moves and damage taken, as `evolve` does everywhere.
 */
export function ruleEvolution(content: Content, run: RunState): BattleEvent[] {
  const battle = run.battle;
  if (!battle?.eventRule?.evolveMid || battle.outcome) return [];
  const out: BattleEvent[] = [];
  const sides: ['player' | 'enemy', PokemonInstance | undefined][] = [['player', run.party[battle.activeIndex]], ['enemy', currentEnemy(battle)]];
  for (const [side, mon] of sides) {
    if (!mon || mon.hp <= 0 || battle.storyEffects.includes(`evo@${mon.uid}`)) continue;
    const inTheMoment = battle.turn >= 3 || mon.hp / Math.max(1, maxHp(content, mon)) <= 0.5;
    const to = inTheMoment ? nextStage(content, mon) : null;
    if (!to) continue;
    battle.storyEffects.push(`evo@${mon.uid}`);
    const result = evolve(content, mon, to);
    if (side === 'player') discover(run, to, true);
    out.push({ type: 'evolved', side, uid: mon.uid, from: result.from, to, hpAfter: mon.hp });
  }
  return out;
}

/** The entry of `candidates` whose base stat total is nearest to the lead's (Fighting Tournament). Ties go to the first. */
export function nearestBst(content: Content, candidates: readonly string[], lead: PokemonInstance): string {
  const total = (id: string): number => Object.values(getSpecies(content, id).baseStats).reduce((a, b) => a + b, 0);
  const goal = total(lead.speciesId);
  return [...candidates].filter((id) => content.species.has(id)).sort((a, b) => Math.abs(total(a) - goal) - Math.abs(total(b) - goal))[0] ?? candidates[0]!;
}

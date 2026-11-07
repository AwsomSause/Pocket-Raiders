// A simple deterministic player for tests: it always makes the same choice in
// the same situation, so the same seed always plays the same run.

import { doublesSwitchProblem } from '../../src/core/battle/doubles';
import type { Content } from '../../src/core/contentSchema';
import { typeEffectiveness } from '../../src/core/battle/damage';
import { forcedMoveIndex, itemProblem } from '../../src/core/battle/engine';
import { nuzlockeCatchProblem } from '../../src/core/nuzlocke';
import type { RulesChoice } from '../../src/core/rules';
import { evolvedFormAt } from '../../src/core/encounters';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { buyItem, chooseReward, chooseStarter, createRun, debugHealParty, leaveShop, partyCapacity, resolveDecision, takeTurn, type TurnResult } from '../../src/core/run';
import { currentEnemy, type PokemonInstance, type RunState } from '../../src/core/state';
import { content as defaultContent, toBattle } from './helpers';

export interface AutoplayOptions {
  seed: string;
  archetypeId?: string;
  campaignId?: string;
  attributes?: Record<string, number>;
  /** Mode, difficulty and modifiers (default: the standard rules). */
  rules?: RulesChoice;
  /** Fully heals the party whenever it is on the map, so runs last longer. */
  healOnMap?: boolean;
  /** Raises the starter to this level right after it is chosen, so runs get further. */
  starterLevel?: number;
  /** Stop after this many actions. */
  steps: number;
  /** A smarter player: best-scoring move by type and STAB, potions when low, switching away from a bad matchup, and shopping for potions. */
  smart?: boolean;
  /** S20: a stronger player on top of `smart`: best switch-in, earlier switching and potions, candies to the weakest Pokémon, stat boosters and healing before junk, and revives from the shop. */
  strong?: boolean;
  /** S20: on the map, raises every party member to (the highest foe level seen so far + this). Measures fights at par level, not the bot's levelling. */
  parLevel?: number;
  /** Called after every action with the new run (and the turn result for battle turns). */
  onStep?: (run: RunState, turn: TurnResult | null) => RunState | void;
  content?: Content;
}

/** Picks the next action for `run` and plays it. */
export function step(content: Content, run: RunState, smart = false, strong = false): { run: RunState; turn: TurnResult | null } {
  switch (run.phase) {
    case 'expedition':
      throw new Error('Autoplay does not enter expeditions');
    case 'minigame':
      throw new Error('Autoplay does not enter minigames');
    case 'starter':
      return { run: chooseStarter(content, run, 0), turn: null };
    case 'map':
      return { run: toBattle(run, content), turn: null };
    case 'shop': {
      if (!smart) return { run: leaveShop(content, run), turn: null };
      let next = run;
      // Potions first, then balls: about half the money on healing.
      for (const id of strong ? ['hyper-potion', 'super-potion', 'potion', 'revive', 'poke-ball'] : ['hyper-potion', 'super-potion', 'potion', 'poke-ball']) {
        for (let n = 0; n < 6; n++) {
          const have = (next.inventory[id] ?? 0) + n;
          if (id !== 'poke-ball' && have >= (id === 'revive' ? 4 : 8)) break;
          try {
            next = buyItem(content, next, id).run;
          } catch {
            break;
          }
        }
      }
      return { run: leaveShop(content, next), turn: null };
    }
    case 'battle': {
      const battle = run.battle!;
      if (battle.needsSwitch) {
        // Any healthy Pokémon not already in battle (a double battle has two out).
        const view = { battle: run.battle!, party: run.party };
        const foe = currentEnemy(battle);
        const rank = (p: PokemonInstance): number => (strong ? bestScore(content, p, foe) * (p.hp / maxHp(content, p)) + p.level : 0);
        const ok = (i: number): boolean => (run.battle!.doubles ? doublesSwitchProblem(view, i) === null : run.party[i]!.hp > 0);
        let pick = -1;
        run.party.forEach((p, i) => { if (ok(i) && (pick < 0 || rank(p) > rank(run.party[pick]!))) pick = i; });
        const turn = takeTurn(content, run, { kind: 'switch', partyIndex: pick });
        return { run: turn.run, turn };
      }
      const enemy = currentEnemy(battle);
      // A Pokémon in the middle of a two-turn move, or locked by a Choice item, can't throw a ball.
      const midMove = forcedMoveIndex(battle, run.party) !== null;
      const ownShare = run.party[battle.activeIndex]!.hp / maxHp(content, run.party[battle.activeIndex]!);
      // The smart player stops throwing balls once its own Pokémon is in trouble (it used to faint to a level 2 wild while throwing).
      if (!midMove && !(smart && ownShare < 0.4) && battle.kind === 'wild' && run.party.length < partyCapacity(content, run) && (run.inventory['poke-ball'] ?? 0) > 0 && enemy.hp <= maxHp(content, enemy) / 2 && itemProblem({ content, battle, party: run.party, inventory: run.inventory, catchBlocked: nuzlockeCatchProblem(battle) }, 'poke-ball') === null) {
        const turn = takeTurn(content, run, { kind: 'item', itemId: 'poke-ball' });
        return { run: turn.run, turn };
      }
      const mon = run.party[battle.activeIndex]!;
      if (smart) {
        let smartTurn: TurnResult | null = null;
        try {
          smartTurn = smartBattleTurn(content, run, strong);
        } catch {
          smartTurn = null; // e.g. trapped: the plain player below attacks instead
        }
        if (smartTurn) return { run: smartTurn.run, turn: smartTurn };
      }
      const damaging = mon.moves.findIndex((m) => m.pp > 0 && (content.moves.get(m.id)!.power ?? 0) > 0);
      const index = damaging >= 0 ? damaging : mon.moves.findIndex((m) => m.pp > 0);
      const turn = takeTurn(content, run, { kind: 'move', index });
      return { run: turn.run, turn };
    }
    case 'decision': {
      const d = run.pending[0]!;
      if (d.kind === 'learnMove') return { run: resolveDecision(content, run, { kind: 'forgetMove', moveIndex: 0 }).run, turn: null };
      if (d.kind === 'signature') return { run: resolveDecision(content, run, { kind: 'signature', optionIndex: 0 }).run, turn: null };
      if (d.kind === 'mutator') return { run: resolveDecision(content, run, { kind: 'mutator', optionIndex: 0 }).run, turn: null };
      if (d.kind === 'mentorship') return { run: resolveDecision(content, run, { kind: 'mentor', accept: false }).run, turn: null };
      if (d.kind === 'askLead') return { run: resolveDecision(content, run, { kind: 'askLead', accept: false }).run, turn: null };
      if (d.kind !== 'caught') return { run: resolveDecision(content, run, { kind: 'skipMove' }).run, turn: null };
      if (strong && d.kind === 'caught') {
        // Team building: keep strong Pokémon only, and swap out the weakest member for a clearly better catch.
        const bst = (id: string): number => Object.values(content.species.get(id)?.baseStats ?? {}).reduce((a, n) => a + n, 0);
        const full = run.party.length >= partyCapacity(content, run);
        const got = bst(d.mon.speciesId);
        let weakest = 0;
        run.party.forEach((m, i) => { if (bst(m.speciesId) < bst(run.party[weakest]!.speciesId)) weakest = i; });
        try {
          if (!full && got >= (run.party.length < 4 ? 240 : 330)) return { run: resolveDecision(content, run, { kind: 'addToParty' }).run, turn: null };
          if (full && got > bst(run.party[weakest]!.speciesId) + 60) return { run: resolveDecision(content, run, { kind: 'replace', partyIndex: weakest }).run, turn: null };
        } catch {
          // Refused by a modifier: let it go.
        }
        return { run: resolveDecision(content, run, { kind: 'release' }).run, turn: null };
      }
      if (run.party.length < partyCapacity(content, run)) {
        try {
          return { run: resolveDecision(content, run, { kind: 'addToParty' }).run, turn: null };
        } catch {
          // A modifier (Monotype, No Duplicate Species) refuses this Pokémon: let it go.
        }
      }
      return { run: resolveDecision(content, run, { kind: 'release' }).run, turn: null };
    }
    case 'reward': {
      const order = [...(run.draft ?? []).keys()];
      if (strong) order.sort((a, b) => rewardRank(content, run.draft![b]!) - rewardRank(content, run.draft![a]!));
      // Candies go to the weakest Pokémon so the whole team keeps up; everything else tries the lead first.
      const targets = [...run.party.keys()];
      for (const i of order) {
        const id = run.draft![i]!;
        if (strong && /candy/.test(id)) targets.sort((a, b) => run.party[a]!.level - run.party[b]!.level);
        for (const t of targets.length > 0 ? targets : [0]) {
          try {
            return { run: chooseReward(content, run, i, t).run, turn: null };
          } catch {
            // Not usable on this Pokémon; try the next.
          }
        }
      }
      throw new Error('No reward could be taken');
    }
    case 'over':
      return { run, turn: null };
  }
}

export function autoplay(opts: AutoplayOptions): RunState {
  const content = opts.content ?? defaultContent;
  let run = createRun(content, { runId: `test-${opts.seed}`, seed: opts.seed, archetypeId: opts.archetypeId ?? 'red', campaignId: opts.campaignId ?? 'full', attributes: opts.attributes, rules: opts.rules });
  let maxFoe = 0;
  for (let i = 0; i < opts.steps && run.phase !== 'over'; i++) {
    if (run.battle) for (const e of run.battle.enemyTeam) maxFoe = Math.max(maxFoe, e.level);
    if (opts.parLevel !== undefined && run.phase === 'map' && maxFoe > 0) {
      const want = Math.max(1, maxFoe + opts.parLevel);
      // Evolved the way trainers' Pokémon are for that level, so the party is not made of babies at level 80.
      run.party = run.party.map((m) => {
        const form = evolvedFormAt(content, m.speciesId, Math.max(m.level, want));
        return m.level >= want && form === m.speciesId ? m : { ...createPokemon(content, form, Math.max(m.level, want), m.uid), friendship: m.friendship };
      });
    }
    if (opts.healOnMap && run.phase === 'map') run = debugHealParty(content, run);
    const next = step(content, run, opts.smart === true, opts.strong === true);
    if (opts.starterLevel && run.phase === 'starter') {
      const mon = next.run.party[0]!;
      next.run.party[0] = { ...createPokemon(content, mon.speciesId, opts.starterLevel, mon.uid), friendship: mon.friendship };
    }
    run = (opts.onStep?.(next.run, next.turn) as RunState | undefined) ?? next.run;
  }
  return run;
}

/** What the rules decided, without the story layer: used to check that adding it changed no roll. */
export function gameplayFingerprint(run: RunState): string {
  const { story: _story, hyper: _hyper, ...oldStreams } = run.rng as Record<string, unknown>;
  return JSON.stringify({
    phase: run.phase,
    encounters: run.encountersCompleted,
    money: run.money,
    badges: run.badges,
    party: run.party.map((m) => [m.speciesId, m.level, m.xp, m.hp, m.friendship, m.moves.map((x) => `${x.id}:${x.pp}`)]),
    inventory: run.inventory,
    rewards: run.log.rewardsTaken,
    defeatedBy: run.log.defeatedBy,
    rng: oldStreams,
  });
}

/** Expected damage score of a move against the enemy's types (0 for status moves). */
function moveScore(content: Content, mon: PokemonInstance, moveId: string, enemy: PokemonInstance): number {
  const move = content.moves.get(moveId);
  if (!move || !move.power) return 0;
  const species = content.species.get(mon.speciesId)!;
  const foe = content.species.get(enemy.speciesId)!;
  const stab = species.types.includes(move.type) ? 1.5 : 1;
  return move.power * stab * typeEffectiveness(content.typeChart, move.type, foe.types) * ((move.accuracy ?? 100) / 100);
}

const bestScore = (content: Content, mon: PokemonInstance, enemy: PokemonInstance): number => Math.max(0, ...mon.moves.filter((m) => m.pp > 0).map((m) => moveScore(content, mon, m.id, enemy)));

/** How much the strong player wants a reward: levels, stat boosters and healing before held items before everything else. */
function rewardRank(content: Content, id: string): number {
  if (/candy/.test(id)) return 100;
  if (/^(calcium|protein|carbos|iron|zinc|hp-up)$/.test(id)) return 80;
  if (/^(max-revive|revive|full-restore|hyper-potion|super-potion|potion|max-potion)$/.test(id)) return 70;
  if (/^(item:)/.test(id)) return 5;
  return content.catalog.get(id)?.effect?.kind === 'held' ? 40 : 20;
}

/** The smart player's choice for one battle turn, or null to fall back to the plain player. */
function smartBattleTurn(content: Content, run: RunState, strong = false): TurnResult | null {
  const battle = run.battle!;
  const enemy = currentEnemy(battle);
  const mon = run.party[battle.activeIndex]!;
  const hpShare = mon.hp / maxHp(content, mon);
  if (forcedMoveIndex(battle, run.party) !== null) return null;
  const potion = (strong ? ['full-restore', 'max-potion', 'hyper-potion', 'super-potion', 'potion'] : ['hyper-potion', 'super-potion', 'potion']).find((id) => (run.inventory[id] ?? 0) > 0);
  // The strong player revives a fallen teammate when two or more are down and the active Pokémon is healthy.
  if (strong && hpShare >= 0.6 && (run.inventory['revive'] ?? 0) > 0) {
    const down = run.party.findIndex((p) => p.hp <= 0);
    if (down >= 0 && run.party.filter((p) => p.hp <= 0).length >= 2) {
      try { return takeTurn(content, run, { kind: 'item', itemId: 'revive', targetIndex: down }); } catch { /* not allowed here: carry on */ }
    }
  }
  if (potion && hpShare < (strong ? 0.5 : 0.35)) return takeTurn(content, run, { kind: 'item', itemId: potion, targetIndex: battle.activeIndex });
  // Leave a bad matchup for a healthy teammate that does much better.
  const mine = bestScore(content, mon, enemy);
  let bestIndex = -1;
  let best = mine * 1.8;
  run.party.forEach((p, i) => {
    if (i === battle.activeIndex || p.hp / maxHp(content, p) < 0.5) return;
    const score = bestScore(content, p, enemy);
    if (score > best) { best = score; bestIndex = i; }
  });
  // The strong player also leaves when its Pokémon is nearly down and a healthy teammate is waiting.
  if (strong && bestIndex < 0 && hpShare < 0.3 && !potion) {
    let alt = -1;
    run.party.forEach((p, i) => { if (i !== battle.activeIndex && p.hp / maxHp(content, p) >= 0.6 && (alt < 0 || bestScore(content, p, enemy) > bestScore(content, run.party[alt]!, enemy))) alt = i; });
    if (alt >= 0) return takeTurn(content, run, { kind: 'switch', partyIndex: alt });
  }
  if (bestIndex >= 0 && (battle.turn % 4 === 0 || (strong && hpShare < 0.4)) && (mine < 60 || strong)) return takeTurn(content, run, { kind: 'switch', partyIndex: bestIndex });
  const index = mon.moves.reduce((bi, m, i) => (m.pp > 0 && moveScore(content, mon, m.id, enemy) > (bi < 0 ? -1 : moveScore(content, mon, mon.moves[bi]!.id, enemy)) ? i : bi), -1);
  return index >= 0 ? takeTurn(content, run, { kind: 'move', index }) : null;
}

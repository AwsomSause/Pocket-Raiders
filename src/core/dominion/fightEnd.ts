// DOMINION D2: a battle the Boss's action waited on has ended. Called by the battle rules (run.ts takeTurn) before any
// of the main game's after-battle steps: no prize, no node, and a loss never ends the run. The Boss's team is not
// healed (Rest does that, Part 1 §2.1). Doesn't import run.ts (it's called from there).

import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { settle } from './field';
import { DOMINION_DATA } from './data';
import { bookRest, weekSum } from './book';

const MODE = 'dominion';

/** True while a Dominion run's battle is one an action is waiting on. */
export const dominionFightOn = (run: RunState): boolean => run.rules.modeId === MODE && !!run.expansion?.dominion?.field.fight?.begun && !!run.battle;

/** D11: a Heroic Legendary defending the region can't be caught (Part 4 §8). Pure, no imports (run.ts calls it). */
export function dominionCatchBlock(run: RunState): string | null {
  return dominionFightOn(run) && run.expansion?.dominion?.field.fight?.why === 'legend' ? DOMINION_DATA.hero.lines.legendNoCatch ?? 'It won\'t be caught.' : null;
}

/** Settles the fight: a caught Pokémon joins the team (or the box), the battle's gone, the run's back on the map. Mutates `run`. */
export function endDominionFight(content: Content, run: RunState, outcome: 'win' | 'lose' | 'caught' | 'fled'): string[] {
  const block = structuredClone(run.expansion!.dominion!);
  let caught: string | null = null;
  if (outcome === 'caught' && run.battle) {
    const foe = run.battle.enemyTeam[run.battle.enemyIndex];
    if (foe) {
      const mon = { ...structuredClone(foe), hp: Math.max(1, foe.hp) };
      if (run.party.length < 6) run.party = [...run.party, mon];
      else run.box = [...(run.box ?? []), mon];
      caught = content.species.get(mon.speciesId)?.name ?? mon.speciesId;
    }
  }
  run.battle = null;
  run.phase = 'map';
  const funds = block.funds, sum = weekSum(block), why = block.field.fight?.why ?? 'fail';
  const lines = settle(content, block, run, outcome === 'caught' ? 'win' : outcome, caught);
  // D6: the fight's money on the Ledger (a fine, a raid's take, a duel's wager). The Notoriety ladder is checked on the
  // next step (empire.ts isn't imported here: run.ts imports this file, and empire.ts would close a cycle).
  bookRest(block, funds, sum, DOMINION_DATA.empire.ledger.byFight[why] ?? 'jobs');
  run.expansion = { ...(run.expansion ?? {}), dominion: block };
  return lines;
}

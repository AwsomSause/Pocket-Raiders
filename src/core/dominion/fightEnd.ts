// DOMINION D2: a battle the Boss's action waited on has ended. Called by the battle rules (run.ts takeTurn) before any
// of the main game's after-battle steps: no prize, no node, and a loss never ends the run. The Boss's team is not
// healed (Rest does that, Part 1 §2.1). Doesn't import run.ts (it's called from there).

import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { settle } from './field';

const MODE = 'dominion';

/** True while a Dominion run's battle is one an action is waiting on. */
export const dominionFightOn = (run: RunState): boolean => run.rules.modeId === MODE && !!run.expansion?.dominion?.field.fight?.begun && !!run.battle;

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
  const lines = settle(content, block, run, outcome === 'caught' ? 'win' : outcome, caught);
  run.expansion = { ...(run.expansion ?? {}), dominion: block };
  return lines;
}

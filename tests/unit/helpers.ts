import { buildContent } from '../../src/data';
import type { Content } from '../../src/core/contentSchema';

export const content: Content = buildContent();

import { levelScale, type LevelScale } from '../../src/core/encounters';
import { chooseNode, chooseReward, mapChoices } from '../../src/core/run';
import type { RunState } from '../../src/core/state';

/** The difficulty curve at a point of the full campaign (region, stage and column count from 0, 0, 1). */
export function scaleAt(stageIndex: number, column: number, regionIndex = 0, c: Content = content): LevelScale {
  return levelScale(c, c.campaigns.get('full')!, regionIndex, stageIndex, column);
}

/** On the map, walks into the first normal (not harder) next node; otherwise returns the run unchanged. */
export function toBattle(run: RunState, c: Content = content): RunState {
  if (run.phase !== 'map') return run;
  const choices = mapChoices(c, run);
  const node = choices.find((n) => !n.harder) ?? choices[0]!;
  const next = chooseNode(c, run, node.id);
  // Scripted fights in tests expect one foe: an SOS call is marked as already used (tests/unit/sos.test.ts covers calls).
  if (next.battle) next.battle.sos = { ...freshSos(), answered: 1 };
  return next;
}

import { freshSos } from '../../src/core/battle/sos';
import { rewardTargetProblem } from '../../src/core/rewards';

/**
 * Takes the first plain reward in the draft that some party member can receive,
 * repeating after a free re-roll, the way a player who just clicks through would.
 */
function plainCatalog(c: Content, entryId: string): boolean {
  const effect = c.catalog.get(entryId)?.effect;
  if (effect?.kind === 'encounter' || effect?.kind === 'perk') return false;
  return !(effect?.kind === 'held' && effect.hooks.some((h) => h.hook === 'selfStatus' || h.hook === 'stickyBarb'));
}

export function takeAnyReward(run: RunState, c: Content = content): RunState {
  let guard = 0;
  while (run.phase === 'reward' && guard++ < 20) {
    let picked: RunState | null = null;
    // First pass: a plain reward, so a map item (a Repel...), a held item that hurts its holder (Flame Orb...)
    // or a follow-up choice (a fossil, a move to teach) doesn't change what the test walks into next. Second pass: anything that can be taken.
    for (const plain of [true, false]) {
      for (let i = 0; i < run.draft!.length && !picked; i++) {
        const reward = c.rewards.get(run.draft![i]!)!;
        if (plain && reward.effect.kind === 'catalog' && !plainCatalog(c, reward.effect.entry)) continue;
        const target = run.party.findIndex((_, t) => rewardTargetProblem(c, run, reward, t) === null);
        if (target < 0) continue;
        const next = chooseReward(c, run, i, target).run;
        if (!plain || next.phase !== 'decision') picked = next;
      }
      if (picked) break;
    }
    if (!picked) throw new Error('No reward in the draft can be taken');
    run = picked;
  }
  return run;
}

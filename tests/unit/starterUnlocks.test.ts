// Starter Remembrances are the only starter system (Kice 2026-11-08): the first three come from the quiz, and every other line
// must have a way to be earned (a quest or game event, or a Starter Scout), or the player could never reach it.
import { describe, expect, it } from 'vitest';
import { JET_UNLOCK } from '../../src/core/story2/jetBlessing';
import { SCOUT_UNLOCKS } from '../../src/core/story2/starterScouts';
import { content } from './helpers';

const lines = content.storyData.remembrances.filter((r) => r.status !== 'disabled');

describe('Remembrance starter unlocks', () => {
  it('every line that is not in the quiz has a route: an authored event or a Starter Scout', () => {
    const eventIds = new Set<string>();
    for (const e of content.storyData.events) eventIds.add(e.id);
    const unreachable = lines
      .filter((r) => r.unlock.kind !== 'quiz' && r.unlock.kind !== 'start')
      .filter((r) => !(r.unlock.kind === 'event' && (eventIds.has(r.unlock.arg ?? '') || SCOUT_UNLOCKS.has(r.unlock.arg ?? '') || r.unlock.arg === JET_UNLOCK)))
      .map((r) => `${r.id} (${r.unlock.kind}:${r.unlock.arg})`);
    expect(unreachable).toEqual([]);
  });

  it('the quiz pool alone can always give three starters from three regions', () => {
    const pool = lines.filter((r) => r.quizEligible && (r.unlock.kind === 'quiz' || r.unlock.kind === 'start'));
    expect(new Set(pool.map((r) => r.generation)).size).toBeGreaterThanOrEqual(3);
  });
});

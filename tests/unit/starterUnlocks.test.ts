// Starter Remembrances are the only starter system (Kice 2026-11-08): the first three come from the quiz, and every other line
// must have a way to be earned (a quest or game event, or a Starter Scout), or the player could never reach it.
import { describe, expect, it } from 'vitest';
import { JET_UNLOCK } from '../../src/core/story2/jetBlessing';
import { SCOUT_UNLOCKS } from '../../src/core/story2/starterScouts';
import { winUnlocks } from '../../src/core/story2/winUnlocks';
import { content } from './helpers';

const lines = content.storyData.remembrances.filter((r) => r.status !== 'disabled');

describe('Remembrance starter unlocks', () => {
  it('every line that is not in the quiz has a route: an authored event or a Starter Scout', () => {
    const eventIds = new Set<string>();
    for (const e of content.storyData.events) eventIds.add(e.id);
    const unreachable = lines
      .filter((r) => r.unlock.kind !== 'quiz' && r.unlock.kind !== 'start')
      .filter((r) => !(r.unlock.kind === 'win' || r.unlock.kind === 'event' && (eventIds.has(r.unlock.arg ?? '') || SCOUT_UNLOCKS.has(r.unlock.arg ?? '') || r.unlock.arg === JET_UNLOCK)))
      .map((r) => `${r.id} (${r.unlock.kind}:${r.unlock.arg})`);
    expect(unreachable).toEqual([]);
  });

  it('the quiz pool alone can always give three starters from three regions', () => {
    const pool = lines.filter((r) => r.quizEligible && (r.unlock.kind === 'quiz' || r.unlock.kind === 'start'));
    expect(new Set(pool.map((r) => r.generation)).size).toBeGreaterThanOrEqual(3);
  });

  const nonQuiz = lines.filter((r) => r.unlock.kind !== 'quiz' && r.unlock.kind !== 'start');

  it('every Rare and Exceptional line has its own quest arc or a win route, and no two lines share one quest', () => {
    const arcs = new Map(content.storyData.arcs.filter((a) => a.id.startsWith('arc_qa_')).map((a) => [`ev_${a.id.slice(4)}_${a.steps.length}`, a.id]));
    const used = new Map<string, string>();
    const problems: string[] = [];
    for (const r of nonQuiz.filter((x) => x.rarity === 'rare' || x.rarity === 'exceptional')) {
      if (r.unlock.kind === 'win') continue;
      const arg = r.unlock.arg ?? '';
      if (!arcs.has(arg)) problems.push(`${r.id}: ${arg} is not a quest arc's last scene`);
      else if (used.has(arg)) problems.push(`${r.id} shares ${arg} with ${used.get(arg)}`);
      used.set(arg, r.id);
    }
    expect(problems).toEqual([]);
  });

  it('Jet no longer hands out the lines that have their own quests', () => {
    expect(nonQuiz.filter((r) => r.unlock.arg === JET_UNLOCK)).toEqual([]);
  });

  it('each win line unlocks only on a won run with a matching party type', () => {
    const win = lines.filter((r) => r.unlock.kind === 'win');
    expect(win.length).toBeGreaterThan(0);
    const typesOf = (id: string) => content.species.get(id)?.types ?? [];
    const party = [{ speciesId: 'geodude' }] as never;
    expect(winUnlocks(content.storyData, { victory: true, party }, typesOf)).toContain('rm_larvitar');
    expect(winUnlocks(content.storyData, { victory: false, party }, typesOf)).toEqual([]);
    expect(winUnlocks(content.storyData, { victory: true, party: [{ speciesId: 'pikachu' }] as never }, typesOf)).not.toContain('rm_larvitar');
  });
});

// World Boss Week (idea S133): offline version. A weekly game event whose "town board" is the player's own raid and Totem wins.
import { describe, expect, it } from 'vitest';
import { weeklyRotation, objectiveViews } from '../../src/core/gameEvents';
import { createProfile } from '../../src/core/profile';
import { content } from './helpers';

describe('World Boss Week', () => {
  const event = content.gameEvents.get('world-boss-week')!;

  it('is in the weekly rotation with raid-based town board goals', () => {
    expect(weeklyRotation(content).map((e) => e.id)).toContain('world-boss-week');
    expect(event.objectives.map((o) => o.counter).every((c) => c === 'raidsWon' || c === 'totemsWon')).toBe(true);
    expect(event.objectives.length).toBe(4);
  });

  it('fills the board from counters and reports done goals', () => {
    const profile = createProfile(content, 'p');
    profile.gameEvents = { 'world-boss-week@2026-W45': { raidsWon: 5, totemsWon: 1 } };
    const views = objectiveViews(profile, event, 'world-boss-week@2026-W45');
    expect(views.filter((v) => v.done).map((v) => v.objective.id)).toEqual(['town-board-1', 'town-board-2']);
  });
});

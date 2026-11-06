import { describe, expect, it } from 'vitest';
import { eligibleEvents } from '../../src/core/events';
import { createProfile } from '../../src/core/profile';
import { chooseStarter, createRun } from '../../src/core/run';
import { foldTreasureHunt, freshTreasureHunt, seedTreasureHunt } from '../../src/core/treasureHunt';
import { CURRENT_VERSIONS, MIGRATIONS, SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { ProfileSchema } from '../../src/core/state';
import { content } from './helpers';

const run = (hunt?: ReturnType<typeof freshTreasureHunt>) => chooseStarter(content, createRun(content, { runId: 'r', seed: 'th', archetypeId: 'red', treasureHunt: hunt }), 0);
const ids = (r: ReturnType<typeof run>) => eligibleEvents(content, r).map((e) => e.id).filter((id) => id.startsWith('th-'));

describe('Treasure Hunt Season (S150)', () => {
  it('a new run offers every map piece and not the treasure', () => {
    expect(ids(run())).toEqual(['th-map-1', 'th-map-2', 'th-map-3', 'th-map-4', 'th-map-5']);
  });
  it('pieces found in one run are held in the next, and only the missing ones are offered', () => {
    const r1 = run();
    r1.story.flags['ev:th-piece-2'] = 1;
    r1.story.flags['ev:th-piece-4'] = 1;
    const hunt = foldTreasureHunt(freshTreasureHunt(), r1);
    expect(hunt).toEqual({ pieces: [2, 4], claimed: false });
    const r2 = run(hunt);
    expect(ids(r2)).toEqual(['th-map-1', 'th-map-3', 'th-map-5']);
    expect(Number(r2.story.flags['ev:th-piece-4'])).toBe(1);
  });
  it('all five pieces open the treasure once; claiming it ends the hunt for good', () => {
    const all = { pieces: [1, 2, 3, 4, 5], claimed: false };
    expect(ids(run(all))).toEqual(['th-treasure']);
    const r = run(all);
    r.story.flags['ev:th-claimed'] = 1;
    expect(ids(r)).toEqual([]);
    const folded = foldTreasureHunt(all, r);
    expect(folded.claimed).toBe(true);
    expect(ids(run(folded))).toEqual([]);
  });
  it('folding never loses pieces and is safe to repeat', () => {
    const r = run();
    const once = foldTreasureHunt({ pieces: [3], claimed: false }, r);
    expect(once.pieces).toEqual([3]);
    expect(foldTreasureHunt(once, r)).toEqual(once);
  });
  it('seeding without a hunt (an old caller) changes nothing', () => {
    const story: { flags: Record<string, unknown> } = { flags: {} };
    expect(seedTreasureHunt(story as never, undefined)).toBe(story);
    expect(story.flags).toEqual({});
  });
});

describe('profile save v18 migration', () => {
  it('adds an empty treasure hunt to a v17 profile and the result passes the schema', () => {
    expect(CURRENT_VERSIONS.profile).toBeGreaterThanOrEqual(18);
    const v17 = { ...(createProfile(content, 'p') as Record<string, unknown>) };
    delete v17.treasureHunt;
    const migrated = MIGRATIONS.profile[17]!(v17) as Record<string, unknown>;
    expect(migrated.treasureHunt).toEqual({ pieces: [], claimed: false });
    expect(ProfileSchema.safeParse(migrated).success).toBe(true);
  });
  it('a new profile starts with an empty hunt', () => {
    expect(createProfile(content, 'p').treasureHunt).toEqual({ pieces: [], claimed: false });
  });
});

describe('profile save v17 loads through the save manager', () => {
  it('a version 17 profile opens with an empty treasure hunt', () => {
    const storage = new MemoryStorageProvider();
    const { treasureHunt: _t, ...old } = createProfile(content, 'p17');
    storage.set('pkr.profile', JSON.stringify({ format: 'pkmn-roguelike', record: 'profile', schemaVersion: 17, savedAt: '', data: old }));
    const { profile, warning } = new SaveManager(storage, content).loadOrCreateProfile(() => 'new');
    expect(warning).toBeUndefined();
    expect(profile.profileId).toBe('p17');
    expect(profile.treasureHunt).toEqual({ pieces: [], claimed: false });
  });
});

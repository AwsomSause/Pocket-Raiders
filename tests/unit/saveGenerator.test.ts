import { describe, expect, it } from 'vitest';
import { generateSave } from '../../src/save/saveGenerator';
import { GameSession } from '../../src/game/GameSession';
import { MemoryStorageProvider } from '../../src/save/storage';
import { genderOf } from '../../src/core/gender';
import { content } from './helpers';

const base = { seed: 't1', trainer: 'nate', region: 4, stage: 4, levelCapCheck: false };

describe('save generator', () => {
  it('builds a save that imports and continues at the asked region, stage and party', () => {
    const { file } = generateSave(content, { ...base, party: [{ species: 'meowstic-female', level: 186, gender: 'female', held: 'mega-stone', moves: ['psychic'] }, { species: 'zekrom', level: 186 }] });
    const s = new GameSession(content, new MemoryStorageProvider());
    expect(s.importSave(file)).toMatch(/run in progress/);
    const run = s.run!;
    expect(run.regionIndex).toBe(3);
    expect(run.stage?.index).toBe(3);
    expect(run.regionsCleared).toHaveLength(3);
    expect(run.archetypeId).toBe('nate');
    expect(run.party.map((m) => m.speciesId)).toEqual(['meowstic-female', 'zekrom']);
    expect(genderOf(content, run.party[0]!)).toBe('female');
    expect(run.party[0]!.held).toEqual({ meowsticite: 1 });
    expect(run.inventory['mega-ring']).toBe(1);
  });

  it('is deterministic and fills blanks from the seed', () => {
    const spec = { ...base, party: [{ species: 'charizard', level: 60 }] };
    expect(generateSave(content, spec).file).toBe(generateSave(content, spec).file);
    expect(generateSave(content, spec).file).not.toBe(generateSave(content, { ...spec, seed: 't2' }).file);
  });

  it('lists every problem instead of writing a bad save', () => {
    expect(() => generateSave(content, { ...base, region: 99, party: [{ species: 'nope' }, { species: 'zekrom', gender: 'female', moves: ['no-move'], ability: 'levitate' }] })).toThrow(/region 99[\s\S]*unknown species[\s\S]*cannot be female[\s\S]*ability[\s\S]*unknown move/);
    expect(() => generateSave(content, { ...base, levelCapCheck: true, party: [{ species: 'zekrom', level: 400 }] })).toThrow(/cap/);
    expect(() => generateSave(content, { party: [{ species: 'zekrom', bogus: 1 }] })).toThrow();
  });

  it('patch fields reach anything in the save', () => {
    const { file } = generateSave(content, { ...base, profile: { bankCredits: 999, prestige: 3, unlockAllTrainers: true, patch: { 'stats.battlesWon': 77 } }, storyFlags: { 'rival-met': true }, run: { patch: { 'log.battlesWon': 5 } } });
    const s = new GameSession(content, new MemoryStorageProvider());
    s.importSave(file);
    expect(s.profile).toMatchObject({ bankCredits: 999, legacy: { prestige: 3 }, stats: { battlesWon: 77 } });
    expect(s.run!.story.flags['rival-met']).toBe(true);
    expect(s.run!.log.battlesWon).toBe(5);
  });
});

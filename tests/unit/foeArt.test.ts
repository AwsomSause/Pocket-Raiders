import { describe, expect, it } from 'vitest';
import { FOE_ART_POOL, fallbackFoeArt, type FoeArtContent } from '../../src/core/presentation/foeArt';

// Who stands in on the versus card and in the battle for an event Trainer the event gives no picture.

const cls = (id: string, name: string) => ({ id, name, spriteAssetId: `trainer.${id}` });
const classes = [cls('sailor', 'Sailor'), cls('bug-catcher', 'Bug Catcher'), cls('catcher', 'Catcher'), cls('rocket-grunt-m', 'Team Rocket Grunt'), ...FOE_ART_POOL.map((id) => cls(id, `Class ${id}`))];
const content: FoeArtContent = {
  trainers: { values: () => classes, get: (id) => classes.find((c) => c.id === id) },
  bosses: { values: () => [{ name: 'Sabrina', sprites: { default: 'boss.sabrina' } }] },
  species: { values: () => [{ id: 'meowth', name: 'Meowth' }, { id: 'mr-mime', name: 'Mr. Mime' }] },
};

describe('stand-in picture for an event Trainer', () => {
  it('a known character, a Pokémon, or a Trainer class in the name is drawn as itself', () => {
    expect(fallbackFoeArt(content, 'Sabrina')).toEqual({ assetId: 'boss.sabrina' });
    expect(fallbackFoeArt(content, 'Meowth')).toEqual({ speciesId: 'meowth' });
    expect(fallbackFoeArt(content, 'mr mime')).toEqual({ speciesId: 'mr-mime' });
    expect(fallbackFoeArt(content, 'Sailor Dobbs-Leary')).toEqual({ assetId: 'trainer.sailor' });
    // The longest class name wins, and only whole words count ("Catcher" inside "Bug Catcher", not "Sail" inside "Sailor").
    expect(fallbackFoeArt(content, 'Bug Catcher Wade')).toEqual({ assetId: 'trainer.bug-catcher' });
  });

  it('an Evil Team name gets the run\'s grunt, or a Rocket Grunt when no team is about', () => {
    expect(fallbackFoeArt(content, 'Desk Grunt', 'trainer.plasma_grunt')).toEqual({ assetId: 'trainer.plasma_grunt' });
    expect(fallbackFoeArt(content, 'Rocket Executive')).toEqual({ assetId: 'trainer.rocket-grunt-m' });
    expect(fallbackFoeArt(content, 'The Lieutenant', null)).toEqual({ assetId: 'trainer.rocket-grunt-m' });
  });

  it('any other name is dealt an everyday Trainer, the same one every time', () => {
    const pool = FOE_ART_POOL.map((id) => `trainer.${id}`);
    const seen = new Set<string>();
    for (const name of ['Floor 3 Trainer', 'Damian', 'Pyro', 'Sparky', 'Ressa', 'Your Reflection', 'Challenger', 'Aurelio', 'Pax', 'Duplica']) {
      const a = fallbackFoeArt(content, name);
      expect(a).toEqual(fallbackFoeArt(content, name));
      expect(pool).toContain((a as { assetId: string }).assetId);
      seen.add((a as { assetId: string }).assetId);
    }
    expect(seen.size).toBeGreaterThan(2);
  });

  it('a blank name gives nothing, and a missing pool class is stepped over', () => {
    expect(fallbackFoeArt(content, '')).toBeNull();
    expect(fallbackFoeArt(content, ' - ')).toBeNull();
    const thin: FoeArtContent = { ...content, trainers: { values: () => [cls('hiker', 'Hiker')], get: (id) => (id === 'hiker' ? cls('hiker', 'Hiker') : undefined) } };
    expect(fallbackFoeArt(thin, 'Pyro')).toEqual({ assetId: 'trainer.hiker' });
    expect(fallbackFoeArt({ ...content, trainers: { values: () => [], get: () => undefined } }, 'Pyro')).toBeNull();
  });
});

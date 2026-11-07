// Jet Pokémon and Jet the Viking (Hub Town): six new species, the held-item evolution routes, the Booster Energy
// hook, the four unlocked Story Run starter lines (two holding Booster Energy, one Black Sludge) and the Hub keeper.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { conditionEvolutionTarget, conditionText, CONDITION_EVOLUTIONS } from '../../src/core/conditionEvolution';
import { evolutionTarget } from '../../src/core/evolution';
import { HUB_TOWN, OVERWORLD } from '../../src/core/hubTown/schema';
import { createPokemon } from '../../src/core/pokemon';
import { createProfile } from '../../src/core/profile';
import { chooseStarter, createRun } from '../../src/core/run';
import { JET_LINES, jetBlessing } from '../../src/core/story2/jetBlessing';
import { content } from './helpers';

const IDS = ['espeon-paradox', 'umbreon-paradox', 'toxtricity-future', 'toxtricity-past', 'bastiodon-skull', 'aggron-evolution'];
const img = (...p: string[]): string => join(__dirname, '..', '..', 'public', 'assets', 'images', ...p);
const day = { heartbond: null, night: false };
const night = { heartbond: null, night: true };
const holder = (id: string, level: number, held: Record<string, number>) => {
  const m = createPokemon(content, id, level, 'u1');
  m.held = held;
  return m;
};

describe('Jet species', () => {
  it('are six valid species with art in every folder and an existing cry and icon', () => {
    for (const id of IDS) {
      const s = content.species.get(id)!;
      expect(s, id).toBeTruthy();
      expect(s.learnset.length, id).toBeGreaterThan(5);
      expect(s.abilities.normal.every((a) => content.abilities.has(a)), id).toBe(true);
      for (const dir of ['', 'back', 'shiny', 'back/shiny']) for (const ext of ['png', 'json']) expect(existsSync(img('pokemon', dir, 'custom', `${id}.${ext}`)), `${dir}/${id}.${ext}`).toBe(true);
    }
    expect(content.species.get('espeon-paradox')!.types).toEqual(['psychic', 'fire']);
    expect(content.species.get('bastiodon-skull')!.types).toEqual(['rock', 'poison']);
  });

  it('Aggron evolves into its new final stage at level 55', () => {
    const aggron = createPokemon(content, 'aggron', 54, 'u1');
    expect(evolutionTarget(content, aggron)).toBeNull();
    aggron.level = 55;
    expect(evolutionTarget(content, aggron)).toBe('aggron-evolution');
  });
});

describe('Jet held-item evolutions', () => {
  it('Eevee holding Booster Energy becomes Paradox Espeon by day and Paradox Umbreon by night, from level 28', () => {
    expect(conditionEvolutionTarget(content, holder('eevee', 28, { 'booster-energy': 1 }), null, day)).toBe('espeon-paradox');
    expect(conditionEvolutionTarget(content, holder('eevee', 28, { 'booster-energy': 1 }), null, night)).toBe('umbreon-paradox');
    expect(conditionEvolutionTarget(content, holder('eevee', 27, { 'booster-energy': 1 }), null, day)).toBeNull();
    expect(conditionEvolutionTarget(content, holder('eevee', 40, {}), null, day)).toBeNull();
  });
  it('Toxel holding Booster Energy becomes Past Toxtricity by day and Future Toxtricity by night', () => {
    expect(conditionEvolutionTarget(content, holder('toxel', 28, { 'booster-energy': 1 }), null, day)).toBe('toxtricity-past');
    expect(conditionEvolutionTarget(content, holder('toxel', 28, { 'booster-energy': 1 }), null, night)).toBe('toxtricity-future');
  });
  it('Shieldon holding Black Sludge becomes Skull Bastiodon; plain Shieldon still needs level 30', () => {
    expect(conditionEvolutionTarget(content, holder('shieldon', 28, { 'black-sludge': 1 }), null, day)).toBe('bastiodon-skull');
    expect(conditionEvolutionTarget(content, holder('shieldon', 28, {}), null, day)).toBeNull();
    expect(evolutionTarget(content, holder('shieldon', 30, {}))).toBe('bastiodon');
  });
  it('the routes name their condition in plain words', () => {
    const e = CONDITION_EVOLUTIONS.find((x) => x.to === 'bastiodon-skull')!;
    expect(conditionText(content, e.condition!)).toBe('hold Black Sludge');
  });
  it('Booster Energy works on the Paradox forms', () => {
    const hook = (content.catalog.get('booster-energy')!.effect as { hooks: { species: string[] }[] }).hooks[0]!;
    for (const id of ['espeon-paradox', 'umbreon-paradox', 'toxtricity-future', 'toxtricity-past']) expect(hook.species).toContain(id);
  });
});

describe('Jet the Viking', () => {
  it('unlocks the four starter lines once, and nothing the second time', () => {
    const story = createProfile(content, 'p1').story;
    const first = jetBlessing(content.storyData, story);
    expect(first.added).toEqual([...JET_LINES]);
    for (const id of JET_LINES) expect(first.story.remembrance[id]?.state).toBe('unlocked');
    const again = jetBlessing(content.storyData, first.story);
    expect(again.added).toEqual([]);
    expect(again.story).toBe(first.story);
  });
  it('keeps what a line already had (runs, mastery)', () => {
    const story = createProfile(content, 'p1').story;
    story.remembrance.rm_aron = { state: 'seen', firstSeenRun: 3, runs: 2, mastery: 1 };
    expect(jetBlessing(content.storyData, story).story.remembrance.rm_aron).toEqual({ state: 'unlocked', firstSeenRun: 3, runs: 2, mastery: 1 });
  });
  it('the lines are Story Run starters that start the run holding their item', () => {
    const line = (id: string) => content.storyData.remembrances.find((r) => r.id === id)!;
    expect([line('rm_eevee').held, line('rm_toxel').held, line('rm_shieldon').held]).toEqual(['booster-energy', 'booster-energy', 'black-sludge']);
    expect(line('rm_eevee').unlock.kind).toBe('event');
    for (const [sp, item] of [['eevee', 'booster-energy'], ['toxel', 'booster-energy'], ['shieldon', 'black-sludge']] as const) {
      expect(content.catalog.has(item)).toBe(true);
      const story = chooseStarter(content, createRun(content, { runId: sp, seed: sp, archetypeId: 'red', campaignId: 'orrery-circuit', starterOverride: [sp] }), 0);
      expect(story.party[0]!.speciesId).toBe(sp);
      expect(story.party[0]!.held).toEqual({ [item]: 1 });
      const plain = chooseStarter(content, createRun(content, { runId: sp, seed: sp, archetypeId: 'red', starterOverride: [sp] }), 0);
      expect(plain.party[0]!.held).toBeUndefined();
    }
  });
  it('is a keeper in Hub Town on a free tile, with a walking sheet', () => {
    const k = HUB_TOWN.keepers.find((x) => x.id === 'viking')!;
    expect(k).toBeTruthy();
    expect(HUB_TOWN.solid.some(([x, y]) => x === k.x && y === k.y)).toBe(false);
    expect(OVERWORLD.trainers).toContain(k.sprite);
    expect(existsSync(img('overworld', 'trainers', `${k.sprite}.png`))).toBe(true);
  });
});

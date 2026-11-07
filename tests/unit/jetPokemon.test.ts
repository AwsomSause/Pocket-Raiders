// Jet Pokémon and Jet the Viking (Hub Town): six new species, the held-item evolution routes, the Booster Energy
// hook, the four unlocked Story Run starter lines (two holding Booster Energy, one Black Sludge) and the Hub keeper.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { conditionEvolutionTarget, conditionText, CONDITION_EVOLUTIONS } from '../../src/core/conditionEvolution';
import { evolutionTarget } from '../../src/core/evolution';
import { HUB_TOWN, OVERWORLD } from '../../src/core/hubTown/schema';
import type { NatureId } from '../../src/core/natures';
import { createPokemon } from '../../src/core/pokemon';
import { createProfile } from '../../src/core/profile';
import { chooseStarter, createRun } from '../../src/core/run';
import { JET_LINES, jetBlessing } from '../../src/core/story2/jetBlessing';
import { content } from './helpers';

const IDS = ['vine-riff', 'electric-oncore', 'pyro-spirit', 'neon-moon', 'bastiodoom', 'cataggron', 'cataggron-attack', 'cataggron-defence'];
const img = (...p: string[]): string => join(__dirname, '..', '..', 'public', 'assets', 'images', ...p);
const day = { heartbond: null, night: false };
const night = { heartbond: null, night: true };
const holder = (id: string, level: number, held: Record<string, number>, nature?: NatureId, friendship?: number) => {
  const m = createPokemon(content, id, level, 'u1');
  m.held = held;
  if (nature) m.nature = nature;
  if (friendship !== undefined) m.friendship = friendship;
  return m;
};
const BOOST = { 'booster-energy': 1 };

describe('Jet species', () => {
  it('are the pack\'s six Pokémon (and Cataggron\'s two battle Formes) with art in every folder', () => {
    for (const id of IDS) {
      const s = content.species.get(id)!;
      expect(s, id).toBeTruthy();
      expect(s.learnset.length, id).toBeGreaterThan(5);
      expect(s.abilities.normal.every((a) => content.abilities.has(a)), id).toBe(true);
      for (const dir of ['', 'back', 'shiny', 'back/shiny']) for (const ext of ['png', 'json']) expect(existsSync(img('pokemon', dir, 'custom', `${id}.${ext}`)), `${dir}/${id}.${ext}`).toBe(true);
    }
    const s = (id: string) => content.species.get(id)!;
    expect(s('vine-riff').types).toEqual(['grass', 'poison']);
    expect(Object.values(s('vine-riff').baseStats)).toEqual([95, 80, 85, 120, 90, 100]);
    expect(s('neon-moon').types).toEqual(['dark', 'steel']);
    expect(s('bastiodoom').abilities).toEqual({ normal: ['sturdy', 'plague-bulwark'], hidden: 'soundproof' });
    expect(Object.values(s('cataggron-defence').baseStats)).toEqual([85, 95, 230, 60, 115, 15]);
    expect(s('cataggron-attack').form).toEqual({ kind: 'battle', base: 'cataggron' });
  });
  it('their signature moves exist, one per Pokémon', () => {
    for (const [sp, mv] of [['vine-riff', 'thornstrum'], ['electric-oncore', 'feedback-shred'], ['pyro-spirit', 'mindflare'], ['neon-moon', 'neon-eclipse'], ['bastiodoom', 'grave-rampart'], ['cataggron', 'cataclysm-cannon']] as const) {
      expect(content.moves.get(mv), mv).toBeTruthy();
      expect(content.species.get(sp)!.learnset.some((e) => e.move === mv), `${sp} ${mv}`).toBe(true);
    }
  });
});

describe('Jet evolutions', () => {
  it('Toxel holding Booster Energy at level 30: Low Key nature becomes Vine Riff, Amped becomes Electric Oncore', () => {
    expect(conditionEvolutionTarget(content, holder('toxel', 30, BOOST, 'modest'), null, day)).toBe('vine-riff');
    expect(conditionEvolutionTarget(content, holder('toxel', 30, BOOST, 'adamant'), null, day)).toBe('electric-oncore');
    expect(conditionEvolutionTarget(content, holder('toxel', 29, BOOST, 'modest'), null, day)).toBeNull();
    expect(conditionEvolutionTarget(content, holder('toxel', 40, {}, 'modest'), null, day)).toBeNull();
  });
  it('Eevee holding Booster Energy with high friendship: Pyro Spirit by day, Neon Moon at night', () => {
    expect(conditionEvolutionTarget(content, holder('eevee', 5, BOOST, undefined, 255), null, day)).toBe('pyro-spirit');
    expect(conditionEvolutionTarget(content, holder('eevee', 5, BOOST, undefined, 255), null, night)).toBe('neon-moon');
    expect(conditionEvolutionTarget(content, holder('eevee', 5, BOOST, undefined, 0), null, day)).toBeNull();
    expect(conditionEvolutionTarget(content, holder('eevee', 5, {}, undefined, 255), null, day)).toBeNull();
  });
  it('Bastiodon holding Black Sludge becomes Bastiodoom; Aggron holding a Metal Coat at level 55 becomes Cataggron', () => {
    expect(conditionEvolutionTarget(content, holder('bastiodon', 20, { 'black-sludge': 1 }), null, day)).toBe('bastiodoom');
    expect(conditionEvolutionTarget(content, holder('bastiodon', 20, {}), null, day)).toBeNull();
    expect(conditionEvolutionTarget(content, holder('aggron', 55, { 'metal-coat': 1 }), null, day)).toBe('cataggron');
    expect(conditionEvolutionTarget(content, holder('aggron', 54, { 'metal-coat': 1 }), null, day)).toBeNull();
    expect(evolutionTarget(content, holder('aggron', 60, {}))).toBeNull();
  });
  it('the routes name their condition in plain words', () => {
    const e = CONDITION_EVOLUTIONS.find((x) => x.to === 'bastiodoom')!;
    expect(conditionText(content, e.condition!)).toBe('hold Black Sludge');
  });
  it('Booster Energy works on the four Paradox forms', () => {
    const hook = (content.catalog.get('booster-energy')!.effect as { hooks: { species: string[] }[] }).hooks[0]!;
    for (const id of ['vine-riff', 'electric-oncore', 'pyro-spirit', 'neon-moon']) expect(hook.species).toContain(id);
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

import { describe, expect, it } from 'vitest';
import { buildEpilogue, endingFor, endingVariationLines, factionLines, secretEndingLines } from '../../src/core/ending';
import { leadChatter } from '../../src/core/leadChatter';
import { companionSupport, COMPANION_FLAG } from '../../src/core/companionSupport';
import { emptyNpcMemory, seedNpcMemory } from '../../src/core/npcMemory';
import { buildCredits } from '../../src/core/credits';
import { getArchetype } from '../../src/core/archetypes';
import { hashSeed, Rng } from '../../src/core/rng';
import { leagueScale, planChampion } from '../../src/core/encounters';
import { chooseStarter, createRun, isFinalBoss } from '../../src/core/run';
import { content } from './helpers';

describe('the Grand Region finale', () => {
  const run = chooseStarter(content, createRun(content, { runId: 'end', seed: 'end', archetypeId: 'red' }), 0);

  it('the Grand Region lists a roster that exists', () => {
    const g = content.regions.get('grand')!;
    expect(g.gymLeaders.length).toBeGreaterThanOrEqual(8);
    expect(g.eliteFour.length).toBeGreaterThanOrEqual(4);
    expect(g.champions.length).toBeGreaterThan(0);
  });

  it('only the last region of a campaign with a Grand Region has the final boss', () => {
    const order = ['kanto', 'grand'];
    expect(isFinalBoss(content, { regionOrder: order, regionIndex: 0 })).toBe(false);
    expect(isFinalBoss(content, { regionOrder: order, regionIndex: 1 })).toBe(true);
    expect(isFinalBoss(content, { regionOrder: ['kanto', 'johto'], regionIndex: 1 })).toBe(false);
  });

  it('the final boss is stronger than an ordinary champion', () => {
    const arche = getArchetype(content, 'red');
    const scale = leagueScale(content, 0);
    const plain = planChampion(content, arche, 'geeta', 0, scale, new Rng(hashSeed('1')));
    const final = planChampion(content, arche, 'geeta', 0, scale, new Rng(hashSeed('1')), false, true);
    expect(final.members.length).toBe(plain.members.length);
    final.members.forEach((m, i) => expect(m.level).toBeGreaterThanOrEqual(plain.members[i]!.level));
    expect(final.members.reduce((n, m) => n + m.level, 0)).toBeGreaterThan(plain.members.reduce((n, m) => n + m.level, 0));
  });

  it('a lost run has no epilogue; a won run has one, the same every time, and the credits include it', () => {
    expect(buildEpilogue(content, run)).toEqual([]);
    const won = { ...structuredClone(run), victory: true };
    const lines = buildEpilogue(content, won);
    expect(lines.length).toBeGreaterThanOrEqual(1);
    expect(buildEpilogue(content, won)).toEqual(lines);
    expect(buildCredits(content, won).map((l) => l.text)).toContain(lines[0]);
  });

  it('the Storm ending outranks the others', () => {
    const won = { ...structuredClone(run), victory: true };
    won.story.flags['ge:won'] = true;
    expect(endingFor(won)).toBe('storm');
    expect(buildEpilogue(content, won)[0]).toContain(content.story.grandEnemy.name);
  });
});

describe('story endings and lead chatter (S120, S122, S129)', () => {
  const base = chooseStarter(content, createRun(content, { runId: 'ev', seed: 'ev', archetypeId: 'red' }), 0);
  const won = () => ({ ...structuredClone(base), victory: true });

  it('a close team earns a bond line; a lone Pokémon earns its own', () => {
    const run = won();
    run.party[0]!.friendship = 255;
    expect(endingVariationLines(content, run).join(' ')).toContain('One Pokémon');
  });

  it('secret endings need their obscure flags, and add lines the same way every time', () => {
    const run = won();
    expect(secretEndingLines(run)).toEqual([]);
    run.story.flags['ev:oath-steel'] = 1;
    run.story.flags['ev:oath-mercy'] = 1;
    run.story.flags['ev:betrayal-forgiven'] = 1;
    const lines = secretEndingLines(run);
    expect(lines).toHaveLength(2);
    expect(buildEpilogue(content, run)).toEqual(buildEpilogue(content, structuredClone(run)));
  });

  it('the lead Pokémon always has a line, and it does not change on a redraw', () => {
    expect(leadChatter(content, base)).toBe(leadChatter(content, base));
    expect(leadChatter(content, { ...base, party: [] })).toBeNull();
  });
});

describe('companion, factions and legend trail (S112, S114, S117)', () => {
  const base = chooseStarter(content, createRun(content, { runId: 'co', seed: 'co', archetypeId: 'red' }), 0);

  it('faction standing adds epilogue lines only from two points up', () => {
    const run = structuredClone(base);
    expect(factionLines(run)).toEqual([]);
    run.story.flags['ev:rep-rangers'] = 3;
    run.story.flags['ev:rep-scholars'] = 1;
    expect(factionLines(run)).toHaveLength(1);
    expect(factionLines(run)[0]).toContain('seat free');
  });

  it('the companion heals once per fight, only below half HP, and never without a companion', () => {
    const run = structuredClone(base);
    run.battle = { outcome: undefined, doubles: undefined, activeIndex: 0 } as never;
    const mon = run.party[0]!;
    mon.hp = 1;
    expect(companionSupport(content, run)).toBeNull();
    run.story.flags[COMPANION_FLAG] = 1;
    const first = companionSupport(content, run);
    expect(first?.amount).toBeGreaterThan(0);
    mon.hp = 1;
    expect(companionSupport(content, run)).toBeNull();
  });

  it('lore from earlier runs seeds a new run so the legend trail can continue', () => {
    const mem = { ...emptyNpcMemory(), lore: ['legend-trail-1'] };
    const story = seedNpcMemory({ flags: {} as Record<string, number> }, mem);
    expect(story.flags['ev:lore-legend-trail-1']).toBe(1);
    expect(content.npcStory.lore.some((l) => l.id === 'legend-trail-3')).toBe(true);
  });

  it('in a double battle the companion helps the weaker of the two Pokémon on the field', () => {
    const run = structuredClone(base);
    run.party.push(structuredClone(run.party[0]!));
    run.party[0]!.hp = 1;
    run.party[1]!.hp = 1;
    run.party[1]!.uid = 'second';
    run.battle = { outcome: undefined, activeIndex: 0, doubles: { player: { index: 1 } } } as never;
    run.story.flags[COMPANION_FLAG] = 1;
    expect(companionSupport(content, run)?.uid).toBeDefined();
    expect(companionSupport(content, run)).toBeNull();
  });
});

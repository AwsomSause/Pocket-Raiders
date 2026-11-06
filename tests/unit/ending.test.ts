import { describe, expect, it } from 'vitest';
import { buildEpilogue, endingFor, endingVariationLines, secretEndingLines } from '../../src/core/ending';
import { leadChatter } from '../../src/core/leadChatter';
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

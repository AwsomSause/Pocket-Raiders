import { describe, expect, it } from 'vitest';
import { chainGivesTalent, chainLinks, chainShiny, extendChain, shinyCharmMultiplier, shinyCharmTiers } from '../../src/core/catchChain';
import { runAttributeEffects } from '../../src/core/attributes';
import { createRun } from '../../src/core/run';
import { content } from './helpers';

const start = (dexCaught?: number) => createRun(content, { seed: 'chain', runId: 'r', archetypeId: 'red', dexCaught });

describe('shiny charm tiers (S225)', () => {
  it('tiers follow dex size', () => {
    expect([0, 24, 25, 100, 250, 499, 500, 900].map((n) => shinyCharmTiers(content, n))).toEqual([0, 0, 1, 2, 3, 3, 4, 4]);
  });
  it('a run with a tier multiplies the shiny chance; a run without does not', () => {
    const none = start(0);
    const gold = start(250);
    expect(shinyCharmMultiplier(content, none)).toBe(1);
    expect(shinyCharmMultiplier(content, gold)).toBe(2);
    expect(runAttributeEffects(content, gold).shinyChance).toBeCloseTo(runAttributeEffects(content, none).shinyChance * 2);
  });
});

describe('catch chains (S218)', () => {
  it('grows on the same species and breaks on another', () => {
    const run = start();
    expect(extendChain(run, 'rattata')).toBe(1);
    expect(extendChain(run, 'rattata')).toBe(2);
    expect(chainLinks(run, 'rattata')).toBe(2);
    expect(extendChain(run, 'pidgey')).toBe(1);
    expect(chainLinks(run, 'rattata')).toBe(0);
  });
  it('no chain, no extra shiny; a long chain raises the odds and is deterministic', () => {
    const run = start();
    expect(chainShiny(content, run, 'rattata', 'n1', 1)).toBe(false);
    for (let i = 0; i < 20; i++) extendChain(run, 'rattata');
    const a = chainShiny(content, run, 'rattata', 'n1', 1);
    expect(chainShiny(content, run, 'rattata', 'n1', 1)).toBe(a);
    let hits = 0;
    for (let i = 0; i < 4000; i++) if (chainShiny(content, run, 'rattata', `n${i}`, 1)) hits++;
    expect(hits).toBeGreaterThan(0); // 0.0005 x 10 x 2 = 1% per roll
    expect(hits).toBeLessThan(200);
  });
  it('a chain of five gives a talent', () => {
    expect(chainGivesTalent(content, 4)).toBe(false);
    expect(chainGivesTalent(content, 5)).toBe(true);
  });
});

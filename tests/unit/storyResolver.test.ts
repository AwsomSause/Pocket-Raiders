// Story Overhaul S1b: the Variant Resolver and the Module Validator.

import { describe, expect, it } from 'vitest';
import { validateModule } from '../../src/core/story2/moduleValidator';
import { resolveVariant } from '../../src/core/story2/resolver';
import { PARITY_ITEMS } from '../../src/quality/storyGates';
import { BackstorySchema, RemembranceSchema, type StoryData } from '../../src/core/story2/schema';
import { content } from './helpers';

const ctx = { backstory: 'bs_hisui', backstoryInputs: { prior_role: 'handler' }, rel: { ch_pell: { trust: 45 } }, flags: { contract_stage: 2 }, traits: { courage: 70 }, starter: { personality: 'timid', line: 'rm_ralts' }, act: 3 };

describe('Variant Resolver', () => {
  it('plays the neutral line when nothing passes', () => {
    expect(resolveVariant('neutral', [{ id: 'a', when: [{ kind: 'backstory', value: 'bs_other' }] }], ctx)).toBe('neutral');
    expect(resolveVariant('neutral', [], ctx)).toBe('neutral');
  });
  it('the highest total score wins, and a backstory input (15) beats a backstory (10)', () => {
    const variants = [
      { id: 'bs', when: [{ kind: 'backstory', value: 'bs_hisui' }] },
      { id: 'input', when: [{ kind: 'backstoryInput', key: 'prior_role', value: 'handler' }] },
      { id: 'act', when: [{ kind: 'act', op: '>=' as const, value: 3 }] },
    ];
    expect(resolveVariant('neutral', variants, ctx)).toBe('input');
  });
  it('every condition must pass; relationship, flag, trait, starter and line conditions all work', () => {
    const all = [
      { kind: 'relationship', character: 'ch_pell', key: 'trust', op: '>=' as const, value: 40 },
      { kind: 'flag', key: 'contract_stage', op: '>=' as const, value: 2 },
      { kind: 'trait', key: 'courage', op: '>=' as const, value: 65 },
      { kind: 'starter', value: 'timid' },
      { kind: 'starterLine', value: 'rm_ralts' },
    ];
    expect(resolveVariant('n', [{ id: 'all', when: all }], ctx)).toBe('all');
    expect(resolveVariant('n', [{ id: 'all', when: [...all, { kind: 'trait', key: 'courage', op: '>=' as const, value: 90 }] }], ctx)).toBe('n');
  });
  it('ties go to authoring order, and a missing value or unknown kind never passes', () => {
    const v = [{ id: 'first', when: [{ kind: 'act', value: 3 }] }, { id: 'second', when: [{ kind: 'act', value: 3 }] }];
    expect(resolveVariant('n', v, ctx)).toBe('first');
    expect(resolveVariant('n', [{ id: 'x', when: [{ kind: 'trait', key: 'nope', op: '>=' as const, value: 0 }] }], ctx)).toBe('n');
    expect(resolveVariant('n', [{ id: 'x', when: [{ kind: 'mystery', value: 1 }] }], ctx)).toBe('n');
  });
  it('is deterministic', () => {
    const v = [{ id: 'a', when: [{ kind: 'act', value: 3 }] }];
    expect(resolveVariant('n', v, ctx)).toBe(resolveVariant('n', v, ctx));
  });
});

describe('Module Validator', () => {
  const good = (): StoryData => {
    const d = structuredClone(content.storyData);
    const ev = (id: string) => ({ id, v: 1, tags: [], requires: [], roles: {}, beats: [], choices: [], outputs: [], variants: [], cost: 1, tier: 'A' as const, moment: 'none' as const });
    d.events = Array.from({ length: 11 }, (_, i) => ev(`ev_${i}`));
    d.remembrances = [RemembranceSchema.parse({ id: 'rm_a', v: 1, line: ['pidgey'], types: ['flying'], temperament: 't', affinity: {}, unlock: { kind: 'start' }, moves: [], keystone: 'k', status: 'supported' })];
    d.backstories = [BackstorySchema.parse({
      id: 'bs_a', nameKey: 'k', parity: [...PARITY_ITEMS], endings: ['e1', 'e2'], catchAllEnding: 'e2',
      events: Array.from({ length: 8 }, (_, i) => `ev_${i}`), echoEvents: ['ev_8', 'ev_9', 'ev_10'], encounterPools: ['pool'], remembranceUnlocks: ['rm_a'],
      endingGrid: [{ ending: 'e1', when: [{ kind: 'flag' }] }, { ending: 'e2', when: [] }],
    })];
    return d;
  };
  it('a complete module passes', () => expect(validateModule(good(), 'bs_a')).toEqual([]));
  it('fails on a missing ending row, a missing catch-all, unknown ids and short event lists', () => {
    const d = good();
    d.backstories[0]!.endingGrid = [{ ending: 'e1', when: [{ kind: 'flag' }] }];
    const p = validateModule(d, 'bs_a');
    expect(p.join('\n')).toMatch(/no catch-all/);
    expect(p.join('\n')).toMatch(/"e2" is in no grid row/);
    const d2 = good();
    d2.backstories[0]!.events = ['ev_0', 'missing'];
    d2.backstories[0]!.parity = [];
    const p2 = validateModule(d2, 'bs_a').join('\n');
    expect(p2).toMatch(/unknown event "missing"/);
    expect(p2).toMatch(/at least 8 events/);
    expect(p2).toMatch(/parity item missing: intro_scene/);
    expect(validateModule(good(), 'nope')).toEqual(['backstory "nope" does not exist']);
  });
});

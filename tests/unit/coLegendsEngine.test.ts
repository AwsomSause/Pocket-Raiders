// Catalog Overhaul Pack (legends): the shared engine pieces other categories build on.
// Calm fights (an Alpha is calmed with balms, not beaten), the Alpha Mark, Signs (Influence) and Tellings.
import { describe, expect, it } from 'vitest';
import { EventDefSchema, type Content } from '../../src/core/contentSchema';
import { chooseEvent, conditionMet } from '../../src/core/events';
import { chooseStarter, createRun, takeTurn } from '../../src/core/run';
import { maxHp } from '../../src/core/pokemon';
import { addCalm, likedMove, startCalm } from '../../src/core/battle/calm';
import { addSign, addTelling, ladderStep, legendFlag, presenceChance, signMatches, syncLegendFlags } from '../../src/core/legends/signs';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const alphaEvent = EventDefSchema.parse({
  id: 'test-alpha',
  name: 'A test Alpha',
  description: 'Red eyes in the grass.',
  group: 'story',
  intro: 'Red eyes in the grass.',
  rarity: 'rare',
  choices: [
    {
      label: 'Face it',
      success: {
        text: 'It turns on you.',
        effects: [],
        battle: {
          kind: 'wild',
          alpha: true,
          species: ['snorlax'],
          win: [{ kind: 'item', id: 'ultra-ball', count: 1 }],
          calm: [{ kind: 'join', species: ['snorlax'], alpha: true }],
          rule: { calmBar: { need: 3, likes: ['sound'] } },
        },
      },
    },
  ],
});
const withAlpha: Content = { ...content, events: new Map([...content.events, [alphaEvent.id, alphaEvent]]) };

function atAlpha(seed: string): RunState {
  const run = structuredClone(chooseStarter(withAlpha, createRun(withAlpha, { runId: 'al', seed, archetypeId: 'red' }), 0));
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'al', kind: 'event', used: false, eventId: alphaEvent.id } as never);
  run.inventory['calming-balm'] = 3;
  run.inventory['poke-ball'] = 5;
  // A sturdy lead so the Alpha does not end the test early.
  run.party[0]!.level = 80;
  run.party[0]!.hp = maxHp(withAlpha, run.party[0]!);
  return chooseEvent(withAlpha, run, 'al', 0).run;
}

describe('Calm fights (Alphas)', () => {
  it('the bar: balms add, it never passes full, and nothing adds once calmed', () => {
    const rule = { need: 3, start: 0, perTurn: 0, likes: ['sound' as const] };
    const calm = startCalm(rule, false);
    expect(calm).toEqual({ bar: 0, need: 3, balm: 1, done: false });
    expect(addCalm(calm, 1, 'The balm lands.')).toBe('The balm lands. Calm 1 of 3.');
    expect(addCalm(calm, 0, 'x')).toBeNull();
    addCalm(calm, 1, 'x');
    expect(addCalm(calm, 5, 'The balm lands.')).toMatch(/Calm bar is full/);
    expect(calm).toMatchObject({ bar: 3, done: true });
    expect(addCalm(calm, 1, 'x')).toBeNull();
    // The Warden sash: each balm is worth 1.2, so five balms fill a bar of 6.
    const sash = startCalm({ ...rule, need: 6 }, true);
    for (let i = 0; i < 4; i++) addCalm(sash, sash.balm, 'x');
    expect(sash.done).toBe(false);
    addCalm(sash, sash.balm, 'x');
    expect(sash.done).toBe(true);
    expect(likedMove(rule, 'growl', ['sound'])).toBe(true);
    expect(likedMove(rule, 'tackle', ['contact'])).toBe(false);
    expect(likedMove({ ...rule, likes: ['scent'] }, 'sweet-scent', [])).toBe(true);
    expect(likedMove(rule, null, ['sound'])).toBe(false);
  });

  it('an Alpha has double HP, breaks out of every ball, and three balms calm it: it joins with the Alpha Mark', () => {
    let run = atAlpha('calm-1');
    expect(run.phase).toBe('battle');
    expect(run.battle!.calm).toEqual({ bar: 0, need: 3, balm: 1, done: false });
    const foe = run.battle!.enemyTeam[0]!;
    expect(foe.alpha).toBe(true);
    const plain = maxHp(withAlpha, { ...foe, alpha: undefined, statBoosts: undefined } as never);
    expect(maxHp(withAlpha, foe)).toBeGreaterThanOrEqual(Math.floor(plain * 1.95));
    expect(() => takeTurn(withAlpha, run, { kind: 'item', itemId: 'poke-ball' })).toThrow(/Calm it first/);
    for (let i = 0; i < 3 && run.phase === 'battle'; i++) run = takeTurn(withAlpha, run, { kind: 'item', itemId: 'calming-balm' }).run;
    expect(run.phase).not.toBe('battle');
    expect(run.inventory['calming-balm'] ?? 0).toBe(0);
    expect(run.story.flags['ev:calmed-alpha']).toBe(1);
    // It joins like any gift Pokémon (the join decision is waiting), carrying the Alpha Mark: +10% HP for good.
    const offer = run.pending.find((p) => p.kind === 'caught') as { kind: 'caught'; mon: RunState['party'][number] } | undefined;
    expect(offer?.mon.speciesId).toBe('snorlax');
    expect(offer?.mon.alpha).toBe(true);
    expect(maxHp(withAlpha, offer!.mon)).toBeGreaterThan(maxHp(withAlpha, { ...offer!.mon, alpha: undefined } as never));
    // The win reward (an Ultra Ball) is not paid as well.
    expect(run.inventory['ultra-ball'] ?? 0).toBe(0);
  });

  it('partyAlpha reads a calmed Alpha in the party, or leading it', () => {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'pa', seed: 'pa', archetypeId: 'red' }), 0));
    const any = { kind: 'partyAlpha', lead: false } as never;
    const lead = { kind: 'partyAlpha', lead: true } as never;
    expect([conditionMet(content, run, any), conditionMet(content, run, lead)]).toEqual([false, false]);
    run.party.push({ ...structuredClone(run.party[0]!), uid: 'p-alpha', alpha: true });
    expect([conditionMet(content, run, any), conditionMet(content, run, lead)]).toEqual([true, false]);
    run.party[0]!.hp = 0; // a fainted lead hands the lead to the next Pokémon able to fight
    expect(conditionMet(content, run, lead)).toBe(true);
  });

  it('a balm does nothing outside a calm fight', () => {
    const run = atAlpha('calm-2');
    run.battle!.calm = undefined;
    expect(() => takeTurn(withAlpha, run, { kind: 'item', itemId: 'calming-balm' })).toThrow(/nothing here that needs calming/);
  });
});

describe('Signs and Tellings', () => {
  const blessed = (id: string): RunState => {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'sg', seed: 'sign', archetypeId: 'red' }), 0));
    run.expansion = { ...run.expansion, promises: true, blessing: { id, tier: 'common', influence: 0, seen: true, ashRegions: [], communion: false, riteUsed: false, stagesDone: [] } as never };
    return run;
  };

  it('a Sign counts only for the Legendary that blesses this run, Influence never falls, and each ladder step is told once', () => {
    const run = blessed('ho-oh');
    expect(signMatches('own', 'ho-oh') && signMatches('bird', 'ho-oh') && signMatches('fire', 'ho-oh') && signMatches('ho-oh', 'ho-oh')).toBe(true);
    expect(signMatches('beast', 'ho-oh') || signMatches('lugia', 'ho-oh')).toBe(false);
    expect(addSign(run, 'lugia', 2)).toEqual([]);
    expect(run.expansion!.blessing!.influence).toBe(0);
    expect(addSign(run, 'bird', 2)).toEqual([]);
    const lines = addSign(run, 'own', 1);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/Echoes/);
    expect(addSign(run, 'own', -3)).toEqual([]);
    expect(run.expansion!.blessing!.influence).toBe(3);
    expect(addSign(run, 'ho-oh', 6).map((l) => l.split(': ')[1]!.split(':')[0])).toEqual(['The Trial', 'Recognition', 'The Presence']);
    expect(ladderStep(0)).toBe('signs');
    expect([3, 5, 7, 9, 20].map(ladderStep)).toEqual(['echoes', 'trial', 'recognition', 'presence', 'presence']);
    expect([0, 3, 5, 7, 9].map(presenceChance)).toEqual([0.04, 0.12, 0.25, 0.45, 0.65]);
  });

  it('the flag effect is the door: sign-* and telling-* set through an event reach the blessing and the Promise', () => {
    const run = blessed('ho-oh');
    expect(legendFlag(run, 'sign-fire', 3).length).toBe(1);
    expect(legendFlag(run, 'some-other-flag', 1)).toEqual([]);
    expect(run.story.flags['ev:blessing-influence']).toBe(3);
    expect(run.story.flags['ev:blessing-ho-oh']).toBe(1);
    expect(run.story.flags['ev:blessing-bird']).toBe(1);
    expect(run.story.flags['ev:blessing-beast']).toBeUndefined();
    // Ho-Oh travels with the birds; Dialga (creation is not a travelling group) is solitary.
    expect([run.story.flags['ev:blessing-company'], run.story.flags['ev:blessing-solitary']]).toEqual([1, undefined]);
    const alone = blessed('dialga');
    syncLegendFlags(alone);
    expect([alone.story.flags['ev:blessing-company'], alone.story.flags['ev:blessing-solitary']]).toEqual([undefined, 1]);
    expect(conditionMet(content, run, { kind: 'flag', key: 'blessing-influence', atLeast: 3, atMost: 99 } as never)).toBe(true);
    expect(addTelling(run, 'zarude', 2)).toBeNull();
    expect(addTelling(run, 'zarude', 1)).toMatch(/believe/);
    expect(run.expansion!.promise!.tellings.zarude).toBe(3);
    expect(addTelling(run, 'not-a-mythical', 1)).toBeNull();
  });

  it('with Blessings and Promises off nothing changes and nothing throws', () => {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'sg', seed: 'off', archetypeId: 'red' }), 0));
    run.expansion = { ...run.expansion, blessing: undefined, promises: undefined, promise: undefined } as never;
    expect(legendFlag(run, 'sign-own', 5)).toEqual([]);
    expect(legendFlag(run, 'telling-zarude', 1)).toEqual([]);
    syncLegendFlags(run);
    expect(Object.keys(run.story.flags).filter((k) => k.startsWith('ev:blessing-') || k.startsWith('ev:guest-'))).toEqual([]);
  });
});

// Run events G (training, growth and mastery): every choice of every event in eventsTraining.json plays out.
import { describe, expect, it } from 'vitest';
import { chooseEvent } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import eventsTraining from '../../src/data/eventsTraining.json';
import { content } from './helpers';

const ids = (eventsTraining as { events: { id: string; choices: unknown[] }[] }).events;

describe('training events', () => {
  it('are loaded into the content', () => {
    for (const e of ids) expect(content.events.has(e.id)).toBe(true);
  });
  for (const e of ids) {
    it(`${e.id}: every choice resolves`, () => {
      for (let i = 0; i < e.choices.length; i++) {
        const run = chooseStarter(content, createRun(content, { runId: 'r', seed: `tr-${e.id}`, archetypeId: 'red' }), 0);
        run.money = 5000;
        const node = run.stage!.map.nodes[0]!;
        run.stage!.current = node.id;
        run.stage!.visited = [node.id];
        node.sides.push({ id: 'test-event', kind: 'event', used: false, eventId: e.id });
        const choice = content.events.get(e.id)!.choices[i]!;
        const locked = choice.requires.length > 0;
        if (locked) continue; // locked by a requirement this run may not meet
        expect(() => chooseEvent(content, run, 'test-event', i)).not.toThrow();
      }
    });
  }
});

describe('train effect', () => {
  it('changes the lead as the events promise', async () => {
    const { applyEffect } = await import('../../src/core/events');
    const { Rng, hashSeed } = await import('../../src/core/rng');
    const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'train', archetypeId: 'red' }), 0);
    const lead = run.party[0]!;
    const rng = new Rng(hashSeed('t'));
    const before = lead.nature;
    applyEffect(content, run, { kind: 'train', what: 'natureReroll' }, rng);
    expect(lead.nature).not.toBe(before);
    applyEffect(content, run, { kind: 'train', what: 'natureNudge', stat: 'spe' }, rng);
    expect(lead.nature).toBeDefined();
    const total = () => Object.values(lead.vitamins).reduce((a, b) => a + (b ?? 0), 0);
    const v = total();
    applyEffect(content, run, { kind: 'train', what: 'weakestStat' }, rng);
    expect(total()).toBe(v + 1);
    const moves = lead.moves.map((m) => m.id).join();
    applyEffect(content, run, { kind: 'train', what: 'learnMove' }, rng);
    expect(lead.moves.map((m) => m.id).join()).not.toBe(moves);
  });
});

describe('batch 3', () => {
  it('Machine Parts are counted and spent, and accuracy perks multiply', async () => {
    const { chooseEvent, eventView } = await import('../../src/core/events');
    const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'tm', archetypeId: 'red' }), 0);
    const node = run.stage!.map.nodes[0]!;
    run.stage!.current = node.id;
    run.stage!.visited = [node.id];
    node.sides.push({ id: 'test-event', kind: 'event', used: false, eventId: 'tm-workshop' });
    run.inventory['machine-part'] = 2;
    expect(eventView(content, run, 'test-event').choices[0]!.locked).toBeTruthy();
    run.inventory['machine-part'] = 3;
    const after = chooseEvent(content, run, 'test-event', 0).run;
    expect(after.inventory['machine-part']).toBeUndefined();
    const { accuracyPerk } = await import('../../src/core/trainerPerks');
    expect(accuracyPerk([{ kind: 'accuracyMultiplier', value: 1.2 }, { kind: 'accuracyMultiplier', value: 1.5 }])).toBeCloseTo(1.8);
  });
});

describe('mutator offer late in a run', () => {
  it('still offers a blessing and a curse when every blessing was already taken', async () => {
    const { MUTATORS, mutatorOffer } = await import('../../src/core/mutators');
    const taken = MUTATORS.mutators.filter((m) => m.kind === 'blessing').map((m) => m.id);
    const offer = mutatorOffer({ seed: 'late', mutators: taken }, 5);
    expect(offer.length).toBe(MUTATORS.choices);
  });
});

describe('batch 4: hints, naps, shadows and shards', () => {
  const setup = (eventId: string) => {
    const run = chooseStarter(content, createRun(content, { runId: 'r', seed: `b4-${eventId}`, archetypeId: 'red' }), 0);
    const node = run.stage!.map.nodes[0]!;
    run.stage!.current = node.id;
    run.stage!.visited = [node.id];
    node.sides.push({ id: 'test-event', kind: 'event', used: false, eventId });
    return run;
  };

  it('every new event is loaded and each unlocked choice resolves', async () => {
    const { chooseEvent } = await import('../../src/core/events');
    for (const id of ['evolution-tutor', 'nap-pod-corner', 'shadow-boxing', 'mastery-quiz', 'graduation-ceremony']) {
      const def = content.events.get(id)!;
      expect(def, id).toBeDefined();
      for (let i = 0; i < def.choices.length; i++) expect(() => chooseEvent(content, setup(id), 'test-event', i), `${id}/${i}`).not.toThrow();
    }
  });

  it('Shadow Boxing starts a one-Pokémon fight against a copy of the lead', async () => {
    const { chooseEvent } = await import('../../src/core/events');
    const run = setup('shadow-boxing');
    const after = chooseEvent(content, run, 'test-event', 0).run;
    expect(after.phase).toBe('battle');
    expect(after.battle!.enemyTeam).toHaveLength(1);
    expect(after.battle!.enemyTeam[0]!.speciesId).toBe(run.party[0]!.speciesId);
  });

  it('a Mastery Shard becomes battles toward the species goals when the run ends', async () => {
    const { applyEffect } = await import('../../src/core/events');
    const { Rng, hashSeed } = await import('../../src/core/rng');
    const { recordMastery } = await import('../../src/core/mastery');
    const { createProfile } = await import('../../src/core/profile');
    const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'shard', archetypeId: 'red' }), 0);
    const id = run.party[0]!.speciesId;
    applyEffect(content, run, { kind: 'train', what: 'masteryShard' }, new Rng(hashSeed('s')));
    applyEffect(content, run, { kind: 'train', what: 'masteryShard' }, new Rng(hashSeed('s')));
    const profile = createProfile(content, 'p');
    recordMastery(content, profile, run, '2026-11-05T00:00:00Z');
    expect(profile.mastery[id]!.battles).toBeGreaterThanOrEqual(2 * content.balance.mastery.shardBattles);
  });

  it('the evolution hint names the way, and a nap skips exactly one wild stop', async () => {
    const { applyEffect } = await import('../../src/core/events');
    const { Rng, hashSeed } = await import('../../src/core/rng');
    const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'hint', archetypeId: 'red' }), 0);
    const lead = run.party[0]!;
    const sp = content.species.get(lead.speciesId)!;
    const line = applyEffect(content, run, { kind: 'train', what: 'evolutionHint' }, new Rng(hashSeed('h')));
    if (sp.evolutions.length > 0) expect(line).toContain(content.species.get(sp.evolutions[0]!.to)!.name);
    applyEffect(content, run, { kind: 'train', what: 'nap' }, new Rng(hashSeed('h')));
    expect(run.itemCounters!['nap']).toBe(1);
  });
});

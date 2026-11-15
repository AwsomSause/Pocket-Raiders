// Greenneedle part 5: gn.21 The Pokémon That Wouldn't Evolve (tools/events/co/greenneedle-5.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { eligibleEvents } from '../../src/core/events';
import { castOf } from '../../src/core/greenneedle';
import { blocksEvolution, heldStatMultiplier } from '../../src/core/battle/held';
import { choose, flagOf, gnRun, lose, open, scene, setFlag, win } from './helpers/gnPlay';

const cast = (run: RunState, species: string): void => setFlag(run, `cast-wontevolve:${species}`, 1);
/** A run with a strong lead and a small one that can still evolve. */
const withTeam = (seed: string): RunState => {
  const run = gnRun(seed);
  run.party.push(createPokemon(content, 'snorlax', run.party[0]!.level + 5, 'p-big'));
  run.party.push(createPokemon(content, 'pichu', run.party[0]!.level, 'p-small'));
  return run;
};
const toBeat3 = (seed: string, side: number, fought: number): RunState => {
  const run = withTeam(seed);
  cast(run, 'pikachu');
  for (const k of ['wontevolve-1', 'wontevolve-2']) setFlag(run, k);
  setFlag(run, 'wontevolve-side', side);
  setFlag(run, 'wontevolve-fought', fought);
  setFlag(run, 'wontevolve-at', run.regionIndex + 1);
  open(run, 'gn-21-stone');
  return run;
};

describe("gn.21 The Pokémon That Wouldn't Evolve", () => {
  it('three must-see beats: S2 step 6, S5 step 11, S8 step 17; a later beat only after the one before, in the same region', () => {
    expect(content.coPlacement!.get('gn-21-road')).toMatchObject({ shape: 'region', beat: 1, stages: [2], home: 6, window: [4, 9], sits: 'must-see', attaches: 'after', earliest: 3 });
    expect(content.coPlacement!.get('gn-21-back')).toMatchObject({ beat: 2, stages: [5], home: 11, window: [9, 14], sits: 'must-see' });
    expect(content.coPlacement!.get('gn-21-stone')).toMatchObject({ beat: 3, stages: [8], home: 17, window: [15, 19], sits: 'must-see', attaches: 'before' });
    const run = gnRun('t21-gate');
    const held = (id: string) => content.events.get(id)!.requires;
    expect(held('gn-21-back').length).toBeGreaterThan(1);
    // Not earned yet: beat 2 is never eligible before beat 1.
    expect(eligibleEvents(content, run).map((e) => e.id)).not.toContain('gn-21-back');
    expect(eligibleEvents(content, run).map((e) => e.id)).not.toContain('gn-21-stone');
  });

  it('beat 1: the story Pokémon is rolled once from the doc list (or the region\'s own); the three choices remember the side taken', () => {
    const seen = new Set<string>();
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
      const run = withTeam(`t21-cast-${seed}`);
      open(run, 'gn-21-road');
      expect(scene(run, 'gn-21-road').labels).toEqual(["Your trainer's right. Take it.", "It doesn't want to. Leave it be.", '…']);
      const after = choose(run, 'gn-21-road', '…').run;
      const sp = castOf(after, 'wontevolve');
      expect(sp).toBeTruthy();
      expect(content.species.get(sp!)!.evolutions.length).toBeGreaterThan(0);
      seen.add(sp!);
      expect(flagOf(after, 'wontevolve-side')).toBe(3);
      expect(flagOf(after, 'wontevolve-1')).toBe(1);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('defended: it challenges your strongest Pokémon alone; it loses narrowly, leaving yours under a third; the team comes back', () => {
    const run = withTeam('t21-duel');
    const size = run.party.length;
    open(run, 'gn-21-road');
    const challenged = choose(run, 'gn-21-road', "It doesn't want to. Leave it be.").run;
    expect(flagOf(challenged, 'wontevolve-side')).toBe(2);
    const fighting = choose(challenged, 'gn-21-challenge', 'Accept.').run;
    expect(fighting.party.map((m) => m.uid)).toEqual(['p-big']);
    expect(fighting.battle!.enemyTeam[0]!.speciesId).toBe(castOf(fighting, 'wontevolve'));
    const done = win(fighting);
    expect(done.party.length).toBe(size);
    const big = done.party.find((m) => m.uid === 'p-big')!;
    expect(big.hp).toBeLessThanOrEqual(Math.floor(maxHp(content, big) * 0.3));
    expect(flagOf(done, 'wontevolve-fought')).toBe(1);
    expect(scene(done, 'gn-21-bow').labels).toEqual(['Walk on.']);
  });

  it('a lost challenge ends no run: it wins, the team comes back, and it still counts as a fight', () => {
    const run = withTeam('t21-duel-lost');
    open(run, 'gn-21-road');
    const fighting = choose(choose(run, 'gn-21-road', "It doesn't want to. Leave it be.").run, 'gn-21-challenge', 'Accept.').run;
    const done = lose(fighting);
    expect(done.phase).toBe('map');
    expect(done.party.length).toBe(run.party.length);
    expect(flagOf(done, 'wontevolve-fought')).toBe(1);
  });

  it('beat 2: "Incredible" is Bond +1 for the lead; "On me" is a second fight; the Eevee that never chose sits with it', () => {
    const run = withTeam('t21-back');
    cast(run, 'eevee');
    setFlag(run, 'wontevolve-1');
    setFlag(run, 'wontevolve-at', run.regionIndex + 1);
    setFlag(run, 'eevee-stayed');
    open(run, 'gn-21-back');
    expect(scene(run, 'gn-21-back').intro).toContain('old friends');
    expect(scene(run, 'gn-21-back').labels).toEqual(["That's incredible.", "Does Linus know you're out here?", 'Show me again, on me.']);
    const before = run.party[0]!.friendship;
    expect(choose(run, 'gn-21-back', "That's incredible.").run.party[0]!.friendship).toBeGreaterThan(before);
    setFlag(run, 'wontevolve-fought', 1);
    const again = choose(choose(run, 'gn-21-back', 'Show me again, on me.').run, 'gn-21-again', 'Go.').run;
    expect(again.battle!.enemyStages.spe).toBe(2);
    const done = lose(again);
    expect(flagOf(done, 'wontevolve-fought')).toBe(2);
    expect(scene(done, 'gn-21-again-won').intro).toContain('as surprised as anyone');
  });

  it('beat 2 is gated to the region of beat 1', () => {
    const run = gnRun('t21-region');
    setFlag(run, 'wontevolve-1');
    setFlag(run, 'wontevolve-at', run.regionIndex + 2);
    const req = content.events.get('gn-21-back')!.requires;
    expect(req.some((c) => (c as { test?: string }).test === 'thisRegion')).toBe(true);
  });

  it('ending 1: defended, fought twice, stepped in: it joins with Unwavering and Proof', () => {
    const run = toBeat3('t21-e1', 2, 2);
    const step = choose(run, 'gn-21-stone', 'Step in.').run;
    expect(scene(step, 'gn-21-step').labels).toEqual(['Stand beside it.', 'Battle Linus.', 'Step back.']);
    const out = choose(step, 'gn-21-step', 'Stand beside it.');
    const mon = out.run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))[0] ?? out.run.party.find((m) => m.fixedAbility === 'unwavering');
    expect(mon?.speciesId).toBe('pikachu');
    expect(mon?.fixedAbility).toBe('unwavering');
    expect(mon?.moves.map((m) => m.id)).toContain('proof');
    expect(flagOf(out.run, 'wontevolve-end')).toBe(1);
  });

  it('ending 5: defended but fought once, battle Linus: it walks away from Linus and joins; Linus misses the Final Reunion', () => {
    const run = toBeat3('t21-e5', 2, 1);
    const step = choose(run, 'gn-21-stone', 'Step in.').run;
    expect(scene(step, 'gn-21-step').labels).toEqual(['Battle Linus.', 'Step back.']);
    const fought = win(choose(step, 'gn-21-step', 'Battle Linus.').run);
    const out = choose(fought, 'gn-21-walks', 'Take it with you.');
    expect(flagOf(out.run, 'wontevolve-end')).toBe(5);
    expect(flagOf(out.run, 'wontevolve-linus-gone')).toBe(1);
    expect(JSON.stringify(out.run.pending) + JSON.stringify(out.run.party)).toContain('unwavering');
  });

  it('ending 4: sided with the trainer: a wild Pokémon attacks Linus, it evolves by its own hand, and Linus gives a rare item', () => {
    const run = toBeat3('t21-e4', 1, 0);
    const crisis = win(choose(choose(run, 'gn-21-stone', 'Let them work it out.').run, 'gn-21-crisis', 'Get between them.').run);
    const items = Object.values(crisis.inventory).reduce((a, b) => a + b, 0);
    const out = choose(crisis, 'gn-21-crisis-2', "You're welcome.");
    expect(flagOf(out.run, 'wontevolve-end')).toBe(4);
    expect(Object.values(out.run.inventory).reduce((a, b) => a + b, 0) + out.run.party.filter((m) => m.held && Object.keys(m.held).length).length).toBeGreaterThan(items);
  });

  it('ending 2: "Who was the other one?": Linus keeps it, and one of your unevolved Pokémon learns Proof', () => {
    const run = toBeat3('t21-e2', 3, 0);
    const out = choose(run, 'gn-21-stone', 'Linus. Who was the other one?');
    expect(out.text).toContain('Fearow');
    const learned = out.run.party.filter((m) => m.moves.some((x) => x.id === 'proof'));
    expect(learned.length).toBe(1);
    expect(content.species.get(learned[0]!.speciesId)!.evolutions.length).toBeGreaterThan(0);
    expect(out.run.party.find((m) => m.uid === 'p-big')!.moves.map((m) => m.id)).not.toContain('proof');
    expect(flagOf(out.run, 'wontevolve-end')).toBe(2);
  });

  it('ending 3: said nothing and let them work it out: a letter comes a later stage with a stone of the same kind', () => {
    const run = toBeat3('t21-e3', 3, 0);
    const waited = choose(choose(run, 'gn-21-stone', 'Let them work it out.').run, 'gn-21-wait', 'Leave them to it.').run;
    expect(flagOf(waited, 'wontevolve-end')).toBe(3);
    expect(content.events.get('gn-21-letter')!.callback).toBe(true);
    setFlag(waited, 'wontevolve-end-at', 0);
    open(waited, 'gn-21-letter');
    const letter = choose(waited, 'gn-21-letter', 'Keep the drawing.').run;
    expect(letter.inventory['thunder-stone']).toBe(1);
  });

  it('Proof takes its user\'s first type and hits a fully evolved target 20% harder; Unwavering is +25% while unevolved, never evolves, and does not stack with Eviolite', () => {
    const proof = content.moves.get('proof')!;
    expect(proof).toMatchObject({ power: 80, effects: { proof: true } });
    const pichu = createPokemon(content, 'pichu', 20, 'u1');
    pichu.fixedAbility = 'unwavering';
    const ctx = { content, teamItems: [], perks: [] } as unknown as Parameters<typeof heldStatMultiplier>[0];
    expect(heldStatMultiplier(ctx, pichu, 'enemy', 'atk')).toBeCloseTo(1.25);
    expect(blocksEvolution(content, pichu)).toBe(true);
    pichu.held = { eviolite: 1 } as never;
    expect(heldStatMultiplier(ctx, pichu, 'enemy', 'def')).toBeCloseTo(1.5);
    expect(heldStatMultiplier(ctx, pichu, 'enemy', 'atk')).toBeCloseTo(1.25);
    const raichu = createPokemon(content, 'raichu', 20, 'u2');
    raichu.fixedAbility = 'unwavering';
    expect(heldStatMultiplier(ctx, raichu, 'enemy', 'atk')).toBeCloseTo(1);
  });
});

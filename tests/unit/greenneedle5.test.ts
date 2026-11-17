// Greenneedle part 5: gn.21 to gn.25 (tools/events/co/greenneedle-5.ts).
import { NATURE_IDS } from '../../src/core/natures';
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { conditionMet, eligibleEvents } from '../../src/core/events';
import { createBattle, resolveTurn, type BattleContext, type BattleEvent } from '../../src/core/battle/engine';
import { hashSeed, Rng } from '../../src/core/rng';
import type { PokemonInstance } from '../../src/core/state';
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

describe('gn.22 The Lonely Cubone', () => {
  const guest = (run: RunState) => run.party.find((m) => m.gn?.includes('cubone-guest'));
  const toTree = (seed: string): RunState => {
    const run = gnRun(seed);
    open(run, 'gn-22-door');
    return choose(run, 'gn-22-door', 'Leave something at its feet.').run;
  };
  const toStream = (seed: string): RunState => choose(toTree(seed), 'gn-22-tree', 'Help it look.').run;

  it('a door on step 9 (window 7 to 12), forest or eerie, instead of the battle; the badge is its own', () => {
    expect(content.coPlacement!.get('gn-22-door')).toMatchObject({ shape: 'door', home: 9, window: [7, 12], sits: 'optional', attaches: 'instead', tags: ['forest|eerie'], earliest: 4, badge: 'own' });
    expect(content.events.get('gn-22-door')!.choices.map((c) => c.label)).toEqual(['Approach it.', 'Leave something at its feet.', 'Walk away.']);
  });

  it('approach: it runs to the next tree and can be tried once more; a second approach and it is gone', () => {
    const run = gnRun('t22-approach');
    open(run, 'gn-22-door');
    const behind = choose(run, 'gn-22-door', 'Approach it.').run;
    expect(scene(behind, 'gn-22-behind').labels).toEqual(['Approach it.', 'Leave something at its feet.', 'Walk away.']);
    expect(flagOf(choose(behind, 'gn-22-behind', 'Approach it.').run, 'cubone-gone')).toBe(1);
    expect(flagOf(choose(behind, 'gn-22-behind', 'Leave something at its feet.').run, 'cubone-trusted')).toBe(1);
  });

  it('walk away: it is there again a later stage (once), and walking away again means it is gone', () => {
    const run = gnRun('t22-walk');
    open(run, 'gn-22-door');
    const walked = choose(run, 'gn-22-door', 'Walk away.').run;
    expect(flagOf(walked, 'cubone-walked')).toBe(1);
    expect(content.events.get('gn-22-again')!.callback).toBe(true);
    setFlag(walked, 'cubone-walked-at', 0);
    open(walked, 'gn-22-again');
    expect(flagOf(choose(walked, 'gn-22-again', 'Walk away.').run, 'cubone-gone')).toBe(1);
    expect(flagOf(choose(walked, 'gn-22-again', 'Leave something at its feet.').run, 'cubone-trusted')).toBe(1);
  });

  it('it walks with you as a guest, a seventh if the party is full, one stage below the event level', () => {
    const run = toTree('t22-guest');
    while (run.party.length < 6) run.party.push(createPokemon(content, 'rattata', run.party[0]!.level, `p-${run.party.length}`));
    const stream = choose(run, 'gn-22-tree', 'Help it look.').run;
    expect(stream.party.length).toBe(7);
    expect(guest(stream)?.speciesId).toBe('cubone');
  });

  it('the stream: two wild fights, then it draws; drawing back settles it', () => {
    let run = win(choose(toStream('t22-stream'), 'gn-22-stream', 'Wade in.').run);
    run = win(choose(run, 'gn-22-stream-2', 'Go on.').run);
    expect(scene(run, 'gn-22-stream-rest').labels).toEqual(['Draw something back.', 'Just watch.', 'Sit closer.']);
    const drawn = choose(run, 'gn-22-stream-rest', 'Draw something back.').run;
    expect(flagOf(drawn, 'cubone-settled')).toBe(1);
    expect(scene(drawn, 'gn-22-hollow').labels).toEqual(['Draw something back.', 'Just watch.', 'Sit closer.']);
  });

  it('if it faints the stage ends: it runs, the guest leaves; next region it can be found once more and needs two Berries', () => {
    const run = toStream('t22-faint');
    guest(run)!.hp = 0;
    const done = win(choose(run, 'gn-22-stream', 'Wade in.').run);
    const out = choose(done, 'gn-22-ran', 'Let it go.').run;
    expect(guest(out)).toBeUndefined();
    expect(out.party.some((m) => m.speciesId === 'cubone')).toBe(false);
    expect(flagOf(out, 'cubone-fainted')).toBe(1);
    setFlag(out, 'cubone-ran-at', out.regionIndex);
    open(out, 'gn-22-wary');
    const once = choose(out, 'gn-22-wary', 'Leave something at its feet.').run;
    expect(flagOf(once, 'cubone-trusted')).toBe(1); // trusted from the first time; the second Berry is what brings it back
    const twice = choose(once, 'gn-22-wary-2', 'Leave another.').run;
    expect(flagOf(twice, 'cubone-fainted')).toBe(0);
    expect(scene(twice, 'gn-22-tree').labels).toEqual(['Help it look.']);
  });

  it('the birds: two Vullaby in a double battle, aiming at the Cubone, which is on the field; then a Mandibuzz and a Vullaby', () => {
    const run = toStream('t22-birds');
    open(run, 'gn-22-hill');
    const fight1 = choose(run, 'gn-22-hill', 'Stand with it.').run;
    expect(fight1.battle!.enemyTeam.map((m) => m.speciesId)).toEqual(['vullaby', 'vullaby']);
    expect(fight1.battle!.eventRule).toMatchObject({ aimMark: 'cubone-guest', leadMark: 'cubone-guest' });
    expect(fight1.party[fight1.battle!.activeIndex]!.speciesId).toBe('cubone');
    const wave2 = choose(win(fight1), 'gn-22-wave2', 'Hold the line.').run;
    expect(wave2.battle!.enemyTeam.map((m) => m.speciesId)).toEqual(['mandibuzz', 'vullaby']);
  });

  it('the grave: sitting with it is the best ending; it may join with Inherited Strength at Bond 2, or with the Thick Club', () => {
    const run = toStream('t22-grave');
    open(run, 'gn-22-grave');
    const sat = choose(run, 'gn-22-grave', '(Sit down beside it, and say nothing.)').run;
    expect(scene(sat, 'gn-22-join').labels).toEqual(['Give it the Thick Club.', 'Come with me?', 'Stay here, if you like.']);
    const joined = choose(sat, 'gn-22-join', 'Come with me?').run;
    const mon = joined.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))[0]!;
    expect(mon).toMatchObject({ speciesId: 'cubone', fixedAbility: 'inherited-strength' });
    expect(mon.gn).toContain('cubone-friend');
    expect(mon.friendship).toBeGreaterThanOrEqual(100);
    expect(guest(joined)).toBeUndefined();
    sat.inventory['thick-club'] = 1;
    const club = choose(sat, 'gn-22-join', 'Give it the Thick Club.').run;
    expect(club.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))[0]!.held).toEqual({ 'thick-club': 1 });
    expect(club.inventory['thick-club'] ?? 0).toBe(0);
    const told = choose(choose(run, 'gn-22-grave', "I don't know.").run, 'gn-22-join', 'Come with me?').run;
    expect(told.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))[0]!.friendship).toBeLessThan(mon.friendship);
  });

  it('Inherited Strength is a supported ability', () => {
    expect(content.abilities.get('inherited-strength')?.name).toBe('Inherited Strength');
  });
});

describe('gn.23 The Magikarp That Could', () => {
  const at = (seed: string, n: number, setup: (run: RunState) => void = () => {}): RunState => {
    const run = gnRun(seed);
    for (let i = 1; i < n; i++) setFlag(run, `karp-${i}`);
    setFlag(run, 'karp-at', run.regionIndex + 1);
    setup(run);
    open(run, n === 6 ? 'gn-23-falls' : `gn-23-a${n}`);
    return run;
  };
  const caught = (run: RunState) => run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []));

  it('six must-see beats after a battle (S1-2, S3, S4-5, S6, S7, S8), the salesman an optional start on S1; each beat waits for the one before', () => {
    expect(content.coPlacement!.get('gn-23-salesman')).toMatchObject({ sits: 'optional', stages: [1], home: 4, window: [2, 6] });
    expect(content.coPlacement!.get('gn-23-a1')).toMatchObject({ beat: 1, stages: [1, 2], home: 8, sits: 'must-see', attaches: 'after' });
    expect(content.coPlacement!.get('gn-23-a3')).toMatchObject({ beat: 3, stages: [4, 5], home: 12 });
    expect(content.coPlacement!.get('gn-23-a5')).toMatchObject({ beat: 5, stages: [7], home: 16, window: [14, 18] });
    expect(content.coPlacement!.get('gn-23-falls')).toMatchObject({ beat: 6, stages: [8], home: 18, window: [16, 19] });
    expect(eligibleEvents(content, gnRun('t23-gate')).map((e) => e.id)).not.toContain('gn-23-a2');
  });

  it('each appearance: encourage, give, race (a timing game; win or lose it counts) or walk on', () => {
    const run = at('t23-a1', 1);
    expect(scene(run, 'gn-23-a1').labels).toEqual(['Go on! You can do it!', 'Give it something.', 'Race it up the bank.', 'Walk on.']);
    expect(flagOf(choose(run, 'gn-23-a1', 'Go on! You can do it!').run, 'karp-encouraged')).toBe(1);
    const raced = choose(run, 'gn-23-a1', 'Race it up the bank.').run;
    expect([flagOf(raced, 'karp-encouraged'), flagOf(raced, 'karp-raced'), flagOf(raced, 'karp-at')]).toEqual([1, 1, raced.regionIndex + 1]);
    expect(flagOf(choose(run, 'gn-23-a1', 'Walk on.').run, 'karp-ignored')).toBe(1);
    expect(content.events.get('gn-23-a1')!.choices[2]!.prompt).toEqual({ id: 'bank-race', needs: 'ok' });
  });

  it('give it something: a held Berry is eaten; a held item is lent for the region and comes back at the falls', () => {
    const run = at('t23-give', 1);
    run.party[0]!.held = { 'oran-berry': 1, 'charcoal': 1 } as never;
    const give = choose(run, 'gn-23-a1', 'Give it something.').run;
    expect(scene(give, 'gn-23-give').labels).toEqual(['A Berry.', 'Something to carry.', 'Nothing after all.']);
    const ate = choose(give, 'gn-23-give', 'A Berry.').run;
    expect(ate.party[0]!.held?.['oran-berry'] ?? 0).toBe(0);
    const lent = choose(give, 'gn-23-give', 'Something to carry.').run;
    expect(lent.party[0]!.held?.['charcoal'] ?? 0).toBe(0);
    expect(flagOf(lent, 'karp-encouraged')).toBe(1);
    for (let i = 1; i <= 5; i++) setFlag(lent, `karp-${i}`);
    open(lent, 'gn-23-falls');
    const back = choose(lent, 'gn-23-falls', 'Watch.').run;
    expect(JSON.stringify(back.party.map((m) => m.held)) + JSON.stringify(back.inventory)).toContain('charcoal');
  });

  it('the falls, encouraged three times: it evolves in a cutscene and can be recruited with Impossible Leap; raced three times, Speed +1 for good', () => {
    const run = at('t23-rise', 6, (r) => { setFlag(r, 'karp-encouraged', 3); setFlag(r, 'karp-raced', 3); });
    const rise = choose(choose(run, 'gn-23-falls', 'Watch.').run, 'gn-23-rise', 'Hold out your hand.');
    const mon = caught(rise.run)[0]!;
    expect(mon).toMatchObject({ speciesId: 'gyarados', fixedAbility: 'impossible-leap' });
    expect(JSON.stringify(mon)).toMatch(/spe/);
    expect(flagOf(rise.run, 'karp-end')).toBe(1);
  });

  it('somewhere between: it is a Magikarp at the top, waiting to see if you come', () => {
    const run = at('t23-top', 6, (r) => setFlag(r, 'karp-encouraged', 2));
    const top = choose(run, 'gn-23-falls', 'Watch.').run;
    expect(scene(top, 'gn-23-top').labels).toEqual(['Climb up to it.', 'Wave.']);
    expect(caught(choose(top, 'gn-23-top', 'Climb up to it.').run)[0]!.speciesId).toBe('magikarp');
  });

  it('ignored every time: half the time it evolves hostile and can be fought at A+2 and caught; half the time it is still jumping', () => {
    const ends = new Set<string>();
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
      const out = choose(at(`t23-ign-${seed}`, 6), 'gn-23-falls', 'Watch.').run;
      const open1 = out.stage!.map.nodes.find((n) => n.id === out.stage!.current)!.sides.filter((x) => !x.used && x.eventId?.startsWith('gn-23-')).map((x) => x.eventId);
      ends.add(open1.join());
      if (open1.includes('gn-23-hostile')) {
        const fight = choose(out, 'gn-23-hostile', 'Challenge it.').run;
        expect(fight.battle!.enemyTeam[0]!.speciesId).toBe('gyarados');
      }
    }
    expect([...ends].sort()).toEqual(['gn-23-hostile', 'gn-23-still']);
  });

  it('the salesman\'s Magikarp: bought honestly (Bounce, level 10, Bond 2, Mystic Water); at the falls it evolves in your own team', () => {
    const run = gnRun('t23-buy');
    run.money = 1000;
    open(run, 'gn-23-salesman');
    expect(scene(run, 'gn-23-salesman').labels).toEqual(['Buy it (₽500).', 'Offer ₽200.', 'No.']);
    const bought = choose(run, 'gn-23-salesman', 'Buy it (₽500).').run;
    const fish = caught(bought)[0]!;
    expect(fish).toMatchObject({ speciesId: 'magikarp', level: 10 });
    expect(fish.moves.map((m) => m.id)).toContain('bounce');
    expect(fish.gn).toContain('karp-notch');
    expect(bought.money).toBe(500);
    const falls = at('t23-own', 6);
    falls.party.push(fish);
    setFlag(falls, 'karp-bought');
    const party = choose(choose(falls, 'gn-23-falls', 'Watch.').run, 'gn-23-party', 'Welcome it back.').run;
    expect(party.party.find((m) => m.uid === fish.uid)).toMatchObject({ speciesId: 'gyarados', fixedAbility: 'impossible-leap' });
    expect(flagOf(party, 'karp-end')).toBe(4);
  });

  it('in Kanto the canon Magikarp Salesman is this scene', () => {
    expect(content.events.get('cs-kanto-pewter-magikarp')!.choices.map((c) => c.label)).toEqual(['Buy it (₽500).', 'Offer ₽200.', 'No.']);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
const PET_NAMES = ['Dumpling', 'Biscuit', 'Pickle', 'Button', 'Pebble', 'Sprout', 'Mochi', 'Waffles', 'Bramble', 'Nugget', 'Toffee', 'Puddle', 'Crumpet', 'Bean', 'Muffin', 'Pip'];
/** A run with a wild-caught Pokémon (not the starter) at this friendship. */
const withPartner = (seed: string, friendship: number, species = 'raticate'): { run: RunState; mon: PokemonInstance } => {
  const run = gnRun(seed);
  const mon = createPokemon(content, species, 30, 'p-old');
  mon.caughtBall = 'poke-ball';
  mon.friendship = friendship;
  run.party.push(mon);
  return { run, mon };
};
const benchDone = (seed: string, friendship: number, species?: string): RunState => {
  const { run } = withPartner(seed, friendship, species);
  open(run, 'gn-24-bench');
  return choose(run, 'gn-24-bench', 'Wait.').run;
};
/** The outcome text plus its follow-on lines (a `when` line shows in the result list). */
const said = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');
const partnerOf = (run: RunState) => run.party.find((m) => m.gn?.includes('old-partner'));

describe('gn.24 The Forgotten Partner', () => {
  it('must-see at step 13 before the battle (A8, once a run); it needs a wild-caught Pokémon that is not the starter', () => {
    expect(content.coPlacement!.get('gn-24-bench')).toMatchObject({ home: 13, window: [11, 16], sits: 'must-see', attaches: 'before', earliest: 8 });
    const req = content.events.get('gn-24-bench')!.requires;
    const bare = gnRun('t24-req');
    expect(req.every((c) => conditionMet(content, bare, c))).toBe(false);
    expect(req.every((c) => conditionMet(content, withPartner('t24-req2', 70).run, c))).toBe(true);
  });

  it('the old trainer calls it by an old pet name; the intro names your Pokémon', () => {
    const { run } = withPartner('t24-name', 70);
    open(run, 'gn-24-bench');
    const intro = scene(run, 'gn-24-bench').intro;
    expect(PET_NAMES.some((n) => intro.includes(`${n}?`))).toBe(true);
    expect(intro).toContain('Raticate');
    expect(intro).not.toContain('{');
  });

  it('one of three stories, by its nature; its reaction follows its Bond (high: back to your side; low: it stays a while)', () => {
    const hiRun = withPartner('t24-hi', 220).run;
    open(hiRun, 'gn-24-bench');
    const high = choose(hiRun, 'gn-24-bench', 'Wait.');
    const stories = new Set<number>();
    for (const [i, seed] of ['a', 'b', 'c', 'd', 'e', 'f'].entries()) {
      const { run, mon } = withPartner(`t24-story-${seed}`, 70);
      mon.nature = NATURE_IDS[i]!;
      open(run, 'gn-24-bench');
      stories.add(flagOf(choose(run, 'gn-24-bench', 'Wait.').run, 'partner-story'));
    }
    expect([...stories].every((n) => n >= 1 && n <= 3)).toBe(true);
    expect(stories.size).toBeGreaterThan(1);
    expect(partnerOf(high.run)?.uid).toBe('p-old');
    expect(flagOf(high.run, 'partner-bond')).toBeGreaterThanOrEqual(4);
    if (!flagOf(high.run, 'partner-flinch')) expect(said(high)).toMatch(/comes back to your side/);
    const loRun = withPartner('t24-lo', 0).run;
    open(loRun, 'gn-24-bench');
    const low = choose(loRun, 'gn-24-bench', 'Wait.');
    if (!flagOf(low.run, 'partner-flinch')) expect(said(low)).toMatch(/stays there a while/);
  });

  it('the doc\'s choices; "Let them have some time": Bond +1, a node passes, it relearns a dropped move, and Two Trainers at high Bond', () => {
    const run = benchDone('t24-time', 220);
    expect(scene(run, 'gn-24-choose').labels).toEqual(['Let them have some time.', 'No. Come on.', 'Can I ask you something?', 'Let it decide.']);
    expect(scene(run, 'gn-24-choose').intro).toMatch(/might not choose you/);
    const before = partnerOf(run)!;
    const after = choose(run, 'gn-24-choose', 'Let them have some time.').run;
    const mon = partnerOf(after)!;
    expect(mon.friendship).toBeGreaterThan(before.friendship);
    expect(mon.moves.map((m) => m.id)).toContain('two-trainers');
    expect(mon.moves.some((m) => !before.moves.some((b) => b.id === m.id) && m.id !== 'two-trainers')).toBe(true);
    expect(flagOf(after, 'partner-time')).toBe(1);
    expect(flagOf(after, 'partner-done')).toBe(1);
  });

  it('at middling Bond it relearns a move but not Two Trainers', () => {
    const after = choose(benchDone('t24-mid', 120), 'gn-24-choose', 'Let them have some time.').run;
    expect(partnerOf(after)!.moves.map((m) => m.id)).not.toContain('two-trainers');
  });

  it('"No. Come on.": it follows, looking back', () => {
    const r = choose(benchDone('t24-no', 120), 'gn-24-choose', 'No. Come on.');
    expect(r.text).toMatch(/looks back twice/);
    expect(flagOf(r.run, 'partner-refused')).toBe(1);
  });

  it('three questions, each showing a gap between the two stories; then back to the choice', () => {
    let run = choose(benchDone('t24-ask', 120), 'gn-24-choose', 'Can I ask you something?').run;
    expect(scene(run, 'gn-24-ask').labels).toEqual(['How long were you together?', 'Did you say goodbye?', 'Did you ever go back?', "We'll come back."]);
    run = choose(run, 'gn-24-ask', 'How long were you together?').run;
    expect(scene(run, 'gn-24-ask').labels).toEqual(['Did you say goodbye?', 'Did you ever go back?', "We'll come back."]);
    run = choose(run, 'gn-24-ask', 'Did you say goodbye?').run;
    const last = choose(run, 'gn-24-ask', 'Did you ever go back?');
    expect(last.text).toMatch(/It was there. It waited/);
    expect(scene(last.run, 'gn-24-choose').labels).toHaveLength(4);
  });

  it('"Let it decide" at the lowest Bond: it goes home, and the trainer gives you a young Pokémon of its line', () => {
    const run = choose(benchDone('t24-home', 0), 'gn-24-choose', 'Let it decide.').run;
    const home = choose(run, 'gn-24-home', 'Take the little one.').run;
    expect(home.party.some((m) => m.uid === 'p-old')).toBe(false);
    expect(home.pending.length + home.party.length).toBeGreaterThan(0);
    const young = [...home.party, ...home.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.speciesId === 'rattata');
    expect(young).toBeTruthy();
    expect(flagOf(home, 'partner-went-home')).toBe(1);
  });

  it('"Let it decide" at higher Bond: it chooses you', () => {
    const r = choose(benchDone('t24-stay', 120), 'gn-24-choose', 'Let it decide.');
    expect(said(r)).toMatch(/comes back to you/);
    expect(partnerOf(r.run)?.uid).toBe('p-old');
  });

  it('"We\'ll come back": up to three visits on later stages of the region; the third says the thing by its story', () => {
    let run = choose(benchDone('t24-visit', 120), 'gn-24-choose', 'Can I ask you something?').run;
    run = choose(run, 'gn-24-ask', "We'll come back.").run;
    expect(flagOf(run, 'partner-visits')).toBe(1);
    const req = content.events.get('gn-24-visit1')!.requires;
    expect(req.every((c) => conditionMet(content, run, c))).toBe(false); // same stage
    setFlag(run, 'partner-visits', 3);
    setFlag(run, 'partner-story', 2);
    open(run, 'gn-24-visit3');
    expect(scene(run, 'gn-24-visit3').intro).toContain("I'm sorry I shouted.");
    const done = choose(run, 'gn-24-visit3', 'Thank you, Rosabel.').run;
    expect(flagOf(done, 'partner-peace')).toBe(1);
  });
});

/** A one-on-one battle context for engine tests. */
function duel(player: PokemonInstance[], enemy: PokemonInstance, seed: string): BattleContext {
  const battle = createBattle('wild', [enemy], 0, player[0]!.uid);
  return { content, battle, party: player, inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}-c`)), catchMultiplier: 1 };
}
const withMoves = (species: string, level: number, uid: string, ...moves: string[]): PokemonInstance => {
  const m = createPokemon(content, species, level, uid);
  m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  return m;
};
const damageTo = (events: BattleEvent[], side: 'player' | 'enemy') => events.filter((e): e is Extract<BattleEvent, { type: 'damage' }> => e.type === 'damage' && e.side === side).reduce((n, e) => n + e.amount, 0);

describe('Two Trainers (gn.24)', () => {
  it('takes the user\'s own type; 75 power, 100 at maximum Bond', () => {
    expect(content.moves.get('two-trainers')).toMatchObject({ power: 75, type: 'normal', category: 'physical' });
    const hit = (friendship: number) => {
      const me = withMoves('machop', 40, 'p1', 'two-trainers');
      me.friendship = friendship;
      const ctx = duel([me], withMoves('snorlax', 40, 'e1', 'splash'), 't-two');
      return { events: resolveTurn(ctx, { kind: 'move', index: 0 }) };
    };
    const low = damageTo(hit(70).events, 'enemy');
    const max = damageTo(hit(content.balance.friendship.max).events, 'enemy');
    expect(max).toBeGreaterThan(low * 1.2);
    // A Fighting-type user: the move is Fighting, so a Ghost isn't hit... (it is Normal on paper)
    const me = withMoves('machop', 40, 'p2', 'two-trainers');
    const ctx = duel([me], withMoves('gastly', 40, 'e2', 'splash'), 't-two-ghost');
    expect(damageTo(resolveTurn(ctx, { kind: 'move', index: 0 }), 'enemy')).toBe(0);
  });
});

describe('gn.25 The Unlikely Friendship', () => {
  const heap = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
    const run = gnRun(seed);
    run.party.push(createPokemon(content, 'snorlax', run.party[0]!.level + 5, 'p-big'));
    setup(run);
    open(run, 'gn-25-heap');
    return run;
  };
  const truce = (run: RunState) => [...run.party, ...run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].filter((m) => m.fixedAbility === 'truce').map((m) => m.speciesId);

  it('step 7, optional, before the battle (A5); the doc\'s three choices', () => {
    expect(content.coPlacement!.get('gn-25-heap')).toMatchObject({ home: 7, window: [5, 10], sits: 'optional', attaches: 'before', earliest: 5 });
    expect(scene(heap('t25-l'), 'gn-25-heap').labels).toEqual(['Watch.', 'Step closer.', 'Back away quietly.']);
  });

  it('if the Border Dispute was settled by uniting both sides, they take to you at once: no "Step closer."', () => {
    const run = heap('t25-border', (r) => setFlag(r, 'border-united'));
    expect(scene(run, 'gn-25-heap').labels).toEqual(['Watch.', 'Back away quietly.']);
    expect(scene(run, 'gn-25-heap').intro).toMatch(/aren't afraid of you/);
  });

  it('watching: three beats, then the pack: one double battle, six Mightyena, with both of the pair on your side', () => {
    const watched = choose(heap('t25-pack'), 'gn-25-heap', 'Watch.');
    expect(watched.text).toMatch(/bigger half/);
    expect(watched.text).toMatch(/collide/);
    const fight = choose(watched.run, 'gn-25-pack', 'Fight beside them.').run;
    expect(fight.battle!.doubles).toBeTruthy();
    expect(fight.battle!.eventRule?.gn).toBe('truce');
    // The Zangoose stands beside you (the fight's ally); the Seviper is right behind it, in the party for this fight.
    expect(fight.party.find((m) => m.speciesId === 'zangoose')?.uid).toBe(fight.battle!.loaner);
    expect(fight.party.find((m) => m.speciesId === 'seviper')?.gn).toContain('truce-guest');
    expect(fight.battle!.enemyTeam.map((m) => m.speciesId)).toEqual(Array(6).fill('mightyena'));
    const after = win(fight);
    // Both go back to each other when it is over: neither stays in the party unless you ask.
    expect(after.party.some((m) => m.speciesId === 'zangoose' || m.speciesId === 'seviper')).toBe(false);
    expect(scene(after, 'gn-25-after').labels).toEqual(['Come with me.', 'Both of you.', 'Stay together. Good luck.']);
    expect(content.events.has('gn-25-pack-2')).toBe(false);
  });

  it('losing to the pack ends nothing: the pair finish it, and the story goes on', () => {
    const fight = choose(choose(heap('t25-lose'), 'gn-25-heap', 'Watch.').run, 'gn-25-pack', 'Fight beside them.').run;
    const after = lose(fight);
    expect(after.phase).toBe('map');
    expect(flagOf(after, 'truce-pack-lost')).toBe(1);
    expect(after.party.some((m) => m.speciesId === 'zangoose' || m.speciesId === 'seviper')).toBe(false);
  });

  const afterPack = (seed: string): RunState => {
    return win(choose(choose(heap(seed), 'gn-25-heap', 'Step closer.').run, 'gn-25-pack', 'Fight beside them.').run);
  };

  it('both of you: they take two Balls, and both have Truce', () => {
    const run = choose(afterPack('t25-both'), 'gn-25-after', 'Both of you.').run;
    const joined = [...run.party, ...run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].filter((m) => m.fixedAbility === 'truce').map((m) => m.speciesId).sort();
    expect(joined).toEqual(['seviper', 'zangoose']);
  });

  it('leave them together: a Rare Berry on the path, split in two', () => {
    const out = choose(afterPack('t25-left'), 'gn-25-after', 'Stay together. Good luck.');
    const run = out.run;
    expect(out.text).toMatch(/Rare Berry, split neatly in two/);
    // One Rare Berry (Liechi, Ganlon, Salac, Petaya or Apicot), not two Sitrus.
    expect(out.changes.join(' ')).toMatch(/(Liechi|Ganlon|Salac|Petaya|Apicot) Berry/);
    expect(flagOf(run, 'truce-left')).toBe(1);
  });

  it('recruit one: the other is glimpsed on later stages, closer each time, and joins at the third sighting', () => {
    let run = win(choose(choose(afterPack('t25-one'), 'gn-25-after', 'Come with me.').run, 'gn-25-which', 'The Zangoose.').run);
    expect(truce(run)).toEqual(['zangoose']);
    expect(content.events.get('gn-25-sight1')!.requires.every((c) => conditionMet(content, run, c))).toBe(false); // not on the same stage
    setFlag(run, 'truce-sight', 2);
    open(run, 'gn-25-sight3');
    expect(scene(run, 'gn-25-sight3').labels).toEqual(['Come in.', 'Go home.']);
    run = choose(run, 'gn-25-sight3', 'Go home.').run;
    expect(truce(run).sort()).toEqual(['seviper', 'zangoose']);
    expect(flagOf(run, 'truce-reunited')).toBe(1);
  });
});

describe('Truce (gn.25)', () => {
  const pair = (): PokemonInstance[] => {
    const z = withMoves('zangoose', 40, 'p-z', 'tackle');
    const s = withMoves('seviper', 40, 'p-s', 'tackle');
    z.fixedAbility = 'truce';
    s.fixedAbility = 'truce';
    return [z, s];
  };

  it('in a single battle, when one faints, its partner next to it in the party comes in with Attack +1 and Speed +1', () => {
    const party = pair();
    party[0]!.hp = 1;
    const ctx = duel(party, withMoves('machamp', 60, 'e1', 'cross-chop'), 't-truce');
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(party[0]!.hp).toBe(0);
    resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
    expect(ctx.battle.playerStages.atk).toBe(1);
    expect(ctx.battle.playerStages.spe).toBe(1);
  });

  it('not when the partner is not next to it in the party', () => {
    const [z, s] = pair();
    const party = [z!, withMoves('rattata', 40, 'p-r', 'tackle'), s!];
    z!.hp = 1;
    const ctx = duel(party, withMoves('machamp', 60, 'e1', 'cross-chop'), 't-truce2');
    resolveTurn(ctx, { kind: 'move', index: 0 });
    resolveTurn(ctx, { kind: 'switch', partyIndex: 2 });
    expect(ctx.battle.playerStages.atk).toBe(0);
  });
});

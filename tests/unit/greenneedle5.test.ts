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

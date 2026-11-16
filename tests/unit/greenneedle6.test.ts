// Greenneedle part 6: gn.26 The Island of Giant Pokémon (tools/events/co/greenneedle-6.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { calcStats, createPokemon, maxHp } from '../../src/core/pokemon';
import { chainRooms, PSEUDO_CHAINS } from '../../src/core/dungeon/pseudo';
import { choose, flagOf, gnRun, lose, open, openSide, scene, setFlag, win } from './helpers/gnPlay';
import { conditionMet } from '../../src/core/events';

const party = (seed: string, extra: string[] = []): RunState => {
  const run = gnRun(seed);
  for (const [i, sp] of extra.entries()) run.party.push(createPokemon(content, sp, run.party[0]!.level, `p-${i}`));
  return run;
};
const ashore = (seed: string, extra: string[] = [], setup: (run: RunState) => void = () => {}): RunState => {
  const run = party(seed, extra);
  setup(run);
  open(run, 'gn-26-door');
  return choose(run, 'gn-26-door', 'Wake the ferryman.').run;
};
const next = (run: RunState): string => openSide(run)!.eventId;
/** The outcome text plus its follow-on lines (a `when` line shows in the result list). */
const said = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');

describe('gn.26 The Island of Giant Pokémon', () => {
  it('a door at step 15, optional, instead of the battle; needs water; A7; a six-node pseudo stage', () => {
    expect(content.coPlacement!.get('gn-26-door')).toMatchObject({ shape: 'door', home: 15, window: [13, 18], sits: 'optional', attaches: 'instead', earliest: 7, tags: ['water'] });
    const chain = PSEUDO_CHAINS.find((c) => c.id === 'ps_gn_giants')!;
    expect(chainRooms(content, chain).map((r) => `${r.depth}:${r.event}`).slice(0, 6)).toEqual(['1:gn-26-beach', '2:gn-26-river', '3:gn-26-stack', '4:gn-26-trench', '5:gn-26-clearing', '6:gn-26-high']);
    const run = ashore('t26-door');
    expect(run.stage!.pseudo?.id).toBe('ps_gn_giants');
  });

  it('the beach: the doc\'s three choices; holding still, it sets your lead down the wrong way up', () => {
    const run = ashore('t26-beach');
    expect(next(run)).toBe('gn-26-beach');
    expect(scene(run, 'gn-26-beach').labels).toEqual(['Hold still.', 'Run.', 'Recall my lead.']);
    const held = choose(run, 'gn-26-beach', 'Hold still.');
    expect(said(held)).toMatch(/wrong way up/);
    expect(next(held.run)).toBe('gn-26-river');
  });

  it('calm around big ones (the Stranding, or the Kaiju freed): the Slowbro sets it down the right way up', () => {
    const run = ashore('t26-calm', [], (r) => setFlag(r, 'kaiju-freed'));
    expect(scene(run, 'gn-26-beach').intro).toMatch(/calm around big ones/);
    expect(said(choose(run, 'gn-26-beach', 'Hold still.'))).toMatch(/right way up/);
  });

  it('the river: tickle its foot with a Flying- or Grass-type, dig with a Ground-type (a node of time), or attack it', () => {
    const plain = choose(ashore('t26-river0', [], (r) => { r.party = [createPokemon(content, 'squirtle', 20, 'p-sq')]; }), 'gn-26-beach', 'Hold still.').run;
    expect(scene(plain, 'gn-26-river').labels).toEqual(['Attack it.', 'Leave it sleeping.']);
    const both = choose(ashore('t26-river', ['pidgey', 'diglett']), 'gn-26-beach', 'Hold still.').run;
    expect(scene(both, 'gn-26-river').labels).toEqual(['Tickle its foot.', 'Dig a channel past it.', 'Attack it.', 'Leave it sleeping.']);
    const tickled = choose(both, 'gn-26-river', 'Tickle its foot.').run;
    expect(flagOf(tickled, 'giants-river')).toBe(1);
    expect(flagOf(tickled, 'giants-solved')).toBe(1);
  });

  it('attacking the Snorlax is a giant\'s fight: double HP, A+2, and losing it ends nothing', () => {
    const run = choose(ashore('t26-snorlax'), 'gn-26-beach', 'Hold still.').run;
    const fight = choose(run, 'gn-26-river', 'Attack it.').run;
    const foe = fight.battle!.enemyTeam[0]!;
    expect(foe.speciesId).toBe('snorlax');
    const plain = createPokemon(content, 'snorlax', foe.level, 'cmp');
    plain.ivs = foe.ivs;
    plain.evs = foe.evs;
    plain.nature = foe.nature;
    expect(maxHp(content, foe)).toBeGreaterThanOrEqual(maxHp(content, plain) * 2 - 2);
    expect(fight.battle!.eventRule?.giant).toBe(true);
    const after = lose(fight);
    expect(after.phase).toBe('map');
    expect(flagOf(after, 'giants-snorlax-attacked')).toBe(1);
    expect(flagOf(after, 'giants-river')).toBe(0);
  });

  it('the nest: hold still, then a balance walk with its breath; sending a Pokémon alone gets it mobbed', () => {
    let run = choose(ashore('t26-nest'), 'gn-26-beach', 'Hold still.').run;
    run = choose(run, 'gn-26-river', 'Leave it sleeping.').run;
    expect(scene(run, 'gn-26-stack').labels).toEqual(['Hold still.', 'Send a Pokémon up alone.', 'Leave the nest.']);
    const climb = choose(run, 'gn-26-stack', 'Hold still.').run;
    expect(content.events.get('gn-26-climb')!.choices[0]!.prompt).toEqual({ id: 'breath-walk', needs: 'ok' });
    expect(scene(climb, 'gn-26-climb').labels).toEqual(['Slide the nest back.']);
  });

  it('the trench: fight it, go round (a node of time), or a timing run while it turns', () => {
    expect(content.events.get('gn-26-trench')!.choices.map((c) => c.label)).toEqual(['Fight it.', 'Go the long way round.', 'Wait for it to reach the far end.']);
    expect(content.events.get('gn-26-trench')!.choices[2]!.prompt).toEqual({ id: 'trench-dash', needs: 'ok' });
  });

  it('the quarrel: show them with your whole party; picking a side leaves one sulking', () => {
    expect(content.events.get('gn-26-clearing')!.choices.map((c) => c.label)).toEqual(['Show them.', 'Side with the Kabutops.', 'Side with the Tangela.', 'Leave them to it.']);
  });

  const atTop = (seed: string, solved: string[], setup: (run: RunState) => void = () => {}): RunState => {
    const run = ashore(seed);
    for (const k of solved) setFlag(run, k);
    setFlag(run, 'giants-solved', solved.length);
    setup(run);
    setFlag(run, 'giants-threat', solved.length <= 1 || run.story.flags['ev:giants-snorlax-attacked'] ? 1 : 0);
    open(run, 'gn-26-high');
    return run;
  };

  it('the guardian, all three solved: it steps aside and sees you off; the Giant\'s Mark and every problem\'s gift', () => {
    const run = atTop('t26-all', ['giants-river', 'giants-nest', 'giants-quarrel']);
    expect(scene(run, 'gn-26-high').labels).toEqual(['Wait with it.']);
    const done = choose(run, 'gn-26-high', 'Wait with it.');
    expect(done.text).toMatch(/pushes the boat out/);
    expect(flagOf(done.run, 'giants-guardian')).toBe(1);
    const bag = Object.keys(done.run.inventory).concat(done.run.party.flatMap((m) => Object.keys(m.held ?? {})));
    expect(JSON.stringify(done.run)).toMatch(/giants-mark/);
    expect(bag.join()).toMatch(/leftovers/);
    expect(done.run.stage!.pseudo).toBeFalsy();
  });

  it('two solved: it steps aside, slowly, and doesn\'t see you off', () => {
    const r = choose(atTop('t26-two', ['giants-river', 'giants-nest']), 'gn-26-high', 'Wait with it.');
    expect(r.text).toMatch(/slowly/);
    expect(r.text).not.toMatch(/boat/);
  });

  it('one or none: fight it (Earthquake, Megahorn, Stamp) or go back and help', () => {
    const run = atTop('t26-none', []);
    expect(scene(run, 'gn-26-high').labels).toEqual(['Fight it.', 'Go back and help.']);
    const fight = choose(run, 'gn-26-high', 'Fight it.').run;
    const moves = fight.battle!.enemyTeam[0]!.moves.map((m) => m.id);
    expect(moves).toEqual(expect.arrayContaining(['earthquake', 'megahorn', 'stamp']));
    const back = choose(run, 'gn-26-high', 'Go back and help.').run;
    expect(scene(back, 'gn-26-help').labels).toEqual(['The river.', 'The nest.', 'The quarrel.']);
    const after = win(fight);
    expect(flagOf(after, 'giants-guardian')).toBe(2);
  });

  it('if the Snorlax was attacked, the Nidoking doesn\'t wait', () => {
    const run = atTop('t26-angry', ['giants-nest', 'giants-quarrel'], (r) => setFlag(r, 'giants-snorlax-attacked'));
    expect(scene(run, 'gn-26-high').intro).toMatch(/already on its way down/);
    expect(scene(run, 'gn-26-high').labels).toEqual(['Fight it.']);
  });

  it('the Giant\'s Mark: max HP +25%, Speed -15%', () => {
    const mon = createPokemon(content, 'snorlax', 50, 'p-m');
    const plain = calcStats(content, mon).hp;
    mon.held = { 'giants-mark': 1 };
    expect(calcStats(content, mon).hp).toBe(Math.floor(plain * 1.25));
    expect(content.catalog.get('giants-mark')!.effect).toMatchObject({ kind: 'held' });
  });

  it('Stamp hits everything on the far side and makes it flinch', () => {
    expect(content.moves.get('stamp')).toMatchObject({ type: 'ground', effects: { flinchChance: 100 } });
  });
});

describe('gn.27 The Pokémon Circus', () => {
  const gate = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
    const run = gnRun(seed);
    run.money = 5000;
    setup(run);
    open(run, 'gn-27-gate');
    return choose(run, 'gn-27-gate', 'Step up.').run;
  };

  it('at the town (until towns exist: step 10, optional), A4, once a region', () => {
    expect(content.coPlacement!.get('gn-27-gate')).toMatchObject({ home: 10, window: [8, 13], sits: 'optional', attaches: 'town', earliest: 4 });
    const run = gate('t27-once');
    expect(content.events.get('gn-27-gate')!.requires.every((c) => conditionMet(content, run, c))).toBe(false);
  });

  it('three free tickets at the gate; the Big Top has the attractions, the practice ring and the final act', () => {
    const run = gate('t27-top');
    expect(flagOf(run, 'circus-tickets')).toBe(3);
    expect(scene(run, 'gn-27-top').labels).toEqual(['See the attractions.', 'Walk round behind the tent.', 'The final act.', 'Leave the circus.']);
  });

  it('an attraction costs a ticket; more are ₽100', () => {
    let run = choose(gate('t27-ticket'), 'gn-27-top', 'See the attractions.').run;
    run = choose(run, 'gn-27-acts', 'Mr. Mime\'s Illusions.').run;
    run = choose(run, 'gn-27-mime', 'Lean on a wall.').run;
    expect(flagOf(run, 'circus-tickets')).toBe(2);
    expect(scene(run, 'gn-27-mime-lean').labels).toEqual(['The left one.', 'The middle one.', 'The right one.']);
    const real = flagOf(run, 'circus-mime');
    const leaned = choose(run, 'gn-27-mime-lean', ['The left one.', 'The middle one.', 'The right one.'][real - 1]!);
    expect(said(leaned)).toMatch(/It holds/);
    const money = leaned.run.money;
    const bought = choose(leaned.run, 'gn-27-mime', 'Buy a ticket (₽100).').run;
    expect(bought.money).toBe(money - 100);
    expect(flagOf(bought, 'circus-tickets')).toBe(3);
  });

  it('Machamp\'s Strength Contest: Attack decides, against a Machamp using two of four arms', () => {
    const strong = gate('t27-strong', (r) => r.party.push(createPokemon(content, 'machamp', r.party[0]!.level + 10, 'p-champ')));
    let run = choose(choose(strong, 'gn-27-top', 'See the attractions.').run, 'gn-27-acts', 'Machamp\'s Strength Contest.').run;
    const won = choose(run, 'gn-27-machamp', 'Enter your strongest.');
    expect(said(won)).toMatch(/Protein/);
    run = choose(choose(gate('t27-weak', (r) => { r.party = [createPokemon(content, 'magikarp', 5, 'p-k')]; }), 'gn-27-top', 'See the attractions.').run, 'gn-27-acts', 'Machamp\'s Strength Contest.').run;
    expect(said(choose(run, 'gn-27-machamp', 'Enter your strongest.'))).toMatch(/doesn't even need/);
  });

  it('the track and the jugglers are timing games; the arena is three fights with one Pokémon', () => {
    expect(content.events.get('gn-27-track')!.choices[0]!.prompt).toEqual({ id: 'track-jumps', needs: 'ok' });
    expect(['gn-27-juggle', 'gn-27-juggle-5', 'gn-27-juggle-7'].map((id) => content.events.get(id)!.choices[0]!.prompt?.id)).toEqual(['juggle-three', 'juggle-five', 'juggle-seven']);
    let run = gate('t27-arena', (r) => r.party.push(createPokemon(content, 'snorlax', r.party[0]!.level + 5, 'p-big')));
    run = choose(choose(choose(run, 'gn-27-top', 'See the attractions.').run, 'gn-27-acts', 'More booths.').run, 'gn-27-acts-2', 'The Arena.').run;
    const fight = choose(run, 'gn-27-arena', 'Send in your strongest.').run;
    expect(fight.party).toHaveLength(1);
    const after = win(fight);
    expect(after.party.length).toBeGreaterThan(1);
    expect(flagOf(after, 'circus-arena-won')).toBe(1);
  });

  it('the Mystery Tent shows the tier, not the species', () => {
    let run = choose(choose(gate('t27-mystery'), 'gn-27-top', 'See the attractions.').run, 'gn-27-acts', 'More booths.').run;
    run = choose(choose(run, 'gn-27-acts-2', 'The Mystery Tent.').run, 'gn-27-mystery', 'Draw back the card.').run;
    const labels = scene(run, 'gn-27-mystery-offer').labels;
    expect(labels).toHaveLength(2);
    expect(labels[0]).toMatch(/\((Common|Rare|Very rare)\)/);
  });

  it('the shy one: the doc\'s four choices; two of the three, and it finishes to a standing crowd', () => {
    let run = choose(gate('t27-shy'), 'gn-27-top', 'Walk round behind the tent.').run;
    expect(scene(run, 'gn-27-shy').labels).toEqual(['Rehearse with it, in the empty tent.', 'Stand in the wings tonight.', 'Go on with it.', 'Leave it be.']);
    expect(scene(run, 'gn-27-shy').intro).toMatch(/Clover Pye/);
    run = choose(run, 'gn-27-shy', 'Rehearse with it, in the empty tent.').run;
    run = choose(run, 'gn-27-top', 'Walk round behind the tent.').run;
    expect(scene(run, 'gn-27-shy').labels).toEqual(['Stand in the wings tonight.', 'Go on with it.', 'Leave it be.']);
    const two = choose(run, 'gn-27-shy', 'Go on with it.');
    expect(said(two)).toMatch(/standing crowd/);
    expect(flagOf(two.run, 'circus-shy-helped')).toBe(1);
  });

  it('the final act: the owner\'s company, the shy one last if helped; a win gives a season ticket', () => {
    let run = gate('t27-final', (r) => r.party.push(createPokemon(content, 'snorlax', r.party[0]!.level + 5, 'p-big')));
    setFlag(run, 'circus-shy-helped');
    run = choose(run, 'gn-27-top', 'The final act.').run;
    expect(scene(run, 'gn-27-final').labels).toEqual(['Places!', 'Not tonight.']);
    const fight = choose(run, 'gn-27-final', 'Places!').run;
    const team = fight.battle!.enemyTeam.map((m) => m.speciesId);
    expect(team.slice(0, 4)).toEqual(['mr-mime', 'machamp', 'rapidash', 'aipom']);
    expect(team).toHaveLength(5);
    const after = win(fight);
    expect(flagOf(after, 'circus-season')).toBe(1);
  });
});

// Greenneedle part 6: gn.26 The Island of Giant Pokémon (tools/events/co/greenneedle-6.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { calcStats, createPokemon, maxHp } from '../../src/core/pokemon';
import { chainRooms, PSEUDO_CHAINS } from '../../src/core/dungeon/pseudo';
import { choose, flagOf, gnRun, lose, open, openSide, scene, setFlag, win } from './helpers/gnPlay';
import { conditionMet } from '../../src/core/events';
import { isBlackMarket } from '../../src/core/run';

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

describe('gn.28 The Team Rocket Hideout', () => {
  const rocket = (seed: string, extra: string[] = []): RunState => {
    const run = party(seed, extra);
    run.story.evil = { teamId: 'rocket', beat: 0, nextAt: 0, heat: 0, ops: [], villains: {}, defector: false, end: 'none', region: 0, stages: 0 } as never;
    return run;
  };
  const inside = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
    const run = rocket(seed);
    setup(run);
    open(run, 'gn-28-door');
    return choose(run, 'gn-28-door', 'Go in.').run;
  };
  const toLabs = (seed: string): RunState => choose(inside(seed), 'gn-28-offices', 'Talk your way past.').run;
  const toVault = (seed: string, alert: number): RunState => {
    const run = rocket(seed);
    setFlag(run, 'hideout-entered');
    setFlag(run, 'hideout-alert', alert);
    open(run, 'gn-28-vault');
    return run;
  };

  it('a door at step 14, optional, instead of the battle; A6; four floors; only while the region\'s team is active', () => {
    expect(content.coPlacement!.get('gn-28-door')).toMatchObject({ shape: 'door', home: 14, window: [12, 17], sits: 'optional', attaches: 'instead', earliest: 6 });
    const chain = PSEUDO_CHAINS.find((c) => c.id === 'ps_gn_hideout')!;
    expect(chainRooms(content, chain).map((r) => `${r.depth}:${r.event}`).slice(0, 4)).toEqual(['1:gn-28-offices', '2:gn-28-labs', '3:gn-28-holding', '4:gn-28-vault']);
    const req = content.events.get('gn-28-door')!.requires;
    expect(req.every((c) => conditionMet(content, gnRun('t28-none'), c))).toBe(false);
    expect(req.every((c) => conditionMet(content, rocket('t28-req'), c))).toBe(true);
  });

  it('written in the team\'s own words; going in, the first camera sees you (Alert +2)', () => {
    const run = rocket('t28-words');
    open(run, 'gn-28-door');
    expect(scene(run, 'gn-28-door').intro).toMatch(/Silph Surplus Co\.[\s\S]*Rocket Grunt/);
    expect(scene(run, 'gn-28-door').intro).not.toContain('{');
    const went = choose(run, 'gn-28-door', 'Go in.');
    expect(said(went)).toMatch(/Alert \+2/);
    expect(flagOf(went.run, 'hideout-alert')).toBe(2);
    expect(went.run.stage!.pseudo?.id).toBe('ps_gn_hideout');
    expect(scene(went.run, 'gn-28-offices').intro).toMatch(/LOST: one Meowth, answers to nothing/);
  });

  it('the offices: the File for the team\'s story (a camera sees you), and talking past only while they\'re bored', () => {
    let run = inside('t28-file');
    expect(scene(run, 'gn-28-offices').labels).toEqual(['Search the filing cabinet.', 'Slip behind the canteen.', 'Talk your way past.', 'Fight your way through.']);
    run = choose(run, 'gn-28-offices', 'Search the filing cabinet.').run;
    expect(flagOf(run, 'team-rocket-files')).toBeGreaterThan(0);
    expect(flagOf(run, 'hideout-alert')).toBe(4);
    expect(scene(run, 'gn-28-offices').labels).toEqual(['Slip behind the canteen.', 'Talk your way past.', 'Fight your way through.']);
    const later = inside('t28-bored');
    setFlag(later, 'hideout-alert', 5);
    expect(scene(later, 'gn-28-offices').labels).not.toContain('Talk your way past.');
  });

  it('behind the canteen: petty cash, and the tape loop blinds the next two cameras', () => {
    let run = choose(inside('t28-loop'), 'gn-28-offices', 'Slip behind the canteen.').run;
    expect(scene(run, 'gn-28-back').labels).toEqual(['Take the petty cash.', 'Put the loop on.', 'Smash the monitors.', 'Back to the offices.']);
    const money = run.money;
    run = choose(run, 'gn-28-back', 'Take the petty cash.').run;
    expect(run.money).toBe(money + 1200);
    run = choose(run, 'gn-28-back', 'Put the loop on.').run;
    run = choose(choose(run, 'gn-28-back', 'Back to the offices.').run, 'gn-28-offices', 'Talk your way past.').run;
    expect(flagOf(run, 'hideout-alert')).toBe(2);
    expect(flagOf(run, 'hideout-loop')).toBe(1);
  });

  it('smashing the monitors trips an alarm (Alert +3) and brings a Grunt', () => {
    const run = choose(choose(inside('t28-smash'), 'gn-28-offices', 'Slip behind the canteen.').run, 'gn-28-back', 'Smash the monitors.');
    expect(flagOf(run.run, 'hideout-alert')).toBe(5);
    expect(run.run.battle?.kind).toBe('trainer');
  });

  it('at Alert 10 every Grunt left has one more Pokémon', () => {
    const calm = choose(inside('t28-calm'), 'gn-28-offices', 'Fight your way through.').run;
    const loudIn = inside('t28-loud');
    setFlag(loudIn, 'hideout-alert', 10);
    const loud = choose(loudIn, 'gn-28-offices', 'Fight your way through.').run;
    expect(flagOf(loud, 'hideout-alert')).toBe(10);
    expect(loud.battle!.enemyTeam.length).toBe(calm.battle!.enemyTeam.length + 1);
  });

  it('the scientist: the doc\'s four choices; asking what\'s inside, then "Come with me": the key, and he turns', () => {
    let run = choose(toLabs('t28-sci'), 'gn-28-labs', 'Talk to the scientist at the window.').run;
    expect(scene(run, 'gn-28-scientist').labels).toEqual(['Give me the key.', 'What\'s in the locked lab?', 'Come with me.', 'You knew. You stayed.']);
    expect(scene(run, 'gn-28-scientist').intro).toMatch(/Dr\. Emmerich Aldersey/);
    const asked = choose(run, 'gn-28-scientist', 'What\'s in the locked lab?');
    expect(asked.text).toMatch(/Nobody's switched the lights off/);
    run = choose(asked.run, 'gn-28-scientist', 'Come with me.').run;
    expect(flagOf(run, 'hideout-scientist-turned')).toBe(1);
    expect(flagOf(run, 'hideout-lab-known')).toBe(1);
    expect(scene(run, 'gn-28-labs').labels).toContain('Unlock the laboratory.');
  });

  it('the locked lab: a Shadow Pokémon, never forced', () => {
    let run = choose(toLabs('t28-lab'), 'gn-28-labs', 'Talk to the scientist at the window.').run;
    run = choose(choose(run, 'gn-28-scientist', 'Give me the key.').run, 'gn-28-labs', 'Unlock the laboratory.').run;
    expect(scene(run, 'gn-28-lab').labels).toEqual(['Open its tank.', 'Leave them sleeping.']);
    const left = choose(run, 'gn-28-lab', 'Leave them sleeping.').run;
    expect(left.pending.length + left.party.length).toBe(run.pending.length + run.party.length);
    expect(content.events.get('gn-28-lab')!.choices[0]!.success.effects.some((e) => e.kind === 'join' && e.shadow)).toBe(true);
  });

  it('holding: the keeper helps while it\'s quiet; the cast is freed and the vault opens', () => {
    const labs = toLabs('t28-pen');
    expect(flagOf(labs, 'hideout-alert')).toBe(4);
    setFlag(labs, 'hideout-alert', 0);
    const run = choose(labs, 'gn-28-labs', 'Take the stairs down.').run;
    expect(scene(run, 'gn-28-holding').labels).toEqual(['Open every cage.', 'Ask the keeper to help.']);
    const freed = choose(run, 'gn-28-holding', 'Ask the keeper to help.').run;
    expect(flagOf(freed, 'freed-caged')).toBe(1);
    expect(next(freed)).toBe('gn-28-vault');
  });

  it('the Executive at A+2; at Alert 10 two Grunts stand with them', () => {
    const quiet = choose(toVault('t28-exec', 3), 'gn-28-vault', 'Fight.').run;
    expect(quiet.battle!.kind).toBe('trainer');
    const loud = win(choose(toVault('t28-exec10', 10), 'gn-28-vault', 'Fight.').run);
    expect(next(loud)).toBe('gn-28-vault-2');
  });

  it('beating the Executive: choose one of four rewards; the black-market pass lasts the region', () => {
    const run = win(choose(toVault('t28-win', 3), 'gn-28-vault', 'Fight.').run);
    expect(next(run)).toBe('gn-28-reward');
    expect(scene(run, 'gn-28-reward').labels).toEqual(['A Shadow Pokémon.', 'A stolen evolution item.', 'A rare egg.', 'A pass to the black market.']);
    const pass = choose(run, 'gn-28-reward', 'A pass to the black market.').run;
    expect(flagOf(pass, 'hideout-pass')).toBe(pass.regionIndex + 1);
    expect(flagOf(pass, 'hideout-done')).toBe(1);
    expect(content.shop.some((e) => isBlackMarket(content, pass, e))).toBe(true);
    expect(content.shop.some((e) => isBlackMarket(content, run, e))).toBe(false);
    pass.regionIndex += 1;
    expect(content.shop.some((e) => isBlackMarket(content, pass, e))).toBe(false);
    const stone = choose(choose(run, 'gn-28-reward', 'A stolen evolution item.').run, 'gn-28-stone', 'Return it to its owner.');
    expect(flagOf(stone.run, 'hideout-reward-stone-returned')).toBe(1);
  });

  it('losing to the Executive throws you out, and nothing worse', () => {
    const after = lose(choose(toVault('t28-lose', 3), 'gn-28-vault', 'Fight.').run);
    expect(after.phase).toBe('map');
    expect(flagOf(after, 'hideout-thrown-out')).toBe(1);
  });

  it('afterwards: the freed nod on later stages; a rescue centre and the scientist\'s note in the next region', () => {
    const run = rocket('t28-after');
    setFlag(run, 'freed-caged');
    setFlag(run, 'hideout-at', run.stage!.index + 1);
    setFlag(run, 'hideout-region', run.regionIndex + 1);
    setFlag(run, 'hideout-scientist-turned');
    setFlag(run, 'hideout-turned-region', run.regionIndex + 1);
    const req = (id: string) => content.events.get(id)!.requires.every((c) => conditionMet(content, run, c));
    expect([req('gn-28-nod'), req('gn-28-centre'), req('gn-28-note')]).toEqual([false, false, false]);
    run.regionIndex += 1;
    expect([req('gn-28-centre'), req('gn-28-note')]).toEqual([true, true]);
    open(run, 'gn-28-note');
    expect(said(choose(run, 'gn-28-note', 'Read it.'))).toMatch(/Team Rocket's next operation is Pokémon Heist/);
  });
});

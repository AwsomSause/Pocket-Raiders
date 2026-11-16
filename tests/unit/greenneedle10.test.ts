// Greenneedle part 10: gn.42 The Battle Frontier (tools/events/co/greenneedle-10.ts; rules in src/core/greenneedle/frontier.ts).
import { describe, expect, it } from 'vitest';
import type { BattleState, PokemonInstance, RunState } from '../../src/core/state';
import { createPokemon } from '../../src/core/pokemon';
import { chooseEvent, conditionMet } from '../../src/core/events';
import { takeTurn } from '../../src/core/run';
import { ANSWER, arenaMarks, arenaTurn, arenaVerdict, bagBack, bagLeave, bench, bring, palaceShape, rankOf, unbench } from '../../src/core/greenneedle/frontier';
import { content } from './helpers';
import { choose, flagOf, gnRun, lose, open, scene, setFlag, win } from './helpers/gnPlay';

const said = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');
/** The open room whose id starts with `prefix` (other events may share the node). */
const opened = (run: RunState, prefix: string): string | undefined =>
  run.stage!.map.nodes.find((n) => n.id === run.stage!.current)?.sides.find((x) => x.kind === 'event' && !x.used && x.eventId?.startsWith(prefix))?.eventId;
const mon = (sp: string, level = 30, uid = `t-${sp}`): PokemonInstance => createPokemon(content, sp, level, uid);

/** Through the gate, to the plaza. */
function frontier(seed: string, prep?: (run: RunState) => void): RunState {
  const run = gnRun(seed);
  prep?.(run);
  open(run, 'gn-42-door');
  return choose(run, 'gn-42-door', 'Go in.').run;
}
/** Into a building (from the plaza) and its first room. */
function take(run: RunState, wing: string, door: string, b: string): RunState {
  run = choose(run, 'gn-42-plaza', wing).run;
  run = choose(run, wing === 'The Tower, the Factory and the Arena.' ? 'gn-42-wing-1' : wing === 'The Pike, the Dome and the Palace.' ? 'gn-42-wing-2' : 'gn-42-wing-3', door).run;
  return choose(run, `gn-42-${b}`, 'Take the challenge.').run;
}
/** Wins the seven fights of a seven-room building (the Tower, the Arena, the Palace). */
function seven(run: RunState, b: string): RunState {
  for (let i = 1; i <= 7; i += 1) run = win(choose(run, `gn-42-${b}-${i}`, 'Battle.').run);
  return run;
}

describe('gn.42 The Battle Frontier: the plaza', () => {
  it('comes once per region; the plaza has three sides and a way out', () => {
    const run = frontier('t42-door');
    expect(content.events.get('gn-42-door')!.requires.every((c) => conditionMet(content, run, c))).toBe(false);
    expect(scene(run, 'gn-42-plaza').labels).toEqual(['The Tower, the Factory and the Arena.', 'The Pike, the Dome and the Palace.', 'The Pyramid, the shop and the rooms upstairs.', 'Leave the Frontier.']);
  });

  it('each building once per visit; the room with your name only with all seven Symbols', () => {
    let run = take(frontier('t42-once'), 'The Tower, the Factory and the Arena.', 'The Battle Tower.', 'tower');
    run = choose(run, 'gn-42-tower-1', 'Retire.').run;
    run = choose(run, 'gn-42-plaza', 'The Tower, the Factory and the Arena.').run;
    expect(scene(run, 'gn-42-wing-1').labels).toEqual(['The Battle Factory.', 'The Battle Arena.', 'Back to the fountain.']);
    run = choose(run, 'gn-42-wing-1', 'Back to the fountain.').run;
    run = choose(run, 'gn-42-plaza', 'The Pyramid, the shop and the rooms upstairs.').run;
    expect(scene(run, 'gn-42-wing-3').labels).not.toContain('The door with your name on it.');
    setFlag(run, 'frontier-symbols', 7);
    expect(scene(run, 'gn-42-wing-3').labels).toContain('The door with your name on it.');
  });
});

describe('gn.42 The Tower and the Brains', () => {
  it('seven in a row, a quarter healed between; clearing it gives points and rank, then Lady Imara (3 Pokémon at Bronze)', () => {
    let run = take(frontier('t42-tower'), 'The Tower, the Factory and the Arena.', 'The Battle Tower.', 'tower');
    expect(scene(run, 'gn-42-tower-2').intro).toMatch(/"One\."/);
    run = seven(run, 'tower');
    expect(flagOf(run, 'frontier-cleared')).toBe(1);
    expect(flagOf(run, 'frontier-cleared-tower')).toBe(1);
    expect(flagOf(run, 'frontier-rank')).toBe(1);
    expect(flagOf(run, 'frontier-points')).toBe(10);
    expect(opened(run, 'gn-42-tower-brain')).toBe('gn-42-tower-brain');
    const r = choose(run, 'gn-42-tower-brain', 'Battle.');
    expect(r.battle).toBe(true);
    expect(r.run.battle!.enemyTeam).toHaveLength(3);
    expect(r.run.battle!.event).toBeTruthy();
  });

  it('a Brain beaten: the Symbol, the result and your ace remembered; next time she answers the ace and says so', () => {
    let run = take(frontier('t42-imara'), 'The Tower, the Factory and the Arena.', 'The Battle Tower.', 'tower');
    run = win(choose(seven(run, 'tower'), 'gn-42-tower-brain', 'Battle.').run);
    expect(flagOf(run, 'frontier-symbol-tower')).toBe(1);
    expect(flagOf(run, 'frontier-symbols')).toBe(1);
    expect(flagOf(run, 'brain-tower-won')).toBe(1);
    const ace = run.party.reduce((a, m) => (m.level > a.level ? m : a));
    expect(run.story.flags[`ev:cast-brain-ace-tower:${ace.speciesId}`]).toBe(1);
    // The next region's Frontier: the Brain remembers.
    setFlag(run, 'frontier-done-tower', 0);
    open(run, 'gn-42-tower-brain');
    const name = content.species.get(ace.speciesId)!.name;
    expect(scene(run, 'gn-42-tower-brain').intro).toContain(`You brought the ${name}. I've brought something for the ${name}.`);
    const again = choose(run, 'gn-42-tower-brain', 'Battle.');
    expect(said(again)).toMatch(/I've thought about you every day since\. Unhealthily\./);
    const team = again.run.battle!.enemyTeam.map((m) => m.speciesId);
    expect(team).toContain(ANSWER[content.species.get(ace.speciesId)!.types[0]!]);
  });

  it('without last time\'s ace, she feels foolish; lost last time: "Back. Good."', () => {
    const run = frontier('t42-foolish');
    run.story.flags['ev:cast-brain-ace-tower:mewtwo'] = 1;
    setFlag(run, 'brain-tower-met', 1);
    setFlag(run, 'brain-tower-won', 2);
    setFlag(run, 'frontier-rank', 1);
    open(run, 'gn-42-tower-brain');
    expect(scene(run, 'gn-42-tower-brain').intro).toMatch(/Now I feel foolish\. It's a very good answer to a Mewtwo\./);
    expect(said(choose(run, 'gn-42-tower-brain', 'Battle.'))).toMatch(/"Back\. Good\."/);
  });

  it('a lost Brain battle never ends the run, and is remembered as lost', () => {
    let run = take(frontier('t42-lost'), 'The Tower, the Factory and the Arena.', 'The Battle Tower.', 'tower');
    run = lose(choose(seven(run, 'tower'), 'gn-42-tower-brain', 'Battle.').run);
    expect(run.phase).toBe('map');
    expect(flagOf(run, 'brain-tower-won')).toBe(2);
    expect(flagOf(run, 'frontier-symbol-tower')).toBe(0);
  });

  it('rank by buildings cleared: Bronze 0-2, Silver 3-6, Gold 7-13, Platinum 14+; Gold Brains hold items, Platinum bring six', () => {
    expect([0, 2, 3, 6, 7, 13, 14].map(rankOf)).toEqual([1, 1, 2, 2, 3, 3, 4]);
    let run = frontier('t42-gold');
    setFlag(run, 'frontier-rank', 3);
    open(run, 'gn-42-palace-brain');
    let r = choose(run, 'gn-42-palace-brain', 'Battle.');
    expect(r.run.battle!.enemyTeam).toHaveLength(5);
    expect(r.run.battle!.enemyTeam.every((m) => Object.keys(m.held ?? {}).length > 0)).toBe(true);
    run = frontier('t42-plat');
    setFlag(run, 'frontier-rank', 4);
    open(run, 'gn-42-palace-brain');
    r = choose(run, 'gn-42-palace-brain', 'Battle.');
    expect(r.run.battle!.enemyTeam).toHaveLength(6);
  });
});

describe('gn.42 The Factory', () => {
  it('your team waits in the back; you rent three named rentals; a win lets you swap for the loser\'s; the end brings your team back', () => {
    let run = take(frontier('t42-factory'), 'The Tower, the Factory and the Arena.', 'The Battle Factory.', 'factory');
    const mine = run.party.length === 0 ? [] : run.party.map((m) => m.uid);
    expect(mine).toEqual([]);
    const rackId = opened(run, 'gn-42-factory-rack-')!;
    expect(rackId).toMatch(/^gn-42-factory-rack-\d-1$/);
    for (let i = 0; i < 3; i += 1) run = choose(run, rackId, scene(run, rackId).labels[0]!).run;
    expect(run.party).toHaveLength(3);
    expect(run.party.every((m) => m.gn?.includes('frontier-rental'))).toBe(true);
    expect(opened(run, 'gn-42-factory-1')).toBe('gn-42-factory-1');
    run = win(choose(run, 'gn-42-factory-1', 'Battle.').run);
    expect(scene(run, 'gn-42-factory-swap-1').labels).toEqual(['Trade one of yours for their Cloyster.', 'Keep your three.']);
    const side = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.sides.find((x) => !x.used && x.eventId === 'gn-42-factory-swap-1')!;
    const swapped = chooseEvent(content, run, side.id, 0, run.party[0]!.uid);
    expect(swapped.run.party[0]!.speciesId).toBe('cloyster');
    run = choose(swapped.run, 'gn-42-factory-2', 'Retire.').run;
    expect(run.party.some((m) => m.gn?.includes('frontier-rental'))).toBe(false);
    expect(run.party.length).toBeGreaterThan(0);
  });

  it('the Foreman has heard you swapped teams with your rival', () => {
    const run = frontier('t42-foreman');
    setFlag(run, 'x-rival-swapped-teams', 1);
    open(run, 'gn-42-factory');
    expect(scene(run, 'gn-42-factory').intro).toMatch(/You've handled other people's Pokémon\. You'll be fine here\./);
  });
});

describe('gn.42 The Arena', () => {
  const battle = (): BattleState => ({ storyEffects: [] } as unknown as BattleState);
  it('the judges mark damage, hits and accuracy; a tie goes to the challenger', () => {
    const b = battle();
    arenaTurn(b, [{ type: 'move', side: 'player' }, { type: 'damage', side: 'enemy', amount: 50 }, { type: 'move', side: 'enemy' }, { type: 'miss', side: 'enemy' }], () => 100);
    arenaTurn(b, [{ type: 'move', side: 'player' }, { type: 'damage', side: 'enemy', amount: 40 }, { type: 'move', side: 'enemy' }, { type: 'damage', side: 'player', amount: 10 }], () => 100);
    expect(arenaMarks(b, 'player')).toEqual({ damage: 6, hits: 6, accuracy: 10, total: 22 });
    expect(arenaMarks(b, 'enemy')).toEqual({ damage: 1, hits: 3, accuracy: 5, total: 9 });
    expect(arenaVerdict(b).outcome).toBe('win');
    expect(arenaVerdict(battle()).outcome).toBe('win');
    const c = battle();
    arenaTurn(c, [{ type: 'move', side: 'enemy' }, { type: 'damage', side: 'player', amount: 90 }], () => 100);
    expect(arenaVerdict(c)).toMatchObject({ outcome: 'lose' });
    expect(arenaVerdict(c).line).toMatch(/The decision goes against you\./);
  });

  it('in the ring, after three turns the judges decide (the fight does not go on to a knockout)', () => {
    let run = take(frontier('t42-arena'), 'The Tower, the Factory and the Arena.', 'The Battle Arena.', 'arena');
    run = choose(run, 'gn-42-arena-1', 'Battle.').run;
    let turns = 0;
    let lines = '';
    while (run.phase === 'battle' && turns < 6) {
      for (const foe of run.battle!.enemyTeam) foe.hp = 9999;
      for (const m of run.party) m.hp = 9999;
      const r = takeTurn(content, run, { kind: 'move', index: 0 });
      lines += JSON.stringify(r.events);
      run = r.run;
      turns += 1;
    }
    expect(turns).toBe(3);
    expect(lines).toMatch(/The judges confer\. Damage \d+, hits \d+, accuracy \d+/);
  });

  it('the Judge quotes the marks she gave last time', () => {
    const run = frontier('t42-marks');
    setFlag(run, 'brain-arena-met', 1);
    setFlag(run, 'brain-arena-marks', 23);
    open(run, 'gn-42-arena-brain');
    expect(scene(run, 'gn-42-arena-brain').intro).toMatch(/I gave you 23 out of thirty\./);
  });
});

describe('gn.42 The Palace', () => {
  const foe = mon('geodude', 30, 'e-1');
  const setup = (nature: string, friendship: number): { run: RunState; b: BattleState } => {
    const run = gnRun('t42-palace');
    const m = mon('machop', 30, 'p-m');
    m.moves = [{ id: 'leer', pp: 30 }, { id: 'karate-chop', pp: 25 }, { id: 'low-kick', pp: 20 }];
    m.nature = nature as PokemonInstance['nature'];
    m.friendship = friendship;
    run.party = [m];
    const b = { activeIndex: 0, enemyIndex: 0, enemyTeam: [foe], turn: 2 } as unknown as BattleState;
    return { run, b };
  };
  const eff = (t: string): number => (t === 'fighting' ? 2 : 1);
  it('they choose by nature: brave attacks hard; a fickle one changes every turn; switching stays yours', () => {
    const { run, b } = setup('brave', 0);
    const r = palaceShape(content, run, b, { kind: 'move', index: 0 }, eff, false);
    expect(r.action).toEqual({ kind: 'move', index: 1 });
    expect(r.line).toMatch(/chooses for itself/);
    const sw = palaceShape(content, run, b, { kind: 'switch', index: 1 } as never, eff, false);
    expect(sw.action).toEqual({ kind: 'switch', index: 1 });
    const fickle = setup('quirky', 0);
    const picks = [1, 2, 3].map((t) => palaceShape(content, fickle.run, { ...fickle.b, turn: t } as BattleState, { kind: 'move', index: 0 }, eff, false).action);
    expect(new Set(picks.map((a) => (a as { index: number }).index)).size).toBe(3);
  });
  it('Bond 4: your pick stands, and it glances at you first; one turn in four it still chooses', () => {
    const { run, b } = setup('brave', 4 * content.balance.co.bondLevelStep);
    expect(palaceShape(content, run, { ...b, turn: 1 } as BattleState, { kind: 'move', index: 0 }, eff, false)).toMatchObject({ action: { kind: 'move', index: 0 }, line: expect.stringMatching(/glances at you first/) });
    expect(palaceShape(content, run, { ...b, turn: 4 } as BattleState, { kind: 'move', index: 0 }, eff, false).action).toEqual({ kind: 'move', index: 1 });
  });
  it('a lead that takes the initiative: Master Hōzan bows to it', () => {
    const run = frontier('t42-bow');
    run.story.histories[run.party[0]!.uid] = { ...(run.story.histories[run.party[0]!.uid] ?? {}), bond: { synchronization: 80, trust: 70 } } as never;
    open(run, 'gn-42-palace-brain');
    expect(scene(run, 'gn-42-palace-brain').intro).toMatch(/Master Hōzan bows to it\. Not to you\./);
  });
});

describe('gn.42 The Pike, the Dome and the Pyramid', () => {
  it('the Pike: three doors; the one that heals is where the attendant said, when she tells the truth', () => {
    let run = take(frontier('t42-pike'), 'The Pike, the Dome and the Palace.', 'The Battle Pike.', 'pike');
    const r = choose(run, 'gn-42-pike-1', 'Ask the attendant.');
    const heal = flagOf(r.run, 'pike-heal');
    const told = said(r).match(/"The (left|middle|right) door,"/)![1];
    const honest = flagOf(r.run, 'pike-true') === 1;
    expect(told === ['left', 'middle', 'right'][heal - 1]).toBe(honest);
    run = r.run;
    const healDoor = `The ${['left', 'middle', 'right'][heal - 1]} door.`;
    const after = choose(run, 'gn-42-pike-1-doors', healDoor);
    expect(said(after)).toMatch(/a bowl of fruit/);
    expect(opened(after.run, 'gn-42-pike-2')).toBe('gn-42-pike-2');
    const r2 = choose(after.run, 'gn-42-pike-2', 'Choose without asking.');
    const h2 = flagOf(r2.run, 'pike-heal');
    const fightAt = `The ${['left', 'middle', 'right'][h2 % 3]} door.`;
    expect(opened(choose(r2.run, 'gn-42-pike-2-doors', fightAt).run, 'gn-42-pike-2-fight')).toBe('gn-42-pike-2-fight');
  });

  it('the Dome: bring up to three; the rest wait on the bench and come back after', () => {
    const run = gnRun('t42-dome');
    run.party = ['pidgey', 'rattata', 'zubat', 'geodude', 'oddish'].map((s, i) => mon(s, 20, `p-d${i}`));
    for (const uid of ['p-d1', 'p-d3', 'p-d3', 'p-d4', 'p-d0']) bring(content, run, uid);
    expect(flagOf(run, 'dome-picked')).toBe(3);
    bench(run);
    expect(run.party.map((m) => m.uid)).toEqual(['p-d1', 'p-d3', 'p-d4']);
    unbench(run);
    expect(run.party.map((m) => m.uid).sort()).toEqual(['p-d0', 'p-d1', 'p-d2', 'p-d3', 'p-d4']);
    expect(run.party.some((m) => m.gn?.length)).toBe(false);
    expect(flagOf(run, 'dome-picked')).toBe(0);
  });

  it('the Pyramid: the bag stays at the door; you keep what you find inside; it is all there after', () => {
    let run = gnRun('t42-pyr');
    run.inventory = { potion: 3, 'poke-ball': 5 };
    bagLeave(run);
    expect(run.inventory).toEqual({});
    run.inventory.revive = 1;
    bagBack(run);
    expect(run.inventory).toEqual({ potion: 3, 'poke-ball': 5, revive: 1 });
    run = take(frontier('t42-pyr2', (r) => { r.inventory = { potion: 2 }; }), 'The Pyramid, the shop and the rooms upstairs.', 'The Battle Pyramid.', 'pyramid');
    expect(run.inventory.potion ?? 0).toBe(0);
    run = choose(run, 'gn-42-pyramid-1', 'Search the corners first.').run;
    expect(run.inventory.potion).toBe(1);
    run = choose(run, 'gn-42-pyramid-1-b', 'Retire.').run;
    expect(run.inventory.potion).toBe(3);
  });

  it('the shop spends Frontier points; too few and the item is locked', () => {
    let run = frontier('t42-shop');
    setFlag(run, 'frontier-points', 30);
    run = choose(run, 'gn-42-plaza', 'The Pyramid, the shop and the rooms upstairs.').run;
    run = choose(run, 'gn-42-wing-3', 'The Frontier shop.').run;
    run = choose(run, 'gn-42-shop', 'More held items.').run;
    run = choose(run, 'gn-42-shop-held-2', 'Life Orb. 30 points.').run;
    expect(flagOf(run, 'frontier-points')).toBe(0);
    const orb = content.events.get('gn-42-shop-held-2')!.choices[0]!;
    expect(orb.requires.every((c) => conditionMet(content, run, c))).toBe(false);
  });
});

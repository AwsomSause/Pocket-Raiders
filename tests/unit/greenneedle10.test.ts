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

// ---------------------------------------------------------------------------------------------------------------------
// gn.43 The Pokémon Auction (rules in src/core/greenneedle/auction.ts).
import { auctionArrive, auctionOpen, auctionRound, gavelFirst, gavelSpent, gavelStart } from '../../src/core/greenneedle/auction';

const LOTS = ['charcoal', 'fire-stone', 'helix-fossil', 'eevee', 'vulpix-alola', 'spinda'];
/** A run at the auction, the catalogue fixed (`stolen` lot, the Collector's lot), lot `n` up. */
function lot(seed: string, n: number, o: { stolen?: number; quayle?: number; money?: number } = {}): RunState {
  const run = gnRun(seed);
  run.money = o.money ?? 20000;
  auctionArrive(run, LOTS, () => 0, 1);
  setFlag(run, 'auction-stolen', o.stolen ?? 5);
  setFlag(run, 'auction-quayle', o.quayle ?? 1);
  auctionOpen(run, n);
  return run;
}
/** Holds until the lot is sold; returns Pryde's words. */
function holdOut(run: RunState): string {
  let words = '';
  for (let i = 0; i < 40 && flagOf(run, 'auction-done') === 0; i += 1) words += ` ${auctionRound(run, 'hold')}`;
  return words;
}
/** To the door, a seat, and the catalogue. */
function auction(seed: string, prep?: (run: RunState) => void): RunState {
  const run = gnRun(seed);
  run.money = 20000;
  prep?.(run);
  open(run, 'gn-43-door');
  return choose(run, 'gn-43-door', 'Take a seat.').run;
}

describe('gn.43 The Pokémon Auction: the catalogue', () => {
  it('six lots, each with what it is, a fair value and where it came from; the stolen one, "from a private collection"', () => {
    const run = auction('t43-cat');
    const stolen = flagOf(run, 'auction-stolen');
    const pages = scene(run, 'gn-43-catalogue').intro + scene(run, 'gn-43-catalogue-2').intro;
    for (let n = 1; n <= 6; n += 1) expect(pages).toContain(`**Lot ${n}.**`);
    expect(pages).toMatch(/Fair value ₽1,200\./);
    expect(pages.match(/From a private collection\./g)).toHaveLength(1);
    expect(pages).toContain(`**Lot ${stolen}.**`);
    expect(pages).not.toMatch(/\{(cast|lot|money):/);
  });

  it('a second look: naming the lot whose photograph shows a tag marks it spotted; the wrong one, nothing', () => {
    let run = auction('t43-photo');
    const stolen = flagOf(run, 'auction-stolen');
    const page = stolen <= 3 ? 'gn-43-photos' : 'gn-43-photos-2';
    run = choose(run, stolen <= 3 ? 'gn-43-catalogue' : 'gn-43-catalogue', 'Look again at the photographs.').run;
    if (stolen > 3) run = choose(run, 'gn-43-photos', 'The next three.').run;
    const wrong = stolen === 1 || stolen === 4 ? stolen + 1 : stolen - 1;
    const missed = choose(run, page, `Lot ${['one', 'two', 'three', 'four', 'five', 'six'][wrong - 1]}.`);
    expect(said(missed)).toMatch(/just a very good photograph/);
    expect(flagOf(missed.run, 'auction-spotted')).toBe(0);
    const hit = choose(run, page, `Lot ${['one', 'two', 'three', 'four', 'five', 'six'][stolen - 1]}.`);
    expect(said(hit)).toMatch(/This one has been somebody's\./);
    expect(flagOf(hit.run, 'auction-spotted')).toBe(1);
  });
});

describe('gn.43 The bidders', () => {
  it('Mrs. Roundell never goes past a round number; Mr. Dabb never wins (it goes back to the bid before his)', () => {
    const run = lot('t43-dabb', 3);
    // Fair 1,500: opens at 900. Roundell bids to 1,000 and stops there; Dabb goes on to 1,700 (115%).
    expect(flagOf(run, 'auction-price')).toBe(900);
    const words = holdOut(run);
    expect(words).toMatch(/taps her paddle, once/);
    expect(words).toMatch(/A round number\. She's done\./);
    expect(words).toMatch(/Mr\. Dabb is examining the ceiling/);
    expect(flagOf(run, 'auction-sold-3')).not.toBe(3);
  });

  it('you win at the price; it is paid, the lot comes to your seat, and you are told how far over the fair value you went', () => {
    const run = lot('t43-win', 1);
    // Bid every round: Dabb (Roundell is out at 1,000; the Collector wants lot 2 here) stops at 1,380.
    setFlag(run, 'auction-quayle', 2);
    auctionOpen(run, 1);
    let words = '';
    for (let i = 0; i < 40 && flagOf(run, 'auction-done') === 0; i += 1) words += ` ${auctionRound(run, flagOf(run, 'auction-high') === 1 ? 'hold' : 'bid')}`;
    expect(flagOf(run, 'auction-sold-1')).toBe(1);
    const paid = flagOf(run, 'auction-won');
    expect(run.money).toBe(20000 - paid);
    expect(words).toMatch(/Sold, to the trainer at the back/);
    expect(words).toMatch(/over the fair value\./);
  });

  it('the Collector wants a single lot and overpays; he sits out the others', () => {
    const run = lot('t43-quayle', 2, { quayle: 2 });
    const words = holdOut(run);
    expect(flagOf(run, 'auction-sold-2')).toBe(4);
    expect(words).toMatch(/Mr\. Quayle sits very still\. And then he doesn't\./);
    const other = lot('t43-quayle-2', 1, { quayle: 2 });
    expect(holdOut(other)).not.toMatch(/Quayle/);
  });

  it('the young woman bids on the stolen lot only, with someone else\'s limit, and looks at the door at the end of it', () => {
    const run = lot('t43-odalie', 5, { stolen: 5 });
    const words = holdOut(run);
    expect(words).toMatch(/checks a note inside her glove/);
    expect(flagOf(run, 'auction-sold-5')).toBe(5);
    expect(holdOut(lot('t43-odalie-2', 4, { stolen: 5 }))).not.toMatch(/glove/);
  });

  it('short of money, a bid is only counted out; out, the room bids on to the end', () => {
    const run = lot('t43-poor', 1, { money: 100 });
    expect(auctionRound(run, 'bid')).toMatch(/Not enough\./);
    const r2 = lot('t43-out', 1);
    auctionRound(r2, 'out');
    expect(flagOf(r2, 'auction-done')).toBe(1);
  });

  it('refused three times on the S.S. Anne: the Collector outbids you once, on principle, then sends the lot over', () => {
    const run = lot('t43-gift', 1, { quayle: 1, money: 3000 });
    setFlag(run, 'ssanne-collector-refused', 3);
    auctionOpen(run, 1);
    for (let i = 0; i < 60 && flagOf(run, 'auction-done') === 0; i += 1) auctionRound(run, flagOf(run, 'auction-high') === 1 ? 'hold' : 'bid');
    expect(flagOf(run, 'auction-sold-1')).toBe(4);
    expect(flagOf(run, 'auction-won')).toBe(-1);
    expect(flagOf(run, 'auction-quayle-gift')).toBe(1);
  });
});

describe('gn.43 The stolen lot and lot seven', () => {
  /** The auction with the stolen lot spotted, at its lot. */
  function atStolen(seed: string): { run: RunState; n: number } {
    let run = auction(seed);
    const n = flagOf(run, 'auction-stolen');
    setFlag(run, 'auction-spotted', 1);
    for (let k = 1; k < n; k += 1) setFlag(run, `auction-sold-${k}`, 0);
    run = choose(run, 'gn-43-catalogue', 'Put it down. The bidding\'s starting.').run;
    for (let k = 1; k < n; k += 1) {
      run = choose(run, `gn-43-lot-${k}`, 'Watch the bidding open.').run;
      run = choose(run, `gn-43-bid-${k}`, 'Out.').run;
    }
    return { run, n };
  }
  it('spotted: the three choices, on that lot only; "Stand up and say so." stops the sale, drops the File, and the next lot comes up', () => {
    const { run, n } = atStolen('t43-expose');
    expect(scene(run, `gn-43-lot-${n}`).labels).toEqual(['Buy it, and return it.', 'Stand up and say so.', 'Say nothing.']);
    expect(scene(run, `gn-43-lot-${n}`).intro).toMatch(/She checks a note inside her glove/);
    const r = choose(run, `gn-43-lot-${n}`, 'Stand up and say so.');
    expect(said(r)).toMatch(/Mr\. Dabb lowers his paddle for the first time in his life\./);
    expect(flagOf(r.run, 'auction-exposed')).toBe(1);
    expect(flagOf(r.run, 'rep')).toBe(2);
    expect(opened(r.run, `gn-43-lot-${n + 1}`)).toBe(`gn-43-lot-${n + 1}`);
    expect(scene(r.run, `gn-43-lot-${n + 1}`).labels).toEqual(['Watch the bidding open.']);
  });

  it('"Say nothing.": it sells to her; at the next auction, Pryde won\'t take your first bid', () => {
    const { run, n } = atStolen('t43-silent');
    const r = choose(run, `gn-43-lot-${n}`, 'Say nothing.');
    expect(flagOf(r.run, 'auction-silent')).toBe(1);
    expect(flagOf(r.run, `auction-sold-${n}`)).toBe(5);
    const next = lot('t43-silent-2', 1);
    setFlag(next, 'auction-silent', 1);
    setFlag(next, 'auction-silent-visit', 1);
    setFlag(next, 'auction-visits', 1);
    auctionArrive(next, LOTS, () => 0, 1);
    auctionOpen(next, 1);
    expect(auctionRound(next, 'bid')).toMatch(/as if it were part of the wall/);
    expect(flagOf(next, 'auction-high')).not.toBe(1);
    expect(auctionRound(next, 'bid')).toMatch(/with the trainer at the back/);
  });

  it('"Buy it, and return it.": you pay, keep nothing, and the owner pays back what they can', () => {
    const { run, n } = atStolen('t43-return');
    let r = choose(run, `gn-43-lot-${n}`, 'Buy it, and return it.').run;
    const money0 = r.money;
    for (let i = 0; i < 60 && opened(r, `gn-43-bid-${n}`); i += 1) r = choose(r, `gn-43-bid-${n}`, flagOf(r, 'auction-high') === 1 ? 'Hold.' : 'Bid.').run;
    const paid = flagOf(r, 'auction-paid-stolen');
    expect(paid).toBeGreaterThan(0);
    expect(r.money).toBe(money0 - paid);
    expect(flagOf(r, 'auction-bought-stolen')).toBe(1);
    r.story.flags['ev:auction-lot'] = n;
    setFlag(r, 'auction-lot', 6);
    open(r, 'gn-43-end');
    const back = choose(r, 'gn-43-end', 'Find the owner.');
    expect(back.run.money).toBe(r.money + Math.round((paid * 0.6) / 100) * 100);
    expect(flagOf(back.run, 'auction-returned')).toBe(1);
  });

  it('lot seven: only after exposing a stolen lot at an earlier auction; one thing, at its fair value', () => {
    const run = auction('t43-seven');
    open(run, 'gn-43-end');
    expect(scene(run, 'gn-43-end').labels).not.toContain('Pryde has a small box.');
    setFlag(run, 'auction-exposed', 1);
    setFlag(run, 'auction-exposed-at', run.regionIndex + 1);
    expect(scene(run, 'gn-43-end').labels).not.toContain('Pryde has a small box.');
    run.regionIndex += 1;
    expect(scene(run, 'gn-43-end').labels).toContain('Pryde has a small box.');
    const r = choose(run, 'gn-43-end', 'Pryde has a small box.');
    const labels = scene(r.run, 'gn-43-seven').labels;
    expect(labels).toHaveLength(2);
    expect(labels[1]).toBe('Not today.');
    expect(labels[0]).toMatch(/^(A Master Ball\. Pay ₽3,000\.|The Lapras with a full page of provenance\. Pay ₽2,500\.|The gavel itself\. Pay ₽2,000\.)$/);
  });

  it('the gavel: its holder\'s first move each battle can\'t be interrupted, and only the first', () => {
    const run = gnRun('t43-gavel');
    const m = run.party[0]!;
    m.gn = ['gavel'];
    gavelStart(run);
    expect(gavelFirst(m)).toBe(true);
    gavelSpent(m);
    expect(gavelFirst(m)).toBe(false);
    gavelStart(run);
    expect(gavelFirst(m)).toBe(true);
  });
});

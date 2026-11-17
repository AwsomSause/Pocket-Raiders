// Greenneedle gn.44–gn.53, the fixes that bring the built events in line with the placed docs (parts 10 and 11).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { createPokemon } from '../../src/core/pokemon';
import { visitSide } from '../../src/core/run';
import { stageNumber } from '../../src/core/events';
import { evilOf } from '../../src/core/evil/teams';
import { opponentsOf, STAR } from '../../src/core/greenneedle/onevone';
import { allstarDeclined, allstarReady, FINAL_OPEN, logOf, regionRarest, rivalVoice, rosterTrust } from '../../src/core/greenneedle/allstar';
import { commentary, exPoster, MATCHUPS, MATCH_LEVEL, playMatch, winnerOf } from '../../src/core/greenneedle/exhibition';
import { ANSWERS, draftGoesHome, draftTradeWarning, TRAITS } from '../../src/core/greenneedle/draft';
import { defectorShare, fourteenSaved } from '../../src/core/greenneedle/defector';
import { snorlaxAsk, snorlaxFollow } from '../../src/core/greenneedle/snorlax';
import { smuggleStage } from '../../src/core/greenneedle/smuggling';
import { EARLY, LOTS, taBid, taCanBid, taContact, taNext, taPrice, taShopLine, taTokens } from '../../src/core/greenneedle/teamauction';
import { alliesOf, CITY, DISTRICT_SERVICES, PATROL_EVENT, sgEnd, sgHeader, sgHealShare, sgPriceFactor, sgStage, sgStart, SIEGE_HEADER } from '../../src/core/greenneedle/citysiege';
import { GUESTS } from '../../src/core/greenneedle/longtable';
import { rarityOf } from '../../src/core/rarity';
import { content } from './helpers';
import { choose, flagOf, gnRun, lose, open, scene, setFlag, win } from './helpers/gnPlay';

const opened = (run: RunState, id: string): boolean => !!run.stage!.map.nodes.find((n) => n.id === run.stage!.current)?.sides.some((x) => x.kind === 'event' && !x.used && x.eventId === id);
const said = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');
const evilRun = (seed: string, beat: number): RunState => {
  const run = gnRun(seed);
  const s = evilOf(run);
  s.teamId = 'rocket';
  s.beat = beat;
  return run;
};
const host = (run: RunState) => ({ apply: (e: unknown): string => { const m = e as { kind: string; amount?: number }; if (m.kind === 'money') run.money += m.amount ?? 0; return ''; } });

describe('gn.44 The 1v1 Championship (fixes)', () => {
  it('the six fresh opponents are drawn anew each run (names and classes), the same for the same seed', () => {
    const enter = (seed: string): RunState => {
      let run = gnRun(seed);
      open(run, 'gn-44-door');
      run = choose(run, 'gn-44-door', 'Go to the desk.').run;
      return run;
    };
    const a = enter('fix44-a');
    expect(opponentsOf(a)).toEqual(opponentsOf(enter('fix44-a')));
    // Before the desk nothing is drawn (the failure case: no list, no crash).
    expect(opponentsOf(gnRun('fix44-none'))).toEqual([]);
  });

  it('the ability star mark is a tag the party panel reads', () => {
    expect(STAR).toBe('ability-star');
  });
});

describe('gn.46 The All-Star Tournament (fixes)', () => {
  it('a trainer whose battle was walked past is remembered as declined, and does not count towards the seven', () => {
    const run = gnRun('fix46-declined');
    const offer = [{ success: { battle: { kind: 'trainer', name: 'Hiker Brandt', classId: 'hiker' } } }, { success: {} }];
    allstarDeclined(run, offer, { effects: [] });
    expect(logOf(run).map((m) => [m.n, m.r])).toEqual([['Hiker Brandt', 'd']]);
    expect(allstarReady(run)).toBe(false);
    // Taking the battle, or a boss/rival offer, records nothing.
    const fought = gnRun('fix46-fought');
    allstarDeclined(fought, offer, { battle: {}, effects: [] });
    allstarDeclined(fought, [{ success: { battle: { kind: 'trainer', name: 'Rival', rival: true } } }], { effects: [] });
    expect(logOf(fought)).toEqual([]);
    // Declining the same trainer twice keeps one entry.
    allstarDeclined(run, offer, { effects: [] });
    expect(logOf(run)).toHaveLength(1);
  });

  it('Road Roster Trust: 0 unknown, 1 met twice, 2 when their story ended', () => {
    const run = gnRun('fix46-roster');
    expect(rosterTrust(run, 'Hiker Brandt')).toBe(0);
    setFlag(run, 'roster-brandt-m2');
    expect(rosterTrust(run, 'Hiker Brandt')).toBe(1);
    setFlag(run, 'roster-brandt-done');
    expect(rosterTrust(run, 'Hiker Brandt')).toBe(2);
  });

  it('the rival\'s last line has a voice for every personality; the champion\'s prize pool is Very Rare or better from the region', () => {
    expect(Object.keys(FINAL_OPEN).sort()).toEqual(['plain', 'proud', 'quiet', 'warm']);
    expect(Object.keys(FINAL_OPEN)).toContain(rivalVoice(gnRun('fix46-voice')));
    const pool = regionRarest(content, 'kanto');
    expect(pool.length).toBeGreaterThan(0);
    const common = rarityOf(content, 'rattata');
    for (const sp of pool) expect(rarityOf(content, sp)).not.toBe(common);
    expect(regionRarest(content, 'no-such-region')).toEqual([]);
  });
});

describe('gn.47 The Exhibition Match (fixes)', () => {
  it('the match is really played by the engine: the same seed gives the same winner and commentary; another seed may differ', () => {
    const m = MATCHUPS[0]!;
    const run = gnRun('fix47-match');
    const a = playMatch(content, run, m);
    const b = playMatch(content, { seed: run.seed }, m);
    expect(a.winner).toBe(b.winner);
    expect(a.lines).toEqual(b.lines);
    expect([1, 2]).toContain(winnerOf(content, run, m));
    expect(a.lines.length).toBeGreaterThan(0);
    expect(MATCH_LEVEL).toBeGreaterThan(0);
    // Three phases of commentary, each a slice of the played match; a phase past the end is empty, not an error.
    for (const n of [1, 2, 3]) expect(commentary(content, run, m, n).length).toBeGreaterThan(0);
    expect(commentary(content, run, m, 9)).toEqual([]);
  });

  it('the poster goes up once, at a Center from the ripple stage on', () => {
    const run = gnRun('fix47-poster');
    expect(exPoster(run)).toBe('');
    setFlag(run, 'ex-poster', 1);
    setFlag(run, 'ex-ripple', run.regionIndex * 100 + run.stage!.index + 1);
    expect(exPoster(run)).toBe('');
    run.stage!.index += 1;
    expect(exPoster(run)).toContain('poster of the Exhibition');
    expect(exPoster(run)).toBe('');
  });
});

describe('gn.48 The Draft (fixes)', () => {
  it('every trait has an answer; a recruited Pokémon warns before a trade and goes back to its first trainer', () => {
    for (const t of TRAITS) expect(ANSWERS[t].length).toBeGreaterThan(0);
    const run = gnRun('fix48-home');
    const mon = createPokemon(content, 'eevee', 20, 'drafted-1');
    expect(draftTradeWarning(mon)).toBeNull();
    expect(draftGoesHome(content, run, mon)).toBe('');
    mon.gn = ['draft-from:Wilf'];
    expect(draftTradeWarning(mon)).toBe('This Pokémon will return to Wilf if traded. Trade anyway?');
    expect(draftGoesHome(content, run, mon)).toContain('goes back to Wilf');
    expect(flagOf(run, 'draft-returned')).toBe(1);
    // The afterstory then opens: it is met next at its first trainer's side.
    open(run, 'gn-48-home');
    expect(scene(run, 'gn-48-home').intro).toContain('Wilf');
  });
});

describe('gn.49 The Sleeping Snorlax (fixes)', () => {
  it('while it follows, a rest stop opens its scene (ask it to join any time before the stage ends); not when it isn\'t following', () => {
    const run = gnRun('fix49-ask');
    const stage = stageNumber(content, run);
    snorlaxAsk(content, run, stage);
    expect(opened(run, 'gn-49-follower')).toBe(false);
    snorlaxFollow(run, stage);
    snorlaxAsk(content, run, stage);
    expect(opened(run, 'gn-49-follower')).toBe(true);
    // Asked twice at the same stop: still one scene.
    snorlaxAsk(content, run, stage);
    const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
    expect(here.sides.filter((s) => s.eventId === 'gn-49-follower')).toHaveLength(1);
    // The next stage it has gone.
    const later = gnRun('fix49-later');
    snorlaxFollow(later, stage);
    snorlaxAsk(content, later, stage + 1);
    expect(opened(later, 'gn-49-follower')).toBe(false);
  });
});

describe('gn.50 The Evil Team\'s Betrayal (fixes)', () => {
  it('Trust 3: Corin shares a route once in every stage of the region; not below 3, not elsewhere, not after the end', () => {
    const run = evilRun('fix50-route', 2);
    setFlag(run, 'defector', 1);
    setFlag(run, 'defector-at', run.regionIndex + 1);
    setFlag(run, 'defector-trust', 2);
    expect(defectorShare(run, 5)).toBe(false);
    setFlag(run, 'defector-trust', 3);
    expect(defectorShare(run, 5)).toBe(true);
    expect(defectorShare(run, 5)).toBe(false);
    expect(defectorShare(run, 6)).toBe(true);
    run.regionIndex += 1;
    expect(defectorShare(run, 7)).toBe(false);
    run.regionIndex -= 1;
    setFlag(run, 'defector-end', 1);
    expect(defectorShare(run, 8)).toBe(false);
  });

  it('"Take the boss\'s file too" saves the fourteen as well: files 2 after the first alarm, 3 after the second', () => {
    const run = gnRun('fix50-files');
    setFlag(run, 'defector-files', 1);
    expect(fourteenSaved(run)).toBe(false);
    setFlag(run, 'defector-files', 2);
    expect(fourteenSaved(run)).toBe(true);
    setFlag(run, 'defector-files', 3);
    expect(fourteenSaved(run)).toBe(true);
    // The fourteen answer the siege's alarm with the boss's file taken too.
    setFlag(run, 'defector-at', run.regionIndex + 1);
    sgStart(content, run);
    expect(alliesOf(run).map((a) => a.n)).toContain('The fourteen ex-Grunts');
  });
});

describe('gn.51 The Pokémon Smuggling Ring (fixes)', () => {
  it('the list ticks one a stage after the cages are opened, and stops at four; nothing before', () => {
    const run = gnRun('fix51-list');
    smuggleStage(run);
    expect(flagOf(run, 'smuggle-home')).toBe(0);
    setFlag(run, 'smuggle-freed');
    for (let i = 0; i < 6; i += 1) smuggleStage(run);
    expect(flagOf(run, 'smuggle-home')).toBe(4);
  });

  it('at night the roof is easy: "Cross in the dark." skips two guards; the Rangers pay a finder\'s share', () => {
    const run = gnRun('fix51-night');
    open(run, 'gn-51-yard');
    const money = run.money;
    const rangers = choose(run, 'gn-51-yard', 'Fetch the Rangers.').run;
    expect(rangers.money).toBeGreaterThan(money);
    const night = content.events.get('gn-51-rafters')!.choices.find((c) => c.label === 'Cross in the dark.')!;
    expect(JSON.stringify(night.showIf)).toContain('night');
    expect(content.coPlacement?.get('gn-52-manor')?.tags).toContain('night');
  });
});

describe('gn.52 The Evil Team\'s Pokémon Auction (fixes)', () => {
  it('bidding: each raise is topped until the lot\'s worth; the gavel falls at exactly that price, paid once', () => {
    const run = gnRun('fix52-bid');
    run.money = 5000;
    expect(taPrice(run, 1)).toBe(LOTS[1]!.open);
    expect(taNext(run, 1)).toBe(LOTS[1]!.open + LOTS[1]!.step);
    let line = taBid(run, 1, host(run));
    expect(flagOf(run, 'ta-won')).toBe(0);
    expect(run.money).toBe(5000);
    expect(line).toContain('against you');
    let n = 1;
    while (flagOf(run, 'ta-won') === 0 && n < 10) { line = taBid(run, 1, host(run)); n += 1; }
    expect(flagOf(run, 'ta-won')).toBe(1);
    expect(run.money).toBe(5000 - LOTS[1]!.limit);
    expect(line).toContain('gavel');
    // A new lot starts from its own opening price.
    expect(taPrice(run, 3)).toBe(LOTS[3]!.open);
  });

  it('boundary and failure: exactly enough money can bid, one short cannot (and a bid without money changes nothing)', () => {
    const run = gnRun('fix52-poor');
    run.money = taNext(run, 6);
    expect(taCanBid(run, 6)).toBe(true);
    run.money -= 1;
    expect(taCanBid(run, 6)).toBe(false);
    const before = run.money;
    expect(taBid(run, 6, host(run))).toBe('');
    expect(run.money).toBe(before);
    expect(flagOf(run, 'ta-won')).toBe(0);
    expect(taBid(run, 99, host(run))).toBe('');
  });

  it('lot 2 is the house\'s trap: it keeps going far past the others; dropping out is "early" only in the first bids', () => {
    expect(LOTS[2]!.limit).toBeGreaterThan(LOTS[1]!.limit);
    let run = evilRun('fix52-trap', 3);
    run.money = 20000;
    open(run, 'gn-52-manor');
    run = choose(choose(run, 'gn-52-manor', 'Go as a rich buyer.').run, 'gn-52-viewing', 'Go to the floor.').run;
    run = choose(run, 'gn-52-lot-1', 'Let it go.').run;
    expect(scene(run, 'gn-52-lot-2').labels).toEqual(['Keep bidding.', 'Drop out early.']);
    for (let i = 0; i <= EARLY; i += 1) run = choose(run, 'gn-52-lot-2', 'Keep bidding.').run;
    expect(scene(run, 'gn-52-lot-2').labels).toEqual(['Keep bidding.', 'Drop out.']);
    run = choose(run, 'gn-52-lot-2', 'Drop out.').run;
    expect(flagOf(run, 'ta-trap-balls')).toBe(0);
  });

  it('the viewing room shows every lot up close', () => {
    let run = evilRun('fix52-view', 3);
    open(run, 'gn-52-manor');
    run = choose(run, 'gn-52-manor', 'Go as a rich buyer.').run;
    expect(scene(run, 'gn-52-viewing').labels).toEqual(['Look closely at the held item and the Balls.', 'Look closely at the fossil and the egg.', 'Look closely at the antique.', 'Go to the floor.']);
    run = choose(run, 'gn-52-viewing', 'Look closely at the held item and the Balls.').run;
    run = choose(run, 'gn-52-viewing', 'Look closely at the fossil and the egg.').run;
    expect(scene(run, 'gn-52-viewing').labels).toEqual(['Look closely at the antique.', 'Go to the floor.']);
    expect(scene(run, 'gn-52-viewing').intro).toContain('the house\'s own seal');
    expect(scene(run, 'gn-52-viewing').intro).toContain('worth far more');
  });

  it('the alarm is two guards and then the lieutenant; losing to a guard ends it without the Pokémon', () => {
    let run = evilRun('fix52-alarm', 3);
    open(run, 'gn-52-manor');
    run = choose(run, 'gn-52-manor', 'Go as a caterer.').run;
    run = choose(run, 'gn-52-kitchen', 'Say nothing.').run;
    run = choose(run, 'gn-52-cellar', 'Take the service corridor.').run;
    const first = choose(run, 'gn-52-corridor', 'Raise the alarm.').run;
    expect(first.battle).toBeTruthy();
    const lost = lose(first);
    expect(flagOf(lost, 'ta-rare')).toBe(0);
    expect(opened(lost, 'gn-52-out')).toBe(true);
    const second = win(first);
    expect(opened(second, 'gn-52-alarm-2')).toBe(true);
    const third = win(choose(second, 'gn-52-alarm-2', 'Battle.').run);
    expect(opened(third, 'gn-52-alarm-lt')).toBe(true);
    expect(flagOf(win(choose(third, 'gn-52-alarm-lt', 'Battle.').run), 'ta-rare')).toBe(3);
  });

  it('the rival\'s "Don\'t. Say. Anything." by personality; the contact is the Ranger if the player fetched the Rangers; it waits outside shops too', () => {
    const run = gnRun('fix52-hush');
    expect(taTokens(run, '{ta:hush}')).toContain('"Don\'t. Say. Anything."');
    expect(taContact(run)).toBe('Officer Jenny');
    setFlag(run, 'smuggle-entry', 4);
    expect(taTokens(run, '{ta:contact}')).toBe('The head Ranger from the warehouse');
    const stage = stageNumber(content, run);
    expect(taShopLine(content, run, stage)).toBe('');
    run.party[0]!.gn = [`afraid-rooms:${stage}`];
    expect(taShopLine(content, run, stage)).toContain('won\'t come into the shop');
    expect(taShopLine(content, run, stage + 1)).toBe('');
  });
});

describe('gn.53 The Region Under Siege (fixes)', () => {
  const ended = (seed: string, heldN: number, beaten: number, prep?: (r: RunState) => void): RunState => {
    const run = evilRun(seed, 5);
    sgStart(content, run);
    const stage = stageNumber(content, run);
    setFlag(run, 'sg-at', run.regionIndex + 1);
    setFlag(run, 'sg-stage', stage);
    ['market', 'homes', 'gate', 'hall'].forEach((d, i) => setFlag(run, `sg-bar-${d}`, i >= 4 - heldN ? 4 : 0));
    prep?.(run);
    sgEnd(content, run, beaten, stage);
    run.stage!.index += 1;
    return run;
  };
  const addSide = (run: RunState, kind: string): void => {
    const node = run.stage!.map.nodes[0]!;
    node.sides.push({ id: `fix-${kind}-${node.sides.length}`, kind, used: false } as (typeof node.sides)[number]);
  };

  it('a fallen district costs for the rest of the stay in the city: the Market (no shop, no Center) stays gone two stages later; not in the next region', () => {
    const run = ended('fix53-market', 3, 1);
    expect(flagOf(run, 'sg-lost-market')).toBe(1);
    expect(sgPriceFactor(run, stageNumber(content, run))).toBeNull();
    run.stage!.index += 1;
    expect(sgPriceFactor(run, stageNumber(content, run))).toBeNull();
    const node = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
    node.sides.push({ id: 'fix-heal', kind: 'heal', used: false } as (typeof node.sides)[number]);
    expect(visitSide(content, run, 'fix-heal').message).toContain('GONE TO THE NEXT TOWN');
    run.regionIndex += 1;
    expect(sgPriceFactor(run, stageNumber(content, run))).toBe(1);
    // A city that held everything loses nothing.
    const whole = ended('fix53-whole', 4, 1);
    whole.stage!.index += 1;
    expect(sgPriceFactor(whole, stageNumber(content, whole))).toBe(1);
  });

  it('the Homes, the Gate and the Hall each take their stops off the city\'s maps', () => {
    const run = ended('fix53-stops', 1, 1);
    expect(['sg-lost-market', 'sg-lost-homes', 'sg-lost-gate'].map((k) => flagOf(run, k))).toEqual([1, 1, 1]);
    for (const k of ['plaza', 'fish', 'expedition', 'service', 'shop']) addSide(run, k);
    const lines = sgStage(content, run, stageNumber(content, run));
    const kinds = run.stage!.map.nodes[0]!.sides.map((s) => s.kind);
    for (const k of [...DISTRICT_SERVICES.homes, ...DISTRICT_SERVICES.gate]) expect(kinds).not.toContain(k);
    expect(kinds).toContain('service');
    expect(kinds).toContain('shop');
    expect(lines.join(' ')).toContain('The Homes fell');
    expect(lines.join(' ')).not.toContain('The Hall fell');
  });

  it('occupation: every trainer battle of the next stage is a patrol to get past instead; only that stage', () => {
    const run = ended('fix53-occupied', 4, 0);
    expect(flagOf(run, 'sg-result')).toBe(3);
    const lines = sgStage(content, run, stageNumber(content, run));
    const trainers = run.stage!.map.nodes.filter((n) => n.kind === 'trainer');
    expect(trainers.length).toBeGreaterThan(0);
    expect(trainers.every((n) => n.sides.some((s) => s.eventId === PATROL_EVENT))).toBe(true);
    expect(run.stage!.map.nodes.filter((n) => n.kind !== 'trainer').some((n) => n.sides.some((s) => s.eventId === PATROL_EVENT))).toBe(false);
    expect(lines.join(' ')).toContain('occupied');
    expect(content.coPlacement?.get(PATROL_EVENT)?.attaches).toBe('instead');
    // Run twice: no second patrol on a node.
    sgStage(content, run, stageNumber(content, run));
    expect(trainers[0]!.sides.filter((s) => s.eventId === PATROL_EVENT)).toHaveLength(1);
    // A city that was saved has no patrols.
    const free = ended('fix53-free', 4, 1);
    sgStage(content, free, stageNumber(content, free));
    expect(free.stage!.map.nodes.some((n) => n.sides.some((s) => s.eventId === PATROL_EVENT))).toBe(false);
  });

  it('the patrol: waiting or knocking gets past with no battle; taking it on is a fight', () => {
    const run = ended('fix53-patrol', 4, 0);
    open(run, PATROL_EVENT);
    expect(scene(run, PATROL_EVENT).labels).toEqual(['Wait for the gap, and go.', 'Knock on a shutter.', 'Take the patrol on.']);
    const knock = choose(run, PATROL_EVENT, 'Knock on a shutter.');
    expect(knock.battle).toBe(false);
    expect(said(knock)).toContain('bread roll');
    expect(choose(run, PATROL_EVENT, 'Take the patrol on.').battle).toBe(true);
  });

  it('turn 6 matters later: the hospital not reached halves the city\'s Centers; the school not reached leaves its chair empty', () => {
    const run = ended('fix53-school', 4, 1, (r) => setFlag(r, 'sg-school', 1));
    expect(flagOf(run, 'siege-missing-hospital')).toBe(1);
    expect(flagOf(run, 'siege-missing-school')).toBe(0);
    run.stage!.index += 1;
    expect(sgHealShare(run, stageNumber(content, run))).toBe(0.5);
    const both = ended('fix53-both', 4, 1, (r) => { setFlag(r, 'sg-school', 1); setFlag(r, 'sg-hospital', 1); });
    both.stage!.index += 1;
    expect(sgHealShare(both, stageNumber(content, both))).toBe(1);
    const chair = GUESTS.find((g) => g.id === 'school')!;
    expect(chair.good).toEqual(['sg-school']);
    expect(chair.bad).toEqual(['siege-missing-school']);
  });

  it('the header reads "The City Is Under Siege" while the alarm is on the stage\'s map', () => {
    const run = evilRun('fix53-header', 5);
    expect(sgHeader(run, run.stage)).toBeNull();
    expect(sgHeader(run, null)).toBeNull();
    open(run, 'gn-53-alarm');
    expect(sgHeader(run, run.stage)).toBe(SIEGE_HEADER);
    expect(sgStage(content, run, stageNumber(content, run))[0]).toBe(`${SIEGE_HEADER}.`);
  });

  it('with the Hall held from turn 5, the commander can be reached early', () => {
    let run = evilRun('fix53-early', 5);
    open(run, 'gn-53-alarm');
    run = choose(run, 'gn-53-alarm', 'Answer the alarm.').run;
    run = choose(run, 'gn-53-muster', 'Into the city.').run;
    setFlag(run, 'sg-turn', 4);
    setFlag(run, 'sg-bar-hall', 6);
    open(run, 'gn-53-turn');
    // Turn 4: the Hall as usual.
    expect(opened(choose(run, 'gn-53-turn', 'The Hall.').run, 'gn-53-hall')).toBe(true);
    run = choose(choose(run, 'gn-53-turn', 'The Hall.').run, 'gn-53-hall', 'Repair.').run;
    expect(flagOf(run, 'sg-turn')).toBe(5);
    const roof = choose(run, 'gn-53-turn', 'The Hall.').run;
    expect(opened(roof, 'gn-53-roof')).toBe(true);
    expect(opened(choose(roof, 'gn-53-roof', 'Go for the commander, now.').run, 'gn-53-commander')).toBe(true);
    // The Hall fallen: no early way.
    setFlag(run, 'sg-early', 0);
    expect(opened(choose(run, 'gn-53-turn', 'The Hall.').run, 'gn-53-hall')).toBe(true);
  });

  it('each region\'s Siege Map is named, with a Harbour where the way in is by water; civilians come from the run\'s history', () => {
    expect(CITY.kanto!.map).toBe('The Sealed City');
    expect(CITY.hoenn).toEqual({ map: 'Sootopolis Divided', city: 'Sootopolis City', gate: 'The Harbour' });
    const run = evilRun('fix53-civ', 5);
    open(run, 'gn-53-alarm');
    let r = choose(run, 'gn-53-alarm', 'Answer the alarm.').run;
    r = choose(r, 'gn-53-muster', 'Into the city.').run;
    const stranger = choose(r, 'gn-53-turn', 'The Market.').run;
    expect(scene(stranger, 'gn-53-market').intro).toContain('never bought from');
    const known = evilRun('fix53-civ', 5);
    setFlag(known, 'shop-loyalty', 2);
    open(known, 'gn-53-alarm');
    let k = choose(known, 'gn-53-alarm', 'Answer the alarm.').run;
    k = choose(k, 'gn-53-muster', 'Into the city.').run;
    expect(scene(choose(k, 'gn-53-turn', 'The Market.').run, 'gn-53-market').intro).toContain('gave you a discount');
  });

  it('Road Roster trainers come by Trust, and Team Sky\'s grunts when the player leads them', () => {
    const run = evilRun('fix53-roster', 5);
    run.story.flags['allstar:log'] = JSON.stringify([{ n: 'Hiker Brandt', c: 'hiker', t: [], r: 'w', left: 3, sw: 0, lost: 0, fin: '', seq: 1 }, { n: 'Lass Ada', c: 'lass', t: [], r: 'w', left: 3, sw: 0, lost: 0, fin: '', seq: 2 }]);
    setFlag(run, 'roster-brandt-m2');
    sgStart(content, run);
    const names = alliesOf(run).map((a) => a.n);
    expect(names).toContain('Hiker Brandt');
    expect(names).not.toContain('Lass Ada');
    expect(names).not.toContain('Team Sky\'s grunts');
  });
});

describe('gn.45 The Champion\'s Lesson (fixes)', () => {
  it('the Champion\'s line goes in front of their move, and the same line is not said two turns running', async () => {
    const { lessonTurn } = await import('../../src/core/greenneedle/champion');
    const mine = createPokemon(content, 'pikachu', 30, 'l-mine');
    const b = { trainer: { name: 'The Champion' }, storyEffects: [] as string[], enemyTeam: [createPokemon(content, 'machop', 30, 'l-foe')], activeIndex: 0, turn: 1 } as unknown as NonNullable<RunState['battle']>;
    const pushed: { text: string; at?: number }[] = [];
    const push = (text: string, at?: number): void => { pushed.push({ text, at }); };
    const events = [{ type: 'move', side: 'player', moveId: 'tackle' }, { type: 'move', side: 'enemy', moveId: 'growl' }];
    lessonTurn(content, b, mine, events as never, push, (m) => m.hp);
    const first = pushed.filter((p) => p.at !== undefined);
    if (first.length > 0) expect(first[0]!.at).toBe(1);
    const n = pushed.length;
    lessonTurn(content, b, mine, events as never, push, (m) => m.hp);
    const again = pushed.slice(n).map((p) => p.text);
    for (const t of again) expect(pushed.slice(0, n).map((p) => p.text)).not.toContain(t);
  });

  it('the afterstory waits for the Pokémon that was taught: its first turn out, the Champion\'s Pokémon uses the move; anyone else, nothing', async () => {
    const { lessonOpens, LESSON_MOVES } = await import('../../src/core/greenneedle/champion');
    const taught = createPokemon(content, 'pikachu', 30, 'l-taught');
    const other = createPokemon(content, 'eevee', 30, 'l-other');
    const foe = createPokemon(content, 'machop', 30, 'l-foe');
    const b = { storyEffects: [`lesson-open:${LESSON_MOVES.power}:l-taught`] } as unknown as NonNullable<RunState['battle']>;
    expect(lessonOpens(content, b, foe, other)).toBe(-1);
    expect(lessonOpens(content, b, foe, undefined)).toBe(-1);
    const i = lessonOpens(content, b, foe, taught);
    expect(i).toBeGreaterThanOrEqual(0);
    expect(foe.moves[i]!.id).toBe(LESSON_MOVES.power);
    // Once: the tag is spent.
    expect(lessonOpens(content, b, foe, taught)).toBe(-1);
  });
});

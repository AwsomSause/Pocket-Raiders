// Greenneedle part 11: gn.44 The 1v1 Championship (tools/events/co/greenneedle-11.ts; rules in src/core/greenneedle/onevone.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { createPokemon, getSpecies } from '../../src/core/pokemon';
import { typeEffectiveness } from '../../src/core/battle/damage';
import type { TypeName } from '../../src/core/contentSchema';
import { CHAMPION_NAME, DOLORES, GIDEON, STAR, starKindOf, starPinch } from '../../src/core/greenneedle/onevone';
import { castOf } from '../../src/core/greenneedle';
import { chooseEvent } from '../../src/core/events';
import { content } from './helpers';
import { choose, flagOf, gnRun, lose, open, scene, setFlag, win } from './helpers/gnPlay';

const said = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');
const opened = (run: RunState, id: string): boolean => !!run.stage!.map.nodes.find((n) => n.id === run.stage!.current)?.sides.some((x) => x.kind === 'event' && !x.used && x.eventId === id);

/** A party of three, to the desk, and the starter entered. */
function entered(seed: string, prep?: (run: RunState) => void): RunState {
  let run = gnRun(seed);
  run.party = [...run.party, createPokemon(content, 'pidgey', 20, 'p-pidgey'), createPokemon(content, 'rattata', 20, 'p-rattata')];
  prep?.(run);
  open(run, 'gn-44-door');
  run = choose(run, 'gn-44-door', 'Go to the desk.').run;
  const side = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.sides.find((x) => !x.used && x.eventId === 'gn-44-desk')!;
  return chooseEvent(content, run, side.id, 0, run.party[0]!.uid).run;
}
/** Fights round `i` to a win (and the short choice after it, when there is one). */
function winRound(run: RunState, i: number, between = 'Let it rest.'): RunState {
  run = win(choose(run, `gn-44-round-${i}`, 'Battle.').run);
  if (i === 2 || i === 4 || i === 6) run = choose(run, `gn-44-break-${i}`, between).run;
  return run;
}

describe('gn.44 The 1v1 Championship', () => {
  it('one Pokémon, picked at the desk; the others wait on the bench; eight opponents drawn, two always the same', () => {
    const run = entered('t44-desk');
    expect(run.party).toHaveLength(1);
    expect(run.box.map((m) => m.uid)).toEqual(expect.arrayContaining(['p-pidgey', 'p-rattata']));
    expect(castOf(run, 'onevone-foe-3')).toBe(GIDEON[0]);
    expect(castOf(run, 'onevone-foe-6')).toBe(DOLORES);
    const entrant = getSpecies(content, run.party[0]!.speciesId).types as TypeName[];
    expect(typeEffectiveness(content.typeChart, getSpecies(content, castOf(run, 'onevone-foe-4')!).types[0] as TypeName, entrant)).toBeGreaterThanOrEqual(2);
    expect(typeEffectiveness(content.typeChart, entrant[0]!, getSpecies(content, castOf(run, 'onevone-foe-5')!).types as TypeName[])).toBeGreaterThanOrEqual(2);
  });

  it('each opponent sends one, at the entrant\'s level; the champion one higher, holding something', () => {
    const run = entered('t44-level');
    const r = choose(run, 'gn-44-round-1', 'Battle.');
    expect(r.run.battle!.enemyTeam).toHaveLength(1);
    expect(r.run.battle!.enemyTeam[0]!.speciesId).toBe(castOf(run, 'onevone-foe-1'));
    expect(r.run.battle!.enemyTeam[0]!.level).toBe(run.party[0]!.level);
    expect(scene(run, 'gn-44-round-8').intro).toContain(`The reigning champion, ${CHAMPION_NAME[run.regionOrder[run.regionIndex]!]}, comes down`);
    open(run, 'gn-44-round-8');
    const final = choose(run, 'gn-44-round-8', 'Battle.');
    expect(final.run.battle!.enemyTeam[0]!.level).toBe(run.party[0]!.level + 1);
    expect(Object.keys(final.run.battle!.enemyTeam[0]!.held ?? {})).toHaveLength(1);
  });

  it('prize money for rounds 1-3, a held item for its type from round 4; lose once and it\'s over, the team back', () => {
    let run = entered('t44-lose');
    const money = run.money;
    run = winRound(winRound(winRound(run, 1), 2), 3);
    // The prizes, on top of what any trainer pays out.
    expect(run.money - money).toBeGreaterThanOrEqual(500 + 800 + 1100);
    run = lose(choose(run, 'gn-44-round-4', 'Battle.').run);
    expect(run.phase).toBe('map');
    expect(flagOf(run, 'onevone-round')).toBe(3);
    expect(run.party).toHaveLength(3);
    expect(opened(run, 'gn-44-out')).toBe(true);
  });

  it('between rounds: talk to it once per tournament; watching shows the next one and what it holds', () => {
    let run = entered('t44-break');
    run = winRound(winRound(run, 1), 2, 'Talk to it.');
    expect(flagOf(run, 'onevone-talked')).toBe(1);
    run = winRound(winRound(run, 3), 4, 'Let it rest.');
    expect(scene(run, 'gn-44-round-5').labels).toEqual(['Battle.']);
    run = win(choose(run, 'gn-44-round-5', 'Battle.').run);
    run = win(choose(run, 'gn-44-round-6', 'Battle.').run);
    expect(scene(run, 'gn-44-break-6').labels).toEqual(['Let it rest.', 'Watch the next opponent.']);
    const w = choose(run, 'gn-44-break-6', 'Watch the next opponent.');
    const name = content.species.get(castOf(run, 'onevone-foe-7')!)!.name;
    expect(said(w)).toContain(`A ${name}, holding`);
    expect(said(w)).not.toMatch(/\{/);
  });

  it('champion: the title, a star beside its ability, both belts remembered; the bench comes back', () => {
    let run = entered('t44-champ', (r) => { r.party[0]!.champion = true; });
    for (let i = 1; i <= 8; i += 1) run = winRound(run, i);
    const mon = run.party[0]!;
    expect(mon.care?.nickname).toBe(`Champion ${content.species.get(mon.speciesId)!.name}`);
    expect(mon.gn).toContain(STAR);
    expect(mon.marks).toContain('Champion of the 1v1 Championship');
    expect(run.party).toHaveLength(3);
    expect(flagOf(run, 'onevone-round')).toBe(8);
    expect(scene(run, 'gn-44-champion').intro).toMatch(/It wears both belts now\./);
  });

  it('Gideon and Dolores remember the last entrant: the same one, or a different one', () => {
    let run = entered('t44-again');
    run = lose(choose(run, 'gn-44-round-1', 'Battle.').run);
    setFlag(run, 'onevone-at', 0);
    open(run, 'gn-44-door');
    run = choose(run, 'gn-44-door', 'Go to the desk.').run;
    const side = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.sides.find((x) => !x.used && x.eventId === 'gn-44-desk')!;
    const same = chooseEvent(content, run, side.id, 0, run.party[0]!.uid).run;
    const name = content.species.get(same.party[0]!.speciesId)!.name;
    expect(scene(same, 'gn-44-round-3').intro).toContain(`The ${name} again! Good.`);
    expect(scene(same, 'gn-44-round-6').intro).toMatch(/You came back with the same one\./);
    expect(scene(same, 'gn-44-round-8').intro).toMatch(/They said you'd bring it again\./);
    const other = chooseEvent(content, run, side.id, 0, 'p-pidgey').run;
    expect(scene(other, 'gn-44-round-3').intro).toMatch(/New one this year\? Smart\./);
    expect(scene(other, 'gn-44-round-6').intro).toMatch(/And what did the last one think about that\?/);
  });

  it('the star, by kind of ability: Blaze starts at half HP; anything else, +5% to its best stat', () => {
    expect(['intimidate', 'blaze', 'sturdy', 'run-away'].map(starKindOf)).toEqual(['entry', 'pinch', 'guard', 'other']);
    const char = createPokemon(content, 'charmander', 20, 'p-c');
    expect(starPinch(content, char)).toBe(false);
    char.gn = [STAR];
    expect(starPinch(content, char)).toBe(true);
  });
});

// ---------- gn.45 The Champion's Training Session ----------
import { champPower, lessonAfterstory, lessonChampion, lessonMoveFor, lessonPupil, lessonTurn, PUPIL, seenItFirst, summitSaves } from '../../src/core/greenneedle/champion';
import { calcStats, maxHp } from '../../src/core/pokemon';

const region = (run: RunState): string => run.regionOrder[run.regionIndex]!;
/** At the field, "Stand there.", and into the lesson. */
function lesson(seed: string, prep?: (run: RunState) => void): RunState {
  const run = gnRun(seed);
  run.party = [...run.party, createPokemon(content, 'pidgey', 20, 'p-pidgey'), createPokemon(content, 'rattata', 20, 'p-rattata')];
  setFlag(run, 'rep', 3);
  prep?.(run);
  open(run, 'gn-45-field');
  return choose(run, 'gn-45-field', 'Stand there.').run;
}

describe('gn.45 The Champion\'s Training Session', () => {
  it('needs Reputation 3 and happens once a run; the region\'s own Champion, named in the opening', () => {
    const e = content.events.get('gn-45-field')!;
    expect(JSON.stringify(e.requires)).toContain('rep');
    const run = gnRun('t45-open');
    const champ = content.bosses.get(lessonChampion(content, run, region(run)))!;
    expect(scene(run, 'gn-45-field').intro).toContain(`It's ${champ.name}. The Champion.`);
    const after = lesson('t45-open');
    expect(flagOf(after, 'champ-lesson')).toBe(1);
    expect(castOf(after, 'lesson-champion')).toBe(champ.id);
    expect(opened(after, 'gn-45-lesson')).toBe(true);
  });

  it('the lesson: three of the Champion\'s own team at A−1, under their name; it ends once all three have been out', () => {
    const run = lesson('t45-lesson');
    const r = choose(run, 'gn-45-lesson', 'Battle.');
    const b = r.run.battle!;
    const champ = content.bosses.get(castOf(run, 'lesson-champion')!)!;
    expect(b.enemyTeam.map((m) => m.speciesId)).toEqual(champ.signature.filter((s) => content.species.has(s)).slice(0, 3));
    expect(b.trainer!.name).toBe(champ.name);
    // Turn by turn: each line once, then the end.
    const said: string[] = [];
    const push = (t: string) => said.push(t);
    const hp = (m: typeof b.enemyTeam[number]) => maxHp(content, m);
    const mine = r.run.party[b.activeIndex]!;
    lessonTurn(content, b, mine, [{ type: 'move', side: 'enemy', moveId: 'growl' }], push, hp);
    expect(said.join(' ')).toContain('You\'re waiting for me to attack. So I won\'t.');
    b.enemySwitches = 1;
    b.enemyIndex = 1;
    lessonTurn(content, b, mine, [], push, hp);
    lessonTurn(content, b, mine, [], push, hp);
    expect(said.filter((s) => s.includes('Those aren\'t the same thing.'))).toHaveLength(1);
    expect(b.outcome).toBeFalsy();
    b.enemyIndex = 2;
    lessonTurn(content, b, mine, [], push, hp);
    expect(b.outcome).toBeFalsy();
    lessonTurn(content, b, mine, [], push, hp);
    expect(b.outcome).toBe('win');
    expect(said.at(-1)).toContain('That\'s the lesson.');
  });

  it('win or lose, the lesson leads to the montage; it singles one out, +10% to its lowest stat and Bond +1', () => {
    let run = lesson('t45-montage', (r) => {
      for (const m of r.party) m.friendship = 0;
      r.party[1]!.friendship = 120; // Bond 2, never fought: the one it picks
    });
    const r = choose(run, 'gn-45-lesson', 'Battle.');
    run = win(r.run);
    expect(opened(run, 'gn-45-montage')).toBe(true);
    const pupil = run.party.find((m) => m.gn?.includes(PUPIL))!;
    expect(pupil.uid).toBe('p-pidgey');
    expect(scene(run, 'gn-45-montage').intro).toContain(`It's your ${content.species.get(pupil.speciesId)!.name}.`);
    const before = calcStats(content, pupil);
    const keys = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
    const low = keys.reduce((a, k) => (before[k] < before[a] ? k : a), 'hp' as (typeof keys)[number]);
    const m = choose(run, 'gn-45-montage', 'Take it back.');
    const after = m.run.party.find((x) => x.uid === 'p-pidgey')!;
    expect(after.eventBoosts?.[low]).toBe(10);
    expect(after.friendship).toBe(125);
    expect(said(m)).toContain('rose by 10%');
    expect(opened(m.run, 'gn-45-exam')).toBe(true);
  });

  it('the pick: highest Bond that fought least; else the one fainted most; else the newest', () => {
    const run = gnRun('t45-pick');
    run.party = [...run.party, createPokemon(content, 'pidgey', 20, 'a'), createPokemon(content, 'rattata', 20, 'b')];
    for (const m of run.party) m.friendship = 0;
    expect(lessonPupil(content, run)!.uid).toBe('b');
    run.story.histories['a'] = { ...(run.story.histories['a'] ?? {}), knockoutsTaken: 2 } as never;
    expect(lessonPupil(content, run)!.uid).toBe('a');
    run.party[0]!.friendship = 60;
    expect(lessonPupil(content, run)!.uid).toBe(run.party[0]!.uid);
  });

  it('the exam: "Not today." ends it; a loss heals the team, no cost; a win teaches the ace its move', () => {
    let run = win(choose(lesson('t45-exam'), 'gn-45-lesson', 'Battle.').run);
    run = choose(run, 'gn-45-montage', 'Take it back.').run;
    expect(scene(run, 'gn-45-exam').labels).toEqual(['Yes.', 'Not today.']);
    const no = choose(run, 'gn-45-exam', 'Not today.');
    expect(no.text).toContain('I\'m off duty.');
    run = choose(run, 'gn-45-exam', 'Yes.').run;
    const fight = choose(run, 'gn-45-final', 'Battle.');
    expect(fight.run.battle!.enemyTeam).toHaveLength(6);
    const lost = lose(fight.run);
    expect(lost.phase).toBe('map');
    expect(opened(lost, 'gn-45-failed')).toBe(true);
    expect(lost.party.every((m) => m.hp === maxHp(content, m))).toBe(true);
    const won = win(fight.run);
    expect(flagOf(won, 'champ-exam-passed')).toBe(1);
    const move = castOf(won, 'lesson-move')!;
    expect(['summit', 'the-long-game', 'with-you', 'seen-it']).toContain(move);
    expect(won.party.some((m) => m.moves.some((x) => x.id === move))).toBe(true);
    expect(scene(won, 'gn-45-passed').intro).toContain(content.moves.get(move)!.name);
  });

  it('the rival ahead (Lead +2) was here last week', () => {
    const run = gnRun('t45-rival');
    expect(scene(run, 'gn-45-exam').intro).not.toContain('Your friend was here last week');
    run.story.rivals = [{ ...(run.story.rivals[0] ?? {}), id: 'r1', world: { lead: 2, badges: 0, region: 0, regionsDone: 0, wins: 0, defeats: 0, fame: 0, milestones: [] } } as never];
    expect(scene(run, 'gn-45-exam').intro).toContain('Your friend was here last week');
  });

  it('the four moves: Summit can\'t miss at full HP (once), The Long Game and With You grow, Seen It goes first on a fresh arrival (once)', () => {
    const run = gnRun('t45-moves');
    const mon = run.party[0]!;
    const battle = { storyEffects: [] as string[] } as unknown as NonNullable<RunState['battle']>;
    mon.hp = maxHp(content, mon);
    expect(summitSaves(content, battle, mon, 'summit')).toBe(true);
    expect(summitSaves(content, battle, mon, 'summit')).toBe(false);
    expect(champPower(content, mon, 'the-long-game', 85, 0)).toBe(85);
    expect(champPower(content, mon, 'the-long-game', 85, 2)).toBe(105);
    expect(champPower(content, mon, 'the-long-game', 85, 9)).toBe(125);
    mon.friendship = 0;
    expect(champPower(content, mon, 'with-you', 85, 0)).toBe(85);
    mon.friendship = 255;
    expect(champPower(content, mon, 'with-you', 85, 0)).toBe(100);
    battle.storyEffects = [];
    expect(seenItFirst(battle, run.party[0]!, 'seen-it', 0)).toBe(true);
    expect(seenItFirst(battle, run.party[0]!, 'seen-it', 1)).toBe(false);
    expect(lessonMoveFor(content, mon)).toBe('with-you');
    for (const id of ['summit', 'the-long-game', 'with-you', 'seen-it']) expect(content.moves.get(id)?.power).toBe(85);
  });

  it('afterstory: at the real Champion battle, the Champion who taught it opens with the move', () => {
    const run = gnRun('t45-after');
    const champ = lessonChampion(content, run, region(run));
    run.story.flags[`ev:cast-lesson-champion:${champ}`] = 1;
    run.story.flags['ev:cast-lesson-move:seen-it'] = 1;
    setFlag(run, 'champ-exam-passed', 1);
    const lead = createPokemon(content, 'dragonite', 60, 'foe');
    run.stage = { ...run.stage!, kind: 'league', leaderId: champ } as never;
    run.battle = { kind: 'trainer', enemyTeam: [lead], enemyIndex: 0, storyEffects: [], trainer: { classId: 'champion', name: 'Champ', leaderId: champ } } as unknown as RunState['battle'];
    expect(lessonAfterstory(content, run)).toBe('Champ: "Let\'s see if it took."');
    expect(lead.moves.some((m) => m.id === 'seen-it')).toBe(true);
    expect(run.battle!.lesson?.foeMove).toBe('seen-it');
    run.battle!.trainer!.leaderId = 'someone-else';
    expect(lessonAfterstory(content, run)).toBe('');
  });
});

// ---------- gn.46 The All-Star Tournament ----------
import { allstarRecord, allstarTurn, answerTo, logOf, RARE } from '../../src/core/greenneedle/allstar';
import { FOE_WAITS } from '../../src/core/greenneedle';
import { featuredRival } from '../../src/core/rivals/living';

/** A foe too strong to beat (level 100, same uid). */
const makeStrong = (foe: { speciesId: string; uid: string }) => createPokemon(content, foe.speciesId, 100, foe.uid);
/** A finished trainer fight, recorded the way finishBattle records it. */
function met(run: RunState, name: string, team: string[], outcome: 'win' | 'lose', o: { left?: number; moved?: boolean; cls?: string; leaderId?: string } = {}): void {
  const party = run.party;
  run.party = party.map((m, i) => ({ ...m, hp: i < (o.left ?? party.length) ? Math.max(1, m.hp) : 0 }));
  run.battle = { kind: 'trainer', outcome, activeIndex: 0, enemyTeam: team.map((s, i) => createPokemon(content, s, 20, `${name}-${i}`)), storyEffects: [], trainer: { classId: o.cls ?? 'youngster', name, leaderId: o.leaderId ?? null } } as unknown as RunState['battle'];
  allstarTurn(run.battle, o.moved === false ? [] : [{ type: 'move', side: 'enemy' }]);
  allstarRecord(run);
  run.battle = null;
  run.party = party;
}
/** Seven trainers met: Joey (lost to), Ann (one left), Damian, and four ordinary wins (Sam a sweep). */
function seven(run: RunState, lostTo = true): void {
  run.party = [...run.party, createPokemon(content, 'pidgey', 20, 'p2'), createPokemon(content, 'rattata', 20, 'p3')];
  met(run, 'Youngster Joey', ['rattata', 'pidgey'], lostTo ? 'lose' : 'win', { left: 2 });
  met(run, 'Lass Ann', ['oddish'], 'win', { left: 1 });
  met(run, 'Damian', ['magikarp'], 'win', { left: 3 });
  met(run, 'Bug Catcher Sam', ['caterpie', 'weedle'], 'win', { left: 3, moved: false });
  for (const n of ['Hiker Bo', 'Camper Ty', 'Picnicker Lu']) met(run, n, ['geodude'], 'win', { left: 2 });
}

describe('gn.46 The All-Star Tournament', () => {
  it('every trainer fight is logged: the result, a sweep, how many were left; bosses are not', () => {
    const run = gnRun('t46-log');
    seven(run);
    met(run, 'Brock', ['onix'], 'win', { leaderId: 'brock', cls: 'gym-leader' });
    const log = logOf(run);
    expect(log).toHaveLength(7);
    expect(log.find((m) => m.n === 'Youngster Joey')).toMatchObject({ r: 'l', lost: 1 });
    expect(log.find((m) => m.n === 'Bug Catcher Sam')).toMatchObject({ r: 'w', sw: 1 });
    expect(log.find((m) => m.n === 'Lass Ann')).toMatchObject({ left: 1, sw: 0 });
    // Beat them later: still remembered as having beaten you once.
    met(run, 'Youngster Joey', ['raticate'], 'win', { left: 3 });
    expect(logOf(run).find((m) => m.n === 'Youngster Joey')).toMatchObject({ r: 'w', lost: 1, t: ['raticate'] });
  });

  it('needs seven trainers met; the bracket: semi-final one you lost to, quarter-final the easiest win, the rival on the far side', () => {
    const run = gnRun('t46-door');
    seven(run);
    met(run, 'Youngster Joey', ['rattata'], 'lose', { left: 0 });
    open(run, 'gn-46-door');
    const r = choose(run, 'gn-46-door', 'Go in.');
    expect(opened(r.run, 'gn-46-board')).toBe(true);
    const board = scene(r.run, 'gn-46-board').intro;
    for (const n of ['Lass Ann', 'Damian', 'Hiker Bo']) expect(board).toContain(n);
    expect(board).toContain('Quarter-final first: Bug Catcher Sam.');
    expect(scene(r.run, 'gn-46-qf').intro).toContain('"I didn\'t get a move in. I\'ve counted.');
    expect(scene(r.run, 'gn-46-sf').intro).toContain('Youngster Joey');
    expect(scene(r.run, 'gn-46-sf').intro).toContain('you were my best day all year.');
    const fresh = gnRun('t46-few');
    open(fresh, 'gn-46-door');
    expect(JSON.stringify(content.events.get('gn-46-door')!.requires)).toContain('allstarReady');
  });

  it('nobody has beaten you: the semi-finalist is the one who came closest, and says so', () => {
    const run = gnRun('t46-unbeaten');
    seven(run, false);
    open(run, 'gn-46-door');
    const r = choose(run, 'gn-46-door', 'Go in.').run;
    const sf = scene(r, 'gn-46-sf').intro;
    expect(sf).toContain('Lass Ann');
    expect(sf).toContain('I\'m the one who came closest. I\'d like that recorded.');
    expect(sf).toContain('One Pokémon. You had *one* left.');
  });

  it('the quarter-finalist changed most: evolved, plus one that answers your finisher; the semi-finalist unchanged; a Rare item each', () => {
    let run = gnRun('t46-teams');
    seven(run);
    open(run, 'gn-46-door');
    run = choose(run, 'gn-46-door', 'Go in.').run;
    const fin = logOf(run).find((m) => m.n === 'Bug Catcher Sam')!.fin;
    const walk = choose(run, 'gn-46-board', 'Walk among them.');
    expect(walk.text).toContain(content.species.get(answerTo(content, fin)!)!.name);
    const qf = choose(walk.run, 'gn-46-qf', 'Battle.');
    expect(qf.run.battle!.trainer!.name).toBe('Bug Catcher Sam');
    expect(qf.run.battle!.enemyTeam.map((m) => m.speciesId)).toEqual(['metapod', 'kakuna', answerTo(content, fin)]);
    const owned = (r: RunState): number => Object.values(r.inventory).reduce((a, n) => a + n, 0) + r.party.reduce((a, m) => a + Object.values(m.held ?? {}).reduce((x, n) => x + n, 0), 0);
    const items = owned(qf.run);
    run = win(qf.run);
    expect(opened(run, 'gn-46-crowd-1')).toBe(true);
    expect(owned(run)).toBeGreaterThan(items);
    run = choose(run, 'gn-46-crowd-1', 'Go to the ring.').run;
    const sf = choose(run, 'gn-46-sf', 'Battle.');
    expect(sf.run.battle!.enemyTeam.map((m) => m.speciesId)).toEqual(['rattata', 'pidgey']);
    for (const foe of sf.run.battle!.enemyTeam) Object.assign(foe, makeStrong(foe));
    const out = lose(sf.run);
    expect(opened(out, 'gn-46-out')).toBe(true);
    expect(out.phase).toBe('map');
  });

  it('Damian is in, and he has a sash', () => {
    const run = gnRun('t46-damian');
    run.party = [...run.party, createPokemon(content, 'pidgey', 20, 'p2')];
    for (const n of ['Youngster Joey', 'Lass Ann', 'Hiker Bo', 'Camper Ty', 'Picnicker Lu', 'Bug Catcher Sam']) met(run, n, ['geodude'], 'win', { left: 2 });
    met(run, 'Damian', ['magikarp'], 'lose', { left: 0 });
    open(run, 'gn-46-door');
    const r = choose(run, 'gn-46-door', 'Go in.').run;
    expect(scene(r, 'gn-46-sf').intro).toContain('I\'ve got it on a sash. Tully made the sash.');
  });

  it('the final: shake hands only at the rival\'s highest Trust (no flinching on turn one); swapped teams, and one hesitates', () => {
    const run = gnRun('t46-final');
    expect(scene(run, 'gn-46-final').labels).toEqual(['Battle.']);
    const rivals = run.story.rivals;
    run.story.rivals = [{ id: 'r-test', name: 'Blue', state: 'active', rivalPotential: 1 } as unknown as (typeof rivals)[number]];
    const rid = featuredRival(run)!.id;
    const before = run.expansion;
    run.expansion = { ...run.expansion, rival: { [rid]: { feelings: { trust: 10 } } } } as unknown as RunState['expansion'];
    expect(scene(run, 'gn-46-final').labels).toEqual(['Shake.', 'After.']);
    run.expansion = before;
    run.story.rivals = rivals;
    setFlag(run, 'allstar-shake', 1);
    setFlag(run, 'x-rival-swapped-teams', 1);
    open(run, 'gn-46-final');
    const r = choose(run, 'gn-46-final', 'Battle.');
    expect(r.run.battle).toBeTruthy();
    expect(r.run.battle!.storyEffects).toContain('allstar-shake');
    expect(r.run.battle!.storyEffects.some((s) => s.startsWith(FOE_WAITS) && s.includes('It wore your colours once.'))).toBe(true);
  });

  it('champion: a rare visitor on the trophy, from the region\'s rarest pool, easy to catch', () => {
    const run = gnRun('t46-champ');
    open(run, 'gn-46-final');
    let r = choose(run, 'gn-46-final', 'Battle.').run;
    expect(r.battle).toBeTruthy();
    r = win(r);
    expect(flagOf(r, 'allstar-champion')).toBe(1);
    const rare = castOf(r, 'allstar-rare')!;
    expect(RARE[region(r)]).toContain(rare);
    const go = choose(r, 'gn-46-champion', 'Go to it.');
    expect(go.run.battle!.enemyTeam[0]!.speciesId).toBe(rare);
    expect(go.run.battle!.eventRule?.catchTimes).toBe(4);
  });
});

// ---------- gn.47 The Pokémon League Exhibition ----------
import { exRipple, MATCHUPS, matchupOf, nextMatchup, winnerOf } from '../../src/core/greenneedle/exhibition';
import { serviceView, useService } from '../../src/core/services/flow';

/** Into the queue at the Exhibition. */
function queue(seed: string, prep?: (run: RunState) => void): RunState {
  const run = gnRun(seed);
  prep?.(run);
  open(run, 'gn-47-door');
  return choose(run, 'gn-47-door', 'Join the queue.').run;
}
/** Backs a side for a reason, and makes the three moments. */
function watch(run: RunState, back: 'a' | 'b' | 'none', reason: string | null, moments: [string, string, string]): { run: RunState; text: string; changes: string[] } {
  const m = matchupOf(run)!;
  const name = (id: string) => content.bosses.get(id)!.name;
  run = back === 'none' ? choose(run, 'gn-47-queue', '"I don\'t mind who wins. I want to see it."').run : choose(run, 'gn-47-queue', `${name(back === 'a' ? m.a : m.b)}.`).run;
  if (reason) run = choose(run, 'gn-47-why', reason).run;
  run = choose(run, 'gn-47-match-1', moments[0]).run;
  run = choose(run, 'gn-47-match-2', moments[1]).run;
  return choose(run, 'gn-47-match-3', moments[2]);
}

describe('gn.47 The Pokémon League Exhibition', () => {
  it('a matchup is drawn (fixed by the seed), named at the door; each one once a run', () => {
    const run = gnRun('t47-door');
    const m = nextMatchup(run)!;
    expect(scene(run, 'gn-47-door').intro).toContain(`Tonight: **${content.bosses.get(m.a)!.name}** against **${content.bosses.get(m.b)!.name}**.`);
    const q = queue('t47-door');
    expect(matchupOf(q)!.id).toBe(m.id);
    expect(flagOf(q, `ex-used-${m.id}`)).toBe(1);
    expect(nextMatchup(q)!.id).not.toBe(m.id);
    for (const x of MATCHUPS) setFlag(q, `ex-used-${x.id}`, 1);
    expect(nextMatchup(q)).toBeUndefined();
  });

  it('back the winner because they\'re stronger: a nod and a Rare item; watch closely three times and you\'re invited down', () => {
    const run = queue('t47-strong');
    const m = matchupOf(run)!;
    const side = winnerOf(run, m) === 1 ? 'a' : 'b';
    const r = watch(run, side, '"They\'re stronger."', ['Watch closely.', 'Watch closely.', 'Watch closely.']);
    expect(said(r)).toContain('They look up at your seat, and nod.');
    expect(flagOf(r.run, 'ex-invite')).toBe(1);
    expect(scene(r.run, 'gn-47-after').labels).toEqual(['Go down.', 'Stay in your seat.']);
    expect(scene(r.run, 'gn-47-after').intro).toContain('Come down. Let\'s see what you saw.');
    const fight = choose(r.run, 'gn-47-after', 'Go down.');
    const winner = content.bosses.get(winnerOf(run, m) === 1 ? m.a : m.b)!;
    expect(fight.run.battle!.enemyTeam.map((x) => x.speciesId)).toEqual(winner.signature.slice(0, 3));
    expect(fight.run.battle!.trainer!.name).toBe(winner.name);
    const lost = lose(fight.run);
    expect(opened(lost, 'gn-47-lost')).toBe(true);
    expect(lost.party.every((x) => x.hp === maxHp(content, x))).toBe(true);
  });

  it('watching closely teaches a move free, once, at any move tutor (if it can legally learn it)', () => {
    const run = queue('t47-tutor');
    const r = watch(run, 'none', null, ['Watch closely.', 'Cheer.', 'Look at the crowd.']);
    const move = matchupOf(r.run)!.seen[0];
    expect(flagOf(r.run, `ex-seen:${move}`)).toBe(1);
    expect(flagOf(r.run, 'ex-outcome')).toBe(5);
    const sp = [...content.species.keys()].find((id) => content.learnables.get(id)?.includes(move))!;
    const learner = createPokemon(content, sp, 30, 'learner');
    learner.moves = learner.moves.filter((x) => x.id !== move).slice(0, 3);
    const t = structuredClone(r.run);
    t.party = [learner];
    const here = t.stage!.map.nodes.find((n) => n.id === t.stage!.current)!;
    here.sides.push({ id: 'tutor-x', kind: 'service', serviceId: 'tutor', used: false });
    const opt = serviceView(content, t, 'tutor-x').options.find((o) => o.id === `seen:learner:${move}`);
    expect(opt).toBeTruthy();
    expect(opt!.cost).toBe(0);
    const after = useService(content, t, 'tutor-x', opt!.id).run;
    expect(after.party[0]!.moves.some((x) => x.id === move)).toBe(true);
    expect(flagOf(after, `ex-seen:${move}`)).toBe(0);
    expect(serviceView(content, after, 'tutor-x').options.some((o) => o.id.startsWith('seen:'))).toBe(false);
  });

  it('back the loser: they find you after; back the same one twice and the reporter remembers', () => {
    const run = queue('t47-loser');
    const m = matchupOf(run)!;
    const side = winnerOf(run, m) === 1 ? 'b' : 'a';
    const r = watch(run, side, '"They\'ve got more to prove."', ['Cheer.', 'Cheer.', 'Cheer.']);
    expect(said(r)).toContain('"You backed me. On air. That was either kind or foolish."');
    const who = side === 'a' ? m.a : m.b;
    expect(flagOf(r.run, `ex-backed-${who}`)).toBe(1);
    setFlag(r.run, 'ex-again', 1);
    expect(scene(r.run, 'gn-47-why').intro).toContain('You\'re loyal. Or stubborn. Which is it?');
  });

  it('how they treat their Pokémon: their ace comes to the barrier, Bond +1 for your lead', () => {
    const run = queue('t47-treat');
    const m = matchupOf(run)!;
    const lead = run.party[0]!.friendship;
    const r = watch(run, winnerOf(run, m) === 1 ? 'a' : 'b', '"I like how they treat their Pokémon."', ['Look at the crowd.', 'Cheer.', 'Cheer.']);
    expect(said(r)).toContain('Their ace comes over to the barrier');
    expect(r.run.party[0]!.friendship).toBe(lead + 5);
  });

  it('ripples: a trainer of a later stage talks about it, and copied a move (10% less accurate for them)', () => {
    const run = queue('t47-ripple');
    const r = watch(run, 'none', null, ['Cheer.', 'Cheer.', 'Cheer.']).run;
    const move = matchupOf(r)!.seen[1];
    r.battle = { kind: 'trainer', enemyTeam: [createPokemon(content, 'rattata', 20, 'foe')], enemyIndex: 0, storyEffects: [], trainer: { classId: 'youngster', name: 'Youngster Joey', leaderId: null } } as unknown as RunState['battle'];
    expect(exRipple(content, r)).toBe('');
    r.stage!.index += 1;
    const line = exRipple(content, r);
    expect(line).toContain('Youngster Joey: "Did you see');
    expect(r.battle!.enemyTeam[0]!.moves.some((x) => x.id === move)).toBe(true);
    expect(r.battle!.storyEffects).toContain(`ex-copied:foe:${move}`);
    expect(exRipple(content, r)).toBe('');
  });
});

// ---------- gn.48 The Pokémon Draft ----------
import { COVER, DRAFT_BENCH, DRAFTED, draftOf, draftTurn, weakness } from '../../src/core/greenneedle/draft';

/** At the table, round one. */
function table(seed: string, prep?: (run: RunState) => void): RunState {
  const run = gnRun(seed);
  run.party = [...run.party, createPokemon(content, 'pidgey', 20, 'own-2')];
  prep?.(run);
  open(run, 'gn-48-door');
  return choose(run, 'gn-48-door', 'Sit at the table.').run;
}
/** Takes card 1 of the round and wins its battle (or, at round six, goes to the bracket). */
function pickAndWin(run: RunState): RunState {
  const label = scene(run, 'gn-48-table-a').labels[0]!;
  run = choose(run, 'gn-48-table-a', label).run;
  if (opened(run, 'gn-48-fight')) run = win(choose(run, 'gn-48-fight', 'Battle.').run);
  return run;
}

describe('gn.48 The Pokémon Draft', () => {
  it('the table: five cards in full (species, level, moves, nature, its trainer\'s line); your own go to the bench with the first pick', () => {
    let run = table('t48-table');
    const d = draftOf(run)!;
    expect(d.cards).toHaveLength(5);
    const a = scene(run, 'gn-48-table-a');
    expect(a.intro).toContain(`**${content.species.get(d.cards[0]!.sp)!.name}**, Lv. ${d.level}`);
    expect(a.intro).toContain(d.cards[0]!.line);
    expect(a.labels).toEqual([`${content.species.get(d.cards[0]!.sp)!.name}, from ${d.cards[0]!.by}.`, expect.any(String), expect.any(String), 'Further along the table.']);
    expect(scene(run, 'gn-48-table-b').labels).toHaveLength(3);
    run = choose(run, 'gn-48-table-a', a.labels[1]!).run;
    expect(run.party).toHaveLength(1);
    expect(run.party[0]!.speciesId).toBe(d.cards[1]!.sp);
    expect(run.party[0]!.gn).toContain(DRAFTED);
    expect(run.party[0]!.friendship).toBe(0);
    expect(run.box.filter((m) => m.gn?.includes(DRAFT_BENCH))).toHaveLength(2);
    const after = draftOf(run)!;
    expect(after.cosima).toHaveLength(1);
    expect(after.wilf).toHaveLength(1);
    expect(after.aldhelm).toHaveLength(1);
    expect(opened(run, 'gn-48-fight')).toBe(true);
    const fight = choose(run, 'gn-48-fight', 'Battle.');
    expect(fight.run.battle!.enemyTeam).toHaveLength(1);
  });

  it('six picks, five battles (n on n), Bond earned by winning; the sixth table covers the team\'s biggest weakness; then the bracket', () => {
    let run = table('t48-loop');
    for (let i = 1; i <= 5; i++) {
      run = pickAndWin(run);
      expect(draftOf(run)!.round).toBe(i + 1);
    }
    const d = draftOf(run)!;
    const weak = weakness(content, d.picks.map((c) => c.sp));
    const cover = weak ? COVER[weak] : undefined;
    if (cover && !d.picks.some((c) => c.sp === cover) && !d.cosima.concat(d.wilf, d.aldhelm).some((c) => c.sp === cover)) expect(d.cards.map((c) => c.sp)).toContain(cover);
    run = pickAndWin(run);
    expect(run.party).toHaveLength(6);
    expect(opened(run, 'gn-48-bracket-1')).toBe(true);
    expect(run.party[0]!.friendship).toBeGreaterThanOrEqual(content.balance.co.bondLevelStep * 5);
    const b1 = choose(run, 'gn-48-bracket-1', 'Battle.');
    expect(b1.run.battle!.enemyTeam).toHaveLength(6);
    expect(['Cosima Achebe-Lund', 'Wilf']).toContain(b1.run.battle!.trainer!.name);
    run = win(b1.run);
    run = win(choose(run, 'gn-48-bracket-2', 'Battle.').run);
    const b3 = choose(run, 'gn-48-bracket-3', 'Battle.');
    expect(b3.run.battle!.trainer!.name).toBe('Brother Aldhelm');
    expect(b3.run.battle!.enemyTeam.every((m) => Object.keys(m.held ?? {}).length > 0)).toBe(true);
    run = win(b3.run);
    expect(opened(run, 'gn-48-recruit')).toBe(true);
  });

  it('the cards come true: hit the shy one and it stops being shy; Protect the one that hates it and it sulks', () => {
    const run = gnRun('t48-cards');
    const shy = createPokemon(content, 'jolteon', 20, 'shy');
    shy.gn = [DRAFTED, 'draft-trait:shy'];
    const battle = { activeIndex: 0, storyEffects: [], playerStages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 }, playerVolatile: { turnsOut: 0 } } as unknown as NonNullable<RunState['battle']>;
    const lines: string[] = [];
    draftTurn(battle, [shy], [{ type: 'damage', side: 'player' }], (t) => lines.push(t));
    expect(battle.playerStages.atk).toBe(1);
    expect(lines[0]).toContain('isn\'t shy any more');
    shy.gn = [DRAFTED, 'draft-trait:protect'];
    draftTurn(battle, [shy], [{ type: 'move', side: 'player', moveId: 'protect' }], (t) => lines.push(t));
    expect(battle.playerStages.spe).toBe(-1);
    expect(battle.storyEffects).toContain('draft-misused:shy');
    void run;
  });

  it('winner\'s privilege: its trainer agrees and it does (Bond 3); "first one I ever caught" says no and offers its egg; below Bond 3 it goes home', () => {
    let run = table('t48-recruit');
    run = choose(run, 'gn-48-table-a', scene(run, 'gn-48-table-a').labels[0]!).run;
    const mon = run.party[0]!;
    mon.gn = [DRAFTED, 'draft-trait:shy', 'draft-by:Hesper Quill'];
    mon.friendship = content.balance.co.bondLevelStep * 3;
    open(run, 'gn-48-recruit');
    let r = choose(run, 'gn-48-recruit', 'Choose one.');
    expect(flagOf(r.run, 'draft-result')).toBe(1);
    expect(said(r)).toContain('You read the card. All right. Go on, then.');
    expect(r.run.party.some((m) => m.uid === mon.uid && m.gn?.includes('draft-from:Hesper Quill'))).toBe(true);
    expect(r.run.party.some((m) => m.uid === 'own-2')).toBe(true);
    expect(scene(r.run, 'gn-48-letter').intro).toContain('It\'s from Hesper Quill.');
    const letter = r.run.party.find((m) => m.uid === mon.uid)!.friendship;
    open(r.run, 'gn-48-letter');
    const w = choose(r.run, 'gn-48-letter', 'Write back.');
    expect(w.run.party.find((m) => m.uid === mon.uid)!.friendship).toBe(letter + 5);
    mon.friendship = 0;
    r = choose(run, 'gn-48-recruit', 'Choose one.');
    expect(flagOf(r.run, 'draft-result')).toBe(3);
    expect(r.run.party.some((m) => m.uid === mon.uid)).toBe(false);
    mon.gn = [DRAFTED, 'draft-trait:first', 'draft-by:Hesper Quill'];
    r = choose(run, 'gn-48-recruit', 'Choose one.');
    expect(flagOf(r.run, 'draft-result')).toBe(2);
    expect(said(r)).toContain('She\'s my first.');
    expect(r.run.party.some((m) => m.gn?.includes(DRAFTED))).toBe(false);
  });

  it('lose a draft battle: the borrowed ones go home, your own come off the bench', () => {
    let run = table('t48-lose');
    run = choose(run, 'gn-48-table-a', scene(run, 'gn-48-table-a').labels[0]!).run;
    const f = choose(run, 'gn-48-fight', 'Battle.');
    for (const foe of f.run.battle!.enemyTeam) Object.assign(foe, makeStrong(foe));
    const out = lose(f.run);
    expect(opened(out, 'gn-48-out')).toBe(true);
    expect(out.party.map((m) => m.uid)).toEqual(expect.arrayContaining(['own-2']));
    expect(out.party.some((m) => m.gn?.includes(DRAFTED))).toBe(false);
    expect([...out.party, ...out.box].some((m) => m.gn?.includes(DRAFT_BENCH))).toBe(false);
  });
});

// ---- gn.49 The Sleeping Snorlax ----
import { foodReady, snorlaxFeed, snorlaxGym, snorlaxRest, SNORLAX_MOVES } from '../../src/core/greenneedle/snorlax';
import { changeFriendship } from '../../src/core/friendship';
import { stageNumber } from '../../src/core/events';
import { takeTurn } from '../../src/core/run';

const snorlaxRun = (seed: string, prep?: (run: RunState) => void): RunState => {
  const run = gnRun(seed);
  run.passives = { ...run.passives, 'poke-flute': 1 };
  prep?.(run);
  open(run, 'gn-49-hill');
  return run;
};
const joinedSnorlax = (run: RunState) => [...run.party, ...run.box, ...run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.speciesId === 'snorlax');
const berries = (run: RunState): number => run.party.reduce((a, m) => a + Object.entries(m.held ?? {}).reduce((x, [id, n]) => x + (id.endsWith('-berry') ? n : 0), 0), 0);

describe('gn.49 The Sleeping Snorlax', () => {
  it('the hill: the doc\'s four choices; no flute in Kanto without Mr. Fuji\'s, no food without three Berries', () => {
    const run = gnRun('t49-locks');
    run.regionOrder[run.regionIndex] = 'kanto';
    open(run, 'gn-49-hill');
    expect(scene(run, 'gn-49-hill').labels).toEqual(['Play the Poké Flute.', 'Put food under its nose.', 'Battle it.', 'Go back and find another way.']);
    expect(() => choose(run, 'gn-49-hill', 'Play the Poké Flute.')).toThrow('Needs a Poké Flute');
    expect(() => choose(run, 'gn-49-hill', 'Put food under its nose.')).toThrow('Needs three Berries');
    const left = choose(run, 'gn-49-hill', 'Go back and find another way.');
    expect(flagOf(left.run, 'snorlax-met')).toBe(0);
    const elsewhere = gnRun('t49-locks');
    elsewhere.regionOrder[elsewhere.regionIndex] = 'johto';
    open(elsewhere, 'gn-49-hill');
    expect(choose(elsewhere, 'gn-49-hill', 'Play the Poké Flute.').success).toBe(true);
  });

  it('music: five notes, nearly enough, then the noise meter (shout or tap, the same); it wakes friendly and may join with Heavy Sleeper', () => {
    let run = choose(snorlaxRun('t49-music'), 'gn-49-hill', 'Play the Poké Flute.').run;
    for (const [i, n] of ['High', 'Low', 'Low', 'High', 'Middle'].entries()) run = choose(run, `gn-49-note-${i + 1}`, `${n}.`).run;
    expect(flagOf(run, 'snorlax-notes')).toBe(5);
    expect(scene(run, 'gn-49-nearly').intro).toContain('Some sleeps are deeper than music.');
    run = choose(run, 'gn-49-nearly', 'Make some noise.').run;
    expect(scene(run, 'gn-49-noise-1').labels).toEqual(['Shout, or hold and tap.']);
    expect(content.events.get('gn-49-noise-1')!.choices[0]!.prompt?.id).toBe('snorlax-shout');
    for (const i of [1, 2, 3]) run = choose(run, `gn-49-noise-${i}`, 'Shout, or hold and tap.').run; // a miss still fills the meter
    expect(scene(run, 'gn-49-woke-music').intro).toContain('The bride\'s veil blows off.');
    const r = choose(run, 'gn-49-woke-music', 'Ask it to come with you.');
    const mon = joinedSnorlax(r.run)!;
    expect(mon.fixedAbility).toBe('heavy-sleeper');
    expect(mon.gn).toContain('snorlax-woke');
    expect(said(r)).toMatch(/Leftovers/);
    expect(flagOf(r.run, 'snorlax-woke')).toBe(1);
    expect(flagOf(r.run, 'snorlax-joined')).toBe(1);
  });

  it('the healed Exploud roars far off and wakes it before the flute\'s needed (counts as music), even with no flute', () => {
    const run = gnRun('t49-exploud');
    setFlag(run, 'exploud-healed');
    open(run, 'gn-49-hill');
    expect(scene(run, 'gn-49-hill').intro).toContain('You know that voice.');
    const r = choose(run, 'gn-49-hill', 'Play the Poké Flute.');
    expect(r.success).toBe(true);
    expect(opened(r.run, 'gn-49-woke-music')).toBe(true);
  });

  it('food: three Berries, then "Give it more." makes it very fond; followed, a Berry goes missing at each rest and it sits at the Gym door', () => {
    let run = snorlaxRun('t49-food', (r) => { r.party[0]!.held = { 'oran-berry': 7 }; });
    run = choose(run, 'gn-49-hill', 'Put food under its nose.').run;
    expect(berries(run)).toBe(4);
    expect(scene(run, 'gn-49-food').labels).toEqual(['Give it more.', 'That\'s all there is.']);
    run = choose(run, 'gn-49-food', 'Give it more.').run;
    expect(berries(run)).toBe(1);
    expect(flagOf(run, 'snorlax-fed')).toBe(6);
    const joinedRun = choose(run, 'gn-49-woke-food', 'Ask it to come with you.').run;
    expect(joinedSnorlax(joinedRun)!.friendship).toBeGreaterThanOrEqual(60);
    const follow = choose(run, 'gn-49-woke-food', 'Let it follow.').run;
    expect(flagOf(follow, 'snorlax-followed')).toBe(1);
    expect(flagOf(follow, 'snorlax-following')).toBe(stageNumber(content, follow));
    expect(joinedSnorlax(follow)).toBeUndefined();
  });

  it('a follower takes a Berry at a rest; at the Gym it sits down at the door (once); a cooked food counts as the first three', () => {
    const run = gnRun('t49-rest');
    run.party[0]!.held = { 'pecha-berry': 2 };
    setFlag(run, 'snorlax-following', stageNumber(content, run));
    expect(snorlaxRest(run, stageNumber(content, run))).toContain('one is missing');
    expect(berries(run)).toBe(1);
    expect(snorlaxRest(run, stageNumber(content, run) + 1)).toBe('');
    run.battle = { trainer: { leaderId: 'brock' } } as unknown as RunState['battle'];
    expect(snorlaxGym(run, stageNumber(content, run))).toContain('Gym door');
    expect(snorlaxGym(run, stageNumber(content, run))).toBe('');
    const cook = gnRun('t49-cook');
    expect(foodReady(cook)).toBe(false);
    cook.passives = { ...cook.passives, sandwich: 1 };
    expect(foodReady(cook)).toBe(true);
    expect(snorlaxFeed(content, cook, 3, true)).toContain('You set down');
    expect(cook.passives.sandwich).toBe(0);
  });

  it('battle: double HP, Snore only and asleep for three turns, then properly awake with its four moves', () => {
    let run = choose(snorlaxRun('t49-fight'), 'gn-49-hill', 'Battle it.').run;
    const foe = run.battle!.enemyTeam[0]!;
    expect(foe.moves.map((m) => m.id)).toEqual(['snore']);
    expect(foe.status?.id).toBe('slp');
    const plain = { ...foe, eventBoosts: undefined };
    expect(maxHp(content, foe)).toBeGreaterThan(maxHp(content, plain) * 1.8);
    for (let t = 0; t < 3; t += 1) {
      run = structuredClone(run);
      run.battle!.enemyTeam[0]!.hp = maxHp(content, run.battle!.enemyTeam[0]!);
      for (const m of run.party) m.hp = maxHp(content, m);
      run = takeTurn(content, run, { kind: 'move', index: 0 }).run;
      if (t < 2) expect(run.battle!.enemyTeam[0]!.moves.map((m) => m.id)).toEqual(['snore']);
    }
    expect(run.battle!.enemyTeam[0]!.moves.map((m) => m.id)).toEqual(SNORLAX_MOVES.filter((id) => content.moves.has(id)));
    expect(run.battle!.enemyTeam[0]!.status?.id).not.toBe('slp');
  });

  it('caught angry: Bond 0, rising at half speed for the region; beaten, it sits with its back to the road', () => {
    const caught = win(choose(snorlaxRun('t49-catch'), 'gn-49-hill', 'Battle it.').run, { catchIt: true });
    const mon = joinedSnorlax(caught)!;
    expect(mon.friendship).toBe(0);
    expect(mon.gn).toContain('snorlax-grudge');
    expect(flagOf(caught, 'snorlax-joined')).toBe(1);
    expect(changeFriendship(content, mon, 10)).toBe(5);
    expect(opened(caught, 'gn-49-caught')).toBe(true);
    const beaten = win(choose(snorlaxRun('t49-beat'), 'gn-49-hill', 'Battle it.').run);
    expect(opened(beaten, 'gn-49-woke-battle')).toBe(true);
    expect(flagOf(beaten, 'snorlax-woke')).toBe(3);
  });

  it('losing to it never ends the run: it rolls a little, and the queue squeezes past', () => {
    const lost = lose(choose(snorlaxRun('t49-lose'), 'gn-49-hill', 'Battle it.').run);
    expect(lost.phase).toBe('map');
    expect(opened(lost, 'gn-49-lost')).toBe(true);
  });

  it('Heavy Sleeper: 1/8 HP back after a turn with no damaging move; nothing after an attack', () => {
    let run = choose(snorlaxRun('t49-heavy'), 'gn-49-hill', 'Battle it.').run;
    run = structuredClone(run);
    const lead = run.party[run.battle!.activeIndex]!;
    lead.fixedAbility = 'heavy-sleeper';
    lead.moves = [{ id: 'growl', pp: 40 }, { id: 'tackle', pp: 35 }];
    lead.hp = Math.floor(maxHp(content, lead) / 2);
    const healed = takeTurn(content, structuredClone(run), { kind: 'move', index: 0 });
    expect(healed.events.some((e) => e.type === 'ability' && 'ability' in e && e.ability === 'heavy-sleeper')).toBe(true);
    const hit = takeTurn(content, structuredClone(run), { kind: 'move', index: 1 });
    expect(hit.events.some((e) => e.type === 'ability' && 'ability' in e && e.ability === 'heavy-sleeper')).toBe(false);
  });

  it('afterstory: in a later region it lets you past; a fought one waits for "Ask nicely."; Kanto shows it as the Snorlax Blockade space', () => {
    const run = gnRun('t49-later');
    setFlag(run, 'snorlax-met');
    setFlag(run, 'snorlax-woke', 3);
    open(run, 'gn-49-later');
    expect(scene(run, 'gn-49-later').labels).toEqual(['Ask nicely.']);
    setFlag(run, 'snorlax-woke', 1);
    expect(scene(run, 'gn-49-later').labels).toEqual(['Wait.']);
    const kanto = content.events.get('cs-kanto-route-snorlax')!;
    expect(kanto.canon).toBe('cs.kanto.route.snorlax');
    expect(kanto.choices.map((c) => c.label)).toEqual(scene(run, 'gn-49-hill').labels);
  });
});

// ---- gn.50 The Evil Team's Betrayal ----
import { evilOf, evilTeam } from '../../src/core/evil/teams';
import { DEFECTOR, defectorClimax, GUEST, guestOf, trustOf } from '../../src/core/greenneedle/defector';

const betrayalRun = (seed: string, beat = 2): RunState => {
  const run = gnRun(seed);
  const s = evilOf(run);
  s.teamId = 'rocket';
  s.beat = beat;
  return run;
};
/** Into the next stage (the meetings wait for a later stage than the last beat). */
const nextStage = (run: RunState): void => {
  run.stage!.index += 1;
};
const helped = (seed: string, label = 'I\'ll help.'): RunState => {
  const run = betrayalRun(seed);
  open(run, 'gn-50-offer');
  return choose(run, 'gn-50-offer', label).run;
};

describe('gn.50 The Evil Team\'s Betrayal', () => {
  it('the offer: the doc\'s three choices; help (Trust 1), "why trust you" (Trust 2, their one Pokémon to hold), or turn them in (paid now)', () => {
    const run = betrayalRun('t50-offer');
    open(run, 'gn-50-offer');
    expect(scene(run, 'gn-50-offer').labels).toEqual(['I\'ll help.', 'Why should I trust you?', 'I\'m turning you in.']);
    expect(scene(run, 'gn-50-offer').intro).toContain('Team Rocket');
    const help = choose(run, 'gn-50-offer', 'I\'ll help.').run;
    expect([flagOf(help, 'defector'), trustOf(help)]).toEqual([1, 1]);
    const why = choose(run, 'gn-50-offer', 'Why should I trust you?').run;
    expect(trustOf(why)).toBe(2);
    expect(guestOf(why)?.gn).toContain(GUEST);
    const money = run.money;
    const exposed = choose(run, 'gn-50-offer', 'I\'m turning you in.').run;
    expect(flagOf(exposed, 'defector')).toBe(2);
    expect(exposed.money).toBeGreaterThan(money);
    const noTeam = gnRun('t50-none');
    open(noTeam, 'gn-50-offer');
    expect(() => choose(noTeam, 'gn-50-offer', 'I\'ll help.')).not.toThrow();
  });

  it('meeting 1: turning up +1; opening the envelope -2 ("Thought so."); following them -1; giving their Pokémon back unasked +1', () => {
    let run = helped('t50-m1', 'Why should I trust you?');
    nextStage(run);
    open(run, 'gn-50-meet-1');
    expect(scene(run, 'gn-50-meet-1').labels).toEqual(['Carry it.', 'Open it.']);
    const opened1 = choose(run, 'gn-50-meet-1', 'Open it.');
    expect(said(opened1)).toContain('Thought so.');
    expect(trustOf(opened1.run)).toBe(1);
    run = choose(run, 'gn-50-meet-1', 'Carry it.').run;
    expect(trustOf(run)).toBe(3);
    expect(scene(run, 'gn-50-leave-1').labels).toEqual(['Let them go.', 'Follow them.', 'Give their Pokémon back.']);
    expect(said(choose(run, 'gn-50-leave-1', 'Let them go.'))).toContain('a route, and where the patrols will be on it');
    expect(trustOf(choose(run, 'gn-50-leave-1', 'Follow them.').run)).toBe(2);
    const back = choose(run, 'gn-50-leave-1', 'Give their Pokémon back.').run;
    expect(trustOf(back)).toBe(4);
    expect(guestOf(back)).toBeUndefined();
  });

  it('meeting 2: a missed meeting costs 1; not asking where they go earns 1 once; asking costs nothing', () => {
    let run = helped('t50-m2');
    nextStage(run);
    open(run, 'gn-50-meet-2');
    expect(scene(run, 'gn-50-meet-2').labels).toEqual(['What happened to your face?', 'Understood.', 'What are you doing between these meetings?']);
    expect(scene(run, 'gn-50-meet-2').intro).toContain('the meeting you missed');
    expect(trustOf(choose(run, 'gn-50-meet-2', 'Understood.').run)).toBe(2);
    run = choose(run, 'gn-50-meet-2', 'What are you doing between these meetings?').run;
    expect(trustOf(run)).toBe(1);
  });

  it('the records room: the guard at A+1, then "Take them all." (+1, the fourteen) or the boss\'s file (a File for the main story)', () => {
    const run = helped('t50-docs');
    nextStage(run);
    open(run, 'gn-50-docs');
    expect(scene(run, 'gn-50-docs').labels).toEqual(['Take the guard.']);
    let r = win(choose(run, 'gn-50-docs', 'Take the guard.').run);
    expect(scene(r, 'gn-50-cabinet').labels).toEqual(['Take them all.', 'There\'s no time. Just yours.', 'Take the boss\'s file too.']);
    const all = win(choose(r, 'gn-50-cabinet', 'Take them all.').run);
    expect(flagOf(all, 'defector-files')).toBe(2);
    expect(trustOf(all)).toBe(1);
    const boss = win(choose(r, 'gn-50-cabinet', 'Take the boss\'s file too.').run);
    expect(flagOf(boss, 'defector-files')).toBe(3);
    expect(flagOf(boss, 'team-rocket-files')).toBe(1);
    r = choose(r, 'gn-50-cabinet', 'There\'s no time. Just yours.').run;
    expect(flagOf(r, 'defector-files')).toBe(1);
    const keyed = helped('t50-key');
    nextStage(keyed);
    setFlag(keyed, 'hideout-key', 1);
    open(keyed, 'gn-50-docs');
    const k = choose(keyed, 'gn-50-docs', 'Use a key.').run;
    expect(flagOf(k, 'hideout-key')).toBe(0);
  });

  it('the ending: Trust 5 walks in beside you (a tag partner) and the fourteen hold the corridor; 3-4 a map (one Hideout room skipped); 0-2 a postcard later', () => {
    const run = helped('t50-end', 'I\'ll help.');
    evilOf(run).beat = 6;
    setFlag(run, 'defector-trust', 5);
    setFlag(run, 'defector-files', 2);
    open(run, 'gn-50-end');
    expect(scene(run, 'gn-50-end').intro).toContain('Ordinary clothes');
    expect(scene(run, 'gn-50-end').intro).toContain('A lot of boots');
    const ended = choose(run, 'gn-50-end', 'Go in.').run;
    expect(flagOf(ended, 'defector-end')).toBe(1);
    open(ended, 'evil-rocket-hideout-boss');
    const fight = choose(ended, 'evil-rocket-hideout-boss', 'Battle.').run;
    expect(fight.battle!.trainer?.name).toBe(evilTeam(content, fight)!.ranks.leader.name);
    expect(fight.battle!.doubles).toBeTruthy();
    expect(fight.party.some((m) => m.uid === fight.battle!.loaner)).toBe(true);
    expect(fight.battle!.enemyVolatile.trapped).toBe(true);
    const map = helped('t50-map');
    evilOf(map).beat = 6;
    setFlag(map, 'defector-trust', 3);
    open(map, 'gn-50-end');
    expect(flagOf(choose(map, 'gn-50-end', 'Go in.').run, 'hideout-key')).toBe(1);
    const alone = helped('t50-alone');
    evilOf(alone).beat = 6;
    setFlag(alone, 'defector-trust', 0);
    open(alone, 'gn-50-end');
    const post = choose(alone, 'gn-50-end', 'Go in.').run;
    expect(flagOf(post, 'defector-end')).toBe(3);
    post.regionIndex += 1;
    open(post, 'gn-50-postcard');
    expect(scene(post, 'gn-50-postcard').intro).toContain('No return address');
  });

  it('exposed: Corin comes back at the climax as a boss at A+2, each of their Pokémon answering one of yours', () => {
    const run = helped('t50-boss', 'I\'m turning you in.');
    evilOf(run).beat = 6;
    run.party = [...run.party, createPokemon(content, 'bulbasaur', 20, 'p-bulba')];
    open(run, 'gn-50-end');
    expect(scene(run, 'gn-50-end').intro).toContain('I asked you for one thing.');
    const b = choose(run, 'gn-50-end', 'Battle.').run;
    expect(b.battle!.trainer?.name).toBe(DEFECTOR);
    expect(b.battle!.enemyTeam.map((m) => m.speciesId)).toEqual(b.party.filter((m) => m.hp > 0).map((m) => answerTo(content, m.speciesId) ?? m.speciesId));
    expect(flagOf(b, 'defector-end')).toBe(4);
    const after = lose(b);
    expect(after.phase).toBe('map');
  });

  it('no climax help in another region, and nothing without the files', () => {
    const run = helped('t50-other');
    setFlag(run, 'defector-trust', 5);
    setFlag(run, 'defector-end', 1);
    run.regionIndex += 1;
    const battle = { trainer: { name: evilTeam(content, run)!.ranks.leader.name }, enemyTeam: [run.party[0], run.party[0]], storyEffects: [], enemyVolatile: { trapped: false }, activeIndex: 0, turn: 1 } as unknown as NonNullable<RunState['battle']>;
    defectorClimax(content, run, battle, (sp, lv, uid) => createPokemon(content, sp, lv, uid));
    expect(battle.doubles).toBeFalsy();
    expect(battle.enemyVolatile.trapped).toBe(false);
  });
});

// ---- gn.51 The Pokémon Smuggling Ring ----
import { CARGO, farFromHome, homeOf, smuggleRest } from '../../src/core/greenneedle/smuggling';
import { taRoomsAfraid } from '../../src/core/greenneedle/teamauction';
import { step } from './autoplay';
import { castOf as castOfGn } from '../../src/core/greenneedle';
import { switchProblem } from '../../src/core/battle/engine';

const yard = (seed: string): RunState => {
  const run = gnRun(seed);
  open(run, 'gn-51-yard');
  return run;
};
const throughCages = (run: RunState, how = 'Step back, and wait.'): RunState => choose(run, 'gn-51-cages', how).run;
const rescued = (run: RunState) => [...run.party, ...run.box].find((m) => m.gn?.includes('freed-caged'));
/** A rest stop on the node the player stands on. */
const rest = (run: RunState): void => {
  smuggleRest(content, run);
};

describe('gn.51 The Pokémon Smuggling Ring', () => {
  it('the yard: the doc\'s four ways in; the front is four guard battles at A+1, the last the foreman', () => {
    const run = yard('t51-front');
    expect(scene(run, 'gn-51-yard').labels).toEqual(['Go in through the front.', 'Go in through the roof.', 'Let the air out of the lorries\' tyres first.', 'Fetch the Rangers.']);
    let r = choose(run, 'gn-51-yard', 'Go in through the front.').run;
    for (let i = 1; i <= 4; i += 1) {
      const b = choose(r, `gn-51-guard-${i}`, 'Battle.').run;
      expect(b.battle!.enemyTeam[0]!.level).toBeGreaterThan(0);
      r = win(b);
    }
    expect(opened(r, 'gn-51-cages')).toBe(true);
    expect(flagOf(r, 'smuggle-entry')).toBe(1);
  });

  it('the roof skips two guards; the tyres cost a node and nobody drives off; the Rangers: no battles, Reputation +2', () => {
    const roof = choose(yard('t51-roof'), 'gn-51-yard', 'Go in through the roof.').run;
    roof.party = [...roof.party, createPokemon(content, 'gastly', 20, 'p-gastly')];
    expect(opened(choose(roof, 'gn-51-rafters', 'Let your Pokémon carry you over.').run, 'gn-51-guard-3')).toBe(true);
    const tyres = choose(yard('t51-tyres'), 'gn-51-yard', 'Let the air out of the lorries\' tyres first.');
    expect(said(tyres)).toContain('nobody drives off');
    expect(scene(tyres.run, 'gn-51-flat').labels).toEqual(['Go in through the front.', 'Go in through the roof.', 'Fetch the Rangers.']);
    const front = choose(tyres.run, 'gn-51-flat', 'Go in through the front.').run;
    const lost = lose(choose(front, 'gn-51-guard-1', 'Battle.').run);
    expect(lost.phase).toBe('map');
    expect(scene(lost, 'gn-51-lorries').intro).toContain('sitting on its rims');
    const rangers = choose(yard('t51-rangers'), 'gn-51-yard', 'Fetch the Rangers.').run;
    expect(flagOf(rangers, 'rep')).toBe(2);
    expect(opened(rangers, 'gn-51-cages')).toBe(true);
  });

  it('the cages: the doc\'s three choices; four go home on a list, one stays by the door, a form from another region with a special ability', () => {
    const run = choose(yard('t51-cages'), 'gn-51-yard', 'Fetch the Rangers.').run;
    expect(scene(run, 'gn-51-cages').labels).toEqual(['Reach in.', 'Step back, and wait.', 'Open all the others first.']);
    const r = throughCages(run);
    const stays = castOfGn(r, 'smuggle-rescue')!;
    expect(CARGO).toContain(stays);
    expect(homeOf(stays)).not.toBe(r.regionOrder[r.regionIndex]);
    const door = scene(r, 'gn-51-door').intro;
    expect(door.match(/☐/g)).toHaveLength(4);
    expect(door).toContain(content.species.get(stays)!.name);
  });

  it('rehabilitation: it walks beside you (no party slot); at each rest it comes closer; "Try the Ball again" sets it back; after three it climbs in, Bond high', () => {
    let run = throughCages(choose(yard('t51-rehab'), 'gn-51-yard', 'Fetch the Rangers.').run);
    const size = run.party.length;
    run = choose(run, 'gn-51-door', 'Hold out a Ball.').run;
    expect(run.party.length).toBe(size);
    rest(run);
    expect(scene(run, 'gn-51-rest').labels).toEqual(['Leave food where it can reach.', 'Leave a Ball open on the ground, and ignore it.', 'Try the Ball again']);
    expect(scene(run, 'gn-51-rest').intro).toContain('outside the firelight');
    run = choose(run, 'gn-51-rest', 'Leave food where it can reach.').run;
    rest(run);
    expect(scene(run, 'gn-51-rest').intro).toContain('edge of the light');
    const back = choose(run, 'gn-51-rest', 'Try the Ball again');
    expect(said(back)).toContain('It\'s not ready. It\'ll tell you.');
    expect(flagOf(back.run, 'smuggle-rehab')).toBe(1);
    run = choose(run, 'gn-51-rest', 'Leave a Ball open on the ground, and ignore it.').run;
    rest(run);
    expect(scene(run, 'gn-51-rest').labels).toEqual(['Pick up the Ball.']);
    const joined = choose(run, 'gn-51-rest', 'Pick up the Ball.');
    expect(said(joined)).toContain('It chose the door, this time.');
    const mon = rescued(joined.run)!;
    expect(['far-from-home', 'wary', 'remembers-the-cage']).toContain(mon.fixedAbility);
    expect(mon.friendship).toBeGreaterThanOrEqual(3 * content.balance.co.bondLevelStep);
    rest(joined.run);
    expect(opened(joined.run, 'gn-51-rest')).toBe(false);
  });

  it('waited out the Ball That Wouldn\'t Open (gn.new.03): two rests, not three', () => {
    let run = throughCages(choose(yard('t51-two'), 'gn-51-yard', 'Fetch the Rangers.').run);
    setFlag(run, 'ball-waited');
    run = choose(run, 'gn-51-door', 'Hold out a Ball.').run;
    rest(run);
    run = choose(run, 'gn-51-rest', 'Leave food where it can reach.').run;
    rest(run);
    expect(scene(run, 'gn-51-rest').labels).toEqual(['Pick up the Ball.']);
  });

  it('Far From Home: +10% outside its own region, back to normal at home; Wary can always switch; Remembers the Cage breaks the first hold', () => {
    const run = gnRun('t51-abilities');
    const mon = createPokemon(content, 'vulpix-alola', 20, 'p-vulpix');
    mon.fixedAbility = 'far-from-home';
    mon.gn = ['home:alola'];
    run.regionOrder[run.regionIndex] = 'kanto';
    farFromHome(run, mon);
    expect(mon.eventBoosts?.atk).toBe(10);
    run.regionOrder[run.regionIndex] = 'alola';
    farFromHome(run, mon);
    expect(mon.eventBoosts?.atk).toBe(0);
  });

  it('Remembers the Cage breaks free of the first hold (+1 Speed), not the second; Wary can always switch out', () => {
    let run = choose(snorlaxRun('t51-cage'), 'gn-49-hill', 'Battle it.').run;
    run = structuredClone(run);
    const foe = run.battle!.enemyTeam[0]!;
    foe.moves = [{ id: 'mean-look', pp: 5 }];
    foe.status = null;
    run.battle!.storyEffects = [];
    const lead = run.party[run.battle!.activeIndex]!;
    lead.fixedAbility = 'remembers-the-cage';
    lead.moves = [{ id: 'growl', pp: 40 }];
    const t1 = takeTurn(content, run, { kind: 'move', index: 0 });
    expect(t1.events.some((e) => e.type === 'ability' && 'ability' in e && e.ability === 'remembers-the-cage')).toBe(true);
    expect(t1.run.battle!.playerVolatile.trapped).toBe(false);
    expect(t1.run.battle!.playerStages.spe).toBe(1);
    const t2 = takeTurn(content, t1.run, { kind: 'move', index: 0 });
    expect(t2.run.battle!.playerVolatile.trapped).toBe(true);
    const wary = structuredClone(run);
    wary.party[wary.battle!.activeIndex]!.fixedAbility = 'wary';
    wary.battle!.playerVolatile.trapped = true;
    wary.party.push(createPokemon(content, 'pidgey', 10, 'p-spare'));
    expect(switchProblem({ battle: wary.battle!, party: wary.party, content }, wary.party.length - 1)).toBeNull();
    wary.party[wary.battle!.activeIndex]!.fixedAbility = undefined;
    expect(switchProblem({ battle: wary.battle!, party: wary.party, content }, wary.party.length - 1)).toContain('can\'t be switched out');
  });

  it('postcards: one a region afterwards, ticking the list', () => {
    let run = throughCages(choose(yard('t51-cards'), 'gn-51-yard', 'Fetch the Rangers.').run);
    run = choose(run, 'gn-51-door', 'Hold out a Ball.').run;
    run.regionIndex += 1;
    open(run, 'gn-51-postcard');
    run = choose(run, 'gn-51-postcard', 'Pin it up.').run;
    expect(flagOf(run, 'smuggle-cards')).toBe(1);
    open(run, 'gn-51-door');
    expect(scene(run, 'gn-51-door').intro.match(/☑/g)).toHaveLength(1);
  });
});

// ---- gn.52 The Evil Team's Pokémon Auction ----
const manor = (seed: string, money = 20000): RunState => {
  const run = betrayalRun(seed, 3);
  run.money = money;
  open(run, 'gn-52-manor');
  return run;
};
/** Clears a decision the prize opened (the fossil asks what to do with it). */
const settle = (run: RunState): RunState => {
  let r = run;
  for (let i = 0; i < 5 && r.phase === 'decision'; i += 1) r = step(content, r).run;
  return r;
};
const rareOf = (run: RunState) => [...run.party, ...run.box].find((m) => m.gn?.some((t) => t.startsWith('afraid-rooms:')));

describe('gn.52 The Evil Team\'s Pokémon Auction', () => {
  it('three disguises; the buyer sees the viewing room (the antique\'s a fake), the agent the ledger, the caterer the kitchens', () => {
    const run = manor('t52-door');
    expect(scene(run, 'gn-52-manor').labels).toEqual(['Go as a rich buyer.', 'Go as a rival team\'s agent.', 'Go as a caterer.']);
    const buyer = choose(choose(run, 'gn-52-manor', 'Go as a rich buyer.').run, 'gn-52-viewing', 'Look closely at the antique.').run;
    expect(flagOf(buyer, 'ta-disguise')).toBe(1);
    expect(scene(buyer, 'gn-52-lot-4').intro).toContain('It\'s a fake.');
    const agent = choose(run, 'gn-52-manor', 'Go as a rival team\'s agent.').run;
    expect(opened(agent, 'gn-52-office')).toBe(true);
    const caterer = choose(run, 'gn-52-manor', 'Go as a caterer.').run;
    expect(opened(caterer, 'gn-52-kitchen')).toBe(true);
  });

  it('the bidder keeps cover by winning three lots and dodging both traps: the ledger (a File), and the lieutenant wonders later', () => {
    let run = choose(choose(manor('t52-buyer'), 'gn-52-manor', 'Go as a rich buyer.').run, 'gn-52-viewing', 'Go to the floor.').run;
    expect(scene(run, 'gn-52-lot-1').intro).toContain('fox mask');
    run = choose(run, 'gn-52-lot-1', 'Bid to its fair value.').run;
    run = choose(run, 'gn-52-lot-2', 'Drop out early.').run;
    run = settle(choose(run, 'gn-52-lot-3', 'Bid.').run);
    run = choose(run, 'gn-52-lot-4', 'Let it go.').run;
    run = choose(run, 'gn-52-lot-5', 'Bid low, like everyone.').run;
    expect(flagOf(run, 'ta-lots')).toBe(3);
    const before = run.money;
    run = choose(run, 'gn-52-lot-6', 'Bid it home.').run;
    expect(run.money).toBe(before - 4500);
    expect(rareOf(run)).toBeDefined();
    run = choose(run, 'gn-52-out', 'Walk home.').run;
    expect(flagOf(run, 'ta-cover')).toBe(1);
    expect(flagOf(run, 'team-rocket-files')).toBe(1);
    expect(flagOf(run, 'ta-traps')).toBe(1);
  });

  it('a rich buyer who refuses three lots in a row draws looks: the cover\'s blown, and only the alarm is left', () => {
    let run = choose(choose(manor('t52-looks'), 'gn-52-manor', 'Go as a rich buyer.').run, 'gn-52-viewing', 'Go to the floor.').run;
    run = choose(run, 'gn-52-lot-1', 'Let it go.').run;
    run = choose(run, 'gn-52-lot-2', 'Drop out early.').run;
    const r = choose(run, 'gn-52-lot-3', 'Let it go.');
    expect(said(r)).toContain('Heads turn.');
    expect(flagOf(r.run, 'ta-blown')).toBe(1);
    run = choose(r.run, 'gn-52-lot-4', 'Let it go.').run;
    run = choose(run, 'gn-52-lot-5', 'Let it go.').run;
    expect(scene(run, 'gn-52-lot-6').labels).toEqual(['Raise the alarm.']);
    const after = win(choose(run, 'gn-52-lot-6', 'Raise the alarm.').run);
    expect(flagOf(after, 'ta-rare')).toBe(3);
    const out = choose(after, 'gn-52-out', 'Walk home.').run;
    expect(flagOf(out, 'ta-cover')).toBe(0);
  });

  it('the agent: one guest asks the question; the ledger has the answer; the old uniform (SF130) means nobody asks', () => {
    let run = choose(manor('t52-agent'), 'gn-52-manor', 'Go as a rival team\'s agent.').run;
    run = choose(run, 'gn-52-office', 'Read the ledger.').run;
    run = choose(run, 'gn-52-lot-1', 'Let it go.').run;
    run = choose(run, 'gn-52-lot-2', 'Drop out early.').run;
    run = settle(choose(run, 'gn-52-lot-3', 'Bid.').run);
    expect(scene(run, 'gn-52-question').intro).toContain('settled in Rare Candy');
    expect(flagOf(choose(run, 'gn-52-question', '"Cash, as always."').run, 'ta-blown')).toBe(1);
    run = choose(run, 'gn-52-question', '"In Rare Candy."').run;
    expect(flagOf(run, 'ta-blown')).toBe(0);
    expect(scene(run, 'gn-52-lot-6').labels).toContain('Bid, and send a Pokémon round the back.');
    const uniform = manor('t52-uniform');
    setFlag(uniform, 'team-rocket-disguise');
    let u = choose(uniform, 'gn-52-manor', 'Go as a rival team\'s agent.').run;
    u = choose(u, 'gn-52-office', 'Go to the floor.').run;
    u = choose(u, 'gn-52-lot-1', 'Let it go.').run;
    u = choose(u, 'gn-52-lot-2', 'Drop out early.').run;
    u = settle(choose(u, 'gn-52-lot-3', 'Bid.').run);
    expect(opened(u, 'gn-52-lot-4')).toBe(true);
  });

  it('the caterer rescues it from the service corridor for nothing; the rival holds the door (+2 Trust); it\'s afraid of rooms for a stage', () => {
    let run = choose(manor('t52-caterer'), 'gn-52-manor', 'Go as a caterer.').run;
    run = choose(run, 'gn-52-kitchen', 'Say nothing.').run;
    run = choose(run, 'gn-52-cellar', 'Take the service corridor.').run;
    expect(scene(run, 'gn-52-corridor').labels).toEqual(['Take the key from the hook.', 'Let your rival hold the door.', 'Raise the alarm.']);
    const money = run.money;
    run = choose(run, 'gn-52-corridor', 'Let your rival hold the door.').run;
    expect(run.money).toBe(money);
    expect(flagOf(run, 'ta-rare')).toBe(2);
    run = choose(run, 'gn-52-out', 'Walk home.').run;
    expect(flagOf(run, 'ta-cover')).toBe(1);
    const mon = rareOf(run)!;
    const i = run.party.indexOf(mon);
    expect(i).toBeGreaterThanOrEqual(0);
    mon.hp = 1;
    const healed = taRoomsAfraid(content, run, run.party.map((m) => m.hp), stageNumber(content, run));
    expect(healed).toContain('won\'t come inside');
    expect(taRoomsAfraid(content, run, run.party.map((m) => m.hp), stageNumber(content, run) + 1)).toBe('');
  });

  it('the defector (Trust 3+) is the contact and left the corridor door on the latch; the manor is for sale in a later region', () => {
    const run = manor('t52-corin');
    setFlag(run, 'defector', 1);
    setFlag(run, 'defector-trust', 3);
    expect(scene(run, 'gn-52-manor').intro).toContain('on the latch');
    const b = choose(run, 'gn-52-manor', 'Go as a rich buyer.').run;
    expect(flagOf(b, 'ta-corridor')).toBe(1);
    setFlag(b, 'ta-done');
    b.regionIndex += 1;
    open(b, 'gn-52-sale');
    expect(scene(b, 'gn-52-sale').intro).toContain('Motivated seller.');
  });
});

// ---- gn.53 The Region Under Siege ----
import { alliesOf, bar, sgAct, sgCommanderStart, sgEnd, sgPriceFactor, sgStart, TURNS } from '../../src/core/greenneedle/citysiege';
import { shopPrice, visitSide } from '../../src/core/run';

const city = (seed: string, prep?: (run: RunState) => void): RunState => {
  const run = betrayalRun(seed, 5);
  prep?.(run);
  open(run, 'gn-53-alarm');
  return run;
};
/** Answers the alarm and sends everyone waiting to `to` (0 Market, 1 Homes, 2 Gate, 3 Hall). */
const muster = (run: RunState, to = 'The Gate.'): RunState => {
  let r = choose(run, 'gn-53-alarm', 'Answer the alarm.').run;
  for (let i = 0; i < 12 && scene(r, 'gn-53-muster').labels.includes('Give orders.'); i += 1) {
    r = choose(r, 'gn-53-muster', 'Give orders.').run;
    r = choose(r, 'gn-53-orders', to).run;
  }
  return choose(r, 'gn-53-muster', 'Into the city.').run;
};
/** One turn: a district, one action (a fight is won). */
const go = (run: RunState, where: string, action: string): RunState => {
  const d = choose(run, 'gn-53-turn', `The ${where}.`).run;
  const r = choose(d, `gn-53-${where.toLowerCase()}`, action);
  return r.battle ? win(r.run) : r.run;
};
const sideHere = (run: RunState, kind: 'heal' | 'shop'): string => {
  const node = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
  const id = `test-${kind}-${node.sides.length}`;
  node.sides.push({ id, kind, used: false } as (typeof node.sides)[number]);
  return id;
};

describe('gn.53 The Region Under Siege', () => {
  it('the alarm calls who the run has earned: the rival at Trust 2, friends from finished events, the defector\'s fourteen; the player gives orders', () => {
    const run = city('t53-call', (r) => {
      setFlag(r, 'damian-visit-done');
      setFlag(r, 'squad-done');
      setFlag(r, 'defector-files', 2);
      setFlag(r, 'defector-at', r.regionIndex + 1);
    });
    const r = choose(run, 'gn-53-alarm', 'Answer the alarm.').run;
    const names = alliesOf(r).map((a) => a.n);
    expect(names).toEqual(expect.arrayContaining(['Damian', 'The Squirtle Squad', 'The fourteen ex-Grunts']));
    expect(names).not.toContain('The Samurai');
    expect(scene(r, 'gn-53-muster').labels).toEqual(['Give orders.']);
    expect(scene(r, 'gn-53-orders').labels).toEqual(['The Market.', 'The Homes.', 'The Gate.', 'The Hall.']);
    const done = muster(run, 'The Hall.');
    expect(alliesOf(done).filter((a) => names.includes(a.n) && a.d === '')).toHaveLength(0);
    expect(scene(done, 'gn-53-turn').intro).toContain('Turn 1 of 8');
    expect(scene(done, 'gn-53-turn').intro).toContain('held by Damian');
  });

  it('Fear (Reputation brought to 0): fewer come, and they pick their own districts', () => {
    const r = city('t53-fear', (x) => {
      for (const k of ['damian-visit-done', 'squad-done', 'kanto-forest-samurai-won', 'frontier-symbols']) setFlag(x, k);
      setFlag(x, 'rep-lost', 2);
    });
    const after = choose(r, 'gn-53-alarm', 'Answer the alarm.').run;
    expect(alliesOf(after).length).toBeLessThan(4);
    expect(alliesOf(after).every((a) => a.d !== '')).toBe(true);
    expect(scene(after, 'gn-53-muster').labels).toEqual(['Into the city.']);
  });

  it('each turn one district, one thing: a fight raises its bar; a district with nobody loses ground fast, one with allies slowly', () => {
    const run = muster(city('t53-bars', (r) => setFlag(r, 'damian-visit-done')), 'The Hall.');
    expect(scene(run, 'gn-53-market').labels).toEqual(['Fight.', 'Rescue.', 'Repair.']);
    const r = go(run, 'Market', 'Fight.');
    expect(bar(r, 'market')).toBe(6);
    expect(bar(r, 'homes')).toBe(3);
    expect(bar(r, 'gate')).toBe(3);
    expect(flagOf(r, 'sg-turn')).toBe(2);
    // The Hall (Damian, strength 1) loses ground every other turn: not on turn 1.
    expect(bar(r, 'hall')).toBe(4);
    const r2 = go(r, 'Market', 'Repair.');
    expect(bar(r2, 'hall')).toBe(3);
    // From turn 4, the district's captain (A+1) instead of the Grunts.
    const late = structuredClone(r2);
    setFlag(late, 'sg-turn', 4);
    open(late, 'gn-53-gate');
    expect(choose(late, 'gn-53-gate', 'Fight.').battle).toBe(true);
    const fights = content.events.get('gn-53-gate')!.choices.slice(0, 2).map((c) => (c.success as unknown as { battle: { evil: string; levelBonus: number } }).battle);
    expect(fights.map((b) => [b.evil, b.levelBonus])).toEqual([['grunt', 0], ['specialist', 1]]);
  });

  it('reinforcements at turns 5 and 7 unless the Gate\'s held; the Rangers at 7 if the Hall is; the runner at 6', () => {
    let run = muster(city('t53-clock'));
    for (let t = 1; t <= 4; t += 1) run = go(run, 'Hall', t === 1 ? 'Rescue.' : 'Fight.');
    expect(flagOf(run, 'sg-reinforced')).toBe(1);
    run = go(run, 'Hall', 'Fight.');
    expect(opened(run, 'gn-53-runner')).toBe(true);
    expect(scene(run, 'gn-53-runner').labels).toEqual(['The school.', 'The hospital.', 'Split my team: three each.']);
    const r = choose(run, 'gn-53-runner', 'The school.');
    expect(flagOf(r.run, 'sg-school')).toBe(1);
    expect(flagOf(r.run, 'sg-hospital')).toBe(0);
    expect(flagOf(r.run, 'sg-reinforced')).toBe(2);
    expect(flagOf(r.run, 'sg-rangers')).toBe(1);
    expect(said(r)).toContain('The Rangers arrive');
    // Holding the Gate keeps them out.
    const gate = structuredClone(run);
    setFlag(gate, 'sg-turn', 4);
    setFlag(gate, 'sg-reinforced', 0);
    setFlag(gate, 'sg-bar-gate', 6);
    sgAct(gate, 'market', 1);
    expect(flagOf(gate, 'sg-reinforced')).toBe(0);
  });

  it('split the team: two battles, half the party each; both reached when both are won, and the team comes back whole', () => {
    const run = city('t53-split');
    run.party = [0, 1, 2, 3].map((i) => createPokemon(content, 'pikachu', 60, `split-${i}`));
    let r = muster(run);
    setFlag(r, 'sg-turn', 6);
    open(r, 'gn-53-runner');
    const first = choose(r, 'gn-53-runner', 'Split my team: three each.').run;
    expect(first.party.map((m) => m.uid)).toEqual(['split-0', 'split-1']);
    r = win(first);
    const second = choose(r, 'gn-53-hospital', 'Go to them.').run;
    expect(second.party.map((m) => m.uid)).toEqual(['split-2', 'split-3']);
    r = win(second);
    expect(r.party.map((m) => m.uid)).toEqual(['split-0', 'split-1', 'split-2', 'split-3']);
    expect(flagOf(r, 'sg-school')).toBe(1);
    expect(flagOf(r, 'sg-hospital')).toBe(1);
    expect(flagOf(r, 'sg-turn')).toBe(7);
  });

  it('the commander: four tired Pokémon if no reinforcements came, six if they came twice; Hall allies hold one turn each', () => {
    const run = muster(city('t53-cmd', (r) => setFlag(r, 'damian-visit-done')), 'The Hall.');
    const team = () => [0, 1, 2, 3, 4, 5].map((i) => createPokemon(content, 'machop', 50, `c-${i}`));
    const battle = { enemyTeam: team(), storyEffects: [] as string[] } as unknown as NonNullable<RunState['battle']>;
    sgCommanderStart(run, battle, FOE_WAITS);
    expect(battle.enemyTeam).toHaveLength(4);
    expect(battle.enemyTeam[0]!.hp).toBeLessThan(maxHp(content, battle.enemyTeam[0]!));
    expect(battle.storyEffects.join(' ')).toContain('Damian steps in from the Hall');
    setFlag(run, 'sg-reinforced', 2);
    const full = { enemyTeam: team(), storyEffects: [] as string[] } as unknown as NonNullable<RunState['battle']>;
    sgCommanderStart(run, full, FOE_WAITS);
    expect(full.enemyTeam).toHaveLength(6);
    setFlag(run, 'sg-turn', 8);
    open(run, 'gn-53-commander');
    expect(choose(run, 'gn-53-commander', 'Fight.').run.battle?.eventRule).toMatchObject({ gn: 'siege-commander' });
  });

  it('the result shapes the next stage: celebration (half-price), repair (half heals), occupation (no shops); a fallen Market leaves no Center', () => {
    const base = muster(city('t53-end'));
    const stage = stageNumber(content, base);
    const at = (held: number, beaten: number): RunState => {
      const r = structuredClone(base);
      ['market', 'homes', 'gate', 'hall'].forEach((d, i) => setFlag(r, `sg-bar-${d}`, i < held ? 4 : 0));
      sgEnd(content, r, beaten, stage);
      r.stage!.index += 1;
      return r;
    };
    const party = (r: RunState): RunState => {
      r.party.forEach((m) => { m.hp = 1; });
      return r;
    };
    const joy = at(4, 1);
    expect(flagOf(joy, 'sg-result')).toBe(1);
    const entry = content.shop.find((e) => e.price > 0)!;
    const normal = structuredClone(base);
    normal.stage!.index += 1;
    expect(shopPrice(content, joy, entry)).toBe(Math.round(shopPrice(content, normal, entry) * 0.5));
    const fixing = party(at(2, 1));
    expect(flagOf(fixing, 'sg-result')).toBe(2);
    const healed = visitSide(content, fixing, sideHere(fixing, 'heal'));
    expect(healed.message).toContain('in a tent');
    expect(healed.run.party[0]!.hp).toBe(Math.ceil(maxHp(content, healed.run.party[0]!) * 0.5));
    const lost = at(4, 0);
    expect(flagOf(lost, 'sg-result')).toBe(3);
    expect(sgPriceFactor(lost, stageNumber(content, lost))).toBeNull();
    expect(visitSide(content, lost, sideHere(lost, 'shop')).message).toContain('bread roll');
    const noMarket = at(2, 1);
    setFlag(noMarket, 'sg-lost-market');
    expect(visitSide(content, noMarket, sideHere(noMarket, 'heal')).message).toContain('GONE TO THE NEXT TOWN');
    // Only the stage after: later stages are back to normal.
    joy.stage!.index += 1;
    expect(sgPriceFactor(joy, stageNumber(content, joy))).toBe(1);
  });

  it('a civilian not reached is missing later; the Gate\'s Pokémon waits at the next rest and may ask to join; the plaque names who held', () => {
    let run = muster(city('t53-after', (r) => setFlag(r, 'damian-visit-done')), 'The Gate.');
    run = go(run, 'Gate', 'Rescue.');
    expect(flagOf(run, 'sg-pokemon')).toBe(1);
    expect(scene(run, 'gn-53-gate').labels).toEqual(['Fight.', 'Repair.']);
    setFlag(run, 'sg-turn', 8);
    open(run, 'gn-53-commander');
    run = win(choose(run, 'gn-53-commander', 'Fight.').run);
    expect(flagOf(run, 'sg-turn')).toBe(TURNS + 1);
    expect(flagOf(run, 'siege-missing-homes')).toBe(1);
    expect(opened(run, 'gn-53-after')).toBe(true);
    run = choose(run, 'gn-53-after', 'Walk on.').run;
    const healed = visitSide(content, run, sideHere(run, 'heal')).run;
    expect(opened(healed, 'gn-53-waiting')).toBe(true);
    const before = healed.party.length + healed.box.length;
    const joined = choose(healed, 'gn-53-waiting', 'Let it come.').run;
    expect(joined.party.length + joined.box.length).toBe(before + 1);
    expect([...joined.party, ...joined.box].some((m) => m.gn?.includes('siege-rescued'))).toBe(true);
    joined.regionIndex += 1;
    open(joined, 'gn-53-plaque');
    expect(scene(joined, 'gn-53-plaque').intro).toContain('Damian');
  });
});

// ---- gn.54 The Magikarp Convention ----
import { boardOf, quillfeatherStart } from '../../src/core/greenneedle/karpcon';

const lake = (seed: string, prep?: (run: RunState) => void): RunState => {
  const run = gnRun(seed);
  prep?.(run);
  open(run, 'gn-54-lake');
  return choose(run, 'gn-54-lake', 'Go in.').run;
};
/** A convention with no secret this year (or with one, if `star` is given: 1-5 the regulars, 6 the player's own). */
const fixStar = (run: RunState, star: number): RunState => {
  setFlag(run, 'kc-star', star);
  return run;
};

describe('gn.54 The Magikarp Convention', () => {
  it('the hub: three attractions and the contest; watching gives Water-types Bond +1; the board shows the five regulars', () => {
    const run = lake('t54-hub', (r) => { r.party = [createPokemon(content, 'squirtle', 20, 'w-1'), createPokemon(content, 'pidgey', 20, 'p-1')]; });
    expect(scene(run, 'gn-54-hub').labels).toEqual(['Watch the synchronised jumping.', 'Browse the merchandise.', 'Talk to the serious man.', 'Go to the jumping contest.']);
    const intro = scene(run, 'gn-54-hub').intro;
    for (const n of ['Old Reliable', 'Lady Splendour', 'Chips', 'The Admiral', 'Notch']) expect(intro).toContain(n);
    expect(intro).toContain('3 ft 2 in');
    const before = run.party.map((m) => m.friendship);
    const after = choose(run, 'gn-54-hub', 'Watch the synchronised jumping.').run;
    expect(after.party[0]!.friendship).toBeGreaterThan(before[0]!);
    expect(after.party[1]!.friendship).toBe(before[1]);
    expect(scene(after, 'gn-54-hub').labels).not.toContain('Watch the synchronised jumping.');
  });

  it('the bandana is worn; Mr. Pettigrew has a stall if you bought his Magikarp', () => {
    const run = lake('t54-merch', (r) => { setFlag(r, 'karp-bought'); r.money = 1000; });
    const m = choose(run, 'gn-54-hub', 'Browse the merchandise.').run;
    expect(scene(m, 'gn-54-merch').intro).toContain('EXACTLY WHAT I SAY IT IS');
    const worn = choose(m, 'gn-54-merch', 'A Magikarp-print bandana (₽300).').run;
    expect(worn.party[0]!.marks).toContain('wears a Magikarp-print bandana');
  });

  it('the serious man: six Magikarp at A-2 knowing Splash, Tackle, Flail, Bounce, the last at 1 HP with a Sash; beaten, Bounce, and seven next time', () => {
    const run = lake('t54-quill');
    const q = choose(choose(run, 'gn-54-hub', 'Talk to the serious man.').run, 'gn-54-quill', 'Battle.').run;
    const team = q.battle!.enemyTeam;
    expect(team).toHaveLength(6);
    expect(team.every((m) => m.speciesId === 'magikarp')).toBe(true);
    expect(team[0]!.moves.map((x) => x.id)).toEqual(['splash', 'tackle', 'flail', 'bounce']);
    expect(team[5]!.hp).toBe(1);
    expect(team[5]!.held).toEqual({ 'focus-sash': 1 });
    const won = win(q);
    expect(flagOf(won, 'kc-quill')).toBe(1);
    expect(opened(won, 'gn-54-respect')).toBe(true);
    const seven = { enemyTeam: [createPokemon(content, 'magikarp', 10, 'q-0')], storyEffects: [] } as unknown as NonNullable<RunState['battle']>;
    quillfeatherStart(content, won, seven, (sp, lv, uid) => createPokemon(content, sp, lv, uid));
    expect(seven.enemyTeam).toHaveLength(7);
    expect(scene(won, 'gn-54-quill').intro).toContain('He has seven now');
  });

  it('the contest: enter your own or borrow one; "Just have fun" lands on the judges\' table for the crowd\'s prize (the hat)', () => {
    const run = fixStar(lake('t54-fun', (r) => { r.party = [createPokemon(content, 'magikarp', 15, 'k-1'), ...r.party]; }), 0);
    const c = choose(run, 'gn-54-hub', 'Go to the jumping contest.').run;
    expect(scene(c, 'gn-54-contest').labels).toEqual(['Enter your Magikarp.', 'Borrow one.', 'Just watch.']);
    const j = choose(c, 'gn-54-contest', 'Enter your Magikarp.').run;
    expect(scene(j, 'gn-54-jump').labels).toEqual(['Go on, you can do it.', 'Beat Lady Splendour.', 'Just have fun.']);
    const r = choose(j, 'gn-54-jump', 'Just have fun.');
    expect(said(r)).toContain('judges\' table');
    expect(flagOf(r.run, 'kc-place')).toBe(4);
    expect(r.run.party[0]!.marks).toContain('wears a hand-knitted Magikarp hat');
    expect(boardOf(r.run).at(-1)!.yours).toBe(true);
    expect(opened(r.run, 'gn-54-end')).toBe(true);
    const borrowed = choose(choose(lake('t54-borrow'), 'gn-54-hub', 'Go to the jumping contest.').run, 'gn-54-contest', 'Borrow one.').run;
    expect(scene(borrowed, 'gn-54-contest').labels).toEqual(['Borrow one.', 'Just watch.']);
  });

  it('the secret: Notch for certain if you encouraged it three times in gn.23; it looks for you, and joins as the story\'s ending', () => {
    const run = lake('t54-notch', (r) => { setFlag(r, 'karp-1'); setFlag(r, 'karp-encouraged', 3); });
    expect(flagOf(run, 'kc-star')).toBe(5);
    const s = choose(choose(run, 'gn-54-hub', 'Go to the jumping contest.').run, 'gn-54-contest', 'Just watch.').run;
    expect(scene(s, 'gn-54-secret').intro).toContain('finds the right face');
    expect(scene(s, 'gn-54-secret').labels).toEqual(['Hold out your hand.', 'Let it go free.']);
    const before = s.party.length + s.box.length;
    const joined = choose(s, 'gn-54-secret', 'Hold out your hand.').run;
    expect(joined.party.length + joined.box.length + joined.pending.length).toBeGreaterThan(before);
    expect(flagOf(joined, 'karp-end')).toBe(1);
    expect(boardOf(joined).at(-1)!.star).toBe(4);
  });

  it('a regular evolves: it goes down the river with a star; next convention it\'s gone and the others jump higher; the poster later', () => {
    let run = fixStar(lake('t54-reg'), 3);
    run = choose(choose(run, 'gn-54-hub', 'Go to the jumping contest.').run, 'gn-54-contest', 'Just watch.').run;
    expect(scene(run, 'gn-54-secret').intro).toContain('It\'s Chips.');
    expect(scene(run, 'gn-54-secret').labels).toEqual(['Watch it go.']);
    run = choose(choose(run, 'gn-54-secret', 'Watch it go.').run, 'gn-54-end', 'Go home.').run;
    const first = boardOf(run)[0]!;
    run.regionIndex += 1;
    open(run, 'gn-54-poster');
    expect(scene(run, 'gn-54-poster').intro).toContain('small Gyarados');
    open(run, 'gn-54-lake');
    run = choose(run, 'gn-54-lake', 'Go in.').run;
    const second = boardOf(run)[1]!;
    expect(second.s[2]).toBe(0);
    expect(second.s[0]).toBe(first.s[0]);
    expect(scene(run, 'gn-54-hub').intro).toContain('★');
  });

  it('your own Magikarp evolves: it changes in your party and goes on the board under your name', () => {
    let run = fixStar(lake('t54-mine', (r) => { r.party = [createPokemon(content, 'magikarp', 15, 'k-1'), ...r.party]; }), 6);
    run = choose(choose(run, 'gn-54-hub', 'Go to the jumping contest.').run, 'gn-54-contest', 'Enter your Magikarp.').run;
    run = choose(run, 'gn-54-jump', 'Just have fun.').run;
    expect(scene(run, 'gn-54-secret').labels).toEqual(['Welcome it back.']);
    run = choose(run, 'gn-54-secret', 'Welcome it back.').run;
    expect(run.party[0]!.speciesId).toBe('gyarados');
    expect(boardOf(run).at(-1)!.star).toBe(-2);
  });
});

// ---- gn.55 The Angry Bidoof ----
import { bidoofTurn } from '../../src/core/greenneedle/bidoof';
import { bidoofPeace } from '../../src/core/greenneedle/bidoof';

const road = (seed: string, prep?: (run: RunState) => void): RunState => {
  const run = gnRun(seed);
  prep?.(run);
  open(run, 'gn-55-bidoof');
  return run;
};
const bidoofIn = (run: RunState) => run.battle!.enemyTeam[0]!;

describe('gn.55 The Angry Bidoof', () => {
  it('the doc\'s three answers; "It\'s a Bidoof" starts it at +1 Attack; tripled stats, its four moves, Simple, full-power Return', () => {
    const run = road('t55-insult');
    expect(scene(run, 'gn-55-bidoof').labels).toEqual(['I wasn\'t laughing.', 'It\'s a Bidoof.', 'Sorry. It\'s a very fine Bidoof.']);
    const b = choose(choose(run, 'gn-55-bidoof', 'It\'s a Bidoof.').run, 'gn-55-fight', 'Battle.').run;
    const foe = bidoofIn(b);
    expect(foe.speciesId).toBe('bidoof');
    expect(foe.moves.map((m) => m.id)).toEqual(['superpower', 'aqua-tail', 'return', 'curse']);
    expect(foe.fixedAbility).toBe('simple');
    expect(foe.friendship).toBe(255);
    expect(b.battle!.enemyStages.atk).toBe(1);
    const plain = createPokemon(content, 'bidoof', foe.level, 'plain');
    expect(calcStats(content, foe).atk).toBeGreaterThanOrEqual(calcStats(content, plain).atk * 3 - 3);
    expect(b.battle!.eventRule).toMatchObject({ gn: 'bidoof', noCatch: true });
    const calm = choose(choose(road('t55-calm'), 'gn-55-bidoof', 'I wasn\'t laughing.').run, 'gn-55-fight', 'Battle.').run;
    expect(calm.battle!.enemyStages.atk).toBe(0);
    // It knows about the Bibarel dam: +2 whatever you say.
    const dam = road('t55-dam', (r) => setFlag(r, 'bibarel-dam-broken'));
    expect(scene(dam, 'gn-55-bidoof').intro).toContain('It knows about the dam');
    expect(choose(choose(dam, 'gn-55-bidoof', 'I wasn\'t laughing.').run, 'gn-55-fight', 'Battle.').run.battle!.enemyStages.atk).toBe(2);
  });

  it('Mr. Applewhite explains, throughout: a first faint, Curse, a super-effective hit survived, a second faint, winning, losing', () => {
    const run = choose(choose(road('t55-talk'), 'gn-55-bidoof', 'I wasn\'t laughing.').run, 'gn-55-fight', 'Battle.').run;
    const lines: string[] = [];
    const battle = run.battle!;
    const party = [createPokemon(content, 'pidgey', 20, 'a'), createPokemon(content, 'pidgey', 20, 'b'), createPokemon(content, 'pidgey', 20, 'c')];
    party[0]!.hp = 0;
    bidoofTurn(content, battle, party, [{ type: 'move', side: 'enemy', moveId: 'curse' }, { type: 'damage', side: 'enemy', effectiveness: 2 }], (t) => lines.push(t));
    expect(lines.join(' ')).toContain('rodents are terribly determined');
    expect(lines.join(' ')).toContain('homebodies');
    expect(lines.join(' ')).toContain('teeth never stop growing');
    party[1]!.hp = 0;
    battle.enemyTeam[0]!.hp = 1;
    bidoofTurn(content, battle, party, [], (t) => lines.push(t));
    expect(lines.join(' ')).toContain('bought it at a fair');
    expect(lines.join(' ')).toContain('now you\'ve upset it');
    expect(lines.join(' ')).toContain('It likes turnips');
    const n = lines.length;
    bidoofTurn(content, battle, party, [{ type: 'move', side: 'enemy', moveId: 'curse' }], (t) => lines.push(t));
    expect(lines).toHaveLength(n);
  });

  it('beaten, it sits on your foot and joins: Unbothered, a fixed +30%; lose and nothing\'s taken, and you can try again', () => {
    const run = choose(choose(road('t55-win'), 'gn-55-bidoof', 'I wasn\'t laughing.').run, 'gn-55-fight', 'Battle.').run;
    const lost = lose(run);
    expect(opened(lost, 'gn-55-sorry')).toBe(true);
    expect(scene(lost, 'gn-55-sorry').labels).toEqual(['Try again.', 'Walk on.']);
    const won = win(run);
    const mon = [...won.party, ...won.box].find((m) => m.gn?.includes('just-a-bidoof'))!;
    expect(mon.fixedAbility).toBe('unbothered');
    expect(mon.eventBoosts?.atk).toBe(30);
    expect(opened(won, 'gn-55-foot')).toBe(true);
    expect(scene(won, 'gn-55-foot').intro).toContain('It ate my sofa.');
  });

  it('"a very fine Bidoof" with a Bond 3 lead: the bow, a Silk Scarf, and no wild Bidoof or Bibarel attacks first; without, it bows first and fights', () => {
    const low = choose(road('t55-low'), 'gn-55-bidoof', 'Sorry. It\'s a very fine Bidoof.').run;
    expect(opened(low, 'gn-55-bows-first')).toBe(true);
    const won0 = choose(low, 'gn-55-bows-first', 'Bow back, and battle.').run;
    const run = road('t55-bow', (r) => { r.party[0]!.friendship = 255; });
    const bowed = choose(choose(run, 'gn-55-bidoof', 'Sorry. It\'s a very fine Bidoof.').run, 'gn-55-bow', 'Take it.').run;
    expect(flagOf(bowed, 'bidoof-end')).toBe(2);
    expect((bowed.inventory['silk-scarf'] ?? 0) + bowed.party.reduce((n, m) => n + (m.held?.['silk-scarf'] ?? 0), 0)).toBe(1);
    // A wild Bidoof waits its first turn.
    const peace = structuredClone(bowed);
    peace.phase = 'battle';
    peace.battle = { ...structuredClone(won0.battle!), enemyTeam: [createPokemon(content, 'bibarel', 20, 'wild-bib')], enemyIndex: 0, storyEffects: [] } as NonNullable<RunState['battle']>;
    expect(peace.battle.kind).toBe('wild');
    bidoofPeace(peace, FOE_WAITS);
    expect(peace.battle.storyEffects.join(' ')).toContain('won\'t be the one to start this');
  });

  it('later, the boy who laughed crosses the road; two roads if the Bidoof\'s with you', () => {
    const won = win(choose(choose(road('t55-lucan'), 'gn-55-bidoof', 'I wasn\'t laughing.').run, 'gn-55-fight', 'Battle.').run);
    won.stage!.index += 1;
    open(won, 'gn-55-lucan');
    expect(scene(won, 'gn-55-lucan').intro).toContain('crosses a second road');
  });
});

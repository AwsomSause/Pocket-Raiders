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

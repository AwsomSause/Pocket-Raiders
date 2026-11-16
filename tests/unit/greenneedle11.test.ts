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

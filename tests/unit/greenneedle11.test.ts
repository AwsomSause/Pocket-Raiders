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

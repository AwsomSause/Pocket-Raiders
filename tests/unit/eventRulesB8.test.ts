import { describe, expect, it } from 'vitest';
import { coStartRules } from '../../src/core/battle/coRules';
import { eventRuleEnd } from '../../src/core/battle/engine';
import { chooseEvent } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import { RunStateSchema } from '../../src/core/state';
import { content } from './helpers';

const currentFoe = (b: { enemyTeam: { moves: { id: string }[] }[]; enemyIndex: number }) => b.enemyTeam[b.enemyIndex]!;

describe('hidden-foe rules (run events B batch 8)', () => {
  const start = (eventId: string, flags: string[] = []) => {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'r', seed: 'rb8', archetypeId: 'red' }), 0));
    for (const f of flags) run.story.flags[`ev:${f}`] = 1;
    const node = run.stage!.map.nodes[0]!;
    run.stage!.current = node.id;
    run.stage!.visited = [node.id];
    node.sides.push({ id: 'duel', kind: 'event', used: false, eventId });
    return chooseEvent(content, run, 'duel', 0).run;
  };
  it('Blindfold Bout hides the foe and Magician\'s Misdirection names a decoy, both saved on the battle', () => {
    const blind = start('blindfold-bout');
    expect(blind.battle?.eventRule?.hiddenFoe).toBe(true);
    const magic = start('magicians-misdirection');
    // Catalog Overhaul SF72: every foe comes out disguised as a different Pokémon ('*'); the battle start picks the first.
    expect(magic.battle?.eventRule?.decoyFoe).toBe('*');
    coStartRules(magic.battle!, []);
    expect(content.species.has(magic.battle!.eventRule!.decoyFoe!)).toBe(true);
    expect(magic.battle!.eventRule!.decoyFoe).not.toBe(magic.battle!.enemyTeam[0]!.speciesId);
    expect(RunStateSchema.parse(JSON.parse(JSON.stringify(magic))).battle?.eventRule).toEqual(magic.battle?.eventRule);
  });
  it('batch 9: mimic copies your move, spare wins without a KO, and the events carry their rules', () => {
    const mime = start('mimic-mayhem');
    const battle = mime.battle!;
    battle.playerVolatile.lastMove = 'tackle';
    eventRuleEnd(battle, [], mime.party, content);
    expect(currentFoe(battle).moves.map((m) => m.id)).toEqual(['tackle']);
    const ranger = start('eco-ranger-test').battle!;
    expect(ranger.eventRule?.spare).toBe(true);
    ranger.enemyTeam.forEach((m) => (m.hp = 1));
    eventRuleEnd(ranger, [], [], content);
    expect(ranger.outcome).toBe('win');
    const awake = start('eco-ranger-test').battle!;
    eventRuleEnd(awake, [], [], content);
    expect(awake.outcome).toBeNull();
    expect(start('library-duel-silence').battle?.eventRule?.silent).toBe(true);
    // SF72 Roofer Jax: Flying-types are faster, and an early knockout is noted for the prize.
    expect(start('rooftop-rumble').battle?.eventRule).toMatchObject({ earlyKo: 2, typeSpeed: { type: 'flying', mult: 1.1 } });
  });
  it('batch 10: sky, sniper, contest and loaner events carry their rules', () => {
    // SF72 Bird Keeper Perry: the Road Roster meeting decides which Accept shows; this one is after meeting him.
    expect(start('sky-duel', ['roster-perry-m1']).battle?.eventRule?.sky).toBe(true);
    expect(start('sniper-ambush').battle?.eventRule?.sniper).toBe(true);
    const contest = start('contest-judges-challenge').battle!;
    expect(contest.eventRule?.contest).toBe(4);
    for (const m of ['tackle', 'growl', 'ember', 'leer']) {
      contest.playerVolatile.lastMove = m;
      eventRuleEnd(contest, [], [], content);
      if (m !== 'leer') expect(contest.outcome).toBeNull();
    }
    expect(contest.outcome).toBe('win');
    const again = start('contest-judges-challenge').battle!;
    again.playerVolatile.lastMove = 'tackle';
    eventRuleEnd(again, [], [], content);
    eventRuleEnd(again, [], [], content);
    expect(again.outcome).toBeNull();
    const draft = content.events.get('dream-team-draft')!;
    expect(draft.choices.filter((c) => JSON.stringify(c).includes('"ally"')).length).toBe(3);
  });
});

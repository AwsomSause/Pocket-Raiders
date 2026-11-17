// Greenneedle gn.61: The Final Reunion (tools/events/co/greenneedle-61.ts; rules in src/core/greenneedle/reunion.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { takeTurn } from '../../src/core/run';
import { agencyArrives, callHelper, gathering, helperButtons, reunionTakeHit } from '../../src/core/greenneedle/reunion';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';

const PREP: [string, number][] = [['damian-meetings', 2], ['kanto-rain-fire', 1], ['kanto-mankey', 1], ['mankey-food-returned', 1], ['kaiju-freed', 1], ['abandoned-mon', 1], ['cubone-trusted', 1], ['mansion-mimikyu', 1], ['mansion-coat', 1], ['desert-saw-idris', 1], ['ferris-belt', 1], ['poli-ending-reconcile', 1], ['psyduck-hat', 1]];
function arrived(seed: string, prep: [string, number][] = PREP): RunState {
  const run = gnRun(seed);
  run.badges = ['brock', 'misty'];
  for (const [k, n] of prep) setFlag(run, k, n);
  open(run, 'gn-61-field');
  return choose(run, 'gn-61-field', 'Walk down into the field.').run;
}
const go = (run: RunState, id: string, label: string): RunState => choose(run, id, label).run;
/** Walks up to everyone, one at a time, and returns every line heard. */
function walkAll(start: RunState): string {
  let run = go(start, 'gn-61-hub', 'Walk among them and talk.');
  const heard = [scene(run, 'gn-61-walk').intro];
  while (scene(run, 'gn-61-walk').labels.includes('Walk on to the next.')) {
    run = go(run, 'gn-61-walk', 'Walk on to the next.');
    heard.push(scene(run, 'gn-61-walk').intro);
  }
  return heard.join('\n\n');
}

describe('gn.61 The Final Reunion', () => {
  it('the field comes first, and is a must-see that needs the last region\'s last stage', () => {
    const e = content.events.get('gn-61-field')!;
    expect(e.forced).toBe(true);
    expect(JSON.stringify(e.requires)).toContain('lastRegion');
    expect(scene(gnRun('a'), 'gn-61-field').labels).toEqual(['Walk down into the field.']);
  });

  it('calls everyone whose flags ended well, and the Gym Leaders always', () => {
    const run = arrived('b');
    const g = gathering(run)!;
    const ids = g.att.map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['leader-brock', 'leader-misty', 'damian', 'pond', 'rainfire', 'mankey', 'freed-kaiju', 'abandoned']));
    expect(flagOf(run, 'reunion-count')).toBe(g.att.length);
    expect(scene(run, 'gn-61-hub').intro).toContain('have come');
  });

  it('everyone has one line, built from what happened (went well / otherwise)', () => {
    let run = arrived('c');
    const text = walkAll(run);
    expect(text).toContain('I\'ve got a Gym. With *pillars.*');
    expect(text).toContain('Five Poliwhirl and a Poliwrath');
    expect(text).toContain('on each other\'s shoulders');
    expect(text).toContain('Gym Leader');
    const other = arrived('c2', [['damian-meetings', 1], ['poli-ending-release', 1], ['kanto-mankey', 1]]);
    const t2 = walkAll(other);
    expect(t2).toContain('Still thinking. — D.');
    expect(t2).toContain('Four Poliwhirl');
    expect(t2).toContain('Four Mankey sit apart');
  });

  it('the far edge: each one is walked up to, and the answer is kept', () => {
    let run = arrived('d');
    run = go(run, 'gn-61-hub', 'Walk among them and talk.');
    expect(flagOf(run, 'reunion-farleft')).toBe(1);
    run = go(run, 'gn-61-walk', 'Stand at the far edge.');
    expect(scene(run, 'gn-61-far').labels).toEqual(['I\'m sorry.', 'I\'d do it again.', '(Say nothing, and stay.)', 'Go back to the others.']);
    const r = choose(run, 'gn-61-far', 'I\'m sorry.');
    expect(r.text + r.changes.join(' ')).toContain('It was heard');
    expect(flagOf(r.run, 'reunion-far-abandoned')).toBe(1);
    expect(flagOf(r.run, 'reunion-farleft')).toBe(0);
    expect(flagOf(r.run, 'reunion-farvisit')).toBe(1);
  });

  it('introductions give nothing, and only pairs who are both here are offered', () => {
    let run = arrived('e');
    run = go(run, 'gn-61-hub', 'Introduce two people who should meet.');
    expect(scene(run, 'gn-61-intro').labels).toEqual(['Introduce Idris and Ferris.', 'Introduce the Cubone and the Mimikyu.', 'Go back to the middle.']);
    const r = choose(run, 'gn-61-intro', 'Introduce the Cubone and the Mimikyu.');
    expect(flagOf(r.run, 'reunion-introduced-3')).toBe(1);
    expect(r.run.money).toBe(run.money);
  });

  it('giving something back is always refused', () => {
    let run = arrived('f');
    run = go(run, 'gn-61-hub', 'Give something back.');
    const r = choose(run, 'gn-61-give', 'Give back the mayor\'s hat.');
    expect(r.text).toContain('Keep it');
    expect(flagOf(r.run, 'reunion-gave-hat')).toBe(1);
  });

  it('the three with the longest history are offered; each can be accepted or declined', () => {
    let run = arrived('g');
    expect(flagOf(run, 'reunion-offers')).toBe(3);
    run = go(run, 'gn-61-hub', 'Sit down where you are.');
    run = go(run, 'gn-61-help-1', 'Ask them to stand with you.');
    run = go(run, 'gn-61-help-2', 'Let them rest.');
    run = go(run, 'gn-61-help-3', 'Ask them to stand with you.');
    expect([1, 2, 3].map((n) => flagOf(run, `reunion-help-${n}`))).toEqual([1, 0, 1]);
    run = go(run, 'gn-61-end', 'Go to the table.');
    expect(flagOf(run, 'reunion-done')).toBe(1);
    expect(flagOf(run, 'reunion-sat')).toBe(1);
  });

  it('with almost nobody and no kindness, the field has six people and two chairs each', () => {
    const run = gnRun('h');
    run.badges = [];
    open(run, 'gn-61-field');
    const r = go(run, 'gn-61-field', 'Walk down into the field.');
    expect(flagOf(r, 'reunion-offers')).toBe(0);
    expect(scene(r, 'gn-61-hub').labels).toEqual(['Walk among them and talk.', 'Sit down where you are.']);
  });

  it('the helpers are called once each in the final battle and the Slowpoke arrive on turn six', () => {
    const battle = { storyEffects: ['helper:1:ace:Damian', 'helper:2:guard:The Cubone', 'helper:3:agency:The Slowpoke Detective Agency'], turn: 1 };
    expect(helperButtons(battle).map((h) => h.slot)).toEqual([1, 2]);
    expect(agencyArrives(battle)).toBe('');
    battle.turn = 6;
    expect(agencyArrives(battle)).toContain('Slowpoke');
    expect(agencyArrives(battle)).toBe('');
    expect(callHelper(battle, 2)?.kind).toBe('guard');
    expect(callHelper(battle, 2)).toBeNull();
    battle.storyEffects.push('helper-guard:The Cubone');
    expect(reunionTakeHit(battle)).toBe('The Cubone');
    expect(reunionTakeHit(battle)).toBe('');
  });

  it('the engine plays a called helper: the ace hits, food heals, a guard stands in', () => {
    let run = gnRun('i');
    open(run, 'gn-55-fight');
    run = choose(run, 'gn-55-fight', 'Battle.').run;
    expect(run.phase).toBe('battle');
    run.battle!.storyEffects.push('helper:1:ace:Damian', 'helper:2:guard:The Cubone');
    run.battle!.enemyTeam[0]!.eventBoosts = {};
    run.battle!.enemyTeam[0]!.moves = run.battle!.enemyTeam[0]!.moves.slice(0, 1).map((m) => ({ ...m, id: 'splash' }));
    const foeBefore = run.battle!.enemyTeam[0]!.hp;
    const hit = takeTurn(content, run, { kind: 'helper', slot: 1 });
    expect(hit.events.some((e) => e.type === 'raid' && e.text.startsWith('Damian!'))).toBe(true);
    expect(hit.run.battle!.enemyTeam[0]!.hp).toBeLessThan(foeBefore);
    expect(() => takeTurn(content, hit.run, { kind: 'helper', slot: 1 })).toThrow();
    const guard = takeTurn(content, hit.run, { kind: 'helper', slot: 2 });
    expect(guard.run.battle!.storyEffects.includes('helper-used:2')).toBe(true);
  });
});

describe('gn.61 afterstories from other events', () => {
  it('the Mural (walls), the Impersonator (two of somebody) and the Cheer Squad (split or both) come to the field', () => {
    const run = arrived('j', [['mural-walls', 3], ['impersonator-joined', 1], ['cheer-split', 1]]);
    const walk = walkAll(run);
    expect(walk).toContain('3 walls');
    expect(walk).toContain('Two of somebody');
    expect(walk).toContain('The one you left on the road');
    const both = arrived('k', [['cheer-truth', 1]]);
    expect(walkAll(both)).toContain('cheering in time');
  });
});

describe('gn.61 Road Roster trainers', () => {
  it('trainers met twice come, by name', () => {
    const run = arrived('l', [['roster-joey-m2', 1], ['roster-joey-done', 1], ['roster-nell-m1', 1]]);
    const ids = gathering(run)!.att.map((a) => a.id);
    expect(ids).toContain('road-joey');
    expect(ids).not.toContain('road-nell');
    expect(walkAll(run)).toContain('Joey');
  });
});

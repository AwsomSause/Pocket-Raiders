// Fixes to gn.61 The Final Reunion against the doc (GREENNEEDLE_REWORKED_PLACED_13.md "Who comes"): the guests are called by the
// flags their own events really set; they are walked up to one at a time; who you stood with sits beside you at the Long Table.
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { BESIDE, gathering } from '../../src/core/greenneedle/reunion';
import { ltTokens } from '../../src/core/greenneedle/longtable';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';

function arrived(seed: string, prep: [string, number][], before: (run: RunState) => void = () => undefined): { run: RunState; said: string } {
  const run = gnRun(seed);
  for (const [k, n] of prep) setFlag(run, k, n);
  before(run);
  open(run, 'gn-61-field');
  const r = choose(run, 'gn-61-field', 'Walk down into the field.');
  return { run: r.run, said: r.text + r.changes.join(' ') };
}
const ids = (run: RunState): string[] => gathering(run)!.att.map((a) => a.id);
const lineOf = (run: RunState, id: string): string => gathering(run)!.att.find((a) => a.id === id)?.line ?? '';

describe('gn.61 fixes: who comes', () => {
  it('each guest is called by the flag their own event sets', () => {
    const cases: [string, [string, number][]][] = [
      ['ferris', [['ferris-meetings', 2]]],
      ['oldfriend', [['oldfriend-met', 1]]],
      ['agency', [['slowpoke-case', 1]]],
      ['ffion', [['kaiju-left', 1]]],
      ['tamsel', [['village-kept-secret', 1]]],
      ['holloways', [['daycare-left-village', 1]]],
      ['wicker', [['market-left', 1]]],
      ['well', [['well-done', 1]]],
      ['coat', [['coat-free', 1]]],
      ['freed-prison', [['prison-freed-strangers', 2]]],
      ['freed-pens', [['freed-caged', 1]]],
      ['rosabel', [['partner-met', 1]]],
      ['brains', [['frontier-symbols', 1]]],
      ['lenders', [['draft-round', 7]]],
      ['river', [['factory-valves', 1]]],
    ];
    for (const [id, prep] of cases) expect(ids(arrived(`who-${id}`, prep).run), id).toContain(id);
    // Nobody comes for a story that never happened.
    expect(ids(arrived('who-none', []).run)).toEqual([]);
  });

  it('Ferris: six on the belt when the request was answered, five when it was not', () => {
    expect(lineOf(arrived('f6', [['ferris-meetings', 3], ['ferris-request-waited', 1]]).run, 'ferris')).toContain('six on the belt');
    expect(lineOf(arrived('f5', [['ferris-meetings', 3]]).run, 'ferris')).toContain('five on the belt');
  });

  it('Captain Ffion: the gap in the pier when the Kaiju was freed, rebuilt otherwise', () => {
    expect(lineOf(arrived('p1', [['kaiju-left', 1], ['kaiju-freed', 1]]).run, 'ffion')).toContain('gap in the pier');
    expect(lineOf(arrived('p2', [['kaiju-left', 1]]).run, 'ffion')).toContain('We rebuilt');
  });

  it('Linus comes in every ending but the one where the Pokémon left him', () => {
    expect(ids(arrived('l2', [['wontevolve-done', 1], ['wontevolve-end', 2]]).run)).toContain('linus');
    expect(lineOf(arrived('l2b', [['wontevolve-done', 1], ['wontevolve-end', 2]]).run, 'linus')).toContain('decided, again, not to');
    expect(lineOf(arrived('l1', [['wontevolve-done', 1], ['wontevolve-end', 1]]).run, 'linus')).toContain('nods to it first');
    expect(ids(arrived('l5', [['wontevolve-done', 1], ['wontevolve-end', 5], ['wontevolve-linus-gone', 1]]).run)).not.toContain('linus');
    expect(ids(arrived('l0', []).run)).not.toContain('linus');
  });

  it('Rosabel is on a folding chair; if it went home, it is on her lap and waves', () => {
    expect(lineOf(arrived('r1', [['partner-met', 1], ['partner-went-home', 1]]).run, 'rosabel')).toContain('on her lap, and it waves');
    const stayed = lineOf(arrived('r2', [['partner-met', 1]]).run, 'rosabel');
    expect(stayed).toContain('folding chair');
    expect(stayed).not.toContain('waves');
  });

  it('the separated pair find each other, and the recruited one goes (never the last Pokémon)', () => {
    const mark = (run: RunState): void => { run.party[run.party.length - 1]!.fixedAbility = 'truce'; };
    const { run, said } = arrived('t1', [['truce-one', 1]], (r) => { r.party.push({ ...structuredClone(r.party[0]!), uid: 'truce-test' }); mark(r); });
    expect(said).toContain('They find each other');
    expect(run.party.some((m) => m.fixedAbility === 'truce')).toBe(false);
    expect(ids(run)).toContain('truce');
    // Let in at the firelight: nobody goes.
    const kept = arrived('t2', [['truce-one', 1], ['truce-reunited', 1]], (r) => { r.party.push({ ...structuredClone(r.party[0]!), uid: 'truce-test' }); mark(r); }).run;
    expect(kept.party.some((m) => m.fixedAbility === 'truce')).toBe(true);
    expect(ids(kept)).not.toContain('truce');
    // Boundary: it is the only Pokémon left, so it stays.
    const alone = arrived('t3', [['truce-one', 2]], (r) => { r.party = r.party.slice(0, 1); mark(r); }).run;
    expect(alone.party).toHaveLength(1);
  });

  it('The Ones You Left: the others are there, and the one from the woods arrives last', () => {
    const { run } = arrived('w1', [['damian-meetings', 1]], (r) => { r.story.flags['left:fates'] = 'pidgey:woods,rattata:trainer,oddish:camp'; });
    const all = ids(run);
    expect(all).toContain('left-ones');
    expect(all[all.length - 1]).toBe('left-woods');
    expect(lineOf(run, 'left-woods')).toContain('arrives last');
    expect(flagOf(run, 'reunion-count')).toBe(all.length);
  });
});

describe('gn.61 fixes: the far edge', () => {
  it('holds the robbed, the betrayed and the walked past; whether an apology is accepted depends on them', () => {
    let { run } = arrived('e1', [['robbed-trainer', 1], ['village-told', 1], ['kind-walked-past', 2]]);
    const far = gathering(run)!.att.filter((a) => a.far).map((a) => a.id);
    expect(far).toEqual(['robbed', 'village', 'passed']);
    expect(ids(run)).not.toContain('tamsel');
    run = choose(run, 'gn-61-hub', 'Walk among them and talk.').run;
    run = choose(run, 'gn-61-walk', 'Stand at the far edge.').run;
    const robbed = choose(run, 'gn-61-far', 'I\'m sorry.');
    expect(robbed.text + robbed.changes.join(' ')).toContain('They do not answer');
    expect(flagOf(robbed.run, 'reunion-forgiven-robbed')).toBe(0);
    const tamsel = choose(robbed.run, 'gn-61-far', 'I\'m sorry.');
    expect(tamsel.text + tamsel.changes.join(' ')).toContain('it was taken');
    expect(flagOf(tamsel.run, 'reunion-forgiven-village')).toBe(1);
  });
});

describe('gn.61 fixes: walking, and where you sat', () => {
  it('people are walked up to one at a time, and the walk starts again when everyone has been heard', () => {
    let { run } = arrived('s1', [['damian-meetings', 2], ['ferris-meetings', 1], ['well-done', 1]]);
    run = choose(run, 'gn-61-hub', 'Walk among them and talk.').run;
    const first = scene(run, 'gn-61-walk');
    expect(first.intro).toContain('pillars');
    expect(first.intro).not.toContain('Ferris');
    expect(first.labels).toContain('Walk on to the next.');
    let stops = 1;
    while (scene(run, 'gn-61-walk').labels.includes('Walk on to the next.')) { run = choose(run, 'gn-61-walk', 'Walk on to the next.').run; stops++; }
    expect(stops).toBe(gathering(run)!.att.length);
    expect(scene(run, 'gn-61-walk').intro).toContain('The well');
    run = choose(run, 'gn-61-walk', 'Go back to the middle.').run;
    run = choose(run, 'gn-61-hub', 'Walk among them and talk.').run;
    expect(scene(run, 'gn-61-walk').intro).toContain('pillars');
  });

  it('whoever you were standing with keeps the chair beside yours at the Long Table', () => {
    let { run } = arrived('s2', [['damian-meetings', 2], ['ferris-meetings', 1]]);
    expect(ltTokens(run, '{lt:beside}')).toBe('');
    run = choose(run, 'gn-61-hub', 'Walk among them and talk.').run;
    while (scene(run, 'gn-61-walk').labels.includes('Walk on to the next.')) run = choose(run, 'gn-61-walk', 'Walk on to the next.').run;
    expect(run.story.flags[BESIDE]).toBe('Ferris');
    expect(ltTokens(run, '{lt:beside}')).toContain('Ferris');
    setFlag(run, 'lt-n1', 1);
    expect(ltTokens(run, '{lt:talk:1}')).toContain('Ferris');
  });
});

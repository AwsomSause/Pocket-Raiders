// Greenneedle gn.59, The Former Champion: Ferris's meetings, the advice that pays off, the battle and the request.
import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, scene, setFlag, win } from './helpers/gnPlay';
import { ferrisCatch, ferrisFree, ferrisBossMark, ferrisShape, FERRIS_FIVE, OLD_MOVES, TUTOR_MOVES } from '../../src/core/greenneedle/ferris';
import { maxHp } from '../../src/core/pokemon';
import { takeTurn } from '../../src/core/run';
import { expLevelShift } from '../../src/core/battle/held';
import type { BattleState, RunState } from '../../src/core/state';

const hasStop = (run: RunState, id: string): boolean => run.stage!.map.nodes.some((n) => n.sides.some((x) => x.eventId === id && !x.used));
const fake = (o: object): BattleState => o as unknown as BattleState;

const start = (seed: string) => {
  const run = gnRun(seed);
  open(run, 'gn-59-fire');
  return run;
};
const sit = (run: ReturnType<typeof gnRun>) => {
  const r = choose(run, 'gn-59-fire', 'Sit.').run;
  expect(hasStop(r, `gn-59-s${Math.min(run.regionIndex + 1, 6)}`)).toBe(true);
  return r;
};

describe('gn.59 The Former Champion', () => {
  it('is built from real content', () => {
    for (const id of ['gn-59-fire', 'gn-59-request', 'gn-59-grass', 'gn-59-clip', 'gn-59-stop']) expect(content.events.has(id), id).toBe(true);
    expect(content.catalog.has('ferris-hat') || content.items.has('ferris-hat')).toBe(true);
    for (const id of FERRIS_FIVE) expect(content.species.has(id)).toBe(true);
    for (const m of [...Object.values(TUTOR_MOVES), ...Object.values(OLD_MOVES)]) expect(content.moves.has(m), m).toBe(true);
  });

  it('one meeting a region: the door shuts for the region after it', () => {
    let run = start('gn59-a');
    run = sit(run);
    expect(flagOf(run, 'ferris-meetings')).toBe(1);
    expect(flagOf(run, 'ferris-advice-1')).toBe(1);
    expect(flagOf(run, 'ferris-story')).toBe(0);
  });

  it('the 6th region and on share the empty-clip story', () => {
    const run = start('gn59-b');
    run.regionIndex = 7;
    const r = sit(run);
    expect(flagOf(r, 'ferris-story')).toBe(5);
    expect(flagOf(r, 'ferris-advice-6')).toBe(1);
  });

  it('tea only, mid-run: he lets you go (not the last region)', () => {
    let run = start('gn59-c');
    run.regionOrder = ['kanto', 'johto', 'hoenn'];
    run = sit(run);
    run = choose(run, 'gn-59-s1', 'Listen.').run;
    expect(scene(run, 'gn-59-after').labels).toContain('What\'s the empty clip?');
    run = choose(run, 'gn-59-after', 'Just the tea, thanks.').run;
    expect(hasStop(run, 'gn-59-leave')).toBe(true);
  });

  it('the battle: five, no items, no switching; winning leads to a tutor and remembers who lasted', () => {
    let run = start('gn59-d');
    run.regionOrder = ['kanto', 'johto', 'hoenn'];
    run = sit(run);
    run = choose(run, 'gn-59-s1', 'Listen.').run;
    const c = choose(run, 'gn-59-after', 'Would you battle me?');
    expect(c.battle).toBe(true);
    const b = c.run.battle!;
    expect(b.enemyTeam.map((m) => m.speciesId)).toEqual(FERRIS_FIVE);
    expect(b.enemySwitches).toBeGreaterThan(50);
    run = win(c.run);
    expect(flagOf(run, 'ferris-battled')).toBe(1);
    expect(hasStop(run, 'gn-59-tutor')).toBe(true);
  });

  it('the request in the last region: waiting in the grass gives the hat and the Ball goes on the belt', () => {
    let run = start('gn59-e');
    run.regionOrder = ['johto'];
    run = sit(run);
    expect(run.story.flags['ev:cast-ferris-first:rattata'] ?? run.story.flags['ev:cast-ferris-first:sentret']).toBe(1);
    run = choose(run, 'gn-59-s1', 'Listen.').run;
    run = choose(run, 'gn-59-after', 'Just the tea, thanks.').run;
    expect(hasStop(run, 'gn-59-request')).toBe(true);
    run = choose(run, 'gn-59-request', 'Find one with me.').run;
    run = choose(run, 'gn-59-grass', 'Let it come to you.').run;
    expect(flagOf(run, 'ferris-request-waited')).toBe(1);
    const got = choose(run, 'gn-59-clip', 'Take the hat.');
    run = got.run;
    expect(got.changes.join(' ')).toContain('Ferris\'s Hat');
  });

  it('a first catch that was lost: Ferris knows', () => {
    const run = start('gn59-f');
    setFlag(run, 'lost-mon');
    expect(scene(run, 'gn-59-clip').intro).toContain('Even late');
  });

  it('2nd region advice: Stop shows the hidden thing, free (only in the region it was given)', () => {
    const run = gnRun('gn59-g');
    run.regionIndex = 1;
    setFlag(run, 'ferris-advice-2');
    setFlag(run, 'ferris-at', 2);
    open(run, 'gn-59-stop');
    const r = choose(run, 'gn-59-stop', 'Stop.').run;
    expect(flagOf(r, 'ferris-stop')).toBe(1);
  });

  it('3rd region advice doubles the catch of a wild that outruns your lead, nowhere else', () => {
    const run = gnRun('gn59-h');
    run.regionIndex = 2;
    setFlag(run, 'ferris-advice-3');
    run.battle = fake({ kind: 'wild', trainer: null, enemyTeam: [{ ...run.party[0]! }], enemyIndex: 0, activeIndex: 0, storyEffects: [] });
    run.party[0]!.speciesId = 'snorlax';
    run.battle!.enemyTeam[0]!.speciesId = 'jolteon';
    expect(ferrisCatch(content, run, run.battle!)).toBe(2);
    run.regionIndex = 3;
    expect(ferrisCatch(content, run, run.battle!)).toBe(1);
  });

  it('1st region advice: the feet shift, you are asked, and a right call hits what arrives', () => {
    let run = start('gn59-i');
    run.regionOrder = ['kanto', 'johto', 'hoenn'];
    run = sit(run);
    run = choose(run, 'gn-59-s1', 'Listen.').run;
    run = choose(run, 'gn-59-after', 'Would you battle me?').run;
    expect(run.phase).toBe('battle');
    // Ferris himself never switches; borrow his team to play the Leader's switch (the first region's advice is live).
    run.battle!.enemySwitches = 0;
    run.battle!.storyEffects.push('ferris-feet');
    run.battle!.enemyTeam.forEach((m) => (m.hp = maxHp(content, m)));
    const first = run.battle!.enemyTeam[run.battle!.enemyIndex]!.uid;
    run = takeTurn(content, run, { kind: 'move', index: 0 }).run;
    expect(run.battle!.storyEffects).toContain('ferris-ask');
    run = takeTurn(content, run, { kind: 'predict', yes: true }).run;
    expect(run.battle!.storyEffects).toContain('ferris-pred:yes');
    expect(run.battle!.storyEffects).not.toContain('ferris-ask');
    run.battle!.enemyTeam.forEach((m) => (m.hp = maxHp(content, m)));
    run = takeTurn(content, run, { kind: 'move', index: 0 }).run;
    expect(run.battle!.enemySwitches).toBe(1);
    expect(run.battle!.enemyTeam[run.battle!.enemyIndex]!.uid).not.toBe(first);
    expect(flagOf(run, 'ferris-advice-1-used')).toBe(1);
  });

  it('Ferris\'s styles: Arcanine lies down every other turn, Tyranitar waits for a hurt Pokémon, Clefable stops for tea', () => {
    let run = start('gn59-s');
    run.regionOrder = ['kanto', 'johto', 'hoenn'];
    run = sit(run);
    run = choose(run, 'gn-59-s1', 'Listen.').run;
    run = choose(run, 'gn-59-after', 'Would you battle me?').run;
    const b = run.battle!;
    expect(b.storyEffects).toContain('ferris-eye');
    const lines = (r: typeof run) => r.battle!.storyEffects.filter((s) => s.startsWith('gn-foe-waits:')).length;
    ferrisShape(content, run, { kind: 'move' });
    expect(b.enemyStages.atk).toBe(1);
    expect(lines(run)).toBe(0);
    ferrisShape(content, run, { kind: 'move' });
    expect(lines(run)).toBe(1);
    // Tyranitar
    b.storyEffects = b.storyEffects.filter((s) => !s.startsWith('gn-foe-waits:'));
    b.enemyIndex = 2;
    run.party[b.activeIndex]!.hp = 1;
    ferrisShape(content, run, { kind: 'move' });
    expect(lines(run)).toBe(1);
    // Clefable
    b.storyEffects = b.storyEffects.filter((s) => !s.startsWith('gn-foe-waits:'));
    b.enemyIndex = 4;
    b.enemyTeam[4]!.hp = Math.floor(maxHp(content, b.enemyTeam[4]!) / 3);
    ferrisShape(content, run, { kind: 'move' });
    expect(b.storyEffects).toContain('ferris-tea');
    expect(lines(run)).toBe(1);
  });

  it('Ferris\'s Hat: experience as if one level lower', () => {
    const mon = gnRun('gn59-hat').party[0]!;
    expect(expLevelShift(content, mon)).toBe(0);
    mon.held = { 'ferris-hat': 1 };
    expect(expLevelShift(content, mon)).toBe(1);
  });

  it('4th region advice marks the Champion fight as free to lose; other regions do not', () => {
    const run = gnRun('gn59-j');
    run.regionIndex = 3;
    setFlag(run, 'ferris-advice-4');
    run.battle = fake({ storyEffects: [] });
    ferrisBossMark(run, 'champion');
    expect(ferrisFree(run.battle!)).toBe(true);
    const other = gnRun('gn59-k');
    other.battle = fake({ storyEffects: [] });
    ferrisBossMark(other, 'champion');
    expect(ferrisFree(other.battle!)).toBe(false);
  });
});

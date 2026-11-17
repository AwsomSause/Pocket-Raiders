import { describe, expect, it } from 'vitest';
import { eligibleEvents } from '../../src/core/events';
import { modeBattleLine, modeObjectives, objectivesLine } from '../../src/core/modeObjectives';
import { createRun, chooseStarter, shopStock } from '../../src/core/run';
import { makeRules, STANDARD_CHOICE } from '../../src/core/rules';
import { content } from './helpers';

const spooky = (seed = 'sp') => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: makeRules({ ...STANDARD_CHOICE, modeId: 'spooky' }) }), 0);
const standard = (seed = 'st') => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0);

describe('Spooky Mode content', () => {
  it('its events only appear in Spooky Mode, and the boss and finale wait for clues', () => {
    // Catalog Overhaul (SF24 The Hollow Lantern): Spooky Mode opens with the lantern finding you; the rest of the story is a
    // chain of follow-up scenes (clues on the way), so the Hexed Keeper (boss) and the Mirror wait for the scenes before them.
    const ids = (r: ReturnType<typeof spooky>) => eligibleEvents(content, { ...r, stage: r.stage } as never).map((e) => e.id);
    const run = spooky();
    run.stage!.index = 5;
    expect(ids(run)).toContain('spooky-lantern-finds-you');
    expect(ids(run)).not.toContain('spooky-hexed-keeper');
    run.story.flags['ev:lantern-on'] = 1;
    run.story.flags['ev:lantern-held'] = 1;
    expect(ids(run)).toContain('spooky-hollow-lantern');
    expect(ids(run)).not.toContain('spooky-lantern-finds-you');
    expect(ids(run)).not.toContain('spooky-hollow-mirror');
    run.story.flags['ev:lantern-asked'] = 1;
    expect(ids(run)).toContain('spooky-hollow-mirror');
    run.story.flags['ev:lantern-visited'] = 1;
    expect(ids(run)).toContain('spooky-hexed-keeper');
    const other = standard();
    other.stage!.index = 5;
    expect(ids(other).filter((id) => content.events.get(id)!.mode === 'spooky')).toEqual([]);
  });
  it('the mode shop carries its extra stock only in Spooky Mode', () => {
    const extra = content.balance.modeShops.spooky!.map((e) => e.item);
    const have = (r: ReturnType<typeof spooky>) => shopStock(content, { ...r, badges: Array.from({ length: 8 }, (_, i) => `b${i}`) } as never).map((e) => e.item);
    for (const item of extra) expect(have(spooky()), item).toContain(item);
    expect(have(standard()).filter((i) => extra.includes(i) && !content.shop.some((e) => e.item === i))).toEqual([]);
  });
  it('objectives come from the run counters and only exist in the mode', () => {
    expect(modeObjectives(standard())).toEqual([]);
    const run = spooky();
    expect(modeObjectives(run).every((o) => !o.done)).toBe(true);
    run.log.counters.eventClues = 5;
    run.log.counters.eventBossesWon = 1;
    const list = modeObjectives(run);
    expect(list[1]).toMatchObject({ current: 3, target: 3, done: true });
    expect(list[2]!.done).toBe(true);
    expect(objectivesLine(list)).toContain('✓ Collect three clues');
  });
  it('battle lines exist for the mode only', () => {
    expect(modeBattleLine('spooky', false)).toBeTruthy();
    expect(modeBattleLine('spooky', true)).not.toBe(modeBattleLine('spooky', false));
    expect(modeBattleLine('standard', false)).toBeNull();
  });
  it('the Spooky NPCs are on screen and the Medium sells a clue', () => {
    for (const id of ['spooky-whispering-grave', 'spooky-pale-visitor', 'spooky-hexed-keeper', 'spooky-hollow-mirror', 'spooky-medium']) expect(content.events.get(id)!.scene.cast.length, id).toBeGreaterThan(0);
    const medium = content.events.get('spooky-medium')!;
    // Catalog Overhaul (SF24): the Medium is a scene of the lantern chain (after the festival), in any mode that reaches it.
    expect(medium.requires.some((r) => r.kind === 'flag' && r.key === 'lantern-festival')).toBe(true);
    expect(medium.choices[0]!.success.effects.some((e) => e.kind === 'count' && e.counter === 'eventClues')).toBe(true);
  });
});

describe('Spooky festival calendar', () => {
  it('the Costume Judge is a Spooky-only Autumn event, and the Lantern Festival follows the named lantern', () => {
    const judge = content.events.get('spooky-costume-judge')!;
    expect(judge.mode).toBe('spooky');
    expect(judge.requires.some((r) => r.kind === 'season' && r.in.includes('Autumn'))).toBe(true);
    // Catalog Overhaul (SF24): the festival is a scene of the lantern chain now, not a calendar stop.
    const festival = content.events.get('spooky-lantern-festival')!;
    expect(festival.requires.some((r) => r.kind === 'flag' && r.key === 'lantern-named')).toBe(true);
    for (const e of [judge, festival]) expect(e.scene.cast.length, e.id).toBeGreaterThan(0);
  });
});

describe('starter-tagged events', () => {
  // Catalog Overhaul (SF26 Roots): the five root scenes show for any starter (the scene speaks to your starter), once each.
  it('show for any starter, once each, and need a starter in the party', () => {
    const run = standard('tag');
    run.stage!.index = 4;
    const open = () => eligibleEvents(content, run).map((e) => e.id);
    const roots: Record<string, string> = { 'starter-ember-shrine': 'roots-shrine', 'starter-tide-pool': 'roots-pool', 'starter-old-orchard': 'roots-orchard', 'starter-power-hum': 'roots-pylon', 'starter-first-pal': 'roots-nest' };
    for (const id of Object.keys(roots)) expect(open(), id).toContain(id);
    run.story.flags['ev:roots-shrine'] = 1;
    expect(open()).not.toContain('starter-ember-shrine');
    run.party = run.party.filter((m) => m.uid !== run.log.starterUid);
    expect(open().filter((id) => id.startsWith('starter-'))).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { buildEpilogue } from '../../src/core/ending';
import { chooseStarter, createRun } from '../../src/core/run';
import { DETECTORS, earnedMilestones, memoryLines, mvpScore, runMvp, runTitle, titleFor } from '../../src/core/overhaul/memories';
import { overhaulCatalogs } from '../../src/core/overhaul/catalogs';
import { content } from './helpers';

const base = chooseStarter(content, createRun(content, { runId: 'mem', seed: 'mem', archetypeId: 'red' }), 0);
const won = () => ({ ...structuredClone(base), victory: true });

describe('overhaul memories', () => {
  it('every detector id is a real milestone', () => {
    const ids = new Set(overhaulCatalogs().milestones.entries.map((m) => m.id));
    for (const id of Object.keys(DETECTORS)) expect(ids.has(id), id).toBe(true);
  });
  it('the starter earns First Partner; an empty party has no memories', () => {
    const run = won();
    expect(earnedMilestones(content, run)[run.party[0]!.uid]).toContain('M-FIRST');
    const empty = { ...run, party: [] };
    expect(memoryLines(content, empty)).toEqual([]);
    expect(runMvp(empty)).toBeNull();
  });
  it('MVP is not damage only: bosses and close calls can beat raw knockouts', () => {
    const run = won();
    const h = run.story.histories[run.party[0]!.uid]!;
    const slugger = { ...h, knockoutsDealt: 12 };
    const hero = { ...h, knockoutsDealt: 2, bossesBeaten: 4, closeCalls: 3 };
    expect(mvpScore(hero, run.party[0]!)).toBeGreaterThan(mvpScore(slugger, run.party[0]!));
  });
  it('a title needs its milestone; the higher tier wins', () => {
    expect(titleFor([])).toBeNull();
    expect(titleFor(['M-UNBROKEN'])).toBe('the Unbroken');
  });
  it('run title fills every placeholder and repeats for one seed', () => {
    const run = won();
    const t = runTitle(content, run, 'Pikachu');
    expect(t).toBeTruthy();
    expect(t).not.toMatch(/[{}]/);
    expect(runTitle(content, run, 'Pikachu')).toBe(t);
  });
  it('the won-run epilogue includes the MVP line, a lost run has none', () => {
    const lines = buildEpilogue(content, won());
    expect(lines.some((l) => l.startsWith('Run MVP:'))).toBe(true);
    expect(buildEpilogue(content, base)).toEqual([]);
  });
});

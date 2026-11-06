// Social/tech dev tools: feature flags (S332), bot report (S328), replay diff (S329), balance view (S327),
// asset provenance view (S334), battle fuzz (S341).

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FEATURE_FLAGS, flagList, flagOn, setFlag, type FlagStore } from '../../src/core/tools/featureFlags';
import { botReportLines } from '../../src/core/tools/botReport';
import { diffLines, diffRuns } from '../../src/core/tools/replayDiff';
import { balanceLines, balanceView } from '../../src/core/tools/balanceView';
import { provenanceLines, provenanceSources } from '../../src/core/tools/provenanceView';
import { fuzzBattles } from '../../src/quality/battleFuzz';
import { createRun } from '../../src/core/run';
import { content } from './helpers';

const memory = (): FlagStore & { data: Record<string, string> } => {
  const data: Record<string, string> = {};
  return { data, get: (k) => data[k] ?? null, set: (k, v) => void (data[k] = v) };
};

describe('feature flags (S332)', () => {
  it('uses defaults, saves a change, and ignores unknown flags', () => {
    const s = memory();
    expect(flagOn(s, 'commentary')).toBe(false);
    expect(setFlag(s, 'commentary', true)).toBe(true);
    expect(flagOn(s, 'commentary')).toBe(true);
    expect(setFlag(s, 'nope', true)).toBe(false);
    expect(flagOn(s, 'nope')).toBe(false);
    expect(flagList(s)).toHaveLength(FEATURE_FLAGS.length);
  });
  it('survives damaged storage', () => {
    const s = memory();
    s.set('pkr.flags', '{not json');
    expect(flagOn(s, 'devTools')).toBe(false);
    s.set('pkr.flags', JSON.stringify({ devTools: 'yes', ghost: true }));
    expect(flagOn(s, 'devTools')).toBe(false);
    s.set('pkr.flags', '[1,2]');
    expect(flagOn(s, 'devTools')).toBe(false);
  });
});

describe('bot report (S328)', () => {
  it('summarises log lines and says so for empty or bad input', () => {
    const log = [{ archetypeId: 'a', modeId: 'standard', difficultyId: 'normal', encounters: 10, badges: 1 }, { archetypeId: 'a', modeId: 'standard', difficultyId: 'normal', encounters: 20, badges: 0, error: 'boom' }, 'oops'].map((l) => (typeof l === 'string' ? l : JSON.stringify(l))).join('\n');
    const lines = botReportLines(log);
    expect(lines[0]).toContain('2 runs, 1 with a problem');
    expect(lines.join('\n')).toContain('standard');
    expect(botReportLines('')[0]).toContain('No runs');
    expect(botReportLines('not json')[0]).toContain('not JSON');
  });
});

describe('replay diff (S329)', () => {
  const base = () => createRun(content, { runId: "r1", seed: "diff-1", archetypeId: content.archetypes.keys().next().value as string });
  it('says two copies of a run match', () => {
    const a = base();
    expect(diffRuns(a, structuredClone(a)).same).toBe(true);
    expect(diffLines(diffRuns(a, structuredClone(a)))[0]).toContain('match');
  });
  it('names the changed field and the first journal line that differs', () => {
    const a = base();
    const b = structuredClone(a);
    b.money += 5;
    a.journal = ['x', 'y'];
    b.journal = ['x', 'z'];
    const d = diffRuns(a, b);
    expect(d.same).toBe(false);
    expect(d.fields).toContain('money');
    expect(d.firstJournalDifference).toBe(1);
    expect(diffLines(d).join('\n')).toContain('A: y');
  });
  it('handles a journal that ends early', () => {
    const a = base();
    const b = structuredClone(a);
    a.journal = ['x'];
    b.journal = [];
    const d = diffRuns(a, b);
    expect(d.bLine).toBeNull();
    expect(diffLines(d).join('\n')).toContain('(ends)');
  });
});

describe('balance view (S327)', () => {
  it('ranks species, counts the spread and handles no rows', () => {
    const rows = [0, 0.05, 0.5, 0.95, 1].map((winRate, i) => ({ speciesId: `s${i}`, winRate, battles: 20 }));
    const v = balanceView(rows, 2);
    expect(v.top.map((r) => r.speciesId)).toEqual(['s4', 's3']);
    expect(v.bottom.map((r) => r.speciesId)).toEqual(['s0', 's1']);
    expect(v.histogram.reduce((a, b) => a + b, 0)).toBe(5);
    expect(v.histogram[9]).toBe(2);
    expect(balanceLines(v).join('\n')).toContain('5 species');
    expect(balanceLines(balanceView([]))).toEqual(['No species to show.']);
  });
});

describe('provenance view (S334)', () => {
  it('counts files per source, expanding brace groups and "same"', () => {
    const md = ['| Repo path | Source | Orig | Credits | Used by | Added |', '|---|---|---|---|---|---|', '| `a/{x,y,z}.png` | Pack A | o | Alice | UI | d |', '| `b.png` | same | o | same | Hatch | d |', '| `c.png` | Pack B | o | Bob | Map | d |'].join('\n');
    const rows = provenanceSources(md);
    expect(rows[0]).toMatchObject({ source: 'Pack A', files: 4, credits: 'Alice' });
    expect(rows[1]).toMatchObject({ source: 'Pack B', files: 1 });
    expect(provenanceLines(rows)[0]).toBe('5 files from 2 sources.');
    expect(provenanceLines([])).toEqual(['No provenance rows found.']);
  });
  it('reads the real table', () => {
    const rows = provenanceSources(readFileSync('docs/quality/asset-provenance.md', 'utf8'));
    expect(rows.length).toBeGreaterThan(1);
    expect(rows.every((r) => r.files > 0 && r.source)).toBe(true);
  });
});

describe('battle fuzz (S341)', () => {
  it('runs seeded cases with no crash, and is repeatable', () => {
    const a = fuzzBattles(content, 'fuzz-test', 12);
    expect(a.failures).toEqual([]);
    expect(a.wins + a.losses + a.draws).toBe(12);
    expect(fuzzBattles(content, 'fuzz-test', 12)).toEqual(a);
  });
  it('reports a thrown error as a failure instead of crashing', () => {
    const broken = { ...content, species: new Map() } as never;
    const r = fuzzBattles(broken, 'x', 1);
    expect(r.failures).toHaveLength(1);
  });
});

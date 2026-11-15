// Beta 0.6 E5: the Extended Cut director, the one climax-cut reader, and Second Shot.
import { describe, expect, it } from 'vitest';
import { beginClimax, climaxBoard, climaxCutOf, climaxLost, climaxPhases, finishStep, nextStep } from '../../src/core/arc/climaxExtended';
import { assistModeOf } from '../../src/core/rivals/live';
import { friendAssist } from '../../src/core/rivals/friend';
import { xflagHolds } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import { RunStateSchema } from '../../src/core/state';
import { content } from './helpers';

const mk = (cut?: 'standard' | 'extended', seed = 'cx1') => {
  const r = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', ...(cut ? { expansion: { climaxCut: cut } } : {}) }), 0);
  return r;
};

describe('climax cut reader', () => {
  it('extended runs read extended everywhere, with the Assist cap of 6', () => {
    const r = mk('extended');
    expect(climaxCutOf(r)).toBe('extended');
    expect(assistModeOf(r)).toBe('extended');
    expect(xflagHolds(r, 'extendedCut')).toBe(true);
    expect(friendAssist(5, assistModeOf(r))).toBe(1);
  });
  it('classic runs are unchanged: no cut key, standard cap', () => {
    const a = mk(), b = mk('standard');
    for (const r of [a, b]) {
      expect(climaxCutOf(r)).toBe('standard');
      expect(assistModeOf(r)).toBe('standard');
      expect(r.expansion?.cut?.climaxCut).toBeUndefined();
      expect(beginClimax(r)).toBe(false);
    }
    expect(JSON.stringify(a.expansion ?? {})).toBe(JSON.stringify(b.expansion ?? {}));
  });
  it('an older save with only expansion.climaxCut still reads extended', () => {
    const r = mk();
    r.expansion = { ...r.expansion, climaxCut: 'extended' };
    expect(climaxCutOf(r)).toBe('extended');
  });
});

describe('Extended Cut phases and Second Shot', () => {
  it('runs the Kanto phases in order, skipping formats not built yet, and ends', () => {
    const r = mk('extended');
    expect(beginClimax(r)).toBe(true);
    const seen: string[] = [];
    for (let s = nextStep(r), n = 0; s && n < 30; s = finishStep(r), n++) seen.push(s.phase);
    const all = climaxPhases('kanto').map((p) => p.phase);
    expect(seen).toEqual(all);
    expect(seen.indexOf('0b')).toBeLessThan(seen.indexOf('1'));
    expect(nextStep(r)).toBeNull();
  });
  it('two shots then the run goes on: first loss retries from the save point, second ends the climax', () => {
    const r = mk('extended');
    beginClimax(r);
    for (let s = nextStep(r); s && s.name !== 'Giovanni'; s = finishStep(r));
    expect(climaxLost(r)).toBe('retry');
    expect(nextStep(r)?.phase).toBe('4');
    expect(climaxLost(r)).toBe('worst');
    expect(nextStep(r)).toBeNull();
    expect(r.phase).not.toBe('ended');
  });
  it('the director state survives a save round-trip', () => {
    const r = mk('extended');
    beginClimax(r);
    finishStep(r);
    const back = RunStateSchema.parse(JSON.parse(JSON.stringify(r)));
    expect(nextStep(back)?.phase).toBe(nextStep(r)?.phase);
    expect(climaxCutOf(back)).toBe('extended');
  });
});

describe('climaxTick (screens)', () => {
  it('standard runs and runs before the climax are untouched', async () => {
    const { climaxTick } = await import('../../src/core/arc/climaxExtended');
    const a = mk(), b = mk('extended');
    const before = JSON.stringify(a.expansion ?? {});
    expect(climaxTick(content, a)).toBe(false);
    expect(climaxTick(content, b)).toBe(false);
    expect(JSON.stringify(a.expansion ?? {})).toBe(before);
  });
  it('plays the wide formats in order, one at a time, and finishes', async () => {
    const { climaxTick, climaxBattleEnded } = await import('../../src/core/arc/climaxExtended');
    const { currentFormat, clearFormat } = await import('../../src/core/formats/store');
    const r = mk('extended');
    r.story.evil = { ...(r.story.evil as object), teamId: content.evilTeams.teams[0]!.id } as typeof r.story.evil;
    beginClimax(r);
    const ids: string[] = [];
    for (let i = 0; i < 80; i++) {
      if (!climaxTick(content, r)) break;
      const f = currentFormat(r);
      if (!f) { r.battle = null; r.phase = 'map'; climaxBattleEnded(r, true); continue; } // a battle phase launched: count it as won
      expect(f).not.toBeNull();
      ids.push(f!.id);
      expect(climaxTick(content, r)).toBe(true); // asking again while it runs changes nothing
      expect(currentFormat(r)!.id).toBe(f!.id);
      clearFormat(r);
    }
    expect(ids[0]).toBe('siege');
    expect(ids.indexOf('blackout')).toBeGreaterThan(0);
    expect(ids).toContain('breather');
    expect(nextStep(r)).toBeNull();
  });
});

describe('climax battles and Second Shot', () => {
  it('launches the battle phases, counts wins, and a loss is Second Shot (two tries, run goes on)', async () => {
    const { climaxTick, climaxBattleEnded } = await import('../../src/core/arc/climaxExtended');
    const { clearFormat, currentFormat } = await import('../../src/core/formats/store');
    const r = mk('extended');
    r.story.evil = { ...(r.story.evil as object), teamId: content.evilTeams.teams[0]!.id } as typeof r.story.evil;
    beginClimax(r);
    const climbTo = (): void => { for (let i = 0; i < 20 && r.phase !== 'battle'; i++) { if (!climaxTick(content, r)) break; if (currentFormat(r)) clearFormat(r); } };
    climbTo();
    expect(r.phase).toBe('battle');
    expect(r.battle?.event?.eventId).toBe('format:climax');
    const need = (r.expansion!.cut!.director as { need: number }).need;
    expect(need).toBeGreaterThanOrEqual(1);
    // a win counts; the next tick launches the next one (or moves on)
    r.battle = null; r.phase = 'map';
    climaxBattleEnded(r, true);
    expect((r.expansion!.cut!.director as { fought: number }).fought).toBe(1);
    // first loss retries, second ends the climax and never ends the run
    expect(climaxLost(r)).toBe('retry');
    expect(climaxLost(r)).toBe('worst');
    expect(nextStep(r)).toBeNull();
    expect(r.phase).not.toBe('over');
  });
});

describe('real run flow', () => {
  it('an Extended Cut run reaches the climax at story beat 6; classic runs do not', async () => {
    const { applyEvilEffect } = await import('../../src/core/evil/teams');
    const { climaxTick } = await import('../../src/core/arc/climaxExtended');
    for (const cut of ['extended', 'standard'] as const) {
      const r = mk(cut);
      r.regionOrder = ['kanto', ...r.regionOrder.slice(1)]; r.regionIndex = 0;
      r.story.evil = { ...(r.story.evil as object), teamId: content.evilTeams.teams[0]!.id, beat: 5 } as typeof r.story.evil;
      applyEvilEffect(content, r, { beat: true, heat: 0 } as never);
      expect(r.story.evil!.beat).toBe(6);
      expect(!!r.expansion?.cut?.director).toBe(cut === 'extended');
      if (cut === 'extended') expect(climaxTick(content, r)).toBe(true);
    }
  });
  it('the worst result raises the region world-state track once and the run continues', () => {
    const r = mk('extended');
    r.regionOrder = ['kanto', ...r.regionOrder.slice(1)]; r.regionIndex = 0;
    r.expansion = { ...r.expansion, tracks: true };
    beginClimax(r);
    climaxLost(r);
    expect(climaxLost(r)).toBe('worst');
    expect(r.expansion!.track!.kanto!.step).toBe(1);
    expect(r.expansion!.cut!.result).toBe('worst');
    expect(r.phase).not.toBe('over');
  });
});

describe('the phase list the player reads (climaxBoard)', () => {
  it('is null for a Standard run and before the climax begins', () => {
    expect(climaxBoard(mk())).toBeNull();
    expect(climaxBoard(mk('standard'))).toBeNull();
    expect(climaxBoard(mk('extended'))).toBeNull();
  });
  it('lists every phase in order: the first is Now, the one after Next, the rest Ahead', () => {
    const r = mk('extended');
    expect(beginClimax(r, 'kanto')).toBe(true);
    const b = climaxBoard(r)!;
    expect(b.region).toBe('kanto');
    expect(b.rows.map((x) => x.name)).toEqual(climaxPhases('kanto').map((s) => s.name));
    expect(b.rows.map((x) => x.state)).toEqual(['now', 'next', ...b.rows.slice(2).map(() => 'ahead')]);
    expect(b.rows.every((x) => x.pct === 0)).toBe(true);
    expect(b.shots).toBe(0);
    expect(b.tries).toBe(2);
  });
  it('says what each phase is: a story beat, a format with its fights, the rest', () => {
    const r = mk('extended');
    beginClimax(r, 'kanto');
    const rows = climaxBoard(r)!.rows;
    const sub = (name: string) => rows.find((x) => x.name === name)!.sub;
    expect(sub('Broadcast and Choice')).toBe('Story');
    expect(sub('The Sealed City')).toBe('Siege Map');
    expect(sub('The Streets')).toBe('Blackout · 2–3 fights');
    expect(sub('The Climb')).toBe('Gauntlet · 4–6 fights');
    expect(sub('Breather')).toBe('Heal, revive one, save');
    expect(sub('Giovanni')).toBe('Boss · 1 fight');
  });
  it('finished phases are Done and full; a running battle phase counts its fights', () => {
    const r = mk('extended');
    beginClimax(r, 'kanto');
    finishStep(r);
    finishStep(r);
    finishStep(r);
    const cut = r.expansion!.cut as Record<string, any>;
    cut.director = { ...cut.director, need: 4, fought: 1 };
    const rows = climaxBoard(r)!.rows;
    expect(rows.slice(0, 3).map((x) => [x.state, x.pct])).toEqual([['done', 100], ['done', 100], ['done', 100]]);
    expect(rows[3]).toEqual({ name: 'The Climb', sub: 'Gauntlet · 1 of 4 fights won', state: 'now', pct: 25 });
    expect(rows[4]!.state).toBe('next');
  });
  it('reading it changes nothing, and it is gone once the climax is over', () => {
    const r = mk('extended');
    beginClimax(r, 'kanto');
    const before = JSON.stringify(r);
    climaxBoard(r);
    expect(JSON.stringify(r)).toBe(before);
    expect(climaxLost(r)).toBe('retry');
    expect(climaxBoard(r)!.shots).toBe(1);
    expect(climaxLost(r)).toBe('worst');
    expect(climaxBoard(r)).toBeNull();
  });
  it('a damaged director reads as the start, never as a crash', () => {
    const r = mk('extended');
    beginClimax(r, 'kanto');
    (r.expansion!.cut as Record<string, unknown>).director = { idx: 'x', shots: -3, need: 0, fought: 9 };
    const b = climaxBoard(r)!;
    expect(b.rows[0]!.state).toBe('now');
    expect(b.shots).toBe(0);
    expect(b.rows[0]!.pct).toBe(0);
  });
});

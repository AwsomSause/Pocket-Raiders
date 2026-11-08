import { describe, expect, it } from 'vitest';
import { GALAR_STADIUM, bandIntro, crowdReaction, hostLine, hostPhase, pickCameraCut, CROWD_BEATS, type CutContext } from '../../src/core/galarStadium';
import { getContent } from '../../src/data';

const ctx = (over: Partial<CutContext> = {}): CutContext => ({ runSeed: 'S', battleId: 'b1', turn: 5, beat: 'bigHit', shown: 0, lastCutTurn: null, impressive: false, rivalWatching: false, ...over });

describe('Galar stadium presentation', () => {
  it('warms the Champion up across the challenge', () => {
    expect([1, 2, 4, 6, 8].map(hostPhase)).toEqual(['welcome', 'early', 'mid', 'late', 'peer']);
    const first = hostLine('S', 1, { recentLosses: 0, lastWasImpressive: false }, 'Leon');
    expect(first.id.startsWith('welcome')).toBe(true);
    expect(hostLine('S', 6, { recentLosses: 2, lastWasImpressive: false }, 'Leon').id).toBe('late-struggle');
    expect(hostLine('S', 6, { recentLosses: 0, lastWasImpressive: true }, 'Leon').id).toBe('late-impressive');
    expect(hostLine('S', 3, { recentLosses: 0, lastWasImpressive: false }, 'Leon')).toEqual(hostLine('S', 3, { recentLosses: 0, lastWasImpressive: false }, 'Leon'));
  });

  it('every phase has a plain line', () => {
    for (const phase of ['welcome', 'early', 'mid', 'late', 'peer'] as const) expect(GALAR_STADIUM.hostLines.some((l) => l.phase === phase && l.variant === 'any')).toBe(true);
  });

  it('plays the Dynamax Band intro once, giving a Band only when the player has none', () => {
    const give = bandIntro(false, {}, 'Leon')!;
    expect(give.grantsItem).toBe('dynamax-band');
    expect(give.lines.join(' ')).toContain('Leon');
    expect(bandIntro(true, {}, 'Leon')!.grantsItem).toBeNull();
    expect(bandIntro(false, { [give.flag]: 1 }, 'Leon')).toBeNull();
  });

  it('has a crowd reaction for every beat; the last Pokémon changes the music', () => {
    for (const beat of CROWD_BEATS) expect(crowdReaction(beat).cue).toMatch(/^crowd\./);
    expect(crowdReaction('lastMon').music).toBe(crowdReaction('calm').music); // one song for the whole Galar battle (Kice's pick)
    expect(crowdReaction('dynamax').intensity).toBeGreaterThan(crowdReaction('knockOut').intensity);
  });

  it('camera cuts are rare, brief, spaced out and capped per battle', () => {
    let shown = 0;
    let last: number | null = null;
    for (let turn = 1; turn <= 40; turn++) {
      const cut = pickCameraCut(ctx({ turn, shown, lastCutTurn: last }));
      if (cut) {
        expect(cut.durationMs).toBeLessThanOrEqual(4000);
        expect(cut.skippable).toBe(true);
        shown++;
        last = turn;
      }
    }
    expect(shown).toBeLessThanOrEqual(GALAR_STADIUM.cameraBalance.maxPerBattle);
    expect(pickCameraCut(ctx({ shown: GALAR_STADIUM.cameraBalance.maxPerBattle }))).toBeNull();
    expect(pickCameraCut(ctx({ lastCutTurn: 5, turn: 5 }))).toBeNull();
  });

  it('is deterministic, and silhouettes only appear in context', () => {
    expect(pickCameraCut(ctx({ turn: 9 }))).toEqual(pickCameraCut(ctx({ turn: 9 })));
    const seen = new Set<string>();
    for (let t = 1; t < 400; t++) {
      for (const beat of ['bigHit', 'comeback', 'lastMon'] as const) {
        const c = pickCameraCut(ctx({ turn: t, beat, battleId: `b${t}` }));
        if (c) seen.add(c.id);
      }
    }
    expect(seen.has('champion-silhouette')).toBe(false);
    expect(seen.has('rival-silhouette')).toBe(false);
    const withCtx = new Set<string>();
    for (let t = 1; t < 400; t++) {
      const c = pickCameraCut(ctx({ turn: t, beat: 'comeback', battleId: `b${t}`, impressive: true, rivalWatching: true }));
      if (c) withCtx.add(c.id);
    }
    expect(withCtx.has('champion-silhouette')).toBe(true);
    expect(withCtx.has('rival-silhouette')).toBe(true);
  });

  it('references a real band item and champion', () => {
    const content = getContent();
    expect(content.items.has(GALAR_STADIUM.bandIntro.grantsItem)).toBe(true);
    expect(content.bosses.has(GALAR_STADIUM.hostDefault)).toBe(true);
  });
});

import { claimBandIntro, galarGymNumber, galarHost, galarPerformance, isGalarStadiumBattle } from '../../src/core/galarStadium';
import { createRun } from '../../src/core/run';

describe('Galar stadium wiring helpers', () => {
  const content = getContent();
  const galarRun = () => {
    const run = createRun(content, { runId: 'r', seed: 'GALARSEED', archetypeId: 'red' });
    run.regionOrder = ['galar', ...run.regionOrder.filter((r) => r !== 'galar')];
    run.regionIndex = 0;
    return run;
  };
  it('gives the Dynamax Band once, only when missing', () => {
    const run = galarRun();
    delete run.inventory['dynamax-band'];
    const first = claimBandIntro(content, run)!;
    expect(first.grantsItem).toBe('dynamax-band');
    expect(run.inventory['dynamax-band']).toBe(1);
    expect(claimBandIntro(content, run)).toBeNull();
    expect(run.inventory['dynamax-band']).toBe(1);
  });
  it('acknowledges a Band the player already has without a second one', () => {
    const run = galarRun();
    run.inventory['dynamax-band'] = 1;
    expect(claimBandIntro(content, run)!.grantsItem).toBeNull();
    expect(run.inventory['dynamax-band']).toBe(1);
  });
  it('knows the host, gym number and that no battle is a stadium battle outside one', () => {
    const run = galarRun();
    expect(galarGymNumber(run)).toBe(1);
    expect(galarHost(content, run).name.length).toBeGreaterThan(0);
    expect(isGalarStadiumBattle(content, run)).toBe(false);
    expect(galarPerformance(content, run)).toEqual({ recentLosses: 0, lastWasImpressive: false });
  });
});

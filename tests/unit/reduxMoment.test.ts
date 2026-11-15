import { describe, expect, it } from 'vitest';
import { MOMENT_PHASES, defaultMoment, planMoment } from '../../src/core/cinematic/moments';
import { cutTimes } from '../../src/ui/redux/moment';
import { cutView, type CutModel } from '../../src/ui/redux/screens/cut';
import type { ReduxCtx } from '../../src/ui/redux/stage';

// New UI: an important moment played as the mock-ups' cutscene card. `cutTimes` decides how long each of the five
// beats shows; the card itself is `cutView` (tested with the run-end screens in reduxOver.test.ts).

const ctx = (layout: number): ReduxCtx => ({ k: layout, skin: {} as ReduxCtx['skin'], v: (n) => layout % n });
const plan = (off = false) => planMoment(defaultMoment('championIntro', 'x', 'enemy'), { reduceMotion: false, disableAnimations: off, seen: new Set() });
const sum = (t: Record<string, number>): number => MOMENT_PHASES.reduce((n, p) => n + t[p]!, 0);
const card = (over: Partial<CutModel> = {}): CutModel => ({ name: 'Cynthia', role: 'Champion', line: 'I have waited.', cast: null, backdrop: null, beat: 2, ...over });

describe('cutTimes', () => {
  it('keeps the planned beats when there is nothing to read', () => {
    const p = plan();
    expect(cutTimes(p, 0)).toEqual(p.ms);
  });
  it('a short line that fits the plan changes nothing', () => {
    const p = plan();
    expect(cutTimes(p, 10)).toEqual(p.ms);
  });
  it('a long line stretches only the middle beat, up to a cap', () => {
    const p = { ...plan(), ms: { situation: 100, anticipation: 100, moment: 100, reaction: 100, transition: 100 } };
    const t = cutTimes(p, 60);
    expect(t.situation).toBe(100);
    expect(t.transition).toBe(100);
    expect(sum(t)).toBe(1400 + 26 * 60);
    expect(sum(cutTimes(p, 5000))).toBe(5200);
  });
  it('with animations off the card shows once, on the Moment beat', () => {
    const t = cutTimes(plan(true), 0);
    expect(t).toEqual({ situation: 0, anticipation: 0, moment: 900, reaction: 0, transition: 0 });
    expect(cutTimes(plan(true), 40).moment).toBe(1400 + 26 * 40);
  });
});

describe('cutscene card as a moment', () => {
  it('a moment that cannot be skipped shows no key hint; the default hint is Esc', () => {
    for (const layout of [0, 1, 2]) {
      expect(cutView(ctx(layout), card({ skip: null }))).not.toContain('<kbd>');
      expect(cutView(ctx(layout), card())).toContain('<kbd>Esc</kbd>skip');
      expect(cutView(ctx(layout), card({ skip: ['Space', 'hold to skip'] }))).toContain('<kbd>Space</kbd>hold to skip');
    }
  });
  it('a card with nothing said draws no empty quote marks', () => {
    for (const layout of [0, 1, 2]) {
      const html = cutView(ctx(layout), card({ line: '' }));
      expect(html).not.toContain('“”');
      expect(html).toContain('Cynthia');
    }
  });
});

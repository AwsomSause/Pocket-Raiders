import { describe, expect, it } from 'vitest';
import { bossIntroMoment, canSkip, defaultMoment, planMoment, rivalMoment, runsSinceMet, MomentSpecSchema } from '../../src/core/cinematic/moments';

const none = new Set<string>();
const full = { reduceMotion: false, disableAnimations: false, seen: none };

describe('planMoment', () => {
  it('plays full length the first time and shortens a repeatable moment after it was seen', () => {
    const m = defaultMoment('mega', 'mega.venusaur');
    const first = planMoment(m, full);
    const again = planMoment(m, { ...full, seen: new Set(['mega.venusaur']) });
    expect(first.totalMs).toBe(2200);
    expect(again.totalMs).toBeLessThan(first.totalMs / 2 + 5);
  });
  it('halves beats for reduced motion and is deterministic', () => {
    const m = defaultMoment('tera', 't');
    expect(planMoment(m, { ...full, reduceMotion: true }).totalMs).toBe(1100);
    expect(planMoment(m, full)).toEqual(planMoment(m, full));
  });
  it('skips drawing when animations are off, except mandatory moments which show a card only', () => {
    const m = defaultMoment('dynamax', 'd');
    expect(planMoment(m, { ...full, disableAnimations: true }).play).toBe(false);
    const must = MomentSpecSchema.parse({ id: 'story', kind: 'championIntro', mandatory: true });
    const p = planMoment(must, { ...full, disableAnimations: true });
    expect(p).toMatchObject({ play: true, cardOnly: true, skippable: false, totalMs: 0 });
    expect(canSkip(must)).toBe(false);
    expect(canSkip(m)).toBe(true);
  });
  it('mandatory moments never shorten when repeated', () => {
    const must = MomentSpecSchema.parse({ id: 's', kind: 'mega', mandatory: true, repeatable: true });
    expect(planMoment(must, { ...full, seen: new Set(['s']) }).totalMs).toBe(2200);
  });
  it('enemy side uses the same scenes', () => {
    expect(defaultMoment('gigantamax', 'g', 'enemy').side).toBe('enemy');
    expect(defaultMoment('gigantamax', 'g').tier).toBe('S');
  });
});

describe('history scenes', () => {
  it('picks rival scenes from encounter history', () => {
    expect(rivalMoment({ fights: 0, playerStreak: 0 })).toBe('rivalFirst');
    expect(rivalMoment({ fights: 2, lastResult: 'playerLost', playerStreak: 0 })).toBe('rivalRevenge');
    expect(rivalMoment({ fights: 2, lastResult: 'playerWon', playerStreak: 2 })).toBe('rivalRematch');
    expect(rivalMoment({ fights: 0, playerStreak: 0, runsSince: 2 })).toBe('rivalReunion');
    expect(rivalMoment({ fights: 0, playerStreak: 0 })).toBe('rivalFirst');
    expect(rivalMoment({ fights: 2, lastResult: 'playerWon', playerStreak: 2, runsSince: 3 })).toBe('rivalRematch');
  });
  it('counts runs since a character was last met, newest record first', () => {
    const recs = [{ rivals: [{ name: 'Hugh', encounters: 0 }] }, { rivals: [{ name: 'Hugh', encounters: 2 }, { name: 'May', encounters: 1 }] }];
    expect(runsSinceMet(recs, 'Hugh')).toBe(2);
    expect(runsSinceMet(recs, 'May')).toBe(2);
    expect(runsSinceMet(recs, 'N')).toBeUndefined();
    expect(runsSinceMet([], 'Hugh')).toBeUndefined();  });
  it('picks boss intros, ace entrance first', () => {
    expect(bossIntroMoment({ role: 'gym' })).toBe('gymIntro');
    expect(bossIntroMoment({ role: 'champion', isAce: true })).toBe('aceEntrance');
    expect(bossIntroMoment({ role: 'raid' })).toBe('raidIntro');
  });
});

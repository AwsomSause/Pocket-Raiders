import { describe, expect, it } from 'vitest';
import { SPLASH_ID, splashDue } from '../../src/ui/updateSplashGate';

const env = (o: Partial<{ seen: string | null; webdriver: boolean; search: string }> = {}) => ({ seen: null, webdriver: false, search: '', ...o });

describe('update splash gate', () => {
  it('shows on a first load and not again once seen', () => {
    expect(splashDue(env())).toBe(true);
    expect(splashDue(env({ seen: SPLASH_ID }))).toBe(false);
  });
  it('shows again for a newer splash id', () => {
    expect(splashDue(env({ seen: 'beta-0.4' }))).toBe(true);
  });
  it('is hidden in automated browsers unless forced, and ?splash=0 always hides it', () => {
    expect(splashDue(env({ webdriver: true }))).toBe(false);
    expect(splashDue(env({ webdriver: true, search: '?splash=1' }))).toBe(true);
    expect(splashDue(env({ seen: SPLASH_ID, search: '?splash=1' }))).toBe(true);
    expect(splashDue(env({ search: '?splash=0' }))).toBe(false);
  });
});

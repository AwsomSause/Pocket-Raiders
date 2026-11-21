import { describe, expect, it } from 'vitest';
import { earlyAccessDue, EARLY_ACCESS_LOCK_MS } from '../../src/ui/earlyAccessNotice';

const env = (o: Partial<{ seen: string | null; webdriver: boolean; search: string }> = {}) => ({ seen: null, webdriver: false, search: '', ...o });

describe('early access notice gate', () => {
  it('shows once, then never again', () => {
    expect(earlyAccessDue(env())).toBe(true);
    expect(earlyAccessDue(env({ seen: '1' }))).toBe(false);
  });
  it('query flags and automated browsers', () => {
    expect(earlyAccessDue(env({ webdriver: true }))).toBe(false);
    expect(earlyAccessDue(env({ webdriver: true, search: '?earlyaccess=1' }))).toBe(true);
    expect(earlyAccessDue(env({ search: '?earlyaccess=0' }))).toBe(false);
  });
  it('locks for ten seconds', () => expect(EARLY_ACCESS_LOCK_MS).toBe(10000));
});

import { expect, type Page } from '@playwright/test';

/**
 * Presses a key and waits for the state it should cause; presses it again if nothing happened.
 * The game drops a confirm that lands while a screen is still opening (input guard), and a slow CI runner
 * makes that window long. A fixed sleep before one press therefore flakes; checking the result and
 * re-pressing does not. Only re-press where one more press is harmless (nothing has changed yet).
 */
export async function pressUntil(page: Page, key: string, done: () => Promise<boolean>, opts: { timeout?: number; every?: number } = {}) {
  const { timeout = 30_000, every = 1500 } = opts;
  const end = Date.now() + timeout;
  for (;;) {
    await page.keyboard.press(key);
    const next = Math.min(end, Date.now() + every);
    while (Date.now() < next) {
      if (await done()) return;
      await page.waitForTimeout(100);
    }
    if (Date.now() >= end) break;
  }
  expect(await done(), `${key} did not cause the expected change`).toBe(true);
}

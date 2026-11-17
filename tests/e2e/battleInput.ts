import type { Page } from '@playwright/test';

// Battle text other than move and damage lines waits for a confirm press, so tests press Enter until the wanted state shows.

const hasMenu = (page: Page) => page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle').menu));

/** Presses Enter (one message per press) until the battle command menu is up. A Gym Leader's opening is ~43 presses (~19 s on a throttled CPU), so slow CI runners get 45 s; it returns as soon as the menu exists. */
export async function confirmToMenu(page: Page, timeout = 45_000): Promise<void> {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await hasMenu(page)) return;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(160);
  }
  throw new Error('battle menu never appeared');
}

/** Waits until `cond` holds, pressing Enter on pending battle text (never while the command menu is up). */
export async function confirmUntil(page: Page, cond: () => Promise<boolean>, timeout = 15_000): Promise<void> {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await cond()) return;
    const textUp = await page.evaluate(() => {
      const b = (window as any).__pkr.game.scene.getScene('Battle');
      return Boolean(b?.scene?.isActive() && !b.menu && (b.advance || b.data?.get('evolutionScene')));
    });
    if (textUp) await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
  }
  throw new Error('confirmUntil timed out');
}

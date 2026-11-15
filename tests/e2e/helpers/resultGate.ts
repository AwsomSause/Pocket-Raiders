import type { Page } from '@playwright/test';

/**
 * Reward and Decision results now wait for an input (Kice's rule: text stays until the player presses).
 * If one is up and ready to close, press Enter once to move on. Does nothing otherwise.
 */
export async function passResult(page: Page): Promise<void> {
  const waiting = await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const key = pkr?.activeScene?.();
    const s = key === 'Reward' || key === 'Decision' ? pkr.game.scene.getScene(key) : null;
    return Boolean(s?.dismiss) && Boolean(s.chosen || s.done);
  });
  if (waiting) await page.keyboard.press('Enter');
}

/** The active scene's key, pressing through a Reward/Decision result that is waiting for an input. */
export async function sceneAfterResult(page: Page): Promise<string | null> {
  await passResult(page);
  return page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
}

import { expect, test, type Page } from '@playwright/test';

// Beat 9 Field Trial (design O.4): after the prologue, the first Story Run opens with the scripted spar. The five teaching beats appear
// in order, the arrow option is the only one that goes on, and the run continues to the backstory intro and the map.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
const trialText = (page: Page) => page.evaluate(() => (window as any).__pkr.game.scene.getScene('FieldTrial').children.list.filter((o: any) => o.name?.startsWith('trial-')).map((o: any) => `${o.name}=${o.text ?? ''}`).join('\n'));

test('Field Trial: five teaching beats in order, then the Story Run goes on', async ({ page }) => {
  test.setTimeout(150_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=field-trial&campaign=orrery-circuit&debug=1');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
  // A save that has played the full prologue.
  await page.evaluate(() => { const p = (window as any).__pkr.session.profile.story.prologue; p.done = true; p.mode = 'full'; });
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'FieldTrial']) {
    await page.keyboard.press('Enter');
    await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(next);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(400);
  expect(await trialText(page)).toContain('trial-title=Field Trial');
  await page.screenshot({ path: 'test-results/field-trial-start.png' });
  const seen: string[] = [];
  let shotMenu = false;
  for (let i = 0; i < 60 && (await scene(page)) === 'FieldTrial'; i++) {
    const text = await trialText(page);
    if (text.includes('trial-chart=') && !seen.includes('moves')) seen.push('moves');
    if (text.includes('Send out the other') && !seen.includes('switch')) seen.push('switch');
    if (text.includes('That is a Potion') && !seen.includes('items')) seen.push('items');
    if (text.includes('That glow?') && !seen.includes('heartbond')) seen.push('heartbond');
    if (text.includes('should not have worked') && !seen.includes('feat')) seen.push('feat');
    if (text.includes('trial-menu-') && !shotMenu) {
      shotMenu = true;
      await page.screenshot({ path: 'test-results/field-trial-menu.png' });
      // A wrong option doesn't go on.
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(150);
      expect(await trialText(page)).toContain('Follow the arrow');
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(100);
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(220);
  }
  expect(seen).toEqual(['moves', 'switch', 'items', 'heartbond', 'feat']);
  await expect.poll(() => scene(page), { timeout: 20_000 }).toMatch(/Story|Map/);
  const info = await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    const v2 = s.run.story.v2;
    return { done: v2.facts['trial.done'], met: v2.rel[v2.blueprint.rivals.primary]?.met, seen: s.profile.story.prologue.beatsSeen.includes('field_trial') };
  });
  expect(info).toEqual({ done: true, met: true, seen: true });
  expect(errors).toEqual([]);
});

import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// Evil Mode slice 11 ("the economy"), in the New look. Keys only: the Trade page (T), a racket's Honest Card with the
// button under field 13, started with Enter, then on the Running tab and paying at the Evening. Taps only: a Front opened
// in a held holding, its back room shut, and a Work's Card refused for want of Funds, at three sizes.

const stage = (page: Page) => view(page, 'Evil');
const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.evilMode);

async function founded(page: Page, funds = 6000) {
  await start(page, 'ui=new');
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'evil-mode' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Evil');
  await page.evaluate((funds) => {
    const p = (window as any).__pkr;
    p.session.evilFound({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm' }, 2);
    const b = p.session.run.expansion.evilMode;
    // Nobody's line gets in the way; one pair of Hands for the Garage; the team holds the first local by share.
    for (const c of b.crew) c.line = null;
    b.crew[1].talent = 'hands';
    b.team.funds = funds;
    b.hero = null;
    Object.assign(b.district.holdings.find((h: any) => h.kind === 'local'), { owner: 'team', method: 'persuade', since: 1, holds: true, scouted: 2 });
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  }, funds);
  await waitForScene(page, 'Evil');
  await expect(stage(page).getByTestId('evil-map')).toBeVisible();
  await page.waitForTimeout(300);
}

async function shots(page: Page, info: { outputPath: (n: string) => string }, name: string) {
  for (const [w, h] of [[1280, 720], [960, 540], [740, 360]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    await page.screenshot({ path: info.outputPath(`${name}-${w}x${h}.png`) });
  }
  await page.setViewportSize({ width: 1280, height: 720 });
}

test('keys only: a racket from its Card, on the Running tab, paying at the Evening', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page);
  const s = stage(page);
  // Morning -> Dispatch.
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  expect((await block(page)).here.beat).toBe('dispatch');
  await page.keyboard.press('KeyT');
  await expect(s.getByTestId('evil-trade-title')).toContainText('Trade');
  await expect(s.getByTestId('evil-trade-row').first()).toHaveAttribute('data-key', 'protection');
  await expect(s.getByTestId('evil-trade-card').locator('.row')).toHaveCount(13);
  const street = (await s.getByTestId('evil-trade-pick').textContent())!;
  expect(street.length).toBeGreaterThan(0);
  await shots(page, info, 'trade-racket-card');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  const b = await block(page);
  expect(b.economy.running[0]).toMatchObject({ cardId: 'protection', kind: 'racket' });
  await expect(s.getByTestId('evil-trade-tab-3')).toContainText('Running 1');
  await expect(s.getByTestId('evil-trade-row').first()).toContainText('Protection');
  await expect(s.getByTestId('evil-trade-said')).toContainText(`running on ${street}`);
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('evil-trade')).toHaveCount(0);
  // Send them (Up wraps to "Send them"), stay in: the Evening pays the racket.
  const funds = b.team.funds;
  for (const k of ['ArrowUp', 'Enter', 'Enter']) {
    await page.keyboard.press(k);
    await page.waitForTimeout(150);
  }
  const e = await block(page);
  expect(e.here.beat).toBe('evening');
  expect(e.evening.some((l: string) => l.startsWith('Rackets'))).toBe(true);
  expect(e.team.funds).toBeGreaterThan(funds);
  expect(errors).toEqual([]);
});

test('taps only: a Front opened, its back room shut; a Work too dear says so', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page, 4000);
  const s = stage(page);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  await s.getByTestId('evil-trade-open').click();
  await s.getByTestId('evil-trade-tab-1').click();
  await s.locator('[data-testid="evil-trade-row"][data-key="garage"]').click();
  await expect(s.getByTestId('evil-trade-pick')).toBeVisible();
  await s.getByTestId('evil-trade-do-0').click();
  await page.waitForTimeout(200);
  const b = await block(page);
  expect(b.economy.running[0]).toMatchObject({ cardId: 'garage', kind: 'front', backRoom: true });
  expect(b.team.funds).toBe(1000);
  await s.getByTestId('evil-trade-do-0').click();
  await page.waitForTimeout(200);
  expect((await block(page)).economy.running[0].backRoom).toBe(false);
  await expect(s.getByTestId('evil-trade-row').first()).toContainText('Back room shut');
  await s.getByTestId('evil-trade-tab-2').click();
  await s.locator('[data-testid="evil-trade-row"][data-key="clinic"]').click();
  await expect(s.getByTestId('evil-trade-do-0')).toHaveAttribute('title', /Not enough Funds/);
  await shots(page, info, 'trade-work-short');
  await s.getByTestId('evil-trade-do-0').click();
  await page.waitForTimeout(150);
  expect((await block(page)).economy.running).toHaveLength(1);
  expect(errors).toEqual([]);
});

import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// Evil Mode slice 14 ("the Scheme"), in the New look. Keys only: the Scheme page (C) shows the Law's four empty pieces,
// the bar at 0% and its Card; a station (the clean Means) is started from its row with Enter. Taps only: the Museum
// heist planned (the front, loudly), gone into at the In person beat, and walked room by room without a battle.

const stage = (page: Page) => view(page, 'Evil');
const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.evilMode);

async function founded(page: Page, creed: string, at: number) {
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
  await page.evaluate(({ creed, at }) => {
    const p = (window as any).__pkr;
    p.session.evilFound({ name: 'Kettle', creed, line: 'grey', doctrine: 'swarm' }, at);
    const b = p.session.run.expansion.evilMode;
    for (const c of b.crew) c.line = null;
    b.team.funds = 60000;
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  }, { creed, at });
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

test('keys only: the Law\'s page, its Card, and a station started with Enter', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page, 'cause', 2);
  const s = stage(page);
  // Morning, then to Dispatch.
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  await expect(s.getByTestId('evil-beat-dispatch')).toHaveAttribute('data-state', 'now');
  await page.keyboard.press('KeyC');
  await expect(s.getByTestId('evil-sc-title')).toHaveText('The Law');
  await expect(s.getByTestId('evil-sc-pct')).toHaveText('0%');
  for (let i = 0; i < 4; i++) await expect(s.getByTestId(`evil-sc-slot-${i}`)).toHaveAttribute('data-state', 'empty');
  await expect(s.getByTestId('evil-sc-faint')).toContainText('festival');
  await expect(s.getByTestId('evil-sc-ghost')).toContainText('Be invited to speak');
  await expect(s.getByTestId('evil-sc-card')).toContainText('The other way');
  // Down to "The Means: A station of your own" and Enter.
  const rows = await s.locator('[data-testid^="evil-sc-"][data-open]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')));
  const at = rows.indexOf('evil-sc-means-clean');
  expect(at).toBeGreaterThanOrEqual(0);
  for (let i = 0; i < at; i++) await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('evil-sc-card')).toContainText('A STATION OF YOUR OWN');
  await shots(page, info, 'scheme-card');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('evil-sc-said')).toContainText('2 days');
  const b = await block(page);
  expect(b.scheme.jobs).toHaveLength(1);
  expect(b.team.funds).toBe(60000 - 8000);
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('evil-sc')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('taps only: the Museum, planned, gone into in person, walked room by room', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page, 'cause', 2);
  const s = stage(page);
  await page.evaluate(() => (window as any).__pkr.session.evilStep({ type: 'dismissOvernight' }));
  await s.getByTestId('evil-sc-open').click();
  await s.getByTestId('evil-sc-heist-museum').click();
  await expect(s.getByTestId('evil-sc-heist')).toContainText('Planned');
  // The way in: tap until it reads "The front, loudly".
  for (let i = 0; i < 6 && !(await s.getByTestId('evil-sc-plan-in').innerText()).includes('front'); i++) await s.getByTestId('evil-sc-plan-in').click();
  await expect(s.getByTestId('evil-sc-plan-in')).toContainText('The front, loudly');
  await expect(s.getByTestId('evil-sc-go')).toHaveAttribute('data-open', 'false');
  await page.evaluate(() => (window as any).__pkr.session.evilStep({ type: 'send' }));
  await s.getByTestId('evil-sc-close').click();
  await s.getByTestId('evil-sc-open').click();
  await s.getByTestId('evil-sc-go').click();
  // Room by room, never a battle: the first open choice that isn't a fight or leaving.
  for (let i = 0; i < 14; i++) {
    const b = await block(page);
    if (b.scheme.heist.stage !== 'rooms') break;
    const id = await s.locator('[data-testid^="evil-sc-room-"][data-open="true"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')!).find((t) => !/fight|leave/.test(t)) ?? null);
    expect(id).not.toBeNull();
    await s.getByTestId(id!).click();
    await page.waitForTimeout(100);
  }
  const b = await block(page);
  expect(['done', 'failed']).toContain(b.scheme.heist.stage);
  expect(b.scheme.heists).toEqual(['0:1']);
  await expect(s.getByTestId('evil-sc-heist')).toBeVisible();
  await shots(page, info, 'scheme-heist');
  expect(errors).toEqual([]);
});

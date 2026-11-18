import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// Evil Mode slice 20 ("the last three"), in the New look. Alola: the Gym page's Buy and Replace doors say "Shut by the
// island". Paldea: In person offers a Visit to a Star base and a tap makes it. Galar: the Chairman's loan offered In
// person, taken by a tap. Screens at three sizes.

const stage = (page: Page) => view(page, 'Evil');
const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run?.expansion?.evilMode);

async function founded(page: Page, region: string, at: number, fn = '') {
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
  await page.evaluate(([region, at, fn]) => {
    const p = (window as any).__pkr;
    const problem = p.session.evilFound({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm', region }, at);
    if (problem) throw new Error(problem);
    const b = p.session.run.expansion.evilMode;
    for (const c of b.crew) c.line = null;
    new Function('b', fn as string)(b);
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  }, [region, at, fn] as const);
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

const IN_PERSON = `b.fight = null; b.here.beat = 'inPerson'; b.inPerson = null; b.queue = [];`;

test('Alola: Buy and Replace are shut at the Gym, and say the island shut them', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page, 'alola', 3, 'b.team.funds = 99999; b.team.regard = 10; for (const h of b.district.holdings) if (h.kind === "gym") h.scouted = 2;');
  const s = stage(page);
  await page.keyboard.press('KeyY');
  await expect(s.getByTestId('evil-gym-title')).toBeVisible();
  for (const way of ['buy', 'replace']) {
    await expect(s.getByTestId(`evil-gym-door-${way}`)).toHaveAttribute('data-open', 'false');
    await expect(s.getByTestId(`evil-gym-door-${way}`)).toContainText('Shut by the island');
  }
  await shots(page, info, 'alola-gym');
  expect(errors).toEqual([]);
});

test('Paldea: a Star base can only be visited, in person, by a tap', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page, 'paldea', 2, IN_PERSON);
  const s = stage(page);
  const b0 = await block(page);
  const base = b0.district.holdings.find((h: any) => h.kind === 'starBase');
  expect(base).toBeTruthy();
  const visit = s.getByTestId(`evil-clock-visit-${base.id}`);
  await expect(visit).toBeVisible();
  await shots(page, info, 'paldea-visit');
  await visit.click();
  await expect.poll(async () => (await block(page)).region.l3?.visited ?? []).toContain(base.id);
  await expect(visit).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Galar: the Chairman\'s loan, offered in person and taken by a tap', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page, 'galar', 1, `${IN_PERSON} b.region.l3 = { loan: null, offered: 'open', shake: null, aether: null, bag: null, bagAsk: false, visited: [], guardian: [] };`);
  const s = stage(page);
  const funds = (await block(page)).team.funds;
  const take = s.getByTestId('evil-clock-loan-take');
  await expect(take).toContainText("Take the Chairman's loan");
  await expect(s.getByTestId('evil-clock-loan-no')).toBeVisible();
  await shots(page, info, 'galar-loan');
  await take.click();
  await expect.poll(async () => (await block(page)).team.funds).toBe(funds + 20000);
  await expect(s.getByTestId('evil-clock-loan-repay')).toBeVisible();
  expect(errors).toEqual([]);
});

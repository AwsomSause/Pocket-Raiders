import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// Evil Mode slice 21 ("the edges"), in the New look. A Tear is open over a held holding: I opens the Edges page; its Card
// reads "We don't know." three times; "Leave it" is picked by tap and CONFIRMED, and the Card's kept. Keys: at Dispatch, a
// Capture Rig is set on wild ground (Enter), and the Corruption figure appears. With the Shadow branch removed, the page
// has no Rig and the frame no figure. Screens at three sizes.

const stage = (page: Page) => view(page, 'Evil');
const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run?.expansion?.evilMode);

async function founded(page: Page, shadow = true) {
  await start(page, 'ui=new');
  await page.evaluate((shadow) => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true, evilShadow: shadow, ultraBeastsEnabled: true } });
  }, shadow);
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'evil-mode' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Evil');
  await page.evaluate(() => (window as any).__pkr.session.evilFound({ name: 'Kettle', creed: 'profit', line: 'whatever', doctrine: 'swarm' }, 2));
}

async function setUp(page: Page, fn: string) {
  await page.evaluate((fn) => {
    const p = (window as any).__pkr;
    const b = p.session.run.expansion.evilMode;
    new Function('b', fn)(b);
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  }, fn);
  await waitForScene(page, 'Evil');
  await expect(stage(page).getByTestId('evil-team-name')).toBeVisible();
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

// A held local, Warm, with a Tear over it today (Absorption: Flex), and nobody posted or out.
const TEAR = `const h = b.district.holdings.find((x) => x.kind === 'local');
  h.owner = 'team'; h.method = 'persuade'; h.since = 1; h.holds = true; h.mood = 'warm';
  b.fight = null; b.refusal = null;
  b.edges.tear = { beastId: 'ub-absorption', rule: 'flex', holdingId: h.id, region: b.here.region, district: b.district.n, openedDay: b.here.day, choice: null, holdBy: [], cardId: null, over: null };
  b.edges.met = ['ub-absorption'];`;

test('a Tear: I opens its Card ("We don\'t know." three times); Leave it, by tap, is confirmed and kept', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page);
  await setUp(page, TEAR);
  const s = stage(page);
  await expect(s.getByTestId('evil-edge-open')).toContainText('A Tear: open, 3 days');
  await page.keyboard.press('KeyI');
  await expect(s.getByTestId('evil-edge')).toBeVisible();
  await expect(s.getByTestId('evil-edge-title')).toHaveText('A Tear');
  await s.getByTestId('evil-edge-leave').click();
  const card = s.getByTestId('evil-edge-card');
  await expect(card).toBeVisible();
  await expect(card.getByText("We don't know.")).toHaveCount(3);
  await shots(page, info, 'tear-card');
  await s.getByTestId('evil-edge-confirm').click();
  await expect.poll(async () => (await block(page)).edges.tear.choice).toBe('leave');
  expect((await block(page)).edges.cards).toHaveLength(1);
  await expect(s.getByTestId('evil-edge-lines')).toContainText('The team left it.');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('evil-edge')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the Shadow branch: a Capture Rig by keys at Dispatch; the Corruption figure appears', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page);
  await setUp(page, `b.here.beat = 'dispatch'; b.fight = null; b.refusal = null;`);
  const s = stage(page);
  await page.keyboard.press('KeyI');
  await expect(s.getByTestId('evil-edge')).toBeVisible();
  const rig = s.locator('[data-testid^="evil-edge-rig-"]').first();
  await expect(rig).toContainText('Set a Capture Rig');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await block(page)).team.corruption).toBe(1);
  await expect(s.getByTestId('evil-edge-lines')).toContainText('Corruption 1');
  await shots(page, info, 'rig');
  expect(errors).toEqual([]);
});

// Its own test (its own browser context): a second tab in the same context shares the first run's storage and can hold at Boot.
test('the Shadow branch removed at founding: no Rig on the Edges page, no Corruption or Shadow anywhere', async ({ page: page2 }) => {
  const errors2 = watch(page2);
  await founded(page2, false);
  await setUp(page2, `b.here.beat = 'dispatch'; b.fight = null; b.refusal = null;`);
  const s2 = stage(page2);
  await page2.keyboard.press('KeyI');
  await expect(s2.getByTestId('evil-edge')).toBeVisible();
  await expect(s2.locator('[data-testid^="evil-edge-rig-"]')).toHaveCount(0);
  await expect(s2).not.toContainText('Corruption');
  await expect(s2).not.toContainText('Shadow');
  expect((await block(page2)).edges.shadow).toBeNull();
  expect(errors2).toEqual([]);
});

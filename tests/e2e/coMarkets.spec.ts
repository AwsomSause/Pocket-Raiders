import { expect, test, type Page } from '@playwright/test';

// Catalog Overhaul, markets (stalls, the bank, tolls, trades), played in the New UI: the Bank takes the stated half of
// your money and the deposit is still there after a reload; the Toll Bridge takes exactly the posted toll. No console errors.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
const view = (page: Page, key: string) => page.locator(`#rx .stage[data-scene="${key}"]`);

async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

function watch(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

async function toMap(page: Page, seed: string) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/?ui=new&seed=${seed}`);
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
}

/** Stands the run on a first-column node with this event beside it (with this much money), then opens it. */
async function openEvent(page: Page, sideId: string, eventId: string, money: number) {
  await page.evaluate(({ sideId, eventId, money }) => {
    const run = (window as any).__pkr.session.run;
    run.money = money;
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push({ id: sideId, kind: 'event', used: false, eventId });
    run.stage.current = node.id;
    if (!run.stage.visited.includes(node.id)) run.stage.visited.push(node.id);
    (window as any).__pkr.game.scene.getScene('Map').scene.start('Event', { sideId });
  }, { sideId, eventId, money });
  await waitForScene(page, 'Event');
}

/** Picks the first choice, then reads through the outcome and results back to the map (an extra Enter for the result gate). */
async function playFirstChoice(page: Page) {
  const ev = view(page, 'Event');
  for (let i = 0; i < 8 && (await ev.locator('[data-act="pick"]').count()) === 0; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
  }
  await ev.locator('[data-act="pick"]').first().click();
  await expect(ev.locator('.btn[data-act="next"]')).toBeVisible({ timeout: 10_000 });
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(800);
    if ((await scene(page)) !== 'Event') break;
    await page.keyboard.press('Enter');
  }
  await waitForScene(page, 'Map');
}

const runState = (page: Page) => page.evaluate(() => {
  const run = (window as any).__pkr.session.run;
  return { money: run.money, deposit: run.itemCounters?.['market:deposit:bank'] ?? 0, flags: run.story.flags };
});

test('The Bank takes half your money as a deposit, and it is still there after a reload', async ({ page }) => {
  const errors = watch(page);
  await toMap(page, 'co-markets-bank');
  await openEvent(page, 'co-bank', 'bank-teller', 1000);
  await expect(view(page, 'Event')).toContainText('Agatha');
  await playFirstChoice(page);
  const after = await runState(page);
  expect(after.money).toBe(500);
  expect(after.deposit).toBe(500);
  expect(after.flags['ev:deposit-bank']).toBe(1);

  await page.reload();
  await waitForScene(page, 'MainMenu');
  const saved = await page.evaluate(() => {
    const raw = Object.entries(localStorage).find(([k]) => k.endsWith('run'));
    const run = raw ? JSON.parse(raw[1] as string).data : null;
    return run ? { money: run.money, deposit: run.itemCounters?.['market:deposit:bank'] ?? 0 } : null;
  });
  expect(saved).toEqual({ money: 500, deposit: 500 });
  expect(errors).toEqual([]);
});

test('The Toll Bridge takes exactly the posted toll and writes your name in the ledger', async ({ page }) => {
  const errors = watch(page);
  await toMap(page, 'co-markets-toll');
  await openEvent(page, 'co-toll', 'w4-toll-bridge', 700);
  await expect(view(page, 'Event')).toContainText('TOLL');
  await playFirstChoice(page);
  const after = await runState(page);
  expect(after.money).toBe(500);
  expect(after.flags['ev:toll-ledger']).toBe(1);
  expect(errors).toEqual([]);
});

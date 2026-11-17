import { expect, test, type Page } from '@playwright/test';
import { scene, toMap, view, waitForScene, watch } from './helpers/newUi';
import { boot, putRoom } from './helpers/gnscreen';

// gn.new.11 The Night Parade: the Spirit Market screen (New UI). Six lanterns on screen, four stalls, the gate; played through with
// the mouse and the keyboard, to the last lantern and past it.
test.use({ deviceScaleFactor: 2 });

const state = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.minigame?.state ?? null);
const lead = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.party[0].moves.map((m: any) => m.id) as string[]);
const cursor = (page: Page) => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Minigame').menu.index as number);

/** The lead knows four moves and has a nickname, a "?" waits on the stage, and the Bag holds one Rare Candy. */
async function dress(page: Page): Promise<void> {
  await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    run.party[0].moves = ['tackle', 'growl', 'leer', 'scratch'].map((id) => ({ id, pp: 10 }));
    run.party[0].care = { ...(run.party[0].care ?? {}), nickname: 'Pip' };
    run.inventory = { 'rare-candy': 1 };
    const node = run.stage.map.nodes.find((n: any) => n.column > 2 && n.sides.length > 0);
    if (node) node.sides[0].hidden = true;
  });
}

/** Opens the parade's door, clicks "Join the back of the line.", and reads on (Enter, page by page) until the market opens. */
async function joinLine(page: Page, sideId: string): Promise<void> {
  await page.evaluate((sideId) => {
    const g = (window as any).__pkr.game;
    g.scene.getScenes(true)[0].scene.start('Event', { sideId });
  }, sideId);
  await waitForScene(page, 'Event');
  const ev = view(page, 'Event');
  await page.waitForTimeout(400);
  for (let i = 0; i < 12 && (await ev.locator('[data-act="pick"]').count()) === 0; i += 1) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(350);
  }
  await expect(ev.locator('[data-act="pick"]').nth(2)).toContainText('Join the back of the line.');
  await ev.locator('[data-act="pick"]').nth(2).click();
  await expect(ev).toContainText('Spirit Market', { timeout: 10_000 });
  for (let i = 0; i < 20 && (await scene(page)) === 'Event'; i += 1) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  await waitForScene(page, 'Minigame');
}

test.setTimeout(300_000);
test('the Spirit Market: six lanterns, a trade at each stall by mouse and keyboard, the bell, the dark, and staying past six', async ({ page }) => {
  const errors = watch(page);
  await boot(page, 'ui=new&seed=gnscreen-market');
  await toMap(page);
  await dress(page);
  const side = await putRoom(page, 'gn-new-11-door');
  await joinLine(page, side);
  const mk = view(page, 'Minigame');
  await expect(mk).toContainText('The Spirit Market');
  await expect(mk).toContainText('LANTERNS LEFT');
  await expect(mk.locator('[data-lanterns="6"]')).toBeVisible();
  for (const name of ['The Masked Banette', 'The Sableye with scales', 'The Mismagius', 'The Old Dusclops', 'The gate']) await expect(mk).toContainText(name);
  const click = async (cell: number) => {
    await mk.locator(`[data-cell="${cell}"]`).first().click();
    await page.waitForTimeout(300);
  };
  const key = async (k: string) => {
    await page.waitForTimeout(250);
    await page.keyboard.press(k);
    await page.waitForTimeout(350);
  };
  // The Banette, by mouse: the stall, the first move on the cloth, the lead, and the move it gives (the second, Growl).
  const cloth = (await state(page)).cloth as { id: string; name: string }[];
  expect(cloth).toHaveLength(3);
  await click(0);
  expect((await state(page)).at).toBe('banette');
  await expect(mk).toContainText(cloth[0]!.name);
  await click(0);
  await click(0);
  await expect(mk.locator('[data-lanterns="6"]')).toBeVisible();
  await click(1);
  expect(await lead(page)).toEqual(['tackle', cloth[0]!.id, 'leer', 'scratch']);
  await expect(mk.locator('[data-lanterns="5"]')).toBeVisible();
  expect((await state(page)).at).toBe('lanes');
  // Looking is free: into the Sableye's stall and out again with Esc.
  await click(1);
  expect((await state(page)).at).toBe('sableye');
  await key('Escape');
  expect(await state(page)).toMatchObject({ at: 'lanes', lanterns: 5 });
  // The Old Dusclops, by keyboard: walk the cursor to its stall, then Enter through the Pokémon, the egg move and the move given.
  for (let guard = 0; guard < 8 && (await cursor(page)) !== 3; guard += 1) await key('ArrowRight');
  expect(await cursor(page)).toBe(3);
  await key('Enter');
  expect((await state(page)).at).toBe('dusclops');
  await page.screenshot({ path: '/mnt/project-files/shots/gnscreens/spirit-market-stall.png' });
  await key('Enter');
  const lesson = ((await state(page)).party[0].lessons as { id: string }[])[0]!.id;
  await page.screenshot({ path: '/mnt/project-files/shots/gnscreens/spirit-market-lessons.png' });
  await key('Enter');
  await key('Enter');
  expect(await lead(page)).toEqual([lesson, cloth[0]!.id, 'leer', 'scratch']);
  await expect(mk.locator('[data-lanterns="4"]')).toBeVisible();
  // The picture for the report: the lanes, four lanterns lit and two burnt.
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/mnt/project-files/shots/gnscreens/spirit-market.png' });
  // The Mismagius: the nickname goes, and the hidden stop shows itself.
  await click(2);
  await expect(mk).toContainText('Give up "Pip".');
  await click(0);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.party[0].care?.nickname ?? null)).toBeNull();
  expect(await state(page)).toMatchObject({ lanterns: 3, at: 'lanes' });
  // The Sableye: a Notebook line for a Rare item.
  await click(1);
  await click(0);
  expect(await state(page)).toMatchObject({ lanterns: 2, bell: false });
  // The fifth action: the bell. The sixth: the dark, where Esc does not get you out.
  const banette = async () => {
    await click(0);
    await click(0);
    await click(0);
    await click(0);
  };
  await banette();
  await expect(mk).toContainText('The bell has rung');
  await expect(mk).toContainText('rings its little bell');
  await banette();
  expect(await state(page)).toMatchObject({ lanterns: 0, at: 'dark', trades: 6 });
  await expect(mk.locator('[data-lanterns="0"]')).toBeVisible();
  await key('Escape');
  expect(await state(page)).toMatchObject({ at: 'dark', done: false });
  await page.screenshot({ path: '/mnt/project-files/shots/gnscreens/spirit-market-dark.png' });
  // Stay: the Rare Candy (or whatever the seed picks) is swapped for another item of the same tier.
  const bagBefore = await page.evaluate(() => JSON.stringify((window as any).__pkr.session.run.inventory));
  await click(1);
  await expect(mk).toContainText('You wake at the next step', { timeout: 10_000 });
  await expect(mk).toContainText('Trades made: 6 of 6.');
  expect(await page.evaluate(() => JSON.stringify((window as any).__pkr.session.run.inventory))).not.toBe(bagBefore);
  await page.screenshot({ path: '/mnt/project-files/shots/gnscreens/spirit-market-done.png' });
  await mk.locator('[data-act="pick"]').first().click();
  await waitForScene(page, 'Map');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.minigame)).toBeNull();
  expect(errors).toEqual([]);
});

test('leaving early by keyboard: Esc walks to the gate, the gate asks once, and the market is gone', async ({ page }) => {
  const errors = watch(page);
  await boot(page, 'ui=new&seed=gnscreen-market-early');
  await toMap(page);
  await dress(page);
  const side = await putRoom(page, 'gn-new-11-door');
  await joinLine(page, side);
  const mk = view(page, 'Minigame');
  await expect(mk.locator('[data-lanterns="6"]')).toBeVisible();
  // (The first key right after a screen is rebuilt can be dropped: a press that did nothing is pressed once more.)
  const press = async (k: string, want: (s: any) => boolean) => {
    for (let n = 0; n < 3; n += 1) {
      await page.waitForTimeout(350);
      await page.keyboard.press(k);
      await page.waitForTimeout(350);
      if (want(await state(page))) return;
    }
    throw new Error(`${k} never took`);
  };
  await press('Escape', (s) => s.at === 'gate');
  await expect(mk).toContainText('Leaving so soon?');
  // Back to the stalls, then out for good.
  await press('Escape', (s) => s.at === 'lanes');
  await press('Escape', (s) => s.at === 'gate');
  await press('Enter', (s) => s.done === true);
  await expect(mk).toContainText('You traded nothing.', { timeout: 10_000 });
  await press('Enter', (s) => s === null);
  await waitForScene(page, 'Map');
  expect(errors).toEqual([]);
});

test('the market screen is the same in the Old UI style: the lanterns and stalls show, and a stall opens with a click', async ({ page }) => {
  const errors = watch(page);
  await boot(page, 'seed=gnscreen-market-old');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
  await dress(page);
  const side = await putRoom(page, 'gn-new-11-door');
  // Straight into the market through the rules (the Old event screen is canvas-drawn; its clicks are covered by the older specs).
  await page.evaluate((side) => {
    const pkr = (window as any).__pkr;
    pkr.session.chooseEvent(side, 2);
    pkr.game.scene.getScene('Map').scene.start('Minigame');
  }, side);
  await waitForScene(page, 'Minigame');
  const mk = view(page, 'Minigame');
  await expect(mk).toBeVisible();
  await expect(mk).toContainText('LANTERNS LEFT');
  await mk.locator('[data-cell="0"]').first().click();
  await page.waitForTimeout(300);
  expect((await state(page)).at).toBe('banette');
  expect(errors).toEqual([]);
});

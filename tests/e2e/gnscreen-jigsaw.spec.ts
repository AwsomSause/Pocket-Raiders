import { expect, test } from '@playwright/test';
import { toMap, view, waitForScene, watch } from './helpers/newUi';
import { boot, playRoom, putRoom } from './helpers/gnscreen';

// gn.41 The Pokémon Museum, fossil restoration: the twelve-piece jigsaw screen (New UI), played through with the mouse and the keyboard.
test.use({ deviceScaleFactor: 2 });

const state = (page: import('@playwright/test').Page) => page.evaluate(() => (window as any).__pkr.session.run.minigame?.state ?? null);

test.setTimeout(300_000);
test('the Museum\'s jigsaw: twelve pieces from the tray into the sandbox, one forced, paid at the end, back to the desk', async ({ page }) => {
  const errors = watch(page);
  await boot(page, 'ui=new&seed=gnscreen-jigsaw');
  await toMap(page);
  const side = await putRoom(page, 'gn-41-jigsaw');
  const money = await page.evaluate(() => (window as any).__pkr.session.run.money as number);
  await playRoom(page, side, 0);
  await waitForScene(page, 'Minigame');
  const jig = view(page, 'Minigame');
  await expect(jig).toContainText('Fossil Restoration');
  await expect(jig).toContainText('THE SANDBOX');
  const s0 = await state(page);
  expect(s0.tray).toHaveLength(12);
  const { cols, rows } = s0 as { cols: number; rows: number };
  const slotCell = (slot: number) => Math.floor(slot / cols) * cols * 2 + (slot % cols);
  const trayCell = (piece: number, tray: number[]) => { const at = tray.indexOf(piece); return Math.floor(at / cols) * cols * 2 + cols + (at % cols); };
  const click = async (cell: number) => {
    await jig.locator(`[data-cell="${cell}"]`).click();
    await page.waitForTimeout(260);
  };
  // The first piece by mouse: picked up, pressed into the wrong place (forced, and it stays in the hand), then set where it belongs.
  await click(trayCell(0, s0.tray));
  expect((await state(page)).held).toBe(0);
  await click(slotCell(5));
  expect(await state(page)).toMatchObject({ held: 0, forced: 1 });
  await expect(jig).toContainText("doesn't sit");
  await click(slotCell(0));
  expect((await state(page)).placed[0]).toBe(true);
  // The second piece by keyboard: walk the cursor to its place in the tray, Enter, walk to its slot, Enter.
  const walk = async (to: number) => {
    for (let guard = 0; guard < 40; guard += 1) {
      const at = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Minigame').menu.index as number);
      if (at === to) return;
      const [r0, c0, r1, c1] = [Math.floor(at / (cols * 2)), at % (cols * 2), Math.floor(to / (cols * 2)), to % (cols * 2)];
      await page.keyboard.press(r0 < r1 ? 'ArrowDown' : r0 > r1 ? 'ArrowUp' : c0 < c1 ? 'ArrowRight' : 'ArrowLeft');
      await page.waitForTimeout(120);
    }
    throw new Error(`cursor never reached cell ${to}`);
  };
  await walk(trayCell(1, s0.tray));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  expect((await state(page)).held).toBe(1);
  await walk(slotCell(1));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  expect((await state(page)).placed[1]).toBe(true);
  // Half the skull by mouse, then the picture for the report: pieces set, pieces loose, one in the hand.
  for (let n = 2; n < 7; n += 1) {
    await click(trayCell(n, s0.tray));
    await click(slotCell(n));
  }
  await click(trayCell(7, s0.tray));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/gnscreens/jigsaw.png' });
  await click(slotCell(7));
  for (let n = 8; n < rows * cols; n += 1) {
    await click(trayCell(n, s0.tray));
    await click(slotCell(n));
  }
  // The last piece sat: the museum paid for the work (one piece was forced, so no Rare Bone), and Done leads back to the desk.
  await expect(jig).toContainText('pretend not to have heard', { timeout: 10_000 });
  const after = await page.evaluate(() => ({ money: (window as any).__pkr.session.run.money as number, at: (window as any).__pkr.session.run.story.flags['ev:museum-jigsaw-at'] }));
  expect(after.money).toBe(money + 800);
  expect(after.at).toBeGreaterThan(0);
  await page.screenshot({ path: 'test-results/gnscreens/jigsaw-done.png' });
  await jig.locator('[data-act="pick"]').first().click();
  await waitForScene(page, 'Event');
  await expect(view(page, 'Event')).toContainText('Activities Desk');
  expect(errors).toEqual([]);
});

test('the jigsaw screen is the same in the Old UI style: the sandbox and the tray show, and a piece is picked up with a click', async ({ page }) => {
  const errors = watch(page);
  await boot(page, 'seed=gnscreen-jigsaw-old');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
  const side = await putRoom(page, 'gn-41-jigsaw');
  // Straight into the game through the rules (the Old event screen is canvas-drawn; its clicks are covered by the older specs).
  await page.evaluate((side) => {
    const pkr = (window as any).__pkr;
    pkr.session.chooseEvent(side, 0);
    pkr.game.scene.getScene('Map').scene.start('Minigame');
  }, side);
  await waitForScene(page, 'Minigame');
  const jig = view(page, 'Minigame');
  await expect(jig).toBeVisible();
  await expect(jig).toContainText('THE TRAY');
  const s0 = await state(page);
  const at = s0.tray.indexOf(3);
  await jig.locator(`[data-cell="${Math.floor(at / s0.cols) * s0.cols * 2 + s0.cols + (at % s0.cols)}"]`).click();
  await page.waitForTimeout(300);
  expect((await state(page)).held).toBe(3);
  expect(errors).toEqual([]);
});

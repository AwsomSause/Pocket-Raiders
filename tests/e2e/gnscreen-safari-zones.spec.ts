import { writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { addSide, open, scene, view, waitForScene, watch } from './helpers/newUi';

// Greenneedle gn.19 The Deep Savanna and gn.20 The Lush Jungle as walkable zones (New UI): each is entered through its door,
// walked with the keyboard, the pad and the mouse to the first places where the story waits; the room opens there, is answered,
// and the walk is back on the same tile. Also the walk animation: a slide per step, no press lost or doubled, none with reduced
// motion. The rules are tested in tests/unit/gnscreen-savanna.test.ts and gnscreen-jungle.test.ts; this plays the screen.

const zone = (page: Page) => page.evaluate(() => {
  const run = (window as any).__pkr.session.run;
  const s = run.minigame?.state;
  return s ? { id: run.minigame.id, x: s.x, y: s.y, area: s.area, facing: s.facing, seen: s.seen, open: s.open.map((o: any) => o.place), walked: s.walked, phase: run.phase } : { phase: run.phase };
});
async function toMapSlow(page: Page, seed: string) {
  // The same steps as helpers/newUi.ts `start` and `toMap`, with room for a slow machine (the first load is the long part).
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/?ui=new&seed=${seed}`);
  await waitForScene(page, 'MainMenu', 150_000);
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next, 60_000);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 60_000 }).toBe(false);
}
/** Answers the rooms that are open, one after another, with the first of `labels` each offers, and reads through their outcomes, until the walk (or the map) is back. */
async function rooms(page: Page, labels: string[]) {
  const ev = view(page, 'Event');
  for (let i = 0; i < 60 && (await scene(page)) === 'Event'; i++) {
    let picked = false;
    for (const label of labels) {
      const choice = ev.locator('[data-act="pick"]', { hasText: label }).first();
      if (await choice.isVisible().catch(() => false)) {
        await choice.click({ timeout: 5000 }).catch(() => undefined);
        picked = true;
        break;
      }
    }
    // No choice yet: turn the page of the room's text, or read on through its outcome.
    if (!picked) {
      const next = ev.locator('[data-act="next"]').first();
      const turn = (await next.count()) > 0 ? next : ev.locator('[data-act="page"]').first();
      await turn.dispatchEvent('click', undefined, { timeout: 3000 }).catch(() => undefined);
    }
    await page.waitForTimeout(900);
  }
}
async function enter(page: Page, seed: string, door: string, label: string) {
  await toMapSlow(page, seed);
  await addSide(page, { id: 'zone-door', kind: 'event', used: false, eventId: door });
  await open(page, 'Event', { sideId: 'zone-door' });
  await rooms(page, [label]);
  await waitForScene(page, 'Minigame', 30_000);
  await expect(view(page, 'Minigame').locator('.pk-field')).toBeVisible();
  // Count the slides the screen draws (an element with the walk animation on it), for the checks below.
  await page.evaluate(() => {
    (window as any).__walks = 0;
    let last = '';
    new MutationObserver(() => {
      const key = document.querySelector<HTMLElement>('#rx .pk-walk')?.dataset.once ?? '';
      if (key && key !== last) (window as any).__walks += 1;
      last = key || last;
    }).observe(document.getElementById('rx')!, { childList: true, subtree: true });
  });
}
const walks = (page: Page) => page.evaluate(() => (window as any).__walks as number);
/** A picture of the screen for the report, at twice the size: only when ZONE_SHOTS names a folder to write into. */
async function shot(page: Page, name: string) {
  const dir = process.env.ZONE_SHOTS;
  if (!dir) return;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 2, mobile: false });
  await page.waitForTimeout(600);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${dir.replace(/\/$/, '')}/${name}.png`, Buffer.from(data, 'base64'));
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await cdp.detach();
  await page.waitForTimeout(300);
}
/** One key press, then long enough for its slide to finish. */
const press = async (page: Page, key: string) => {
  await page.keyboard.press(key);
  await page.waitForTimeout(260);
};

test.setTimeout(480_000);

test('The Deep Savanna: walk in, walk to the Sandile, answer it there, and walk on; steps slide, and no press is lost or doubled', async ({ page }) => {
  const errors = watch(page);
  await enter(page, 'gnscreen-savanna', 'gn-19-door', 'Walk in.');
  const v = view(page, 'Minigame');
  await expect(v).toContainText('The Deep Savanna');
  await expect(v).toContainText('The Edge');
  await expect(v).toContainText('Water');
  await expect(v.locator('.pk-field.pk-savanna')).toBeVisible();
  expect(await zone(page)).toMatchObject({ id: 'gn-savanna', x: 1, y: 3, area: 0, open: ['edge'], phase: 'minigame' });

  // A step slides: the screen draws the walk once for it, and the rules moved one tile.
  await press(page, 'ArrowRight');
  expect(await zone(page)).toMatchObject({ x: 2, y: 3, facing: 'right' });
  expect(await walks(page)).toBe(1);
  await expect(v.locator('.pk-walk')).toHaveCount(0);
  // Two presses faster than a slide: both are walked, one after the other, and nothing more.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await zone(page)).x, { timeout: 5000 }).toBe(4);
  await page.waitForTimeout(700);
  expect(await zone(page)).toMatchObject({ x: 4, y: 3, walked: 3 });
  expect(await walks(page)).toBe(3);
  // Rock ahead: you turn to face it and stay (no slide).
  await press(page, 'ArrowDown');
  await press(page, 'ArrowRight');
  expect(await zone(page)).toMatchObject({ x: 4, y: 4, facing: 'right', walked: 4 });
  await expect(v).toContainText('Rock and thorn');
  expect(await walks(page)).toBe(4);
  // Enter looks around: where the story waits.
  await press(page, 'Enter');
  await expect(v).toContainText('gap in the rocks');
  // The pad and a click on the grid walk too. With reduced motion a step is a jump, at once.
  await v.locator('[data-act="go"][data-arg="up"]').click();
  await expect.poll(async () => (await zone(page)).y).toBe(3);
  await page.waitForTimeout(300);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const before = await walks(page);
  await v.locator('.pk-hit[data-arg="4,2"]').click();
  expect(await zone(page)).toMatchObject({ x: 4, y: 2 });
  expect(await walks(page)).toBe(before);
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  // Onto the Sandile's tile: its room opens (the walk waits), is answered, and you are back on the tile with the next place open.
  await page.keyboard.press('ArrowRight');
  await waitForScene(page, 'Event', 30_000);
  await expect(view(page, 'Event')).toContainText('The Edge');
  expect((await zone(page)).phase).toBe('map');
  await rooms(page, ['Keep your water.', 'Wait for the herd to pass.']);
  await waitForScene(page, 'Minigame', 30_000);
  await expect(v.locator('.pk-field')).toBeVisible();
  expect(await zone(page)).toMatchObject({ x: 5, y: 2, seen: ['edge'], open: ['pit'], phase: 'minigame' });
  await press(page, 'ArrowRight');
  expect((await zone(page)).x).toBe(6);
  await shot(page, 'savanna');
  expect(errors).toEqual([]);
});

test('The Lush Jungle: go in, walk to the Green Wall and the first bright plant, answer each where it stands', async ({ page }) => {
  const errors = watch(page);
  await enter(page, 'gnscreen-jungle', 'gn-20-door', 'Go in.');
  const v = view(page, 'Minigame');
  await expect(v).toContainText('The Lush Jungle');
  await expect(v).toContainText('The Green Wall');
  await expect(v).toContainText('Unharmed');
  await expect(v.locator('.pk-field.pk-jungle')).toBeVisible();
  expect(await zone(page)).toMatchObject({ id: 'gn-jungle', x: 1, y: 3, open: ['wall'] });
  await press(page, 'ArrowRight');
  await press(page, 'ArrowUp');
  expect(await zone(page)).toMatchObject({ x: 2, y: 2 });
  await page.keyboard.press('ArrowRight');
  await waitForScene(page, 'Event', 30_000);
  await expect(view(page, 'Event')).toContainText('The Green Wall');
  await rooms(page, ['Walk on.']);
  await waitForScene(page, 'Minigame', 30_000);
  expect(await zone(page)).toMatchObject({ x: 3, y: 2, seen: ['wall'], open: ['bright-1'], phase: 'minigame' });
  await shot(page, 'jungle');
  // On to the plant that leans across the path: two tiles east and one south.
  await press(page, 'ArrowRight');
  await press(page, 'ArrowDown');
  await press(page, 'ArrowRight');
  expect(await zone(page)).toMatchObject({ x: 5, y: 3 });
  await page.keyboard.press('ArrowRight');
  await waitForScene(page, 'Event', 30_000);
  await expect(view(page, 'Event')).toContainText('The Bright Path');
  await rooms(page, ['Go round (the long way).']);
  await waitForScene(page, 'Minigame', 30_000);
  expect(await zone(page)).toMatchObject({ x: 6, y: 3, seen: ['wall', 'bright-1'], open: ['bright-2'] });
  expect(errors).toEqual([]);
});

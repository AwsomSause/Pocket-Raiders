import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION redesign R9 follow-up: the Rotom Phone's own pages (radio, inbox, messages, adventure log, Rotom's diary,
// Ask Rotom, Rotom's plan, the road so far, crew chatter, jukebox, photo mode, on a phone) and the Captions tab.
// Every page reads the run and leaves it as it was. Shots go to the output folder for the side-by-side check.

test.use({ viewport: { width: 960, height: 540 } });

async function toHq(page: Page) {
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'dominion' });
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Dominion');
  const s = view(page, 'Dominion');
  await expect(s.getByTestId('dom-logo')).toBeVisible();
  await page.waitForTimeout(300);
  await s.getByTestId('dom-title-0').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-type-poison').click();
  await s.getByTestId('dom-type-dark').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-next').click();
  for (let i = 0; i < 4; i++) await s.getByTestId('dom-opening').click();
  await expect(s.getByTestId('r5-hq')).toBeVisible();
  return s;
}

const block = (page: Page) => page.evaluate(() => JSON.stringify((window as any).__pkr.session.run.expansion.dominion));
const look = (page: Page) => page.evaluate(() => (window as any).__pkr.session.settings.expansion.dominionPrefs.look);
/** Opens a page by its mockup id, the way a chrome link does (the scene's own `r5go`). */
const goTo = (page: Page, id: string) => page.evaluate((x) => { const sc = (window as any).__pkr.game.scene.getScene('Dominion'); sc.r5go(x); sc.view?.refresh(); }, id);

test('the Rotom Phone pages read the run, keep their keys and never change it', async ({ page }, info) => {
  test.setTimeout(240_000);
  const shot = async (n: string) => {
    await page.waitForTimeout(Number(process.env.R5_WAIT ?? 600));
    await page.screenshot({ path: info.outputPath(`${n}.png`) });
    if (process.env.R5_DUMP) writeFileSync(info.outputPath(`${n}.html`), await page.locator('#r5').first().innerHTML());
  };
  const errors = watch(page);
  await start(page, 'ui=new&tutorial=0');
  const s = await toHq(page);
  const before = await block(page);

  // T on the HQ: Ask Rotom (five questions); Enter asks; P from there is Rotom's plan; Esc goes back to the HQ.
  await page.keyboard.press('KeyT');
  await expect(s.getByTestId('r5-ask')).toBeVisible();
  await expect(s.getByTestId('r9-ask-0')).toBeVisible();
  await page.keyboard.press('Enter');
  await shot('ask');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-hq')).toBeVisible();

  // Every page by its mockup id: drawn, its rows there, no Claude or AI, and the run untouched.
  for (const [id, root, row] of [
    ['rplan', 'r5-rplan', 'r9-plan-0'], ['rdiary', 'r5-rdiary', 'r9-diary'], ['radio', 'r5-radio', 'r9-station-0'], ['inbox', 'r5-inbox', 'r5-inbox'],
    ['msgs', 'r5-msgs', 'r9-chat-0'], ['journal', 'r5-journal', 'r9-journal'], ['chapters', 'r5-chapters', 'r9-chapter-0'], ['jukebox', 'r5-jukebox', 'r9-track-0'],
    ['photo', 'r5-photo', 'r9-snap'], ['portrait', 'r5-portrait', 'r9-tall'],
  ] as const) {
    await goTo(page, id);
    await expect(s.getByTestId(root)).toBeVisible();
    await expect(s.getByTestId(row).first()).toBeAttached();
    await shot(id);
    await expect(view(page, 'Dominion')).not.toContainText(/Claude|\bAI\b/);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await expect(s.getByTestId(root)).toHaveCount(0);
  }
  expect(await block(page)).toBe(before);

  // Radio: the pirate station waits for a Radio Room (a press does nothing there).
  await goTo(page, 'radio');
  await expect(s.getByTestId('r9-station-3')).toHaveClass(/lk|lock/);
  await page.keyboard.press('Escape');

  // Photo mode: ▶ changes the frame; P saves a picture to the device and counts it.
  await goTo(page, 'photo');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('dom-set-row-1')).toContainText('Border');
  const dl = page.waitForEvent('download');
  await page.keyboard.press('KeyP');
  expect((await dl).suggestedFilename()).toMatch(/\.png$/);
  await expect.poll(async () => (await look(page)).photos).toBe(1);
  await page.keyboard.press('Escape');

  // On a phone: Enter flips the tall layout (a look setting, saved).
  await goTo(page, 'portrait');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await look(page)).tall).toBe(false);
  await page.keyboard.press('Escape');

  // Crew banter: Lots shows it every fourth page; the Rotom chip types and T opens the chatter scene.
  await page.evaluate(() => {
    const se = (window as any).__pkr.session;
    const p = se.settings.expansion.dominionPrefs;
    se.saveSettings({ ...se.settings, expansion: { ...se.settings.expansion, dominionPrefs: { ...p, look: { ...p.look, chatter: 'lots' } } } });
  });
  // (Every page change counts, the trips back from the phone pages too: change pages until it is due, at most four.)
  for (let i = 0; i < 4 && !(await s.getByTestId('r9-rotom-due').isVisible()); i++) { await page.keyboard.press(i % 2 ? 'Digit1' : 'Digit2'); await page.waitForTimeout(200); }
  await expect(s.getByTestId('r9-rotom-due')).toBeVisible();
  await page.keyboard.press('KeyT');
  await expect(s.getByTestId('r9-chatter-line')).toBeVisible();
  await shot('chatter');
  await page.keyboard.press('Digit2');
  await expect(s.getByTestId('r9-chatter-line')).toHaveCount(0);
  await expect(s.getByTestId('r9-rotom-due')).toHaveCount(0);

  // Captions: a Settings tab after Sound; with captions on, a sound shows its words over the page.
  await page.evaluate(() => { const sc = (window as any).__pkr.game.scene.getScene('Dominion'); sc.menu.go('captions'); sc.view?.refresh(); });
  await expect(s.getByTestId('r5-captions')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await look(page)).captions).toBe(true);
  await shot('captions');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  // Button sounds on: a press on a phone page clicks, and the click has a caption.
  await page.evaluate(() => {
    const se = (window as any).__pkr.session;
    const p = se.settings.expansion.dominionPrefs;
    se.saveSettings({ ...se.settings, muted: false, expansion: { ...se.settings.expansion, dominionPrefs: { ...p, look: { ...p.look, clicks: true } } } });
  });
  await goTo(page, 'chapters');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('r9-caption')).toContainText('[Click]');
  expect(errors).toEqual([]);
});

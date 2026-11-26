import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION redesign R6, part 2 (pass 50): the pages whose rules came last. The back-alley Clinic, Care time, the press,
// a Region Event (Fireworks Night, the Blackout), the Prize Corner and the chapter card. Shots go to the test's output
// folder for the side-by-side check against the mockups (`?bare&still&pass=50&s=<id>`).

test.use({ viewport: { width: 960, height: 540 } });
test.setTimeout(300_000);

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

const run = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run);
const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);
const setBlock = (page: Page, js: string) => page.evaluate(`(() => { const b = window.__pkr.session.run.expansion.dominion; ${js} })()`);

test('R6 life pages: Clinic, Care time, press, Fireworks Night, Prize Corner, Blackout, chapter', async ({ page }, info) => {
  const shot = async (n: string) => {
    await page.waitForTimeout(Number(process.env.R5_WAIT ?? 1500));
    await page.screenshot({ path: info.outputPath(`${n}.png`) });
    if (process.env.R5_DUMP) writeFileSync(info.outputPath(`${n}.html`), await page.locator('#r5').innerHTML());
  };
  const errors = watch(page);
  await start(page, 'ui=new&tutorial=0');
  const s = await toHq(page);
  await setBlock(page, 'b.funds = 20000;');

  // The party chip, then H: the Clinic, opened on the hurt lead.
  await page.evaluate(() => {
    const r = (window as any).__pkr.session.run;
    r.party[0].hp = Math.max(1, Math.floor(r.party[0].hp / 5));
  });
  await s.locator('.pty31').click();
  await expect(s.getByTestId('r5-party')).toBeVisible();
  await page.keyboard.press('KeyH');
  await expect(s.getByTestId('r5-clinic')).toBeVisible();
  await expect(s.getByTestId('r6-clinic-0')).toHaveClass(/r6-on/);
  await expect(s.getByTestId('r6-clinic-0')).toContainText('₽');
  await shot('clinic');
  const f0 = (await block(page)).funds;
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-notice')).toContainText('patches up');
  expect((await block(page)).funds).toBeLessThan(f0);
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('r6-clinic-0')).toContainText('Fine');

  // Back to the Party, then C: Care time with the lead. A Poké Puff raises its friendship (once a day).
  await page.keyboard.press('Escape');
  await s.locator('.pty31').click();
  await expect(s.getByTestId('r5-party')).toBeVisible();
  await page.keyboard.press('KeyC');
  await expect(s.getByTestId('r5-care')).toBeVisible();
  await expect(s.getByTestId('r6-care-tool-1')).toHaveClass(/\bon\b/);
  await shot('care');
  const fr0 = (await run(page)).party[0].friendship;
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-notice')).toContainText('friendship +');
  expect((await run(page)).party[0].friendship).toBeGreaterThan(fr0);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-notice')).toContainText('Tomorrow');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-party')).toBeVisible();

  // The press: a reporter (town row O231) on the Region Map asks on camera; 1 answers.
  await setBlock(page, "b.empire = { ...(b.empire ?? {}), meet: { row: 'O231', district: 'viridian', day: b.day } };");
  await page.keyboard.press('Digit2');
  await expect(s.getByTestId('r5-press')).toBeVisible();
  await expect(s.getByTestId('dom-town-0')).toContainText('Regard');
  await shot('press');
  await page.keyboard.press('Digit1');
  await expect(s.getByTestId('r5-evresult')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('r5-reward')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('r5-press')).toHaveCount(0);

  // A new day brings Fireworks Night (Day 14): it opens on its own over the HQ.
  await setBlock(page, 'b.day = 14;');
  await page.keyboard.press('Digit1');
  await expect(s.getByTestId('r5-festival')).toBeVisible();
  await expect(s.getByTestId('r6-region-0')).toContainText('%');
  await shot('festival');
  const b0 = await block(page);
  await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('r6-region-1')).toHaveClass(/\bon\b/);
  expect(await block(page)).toEqual(b0);
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('r6-region-roll')).toContainText('rolled');
  expect((await block(page)).life.done).toHaveLength(1);
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('r5-festival')).toHaveCount(0);
  await expect(s.getByTestId('r5-hq')).toBeVisible();

  // The Prize Corner from the Start menu: B buys 50 coins; a prize too dear says so.
  await s.locator('.ph13.st25').click();
  await s.getByTestId('r5-start-prize').click();
  await expect(s.getByTestId('r5-prize')).toBeVisible();
  for (let i = 0; i < 3; i++) await page.keyboard.press('KeyB');
  await expect(s.getByTestId('r6-coins')).toHaveText('150');
  await expect(s.getByTestId('dom-notice')).toContainText('50 coins');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-notice')).toHaveCount(0);
  await shot('prize');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-notice')).toContainText('Not enough coins');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-prize')).toHaveCount(0);

  // Day 42: the Blackout. Esc only closes it (it waits); the lantern opens it again.
  await setBlock(page, 'b.day = 42;');
  await page.keyboard.press('Digit1');
  await expect(s.getByTestId('r5-blackout')).toBeVisible();
  await expect(s.getByTestId('r6-region-1')).toContainText('Lit');
  await shot('blackout');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-blackout')).toHaveCount(0);
  await s.locator('.fl34').first().dispatchEvent('click');
  await expect(s.getByTestId('r5-blackout')).toBeVisible();
  await s.getByTestId('r6-region-pass').click();
  await expect(s.getByTestId('r5-blackout')).toHaveCount(0);
  expect((await block(page)).life.done).toHaveLength(2);

  // Founded and a new day: Chapter 2 waits on its card until Enter.
  await setBlock(page, "b.teamName = 'Team Nova'; b.day = 43;");
  await page.keyboard.press('Digit1');
  await expect(s.getByTestId('r5-chapter')).toBeVisible();
  await expect(s.getByTestId('r6-chapter')).toContainText('Chapter 2');
  await shot('chapter');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('r5-chapter')).toHaveCount(0);
  expect((await block(page)).life.chapter).toBe(2);

  for (const [w, h] of [[1280, 720], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await page.screenshot({ path: info.outputPath(`hq-${w}x${h}.png`) });
  }
  expect(errors).toEqual([]);
});

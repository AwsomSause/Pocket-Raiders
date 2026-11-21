import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION redesign R6 (pass 50 of plans/evil-mode-rework/redesign-50): the Pokémon pages (Reserve, the Card that
// gives a Pokémon, Party, Summary, Bag) and a street meeting played as an event (Talk, Choose, Result, Reward, the Text
// log). Shots go to the test's output folder for the side-by-side check against the mockups (`?bare&still&pass=50&s=<id>`).

test.use({ viewport: { width: 960, height: 540 } });
// Each shot waits for the page's entrances to finish (R5_WAIT), so these run longer than most specs.
test.setTimeout(240_000);

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

test('R6 Pokémon pages: Reserve, the Card, Party, Summary and Bag', async ({ page }, info) => {
  const shot = async (n: string) => {
    await page.waitForTimeout(Number(process.env.R5_WAIT ?? 1500));
    await page.screenshot({ path: info.outputPath(`${n}.png`) });
    if (process.env.R5_DUMP) writeFileSync(info.outputPath(`${n}.html`), await page.locator('#r5').innerHTML());
  };
  const errors = watch(page);
  await start(page, 'ui=new&tutorial=0');
  const s = await toHq(page);

  // Tab 4: the Reserve box, Day 1's Pokémon of the other Team Type in the first cell.
  await page.keyboard.press('Digit4');
  await expect(s.getByTestId('r5-reserve')).toBeVisible();
  await expect(s.getByTestId('dom-reserve-count')).toHaveText('1 / 20');
  await expect(s.getByTestId('dom-tile-0')).toBeVisible();
  await expect(s.getByTestId('dom-tile-0')).not.toContainText('OFF-TYPE');
  await shot('reserve');

  // Enter: the Card. 100% for Rook; nothing changed yet.
  const b0 = await block(page);
  const uid = b0.reserve.box[0].uid;
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('r5-give')).toBeVisible();
  await expect(s.getByTestId('dom-who')).toHaveText('Rook');
  await expect(s.getByTestId('dom-ghost')).toBeVisible();
  await expect(s.locator('.c-odds .ring')).toHaveAttribute('style', /--p:100/);
  expect(await block(page)).toEqual(b0);
  await shot('give');
  // Change crew: the Boss (no BST cap), and back.
  await s.getByTestId('dom-give-who').click();
  await expect(s.getByTestId('dom-who')).toHaveText('The Boss');
  await expect(s.getByTestId('dom-bstcap')).toHaveText('—');
  await page.keyboard.press('ArrowLeft');
  await expect(s.getByTestId('dom-who')).toHaveText('Rook');
  // Esc closes the Card without giving; Enter twice gives.
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-reserve')).toBeVisible();
  expect(await block(page)).toEqual(b0);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-notice')).toContainText('goes to Rook');
  const b1 = await block(page);
  expect(b1.members[0].team.map((m: { uid: string }) => m.uid)).toContain(uid);
  expect(b1.reserve.box).toHaveLength(0);
  await expect(s.getByTestId('dom-reserve-count')).toHaveText('0 / 20');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-notice')).toHaveCount(0);

  // The party chip in the key strip: the Party page. A hurt lead shows in Rotom's line.
  await page.evaluate(() => {
    const r = (window as any).__pkr.session.run;
    r.party[0].hp = Math.max(1, Math.floor(r.party[0].hp / 3));
    r.inventory.potion = 3;
  });
  await s.locator('.pty31').click();
  await expect(s.getByTestId('r5-party')).toBeVisible();
  await expect(s.getByTestId('r6-party-0')).toHaveClass(/\bon\b/);
  await shot('party');
  // Enter: the Summary; arrows step through the party; Esc back to the Party.
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('r5-summary')).toBeVisible();
  await expect(s.locator('.mr31').first()).toBeVisible();
  await shot('summary');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-party')).toBeVisible();

  // The Bag from the Start menu: a Potion, used on the lead (through the Party page).
  await page.keyboard.press('Digit1');
  await expect(s.getByTestId('r5-hq')).toBeVisible();
  await s.locator('.ph13.st25').click();
  await s.getByTestId('r5-start-bag').click();
  await expect(s.getByTestId('r5-bag')).toBeVisible();
  await expect(s.getByTestId('r6-bag-pocket')).toHaveText('Medicine');
  await expect(s.getByTestId('r6-bag-0')).toContainText('Potion');
  await shot('bag');
  const hp0 = (await run(page)).party[0].hp;
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('r6-party-sub')).toContainText('Use Potion on');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-notice')).toBeVisible();
  const r1 = await run(page);
  expect(r1.party[0].hp).toBeGreaterThan(hp0);
  expect(r1.inventory.potion).toBe(2);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-bag')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-reserve')).toBeVisible();

  // Several window sizes.
  for (const [w, h] of [[1280, 720], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    await expect(s.getByTestId('dom-reserve')).toBeVisible();
    await page.screenshot({ path: info.outputPath(`reserve-${w}x${h}.png`) });
  }
  expect(errors).toEqual([]);
});

test('R6 events: a street meeting in four beats with the Text log', async ({ page }, info) => {
  const shot = async (n: string) => {
    await page.waitForTimeout(Number(process.env.R5_WAIT ?? 1500));
    await page.screenshot({ path: info.outputPath(`${n}.png`) });
    if (process.env.R5_DUMP) writeFileSync(info.outputPath(`${n}.html`), await page.locator('#r5').innerHTML());
  };
  const errors = watch(page);
  await start(page, 'ui=new&tutorial=0');
  const s = await toHq(page);

  // A rich tourist asks the way (town row O015): the third answer is a Charm check.
  await page.evaluate(() => {
    const b = (window as any).__pkr.session.run.expansion.dominion;
    b.empire = { ...(b.empire ?? {}), meet: { row: 'O015', district: 'viridian', day: b.day } };
  });
  await page.keyboard.press('Digit2');
  await expect(s.getByTestId('r5-event')).toBeVisible();
  await expect(s.getByTestId('r6-ev-line')).toContainText('rich tourist');
  await shot('event');

  // Enter: Choose, with the odds of each answer. Nothing is decided yet.
  const b0 = await block(page);
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('r5-evchoose')).toBeVisible();
  await expect(s.getByTestId('dom-town-2')).toContainText('Charm');
  expect(await block(page)).toEqual(b0);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('dom-town-2')).toHaveClass(/\bon\b/);
  await shot('evchoose');

  // L: the Text log, and back.
  await page.keyboard.press('KeyL');
  await expect(s.getByTestId('r6-log')).toContainText('rich tourist');
  await shot('log');
  await page.keyboard.press('KeyL');
  await expect(s.getByTestId('r5-evchoose')).toBeVisible();

  // Enter: the answer is rolled; the Result's text shows, and no reward yet.
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('r5-evresult')).toBeVisible();
  await expect(s.getByTestId('r6-ev-roll')).toContainText('needed');
  await expect(s.getByTestId('r6-reward')).toHaveCount(0);
  const b1 = await block(page);
  expect(b1.empire.meet).toBeNull();
  await shot('evresult');

  // Enter closes the text: the reward (if any) shows, and stays until a key.
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('r5-evresult')).toHaveCount(0);
  if (await s.getByTestId('r5-reward').count()) {
    await expect(s.getByTestId('r6-reward-big')).toBeVisible();
    await shot('reward');
    await page.keyboard.press('Enter');
  }
  await expect(s.getByTestId('r5-event')).toHaveCount(0);
  await expect(s.getByTestId('r5-evresult')).toHaveCount(0);
  expect(await block(page)).toEqual(b1);

  // A sure reward: the first answer (Regard), straight from Choose with key 1.
  await page.evaluate(() => {
    const b = (window as any).__pkr.session.run.expansion.dominion;
    b.empire.meet = { row: 'O015', district: 'viridian', day: b.day };
  });
  await page.keyboard.press('Digit1');
  await page.keyboard.press('Digit2');
  await expect(s.getByTestId('r5-event')).toBeVisible();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Digit1');
  await expect(s.getByTestId('r5-evresult')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('r5-reward')).toBeVisible();
  await expect(s.getByTestId('r5-reward')).toContainText('Regard');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('r5-reward')).toHaveCount(0);
  expect(errors).toEqual([]);
});

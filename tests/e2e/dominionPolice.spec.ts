import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D24 (police questioning): the interview room (Rotom mockup a8) takes over the screen while a case is
// open: quick answers on 1-5, T for your own words, Esc to stay silent; the Belief meter, the case papers (one face
// down), the CONTRADICTS EVIDENCE tell. A reload keeps the case. After the last answer the release page (a9) lists
// what it cost; Enter goes back to the HQ the next morning.

async function newDominion(page: Page) {
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'dominion' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
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
  await expect(s.getByTestId('dom-phase')).toHaveText('EVENING');
  return s;
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);

/** Re-enters the Dominion from the saved run (as after a reload). */
async function reenter(page: Page) {
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.continueRun();
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  });
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
  const s = view(page, 'Dominion');
  await s.getByTestId('dom-title-1').click();
  return s;
}

/** Presses a key until the turn counter moves (a press can be lost in a busy headless frame). */
async function answer(page: Page, s: ReturnType<typeof view>, key: string, turn: number) {
  await expect(async () => {
    if (!((await s.getByTestId('dom-q-turn').textContent()) ?? '').startsWith(`${turn}/`)) await page.keyboard.press(key);
    await expect(s.getByTestId('dom-q-turn')).toHaveText(new RegExp(`^${turn}/`), { timeout: 1500 });
  }).toPass({ timeout: 15_000 });
}

test('police questioning: answers, a typed answer, the tell, a reload mid-case, the release and its costs', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  await newDominion(page);

  // A case like the mockup's: CCTV of the Boss's lead Pokémon, a witness (face down), a grunt's statement.
  const day = await page.evaluate(() => {
    const p = (window as any).__pkr;
    const b = p.session.run.expansion.dominion;
    const lead = p.session.run.party[0].speciesId;
    b.funds = 7500;
    b.police = {
      n: 1, q: {
        n: 1, who: 'boss', name: 'The Boss', officer: 'dalton', district: 'celadon', day: b.day, why: 'police', belief: 50, start: 50,
        evidence: [
          { id: 'cam', kind: 'cctv', day: b.day, district: 'celadon', text: 'Celadon Dept. Store · 9:04 PM', mon: lead },
          { id: 'w', kind: 'witness', day: b.day, district: 'celadon', text: '“A Murkrow flew out of the lobby.”' },
          { id: 's', kind: 'statement', day: b.day, district: 'celadon', text: 'Grunt Mick: “ask the Boss.”' },
        ],
        down: ['w'], turns: [],
      },
      last: null, evidence: [], rolls: 0, pickedUp: 0, floor: null, watched: [], held: [], raid: null, informant: null,
    };
    p.session.saveRunNow();
    return b.day;
  });
  let s = await reenter(page);
  await expect(s.getByTestId('dom-q-title')).toContainText('Questioning');
  await expect(s.getByTestId('dom-q-belief')).toHaveText('50');
  await expect(s.getByTestId('dom-q-doc')).toHaveCount(3);
  await expect(s.locator('[data-testid="dom-q-doc"][data-down="1"]')).toHaveCount(1);
  await expect(s.getByTestId('dom-q-line')).toContainText('OFFICER DALTON');
  await expect(s.getByTestId('dom-q-chip')).toContainText('Checked by the rules');
  await expect(s.getByTestId('dom-q-blame')).toContainText('Blame Rocket');
  await page.waitForTimeout(400);
  await shot('a8-room-start');

  // Nothing else moves while the case is open: E (end the day) and N do nothing.
  await page.keyboard.press('KeyE');
  await page.keyboard.press('KeyN');
  expect((await block(page)).police.q.turns).toHaveLength(0);

  // 1: an alibi against the CCTV: the tell, the red string, the meter drops.
  await answer(page, s, 'Digit1', 1);
  await expect(s.getByTestId('dom-q-tell')).toHaveText('CONTRADICTS EVIDENCE');
  await expect(s.getByTestId('dom-q-judge')).toContainText('no · CCTV');
  const after1 = Number(await s.getByTestId('dom-q-belief').textContent());
  expect(after1).toBeLessThan(50);
  await page.waitForTimeout(400);
  await shot('a8-room-contradiction');

  // T: your own words in the shared typing box (no Key-Card here, so the rules judge them; nothing is sent anywhere).
  const box = page.getByTestId('type-box-input');
  await expect(async () => {
    if (!(await box.count())) await page.keyboard.press('KeyT');
    await expect(box).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 15_000 });
  await expect(page.getByTestId('type-box')).toContainText('Officer Dalton');
  // Every key belongs to the box: its "e"s and "T"s never end the day or reopen anything behind it.
  await page.keyboard.type("That jacket's sold at every Mart in Kanto", { delay: 15 });
  await expect(box).toHaveValue("That jacket's sold at every Mart in Kanto");
  await expect(s.getByTestId('dom-q-turn')).toHaveText(/^1\//);
  await shot('a8-room-typing');
  await page.keyboard.press('Enter');
  await expect(box).toHaveCount(0);
  await expect(s.getByTestId('dom-q-turn')).toHaveText(/^2\//);
  await expect(s.getByTestId('dom-q-said')).toContainText('every Mart in Kanto');
  const b2 = await block(page);
  expect(b2.police.q.turns[1].kind).toBe('typed');
  expect(b2.police.q.turns[1].text).toBe("That jacket's sold at every Mart in Kanto");

  // Esc: stay silent.
  await answer(page, s, 'Escape', 3);
  expect((await block(page)).police.q.turns[2].kind).toBe('silent');

  // Reload mid-case: the same room, the same turn.
  await page.goto('/?ui=new');
  await waitForScene(page, 'MainMenu');
  s = await reenter(page);
  await expect(s.getByTestId('dom-q-turn')).toHaveText(/^3\//);

  // Window sizes.
  for (const [w, h] of [[1280, 720], [960, 540], [390, 844]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(300);
    await expect(s.getByTestId('dom-q-meter')).toBeVisible();
    await shot(`a8-room-${w}x${h}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });

  // Deny until the case closes (the fifth answer, or sooner if the meter hits 0): the release page shows what it cost.
  await expect(async () => {
    if (await s.getByTestId('dom-q-turn').count()) await page.keyboard.press('Digit2');
    await expect(s.getByTestId('dom-rel-stamp')).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 30_000 });
  const rel = (await block(page)).police.last;
  expect(rel.seen).toBe(false);
  await expect(s.getByTestId('dom-rel-belief')).toHaveText(`Belief ended at ${rel.belief}`);
  await expect(s.getByTestId('dom-rel-morale')).toBeVisible();
  await expect(s.getByTestId('dom-rel-cell')).toContainText(new RegExp(`Days? ${day}`));
  await expect(s.getByTestId('dom-rel-parting')).toContainText('Officer Dalton');
  await page.waitForTimeout(500);
  await shot('a9-release');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await shot('a9-release-phone');
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(view(page, 'Dominion')).not.toContainText(/Claude|\bAI\b/);

  // Enter: back to the HQ, the next morning.
  await expect(async () => {
    if (await s.getByTestId('dom-rel-stamp').count()) await page.keyboard.press('Enter');
    await expect(s.getByTestId('dom-phase')).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 15_000 });
  await expect(s.getByTestId('dom-phase')).toHaveText('MORNING');
  const end = await block(page);
  expect(end.day).toBeGreaterThan(day);
  expect(end.police.q).toBeNull();
  expect(end.police.last.seen).toBe(true);
  expect(errors).toEqual([]);
});

import { expect, test, type Page } from '@playwright/test';
import { addSide, start, waitForScene, watch } from './helpers/newUi';
import { fitProblems, onPage, pview, toPhantomMap } from './helpers/phantomUi';

// Phantom UI: the card page. The code-name card a team hands you, the run card at a run's end and the hub's Trainer
// Card are one Phantom page that the same keys and clicks steer.

const fits = async (page: Page, key: string) => { await page.waitForTimeout(900); expect(await fitProblems(page, key, 'card')).toEqual([]); };
const version = (page: Page, key: string, id: string) => page.evaluate(([key, id]) => { const pkr = (window as any).__pkr; pkr.session.saveSettings({ ...pkr.session.settings, phantomVersion: id }); const s = pkr.game.scene.getScene(key); (s.rx ?? s.rxView)?.refresh(); }, [key, id] as const);
const pageNow = (page: Page, key: string) => page.evaluate((key) => document.querySelector(`#phx .phs[data-scene="${key}"]`)?.getAttribute('data-scr') ?? null, key);

test('Phantom UI: joining a team shows the code-name card with the welcome line; it stays until an input, then what changed', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=newui-stand');
  await onPage(page, 'MainMenu', 'title');
  await toPhantomMap(page);
  await addSide(page, { id: 'ph-stand', kind: 'event', used: false, eventId: 'stand-with-recruiter' });
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    pkr.session.run.story.evil = { ...(pkr.session.run.story.evil ?? {}), teamId: 'rocket' };
    pkr.game.scene.getScene('Map').scene.start('Event', { sideId: 'ph-stand' });
  });
  await waitForScene(page, 'Event');
  for (let k = 0; k < 6 && (await pageNow(page, 'Event')) !== 'choice'; k++) { await page.keyboard.press('Enter'); await page.waitForTimeout(400); }
  await onPage(page, 'Event', 'choice');
  await page.waitForTimeout(250);
  await page.locator('#phx .phs[data-scene="Event"] [data-act="pick"]', { hasText: 'Join' }).first().click();
  await onPage(page, 'Event', 'card');
  const card = pview(page, 'Event', 'card');
  for (const t of ['Code Name', 'Provisional Agent 000', 'Team Rocket', '+30', 'Issued', 'Note']) await expect(card).toContainText(t, { ignoreCase: true });
  await expect(card.locator('.tcard h3 .rs')).toHaveAttribute('aria-label', 'HOUSE CARD');
  await expect(card.locator('.ph-tc-note p')).not.toHaveText('');
  await expect(card.locator('.ph-tc-stamp')).toHaveCount(0);
  await fits(page, 'Event');
  // It waits: nothing moves on by itself.
  await page.waitForTimeout(1500);
  expect(await pageNow(page, 'Event')).toBe('card');
  for (const [id, w, h] of [['midnight', 844, 390], ['velvet', 1920, 1080]] as const) {
    await version(page, 'Event', id);
    await page.setViewportSize({ width: w, height: h });
    await expect(page.locator(`#phx .phs[data-scene="Event"][data-scr="card"][data-liv="${id}"]`)).toBeVisible();
    await fits(page, 'Event');
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.keyboard.press('Enter');
  await onPage(page, 'Event', 'sy-reward');
  expect(errors).toEqual([]);
});

test('Phantom UI: the run card at a run’s end shows the run and saves as a picture; Esc goes back to the run end', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=phantom-card');
  await onPage(page, 'MainMenu', 'title');
  await toPhantomMap(page);
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const run = session.run;
    run.party[0].hp = 0;
    run.log.battlesWon = 7;
    run.log.defeatedBy = { speciesId: run.party[0].speciesId, level: 9, trainer: 'Gym Leader Misty' };
    run.phase = 'over';
    session.finishRun();
    for (const s of game.scene.getScenes(true)) game.scene.stop(s.scene.key);
    game.scene.start('GameOver');
  });
  await waitForScene(page, 'GameOver');
  await page.waitForTimeout(600);
  // The run end is the Phantom run-over page; its "Run card" blade opens the Phantom card.
  await onPage(page, 'GameOver', 'runover');
  await pview(page, 'GameOver', 'runover').locator('[data-act="pick"]', { hasText: 'Run card' }).click();
  await onPage(page, 'GameOver', 'card');
  const card = pview(page, 'GameOver', 'card');
  for (const t of ['Run card', 'Run end', 'Loss', 'Result', 'Seed', 'phantom-card', 'Final team', 'Save as picture', 'Press Enter to save']) await expect(card).toContainText(t, { ignoreCase: true });
  await expect(card.locator('.ph-tc-team .spr')).not.toHaveCount(0);
  await fits(page, 'GameOver');
  await version(page, 'GameOver', 'channel');
  await page.setViewportSize({ width: 700, height: 900 });
  await expect(page.locator('#phx .phs[data-scene="GameOver"][data-scr="card"][data-liv="channel"]')).toBeVisible();
  await fits(page, 'GameOver');
  await page.setViewportSize({ width: 1280, height: 720 });
  // Enter saves the picture and the card says so.
  await page.keyboard.press('Enter');
  await expect(card.locator('.ph-tc-note p')).toHaveText(/Saved as a PNG|could not be saved/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#phx .phs[data-scene="GameOver"][data-scr="card"]')).toHaveCount(0);
  await onPage(page, 'GameOver', 'runover');
  await expect(pview(page, 'GameOver', 'runover').locator('.ro-t')).toContainText('The run', { ignoreCase: true });
  expect(errors).toEqual([]);
});

test('Phantom UI: the hub’s Trainer Card is the card page, and Esc closes it', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=phantom-hubcard');
  await onPage(page, 'MainMenu', 'title');
  await page.evaluate(() => { const g = (window as any).__pkr.game; for (const s of g.scene.getScenes(true)) if (s.scene.key !== 'Hub') g.scene.stop(s.scene.key); g.scene.start('Hub'); });
  await waitForScene(page, 'Hub');
  await page.waitForTimeout(1200);
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Hub').openCard());
  await onPage(page, 'Hub', 'card');
  const card = pview(page, 'Hub', 'card');
  for (const t of ['Trainer Card', 'Hub', 'Rank 0', 'Runs', 'Battles won', 'Pokémon caught', 'Wardrobe']) await expect(card).toContainText(t, { ignoreCase: true });
  await expect(card.locator('.badges i')).toHaveCount(8);
  await expect(card.locator('.badges i.f')).toHaveCount(0);
  await fits(page, 'Hub');
  await page.keyboard.press('Escape');
  await expect(page.locator('#phx .phs[data-scene="Hub"][data-scr="card"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

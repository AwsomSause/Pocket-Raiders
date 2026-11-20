import { expect, test, type Page } from '@playwright/test';
import { start, waitForScene, watch } from './helpers/newUi';
import { fitProblems, onPage, pview, toPhantomMap } from './helpers/phantomUi';

// Phantom UI: how a run ends. A lost run (`runover`), a won one (`record`), the credits, a champion's team in the
// Hall of Fame (`hall`) and a Legendary's blessing at the start of a run (`blessing`).

const SIZES = [['midnight', 844, 390], ['fantasia', 1024, 768], ['velvet', 1920, 1080], ['channel', 1280, 720]] as const;
const dress = (page: Page, id: string) => page.evaluate((id) => { const pkr = (window as any).__pkr; pkr.session.saveSettings({ ...pkr.session.settings, phantomVersion: id }); }, id);
const fit = async (page: Page, key: string, id: string, note = '') => { await page.waitForTimeout(900); expect(await fitProblems(page, key, id), `${id} ${note}`).toEqual([]); };
const sceneNow = (page: Page) => page.evaluate(() => (window as any).__pkr.activeScene() as string);

/** Ends the run now: lost to a Gym Leader, or won. */
const endRun = (page: Page, won: boolean) => page.evaluate((won) => {
  const { session, game } = (window as any).__pkr;
  const run = session.run;
  run.log.battlesWon = 7;
  if (won) run.victory = true;
  else {
    run.party[0].hp = 0;
    run.log.defeatedBy = { speciesId: run.party[0].speciesId, level: 9, trainer: 'Gym Leader Misty' };
  }
  run.phase = 'over';
  session.finishRun();
  for (const s of game.scene.getScenes(true)) game.scene.stop(s.scene.key);
  game.scene.start('GameOver');
}, won);

test('Phantom UI: a lost run ends on the run-over page: where it stopped, the road, the numbers, what stays; the report, the team and the card open from it', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=phantom-end');
  await toPhantomMap(page);
  await endRun(page, false);
  await waitForScene(page, 'GameOver');
  await onPage(page, 'GameOver', 'runover');
  const over = pview(page, 'GameOver', 'runover');
  await expect(over.locator('.ro-t h2')).toContainText('The run');
  await expect(over.locator('.ro-t .lab')).toContainText(/Stage 1 of \d+/);
  await expect(over.locator('.ro-t .lab')).toContainText('lost to Gym Leader Misty', { ignoreCase: true });
  await expect(over.locator('.ro-road i.x')).toHaveCount(1);
  await expect(over.locator('.ro-st')).toContainText('Battles won');
  await expect(over.locator('.ro-st .ro-r').first().locator('b')).toHaveText('7');
  await expect(over.locator('.ro-mvp')).toContainText('Most valuable', { ignoreCase: true });
  await expect(over.locator('.ro-keep')).toBeVisible();
  await expect(over.locator('.ro-go .blade')).toHaveCount(3);
  await expect(over.locator('.ro-go .blade.on')).toContainText('Full report', { ignoreCase: true });
  await expect(over.locator('.ph-ov-team > i')).not.toHaveCount(0);
  await fit(page, 'GameOver', 'runover');
  await page.waitForTimeout(500);

  // Down and up walk the three answers.
  await page.keyboard.press('ArrowDown');
  await expect(over.locator('.ro-go .blade.on')).toContainText('Run card', { ignoreCase: true });
  await page.keyboard.press('ArrowUp');
  await expect(over.locator('.ro-go .blade.on')).toContainText('Full report', { ignoreCase: true });
  // Tapping a Pokémon of the last team gets an answer.
  await over.locator('.ph-ov-team > i').first().click();
  await expect(over.locator('.ph-ov-team > i.poked u')).toHaveText('…');

  // The full report is a sheet over the page; Enter turns its pages and then shuts it.
  await page.keyboard.press('Enter');
  const sheet = over.locator('.ph-ov-report');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('.lab')).toContainText(/page 1 of \d+/i);
  await expect(sheet.locator('.txt')).not.toBeEmpty();
  await fit(page, 'GameOver', 'runover', 'report');
  for (let n = 0; n < 12 && (await sheet.count()) > 0; n++) { await page.keyboard.press('Enter'); await page.waitForTimeout(250); }
  await expect(sheet).toHaveCount(0);
  await page.keyboard.press('Tab');
  await expect(sheet).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);

  // F: the final team, as the Phantom party page; Esc comes back.
  await page.keyboard.press('f');
  await expect(pview(page, 'GameOver', 'runover')).toHaveCount(0);
  await expect(pview(page, 'GameOver')).toContainText('Final team', { ignoreCase: true });
  await page.keyboard.press('Escape');
  await onPage(page, 'GameOver', 'runover');

  // The run card opens from its blade.
  await over.locator('.ro-go .blade', { hasText: /run card/i }).click();
  await onPage(page, 'GameOver', 'card');
  await page.keyboard.press('Escape');
  await onPage(page, 'GameOver', 'runover');

  for (const [id, w, h] of SIZES) {
    await dress(page, id);
    await page.setViewportSize({ width: w, height: h });
    await page.keyboard.press('ArrowDown');
    await expect(page.locator(`#phx .phs[data-scene="GameOver"][data-scr="runover"][data-liv="${id}"]`)).toBeVisible();
    await fit(page, 'GameOver', 'runover', `${id} ${w}x${h}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  // Back to the Hub ends it.
  await over.locator('.ro-go .blade', { hasText: /back to hub/i }).click();
  await waitForScene(page, 'Hub');
  expect(errors).toEqual([]);
});

test('Phantom UI: a won run ends on the run record, then the credits roll as a Phantom page and lead back', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=phantom-end');
  await toPhantomMap(page);
  await endRun(page, true);
  // The game's own order: after a won final battle The Road Home plays first (as a Phantom event), then the results.
  await expect.poll(() => sceneNow(page), { timeout: 20_000 }).toMatch(/^(Event|GameOver)$/);
  for (let n = 0; n < 120 && (await sceneNow(page)) !== 'GameOver'; n++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  await waitForScene(page, 'GameOver');
  await onPage(page, 'GameOver', 'record');
  const rec = pview(page, 'GameOver', 'record');
  await expect(rec.locator('.hd')).toContainText('Run record', { ignoreCase: true });
  await expect(rec.locator('.rc-g .rc-s')).not.toHaveCount(0);
  await expect(rec.locator('.rc-g')).toContainText('Battles won', { ignoreCase: true });
  await expect(rec.locator('.rc-gr small')).toHaveText(/badges/i);
  await expect(rec.locator('.rc-mvp')).toContainText('Most valuable', { ignoreCase: true });
  await expect(rec.locator('.rc-new')).toContainText('What this run earned', { ignoreCase: true });
  await expect(rec.locator('.fn-st span.on')).toContainText('Run record', { ignoreCase: true });
  await expect(rec.locator('.ro-go .blade.on')).toContainText('Roll credits', { ignoreCase: true });
  await fit(page, 'GameOver', 'record');
  for (const [id, w, h] of SIZES) {
    await dress(page, id);
    await page.setViewportSize({ width: w, height: h });
    await page.keyboard.press('ArrowDown');
    await expect(page.locator(`#phx .phs[data-scene="GameOver"][data-scr="record"][data-liv="${id}"]`)).toBeVisible();
    await fit(page, 'GameOver', 'record', `${id} ${w}x${h}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await dress(page, 'phantom');

  // Roll credits: the roll moves, the team walks along the bottom, and Enter goes on.
  await rec.locator('.ro-go .blade', { hasText: /roll credits/i }).click();
  await waitForScene(page, 'Credits');
  await onPage(page, 'Credits', 'credits');
  const cr = pview(page, 'Credits', 'credits');
  await expect(cr.locator('.cr-roll h2').first()).not.toBeEmpty();
  await expect(cr.locator('.cr-walk span')).not.toHaveCount(0);
  await expect(cr.locator('.fn-st span.on')).toContainText('Credits', { ignoreCase: true });
  const at = () => cr.locator('.rx-roll').evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42);
  const y0 = await at();
  await page.waitForTimeout(1200);
  expect(await at()).toBeLessThan(y0);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'GameOver');
  expect(errors).toEqual([]);
});

test('Phantom UI: the asset credits stand still and scroll; a champion in the Hall of Fame opens as six banners', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&debug=1');
  await onPage(page, 'MainMenu', 'title');
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    pkr.game.scene.getScenes(true)[0].scene.start('Credits', { assets: true, from: 'MainMenu' });
  });
  await waitForScene(page, 'Credits');
  await onPage(page, 'Credits', 'credits');
  const cr = pview(page, 'Credits', 'credits');
  await expect(cr.locator('.cr-roll.still.wide')).toBeVisible();
  await expect(cr.locator('.cr-roll')).toContainText('Asset credits', { ignoreCase: true });
  await expect(cr.locator('.fn-st')).toHaveCount(0);
  await page.waitForTimeout(600);
  const top = () => cr.locator('.cr-roll').evaluate((el) => el.scrollTop);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  expect(await top()).toBeGreaterThan(0);

  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const mk = (speciesId: string, level: number, shiny = false) => ({ speciesId, level, shiny });
    const run = { runId: 'r128', endedAt: '2026-11-10T12:00:00Z', seed: 'r128', archetypeId: 'red', campaignId: 'full', victory: true, regionsCleared: 1, regions: 1, badges: 8, encounters: 128, defeatedBy: null, party: [mk('charizard', 52), mk('lucario', 50), mk('gengar', 51), mk('gyarados', 49, true), mk('garchomp', 50), mk('pikachu', 48)], bankCredits: 0, researchPoints: 0, achievements: [], moments: [], journal: [], epitaph: null, legacy: [{ speciesId: 'charizard', level: 52, shiny: false, titles: ['The Ace'], tags: [], signature: null, mentor: null, records: [] }] };
    pkr.session.changeProfile((p: any) => ({ ...p, runHistory: [run] }));
    for (const s of pkr.game.scene.getScenes(true)) pkr.game.scene.stop(s.scene.key);
    pkr.game.scene.start('HallOfFame');
  });
  await waitForScene(page, 'HallOfFame');
  await page.waitForTimeout(600);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await onPage(page, 'HallOfFame', 'hall');
  const hall = page.locator('#phx .phs[data-scene="HallOfFame"][data-scr="hall"]');
  await expect(hall.locator('.hf-t .rs')).toHaveAttribute('aria-label', 'HALL OF FAME');
  await expect(hall.locator('.hf-b')).toHaveCount(6);
  await expect(hall.locator('.hf-b.on')).toContainText('Charizard');
  await expect(hall.locator('.hf-b.on small')).toHaveText(/the ace/i);
  await expect(hall.locator('.hf-b').nth(3)).toContainText('Shiny');
  await expect(hall.locator('.hf-cap b')).toContainText('Champion Red', { ignoreCase: true });
  await expect(hall.locator('.hf-cap span')).toContainText('8 badges', { ignoreCase: true });
  await page.keyboard.press('ArrowRight');
  await expect(hall.locator('.hf-b.on')).toContainText('Lucario');
  await fit(page, 'HallOfFame', 'hall');
  for (const [id, w, h] of SIZES) {
    await dress(page, id);
    await page.setViewportSize({ width: w, height: h });
    await page.keyboard.press('ArrowRight');
    await expect(page.locator(`#phx .phs[data-scene="HallOfFame"][data-scr="hall"][data-liv="${id}"]`)).toBeVisible();
    await fit(page, 'HallOfFame', 'hall', `${id} ${w}x${h}`);
  }
  await page.keyboard.press('Escape');
  await expect(hall).toHaveCount(0);
  expect(await sceneNow(page)).toBe('HallOfFame');
  expect(errors).toEqual([]);
});

test('Phantom UI: a Legendary blessing opens beat by beat on the Phantom page; C reads the list of blessings; accepting goes on to the briefing', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  // legends=1: an automated browser gets the players' defaults, where blessings are on.
  await start(page, 'ui=phantom&legends=1&seed=phantom-bless');
  for (let n = 0; n < 40 && !['Blessing', 'Map'].includes(await sceneNow(page)); n++) {
    // The starter's Enter is the one that leads here: give its fade time, so no press lands on the blessing itself.
    const slow = (await sceneNow(page)) === 'StarterSelect';
    await page.keyboard.press('Enter');
    await page.waitForTimeout(slow ? 1800 : 700);
  }
  await waitForScene(page, 'Blessing');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.expansion.blessing.seen)).toBe(false);
  await onPage(page, 'Blessing', 'blessing');
  const bl = pview(page, 'Blessing', 'blessing');
  // The opening has not shown everything yet: the key says so, and the first Enter shows it all.
  await expect(bl.locator('.keys')).toContainText('Show all', { ignoreCase: true });
  await expect(bl.locator('.ph-bl-wait')).not.toHaveCount(0);
  await page.waitForTimeout(400);
  await page.keyboard.press('Enter');
  await expect(bl.locator('.ph-bl-wait')).toHaveCount(0);
  await expect(bl.locator('.keys')).toContainText('Accept', { ignoreCase: true });
  await expect(bl.locator('.bl-t .rs')).toHaveAttribute('aria-label', 'BLESSING');
  await expect(bl.locator('.bl-card .lab')).toContainText('Blessing', { ignoreCase: true });
  await expect(bl.locator('.bl-card h3')).not.toBeEmpty();
  await expect(bl.locator('.bl-say')).toContainText('has blessed your journey');
  // Kice's rule: nothing stands under it and no light falls on it.
  await expect(bl.locator('[class*="podium"], [class*="spot"]')).toHaveCount(0);
  await fit(page, 'Blessing', 'blessing');

  // C: the Reliquary as a list; the arrows turn its pages; C shuts it.
  await page.keyboard.press('c');
  const book = bl.locator('.ph-bl-book');
  await expect(book).toBeVisible();
  await expect(book.locator('.lab')).toContainText(/\d+ of \d+ found/i);
  await expect(book.locator('.ph-bl-row.mine')).toHaveCount(1);
  await fit(page, 'Blessing', 'blessing', 'book');
  const pageNo = async () => (await book.locator('.ph-sheet-k').textContent()) ?? '';
  const first = await pageNo();
  await page.keyboard.press('ArrowRight');
  await expect.poll(pageNo).not.toBe(first);
  // Enter with the list open only shuts the list.
  await page.keyboard.press('Enter');
  await expect(book).toHaveCount(0);
  expect(await sceneNow(page)).toBe('Blessing');

  for (const [id, w, h] of SIZES) {
    await dress(page, id);
    await page.setViewportSize({ width: w, height: h });
    await page.keyboard.press('c');
    await expect(page.locator(`#phx .phs[data-scene="Blessing"][data-scr="blessing"][data-liv="${id}"] .ph-bl-book`)).toBeVisible();
    await fit(page, 'Blessing', 'blessing', `book ${id} ${w}x${h}`);
    await page.keyboard.press('c');
    await expect(book).toHaveCount(0);
    await fit(page, 'Blessing', 'blessing', `${id} ${w}x${h}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  // Accept (a Vow is sworn first when the blessing asks for one).
  for (let n = 0; n < 3 && (await sceneNow(page)) === 'Blessing'; n++) { await page.keyboard.press('Enter'); await page.waitForTimeout(500); }
  await waitForScene(page, 'Briefing');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.expansion.blessing.seen)).toBe(true);
  expect(errors).toEqual([]);
});

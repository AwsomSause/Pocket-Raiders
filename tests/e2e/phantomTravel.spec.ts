import { expect, test, type Page } from '@playwright/test';
import { start, toCommands, waitForScene, watch } from './helpers/newUi';
import { fitProblems, onPage, pview, toPhantomMap } from './helpers/phantomUi';

// Phantom UI: moving on. The Regional forms page when the party arrives in a region that has a form for one of them
// (the game's own offer: one for each Pokémon in each region), and the Next region page after a region's Champion.

const SIZES = [['midnight', 844, 390], ['fantasia', 700, 900], ['velvet', 1920, 1080], ['channel', 1280, 720]] as const;
const dress = (page: Page, id: string) => page.evaluate((id) => { const pkr = (window as any).__pkr; pkr.session.saveSettings({ ...pkr.session.settings, phantomVersion: id }); }, id);
const fit = async (page: Page, key: string, id: string, note = '') => { await page.waitForTimeout(900); expect(await fitProblems(page, key, id), `${id} ${note}`).toEqual([]); };

test('Phantom UI: a regional form is offered on the Regional forms page; "Not now" keeps the Pokémon, "Yes" changes it', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=phantom-forms');
  await toPhantomMap(page);
  // Two of the same Pokémon stand in a region that has a form for them, so the page is asked twice.
  const set = await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const run = session.run, content = session.content;
    const form = [...content.species.values()].find((s: any) => s.form?.kind === 'regional' && s.form.region && content.regions.has(s.form.region) && content.species.has(s.form.base) && !content.species.get(s.form.base).form) as any;
    run.regionOrder[run.regionIndex] = form.form.region;
    run.party[0].speciesId = form.form.base;
    const twin = structuredClone(run.party[0]);
    twin.uid = 'ph-form-twin';
    run.party.push(twin);
    const offers = session.regionFormOffers();
    game.scene.getScene('Map').scene.restart();
    return { base: content.species.get(form.form.base).name as string, baseId: form.form.base as string, offers: offers.length as number, targets: offers[0]?.targets as string[], region: content.regions.get(form.form.region).name as string };
  });
  expect(set.offers).toBe(2);
  await onPage(page, 'Map', 'forms');
  const forms = pview(page, 'Map', 'forms');
  await expect(forms.locator('.hd')).toContainText('Regional forms', { ignoreCase: true });
  await expect(forms.locator('.hd small')).toContainText(set.region, { ignoreCase: true });
  await expect(forms.locator('.fm-q')).toContainText(set.base);
  await expect(forms.locator('.fm-c')).toHaveCount(Math.min(3, set.targets.length));
  await expect(forms.locator('.fm-ch .ch')).toHaveCount(set.targets.length + 1);
  await expect(forms.locator('.fm-ch .ch.on')).toHaveCount(1);
  await expect(forms.locator('.fm-ch .ch').last()).toContainText('Not now');
  await expect(forms.locator('.fm-n')).toContainText('1 more of your party is asked after this.');
  await fit(page, 'Map', 'forms');
  // The arrows move between the answers.
  await page.keyboard.press('ArrowRight');
  await expect(forms.locator('.fm-ch .ch').nth(1)).toHaveClass(/\bon\b/);
  await page.keyboard.press('ArrowLeft');
  await expect(forms.locator('.fm-ch .ch').first()).toHaveClass(/\bon\b/);
  for (const [id, w, h] of SIZES) {
    await dress(page, id);
    await page.setViewportSize({ width: w, height: h });
    await page.keyboard.press('ArrowRight');
    await expect(page.locator(`#phx .phs[data-scene="Map"][data-scr="forms"][data-liv="${id}"]`)).toBeVisible();
    await fit(page, 'Map', 'forms', `${id} ${w}x${h}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await dress(page, 'phantom');
  // Esc is "Not now": the first one stays as it is, and the page asks about the second.
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.session.regionFormOffers().length)).toBe(1);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.party[0].speciesId)).toBe(set.baseId);
  await onPage(page, 'Map', 'forms');
  await expect(forms.locator('.fm-n')).not.toContainText('asked after this');
  // "Yes" (a click) changes the second one, and the map comes back.
  await forms.locator('.fm-ch .ch').first().click();
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.session.regionFormOffers().length)).toBe(0);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.party[1].speciesId)).toBe(set.targets[0]);
  await onPage(page, 'Map', 'map');
  await expect(page.locator('#phx .phs[data-scene="Map"][data-scr="forms"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Phantom UI: after a region\'s Champion the Next region page shows the run\'s ticket and waits for a key', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=phantom-travel');
  await toPhantomMap(page);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  await onPage(page, 'Battle', 'battle');
  await toCommands(page);
  const set = await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const run = session.run, content = session.content;
    const s = game.scene.getScene('Battle');
    (window as any).__travel = 'open';
    void s.phTravelCard(run, run.regionOrder[0]).then((shown: boolean) => { (window as any).__travel = shown ? 'closed' : 'not shown'; });
    return { next: content.regions.get(run.regionOrder[1]).name as string, first: content.regions.get(run.regionOrder[0]).name as string, regions: run.regionOrder.length as number };
  });
  expect(set.regions).toBeGreaterThan(1);
  await onPage(page, 'Battle', 'travel');
  const tv = pview(page, 'Battle', 'travel');
  await expect(tv.locator('.hd')).toContainText('Next region', { ignoreCase: true });
  await expect(tv.locator('.hd small')).toContainText('Region 2', { ignoreCase: true });
  await expect(tv.locator('.tv-t')).toHaveCount(1);
  await expect(tv.locator('.tv-t b')).toHaveText(set.next, { ignoreCase: true });
  await expect(tv.locator('.tv-way span.d').first()).toHaveText(set.first, { ignoreCase: true });
  await expect(tv.locator('.tv-way span.on')).toHaveText(set.next, { ignoreCase: true });
  await expect(tv.locator('.tv-next')).toContainText('What changes in region 2', { ignoreCase: true });
  await expect(tv.locator('.tv-next .dm-fr')).toHaveCount(4);
  await expect(tv.locator('.tv-next')).toContainText('Level cap', { ignoreCase: true });
  await fit(page, 'Battle', 'travel');
  for (const [id, w, h] of SIZES) {
    await dress(page, id);
    await page.setViewportSize({ width: w, height: h });
    // The card is drawn once; ask it to draw again in its new version.
    await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').phMomentView.refresh());
    await expect(page.locator(`#phx .phs[data-scene="Battle"][data-scr="travel"][data-liv="${id}"]`)).toBeVisible();
    await fit(page, 'Battle', 'travel', `${id} ${w}x${h}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  // It waits for the player, however long; one key moves on.
  await page.waitForTimeout(3200);
  expect(await page.evaluate(() => (window as any).__travel)).toBe('open');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => (window as any).__travel)).toBe('closed');
  await expect(page.locator('#phx .phs[data-scene="Battle"][data-scr="travel"]')).toHaveCount(0);
  // The last region has no ticket: the card is not shown and the game's own line is said instead.
  expect(await page.evaluate(async () => { const { session, game } = (window as any).__pkr; const run = session.run; return game.scene.getScene('Battle').phTravelCard(run, run.regionOrder[run.regionOrder.length - 1]); })).toBe(false);
  expect(errors).toEqual([]);
});

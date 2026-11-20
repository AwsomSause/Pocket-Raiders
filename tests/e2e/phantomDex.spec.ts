import { expect, test, type Page } from '@playwright/test';
import { start, watch } from './helpers/newUi';
import { fitProblems, onPage, pview, toPhantomMap } from './helpers/phantomUi';

// The Phantom UI's Pokédex of the pause menu (a menu the game did not have): the wall of a set with the picked
// species on its card, an entry, and the type chart. It only reads; the run is the same after it.

const fits = async (page: Page, key: string, id: string) => { await page.waitForTimeout(900); expect(await fitProblems(page, key, id)).toEqual([]); };
const version = (page: Page, id: string) => page.evaluate((id) => { const s = (window as any).__pkr.session; s.saveSettings({ ...s.settings, phantomVersion: id }); }, id);
const runNow = (page: Page) => page.evaluate(() => JSON.stringify((window as any).__pkr.session.run));

test('Phantom UI: the pause menu has a Pokédex: the list, an entry and the type chart, and the run is untouched', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=phantom-dex');
  await onPage(page, 'MainMenu', 'title');
  await toPhantomMap(page);
  await onPage(page, 'Map', 'map');
  // A profile that has caught the lead and met its neighbours in the list (a fresh one has met nothing).
  const lead = await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    const sp = s.content.species.get(s.run.party[0].speciesId);
    const near = [...s.content.species.values()].filter((x: any) => !x.form && x.generation === sp.generation && Math.abs(x.dex - sp.dex) <= 3).map((x: any) => x.id as string);
    s.profile.speciesSeen = [...new Set([...s.profile.speciesSeen, ...near])];
    s.profile.speciesCaught = [...new Set([...s.profile.speciesCaught, sp.id])];
    return sp.name as string;
  });
  const before = await runNow(page);
  await page.keyboard.press('Escape');
  await onPage(page, 'Map', 'pause');
  const pause = pview(page, 'Map', 'pause');
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
  await expect(pause.locator('.hub .h.on')).toHaveText('Pokédex');
  await page.keyboard.press('Enter');
  await onPage(page, 'Map', 'dex');
  const dex = pview(page, 'Map', 'dex');
  // It opens on the lead's own page of its set.
  await expect(dex.locator('.dx.on')).toHaveCount(1);
  await expect(dex.locator('.dexcard h3')).toHaveText(lead, { ignoreCase: true });
  await expect(dex.locator('.dexcard')).toContainText('MASTERY');
  await expect(dex.locator('.dexcount')).toContainText('SEEN');
  await expect(dex.locator('.dexcount')).toContainText('CAUGHT');
  await fits(page, 'Map', 'dex');
  // The arrows move the cursor; the card follows.
  const first = Number((await dex.locator('.dx.on').getAttribute('data-key'))!.slice(1));
  const cursor = () => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').rxPause.dex.index as number);
  expect(await cursor()).toBe(first);
  await page.keyboard.press('ArrowRight');
  await expect(dex.locator('.dx.on')).toHaveAttribute('data-key', `c${first + 1}`);
  expect(await cursor()).toBe(first + 1);
  await page.waitForTimeout(250);
  await page.keyboard.press('ArrowLeft');
  await expect(dex.locator('.dx.on')).toHaveAttribute('data-key', `c${first}`);
  expect(await cursor()).toBe(first);
  await page.waitForTimeout(250);
  // Q and E turn the set; C changes the filter and comes round again.
  const set = await dex.locator('.hd small').textContent() ?? "";
  await page.keyboard.press('e');
  await expect(dex.locator('.hd small')).not.toHaveText(set);
  await fits(page, 'Map', 'dex');
  await page.keyboard.press('q');
  await expect(dex.locator('.hd small')).toHaveText(set);
  await page.keyboard.press('c');
  await expect(dex.locator('.hd small')).toContainText('Seen', { ignoreCase: true });
  await expect(dex.locator('.dexcard h3')).not.toHaveText('???');
  for (let i = 0; i < 2; i++) { await page.keyboard.press('c'); await page.waitForTimeout(250); }
  await expect(dex.locator('.hd small')).toContainText('Mastered', { ignoreCase: true });
  await fits(page, 'Map', 'dex');
  await page.keyboard.press('c');
  await expect(dex.locator('.hd small')).toContainText('All', { ignoreCase: true });
  // The pointer over a cell picks it; a click on the picked cell opens its entry.
  const cell = dex.locator('.dx').nth(1);
  await cell.hover();
  await expect(cell).toHaveClass(/\bon\b/);
  await page.waitForTimeout(250);
  await cell.click();
  await onPage(page, 'Map', 'dexentry');
  const entry = pview(page, 'Map', 'dexentry');
  await expect(entry.locator('.keys')).toContainText('Type chart', { ignoreCase: true });
  await expect(entry.locator('.keys')).toContainText('Next entry', { ignoreCase: true });
  await fits(page, 'Map', 'dexentry');
  const name = await entry.locator('.hd').textContent() ?? "";
  await page.keyboard.press('ArrowRight');
  await expect(entry.locator('.hd')).not.toHaveText(name);
  await page.keyboard.press('ArrowLeft');
  await expect(entry.locator('.hd')).toHaveText(name);
  // Q opens the type chart from an entry; the arrows pick a type; X goes back to the entry, then to the list.
  await page.keyboard.press('q');
  await onPage(page, 'Map', 'types');
  const types = pview(page, 'Map', 'types');
  await expect(types.locator('.tc-t')).toHaveCount(18);
  await expect(types.locator('.tc-t.on')).toHaveCount(1);
  await expect(types.locator('.tc-p')).toHaveCount(2);
  await types.locator('.tc-t', { hasText: /^fire$/i }).click();
  await expect(types.locator('.tc-t.on')).toHaveText('fire', { ignoreCase: true });
  await expect(types.locator('.tc-p').first()).toContainText('Fire attacks', { ignoreCase: true });
  await expect(types.locator('.tc-p').first().locator('.tc-r').first()).toContainText('GRASS');
  await expect(types.locator('.tc-p').nth(1).locator('.tc-r').first()).toContainText('WATER');
  await fits(page, 'Map', 'types');
  await page.keyboard.press('ArrowRight');
  await expect(types.locator('.tc-t.on')).toHaveText('water', { ignoreCase: true });
  await page.keyboard.press('ArrowDown');
  await expect(types.locator('.tc-t.on')).toHaveText('ice', { ignoreCase: true });
  for (const [id, w, h] of [['midnight', 844, 390], ['channel', 1920, 1080], ['fantasia', 700, 900], ['velvet', 1280, 720]] as const) {
    await version(page, id);
    await page.setViewportSize({ width: w, height: h });
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowDown');
    await expect(page.locator(`#phx .phs[data-scene="Map"][data-scr="types"][data-liv="${id}"]`)).toBeVisible();
    await fits(page, 'Map', 'types');
    await page.keyboard.press('Escape');
    await onPage(page, 'Map', 'dexentry');
    await fits(page, 'Map', 'dexentry');
    await page.keyboard.press('Escape');
    await onPage(page, 'Map', 'dex');
    await fits(page, 'Map', 'dex');
    // T opens the chart from the list too, and Enter opens the entry again.
    await page.keyboard.press('t');
    await onPage(page, 'Map', 'types');
    await page.keyboard.press('Escape');
    await onPage(page, 'Map', 'dex');
    await page.keyboard.press('Enter');
    await onPage(page, 'Map', 'dexentry');
    await page.keyboard.press('q');
    await onPage(page, 'Map', 'types');
  }
  await version(page, 'phantom');
  await page.keyboard.press('Escape');
  await onPage(page, 'Map', 'dexentry');
  await page.keyboard.press('Escape');
  await onPage(page, 'Map', 'dex');
  await page.keyboard.press('Escape');
  await onPage(page, 'Map', 'pause');
  await expect(pause.locator('.hub .h.on')).toHaveText('Pokédex');
  await page.keyboard.press('Escape');
  await onPage(page, 'Map', 'map');
  // It only read: the run is the same, and the map's own C key works again.
  expect(await runNow(page)).toBe(before);
  expect(errors).toEqual([]);
});

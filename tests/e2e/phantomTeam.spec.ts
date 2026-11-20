import { expect, test, type Page } from '@playwright/test';
import { open, start, waitForScene, watch } from './helpers/newUi';
import { fitProblems, onPage, pview, toPhantomMap } from './helpers/phantomUi';

// The Phantom UI, slice 3: the pages around the team and the town. Party, Summary (every tab and the action menu),
// Bag and PC from a run's map; the town dock and a Pokédex entry from the hub. Every page is checked for text that
// is cut off or off the screen, after its parts have finished sliding in.

/** Title to the stage map by the keys, then a team of four (one hurt, one fainted), a full PC and a trainer who has one. */
async function toMapWithTeam(page: Page) {
  await toPhantomMap(page);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr, run = pkr.session.run, lead = run.party[0];
    const copy = (id: string, level: number) => ({ ...JSON.parse(JSON.stringify(lead)), uid: id, id, level });
    run.party.push(copy('p1', 6), copy('p2', 7), copy('p3', 8));
    run.party[1].hp = 3;
    run.party[2].hp = 0;
    for (let k = 0; k < 5; k++) run.box.push(copy(`b${k}`, 9 + k));
    run.archetypeId = 'bill';
    pkr.game.scene.getScene('Map').scene.restart();
  });
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
  await page.waitForTimeout(400);
}
/** Presses a button of the Phantom map's bar. */
const mapButton = (page: Page, label: string) =>
  page.evaluate((label) => { ([...document.querySelectorAll('#phx .phs[data-scene="Map"][data-scr="map"] .ph-mbar [data-act]')].find((e) => e.textContent!.trim() === label) as HTMLElement).click(); }, label);
const fits = async (page: Page, key: string, id?: string) => { await page.waitForTimeout(900); expect(await fitProblems(page, key, id)).toEqual([]); };

test('Phantom UI: Party, Summary, Bag and PC of a run are Phantom pages', async ({ page }) => {
  // A long walk through four pages; GitHub's runners take about twice as long as a local run (2 min there).
  test.setTimeout(240_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=phantom-team');
  await onPage(page, 'MainMenu', 'title');
  await toMapWithTeam(page);

  // Party: a card per Pokémon, two wide; the side card follows the cursor.
  await mapButton(page, 'Party');
  await onPage(page, 'Map', 'party');
  // The page over the map (the map's own page stays under it).
  const map = page.locator('#phx .phs[data-scene="Map"]:not([data-scr="map"])');
  await expect(map.locator('.pc')).toHaveCount(4);
  await expect(map.locator('.pc.on')).toHaveCount(1);
  await expect(map.locator('.pc .stamp')).toHaveText('Fainted');
  await expect(map.locator('.ph-pside .dm-fr').first()).toContainText('Ability');
  await fits(page, 'Map', 'party');
  await page.keyboard.press('ArrowDown');
  await expect(map.locator('.pc').nth(2)).toHaveClass(/\bon\b/);
  await map.locator('.pc').nth(1).hover();
  await expect(map.locator('.pc').nth(1)).toHaveClass(/\bon\b/);
  await page.keyboard.press('ArrowLeft');
  await expect(map.locator('.pc').nth(0)).toHaveClass(/\bon\b/);
  await page.waitForTimeout(250);

  // Summary: every tab draws and fits; the stats tab has the six-point chart.
  await page.keyboard.press('Enter');
  await onPage(page, 'Map', 'summary');
  const tabs = await map.locator('.ph-sm-tabs span').count();
  expect(tabs).toBeGreaterThanOrEqual(5);
  for (let k = 0; k < tabs; k++) {
    await expect(map.locator('.ph-sm-tabs span').nth(k)).toHaveClass(/\bon\b/);
    await fits(page, 'Map', 'summary');
    if (k === 1) await expect(map.locator('.radar polygon.val')).toHaveCount(1);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
  }
  // The action menu opens over the page; Esc closes it, then the Summary, then the Party.
  await map.locator('.ph-sm-tabs span').first().click();
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await expect(map.locator('.ph-smenu .blade.on')).toHaveCount(1);
  await fits(page, 'Map', 'summary');
  await page.keyboard.press('Escape');
  await expect(map.locator('.ph-smenu')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await onPage(page, 'Map', 'party');
  await page.keyboard.press('Escape');
  await expect(page.locator('#phx .phs[data-scene="Map"][data-scr="party"]')).toHaveCount(0);
  await page.waitForTimeout(300);

  // Bag: pockets, the list, the card and who the lit item would help.
  await mapButton(page, 'Bag');
  await onPage(page, 'Map', 'bag');
  await expect(map.locator('.pockets span.on')).toHaveCount(1);
  await expect(map.locator('.it.on')).toHaveCount(1);
  await expect(map.locator('.useon .u')).toHaveCount(4);
  const first = await map.locator('.idet h3').innerText();
  await fits(page, 'Map', 'bag');
  await page.keyboard.press('ArrowDown');
  await expect(map.locator('.idet h3')).not.toHaveText(first);
  await fits(page, 'Map', 'bag');
  await page.keyboard.press('ArrowRight');
  await expect(map.locator('.pockets span').nth(1)).toHaveClass(/\bon\b/);
  await fits(page, 'Map', 'bag');
  await page.keyboard.press('Escape');
  await expect(page.locator('#phx .phs[data-scene="Map"][data-scr="bag"]')).toHaveCount(0);
  await page.waitForTimeout(300);

  // PC: the party down the side, a slot per place, and the lit Pokémon's card.
  await mapButton(page, 'PC');
  await onPage(page, 'Map', 'box');
  await expect(map.locator('.bx-party .bxc')).toHaveCount(4);
  await expect(map.locator('.bx .bxc.on')).toHaveCount(1);
  await expect(map.locator('.bx-d .blade.on')).toHaveText('Move to party');
  // The lit Pokémon's other buttons: its Summary, and a held item for it (none is free in the Bag yet).
  await expect(map.locator('.bx-d .ph-bx-x')).toHaveCount(2);
  await expect(map.locator('.bx-d .ph-bx-x').nth(0)).toContainText('Summary');
  await expect(map.locator('.bx-d .ph-bx-x').nth(1)).toHaveClass(/\boff\b/);
  await fits(page, 'Map', 'box');
  await map.locator('.bx .bxc.e').first().hover();
  await expect(map.locator('.bx-d .blade.on')).toHaveText('Put one here');
  await expect(map.locator('.bx-d .ph-bx-x')).toHaveCount(0);
  await fits(page, 'Map', 'box');

  // Summary (I): the game's own Summary, reading the PC's Pokémon. It only reads; Esc goes back to the same slot.
  await map.locator('.bx .bxc').nth(1).hover();
  await expect(map.locator('.bx .bxc').nth(1)).toHaveClass(/\bon\b/);
  await page.waitForTimeout(250);
  await page.keyboard.press('i');
  await onPage(page, 'Map', 'summary');
  await expect(map.locator('.sm-lv')).toContainText('10');
  await fits(page, 'Map', 'summary');
  await page.keyboard.press('ArrowDown');
  await expect(map.locator('.sm-lv')).toContainText('11');
  await page.keyboard.press('Enter');
  await expect(map.locator('.ph-smenu')).toHaveCount(0);
  await onPage(page, 'Map', 'box');
  await expect(map.locator('.bx .bxc').nth(2)).toHaveClass(/\bon\b/);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.box.length)).toBe(5);
  await page.keyboard.press('Escape');
  await expect(page.locator('#phx .phs[data-scene="Map"][data-scr="box"]')).toHaveCount(0);

  // Give item (G): a held item waiting in the Bag goes to the lit PC Pokémon.
  await page.evaluate(() => { (window as any).__pkr.session.run.looseHeld = { charcoal: 1 }; });
  await page.waitForTimeout(300);
  await mapButton(page, 'PC');
  await onPage(page, 'Map', 'box');
  await expect(map.locator('.bx-d .ph-bx-x').nth(1)).not.toHaveClass(/\boff\b/);
  await page.waitForTimeout(250);
  await page.keyboard.press('g');
  await onPage(page, 'Map', 'list');
  await expect(map).toContainText('Charcoal');
  await fits(page, 'Map', 'list');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => { const r = (window as any).__pkr.session.run; return [r.box[0].held?.charcoal ?? 0, r.looseHeld?.charcoal ?? 0, r.box.length]; })).toEqual([1, 0, 5]);
  expect(errors).toEqual([]);
});

test('Phantom UI: the town dock and a Pokédex entry are Phantom pages, in every version and at several sizes', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await start(page, 'ui=phantom');
  await onPage(page, 'MainMenu', 'title');
  await page.evaluate(() => { const p = (window as any).__pkr.session.profile; p.speciesSeen.push('dratini', 'dragonite'); p.speciesCaught.push('dragonite'); });
  await open(page, 'Hub');
  await waitForScene(page, 'Hub');
  await onPage(page, 'Hub', 'dock');
  const hub = pview(page, 'Hub', 'dock'), entry = pview(page, 'Hub', 'dexentry');
  await expect(hub.locator('.hub .h.on')).toHaveCount(1);
  await expect(hub.locator('.facts span').first()).toContainText('MONEY');
  await fits(page, 'Hub', 'dock');
  // Up and Down move down the words, Left and Right change the tab; the mouse lights a word too.
  const lit = await hub.locator('.hub .h.on').innerText();
  await page.keyboard.press('ArrowDown');
  await expect(hub.locator('.hub .h.on')).not.toHaveText(lit);
  await page.keyboard.press('ArrowRight');
  await expect(hub.locator('.pockets span').nth(1)).toHaveClass(/\bon\b/);
  await fits(page, 'Hub', 'dock');
  await page.keyboard.press('ArrowLeft');
  await hub.locator('.hub .h').first().hover();
  await expect(hub.locator('.hub .h').first()).toHaveClass(/\bon\b/);

  // A Pokédex entry: caught, met only, and not met yet.
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Hub').openDexSet({ id: 'x', name: 'Dragons', members: ['dragonite', 'dratini', 'dragonair'] }));
  await onPage(page, 'Hub', 'list');
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await onPage(page, 'Hub', 'dexentry');
  await expect(entry.locator('.hd')).toContainText('Dragonite');
  await expect(entry.locator('.ph-de-stats > div')).toHaveCount(6);
  await expect(entry.locator('.de-line > i')).toHaveCount(3);
  await fits(page, 'Hub', 'dexentry');
  await page.keyboard.press('ArrowRight');
  await expect(entry.locator('.ph-de-mv')).toContainText('Level-up moves');
  await fits(page, 'Hub', 'dexentry');
  for (const [id, w, h] of [['midnight', 844, 390], ['channel', 1920, 1080], ['fantasia', 700, 900], ['velvet', 1280, 720]] as const) {
    await page.evaluate((id) => { const s = (window as any).__pkr.session; s.saveSettings({ ...s.settings, phantomVersion: id }); }, id);
    await page.setViewportSize({ width: w, height: h });
    await page.keyboard.press('ArrowRight');
    await expect(page.locator(`#phx .phs[data-scene="Hub"][data-scr="dexentry"][data-liv="${id}"]`)).toBeVisible();
    await fits(page, 'Hub', 'dexentry');
  }
  await page.keyboard.press('Escape');
  await onPage(page, 'Hub', 'list');
  await page.waitForTimeout(250);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await onPage(page, 'Hub', 'dexentry');
  await expect(entry.locator('.hd')).toContainText('???');
  await fits(page, 'Hub', 'dexentry');
  expect(errors).toEqual([]);
});

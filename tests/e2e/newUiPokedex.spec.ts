import { expect, test } from '@playwright/test';
import { view, watch, start, open } from './helpers/newUi';

// The New UI's Pokédex (mock-up pieces "Pokédex: set browser" and "Pokédex: species info"): a wall of species
// pictures with filter tabs, and the species page with its stat bars and evolution line.

test('New UI: a Pokédex set is a wall of species pictures with filter tabs, and a species opens the mock-up species page (facts, six stat bars, evolution line, a second page of data)', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-dex');
  await open(page, 'Hub');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const seen = ['bulbasaur', 'ivysaur', 'charmander', 'charmeleon', 'charizard', 'squirtle', 'pikachu', 'gengar', 'eevee', 'snorlax'];
    const caught = ['bulbasaur', 'charmander', 'charizard', 'pikachu', 'gengar'];
    pkr.session.changeProfile((q: any) => ({ ...q, speciesSeen: seen, speciesCaught: caught, dexResearch: { charizard: { seen: 74, caught: 4 }, bulbasaur: { seen: 3, caught: 1 } } }));
    pkr.game.scene.getScene('Hub').enter('research');
  });
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  const set = () => page.locator('#rx .stage[data-scene="Hub"]', { has: page.locator('.tabs') }).last();
  await expect(set().locator('.hd')).toContainText('Pokédex');

  // The wall: 18 cells, pictures for the species met, "?" for the rest, and no "Tab:" cell.
  const cells = () => set().locator('.cell[data-act="pick"]');
  await expect(cells()).toHaveCount(18);
  await expect(set()).not.toContainText('Tab:');
  await expect(cells().nth(0).locator('i.an')).toHaveCount(1);
  await expect(cells().nth(0)).toHaveClass(/sel/);
  await expect(cells().nth(2)).toHaveClass(/off/);
  await expect(cells().nth(2)).toContainText('?');
  await expect(cells().nth(5).locator('i.an')).toHaveCount(1);
  const detail = set().locator('.win').first();
  await expect(detail).toContainText('Bulbasaur');
  await expect(detail).toContainText('No. 0001 · Seen 3 · Caught 1');
  const found = set().locator('.win').nth(1);
  await expect(found).toContainText('Found');
  await expect(found.locator('b')).toHaveText('10');
  await expect(set().locator('.tabs .on')).toHaveText('All');
  await page.screenshot({ path: 'test-results/newui-dex-set.png' });

  // Tabs: a click, and Left from the first column, switch the filter.
  await set().locator('.tabs span', { hasText: 'Owned' }).click();
  await expect(set().locator('.tabs .on')).toHaveText('Owned');
  await expect(cells()).toHaveCount(5);
  await expect(set().locator('.cell.off[data-act="pick"]')).toHaveCount(0);
  await page.waitForTimeout(250);
  await page.keyboard.press('ArrowLeft');
  await expect(set().locator('.tabs .on')).toHaveText('Seen');
  await expect(cells()).toHaveCount(10);
  // Mastered is empty here: the page says so and the tabs stay.
  await set().locator('.tabs span', { hasText: 'Mastered' }).click();
  await expect(set().locator('.tabs .on')).toHaveText('Mastered');
  await expect(cells()).toHaveCount(0);
  await expect(set()).toContainText('Nothing here yet');
  await set().locator('.tabs span', { hasText: 'All' }).click();
  await expect(cells()).toHaveCount(18);

  // Charizard's page.
  await page.waitForTimeout(250);
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  await expect(detail).toContainText('Charizard');
  await page.keyboard.press('Enter');
  const info = () => page.locator('#rx .stage[data-scene="Hub"]', { has: page.locator('[data-act="flip"]') });
  await expect(info()).toHaveCount(1);
  const card = info().locator('.win').first();
  for (const t of ['Charizard', 'No. 0006', 'Fire', 'Flying', 'Height', '1.7 m', 'Weight', '90.5 kg', 'Caught', '4', 'Battles', '74']) await expect(card).toContainText(t);
  await expect(card.locator('i.an')).toHaveCount(1);
  await expect(info().locator('.hp.gold')).toHaveCount(6);
  await expect(info()).toContainText('You have caught this Pokémon.');
  await expect(info()).toContainText('Research level');
  await expect(info()).toContainText('Final form');
  // Charmander, Charmeleon, Charizard: three pictures in the line, none a shadow (all three are met).
  const line = info().locator('.win').nth(3);
  await expect(line.locator('i.an')).toHaveCount(3);
  await expect(line.locator('i.an.sil')).toHaveCount(0);
  // The old canvas page is not drawn under it.
  expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Hub').children.getByName('dex-info')?.list.length ?? -1)).toBe(0);
  await page.screenshot({ path: 'test-results/newui-dex-species.png' });

  // The second page and back.
  await page.keyboard.press('ArrowRight');
  for (const t of ['Abilities', 'Blaze', 'Hidden ability', 'Solar Power', '87.5% male, 12.5% female', 'Level-up moves', 'Ember']) await expect(info()).toContainText(t);
  await expect(info().locator('.hp.gold')).toHaveCount(0);
  await page.keyboard.press('ArrowLeft');
  await expect(info().locator('.hp.gold')).toHaveCount(6);
  await page.keyboard.press('Escape');
  await expect(info()).toHaveCount(0);
  await expect(detail).toContainText('Charizard');

  // A species not met yet gives nothing away; Venusaur is in the line of a met one, so the line shows its shadow.
  await page.waitForTimeout(250);
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowLeft');
  await expect(detail).toContainText('No. 0003');
  await expect(detail).toContainText('Not met yet.');
  await page.keyboard.press('Enter');
  const hidden = page.locator('#rx .stage[data-scene="Hub"]').last();
  await expect(hidden.locator('.hd')).toHaveText(/Pokédex/);
  await expect(hidden).toContainText('???');
  await expect(hidden).toContainText('Not met yet');
  await expect(hidden).not.toContainText('Venusaur');
  await expect(hidden.locator('.hp.gold')).toHaveCount(0);
  await expect(hidden.locator('[data-act="flip"]')).toHaveCount(0);
  await page.keyboard.press('Enter');
  await expect(set().locator('.tabs')).toHaveCount(1);
  await page.waitForTimeout(250);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  await expect(info()).toContainText('Ivysaur');
  await expect(info().locator('.win').nth(3).locator('i.an')).toHaveCount(3);
  await expect(info().locator('.win').nth(3).locator('i.an.sil')).toHaveCount(1);
  await info().locator('[data-act="back"]').click();
  await expect(info()).toHaveCount(0);

  // Esc leaves the set for the Research Room.
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await expect(page.locator('#rx .stage[data-scene="Hub"]').last().locator('.hd')).toContainText('Research Room');
  await expect(page.locator('#rx .tabs .on', { hasText: 'All' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

import { expect, test } from '@playwright/test';
import { view, waitForScene, watch, start, toMap, toCommands, open } from './helpers/newUi';

// The New UI's places from the last pass: the Pokédex (mock-up pieces "Pokédex: set browser" and "Pokédex: species
// info": a wall of species pictures with filter tabs, and the species page with its stat bars and evolution line), the
// Bank's Exchange Counter (the mock-up counter page with a clerk), a Plaza district's menu and Galar's stadium
// interview (the mock-up talk page over the field).
// One of the New UI spec files (see newUi.spec.ts); the shared steps are in helpers/newUi.ts.

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

test('New UI: the Bank\'s Exchange Counter is the mock-up counter page: two offers, one lot or five, the clerk says what happened or why not, and the totals follow', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-counter');
  await open(page, 'Hub');
  await page.waitForTimeout(500);
  const seed = (bankTier: number) => page.evaluate((bankTier) => {
    const pkr = (window as any).__pkr;
    pkr.session.changeProfile((q: any) => ({ ...q, bankTier, bankCredits: 650, lifetimeBankCredits: 650, researchPoints: 60 }));
    pkr.game.scene.getScene('Hub').enter('bank');
  }, bankTier);
  const totals = () => page.evaluate(() => { const p = (window as any).__pkr.session.profile; return [p.bankCredits, p.researchPoints]; });
  const top = () => page.locator('#rx .stage[data-scene="Hub"]').last();
  const toCounter = async () => {
    await expect(top().locator('.hd')).toContainText('Bank');
    // One row for the counter in the New look (the Old look keeps its two exchange rows in the Bank list).
    await expect(top().locator('[data-act="pick"]', { hasText: 'Exchange Counter' })).toHaveCount(1);
    await expect(top()).not.toContainText('credits → Research');
    await top().locator('[data-act="pick"]', { hasText: 'Exchange Counter' }).click();
    if (!(await top().locator('.hd', { hasText: 'Exchange Counter' }).count())) await page.keyboard.press('Enter');
    await expect(top().locator('.hd')).toContainText('Exchange Counter');
    await page.waitForTimeout(250);
  };
  const text = () => top().locator('.txt');
  const lit = () => top().locator('.win .btn.on');

  // Below Bank tier 3 the counter is shut: every button says why and nothing moves.
  await seed(1);
  await toCounter();
  await expect(text()).toContainText('The Exchange Counter opens at Bank tier 3.');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  expect(await totals()).toEqual([650, 60]);
  await page.keyboard.press('Escape');
  await expect(top().locator('.hd')).toContainText('Bank');

  // At tier 3: the page, its chips and the clerk.
  await seed(3);
  await page.waitForTimeout(500);
  await toCounter();
  await expect(text().locator('.nm')).toHaveText('Counter clerk');
  await expect(text()).toContainText('one lot or five at a time');
  await expect(top().locator('.tg').first()).toHaveText('650 credits');
  await expect(top().locator('.tg').nth(1)).toHaveText('60 Research');
  await expect(top().locator('.btn', { hasText: 'Research Points' }).first()).toContainText('100 credits');
  await expect(top().locator('.btn', { hasText: 'Bank Credits' }).first()).toContainText('50 Research Points');
  await expect(top().locator('.win')).toContainText('You have 60 Research Points');
  await expect(lit()).toHaveText('Exchange 1');
  await page.screenshot({ path: 'test-results/newui-exchange-counter.png' });

  // One lot, then five lots with Right.
  await page.keyboard.press('Enter');
  await expect(text()).toContainText('Exchanged 100 credits for 25 Research Points.');
  expect(await totals()).toEqual([550, 85]);
  await expect(top().locator('.tg').first()).toHaveText('550 credits');
  await page.waitForTimeout(250);
  await page.keyboard.press('ArrowRight');
  await expect(lit()).toHaveText('Exchange 5');
  await page.keyboard.press('Enter');
  await expect(text()).toContainText('Exchanged 500 credits for 125 Research Points.');
  expect(await totals()).toEqual([50, 210]);
  // Five more lots cost 500 credits: the clerk says so, and nothing moves.
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await expect(text()).toContainText('You need 500 Bank Credits (you have 50).');
  expect(await totals()).toEqual([50, 210]);

  // The other way: five lots need 250 Research Points, one lot goes through.
  await page.keyboard.press('ArrowDown');
  await expect(top().locator('.win')).toContainText('You have 50 Bank Credits');
  await expect(lit()).toHaveText('Exchange 5');
  await expect(text()).toContainText('You need 250 Research Points (you have 210).');
  await page.keyboard.press('ArrowLeft');
  await expect(lit()).toHaveText('Exchange 1');
  await page.keyboard.press('Enter');
  await expect(text()).toContainText('Exchanged 50 Research Points for 10 credits.');
  expect(await totals()).toEqual([60, 160]);
  // A click on a button works like the keys.
  await page.waitForTimeout(250);
  await top().locator('.win .btn', { hasText: 'Exchange 1' }).click();
  await expect.poll(totals).toEqual([70, 110]);

  // Esc goes back to the Bank, which shows the new totals.
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await expect(top().locator('.hd')).toContainText('Bank');
  await expect(top()).toContainText('70 credits');
  expect(errors).toEqual([]);
});

test('New UI: a Plaza district opens the mock-up district menu: each place with what is on offer at the right, its card, and Esc goes back to the square', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=plaza-e2e');
  await toMap(page);
  // Every node in the middle column carries the plaza stop; stand on one with plenty of money.
  const sideId = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    const middle = Math.ceil(run.stage.map.columns / 2);
    const nodes = run.stage.map.nodes.filter((n: any) => n.column === middle);
    run.stage.current = nodes[0].id;
    run.money = 50000;
    (window as any).__pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
    return (nodes[0].sides.find((s: any) => s.kind === 'plaza')?.id ?? null) as string | null;
  });
  expect(sideId).not.toBeNull();
  await waitForScene(page, 'Map');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
  await page.evaluate((id) => (window as any).__pkr.game.scene.getScene('Map').openPlaza(id), sideId);
  await waitForScene(page, 'Plaza');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Plaza').ready), { timeout: 15_000 }).toBe(true);
  await page.waitForTimeout(500);

  // The square: one button per district and Leave.
  const square = view(page, 'Plaza').first();
  await expect(square).toBeVisible();
  const names = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Plaza').layout.districts.map((d: any) => d.name as string));
  expect(names).toHaveLength(6);
  for (const n of [...names, 'Leave']) await expect(square.locator('[data-act="pick"]', { hasText: n }).first()).toBeVisible();

  // The first district's menu.
  await page.keyboard.press('Enter');
  const menu = view(page, 'Plaza').last();
  await expect(menu.locator('.hd')).toContainText(names[0]!);
  await expect(page.locator('#rx .tg', { hasText: '₽50000' })).toBeVisible();
  const sections = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Plaza').layout.districts[0].sections.map((s: any) => ({ title: s.title as string, count: s.count as number })));
  expect(sections.length).toBeGreaterThan(1);
  const rows = menu.locator('.btn[data-act="pick"]');
  await expect(rows).toHaveCount(sections.length);
  for (const [i, s] of sections.entries()) {
    // The name alone on the left, the count as the row's note; not "Name (10)".
    await expect(rows.nth(i)).toContainText(s.title);
    await expect(rows.nth(i)).toContainText(`${s.count} on offer`);
    await expect(rows.nth(i)).not.toContainText('(');
  }
  await expect(rows.nth(0)).toHaveClass(/on/);
  await expect(menu.locator('.win').first()).toContainText(sections[0]!.title);
  await expect(menu.locator('.txt')).toContainText(`${names[0]}: ${sections[0]!.title}, ${sections[0]!.count} on offer.`);
  await page.screenshot({ path: 'test-results/newui-plaza-district.png' });
  // Down moves the cursor and the card follows.
  await page.waitForTimeout(250);
  await page.keyboard.press('ArrowDown');
  await expect(rows.nth(1)).toHaveClass(/on/);
  await expect(menu.locator('.win').first()).toContainText(sections[1]!.title);

  // Esc closes the menu; the square is still there and the run is still in the Plaza.
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Plaza').picker))).toBe(false);
  await expect(view(page, 'Plaza')).toHaveCount(1);
  expect(await page.evaluate(() => (window as any).__pkr.activeScene())).toBe('Plaza');
  expect(errors).toEqual([]);
});

test('New UI: a Galar gym battle opens on the versus card, and the stadium reporter and the interview are the mock-up talk page (name plate, the line, Go on); then the battle starts', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=galar-stadium-e2e');
  await toMap(page);
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    session.saveSettings({ ...session.settings, autoAdvance: false });
    const run = session.run;
    run.regionOrder = ['galar', ...run.regionOrder.filter((r: string) => r !== 'galar')];
    run.regionIndex = 0;
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.kind = 'gym';
    session.chooseNode(node.id);
    game.scene.getScene('Map').scene.start('Battle');
  });
  await waitForScene(page, 'Battle');
  await expect.poll(() => page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle').stadium)), { timeout: 20_000 }).toBe(true);

  // The opening cards play by themselves (the leader's card, then the versus card); then the reporter is on air.
  const stages = page.locator('#rx .stage[data-scene="Battle"]');
  await expect(stages.locator('.vsx')).toHaveCount(1, { timeout: 20_000 });
  const air = () => stages.filter({ has: page.locator('.txt .nm') });
  await expect(air()).toHaveCount(1, { timeout: 20_000 });
  const plate = () => air().locator('.txt .nm');
  await expect(plate()).toHaveText('Reporter');
  await expect(air().locator('.txt')).toContainText('Welcome, everyone, to gym match number 1 of the Gym Challenge!');
  await expect(air().locator('.tg').first()).toHaveText('Live from the stadium');
  await expect(air().locator('[data-act="pick"]')).toHaveText('Go on');
  // The reporter's picture is on the page, and the old canvas speech box is not drawn under it.
  await expect(air().locator('i.an, img, .im').first()).toBeVisible();
  expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').children.getByName('story-line'))).toBeNull();
  await page.screenshot({ path: 'test-results/newui-galar-reporter.png' });

  // Enter goes on to the interview: the reporter's question, then a guest from the stands answers.
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await expect(air().locator('.tg').first()).toHaveText('Pregame interview');
  await expect(plate()).toHaveText('Reporter');
  const question = (await air().locator('.txt').innerText()).trim();
  expect(question.length).toBeGreaterThan(20);
  await page.screenshot({ path: 'test-results/newui-galar-interview.png' });
  await page.waitForTimeout(250);
  await air().locator('[data-act="pick"]').click();
  await expect(plate()).not.toHaveText('Reporter');
  await expect(air().locator('.tg').first()).toHaveText('Pregame interview');
  expect((await air().locator('.txt').innerText()).trim()).not.toBe(question);
  expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').children.getByName('story-line'))).toBeNull();

  // The battle goes on to its first choice, and the broadcast page is gone.
  await page.waitForTimeout(250);
  await toCommands(page);
  await expect(air()).toHaveCount(0);
  expect(errors).toEqual([]);
});

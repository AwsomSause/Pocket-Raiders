import { expect, test } from '@playwright/test';
import { view, waitForScene, watch, start, toMap, toCommands, open } from './helpers/newUi';

// The New UI's places from the last pass: the Pokédex (mock-up pieces "Pokédex: set browser" and "Pokédex: species
// info": a wall of species pictures with filter tabs, and the species page with its stat bars and evolution line), the
// Bank's Exchange Counter (the mock-up counter page with a clerk), a Plaza district's menu, Galar's stadium
// interview (the mock-up talk page over the field) and the stage map's menus (Camp, Album, Story Journal, Legend, and
// on a story run PC, Rivals, People and Notes), and a Totem Pokémon's cutscene card.
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

test('New UI: the map menus follow the mock-ups: Camp opens on its five-row front page, the Album is a wall of pictures that Enter adds a team photo to, the Story Journal is a board, L opens only the Legend, and a shout prompt is the microphone prompt', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-mapmenus');
  await toMap(page);
  const idle = () => expect.poll(() => page.evaluate(() => { const m = (window as any).__pkr.game.scene.getScene('Map'); return !m.busy && !m.picker; }), { timeout: 15_000 }).toBe(true);
  const openMenu = async (label: string) => {
    await idle();
    await page.waitForTimeout(250);
    await view(page, 'Map').first().locator('[data-act]', { hasText: label }).first().click();
    await page.waitForTimeout(400);
  };
  const menu = (name: string | RegExp) => page.locator('#rx .stage[data-scene="Map"]', { has: page.locator('.hd', { hasText: name }) }).last();
  const photos = () => page.evaluate(() => ((window as any).__pkr.session.run.partyLife?.scrapbook ?? []).length as number);

  // Camp: the front page is the mock-up's five rows with a detail card, and no tab row.
  await openMenu('Camp');
  const camp = menu(/^\W*Camp/);
  const rows = camp.locator('.btn[data-act="pick"]');
  await expect(rows).toHaveCount(5);
  await expect(rows.nth(0)).toContainText('Gadgets');
  await expect(rows.nth(0)).toContainText('0 owned');
  await expect(rows.nth(1)).toContainText('Cook a meal');
  await expect(rows.nth(4)).toContainText('Campsite');
  await expect(camp.locator('.win').first()).toContainText('Small tools that help on the road.');
  await expect(camp.locator('.txt')).toHaveText('Camp opens between stops.');
  await expect(camp.locator('.tabs')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/newui-map-camp.png' });
  // A row opens that part of camp (its name is a chip); Esc comes back to the front page on the same row.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  await expect(camp.locator('.tg', { hasText: 'Kitchen' })).toHaveCount(1);
  await expect(camp.locator('.btn[data-act="pick"]').first()).toContainText('Cooking Pot');
  await expect(camp.locator('.tabs')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await expect(camp.locator('.btn.on')).toContainText('Kitchen');
  await expect(camp.locator('.btn[data-act="pick"]')).toHaveCount(5);
  await page.keyboard.press('Escape');
  await expect(camp).toHaveCount(0);

  // Album: a wall of 18 pages, all empty at first. Enter takes the team photo.
  await openMenu('Album');
  const album = menu('Album');
  const cells = album.locator('.cell[data-act="pick"]');
  await expect(cells).toHaveCount(18);
  await expect(cells.locator('i.an')).toHaveCount(0);
  await expect(album.locator('.win').nth(1)).toContainText(/0\s*\/\s*18/);
  await expect(album.locator('.txt')).toContainText('Enter takes a team photo.');
  expect(await photos()).toBe(0);
  await page.keyboard.press('Enter');
  await expect(album).toHaveCount(0);
  expect(await photos()).toBe(1);
  // The photo is the first picture; its card says the stage and the caption. A second photo this stage is refused.
  await openMenu('Album');
  await expect(cells.nth(0).locator('i.an')).toHaveCount(1);
  await expect(cells.nth(0)).toHaveClass(/sel/);
  await expect(cells.nth(1)).toHaveClass(/off/);
  await expect(album.locator('.win').first()).toContainText('Stage 1');
  await expect(album.locator('.win').first()).toContainText('Team photo');
  await expect(album.locator('.win').nth(1)).toContainText(/1\s*\/\s*18/);
  await expect(album.locator('.txt')).toContainText('You already took a photo this stage.');
  await page.screenshot({ path: 'test-results/newui-map-album.png' });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  await expect(album).toHaveCount(1);
  expect(await photos()).toBe(1);
  await page.keyboard.press('Escape');
  await expect(album).toHaveCount(0);

  // Story Journal: board rows, each with a tag.
  await openMenu('Story');
  const journal = menu('Story Journal');
  const lines = journal.locator('[data-act="pick"]');
  await expect(lines.first()).toContainText('You are known as');
  await expect(lines.first().locator('.tg')).toHaveText('Title');
  await expect(journal.locator('.tg', { hasText: 'Memory' }).first()).toBeVisible();
  await expect(journal.locator('.txt')).toContainText('Titles change how people talk to you');
  await page.screenshot({ path: 'test-results/newui-map-journal.png' });
  await page.keyboard.press('Escape');
  await expect(journal).toHaveCount(0);

  // L opens the Legend alone (the interaction log does not open over it); Shift+L opens the log.
  await idle();
  const log = page.locator('#rx [data-act="log"]');
  await page.keyboard.press('l');
  await expect(view(page, 'Map').first().locator('[data-act="legend"]').first()).toBeVisible();
  await expect(log).toHaveCount(0);
  await page.keyboard.press('l');
  await expect(view(page, 'Map').first().locator('.fill[data-act="legend"]')).toHaveCount(0);
  await expect(log).toHaveCount(0);
  await page.keyboard.press('Shift+L');
  await expect(log).toBeVisible();
  await expect(log).toContainText('Interaction log');
  await page.keyboard.press('Shift+L');
  await expect(log).toHaveCount(0);

  // A shout prompt is the mock-up's microphone prompt: the dimmed screen, twelve level bars, and Enter shouts.
  await page.evaluate(() => { (window as any).__shout = null; void (window as any).__pkr.prompt('snorlax-shout').then((r: unknown) => { (window as any).__shout = r; }); });
  const mic = page.locator('#rx .stage', { has: page.locator('.shade') }).filter({ hasText: 'Wake the Snorlax!' });
  await expect(mic).toBeVisible();
  await expect(mic.locator('.win .row i')).toHaveCount(12);
  await expect(mic).toContainText('Press Enter to shout.');
  await page.screenshot({ path: 'test-results/newui-mic-prompt.png' });
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => (window as any).__shout?.grade ?? null), { timeout: 10_000 }).toBe('good');
  await expect(mic).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('New UI: on a story run the map\'s PC is a wall of slots (Enter moves a Pokémon in or out), Rivals and People are boards with tags, and Notes keeps its notebook band on a tab\'s page', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-storymenus&campaign=orrery-circuit&debug=1');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Story']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
    await page.waitForTimeout(250);
  }
  // The backstory intro plays first: Enter turns its pages and takes the first answers.
  for (let i = 0; i < 30 && (await page.evaluate(() => (window as any).__pkr.activeScene())) !== 'Map'; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  await waitForScene(page, 'Map');
  // A run with a PC of 30 slots (three in use), a second party Pokémon, two rivals and three people met.
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    const person = (stage: string, trust: number) => ({ stage, attrs: { trust, respect: 30 }, memories: [], flags: { met: true }, gates: [], mem: [], scenes: 1, pending: null, last: null });
    run.story.v2.cast = { ch_vance: person('trusted', 60), ch_pell_orrin: person('friendly', 70), ch_cass_verrin: person('wary', 10) };
    run.perkEffects = [...(run.perkEffects ?? []), { kind: 'boxCapacity', slots: 30 }];
    const m = run.party[0];
    for (let k = 0; k < 3; k++) run.box.push({ ...structuredClone(m), uid: `${m.uid}-b${k}` });
    run.party.push({ ...structuredClone(m), uid: `${m.uid}-p2` });
    const traits = { ambition: 50, pride: 50, empathy: 50, adaptability: 50, vindictiveness: 50, resilience: 50 };
    const rival = (id: string, classId: string, name: string) => ({
      id, classId, name, archetype: 'proud', style: 'rush', traits, rivalPotential: 20, state: 'recurring', arc: null, away: 0, cooldown: 0, progress: 0,
      encounters: 2, setbacks: 0, adaptations: [], seen: [], bonds: {}, offscreen: [], origin: { eventId: `e-${id}`, where: { region: 0, stage: 0, level: 1, node: null, battle: 0, turn: null }, path: 'spark' },
      memory: { lastBattle: { eventId: 'x', result: 'win', hpLeftShare: 0.5, turns: 5, team: ['rattata'] } },
    });
    run.story.rivals = [rival('u', 'youngster', 'Joey'), rival('v', 'lass', 'Mira')];
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Map');
  const idle = () => expect.poll(() => page.evaluate(() => { const m = (window as any).__pkr.game.scene.getScene('Map'); return !m.busy && !m.picker; }), { timeout: 15_000 }).toBe(true);
  const openMenu = async (label: string) => {
    await idle();
    await page.waitForTimeout(250);
    await view(page, 'Map').first().locator('.btn', { hasText: label }).first().click();
    await page.waitForTimeout(400);
  };
  const menu = (name: string | RegExp) => page.locator('#rx .stage[data-scene="Map"]', { has: page.locator('.hd', { hasText: name }) }).last();
  const counts = () => page.evaluate(() => { const run = (window as any).__pkr.session.run; return { party: run.party.length as number, box: run.box.length as number }; });

  // PC: the wall shows the box, 18 slots a page; the bar counts the slots in use.
  await openMenu('PC');
  const pc = menu(/^\W*PC$/);
  const cells = pc.locator('.cell[data-act="pick"]');
  await expect(cells).toHaveCount(18);
  await expect(cells.locator('i.an')).toHaveCount(3);
  await expect(cells.nth(3)).toHaveClass(/off/);
  await expect(pc.locator('.win').first()).toContainText('27 of 30 slots free.');
  await expect(pc.locator('.win').nth(1)).toContainText(/3\s*\/\s*30/);
  await expect(pc.locator('.txt')).toHaveText('Bring this Pokémon into the party.');
  await page.screenshot({ path: 'test-results/newui-map-pc.png' });
  // An empty slot asks which party Pokémon goes in; Esc comes back to the wall on that slot.
  for (let k = 0; k < 4; k++) await page.keyboard.press('ArrowRight');
  await expect(pc.locator('.win').first()).toContainText('Empty slot');
  await expect(pc.locator('.txt')).toContainText('Enter sends a party Pokémon to the PC.');
  await page.keyboard.press('Enter');
  const send = menu('Send which Pokémon to the PC?');
  await expect(send.locator('[data-act="pick"]')).toHaveCount(2);
  await page.keyboard.press('Escape');
  await expect(send).toHaveCount(0);
  await expect(pc.locator('.win').first()).toContainText('Empty slot');
  await page.keyboard.press('Enter');
  await expect(send.locator('[data-act="pick"]')).toHaveCount(2);
  await page.keyboard.press('Enter');
  await expect(send).toHaveCount(0);
  expect(await counts()).toEqual({ party: 1, box: 4 });
  // A boxed Pokémon joins the party on Enter.
  await openMenu('PC');
  await expect(cells.locator('i.an')).toHaveCount(4);
  await page.keyboard.press('Enter');
  await expect(pc).toHaveCount(0);
  expect(await counts()).toEqual({ party: 2, box: 3 });

  // Rivals: a board on the story band, each rival with its record and a state tag.
  await openMenu('Rivals');
  const rivals = menu(/^\W*Rivals$/);
  const rows = rivals.locator('[data-act="pick"]');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('Joey');
  await expect(rows.first()).toContainText('2 fights');
  await expect(rows.first().locator('.tg')).toHaveText('Recurring');
  await page.keyboard.press('Escape');
  await expect(rivals).toHaveCount(0);

  // People: a board with a bar and the stage as the tag; the role sits under the name.
  await openMenu('People');
  const people = menu(/^\W*People$/);
  const folk = people.locator('[data-act="pick"]');
  await expect(folk).toHaveCount(3);
  await expect(folk.first()).toContainText('Vance');
  await expect(folk.first()).toContainText('Mentor');
  await expect(folk.first().locator('.tg')).toHaveText('Trusted');
  await expect(folk.first().locator('.hp').first()).toBeVisible();
  await page.screenshot({ path: 'test-results/newui-map-people.png' });
  await page.keyboard.press('Escape');
  await expect(people).toHaveCount(0);

  // Notes: the notebook's tabs with their counts; a tab's page keeps the notebook's name with the tab as a chip.
  await openMenu('Notes');
  const notes = menu('Field Notebook');
  await expect(notes.locator('.btn[data-act="pick"]').first()).toContainText('Main Story');
  await expect(notes.locator('.win').first()).toContainText('Main Story');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  await expect(notes.locator('.tg', { hasText: 'Main Story' })).toHaveCount(1);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await expect(notes.locator('.tg', { hasText: 'Main Story' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(notes).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('New UI: a Totem\'s page wears the battle band and the Totem Pokémon enters on the mock-up cutscene card (its aura as the line; Esc skips)', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-totem');
  await toMap(page);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push({ id: 'totem-e2e', kind: 'totem', totemId: 'totem-marowak', used: false });
    run.stage.current = node.id;
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Map');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').openTotem('totem-e2e'));
  const pageOf = page.locator('#rx .stage[data-scene="Map"]', { has: page.locator('.hd', { hasText: 'Totem - Totem Marowak' }) }).last();
  await expect(pageOf).toBeVisible();
  // The band is the battle's (the same colour as the Raid pages), not the hub's.
  expect(await pageOf.locator('.hd').getAttribute('style')).toContain('#d8483a');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  const cut = view(page, 'Battle').filter({ has: page.locator('.beat') });
  await expect(cut).toBeVisible();
  await expect(cut.locator('.plate')).toHaveText('Totem Pokémon');
  await expect(cut).toContainText('Totem Marowak');
  await expect(cut).toContainText('Its bone glows (Attack up). It calls for help.');
  await expect(cut.locator('.beat i')).toHaveCount(5);
  await page.screenshot({ path: 'test-results/newui-totem-card.png' });
  await page.keyboard.press('Escape');
  await expect(cut).toHaveCount(0);
  await toCommands(page);
  expect(errors).toEqual([]);
});

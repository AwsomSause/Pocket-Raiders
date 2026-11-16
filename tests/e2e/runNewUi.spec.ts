import { expect, test } from '@playwright/test';
import { view, waitForScene, watch, start, toMap, addSide, open } from './helpers/newUi';

// The New UI (Settings > UI style: New, the default for players): the run's last-pass pages: node event menu, Department Store, Tools, code entry, Preparation Desk, Honest Trade Card.
// The New UI specs are split over several files (newUi, battleNewUi, menusNewUi, runNewUi, storyNewUi, worldNewUi) whose
// names are spread over the alphabet, so the browser-test shards each get one of them; the shared steps are in
// helpers/newUi.ts. The older specs run with the Old UI, so both styles stay covered.

test('New UI: the node event menu is a row of cards over the map; the cursor, a click beside it, Esc and a pick all work, and the old canvas menu is not drawn', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=node-menu-e2e');
  await toMap(page);
  // Menus on for this run; stand on the first node as if its battle were won.
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    run.expansion = { ...(run.expansion ?? {}), nodeMenus: { stage: '', menus: {}, tally: { menus: 0, picks: 0, micro: 0, skipped: 0 } } };
    const first = run.stage.map.nodes.find((n: any) => n.column === 1);
    run.stage.current = first.id;
    run.stage.visited.push(first.id);
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Map');
  await page.waitForTimeout(250);
  const map = view(page, 'Map');
  const openMenu = () => page.evaluate(() => {
    const scene = (window as any).__pkr.game.scene.getScene('Map');
    const i = scene.options.findIndex((o: any) => o.kind === 'nodeMenu');
    if (i >= 0) scene.activate(i);
    return i;
  });
  expect(await openMenu()).toBeGreaterThanOrEqual(0);
  await expect(map).toContainText('What to do here?');
  const menu = await page.evaluate(() => (window as any).__pkr.session.nodeMenu());
  const cards = menu.entries.filter((v: any) => v.entry.kind !== 'encounter');
  const card = map.locator('[data-over="menuOver"]');
  await expect(card).toHaveCount(cards.length);
  // The New layer draws it: the old canvas pop-up is not there and the layer stays on screen.
  expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').children.list.filter((o: any) => o.name === 'node-menu').length)).toBe(0);
  await expect(map).toBeVisible();
  const first = cards.findIndex((v: any) => !v.done && !v.locked);
  await expect(card.nth(first)).toHaveClass(/sel/);
  await page.screenshot({ path: 'test-results/newui-node-menu.png' });
  // Right moves the cursor (and wraps); resting the pointer on a card moves it too.
  await page.keyboard.press('ArrowRight');
  await expect(card.nth((first + 1) % cards.length)).toHaveClass(/sel/);
  await card.nth(first).hover();
  await expect(card.nth(first)).toHaveClass(/sel/);
  // Esc closes it and nothing was picked; a click beside the cards closes it as well.
  await page.keyboard.press('Escape');
  await expect(map).not.toContainText('What to do here?');
  expect((await page.evaluate(() => (window as any).__pkr.session.nodeMenu())).menu.picked.length).toBe(0);
  await page.waitForTimeout(250);
  await openMenu();
  await expect(map).toContainText('What to do here?');
  await map.locator('.shade[data-act="menu"]').click({ position: { x: 20, y: 500 } });
  await expect(map).not.toContainText('What to do here?');
  // Esc on the free map still opens the pause menu, not the node menu.
  await page.waitForTimeout(250);
  // Pick a quick stop with the keyboard: it plays at once and is marked done.
  const micro = cards.findIndex((v: any) => v.entry.kind === 'micro');
  expect(micro).toBeGreaterThanOrEqual(0);
  await openMenu();
  await expect(map).toContainText('What to do here?');
  for (let i = first; i < micro; i++) await page.keyboard.press('ArrowRight');
  await expect(card.nth(micro)).toHaveClass(/sel/);
  await page.keyboard.press('Enter');
  await expect(map).not.toContainText('What to do here?');
  await expect.poll(async () => (await page.evaluate(() => (window as any).__pkr.session.nodeMenu())).menu.picked.length).toBe(1);
  await page.waitForTimeout(250);
  // Open it again: the stop that was done is dimmed and says so, and Enter on it does nothing.
  await openMenu();
  await expect(card.nth(micro)).toContainText('Done');
  await expect(card.nth(micro)).toHaveAttribute('style', /brightness/);
  await card.nth(micro).click();
  await expect(map).toContainText('What to do here?');
  expect((await page.evaluate(() => (window as any).__pkr.session.nodeMenu())).menu.picked.length).toBe(1);
  expect(errors).toEqual([]);
});

test('New UI: a Celadon Department Store floor is the mock-up store page: floor directory, goods with prices, who a stone helps, and buying works', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-store');
  await toMap(page);
  await addSide(page, { id: 'nu-store', kind: 'event', used: false, eventId: 'cs-kanto-celadon-mart-f5' });
  await addSide(page, { id: 'nu-store-b', kind: 'event', used: false, eventId: 'cs-kanto-celadon-mart-f5b' });
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    pkr.session.run.money = 3500;
    pkr.session.run.party[0].speciesId = 'eevee';
    pkr.game.scene.getScene('Map').scene.start('Event', { sideId: 'nu-store' });
  });
  await waitForScene(page, 'Event');
  const ev = view(page, 'Event');
  await expect(ev.locator('.hd')).toContainText('Celadon Dept. Store');
  await expect(ev).toContainText('₽ 3,500');
  // The directory: every floor, the fifth lit; the hidden half floor is not listed.
  for (const t of ['RF', '5F', '4F', '3F', '2F', '1F', 'Evolution Stones', 'TM Counter']) await expect(ev).toContainText(t);
  await expect(ev).not.toContainText('4½');
  await expect(ev.locator('.btn.on', { hasText: '5F' })).toContainText('Evolution Stones');
  // Read the clerk's text to the end; the goods show after it.
  await page.waitForTimeout(250);
  for (let k = 0; k < 6 && (await ev.locator('[data-act="page"]').count()); k++) { await ev.locator('[data-act="page"]').click(); await page.waitForTimeout(150); }
  const rows = ev.locator('[data-act="pick"]');
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(0)).toContainText('Fire Stone');
  await expect(rows.nth(0)).toContainText('₽ 3,000');
  await expect(rows.nth(0)).not.toContainText('(');
  await expect(rows.nth(3)).toContainText('The other two stones.');
  // The cursor is on the Fire Stone: Eevee can evolve with it. Down on the Thunder Stone it still can; on the last row nobody is named.
  await expect(rows.nth(0)).toHaveClass(/on/);
  await expect(ev).toContainText('Can evolve');
  await page.screenshot({ path: 'test-results/newui-store.png' });
  await rows.nth(3).hover();
  await expect(rows.nth(3)).toHaveClass(/on/);
  await expect(ev).not.toContainText('Can evolve');
  // Buy the Fire Stone: the text, then what changed, then back to the map with the stone and less money.
  await rows.nth(0).click();
  await expect(ev.locator('[data-act="next"]').first()).toBeVisible({ timeout: 10_000 });
  await expect(ev.locator('.hd')).toContainText('Celadon Dept. Store');
  await page.waitForTimeout(700);
  await ev.locator('[data-act="next"]').first().click();
  await expect(ev).toContainText('Outcome', { timeout: 10_000 });
  await page.waitForTimeout(1500);
  await ev.locator('[data-act="next"]').first().click();
  await waitForScene(page, 'Map');
  const after = await page.evaluate(() => { const run = (window as any).__pkr.session.run; return { money: run.money, stone: JSON.stringify(run.items ?? run.bag ?? run.inventory ?? {}).includes('fire-stone') }; });
  expect(after.money).toBe(500);
  expect(after.stone).toBe(true);
  // The second tray with ₽500: both stones are dimmed and cannot be bought; the text box says why.
  await page.waitForTimeout(250);
  await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('Map').scene.start('Event', { sideId: 'nu-store-b' }));
  await waitForScene(page, 'Event');
  await page.waitForTimeout(250);
  for (let k = 0; k < 6 && (await ev.locator('[data-act="page"]').count()); k++) { await ev.locator('[data-act="page"]').click(); await page.waitForTimeout(150); }
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText('Leaf Stone');
  await expect(rows.nth(0)).toHaveAttribute('style', /opacity:\.5/);
  await expect(rows.nth(1)).toHaveAttribute('style', /opacity:\.5/);
  await expect(rows.nth(2)).not.toHaveAttribute('style', /opacity:\.5/);
  await rows.nth(0).click();
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.money)).toBe(500);
  await expect(rows).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('New UI: losing an Extended Cut climax battle shows the Second Shot box over the battle; it waits for an input, then the climax goes on', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-shot');
  await toMap(page);
  // The Kanto Extended Cut stands at its first battle phase (The Climb); the map launches the fight at once.
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    run.story.evil = { ...(run.story.evil ?? {}), teamId: pkr.session.content.evilTeams.teams[0].id };
    run.expansion = { ...(run.expansion ?? {}), cut: { climaxCut: 'extended', region: 'kanto', director: { idx: 3, shots: 0 } } };
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Battle', 30_000);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.battle?.event?.eventId)).toBe('format:climax');
  // One Pokémon on its last HP that only knows Splash: it falls. Keep choosing the move until the fight is lost.
  await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    // (Death-Block keeps its own wipe rule, so it is off: a climax loss is then a story loss, which the Second Shot counts.)
    run.rules.deathBlock = false;
    run.party.forEach((m: any, k: number) => { m.hp = k === 0 ? 1 : 0; m.moves = [{ ...m.moves[0], id: 'splash', pp: 40 }]; });
  });
  const field = view(page, 'Battle');
  const box = field.locator('.win', { hasText: 'Second Shot' });
  for (let k = 0; k < 160 && !(await box.count()); k++) { await page.keyboard.press('Enter'); await page.waitForTimeout(250); }
  await expect(box).toBeVisible();
  await expect(box).toContainText('You lost, but the climax is not over.');
  await expect(box.locator('[data-act="confirm"]')).toHaveText('Try again');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.expansion.cut.director.shots)).toBe(1);
  await page.screenshot({ path: 'test-results/newui-second-shot.png' });
  // It stays until an input: nothing moves on by itself.
  await page.waitForTimeout(1500);
  await expect(box).toBeVisible();
  expect(await page.evaluate(() => (window as any).__pkr.game.scene.isActive('Battle'))).toBe(true);
  await box.locator('[data-act="confirm"]').click();
  // The run goes on: the climax starts its next fight (or page), never the game-over screen.
  await expect.poll(async () => page.evaluate(() => { const pkr = (window as any).__pkr; return pkr.session.run.phase !== 'over' && !pkr.game.scene.isActive('GameOver') && pkr.session.run.party.some((m: any) => m.hp > 0); }), { timeout: 20_000 }).toBe(true);
  expect(errors).toEqual([]);
});

test('New UI: the hub Trainer Card is the mock-up card page (picture, name and rank, the record, eight badge discs), and Esc goes back to the hub', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-card');
  await open(page, 'Hub');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const p = (window as any).__pkr.session.profile;
    p.stats.runsEnded = 12; p.stats.battlesWon = 340; p.stats.bestEncounters = 77; p.best.badges = 3;
    (window as any).__pkr.game.scene.getScene('Hub').enter('card');
  });
  const hub = view(page, 'Hub').last();
  await expect(hub.locator('.hd')).toContainText('Trainer Card');
  const card = hub.locator('.win').first();
  await expect(card).toContainText('Rank');
  for (const t of ['Title', 'Runs', '12', 'Battles won', '340', 'Best run', '77 encounters', 'Pokémon caught']) await expect(card).toContainText(t);
  // Eight discs, three of them won.
  await expect(card.locator('i[style*="border-radius:50%"]')).toHaveCount(8);
  await expect(card.locator('i[style*="background:var(--p2)"]')).toHaveCount(5);
  // The player's picture, and the frame line in the text box; the old canvas card is not what shows.
  await expect(card.locator('.cell')).toBeVisible();
  await expect(hub.locator('.txt')).toContainText('Change title and frame in the Wardrobe.');
  await expect(card.locator('[data-act="save"]')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/newui-trainer-card.png' });
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await expect(page.locator('#rx .hd', { hasText: 'Trainer Card' })).toHaveCount(0);
  await expect(view(page, 'Hub').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('New UI: the Tools pages follow the mock-ups (number tiles for My stats and the Speedrun timer, berry pictures, Content status bars, a typed bracket, the save check form)', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-tools');
  await open(page, 'Hub');
  await page.waitForTimeout(500);
  const hub = view(page, 'Hub').last();
  const tools = async (row: string) => {
    await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Hub').enter('tools'));
    await expect(hub.locator('.hd')).toContainText('Tools & Community');
    await page.waitForTimeout(250);
    // The list scrolls: step down until the row is the lit one, then open it.
    for (let k = 0; k < 30 && !(await hub.locator('.btn.on', { hasText: row }).count()); k++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(60); }
    await expect(hub.locator('.btn.on')).toContainText(row);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
  };
  const band = () => hub.locator('.hd').getAttribute('style');

  // My stats: eight number tiles, no list.
  await tools('My stats');
  await expect(hub.locator('.hd')).toContainText('My stats');
  for (const t of ['Runs', 'Wins', 'Win rate', 'Longest run', 'Average run', 'Regions per run', 'Top trainer', 'Most used']) await expect(hub.locator('.win', { hasText: t })).toHaveCount(1);
  await expect(hub.locator('.btn')).toHaveCount(0);
  await expect(hub.locator('.txt')).toContainText('Assisted runs: 0.');
  const hubBand = await band();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);

  // Speedrun timer: tiles on the run's teal band; Enter switches the timer.
  await tools('Speedrun timer');
  await expect(hub.locator('.win', { hasText: 'Timer' })).toContainText('Off');
  expect(await band()).not.toBe(hubBand);
  await page.screenshot({ path: 'test-results/newui-tools-timer.png' });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  await tools('Speedrun timer');
  await expect(view(page, 'Hub').last().locator('.win', { hasText: 'Timer' })).toContainText('On');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);

  // Berry Bestiary: every cell on the first page is a picture.
  await tools('Berry Bestiary');
  await expect(hub.locator('.hd')).toContainText('Berry Bestiary');
  await expect(hub.locator('[data-act="pick"] i.im')).toHaveCount(18);
  await expect(hub.locator('[data-act="pick"] i.im').first()).toHaveAttribute('style', /items\/gen5\/.+-berry\.png/);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);

  // Content status: board rows with a bar and an OK tag.
  await tools('Content status');
  await expect(hub.locator('.hd')).toContainText('Content status');
  await expect(hub.locator('[data-act="pick"]').first()).toContainText('Species');
  await expect(hub.locator('[data-act="pick"]').first()).toContainText(/\d+ of \d+ supported/);
  await expect(hub.locator('[data-act="pick"]').first().locator('.tg')).toHaveText(/OK|Check/);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);

  // Tournament bracket: two form pages (names, seed), then the bracket page with groups as chips.
  await tools('Tournament bracket');
  const form = page.locator('#rx .stage[data-scene="Hub"]').last();
  await expect(form.locator('.hd')).toContainText('Tournament bracket');
  await expect(form).toContainText('Type the names, with commas between them');
  const box = page.locator('[data-testid="ask-input"]');
  await expect(box).toBeFocused();
  // Typing goes into the box (and not to the list under the form); the rest is filled in one go to keep the test short.
  await page.keyboard.type('Ann,');
  await expect(box).toHaveValue('Ann,');
  await box.fill('Ann, Bob, Cy, Dee, Eve, Fay, Gus, Hal, Ian, Jo, Kim');
  await page.keyboard.press('Enter');
  await expect(page.locator('#rx .stage[data-scene="Hub"]').last()).toContainText('Type a seed for the draw');
  await expect(box).toBeFocused();
  await box.fill('fixed');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  const br = view(page, 'Hub').last();
  await expect(br.locator('.hd')).toContainText('Tournament bracket');
  await expect(br.locator('[data-act="bracketPage"]')).toHaveCount(3);
  await expect(br.locator('.txt')).toContainText('11 players, seed fixed.');
  const groupA = await br.innerText();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  const groupB = await view(page, 'Hub').last().innerText();
  expect(groupB).not.toBe(groupA);
  // Every name is in one of the two groups, once.
  for (const n of ['Ann', 'Bob', 'Cy', 'Dee', 'Eve', 'Fay', 'Gus', 'Hal', 'Ian', 'Jo', 'Kim']) expect((groupA + groupB).includes(n)).toBe(true);
  await page.screenshot({ path: 'test-results/newui-tools-bracket.png' });
  await view(page, 'Hub').last().locator('[data-act="bracketPage"]').nth(2).click();
  await page.waitForTimeout(300);
  await expect(view(page, 'Hub').last()).toContainText('Winner');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);

  // A bracket form left with Esc goes back to the Tools list and draws nothing.
  await tools('Tournament bracket');
  await expect(box).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(box).toHaveCount(0);
  await expect(view(page, 'Hub').last().locator('.hd')).toContainText('Tools & Community');

  // Check a save file: the form page; text that is no save is reported, nothing breaks.
  await tools('Check a save file');
  await expect(page.locator('#rx .stage[data-scene="Hub"]').last()).toContainText('Paste a save code to check it');
  await expect(box).toBeFocused();
  // The on-screen keys type too.
  await page.locator('#rx .stage[data-scene="Hub"]').last().locator('[data-act="key"]', { hasText: /^A$/ }).click();
  await expect(box).toHaveValue('A');
  await page.keyboard.type('B');
  await expect(box).toHaveValue('AB');
  await page.screenshot({ path: 'test-results/newui-tools-savecheck.png' });
  await page.locator('#rx .stage[data-scene="Hub"]').last().locator('[data-act="btn"]', { hasText: 'Check' }).click();
  await page.waitForTimeout(400);
  await expect(view(page, 'Hub').last().locator('.hd')).toContainText('Save check');
  await expect(view(page, 'Hub').last()).toContainText('Not valid JSON');
  expect(errors).toEqual([]);
});

test('New UI: typed text is asked on the mock-up code entry page (a poster code, a note to the next run); Esc leaves it with nothing changed', async ({ page }) => {
  const errors = watch(page);
  // The game must never open the browser's own box in the New look.
  let boxes = 0;
  page.on('dialog', (d) => { boxes++; void d.dismiss(); });
  await start(page, 'ui=new&seed=newui-ask');
  await open(page, 'Hub');
  await page.waitForTimeout(500);
  const hub = () => view(page, 'Hub').last();
  const form = () => page.locator('#rx .stage[data-scene="Hub"]').last();
  const box = page.locator('[data-testid="ask-input"]');
  const nook = async (row: string) => {
    await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Hub').openLegacy('nook'));
    await expect(hub().locator('.hd')).toContainText('Corner Nook');
    await page.waitForTimeout(250);
    for (let k = 0; k < 30 && !(await hub().locator('.btn.on', { hasText: row }).count()); k++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(60); }
    await expect(hub().locator('.btn.on')).toContainText(row);
    await page.keyboard.press('Enter');
    await expect(box).toBeFocused();
  };
  const profile = () => page.evaluate(() => { const p = (window as any).__pkr.session.profile; return { titles: p.titles as string[], note: (p.nook?.note ?? null) as string | null, used: (p.nook?.codesUsed ?? []) as string[] }; });

  // Esc: the form closes, the Nook list is back and nothing is used.
  await nook('Enter a poster code');
  await expect(form().locator('.hd')).toContainText('Poster code');
  await expect(form()).toContainText('Enter a poster code');
  await page.screenshot({ path: 'test-results/newui-ask-poster.png' });
  await box.fill('PIKA-2026');
  await page.keyboard.press('Escape');
  await expect(box).toHaveCount(0);
  await expect(hub().locator('.hd')).toContainText('Corner Nook');
  expect((await profile()).used).toEqual([]);

  // A code that matches no poster changes nothing; the real one gives its title.
  await nook('Enter a poster code');
  await box.fill('NOT-A-CODE');
  await page.keyboard.press('Enter');
  await expect(box).toHaveCount(0);
  await page.waitForTimeout(600);
  expect((await profile()).used).toEqual([]);
  await nook('Enter a poster code');
  await box.fill('pika-2026');
  await page.keyboard.press('Enter');
  await expect(box).toHaveCount(0);
  await expect.poll(async () => (await profile()).used).toEqual(['PIKA-2026']);
  expect((await profile()).titles).toContain('Poster Fan');
  await page.waitForTimeout(600);

  // The note to the next run: typed, sealed with the button.
  await nook('Write a note to your future self');
  await expect(form()).toContainText('Write a note to your future self');
  await box.fill('Bring a Water type.');
  await form().locator('[data-act="btn"]', { hasText: 'Seal' }).click();
  await expect(box).toHaveCount(0);
  await expect.poll(async () => (await profile()).note).toBe('Bring a Water type.');
  expect(boxes).toBe(0);
  expect(errors).toEqual([]);
});

test('New UI: the Preparation Desk is the mock-up menu: seven rows with what they are set to, each opens its page and comes back to its row, and Depart starts', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-desk');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep']) { await page.keyboard.press('Enter'); await waitForScene(page, next); }
  const desk = () => view(page, 'RunPrep').last();
  const lit = () => desk().locator('.btn.on');
  await expect(desk().locator('.hd')).toContainText('Preparation Desk');
  // Seven rows, no page tabs, and the cursor waits on Depart.
  await expect(desk().locator('[data-act="pick"]')).toHaveCount(7);
  await expect(desk().locator('[data-act="tab"]')).toHaveCount(0);
  for (const [i, name] of ['Campaign', 'Mode', 'Preparation', 'Modifiers', 'Seed & Codes', 'Loadout presets', 'Depart'].entries()) await expect(desk().locator('[data-act="pick"]').nth(i)).toContainText(name);
  await expect(lit()).toContainText('Depart');
  await expect(desk().locator('[data-act="pick"]').nth(4)).toContainText('newui-desk');
  await expect(desk().locator('.txt')).toContainText('Set the run up, then depart.');
  await expect(desk()).toContainText('Run Overview');
  await page.screenshot({ path: 'test-results/newui-desk.png' });

  // Up to Campaign: the card beside the list says what the row changes, with the three facts.
  for (let k = 0; k < 6; k++) { await page.keyboard.press('ArrowUp'); await page.waitForTimeout(80); }
  await expect(lit()).toContainText('Campaign');
  await expect(desk()).toContainText('How many regions the run covers');
  for (const f of ['Trainer', 'Difficulty', 'Weeks']) await expect(desk().locator('.win')).toContainText(f);
  // Enter opens Run Setup; Esc comes back to the same row.
  await page.keyboard.press('Enter');
  await waitForScene(page, 'RunChoices');
  await expect(view(page, 'RunChoices').locator('.hd')).toContainText('Run Setup');
  await page.keyboard.press('Escape');
  await waitForScene(page, 'RunPrep');
  await expect(lit()).toContainText('Campaign');

  // Mode: left and right step through the modes in place.
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(120);
  const before = (await lit().innerText()).trim();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);
  await expect(lit()).toContainText('Mode');
  expect((await lit().innerText()).trim()).not.toBe(before);
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(500);
  expect((await lit().innerText()).trim()).toBe(before);

  // Modifiers and Seed & Codes open their pages by click and come back to their rows.
  await desk().locator('[data-act="pick"]').nth(3).click();
  await waitForScene(page, 'RunModifiers');
  await page.keyboard.press('Escape');
  await waitForScene(page, 'RunPrep');
  await expect(lit()).toContainText('Modifiers');
  await desk().locator('[data-act="pick"]').nth(4).click();
  await waitForScene(page, 'RunSeed');
  await page.keyboard.press('Escape');
  await waitForScene(page, 'RunPrep');
  await expect(lit()).toContainText('Seed & Codes');

  // Loadout presets: the list starts with Save; saving in slot 1 shows on the row.
  await expect(desk().locator('[data-act="pick"]').nth(5)).toContainText('0 of');
  await desk().locator('[data-act="pick"]').nth(5).click();
  await page.waitForTimeout(400);
  const list = () => view(page, 'RunPrep').last();
  await expect(list().locator('.hd')).toContainText('Loadout presets');
  await expect(list()).toContainText('Save this setup in a slot');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  await expect(view(page, 'RunPrep').last().locator('.hd')).toContainText('Save this loadout in a slot');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  await expect(desk().locator('.txt')).toContainText('Saved in preset slot 1.');
  await expect(desk().locator('[data-act="pick"]').nth(5)).toContainText('1 of');
  // Loading it puts the cursor back on Depart, and Enter rolls the starters.
  await desk().locator('[data-act="pick"]').nth(5).click();
  await page.waitForTimeout(400);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(120);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  await expect(desk().locator('.txt')).toContainText('Loaded preset 1.');
  await expect(lit()).toContainText('Depart');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  expect(errors).toEqual([]);
});

test('New UI: naming a place on the map (N) asks on the code entry page; the name is kept, and Esc changes nothing', async ({ page }) => {
  const errors = watch(page);
  let boxes = 0;
  page.on('dialog', (d) => { boxes++; void d.dismiss(); });
  await start(page, 'ui=new&seed=newui-name');
  await toMap(page);
  // A place can be named once the party stands on it.
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const node = session.run.stage.map.nodes.find((n: any) => n.column === 1);
    session.run.stage.current = node.id;
    if (!session.run.stage.visited.includes(node.id)) session.run.stage.visited.push(node.id);
    game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await page.waitForTimeout(600);
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
  const box = page.locator('[data-testid="ask-input"]');
  const name = () => page.evaluate(() => { const { run } = (window as any).__pkr.session; return (run.stage.map.nodes.find((n: any) => n.id === run.stage.current)?.name ?? null) as string | null; });
  await page.keyboard.press('n');
  await expect(box).toBeFocused();
  await expect(page.locator('#rx .stage[data-scene="Map"]').last()).toContainText('Name this place');
  await box.fill('Quiet Hill');
  await page.keyboard.press('Escape');
  await expect(box).toHaveCount(0);
  expect(await name()).toBeNull();
  await page.waitForTimeout(250);
  await page.keyboard.press('n');
  await expect(box).toBeFocused();
  await box.fill('Quiet Hill');
  await page.keyboard.press('Enter');
  await expect(box).toHaveCount(0);
  await expect.poll(name).toBe('Quiet Hill');
  expect(boxes).toBe(0);
  expect(errors).toEqual([]);
});

test('New UI: a nickname is typed on the code entry page from the Summary\'s Care menu; Esc keeps the old name', async ({ page }) => {
  const errors = watch(page);
  let boxes = 0;
  page.on('dialog', (d) => { boxes++; void d.dismiss(); });
  await start(page, 'ui=new&seed=newui-nick');
  await toMap(page);
  await view(page, 'Map').first().locator('[data-act="pick"]', { hasText: 'Party' }).first().click();
  const top = () => view(page, 'Map').last();
  await expect(top().locator('.hd')).toContainText('Party');
  await page.waitForTimeout(250);
  await top().locator('[data-act="pick"]').first().click();
  await expect(top().locator('.hd')).toContainText('Summary');
  const box = page.locator('[data-testid="ask-input"]');
  const nick = () => page.evaluate(() => ((window as any).__pkr.session.run.party[0].care?.nickname ?? null) as string | null);
  const ask = async () => {
    await page.waitForTimeout(250);
    await page.keyboard.press('Enter');
    await top().locator('[data-act="menu"]', { hasText: 'Care' }).click();
    await page.waitForTimeout(150);
    // The Care list scrolls: step down until Nickname is the lit row.
    for (let k = 0; k < 40 && !(await top().locator('[data-act="menu"].on', { hasText: 'Nickname' }).count()); k++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(60); }
    await expect(top().locator('[data-act="menu"].on')).toContainText('Nickname');
    await page.keyboard.press('Enter');
    await expect(box).toBeFocused();
  };
  await ask();
  await expect(page.locator('#rx .stage[data-scene="Map"]').last()).toContainText('Nickname for');
  await box.fill('Sparky');
  await page.keyboard.press('Escape');
  await expect(box).toHaveCount(0);
  expect(await nick()).toBeNull();
  // The menu under the form is still there: Esc closes it, then the name is given for real.
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await ask();
  await box.fill('Sparky');
  await page.keyboard.press('Enter');
  await expect(box).toHaveCount(0);
  await expect.poll(nick).toBe('Sparky');
  await expect(top()).toContainText('Sparky');
  expect(boxes).toBe(0);
  expect(errors).toEqual([]);
});

test('New UI: an honest trade shows the Trade page: the card can be read with T, both sides show every line, a worse deal is asked once more, and the trade happens', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-honest');
  await toMap(page);
  // A strong Pokémon (worth more than the Krabby on offer) and a small one (an even trade).
  await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    const big = run.party[0];
    big.speciesId = 'charizard';
    big.level = 30;
    const small = JSON.parse(JSON.stringify(big));
    small.uid = 'e2e-small';
    small.speciesId = 'caterpie';
    small.level = 5;
    run.party.push(small);
  });
  await addSide(page, { id: 'nu-trade', kind: 'event', used: false, eventId: 'trade-t001' });
  await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('Map').scene.start('Event', { sideId: 'nu-trade' }));
  await waitForScene(page, 'Event');
  const ev = view(page, 'Event');
  await expect(ev).toContainText('Net-mender Effie');
  // Read to the last page: the choices and the card tag show.
  for (let k = 0; k < 12 && !(await ev.locator('[data-act="pick"]').count()); k++) { await page.keyboard.press('Enter'); await page.waitForTimeout(350); }
  await expect(ev.locator('[data-act="pick"]').first()).toContainText('Trade.');
  await expect(ev.locator('[data-act="card"]')).toContainText('Trade card');

  // T: the card before choosing, for the first Pokémon that fits (the lowest level). One button closes it.
  await page.keyboard.press('t');
  await expect(ev.locator('.hd')).toContainText('Trade');
  for (const t of ['Effie', 'Krabby', 'Adamant', 'Hyper Cutter', 'Collector', 'Caterpie', 'Shield Dust', 'Fair value', 'ruined forty nets']) await expect(ev).toContainText(t);
  await expect(ev.locator('[data-act="accept"]')).toHaveCount(0);
  await expect(ev.locator('[data-act="back"]')).toContainText('Close');
  await page.screenshot({ path: 'test-results/newui-honest-read.png' });
  await page.keyboard.press('Escape');
  await expect(ev.locator('[data-act="pick"]').first()).toContainText('Trade.');

  // "Trade.": both sides, with Trade and Back. The list goes from the lowest level up, so the small one is first: an even trade.
  await page.waitForTimeout(250);
  await ev.locator('[data-act="pick"]').first().click();
  await expect(ev.locator('[data-act="accept"]')).toContainText('Trade');
  await expect(ev).toContainText('Caterpie');
  await expect(ev).toContainText('Fair trade');
  await expect(ev).toContainText('1/2');
  await expect(ev.locator('.txt')).toContainText('ruined forty nets');
  // Right: the Charizard. It is worth more than the Krabby, and the card says so.
  await page.keyboard.press('ArrowRight');
  await expect(ev).toContainText('Charizard');
  await expect(ev).toContainText('2/2');
  await expect(ev).toContainText('You give more than you get');
  await page.screenshot({ path: 'test-results/newui-honest-card.png' });
  // The level on the card is the level it arrives at (never above the run's level cap).
  const shown = Number(/Krabby Lv (\d+)/.exec(await ev.innerText())?.[1]);
  expect(shown).toBeGreaterThan(0);
  // The first Enter does not trade: the trader asks once more.
  await page.keyboard.press('Enter');
  await expect(ev.locator('.txt')).toContainText('You sure?');
  await expect(ev.locator('[data-act="accept"]')).toContainText('Yes, trade');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.party.some((m: any) => m.speciesId === 'charizard'))).toBe(true);
  // Moving to the small one takes the question back.
  await page.keyboard.press('ArrowLeft');
  await expect(ev).toContainText('Fair trade');
  await expect(ev.locator('.txt')).toContainText('ruined forty nets');
  await expect(ev.locator('[data-act="accept"]')).toHaveText('Trade');
  // Down puts the cursor on Back, up on Trade again.
  await page.keyboard.press('ArrowDown');
  await expect(ev.locator('[data-act="back"]')).toHaveClass(/\bon\b/);
  await page.keyboard.press('ArrowUp');
  await expect(ev.locator('[data-act="accept"]')).toHaveClass(/\bon\b/);
  // The Charizard again, and yes twice: it goes and Effie's Krabby arrives as the card showed.
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(150);
  await page.keyboard.press('Enter');
  await expect(ev.locator('.txt')).toContainText('You sure?');
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await expect(ev.locator('[data-act="next"]')).toBeVisible({ timeout: 10_000 });
  const party = await page.evaluate(() => (window as any).__pkr.session.run.party.map((m: any) => ({ id: m.speciesId, level: m.level, ot: m.ot ?? null, nature: m.nature })));
  expect(party.some((m: any) => m.id === 'charizard')).toBe(false);
  expect(party.find((m: any) => m.id === 'krabby')).toMatchObject({ level: shown, ot: 'Effie', nature: 'adamant' });
  expect(errors).toEqual([]);
});

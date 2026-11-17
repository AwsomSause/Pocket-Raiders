import { expect, test } from '@playwright/test';
import { confirmToMenu } from './battleInput';
import { addSide, open, start, toMap, view, waitForScene, watch } from './helpers/newUi';

// The New UI's stops from the last pass (mock-up section 5): the shop's Buy 1 / Buy 5 and its Clerk, the fishing
// window over the map ("! A bite !"), a Pokémon Moment event with the party Pokémon standing beside the player, and the
// minigame's "Best" window; and from the battle section, the target picker's Back button. One of the New UI spec files (see newUi.spec.ts); the shared steps are in helpers/newUi.ts.

test('New UI: the shop is the mock-up shop page (Clerk, Buy 1 and Buy 5; Right lights Buy 5 and Enter buys five), and a fishing stop opens the mock-up "A bite!" window over the map', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-stops');
  await toMap(page);
  await addSide(page, { id: 'nu-shop', kind: 'shop', used: false });
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    pkr.session.run.money = 3500;
    pkr.session.visitSide('nu-shop');
    pkr.session.run.shop.type = 'mart';
    pkr.game.scene.getScene('Map').scene.start('Shop', { type: 'mart' });
  });
  await waitForScene(page, 'Shop');
  await page.waitForTimeout(250);
  const shop = view(page, 'Shop');
  await expect(shop.locator('.txt .nm')).toHaveText('Clerk');
  await expect(shop).toContainText('Welcome! Take your time.');
  await expect(shop.locator('.btn', { hasText: 'Buy 1' })).toHaveClass(/\bon\b/);
  await expect(shop.locator('.btn', { hasText: 'Buy 5' })).not.toHaveClass(/\bon\b/);
  const before = await page.evaluate(() => {
    const s = (window as any).__pkr.game.scene.getScene('Shop');
    const row = s.view().rows[0];
    return { id: row.itemId, price: row.price, money: (window as any).__pkr.session.run.money, have: (window as any).__pkr.session.run.inventory[row.itemId] ?? 0 };
  });
  await page.keyboard.press('ArrowRight');
  await expect(shop.locator('.btn', { hasText: 'Buy 5' })).toHaveClass(/\bon\b/);
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate((id) => (window as any).__pkr.session.run.inventory[id] ?? 0, before.id)).toBe(before.have + 5);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.money)).toBe(before.money - 5 * before.price);
  await expect(shop).toContainText('Bought 5');
  // Left goes back to Buy 1, and Enter then buys one.
  await page.keyboard.press('ArrowLeft');
  await expect(shop.locator('.btn', { hasText: 'Buy 1' })).toHaveClass(/\bon\b/);
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate((id) => (window as any).__pkr.session.run.inventory[id] ?? 0, before.id)).toBe(before.have + 6);
  await page.screenshot({ path: 'test-results/newui-shop.png' });
  await page.keyboard.press('Escape');
  await waitForScene(page, 'Map');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);

  await addSide(page, { id: 'nu-fish', kind: 'fish', used: false });
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').openFishing('nu-fish'));
  const win = page.locator('#rx .win', { hasText: '! A bite !' });
  await expect(win).toBeVisible();
  await expect(win).toContainText('Which one do you reel in?');
  await expect(win.locator('.hp.gold')).toHaveCount(1);
  await expect(win.locator('[data-act="pick"]').first()).toContainText(/Lv\s?\d+/);
  // The map stays on screen behind the window.
  await expect(view(page, 'Map').first()).toBeVisible();
  await page.screenshot({ path: 'test-results/newui-fishing.png' });
  await page.keyboard.press('Escape');
  await expect(win).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('New UI: a Pokémon Moment shows the party Pokémon beside the player (the mock-up moment page), and a minigame has the mock-up "Best" window', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-moment');
  await toMap(page);
  await addSide(page, { id: 'nu-moment', kind: 'event', used: false, eventId: 'pg2-any-road' });
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    pkr.session.run.party[0].speciesId = 'eevee';
    pkr.game.scene.getScene('Map').scene.start('Event', { sideId: 'nu-moment' });
  });
  await waitForScene(page, 'Event');
  const ev = view(page, 'Event');
  await expect(ev).toContainText('Any Road');
  await expect.poll(() => ev.evaluate((el) => el.innerHTML)).toContain('pokemon/133');
  expect(await ev.evaluate((el) => el.innerHTML)).toContain('/trainer/');
  await page.screenshot({ path: 'test-results/newui-moment.png' });

  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    run.phase = 'map';
    const node = run.stage.map.nodes.find((n: any) => n.id === run.stage.current);
    node.sides.push({ id: 'nu-mg', kind: 'minigame', minigameId: 'pokemon-memory', used: false });
    run.minigames.best['pokemon-memory'] = 'silver';
    pkr.session.beginMinigame('nu-mg', 1);
    pkr.game.scene.getScene('Event').scene.start('Minigame');
  });
  await waitForScene(page, 'Minigame');
  const mg = view(page, 'Minigame');
  await expect(mg).toContainText('Best');
  await expect(mg).toContainText('Silver');
  await page.screenshot({ path: 'test-results/newui-minigame.png' });
  expect(errors).toEqual([]);
});

test('New UI: in a triple battle the target picker is the mock-up one: the foes in reach, then Back (it returns to the moves)', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-target');
  await toMap(page);
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const run = session.run;
    for (const uid of ['p-t1', 'p-t2']) {
      const twin = structuredClone(run.party[0]);
      twin.uid = uid;
      run.party.push(twin);
    }
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.kind = 'trainer';
    node.sides = [];
    session.chooseNode(node.id);
    const battle = session.run.battle;
    while (battle.enemyTeam.length < 3) {
      const foe = structuredClone(battle.enemyTeam[0]);
      foe.uid = `e-t${battle.enemyTeam.length}`;
      battle.enemyTeam.push(foe);
    }
    const blank = (index: number) => ({ index, stages: structuredClone(battle.playerStages), vol: structuredClone(battle.playerVolatile) });
    battle.doubles = { player: blank(-1), enemy: blank(-1), swapped: { player: false, enemy: false }, refill: [], commanding: [], aims: {}, trio: { at: { player: 0, enemy: 0 }, player: [blank(-1), blank(1), blank(2)], enemy: [blank(-1), blank(1), blank(2)] } };
    battle.participants.push('p-t1', 'p-t2');
    game.scene.getScene('Map').scene.start('Battle');
  });
  await waitForScene(page, 'Battle');
  await confirmToMenu(page, 40_000);
  await page.waitForTimeout(400);
  const tab = () => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').tabs.current as string | null);
  if ((await tab()) !== null) {
    await page.keyboard.press('Escape');
    await expect.poll(tab).toBeNull();
  }
  const hud = view(page, 'Battle');
  // The first spot is the left one: its one-target move reaches two of the three foes.
  await hud.locator('[data-act="pick"]', { hasText: 'Fight' }).click();
  await expect(hud.locator('.btn.mv').first()).toBeVisible();
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  const picks = hud.locator('[data-act="pick"]');
  await expect(picks.last()).toHaveText('Back');
  await expect(hud.locator('.txt')).toContainText('on which Pokémon?');
  const targets = await picks.count();
  expect(targets).toBeGreaterThanOrEqual(3);
  await page.screenshot({ path: 'test-results/newui-target.png' });
  // A click on Back returns to the moves; no turn was played.
  const turn = await page.evaluate(() => (window as any).__pkr.session.run.battle.turn);
  await picks.last().click();
  await expect(hud.locator('.btn.mv').first()).toBeVisible();
  expect(await page.evaluate(() => (window as any).__pkr.session.run.battle.turn)).toBe(turn);
  expect(errors).toEqual([]);
});

test('New UI: Stand With Them shows the recruiter and what joining is worth, then the mock-up code-name card; a camp rest shows one of the team; a minigame stop lists its tiers and what each pays', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-stand');
  await toMap(page);
  await addSide(page, { id: 'nu-stand', kind: 'event', used: false, eventId: 'stand-with-recruiter' });
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    pkr.session.run.story.evil = { ...(pkr.session.run.story.evil ?? {}), teamId: 'rocket' };
    pkr.game.scene.getScene('Map').scene.start('Event', { sideId: 'nu-stand' });
  });
  await waitForScene(page, 'Event');
  await page.waitForTimeout(250);
  const ev = view(page, 'Event');
  await expect(ev).toContainText('Reputation +30 if you join');
  // The team's leader (who names you) stands in the picture.
  await expect.poll(() => ev.evaluate((el) => el.innerHTML)).toContain('giovanni');
  await ev.locator('[data-act="pick"]', { hasText: 'Join' }).click();
  for (const bit of ['Code Name', 'House Card', 'Provisional Agent 000', 'Team Rocket', '+30', 'Issued']) await expect(ev).toContainText(bit);
  await page.screenshot({ path: 'test-results/newui-code-name.png' });
  // Enter (or a click) moves on to what changed, as on any outcome page.
  await page.keyboard.press('Enter');
  await expect(ev).toContainText('Here is what changed.');
  await expect(ev.locator('.win', { hasText: 'Issued' })).toHaveCount(0);
  await expect(ev).not.toContainText('Reputation +30 if you join');
  // The outcome waits for the player (ALL EVENTS RULE): Enter until the map is back.
  for (let i = 0; i < 6 && (await page.evaluate(() => (window as any).__pkr.activeScene())) !== 'Map'; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
  }
  await waitForScene(page, 'Map');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);

  await addSide(page, { id: 'nu-camp', kind: 'event', used: false, eventId: 'camp-one-who-wont-eat' });
  await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('Map').scene.start('Event', { sideId: 'nu-camp' }));
  await waitForScene(page, 'Event');
  await expect(ev).toContainText('One bowl is still full');
  await expect.poll(() => ev.evaluate((el) => el.innerHTML)).toContain('/pokemon/');
  await page.screenshot({ path: 'test-results/newui-camp-rest.png' });

  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    run.phase = 'map';
    const node = run.stage.map.nodes.find((n: any) => n.id === run.stage.current);
    node.sides.push({ id: 'nu-tiers', kind: 'minigame', minigameId: 'pokemon-memory', used: false });
    pkr.game.scene.getScene('Event').scene.start('Map');
  });
  await waitForScene(page, 'Map');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
  await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('Map').openMinigame('nu-tiers'));
  // The tier list is its own layer over the map.
  const map = view(page, 'Map').filter({ hasText: 'attempts left' });
  await expect(map).toHaveCount(1);
  await expect(map.locator('[data-act="pick"]')).toHaveCount(4);
  for (const bit of ['Easy', 'Normal (your setting)', 'Hard', 'Master', '×1 money', 'Bronze', 'Kind', 'memory', 'Tiers', 'Easy, Normal, Hard, Master', 'None yet']) await expect(map).toContainText(bit);
  await page.screenshot({ path: 'test-results/newui-minigame-tiers.png' });
  expect(errors).toEqual([]);
});

test('New UI: the Research Tree is the mock-up tree page (a row per branch, the Unlock card), the arrows walk it and Enter researches; the Strange Merchant lists its prices', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-tree');
  await open(page, 'Hub');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    pkr.session.changeProfile((q: any) => ({ ...q, researchPoints: 100 }));
    pkr.game.scene.getScene('Hub').enter('tree');
  });
  const tree = page.locator('#rx .stage[data-scene="Hub"]', { hasText: 'Field Craft' }).last();
  for (const bit of ['Research Tree', '100 Research Points', 'Field Craft', 'Archive', 'Command', 'Field Notes', 'Scout Fund', 'Cost', 'Have', 'Unlock']) await expect(tree).toContainText(bit);
  await expect(tree.locator('.win.sel')).toContainText('Field Notes');
  await expect(tree.locator('.btn.on')).toHaveText('Unlock');
  await page.screenshot({ path: 'test-results/newui-research-tree.png' });
  // Down goes to the next branch's first node; Up and Enter research the first one.
  await page.keyboard.press('ArrowDown');
  await expect(tree.locator('.win.sel')).toContainText('Region Notes');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.session.profile.researchPoints)).toBe(80);
  // The hub comes back with the news; back in the tree the node reads Researched.
  await expect(page.locator('#rx .stage[data-scene="Hub"]', { hasText: 'Researched Field Notes.' })).toHaveCount(1);
  await page.waitForTimeout(500);
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Hub').enter('tree'));
  const again = page.locator('#rx .stage[data-scene="Hub"]', { hasText: 'Field Craft' }).last();
  await expect(again).toContainText('80 Research Points');
  await expect(again.locator('.btn', { hasText: 'Researched' })).toHaveCount(1);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Hub').enter('merchant'));
  const shop = page.locator('#rx .stage[data-scene="Hub"]', { hasText: 'Strange Merchant' }).last();
  await expect(shop.locator('[data-act="pick"]').first()).toContainText(/\d+ credits|Sold out/);
  expect(errors).toEqual([]);
});

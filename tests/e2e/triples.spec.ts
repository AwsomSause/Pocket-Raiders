import { expect, test, type Page } from '@playwright/test';

// Triple battles (Beta 0.6 T2, Kice's pick: Triple 2, Essentials Kit with the long foe box): three a side on screen, a command
// for each spot, the Shift option at the edges, "out of reach" in the target picker, and a reload keeps it a triple battle.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

async function toMap(page: Page) {
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Hub');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'TrainerSelect');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'RunPrep');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Briefing');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Map');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
}

const battleState = (page: Page) =>
  page.evaluate(() => {
    const b = (window as any).__pkr.session.run?.battle;
    return b ? { triples: Boolean(b.doubles?.trio), turn: b.turn, outcome: b.outcome, needsSwitch: b.needsSwitch } : null;
  });

const menuLabels = (page: Page) => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').menu?.config?.options?.map((o: any) => o.label) ?? null);

/** Starts a trainer fight on the first node and turns it into a triple battle (three a side), the way makeTriples does. */
async function startTriple(page: Page, seed: string) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/?seed=${seed}`);
  await waitForScene(page, 'MainMenu');
  await toMap(page);
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const run = session.run;
    run.archetypeId = 'red';
    for (const uid of ['p-t1', 'p-t2']) {
      const twin = structuredClone(run.party[0]);
      twin.uid = uid;
      run.party.push(twin);
    }
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.kind = 'trainer';
    session.chooseNode(node.id);
    const battle = session.run.battle;
    while (battle.enemyTeam.length < 3) {
      const foe = structuredClone(battle.enemyTeam[0]);
      foe.uid = `e-t${battle.enemyTeam.length}`;
      battle.enemyTeam.push(foe);
    }
    const blank = (index: number) => ({ index, stages: structuredClone(battle.playerStages), vol: structuredClone(battle.playerVolatile) });
    battle.doubles = {
      player: blank(-1),
      enemy: blank(-1),
      swapped: { player: false, enemy: false },
      refill: [],
      commanding: [],
      aims: {},
      trio: { at: { player: 0, enemy: 0 }, player: [blank(-1), blank(1), blank(2)], enemy: [blank(-1), blank(1), blank(2)] },
    };
    battle.participants.push('p-t1', 'p-t2');
    game.scene.getScene('Map').scene.start('Battle');
  });
  await waitForScene(page, 'Battle');
}

const onScreen = (page: Page) =>
  page.evaluate(() => {
    const s = (window as any).__pkr.game.scene.getScene('Battle');
    const d = s.duo;
    if (!d) return null;
    const count = (side: 'player' | 'enemy') => d.slots[side].filter((o: any) => o?.sprite?.active).length + ((side === 'player' ? s.playerSprite : s.enemySprite)?.active ? 1 : 0);
    return { size: d.size, player: count('player'), enemy: count('enemy') };
  });

for (const size of [
  { width: 960, height: 540 },
  { width: 1280, height: 720 },
  { width: 640, height: 900 },
]) {
  test(`a triple battle shows three a side at ${size.width}x${size.height}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.setViewportSize(size);
    await startTriple(page, `triples-${size.width}`);
    expect((await battleState(page))?.triples).toBe(true);
    // Through the opening, until the first command menu is up.
    await expect
      .poll(async () => {
        const labels = await menuLabels(page);
        if (labels?.[0] === 'Fight') return true;
        await page.keyboard.press('Enter');
        return false;
      }, { timeout: 60_000, intervals: [300] })
      .toBe(true);
    expect(await onScreen(page)).toEqual({ size: 3, player: 3, enemy: 3 });
    // The left Pokémon is asked first, and it can Shift to the centre.
    expect(await menuLabels(page)).toContain('Shift');
    await page.screenshot({ path: `test-results/triples-${size.width}x${size.height}.png` });
    // Aiming a one-target move (Tackle) from the left: the picker lists only the two foes in reach and tags the far one.
    await page.evaluate(() => {
      const { session, game } = (window as any).__pkr;
      game.scene.getScene('Battle').openTargetPicker({ kind: 'move', index: 0 }, session.content.moves.get('tackle'));
    });
    await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').reachTags.length), { timeout: 5_000 }).toBe(1);
    expect(await menuLabels(page)).toHaveLength(2);
    await page.screenshot({ path: `test-results/triples-${size.width}x${size.height}-target.png` });
    expect(errors).toEqual([]);
  });
}

test('a triple battle plays turns with a command for each spot, Shift moves an edge to the centre, and survives a reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await startTriple(page, 'triples-play');
  await expect
    .poll(async () => {
      const labels = await menuLabels(page);
      if (labels?.[0] === 'Fight') return true;
      await page.keyboard.press('Enter');
      return false;
    }, { timeout: 60_000, intervals: [300] })
    .toBe(true);

  // Left: Shift. Centre and right: Fight, first move, first target.
  const leftUid = await page.evaluate(() => (window as any).__pkr.session.run.party[(window as any).__pkr.session.run.battle.activeIndex].uid);
  const shiftAt = (await menuLabels(page))!.indexOf('Shift');
  await page.evaluate((i) => {
    const menu = (window as any).__pkr.game.scene.getScene('Battle').menu;
    menu.focus(i, false);
    menu.confirm();
  }, shiftAt);
  // The centre is asked next.
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').cmdSpot)).toBe(1);
  for (let i = 0; i < 80; i++) {
    const s = await battleState(page);
    if (!s || s.outcome || s.turn >= 2) break;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
  }
  // The left Pokémon now stands in the centre, on the screen and in the battle.
  const centre = await page.evaluate((uid) => {
    const s = (window as any).__pkr.game.scene.getScene('Battle');
    const run = (window as any).__pkr.session.run;
    if (!run.battle || run.battle.outcome) return null;
    return { shown: s.shownSpot('player', uid) };
  }, leftUid);
  if (centre) expect(centre.shown).toBe(1);

  for (let i = 0; i < 80; i++) {
    const s = await battleState(page);
    if (!s || s.outcome || s.turn >= 3) break;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
  }
  const after = await battleState(page);
  expect(after === null || after.outcome !== null || after.turn >= 2).toBe(true);

  if (after && !after.outcome) {
    await page.reload();
    await waitForScene(page, 'MainMenu');
    const saved = await page.evaluate(() => {
      const raw = Object.entries(localStorage).find(([k]) => k.endsWith('run'));
      const run = raw ? JSON.parse(raw[1] as string).data : null;
      return run?.battle ? Boolean(run.battle.doubles?.trio) : null;
    });
    expect(saved).toBe(true);
  }
  expect(errors).toEqual([]);
});

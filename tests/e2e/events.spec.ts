import { expect, test, type Page } from '@playwright/test';
import { EVENT_STYLES_READY } from '../../src/core/presentation/eventStyles';

// Map events: an event stop opens the animated event scene; a choice shows its outcome and goes back to
// the map with the stop used; a battle choice starts the battle; the scene fits several window sizes.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

async function toMap(page: Page) {
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
}

/** Stands the run on a first-column node with this event beside it and opens the event scene. */
async function openEvent(page: Page, eventId: string, sideId: string) {
  await page.evaluate(
    ([eventId, sideId]) => {
      const pkr = (window as any).__pkr;
      const run = pkr.session.run;
      const node = run.stage.map.nodes.find((n: any) => n.column === 1);
      node.sides.push({ id: sideId, kind: 'event', used: false, eventId });
      run.stage.current = node.id;
      run.stage.visited = [node.id];
      pkr.game.scene.getScene('Map').scene.start('Event', { sideId });
    },
    [eventId, sideId],
  );
  await waitForScene(page, 'Event');
  await page.waitForTimeout(1200); // cast slides in, cards pop in
}

test('an event stop plays its scene, applies a choice once and returns to the map', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=events-e2e');
  await waitForScene(page, 'MainMenu');
  await toMap(page);

  // The map already has event stops of its own (three to five, plus two rest spots).
  const stops = await page.evaluate(() => (window as any).__pkr.session.run.stage.map.nodes.flatMap((n: any) => n.sides).filter((s: any) => s.kind === 'event').length);
  expect(stops).toBeGreaterThanOrEqual(5);

  await openEvent(page, 'pokemon-center', 'e2e-center');
  await page.screenshot({ path: 'test-results/events-scene.png' });
  // The glass illustration frame, a risk line on every open card and the money pill.
  const look = await page.evaluate(() => {
    const scene = (window as any).__pkr.game.scene.getScene('Event');
    const all: any[] = [];
    const walk = (list: any[]) => list.forEach((o) => (all.push(o), o.list && walk(o.list)));
    walk(scene.children.list);
    return { frame: all.some((o) => o.name === 'event-frame'), risks: all.filter((o) => o.name === 'event-risk').map((o) => o.text), money: all.find((o) => o.name === 'event-money')?.text };
  });
  expect(look.frame).toBe(true);
  expect(look.risks.length).toBeGreaterThan(0);
  expect(look.risks.every((t: string) => /Certain|Depends on|Luck of the draw/.test(t))).toBe(true);
  expect(look.money).toMatch(/^₽\d+$/);
  for (const [w, h] of [[800, 450], [480, 800]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `test-results/events-scene-${w}x${h}.png` });
  }
  await page.setViewportSize({ width: 960, height: 540 });

  await page.keyboard.press('Enter'); // the first choice
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/events-outcome.png' });
  const used = await page.evaluate(() => (window as any).__pkr.session.run.stage.map.nodes.flatMap((n: any) => n.sides).find((s: any) => s.id === 'e2e-center').used);
  expect(used).toBe(true);
  // The outcome text waits for input and shows no rewards yet; it never leaves by itself.
  const chips = () => page.evaluate(() => {
    const sc = (window as any).__pkr.game.scene.getScene('Event');
    const all: any[] = [];
    const walk = (list: any[]) => list.forEach((o) => (all.push(o), o.list && walk(o.list)));
    walk(sc.children.list);
    return all.filter((o) => o.name === 'event-chip' && o.active).length;
  });
  expect(await scene(page)).toBe('Event');
  expect(await chips()).toBe(0);
  await page.keyboard.press('Enter'); // dismiss the text; the rewards appear
  await page.waitForTimeout(2500);
  expect(await scene(page)).toBe('Event');
  expect(await chips()).toBeGreaterThan(0);
  await page.keyboard.press('Enter'); // dismiss the rewards
  await waitForScene(page, 'Map');

  // The choice was saved: after a reload the stop is still used.
  await page.reload();
  await waitForScene(page, 'MainMenu');
  const afterReload = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('pkr.run')!);
    return raw.data.stage.map.nodes.flatMap((n: any) => n.sides).find((s: any) => s.id === 'e2e-center').used;
  });
  expect(afterReload).toBe(true);
  expect(errors).toEqual([]);
});

test('a battle choice at an event starts the battle', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=events-e2e-2');
  await waitForScene(page, 'MainMenu');
  await toMap(page);
  await openEvent(page, 'rm-2-key-cabin', 'e2e-cabin');
  await page.keyboard.press('Enter'); // Battle
  await page.waitForTimeout(1500);
  await page.keyboard.press('Enter'); // Enter: battle!
  await waitForScene(page, 'Battle');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.battle.event.eventId)).toBe('rm-2-key-cabin');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/events-battle.png' });
  expect(errors).toEqual([]);
});

// Run events redesign: every event style the player can pick draws the scene (frame, risk line,
// money pill), shows the stage's location art, and takes a choice back to the map.
test('every event style draws the event and takes a choice', async ({ page }) => {
  // One loop over every style (about 75 s on a quiet machine, the same before and after Dominion D1); a busy CI shard
  // ran out of the default 120 s at a different step each time. The checks are unchanged: only the time budget grows.
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=event-styles-e2e');
  await waitForScene(page, 'MainMenu');
  await toMap(page);
  for (const [i, style] of EVENT_STYLES_READY.entries()) {
    await page.evaluate((s) => ((window as any).__pkr.session.settings.eventStyle = s), style);
    await openEvent(page, 'rocket-ambush', `e2e-style-${i}`);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `test-results/event-style-${style}.png` });
    const look = await page.evaluate(() => {
      const scene = (window as any).__pkr.game.scene.getScene('Event');
      const all: any[] = [];
      const walk = (list: any[]) => list.forEach((o) => (all.push(o), o.list && walk(o.list)));
      walk(scene.children.list);
      return {
        frame: all.some((o) => o.name === 'event-frame'),
        risk: all.find((o) => o.name === 'event-risk')?.text ?? '',
        money: all.find((o) => o.name === 'event-money')?.text,
        art: all.some((o) => o.type === 'Image' && String(o.texture?.key).startsWith('pack.memories.eventbg.')),
      };
    });
    expect(look.frame, style).toBe(true);
    expect(look.risk, style).toMatch(/Certain|Depends on|Luck of the draw/);
    expect(look.money, style).toMatch(/^₽\d+$/);
    expect(look.art, style).toBe(true);
    // The last choice ("Bluff" etc. may be locked): walk up from the bottom to the first open one and take it.
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    const phase = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Event').phase);
    if (phase === 'outcome') {
      // The outcome text, then any changes, each wait for an input: press until the event closes.
      await expect
        .poll(async () => {
          if ((await scene(page)) === 'Event') await page.keyboard.press('Enter');
          return scene(page);
        }, { timeout: 15_000, intervals: [1000] })
        .not.toBe('Event');
    }
    // Back on the map for the next style (a battle choice is fine too: return to the map either way).
    await page.evaluate(() => {
      const g = (window as any).__pkr.game.scene;
      const s = g.getScenes(true)[0];
      if (s.scene.key !== 'Map') s.scene.start('Map');
    });
    await waitForScene(page, 'Map');
  }
  expect(errors).toEqual([]);
});

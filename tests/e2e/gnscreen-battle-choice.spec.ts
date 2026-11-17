import { expect, test, type Page } from '@playwright/test';
import { confirmUntil } from './battleInput';
import { addSide, scene, toCommands, toMap, waitForScene, watch } from './helpers/newUi';

// A choice in the middle of a battle (core/greenneedle/ask.ts), on the Crystal Golem (gn.32): ONE fight in three phases. Between
// phases the battle stops and asks "Drop a crystal." / "Keep everything." in its text box; in the third phase the menu has a new
// button, "Give it the crystals.", which ends the fight. Played with the keyboard, in the New UI and the Old one.

const labels = (page: Page): Promise<string[]> => page.evaluate(() => {
  const b = (window as any).__pkr.game.scene.getScene('Battle');
  return (b?.menu?.labels?.map?.((o: any) => String(o.text)) ?? []) as string[];
});
const has = (page: Page, label: string) => async () => (await labels(page)).some((l) => l.toLowerCase() === label.toLowerCase());
const flag = (page: Page, key: string) => page.evaluate((k) => Number((window as any).__pkr.session.run.story.flags[`ev:${k}`] ?? 0), key);

/** The Golem only splashes, and stands exactly on the line where its next phase begins: one turn played, and the phase turns. */
async function toLine(page: Page, share: number) {
  await page.evaluate((share) => {
    const run = (window as any).__pkr.session.run;
    const g = run.battle.enemyTeam[0];
    g.moves = [{ id: 'splash', pp: 40 }];
    (window as any).__golemMax ??= g.hp;
    g.hp = Math.floor((window as any).__golemMax * share);
    for (const m of run.party) m.hp = Math.max(m.hp, 1);
  }, share);
}

/** One turn from the command menu: Fight, then the first move (some skins put the moves straight on the menu: then one press is the move). */
async function fightTurn(page: Page) {
  const pick = () => page.evaluate(() => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    if (!b.menu || b.busy) return false;
    b.menu.focus(0, false);
    b.menu.confirm();
    return true;
  });
  await pick();
  await page.waitForTimeout(500);
  await pick();
}

async function playGolem(page: Page, query: string, shot: string | null) {
  const errors = watch(page);
  // The shared machine can take a while to boot the game: wait longer than the helpers do.
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/?${query}`);
  await waitForScene(page, 'MainMenu', 120_000);
  if (query.includes('ui=new')) await toMap(page);
  else for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await addSide(page, { id: 'gc-side', kind: 'event', used: false, eventId: 'gn-32-phase-1' });
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const f = session.run.story.flags;
    Object.assign(f, { 'ev:crystal-red': 2, 'ev:crystal-blue': 1, 'ev:crystal-bag': 3, 'ev:crystal-most': 1 });
    session.chooseEvent('gc-side', 0);
    game.scene.getScene('Map').scene.start('Battle');
  });
  await waitForScene(page, 'Battle');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.battle.eventRule.phases.length)).toBe(2);
  await toLine(page, 0.66);
  await toCommands(page);
  // One turn (Fight, the first move), and the second phase begins: the question comes before the next command.
  await fightTurn(page);
  await confirmUntil(page, has(page, 'Drop a crystal.'), 90_000);
  expect(await labels(page)).toHaveLength(2);
  const text = await page.evaluate(() => String((window as any).__pkr.game.scene.getScene('Battle').message.text));
  expect(text).toBe("It's looking at the bag again.");
  await page.waitForTimeout(500);
  if (shot) await page.screenshot({ path: shot });
  // "Drop a crystal." -> "Which one?": only the colours carried.
  await page.keyboard.press('Enter');
  await confirmUntil(page, has(page, 'The Red one.'), 20_000);
  expect((await labels(page)).map((l) => l.toLowerCase())).toEqual(['the red one.', 'the blue one.', 'the others.']);
  await page.keyboard.press('Enter');
  await confirmUntil(page, async () => (await flag(page, 'crystal-red')) === 1 && (await labels(page)).length > 0 && !(await has(page, 'The Red one.')()), 20_000);
  expect(await flag(page, 'crystal-most')).toBe(0);
  // The third phase: the question again (the second answer this time), then the new button on the menu.
  await toLine(page, 0.33);
  await fightTurn(page);
  await confirmUntil(page, has(page, 'Keep everything.'), 90_000).catch(async (e) => {
    throw new Error(`${e}: ${JSON.stringify(await page.evaluate(() => { const b = (window as any).__pkr.game.scene.getScene('Battle'); const r = (window as any).__pkr.session.run; return { labels: b.menu?.labels?.map((o: any) => o.text), text: b.message.text, busy: b.busy, fx: r.battle?.storyEffects, hp: r.battle?.enemyTeam[0].hp, turn: r.battle?.turn, phase: r.phase, mine: r.party.map((m: any) => m.hp) }; }))}`);
  });
  await page.evaluate(() => {
    const m = (window as any).__pkr.game.scene.getScene('Battle').menu;
    m.focus(1, false);
    m.confirm();
  });
  await confirmUntil(page, has(page, 'Give it the crystals.'), 20_000).catch(async (e) => {
    throw new Error(`${e}: ${JSON.stringify(await page.evaluate(() => { const b = (window as any).__pkr.game.scene.getScene('Battle'); const r = (window as any).__pkr.session.run; return { labels: b.menu?.labels?.map((o: any) => o.text), text: b.message.text, busy: b.busy, fx: r.battle?.storyEffects, turn: r.battle?.turn }; }))}`);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `test-results/visual/battle-choice-button-${shot ? 'new' : 'old'}.png` });
  await page.evaluate(() => {
    const m = (window as any).__pkr.game.scene.getScene('Battle').menu;
    const i = m.labels.findIndex((o: any) => String(o.text).toLowerCase() === 'give it the crystals.');
    m.focus(i, false);
    m.confirm();
  });
  // Giving them ends the fight.
  const t0 = Date.now();
  while ((await scene(page)) === 'Battle' && Date.now() - t0 < 40_000) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
  }
  expect(await scene(page)).not.toBe('Battle');
  expect(await flag(page, 'crystal-golem')).toBe(2);
  expect(await flag(page, 'crystal-golem-given')).toBe(1);
  expect(errors).toEqual([]);
}

test.describe('New UI', () => {
  // The picture for the report is taken at twice the size.
  test.use({ deviceScaleFactor: 2 });
  test('the Golem asks between phases, and "Give it the crystals." ends the fight', async ({ page }) => {
    test.setTimeout(420_000);
    await playGolem(page, 'seed=gnscreen-choice&campaign=dev&debug=1&ui=new', '/mnt/project-files/shots/gnscreens/battle-choice.png');
  });
});

test('Old UI: the same question and button', async ({ page }) => {
  test.setTimeout(420_000);
  await playGolem(page, 'seed=gnscreen-choice&campaign=dev&debug=1', null);
});

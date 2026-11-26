import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION redesign R4: the pass-50 battle pages with their own rules (core/dominion/bossFights.ts). Power gear and
// Pick a power (Start menu), Who steps in (a Boss raid at the door), Phase two and the team-up before it, the Betrayal
// before the Legendary, and the Snapshot. Shots go to the test's output folder for the side-by-side check against the
// mockups; R5_DUMP=1 also writes each page's markup.

test.use({ viewport: { width: 960, height: 540 } });

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);
const dom = (page: Page, f: string, arg: unknown = null) =>
  page.evaluate(([f, arg]) => { const s = (window as any).__pkr.game.scene.getScene('Dominion'); return s[f as string].call(s, arg); }, [f, arg] as const);
const fx = (page: Page, f: string, arg: unknown = null) =>
  page.evaluate(([f, arg]) => { const s = (window as any).__pkr.game.scene.getScene('Dominion').fx; return s[f as string].call(s, arg); }, [f, arg] as const);

async function restart(page: Page) {
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.run.battle = null;
    p.session.run.phase = 'map';
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  });
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
}

/** A founded crew on Day 6 (one power open) with two more members, at the HQ. */
async function daySix(page: Page) {
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'dominion' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Dominion');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.dominionStart({ types: ['poison', 'dark'], member: 'grunt', look: 0 });
    for (const t of ['open', 'toNight', 'rest', 'toDay']) p.session.dominionStep({ t });
    const b = p.session.run.expansion.dominion;
    b.day = 6;
    const m = structuredClone(b.members[0]);
    for (const [i, name] of ['Bram', 'Rosa'].entries()) b.members.push({ ...m, id: `${m.id}-${i + 2}`, name, team: m.team.map((x: any) => ({ ...x, uid: `${x.uid}-${i + 2}` })) });
  });
  await restart(page);
}

const doorFight = (page: Page, extra: Record<string, unknown> = {}) => page.evaluate((x) => {
  const b = (window as any).__pkr.session.run.expansion.dominion;
  b.field.fight = { why: 'rival', foe: 'rival', begun: false, action: 'boss-raid', target: 'boss', district: 'pewter', pass: false, big: false, wager: 0, racket: 'rocket', ...x };
}, extra);

test('power gear, pick a power, who steps in, phase two, the team-up, the Betrayal and the Snapshot', async ({ page }, info) => {
  test.setTimeout(180_000);
  const settle = Number(process.env.R5_SETTLE ?? 1500);
  const shot = async (n: string, wait = settle) => {
    await page.waitForTimeout(wait);
    await page.screenshot({ path: info.outputPath(`${n}.png`) });
    if (process.env.R5_DUMP) writeFileSync(info.outputPath(`${n}.html`), await page.locator('#r5').innerHTML());
  };
  const errors = watch(page);
  await start(page, 'ui=new&tutorial=0&moments=1');
  await daySix(page);
  const s = view(page, 'Dominion');

  // Power gear from the Start menu: one of four open on Day 6; Pick a power carries the Key Stone (a Mega Ring in the Bag).
  await dom(page, 'r5go', 'gear');
  await expect(s.getByTestId('dom-gear')).toContainText('1 of 4 unlocked');
  await expect(s.getByTestId('dom-gear-0')).toHaveClass(/\bon\b/);
  await shot('gear');
  await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('dom-gear-1')).toHaveClass(/\bon\b/);
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-power')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-power-line')).toContainText('Region 2');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-power-line')).toContainText('Key Stone on');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.inventory['mega-ring'])).toBe(1);
  await shot('power');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-gear')).toHaveCount(0);

  // The Boss at the door: Who steps in? Rosa (the third) fights first; the battle starts with the foe's lead hurt.
  await doorFight(page);
  await dom(page, 'fight', 'hq');
  await expect(s.getByTestId('dom-crewin')).toContainText('Who steps in?');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(s.getByTestId('dom-crewin-2')).toHaveClass(/\bon\b/);
  await shot('crewin');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  expect((await block(page)).field.fight.assist.by).toEqual([(await block(page)).members[2].id]);
  const lead = await page.evaluate(() => { const bt = (window as any).__pkr.session.run.battle; return bt.enemyTeam[bt.enemyIndex].hp; });
  expect(lead).toBeGreaterThan(0);

  // Phase two (as if phase one was won): the page, then the team-up, then the battle with the Boss's Attack up.
  await page.evaluate(() => { const b = (window as any).__pkr.session.run.expansion.dominion; b.field.fight = null; });
  await restart(page);
  await doorFight(page, { phase: 2 });
  await dom(page, 'fight', 'hq');
  await expect(s.getByTestId('dom-phase2')).toContainText('PHASE TWO');
  await shot('phase');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-teamup')).toBeVisible();
  await shot('teamup');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.battle.enemyStages.atk)).toBe(1);
  expect((await block(page)).field.fight.assist.by).toHaveLength(3);

  // The Betrayal: Archer turns, Mewtwo waits (a wild battle: it can be caught).
  await page.evaluate(() => { const b = (window as any).__pkr.session.run.expansion.dominion; b.field.fight = null; });
  await restart(page);
  await doorFight(page, { why: 'betrayal', foe: 'betrayal', action: null, target: 'mewtwo' });
  await dom(page, 'fight', 'hq');
  await expect(s.getByTestId('dom-legend')).toContainText('BETRAYAL');
  await expect(s.getByTestId('dom-legend-line')).toContainText('answers to me now');
  await shot('legend');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  const foe = await page.evaluate(() => (window as any).__pkr.session.run.battle);
  expect(foe.kind).toBe('wild');
  expect(foe.enemyTeam[0].speciesId).toBe('mewtwo');

  // The Snapshot after a big win: Save to album, and the Boss card counts it.
  await page.evaluate(() => {
    const b = (window as any).__pkr.session.run.expansion.dominion;
    b.field.fight = null;
    b.jobx = { ...(b.jobx ?? { called: null, album: [] }), snap: { d: 6, mine: 'charmander', foe: 'mewtwo', text: 'Charmander vs Mewtwo · Day 6' } };
  });
  await restart(page);
  await fx(page, 'afterFight', 'hq');
  await expect(s.getByTestId('dom-snap')).toContainText('Charmander vs Mewtwo');
  await shot('snap');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-snap')).toHaveCount(0);
  expect((await block(page)).jobx.album).toHaveLength(1);
  expect((await block(page)).jobx.snap).toBeNull();
  expect(errors).toEqual([]);
});

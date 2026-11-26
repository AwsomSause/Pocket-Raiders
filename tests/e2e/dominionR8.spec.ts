import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION redesign R8 (pass 50 of plans/evil-mode-rework/redesign-50): the Chair (mockups `chair`, `handoff`, `queue`,
// `favours`, `tally`, `night`) and the Empire (`takeover`, `fronts`, `broadcast`, `regions`, `world`, `holder`, `sail`,
// `johto`, `underworld`, `gymcase`, `ending`, `credits`, `infamy`). Shots are 960×540 for the side-by-side check against
// `?bare&still&pass=50&s=<id>`; R8_SHOTS=<dir> also writes them (and the page markup) there.

test.use({ viewport: { width: 960, height: 540 } });
test.setTimeout(300_000);

async function dayOne(page: Page) {
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
  });
}

async function pressUntil(page: Page, key: string, reached: () => Promise<boolean>) {
  await expect(async () => {
    if (!(await reached())) await page.keyboard.press(key);
    await expect.poll(reached, { timeout: 1500 }).toBe(true);
  }).toPass({ timeout: 15_000 });
}

/** Changes the saved block (and run), opens the Dominion screen again and Continues past the title. */
async function edit(page: Page, f: string, until = 'dom-phase') {
  await page.evaluate((src) => {
    const p = (window as any).__pkr;
    new Function('b', 'run', 'session', src)(p.session.run.expansion.dominion, p.session.run, p.session);
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  }, f);
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
  await pressUntil(page, 'Enter', () => view(page, 'Dominion').getByTestId(until).first().isVisible());
  await page.waitForTimeout(250);
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);

function shooter(page: Page, out: (n: string) => string) {
  return async (n: string) => {
    await page.waitForTimeout(Number(process.env.R8_WAIT ?? 6000));
    const dir = process.env.R8_SHOTS;
    await page.screenshot({ path: out(`${n}.png`) });
    if (dir) {
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: join(dir, `${n}.png`) });
      writeFileSync(join(dir, `${n}.html`), await page.locator('#r5').innerHTML().catch(() => ''));
    }
    // No text cut off and every sprite loaded (rule 3 of the build).
    const bad = await page.evaluate(() => {
      const out: string[] = [];
      for (const img of Array.from(document.querySelectorAll<HTMLImageElement>('#r5 img'))) if (img.complete && img.naturalWidth === 0) out.push(`img ${img.getAttribute('src')}`);
      for (const b of Array.from(document.querySelectorAll<HTMLElement>('#r5 .an > b'))) if (b.getBoundingClientRect().width === 0) out.push(`atlas ${b.parentElement?.getAttribute('data-a')}`);
      return out;
    });
    expect(bad, n).toEqual([]);
  };
}

const CREW = `
  const m0 = b.members[0];
  b.members.push({ ...structuredClone(m0), id: 'rosa', name: 'Rosa', rank: 'grunt', loyalty: 80 }, { ...structuredClone(m0), id: 'dale', name: 'Dale', rank: 'grunt' });
  b.teamName = 'Team Nova'; b.team = { name: 'Team Nova', primary: 'red', secondary: 'black', initial: 'N', logo: 'fang', motto: '', goal: 'total-takeover', day: 1 };
`;

test('R8 the Chair: a visitor, Hand it off, the waiting room, the favours, the Tally and the Night', async ({ page }, info) => {
  const shot = shooter(page, (n) => info.outputPath(n));
  const errors = watch(page);
  await start(page, 'ui=new&tutorial=0');
  await dayOne(page);
  await edit(page, `${CREW} for (const t of ['endDay']) session.dominionStep({ t }); const c = session.run.expansion.dominion.chair; if (c) c.tags = { rosa: 'favour' };`);
  const s = view(page, 'Dominion');
  await expect(s.getByTestId('dom-phase')).toHaveText('EVENING');

  // N: the Chair sits. The visitor stands at the desk with two answers and Hand it off.
  await pressUntil(page, 'KeyN', () => s.getByTestId('dom-chair-visitor').isVisible());
  await expect(s.getByTestId('dom-chair')).toContainText('of');
  await expect(s.getByTestId('dom-chair-a0')).toBeVisible();
  await expect(s.getByTestId('dom-chair-a1')).toBeVisible();
  await expect(s.getByTestId('dom-chair-top')).toContainText('Wheel');
  await shot('chair');
  const before = JSON.stringify(await block(page));

  // V: the waiting room; F the favour ledger; neither changes the run.
  await pressUntil(page, 'KeyV', () => s.getByTestId('r8-queue-0').isVisible());
  await shot('queue');
  await pressUntil(page, 'KeyF', () => s.getByTestId('r8-favours-back').isVisible());
  await shot('favours');
  expect(JSON.stringify(await block(page))).toBe(before);
  // Call it in: Rosa's Favour pays back money and cools the HQ, once.
  const funds = (await block(page)).funds;
  await s.getByTestId('r8-callin-0').dispatchEvent('click');
  await expect(s.getByTestId('dom-notice')).toContainText('Rosa pays the favour back');
  const called = await block(page);
  expect(called.funds).toBeGreaterThan(funds);
  expect(called.chair.tags.rosa).toBeUndefined();
  await expect(s.getByTestId('r8-callin-0')).toHaveCount(0);
  await pressUntil(page, 'Escape', () => s.getByTestId('r8-queue-0').isVisible());
  await pressUntil(page, 'Escape', () => s.getByTestId('dom-chair-visitor').isVisible());

  // 3: Hand it off, Esc back.
  await pressUntil(page, 'Digit3', () => s.getByTestId('dom-hand').isVisible());
  await shot('handoff');
  await pressUntil(page, 'Escape', () => s.getByTestId('dom-chair-visitor').isVisible());

  // Answer every visitor (1, then Enter for the next) until the Tally.
  await expect(async () => {
    if (await s.getByTestId('dom-tally').isVisible()) return;
    if (await s.getByTestId('dom-chair-result').isVisible()) await page.keyboard.press('Enter');
    else await page.keyboard.press('Digit1');
    await expect(s.getByTestId('dom-tally')).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 30_000 });
  await expect(s.getByTestId('dom-tally-net')).toContainText('NET');
  await shot('tally');

  // To the Night: the night shift page; Esc stays up (the HQ).
  await s.getByTestId('dom-tally-night').click();
  await expect(s.getByTestId('r8-night-rows')).toBeVisible();
  await expect(s.getByTestId('dom-phase')).toHaveText('NIGHT');
  await shot('night');
  await pressUntil(page, 'Escape', async () => !(await s.getByTestId('r8-night-rows').isVisible()));
  await expect(s.getByTestId('dom-phase')).toHaveText('NIGHT');
  expect(errors).toEqual([]);
});

const TAKEOVER = `b.funds = 60000; b.takeover = { goal: { track: 22, cost: 9, stage: 1, tp: null, done: false, lost: 0 }, last: {}, plan: 0, league: { elite: [], champion: false, studied: [], swayed: [], sway: 0 }, hold: {}, scouts: {}, chain: null, won: null, paths: [], taken: null, bcast: { queue: [], seen: [] }, cracked: false };`;
const TAKEN = `
  b.takeover = { goal: { track: 0, cost: 9, stage: 0, tp: null, done: false, lost: 0 }, last: {}, plan: 0, league: { elite: [], champion: false, studied: [], swayed: [], sway: 0 }, hold: {}, scouts: {}, chain: null, won: { path: 'shadow', day: b.day }, paths: ['shadow'], taken: { path: 'shadow', day: b.day }, bcast: { queue: [], seen: [] }, cracked: false };
  b.members[1].rank = 'executive'; b.members[2].rank = 'executive';
  b.funds = 54321;
  run.party[0].level = 36;
`;

test('R8 the Empire: Takeover, Holdings, the broadcast, the regions, the World, Underworld, Gyms, sailing and Johto', async ({ page }, info) => {
  const shot = shooter(page, (n) => info.outputPath(n));
  const errors = watch(page);
  await start(page, 'ui=new&tutorial=0');
  await dayOne(page);
  await edit(page, `${CREW} ${TAKEOVER}`);
  const s = view(page, 'Dominion');

  // K: Takeover night, four paths.
  await pressUntil(page, 'KeyK', () => s.getByTestId('dom-takeover').isVisible());
  for (const id of ['wipe', 'shadow', 'monarch', 'goal']) await expect(s.getByTestId(`dom-path-${id}`)).toBeVisible();
  await expect(s.getByTestId('dom-takeover-rib')).toBeVisible();
  await shot('takeover');
  await pressUntil(page, 'KeyP', () => s.getByTestId('dom-holdings').isVisible());
  await expect(s.getByTestId('dom-holding-reds-house-pallet')).toBeVisible();
  await shot('fronts');
  await pressUntil(page, 'Escape', () => s.getByTestId('dom-takeover').isVisible());
  await pressUntil(page, 'KeyK', () => s.getByTestId('dom-phase').isVisible());

  // The broadcast plays once for a town taken.
  await edit(page, "b.takeover.bcast.queue = ['pewter'];", 'dom-broadcast');
  await expect(s.getByTestId('dom-broadcast-head')).toContainText('Pewter');
  await shot('broadcast');
  await pressUntil(page, 'Enter', () => s.getByTestId('dom-phase').isVisible());

  // Kanto taken: G the regions, W the World, U the Underworld, Y the Gym case.
  await edit(page, TAKEN);
  await pressUntil(page, 'KeyG', () => s.getByTestId('dom-empire').isVisible());
  await expect(s.getByTestId('dom-empire-card-kanto')).toBeVisible();
  await expect(s.getByTestId('dom-empire-leave')).toContainText('Johto');
  await shot('regions');
  await pressUntil(page, 'KeyW', () => s.getByTestId('r8-island-kanto').isVisible());
  await shot('world');
  await pressUntil(page, 'Escape', () => s.getByTestId('dom-empire').isVisible());
  await pressUntil(page, 'KeyU', () => s.getByTestId('r8-underworld').isVisible());
  await expect(s.getByTestId('r8-team-rocket')).toBeVisible();
  await shot('underworld');
  await pressUntil(page, 'Escape', () => s.getByTestId('dom-empire').isVisible());
  await pressUntil(page, 'KeyY', () => s.getByTestId('r8-gymcase').isVisible());
  await shot('gymcase');
  await pressUntil(page, 'Escape', () => s.getByTestId('dom-empire').isVisible());

  // L: Pick the Holder (Rosa), then Sail with Dale.
  await pressUntil(page, 'KeyL', () => s.getByTestId('dom-leave-holders').isVisible());
  await s.getByTestId('dom-leave-holder-rosa').dispatchEvent('click');
  await shot('holder');
  await s.getByTestId('dom-leave-holder-rosa').dispatchEvent('click');
  await expect(s.getByTestId('dom-leave-go')).toContainText('Johto');
  await s.getByTestId('dom-leave-bring-dale').dispatchEvent('click');
  await shot('sail');
  await s.getByTestId('dom-leave-go').dispatchEvent('click');

  // Johto's arrival page.
  await expect(s.getByTestId('dom-opening')).toBeVisible();
  const b = await block(page);
  expect(b.realm.at).toBe('johto');
  expect(b.realm.held[0]).toMatchObject({ id: 'kanto', holder: { name: 'Rosa' } });
  await shot('johto');
  await pressUntil(page, 'Enter', async () => !(await s.getByTestId('dom-opening').isVisible()));

  // The held region's own page and its standing orders.
  await page.waitForTimeout(250);
  await pressUntil(page, 'KeyG', () => s.getByTestId('dom-empire').isVisible());
  await s.getByTestId('dom-empire-card-kanto').dispatchEvent('click');
  await s.getByTestId('dom-empire-card-kanto').dispatchEvent('click');
  await expect(s.getByTestId('dom-empire-kanto-orders')).toBeVisible();
  await shot('realm');
  await s.getByTestId('dom-empire-kanto-orders').dispatchEvent('click');
  await expect(s.getByTestId('dom-orders')).toBeVisible();
  await shot('orders');
  await pressUntil(page, 'Escape', async () => !(await s.getByTestId('dom-orders').isVisible()));

  // The Magnet Train back to Kanto: the pass, then the ride (the fare, Stability up).
  await edit(page, `b.phase = 'day'; b.funds = 5000; b.realm.held[0].stability = 50;`);
  await pressUntil(page, 'KeyG', () => s.getByTestId('dom-empire').isVisible());
  await s.getByTestId('dom-empire-card-kanto').dispatchEvent('click');
  await s.getByTestId('dom-empire-card-kanto').dispatchEvent('click');
  await s.getByTestId('dom-empire-kanto-magnet').dispatchEvent('click');
  await expect(s.getByTestId('r8-magnet')).toContainText('GOLDENROD');
  await shot('magnet');
  const stab = (await block(page)).realm.held[0].stability;
  await s.getByTestId('r8-magnet-ride').dispatchEvent('click');
  await expect(s.getByTestId('dom-notice')).toContainText('Magnet Train');
  const rode = await block(page);
  expect(rode.funds).toBe(5000 - 600);
  expect(rode.realm.held[0].stability).toBeGreaterThan(stab);
  expect(errors).toEqual([]);
});

const DONE = `
  b.takeover = { goal: { track: 100, cost: 2, stage: 4, tp: null, done: true, lost: 0 }, last: {}, plan: 0, league: { elite: [], champion: false, studied: [], swayed: [], sway: 0 }, hold: {}, scouts: {}, chain: null, won: { path: 'goal', day: b.day }, paths: ['goal'], taken: { path: 'goal', day: b.day }, bcast: { queue: [], seen: [] }, cracked: false };
  b.team = { name: 'Team Kettle', primary: 'crimson', secondary: 'gold', initial: 'K', logo: 'shield', motto: 'Up.', goal: 'everlasting', day: 1 };
  b.teamName = 'Team Kettle';
  const m0 = b.members[0];
  for (const [id, name] of [['rosa', 'Rosa'], ['dale', 'Dale'], ['ivy', 'Ivy'], ['ned', 'Ned']]) b.members.push({ ...structuredClone(m0), id, name, rank: 'executive' });
  b.annals = { from: 1, step: 1, funds: [800, 650, 1200, 2400, 1900, 3800, 5200] };
`;

test('R8 the Ending: the city at night, the Credits and the Hall of Infamy', async ({ page }, info) => {
  const shot = shooter(page, (n) => info.outputPath(n));
  const errors = watch(page);
  await start(page, 'ui=new&tutorial=0');
  await dayOne(page);
  await edit(page, DONE, 'dom-ending');
  const s = view(page, 'Dominion');
  await expect(s.getByTestId('dom-ending')).toContainText('FOREVER');
  await expect(s.getByTestId('dom-end-pay')).toContainText('Regions taken');
  await shot('ending');
  await pressUntil(page, 'KeyH', () => s.getByTestId('r8-infamy').isVisible());
  await shot('infamy');
  await pressUntil(page, 'Enter', () => s.getByTestId('dom-end-crew').isVisible());
  await expect(s.getByTestId('dom-end-crew')).toContainText('Rosa');
  await expect(s.getByTestId('dom-end-crew')).toContainText('Ned');
  await shot('credits');
  // Esc goes back to the city; nothing was closed yet.
  await pressUntil(page, 'Escape', () => s.getByTestId('dom-end-pay').isVisible());
  expect((await block(page)).takeover.taken).toBeTruthy();
  expect(errors).toEqual([]);
});

import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION redesign R2 (the HQ, pass 50 of plans/evil-mode-rework/redesign-50): one page per floor, Buy a plot, Build a
// room, the Staff Office and a post's file, Staff gear, the New floor reveal, the Laundromat, At a glance, The Mark and
// Lights out. Real play first (B opens the floor, P buys a plot, a room goes up on it, K posts Rook as the Auto-Checker),
// then a Compound set by hand like the mockups' (a picture check, not a rules check). Shots go to the test's output
// folder for the side-by-side check against the mockups (`?bare&still&pass=50&s=<id>`).

test.use({ viewport: { width: 960, height: 540 } });
if (process.env.R5_DUMP) test.setTimeout(300_000);

async function toHq(page: Page) {
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'dominion' });
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Dominion');
  const s = view(page, 'Dominion');
  await expect(s.getByTestId('dom-logo')).toBeVisible();
  await page.waitForTimeout(300);
  await s.getByTestId('dom-title-0').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-type-poison').click();
  await s.getByTestId('dom-type-dark').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-next').click();
  for (let i = 0; i < 4; i++) await s.getByTestId('dom-opening').click();
  await expect(s.getByTestId('r5-hq')).toBeVisible();
  return s;
}

const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion);
/** A chrome link (a mockup page id), as a tap on the capsule or a tile would send it. */
const go = (page: Page, id: string) => page.evaluate((x) => {
  const sc = (window as any).__pkr.game.scene.getScene('Dominion');
  sc.screen = 'hq';
  sc.r5go(x);
}, id);

test('the pass-50 HQ pages: floors, plots, rooms, the Staff Office, gear, the Laundromat, At a glance, The Mark, Lights out', async ({ page }, info) => {
  const shot = async (n: string) => {
    await page.waitForTimeout(process.env.R5_DUMP ? 6000 : 400);
    await page.screenshot({ path: info.outputPath(`${n}.png`) });
    if (process.env.R5_DUMP) writeFileSync(info.outputPath(`${n}.html`), await page.locator('#r5').innerHTML());
  };
  const errors = watch(page);
  await start(page, 'ui=new&tutorial=0');
  const s = await toHq(page);

  // B: the Ground Floor, the Loading Dock that came with it, three free plots and one plot for sale.
  await page.keyboard.press('KeyB');
  await expect(s.getByTestId('r5-lift-1')).toHaveClass(/\bon\b/);
  await expect(s.getByTestId('r5-tile-fix')).toContainText('Loading Dock');
  await expect(s.locator('.rb11.free5')).toHaveCount(3);
  await expect(s.locator('.strip11 h3')).toContainText('Ground Floor · 0 of 3 plots used · 1 for sale');
  // Six tiles, five at a time: ← wraps to the plot for sale at the end.
  await page.waitForTimeout(200);
  await page.keyboard.press('ArrowLeft');
  await expect(s.locator('.rb11.plot.on:not(.free5)')).toContainText('₽1,500');
  await page.keyboard.press('ArrowRight');
  // A tap on a free plot (the pointer picks it first) opens Build a room; the Bunk Room (₽800) goes up on the Ground Floor.
  await s.getByTestId('r5-tile-free-2').click();
  await page.waitForTimeout(150);
  if (!(await s.getByTestId('r5-build-grid').count())) await s.getByTestId('r5-tile-free-2').click();
  await expect(s.getByTestId('r5-build-grid')).toBeVisible();
  let n = 0;
  while (!(await s.getByTestId('dom-build-bunk-room').count()) && n++ < 40) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(120);
  }
  // The pointer picks the card, the tap builds it (as on the floor's tiles); it goes up on the Ground Floor.
  await s.getByTestId('dom-build-bunk-room').click();
  await page.waitForTimeout(150);
  if (await s.getByTestId('r5-build-grid').count()) await s.getByTestId('dom-build-bunk-room').click();
  await expect(s.getByTestId('dom-notice')).toContainText('Work starts on the Bunk Room');
  let b = await block(page);
  expect(b.funds).toBe(200);
  expect(b.hq.rooms[0]).toMatchObject({ id: 'bunk-room', floor: 1, building: true });
  await expect(s.getByTestId(`dom-room-${b.hq.rooms[0].uid}`)).toContainText('Building');
  // P: Buy a plot. The Ground Floor's costs ₽1,500: refused with the reason, nothing spent.
  await page.waitForTimeout(200);
  await page.keyboard.press('KeyP');
  await expect(s.getByTestId('r5-plot-1')).toContainText('₽1,500');
  await expect(s.getByTestId('r5-plot-2')).toContainText('Locked');
  await s.getByTestId('r5-buy-plot').click();
  await expect(s.getByTestId('dom-notice')).toContainText('Not enough money');
  expect((await block(page)).funds).toBe(200);
  // K: the Staff Office; Rook takes the Auto-Checker post (→ on the first rule).
  await page.waitForTimeout(200);
  await page.keyboard.press('KeyK');
  await expect(s.getByTestId('r5-staff-grid')).toBeVisible();
  await s.getByTestId('r5-post-checker').click();
  await expect(s.getByTestId('r5-post-checker')).toBeVisible();
  await page.waitForTimeout(200);
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('r5-fact-member')).toHaveText(/Rook/i);
  b = await block(page);
  expect(b.hq.staff.checker.member).toBe(b.members[0].id);
  // Esc twice: back to the HQ.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-hq')).toBeVisible();
  const before = await block(page);

  // A Compound like the mockups' (HQ Lv 3, three floors, the Staff Office staffed), drawn from a block set by hand.
  await page.evaluate(() => {
    const b = (window as any).__pkr.session.run.expansion.dominion;
    const room = (uid: string, id: string, floor: number, tier = 1) => ({ uid, id, tier, cond: 100, spent: 2000, building: false, up: false, ready: 0, shut: false, ruined: false, at: null, floor });
    const m0 = b.members[0];
    const crew = ['Dale', 'Gus', 'Bram', 'Rosa', 'Mina'].map((name, i) => ({ ...structuredClone(m0), id: `x${i}`, name, stats: { brawn: 6, nerve: 5, wits: 8, charm: 7, stealth: 4 } }));
    Object.assign(b, { hqLevel: 3, levelCap: 40, rosterCap: 8, teamName: 'Team Nova', funds: 4310, heat: 22, day: 18, phase: 'evening' });
    b.members = [m0, ...crew];
    b.hq.rooms = [room('y1', 'operations-room', 3, 2), room('y2', 'print-shop', 3), room('y3', 'front-office', 1), room('y4', 'recruitment-desk', 1), room('y5', 'bunk-block', 1),
      room('y6', 'holding-pens', 2), room('y7', 'treasury', 2), room('y8', 'training-room', 2, 2)];
    b.hq.plots = [0, 1, 0]; // one new Cellar plot, as on the mockups' Build a room
    b.hq.floorSeen = 3;
    b.hq.staff = { checker: { member: 'x4', gear: 2, on: true }, books: { member: 'x3', gear: 2, on: true }, care: { member: 'x0', gear: 1, on: true }, want: 'stealth', budget: 1, beds: 1, day: 0, log: [] };
    b.hq.clean = 1000;
  });
  for (const [id, name] of [['floor', 'floor'], ['floorg', 'floorg'], ['floorb', 'floorb'], ['plot', 'plot'], ['build', 'build'], ['staff', 'staff'], ['auto', 'auto'], ['staffgear', 'staffgear'], ['launder', 'launder'], ['glance', 'glance'], ['mark', 'mark']] as const) {
    await go(page, id);
    await expect(s.locator('#r5')).toBeVisible();
    if (id === 'glance') await expect(s.getByTestId('r5-glance-tiles')).toContainText('Heat');
    await shot(name);
  }
  // Lights out at night; Esc goes back without resting.
  await page.evaluate(() => { (window as any).__pkr.session.run.expansion.dominion.phase = 'night'; (window as any).__pkr.session.run.expansion.dominion.nightActions = 1; });
  await go(page, 'rest');
  await expect(s.getByTestId('r5-rest-card')).toContainText('LIGHTS OUT');
  await shot('rest');
  await page.keyboard.press('Escape');
  await page.evaluate(() => { (window as any).__pkr.session.run.expansion.dominion.phase = 'evening'; });
  // The New floor reveal waits on the HQ after an upgrade opens one.
  await page.evaluate(() => { (window as any).__pkr.session.run.expansion.dominion.hq.floorSeen = 2; });
  await go(page, 'hq');
  await expect(s.getByTestId('r5-newfloor-title')).toContainText('Upper Floor');
  await shot('newfloor');
  await go(page, 'hq');
  await shot('hq');

  // Reload: the real run (the Bunk Room, Rook on the post) is still there; the hand-set Compound was never saved.
  await page.goto('/?ui=new');
  await waitForScene(page, 'MainMenu');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.continueRun();
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  });
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
  expect(await block(page)).toEqual(before);
  // The applications desk (pass 50 `apps`; it opens on a Day, after the reload check): a talk scene.
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    for (const t of ['toNight', 'rest']) p.session.dominionStep({ t });
    const b = () => p.session.run.expansion.dominion;
    while (b().crew?.talks?.length) p.session.dominionStep({ t: 'talk', choice: 0 });
    if (b().field.fight) b().field.fight = null;
    p.session.dominionStep({ t: 'toDay' });
  });
  await go(page, 'apps');
  await expect(s.getByTestId('desk-calls')).toBeVisible();
  await expect(s.getByTestId('r5-apps')).toBeVisible();
  await shot('apps');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-hq')).toBeVisible();
  expect(errors).toEqual([]);
});

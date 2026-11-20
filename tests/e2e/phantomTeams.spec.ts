import { expect, test, type Page } from '@playwright/test';
import { start, waitForScene, watch } from './helpers/newUi';
import { fitProblems, onPage, pview } from './helpers/phantomUi';

// Phantom UI: the team's own moments (HOENN_TEAMS part 7) as Phantom pages: the Mission Briefing, the filed result,
// the Rank-Up, the Leader's Table and the Final Choice with its hold. The rules are the event's own.

const fits = async (page: Page, id: string) => { await page.waitForTimeout(900); expect(await fitProblems(page, 'Event', id)).toEqual([]); };
const version = (page: Page, id: string) => page.evaluate((id) => { const pkr = (window as any).__pkr; pkr.session.saveSettings({ ...pkr.session.settings, phantomVersion: id }); pkr.game.scene.getScene('Event').rx.refresh(); }, id);
const pageNow = (page: Page) => page.evaluate(() => document.querySelector('#phx .phs[data-scene="Event"]')?.getAttribute('data-scr') ?? null);
const flag = (page: Page, k: string) => page.evaluate((k) => Number((window as any).__pkr.session.run.story.flags[k] ?? 0), k);

async function toEvent(page: Page, eventId: string, flags: Record<string, number>, want: string): Promise<string[]> {
  const errors = watch(page);
  await start(page, 'debug=1&ui=phantom');
  await onPage(page, 'MainMenu', 'title');
  await page.evaluate(([id, f]) => {
    const { session, game } = (window as any).__pkr;
    session.newRun('red', 'e2e-hoenn-1');
    session.chooseStarter(0);
    const run = session.run;
    run.story.evil = { teamId: 'magma', beat: 6, stages: 6, nextAt: 6, heat: 0, ops: [], villains: {}, defector: false, end: 'none' };
    Object.assign(run.story.flags, f);
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push({ id: 'e2e-hoenn', kind: 'event', used: false, eventId: id });
    run.stage.current = node.id;
    run.stage.visited = [node.id];
    game.scene.getScenes(true)[0].scene.start('Event', { sideId: 'e2e-hoenn' });
  }, [eventId, flags] as const);
  await waitForScene(page, 'Event');
  // Read the opening pages; the team's own page shows after them.
  for (let k = 0; k < 14 && (await pageNow(page)) !== want; k++) { await page.keyboard.press('Enter'); await page.waitForTimeout(350); }
  await onPage(page, 'Event', want);
  await page.waitForTimeout(250);
  return errors;
}

test('Phantom UI: a Mission Briefing deals its ways as cards with every number; refusing files a report that stays until Enter', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = await toEvent(page, 'mg-op-ash-round', { 'ev:team-magma-inside': 1 }, 'brief');
  const brief = pview(page, 'Event', 'brief');
  for (const t of ['Order 08', 'The Ash Round', 'Standing', 'Suspicion', 'Noticed', '25%', 'The order']) await expect(brief).toContainText(t, { ignoreCase: true });
  await expect(brief.locator('.ph-bf-c')).toHaveCount(3);
  await expect(brief.locator('.ph-bf-c.on')).toHaveCount(1);
  await expect(brief.locator('.ph-bf-c').nth(0)).toHaveClass(/\bon\b/);
  await fits(page, 'brief');
  for (const [id, w, h] of [['midnight', 844, 390], ['channel', 1920, 1080], ['fantasia', 700, 900], ['velvet', 1280, 720]] as const) {
    await version(page, id);
    await page.setViewportSize({ width: w, height: h });
    await expect(page.locator(`#phx .phs[data-scene="Event"][data-scr="brief"][data-liv="${id}"]`)).toBeVisible();
    await fits(page, 'brief');
  }
  // The mouse lights a card; Enter takes the lit one. Refusing costs standing and files a report.
  await brief.locator('.ph-bf-c').nth(2).hover();
  await expect(brief.locator('.ph-bf-c').nth(2)).toHaveClass(/\bon\b/);
  await expect(brief.locator('.ph-bf-c').nth(2)).toContainText('Refuse', { ignoreCase: true });
  await page.keyboard.press('Enter');
  await onPage(page, 'Event', 'sy-result');
  await page.waitForTimeout(900);
  await page.keyboard.press('Enter');
  await onPage(page, 'Event', 'filed');
  const filed = pview(page, 'Event', 'filed');
  for (const t of ['Mission report', 'Refuse', 'Standing', 'Filed', 'The ash keeps falling']) await expect(filed).toContainText(t, { ignoreCase: true });
  await fits(page, 'filed');
  await page.setViewportSize({ width: 844, height: 390 });
  await fits(page, 'filed');
  await page.setViewportSize({ width: 1280, height: 720 });
  // It waits for the player.
  await page.waitForTimeout(1500);
  expect(await pageNow(page)).toBe('filed');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Map');
  expect(errors).toEqual([]);
});

test('Phantom UI: doing an order by the book raises your rank, shown as the RANK UP page', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = await toEvent(page, 'mg-op-ash-round', { 'ev:team-magma-inside': 1 }, 'brief');
  const before = await flag(page, 'ev:team-magma-standing');
  await page.keyboard.press('Enter');
  await onPage(page, 'Event', 'sy-result');
  expect(await flag(page, 'ev:team-magma-standing')).toBeGreaterThan(before);
  await page.waitForTimeout(900);
  await page.keyboard.press('Enter');
  await onPage(page, 'Event', 'rankup');
  const up = pview(page, 'Event', 'rankup');
  await expect(up.locator('.ru-t .rs').first()).toHaveAttribute('aria-label', 'RANK');
  for (const t of ['Team Magma', 'Pinned by', 'Missions']) await expect(up).toContainText(t, { ignoreCase: true });
  await expect(up.locator('.ru-n b')).toHaveText('2');
  await expect(up.locator('.ph-ru-crowd span')).toHaveCount(33);
  await fits(page, 'rankup');
  await version(page, 'velvet');
  await page.setViewportSize({ width: 700, height: 900 });
  await expect(page.locator('#phx .phs[data-scene="Event"][data-scr="rankup"][data-liv="velvet"]')).toBeVisible();
  await fits(page, 'rankup');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(1200);
  expect(await pageNow(page)).toBe('rankup');
  await up.locator('.ph-ru-say').click();
  await waitForScene(page, 'Map');
  expect(errors).toEqual([]);
});

test("Phantom UI: the Leader's Table shows the seats, the map and its pins; the lit plan moves its pin to the empty hills", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = await toEvent(page, 'mg-table', { 'ev:team-magma-inside': 1 }, 'table');
  const table = pview(page, 'Event', 'table');
  for (const t of ['The Leader’s Table', 'Leader Maxie', 'your chair', 'Fallarbor', 'Slateport', 'Lilycove', 'the empty hills', 'Noticed', 'Leave the pins where they are']) await expect(table).toContainText(t, { ignoreCase: true });
  await expect(table.locator('.ph-tb-seat')).toHaveCount(3);
  await expect(table.locator('.ph-tb-pin.gone')).toContainText('Fallarbor');
  await expect(table.locator('.ph-tb-pin.to')).toHaveCount(1);
  await fits(page, 'table');
  await page.keyboard.press('ArrowDown');
  await expect(table.locator('.ph-tb-pin.gone')).toContainText('Slateport');
  // The last plan moves nothing.
  await table.locator('.ph-tb-plan').last().hover();
  await expect(table.locator('.ph-tb-plan').last()).toHaveClass(/\bon\b/);
  await expect(table.locator('.ph-tb-pin.gone')).toHaveCount(0);
  await expect(table.locator('.ph-tb-pin.to')).toHaveCount(0);
  for (const [id, w, h] of [['midnight', 844, 390], ['fantasia', 1920, 1080]] as const) {
    await version(page, id);
    await page.setViewportSize({ width: w, height: h });
    await expect(page.locator(`#phx .phs[data-scene="Event"][data-scr="table"][data-liv="${id}"]`)).toBeVisible();
    await fits(page, 'table');
  }
  expect(errors).toEqual([]);
});

test('Phantom UI: the Final Choice is four corners and a ring of faces; a tap chooses nothing, a hold by key or by pointer does', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = await toEvent(page, 'mg-final-choice', { 'ev:team-magma-inside': 1, 'ev:team-magma-standing': 30 }, 'final');
  const fin = pview(page, 'Event', 'final');
  for (const t of ['Carry out the plan', 'Turn on the team', 'Take it all', 'Ottoway', 'Letting go cancels']) await expect(fin).toContainText(t, { ignoreCase: true });
  await expect(fin.locator('.ph-fc-c')).toHaveCount(4);
  await expect(fin.locator('.ph-fc-f')).not.toHaveCount(0);
  await fits(page, 'final');
  await version(page, 'channel');
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('#phx .phs[data-scene="Event"][data-scr="final"][data-liv="channel"]')).toBeVisible();
  await fits(page, 'final');
  await page.setViewportSize({ width: 1280, height: 720 });
  const phase = () => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Event').phase);
  // A tap is not enough: let go before two seconds and nothing is chosen.
  await page.keyboard.down('Enter');
  await page.waitForTimeout(600);
  await expect(fin.locator('.ph-fc-hold')).toContainText('Holding');
  await page.keyboard.up('Enter');
  await page.waitForTimeout(400);
  expect(await phase()).toBe('choose');
  await expect(fin.locator('.ph-fc-hold')).toContainText('Letting go cancels');
  // The same with the pointer on a corner: a short press cancels.
  const box = (await fin.locator('.ph-fc-c.c0').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(600);
  await expect(fin.locator('.ph-fc-hold')).toContainText('Holding');
  await page.mouse.up();
  await page.waitForTimeout(400);
  expect(await phase()).toBe('choose');
  // Held for two seconds: "Carry out the plan".
  await page.mouse.down();
  await expect.poll(phase, { timeout: 6000 }).toBe('outcome');
  await page.mouse.up();
  expect(await flag(page, 'ev:hoenn-final-plan')).toBe(1);
  expect(errors).toEqual([]);
});

import { expect, test, type Page } from '@playwright/test';
import { start, waitForScene, watch } from './helpers/newUi';
import { fitProblems, onPage, pview, toPhantomMap } from './helpers/phantomUi';

// Phantom UI: the map's pop pages (Rival Report, Notebook, Dossier, Field Notes, Town Roll) are Phantom pages that
// the same keys and clicks steer, and closing one leaves the map as it was.

const fits = async (page: Page, id: string) => { await page.waitForTimeout(900); expect(await fitProblems(page, 'Map', id)).toEqual([]); };
const version = (page: Page, id: string) => page.evaluate((id) => { const s = (window as any).__pkr.session; s.saveSettings({ ...s.settings, phantomVersion: id }); (window as any).__pkr.game.scene.getScene('Map').rxView.refresh(); }, id);
const state = (page: Page) => page.evaluate(() => { const m = (window as any).__pkr.game.scene.getScene('Map'); return { busy: m.busy as boolean, index: m.index as number }; });

test('Phantom UI: the Rival Report, Notebook, Dossier and Field Notes open as Phantom pages; keys and clicks steer them', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=newui-e2e');
  await onPage(page, 'MainMenu', 'title');
  await toPhantomMap(page);
  // A run that has met two rivals and some of Team Rocket, seen the Kanto track move and found a few notes.
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    run.regionOrder[run.regionIndex] = 'kanto';
    const cast = (id: string, status: string) => [id, { status, metAt: 3 }];
    const traits = { ambition: 50, pride: 50, empathy: 50, adaptability: 50, vindictiveness: 50, resilience: 50 };
    const rival = (id: string, classId: string, name: string) => ({
      id, classId, name, archetype: 'proud', style: 'rush', traits, rivalPotential: 20, state: 'recurring', arc: null, away: 0, cooldown: 0, progress: 0,
      encounters: 2, setbacks: 0, adaptations: [], seen: [], bonds: {}, offscreen: [], origin: { eventId: `e-${id}`, where: { region: 0, stage: 0, level: 1, node: null, battle: 0, turn: null }, path: 'spark' },
      memory: { lastBattle: { eventId: 'x', result: 'win', hpLeftShare: 0.5, turns: 5, team: ['rattata'] } },
    });
    const feelings = (friendship: number) => ({ friendship, respect: 5, trust: 3, rivalry: 8 - friendship, resentment: 1, admiration: 2 });
    run.story.rivals = [rival('u', 'youngster', 'Joey'), rival('v', 'lass', 'Mira')];
    run.expansion = {
      ...(run.expansion ?? {}),
      tracks: true,
      track: { kanto: { step: 2, peak: 3, applied: [], log: [] } },
      dossier: Object.fromEntries([cast('sc.rocket.matori', 'at large'), cast('sc.rocket.triad-surge', 'at large'), cast('sc.rocket.triad-koga', 'beaten'), cast('sc.rocket.madame-boss', 'at large'), cast('sc.aqua.amber', 'at large')]),
      grandArc: { roms: ['K'], late: [], stock: [1], left: [] },
      fieldNotes: { special: ['sv.rocket.roadblock', 'sv.rocket.ledger'], shadow: { 'ss.rocket.amberjack': 2 } },
      rival: {
        u: { role: 'main', personality: 'champion-chaser', style: 'rush', arc: 'x', lead: 1, marks: ['owes-you-one'], feelings: feelings(2), pityLosses: 0, presence: { '0': { meetings: 2, stepIn: true } } },
        v: { role: 'friend', personality: 'kind', style: 'rush', arc: 'x', lead: -1, marks: [], feelings: feelings(7), pityLosses: 0 },
      },
    };
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Map');
  await expect.poll(async () => (await state(page)).busy, { timeout: 15_000 }).toBe(false);
  await onPage(page, 'Map', 'map');
  const home = (await state(page)).index;
  const closed = async () => {
    await onPage(page, 'Map', 'map');
    expect(await state(page)).toEqual({ busy: false, index: home });
  };

  // Rival Report (R): the list, the lead, feelings and meetings; an arrow or a click changes rival.
  await page.keyboard.press('r');
  await onPage(page, 'Map', 'rivals');
  const rv = pview(page, 'Map', 'rivals');
  await expect(rv.locator('.rv')).toHaveCount(2);
  await expect(rv.locator('.rv.on b')).toHaveText('Joey');
  for (const bit of ['Rival Report', 'Joey is ahead by 1', 'Owes', '2 meetings, stepped in', 'Losing to a rival never ends your run.']) await expect(rv).toContainText(bit, { ignoreCase: true });
  await fits(page, 'rivals');
  await page.keyboard.press('ArrowDown');
  await expect(rv.locator('.rv.on b')).toHaveText('Mira');
  await expect(rv).toContainText('You lead by 1');
  await rv.locator('.rv').first().click();
  await expect(rv.locator('.rv.on b')).toHaveText('Joey');
  await version(page, 'midnight');
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('#phx .phs[data-scene="Map"][data-scr="rivals"][data-liv="midnight"]')).toBeVisible();
  await fits(page, 'rivals');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.keyboard.press('Escape');
  await closed();

  // Notebook (T): the step the region is on and what people say.
  await page.keyboard.press('t');
  await onPage(page, 'Map', 'track');
  const tk = pview(page, 'Map', 'track');
  await expect(tk.locator('.ph-tk-s.now')).toHaveCount(1);
  for (const bit of ['Notebook', 'Step 2', 'How much you’ve seen', 'Civilians say']) await expect(tk).toContainText(bit, { ignoreCase: true });
  await fits(page, 'track');
  await version(page, 'velvet');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await fits(page, 'track');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.keyboard.press('t');
  await closed();

  // Dossier (D): D is also "right", and that same press must not change folder. Arrows change folder and person.
  await page.keyboard.press('d');
  await onPage(page, 'Map', 'dossier');
  const dos = pview(page, 'Map', 'dossier');
  await expect(dos.locator('.ph-tabs span')).toHaveCount(2);
  const folder = (await dos.locator('.ph-tabs span.on').textContent()) ?? '';
  await page.waitForTimeout(400);
  await expect(dos.locator('.ph-tabs span.on')).toHaveText(folder);
  await page.keyboard.press('ArrowRight');
  await expect(dos.locator('.ph-tabs span.on')).not.toHaveText(folder);
  await dos.locator('.ph-tabs span', { hasText: /rocket/i }).click();
  await expect(dos.locator('.ph-dos-p')).toHaveCount(4);
  await expect(dos.locator('.ph-dos-file')).toContainText('Overheard');
  const first = await dos.locator('.ph-dos-file .tl1').textContent() ?? '';
  await page.keyboard.press('ArrowDown');
  await expect(dos.locator('.ph-dos-file .tl1')).not.toHaveText(first);
  await dos.locator('.ph-dos-p').first().click();
  await expect(dos.locator('.ph-dos-p').first()).toHaveClass(/\bon\b/);
  await fits(page, 'dossier');
  await version(page, 'channel');
  await page.setViewportSize({ width: 700, height: 900 });
  await fits(page, 'dossier');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.keyboard.press('Escape');
  await closed();

  // Field Notes (F): tabs across the top, entries down the side, the picked entry's page.
  await page.keyboard.press('f');
  await onPage(page, 'Map', 'notes');
  const nb = pview(page, 'Map', 'notes');
  await expect(nb.locator('.ph-tabs span')).toHaveCount(4);
  await expect(nb.locator('.ph-nb-row.on')).toHaveCount(1);
  await expect(nb.locator('.ph-nb-card')).toBeVisible();
  await fits(page, 'notes');
  const entry = await nb.locator('.ph-nb-card .tl1').textContent() ?? '';
  await page.keyboard.press('ArrowDown');
  await expect(nb.locator('.ph-nb-card .tl1')).not.toHaveText(entry);
  await page.keyboard.press('ArrowRight');
  await expect(nb.locator('.ph-tabs span.on')).toHaveText(/shadow/i);
  await expect(nb.locator('.ph-nb-pic.sh')).toHaveCount(1);
  await nb.locator('.ph-tabs span').nth(3).click();
  await expect(nb.locator('.ph-tabs span.on')).toHaveText(/keys/i);
  await version(page, 'fantasia');
  await page.setViewportSize({ width: 844, height: 390 });
  await fits(page, 'notes');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.keyboard.press('f');
  await closed();
  expect(errors).toEqual([]);
});

test('Phantom UI: the Town Roll opens with O as a Phantom page: cards for the spaces here, tags for the ones left out', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  // A seed whose first region is Kanto, so Stage 1 is Pewter City with Kanto Canon's spaces.
  await start(page, 'ui=phantom&seed=roll3');
  await onPage(page, 'MainMenu', 'title');
  await toPhantomMap(page);
  const before = await page.evaluate(() => JSON.stringify((window as any).__pkr.session.run.expansion.canon));
  await page.keyboard.press('o');
  await onPage(page, 'Map', 'roll');
  const roll = pview(page, 'Map', 'roll');
  for (const bit of ['Town Roll', 'Pewter City', 'Veridian Forest', 'Mt. Moon', 'Always here', 'Rolled', 'Not this run', 'optional spaces placed on the map', 'To the map']) await expect(roll).toContainText(bit, { ignoreCase: true });
  await expect(roll.locator('.ph-rl-c.on')).toHaveCount(1);
  await fits(page, 'roll');
  const text = await roll.locator('.ph-rl-say').textContent() ?? '';
  await page.keyboard.press('ArrowRight');
  await expect(roll.locator('.ph-rl-c').nth(1)).toHaveClass(/\bon\b/);
  // A left-out space can be looked at too, and says it is not here this run.
  await roll.locator('.ph-rl-off span').first().hover();
  await expect(roll.locator('.ph-rl-off span.on')).toHaveCount(1);
  await expect(roll.locator('.ph-rl-say')).toContainText('is not here this run');
  expect(text).not.toBe('');
  for (const [id, w, h] of [['midnight', 844, 390], ['velvet', 1920, 1080]] as const) {
    await version(page, id);
    await page.setViewportSize({ width: w, height: h });
    await expect(page.locator(`#phx .phs[data-scene="Map"][data-scr="roll"][data-liv="${id}"]`)).toBeVisible();
    await fits(page, 'roll');
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.keyboard.press('Enter');
  await onPage(page, 'Map', 'map');
  // Looking changes nothing.
  expect(await page.evaluate(() => JSON.stringify((window as any).__pkr.session.run.expansion.canon))).toBe(before);
  expect(errors).toEqual([]);
});

test('Phantom UI: a rival scene shows their team with R as a Phantom page; Enter closes it', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=e2e-borrow&campaign=dev&debug=1');
  await onPage(page, 'MainMenu', 'title');
  await toPhantomMap(page);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    run.story.rivals.push({
      id: 'r1', classId: 'rival', name: 'Okafor', state: 'active', rivalPotential: 5, encounters: 2, setbacks: 0,
      memory: { lastBattle: { eventId: 'e', result: 'win', hpLeftShare: 0.5, turns: 4, team: ['growlithe', 'pidgeotto'], levels: [31, 29], moves: [['ember', 'bite', 'flamethrower', 'agility'], ['gust', 'quick-attack']] } },
    });
    run.story.flags['ev:borrow-knows'] = 1;
    const node = run.stage.map.nodes.find((n: any) => n.column === 1);
    node.sides.push({ id: 'bt-side', kind: 'event', used: false, eventId: 'gn-new-29-after' });
    run.stage.current = node.id;
    run.stage.visited = [node.id];
    pkr.game.scene.getScene('Map').scene.start('Event', { sideId: 'bt-side' });
  });
  await waitForScene(page, 'Event');
  await page.waitForTimeout(1200);
  const before = await page.evaluate(() => document.querySelector('#phx .phs[data-scene="Event"]')?.getAttribute('data-scr'));
  await page.keyboard.press('r');
  await onPage(page, 'Event', 'scout');
  const sc = pview(page, 'Event', 'scout');
  await expect(sc.getByTestId('team-card')).toHaveCount(2);
  await expect(sc.getByTestId('team-card').first()).toContainText('Lv.31');
  for (const t of ['Okafor', 'Growlithe', 'Flamethrower', 'Pidgeotto', 'Quick Attack']) await expect(sc).toContainText(t, { ignoreCase: true });
  await page.waitForTimeout(900);
  expect(await fitProblems(page, 'Event', 'scout')).toEqual([]);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(900);
  expect(await fitProblems(page, 'Event', 'scout')).toEqual([]);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.keyboard.press('Enter');
  await onPage(page, 'Event', before ?? 'choice');
  await expect(page.getByTestId('team-card')).toHaveCount(0);
  expect(errors).toEqual([]);
});

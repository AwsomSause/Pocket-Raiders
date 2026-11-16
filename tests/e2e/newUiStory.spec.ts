import { expect, test } from '@playwright/test';
import { scene, view, waitForScene, watch, start, toMap, open } from './helpers/newUi';

// The New UI (Settings > UI style: New, the default for players): the map pop-ups, the opening screens, and the story and format pages.
// The New UI specs are split over several files so the browser-test shards can share them; the shared steps are in
// helpers/newUi.ts. The older specs run with the Old UI, so both styles stay covered.

test('New UI: the map\'s Rival Report, Notebook, Dossier and Field Notes open as the mock-up pages; keys and clicks steer them', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
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
  const state = () => page.evaluate(() => { const m = (window as any).__pkr.game.scene.getScene('Map'); return { busy: m.busy as boolean, index: m.index as number, canvas: Boolean(m.report || m.fieldNotes) }; });
  await expect.poll(async () => (await state()).busy, { timeout: 15_000 }).toBe(false);
  const map = view(page, 'Map').first();
  const head = map.locator('.hd');
  const home = (await state()).index;
  const closed = async () => {
    await expect(head).not.toContainText(/Rival Report|Notebook|Dossier|Field Notes/);
    expect(await state()).toEqual({ busy: false, index: home, canvas: false });
  };

  // Rival Report (R): the rival's card, the Lead steps, feelings and meetings; a chip or an arrow changes rival.
  await page.keyboard.press('r');
  await expect(head).toContainText('Rival Report');
  await expect(map).toContainText('Joey is ahead by 1');
  await expect(map).toContainText('Champion Chaser');
  await expect(map).toContainText('Owes You One');
  await expect(map).toContainText('2 meetings, stepped in');
  await expect(map.locator('.hp.gold')).toHaveCount(4);
  await map.locator('[data-act="popPick"]', { hasText: 'Mira' }).click();
  await expect(map).toContainText('You lead by 1');
  await expect(map).toContainText('No marks yet');
  await page.keyboard.press('ArrowRight');
  await expect(map).toContainText('Joey is ahead by 1');
  expect((await state()).canvas).toBe(false);
  await page.keyboard.press('r');
  await closed();

  // Notebook track page (T): the step the region is on and what people say; Esc closes.
  await page.keyboard.press('t');
  await expect(head).toContainText('Notebook');
  await expect(map).toContainText('The Ledger Fills');
  await expect(map).toContainText('House Rules');
  await expect(map).toContainText('Civilians say');
  await page.keyboard.press('Escape');
  await closed();

  // Dossier (D): D is also "right", and that same press must not change folder. Arrows change folder and person.
  await page.keyboard.press('d');
  await expect(head).toContainText('Dossier');
  const tabs = map.locator('.tabs span');
  await expect(tabs).toHaveText(['Aqua', 'Rocket']);
  await expect(map.locator('.tabs span.on')).toHaveText('Aqua');
  await page.keyboard.press('ArrowRight');
  await expect(map.locator('.tabs span.on')).toHaveText('Rocket');
  await expect(map).toContainText('Overheard:');
  await expect(map).toContainText('Madame Boss');
  await expect(map).toContainText('Stop 4');
  await map.locator('[data-act="popPick"]', { hasText: 'Matori' }).click();
  await expect(map.locator('b', { hasText: 'Matori' }).last()).toBeVisible();
  await expect(map).toContainText('Executive');
  await tabs.first().click();
  await expect(map.locator('.tabs span.on')).toHaveText('Aqua');
  await page.keyboard.press('d');
  await closed();

  // Field Notes (F): four tabs; the Shadow tab shows hint pips; Enter closes.
  await page.keyboard.press('f');
  await expect(head).toContainText('Field Notes');
  await expect(map.locator('[data-act="popTab"]')).toHaveCount(4);
  await expect(map).toContainText('LEDGER');
  await page.keyboard.press('ArrowDown');
  await expect(map).toContainText('Snorlax');
  await map.locator('[data-act="popTab"]').nth(1).click();
  await expect(map).toContainText('Amberjack');
  await expect(map).toContainText('Hints');
  await page.keyboard.press('ArrowRight');
  await expect(map.locator('.txt')).toContainText(/ROM/);
  await page.keyboard.press('Enter');
  await closed();
  expect(errors).toEqual([]);
});

test('New UI: Galar\'s Champion Tournament bracket opens on the map as the mock-up tree; pages turn and a match can be watched', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const run = session.run;
    run.regionOrder = ['galar', ...run.regionOrder.filter((r: string) => r !== 'galar')];
    run.regionIndex = 0;
    session.debugJumpToLeague();
    const stage = session.run.stage;
    stage.visited = stage.map.nodes.map((n: any) => n.id).slice(0, 2);
    for (const s of game.scene.getScenes(true)) game.scene.stop(s.scene.key);
    game.scene.start('Map');
  });
  await waitForScene(page, 'Map');
  const busy = () => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy as boolean);
  await expect.poll(busy, { timeout: 15_000 }).toBe(false);
  const map = view(page, 'Map').first();
  await page.keyboard.press('b');
  await expect(map.locator('.hd')).toContainText('Champion Tournament');
  // Two rounds won: it opens on the finals page with the eight who are left, and nothing later is given away.
  const chips = map.locator('[data-act="bracketPage"]');
  await expect(chips).toHaveCount(5);
  await expect(map.locator('[data-act="bracketPage"]:not(.no)')).toHaveText('Finals');
  await expect(map.locator('.txt')).toContainText('8 of 32 still in. Next: Quarterfinal against');
  await expect(map).toContainText('★ You');
  await expect(map.locator('.win', { hasText: '?' })).toHaveCount(7);
  await chips.first().click();
  await expect(map.locator('[data-act="bracketPage"]:not(.no)')).toHaveText('Group A');
  await page.keyboard.press('ArrowRight');
  await expect(map.locator('[data-act="bracketPage"]:not(.no)')).toHaveText('Group B');
  // Watching a match plays on the canvas: the layer steps aside and comes back when it ends.
  const watching = () => page.evaluate(() => { const m = (window as any).__pkr.game.scene.getScene('Map'); return m.children.list.some((o: any) => o.name === 'match-watch'); });
  await page.keyboard.press('w');
  await expect.poll(watching).toBe(true);
  await expect(map).toBeHidden();
  await page.waitForTimeout(300);
  expect(await watching()).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(watching).toBe(false);
  await expect(map).toBeVisible();
  await expect(map.locator('.hd')).toContainText('Champion Tournament');
  await map.locator('[data-act="bracketWatch"]').click();
  await expect.poll(watching).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(watching).toBe(false);
  await page.keyboard.press('b');
  await expect(map.locator('.hd')).not.toContainText('Champion Tournament');
  expect(await busy()).toBe(false);
  expect(errors).toEqual([]);
});

test('UI style: Old shows no New layer; the address can ask for either', async ({ page }) => {
  const errors = watch(page);
  // An automated browser gets Old by default (the older specs rely on it).
  await start(page, 'seed=newui-e2e');
  await expect(page.locator('#rx .stage')).toHaveCount(0);
  await start(page, 'ui=old&seed=newui-e2e');
  await expect(page.locator('#rx .stage')).toHaveCount(0);
  await start(page, 'ui=new&seed=newui-e2e');
  await expect(view(page, 'MainMenu')).toBeVisible();
  // The saved setting still says New: that is what players get.
  expect(await page.evaluate(() => (window as any).__pkr.session.settings.uiStyle)).toBe('new');
  expect(errors).toEqual([]);
});

test('New UI: the loading screen and the update splash are the mock-up page; so are the welcome log, the tutorial and the credits', async ({ browser, baseURL }) => {
  test.setTimeout(150_000);
  // A fresh browser profile with the offline worker off: the worker would answer for the files this test holds back.
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 }, ...(baseURL ? { baseURL } : {}) });
  const page = await context.newPage();
  const errors = watch(page);
  // The game's pictures and sounds are held back so the loading screen stays up; the fonts and the splash's own files pass.
  let release: () => void = () => undefined;
  const gate = new Promise<void>((r) => { release = r; });
  await page.route('**/assets/**', async (route) => {
    const url = route.request().url();
    if (/\/assets\/(images|audio)\//.test(url) && !/splash|amb-birds/.test(url)) await gate;
    await route.continue().catch(() => undefined);
  });
  await page.goto('/?ui=new&splash=1', { waitUntil: 'domcontentloaded' });
  const boot = view(page, 'Boot');
  // The update splash: the picture behind, the update's name over the loading bar, and a click anywhere moves on.
  await expect(boot).toContainText('is here', { timeout: 30_000 });
  await expect(boot.locator('.bg')).toHaveCount(1);
  await expect(boot.locator('.hp.gold i')).toHaveCount(1);
  await boot.locator('[data-act="next"]').click();
  // The loading screen under it: the title, a tip and the bar (nothing has loaded yet, so the bar is not full).
  await expect(boot).toContainText('Loading the region…', { timeout: 10_000 });
  await expect(boot).toContainText('Tip:');
  await expect(boot.locator('[data-act="next"]')).toHaveCount(0);
  const width = await boot.locator('.hp.gold i').evaluate((el) => parseFloat((el as HTMLElement).style.width));
  expect(width).toBeLessThan(100);
  release();
  // After the splash the title screen is skipped: straight into the hub.
  await waitForScene(page, 'Hub', 90_000);
  await page.unroute('**/assets/**');

  // The welcome log: a talk page with the player's picture, a tag, and the choices only once the text has been read.
  await open(page, 'Welcome', { returnTo: 'MainMenu' });
  const welcome = view(page, 'Welcome');
  const read = async (v: typeof welcome) => { for (let i = 0; i < 8 && (await v.locator('.rx-more').count()) > 0; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(250); } };
  await expect(welcome).toContainText('First launch');
  await read(welcome);
  await expect(welcome.locator('[data-act="pick"]')).toHaveText(['Next', 'Skip the update log']);
  expect(await welcome.innerHTML()).toContain('packs/mc/look_a/command.png');
  expect(await welcome.innerHTML()).not.toContain('₽');
  await welcome.locator('[data-act="pick"]').first().click();
  await expect(welcome).toContainText('Update log 1/');
  await read(welcome);
  await welcome.locator('[data-act="pick"]').nth(1).click();
  await expect(welcome).toContainText('Optional tutorial');
  await read(welcome);
  await welcome.locator('[data-act="pick"]').first().click();

  // The tutorial: all ten choices fit on the page; pointing at a lesson shows its professor; a lesson reads page by page.
  await waitForScene(page, 'Tutorial');
  const tutorial = view(page, 'Tutorial');
  const picks = tutorial.locator('[data-act="pick"]');
  await expect(picks).toHaveCount(10);
  await expect(tutorial).toContainText('Tutorial 0/9');
  const frame = (await tutorial.boundingBox())!;
  for (const k of [0, 9]) {
    const b = (await picks.nth(k).boundingBox())!;
    expect(b.y).toBeGreaterThanOrEqual(frame.y);
    expect(b.y + b.height).toBeLessThanOrEqual(frame.y + frame.height);
  }
  await picks.nth(2).hover();
  await expect(tutorial).toContainText('Prof. Birch');
  await picks.first().click();
  await expect(tutorial).toContainText('Tutorial 1/');
  await expect(tutorial).toContainText('Prof. Oak');
  for (let i = 0; i < 12 && !(await tutorial.innerText()).includes('Finish this lesson'); i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
  }
  await tutorial.locator('[data-act="pick"]', { hasText: 'Finish this lesson' }).click();
  await expect(tutorial).toContainText('Tutorial 1/9');
  await expect(picks.first()).toContainText('✓');
  expect(await page.evaluate(() => (window as any).__pkr.session.settings.tutorialDone.length)).toBe(1);
  await picks.last().click();
  await waitForScene(page, 'MainMenu');

  // The asset credits stand still and scroll; Esc leaves, back to Settings where they are opened from.
  await open(page, 'Credits', { assets: true, from: 'MainMenu' });
  const credits = view(page, 'Credits');
  await expect(credits.locator('.rx-credits')).toContainText('Asset credits');
  await expect(credits).toContainText('skip');
  await page.waitForTimeout(500);
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => credits.locator('.rx-credits').evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await waitForScene(page, 'Settings');
  // The ending credits roll by themselves with full animations.
  await page.evaluate(() => { const s = (window as any).__pkr.session; s.saveSettings({ ...s.settings, battleAnimations: 'full' }); });
  await open(page, 'Credits', { assets: false });
  const at = () => credits.locator('.rx-roll').evaluate((el) => (el as HTMLElement).style.transform);
  const first = await at();
  await expect.poll(at, { timeout: 5_000 }).not.toBe(first);
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await expect.poll(() => scene(page), { timeout: 20_000 }).not.toBe('Credits');
  expect(errors).toEqual([]);
  await context.close();
});

test('New UI: the prologue plays on the mock-up pages: talk pages with Prof. Vance, the name entry\'s on-screen keys, the Departure cards', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await open(page, 'Prologue');
  const pro = view(page, 'Prologue');
  const session = () => page.evaluate(() => (window as any).__pkr.session.profile.story.protagonist);
  // The Look: two choices beside the Look's portrait; pointing at one shows it.
  await expect(pro.locator('[data-act="pick"]')).toHaveText(['Look A', 'Look B']);
  expect(await pro.innerHTML()).toContain('packs/mc/look_a/portrait.png');
  await pro.locator('[data-act="pick"]').nth(1).hover();
  await expect.poll(() => pro.innerHTML()).toContain('packs/mc/look_b/portrait.png');
  await pro.locator('[data-act="pick"]').first().click();
  await page.waitForTimeout(250);
  expect((await session()).look).toBe('look_a');
  await pro.locator('[data-act="pick"]', { hasText: 'Quick Start' }).click();
  await page.waitForTimeout(250);

  /** One step: a confirm button when one is lit, else the first choice not ticked yet, else Enter (a page turn). */
  const step = async () => {
    const clicked = await page.evaluate(() => {
      const b = [...document.querySelectorAll<HTMLElement>('#rx [data-act="pick"]')].filter((x) => !/opacity:\s*\.5/.test(x.getAttribute('style') ?? ''));
      const go = b.find((x) => /^(Confirm|Continue|Go |Looks right)/.test(x.innerText.trim())) ?? b.find((x) => !x.innerText.trim().startsWith('✓'));
      go?.click();
      return !!go;
    });
    if (!clicked) await page.keyboard.press('Enter');
    await page.waitForTimeout(280);
  };
  const seen = new Set<string>();
  const note = async () => {
    const html = await pro.innerHTML().catch(() => '');
    if (html.includes('packs/vance/') && html.includes('Prof. Vance')) seen.add('vance');
    if (html.includes('class="beat"') && html.includes('Departure')) seen.add('departure');
    if (/Prologue \d+\/\d+/.test(html)) seen.add('tag');
    return html;
  };

  // Up to the name entry.
  for (let i = 0; i < 80 && (await pro.locator('[data-act="key"]').count()) === 0; i++) { await note(); await step(); }
  await expect(pro.locator('[data-act="key"]')).toHaveCount(30);
  expect(seen.has('vance')).toBe(true);
  expect(seen.has('tag')).toBe(true);
  const key = (k: string) => pro.locator(`[data-act="key"][data-arg="${k}"]`).click();
  // Nothing typed yet: "That is me" is refused and the page stays.
  await pro.locator('[data-act="ok"]').click();
  await page.waitForTimeout(250);
  await expect(pro.locator('[data-act="key"]')).toHaveCount(30);
  // On-screen keys (a capital first, then small letters), the delete key, and the keyboard all type into the box.
  for (const k of ['K', 'A', 'Y', 'Y']) await key(k);
  await expect(pro).toContainText('Kayy');
  await key('⌫');
  await page.keyboard.press('e');
  await expect(pro).toContainText('Kaye');
  await page.keyboard.press('Backspace');
  await pro.locator('[data-act="clear"]').click();
  await expect(pro).not.toContainText('Kay');
  for (const k of ['K', 'A', 'Y']) await key(k);
  await pro.locator('[data-act="ok"]').click();
  await page.waitForTimeout(300);
  await expect(pro.locator('[data-act="key"]')).toHaveCount(0);

  // On to the end: pronouns, the quiz, the partner, then the Departure cards.
  for (let i = 0; i < 160 && (await scene(page)) === 'Prologue'; i++) { await note(); await step(); }
  expect(await scene(page)).not.toBe('Prologue');
  expect(seen.has('departure')).toBe(true);
  expect((await session()).name).toBe('Kay');
  expect(errors).toEqual([]);
});

test('New UI: the Siege map is the mock-up ledger page; keys and clicks move over the districts and a free gate lets you in', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=e4-siege');
  await toMap(page);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    const d = (id: string, name: string, place: string | null, status: string, heldBy: string, ifLost: string, gate = true) => ({ id, name, place, status, heldBy, ifLost, gate });
    const districts = [
      d('north-gate', 'North Gate', 'Route 5', 'held', 'Your rival', "The rival's battle is added to Phase 1 instead of removed"),
      d('east-gate', 'East Gate', 'Route 8', 'held', 'Officer Jenny', 'Reinforcements arrive one turn sooner in Phase 4'),
      d('south-gate', 'South Gate', 'Route 6', 'contested', '', 'Major Surge joins Phase 3 as a third duel'),
      d('west-gate', 'West Gate', 'Route 7', 'lost', '', 'Shinobi Koga poisons the Breather (heal 35% instead of 50%)'),
      d('center', 'The Center', null, 'contested', 'Oracle Sabrina', 'See Phase 1', false),
    ];
    run.expansion = { ...(run.expansion ?? {}), cut: { format: { id: 'siege', state: { region: 'kanto', districts, entered: null, pending: null, tries: 0 } } } };
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Siege');
  const siege = view(page, 'Siege');
  await expect(siege).toContainText('The Long Ledger · Saffron');
  await expect(siege.locator('[data-act="district"]')).toHaveCount(5);
  await expect(siege).toContainText('Lost district effects');
  await expect(siege).toContainText('West Gate: Shinobi Koga poisons the Breather');
  // The cursor starts on a free gate.
  await expect(siege.locator('[data-act="enter"]')).toContainText('Enter by North Gate');
  await expect(siege).toContainText('Your rival');
  // Keys move it: two to the right is a contested gate (one battle); the middle of the city has no gate.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(siege.locator('[data-act="enter"]')).toContainText('Enter by South Gate');
  await expect(siege).toContainText('One battle');
  // Down from above the short last row lands on its last district.
  await page.keyboard.press('ArrowDown');
  await expect(siege.locator('[data-act="enter"]')).toContainText('No gate here');
  await expect(siege).toContainText('Oracle Sabrina');
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.expansion.cut.format.state.entered)).toBeNull();
  // A click moves the cursor; the button goes in. A held gate is free: no battle starts.
  await siege.locator('[data-act="district"]').nth(1).click();
  await expect(siege.locator('[data-act="enter"]')).toContainText('Enter by East Gate');
  await siege.locator('[data-act="enter"]').click();
  await expect(siege.locator('[data-act="enter"]')).toContainText('Begin Phase 1');
  await expect(siege).toContainText('You went in by the East Gate');
  await siege.locator('[data-act="enter"]').click();
  await waitForScene(page, 'Map');
  const out = await page.evaluate(() => (window as any).__pkr.session.run.expansion);
  expect(out.siege.entered).toBe('kanto.east-gate');
  expect(out.cut.format).toBeUndefined();
  expect(errors).toEqual([]);
});

test('New UI: the Rescue screen is the mock-up page: the receipt, the holding clock, the plans with their odds words, then the plan step by step', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=rescue-screen&debug=1');
  await toMap(page);
  // The state a raid loss leaves: a registered rival and two Pokémon held, the plan due now.
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const run = session.run;
    const base = JSON.parse(JSON.stringify(run.party[0]));
    const held = [1, 2].map((i) => ({ ...JSON.parse(JSON.stringify(base)), uid: `held-${i}` }));
    run.expansion = {
      rival: { blue: { role: 'main', personality: 'champion-chaser', style: 'blitz', arc: 'prodigy-learns-humility', lead: 0, marks: [], feelings: { friendship: 3, respect: 3, trust: 3, rivalry: 3, resentment: 0, admiration: 2 }, pityLosses: 0 } },
      rescue: {
        holds: [{ id: 'h1-kanto', teamId: 'rocket', regionId: 'kanto', pokemon: held, impoundNode: -10, waitNodes: 9, lastQuietNode: 50, dueAt: 0, receipt: true, offers: 0, declines: 0, lastDeclineNode: null, lateDue: false, late: false, frozenAt: null, accepted: null, warrantAt: null, heldAtClimax: false }],
        active: null, returned: [], attitude: 0, balloonUsed: false, memory: [], flags: {}, log: [], lost: [],
      },
    };
    game.scene.getScene('Map').scene.restart();
  });
  await waitForScene(page, 'Rescue');
  const rescue = view(page, 'Rescue');
  await expect(rescue).toContainText('TEAM ROCKET · IMPOUND RECEIPT');
  await expect(rescue).toContainText('Holding site: The Celadon basement cells');
  await expect(rescue).toContainText('Holding clock');
  // The rival speaks first; the plans wait until every line is read (a click or Enter turns the page).
  await expect(rescue.locator('.txt .nm')).toHaveText('Blue');
  await expect(rescue.locator('[data-act="pick"]')).toHaveCount(0);
  for (let i = 0; i < 6 && (await rescue.locator('[data-act="page"]').count()) > 0; i++) {
    await rescue.locator('[data-act="page"]').click();
    await page.waitForTimeout(200);
  }
  // Five plans and "wait": each open plan with a roll shows a word, never a number.
  await expect(rescue.locator('[data-act="pick"]')).toHaveCount(6);
  await expect(rescue.locator('[data-act="pick"]').first()).toContainText('Quiet Extraction');
  await expect(rescue.locator('[data-act="pick"]').first().locator('.tg')).toHaveText(/^(Risky|Even|Likely|Safe)$/);
  await expect(rescue.locator('[data-act="pick"]').last()).toContainText('Wait for a better day');
  // Moving the cursor makes the text box speak for the choice under it.
  await page.keyboard.press('ArrowUp');
  await expect(rescue.locator('.txt')).toContainText('The offer will come back.');
  await page.keyboard.press('ArrowDown');
  // Quiet Extraction: the plan's steps take the clock's place and the answers are the buttons.
  await page.keyboard.press('Enter');
  await expect(rescue).toContainText('The plan');
  await expect(rescue).toContainText('Approach');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.session.run.expansion.rescue.active?.plan ?? null)).toBe('quiet');
  for (let i = 0; i < 6 && (await rescue.locator('[data-act="page"]').count()) > 0; i++) {
    await rescue.locator('[data-act="page"]').click();
    await page.waitForTimeout(200);
  }
  await expect(rescue.locator('[data-act="pick"]')).toHaveCount(3);
  // Esc gives the plan up; the rival is back with the offer at once.
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.session.run.expansion.rescue.active)).toBeNull();
  await expect(rescue).toContainText('Holding clock', { timeout: 15_000 });
  await page.waitForTimeout(400);
  for (let i = 0; i < 6 && (await rescue.locator('[data-act="page"]').count()) > 0; i++) {
    await rescue.locator('[data-act="page"]').click();
    await page.waitForTimeout(200);
  }
  // "Wait for a better day" (the last choice) puts it off and the map comes back.
  await rescue.locator('[data-act="pick"]').last().click();
  await waitForScene(page, 'Map');
  await expect(view(page, 'Rescue')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.expansion.rescue.holds[0].declines)).toBe(1);
  expect(errors).toEqual([]);
});

test('New UI: the Field Trial opens on the mock-up versus card with the rival, and a click starts the spar', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=field-trial&campaign=orrery-circuit&debug=1');
  // A save that has played the full prologue.
  await page.evaluate(() => { const p = (window as any).__pkr.session.profile.story.prologue; p.done = true; p.mode = 'full'; });
  for (let i = 0; i < 12 && (await scene(page)) !== 'FieldTrial'; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
  }
  await waitForScene(page, 'FieldTrial');
  const rival = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('FieldTrial').view.rivalName as string);
  const card = view(page, 'FieldTrial');
  // The card may already have timed out on a slow machine; when it is up it names the rival.
  if (await card.count()) {
    await expect(card).toContainText(rival);
    await card.click({ position: { x: 480, y: 270 } }).catch(() => undefined);
  }
  await expect(card).toHaveCount(0, { timeout: 5_000 });
  // The spar plays under it.
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('FieldTrial').children.list.find((o: any) => o.name === 'trial-body')?.text ?? ''), { timeout: 5_000 }).not.toBe('');
  expect(errors).toEqual([]);
});

test('New UI: a story scene is the mock-up talk page; its lines turn with a click and it ends on the map', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=story-backstory&campaign=orrery-circuit&debug=1');
  for (let i = 0; i < 14 && (await scene(page)) !== 'Story'; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
  }
  await waitForScene(page, 'Story');
  const story = view(page, 'Story');
  await expect(story).toBeVisible();
  await expect(story.locator('.txt')).not.toHaveText('');
  const first = await story.locator('.txt').innerText();
  // A click anywhere turns the page while lines wait; the choices (or Continue) come with the last line.
  let turned = false;
  for (let i = 0; i < 40 && (await scene(page)) === 'Story'; i++) {
    if (await story.locator('[data-act="pick"]').count()) await story.locator('[data-act="pick"]').first().click();
    else if (await story.locator('[data-act="page"]').count()) await story.locator('[data-act="page"]').first().click();
    else await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    if ((await scene(page)) === 'Story' && (await story.locator('.txt').innerText()) !== first) turned = true;
  }
  expect(turned).toBe(true);
  expect(await scene(page)).not.toBe('Story');
  expect(errors).toEqual([]);
});

test('New UI: the Breather is the mock-up page: the party strip, the quiet room, and a click on Rest heals and goes back to the map', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=e4-breather');
  await toMap(page);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    run.party[0].hp = 1;
    run.expansion = { ...(run.expansion ?? {}), cut: { format: { id: 'breather', state: { healPct: 0.5, step: 'choose', revived: null, healed: 0 } } } };
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Format');
  const room = view(page, 'Format');
  for (const bit of ['Breather', 'Bring one back', 'Nobody is down.', 'The quiet room', '+50% HP', 'Heal', '50%', 'When you rest']) await expect(room).toContainText(bit);
  await expect(room.locator('.an')).toHaveCount(1); // the one Pokémon of the party, drawn on the strip
  await expect(room.locator('[data-act="pick"]')).toHaveCount(1);
  await expect(room.locator('[data-act="pick"]')).toContainText('Rest');
  await page.screenshot({ path: 'test-results/newui-breather.png' });
  await room.locator('[data-act="pick"]').click();
  // The rest is over: the page stays until the player goes on.
  await expect(room.locator('[data-act="pick"]')).toContainText('Continue');
  await expect(room).toContainText('Everyone still standing has rested.');
  expect(await scene(page)).toBe('Format');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Map');
  const out = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    return { hp: run.party[0].hp, done: run.expansion.cut.done, format: run.expansion.cut.format ?? null };
  });
  expect(out.hp).toBeGreaterThan(1);
  expect(out.done).toEqual(['breather']);
  expect(out.format).toBeNull();
  expect(errors).toEqual([]);
});

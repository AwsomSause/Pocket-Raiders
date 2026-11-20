import { expect, test, type Page } from '@playwright/test';
import { start, toCommands, toMap, waitForScene, watch } from './helpers/newUi';
import { fitProblems, onPage, pview, toPhantomMap } from './helpers/phantomUi';

// Phantom UI part 6: the pops over every screen (toasts, notices, the song caption), the interaction prompt's window,
// the Phone page's touch settings with the swipe they turn on, and "Change who leads" (Kice 2026-11-20: a free lead
// swap before the first turn, in every UI style).

const fits = async (page: Page, key: string, id: string) => { await page.waitForTimeout(900); expect(await fitProblems(page, key, id), id).toEqual([]); };
const lead = (page: Page) => page.evaluate(() => { const b = (window as any).__pkr.session.run.battle; return { at: b.activeIndex as number, turn: b.turn as number, waiting: (b.pendingEntry ?? []) as string[] }; });

/** Three Pokémon that can fight (copies of the starter) and one that has fainted, back on the map. */
async function team(page: Page) {
  await page.evaluate(() => {
    const pkr = (window as any).__pkr, run = pkr.session.run, first = run.party[0];
    const copy = (id: string, level: number) => ({ ...JSON.parse(JSON.stringify(first)), uid: id, id, level });
    run.party.push(copy('x1', 6), copy('x2', 7), copy('x3', 8));
    run.party[2].hp = 0;
  });
}
/** Walks into a wild battle on the first column. */
const wildBattle = (page: Page) => page.evaluate(() => {
  const { session, game } = (window as any).__pkr;
  const node = session.run.stage.map.nodes.find((n: any) => n.column === 1);
  node.kind = 'wild';
  session.chooseNode(node.id);
  game.scene.getScene('Map').scene.start('Battle');
});

test('Phantom UI: achievement toasts, notices and the song caption are a Phantom page over the screen; a tap opens a toast and sends a notice away', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=phantom');
  await onPage(page, 'MainMenu', 'title');
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    pkr.achievementToast(2);
    pkr.notify('Rival: Kieran beat Gym 2 and is one badge ahead of you now.');
    pkr.notify('Your save was backed up.');
    pkr.caption('Pallet Town Theme', 20_000);
  });
  const pops = page.locator('#phx .phs[data-scene="overlay"][data-scr="pops"]');
  await expect(pops).toBeVisible();
  // The title page stays live under it, and the New layer draws none of them (no stand-in look).
  await expect(pview(page, 'MainMenu', 'title')).toBeVisible();
  await expect(page.locator('#rx .stage.phfb:visible', { hasText: /achievement|backed up|Pallet/i })).toHaveCount(0);
  await expect(pops.locator('.ph-nt-t')).toHaveCount(2);
  await expect(pops.locator('.ph-nt-n')).toHaveCount(2);
  await expect(pops.locator('.ph-nt-n.new .lab')).toHaveText('Notice');
  await expect(pops.locator('.ph-nt-n').nth(1)).toContainText('Kieran beat Gym 2');
  await expect(pops.locator('.ph-nt-song')).toContainText('Pallet Town Theme');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  expect(await page.evaluate(() => {
    const S = document.querySelector<HTMLElement>('#phx .phs[data-scene="overlay"]')!, box = S.getBoundingClientRect(), out: string[] = [];
    for (const el of S.querySelectorAll<HTMLElement>('.ph-nt-t,.ph-nt-n,.ph-nt-song b')) {
      const r = el.getBoundingClientRect();
      if (r.left < box.left - 1 || r.right > box.right + 1 || r.top < box.top - 1 || r.bottom > box.bottom + 1) out.push(`off: ${el.className}`);
    }
    for (const el of S.querySelectorAll<HTMLElement>('b,.txt,.lab')) if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible') out.push(`cut: ${el.textContent}`);
    return out;
  })).toEqual([]);
  await page.screenshot({ path: 'test-results/phantom-pops.png' });
  // A tap opens the toast: its story shows and it stays. (Pops leave by themselves, so the
  // first ones (toasts after about four seconds, notices after six) are let go and fresh ones are tapped.)
  await expect(pops.locator('.ph-nt-t')).toHaveCount(0, { timeout: 15_000 });
  await expect(pops.locator('.ph-nt-n')).toHaveCount(0, { timeout: 15_000 });
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    pkr.achievementToast(2);
    pkr.notify('Rival: Kieran beat Gym 2 and is one badge ahead of you now.');
    pkr.notify('Your save was backed up.');
  });
  const first = pops.locator('.ph-nt-t').first();
  await expect(first.locator('.txt')).toHaveCount(0);
  await first.click();
  await expect(pops.locator('.ph-nt-t.open .txt').first()).toBeVisible();
  // A tap sends a notice away.
  await pops.locator('.ph-nt-n').first().click();
  await expect(pops.locator('.ph-nt-n')).toHaveCount(1);
  // The open toast closes on a second tap; the other one leaves by itself.
  await pops.locator('.ph-nt-t.open').click();
  await expect(pops.locator('.ph-nt-t.open')).toHaveCount(0);
  // The title still takes the keys under the pops.
  await page.keyboard.press('ArrowDown');
  await onPage(page, 'MainMenu', 'menu');
  expect(errors).toEqual([]);
});

test("Phantom UI: the interaction prompt is a Phantom window: the bar, a press, and the verdict; Esc skips one", async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=phantom');
  await onPage(page, 'MainMenu', 'title');
  await page.evaluate(() => { (window as any).__res = null; void (window as any).__pkr.prompt('throw-ring').then((r: unknown) => { (window as any).__res = r; }); });
  const win = page.locator('#phx .phs[data-scr="prompt"]');
  await expect(win).toBeVisible();
  await expect(win.locator('.ph-pr-lab')).toHaveText('Skill throw');
  await expect(win.locator('.ph-pr-bar u')).toHaveCount(1);
  await expect(win.locator('.txt')).toContainText('gold zone');
  await page.keyboard.press('Enter');
  await expect(win.locator('.ph-pr-res')).toHaveText(/MISS|OK|GOOD|PERFECT/);
  await expect.poll(() => page.evaluate(() => (window as any).__res?.grade ?? null)).not.toBeNull();
  await expect(win).toHaveCount(0);
  // The drag prompt keeps the game's own box for the pointer; Esc skips it.
  await page.evaluate(() => { (window as any).__res = null; void (window as any).__pkr.prompt('aim-drag').then((r: unknown) => { (window as any).__res = r; }); });
  await expect(win.locator('.ph-pr-field')).toBeVisible();
  await expect(win.locator('.ph-pr-field u')).toHaveCount(2);
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => (window as any).__res?.skipped ?? null)).toBe(true);
  expect(errors).toEqual([]);
});

test('Phantom UI: the Phone page has the touch rows, Touch buttons hides the pad, and a swipe on the Pokémon screen goes to the next Pokémon', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&touch=1');
  await onPage(page, 'MainMenu', 'title');
  await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('MainMenu').scene.start('Settings', { from: 'MainMenu' }));
  await waitForScene(page, 'Settings');
  const set = pview(page, 'Settings');
  await onPage(page, 'Settings', 'set');
  await set.locator('.c8', { hasText: 'Phone' }).click();
  await onPage(page, 'Settings', 'set-look');
  await expect(set.locator('section.s-set-look > .hd')).toContainText('Phone');
  await expect(set.locator('.sr8 .sr').nth(0)).toContainText('Touch buttons');
  await expect(set.locator('.sr8 .sr').nth(1)).toContainText('Touch button size');
  await expect(set.locator('.sr8 .sr').nth(3)).toContainText('Swipe to switch');
  await expect(set.locator('.sr8 .sr').nth(4)).toContainText('Hold for details');
  await page.waitForTimeout(700);
  expect(await fitProblems(page, 'Settings')).toEqual([]);
  // The pad shows on a touch screen; Touch buttons off hides it, and its size follows the setting.
  const pad = page.locator('#touch-pad');
  await expect(pad).toBeVisible();
  await set.locator('.sr8 .sr').nth(1).click();
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.session.settings.touchButtonSize)).toBe('large');
  await expect.poll(() => pad.evaluate((el) => getComputedStyle(el).getPropertyValue('--tps').trim())).toBe('1.25');
  await set.locator('.sr8 .sr').nth(0).click();
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.session.settings.touchButtons)).toBe(false);
  await expect(pad).toBeHidden();
  await set.locator('.sr8 .sr').nth(0).click();
  await expect(pad).toBeVisible();

  // A run with a team: on the Pokémon screen a quick sideways swipe goes to the next Pokémon (and back).
  await page.keyboard.press('Escape');
  await onPage(page, 'Settings', 'set');
  await page.keyboard.press('Escape');
  await waitForScene(page, 'MainMenu');
  await toPhantomMap(page);
  await team(page);
  await page.evaluate(() => void (window as any).__pkr.game.scene.getScene('Map').scene.restart());
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
  await page.evaluate(() => { ([...document.querySelectorAll('#phx .phs[data-scene="Map"][data-scr="map"] .ph-mbar [data-act]')].find((e) => e.textContent!.trim() === 'Party') as HTMLElement).click(); });
  await onPage(page, 'Map', 'party');
  const party = page.locator('#phx .phs[data-scene="Map"][data-scr="party"]');
  const on = () => party.locator('.pc').evaluateAll((els) => els.findIndex((e) => e.classList.contains('on')));
  await expect.poll(on).toBe(0);
  const swipe = (dx: number) => page.evaluate(async (dx) => {
    const at = (type: string, x: number) => document.body.dispatchEvent(new PointerEvent(type, { pointerType: 'touch', isPrimary: true, pointerId: 41, clientX: x, clientY: 420, bubbles: true }));
    at('pointerdown', 640);
    await new Promise((r) => setTimeout(r, 120));
    at('pointerup', 640 + dx);
  }, dx);
  await swipe(-200);
  await expect.poll(on).toBe(1);
  await swipe(-200);
  await expect.poll(on).toBe(2);
  await swipe(200);
  await expect.poll(on).toBe(1);
  // A short stroke is a tap, not a swipe; with the setting off a swipe does nothing.
  await swipe(-20);
  await page.waitForTimeout(300);
  expect(await on()).toBe(1);
  await page.evaluate(() => { const s = (window as any).__pkr.session; s.saveSettings({ ...s.settings, swipeToSwitch: false }); });
  await swipe(-200);
  await page.waitForTimeout(300);
  expect(await on()).toBe(1);
  expect(errors).toEqual([]);
});

test('Phantom UI: on the send-out card ◀▶ changes who leads for free; the card waits, and the new lead fights', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=lead-swap');
  await toPhantomMap(page);
  await team(page);
  await wildBattle(page);
  await waitForScene(page, 'Battle');
  // The send-out card is held (the battle's clock stops) the moment it shows.
  await page.evaluate(() => {
    const w = window as any;
    w.__holdT = setInterval(() => { if (document.querySelector('#phx .phs[data-scene="Battle"][data-scr="send"]')) w.__pkr.game.scene.getScene('Battle').time.paused = true; }, 20);
  });
  const wild = pview(page, 'Battle', 'wild'), send = pview(page, 'Battle', 'send');
  await expect(wild).toBeVisible({ timeout: 15_000 });
  await wild.locator('.ph-ct-next').click();
  for (let n = 0; n < 40 && (await send.count()) === 0; n++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  await expect(send).toBeVisible();
  await expect(send.locator('.keys')).toContainText('Change who leads', { ignoreCase: true });
  await expect(send.locator('.sn-ord > i.on')).toHaveCount(1);
  expect(await lead(page)).toEqual({ at: 0, turn: 1, waiting: ['player', 'enemy'] });
  await fits(page, 'Battle', 'send');
  // ◀▶ steps round the Pokémon that can fight (the fainted one is skipped); the card then waits.
  await page.evaluate(() => { const s = (window as any).__pkr.game.scene.getScene('Battle'); s.time.paused = false; clearInterval((window as any).__holdT); });
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await lead(page)).at).toBe(1);
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await lead(page)).at).toBe(3);
  await expect(send.locator('.sn-ord span')).toHaveText(/new lead/i);
  await expect(send.locator('.sn-ord > i').nth(3)).toHaveClass(/\bon\b/);
  await page.waitForTimeout(2600);
  await expect(send).toBeVisible();
  await page.screenshot({ path: 'test-results/phantom-send-lead.png' });
  // A click on the order picks directly; Z (Enter) fights.
  await send.locator('.sn-ord > i').nth(1).click();
  await expect.poll(async () => (await lead(page)).at).toBe(1);
  await page.keyboard.press('Enter');
  await expect(send).toHaveCount(0);
  await toCommands(page);
  // The new lead is the one on the field (its entry runs with the first turn, as a lead's always does).
  expect((await lead(page)).at).toBe(1);
  expect(await page.evaluate(() => [(window as any).__pkr.session.run.battle.participants, (window as any).__pkr.game.scene.getScene('Battle').shown.player.uid])).toEqual([['x1'], 'x1']);
  expect(errors).toEqual([]);
});

test('New UI: the same free lead swap is a line before the throw; ◀▶ while it shows picks another lead', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=new&seed=lead-swap');
  await toMap(page);
  await team(page);
  await wildBattle(page);
  await waitForScene(page, 'Battle');
  const box = page.locator('#rx .stage[data-scene="Battle"]');
  for (let n = 0; n < 40 && !(await box.textContent())?.includes('leads.'); n++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
  }
  await expect(box).toContainText('to change who leads');
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await lead(page)).at).toBe(1);
  // Once changed, the line waits for Enter, then the new lead is thrown out.
  await page.waitForTimeout(2500);
  expect((await lead(page)).waiting).toContain('player');
  await page.keyboard.press('Enter');
  await toCommands(page);
  expect((await lead(page)).at).toBe(1);
  expect(await page.evaluate(() => [(window as any).__pkr.session.run.battle.participants, (window as any).__pkr.game.scene.getScene('Battle').shown.player.uid])).toEqual([['x1'], 'x1']);
  expect(errors).toEqual([]);
});

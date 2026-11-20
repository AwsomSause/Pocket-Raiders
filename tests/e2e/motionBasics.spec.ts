import { expect, test, type Page } from '@playwright/test';
import { confirmToMenu } from './battleInput';

// Animation redesign, battle basics (plans/animation-redesign): the send-out, the faint and the recall play
// as the mockup clips do, leave the sprites exactly as the battle expects them, and obey the animation setting.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}

async function startBattle(page: Page, seed: string) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/?seed=${seed}`);
  await waitForScene(page, 'MainMenu');
  for (const k of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, k);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const node = session.run.stage.map.nodes.find((n: any) => n.column === 1);
    node.kind = 'trainer';
    session.chooseNode(node.id);
    game.scene.getScene('Map').scene.start('Battle');
  });
  await waitForScene(page, 'Battle');
  await confirmToMenu(page);
}

/** What a side's sprite looks like right now, and the leftovers a clip must never leave behind. */
const look = (page: Page, side: 'player' | 'enemy') =>
  page.evaluate((s) => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    const v = s === 'enemy' ? b.enemySprite : b.playerSprite;
    const home = b.spotXY(s);
    const solid = b.field.list.filter((o: any) => o.type === 'Sprite' && o.tintFill && o !== v).length;
    return { x: v.x, y: v.y, homeX: home.x, homeY: home.y, alpha: v.alpha, sx: v.scaleX, sy: v.scaleY, angle: v.angle, cropped: v.isCropped, shade: Boolean(b.baseShade[s]?.active), solid };
  }, side);

/** Starts one of the scene's moments without waiting for it; `__moment` is true once it is over. */
const start = (page: Page, call: string) =>
  page.evaluate((code) => {
    const w = window as any;
    const b = w.__pkr.game.scene.getScene('Battle');
    w.__moment = false;
    w.__t0 = performance.now();
    void new Function('b', `return ${code}`)(b).then(() => {
      w.__moment = true;
      w.__ms = performance.now() - w.__t0;
    });
  }, call);
const over = (page: Page) => page.evaluate(() => (window as any).__moment === true);

test('send-out, faint and recall play like the mockups and leave the sprites as the battle expects', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await startBattle(page, 'motion-basics');

  // The opening throw has landed: your Pokémon stands whole, on its spot, with nothing left over.
  const rest = await look(page, 'player');
  expect(rest).toMatchObject({ x: rest.homeX, y: rest.homeY, alpha: 1, angle: 0, cropped: false, solid: 0 });
  const foeRest = await look(page, 'enemy');

  // Faint: the foe staggers away from you, then sinks into the ground at its feet and its base goes dark.
  // Every frame is checked in the page (a slow machine's polls can fall between the short sink and the end).
  await page.evaluate(() => {
    const w = window as any;
    const b = w.__pkr.game.scene.getScene('Battle');
    w.__faint = { away: 0, sunk: false, shade: false };
    w.__faintWatch = () => {
      const v = b.enemySprite;
      if (!v?.active) return;
      w.__faint.away = Math.max(w.__faint.away, v.x - b.spotXY('enemy').x);
      if (v.isCropped) {
        w.__faint.sunk = true;
        w.__faint.shade ||= Boolean(b.baseShade.enemy?.active);
      }
    };
    b.events.on('update', w.__faintWatch);
  });
  await start(page, `b.faintMoment('enemy', b.enemySprite)`);
  await expect.poll(() => over(page), { timeout: 5000 }).toBe(true);
  const faint = await page.evaluate(() => {
    const w = window as any;
    w.__pkr.game.scene.getScene('Battle').events.off('update', w.__faintWatch);
    return w.__faint;
  });
  expect(faint.away).toBeGreaterThan(6);
  expect(faint).toMatchObject({ sunk: true, shade: true });
  expect(await page.evaluate(() => (window as any).__ms)).toBeGreaterThan(900);
  // Afterwards it is hidden but otherwise as it stood (a revive only has to show it again).
  expect(await look(page, 'enemy')).toMatchObject({ x: foeRest.x, y: foeRest.y, alpha: 0, sx: foeRest.sx, angle: 0, cropped: false, shade: true });

  // Send-out: a ball flies in, the Pokémon bursts out and settles; the dark base lifts.
  await start(page, `b.sendMoment('enemy', b.shown.enemy, null)`);
  await expect.poll(() => over(page), { timeout: 6000 }).toBe(true);
  await page.waitForTimeout(300);
  const back = await look(page, 'enemy');
  expect(back).toMatchObject({ x: foeRest.x, y: foeRest.y, alpha: 1, cropped: false, shade: false, solid: 0 });
  expect(back.sx).toBeCloseTo(foeRest.sx, 1);

  // Recall: your Pokémon turns red (a solid red copy lies over it) and shrinks into the beam.
  await start(page, `b.recallMoment('player', b.playerSprite, null)`);
  await expect.poll(async () => (await look(page, 'player')).solid, { timeout: 3000 }).toBe(1);
  await expect.poll(async () => (await look(page, 'player')).sx, { timeout: 3000 }).toBeLessThan(rest.sx * 0.5);
  await expect.poll(() => over(page), { timeout: 5000 }).toBe(true);
  expect(await look(page, 'player')).toMatchObject({ x: rest.x, y: rest.y, alpha: 0, sx: rest.sx, solid: 0 });
  // The info bar tucked away below the screen during the recall, and waits hidden in its own place.
  const bar = () => page.evaluate(() => { const c = (window as any).__pkr.game.scene.getScene('Battle').playerBox.container; return { visible: c.visible, x: c.x, y: c.y }; });
  const barHome = await bar();
  expect(barHome.visible).toBe(false);
  // Send-out: the bar comes back up with the new name while the Pokémon is still settling, and ends at home.
  await start(page, `b.sendMoment('player', b.shown.player, null, () => { window.__plateAt = performance.now() - window.__t0; void b.refreshInfoBox(b.playerBox, b.shown.player, false); })`);
  await expect.poll(() => over(page), { timeout: 6000 }).toBe(true);
  const { plateAt, ms } = await page.evaluate(() => ({ plateAt: (window as any).__plateAt as number, ms: (window as any).__ms as number }));
  expect(plateAt).toBeGreaterThan(0);
  expect(ms - plateAt).toBeGreaterThan(300);
  expect(await look(page, 'player')).toMatchObject({ x: rest.x, y: rest.y, alpha: 1, cropped: false, solid: 0 });
  await expect.poll(bar, { timeout: 2000 }).toEqual({ ...barHome, visible: true });

  expect(errors).toEqual([]);
});

test('Reduced only sinks and is short; Off moves nothing and takes no time', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startBattle(page, 'motion-basics-calm');
  const foeRest = await look(page, 'enemy');
  const setLevel = (level: string) => page.evaluate((l) => ((window as any).__pkr.session.settings.battleAnimations = l), level);

  await setLevel('reduced');
  await start(page, `b.faintMoment('enemy', b.enemySprite)`);
  // No stagger: it never leaves its column.
  for (let i = 0; i < 5; i++) {
    expect((await look(page, 'enemy')).x).toBe(foeRest.x);
    await page.waitForTimeout(60);
  }
  await expect.poll(() => over(page), { timeout: 4000 }).toBe(true);
  expect(await page.evaluate(() => (window as any).__ms)).toBeLessThan(900);
  expect(await look(page, 'enemy')).toMatchObject({ alpha: 0, cropped: false, shade: true });

  await setLevel('off');
  await start(page, `b.sendMoment('enemy', b.shown.enemy, null)`);
  await expect.poll(() => over(page), { timeout: 2000 }).toBe(true);
  expect(await page.evaluate(() => (window as any).__ms)).toBeLessThan(150);
  expect(await look(page, 'enemy')).toMatchObject({ x: foeRest.x, y: foeRest.y, alpha: 1, sx: foeRest.sx, shade: false });
  await start(page, `b.faintMoment('enemy', b.enemySprite)`);
  await expect.poll(() => over(page), { timeout: 2000 }).toBe(true);
  expect(await page.evaluate(() => (window as any).__ms)).toBeLessThan(150);
  expect(await look(page, 'enemy')).toMatchObject({ x: foeRest.x, y: foeRest.y, alpha: 0, cropped: false });
  await start(page, `b.recallMoment('player', b.playerSprite, null)`);
  await expect.poll(() => over(page), { timeout: 2000 }).toBe(true);
  expect(await page.evaluate(() => (window as any).__ms)).toBeLessThan(150);
  expect((await look(page, 'player')).alpha).toBe(0);
  expect(errors).toEqual([]);
});

test('the trainer face chip pops in with its word, keeps its distance, obeys Off, and leaves nothing behind', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startBattle(page, 'cheer-e2e');
  const chips = () => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').children.list.filter((c: any) => c.name === 'cheer-chip').map((c: any) => c.texture.key));
  // A knock-out: your trainer's face and "We did it!".
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').cheer({ kind: 'faint', on: 'foe' }, 0));
  await expect.poll(chips, { timeout: 3_000 }).toHaveLength(2);
  const keys = await chips();
  expect(keys.some((k: string) => k.startsWith('cheer.face.'))).toBe(true);
  expect(keys.some((k: string) => k.startsWith('cheer.word.We did it!'))).toBe(true);
  // A second moment straight after is held back (one chip per 1.2 s).
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').cheer({ kind: 'hit', on: 'you', superEffective: false }, 0));
  await page.waitForTimeout(100);
  expect((await chips()).some((k: string) => k.includes('Hang in there!'))).toBe(false);
  // It goes by itself.
  await expect.poll(chips, { timeout: 5_000 }).toHaveLength(0);
  // With every animation off there is no chip at all.
  await page.waitForTimeout(1300);
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    session.settings.disableAllAnimations = true;
    game.scene.getScene('Battle').cheer({ kind: 'hit', on: 'foe', superEffective: true }, 0);
  });
  await page.waitForTimeout(300);
  expect(await chips()).toHaveLength(0);
  expect(errors).toEqual([]);
});

test('the foe trainer steps in to throw, the ball leaves the hand, and the trainer is gone when the Pokémon lands', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startBattle(page, 'foe-throw-e2e');
  const trainers = () => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').field.list.filter((c: any) => /^(trainer|boss)\./.test(String(c.texture?.key))).length);
  await page.evaluate(() => {
    const w = window as any;
    const b = w.__pkr.game.scene.getScene('Battle');
    w.__hand = undefined;
    w.__sent = false;
    void b.foeThrowMoment().then((h: any) => {
      w.__hand = h;
      w.__inHand = b.field.list.some((c: any) => /^(trainer|boss)\./.test(String(c.texture?.key)));
      return b.sendMoment('enemy', b.shown.enemy, h).then(() => (w.__sent = true));
    });
  });
  await expect.poll(() => page.evaluate(() => (window as any).__hand !== undefined), { timeout: 5_000 }).toBe(true);
  const hand = await page.evaluate(() => (window as any).__hand);
  // Released from the hand above the foe's spot, while the trainer is still on the field.
  expect(hand).not.toBeNull();
  expect(hand.x).toBeGreaterThan(600);
  expect(hand.y).toBeLessThan(240);
  expect(await page.evaluate(() => (window as any).__inHand)).toBe(true);
  await expect.poll(() => page.evaluate(() => (window as any).__sent), { timeout: 5_000 }).toBe(true);
  await expect.poll(trainers, { timeout: 2_000 }).toBe(0);
  // Reduced animations: no trainer, the ball comes from its usual place.
  await page.evaluate(() => ((window as any).__pkr.session.settings.battleAnimations = 'reduced'));
  expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').foeThrowMoment())).toBeNull();
  expect(await trainers()).toBe(0);
  expect(errors).toEqual([]);
});

test('one damage number per hit: springs out at the mockup size, obeys Damage numbers and the popup size', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startBattle(page, 'numbers-e2e');
  const numbers = () => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').children.list.filter((c: any) => c.type === 'Text' && /^[-+]\d+$/.test(c.text)).map((c: any) => ({ text: c.text, size: c.style.fontSize, color: c.style.color })));
  const hit = (tone: string) => page.evaluate((t) => (window as any).__pkr.game.scene.getScene('Battle').fx.play([{ kind: 'number', side: 'enemy', amount: 25, tone: t, motion: true }]), tone);
  await hit('super');
  expect(await numbers()).toEqual([{ text: '-25', size: '44px', color: '#ffffff' }]);
  await expect.poll(numbers, { timeout: 3_000 }).toHaveLength(0);
  await hit('crit');
  expect(await numbers()).toEqual([{ text: '-25', size: '60px', color: '#ffcb05' }]);
  await expect.poll(numbers, { timeout: 3_000 }).toHaveLength(0);
  await page.evaluate(() => ((window as any).__pkr.session.settings.damageNumbers = false));
  await hit('damage');
  expect(await numbers()).toHaveLength(0);
  expect(errors).toEqual([]);
});

test('a miss: the attacker overshoots, the target side-steps, and both stand home again after', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startBattle(page, 'miss-e2e');
  const before = { player: await look(page, 'player'), enemy: await look(page, 'enemy') };
  await start(page, 'b.missMoment("enemy")');
  await page.waitForTimeout(250);
  const mid = { player: await look(page, 'player'), enemy: await look(page, 'enemy') };
  // Mid-way the foe has left its spot and your Pokémon has stepped away from it (to the left).
  expect(Math.abs(mid.enemy.x - before.enemy.x)).toBeGreaterThan(40);
  expect(mid.player.x).toBeLessThan(before.player.x - 20);
  await expect.poll(() => over(page), { timeout: 5_000 }).toBe(true);
  for (const side of ['player', 'enemy'] as const) {
    const now = await look(page, side);
    expect(now).toMatchObject({ x: before[side].x, y: before[side].y, angle: before[side].angle, alpha: before[side].alpha, solid: 0 });
    expect(now.sx).toBeCloseTo(before[side].sx, 2);
  }
  expect(errors).toEqual([]);
});

test('HP bar and danger: a drop jolts the plate; under a fifth the plate glows, the bar pulses and the Pokémon sags; a heal ends it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startBattle(page, 'danger-e2e');
  const state = () =>
    page.evaluate(() => {
      const b = (window as any).__pkr.game.scene.getScene('Battle');
      return { y: b.playerBox.container.y, danger: Boolean(b.playerBox.danger), sag: b.playerSprite.getData('sag') ?? null, sx: b.playerSprite.scaleX, pulsing: Boolean(b.playerBox.hpBar.pulsing) };
    });
  const home = await state();
  expect(home).toMatchObject({ danger: false, sag: null, pulsing: false });
  const full = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').shown.player.hp);
  const setHp = (hp: number) =>
    page.evaluate((h) => {
      const b = (window as any).__pkr.game.scene.getScene('Battle');
      b.shown.player.hp = h;
      void b.refreshInfoBox(b.playerBox, b.shown.player, true);
    }, hp);
  await setHp(Math.max(1, Math.floor(full * 0.15)));
  // The lowest the plate went over the next 0.3 s (sampled every frame).
  const low = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const c = (window as any).__pkr.game.scene.getScene('Battle').playerBox.container;
        let max = c.y;
        const t0 = performance.now();
        const tick = () => {
          max = Math.max(max, c.y);
          if (performance.now() - t0 < 300) requestAnimationFrame(tick);
          else resolve(max);
        };
        tick();
      }),
  );
  expect(low).toBeGreaterThan(home.y + 1);
  const hit = await state();
  expect(hit).toMatchObject({ danger: true, pulsing: true });
  expect(hit.sag).not.toBeNull();
  expect(hit.sx).toBeCloseTo(home.sx * 1.03, 2);
  await page.waitForTimeout(500);
  expect((await state()).y).toBeCloseTo(home.y, 0);
  await setHp(full);
  await page.waitForTimeout(400);
  const healed = await state();
  expect(healed).toMatchObject({ danger: false, sag: null, pulsing: false });
  expect(healed.sx).toBeCloseTo(home.sx, 3);
  expect(errors).toEqual([]);
});

import { expect, test, type Page } from '@playwright/test';
import { confirmToMenu } from './battleInput';

// Animation redesign, battle basics (plans/animation-redesign): the send-out, the faint and the recall play
// as the mockup clips do, leave the sprites exactly as the battle expects them, and obey the animation setting.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
async function waitForScene(page: Page, key: string) {
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(250);
}

async function startBattle(page: Page, seed: string, kind = 'trainer', confirm = true) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/?seed=${seed}`);
  await waitForScene(page, 'MainMenu');
  for (const k of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, k);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.evaluate((k) => {
    const { session, game } = (window as any).__pkr;
    const node = session.run.stage.map.nodes.find((n: any) => n.column === 1);
    node.kind = k;
    session.chooseNode(node.id);
    game.scene.getScene('Map').scene.start('Battle');
  }, kind);
  await waitForScene(page, 'Battle');
  if (confirm) await confirmToMenu(page);
}

/** What a side's sprite looks like right now, and the leftovers a clip must never leave behind. */
const look = (page: Page, side: 'player' | 'enemy') =>
  page.evaluate((s) => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    const v = s === 'enemy' ? b.enemySprite : b.playerSprite;
    const home = b.spotXY(s);
    const solid = b.field.list.filter((o: any) => o.type === 'Sprite' && o.tintFill && o !== v).length;
    // A Pokémon standing its own way (pass 11) breathes, hovers or tilts around its resting place: report that place.
    const rest = v.getData('standBase') ?? { y: v.y, sx: v.scaleX, sy: v.scaleY, angle: v.angle };
    return { x: v.x, y: rest.y, homeX: home.x, homeY: home.y, alpha: v.alpha, sx: rest.sx, sy: rest.sy, angle: rest.angle, cropped: v.isCropped, shade: Boolean(b.baseShade[s]?.active), solid };
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
      const v = b.playerSprite;
      return { y: b.playerBox.container.y, danger: Boolean(b.playerBox.danger), sag: v.getData('sag') ?? null, sx: (v.getData('standBase') ?? { sx: v.scaleX }).sx, pulsing: Boolean(b.playerBox.hpBar.pulsing) };
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

test('a shiny entrance: stars circle in and go, the SHINY chip pins itself to the plate, and leaves with the shiny', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startBattle(page, 'shiny-e2e');
  const stars = () => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').children.list.filter((c: any) => c.texture?.key === 'cheer.star4').length);
  const chip = () => page.evaluate(() => { const box = (window as any).__pkr.game.scene.getScene('Battle').enemyBox; return box.shinyChip ? { inPlate: box.container.list.includes(box.shinyChip), key: box.shinyChip.texture.key } : null; });
  await page.evaluate(() => { const b = (window as any).__pkr.game.scene.getScene('Battle'); b.shown.enemy.shiny = true; });
  await start(page, 'b.shinySparkle()');
  await expect.poll(stars, { timeout: 2_000 }).toBe(6);
  await expect.poll(chip, { timeout: 5_000 }).toEqual({ inPlate: true, key: 'cheer.shiny' });
  // The line waits for a press; the stars are gone by then.
  await expect.poll(stars, { timeout: 5_000 }).toBe(0);
  await page.keyboard.press('Enter');
  await expect.poll(() => over(page), { timeout: 5_000 }).toBe(true);
  expect(await chip()).toEqual({ inPlate: true, key: 'cheer.shiny' });
  // A different, plain Pokémon on that plate takes the chip off.
  await page.evaluate(() => { const b = (window as any).__pkr.game.scene.getScene('Battle'); b.shown.enemy.shiny = false; return b.refreshInfoBox(b.enemyBox, b.shown.enemy, false); });
  expect(await chip()).toBeNull();
  expect(errors).toEqual([]);
});

test('a wild Pokémon: nine dark bars pull apart, it slides in as a dark shape, its colour floods in, then its plate', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const peek = () => page.evaluate(() => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    const v = b.enemySprite;
    return {
      bars: b.children.list.filter((c: any) => c.texture?.key === 'wild.bar').length,
      dark: b.field.list.some((o: any) => o.type === 'Sprite' && o.tintFill && o.tintTopLeft === 0 && o.visible && o.alpha > 0.5),
      x: v?.active ? v.x : null,
      homeX: b.spotXY('enemy').x,
      plate: Boolean(b.enemyBox?.container?.visible && b.enemyBox.container.alpha > 0),
    };
  });
  // The real opening of a wild battle: the bars cover the screen and the Pokémon is still a dark shape off its spot.
  await startBattle(page, 'wild-e2e', 'wild', false);
  await expect.poll(async () => (await peek()).bars, { timeout: 15_000 }).toBe(9);
  await expect.poll(async () => { const p = await peek(); return p.dark && p.x !== null && p.x > p.homeX + 20; }, { timeout: 3_000 }).toBe(true);
  // Then the bars are gone, the Pokémon stands on its spot in colour, and the plate is in.
  await expect.poll(async () => { const p = await peek(); return { bars: p.bars, dark: p.dark, home: p.x !== null && Math.abs(p.x - p.homeX) < 1, plate: p.plate }; }, { timeout: 5_000 }).toEqual({ bars: 0, dark: false, home: true, plate: true });
  await confirmToMenu(page);
  const e = await look(page, 'enemy');
  expect({ x: e.x, y: e.y, alpha: e.alpha, solid: e.solid }).toEqual({ x: e.homeX, y: e.homeY, alpha: 1, solid: 0 });
  // Off: the moment moves nothing and takes no time.
  await page.evaluate(() => { const { session } = (window as any).__pkr; session.saveSettings({ ...session.settings, battleAnimations: 'off' }); });
  await start(page, 'b.wildEntranceMoment(b.shown.enemy)');
  await expect.poll(() => over(page), { timeout: 2_000 }).toBe(true);
  expect(await page.evaluate(() => (window as any).__ms)).toBeLessThan(400);
  expect((await peek()).bars).toBe(0);
  expect(errors).toEqual([]);
});

test('level up: two hops, the LEVEL stamp springs out and lifts away, and the Pokémon stands home again', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startBattle(page, 'level-e2e');
  await page.evaluate(() => {
    const w = window as any;
    const b = w.__pkr.game.scene.getScene('Battle');
    w.__lv = { up: 0, stamp: '' };
    w.__lvWatch = () => {
      const v = b.playerSprite;
      if (v?.active) w.__lv.up = Math.max(w.__lv.up, b.spotXY('player').y - v.y);
      const s = b.children.list.find((c: any) => c.name === 'level-stamp');
      if (s) w.__lv.stamp = s.texture.key;
    };
    b.events.on('update', w.__lvWatch);
    b.levelUpMoment(12);
  });
  await page.waitForTimeout(2200);
  const seen = await page.evaluate(() => {
    const w = window as any;
    const b = w.__pkr.game.scene.getScene('Battle');
    b.events.off('update', w.__lvWatch);
    return { ...w.__lv, left: b.children.list.filter((c: any) => c.name === 'level-stamp').length };
  });
  // The hop tops out 46 px over its spot (a few px either way for the breath it stood with).
  expect(seen.up).toBeGreaterThan(36);
  expect(seen).toMatchObject({ stamp: 'stamp.LEVEL 12.#ffcb05', left: 0 });
  const me = await look(page, 'player');
  expect({ x: me.x, y: me.y, sx: me.sx, solid: me.solid }).toEqual({ x: me.homeX, y: me.homeY, sx: me.sx, solid: 0 });
  // Off: no stamp, no hop.
  await page.evaluate(() => { const { session } = (window as any).__pkr; session.saveSettings({ ...session.settings, battleAnimations: 'off' }); (window as any).__pkr.game.scene.getScene('Battle').levelUpMoment(13); });
  expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').children.list.filter((c: any) => c.name === 'level-stamp').length)).toBe(0);
  expect(errors).toEqual([]);
});

test('a hit: the target goes white, is thrown back further for a super effective hit, and springs home; quick hits never drift', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startBattle(page, 'recoil-e2e');
  // Waits until the Pokémon stands still on its spot with no hit playing (the send-out and earlier hits are over).
  const settled = () => expect.poll(() => page.evaluate(() => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    const v = b.enemySprite;
    return !!v?.active && Math.abs(v.x - b.spotXY('enemy').x) < 0.5 && !v.getData('hitRun') && !b.field.list.some((o: any) => o.texture?.key === 'fx.glow');
  }), { timeout: 15000 }).toBe(true);
  const watch = async () => {
    await settled();
    await page.evaluate(() => {
    const w = window as any;
    const b = w.__pkr.game.scene.getScene('Battle');
    w.__hit = { away: 0, white: false, lights: 0 };
    // Slow motion, so even a slow machine's long frames (the clip clock takes at most 100 ms of a frame) sample near the peak.
    b.time.timeScale = 0.15;
    w.__hitWatch = () => {
      const v = b.enemySprite;
      if (!v?.active) return;
      w.__hit.away = Math.max(w.__hit.away, v.x - b.spotXY('enemy').x);
      w.__hit.lights = Math.max(w.__hit.lights, b.field.list.filter((o: any) => o.texture?.key === 'fx.glow').length);
      w.__hit.white ||= b.field.list.some((o: any) => o.type === 'Sprite' && o !== v && o.tintFill && o.tintTopLeft === 0xffffff && o.visible && o.alpha > 0.5);
    };
    b.events.on('update', w.__hitWatch);
    });
  };
  // Reads what was seen once the hit has played out (no fixed wait: a slow machine just takes longer).
  const seen = async () => {
    await settled();
    return page.evaluate(() => { const w = window as any; const b = w.__pkr.game.scene.getScene('Battle'); b.events.off('update', w.__hitWatch); b.time.timeScale = 1; return w.__hit; });
  };
  const impact = (eff: number, n = 1) => page.evaluate(([e, k]) => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    const cue = { kind: 'impact', side: 'enemy', amount: 1, crit: false, effectiveness: e, hitStopMs: 60, shake: 6, flash: null, flashAlpha: 0 };
    return b.fx.play(Array.from({ length: k }, () => cue));
  }, [eff, n] as const);
  await watch();
  await impact(1);
  const plain = await seen();
  expect(plain.white).toBe(true);
  // The hit's light: one glow on the body, one pool on the floor; both gone after.
  expect(plain.lights).toBe(2);
  expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').field.list.filter((o: any) => o.texture?.key === 'fx.glow').length)).toBe(0);
  expect(plain.away).toBeGreaterThan(24);
  expect(plain.away).toBeLessThan(40);
  await watch();
  await impact(2);
  expect((await seen()).away).toBeGreaterThan(40);
  // Three quick hits in a row (a multi-hit move): it ends exactly on its spot, at its size, with nothing left over.
  const before = await look(page, 'enemy');
  await impact(1, 3);
  await page.waitForTimeout(900);
  const after = await look(page, 'enemy');
  expect({ x: after.x, y: after.y, sx: after.sx, sy: after.sy, solid: after.solid }).toEqual({ x: before.homeX, y: before.y, sx: before.sx, sy: before.sy, solid: 0 });
  // Reduced: the battle's own blink, nothing thrown.
  await page.evaluate(() => { const { session } = (window as any).__pkr; session.saveSettings({ ...session.settings, battleAnimations: 'reduced' }); });
  await watch();
  await impact(2);
  await page.waitForTimeout(500);
  expect((await seen()).away).toBeLessThan(1);
  expect(errors).toEqual([]);
});

test('healing: green plus-signs rise, it glows green and hops, and it stands home after with nothing left over', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startBattle(page, 'heal-e2e');
  await page.evaluate(() => {
    const w = window as any;
    const b = w.__pkr.game.scene.getScene('Battle');
    w.__heal = { pluses: 0, green: false, up: 0 };
    w.__healWatch = () => {
      const v = b.playerSprite;
      w.__heal.pluses = Math.max(w.__heal.pluses, b.children.list.filter((c: any) => c.texture?.key === 'fx.plus.46' && c.alpha > 0).length);
      w.__heal.green ||= b.field.list.some((o: any) => o.type === 'Sprite' && o !== v && o.tintFill && o.tintTopLeft === 0x7dffa0 && o.visible && o.alpha > 0.3);
      if (v?.active) w.__heal.up = Math.max(w.__heal.up, b.spotXY('player').y - v.y);
    };
    b.events.on('update', w.__healWatch);
    b.time.timeScale = 0.5;
    return b.fx.play([{ kind: 'commonAnim', side: 'player', anim: 'heal', heal: true }]);
  });
  await page.waitForTimeout(3200);
  const seen = await page.evaluate(() => {
    const w = window as any;
    const b = w.__pkr.game.scene.getScene('Battle');
    b.events.off('update', w.__healWatch);
    b.time.timeScale = 1;
    return { ...w.__heal, left: b.children.list.filter((c: any) => String(c.texture?.key).startsWith('fx.plus')).length };
  });
  expect(seen.pluses).toBeGreaterThanOrEqual(8);
  expect(seen.green).toBe(true);
  expect(seen.up).toBeGreaterThan(15);
  expect(seen.left).toBe(0);
  const me = await look(page, 'player');
  expect({ x: me.x, y: me.y, solid: me.solid }).toEqual({ x: me.homeX, y: me.homeY, solid: 0 });
  expect(errors).toEqual([]);
});

test('conditions: each status arrives and stays on the Pokémon, burn ticks, paralysis stops it, it wakes and thaws, and nothing is left behind', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startBattle(page, 'cond-e2e');
  // The Pokémon stands still on its spot with no condition clip playing.
  const still = () => expect.poll(() => page.evaluate(() => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    const v = b.enemySprite;
    return !!v?.active && Math.abs(v.x - b.spotXY('enemy').x) < 0.5 && !v.getData('hitRun');
  }), { timeout: 15000 }).toBe(true);
  // Gives the shown Pokémon a status and plays the battle's own cue for that moment, watching every frame meanwhile.
  const moment = async (status: string | null, at: 'arrive' | 'tick' | 'cant' | null) => {
    await still();
    return page.evaluate(async ([st, when]) => {
      const b = (window as any).__pkr.game.scene.getScene('Battle');
      b.shown.enemy = { ...b.shown.enemy, status: st ? { id: st } : null };
      const seen = { flames: 0, bubbles: 0, ember: 0, stamp: false };
      const watch = () => {
        seen.flames = Math.max(seen.flames, b.children.list.concat(b.field.list).filter((c: any) => c.texture?.key === 'cond.flame' && c.visible && c.alpha > 0).length);
        seen.bubbles = Math.max(seen.bubbles, b.children.list.concat(b.field.list).filter((c: any) => c.texture?.key === 'cond.bubble' && c.visible && c.alpha > 0).length);
        seen.ember = Math.max(seen.ember, ...(b.conds.enemy?.embers ?? []).map((e: any) => e.scaleX / (16 / 34 / 2)), 0);
        seen.stamp ||= b.children.list.some((c: any) => String(c.texture?.key).startsWith("stamp.CAN'T MOVE") && c.alpha > 0.5);
      };
      b.events.on('update', watch);
      if (when) await b.fx.play([{ kind: 'commonAnim', side: 'enemy', anim: `status.${st}`, cond: { at: when, status: st } }]);
      await new Promise((r) => setTimeout(r, 1800));
      b.events.off('update', watch);
      return seen;
    }, [status, at] as const);
  };
  const state = () => page.evaluate(() => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    const v = b.enemySprite;
    const c = b.conds.enemy;
    const at = b.spotXY('enemy');
    return {
      kind: c?.kind ?? null,
      wash: !!c?.wash?.active && c.wash.visible && c.wash.alpha > 0,
      ice: !!c?.ice?.active && c.ice.visible,
      embers: c?.embers?.length ?? 0,
      frozenFrame: v.anims?.timeScale === 0,
      x: v.x - at.x,
      angle: v.getData('standBase')?.angle ?? v.angle, // its resting angle (some Pokémon stand with a tilt loop)
      icePictures: b.children.list.concat(b.field.list).filter((o: any) => String(o.texture?.key).startsWith('cond.ice')).length,
      flames: b.children.list.concat(b.field.list).filter((o: any) => o.texture?.key === 'cond.flame' && !(c?.embers ?? []).includes(o)).length, // the climbing flames (the embers stay),
    };
  });

  // Burn: nine flames climb it, then an orange wash and two embers stay; the turn's tick flares the embers.
  const brn = await moment('brn', 'arrive');
  expect(brn.flames).toBeGreaterThanOrEqual(5);
  await still();
  expect(await state()).toMatchObject({ kind: 'brn', wash: true, embers: 2, x: 0, flames: 0 });
  const tick = await moment('brn', 'tick');
  expect(tick.ember).toBeGreaterThan(1.5);
  await still();
  expect(await state()).toMatchObject({ kind: 'brn', wash: true, embers: 2, x: 0 });

  // Poison: bubbles rise through it.
  expect((await moment('psn', 'arrive')).bubbles).toBeGreaterThanOrEqual(5);
  await still();
  expect(await state()).toMatchObject({ kind: 'psn', wash: true, embers: 0, x: 0 });

  // Paralysis stopping a move: the dark CAN'T MOVE stamp, and it ends back on its spot.
  await moment('par', 'arrive');
  expect((await moment('par', 'cant')).stamp).toBe(true);
  await still();
  expect(await state()).toMatchObject({ kind: 'par', wash: true, x: 0 });

  // Sleep: it slumps away from the other side, then wakes upright.
  await moment('slp', 'arrive');
  await still();
  expect((await state()).kind).toBe('slp');
  expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').enemySprite.angle)).toBeCloseTo(16, 0);
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').condEnd('enemy', 'wake'));
  await moment(null, null);
  await still();
  expect(await state()).toMatchObject({ kind: null, x: 0, angle: 0 });

  // Freeze: ice grows over it and its frames stop; thawing shatters the ice and it moves again.
  await moment('frz', 'arrive');
  await still();
  expect(await state()).toMatchObject({ kind: 'frz', wash: true, ice: true, frozenFrame: true, x: 0 });
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').condEnd('enemy', 'thaw'));
  await moment(null, null);
  await still();
  expect(await state()).toMatchObject({ kind: null, frozenFrame: false, x: 0, icePictures: 0 });

  // A cure with no moment (a Full Heal): the look comes off by itself.
  await moment('brn', 'arrive');
  await page.evaluate(() => { const b = (window as any).__pkr.game.scene.getScene('Battle'); b.shown.enemy = { ...b.shown.enemy, status: null }; b.condSync('enemy'); });
  await page.waitForTimeout(400);
  expect(await state()).toMatchObject({ kind: null, x: 0 });
  expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').field.list.filter((o: any) => o.type === 'Sprite' && o.tintFill && o.visible && o.alpha > 0).length)).toBe(0);
  expect(errors).toEqual([]);
});

test('stat changes: chevrons in the stat colour sweep the body, a stamp says the stat, six pips show the stage; nothing left after', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startBattle(page, 'stat-e2e');
  const change = (side: 'player' | 'enemy', stat: string, by: number) => page.evaluate(async ([s, st, n]) => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    const seen = { chevrons: 0, stamp: '', pips: 0, lit: [] as number[], arrows: 0, badge: 0 };
    const watch = () => {
      seen.chevrons = Math.max(seen.chevrons, b.children.list.concat(b.field.list).filter((c: any) => String(c.texture?.key).startsWith('stat.chev.') && c.alpha > 0.5).length);
      const st = b.children.list.find((c: any) => String(c.texture?.key).startsWith('stamp.') && c.alpha > 0.5);
      if (st) seen.stamp = st.texture.key;
      const pips = b.children.list.filter((c: any) => c.texture?.key === 'stat.pip' && c.scaleX > 0.4);
      seen.pips = Math.max(seen.pips, pips.length);
      // The pips lit at their fullest moment (they all fade together at the end).
      const lit = pips.filter((p: any) => p.alpha > 0.5 && p.tintTopLeft !== 0xffffff).map((p: any) => p.tintTopLeft);
      if (lit.length > seen.lit.length) seen.lit = lit;
      // The pack's old arrows (text in the field) and its word badge must stay away.
      seen.arrows = Math.max(seen.arrows, b.field.list.filter((o: any) => o.type === 'Text' && /[▲▼]/.test(o.text)).length);
      seen.badge = Math.max(seen.badge, b.children.list.concat(b.field.list).filter((o: any) => o.type === 'Text' && /\+\+?$|--?$/.test(o.text ?? '')).length);
    };
    b.events.on('update', watch);
    const word = { atk: 'ATTACK', def: 'DEFENSE' }[st as 'atk' | 'def'];
    const arrows = (n as number > 0 ? '+' : '-').repeat(Math.abs(n as number));
    await b.fx.play([
      { kind: 'statArrows', side: s, up: (n as number) > 0, motion: true, stat: st, change: n },
      { kind: 'textAnim', side: s, anim: (n as number) > 0 ? 'text.statUp' : 'text.statDown', label: `${word} ${arrows}` },
    ]);
    await new Promise((r) => setTimeout(r, 2200));
    b.events.off('update', watch);
    return seen;
  }, [side, stat, by] as const);

  const up = await change('player', 'atk', 1);
  expect(up.chevrons).toBe(5);
  expect(up.stamp).toBe('stamp.ATTACK ▲.#e3350d');
  expect(up.pips).toBe(6);
  expect(up.lit).toEqual([0xe3350d]);
  expect(up.arrows).toBe(0);
  expect(up.badge).toBe(0);

  const down = await change('enemy', 'def', -2);
  expect(down.chevrons).toBe(10);
  expect(down.stamp).toBe('stamp.DEFENSE ▼▼.#2a75bb');
  expect(down.lit).toEqual([0x2a75bb, 0x2a75bb]);

  // Nothing left over, and both stand on their spots at their own size.
  expect(await page.evaluate(() => { const b = (window as any).__pkr.game.scene.getScene('Battle'); return b.children.list.concat(b.field.list).filter((c: any) => /^stat\.|^stamp\./.test(String(c.texture?.key))).length; })).toBe(0);
  for (const s of ['player', 'enemy'] as const) {
    const l = await look(page, s);
    expect({ x: l.x, solid: l.solid }).toEqual({ x: l.homeX, solid: 0 });
  }
  expect(errors).toEqual([]);
});

test('an ability: its flag unrolls from the owner side; Intimidate leans in, glares and the other shrinks back; all home after', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startBattle(page, 'ability-e2e');
  const order = () => page.evaluate(() => { const b = (window as any).__pkr.game.scene.getScene('Battle'); return [b.field.getIndex(b.enemySprite), b.field.getIndex(b.playerSprite)]; });
  const before = await order();
  const seen = await page.evaluate(async () => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    const all = () => b.children.list.concat(b.field.list);
    const at = b.spotXY('player');
    const s = { flag: '', flagX: -1, cone: false, dim: 0, back: 0, lean: 0, word: 0 };
    const watch = () => {
      const f = all().find((o: any) => String(o.texture?.key).startsWith('ability.flag.') && o.scaleX > 0.3);
      if (f) [s.flag, s.flagX] = [f.texture.key, f.x];
      s.cone ||= all().some((o: any) => o.texture?.key === 'ability.glare' && o.scaleX > 0.5 && o.alpha > 0.2);
      s.dim = Math.max(s.dim, ...b.field.list.filter((o: any) => o.type === 'Rectangle' && o.fillColor === 0).map((o: any) => o.fillAlpha), 0);
      s.back = Math.max(s.back, at.x - b.playerSprite.x);
      s.lean = Math.max(s.lean, b.spotXY('enemy').x - b.enemySprite.x);
      // The old banner (a text in the field) stays away.
      s.word = Math.max(s.word, b.field.list.filter((o: any) => o.type === 'Container' && o.list?.some((c: any) => c.type === 'Text' && /Intimidate/.test(c.text))).length);
    };
    b.events.on('update', watch);
    await b.fx.play([{ kind: 'abilityAnim', side: 'enemy', anim: 'ability.menace', label: 'Intimidate', ability: 'intimidate' }]);
    await new Promise((r) => setTimeout(r, 2600));
    b.events.off('update', watch);
    return s;
  });
  expect(seen.flag.startsWith('ability.flag.l.')).toBe(true);
  expect(seen.flagX).toBe(0);
  expect(seen.cone).toBe(true);
  expect(seen.dim).toBeGreaterThan(0.5);
  expect(seen.lean).toBeGreaterThan(30);
  expect(seen.back).toBeGreaterThan(14);
  expect(seen.word).toBe(0);
  // Afterwards: no flag, no glare, no dim, both home, and the field in its old order.
  expect(await page.evaluate(() => { const b = (window as any).__pkr.game.scene.getScene('Battle'); return b.children.list.concat(b.field.list).filter((o: any) => /^ability\./.test(String(o.texture?.key)) || (o.type === 'Rectangle' && o.fillColor === 0 && o.fillAlpha > 0.4)).length; })).toBe(0);
  expect(await order()).toEqual(before);
  for (const s of ['player', 'enemy'] as const) {
    const l = await look(page, s);
    expect({ x: l.x, solid: l.solid }).toEqual({ x: l.homeX, solid: 0 });
  }
  // Your own ability's flag comes in from the right edge.
  const mine = await page.evaluate(async () => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    void b.fx.play([{ kind: 'abilityAnim', side: 'player', anim: 'ability.boost', label: 'Overgrow', ability: 'overgrow' }]);
    await new Promise((r) => setTimeout(r, 600));
    const f = b.children.list.find((o: any) => String(o.texture?.key).startsWith('ability.flag.'));
    return f ? [f.texture.key.slice(0, 15), f.x === b.scale.width] : null;
  });
  expect(mine).toEqual(['ability.flag.r.', true]);
  expect(errors).toEqual([]);
});

test('weather: rain, sun, sand and snow arrive with their layer, grade and chip; sand gusts and both lean; it clears and leaves nothing', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startBattle(page, 'weather-e2e');
  const seen = await page.evaluate(async () => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    const out: Record<string, { layer: number; chip: string; br: number; sat: number }> = {};
    for (const k of ['rain', 'sun', 'sand', 'snow']) {
      await b.setWeather({ id: k, turns: 5 }, true);
      await new Promise((r) => setTimeout(r, 700));
      const chip = b.children.list.find((o: any) => String(o.texture?.key).startsWith('wx.chip.'));
      out[k] = { layer: b.wxLook.layer.length, chip: chip ? chip.texture.key.slice(8) : '', br: b.wxLook.grade.br, sat: b.wxLook.grade.sat };
      if (k === 'sand') {
        const at = b.spotXY('player');
        let lean = 0;
        const watch = () => (lean = Math.max(lean, at.x - b.playerSprite.x));
        b.events.on('update', watch);
        b.sandGust();
        await new Promise((r) => setTimeout(r, 1300));
        b.events.off('update', watch);
        (out as any).lean = lean;
      }
      await b.wxLook.end();
      await new Promise((r) => setTimeout(r, 2200));
    }
    return out;
  });
  expect(seen.rain).toMatchObject({ chip: '☂ RAIN · 5 turns' });
  expect(seen.rain!.br).toBeCloseTo(0.68);
  expect(seen.sun!.br).toBeCloseTo(1.2);
  expect(seen.sand).toMatchObject({ chip: '≋ SANDSTORM · 5 turns' });
  expect(seen.snow!.sat).toBeCloseTo(0.55);
  for (const k of ['rain', 'sun', 'sand', 'snow']) expect(seen[k]!.layer).toBeGreaterThan(0);
  expect((seen as any).lean).toBeGreaterThan(5);
  // Cleared: no chip, no layer, no clouds, colour back, both home.
  const after = await page.evaluate(() => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    return { left: b.children.list.concat(b.field.list).filter((o: any) => /^wx\./.test(String(o.texture?.key))).length, layer: b.wxLook.layer.length, br: b.wxLook.grade.br, kind: b.wxLook.current };
  });
  expect(after).toEqual({ left: 0, layer: 0, br: 1, kind: null });
  for (const s of ['player', 'enemy'] as const) {
    const l = await look(page, s);
    expect({ x: l.x, solid: l.solid }).toEqual({ x: l.homeX, solid: 0 });
  }
  // Off: nothing draws.
  const off = await page.evaluate(async () => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    (window as any).__pkr.session.settings.battleAnimations = 'off';
    await b.setWeather({ id: 'rain', turns: 5 }, true);
    const n = b.children.list.filter((o: any) => /^wx\./.test(String(o.texture?.key))).length;
    (window as any).__pkr.session.settings.battleAnimations = 'full';
    return { n, kind: b.wxLook.current };
  });
  expect(off).toEqual({ n: 0, kind: null });
  expect(errors).toEqual([]);
});

test('terrain: the carpet rolls out under both Pokémon and stays, its chip counts the turns and sits under the weather chip; it fades and leaves nothing', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startBattle(page, 'terrain-e2e');
  const seen = await page.evaluate(async () => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    const out: Record<string, unknown> = {};
    for (const k of ['electric', 'grassy', 'psychic', 'misty']) {
      await b.setTerrain({ id: k, turns: 5 }, true);
      await new Promise((r) => setTimeout(r, 600));
      const rug = b.trLook.rug;
      const chip = b.children.list.find((o: any) => String(o.texture?.key).startsWith('tr.chip.'));
      // The carpet is in the field, under both Pokémon.
      const fieldIdx = (o: any) => b.field.getIndex(o);
      out[k] = { scale: rug?.scale, under: fieldIdx(b.trLook.floor) < Math.min(fieldIdx(b.enemySprite), fieldIdx(b.playerSprite)), chip: chip?.texture.key.slice(8), chipY: chip?.y };
      await b.trLook.end();
      await new Promise((r) => setTimeout(r, 300));
    }
    await b.setTerrain({ id: 'grassy', turns: 3 }, false);
    await b.setWeather({ id: 'rain', turns: 5 }, false);
    await new Promise((r) => setTimeout(r, 400));
    out.stacked = b.children.list.find((o: any) => String(o.texture?.key).startsWith('tr.chip.'))?.y;
    b.trLook.clearNow();
    b.wxLook.clearNow();
    return out;
  });
  expect(seen.electric).toEqual({ scale: 1, under: true, chip: '⚡ ELECTRIC TERRAIN · 5 turns', chipY: 48 });
  expect(seen.grassy).toMatchObject({ under: true, chip: '✿ GRASSY TERRAIN · 5 turns' });
  expect(seen.psychic).toMatchObject({ under: true, chip: '◉ PSYCHIC TERRAIN · 5 turns' });
  expect(seen.misty).toMatchObject({ under: true, chip: '☁ MISTY TERRAIN · 5 turns' });
  expect(seen.stacked).toBe(84);
  expect(await page.evaluate(() => { const b = (window as any).__pkr.game.scene.getScene('Battle'); return b.children.list.concat(b.field.list).filter((o: any) => /^tr\.|^wx\./.test(String(o.texture?.key)) || o.type === 'Container' && o === b.trLook.floor).length; })).toBe(0);
  expect(errors).toEqual([]);
});

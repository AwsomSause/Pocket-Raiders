import { expect, test, type Page } from '@playwright/test';
import { confirmUntil } from './battleInput';
import { addSide, scene, toCommands, toMap, waitForScene, watch } from './helpers/newUi';

// Allies the game controls, on the field beside the player (core/battle/guests.ts).
// - gn.25 The Unlikely Friendship: the pack fight is a triple battle with the Zangoose and the Seviper on your side. The player
//   is asked for the lead only; the pair pick their own moves, are drawn like any Pokémon and go home when the fight ends.
// - gn.01 Poli-Pond, the return: in a Champion fight the player is losing, a Poliwrath and a Poliwhirl walk onto the field (the
//   single battle grows to three places), stay three turns, and step back (it is a single battle again).
// Played from the battle menu, in the New UI and the Old one.

const run = <T>(page: Page, fn: (run: any, b: any) => T): Promise<T> =>
  page.evaluate((src) => {
    const { session, game } = (window as any).__pkr;
    return new Function('run', 'b', `return (${src})(run, b)`)(session.run, game.scene.getScene('Battle'));
  }, fn.toString()) as Promise<T>;

const onScreen = (page: Page) =>
  page.evaluate(() => {
    const s = (window as any).__pkr.game.scene.getScene('Battle');
    const d = s.duo;
    if (!d) return { size: 1, player: s.playerSprite?.active ? 1 : 0, enemy: s.enemySprite?.active ? 1 : 0 };
    const count = (side: 'player' | 'enemy') => d.slots[side].filter((o: any) => o?.sprite?.active).length + ((side === 'player' ? s.playerSprite : s.enemySprite)?.active ? 1 : 0);
    return { size: d.size as number, player: count('player'), enemy: count('enemy') };
  });

const menuUp = (page: Page) => page.evaluate(() => { const b = (window as any).__pkr.game.scene.getScene('Battle'); return Boolean(b?.scene?.isActive() && b.menu && !b.busy); });
const turnNo = (page: Page) => page.evaluate(() => Number((window as any).__pkr.session.run?.battle?.turn ?? -1));

/** One turn from the command menu: the first choice of each menu (Fight, the first move, the first target) until the turn starts. */
async function fightTurn(page: Page) {
  const before = await turnNo(page);
  for (let i = 0; i < 8; i += 1) {
    const pressed = await page.evaluate(() => {
      const b = (window as any).__pkr.game.scene.getScene('Battle');
      if (!b.menu || b.busy) return false;
      b.menu.focus(0, false);
      b.menu.confirm();
      return true;
    });
    await page.waitForTimeout(450);
    if (!pressed || (await turnNo(page)) !== before) break;
  }
}

async function boot(page: Page, query: string) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/?${query}`);
  await waitForScene(page, 'MainMenu', 120_000);
  if (query.includes('ui=new')) await toMap(page);
  else for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
}

async function packFight(page: Page, query: string, shot: string | null) {
  const errors = watch(page);
  await boot(page, query);
  await addSide(page, { id: 'al-side', kind: 'event', used: false, eventId: 'gn-25-pack' });
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    session.chooseEvent('al-side', 0);
    game.scene.getScene('Map').scene.start('Battle');
  });
  await waitForScene(page, 'Battle');
  // The pair are in the battle as allies the game plays, in a triple battle with six Mightyena.
  const start = await run(page, (r) => ({ guests: r.battle.guests?.uids.length ?? 0, trio: Boolean(r.battle.doubles?.trio), foes: r.battle.enemyTeam.length, who: r.party.slice(-2).map((m: any) => m.speciesId) }));
  expect(start).toEqual({ guests: 2, trio: true, foes: 6, who: ['zangoose', 'seviper'] });
  // A steady fight for the picture: nobody falls on the first turn.
  await run(page, (r) => { for (const m of [...r.party, ...r.battle.enemyTeam]) m.moves = [{ id: 'tackle', pp: 35 }]; });
  await toCommands(page);
  // Three a side are drawn: your lead and both allies, and three of the pack.
  await expect.poll(() => onScreen(page), { timeout: 20_000 }).toEqual({ size: 3, player: 3, enemy: 3 });
  await page.waitForTimeout(600);
  if (shot) await page.screenshot({ path: shot });
  else await page.screenshot({ path: 'test-results/visual/allies-old.png' });
  // One turn: the player commands the lead only; the allies' spots are skipped by the menu and played by the game.
  const first = await turnNo(page);
  const pp = await run(page, (r) => r.party.slice(-2).map((m: any) => m.moves[0].pp));
  await fightTurn(page);
  await confirmUntil(page, async () => (await turnNo(page)) > first && (await menuUp(page)), 120_000);
  expect(await run(page, (_r, b) => [b.commands[1] ?? null, b.commands[2] ?? null])).toEqual([null, null]);
  const ppAfter = await run(page, (r) => r.party.slice(-2).map((m: any) => m.moves[0].pp));
  expect(ppAfter[0]! + ppAfter[1]!).toBeLessThan(pp[0]! + pp[1]!); // they used their own moves
  // Finish the fight: the pack is on its last legs each turn and your side is kept healthy.
  const t0 = Date.now();
  while ((await scene(page)) === 'Battle' && Date.now() - t0 < 240_000) {
    if (await menuUp(page)) {
      const over = await run(page, (r) => {
        if (!r.battle) return true;
        for (const f of r.battle.enemyTeam) if (f.hp > 1) f.hp = 1;
        return false;
      });
      if (!over) await fightTurn(page);
    } else await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
  }
  expect(await scene(page)).not.toBe('Battle');
  // They go back to each other: neither stays in the party.
  expect(await page.evaluate(() => (window as any).__pkr.session.run.party.some((m: any) => m.speciesId === 'zangoose' || m.speciesId === 'seviper'))).toBe(false);
  expect(errors).toEqual([]);
}

async function pondReturn(page: Page, query: string, shot: string) {
  const errors = watch(page);
  await boot(page, query);
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const r = session.run;
    for (const [i, hp] of [1, 0, 0].entries()) {
      const twin = structuredClone(r.party[0]);
      twin.uid = `p-al${i}`;
      if (!hp) twin.hp = 0;
      r.party.push(twin);
    }
    Object.assign(r.story.flags, { 'ev:pp-return-armed': 1, 'ev:pp-release': 1 });
    const node = r.stage.map.nodes.find((n: any) => n.column === 1);
    node.kind = 'trainer';
    node.sides = [];
    session.chooseNode(node.id);
    // The fight counts as a Champion's (where the return can happen), against one sturdy foe that only splashes.
    const live = session.run;
    live.stage.map.nodes.find((n: any) => n.id === live.stage.current).kind = 'champion';
    live.battle.doubles = undefined;
    live.battle.enemyTeam = live.battle.enemyTeam.slice(0, 1);
    live.battle.enemyIndex = 0;
    const foe = live.battle.enemyTeam[0];
    foe.moves = [{ id: 'splash', pp: 40 }];
    foe.level = 60;
    game.scene.getScene('Map').scene.start('Battle');
  });
  await waitForScene(page, 'Battle');
  await run(page, (r) => { r.battle.enemyTeam[0].hp = 9999; });
  await toCommands(page);
  expect(await onScreen(page)).toMatchObject({ size: 1 });
  // One turn while losing (two of four standing): the pond walks on, and the field has three places on your side.
  await fightTurn(page);
  await confirmUntil(page, async () => (await onScreen(page)).size === 3 && (await menuUp(page)), 180_000);
  expect(await run(page, (r) => ({ n: r.battle.guests.uids.length, turns: r.battle.guests.turns, who: r.party.slice(-4).map((m: any) => m.speciesId) }))).toEqual({ n: 4, turns: 3, who: ['poliwrath', 'poliwhirl', 'poliwhirl', 'poliwhirl'] });
  await expect.poll(() => onScreen(page), { timeout: 20_000 }).toEqual({ size: 3, player: 3, enemy: 1 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: shot });
  // Three turns as allies; then they step back and the battle is a single battle again, on the single-battle screen.
  for (let i = 0; i < 3; i += 1) {
    await run(page, (r) => { r.battle.enemyTeam[0].hp = 9999; });
    const t = await turnNo(page);
    await fightTurn(page);
    await confirmUntil(page, async () => (await turnNo(page)) > t && (await menuUp(page)), 180_000);
  }
  expect(await run(page, (r) => ({ guests: r.battle.guests ?? null, doubles: Boolean(r.battle.doubles), pond: r.party.filter((m: any) => m.uid.startsWith('pond-ally')).length }))).toEqual({ guests: null, doubles: false, pond: 0 });
  await expect.poll(() => onScreen(page), { timeout: 20_000 }).toEqual({ size: 1, player: 1, enemy: 1 });
  // The fight goes on as a single battle: one more turn plays.
  const t = await turnNo(page);
  await fightTurn(page);
  await confirmUntil(page, async () => (await turnNo(page)) > t && (await menuUp(page)), 120_000);
  expect(errors).toEqual([]);
}

test.describe('New UI', () => {
  // The picture for the report is taken at twice the size.
  test.use({ deviceScaleFactor: 2 });
  test('the pack fight: the Zangoose and the Seviper stand on your side and play themselves', async ({ page }) => {
    test.setTimeout(600_000);
    await packFight(page, 'seed=gnscreen-allies&campaign=dev&debug=1&ui=new', '/mnt/project-files/shots/gnscreens/allies.png');
  });
  test('the pond returns: allies walk on for three turns, then step back', async ({ page }) => {
    test.setTimeout(600_000);
    await pondReturn(page, 'seed=gnscreen-allies-pond&campaign=dev&debug=1&ui=new', '/mnt/project-files/shots/gnscreens/allies-pond.png');
  });
});

test('Old UI: the pack fight with both allies on the field', async ({ page }) => {
  test.setTimeout(600_000);
  await packFight(page, 'seed=gnscreen-allies&campaign=dev&debug=1', null);
});

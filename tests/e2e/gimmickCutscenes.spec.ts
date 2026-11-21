import { expect, test, type Page } from '@playwright/test';
import { confirmToMenu, confirmUntil } from './battleInput';
import { sceneAfterResult } from './helpers/resultGate';

// The four remade gimmick cutscenes (animation redesign pass 20): they play in a real battle, draw their own
// pictures (glass shards for Mega, the long climb for Dynamax), and however they end (played out or skipped) they
// leave the battle exactly as it expects: the new form shown, the camera home, nothing of theirs left behind.

const scene = (page: Page) => sceneAfterResult(page);
async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

const menuLabels = (page: Page) =>
  page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').menu?.config?.options?.map((o: any) => o.label) ?? null);

/** Starts a battle with a Charizard in front, the given key items in the Bag, and Blastoise across. */
async function battle(page: Page, seed: string, items: string[]) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/?seed=${seed}&debug=1`);
  await waitForScene(page, 'MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await page.keyboard.press('Enter');
    await waitForScene(page, next);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.evaluate((list) => {
    const { session } = (window as any).__pkr;
    session.debugAddToParty('charizard', 50);
    session.run.party.unshift(session.run.party.pop());
    session.run.party[0].moves = [{ id: 'flamethrower', pp: 15 }, { id: 'growl', pp: 40 }];
    for (const i of list) session.debugGiveItem(i, 1);
  }, items);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    session.debugReplaceEnemy('blastoise', 60);
    session.run.battle.enemyTeam[0].moves = [{ id: 'growl', pp: 40 }];
    game.scene.getScene('Battle').scene.restart();
  });
  await waitForScene(page, 'Battle');
  await confirmToMenu(page);
  await expect
    .poll(async () => {
      const labels = await menuLabels(page);
      if (labels && !labels.includes('Fight')) await page.keyboard.press('Escape');
      return labels?.[0] === 'Fight' && labels.length === 4;
    }, { timeout: 15_000 })
    .toBe(true);
}

/** Turns the gimmick on and picks the first move. */
async function useGimmick(page: Page) {
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
}

/** What the cutscene has on screen right now, and what it must never leave behind. */
const look = (page: Page, kind: string) =>
  page.evaluate((k) => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    const mine = b.children.list.filter((c: any) => c.name === `cine-${k}`);
    const cam = b.cameras.main;
    const v = b.playerSprite;
    return {
      objects: mine.length,
      images: mine.filter((c: any) => c.type === 'Image' && c.visible).length,
      texts: mine.filter((c: any) => c.type === 'Container').flatMap((c: any) => c.list).filter((t: any) => t.type === 'Text').map((t: any) => t.text),
      textures: b.textures.getTextureKeys().filter((t: string) => t.startsWith('gim.')).length,
      cam: { zoom: cam.zoom, x: cam.scrollX, y: cam.scrollY },
      sprite: { key: v?.texture?.key ?? null, visible: Boolean(v?.visible), alpha: v?.alpha ?? 0 },
    };
  }, kind);

const playing = (page: Page, kind: string) => page.evaluate((k) => (window as any).__pkr.game.scene.getScene('Battle').children.list.some((c: any) => c.name === `cine-${k}`), kind);

test('Mega Evolution is glass: the picture is built from shards, locks with its title and facts, and leaves nothing behind', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await battle(page, 'gim-mega-e2e', ['mega-ring', 'charizardite-x']);
  await useGimmick(page);
  // The stone's line waits for a press first.
  await confirmUntil(page, () => playing(page, 'mega'));
  // The picture is cut into 24 shards up front, each its own canvas picture.
  expect((await look(page, 'mega')).textures).toBeGreaterThanOrEqual(24);
  // Locked: the title and the facts the battle reads from the data (Mega Charizard X is Fire / Dragon).
  await expect.poll(async () => (await look(page, 'mega')).texts.join(' '), { timeout: 15_000 }).toContain('Type: Fire / Dragon');
  expect((await look(page, 'mega')).texts.join(' ')).toContain('Mega');
  // It plays out by itself.
  await expect.poll(() => playing(page, 'mega'), { timeout: 30_000 }).toBe(false);
  const after = await look(page, 'mega');
  expect(after).toMatchObject({ objects: 0, textures: 0, cam: { zoom: 1, x: 0, y: 0 }, sprite: { key: 'pokemon.back.6-mega-x', visible: true, alpha: 1 } });
  expect(await page.evaluate(() => (window as any).__pkr.session.run.party[0].speciesId)).toBe('charizard-mega-x');
  expect(errors).toEqual([]);
});

test('Dynamax skipped halfway up the climb: the giant stands on the field and the camera is home', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await battle(page, 'gim-dmax-e2e', ['dynamax-band']);
  await useGimmick(page);
  await confirmUntil(page, () => playing(page, 'gigantamax'));
  // During the recall the real sprite is hidden; let the climb begin, then skip.
  await page.waitForTimeout(3500);
  await page.keyboard.press('Enter');
  await expect.poll(() => playing(page, 'gigantamax'), { timeout: 5_000 }).toBe(false);
  const after = await look(page, 'gigantamax');
  expect(after).toMatchObject({ objects: 0, textures: 0, cam: { zoom: 1, x: 0, y: 0 }, sprite: { visible: true, alpha: 1 } });
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.session.run.party[0].speciesId), { timeout: 10_000 }).toBe('charizard-gmax');
  expect(errors).toEqual([]);
});

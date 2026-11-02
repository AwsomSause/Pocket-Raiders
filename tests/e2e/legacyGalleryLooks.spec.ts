import { expect, test, type Page } from '@playwright/test';

// Legacy gallery looks (screens redesign group E): each pinned look draws the runs, Right moves the focus, Enter opens one, no console errors.
const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
const mon = (uid: string, speciesId: string, level: number) => ({ uid, speciesId, level, shiny: false, moves: ['tackle'], abilitySlot: 0, nature: null, held: [], starter: false, knockouts: 1, bossesBeaten: 1, titles: [] });
const record = (runId: string, sp: string) => ({
  format: 1, source: 'run', runId, endedAt: '2026-10-30T12:00:00Z', seed: runId, archetypeId: 'red', campaignId: 'full', prep: null, rules: null,
  starter: { speciesId: sp, choices: [sp] }, regionOrder: ['kanto'], regionsCleared: [], regionReached: 0, outcome: 'defeat', encounters: 4, battlesWon: 3, badges: [],
  bosses: { gym: 1, elite: 0, champion: 0 }, team: [mon(`${runId}-a`, sp, 30)], aceUid: `${runId}-a`, rivals: [], nemeses: [], legendaries: { seen: [], caught: [] },
  defeatedBy: null, finalBattle: { result: 'lose', speciesId: null, level: null, trainer: 'Blue' }, stats: { maxLevel: 30, survivedFatal: 0, closeCalls: 0, caught: 1, shinies: 0, rivalWins: 0 },
  narrative: [], chronicle: [], moments: [], journal: [], epitaph: 'A long walk.',
});

test('every Legacy gallery look draws and navigates', async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/?debug=1');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
  const runs = ['pikachu', 'onix', 'eevee', 'gengar', 'charizard', 'lucario', 'togekiss'].map((sp, i) => record(`run-${i}`, sp));
  await page.evaluate((legacyRuns) => (window as any).__pkr.session.changeProfile((p: any) => ({ ...p, legacyRuns })), runs);
  for (const look of ['museum', 'polaroids', 'manga', 'timeline', 'cards', 'previously', 'bloom', 'aero', 'ink', 'wii', 'hall']) {
    await page.evaluate((l) => {
      const p = (window as any).__pkr;
      p.session.settings.screenStyles = { legacy: l };
      p.game.scene.getScene(p.activeScene()).scene.start('LegacyGallery');
    }, look);
    await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('LegacyGallery');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(250);
    await page.screenshot({ path: `test-results/legacy-${look}.png` });
    expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('LegacyGallery').picker?.isGallery ?? false)).toBe(true);
    await page.keyboard.press('Enter'); // opens the run's record (a Picker)
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('LegacyGallery').picker?.isGallery ?? false)).toBe(false);
  }
  expect(errors).toEqual([]);
});

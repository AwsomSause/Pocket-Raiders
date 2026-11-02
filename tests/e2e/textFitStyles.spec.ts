import { expect, test, type Page } from '@playwright/test';
import { SCREEN_STYLES_READY } from '../../src/core/presentation/screenStyles';
import { fitIssues } from './helpers/textFit';

// Slow audit (not in CI unless TEXTFIT_ALL=1): every built look of every screen that can be opened from the map,
// at both sizes. TEXTFIT_ONLY=reward,trade narrows it. Screenshots go to test-results/textfit-styles/.
test.skip(!process.env.TEXTFIT_ALL, 'set TEXTFIT_ALL=1 to run the per-style audit');
const ONLY = process.env.TEXTFIT_ONLY?.split(',');
// The canvas is always 960x540 and only scaled, so text layout is the same at every size; TEXTFIT_PHONE=1 adds 844x390 for the touch pad.
const SIZES = [{ w: 1280, h: 720 }, ...(process.env.TEXTFIT_PHONE ? [{ w: 844, h: 390 }] : [])];
const active = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

/** screen id -> [scene to open, data]. Every scene is opened from the map with a prepared run. */
const TARGETS: Record<string, [string, unknown][]> = {
  reward: [['Reward', undefined]],
  runend: [['GameOver', undefined]],
  settings: [['Settings', undefined]],
  title: [['MainMenu', undefined], ['SaveSlots', undefined]],
  trainer: [['TrainerSelect', undefined]],
  starter: [['RunPrep', { archetypeId: 'red' }]],
  briefing: [['Briefing', undefined]],
  legacy: [['LegacyGallery', undefined], ['Memories', undefined]],
  hubmenus: [['Hub', undefined]],
  map: [['Map', undefined]],
};

for (const size of SIZES) {
  test(`every look at ${size.w}x${size.h}`, async ({ page }) => {
    test.setTimeout(3_600_000);
    await page.setViewportSize({ width: size.w, height: size.h });
    const errors: string[] = [];
    page.on('pageerror', (e) => { errors.push(e.message); console.log('PAGEERROR', e.message.slice(0, 300)); });
    await page.goto('/?seed=textfit&debug=1');
    await expect.poll(() => active(page), { timeout: 30_000 }).toBe('MainMenu');
    const found: string[] = [];
    const RUNLESS = ['title', 'trainer', 'starter', 'legacy', 'hubmenus', 'settings'];
    const sweepScreens = async (runless: boolean) => {
    for (const [screen, targets] of Object.entries(TARGETS)) {
      if ((ONLY && !ONLY.includes(screen)) || RUNLESS.includes(screen) !== runless) continue;
      const ready = (SCREEN_STYLES_READY as Record<string, readonly string[]>)[screen] ?? [];
      for (const style of ['original', ...ready]) for (const [key, data] of targets) {
        await expect.poll(() => active(page), { timeout: 20_000 }).not.toBeNull();
        await page.evaluate(([k, d, scr, st]) => {
          const pkr = (window as any).__pkr;
          pkr.session.settings.screenStyles = { [scr as string]: st };
          const run = pkr.session.run;
          if (run && scr === 'reward') { run.phase = 'reward'; run.draft = ['protein', 'nugget', 'potion', 'ether', 'revive']; }
          if (run && scr === 'runend') run.phase = 'over';
          pkr.game.scene.getScene(pkr.activeScene()).scene.start(k, d);
        }, [key, data, screen, style] as const);
        await page.waitForTimeout(1100);
        const now = await active(page);
        const label = `${screen}/${style}/${key}`;
        if (now !== key) { found.push(`${label}: did not open (active: ${now})`); await page.evaluate(() => { const p = (window as any).__pkr; if (p.session.run) p.session.run.phase = 'map'; p.game.scene.start('Map'); }); await page.waitForTimeout(600); continue; }
        await page.screenshot({ path: `test-results/textfit-styles/${size.w}-${screen}-${style}-${key}.png` });
        for (const i of await fitIssues(page)) { const line = `${label}: ${i.kind} "${i.text}"${i.other ? ` / "${i.other}"` : ''} (${i.detail})`; if (!found.includes(line)) found.push(line); }
      }
    }
    };
    await sweepScreens(true);
    await page.evaluate(() => { const p = (window as any).__pkr; p.session.settings.screenStyles = {}; p.game.scene.getScene(p.activeScene()).scene.start('MainMenu'); });
    await expect.poll(() => active(page), { timeout: 20_000 }).toBe('MainMenu');
    await page.waitForTimeout(500);
    for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
      await expect.poll(async () => { if ((await active(page)) !== next) await page.keyboard.press('Enter'); return active(page); }, { timeout: 30_000, intervals: [1500] }).toBe(next);
      await page.waitForTimeout(300);
    }
    await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
    await sweepScreens(false);
    console.log(found.join('\n'));
    expect(errors).toEqual([]);
  });
}

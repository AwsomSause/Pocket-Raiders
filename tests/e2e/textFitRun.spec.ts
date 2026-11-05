import { expect, test, type Page } from '@playwright/test';
import { EVENT_STYLE_IDS } from '../../src/core/presentation/eventStyles';
import { fitIssues } from './helpers/textFit';

// Slow audit (TEXTFIT_ALL=1): screens that need a run in a special state, opened from the map of a seeded run:
// every shop type, every expedition, every minigame and the longest event texts in every event style.
// TEXTFIT_ONLY=shops,events,expeditions,minigames narrows it. Screenshots: test-results/textfit-run/.
test.skip(!process.env.TEXTFIT_ALL, 'set TEXTFIT_ALL=1 to run the run-state audit');
const ONLY = process.env.TEXTFIT_ONLY?.split(',');
const want = (k: string) => !ONLY || ONLY.includes(k);
const active = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

const SHOPS = ['mart', 'boutique', 'bazaar', 'depot', 'pokenet', 'night'];
// The two that swap your party for a borrowed or drafted one go last so the rest still have a healthy team.
const EXPEDITIONS = ['ember-trail', 'wanderers-road', 'grand-crossing', 'frozen-pass', 'ruins-run', 'mega-gauntlet', 'hollow-of-masks', 'dune-trek', 'sky-ascent', 'scale-summit', 'borrowed-team', 'draft-cup'];
const MINIGAMES = ['pokemon-memory', 'catching-challenge', 'rhythm-challenge', 'berry-foraging', 'knowledge-quiz', 'fossil-excavation', 'fishing-challenge', 'battle-puzzle', 'type-match', 'pokemon-tracking', 'berry-growing', 'trainers-trial', 'treasure-hunt', 'reaction-challenge', 'maze-runner', 'lock-picking', 'sky-race', 'safari-steps', 'sliding-puzzle', 'berry-blending', 'camp-cooking'];
// The longest intros and the most/longest choices (found by scanning src/data/events*.json).
const EVENTS = ['champion-defense', 'retired-team', 'living-rival-clash', 'game-show-1', 'archive-gauntlet-entry', 'legacy-ranch', 'camp-checkpoint', 'mentor-quiz', 'w4-express-train', 'drill-sergeant-kangaskhan', 'rk-pact-booth', 'relic-shrine', 'contract-desk'];

test('run-state screens fit', async ({ page }) => {
  test.setTimeout(3_600_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => { errors.push(e.message); console.log('PAGEERROR', e.message.slice(0, 200)); });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/?seed=textfit-run&debug=1');
  await expect.poll(() => active(page), { timeout: 30_000 }).toBe('MainMenu');
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await expect.poll(async () => { if ((await active(page)) !== next) await page.keyboard.press('Enter'); return active(page); }, { timeout: 30_000, intervals: [1500] }).toBe(next);
    await page.waitForTimeout(300);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 10_000 }).toBe(false);
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    session.debugJumpToColumn(5);
    session.run.money = 3240;
    session.run.badges = ['a', 'b'];
    game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await page.waitForTimeout(1500);

  const found: string[] = [];
  /** Runs `setup` (in the page, on a fresh map), expects scene `key`, audits it, then goes back to the map. */
  const check = async (label: string, key: string, setup: string, arg: unknown) => {
    await page.evaluate(() => { const p = (window as any).__pkr; if (p.session.run) { p.session.run.phase = 'map'; p.session.run.expedition = null; try { p.session.debugHeal(); } catch { /* no run */ } } p.game.scene.getScenes(true).forEach((sc: any) => sc.scene.key !== 'Map' && sc.scene.stop()); p.game.scene.start('Map'); }).catch(() => undefined);
    await expect.poll(() => active(page), { timeout: 20_000 }).toBe('Map');
    await page.waitForTimeout(500);
    await page.evaluate(([code, a]) => new Function('pkr', 'arg', code)((window as any).__pkr, a), [setup, arg] as const);
    await page.waitForTimeout(1600);
    const now = await active(page);
    if (now !== key) { found.push(`${label}: did not open (active: ${now})`); return; }
    await page.screenshot({ path: `test-results/textfit-run/${label.replace(/[^a-z0-9-]+/gi, '_')}.png` });
    for (const i of await fitIssues(page)) { const line = `${label}: ${i.kind} "${i.text}"${i.other ? ` / "${i.other}"` : ''} (${i.detail})`; if (!found.includes(line)) found.push(line); }
  };
  const node = `const run = pkr.session.run; const node = run.stage.map.nodes.find((n) => n.id === run.stage.current) ?? run.stage.map.nodes[0]; run.stage.current = node.id; const sid = 'e2e-' + Math.random().toString(36).slice(2, 8);`;

  if (want('shops')) for (const type of SHOPS) {
    await check(`shop-${type}`, 'Shop', `${node} node.sides.push({ id: sid, kind: 'shop', used: false }); pkr.session.visitSide(sid); if (run.shop) run.shop.type = arg; pkr.game.scene.getScene('Map').scene.start('Shop', { type: arg });`, type).catch((e) => found.push(`shop-${type}: ${e}`));
  }
  if (want('expeditions')) for (const [i, id] of EXPEDITIONS.entries()) {
    await check(`expedition-${id}`, 'Expedition', `${node} node.sides.push({ id: sid, kind: 'expedition', expeditionId: arg[0], used: false }); pkr.session.settings.screenStyles = { expedition: arg[1] }; pkr.session.beginExpedition(sid); pkr.game.scene.getScene('Map').scene.start('Expedition');`, [id, ['original', 'aero', 'manga', 'depth'][i % 4]]).catch((e) => found.push(`expedition-${id}: ${e}`));
  }
  if (want('minigames')) for (const id of MINIGAMES) {
    await check(`minigame-${id}`, 'Minigame', `${node} node.sides.push({ id: sid, kind: 'minigame', minigameId: arg, used: false }); pkr.session.beginMinigame(sid, 1); pkr.game.scene.getScene('Map').scene.start('Minigame');`, id).catch((e) => found.push(`minigame-${id}: ${e}`));
  }
  if (want('events')) for (const id of EVENTS) for (const style of EVENT_STYLE_IDS) {
    await check(`event-${id}-${style}`, 'Event', `${node} pkr.session.settings.eventStyle = arg[1]; node.sides.push({ id: sid, kind: 'event', used: false, eventId: arg[0] }); pkr.game.scene.getScene('Map').scene.start('Event', { sideId: sid });`, [id, style]).catch((e) => found.push(`event-${id}-${style}: ${e}`));
  }
  console.log(found.join('\n'));
  expect(errors).toEqual([]);
});

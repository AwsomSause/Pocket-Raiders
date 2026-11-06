import { expect, test, type Page } from '@playwright/test';

// Rival Notebook: the map's Rivals button lists each rival and what it has watched.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

test('the Rivals button opens the Notebook with what the rival watched', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/?debug=1');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    session.newRun('red', 'e2e-notebook-1');
    session.chooseStarter(0);
    const run = session.run;
    const traits = { ambition: 50, pride: 50, empathy: 50, adaptability: 50, vindictiveness: 50, resilience: 50 };
    run.story.rivals = [{
      id: 'u', classId: 'youngster', name: 'Joey', archetype: 'proud', style: 'rush', traits, rivalPotential: 20, state: 'recurring', arc: null, away: 0, cooldown: 0, progress: 0,
      encounters: 2, setbacks: 0, adaptations: ['packed a Water Pokémon'], seen: [{ signal: 'moveType', value: 'fire', source: 'fought', at: 'x', uses: 3 }], bonds: {}, offscreen: [], origin: { eventId: 'e-u', where: { region: 0, stage: 0, level: 1, node: null, battle: 0, turn: null }, path: 'spark' },
      memory: { lastBattle: { eventId: 'x', result: 'win', hpLeftShare: 0.5, turns: 5, team: ['rattata'] } },
    }];
    run.story.flags.ultimateRival = 'u';
    run.story.flags['ultimate:ever:u'] = true;
    run.story.flags['rivalW:u'] = 1;
    session.profile.rivalArchive.push({ runId: 'old', name: 'Gary', classId: 'youngster', archetype: 'proud', style: 'rush', traits, state: 'nemesis', encounters: 4, resolution: 'good', team: ['pidgey'], ultimate: true });
    game.scene.getScenes(true)[0].scene.start('Map');
  });
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('Map');
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const s = (window as any).__pkr.game.scene.getScene('Map');
    s.activate(s.options.findIndex((o: any) => o.kind === 'notebook'));
  });
  const texts = () =>
    page.evaluate(() => {
      const all = (o: any): any[] => (o.list ? [o, ...o.list.flatMap(all)] : [o]);
      return (window as any).__pkr.game.scene.getScene('Map').children.list.flatMap(all).filter((o: any) => o.type === 'Text').map((o: any) => o.text as string).join('\n');
    });
  await expect.poll(texts, { timeout: 5000 }).toContain('Rival Notebook');
  expect(await texts()).toContain('Joey');
  expect(await texts()).toContain('Fire');
  expect(errors).toEqual([]);
});

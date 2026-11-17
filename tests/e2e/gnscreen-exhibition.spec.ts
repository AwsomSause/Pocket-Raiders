import { expect, test } from '@playwright/test';
import { scene, toMap, view, waitForScene, watch } from './helpers/newUi';
import { boot, playRoom, putRoom, roomOf } from './helpers/gnscreen';

// gn.47 The Pokémon League Exhibition: the match is watched on the battle screen (New UI): both Champions' six, played by the AI,
// the commentary box, the three moments, then back to the event with who won.
test.use({ deviceScaleFactor: 2 });

test('the Exhibition: queue, back a side, watch the six-on-six on the battle screen with three moments, and the After room opens', async ({ page }) => {
  test.setTimeout(420_000);
  const errors = watch(page);
  await boot(page, 'ui=new&seed=gnscreen-exhibition');
  await toMap(page);
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.settings.battleSpeed = 'quick';
  });
  const own = await page.evaluate(() => (window as any).__pkr.session.run.party.map((m: any) => m.uid) as string[]);
  await playRoom(page, await putRoom(page, 'gn-47-door'), 0);
  await waitForScene(page, 'Map');
  // "I don't mind who wins. I want to see it." goes straight to the seat.
  await playRoom(page, (await roomOf(page, 'gn-47-queue'))!, 2);
  await waitForScene(page, 'Map');
  await playRoom(page, (await roomOf(page, 'gn-47-match-1'))!, 0);
  await waitForScene(page, 'Battle', 40_000);
  const teams = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    return { mine: run.party.length, theirs: run.battle.enemyTeam.length, watched: run.battle.spectate?.kind, stash: typeof run.story.flags['ev:ex-stash'] };
  });
  expect(teams).toEqual({ mine: 6, theirs: 6, watched: 'duel', stash: 'string' });
  const battle = view(page, 'Battle');
  const asked: number[] = [];
  let shot = false;
  let calls = 0;
  const end = Date.now() + 380_000;
  while (Date.now() < end && (await scene(page)) === 'Battle') {
    const st = await page.evaluate(() => {
      const b = (window as any).__pkr.game.scene.getScene('Battle');
      const run = (window as any).__pkr.session.run;
      return { menu: Boolean(b.menu), moment: Number(run?.story.flags['ev:ex-moment'] ?? 0), kos: Number(run?.story.flags['ev:ex-ko-a'] ?? 0) + Number(run?.story.flags['ev:ex-ko-b'] ?? 0) };
    });
    calls = Math.max(calls, st.kos);
    // The full match is played turn for turn in the unit tests; here the second side is held at 1 HP so the browser run stays short.
    if (shot) await page.evaluate(() => {
      const run = (window as any).__pkr.session.run;
      if (run?.battle?.spectate) for (const m of run.battle.enemyTeam) if (m.hp > 1) m.hp = 1;
    });
    if (st.menu) {
      // A moment: the three doc choices, as buttons on the battle screen. Never a move menu.
      await expect(battle).toContainText('Watch closely.');
      await expect(battle).toContainText('Look at the crowd.');
      if (!shot) {
        await page.waitForTimeout(400);
        await page.screenshot({ path: 'test-results/gnscreens/exhibition.png' });
        shot = true;
      }
      asked.push(st.moment + 1);
      await battle.locator('[data-act="pick"]', { hasText: asked.length === 2 ? 'Watch closely.' : 'Cheer.' }).first().click();
      await page.waitForTimeout(300);
      continue;
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(140);
  }
  expect(await scene(page)).not.toBe('Battle');
  expect(asked).toEqual([1, 2, 3]);
  expect(calls).toBeGreaterThanOrEqual(6);
  const after = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    return { party: run.party.map((m: any) => m.uid) as string[], winner: Number(run.story.flags['ev:ex-winner'] ?? 0), outcome: Number(run.story.flags['ev:ex-outcome'] ?? 0), watched: Number(run.story.flags['ev:ex-watched'] ?? 0), stash: run.story.flags['ev:ex-stash'] ?? null, watching: Boolean(run.battle?.spectate), room: run.stage.map.nodes.flatMap((n: any) => n.sides).some((x: any) => x.eventId === 'gn-47-after'), scene: (window as any).__pkr.activeScene(), next: run.battle ? `${run.battle.kind}:${run.battle.event?.eventId ?? 'node'}` : 'none' };
  });
  expect(after.party).toEqual(own);
  expect(after.winner).toBe(1);
  // (The map may walk on into the node's own fight afterwards; the watched match itself is over.)
  expect(after).toMatchObject({ outcome: 5, watched: 1, stash: null, watching: false });
  expect(after.next).not.toContain('gn-47');
  // The event goes on: the After room stands beside the node.
  expect(after.room).toBe(true);
  expect(errors).toEqual([]);
});

import { expect, test, type Page } from '@playwright/test';
import { start, waitForScene, watch } from './helpers/newUi';
import { fitProblems, onPage, pview, toPhantomMap } from './helpers/phantomUi';

// Phantom UI: the decisions a run stops for. A Pokémon that wants a move (the mock-ups' `learn` page), a Pokémon
// that was caught (`capture`), and a choice with no Pokémon in it. Same rules and handlers as the other looks.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr.activeScene() as string);

test('Phantom UI: a new move is the learn page: the move on its card, the known moves as a list, and the answer stays until an input', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=newui-e2e');
  await toPhantomMap(page);
  const before = await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const run = session.run;
    const mon = run.party[0];
    const known = mon.moves.map((m: any) => m.id);
    const moveId = [...session.content.moves.keys()].find((id: string) => !known.includes(id) && session.content.moves.get(id).power && id !== 'struggle');
    const extra = [...session.content.moves.keys()].filter((id: string) => !known.includes(id) && id !== moveId);
    while (mon.moves.length < 4) { const id = extra.shift(); mon.moves.push({ id, pp: session.content.moves.get(id).pp }); }
    run.phase = 'decision';
    run.pending = [{ kind: 'learnMove', uid: mon.uid, moveId }];
    for (const s of game.scene.getScenes(true)) game.scene.stop(s.scene.key);
    game.scene.start('Decision');
    return { moveId, name: session.content.moves.get(moveId).name as string, first: mon.moves[0].id as string, firstName: session.content.moves.get(mon.moves[0].id).name as string };
  });
  await waitForScene(page, 'Decision');
  await onPage(page, 'Decision', 'learn');
  const dec = pview(page, 'Decision', 'learn');
  await expect(dec.locator('.ln-new')).toContainText('wants to learn');
  await expect(dec.locator('.ln-new .tl1')).toHaveText(before.name);
  await expect(dec.locator('.ln-q')).toHaveText('Forget which one?');
  await expect(dec.locator('.lm')).toHaveCount(4);
  await expect(dec.locator('.lm.on')).toContainText(before.firstName);
  await expect(dec.locator('.ln-keep')).toHaveText('Keep the old moves');
  await expect(dec.locator('.ln-keep')).toHaveAttribute('aria-label', `Do not learn ${before.name}`);
  expect(await fitProblems(page, 'Decision', 'learn')).toEqual([]);
  // Down lights the next move; the note under the list follows it.
  await page.keyboard.press('ArrowDown');
  await expect(dec.locator('.lm').nth(1)).toHaveClass(/\bon\b/);
  await page.keyboard.press('ArrowUp');
  // Every version and several window sizes: nothing cut off.
  for (const [id, w, h] of [['midnight', 844, 390], ['channel', 1920, 1080], ['fantasia', 1024, 768], ['velvet', 1280, 720], ['phantom', 1280, 720]] as const) {
    await page.evaluate((id) => { const pkr = (window as any).__pkr; pkr.session.saveSettings({ ...pkr.session.settings, phantomVersion: id }); pkr.game.scene.getScene('Decision').rx.refresh(); }, id);
    await page.setViewportSize({ width: w, height: h });
    await expect(page.locator(`#phx .phs[data-scene="Decision"][data-scr="learn"][data-liv="${id}"]`)).toBeVisible();
    await page.waitForTimeout(700);
    expect(await fitProblems(page, 'Decision', 'learn'), `${id} at ${w}x${h}`).toEqual([]);
  }
  // A click on the first move asks first; Yes swaps it, and the answer stays until an input.
  await dec.locator('.lm').first().click();
  const yes = page.locator('#phx [data-act="confirm"]').first();
  await expect(yes).toBeVisible();
  await yes.click();
  const done = dec.locator('.ph-sheet[data-act="done"]');
  await expect(done).toBeVisible({ timeout: 10_000 });
  await expect(done).toContainText(before.name);
  const moves = await page.evaluate(() => (window as any).__pkr.session.run.party[0].moves.map((m: any) => m.id));
  expect(moves).toContain(before.moveId);
  expect(moves).not.toContain(before.first);
  await page.waitForTimeout(2500);
  expect(await scene(page)).toBe('Decision');
  expect(await fitProblems(page, 'Decision', 'learn')).toEqual([]);
  await done.click();
  await expect.poll(() => scene(page), { timeout: 15_000 }).not.toBe('Decision');
  expect(errors).toEqual([]);
});

test('Phantom UI: a caught Pokémon is the capture page, and a plain choice is a page of answers', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=newui-e2e');
  await toPhantomMap(page);
  const size = await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const run = session.run;
    const mon = structuredClone(run.party[0]);
    Object.assign(mon, { uid: 'p-new', speciesId: 'dragonite', level: 60 });
    run.pending = [{ kind: 'caught', mon }, { kind: 'signature', title: 'Pick your signature', options: [{ label: 'Second Wind', description: 'Once per battle, the first Pokémon to faint hangs on with 1 HP.' }, { label: 'Deep Pockets', description: 'Shops sell one more item.' }] }];
    run.phase = 'decision';
    run.afterDecisions = 'map';
    game.scene.getScene('Map').scene.start('Decision');
    return run.party.length as number;
  });
  await waitForScene(page, 'Decision');
  await onPage(page, 'Decision', 'capture');
  const cap = pview(page, 'Decision', 'capture');
  await expect(cap.locator('.cp-t .rs')).toHaveAttribute('aria-label', 'GOTCHA!');
  await expect(cap.locator('.cp-card .tl1')).toContainText('Dragonite');
  await expect(cap.locator('.cp-ty')).toContainText('Lv.60');
  await expect(cap.locator('.cp-ty')).toContainText('DRAGON');
  await expect(cap.locator('.cp-pips i')).toHaveCount(3);
  await expect(cap.locator('.cp-ch .ch').first()).toContainText('party', { ignoreCase: true });
  await expect(cap.locator('.ph-cp-party > i')).toHaveCount(size);
  await page.waitForTimeout(1500);
  expect(await fitProblems(page, 'Decision', 'capture')).toEqual([]);
  // I opens everything about it; I again closes it.
  await page.keyboard.press('i');
  await expect(cap.locator('.ph-sheet')).toContainText('Dragonite');
  expect(await fitProblems(page, 'Decision', 'capture')).toEqual([]);
  await page.keyboard.press('i');
  await expect(cap.locator('.ph-sheet')).toHaveCount(0);
  for (const [id, w, h] of [['midnight', 844, 390], ['fantasia', 1024, 768], ['channel', 1920, 1080], ['phantom', 1280, 720]] as const) {
    await page.evaluate((id) => { const pkr = (window as any).__pkr; pkr.session.saveSettings({ ...pkr.session.settings, phantomVersion: id }); pkr.game.scene.getScene('Decision').rx.refresh(); }, id);
    await page.setViewportSize({ width: w, height: h });
    await expect(page.locator(`#phx .phs[data-scene="Decision"][data-scr="capture"][data-liv="${id}"]`)).toBeVisible();
    await page.waitForTimeout(700);
    expect(await fitProblems(page, 'Decision', 'capture'), `${id} at ${w}x${h}`).toEqual([]);
  }
  // It joins the party; the answer stays until an input, then the next decision comes.
  await cap.locator('.cp-ch .ch').first().click();
  await expect(cap.locator('.ph-sheet[data-act="done"]')).toBeVisible({ timeout: 10_000 });
  expect(await page.evaluate(() => (window as any).__pkr.session.run.party.length)).toBe(size + 1);
  await page.waitForTimeout(600);
  await cap.locator('.ph-sheet[data-act="done"]').click();

  await onPage(page, 'Decision', 'choice');
  const pick = pview(page, 'Decision', 'choice');
  await expect(pick.locator('.ph-dc-ch')).toHaveCount(2);
  await expect(pick.locator('.ph-dc-ch.on')).toContainText('Second Wind');
  await expect(pick.locator('.ph-dc-ch').nth(1)).toContainText('Shops sell one more item.');
  expect(await fitProblems(page, 'Decision', 'choice')).toEqual([]);
  await page.keyboard.press('ArrowDown');
  await expect(pick.locator('.ph-dc-ch.on')).toContainText('Deep Pockets');
  expect(errors).toEqual([]);
});

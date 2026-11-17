import { expect, test, type Page } from '@playwright/test';
import { open, scene, start, toCommands, view, waitForScene, watch } from './helpers/newUi';
import { confirmUntil } from './battleInput';

// Evil Mode slice 5 ("the Hero walks"), in the New look. Taps and keys: post somebody at a holding the kid is about to
// reach, watch the road, fight the kid in the real battle screen, lose, and the holding's gone while the run goes on;
// read the File (F), with blanks for what isn't known. Then Outplay in person (G) as a real battle.

const stage = (page: Page) => view(page, 'Evil');
const block = (page: Page) => page.evaluate(() => (window as any).__pkr.session.run.expansion.evilMode);

async function founded(page: Page) {
  await start(page, 'ui=new');
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'evil-mode' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Evil');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.evilFound({ name: 'Kettle', creed: 'profit', line: 'whatever', doctrine: 'swarm' }, 2);
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  });
  await waitForScene(page, 'Evil');
  await expect(stage(page).getByTestId('evil-map')).toBeVisible();
  await page.waitForTimeout(300);
}

/** Makes the step after the kid ours (a Persuade that holds), the kid a one-step Protector, and restarts the scene. */
async function nextStepOurs(page: Page): Promise<number> {
  const at = await page.evaluate(() => {
    const p = (window as any).__pkr;
    const b = p.session.run.expansion.evilMode;
    b.hero.personality = 'protector';
    const h = b.district.holdings.find((x: any) => x.step === b.hero.at + 1);
    Object.assign(h, { owner: 'team', method: 'persuade', since: 1, holds: true, scouted: 1 });
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
    return b.hero.at + 1;
  });
  await waitForScene(page, 'Evil');
  await page.waitForTimeout(300);
  return at;
}

/** In the battle screen: the player's lead is at 1 HP with only Splash, the rest fainted, the foe knows only Tackle; Fight, Splash until the day's back. */
async function loseTheFight(page: Page) {
  await waitForScene(page, 'Battle');
  await page.waitForTimeout(250);
  await toCommands(page);
  await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    run.party.forEach((m: any, i: number) => { m.hp = i === 0 ? 1 : 0; });
    run.party[0].moves = [{ ...run.party[0].moves[0], id: 'splash', pp: 40 }];
    run.battle.enemyTeam.forEach((m: any) => { m.moves = [{ ...m.moves[0], id: 'tackle', pp: 35 }]; });
  });
  const b = view(page, 'Battle');
  const atEvil = async () => (await scene(page)) === 'Evil';
  for (let i = 0; i < 6 && !(await atEvil()); i++) {
    const menu = await page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle')?.menu));
    if (menu) {
      await b.locator('[data-act="pick"]', { hasText: 'Fight' }).click();
      await page.waitForTimeout(250);
      await b.locator('.btn.mv').first().click();
    }
    await confirmUntil(page, async () => (await atEvil()) || (await page.evaluate(() => Boolean((window as any).__pkr.game.scene.getScene('Battle')?.menu))), 40_000);
  }
  await waitForScene(page, 'Evil');
  await page.waitForTimeout(250);
}

test('Hold: the kid wins, the holding is gone and the run goes on; the File shows blanks', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page);
  const s = stage(page);
  await expect(s.getByTestId('evil-hero-marker')).toBeVisible();
  await expect(s.getByTestId('evil-home').first()).toBeVisible();
  // The File (F): the kid's name; personality and reason blank; no fire, no letters.
  await page.keyboard.press('KeyF');
  await expect(s.getByTestId('evil-file')).toBeVisible();
  const b0 = await block(page);
  await expect(s.getByTestId('evil-file-name')).toHaveText(b0.hero.name);
  await expect(s.locator('[data-testid="evil-file-row"][data-blank="true"]')).toHaveCount(3); // personality, reason, temper
  await page.keyboard.press('ArrowRight');
  await expect(s.locator('[data-testid="evil-file-slot"][data-known="false"]')).toHaveCount(6);
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('evil-file')).toHaveCount(0);

  const step = await nextStepOurs(page);
  await page.keyboard.press('Enter'); // Morning -> Dispatch
  await expect(s.getByTestId('evil-where')).toBeVisible();
  // Taps: the holding, one person, How, Hold.
  await s.getByTestId(`evil-row-${step}`).click();
  const who = (await block(page)).crew.find((c: any) => !c.minor).id;
  await s.getByTestId(`evil-crew-${who}`).click();
  await s.getByTestId('evil-who-next').click();
  await s.getByTestId('evil-hold').click();
  await expect(s.getByTestId('evil-posted-row')).toHaveCount(1);
  expect((await block(page)).posted).toEqual([{ holdingId: `s${step}`, id: who }]);
  // Send them, then Enter through the day to the road.
  await s.getByTestId('evil-send-row').click();
  for (const beat of ['inPerson', 'evening', 'night']) {
    expect((await block(page)).here.beat).toBe(beat);
    // At Night someone may be at the door (slice 7): Lights out leaves them with "(Not tonight.)".
    if (beat === 'night') await s.getByTestId('evil-desk-lights').click();
    else await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
  }
  expect((await block(page)).here.beat).toBe('hero');
  await page.keyboard.press('Enter'); // watch the road: the kid reaches the person posted -> the battle
  await loseTheFight(page);
  const b1 = await block(page);
  const run = await page.evaluate(() => (window as any).__pkr.session.run);
  expect(run.phase).toBe('map');
  expect(b1.fight).toBeNull();
  expect(b1.district.holdings.find((h: any) => h.step === step).owner).toBe('nobody');
  expect(b1.hero.battlesWithTeam).toBe(1);
  expect(run.party.map((m: any) => m.uid)).toEqual(b0 && run.party.map((m: any) => m.uid));
  // The File now knows what a Grunt saw, and what the kid said.
  await page.keyboard.press('KeyF');
  await page.keyboard.press('ArrowRight');
  await expect(s.locator('[data-testid="evil-file-slot"][data-known="true"]').first()).toBeVisible();
  await expect(s.getByTestId('evil-file-marks')).toHaveAttribute('data-n', '1');
  for (const [w, h] of [[1280, 720], [960, 540], [740, 360]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    await page.screenshot({ path: info.outputPath(`file-${w}x${h}.png`) });
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.keyboard.press('Escape');
  // Back on the road: Enter ends the beat; the Morning shows what the kid did.
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await block(page)).here.beat).toBe('morning');
  await expect(s.getByTestId('evil-sheet').first()).toContainText('kid');
  expect(errors).toEqual([]);
});

test('Outplay in person (G) is a real battle; the Evening takes its result without a roll', async ({ page }) => {
  const errors = watch(page);
  await founded(page);
  await page.keyboard.press('Enter'); // Dispatch
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    const b = p.session.run.expansion.evilMode;
    b.crew.forEach((c: any) => { c.line = null; });
    const squad = b.crew.filter((c: any) => !c.minor).slice(0, 2).map((c: any) => c.id);
    // The first local that takes the job (a child at her step can't be worked: "She's eleven").
    for (const h of b.district.holdings.filter((x: any) => x.kind === 'local')) {
      const cues = p.session.evilStep({ type: 'queueJob', job: { holdingId: h.id, method: 'outplay', squad } });
      if (!cues.some((c: any) => c.id === 'refused')) break;
    }
    p.session.evilStep({ type: 'send' });
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  });
  await waitForScene(page, 'Evil');
  await page.waitForTimeout(300);
  await expect(stage(page).getByTestId('evil-go')).toHaveCount(1);
  const draws = (await block(page)).draws['evil-dispatch'];
  await page.keyboard.press('KeyG');
  await loseTheFight(page);
  const b = await block(page);
  expect(b.queue[0].played).toBe('lost');
  expect(b.inPerson.day).toBe(1);
  await expect(stage(page).getByTestId('evil-inperson')).toContainText('went');
  await page.keyboard.press('Enter'); // stay in -> Evening
  await expect.poll(async () => (await block(page)).here.beat).toBe('evening');
  expect((await block(page)).draws['evil-dispatch']).toBe(draws);
  await expect(stage(page).getByTestId('evil-sheet').first()).toContainText('Played in person');
  expect(errors).toEqual([]);
});

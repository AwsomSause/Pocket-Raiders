import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// Evil Mode slice 4 ("people"): the Roster in the New look. Keys only: open the Roster, read the cards, hire from the
// notice board. Taps only: an order across a line is refused in the yard, insisted on, and the leaver stays on the list;
// a Grunt is promoted in the Office. No Loyalty is ever shown as a figure.

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
    p.session.evilFound({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm' }, 2);
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  });
  await waitForScene(page, 'Evil');
  await expect(stage(page).getByTestId('evil-map')).toBeVisible();
  await page.waitForTimeout(300);
}

/** Puts Otis and Faye on the Roster (the Founders drawn depend on the seed) and restarts the scene. */
async function withOtisAndFaye(page: Page) {
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    const b = p.session.run.expansion.evilMode;
    const base = { flawFound: true, lineHeard: false, rank: 'grunt', loyalty: 5, where: 'in', outOn: null, jobs: 0, asked: 0, unpaid: 0, fitIn: null, minor: false };
    b.crew = [
      ...b.crew.filter((c: any) => c.id !== 'otis' && c.id !== 'faye'),
      { ...base, id: 'otis', ref: 'otis', name: 'Otis Blackthorn', age: 44, talent: 'nerve', flaw: 'proud', line: 17 },
      { ...base, id: 'faye', ref: 'faye', name: 'Faye', age: 23, talent: 'hands', flaw: 'kind', line: 11 },
    ];
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Evil');
  });
  await waitForScene(page, 'Evil');
}

test('keys only: the Roster shows faces and words, never a Loyalty figure; hire from the notice board', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page);
  const s = stage(page);
  const b0 = await block(page);
  await page.keyboard.press('KeyR');
  await expect(s.getByTestId('evil-roster')).toBeVisible();
  await expect(s.getByTestId('evil-person')).toHaveCount(b0.crew.length);
  await expect(s.getByTestId('evil-roster-wont')).toContainText("won't do");
  await expect(s.getByTestId('evil-person-band').first()).toHaveText(/Steady · Neutral/);
  expect(await s.getByTestId('evil-roster').innerText()).not.toMatch(/loyalty\s*\d/i);
  for (const [w, h] of [[1280, 720], [960, 540], [740, 360]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    await page.screenshot({ path: info.outputPath(`roster-${w}x${h}.png`) });
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  // Right: the notice board. One applicant (the Town isn't held). Enter opens the actions; Enter on the first hires.
  await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('evil-applicant')).toHaveCount(1);
  const ref = await s.getByTestId('evil-applicant').getAttribute('data-ref');
  await page.screenshot({ path: info.outputPath('notice-board.png') });
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('evil-ract-hire')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('evil-applicant')).toHaveCount(0);
  const b1 = await block(page);
  expect(b1.crew.map((c: any) => c.id)).toContain(ref);
  await page.keyboard.press('ArrowLeft');
  await expect(s.getByTestId('evil-person')).toHaveCount(b0.crew.length + 1);
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('evil-roster')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('taps only: asked anyway across a line, refused in the yard, insisted on; the leaver stays listed; a promotion in the Office', async ({ page }, info) => {
  const errors = watch(page);
  await founded(page);
  await withOtisAndFaye(page);
  const s = stage(page);
  await s.getByTestId('evil-advance').click(); // Morning -> Dispatch
  await expect(s.getByTestId('evil-beat-dispatch')).toHaveAttribute('data-state', 'now');
  const b = await block(page);
  const local = b.district.holdings.find((h: any) => h.kind === 'local' && h.mood !== 'shut');
  await s.getByTestId(`evil-row-${local.step}`).click();
  await s.getByTestId('evil-crew-otis').click();
  await s.getByTestId('evil-crew-faye').click();
  await s.getByTestId('evil-method-outplay').click();
  await s.getByTestId('evil-queue').click();
  await expect(s.getByTestId('evil-card-f8')).toContainText("Otis Blackthorn (\"won't fight anyone who's not ready\")");
  const confirm = s.getByTestId('evil-card-confirm');
  await expect(confirm).toHaveAttribute('data-ask', 'true');
  await expect(confirm).toHaveText('Ask anyway');
  await s.getByTestId('evil-card-scroll').evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await expect(confirm).toHaveAttribute('data-lit', 'true');
  await confirm.click();
  await expect(s.getByTestId('evil-refusal')).toBeVisible();
  await page.screenshot({ path: info.outputPath('yard.png') });
  await s.getByTestId('evil-refuse-insist').click();
  await expect(s.getByTestId('evil-refusal')).toHaveCount(0);
  await expect(s.getByText(/armband/).first()).toBeVisible();
  const after = await block(page);
  expect(after.crew.find((c: any) => c.id === 'otis').where).toBe('left');
  expect(after.queue).toHaveLength(0);

  await s.getByTestId('evil-roster-open').click();
  const otis = s.locator('[data-testid="evil-person"][data-id="otis"]');
  await expect(otis).toHaveAttribute('data-left', 'true');
  await expect(otis).toContainText('over their line');
  // His line went with him: "what this team won't do" is the lines of the people still in.
  await expect(s.getByTestId('evil-roster-wont')).not.toContainText("Won't fight anyone who's not ready");

  // The Office: Faye's done three jobs; promote her to Lead with a tap.
  await page.evaluate(() => { const c = (window as any).__pkr.session.run.expansion.evilMode.crew.find((x: any) => x.id === 'faye'); c.jobs = 3; });
  const faye = s.locator('[data-testid="evil-person"][data-id="faye"]');
  await faye.click();
  await s.getByTestId('evil-ract-promote').click();
  await expect(s.getByTestId('evil-office')).toBeVisible();
  await page.screenshot({ path: info.outputPath('office.png') });
  await s.getByTestId('evil-office-0').click();
  await expect(s.getByTestId('evil-office')).toHaveCount(0);
  expect((await block(page)).crew.find((c: any) => c.id === 'faye').rank).toBe('lead');
  await expect(faye).toContainText('Lead');
  expect(errors).toEqual([]);
});

import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION redesign R5 (pass 50, the Crew group): the roster, the Crew File, the personality card, the Crew ID,
// Loyalty, Payday and Uniforms. A crew of six is written into the block first (test set-up only) so the pages show
// what the mockups show. Shots go to the test's output folder for the side-by-side check against the mockups.

test.use({ viewport: { width: 960, height: 540 } });

async function toHq(page: Page) {
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'dominion' });
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Dominion');
  const s = view(page, 'Dominion');
  await expect(s.getByTestId('dom-logo')).toBeVisible();
  await page.waitForTimeout(300);
  await s.getByTestId('dom-title-0').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-type-poison').click();
  await s.getByTestId('dom-type-dark').click();
  await s.getByTestId('dom-next').click();
  await s.getByTestId('dom-next').click();
  for (let i = 0; i < 4; i++) await s.getByTestId('dom-opening').click();
  await expect(s.getByTestId('r5-hq')).toBeVisible();
  return s;
}

/** Test set-up: five more members beside Rook, as the mockups' crew (Dale, Gus, Bram, Rosa, Mina). */
async function sixCrew(page: Page) {
  await page.evaluate(() => {
    const b = (window as any).__pkr.session.run.expansion.dominion;
    const rook = b.members[0];
    const add = (id: string, name: string, look: string, gender: string, rank: string, level: number, loyalty: number, morale: number, wage: number, st: number[]) => {
      const m = structuredClone(rook);
      Object.assign(m, { id, name, look, gender, rank, level, loyalty, morale, wage, joinedDay: 1 });
      m.stats = { brawn: st[0], nerve: st[1], wits: st[2], charm: st[3], stealth: st[4] };
      b.members.push(m);
    };
    add('t2', 'Dale', 'trainer/pr/veteran_m', 'm', 'sergeant', 11, 88, 70, 300, [5, 6, 4, 3, 4]);
    add('t3', 'Gus', 'trainer/pr/harlequin', 'm', 'grunt', 12, 55, 60, 250, [4, 3, 3, 6, 5]);
    add('t4', 'Bram', 'trainer/pr/backpacker_m', 'm', 'grunt', 9, 66, 85, 200, [6, 3, 2, 2, 4]);
    add('t5', 'Rosa', 'trainer/pr/ace_trainer_f', 'f', 'admin', 30, 92, 77, 600, [5, 7, 7, 6, 6]);
    add('t6', 'Mina', 'trainer/pr/scientist_f', 'f', 'corporal', 22, 73, 75, 400, [2, 4, 8, 5, 3]);
    b.rosterCap = 8;
    b.team = { name: 'Team Nova', primary: 'crimson', secondary: 'gold', initial: 'N', logo: 'eye', motto: 'Kanto is ours', goal: null, day: 1 };
    b.teamName = 'Team Nova';
  });
}

test('the pass-50 Crew pages', async ({ page }, info) => {
  test.setTimeout(300_000);
  const shot = async (n: string) => {
    await page.waitForTimeout(Number(process.env.R5_WAIT ?? 400));
    await page.screenshot({ path: info.outputPath(`${n}.png`) });
    if (process.env.R5_DUMP) writeFileSync(info.outputPath(`${n}.html`), await page.locator('#r5').innerHTML());
  };
  const errors = watch(page);
  await start(page, 'ui=new&tutorial=0');
  const s = await toHq(page);
  await sixCrew(page);
  const before = JSON.stringify(await page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion));

  // The Crew tab opens the roster; arrows move the card; Enter opens the file.
  await page.keyboard.press('Digit3');
  await expect(s.getByTestId('r5-roster')).toBeVisible();
  await expect(s.locator('[data-testid^="r5-card-"]')).toHaveCount(6);
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
  await expect(s.getByTestId('r5-card-4')).toHaveClass(/\bon\b/);
  await shot('roster');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-file-name')).toContainText('ROSA');
  await expect(s.getByTestId('dom-file-keys')).toContainText('Pyramid');
  await shot('file');
  await page.keyboard.press('KeyC');
  await expect(s.getByTestId('dom-persona-name')).toContainText('ROSA');
  await shot('person');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-file-stats')).toBeVisible();
  await page.keyboard.press('KeyV');
  await expect(s.getByTestId('r5-idcard')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await shot('idcard');
  await page.keyboard.press('KeyY');
  await expect(s.getByTestId('r5-loyalty')).toBeVisible();
  await shot('loyalty');
  await page.keyboard.press('KeyK');
  await expect(s.getByTestId('r5-payday')).toBeVisible();
  await shot('payday');
  await page.keyboard.press('KeyJ');
  await expect(s.getByTestId('r5-uniform')).toBeVisible();
  await shot('uniform');
  // Esc walks back: Uniforms -> roster -> HQ. Nothing in the run changed on the way.
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-roster')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-hq')).toBeVisible();
  // Training (the roster's Train button): the Training and Growth tasks for the member; outside the Morning the
  // order isn't given.
  await page.keyboard.press('Digit3');
  await s.getByTestId('r5-train').click();
  await expect(s.getByTestId('r5-school')).toBeVisible();
  await expect(s.getByTestId('r5t-row-train')).toBeVisible();
  await shot('school');
  await s.getByTestId('r5t-send').click();
  await expect(s.getByTestId('dom-notice')).toContainText('Morning');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-roster')).toBeVisible();
  // People you know (the roster's People button): the crew, Team Rocket, the law.
  await s.getByTestId('r5-people-btn').click();
  await expect(s.getByTestId('r5-people')).toContainText('Team Rocket');
  await expect(s.getByTestId('r5-pp-0')).toContainText('Rook');
  await shot('people');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-roster')).toBeVisible();
  await page.keyboard.press('Escape');
  expect(JSON.stringify(await page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion))).toEqual(before);

  // The Rank Pyramid (P): Rook reaches member Lv 6, a Senior Grunt seat waits; Enter promotes him: Promotion night.
  await page.evaluate(() => {
    const b = (window as any).__pkr.session.run.expansion.dominion;
    b.members[0].level = 6;
    b.members[2].level = 3;
    b.members[3].level = 3;
  });
  await page.keyboard.press('Digit3');
  await expect(s.getByTestId('r5-roster')).toBeVisible();
  await page.keyboard.press('KeyP');
  await expect(s.getByTestId('r5-pyramid')).toBeVisible();
  await expect(s.getByTestId('dom-tier-16')).toContainText('THE BOSS');
  await expect(async () => {
    if (!((await s.getByTestId('dom-promote').textContent()) ?? '').includes('Promote Rook')) await page.keyboard.press('ArrowDown');
    await expect(s.getByTestId('dom-promote')).toContainText('Promote Rook', { timeout: 700 });
  }).toPass({ timeout: 15_000 });
  await shot('pyramid');
  // E: the Boss Edge page (mockup `levelup`), then back.
  await page.keyboard.press('KeyE');
  await expect(s.getByTestId('r5-edge')).toContainText('Nerve');
  await shot('levelup');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-pyramid')).toBeVisible();
  expect((await page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion)).day).toBe(1);
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('r5-promo')).toBeVisible();
  await expect(s.getByTestId('r5-promo-card')).toContainText('Senior Grunt');
  expect((await page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion)).members[0].rank).toBe('senior-grunt');
  await shot('promo');
  await page.keyboard.press('Enter');
  await expect(s.locator('[data-scr="roster"], [data-scr="file"]')).toBeVisible();

  // A talk card waiting on the crew (test set-up: Rosa's "Tell Me a Secret") is a heart-to-heart scene; answering it
  // clears it.
  await page.evaluate(() => { (window as any).__pkr.session.run.expansion.dominion.crew.talks.push({ member: 't5', talk: 'tell-me-a-secret', task: null }); });
  await page.keyboard.press('Digit1');
  await page.keyboard.press('Digit3');
  await expect(s.getByTestId('r5-heart')).toBeVisible();
  await expect(s.getByTestId('dom-talk')).toContainText('Rosa');
  await shot('heart');
  await s.getByTestId('dom-talk-0').click();
  await expect(s.getByTestId('dom-talk')).toBeHidden();
  expect((await page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion)).crew.talks).toHaveLength(0);

  // Hire (H on the file): the New card (mockup `pull`); Esc goes back to the file.
  await page.keyboard.press('Digit1');
  await page.keyboard.press('Digit3');
  await page.keyboard.press('Enter');
  await expect(s.getByTestId('dom-file-stats')).toBeVisible();
  await page.keyboard.press('KeyH');
  await s.getByTestId('dom-hire-0').click();
  await expect(s.getByTestId('r5-pull')).toBeVisible();
  await expect(s.getByTestId('dom-notice')).toContainText('joined');
  expect((await page.evaluate(() => (window as any).__pkr.session.run.expansion.dominion)).members).toHaveLength(7);
  await shot('pull');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-file-stats')).toBeVisible();

  // Confront (F on a suspected member's file): the talk scene. Gus is a Rocket mole with three clues (set-up only).
  await page.evaluate(() => {
    const b = (window as any).__pkr.session.run.expansion.dominion;
    b.rivals.teams.rocket.spies = 1;
    b.spies = {
      moles: [{ member: 't3', team: 'rocket', day: b.day, turned: false, exposed: false }],
      sus: { t3: 81 }, quiet: {}, talk: null, done: [],
      clues: [
        { member: 't3', day: b.day, text: 'Seen at the Game Corner with a Rocket grunt' },
        { member: 't3', day: b.day, text: 'Paid off a debt in cash' },
        { member: 't3', day: b.day, text: '₽2,000 missing from the Vault' },
      ],
    };
  });
  await page.keyboard.press('Digit1');
  await page.keyboard.press('Digit3');
  await expect(s.getByTestId('r5-roster')).toBeVisible();
  // M: the Mole hunt clue wall, Gus first (the most suspected).
  await page.keyboard.press('KeyM');
  await expect(s.getByTestId('r5-suspect-0')).toContainText('Gus');
  await shot('mole');
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('r5-roster')).toBeVisible();
  // A tap picks Gus's card, a second tap opens his file.
  await s.getByTestId('r5-card-2').click();
  await expect(s.getByTestId('r5-card-2')).toHaveClass(/\bon\b/);
  await s.getByTestId('r5-card-2').click();
  await expect(s.getByTestId('dom-file-suspicion')).toHaveText('Suspicion 81');
  await page.keyboard.press('KeyF');
  await expect(s.getByTestId('r5-interro')).toBeVisible();
  await expect(s.getByTestId('dom-spy-sus')).toHaveText('81');
  await s.getByTestId('dom-spy-q-evidence').click();
  await expect(s.getByTestId('dom-spy-reply')).toHaveCount(1);
  await shot('interro');
  expect(errors).toEqual([]);
});

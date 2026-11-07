import { expect, test, type Page } from '@playwright/test';

// Story Overhaul S2: Look lock, Quick Start to the end of the built beats (name, pronouns, Tone), reload keeps it, no console errors.

const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
const texts = (page: Page) =>
  page.evaluate(() => {
    const out: string[] = [];
    const walk = (o: any) => {
      if (typeof o.text === 'string') out.push(o.text);
      for (const c of o.list ?? []) walk(c);
    };
    for (const sc of (window as any).__pkr.game.scene.getScenes(true)) for (const o of sc.children.list) walk(o);
    return out.join('\n');
  });
const press = async (page: Page, key: string, n = 1) => {
  for (let i = 0; i < n; i++) {
    await page.keyboard.press(key);
    await page.waitForTimeout(120);
  }
};

test('Prologue: Look B is locked, Quick Start saves name, pronouns and Tone', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/?debug=1');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
  await page.evaluate(() => { (window as any).__pkr.game.scene.getScenes(true)[0].scene.start('Prologue'); });
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('Prologue');
  await page.waitForTimeout(500);
  expect(await texts(page)).toMatch(/Look B +\(COMING SOON\)/);
  await press(page, 'ArrowDown');
  await press(page, 'Enter'); // Look B must not be selectable; this lands on Look A at most
  expect(await page.evaluate(() => (window as any).__pkr.session.profile.story.protagonist.look)).toBe('look_a');
  expect(await texts(page)).toContain('Quick Start');
  await press(page, 'ArrowDown');
  await press(page, 'Enter'); // Quick Start
  // Station: examine the map and the clipping, then go on.
  await press(page, 'Enter');
  await press(page, 'ArrowDown');
  await press(page, 'Enter');
  await press(page, 'ArrowDown', 4);
  await press(page, 'Enter');
  // Vance Question 1: "Apologise" gives formal.
  expect(await texts(page)).toContain('You were late.');
  await press(page, 'Enter');
  await press(page, 'Enter');
  // Name, then pronouns: she/her.
  await page.getByTestId('prologue-name').fill('Kay');
  await page.getByTestId('prologue-name').press('Enter');
  await page.waitForTimeout(200);
  await press(page, 'Enter'); // she/her
  await press(page, 'ArrowDown', 4);
  await press(page, 'Enter'); // Confirm
  await press(page, 'Enter'); // first use of the name
  expect(await texts(page)).toContain('Beat 10: Departure');
  await press(page, 'Enter'); // Finish
  await expect.poll(() => scene(page)).toBe('MainMenu');
  const story = () => page.evaluate(() => (window as any).__pkr.session.profile.story);
  expect(await story()).toMatchObject({ protagonist: { name: 'Kay', pronouns: 'she', nameSet: true, look: 'look_a' }, prologue: { done: true, mode: 'quick', vanceTone: 'formal' } });
  await page.reload();
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
  expect(await story()).toMatchObject({ protagonist: { name: 'Kay' }, prologue: { done: true, vanceTone: 'formal' } });
  // A finished prologue opens the Short Intake with Vance's formal greeting.
  await page.evaluate(() => { (window as any).__pkr.game.scene.getScenes(true)[0].scene.start('Prologue'); });
  await page.waitForTimeout(500);
  expect(await texts(page)).toContain('Good morning, Kay. You are on time.');
  expect(errors).toEqual([]);
});

test('Story Run: the title entry plays the prologue, then trainer choice and the Desk in Story Run mode', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/?debug=1');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
  expect(await texts(page)).toContain('Story Run');
  // A finished prologue: the Short Intake offers to begin the Story Run.
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.changeProfile((p: any) => ({ ...p, story: { ...p.story, protagonist: { ...p.story.protagonist, name: 'Kay', nameSet: true }, prologue: { ...p.story.prologue, done: true } } }));
    (window as any).__pkr.game.scene.getScenes(true)[0].scene.start('Prologue', { thenRun: true });
  });
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('Prologue');
  await page.waitForTimeout(400);
  expect(await texts(page)).toContain('Begin the Story Run');
  await press(page, 'Enter');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('TrainerSelect');
  await page.waitForTimeout(400);
  await press(page, 'Enter');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('RunPrep');
  const mode = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('RunPrep').rules.modeId);
  expect(mode).toBe('story-run');
  expect(await texts(page)).toContain('Story Run');
  expect(errors).toEqual([]);
});

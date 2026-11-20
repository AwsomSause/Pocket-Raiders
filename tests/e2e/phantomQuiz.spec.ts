import { expect, test, type Page } from '@playwright/test';
import { open, start, watch } from './helpers/newUi';
import { fitProblems, onPage, pview } from './helpers/phantomUi';

// Phantom UI: the partner quiz. Prof. Vance asks, the answers are dealt as numbered cards two to a row, and the same
// keys, numbers and clicks answer. The professor's story portrait stays on the page on the talk page before it too.

const quiz = (page: Page) => page.evaluate(() => {
  const s = (window as any).__pkr.game.scene.getScene('Prologue');
  return { at: s.rxM.quiz?.at ?? null, of: s.rxM.quiz?.of ?? null, n: s.rxM.options.length as number, index: (s.menu?.index ?? -1) as number, answers: Object.keys(s.answers).length };
});
const lit = (page: Page) => page.evaluate(() => [...document.querySelectorAll('#phx .phs[data-scene="Prologue"] .ph-qz-ch')].findIndex((e) => e.classList.contains('on')));
/** The tallest picture in the view, in the page's own 720 units: [top, bottom]. */
const tallest = (page: Page, sel: string) => page.evaluate((sel) => {
  const S = document.querySelector<HTMLElement>('#phx .phs[data-scene="Prologue"]')!;
  const box = S.getBoundingClientRect(), k = box.height / 720;
  let top = 1e9, bottom = -1e9;
  for (const el of S.querySelectorAll<HTMLElement>(sel)) { const r = el.getBoundingClientRect(); if (r.height < 40 * k) continue; top = Math.min(top, (r.top - box.top) / k); bottom = Math.max(bottom, (r.bottom - box.top) / k); }
  return [Math.round(top), Math.round(bottom)];
}, sel);
const press = async (page: Page, key: string) => { await page.keyboard.press(key); await page.waitForTimeout(250); };

test('Phantom UI: the partner quiz is a Phantom page; numbers, arrows, Enter and Esc steer it, and Prof. Vance stays on the page', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=ph-quiz');
  await onPage(page, 'MainMenu', 'title');
  await open(page, 'Prologue');
  await page.waitForTimeout(400);
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Prologue').go('quiz'));
  await page.waitForTimeout(600);
  await onPage(page, 'Prologue', 'quiz');
  const q = pview(page, 'Prologue', 'quiz');
  const first = await quiz(page);
  expect(first.at).toBe(0);
  expect(first.n).toBeGreaterThanOrEqual(2);
  await expect(q.locator('.ph-qz-ch')).toHaveCount(first.n);
  await expect(q.locator('.ph-qz-q .lab')).toContainText(`question 1 of ${first.of}`, { ignoreCase: true });
  await expect(q.locator('.qz-pips i')).toHaveCount(first.of!);
  await expect(q.locator('.qz-pips i.n')).toHaveCount(1);
  // The professor's opening words stand above the first question, and only there.
  await expect(q.locator('.ph-qz-q p.ph-qz-in')).toContainText('No right answers, no timer');
  await expect(q.locator('.ph-qz-q p:not(.ph-qz-in)')).not.toHaveText('');
  await expect(q).toContainText('no wrong answers', { ignoreCase: true });
  // There is no question to go back to yet, so the page does not offer it.
  await expect(q.locator('.keys')).not.toContainText('Last question');
  expect(await fitProblems(page, 'Prologue', 'quiz')).toEqual([]);
  expect((await tallest(page, '.ph-qz-bust > div:last-child > *'))[0]).toBeGreaterThanOrEqual(-2);
  expect(await page.evaluate(() => Math.max(0, ...[...document.querySelectorAll<HTMLElement>('#phx .phs[data-scene="Prologue"] .ph-qz-bust i.im')].map((e) => e.offsetHeight)))).toBeLessThanOrEqual(720);
  // A number lights its answer without answering.
  expect(await lit(page)).toBe(0);
  await press(page, '2');
  expect(await lit(page)).toBe(1);
  expect((await quiz(page)).at).toBe(0);
  // Two to a row: down moves a row, right one answer, up a row back.
  await press(page, '1');
  await press(page, 'ArrowDown');
  expect(await lit(page)).toBe(first.n > 6 ? 1 : Math.min(2, first.n - 1));
  await press(page, 'ArrowUp');
  expect(await lit(page)).toBe(0);
  await press(page, 'ArrowRight');
  expect(await lit(page)).toBe(1);
  // A number past the last answer does nothing.
  if (first.n < 9) { await press(page, '9'); expect(await lit(page)).toBe(1); }
  // Pointing at a card lights it, Enter answers with the lit one.
  await q.locator('.ph-qz-ch').first().hover();
  await page.waitForTimeout(250);
  expect(await lit(page)).toBe(0);
  await press(page, 'Enter');
  await expect.poll(async () => (await quiz(page)).at).toBe(1);
  expect((await quiz(page)).answers).toBe(1);
  await expect(q.locator('.ph-qz-q .lab')).toContainText('question 2 of', { ignoreCase: true });
  await expect(q.locator('.qz-pips i.f')).toHaveCount(1);
  await expect(q.locator('.ph-qz-q p.ph-qz-in')).toHaveCount(0);
  await expect(q.locator('.keys')).toContainText('Last question', { ignoreCase: true });
  await page.waitForTimeout(700);
  expect(await fitProblems(page, 'Prologue', 'quiz')).toEqual([]);
  // Esc goes back a question; so does its key hint.
  await press(page, 'Escape');
  await expect.poll(async () => (await quiz(page)).at).toBe(0);
  await press(page, 'Enter');
  await expect.poll(async () => (await quiz(page)).at).toBe(1);
  await q.locator('.keys [data-act="back"]').click();
  await expect.poll(async () => (await quiz(page)).at).toBe(0);
  // A click on a card answers with that card.
  await page.waitForTimeout(250);
  await q.locator('.ph-qz-ch').nth(1).click();
  await expect.poll(async () => (await quiz(page)).at).toBe(1);
  // Every question fits, in other versions and window sizes too; the last answer ends the quiz.
  const sizes = [['midnight', 844, 390], ['channel', 1920, 1080], ['fantasia', 1024, 768], ['velvet', 1280, 720]] as const;
  for (let k = 1; k < first.of!; k++) {
    const [id, w, h] = sizes[k % sizes.length]!;
    await page.evaluate((id) => { const pkr = (window as any).__pkr; pkr.session.saveSettings({ ...pkr.session.settings, phantomVersion: id }); pkr.game.scene.getScene('Prologue').rx.refresh(); }, id);
    await page.setViewportSize({ width: w, height: h });
    await expect(page.locator(`#phx .phs[data-scene="Prologue"][data-scr="quiz"][data-liv="${id}"]`)).toBeVisible();
    // A new version deals the whole page in again: measure once its parts have landed.
    await page.waitForTimeout(1100);
    const now = await quiz(page);
    expect(now.at).toBe(k);
    await expect(q.locator('.ph-qz-ch')).toHaveCount(now.n);
    expect(await fitProblems(page, 'Prologue', 'quiz'), `question ${k + 1} in ${id} at ${w}x${h}`).toEqual([]);
    await press(page, 'Enter');
    if (k < first.of! - 1) await expect.poll(async () => (await quiz(page)).at).toBe(k + 1);
  }
  await expect.poll(async () => (await quiz(page)).at, { timeout: 10_000 }).toBeNull();
  await page.setViewportSize({ width: 1280, height: 720 });
  // After the quiz the professor is on an event page: the whole story portrait is on the page there too.
  const after = pview(page, 'Prologue');
  await expect(after).not.toHaveAttribute('data-scr', 'quiz');
  await page.waitForTimeout(1200);
  // The frame is drawn no taller than the page (it was 880 before), and its top, where the head is, is on the page.
  const frame = await page.evaluate(() => Math.max(0, ...[...document.querySelectorAll<HTMLElement>('#phx .phs[data-scene="Prologue"] .bust i.im')].map((e) => e.offsetHeight)));
  expect(frame).toBeGreaterThan(300);
  expect(frame).toBeLessThanOrEqual(720);
  expect((await tallest(page, '.bust > *'))[0]).toBeGreaterThanOrEqual(-2);
  expect(await fitProblems(page, 'Prologue')).toEqual([]);
  expect(errors).toEqual([]);
});

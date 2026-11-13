import { expect, test } from '@playwright/test';

// MIC1: the microphone is off by default, only measures loudness, and never blocks the game.
// Chromium's fake audio device gives a steady beep, so the meter has something to read.
test.use({ launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] } });

const scene = (page: import('@playwright/test').Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

test('mic is off by default, the setting turns it on, and the meter reads loudness', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/?seed=mic-input&campaign=dev&debug=1');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');

  // Off: asking to start does nothing and no stream is opened.
  const off = await page.evaluate(async () => {
    const { session, micMeter } = (window as any).__pkr;
    const m = micMeter();
    return { setting: session.settings.expansion.micInput, state: await m.start(session.settings.expansion.micInput) };
  });
  expect(off).toEqual({ setting: false, state: 'off' });

  // On: the meter starts, reads a non-silent level from the fake device, and stops cleanly.
  const on = await page.evaluate(async () => {
    const { session, micMeter } = (window as any).__pkr;
    session.saveSettings({ ...session.settings, expansion: { ...session.settings.expansion, micInput: true } });
    const m = micMeter();
    const state = await m.start(session.settings.expansion.micInput);
    let peak = 0;
    for (let i = 0; i < 40; i++) { peak = Math.max(peak, m.level()); await new Promise((r) => setTimeout(r, 50)); }
    m.stop();
    return { state, peak, after: m.state };
  });
  expect(on.state).toBe('on');
  expect(on.peak).toBeGreaterThan(0);
  expect(on.after).toBe('off');

  // The button path still works with the mic on: Enter moves on from the title screen.
  await page.keyboard.press('Enter');
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('Hub');
  expect(errors).toEqual([]);
});

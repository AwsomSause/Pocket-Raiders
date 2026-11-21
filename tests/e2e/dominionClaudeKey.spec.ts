import { expect, test, type Page } from '@playwright/test';

// Dominion slice D18: Settings > Rotom (mockup a1; Kice 2026-11-18: players see "Rotom", never "Claude" or "AI") and the hidden Key-Card vault (mockup a2: Settings, press 9
// eight times). `?aifake=1` swaps in the no-network fake, so nothing leaves the page. Keys here are made up.

const KEY = 'sk-ant-api03-' + 'e2eFakeKey'.repeat(5);
const scene = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
const vault = (page: Page) => page.locator('[data-testid="key-card-vault"]');
const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);

async function openSettings(page: Page, errors: string[], query: string, data: Record<string, unknown> = {}): Promise<void> {
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto(`/?aifake=1&seed=keycard-e2e${query}`);
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('MainMenu');
  await page.waitForTimeout(800);
  await page.evaluate((d) => void (window as any).__pkr.game.scene.getScene('MainMenu').scene.start('Settings', { from: 'MainMenu', ...d }), data);
  await expect.poll(() => scene(page), { timeout: 20_000 }).toBe('Settings');
  await page.waitForTimeout(600);
}

async function nines(page: Page, n: number): Promise<void> {
  for (let i = 0; i < n; i++) { await page.keyboard.press('Digit9'); await page.waitForTimeout(40); }
}

const keyIn = (page: Page) => page.evaluate((k) => ({
  session: Object.keys(sessionStorage).filter((n) => (sessionStorage.getItem(n) ?? '').includes(k)),
  local: Object.keys(localStorage).filter((n) => (localStorage.getItem(n) ?? '').includes(k)),
}), KEY);

test('eight presses of 9 open the Key-Card vault; a key is checked, sealed, and kept out of saves', async ({ page }) => {
  const errors: string[] = [];
  await openSettings(page, errors, '');
  expect(await page.evaluate(() => (window as any).__pkr.session.settings.expansion.claudeAi)).toBe('standard');

  // Boundary: seven presses, another key, then seven more: still shut (the eight must be in a row).
  await nines(page, 7);
  await page.keyboard.press('KeyQ');
  await nines(page, 7);
  await expect(vault(page)).toHaveCount(0);
  await nines(page, 1);
  await expect(vault(page)).toBeVisible();
  await expect(tid(page, 'vault-selected')).toHaveAttribute('data-card', 'diamond');
  for (const c of ['pearl', 'platinum', 'ruby', 'sapphire']) await expect(tid(page, `vault-card-${c}`)).toBeVisible();

  // Failure: a wrong shape never makes a call; the shape tick says so as you type.
  await tid(page, 'vault-key').fill('not-a-key');
  await expect(tid(page, 'vault-shape')).toContainText('✗');
  await tid(page, 'vault-seal').click();
  await expect(tid(page, 'vault-msg')).toHaveText(/starts with sk-ant-/);

  // Keys pressed in the vault never reach the Settings screen behind it.
  const before = await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Settings').menu?.index ?? -1);
  await tid(page, 'vault-key').fill('');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Settings').menu?.index ?? -1)).toBe(before);

  // ← → pick a card (Pearl), then paste, Test & seal.
  await page.keyboard.press('ArrowRight');
  await expect(tid(page, 'vault-selected')).toHaveAttribute('data-card', 'pearl');
  await tid(page, 'vault-key').fill(KEY);
  await expect(tid(page, 'vault-shape')).toContainText('✓');
  await tid(page, 'vault-seal').click();
  await expect(tid(page, 'vault-msg')).toHaveText(/Pearl is sealed and ready/);
  await expect(tid(page, 'vault-test')).toContainText('✓');
  await expect(tid(page, 'vault-selected-spend')).toHaveText('Rotom used $0.00 of $10');
  await expect(tid(page, 'vault-selected')).toContainText('ACTIVE');
  await expect(tid(page, 'vault-key')).toHaveValue('');
  await page.screenshot({ path: 'test-results/dominion-key-vault.png' });
  expect(await vault(page).innerText()).not.toMatch(/Claude|\bAI\b/i);
  expect(await keyIn(page)).toEqual({ session: ['pkr.ai.card'], local: [] });

  // A used-up card is stamped (its key's spend reached $10) and shows its count.
  await page.evaluate(() => {
    const cards = JSON.parse(localStorage.getItem('pkr.ai.cards') ?? '{}');
    localStorage.setItem('pkr.ai.cards', JSON.stringify({ ...cards, diamond: 'feedfacefeedfacefeedface' }));
    localStorage.setItem('pkr.ai.spend.feedfacefeedfacefeedface', '10');
  });
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  await expect(tid(page, 'vault-card-diamond')).toContainText('$10.00 of $10');
  await expect(vault(page).locator('.inked')).toHaveText('USED UP');

  // Esc closes the vault and leaves Settings as it was.
  await page.keyboard.press('Escape');
  await expect(vault(page)).toHaveCount(0);
  expect(await scene(page)).toBe('Settings');

  // Remember on this device moves the key to localStorage (one copy only).
  await nines(page, 8);
  await expect(vault(page)).toBeVisible();
  await tid(page, 'vault-remember').check();
  await tid(page, 'vault-key').fill(KEY);
  await page.keyboard.press('Enter');
  await expect(tid(page, 'vault-msg')).toHaveText(/sealed and ready/);
  expect(await keyIn(page)).toEqual({ session: [], local: ['pkr.ai.card'] });

  // Failure: a refused key gets a plain message.
  await tid(page, 'vault-key').fill('sk-ant-api03-fake-refused-' + 'x'.repeat(30));
  await tid(page, 'vault-seal').click();
  await expect(tid(page, 'vault-msg')).toHaveText(/refused this key/);
  await page.keyboard.press('Escape');
  await expect(vault(page)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Settings > Rotom in the New look: tiers, the card in use and its spend, Forget', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const errors: string[] = [];
  await openSettings(page, errors, '&ui=new', { page: 'claude' });
  const view = page.locator('#rx .stage[data-scene="Settings"]');
  await expect(tid(page, 'claude-tier-standard')).toHaveClass(/on/);
  await expect(tid(page, 'claude-card-state')).toHaveText('NO CARD');
  await expect(view).toContainText('Use Rotom for');
  await expect(tid(page, 'claude-use-0')).toContainText('Rivals only');
  await expect(tid(page, 'claude-use-5')).toContainText('OFF');

  // A tier tile picks the tier; ← → step it.
  await tid(page, 'claude-tier-rich').click();
  await expect(tid(page, 'claude-tier-rich')).toHaveClass(/on/);
  expect(await page.evaluate(() => (window as any).__pkr.session.settings.expansion.claudeAi)).toBe('rich');
  await page.keyboard.press('ArrowLeft');
  await expect(tid(page, 'claude-tier-standard')).toHaveClass(/on/);

  // A use switch flips on a click.
  await tid(page, 'claude-use-5').click();
  await expect(tid(page, 'claude-use-5')).toContainText('ON');
  expect(await page.evaluate(() => (window as any).__pkr.session.settings.expansion.claudeUses.news)).toBe(true);

  // The 9 counter fills as you press.
  await nines(page, 3);
  await expect(tid(page, 'claude-nines')).toHaveAttribute('aria-label', '3 of 8 presses');

  // Add a card opens the vault; sealing a key shows it as the card in use.
  await tid(page, 'claude-change').click();
  await expect(vault(page)).toBeVisible();
  await tid(page, 'vault-card-ruby').click();
  await tid(page, 'vault-key').fill(KEY);
  await tid(page, 'vault-seal').click();
  await expect(tid(page, 'vault-msg')).toHaveText(/Ruby is sealed/);
  await page.screenshot({ path: 'test-results/dominion-key-vault-new.png' });
  await page.keyboard.press('Escape');
  await expect(vault(page)).toHaveCount(0);
  await expect(tid(page, 'claude-card-state')).toHaveText('ACTIVE');
  await expect(tid(page, 'claude-spent')).toHaveText('$0.00');
  await expect(tid(page, 'claude-card')).toContainText('RUBY');
  await expect(tid(page, 'claude-card')).toContainText(/more Standard runs/);
  await page.screenshot({ path: 'test-results/dominion-claude-settings.png' });
  expect(await view.innerText()).not.toMatch(/Claude|\bAI\b/i);
  await expect(view).toContainText('Use Rotom for');

  // Forget key: the card empties and the key is gone from both storages.
  await tid(page, 'claude-forget').click();
  await expect(tid(page, 'claude-card-state')).toHaveText('NO CARD');
  expect(await keyIn(page)).toEqual({ session: [], local: [] });
  expect(errors).toEqual([]);
});

test('the vault and the Rotom page fit a phone', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const errors: string[] = [];
  await openSettings(page, errors, '&ui=new', { page: 'claude' });
  await expect(tid(page, 'claude-tiers')).toBeVisible();
  await nines(page, 8);
  await expect(vault(page)).toBeVisible();
  const box = await tid(page, 'vault-seal').boundingBox();
  expect(box && box.x >= 0 && box.x + box.width <= 844 && box.y + box.height <= 390).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/dominion-key-vault-phone.png' });
  expect(errors).toEqual([]);
});

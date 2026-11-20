import { expect, test, type Page } from '@playwright/test';
import { open, start, view, waitForScene, watch } from './helpers/newUi';

// DOMINION slice D25 (chatter, news, Hero and betrayal lines; mockup a10): V on the HQ opens the Evening voices scene:
// the crew talking, the Ledger paper, the Hero's call and a traitor's parting line, all written offline. With a
// Key-Card in the vault (the no-network fake here) Rotom adds ✦ lines, stored with the run so a reload shows them again.

async function eveningOne(page: Page) {
  await page.evaluate(() => {
    const s = (window as any).__pkr.session;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, evilMode: true } });
  });
  await open(page, 'RunPrep', { archetypeId: 'red', modeId: 'dominion' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'StarterSelect');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Dominion');
  await page.evaluate(() => {
    const p = (window as any).__pkr;
    p.session.dominionStart({ types: ['poison', 'dark'], member: 'grunt', look: 0 });
    p.session.dominionStep({ t: 'open' });
    // Two more members, the Hero on FOILS, a member who walked out last night, and last week's paper.
    const b = p.session.run.expansion.dominion;
    const m = b.members[0];
    for (const [id, name] of [['m-gus', 'GUS'], ['m-rosa', 'ROSA']]) b.members.push({ ...structuredClone(m), id, name, crew: { ...structuredClone(m.crew), card: undefined } });
    b.day = 8;
    b.hero.threat = 30;
    b.crew.gone.push({ id: 'm-mick', name: 'MICK', day: 8, why: 'quit' });
    b.voices = { week: [], papers: [{ w: 1, day: 7, items: [{ k: 'police', head: 'POLICE TIGHTEN THE NET', body: ['Officers swept Celadon.'] }], photo: { text: 'Blue seen in Pallet Town', look: 'bosses/blue.png' } }] };
    p.game.scene.getScenes(true).forEach((x: any) => p.game.scene.stop(x.scene.key));
    p.game.scene.start('Dominion');
  });
  await waitForScene(page, 'Dominion');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await expect(view(page, 'Dominion').getByTestId('dom-phase')).toHaveText('EVENING');
  await page.waitForTimeout(250);
}

test('the Evening voices: crew chatter, the Ledger, the Hero calls, a traitor leaves; V and Esc close', async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: info.outputPath(`${n}.png`) });
  const errors = watch(page);
  await start(page, 'ui=new');
  await eveningOne(page);
  const s = view(page, 'Dominion');
  await expect(s.getByTestId('dom-voices-open')).toContainText('NEW LEDGER');
  await shot('hq-crew-talk-chip');
  await page.keyboard.press('KeyV');
  await expect(s.getByTestId('dom-voices')).toContainText('Evening');
  await expect(s.getByTestId('dom-voices')).toContainText('Day 8');
  for (const i of [0, 1, 2]) await expect(s.getByTestId(`dom-chat-${i}`)).toBeVisible();
  await expect(s.getByTestId('dom-paper-name')).toHaveText('The Kanto Ledger');
  await expect(s.getByTestId('dom-paper-head-0')).toHaveText('POLICE TIGHTEN THE NET');
  await expect(s.getByTestId('dom-paper-photo')).toContainText('Blue seen in Pallet Town');
  await expect(s.getByTestId('dom-hero-call')).toContainText('Incoming · Blue');
  await expect(s.getByTestId('dom-traitor')).toContainText('Mick on the way out');
  await expect(s.getByTestId('dom-voices-chip')).toContainText('Rotom stays quiet');
  await expect(s.getByText('✦', { exact: false })).toHaveCount(0);
  for (const [w, h] of [[1280, 720], [960, 540], [800, 600]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(200);
    await shot(`a10-voices-${w}x${h}`);
  }
  // Nothing in the game changed by looking.
  const before = await page.evaluate(() => JSON.stringify((window as any).__pkr.session.run.expansion.dominion));
  await page.keyboard.press('KeyN'); // eaten while the scene is open
  await page.keyboard.press('KeyV');
  await expect(s.getByTestId('dom-voices')).toBeHidden();
  await expect(s.getByTestId('dom-phase')).toHaveText('EVENING');
  expect(await page.evaluate(() => JSON.stringify((window as any).__pkr.session.run.expansion.dominion))).toBe(before);
  await s.getByTestId('dom-voices-open').click();
  await expect(s.getByTestId('dom-voices')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(s.getByTestId('dom-voices')).toBeHidden();
  expect(errors).toEqual([]);
});

test('with a Key-Card, Rotom adds ✦ lines that are saved with the run', async ({ page }, info) => {
  const errors = watch(page);
  await start(page, 'ui=new&aifake=1');
  // Ledger news is off by default (Settings > Rotom); switch it on here.
  await page.evaluate(() => {
    const st = (window as any).__pkr.session;
    st.saveSettings({ ...st.settings, expansion: { ...st.settings.expansion, claudeUses: { ...st.settings.expansion.claudeUses, news: true } } });
  });
  await page.evaluate(() => sessionStorage.setItem('pkr.ai.card', JSON.stringify({ card: 'diamond', key: 'sk-ant-api03-' + 'e2eFakeKey'.repeat(5) })));
  await eveningOne(page);
  const s = view(page, 'Dominion');
  await page.keyboard.press('KeyV');
  await expect(s.getByTestId('dom-chat-rotom-0')).toContainText('✦');
  await expect(s.getByTestId('dom-hero-call-rotom')).toContainText('✦');
  await expect(s.getByTestId('dom-traitor-rotom')).toContainText('✦');
  await expect(s.getByTestId('dom-paper-rotom')).toContainText('✦');
  await expect(s.getByTestId('dom-voices-chip')).toContainText('saved with the run');
  await page.screenshot({ path: info.outputPath('a10-voices-rotom.png') });
  const ids = await page.evaluate(() => Object.keys((window as any).__pkr.session.run.ai ?? {}).sort());
  expect(ids.filter((i: string) => i.startsWith('chatter:d8:'))).toHaveLength(3);
  expect(ids).toContain('hero:d8');
  expect(ids).toContain('traitor:m-mick');
  expect(ids).toContain('news:w1');
  // The written lines stay beside Rotom's.
  await expect(s.getByTestId('dom-hero-call-text')).not.toContainText('✦');
  expect(errors).toEqual([]);
});

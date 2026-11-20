import { expect, test, type Page } from '@playwright/test';
import { start, waitForScene, watch } from './helpers/newUi';
import { fitProblems, onPage, pview, toPhantomMap } from './helpers/phantomUi';

// The Phantom UI's Rotom Phone (a menu the game did not have): this run read back as chats. A reply is a line of
// talk that changes nothing, or a door to a page the game already has. It opens from the quick wheel.

const version = (page: Page, id: string) => page.evaluate((id) => { const pkr = (window as any).__pkr; pkr.session.saveSettings({ ...pkr.session.settings, phantomVersion: id }); pkr.game.scene.getScene('Map').rxView?.refresh(); }, id);
const runNow = (page: Page) => page.evaluate(() => JSON.stringify((window as any).__pkr.session.run));
const mapBusy = (page: Page) => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy as boolean);
const tap = (page: Page) => page.evaluate(() => {
  for (const type of ['keydown', 'keyup']) window.dispatchEvent(new KeyboardEvent(type, { key: 'Tab', code: 'Tab', keyCode: 9, which: 9, bubbles: true, cancelable: true } as KeyboardEventInit));
});
const step = async (page: Page, key: string) => { await page.keyboard.press(key); await page.waitForTimeout(250); };

test('Phantom UI: the Rotom Phone opens from the quick wheel, reads the run back as chats, and a reply is talk or a door', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=ph-phone');
  await onPage(page, 'MainMenu', 'title');
  await toPhantomMap(page);
  await onPage(page, 'Map', 'map');
  const map = page.locator('#phx .phs[data-scene="Map"][data-scr="map"]');
  const phone = pview(page, 'Map', 'phone');
  const chats = phone.locator('.ph-ph-list .pn');
  const lit = phone.locator('.ph-ph-list .pn.on > b');
  const replies = phone.locator('.ph-ph-reply .ch');

  // Two people have spoken in this run; a rival (when the run has one) has too.
  const rival = await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    pkr.log.tell('say', 'Take good care of your Pokémon out there.', 'Prof. Oak');
    pkr.log.tell('say', 'Come back when your team needs rest.', 'Nurse Joy');
    pkr.log.tell('say', 'And write to me from the next town!', 'Prof. Oak');
    const name = pkr.session.run.story.rivals[0]?.name as string | undefined;
    if (name) pkr.log.tell('say', 'Do not think you are ahead of me.', name);
    return name ?? null;
  });
  const before = await runNow(page);

  // The wheel's Phone slot counts what is new and opens the phone on the first chat with something new.
  await tap(page);
  const slot = map.locator('.ph-wh .wi', { hasText: /phone/i });
  await expect(slot).toBeVisible();
  await page.waitForTimeout(300);
  await slot.hover();
  await expect(map.locator('.ph-wh .wh-c .txt')).toContainText(`${rival ? 4 : 3} new lines`);
  await slot.click();
  await onPage(page, 'Map', 'phone');
  await page.waitForTimeout(250);
  await expect(chats).toHaveCount(rival ? 4 : 3);
  await expect(chats.last().locator('> b')).toHaveText('Rotom');
  await expect(lit).toHaveText(rival ?? 'Prof. Oak');
  await expect(phone.locator('.hd small')).toContainText('Rotom Phone', { ignoreCase: true });
  // The open chat is read; the others still show what is new.
  await expect(phone.locator('.ph-ph-list .pn.on em')).toHaveCount(0);
  await expect(phone.locator('.ph-ph-list .pn:not(.on) em')).toHaveCount(rival ? 2 : 1);
  await page.waitForTimeout(900);
  expect(await fitProblems(page, 'Map', 'phone')).toEqual([]);

  // Q and E turn the chat (the arrows too); Prof. Oak's chat shows both lines.
  const oak = rival ? 2 : 0;
  await chats.nth(oak).click();
  await expect(lit).toHaveText('Prof. Oak');
  await expect(phone.locator('.ph-ph-chat > .im:not(.me):not(.sys)')).toHaveCount(2);
  await expect(phone.locator('.ph-ph-chat')).toContainText('write to me from the next town');
  await step(page, 'e');
  await expect(lit).toHaveText(oak === 2 ? 'Rotom' : 'Nurse Joy');
  await step(page, 'q');
  await expect(lit).toHaveText('Prof. Oak');
  await step(page, 'ArrowLeft');
  await step(page, 'ArrowRight');
  await expect(lit).toHaveText('Prof. Oak');

  // A line of talk is kept beside the chat, once: the same line twice in a row is not said again.
  await expect(replies).toHaveCount(2);
  await expect(replies.nth(0)).toHaveClass(/\bon\b/);
  await expect(phone.locator('.keys')).toContainText('Send', { ignoreCase: true });
  await step(page, 'Enter');
  await expect(phone.locator('.ph-ph-chat > .im.me')).toHaveCount(1);
  await expect(phone.locator('.ph-ph-chat > .im.me')).toContainText('Got it. Thanks.');
  await step(page, 'Enter');
  await expect(phone.locator('.ph-ph-chat > .im.me')).toHaveCount(1);
  await step(page, 'ArrowDown');
  await expect(replies.nth(1)).toHaveClass(/\bon\b/);
  await expect(phone.locator('.keys')).toContainText('Open', { ignoreCase: true });
  await step(page, 'ArrowDown');
  await expect(replies.nth(0)).toHaveClass(/\bon\b/);

  // Rotom's chat: where the run is, how the team is, and the doors. It fits in every version and at several sizes.
  await chats.last().click();
  await expect(lit).toHaveText('Rotom');
  await expect(phone.locator('.ph-ph-chat > .im.sys')).toHaveCount(3);
  await expect(phone.locator('.ph-ph-chat')).toContainText('Level cap');
  await expect(phone.locator('.ph-ph-chat')).toContainText('Your team is in good shape.');
  await expect(replies).toHaveCount(3);
  for (const [id, w, h] of [['midnight', 844, 390], ['channel', 1920, 1080], ['fantasia', 1024, 768], ['velvet', 1280, 720]] as const) {
    await version(page, id);
    await page.setViewportSize({ width: w, height: h });
    await expect(page.locator(`#phx .phs[data-scene="Map"][data-liv="${id}"][data-scr="phone"]`)).toBeVisible();
    await page.waitForTimeout(900);
    expect(await fitProblems(page, 'Map', 'phone'), `${id} at ${w}x${h}`).toEqual([]);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await version(page, 'phantom');
  await page.waitForTimeout(250);

  // A door: "Open the Pokédex." shuts the phone and opens the pause menu's Pokédex; backing out lands on the map.
  await replies.nth(1).hover();
  await expect(replies.nth(1)).toHaveClass(/\bon\b/);
  await replies.nth(1).click();
  await onPage(page, 'Map', 'dex');
  await page.waitForTimeout(250);
  await step(page, 'Escape');
  await onPage(page, 'Map', 'pause');
  await step(page, 'Escape');
  await onPage(page, 'Map', 'map');
  expect(await mapBusy(page)).toBe(false);

  // What was sent is still there in this run; a rival's reply opens their file in the Rival Report.
  await tap(page);
  await page.waitForTimeout(300);
  await map.locator('.ph-wh .wi', { hasText: /phone/i }).click();
  await onPage(page, 'Map', 'phone');
  await page.waitForTimeout(250);
  await chats.nth(oak).click();
  await expect(phone.locator('.ph-ph-chat > .im.me')).toHaveCount(1);
  if (rival) {
    await chats.nth(0).click();
    await expect(lit).toHaveText(rival);
    await expect(phone.locator('.ph-ph-chat')).toContainText('Do not think you are ahead of me.');
    await expect(phone.locator('.ph-ph-chat > .im.sys')).toContainText('meeting');
    await replies.nth(1).click();
    await onPage(page, 'Map', 'rivals');
    await page.waitForTimeout(250);
    await step(page, 'Escape');
  } else await step(page, 'Escape');
  await onPage(page, 'Map', 'map');
  expect(await mapBusy(page)).toBe(false);

  // Nothing in the run changed, and nothing was saved for the phone.
  expect(await runNow(page)).toBe(before);
  expect(errors).toEqual([]);
});

test('Phantom UI: a rival has a chat on the Rotom Phone: what they said, their standing, and a door to their file', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watch(page);
  await start(page, 'ui=phantom&seed=ph-phone-rival');
  await onPage(page, 'MainMenu', 'title');
  await toPhantomMap(page);
  await onPage(page, 'Map', 'map');
  // Two rivals of this run: Joey is behind you by one, Mira is ahead of you by one.
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    const traits = { ambition: 50, pride: 50, empathy: 50, adaptability: 50, vindictiveness: 50, resilience: 50 };
    const rival = (id: string, classId: string, name: string) => ({
      id, classId, name, archetype: 'proud', style: 'rush', traits, rivalPotential: 20, state: 'recurring', arc: null, away: 0, cooldown: 0, progress: 0,
      encounters: 2, setbacks: 0, adaptations: [], seen: [], bonds: {}, offscreen: [], origin: { eventId: `e-${id}`, where: { region: 0, stage: 0, level: 1, node: null, battle: 0, turn: null }, path: 'spark' },
      memory: { lastBattle: { eventId: 'x', result: 'win', hpLeftShare: 0.5, turns: 5, team: ['rattata'] } },
    });
    const feelings = (friendship: number) => ({ friendship, respect: 5, trust: 3, rivalry: 8 - friendship, resentment: 1, admiration: 2 });
    run.story.rivals = [rival('u', 'youngster', 'Joey'), rival('v', 'lass', 'Mira')];
    run.expansion = {
      ...(run.expansion ?? {}),
      rival: {
        u: { role: 'main', personality: 'champion-chaser', style: 'rush', arc: 'x', lead: 1, marks: [], feelings: feelings(2), pityLosses: 0, presence: { '0': { meetings: 2, stepIn: true } } },
        v: { role: 'friend', personality: 'kind', style: 'rush', arc: 'x', lead: -1, marks: [], feelings: feelings(7), pityLosses: 0 },
      },
    };
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Map');
  await expect.poll(() => mapBusy(page), { timeout: 15_000 }).toBe(false);
  await onPage(page, 'Map', 'map');
  await page.waitForTimeout(250);
  await page.evaluate(() => void (window as any).__pkr.log.tell('say', 'I will be the one who wins next time.', 'Lass Mira'));
  const before = await runNow(page);

  const map = page.locator('#phx .phs[data-scene="Map"][data-scr="map"]');
  const phone = pview(page, 'Map', 'phone');
  const chats = phone.locator('.ph-ph-list .pn');
  const lit = phone.locator('.ph-ph-list .pn.on > b');
  const replies = phone.locator('.ph-ph-reply .ch');
  await tap(page);
  await page.waitForTimeout(300);
  await map.locator('.ph-wh .wi', { hasText: /phone/i }).click();
  await onPage(page, 'Map', 'phone');
  await page.waitForTimeout(250);
  // The rivals come first; the phone opens on the one with something new (a title before the name is still her).
  await expect(chats).toHaveCount(3);
  await expect(chats.locator('> b')).toHaveText(['Joey', 'Mira', 'Rotom']);
  await expect(lit).toHaveText('Mira');
  await expect(phone.locator('.ph-ph-chat > .im:not(.me):not(.sys)')).toHaveCount(1);
  await expect(phone.locator('.ph-ph-chat')).toContainText('I will be the one who wins next time.');
  await expect(phone.locator('.ph-ph-chat > .im.sys')).toContainText('Bzzt! Mira:');
  // The line you can send follows who is ahead.
  await expect(replies.nth(0).locator('b')).toHaveText('Try to keep up.');
  await step(page, 'q');
  await expect(lit).toHaveText('Joey');
  await expect(replies.nth(0).locator('b')).toHaveText('I am catching up.');
  await expect(phone.locator('.ph-ph-chat > .im:not(.me):not(.sys)')).toHaveCount(0);
  await page.waitForTimeout(900);
  expect(await fitProblems(page, 'Map', 'phone')).toEqual([]);
  await step(page, 'e');
  await expect(lit).toHaveText('Mira');
  await step(page, 'Enter');
  await expect(phone.locator('.ph-ph-chat > .im.me')).toContainText('Try to keep up.');
  // "Rotom, show me their file." opens the Rival Report on that rival; closing it lands on the map.
  await step(page, 'ArrowDown');
  await step(page, 'Enter');
  await onPage(page, 'Map', 'rivals');
  await expect(pview(page, 'Map', 'rivals')).toContainText('Mira');
  expect(await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').rxPop)).toEqual({ kind: 'report', pick: 1 });
  await page.waitForTimeout(250);
  await step(page, 'Escape');
  await onPage(page, 'Map', 'map');
  expect(await mapBusy(page)).toBe(false);
  expect(await runNow(page)).toBe(before);
  expect(errors).toEqual([]);
});

import { expect, test } from '@playwright/test';
import { scene, view, waitForScene, watch, start, toMap, toCommands } from './helpers/newUi';

// The New UI (Settings > UI style: New, the default for players): run formats, Memories, the pause menu, the debug window and the Beta 0.6 battle pieces.
// The New UI specs are split over several files (newUi, battleNewUi, menusNewUi, runNewUi, storyNewUi, worldNewUi) whose
// names are spread over the alphabet, so the browser-test shards each get one of them; the shared steps are in
// helpers/newUi.ts. The older specs run with the Old UI, so both styles stay covered.

test('New UI: the Blackout shows a card per anchor and the Seal; keys move over the standing ones and a click starts the sealed fight', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=e4-blackout');
  await toMap(page);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    const anchors = [
      { id: 'a1', place: 'the Nugget Bridge crossing', name: 'Anchor: Proton', species: ['mr-mime'], size: 2, beaten: true },
      { id: 'a2', place: 'the Celadon Lane cordon', name: 'Anchor: Petrel', species: ['mr-mime'], size: 2, beaten: false },
      { id: 'a3', place: 'the crossroads below Silph', name: 'Anchor: Ariana', species: ['mr-mime'], size: 2, beaten: false },
    ];
    run.expansion = { ...(run.expansion ?? {}), cut: { format: { id: 'blackout', state: { anchors, triad: false, pending: null, losses: 0 } } } };
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Format');
  const streets = view(page, 'Format');
  for (const bit of ['Anchor: Proton', 'Fallen', 'Anchor: Petrel', 'Standing · the Celadon Lane cordon', 'Anchor: Ariana', 'The violet Seal', 'Anchors fallen 1 / 2']) await expect(streets).toContainText(bit);
  // The count is said once, on the Seal's own line.
  await expect(streets).not.toContainText('Anchors beaten');
  // Only the two standing anchors can be picked; the cursor starts on the first of them.
  await expect(streets.locator('[data-act="pick"]')).toHaveCount(2);
  await expect(streets.locator('.sel')).toContainText('Anchor: Petrel');
  await page.keyboard.press('ArrowRight');
  await expect(streets.locator('.sel')).toContainText('Anchor: Ariana');
  await page.keyboard.press('ArrowRight');
  await expect(streets.locator('.sel')).toContainText('Anchor: Petrel');
  await page.screenshot({ path: 'test-results/newui-blackout.png' });
  await streets.locator('[data-act="pick"]', { hasText: 'Anchor: Ariana' }).click();
  await waitForScene(page, 'Battle');
  const got = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    return { pending: run.expansion.cut.format.state.pending, rule: run.battle.eventRule };
  });
  expect(got.pending).toBe('a3');
  expect(got.rule).toEqual({ noSwitchFirstTurn: true, typeBoost: { type: 'psychic', pct: 10 } });
  expect(errors).toEqual([]);
});

test('New UI: the Colossus page shows the Apex and the Blueprint of its three shields, and the button starts the raid', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=e4-colossus');
  await toMap(page);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    run.expansion = { ...(run.expansion ?? {}), cut: { format: { id: 'colossus', state: { apex: { id: 'ss.rocket.m2', name: 'M2', code: 'XD002' }, pending: false, result: null } } } };
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Format');
  const roof = view(page, 'Format');
  for (const bit of ['XD002 · The Roof', 'M2', 'Blueprint', 'Shield at 75%', 'Shield at 50%', 'Shield at 25%', 'Ten turns before the helicopter lifts it away.', 'Face M2']) await expect(roof).toContainText(bit);
  await expect(roof.locator('.an')).toHaveCount(1); // the Apex
  await page.screenshot({ path: 'test-results/newui-colossus.png' });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  const raid = await page.evaluate(() => (window as any).__pkr.session.run.battle.raid);
  expect(raid.pendingShields).toHaveLength(3);
  expect(raid.timerLeft).toBe(10);
  expect(errors).toEqual([]);
});

test('New UI: the Town Roll page opens from the map with O: the town, its starred and rolled spaces, and the ones left out', async ({ page }) => {
  const errors = watch(page);
  // A seed whose first region is Kanto, so Stage 1 is Pewter City with Kanto Canon's spaces.
  await start(page, 'ui=new&seed=roll3');
  await toMap(page);
  const before = await page.evaluate(() => JSON.stringify((window as any).__pkr.session.run.expansion.canon));
  const map = view(page, 'Map');
  await expect(map.locator('[data-act="key"][data-arg="O"]')).toHaveCount(1);
  await page.keyboard.press('o');
  for (const bit of ['Town Roll', 'Veridian Forest', 'Mt. Moon', 'Always here', 'Rolled', 'Not this run:', 'Pewter City · 2 of', 'optional spaces placed on the map', 'To the map', 'Each Kanto town rolls which optional spaces appear this run.']) await expect(map).toContainText(bit);
  await expect(map.locator('.sel')).toContainText('Veridian Forest');
  await page.screenshot({ path: 'test-results/newui-town-roll.png' });
  // The arrows walk the cards; a rolled space tells what it is in the text box.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  const rolled = await map.locator('.sel b').innerText();
  await expect(map.locator('.sel')).toContainText('Rolled');
  await expect(map).toContainText(`${rolled}: `);
  // A click on a space the roll left out says so.
  const left = map.locator('span[data-act="popPick"]').first();
  const name = await left.innerText();
  await left.click();
  await expect(map).toContainText(`${name} is not here this run.`);
  // The button goes back to the map; O opens the page again and Esc closes it.
  await map.locator('[data-act="pop"]').click();
  await expect(map).not.toContainText('optional spaces placed on the map');
  await page.keyboard.press('o');
  await expect(map).toContainText('optional spaces placed on the map');
  await page.keyboard.press('Escape');
  await expect(map).not.toContainText('optional spaces placed on the map');
  // Looking rolled nothing.
  expect(await page.evaluate(() => JSON.stringify((window as any).__pkr.session.run.expansion.canon))).toBe(before);
  expect(await scene(page)).toBe('Map');
  expect(errors).toEqual([]);
});

test('New UI: the League door is the mock-up counter-pick page: pick a boxed Pokémon, swap the answered one out, and the result stays until Enter', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=door1');
  await toMap(page);
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    const base = run.party[0];
    const mk = (speciesId: string, level: number, i: number) => ({ ...structuredClone(base), uid: `t${i}-${speciesId}`, speciesId, level });
    run.party = [mk('charizard', 52, 0), mk('lucario', 51, 1), mk('gengar', 50, 2), mk('gyarados', 50, 3), mk('garchomp', 49, 4), mk('pikachu', 48, 5)];
    run.box = [mk('snorlax', 50, 6), mk('dragonite', 49, 7), mk('tyranitar', 48, 8)];
    run.expansion = { ...(run.expansion ?? {}), league: { registered: run.party.map((m: any) => m.uid), swapped: false } };
    const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
    run.phase = 'decision';
    run.pending = [{
      kind: 'leagueDoor', title: 'The League has read your team (6 registered). Swap one before the first battle?', outUid: run.party[0].uid, swapIns: run.box.map((m: any) => m.uid),
      options: [{ label: 'Keep my team', description: 'Go in with the Pokémon you registered.' }, ...run.box.map((m: any) => ({ label: `Swap in ${cap(m.speciesId)} (Lv ${m.level})`, description: `Replaces Charizard, the Pokémon the Elite Four will answer most. The League has not seen ${cap(m.speciesId)}.` }))],
    }];
    pkr.game.scene.getScene('Map').scene.start('Decision');
  });
  await waitForScene(page, 'Decision');
  const door = view(page, 'Decision');
  for (const bit of ['League counter-pick', 'Charizard', 'The League will answer this', 'Lucario', 'Registered', 'Swap it for a boxed Pokémon?', 'Snorlax', 'Dragonite', 'Tyranitar', 'Swap Charizard out', 'Keep my team', 'Registrar', 'The League has studied Charizard most.']) await expect(door).toContainText(bit);
  await expect(door.locator('.an')).toHaveCount(9); // six in the party, three in the box
  // The swap button is lit and the first boxed Pokémon is marked, as on the mock-up.
  await expect(door.locator('.btn.on')).toContainText('Swap Charizard out');
  await expect(door.locator('[data-act="pick"]', { hasText: 'Pick' })).toContainText('Snorlax');
  await page.screenshot({ path: 'test-results/newui-counter-pick.png' });
  // Up twice is Dragonite's row: the box tells what the swap does, and the mark stays until Enter.
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(door).toContainText('The League has not seen Dragonite.');
  await expect(door.locator('[data-act="pick"]', { hasText: 'Pick' })).toContainText('Snorlax');
  await page.keyboard.press('Enter');
  await expect(door.locator('[data-act="pick"]', { hasText: 'Pick' })).toContainText('Dragonite');
  await expect(door.locator('.btn.on')).toContainText('Swap Charizard out');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.pending.length)).toBe(1);
  // Enter on the swap button swaps; the result stays on the page until the next input.
  await page.keyboard.press('Enter');
  await expect(door.locator('[data-act="done"]')).toHaveCount(1);
  await expect(door).not.toContainText('Swap Charizard out');
  const after = await page.evaluate(() => {
    const run = (window as any).__pkr.session.run;
    return { lead: run.party[0].speciesId, box: run.box.map((m: any) => m.speciesId), pending: run.pending.length, swapped: run.expansion.league.swapped };
  });
  expect(after.lead).toBe('dragonite');
  expect(after.box).toContain('charizard');
  expect(after.pending).toBe(0);
  await page.waitForTimeout(600);
  expect(await scene(page)).toBe('Decision');
  await page.keyboard.press('Enter');
  await expect.poll(() => scene(page), { timeout: 20_000 }).not.toBe('Decision');
  expect(errors).toEqual([]);
});

test('New UI: Memories pages carry the mock-up names and tags, and an entry opens as a page that can be read and closed', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&debug=1');
  const mon = (uid: string, speciesId: string, level: number, starter = false) => ({ uid, speciesId, level, shiny: false, moves: ['tackle'], abilitySlot: 0, nature: null, held: [], starter, knockouts: 4, bossesBeaten: 1, titles: [] });
  const record = (runId: string, over: Record<string, unknown> = {}) => ({
    replays: [{ id: `${runId}:r0:s0:e5`, kind: 'gym', title: 'Gym battle against Brock', outcome: 'lose', region: 0, stage: 0, foe: { name: 'Brock', team: ['onix'] }, team: ['pikachu'], turns: 3, lines: ['T1: Pikachu used Tackle (-4); Onix used Tackle', 'T2: Pikachu fainted'] }],
    world: null, format: 1, source: 'run', runId, endedAt: '2026-10-30T12:00:00Z', seed: runId, archetypeId: 'red', campaignId: 'full', prep: null, rules: null,
    starter: { speciesId: 'pikachu', choices: ['pikachu'] }, regionOrder: ['kanto', 'johto'], regionsCleared: ['kanto'], regionReached: 1, outcome: 'defeat',
    encounters: 44, battlesWon: 30, badges: ['brock'], bosses: { gym: 8, elite: 0, champion: 0 }, team: [mon(`${runId}-a`, 'pikachu', 41, true), mon(`${runId}-b`, 'onix', 38)],
    aceUid: `${runId}-a`, rivals: [{ id: 'rv', name: 'Blue', classId: 'youngster', archetype: 'a', state: 'contender', encounters: 4, setbacks: 1, lastResult: 'lose', resolution: null, team: ['pidgeot'], rank: 'champion', world: null, narrativeWins: 0 }],
    nemeses: [], legendaries: { seen: [], caught: [] }, defeatedBy: { speciesId: 'pidgeot', level: 45, trainer: 'Blue' }, finalBattle: { result: 'lose', speciesId: 'pidgeot', level: 45, trainer: 'Blue' },
    stats: { maxLevel: 41, survivedFatal: 0, closeCalls: 0, caught: 5, shinies: 0, rivalWins: 0 }, narrative: [], chronicle: [],
    moments: [{ kind: 'firstGym', text: 'First Gym victory: beat Brock.', speciesId: null, region: 0 }, { kind: 'runEnding', text: "The journey ended against Blue's Pidgeot (Lv 45).", speciesId: 'pidgeot', region: 1 }],
    journal: [], epitaph: 'Pikachu carried this journey.', ...over,
  });
  const heirloom = { runId: 'past-1', speciesId: 'pikachu', name: 'Pikachu', level: 41, shiny: false, trainer: 'Red', chosen: null, spent: false, options: [{ id: 'egg', label: 'A Pikachu Egg', text: 'A Legacy Egg.' }, { id: 'item', label: 'Everstone', text: 'A keepsake.', itemId: 'everstone' }] };
  await page.evaluate(({ legacyRuns, heirloom }) => {
    const pkr = (window as any).__pkr;
    pkr.session.changeProfile((p: any) => ({ ...p, legacyRuns, memories: { heirlooms: [heirloom], claimed: [], cameos: [] } }));
    pkr.game.scene.getScenes(true)[0].scene.start('Memories');
  }, { legacyRuns: [record('past-1'), record('past-2', { outcome: 'victory', defeatedBy: null })], heirloom });
  await waitForScene(page, 'Memories');
  const mem = page.locator('#rx .stage[data-scene="Memories"]').first();
  const top = page.locator('#rx .stage[data-scene="Memories"]').last();
  await expect(mem).toContainText('Run Chronicles');
  // Run Journal: the mock-up's name in the band, and a Win or Loss tag on each run.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(mem).toContainText('Memories: Run Journal');
  await expect(mem.locator('.hd')).toHaveAttribute('style', /#9a5ad8/); // the story band
  await expect(mem).toContainText('Loss');
  await expect(mem).toContainText('Win');
  // An entry opens as a page over the list (it could not be read in New before), and Enter closes it.
  await page.keyboard.press('Enter');
  await expect(page.locator('#rx .stage[data-scene="Memories"]')).toHaveCount(2);
  for (const bit of ['Team: Pikachu Lv 41, Onix Lv 38', 'Rival Blue', 'Pikachu carried this journey.', 'Enter or Esc to close']) await expect(top).toContainText(bit);
  await page.screenshot({ path: 'test-results/newui-memories-reader.png' });
  await page.keyboard.press('Enter');
  await expect(page.locator('#rx .stage[data-scene="Memories"]')).toHaveCount(1);
  expect(await scene(page)).toBe('Memories');
  await page.keyboard.press('Escape');
  await expect(mem.locator('.hd')).toHaveText('Memories');
  // Fallen Trainers and Battle Replays: their names and tags; a click on the open page closes it too.
  for (const [steps, name, tag, band] of [[3, 'Memories: Fallen Trainers', 'Loss', /#9a5ad8/], [1, 'Memories: Battle Replays', 'Play', /#d8483a/]] as const) {
    for (let i = 0; i < steps; i++) await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(mem).toContainText(name);
    await expect(mem.locator('.hd')).toHaveAttribute('style', band);
    await expect(mem).toContainText(tag);
    await page.keyboard.press('Enter');
    await expect(page.locator('#rx .stage[data-scene="Memories"]')).toHaveCount(2);
    await top.locator('[data-act="close"]').last().click();
    await expect(page.locator('#rx .stage[data-scene="Memories"]')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(mem.locator('.hd')).toHaveText('Memories'); // back on the menu, the cursor where it was
  }
  // Heirlooms is the mock-up gallery.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(mem).toContainText('Memories: Heirlooms');
  await expect(mem).toContainText('Found');
  expect(errors).toEqual([]);
});

test('New UI: a champion in the Hall of Fame opens the winning-team page; Esc goes back to the list', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&debug=1');
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const mk = (speciesId: string, level: number, shiny = false) => ({ speciesId, level, shiny });
    const run = { runId: 'r128', endedAt: '2026-11-10T12:00:00Z', seed: 'r128', archetypeId: 'red', campaignId: 'full', victory: true, regionsCleared: 1, regions: 1, badges: 8, encounters: 128, defeatedBy: null, party: [mk('charizard', 52), mk('lucario', 50), mk('gengar', 49), mk('gyarados', 51, true), mk('garchomp', 53), mk('pikachu', 47)], bankCredits: 0, researchPoints: 0, achievements: [], moments: [], journal: [], epitaph: 'Charizard carried this journey.', legacy: [] };
    pkr.session.changeProfile((p: any) => ({ ...p, runHistory: [run] }));
    pkr.game.scene.getScenes(true)[0].scene.start('HallOfFame');
  });
  await waitForScene(page, 'HallOfFame');
  const stages = page.locator('#rx .stage[data-scene="HallOfFame"]');
  await expect(stages.first()).toContainText('Records');
  await expect(stages.first()).toContainText('Champion team');
  // Enter on the Records row opens nothing.
  await page.keyboard.press('Enter');
  await expect(stages).toHaveCount(1);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(stages).toHaveCount(2);
  const team = stages.last();
  for (const bit of ['Hall of Fame', 'Charizard', 'Lv 52', 'Fire · Flying', 'LEAD', 'Lucario', 'Gengar', 'Gyarados', 'Shiny', 'Garchomp', 'Pikachu', '2026-11-10 · Champion · Red. Your winning team.']) await expect(team).toContainText(bit);
  await expect(team.locator('[data-act="pick"]')).toHaveCount(6);
  await expect(team.locator('.hd')).toHaveAttribute('style', /#b8862a/); // the run end's gold band
  await expect(team.locator('.an')).toHaveCount(6);
  // No HP is on record, so no numbers are made up.
  await expect(team).not.toContainText('1 / 1');
  await expect(team.locator('.sel')).toContainText('Charizard');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(team.locator('.sel')).toContainText('Gengar');
  await page.screenshot({ path: 'test-results/newui-hall-of-fame-team.png' });
  await page.keyboard.press('Escape');
  await expect(stages).toHaveCount(1);
  expect(await scene(page)).toBe('HallOfFame');
  await page.keyboard.press('Escape');
  await waitForScene(page, 'Hub');
  expect(errors).toEqual([]);
});

test('New UI: Esc on the map opens the mock-up pause menu; its buttons open the map\'s own menus, Settings comes back to the map, End run needs an Adventure run and asks first', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  await page.waitForTimeout(250);
  const map = () => view(page, 'Map').first();
  const top = () => view(page, 'Map').last();
  const buttons = () => map().locator('[data-act="pause"][data-over="pauseOver"]');
  const paused = async (yes: boolean) => expect(buttons()).toHaveCount(yes ? 6 : 0);
  const node = await page.evaluate(() => (window as any).__pkr.session.run.stage.current);
  await page.keyboard.press('Escape');
  await paused(true);
  await expect(map()).toContainText('Paused');
  await expect(buttons()).toHaveText(['Resume', 'Party', 'Bag', 'Settings', 'Save', 'End run']);
  await expect(map().locator('.btn.on[data-act="pause"]')).toHaveText('Resume');
  await page.screenshot({ path: 'test-results/newui-pause.png' });
  // While paused the map does not travel: Enter is "Resume", not the stop under the cursor.
  await page.keyboard.press('Enter');
  await paused(false);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.stage.current)).toBe(node);
  expect(await scene(page)).toBe('Map');
  // Esc closes it too, and a click beside the buttons.
  await page.keyboard.press('Escape');
  await paused(true);
  await page.keyboard.press('Escape');
  await paused(false);
  await page.keyboard.press('Escape');
  await paused(true);
  await map().locator('.shade[data-act="pause"]').click({ position: { x: 40, y: 300 } });
  await paused(false);
  // The arrows wrap; Party, Bag and Save open the map's own menus.
  await page.keyboard.press('Escape');
  await page.keyboard.press('ArrowUp');
  await expect(map().locator('.btn.on[data-act="pause"]')).toHaveText('End run');
  // A Classic run cannot be ended from here: the button is dim, says why, and pressing it does nothing.
  await expect(map()).toContainText('Only an Adventure run can be ended here. Use Save to leave this one.');
  await page.keyboard.press('Enter');
  await paused(true);
  expect(await scene(page)).toBe('Map');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(map().locator('.btn.on[data-act="pause"]')).toHaveText('Party');
  await page.keyboard.press('Enter');
  await expect(top().locator('.hd')).toContainText('Party');
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await expect(view(page, 'Map')).toHaveCount(1);
  await paused(false);
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await buttons().nth(2).click();
  await expect(top().locator('.hd')).toContainText('Bag');
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await expect(view(page, 'Map')).toHaveCount(1);
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await buttons().nth(4).click();
  for (const bit of ['Save', 'Save & Quit', 'Save & go back to Hub']) await expect(top()).toContainText(bit);
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await expect(view(page, 'Map')).toHaveCount(1);
  // Settings opens with a way back to the map, without the rows that would leave the run.
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await buttons().nth(3).click();
  await waitForScene(page, 'Settings');
  const settings = view(page, 'Settings').last();
  await page.waitForTimeout(250);
  // Up from the first row wraps to the last one: the way back.
  await page.keyboard.press('ArrowUp');
  await expect(settings).toContainText('Back to the map');
  await expect(settings).not.toContainText('Back to the title screen');
  await settings.locator('[data-act]', { hasText: 'Save & Data' }).first().click();
  await expect(settings).toContainText('Export save to a file');
  for (const gone of ['Import save from a file', 'Replay the tutorial', 'Asset credits', 'Read the update log']) await expect(settings).not.toContainText(gone);
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await expect(settings).toContainText('Animations & Effects');
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await waitForScene(page, 'Map');
  await expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 15_000 }).toBe(false);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.stage.current)).toBe(node);
  // An Adventure run: End run opens the mock-up's "End this run?" box with the cursor on "Keep playing".
  await page.evaluate(() => { (window as any).__pkr.session.run.rules.modeId = 'adventure'; });
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await paused(true);
  await buttons().nth(5).click();
  const answers = () => map().locator('[data-act="confirm"][data-over="confirmOver"]');
  await expect(answers()).toHaveText(['Keep playing', 'End run']);
  await expect(map()).toContainText('End this run?');
  await expect(map()).toContainText('Your progress is banked as a defeat. This cannot be undone.');
  await expect(map().locator('.btn.on[data-act="confirm"]')).toHaveText('Keep playing');
  await page.screenshot({ path: 'test-results/newui-pause-confirm.png' });
  // Enter on "Keep playing" and Esc both go back to the pause menu; a click beside the box does nothing; the run goes on.
  await page.keyboard.press('Enter');
  await expect(answers()).toHaveCount(0);
  await paused(true);
  await page.keyboard.press('Enter');
  await expect(answers()).toHaveCount(2);
  await page.keyboard.press('ArrowRight');
  await expect(map().locator('.btn.on[data-act="confirm"]')).toHaveText('End run');
  await page.keyboard.press('Escape');
  await expect(answers()).toHaveCount(0);
  await paused(true);
  await page.keyboard.press('Enter');
  await map().locator('.shade').click({ position: { x: 40, y: 300 } });
  await expect(answers()).toHaveCount(2);
  expect(await scene(page)).toBe('Map');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.phase)).toBe('map');
  // "End run" in the box ends it.
  await answers().nth(1).click();
  await waitForScene(page, 'GameOver');
  expect(await page.evaluate(() => (window as any).__pkr.session.run.victory)).toBe(false);
  expect(errors).toEqual([]);
});

test('New UI: F2 opens the mock-up debug window (Scene, Seed, RNG stream, FPS and six tags); a tag unfolds its tool and the tools still work', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&debug=1&seed=newui-debug');
  // With no run yet the window still opens: the title screen's scene, no seed.
  await page.keyboard.press('F2');
  const win = page.locator('#rx .stage[data-scene="debug"] #rx-debug');
  await expect(win).toBeVisible();
  await expect(win).toContainText('Debug panel');
  await expect(win.locator('[data-fact="scene"] b')).toHaveText('MainMenuScene');
  await expect(win.locator('.tg')).toHaveText(['Scene jump', 'Story log', 'Asset viewer', 'Moment viewer', 'Save creator', 'Extended Cut']);
  await expect(win.locator('.tg:not(.no)')).toHaveText('Scene jump');
  await expect(win.locator('.dbg-tool')).toHaveCount(0);
  // The old panel and the corner frame meter step aside while the window is open.
  await expect(page.locator('#debug-panel')).toBeHidden();
  await expect(page.locator('#fps-meter')).toBeHidden();
  await win.locator('.tg', { hasText: 'Story log' }).click();
  await expect(win.locator('.dbg-tool')).toContainText('No active run.');
  await page.keyboard.press('F2');
  await expect(win).toBeHidden();
  await expect(page.locator('#fps-meter')).toBeVisible();
  // On the map: the scene line follows the game, the seed is the run's, the frame rate is a number.
  await toMap(page);
  await page.keyboard.press('F2');
  await expect(win.locator('[data-fact="scene"] b')).toHaveText('MapScene');
  await expect(win).toContainText('newui-debug');
  await expect(win.locator('[data-fact="fps"] b')).toHaveText(/^\d+$/, { timeout: 15_000 });
  await expect(win.locator('.row.sm', { hasText: 'RNG stream' }).locator('b')).toHaveText(/^[a-z]+ #[0-9a-f]{8}$/);
  // The window stays inside the game picture, folded and unfolded.
  const inside = async () => {
    const [w, g] = await Promise.all([win.boundingBox(), page.locator('canvas').boundingBox()]);
    expect(w!.x).toBeGreaterThanOrEqual(g!.x);
    expect(w!.y).toBeGreaterThanOrEqual(g!.y);
    expect(w!.x + w!.width).toBeLessThanOrEqual(g!.x + g!.width + 1);
    expect(w!.y + w!.height).toBeLessThanOrEqual(g!.y + g!.height + 1);
  };
  await inside();
  await page.screenshot({ path: 'test-results/newui-debug.png' });
  // Story log was the chosen tag: its tool is still unfolded and now reads the run.
  await expect(win.locator('.tg:not(.no)')).toHaveText('Story log');
  await expect(win.locator('.dbg-tool')).toContainText('Story Log');
  // A click on the chosen tag folds it; another tag unfolds its own tool.
  await win.locator('.tg', { hasText: 'Story log' }).click();
  await expect(win.locator('.dbg-tool')).toHaveCount(0);
  await win.locator('.tg', { hasText: 'Scene jump' }).click();
  for (const bit of ['seed: newui-debug', 'RNG streams', 'Region', 'Stage', 'Heal party', 'Add Pokémon to party', 'Give item', 'New run with seed']) await expect(win.locator('.dbg-tool')).toContainText(bit);
  await inside();
  // A tool does its job: Give 5 puts five of the chosen item in the bag (and the map under the window is not clicked).
  const node = await page.evaluate(() => (window as any).__pkr.session.run.stage.current);
  const item = await win.locator('.dbg-tool select').nth(1).inputValue();
  const had = await page.evaluate((id) => (window as any).__pkr.session.run.inventory[id] ?? 0, item);
  await win.locator('.dbg-tool button', { hasText: 'Give 5' }).click();
  expect(await page.evaluate((id) => (window as any).__pkr.session.run.inventory[id] ?? 0, item)).toBe(had + 5);
  expect(await page.evaluate(() => (window as any).__pkr.session.run.stage.current)).toBe(node);
  expect(await scene(page)).toBe('Map');
  await win.locator('.tg', { hasText: 'Asset viewer' }).click();
  await expect(win.locator('.dbg-tool')).toContainText(/Assets: \d+ loaded/);
  await win.locator('.tg', { hasText: 'Moment viewer' }).click();
  await expect(win.locator('#moment-list')).toContainText('shown');
  await expect(win.locator('#force-event option')).not.toHaveCount(0);
  await win.locator('.tg', { hasText: 'Save creator' }).click();
  await expect(win.locator('.dbg-tool button')).toHaveText('Open the Save Creator');
  await win.locator('.tg', { hasText: 'Extended Cut' }).click();
  await expect(win.locator('.dbg-tool button')).toHaveText('Jump to the Extended Cut');
  await page.screenshot({ path: 'test-results/newui-debug-tool.png' });
  // F2 puts it away again.
  await page.keyboard.press('F2');
  await expect(win).toBeHidden();
  expect(errors).toEqual([]);
});

test('New UI: the Beta 0.6 battle pieces show over the field: the Shadow line, the Foresight Tax banner, the variant hint with its rule under I, and the item budget beside the Item window', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=newui-e2e');
  await toMap(page);
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Battle');
  await toCommands(page);
  const stage = view(page, 'Battle').first();
  // Nothing of them in an ordinary fight.
  for (const bit of ['Shadow ·', 'Foresight Tax', 'variant-line', 'Item budget']) await expect(stage).not.toContainText(bit);

  // A sealed Shadow Pokémon on a turn the shadow overrides: its line stands in its own window, not in the text box.
  const plan = await page.evaluate(() => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    b.activeMon().shadow = { heart: 100 };
    for (let t = 1; t < 200; t++) {
      b.run.battle.turn = t;
      b.showRootMenu();
      if (b.rxShadow?.plan.includes('tightens')) return b.rxShadow.plan as string;
    }
    return null;
  });
  expect(plan).toContain('The shadow tightens: it will use');
  await expect(stage).toContainText('Shadow · Fallen (tier 4) · Sealed 100/100');
  await expect(stage).toContainText(plan!);
  await expect(stage.locator('.txt')).toContainText('What will');
  await expect(stage.locator('.txt')).not.toContainText('Shadow ·');
  await page.screenshot({ path: 'test-results/newui-battle-shadow-line.png' });

  // Foresight Tax is on: the banner says so while you choose.
  await page.evaluate(() => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    delete b.activeMon().shadow;
    b.run.battle.eventRule = { ...(b.run.battle.eventRule ?? {}), foresight: true };
    b.showRootMenu();
  });
  await expect(stage).toContainText('Foresight Tax');
  await expect(stage).toContainText('Sabrina sees the first move you choose this turn.');
  await expect(stage).not.toContainText('Shadow ·');
  await page.screenshot({ path: 'test-results/newui-battle-foresight.png' });

  // The foe wears a variant line's ring: the hint shows at this prompt, and I reads the rule.
  await page.evaluate(() => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    b.run.battle.eventRule = { ...b.run.battle.eventRule, foresight: false };
    b.run.battle.extra = { ...(b.run.battle.extra ?? {}), variants: { [b.shown.enemy.uid]: { line: 'tagged', flags: { tag: 1 } } } };
    b.showRootMenu();
  });
  await expect(stage).not.toContainText('Foresight Tax');
  await expect(stage).toContainText('A ring marks a variant-line Pokémon. Press I to read its rule.');
  await page.screenshot({ path: 'test-results/newui-battle-variant.png' });
  await page.keyboard.press('i');
  await expect(stage).toContainText('Variant line: Tagged. A Black-Label Pokémon cannot be forced to switch out, and the first hit it takes in each battle does 20% less damage.');
  await expect(stage).not.toContainText('A ring marks a variant-line');
  await page.keyboard.press('i');
  await expect(stage).not.toContainText('Variant line: Tagged');
  // It is pointed out once: the next prompt for the same foe leaves it out.
  await page.evaluate(() => (window as any).__pkr.game.scene.getScene('Battle').showRootMenu());
  await expect(stage).toContainText('What will');
  await expect(stage).not.toContainText('A ring marks a variant-line');

  // The Item window: the budget stands beside it with what this battle already used.
  await page.evaluate(() => {
    const b = (window as any).__pkr.game.scene.getScene('Battle');
    b.run.inventory = { ...b.run.inventory, potion: 2, revive: 1 };
    b.run.battle.healsUsed = 10;
    b.run.battle.revivesUsed = 2;
  });
  await page.waitForTimeout(250);
  await view(page, 'Battle').locator('[data-act="tab"]', { hasText: 'Item' }).first().click();
  for (const bit of ['Item budget', 'this battle', 'Heals', '10 / 10', 'Revives', '2 / 6', 'No healing items are left for this battle.']) await expect(stage).toContainText(bit);
  await page.screenshot({ path: 'test-results/newui-battle-budget.png' });
  await page.keyboard.press('Escape');
  await expect(stage).not.toContainText('Item budget');
  expect(errors).toEqual([]);
});

test('New UI: in an Extended Cut climax a wide-format page opens the phase list with P: done phases, the one running now, and what is ahead', async ({ page }) => {
  const errors = watch(page);
  await start(page, 'ui=new&seed=e4-breather');
  await toMap(page);
  // The Kanto Extended Cut stands at its Breather (phase 6 of 11): five phases are behind it.
  await page.evaluate(() => {
    const pkr = (window as any).__pkr;
    const run = pkr.session.run;
    run.party[0].hp = 1;
    run.expansion = { ...(run.expansion ?? {}), cut: { climaxCut: 'extended', region: 'kanto', director: { idx: 5, shots: 0, started: 5 }, format: { id: 'breather', state: { healPct: 0.5, step: 'choose', revived: null, healed: 0 } } } };
    pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });
  });
  await waitForScene(page, 'Format');
  const room = view(page, 'Format');
  await expect(room).toContainText('The quiet room');
  await expect(room.locator('.keys')).toContainText('phases');
  const cut = () => page.evaluate(() => JSON.stringify((window as any).__pkr.session.run.expansion.cut));
  const before = await cut();
  await page.waitForTimeout(250);
  await page.keyboard.press('p');
  await expect(room.locator('.hd')).toContainText('Extended Cut: phase list');
  await expect(room).not.toContainText('The quiet room');
  // The cursor starts on the phase that is running; the phases before it are done.
  await expect(room.locator('.win.sel')).toContainText('Breather');
  await expect(room.locator('.win.sel')).toContainText('Heal, revive one, save');
  await expect(room.locator('.win.sel .tg')).toHaveText('Now');
  await expect(room).toContainText('The longer Kanto climax, in order. Second Shot: the first loss retries from the last save point.');
  await page.screenshot({ path: 'test-results/newui-cut-phases.png' });
  // Up walks back over what is done; down from there goes on to what is next and ahead.
  await page.keyboard.press('ArrowUp');
  await expect(room.locator('.win.sel')).toContainText('The Officers');
  await expect(room.locator('.win.sel .tg')).toHaveText('Done');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(room.locator('.win.sel')).toContainText('Saffron Sealed');
  await expect(room.locator('.win.sel .tg')).toHaveText('Next');
  await page.keyboard.press('ArrowDown');
  await expect(room.locator('.win.sel')).toContainText('Giovanni');
  await expect(room.locator('.win.sel .tg')).toHaveText('Ahead');
  for (let k = 0; k < 6; k++) await page.keyboard.press('ArrowDown');
  await expect(room.locator('.win.sel')).toContainText('Resolution');
  // Esc goes back to the page; a click on the hint opens the list again and Enter closes it. Looking changed nothing.
  await page.keyboard.press('Escape');
  await expect(room).toContainText('The quiet room');
  await room.locator('[data-act="phases"]').click();
  await expect(room.locator('.hd')).toContainText('Extended Cut: phase list');
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await expect(room).toContainText('The quiet room');
  expect(await cut()).toBe(before);
  expect(await scene(page)).toBe('Format');
  // The page still works: Rest heals.
  await room.locator('[data-act="pick"]').click();
  await expect(room).toContainText('Everyone still standing has rested.');
  expect(errors).toEqual([]);
});

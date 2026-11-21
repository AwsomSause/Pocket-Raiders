import { describe, expect, it } from 'vitest';
import { pocketRoad, roadNext, roadStop, rotomNews, rotomTip, trainerId } from '../../src/core/presentation/pocket';
import { changeSetting, SETTINGS } from '../../src/core/settingsRegistry';
import { DEFAULT_SETTINGS } from '../../src/save/saveManager';
import { page, pkPageOf, tierClass } from '../../src/ui/pocket/kit';
import { pkAce, pkVersus } from '../../src/ui/pocket/screens/cards';
import { dealOf, dealWord, pageText, pkEvent, points } from '../../src/ui/pocket/screens/event';
import { mapWindow, nodeState, pkMap, pkMiniMap, pkNodeMenu } from '../../src/ui/pocket/screens/map';
import { pkPause } from '../../src/ui/pocket/screens/pause';
import { pkBag, pocketIcon } from '../../src/ui/pocket/screens/bag';
import { CARD_BADGES, pkCard, rankFact } from '../../src/ui/pocket/screens/card';
import { PK_TYPE_ORDER, pkTypes, typeRows } from '../../src/ui/pocket/screens/types';
import { journalIcon, pkJournal, splitEntry } from '../../src/ui/pocket/screens/journal';
import { dexNo, movesSize, pkDex, pkDexWall, type PkDexCell } from '../../src/ui/pocket/screens/dex';
import type { DexModel } from '../../src/ui/redux/screens/dex';
import { pkParty } from '../../src/ui/pocket/screens/party';
import { pkSummary, radar } from '../../src/ui/pocket/screens/summary';
import type { PartyCard, SummaryModel } from '../../src/ui/redux/screens/party';
import { healNote, pkCenter } from '../../src/ui/pocket/screens/center';
import { categoryWord, pkReward, rarityOf } from '../../src/ui/pocket/screens/reward';
import type { RewardModel } from '../../src/ui/redux/screens/stops';
import { pkShop, pkShopPay, type PkShopGood, type PkShopModel } from '../../src/ui/pocket/screens/shop';
import type { MapModel, MapNodeView } from '../../src/ui/redux/screens/map';
import type { EventModel } from '../../src/ui/redux/screens/event';
import { pkSettingsHome } from '../../src/ui/pocket/screens/settings';
import { doorSub, pkHub, type PkHubModel } from '../../src/ui/pocket/screens/hub';
import { districtProp, pkPlaza, pkTrade, pkTownDoor, pkTownHud, pkTownMap, placeProp, plazaProp } from '../../src/ui/pocket/screens/town';
import { POCKET_TOWN } from '../../src/core/hubTown/schema';
import { leaderLine, pkBlessing, pkBrief, pkDesk, pkPrepBring, pkPrepMods, pkPrepSetup, pkSeed, pkStarter, PREP_MODS_PAGE, PREP_SETUP_ROWS, regionOfGen, runSteps, segWindow } from '../../src/ui/pocket/screens/run';
import type { BriefModel } from '../../src/ui/redux/screens/run';
import type { TradeModel } from '../../src/ui/redux/screens/stops';
import { PK_TOOLS_PAGE, pkTools, toolShort } from '../../src/ui/pocket/screens/tools';
import { PK_TRAINER_SIDE, pkTrainers, trainerColour } from '../../src/ui/pocket/screens/trainers';
import { pkBoot, pkCredits, pkCreditsRows } from '../../src/ui/pocket/screens/ending';
import { hallTag, pkHall } from '../../src/ui/pocket/screens/hall';
import { keepLine, pkOver } from '../../src/ui/pocket/screens/over';
import { pkGallery, pkMemories, shelfMon, type PkGalleryModel } from '../../src/ui/pocket/screens/memories';
import { firstThought, fitBody, pkBoard, pkConfirm, pkGrid, pkMenu, pkOptions, pkSaves, pkStats } from '../../src/ui/pocket/templates';

const stage = (current: string | null) => ({
  current,
  map: { columns: 5, nodes: [
    { id: 'a', column: 1, kind: 'wild' }, { id: 'b', column: 2, kind: 'trainer' }, { id: 'b2', column: 2, kind: 'wild' },
    { id: 'c', column: 3, kind: 'wild' }, { id: 'd', column: 4, kind: 'trainer' }, { id: 'e', column: 5, kind: 'gym' },
  ] },
});

describe('Pocket look: the progress ribbon', () => {
  it('has one mark per column, the current stop and the boss stop', () => {
    expect(pocketRoad(stage('b2'))).toEqual({ n: 5, at: 1, gyms: [4] });
    expect(pocketRoad(null)).toBeNull();
  });
  it('before the first stop nothing is lit', () => {
    const r = pocketRoad(stage(null))!;
    expect(r.at).toBe(-1);
    expect(roadStop(r)).toBe('Start of 5 stops');
    expect(roadNext(r)).toBe('Gym in 5 stops');
  });
  it('says how far the Gym is', () => {
    expect(roadStop(pocketRoad(stage('c'))!)).toBe('Stop 3 of 5');
    expect(roadNext(pocketRoad(stage('c'))!)).toBe('Gym in 2 stops');
    expect(roadNext(pocketRoad(stage('d'))!)).toBe('Gym next');
    expect(roadNext(pocketRoad(stage('e'))!)).toBe('Gym now');
    expect(roadNext({ n: 5, at: 3, gyms: [] })).toBe('');
    expect(roadNext({ n: 5, at: 2, gyms: [4] }, 'League')).toBe('League in 2 stops');
  });
  it('a trainer ID is five digits and the same for the same seed', () => {
    expect(trainerId('PIKA-7Q2M')).toMatch(/^\d{5}$/);
    expect(trainerId('PIKA-7Q2M')).toBe(trainerId('PIKA-7Q2M'));
    expect(trainerId('A')).not.toBe(trainerId('B'));
  });
});

describe('Pocket look: the setting and the page mark', () => {
  it('UI style has Pocket after New; New stays the default', () => {
    expect(DEFAULT_SETTINGS.uiStyle).toBe('new');
    expect(changeSetting(DEFAULT_SETTINGS, 'uiStyle').uiStyle).toBe('pocket');
  });
  it('a Pocket page carries its id and tier, and the tier picks the rule groups', () => {
    const html = page('title', 17, '<div class="scr title"></div>');
    expect(pkPageOf(html)).toEqual({ id: 'title', tier: 17, hud: false });
    expect(pkPageOf(page('ask', 26, '<div></div>', true))).toEqual({ id: 'ask', tier: 26, hud: true });
    expect(pkPageOf('<div></div>')).toBeNull();
    expect(tierClass(17)).toBe('');
    expect(tierClass(24)).toBe(' t24');
    expect(tierClass(26)).toBe(' t24 t26');
    expect(tierClass(51)).toBe(' t24 t26 t51');
  });
});

describe('Pocket look: Rotom', () => {
  it('reads out the event that ends first, or a plain line', () => {
    expect(rotomNews([])).not.toBe('');
    const line = rotomNews([{ event: { name: 'Homeland Week' }, endsIn: 3 }]);
    expect(line).toContain('Homeland Week');
  });
  it('says what lies ahead and what the party needs', () => {
    expect(rotomTip({ next: 'Gym in 3 stops', fainted: 0, hurt: 0, size: 6 })).toBe('"Bzzt! Gym in 3 stops. Your party is in good shape."');
    expect(rotomTip({ next: 'Gym next', fainted: 1, hurt: 2, size: 6 })).toContain('1 of your 6 Pokémon has fainted');
    expect(rotomTip({ next: '', fainted: 0, hurt: 2, size: 6 })).toBe('"Bzzt! The road is clear for now. 2 of your Pokémon are low on HP."');
  });
});

describe('Pocket look: settings rows', () => {
  it('a setting with a short fixed list names its values in pressing order', () => {
    const ui = SETTINGS.find((d) => d.id === 'uiStyle')!;
    expect(ui.values).toEqual(['New', 'Pocket', 'Phantom', 'Old']);
    // The list is the same whatever the value is now, so a row never reshuffles as it is pressed.
    expect(ui.values).toContain(ui.show(ui.next(DEFAULT_SETTINGS)));
  });
  const model = (rows: { label: string; value: string; disabled?: boolean }[], index = 0) => ({ title: 'Settings · Test', tabs: ['One', 'Two'], tab: 0, rows, index, text: '' });
  it('draws a switch, a bar, the choices side by side, or the value between arrows', () => {
    const html = pkOptions(model([{ label: 'A', value: 'On' }, { label: 'B', value: '70%' }, { label: 'C', value: 'Fast' }, { label: 'D', value: 'A very long value indeed' }, { label: 'E', value: '' }]), { rows: [{}, {}, { opts: ['Slow', 'Fast'] }, {}, {}] });
    expect(html).toContain('class="tog on"');
    expect(html).toContain('width:70%');
    expect(html).toContain('<i class="">Slow</i><i class="on">Fast</i>');
    expect(html).toContain('gx-cyc');
    expect(html).toContain('<b>Choose</b>');
  });
  it('a bar never runs past its end, and a waiting change is said in words', () => {
    const html = pkOptions(model([{ label: 'Zoom', value: '150%  · next battle' }]), { rows: [{ about: 'How big.' }] });
    expect(html).toContain('width:100%');
    expect(html).toContain('<b>150%</b>');
    expect(html).toContain('How big. Applies next battle.');
  });
  it('shows a window of rows around the lit one and says where it is', () => {
    const rows = Array.from({ length: 20 }, (_, k) => ({ label: `Row ${k}`, value: 'On' }));
    const html = pkOptions(model(rows, 12));
    expect(html).toContain('10–15 of 20');
    expect(html).not.toContain('>Row 8<');
    expect(html).toContain('>Row 12<');
    expect(pkOptions(model(rows.slice(0, 4)))).not.toContain(' of 4');
  });
  it('text from the game is escaped', () => {
    expect(pkOptions(model([{ label: '<b>x</b>', value: '<i>' }]))).not.toContain('<b>x</b>');
    expect(pkConfirm({ title: '<script>', body: 'a & b', options: ['<1>'], index: 0 })).not.toContain('<script>');
  });
  it('the first thought of a description is its first sentence, or a clause of it', () => {
    expect(firstThought('Short one. And more.', 60)).toBe('Short one.');
    expect(firstThought('The look of the New interface: twenty themes, each with its own colours, frames, font and layouts. More.', 60)).toBe('The look of the New interface: twenty themes…');
    expect(firstThought('', 60)).toBe('');
  });
  it('body text steps down until it fits, and stops at the smallest size', () => {
    expect(fitBody('Hi', 400, 200)).toBe(14.5);
    expect(fitBody('x'.repeat(900), 400, 200)).toBeLessThan(14.5);
    expect(fitBody('x'.repeat(90000), 400, 200)).toBe(10);
  });
});

describe('Pocket look: shared pages', () => {
  it('every shared page is a Pocket page of the Final Cut', () => {
    const menu = pkMenu({ title: 'Menu', items: [{ label: 'One' }, { label: 'Two', disabled: true }], index: 0 });
    const stats = pkStats({ title: 'Stats', tiles: [['Runs', '3']], text: 'T' });
    const grid = pkGrid({ title: 'Wall', n: 2, cell: (i) => ({ label: `C${i}`, off: i === 1 }), index: 0, detail: { title: 'C0' }, found: 1, total: 2, text: 'T' });
    const board = pkBoard({ title: 'Board', area: 'hub', rows: [], index: 0, text: 'T' });
    for (const html of [menu, stats, grid, board]) expect(pkPageOf(html)?.tier).toBe(26);
    expect(menu).toContain('btn off');
    expect(grid).toContain('Found 1 of 2');
    expect(board).toContain('Nothing here yet');
  });
  it('a menu leaves the text box out when its card already says the same', () => {
    const d = { title: 'Menu', items: [{ label: 'One' }], index: 0, detail: { body: 'Same words.' } };
    expect(pkMenu({ ...d, text: 'Same words.' })).not.toContain('class="tb');
    expect(pkMenu({ ...d, text: 'Other words.' })).toContain('class="tb');
  });
  it('save slots: an empty slot offers a start, a used one can be erased', () => {
    const slot = { tag: 'Slot 1', name: 'Red', where: 'Kanto · Stage 2', time: '2026-11-20', party: ['pokemon/6'], empty: false };
    const html = pkSaves({ slots: [slot, { tag: 'Slot 2', name: '', where: '', time: '', party: [], empty: true }], focus: 0, onDelete: true, note: 'N', confirm: null });
    expect(html).toContain('gx-del on');
    expect(html).toContain('Start a new journey here.');
    expect(pkSaves({ slots: [slot], focus: 0, onDelete: false, note: 'N', confirm: { title: 'Delete slot 1?', body: '', options: ['Keep it', 'Delete'], index: 0 } })).toContain('cf-box');
  });
  it('the Settings home lights one tile or one of the rows under them', () => {
    const d = { tiles: [{ id: 'display', label: 'Display', sub: 'UI style: New' }], more: [{ label: 'Back' }], text: 'T', crumb: ['Title', 'Settings'] };
    expect(pkSettingsHome({ ...d, index: 0 })).toContain('tile sc on');
    expect(pkSettingsHome({ ...d, index: 1 })).toContain('btn sm on');
  });
  it('the Pause menu is the Rotom Phone at pass 24, and a switched-off app is greyed', () => {
    const base = { when: 'Day 1 · Morning', where: 'Kanto · Stop 1 of 30', money: '₽ 0', saved: 'Auto-save on', road: { n: 30, at: 0, gyms: [29] }, next: 'Level 1: Wild Pokémon', apps: [{ label: 'Party' }, { label: 'End run', off: true }], index: 0, rotom: '"Bzzt!"', hero: { art: null, name: 'Red', chips: ['Rank 0'] }, party: [{ art: null, name: 'Piplup', level: 5, hp: 0, type: 'water' }], run: ['Stop 1 of 30'], ask: null };
    const html = pkPause(base);
    expect(pkPageOf(html)).toEqual({ id: 'menu', tier: 24, hud: false });
    expect(html).toContain('rapp on');
    expect(html).toContain('rapp gx-off');
    expect(html).toContain('pkm fnt');
    // Eleven apps: eight on the first screen, the rest on a second one with dots to switch.
    const many = ['Party', 'Bag', 'Pokédex', 'Trainer Card', 'Journal', 'Type Chart', 'Save', 'Settings', 'PC Box', 'Rivals', 'End run'].map((label) => ({ label }));
    const first = pkPause({ ...base, apps: many, index: 2 });
    expect(first.match(/class="rapp/g)?.length).toBe(8);
    expect(first).toContain('data-act="pausePage"');
    const second = pkPause({ ...base, apps: many, index: 9 });
    expect(second.match(/class="rapp/g)?.length).toBe(3);
    expect(second).toContain('data-key="a9"');
    expect(second).not.toContain('data-key="a0"');
    // A long top bar steps its text down so the money and the save note stay on the phone's screen.
    expect(pkPause({ ...base, where: 'Trial Archipelago · Stop 12 of 30', money: '₽ 1,234,567' })).toMatch(/rp-bar" style="font-size:(9\.5|10|11)px/);
  });
});

describe('Pocket look: battle cards for the animations playback', () => {
  const vs = { name: 'Gretel', role: 'Fairy Tale Girl', cast: null, line: 'Hope you brought your best!', evil: false, team: 2, lead: null, player: null, playerName: 'Red', party: ['a'], backdrop: null };
  it('the Trainer Intro has a root with its state and times, and keyed parts', () => {
    const html = pkVersus(vs);
    expect(pkPageOf(html)).toEqual({ id: 'vs', tier: 26, hud: false });
    expect(html).toContain('gx-cue is-in');
    expect(html).toMatch(/--pk-in:[\d.]+s;--pk-out:[\d.]+s/);
    for (const k of ['vs', 'vs-l', 'vs-r', 'vs-n-me', 'vs-n-foe', 'vs-mark', 'vs-say']) expect(html).toContain(`data-key="${k}"`);
    expect(html).toContain('Gretel: &quot;Hope you brought your best!&quot;');
    expect(pkVersus(vs, 'hold')).toContain('gx-cue is-hold');
    // Six ball slots each side: the rest of the player's six are empty slots.
    expect(html.match(/class="px none"/g)?.length).toBe(5 + 4);
  });
  it('the Ace Announcement lies over the battle and names the ace with its facts', () => {
    const html = pkAce({ name: 'Blastoise', role: 'Rival Blue sends out his ace', line: '', cast: null, mon: null, backdrop: null, beat: 2, types: ['water'], facts: ['Lv 38'] }, 'out');
    expect(pkPageOf(html)).toEqual({ id: 'ace', tier: 26, hud: true });
    expect(html).toContain('gx-cue is-out');
    expect(html).toContain('>Water<');
    expect(html).toContain('<em>Lv 38</em>');
    for (const k of ['ace', 'ace-dim', 'ace-band', 'ace-name', 'ace-facts']) expect(html).toContain(`data-key="${k}"`);
  });
});

describe('Pocket look: event pages', () => {
  const base: EventModel = {
    name: 'The Old Lighthouse', tag: 'Event', lines: [{ who: 'Keeper Amos', text: 'The lamp went dark an hour ago.' }], speaker: 'Keeper Amos', page: { at: 0, of: 2 },
    art: 'packs/memories/eventbg/water_eve.png', tint: null, fx: null, cast: null, mon: null, look: null,
    choices: [
      { label: 'Climb to the lamp room', sub: 'A battle may start. You could find something rare.', chance: '', locked: false },
      { label: 'Help fix the light', sub: 'Costs ₽300. Always works.', chance: '', locked: false },
      { label: 'Walk on', sub: 'Nothing happens.', chance: '', locked: true },
    ],
    index: 1, money: 1200, outcome: null, pick: null, countdown: '', timer: null,
  };
  it('a talk page with more to read waits for Enter and turns the page', () => {
    const html = pkEvent(base);
    expect(pkPageOf(html)?.id).toBe('event');
    expect(html).toContain('<i class="on">1 Talk</i>');
    expect(html).toContain('data-act="page" data-arg="1"');
    expect(html).toContain('1/2');
    for (const k of ['ev', 'ev-bg', 'ev-where', 'ev-beats', 'ev-tb']) expect(html).toContain(`data-key="${k}"`);
  });
  it('on the last page the choices stand as cards over the text bar, one lit', () => {
    const html = pkEvent({ ...base, page: { at: 1, of: 2 } }, 'hold');
    expect(pkPageOf(html)?.id).toBe('ev-choice');
    expect(html).toContain('gx-cue gx-ev is-hold');
    expect(html.match(/class="chc /g)?.length).toBe(3);
    expect(html).toContain('class="chc cost on"');
    expect(html).toContain('Costs ₽ 300');
    expect(html).toContain('gx-off');
    for (const k of ['ev-row', 'ev-ch-0', 'ev-ch-2', 'ev-tb']) expect(html).toContain(`data-key="${k}"`);
    expect(html).toContain('data-act="page" data-arg="-1"');
    expect(html).not.toContain('<li>Costs ₽300</li>');
  });
  it('the outcome text comes first, and what changed shows only after it', () => {
    const outcome = { step: 'text' as const, ok: false, changes: ['+₽600', 'Rare Candy ×1'], next: 'Continue' };
    const text = pkEvent({ ...base, page: { at: 0, of: 1 }, outcome });
    expect(pkPageOf(text)?.id).toBe('ev-result');
    expect(text).toContain('It didn’t go your way');
    expect(text).not.toContain('erc');
    const won = pkEvent({ ...base, page: { at: 0, of: 1 }, outcome: { ...outcome, step: 'rewards', ok: true } });
    expect(pkPageOf(won)?.id).toBe('ev-reward');
    expect(won).toContain('You received');
    expect(won.match(/class="erc[ "]/g)?.length).toBe(2);
    expect(won).toContain('₽ 600');
    expect(won).toContain('data-act="next"');
  });
  it('a long list of choices stands in rows of shorter cards', () => {
    const many = Array.from({ length: 7 }, (_, k) => ({ label: `Choice ${k}`, sub: 'A note.', chance: '', locked: false }));
    const html = pkEvent({ ...base, page: { at: 0, of: 1 }, choices: many });
    expect(html).toContain('gx-many');
    expect(html).toContain('repeat(4,');
  });
  it('a card says how risky or costly it is, and its notes are short points', () => {
    expect(dealOf('danger', base.choices[0]!)).toBe('risk');
    expect(dealOf('calm', base.choices[1]!)).toBe('cost');
    expect(dealOf('calm', base.choices[0]!)).toBe('safe');
    expect(dealWord('risk', base.choices[0]!, 60)).toBe('Risky · 60%');
    expect(dealWord('safe', base.choices[2]!, null)).toBe('Locked');
    expect(points('A battle may start. You could find something rare. And more. And more still.', 2)).toEqual(['A battle may start', 'You could find something rare']);
    expect(pageText({ lines: [{ who: 'Amos', text: 'Hi.' }, { who: 'Lily', text: 'Yo.' }], speaker: 'Amos' })).toBe('Hi.\nLily: Yo.');
  });
});

describe('Pocket look: the stage map', () => {
  const node = (col: number, row: number, rows: number, o: Partial<MapNodeView> = {}): MapNodeView => ({ id: `n${col}-${row}`, col, row, rows, kind: 'wild', fog: false, visited: false, cur: false, go: false, dim: false, harder: false, opt: -1, sides: [], marks: [], title: 'Wild Pokémon', text: '', ...o });
  const nodes: MapNodeView[] = [];
  for (let c = 1; c <= 30; c++) for (let r = 0; r < (c % 3 === 0 ? 1 : 2); r++) nodes.push(node(c, r, c % 3 === 0 ? 1 : 2, { visited: c < 12 && r === 0, cur: c === 12 && r === 0, kind: c === 30 ? 'gym' : c % 4 === 0 ? 'trainer' : 'wild' }));
  for (const n of nodes.filter((n) => n.col === 13)) { n.go = true; n.opt = n.row; }
  const edges = nodes.filter((n) => n.col < 30).flatMap((a) => nodes.filter((b) => b.col === a.col + 1).map((b) => ({ a: a.id, b: b.id, open: a.cur, walked: a.visited && (b.visited || b.cur) })));
  const d: MapModel = {
    title: 'Kanto · Stage 3', chips: ['Stage 3 / 8', 'Gym in 18 stops', '₽ 4,820', 'Day 3 · Evening', 'High tide', 'Badges 2', 'Level cap 150'], types: ['water'],
    lines: ['Seaside (Water) · Gym Leader Misty', 'Escort: keep Pikachu safe'], party: [], eggs: ['3B'], art: null, trainer: 'trainer/red', columns: 30, column: 12, nodes, edges,
    buttons: [{ label: 'Party', opt: 2, hot: false }, { label: 'Bag', opt: 3, hot: false }], keys: [['C', 'cry']], hints: [], index: 1, info: 'Level 13: Wild Pokémon. Something rustles.', notice: '', going: null, banner: null, legend: null,
  };
  it('shows eight stops at a time with the current one fourth from the left', () => {
    expect(mapWindow(30, 12)).toBe(9);
    expect(mapWindow(30, 0)).toBe(1);
    expect(mapWindow(30, 29)).toBe(23);
    expect(mapWindow(5, 3)).toBe(1);
    const html = pkMiniMap(d);
    expect(html.match(/class="map-tick/g)?.length).toBe(8);
    expect(html).toContain('<span class="map-tick on" style="left:310px">12</span>');
    expect(html).not.toContain('data-key="map-n-n8-0"');
    expect(html).toContain('data-key="map-n-n16-0"');
    expect(html).not.toContain('data-key="map-n-n17-0"');
  });
  it('marks walked, passed, current and next stops, and lights the one under the cursor', () => {
    expect(nodeState(nodes.find((n) => n.id === 'n10-0')!, 12)).toBe('done');
    expect(nodeState(nodes.find((n) => n.id === 'n10-1')!, 12)).toBe('skip');
    expect(nodeState(nodes.find((n) => n.id === 'n12-0')!, 12)).toBe('here');
    expect(nodeState(nodes.find((n) => n.id === 'n13-1')!, 12)).toBe('next');
    expect(nodeState(nodes.find((n) => n.id === 'n14-0')!, 12)).toBe('');
    const html = pkMiniMap(d, 'hold');
    expect(html).toContain('class="node next gx-lit"');
    expect(html).toContain('gx-cue is-hold');
    expect(html).toContain('data-key="map-you"');
    expect(html).toMatch(/class="top walked" data-key="map-r-n10-0-n11-0"/);
  });
  it('the page says the stage of the region, the Gym and its leader, and keeps the stage notes behind L', () => {
    const html = pkMap(d);
    expect(pkPageOf(html)?.id).toBe('map');
    expect(html).toContain('Kanto · Stage 3 of 8');
    expect(html).toContain('<b>Gym in 18 stops</b><span>Misty · Water type</span>');
    expect(html).toContain('Next stop: Wild Pokémon');
    expect(html).toContain('<i>High tide</i><i>Egg 3B</i>');
    expect(html).toContain('stage note');
    const open = pkMap({ ...d, legend: [{ glyph: 'W', color: '#3fae5a', text: 'Wild Pokémon' }] });
    expect(open).toContain('Escort: keep Pikachu safe');
    expect(open).toContain('data-act="key" data-arg="C"');
  });
  it('a stop with several things at it opens as cards; an empty status shows no pill', () => {
    const html = pkNodeMenu({ header: 'Wild Pokémon', index: 1, cards: [{ kind: 'Rest', color: '#3fa129', name: 'Catnap', text: 'A short rest.', status: '', off: false, must: false }, { kind: 'Story', color: '#9141cb', name: 'Field notes', text: 'Jot it down.', status: 'Required', off: false, must: true }] });
    expect(html.match(/class="chc /g)?.length).toBe(2);
    expect(html).toContain('class="chc safe on"');
    expect(html).toContain('gx-st must');
    expect(html.match(/gx-st/g)?.length).toBe(1);
  });
});

describe('Pocket look: the Poké Mart', () => {
  const good = (k: number, o: Partial<PkShopGood> = {}): PkShopGood => ({ name: `Good ${k}`, tag: '', price: 100 + k, was: null, off: false, have: 0, art: null, inBasket: 0, ...o });
  const goods = Array.from({ length: 12 }, (_, k) => good(k));
  goods[1] = good(1, { tag: 'on sale!', was: 200, price: 150, have: 3 });
  const d: PkShopModel = { title: 'Poké Mart', crumb: ['Viridian'], clock: 'Day 3', money: 4820, goods, index: 1, buy: [{ label: 'Buy 1', act: 'buy1', on: true }, { label: 'Buy 5', act: 'buy5', on: false }], extras: ['Sell'], basket: null, pocket: 'Medicine', text: 'Heals 20 HP.', keeper: null, nextStock: null, ask: null };
  it('shows two shelves of four, paging on to keep the lit good in sight', () => {
    const html = pkShop(d);
    expect(pkPageOf(html)?.id).toBe('shop');
    expect(html.match(/class="si[ "]/g)?.length).toBe(8);
    expect(html).toContain('data-key="shop-g-0"');
    expect(html).not.toContain('data-key="shop-g-8"');
    const late = pkShop({ ...d, index: 11 });
    expect(late).toContain('data-key="shop-g-11"');
    expect(late).not.toContain('data-key="shop-g-0"');
    expect(late).toContain('5–12 of 12');
  });
  it('a good shows its tag, the old price struck, what you have, and the Buy buttons of the lit one', () => {
    const html = pkShop(d);
    expect(html).toContain('<u class="gx-si-tag">on sale!</u>');
    expect(html).toContain('<s>₽ 200</s> ₽ 150');
    expect(html).toContain('You have 3');
    expect(html).toContain('In your Bag: 3 · Medicine');
    expect(html).toContain('class="btn sm on"');
    expect(html).toContain('Heals 20 HP.');
  });
  it('a shop with a basket counts what is in it, totals it and checks out on C', () => {
    const html = pkShop({ ...d, goods: d.goods.map((g, k) => (k === 1 ? { ...g, inBasket: 2 } : g)), buy: [], extras: ['Sell', 'Checkout (2)', 'Empty basket'], basket: [{ name: 'Good 1', count: 2, total: 300, art: null, saving: 100 }] });
    expect(html).toContain('<span class="qty"><kbd>×</kbd><b>2</b></span>');
    expect(html).toContain('Good 1 ×2');
    expect(html).toContain('Total ₽ 300');
    expect(html).toContain('<kbd>C</kbd> Check out');
    expect(html).toContain('data-act="pick" data-arg="13"');
    expect(pkShop({ ...d, basket: [] })).toContain('Nothing yet');
  });
  it('Check Out shows the receipt, the money after paying, and Pay or Keep shopping', () => {
    const lines = Array.from({ length: 7 }, (_, k) => ({ name: `Good ${k}`, count: 1, total: 1000, art: null, saving: k === 0 ? 50 : 0 }));
    const html = pkShopPay({ ...d, basket: lines, ask: { title: 'That comes to ₽ 7,000.', options: ['Pay ₽ 7,000', 'Keep shopping'], index: 0 } });
    expect(pkPageOf(html)?.id).toBe('shop-pay');
    expect(html).toContain('…and 2 more');
    expect(html).toContain('−₽ 50');
    expect(html).toContain('<b class="gx-bad">₽ -2,180</b>');
    expect(html).toContain('That comes to ₽ 7,000.');
    expect(html.match(/data-act="confirm"/g)?.length).toBeGreaterThanOrEqual(2);
    const ok = pkShopPay({ ...d, basket: lines.slice(0, 1), ask: { title: 'Pay?', options: ['Pay', 'Keep shopping'], index: 0 } });
    expect(ok).toContain('<b class="new">₽ 3,820</b>');
  });
});

describe('Pocket look: Pick a Reward', () => {
  const card = (name: string, rarity: string, category: string, notes: string[] = []) => ({ name, kind: rarity, text: `${name} does a thing.`, art: null, notes, rarity, category });
  const d: RewardModel = { title: 'Choose a reward', cards: [card('Protein', 'uncommon', 'stat-buff', ['Now 12 → After 13']), card('Nugget', 'common', 'currency'), card('Revive', 'rare', 'healing')], index: 1, party: [], buttons: ['Party', 'Bag', 'Re-roll ×2'], text: '', result: null, notice: '' };
  it('names rarity in stars and the category in the mock-up\'s words', () => {
    expect(rarityOf('rare')).toEqual([3, 'Rare']);
    expect(rarityOf('uncommon')).toEqual([2, 'Uncommon']);
    expect(rarityOf(undefined)).toEqual([1, 'Common']);
    expect(categoryWord('attribute')).toBe('Held item');
    expect(categoryWord('stat-buff')).toBe('Vitamin');
    expect(categoryWord('mystery-thing')).toBe('Mystery thing');
  });
  it('stands the cards in a row with the lit one lifted, and asks to take it', () => {
    const html = pkReward(d);
    expect(pkPageOf(html)?.id).toBe('reward');
    expect(html.match(/class="rw r/g)?.length).toBe(3);
    expect(html).toContain('class="rw r1 on"');
    expect(html).toContain('class="rw r3"');
    expect(html).toContain('Take one. The other two are gone.');
    expect(html).toContain('Take the <b>Nugget</b>?');
    expect(html).toContain('Now 12 → After 13');
    expect(html).toContain('data-act="pick" data-arg="5"');
    expect(html).toContain('gx-rw-top');
    expect(html).toContain('data-act="take"');
  });
  it('a pick mode says what to do; the result waits in the bar for Enter; many cards share the row', () => {
    expect(pkReward({ ...d, notice: 'Choose the card to swap.' })).toContain('<p style="font-size:18px">Choose the card to swap.</p>');
    const done = pkReward({ ...d, result: ['You received ₽126.', ''] });
    expect(done).toContain('gx-rw-picked');
    expect(done).toContain('You received ₽126.');
    expect(done).toContain('data-act="done"');
    expect(done).not.toContain('data-act="take"');
    const many = pkReward({ ...d, cards: [...d.cards, card('Ether ×2', 'common', 'consumable'), card('Potion', 'common', 'healing')], index: 7 });
    expect(many).toContain('rw-row gx-many');
    expect(many).toContain('repeat(5,1fr)');
    expect(many).toContain('The other four are gone.');
    expect(many).not.toContain(' on" data-key="rw-');
  });
});

describe('Pocket look: the Pokémon Center', () => {
  const mon = (name: string, from: number, hp: string) => ({ file: null, name, from, hp });
  it('says what the heal did for each Pokémon', () => {
    expect(healNote(0, 104, 104)).toBe('Revived');
    expect(healNote(98, 124, 124)).toBe('+26 HP');
    expect(healNote(81, 81, 81)).toBe('Full');
    expect(healNote(50, 50, 81)).toBe('');
  });
  it('Nurse Joy, the machine with six slots, and each HP bar filling from where it was', () => {
    const party = [mon('Charizard', 79, '124/124'), mon('Pikachu', 100, '81/81'), mon('Lucario', 0, '104/104')];
    const html = pkCenter({ title: 'Healing spot', small: '', text: 'Your Pokémon are fighting fit.', party, clock: 'Day 3 · Evening', notes: ['+26 HP', 'Full', 'Revived'] });
    expect(pkPageOf(html)?.id).toBe('center');
    expect(html).toContain('Nurse Joy');
    expect(html).toContain('&quot;Your Pokémon are fighting fit.&quot;');
    expect(html.match(/class="wm17"/g)?.length).toBe(1);
    expect(html.match(/<u style="--i:/g)?.length).toBe(3);
    expect(html.match(/gx-pc-empty/g)?.length).toBe(3);
    expect(html).toContain('style="--from:79%"');
    expect(html).toContain('<em class="full">Full</em>');
    expect(html).toContain('Revived');
    expect(html).toContain('gx-pc-few');
    expect(html).toContain('Day 3 · Evening');
    expect(html).toContain('data-act="heal"');
  });
});

describe('Pocket look: Party and Summary', () => {
  const mon = (name: string, o: Partial<PartyCard> = {}): PartyCard => ({ name, file: null, level: 36, hp: 98, maxHp: 124, held: 'Charizardite X', tag: '', types: ['fire', 'flying'], ability: 'Blaze', nature: 'Timid', moves: [{ name: 'Flamethrower', type: 'fire', pp: '12/15' }, { name: 'Roost', type: 'flying', pp: '5/5' }], off: false, hearts: 4, xpPct: 62, xpText: '1,240 to Lv 37', status: '', heldId: 'charizardite-x', ...o });
  const party = [mon('Charizard', { tag: 'LEAD' }), mon('Gengar', { types: ['ghost', 'poison'], status: 'PSN' }), mon('Lucario', { hp: 0 })];
  it('the team is a hand of cards; the lit one shows its moves and PP; a fainted one is greyed', () => {
    const html = pkParty({ title: 'Party', mons: party, index: 0, text: 'Pick one.', hints: [['Enter', 'summary']], money: 4820, gym: { when: 'Gym in 3 stops', who: 'Misty · Water', file: null, rows: [{ file: null, word: 'Weak', cls: 'dn' }] } });
    expect(pkPageOf(html)?.id).toBe('party');
    expect(html.match(/class="pkc[ "]/g)?.length).toBe(3);
    expect(html).toContain('class="pkc on"');
    expect(html).toContain('class="pkc fnt"');
    expect(html).toContain('<u class="kc-lead">Lead</u>');
    expect(html).toContain('<u class="kc-st">PSN</u>');
    expect(html).toContain('<u class="kc-st">FNT</u>');
    expect(html).toContain('1,240 to Lv 37');
    expect(html).toContain('Flamethrower<em>12/15</em>');
    expect(html).toContain('<b>Gym in 3 stops</b><span>Misty · Water</span>');
    expect(html).toContain('₽ 4,820');
    expect(html).not.toContain('pk-rot gx-show');
  });
  it('without a Gym strip (a pick) Rotom says what the page is for; an empty party says so', () => {
    expect(pkParty({ title: 'Give it to', mons: party, index: 1, text: 'Choose who holds it.', hints: [], gym: null })).toContain('pk-rot gx-show');
    expect(pkParty({ title: 'Party', mons: [], index: 0, text: 'No Pokémon.', hints: [] })).toContain('No Pokémon.');
  });
  it('the stats radar goes round the six stats and marks what the nature raises and lowers', () => {
    const rows = ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'].map((label, k) => ({ label, value: 50 + k, pct: k * 20, up: k === 5, down: k === 1 }));
    const html = radar(rows);
    expect(html).toContain('class="rv"');
    expect(html).toContain('class="up ">Speed<b>55</b>');
    expect(html).toContain('class="dn rt">Attack<b>51</b>');
    expect(html.indexOf('Speed')).toBeLessThan(html.indexOf('Sp. Def'));
  });
  it('the Summary has the card, every tab, and each tab drawn in the mock-up\'s pieces', () => {
    const base: SummaryModel = { title: 'Summary', hints: [['←→', 'page']], face: { name: 'Charizard', file: null, art: null, level: 36, gender: '', types: ['fire', 'flying'], no: 'No. 006', held: 'Holding 1 item', hpPct: 79, xpPct: 62 }, tabs: ['Overview', 'Stats', 'Moves', 'Items', 'Bond', 'History', 'Traits'], tab: 2, itemsTab: 3, text: '', menu: null, card: party[0], count: '1 of 6',
      body: { kind: 'moves', moves: [{ name: 'Flamethrower', type: 'fire', pp: '12/15' }, { name: 'Roost', type: 'flying', pp: '5/5' }], cursor: 0, facts: [['Type / Category', 'Fire · Special'], ['Power / Accuracy', '90 / 100']], lines: ['• May burn.'] },
      extra: { name: 'Charizard', types: ['fire', 'flying'], nature: ['Timid', '+Speed, −Attack'], ability: ['Blaze', 'Fire moves get stronger.'], held: ['Charizardite X', 'Mega Evolves.', 'charizardite-x'], weak: ['rock', 'water', 'electric'], moveKinds: ['Special', 'Status'], moveText: 'Scorches the target.', bond: { hearts: 5, mood: 'Best friends', hint: 'Fired up.' } } };
    const moves = pkSummary(base);
    expect(pkPageOf(moves)?.id).toBe('summary');
    expect(moves.match(/class="tab[ "]/g)?.length).toBe(7);
    expect(moves).toContain('class="tab on" data-act="tab" data-arg="2"');
    expect(moves).toContain('data-key="sm-card"');
    expect(moves).toContain('class="mr on"');
    expect(moves).toContain('<b>90</b>Power');
    expect(moves).toContain('Same type as Charizard: 1.5× power');
    expect(moves).toContain('Scorches the target. May burn.');
    const stats = pkSummary({ ...base, tab: 1, body: { kind: 'stats', rows: ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'].map((label) => ({ label, value: 80, pct: 50, iv: '31', ev: 0, up: false, perfect: true, delta: '' })), foot: 'EV 0/510', versus: '' } });
    expect(stats).toContain('Weak to');
    expect(stats).toContain('Charizardite X');
    expect(stats).toContain('IV 31 / 31');
    const bond = pkSummary({ ...base, tab: 4, body: { kind: 'text', head: 'Best friends', bars: [{ label: 'Trust', value: 40 }], sections: [{ title: 'Mood', lines: ['Fired up.'] }] } });
    expect(bond).toContain('class="bd-big"');
    expect(bond).toContain('Trust');
    const menu = pkSummary({ ...base, menu: { options: [{ label: 'Make lead', off: false }, { label: 'Review items', off: true }], index: 0 } });
    expect(menu).toContain('gx-sm-menu');
    expect(menu).toContain('gx-dim');
  });
});

describe('Pocket look: the Bag', () => {
  const items = Array.from({ length: 12 }, (_, k) => ({ label: `Item ${k}`, tag: `×${k + 1} · COMMON`, note: k === 0 ? 'Not held · Raises Speed.' : 'Restores 20 HP.', art: null, off: k === 1 }));
  const d = { title: 'Bag', hints: [['Enter', 'choose']] as const, pockets: { labels: ['All', 'Medicine', 'Poké Balls', 'Key items'], index: 1 }, n: 12, item: (i: number) => items[i]!, index: 0, strip: '', text: 'Item 0: Raises Speed. Only in battle.', money: 4820, party: [{ name: 'Pikachu', file: null, hp: 100, level: 5, fainted: false }], notes: ['Can use'] };
  it('pockets get an icon by their name', () => {
    expect(pocketIcon('Poké Balls').file).toBe('pokeball/pb.png');
    expect(pocketIcon('Medicine').file).toBe('items/potion.png');
    expect(pocketIcon('Key items').file).toBe('items/map.png');
    expect(pocketIcon('Odd things').file).toBe('items/amulet_coin.png');
  });
  it('shows the pockets, nine items at a time with counts, and the lit item\'s card and button', () => {
    const html = pkBag(d);
    expect(pkPageOf(html)?.id).toBe('bag');
    expect(html.match(/class="pocket[ "]/g)?.length).toBe(4);
    expect(html).toContain('class="pocket on"');
    expect(html.match(/class="it12 pn/g)?.length).toBe(9);
    expect(html).toContain('<em>×1</em>');
    expect(html).toContain('You have 1 · COMMON');
    expect(html).toContain('<b>Give</b>');
    expect(html).toContain('Only in battle.');
    expect(html).toContain('₽ 4,820');
    expect(html).toContain('1–9 of 12');
    expect(html).toContain('class="ok"');
    const late = pkBag({ ...d, index: 11 });
    expect(late).toContain('data-key="bag-i-11"');
    expect(late).not.toContain('data-key="bag-i-0"');
  });
  it('an empty pocket says so', () => {
    expect(pkBag({ ...d, n: 0, text: 'Nothing here yet.' })).toContain('Nothing here yet');
  });
});

describe('Pocket look: the Pokédex', () => {
  const card = { state: 'caught' as const, no: 'No. 0006', name: 'Charizard', types: ['fire', 'flying'], facts: [['Height', '1.7 m'], ['Weight', '90.5 kg'], ['Caught', '1'], ['Battles', '4']] as [string, string][], note: 'Caught. Research level 2 of 8.', stats: [{ label: 'HP', value: 78 }, { label: 'Spe', value: 100 }], line: [{ id: 'charmander', here: false, met: true }, { id: 'charmeleon', here: false, met: false }, { id: 'charizard', here: true, met: true }], next: 'Final form' };
  const data = { state: 'caught' as const, title: 'No. 0006  Charizard', facts: ['Egg groups: monster, dragon', 'Catch rate: 45'], evolutions: [], moves: ['Lv  1  Scratch     Lv  4  Ember', 'Lv 17  Fire Fang'] };
  const d: DexModel = { card, data, page: 0, art: 'pokemon/6', line: ['pokemon/4', null, 'pokemon/6'] };
  it('the species page shows the number, name, types, size, the line with a shadow, and the base stats', () => {
    const html = pkDex(d);
    expect(pkPageOf(html)?.id).toBe('dex-entry');
    expect(html).toContain('#006');
    expect(html).toContain('No. 0006 · Caught');
    expect(html).toContain('1.7 m · 90.5 kg');
    expect(html).toContain('Battles <b>4</b>');
    expect(html).toContain('gx-sil');
    expect(html).toContain('Final form');
    expect(html).toContain('Base stats');
    expect(html).toContain('width:63%');
  });
  it('the data page swaps in the facts and the level-up moves, one each', () => {
    const html = pkDex({ ...d, page: 1 });
    expect(html).toContain('<em>Catch rate</em><span>45</span>');
    expect(html.match(/<span>Lv/g)?.length).toBe(3);
    expect(html).toContain('<span>Lv 4 Ember</span>');
    expect(html).not.toContain('Base stats');
  });
  it('an unknown species is a question mark with no panels', () => {
    const html = pkDex({ ...d, art: null, card: { ...card, state: 'unknown', name: '???', types: [], facts: [], stats: [], line: [], next: '' } });
    expect(html).toContain('gx-de-q');
    expect(html).not.toContain('dex-stats');
  });
  it('the moves get smaller as the list grows, within bounds', () => {
    expect(movesSize(['Lv 1 Tackle'])).toBe(12);
    expect(movesSize(Array.from({ length: 30 }, () => 'Lv 100 Draco Meteor'))).toBe(8);
  });
  const cells: PkDexCell[] = Array.from({ length: 50 }, (_, i) => {
    const no = `No. ${String(i + 1).padStart(4, '0')}`;
    if (i % 5 === 2) return { file: i === 7 ? 'pokemon/8' : null, title: no, body: 'Not met yet.', off: true, sil: i === 7 };
    return { file: `pokemon/${i + 1}`, title: `Mon ${i + 1}`, body: `${no} · Seen 3 · Caught ${i % 2}`, got: i % 2 === 1 };
  });
  const w = { title: 'Generation 1 Pokédex', n: 50, index: 5, cell: (i: number) => cells[i], hint: 'Mon 6: fire / flying. Enter opens its page.', tabs: { labels: ['All', 'Seen', 'Owned', 'Mastered'], index: 0 }, back: true };
  it('reads the number off a square', () => {
    expect(dexNo('No. 0006 · Seen 1')).toBe('#006');
    expect(dexNo('No. 1025')).toBe('#1025');
    expect(dexNo('Charizard')).toBe('');
  });
  it('the wall is forty squares, caught ones with a ball, unknown ones a question mark, and the lit one\'s bar', () => {
    const html = pkDexWall(w);
    expect(pkPageOf(html)?.id).toBe('dex');
    expect(html.match(/class="dx /g)?.length).toBe(40);
    expect(html).toContain('class="dx got on"');
    expect(html).toContain('dx unk gx-dx-sil');
    expect(html).toContain('<b>?</b>');
    expect(html).toContain('Seen 40');
    expect(html).toContain('Caught 20');
    expect(html).toContain('1–40 of 50');
    expect(html).toContain('Gen 1');
    expect(html).toContain('#006 Mon 6');
    expect(html).toContain('Flying');
    expect(html.match(/class="dx-tabs"/g)?.length).toBe(1);
    const late = pkDexWall({ ...w, index: 49 });
    expect(late).toContain('data-key="dex-c-49"');
    expect(late).not.toContain('data-key="dex-c-0"');
  });
  it('an unknown lit square says how to find it', () => {
    expect(pkDexWall({ ...w, index: 2 })).toContain('#003 ???');
  });
});

describe('Pocket look: the Trainer Card', () => {
  const d = { title: 'Trainer Card', name: 'Red', rank: 'Rank 4', facts: [['Title', 'Ace'], ['Pokémon caught', '96'], ['Runs', '12'], ['Best run', '40 encounters'], ['Battles won', '210'], ['★', 'First Gym']] as const, trainer: { file: 'trainer/red', atlas: true }, badges: 3, team: [], text: 'Frame: Classic.', hints: [['Esc', 'back']] as const, area: 'hub' as const, save: false, id: '04821' };
  it('the rank tag becomes a fact, any other tag the outcome', () => {
    expect(rankFact('Rank 4')).toEqual(['Rank', '4']);
    expect(rankFact('Loss')).toEqual(['Outcome', 'Loss']);
  });
  it('shows the ID, six facts on the card, the rest in the side panel, and the badges won lit', () => {
    const html = pkCard(d);
    expect(pkPageOf(html)?.id).toBe('tcard');
    expect(html).toContain('ID No. 04821');
    expect(html.match(/<p><span>/g)?.length).toBe(8);
    expect(html.match(/class="got"/g)?.length).toBe(3);
    expect(html.match(/<i class="(got)?"><span class="gx-fit"/g)?.length).toBe(CARD_BADGES.length);
    expect(html).toContain('<b>Record</b>');
    expect(html).toContain('First Gym');
    expect(html).not.toContain('Save as picture');
    expect(html).not.toContain('data-act="save"');
  });
  it('the run card saves as a picture from its button and the card, and lists the team', () => {
    const html = pkCard({ ...d, title: 'Run card', rank: 'Win', area: undefined, save: true, id: undefined, team: ['pokemon/25', null], hints: [['Enter', 'save'], ['Esc', 'back']] });
    expect(html).toContain('Save as picture');
    expect(html).toContain('<b>This run</b>');
    expect(html).toContain('Outcome');
    expect(html).not.toContain('ID No.');
    expect(html.match(/data-act="save"/g)!.length).toBeGreaterThanOrEqual(2);
  });
  it('more than eight badges still lights eight', () => {
    expect(pkCard({ ...d, badges: 12 }).match(/class="got"/g)?.length).toBe(8);
  });
});

describe('Pocket look: the Type Chart', () => {
  const chart = { normal: { rock: 0.5, steel: 0.5, ghost: 0 }, fighting: { normal: 2 }, ghost: { normal: 0 }, fire: { grass: 2, water: 0.5 }, water: { fire: 2 } } as never;
  it('a type\'s rows: what it hits hard and weakly, what cannot be hit, and what hits it', () => {
    const rows = Object.fromEntries(typeRows(chart, PK_TYPE_ORDER, 'normal'));
    expect(rows['Hits hard']).toEqual([]);
    expect(rows['Weak hit on']).toEqual(['rock', 'steel']);
    expect(rows['No effect on']).toEqual(['ghost']);
    expect(rows['Takes double from']).toEqual(['fighting']);
    expect(rows['Can\u2019t be hit by']).toEqual(['ghost']);
    expect(rows['Shrugs off']).toBeUndefined();
  });
  it('eighteen tiles six across, the lit type\'s card, and the pause menu\'s clicks in book mode', () => {
    const html = pkTypes({ types: PK_TYPE_ORDER, index: 1, chart });
    expect(pkPageOf(html)?.id).toBe('types');
    expect(html.match(/class="tc[ "]/g)?.length).toBe(18);
    expect(html).toContain('class="tc on"');
    expect(html).toContain('<b>Fire</b></div>');
    expect(html).toContain('Hits hard');
    expect(pkTypes({ types: PK_TYPE_ORDER, index: 0, chart })).toContain('Nothing');
    expect(pkTypes({ types: PK_TYPE_ORDER, index: 1, chart, book: true })).toContain('data-act="dexType"');
  });
});

describe('Pocket look: the Journal', () => {
  const rows = Array.from({ length: 10 }, (_, k) => ({ title: k === 9 ? 'Act I: Arrival in Kanto. This region belongs to its rivals; expect old faces and fierce rematches.' : `Entry ${k}`, sub: `Region 1 · Stage ${k}`, tag: k === 0 ? 'Rival' : 'Memory', pct: k === 1 ? 40 : null }));
  const d = { title: 'Story Journal', area: 'story' as const, rows, index: 9, text: 'Open quests and story threads for this run.' };
  it('a long entry splits into a short title and the rest', () => {
    expect(splitEntry('Act I: Arrival in Kanto. This region belongs to its rivals; expect old faces.')).toEqual(['Act I: Arrival in Kanto', 'This region belongs to its rivals; expect old faces.']);
    expect(splitEntry('Beat Bug Catcher Rick')).toEqual(['Beat Bug Catcher Rick', '']);
  });
  it('icons follow the tag', () => {
    expect(journalIcon('Rival').file).toBe('items/master_ribbon.png');
    expect(journalIcon(undefined).file).toBe('items/map.png');
  });
  it('seven numbered entries, the lit one read out without the stand-in line', () => {
    const html = pkJournal(d);
    expect(pkPageOf(html)?.id).toBe('journal');
    expect(html.match(/class="jr[ "]/g)?.length).toBe(7);
    expect(html).toContain('data-key="jr-9"');
    expect(html).not.toContain('data-key="jr-0"');
    expect(html).toContain('<em>10</em>');
    expect(html).toContain('Entry 10 · Memory');
    expect(html).toContain('expect old faces and fierce rematches.');
    expect(html).not.toContain('Open quests and story threads');
    expect(html).toContain('10 entries');
  });
  it('a thread with steps shows how far it has come; an empty journal is a blank page', () => {
    expect(pkJournal({ ...d, index: 1 })).toContain('width:40%');
    expect(pkJournal({ ...d, rows: [], index: 0, text: '' })).toContain('A blank page');
  });
});

describe('Pocket Hub Town street', () => {
  const doors = ['Settings', 'Trainers', 'New Run', 'Events', 'Unlocks', 'Town'].map((label) => ({ label, count: label === 'Events' ? 2 : 0 }));
  const d: PkHubModel = {
    money: '₽ 4,820', rank: 'Rank 4', tabs: ['Town', 'Last run'], tab: 0, doors, index: 2,
    hero: { art: null, name: 'Red', tag: 'Rank 4 · ID 04821', where: 'Kanto · Stop 12 of 30' },
    gate: { line: '30 stops a stage · 8 Gyms', road: null, stops: 30 }, walkers: [{ sheet: 'PIKACHU', ko: false }, { sheet: 'GENGAR', ko: true }], notices: 4, say: '',
  };
  it('a street of buildings over a row of doors; the lit door lights its building', () => {
    const html = pkHub(d);
    expect(pkPageOf(html)?.id).toBe('hub');
    expect(html.match(/class="door[ "]/g)?.length).toBe(6);
    expect(html).toMatch(/class="door on"[^>]*data-key="hub-d-2"/);
    expect(html.match(/class="bld /g)?.length).toBe(5);
    expect(html).toMatch(/class="bld  on"[^>]*data-key="hub-b-arch"/);
    expect(html).toContain('Fresh journey');
    expect(html).toContain('<u>2</u>');
    expect(html).toContain('Kanto · Stop 12 of 30');
    expect(html).toContain('30 stops a stage · 8 Gyms');
    expect(html.match(/<u class=/g)?.length).toBe(30);
    expect(html.match(/class="wk /g)?.length).toBe(2 + 2);
    expect(html).toContain('wk ko');
    expect(html).toContain('Notice board</b><u>4</u>');
  });
  it('the Last run tab keeps the street but lights no building; the town can speak', () => {
    const html = pkHub({ ...d, tab: 1, doors: [{ label: 'Hall of Fame' }, { label: 'Seeds' }], index: 0, say: 'Blue is waiting at the gate.', hero: { ...d.hero, where: '' } });
    expect(html).not.toMatch(/class="bld [^"]*on"/);
    expect(html).toContain('Past champions');
    expect(html).toContain('Blue is waiting at the gate.');
    expect(html).toContain('Trainer Card');
    expect(html).toMatch(/<kbd>↓<\/kbd>Town/);
  });
  it('each door has its small line; an unknown one has none', () => {
    expect(doorSub('Seeds')).toBe('Play a seed again');
    expect(doorSub('Nowhere')).toBe('');
  });
});

describe('Pocket Town', () => {
  it('a place is drawn by the building at its door; a door with none near has no picture', () => {
    expect(placeProp(POCKET_TOWN, { x: 14, y: 11 })).toBe('dojo');
    expect(placeProp({ tile: 32, props: [['pine', 400, 200, 384]] }, { x: 14, y: 11 })).toBeNull();
    expect(placeProp({ tile: 32, props: [] }, { x: 1, y: 1 })).toBeNull();
    expect(districtProp('play')).toBe('parasol');
    expect(districtProp('nowhere')).toBe('house_b');
  });
  it('the street is a see-through header with the time and district, the line for what you face, and the keys', () => {
    const html = pkTownHud({ time: 'Evening', district: 'Training Grounds', prompt: { verb: 'Enter', name: 'Training Dojo', text: 'Spar with a dummy.' } });
    expect(pkPageOf(html)).toEqual({ id: 'pt-town', tier: 51, hud: true });
    expect(html).toContain('Evening');
    expect(html).toContain('Training Grounds');
    expect(html).toContain('Training Dojo');
    expect(html).toContain('<kbd>Z</kbd>enter');
    const none = pkTownHud({ time: 'Night', district: '', prompt: null });
    expect(none).not.toContain('zp39');
  });
  it('the Town Map is a card per district, the one you stand in marked', () => {
    const districts = POCKET_TOWN.districts.map((d) => ({ id: d.id, name: d.name, text: d.blurb, color: d.color }));
    const html = pkTownMap({ districts, index: 2, here: 0 });
    expect(pkPageOf(html)?.id).toBe('pt-map');
    expect(html.match(/data-act="mapPick"/g)?.length).toBe(districts.length + 1);
    expect(html).toMatch(/class="pn on"[^>]*data-key="pt-d-home"/);
    expect(html.match(/You are here/g)?.length).toBe(1);
    expect(html).toContain(`${districts.length} districts`);
  });
  it('a door asks first; a shut one says why', () => {
    const open = pkTownDoor({ district: 'Training Grounds', name: 'Training Dojo', text: 'Spar.', prop: 'dojo', shut: null });
    expect(pkPageOf(open)?.id).toBe('pt-door');
    expect(open).toContain('Nothing here changes your run.');
    expect(open).toContain('data-act="doorGo"');
    expect(open).toContain('Keep walking');
    const shut = pkTownDoor({ district: '', name: 'Time Machine', text: 'Old runs.', prop: null, shut: 'Finish a run first.' });
    expect(shut).toContain('Finish a run first.');
    expect(shut).toContain('Pocket Town');
  });
  it('the Trainer Plaza is six district cards; a shut one dims and Esc leaves for the map', () => {
    const districts = ['market', 'trading', 'gathering', 'social', 'services', 'secret'].map((id, i) => ({ id, name: id, text: `${id} line`, count: i, off: id === 'secret' }));
    const html = pkPlaza({ pills: ['₽ 500', 'Stranger (0)'], road: { n: 30, at: 11, gyms: [29] }, districts, index: 4, say: 'Welcome back.' });
    expect(pkPageOf(html)?.id).toBe('pt-plaza');
    expect(html.match(/class="pn rw39/g)?.length).toBe(6);
    expect(html).toMatch(/class="pn rw39 on"[^>]*data-key="pz-services"/);
    expect(html).toMatch(/gx-pz-off"[^>]*data-key="pz-secret"/);
    expect(html).toContain('<u class="gx-pz-n">4</u>');
    expect(html).not.toContain('<u class="gx-pz-n">0</u>');
    expect(html).toContain('Welcome back.');
    expect(html).toContain('data-act="pick" data-arg="6"');
    expect(html.match(/<u class="(past|on|)( gym| lg)*"><\/u>/g)?.length).toBe(30);
    expect(plazaProp('services')).toBe('pc');
  });
});

describe('Pocket run start: Starter Pick and Briefing', () => {
  const picks = [
    { name: 'Froakie', file: null, types: ['water'], stats: '', moves: 'Lv 5: Pound', gen: 6 },
    { name: 'Magby', file: null, types: ['fire'], stats: '', moves: 'Lv 5: Ember', gen: 2 },
    { name: 'Gastly', file: null, types: ['ghost', 'poison'], stats: '', moves: 'Lv 5: Lick', gen: 1 },
  ];
  it('three cards with each home region stamped, the lit one read out; the steps show Starter', () => {
    const html = pkStarter({ title: 'Starter Select', picks, on: 1, sub: '' });
    expect(pkPageOf(html)?.id).toBe('starter');
    expect(html.match(/class="spc[ "]/g)?.length).toBe(3);
    expect(html).toMatch(/class="spc on"[^>]*data-key="sp-1"/);
    expect(html).toContain('Kalos');
    expect(html).toContain('Region 6');
    expect(html).toContain('Magby, the Fire Pokémon. Lv 5: Ember. Will you take this one?');
    expect(html).toContain('<i class="on"><b>2</b>Starter</i>');
    expect(html.match(/class="ty"/g)?.length).toBe(4);
  });
  it('a Blind Draft hides names, types and regions', () => {
    const html = pkStarter({ title: 'Starter Select', picks, on: 0, sub: '', blind: true });
    expect(html).not.toContain('Froakie');
    expect(html).not.toContain('Kalos');
    expect(html.match(/\?\?\?/g)?.length).toBeGreaterThanOrEqual(3);
    expect(html).toContain('gx-sp-sil');
  });
  it('regions by generation, the steps and the Gym line', () => {
    expect(regionOfGen(3)?.name).toBe('Hoenn');
    expect(regionOfGen(undefined)).toBeNull();
    expect(regionOfGen(99)).toBeNull();
    expect(runSteps(0)).toContain('<i class="on"><b>1</b>Trainer</i>');
    expect(leaderLine(['rock'], ['water', 'grass', 'fighting'])).toBe('Rock type. Water and Grass moves hit hard.');
    expect(leaderLine([], [])).toBe('');
  });
  it('the Briefing shows the region map, stops, cap and first Gym, then Set off or Copy seed', () => {
    const d: BriefModel = { title: 'Campaign Briefing', campaign: 'Full', regions: ['Kanto'], facts: [], nodes: [], stage: '', notes: [], seed: 'abc', party: [], index: 0, text: 'Check the plan, then depart.' };
    const x = { region: 'Kanto', regionNo: 1, stops: 30, cap: 13, leader: { name: 'Brock', art: null, types: ['rock'], weak: ['water', 'grass'] } };
    const html = pkBrief(d, x);
    expect(pkPageOf(html)?.id).toBe('pd-brief');
    expect(html).toContain('region1.png');
    expect(html).toContain('<u>30</u><b>stops</b>');
    expect(html).toContain('<u>13</u><b>level cap</b>');
    expect(html).toContain('First Gym: Brock');
    expect(html).toContain('Seed abc');
    expect(html).toMatch(/class="btn on"[^>]*data-act="go"/);
    expect(html).not.toContain('gx-bf-note');
    const copy = pkBrief({ ...d, index: 1, text: 'Seed copied.' }, { ...x, region: 'Paldea', leader: null });
    expect(copy).toContain('region0.png');
    expect(copy).not.toContain('First Gym');
    expect(copy).toContain('Seed copied.');
    expect(copy).toContain('<kbd>Enter</kbd>copy seed');
  });
});

describe('Pocket look: the Trade Post', () => {
  const mon = (name: string, level: number, types: string[]) => ({ name, level, types, file: null }) as unknown as TradeModel['give'];
  const d = (over: Partial<TradeModel> = {}): TradeModel => ({
    title: 'Trade Post', money: 5000, you: null, trader: 'Spark Trader', traderArt: null,
    give: mon('Snorlax', 35, ['normal']), get: mon('Lucario', 35, ['fighting', 'steel']),
    verdict: 'A fair swap.', bad: false, cost: 0, at: 0, count: 3, focus: 0, line: 'Same level, no strings.', done: null, ...over,
  });
  it('draws both sides, the arrows, the trader’s line and Trade lit', () => {
    const html = pkTrade(d());
    expect(pkPageOf(html)?.id).toBe('pt-trade');
    expect(html).toContain('You give');
    expect(html).toContain('Lucario');
    expect(html).toContain('Lv 35 · Fighting / Steel');
    expect(html).toContain('Offer 1 of 3');
    expect(html).toContain('"Same level, no strings."');
    expect(html).toMatch(/class="btn on gx-tr-f"[^>]*data-act="accept"/);
    expect(html).toContain('next offer');
  });
  it('a trade you can’t make dims Trade and says why; no trader wants nothing', () => {
    const html = pkTrade(d({ give: null, bad: true, verdict: 'Needs a Normal-type in your party', focus: 1, count: 1 }));
    expect(html).toContain('Nothing they want');
    expect(html).toContain('gx-tr-off');
    expect(html).toMatch(/gx-tr-why bad/);
    expect(html).toMatch(/btn sm gx-tr-f/);
    expect(html).not.toContain('next offer');
    expect(html).not.toContain('Offer 1 of 1');
  });
  it('after a swap the labels turn past tense and only OK is left', () => {
    const html = pkTrade(d({ done: 'Lucario joined your party!' }));
    expect(html).toContain('You gave');
    expect(html).toContain('You got');
    expect(html).toContain('Lucario joined your party!');
    expect(html).toContain('data-act="done"');
    expect(html).not.toContain('data-act="accept"');
  });
});

describe('Pocket look: Memories and the Legacy Gallery', () => {
  const shelves = ['chronicle', 'journal', 'hall', 'lane', 'fallen', 'replays', 'heirlooms', 'lost'].map((id, i) => ({ id, label: `Shelf ${id}`, count: `${i} things` }));
  it('the shelf is a card per memory, four across for eight, the lit one opens', () => {
    const html = pkMemories({ shelves, index: 4 });
    expect(pkPageOf(html)?.id).toBe('pt-memories');
    expect(html).toContain('gr39 q4 ph39');
    expect(html.split('data-act="pick"').length - 1).toBe(9); // eight cards and the Enter key
    expect(html).toMatch(/class="pn on" data-key="mem-fallen"/);
    expect(html).toContain('Read only');
    expect(html).toContain('back to the Hub');
    expect(pkMemories({ shelves: shelves.slice(0, 6), index: 99 })).toContain('gr39 q3 ph39');
    expect(shelfMon('journal')).toBe(6);
    expect(shelfMon('nope')).toBe(133);
  });
  const run = (over: Partial<PkGalleryModel> = {}): PkGalleryModel => ({
    at: 8, count: 12, tag: 'Champion · Kanto to Hoenn', name: 'Blue', art: null, colour: '#2f6fc8',
    team: [{ file: null, ace: true, shiny: false }, { file: null, ace: false, shiny: true }], ace: 'Blastoise, Lv 212', ended: 'Beat the Hoenn Champion', moments: 3, ...over,
  });
  it('the gallery shows one Trainer: tag, team with the Ace lit, how it ended, Relive and Whole team', () => {
    const html = pkGallery(run());
    expect(pkPageOf(html)?.id).toBe('pt-gallery');
    expect(html).toContain('Run 9 of 12');
    expect(html).toContain('Champion · Kanto to Hoenn');
    expect(html).toContain('<i class="ace">');
    expect(html).toContain('gx-lg-shiny');
    expect(html).toContain('Blastoise, Lv 212');
    expect(html).toContain('data-act="relive"');
    expect(html).toContain('another run');
    expect(html).not.toContain('gx-tr-off');
  });
  it('one run has no "another run" key; no moments dims Relive; reliving draws the moment over the page', () => {
    expect(pkGallery(run({ count: 1, at: 0 }))).not.toContain('another run');
    expect(pkGallery(run({ moments: 0 }))).toContain('gx-tr-off');
    const html = pkGallery(run({ relive: { label: 'Champion victory', text: 'Beat Lance.', file: null, at: 0, count: 2 } }));
    expect(html).toContain('gx-lg-rl');
    expect(html).toContain('Beat Lance.');
    expect(html).toContain('1 of 2');
    expect(html).toContain('next moment');
    expect(pkGallery(run({ relive: { label: 'x', text: 'y', file: null, at: 1, count: 2 } }))).toContain('done');
  });
});

describe('Pocket look: the Tools room', () => {
  const items = Array.from({ length: 22 }, (_, i) => ({ label: i === 0 ? "What's new" : `Tool ${i + 1}`, sub: `Does thing ${i + 1}. More words.`, tag: i === 21 ? 'Due' : '' }));
  it('numbered cards, eight a page, the page holding the lit one', () => {
    const html = pkTools({ items, index: 9 });
    expect(pkPageOf(html)?.id).toBe('pt-tools');
    expect(html.split('class="pn').length - 1).toBe(PK_TOOLS_PAGE);
    expect(html).toContain('data-key="tl-8"');
    expect(html).not.toContain('data-key="tl-7"');
    expect(html).toMatch(/class="pn on" data-key="tl-9"/);
    expect(html).toContain('Page 2 of 3');
    expect(html).toContain('22 tools');
  });
  it('the last page is short and shows the Due tag; short lines come from the mock-up or the first clause', () => {
    const html = pkTools({ items, index: 21 });
    expect(html.split('class="pn').length - 1).toBe(6);
    expect(html).toContain('gx-tl-tag');
    expect(toolShort("What's new", 'x')).toBe("This update's notes");
    expect(toolShort('Unknown', 'Does a thing. More.')).toBe('Does a thing');
    expect(pkTools({ items: items.slice(0, 3), index: 0 })).not.toContain('Page 1 of 1');
  });
});

describe('Pocket look: the Preparation Desk', () => {
  it('the Overview: four tabs with Overview lit, the run card facts that open their page, Roll, Save and Load', () => {
    const html = pkDesk({ run: 'Run 13', name: "Red's run", art: null, facts: [['Mode', 'Standard · Full campaign', 'setup'], ['Seed', 'PIKA-2511', 'seed']] });
    expect(pkPageOf(html)?.id).toBe('pd-desk');
    expect(html.split('data-act="tab"').length - 1).toBe(4);
    expect(html).toMatch(/class="on" data-key="pd-tab-3"/);
    expect(html).toContain('data-act="seed"');
    expect(html).toContain('Roll the starters');
    expect(html).toContain('data-act="load"');
  });
  it('Run Setup: five rows at a time, segments around the choice, the rest on More', () => {
    const opts = (n: number, on: number) => Array.from({ length: n }, (_, i) => ({ label: `O${i}`, on: i === on, locked: i === n - 1 }));
    const rows = Array.from({ length: 6 }, (_, i) => ({ label: `Row ${i}`, help: 'Help.', disabled: i === 1, opts: opts(i + 2, 1) }));
    const html = pkPrepSetup({ rows, index: 0 });
    expect(pkPageOf(html)?.id).toBe('pd-setup');
    expect(html.split('class="srow').length - 1).toBe(PREP_SETUP_ROWS);
    expect(html).toContain('More</b>Row 5');
    expect(html).toContain('gx-pd-off');
    expect(pkPrepSetup({ rows, index: 5 })).toContain('More</b>Row 0');
    expect(segWindow(opts(3, 2)).length).toBe(3);
    expect(segWindow(opts(7, 6)).map((x) => x.at)).toEqual([4, 5, 6]);
    expect(segWindow(opts(7, 0)).map((x) => x.at)).toEqual([0, 1, 2]);
  });
  it('Trainer: a card per thing you bring, none shown as a dash, the lit one explained', () => {
    const cards = [{ label: 'Trainer', value: 'Red', art: null, none: false }, { label: 'Loan', value: 'None', art: null, none: true }];
    const html = pkPrepBring({ cards, index: 1, help: 'Borrow money now.' });
    expect(pkPageOf(html)?.id).toBe('pd-bring');
    expect(html).toContain('pn on none');
    expect(html).toContain('<s></s>');
    expect(html).toContain('Borrow money now.');
  });
  it('Modifiers: six cards a page with On or Off, the Death-Block bar lights as the last stop', () => {
    const mods = Array.from({ length: 8 }, (_, i) => ({ name: `Rule ${i}`, text: 'Does a thing.', on: i === 1, soon: i === 2 }));
    const html = pkPrepMods({ mods, index: 7, deathBlock: { text: 'Lose early, try again.', on: true }, category: 'All', note: 'Rewards ×1.00 with what is on now.' });
    expect(pkPageOf(html)?.id).toBe('pd-mods');
    expect(html.split('data-key="pd-m-').length - 1).toBe(2); // the second page: rules 7 and 8
    expect(html).toContain('7–8 of 8 rules');
    const first = pkPrepMods({ mods, index: 8, deathBlock: { text: 'x', on: false }, category: 'Party', note: '' });
    expect(first.split('data-key="pd-m-').length - 1).toBe(2);
    expect(first).toContain('gx-pd-dbon');
    expect(first).toContain('gx-pd-dboff');
    expect(pkPrepMods({ mods, index: 1, deathBlock: { text: 'x', on: true }, category: 'All', note: '' }).split('data-key="pd-m-').length - 1).toBe(PREP_MODS_PAGE);
  });
  it('Seed: letters in boxes with the typing box lit, a long code on one line, Random lit when empty', () => {
    const html = pkSeed({ value: 'PIKA', at: 4, text: 'Same seed, same run.' });
    expect(pkPageOf(html)?.id).toBe('pd-seed');
    expect(html.split('<i class="').length - 1).toBeGreaterThanOrEqual(8);
    expect(html).toContain('<i class="on">A</i>');
    expect(html).toContain('Fixed seed');
    expect(pkSeed({ value: 'PR1.abcdefghijklmnop', at: 0, text: '' })).toContain('gx-sd-long');
    expect(pkSeed({ value: '', at: 0, text: '' })).toMatch(/<i class="on" data-act="btn" data-arg="clear"/);
  });
});

describe('Pocket look: the Trainers page', () => {
  const cards = ['Red', 'Blue', 'Lass', 'Green', 'Hilda', 'Nate'].map((name, i) => ({ name, art: null, locked: i === 2, line: i === 2 ? 'Locked' : `${i} runs` }));
  const lit = { title: 'The Balanced Trainer', about: 'Standard rules.', runs: 12, best: '8 badges', locked: null };
  it('the lit Trainer on the big card, the next four beside it, a locked one as ???', () => {
    const html = pkTrainers({ cards, index: 0, lit, sort: 'Default ▲' });
    expect(pkPageOf(html)?.id).toBe('trainers');
    expect(html.split('class="trb').length - 1).toBe(1 + PK_TRAINER_SIDE);
    expect(html).toContain('Playing as');
    expect(html).toContain('8 badges');
    expect(html).toContain('???');
    expect(html).toContain('1 of 6');
    expect(html).toContain('5 unlocked');
    expect(html).not.toContain('data-key="tr-5"');
  });
  it('the row wraps past the end; a locked lit card says how to unlock instead of runs', () => {
    const html = pkTrainers({ cards, index: 2, lit: { ...lit, locked: 'How to unlock: win once.' }, sort: 'Name ▼' });
    expect(html).toContain('How to unlock: win once.');
    expect(html).not.toContain('best run');
    expect(html).toContain('how to unlock');
    expect(pkTrainers({ cards, index: 4, lit, sort: '' })).toContain('data-key="tr-0"');
    expect(trainerColour(-1)).toBe(trainerColour(7));
  });
});

describe('Pocket look: the Blessing', () => {
  const d = { tier: 'Greater', name: 'The Guardian of the Sea', legendary: 'Lugia', mon: null, headline: 'A long note under water', summary: 'Call a Calm once per stage.', passage: 'One beneath the sea.', vows: null, vowAt: -1, book: null };
  it('the run’s blessing as a card in its tier colour with its passage, Enter accepts', () => {
    const html = pkBlessing(d);
    expect(pkPageOf(html)?.id).toBe('blessing');
    expect(html).toContain('--c:#4f7fe0');
    expect(html).toContain('One beneath the sea.');
    expect(html).toContain('data-act="next"');
    expect(html).toMatch(/<i class="on"><b>3<\/b>Blessing/);
  });
  it('a Vow is two cards to swear by; the Reliquary hides what is not found', () => {
    const vow = pkBlessing({ ...d, vows: [{ label: 'Leave no Pokémon behind', text: 'x' }, { label: 'Strike no one first', text: 'y' }], vowAt: 1 });
    expect(vow.split('gx-bs-vow').length - 1).toBe(2);
    expect(vow).toMatch(/class="blc on gx-bs-vow"[^>]*data-key="bl-vow-1"/);
    expect(vow).toContain('swear');
    const book = pkBlessing({ ...d, book: { rows: [{ name: 'Fair Wish', tier: 'lesser', text: 'Cheaper shops.', found: true, mine: false }, { name: 'Secret', tier: 'divine', text: 'Hidden.', found: false, mine: false }], page: 0, pages: 2, found: 1, of: 2 } });
    expect(book).toContain('Fair Wish');
    expect(book).not.toContain('Secret');
    expect(book).toContain('1 of 2 found');
  });
});

describe('Pocket look: the run end', () => {
  const d = { win: false, title: 'RUN OVER', sub: 'Stage 12', facts: [['Stage', '12 of 30'], ['Badges', '2']] as [string, string][], payouts: [['Bank Credits', '+ 1,240'], ['Mastery', 'No new rank']] as [string, string][], team: [{ file: null, name: 'Pikachu', down: true }, { file: null, name: 'Eevee', down: false }], buttons: ['Back to the Hub', 'Run it back', 'Share seed'], index: 1, extras: [['Tab', 'full report', 'report']] as [string, string, string][], backdrop: null, poked: null, where: 'Stage 12 of 30 · lost to Brock', line: 'You made it far.', road: { done: 11, of: 30 } };
  it('a lost run: the title, where it stopped, the road, the team greyed, what you keep, the buttons', () => {
    const html = pkOver(d);
    expect(pkPageOf(html)?.id).toBe('gameover');
    expect(html).toContain('The journey ends');
    expect(html).toContain('lost to Brock');
    expect(html).not.toContain('gx-ov-win');
    expect(html.split('gx-ov-down').length - 1).toBe(1);
    expect(html).toContain('+ 1,240 Bank Credits');
    expect(html).toContain('Mastery: No new rank');
    expect(html).toMatch(/class="btn on" data-key="ov-b-1"/);
    expect(html).toContain('full report');
    expect(html).not.toContain('ov-report');
  });
  it('a win is gold with confetti; the report opens as a window that pages', () => {
    const win = pkOver({ ...d, win: true });
    expect(win).toContain('Champion!');
    expect(win).toContain('gx-ov-win');
    expect(win).toContain('confetti');
    const rep = pkOver({ ...d, report: { title: 'Full report', lines: ['Caught 9', '', 'Fainted 2'], page: 1, pages: 3 } });
    expect(rep).toContain('data-key="ov-report"');
    expect(rep).toContain('Page 2 of 3');
    expect(rep).toContain('class="gap"');
    expect(rep).toContain('data-act="back"');
    expect(keepLine('Profile', 'Already added')).toBe('Profile: Already added');
    expect(pkOver({ ...d, payouts: [], road: null })).not.toContain('ov-keep');
  });
});

describe('Pocket look: the Hall of Fame', () => {
  const mons = ['Charizard', 'Pikachu', 'Gengar', 'Gyarados', 'Lucario', 'Snorlax'].map((name, i) => ({ file: null, name, type: ['fire', 'electric', 'ghost', 'water', 'fighting', 'normal'][i]! }));
  it('the team under spotlights with the Trainer in the middle, what comes next and one button', () => {
    const html = pkHall({ where: 'Kanto cleared · Run 13 · 8 badges', mons, trainer: { art: null, name: 'Champion Red' }, say: 'Your team is recorded. **Johto** is next.', button: 'On to Johto' });
    expect(pkPageOf(html)?.id).toBe('hof');
    expect(html).toContain('Kanto cleared');
    const keys = [...html.matchAll(/data-key="hf-(\w+)"/g)].map((m) => m[1]).filter((k) => k !== 'title' && k !== 'row' && k !== 'say');
    expect(keys).toEqual(['0', '1', '2', 'me', '4', '5', '6']);
    expect(html).toContain('<b>Johto</b>');
    expect(html).toContain('data-act="next"');
    expect(html).toContain('On to Johto');
  });
  it('a short team still puts the Trainer in the middle; the button can go back; unknown types are grey', () => {
    const html = pkHall({ where: 'x', mons: mons.slice(0, 1), trainer: { art: null, name: 'Red' }, say: '<b>', button: 'Back', go: 'back' });
    expect(html.indexOf('hf-0')).toBeLessThan(html.indexOf('hf-me'));
    expect(html).toContain('data-act="back"');
    expect(html).toContain('&lt;b&gt;');
    expect(hallTag('')).toBe('#9fa19f');
    expect(hallTag('fire')).not.toBe('#9fa19f');
  });
});

describe('Pocket look: boot and credits', () => {
  it('boot: the title, the fan lines and the bar; the update splash waits for a key', () => {
    const html = pkBoot({ title: 'Loading the region…', progress: 0.724, note: 'Tip: rest at a Camp.', splash: null });
    expect(pkPageOf(html)?.id).toBe('boot');
    expect(html).toContain('Loading the region · 72%');
    expect(html).toContain('width:72%');
    expect(html).toContain('not for sale');
    expect(html).not.toContain('Press any key');
    const sp = pkBoot({ title: 'Beta 0.8 is here', progress: 2, note: '', splash: 'x.png' });
    expect(sp).toContain('Press any key');
    expect(sp).toContain('data-act="next"');
    expect(sp).toContain('width:100%');
  });
  it('credits: thank you, the run\'s lines grouped under their headings, the team walking, the button', () => {
    const rows = [{ kind: 'title' as const, text: 'Pocket Raiders' }, { kind: 'heading' as const, text: 'The team' }, { kind: 'text' as const, text: 'Pikachu Lv5' }, { kind: 'mons' as const, text: '', mons: ['a'] }, { kind: 'gap' as const, text: '' }, { kind: 'heading' as const, text: 'Thanks' }, { kind: 'text' as const, text: '<you>' }];
    expect(pkCreditsRows(rows).match(/<div/g)?.length).toBe(3);
    const html = pkCredits({ lead: 'A run by Red', rows, party: [], art: '', roll: 120, walkers: [{ sheet: 'pikachu', ko: false }, { sheet: 'eevee', ko: true }], back: 'On to the results' });
    expect(pkPageOf(html)?.id).toBe('credits');
    expect(html).toContain('Thank you');
    expect(html).toContain('translateY(120px)');
    expect(html).toContain('&lt;you&gt;');
    expect(html.split('class="wk').length - 1).toBe(2);
    expect(html).toContain('wk ko');
    expect(html).toContain('On to the results');
    const still = pkCredits({ lead: '', rows: [], party: [], art: '', roll: null });
    expect(still).toContain('gx-cr-still');
    expect(still).toContain('scroll');
    expect(still).not.toContain('walkrow');
  });
});

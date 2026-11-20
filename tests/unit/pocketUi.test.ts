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

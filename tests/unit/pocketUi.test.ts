import { describe, expect, it } from 'vitest';
import { pocketRoad, roadNext, roadStop, rotomNews, rotomTip, trainerId } from '../../src/core/presentation/pocket';
import { changeSetting, SETTINGS } from '../../src/core/settingsRegistry';
import { DEFAULT_SETTINGS } from '../../src/save/saveManager';
import { page, pkPageOf, tierClass } from '../../src/ui/pocket/kit';
import { pkAce, pkVersus } from '../../src/ui/pocket/screens/cards';
import { dealOf, dealWord, pageText, pkEvent, points } from '../../src/ui/pocket/screens/event';
import { mapWindow, nodeState, pkMap, pkMiniMap, pkNodeMenu } from '../../src/ui/pocket/screens/map';
import { pkPause } from '../../src/ui/pocket/screens/pause';
import { pkShop, pkShopPay, type PkShopGood, type PkShopModel } from '../../src/ui/pocket/screens/shop';
import type { MapModel, MapNodeView } from '../../src/ui/redux/screens/map';
import type { EventModel } from '../../src/ui/redux/screens/event';
import { pkSettingsHome } from '../../src/ui/pocket/screens/settings';
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

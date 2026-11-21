import { describe, expect, it } from 'vitest';
import { pkPageOf } from '../../src/ui/pocket/kit';
import { isBagList, PK_BAG_SIZE, pkBattle, pkBattleList } from '../../src/ui/pocket/screens/battle';
import type { BattleBox, BattleListModel, BattleListRow, BattleModel } from '../../src/ui/redux/screens/battle';

// The Pocket look's battle screen (mock-ups `battle`, `b-switch`, `b-bag`): the foe's plate, the move cards, the
// command pills and the speech line, then the Party and Bag windows laid over the bare field.

const count = (html: string, bit: string | RegExp): number => html.split(bit).length - 1;
const box = (name: string, over: Partial<BattleBox> = {}): BattleBox => ({ name, level: 'Lv 5', hp: 1, hpText: '', xp: null, tags: [], team: null, ...over });
const TABS = { labels: ['Attack', 'Party', 'Item', 'Auto', 'i'], index: -1, auto: false, autoOff: false };
const model = (over: Partial<BattleModel> = {}): BattleModel => ({
  foes: [box('Starly', { level: 'Lv 4', hp: 0.5, types: ['normal', 'flying'], tip: 'foe:0' })],
  mine: [box('Turtwig', { hpText: '25 / 25', xp: 0.4, types: ['grass'], tip: 'mine:0' })],
  text: 'What will Turtwig do?', menu: null, tabs: TABS,
  header: 'Stage 1', status: '', momentum: '', note: '', auto: false, party: { n: 3, out: 1 }, ...over,
});
const MOVES = [{ label: 'Tackle', sub: 'PP 35/35', type: 'normal', tip: 'move:0' }, { label: 'Absorb', sub: 'PP 25/25', type: 'grass', tip: 'move:1' }, { label: 'Withdraw', sub: 'PP 0/40', type: 'water', off: true, tip: 'move:2' }];

describe('the Pocket battle bars: power tags (b-power)', () => {
  it('Mega, Tera with its type (the old Tera word dropped), Max with turns left as pips, Z spent; none without a power', () => {
    const h = pkBattle(model({ foes: [box('Blastoise', { power: { kind: 'dmax', text: 'Max', turns: 2 } })], mine: [box('Charizard', { power: { kind: 'tera', text: 'Tera Dragon' }, tags: ['TERA DRAGON', 'Burned'] })] }));
    expect(h).toContain('class="gtag dmax"');
    expect(count(h, '<u class=""></u>')).toBe(2);
    expect(count(h, '<u class="off"></u>')).toBe(1);
    expect(h).toContain('class="gtag tera"');
    expect(count(h, 'Tera Dragon')).toBe(1);
    expect(h).not.toContain('TERA DRAGON');
    expect(h).toContain('Burned');
    expect(pkBattle(model({ mine: [box('Charizard', { power: { kind: 'mega', text: 'Mega' } })] }))).toContain('class="gtag mega"');
    expect(pkBattle(model({ mine: [box('Pikachu', { power: { kind: 'z', text: 'Z' } })] }))).toContain('Z-Move spent');
    expect(pkBattle(model())).not.toContain('gtag');
  });
});

describe('the Pocket battle screen', () => {
  it('is a see-through page with both plates, the words and the command pills', () => {
    const html = pkBattle(model());
    expect(pkPageOf(html)).toEqual({ id: 'battle', tier: 26, hud: true });
    expect(html).toContain('Starly');
    expect(html).toContain('Turtwig');
    expect(html).toContain('25/25');
    expect(html).toContain('What will Turtwig do?');
    // The tabs are the mock-up's pills, with its words: Fight, Pokémon, Bag.
    expect(html).toContain('Fight');
    expect(html).toContain('Pokémon');
    expect(html).toContain('Bag');
    expect(count(html, 'data-act="tab"')).toBeGreaterThanOrEqual(5);
    // The foe's half-gone HP shows as a number too.
    expect(html).toContain('50%');
  });
  it('draws the moves as typed cards, the spent one dimmed, each one a pick', () => {
    const html = pkBattle(model({ tabs: { ...TABS, index: 0 }, menu: { options: MOVES, index: 1 } }));
    expect(count(html, /class="mv3[ "]/g)).toBe(3);
    expect(count(html, 'data-act="pick"')).toBe(3);
    expect(html).toContain('Absorb');
    expect(html).toContain('PP 0/40');
    expect(html).toMatch(/mv3[^"]*gx-bt-off|gx-bt-off[^"]*mv3/);
  });
  it('a battle with no tabs and no menu still draws, with nothing to press', () => {
    const html = pkBattle(model({ tabs: null, text: 'Starly used Growl!' }));
    expect(html).toContain('Starly used Growl!');
    expect(count(html, 'data-act="pick"')).toBe(0);
  });
});

const mon = (label: string, hp: number, over: Partial<BattleListRow> = {}): BattleListRow => ({ label, art: null, hp, tag: '', off: false, level: 5, types: ['grass'], ...over });
const item = (label: string, tag: string, off = false): BattleListRow => ({ label, art: null, hp: null, tag, off });
const list = (rows: BattleListRow[], over: Partial<BattleListModel> = {}): BattleListModel => ({ title: 'Switch to…', note: '', tabs: null, n: rows.length, index: 0, row: (i) => rows[i]!, back: true, ...over });

describe('the Pocket battle Party and Bag windows', () => {
  it('the party stands as pills with the lit one on a card and a Send out button', () => {
    const rows = [mon('Turtwig', 1, { tag: 'IN BATTLE' }), mon('Starly', 0.3, { types: ['normal', 'flying'] }), mon('Shinx', 0, { tag: 'FNT', off: true, types: ['electric'] })];
    const html = pkBattleList(list(rows, { index: 1, hint: 'Keen Eye: its accuracy can’t be lowered.' }));
    expect(pkPageOf(html)?.id).toBe('b-switch');
    expect(count(html, /class="sw btn typed/g)).toBe(3);
    expect(html).toMatch(/class="sw btn typed on"[^>]*data-key="bl-1"/);
    expect(html).toContain('Fainted');
    expect(html).toContain('Lv 5');
    expect(html).toContain('Keen Eye');
    expect(html).toContain('<b>Send out</b>');
    expect(html).toContain('<b>Back</b>');
    expect(count(html, 'data-act="pick"')).toBe(4);
  });
  it('a fainted pick says why it can’t go, and the button is dimmed', () => {
    const rows = [mon('Turtwig', 1), mon('Shinx', 0, { tag: 'FNT', off: true })];
    const html = pkBattleList(list(rows, { index: 1, why: 'Shinx has fainted.' }));
    expect(html).toContain('Shinx has fainted.');
    expect(html).toMatch(/btn on gx-bl-off/);
  });
  it('the Bag is pocket tabs over a grid of tiles, with the lit item’s card', () => {
    const rows = Array.from({ length: 12 }, (_, i) => item(`Potion ${i + 1}`, `×${i + 1}`, i === 2));
    const d = list(rows, { title: 'Bag', tabs: { labels: ['Medicine', 'Balls'], index: 0 }, index: 10, hint: 'Restores 20 HP.' });
    expect(isBagList(d)).toBe(true);
    const html = pkBattleList(d);
    expect(pkPageOf(html)?.id).toBe('b-bag');
    // Nine tiles at a time, scrolled a row at a time so the lit one (11th) shows.
    expect(count(html, /class="it pn/g)).toBe(PK_BAG_SIZE);
    expect(html).toContain('data-key="bl-10"');
    expect(html).not.toContain('data-key="bl-0"');
    expect(html).toContain('4–12 of 12');
    expect(html).toContain('× 11');
    expect(html).toContain('Restores 20 HP.');
    expect(html).toContain('<b>Use</b>');
    expect(count(html, 'data-act="tab"')).toBe(2);
  });
  it('a map stop’s quick choice stays one window in the middle; an empty list says so', () => {
    const d = list([item('Old Rod', ''), item('Leave', '')], { center: true, lead: '! A bite !' });
    expect(isBagList(d)).toBe(false);
    const html = pkBattleList(d);
    expect(pkPageOf(html)?.id).toBe('b-list');
    expect(html).toContain('gx-mid');
    expect(html).toContain('! A bite !');
    expect(pkBattleList(list([]))).toContain('Nothing here.');
  });
  it('the summary sheet lies over the list and goes back on a click', () => {
    const html = pkBattleList(list([mon('Turtwig', 1)]), 'Turtwig\nLv 5');
    expect(html).toContain('gx-bl-sheet');
    expect(html).toContain('Turtwig<br>Lv 5');
  });
});

describe('the Pocket battle pages: Battle Info, a move card, the Battle Log', () => {
  const side = (name: string, stages: [string, number][]) => ({ speciesId: name.toLowerCase(), shiny: false, name, sub: 'Lv 4 · Wild', types: ['normal', 'flying'], ability: 'Not shown yet', held: 'Not seen yet', status: 'Healthy', stages, note: '' });
  const ST: [string, number][] = [['Atk', 1], ['Def', 0], ['Sp. Atk', 0], ['Sp. Def', 0], ['Speed', -2]];
  const info = { foe: side('Starly', ST), me: { ...side('Turtwig', ST.map(([w]) => [w, 0] as [string, number])), note: 'HP 25 of 25' }, mid: [{ em: 'Weather', b: 'Rain', span: '3 turns left.' }, { em: 'Field', b: 'None', span: 'No terrain is up.' }, { em: 'Your side', b: 'Clear', span: 'No traps.' }, { em: 'Catch odds', b: '44%', span: 'Plain ball.' }], foeFile: null, meFile: null };
  it('Battle Info: both sides, stat stages up and down, four field cards, Battle Log and Back', () => {
    const html = pkBattle(model({ pkInfo: info, panels: [{ head: 'x', chips: [], facts: [], lines: [] }] }));
    expect(pkPageOf(html)).toEqual({ id: 'b-info', tier: 26, hud: true });
    expect(count(html, 'class="in-side')).toBe(2);
    expect(count(html, 'stg up')).toBe(1);
    expect(count(html, 'stg dn')).toBe(1);
    expect(count(html, 'class="in-c')).toBe(4);
    expect(html).toContain('in-c w');
    expect(html).toContain('data-act="pkLog"');
    expect(pkBattle(model({ pkInfo: { ...info, foe: null } }))).toContain('???');
  });
  it('the Status page: turn order, weather, money, the event goal, the bench with HP, the foe team and how many are unseen', () => {
    const mon = (name: string, hp: number) => ({ speciesId: name.toLowerCase(), shiny: false, name, hp, ko: hp <= 0, file: null });
    const st = { turn: 3, order: [{ name: 'Blastoise', speed: 78 }, { name: 'Charizard', speed: 71 }], trickRoom: false, weather: { em: 'Weather', b: 'Rain', span: '3 turns left.' }, bench: [mon('Pikachu', 1), mon('Gengar', 0)], foeName: "Blue's team", foes: [mon('Arcanine', 0), mon('Blastoise', 0.7)], unseen: 2, money: '₽ 2,280', event: { name: 'Homeland Week', goal: 'Defeat 3 Gym Leaders', left: '2 of 3 · 3 days left' } };
    const html = pkBattle(model({ pkStatus: st, panels: [{ head: 'x', chips: [], facts: [], lines: [] }] }));
    expect(pkPageOf(html)?.id).toBe('b-status');
    expect(html).toContain('Speed 78');
    expect(html).toContain('wxi rain');
    expect(html).toContain('Homeland Week');
    expect(html).toContain('2 more not seen yet');
    expect(count(html, '<s><u')).toBe(2);
    expect(html).toContain('data-act="pkInfoOpen"');
    expect(pkBattle(model({ pkStatus: { ...st, event: null, bench: [] } }))).toContain('No one else in your party');
  });
  it('a move card: numbers, type into type, same-type bonus, Use it; a status move says it does no damage', () => {
    const m = { name: 'Tackle', type: 'normal', category: 'Physical', contact: true, power: '40', accuracy: '100', pp: '35/35', text: 'Slams into the foe.', vs: { foe: 'Starly', foeTypes: ['normal', 'flying'], mult: 0.5, stab: true, user: 'Turtwig', word: 'Not very effective.' } };
    const html = pkBattle(model({ pkMove: m }));
    expect(pkPageOf(html)?.id).toBe('moveinfo');
    expect(html).toContain('Against Starly');
    expect(html).toContain('× 0.5');
    expect(html).toContain('Same type as Turtwig');
    expect(html).toContain('data-act="pkUse"');
    expect(pkBattle(model({ pkMove: { ...m, category: 'Status', vs: null } }))).toContain('status move');
  });
  it('the Battle Log: the lines newest last, the filter tabs, the turn, Back to battle', () => {
    const html = pkBattle(model({ log: { tabs: ['All', 'Damage'], index: 1, lines: ['A wild Starly appeared!', 'Go! Turtwig!'] }, turn: 3 }));
    expect(pkPageOf(html)?.id).toBe('b-log');
    expect(count(html, 'gx-lg-row')).toBe(2);
    expect(html).toContain('Turn 3');
    expect(html).toMatch(/class="on" data-act="log" data-arg="1"/);
    expect(html).toContain('data-act="logClose"');
    expect(pkBattle(model({ log: { tabs: ['All'], index: 0, lines: [] } }))).toContain('Nothing here yet.');
  });
});

describe('the Pocket Totem strip', () => {
  it('shows the Totem word, its numbers and the area steps, and nothing without one', () => {
    const plain = model();
    const h = pkBattle({ ...plain, pkArea: { key: 'tm', word: 'Totem', chips: [['+1', 'Defense'], ['1', 'of 2']], flow: ['Territory', 'Totem', 'The Gift'], step: 1 } });
    expect(h).toContain('gx-bt-area ar28 a-tm ms39');
    expect(h).toContain('<b>+1</b>Defense');
    expect(h).toMatch(/<i class="on">Totem<\/i>/);
    expect(h).toMatch(/<i class="past">Territory<\/i>/);
    expect(pkBattle(plain)).not.toContain('gx-bt-area');
  });
});

describe('the Pocket Galar stadium strip', () => {
  it('shows the round, the crowd favour bar and the foes left', () => {
    const h = pkBattle({ ...model(), pkArea: { key: 'ga', word: 'Round of 32', bar: 62, chips: [['62', 'with you'], ['3', 'foes left']], flow: ['Bracket', 'Match', 'Next round'], step: 1 } });
    expect(h).toContain('gx-bt-area ar28 a-ga ms39');
    expect(h).toContain('<b>Round of 32</b><i class="fav37"><s style="width:62%"></s></i>');
    expect(h).toContain('<b>3</b>foes left');
    expect(pkBattle({ ...model(), pkArea: { key: 'tm', word: 'Totem', chips: [], flow: ['a', 'b'], step: 0 } })).not.toContain('fav37');
  });
});

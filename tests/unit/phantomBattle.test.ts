import { describe, expect, it } from 'vitest';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { pageOf } from '../../src/ui/phantom/kit';
import { fanAngles, phBattle, phBattleList, phEvolve, phLevel } from '../../src/ui/phantom/screens/battle';
import type { BattleBox, BattleListModel, BattleModel } from '../../src/ui/redux/screens/battle';

// The Phantom UI's battle screen: the foe's box, the command fan, the move cards, the text box, and the battle's lists.

const ph = PHANTOM_VERSIONS[0]!;
const count = (html: string, bit: string | RegExp): number => html.split(bit).length - 1;
const box = (name: string, over: Partial<BattleBox> = {}): BattleBox => ({ name, level: 'Lv 5', hp: 1, hpText: '', xp: null, tags: [], team: null, ...over });
const TABS = { labels: ['Attack', 'Party', 'Item', 'Auto', 'i'], index: -1, auto: false, autoOff: false };
const model = (over: Partial<BattleModel> = {}): BattleModel => ({
  foes: [box('Feebas', { level: 'Lv 4', tip: 'foe:0' })], mine: [box('Rowlet', { hpText: '27 / 27', xp: 0.4, tip: 'mine:0' })],
  text: 'What will Rowlet do?', menu: { options: [{ label: 'Fight' }, { label: 'Bag' }, { label: 'Pokémon' }], index: 0 }, tabs: TABS,
  header: 'Stage 1', status: '', momentum: '', note: '', auto: false, party: { n: 3, out: 1 }, ...over,
});
const MOVES = [{ label: 'Tackle', sub: 'PP 35/35', type: 'normal', tip: 'move:0' }, { label: 'Gust', sub: 'PP 35/35', type: 'flying', tip: 'move:1' }, { label: 'Growl', sub: 'PP 40/40', type: 'normal', tip: 'move:2' }, { label: 'Leafage', sub: 'PP 0/40', type: 'grass', off: true, tip: 'move:3' }];

describe('the Phantom battle screen', () => {
  it('is its own see-through page: the boxes, the words, the choices, and nothing that hides the field', () => {
    const html = phBattle(ph, model());
    expect(pageOf(html)).toBe('battle');
    expect(html).toContain('Feebas');
    expect(html).toContain('Rowlet');
    expect(html).toContain('27 / 27');
    expect(html).toContain('What will Rowlet do?');
    expect(count(html, 'ph-bt-op')).toBe(3);
    expect(count(html, 'data-act="pick"')).toBe(3);
    // No wipe and no backdrop: the canvas keeps the arena and the Pokémon.
    expect(html).not.toContain('class="wipe"');
    expect(html).not.toContain('class="bgk"');
    // The boxes are the hover cards' and the pin's targets.
    expect(html).toContain('data-arg="foe:0"');
    expect(html).toContain('data-arg="mine:0"');
    // Your party as balls: three, one of them out.
    expect(count(html, /<i class="(?:out)?"><\/i>/)).toBe(3);
    expect(count(html, '<i class="out"></i>')).toBe(1);
  });

  it('puts the command menu in the fan, as the mock-up draws it: Info, the commands with their keys, then Auto', () => {
    const none = phBattle(ph, model());
    // Info and Auto stay page tabs; the three commands stand between them, and the tray under the field is gone.
    expect(count(none, 'ph-bt-tab')).toBe(2);
    expect(count(none, 'ph-bt-cmd')).toBe(3);
    expect(none).toContain('b3-fan ph-bt-fan cmd');
    expect(none).not.toContain('ph-bt-menu');
    // The lit command takes Z; Bag keeps Q (the Item page) and Fight keeps E when it is not lit.
    expect(none).toMatch(/ph-bt-cmd on"[^>]*><kbd>Z<\/kbd><b>Fight<\/b>/);
    expect(none).toMatch(/<kbd>Q<\/kbd><b>Bag<\/b>/);
    expect(none).toMatch(/<kbd>T<\/kbd><b>Auto<\/b><small>OFF<\/small>/);
    expect(none).toMatch(/<kbd>I<\/kbd><b>Info<\/b>/);
    const bag = phBattle(ph, model({ menu: { options: [{ label: 'Fight' }, { label: 'Bag' }, { label: 'Pokémon' }], index: 1 } }));
    expect(bag).toMatch(/<kbd>E<\/kbd><b>Fight<\/b>/);
    expect(bag).toMatch(/ph-bt-cmd on"[^>]*><kbd>Z<\/kbd><b>Bag<\/b>/);
    // Info first, Auto last, the commands between them in order.
    const order = [...none.matchAll(/<b>(Info|Fight|Bag|Pokémon|Auto)<\/b>/g)].map((m) => m[1]);
    expect(order).toEqual(['Info', 'Fight', 'Bag', 'Pokémon', 'Auto']);
    // On a page (Party), the fan is the page tabs again, with Q and E for the neighbours.
    const party = phBattle(ph, model({ tabs: { ...TABS, index: 1, auto: true } }));
    expect(count(party, 'ph-bt-tab')).toBe(5);
    expect(party).toMatch(/ph-bt-tab on"[^>]*><b>Party<\/b>/);
    expect(party).toMatch(/<kbd>Q<\/kbd><b>Attack<\/b>/);
    expect(party).toMatch(/<kbd>E<\/kbd><b>Item<\/b>/);
    expect(party).toMatch(/<small>ON<\/small>/);
    const off = phBattle(ph, model({ tabs: { ...TABS, autoOff: true } }));
    expect(off).toMatch(/ph-bt-tab g off"/);
    expect(off).toContain('<small>N/A</small>');
    // No tabs, no fan: the commands go back to the tray.
    const bare = phBattle(ph, model({ tabs: null }));
    expect(bare).not.toContain('ph-bt-fan');
    expect(count(bare, 'ph-bt-op')).toBe(3);
    // The open info panel lights the Info tab.
    const info = phBattle(ph, model({ panels: [{ tag: 'Info', head: 'Battlefield', chips: [], facts: [['Momentum', '0']], lines: [] }], panelAt: 'left' }));
    expect(info).toMatch(/ph-bt-tab on"[^>]*><kbd>I<\/kbd><b>Info<\/b>/);
    expect(info).toContain('Battlefield');
  });

  it('stacks your card and the rest of the party at the right, shows the turn, and reads the foe: types and weak spots', () => {
    const bench = [{ name: 'Pikachu', level: 'Lv 9', hp: 0.5, file: null }, { name: 'Gyarados', level: 'Lv 20', hp: 0, file: null }];
    const foe = box('Garchomp', { types: ['dragon', 'ground'], weak: [{ type: 'ice', times: 4 }, { type: 'dragon', times: 2 }, { type: 'fairy', times: 2 }] });
    const html = phBattle(ph, model({ foes: [foe], bench, turn: 3 }));
    expect(html).toContain('ph-bt-stack top');
    expect(count(html, 'ph-bt-bn')).toBe(2);
    expect(html).toMatch(/ph-bt-bn out"[^>]*>.*Gyarados<span>KO<\/span>/);
    expect(html).toContain('Pikachu<span>Lv 9</span>');
    // With the party listed, the balls row is not needed.
    expect(html).not.toContain('ph-bt-party');
    expect(html).toContain('<b>Turn 3</b>');
    expect(count(html, 'class="ty"')).toBe(2);
    expect(html).toContain('Weak to');
    const wk = /class="r wk">(.*?)<\/div>/.exec(html)![1]!;
    expect(count(wk, /packs\/story\/badge\/(?:ice|dragon|fairy)\.png/)).toBe(3);
    expect(html).toContain('Ice ×4');
    // Out of the command menu (or with no bench) the stack goes back above the tray, with the balls.
    const page2 = phBattle(ph, model({ bench, tabs: { ...TABS, index: 1 } }));
    expect(page2).not.toContain('ph-bt-stack top');
    expect(page2).toContain('ph-bt-party');
    expect(page2).not.toContain('Turn 3');
  });

  it('spreads the fan evenly and lifts it clear of a tall menu', () => {
    expect(fanAngles(5)).toEqual([-62, -41, -20, 1, 22]);
    expect(fanAngles(1)).toEqual([-14]);
    // A low last tab: the tabs keep at least 17 degrees between them.
    const tight = fanAngles(5, 2);
    expect(tight[4]).toBe(2);
    expect(tight[0]).toBe(-66);
    for (let k = 1; k < tight.length; k++) expect(tight[k]! - tight[k - 1]!).toBeGreaterThanOrEqual(17);
    // The fan stands round the Pokémon that is choosing.
    const at = phBattle(ph, model({ me: { x: 300, y: 300 } }));
    expect(at).toContain('class="b3-fan ph-bt-fan cmd" style="left:400px;top:300px"');
  });

  it('lays four moves on the mock-up\'s cross with the target\'s card; more moves keep the tray', () => {
    const text = 'Tackle · Normal · Physical · Power 40 · Acc 100\nPP 35/35';
    const foe = box('Feebas', { level: 'Lv 4', hp: 0.4, file: 'pokemon/349' });
    const html = phBattle(ph, model({ foes: [foe], text, menu: { options: MOVES, index: 1 }, tabs: { ...TABS, index: 0 }, turn: 2 }));
    expect(html).toContain('b3-x ph-bt-x');
    expect(count(html, 'b3-m ph-bt-mv')).toBe(4);
    for (const k of [0, 1, 2, 3]) expect(html).toContain(`ph-bt-mv d${k}`);
    expect(html).toMatch(/ph-bt-mv d1 on"[^>]*data-key="mv1"/);
    expect(html).toMatch(/ph-bt-mv d3 off"[^>]*data-key="mv3"/);
    expect(count(html, 'data-tip="move:')).toBe(4);
    expect(html).toContain('PP 0/40');
    // The target's card: its name and level, its HP, and the move's line (kept on two lines).
    expect(html).toContain('ph-bt-tg');
    expect(html).toMatch(/Feebas <small>Lv 4<\/small>/);
    expect(html).toContain('<b>40%</b>');
    expect(html).toContain('Acc 100<br>PP 35/35');
    // The page is Fight: the header, the keys; the fan, the boxes, the tray and the text box step aside.
    expect(html).toContain('Rowlet · Turn 2</small>Fight');
    expect(html).toContain('data-act="back"');
    for (const gone of ['ph-bt-fan', 'ph-bt-foe', 'ph-bt-stack', 'ph-bt-menu', 'ph-bt-say']) expect(html).not.toContain(gone);
    // A fifth move: the cards go back to the tray, two to a row, under the fan.
    const five = phBattle(ph, model({ text, menu: { options: [...MOVES, { label: 'Hyper Beam', sub: 'PP 5/5', type: 'normal' }], index: 1 }, tabs: { ...TABS, index: 0 } }));
    expect(five).toContain('ph-bt-menu mvs two');
    expect(five).not.toContain('ph-bt-x');
    expect(five).toMatch(/ph-bt-say half" style="font-size:22px"/);
    const last = Number(/--a:(-?\d+)deg;--i:4/.exec(five)![1]);
    expect(last).toBeLessThan(10);
  });

  it('shows two foes and two of your own as smaller boxes, with no party row', () => {
    const html = phBattle(ph, model({ foes: [box('Zubat'), box('Geodude', { tags: ['PAR'], team: { n: 4, out: 2 } })], mine: [box('Rowlet', { hpText: '27 / 27', xp: 0 }), box('Pidgey', { hpText: '9 / 20', hp: 0.45, xp: 0.2 })] }));
    expect(count(html, 'ph-bt-foe sm')).toBe(2);
    expect(count(html, 'ph-bt-m sm')).toBe(2);
    expect(html).not.toContain('ph-bt-party');
    expect(html).toContain('<em class="st">PAR</em>');
    // A hurt Pokémon's bar changes colour.
    expect(html).toMatch(/slash  mid"[^>]*><i style="width:45%"/);
  });

  it('keeps every extra the New look has: marks, lines, Auto, gimmicks, Exp, the level window, the pieces and the notice', () => {
    const html = phBattle(ph, model({
      header: 'Stage 1 · Level 1/30', status: 'Rain: 3 turns', momentum: 'Momentum 2', note: 'Saved!', auto: true,
      marks: [{ x: 600, y: 150, text: 'TARGET' }], gim: [{ kind: 'mega', on: true }, { kind: 'tera', on: false, row: 0 }],
      fx: { rally: 'The boss rallies!', rule: { name: 'Foresight Tax', text: 'First move costs double.' }, shadow: { head: 'Shadow · Tier 2', plan: 'It will lash out.' } }, shadow: true,
      notice: { title: 'Second Shot', body: 'One more try.', button: 'Go' },
    }));
    for (const bit of ['Rain: 3 turns', 'Momentum 2', 'Saved!', 'TARGET', 'Mega Evolve', 'Terastallize', 'READY', 'The boss rallies!', 'Foresight Tax', 'Shadow · Tier 2', 'It will lash out.', 'Second Shot', 'ph-bt-shadow', 'data-act="auto"']) expect(html, bit).toContain(bit);
    expect(html).toContain('left:800px;top:200px');
    expect(count(html, 'data-act="gim"')).toBe(2);
    // Exp rows take the header's corner; the level window dims the field and hides the small pieces.
    const exp = phBattle(ph, model({ menu: null, exp: [{ name: 'Rowlet', file: null, text: '+40 Exp', xp: 0.5, up: false }, { name: 'Pidgey', file: null, text: 'Level up! 6', xp: 0.1, up: true }] }));
    expect(count(exp, 'data-key="xp')).toBe(2);
    expect(exp).not.toContain('ph-bt-line hd2');
    const lv = phBattle(ph, model({ menu: null, level: { name: 'Rowlet', file: null, from: 5, to: 6, stats: [['HP', 30, 3], ['Attack', 14, 1]] }, fx: { rally: 'x' } }));
    expect(lv).toContain('ph-bt-lv');
    expect(lv).not.toContain('ph-bt-fx');
    expect(phLevel({ name: 'Rowlet', file: null, from: 5, to: 6, stats: [['HP', 30, 3]] })).toMatch(/30<i>\+3<\/i>/);
  });

  it('opens the log and the Ability card, and an evolution takes the whole page', () => {
    const log = phBattle(ph, model({ log: { tabs: ['All', 'Damage'], index: 1, lines: [] }, card: { tag: '', head: 'Overgrow', chips: [], facts: [], lines: ['Stronger Grass moves when hurt.'], pinned: true } }));
    expect(count(log, 'data-act="log"')).toBe(2);
    expect(log).toContain('Nothing yet.');
    expect(log).toMatch(/ph-bt-paper abil pinned" data-act="pin"/);
    expect(log).toContain('Overgrow');
    const evo = phBattle(ph, model({ evolve: { from: null, to: null, done: true } , text: 'Rowlet evolved into Dartrix!' }));
    expect(pageOf(evo)).toBe('evolve');
    expect(evo).toContain('Evolved!');
    expect(evo).toContain('Rowlet evolved into Dartrix!');
    expect(phEvolve({ from: null, to: null, done: false }, '')).not.toContain('Evolved!');
  });

  it('escapes what the game hands it', () => {
    const html = phBattle(ph, model({ text: '<b>hi</b>', foes: [box('<i>x</i>')] }));
    expect(html).not.toContain('<b>hi</b>');
    expect(html).not.toContain('<i>x</i>');
  });
});

describe('the battle\'s Party and Item windows', () => {
  const list = (over: Partial<BattleListModel> = {}): BattleListModel => ({
    title: 'Switch to…', note: '', tabs: null, n: 3, index: 1, back: true,
    row: (i) => ({ label: ['Rowlet', 'Pidgey', 'Zubat'][i]!, art: null, hp: [1, 0.4, 0][i]!, tag: i === 0 ? 'In battle' : '', off: i !== 1 }),
    ...over,
  } as BattleListModel);

  it('lists the party with HP, the focused row lit and the ones that cannot be picked greyed', () => {
    const html = phBattleList(ph, list());
    expect(pageOf(html)).toBe('blist');
    expect(count(html, 'class="ph-bl-r')).toBe(3);
    expect(html).toMatch(/ph-bl-r on" style="--i:1"/);
    expect(count(html, /ph-bl-r(?: on)? off/)).toBe(2);
    expect(count(html, 'data-act="pick"')).toBe(3);
    expect(html).toContain('In battle');
    expect(html).toContain('data-act="back"');
  });

  it('shows six rows of a long bag pocket with its place, its tabs and its counts', () => {
    const html = phBattleList(ph, list({ title: 'Items', tabs: { labels: ['Medicine', 'Balls'], index: 1 }, n: 9, index: 7, back: false, row: (i) => ({ label: `Ball ${i}`, art: null, hp: null, tag: `×${i}`, off: false }) }));
    expect(count(html, 'class="ph-bl-r')).toBe(6);
    expect(html).toContain('4–9 of 9');
    expect(html).toContain('× 7');
    expect(count(html, 'data-act="tab"')).toBe(2);
    expect(html).not.toContain('data-act="back"');
    // An empty list draws no rows and does not throw.
    expect(count(phBattleList(ph, list({ n: 0, index: 0 })), 'class="ph-bl-r')).toBe(0);
  });
});

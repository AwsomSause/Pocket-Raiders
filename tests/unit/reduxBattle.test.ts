import { describe, expect, it } from 'vitest';
import { BATTLE_LIST_ROWS, battleListView, battleView, evolveView, levelView, trayHeight, type BattleBox, type BattleListModel, type BattleListRow, type BattleModel, type BattleOption, panelOf, splitChoice, windowTitle } from '../../src/ui/redux/screens/battle';
import type { ReduxCtx } from '../../src/ui/redux/stage';

// The New UI battle HUD is a pure function from what the battle shows to HTML, in four layouts.

const ctx = (layout: number): ReduxCtx => ({ k: layout, skin: {} as ReduxCtx['skin'], v: () => layout });
const count = (html: string, bit: string): number => html.split(bit).length - 1;
const foe = (o: Partial<BattleBox> = {}): BattleBox => ({ name: 'Charizard', level: 'Lv 52', hp: 0.71, hpText: '', xp: null, tags: [], team: null, ...o });
const me = (o: Partial<BattleBox> = {}): BattleBox => ({ name: 'Lucario', level: 'Lv 50', hp: 1, hpText: '163 / 163', xp: 0.64, tags: [], team: null, ...o });
const cmd: BattleOption[] = [{ label: 'Fight' }, { label: 'Bag' }, { label: 'Pokémon' }, { label: 'Run', off: true }];
const moves: BattleOption[] = [{ label: 'Flamethrower', sub: 'PP 12/15', type: 'fire' }, { label: 'Dragon Claw', sub: 'PP 15/15', type: 'dragon' }, { label: 'Air Slash', sub: 'PP 9/15', type: 'flying' }, { label: 'Roost', sub: 'PP 0/5', type: 'flying', off: true }];
const model = (o: Partial<BattleModel> = {}): BattleModel => ({ foes: [foe()], mine: [me()], text: 'What will Lucario do?', menu: { options: cmd, index: 0 }, tabs: null, header: '', status: '', momentum: '', note: '', auto: false, party: { n: 6, out: 1 }, ...o });

describe('New UI battle HUD', () => {
  for (const layout of [0, 1, 2, 3]) {
    describe(`layout ${layout}`, () => {
      it('shows both Pokémon, the text and one button per choice, and reports a click by choice index', () => {
        const html = battleView(ctx(layout), model());
        for (const t of ['Charizard', 'Lv 52', 'Lucario', 'Lv 50', 'What will Lucario do?', 'Fight', 'Bag', 'Pokémon', 'Run']) expect(html).toContain(t);
        expect(count(html, 'data-act="pick"')).toBe(4);
        for (let i = 0; i < 4; i++) expect(html).toContain(`data-act="pick" data-arg="${i}"`);
        expect(count(html, 'class="btn on')).toBe(1);
        expect(html).toContain('width:71%');
        expect(html).toContain('width:100%');
      });

      it('draws a move with its type colour and PP, and dims one that cannot be used', () => {
        const html = battleView(ctx(layout), model({ menu: { options: moves, index: 2 }, text: 'Air Slash · Flying · Special · Power 75 · Acc 95\nPP 9/15' }));
        expect(count(html, ' mv"')).toBe(4);
        expect(html).toContain('<small>PP 12/15</small>');
        expect(count(html, 'opacity:.5;')).toBe(1);
        expect(html).toMatch(/class="btn on mv"[^>]*data-arg="2"/);
        // A second line of text is a real line break.
        expect(html).toContain('Acc 95<br>PP 9/15');
      });

      it('shows only the text box while something is being said', () => {
        const html = battleView(ctx(layout), model({ menu: null, text: 'Charizard used Flamethrower!' }));
        expect(count(html, 'data-act="pick"')).toBe(0);
        expect(html).toContain('Charizard used Flamethrower!');
      });

      it('shows the tabs with the page and Auto lit, and reports a click by tab index', () => {
        const tabs = { labels: ['Attack', 'Party', 'Item', 'Auto', 'i'], index: 1, auto: true, autoOff: false };
        const html = battleView(ctx(layout), model({ tabs }));
        expect(count(html, 'data-act="tab"')).toBe(5);
        expect(count(html, '<span class="on"')).toBe(2);
        expect(count(battleView(ctx(layout), model({ tabs: { ...tabs, index: -1, auto: false } })), '<span class="on"')).toBe(0);
        expect(battleView(ctx(layout), model({ tabs: { ...tabs, autoOff: true } }))).toContain('opacity:.45');
        expect(count(battleView(ctx(layout), model()), 'data-act="tab"')).toBe(0);
      });

      it('keeps every choice of a long menu, and survives a battle with nothing on the field yet', () => {
        const many = Array.from({ length: 9 }, (_, i) => ({ label: `Choice ${i + 1}` }));
        expect(count(battleView(ctx(layout), model({ menu: { options: many, index: 8 } })), 'data-act="pick"')).toBe(9);
        const empty = battleView(ctx(layout), model({ foes: [], mine: [], menu: null, text: '', party: null }));
        expect(count(empty, 'data-act="pick"')).toBe(0);
        expect(empty).not.toContain('Lucario');
      });

      it('keeps the HP bar between empty and full and never lets a name in as HTML', () => {
        const html = battleView(ctx(layout), model({ foes: [foe({ name: '<b>x</b>', hp: 7 })], mine: [me({ hp: -3, tags: ['<i>BRN</i>'] })], text: '<u>t</u>', header: '<s>h</s>', note: '<em>n</em>' }));
        for (const bad of ['<b>x</b>', '<i>BRN</i>', '<u>t</u>', '<s>h</s>', '<em>n</em>']) expect(html).not.toContain(bad);
        expect(html).toContain('width:100%');
        expect(html).toContain('width:0%');
        expect(html).not.toMatch(/width:-|width:700/);
      });

      it('shows the marks beside a name, the small lines over the field and the AUTO pin', () => {
        const html = battleView(ctx(layout), model({ mine: [me({ tags: ['BRN', 'Tera fire'] })], header: 'Stage 1 · ₽0', status: 'Sandstorm: 3 turns', momentum: 'MOMENTUM', note: 'Auto-Battle is on.', auto: true }));
        for (const t of ['BRN', 'Tera fire', 'Stage 1 · ₽0', 'Sandstorm: 3 turns', 'MOMENTUM', 'Auto-Battle is on.', 'AUTO ▶▶']) expect(html).toContain(t);
        expect(html).toContain('data-act="auto"');
        expect(battleView(ctx(layout), model())).not.toContain('AUTO');
      });

      it('gives every Pokémon of a double or triple battle its own small box', () => {
        const two = battleView(ctx(layout), model({ foes: [foe(), foe({ name: 'Gengar' })], mine: [me(), me({ name: 'Pikachu' })] }));
        for (const t of ['Charizard', 'Gengar', 'Lucario', 'Pikachu']) expect(two).toContain(t);
        expect(count(two, 'width:240px')).toBe(4);
        const three = battleView(ctx(layout), model({ foes: [foe(), foe({ name: 'Gengar' }), foe({ name: 'Gyarados' })], mine: [me(), me({ name: 'Pikachu' }), me({ name: 'Garchomp' })] }));
        expect(count(three, 'width:240px')).toBe(6);
      });
    });
  }

  it('shows a Trainer foe\'s team as balls with the fainted ones greyed (boxed layouts), and both teams under the top bar', () => {
    const html = battleView(ctx(1), model({ foes: [foe({ team: { n: 5, out: 2 } })] }));
    expect(count(html, 'class="ball')).toBe(5);
    expect(count(html, 'class="ball out"')).toBe(2);
    expect(count(battleView(ctx(1), model()), 'class="ball')).toBe(0);
    const bar = battleView(ctx(2), model({ foes: [foe({ team: { n: 3, out: 0 } })] }));
    expect(bar).toContain('class="vsx"');
    expect(count(bar, 'class="ball')).toBe(9);
    expect(count(bar, 'class="ball out"')).toBe(1);
    // More than six never draws more than six.
    expect(count(battleView(ctx(1), model({ foes: [foe({ team: { n: 9, out: 0 } })] })), 'class="ball')).toBe(6);
  });

  it('the tray grows with the menu so the box and tabs can sit over it', () => {
    for (const v of [0, 1, 3]) {
      expect(trayHeight(v, 8)).toBeGreaterThan(trayHeight(v, 4));
      expect(trayHeight(v, 4)).toBeGreaterThanOrEqual(trayHeight(v, 0));
    }
    expect(trayHeight(2, 4)).toBe(trayHeight(2, 9));
  });
});

const mon = (i: number, o: Partial<BattleListRow> = {}): BattleListRow => ({ label: `Mon ${i + 1}`, art: null, hp: 1 - i * 0.15, tag: '', off: false, ...o });
const thing = (i: number, o: Partial<BattleListRow> = {}): BattleListRow => ({ label: `Item ${i + 1}`, art: null, hp: null, tag: `×${i + 1}`, off: false, ...o });
const list = (o: Partial<BattleListModel> = {}): BattleListModel => ({ title: 'Switch to…', note: '', tabs: null, n: 6, row: (i) => mon(i), index: 0, ...o });

describe('New UI battle windows (Party and Item)', () => {
  it('lists the party under its title with an HP bar each, at the mock-up spot', () => {
    const html = battleListView(ctx(0), list());
    expect(html).toContain('Switch to…');
    expect(html).toContain('left:20px;top:92px;width:330px');
    expect(count(html, 'data-act="pick"')).toBe(6);
    expect(count(html, 'class="hp')).toBe(6);
    for (let i = 0; i < 6; i++) expect(html).toContain(`data-act="pick" data-arg="${i}"`);
    expect(html).not.toContain('class="tabs"');
    expect(html).not.toMatch(/\d+–\d+ of \d+/);
  });

  it('marks the focused row only, dims a row that cannot be picked, and shows a short mark', () => {
    const html = battleListView(ctx(0), list({ index: 2, row: (i) => mon(i, { off: i === 5, tag: i === 0 ? 'IN BATTLE' : i === 5 ? 'FNT' : '' }) }));
    expect(count(html, 'box-shadow:0 0 0 2px var(--acc)')).toBe(1);
    expect(html).toMatch(/box-shadow:0 0 0 2px var\(--acc\);"[^>]*data-arg="2"/);
    expect(count(html, 'opacity:.5;')).toBe(1);
    expect(html).toContain('IN BATTLE');
    expect(html).toContain('FNT');
  });

  it('a long mark gives the name room by shortening the HP bar', () => {
    expect(battleListView(ctx(0), list({ n: 1, row: (i) => mon(i, { tag: '✔ Revive 11 HP' }) }))).toContain('width:54px');
    expect(battleListView(ctx(0), list({ n: 1, row: (i) => mon(i, { tag: 'FNT' }) }))).toContain('width:90px');
  });

  it('the Item window shows pockets as tabs instead of a title, and counts the way the mock-up writes them', () => {
    const html = battleListView(ctx(0), list({ title: 'Bag', note: 'P pins to the hotbar', tabs: { labels: ['Medicine', 'Balls'], index: 1 }, n: 3, row: (i) => thing(i), back: true }));
    expect(count(html, 'data-act="tab"')).toBe(2);
    expect(html).toMatch(/class="on"[^>]*data-arg="1"/);
    expect(html).not.toContain('>Bag<');
    expect(html).toContain('× 2');
    expect(count(html, 'class="hp')).toBe(0);
    expect(html).toContain('P pins to the hotbar');
    expect(html).toContain('data-act="back"');
  });

  it('scrolls a long list with the cursor, says where it is, and asks only for the rows on screen', () => {
    const asked: number[] = [];
    const html = battleListView(ctx(0), list({ n: 40, index: 39, tabs: { labels: ['All'], index: 0 }, row: (i) => { asked.push(i); return thing(i); } }));
    expect(count(html, 'data-act="pick"')).toBe(BATTLE_LIST_ROWS);
    expect(html).toContain('data-arg="39"');
    expect(html).toContain('–40 of 40');
    expect(asked.length).toBe(BATTLE_LIST_ROWS);
    expect(battleListView(ctx(0), list({ n: 40, index: 0, row: (i) => thing(i) }))).toContain(`1–${BATTLE_LIST_ROWS} of 40`);
  });

  it('survives an empty pocket and a cursor out of range, and never lets a name in as HTML', () => {
    const none = battleListView(ctx(0), list({ n: 0, index: 4, tabs: { labels: ['Medicine'], index: 0 }, row: () => { throw new Error('no row to ask for'); } }));
    expect(count(none, 'data-act="pick"')).toBe(0);
    expect(none).toContain('Nothing here.');
    expect(count(none, 'data-act="tab"')).toBe(1);
    expect(count(battleListView(ctx(0), list({ index: 99 })), 'data-act="pick"')).toBe(6);
    expect(count(battleListView(ctx(0), list({ index: -3 })), 'data-act="pick"')).toBe(6);
    const html = battleListView(ctx(0), list({ title: '<b>t</b>', n: 1, row: (i) => mon(i, { label: '<i>x</i>', tag: '<u>m</u>' }) }));
    expect(html).not.toContain('<b>t</b>');
    expect(html).not.toContain('<i>x</i>');
    expect(html).not.toContain('<u>m</u>');
  });

  it('sits lower when several foes are out, and leaves the Back line out when the choice is forced', () => {
    expect(battleListView(ctx(0), list({ top: 144 }))).toContain('top:144px');
    expect(battleListView(ctx(0), list())).not.toContain('data-act="back"');
  });

  it('splits a title from the words in brackets', () => {
    expect(windowTitle('Bag  (P pins to the hotbar)')).toEqual({ title: 'Bag', note: 'P pins to the hotbar' });
    expect(windowTitle('Switch to…')).toEqual({ title: 'Switch to…', note: '' });
    expect(windowTitle('  ')).toEqual({ title: '', note: '' });
  });
});

describe('New UI battle info panel, log and transform buttons', () => {
  it('sorts a panel column into type chips, short rows and lines, keeping the first lines on top', () => {
    const p = panelOf('Opposing Pokémon', 'Pikipek Lv.7\nType: Normal / Flying\nAbility: not shown yet\nCatch odds (plain ball): 44% now, 44% at full health\n\nStats: Atk +2 · Def +1');
    expect(p.head).toBe('Opposing Pokémon');
    expect(p.chips).toEqual(['Normal', 'Flying']);
    expect(p.lead).toEqual(['Pikipek Lv.7']);
    expect(p.facts).toEqual([['Ability', 'not shown yet'], ['Stats', 'Atk +2 · Def +1']]);
    expect(p.lines).toEqual(['Catch odds (plain ball): 44% now, 44% at full health']);
  });

  it('keeps plain text as lines when there are no rows, and survives empty text', () => {
    expect(panelOf('What it does', 'A physical attack.\nIt may flinch.')).toEqual({ head: 'What it does', chips: [], facts: [], lines: ['A physical attack.', 'It may flinch.'] });
    expect(panelOf('Battlefield', '')).toEqual({ head: 'Battlefield', chips: [], facts: [], lines: [] });
  });

  for (const layout of [0, 1, 2, 3]) {
    it(`layout ${layout}: the info panel shows one window per section and closes on a click`, () => {
      const panels = [panelOf('Battlefield', 'Momentum 0'), panelOf('Your Pokémon', 'Lucario Lv.50\nType: Fighting / Steel\nAbility: Inner Focus')];
      const html = battleView(ctx(layout), model({ panels, panelAt: 'left' }));
      for (const t of ['Battlefield', 'Momentum 0', 'Your Pokémon', 'Lucario Lv.50', 'Inner Focus', 'Fighting', 'Steel']) expect(html).toContain(t);
      expect(count(html, 'data-act="info"')).toBe(1);
      expect(count(html, 'class="ty"')).toBe(2);
      expect(html).toContain('left:20px;top:92px');
    });

    it(`layout ${layout}: the log shows its filter tabs, the open one lit, and its lines`, () => {
      const html = battleView(ctx(layout), model({ log: { tabs: ['All', 'Damage', 'Status'], index: 1, lines: ['Lucario used Aura Sphere!', 'It hit <hard>'] } }));
      expect(count(html, 'data-act="log"')).toBe(3);
      expect(html).toMatch(/class="on"[^>]*data-act="log" data-arg="1"/);
      expect(html).toContain('Lucario used Aura Sphere!');
      expect(html).not.toContain('<hard>');
      expect(battleView(ctx(layout), model({ log: { tabs: ['All'], index: 0, lines: [] } }))).toContain('Nothing here yet.');
    });

    it(`layout ${layout}: the transform buttons show the ones on offer, with the chosen one lit`, () => {
      const html = battleView(ctx(layout), model({ menu: { options: moves, index: 0 }, gim: [{ kind: 'mega', on: false }, { kind: 'tera', on: true, row: 3 }, { kind: 'dynamax', on: false }, { kind: 'zmove', on: false }] }));
      expect(count(html, 'data-act="gim"')).toBe(4);
      for (const t of ['Mega', 'Tera', 'Dynamax', 'Z-Move']) expect(html).toContain(t);
      expect(html).toMatch(/class="btn on"[^>]*data-act="gim" data-arg="1"/);
      expect(count(html, 'data-act="pick"')).toBe(4);
    });
  }

  it('a single move shows as the tooltip window with its type chip beside the name', () => {
    const tip = { head: 'Flamethrower', chips: ['fire'], facts: [['Category', 'Special'], ['Power / Accuracy', '90 / 100']] as [string, string][], lines: ['May burn the target.'] };
    const html = battleView(ctx(0), model({ panels: [tip], panelAt: 'tip' }));
    expect(html).toContain('right:60px;bottom:');
    expect(html).toContain('width:330px');
    for (const t of ['Flamethrower', 'Fire', 'Special', '90 / 100', 'May burn the target.']) expect(html).toContain(t);
    expect(html).not.toContain('left:20px;top:92px;height');
  });

  it('draws nothing extra when no panel, log or transformation is open, and never lets their text in as HTML', () => {
    const plain = battleView(ctx(0), model());
    for (const a of ['info', 'log', 'gim']) expect(plain).not.toContain(`data-act="${a}"`);
    expect(battleView(ctx(0), model({ panels: [], gim: [], log: null }))).toBe(plain);
    const html = battleView(ctx(0), model({ panels: [{ head: '<b>h</b>', tag: '<i>t</i>', chips: [], lead: ['<u>l</u>'], facts: [['<s>k</s>', '<em>v</em>']], lines: ['<p>x</p>'] }] }));
    for (const t of ['<b>h</b>', '<i>t</i>', '<u>l</u>', '<s>k</s>', '<em>v</em>', '<p>x</p>']) expect(html).not.toContain(t);
  });
});

describe('New UI battle field tags, Shadow tray and Exp panel', () => {
  it('reads the note in brackets off a target choice', () => {
    expect(splitChoice('▶ Charizard (best)')).toEqual({ label: 'Charizard', sub: 'best' });
    expect(splitChoice('Pikachu (ally, left)')).toEqual({ label: 'Pikachu', sub: 'ally, left' });
    expect(splitChoice('Gengar (Centre)')).toEqual({ label: 'Gengar', sub: 'Centre' });
    expect(splitChoice('Gengar')).toEqual({ label: 'Gengar' });
    expect(splitChoice('▶ Gengar')).toEqual({ label: 'Gengar' });
    expect(splitChoice('')).toEqual({ label: '' });
  });

  it('puts a tag over the field for each mark, and none without marks', () => {
    const html = battleView(ctx(0), model({ marks: [{ x: 648.4, y: 90, text: 'TARGET' }, { x: 778, y: 110, text: 'OUT OF REACH' }] }));
    expect(html).toContain('left:648px;top:90px');
    expect(html).toContain('>TARGET<');
    expect(html).toContain('>OUT OF REACH<');
    expect(battleView(ctx(0), model())).not.toContain('TARGET');
  });

  for (const layout of [0, 1, 2, 3]) {
    it(`layout ${layout}: a Shadow Pokémon turns the tray purple and darkens the edges; others do not`, () => {
      const html = battleView(ctx(layout), model({ shadow: true }));
      expect(html).toContain('--acc:#c070ff');
      expect(html).toContain('radial-gradient(#0000 40%,#3a0a5a90)');
      expect(count(html, 'data-act="pick"')).toBe(4);
      const plain = battleView(ctx(layout), model());
      expect(plain).not.toContain('--acc:#c070ff');
      expect(plain).not.toContain('radial-gradient(#0000 40%');
    });

    it(`layout ${layout}: the Exp panel lists who earned Exp, lights a level up, and the run header steps aside`, () => {
      const exp = [{ name: 'Charizard', file: null, text: 'Level up! 51', xp: 0.92, up: true }, { name: '<b>Lucario</b>', file: null, text: '+412 Exp', xp: 0.4, up: false }];
      const html = battleView(ctx(layout), model({ menu: null, text: 'You defeated Hiker Marcos!', header: 'Stage 3', exp }));
      expect(html).toContain('right:20px;top:20px;width:330px');
      expect(html).toContain('Level up! 51');
      expect(html).toContain('+412 Exp');
      expect(count(html, 'win sel')).toBe(1);
      expect(html).not.toContain('<b>Lucario</b>');
      expect(html).not.toContain('Stage 3');
      expect(battleView(ctx(layout), model({ header: 'Stage 3', exp: [] }))).toContain('Stage 3');
    });
  }

  it('packs more than four Exp rows tighter so they stay over the field', () => {
    const row = (i: number) => ({ name: `Mon ${i}`, file: null, text: '+10 Exp', xp: 0.5, up: false });
    expect(battleView(ctx(0), model({ exp: [0, 1, 2, 3].map(row) }))).toContain('padding:6px 10px');
    expect(battleView(ctx(0), model({ exp: [0, 1, 2, 3, 4, 5].map(row) }))).toContain('padding:3px 10px');
  });

  it('stacks your Pokémon upwards from the tray in a double battle, the first one lowest', () => {
    const html = battleView(ctx(0), model({ foes: [foe(), foe({ name: 'Gengar' })], mine: [me(), me({ name: 'Pikachu' })] }));
    const at = (name: string): number => Number(/bottom:(\d+)px/.exec(html.slice(html.lastIndexOf('<div class="win', html.indexOf(`>${name}<`))))?.[1]);
    expect(at('Pikachu')).toBe(at('Lucario') + 58);
  });
});

describe('New UI level-up window and evolution picture', () => {
  const level = { name: 'Lucario', file: null, from: 50, to: 51, stats: [['HP', 163, 3], ['Attack', 148, 4], ['Defense', 96, 2], ['Sp. Atk', 151, 4], ['Sp. Def', 95, 1], ['Speed', 127, 0]] as [string, number, number][] };

  it('shows the Pokémon, its level step and what each stat gained, over a dimmed field', () => {
    const html = levelView(ctx(0), level);
    for (const t of ['Lucario', 'Lv 50 → 51', 'Attack', '148', '+4', 'Speed', '+0']) expect(html).toContain(t);
    expect(html).toContain('class="shade"');
    expect(count(html, 'class="row"')).toBe(7);
    expect(html).toContain('right:30px;top:50px;width:340px');
    expect(levelView(ctx(1), level)).toContain('left:310px;top:50px;width:340px');
    expect(levelView(ctx(0), { ...level, name: '<b>x</b>' })).not.toContain('<b>x</b>');
  });

  for (const layout of [0, 1, 2, 3]) {
    it(`layout ${layout}: the battle shows the level window in place of the Exp panel and the run header`, () => {
      const exp = [{ name: 'Lucario', file: null, text: 'Level up! 51', xp: 0.1, up: true }];
      const html = battleView(ctx(layout), model({ menu: null, text: 'Lucario grew to Lv. 51!', header: 'Stage 3', level, exp }));
      expect(html).toContain('Lv 50 → 51');
      expect(html).toContain('Lucario grew to Lv. 51!');
      expect(html).not.toContain('Level up! 51');
      expect(html).not.toContain('Stage 3');
    });

    it(`layout ${layout}: an evolution takes the whole picture, with the battle's words under it`, () => {
      const html = battleView(ctx(layout), model({ text: 'What? Charmeleon is evolving!', evolve: { from: null, to: null, done: false } }));
      expect(html).toContain('class="burst"');
      expect(html).toContain('What? Charmeleon is evolving!');
      // No boxes, no menu: the picture is alone on the screen.
      expect(html).not.toContain('win glass');
      expect(html).not.toContain('data-act="pick"');
    });
  }

  it('the side-by-side layout draws the arrow between the two forms; the other shows one Pokémon alone', () => {
    expect(evolveView(ctx(1), { from: null, to: null, done: true }, 'x')).toContain('→');
    expect(evolveView(ctx(0), { from: null, to: null, done: true }, 'x')).not.toContain('→');
    expect(evolveView(ctx(0), { from: null, to: null, done: true }, 'a <b>b</b>\nc')).toContain('a &lt;b&gt;b&lt;/b&gt;<br>c');
  });
});

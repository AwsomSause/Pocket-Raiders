import { describe, expect, it } from 'vitest';
import { battleView, trayHeight, type BattleBox, type BattleModel, type BattleOption } from '../../src/ui/redux/screens/battle';
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

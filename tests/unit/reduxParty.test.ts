import { describe, expect, it } from 'vitest';
import { partyCols, partyView, summaryView, type PartyCard, type PartyModel, type SummaryBody, type SummaryModel } from '../../src/ui/redux/screens/party';
import type { ReduxCtx } from '../../src/ui/redux/stage';

// The New UI Party and Summary are pure functions from a model to HTML: every layout must show every Pokémon,
// report clicks by party index, and never let a name in as HTML.

const ctx = (layout: number): ReduxCtx => ({ k: layout, skin: {} as ReduxCtx['skin'], v: () => layout });
const card = (name: string, over: Partial<PartyCard> = {}): PartyCard => ({ name, file: null, level: 12, hp: 30, maxHp: 40, held: '', tag: '', types: ['fire'], ability: 'Blaze', nature: 'Timid', moves: [{ name: 'Ember', type: 'fire' }], off: false, ...over });
const party = (over: Partial<PartyModel> = {}): PartyModel => ({ title: 'Party', hints: [['Enter', 'summary']], index: 0, text: 'Choose a Pokémon.', mons: ['Charizard', 'Lucario', 'Gengar', 'Gyarados', 'Garchomp', 'Pikachu'].map((n) => card(n)), ...over });
const count = (html: string, bit: string): number => html.split(bit).length - 1;

describe('New UI Party', () => {
  for (const layout of [0, 1, 2]) {
    describe(`layout ${layout}`, () => {
      it('shows all six Pokémon and reports a click by party index', () => {
        const html = partyView(ctx(layout), party());
        expect(count(html, 'data-act="pick"')).toBe(6);
        for (const n of ['Charizard', 'Lucario', 'Gengar', 'Gyarados', 'Garchomp', 'Pikachu']) expect(html).toContain(n);
        for (let i = 0; i < 6; i++) expect(html).toContain(`data-act="pick" data-arg="${i}"`);
        expect(html).toContain('Choose a Pokémon.');
      });

      it('works with one Pokémon, and with none', () => {
        expect(count(partyView(ctx(layout), party({ mons: [card('Solo')] })), 'data-act="pick"')).toBe(1);
        const none = partyView(ctx(layout), party({ mons: [], text: 'No Pokémon.' }));
        expect(count(none, 'data-act="pick"')).toBe(0);
        expect(none).toContain('No Pokémon.');
      });

      it('keeps a cursor that is out of range from breaking the page, and never lets a name in as HTML', () => {
        const html = partyView(ctx(layout), party({ index: 99, mons: [card('<b>x</b>', { held: '<i>y</i>' }), card('Two')] }));
        expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
        expect(html).not.toContain('<b>x</b>');
        expect(html).not.toContain('<i>y</i>');
      });
    });
  }

  it('says Fainted and dims a Pokémon with no HP in the card layout, and shows what the others hold', () => {
    const html = partyView(ctx(0), party({ mons: [card('Lead'), card('Down', { hp: 0 }), card('Holder', { held: 'Focus Sash' })], index: 0 }));
    expect(html).toContain('Fainted');
    expect(html).toContain('class="win dim"');
    expect(html).toContain('◆ Focus Sash');
    expect(html).toContain('30 / 40');
  });

  it('moves the cursor three across only in the grid layout', () => {
    expect([0, 1, 2].map((l) => partyCols(ctx(l)))).toEqual([1, 3, 1]);
  });
});

const face = { name: 'Charizard', file: null, art: null, level: 52, gender: '♂', types: ['fire', 'flying'], no: 'No. 006', held: 'Holding 3 items', hpPct: 84, xpPct: 64 };
const summary = (body: SummaryBody, over: Partial<SummaryModel> = {}): SummaryModel => ({ title: 'Summary', hints: [['Esc', 'back']], face, tabs: ['Overview', 'Stats', 'Moves', 'Items', 'Bond', 'History', 'Traits'], tab: 0, itemsTab: 3, body, text: 'Charizard: Ready.', menu: null, ...over });
const overview: SummaryBody = { kind: 'overview', ability: { name: 'Blaze', text: 'Powers up Fire moves.' }, facts: [['Nature', 'Timid']], note: 'No status condition.', moves: [{ name: 'Flamethrower', type: 'fire' }] };

describe('New UI Summary', () => {
  for (const layout of [0, 1]) {
    describe(`layout ${layout}`, () => {
      it('shows the Pokémon, all seven tabs (each clickable) and the text box', () => {
        const html = summaryView(ctx(layout), summary(overview));
        for (const t of ['Charizard', 'Lv 52 ♂', 'No. 006', 'Holding 3 items', 'Blaze', 'Timid', 'Flamethrower', 'Charizard: Ready.']) expect(html).toContain(t);
        for (let k = 0; k < 7; k++) expect(html).toContain(`data-act="tab" data-arg="${k}"`);
      });

      it('draws each kind of tab', () => {
        const stats = summaryView(ctx(layout), summary({ kind: 'stats', rows: [{ label: 'Speed', value: 152, pct: 76, iv: '31', ev: 252, up: true, perfect: true, delta: '+12' }], foot: 'EVs 508/510', versus: '± is against Lucario.' }, { tab: 1 }));
        for (const t of ['Speed ▲', '152', '252', '+12', 'EVs 508/510', '± is against Lucario.']) expect(stats).toContain(t);
        const moves = summaryView(ctx(layout), summary({ kind: 'moves', moves: [{ name: 'Flamethrower', type: 'fire', pp: '12/15' }, { name: 'Roost', type: 'flying', pp: '5/5' }], cursor: 1, facts: [['Power / Accuracy', '— / —']], lines: ['• Heals half its HP.'] }, { tab: 2 }));
        expect(count(moves, 'data-act="cursor"')).toBe(2);
        for (const t of ['PP 12/15', 'Roost', '• Heals half its HP.']) expect(moves).toContain(t);
        const items = summaryView(ctx(layout), summary({ kind: 'items', summary: '3 of 3 slots', items: [{ name: 'Shell Bell', art: null, mode: 'Always on', text: 'Heals a little.' }], cursor: 0, lines: ['Heals 1/8 of the damage dealt.'], takeOff: true }, { tab: 3 }));
        for (const t of ['Shell Bell', 'Heals 1/8 of the damage dealt.', 'data-act="takeoff"']) expect(items).toContain(t);
        const text = summaryView(ctx(layout), summary({ kind: 'text', head: 'Steady', bars: [{ label: 'Trust', value: 55 }], sections: [{ title: 'Mood', lines: ['It follows your lead.'] }, { title: 'Friendships', lines: ['None yet.'], side: true }] }, { tab: 4 }));
        for (const t of ['Steady', 'Trust', 'width:55%', 'It follows your lead.', 'None yet.']) expect(text).toContain(t);
      });

      it('says so when there are no moves or items, and hides Take off when it is not allowed', () => {
        expect(summaryView(ctx(layout), summary({ kind: 'moves', moves: [], cursor: 0, facts: [], lines: [] }))).toContain('No moves.');
        const none = summaryView(ctx(layout), summary({ kind: 'items', summary: 'Empty', items: [], cursor: 0, lines: [], takeOff: false }));
        expect(none).toContain('holds nothing');
        expect(none).not.toContain('data-act="takeoff"');
      });

      it('lays the action menu over the screen, scrolls a long one with the cursor, and reports clicks by option index', () => {
        const options = Array.from({ length: 30 }, (_, i) => ({ label: `Action ${i + 1}`, off: i === 1 }));
        const top = summaryView(ctx(layout), summary(overview, { menu: { options, index: 0 } }));
        expect(count(top, 'data-act="menu"')).toBe(9);
        expect(top).toContain('1 of 30');
        const end = summaryView(ctx(layout), summary(overview, { menu: { options, index: 29 } }));
        expect(end).toContain('Action 30');
        expect(end).toContain('data-act="menu" data-arg="29"');
        expect(end).not.toContain('>Action 1<');
        expect(count(summaryView(ctx(layout), summary(overview)), 'data-act="menu"')).toBe(0);
      });

      it('never lets text in as HTML', () => {
        const html = summaryView(ctx(layout), summary({ ...overview, note: '<script>x</script>' } as SummaryBody, { face: { ...face, name: '<b>N</b>' } }));
        expect(html).not.toContain('<script>');
        expect(html).not.toContain('<b>N</b>');
      });
    });
  }
});

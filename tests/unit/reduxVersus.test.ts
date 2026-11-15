import { describe, expect, it } from 'vitest';
import { versusView, type VersusModel } from '../../src/ui/redux/screens/versus';
import { battleView } from '../../src/ui/redux/screens/battle';
import type { ReduxCtx } from '../../src/ui/redux/stage';

// The New UI battle opening (the versus card) is a pure function from who is fighting to HTML, in four layouts.

const ctx = (layout: number): ReduxCtx => ({ k: layout, skin: {} as ReduxCtx['skin'], v: () => layout });
const count = (html: string, bit: string): number => html.split(bit).length - 1;
const vs = (o: Partial<VersusModel> = {}): VersusModel => ({ name: 'Lenora', role: 'Gym Leader', cast: null, line: 'Let us see how much you have studied.', evil: false, team: 4, lead: null, player: null, playerName: 'Kice', party: [null, null, null], backdrop: null, ...o });

describe('New UI versus card', () => {
  for (const layout of [0, 1, 2, 3]) {
    it(`layout ${layout}: names the foe with its role, and a click anywhere moves on`, () => {
      const html = versusView(ctx(layout), vs());
      expect(html).toContain('Lenora');
      expect(html).toContain('Gym Leader');
      expect(count(html, 'data-act="next"')).toBe(1);
    });

    it(`layout ${layout}: leaves the role out when there is none, and never lets a name in as HTML`, () => {
      const html = versusView(ctx(layout), vs({ role: '', name: '<b>N</b>', playerName: '<i>P</i>', line: '<u>q</u>' }));
      expect(html).not.toContain('class="plate"');
      expect(html).not.toContain('class="tg" style="align-self:flex-start"');
      for (const t of ['<b>N</b>', '<i>P</i>', '<u>q</u>']) expect(html).not.toContain(t);
    });
  }

  it('the split screen shows VS, the player with a ball per party member, and turns dark red for a villain', () => {
    const html = versusView(ctx(0), vs());
    expect(html).toContain('class="abs vsx"');
    expect(html).toContain('Kice');
    expect(count(html, 'class="ball"')).toBe(3);
    expect(html).not.toContain('#3a1028');
    expect(versusView(ctx(0), vs({ evil: true }))).toContain('#3a1028');
  });

  it('the name band shows a ball per foe Pokémon (six at most) and its own backdrop for a villain', () => {
    expect(count(versusView(ctx(1), vs()), 'class="ball"')).toBe(4);
    expect(count(versusView(ctx(1), vs({ team: 40 })), 'class="ball"')).toBe(6);
    expect(count(versusView(ctx(1), vs({ team: -2 })), 'class="ball"')).toBe(0);
    expect(versusView(ctx(1), vs())).toContain('#ffd030');
    expect(versusView(ctx(1), vs({ evil: true }))).toContain('#4a1018');
  });

  it('the arena shot letterboxes the picture, quotes the line and lights the Anticipation beat', () => {
    const html = versusView(ctx(2), vs());
    expect(count(html, 'class="bars"')).toBe(2);
    expect(html).toContain('“Let us see how much you have studied.”');
    expect(count(html, '<i class="on">')).toBe(2);
    expect(html).toContain('Anticipation');
    expect(versusView(ctx(2), vs({ line: '' }))).not.toContain('“');
  });

  it('the cards show the foe with the Pokémon about to come out and the rest as balls, and you as the Challenger', () => {
    const html = versusView(ctx(3), vs({ lead: null, team: 4 }));
    expect(count(html, 'class="abs win row"')).toBe(2);
    expect(html).toContain('Challenger');
    expect(html).toContain('Kice');
    expect(count(html, 'class="ball"')).toBe(4);
    // With the lead's picture known, it takes one ball's place.
    expect(count(versusView(ctx(3), vs({ lead: 'pokemon/6', team: 4 })), 'class="ball"')).toBe(3);
  });

  it('shrinks a long name so it stays on its line', () => {
    expect(versusView(ctx(1), vs({ name: 'Lenora' }))).toContain('font-size:60px');
    expect(versusView(ctx(1), vs({ name: 'Wallace the 2nd' }))).toContain('font-size:36px');
  });
});

describe('New UI battle HUD before anyone is out', () => {
  it('the top-bar layout draws no empty bar while the opening plays', () => {
    const empty = { foes: [], mine: [], text: '', menu: null, tabs: null, header: '', status: '', momentum: '', note: '', auto: false, party: { n: 3, out: 0 } };
    expect(battleView(ctx(2), empty)).not.toContain('VS');
    expect(battleView(ctx(2), empty)).not.toContain('class="ball');
  });
});

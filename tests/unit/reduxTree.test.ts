import { describe, expect, it } from 'vitest';
import { treeView, type TreeModel } from '../../src/ui/redux/screens/tree';
import type { ReduxCtx } from '../../src/ui/redux/stage';

// New UI: the hub's Research Tree as the mock-ups' tree page: a row per branch, bought nodes plain, the cursor lit, the rest dimmed.

const ctx: ReduxCtx = { k: 0, skin: {} as ReduxCtx['skin'], v: () => 0 };
const model = (o: Partial<TreeModel> = {}): TreeModel => ({
  title: 'Research Tree', chips: ['20 Research Points'], cols: 4, index: 1,
  rows: [
    { name: 'Field Craft', cells: [{ label: 'Field Notes', state: 'owned' }, { label: 'Trail Rations', state: 'open' }, { label: 'Ball Satchel', state: 'locked' }, { label: 'Scout Fund', state: 'locked' }] },
    { name: 'Archive', cells: [{ label: 'Region Notes', state: 'open' }, { label: 'League Files', state: 'locked' }, { label: 'Full Dossier', state: 'locked' }, { label: '', state: 'none' }] },
  ],
  card: { name: 'Trail Rations', line: 'Start with 2 more Potions.', facts: [['Cost', '40 Research Points'], ['Have', '20']], button: 'Unlock', ready: false },
  text: 'Start with 2 more Potions.', ...o,
});
const count = (html: string, bit: string): number => html.split(bit).length - 1;

describe('New UI research tree page', () => {
  it('draws every branch with its name and every node, and a pick for each real node (the padding has none)', () => {
    const html = treeView(ctx, model());
    for (const bit of ['Field Craft', 'Archive', 'Field Notes', 'Scout Fund', 'Full Dossier', '20 Research Points', 'Start with 2 more Potions.', '40 Research Points']) expect(html).toContain(bit);
    // Seven nodes on the grid, plus the Unlock button.
    expect(count(html, 'data-act="pick"')).toBe(8);
    expect(html).toContain('data-arg="6"');
    expect(html).not.toContain('data-arg="7"');
  });
  it('lights the cursor, leaves bought nodes plain and dims the rest; Unlock is lit only when it can be bought', () => {
    const html = treeView(ctx, model());
    expect(html).toMatch(/class="win sel"[^>]*data-act="pick" data-arg="1"/);
    expect(html).toMatch(/class="win "[^>]*data-act="pick" data-arg="0"/);
    expect(html).toMatch(/class="win dim"[^>]*data-act="pick" data-arg="2"/);
    expect(html).not.toContain('btn on');
    expect(treeView(ctx, model({ card: { ...model().card, ready: true } }))).toContain('btn on');
  });
});

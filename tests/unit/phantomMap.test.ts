import { describe, expect, it } from 'vitest';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { pageOf } from '../../src/ui/phantom/kit';
import { phMap, phNodeMenu, phPause, stageOf } from '../../src/ui/phantom/screens/map';
import type { MapModel, MapNodeView } from '../../src/ui/redux/screens/map';

// The Phantom UI's stage map, pause menu and node menu: pure functions from the New UI map's model to HTML.

const ph = PHANTOM_VERSIONS[0]!;
const count = (html: string, bit: string | RegExp): number => html.split(bit).length - 1;
const node = (id: string, col: number, row: number, rows: number, over: Partial<MapNodeView> = {}): MapNodeView => ({ id, col, row, rows, kind: 'wild', fog: false, visited: false, cur: false, go: false, dim: false, harder: false, opt: -1, sides: [], marks: [], title: `Stop ${id}`, text: 'Wild Pokémon', ...over });
const model = (over: Partial<MapModel> = {}): MapModel => ({
  title: 'Unova · Stage 1', chips: ['Stage 1 / 8', 'Gym in 30 stops', '₽ 1,200', 'Day 1 · Morning', 'High tide', 'Badges 0', 'Level cap 13'], types: ['water'], lines: ['Lily Pad Lake (Water / Grass) · Gym Leader Archie'],
  party: [{ file: null, hp: 80, label: 'Torchic Lv 5' }, { file: null, hp: 0, label: 'Mudkip Lv 5' }], eggs: ['2 stops'], art: null, trainer: null, columns: 30, column: 1,
  nodes: [
    node('a', 1, 0, 1, { cur: true, visited: true }),
    node('b', 2, 0, 2, { opt: 0, go: true, sides: [{ kind: 'shop', used: false }], marks: [['! harder', '#c9f']], harder: true }),
    node('c', 2, 1, 2, { opt: 1, go: true }),
    node('d', 3, 0, 1, { fog: true }),
    ...Array.from({ length: 8 }, (_, k) => node(`x${k}`, 4 + k, 0, 1, { fog: true })),
  ],
  edges: [{ a: 'a', b: 'b', open: true, walked: false }, { a: 'a', b: 'c', open: true, walked: false }, { a: 'b', b: 'd', open: false, walked: false }, { a: 'x6', b: 'x7', open: false, walked: false }],
  buttons: [{ label: 'Party', opt: 2, hot: false }, { label: 'Bag', opt: 3, hot: true }], keys: [['C', 'cry']], hints: [['L', 'legend'], ['Enter', 'go']],
  index: 0, info: 'Level 1: Wild Pokémon', notice: '', going: null, banner: null, legend: null, card: null, ...over,
});

describe('Phantom stage map', () => {
  it('reads the stage, how many there are and the region from the title and the chips', () => {
    expect(stageOf('Unova · Stage 1', ['Stage 1 / 8', '₽ 0'])).toEqual({ no: '1', of: '8', region: 'Unova' });
    expect(stageOf('Safari Zone', [])).toEqual({ no: '', of: '', region: 'Safari Zone' });
  });

  it('shows six stops across, the lit stop once, and only the roads between stops on screen', () => {
    const html = phMap(ph, model());
    expect(pageOf(html)).toBe('map');
    expect(count(html, 'class="nd ph-nd')).toBe(7); // columns 1 to 6: a, b, c, d and three more
    expect(count(html, /class="nd ph-nd sel/)).toBe(1);
    expect(count(html, /class="nd ph-nd here/)).toBe(1);
    expect(count(html, 'class="ln"')).toBe(3);
    expect(count(html, 'class="ln2 far"')).toBe(1);
    expect(html).toContain('<div class="wallet"><small>MONEY</small>₽1,200</div>');
    expect(html).toContain('<b>1</b><div>Stage<span>of 8</span></div><strong>Unova</strong><i class="sm">DAY 1 · MORNING · HIGH TIDE</i>');
  });

  it('keeps every fact of the game on the page: chips, eggs, side stops, marks, the stage lines, buttons and keys', () => {
    const html = phMap(ph, model());
    for (const t of ['Gym in 30 stops', 'Badges 0', 'Level cap 13', 'Stop 1 / 30', 'Egg 2 stops', '! harder', 'Lily Pad Lake', 'Level 1: Wild Pokémon']) expect(html).toContain(t);
    expect(count(html, 'class="ph-side')).toBe(1);
    expect(html).toMatch(/<span class=" hot"[^>]*data-arg="3"[^>]*>Bag</);
    expect(html).toMatch(/data-act="key" data-arg="C"/);
    expect(html).toMatch(/data-act="legend"/);
    expect(count(html, 'data-tip="mon:')).toBe(2);
  });

  it('a lit button fills the card instead of a stop; the window follows the trainer down the road', () => {
    const html = phMap(ph, model({ index: 2 }));
    expect(html).toContain('ON THIS MAP');
    expect(html).toMatch(/<span class="on"[^>]*>Party</);
    const far = phMap(ph, model({ column: 9, nodes: model().nodes.map((n) => ({ ...n, cur: n.id === 'x5' })) }));
    expect(far).toContain('data-key="nx5"');
    expect(far).not.toContain('data-key="na"');
  });

  it('the stage banner, the legend and a notice stand over the map; text from data is escaped', () => {
    const html = phMap(ph, model({ notice: '<b>Careful</b>', banner: { top: 'Stage 1', title: 'Lily Pad Lake', sub: 'Gym Leader Archie waits.', plan: ['Catch 2', 'Win 3'] }, legend: [{ glyph: 'W', color: '#3a3', text: 'Wild Pokémon' }] }));
    expect(html).toContain('ph-mban');
    expect(count(html, '<li>')).toBe(2);
    expect(html).toContain('ph-mleg');
    expect(html).not.toContain('<b>Careful</b>');
  });
});

describe('Phantom pause and node menu', () => {
  it('the pause page lists every choice, lights one, dims a closed one and resumes on a click beside them', () => {
    const html = phPause(ph, { options: [{ label: 'Resume' }, { label: 'Party' }, { label: 'End run', off: true }], index: 2, note: 'Only an Adventure run can be ended here.', where: 'Stage 1 / 8 · Unova', facts: [['Money', '₽1,200']], party: [{ file: null, hp: 40 }] });
    expect(pageOf(html)).toBe('pause');
    expect(count(html, /class="h[ "]/)).toBe(3);
    expect(html).toMatch(/class="h on off"[^>]*data-arg="2"/);
    expect(html).toMatch(/class="ph-resume" data-act="pause" data-arg="-1"/);
    expect(html).toContain('<b>MONEY</b>₽1,200');
    expect(html).toContain('Only an Adventure run can be ended here.');
  });

  it('the node menu: a card per stop, the cursor lifted, a required stop marked', () => {
    const html = phNodeMenu({ header: 'Wild battle', index: 1, cards: [{ kind: 'Shop', color: '#e8892a', name: 'Poké Mart', text: 'Buy items.', status: 'Optional', off: false, must: false }, { kind: 'Rest', color: '#3a3', name: 'Camp', text: 'Heal up.', status: 'Required', off: false, must: true }] });
    expect(count(html, 'class="pn ph-nmc')).toBe(2);
    expect(html).toMatch(/class="pn ph-nmc lt on"[^>]*data-arg="1"/);
    expect(count(html, 'class="must"')).toBe(1);
    expect(html).toContain('Wild battle: done');
  });
});

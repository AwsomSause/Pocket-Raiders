import { describe, expect, it } from 'vitest';
import { PHANTOM_SETTINGS_PAGES } from '../../src/core/presentation/phantom';
import { PHANTOM_PAGE_GROUPS, PHANTOM_PAGE_LIST, pageGroupStep } from '../../src/core/presentation/phantomPages';
import { pageOf } from '../../src/ui/phantom/kit';
import { phPageIndex } from '../../src/ui/phantom/screens/settings';

describe('Phantom UI: the page directory', () => {
  it('has the mock-ups’ ten groups, and every page has a name, its own id and a line that says where it is', () => {
    expect(PHANTOM_PAGE_GROUPS.map((g) => g.n)).toEqual(['Start', 'Battle', 'Run', 'Menus', 'Settings', 'Town', 'People', 'Moments', 'Evil Mode', 'Finale']);
    expect(PHANTOM_PAGE_LIST).toHaveLength(PHANTOM_PAGE_GROUPS.reduce((n, g) => n + g.pages.length, 0));
    expect(new Set(PHANTOM_PAGE_LIST.map((p) => p.id)).size).toBe(PHANTOM_PAGE_LIST.length);
    for (const p of PHANTOM_PAGE_LIST) {
      expect(p.n.trim(), p.id).not.toBe('');
      expect(p.where, p.id).toMatch(/^[A-Z].*\.$/);
    }
    // The mock-ups list 82 pages; the game's Settings has two more pages of its own (Story, Save and data).
    expect(PHANTOM_PAGE_LIST).toHaveLength(84);
  });

  it('every page Settings can open is a real Settings page, and every Settings page is listed', () => {
    const real = new Set<string>([...PHANTOM_SETTINGS_PAGES.map((p) => p.id), 'home', 'version', 'reel']);
    const opens = PHANTOM_PAGE_LIST.flatMap((p) => (p.open ? [p.open] : []));
    for (const o of opens) expect(real.has(o), o).toBe(true);
    for (const p of PHANTOM_SETTINGS_PAGES) expect(opens, p.id).toContain(p.id);
    expect(new Set(opens).size).toBe(opens.length);
    // Evil Mode pages cannot be opened yet, and say so.
    for (const p of PHANTOM_PAGE_GROUPS[8]!.pages) { expect(p.open).toBeUndefined(); expect(p.where).toBe('Comes with the Evil Mode update.'); }
  });

  it('left and right go to the first page of the group before or after, and wrap round', () => {
    expect(pageGroupStep(0, 1)).toBe(6); // Start (6 pages) -> Battle
    expect(pageGroupStep(8, 1)).toBe(29); // inside Battle (23 pages) -> Run
    expect(pageGroupStep(8, -1)).toBe(0);
    expect(pageGroupStep(0, -1)).toBe(PHANTOM_PAGE_LIST.findIndex((p) => p.id === 'hall'));
    expect(pageGroupStep(PHANTOM_PAGE_LIST.length - 1, 1)).toBe(0);
    // A bad index counts as the first group.
    expect(pageGroupStep(999, 1)).toBe(6);
  });
});

describe('Phantom UI: the Every page page', () => {
  const groups = PHANTOM_PAGE_GROUPS.map((g) => ({ n: g.n, pages: g.pages.map((e) => ({ n: e.n, open: Boolean(e.open) })) }));

  it('draws the groups with their counts, one lit page, and where it is found', () => {
    const html = phPageIndex({ groups, index: 8, where: PHANTOM_PAGE_LIST[8]!.where });
    expect(pageOf(html)).toBe('index');
    expect(html).toContain('<small>84 PAGES · 10 GROUPS</small>Every page');
    expect(html.match(/class="ix-g"/g)).toHaveLength(10);
    expect(html).toContain('<h4>Battle<small>23</small></h4>');
    expect(html.match(/data-act="ixPick"/g)).toHaveLength(84);
    expect(html.match(/<span class="on[ "]/g)).toHaveLength(1);
    expect(html).toContain('<span class="on" data-act="ixPick" data-arg="8" data-over="ixOver">Party</span>');
    expect(html).toContain('<p class="ph-ix-say"><b>Party</b>Pokémon in a fight, or Party in the pause menu.</p>');
    // A page Settings cannot open has no Open key.
    expect(html).not.toContain('data-act="ixOpen"');
  });

  it('marks the pages Settings can open, and gives the lit one an Open key', () => {
    const at = PHANTOM_PAGE_LIST.findIndex((p) => p.id === 'reel');
    const html = phPageIndex({ groups, index: at, where: PHANTOM_PAGE_LIST[at]!.where });
    expect(html).toContain(`<span class="on go" data-act="ixPick" data-arg="${at}" data-over="ixOver">Page changes</span>`);
    expect(html.match(/class="(on)? ?go"/g)).toHaveLength(PHANTOM_PAGE_LIST.filter((p) => p.open).length);
    expect(html).toContain('data-act="ixOpen"');
  });

  it('escapes names and the where line', () => {
    const html = phPageIndex({ groups: [{ n: 'A<b>', pages: [{ n: 'x<i>', open: false }] }], index: 0, where: 'y & <z>' });
    expect(html).toContain('<h4>A&lt;b&gt;<small>1</small></h4>');
    expect(html).toContain('>x&lt;i&gt;</span>');
    expect(html).toContain('<b>x&lt;i&gt;</b>y &amp; &lt;z&gt;</p>');
    expect(html).toContain('1 PAGE · 1 GROUP<');
  });
});

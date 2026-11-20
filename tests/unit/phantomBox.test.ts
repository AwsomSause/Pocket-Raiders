import { describe, expect, it } from 'vitest';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { pageOf } from '../../src/ui/phantom/kit';
import { phBox, type PhBoxModel } from '../../src/ui/phantom/screens/box';
import { phWild } from '../../src/ui/phantom/screens/moments';

// Phantom UI, slice 7: the PC card's other buttons (Summary, Give item) and the wild card's Pokédex key.

const ph = PHANTOM_VERSIONS[0]!;
const art = { file: 'pidove', atlas: true };
const box = (over: Partial<PhBoxModel> = {}): PhBoxModel => ({
  title: 'PC', n: 6, index: 0, found: 2, total: 6, text: 'Bring this Pokémon into the party.',
  cell: (i) => (i < 2 ? { art, label: 'Pidove' } : { art: null, label: '', off: true }),
  detail: { title: 'Pidove', body: 'Lv 9 · HP 68%. 4 of 6 slots free.', art },
  party: [],
  ...over,
});
const blades = (html: string): string[] => [...html.matchAll(/<div class="blade[^"]*"[^>]*>(.*?)<\/div>/g)].map((m) => m[1]!.replace(/<[^>]+>/g, ''));

describe('the Phantom PC card', () => {
  it('a PC Pokémon has Move to party, and the buttons the room gives it, each with its key', () => {
    const html = phBox(ph, box({ extras: [{ label: 'Summary', key: 'I', off: false }, { label: 'Give item', key: 'G', off: false }] }));
    expect(pageOf(html)).toBe('box');
    expect(blades(html)).toEqual(['Move to party', 'ISummary', 'GGive item']);
    expect(html).toContain('data-act="extra" data-arg="0"');
    expect(html).toContain('data-act="extra" data-arg="1"');
    expect(html).toContain('<kbd>G</kbd>');
  });

  it('a button that cannot be used is dimmed; with none given the card has its one button (boundary: an empty slot)', () => {
    const off = phBox(ph, box({ extras: [{ label: 'Summary', key: 'I', off: false }, { label: 'Give item · none free', key: 'G', off: true }] }));
    expect(off).toMatch(/class="blade ph-bx-x off"[^>]*data-arg="1"/);
    expect(off).not.toMatch(/class="blade ph-bx-x off"[^>]*data-arg="0"/);
    const empty = phBox(ph, box({ index: 3, detail: { title: 'Empty slot', body: '4 of 6 slots free.', art: null }, extras: [] }));
    expect(blades(empty)).toEqual(['Put one here']);
    expect(blades(phBox(ph, box()))).toEqual(['Move to party']);
  });

  it('a label is escaped (failure: markup in a name does not reach the page)', () => {
    const html = phBox(ph, box({ extras: [{ label: '<b>x</b>', key: '<', off: false }] }));
    expect(html).not.toContain('<b>x</b>');
    expect(html).toContain('&lt;b&gt;x');
  });
});

describe('the Phantom wild card', () => {
  it('has the Pokédex key beside Send out', () => {
    const html = phWild(ph, { name: 'Feebas', mon: null, level: 4, types: ['water'], where: 'Stage 1', lead: 'A wild', tail: 'appeared!', tag: 'Wild', note: '', catchable: true, cant: '', balls: [{ name: 'Poké Ball', n: 5 }], backdrop: null });
    expect(html).toContain('<span class="key" data-act="dex" data-arg=""><b>Q</b>Pokédex</span>');
    expect(html).toContain('<b>Z</b>Send out');
  });
});

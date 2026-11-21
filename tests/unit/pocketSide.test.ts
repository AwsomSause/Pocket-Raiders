import { describe, expect, it } from 'vitest';
import { pkPageOf } from '../../src/ui/pocket/kit';
import { pkRivals, type PkRival } from '../../src/ui/pocket/screens/rivals';
import { pkLeague } from '../../src/ui/pocket/screens/world';
import { pkReserve } from '../../src/ui/pocket/screens/reserve';

describe('the Pocket Rival Board', () => {
  const r = (name: string, x: Partial<PkRival> = {}): PkRival => ({ name, role: 'Rival', art: null, ace: null, wins: 0, losses: 0, lead: 'Level', ...x });
  it('a card per rival: role, ace, this run and lead; the lit one framed; four a page', () => {
    const h = pkRivals({ index: 1, road: null, rivals: [r('Blue', { ace: { name: 'Squirtle', file: null }, wins: 1, losses: 1 }), r('Silver'), r('Green', { role: 'Friend', wins: 2 }), r('Hop')] });
    expect(pkPageOf(h)?.id).toBe('rivals');
    expect(h).toContain('4 on your trail');
    expect((h.match(/class="rvc pn/g) ?? []).length).toBe(4);
    expect(h).toMatch(/rvc pn on"[^>]*data-key="rv-1"/);
    expect(h).toContain('1 win · 1 loss');
    expect(h).toContain('2 wins · 0 losses');
    expect(h).toContain('Not seen yet');
    expect(h).toContain('Not met yet');
    expect(h).toContain('>Friend<');
  });
  it('a fifth rival pages: the lit fifth shows alone', () => {
    const h = pkRivals({ index: 4, road: null, rivals: ['A', 'B', 'C', 'D', 'E'].map((n) => r(n)) });
    expect((h.match(/class="rvc pn/g) ?? []).length).toBe(1);
    expect(h).toContain('5 on your trail');
  });
});

describe('the Pocket League page', () => {
  it('rooms not met yet stay ???; named rooms show their type; the Champion is kept secret until known', () => {
    const h = pkLeague({ rooms: [{ name: 'Lorelei', type: 'ice', art: null }, { name: null, type: null, art: null }], champion: null, badges: 3, need: 8, index: 0, road: null });
    expect(pkPageOf(h)?.id).toBe('league');
    expect(h).toContain('Lorelei');
    expect(h).toContain('Not met yet');
    expect(h).toContain('Kept secret');
    expect(h).toContain('Opens with 8 badges');
    expect((h.match(/<u class="on"><\/u>/g) ?? []).length).toBe(3);
    const open = pkLeague({ rooms: [], champion: { name: 'Lance', art: null }, badges: 8, need: 8, index: 0, road: null });
    expect(open).toContain('The League is open');
    expect(open).toContain('Lance');
  });
});

describe('the Pocket Reserve page', () => {
  it('the party at the left, the PC as cards with empty slots, the lit one in the swap bar', () => {
    const m = (name: string) => ({ name, file: null, level: 10 });
    const h = pkReserve({ party: [m('Pikachu')], box: [m('Eevee'), null, null], index: 0, used: 1, room: 3, say: 'Bring this Pokémon into the party.', back: true });
    expect(pkPageOf(h)?.id).toBe('reserve');
    expect(h).toContain('1 of 3');
    expect((h.match(/class="pkm empty/g) ?? []).length).toBe(2);
    expect(h).toMatch(/rs-swap[^]*Eevee/);
    expect(h).toContain('>Bring<');
    const empty = pkReserve({ party: [m('Pikachu')], box: [m('Eevee'), null], index: 1, used: 1, room: 2, say: 'An empty slot.', back: false });
    expect(empty).toContain('>Send<');
    expect(empty).toContain('fill this slot');
  });
});

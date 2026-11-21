import { describe, expect, it } from 'vitest';
import { pkPageOf } from '../../src/ui/pocket/kit';
import { pkRivals, type PkRival } from '../../src/ui/pocket/screens/rivals';
import { pkLeague } from '../../src/ui/pocket/screens/world';
import { pkReserve } from '../../src/ui/pocket/screens/reserve';
import { pkQuick } from '../../src/ui/pocket/screens/pause';

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

describe('the Pocket Quick Wheel', () => {
  it('the slots round the Trainer, the lit one ringed, Party glances at the team, other slots say their note', () => {
    const base = { when: '', where: '', money: '', saved: '', road: null, next: '', apps: [], index: 0, rotom: '', hero: { art: null, name: 'Red', chips: ['Kanto'] }, party: [{ art: null, name: 'Pikachu', level: 5, hp: 80, type: 'electric' }], run: [], ask: null };
    const items = [{ label: 'Party', note: '1 Pokémon' }, { label: 'Bag', note: '₽500 in your wallet' }, { label: 'Rivals', note: 'none', off: true }];
    const h = pkQuick({ ...base, items, at: 0, held: false });
    expect(pkPageOf(h)?.id).toBe('quick');
    expect((h.match(/class="app/g) ?? []).length).toBe(3);
    expect(h).toContain('class="app on"');
    expect(h).toContain('app gx-off');
    expect(h).toContain('Pikachu');
    const bag = pkQuick({ ...base, items, at: 1, held: true });
    expect(bag).toContain('₽500 in your wallet');
    expect(bag).toContain('Let go of Tab to open');
  });
});

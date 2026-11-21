import { describe, expect, it } from 'vitest';
import { pkPageOf } from '../../src/ui/pocket/kit';
import { pkRivals, type PkRival } from '../../src/ui/pocket/screens/rivals';
import { pkLeague } from '../../src/ui/pocket/screens/world';
import { pkReserve } from '../../src/ui/pocket/screens/reserve';
import { pkQuick } from '../../src/ui/pocket/screens/pause';
import { pkAchieve, type PkAchievement } from '../../src/ui/pocket/screens/achieve';
import { pkBagUse } from '../../src/ui/pocket/screens/bagUse';
import { pkEvents } from '../../src/ui/pocket/screens/events';
import { pkNews } from '../../src/ui/pocket/screens/news';
import { pkOverlay } from '../../src/ui/redux/screens/overlay';

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

describe('the Pocket Achievement Hall', () => {
  const a = (name: string, x: Partial<PkAchievement> = {}): PkAchievement => ({ name, text: `Do ${name}.`, category: 'battle', earned: false, hidden: false, progress: '1/10', reward: '100 credits', ...x });
  it('six cards a page: earned lit with the reward, the rest grey with progress, hidden ones ???', () => {
    const list = [a('One', { earned: true }), a('Two'), a('Three', { hidden: true }), a('Four'), a('Five'), a('Six'), a('Seven')];
    const h = pkAchieve({ list, index: 0, kinds: [['Battle', 1, 7]], title: null, say: '' });
    expect(pkPageOf(h)?.id).toBe('achieve');
    expect((h.match(/class="ac pn/g) ?? []).length).toBe(6);
    expect(h).toContain('class="ac pn new on"');
    expect(h).toContain('Earned · 100 credits');
    expect(h).toContain('1/10 · 100 credits');
    expect(h).toContain('???');
    expect(h).not.toContain('Seven');
    expect(h).toContain('1 of 7');
    expect(pkAchieve({ list, index: 6, kinds: [], title: 'Ace', say: '' })).toContain('Seven');
  });
});

describe('the Pocket "Use on" page', () => {
  it('the item at the left, a card per Pokémon with what it would do, ones it cannot help grey', () => {
    const h = pkBagUse({ item: { name: 'Potion', art: null, text: 'Restores 20 HP.', left: 3 }, mons: [{ name: 'Pikachu', file: null, hp: 30, short: 'HP 8 → 25', ok: true, type: 'electric' }, { name: 'Eevee', file: null, hp: 100, short: 'Already at full HP', ok: false, type: 'normal' }], index: 0, say: 'Restores 17 HP.' }, () => '#fff');
    expect(pkPageOf(h)?.id).toBe('bag-use');
    expect(h).toContain('Use Potion');
    expect(h).toContain('×3 left');
    expect(h).toContain('class="bu pn on"');
    expect(h).toContain('class="bu pn no"');
    expect(h).toContain('HP 8 → 25');
  });
});

describe('the Pocket Event Hall', () => {
  const ev = (name: string, ms: number, x = {}) => ({ name, text: 'Old homes call.', rule: `${name} rule.`, ms, ...x });
  it('the event on now big with time left, goals and region stamps; this week at the right; the next ones below', () => {
    const h = pkEvents({ date: '20 November', main: ev('Homeland Week', 3 * 86_400_000 + 14 * 3_600_000, { goals: [1, 3], regions: ['kanto', 'hoenn', 'galar'] }), week: ev('Catch Carnival', 0), contracts: [], next: [ev('Rivalry Week', 7 * 86_400_000), ev('Gym Circuit', 14 * 86_400_000), ev('Egg Expedition', 21 * 86_400_000), ev('Too Far', 28 * 86_400_000)] });
    expect(pkPageOf(h)?.id).toBe('events');
    expect(h).toContain('<b>3</b>days');
    expect(h).toContain('<b>14</b>hours');
    expect(h).toContain('goals 1 of 3 done');
    expect(h).toContain('Region 8');
    expect(h).toContain('Catch Carnival');
    expect(h).toContain('In 1 week');
    expect(h).toContain('In 3 weeks');
    expect(h).not.toContain('Too Far');
  });
  it('no event on: a quiet card; no week event: the Contract Board instead; one day reads "day"', () => {
    const q = pkEvents({ date: '1 May', main: null, week: null, contracts: ['Win 3 battles'], next: [] });
    expect(q).toContain('No event on');
    expect(q).toContain('Contract Board');
    expect(q).toContain('Win 3 battles');
    expect(q).not.toContain('evh-st');
    expect(pkEvents({ date: '1 May', main: ev('A', 86_400_000 + 3_600_000), week: null, contracts: [], next: [] })).toContain('<b>1</b>day</i><i><b>1</b>hour');
  });
});

describe('the Pocket News page', () => {
  it('a row per piece of news with its tag colour, the lit one framed, Rotom underneath, a count in the header', () => {
    const h = pkNews({ rows: [{ tag: 'Game event', colour: '#2f86c4', title: 'Homeland Week', text: '3 days left.' }, { tag: 'Your record', colour: '#b97f00', title: 'Best: 18 battles', text: 'Rank 4.' }], index: 1, say: 'Bzzt!' });
    expect(pkPageOf(h)?.id).toBe('news');
    expect(h).toContain('2 new');
    expect((h.match(/class="nw[ "]/g) ?? []).length).toBe(2);
    expect(h).toMatch(/class="nw on" style="--c:#b97f00"/);
    expect(h).toContain('data-act="pick"');
    expect(h).toContain('Bzzt!');
  });
});

describe('the Pocket notice cards (toasts)', () => {
  it('a card per notice and toast with its colour and a tap to send it away or open it; nothing when empty', () => {
    const h = pkOverlay({ notices: [{ id: 1, head: 'Saved', text: 'Stop 3 · slot 1' }, { id: 2, head: 'Rival', text: 'Blue is 3 stops ahead' }], toasts: [{ id: 7, kicker: 'Achievement', title: 'Trainer Tamer', art: null, lines: ['+150 Bank credits'], open: true }] });
    expect((h.match(/class="toast gx-toast"/g) ?? []).length).toBe(3);
    expect(h).toContain('--c:#2f9e44');
    expect(h).toContain('--c:#2a75bb');
    expect(h).toContain('--c:#f2a900');
    expect(h).toContain('data-act="notice" data-arg="2"');
    expect(h).toContain('data-act="toast" data-arg="7"');
    expect(h).toContain('+150 Bank credits');
    expect(pkOverlay({ notices: [], toasts: [] })).toBe('');
  });
});

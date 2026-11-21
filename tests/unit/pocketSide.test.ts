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
import { pkForecast } from '../../src/ui/pocket/screens/forecast';
import { pkTime, pkWeather, weatherCard } from '../../src/ui/pocket/screens/sky';
import { pkHelp } from '../../src/ui/pocket/screens/help';
import { pkQuiz } from '../../src/ui/pocket/screens/quiz';

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

describe('the Pocket Forecast', () => {
  it('a card per stop with the time and weather icons, the Gym marked, fog as ???, too far as a question mark; Fix my team', () => {
    const h = pkForecast({ region: 'Kanto', stage: 'Stage 2 of 8', road: null, index: 1, say: 'Bzzt! Rain from stop 3.', stops: [
      { stop: 2, kind: 'Wild Pokémon', sub: 'Tall grass', time: 'eve', weather: 'rain', gym: false },
      { stop: 3, kind: 'Gym', sub: 'Gym Leader', time: 'eve', weather: 'sun', gym: true },
      { stop: 4, kind: null, sub: 'Hidden in fog', time: 'eve', weather: null, gym: false },
    ] });
    expect(pkPageOf(h)?.id).toBe('forecast');
    expect((h.match(/class="fc /g) ?? []).length).toBe(3);
    expect(h).toContain('class="fc eve gym on"');
    expect(h).toContain('wxi rain');
    expect(h).toContain('Harsh Sun');
    expect(h).toContain('???');
    expect(h).toContain('Too far to tell');
    expect(h).toContain('Fix my team');
    expect(h).toContain('data-act="popOpen"');
  });
});

describe('the Pocket Time of Day and Weather guides', () => {
  it('Time: three cards, the one now marked, the run strip with this stage lit, the stone rule; Enter opens Weather', () => {
    const h = pkTime({ now: 'eve', index: 1, run: ['day', 'eve', 'night', 'day'], at: 1, crumb: ['Map', 'Time of Day'], road: null });
    expect(pkPageOf(h)?.id).toBe('time');
    expect((h.match(/class="tod-c /g) ?? []).length).toBe(3);
    expect(h).toMatch(/tod-c eve on"[\s\S]*?<em>Now<\/em>/);
    expect(h).toContain('<i class="eve on"></i>');
    expect(h).toContain('Stone rule');
    expect(h).toContain('data-act="popOpen"');
  });
  it('Weather: five cards with their arenas, hail shown on the Snow card as Hail, turns left in the header', () => {
    const h = pkWeather({ now: 'hail', turns: 2, index: weatherCard('hail'), crumb: ['Battle', 'Weather'], road: null }, { pick: 'pkWx', back: 'info' });
    expect(pkPageOf(h)?.id).toBe('weather');
    expect((h.match(/class="wx-c /g) ?? []).length).toBe(5);
    expect(h).toContain('Now: Hail');
    expect(h).toContain('2 turns left');
    expect(h).toMatch(/wx-c snow on"/);
    expect(h).toContain('data-act="pkWx"');
    expect(weatherCard(null)).toBe(0);
    expect(pkWeather({ now: null, turns: null, index: 0, crumb: [], road: null })).not.toContain('<em>Now</em>');
  });
});

describe('the Pocket Controls card', () => {
  it("the page's own keys by scene, a menu set for any other, the keys that work everywhere; a click puts it away", () => {
    const b = pkHelp('Battle');
    expect(b).toContain('You are in a battle');
    expect(b).toContain('Battle status');
    expect(b).toContain('Run log');
    expect(b).toContain('data-act="help"');
    expect(pkHelp('Map')).toContain('Forecast');
    expect(pkHelp('Shop')).toContain('You are on a menu');
  });
});

describe('the Pocket Starter Quiz', () => {
  const answers = ['Fire', 'Water', 'Grass', 'Electric', 'Rock'].map((label) => ({ label, off: label === 'Rock' }));
  it('the question numbered from 1, the lit answer, pips past and on, many answers drawn smaller', () => {
    const h = pkQuiz({ who: 'Prof. Vance', art: null, intro: 'First, tell me.', question: 'Which do you like?', answers, index: 1, at: 1, of: 5, back: true });
    expect(pkPageOf(h)?.id).toBe('quiz');
    expect(h).toContain('Question 2 of 5');
    expect(h).toContain('gx-qz-many');
    expect(h).toMatch(/class="btn on"[^>]*data-key="qz-1"/);
    expect(h).toContain('class="btn off"');
    expect((h.match(/<i class="past"><\/i>/g) ?? []).length).toBe(1);
    expect((h.match(/<i class="on"><\/i>/g) ?? []).length).toBe(1);
    expect(h).toContain('Esc');
  });
  it('three answers stay big; no Esc on the first question', () => {
    const h = pkQuiz({ who: 'Prof. Vance', art: null, intro: '', question: 'Q?', answers: answers.slice(0, 3), index: 0, at: 0, of: 3, back: false });
    expect(h).not.toContain('gx-qz-many');
    expect(h).not.toContain('gx-qz-intro');
    expect(h).not.toContain('Esc');
  });
});

describe('the Pocket Expedition pages', () => {
  it('the gate: briefing card, Set out lit, the ranger line, Esc leaves', async () => {
    const { pkXpDoor } = await import('../../src/ui/pocket/screens/expedition');
    const h = pkXpDoor({ kind: 'gate', where: 'Expedition Gate', sub: 'Kanto · Stop 3', kicker: 'Tier 1 Expedition', name: 'Ember Trail', text: 'A short route.', rows: [['Party', 'Bring your own party']], options: [{ label: 'Set out', detail: '' }, { label: 'Not now', detail: '' }], index: 0, say: 'A ranger lifts the gate.', esc: 'leave' }, { pick: 'popPick', over: '' });
    expect(pkPageOf(h)?.id).toBe('xp-gate');
    expect(pkPageOf(h)?.tier).toBe(51);
    expect(h).toMatch(/class="btn on"[^>]*data-key="xp-ch-0"/);
    expect(h).toContain('data-act="popPick"');
    expect(h).toContain('A ranger lifts the gate.');
    expect(h).toContain('leave');
  });
  it('Totem Territory uses the same door in the Totem colours, with its own page id', async () => {
    const { pkXpDoor } = await import('../../src/ui/pocket/screens/expedition');
    const h = pkXpDoor({ kind: 'stop', where: 'Totem Territory', sub: 'Stop 4', kicker: 'Totem', name: 'Totem Lurantis', text: 't', rows: [['Aura', 'Grassy']], options: [{ label: 'Face the Totem', detail: '' }, { label: 'Walk around it', detail: '' }], index: 1, say: '', esc: 'leave', area: { key: 'tm', tag: 'Totem', page: 'tm-stop', cls: 'tms27', bg: 'x.png' } });
    expect(pkPageOf(h)?.id).toBe('tm-stop');
    expect(h).toContain('a-tm');
    expect(h).toContain('emb28 tm card');
    expect(h).toMatch(/class="btn on"[^>]*data-key="xp-ch-1"/);
  });
  it('a raid den: the raid colours and emblem, more than three ways drawn tighter', async () => {
    const { pkXpDoor } = await import('../../src/ui/pocket/screens/expedition');
    const opts = ['Help your rival', 'Race', 'Leave them', 'Practice', 'Leave the den'].map((label) => ({ label, detail: 'Costs nothing' }));
    const h = pkXpDoor({ kind: 'stop', where: 'Rival Raid', sub: 'Stop 4', kicker: 'Tier 2 raid', name: 'Rival at the Den', text: 't', rows: [], options: opts, index: 0, say: 'Fight beside them.', esc: 'leave', area: { key: 'rd', tag: 'Raid', page: 'rd-den', cls: 'rdd27', bg: 'x.png' } });
    expect(pkPageOf(h)?.id).toBe('rd-den');
    expect(h).toContain('dr-ch gx-dr-many');
    expect(h).toContain('emb28 rd card');
  });
  it('the route: stops placed up the ridge, the lit stop and the walked trail, Extract now as a choice', async () => {
    const { pkXpRoute, xpPlace } = await import('../../src/ui/pocket/screens/expedition');
    const nodes = [
      { layer: 0, row: 0, rows: 1, kind: 'wild', title: 'Wild', past: true, on: true, opt: -1 },
      { layer: 1, row: 0, rows: 2, kind: 'trainer', title: 'Trainer', past: false, on: false, opt: 0 },
      { layer: 1, row: 1, rows: 2, kind: 'cache', title: 'Cache', past: false, on: false, opt: 1 },
      { layer: 2, row: 0, rows: 1, kind: 'finale', title: 'Finale', past: false, on: false, opt: -1 },
    ];
    const h = pkXpRoute({ name: 'Ember Trail', tag: 'Expedition', layers: 3, layer: 1, nodes, edges: [{ a: 0, b: 1, went: false }, { a: 0, b: 2, went: false }, { a: 1, b: 3, went: false }], party: [{ art: null, hp: 0 }], boss: null, walker: null, now: 'Trainer: stop 2', money: 1200, items: 2, index: 1, extract: 2, flow: ['Gate', 'Route', 'Finale', 'Extract'], step: 1, lines: [] });
    expect(pkPageOf(h)?.id).toBe('xp-route');
    expect(xpPlace(0, 0, 1, 3)).toEqual({ x: 105, y: 404, ground: 434 });
    expect(xpPlace(2, 0, 1, 3)).toEqual({ x: 745, y: 168, ground: 198 });
    expect(h).toMatch(/class="nd42 cache on lab"/);
    expect(h).toContain('₽1,200');
    expect(h).toContain('+2 items');
    expect(h).toContain('class="ko"');
    expect(h).toMatch(/data-key="xp-extract" data-act="pick" data-arg="2"/);
  });
  it('the draft: taken ones lit and numbered, the lit offer, how many picked; extract: both sides; result and fail pages', async () => {
    const { pkXpDraft, pkXpExtract, pkXpResult } = await import('../../src/ui/pocket/screens/expedition');
    const d = pkXpDraft({ title: 'Draft', text: 'Pick 3.', taken: [{ art: null, name: 'Riolu', types: 'Fighting' }], offer: [{ art: null, name: 'Eevee', types: 'Normal', note: 'Lv10' }], index: 0, picks: 3, pass: null });
    expect(pkPageOf(d)?.id).toBe('xp-draft');
    expect(d).toContain('1 of 3 picked');
    expect(d).toContain('<u>1</u>');
    expect(d).toContain('Enter takes Eevee.');
    const x = pkXpExtract({ money: 1200, items: ['Rare Candy ×2'], prize: '1 Mega Stone', left: 3, boss: null, keep: 300, index: 0 });
    expect(x).toContain('3 layers left');
    expect(x).toContain('Keep ₽300, items lost');
    const base = { name: 'Ember Trail', text: 't', rows: [{ art: null, title: '₽0', sub: 's' }], side: 'Next time', lines: ['l'], party: [], counts: [['1 of 5', 'layers walked']] as const };
    expect(pkPageOf(pkXpResult({ ...base, outcome: 'failed' }))?.id).toBe('xp-fail');
    expect(pkXpResult({ ...base, outcome: 'failed' })).toContain('Expedition Failed');
    expect(pkXpResult({ ...base, outcome: 'completed' })).toContain('Expedition Complete');
    expect(pkXpResult({ ...base, outcome: 'extracted' })).toContain('Extracted');
  });
});

describe('the Pocket Galar bracket', () => {
  it('five round cards (won, next, later, final), Heal and Shop between them, the field still in and who went out', async () => {
    const { pkBracket } = await import('../../src/ui/pocket/screens/galar');
    const r = (name: string, state: 'won' | 'next' | 'later', after: 'heal' | 'shop' | null) => ({ name, state, you: { art: null, name: state === 'later' ? 'Winner' : 'Red', won: state === 'won' }, foe: { art: null, name: 'Bede' }, note: 'n', after });
    const h = pkBracket({ rounds: [r('Round of 32', 'won', 'heal'), r('Round of 16', 'next', 'shop'), r('Quarterfinal', 'later', 'heal'), r('Semifinal', 'later', 'shop'), r('Final', 'later', null)], still: 16, pool: Array(10).fill(null), out: [null, null], index: 2, button: 'Back to the map', line: 'Next: Round of 16' });
    expect(pkPageOf(h)?.id).toBe('ga-bracket');
    expect(h).toContain('mt34 won');
    expect(h).toContain('mt34 now');
    expect(h).toContain('mt34  fin');
    expect(h).toMatch(/mt34 [^"]*gx-lit" data-key="ga-r-2"/);
    expect((h.match(/<i class="heal">/g) ?? []).length).toBe(2);
    expect((h.match(/<i class="shop">/g) ?? []).length).toBe(2);
    expect(h).toContain('and 8 more');
    expect(h).toContain('<u>Out</u>');
  });
});

describe('the Pocket Stadium Shop', () => {
  it('four goods at a time around the lit one, the price tags, a grey one you cannot pay for, your side', async () => {
    const { pkGaShop } = await import('../../src/ui/pocket/screens/galar');
    const goods = ['A', 'B', 'C', 'D', 'E', 'F'].map((name, k) => ({ art: null, name, desc: 'd', price: 1000 + k, off: k === 5 }));
    const h = pkGaShop({ heading: 'Before the Quarterfinal', goods, index: 5, trainer: 'Red', mine: [{ art: null, title: '₽3,200', sub: 'Your money', tag: 'Money', cls: 'boss' }], text: 'Open after rounds 2 and 4.' });
    expect(pkPageOf(h)?.id).toBe('ga-shop');
    expect(h).toContain('Before the Quarterfinal');
    expect(h).not.toContain('<b style="font-size:14px">B</b>');
    expect(h).toContain('<p class="me out" data-act="pick" data-arg="5"');
    expect(h).toContain('<u>₽1,005</u>');
    expect(h).toContain('3–6 of 6');
    expect(h).toContain('<p class="boss">');
    expect(pkGaShop({ heading: 'x', goods: [], index: 0, trainer: 'Red', mine: [], text: '' })).toContain('Sold out');
  });
});

describe('the Pocket Galar line-ups', () => {
  it('both sides with the lead lit, the ace in gold and who sits out', async () => {
    const { pkGaLineup } = await import('../../src/ui/pocket/screens/galar');
    const h = pkGaLineup({ me: { tag: 'Challenger', name: 'Red', rows: [{ art: null, title: 'Charizard', sub: 'Lv 36', tag: 'Lead', cls: 'me' }], foot: 'and Lucario on the bench' }, foe: { tag: 'Gym Leader', name: 'Raihan', rows: [{ art: null, title: 'Duraludon', sub: 'Lv 58 · will Dynamax', tag: '★ Ace', cls: 'boss' }], foot: 'and Torkoal' } });
    expect(pkPageOf(h)?.id).toBe('ga-lineup');
    expect(h).toContain('<p class="me">');
    expect(h).toContain('<p class="boss">');
    expect(h).toContain('<u>★ Ace</u>');
    expect(h).toContain('<small>and Lucario on the bench</small>');
    expect(h).toContain('data-act="next"');
  });
});

describe('the Pocket Gym Challenge road', () => {
  it('a card per Gym (won, next, not met), the lit one ringed, the tournament card; B only once it has begun', async () => {
    const { pkGaRoad } = await import('../../src/ui/pocket/screens/galar');
    const gyms = [{ name: 'Milo', type: 'grass', state: 'got' as const, art: null, n: 1 }, { name: 'Nessa', type: 'water', state: 'next' as const, art: null, n: 2 }, { name: null, type: '', state: 'later' as const, art: null, n: 3 }];
    const h = pkGaRoad({ gyms, index: 1, cup: { art: null, line: '32 trainers · 5 rounds · opens after match 3' }, bracket: false });
    expect(pkPageOf(h)?.id).toBe('ga-road');
    expect(h).toContain('<i>Badge won</i>');
    expect(h).toContain('<p class="now gx-lit"');
    expect(h).toContain('Match 2 · next');
    expect(h).toContain('<p class="gx-later"');
    expect(h).toContain('3 stadium matches');
    expect(h).not.toContain('roadBracket');
    expect(pkGaRoad({ gyms, index: 0, cup: { art: null, line: 'x' }, bracket: true })).toContain('data-act="roadBracket"');
  });
});

describe('the Pocket Galar round won', () => {
  it('the round in the title, four cards with the shop lit, the next round and the counts', async () => {
    const { pkGaWon } = await import('../../src/ui/pocket/screens/galar');
    const h = pkGaWon({ round: 'Round of 16', text: 'Marnie is out. The crowd finished at 78 with you.', rows: [{ art: null, title: 'Marnie', sub: 'Beaten 4 to 0' }, { art: null, title: 'Team healed', sub: 'Free after every round' }, { art: null, title: '₽ 3,200', sub: 'Round prize' }, { art: null, title: 'Shop is open', sub: 'After rounds 2 and 4', on: true }, { art: null, title: 'extra', sub: 'cut' }], side: 'Next: Quarterfinal', lines: [['', 'You meet Bede next.'], ['Left', '8 of 32 trainers']], party: [null, null], counts: [['4 to 0', 'final score'], ['78', 'crowd with you']] });
    expect(pkPageOf(h)?.id).toBe('ga-won');
    expect(h).toContain('Round of 16 Won');
    expect((h.match(/<p class="(on)?"><span>/g) ?? []).length).toBe(4);
    expect(h).toContain('<p class="on"><span></span><b');
    expect(h).toContain('<i>Left</i>8 of 32 trainers');
    expect(h).toContain('<b>78</b><em>crowd with you</em>');
    expect(h).not.toContain('extra');
    expect(h).toContain('Back to the map');
  });
  it('the Final won is the Galar Champion page with its own title and button', async () => {
    const { pkGaWon } = await import('../../src/ui/pocket/screens/galar');
    const h = pkGaWon({ round: 'Final', text: 'Leon is beaten.', rows: [], side: 'What happens now', lines: [['Run', 'Kanto is next.']], party: [], counts: [['5 of 5', 'rounds won']], champ: { title: 'Galar Champion', button: 'Hall of Fame' } });
    expect(pkPageOf(h)?.id).toBe('ga-champ');
    expect(h).toContain('res31 champ34');
    expect(h).toContain('Galar Champion');
    expect(h).not.toContain('Final Won');
    expect(h).toContain('<b>Hall of Fame</b>');
  });
});

describe('the Pocket Raid Lobby', () => {
  it('draws both sides, the lit row and the button', async () => {
    const { pkRdLobby } = await import('../../src/ui/pocket/screens/raid');
    const h = pkRdLobby({
      tag: 'Tier 1 raid', boss: 'Venusaur', sub: 'Garden Guardian', button: 'Start the raid · ₽150',
      me: [{ art: null, title: 'You · Popplio', sub: 'Go in as you are', tag: 'Ready', pick: 0 }, { art: null, title: 'Rex the Bruiser', sub: 'Hits the boss', tag: '₽150', cls: 'me', pick: 1 }],
      foe: [{ art: null, title: 'Grass / Poison', sub: 'Level 45', tag: 'Boss', cls: 'boss' }, { art: null, title: 'Co-op is off', sub: 'A friend', tag: 'Off', pick: 2 }],
      meFoot: 'Pick one', foeFoot: 'HP pool ×2.5',
    });
    expect(h.startsWith('<!--pk:rd-lobby:51-->')).toBe(true);
    expect(h).toContain('a-rd pg28');
    expect(h).toContain('Rex the Bruiser');
    expect(h).toContain('class="me"');
    expect(h).toContain('Start the raid · ₽150');
    expect(h).toContain('data-act="popPick"');
  });
});

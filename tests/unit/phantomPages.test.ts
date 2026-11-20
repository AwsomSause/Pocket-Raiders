import { describe, expect, it } from 'vitest';
import type { DexCard, DexDataPage } from '../../src/core/presentation/dexInfo';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { pageOf } from '../../src/ui/phantom/kit';
import { phBag } from '../../src/ui/phantom/screens/bag';
import { phDex } from '../../src/ui/phantom/screens/dex';
import { phParty, phSummary } from '../../src/ui/phantom/screens/party';
import { dockFact, phDock } from '../../src/ui/phantom/screens/town';
import { dockView } from '../../src/ui/redux/screens/hub';
import { partyCols, partyView, summaryView, type PartyCard, type SummaryBody, type SummaryModel } from '../../src/ui/redux/screens/party';
import type { ReduxCtx } from '../../src/ui/redux/stage';

// The Phantom UI's pages around the team and the town: Party, Summary, Bag, a Pokédex entry and the town dock. Each
// is a pure function from the same model its New UI twin takes to HTML.

const ph = PHANTOM_VERSIONS[0]!;
const ctx = (on: boolean): ReduxCtx => ({ k: 0, skin: {} as ReduxCtx['skin'], v: () => 0, ph: on ? ph : null });
const count = (html: string, bit: string | RegExp): number => html.split(bit).length - 1;

const mon = (over: Partial<PartyCard> = {}): PartyCard => ({ name: 'Charizard', file: null, level: 36, hp: 90, maxHp: 120, held: 'Charcoal', tag: 'LEAD', types: ['fire', 'flying'], ability: 'Blaze', nature: 'Adamant', moves: [{ name: 'Flamethrower', type: 'fire' }, { name: 'Fly', type: 'flying' }], off: false, ...over });
const party = (n: number, index = 0) => ({ title: 'Party', mons: Array.from({ length: n }, (_, k) => mon({ name: `Mon ${k}`, hp: k === 2 ? 0 : 90, tag: k ? '' : 'LEAD' })), index, text: 'Pick a Pokémon.', hints: [['Enter', 'open'], ['Esc', 'back']] as const });
const summary = (body: SummaryBody, over: Partial<SummaryModel> = {}): SummaryModel => ({
  title: 'Summary', hints: [['←→', 'tab'], ['Esc', 'back']], tabs: ['Overview', 'Stats', 'Moves', 'Items', 'Bond'], tab: 0, itemsTab: 3, text: 'Up and Down change Pokémon.', menu: null,
  face: { name: 'Charizard', file: null, art: null, level: 36, gender: '♂', types: ['fire', 'flying'], no: 'No. 006', held: 'Holding 1 item', hpPct: 75, xpPct: 40 }, body, ...over,
});

describe('Phantom Party', () => {
  it('takes over from the New UI page only when Phantom is on, and steers two cards wide', () => {
    expect(pageOf(partyView(ctx(false), party(3)))).toBeNull();
    expect(pageOf(partyView(ctx(true), party(3)))).toBe('party');
    expect(partyCols(ctx(true))).toBe(2);
    expect(partyCols(ctx(false))).toBe(1);
  });

  it('draws a card per Pokémon, lights one, stamps the fainted one and names what the lit one knows', () => {
    const html = phParty(ph, party(6, 1));
    expect(count(html, 'class="pc ph-pc')).toBe(6);
    expect(count(html, /class="pc ph-pc on/)).toBe(1);
    expect(count(html, '>Fainted<')).toBe(1);
    expect(html).toContain('<b>Blaze</b>');
    expect(html).toContain('Flamethrower');
    expect(html).toContain('data-arg="5"');
  });

  it('an empty team still draws the page, and a Hall of Fame line replaces the HP numbers', () => {
    expect(pageOf(phParty(ph, party(0)))).toBe('party');
    const html = phParty(ph, { ...party(1), mons: [mon({ line: 'Champion team', hp: 0 })] });
    expect(html).toContain('Champion team');
    expect(html).not.toContain('>Fainted<');
  });
});

describe('Phantom Summary', () => {
  const stats: SummaryBody = { kind: 'stats', rows: ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'].map((label, k) => ({ label, value: 100 + k, pct: 50 + k, iv: '31', ev: 4, up: k === 1, perfect: true, delta: '+2' })), foot: 'Adamant: Attack up, Sp. Atk down.', versus: '' };

  it('takes over only when Phantom is on and shows every tab, lighting the open one', () => {
    const m = summary({ kind: 'overview', ability: { name: 'Blaze', text: 'Powers up Fire moves in a pinch.' }, facts: [['Nature', 'Adamant'], ['Met', 'Route 1']], note: '', moves: [{ name: 'Fly', type: 'flying' }] });
    expect(pageOf(summaryView(ctx(false), m))).toBeNull();
    const html = summaryView(ctx(true), m);
    expect(pageOf(html)).toBe('summary');
    expect(count(html, 'data-act="tab"')).toBe(6); // five tabs and the held-item button
    expect(html).toMatch(/<span class="on"[^>]*data-arg="0"/);
    expect(html).toContain('Powers up Fire moves in a pinch.');
  });

  it('stats: the six-point chart and a row per stat with its IV and EV; a raised stat is marked', () => {
    const html = phSummary(ph, summary(stats, { tab: 1 }));
    expect(count(html, '<polygon class="web"')).toBe(3);
    expect(count(html, 'class="kv ph-st')).toBe(6);
    expect(count(html, 'class="kv ph-st up"')).toBe(1);
    expect(html).toContain('ATTACK ▲');
  });

  it('moves and items: the cursor row is lit and its facts are shown; no items says so', () => {
    const moves = phSummary(ph, summary({ kind: 'moves', moves: [{ name: 'Fly', type: 'flying', pp: '15/15' }, { name: 'Cut', type: 'normal', pp: '3/30' }], cursor: 1, facts: [['Power', '50']], lines: ['Cuts the foe.'] }, { tab: 2 }));
    expect(moves).toMatch(/class="ch ph-mv on"[^>]*data-arg="1"/);
    expect(moves).toContain('Cuts the foe.');
    const none = phSummary(ph, summary({ kind: 'items', summary: 'Holding nothing', items: [], cursor: 0, lines: [], takeOff: false }, { tab: 3 }));
    expect(none).toContain('holds nothing');
    const some = phSummary(ph, summary({ kind: 'items', summary: 'Holding 7 items', items: Array.from({ length: 7 }, (_, k) => ({ name: `Item ${k}`, art: null, mode: 'Held', text: 'Does a thing.' })), cursor: 6, lines: [], takeOff: true }, { tab: 3 }));
    expect(count(some, 'class="it ph-it2')).toBe(5);
    expect(some).toContain('3–7 of 7');
    expect(some).toContain('data-act="takeoff"');
  });

  it('the action menu lists its choices as blades and dims one that is closed; text is escaped', () => {
    const html = phSummary(ph, summary({ kind: 'text', head: '<i>Bond</i>', bars: [{ label: 'Trust', value: 60 }], sections: [{ title: 'Likes', lines: ['Berries'] }] }, { tab: 4, menu: { options: [{ label: 'Make lead', off: false }, { label: 'Care', off: true }], index: 1 } }));
    expect(count(html, 'data-act="menu"')).toBe(2);
    expect(html).toMatch(/class="blade on off"/);
    expect(html).not.toContain('<i>Bond</i>');
  });
});

describe('Phantom Bag', () => {
  const item = (i: number) => ({ label: `Potion ${i}`, tag: `×${i + 1} · COMMON`, note: i % 2 ? 'Held by Mon 1 · Raises Speed' : 'Heals 20 HP', art: null, off: i === 3 });
  const team = [{ name: 'A', file: null, hp: 80, level: 5, fainted: false }, { name: 'B', file: null, hp: 0, level: 5, fainted: true }];
  const bag = (over = {}) => ({ title: 'Bag', hints: [['Enter', 'choose'], ['Esc', 'back']] as const, pockets: { labels: ['Medicine', 'Balls'], index: 1 }, n: 12, item, index: 0, strip: '', text: 'Heals 20 HP', party: team, notes: ['Can use', 'Fainted'], ...over });

  it('lists seven items with their counts, lights the cursor row and names what Enter does', () => {
    const html = phBag(ph, bag());
    expect(pageOf(html)).toBe('bag');
    expect(count(html, 'class="it ph-bi')).toBe(7);
    expect(html).toContain('<span>×1</span>');
    expect(html).toMatch(/class="blade on ph-do"[^>]*>Use</);
    expect(html).toMatch(/<span class="on"[^>]*data-arg="1"[^>]*>Balls</);
  });

  it('a held item offers Change holder, and the team row says who can use the lit item', () => {
    const html = phBag(ph, bag({ index: 1 }));
    expect(html).toContain('>Change holder<');
    expect(html).toContain('HELD BY MON 1');
    expect(count(html, 'class="u on"')).toBe(1);
    expect(html).toContain('<small>Fainted</small>');
  });

  it('what the line of the game adds to the card is shown under it, once; an empty bag says so', () => {
    const html = phBag(ph, bag({ index: 2, text: 'Potion 2: Heals 20 HP No Pokémon needs it right now.' }));
    expect(html).toContain('<p class="ph-why">No Pokémon needs it right now.</p>');
    expect(count(html, 'Heals 20 HP')).toBe(1);
    expect(phBag(ph, bag())).not.toContain('ph-why');
    const none = phBag(ph, bag({ n: 0, party: [] }));
    expect(none).toContain('Nothing here yet');
    expect(none).not.toContain('class="useon');
  });
});

describe('Phantom Pokédex entry and town dock', () => {
  const card: DexCard = { state: 'caught', no: 'No. 0149', name: 'Dragonite', types: ['dragon', 'flying'], facts: [['Height', '2.2 m'], ['Weight', '210 kg'], ['Caught', '1'], ['Battles', '3']], note: 'Caught. It leads lost ships to shore.', stats: ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'].map((label, k) => ({ label, value: 80 + k * 10 })), line: [{ id: 'dratini', here: false, met: true }, { id: 'dragonair', here: false, met: false }, { id: 'dragonite', here: true, met: true }], next: 'Final form' };
  const data: DexDataPage = { state: 'caught', title: 'Dragonite', facts: ['Abilities: Inner Focus', 'Egg groups: Water 1, Dragon'], evolutions: [], moves: ['Lv 1  Wrap', 'Lv 15  Twister'] } as DexDataPage;

  it('the entry shows the measurements, six stats, the line and the record; the second page shows facts and moves', () => {
    const html = phDex(ph, { card, data, page: 0, art: null, line: [null, null, null] });
    expect(pageOf(html)).toBe('dexentry');
    expect(html).toContain('<b>2.2 m</b>');
    expect(count(html, 'class="slash xp"')).toBe(6);
    expect(count(html, /<i class="(?:on)?">/)).toBe(3);
    expect(html).toContain('Final form');
    const two = phDex(ph, { card, data, page: 1, art: null, line: [] });
    expect(two).toContain('<b>Inner Focus</b>');
    expect(two).toContain('Lv 15  Twister');
  });

  it('a species not met yet shows only its number and the note', () => {
    const html = phDex(ph, { card: { ...card, state: 'unknown', name: '???', types: [], facts: [], stats: [], line: [], next: '', note: 'Not met yet.' }, data, page: 0, art: null, line: [] });
    expect(html).toContain('Not met yet');
    expect(html).not.toContain('data-act="flip"');
  });

  it('the dock: a slanted word per place, the open tab lit, chips read as facts', () => {
    const m = { town: 'Hub Town', chips: ['₽ 1,200', 'Rank 3'], tabs: ['Town', 'Last run'], tab: 1, buttons: [{ label: 'Settings' }, { label: 'Trainers', small: '2' }, { label: 'New Run', off: true }], index: 1, lineup: [], say: 'Welcome back.', note: '', hints: [] };
    expect(pageOf(dockView(ctx(false), m))).toBeNull();
    const html = dockView(ctx(true), m);
    expect(pageOf(html)).toBe('dock');
    expect(count(html, /class="h[ "]/)).toBe(3);
    expect(html).toMatch(/class="h on"[^>]*data-arg="1"/);
    expect(html).toContain('<small>2</small>');
    expect(html).toContain('<b>MONEY</b>₽1,200');
    expect(html).toContain('Welcome back.');
    expect(phDock(ph, { ...m, tabs: ['Districts'], tab: 0 })).not.toContain('class="pockets');
    expect(dockFact('Regular (12)')).toEqual(['Regular', '12']);
  });
});

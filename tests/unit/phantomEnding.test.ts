import { describe, expect, it } from 'vitest';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { pageOf } from '../../src/ui/phantom/kit';
import { BLESSING_ROWS, phBlessing, phCredits, phHall, phOver, type BlessingModel, type HallModel } from '../../src/ui/phantom/screens/ending';
import type { CreditsModel } from '../../src/ui/redux/screens/boot';
import type { OverModel } from '../../src/ui/redux/screens/over';

// The Phantom UI's pages for the end of a run (lost: `runover`, won: `record`), a champion's team in the Hall of Fame,
// the credits and a Legendary's blessing. Pure pages: what is shown, what is left out, escaping, limits.

const ph = PHANTOM_VERSIONS[0]!;
const count = (html: string, bit: string | RegExp): number => html.split(bit).length - 1;
const cutOut = (html: string): string[] => [...html.matchAll(/class="rs[^"]*" aria-label="([^"]*)"/g)].map((m) => m[1]!);

const over = (o: Partial<OverModel> = {}): OverModel => ({
  win: false, title: 'RUN OVER', sub: 'Fell in Johto · Leader Clair',
  facts: [['Battles won', '19'], ['Pokémon caught', '14'], ['Badges', '7'], ['Time', '1 h 42 min'], ['Seed', 'kice-2026']],
  payouts: [['Bank Credits', '+ 1,240'], ['Research', '+ 38']],
  team: [{ file: null, name: 'Charizard', down: true }, { file: null, name: 'Pikachu', down: false }],
  buttons: ['Full report', 'Run card', 'Back to Hub'], index: 0, extras: [['F', 'final team', 'team'], ['R', 'retry seed', 'retry']], backdrop: null, poked: null,
  where: 'Stage 24 of 30 · Johto · lost to Leader Clair', line: "The run ended against Leader Clair's Kingdra (Lv60).", road: { done: 23, of: 30 }, mvp: { file: null, name: 'Charizard', text: '41 battles, 3 bosses' }, ...o,
});
const hall = (o: Partial<HallModel> = {}): HallModel => ({
  mons: [{ file: null, name: 'Charizard', level: 100, tag: 'The Ace', note: 'Signature: Flamethrower', shiny: false }, { file: null, name: 'Pikachu', level: 97, tag: 'No. 2', note: 'Electric', shiny: true }],
  index: 0, trainer: null, name: 'Champion Red', sub: '8 of 8 regions · 64 badges · 2026-11-20', ...o,
});
const credits = (o: Partial<CreditsModel> = {}): CreditsModel => ({
  lead: 'A run by Red', rows: [{ kind: 'title', text: 'Pocket Raiders' }, { kind: 'heading', text: 'Director' }, { kind: 'text', text: 'Kice' }, { kind: 'gap', text: '' }, { kind: 'title', text: 'Your run' }, { kind: 'mons', text: '', mons: [] }],
  party: ['pokemon/6', 'pokemon/25'], art: 'arenas/mountain_bg.png', roll: 420, photos: [{ file: null, cap: 'R1 S3 · Pikachu survived on 1 HP' }], ...o,
});
const blessing = (o: Partial<BlessingModel> = {}): BlessingModel => ({
  tier: 'Greater', name: "Lugia's Calm", legendary: 'Lugia', mon: null, number: 'XVII', passage: 'A cold wind crosses the sea.', headline: 'Rain never weakens your Fire moves.', summary: 'Fire moves keep their full power in rain.',
  step: 5, vows: null, vowAt: -1, book: null, ...o,
});

describe('the Phantom run end', () => {
  it('a lost run: where it stopped, the road, the run in numbers, the most valuable Pokémon and what stays', () => {
    const html = phOver(ph, over());
    expect(pageOf(html)).toBe('runover');
    expect(html).toContain('Stage 24 of 30 · Johto · lost to Leader Clair');
    expect(html).toContain('The run<br>ends here');
    expect(html).toContain('Kingdra (Lv60)');
    expect(html).toContain('aria-label="23 of 30 stages"');
    expect(count(html, '<i class="d"></i>')).toBe(23);
    expect(count(html, '<i class="x"></i>')).toBe(1);
    expect(count(html, 'class="ro-r"')).toBe(5);
    expect(html).toContain('Most valuable');
    expect(html).toContain('41 battles, 3 bosses');
    expect(html).toContain('Bank Credits <b>+ 1,240</b>');
    expect(count(html, /class="blade(?: on)?"/)).toBe(3);
    expect(html).toContain('class="blade on" data-key="b0"');
    for (const a of ['report', 'team', 'retry', 'poke', 'pick']) expect(html).toContain(`data-act="${a}"`);
    expect(html).toContain('class="ko"');
  });

  it('a lost run with nothing extra known still makes a page; a very long road gets thin steps', () => {
    const bare = phOver(ph, over({ where: undefined, line: undefined, road: null, mvp: null, payouts: [] }));
    expect(bare).toContain('Fell in Johto · Leader Clair');
    expect(bare).not.toContain('ro-road');
    expect(bare).not.toContain('ro-mvp');
    expect(bare).not.toContain('ro-keep');
    expect(phOver(ph, over({ road: { done: 40, of: 50 } }))).toContain('ph-ro-long');
    expect(count(phOver(ph, over({ road: { done: 3, of: 500 } })), /<i class="[dx]?"><\/i>/)).toBe(60);
  });

  it('a won run: six numbers, the badges on the seal, what it earned, and the tapped Pokémon answers', () => {
    const html = phOver(ph, over({ win: true, title: 'CHAMPION!', sub: '8 of 8 regions cleared · Day 41', poked: 1 }));
    expect(pageOf(html)).toBe('record');
    expect(html).toContain('8 OF 8 REGIONS CLEARED · DAY 41');
    expect(count(html, 'class="rc-s"')).toBe(4);
    expect(html).toContain('aria-label="7 badges"');
    expect(html).toContain('What this run earned');
    expect(count(html, 'class="dm-fr"')).toBe(2);
    expect(html).toContain('<u>♥</u>');
    expect(html).not.toContain('class="ko"');
    expect(html).toContain('step 1 of 3');
  });

  it('escapes what the run wrote', () => {
    const html = phOver(ph, over({ where: '<i>x</i>', mvp: { file: null, name: '<b>M</b>', text: 'a & b' } }));
    expect(html).not.toContain('<i>x</i>');
    expect(html).not.toContain('<b>M</b>');
    expect(html).toContain('a &amp; b');
  });
});

describe('the Phantom Hall of Fame team', () => {
  it('one banner per Pokémon with its title, level and note; the champion under them', () => {
    const html = phHall(ph, hall());
    expect(pageOf(html)).toBe('hall');
    expect(cutOut(html)).toEqual(['HALL OF FAME']);
    expect(count(html, 'class="hf-b ')).toBe(2);
    expect(html).toContain('ph-hf-b on');
    expect(html).toContain('The Ace');
    expect(html).toContain('Lv.97 · Shiny');
    expect(html).toContain('Signature: Flamethrower');
    expect(html).toContain('Champion Red');
    expect(html).toContain('8 of 8 regions · 64 badges · 2026-11-20');
    expect(html).toContain('data-act="back"');
    expect(html).toContain('ph-hf-solo');
    // As in the mock-up the banners lean in turn and wear their Pokémon's type colour; one with no type keeps the default.
    expect(html).toContain('style="--i:0;--r:-3deg"');
    const typed = phHall(ph, hall({ mons: hall().mons.map((m, k) => ({ ...m, type: k ? 'electric' : 'fire' })) }));
    expect(typed).toContain('--i:0;--r:-3deg;--tc:#ff6a2b');
    expect(typed).toContain('--i:1;--r:2deg;--tc:#f7c400');
  });

  it('never shows more than six', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ file: null, name: `Mon ${i}`, level: 50, tag: `No. ${i + 1}`, note: '', shiny: false }));
    expect(count(phHall(ph, hall({ mons: many })), 'class="hf-b ')).toBe(6);
  });
});

describe('the Phantom credits', () => {
  it('the roll keeps the scene’s handles, the first title is the big one, and the run’s moments are photos', () => {
    const html = phCredits(ph, credits());
    expect(pageOf(html)).toBe('credits');
    expect(html).toContain('rx-credits');
    expect(html).toContain('class="rx-roll" style="transform:translateY(420px)"');
    expect(html).toContain('<h2>Pocket Raiders</h2>');
    expect(html).toContain('<h3>Your run</h3>');
    expect(html).toContain('<h4>Director</h4>');
    expect(html).toContain('A run by Red');
    expect(count(html, '<figure')).toBe(1);
    expect(html).toContain('R1 S3 · Pikachu survived on 1 HP');
    expect(count(html, /<span style="--i:\d">/)).toBe(2);
    expect(html).toContain('step 2 of 3');
    expect(html).toContain('>Go on<');
  });

  it('the asset credits stand still, can be scrolled, and take the whole width', () => {
    const html = phCredits(ph, credits({ roll: null, party: [], photos: [], lead: '' }));
    expect(html).toContain('ph-cr-roll still wide');
    expect(html).toContain('<div class="rx-roll">');
    expect(html).not.toContain('fn-st');
    expect(html).not.toContain('cr-walk');
    expect(html).toContain('>Read<');
    expect(html).toContain('>Back<');
  });
});

describe('the Phantom blessing', () => {
  it('everything shown: the card, the gift, and Accept', () => {
    const html = phBlessing(ph, blessing());
    expect(pageOf(html)).toBe('blessing');
    expect(cutOut(html)).toEqual(['BLESSING']);
    expect(html).toContain('Greater Blessing');
    expect(html).toContain('XVII');
    expect(html).toContain('Lugia&#39;s Calm');
    expect(html).toContain('Lugia has blessed your journey.');
    // As the mock-up: the card says what it does; the shouted headline is spoken under it.
    expect(html).toMatch(/<p class="txt">Fire moves keep their full power in rain\.<\/p><small>LASTS THIS RUN/);
    expect(phBlessing(ph, blessing({ headline: 'THE WORLD IS KINDER TO THE LOVELY' }))).toContain('<br>The world is kinder to the lovely.</p>');
    expect(html).toContain('LASTS THIS RUN');
    expect(html).toContain('>Accept<');
    expect(html).not.toContain('ph-bl-wait');
    // Kice's rule: no stage and no light on it.
    expect(html).not.toMatch(/podium|spotlight/i);
  });

  it('the opening holds parts back until their beat, and shows the passage first', () => {
    const start = phBlessing(ph, blessing({ step: 0 }));
    expect(count(start, 'ph-bl-wait')).toBe(5);
    expect(start).toContain('>Show all<');
    const mid = phBlessing(ph, blessing({ step: 3 }));
    expect(mid).toContain('“A cold wind crosses the sea.”');
    expect(mid).not.toContain('has blessed your journey');
    expect(count(mid, 'ph-bl-wait')).toBe(1);
  });

  it('a vow is a choice, and the list of blessings hides the ones not found', () => {
    const vow = phBlessing(ph, blessing({ vows: [{ label: 'No one behind', text: 'Never leave a fainted Pokémon.' }, { label: 'Strike no one first', text: 'Never move first.' }], vowAt: 1 }));
    expect(count(vow, /class="ch(?: on)?"/)).toBe(2);
    expect(vow).toContain('class="ch on" data-key="v1"');
    expect(vow).toContain('>Swear<');
    const rows = Array.from({ length: BLESSING_ROWS }, (_, i) => ({ name: `Gift ${i}`, legendary: 'Mew', tier: 'lesser', text: 'A small thing.', found: i % 2 === 0, mine: i === 0 }));
    const book = phBlessing(ph, blessing({ book: { rows, page: 1, pages: 9, found: 30, of: 71 } }));
    expect(count(book, 'class="ph-bl-row')).toBe(BLESSING_ROWS);
    expect(count(book, '? ? ?')).toBe(BLESSING_ROWS / 2);
    expect(book).not.toContain('Gift 1<');
    expect(book).toContain('Gift 0');
    expect(book).toContain('30 of 71 found');
    expect(book).toContain('Page 2 of 9');
    expect(book).toContain('ph-bl-row mine');
  });
});

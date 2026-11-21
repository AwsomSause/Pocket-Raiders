import { describe, expect, it } from 'vitest';
import { pkPageOf } from '../../src/ui/pocket/kit';
import { pkBadgeGet, pkCatchParts, pkEvolve, pkExp, pkLearn, pkLevel, pkRivalLoss, pkVictory, type PkExpRow, type PkLearnModel } from '../../src/ui/pocket/screens/after';
import { pkBattle } from '../../src/ui/pocket/screens/battle';
import type { BattleModel } from '../../src/ui/redux/screens/battle';
import { versusView, type VersusModel } from '../../src/ui/redux/screens/versus';
import { cutView, type CutModel } from '../../src/ui/redux/screens/cut';

// The Pocket look's pages after a battle (mock-ups `victory`, `exp`, `levelup`, `movelearn`, `capture`).

const count = (html: string, bit: string): number => html.split(bit).length - 1;
const row = (over: Partial<PkExpRow> = {}): PkExpRow => ({ file: null, name: 'Turtwig', types: ['grass'], level: 5, to: null, from: 20, now: 60, gain: 72, fainted: false, ...over });

describe('the Pocket Victory page', () => {
  const base = { backdrop: 'arenas/grass.png', mvp: { file: null, name: 'Turtwig', type: 'grass' }, foe: { trainer: null, mon: null, name: 'Guitarist Vincent', line: 'The show is over.', type: 'normal' }, rows: [['Prize money', '₽ 165'], ['Nobody fainted', '✓'], ['Turns taken', '3'], ['Biggest hit', '12', 'Tackle']] as [string, string, string?][], total: '₽ 165', stars: 3, rate: 'Flawless win', say: 'You defeated **Guitarist Vincent**!' };
  it('shows the MVP, who you beat with their line, the rows, the total, the stars and Next', () => {
    const html = pkVictory(base);
    expect(pkPageOf(html)?.id).toBe('victory');
    expect(html).toContain('MVP');
    expect(html).toContain('"The show is over."');
    expect(count(html, 'class="vp-r"')).toBe(4);
    expect(html).toContain('<small>Tackle</small>');
    expect(html).toContain('vp-tot');
    expect(count(html, 'class="on">★')).toBe(3);
    expect(html).toContain('<b>Guitarist Vincent</b>!');
    expect(html).toContain('data-act="next"');
    expect(html).toContain('ar-bg dim');
  });
  it('leaves out the total, the line and the backdrop when there are none', () => {
    const html = pkVictory({ ...base, total: null, backdrop: null, foe: { ...base.foe, line: '' }, mvp: null, stars: 1, rate: 'Close call' });
    expect(html).not.toContain('vp-tot');
    expect(html).not.toContain('ar-bg');
    expect(html).not.toContain('MVP');
    expect(count(html, 'class="on">★')).toBe(1);
  });
});

describe('the Pocket Team EXP page', () => {
  it('a card per Pokémon: a level up lights it, a fainted one gets nothing, the rest say how far to go', () => {
    const html = pkExp({ rows: [row({ to: 6, now: 18 }), row({ name: 'Starly', types: ['normal', 'flying'] }), row({ name: 'Bidoof', fainted: true, gain: null })], say: 'The team gained EXP. **Turtwig** grew a level!' });
    expect(pkPageOf(html)?.id).toBe('exp');
    expect(html.match(/data-key="xc-\d/g)?.length).toBe(3);
    expect(html).toContain('xc up');
    expect(html).toContain('▲ Lv 6');
    expect(html).toContain('Level up!');
    expect(html).toContain('40% to next level');
    expect(html).toContain('xc fnt');
    expect(html).toContain('Fainted. No EXP this time.');
    expect(html).toContain('+ 72 EXP');
  });
  it('shows at most six cards', () => {
    expect(pkExp({ rows: Array.from({ length: 8 }, () => row()), say: '' }).match(/data-key="xc-\d/g)?.length).toBe(6);
  });
});

describe('the Pocket Level Up page', () => {
  const level = { file: null, name: 'Turtwig', types: ['grass'], from: 5, to: 6, stats: [['HP', 29, 4], ['Attack', 13, 1]] as [string, number, number][], say: 'Turtwig grew to Lv. 6!', go: 'say' };
  it('the stamp, the stat table old to new with the gains, and Next moving the words on', () => {
    const html = pkLevel(level);
    expect(pkPageOf(html)?.id).toBe('levelup');
    expect(html).toContain('<small>Lv 5</small><b>Lv 6</b>');
    expect(html).toContain('<span class="old">25</span>');
    expect(html).toContain('<span class="new">29</span><em>+4</em>');
    expect(html).toContain('data-act="say"');
  });
  it('the battle shows it while a level window is up (not over a menu)', () => {
    const m: BattleModel = { foes: [], mine: [], text: 'Turtwig grew to Lv. 6!', menu: null, tabs: null, header: '', status: '', momentum: '', note: '', auto: false, party: null, level: { name: 'Turtwig', file: null, from: 5, to: 6, stats: [['HP', 29, 4]] } };
    expect(pkPageOf(pkBattle(m))?.id).toBe('levelup');
    expect(pkPageOf(pkBattle({ ...m, menu: { options: [], index: 0 } }))?.id).toBe('battle');
  });
});

describe('the Pocket New Move page', () => {
  const d: PkLearnModel = {
    mon: 'Turtwig', count: 4, room: false, index: 3,
    next: { name: 'Razor Leaf', type: 'grass', category: 'physical', pp: '25', power: '55', accuracy: '95', text: 'High critical-hit chance.' },
    moves: [['Tackle', 'normal'], ['Withdraw', 'water'], ['Leafage', 'grass'], ['Seed Bomb', 'grass']].map(([name, type]) => ({ name: name!, type: type!, category: 'physical', pp: '10/10' })),
  };
  it('the new move card, four rows, the lit one swapped out, Keep old moves and Learn it', () => {
    const html = pkLearn(d);
    expect(pkPageOf(html)?.id).toBe('movelearn');
    expect(count(html, 'class="mv3')).toBe(4);
    expect(html).toContain('mv3 on');
    expect(html).toContain('<b>Seed Bomb</b> out, <b>Razor Leaf</b> in.');
    expect(html).toContain('data-act="pick" data-arg="4"');
    expect(html).toContain('Learn it');
  });
  it('a free slot is the first row; on "keep old moves" there is no Learn it; the answer shows with Next', () => {
    const room = pkLearn({ ...d, room: true, count: 3, moves: d.moves.slice(0, 3), index: 0 });
    expect(room).toContain('gx-ml-free on');
    expect(room).toContain('goes in the free slot');
    const keep = pkLearn({ ...d, index: 4 });
    expect(keep).not.toContain('Learn it');
    expect(keep).toContain('Give up on');
    const done = pkLearn({ ...d, result: 'Turtwig learned Razor Leaf!' });
    expect(done).toContain('Turtwig learned Razor Leaf!');
    expect(done).toContain('data-act="done"');
  });
});

describe('the Pocket catch card', () => {
  it('the ball with stars, Click!, and the card with types, nature and where; New! only the first time', () => {
    const c = { file: null, name: 'Starly', level: 4, types: ['normal', 'flying'], about: 'Bold nature · Keen Eye', ball: 'gb', where: 'Caught in a Great Ball · Stage 1', fresh: true };
    const html = pkCatchParts(c);
    expect(count(html, 'cap-st')).toBe(3);
    expect(html).toContain('Click!');
    expect(html).toContain('New!');
    expect(count(html, 'class="ty"')).toBe(2);
    expect(html).toContain('Caught in a Great Ball');
    expect(pkCatchParts({ ...c, fresh: false })).not.toContain('New!');
  });
});

describe('the Pocket Evolution page', () => {
  const d = { from: { file: 'pokemon/387.png', name: 'Turtwig' }, to: { file: 'pokemon/388.png', name: 'Grotle', types: ['grass'] }, ups: ['Defense', 'Attack'], sil: true, done: false, stoppable: true, text: 'What? Turtwig is evolving!' };
  it('while it glows: the old form as a shape and how to stop it; once out: the old form small and the facts', () => {
    const glow = pkEvolve(d);
    expect(pkPageOf(glow)?.id).toBe('evolve');
    expect(glow).toContain('ct-mon gx-sil');
    expect(glow).toContain('Hold <b>B</b>');
    expect(glow).not.toContain('ct-from');
    const out = pkEvolve({ ...d, sil: false, done: true, text: 'Turtwig evolved into Grotle!' });
    expect(out).toContain('Turtwig became <b>Grotle</b>');
    expect(out).toContain('Type: <b>Grass</b>');
    expect(out).toContain('Defense ▲ · Attack ▲');
    expect(out).not.toContain('Hold <b>B</b>');
    expect(out).toContain('data-act="next"');
  });
  it('a foe evolving cannot be stopped', () => {
    expect(pkEvolve({ ...d, stoppable: false })).not.toContain('Hold <b>B</b>');
  });
});

describe('the Pocket Boss Intro and the shiny tag', () => {
  const vs: VersusModel = { name: 'Brock', role: 'Gym Leader', cast: null, line: 'My rock-hard willpower!', evil: false, team: 3, lead: null, player: null, playerName: 'Red', party: [], backdrop: null };
  it('a boss gets the cut-in with its type, team, powers, heals and stake; others keep the VS card', () => {
    const boss = versusView({ pk: true } as never, { ...vs, pkBoss: { where: 'Pewter City · Gym Leader', type: 'rock', chips: ['**Rock** type', '3 Pokémon, each with a held item', 'up to 4 healing items', "At stake: **Brock's badge**"] } });
    expect(pkPageOf(boss)?.id).toBe('boss-intro');
    expect(boss).toContain('Pewter City · Gym Leader');
    expect(boss).toContain('<b>Rock</b> type');
    expect(boss).toContain('Brock: &quot;My rock-hard willpower!&quot;');
    expect(boss).toContain('--c:#afa981');
    expect(pkPageOf(versusView({ pk: true } as never, vs))?.id).toBe('vs');
  });
  it('a shiny foe has the ★ Shiny tag on its plate', () => {
    const m = (shiny: boolean): BattleModel => ({ foes: [{ name: 'Starly', level: 'Lv 4', hp: 1, hpText: '', xp: null, tags: [], team: null, shiny }], mine: [], text: '', menu: null, tabs: null, header: '', status: '', momentum: '', note: '', auto: false, party: null });
    expect(pkBattle(m(true))).toContain('★ Shiny');
    expect(pkBattle(m(false))).not.toContain('★ Shiny');
  });
});

describe('the Pocket badge and rival-loss pages', () => {
  it('Badge get: where, the badge name, the count, what else you get, Onward', () => {
    const html = pkBadgeGet({ type: 'water', where: 'Kanto Gym · Leader Misty', title: "Misty's Badge", count: 'Badge 2 of 8 in Kanto', gets: [['amulet_coin', '₽ 3,600 prize money'], ['map', 'The road to the next stage opens']], say: "You earned **Misty's badge**!" });
    expect(pkPageOf(html)?.id).toBe('badge-get');
    expect(html).toContain('Badge 2 of 8 in Kanto');
    expect(html.match(/<p><i>/g)?.length).toBe(2);
    expect(html).toContain('<b>Misty&#39;s badge</b>');
    expect(html).toContain('Onward');
    expect(html).toContain('--t:#2980ef');
  });
  it('Rival loss: the run goes on, ticks for good news and "!" for the rest, Carry on', () => {
    const html = pkRivalLoss({ cast: null, where: 'Stage 3 · Rival battle', name: 'Blue', line: 'Smell ya later!', list: [[true, 'Your team is patched up'], [false, 'Blue will be waiting']] });
    expect(pkPageOf(html)?.id).toBe('rival-loss');
    expect(html).toContain('Blue wins');
    expect(html).toContain('Losing to a rival never ends a run.');
    expect(html).toContain('<p class="ok"><i>✓</i>');
    expect(html).toContain('<p><i>!</i>');
    expect(html).toContain('Carry on');
  });
});

describe('the Pocket Legendary and Ultra Beast cut-ins', () => {
  const base: CutModel = { name: 'Mewtwo', role: 'Legendary Pokémon', line: '', cast: null, mon: null, backdrop: null, beat: 0, kind: 'aceEntrance' };
  it('a wild Legendary: where, name, type and facts, the line and Next; no wormhole', () => {
    const h = cutView({ pk: true } as never, { ...base, pkCut: { page: 'legend', where: 'Legendary Pokémon · Cerulean Cave', type: 'psychic', chips: ['Type: **Psychic**', 'Level **70**', 'It can be **caught**'], say: 'It goes silent. **Mewtwo** is watching you.', backdrop: null } });
    expect(pkPageOf(h)?.id).toBe('legend');
    expect(h).toContain('cut cleg');
    expect(h).toContain('<b>Psychic</b>');
    expect(h).toContain('It can be <b>caught</b>');
    expect(h).toContain('<b>Mewtwo</b> is watching you.');
    expect(h).toContain('gx-spiral');
    expect(h).not.toContain('hole22');
  });
  it('an Ultra Beast: the wormhole, its rule, the Beast Ball and the setting; without pkCut the ace card stays', () => {
    const h = cutView({ pk: true } as never, { ...base, name: 'Nihilego', pkCut: { page: 'ub', where: 'Ultra Deep Sea · Ultra Beast', type: 'rock', chips: ['Type: **Rock** and **Poison**', '**Host**: lead is possessed', 'ball:Only a **Beast Ball** catches it', 'Ultra Beasts are on'], say: 'The sky tears open.', backdrop: 'arenas/raid_ultra_bg.png' } });
    expect(pkPageOf(h)?.id).toBe('ub');
    expect(h).toContain('cut cub');
    expect(h).toContain('hole22');
    expect(h).toContain('raid_ultra_bg.png');
    expect(h).toContain('Only a <b>Beast Ball</b> catches it');
    expect(pkPageOf(cutView({ pk: true } as never, base))?.id).toBe('ace');
  });
});

describe('the Pocket boss battle panel', () => {
  it('a boss battle is its own page with the gold tag, power, heals left and badge', () => {
    const base = { header: '', foes: [], mine: [], text: '', tabs: null, menu: null } as unknown as BattleModel;
    const h = pkBattle({ ...base, pkBoss: { name: 'Leader Misty', tag: 'Gym Battle', power: { kind: 'dynamax', ready: true }, heals: [2, 4], badge: 'water' } });
    expect(pkPageOf(h)?.id).toBe('boss-battle');
    expect(h).toContain('bb18');
    expect(h).toContain('Leader Misty');
    expect(h).toContain('Ready');
    expect(h).toContain('2 of 4');
    expect((h.match(/<u class="on">/g) ?? []).length).toBe(2);
    expect(h).toContain('Water');
    expect(pkPageOf(pkBattle(base))?.id).toBe('battle');
  });
});

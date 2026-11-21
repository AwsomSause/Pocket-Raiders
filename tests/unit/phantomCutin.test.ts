import { describe, expect, it } from 'vitest';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { pageOf } from '../../src/ui/phantom/kit';
import { figure } from '../../src/ui/redux/templates';
import { cutLook, phCut, phGimmick, phVersus, quoted, type GimmickCard } from '../../src/ui/phantom/screens/cutin';
import { phRivalScout } from '../../src/ui/phantom/screens/pops';
import type { CutModel } from '../../src/ui/redux/screens/cut';
import type { VersusModel } from '../../src/ui/redux/screens/versus';

// The Phantom UI's full-screen battle cards: the versus card, the cutscene card's three cuts, and the cut-ins of a
// Mega Evolution, a Terastallization, a Dynamax and a Z-Move.

const ph = PHANTOM_VERSIONS[0]!;
const count = (html: string, bit: string | RegExp): number => html.split(bit).length - 1;
/** The cut-out letters of a word, read back as plain text. */
const cutOut = (html: string): string[] => [...html.matchAll(/class="rs[^"]*" aria-label="([^"]*)"/g)].map((m) => m[1]!);

const versus = (over: Partial<VersusModel> = {}): VersusModel => ({ name: 'Silver', role: 'Rival', cast: null, line: 'You again. Try to keep up this time.', evil: false, team: 4, lead: null, player: null, playerName: 'Red', party: [null, null, null], backdrop: null, ...over });
const cut = (over: Partial<CutModel> = {}): CutModel => ({ name: 'Lance', role: 'Champion', line: 'See my true strength!', cast: null, backdrop: null, beat: 2, ...over });
const card = (over: Partial<GimmickCard> = {}): GimmickCard => ({ kind: 'mega', name: 'Charizard', mon: null, trainer: 'Red', cast: null, ...over });

describe('the Phantom versus card', () => {
  it('names both sides, counts their Pokémon, quotes the foe once and lets a click or Z move on', () => {
    const html = phVersus(ph, versus({ where: 'Stage 17 · Route 22', stake: 'Lose and the run goes on.' }));
    expect(pageOf(html)).toBe('vs');
    expect(html).toContain('Rival battle');
    expect(html).toContain('Stage 17 · Route 22');
    expect(html).toContain('You · 3 can fight');
    // As the mock-up: a fainted Pokémon's ball goes dark, and the count says who can still fight.
    const hurt = phVersus(ph, versus({ fainted: [false, true, false] }));
    expect(hurt).toContain('You · 2 can fight');
    expect(count(hurt, 'class="ph-vs-ball out"')).toBe(1);
    expect(hurt).toContain('pokeball/pb.png');
    expect(hurt).toContain('pokeball/ub.png');
    expect(html).toContain('>Red</h3>');
    expect(html).toContain('>Silver</h3>');
    expect(cutOut(html)).toEqual(['VS']);
    expect(html).toContain('“You again. Try to keep up this time.”');
    expect(html).toContain('What is at stake');
    expect(html).toContain('Lose and the run goes on.');
    // Three of your own, four of the foe's (none shown yet): seven balls.
    expect(count(html, 'class="ph-vs-ball"')).toBe(7);
    expect(count(html, 'data-act="next"')).toBe(2);
  });

  it('leaves out what it was not given, and marks an Evil Team foe', () => {
    const html = phVersus(ph, versus({ line: '', role: '', evil: true, team: 9, party: [] }));
    expect(html).not.toContain('vs-q');
    expect(html).not.toContain('vs-s');
    expect(html).toContain('Trainer battle');
    expect(html).toContain('ph-vs-evil');
    // Never more than six balls a side.
    expect(count(html, 'class="ph-vs-ball"')).toBe(6);
    // A role that already says "battle" is not doubled, and a long role keeps only its first part in the heading.
    expect(phVersus(ph, versus({ role: 'Final Rival Battle' }))).not.toContain('Battle battle');
    expect(phVersus(ph, versus({ role: 'Rival · plans to sweep' }))).toContain('Rival battle');
  });

  it('quotes a line once, whatever marks it came with', () => {
    expect(quoted('Hello.')).toBe('“Hello.”');
    expect(quoted('"Hello."')).toBe('“Hello.”');
    expect(quoted('He said "no" twice.')).toBe('He said &quot;no&quot; twice.');
    expect(quoted('   ')).toBe('');
  });
});

describe('the Phantom cutscene card', () => {
  it('picks its cut by the moment: a transformation, an ace stepping out, or a speaker', () => {
    const mon = { file: 'x.png', atlas: true };
    expect(cutLook({ kind: 'mega', mon, cast: null })).toBe('form');
    expect(cutLook({ kind: 'aceEntrance', mon, cast: null })).toBe('ace');
    // An ace card with no Pokémon picture falls back to the speaker's card.
    expect(cutLook({ kind: 'aceEntrance', mon: null, cast: null })).toBe('boss');
    expect(cutLook({ kind: 'championIntro', mon: null, cast: null })).toBe('boss');
    expect(cutLook({ mon, cast: null })).toBe('boss');
  });

  it('a boss card: the name in cut-out letters, the plate, the line, what they bring, the beats and the skip key', () => {
    const html = phCut(ph, cut({ kind: 'championIntro', tag: 'THE CHAMPION', where: 'Stage 30 · Indigo Plateau', brings: { team: 6, notes: ['The ace is announced when it enters.'] } }));
    expect(pageOf(html)).toBe('boss');
    expect(cutOut(html)).toEqual(['LANCE']);
    expect(html).toContain('<em>Champion</em>');
    expect(html).toContain('Stage 30 · Indigo Plateau');
    expect(html).toContain('THE CHAMPION · THE CHAMPION');
    // As the mock-up: with the list, the line is left to the versus card that follows (the same line).
    expect(html).not.toContain('See my true strength!');
    expect(phCut(ph, cut({ kind: 'championIntro', brings: null }))).toContain('“See my true strength!”');
    expect(html).toContain('6 Pokémon');
    expect(count(html, 'class="ph-vs-ball"')).toBe(6);
    expect(html).toContain('The ace is announced when it enters.');
    // The gimmicks with their marks, the gear, and the specialty under the name.
    const full = phCut(ph, cut({ kind: 'championIntro', sub: 'Dragon specialist', brings: { team: 6, notes: [], gimmicks: ['mega', 'dynamax'], held: true, trained: true } }));
    expect(full).toContain('<b>Mega Evolution and Dynamax</b>');
    expect(full).toContain('packs/dbk/mega/icon.png');
    expect(full).toContain('<b>Held items and full training</b>');
    expect(full).toContain('<p>Dragon specialist</p>');
    expect(phCut(ph, cut({ kind: 'championIntro', brings: { team: 2, notes: [], gimmicks: [], held: false, trained: false } }))).not.toContain('Held items');
    // Beat 3 of 5 is lit, and named.
    expect(count(html, '<i class="on"></i>')).toBe(3);
    expect(html).toContain('<span>Moment</span>');
    expect(html).toContain('data-act="next"');
    expect(html).toMatch(/<b>Z<\/b>Begin/);
  });

  it('a moment that cannot be skipped shows no key, and an empty one no empty panel', () => {
    const html = phCut(ph, cut({ skip: null, line: '', brings: null, beat: 9 }));
    expect(html).not.toContain('class="keys"');
    expect(html).not.toContain('bs-i');
    expect(count(html, '<i class="on"></i>')).toBe(5);
    expect(html).not.toContain('“”');
  });

  it('an ace card announces the Pokémon by name under its star', () => {
    const html = phCut(ph, cut({ kind: 'aceEntrance', tag: 'ACE!', name: 'Gengar', role: 'Rival ace', line: 'This is where you stop.', mon: { file: 'gengar.png', atlas: true } }));
    expect(pageOf(html)).toBe('ace');
    expect(cutOut(html)).toEqual(['GENGAR']);
    expect(html).toContain('Rival ace');
    expect(html).toContain('<b>ACE</b>');
    expect(html).toContain('ACE · ACE');
    expect(html).toContain('“This is where you stop.”');
    // Its level and types under the name (mock-up `ace`), only when the card is told them.
    expect(html).not.toContain('ac-tags');
    const tagged = phCut(ph, cut({ kind: 'aceEntrance', tag: 'ACE!', name: 'Gengar', mon: { file: 'gengar.png', atlas: true }, tags: { level: 60, types: ['ghost', 'poison'] } }));
    expect(tagged).toMatch(/class="ac-tags"><b>Lv\.60<\/b><span class="ty"[^>]*>.*GHOST.*POISON/);
    // A Legendary's entrance uses the same cut with a plain star.
    expect(phCut(ph, cut({ kind: 'aceEntrance', tag: 'Legendary Pokémon', name: 'Mewtwo', mon: { file: 'm.png', atlas: true } }))).toContain('<b>★</b>');
  });

  it('a transformation card writes its words in cut-out letters over two lines', () => {
    const html = phCut(ph, cut({ kind: 'mega', name: 'Mega Charizard X', role: 'Mega Evolution', line: 'The stone answers the bracelet.', mon: { file: 'c.png', atlas: true } }));
    expect(pageOf(html)).toBe('mega');
    expect(cutOut(html)).toEqual(['MEGA', 'EVOLUTION']);
    expect(html).toContain('MEGA CHARIZARD X');
    expect(html).toContain('The stone answers the bracelet.');
  });

  it('escapes names and lines', () => {
    const html = phCut(ph, cut({ name: '<i>x</i>', line: '<b>y</b>' }));
    expect(html).not.toContain('<i>x</i>');
    expect(html).not.toContain('<b>y</b>');
  });
});

describe('the Phantom transformation cut-ins', () => {
  it('Mega Evolution names the stone and whose ring it answers; a wild one has no Trainer', () => {
    const html = phGimmick(ph, card({ item: 'Charizardite X' }));
    expect(pageOf(html)).toBe('mega');
    expect(cutOut(html)).toEqual(['MEGA', 'EVOLUTION']);
    expect(html).toContain("Charizard's <b>CHARIZARDITE X</b> is reacting to Red's Mega Ring!");
    expect(phGimmick(ph, card({ trainer: '' }))).toContain('Charizard is Mega Evolving!');
    const primal = phGimmick(ph, card({ kind: 'primal', name: 'Kyogre' }));
    expect(cutOut(primal)).toEqual(['PRIMAL', 'REVERSION']);
    expect(primal).toContain('Kyogre returns to its <b>PRIMAL</b> form!');
    // As in the mock-up: the Pokémon in close-up fills the cut (not the Trainer), the field dims, the ring spins top right for a Mega only.
    const mon = { file: 'charizard-mega-x.png', atlas: true };
    const pk = phGimmick(ph, card({ mon, cast: { file: 'red.png', atlas: true } }));
    expect(pk).toContain(`class="face ph-gm-close">${figure(mon, 860)}</div>`);
    expect(pk).toBe(phGimmick(ph, card({ mon, cast: null })));
    expect(pk).toContain('ph-gm-dim');
    expect(pk).toContain('packs/dbk/mega/ring.png');
    expect(primal).not.toContain('ph-gm-ring');
  });

  it('Terastallizing shows the Tera type and spells the word letter by letter', () => {
    const html = phGimmick(ph, card({ kind: 'tera', type: 'dragon' }));
    expect(pageOf(html)).toBe('tera');
    expect(count(html, /<b style="--i:\d+">/)).toBe('Terastallize'.length);
    expect(html).toContain('Tera type');
    expect(html).toContain('DRAGON');
    expect(html).toContain('Charizard Terastallized into the <b>Dragon</b> type!');
    expect(count(html, 'class="tr-sh"')).toBe(5);
    // No type known: no empty badge.
    expect(phGimmick(ph, card({ kind: 'tera' }))).not.toContain('tr-ty');
  });

  it('Dynamax shows how long it lasts and what it does to HP', () => {
    const html = phGimmick(ph, card({ kind: 'dynamax', hp: [214, 428], turns: 3 }));
    expect(pageOf(html)).toBe('dmax');
    expect(html).toContain('<b>3 turns</b>');
    expect(html).toContain('214 <em>→</em> 428');
    expect(html).toContain('Max Moves');
    expect(phGimmick(ph, card({ kind: 'gigantamax', turns: 1 }))).toContain('<b>1 turn</b>');
    expect(phGimmick(ph, card({ kind: 'dynamax' }))).not.toContain('dx-hp');
  });

  it('a Z-Move shows its name, type, power and crystal', () => {
    const html = phGimmick(ph, card({ kind: 'zmove', name: 'Pikachu', type: 'electric', item: 'Electrium Z', move: { name: 'Gigavolt Havoc', power: 175 } }));
    expect(pageOf(html)).toBe('zmove');
    expect(html).toContain('<em>Gigavolt</em><strong>Havoc</strong>');
    expect(html).toContain('<b>Power 175</b>');
    expect(html).toContain('Electrium Z');
    expect(html).toContain('ELECTRIC');
    expect(html).toContain('Red and Pikachu let loose their full-force <b>Z-Power</b>!');
    // The mock-up's glowing Z orb at the hand, and the Z-Ring beside the crystal's name.
    expect(html).toMatch(/class="zm-orb"[^>]*><i class="spr"[^>]*><img class="px " src="[^"]*packs\/dbk\/zpower\/particle\.png"/);
    expect(html).toContain('items/z_ring.png');
    // A status Z-Move has no power to show; a wild user has no partner.
    const wild = phGimmick(ph, card({ kind: 'zmove', trainer: '', move: { name: 'Z-Splash', power: null } }));
    expect(wild).not.toContain('<b>Power');
    expect(wild).toContain('Charizard lets loose its full-force');
    expect(wild).toContain('<strong>Z-Splash</strong>');
  });

  it('every cut-in can be skipped with a click or its key', () => {
    for (const kind of ['mega', 'primal', 'tera', 'dynamax', 'gigantamax', 'zmove'] as const) {
      const html = phGimmick(ph, card({ kind }));
      expect(count(html, 'data-act="next"'), kind).toBe(2);
      expect(html, kind).toMatch(/<b>Z<\/b>Skip/i);
    }
  });
});

describe('the Phantom scout page (a rival before the fight)', () => {
  const seen = { file: null, name: 'Gengar', level: 60, types: ['ghost', 'poison'], moves: ['Shadow Ball', 'Sludge Bomb'], note: 'Seen in your last fight', ace: true };
  it('shows what was seen this run, ? for the rest, the ace, Rotom’s tip, and Battle / Back keys', () => {
    const html = phRivalScout(ph, { name: 'Silver', who: null, cards: [null, seen, null], tip: 'Bzzt! Ground and Dark moves hit their ace hard.', index: 1 });
    expect(pageOf(html)).toBe('scout');
    expect(html).toContain('Seen this run · 1 of 3');
    expect(html).toContain('Silver’s team');
    expect(count(html, '<b>?</b>')).toBe(2);
    expect(count(html, 'Not seen this run')).toBe(2);
    expect(html).toContain('<em>ACE</em>');
    expect(html).toContain('Shadow Ball · Sludge Bomb');
    expect(html).toContain('Rotom says');
    expect(html).toMatch(/<b>Z<\/b>Battle/);
    expect(html).toMatch(/data-act="back"/);
    // No tip, no panel; never more than six cards.
    const bare = phRivalScout(ph, { name: 'Silver', who: null, cards: Array(9).fill(null), tip: '', index: 0 });
    expect(bare).not.toContain('Rotom says');
    expect(count(bare, 'class="pn sc-c')).toBe(6);
    // Opened from the rival-loss card, Z carries on instead of starting the battle.
    expect(html).toMatch(/<b>Z<\/b>Battle/);
    expect(phRivalScout(ph, { name: 'Silver', who: null, cards: [], tip: '', index: 0, done: 'Carry on' })).toMatch(/<b>Z<\/b>Carry on/);
  });
  it('a rival’s versus card offers it on C; another Trainer’s does not', () => {
    expect(phVersus(ph, versus({ scout: true }))).toMatch(/data-act="scout"[^>]*><b>C<\/b>Scout their team/);
    expect(phVersus(ph, versus())).not.toContain('data-act="scout"');
  });
});

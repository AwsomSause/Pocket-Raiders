import { describe, expect, it } from 'vitest';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { pageOf } from '../../src/ui/phantom/kit';
import { cutLook, phCut, phGimmick, phVersus, quoted, type GimmickCard } from '../../src/ui/phantom/screens/cutin';
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
    expect(html).toContain('You · 3 Pokémon');
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
    expect(html).toContain('“See my true strength!”');
    expect(html).toContain('6 Pokémon');
    expect(count(html, 'class="ph-vs-ball"')).toBe(6);
    expect(html).toContain('The ace is announced when it enters.');
    // Beat 3 of 5 is lit, and named.
    expect(count(html, '<i class="on"></i>')).toBe(3);
    expect(html).toContain('<span>Moment</span>');
    expect(html).toContain('data-act="next"');
    expect(html).toMatch(/<b>X<\/b>skip/);
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

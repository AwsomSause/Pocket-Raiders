import { describe, expect, it } from 'vitest';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { pageOf } from '../../src/ui/phantom/kit';
import { phDecision } from '../../src/ui/phantom/screens/decide';
import { phHit, phKo, phResult, phRivalLoss, phSend, phWild, phWin, type HitModel, type KoModel, type ResultModel, type RivalLossModel, type SendModel, type WildModel, type WinModel } from '../../src/ui/phantom/screens/moments';
import type { DecisionModel } from '../../src/ui/redux/screens/decision';

// The Phantom UI's short battle moments (a wild Pokémon, the send-out, a hard hit, a knock-out, the win, the tally,
// a loss to a rival) and the decisions a run stops for (a new move, a new Pokémon, a plain choice).

const ph = PHANTOM_VERSIONS[0]!;
const count = (html: string, bit: string | RegExp): number => html.split(bit).length - 1;
const cutOut = (html: string): string[] => [...html.matchAll(/class="rs[^"]*" aria-label="([^"]*)"/g)].map((m) => m[1]!);

const wild = (over: Partial<WildModel> = {}): WildModel => ({ name: 'Dragonite', mon: null, level: 60, types: ['dragon', 'flying'], where: 'Stage 14 · Route 22', lead: 'A wild', tail: 'appeared!', tag: 'Wild', note: 'New · not in your Pokédex', catchable: true, cant: '', balls: [{ name: 'Ultra Ball', n: 2 }, { name: 'Poké Ball', n: 5 }, { name: 'Great Ball', n: 0 }], backdrop: null, ...over });
const send = (over: Partial<SendModel> = {}): SendModel => ({ me: { by: 'Red', name: 'Charizard', level: 58, types: ['fire', 'flying'], mon: null }, foe: { by: 'Silver', name: 'Sneasel', level: 58, types: ['dark', 'ice'], mon: null }, order: [{ file: null, on: true, ko: false }, { file: null, on: false, ko: true }], backdrop: null, ...over });
const hit = (over: Partial<HitModel> = {}): HitModel => ({ words: ['SUPER', 'EFFECTIVE!'], victim: null, name: 'Garchomp', damage: 142, from: 81, to: 23, by: 'Charizard', move: 'Dragon Claw', ...over });
const ko = (over: Partial<KoModel> = {}): KoModel => ({ by: null, tag: 'One Dragon Claw was all it took.', foe: { name: 'Garchomp', file: null }, left: { owner: 'Silver', alive: 2, total: 6 }, ...over });
const win = (over: Partial<WinModel> = {}): WinModel => ({ words: 'YOU WIN', hero: null, mon: null, line: 'Aw, I lost...', by: 'Youngster Joey', sub: 'Youngster Joey is out of Pokémon', ...over });
const result = (over: Partial<ResultModel> = {}): ResultModel => ({
  where: 'Stage 15 · Trainer battle',
  rows: [{ file: null, name: 'Charizard', from: 64, to: 82, gain: 1420, level: null, fainted: false }, { file: null, name: 'Pikachu', from: 90, to: 18, gain: 1420, level: [55, 56], fainted: false }, { file: null, name: 'Gyarados', from: 0, to: 0, gain: null, level: null, fainted: true }],
  gains: [['+₽1,240', 'prize money'], ['7 TURNS', 'no one fainted'], ['REWARD PICK', 'coming up next']],
  ...over,
});
const rloss = (over: Partial<RivalLossModel> = {}): RivalLossModel => ({ name: 'Silver', cast: null, where: 'Stage 17 · Rival battle lost', line: 'Hmph. Come back when you can keep up.', text: 'Losing to a rival never ends a run.', party: [null, null, null], ...over });
const decision = (over: Partial<DecisionModel> = {}): DecisionModel => ({ title: 'New move', card: null, options: [], index: 0, details: [], text: '', party: null, more: null, result: null, hints: [['Enter', 'choose']], ...over });

describe('the Phantom battle moments', () => {
  it('a wild Pokémon: its name in cut-out letters, its level and types, whether it is new, and the balls in the Bag', () => {
    const html = phWild(ph, wild());
    expect(pageOf(html)).toBe('wild');
    expect(cutOut(html)).toEqual(['DRAGONITE']);
    expect(html).toContain('<em>A wild</em>');
    expect(html).toContain('appeared!');
    expect(html).toContain('Stage 14 · Route 22');
    expect(html).toContain('<b>Lv.60</b>');
    expect(html).toContain('DRAGON');
    expect(html).toContain('New · not in your Pokédex');
    expect(html).toContain('It can be caught');
    expect(html).toContain('Ultra Ball × 2');
    // A ball the Bag has none of is not listed.
    expect(html).not.toContain('Great Ball');
    expect(html).toContain('WILD · WILD');
    expect(count(html, 'data-act="next"')).toBe(2);
  });

  it('a wild Pokémon that cannot be caught says why; an empty Bag says so; no grass unless the place is grassy', () => {
    const cant = phWild(ph, wild({ catchable: false, cant: 'A Totem Pokémon cannot be caught.', note: '' }));
    expect(cant).toContain("It can't be caught");
    expect(cant).toContain('A Totem Pokémon cannot be caught.');
    expect(cant).not.toContain('wl-new');
    expect(phWild(ph, wild({ balls: [] }))).toContain('No balls in the Bag');
    expect(phWild(ph, wild())).not.toContain('wl-grass');
    expect(phWild(ph, wild({ grass: true }))).toContain('wl-grass');
    expect(phWild(ph, wild({ name: '<b>x</b>' }))).not.toContain('<b>x</b>');
  });

  it('the send-out names both sides, and shows the party order with who leads and who is down', () => {
    const html = phSend(ph, send());
    expect(pageOf(html)).toBe('send');
    expect(cutOut(html)).toEqual(['GO!']);
    expect(html).toContain('Red sends out');
    expect(html).toContain('Charizard <small>Lv.58</small>');
    expect(html).toContain('Silver sends out');
    expect(html).toContain('Your order');
    expect(html).toContain('<i class="on">');
    expect(html).toContain('<i class=" ko">');
    // A wild foe has no Trainer; no foe at all leaves its plate out.
    expect(phSend(ph, send({ foe: { by: '', name: 'Feebas', level: 4, types: ['water'], mon: null } }))).toContain('Wild Pokémon');
    expect(count(phSend(ph, send({ foe: null })), 'sn-n ')).toBe(1);
  });

  it('a hard hit shows the words, the damage, the bar before and after, and the move', () => {
    const html = phHit(ph, hit());
    expect(pageOf(html)).toBe('hit');
    expect(cutOut(html)).toEqual(['SUPER', 'EFFECTIVE!']);
    expect(html).toContain('−142');
    expect(html).toContain('23%');
    expect(html).toContain('--from:81%');
    expect(html).toContain('width:23%');
    expect(html).toContain('CHARIZARD used <b>DRAGON CLAW</b>!');
    // Out-of-range numbers are held to the bar; no move, no line.
    const odd = phHit(ph, hit({ from: 140, to: -5, move: '', damage: 0, words: ['CRITICAL', 'HIT!'] }));
    expect(odd).toContain('--from:100%');
    expect(odd).toContain('width:0%');
    expect(odd).not.toContain('class="say"');
    expect(odd).not.toContain('class="dmg"');
    expect(cutOut(odd)).toEqual(['CRITICAL', 'HIT!']);
  });

  it('a knock-out names who fell and how many the Trainer has left; a wild one has no count', () => {
    const html = phKo(ph, ko());
    expect(pageOf(html)).toBe('ko');
    expect(cutOut(html)).toEqual(['KNOCK', 'OUT!']);
    expect(html).toContain('One Dragon Claw was all it took.');
    expect(html).toContain('Garchomp');
    expect(html).toContain('Silver has 2 left');
    expect(count(html, 'class="ph-vs-ball"')).toBe(2);
    expect(count(html, 'class="ph-vs-ball out"')).toBe(4);
    expect(phKo(ph, ko({ left: null }))).not.toContain('ko-left');
  });

  it('the win quotes the foe once and says who is out of Pokémon', () => {
    const html = phWin(ph, win());
    expect(pageOf(html)).toBe('win');
    expect(cutOut(html)).toEqual(['YOU WIN']);
    expect(html).toContain('“Aw, I lost...”');
    expect(html).toContain('YOUNGSTER JOEY');
    expect(html).toContain('Youngster Joey is out of Pokémon');
    expect(phWin(ph, win({ line: '' }))).not.toContain('ph-wn-line');
  });

  it('the result page tallies each Pokémon and what was gained', () => {
    const html = phResult(ph, result());
    expect(pageOf(html)).toBe('result');
    expect(html).toContain('Stage 15 · Trainer battle');
    expect(count(html, 'class="tlw"')).toBe(3);
    expect(html).toContain('+1420');
    expect(html).toContain('LEVEL UP! 55 → 56');
    expect(count(html, 'class="tl up"')).toBe(1);
    // One that took no part gets a dash, not a zero.
    expect(html).toContain('<span>—</span>');
    expect(html).toContain('+₽1,240<small>prize money</small>');
    expect(html).toContain('class="g s"');
    // Never more than six rows.
    const many = phResult(ph, result({ rows: Array.from({ length: 9 }, (_, k) => ({ file: null, name: `Mon ${k}`, from: 0, to: 10, gain: 5, level: null, fainted: false })) }));
    expect(count(many, 'class="tlw"')).toBe(6);
  });

  it('a loss to a rival says the run goes on', () => {
    const html = phRivalLoss(ph, rloss());
    expect(pageOf(html)).toBe('rloss');
    expect(cutOut(html)).toEqual(['THE RUN', 'GOES ON']);
    expect(html).toContain('Stage 17 · Rival battle lost');
    expect(html).toContain('“Hmph. Come back when you can keep up.”');
    expect(html).toContain('Losing to a rival never ends a run.');
    expect(html).toContain('Your team gets back up');
    expect(phRivalLoss(ph, rloss({ line: '' }))).not.toContain('rl-q');
  });
});

describe('the Phantom decision pages', () => {
  const moves = [{ label: 'Scratch', small: 'Physical · 40 · PP 35/35', type: 'normal', off: false }, { label: 'Ember', small: 'Special · 40 · PP 25/25', type: 'fire', off: false }];
  const small = { big: false, file: null, name: 'Charizard', level: 'Lv 36', tag: '', sub: 'wants to learn', accent: 'Air Slash', types: ['flying'], lines: ['Special · Power 75 · PP 15.'] };

  it('a new move: the move on its card, the known moves as the list, the way out as a blade', () => {
    const html = phDecision(ph, decision({ card: small, options: [...moves, { label: 'Do not learn Air Slash', small: '', type: null, off: false }], index: 0, text: 'Scratch would be replaced.' }));
    expect(pageOf(html)).toBe('learn');
    expect(html).toContain('CHARIZARD · LV 36');
    expect(html).toContain('wants to learn');
    expect(html).toContain('>Air Slash</h3>');
    expect(html).toContain('FLYING');
    expect(html).toContain('Forget which one?');
    expect(count(html, 'class="lm pn')).toBe(2);
    // As in the mock-up: the type, kind and power in small, the PP apart at the right.
    expect(html).toContain('<span class="s">NORMAL · PHYSICAL · POWER 40</span><span class="pp">35/35</span>');
    // Only the lit row carries the key, and says what it does.
    expect(count(html, '<em>FORGET · Z</em>')).toBe(1);
    expect(count(html, '<em>')).toBe(1);
    expect(html).toContain('ln-keep');
    expect(html).toContain('Do not learn Air Slash');
    expect(html).toContain('Scratch would be replaced.');
    // Every answer can be clicked, by its own number.
    expect(count(html, 'data-act="pick"')).toBe(3);
    expect(html).toContain('data-act="pick" data-arg="2"');
    // With the swap told, the box compares the two moves (mock-up `learn`); a status move has no power in its line.
    const swap = { from: 'Scratch', to: 'Air Slash', power: ['40', '75'] as const, type: ['Normal', 'Flying'] as const, brief: 'Scratches with <claws>.' };
    const cmp = phDecision(ph, decision({ card: small, options: [...moves, { label: 'Growl', small: 'Status · — · PP 40/40', type: 'normal', off: false }], index: 0, text: 'Scratch would be replaced.', swap }));
    expect(cmp).toContain('<span class="lab">Scratch → Air Slash</span><p class="txt">Power 40 → <b>75</b> · Normal → <b>Flying</b>');
    expect(cmp).toContain('Scratches with &lt;claws&gt;.');
    expect(cmp).not.toContain('Scratch would be replaced.');
    expect(cmp).toContain('<span class="s">NORMAL · STATUS</span><span class="pp">40/40</span>');
    // The way out lit: no compare box of moves.
    expect(phDecision(ph, decision({ card: small, options: [...moves, { label: 'Do not learn Air Slash', small: '', type: null, off: false }], index: 2, text: 'Keep them.', swap: null }))).not.toContain(' → ');
  });

  it('a free slot comes first in the list, and a long list steps down to two columns', () => {
    const room = phDecision(ph, decision({ card: small, options: [{ label: 'Learn Air Slash', small: 'Free move slot', type: null, off: false }, ...moves, { label: 'Do not learn Air Slash', small: '', type: null, off: false }] }));
    expect(count(room, 'class="lm pn')).toBe(3);
    expect(count(room, 'class="blade ln-keep')).toBe(1);
    const long = phDecision(ph, decision({ card: { ...small, sub: 'can learn a move from the' }, options: Array.from({ length: 9 }, (_, k) => ({ label: `Move ${k}`, small: 'Physical · 40 · PP 10/10', type: 'normal', off: k === 3 })) }));
    expect(long).toContain('ph-ln-list two');
    expect(long).toContain('Which one?');
    expect(count(long, ' off"')).toBe(1);
  });

  it('a caught Pokémon: the cut-out word, its card, where it can go, and the party', () => {
    const big = { big: true, file: null, name: 'Dragonite', level: 'Lv 60', tag: 'NEW', sub: 'Multiscale · Adamant', accent: '', types: ['dragon', 'flying'], lines: [] };
    const html = phDecision(ph, decision({ title: 'Caught!', card: big, options: [{ label: 'Add to party', small: 'Party 5/6', type: null, off: false }, { label: 'Send to the PC', small: '3/30', type: null, off: true }], index: 1, details: ['Stats: HP 273'], text: 'Where should it go?', party: [{ name: 'Rowlet', file: null, hp: 0.5, level: 5, fainted: false }] }));
    expect(pageOf(html)).toBe('capture');
    expect(cutOut(html)).toEqual(['GOTCHA!']);
    expect(html).toContain('New in your Pokédex');
    expect(html).toContain('>Dragonite</h3>');
    expect(html).toContain('<b>Lv.60</b>');
    expect(html).toContain('Multiscale · Adamant');
    expect(count(html, 'class="ch')).toBe(2);
    expect(html).toContain('class="ch on off"');
    expect(html).toContain('Stats: HP 273');
    expect(html).toContain('--hp:50%');
    expect(html).toContain('cp-pips');
    // A reunion uses its own word and no shakes.
    const back = phDecision(ph, decision({ title: 'Reunion', card: { ...big, tag: '' }, options: [] }));
    expect(cutOut(back)).toEqual(['REUNION']);
    expect(back).not.toContain('cp-pips');
  });

  it('a plain choice lists its answers; the details sheet and the result line lie over the page', () => {
    const html = phDecision(ph, decision({ title: 'Signature', options: [{ label: 'Second Wind', small: 'Hangs on with 1 HP.', type: null, off: false }, { label: 'Scout', small: '', type: null, off: false }], index: 1, text: 'Pick your signature' }));
    expect(pageOf(html)).toBe('choice');
    expect(count(html, 'ph-dc-ch')).toBe(2);
    expect(html).toContain('ph-dc-ch on');
    expect(html).toContain('Pick your signature');
    expect(html).not.toContain('ph-sheet');
    const more = phDecision(ph, decision({ title: 'Signature', more: ['Line one', 'Line two'] }));
    expect(more).toContain('data-act="more"');
    expect(more).toContain('Line one\nLine two');
    const done = phDecision(ph, decision({ title: 'New move', result: 'Charizard learned <Air Slash>!' }));
    expect(done).toContain('data-act="done"');
    expect(done).toContain('Charizard learned &lt;Air Slash&gt;!');
    expect(done).toContain('Press Enter to go on');
  });
});

import { describe, expect, it } from 'vitest';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { pageOf } from '../../src/ui/phantom/kit';
import { phEvent, tallSize } from '../../src/ui/phantom/screens/event';
import { phSeed, SEED_CODES, SEED_KEYS, phQuiz, QUIZ_STEPS, type QuizModel } from '../../src/ui/phantom/screens/run';
import type { EventModel } from '../../src/ui/redux/screens/event';
import type { FormModel } from '../../src/ui/redux/screens/run';
import { portrait } from '../../src/ui/redux/templates';

// The Phantom UI's quiz page (the intake of the prologue), and two fits it brought: a story portrait never stands
// taller than the page, and a question of many short lines is never under the cards.

const ph = PHANTOM_VERSIONS[0]!;
const count = (html: string, bit: string | RegExp): number => html.split(bit).length - 1;
const quiz = (over: Partial<QuizModel> = {}): QuizModel => ({
  who: 'Prof. Vance', bust: null, question: 'You find an injured Pokémon on the road. What do you do?', at: 2, of: 12, back: true, index: 1,
  answers: ['Approach and help it right away.', 'Examine the situation first.', 'Make it comfortable.', 'Look for what hurt it.', 'Give it space.'].map((label) => ({ label })),
  hint: 'There are no wrong answers.', ...over,
});

describe('Phantom quiz page', () => {
  it('shows who asks, where you are, the answers as numbered cards with one lit, and the way back', () => {
    const html = phQuiz(ph, quiz());
    expect(pageOf(html)).toBe('quiz');
    for (const t of ['Partner quiz', 'Prof. Vance asks · question 3 of 12', 'You find an injured Pokémon', 'Approach and help it right away.', 'There are no wrong answers.', 'Last question', ...QUIZ_STEPS]) expect(html).toContain(t);
    expect(count(html, /class="ch ph-qz-ch[ "]/)).toBe(5);
    expect(html).toMatch(/class="ch ph-qz-ch on"[^>]*data-act="pick" data-arg="1" data-over="over"><kbd>2<\/kbd>/);
    // Twelve dots: two answered, this one, nine to come.
    expect(count(html, '<i class="f"></i>')).toBe(2);
    expect(count(html, '<i class="n"></i>')).toBe(1);
    expect(count(html, '<i class=""></i>')).toBe(9);
    // Five answers stand two to a row; the lone last one is centred under them.
    expect(count(html, / last"/)).toBe(1);
    expect(html).toMatch(/class="key" data-act="back"/);
  });

  it('the first question has no way back, a closed answer is marked, text is escaped, and many answers go in one column', () => {
    const first = phQuiz(ph, quiz({ at: 0, back: false, question: '<b>Why?</b>', answers: [{ label: 'Yes' }, { label: 'No', off: true }] }));
    expect(first).not.toContain('Last question');
    expect(first).not.toContain('<b>Why?</b>');
    expect(count(first, / off"/)).toBe(1);
    expect(first).not.toMatch(/ last"/);
    const many = phQuiz(ph, quiz({ answers: Array.from({ length: 8 }, (_, k) => ({ label: `Answer ${k}` })) }));
    expect(many).toContain('class="qz-a ph-qz-a tall"');
    // The professor's words before the first question stand above it, smaller, and are escaped; no words, no line.
    const led = phQuiz(ph, quiz({ at: 0, intro: 'A few questions. <i>No</i> timer.' }));
    expect(led).toMatch(/<p class="ph-qz-in">A few questions\. &lt;i&gt;No&lt;\/i&gt; timer\.<\/p><p style="font-size:\d+px">You find/);
    expect(first).not.toContain('ph-qz-in');
    // A question out of range is kept inside the dots.
    expect(phQuiz(ph, quiz({ at: 40 }))).toContain('question 12 of 12');
  });
});

describe('Phantom story portraits and long questions', () => {
  it('a story portrait is kept to the page: its whole frame is never taller than the cap', () => {
    const vance = portrait('packs/vance/explain.png', 128, 0.9);
    expect(vance.k).toBeGreaterThan(1);
    // Without the cap this frame would be drawn 540 × k tall, which is taller than the 720 page.
    expect(Math.round(540 * vance.k!)).toBeGreaterThan(720);
    const drawn = tallSize(vance, 540, 720) * vance.k!;
    expect(drawn).toBeGreaterThan(600);
    expect(drawn).toBeLessThanOrEqual(720);
    // A plain Trainer picture has no such scale: it is drawn as asked, and a small one is never made bigger.
    expect(tallSize({ ...vance, k: undefined }, 540, 720)).toBe(540);
    expect(tallSize(vance, 100, 720)).toBe(100);
  });

  it('a question of many short lines is set smaller than one long line of the same length', () => {
    const base: EventModel = {
      name: 'The reveal', tag: 'Prologue', lines: [], speaker: 'Prof. Vance', page: { at: 0, of: 1 }, art: null, tint: null, fx: null, cast: null, mon: null,
      choices: [{ label: 'Continue', sub: '', chance: '', locked: false }, { label: 'Retake the quiz', sub: '', chance: '', locked: false }],
      index: 0, money: null, outcome: null, pick: null, countdown: '', timer: null,
    };
    const size = (lines: EventModel['lines']): number => Number(/class="sy-q ph-q long"[^>]*><small>[^<]*<\/small><span style="font-size:(\d+)px"/.exec(phEvent(ph, { ...base, lines }))![1]);
    const four = ['Marginalia has made her sketches. Three Pokémon who might suit you.', 'The match: Abra (Psychic), Lazy', 'The complement: Tuftin (Normal), Affectionate', 'The surprise: Fennekin (Fire), Intelligent'].map((text) => ({ who: 'Prof. Vance', text }));
    const one = [{ who: 'Prof. Vance', text: four.map((l) => l.text).join(' ') }];
    expect(size(four)).toBeLessThan(size(one));
    expect(size(four)).toBeGreaterThanOrEqual(15);
    // Six lines cannot be set small enough: the cards are dealt lower instead.
    const six = phEvent(ph, { ...base, lines: [...four, ...four.slice(0, 2)] });
    expect(six).toMatch(/class="ph-ev-low" style="translate:0 \d+px"/);
    expect(phEvent(ph, { ...base, lines: one })).not.toContain('ph-ev-low');
  });
});

describe('Phantom Seed & Codes page', () => {
  const form = (over: Partial<FormModel> = {}): FormModel => ({
    title: 'Seed & Codes', heading: 'Enter a seed or a share code, or leave it random', buttons: [['Paste', 'paste'], ['Confirm', 'apply'], ['Clear', 'clear']], primary: 1, lit: 'Q',
    text: 'The same seed gives the same region, events and rewards.', hints: [['Enter', 'confirm'], ['Esc', 'desk']], ...over,
  });

  it('leaves the value window empty for the real text box, and has every key a code needs with the last one lit', () => {
    const html = phSeed(ph, form());
    expect(pageOf(html)).toBe('seed');
    // The scene lays its text box over this window: nothing is drawn inside it.
    expect(html).toContain('<div class="ph-sd-field rx-field"></div>');
    expect(SEED_KEYS).toHaveLength(38);
    expect(count(html, 'data-act="key"')).toBe(38);
    for (const k of ['A', 'Z', '0', '9', '.', '-']) expect(html).toContain(`data-act="key" data-arg="${k}">${k}</i>`);
    expect(html).toMatch(/<i class="on" style="--i:16" data-act="key" data-arg="Q">Q<\/i>/);
    expect(count(html, '<i class="on"')).toBe(1);
    for (const t of ['Seed &amp; Codes', 'Preparation desk', 'Enter a seed or a share code', 'The same seed gives the same region']) expect(html).toContain(t);
  });

  it('keeps the three buttons with Confirm lit, lists the four kinds of code, and its key hints confirm and go back', () => {
    const html = phSeed(ph, form());
    expect(html).toMatch(/class="blade ph-sd-b"[^>]*data-act="btn" data-arg="paste">Paste</);
    expect(html).toMatch(/class="blade ph-sd-b on"[^>]*data-act="btn" data-arg="apply">Confirm</);
    expect(html).toMatch(/class="blade ph-sd-b"[^>]*data-act="btn" data-arg="clear">Clear</);
    for (const [tag, name] of SEED_CODES) { expect(html).toContain(`<b>${tag}</b>`); expect(html).toContain(name); }
    expect(html).toMatch(/class="key" data-act="btn" data-arg="apply"><b class="w">Enter<\/b>Confirm/);
    expect(html).toMatch(/class="key" data-act="back" data-arg=""><b class="w">Esc<\/b>Desk/);
  });

  it('what went wrong replaces the note and is escaped; no note, no box; no key lit before typing', () => {
    const bad = phSeed(ph, form({ text: 'That code is <b>not</b> a code.', lit: '' }));
    expect(bad).toContain('That code is &lt;b&gt;not&lt;/b&gt; a code.');
    expect(count(bad, '<i class="on"')).toBe(0);
    expect(phSeed(ph, form({ text: '' }))).not.toContain('ph-sd-say');
    expect(phSeed(ph, form({ hints: undefined }))).toContain('class="keys"');
  });
});

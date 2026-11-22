import { describe, expect, it } from 'vitest';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { pageOf } from '../../src/ui/phantom/kit';
import { phEvent, phTalk } from '../../src/ui/phantom/screens/event';
import type { EventModel } from '../../src/ui/redux/screens/event';

// The Phantom UI's event pages: pure functions from the New UI event's model to HTML. The ALL EVENTS rule is the
// thing to hold: text first, what changed only on its own page after the text.

const ph = PHANTOM_VERSIONS[0]!;
const count = (html: string, bit: string | RegExp): number => html.split(bit).length - 1;
const model = (over: Partial<EventModel> = {}): EventModel => ({
  name: 'Oak’s request', tag: 'Event', lines: [{ who: 'Prof. Oak', text: 'Could your team look into it?' }], speaker: 'Prof. Oak', page: { at: 0, of: 1 },
  art: null, tint: null, fx: null, cast: null, mon: null,
  choices: [{ label: 'Track it down', sub: 'Fight the Dragonite.', chance: '60%', locked: false }, { label: 'Leave berries', sub: 'Costs 2 Sitrus Berries.', chance: '', locked: false }, { label: 'Say you are busy', sub: 'You need a badge first.', chance: '', locked: true }],
  index: 0, money: 1200, outcome: null, pick: null, countdown: '', timer: null,
  place: { no: '14', of: '30', region: 'Johto', sub: 'Day 3 · Night' }, ...over,
});

describe('Phantom event pages', () => {
  it('a page with more to read is the talk: the box waits, a click turns the page, no choice is on show', () => {
    const html = phEvent(ph, model({ page: { at: 0, of: 3 } }));
    expect(pageOf(html)).toBe('event');
    expect(html).toMatch(/class="sy-box ph-ev-box[^"]*"[^>]*data-act="page"/);
    expect(html).toContain('<div class="sy-nm"><b>Prof. Oak</b></div>');
    expect(count(html, /<i class="(?:d|on)?"><\/i>/)).toBe(3);
    expect(html).toContain('class="ph-ev-turn"');
    expect(html).not.toContain('sy-cd');
    expect(html).toMatch(/aria-label="step 1 of 4"/);
    expect(html).toContain('<b>14</b><div>Stage<span>of 30</span></div>');
  });

  it('the last page deals the choices as cards: one lit, a locked one dimmed, odds as a meter, the money and the tag kept', () => {
    const html = phEvent(ph, model());
    expect(pageOf(html)).toBe('choice');
    expect(count(html, 'class="sy-cd ph-cd')).toBe(3);
    expect(count(html, /class="sy-cd ph-cd [a-z]+ on/)).toBe(1);
    expect(html).toMatch(/class="sy-cd ph-cd safe off"[^>]*data-act="pick" data-arg="2" data-over="over"/);
    expect(html).toMatch(/class="ph-odds"><i style="width:60%">/);
    for (const t of ['Could your team look into it?', 'Fight the Dragonite.', 'Costs 2 Sitrus Berries.', '₽1,200', '<span>Event</span>', 'Locked']) expect(html).toContain(t);
    expect(html).not.toContain('sy-seal');
  });

  it('many choices are dealt in two rows and the lit one is read out under them', () => {
    const many = Array.from({ length: 7 }, (_, k) => ({ label: `Choice ${k + 1}`, sub: `What choice ${k + 1} does.`, chance: '', locked: false }));
    const html = phEvent(ph, model({ choices: many, index: 4 }));
    expect(html).toContain('class="sy-cds ph-cds two"');
    expect(count(html, 'class="sy-cd ph-cd')).toBe(7);
    expect(html).toMatch(/class="sy-th ph-th"[^>]*>.*What choice 5 does\./);
    expect(count(html, 'What choice 1 does.')).toBe(0);
  });

  it('the outcome is text first with what changed still sealed; a failure says so; then the changes open as cards', () => {
    const text = phEvent(ph, model({ speaker: null, lines: [{ who: null, text: 'Dragonite does not get up.' }], outcome: { step: 'text', ok: false, changes: ['+₽600', 'Lucky Egg ×1'], next: 'Continue' } }));
    expect(pageOf(text)).toBe('sy-result');
    expect(text).toContain('sy-seal');
    expect(text).toContain('It didn’t go your way');
    expect(text).not.toContain('sy-rc');
    expect(text).not.toContain('₽600');
    expect(text).toMatch(/class="sy-box ph-ev-box nar"[^>]*data-act="next"/);
    const cards = phEvent(ph, model({ outcome: { step: 'rewards', ok: true, changes: ['+₽600', 'Lucky Egg ×1', 'Charisma +2'], next: 'Continue' } }));
    expect(pageOf(cards)).toBe('sy-reward');
    expect(count(cards, 'class="sy-rc ph-rc')).toBe(3);
    expect(cards).toContain('<div class="mny" style="font-size:40px">+₽600</div>');
    expect(cards).toContain('Oak’s request: Track it down');
    expect(cards).toMatch(/class="sy-wait ph-ev-stay" data-act="next"/);
    const noSeal = phEvent(ph, model({ outcome: { step: 'text', ok: true, changes: [], next: 'Battle!' } }));
    expect(noSeal).not.toContain('sy-seal');
    expect(noSeal).toContain('Battle!');
  });

  it('keeps the game’s extras: countdown and timer, card and team keys, rounds, the title, the standing and the picker', () => {
    const html = phEvent(ph, model({
      countdown: '0:08', timer: 0.2, cardHint: true, teamHint: true, title: 'CHAMPION',
      rounds: [{ name: 'Round 1', who: 'Bruno', state: 'won' }, { name: 'Round 2', who: 'Chuck', state: 'next' }, { name: 'Final', who: '???', state: 'ahead' }],
      standing: { rank: 'Recruit', meters: [{ label: 'Trust', value: 2, max: 5 }] },
      pick: { labels: ['Pidgey Lv 5', 'Back'], at: 1, card: { give: { name: 'Pidgey', file: null }, get: null } },
    }));
    expect(html).toMatch(/class="hot urgent">0:08</);
    expect(html).toMatch(/class="ph-ev-timer urgent"><i style="width:20%">/);
    expect(html).toMatch(/data-act="card"/);
    expect(html).toMatch(/data-act="team"/);
    expect(count(html, /<div class="(?:on|won|ahead)"><small>/)).toBe(3);
    expect(html).toContain('aria-label="CHAMPION"');
    expect(html).toContain('<h3 class="tl1">Recruit</h3>');
    expect(html).toMatch(/class="blade on"[^>]*data-act="trade" data-arg="1" data-over="tradeOver"/);
    expect(html).toContain('Not known yet');
    expect(html).not.toContain('class="day');
  });

  it('text from data is escaped, and a black-screen scare shows only the text box', () => {
    const html = phEvent(ph, model({ name: '<i>x</i>', lines: [{ who: null, text: '<b>boo</b>' }], speaker: null }));
    expect(html).not.toContain('<b>boo</b>');
    expect(html).not.toContain('<i>x</i>');
    const dark = phEvent(ph, model({ scare: 'dark', page: { at: 0, of: 2 } }));
    expect(dark).not.toContain('sy-st');
    expect(dark).not.toContain('ph-scn');
    expect(dark).toContain('sy-box');
  });
});

describe('Phantom talk pages (prologue, story, tutorial)', () => {
  it('have no step strip; a lone Continue keeps the text box, and the box is the button', () => {
    const html = phTalk(ph, model({ name: 'Chapter 1', choices: [{ label: 'Continue', sub: '', chance: '', locked: false }], place: null }));
    expect(pageOf(html)).toBe('event');
    expect(html).not.toContain('aria-label="step');
    expect(html).toContain('Chapter 1');
    expect(html).not.toContain('sy-cd');
    expect(html).toMatch(/class="sy-box ph-ev-box[^"]*"[^>]*data-act="pick" data-arg="0"/);
    expect(html).toMatch(/<kbd>Z<\/kbd><span>Continue<\/span>/);
    expect(html).not.toContain('Read back');
  });

  it('a list of lessons is dealt as cards like any choice, and an event keeps its lone choice as a card', () => {
    const lessons = Array.from({ length: 10 }, (_, k) => ({ label: `Lesson ${k + 1}`, sub: '', chance: '', locked: k > 6 }));
    const html = phTalk(ph, model({ choices: lessons, index: 9 }));
    expect(pageOf(html)).toBe('choice');
    expect(count(html, 'class="sy-cd ph-cd')).toBe(10);
    expect(count(html, /class="sy-cd ph-cd [a-z]+ off/)).toBe(2);
    expect(count(html, /class="sy-cd ph-cd [a-z]+ on off/)).toBe(1);
    const one = phEvent(ph, model({ choices: [{ label: 'Continue', sub: '', chance: '', locked: false }] }));
    expect(pageOf(one)).toBe('choice');
    expect(count(one, 'class="sy-cd ph-cd')).toBe(1);
  });
});


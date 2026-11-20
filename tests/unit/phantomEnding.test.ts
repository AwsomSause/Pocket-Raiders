import { describe, expect, it } from 'vitest';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { pageOf } from '../../src/ui/phantom/kit';
import { PH_CARD_FACTS, phCard } from '../../src/ui/phantom/screens/ending';
import type { RunCardModel } from '../../src/ui/redux/screens/over';

// The Phantom UI's card page: the run card, the hub's Trainer Card and the code-name card. A pure function from the
// New UI's own model to HTML.

const ph = PHANTOM_VERSIONS[0]!;
const count = (html: string, bit: string | RegExp): number => html.split(bit).length - 1;

const card = (over: Partial<RunCardModel> = {}): RunCardModel => ({
  title: 'Run card', name: 'Run 128', rank: 'Loss', badges: 3, trainer: null, team: ['mon-a.png', null, 'mon-b.png'],
  facts: [['Result', 'Fell in Johto'], ['Trainer', 'Red'], ['Day', '4'], ['Seed', 'abc'], ['MVP', 'Pidove']],
  text: 'Press Enter to save the card as a PNG you can share.', hints: [['Enter', 'save'], ['Esc', 'back']], ...over,
});

describe('Phantom card page', () => {
  it('the run card shows the name in cut-out letters, its facts, the badges won, the team, and saves on a click or Enter', () => {
    const html = phCard(ph, card());
    expect(pageOf(html)).toBe('card');
    expect(html).toContain('aria-label="RUN 128"');
    for (const t of ['Run card', 'Run end', 'Loss', 'Fell in Johto', 'Pidove', 'Final team', 'Save as picture', 'Press Enter to save']) expect(html).toContain(t);
    expect(count(html, '<dt>')).toBe(5);
    expect(count(html, /<i class="f" /)).toBe(3);
    expect(count(html, /<i class="f?" style="--i:\d"><\/i>/)).toBe(8);
    expect(html).toMatch(/class="tcard ph-tcard can" data-act="save"/);
    expect(html).toMatch(/class="key" data-act="save"[^>]*><b class="w">Enter<\/b>save/);
    expect(html).toMatch(/class="key" data-act="back"[^>]*><b class="w">Esc<\/b>back/);
    expect(html).toMatch(/class="ph-fill" data-act="back"/);
    // Two of the three team slots hold a Pokémon.
    expect(count(html.slice(html.indexOf('ph-tc-team'), html.indexOf('ph-tc-note')), 'class="spr"')).toBe(2);
  });

  it('a card that cannot be saved is a plain click-through: no stamp, and the card, the page and the key all do the same thing', () => {
    const html = phCard(ph, card({ title: 'Code Name', name: 'House Card', rank: 'Specialist', save: false, tap: 'next', area: 'story', team: [], hints: [['Enter', 'next']], text: 'A uniform is <b>folded</b> into your arms.' }));
    expect(html).not.toContain('Save as picture');
    expect(html).not.toContain('data-act="save"');
    expect(count(html, 'data-act="next"')).toBe(3);
    expect(html).toContain('Story');
    expect(html).toContain('Note');
    expect(html).not.toContain('<b>folded</b>');
    expect(html).not.toContain('Final team');
  });

  it('facts past the fifth and the side notes stand beside the card, and a small word can replace the area', () => {
    const facts = Array.from({ length: PH_CARD_FACTS + 2 }, (_, k) => [`Fact ${k}`, `Value ${k}`] as const);
    const html = phCard(ph, card({ facts, small: 'Pause', save: false, tap: 'pauseCard', text: '', team: [], side: [{ small: 'Rival', title: 'Silver', text: 'Met twice. Level.' }, { small: 'Blessing', title: "Lugia's Calm", text: '' }] }));
    expect(count(html, '<dt>')).toBe(PH_CARD_FACTS);
    expect(count(html, 'class="kv ')).toBe(4);
    for (const t of ['Pause', 'Fact 6', 'Value 6', 'Silver', 'Met twice. Level.', 'Lugia&#39;s Calm']) expect(html).toContain(t);
    expect(html).not.toContain('Run end');
    expect(html).not.toContain('Note');
    expect(html).toMatch(/class="key" data-act="pauseCard"/);
  });

  it('badges stay between none and eight, and a long name is drawn smaller', () => {
    expect(count(phCard(ph, card({ badges: 12 })), /<i class="f" /)).toBe(8);
    expect(count(phCard(ph, card({ badges: -2 })), /<i class="f" /)).toBe(0);
    const size = (name: string): number => Number(/<h3 style="font-size:(\d+)px"/.exec(phCard(ph, card({ name })))![1]);
    expect(size('Red')).toBe(96);
    expect(size('Provisional Agent')).toBeLessThan(size('Hilda Nate'));
    expect(size('A very long name that goes on and on')).toBeGreaterThanOrEqual(46);
  });
});

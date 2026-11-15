import { describe, expect, it } from 'vitest';
import { pageSpeaker, scriptLine, scriptPages } from '../../src/ui/redux/script';

const flat = (text: string, max?: number): string => scriptPages(text, max).map((p) => p.map((l) => l.text).join(' ')).join(' ');
const words = (t: string): string => t.replace(/\s+/g, ' ').trim();

describe('New UI event script pages', () => {
  it('keeps a short text as one page of one narration line', () => {
    expect(scriptPages('A quiet road.')).toEqual([[{ who: null, text: 'A quiet road.' }]]);
  });

  it('breaks pages on a blank line and lines on a newline', () => {
    const pages = scriptPages('The door opens.\nCold air.\n\nBlue: "Smell ya later!"\n\n\nHe leaves.');
    expect(pages).toEqual([
      [{ who: null, text: 'The door opens.' }, { who: null, text: 'Cold air.' }],
      [{ who: 'Blue', text: 'Smell ya later!' }],
      [{ who: null, text: 'He leaves.' }],
    ]);
  });

  it('reads Name: "words" as a speaker line, and nothing else', () => {
    expect(scriptLine('Giovanni: “You came.”')).toEqual({ who: 'Giovanni', text: 'You came.' });
    expect(scriptLine('Nurse Joy: "Welcome!"')).toEqual({ who: 'Nurse Joy', text: 'Welcome!' });
    expect(scriptLine('Note: the door is locked.')).toEqual({ who: null, text: 'Note: the door is locked.' });
    expect(scriptLine('the sign reads: "Keep out"')).toEqual({ who: null, text: 'the sign reads: "Keep out"' });
    // Words that quote something inside keep their quotes, so nothing reads wrong.
    expect(scriptLine('Blue: "He said "no" twice." Then he left.').who).toBe('Blue');
    expect(scriptLine('Blue: "He said "no" twice." Then he left.').text).toBe('"He said "no" twice." Then he left.');
  });

  it('splits a page that is too long between its lines first', () => {
    const a = 'A'.repeat(60), b = 'B'.repeat(60), c = 'C'.repeat(60);
    const pages = scriptPages(`${a}\n${b}\n${c}`, 130);
    expect(pages.map((p) => p.map((l) => l.text))).toEqual([[a, b], [c]]);
  });

  it('splits one long line at sentence ends and keeps the speaker on every piece', () => {
    const text = 'Oak: "The first sentence is here. The second sentence is here. The third sentence is here. The fourth one too."';
    const pages = scriptPages(text, 70);
    expect(pages.length).toBeGreaterThan(1);
    for (const p of pages) {
      expect(p.every((l) => l.who === 'Oak')).toBe(true);
      expect(p.reduce((n, l) => n + l.text.length, 0)).toBeLessThanOrEqual(70);
    }
    expect(pages[0]![0]!.text).toBe('The first sentence is here. The second sentence is here.');
  });

  it('never loses text: sentences, long run-ons and a single huge word all come back whole', () => {
    const runOn = Array.from({ length: 80 }, (_, i) => `word${i}`).join(' ');
    const huge = 'x'.repeat(500);
    for (const text of [runOn, huge, `One. Two! Three? ${runOn}… Four.`, 'Short.\n\nAlso short.']) {
      for (const max of [40, 90, 240]) {
        expect(words(flat(text, max)).replace(/ /g, '')).toBe(words(text).replace(/\s/g, ''));
        for (const p of scriptPages(text, max)) expect(p.reduce((n, l) => n + l.text.length, 0) + p.length - 1).toBeLessThanOrEqual(max);
      }
    }
  });

  it('always gives at least one page, even for empty text', () => {
    expect(scriptPages('')).toEqual([[{ who: null, text: '' }]]);
    expect(scriptPages('\n\n \n')).toEqual([[{ who: null, text: '' }]]);
  });

  it('names the plate only when one person speaks on the page', () => {
    expect(pageSpeaker(scriptPages('Blue: "Hi."\nHe grins.')[0]!)).toBe('Blue');
    expect(pageSpeaker(scriptPages('Blue: "Hi."\nRed: "…"')[0]!)).toBeNull();
    expect(pageSpeaker(scriptPages('Wind in the grass.')[0]!)).toBeNull();
  });
});

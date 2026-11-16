// Event text as a script (New UI): one string becomes pages of lines, so long text is never cut and every page
// waits for the player.
//   blank line ("\n\n")   a page break
//   "\n"                  a new line on the same page
//   Name: "words"         a speaker line (the name goes on the name plate); any other line is narration
// A page that is longer than `max` characters splits by itself: first between its lines, then at sentence ends,
// then between words. Pure text work: no Phaser, no DOM, no randomness.

export interface ScriptLine { who: string | null; text: string }
export type ScriptPage = ScriptLine[];

/** A name, a colon, then words in quotes. The quotes are what tells "Blue: "Smell ya later!"" from "Note: it is locked". */
const SPEAKER = /^([A-Z][^:"“”\n]{0,30}):\s*(["“])(.*)$/;

export function scriptLine(raw: string): ScriptLine {
  const m = SPEAKER.exec(raw);
  if (!m) return { who: null, text: raw };
  let words = m[3]!.trim();
  // Drop the closing quote when it is the only other one, so the box shows plain words under the name plate.
  if (/["”]$/.test(words) && !/["“”]/.test(words.slice(0, -1))) words = words.slice(0, -1).trimEnd();
  else words = m[2]! + words;
  return { who: m[1]!.trim(), text: words };
}

const size = (page: ScriptPage): number => page.reduce((n, l) => n + l.text.length, 0) + Math.max(0, page.length - 1);

/** Cuts one long line into pieces of at most `max` characters: at sentence ends when it can, else between words. */
function cutLine(line: ScriptLine, max: number): ScriptLine[] {
  if (line.text.length <= max) return [line];
  const sentences = line.text.match(/[^.!?…]+(?:[.!?…]+["”’)]*|$)\s*/g) ?? [line.text];
  const bits: string[] = [];
  for (const s of sentences) {
    if (s.trim().length <= max) { bits.push(s.trim()); continue; }
    let cur = '';
    for (const word of s.trim().split(/\s+/)) {
      // A single "word" longer than a page is cut hard; nothing is dropped.
      let w = word;
      while (w.length > max) { if (cur) { bits.push(cur); cur = ''; } bits.push(w.slice(0, max)); w = w.slice(max); }
      if (cur && cur.length + 1 + w.length > max) { bits.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w;
    }
    if (cur) bits.push(cur);
  }
  const out: string[] = [];
  for (const b of bits) {
    if (!b) continue;
    const last = out[out.length - 1];
    if (last !== undefined && last.length + 1 + b.length <= max) out[out.length - 1] = `${last} ${b}`; else out.push(b);
  }
  return out.map((text) => ({ who: line.who, text }));
}

/** The pages of one text. Always at least one page; no character of the text is lost. */
export function scriptPages(text: string, max = 240): ScriptPage[] {
  const limit = Math.max(40, max);
  const pages: ScriptPage[] = [];
  for (const para of text.replace(/\r/g, '').split(/\n[ \t]*\n+/)) {
    const lines = para.split('\n').map((l) => l.trim()).filter(Boolean).map(scriptLine);
    pages.push(...pageLines(lines, limit));
  }
  return pages.length ? pages : [[{ who: null, text: '' }]];
}

/** Lines that are already split into speaker and words, laid out on pages of at most `max` characters (no page when there are no lines). */
export function pageLines(lines: readonly ScriptLine[], max = 240): ScriptPage[] {
  const limit = Math.max(40, max);
  if (!lines.length) return [];
  if (size([...lines]) <= limit) return [[...lines]];
  const pages: ScriptPage[] = [];
  let cur: ScriptPage = [];
  for (const piece of lines.flatMap((l) => cutLine(l, limit))) {
    if (cur.length && size([...cur, piece]) > limit) { pages.push(cur); cur = []; }
    cur.push(piece);
  }
  if (cur.length) pages.push(cur);
  return pages;
}

/** The name for the plate: the page's speaker when exactly one person speaks on it, else null (the caller's default). */
export function pageSpeaker(page: ScriptPage): string | null {
  const names = [...new Set(page.map((l) => l.who).filter((w): w is string => w !== null))];
  return names.length === 1 ? names[0]! : null;
}

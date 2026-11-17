// Evil Mode slice 19: a tighter encoding for what's older than two regions (design Part 30 section 7.4: "entries older
// than two regions are packed: the same fields, in a tighter encoding, never summarised and never dropped"). LZW over the
// text: a header lists the characters used, then each code is one character from U+0100 to U+80FF (below the surrogates,
// and never one JSON escapes). Lossless: `unpack(pack(s)) === s` for any string. Pure, no dependency.

import type { EvilModeBlock, LogEntry, StoredCard } from './schema';

const BASE = 0x100;
const CODES = 0x8000;
const SEP = '\u0001';

/** Packs a string. */
export function pack(s: string): string {
  if (!s) return '';
  const chars = [...new Set(Array.from(s))];
  if (chars.length >= CODES) return `!${s}`;
  const code = new Map<string, number>(chars.map((c, i) => [c, i]));
  let next = chars.length;
  const out: string[] = [];
  let w = '';
  for (const ch of s) {
    const wc = w + ch;
    if (code.has(wc)) { w = wc; continue; }
    out.push(String.fromCharCode(BASE + code.get(w)!));
    if (next < CODES) code.set(wc, next++);
    w = ch;
  }
  out.push(String.fromCharCode(BASE + code.get(w)!));
  return `${JSON.stringify(chars)}${SEP}${out.join('')}`;
}

/** Unpacks what `pack` made. */
export function unpack(p: string): string {
  if (!p) return '';
  if (p.startsWith('!')) return p.slice(1);
  const cut = p.indexOf(`]${SEP}`) + 1;
  const dict = JSON.parse(p.slice(0, cut)) as string[];
  const body = p.slice(cut + 1);
  const parts: string[] = [];
  let prev = '';
  for (let i = 0; i < body.length; i++) {
    const c = body.charCodeAt(i) - BASE;
    // The one special case: a code defined by this very step (prev + its own first character).
    const entry = c < dict.length ? dict[c]! : prev + first(prev);
    parts.push(entry);
    if (prev && dict.length < CODES) dict.push(prev + first(entry));
    prev = entry;
  }
  return parts.join('');
}

const first = (s: string): string => String.fromCodePoint(s.codePointAt(0)!);

// ---- The archive: the Log and the Cards from regions older than two, packed at a Crossing ----

type Archive = NonNullable<EvilModeBlock['archive']>;
const memo = new Map<string, unknown[]>();
/** A packed list, opened (the last few kept, so reading the Log over and over doesn't unpack it each time). */
const opened = <T>(s: string): T[] => {
  if (!s) return [];
  let v = memo.get(s);
  if (!v) {
    v = JSON.parse(unpack(s)) as unknown[];
    if (memo.size >= 8) memo.delete(memo.keys().next().value!);
    memo.set(s, v);
  }
  return v as T[];
};

/** The whole Log, in order: what's packed, then what isn't. Every reader of the run's history reads this. */
export const logOf = (block: Pick<EvilModeBlock, 'log' | 'archive'>): LogEntry[] => (block.archive?.log ? [...opened<LogEntry>(block.archive.log), ...block.log] : block.log);
/** Every Card kept, in order (packed ones too). */
export const cardsOf = (block: Pick<EvilModeBlock, 'cards' | 'archive'>): StoredCard[] => (block.archive?.cards ? [...opened<StoredCard>(block.archive.cards), ...block.cards] : block.cards);
/** How many Log lines and Cards there have been, packed or not (the next id's number). */
export const logCount = (block: Pick<EvilModeBlock, 'log' | 'archive'>): number => block.log.length + (block.archive?.nLog ?? 0);
export const cardCount = (block: Pick<EvilModeBlock, 'cards' | 'archive'>): number => block.cards.length + (block.archive?.nCards ?? 0);

/**
 * At a Crossing: Log lines and Cards from regions older than the two before the one being entered are packed (Part 30
 * section 7.4). `keep`: the region indices still kept loose. Same entries, same order; nothing's summarised or dropped.
 */
export function archiveOld<B extends Pick<EvilModeBlock, 'log' | 'cards' | 'archive'>>(block: B, keep: ReadonlySet<number>): B {
  const oldLog = block.log.filter((e) => !keep.has(e.region));
  const oldCards = block.cards.filter((c) => !keep.has(c.region));
  if (!oldLog.length && !oldCards.length) return block;
  const a: Archive = block.archive ?? { log: '', cards: '', nLog: 0, nCards: 0 };
  // Only a prefix is ever packed, so the order stays the order things happened.
  const cutL = block.log.findIndex((e) => keep.has(e.region));
  const cutC = block.cards.findIndex((c) => keep.has(c.region));
  const nL = cutL < 0 ? block.log.length : cutL;
  const nC = cutC < 0 ? block.cards.length : cutC;
  const log = [...opened<LogEntry>(a.log), ...block.log.slice(0, nL)];
  const cards = [...opened<StoredCard>(a.cards), ...block.cards.slice(0, nC)];
  return { ...block, log: block.log.slice(nL), cards: block.cards.slice(nC), archive: { log: pack(JSON.stringify(log)), cards: pack(JSON.stringify(cards)), nLog: log.length, nCards: cards.length } };
}

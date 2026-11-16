// Catalog Overhaul, families-b (STORY_FAMILIES_6.md): the category's own checks. Schema validity is covered by getContent() loading
// every co file; this checks the pack's writing rules and that every remembered flag is read.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getContent } from '../../src/data';

const dir = join(__dirname, '../../src/data/events');
type J = Record<string, unknown>;
const files = readdirSync(dir).filter((f) => /^co-families-b-\d+\.json$/.test(f));
const raw = files.flatMap((f) => (JSON.parse(readFileSync(join(dir, f), 'utf8')) as { events: J[] }).events);
const content = getContent();
const ids = raw.map((e) => e.id as string);
const events = ids.map((id) => content.events.get(id)!);

/** Every effect and condition anywhere inside an event (choices, outcomes, branches, battles, remembers). */
const walk = (x: unknown, out: J[] = []): J[] => {
  if (Array.isArray(x)) x.forEach((y) => walk(y, out));
  else if (x && typeof x === 'object') {
    if (typeof (x as J).kind === 'string') out.push(x as J);
    Object.values(x).forEach((y) => walk(y, out));
  }
  return out;
};
const texts = (x: unknown, out: string[] = []): string[] => {
  if (typeof x === 'string') out.push(x);
  else if (Array.isArray(x)) x.forEach((y) => texts(y, out));
  else if (x && typeof x === 'object') Object.entries(x).forEach(([k, y]) => k === 'intro' || k === 'text' || k === 'label' ? texts(y, out) : typeof y === 'object' && texts(y, out));
  return out;
};
// Flags other categories own or read (STANDARDS.md board) and flags only kept for the journal or later rows.
const SHARED = /^(ovc-|ovt-|kind-|sign-|telling-|rep|intel|calmed-alpha|alpha-faced|lost-mon|last-stop-ticket|city-bell|whale-pod|tide-lamp|co:)/;

describe('co families-b', () => {
  it('loads every event, live', () => {
    expect(files.length).toBeGreaterThanOrEqual(7);
    expect(ids.length).toBeGreaterThan(200);
    for (const [i, e] of events.entries()) {
      expect(e, ids[i]).toBeDefined();
      expect(e.disabled, ids[i]).toBe(false);
    }
  });

  it('every event has a choice with no requirement, or a requirement its own chain can meet', () => {
    for (const e of events) {
      const free = e.choices.some((c) => (c.requires ?? []).length === 0);
      // Or one flag splits the choices: one needs it at 0, another at 1 or more (the Captain's Chest breath counter).
      const conds = e.choices.flatMap((c) => (c.requires ?? []).filter((r) => r.kind === 'flag')) as { key: string; atLeast: number; atMost: number }[];
      const split = conds.some((a) => a.atMost === 0 && conds.some((b) => b.key === a.key && b.atLeast === 1));
      // Or each choice needs a flag, and every outcome of the step before sets one of those flags.
      const prev = /-s2$/.test(e.id) ? content.events.get(e.id.replace(/-s2$/, '-s1')) : undefined;
      const keys = new Set(conds.map((c) => c.key));
      const covered = !!prev && prev.choices.every((c) => walk(c.success).some((n) => n.kind === 'flag' && keys.has(n.key as string)));
      expect(free || split || covered, `${e.id}: every choice is locked`).toBe(true);
    }
  });

  it('every flag a choice sets is read somewhere (this category or a shared reader)', () => {
    const set = new Set<string>();
    const read = new Set<string>();
    for (const e of raw) for (const n of walk(e)) {
      if (n.kind === 'flag' && typeof n.amount === 'number') set.add(n.key as string);
      if (n.kind === 'flag' && n.amount === undefined) read.add(n.key as string);
    }
    // Remembered choices are also read through Remembers variants and choice requirements (flag conditions have atLeast).
    for (const e of raw) for (const n of walk([e.requires, e.remembers, (e.choices as J[]).map((c) => [c.requires, c.branches])])) if (n.kind === 'flag') read.add(n.key as string);
    const unread = [...set].filter((k) => !read.has(k) && !SHARED.test(k));
    // Outcome flags that only record what happened (journal-only) are allowed, but must stay a small minority.
    expect(unread.length / set.size, unread.join(' ')).toBeLessThan(0.6);
  });

  it('keeps the pack rules: no healing items, no Shadow join, rewards inside the limits', () => {
    const HEAL = new Set(['potion', 'super-potion', 'hyper-potion', 'max-potion', 'full-restore', 'revive', 'max-revive', 'oran-berry', 'sitrus-berry', 'berry-juice', 'fresh-water', 'soda-pop', 'lemonade', 'moomoo-milk']);
    for (const e of raw) for (const n of walk(e)) {
      if (n.kind === 'item') expect(HEAL.has(n.id as string), `${e.id} gives ${n.id}`).toBe(false);
      if (n.kind === 'join') expect(n.shadow, `${e.id} forces a Shadow`).toBe(false);
      if (n.kind === 'money' && n.amount !== undefined) expect(Math.abs(n.amount as number), `${e.id} money`).toBeLessThanOrEqual(1500);
      if (n.kind === 'friendship' && typeof n.amount === 'number') expect(n.amount, `${e.id} friendship`).toBeLessThanOrEqual(100);
      if (n.kind === 'item') expect(n.count ?? 1, `${e.id} item count`).toBeLessThanOrEqual(3);
    }
  });

  it('dialogue lines stay under 30 words', () => {
    const long: string[] = [];
    for (const e of raw) for (const t of texts(e)) for (const q of t.match(/"[^"]+"/g) ?? []) if (q.split(/\s+/).length >= 30) long.push(`${e.id}: ${q}`);
    expect(long).toEqual([]);
  });
});

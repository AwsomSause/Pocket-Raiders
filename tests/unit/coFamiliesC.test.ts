// Catalog Overhaul, families-c (STORY_FAMILIES 9 and 10): the built events load, every room and callback they point at
// exists, every flag they read is set somewhere, and their rewards stay inside the pack's limits.
// Status note and re-read log: docs/status/co-families-c.md.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getContent } from '../../src/data';

const eventsDir = join(__dirname, '../../src/data/events');
const files = readdirSync(eventsDir).filter((f) => f.startsWith('co-families-c-'));
type Raw = { id: string; [k: string]: unknown };
const raw: Raw[] = files.flatMap((f) => (JSON.parse(readFileSync(join(eventsDir, f), 'utf8')) as { events: Raw[] }).events);
const mine = new Set(raw.map((e) => e.id));

/** Every object in a tree. */
function walk(v: unknown, out: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (Array.isArray(v)) v.forEach((x) => walk(x, out));
  else if (v && typeof v === 'object') {
    out.push(v as Record<string, unknown>);
    Object.values(v).forEach((x) => walk(x, out));
  }
  return out;
}

// Flags other families set that these events read (names agreed on the shared board or with the owning thread).
const FROM_OTHERS = new Set(['quarry-in', 'farmer-end', 'hospice-stayed', 'hospice-sea', 'cages-opened', 'promise-deoxys', 'promise-volcanion', 'promise-zeraora', 'blessing-dialga', 'rep', 'kind-total']);

describe('families-c events', () => {
  const content = getContent();

  it('all load from the co files and are not disabled', () => {
    expect(raw.length).toBeGreaterThan(0);
    for (const e of raw) {
      const live = content.events.get(e.id);
      expect(live, e.id).toBeDefined();
      expect(live!.disabled, e.id).toBe(false);
    }
  });

  it('every room, again and queued scene points at a live event', () => {
    for (const e of raw) for (const o of walk(e)) {
      if (o.kind === 'addEvent' || o.kind === 'seeAgain') expect(content.events.has(String(o.eventId)), `${e.id} -> ${String(o.eventId)}`).toBe(true);
      if (o.kind === 'addEventFrom') for (const id of o.ids as string[]) expect(content.events.has(id), `${e.id} -> ${id}`).toBe(true);
    }
  });

  it('every flag read is set somewhere (or by a named other family)', () => {
    const set = new Set<string>();
    for (const e of raw) for (const o of walk(e)) if (o.kind === 'flag' && typeof o.amount === 'number') {
      set.add(String(o.key));
      if (o.stamp === 'region') set.add(`${String(o.key)}-at`);
    }
    // Engine-set flags: the helped Pokémon's return, the egg and other `ovt-` timers tick on their own once started.
    for (const k of ['helped-rare-returned', 'helped-returned', 'co-early-ko', 'letter-glow', 'idol-curse', 'idol-paid', 'oath-broken', 'oath-rests']) set.add(k);
    const unset = new Set<string>();
    for (const e of raw) for (const o of walk(e)) if (o.kind === 'flag' && typeof o.atLeast === 'number') {
      const key = String(o.key);
      if (!(set.has(key) || FROM_OTHERS.has(key) || key.startsWith('honest-kept'))) unset.add(`${e.id} reads ${key}`);
    }
    expect([...unset], 'flags read but never set').toEqual([]);
  });

  it('every flag set is read somewhere (no dead memory)', () => {
    const read = new Set<string>();
    for (const e of raw) for (const o of walk(e)) if (o.kind === 'flag' && typeof o.atLeast === 'number') read.add(String(o.key));
    const flags = JSON.parse(readFileSync(join(__dirname, '../../src/data/catalogOverhaul/flags/families-c.json'), 'utf8')) as { flags: { key: string; readBy: string }[] };
    const documented = new Set(flags.flags.map((f) => f.key));
    const dead = new Set<string>();
    for (const e of raw) for (const o of walk(e)) if (o.kind === 'flag' && typeof o.amount === 'number' && (o.amount as number) > 0) {
      const key = String(o.key);
      if (!(read.has(key) || documented.has(key) || key.startsWith('ovt-'))) dead.add(`${e.id} sets ${key}`);
    }
    expect([...dead], 'flags nothing reads and the flags file does not list').toEqual([]);
  });

  it('never gives an in-battle healing item, never ends the run in a fight', () => {
    const healing = new Set(['potion', 'super-potion', 'hyper-potion', 'full-restore', 'revive', 'full-heal', 'max-revive']);
    for (const e of raw) for (const o of walk(e)) {
      if (o.kind === 'item') expect(healing.has(String(o.id)), `${e.id} gives ${String(o.id)}`).toBe(false);
      if (o.kind === 'itemFrom') for (const id of o.ids as string[]) expect(healing.has(id), `${e.id} may give ${id}`).toBe(false);
      if ((o.kind === 'trainer' || o.kind === 'wild') && Array.isArray(o.win)) expect(o.friendly, `${e.id}: a fight that could end the run`).toBe(true);
    }
  });

  it('only builds ids families-c owns, plus its own new scenes', () => {
    const ledger = JSON.parse(readFileSync(join(__dirname, '../../src/data/catalogOverhaul/ledger.json'), 'utf8')) as { rows: string[][] };
    const owner = new Map(ledger.rows.map((r) => [r[0]!, r[5]!]));
    for (const id of mine) if (owner.has(id)) expect(owner.get(id), id).toBe('families-c');
  });
});

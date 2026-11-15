// Catalog Overhaul row 17 (new-events): the hundred new events. Every id they name exists, every once-per-run event marks itself
// done on every outcome, and every flag they read is set by one of them or is a flag another thread owns (listed below).
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EventDefSchema, type EventDef } from '../../src/core/contentSchema';
import { allQuirks } from '../../src/core/co/quirks';
import { content } from './helpers';

const files = fs.readdirSync('src/data/events').filter((f) => f.startsWith('co-new-events-'));
const raw = files.flatMap((f) => (JSON.parse(fs.readFileSync(`src/data/events/${f}`, 'utf8')) as { events: { id: string }[] }).events);
const events = raw.map((e) => content.events.get(e.id)!).filter(Boolean) as EventDef[];

/** Flags these events read that other threads set (legends, rivals, markets, families, places, the shared board). */
const FOREIGN = new Set([
  'blessing-company', 'blessing-solitary', 'blessing-influence', 'calmed-alpha', 'kind-total', 'kind-helped-stranger', 'rep', 'rep-lost',
  'spring-flood-dug', 'flood-sandbagged', 'little-league-look-after', 'took-egg', 'egg-returned', 'bought-stolen', 'rocket-radio-shorted',
  'macro-plug-pulled', 'delta-ditto-met', 'elder-ditto-met', 'lighthouse-lit', 'crossing-lamp-lit', 'team-op-stopped-magma-drill',
  'glove-duel-accepted', 'listened-first', 'sign-broken',
  // Set by the engine: the run's first Z-Move (run.ts finishBattle).
  'z-move-used',
]);
const foreign = (key: string) => FOREIGN.has(key) || /^(blessing|sign|telling|promise|promise-broken|promise-kept|guest)-/.test(key);

type Node = Record<string, unknown>;
function walk(o: unknown, visit: (n: Node) => void): void {
  if (Array.isArray(o)) for (const x of o) walk(x, visit);
  else if (o && typeof o === 'object') {
    visit(o as Node);
    for (const v of Object.values(o)) walk(v, visit);
  }
}

describe('new events (catalog overhaul row 17)', () => {
  it('are all loaded', () => {
    expect(raw.length).toBeGreaterThan(0);
    expect(events.length).toBe(raw.length);
  });

  it('name only items, Pokémon, moves, scenes and art that exist', () => {
    const missing: string[] = [];
    const itemOk = (id: string) => content.items.has(id) || content.catalog.has(id) || content.rewards.has(id);
    for (const e of events) {
      if (e.scene.pokemon && !content.species.has(e.scene.pokemon)) missing.push(`${e.id}: pokemon ${e.scene.pokemon}`);
      for (const c of e.scene.cast) {
        const [kind, name] = c.split('.');
        if (!fs.existsSync(`public/assets/images/${kind === 'boss' ? 'bosses' : kind}/${name}.png`)) missing.push(`${e.id}: cast ${c}`);
      }
      walk(e, (n) => {
        const k = n.kind;
        if ((k === 'item' || k === 'loseItem') && typeof n.id === 'string' && !itemOk(n.id)) missing.push(`${e.id}: item ${n.id}`);
        if (k === 'typeItem') for (const id of Object.values(n.table as Record<string, string>)) if (!itemOk(id)) missing.push(`${e.id}: item ${id}`);
        if ((k === 'wild' || k === 'join') && Array.isArray(n.species)) for (const s of n.species as string[]) if (!content.species.has(s)) missing.push(`${e.id}: species ${s}`);
        if (k === 'teachMove' && !content.moves.has(n.move as string)) missing.push(`${e.id}: move ${String(n.move)}`);
        if (k === 'join' && typeof n.quirk === 'string' && !allQuirks().has(n.quirk)) missing.push(`${e.id}: quirk ${n.quirk}`);
        if ((k === 'addEvent' || k === 'laterEvent') && !content.events.has((n.eventId ?? n.id) as string)) missing.push(`${e.id}: event ${String(n.eventId ?? n.id)}`);
      });
    }
    expect(missing).toEqual([]);
  });

  it('the schema keeps every field they use (nothing is silently dropped)', () => {
    // Fields another thread is still pushing: legends' Alpha fight (`alpha`).
    const PENDING = new Set(['alpha']);
    const dropped: string[] = [];
    const diff = (a: unknown, b: unknown, path: string) => {
      if (Array.isArray(a)) a.forEach((x, i) => diff(x, (b as unknown[] | undefined)?.[i], path));
      else if (a && typeof a === 'object')
        for (const [k, v] of Object.entries(a)) {
          if (!b || typeof b !== 'object' || !(k in b)) {
            if (!PENDING.has(k)) dropped.push(`${path}.${k}`);
          } else diff(v, (b as Record<string, unknown>)[k], `${path}.${k}`);
        }
    };
    for (const e of raw) diff(e, EventDefSchema.parse(e), e.id);
    expect(dropped).toEqual([]);
  });

  it('every flag read is set by one of them or owned by another thread', () => {
    const set = new Set<string>();
    const read: [string, string][] = [];
    for (const e of events) {
      walk(e, (n) => {
        if (n.kind === 'flag' && typeof n.key === 'string') {
          if ('amount' in n) set.add(n.key);
          else read.push([e.id, n.key]);
        }
        if (n.kind === 'anyFlag') for (const k of n.keys as string[]) read.push([e.id, k]);
      });
    }
    const orphans = read.filter(([, k]) => !set.has(k) && !foreign(k)).map(([id, k]) => `${id} reads ${k}`);
    expect(orphans).toEqual([]);
  });

  it('a once-per-run event needs its done flag unset and every outcome sets it', () => {
    for (const e of events) {
      const done = e.requires.find((c) => c.kind === 'flag' && c.key.endsWith('-done') && c.atMost === 0);
      if (!done || done.kind !== 'flag') continue;
      const outcomes = [...e.choices, ...e.remembers.flatMap((v) => v.addChoices)].flatMap((c) => [c.success, c.failure].filter(Boolean));
      for (const o of outcomes) expect(o!.effects.some((x) => x.kind === 'flag' && x.key === done.key), `${e.id}: an outcome does not set ${done.key}`).toBe(true);
      // A branch replaces its outcome's effects, so it must set the done flag as well.
      const branches = [...e.choices, ...e.remembers.flatMap((v) => v.addChoices)].flatMap((c) => c.branches ?? []);
      for (const b of branches) expect(b.effects.some((x) => x.kind === 'flag' && x.key === done.key), `${e.id}: a branch does not set ${done.key}`).toBe(true);
    }
  });

  it('keeps text lines under 30 words and pages readable', () => {
    const long: string[] = [];
    const check = (id: string, text: string) => {
      for (const page of text.split('\n\n')) for (const line of page.split('\n')) if (line.split(/\s+/).length > 30) long.push(`${id}: ${line.slice(0, 50)}...`);
    };
    for (const e of events) {
      check(e.id, e.intro);
      for (const c of e.choices) for (const o of [c.success, c.failure]) if (o) check(e.id, o.text);
    }
    expect(long).toEqual([]);
  });
});

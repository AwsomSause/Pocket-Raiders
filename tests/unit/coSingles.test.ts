// Catalog Overhaul Pack, category "singles" (STORY_FAMILIES_19 to _22): checks on the rebuilt events.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyEffect, conditionMet } from '../../src/core/events';
import { adviceText, teamWeaknesses } from '../../src/core/events/coSingles';
import { chooseStarter, createRun } from '../../src/core/run';
import { hashSeed, Rng } from '../../src/core/rng';
import { getContent } from '../../src/data';

type Json = Record<string, unknown>;
const dir = join(import.meta.dirname, '../../src/data');
const files = readdirSync(join(dir, 'events')).filter((f) => /^co-singles-\d+\.json$/.test(f));
const events = files.flatMap((f) => (JSON.parse(readFileSync(join(dir, 'events', f), 'utf8')) as { events: Json[] }).events);
const status = JSON.parse(readFileSync(join(dir, 'catalogOverhaul/status/singles.json'), 'utf8')) as { built: Record<string, string>; extra: Record<string, string> };
const flags = (JSON.parse(readFileSync(join(dir, 'catalogOverhaul/flags/singles.json'), 'utf8')) as { flags: { key: string; readBy: string }[] }).flags;
const content = getContent();

/** Every object with a `kind` anywhere inside a value. */
function kinds(v: unknown, out: Json[] = []): Json[] {
  if (Array.isArray(v)) for (const x of v) kinds(x, out);
  else if (v && typeof v === 'object') {
    if (typeof (v as Json).kind === 'string') out.push(v as Json);
    for (const x of Object.values(v)) kinds(x, out);
  }
  return out;
}
const outcomes = (e: Json): Json[] => [...(e.choices as Json[]), ...((e.remembers as Json[] | undefined) ?? []).flatMap((r) => (r.addChoices as Json[] | undefined) ?? [])].flatMap((c) => [c.success, c.failure].filter(Boolean) as Json[]);

describe('catalog overhaul: singles', () => {
  it('every built id and every extra is a live event from a singles file', () => {
    const ids = new Set(events.map((e) => e.id));
    for (const id of [...Object.keys(status.built), ...Object.values(status.extra)]) {
      expect(ids.has(id), id).toBe(true);
      expect(content.events.get(id), id).toBeDefined();
    }
  });

  it('every room an outcome opens exists, and every item it gives is a real item', () => {
    for (const e of events) {
      for (const k of kinds(outcomes(e))) {
        if (k.kind === 'addEvent' || k.kind === 'laterEvent') expect(content.events.has(String(k.eventId)), `${e.id} opens ${k.eventId}`).toBe(true);
        if (k.kind === 'addEventFrom') for (const id of k.ids as string[]) expect(content.events.has(id), `${e.id} opens ${id}`).toBe(true);
        if (k.kind === 'item' && typeof k.id === 'string' && 'count' in k) expect(content.catalog.has(k.id) || content.items.has(k.id), `${e.id} gives ${k.id}`).toBe(true);
        if (k.kind === 'itemFrom') for (const id of k.ids as string[]) expect(content.catalog.has(id) || content.items.has(id), `${e.id} gives ${id}`).toBe(true);
        if (k.kind === 'wild' || k.kind === 'join') for (const s of (k.species as string[] | undefined) ?? []) expect(content.species.has(s), `${e.id} species ${s}`).toBe(true);
      }
    }
  });

  it('every flag an event sets or reads is in the flags list, and has a reader', () => {
    const known = new Map(flags.map((f) => [f.key, f]));
    for (const e of events) for (const k of kinds(e)) if (k.kind === 'flag') expect(known.has(String(k.key)), `${e.id} uses flag ${k.key}`).toBe(true);
    for (const f of flags) expect(f.readBy.length, f.key).toBeGreaterThan(0);
  });

  it('no event can leave the player without an open choice', () => {
    // A choice with no `requires` is always open; every view of an event (base, and each remembers variant) keeps one.
    const open = (c: Json): boolean => ((c.requires as unknown[] | undefined) ?? []).length === 0;
    for (const e of events) {
      const base = e.choices as Json[];
      expect(base.some(open), `${e.id}`).toBe(true);
      for (const r of (e.remembers as Json[] | undefined) ?? []) {
        const hide = (r.hide as number[] | undefined) ?? [];
        const view = [...base.filter((_, i) => !hide.includes(i)), ...((r.addChoices as Json[] | undefined) ?? [])];
        expect(view.some(open), `${e.id} / ${r.id}`).toBe(true);
      }
    }
  });

  it('no event forces a Shadow Pokémon on the player', () => {
    for (const e of events) for (const k of kinds(outcomes(e))) {
      if (k.kind === 'join' || k.kind === 'wild') expect(k.shadow === true, `${e.id}`).toBe(false);
    }
  });

  it('"a Rock- or Steel-type" (partyTypes) holds for any listed type', () => {
    const run = { party: [{ speciesId: 'geodude', hp: 10 }] } as never;
    expect(conditionMet(content, run, { kind: 'partyTypes', types: ['steel', 'rock'] })).toBe(true);
    expect(conditionMet(content, run, { kind: 'partyTypes', types: ['steel', 'water'] })).toBe(false);
  });

  it('advice reads the real party: shared weaknesses, then habits', () => {
    const mon = (speciesId: string, moveCounts?: Record<string, number>) => ({ uid: speciesId, speciesId, hp: 10, moves: [{ id: 'tackle' }, { id: 'thunderbolt' }], moveCounts });
    // Geodude and Onix: Water, Grass, Ice, Fighting, Ground and Steel each hit both hard.
    const rocks = { party: [mon('geodude'), mon('onix')] } as never;
    const weak = teamWeaknesses(content, rocks);
    expect(weak.map((w) => w.type)).toContain('water');
    expect(weak.every((w) => w.mons.length === 2)).toBe(true);
    expect(adviceText(content, rocks, 'weakness')).toMatch(/hits 2 of your team hard/);
    // One Pokémon alone shares nothing (boundary).
    expect(teamWeaknesses(content, { party: [mon('geodude')] } as never)).toEqual([]);
    expect(adviceText(content, { party: [mon('geodude')] } as never, 'weakness')).toMatch(/Nothing hits more than one/);
    // Habits: the most-used Pokémon and its favourite move; the least used is named too.
    const fought = { party: [mon('pikachu', { thunderbolt: 9, tackle: 2 }), mon('eevee', { tackle: 1 })] } as never;
    const habits = adviceText(content, fought, 'habits');
    expect(habits).toMatch(/Pikachu\. Thunderbolt is its answer/);
    expect(habits).toMatch(/Eevee has barely/);
  });

  it('addStop tutor opens a Move Tutor service stop on the current node', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'co-singles', archetypeId: 'red' }), 0);
    const here = run.stage!.map.nodes.find((n) => n.column === 1)!;
    run.stage!.current = here.id;
    const before = here.sides.length;
    expect(applyEffect(content, run, { kind: 'addStop', stop: 'tutor' }, new Rng(hashSeed('t')))).toBe('a move tutor opens here');
    expect(here.sides.length).toBe(before + 1);
    expect(here.sides.at(-1)).toMatchObject({ kind: 'service', serviceId: 'tutor', used: false });
  });
});

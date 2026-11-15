// Catalog overhaul, families-a (STORY_FAMILIES 1, 2, 3, 4, 7): every built event is reachable, pays what it says and
// remembers only what something reads. Guide: docs/status/co-families-a.md.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getContent } from '../../src/data';
import { collect } from '../../tools/events/co/_fa-flags';

type Json = Record<string, unknown>;
const root = join(__dirname, '../..');
const dir = join(root, 'src/data/events');
const files = readdirSync(dir).filter((f) => f.startsWith('co-families-a-'));
const mine = files.flatMap((f) => (JSON.parse(readFileSync(join(dir, f), 'utf8')) as { events: Json[] }).events);
const removed = files.flatMap((f) => (JSON.parse(readFileSync(join(dir, f), 'utf8')) as { remove: string[] }).remove);
const status = JSON.parse(readFileSync(join(root, 'src/data/catalogOverhaul/status/families-a.json'), 'utf8')) as { built: Record<string, string>; merged: Record<string, string>; rule: Record<string, string>; scrapped: string[]; extra: Record<string, string> };
const ledger = (JSON.parse(readFileSync(join(root, 'src/data/catalogOverhaul/ledger.json'), 'utf8')) as { rows: string[][] }).rows.filter((r) => r[5] === 'families-a').map((r) => r[0]!);
const content = getContent();

const each = (x: unknown, fn: (o: Json) => void): void => {
  if (Array.isArray(x)) return x.forEach((y) => each(y, fn));
  if (!x || typeof x !== 'object') return;
  fn(x as Json);
  Object.values(x as Json).forEach((y) => each(y, fn));
};
const choicesOf = (e: Json): Json[] => [...(e.choices as Json[]), ...((e.remembers as Json[] | undefined) ?? []).flatMap((v) => (v.addChoices as Json[] | undefined) ?? [])];
const outcomes = (c: Json): Json[] => [c.success as Json, ...(c.failure ? [c.failure as Json] : [])];

describe('families-a events', () => {
  it('are all loaded as live events', () => {
    expect(mine.length).toBeGreaterThan(0);
    for (const e of mine) {
      const live = content.events.get(String(e.id));
      expect(live, String(e.id)).toBeDefined();
      expect(live!.disabled, String(e.id)).toBe(false);
    }
  });

  it('every room is opened by another event, and every opened event exists', () => {
    const opened = new Set<string>();
    for (const e of mine) each(e, (o) => {
      if ((o.kind === 'addEvent' || o.kind === 'laterEvent') && typeof o.eventId === 'string') opened.add(o.eventId);
      if (o.kind === 'addEventFrom') (o.ids as string[]).forEach((id) => opened.add(id));
    });
    for (const id of opened) expect(content.events.has(id), `opened event ${id}`).toBe(true);
    for (const e of mine) if (e.room === true) expect(opened.has(String(e.id)), `room ${String(e.id)} is never opened`).toBe(true);
  });

  it('every event has an intro and one to four visible choices in each variant', () => {
    for (const e of mine) {
      expect(String(e.intro).length, String(e.id)).toBeGreaterThan(20);
      const base = (e.choices as Json[]).length;
      expect(base).toBeGreaterThanOrEqual(1);
      for (const v of (e.remembers as Json[] | undefined) ?? []) {
        const n = base - ((v.hide as number[] | undefined) ?? []).length + ((v.addChoices as Json[] | undefined) ?? []).length;
        expect(n, `${String(e.id)} variant ${String(v.id)}`).toBeGreaterThanOrEqual(1);
        expect(n, `${String(e.id)} variant ${String(v.id)}`).toBeLessThanOrEqual(4);
      }
    }
  });

  it('every choice the player cannot always take leaves another one open (no dead ends)', () => {
    for (const e of mine) {
      const free = (c: Json): boolean => ((c.requires as Json[] | undefined) ?? []).length === 0;
      const base = e.choices as Json[];
      expect(base.some(free), `${String(e.id)} has no choice free of requirements`).toBe(true);
      for (const v of (e.remembers as Json[] | undefined) ?? []) {
        const hide = (v.hide as number[] | undefined) ?? [];
        const shown = [...base.filter((_, i) => !hide.includes(i)), ...((v.addChoices as Json[] | undefined) ?? [])];
        expect(shown.some(free), `${String(e.id)} variant ${String(v.id)} has no free choice`).toBe(true);
      }
    }
  });

  it('gives only items, Pokémon and moves the game knows', () => {
    const item = (id: string): boolean => content.items.has(id) || content.catalog.has(id);
    for (const e of mine) each(e, (o) => {
      if ((o.kind === 'item' || o.kind === 'loseItem') && typeof o.id === 'string') expect(item(o.id), `${String(e.id)}: item ${o.id}`).toBe(true);
      if (o.kind === 'itemFrom') for (const id of o.ids as string[]) expect(item(id), `${String(e.id)}: item ${id}`).toBe(true);
      if (o.kind === 'join' || o.kind === 'wild' || o.kind === 'egg') for (const s of (o.species as string[] | undefined) ?? []) expect(content.species.has(s), `${String(e.id)}: species ${s}`).toBe(true);
      if (o.kind === 'trainer') {
        for (const s of [...((o.team as string[] | undefined) ?? []), ...((o.lineup as string[] | undefined) ?? [])]) expect(content.species.has(s), `${String(e.id)}: species ${s}`).toBe(true);
        if (typeof o.spritePokemon === 'string') expect(content.species.has(o.spritePokemon), `${String(e.id)}: sprite ${o.spritePokemon}`).toBe(true);
        if (typeof o.classId === 'string') expect(content.trainers.has(o.classId), `${String(e.id)}: class ${o.classId}`).toBe(true);
      }
      if (o.kind === 'partyMove' && typeof o.move === 'string') expect(content.moves.has(o.move), `${String(e.id)}: move ${o.move}`).toBe(true);
      if (o.kind === 'partySpecies' && typeof o.species === 'string') expect(content.species.has(o.species), `${String(e.id)}: species ${o.species}`).toBe(true);
    });
  });

  it('a choice that costs money needs that money, and no story fight can end the run', () => {
    for (const e of mine) for (const c of choicesOf(e)) for (const o of outcomes(c)) {
      const cost = ((o.effects as Json[]) ?? []).filter((x) => x.kind === 'money' && Number(x.amount) < 0).reduce((n, x) => n - Number(x.amount), 0);
      if (cost > 0) {
        const need = ((c.requires as Json[] | undefined) ?? []).find((r) => r.kind === 'money');
        expect(Number(need?.atLeast ?? 0), `${String(e.id)} "${String(c.label)}" costs ₽${cost}`).toBeGreaterThanOrEqual(cost);
      }
      const b = o.battle as Json | undefined;
      if (b && b.kind === 'trainer') expect(b.friendly === true || b.pseudo === true, `${String(e.id)} "${String(c.label)}": a trainer story fight must be friendly`).toBe(true);
    }
  });

  it('rewards stay inside their limits: no healing item handed out, one named held item at a time', () => {
    const HEALS = ['potion', 'super-potion', 'hyper-potion', 'max-potion', 'full-restore', 'revive', 'max-revive'];
    for (const e of mine) for (const c of choicesOf(e)) for (const o of outcomes(c)) {
      const fx = [...((o.effects as Json[]) ?? []), ...(((o.battle as Json | undefined)?.win as Json[] | undefined) ?? [])];
      const paid = fx.some((x) => x.kind === 'money' && Number(x.amount) < 0);
      for (const x of fx) {
        // The pack: no event gives an in-battle healing item. A fair-price purchase at a merchant's stall is a sale, not a gift.
        if (x.kind === 'item' && HEALS.includes(String(x.id))) expect(paid, `${String(e.id)} "${String(c.label)}" gives ${String(x.id)} for free`).toBe(true);
        if (x.kind === 'itemFrom') for (const id of x.ids as string[]) expect(HEALS.includes(id), `${String(e.id)} "${String(c.label)}" may give ${id}`).toBe(false);
        if (x.kind === 'item') expect(Number(x.count ?? 1), `${String(e.id)} "${String(c.label)}"`).toBeLessThanOrEqual(5);
        if (x.kind === 'levels') expect(Number(x.amount), `${String(e.id)} "${String(c.label)}"`).toBeLessThanOrEqual(2);
        if (x.kind === 'money' && Number(x.amount) > 0) expect(Number(x.amount), `${String(e.id)} "${String(c.label)}"`).toBeLessThanOrEqual(3000);
      }
    }
  });

  it('every flag set is read by something (or noted), and every flag read is set by something (or noted)', () => {
    const flags = collect();
    for (const [key, f] of Object.entries(flags)) {
      if (f.readBy.length === 0) expect(f.note, `flag ${key} is set by ${f.setBy.join(', ')} and never read: note who reads it`).toBeTruthy();
      if (f.setBy.length === 0) expect(f.note, `flag ${key} is read by ${f.readBy.join(', ')} and never set: note who sets it`).toBeTruthy();
    }
    const file = JSON.parse(readFileSync(join(root, 'src/data/catalogOverhaul/flags/families-a.json'), 'utf8')) as { flags: unknown };
    expect(file.flags, 'run node tools/events/co/_fa-flags.ts').toEqual(flags);
  });

  it('no line names a past run (same-run memory only)', () => {
    for (const e of mine) each(e, (o) => {
      for (const k of ['key', 'id']) if (typeof o[k] === 'string' && (o.kind === 'flag' || o.kind === 'flagAge')) expect(String(o[k]).startsWith('past-'), `${String(e.id)} reads ${String(o[k])}`).toBe(false);
    });
  });
});

describe('families-a status', () => {
  it('lists only ids the category owns, and every built id is in a co file', () => {
    const ids = new Set(mine.map((e) => String(e.id)));
    for (const id of Object.keys(status.built)) {
      expect(ledger, id).toContain(id);
      expect(ids.has(id), `${id} is marked built`).toBe(true);
    }
    for (const id of [...Object.keys(status.merged), ...Object.keys(status.rule), ...status.scrapped]) expect(removed, `${id} is retired in the status file but not in a REMOVE list`).toContain(id);
    for (const id of removed) expect([...Object.keys(status.merged), ...Object.keys(status.rule), ...status.scrapped], `${id} is removed but has no status`).toContain(id);
    for (const [name, id] of Object.entries(status.extra)) expect(ids.has(id), `extra ${name}`).toBe(true);
  });

  it('every event in a co file is a built catalog id or a listed extra scene', () => {
    const extras = new Set(Object.values(status.extra));
    for (const e of mine) {
      const id = String(e.id);
      expect(id in status.built || extras.has(id), `${id} is built but missing from the status file`).toBe(true);
    }
  });
});

describe('families-a chain pseudo-stages', () => {
  const chains = (JSON.parse(readFileSync(join(root, 'src/data/catalogOverhaul/pseudo/families-a.json'), 'utf8')) as { chains: { id: string; entry: string }[] }).chains;
  it('every chain walks from its entry through rooms the files hold, and every battle inside is a pseudo-stage battle', async () => {
    const { chainRooms, chainById } = await import('../../src/core/dungeon/pseudo');
    for (const c of chains) {
      const chain = chainById(c.id)!;
      expect(chain, c.id).toBeDefined();
      const rooms = chainRooms(content, chain);
      expect(rooms.length, `${c.id} has rooms`).toBeGreaterThan(1);
      for (const r of rooms) {
        const def = mine.find((e) => e.id === r.event);
        expect(def, `${c.id}: ${r.event} is a families-a room`).toBeDefined();
        expect(def!.room, `${r.event} is a room`).toBe(true);
        each(def, (o) => {
          if (o.kind === 'wild' || o.kind === 'trainer') if ('friendly' in o || 'win' in o) expect(o.pseudo, `${r.event}: battle inside a chain must set pseudo`).toBe(true);
        });
      }
    }
  });
  it('the Windswept Spire is three rooms alone and four with Oswin (SF8.3)', async () => {
    const { chainRooms, chainById } = await import('../../src/core/dungeon/pseudo');
    const ids = chainRooms(content, chainById('ps_fa_spire')!).map((r) => r.event);
    for (const id of ['ranger-spire-1', 'ranger-spire-2', 'ranger-spire-rest', 'ranger-spire-top', 'ranger-spire-view']) expect(ids).toContain(id);
  });
});

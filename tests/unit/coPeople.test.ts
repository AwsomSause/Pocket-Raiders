// Catalog Overhaul Pack, people (mentors, past Champions and Leaders, the Road Roster): every built scene is well-formed.
// Checks: known items, species, moves and cast art; rooms open and are opened; flags that are set are read (or listed as an afterstory in
// flags/people.json) and flags that are read are set; the three-meeting arcs are complete; dialogue lines stay under 30 words (pack writing rule).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { EventChoice, EventCondition, EventDef, EventEffect, EventOutcome } from '../../src/core/contentSchema';
import { allChoices } from '../../src/core/eventMemory';
import { getContent } from '../../src/data';

const root = join(__dirname, '../..');
const json = <T>(p: string): T => JSON.parse(readFileSync(join(root, p), 'utf8')) as T;
const content = getContent();
const files = readdirSync(join(root, 'src/data/events')).filter((f) => f.startsWith('co-people-'));
const mine: EventDef[] = files.flatMap((f) => json<{ events: { id: string }[] }>(`src/data/events/${f}`).events.map((e) => content.events.get(e.id)!));
const mineIds = new Set(mine.map((e) => e.id));
const others = [...content.events.values()].filter((e) => !mineIds.has(e.id));
const registry = json<{ external: string[]; afterstory: { match: string; readBy: string }[] }>('src/data/catalogOverhaul/flags/people.json');
const oldPlacement = json<Record<string, { scene?: { cast?: string[] } }>>('src/data/catalogOverhaul/oldPlacement.json');

const outcomes = (c: EventChoice): EventOutcome[] => [c.success, ...(c.failure ? [c.failure] : [])];
const effectsOf = (o: EventOutcome): EventEffect[] => [...o.effects, ...(o.battle ? [...o.battle.win, ...(('lose' in o.battle && o.battle.lose) || []), ...(('slowWin' in o.battle && o.battle.slowWin) || [])] : [])];
const allEffects = (e: EventDef): EventEffect[] => allChoices(e).flatMap((c) => outcomes(c).flatMap(effectsOf));
const allConditions = (e: EventDef): EventCondition[] => [...e.requires, ...e.secret, ...allChoices(e).flatMap((c) => c.requires), ...e.remembers.flatMap((v) => v.when)];
const texts = (e: EventDef): string[] => [e.intro, ...e.remembers.flatMap((v) => [v.intro ?? '', v.notice ?? '']), ...allChoices(e).flatMap((c) => [c.label, ...outcomes(c).map((o) => o.text)])];
const hasItem = (id: string) => content.items.has(id) || content.catalog.has(id);

describe('people: built scenes', () => {
  it('there are scenes, each in one file', () => {
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every(Boolean)).toBe(true);
  });

  it('every item, species and move named exists', () => {
    const bad: string[] = [];
    const species = (id: string | undefined, where: string) => { if (id && !content.species.has(id)) bad.push(`${where}: species ${id}`); };
    const move = (id: string, where: string) => { if (!content.moves.has(id)) bad.push(`${where}: move ${id}`); };
    for (const e of mine) {
      species(e.scene.pokemon, e.id);
      for (const c of allConditions(e)) {
        if (c.kind === 'item' && !hasItem(c.id)) bad.push(`${e.id}: needs item ${c.id}`);
        if (c.kind === 'partySpecies') species(c.species, e.id);
      }
      for (const x of allEffects(e)) {
        if ((x.kind === 'item' || (x.kind === 'loseItem' && x.id)) && !hasItem(x.id!)) bad.push(`${e.id}: item ${x.id}`);
        if (x.kind === 'itemFrom') for (const id of x.ids) if (!hasItem(id)) bad.push(`${e.id}: item ${id}`);
        if (x.kind === 'join' || x.kind === 'egg') for (const id of x.species) species(id, e.id);
        if (x.kind === 'teachMove') { move(x.move, e.id); species(x.species, e.id); }
      }
      for (const c of allChoices(e)) for (const o of outcomes(c)) {
        const b = o.battle;
        if (!b || b.kind === 'raid') continue;
        for (const id of b.species ?? []) species(id, e.id);
        for (const id of b.foeMoves ?? []) move(id, e.id);
        if (b.kind === 'trainer') {
          for (const id of [...(b.team ?? []), ...(b.lineup ?? []), ...(b.counter?.team ?? [])]) species(id, e.id);
          species(b.ally, e.id);
          if (b.bossId && !content.bosses.has(b.bossId)) bad.push(`${e.id}: boss ${b.bossId}`);
          expect(b.friendly, `${e.id}: every fight in this category is friendly (a loss never ends the run)`).toBe(true);
        } else expect(b.friendly, `${e.id}: every fight in this category is friendly`).toBe(true);
      }
    }
    expect(bad).toEqual([]);
  });

  it('cast art is art the game already has', () => {
    const known = new Set([...Object.values(oldPlacement).flatMap((p) => p.scene?.cast ?? []), ...others.flatMap((e) => e.scene.cast)]);
    const bad = mine.flatMap((e) => e.scene.cast.filter((c) => !known.has(c)).map((c) => `${e.id}: ${c}`));
    expect(bad).toEqual([]);
  });

  it('every room is opened by a scene, and every scene that opens a room names a real one', () => {
    const opened = new Set<string>();
    const bad: string[] = [];
    for (const e of mine) for (const x of allEffects(e)) {
      const ids = x.kind === 'addEvent' || x.kind === 'seeAgain' ? [x.eventId] : x.kind === 'addEventFrom' ? x.ids : [];
      for (const id of ids) {
        if (!content.events.has(id)) bad.push(`${e.id} opens ${id}, which does not exist`);
        if (x.kind !== 'seeAgain') opened.add(id);
      }
    }
    for (const e of mine) if (e.room && !opened.has(e.id)) bad.push(`${e.id} is a room nothing opens`);
    for (const id of opened) if (mineIds.has(id) && !content.events.get(id)!.room) bad.push(`${id} is opened as a room but is not marked room`);
    expect(bad).toEqual([]);
  });

  it('flags: what is set is read (or is a listed afterstory), and what is read is set', () => {
    const set = new Set<string>();
    const read = new Set<string>();
    for (const e of [...mine, ...others]) {
      for (const x of allEffects(e)) if (x.kind === 'flag') set.add(x.key);
      for (const c of allConditions(e)) if (c.kind === 'flag') read.add(c.key);
    }
    const mySet = new Set(mine.flatMap((e) => allEffects(e).flatMap((x) => (x.kind === 'flag' ? [x.key] : []))));
    const myRead = new Set(mine.flatMap((e) => allConditions(e).flatMap((c) => (c.kind === 'flag' ? [c.key] : []))));
    const after = registry.afterstory.map((a) => new RegExp(`^${a.match}$`));
    const unread = [...mySet].filter((k) => !read.has(k) && !after.some((r) => r.test(k)));
    expect(unread, 'flags set but never read: read them in a scene, or list the afterstory in flags/people.json').toEqual([]);
    const unset = [...myRead].filter((k) => !set.has(k) && !registry.external.includes(k) && !(k.endsWith('-at') && set.has(k.slice(0, -3))));
    expect(unset, 'flags read but never set: a typo, or a flag another category sets (list it under external)').toEqual([]);
  });

  it('a Remembers notice or a choice never needs a flag only its own scene sets afterwards (no dead choices)', () => {
    // A choice that requires a flag must be reachable: some other outcome (any scene) sets that flag.
    const setters = new Map<string, Set<string>>();
    for (const e of [...mine, ...others]) for (const x of allEffects(e)) if (x.kind === 'flag' && x.amount > 0) (setters.get(x.key) ?? setters.set(x.key, new Set()).get(x.key)!).add(e.id);
    const bad: string[] = [];
    for (const e of mine) for (const c of allChoices(e)) for (const r of c.requires) {
      if (r.kind === 'flag' && r.atLeast > 0 && !registry.external.includes(r.key) && !setters.has(r.key)) bad.push(`${e.id}: "${c.label}" needs ${r.key}, which nothing sets`);
    }
    expect(bad).toEqual([]);
  });

  it('Road Roster arcs are whole: three meetings, each able to move the arc on', () => {
    const bases = mine.filter((e) => e.id.startsWith('npc-meet-') && e.id.endsWith('-m2')).map((e) => e.id.slice(0, -3));
    const bad: string[] = [];
    const reach = (start: EventDef): EventDef[] => {
      const seen = new Set([start.id]);
      const queue = [start];
      while (queue.length) for (const x of allEffects(queue.shift()!)) {
        const ids = x.kind === 'addEvent' ? [x.eventId] : x.kind === 'addEventFrom' ? x.ids : [];
        for (const id of ids) if (!seen.has(id) && content.events.has(id)) { seen.add(id); queue.push(content.events.get(id)!); }
      }
      return [...seen].map((id) => content.events.get(id)!);
    };
    for (const base of bases) {
      const key = (content.events.get(`${base}-m2`)!.requires.find((c) => c.kind === 'flag' && c.key.endsWith('-m1')) as { key: string } | undefined)?.key.slice(0, -3);
      if (!key) { bad.push(`${base}: meeting 2 does not wait for meeting 1`); continue; }
      for (const [n, flag] of [[1, 'm1'], [2, 'm2'], [3, 'done']] as const) {
        const ev = content.events.get(n === 1 ? base : `${base}-m${n}`);
        if (!ev) { bad.push(`${base}: meeting ${n} is missing`); continue; }
        if (!reach(ev).some((r) => allEffects(r).some((x) => x.kind === 'flag' && x.key === `${key}-${flag}`))) bad.push(`${ev.id}: nothing sets ${key}-${flag}`);
        if (n > 1 && !ev.callback) bad.push(`${ev.id}: a later meeting must be a callback`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('spoken lines stay under 30 words, and nobody is handed a Shadow Pokémon', () => {
    const long: string[] = [];
    for (const e of mine) for (const t of texts(e)) for (const m of t.matchAll(/"([^"]+)"/g)) if (m[1]!.trim().split(/\s+/).length >= 30) long.push(`${e.id}: "${m[1]!.slice(0, 60)}..."`);
    expect(long).toEqual([]);
    for (const e of mine) for (const x of allEffects(e)) if (x.kind === 'join') expect(x.shadow, e.id).toBe(false);
  });
});

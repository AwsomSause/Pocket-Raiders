// Catalog Overhaul, anime row (AN1-AN36, AQ1-AQ60): the built events against the pack docs and the game's rules.
// Doc choice labels: tests/unit/fixtures/coAnimeChoices.json (tools/catalog-overhaul/anime-doc-choices.ts).
// Status note: docs/status/co-anime.md (tools/catalog-overhaul/anime-report.ts).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { EventChoice, EventCondition, EventDef, EventEffect, EventOutcome } from '../../src/core/contentSchema';
import { allChoices } from '../../src/core/eventMemory';
import { getContent } from '../../src/data';
import fixture from './fixtures/coAnimeChoices.json';

const root = join(__dirname, '../..');
const json = <T>(p: string): T => JSON.parse(readFileSync(join(root, p), 'utf8')) as T;
const files = readdirSync(join(root, 'src/data/events')).filter((f) => /^co-anime-.*\.json$/.test(f));
const builtIds = files.flatMap((f) => json<{ events: { id: string }[] }>(`src/data/events/${f}`).events.map((e) => e.id));
const content = getContent();
const events: EventDef[] = builtIds.map((id) => content.events.get(id)!);
const status = json<{ built: Record<string, string>; extra: Record<string, string> }>('src/data/catalogOverhaul/status/anime.json');
const placement = json<Record<string, { shape: string; earliest: string; beats?: string[] }>>('src/data/catalogOverhaul/placement/anime.json');
const flagsFile = json<{ flags: { key: string; setBy: string[]; readBy: string[] }[]; external: { key: string; readBy: string[] }[] }>('src/data/catalogOverhaul/flags/anime.json');
const doc = fixture.questlines as Record<string, { title: string; choices: string[] }>;

/** The catalog ids of this category live inside these questlines. */
const CATALOG_HOME: Record<string, string> = { 'ash-training': 'AQ1', 'brock-cooking': 'AQ43', 'lillie-nebby': 'AQ51' };
const prefix = (q: string) => `${q.slice(0, 2).toLowerCase()}${q.slice(2).padStart(2, '0')}-`;
const eventsOf = (q: string) => events.filter((e) => e.id.startsWith(prefix(q)) || CATALOG_HOME[e.id] === q);
const questlineOf = (id: string): string | null => CATALOG_HOME[id] ?? (/^(an|aq)(\d\d)-/.test(id) ? `${id.slice(0, 2).toUpperCase()}${Number(id.slice(2, 4))}` : null);

const outcomes = (c: EventChoice): EventOutcome[] => [c.success, ...(c.failure ? [c.failure] : [])];
const effectsOf = (o: EventOutcome): EventEffect[] => [...o.effects, ...(o.battle ? [...o.battle.win, ...('lose' in o.battle ? o.battle.lose ?? [] : []), ...('slowWin' in o.battle ? o.battle.slowWin ?? [] : [])] : [])];
const allEffects = (e: EventDef): EventEffect[] => allChoices(e).flatMap(outcomes).flatMap(effectsOf);
const allConditions = (e: EventDef): EventCondition[] => [...e.requires, ...e.secret, ...allChoices(e).flatMap((c) => c.requires), ...e.remembers.flatMap((v) => v.when)];
/** Labels compare without case, quotes, emphasis marks or end punctuation. */
const norm = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[*"“”]/g, '').replace(/[.!?…]+$/g, '').replace(/\s+/g, ' ').trim();

/**
 * Doc "choices" that are not buttons, or that the questline offers in another way. Each needs a reason.
 * Keep this list short: a label the doc writes on a button belongs on a button.
 */
const NOT_A_BUTTON: Record<string, Record<string, string>> = {
  AQ16: { 'Seen a bird? Gold?': 'the hunter\'s question, printed on the same line as the choices' },
};

describe('anime questlines: what is built', () => {
  it('has events, all loaded by the game', () => {
    expect(builtIds.length).toBeGreaterThan(0);
    for (const id of builtIds) expect(content.events.has(id), id).toBe(true);
  });

  it('every event id belongs to a questline of the docs (anNN- / aqNN-), or is one of the three catalog ids', () => {
    for (const e of events) {
      const q = questlineOf(e.id);
      expect(q && doc[q], `${e.id}: no such questline`).toBeTruthy();
    }
  });

  it('the status file lists each built questline with its first event, and the catalog ids it built', () => {
    const built = new Set(events.map((e) => questlineOf(e.id)!));
    expect(Object.keys(status.extra).sort()).toEqual([...built].sort());
    for (const [q, id] of Object.entries(status.extra)) expect(questlineOf(id), `${q} -> ${id}`).toBe(q);
    for (const id of Object.keys(status.built)) expect(builtIds, id).toContain(id);
  });

  it('every built questline has a placement block whose beats exist', () => {
    for (const [q, first] of Object.entries(status.extra)) {
      const p = placement[first];
      expect(p, `${q}: no placement for ${first}`).toBeTruthy();
      expect(p!.earliest, q).toMatch(/^A\d+$/);
      expect(content.events.get(first)!.minStage, `${q}: minStage follows "earliest"`).toBe(Number(p!.earliest.slice(1)));
      for (const b of p!.beats ?? []) expect(questlineOf(b), `${q}: beat ${b}`).toBe(q);
      for (const b of p!.beats ?? []) expect(builtIds, `${q}: beat ${b}`).toContain(b);
    }
  });
});

describe('anime questlines: against the docs', () => {
  it('offers every choice label the doc writes, word for word', () => {
    const missing: string[] = [];
    for (const q of Object.keys(status.extra)) {
      const offered = new Set(eventsOf(q).flatMap((e) => allChoices(e).map((c) => norm(c.label))));
      for (const label of doc[q]!.choices) {
        if (NOT_A_BUTTON[q]?.[label]) continue;
        if (!offered.has(norm(label))) missing.push(`${q}: "${label}"`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('the first event carries the questline\'s title', () => {
    for (const [q, first] of Object.entries(status.extra)) expect(norm(content.events.get(first)!.name), q).toBe(norm(doc[q]!.title));
  });
});

describe('anime questlines: the game\'s rules', () => {
  const targets = new Map<string, string[]>();
  for (const e of events) for (const f of allEffects(e)) {
    const ids = f.kind === 'addEvent' || f.kind === 'laterEvent' ? [f.eventId] : f.kind === 'addEventFrom' ? f.ids : [];
    for (const id of ids) targets.set(id, [...(targets.get(id) ?? []), e.id]);
  }

  it('every room is opened by a scene of its own questline, and only rooms are opened', () => {
    for (const [id, from] of targets) {
      const room = content.events.get(id);
      expect(room, `${from[0]} opens ${id}, which does not exist`).toBeTruthy();
      expect(room!.room, `${id} is opened by ${from[0]} but is not a room`).toBe(true);
      for (const f of from) expect(questlineOf(f), `${f} opens ${id}`).toBe(questlineOf(id));
    }
    for (const e of events.filter((x) => x.room)) expect(targets.has(e.id), `${e.id} is a room nobody opens`).toBe(true);
  });

  it('no story fight can end a run', () => {
    for (const e of events) for (const c of allChoices(e)) for (const o of outcomes(c)) {
      if (o.battle && o.battle.kind !== 'raid') expect(o.battle.pseudo, `${e.id} "${c.label}"`).toBe(true);
    }
  });

  it('nothing hands out a Shadow Pokémon', () => {
    for (const e of events) for (const f of allEffects(e)) if (f.kind === 'join') expect(f.shadow, e.id).toBe(false);
  });

  it('every species, move and ability named exists', () => {
    const species = (id: string, where: string) => expect(content.species.has(id), `${where}: unknown species ${id}`).toBe(true);
    const move = (id: string, where: string) => expect(content.moves.get(id)?.supported, `${where}: move ${id}`).toBe(true);
    for (const e of events) {
      if (e.scene.pokemon) species(e.scene.pokemon, e.id);
      for (const c of allConditions(e)) {
        if (c.kind === 'partyLine' || c.kind === 'partySpecies') species(c.species, e.id);
        if (c.kind === 'partyMove') move(c.move, e.id);
      }
      for (const f of allEffects(e)) {
        if (f.kind === 'join' || f.kind === 'egg') f.species.forEach((s) => species(s, e.id));
        if (f.kind === 'join') f.moves.forEach((m) => move(m, e.id));
        if (f.kind === 'join' && f.ability) expect(content.abilities.has(f.ability), `${e.id}: ability ${f.ability}`).toBe(true);
        if (f.kind === 'friendshipLine') species(f.species, e.id);
        if (f.kind === 'formChange') [f.from, f.to].forEach((s) => species(s, e.id));
        if (f.kind === 'tradeAway') f.want.species.forEach((s) => species(s, e.id));
        if (f.kind === 'teachMove') move(f.move, e.id);
      }
      for (const c of allChoices(e)) for (const o of outcomes(c)) {
        const b = o.battle;
        if (!b || b.kind === 'raid') continue;
        if (b.kind === 'wild') b.species.forEach((s) => species(s, e.id));
        if (b.kind === 'wild') (b.foeMoves ?? []).forEach((m) => move(m, e.id));
        if (b.kind === 'trainer') [...(b.team ?? []), ...(b.lineup ?? []), ...(b.species ?? []), ...(b.ally ? [b.ally] : []), ...(b.spritePokemon ? [b.spritePokemon] : [])].forEach((s) => species(s, e.id));
      }
    }
  });

  it('every flag is registered: set here, or listed as another thread\'s', () => {
    const set = new Set<string>();
    const read = new Set<string>();
    for (const e of events) {
      for (const f of allEffects(e)) if (f.kind === 'flag') set.add(f.key);
      for (const c of allConditions(e)) if (c.kind === 'flag' || c.kind === 'flagAge') read.add(c.key);
    }
    expect(flagsFile.flags.map((f) => f.key).sort()).toEqual([...set].sort());
    expect(flagsFile.external.map((f) => f.key).sort()).toEqual([...read].filter((k) => !set.has(k)).sort());
    // A flagAge can only read a flag one of these events stamps.
    for (const e of events) for (const c of allConditions(e)) if (c.kind === 'flagAge') expect(set.has(c.key), `${e.id}: flagAge reads ${c.key}, which nothing here sets`).toBe(true);
  });

  it('text: no empty lines, no em-dashes, no scene so long it cannot be read', () => {
    for (const e of events) {
      expect(e.intro.length, `${e.id} intro`).toBeGreaterThanOrEqual(60);
      expect(e.intro.length, `${e.id} intro`).toBeLessThanOrEqual(1200);
      for (const c of allChoices(e)) {
        expect(c.label.length, `${e.id} label "${c.label}"`).toBeLessThanOrEqual(64);
        for (const o of outcomes(c)) {
          expect(o.text.trim().length, `${e.id} "${c.label}"`).toBeGreaterThan(0);
          expect(o.text.length, `${e.id} "${c.label}"`).toBeLessThanOrEqual(1200);
          expect(o.text.includes('—') || e.intro.includes('—'), `${e.id}: em-dash`).toBe(false);
        }
      }
    }
  });

  it('a first event can be drawn; later beats are rooms or follow-ups gated by a flag or a Pokémon', () => {
    const first = new Set(Object.values(status.extra));
    for (const e of events) {
      if (first.has(e.id)) {
        expect(e.room, `${e.id} is a first event and must be drawable`).toBe(false);
        continue;
      }
      const gated = e.requires.some((c) => c.kind === 'flag' || c.kind === 'flagAge' || c.kind === 'eventSeen' || c.kind === 'partyLine' || c.kind === 'partySpecies');
      expect(e.room || (e.callback && gated), `${e.id} is neither a room nor a gated follow-up`).toBe(true);
    }
  });
});

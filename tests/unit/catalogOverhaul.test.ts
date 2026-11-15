// Catalog Overhaul Pack gate: every category's status file agrees with the ledger and with the events the game loads.
// Plan and rules: /mnt/project-files/plans/catalog-overhaul/PLAN.md; guide: docs/catalog-overhaul.md.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildContent, getContent, RAW_CONTENT } from '../../src/data';

const dir = join(__dirname, '../../src/data/catalogOverhaul');
const json = <T>(p: string): T => JSON.parse(readFileSync(p, 'utf8')) as T;
const ledger = json<{ rows: [string, string, string, string, string, string][] }>(join(dir, 'ledger.json')).rows;
const owner = new Map(ledger.map((r) => [r[0], r[5]]));
const oldIds = new Set(Object.keys(json<Record<string, unknown>>(join(dir, 'oldPlacement.json'))));
interface Status { category: string; built?: Record<string, string>; merged?: Record<string, string>; rule?: Record<string, string>; scrapped?: string[]; extra?: Record<string, string> }
const statuses = readdirSync(join(dir, 'status')).filter((f) => f.endsWith('.json')).map((f) => ({ file: f, ...json<Status>(join(dir, 'status', f)) }));
const eventsDir = join(__dirname, '../../src/data/events');
const coFiles = readdirSync(eventsDir).filter((f) => f.startsWith('co-')).map((f) => ({ file: f, ...json<{ catalogOverhaul?: string; override?: boolean; remove?: string[]; events?: { id: string }[] }>(join(eventsDir, f)) }));
const CATEGORIES = ['lead', 'singles', 'families-a', 'families-b', 'families-c', 'places', 'people', 'markets', 'evil-story', 'evil-hoenn-sinnoh-unova', 'evil-kalos-alola-galar-paldea', 'rivals', 'legends', 'anime', 'greenneedle', 'kanto-canon', 'new-events'];

describe('catalog overhaul: ledger', () => {
  it('lists all 2,821 catalog ids once, each with an owner', () => {
    expect(ledger.length).toBe(2821);
    expect(owner.size).toBe(2821);
    for (const r of ledger) expect(CATEGORIES, r[0]).toContain(r[5]);
  });
});

describe('catalog overhaul: co files', () => {
  it('are marked, override, and never build the same id twice', () => {
    const seen = new Map<string, string>();
    for (const f of coFiles) {
      expect(CATEGORIES, f.file).toContain(f.catalogOverhaul);
      expect(f.override, f.file).toBe(true);
      for (const e of f.events ?? []) {
        expect(seen.get(e.id), `${e.id} is in ${f.file} and ${seen.get(e.id)}`).toBeUndefined();
        seen.set(e.id, f.file);
        if (owner.has(e.id)) expect(owner.get(e.id), `${e.id} in ${f.file} belongs to another category`).toBe(f.catalogOverhaul);
      }
    }
  });
});

describe('catalog overhaul: status files', () => {
  const events = getContent().events;
  const coIds = new Set(coFiles.flatMap((f) => (f.events ?? []).map((e) => e.id)));
  const gone = (id: string) => !events.has(id) || events.get(id)!.disabled;

  it('one file per category, each id in one bucket, only ids the category owns', () => {
    expect(new Set(statuses.map((s) => s.category)).size).toBe(statuses.length);
    const seen = new Set<string>();
    for (const s of statuses) {
      expect(CATEGORIES, s.file).toContain(s.category);
      for (const id of [...Object.keys(s.built ?? {}), ...Object.keys(s.merged ?? {}), ...Object.keys(s.rule ?? {}), ...(s.scrapped ?? [])]) {
        expect(owner.get(id), `${id} in ${s.file}`).toBe(s.category);
        expect(seen.has(id), `${id} is listed twice`).toBe(false);
        seen.add(id);
      }
      for (const id of Object.keys(s.extra ?? {})) expect(owner.has(id), `${id} is a catalog id: list it under built`).toBe(false);
    }
  });

  it('built ids are live events from a co file', () => {
    for (const s of statuses) for (const id of Object.keys(s.built ?? {})) {
      expect(coIds.has(id), `${id} is marked built but no co file has it`).toBe(true);
      expect(gone(id), `${id} is marked built but is not drawn`).toBe(false);
    }
  });

  it('merged, rule and scrapped ids are retired, and a merge points at a live event', () => {
    for (const s of statuses) {
      for (const [id, into] of Object.entries(s.merged ?? {})) {
        expect(gone(id), `${id} was merged into ${into} but is still drawn`).toBe(true);
        expect(events.has(into) && !events.get(into)!.disabled, `${id} was merged into ${into}, which is not a live event`).toBe(true);
      }
      for (const id of [...Object.keys(s.rule ?? {}), ...(s.scrapped ?? [])]) expect(gone(id), `${id} is retired in ${s.file} but is still drawn`).toBe(true);
      for (const [id, eventId] of Object.entries(s.extra ?? {})) expect(events.has(eventId), `${id} points at ${eventId}, which does not exist`).toBe(true);
    }
  });
});

describe('catalog overhaul: loading rules (src/data/index.ts)', () => {
  const base = RAW_CONTENT.eventsExtra ?? [];
  const sample = structuredClone(getContent().events.get('berry-tree')) as unknown as Record<string, unknown>;

  it('a co file wins over an older override file with the same id', () => {
    const content = buildContent({ ...RAW_CONTENT, eventsExtra: [...base, { catalogOverhaul: 'singles', override: true, events: [{ ...sample, intro: 'Rebuilt from the pack.' }] }] });
    expect(content.events.get('berry-tree')!.intro).toBe('Rebuilt from the pack.');
  });

  it('a removed id stays loadable for saved runs but is never drawn', () => {
    expect(oldIds.has('wx-fallen-bridge')).toBe(true);
    const content = buildContent({ ...RAW_CONTENT, eventsExtra: [...base, { catalogOverhaul: 'lead', override: true, remove: ['wx-fallen-bridge'], events: [] }] });
    expect(content.events.get('wx-fallen-bridge')!.disabled).toBe(true);
    expect(content.events.get('berry-tree')!.disabled).toBe(false);
  });
});

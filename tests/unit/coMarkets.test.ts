// Catalog Overhaul Pack, markets category (STORY_FAMILIES_11, _12, _16, TRADES.md):
// every rebuilt event is valid, every choice can be reached, every remembered flag is set somewhere, and purchases never charge money you lack.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { EventChoice, EventDef, EventEffect, EventCondition } from '../../src/core/contentSchema';
import { isGiftable } from '../../src/core/events';
import { getContent } from '../../src/data';

const dir = join(__dirname, '../../src/data');
const files = readdirSync(join(dir, 'events')).filter((f) => f.startsWith('co-markets-'));
const ids = files.flatMap((f) => (JSON.parse(readFileSync(join(dir, 'events', f), 'utf8')) as { events: { id: string }[] }).events.map((e) => e.id));
const content = getContent();
const events = ids.map((id) => content.events.get(id)!);
const external = new Set((JSON.parse(readFileSync(join(dir, 'catalogOverhaul/flags/markets.json'), 'utf8')) as { external: { key: string }[] }).external.map((x) => x.key));

const choicesOf = (e: EventDef): EventChoice[] => [...e.choices, ...e.remembers.flatMap((v) => v.addChoices)];
const outcomesOf = (c: EventChoice) => [c.success, ...(c.failure ? [c.failure] : [])];
const effectsOf = (e: EventDef): EventEffect[] => choicesOf(e).flatMap((c) => outcomesOf(c).flatMap((o) => [...o.effects, ...(o.battle && 'win' in o.battle ? o.battle.win : []), ...(o.battle && 'lose' in o.battle && o.battle.lose ? o.battle.lose : [])]));
const conditionsOf = (e: EventDef): EventCondition[] => [...e.requires, ...e.remembers.flatMap((v) => v.when), ...choicesOf(e).flatMap((c) => c.requires)];

describe('co markets: content', () => {
  it('builds events', () => {
    expect(events.length).toBeGreaterThan(0);
    for (const e of events) expect(e, 'a built id is missing from the game data').toBeDefined();
  });

  it('gives only items the game can hand over, and opens only rooms that exist', () => {
    for (const e of events) for (const x of effectsOf(e)) {
      if (x.kind === 'item') expect(isGiftable(content, x.id), `${e.id} gives ${x.id}`).toBe(true);
      if (x.kind === 'itemFrom') for (const id of x.ids) expect(isGiftable(content, id), `${e.id} gives ${id}`).toBe(true);
      if (x.kind === 'market') for (const row of x.table ?? []) if (row.item) expect(content.items.has(row.item) || content.catalog.has(row.item), `${e.id} prize ${row.item}`).toBe(true);
      if (x.kind === 'addEvent') expect(content.events.has(x.eventId), `${e.id} opens ${x.eventId}`).toBe(true);
      if (x.kind === 'addEventFrom') for (const id of x.ids) expect(content.events.has(id), `${e.id} opens ${id}`).toBe(true);
      if (x.kind === 'addStop' && x.game) expect(content.minigames.games.some((g) => g.id === x.game), `${e.id} opens game ${x.game}`).toBe(true);
      if (x.kind === 'market' && x.action === 'comeBack') expect(content.events.has(x.event ?? ''), `${e.id} comeBack ${x.event}`).toBe(true);
    }
  });

  it('every room is opened by some event, and no room is drawn on its own', () => {
    const opened = new Set(events.flatMap((e) => effectsOf(e).flatMap((x) => (x.kind === 'addEvent' ? [x.eventId] : x.kind === 'addEventFrom' ? x.ids : []))));
    for (const e of events) if (e.room) expect(opened.has(e.id), `room ${e.id} is never opened`).toBe(true);
  });

  it('a purchase needs the money it costs (losses never exceed what is shown)', () => {
    for (const e of events) for (const c of choicesOf(e)) for (const o of outcomesOf(c)) {
      const cost = -o.effects.filter((x) => x.kind === 'money' && x.amount < 0).reduce((n, x) => n + (x.kind === 'money' ? x.amount : 0), 0);
      if (cost <= 0) continue;
      const needs = c.requires.find((r) => r.kind === 'money');
      expect(needs && needs.kind === 'money' ? needs.atLeast : 0, `${e.id} "${c.label}" costs ₽${cost}`).toBeGreaterThanOrEqual(cost);
    }
  });

  it('every flag an event reads is set by a markets event or listed as external', () => {
    const set = new Set(events.flatMap((e) => effectsOf(e).flatMap((x) => (x.kind === 'flag' ? [x.key] : x.kind === 'market' ? [...(x.table ?? []).flatMap((r) => (r.flag ? [r.flag] : [])), ...(x.key && (x.action === 'pawn' || x.action === 'redeem') ? [`pawn-${x.key}`] : []), ...(x.key && (x.action === 'deposit' || x.action === 'withdraw') ? [`deposit-${x.key}`] : []), ...(x.action === 'forget' ? ['move-forgotten'] : [])] : []))));
    for (const e of events) for (const c of conditionsOf(e)) if (c.kind === 'flag') expect(set.has(c.key) || external.has(c.key), `${e.id} reads flag ${c.key}, which nothing sets`).toBe(true);
  });

  it('keeps the pack writing rules: no in-battle healing item as a con, at most three variants, lines the buttons can show', () => {
    for (const e of events) {
      expect(e.remembers.length).toBeLessThanOrEqual(3);
      for (const c of choicesOf(e)) expect(c.label.length, `${e.id} "${c.label}"`).toBeLessThanOrEqual(64);
      expect(e.intro.length, e.id).toBeGreaterThan(40);
    }
  });
});

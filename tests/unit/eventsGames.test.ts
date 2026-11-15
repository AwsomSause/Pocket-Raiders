import { describe, expect, it } from 'vitest';
import { PROMPTS } from '../../src/core/interaction/prompt';
import { content } from './helpers';
import games from '../../src/data/eventsGames.json';

const ids: string[] = games.events.map((e) => e.id);
const defs = ids.map((id) => content.events.get(id)!);
const targetsOf = (e: (typeof defs)[number]): string[] =>
  // A stall that stays open after a question opens itself again (Catalog Overhaul markets): that is not a room.
  e.choices.flatMap((c) => [...c.success.effects, ...(c.failure?.effects ?? [])]).flatMap((f) => (f.kind === 'addEvent' && f.eventId !== e.id ? [f.eventId] : []));

describe('Run events F: games, puzzles and mini-games', () => {
  it('loads every event into the content map', () => {
    expect(ids.length).toBeGreaterThanOrEqual(50);
    for (const id of ids) expect(content.events.has(id), id).toBe(true);
  });
  it('every addEvent target exists and is a room', () => {
    for (const e of defs) for (const t of targetsOf(e)) expect(content.events.get(t)?.room, `${e.id} -> ${t}`).toBe(true);
  });
  it('every room is reached by some addEvent', () => {
    // Openers anywhere in the game count (the Fairground's gate opens the fair games with addEventFrom).
    const targets = new Set([...content.events.values()].flatMap((e) => [...targetsOf(e), ...e.choices.flatMap((c) => c.success.effects).flatMap((f) => (f.kind === 'addEventFrom' ? f.ids : []))]));
    for (const e of defs) if (e.room) expect(targets.has(e.id), e.id).toBe(true);
  });
  it('prompt choices use known prompts', () => {
    for (const e of defs) for (const c of e.choices) if (c.prompt) expect(PROMPTS.some((p) => p.id === c.prompt!.id), e.id).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { PROMPTS } from '../../src/core/interaction/prompt';
import { content } from './helpers';
import games from '../../src/data/eventsGames.json';

const ids: string[] = games.events.map((e) => e.id);
const defs = ids.map((id) => content.events.get(id)!);
const targetsOf = (e: (typeof defs)[number]): string[] =>
  e.choices.flatMap((c) => [...c.success.effects, ...(c.failure?.effects ?? [])]).flatMap((f) => (f.kind === 'addEvent' ? [f.eventId] : []));

describe('Run events F: games, puzzles and mini-games', () => {
  it('loads every event into the content map', () => {
    expect(ids.length).toBeGreaterThanOrEqual(50);
    for (const id of ids) expect(content.events.has(id), id).toBe(true);
  });
  it('every addEvent target exists and is a room', () => {
    for (const e of defs) for (const t of targetsOf(e)) expect(content.events.get(t)?.room, `${e.id} -> ${t}`).toBe(true);
  });
  it('every room is reached by some addEvent', () => {
    const targets = new Set(defs.flatMap(targetsOf));
    for (const e of defs) if (e.room) expect(targets.has(e.id), e.id).toBe(true);
  });
  it('prompt choices use known prompts', () => {
    for (const e of defs) for (const c of e.choices) if (c.prompt) expect(PROMPTS.some((p) => p.id === c.prompt!.id), e.id).toBe(true);
  });
});

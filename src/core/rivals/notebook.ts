// The rival Notebook: what each rival has learned about you this run. Pure and read-only; it reads only what the
// rival has recorded (rival.seen, studied, counters, adaptations, memory), never your live party, so it cannot show
// a rival knowing more than it does. Nothing here uses gameplay RNG.

import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import type { Rival } from '../story/schema';
import { usedTypes } from './adapt';

export interface NotebookEntry {
  id: string;
  title: string;
  state: string;
  major: boolean;
  /** Fights with you, and how its last one went. */
  record: string;
  /** Attack types it has watched you use, most used first. */
  watched: string[];
  /** Moves it studied from you. */
  studied: string[];
  /** Counters it trained for your Pokémon. */
  counters: string[];
  /** Other changes it made after meeting you. */
  adaptations: string[];
  /** Lines to show, in order. */
  lines: string[];
}

const cap = (s: string): string => (s ? s[0]!.toUpperCase() + s.slice(1) : s);
const moveName = (content: Content, id: string): string => content.moves.get(id)?.name ?? id;

/** One rival's page. */
export function notebookEntry(content: Content, run: RunState, rival: Rival): NotebookEntry {
  const last = rival.memory?.lastBattle;
  const watched = usedTypes(content, run, rival).map(cap);
  const studied = (rival.studied ?? []).map((s) => moveName(content, s.moveId));
  const counters = (rival.counters ?? []).map((c) => `${moveName(content, c.moveId)} against ${c.targetName}`);
  const adaptations = [...rival.adaptations];
  const record = rival.encounters === 0 ? 'You have not fought yet.' : `${rival.encounters} fight${rival.encounters === 1 ? '' : 's'}${last ? `; the last one you ${last.result === 'win' ? 'won' : 'lost'} in ${last.turns} turns` : ''}.`;
  const lines = [
    record,
    watched.length ? `Has watched you use: ${watched.join(', ')} moves.` : 'Has not seen you fight yet, so it has nothing to counter.',
    ...(studied.length ? [`Studied your moves: ${studied.join(', ')}.`] : []),
    ...(counters.length ? [`Trained counters: ${counters.join('; ')}.`] : []),
    ...(adaptations.length ? [`Changed after meeting you: ${adaptations.join('; ')}.`] : []),
  ];
  return { id: rival.id, title: `${rival.name}${rival.major ? ' (major rival)' : ''}`, state: rival.state, major: !!rival.major, record, watched, studied, counters, adaptations, lines };
}

/** Every rival met this run, the major rival first, then the most-fought. */
export function rivalNotebook(content: Content, run: RunState): NotebookEntry[] {
  return [...run.story.rivals]
    .sort((a, b) => Number(!!b.major) - Number(!!a.major) || b.encounters - a.encounters || a.id.localeCompare(b.id))
    .map((r) => notebookEntry(content, run, r));
}

// Run Commentary Bot (idea S213): an optional narrator line on the map that reacts to how the run is going. The line
// is chosen from the run's seed and its progress by a hash, so it is the same every time you look and never touches a
// gameplay stream. Text only. Pure. Off unless the "commentary" feature flag is on.

import { hashSeed } from '../rng';

export interface CommentaryFacts {
  seed: string;
  encounters: number;
  badges: number;
  /** Lead Pokémon's HP as a fraction, 0 to 1. */
  leadHp: number;
  partySize: number;
  fainted: number;
}

const LINES = {
  danger: ['Your lead is hanging by a thread. Maybe a Potion?', 'That lead Pokémon needs a rest, and soon.', 'One more hit and it is over for the front line.'],
  wiped: ['Your bench is thinning out. Careful now.', 'Some of your team is down. Pick your fights.'],
  badge: ['Another badge on the case. The crowd goes quiet, then wild.', 'A badge! The league is starting to take notice.', 'Badge number {n}. The narrator is running out of adjectives.'],
  start: ['A new run, a fresh seed. Let us see what it does with it.', 'And so it begins. Every great run starts with a small step.'],
  steady: ['Steady progress. Nothing too dramatic, which is exactly how winners do it.', 'The team looks comfortable. Suspiciously comfortable.', 'Another step along the road.', 'Still going. The narrator approves.'],
} as const;

/** One narrator line for the current moment (same facts, same line). */
export function commentaryLine(f: CommentaryFacts): string {
  const kind = f.leadHp > 0 && f.leadHp < 0.25 ? 'danger' : f.fainted >= 2 && f.fainted >= f.partySize - 1 ? 'wiped' : f.encounters === 0 ? 'start' : f.badges > 0 && f.encounters % 7 === 0 ? 'badge' : 'steady';
  const lines = LINES[kind];
  return lines[hashSeed(`${f.seed}#commentary#${f.encounters}#${kind}`).a % lines.length]!.replace('{n}', String(f.badges));
}

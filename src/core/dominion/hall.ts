// DOMINION Hall of Infamy and the Boss title (redesign R1 follow-up, pass-50 mockups `nextrun` and `infamy`). When a
// Dominion run is finished (its last region Taken), the profile keeps the team: its name, the region, the day, the Boss,
// the right hand and two more of the crew, and the Ace. The newest entry gives the Boss title on the next run's pages.

import type { DominionHallEntry, RunState } from '../state';
import { rightHand } from './chair';
import { DOMINION_DATA } from './data';
import { bossTitle } from './bossTraits';
import type { DominionBlock } from './schema';

const HALL_CAP = 10;
const rankWord = (id: string): string => DOMINION_DATA.crew.ranks.find((x) => x.id === id)?.word ?? id;

/** The Hall's record of a finished run (pure). */
export function hallEntry(run: RunState, b: DominionBlock): DominionHallEntry {
  const hand = rightHand(b) ?? b.members[0] ?? null;
  const crew = [...(hand ? [hand] : []), ...b.members.filter((m) => m.id !== hand?.id)].slice(0, 3)
    .map((m) => ({ name: m.name, look: m.look, role: rankWord(m.rank) }));
  const ace = run.party.find((p) => p.hp > 0) ?? run.party[0];
  return {
    runId: run.runId, team: b.teamName ?? 'Unnamed Crew', region: DOMINION_DATA.regions.regions[b.realm?.at ?? 'kanto']?.name ?? 'Kanto',
    day: b.day, boss: run.archetypeId, crew, ace: ace ? { speciesId: ace.speciesId, level: ace.level } : null,
  };
}

/** The Hall with this run added once, newest first. */
export function addToHall(hall: readonly DominionHallEntry[], e: DominionHallEntry): DominionHallEntry[] {
  return hall.some((x) => x.runId === e.runId) ? [...hall] : [e, ...hall].slice(0, HALL_CAP);
}

/** The Boss title from the newest finished run, or null before any. */
export const titleOf = (hall: readonly DominionHallEntry[]): string | null => (hall[0] ? bossTitle(hall[0].region) : null);

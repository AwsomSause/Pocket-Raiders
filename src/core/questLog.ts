// Quest Log (W15): one list of every quest chain with how far along it is. Read-only and derived from the profile,
// so there is no new saved state. Trainer quest lines use the claim ledger; Mythical chains count as done once the
// Mythical has been caught on any run.

import type { Content } from './contentSchema';
import { MYTHICAL_QUESTS } from './overhaul/mythicalChains';
import { questLineView, stepsDone } from './quests';
import type { Profile } from './state';

export interface QuestLogRow { id: string; group: 'trainer' | 'mythical'; name: string; done: number; total: number; detail: string }

export function questLog(content: Content, profile: Profile): QuestLogRow[] {
  const rows: QuestLogRow[] = [];
  for (const line of content.questLines.values()) {
    const done = stepsDone(content, profile, line.trainerId);
    const next = done < line.steps.length ? questLineView(content, profile, line.trainerId)?.steps.find((s) => s.status === 'current') : undefined;
    rows.push({ id: `trainer:${line.trainerId}`, group: 'trainer', name: line.name, done, total: line.steps.length, detail: next ? `Next: ${next.step.goal}` : 'Finished.' });
  }
  const caught = new Set(profile.speciesCaught);
  const seen = new Set(profile.speciesSeen);
  for (const q of MYTHICAL_QUESTS) {
    const got = caught.has(q.species);
    rows.push({ id: `mythical:${q.id}`, group: 'mythical', name: q.title, done: got ? 3 : seen.has(q.species) ? 2 : 0, total: 3, detail: got ? 'Met and caught.' : seen.has(q.species) ? 'Met, not caught yet.' : 'Appears as a map event from stage 9 of a run, once per run.' });
  }
  return rows;
}

export const questLogSummary = (rows: readonly QuestLogRow[]): { finished: number; total: number } => ({ finished: rows.filter((r) => r.done >= r.total).length, total: rows.length });

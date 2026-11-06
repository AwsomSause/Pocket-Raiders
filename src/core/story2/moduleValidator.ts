// Story Overhaul: the Module Validator. Checks a backstory module before it can be enabled: every id it names exists, the parity
// checklist is complete, enough events and echo events, and the ending grid always ends somewhere (a catch-all last row).
import { PARITY_ITEMS } from '../../quality/storyGates';
import type { StoryData } from './schema';

export const MIN_EVENTS = 8;
export const MIN_ECHO_EVENTS = 3;

/** Problems with one backstory module; an empty list means it may be enabled. */
export function validateModule(data: StoryData, backstoryId: string, itemIds: ReadonlySet<string> = new Set()): string[] {
  const m = data.backstories.find((b) => b.id === backstoryId);
  if (!m) return [`backstory "${backstoryId}" does not exist`];
  const problems: string[] = [];
  const events = new Set(data.events.map((e) => e.id));
  const remembrances = new Set(data.remembrances.map((r) => r.id));
  for (const id of [...m.events, ...m.echoEvents]) if (!events.has(id)) problems.push(`unknown event "${id}"`);
  for (const id of m.remembranceUnlocks) if (!remembrances.has(id)) problems.push(`unknown Remembrance "${id}"`);
  if (m.exclusiveItem && itemIds.size > 0 && !itemIds.has(m.exclusiveItem)) problems.push(`unknown item "${m.exclusiveItem}"`);
  if (m.events.length < MIN_EVENTS) problems.push(`needs at least ${MIN_EVENTS} events (has ${m.events.length})`);
  if (m.echoEvents.length < MIN_ECHO_EVENTS) problems.push(`needs at least ${MIN_ECHO_EVENTS} echo events (has ${m.echoEvents.length})`);
  if (m.encounterPools.length === 0) problems.push('needs a unique encounter pool');
  if (m.remembranceUnlocks.length === 0) problems.push('needs at least 1 Remembrance unlock');
  for (const p of PARITY_ITEMS) if (!m.parity.includes(p)) problems.push(`parity item missing: ${p}`);
  // Ending grid: every ending has a row, rows name real endings, and the last row has no conditions (nothing can fall through).
  const grid = m.endingGrid;
  if (grid.length === 0) problems.push('ending grid is empty');
  else {
    if (grid[grid.length - 1]!.when.length > 0) problems.push('ending grid has no catch-all last row');
    for (const e of m.endings) if (!grid.some((r) => r.ending === e)) problems.push(`ending "${e}" is in no grid row`);
    for (const r of grid) if (!m.endings.includes(r.ending)) problems.push(`grid row names unlisted ending "${r.ending}"`);
  }
  return problems;
}

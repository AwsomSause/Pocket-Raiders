// Catalog Overhaul (legends, row C): what the calendar weeks do to a run (CATALOG_INDEX rules for the `*-week` ids, rules/18_calendar.js).
// - Rivalry weeks (`startFlag`): the Rival Circuit opens (`circuit-qualified`) and the rival turns up in every pseudo-stage (`rivalry-week`).
// - Legend weeks (`blessingWeek`, and `legendaryFocus` in legends/signs.ts weekInfluence): the matching blessing starts at Influence +1.
// - Leap Day (`freeTelling`): one free Telling.
// - Odds weeks (Legendary, League, Z and Mega): their questline openings are the week's `mapEvents`; the placer gives featured
//   openings first claim on a stage's event budget (co/placement.ts planCoStage `featured`). Evil-team weeks use `evilTeamFocus`.
// Pure; no RNG of its own (the Telling uses the Telling stop's own stream).

import type { Content } from '../contentSchema';
import { blessingLegend, syncLegendFlags, tellAny } from '../legends/signs';
import type { MapNode, RunState } from '../state';

/** The rival's scene a Rivalry week adds to every pseudo-stage (tools/events/co/legends-13.ts). */
export const WEEK_RIVAL_EVENT = 'co-week-rival';
const flag = (run: Pick<RunState, 'story'>, key: string): number => Number(run.story.flags[`ev:${key}`] ?? 0);

/** Run start, every run: the week's run flags (`startFlag`). A flag already higher keeps its value. */
export function weekFlags(run: Pick<RunState, 'perkEffects' | 'story'>): void {
  for (const m of run.perkEffects ?? []) {
    if (m.kind !== 'startFlag') continue;
    if (flag(run, m.key) < m.value) run.story.flags[`ev:${m.key}`] = m.value;
  }
}

/**
 * Run start, after the blessing is drawn: `blessingWeek` raises the blessing's starting Influence by 1 when its Legendary is listed
 * (once, even if a `legendaryFocus` already did); `freeTelling` tells of a Mythical. Returns the journal lines.
 */
export function weekLegends(run: RunState): string[] {
  const mods = run.perkEffects ?? [];
  const legend = blessingLegend(run);
  const state = run.expansion?.blessing;
  const focused = mods.some((m) => m.kind === 'legendaryFocus' && legend !== null && m.species.includes(legend));
  if (legend && state && !focused && mods.some((m) => m.kind === 'blessingWeek' && m.species.includes(legend))) state.influence += 1;
  const lines: string[] = [];
  for (const m of mods) {
    if (m.kind !== 'freeTelling') continue;
    for (let i = 0; i < m.count; i++) {
      const line = tellAny(run);
      if (line) lines.push(line);
    }
  }
  syncLegendFlags(run);
  return lines;
}

/**
 * A Rivalry week: the rival waits inside every pseudo-stage. Called when a pseudo-stage's map is built. The scene goes on the first
 * ordinary node of the middle column (never the boss room), so it sits on the way whichever path is taken. No-op outside a rivalry week.
 */
export function rivalInPseudo(content: Content, run: Pick<RunState, 'stage' | 'story'>): void {
  const st = run.stage;
  if (!st?.pseudo || flag(run, 'rivalry-week') <= 0 || !content.events.has(WEEK_RIVAL_EVENT)) return;
  // Only once a rival has been met: before that there is nobody to be waiting.
  if (!run.story.rivals.some((r) => r.encounters >= 1)) return;
  const nodes = st.map.nodes;
  if (nodes.some((n) => n.sides.some((s) => s.eventId === WEEK_RIVAL_EVENT))) return;
  const column = Math.max(1, Math.ceil(st.map.columns / 2));
  const byOrder = (a: MapNode, b: MapNode) => Math.abs(a.column - column) - Math.abs(b.column - column) || a.column - b.column || a.row - b.row;
  const node = [...nodes].filter((n) => !n.ace).sort(byOrder)[0] ?? nodes[0];
  if (!node) return;
  node.sides.push({ id: `event-rival-week-${node.id}`, kind: 'event', used: false, eventId: WEEK_RIVAL_EVENT });
}

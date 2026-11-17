// Catalog Overhaul NE100, The Road Home: the scene after the final battle, win or lose (NEW_EVENTS_4.md).
// It is never on the map. The run end (GameOverScene) opens it once, as a stop on the node the run ended on, then shows the results.
// Its choices only tell the ending (no rewards), so playing it after the run is over changes nothing that was recorded.
import type { Content } from '../contentSchema';
import type { BattleState, RunState } from '../state';

export const ROAD_HOME = 'ne100-road-home';
/** Run flag: the run ended by losing the final battle (a won run needs no flag: `run.victory`). */
const LOST_FINAL = 'ne100:lost-final';

/** The run was lost in the final battle: the last region's Champion (or its last Gym Leader when no League follows). */
export function noteFinalLoss(run: RunState, battle: Pick<BattleState, 'trainer'>, lastGymEndsRegion: boolean): void {
  const lastRegion = run.regionIndex === run.regionOrder.length - 1;
  const cls = battle.trainer?.classId;
  if (lastRegion && (cls === 'champion' || (cls === 'gym-leader' && lastGymEndsRegion))) run.story.flags[LOST_FINAL] = 1;
}

/** True when the run is over after its final battle (won or lost there) and the Road Home has not played yet. */
export function roadHomeDue(content: Content, run: RunState): boolean {
  if (run.phase !== 'over' || !run.stage || !content.events.has(ROAD_HOME)) return false;
  if (run.itemCounters?.[`event-seen:${ROAD_HOME}`]) return false;
  return run.victory || Number(run.story.flags[LOST_FINAL] ?? 0) > 0;
}

/** Puts the Road Home on the node the run ended on; returns the new run and the stop's id. */
export function openRoadHome(current: RunState): { run: RunState; sideId: string } {
  const run = structuredClone(current);
  const stage = run.stage!;
  const node = stage.map.nodes.find((n) => n.id === stage.current) ?? stage.map.nodes[0]!;
  stage.current ??= node.id; // a stop is played from the node it is on
  const sideId = `road-home-${node.id}`;
  if (!node.sides.some((s) => s.id === sideId)) node.sides.push({ id: sideId, kind: 'event', used: false, eventId: ROAD_HOME });
  return { run, sideId };
}

/** The Road Home's stop: the one event that can be played after the run is over. */
export function isRoadHomeSide(run: RunState, sideId: string): boolean {
  return !!run.stage?.map.nodes.some((n) => n.sides.some((s) => s.id === sideId && s.eventId === ROAD_HOME));
}

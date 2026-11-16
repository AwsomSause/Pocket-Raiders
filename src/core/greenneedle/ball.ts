// Greenneedle gn.new.03, The Ball That Wouldn't Open (doc GREENNEEDLE_PLACED_1.md lines 125–160).
// An old Poké Ball with a strip of tape that says "sorry". It lives in the bag and opens a scene at every rest. Five kindnesses
// (`ball-kind`) and it comes out by itself. A tinker can crack it for ₽200: it bolts, and is met again as a wild Pokémon that can't be caught.
import type { Content, TypeName } from '../contentSchema';
import { TYPE_NAMES } from '../contentSchema';
import type { RunState } from '../state';
import { typesPool } from '../themes';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};

/** Kindnesses it needs before it opens. */
export const BALL_KINDS = 5;
export const BALL_MARK = 'wouldnt-open';
const REST = 'gn-new-03-rest';
const HATCH = 'gn-new-03-hatch';

/** Found: the Pokémon inside is chosen now (from the region's rarer half, so a tinker's forcing and the Ball's own opening agree). */
export function ballFind(content: Content, run: RunState, float: () => number): string {
  if (f(run, 'ball-found') > 0) return '';
  const region = run.regionOrder[run.regionIndex];
  const all = typesPool(content, TYPE_NAMES as readonly TypeName[], region)
    .filter((p) => content.species.has(p.speciesId))
    .sort((a, b) => a.weight - b.weight || a.speciesId.localeCompare(b.speciesId));
  const rarer = all.slice(0, Math.max(1, Math.ceil(all.length / 2)));
  const sp = rarer[Math.min(rarer.length - 1, Math.floor(float() * rarer.length))]?.speciesId ?? 'eevee';
  for (const k of Object.keys(run.story.flags)) if (k.startsWith('ev:cast-ball-mon:')) delete run.story.flags[k];
  run.story.flags[`ev:cast-ball-mon:${sp}`] = 1;
  set(run, 'ball-found', 1);
  set(run, 'ball-kind', 0);
  return '';
}

/** A kindness: `ball-kind` +1 (to 5). */
export function ballKind(run: RunState): string {
  set(run, 'ball-kind', Math.min(BALL_KINDS, f(run, 'ball-kind') + 1));
  return '';
}

/** "Hold it in the next battle": +1 now; after that battle a win is warm and a loss rocks it once (shown at the next rest). */
export function ballHold(run: RunState): string {
  set(run, 'ball-held', 1);
  set(run, 'ball-held-result', 0);
  return ballKind(run);
}

/** Battle finished (run.ts): the held Ball answers. */
export function ballBattle(run: RunState): void {
  const b = run.battle;
  if (!b || f(run, 'ball-held') === 0 || (b.outcome !== 'win' && b.outcome !== 'lose')) return;
  set(run, 'ball-held', 0);
  set(run, 'ball-held-result', b.outcome === 'win' ? 1 : 2);
}

const carried = (run: Pick<RunState, 'story'>): boolean => f(run, 'ball-found') > 0 && f(run, 'ball-gone') === 0;

/** At a rest stop while the Ball is in the bag: its scene opens beside the stop (at five kindnesses, the hatching instead). */
export function ballRest(content: Content, run: RunState): void {
  if (!carried(run)) return;
  const id = f(run, 'ball-kind') >= BALL_KINDS ? HATCH : REST;
  if (!content.events.has(id)) return;
  const here = run.stage?.map.nodes.find((n) => n.id === run.stage!.current);
  if (!here || here.sides.some((s) => s.kind === 'event' && !s.used && (s.eventId === REST || s.eventId === HATCH))) return;
  // What the battle it was held through said: shown at this rest only.
  set(run, 'ball-show', f(run, 'ball-held-result'));
  set(run, 'ball-held-result', 0);
  here.sides.push({ id: `${id}-${here.sides.length + 1}`, kind: 'event', used: false, eventId: id });
}

/** It came out by itself: it's gone from the bag, patience is remembered (gn.51 needs one rest fewer), and it knows what being left is. */
export function ballHatched(run: RunState): string {
  set(run, 'ball-gone', 1);
  set(run, 'ball-out', 1);
  set(run, 'ball-waited', 1);
  set(run, 'abandoned-mon', 1);
  set(run, 'ball-show', 0);
  return '';
}

/** The tinker cracks it: the Pokémon bolts, and will be met again. */
export function ballForce(run: RunState): string {
  set(run, 'ball-gone', 1);
  set(run, 'ball-bolted', 1);
  set(run, 'ball-held-result', 0);
  return '';
}

/** `{ball:held}`: how the Ball answered the battle it was held through. */
export function ballTokens(run: RunState, text: string): string {
  const r = f(run, 'ball-show');
  return text.replaceAll('{ball:held}', r === 1 ? '*Warm.*' : r === 2 ? '*It rocks once.*' : '');
}

/** Trust Earned: no flinching, confusion or infatuation while its trainer has another Pokémon able to battle. */
export function trustHolds(party: readonly { hp: number }[], c: { side: string; mon: { fixedAbility?: string | null; hp: number } }): boolean {
  return c.side === 'player' && c.mon.fixedAbility === 'trust-earned' && party.some((m) => m !== c.mon && m.hp > 0);
}

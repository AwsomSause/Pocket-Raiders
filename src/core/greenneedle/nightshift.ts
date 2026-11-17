// Greenneedle gn.new.24, The Night Shift at the Day-Care (doc GREENNEEDLE_PLACED_2.md lines 143-174).
// "Five waves, each from a different side of the garden. Between waves, the player places two party Pokémon as sentries (north, south, east, west)."
//  - gn op `nsClear`: the sentries leave their posts (before each placing, and when the night ends).
//  - gn op `nsPost` (`n` = side 1 north, 2 south, 3 east, 4 west): the picked party Pokémon stands on that side.
//  - gn op `nsRaid` (`n` = wave 1-5): the wave comes over its side. A sentry that can fight on that side covers it (`ns-cover` 1) and meets the
//    raider first (the mark `ns-lead`, read by the battle rule `leadMark`).
//  The sides are the run's own seeded order: waves 1-4 come from the four sides once each, wave 5 from any side but the fourth wave's.
import type { RunState } from '../state';
import { hashSeed, Rng } from '../rng';

export const NS_POST = 'ns-post';
export const NS_LEAD = 'ns-lead';
export const NS_SIDES = ['', 'north', 'south', 'east', 'west'] as const;
/** How many sentries are placed between waves. */
export const NS_SENTRIES = 2;

const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
const isPost = (t: string): boolean => t.startsWith(`${NS_POST}:`);

/** The side each of the five waves comes from (1-4). Pure: the run's seed only. */
export function nsSides(run: Pick<RunState, 'seed'>): number[] {
  const rng = new Rng(hashSeed(`${run.seed}::night-shift`));
  const order = [1, 2, 3, 4];
  for (let i = order.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return [...order, order[rng.int(0, 2)]!];
}

/** How many sentries are posted now. */
export const nsPosted = (run: Pick<RunState, 'party'>): number => run.party.filter((m) => m.gn?.some(isPost)).length;

export function nsClear(run: RunState): string {
  for (const m of run.party) if (m.gn?.some((t) => isPost(t) || t === NS_LEAD)) m.gn = m.gn.filter((t) => !isPost(t) && t !== NS_LEAD);
  for (const m of run.box) if (m.gn?.some((t) => isPost(t) || t === NS_LEAD)) m.gn = m.gn.filter((t) => !isPost(t) && t !== NS_LEAD);
  set(run, 'ns-posted', 0);
  set(run, 'ns-ready', 0);
  return '';
}

/** The picked Pokémon takes a side. `ns-ready` turns 1 once two stand (or every Pokémon that can, in a smaller party). */
export function nsPost(run: RunState, uid: string | undefined, side: number, nameOf: (speciesId: string) => string): string {
  const mon = run.party.find((m) => m.uid === uid);
  if (!mon || mon.hp <= 0 || side < 1 || side > 4) return '';
  mon.gn = [...(mon.gn ?? []).filter((t) => !isPost(t)), `${NS_POST}:${side}`];
  const posted = nsPosted(run);
  set(run, 'ns-posted', posted);
  set(run, 'ns-ready', posted >= Math.min(NS_SENTRIES, run.party.filter((m) => m.hp > 0).length) ? 1 : 0);
  return `${nameOf(mon.speciesId)} takes the ${NS_SIDES[side]} side.`;
}

/** Wave `k` comes over its side: is a sentry there, and who meets it? */
export function nsRaid(run: RunState, k: number): string {
  const side = nsSides(run)[Math.min(5, Math.max(1, k)) - 1]!;
  for (const m of run.party) if (m.gn?.includes(NS_LEAD)) m.gn = m.gn.filter((t) => t !== NS_LEAD);
  const sentry = run.party.find((m) => m.hp > 0 && m.gn?.includes(`${NS_POST}:${side}`));
  if (sentry) sentry.gn = [...(sentry.gn ?? []), NS_LEAD];
  set(run, 'ns-side', side);
  set(run, 'ns-cover', sentry ? 1 : 0);
  return `It comes over the ${NS_SIDES[side]} fence.`;
}

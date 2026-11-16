// Greenneedle gn.52, The Evil Team's Pokémon Auction (doc GREENNEEDLE_REWORKED_PLACED_11.md lines 289–370).
// Undercover in a masked manor: a disguise (buyer, rival team's agent or caterer) opens different rooms. Six lots, two of them
// traps; three must be won to keep a bidder's cover. The last lot is a rare Pokémon: bought, rescued, or seized in a fight.
import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { RARE } from './allstar';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
const castOf = (run: Pick<RunState, 'story'>, name: string): string | null => {
  const hit = Object.keys(run.story.flags).find((k) => k.startsWith(`ev:cast-${name}:`) && Number(run.story.flags[k]) > 0);
  return hit ? hit.slice(`ev:cast-${name}:`.length) : null;
};
export const BUYER = 1;
export const AGENT = 2;
export const CATERER = 3;
/** Lots won needed to keep a bidder's cover (three of six). */
export const KEEP_COVER = 3;
/** Refusing this many lots in a row, as a rich buyer, draws looks. */
export const LOOKS = 3;
export const AFRAID = 'afraid-rooms:';

/** In through the door: the disguise (1 buyer, 2 agent, 3 caterer), and the rare lot, a kind the region hardly sees. */
export function taStart(content: Content, run: RunState, disguise: number, float: () => number): string {
  for (const k of ['ta-lots', 'ta-streak', 'ta-blown', 'ta-rare', 'ta-alarm']) delete run.story.flags[`ev:${k}`];
  set(run, 'ta-disguise', disguise);
  const here = run.regionOrder[run.regionIndex] ?? '';
  const pool = Object.entries(RARE).filter(([r]) => r !== here).flatMap(([, list]) => list).filter((s) => content.species.has(s));
  const sp = pool[Math.floor(float() * pool.length)] ?? 'eevee';
  for (const k of Object.keys(run.story.flags)) if (k.startsWith('ev:cast-ta-rare:')) delete run.story.flags[k];
  run.story.flags[`ev:cast-ta-rare:${sp}`] = 1;
  return '';
}

/** A lot ends: `won` 1 (you won it) or 0 (you let it go). A buyer who refuses three in a row draws looks: the cover's blown. */
export function taLot(run: RunState, won: number): string {
  if (won > 0) {
    set(run, 'ta-lots', f(run, 'ta-lots') + 1);
    set(run, 'ta-streak', 0);
    return '';
  }
  set(run, 'ta-streak', f(run, 'ta-streak') + 1);
  if (f(run, 'ta-disguise') === BUYER && f(run, 'ta-streak') >= LOOKS && f(run, 'ta-blown') === 0) {
    set(run, 'ta-blown', 1);
    return 'Three lots in a row, and your paddle never moved. Heads turn. A rich buyer who doesn\'t buy is no buyer at all.';
  }
  return '';
}

/** The rare Pokémon is yours (1 bought, 2 rescued, 3 seized when the alarm went up). It's afraid of rooms for one stage. */
export function taRare(run: RunState, how: number, stage: number, host: { apply: (e: unknown) => string }): string {
  const sp = castOf(run, 'ta-rare');
  if (!sp || f(run, 'ta-rare') > 0) return '';
  set(run, 'ta-rare', how);
  return host.apply({ kind: 'join', recall: false, species: [sp], types: [], levelBonus: -2, shinyMultiplier: 1, shadow: false, blissful: false, hiddenAbility: false, moves: [], direct: true, alpha: false, starterType: false, asIs: true, mark: `${AFRAID}${stage}` });
}

/** The night is over: was the cover kept (a File: the ledger), and were both traps avoided? */
export function taEnd(run: RunState, host: { apply: (e: unknown) => string }): string {
  const d = f(run, 'ta-disguise');
  const kept = f(run, 'ta-alarm') === 0 && f(run, 'ta-blown') === 0 && (d === CATERER || f(run, 'ta-lots') >= KEEP_COVER);
  set(run, 'ta-cover', kept ? 1 : 0);
  if (f(run, 'ta-trap-balls') > 0 && f(run, 'ta-trap-egg') > 0) set(run, 'ta-traps', 1);
  set(run, 'ta-done', 1);
  if (!kept) return '';
  host.apply({ kind: 'evil', beat: false, heat: 0, defect: false, mark: 'files' });
  return 'Nobody knows you were there. In your bag: the ledger, with every buyer\'s name in it.';
}

/** At a Pokémon Center that stage: the rescued one waits outside, and isn't healed with the rest. */
export function taRoomsAfraid(content: Content, run: RunState, before: number[], stage: number): string {
  let line = '';
  run.party.forEach((m, i) => {
    if (!m.gn?.includes(`${AFRAID}${stage}`)) return;
    m.hp = before[i] ?? m.hp;
    line = `${content.species.get(m.speciesId)?.name ?? 'It'} won't come inside. It waits by the door, looking at the room the way something looks at weather.`;
  });
  return line;
}

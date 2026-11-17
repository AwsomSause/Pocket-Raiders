// The Fighting Tournament (gn.16): what the ring itself counts. A first-turn hit (the Crowd rises), the move the fighter has used most
// all tournament ("You choose."), and the three calls of the last exchange. Scenes: tools/events/co/greenneedle-4.ts.
import type { Content } from '../contentSchema';
import type { BattleState, PokemonInstance, RunState } from '../state';

type Run = Pick<RunState, 'story'>;
const MOVES_KEY = 'gn:tc-moves';
const FIRST_HIT = 'ev:tc-first-hit';
const CALL = 'ev:tc-call';
const HP0 = 'tc-hp0:';
const TURN_ONE = 'tc-turn-one';
/** The calls of the last exchange (flag `tc-call`). */
export const TC_NOW = 1;
export const TC_WAIT = 2;
export const TC_CHOOSE = 3;

export const inRing = (battle: Pick<BattleState, 'event'> | undefined): boolean => !!battle?.event?.eventId.startsWith('gn-16-');

/** How often each move was used this tournament. */
export function moveTally(run: Run): Record<string, number> {
  const raw = run.story.flags[MOVES_KEY];
  const out: Record<string, number> = {};
  if (typeof raw !== 'string') return out;
  for (const part of raw.split(',')) {
    const [id, n] = part.split(':');
    if (id && Number(n) > 0) out[id] = Number(n);
  }
  return out;
}

/** The move the fighter has used most all tournament that it still knows and can use (ties: the one higher in its list), or -1. */
export function mostUsedMove(run: Run, mon: Pick<PokemonInstance, 'moves'>): number {
  const tally = moveTally(run);
  let best = -1;
  mon.moves.forEach((m, i) => {
    if (m.pp > 0 && (tally[m.id] ?? 0) > 0 && (best < 0 || tally[m.id]! > tally[mon.moves[best]!.id]!)) best = i;
  });
  return best;
}

/** A bout begins. Round one starts the count again; the foe's HP is noted for the first-turn hit; the last exchange answers the call. */
export function tourneyStart(content: Content, run: Run, battle: BattleState, lead: PokemonInstance | undefined, bondThree: number): void {
  if (!inRing(battle)) return;
  if (battle.event!.eventId === 'gn-16-r1') delete run.story.flags[MOVES_KEY];
  run.story.flags[FIRST_HIT] = 0;
  const foe = battle.enemyTeam[0];
  // Round one: the Machop's twin shouts its move a second before it happens. Its opening move (its first attacking move) is decided now and
  // shown before you pick yours, the way the Foe Move Preview lesson shows one (the engine plays `lesson.foeMove` on turn one).
  if (battle.eventRule?.gn === 'twin' && foe && !battle.doubles) {
    const shout = foe.moves.find((m) => m.pp > 0 && (content.moves.get(m.id)?.power ?? 0) > 0) ?? foe.moves.find((m) => m.pp > 0);
    if (shout) (battle.lesson ??= {}).foeMove = shout.id;
  }
  if (battle.eventRule?.gn !== 'lastExchange') {
    if (foe) battle.storyEffects.push(`${HP0}${foe.hp}`);
    return;
  }
  const call = Number(run.story.flags[CALL] ?? 0);
  // "Now!": it goes at once, ahead of the rival, on its first move.
  if (call === TC_NOW && lead) battle.storyEffects.push(`kind:${lead.uid}`);
  // "Wait for it.": it lets the rival come to it. It strikes second, and much harder.
  if (call === TC_WAIT) {
    battle.playerStages.atk = Math.min(6, battle.playerStages.atk + 2);
    battle.playerStages.spe = -6;
  }
  // "You choose.": works at Bond 3 or more. Its first move goes first (and tourneyShape makes it the move it has used most).
  if (call === TC_CHOOSE && lead && lead.friendship >= bondThree) battle.storyEffects.push(`kind:${lead.uid}`);
}

/** Before the player's command is played: the move is counted; under "You choose." the fighter picks its own first move. */
export function tourneyShape(content: Content, run: Run, battle: BattleState, mon: PokemonInstance, index: number, bondThree: number): { index: number; line?: string } {
  if (!inRing(battle) || index < 0) return { index };
  let at = index;
  let line: string | undefined;
  if (battle.eventRule?.gn === 'lastExchange' && Number(run.story.flags[CALL] ?? 0) === TC_CHOOSE && mon.friendship >= bondThree && !battle.storyEffects.includes('tc-chose')) {
    battle.storyEffects.push('tc-chose');
    const own = mostUsedMove(run, mon);
    if (own >= 0) {
      at = own;
      line = `It looks back at you, once. Then it decides for itself: ${content.moves.get(mon.moves[own]!.id)?.name ?? mon.moves[own]!.id}, the one it has thrown all tournament.`;
    }
  }
  const id = mon.moves[at]?.id;
  if (id) {
    const tally = moveTally(run);
    tally[id] = (tally[id] ?? 0) + 1;
    run.story.flags[MOVES_KEY] = Object.entries(tally).map(([k, n]) => `${k}:${n}`).join(',');
  }
  return { index: at, line };
}

/** After each turn: on the first turn of a bout, a foe that has lost HP was hit on turn one (the Crowd rises when the bout is won). */
export function tourneyAfterTurn(run: Run, battle: BattleState): void {
  if (!inRing(battle) || battle.storyEffects.includes(TURN_ONE)) return;
  const noted = battle.storyEffects.find((t) => t.startsWith(HP0));
  if (!noted) return;
  battle.storyEffects.push(TURN_ONE);
  const foe = battle.enemyTeam[0];
  if (foe && foe.hp < Number(noted.slice(HP0.length))) run.story.flags[FIRST_HIT] = 1;
}

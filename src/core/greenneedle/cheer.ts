// Greenneedle gn.new.30, The Cheer Squad (doc GREENNEEDLE_PLACED_2.md lines 347–382).
// A Plusle and a Minun cheer for both sides of a street battle. Once they follow you, in every battle for the rest of the stage:
// Plusle cheers (+5% Attack to your active Pokémon each turn), Minun cheers (+5% Defence). Pure rules; the story lives in the event file.
import type { Content } from '../contentSchema';
import type { BattleState, RunState } from '../state';
import { maxHp } from '../pokemon';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
export const CHEER_TAG = 'gn-cheer';
export const CALL_MARK = 'call-and-response';
const CALL = 'cr-next:';

/** In every battle until the stage's end (the flag `cheer-on` holds the stage number they joined in; `cheer-over` closes it at step 19). */
export function cheerBattleStart(run: RunState, battle: BattleState, stage: number): void {
  if (f(run, 'cheer-on') === stage && f(run, 'cheer-over') === 0) battle.storyEffects.push(CHEER_TAG);
  // They split up: the one left on the road cheers for the rival next time (+5% Attack to the rival's team).
  if (f(run, 'cheer-split') > 0 && f(run, 'cheer-rival-used') === 0 && (battle.rival || battle.rivalId)) {
    run.story.flags['ev:cheer-rival-used'] = 1;
    for (const m of battle.enemyTeam) m.eventBoosts = { ...m.eventBoosts, atk: (m.eventBoosts?.atk ?? 0) + 5 };
  }
}

/** Percent bonus to the active Pokémon's Attack (Plusle) and Defence (Minun) this turn: 0 when they aren't cheering. */
export function cheerPercents(battle: Pick<BattleState, 'storyEffects'>): { atk: number; def: number } {
  return battle.storyEffects.includes(CHEER_TAG) ? { atk: 5, def: 5 } : { atk: 0, def: 0 };
}

/** Turn-end line, once per turn: "Plusle cheers!" "Minun cheers!". */
export function cheerTurn(battle: BattleState, push: (text: string) => void): void {
  if (!battle.storyEffects.includes(CHEER_TAG)) return;
  push('Plusle cheers! Minun cheers! A leaf pom-pom shakes at each side of the field.');
}

/** Call and Response (a double battle, both of them with you): after one uses a status move, the other's next move gains +1 priority. Once per turn. */
export function callNote(battle: BattleState, user: { uid: string; marks?: string[] }, partner: { uid: string; marks?: string[] } | undefined, isStatus: boolean): void {
  if (!isStatus || !partner || !user.marks?.includes(CALL_MARK) || !partner.marks?.includes(CALL_MARK)) return;
  const next = battle.turn + 1;
  const tag = `${CALL}${partner.uid}:${next}`;
  battle.storyEffects = battle.storyEffects.filter((t) => !t.startsWith(CALL) || Number(t.split(':').pop()) >= battle.turn);
  if (battle.storyEffects.some((t) => t.startsWith(CALL) && t.endsWith(`:${next}`) && t.includes(`:${partner.uid}:`))) return;
  battle.storyEffects.push(tag);
}

/** +1 priority for this Pokémon this turn (the tag is keyed to the turn, so it lapses by itself). */
export function callPriority(battle: BattleState, uid: string): number {
  return battle.storyEffects.includes(`${CALL}${uid}:${battle.turn}`) ? 1 : 0;
}

/** The ending (step 19): who joins. `n`: 1 Plusle, 2 Minun, 3 both (Call and Response when both). */
export function cheerJoin(content: Content, run: RunState, n: number, host: { apply: (e: unknown) => string }): string {
  if (f(run, 'cheer-over') > 0) return '';
  run.story.flags['ev:cheer-over'] = 1;
  const species = n === 1 ? ['plusle'] : n === 2 ? ['minun'] : ['plusle', 'minun'];
  const words: string[] = [];
  for (const id of species) {
    const before = new Set([...run.party, ...run.box].map((m) => m.uid));
    words.push(host.apply({ kind: 'join', recall: false, species: [id], types: [], levelBonus: 0, shinyMultiplier: 1, shadow: false, blissful: false, hiddenAbility: false, moves: [], direct: true, alpha: false, starterType: false, asIs: true }));
    const mon = [...run.party, ...run.box].find((m) => !before.has(m.uid) && m.speciesId === id);
    if (mon) {
      mon.marks = [...new Set([...(mon.marks ?? []), 'cheer-squad', ...(species.length === 2 ? [CALL_MARK] : [])])].slice(0, 8);
      mon.hp = maxHp(content, mon);
    }
  }
  return words.filter(Boolean).join(' ');
}

// Greenneedle gn.new.05, The Egg That Listened (doc GREENNEEDLE_PLACED_1.md lines 196-227; hatch scene SF122).
// A day-care egg is carried for a region. At each rest one word appears over it, drawn from the stage just played; at the hatch its nature
// comes from the words and it knows the move the player used most that region (or the nearest of that type). Pure rules: no RNG.
// State is run flags (`ev:egg-*`), like the other Greenneedle events: no save change.
//  - carry:    `ev:egg-carry` is 1 while the egg is on the way; `ev:egg-listen:<uid>` marks which egg it is.
//  - counters: `ev:egg-mv:<move>` (this stage) and `ev:egg-rmv:<move>` (this region) count the moves used; `ev:egg-n-<word>` count the stage.
//  - words:    `ev:egg-w-<word>` (the words so far this region), `ev:egg-word` (0..5: the last one, in WORDS order).
//  - shape:    the hatchling's shape flags (`ev:egg-shape:<uid>:listened-...`), read by daycare.ts shapeHatchling when it hatches.
import type { Content } from '../contentSchema';
import type { PlayerAction } from '../battle/engine';
import type { Egg, PokemonInstance, RunState } from '../state';
import { effectiveAttributes } from '../attributes';
import { maxHp } from '../pokemon';

/** In the doc's table order (a tie goes to the earlier one). */
export const WORDS = ['again', 'careful', 'loud', 'soft', 'far', 'quick'] as const;
export type Word = (typeof WORDS)[number];

const k = (key: string): string => `ev:${key}`;
const get = (run: Pick<RunState, 'story'>, key: string): number => Number(run.story.flags[k(key)] ?? 0);
const put = (run: Pick<RunState, 'story'>, key: string, n: number): void => {
  run.story.flags[k(key)] = n;
};
const bump = (run: Pick<RunState, 'story'>, key: string, n = 1): void => put(run, key, get(run, key) + n);
const clear = (run: Pick<RunState, 'story'>, prefix: string): void => {
  for (const key of Object.keys(run.story.flags)) if (key.startsWith(k(prefix))) delete run.story.flags[key];
};

/** Whether the egg is being carried. */
export const carrying = (run: Pick<RunState, 'story'>): boolean => get(run, 'egg-carry') > 0;

/** The egg that listens (still unhatched). */
export function listenedEgg(run: Pick<RunState, 'story' | 'eggs'>): Egg | undefined {
  return run.eggs.find((e) => get(run, `egg-listen:${e.uid}`) > 0);
}

/** gn op `eggTake`: the newest egg is the one that listens. A fresh region starts with fresh counts. */
export function listenedTake(content: Content, run: RunState): string {
  const egg = run.eggs[run.eggs.length - 1];
  if (!egg) return '';
  clear(run, 'egg-listen:');
  clear(run, 'egg-mv:');
  clear(run, 'egg-rmv:');
  clear(run, 'egg-n-');
  clear(run, 'egg-w-');
  put(run, 'egg-listen:' + egg.uid, 1);
  put(run, 'egg-carry', 1);
  put(run, 'egg-word', 0);
  put(run, 'egg-kind-base', Math.round(effectiveAttributes(content, run).goodEvil ?? 0));
  // It hatches in the region's eighth stage unless a warm Pokémon hurries it; the hatch scene (listenedHatch) sets the last step.
  egg.left = 9;
  egg.total = 9;
  egg.unit = 'stage';
  return '';
}

// ---------- what the player does, counted while the egg is along ----------

/** Before the player's command is played: a move used, a hurt Pokémon switched out, a hurt Pokémon left in. */
export function listenedTurn(content: Content, run: RunState, action: PlayerAction): void {
  if (!carrying(run) || !run.battle) return;
  const active = run.party[run.battle.activeIndex];
  if (!active || active.hp <= 0) return;
  const frac = active.hp / Math.max(1, maxHp(content, active));
  if (action.kind === 'move') {
    const id = active.moves[action.index]?.id;
    if (id) {
      bump(run, `egg-mv:${id}`);
      bump(run, `egg-rmv:${id}`);
    }
    if (frac < 0.4) bump(run, 'egg-n-loud');
  } else if (action.kind === 'switch' && !run.battle.needsSwitch && frac < 0.5) bump(run, 'egg-n-careful');
}

/** After a won fight: a quick one (three turns or fewer). */
export function listenedWin(run: RunState): void {
  if (carrying(run) && run.battle?.outcome === 'win' && run.battle.turn <= 3) bump(run, 'egg-n-quick');
}

/** Leaving a node: every person (an event stop) not spoken to counts as one walked past. */
export function listenedPass(run: RunState, sidesLeft: { kind: string; used: boolean; eventId?: string }[]): void {
  if (!carrying(run)) return;
  const n = sidesLeft.filter((s) => s.kind === 'event' && !s.used && s.eventId && !s.eventId.startsWith('gn-new-05')).length;
  if (n > 0) bump(run, 'egg-n-far', Math.min(2, n));
}

// ---------- the word, at a rest ----------

/** The scores for the six words from this stage's counts. */
export function scores(content: Content, run: RunState): Record<Word, number> {
  const moves = Object.keys(run.story.flags).filter((key) => key.startsWith(k('egg-mv:'))).map((key) => Number(run.story.flags[key] ?? 0)).sort((a, b) => b - a);
  const top = moves[0] ?? 0;
  const second = moves[1] ?? 0;
  const kind = Math.max(0, Math.round(effectiveAttributes(content, run).goodEvil ?? 0) - get(run, 'egg-kind-base'));
  return {
    again: top >= 4 && top >= 2 * second ? 3 : 0,
    careful: get(run, 'egg-n-careful'),
    loud: get(run, 'egg-n-loud'),
    soft: kind,
    far: get(run, 'egg-n-far'),
    quick: get(run, 'egg-n-quick'),
  };
}

/** gn op `eggWord`: the word over the egg this rest (flag `egg-word`, an index into WORDS). With nothing to go on, it hears *soft*. */
export function listenedWord(content: Content, run: RunState): Word {
  const s = scores(content, run);
  const best = WORDS.reduce<Word>((a, w) => (s[w] > s[a] ? w : a), WORDS[0]);
  const word: Word = s[best] > 0 ? best : 'soft';
  put(run, 'egg-word', WORDS.indexOf(word));
  bump(run, `egg-w-${word}`);
  clear(run, 'egg-mv:');
  clear(run, 'egg-n-');
  put(run, 'egg-kind-base', Math.round(effectiveAttributes(content, run).goodEvil ?? 0));
  shapeEgg(content, run);
  return word;
}

// ---------- the hatchling ----------

/** The nature the words add up to: mostly *loud* or *quick* is bold or hasty, mostly *careful* or *soft* is calm or gentle, else none. */
export function natureOf(run: Pick<RunState, 'story'>): string | null {
  const w = (word: Word): number => get(run, `egg-w-${word}`);
  const rough = w('loud') + w('quick');
  const mild = w('careful') + w('soft');
  if (rough === mild) return null;
  if (rough > mild) return w('loud') >= w('quick') ? 'bold' : 'hasty';
  return w('careful') >= w('soft') ? 'calm' : 'gentle';
}

/** The move the player used most this region. */
export const favouriteMove = (run: Pick<RunState, 'story'>): string | null => {
  const [best] = Object.keys(run.story.flags)
    .filter((key) => key.startsWith(k('egg-rmv:')))
    .map((key) => [key.slice(k('egg-rmv:').length), Number(run.story.flags[key] ?? 0)] as const)
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  return best?.[0] ?? null;
};

/** The move it can have: the favourite if its species can legally learn it, else the one of the same type nearest in power it can. */
export function legalMove(content: Content, speciesId: string, moveId: string): string | null {
  const species = content.species.get(speciesId);
  const move = content.moves.get(moveId);
  if (!species || !move) return null;
  const can = new Set<string>([...species.learnset.map((l) => l.move), ...(content.learnables.get(species.id) ?? [])]);
  const usable = (id: string): boolean => !!content.moves.get(id)?.supported;
  if (can.has(moveId) && usable(moveId)) return moveId;
  const near = [...can]
    .filter((id) => usable(id) && content.moves.get(id)!.type === move.type)
    .sort((a, b) => Math.abs((content.moves.get(a)!.power ?? 0) - (move.power ?? 0)) - Math.abs((content.moves.get(b)!.power ?? 0) - (move.power ?? 0)) || (a < b ? -1 : 1));
  return near[0] ?? null;
}

const SHAPE = 'listened-';
/** Writes the hatchling's shape flags (nature, move) from what has been heard so far. Called at each rest and at the hatch, so a hurried egg is shaped too. */
export function shapeEgg(content: Content, run: RunState): void {
  const egg = listenedEgg(run);
  if (!egg) return;
  clear(run, `egg-shape:${egg.uid}:${SHAPE}`);
  const nature = natureOf(run);
  if (nature) put(run, `egg-shape:${egg.uid}:${SHAPE}nature-${nature}`, 1);
  const fav = favouriteMove(run);
  const move = fav ? legalMove(content, egg.speciesId, fav) : null;
  if (move) put(run, `egg-shape:${egg.uid}:${SHAPE}move-${move}`, 1);
  put(run, `egg-shape:${egg.uid}:${SHAPE}friendly`, 1);
}

/** gn op `eggHatch` (the hatch scene): the egg is ready (it hatches as this stage ends); `talk` adds the voice it knew. */
export function listenedHatch(content: Content, run: RunState, talked: boolean): string {
  const egg = listenedEgg(run);
  if (!egg) return '';
  shapeEgg(content, run);
  if (talked) put(run, `egg-shape:${egg.uid}:${SHAPE}voice`, 1);
  egg.left = Math.min(egg.left, 1);
  put(run, 'egg-listened-hatched', 1);
  put(run, 'egg-carry', 0);
  return '';
}

/** Applied by daycare.ts shapeHatchling to the hatchling: the nature, the move, the Bond. */
export function listenedShape(content: Content, mon: PokemonInstance, shape: string, friendlyAt: (level: number) => number, teach: (moveId: string) => void, mark: (text: string) => void): void {
  if (!shape.startsWith(SHAPE)) return;
  const what = shape.slice(SHAPE.length);
  if (what.startsWith('nature-')) mon.nature = what.slice('nature-'.length) as PokemonInstance['nature'];
  else if (what.startsWith('move-')) teach(what.slice('move-'.length));
  else if (what === 'friendly') mon.friendship = Math.max(mon.friendship, friendlyAt(3));
  else if (what === 'voice') {
    mon.friendship = Math.min(content.balance.friendship.max, mon.friendship + 2 * content.balance.co.bondFriendship);
    mark('hatched knowing your voice');
  }
}

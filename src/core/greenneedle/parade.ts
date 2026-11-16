// Greenneedle gn.new.11, The Night Parade (doc GREENNEEDLE_PLACED_1.md lines 412–449): the Spirit Market at the end of the line.
// Six actions before the lanterns burn down. Stalls trade a move for a move, a memory for a Rare item, a nickname for a secret, an egg move
// for a known move. Staying past six: wake at the next step with one item swapped for another of the same tier. No random numbers except
// the item swap, which takes the stop's own seeded roll.
import type { Content } from '../contentSchema';
import type { PokemonInstance, RunState } from '../state';
import { addItem } from '../items';
import { eggMoveOptions, familyId, teachEggMove } from '../mastery';

const name = (content: Content, mon: PokemonInstance): string => mon.care?.nickname || (content.species.get(mon.speciesId)?.name ?? mon.speciesId);
const lead = (run: RunState): PokemonInstance | undefined => run.party.find((m) => m.hp > 0);
const nicknamed = (run: RunState): PokemonInstance | undefined => run.party.find((m) => !!m.care?.nickname);
const eggId = (content: Content, mon: PokemonInstance): string | undefined => eggMoveOptions(content, familyId(content, mon.speciesId)).find((o) => o.active && !mon.moves.some((m) => m.id === o.id))?.id;

/** The Sableye can erase a line only if the Notebook has one. */
export const paradeMemory = (run: RunState): boolean => run.story.chronicle.length > 0;
/** The Mismagius wants a nickname. */
export const paradeNickname = (run: RunState): boolean => !!nicknamed(run);
/** The Old Dusclops needs a Pokémon with a move to give and an egg move to take. */
export const paradeEggReady = (content: Content, run: RunState): boolean => {
  const l = lead(run);
  return !!l && l.moves.length > 1 && !!eggId(content, l);
};
/** The last region, and a parade joined in every region played so far (this one included). */
export const paradeAll = (run: RunState, joined: number): boolean => run.regionIndex + 1 >= run.regionOrder.length && joined >= run.regionIndex + 1;

/** The lead gives up its last move (never its only one). */
function giveUp(content: Content, run: RunState): string {
  const l = lead(run);
  if (!l || l.moves.length < 2) return '';
  const gone = l.moves.pop()!;
  return `${name(content, l)} hands over ${content.moves.get(gone.id)?.name ?? gone.id}.`;
}

/** Banette: the lead gives up its last move and learns `move`. */
export function paradeSwap(content: Content, run: RunState, move: string): string {
  const l = lead(run);
  const def = content.moves.get(move);
  if (!l || !def || l.moves.some((m) => m.id === move)) return '';
  const gave = l.moves.length >= 4 ? giveUp(content, run) : '';
  l.moves.push({ id: move, pp: def.pp });
  return `${gave} ${name(content, l)} learned ${def.name}!`.trim();
}

/** Dusclops: the lead gives up its last move and learns one of its egg moves. */
export function paradeEgg(content: Content, run: RunState): string {
  const l = lead(run);
  const id = l && eggId(content, l);
  if (!l || !id) return '';
  const gave = giveUp(content, run);
  if (!teachEggMove(content, l, id, [])) return gave;
  return `${gave} ${name(content, l)} learned the egg move ${content.moves.get(id)!.name}!`.trim();
}

/** Sableye: the least memorable Notebook line is erased. */
export function paradeForget(run: RunState): string {
  const list = run.story.chronicle;
  if (!list.length) return '';
  let at = 0;
  list.forEach((c, i) => { if (c.importance < list[at]!.importance) at = i; });
  const [gone] = list.splice(at, 1);
  return `The Notebook line is gone: "${gone!.text}"`;
}

/** Mismagius: a nickname is given up, and one hidden node on this stage shows what it is. */
export function paradeSecret(content: Content, run: RunState): string {
  const mon = nicknamed(run);
  if (!mon) return '';
  const old = mon.care!.nickname!;
  delete mon.care!.nickname;
  for (const n of run.stage?.map.nodes ?? []) {
    const side = n.sides.find((s) => s.hidden);
    if (side) {
      delete side.hidden;
      return `${name(content, mon)} is not ${old} any more. One "?" on the map now says what it is.`;
    }
  }
  return `${name(content, mon)} is not ${old} any more. The Mismagius whispers that there was nothing left to hide here.`;
}

/** Staying past six: one item in the Bag is swapped for another of the same tier (`roll` is the stop's seeded float). */
export function paradeWake(content: Content, run: RunState, roll: number): string {
  const owned = Object.keys(run.inventory).filter((id) => (run.inventory[id] ?? 0) > 0 && content.catalog.get(id)?.rarity).sort();
  if (!owned.length) return '';
  const from = owned[Math.min(owned.length - 1, Math.floor(roll * owned.length))]!;
  const tier = content.catalog.get(from)!.rarity;
  const pool = [...content.catalog.values()].filter((c) => c.rarity === tier && c.status === 'supported' && c.id !== from && !(run.inventory[c.id] ?? 0)).map((c) => c.id).sort();
  if (!pool.length) return '';
  const to = pool[Math.min(pool.length - 1, Math.floor((roll * 997) % 1 * pool.length))]!;
  run.inventory[from] = (run.inventory[from] ?? 1) - 1;
  if (run.inventory[from] === 0) delete run.inventory[from];
  addItem(run.inventory, to, 1);
  return `Your ${content.catalog.get(from)!.name} is gone. In its place, a ${content.catalog.get(to)!.name}.`;
}

// Greenneedle gn.new.11, The Night Parade (doc GREENNEEDLE_PLACED_1.md lines 412–449): the Spirit Market at the end of the line.
// Six actions before the lanterns burn down. Stalls trade a move for a move, a memory for a Rare item, a nickname for a secret, an egg move
// for a known move. Staying past six: wake at the next step with one item swapped for another of the same tier. No random numbers except
// the item swap, which takes the stop's own seeded roll.
import type { Content } from '../contentSchema';
import type { PokemonInstance, RunState } from '../state';
import { addItem } from '../items';
import { eggMoveOptions, familyId } from '../mastery';
import { getSpecies, isUsableMove } from '../pokemon';

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
  return !!l && l.moves.length >= 4 && !!eggId(content, l);
};
/** The last region, and a parade joined in every region played so far (this one included). */
export const paradeAll = (run: RunState, joined: number): boolean => run.regionIndex + 1 >= run.regionOrder.length && joined >= run.regionIndex + 1;

/** The Banette and the Dusclops trade a move for a move: the lead must have a full hand of four, so one is given for the one taken. */
export const paradeMoveReady = (run: RunState): boolean => (lead(run)?.moves.length ?? 0) >= 4;

function shuffled<T>(items: T[], float: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(float() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** The three moves on the Banette's cloth: one the lead's own line can learn, one Ghost, one Dark, dealt by the stop's seeded stream. */
export function banetteCloth(content: Content, mon: PokemonInstance, float: () => number): string[] {
  const known = new Set(mon.moves.map((m) => m.id));
  const usable = (id: string): boolean => !known.has(id) && isUsableMove(content, id);
  const own = [...new Set(getSpecies(content, mon.speciesId).learnset.map((x) => x.move))].filter(usable).sort();
  const of = (type: string): string[] => [...content.moves.values()].filter((mv) => mv.type === type && usable(mv.id)).map((mv) => mv.id).sort();
  const cloth: string[] = [];
  for (const pool of [shuffled(own, float), shuffled(of('ghost'), float), shuffled(of('dark'), float)]) {
    const id = pool.find((x) => !cloth.includes(x));
    if (id) cloth.push(id);
  }
  // A lead with nothing left to learn of its own: a second Ghost or Dark move fills the cloth.
  for (const id of shuffled([...of('ghost'), ...of('dark')], float)) if (cloth.length < 3 && !cloth.includes(id)) cloth.push(id);
  return cloth;
}

/** Banette: three moves are shown; the player takes one and chooses which of the lead's moves goes to the cloth (the game's own "teach a move" choice). */
export function paradeSwap(content: Content, run: RunState, float: () => number): string {
  const l = lead(run);
  if (!l || !paradeMoveReady(run)) return '';
  const moveIds = banetteCloth(content, l, float);
  if (moveIds.length === 0) return '';
  run.pending.push({ kind: 'teachMove', uid: l.uid, itemName: 'Banette\'s cloth', moveIds });
  return `On the cloth: ${moveIds.map((id) => content.moves.get(id)!.name).join(', ')}.`;
}

/** The egg moves the Old Dusclops can teach `mon`: every one its line has that it does not know yet. */
export const dusclopsLessons = (content: Content, mon: PokemonInstance): string[] =>
  eggMoveOptions(content, familyId(content, mon.speciesId)).filter((o) => o.active && !mon.moves.some((m) => m.id === o.id)).map((o) => o.id);

/** Dusclops: any one egg move of the player's choice, for a move the lead already knows (the player chooses that one too). */
export function paradeEgg(content: Content, run: RunState): string {
  const l = lead(run);
  if (!l || !paradeEggReady(content, run)) return '';
  run.pending.push({ kind: 'teachMove', uid: l.uid, itemName: 'Dusclops\'s lesson', moveIds: dusclopsLessons(content, l) });
  return '';
}

/** Sableye: "a Rare item", drawn from every rare item of the catalog by the stop's seeded roll (never an event-only gift). */
export function paradeRare(content: Content, run: RunState, roll: number): string {
  const pool = [...content.catalog.values()].filter((c) => c.rarity === 'rare' && c.status === 'supported' && !c.giftOnly).map((c) => c.id).sort();
  if (!pool.length) return '';
  const id = pool[Math.min(pool.length - 1, Math.floor(roll * pool.length))]!;
  addItem(run.inventory, id, 1);
  return `The Sableye holds out a ${content.catalog.get(id)!.name}.`;
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

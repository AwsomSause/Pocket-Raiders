// Catalog Overhaul new events (NE39 Swap Day): you and the main rival trade teams for the rest of a stage ("all"), or one
// Pokémon each ("one"). Your own Pokémon wait in the PC, untouched; theirs fight for you at your levels. Everything goes back
// at the hand-back scene, and in any case before a Gym Leader, Elite Four or Champion fight and when a new stage starts.
// State lives in two run flags (string lists of uids), like the rival questlines' R7 borrow, so the save format is unchanged.
import type { Content } from '../contentSchema';
import { createPokemon } from '../pokemon';
import { rivalFightTeam } from '../rivals/living';
import { mainRival } from '../rivals/questlines';
import type { PokemonInstance, RunState } from '../state';

const KEPT = 'ev-swap:kept';
const BORROWED = 'ev-swap:borrowed';
/** Set (1) when one of the rival's Pokémon fainted while it was in your care (NE39's Remembers: Trust −1 instead of +2). */
export const SWAP_FAINTED = 'ev:swap-fainted';

const list = (run: RunState, key: string): string[] => {
  const v = run.story.flags[key];
  return typeof v === 'string' && v ? v.split(',') : [];
};

export const swapRunning = (run: RunState): boolean => list(run, BORROWED).length > 0;

/** The rival's roster you would get (species ids), or [] when the rival has none to lend yet. */
export function swapRoster(content: Content, run: RunState): string[] {
  const rival = mainRival(run);
  if (!rival) return [];
  const fought = rivalFightTeam(content, rival);
  return (fought.length > 0 ? fought : Object.keys(rival.bonds).filter((id) => content.species.has(id))).slice(0, 6);
}

/** A swap can start: the rival has a team to lend, nothing is swapped already, and you have a Pokémon able to fight. */
export const swapReady = (content: Content, run: RunState): boolean => !swapRunning(run) && swapRoster(content, run).length > 0 && run.party.some((m) => m.hp > 0);

/** Start the swap. `pickedUid` is the Pokémon you lend in "one" mode (the lead when none was picked). */
export function beginSwap(content: Content, run: RunState, mode: 'all' | 'one', pickedUid?: string): string {
  if (!swapReady(content, run)) return '';
  const roster = swapRoster(content, run);
  const lent: PokemonInstance[] = mode === 'all' ? [...run.party] : [run.party.find((m) => m.uid === pickedUid) ?? run.party.find((m) => m.hp > 0)!];
  const avg = Math.max(1, Math.round(run.party.reduce((n, m) => n + m.level, 0) / run.party.length));
  const species = mode === 'all' ? roster : [roster[0]!];
  const borrowed = species.map((id, i) => {
    const mon = createPokemon(content, id, lent[i]?.level ?? avg, `swap-${run.stage?.index ?? 0}-${i}-${id}`);
    mon.ot = mainRival(run)?.name ?? mon.ot;
    return mon;
  });
  const lentUids = new Set(lent.map((m) => m.uid));
  const at = run.party.findIndex((m) => lentUids.has(m.uid));
  const rest = run.party.filter((m) => !lentUids.has(m.uid));
  run.party = mode === 'all' ? borrowed : [...rest.slice(0, at), ...borrowed, ...rest.slice(at)];
  run.box = [...(run.box ?? []), ...lent];
  run.story.flags[KEPT] = lent.map((m) => m.uid).join(',');
  run.story.flags[BORROWED] = borrowed.map((m) => m.uid).join(',');
  delete run.story.flags[SWAP_FAINTED];
  return mode === 'all' ? 'you and your rival trade teams' : 'you and your rival trade one Pokémon each';
}

/** After a battle: note when one of the rival's Pokémon fainted in your care. */
export function noteSwapFaint(run: RunState): void {
  const borrowed = new Set(list(run, BORROWED));
  if (borrowed.size > 0 && run.party.some((m) => borrowed.has(m.uid) && m.hp <= 0)) run.story.flags[SWAP_FAINTED] = 1;
}

/** Hand everything back: the rival's Pokémon leave, yours come out of the PC in their places (extras you caught go to the PC). */
export function endSwap(content: Content, run: RunState, partyMax: number): string {
  const kept = list(run, KEPT);
  const borrowed = new Set(list(run, BORROWED));
  if (borrowed.size === 0 && kept.length === 0) return '';
  const mine = kept.map((uid) => run.box.find((m) => m.uid === uid)).filter((m): m is PokemonInstance => !!m);
  const keptSet = new Set(kept);
  run.box = run.box.filter((m) => !keptSet.has(m.uid));
  // Each of yours goes back into the place of one of theirs; any left over join at the end.
  const queue = [...mine];
  const party: PokemonInstance[] = [];
  for (const m of run.party) {
    if (!borrowed.has(m.uid)) party.push(m);
    else if (queue.length > 0) party.push(queue.shift()!);
  }
  party.push(...queue);
  run.party = party.slice(0, partyMax);
  run.box = [...run.box, ...party.slice(partyMax)];
  delete run.story.flags[KEPT];
  delete run.story.flags[BORROWED];
  return 'the teams go back to their trainers';
}

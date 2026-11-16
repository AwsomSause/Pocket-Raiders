// Greenneedle gn.new.09, The Last Stop (doc GREENNEEDLE_PLACED_1.md lines 340–381).
// A night train with three carriages. The dining car's Gengar taps one of the lead's moves and fans three face-up cards: a straight trade.
// The sleeper hides a Litwick, a Yamask's mask or the player's own folded coat. The mail car holds a letter for one party Pokémon.
// The conductor's ticket carries a date a few stages ahead; on that stage the platform comes back (events: tools/events/co/greenneedle-new-09.ts).
import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { getSpecies, isUsableMove } from '../pokemon';

const k = (name: string): string => `ev:${name}`;
const setCast = (run: RunState, name: string, id: string): void => {
  const prefix = `${k(`cast-${name}`)}:`;
  for (const key of Object.keys(run.story.flags)) if (key.startsWith(prefix)) run.story.flags[key] = 0;
  run.story.flags[`${prefix}${id}`] = 1;
};
const lead = (run: RunState) => run.party.find((m) => m.hp > 0) ?? run.party[0];

/** The mark on the Pokémon whose move is staked. */
export const LS_MARK = 'ls-lead';
/** The ticket's date is this many stages ahead of the night the player boarded. */
export const TICKET_AHEAD = 5;

/** The shuffle uses the event stop's own seeded stream (`float`), so a reload deals the same cards. */
function shuffled<T>(items: T[], float: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(float() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** The Gengar taps one of the lead's moves (the stake) and fans three moves it does not know: its own line's first, then ghosts, then anything usable. */
export function lsDeal(content: Content, run: RunState, float: () => number): string {
  const mon = lead(run);
  if (!mon || mon.moves.length === 0) return '';
  for (const m of run.party) if (m.gn) m.gn = m.gn.filter((t) => t !== LS_MARK);
  mon.gn = [...(mon.gn ?? []), LS_MARK];
  const known = new Set(mon.moves.map((m) => m.id));
  const stake = mon.moves[Math.floor(float() * mon.moves.length)]!.id;
  setCast(run, 'ls-stake', stake);
  const usable = (id: string): boolean => !known.has(id) && isUsableMove(content, id);
  const own = getSpecies(content, mon.speciesId).learnset.map((x) => x.move).filter(usable);
  const ghost = [...content.moves.values()].filter((mv) => mv.type === 'ghost' && usable(mv.id)).map((mv) => mv.id).sort();
  const rest = [...content.moves.values()].filter((mv) => (mv.power ?? 0) >= 50 && usable(mv.id)).map((mv) => mv.id).sort();
  const cards: string[] = [];
  for (const pool of [shuffled([...new Set(own)], float), shuffled(ghost, float), shuffled(rest, float)]) {
    for (const id of pool) if (cards.length < 3 && !cards.includes(id) && id !== stake) cards.push(id);
  }
  cards.forEach((id, i) => setCast(run, `ls-card-${i + 1}`, id));
  return '';
}

/** The trade: the staked move becomes card `n` (1-3). A Pokémon already holding it keeps the slot. */
export function lsTake(content: Content, run: RunState, n: number): string {
  const mon = run.party.find((m) => m.gn?.includes(LS_MARK));
  const name = (id: string): string => content.moves.get(id)?.name ?? id;
  const pick = (() => {
    const prefix = `${k(`cast-ls-card-${n}`)}:`;
    const hit = Object.keys(run.story.flags).find((x) => x.startsWith(prefix) && Number(run.story.flags[x]) > 0);
    return hit?.slice(prefix.length);
  })();
  const stakePrefix = `${k('cast-ls-stake')}:`;
  const staked = Object.keys(run.story.flags).find((x) => x.startsWith(stakePrefix) && Number(run.story.flags[x]) > 0)?.slice(stakePrefix.length);
  if (!mon || !pick || !staked || !content.moves.has(pick)) return '';
  mon.gn = (mon.gn ?? []).filter((t) => t !== LS_MARK);
  const slot = mon.moves.findIndex((m) => m.id === staked);
  if (slot < 0 || mon.moves.some((m) => m.id === pick)) return '';
  mon.moves[slot] = { id: pick, pp: content.moves.get(pick)!.pp };
  return `${getSpecies(content, mon.speciesId).name} traded ${name(staked)} for ${name(pick)}`;
}

/** The ticket's date, as an absolute stage number (`ls-date`; read with the `sameStage` condition). */
export const lsTicket = (run: RunState, stage: number): void => {
  run.story.flags[k('ls-date')] = stage + TICKET_AHEAD;
};

/** The letter is addressed to the lead; its species is cast as `ls-letter` for the text. */
export function lsAddress(run: RunState): void {
  const mon = lead(run);
  if (mon) setCast(run, 'ls-letter', mon.speciesId);
}

// Beta 0.7: the Saffron Fighting Tournament bracket (Kice's spec 16). Pure and deterministic: the 31 other entrants are named from the run seed with a hash
// of their own (no gameplay stream is touched), so the same run always shows the same bracket. Presentation only: the fights themselves are the events'.

import type { Content } from '../contentSchema';
import { fnv1a } from './hash';
import type { RunState } from '../state';

export const TOURNEY_ROUNDS = ['Round of 32', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Final'] as const;

export interface TourneyEntrant {
  /** Display name: "Machop" for the named competitors, "Mina's Riolu" for the field. */
  name: string;
  species: string;
  you: boolean;
  /** One of the recurring competitors (Machop, Hawlucha, Throh, Hitmonchan) or the rival. */
  named: boolean;
  /** The round (1 to 5) this entrant lost in, or 0 while still in. Only rounds before `now` are filled in. */
  outIn: number;
}
export interface TourneyView {
  /** 0 = sign-up, 1 to 5 = that round is next, 6 = the champion. */
  now: number;
  /** Entrants of round 1 in bracket order (32). */
  entrants: TourneyEntrant[];
  /** Who is left at the start of each round (32, 16, 8, 4, 2) plus the champion (1). */
  survivors: TourneyEntrant[][];
  /** The player's opponent in each round, or null when this round is not decided yet. */
  opponents: (TourneyEntrant | null)[];
}

const NAMED = [
  { slot: 1, species: 'machop' }, { slot: 2, species: 'hawlucha' }, { slot: 4, species: 'throh' }, { slot: 8, species: 'hitmonchan' },
] as const;
const FIELD = ['riolu', 'tyrogue', 'meditite', 'timburr', 'makuhita', 'croagunk', 'pancham', 'mienfoo', 'sawk', 'hitmonlee', 'hitmontop', 'scraggy', 'machoke', 'passimian', 'falinks', 'medicham', 'poliwrath', 'primeape', 'mankey', 'machop', 'conkeldurr', 'hariyama', 'lucario', 'toxicroak'];
const OWNERS = ['Mina', 'Ken', 'Aoi', 'Dax', 'Ruth', 'Taro', 'Hana', 'Beck', 'Lia', 'Oren', 'Sumi', 'Joss', 'Pia', 'Rex', 'Yuki', 'Cole', 'Nell', 'Iwao', 'Tess', 'Bram', 'Kai', 'Elsa', 'Gus', 'Wren', 'Hugo', 'Isla', 'Moe', 'Vik', 'Zara', 'Otis', 'Fay'];

/** The bracket as it stands when the player is at `now` (0 = sign-up, 1 to 5 = about to fight that round, 6 = champion). */
export function tourneyBracket(content: Content, run: Pick<RunState, 'seed' | 'party'>, now: number): TourneyView {
  const mine = run.party.find((m) => m.speciesId === 'mankey' || m.speciesId === 'primeape') ?? run.party[0];
  const youSpecies = mine?.speciesId ?? 'mankey';
  const nameOf = (id: string): string => content.species.get(id)?.name ?? id;
  const pickH = (tag: string): number => fnv1a(`${run.seed}::tourney::${tag}`);
  const entrants: TourneyEntrant[] = [];
  const field = FIELD.filter((id) => content.species.has(id));
  for (let i = 0; i < 32; i++) {
    const named = NAMED.find((n) => n.slot === i);
    if (i === 0) entrants.push({ name: nameOf(youSpecies), species: youSpecies, you: true, named: false, outIn: 0 });
    else if (named) entrants.push({ name: nameOf(named.species), species: named.species, you: false, named: true, outIn: 0 });
    else if (i === 16) entrants.push({ name: `Rival ${nameOf(youSpecies)}`, species: youSpecies, you: false, named: true, outIn: 0 });
    else {
      const species = field[pickH(`s${i}`) % Math.max(1, field.length)] ?? 'machop';
      entrants.push({ name: `${OWNERS[(i + pickH('o') % 31) % 31]}'s ${nameOf(species)}`, species, you: false, named: false, outIn: 0 });
    }
  }
  // Play the bracket: you always win; a named competitor beats the field in its half; other pairs are decided by the seed hash.
  const played = Math.min(5, Math.max(0, now - 1));
  const survivors: TourneyEntrant[][] = [entrants.map((e) => ({ ...e }))];
  const opponents: (TourneyEntrant | null)[] = [];
  let line = survivors[0]!;
  for (let r = 1; r <= 5; r++) {
    const next: TourneyEntrant[] = [];
    for (let i = 0; i < line.length; i += 2) {
      const a = line[i]!;
      const b = line[i + 1]!;
      const winnerIsA = a.you ? true : b.you ? false : a.named !== b.named ? a.named : pickH(`w${r}:${i}`) % 2 === 0;
      const win = winnerIsA ? a : b;
      const lose = winnerIsA ? b : a;
      if (a.you || b.you) opponents[r - 1] = { ...lose };
      if (r <= played) lose.outIn = r;
      next.push(win);
    }
    survivors.push(next);
    line = next;
  }
  return { now, entrants: survivors[0]!, survivors, opponents: opponents.slice(0, 5).map((o) => o ?? null) };
}

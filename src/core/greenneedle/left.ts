// Greenneedle gn.new.13, The Ones You Left (doc GREENNEEDLE_PLACED_1.md lines 479–506).
// The newest lost run's team (core/story/championDefense.ts `retired:team`, a list of species:level) waits at a cold camp.
// You may take one back (mark `came-back`, one move it knew then); or bury the notebook. The others each decide: a seeded shuffle
// sends one into the woods (always), and splits the rest between a passing trainer and the camp. The fates are kept in the run
// flag `left:fates` ("species:fate,...", fate = trainer | camp | woods) so the Final Reunion (gn.61) can read them.
import type { Content } from '../contentSchema';
import { getSpecies, isUsableMove } from '../pokemon';
import { hashSeed, Rng } from '../rng';
import type { PokemonInstance, RunState } from '../state';
import { retiredTeam } from '../story/championDefense';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
export const FATES = 'left:fates';

/** The lost team's n-th member (1..6), or undefined. */
export const leftSlot = (run: RunState, n: number): { speciesId: string; level: number } | undefined => retiredTeam(run.story)[n - 1];
/** The n-th Ball is still shut: it exists and nothing was taken. */
export const leftHas = (run: RunState, n: number): boolean => !!leftSlot(run, n) && f(run, 'left-took') === 0;

const nameOf = (content: Content, id: string): string => content.species.get(id)?.name ?? id;

/** `{left:1}`..`{left:6}` (species and old level), `{left:list}`, `{left:woods}`, `{left:took}`. */
export function leftTokens(content: Content, run: RunState, text: string): string {
  const team = retiredTeam(run.story);
  const fates = fatesOf(run);
  const woods = fates.find((x) => x.fate === 'woods');
  return text
    .replace(/\{left:([1-6])\}/g, (_, n: string) => (team[Number(n) - 1] ? `${nameOf(content, team[Number(n) - 1]!.speciesId)} (Lv ${team[Number(n) - 1]!.level})` : 'an empty Ball'))
    .replaceAll('{left:list}', team.map((m) => nameOf(content, m.speciesId)).join(', '))
    .replaceAll('{left:woods}', woods ? nameOf(content, woods.speciesId) : 'the last one')
    .replaceAll('{left:took}', f(run, 'left-took') > 0 ? nameOf(content, team[f(run, 'left-took') - 1]?.speciesId ?? '') : 'the one you took');
}

export function fatesOf(run: Pick<RunState, 'story'>): { speciesId: string; fate: string }[] {
  const raw = run.story.flags[FATES];
  if (typeof raw !== 'string') return [];
  return raw.split(',').flatMap((p) => {
    const [speciesId, fate] = p.split(':');
    return speciesId && fate ? [{ speciesId, fate }] : [];
  });
}

/** After the choice: the Pokémon not taken decide. One walks into the woods; of the rest, the first half go with a passing trainer, the others stay. */
export function leftFates(run: RunState): string {
  if (run.story.flags[FATES] !== undefined) return '';
  const took = f(run, 'left-took');
  const rest = retiredTeam(run.story).filter((_, i) => i + 1 !== took);
  if (rest.length === 0) return '';
  const rng = new Rng(hashSeed(`${run.seed}::the-ones-you-left`));
  const order = rest.map((m, i) => ({ m, k: rng.float(), i })).sort((a, b) => a.k - b.k || a.i - b.i).map((x) => x.m);
  const walkers = Math.ceil((order.length - 1) / 2);
  run.story.flags[FATES] = order.map((m, i) => `${m.speciesId}:${i === 0 ? 'woods' : i <= walkers ? 'trainer' : 'camp'}`).join(',');
  return '';
}

/** Take the n-th Ball: it joins marked `came-back`, with one move it knew back then. */
export function leftTake(content: Content, run: RunState, n: number, host: { apply: (e: unknown) => string }): string {
  const slot = leftSlot(run, n);
  if (!slot || f(run, 'left-took') > 0 || !content.species.has(slot.speciesId)) return '';
  run.story.flags['ev:left-took'] = n;
  const before = new Set([...run.party, ...run.box].map((m) => m.uid));
  const words = host.apply({ kind: 'join', recall: false, species: [slot.speciesId], types: [], levelBonus: 0, shinyMultiplier: 1, shadow: false, blissful: false, hiddenAbility: false, moves: [], direct: true, alpha: false, starterType: false, asIs: true, mark: 'came-back' });
  const mon = [...run.party, ...run.box].find((m) => !before.has(m.uid) && m.speciesId === slot.speciesId);
  if (mon) knewThen(content, mon);
  return words;
}

/** The latest move of its line it learned at or below the level it had then, if it does not know it already. */
function knewThen(content: Content, mon: PokemonInstance): void {
  const known = new Set(mon.moves.map((m) => m.id));
  const old = getSpecies(content, mon.speciesId).learnset.filter((x) => x.level <= mon.level && !known.has(x.move) && isUsableMove(content, x.move)).map((x) => x.move);
  const id = old[old.length - 1];
  if (!id) return;
  const slot = { id, pp: content.moves.get(id)!.pp };
  if (mon.moves.length < 4) mon.moves.push(slot);
  else mon.moves[3] = slot;
}

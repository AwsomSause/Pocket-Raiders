// Greenneedle gn.new.07, The Shedinja Question (doc GREENNEEDLE_PLACED_1.md lines 270–302).
// A shell that stood up. Three rests, three answers; enough acceptances and it joins, with Second Self.
import type { Content } from '../contentSchema';
import type { PokemonInstance, RunState } from '../state';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
const nameOf = (content: Content, mon: PokemonInstance): string => content.species.get(mon.speciesId)?.name ?? mon.speciesId;

/** What one party Pokémon does when it answers: a different one each rest (food, spot, then both). */
const ANSWERS = [
  (n: string) => `${n} sniffs it, once, all the way round. Then ${n} pushes half its food across the grass.`,
  (n: string) => `${n} circles it twice, and lies down beside it. It makes room. Then it settles into the space.`,
  (n: string) => `${n} touches its nose to the shell. The shell tips, just slightly, towards the warmth.`,
];

/**
 * gn op `shedRest` (`key` = the answer): `mon` a Pokémon answers, `yes` the player says it is one of them (also "I don't know either"),
 * `no` "You're a shell" (counts for nothing), `none` nobody answers, `seek` it waits for the Ninjask (counts for nothing yet).
 * After the third rest it joins (more acceptances than silences) or it is gone.
 */
export function shedRest(content: Content, run: RunState, host: { apply: (e: unknown) => string }, answer: string): string {
  if (f(run, 'shed-end') > 0) return '';
  const rests = f(run, 'shed-rests');
  let words = '';
  if (answer === 'mon') {
    const alive = run.party.filter((m) => m.hp > 0);
    const pool = alive.length ? alive : run.party;
    const mon = pool[rests % Math.max(1, pool.length)];
    if (mon) {
      mon.friendship = Math.min(255, (mon.friendship ?? 0) + 5);
      words = ANSWERS[rests % ANSWERS.length]!(nameOf(content, mon));
    }
    set(run, 'shed-accepted', f(run, 'shed-accepted') + 1);
  } else if (answer === 'yes') set(run, 'shed-accepted', f(run, 'shed-accepted') + 1);
  else if (answer === 'none') set(run, 'shed-silence', f(run, 'shed-silence') + 1);
  else if (answer === 'seek') set(run, 'shed-hold', 1);
  set(run, 'shed-rests', rests + 1);
  if (rests + 1 < 3) return words;
  return [words, shedEnd(run, host)].filter(Boolean).join(' ');
}

/** The Ninjask zipped past it twice, and it turned back to the player: that counts as an acceptance. */
export function shedNinjask(run: RunState): string {
  set(run, 'shed-hold', 0);
  set(run, 'shed-ninjask', 1);
  set(run, 'shed-accepted', f(run, 'shed-accepted') + 1);
  return '';
}

function shedEnd(run: RunState, host: { apply: (e: unknown) => string }): string {
  if (f(run, 'shed-accepted') <= f(run, 'shed-silence')) {
    set(run, 'shed-end', 2);
    return '';
  }
  set(run, 'shed-end', 1);
  set(run, 'shedinja-answered', 1);
  return host.apply({ kind: 'join', recall: false, species: ['shedinja'], types: [], levelBonus: 0, shinyMultiplier: 1, shadow: false, blissful: false, hiddenAbility: false, moves: [], direct: true, alpha: false, starterType: false, asIs: true, ability: 'second-self', mark: 'it was answered' });
}

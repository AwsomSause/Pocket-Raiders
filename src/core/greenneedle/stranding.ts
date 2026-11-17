// Greenneedle gn.new.17, The Stranding (doc GREENNEEDLE_PLACED_1.md lines 617–655).
// A Wailord on the sand, eight turns to the tide. Six tasks, each party Pokémon on one task a turn; what's left the townspeople
// cover, less well. A panel shows the six bars. Four or more kept up at turn 8: the tide lifts it. Fewer: a second Wailord calls.
// Nobody dies in either ending.
import type { Content } from '../contentSchema';
import { getSpecies, abilityOf } from '../pokemon';
import type { PokemonInstance, RunState } from '../state';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
export const TASKS = ['wet', 'shade', 'dig', 'calm', 'crowd', 'tide'] as const;
export type Task = (typeof TASKS)[number];
export const TASK_NAME: Record<Task, string> = { wet: 'Keep it wet', shade: 'Shade it', dig: 'Dig a channel', calm: 'Calm it', crowd: 'Hold the crowd', tide: 'Guide the tide' };
/** Eight turns; seven when the polluted factory was left running (the water went out early). */
export const TURNS = 8;
export const turnsOf = (run: Pick<RunState, 'story'>): number => (f(run, 'factory-left-running') > 0 ? TURNS - 1 : TURNS);
export const BAR_START = 3;
export const BAR_MAX = 6;
/** Tasks kept up at the turn: bar at 4 or more. */
export const KEPT = 4;
/** The tide can only be guided from this turn. */
export const TIDE_FROM = 5;

const typesOf = (content: Content, m: PokemonInstance): string[] => getSpecies(content, m.speciesId).types as string[];
const weightOf = (content: Content, m: PokemonInstance): number => getSpecies(content, m.speciesId).weight ?? 50;
const knowsType = (content: Content, m: PokemonInstance, type: string): boolean => m.moves.some((mv) => content.moves.get(mv.id)?.type === type);

/** Whether this Pokémon can do the task (the doc's table). */
export function canDo(content: Content, m: PokemonInstance, task: Task, turn: number): boolean {
  const types = typesOf(content, m);
  switch (task) {
    case 'wet': return knowsType(content, m, 'water');
    case 'shade': return types.includes('flying') || weightOf(content, m) >= 100;
    case 'dig': return types.includes('ground') || types.includes('fighting');
    // Sing, or any Pokémon it can look in the eye: one with the reach (wings, a Water-type) or the size.
    case 'calm': return m.moves.some((mv) => mv.id === 'sing') || types.includes('water') || types.includes('flying') || weightOf(content, m) >= 40;
    case 'crowd': return true;
    case 'tide': return turn >= TIDE_FROM && (types.includes('water') || types.includes('psychic'));
  }
}
/** Hold the crowd: better with Intimidate or a kind face (a Pokémon that loves you). */
const kind = (content: Content, m: PokemonInstance): boolean => abilityOf(content, m) === 'intimidate' || m.friendship >= 160;
const bar = (run: Pick<RunState, 'story'>, t: Task): number => f(run, `st-bar-${t}`);
const living = (run: RunState): PokemonInstance[] => run.party.filter((m) => m.hp > 0);

/** The sand: bars at 3, turn 1, nobody given a task yet. */
export function stStart(run: RunState): string {
  for (const k of Object.keys(run.story.flags)) if (k.startsWith('ev:st-')) delete run.story.flags[k];
  for (const t of TASKS) set(run, `st-bar-${t}`, BAR_START);
  set(run, 'st-turn', 1);
  set(run, 'st-i', 0);
  set(run, 'st-more', 1);
  return '';
}
/** The Pokémon waiting for a task this turn (the next living one by place in the party), or undefined. */
export const waiting = (run: RunState): PokemonInstance | undefined => living(run)[f(run, 'st-i')];

/** Gives the waiting Pokémon task `n` (index into TASKS). One that can't do it is told so and stays waiting. */
export function stAssign(content: Content, run: RunState, n: number): string {
  const m = waiting(run);
  const task = TASKS[n];
  if (!m || !task) return '';
  const name = getSpecies(content, m.speciesId).name;
  const turn = f(run, 'st-turn');
  if (!canDo(content, m, task, turn)) {
    set(run, 'st-more', 1);
    return task === 'tide' && turn < TIDE_FROM ? `The tide isn't there to guide yet. ${name} waits for the turn it comes in.` : `${name} looks at the Wailord, then at you. That's not something it can do.`;
  }
  const power = task === 'crowd' && kind(content, m) ? 2 : 1;
  set(run, `st-got-${task}`, f(run, `st-got-${task}`) + power);
  if (task === 'calm') run.story.flags['st:calmer'] = name;
  set(run, 'st-i', f(run, 'st-i') + 1);
  set(run, 'st-more', waiting(run) ? 1 : 0);
  return `${name}: ${TASK_NAME[task].toLowerCase()}.`;
}

/** The turn ends: each task gains by the Pokémon on it, or loses one on every even turn when the townspeople cover it alone. */
export function stEnd(run: RunState): string {
  const turn = f(run, 'st-turn');
  const last = turnsOf(run);
  for (const t of TASKS) {
    const got = f(run, `st-got-${t}`);
    if (got > 0) set(run, `st-bar-${t}`, Math.min(BAR_MAX, bar(run, t) + got));
    else if (turn % 2 === 0 && !(t === 'tide' && turn < TIDE_FROM)) set(run, `st-bar-${t}`, Math.max(0, bar(run, t) - 1));
    set(run, `st-got-${t}`, 0);
  }
  set(run, 'st-turn', turn + 1);
  set(run, 'st-i', 0);
  set(run, 'st-more', 1);
  if (turn >= last) {
    const kept = TASKS.filter((t) => bar(run, t) >= KEPT).length;
    set(run, 'st-kept', kept);
    // The state routes the next room: 0 another turn, 1 the tide lifts it, 2 the second Wailord calls.
    set(run, 'st-state', kept >= 4 ? 1 : 2);
    return '';
  }
  return turn + 1 === TIDE_FROM ? 'The tide has turned. From here it can be guided.' : '';
}

/** Tokens: {stranding:turn}, {stranding:turns}, {stranding:bars}, {stranding:next}, {stranding:calmer}, {stranding:kept}. */
export function strandingTokens(content: Content, run: RunState, text: string): string {
  const turn = Math.min(turnsOf(run), f(run, 'st-turn'));
  const bars = TASKS.map((t) => {
    const b = bar(run, t);
    const dim = t === 'tide' && turn < TIDE_FROM ? ' (not yet)' : '';
    return `${TASK_NAME[t]}: ${'▮'.repeat(b)}${'▯'.repeat(BAR_MAX - b)}${b >= KEPT ? ' kept up' : ''}${dim}`;
  }).join('\n\n');
  const m = waiting(run);
  const next = m ? getSpecies(content, m.speciesId).name : 'nobody';
  return text
    .replaceAll('{stranding:turn}', String(turn))
    .replaceAll('{stranding:turns}', String(turnsOf(run)))
    .replaceAll('{stranding:bars}', bars)
    .replaceAll('{stranding:next}', next)
    .replaceAll('{stranding:calmer}', String(run.story.flags['st:calmer'] ?? '') || 'the one who sang')
    .replaceAll('{stranding:kept}', String(f(run, 'st-kept')));
}

// Greenneedle gn.new.01, The Eevee Who Couldn't Choose (doc GREENNEEDLE_PLACED_1.md lines 11-74).
// An Eevee follows you through one region. The answers you give don't decide what it becomes: what you DID does. From the cold open
// on, every won battle (and every Pokémon Center heal) is tallied in run flags (`ev:eevee-t-*`); at the S8 ending the biggest tally wins.
// No random rolls and no save change: state is run flags only.
import type { Content } from '../contentSchema';
import { periodOf, tideOf } from '../clock';
import { stageTags } from '../co/placement';
import { maxHp } from '../pokemon';
import type { BattleState, RunState } from '../state';
import { getTheme } from '../themes';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, v: number): void => {
  run.story.flags[`ev:${k}`] = Math.max(0, v);
};

export const EEVEE_ON = 'eevee-on';
const FAINTED = 'eevee-fainted';
const COUNTED = 'eevee-counted';
const FIRE_USED = 'eevee-fire';
/** What the player did, in the doc's table order: the form it becomes is the same position in `FORMS`. */
export const TALLIES = ['night', 'day', 'heal', 'water', 'quick', 'fire', 'grass', 'snow'] as const;
export const FORMS = ['umbreon', 'espeon', 'sylveon', 'vaporeon', 'jolteon', 'flareon', 'leafeon', 'glaceon', 'eevee'] as const;
export const tallyKey = (t: (typeof TALLIES)[number]): string => `eevee-t-${t}`;
/** High Bond: a Pokémon that fought is at Bond level 3 or more. */
const HIGH_BOND = 3;

/** The cold open: the counting starts from nothing. */
export function eeveeStart(run: RunState): void {
  set(run, EEVEE_ON, 1);
  set(run, FAINTED, 0);
  for (const t of TALLIES) set(run, tallyKey(t), 0);
}

/** Pokémon Center: every Pokémon that was hurt and is healed counts one (before = each party Pokémon's HP going in). */
export function eeveeHealed(content: Content, run: RunState, before: number[]): void {
  if (f(run, EEVEE_ON) !== 1) return;
  const healed = run.party.filter((m, i) => (before[i] ?? 0) < maxHp(content, m)).length;
  set(run, tallyKey('heal'), f(run, tallyKey('heal')) + healed);
}

/** After each turn: a Fire move used by the player's side is noted for the fight; once the fight is won it is tallied (once per fight). */
export function eeveeTurn(content: Content, run: RunState, events: readonly { type: string; side?: string; moveId?: string | null }[]): void {
  const battle = run.battle;
  if (!battle || f(run, EEVEE_ON) !== 1) return;
  for (const e of events) {
    if (e.type === 'move' && e.side === 'player' && typeof e.moveId === 'string' && content.moves.get(e.moveId)?.type === 'fire' && !battle.storyEffects.includes(FIRE_USED)) battle.storyEffects.push(FIRE_USED);
  }
  if ((battle.outcome !== 'win' && battle.outcome !== 'caught') || battle.storyEffects.includes(COUNTED)) return;
  battle.storyEffects.push(COUNTED);
  eeveeCount(content, run, battle);
}

function eeveeCount(content: Content, run: RunState, battle: BattleState): void {
  const add = (t: (typeof TALLIES)[number]): void => set(run, tallyKey(t), f(run, tallyKey(t)) + 1);
  if (run.party.some((m) => m.hp <= 0)) set(run, FAINTED, 1);
  const stage = run.stage;
  const types = stage && stage.kind === 'stage' ? getTheme(content, stage.themeId).types : [];
  const tags = stageTags(types, periodOf(run), tideOf(content, run));
  const night = tags.has('night');
  const step = content.balance.co.bondLevelStep;
  const fought = run.party.filter((m) => battle.participants.includes(m.uid));
  if (night) add('night');
  else if (fought.some((m) => Math.floor(m.friendship / step) >= HIGH_BOND)) add('day');
  if (tags.has('water')) add('water');
  if (battle.turn - 1 <= 2) add('quick');
  if (battle.storyEffects.includes(FIRE_USED) || battle.weather?.id === 'sun') add('fire');
  if (types.some((t) => t === 'grass' || t === 'bug')) add('grass');
  if (tags.has('high') || tags.has('snow')) add('snow');
}

/**
 * The S8 ending: flag `eevee-form` becomes 1..9 (the position in `FORMS`). The biggest tally wins; a tie goes to the one the doc lists first.
 * Shrugging every time, or nothing counted at all, leaves it an Eevee. Sylveon only counts if nobody fainted all region.
 */
export function eeveeEnd(content: Content, run: RunState): void {
  const nods = f(run, 'eevee-nod');
  const shrugs = f(run, 'eevee-shrug');
  const refused = ['fisherman', 'magician', 'electrician', 'nurse', 'gardener', 'guide', 'ribbon'].reduce((n, a) => n + f(run, `eevee-refused-${a}`), 0);
  const score = TALLIES.map((t) => (t === 'heal' && f(run, FAINTED) > 0 ? 0 : f(run, tallyKey(t))));
  const best = Math.max(...score);
  const shrugAll = shrugs > 0 && nods === 0 && refused === 0;
  const form = shrugAll || best <= 0 ? FORMS.length : score.indexOf(best) + 1;
  set(run, 'eevee-form', form);
  set(run, 'eevee-done', 1);
  set(run, EEVEE_ON, 0);
  if (form === FORMS.length) set(run, 'eevee-stayed', 1);
}

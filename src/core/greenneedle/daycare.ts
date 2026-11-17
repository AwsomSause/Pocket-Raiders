// Greenneedle gn.40, the Pokémon Day-Care Village: two Pokémon left for a region, eggs that are placed, not sold, and the hatchling
// the answer shapes. The pure parts (no imports from run or eggs, so eggs.ts can call `shapeHatchling` without a cycle).
//  - gn op `daycareLeave` (the picked Pokémon): it goes to the village (the box, carrying gn mark `daycare`), stamped with the stage.
//  - gn op `daycareReturn`: they come back, a level for every stage they were away, knowing each other (the pair's Bond Level 2, so
//    the paired bonus fires when both are in battle), and, if they are a compatible pair, with an egg waiting (`eggs.ts` lays it).
//  - gn op `eggShape` (`key`): the newest egg carries a shape for its hatchling (the adoption answers, Bronwen's eggs, a day-care egg's
//    inherited habit); `shapeHatchling` applies it when it hatches.
import type { Content } from '../contentSchema';
import type { Egg, PokemonInstance, RunState } from '../state';
import { NATURE_IDS } from '../natures';
import { listenedShape } from './listened';

export const DAYCARE_MARK = 'daycare';
/** The flag stamp: the run stage (counted from 1) the pair was left at. */
export const DAYCARE_AT = 'daycare-at';
/** Pair Bond Level 2 is the paired bonus (bond/schema.ts BOND_RULES.pairLevels.wins[1]). */
const PAIR_WINS = 8;

const flagKey = (k: string): string => `ev:${k}`;
const shapeKey = (uid: string): string => `ev:egg-shape:${uid}:`;

/** The Pokémon at the village (in the box, marked). */
export const atDaycare = (run: Pick<RunState, 'box'>): PokemonInstance[] => run.box.filter((m) => m.gn?.includes(DAYCARE_MARK));

/** Leaves one party Pokémon at the village. Never the last one standing in the party. */
export function daycareLeave(content: Content, run: RunState, uid: string | undefined, stage: number): string {
  const i = run.party.findIndex((m) => m.uid === uid);
  if (i < 0 || run.party.length <= 1 || atDaycare(run).length >= 2) return '';
  const [mon] = run.party.splice(i, 1);
  mon!.gn = [...(mon!.gn ?? []).filter((t) => t !== DAYCARE_MARK && t !== DAYCARE_LED), DAYCARE_MARK, ...(i === 0 ? [DAYCARE_LED] : [])];
  run.box = [...run.box, mon!];
  run.story.flags[flagKey(DAYCARE_AT)] = stage;
  run.story.flags[flagKey('daycare-held')] = atDaycare(run).length;
  return `${content.species.get(mon!.speciesId)?.name ?? mon!.speciesId} stays at the village.`;
}

/** gn mark: it was leading the party when it was left at the village (an inherited habit reads it). */
export const DAYCARE_LED = 'daycare-led';
/** "Over and over": a move used at least this often, and more than every other move together. */
const STANCE_USES = 10;
/**
 * The habit a day-care egg's hatchling inherits, by what its parent did most: fought with one move over and over (its stance),
 * led the party, or, failing both, was left at the day-care. (Rests slept near you and switches aren't counted by the run.)
 */
export function inheritedHabit(run: Pick<RunState, 'story'>, parent: PokemonInstance): { shape: 'habit-stance' | 'habit-lead' | 'habit-daycare'; move?: string } {
  const uses = Object.entries(run.story.histories[parent.uid]?.moves ?? {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const total = uses.reduce((n, [, u]) => n + u, 0);
  if (uses[0] && uses[0][1] >= STANCE_USES && uses[0][1] * 2 > total) return { shape: 'habit-stance', move: uses[0][0] };
  if (parent.gn?.includes(DAYCARE_LED)) return { shape: 'habit-lead' };
  return { shape: 'habit-daycare' };
}

/** Whether two Pokémon could make an egg: a shared egg group (Ditto goes with anyone), never the Undiscovered group. */
export function compatible(content: Content, a: PokemonInstance, b: PokemonInstance): boolean {
  const sa = content.species.get(a.speciesId);
  const sb = content.species.get(b.speciesId);
  if (!sa || !sb) return false;
  const none = (g: readonly string[]) => g.length === 0 || g.includes('no-eggs') || g.includes('undiscovered');
  if (none(sa.eggGroups) || none(sb.eggGroups)) return false;
  if (sa.id === 'ditto' || sb.id === 'ditto') return sa.id !== sb.id;
  return sa.eggGroups.some((g) => sb.eggGroups.includes(g));
}

/**
 * Brings the pair home. `addLevels` and `layEgg` come from the caller (the gn op), so this file stays free of run/eggs imports.
 * Returns the line, and the parent the egg should come from (null: no egg).
 */
export function daycareReturn(content: Content, run: RunState, stage: number, addLevels: (mon: PokemonInstance, n: number) => void): { line: string; eggOf: PokemonInstance | null; parents: string[]; habit?: ReturnType<typeof inheritedHabit> } {
  const back = atDaycare(run);
  if (back.length === 0) return { line: '', eggOf: null, parents: [] };
  const levels = Math.max(0, stage - Number(run.story.flags[flagKey(DAYCARE_AT)] ?? stage));
  // The egg comes from the one that isn't a Ditto (else the first); its habit is read before the village's marks come off.
  const eggParent = back.length === 2 ? (back[0]!.speciesId === 'ditto' ? back[1]! : back[0]!) : null;
  const habit = eggParent ? inheritedHabit(run, eggParent) : undefined;
  for (const mon of back) {
    mon.gn = (mon.gn ?? []).filter((t) => t !== DAYCARE_MARK && t !== DAYCARE_LED);
    if (levels > 0) addLevels(mon, levels);
    mon.marks = [...(mon.marks ?? []), 'raised for a while at the Day-Care Village'].slice(-8);
    if (run.party.length < 6) {
      run.box = run.box.filter((m) => m.uid !== mon.uid);
      run.party = [...run.party, mon];
    }
  }
  run.story.flags[flagKey('daycare-held')] = 0;
  const names = back.map((m) => content.species.get(m.speciesId)?.name ?? m.speciesId);
  let line = `${names.join(' and ')} ${back.length > 1 ? 'come' : 'comes'} home${levels > 0 ? `, ${levels} level${levels > 1 ? 's' : ''} stronger` : ''}.`;
  if (back.length < 2) return { line, eggOf: null, parents: back.map((m) => m.uid) };
  const [a, b] = back as [PokemonInstance, PokemonInstance];
  const key = `bondwins:${[a.uid, b.uid].sort().join('+')}`;
  run.itemCounters = { ...run.itemCounters, [key]: Math.max(run.itemCounters?.[key] ?? 0, PAIR_WINS) };
  line += ' They know each other now. In battle together, it shows.';
  if (!compatible(content, a, b)) return { line, eggOf: null, parents: [a.uid, b.uid] };
  return { line: `${line} And there's an egg waiting.`, eggOf: eggParent ?? a, parents: [a.uid, b.uid], habit };
}

// ---------- Egg shapes ----------
export const EGG_SHAPES = [
  // The adoptions: found in a storm, left on a doorstep, the last of a clutch.
  'storm-hold', 'storm-brave', 'storm-front', 'door-yes', 'door-no', 'door-safe', 'clutch-no', 'clutch-bit', 'clutch-slow',
  // Bronwen's pairs, and a day-care egg's inherited habit.
  'nidoran-best', 'bronwen-best', 'habit-daycare', 'habit-lead', 'habit-stance',
  // gn.new.33 The Old Courier: the Dratini egg from the lighthouse (Extreme Speed, Tailwind Heart).
  'tailwind-heart',
] as const;
export type EggShape = (typeof EGG_SHAPES)[number];

/** Tags the newest egg with a shape (and a parent, for a day-care egg). "Hatches sooner": one step left. */
export function eggShape(run: RunState, shape: string, parents: string[] = [], move?: string): string {
  const egg = run.eggs[run.eggs.length - 1];
  if (!egg || !(EGG_SHAPES as readonly string[]).includes(shape)) return '';
  run.story.flags[`${shapeKey(egg.uid)}${shape}`] = 1;
  for (const p of parents) run.story.flags[`ev:egg-parent:${egg.uid}:${p}`] = 1;
  if (move) run.story.flags[`ev:egg-habit-move:${egg.uid}:${move}`] = 1;
  if (shape === 'clutch-bit') {
    egg.left = 1;
    egg.total = Math.min(egg.total ?? 1, 2);
  }
  return '';
}

const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
/** Applies an egg's shape to the Pokémon that hatched from it (eggs.ts hatchEgg). `teach` teaches a move. */
export function shapeHatchling(content: Content, run: RunState, egg: Egg, mon: PokemonInstance, teach: (moveId: string) => void): void {
  const prefix = shapeKey(egg.uid);
  const shapes = Object.keys(run.story.flags).filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length));
  const friendlyAt = (level: number): number => Math.min(content.balance.friendship.max, level * content.balance.co.bondLevelStep);
  const boost = (stat: (typeof STAT_KEYS)[number], n: number): void => {
    mon.eventBoosts = { ...mon.eventBoosts, [stat]: (mon.eventBoosts?.[stat] ?? 0) + n };
  };
  const mark = (text: string): void => {
    mon.marks = [...(mon.marks ?? []), text].slice(-8);
  };
  const nature = (n: string): void => {
    if ((NATURE_IDS as readonly string[]).includes(n)) mon.nature = n as PokemonInstance['nature'];
  };
  for (const s of shapes) {
    if (s === 'storm-hold') mon.friendship = Math.max(mon.friendship, friendlyAt(3));
    if (s === 'storm-brave') mon.gn = [...(mon.gn ?? []), UNFLINCHING_FIRST];
    if (s === 'storm-front') boost('def', 10);
    if (s === 'door-yes') nature('gentle');
    if (s === 'door-no') nature('bold');
    if (s === 'door-safe') nature('careful');
    if (s === 'clutch-no') {
      const species = content.species.get(mon.speciesId);
      const best = STAT_KEYS.reduce((a, k) => ((species?.baseStats[k] ?? 0) > (species?.baseStats[a] ?? 0) ? k : a), 'hp' as (typeof STAT_KEYS)[number]);
      boost(best, 10);
    }
    if (s === 'clutch-bit') mark('hatched early, and knows it');
    if (s === 'clutch-slow') mon.friendship = Math.max(mon.friendship, friendlyAt(3));
    if (s === 'nidoran-best') {
      teach('earth-power');
      teach('megahorn');
    }
    listenedShape(content, mon, s, friendlyAt, teach, mark);
    if (s === 'tailwind-heart') {
      teach('extreme-speed');
      mon.gn = [...(mon.gn ?? []), TAILWIND_HEART];
      mark('Tailwind Heart: carried a parcel to a lighthouse before it was born');
    }
    if (s === 'habit-daycare') mark('looks for the Old Dog in every town');
    if (s === 'habit-lead') mark('walks one step ahead, and keeps looking back');
    if (s === 'habit-stance') {
      const movePrefix = `ev:egg-habit-move:${egg.uid}:`;
      const id = Object.keys(run.story.flags).find((k) => k.startsWith(movePrefix))?.slice(movePrefix.length);
      mark(`practises the ${content.moves.get(id ?? '')?.name ?? 'same move'} stance, wrongly`);
    }
  }
  // A day-care egg remembers who it came from (Bronwen's "any Pokémon and its own parent").
  const parentPrefix = `ev:egg-parent:${egg.uid}:`;
  for (const k of Object.keys(run.story.flags)) if (k.startsWith(parentPrefix)) mon.gn = [...(mon.gn ?? []), `child-of:${k.slice(parentPrefix.length)}`];
  // Afterstory: once you have visited, the village sends a card at every hatch, anywhere.
  if (Number(run.story.flags[flagKey('daycare-visits')] ?? 0) > 0) mark('a card came from the Day-Care Village, with a pawprint in ink');
}

/** gn mark (Tailwind Heart): when it switches in, the next ally to switch in this battle gains +1 Speed (once per battle). */
export const TAILWIND_HEART = 'tailwind-heart';

/** gn mark: can't be made to flinch in its first battle (it saw you weren't afraid). It becomes UNFLINCHING_NOW for that battle. */
export const UNFLINCHING_FIRST = 'unflinching-first';
export const UNFLINCHING_NOW = 'unflinching-now';
/** At each battle's start: last battle's courage is spent; a first battle's begins. */
export function unflinchingStart(run: RunState): void {
  for (const mon of [...run.party, ...run.box]) {
    if (!mon.gn?.length) continue;
    mon.gn = mon.gn.filter((t) => t !== UNFLINCHING_NOW).map((t) => (t === UNFLINCHING_FIRST && run.party.includes(mon) ? UNFLINCHING_NOW : t));
  }
}
/** Whether a party Pokémon is beyond flinching this battle. */
export const unflinching = (mon: Pick<PokemonInstance, 'gn'>): boolean => !!mon.gn?.includes(UNFLINCHING_NOW);

/** Bronwen's last pair: a Pokémon and its own parent, both in the party. */
export const parentAndChild = (run: Pick<RunState, 'party'>): boolean =>
  run.party.some((m) => m.gn?.some((t) => t.startsWith('child-of:') && run.party.some((p) => p.uid === t.slice('child-of:'.length))));

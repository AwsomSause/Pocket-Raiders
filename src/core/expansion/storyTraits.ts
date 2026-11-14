// Beta 0.7 E9: team-wide battle traits for Alola and Paldea story events (Hype Man, Reluctant Hand, Old Habits). They are off unless the
// run started with the `storyTraits` setting on. State lives in `battle.extra.storyTraits` (uid -> trait, saved with the battle).
// Pure, no RNG. An event battle names its trait with `special: 'st.<trait>'`.

import { z } from 'zod';

export const STORY_TRAIT_IDS = ['hype-man', 'reluctant-hand', 'old-habits'] as const;
export type StoryTraitId = (typeof STORY_TRAIT_IDS)[number];

export const StoryTraitsSchema = z.record(z.string(), z.object({ trait: z.enum(STORY_TRAIT_IDS), turn: z.number().int().optional() })).default({});
export type StoryTraits = z.infer<typeof StoryTraitsSchema>;

/** Hype Man: the next foe's first move hits 20% harder after one is beaten. */
export const HYPE_POWER = 1.2;

export const storyTraitOf = (special: string | undefined): StoryTraitId | null => {
  const id = special?.startsWith('st.') ? special.slice(3) : '';
  return (STORY_TRAIT_IDS as readonly string[]).includes(id) ? (id as StoryTraitId) : null;
};

/** Gives every foe of the team the trait named by `special`. No-op when the setting is off or `special` is not a story trait. Returns how many got it. */
export function assignStoryTraits(store: StoryTraits, team: readonly { uid: string }[], special: string | undefined, enabled: boolean): number {
  const trait = storyTraitOf(special);
  if (!enabled || !trait) return 0;
  for (const m of team) store[m.uid] = { trait };
  return team.length;
}

/** Reluctant Hand: this foe never lands a critical hit. */
export const storyNoCrit = (store: StoryTraits, uid: string): boolean => store[uid]?.trait === 'reluctant-hand';

/** Hype Man: the power multiplier for this foe's move on this turn. Only a foe that came in after another was beaten (`beaten` > 0) gets it, for its first move turn only. */
export function storyHype(store: StoryTraits, uid: string, beaten: number, turn: number): number {
  const s = store[uid];
  if (!s || s.trait !== 'hype-man' || beaten <= 0) return 1;
  if (s.turn === undefined) s.turn = turn;
  return s.turn === turn ? HYPE_POWER : 1;
}

/** Old Habits: the foe goes for the weakest. In a one-on-one fight that means it hits 25% harder once your Pokémon is under half HP. */
export const OLD_HABITS_POWER = 1.25;
export const storyOldHabits = (store: StoryTraits, uid: string, hp: number, max: number): number => (store[uid]?.trait === 'old-habits' && max > 0 && hp * 2 < max ? OLD_HABITS_POWER : 1);

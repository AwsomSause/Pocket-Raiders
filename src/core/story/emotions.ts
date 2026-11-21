// The Seven Emotions (M8.9 Phase 1). An emotion is not fixed to a species:
// each memory carries emotion tags, and a Pokémon's current emotion is the
// most common tag in its latest tagged memories (the newer one wins a tie).
// Emotion Overdrives (battle effects) come later; this is the tag layer.

import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import type { Emotion, PokemonHistory } from './schema';

export const EMOTION_NAMES: Record<Emotion, string> = {
  determination: 'Determination',
  bravery: 'Bravery',
  justice: 'Justice',
  kindness: 'Kindness',
  patience: 'Patience',
  integrity: 'Integrity',
  perseverance: 'Perseverance',
};

/** A different emotion must lead the current one by this many tags before the Pokémon changes (Kice 2026-11-17: stick with a feeling). */
export const EMOTION_SWITCH_MARGIN = 2;

/**
 * A Pokémon's current emotion, or null before it has a tagged memory. It keeps its emotion until another one leads it
 * by `EMOTION_SWITCH_MARGIN` tags among its latest tagged memories (`window`), so it no longer flips with every memory.
 */
export function currentEmotion(history: PokemonHistory | undefined, window: number): Emotion | null {
  if (!history) return null;
  const tagged = history.memories.filter((m) => m.emotions.length > 0).sort((a, b) => a.seq - b.seq);
  let held: Emotion | null = null;
  for (let i = 0; i < tagged.length; i++) {
    const count = new Map<Emotion, number>();
    for (const m of tagged.slice(Math.max(0, i + 1 - window), i + 1)) for (const e of m.emotions) count.set(e, (count.get(e) ?? 0) + 1);
    let lead: Emotion | null = null;
    for (const [e, n] of count) if (!lead || n > count.get(lead)!) lead = e;
    if (!held || !count.has(held)) held = lead;
    else if (lead && lead !== held && count.get(lead)! >= count.get(held)! + EMOTION_SWITCH_MARGIN) held = lead;
  }
  return held;
}

/** The current emotion of a party Pokémon in this run, with its name and heart colour. */
export function emotionOf(content: Content, run: RunState, uid: string): { id: Emotion; name: string; color: string } | null {
  const id = currentEmotion(run.story.histories[uid], content.story.emotions.window);
  return id ? { id, name: EMOTION_NAMES[id], color: content.story.emotions.colors[id] } : null;
}

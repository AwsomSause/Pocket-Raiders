// S253 Move animation packs: which source a move's animation comes from. Only the look changes; hit, damage and
// timing of the battle never read this.

export type MoveAnimPack = 'mixed' | 'pokerogue' | 'essentials';
export const MOVE_ANIM_PACKS: readonly MoveAnimPack[] = ['mixed', 'pokerogue', 'essentials'];
export const MOVE_ANIM_PACK_LABELS: Record<MoveAnimPack, string> = { mixed: 'Mixed (best of all)', pokerogue: 'PokeRogue', essentials: 'Essentials' };

export interface MoveLook {
  /** The move's own animation file (PokeRogue). */
  anim: string;
  /** The Essentials pack animation, when the move has one. */
  pack?: string;
  /** The scripted EBDX animation, when the move has one. */
  script?: string;
}
export interface AnimSource { anim: string; alt?: string; script?: string }

/** Mixed keeps today's order (script, then pack, then PokeRogue). The other two use one set, with the other as stand-by. */
export function packSource(pack: MoveAnimPack, look: MoveLook): AnimSource {
  if (pack === 'pokerogue') return { anim: look.anim };
  if (pack === 'essentials') return look.pack ? { anim: look.pack, alt: look.anim } : { anim: look.anim };
  return { anim: look.pack ?? look.anim, ...(look.pack ? { alt: look.anim } : {}), ...(look.script ? { script: look.script } : {}) };
}

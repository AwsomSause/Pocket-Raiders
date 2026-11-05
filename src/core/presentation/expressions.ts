// S254 Trainer portrait expressions: the foe trainer's portrait reacts to what happens in the battle.
// Pure mapping from a battle event to an expression and its emote text. Presentation only; never touches battle state.

export type Expression = 'calm' | 'smug' | 'shock' | 'worried' | 'angry' | 'grin';

export interface ExpressionLook {
  /** Short emote shown beside the portrait (plain characters, no emoji font needed). */
  emote: string;
  /** Tint on the portrait (0xffffff = none). */
  tint: number;
}

export const EXPRESSIONS: Record<Expression, ExpressionLook> = {
  calm: { emote: '', tint: 0xffffff },
  smug: { emote: '♪', tint: 0xfff0c0 },
  shock: { emote: '!?', tint: 0xd0e8ff },
  worried: { emote: '...', tint: 0xc8d0e0 },
  angry: { emote: '#!', tint: 0xffb0a0 },
  grin: { emote: '!!', tint: 0xffe8a0 },
};

export interface ExpressionEvent {
  type: string;
  /** The side the event happened to ('player' or 'enemy'). */
  side?: string;
  crit?: boolean;
  effectiveness?: number;
}

/**
 * The foe trainer's reaction to one event, or null to keep the current face.
 * `hpShare` is the foe's active Pokémon HP share after the event when known.
 */
export function expressionFor(ev: ExpressionEvent, hpShare?: number): Expression | null {
  if (ev.type === 'faint') return ev.side === 'enemy' ? 'shock' : 'grin';
  if (ev.type === 'damage') {
    if (ev.side === 'enemy') {
      if (ev.crit || (ev.effectiveness ?? 1) > 1) return 'angry';
      if (hpShare !== undefined && hpShare < 0.3) return 'worried';
      return null;
    }
    if (ev.crit || (ev.effectiveness ?? 1) > 1) return 'smug';
  }
  return null;
}

// Capture Styles (S224): befriend, negotiate or trap, as well as the Poké Ball throw. Each style is an item (so the Bag, shops and
// crafting already handle it) with its own odds that do not follow the ball formula. Pure maths: no random numbers, no UI; the
// engine rolls the dice with the battle's capture generator. Off unless `balance.captureStyles.enabled`.

import type { Content } from './contentSchema';

export type CaptureStyle = 'befriend' | 'negotiate' | 'trap';

export interface StyleFoe {
  level: number;
  hp: number;
  maxHp: number;
  catchRate: number;
  asleepOrParalysed: boolean;
  hasStatus: boolean;
}

export interface StyleInput {
  foe: StyleFoe;
  leadLevel: number;
}

/** Why this style cannot be used right now, or null. */
export function styleProblem(content: Pick<Content, 'balance'>, style: CaptureStyle, input: StyleInput): string | null {
  const c = content.balance.captureStyles;
  if (!c.enabled) return 'Capture styles are switched off.';
  if (style === 'trap' && input.foe.hp > input.foe.maxHp * c.trapHpLine && !input.foe.hasStatus) {
    return `It is too lively to trap. Wear it below ${Math.round(c.trapHpLine * 100)}% HP or give it a status first.`;
  }
  return null;
}

/** Chance (0..1) that the style works, before any skill grade from the minigame. */
export function styleProbability(content: Pick<Content, 'balance'>, style: CaptureStyle, input: StyleInput): number {
  const c = content.balance.captureStyles;
  const { foe } = input;
  let p: number;
  switch (style) {
    case 'befriend':
      // Gentle, so it favours easy-going species and calm (asleep or paralysed) ones; low HP does not matter.
      p = c.befriendBase + c.befriendCatchRate * (foe.catchRate / 255) + (foe.asleepOrParalysed ? c.befriendCalm : 0);
      break;
    case 'negotiate':
      // A weaker foe listens: your lead's level against theirs.
      p = c.negotiateBase + c.negotiatePerLevel * (input.leadLevel - foe.level);
      p = Math.max(c.negotiateMin, Math.min(c.negotiateMax, p));
      break;
    case 'trap':
      p = c.trapChance + (foe.hasStatus ? c.trapStatusBonus : 0);
      break;
  }
  return Math.max(0, Math.min(1, p));
}

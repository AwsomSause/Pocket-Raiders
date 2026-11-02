// Hub Town's day and night (spec §9): the town follows the player's own clock. Morning is fresh, afternoon is plain
// daylight, evening is warm, and night is blue with the street lamps lit. Presentation only: this reads the local
// time and changes nothing in any save, run or roll.

import type { Period } from '../clock';

/** The part of the day for a local time: 5-11 morning, 11-17 afternoon, 17-20 evening, otherwise night. */
export function hubPeriod(now: Date): Period {
  const h = now.getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'afternoon';
  if (h >= 17 && h < 20) return 'evening';
  return 'night';
}

/** The light over the town: a colour laid over the world (alpha 0 = untouched), and whether lamps are lit. */
export const HUB_LIGHT: Record<Period, { tint: number; alpha: number; lamps: boolean; label: string }> = {
  morning: { tint: 0xffe0b0, alpha: 0.1, lamps: false, label: 'Morning' },
  afternoon: { tint: 0xffffff, alpha: 0, lamps: false, label: 'Afternoon' },
  evening: { tint: 0x902c10, alpha: 0.24, lamps: true, label: 'Evening' },
  night: { tint: 0x0a1450, alpha: 0.58, lamps: true, label: 'Night' },
};

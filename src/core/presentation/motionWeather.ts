// Weather as the animation redesign draws it (plans/animation-redesign, pass 8): which kinds have the new look, the
// arena's colour grade under each, and the chip's words. Pure data; the drawing is src/ui/battleFx/weatherLook.ts.

export type WxKind = 'rain' | 'sun' | 'sand' | 'snow';
export const WX_KINDS: readonly WxKind[] = ['rain', 'sun', 'sand', 'snow'];

/** The arena's colour under each weather (the mockup's brightness, saturation and hue turn). */
export const WX_GRADE: Record<WxKind, { br: number; sat: number; hue: number }> = {
  rain: { br: 0.68, sat: 0.85, hue: 12 },
  sun: { br: 1.2, sat: 1.3, hue: -6 },
  sand: { br: 0.9, sat: 0.55, hue: -14 },
  snow: { br: 1.05, sat: 0.55, hue: 14 },
};
/** The chip: its sign, its word and its colour. */
export const WX_CHIP: Record<WxKind, { sign: string; word: string; fill: string }> = {
  rain: { sign: '☂', word: 'RAIN', fill: '#6fb4ff' },
  sun: { sign: '☀', word: 'SUN', fill: '#ffcb05' },
  sand: { sign: '≋', word: 'SANDSTORM', fill: '#e2c98a' },
  snow: { sign: '❄', word: 'SNOW', fill: '#cdf3ff' },
};
/** The chip's words: "☂ RAIN · 5 turns" (one turn: "1 turn"; endless weather: no count). */
export function wxChipText(kind: WxKind, turns: number | null): string {
  const c = WX_CHIP[kind];
  const left = turns === null || turns > 99 ? '' : ` · ${turns} turn${turns === 1 ? '' : 's'}`;
  return `${c.sign} ${c.word}${left}`;
}

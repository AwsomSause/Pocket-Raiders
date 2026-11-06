// S256 Sticker reactions: tiny emote stickers the player taps during a fight. Cosmetic only: a sticker never touches
// the battle, the run or any RNG stream, and it is not saved.

export interface Sticker { id: string; glyph: string; label: string }
export const STICKERS: readonly Sticker[] = [
  { id: 'gg', glyph: '👍', label: 'Good game' },
  { id: 'wow', glyph: '😮', label: 'Wow' },
  { id: 'fire', glyph: '🔥', label: 'On fire' },
  { id: 'sweat', glyph: '😅', label: 'Phew' },
  { id: 'love', glyph: '💖', label: 'Love it' },
  { id: 'win', glyph: '🏆', label: 'Victory' },
];

/** Stickers wait this long between taps so a fight never fills with them. */
export const STICKER_COOLDOWN_MS = 700;
/** At most this many are on screen at once. */
export const STICKER_MAX_ON_SCREEN = 3;

export function stickerById(id: string): Sticker | undefined {
  return STICKERS.find((s) => s.id === id);
}

/** Whether a tap goes through: on cooldown or too many on screen it is ignored. */
export function canSendSticker(nowMs: number, lastMs: number | null, onScreen: number): boolean {
  if (onScreen >= STICKER_MAX_ON_SCREEN) return false;
  return lastMs === null || nowMs - lastMs >= STICKER_COOLDOWN_MS;
}

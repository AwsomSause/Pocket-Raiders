// S257 Cutscene skip with recap. When the player skips a cutscene beat, a short text line says what it showed.
// Pure text; the banner is drawn in ui/battleFx/spectacle.ts. Never affects battle state.

export type RecapKind = 'wild' | 'wild-dark' | 'trainer' | 'rival' | 'boss';

/** The one-line recap for a skipped intro. `name` is the foe's name or title, `title` the extra line (a specialty or rival title). */
export function introRecap(kind: RecapKind, name: string, title?: string): string {
  const extra = title ? ` (${title})` : '';
  switch (kind) {
    case 'wild':
    case 'wild-dark':
      return `A wild ${name} appeared!`;
    case 'trainer':
      return `${name} wants to battle!${extra}`;
    case 'rival':
      return `Your rival ${name} challenges you!${extra}`;
    case 'boss':
      return `${name} steps up to the arena.${extra}`;
  }
}

/** Recap for a cutscene with free text (evolution, a story moment). Trimmed to one short line. */
export function textRecap(text: string, max = 90): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

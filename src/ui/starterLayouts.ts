// Starter select layouts (screens redesign group C): card geometry and theme per look, following
// redesign/starter/. Pure data; StarterSelectScene draws from it.
export type CardShape = 'glass' | 'plain' | 'none' | 'gold' | 'egg' | 'column' | 'dark';
export interface CardGeo { x: number; y: number; w: number; h: number; rot: number }
export interface StarterLayout {
  /** 'cards': three cards side by side. 'focus': three Pokémon with one detail panel (spotlight, triangle). */
  mode: 'cards' | 'focus';
  shape: CardShape;
  card: (i: number) => CardGeo;
  /** Dark text for light cards. */
  ink: string;
  muted: string;
  /** Colour of the heading and footer text. */
  head: string;
  /** Per-card fill colour (manga columns). */
  fills?: number[];
  /** Name, types and moves only (no stat block). */
  brief?: boolean;
  /** Sprite scale multiplier and how far down the card its feet stand (0..1). */
  spriteK?: number;
  /** Focus mode: where the Pokémon stands (spotlight: by place relative to the focus; triangle: by index), and its scale. */
  spot?: (i: number) => { x: number; y: number; k: number };
  panel?: { x: number; y: number; w: number; h: number };
  circle?: boolean;
}

const row = (w: number, h: number, y: number, gap = 24, rot: (i: number) => number = () => 0) => (i: number): CardGeo => ({ x: (960 - (w * 3 + gap * 2)) / 2 + i * (w + gap), y, w, h, rot: rot(i) });

export const STARTER_LAYOUTS: Record<string, StarterLayout> = {
  aero: { mode: 'cards', head: '#0b2a52', shape: 'glass', card: row(280, 400, 100), ink: '#0b2a52', muted: '#35567a', circle: true },
  wii: { mode: 'cards', head: '#33404c', shape: 'plain', card: row(280, 400, 100), ink: '#33404c', muted: '#5a6672' },
  meadow: { mode: 'cards', head: '#ffffff', shape: 'none', card: row(260, 360, 110, 40), ink: '#ffffff', muted: '#d8e8d0', brief: true, spriteK: 1.25 },
  pack: { mode: 'cards', head: '#ffd23a', shape: 'gold', card: row(250, 370, 120, 30, (i) => (i - 1) * 7), ink: '#3a2a10', muted: '#6a5a30' },
  egg: { mode: 'cards', head: '#6a3a50', shape: 'egg', card: row(240, 330, 120, 40), ink: '#6a3a50', muted: '#9a6a80', brief: true },
  manga: { mode: 'cards', head: '#111111', shape: 'column', card: (i) => ({ x: i * 320, y: 0, w: 320, h: 540, rot: 0 }), ink: '#111111', muted: '#222222', fills: [0xffa84a, 0x6ab0ff, 0x8ad84a], brief: true, spriteK: 1.5 },
  wizard: { mode: 'cards', head: '#ffffff', shape: 'dark', card: row(250, 380, 80, 20), ink: '#ffffff', muted: '#9aa8c8' },
  spotlight: { mode: 'focus', head: '#ffffff', shape: 'none', card: row(1, 1, 0), ink: '#ffffff', muted: '#d0e0c0', spot: (rel) => [{ x: 480, y: 440, k: 1.6 }, { x: 760, y: 400, k: 0.75 }, { x: 200, y: 400, k: 0.75 }][rel]!, panel: { x: 600, y: 104, w: 336, h: 110 } },
  triangle: { mode: 'focus', head: '#ffffff', shape: 'none', card: row(1, 1, 0), ink: '#ffffff', muted: '#d8f0ff', circle: true, spot: (i) => [{ x: 230, y: 230, k: 1.2 }, { x: 140, y: 430, k: 0.9 }, { x: 330, y: 430, k: 0.9 }][i]!, panel: { x: 520, y: 110, w: 400, h: 150 } },
};

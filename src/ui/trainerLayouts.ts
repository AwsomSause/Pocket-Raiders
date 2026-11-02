// Trainer select layouts (screens redesign group C): grid and profile geometry plus colours per look,
// following redesign/trainer/. Pure data; TrainerSelectScene draws from it.
export interface TrainerLayout {
  cols: number;
  rows: number;
  gridX: number;
  gridY: number;
  cellW: number;
  cellH: number;
  gap: number;
  /** 'side': tall profile at the left; 'strip': a wide strip along the bottom. */
  profile: 'side' | 'strip';
  /** Side profile width, or the strip rectangle. */
  leftW: number;
  strip?: { x: number; y: number; w: number; h: number };
  /** Cell fill for an open cell (a list cycles by index, e.g. the manga columns). */
  cellFill: number[];
  lockedFill: number;
  cellBorder: number;
  panelFill: number;
  panelBorder: number;
  /** Light looks recolour the profile text dark. */
  light: boolean;
  spriteMax: number;
  /** Show the name above each cell. */
  names: boolean;
  /** Side profile: a big trainer picture instead of the small one; the text column narrows to `textW` and starts at `lowerTop`. */
  hero?: { x: number; y: number; h: number; max: number; nameSize: number };
  textW?: number;
  lowerTop?: number;
}

const BASE = { gap: 8, names: true, spriteMax: 2 };
export const TRAINER_LAYOUTS: Record<string, TrainerLayout> = {
  aero: { ...BASE, cols: 4, rows: 3, gridX: 356, gridY: 18, cellW: 140, cellH: 156, profile: 'side', leftW: 324, cellFill: [0xeaf6ff], lockedFill: 0xb8d4ea, cellBorder: 0xffffff, panelFill: 0xf2faff, panelBorder: 0xffffff, light: true },
  fighter: { ...BASE, cols: 4, rows: 3, gridX: 560, gridY: 84, cellW: 86, cellH: 116, gap: 6, profile: 'side', leftW: 520, cellFill: [0x14308a], lockedFill: 0x0a1a52, cellBorder: 0xffd23a, panelFill: 0xb81c28, panelBorder: 0xffffff, light: false, names: false, spriteMax: 1.4, hero: { x: 400, y: 512, h: 420, max: 7, nameSize: 60 }, textW: 220, lowerTop: 150 },
  mii: { ...BASE, cols: 6, rows: 2, gridX: 14, gridY: 12, cellW: 148, cellH: 190, gap: 6, profile: 'strip', leftW: 0, strip: { x: 14, y: 416, w: 932, h: 104 }, cellFill: [0xffffff], lockedFill: 0xe3e7ec, cellBorder: 0xc9d3de, panelFill: 0xffffff, panelBorder: 0xc9d3de, light: true },
  card: { ...BASE, cols: 3, rows: 4, gridX: 690, gridY: 18, cellW: 80, cellH: 120, gap: 6, profile: 'side', leftW: 640, cellFill: [0xf6f0dc], lockedFill: 0x8aa0c8, cellBorder: 0xd8505a, panelFill: 0xf0d878, panelBorder: 0x1a3a8a, light: true, names: false, spriteMax: 1.1, hero: { x: 530, y: 480, h: 280, max: 5, nameSize: 44 }, textW: 330, lowerTop: 130 },
  manga: { ...BASE, cols: 6, rows: 1, gridX: 0, gridY: 0, cellW: 160, cellH: 424, gap: 0, profile: 'strip', leftW: 0, strip: { x: 8, y: 432, w: 944, h: 100 }, cellFill: [0xe04a3a, 0x4ac05a, 0xb0b0b0, 0xffd23a, 0x3a8ae0, 0xb04ae0], lockedFill: 0x3a3a46, cellBorder: 0x111111, panelFill: 0xffffff, panelBorder: 0x111111, light: true, spriteMax: 2.6 },
  gallery: { ...BASE, cols: 6, rows: 2, gridX: 20, gridY: 14, cellW: 146, cellH: 190, gap: 8, profile: 'strip', leftW: 0, strip: { x: 20, y: 424, w: 920, h: 96 }, cellFill: [0xf2e6c8], lockedFill: 0xc9b894, cellBorder: 0x8a5a2a, panelFill: 0x3a2a1a, panelBorder: 0xe8c878, light: false },
  storybook: { ...BASE, cols: 4, rows: 3, gridX: 660, gridY: 18, cellW: 66, cellH: 110, gap: 8, profile: 'side', leftW: 600, cellFill: [0x4ac05a, 0xb0b0b0, 0xffd23a, 0x3a8ae0, 0xb04ae0, 0x3ac0c8, 0xf06aa0, 0xe08a3a], lockedFill: 0x2a2a36, cellBorder: 0xffffff, panelFill: 0xd24a3a, panelBorder: 0xffffff, light: false, names: false, spriteMax: 1, hero: { x: 420, y: 500, h: 340, max: 6, nameSize: 52 }, textW: 270, lowerTop: 140 },
};

// DOMINION: the PixelLab armband icons (Kice's sheets A to Z, public/assets/images/dominion/armbands/<letter>.png).
// Each sheet is 8 x 8 cells of 32 px: the same band in 8 colourways (columns) and 8 shapes (rows), with the letter on it.
// Pure: the team's initial and primary colour pick the sheet and the cell. No RNG, nothing is saved.

import sheetsRaw from '../../data/dominion/armbandSheets.json';

const SHEETS = sheetsRaw as { row0: Record<string, string[]> };

export const ARMBAND_CELL = 32;
export const ARMBAND_SHEET = 256;
/** The shape used everywhere (row 0: the plain cuff, the one that reads best small). */
export const ARMBAND_ROW = 0;

const rgb = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/** The cell (column of row 0) of the initial's sheet whose colour is nearest the team's primary. The colourway order differs
 *  per sheet, so each sheet's own colours are in armbandSheets.json (tools/dominion/armbands/sheets.py). */
export function armbandColumn(initial: string, primary: string): number {
  const cols = SHEETS.row0[initial.trim().toUpperCase()];
  if (!cols) return 0;
  const p = rgb(primary);
  let best = 0, bd = Infinity;
  cols.forEach((hex, col) => {
    const c = rgb(hex);
    const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
    if (d < bd) { bd = d; best = col; }
  });
  return best;
}

/** The sheet file (relative to assets/images) for an initial, or null if it isn't A to Z. */
export function armbandFile(initial: string): string | null {
  const L = initial.trim().toUpperCase();
  return /^[A-Z]$/.test(L) ? `dominion/armbands/${L}.png` : null;
}

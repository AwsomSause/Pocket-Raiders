// Footprint sheet lookup for the Pokédex page (tools/drive/build-footprints.py). Presentation only.

import cells from '../../assets/footprints.json';
import jetSpeciesJson from '../../data/jetSpecies.json';

const CELLS = cells as Record<string, number>;
/** Jet Pokédex species print like the species they are built on. */
const JET_BASE = jetSpeciesJson.footprintBase as Record<string, string>;
export const FOOTPRINT_COLS = 32;
export const FOOTPRINT_SIZE = 32;

/** The sheet cell for a species; Megas, regional and other forms fall back to the print of the base they end with ("charizard-mega-x" -> "charizard"). */
export function footprintCell(speciesId: string): number | null {
  for (let id = speciesId; ; ) {
    const c = CELLS[id];
    if (c !== undefined) return c;
    const jb = JET_BASE[id];
    if (jb && jb !== id) return footprintCell(jb);
    const cut = id.lastIndexOf('-');
    if (cut < 0) return null;
    id = id.slice(0, cut);
  }
}

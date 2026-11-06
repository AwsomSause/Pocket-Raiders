// What the transformation cinematics (cinematics.ts) use and how long they
// run. No Phaser here, so tests can check it.

import { TRANSFORM_MS, type TransformKind } from '../../core/presentation/transformAnims';

export type CineKind = TransformKind;

/** Everything the cinematics draw, loaded when a battle starts. */
export const CINE_ASSETS = [
  'cine.primega.mega', 'cine.primega.alpha', 'cine.primega.omega',
  'cine.raid.max.bg', 'cine.raid.max.icon', 'cine.raid.max.spiral', 'cine.raid.max.spiral2',
  'cine.raid.ultra.bg', 'cine.raid.ultra.icon', 'cine.raid.tera.bg',
  'cine.raid.transitions.black_bars', 'cine.raid.transitions.impact', 'cine.raid.transitions.shine',
  'cine.dbk.mega.orb_1', 'cine.dbk.mega.shine', 'cine.dbk.primal.icon_groudon', 'cine.dbk.primal.icon_kyogre', 'cine.dbk.zpower.particle',
  'cine.dbk.tera.crystal_1', 'cine.dbk.tera.crystal_2', 'cine.dbk.tera.crystal_3', 'cine.dbk.tera.crystal_4', 'cine.dbk.tera.icon', 'cine.dbk.tera.pulse', 'cine.dbk.tera.shine',
  'cine.key.mega', 'cine.key.zmove', 'cine.key.dynamax', 'cine.key.tera', 'cine.key.alpha', 'cine.key.omega',
  'cine.sfx.mega1', 'cine.sfx.mega2',
];

/** The key item that rises and glows as a transformation starts (the Mega Ring, Z-Ring, Dynamax Band, Tera Orb, or a Primal's orb). */
export function keyItemFor(kind: CineKind, crystal?: 'mega' | 'alpha' | 'omega'): string | null {
  if (kind === 'primal') return crystal === 'alpha' ? 'cine.key.alpha' : 'cine.key.omega';
  if (kind === 'mega') return 'cine.key.mega';
  if (kind === 'zmove') return 'cine.key.zmove';
  if (kind === 'dynamax' || kind === 'gigantamax') return 'cine.key.dynamax';
  if (kind === 'tera') return 'cine.key.tera';
  return null;
}
/** Essentials animation sounds the cinematics use (already imported with the pack animations). */
export const CINE_SOUNDS = ['ess-harden', 'ess-twine', 'ess-refresh', 'ess-shell-smash', 'ess-explosion', 'ess-flash2'];

/** How long each cinematic runs at normal speed, in ms (full motion). */
export const CINE_MS: Record<CineKind, number> = TRANSFORM_MS;
/** When the new form appears, in ms from the start. */
export const SWAP_AT: Record<CineKind, number> = { mega: 2900, primal: 1350, dynamax: 1700, gigantamax: 1700, dynamaxEnd: 250, zmove: 1900, tera: 1300, evolve: 1900 };

/** How much larger a Dynamaxed Pokémon is drawn than normal (after the reference footage: it towers over the field). */
export const DYNAMAX_SCALE = 2.1;

/** The full Dynamax scene's length and the moment the giant Pokémon appears (the short "Fast Dynamax" scene uses CINE_MS / SWAP_AT). */
export const DYNAMAX_LONG_MS = 5600;
export const DYNAMAX_LONG_SWAP_AT = 4100;

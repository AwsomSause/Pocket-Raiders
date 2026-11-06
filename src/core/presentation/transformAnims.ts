// The transformation cinematics (Mega Evolution, Primal Reversion, Dynamax,
// Gigantamax, Z-Moves, Terastallization) and the evolution scene, registered in
// the central animation registry (animRegistry.ts) so they honour the player's
// animation settings like every other animation: their own on/off switch
// (category 'transform', or 'evolution' for evolving), speed, intensity, shake
// and reduced motion. The drawing is in ui/battleFx/cinematics.ts. Pure data,
// no Phaser and no random numbers; the battle's result never waits on these.

import { registerAnims } from './animRegistry';

export type TransformKind = 'mega' | 'primal' | 'dynamax' | 'gigantamax' | 'dynamaxEnd' | 'zmove' | 'tera' | 'evolve';

/** How long each cinematic runs at normal speed, in ms (full motion). */
export const TRANSFORM_MS: Record<TransformKind, number> = { mega: 4300, primal: 2500, dynamax: 2400, gigantamax: 2400, dynamaxEnd: 650, zmove: 1900, tera: 2200, evolve: 2700 };

export const transformAnimId = (kind: TransformKind): string => (kind === 'evolve' ? 'evolution.evolve' : `transform.${kind}`);

const COLORS: Record<TransformKind, string> = {
  mega: '#d070ff', primal: '#ff4a2a', dynamax: '#ff3060', gigantamax: '#ff3060', dynamaxEnd: '#ff3060', zmove: '#ffe060', tera: '#9fe8ff', evolve: '#9fe8ff',
};
const TRIGGERS: Record<TransformKind, string> = {
  mega: 'Mega Evolution', primal: 'Primal Reversion', dynamax: 'Dynamax', gigantamax: 'Gigantamax', dynamaxEnd: 'Dynamax ends', zmove: 'Z-Move', tera: 'Terastallization', evolve: 'evolution',
};

registerAnims(
  (Object.keys(TRANSFORM_MS) as TransformKind[]).map((kind) => ({
    id: transformAnimId(kind),
    category: kind === 'evolve' ? ('evolution' as const) : ('transform' as const),
    ms: TRANSFORM_MS[kind],
    color: COLORS[kind],
    trigger: TRIGGERS[kind],
    shakes: kind !== 'evolve',
    flashes: true,
    particles: kind !== 'dynamaxEnd',
  })),
);

// DOMINION slice D27: Effects & motion (Settings · Dominion, mockup m2). Pure: resolves what the Dominion screens may
// play from the Dominion switches AND the game's own Motion, flash and particle settings ("Follows the game's Motion
// setting"). Presentation only: no rule ever reads this, so an outcome never depends on it.

import type { Settings } from '../state';
import type { DominionFx } from './schema';

export interface FxNow {
  level: DominionFx['level'];
  particles: boolean;
  /** Boss order cut-ins and big result moments (D30 reads this). */
  cutIns: boolean;
  shake: boolean;
  flashes: DominionFx['flashes'];
  /** True when the game's own settings turned something down (the LINKED pill says why). */
  linked: boolean;
}

/** A preset tile's switches (Full show, Lighter, Calm). */
export function presetFx(level: DominionFx['level']): DominionFx {
  if (level === 'calm') return { level, particles: false, cutIns: 'skip', shake: false, flashes: 'off' };
  if (level === 'lighter') return { level, particles: false, cutIns: 'show', shake: true, flashes: 'soft' };
  return { level, particles: true, cutIns: 'show', shake: true, flashes: 'on' };
}

/** The game's own Motion: animations off (or the Reduced Motion profile) means Calm; reduced battle motion means Lighter at most. */
function gameCap(s: Settings): DominionFx['level'] {
  if (s.disableAllAnimations || !s.menuAnimations || s.battleAnimations === 'off' || s.accessibilityProfile === 'reducedMotion') return 'calm';
  if (s.battleAnimations === 'reduced') return 'lighter';
  return 'full';
}

const RANK = { full: 0, lighter: 1, calm: 2 } as const;
const FLASH = { on: 0, soft: 1, off: 2 } as const;
const FLASHES = ['on', 'soft', 'off'] as const;

interface GameLimits { cap: DominionFx['level']; reducedFlash: boolean; noParticles: boolean; noShake: boolean }

function resolve(p: DominionFx, g: GameLimits): Omit<FxNow, 'linked'> {
  const level = RANK[g.cap] > RANK[p.level] ? g.cap : p.level;
  const floor = presetFx(level);
  let flash = Math.max(FLASH[p.flashes], FLASH[floor.flashes]);
  if (g.reducedFlash) flash = Math.max(flash, FLASH.soft);
  return {
    level,
    particles: p.particles && floor.particles && !g.noParticles,
    cutIns: p.cutIns === 'show' && floor.cutIns === 'show',
    shake: p.shake && floor.shake && !g.noShake,
    flashes: FLASHES[flash]!,
  };
}

export function fxOf(s: Settings): FxNow {
  const p = s.expansion.dominionPrefs.fx;
  const own = resolve(p, { cap: 'full', reducedFlash: false, noParticles: false, noShake: false });
  const now = resolve(p, { cap: gameCap(s), reducedFlash: s.reducedFlash, noParticles: s.reduceParticles, noShake: s.shakeIntensity <= 0 });
  return { ...now, linked: JSON.stringify(own) !== JSON.stringify(now) };
}

/** Classes the Dominion screens wear for the resolved effects (fx.css turns each one down). */
export function fxClasses(f: FxNow): string {
  return [`fx-${f.level}`, f.particles ? '' : 'fx-nopart', f.shake ? '' : 'fx-noshake', f.flashes === 'on' ? '' : `fx-flash-${f.flashes}`].filter(Boolean).join(' ');
}

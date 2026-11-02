// The pattern a Terastallized or Dynamaxed Pokémon wears (Deluxe Battle Kit
// style): its Tera crystal or the red Dynamax energy, laid over the sprite's
// own pixels and drifting slowly; or a status condition's pulsing overlay. A small WebGL post effect on the sprite; on
// the Canvas renderer, or before the pattern has loaded, the caller keeps its
// plain tint instead. Presentation only.

import Phaser from 'phaser';
import { services } from '../../game/services';
import type { MotionLevel } from '../aero';
import { loadAssets } from '../lazyAssets';
import type { Visual } from '../sprites';
import { PATTERN_ALPHA, PATTERN_DRIFT } from './formLook';

const NAME = 'FormPatternFX';

const FRAG = `
#define SHADER_NAME FORM_PATTERN_FS
precision mediump float;
uniform sampler2D uMainSampler;
uniform sampler2D uPattern;
uniform vec2 uResolution;
uniform vec2 uPatternSize;
uniform vec2 uOffset;
uniform float uAlpha;
varying vec2 outTexCoord;
void main() {
  vec4 base = texture2D(uMainSampler, outTexCoord);
  vec4 pat = texture2D(uPattern, fract((outTexCoord * uResolution + uOffset) / uPatternSize));
  float k = uAlpha * pat.a;
  gl_FragColor = vec4(mix(base.rgb, pat.rgb * base.a, k), base.a);
}
`;

class FormPatternFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  patternKey = '';
  offset = 0;
  alpha = PATTERN_ALPHA;

  constructor(game: Phaser.Game) {
    super({ game, name: NAME, fragShader: FRAG });
  }

  override onDraw(target: Phaser.Renderer.WebGL.RenderTarget): void {
    const source = this.patternKey ? this.game.textures.get(this.patternKey).source[0] : undefined;
    if (source?.glTexture) {
      this.bindTexture(source.glTexture, 1);
      this.set1i('uPattern', 1);
      this.set2f('uResolution', target.width, target.height);
      this.set2f('uPatternSize', source.width, source.height);
      this.set2f('uOffset', this.offset, this.offset * 0.5);
      this.set1f('uAlpha', this.alpha);
    } else {
      this.set1f('uAlpha', 0);
    }
    this.bindAndDraw(target);
  }
}

function pipelines(scene: Phaser.Scene): Phaser.Renderer.WebGL.PipelineManager | null {
  const r = scene.renderer;
  if (!(r instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return null;
  if (!r.pipelines.postPipelineClasses.has(NAME)) r.pipelines.addPostPipeline(NAME, FormPatternFX);
  return r.pipelines;
}

/** What keeps a worn pattern moving (drift or pulse), so a new pattern or `dropPattern` can stop it. */
const ticks = new WeakMap<Phaser.GameObjects.Sprite, () => void>();
function stopTick(visual: Phaser.GameObjects.Sprite): void {
  ticks.get(visual)?.();
  ticks.delete(visual);
}

export interface PatternLook {
  /** Fixed opacity (default DBK's 150/255). */
  alpha?: number;
  /** Pulse between two opacities instead (status patterns); still at the middle when motion isn't full. */
  pulse?: { min: number; max: number; periodMs: number };
  /** Drift slowly (Tera/Dynamax; default true). */
  drift?: boolean;
}

/**
 * Lays the pattern `key` over a Pokémon sprite and calls `onWorn` (where the
 * caller drops its stand-in tint). Nothing happens on the Canvas renderer, on
 * a placeholder visual, or when the pattern isn't in the game, so the tint
 * stays. If the pattern is still loading it appears once it has, as long as
 * the sprite is still on screen.
 */
export function wearPattern(scene: Phaser.Scene, visual: Visual, key: string, motion: MotionLevel, onWorn: () => void, look: PatternLook = {}): void {
  if (!(visual instanceof Phaser.GameObjects.Sprite) || !pipelines(scene) || !services().assets.has(key)) return;
  // The latest wish wins: a pattern that finishes loading after another was asked for is not applied.
  visual.setData('pattern', key);
  const apply = () => {
    if (!visual.active || visual.getData('pattern') !== key) return;
    visual.setPostPipeline(NAME);
    const fx = visual.getPostPipeline(NAME) as FormPatternFX | FormPatternFX[];
    const one = Array.isArray(fx) ? fx[0] : fx;
    if (!one) return;
    stopTick(visual);
    one.patternKey = key;
    one.offset = 0;
    one.alpha = look.pulse ? (look.pulse.min + look.pulse.max) / 2 : (look.alpha ?? PATTERN_ALPHA);
    onWorn();
    if (motion !== 'full') return;
    const pulse = look.pulse;
    const drift = look.drift ?? !pulse;
    if (!pulse && !drift) return;
    let t = 0;
    // A slow drift like DBK's, or the status pulse (still when motion is reduced).
    const tick = (_t: number, dt: number) => {
      t += dt;
      if (drift) one.offset = (one.offset + (dt * PATTERN_DRIFT) / 1000) % 4096;
      if (pulse) one.alpha = pulse.min + ((pulse.max - pulse.min) * (1 - Math.cos((t / pulse.periodMs) * Math.PI * 2))) / 2;
    };
    scene.events.on(Phaser.Scenes.Events.UPDATE, tick);
    const stop = () => scene.events.off(Phaser.Scenes.Events.UPDATE, tick);
    ticks.set(visual, stop);
    visual.once(Phaser.GameObjects.Events.DESTROY, stop);
  };
  if (scene.textures.exists(key)) apply();
  else void loadAssets(scene, [key]).then(apply).catch(() => undefined);
}

/** The pattern a sprite wears or is waiting for, or null. */
export const wornPattern = (visual: Visual | null): string | null => (visual instanceof Phaser.GameObjects.Sprite && visual.active ? ((visual.getData('pattern') as string | null) ?? null) : null);

/** Takes the pattern off again (the sprite returns to its own colours). */
export function dropPattern(visual: Visual | null): void {
  if (!(visual instanceof Phaser.GameObjects.Sprite)) return;
  stopTick(visual);
  if (!visual.active) return;
  visual.setData('pattern', null);
  visual.removePostPipeline(NAME);
}

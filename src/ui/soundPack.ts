// Builds the Web Audio chain for the chosen sound pack (S261) and puts it between Phaser's master volume and the speakers.
// Audio failures are never fatal: with no Web Audio the game just plays the original sound.

import type Phaser from 'phaser';
import { crushSample, SOUND_PACKS, type FilterStage, type SoundPackId } from '../core/presentation/soundPack';

let applied: SoundPackId = 'original';
let wired: { master: AudioNode; out: AudioNode; nodes: AudioNode[] } | null = null;

function curve(bits: number): Float32Array<ArrayBuffer> {
  const n = 1024;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) c[i] = crushSample((i / (n - 1)) * 2 - 1, bits);
  return c;
}

function impulse(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    // A fixed pseudo-noise decay so the room sounds the same every time (never the gameplay RNG).
    let s = 12345 + ch * 777;
    for (let i = 0; i < len; i++) {
      s = (s * 1664525 + 1013904223) >>> 0;
      d[i] = ((s / 4294967296) * 2 - 1) * (1 - i / len) ** 2.5;
    }
  }
  return buf;
}

/** Builds one stage as [input, output] nodes. */
function build(ctx: AudioContext, st: FilterStage): [AudioNode, AudioNode] {
  if (st.kind === 'highpass' || st.kind === 'lowpass') {
    const f = ctx.createBiquadFilter();
    f.type = st.kind;
    f.frequency.value = st.hz;
    if (st.q) f.Q.value = st.q;
    return [f, f];
  }
  if (st.kind === 'lowshelf' || st.kind === 'highshelf') {
    const f = ctx.createBiquadFilter();
    f.type = st.kind;
    f.frequency.value = st.hz;
    f.gain.value = st.gainDb;
    return [f, f];
  }
  if (st.kind === 'crush') {
    const w = ctx.createWaveShaper();
    w.curve = curve(st.bits);
    return [w, w];
  }
  const rv = st as Extract<FilterStage, { kind: 'reverb' }>;
  const inp = ctx.createGain();
  const out = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const conv = ctx.createConvolver();
  conv.buffer = impulse(ctx, rv.seconds);
  dry.gain.value = 1 - rv.wet * 0.5;
  wet.gain.value = rv.wet;
  inp.connect(dry).connect(out);
  inp.connect(conv).connect(wet).connect(out);
  return [inp, out];
}

export const currentSoundPack = (): SoundPackId => applied;

/** Applies a sound pack to the game's audio. Safe to call often; does nothing if the pack is unchanged. */
export function applySoundPack(game: Phaser.Game, id: SoundPackId): void {
  try {
    const mgr = game.sound as Phaser.Sound.WebAudioSoundManager;
    const ctx = mgr.context;
    const master = mgr.masterVolumeNode;
    if (!ctx || !master) return;
    if (id === applied && wired) return;
    if (id === applied && id === 'original') return;
    // Take down the old chain, then wire master -> stages -> speakers.
    master.disconnect();
    wired?.out.disconnect();
    for (const n of wired?.nodes ?? []) n.disconnect();
    wired = null;
    applied = id;
    const stages = SOUND_PACKS[id].stages;
    if (!stages.length) {
      master.connect(ctx.destination);
      return;
    }
    let head: AudioNode = master;
    const nodes: AudioNode[] = [];
    for (const st of stages) {
      const [i, o] = build(ctx, st);
      head.connect(i);
      nodes.push(i, o);
      head = o;
    }
    head.connect(ctx.destination);
    wired = { master, out: head, nodes };
  } catch {
    // No Web Audio (or a locked context): keep the original sound.
  }
}

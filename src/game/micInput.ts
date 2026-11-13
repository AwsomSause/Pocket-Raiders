// Beta 0.6 MIC1: optional microphone input (decision N). Measures loudness only: audio is never recorded, stored or sent.
// Lives in the game layer (not src/core). The mic is asked for only when a screen that uses it opens AND the player has
// turned on Settings > Controls > Microphone. A button always does the same thing, so a screen must never wait on the mic.
// Nothing here touches gameplay RNG; a screen decides what a shout does and records only that action.

/** Loudness 0..1 of a block of samples (root mean square). Pure. */
export function rmsLevel(samples: ArrayLike<number>): number {
  const n = samples.length;
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += samples[i]! * samples[i]!;
  return Math.min(1, Math.sqrt(sum / n));
}

/**
 * Pure shout detector. Feed it (level, time) every frame; it fires once when the level stays at or above `threshold`
 * for `holdMs`, then needs the level to drop below the threshold again before it can fire a second time.
 */
export class ShoutDetector {
  private since: number | null = null;
  private armed = true;
  constructor(readonly threshold = 0.25, readonly holdMs = 250) {}

  feed(level: number, nowMs: number): boolean {
    if (level < this.threshold) {
      this.since = null;
      this.armed = true;
      return false;
    }
    if (!this.armed) return false;
    this.since ??= nowMs;
    if (nowMs - this.since < this.holdMs) return false;
    this.armed = false;
    this.since = null;
    return true;
  }
}

export type MicState = 'off' | 'starting' | 'on' | 'denied' | 'unsupported';

export type GetStream = () => Promise<MediaStream>;

const browserStream: GetStream = () => navigator.mediaDevices.getUserMedia({ audio: true, video: false });

export const micSupported = (): boolean =>
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof AudioContext !== 'undefined';

/** A live loudness meter on the microphone. One per screen; call stop() when the screen closes. */
export class MicMeter {
  state: MicState = 'off';
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private buf: Float32Array<ArrayBuffer> | null = null;

  constructor(private readonly getStream: GetStream = browserStream) {}

  /** Starts listening if `enabled` (the setting). Resolves with the resulting state; never throws. */
  async start(enabled: boolean): Promise<MicState> {
    if (!enabled) return (this.state = 'off');
    if (this.state === 'on' || this.state === 'starting') return this.state;
    if (!micSupported()) return (this.state = 'unsupported');
    this.state = 'starting';
    try {
      const stream = await this.getStream();
      if (this.state !== 'starting') {
        stream.getTracks().forEach((t) => t.stop());
        return this.state;
      }
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser); // not connected to the speakers, so no feedback
      this.stream = stream;
      this.ctx = ctx;
      this.analyser = analyser;
      this.buf = new Float32Array(analyser.fftSize);
      return (this.state = 'on');
    } catch {
      return (this.state = 'denied');
    }
  }

  /** Current loudness 0..1 (0 when the mic is not on). */
  level(): number {
    if (this.state !== 'on' || !this.analyser || !this.buf) return 0;
    this.analyser.getFloatTimeDomainData(this.buf);
    return rmsLevel(this.buf);
  }

  stop(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close().catch(() => undefined);
    this.stream = this.ctx = this.analyser = this.buf = null;
    this.state = 'off';
  }
}

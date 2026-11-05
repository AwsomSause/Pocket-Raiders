// RNG Stream Visualizer (idea S333): a debug view of a run's named streams. It copies each stream's state and reads
// ahead on the copy, so looking never advances or changes a real roll. Pure.

import { Rng, STREAM_NAMES, type RngStreams } from '../rng';

export interface StreamView { name: string; state: string; next: number[] }

const hex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');

/** For each stream: its state as hex and the next `count` values in [0, 1) that it will give (read on a copy). */
export function peekStreams(streams: RngStreams, count = 3): StreamView[] {
  return STREAM_NAMES.map((name) => {
    const s = streams[name];
    const copy = new Rng(s);
    return { name, state: `${hex(s.a)} ${hex(s.b)} ${hex(s.c)} ${hex(s.d)}`, next: Array.from({ length: count }, () => Math.round(copy.float() * 10000) / 10000) };
  });
}

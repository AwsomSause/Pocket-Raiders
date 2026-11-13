// Beta 0.6 minigames, batch 2: Orchestra (rhythm). Pure state machine like the other games; a tick is one fixed beat, so
// timing is judged in fixed windows and never depends on animation. The "swell" cue is a plain action: the screen maps a
// button AND (when mic input is on) a loud sound to the same 'swell' action, so the outcome is identical either way.

import { Rng } from '../rng';
import type { BaseState, Cell, MinigameModule } from './games';

const SECTIONS = ['Strings', 'Brass', 'Winds', 'Drums'] as const;
/** A cue is either a section (0-3) or a swell (4). */
const SWELL = 4;
interface Cue {
  kind: number;
  /** The beat the cue lands on. */
  beat: number;
  hit: 0 | 1 | 2 | null;
}
interface OrchState extends BaseState {
  cues: Cue[];
  beat: number;
  end: number;
  score: number;
  combo: number;
  /** Beats either side of a cue that still count as "good" (0 = only exact is perfect). */
  window: number;
}
const orchestra: MinigameModule<OrchState> = {
  start(_c, p, rs) {
    const r = new Rng(rs);
    const cues: Cue[] = [];
    let beat = 2;
    for (let i = 0; i < p.cues!; i++) {
      cues.push({ kind: r.chance(p.swellChance! / 100) ? SWELL : r.int(0, 3), beat, hit: null });
      beat += r.int(2, 3);
    }
    return { rs: r.state, done: false, msg: '', tick: 0, cues, beat: 0, end: beat + 1, score: 0, combo: 0, window: p.window! };
  },
  view(_c, s) {
    const next = s.cues.find((q) => q.hit === null && q.beat >= s.beat - s.window);
    const cells: Cell[] = SECTIONS.map((n, i) => ({ id: String(i), label: n, tone: next?.kind === i ? (next.beat === s.beat ? 'hot' : 'info') : 'dim', disabled: s.done }));
    cells.push({ id: 'swell', label: 'Swell', detail: 'button or loud sound', tone: next?.kind === SWELL ? (next.beat === s.beat ? 'hot' : 'info') : 'dim', disabled: s.done });
    return {
      hud: [`Score: ${s.score}`, `Combo: ${s.combo}`, `Beat: ${s.beat}/${s.end}`, s.msg],
      prompt: next ? `Cue the ${next.kind === SWELL ? 'swell' : SECTIONS[next.kind]} ${next.beat > s.beat ? `in ${next.beat - s.beat}` : 'NOW'}.` : 'Hold the last note.',
      cols: 5,
      cells,
      done: s.done,
    };
  },
  act(_c, s, id) {
    if (s.done) return;
    const kind = id === 'swell' ? SWELL : Number(id);
    const q = s.cues.find((c) => c.hit === null && c.kind === kind && Math.abs(c.beat - s.beat) <= s.window);
    if (!q) {
      s.combo = 0;
      s.msg = 'Wrong cue!';
      return;
    }
    const perfect = q.beat === s.beat;
    q.hit = perfect ? 2 : 1;
    s.score += perfect ? 2 : 1;
    s.combo += 1;
    if (s.combo % 4 === 0) s.score += 1;
    s.msg = perfect ? 'Perfect!' : 'Good';
  },
  tick(_c, s) {
    if (s.done) return;
    s.beat += 1;
    for (const q of s.cues) if (q.hit === null && q.beat < s.beat - s.window) {
      q.hit = 0;
      s.combo = 0;
      s.msg = 'A cue was missed.';
    }
    if (s.beat >= s.end) s.done = true;
  },
  result: (s) => ({ score: Math.min(s.score, orchMax(s)), max: orchMax(s) }),
};
const orchMax = (s: OrchState): number => s.cues.length * 2 + Math.floor(s.cues.length / 4);

export const MINIGAMES_5: Record<string, MinigameModule<never>> = {
  orchestra: orchestra as never,
};

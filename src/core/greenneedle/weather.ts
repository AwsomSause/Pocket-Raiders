// Greenneedle gn.new.15, The Weather Station (doc GREENNEEDLE_PLACED_1.md lines 540–575).
// Forecast Ahead (Castform's ability) is in battle/engine.ts. The afterstory: a hand-written forecast pinned up at step 1
// of each later stage, right four times in five.
import type { Content, Weather } from '../contentSchema';
import { stageKey } from '../mapItems';
import { hashSeed, Rng } from '../rng';
import type { RunState } from '../state';
import { currentColumn } from '../map';
import { stageFronts } from '../world';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const LABEL: Record<string, string> = { rain: 'rain', sun: 'sun', sand: 'a sandstorm', snow: 'snow', hail: 'hail' };
const GUESS: Weather[] = ['rain', 'sun', 'sand', 'snow', 'hail'];

/** The pinned forecast's weather for this stage: the true front, or (one time in five) a wrong guess. null = "clear". */
export function pinnedWeather(content: Content, run: RunState): { weather: Weather | null; right: boolean } {
  const truth = stageFronts(content, run)[0]?.weather ?? null;
  const rng = new Rng(hashSeed(`${run.seed}::ws-pin::${stageKey(run)}`));
  if (!rng.chance(0.2)) return { weather: truth, right: true };
  const wrong = [...GUESS.filter((w) => w !== truth), null].filter((w) => w !== truth);
  return { weather: rng.pick(wrong) ?? null, right: false };
}

/** Step 1 of each later stage after the Station: one line, once a stage. Returns '' otherwise. */
export function pinLine(content: Content, run: RunState): string {
  const stage = run.stage;
  if (!stage || stage.kind !== 'stage' || stage.pseudo || f(run, 'ws-done') <= 0) return '';
  if (currentColumn(stage) > 1) return '';
  const at = run.regionIndex * 100 + stage.index + 1;
  if (f(run, 'ws-pin-at') === at) return '';
  run.story.flags['ev:ws-pin-at'] = at;
  const { weather } = pinnedWeather(content, run);
  return `Pinned to the board, in Nimbus Hart's hand: "Forecast for this stage: ${weather ? LABEL[weather] : 'nothing much'}. Probably."`;
}

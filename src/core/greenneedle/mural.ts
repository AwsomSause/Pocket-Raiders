// Greenneedle gn.new.25, The Mural (doc GREENNEEDLE_PLACED_2.md lines 175–212).
// A Smeargle paints one panel per stage. The subject is the first of: a walked-past event, a close call, a Pokémon caught,
// a kindness, the Gym. Each subject is painted once (the "seen" markers below), so the next stage looks further on.
// Every panel remembers what it shows (`mural-p<n>` the subject + 1, `mural-r<n>` which event, fight or catch), so the panel names the
// actual thing ({mural:passed}, {mural:foe}, {mural:caught}) and the ending walks the wall left to right ({mural:walk}).
// The Smeargle's first Sketch: the player picks any move used against them this region (gn ops `muralSketchOpen`, `muralSketchPage`, `muralSketch`).
import type { Content } from '../contentSchema';
import type { RunState } from '../state';

const k = (key: string): string => `ev:${key}`;
const f = (run: Pick<RunState, 'story'>, key: string): number => Number(run.story.flags[k(key)] ?? 0);
const put = (run: Pick<RunState, 'story'>, key: string, v: number): void => {
  run.story.flags[k(key)] = v;
};
const seqs = (run: RunState, type: string): number[] => run.story.events.filter((e) => e.type === type && e.where.region === run.regionIndex).map((e) => e.seq);

/** How many Sketch choices one page shows. */
export const SKETCH_PAGE = 2;
export const PAINTER = 'wall-painter';

/** Subject numbers (`mural-subject`): 0 walked past, 1 close call, 2 caught, 3 kindness, 4 the Gym. */
export function muralPick(run: RunState): number {
  const skips = run.story.world.skipped.filter((s) => s.kind === 'event' && s.region === run.regionIndex && s.stage > f(run, 'mural-skip'));
  const walked = f(run, 'kind-walked-past');
  const close = Math.max(0, ...seqs(run, 'closeCall'));
  const caught = Math.max(0, ...seqs(run, 'caught'));
  const helped = run.story.world.helped;
  let subject = 4;
  let ref = 0;
  if (skips.length > 0) {
    subject = 0;
    ref = Math.max(...skips.map((s) => s.stage));
    put(run, 'mural-skip', ref);
    // The panel's reference is the stage + 1 (0 = a Greenneedle event walked away from: no name is kept for those).
    ref += 1;
    put(run, 'mural-walked', walked);
  } else if (walked > f(run, 'mural-walked')) {
    // An event the player walked away from (`kind.walked_past`), without comment.
    subject = 0;
    put(run, 'mural-walked', walked);
  } else if (close > f(run, 'mural-close')) {
    subject = 1;
    ref = close;
    put(run, 'mural-close', close);
  } else if (caught > f(run, 'mural-caught')) {
    subject = 2;
    ref = caught;
    put(run, 'mural-caught', caught);
  } else if (helped > f(run, 'mural-helped')) {
    subject = 3;
    put(run, 'mural-helped', helped);
  }
  put(run, 'mural-subject', subject);
  const n = f(run, 'mural-panels') + 1;
  put(run, 'mural-panels', n);
  put(run, `mural-p${n}`, subject + 1);
  put(run, `mural-r${n}`, ref);
  return subject;
}

const speciesName = (content: Content, id: unknown): string => content.species.get(String(id ?? ''))?.name ?? '';
const storyEvent = (run: RunState, seq: number) => run.story.events.find((e) => e.seq === seq);

/** What panel `n` shows: the thing walked past, the foe of the close call, the Pokémon caught ('' when the record is gone). */
function panelFacts(content: Content, run: RunState, n: number): { subject: number; passed: string; foe: string; caught: string } {
  const subject = f(run, `mural-p${n}`) - 1;
  const ref = f(run, `mural-r${n}`);
  const out = { subject, passed: '', foe: '', caught: '' };
  if (subject === 0 && ref > 0) out.passed = [...run.story.world.skipped].reverse().find((s) => s.kind === 'event' && s.region === run.regionIndex && s.stage === ref - 1)?.label ?? '';
  if (subject === 1) out.foe = speciesName(content, storyEvent(run, ref)?.data.enemy);
  if (subject === 2) out.caught = speciesName(content, storyEvent(run, ref)?.data.speciesId);
  return out;
}

/** One line of the finished wall for panel `n` (1 = the player arriving). */
export function panelLine(content: Content, run: RunState, n: number): string {
  if (n <= 1) return 'The first panel: a small figure with a pack, walking into the town. You, arriving.';
  const p = panelFacts(content, run, n);
  switch (p.subject) {
    case 0: return p.passed ? `A panel of something you walked past: ${p.passed}. Nobody in it is looking at you. There is no comment.` : 'A panel of something you walked past: a door left ajar, a crowd turning round. Nobody in it is looking at you. There is no comment.';
    case 1: return p.foe ? `A panel of the fight you nearly lost: your Pokémon small and low, the ${p.foe} huge and bright, in the second before the turn.` : 'A panel of the fight you nearly lost: your Pokémon small and low, the foe huge and bright, in the second before the turn.';
    case 2: return p.caught ? `A panel of the ${p.caught} you caught, startled, one paw still raised, in the moment before it chose to stay.` : 'A panel of a Pokémon you caught, startled, in the moment before it chose to stay.';
    case 3: return 'A panel of a kindness: your hand held out, someone smaller and braver taking it. The warmest colours on the wall.';
    default: return 'A panel of the Gym: the door, the banner, the long way up the steps, and how you stood on them.';
  }
}

/** The ending: the player starts at the left end of the wall. */
export function muralWalkStart(run: RunState): string {
  put(run, 'mural-walk-at', 1);
  put(run, 'mural-walk-more', f(run, 'mural-panels') > 1 ? 1 : 0);
  return '';
}
/** One panel to the right. */
export function muralWalkOn(run: RunState): string {
  const at = Math.min(f(run, 'mural-panels'), f(run, 'mural-walk-at') + 1);
  put(run, 'mural-walk-at', at);
  put(run, 'mural-walk-more', at < f(run, 'mural-panels') ? 1 : 0);
  return '';
}

/** Moves used against the player this region, newest first, each once. */
export function movesAgainst(content: Content, run: RunState): string[] {
  const used = run.story.events.filter((e) => e.type === 'moveUsed' && e.data.side === 'enemy' && e.where.region === run.regionIndex).map((e) => String(e.data.moveId));
  return [...new Set(used.reverse())].filter((id) => content.moves.has(id) && id !== 'sketch' && id !== 'struggle');
}

function sketchSlots(content: Content, run: RunState, page: number): void {
  const moves = movesAgainst(content, run);
  for (let i = 0; i < SKETCH_PAGE; i++) put(run, `mural-sk-${i}`, page * SKETCH_PAGE + i < moves.length ? page * SKETCH_PAGE + i + 1 : 0);
  put(run, 'mural-sk-page', page);
  put(run, 'mural-sk-more', moves.length > SKETCH_PAGE ? 1 : 0);
}
/** The Smeargle lifts its brush: the first page of moves it may copy. */
export function muralSketchOpen(content: Content, run: RunState): string {
  sketchSlots(content, run, 0);
  return '';
}
/** The next page of moves (back to the first after the last). */
export function muralSketchPage(content: Content, run: RunState): string {
  const page = f(run, 'mural-sk-page') + 1;
  sketchSlots(content, run, page * SKETCH_PAGE < movesAgainst(content, run).length ? page : 0);
  return '';
}
/** Its first Sketch copies the move in slot `n` (0 or 1). Once: the painter's mark is spent. */
export function muralSketch(content: Content, run: RunState, n: number): string {
  const id = movesAgainst(content, run)[f(run, `mural-sk-${n}`) - 1];
  const mon = [...run.party, ...run.box].find((m) => m.speciesId === 'smeargle' && m.gn?.includes(PAINTER));
  const move = id ? content.moves.get(id) : undefined;
  if (!mon || !move || f(run, 'mural-sketched') > 0) return '';
  put(run, 'mural-sketched', 1);
  const entry = { id: move.id, pp: move.pp };
  // The Sketch itself becomes the move, as a Sketch does (with no Sketch left, the newest other move gives way).
  const at = mon.moves.findIndex((m) => m.id === 'sketch');
  if (mon.moves.some((m) => m.id === move.id)) return '';
  if (at >= 0) mon.moves[at] = entry;
  else if (mon.moves.length >= 4) mon.moves[mon.moves.length - 1] = entry;
  else mon.moves = [...mon.moves, entry];
  return `It paints ${move.name} in the air, once, and has it.`;
}

/** Text tokens: {mural:passed}, {mural:foe}, {mural:caught} (the newest panel), {mural:walk} (the panel the player stands at), {mural:move:<slot>}. */
export function muralTokens(content: Content, run: RunState, text: string): string {
  const newest = panelFacts(content, run, f(run, 'mural-panels'));
  return text
    .replace(/\{mural:passed\}/g, () => newest.passed || 'a door left ajar, a crowd turning round')
    .replace(/\{mural:foe\}/g, () => newest.foe || 'foe')
    .replace(/\{mural:caught\}/g, () => newest.caught || 'Pokémon')
    .replace(/\{mural:walk\}/g, () => panelLine(content, run, f(run, 'mural-walk-at')))
    .replace(/\{mural:move:([0-2])\}/g, (_, n: string) => content.moves.get(movesAgainst(content, run)[f(run, `mural-sk-${n}`) - 1] ?? '')?.name ?? 'Nothing');
}

/** The Smeargle joins, knowing Sketch. What its first Sketch copies is the player's pick (`muralSketch`). */
export function muralJoin(content: Content, run: RunState, host: { apply: (e: unknown) => string }): string {
  if (f(run, 'mural-end') > 0) return '';
  put(run, 'mural-end', 1);
  return host.apply({ kind: 'join', recall: false, species: ['smeargle'], types: [], levelBonus: 0, shinyMultiplier: 1, shadow: false, blissful: false, hiddenAbility: false, moves: [], direct: true, alpha: false, starterType: false, asIs: true, mark: PAINTER });
}

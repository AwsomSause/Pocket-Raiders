// Greenneedle gn.new.25, The Mural (doc GREENNEEDLE_PLACED_2.md lines 175–212).
// A Smeargle paints one panel per stage. The subject is the first of: a walked-past event, a close call, a Pokémon caught,
// a kindness, the Gym. Each subject is painted once (the "seen" markers below), so the next stage looks further on.
import type { Content } from '../contentSchema';
import type { RunState } from '../state';

const k = (key: string): string => `ev:${key}`;
const f = (run: Pick<RunState, 'story'>, key: string): number => Number(run.story.flags[k(key)] ?? 0);
const put = (run: Pick<RunState, 'story'>, key: string, v: number): void => {
  run.story.flags[k(key)] = v;
};
const seqs = (run: RunState, type: string): number[] => run.story.events.filter((e) => e.type === type && e.where.region === run.regionIndex).map((e) => e.seq);

/** Subject numbers (`mural-subject`): 0 walked past, 1 close call, 2 caught, 3 kindness, 4 the Gym. */
export function muralPick(run: RunState): number {
  const skips = run.story.world.skipped.filter((s) => s.kind === 'event' && s.region === run.regionIndex && s.stage > f(run, 'mural-skip'));
  const close = Math.max(0, ...seqs(run, 'closeCall'));
  const caught = Math.max(0, ...seqs(run, 'caught'));
  const helped = run.story.world.helped;
  let subject = 4;
  if (skips.length > 0) {
    subject = 0;
    put(run, 'mural-skip', Math.max(...skips.map((s) => s.stage)));
  } else if (close > f(run, 'mural-close')) {
    subject = 1;
    put(run, 'mural-close', close);
  } else if (caught > f(run, 'mural-caught')) {
    subject = 2;
    put(run, 'mural-caught', caught);
  } else if (helped > f(run, 'mural-helped')) {
    subject = 3;
    put(run, 'mural-helped', helped);
  }
  put(run, 'mural-subject', subject);
  put(run, 'mural-panels', f(run, 'mural-panels') + 1);
  return subject;
}

/** The Smeargle joins. Its Sketch has already copied the last move used against you this region (none yet: it keeps Sketch alone). */
export function muralJoin(content: Content, run: RunState, host: { apply: (e: unknown) => string }): string {
  if (f(run, 'mural-end') > 0) return '';
  put(run, 'mural-end', 1);
  const used = run.story.events.filter((e) => e.type === 'moveUsed' && e.data.side === 'enemy' && e.where.region === run.regionIndex).map((e) => String(e.data.moveId));
  const copied = [...used].reverse().find((id) => content.moves.has(id) && id !== 'sketch' && id !== 'struggle');
  const before = new Set([...run.party, ...run.box].map((m) => m.uid));
  const words = host.apply({ kind: 'join', recall: false, species: ['smeargle'], types: [], levelBonus: 0, shinyMultiplier: 1, shadow: false, blissful: false, hiddenAbility: false, moves: [], direct: true, alpha: false, starterType: false, asIs: true, mark: 'wall-painter' });
  const mon = [...run.party, ...run.box].find((m) => !before.has(m.uid) && m.speciesId === 'smeargle');
  if (mon && copied && !mon.moves.some((m) => m.id === copied)) {
    const entry = { id: copied, pp: content.moves.get(copied)!.pp };
    const at = mon.moves.length >= 4 ? mon.moves.map((m) => m.id).lastIndexOf(mon.moves.filter((m) => m.id !== 'sketch').pop()?.id ?? '') : -1;
    if (at >= 0) mon.moves[at] = entry;
    else mon.moves = [...mon.moves, entry];
  }
  return words;
}

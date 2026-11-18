// The Line page (design Part 3 section 7, Part 29): the three stops, what each allows and darkens, who a move costs by
// name before it's confirmed, and the hold-to-confirm hint. Works out what to draw; decides nothing.

import { EVIL_DATA, type EvilData } from './data';
import { whateverAllows } from './edges';
import { linePreview, lineName, realLine } from './line';
import { LINE_IDS, type EvilModeBlock, type LineId } from './schema';

export interface LineStopModel {
  id: LineId; name: string; feel: string; allows: string; darkens: string;
  current: boolean; sel: boolean;
  /** What moving here would do, by name; null on the current stop. */
  move: string | null;
}

export interface LineModel {
  title: string;
  stops: LineStopModel[];
  /** Why the selected stop can't be moved to now, or null. */
  problem: string | null;
  hint: string;
  real: string[];
}

export function lineModel(block: EvilModeBlock, sel: number, data: EvilData = EVIL_DATA): LineModel {
  const at = Math.max(0, Math.min(LINE_IDS.length - 1, sel));
  const stops = LINE_IDS.map((id, i): LineStopModel => {
    const f = data.founding.lines.find((l) => l.id === id)!;
    const st = data.line.stops.find((x) => x.id === id)!;
    const current = block.team.line === id;
    return { id, name: f.name, feel: f.feel, allows: id === 'whatever' ? whateverAllows(block, data) : st.allows, darkens: st.darkens, current, sel: i === at, move: current ? null : linePreview(block, id, data).text };
  });
  const target = LINE_IDS[at]!;
  const p = linePreview(block, target, data);
  return { title: `The Line · now ${lineName(block.team.line, data)}`, stops, problem: p.problem, hint: data.line.move.hold!, real: realLine(block, data) };
}

// Evil Mode slice 21: the edges, wired into the day (design Part 27 section 4, Part 5 section 8, Part 30 sections 6 and 10).
// `edgesAfter` runs after every step: the Appetites, Static and the Tear, the Incursion, the Heat lock while a Tear is open,
// and (only with the Shadow branch on) the Lab and Corruption's ladder. `edgesAct` takes the actions. `shadowOn` is the one
// guard in front of corruption.ts: with the branch removed nothing below calls into it. Pure.

import { holdingName } from './board';
import * as Shadow from './corruption';
import { EVIL_DATA, type EvilData } from './data';
import { fill } from './ledger';
import type { EvilModeBlock, TearChoice } from './schema';
import { chooseTear, edgesDistrictEnd, edgesMorning, givePlate, incursionAtSend, incursionsOn, openTear, tally } from './tear';

/** The Shadow branch is in this run: Settings > Evil Mode > Shadow branch was Available at founding (Kice: on by default). */
export const shadowOn = (block: EvilModeBlock, data: EvilData = EVIL_DATA): boolean => !!block.edges.shadow && block.settings.shadow && data.edges.shadow.on;

export type EdgesAction =
  | { type: 'tear'; choice: TearChoice }
  | { type: 'plate' }
  | { type: 'rig'; holdingId: string }
  | { type: 'labShut' }
  | { type: 'labRelieve' }
  | { type: 'purify' };

export const EDGE_ACTIONS: readonly string[] = ['tear', 'plate', 'rig', 'labShut', 'labRelieve', 'purify'];
export interface EdgesOut { block: EvilModeBlock; problem: string | null; lines: string[]; fight?: boolean }
const REMOVED = 'Not in this run.';

/** One of the edges' actions. Shadow ones are refused before corruption.ts is reached when the branch is removed. */
export function edgesAct(block: EvilModeBlock, a: EdgesAction, data: EvilData = EVIL_DATA): EdgesOut {
  if (a.type === 'tear') return incursionsOn(block, data) ? chooseTear(block, a.choice, data) : { block, problem: REMOVED, lines: [] };
  if (a.type === 'plate') return givePlate(block, data);
  if (!shadowOn(block, data)) return { block, problem: REMOVED, lines: [] };
  if (a.type === 'rig') {
    const h = block.district?.holdings.find((x) => x.id === a.holdingId);
    const p = Shadow.rigProblem(block, a.holdingId, data);
    if (p || !h) return { block, problem: p ?? 'Pick a holding.', lines: [] };
    return Shadow.rig(block, a.holdingId, holdingName(h, data), rigCard(block, a.holdingId, data), data);
  }
  if (a.type === 'labShut') return Shadow.shutLab(block, data);
  if (a.type === 'labRelieve') return Shadow.relieve(block, data);
  return Shadow.purify(block, data);
}

/** A Rig's Honest Card (Part 5 section 8.1): the Shadow Card; field 12 reads "Processed." (Part 29 section 6). */
export function rigCard(block: EvilModeBlock, holdingId: string, data: EvilData = EVIL_DATA): string[] {
  const h = block.district?.holdings.find((x) => x.id === holdingId);
  const name = h ? holdingName(h, data) : holdingId;
  const N = data.edges.shadow.numbers;
  const R = data.edges.shadow.rig;
  const [takes = R.card, from = name] = R.card.split('. From: ');
  return [`CAPTURE RIG · ${name.toUpperCase()} · THE DAY`, takes.replace(/^Takes: /, ''), from, `Kits for ${N.rigKits} Grunts.`, `Heat +${N.rigHeat}. Dread +${N.rigDread}. Corruption +${N.rigFirst} the first time.`, 'Certain. It\'s a machine.', 'Nobody. It runs by itself.', 'Anyone whose line is the land, or the Pokémon.', R.stripped, 'The kid will hear what was on the hill.', 'Nothing. It\'s all known.', 'Processed.', 'Leave the hill alone.'];
}

/** Shadow orders: answer a refusal by sending the Pokémon without its person (the job's queued by the caller). */
export function shadowOrderProblem(block: EvilModeBlock, data: EvilData = EVIL_DATA): string | null {
  return shadowOn(block, data) ? Shadow.ordersProblem(block, data) : REMOVED;
}
export function shadowOrderGiven(block: EvilModeBlock, names: string, data: EvilData = EVIL_DATA): EdgesOut {
  return shadowOn(block, data) ? Shadow.orderGiven(block, names, data) : { block, problem: REMOVED, lines: [] };
}

const districtKey = (b: EvilModeBlock) => `${b.here.region}:${b.district?.n ?? -1}`;

/** After every step. Returns the block and any lines to say (Static, a Tear, the Lab). */
export function edgesAfter(before: EvilModeBlock, block: EvilModeBlock, data: EvilData = EVIL_DATA): { block: EvilModeBlock; lines: string[] } {
  let b = block;
  const lines: string[] = [];
  if (incursionsOn(b, data)) {
    b = tally(before, b, data);
    if (before.here.beat === 'dispatch' && b.here.beat === 'inPerson') {
      const r = incursionAtSend(b, data);
      b = r.block;
      lines.push(...r.lines);
    }
    if (!before.district?.end && b.district?.end) b = edgesDistrictEnd(b);
    if (before.here.day !== b.here.day || districtKey(before) !== districtKey(b)) {
      const r = edgesMorning(b, data);
      b = r.block;
      lines.push(...r.lines);
    }
  }
  // Heat can't rise while a Tear's open in the district (the detective's "For once").
  if (openTear(before) && districtKey(before) === districtKey(b) && b.team.heat > before.team.heat) b = { ...b, team: { ...b.team, heat: before.team.heat } };
  if (shadowOn(b, data)) {
    const lab = Shadow.labChanged(before, b, data);
    b = lab.block;
    lines.push(...lab.lines);
    if (districtKey(before) !== districtKey(b) && b.district) {
      const r = Shadow.labDistrict(b, data);
      b = r.block;
      lines.push(...r.lines);
    }
    if (before.here.region !== b.here.region) b = Shadow.regionTurned(b);
    if (b.team.corruption >= 2) b = Shadow.heartsStayAway(Shadow.ceiling(b, data), data);
  }
  return { block: b, lines };
}

/** The Line's third stop, as the Line page reads it (Part 5 section 8: removed, it reads with a shorter list). */
export const whateverAllows = (block: EvilModeBlock, data: EvilData = EVIL_DATA): string => (shadowOn(block, data) ? data.edges.shadow.allows : data.edges.shadow.allowsRemoved);

/** A person's line as any screen shows it: line 7 doesn't name the branch when it's removed. */
export function lineShown(block: EvilModeBlock, n: number | null, text: string, data: EvilData = EVIL_DATA): string {
  return n === 7 && !shadowOn(block, data) ? data.edges.shadow.lineSevenRemoved : text;
}

/** The Tear's chip on the frame: "A Tear: open, 2 days". */
export function tearChip(block: EvilModeBlock, data: EvilData = EVIL_DATA): string | null {
  const t = incursionsOn(block, data) ? openTear(block) : null;
  if (!t) return null;
  const n = Math.max(0, t.openedDay + data.edges.incursions.numbers.tearDays - block.here.day);
  return fill(data.edges.incursions.tear.chip, { n, s: n === 1 ? '' : 's' });
}

/**
 * Whether the Edges tab shows in the board's tab strip (the strip is full on a phone): only while something's at the edges
 * (a Tear, an Incursion, a Beast or Poipole in the building) or the Shadow branch can be used (it's in, and the Line is
 * Whatever it takes). Key I opens the page either way.
 */
export function edgesTabShown(block: EvilModeBlock): boolean {
  const e = block.edges;
  return !!(openTear(block) || e.incursion || e.beast || e.poipole || (shadowOn(block) && block.team.line === 'whatever'));
}

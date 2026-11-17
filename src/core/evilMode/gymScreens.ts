// The Gym panel (design Part 29 section 12.2): the Leader, the five ways as five doors (an open door shows what's needed
// and what's in hand; a shut door says who shut it), the chosen door's Card, and the standing. Decides nothing.

import { EVIL_DATA, type EvilData } from './data';
import { currentLeader, gymDoors, gymOn, standingText } from './gym';
import type { EvilModeBlock, GymWay } from './schema';

export interface GymDoorModel { way: GymWay; name: string; word: string; open: boolean; done: boolean; why: string; shutBy: string | null; sel: boolean }

export interface GymModel {
  title: string;
  leader: { name: string; type: string; says: string; rule: string | null; ruleNote: string | null; respects: string };
  doors: GymDoorModel[];
  /** The chosen door's Card: label and text, in order. */
  card: [string, string][];
  standing: { word: string; moved: string };
  /** Why the chosen door can't be done now, or null (then Enter does it). */
  problem: string | null;
  hint: string;
}

export function gymModel(block: EvilModeBlock, sel: number, data: EvilData = EVIL_DATA): GymModel | null {
  const L = currentLeader(block, data);
  const st = standingText(block, data);
  if (!gymOn(data) || !L || !st) return null;
  const G = data.gym;
  const at = Math.max(0, Math.min(G.ways.length - 1, sel));
  const doors = gymDoors(block, data).map((d, i) => ({ ...d, word: G.words[d.way], sel: i === at }));
  const chosen = doors[at]!;
  const C = G.card[chosen.way];
  const card: [string, string][] = [['Needs', C.needs], ['Costs', C.costs], ['Moves', C.moves], ['After', C.after], ['The Hero', C.hero], ['The Badge', C.badge], ...(C.lose ? [['If it goes wrong', C.lose] as [string, string]] : [])];
  if (chosen.way === 'buy' && L.buy?.other) card.push(['The other way', L.buy.other]);
  if (chosen.way === 'bend' && L.bend) card.unshift(['What bends them', L.bend.text]);
  const T = G.lines as Record<string, string>;
  const problem = !chosen.open ? (chosen.done ? chosen.why : `${chosen.shutBy}. ${chosen.why}`) : block.here.beat !== 'inPerson' ? T.inPersonOnly! : block.inPerson?.day === block.here.day ? T.outToday! : block.fight ? 'A battle is waiting.' : null;
  const creedName = (id: string) => data.creeds.find((c) => c.id === id)?.name ?? id;
  return {
    title: `${L.town} Gym · ${L.name}`,
    leader: { name: L.name, type: L.type, says: L.says, rule: L.rule?.text ?? null, ruleNote: L.rule && L.rule.status !== 'supported' ? L.rule.waits : null, respects: L.respects.length ? `Respects: ${L.respects.map(creedName).join(', ')}.${L.respectsNote ? ` ${L.respectsNote}` : ''}` : '' },
    doors,
    card,
    standing: st,
    problem,
    hint: 'Left/Right picks a door. Enter does it. Esc closes.',
  };
}

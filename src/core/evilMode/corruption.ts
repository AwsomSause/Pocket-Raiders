// Evil Mode slice 21: the Shadow branch (design Part 5 section 8; Part 16 section 6; Part 30 section 2: "imports nothing
// else; nothing else needs it. With the branch removed it's never called"). Capture Rigs, the Shadow Lab, Shadow orders,
// and Corruption's ladder. Corruption never falls. Every function here counts its calls (`corruptionCalls`), so a test can
// prove the removed branch never reaches this file. The one guard that calls in is edges.ts `shadowOn`. Pure.

import { EVIL_DATA, type EvilData } from './data';
import { appendLog, fill } from './ledger';
import type { Crew, EvilModeBlock, ShadowState } from './schema';

/** How many times anything in this file has run (the "never called" proof, Part 30 section 14 test 7). */
export const corruptionCalls = { n: 0 };
const touch = () => { corruptionCalls.n += 1; };

export interface ShadowOut { block: EvilModeBlock; problem: string | null; lines: string[] }
const no = (block: EvilModeBlock, problem: string): ShadowOut => ({ block, problem, lines: [] });
const S = (data: EvilData) => data.edges.shadow;
const sh = (block: EvilModeBlock): ShadowState => block.edges.shadow!;
const withShadow = (block: EvilModeBlock, s: Partial<ShadowState>): EvilModeBlock => ({ ...block, edges: { ...block.edges, shadow: { ...sh(block), ...s } } });
const inNow = (block: EvilModeBlock): Crew[] => block.crew.filter((c) => c.where === 'in');
const notPatron = (b: EvilModeBlock) => (c: Crew): boolean => !b.team.patron || c.ref !== b.team.patron;
const lowest = (crew: Crew[]): Crew | undefined => [...crew].sort((a, b) => a.loyalty - b.loyalty || a.id.localeCompare(b.id))[0];
const lineTags = (c: Crew, data: EvilData): string[] => (c.line === null ? [] : data.people.lines.find((l) => l.n === c.line)?.tags ?? []);

/** Corruption +`by` (never down), with its line in the Log; then the ladder's rungs it reaches, once each. */
export function raise(block: EvilModeBlock, by: number, why: string, data: EvilData = EVIL_DATA): ShadowOut {
  touch();
  if (by <= 0) return { block, problem: null, lines: [] };
  const n = Math.min(10, block.team.corruption + by);
  let b: EvilModeBlock = { ...block, team: { ...block.team, corruption: n } };
  b = appendLog(b, { kind: 'shadow', who: [], text: `Day ${block.here.day}. ${why} ${fill(S(data).figure, { n })}.` });
  const r = ladder(b, data);
  return { block: r.block, problem: null, lines: r.lines };
}

/** Each rung reached and not yet applied (Part 5 section 8.2): the doorway, the ceilings, Heart applicants, the Patron. */
export function ladder(block: EvilModeBlock, data: EvilData = EVIL_DATA): { block: EvilModeBlock; lines: string[] } {
  touch();
  let b = block;
  const lines: string[] = [];
  for (const rung of S(data).ladder) {
    if (rung.at > b.team.corruption || rung.at <= sh(b).rung) continue;
    lines.push(rung.text);
    if (rung.at === 1) {
      const who = lowest(inNow(b).filter(notPatron(b)));
      if (who) {
        b = { ...b, crew: b.crew.map((c) => (c.id === who.id ? { ...c, where: 'left' as const, left: { day: b.here.day, how: 'line' as const } } : c)) };
        const line = fill(S(data).doorway, { name: who.name });
        lines.push(line);
        b = appendLog(b, { kind: 'leave', who: [who.id], text: `Day ${b.here.day}. ${line}` });
      }
    }
    if (rung.patronLeaves && b.team.patron) {
      const p = b.crew.find((c) => c.ref === b.team.patron && c.where === 'in');
      if (p) b = appendLog({ ...b, crew: b.crew.map((c) => (c.id === p.id ? { ...c, where: 'left' as const, left: { day: b.here.day, how: 'line' as const } } : c)) }, { kind: 'leave', who: [p.id], text: `Day ${b.here.day}. ${p.name} left. The Patron doesn't stay for this.` });
    }
    b = withShadow(b, { rung: rung.at });
  }
  return { block: ceiling(b, data), lines };
}

/** Loyalty's ceiling by the rungs reached (8, 6, 4); a relieved Lab keeper's is 5 for the rest of the run. */
export function ceiling(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  touch();
  const cap = Math.min(10, ...S(data).ladder.filter((r) => r.ceiling && r.at <= block.team.corruption).map((r) => r.ceiling!));
  const relieved = new Set(sh(block).relieved);
  const to = S(data).numbers.relieveTo;
  let changed = false;
  const crew = block.crew.map((c) => {
    const max = relieved.has(c.id) ? Math.min(cap, to) : cap;
    if (c.loyalty <= max) return c;
    changed = true;
    return { ...c, loyalty: max };
  });
  return changed ? { ...block, crew } : block;
}

/** Applicants with Heart stop coming at rung 2 (Part 5 section 8.2). */
export function heartsStayAway(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  touch();
  if (!S(data).ladder.some((r) => r.noHeart && r.at <= block.team.corruption)) return block;
  const heart = (ref: string) => data.people.people.find((p) => p.id === ref)?.talent === 'heart';
  const applicants = block.applicants.filter((a) => !heart(a.ref));
  return applicants.length === block.applicants.length ? block : { ...block, applicants };
}

/** Why a Rig can't be set on this holding now, or null. */
export function rigProblem(block: EvilModeBlock, holdingId: string, data: EvilData = EVIL_DATA): string | null {
  touch();
  const R = S(data).rig;
  if (block.team.line !== 'whatever') return R.whatever;
  if (block.here.beat !== 'dispatch') return R.beat;
  const h = block.district?.holdings.find((x) => x.id === holdingId);
  if (!h || (h.kind !== 'wild' && h.kind !== 'alpha')) return R.wild;
  if (sh(block).rigged.includes(h.id)) return R.done;
  return null;
}

/** A Capture Rig (Part 5 section 8.1): six kits; the ground stripped for the region; Heat +4, Dread +2, Corruption +1 the first time. */
export function rig(block: EvilModeBlock, holdingId: string, holdingName: string, card: string[], data: EvilData = EVIL_DATA): ShadowOut {
  touch();
  const p = rigProblem(block, holdingId, data);
  if (p) return no(block, p);
  const N = S(data).numbers;
  const R = S(data).rig;
  const first = !sh(block).rigged.length && !block.applied.includes('shadow:rig');
  const cap = (n: number) => Math.max(0, Math.min(10, n));
  let b = withShadow(block, { rigged: [...sh(block).rigged, holdingId], rigRegion: block.here.region, kits: sh(block).kits + N.rigKits });
  b = { ...b, team: { ...b.team, heat: cap(b.team.heat + N.rigHeat), dread: cap(b.team.dread + N.rigDread) }, applied: first ? [...b.applied, 'shadow:rig'] : b.applied };
  b = { ...b, edges: { ...b.edges, cards: [...b.edges.cards, { id: `E${b.edges.cards.length + 1}`, day: b.here.day, kind: 'rig', fields: card }] } };
  b = appendLog(b, { kind: 'shadow', who: [], to: holdingId, text: fill(R.log, { day: b.here.day, holding: holdingName }) });
  const lines = [R.said];
  const r = crossLines(b, 'rig', data);
  b = r.block;
  lines.push(...r.lines);
  if (first) {
    const up = raise(b, N.rigFirst, `${holdingName}: the first Rig.`, data);
    b = up.block;
    lines.push(...up.lines);
  }
  return { block: b, problem: null, lines };
}

/** People whose line carries `tag` don't stay quiet: Loyalty −2 each, said by name. */
function crossLines(block: EvilModeBlock, tag: string, data: EvilData): { block: EvilModeBlock; lines: string[] } {
  const hit = inNow(block).filter((c) => lineTags(c, data).includes(tag));
  if (!hit.length) return { block, lines: [] };
  const by = S(data).numbers.lineLoyalty;
  const lines = hit.map((c) => fill(S(data).lineLeave, { name: c.name, line: data.people.lines.find((l) => l.n === c.line)?.text ?? '' }));
  return { block: { ...block, crew: block.crew.map((c) => (hit.some((h) => h.id === c.id) ? { ...c, loyalty: Math.max(0, c.loyalty - by) } : c)) }, lines };
}

/** The Lab's room appeared or grew since `before` (built in the base): its keeper's named, Corruption rises by each. */
export function labChanged(before: EvilModeBlock, block: EvilModeBlock, data: EvilData = EVIL_DATA): ShadowOut {
  touch();
  const was = before.base?.rooms.find((r) => r.type === 'lab');
  const now = block.base?.rooms.find((r) => r.type === 'lab');
  if (!now || (was && was.size >= now.size)) return { block, problem: null, lines: [] };
  const N = S(data).numbers;
  let b = block;
  const lines: string[] = [];
  if (!was) {
    const keeper = lowest(inNow(b).filter((c) => !c.minor && notPatron(b)(c)));
    if (keeper) {
      b = withShadow(b, { labBy: keeper.id });
      b = { ...b, base: b.base ? { ...b.base, rooms: b.base.rooms.map((r) => (r.type === 'lab' ? { ...r, staff: keeper.id } : r)) } : b.base };
      lines.push(fill(S(data).lab.assigned, { name: keeper.name }));
    }
    const r = crossLines(b, 'shadow', data);
    b = r.block;
    lines.push(...r.lines);
    const up = raise(b, N.labBuilt, 'The Lab was built.', data);
    return { block: up.block, problem: null, lines: [...lines, ...up.lines] };
  }
  const up = raise(b, N.labSize * (now.size - was.size), 'The Lab was made bigger.', data);
  return { block: up.block, problem: null, lines: [...lines, ...up.lines] };
}

/** A new district with a working Lab (Part 16 section 6): 1, 2 or 4 more through by size; +1 Corruption each six; the keeper knocks. */
export function labDistrict(block: EvilModeBlock, data: EvilData = EVIL_DATA): ShadowOut {
  touch();
  const s = sh(block);
  const room = block.base?.rooms.find((r) => r.type === 'lab');
  const key = `${block.here.region}:${block.district?.n ?? 0}`;
  if (!room || s.worked.includes(key)) return { block, problem: null, lines: [] };
  const L = S(data).lab;
  const N = S(data).numbers;
  const keeper = s.labBy ? block.crew.find((c) => c.id === s.labBy && c.where === 'in') : undefined;
  let b = withShadow(block, { worked: [...s.worked, key] });
  if (s.shut || s.sealed || !keeper || s.relieved.includes(keeper.id)) return { block: b, problem: null, lines: [] };
  const n = N.labPer[Math.max(0, Math.min(2, room.size - 1))]!;
  const through = s.through + n;
  const lines = [fill(L.through, { n })];
  if (s.knocks < L.knock.length) lines.push(fill(L.knock[s.knocks]!, { name: keeper.name }));
  b = withShadow(b, { through, knocks: s.knocks + 1 });
  const due = Math.floor(through / N.labEvery) - sh(b).counted;
  if (due > 0) {
    b = withShadow(b, { counted: sh(b).counted + due });
    const up = raise(b, due, `${through} through the Lab.`, data);
    b = up.block;
    lines.push(...up.lines);
  }
  return { block: b, problem: null, lines };
}

/** Shut the Lab: no more goes in; the room's still there. */
export function shutLab(block: EvilModeBlock, data: EvilData = EVIL_DATA): ShadowOut {
  touch();
  if (!block.base?.rooms.some((r) => r.type === 'lab')) return no(block, S(data).lab.noLab);
  if (sh(block).shut) return no(block, S(data).lab.shutSaid);
  return { block: appendLog(withShadow(block, { shut: true }), { kind: 'shadow', who: [], text: `Day ${block.here.day}. ${S(data).lab.shutSaid}` }), problem: null, lines: [S(data).lab.shutSaid] };
}

/** Relieve the keeper: the Lab stands empty; Corruption doesn't fall; their Loyalty rises to 5 and no further, for the run. */
export function relieve(block: EvilModeBlock, data: EvilData = EVIL_DATA): ShadowOut {
  touch();
  const s = sh(block);
  const c = s.labBy ? block.crew.find((x) => x.id === s.labBy) : undefined;
  if (!c || s.relieved.includes(c.id)) return no(block, S(data).lab.noLab);
  const to = S(data).numbers.relieveTo;
  let b = withShadow(block, { relieved: [...s.relieved, c.id] });
  b = { ...b, crew: b.crew.map((x) => (x.id === c.id ? { ...x, loyalty: Math.max(x.loyalty, to) } : x)) };
  b = ceiling(b, data);
  const line = fill(S(data).lab.relieved, { name: c.name });
  return { block: appendLog(b, { kind: 'shadow', who: [c.id], text: `Day ${b.here.day}. ${line}` }), problem: null, lines: [line] };
}

/** Purify one, in person (Part 5 section 8.4): Regard +1. The figure stays where it is. */
export function purify(block: EvilModeBlock, data: EvilData = EVIL_DATA): ShadowOut {
  touch();
  const s = sh(block);
  const L = S(data).lab;
  if (s.purified >= s.through) return no(block, L.noneLeft);
  if (block.here.beat !== 'inPerson') return no(block, data.edges.incursions.tear.why.inPerson);
  if (block.inPerson?.day === block.here.day) return no(block, data.edges.incursions.tear.why.used);
  let b = withShadow(block, { purified: s.purified + 1 });
  b = { ...b, inPerson: { day: b.here.day, holdingId: 'lab' }, team: { ...b.team, regard: Math.min(10, b.team.regard + S(data).numbers.purifyRegard) } };
  return { block: appendLog(b, { kind: 'shadow', who: [], text: `Day ${b.here.day}. ${L.purified}` }), problem: null, lines: [L.purified] };
}

/** Shadow orders: there's something from the Lab to send in a person's place. */
export const ordersProblem = (block: EvilModeBlock, data: EvilData = EVIL_DATA): string | null => {
  touch();
  if (!block.refusal) return 'Nobody is waiting on an answer.';
  return sh(block).through - sh(block).purified > 0 ? null : S(data).orders.none;
};

/** A Shadow order used to cross a line: Corruption +1 the first time. The job itself is queued by the caller. */
export function orderGiven(block: EvilModeBlock, names: string, data: EvilData = EVIL_DATA): ShadowOut {
  touch();
  const first = sh(block).orders === 0;
  let b = withShadow(block, { orders: sh(block).orders + 1 });
  const line = fill(S(data).orders.said, { name: names });
  b = appendLog(b, { kind: 'shadow', who: [], text: `Day ${b.here.day}. ${line}` });
  if (!first) return { block: b, problem: null, lines: [line] };
  const up = raise(b, S(data).numbers.ordersFirst, 'A Shadow order crossed a line.', data);
  return { block: up.block, problem: null, lines: [line, ...up.lines] };
}

/** At the Crossing with the Line moved lighter, the Lab's sealed for good. A new region's ground is whole again. */
export function regionTurned(block: EvilModeBlock): EvilModeBlock {
  touch();
  const s = sh(block);
  const sealed = s.sealed || (block.team.line !== 'whatever' && !!block.base?.rooms.some((r) => r.type === 'lab'));
  return s.rigRegion !== null && s.rigRegion !== block.here.region ? withShadow(block, { rigged: [], rigRegion: null, sealed }) : sealed !== s.sealed ? withShadow(block, { sealed }) : block;
}

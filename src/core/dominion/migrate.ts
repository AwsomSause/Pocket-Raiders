// DOMINION save-block migrations (`run.expansion.dominion.v`). Each bump adds what the new slice needs and changes
// nothing already played. This file reads the raw field data (not data.ts) so the schema can call it without a cycle.

import fieldRaw from '../../data/dominion/field.json';

type Raw = Record<string, unknown>;

/** D2's `field` for a block whose region Wanted is `heat`: every district as the data starts it, the HQ holding the Heat. */
export function newField(heat: number): Raw {
  const f = fieldRaw as unknown as { hq: string; districts: { id: string; control: number; rival: number }[]; edge: { start: number } };
  const districts: Raw = {};
  for (const d of f.districts) districts[d.id] = { heat: d.id === f.hq ? Math.max(0, Math.min(100, Math.round(heat))) : 0, control: d.control, rival: d.rival, regard: 0, dread: 0 };
  const s = f.edge.start;
  return {
    at: f.hq, today: 0, free: 0, planned: false, flew: false, visited: [f.hq], districts,
    edge: { stats: { brawn: s, nerve: s, wits: s, charm: s, stealth: s }, xp: { brawn: 0, nerve: 0, wits: 0, charm: 0, stealth: 0 } },
    mastery: {}, scouted: {}, counted: [], rackets: [], vehicles: [], rolls: 0, evening: [], night: null,
    closed: null, patrol: null, hidden: false, disguise: false, wanted: 0, lookerWeek: 0, hero: 0, fight: null,
  };
}

/** v1 (D1) -> v2 (D2): adds `field`; the region's Heat so far sits on the HQ's district, so Wanted reads the same. */
function toV2(b: Raw): Raw {
  return { ...b, v: 2, field: newField(typeof b.heat === 'number' ? b.heat : 0) };
}

/** Brings a block read from a save up to the current version. Anything else passes through for the schema to judge. */
export function migrateDominion(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  let b = raw as Raw;
  if (b.v === 1) b = toV2(b);
  return b;
}

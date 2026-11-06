// Story S12: ending-grid check and the deeper parity audit for a backstory module. Pure data checks, no RNG.
import type { StoryData } from './schema';

type Cond = { kind: string; key?: string; op: string; value: unknown };
type Assign = Record<string, number | boolean | string>;

const holds = (c: Cond, a: Assign): boolean => {
  const v = a[`${c.kind}:${c.key ?? ''}`];
  if (v === undefined) return false;
  const w = c.value as number | boolean | string;
  switch (c.op) {
    case '==': return v === w;
    case '!=': return v !== w;
    case '>=': return (v as number) >= (w as number);
    case '<=': return (v as number) <= (w as number);
    case '>': return (v as number) > (w as number);
    case '<': return (v as number) < (w as number);
    default: return false;
  }
};

/** First matching row wins; the last row is the catch-all. */
export function pickEnding(grid: { ending: string; when: Cond[] }[], a: Assign): string | null {
  for (const r of grid) if (r.when.every((c) => holds(c, a))) return r.ending;
  return null;
}

/** Tries every combination of "interesting" values (each threshold, one below, one above). Returns the endings no assignment reaches, and any gap. */
export function endingGridReport(grid: { ending: string; when: Cond[] }[]): { unreachable: string[]; gap: boolean } {
  const vars = new Map<string, Set<number | boolean | string>>();
  for (const r of grid) for (const c of r.when) {
    const k = `${c.kind}:${c.key ?? ''}`;
    const s = vars.get(k) ?? new Set();
    const w = c.value as number | boolean | string;
    if (typeof w === 'number') [w - 1, w, w + 1].forEach((x) => s.add(x));
    else if (typeof w === 'boolean') { s.add(true); s.add(false); } else { s.add(w); s.add('__other__'); }
    vars.set(k, s);
  }
  const keys = [...vars.keys()];
  const reached = new Set<string>();
  let gap = false;
  const walk = (i: number, a: Assign): void => {
    if (i === keys.length) {
      const e = pickEnding(grid, a);
      if (e === null) gap = true; else reached.add(e);
      return;
    }
    for (const v of vars.get(keys[i]!)!) walk(i + 1, { ...a, [keys[i]!]: v });
  };
  walk(0, {});
  return { unreachable: [...new Set(grid.map((r) => r.ending))].filter((e) => !reached.has(e)), gap };
}

/** Parity checklist (design doc Part: Parity checklist) read from real data. Returns the problems found; empty means it passes. */
export function parityAudit(data: StoryData, backstoryId: string): string[] {
  const b = data.backstories.find((x) => x.id === backstoryId);
  if (!b) return [`unknown backstory ${backstoryId}`];
  const problems: string[] = [];
  const mine = data.events.filter((e) => (e as { backstory?: string }).backstory === backstoryId);
  const has = (tag: string) => mine.some((e) => e.tags.includes(tag));
  if (!has('intro')) problems.push('no intro scene');
  const npc = new Map<string, number>();
  for (const e of mine) for (const r of Object.values(e.roles)) {
    const ch = (r as { character: string }).character;
    if (ch !== 'ch_vance') npc.set(ch, (npc.get(ch) ?? 0) + 1);
  }
  if (![...npc.values()].some((n) => n >= 3)) problems.push('no recurring NPC with 3+ scenes');
  if (mine.filter((e) => e.choices.length >= 2).length < 3) problems.push('fewer than 3 branching events');
  if (b.endings.length < 4) problems.push('fewer than 4 endings');
  if (!has('echo')) problems.push('no echo events tagged');
  if (!has('modifier')) problems.push('no reception modifier event (complication)');
  if (!b.exclusiveItem) problems.push('no exclusive item');
  if (b.encounterPools.length === 0) problems.push('no encounter pool');
  if (b.remembranceUnlocks.length === 0) problems.push('no Remembrance unlock');
  const rep = endingGridReport(b.endingGrid as { ending: string; when: Cond[] }[]);
  for (const e of rep.unreachable) problems.push(`ending ${e} can never be picked`);
  if (rep.gap) problems.push('ending grid has a gap');
  return problems;
}

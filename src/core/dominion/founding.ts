// DOMINION D7: the Founding (Part 9 A15). The crew starts as "Unnamed Crew"; once both First Steps are done and the
// town calls them a Street Gang, the Founding opens: a name (typed, or one of six from the run's record), the two team
// colours (Part 6 §8: the armband and every member's outfit), an initial and mark, a motto and a Goal (Part 35's
// fourteen, or Rule). Pure: no random stream (the six names come from the record, not a roll).

import { DOMINION_DATA } from './data';
import { peakOf, stepById } from './empire';
import { fill } from './worldTurn';
import type { DominionBlock, TeamDraft } from './schema';

const F = () => DOMINION_DATA.founding;

/** The team's look for drawing: hex colours, the initial and the mark. Null before the Founding (grey band, no letter). */
export interface TeamColours { primary: string; secondary: string; initial: string; logo: string }

export const colourDef = (id: string) => F().colours.find((c) => c.id === id);
export const goalDef = (id: string | null) => (id ? F().goals.find((g) => g.id === id) : undefined);

/** The Founding is ready: not founded yet, both First Steps done, Street Gang reached (it stays open if Notoriety dips). */
export function foundingOpen(b: DominionBlock): boolean {
  if (b.team) return false;
  if (!DOMINION_DATA.start.firstSteps.every((s) => b.stepsDone.includes(s.id))) return false;
  return peakOf(b) >= stepById(F().opensAt);
}

export function teamColours(b: DominionBlock): TeamColours | null {
  const t = b.team;
  if (!t) return null;
  return { primary: colourDef(t.primary)?.hex ?? '#7b3fa0', secondary: colourDef(t.secondary)?.hex ?? '#e8e2ff', initial: t.initial, logo: t.logo };
}

/** A draft's colours as hex, for the live preview on the Founding page. */
export function draftColours(d: TeamDraft): TeamColours {
  return { primary: colourDef(d.primary)?.hex ?? '#7b3fa0', secondary: colourDef(d.secondary)?.hex ?? '#e8e2ff', initial: d.initial, logo: d.logo };
}

/** The letter a name gives (after "Team " or "The "), A to Z; "" if it has none. */
export function initialOf(name: string): string {
  let n = name.trim();
  for (const p of F().name.skip) if (n.toLowerCase().startsWith(p.toLowerCase()) && n.length > p.length) n = n.slice(p.length);
  const c = n.match(/[A-Za-z]/)?.[0];
  return c ? c.toUpperCase() : '';
}

const isTaken = (name: string): boolean => {
  const bare = name.trim().toLowerCase();
  return F().name.taken.some((t) => [t.toLowerCase(), `team ${t.toLowerCase()}`].includes(bare));
};

/**
 * Six names from the run's record (Part 9 A15): the two Team Types, the Boss's best Edge stat, the Boss's lead
 * Pokémon, the HQ's town, and what the towns feel most (Dread or Regard). Taken or too-long names drop out and the
 * fallback list fills the gaps, so there are always six. `ace` is the lead Pokémon's name (the run knows it).
 */
export function nameIdeas(b: DominionBlock, ace: string | null): string[] {
  const n = F().name;
  const out: string[] = [];
  const add = (s: string | null | undefined): void => {
    if (!s || s.length > n.max || isTaken(s) || out.some((x) => x.toLowerCase() === s.toLowerCase())) return;
    out.push(s);
  };
  for (const t of b.types) add(n.byType[t] ? fill(n.type, { word: n.byType[t]! }) : null);
  const edge = b.field.edge.stats;
  const best = (Object.keys(edge) as (keyof typeof edge)[]).reduce((a, k) => (edge[k] > edge[a] ? k : a), 'brawn');
  add(n.byEdge[best] ? fill(n.edge, { word: n.byEdge[best]! }) : null);
  if (ace) add(fill(n.ace, { ace }));
  const hq = DOMINION_DATA.field.districts.find((d) => d.id === DOMINION_DATA.field.hq);
  if (hq) add(fill(n.town, { town: hq.name }));
  const towns = Object.values(b.field.districts);
  const dread = towns.reduce((s, d) => s + d.dread, 0), regard = towns.reduce((s, d) => s + d.regard, 0);
  add(fill(n.type, { word: dread > regard ? n.byFeared : n.byLiked }));
  for (const f of n.fallback) if (out.length < 6) add(f);
  return out.slice(0, 6);
}

export function newDraft(b: DominionBlock, ace: string | null): TeamDraft {
  const s = F().start;
  const name = nameIdeas(b, ace)[0] ?? F().name.fallback[0]!;
  return { name, primary: s.primary, secondary: s.secondary, initial: initialOf(name), logo: s.logo, motto: F().motto.ideas[0]!, goal: null };
}

/** Why a draft can't be founded, or null. */
export function draftProblem(d: TeamDraft): string | null {
  const n = F().name, L = F().lines;
  const name = d.name.trim();
  if (name.replace(/[^A-Za-z]/g, '').length < 2) return L.short;
  if (name.length > n.max) return fill(L.long, { max: n.max });
  if (!new RegExp(n.chars).test(name)) return L.chars;
  if (isTaken(name)) return fill(L.taken, { name });
  if (!colourDef(d.primary) || !colourDef(d.secondary) || d.primary === d.secondary) return L.same;
  if (!/^[A-Z]$/.test(d.initial) || !F().logos.some((l) => l.id === d.logo)) return L.chars;
  if (d.motto.length > F().motto.max) return fill(L.motto, { max: F().motto.max });
  if (d.goal !== null && !goalDef(d.goal)) return L.chars;
  return null;
}

/** The `found` action: the sign goes up. Changes nothing else; every member wears the colours from now on. */
export function found(block: DominionBlock, d: TeamDraft): { ok: boolean; block: DominionBlock; notice: string | null } {
  if (!foundingOpen(block)) return { ok: false, block, notice: block.team ? null : F().lines.notYet };
  const problem = draftProblem(d);
  if (problem) return { ok: false, block, notice: problem };
  const b = structuredClone(block);
  const name = d.name.trim().replace(/\s+/g, ' ');
  b.team = { name, primary: d.primary, secondary: d.secondary, initial: d.initial, logo: d.logo, motto: d.motto.trim(), goal: d.goal, day: b.day };
  b.teamName = name;
  return { ok: true, block: b, notice: fill(F().lines.done, { name }) };
}

/** The scene after the Founding: the door, the first member tying the armband on, their line. */
export function foundedLines(b: DominionBlock): string[] {
  const t = b.team, m = b.members[0];
  if (!t) return [];
  const L = F().lines;
  const admin = !!m && m.rank !== 'grunt' && !m.look.includes('c-rook');
  const colours = `${colourDef(t.primary)?.name ?? t.primary} and ${colourDef(t.secondary)?.name ?? t.secondary}`;
  const said = `${m?.name ?? 'Rook'}: “${admin ? L.said.admin : L.said.grunt}”`;
  return L.scene.map((s) => fill(s, { name: t.name, member: m?.name ?? 'Rook', colours, said }));
}

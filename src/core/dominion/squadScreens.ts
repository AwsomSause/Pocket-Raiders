// DOMINION slice D8: the view model for the Squads page (Roster → Squads, mockup 13): squad cards, the New Squad
// builder (also edits a squad, or forms a Group), and the order / trait pickers. Plain data; the screen draws it.

import { DOMINION_DATA } from './data';
import type { DominionBlock, GroupDraft, Member, Squad, SquadDraft } from './schema';
import { cantTake, crewOf, familyOf, rankWord, taskById } from './crew';
import {
  bandOf, crewFor, draftProblem, focusById, groupKindFor, groupOf, groupProblem, incentiveById, isFamily, lockedWhy, sizeFor, squadById, squadCap, squadOdds, squadOf,
  squadsOf, suggestions, targetById, traitById,
} from './squads';

const Q = () => DOMINION_DATA.squads;
export const CARDS_PER_PAGE = 4;
const pillWord = (rank: string): string => rankWord(rank).replace('STAFF SERGEANT', 'STAFF SGT');

export interface SquadCardModel {
  id: string; codeName: string; mark: string; color: string; n: string; leader: { name: string; look: string; rank: string } | null; faces: string[];
  incentive: string; cohesion: number; band: string; pill: string; trait: string; traitTone: 'y' | 'mu'; today: { icon: string; text: string; live: boolean };
  family: boolean; sel: boolean; group: string | null; kind: string; offered: boolean;
}
export type BuilderRow = 'name' | 'leader' | 'incentive' | 'target' | 'mark' | 'members';
export const SQUAD_ROWS: BuilderRow[] = ['name', 'leader', 'incentive', 'target', 'mark', 'members'];
export const GROUP_ROWS: BuilderRow[] = ['name', 'leader', 'incentive', 'members'];
export interface PickModel { id: string; name: string; look: string; on: boolean; clash: boolean; cand: boolean }
export interface BuilderModel {
  kind: 'squad' | 'group';
  title: string; right: string; codeName: string; count: string; ideas: string[];
  leader: { name: string; look: string; rank: string; max: string } | null;
  incentives: { id: string; name: string; on: boolean }[]; more: number;
  /** Row 4 of the builder: the Vengeance target, or the Focus. */
  extra: { label: string; name: string; look: string | null; text: string };
  marks: { ch: string; on: boolean }[]; focus: string;
  alert: { tone: 'r' | 'y' | 'g'; text: string } | null;
  picked: PickModel[]; pickNote: string; cand: string | null;
  armband: { initial: string; mark: string; colour: string; text: string };
  cta: { text: string; ok: boolean };
  rows: BuilderRow[]; row: BuilderRow; active: boolean;
}
export interface PickerModel { kind: 'order' | 'trait'; title: string; right: string; rows: { id: string; label: string; note: string; on: boolean; locked: boolean }[]; at: number; start: number }
export interface SquadsModel {
  cards: SquadCardModel[]; page: number; pages: number; count: string; hq: string; locked: string | null; groups: string[];
  builder: BuilderModel; picker: PickerModel | null; empty: string | null;
}

/** Members a squad can take (not in another squad), in roster order. */
export const freeFor = (b: DominionBlock, squadId: string | null): Member[] => b.members.filter((m) => { const s = squadOf(b, m.id); return !s || s.id === squadId; });
export const leadersFor = (b: DominionBlock, squadId: string | null): Member[] => freeFor(b, squadId).filter((m) => sizeFor(m.rank));
export const groupLeaders = (b: DominionBlock): Member[] => b.members.filter((m) => groupKindFor(m.rank));

export function newDraft(b: DominionBlock): SquadDraft {
  const leader = leadersFor(b, null)[0];
  return { id: null, codeName: '', leader: leader?.id ?? '', members: [], incentive: Q().incentives[0]!.id, target: null, focus: null, mark: squadsOf(b).list.length % Q().marks.length };
}
export function editDraft(s: Squad): SquadDraft {
  return { id: s.id, codeName: s.codeName, leader: s.leader, members: s.members.filter((x) => x !== s.leader), incentive: s.incentive, target: s.target, focus: s.focus, mark: s.mark };
}
export function newGroupDraft(b: DominionBlock): GroupDraft {
  return { id: null, codeName: '', leader: groupLeaders(b)[0]?.id ?? '', squads: [], incentive: Q().incentives[0]!.id };
}

function card(b: DominionBlock, s: Squad, sel: boolean): SquadCardModel {
  const leader = b.members.find((m) => m.id === s.leader);
  const size = leader ? sizeFor(leader.rank) : null;
  const band = bandOf(s.cohesion);
  const inc = incentiveById(s.incentive);
  const t = traitById(s.trait);
  const c = crewFor(b, s);
  const task = s.order ? taskById(s.order) : null;
  const icons = DOMINION_DATA.crew.taskIcons as Record<string, string>;
  const label = task ? (DOMINION_DATA.crew.quickLabels[task.id] ?? task.name) : '';
  const today = task
    ? { icon: icons[task.id] ?? 'g-machine-part', text: c ? `${label} · ${squadOdds(b, s, task.id) ?? 0}%` : `${label} · leader can't go`, live: !!c }
    : { icon: 'g-calendar', text: leader && size ? 'No order: own tasks' : 'No leader: pick one (E)', live: false };
  return {
    id: s.id, codeName: s.codeName.toUpperCase(), mark: Q().marks[s.mark]!, color: Q().colors[s.mark]!, n: `${s.members.length}/${size?.max ?? '—'}`,
    leader: leader ? { name: leader.name, look: leader.look, rank: pillWord(leader.rank) } : null,
    faces: s.members.filter((x) => x !== s.leader).map((id) => b.members.find((m) => m.id === id)?.look).filter((x): x is string => !!x).slice(0, 6),
    incentive: inc?.name ?? s.incentive, cohesion: s.cohesion, band: band.word, pill: band.pill,
    trait: t ? `★ Trait: ${t.name}` : s.offered.length ? '★ Family: pick a trait (T)' : 'No trait yet', traitTone: t || s.offered.length ? 'y' : 'mu',
    today, family: isFamily(s), sel, group: groupOf(b, s.id)?.codeName ?? null, kind: Q().kinds[size?.kind ?? 'squad'] ?? 'Squad', offered: s.offered.length > 0,
  };
}

/** The builder for a squad draft (Part 10 §9: leader, members, Code Name, Incentive, Focus, Mark). */
export function squadBuilder(b: DominionBlock, d: SquadDraft, row: BuilderRow, candAt: number, active: boolean, teamInitial: string): BuilderModel {
  const leader = b.members.find((m) => m.id === d.leader);
  const size = leader ? sizeFor(leader.rank) : null;
  const ids = leader ? [leader.id, ...d.members.filter((x) => x !== leader.id)] : d.members;
  const inc = incentiveById(d.incentive)!;
  const fits = (m: Member): boolean => inc.fits.includes(crewOf(m).motive);
  const pool = freeFor(b, d.id);
  const cand = pool.filter((m) => m.id !== d.leader)[candAt] ?? null;
  const picked: PickModel[] = ids.map((id) => b.members.find((m) => m.id === id)).filter((m): m is Member => !!m)
    .map((m) => ({ id: m.id, name: m.name, look: m.look, on: true, clash: !fits(m), cand: row === 'members' && cand?.id === m.id }));
  if (row === 'members' && cand && !ids.includes(cand.id)) picked.push({ id: cand.id, name: cand.name, look: cand.look, on: false, clash: !fits(cand), cand: true });
  const match = picked.filter((p) => p.on && !p.clash);
  const clash = picked.filter((p) => p.on && p.clash);
  const motive = (m: Member): string => DOMINION_DATA.crew.motives.find((x) => x.id === crewOf(m).motive)?.name ?? crewOf(m).motive;
  const parts: string[] = [];
  if (match.length) parts.push(`${match.length} picked ${match.length === 1 ? 'has' : 'have'} ${inc.fits.map((f) => DOMINION_DATA.crew.motives.find((x) => x.id === f)?.name ?? f).join(' or ')}: Loyalty +${Q().numbers.matchLoyalty} each.`);
  for (const p of clash.slice(0, 2)) {
    const m = b.members.find((x) => x.id === p.id)!;
    parts.push(`${m.name} wants ${motive(m)}: Morale ${Q().numbers.clashMorale} a week.`);
  }
  if (!inc.live && inc.note) parts.push(inc.note);
  const why = draftProblem(b, d);
  const alert = why ? { tone: 'r' as const, text: why } : parts.length ? { tone: clash.length ? 'r' as const : 'g' as const, text: parts.join(' ') } : null;
  // Four Incentive buttons around the chosen one, "+6" for the rest (mockup 13).
  const all = Q().incentives;
  const at = all.findIndex((x) => x.id === d.incentive);
  const start = Math.max(0, Math.min(all.length - 4, at - 1));
  const shown = all.slice(start, start + 4).map((x) => ({ id: x.id, name: x.name, on: x.id === d.incentive }));
  const f = focusById(d.focus);
  const tg = targetById(d.target);
  const extra = d.incentive === 'vengeance'
    ? { label: 'Target', name: tg?.name ?? 'Pick one', look: tg ? `dominion/${tg.look}.png` : null, text: tg ? (tg.live ? `+${Q().numbers.vengeanceOdds}% vs ${tg.kind === 'gym' ? 'them' : 'him'} only` : `comes with ${tg.needs}`) : '◀▶ pick' }
    : { label: 'Focus', name: f?.name ?? 'None', look: null, text: f ? (f.needs ? `jobs come with ${f.needs}` : `+${Q().numbers.focusOn}% on it, ${Q().numbers.focusOff}% else`) : 'optional' };
  const editing = d.id ? squadById(b, d.id) : null;
  return {
    kind: 'squad',
    title: editing ? `EDIT · ${editing.codeName.toUpperCase()}` : 'NEW SQUAD', right: `${ids.length} picked`,
    codeName: d.codeName, count: `${d.codeName.length}/${Q().codeName.max}`, ideas: suggestions(b, ids).slice(0, 2),
    leader: leader ? { name: leader.name, look: leader.look, rank: pillWord(leader.rank), max: size ? `up to ${size.max}` : 'too junior' } : null,
    incentives: shown, more: all.length - shown.length, extra,
    marks: Q().marks.map((ch, i) => ({ ch, on: i === d.mark })).filter((_, i) => Math.abs(i - d.mark) <= 3 || (d.mark < 3 && i < 6) || (d.mark > 8 && i > 5)).slice(0, 6), focus: f?.name ?? '',
    alert, picked, pickNote: clash.length ? `${clash[0]!.name} clashes` : match.length ? 'All fit' : '', cand: cand?.name ?? null,
    armband: { initial: teamInitial || '?', mark: Q().marks[d.mark]!, colour: Q().colors[d.mark]!, text: `Mark ${d.mark + 1} of ${Q().marks.length}` },
    cta: { text: editing ? 'Save squad' : 'Form squad', ok: !why }, rows: SQUAD_ROWS, row, active,
  };
}

/** The builder in Group mode (Part 10 §2): an officer, two to four squads, an Incentive. */
export function groupBuilder(b: DominionBlock, d: GroupDraft, row: BuilderRow, candAt: number, active: boolean, teamInitial: string): BuilderModel {
  const leader = b.members.find((m) => m.id === d.leader);
  const kind = leader ? groupKindFor(leader.rank) : null;
  const st = squadsOf(b);
  const cand = st.list[candAt] ?? null;
  const picked: PickModel[] = st.list.filter((s) => d.squads.includes(s.id) || (row === 'members' && cand?.id === s.id)).map((s) => {
    const l = b.members.find((m) => m.id === s.leader);
    return { id: s.id, name: s.codeName, look: l?.look ?? '', on: d.squads.includes(s.id), clash: s.incentive !== d.incentive, cand: row === 'members' && cand?.id === s.id };
  });
  const why = groupProblem(b, d);
  const clash = picked.filter((p) => p.on && p.clash);
  const all = Q().incentives;
  const at = all.findIndex((x) => x.id === d.incentive);
  const start = Math.max(0, Math.min(all.length - 4, at - 1));
  return {
    kind: 'group', title: d.id ? 'EDIT GROUP' : 'NEW GROUP', right: `${d.squads.length} squads`, codeName: d.codeName, count: `${d.codeName.length}/${Q().codeName.max}`, ideas: [],
    leader: leader ? { name: leader.name, look: leader.look, rank: pillWord(leader.rank), max: kind ? `${kind.word}: ${kind.min}–${kind.max > 12 ? 'all' : kind.max} squads` : 'too junior' } : null,
    incentives: all.slice(start, start + 4).map((x) => ({ id: x.id, name: x.name, on: x.id === d.incentive })), more: all.length - 4,
    extra: { label: '', name: '', look: null, text: '' }, marks: [], focus: '',
    alert: why ? { tone: 'r', text: why } : clash.length ? { tone: 'y', text: `${clash.map((c) => c.name).join(', ')} keep${clash.length === 1 ? 's' : ''} ${clash.length === 1 ? 'its' : 'their'} own Incentive: Cohesion grows slower.` } : null,
    picked, pickNote: '', cand: cand?.codeName ?? null,
    armband: { initial: teamInitial || '?', mark: '✦', colour: '#ffd23f', text: 'Group' },
    cta: { text: d.id ? 'Save group' : 'Form group', ok: !why }, rows: GROUP_ROWS, row, active,
  };
}

/** The order picker: no order, then every task the leader can take, with the squad's odds. */
export function orderRows(b: DominionBlock, s: Squad): PickerModel['rows'] {
  const leader = b.members.find((m) => m.id === s.leader);
  const rows: PickerModel['rows'] = [{ id: '', label: 'No order: each member keeps their own task', note: '', on: !s.order, locked: false }];
  if (!leader) return rows;
  const quick = DOMINION_DATA.crew.quick;
  const live = DOMINION_DATA.tasks.filter((t) => t.status !== 'disabled' && !cantTake(leader, t));
  const ordered = [...live.filter((t) => quick.includes(t.id)), ...live.filter((t) => !quick.includes(t.id))];
  for (const t of ordered) {
    const o = squadOdds(b, s, t.id);
    const line = s.members.map((id) => b.members.find((m) => m.id === id)).find((m) => m && crewOf(m).line.includes(t.id));
    rows.push({ id: t.id, label: DOMINION_DATA.crew.quickLabels[t.id] ?? t.name, note: line && !['fear', 'purse'].includes(s.incentive) ? `${line.name}'s line` : `${o ?? 0}%${familyOf(t.id) && focusById(s.focus)?.families.includes(familyOf(t.id)!) ? ' · focus' : ''}`, on: s.order === t.id, locked: !!line && !['fear', 'purse'].includes(s.incentive) });
  }
  return rows;
}

export function traitRows(s: Squad): PickerModel['rows'] {
  return s.offered.map((id) => {
    const t = traitById(id)!;
    return { id, label: t.name, note: t.live ? t.text : `${t.text} (comes with ${t.needs})`, on: false, locked: false };
  });
}

export function squadsModel(
  b: DominionBlock, sel: number, page: number, builder: BuilderModel, picker: { kind: 'order' | 'trait'; at: number } | null,
): SquadsModel {
  const st = squadsOf(b);
  const pages = Math.max(1, Math.ceil(st.list.length / CARDS_PER_PAGE));
  const pg = Math.min(page, pages - 1);
  const cards = st.list.slice(pg * CARDS_PER_PAGE, pg * CARDS_PER_PAGE + CARDS_PER_PAGE).map((s, i) => card(b, s, pg * CARDS_PER_PAGE + i === sel && !builder.active));
  let pm: PickerModel | null = null;
  const s = st.list[sel];
  if (picker && s) {
    const rows = picker.kind === 'order' ? orderRows(b, s) : traitRows(s);
    const at = Math.max(0, Math.min(picker.at, rows.length - 1));
    const start = Math.max(0, Math.min(rows.length - 9, at - 4));
    pm = { kind: picker.kind, title: picker.kind === 'order' ? `ORDER · ${s.codeName.toUpperCase()}` : `SQUAD TRAIT · ${s.codeName.toUpperCase()}`, right: picker.kind === 'order' ? 'tonight' : 'pick one', rows, at, start };
  }
  return {
    cards, page: pg, pages, count: `Squads ${st.list.length} / ${squadCap(b)}`, hq: `HQ Lv ${b.hqLevel}`, locked: lockedWhy(b),
    groups: st.groups.map((g) => `${g.codeName} · ${Q().incentives.find((x) => x.id === g.incentive)?.short ?? ''} · ${g.squads.length} squads`),
    builder, picker: pm,
    empty: st.list.length ? null : lockedWhy(b) ?? 'No squads yet. Build one on the right: Tab, then Enter on Form squad.',
  };
}

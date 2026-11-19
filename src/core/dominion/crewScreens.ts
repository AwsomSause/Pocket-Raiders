// DOMINION slice D3 view models: the Morning (mockup 2) and the Crew File (mockup 5), the hire list, the leads and the
// talk card. Plain data for ui/redux/screens/dominion/crew.ts. Pure: no Phaser, no RNG beyond reading today's hire list.

import { crewOf, familyOf, memberLine, odds, rankN, rankWord, taskById, taskLevel, taskLevelWord, traitName, withCrew, xpToNext, cantTake, formedById, greenById, gruntType } from './crew';
import { DOMINION_DATA } from './data';
import { hireList, pitchOdds } from './recruit';
import type { Alert, DominionBlock, Member } from './schema';
import { STAT_IDS } from './schema';
import { topModel, type TopModel } from './screens';
import { topTalk } from './talk';
import { usable } from './reserve';
import { rivalBadge, rivalTag } from './rivalScreens';

const C = () => DOMINION_DATA.crew;
/** Why a member is out, for the cards (D9 adds held by a rival team). */
const OUT_WORD: Record<string, string> = { jail: 'In a cell', hurt: 'Hurt', held: 'Held by a rival team' };

export interface TaskRow { id: string; label: string; icon: string | null; odds: string; tone: 'y' | 'gn' | 'mu' | 'rd'; locked: string | null; on: boolean }
export interface StripCard { id: string; name: string; look: string; task: string; odds: string; tone: string; sel: boolean; out: boolean }
export interface InfoCard {
  id: string; name: string; look: string; rank: string; green: string; trait: string | null; typeName: string | null;
  loyalty: number; skill: number; personality: string; forming: boolean; fatigue: number; pHeat: number; out: string | null; armband: string | null;
}
export interface TalkModel { name: string; title: string; text: string; choices: string[] }
export interface MorningModel {
  top: TopModel;
  alerts: Alert[];
  more: number;
  badge: { label: string; word: string; hot: boolean };
  /** The tag on rival alerts ("ROCKET"). */
  rivalTag: string;
  member: InfoCard;
  tasks: TaskRow[];
  moreCount: number;
  all: boolean;
  strip: StripCard[];
  talk: TalkModel | null;
  phase: string;
}

/** Skill (Part 2 §1): the average of the five stats ×10, plus level. */
export const skillOf = (m: Member): number => Math.min(100, Math.round((STAT_IDS.reduce((a, k) => a + m.stats[k], 0) / 5) * 10 + m.level));

const label = (id: string): string => C().quickLabels[id] ?? taskById(id)?.name ?? id;
const oddsText = (b: DominionBlock, m: Member, id: string): { odds: string; tone: TaskRow['tone'] } => {
  const t = taskById(id)!;
  const p = odds(b, m, t);
  return t.effect?.sure ? { odds: 'sure', tone: 'gn' } : { odds: `${p}%`, tone: p >= 60 ? 'gn' : p >= 35 ? 'y' : 'rd' };
};

export function infoCard(b: DominionBlock, m: Member): InfoCard {
  const c = crewOf(m);
  const temper = C().temperaments.find((t) => t.id === c.temperament);
  const trait = c.formed.at(-1) ?? null;
  return {
    id: m.id, name: (c.nick ? `${m.name} "${c.nick}"` : m.name).toUpperCase(), look: m.look, rank: rankWord(m.rank),
    green: greenById(c.green)?.name.toUpperCase() ?? c.green, trait: trait ? traitName(trait) : null,
    typeName: gruntType(c.type)?.name ?? c.cls, loyalty: m.loyalty, skill: skillOf(m),
    personality: trait ? traitName(trait) : `${temper?.word ?? '?'}?`, forming: !trait, fatigue: c.fatigue, pHeat: c.pHeat,
    out: c.out ? (c.out.why === 'held' ? OUT_WORD.held! : `${OUT_WORD[c.out.why] ?? 'Out'}, ${c.out.days} day${c.out.days === 1 ? '' : 's'}`) : null,
    armband: b.teamName ? `${b.teamName} armband` : null,
  };
}

/** Mockup 2: the Morning. `sel` is the member being assigned, `at` the task row under the cursor, `all` the full list. */
export function morningModel(block: DominionBlock, sel: number, at: number, all: boolean): MorningModel {
  const b = withCrew(block);
  const m = b.members[Math.min(sel, b.members.length - 1)]!;
  const c = crewOf(m);
  const ids = all ? taskIds(m) : C().quick;
  const tasks = ids.map((id, i) => {
    const t = taskById(id)!;
    const locked = cantTake(m, t);
    const o = locked ? { odds: '—', tone: 'mu' as const } : oddsText(b, m, id);
    return { id, label: label(id), icon: C().taskIcons[id] ?? null, ...o, locked, on: i === at };
  });
  const report = b.report;
  // The crew's alerts carry their times; the rest of the Night Report (bills, police, cooling) shows after them.
  const crewTexts = new Set((b.crew?.alerts ?? []).map((a) => a.text));
  const rest: Alert[] = report.filter((l) => !crewTexts.has(l)).map((text, i) => ({
    kind: /₽|bills|paid/i.test(text) ? 'money' : /Heat|police|officer/i.test(text) ? 'police' : 'world', time: `${6 + Math.floor(i / 4)}:${String((i % 4) * 15).padStart(2, '0')}`, text,
  }));
  const alerts = [...(b.crew?.alerts ?? []), ...rest];
  const shown = 6;
  const card = topTalk(b);
  return {
    top: topModel(b, `${DOMINION_DATA.start.start.hqName} · LV. ${b.hqLevel}`),
    alerts: alerts.slice(0, shown),
    more: Math.max(0, alerts.length - shown),
    // D9: the rival team's Tension (the region's Heat when no team is on).
    badge: rivalBadge(b),
    rivalTag: rivalTag(),
    member: infoCard(b, m),
    tasks,
    moreCount: taskIds(m).length,
    all,
    strip: b.members.map((x, i) => {
      const xc = crewOf(x);
      const o = xc.out ? { odds: xc.out.why === 'jail' ? 'cell' : xc.out.why === 'held' ? 'held' : 'hurt', tone: 'rd' } : oddsText(b, x, xc.task);
      return { id: x.id, name: x.name, look: x.look, task: label(xc.task), odds: o.odds === 'sure' ? '' : o.odds, tone: o.tone, sel: i === sel, out: !!xc.out };
    }),
    talk: card ? { name: card.name, title: card.talk.name, text: card.text, choices: card.talk.choices!.map((x) => x.label) } : null,
    phase: b.phase,
  };
  void c;
}

/** Every task the member could ever be given, live ones first (the "More…" list). */
export function taskIds(m: Member): string[] {
  const live = DOMINION_DATA.tasks.filter((t) => t.status !== 'disabled');
  const ok = live.filter((t) => !cantTake(m, t)).map((t) => t.id);
  const rest = live.filter((t) => cantTake(m, t)).map((t) => t.id);
  return [...ok, ...rest];
}

// ---------- mockup 5: the Crew File ----------

export interface FileModel {
  name: string; rank: string; rankN: number; level: number; wage: number; chevrons: number; joined: number; look: string;
  prev: string | null; next: string | null; count: string;
  stats: { id: string; label: string; value: number }[];
  loyalty: number; morale: number; fatigue: number; pHeat: number; motive: string; ambitionKnown: boolean;
  green: string; formed: { name: string; text: string; live: boolean; needs: string | null }[]; grew: boolean; record: string; temperament: string;
  second: string; signature: string;
  types: string; team: { species: string; level: number; dim: boolean }[];
  then: { day: number; line: string }; now: { day: number; line: string };
  task: string; taskLevel: string; out: string | null; xp: string; points: number;
  keys: { key: string; label: string }[];
  talk: TalkModel | null;
}

const RECORD_WORDS: Record<string, string> = { guard: 'Guarded', shake: 'Shook down', pick: 'Thieved', train: 'Trained', recruit: 'Recruited', scout: 'Scouted', front: 'Worked a front', collect: 'Kept the books', catch: 'Caught', rest: 'Rested' };
const TREAT_WORDS: Record<string, string> = { praise: 'praised', push: 'pushed', leave: 'left alone', spar: 'sparred', payOnTime: 'paid on time', payLate: 'paid late', punish: 'punished', bring: 'brought along', win: 'won with you' };

export function fileModel(block: DominionBlock, sel: number): FileModel {
  const b = withCrew(block);
  const i = Math.min(sel, b.members.length - 1);
  const m = b.members[i]!;
  const c = crewOf(m);
  const fam = Object.entries(c.tally).sort((a, x) => x[1] - a[1])[0];
  const tr = Object.entries(c.treat).sort((a, x) => (x[1] ?? 0) - (a[1] ?? 0))[0];
  const record = [fam ? `${RECORD_WORDS[fam[0]] ?? fam[0]} ${fam[1]} day${fam[1] === 1 ? '' : 's'}` : 'No record yet', tr && tr[1] ? `${TREAT_WORDS[tr[0]]} ${tr[1]} time${tr[1] === 1 ? '' : 's'}` : null].filter(Boolean).join(', ') + '.';
  const sigFam = fam?.[0] ?? familyOf(c.task) ?? 'guard';
  const sig = C().signatures.find((s) => s.family === sigFam) ?? C().signatures[0]!;
  const ranks = C().ranks;
  const sergeant = ranks.find((r) => r.id === C().traitRanks.second)!;
  const exec = ranks.find((r) => r.id === C().traitRanks.signature)!;
  const greenLines = C().lines[c.green] ?? [];
  const card = topTalk(b);
  const t = taskById(c.task);
  const keys = [{ key: 'G', label: 'Gift' }, { key: 'H', label: 'Hire' }, { key: 'R', label: `Leads (${b.crew!.leads.length})` }, { key: 'P', label: 'Pyramid' }];
  if (b.phase === 'evening') keys.unshift({ key: 'T', label: 'Talk' });
  if (c.out?.why === 'jail') keys.unshift({ key: 'B', label: `Bail ₽${C().rules.bail}` });
  return {
    name: m.name.toUpperCase(), rank: rankWord(m.rank), rankN: rankN(m.rank), level: m.level, wage: m.wage, chevrons: Math.min(5, Math.ceil(rankN(m.rank) / 3)),
    joined: m.joinedDay, look: m.look,
    prev: b.members.length > 1 ? b.members[(i - 1 + b.members.length) % b.members.length]!.name : null,
    next: b.members.length > 1 ? b.members[(i + 1) % b.members.length]!.name : null,
    count: `${i + 1} of ${b.members.length}`,
    stats: STAT_IDS.map((k) => ({ id: k, label: k[0]!.toUpperCase() + k.slice(1), value: m.stats[k] })),
    loyalty: m.loyalty, morale: m.morale, fatigue: c.fatigue, pHeat: c.pHeat,
    motive: C().motives.find((x) => x.id === c.motive)?.name ?? c.motive, ambitionKnown: false,
    green: greenById(c.green)?.name ?? c.green,
    formed: c.formed.map((id) => {
      const f = formedById(id)!;
      return { name: f.name, text: f.text, live: f.live, needs: f.needs ?? null };
    }),
    grew: !!c.grew && b.day - c.grew.day <= 7, record,
    temperament: C().temperaments.find((x) => x.id === c.temperament)?.word ?? '',
    second: c.formed[1] ? '' : `2nd trait, at ${sergeant.word[0]}${sergeant.word.slice(1).toLowerCase()}`,
    signature: `Executive signature at Lv ${exec.level}: ${sig.name}?`,
    types: b.types.map((x) => x[0]!.toUpperCase() + x.slice(1)).join(' · '),
    // D4: a Pokémon over the member's caps stays but sits out, shown dimmed (Part 7 §4.3).
    team: m.team.map((x) => ({ species: x.speciesId, level: x.level, dim: !usable(b, m, x) })),
    then: { day: m.joinedDay, line: greenLines[0] ?? memberLine(m, m.joinedDay) },
    now: { day: b.day, line: memberLine(m, b.day) },
    task: label(c.task), taskLevel: t ? `${taskLevelWord(taskLevel(m, t.id))} (task Lv ${taskLevel(m, t.id)})` : '',
    out: c.out ? (c.out.why === 'held' ? 'Held by a rival team: pay the ransom on the Rival File (R) or send a rescue' : c.out.why === 'jail' ? `In a cell: ${c.out.days} day${c.out.days === 1 ? '' : 's'} left` : `Hurt: ${c.out.days} day${c.out.days === 1 ? '' : 's'}`) : null,
    xp: `${c.xp}/${xpToNext(m.level)} XP`, points: m.traitPoints,
    keys,
    talk: card ? { name: card.name, title: card.talk.name, text: card.text, choices: card.talk.choices!.map((x) => x.label) } : null,
  };
}

// ---------- the hire list and the leads ----------

export interface HireRow { name: string; type: string; group: string; price: number; temperament: string; green: string; best: string; sold: boolean; rarity: string }
export function hireModel(block: DominionBlock, seed: string): { rows: HireRow[]; room: string; funds: number } {
  const b = withCrew(block);
  const list = b.crew!.hireDay === b.day ? b.crew!.hires : hireList(b, seed);
  return {
    rows: list.map((h) => {
      const t = gruntType(h.type)!;
      return {
        name: h.name, type: t.name, group: t.group, price: h.price, sold: h.sold, rarity: t.rarity,
        temperament: C().temperaments.find((x) => x.id === h.temperament)?.word ?? h.temperament,
        green: greenById(h.green)?.name ?? h.green, best: label(t.bestAt),
      };
    }),
    room: `${b.members.length}/${b.rosterCap}`,
    funds: b.funds,
  };
}

export interface LeadRow { id: string; name: string; cls: string; look: string; motive: string; hates: string; green: string; waiting: boolean; notBefore: number; odds: { id: string; name: string; odds: number }[]; role: string | null; days: number }
export function leadsModel(block: DominionBlock): { rows: LeadRow[]; actions: number; phase: string } {
  const b = withCrew(block);
  const rc = C().recruit;
  return {
    rows: b.crew!.leads.map((l) => ({
      id: l.id, name: l.name, cls: l.cls, look: l.look, waiting: l.waiting, notBefore: l.notBefore,
      motive: C().motives.find((x) => x.id === l.motive)?.name ?? l.motive,
      hates: rc.pitches.find((p) => p.id === l.hates)?.name ?? l.hates,
      green: greenById(l.green)?.name ?? l.green,
      role: l.role ? rc.roles[l.role]?.text ?? null : null,
      odds: rc.pitches.map((p) => ({ id: p.id, name: p.name, odds: pitchOdds(b, l, p.id) })),
      days: Math.max(0, (l.waiting ? rc.waitDays : rc.leadDays) - (b.day - l.day)),
    })),
    actions: b.actions,
    phase: b.phase,
  };
}

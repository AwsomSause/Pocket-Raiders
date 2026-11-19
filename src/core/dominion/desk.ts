// DOMINION slice D21: the applications desk (Claude API draft §5.3 B; Rotom mockup 5, k5 in mockups-v4).
// Each Day from `fromDay` a few applicants queue at the HQ with their paperwork: ID card, Trainer card, team, reference
// letter and their reason. Each one's hidden truth (honest recruit, sometimes a great trainer; police plant; rival-team
// spy; glory-seeker) is rolled on its own stream (`dominion-desk`) and saved; plants and spies carry planted mismatches
// (fewer the more skilled they are) and slip in their answers. The Boss inspects fields and asks questions (each costs
// the applicant's patience), then stamps Accept, Reject or Detain. Results come out later in the World Turn: a plant
// tips the police off, a spy leaks the HQ plan to their team, a glory-seeker quits; the basement reveals the detained.
// Rotom (src/ai) only voices the applicant and names the tell it showed; these rules decide everything else.

import type { Content } from '../contentSchema';
import { AI_DATA } from '../ai/rules';
import type { AiLog } from '../ai/schema';
import type { RunState } from '../state';
import { z } from 'zod';
import { addMorale, crewOf, freshCrewState, rng, withCrew } from './crew';
import { DOMINION_DATA } from './data';
import { addHeat, syncHeat } from './field';
import { cardPrompt, rollCard, sheet, voice } from './personality';
import { admit } from './recruit';
import { memberMonPool } from './start';
import {
  STAT_IDS, TELLS,
  type Applicant, type DeskField, type DeskState, type DominionBlock, type Lead, type Member, type StatId, type Tell, type Truth, type Verdict,
} from './schema';
import { addWorldStep, fill } from './worldTurn';

const D = () => DOMINION_DATA.desk;
const RC = () => DOMINION_DATA.crew.recruit;
const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, Math.round(n)));
type R = ReturnType<typeof rng>;
const pick = <T>(r: R, a: readonly T[]): T => a[r.int(0, a.length - 1)]!;
function weighted<T extends string>(r: R, w: Partial<Record<T, number>>): T | null {
  const rows = (Object.entries(w) as [T, number][]).filter(([, n]) => n > 0);
  const total = rows.reduce((a, [, n]) => a + n, 0);
  if (!total) return null;
  let x = r.int(1, total);
  for (const [k, n] of rows) if ((x -= n) <= 0) return k;
  return rows.at(-1)![0];
}
const LOG_CAP = 40;

/** The run's region for the desk (Kanto until the Crossing slices; any other region reads Kanto's paperwork). */
export const regionKey = (): string => DOMINION_DATA.start.start.region.toLowerCase();
export const deskRegion = () => D().regions[regionKey()] ?? D().regions.kanto!;
const hqDistrict = (): string => DOMINION_DATA.field.hq;
const districtName = (id: string): string => DOMINION_DATA.field.districts.find((d) => d.id === id)?.name ?? id;

export const freshDesk = (): DeskState => ({ day: 0, queue: [], seen: 0, names: [], held: [], watch: [], leaks: [], log: [] });
export const deskOf = (b: DominionBlock): DeskState => (b.desk ??= freshDesk());
/** The applicant at the window: the first one not stamped yet. */
export const current = (b: DominionBlock): Applicant | null => b.desk?.queue.find((a) => !a.verdict) ?? null;
/** Open today: the Day phase, from `fromDay`. */
export const deskOpen = (b: DominionBlock): boolean => b.phase === 'day' && b.day >= D().fromDay;

// ---------- the paperwork ----------

/** One wrong vowel in the first word ("Lavendar"); the same town and roll always give the same misspelling. */
export function misspell(town: string, r: R): string {
  const [w, ...rest] = town.split(' ');
  const word = w!;
  const spots = [...word].map((ch, i) => (i > 0 && /[aeiou]/i.test(ch) ? i : -1)).filter((i) => i > 0);
  let out: string;
  if (!spots.length) {
    const i = r.int(1, word.length - 1);
    out = word.slice(0, i) + word[i] + word.slice(i);
  } else {
    const i = pick(r, spots);
    const vowels = 'aeiou'.split('').filter((v) => v !== word[i]!.toLowerCase());
    out = word.slice(0, i) + pick(r, vowels) + word.slice(i + 1);
  }
  return [out, ...rest].join(' ');
}
const letterOf = (town: string): string => town[0]!.toUpperCase();

function rollStats(r: R, lean: StatId): Member['stats'] {
  const s = { brawn: 1, nerve: 1, wits: 1, charm: 1, stealth: 1 };
  for (const k of STAT_IDS) s[k] = r.int(1, 3);
  s[lean] = Math.min(10, s[lean] + 2);
  return s;
}

function freeName(b: DominionBlock, r: R, gender: 'm' | 'f', n: number): string {
  const used = new Set([...b.members.map((m) => m.name), ...(b.crew?.leads ?? []).map((l) => l.name), ...(b.crew?.hires ?? []).map((h) => h.name), ...deskOf(b).names]);
  for (let i = 0; i < 12; i++) {
    const name = `${pick(r, RC().names[gender])} ${pick(r, D().surnames)}`;
    if (!used.has(name)) return name;
  }
  return `${pick(r, RC().names[gender])} ${pick(r, D().surnames)} ${n}`;
}

/** Rolls applicant number `n` (A<n>) for today. Content is needed for the team's species. */
export function makeApplicant(content: Content, b: DominionBlock, seed: string, n: number): Applicant {
  const d = D();
  const reg = deskRegion();
  const r = rng(seed, 'dominion-desk', b.day, n);
  const cls = pick(r, RC().classes);
  const name = freeName(b, r, cls.gender, n);
  const card = rollCard(seed, name);
  const home = sheet(card).home;
  // The hidden truth: more police plants the hotter the region.
  const tw = Object.fromEntries(d.truths.map((t) => [t.id, t.weight + (t.id === 'plant' ? Math.floor(b.heat / d.plantPerHeat) : 0)])) as Record<Truth, number>;
  const truth = weighted(r, tw) ?? 'honest';
  const great = truth === 'honest' && r.int(1, 100) <= d.greatShare;
  const skill = truth === 'plant' || truth === 'spy' ? r.int(d.skill[0], d.skill[1]) : 0;
  const rival = truth === 'spy' ? pick(r, reg.rivals) : null;
  const stats = rollStats(r, cls.lean);
  if (great) stats[cls.lean] = Math.min(10, stats[cls.lean] + d.effects.great.lean);
  const greens = DOMINION_DATA.crew.greens;
  const motive = pick(r, DOMINION_DATA.crew.motives);
  const hates = pick(r, RC().pitches.filter((p) => p.id !== motive.pitch)).id;
  const badges = great ? r.int(4, 7) : truth === 'glory' ? r.int(3, 8) : r.int(1, 5);
  const cap = d.levelCaps[badges]!;
  // The first Pokémon fits the Team Types (Part 7), from the region's own list where it can; never an off-region one.
  const typePool = memberMonPool(content, b.types).filter((s) => content.species.has(s) && !reg.offRegion.includes(s));
  const typed = typePool.some((s) => reg.mons.includes(s)) ? typePool.filter((s) => reg.mons.includes(s)) : typePool;
  const local = reg.mons.filter((s) => content.species.has(s));
  const size = r.int(2, 4);
  const team = Array.from({ length: size }, (_, i) => ({
    s: i === 0 && typed.length ? pick(r, typed) : pick(r, local.length ? local : typed),
    lv: r.int(Math.max(2, cap - 8), Math.max(2, cap - 1)),
  }));
  const writer = pick(r, reg.writers);
  const reasonBank = truth === 'glory' && r.int(1, 100) <= 60 ? d.reasons.glory : great && r.int(1, 100) <= 50 ? d.reasons.great : d.reasons.any;
  const a: Applicant = {
    id: `A${n}`, name, gender: cls.gender, cls: cls.cls, kind: cls.kind, look: cls.look, role: cls.role ?? null,
    stats, green: pick(r, greens).id, motive: motive.id, hates, lean: cls.lean,
    age: r.int(d.age[0], d.age[1]), home, homeShown: home, idNo: `${r.int(1000, 9999)}-${letterOf(home)}`,
    badges, badgeAt: Math.max(0, badges - 1), team,
    writer: writer.name, wshort: writer.short, wtown: writer.town, quote: writer.quote, stamp: reg.codes[writer.town] ?? 'XXX',
    reason: fill(pick(r, reasonBank), { rival: reg.rivals[0]!, region: reg.name }),
    truth, great, skill, rival, miss: [], qs: [], asked: [], checked: [], patience: d.patience, verdict: null,
  };
  // Planted mismatches: how many by truth (and skill), which kinds by truth; never two of a kind.
  const counts = truth === 'plant' || truth === 'spy' ? d.missCount.bySkill[skill - 1]! : great ? d.missCount.great : truth === 'glory' ? d.missCount.glory : d.missCount.honest;
  const count = Number(weighted(r, Object.fromEntries(counts.map((w, i) => [String(i), w]))) ?? 0);
  const kinds = { ...d.missKinds[great ? 'great' : truth] };
  if (badges < 1 || badges >= 8) delete kinds.badge;
  if (d.levelCaps[badges]! >= 100) delete kinds.levels;
  if (team.length < 2 || !reg.offRegion.some((s) => content.species.has(s))) delete kinds.species;
  for (let i = 0; i < count; i++) {
    const k = weighted(r, kinds) as DeskField | null;
    if (!k) break;
    delete kinds[k];
    a.miss.push(k);
    plant(a, k, r, content);
  }
  // Three quick questions of the six (the badge one only with a badge).
  const qs = d.questions.filter((q) => q.id !== 'badge' || badges > 0).map((q) => q.id);
  a.qs = r.shuffle(qs).slice(0, d.quickPerApplicant);
  return a;
}

/** Changes the paperwork so field `k` is wrong. */
function plant(a: Applicant, k: DeskField, r: R, content: Content): void {
  const reg = deskRegion();
  if (k === 'home') a.homeShown = misspell(a.home, r);
  else if (k === 'idno') {
    const right = letterOf(a.home);
    a.idNo = `${a.idNo.split('-')[0]}-${pick(r, 'ABCDEFGHJKLMNPRSTVW'.split('').filter((l) => l !== right))}`;
  } else if (k === 'badge') a.badgeAt = r.int(a.badges, 7);
  else if (k === 'species') {
    const i = r.int(1, a.team.length - 1);
    a.team[i] = { s: pick(r, reg.offRegion.filter((s) => content.species.has(s))), lv: a.team[i]!.lv };
  } else if (k === 'levels') {
    const i = r.int(0, a.team.length - 1);
    a.team[i] = { ...a.team[i]!, lv: Math.min(100, D().levelCaps[a.badges]! + r.int(12, 25)) };
  } else if (k === 'stamp') {
    const codes = Object.entries(reg.codes).filter(([t]) => t !== a.wtown).map(([, c]) => c);
    a.stamp = pick(r, codes);
  }
}

/** Rolls today's queue the first time the Day is seen (from `fromDay`). Changes `b` in place; true when it rolled. */
export function rollQueue(content: Content, b: DominionBlock, seed: string): boolean {
  if (!deskOpen(b)) return false;
  const desk = deskOf(b);
  if (desk.day === b.day) return false;
  desk.day = b.day;
  desk.queue = [];
  const d = D();
  const n = rng(seed, 'dominion-desk', b.day, 'count').int(d.perDay[0], d.perDay[1]);
  for (let i = 0; i < n; i++) {
    const a = makeApplicant(content, b, seed, desk.seen + 1);
    desk.seen += 1;
    desk.names.push(a.name);
    desk.queue.push(a);
  }
  return true;
}

// ---------- at the window ----------

export interface DeskOut { ok: boolean; block: DominionBlock; notice: string | null }

function usable(b: DominionBlock): { a: Applicant; no: null } | { a: null; no: string } {
  const d = D();
  if (b.phase !== 'day') return { a: null, no: d.says.notDay! };
  if (b.day < d.fromDay) return { a: null, no: fill(d.says.closed!, { day: d.fromDay }) };
  const a = current(b);
  return a ? { a, no: null } : { a: null, no: d.says.empty! };
}

/** The tell this answer shows (rules: the truth, a plant's or spy's skill, the card's traits). */
export function rollTell(seed: string, day: number, a: Applicant, n: number): Tell {
  const odds = D().tellOdds[a.great ? 'great' : a.truth]!;
  const r = rng(seed, 'dominion-desk', day, a.id, 'tell', n);
  if (odds.slip) {
    const chance = Math.max(odds.slip.min, odds.slip.base - odds.slip.perSkill * a.skill);
    if (r.int(1, 100) <= chance) return (weighted(r, odds.slip.split) as Tell | null) ?? 'nervous';
  }
  const w = { ...odds.weights };
  const card = rollCard(seed, a.name);
  for (const t of sheet(card).traits) for (const [k, v] of Object.entries(D().traitTells[t.id] ?? {})) w[k as Tell] = Math.max(0, w[k as Tell] + v);
  return (weighted(r, w) as Tell | null) ?? 'none';
}

/** The words that fill a question or line ({home}, {writer}, {badge}, {mon}...). */
export function words(a: Applicant): Record<string, string> {
  const reg = deskRegion();
  const b = reg.badges[a.badgeAt];
  return {
    first: a.name.split(' ')[0]!, name: a.name, home: a.home, writer: a.writer, wshort: a.wshort, wtown: a.wtown,
    badge: b?.name ?? 'badge', btown: b?.town ?? a.home, rival: a.rival ?? reg.rivals[0]!, region: reg.name,
    mon: monLabel(a.team[0]!.s), cls: a.cls,
  };
}
export const monLabel = (id: string): string => id.split('-').map((w) => w[0]!.toUpperCase() + w.slice(1)).join(' ');

/** Clamps typed text the way a Rotom prompt does (no control characters, the length cap). */
export const clampTyped = (text: string): string =>
  // eslint-disable-next-line no-control-regex
  text.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, AI_DATA.playerText.maxChars);

/** Ask a quick question (an id from `a.qs`) or a typed one (`q: 'typed'`). Costs one patience. */
export function ask(block: DominionBlock, seed: string, q: string, text?: string): DeskOut {
  const b = structuredClone(block);
  const u = usable(b);
  if (!u.a) return { ok: false, block, notice: u.no };
  const a = u.a;
  const d = D();
  if (a.patience < 1) return { ok: false, block, notice: fill(d.says.patience!, { name: a.name }) };
  const typed = q === 'typed';
  const said = typed ? clampTyped(text ?? '') : null;
  if (typed && !said) return { ok: false, block, notice: null };
  const question = d.questions.find((x) => x.id === q);
  if (!typed && (!question || !a.qs.includes(q))) return { ok: false, block, notice: null };
  if (!typed && a.asked.some((x) => x.q === q)) return { ok: false, block, notice: d.says.asked! };
  const n = a.asked.length;
  const tell = rollTell(seed, b.day, a, n);
  const bank = typed ? d.typed[tell] : question!.lines[tell];
  const r = rng(seed, 'dominion-desk', b.day, a.id, 'line', n);
  const line = voice(sheet(rollCard(seed, a.name)).quirk, fill(pick(r, bank), words(a)));
  a.asked.push({ q, text: said, tell, line });
  a.patience -= 1;
  return { ok: true, block: b, notice: null };
}

/** The lens text for a field: what's wrong with it, or "Looks right." */
export function lensText(a: Applicant, f: DeskField): string {
  const d = D();
  if (!a.miss.includes(f)) return d.lens.fine;
  const reg = deskRegion();
  const odd = a.team.find((t) => !reg.mons.includes(t.s) && reg.offRegion.includes(t.s));
  const high = a.team.reduce((m, t) => (t.lv > m.lv ? t : m), a.team[0]!);
  const v: Record<string, string | number> = {
    true: a.home, town: a.home.split(' ')[0]!, letter: letterOf(a.home),
    badge: reg.badges[a.badgeAt]?.name ?? '', nth: d.ordinals[a.badgeAt] ?? '',
    mon: monLabel(odd?.s ?? a.team.at(-1)!.s), region: reg.name,
    level: high.lv, badges: `${a.badges} badge${a.badges === 1 ? '' : 's'}`,
    wtown: a.wtown.split(' ')[0]!, code: reg.codes[a.wtown] ?? '',
  };
  return fill(d.lens[f], v);
}

/** Inspect one field of the paperwork. Costs one patience; a found mismatch stays circled. */
export function inspect(block: DominionBlock, field: string): DeskOut {
  const b = structuredClone(block);
  const u = usable(b);
  if (!u.a) return { ok: false, block, notice: u.no };
  const a = u.a;
  const d = D();
  const f = d.fields.find((x) => x.id === field);
  if (!f) return { ok: false, block, notice: null };
  if (a.checked.includes(f.id)) return { ok: false, block, notice: d.says.checked! };
  if (a.patience < 1) return { ok: false, block, notice: fill(d.says.patience!, { name: a.name }) };
  a.checked.push(f.id);
  a.patience -= 1;
  const found = a.miss.includes(f.id);
  return { ok: true, block: b, notice: fill(found ? d.says.found! : d.says.fine!, { label: f.label, lens: lensText(a, f.id) }) };
}

export interface StampOut { ok: boolean; run: RunState; notice: string | null }

/** Stamp the papers. Accept makes them a member (the HQ must have room); Detain sends them to the basement. */
export function stamp(content: Content, run: RunState, verdict: Verdict): StampOut {
  const block = run.expansion?.dominion;
  if (!block) return { ok: false, run, notice: null };
  const u = usable(block);
  if (!u.a) return { ok: false, run, notice: u.no };
  const d = D();
  if (verdict === 'accept' && block.members.length >= block.rosterCap) return { ok: false, run, notice: d.says.full! };
  let out = structuredClone(run);
  let b = withCrew(out.expansion!.dominion!);
  out = { ...out, expansion: { ...out.expansion, dominion: b } };
  const desk = deskOf(b);
  const a = current(b)!;
  a.verdict = verdict;
  desk.log.push({ day: b.day, name: a.name, truth: a.truth, great: a.great, verdict });
  if (desk.log.length > LOG_CAP) desk.log.splice(0, desk.log.length - LOG_CAP);
  let notice: string;
  if (verdict === 'accept') {
    // In through D3's door: a lead on the waiting list who is admitted at once (same member shape as any recruit).
    const lead: Lead = {
      id: a.id, name: a.name, cls: a.cls, kind: a.kind, look: a.look, gender: a.gender, role: a.role, stats: a.stats,
      green: a.green, motive: a.motive, hates: a.hates, chance: 100, foundBy: 'desk', day: b.day, notBefore: 0, bonus: 0, waiting: true, pitch: null,
    };
    b.crew!.leads.push(lead);
    const res = admit(content, out, lead.id);
    out = res.run;
    b = out.expansion!.dominion!;
    const m = b.members.at(-1)!;
    const mc = crewOf(m);
    mc.card = rollCard(out.seed, m.name);
    mc.flags.push(`desk:${a.truth}${a.great ? ':great' : ''}`);
    if (a.great) {
      m.traitPoints += d.effects.great.traitPoints;
      m.loyalty = Math.max(m.loyalty, d.effects.great.loyalty);
    }
    const r = rng(out.seed, 'dominion-desk', b.day, a.id, 'later');
    const days = a.truth === 'plant' ? d.effects.plant.tipDays : a.truth === 'spy' ? d.effects.spy.leakDays : a.truth === 'glory' ? d.effects.glory.quitDays : null;
    if (days) deskOf(b).watch.push({ member: m.id, name: m.name, truth: a.truth, rival: a.rival, due: b.day + r.int(days[0], days[1]), done: false });
    notice = fill(d.says.accept!, { name: a.name });
  } else if (verdict === 'reject') notice = fill(d.says.reject!, { name: a.name });
  else {
    desk.held.push(structuredClone(a));
    addHeat(b, hqDistrict(), d.effects.detain.heat);
    syncHeat(b);
    notice = fill(d.says.detain!, { name: a.name, heat: d.effects.detain.heat });
  }
  return { ok: true, run: out, notice };
}

// ---------- the World Turn ----------

/** The desk's part of the night: the queue goes home, the basement talks, and accepted plants, spies and glory-seekers
 * show what they are when their day comes. Registered after the crew (it reads who is still on it). */
export function deskStep(block: DominionBlock, _seed: string): string[] {
  const desk = block.desk;
  if (!desk) return [];
  const d = D();
  const rep = d.report;
  const lines: string[] = [];
  const left = desk.queue.filter((a) => !a.verdict).length;
  if (left) lines.push(fill(rep.left, { n: left, s: left === 1 ? '' : 's' }));
  desk.queue = [];
  const hq = hqDistrict();
  const ds = block.field.districts[hq];
  const e = d.effects;
  for (const a of desk.held) {
    const key = a.great ? 'great' : a.truth;
    const v = { name: a.name, cls: a.cls, rival: a.rival ?? '', district: districtName(hq), m: Math.abs(e.detain.honestMorale), h: e.detain.plantHeat };
    lines.push(fill(rep.held[key], v));
    if (a.truth === 'honest') for (const m of block.members) addMorale(m, e.detain.honestMorale);
    else if (a.truth === 'plant') addHeat(block, hq, e.detain.plantHeat);
    else if (a.truth === 'spy' && ds) ds.rival = clamp(ds.rival + e.detain.spyRival);
  }
  desk.held = [];
  for (const w of desk.watch) {
    if (w.done) continue;
    const m = block.members.find((x) => x.id === w.member);
    if (!m) { w.done = true; continue; }
    if (w.truth === 'plant') {
      addHeat(block, hq, e.plant.nightHeat);
      if (block.day < w.due) continue;
      addHeat(block, hq, e.plant.tipHeat);
      block.members = block.members.filter((x) => x !== m);
      (block.crew ??= freshCrewState()).gone.push({ id: m.id, name: m.name, day: block.day, why: 'plant' });
      lines.push(fill(rep.plantTip, { name: m.name, h: e.plant.tipHeat }));
      w.done = true;
    } else if (w.truth === 'spy' && block.day >= w.due) {
      const team = w.rival ?? deskRegion().rivals[0]!;
      if (ds) ds.rival = clamp(ds.rival + e.spy.rival);
      desk.leaks.push({ day: block.day, team, what: 'hq-plan' });
      lines.push(fill(rep.spyLeak, { rival: team, district: districtName(hq) }));
      w.done = true;
    } else if (w.truth === 'glory' && block.day >= w.due) {
      block.members = block.members.filter((x) => x !== m);
      (block.crew ??= freshCrewState()).gone.push({ id: m.id, name: m.name, day: block.day, why: 'quit' });
      for (const o of block.members) addMorale(o, e.glory.morale);
      lines.push(fill(rep.gloryQuit, { name: m.name, m: Math.abs(e.glory.morale) }));
      w.done = true;
    }
  }
  desk.watch = desk.watch.filter((w) => !w.done);
  syncHeat(block);
  return lines;
}
addWorldStep('police', deskStep);

// ---------- Rotom (the talk-back) ----------

/** What Rotom must answer with: the line and the tell it showed (checked against the four tells). */
export const DeskReplySchema = z.object({ reply: z.string().trim().min(1).max(400), tell: z.enum(TELLS) }).strict();
export type DeskReply = z.infer<typeof DeskReplySchema>;

/** The call id for the n-th answer of an applicant: stable, so a reload reads the stored answer. */
export const deskCallId = (day: number, a: Applicant, n: number): string => `desk:${day}:${a.id}:${n}`;

export interface DeskTalk {
  id: string;
  system: string;
  context: string;
  input: string;
  /** Typed questions follow the "Typed arguments" switch; quick ones are always voiced when Rotom is on. */
  typed: boolean;
  offline: DeskReply;
}

/** The pieces of the Rotom call for answer `n` of the applicant at the window (or null). The truth is in the context:
 * Rotom plays the part; the tell to show was rolled by the rules. */
export function deskTalk(b: DominionBlock, seed: string, applicantId: string, n: number, wrap: (t: string) => string): DeskTalk | null {
  const a = b.desk?.queue.find((x) => x.id === applicantId);
  const said = a?.asked[n];
  if (!a || !said) return null;
  const d = D();
  const reg = deskRegion();
  const w = words(a);
  const truth = d.truths.find((t) => t.id === a.truth)!;
  const context = [
    cardPrompt(a.name, `applicant at the desk (${a.cls}, age ${a.age})`, rollCard(seed, a.name)),
    `Region: ${reg.name}. Paperwork: ID home town "${a.homeShown}", ID number ${a.idNo}; ${a.badges} badge(s), latest ${w.badge}; team ${a.team.map((t) => `${monLabel(t.s)} Lv. ${t.lv}`).join(', ')}; reference letter from ${a.writer} of ${a.wtown}; reason: "${a.reason}".`,
    `Hidden truth (never say it outright): you are ${fill(truth.word, { rival: a.rival ?? '' })}${a.great ? ', and a genuinely strong trainer' : ''}.${a.skill ? ` Your skill at lying: ${a.skill} of 5.` : ''}`,
  ].join('\n');
  const before = a.asked.slice(0, n).map((x) => `Boss: ${x.text ? wrap(x.text) : questionLabel(a, x.q)}\nYou: ${x.line}`).join('\n');
  const q = said.text ? wrap(said.text) : questionLabel(a, said.q);
  const input = `${before ? `Earlier in this interview:\n${before}\n\n` : ''}The Boss asks: ${q}\nThe tell to show: ${said.tell}.`;
  return { id: deskCallId(b.day, a, n), system: d.rotom.system, context, input, typed: !!said.text, offline: { reply: said.line, tell: said.tell } };
}

export const questionLabel = (a: Applicant, q: string): string => fill(D().questions.find((x) => x.id === q)?.ask ?? q, words(a));

// ---------- the screen's model (mockup k5) ----------

export interface DeskModel {
  state: 'open' | 'closed' | 'empty';
  closedLine: string;
  day: number;
  /** "2 of 4". */
  place: string;
  a: null | {
    id: string; name: string; age: number; homeShown: string; idNo: string; look: string; cls: string;
    badges: number; dots: string[]; latest: string | null; latestTown: string | null;
    team: { name: string; lv: number }[];
    quote: string; writer: string; wtown: string; stamp: string; reason: string;
    patience: number;
  };
  queue: string[];
  fields: { id: DeskField; label: string; checked: boolean; found: boolean; lens: string }[];
  found: number;
  /** The last field checked (the Inspect lens). */
  lens: null | { id: DeskField; label: string; shown: string; found: boolean; text: string };
  questions: { id: string; label: string; asked: boolean }[];
  /** The latest answer: the question, the reply and its tell, and where the words came from. */
  last: null | { you: string; reply: string; tell: { id: Tell; label: string; c: string }; from: 'rotom' | 'offline' | 'thinking'; chip: string | null };
  rotomNote: string;
  rosterFull: boolean;
  doneToday: { name: string; verdict: Verdict }[];
}

/** The value a field shows on the paperwork. */
function shown(a: Applicant, f: DeskField): string {
  const reg = deskRegion();
  switch (f) {
    case 'home': return a.homeShown;
    case 'idno': return a.idNo;
    case 'badge': return reg.badges[a.badgeAt]?.name ?? '—';
    case 'species': return a.team.map((t) => monLabel(t.s)).join(', ');
    case 'levels': return a.team.map((t) => `Lv. ${t.lv}`).join(', ');
    case 'stamp': return a.stamp;
  }
}

/** `rotom`: a Key-Card is in and Rotom is on (the note under the questions says who plays the applicant). */
export function deskModel(b: DominionBlock, seed: string, log: AiLog | undefined, pending: ReadonlySet<string>, rotom = false): DeskModel {
  const d = D();
  const desk = b.desk;
  const today = desk && desk.day === b.day ? desk.queue : [];
  const a = deskOpen(b) ? current(b) : null;
  const reg = deskRegion();
  const state = !deskOpen(b) ? 'closed' : a ? 'open' : 'empty';
  const closedLine = b.phase !== 'day' ? d.says.notDay! : b.day < d.fromDay ? fill(d.says.closed!, { day: d.fromDay }) : d.says.empty!;
  const at = a ? today.indexOf(a) : today.length;
  const fields = a ? d.fields.map((f) => ({ id: f.id, label: f.label, checked: a.checked.includes(f.id), found: a.checked.includes(f.id) && a.miss.includes(f.id), lens: a.checked.includes(f.id) ? lensText(a, f.id) : '' })) : [];
  const lastF = a?.checked.at(-1);
  let last: DeskModel['last'] = null;
  if (a && a.asked.length) {
    const n = a.asked.length - 1;
    const said = a.asked[n]!;
    const id = deskCallId(b.day, a, n);
    const e = log?.[id];
    const ai = e?.s === 'ai' ? DeskReplySchema.safeParse(e.v) : null;
    const tellOf = (t: Tell) => ({ id: t, ...d.tells[t] });
    const you = said.text ?? questionLabel(a, said.q);
    if (ai?.success) {
      const speed = d.rotom.speed[e!.m ?? 'haiku'] ?? 'Quick';
      last = { you, reply: ai.data.reply, tell: tellOf(ai.data.tell), from: 'rotom', chip: `${speed} · tell: ${d.tells[ai.data.tell].label.toLowerCase()} · saved` };
    } else if (pending.has(id)) last = { you, reply: d.rotom.thinking, tell: tellOf('none'), from: 'thinking', chip: null };
    else last = { you, reply: said.line, tell: tellOf(said.tell), from: 'offline', chip: null };
  }
  return {
    state, closedLine, day: b.day, place: `${Math.min(at + 1, today.length)} of ${today.length}`,
    a: a ? {
      id: a.id, name: a.name, age: a.age, homeShown: a.homeShown, idNo: a.idNo, look: a.look, cls: a.cls,
      badges: a.badges, dots: reg.badges.slice(0, a.badges).map((x) => x.c),
      latest: a.badges ? `${d.ordinals[a.badges - 1]}: ${reg.badges[a.badgeAt]!.name}` : null,
      latestTown: a.badges ? reg.badges[a.badgeAt]!.town.split(' ')[0]! + ' Gym' : null,
      team: a.team.map((t) => ({ name: monLabel(t.s), lv: t.lv })),
      quote: fill(a.quote, { first: a.name.split(' ')[0]! }), writer: a.writer, wtown: a.wtown.split(' ')[0]!, stamp: a.stamp, reason: a.reason,
      patience: a.patience,
    } : null,
    queue: today.slice(at + 1, at + 4).map((x) => x.look),
    fields,
    found: fields.filter((f) => f.found).length,
    lens: a && lastF ? { id: lastF, label: d.fields.find((f) => f.id === lastF)!.label, shown: shown(a, lastF), found: a.miss.includes(lastF), text: lensText(a, lastF) } : null,
    questions: a ? a.qs.map((q) => ({ id: q, label: questionLabel(a, q), asked: a.asked.some((x) => x.q === q) })) : [],
    last,
    rotomNote: last?.from === 'rotom' || (rotom && last?.from !== 'offline') ? d.rotom.note : d.rotom.off,
    rosterFull: b.members.length >= b.rosterCap,
    doneToday: today.filter((x) => x.verdict).map((x) => ({ name: x.name, verdict: x.verdict! })),
  };
}

/** For the HQ chip: applicants waiting at the desk today. */
export const waiting = (b: DominionBlock): number => (deskOpen(b) && b.desk?.day === b.day ? b.desk.queue.filter((a) => !a.verdict).length : 0);

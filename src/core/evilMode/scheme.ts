// Evil Mode's Grand Scheme (design Part 22; Part 5 section 7; Part 12 section 3 heists; Part 13 section 3 Digs; Part 26a
// section 2.4 Kanto's own scheme, the Ledger; Part 30 section 3.6). Four parts (a Means, a Place, a Key, a Moment), each
// got a clean way or a dirty way and stamped so when it's got; groundwork's the last 20%, from the Creed's ordinary work.
// The percentage is never stored: it's four twenties and the groundwork. Pure: new blocks are returned. The rolls (a
// heist's way in and out, its rooms, a crew member caught) draw on their own stream, `evil-scheme`.

import { hashSeed, Rng } from '../rng';
import { holdingName, localOf } from './board';
import { EVIL_DATA, type EvilData } from './data';
import { inChair } from './gym';
import { appendLog, fill, money } from './ledger';
import { inRoster, moveLoyalty } from './people';
import { tradeProblem } from './economy';
import { STANCES, type CardField, type Crew, type DigDef, type DigState, type EvilModeBlock, type HeistDef, type HeistState, type Holding, type PartId, type SchemeFamily, type SchemePart, type SchemeState, type SchemeWay, PARTS, emptyScheme } from './schema';

export type WayKey = 'clean' | 'dirty' | 'second';
export interface Out { block: EvilModeBlock; problem: string | null; lines: string[] }
const bad = (block: EvilModeBlock, problem: string): Out => ({ block, problem, lines: [] });

export const schemeOn = (data: EvilData = EVIL_DATA): boolean => data.scheme.on;
const W = (k: string, data: EvilData, v: Record<string, string | number> = {}): string => fill(data.scheme.words[k] ?? k, v);
const cap10 = (n: number) => Math.max(0, Math.min(10, n));
const PART_NAME: Record<PartId, string> = { means: 'The Means', place: 'The Place', key: 'The Key', moment: 'The Moment' };
export const partName = (p: PartId): string => PART_NAME[p];

/** A new Scheme for a Creed; Wonder's Legend is drawn from the seed (no gameplay stream: it's fixed at founding). */
export function newScheme(creed: string, seed: string, data: EvilData = EVIL_DATA): SchemeState {
  const s = emptyScheme(creed);
  const legends = data.scheme.families.find((f) => f.id === creed)?.legends ?? [];
  return { ...s, legend: legends.length ? legends[new Rng(hashSeed(`${seed}::evil-legend`)).int(0, legends.length - 1)]! : null };
}

/** The Scheme's family as written, or null for a fallen neighbour's taken up (it has no ways: every part's already stamped). */
export const familyOf = (block: EvilModeBlock, data: EvilData = EVIL_DATA): SchemeFamily | null => (block.scheme.inherited ? null : data.scheme.families.find((f) => f.id === block.scheme.family) ?? null);

/** The percentage: each part in hand is worth its twenty, and the groundwork (to twenty). Worked out, never stored. */
export function schemePct(s: Pick<SchemeState, 'parts' | 'groundwork'>, data: EvilData = EVIL_DATA): number {
  const parts = PARTS.filter((p) => s.parts[p].state === 'inHand').length;
  return Math.min(100, parts * data.scheme.rules.part + Math.max(0, Math.min(data.scheme.rules.groundCap, s.groundwork)));
}

/** The sentence under the bar: the last one written at or under the percentage (it gets plainer as the number rises). */
export function sentenceAt(block: EvilModeBlock, data: EvilData = EVIL_DATA): string {
  const f = familyOf(block, data);
  if (!f) return block.neighbour?.scheme?.name ?? block.scheme.family;
  const pct = schemePct(block.scheme, data);
  return [...f.sentences].filter((x) => x.at <= pct).sort((a, b) => b.at - a.at)[0]?.text ?? f.says;
}

// ---- Pace (Part 22 section 1.1): Region 1 the Means; Region 2 the Place and Key; Region 3 the Moment. With only one region
// written (Kanto), the same order runs across its districts: the Means from District 1, the Place and Key from District 3,
// the Moment in District 6.

const regionsWritten = (data: EvilData): number => Math.max(1, data.region.regions.filter((r) => r.status === 'supported' || r.status === 'limited').length);
export function paceProblem(block: EvilModeBlock, part: PartId, data: EvilData = EVIL_DATA): string | null {
  const d = block.district;
  if (!d) return 'Not in a district.';
  const R = data.scheme.rules.pace;
  if (regionsWritten(data) <= 1) {
    const from = R.one[part];
    return d.n >= from ? null : W('offPace', data, { part: partName(part), when: `District ${from}` });
  }
  const [r, n] = R.three[part] ?? [0, 1];
  return d.region > r || (d.region === r && d.n >= n) ? null : W('offPace', data, { part: partName(part), when: `Region ${r + 1}, District ${n}` });
}

/** The district (n) the Moment comes in, and the region. */
export function momentWhere(data: EvilData = EVIL_DATA): { region: number; n: number } {
  const R = data.scheme.rules.pace;
  if (regionsWritten(data) <= 1) return { region: 0, n: R.one.moment };
  const [region, n] = R.three.moment ?? [2, 6];
  return { region, n };
}

// ---- People: who's free for a Scheme job ----

/** Why a person's busy with the Scheme today (a job running, a Dig, a heist's crew), or null. */
export function schemeBusy(block: EvilModeBlock, id: string): string | null {
  const s = block.scheme;
  if (!s) return null;
  const c = block.crew.find((x) => x.id === id);
  const name = c?.name ?? 'They';
  const day = block.here.day;
  if (s.jobs.some((j) => j.doneOn >= day && j.since <= day && j.squad.includes(id))) return `${name} is on the Scheme.`;
  if (s.digs.some((g) => g.ended === 'running' && g.squad.includes(id))) return `${name} is on a Dig.`;
  if (s.heist && (s.heist.stage === 'plan' || s.heist.stage === 'rooms') && (s.heist.crew.includes(id) || s.heist.plan.watcher === id)) return `${name} is on tonight's job.`;
  return null;
}

const crosses = (p: Crew, tags: readonly string[], data: EvilData): boolean => p.line !== null && (data.people.lines.find((l) => l.n === p.line)?.tags ?? []).some((t) => tags.includes(t));
/** Free today: in, grown, not resting, not on a job, posted, in a Gym's chair, on trade or on the Scheme. */
export function freeCrew(block: EvilModeBlock): Crew[] {
  const day = block.here.day;
  return inRoster(block).filter((c) => !c.minor && c.outOn !== day && !block.queue.some((j) => j.squad.includes(c.id)) && !block.posted.some((p) => p.id === c.id) && !inChair(block, c.id) && !tradeProblem(block, c.id) && !schemeBusy(block, c.id));
}
/** Who'd go (preferring the talents asked for) and who won't (their line's crossed by the way's tags). */
export function schemeSquad(block: EvilModeBlock, tags: readonly string[], talents: readonly string[] = [], max = 3, data: EvilData = EVIL_DATA): { squad: Crew[]; wont: Crew[] } {
  const free = freeCrew(block);
  const wont = free.filter((c) => crosses(c, tags, data));
  const go = free.filter((c) => !crosses(c, tags, data));
  const first = talents.map((t) => go.find((c) => c.talent === t)).filter((c): c is Crew => !!c);
  const rest = go.filter((c) => !first.includes(c));
  return { squad: [...new Set([...first, ...rest])].slice(0, Math.max(first.length, max)), wont };
}

// ---- The ways ----

export function wayOf(f: SchemeFamily | null, part: PartId, key: WayKey): SchemeWay | undefined {
  return f?.parts[part][key];
}

const gymsDealt = (block: EvilModeBlock): { any: number; clean: number; ways: string[] } => {
  const dealt = (block.gyms ?? []).filter((g) => g.way !== null);
  return { any: dealt.length, clean: dealt.filter((g) => g.way === 'bend' || g.way === 'replace' || g.way === 'befriend').length, ways: dealt.map((g) => g.way!) };
};
const warmLocals = (block: EvilModeBlock): number => (block.district?.holdings ?? []).filter((h) => h.kind === 'local' && h.mood === 'warm').length;
const lineAtLeast = (block: EvilModeBlock, min: string): boolean => ['clean', 'grey', 'whatever'].indexOf(block.team.line) >= ['clean', 'grey', 'whatever'].indexOf(min);

/** Why this way can't be taken now (or null). Checked here, not only on screen. */
export function wayProblem(block: EvilModeBlock, part: PartId, key: WayKey, data: EvilData = EVIL_DATA): string | null {
  if (!schemeOn(data)) return 'The Scheme is switched off.';
  const s = block.scheme;
  const f = familyOf(block, data);
  if (!f) return s.inherited ? 'Every part of this one is already stamped.' : W('noScheme', data);
  if (!block.district || block.district.end) return 'Not in a district.';
  const slot = s.parts[part];
  const way = wayOf(f, part, key);
  if (!way) return 'There is no such way.';
  if (slot.state === 'inHand') return `${partName(part)} is already in hand.`;
  if (key === 'second' && slot.state !== 'lost') return 'The second source is only for a part that was lost.';
  if (key !== 'second' && slot.state === 'lost') return `It was lost. Only the second source is left: ${f.parts[part].second?.name ?? 'none'}.`;
  const pace = paceProblem(block, part, data);
  if (pace) return pace;
  if (s.jobs.some((j) => j.part === part)) return `${partName(part)} is already being worked on.`;
  if (s.digs.some((g) => g.part === part && (g.ended === 'running' || g.ended === 'choose'))) return `A Dig for ${partName(part)} is running.`;
  if (s.heist && s.heist.part === part && (s.heist.stage === 'plan' || s.heist.stage === 'rooms')) return `A heist for ${partName(part)} is planned.`;
  if (way.how === 'wait') return part === 'moment' ? 'It comes when it comes: the Moment is a day, not a thing.' : 'It comes on its own.';
  if (way.how === 'gyms') return `It comes the Evening the fourth Gym is dealt with (${gymsDealt(block).any} so far).`;
  const n = way.needs ?? {};
  if (n.line && !lineAtLeast(block, n.line)) return `Not at the team's Line (${block.team.line}).`;
  if (n.regard !== undefined && block.team.regard < n.regard) return `Needs Regard ${n.regard} (it's ${block.team.regard}).`;
  if (n.gymsClean !== undefined && gymsDealt(block).clean < n.gymsClean) return `Needs a Leader who'll vouch: a Bent, Replaced or Befriended Gym.`;
  if (n.gymsAny !== undefined && gymsDealt(block).any < n.gymsAny) return `Needs ${n.gymsAny} Gyms dealt with (${gymsDealt(block).any} so far).`;
  if (n.proof !== undefined && block.proof.length < n.proof) return 'Needs proof the team holds about somebody.';
  if (n.warm !== undefined && warmLocals(block) < n.warm) return `Needs ${n.warm} locals at Warm here (${warmLocals(block)}).`;
  const { squad } = schemeSquad(block, way.tags ?? [], n.talents ?? [], 3, data);
  if (n.talents?.some((t) => !squad.some((c) => c.talent === t))) return `Needs ${n.talents.join(' and ')} free today.`;
  if (n.squads !== undefined && squad.length < Math.min(n.squads, 3) && freeCrew(block).length < n.squads) return `Needs ${n.squads} free (${freeCrew(block).length}).`;
  if (way.how !== 'count' && squad.length === 0 && way.how !== 'cause') return 'Nobody is free today.';
  if ((way.cost ?? 0) > block.team.funds) return `Needs ${money(way.cost ?? 0)} (Funds ${money(block.team.funds)}).`;
  const beat = block.here.beat;
  if (way.how === 'job' || way.how === 'dig' || way.how === 'cause') {
    if (way.inPerson ? beat !== 'inPerson' : beat !== 'dispatch') return way.inPerson ? 'In person: at the In person beat.' : 'At Dispatch.';
    if (way.inPerson && block.inPerson?.day === block.here.day) return 'The Boss has already been out today.';
  }
  if (way.how === 'cause') {
    if (s.moment.came) return 'The Moment has been.';
    const m = momentWhere(data);
    if (block.district.region !== m.region || block.district.n < m.n - 1) return `It can only be caused close to the Moment: from District ${m.n - 1}.`;
  }
  if (way.how === 'count') {
    const c = homeCount(block, data);
    if (c.n < data.scheme.rules.homeNeed) return `${c.n} of ${data.scheme.rules.homeNeed}. The game's counting.`;
  }
  if (way.how === 'heist') return heistOfferProblem(block, way.heist!, data, true);
  if (way.how === 'dig') return digSites(block, way.dig!, data).length ? null : 'No held holding here can be dug for it.';
  return null;
}

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

/** The Honest Card for a part's way: thirteen fields. The dirty way's the job as offered; the clean way's in the thirteenth field, and the other way round. */
export function schemeCard(block: EvilModeBlock, part: PartId, key: WayKey, data: EvilData = EVIL_DATA): CardField[] {
  const f = familyOf(block, data)!;
  const way = wayOf(f, part, key)!;
  const other = key === 'clean' ? wayOf(f, part, 'dirty') : key === 'dirty' ? wayOf(f, part, 'clean') : wayOf(f, part, 'clean');
  const town = block.district?.holdings.find((h) => h.kind === 'town')?.ref ?? 'the town';
  const v = { town, legend: block.scheme.legend ? block.scheme.legend.charAt(0).toUpperCase() + block.scheme.legend.slice(1) : 'the Legend', boss: block.team.boss };
  const { squad, wont } = schemeSquad(block, way.tags ?? [], way.needs?.talents ?? [], 3, data);
  const stamp = key === 'dirty' ? W('notClean', data) : W('clean', data);
  const moves = [way.cost ? `Funds ↓ ${money(way.cost)}.` : '', way.heat ? `Heat ${signed(way.heat)}.` : '', way.dread ? `Dread ${signed(way.dread)}.` : '', way.regard ? `Regard ${signed(way.regard)}.` : '', way.days ? `${way.days} day${way.days > 1 ? 's' : ''}.` : '', `Stamped ${stamp}. It can't be changed after.`].filter(Boolean).join(' ');
  const odds = way.how === 'heist' ? 'By the plan, and the rooms: played in person.' : way.how === 'dig' ? 'Certain. What else is found is found.' : way.how === 'wait' || way.how === 'gyms' || way.how === 'count' ? 'It comes when it comes.' : 'Certain, if it is carried through.';
  const otherText = other && other !== way ? `${other.name}. ${fill(other.text.takes, v)}` : key === 'second' ? `It's the dearer way: the first is gone. ${f.parts[part].clean.name}.` : "There's no other way: it's the same either way.";
  const fields: string[] = [
    `A SCHEME PART · ${f.name.toUpperCase()} · ${partName(part).toUpperCase()} · ${way.name.toUpperCase()}`,
    fill(way.text.takes, v),
    fill(way.text.from, v),
    fill(way.text.gives, v),
    moves,
    odds,
    squad.map((c, i) => `${c.name}${i === 0 ? ' (leads)' : ''}`).join(', ') || '—',
    wont.length ? wont.map((c) => `${c.name} ("${(data.people.lines.find((l) => l.n === c.line)?.text ?? '').replace(/\.$/, '')}")`).join('. ') : "Nobody's line is crossed by it.",
    "Once in hand it stays in hand, unless it's lost: a Raid on a Vault under Large, or the Reckoning lost with nobody to carry it.",
    fill(way.text.hero, v),
    'Nothing.',
    fill(way.text.written, v),
    otherText,
  ];
  return fields.map((text, i) => ({ label: data.ledger.fields[i]!, text, unknown: false }));
}

/** Files a Scheme Card (kept with its day) and its Ledger line. */
function fileCard(block: EvilModeBlock, key: string, clean: boolean, fields: CardField[], who: string[]): { block: EvilModeBlock; id: string } {
  const id = `S${block.scheme.cards.length + 1}`;
  const b: EvilModeBlock = { ...block, scheme: { ...block.scheme, cards: [...block.scheme.cards, { id, day: block.here.day, key, clean, fields }] } };
  return { block: appendLog(b, { kind: 'scheme', who, cardId: id, text: `Day ${block.here.day}. ${fields[11]!.text}` }), id };
}

/** A part stamped: in hand, clean or not, with its day and who got it. The stamp is never edited afterwards. */
export function stamp(block: EvilModeBlock, part: PartId, clean: boolean, way: string, by: string | null, cardId: string | null): { block: EvilModeBlock; line: string } {
  const slot = block.scheme.parts[part];
  if (slot.state === 'inHand') return { block, line: '' };
  const next: SchemePart = { state: 'inHand', clean, day: block.here.day, way, by, cardId, lostTimes: slot.lostTimes };
  const b = { ...block, scheme: { ...block.scheme, parts: { ...block.scheme.parts, [part]: next } } };
  const line = W('partGot', EVIL_DATA, { part: partName(part), stamp: clean ? W('clean', EVIL_DATA) : W('notClean', EVIL_DATA) });
  return { block: appendLog(b, { kind: 'scheme', who: by ? [by] : [], text: `Day ${block.here.day}. ${line}` }), line };
}

/** A part lost (a Raid with it in a Vault under Large; the Reckoning lost with nobody to carry it). Its stamp goes with it. */
export function losePart(block: EvilModeBlock, part: PartId): { block: EvilModeBlock; line: string } {
  const slot = block.scheme.parts[part];
  if (slot.state !== 'inHand' || part === 'moment') return { block, line: '' };
  if (block.scheme.family === 'belonging' && part === 'key' && slot.way === 'earned') return { block, line: "It can't be lost. It's people." };
  const next: SchemePart = { state: 'lost', clean: null, day: null, way: null, by: null, cardId: null, lostTimes: slot.lostTimes + 1 };
  const line = W('partLost', EVIL_DATA, { part: partName(part) });
  const b = { ...block, scheme: { ...block.scheme, parts: { ...block.scheme.parts, [part]: next } } };
  return { block: appendLog(b, { kind: 'scheme', who: [], text: `Day ${block.here.day}. ${line}` }), line };
}

const moveTeam = (block: EvilModeBlock, m: { heat?: number; dread?: number; regard?: number; funds?: number }): EvilModeBlock => ({
  ...block,
  team: { ...block.team, heat: cap10(block.team.heat + (m.heat ?? 0)), dread: cap10(block.team.dread + (m.dread ?? 0)), regard: cap10(block.team.regard + (m.regard ?? 0)), funds: Math.max(0, block.team.funds + (m.funds ?? 0)) },
});
const ranHere = (block: EvilModeBlock): Record<string, number> => (block.district ? { ...block.scheme.credited, [`ran:${block.district.region}:${block.district.n}`]: 1 } : block.scheme.credited);

/** Taking a part's way: a job (days and money), a heist planned, a Dig started, the Moment caused, the Home's count claimed. */
export function takeWay(block0: EvilModeBlock, part: PartId, key: WayKey, holdingId?: string, data: EvilData = EVIL_DATA): Out {
  const p = wayProblem(block0, part, key, data);
  if (p) return bad(block0, p);
  const f = familyOf(block0, data)!;
  const way = wayOf(f, part, key)!;
  const { squad } = schemeSquad(block0, way.tags ?? [], way.needs?.talents ?? [], way.needs?.squads ?? 3, data);
  const fields = schemeCard(block0, part, key, data);
  let { block, id } = fileCard(block0, `${part}:${key}:${way.id}`, key !== 'dirty', fields, squad.map((c) => c.id));
  block = { ...block, scheme: { ...block.scheme, credited: ranHere(block) } };
  if (way.how === 'heist') return planHeist(block, way.heist!, part, `${key}:${way.id}`, id, data);
  if (way.how === 'dig') return startDig(block, way.dig!, part, holdingId, id, data);
  block = moveTeam(block, { funds: -(way.cost ?? 0) });
  if (way.how === 'cause') {
    block = moveTeam(block, { heat: way.heat ?? 0, dread: way.dread ?? 0 });
    block = { ...block, scheme: { ...block.scheme, moment: { day: block.here.day + 1, caused: true, came: null } } };
    return { block, problem: null, lines: [W('momentCaused', data)] };
  }
  if (way.how === 'count') {
    const s = stamp(block, part, true, way.id, null, id);
    return { block: s.block, problem: null, lines: [s.line] };
  }
  const days = way.days ?? 1;
  const job = { part, way: `${key}:${way.id}`, since: block.here.day, doneOn: block.here.day + days - 1, squad: squad.map((c) => c.id), cardId: id };
  block = { ...block, scheme: { ...block.scheme, jobs: [...block.scheme.jobs, job] }, ...(way.inPerson ? { inPerson: { day: block.here.day, holdingId: block.district!.holdings.find((h) => h.kind === 'town')!.id } } : {}) };
  return { block, problem: null, lines: [`${way.name}: ${days} day${days > 1 ? 's' : ''}. ${squad[0]?.name ?? 'The Boss'} leads.`] };
}

// ---- Groundwork (Part 22 sections 2 to 7, by Creed; Part 5 section 7) ----

function sourceCount(block: EvilModeBlock, kind: string): number | null {
  const e = block.economy;
  switch (kind) {
    case 'honest': return e.running.filter((v) => v.kind === 'racket' && v.honest).length;
    case 'straight': return e.running.filter((v) => v.kind === 'front').reduce((n, v) => n + v.straight.length, 0);
    case 'persuade': return block.log.filter((x) => x.kind === 'job' && x.result === 'went' && x.method === 'persuade').length;
    case 'gym': return gymsDealt(block).any;
    case 'work': return Math.max(e.worksIn.length, e.running.filter((v) => v.kind === 'work' && v.done).length);
    default: return null; // dig and truth are counted when they happen
  }
}

/** Adds groundwork (to the cap, never under 0). */
export function addGround(block: EvilModeBlock, n: number): EvilModeBlock {
  const g = Math.max(0, Math.min(EVIL_DATA.scheme.rules.groundCap, block.scheme.groundwork + n));
  return { ...block, scheme: { ...block.scheme, groundwork: g } };
}

/** The Evening's groundwork: each source's new count since last time, at the Creed's rate; and the Hero's Badges where a Scheme job ran. */
function groundSweep(block0: EvilModeBlock, data: EvilData): { block: EvilModeBlock; lines: string[] } {
  let block = block0;
  const lines: string[] = [];
  const f = familyOf(block, data);
  const credited = { ...block.scheme.credited };
  for (const src of f?.ground.sources ?? []) {
    const now = sourceCount(block, src.kind);
    if (now === null) continue;
    const was = credited[src.kind] ?? 0;
    if (now > was && src.pct > 0) {
      const before = block.scheme.groundwork;
      block = addGround(block, (now - was) * src.pct);
      if (block.scheme.groundwork > before) lines.push(W('groundTick', data, { n: block.scheme.groundwork - before, why: f!.ground.text }));
    }
    credited[src.kind] = Math.max(was, now);
  }
  for (const b of block.hero?.badges ?? []) {
    const k = `badge:${b.region}:${b.district}`;
    if (credited[k]) continue;
    credited[k] = 1;
    if (credited[`ran:${b.region}:${b.district}`]) {
      block = addGround(block, data.scheme.rules.heroBadge);
      lines.push(W('groundCut', data, { n: data.scheme.rules.heroBadge }));
    }
  }
  return { block: { ...block, scheme: { ...block.scheme, credited } }, lines };
}

// ---- The Evening and the Morning ----

/** The Evening: Scheme jobs whose last day it is are done and stamped; Digs send their notes; the Power Means comes with its fourth Gym; groundwork's counted. */
export function schemeEvening(block0: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  if (!schemeOn(data) || !block0.scheme || !block0.district) return block0;
  const key = `scheme-evening:${block0.district.region}:${block0.district.n}:${block0.here.day}`;
  if (block0.applied.includes(key)) return block0;
  let block = { ...block0, applied: [...block0.applied, key] };
  const lines: string[] = [];
  const day = block.here.day;
  const f = familyOf(block, data);
  for (const j of block.scheme.jobs.filter((x) => x.doneOn <= day)) {
    block = { ...block, scheme: { ...block.scheme, jobs: block.scheme.jobs.filter((x) => x !== j && !(x.part === j.part && x.way === j.way && x.since === j.since)) } };
    if (j.part === 'ledger') {
      const r = ledgerStepDone(block, j.way === 'clean', data);
      block = r.block;
      lines.push(...r.lines);
      continue;
    }
    const [k, wid] = j.way.split(':') as [WayKey, string];
    const way = wayOf(f, j.part, k);
    if (!way) continue;
    block = moveTeam(block, { heat: way.heat ?? 0, dread: way.dread ?? 0, regard: way.regard ?? 0 });
    const s = stamp(block, j.part, k !== 'dirty', k === 'second' ? 'second' : wid, j.squad[0] ?? null, j.cardId);
    block = s.block;
    if (s.line) lines.push(s.line);
  }
  // Power's Means: four Gyms dealt with; stamped clean only if all four were Bent, Replaced or Befriended.
  if (f?.parts.means.clean.how === 'gyms' && block.scheme.parts.means.state !== 'inHand') {
    const g = gymsDealt(block);
    const lost = block.scheme.parts.means.state === 'lost';
    if (g.any >= 4 + (lost ? 1 : 0)) {
      const first = g.ways.slice(0, 4);
      const clean = first.every((w) => w === 'bend' || w === 'replace' || w === 'befriend');
      const s = stamp(block, 'means', clean, lost ? 'second' : clean ? 'gymsClean' : 'gymsDirty', null, null);
      block = s.block;
      lines.push(s.line);
    }
  }
  const dg = digEvening(block, data);
  block = dg.block;
  lines.push(...dg.lines);
  const gs = groundSweep(block, data);
  block = gs.block;
  lines.push(...gs.lines);
  // Takes that can no longer be given back.
  const R = data.scheme.rules;
  block = { ...block, scheme: { ...block.scheme, takes: block.scheme.takes.filter((t) => t.back || day - t.day < R.giveBackDays) } };
  return lines.length ? { ...block, evening: [...block.evening, ...lines.filter(Boolean)] } : block;
}

/** The Morning: the Moment's day is set when its district begins; on its morning the team's ready (80%+) or the Moment passes. */
export function schemeMorning(block0: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  if (!schemeOn(data) || !block0.scheme || !block0.district || block0.district.end || block0.here.beat !== 'morning') return block0;
  let block = block0;
  const s = block.scheme;
  const m = momentWhere(data);
  const d = block.district!;
  if (s.moment.day === null && !s.moment.came && d.region === m.region && d.n === m.n) {
    block = { ...block, scheme: { ...s, moment: { ...s.moment, day: (d.from ?? 1) + data.scheme.rules.momentDay - 1 } } };
  }
  const mo = block.scheme.moment;
  if (mo.day !== null && !mo.came && block.here.day >= mo.day) {
    const key = `scheme-moment:${block.here.day}`;
    if (block.applied.includes(key)) return block;
    block = { ...block, applied: [...block.applied, key] };
    const f = familyOf(block, data);
    const way = mo.caused ? wayOf(f, 'moment', 'dirty') : wayOf(f, 'moment', 'clean');
    const withMoment = schemePct({ ...block.scheme, parts: { ...block.scheme.parts, moment: { ...block.scheme.parts.moment, state: 'inHand' } } }, data);
    const ready = withMoment >= data.scheme.rules.readyAt;
    if (ready) {
      const st = stamp(block, 'moment', !mo.caused, way?.id ?? 'wait', null, null);
      block = st.block;
    }
    const line = ready ? W('momentCame', data, { name: f?.name ?? block.neighbour?.scheme?.name ?? 'the Scheme' }) : W('notReady', data, { pct: schemePct(block.scheme, data) });
    block = { ...block, scheme: { ...block.scheme, moment: { ...block.scheme.moment, came: ready ? 'ready' : 'passed' } }, region: { ...block.region, notes: [...block.region.notes, line] } };
    block = appendLog(block, { kind: 'scheme', who: [], text: `Day ${block.here.day}. ${line}` });
  }
  return block;
}

/** A district's Reckoning lost (the Hero reached the base): groundwork −10. Parts are safe if somebody carried them out. */
export function reckoningLost(block: EvilModeBlock, data: EvilData = EVIL_DATA): { block: EvilModeBlock; line: string } {
  const k = `scheme-reckoning:${block.here.region}`;
  if (!schemeOn(data) || block.applied.includes(k)) return { block, line: '' };
  const b = addGround({ ...block, applied: [...block.applied, k] }, data.scheme.rules.reckoningLost);
  return { block: b, line: W('reckoningCut', data, { n: data.scheme.rules.reckoningLost }) };
}

// ---- A fallen neighbour's Scheme (Part 15a section 7): taken up, stamped four times not clean. The team's own is set aside. ----

export function inheritProblem(block: EvilModeBlock, data: EvilData = EVIL_DATA): string | null {
  if (!schemeOn(data)) return 'The Scheme is switched off.';
  if (block.scheme.inherited) return 'It is already the team\'s.';
  if (!block.neighbour?.scheme) return 'No fallen team has left a Scheme.';
  return null;
}
export function takeUpScheme(block: EvilModeBlock, data: EvilData = EVIL_DATA): Out {
  const p = inheritProblem(block, data);
  if (p) return bad(block, p);
  const fallen = block.neighbour!.scheme!;
  const s = block.scheme;
  const dirty = (): SchemePart => ({ state: 'inHand', clean: false, day: block.here.day, way: 'inherited', by: null, cardId: null, lostTimes: 0 });
  const next: SchemeState = { ...s, family: fallen.from, inherited: true, aside: { family: s.family, parts: s.parts, groundwork: s.groundwork }, parts: { means: dirty(), place: dirty(), key: dirty(), moment: dirty() }, groundwork: 0 };
  const line = W('inheritDone', data, { name: fallen.name });
  return { block: appendLog({ ...block, scheme: next }, { kind: 'scheme', who: [], text: `Day ${block.here.day}. ${line}` }), problem: null, lines: [line] };
}

// ---- Belonging's count (Part 22 section 6.2): every one's a name that can be opened ----

export interface HomeName { who: string; why: string; n: number }
export function homeCount(block: EvilModeBlock, data: EvilData = EVIL_DATA): { n: number; names: HomeName[] } {
  const Wt = data.scheme.rules.homeWeights;
  const names: HomeName[] = [];
  for (const h of block.district?.holdings ?? []) {
    if (h.kind !== 'local' || h.mood !== 'warm') continue;
    const l = localOf(h, data);
    if (l) names.push({ who: l.who.replace(/,.*$/, ''), why: `Warm, and their street (${Wt.warm})`, n: Wt.warm });
  }
  for (const c of block.crew.filter((x) => x.where === 'left' && x.left?.kindly)) names.push({ who: c.name, why: `left with a handshake, and their family (${Wt.handshake})`, n: Wt.handshake });
  for (const v of block.economy.running.filter((x) => x.kind === 'work' && x.done)) names.push({ who: v.cardId, why: `a Work done: the people it was done for (${Wt.work})`, n: Wt.work });
  if (block.scheme.bought) names.push({ who: 'A list, bought', why: 'a thousand names; none of them come', n: data.scheme.rules.homeNeed });
  return { n: names.reduce((t, x) => t + x.n, 0), names };
}

// ---- Wonder's eye (Part 22 section 5.1): from Region 2 the Legend has seen the team ----

const EYES = ['open', 'narrowed', 'shut'] as const;
export function moveEye(block: EvilModeBlock, by: 1 | -1, data: EvilData = EVIL_DATA): { block: EvilModeBlock; line: string } {
  if (block.scheme.family !== 'wonder' || block.here.region < data.scheme.rules.noticeFrom) return { block, line: '' };
  const at = EYES.indexOf(block.scheme.eye);
  const to = EYES[Math.max(0, Math.min(2, at + by))]!;
  if (to === block.scheme.eye) return { block, line: '' };
  const word = W(to === 'open' ? 'eyeOpen' : to === 'narrowed' ? 'eyeNarrowed' : 'eyeShut', data);
  return { block: { ...block, scheme: { ...block.scheme, eye: to } }, line: W('eyeMoved', data, { word }) };
}

// ---- Kanto's own scheme: the Ledger (Part 26a section 2.4) ----

export function ledgerProblem(block: EvilModeBlock, key: 'clean' | 'dirty', data: EvilData = EVIL_DATA): string | null {
  const L = data.scheme.ledger;
  if (!schemeOn(data)) return 'The Scheme is switched off.';
  const s = block.scheme;
  if (!block.district || block.district.end) return 'Not in a district.';
  if (block.district.region !== L.region) return 'Not in this region.';
  if (s.ledger.step >= 4) return 'The books are done with.';
  if (block.district.n < L.from) return `On the Board from District ${L.from}.`;
  if (s.jobs.some((j) => j.part === 'ledger')) return 'A step is already being worked on.';
  if (s.heist && s.heist.part === 'ledger' && (s.heist.stage === 'plan' || s.heist.stage === 'rooms')) return 'The heist is planned.';
  const step = L.steps[s.ledger.step]!;
  const w = step[key];
  const n = w.needs ?? {};
  if (n.line && !lineAtLeast(block, n.line)) return `Not at the team's Line (${block.team.line}).`;
  if (n.sitDown && !(block.neighbour?.sitDowns.length ?? 0)) return 'Needs a Sit-Down with Giovanni first.';
  if (n.truce && (!block.neighbour || STANCES.indexOf(block.neighbour.stance) < STANCES.indexOf('truce'))) return 'Needs Truce or better with Giovanni.';
  if ((w.cost ?? 0) > block.team.funds) return `Needs ${money(w.cost ?? 0)}.`;
  if (w.heist) return heistOfferProblem(block, w.heist, data, true);
  if (block.here.beat !== 'dispatch') return 'At Dispatch.';
  if (!freeCrew(block).length) return 'Nobody is free today.';
  return null;
}

export function ledgerStep(block0: EvilModeBlock, key: 'clean' | 'dirty', data: EvilData = EVIL_DATA): Out {
  const p = ledgerProblem(block0, key, data);
  if (p) return bad(block0, p);
  const L = data.scheme.ledger;
  const step = L.steps[block0.scheme.ledger.step]!;
  const w = step[key];
  const crew = freeCrew(block0).slice(0, 2);
  const fields: string[] = [
    `KANTO'S OWN · ${L.name.toUpperCase()} · ${step.n}. ${step.name.toUpperCase()} · ${w.name.toUpperCase()}`, w.text, 'Giovanni, and whoever is in his books.',
    step.n === 4 ? (key === 'clean' ? 'Forty-three debts, forgiven in the team\'s name.' : `${money(w.funds ?? 0)}, collected.`) : `Step ${step.n} of 4.${step.n === 3 ? ` For the Grand Scheme: ${Object.entries(L.supplies).map(([c, pt]) => `${c}'s ${pt}`).join('; ')}.` : ''}`,
    [w.cost ? `Funds ↓ ${money(w.cost)}.` : '', w.heat ? `Heat ${signed(w.heat)}.` : '', w.dread ? `Dread ${signed(w.dread)}.` : '', w.regard ? `Regard ${signed(w.regard)}.` : '', w.war ? 'Stance: War.' : ''].filter(Boolean).join(' ') || 'Nothing moves.',
    w.heist ? 'By the plan, and the rooms.' : 'Certain.', crew.map((c) => c.name).join(', ') || '—', "Nobody's line is crossed by it.", 'It holds.', 'If they ever see the page, they underline the column headed "Stock".', 'Nothing.',
    `${step.name}: ${w.name}.`, `${step[key === 'clean' ? 'dirty' : 'clean'].name}. ${step[key === 'clean' ? 'dirty' : 'clean'].text}`,
  ];
  let { block, id } = fileCard(block0, `ledger:${step.n}:${key}`, key === 'clean', fields.map((text, i) => ({ label: data.ledger.fields[i]!, text, unknown: false })), crew.map((c) => c.id));
  if (w.heist) return planHeist(block, w.heist, 'ledger', key, id, data);
  block = moveTeam(block, { funds: -(w.cost ?? 0) });
  const days = w.days ?? 1;
  if (days > 1) return { block: { ...block, scheme: { ...block.scheme, jobs: [...block.scheme.jobs, { part: 'ledger', way: key, since: block.here.day, doneOn: block.here.day + days - 1, squad: crew.map((c) => c.id), cardId: id }] } }, problem: null, lines: [`${w.name}: ${days} days.`] };
  const r = ledgerStepDone(block, key === 'clean', data);
  return { block: r.block, problem: null, lines: r.lines };
}

/** A step of the Ledger done. The third (the books in hand) supplies a Grand Scheme part for Profit, Spite and Cause. */
function ledgerStepDone(block0: EvilModeBlock, clean: boolean, data: EvilData): { block: EvilModeBlock; lines: string[] } {
  const L = data.scheme.ledger;
  const s = block0.scheme;
  const step = L.steps[s.ledger.step]!;
  const w = step[clean ? 'clean' : 'dirty'];
  let block: EvilModeBlock = { ...block0, scheme: { ...s, ledger: { ...s.ledger, step: s.ledger.step + 1, clean: [...s.ledger.clean, clean], forgave: step.n === 4 ? clean : s.ledger.forgave } } };
  block = moveTeam(block, { heat: w.heat ?? 0, dread: w.dread ?? 0, regard: w.regard ?? 0, funds: w.funds ?? 0 });
  const lines = [`${step.name}: ${w.name}. ${w.text}`];
  if (w.war && block.neighbour && !block.neighbour.fallen) block = { ...block, neighbour: { ...block.neighbour, stance: 'war' } };
  if (step.n === 4 && clean && block.district) {
    block = { ...block, district: { ...block.district, holdings: block.district.holdings.map((h) => (h.kind === 'local' && h.mood && h.mood !== 'shut' ? { ...h, mood: 'warm' as const } : h)) } };
  }
  if (step.n === 3) {
    const part = L.supplies[block.scheme.family];
    const f = familyOf(block, data);
    if (part && f?.parts[part].ledger && block.scheme.parts[part].state !== 'inHand') {
      const st = stamp(block, part, clean, 'ledger', null, null);
      block = st.block;
      lines.push(`${L.name}: ${st.line}`);
    }
    if (block.scheme.family === 'spite') block = addGround(block, (f?.ground.sources.find((x) => x.kind === 'truth')?.pct ?? 0));
  }
  return { block, lines };
}

// ---- Heists (Part 12 section 3) ----

export const heistDef = (id: string, data: EvilData = EVIL_DATA): HeistDef | undefined => data.scheme.heists.list.find((h) => h.id === id);
const dkey = (block: EvilModeBlock): string => `${block.district?.region ?? 0}:${block.district?.n ?? 0}`;

/** Why this heist can't be planned here and now (or null). */
export function heistOfferProblem(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA, forPart = false): string | null {
  const h = heistDef(id, data);
  if (!h) return 'No such heist.';
  if (!block.district || block.district.end) return 'Not in a district.';
  if (!lineAtLeast(block, 'grey')) return 'A heist is Grey or darker.';
  // A heist for a Scheme part goes where the part is; one for its take only where its target is.
  if (!forPart && h.where.length && !h.where.includes(block.district.n)) return `${h.name}: not in this district.`;
  if (h.creeds && !h.creeds.includes(block.team.creed)) return `${h.name}: not for this Creed.`;
  if (h.neighbour && (!block.neighbour || block.neighbour.fallen)) return 'There is no neighbour with money to take.';
  if (block.scheme.heists.includes(dkey(block))) return 'One heist a district. The district hasn\'t got two things worth it.';
  if (block.scheme.heist && (block.scheme.heist.stage === 'plan' || block.scheme.heist.stage === 'rooms')) return 'A heist is already planned.';
  return null;
}

/** The heists on offer in this district, for the Scheme page (any Creed may run one for its take). */
export const heistsHere = (block: EvilModeBlock, data: EvilData = EVIL_DATA): HeistDef[] => data.scheme.heists.list.filter((h) => !heistOfferProblem(block, h.id, data) || block.scheme.heist?.id === h.id);

const sroll = (block: EvilModeBlock, max: number): { n: number; block: EvilModeBlock } => {
  const k = block.draws['evil-scheme'] ?? 0;
  const n = new Rng(hashSeed(`${block.district?.seed ?? 'x'}::evil-scheme::${k}`)).int(1, max);
  return { n, block: { ...block, draws: { ...block.draws, 'evil-scheme': k + 1 } } };
};

/** A heist planned: three slots (a way in, a way through, a way out), a watcher, an inside word. Played at the In person beat. */
export function planHeist(block: EvilModeBlock, id: string, part: PartId | 'ledger' | null, way: string | null, cardId: string | null, data: EvilData = EVIL_DATA): Out {
  const p = heistOfferProblem(block, id, data, part !== null);
  if (p) return bad(block, p);
  const h = heistDef(id, data)!;
  let b = block;
  let cid = cardId;
  if (!cid) {
    const { squad, wont } = schemeSquad(block, h.tags, ['hands', 'wheels'], 4, data);
    const fields = [
      `A HEIST · ${h.name.toUpperCase()}`, h.takes, h.from, h.gives ? `${money(h.gives)}. Once. A lump.` : h.heatDown ? `Heat −${h.heatDown}. The detective's list is emptied.` : `Groundwork +${h.ground ?? 0}%.`,
      `Heat +${h.heat}. It's the day's loudest thing.${h.regard ? ` Regard ${signed(h.regard)}.` : ''} Danger pay ${money(data.scheme.rules.crewPay)} each.`,
      'By the plan, and the rooms: the Boss, in person.', squad.map((c) => c.name).join(', ') || '—',
      wont.length ? wont.map((c) => c.name).join(', ') : "Nobody's line is crossed by it.", 'Once a district.', 'Reads the paper next morning.', 'The rooms, until somebody scouts them.',
      `Robbed ${h.from.toLowerCase()}.`, h.other,
    ];
    const r = fileCard(block, `heist:${id}`, false, fields.map((text, i) => ({ label: data.ledger.fields[i]!, text, unknown: i === 10 })), squad.map((c) => c.id));
    b = r.block;
    cid = r.id;
  }
  const crew = schemeSquad(b, h.tags, ['hands', 'wheels'], 4, data).squad.map((c) => c.id);
  const heist: HeistState = { id, part, way, day: b.here.day, region: b.district!.region, district: b.district!.n, plan: { in: null, out: null, watcher: null, inside: false }, crew, stage: 'plan', rooms: [], at: 0, noise: 0, quiet: 0, warned: false, took: 0, failedAt: null, lines: [], cardId: cid };
  return { block: { ...b, scheme: { ...b.scheme, heist, credited: ranHere(b) } }, problem: null, lines: [`${h.name}: planned. Fill the slots, then go in person.`] };
}

export type PlanSlot = 'in' | 'out' | 'watcher' | 'inside';
/** The ways a slot can be filled (null leaves it empty), and why one can't. */
export function planOptions(block: EvilModeBlock, slot: PlanSlot, data: EvilData = EVIL_DATA): { id: string | null; name: string; why: string | null }[] {
  const P = data.scheme.heists.plan;
  const crew = (block.scheme.heist?.crew ?? []).map((id) => block.crew.find((c) => c.id === id)).filter((c): c is Crew => !!c);
  const has = (t?: string) => !t || crew.some((c) => c.talent === t);
  const empty = { id: null, name: 'Empty', why: null };
  if (slot === 'in' || slot === 'out') {
    return [empty, ...P[slot].map((w) => ({ id: w.id, name: `${w.name}${w.cost ? ` (${money(w.cost)})` : ''}`, why: !has(w.talent) ? `Needs a ${w.talent} on the crew.` : (w.cost ?? 0) > block.team.funds ? 'Not enough Funds.' : w.safehouse && !(block.district?.holdings ?? []).some((h) => h.kind === 'safehouse' && h.owner === 'team') ? 'Needs a safehouse the team holds.' : null }))];
  }
  if (slot === 'watcher') {
    const eyes = freeCrew(block).filter((c) => c.talent === 'eyes' && !crew.includes(c));
    return [empty, ...eyes.map((c) => ({ id: c.id, name: `${c.name}, outside`, why: null }))];
  }
  return [{ id: null, name: 'No inside word', why: null }, { id: 'yes', name: `An inside word: the rooms, in order (${money(data.scheme.rules.insideCost)})`, why: block.team.funds < data.scheme.rules.insideCost ? 'Not enough Funds.' : !crew.some((c) => c.talent === 'eyes') && !inRoster(block).some((c) => c.talent === 'eyes') ? 'Needs an Eyes on the Roster.' : null }];
}

export function setPlan(block: EvilModeBlock, slot: PlanSlot, value: string | null, data: EvilData = EVIL_DATA): Out {
  const hs = block.scheme.heist;
  if (!hs || hs.stage !== 'plan') return bad(block, 'No heist is being planned.');
  const opt = planOptions(block, slot, data).find((o) => o.id === value);
  if (!opt) return bad(block, 'That way is not on the plan.');
  if (opt.why) return bad(block, opt.why);
  const plan = { ...hs.plan, ...(slot === 'inside' ? { inside: value === 'yes' } : { [slot]: value }) };
  return { block: { ...block, scheme: { ...block.scheme, heist: { ...hs, plan } } }, problem: null, lines: [] };
}

/** Called off before it's played: nothing's taken, nothing moves, the district's heist isn't spent. */
export function callOffHeist(block: EvilModeBlock): Out {
  const hs = block.scheme.heist;
  if (!hs || hs.stage !== 'plan') return bad(block, 'No heist is being planned.');
  return { block: { ...block, scheme: { ...block.scheme, heist: null } }, problem: null, lines: ['Called off. Nobody says anything.'] };
}

const planWay = (slot: 'in' | 'out', id: string | null, data: EvilData) => (id ? data.scheme.heists.plan[slot].find((w) => w.id === id) : undefined);

/** Going in, at the In person beat: the way in's rolled (or certain), the rooms are drawn from the seed, and the night begins. */
export function goHeist(block0: EvilModeBlock, data: EvilData = EVIL_DATA): Out {
  const hs = block0.scheme.heist;
  if (!hs || hs.stage !== 'plan') return bad(block0, 'No heist is planned.');
  if (block0.here.beat !== 'inPerson') return bad(block0, 'A heist is played at the In person beat.');
  if (block0.inPerson?.day === block0.here.day) return bad(block0, 'The Boss has already been out today.');
  if (block0.district?.region !== hs.region || block0.district?.n !== hs.district) return bad(block0, 'That heist was for another district.');
  const H = data.scheme.heists;
  let block: EvilModeBlock = { ...block0, inPerson: { day: block0.here.day, holdingId: block0.district!.holdings.find((h) => h.kind === 'town')!.id } };
  const wayIn = planWay('in', hs.plan.in, data);
  const lines: string[] = [];
  if (wayIn?.cost) block = moveTeam(block, { funds: -wayIn.cost });
  if (wayIn?.bribe) block = appendLog(block, { kind: 'scheme', who: [], text: `Day ${block.here.day}. Paid a guard ${money(wayIn.cost ?? 0)} to look the other way.` });
  if (hs.plan.inside) block = moveTeam(block, { funds: -data.scheme.rules.insideCost });
  const odds = wayIn?.odds ?? H.plan.out.find((w) => w.id === 'foot')!.odds;
  const r = sroll(block, 100);
  block = r.block;
  // The rooms: four to six, from the room list, drawn by the seed; the other crew only where there's a neighbour standing.
  const pool = H.rooms.map((x) => x.id).filter((id) => id !== 'crew' || (block.neighbour && !block.neighbour.fallen));
  const nr = sroll(block, 3);
  block = nr.block;
  const rooms: HeistState['rooms'] = [];
  for (let i = 0; i < 3 + nr.n; i++) {
    const x = sroll(block, pool.length);
    block = x.block;
    rooms.push(pool[x.n - 1]!);
  }
  const q = sroll(block, 3);
  block = q.block;
  let heist: HeistState = { ...hs, stage: 'rooms', rooms, at: 0, noise: 0, quiet: q.n - 1, lines: [] };
  if (r.n > odds) {
    lines.push(wayIn ? `${wayIn.name}: it didn't work.` : H.plan.empty.in, 'Nothing\'s taken.');
    return finishHeist({ ...block, scheme: { ...block.scheme, heist } }, 'in', data, lines);
  }
  lines.push(wayIn ? `In: ${wayIn.name}.` : H.plan.empty.in);
  if (hs.plan.inside) lines.push(`The rooms, in order: ${rooms.map((id) => H.rooms.find((x) => x.id === id)!.name.replace(/^The /, '')).join(', ')}.`);
  heist = { ...heist, lines };
  return { block: { ...block, scheme: { ...block.scheme, heist } }, problem: null, lines };
}

export type RoomChoice = 'fight' | 'wait' | 'talk' | 'leave' | 'heart' | 'hands' | 'long' | 'deal' | 'take' | `tile${0 | 1 | 2}`;

/** The choices in the room the Boss is standing in (the thing's room when the obstacles are passed). */
export function roomChoices(block: EvilModeBlock, data: EvilData = EVIL_DATA): { id: RoomChoice; label: string; why: string | null }[] {
  const hs = block.scheme.heist;
  if (!hs || hs.stage !== 'rooms') return [];
  const crew = hs.crew.map((id) => block.crew.find((c) => c.id === id)).filter((c): c is Crew => !!c);
  const has = (t: string) => crew.some((c) => c.talent === t);
  const room = hs.rooms[hs.at];
  if (!room) return [{ id: 'take', label: 'Take it, and go', why: null }];
  switch (room) {
    case 'guard': return [{ id: 'fight', label: hs.plan.in === 'guard' ? 'He\'s the bought one: he nods' : 'Battle him, quietly (win in three turns)', why: null }, { id: 'wait', label: 'Wait: he walks a circuit', why: null }];
    case 'dog': return [{ id: 'fight', label: 'Battle it, quietly', why: null }, { id: 'heart', label: '"Hello, you. Who\'s a good boy."', why: has('heart') ? null : 'Needs a Heart on the crew.' }, { id: 'wait', label: 'Wait for it to settle', why: null }];
    case 'lock': return [{ id: 'hands', label: 'Hands on the lock', why: has('hands') ? null : 'Needs a Hands on the crew.' }, { id: 'long', label: 'The long way round: another room', why: null }];
    case 'floor': return [0, 1, 2].map((i) => ({ id: `tile${i}` as RoomChoice, label: `${['Boards', 'Tiles', 'Under the beam'][i]}${hs.plan.inside && i === hs.quiet ? ' (the scout says this one)' : ''}`, why: null }));
    case 'clerk': return [{ id: 'wait', label: 'Wait: a turn of the clock', why: null }, { id: 'talk', label: 'Talk (one exchange)', why: null }, { id: 'leave', label: 'Leave', why: null }];
    case 'crew': return [{ id: 'fight', label: 'Battle them (loud)', why: null }, { id: 'deal', label: 'A deal, on the spot: half each', why: null }];
  }
}

/** One choice in the current room. A battle hands the beat to a fight (kind 'heist'); its result comes back to `heistBattle`. */
export function heistRoom(block0: EvilModeBlock, choice: RoomChoice, data: EvilData = EVIL_DATA): Out {
  const hs = block0.scheme.heist;
  if (!hs || hs.stage !== 'rooms') return bad(block0, 'No heist is going on.');
  const opt = roomChoices(block0, data).find((c) => c.id === choice);
  if (!opt) return bad(block0, 'That isn\'t a choice here.');
  if (opt.why) return bad(block0, opt.why);
  const H = data.scheme.heists;
  const room = hs.rooms[hs.at];
  let block = block0;
  let heist = { ...hs };
  const lines: string[] = [];
  if (!room) return wayOut(block, data);
  const pass = (line: string) => { heist = { ...heist, at: heist.at + 1 }; lines.push(line); };
  const noise = (n: number, line: string) => { heist = { ...heist, noise: heist.noise + n, at: heist.at + 1 }; lines.push(`${line} Noise ${heist.noise} of ${H.noise}.`); };
  if ((room === 'guard' || room === 'dog' || room === 'crew') && choice === 'fight' && !(room === 'guard' && hs.plan.in === 'guard')) {
    const town = block.district!.holdings.find((h) => h.kind === 'town')!;
    return { block: { ...block, scheme: { ...block.scheme, heist }, fight: { kind: 'heist', holdingId: town.id, begun: false } }, problem: null, lines: [`${H.rooms.find((x) => x.id === room)!.name}: a battle.`] };
  }
  if (room === 'guard' && choice === 'fight') pass('He nods. The bought one.');
  else if (choice === 'wait') {
    const r = sroll(block, 100);
    block = r.block;
    if (room === 'clerk' || r.n <= data.scheme.rules.waitOdds) pass(room === 'clerk' ? 'A turn of the clock. They go back to their desk.' : 'He walks his circuit. Through.');
    else noise(1, 'Not long enough.');
  } else if (choice === 'heart') pass('It goes back to sleep.');
  else if (choice === 'hands') pass('Open.');
  else if (choice === 'long') { heist = { ...heist, rooms: [...heist.rooms.slice(0, heist.at + 1), 'floor', ...heist.rooms.slice(heist.at + 1)], at: heist.at + 1 }; lines.push('The long way round.'); }
  else if (choice.startsWith('tile')) {
    if (Number(choice.slice(4)) === heist.quiet) pass('Quiet.');
    else noise(1, 'It creaks.');
  } else if (choice === 'talk') {
    const voice = hs.crew.some((id) => block.crew.find((c) => c.id === id)?.talent === 'voice');
    const r = sroll(block, 2);
    block = r.block;
    if (voice || r.n === 1) pass('"Working late too?" They nod. Through.');
    else noise(1, 'They\'re not sure. They pick up the phone, then put it down.');
  } else if (choice === 'leave') {
    lines.push('The Boss leaves. Nothing\'s taken; nobody\'s touched.');
    return finishHeist({ ...block, scheme: { ...block.scheme, heist } }, 'early', data, lines, 0);
  } else if (choice === 'deal') { heist = { ...heist, at: heist.at + 1, warned: heist.warned }; lines.push('Half each. They go.'); heist = { ...heist, took: -1 }; }
  return afterRoom(block, heist, lines, data);
}

function afterRoom(block: EvilModeBlock, heist: HeistState, lines: string[], data: EvilData): Out {
  const H = data.scheme.heists;
  if (heist.noise >= H.noise) {
    lines.push('A light. A whistle.');
    return finishHeist({ ...block, scheme: { ...block.scheme, heist } }, heist.at >= heist.rooms.length ? 'thing' : 'early', data, lines);
  }
  if (heist.plan.watcher && !heist.warned && heist.rooms.length - heist.at === 2) {
    const w = block.crew.find((c) => c.id === heist.plan.watcher);
    lines.push(`${w?.name ?? 'The watcher'}: "Somebody's coming. You've two minutes."`);
    heist = { ...heist, warned: true };
  }
  if (heist.at >= heist.rooms.length) lines.push(fill(H.thing.text, { beside: heistDef(heist.id, data)!.beside }));
  return { block: { ...block, scheme: { ...block.scheme, heist } }, problem: null, lines };
}

/** A room's battle ended: won inside the turns, through quietly; won slowly, noise +1; the other crew, noise +2 whatever; lost, it's failed. */
export function heistBattle(block0: EvilModeBlock, won: boolean, turns: number, data: EvilData = EVIL_DATA): Out {
  const hs = block0.scheme.heist;
  const block = { ...block0, fight: null };
  if (!hs || hs.stage !== 'rooms') return { block, problem: null, lines: [] };
  const H = data.scheme.heists;
  const room = hs.rooms[hs.at];
  if (!won) return finishHeist({ ...block, scheme: { ...block.scheme, heist: { ...hs, noise: H.noise } } }, 'early', data, ['Lost. The party\'s healed; a light, a whistle.']);
  const add = room === 'crew' ? 2 : turns > H.guardTurns ? 1 : 0;
  const heist = { ...hs, at: hs.at + 1, noise: hs.noise + add };
  return afterRoom(block, heist, [add ? `Won, but loud. Noise ${heist.noise} of ${H.noise}.` : 'Won, quietly.'], data);
}

function wayOut(block0: EvilModeBlock, data: EvilData): Out {
  const hs = block0.scheme.heist!;
  const H = data.scheme.heists;
  const out = planWay('out', hs.plan.out, data);
  const front = planWay('in', hs.plan.in, data);
  const odds = Math.max(0, (out?.odds ?? H.plan.out.find((w) => w.id === 'foot')!.odds) + (front?.outBy ?? 0));
  const r = sroll(block0, 100);
  let block = r.block;
  const lines = [out ? `Out: ${out.name}.` : H.plan.empty.out];
  if (r.n <= odds) return finishHeist(block, null, data, lines);
  // Failed at the way out: the take's kept (the Boss gets out); a crew member's caught at one in two.
  const c = sroll(block, 2);
  block = c.block;
  const who = hs.plan.watcher ?? hs.crew[hs.crew.length - 1];
  if (c.n === 1 && who) {
    const p = block.crew.find((x) => x.id === who);
    if (p) {
      block = { ...block, crew: block.crew.map((x) => (x.id === who ? { ...x, where: 'left' as const, left: { day: block.here.day, how: 'arrested' as const } } : x)) };
      lines.push(`${p.name} was caught. They're in the cells.`);
    }
  } else lines.push('Everyone got out. Just.');
  return finishHeist(block, 'out', data, lines);
}

/** The heist's end: the take, the Heat, the part stamped not clean, the paper, the crew's pay. */
function finishHeist(block0: EvilModeBlock, failedAt: HeistState['failedAt'], data: EvilData, lines: string[], heatOverride?: number): Out {
  const hs = block0.scheme.heist!;
  const h = heistDef(hs.id, data)!;
  const H = data.scheme.heists;
  const got = failedAt === null || failedAt === 'out';
  const half = failedAt === 'thing';
  const dealt = hs.took === -1;
  const take = got ? (dealt ? Math.floor(h.gives / 2) : h.gives) : half ? Math.floor(h.gives / 2) : 0;
  const heat = heatOverride ?? (failedAt === 'in' ? H.fail.in : failedAt === 'early' ? H.fail.early : h.heat + (planWay('in', hs.plan.in, data)?.heat ?? 0));
  let block: EvilModeBlock = moveTeam(block0, { funds: take - data.scheme.rules.crewPay * hs.crew.length, heat: h.heatDown && got ? -h.heatDown : heat, regard: got ? h.regard ?? 0 : 0 });
  const all = [...lines];
  if (take) all.push(`Taken: ${money(take)}.`);
  if (got && h.headline) all.push(`The paper: "${h.headline}"`);
  if (got || half) block = { ...block, scheme: { ...block.scheme, heists: [...block.scheme.heists, `${hs.region}:${hs.district}`], takes: take ? [...block.scheme.takes, { id: `T${block.scheme.takes.length + 1}`, day: block.here.day, amount: take, back: false }] : block.scheme.takes } };
  else block = { ...block, scheme: { ...block.scheme, heists: [...block.scheme.heists, `${hs.region}:${hs.district}`] } };
  if (got) {
    if (h.ground) block = addGround(block, h.ground);
    if (h.notices) { const e = moveEye(block, 1, data); block = e.block; if (e.line) all.push(e.line); }
    if (h.war && block.neighbour && !block.neighbour.fallen) block = { ...block, neighbour: { ...block.neighbour, stance: 'war' } };
    if (failedAt === null) block = { ...block, crew: block.crew.map((c) => (hs.crew.includes(c.id) && c.where === 'in' ? moveLoyalty(c, 1, data) : c)) };
    if (hs.part === 'ledger') {
      const r = ledgerStepDone(block, false, data);
      block = r.block;
      all.push(...r.lines);
    } else if (hs.part) {
      const f = familyOf(block, data);
      const [k, wid] = (hs.way ?? 'dirty:take').split(':') as [WayKey, string];
      const way = wayOf(f, hs.part, k);
      block = moveTeam(block, { dread: way?.dread ?? 0 });
      const st = stamp(block, hs.part, false, wid ?? 'heist', hs.crew[0] ?? null, hs.cardId);
      block = st.block;
      if (st.line) all.push(st.line);
    }
  }
  block = { ...block, scheme: { ...block.scheme, heist: { ...block.scheme.heist!, stage: got || half ? 'done' : 'failed', failedAt, took: take, lines: all } } };
  block = appendLog(block, { kind: 'scheme', who: hs.crew, text: `Day ${block.here.day}. ${got ? `Robbed ${h.from.toLowerCase()}: ${h.name}.` : `Tried ${h.name}, and it failed.`}`, ...(take ? { taken: 1 } : {}) });
  return { block, problem: null, lines: all };
}

/** A heist's take given back, whole, by a Night action, within three days: Heat −2. The paper prints that too. */
export function giveBack(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA): Out {
  const t = block.scheme.takes.find((x) => x.id === id);
  if (!t || t.back) return bad(block, 'Nothing to give back.');
  if (block.here.beat !== 'night') return bad(block, 'Given back at Night.');
  if (block.here.day - t.day >= data.scheme.rules.giveBackDays) return bad(block, 'Too late to give it back.');
  if (block.team.funds < t.amount) return bad(block, `Needs ${money(t.amount)} to give it back.`);
  const b = moveTeam({ ...block, scheme: { ...block.scheme, takes: block.scheme.takes.map((x) => (x.id === id ? { ...x, back: true } : x)) } }, { funds: -t.amount, heat: -2 });
  const line = `Given back, whole: ${money(t.amount)}. The paper prints that too.`;
  return { block: appendLog(b, { kind: 'scheme', who: [], text: `Day ${block.here.day}. ${line}`, given: 1 }), problem: null, lines: [line] };
}

// ---- Digs (Part 13 section 3) ----

export const digDef = (id: string, data: EvilData = EVIL_DATA): DigDef | undefined => data.scheme.digs.list.find((d) => d.id === id);
/** A holding's dig tags: by its place's name, or 'town' for the Town ("under the Town"). */
export function digTags(h: Holding, data: EvilData = EVIL_DATA): string[] {
  if (h.kind === 'town') return ['town'];
  const name = h.ref.toLowerCase();
  return [...new Set(data.scheme.digs.tags.filter((t) => name.includes(t.match.toLowerCase())).map((t) => t.tag))];
}
/** Held holdings here a Dig could be run on (not one already dug). */
export function digSites(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA): Holding[] {
  const d = digDef(id, data);
  if (!d || !block.district) return [];
  return block.district.holdings.filter((h) => h.owner === 'team' && digTags(h, data).some((t) => d.on.includes(t)) && !block.scheme.digs.some((g) => g.holdingId === h.id));
}
export function digProblem(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA): string | null {
  const d = digDef(id, data);
  if (!schemeOn(data)) return 'The Scheme is switched off.';
  if (!d) return 'No such Dig.';
  if (!block.district || block.district.end) return 'Not in a district.';
  if (d.creeds && !d.creeds.includes(block.team.creed)) return `${d.name}: not for this Creed.`;
  if (block.here.beat !== 'dispatch') return 'At Dispatch.';
  if (!digSites(block, id, data).length) return 'No held holding here for it.';
  if (!schemeSquad(block, d.tags, ['eyes', 'hands'], 2, data).squad.length) return 'Nobody is free today.';
  return null;
}
/** Digs that could run here (for the Scheme page), with or without a part. */
export const digsHere = (block: EvilModeBlock, data: EvilData = EVIL_DATA): DigDef[] => data.scheme.digs.list.filter((d) => (!d.creeds || d.creeds.includes(block.team.creed)) && digSites(block, d.id, data).length > 0);

export function startDig(block0: EvilModeBlock, id: string, part: PartId | null, holdingId: string | undefined, cardId: string | null, data: EvilData = EVIL_DATA): Out {
  const p = digProblem(block0, id, data);
  if (p) return bad(block0, p);
  const d = digDef(id, data)!;
  const sites = digSites(block0, id, data);
  const h = holdingId ? sites.find((x) => x.id === holdingId) : sites[0];
  if (!h) return bad(block0, 'Not a holding that can be dug for it.');
  const { squad } = schemeSquad(block0, d.tags, ['eyes', 'hands'], 2, data);
  let block = block0;
  let cid = cardId;
  if (!cid) {
    const fields = [`A DIG · ${d.name.toUpperCase()} · ${holdingName(h, data).toUpperCase()}`, `${data.scheme.digs.days} days, a squad on it throughout.`, 'What\'s under the district.', [d.ground ? `Groundwork +${d.ground}%${block.team.creed === 'wonder' ? ' (doubled: Wonder)' : ''}.` : '', d.funds ? `${money(d.funds)}.` : '', d.part ? `${partName(d.part)}.` : ''].filter(Boolean).join(' ') || 'Whatever\'s found.',
      'Quiet: unless what\'s found isn\'t.', 'Certain. What else is found is found.', squad.map((c) => c.name).join(', '), "Nobody's line is crossed by it.", 'Every Dig ends with a choice: keep it open, or put it back.', 'Feels the ground shift.', 'What\'s down there.', `Dug ${holdingName(h, data)}.`, 'Leave it. Or dig, and put it back after: Regard +1.'];
    const r = fileCard(block, `dig:${id}`, true, fields.map((text, i) => ({ label: data.ledger.fields[i]!, text, unknown: i === 10 })), squad.map((c) => c.id));
    block = r.block;
    cid = r.id;
  }
  const lines: string[] = [];
  if (d.confirm) lines.push('The Legend. Asleep. You were sure.');
  const dig: DigState = { id, holdingId: h.id, region: block.district!.region, district: block.district!.n, runner: squad[0]?.id ?? null, squad: squad.map((c) => c.id), since: block.here.day, doneOn: block.here.day + data.scheme.digs.days - 1, notes: [], ended: 'running', part, cardId: cid! };
  if (d.confirm) { const e = moveEye(block, 1, data); block = e.block; if (e.line) lines.push(e.line); }
  return { block: { ...block, scheme: { ...block.scheme, digs: [...block.scheme.digs, dig], credited: ranHere(block) } }, problem: null, lines: [`${d.name}: begun at ${holdingName(h, data)}. ${data.scheme.digs.days} days.`, ...lines] };
}

/** Each Evening a Dig runs, its runner sends a note (shorter each day); on the last, what's found, and the choice. */
function digEvening(block0: EvilModeBlock, data: EvilData): { block: EvilModeBlock; lines: string[] } {
  let block = block0;
  const lines: string[] = [];
  const N = data.scheme.digs.notes;
  const digs = block.scheme.digs.map((g) => {
    if (g.ended !== 'running') return g;
    const runner = block.crew.find((c) => c.id === g.runner);
    const voice: 'eyes' | 'hands' | 'doubts' = runner?.flaw === 'doubts' ? 'doubts' : runner?.talent === 'hands' ? 'hands' : 'eyes';
    const i = Math.min(g.notes.length, N[voice].length - 1);
    const note = `${runner?.name ?? 'The Lead'}: "${N[voice][i]}"`;
    lines.push(note);
    if (block.here.day < g.doneOn) return { ...g, notes: [...g.notes, note] };
    const d = digDef(g.id, data)!;
    lines.push(`${d.name}: ${d.found}`);
    return { ...g, notes: [...g.notes, note, d.found], ended: 'choose' as const };
  });
  block = { ...block, scheme: { ...block.scheme, digs } };
  // What a Dig gives comes when it's done.
  for (const g of digs.filter((x, i) => x.ended === 'choose' && block0.scheme.digs[i]?.ended === 'running')) {
    const d = digDef(g.id, data)!;
    if (d.ground) {
      const n = d.ground * (data.scheme.digs.wonderDouble && block.team.creed === 'wonder' ? 2 : 1);
      const before = block.scheme.groundwork;
      block = addGround(block, n);
      if (block.scheme.groundwork > before) lines.push(W('groundTick', data, { n: block.scheme.groundwork - before, why: d.name }));
    }
    if (d.funds) block = moveTeam(block, { funds: d.funds });
    if (d.truth && block.team.creed === 'spite') block = addGround(block, familyOf(block, data)?.ground.sources.find((x) => x.kind === 'truth')?.pct ?? 0);
    if (g.part) {
      const f = familyOf(block, data);
      const clean = !(f?.parts[g.part].dirty?.dig === g.id);
      const st = stamp(block, g.part, clean, g.id, g.runner, g.cardId);
      block = st.block;
      if (st.line) lines.push(st.line);
    }
  }
  return { block, lines };
}

/** The choice every Dig ends with: keep it open, or put it back (Regard +1; anyone whose line is the land or a shrine, Loyalty +1). */
export function endDig(block: EvilModeBlock, holdingId: string, back: boolean, data: EvilData = EVIL_DATA): Out {
  const g = block.scheme.digs.find((x) => x.holdingId === holdingId && x.ended === 'choose');
  if (!g) return bad(block, 'No Dig is waiting on a choice there.');
  const P = data.scheme.digs.putBack;
  const digs = block.scheme.digs.map((x) => (x === g ? { ...x, ended: back ? ('back' as const) : ('open' as const) } : x));
  let b: EvilModeBlock = { ...block, scheme: { ...block.scheme, digs } };
  const lines: string[] = [];
  if (back) {
    b = moveTeam(b, { regard: P.regard });
    b = { ...b, crew: b.crew.map((c) => (c.where === 'in' && crosses(c, ['dig', 'shrine'], data) ? moveLoyalty(c, P.loyalty, data) : c)) };
    lines.push('Put back. What was found is still found.');
    const e = moveEye(b, -1, data);
    b = e.block;
    if (e.line) lines.push(e.line);
  } else lines.push('Kept open.');
  b = appendLog(b, { kind: 'scheme', who: g.squad, to: holdingId, text: `Day ${block.here.day}. ${digDef(g.id, data)!.name}: ${back ? 'put back' : 'kept open'}.` });
  return { block: b, problem: null, lines };
}

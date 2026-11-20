// DOMINION slice D24: police questioning (Claude API draft §5.3 E; mockups a8 + a9 in plans/claude-api/mockups).
// The Boss is caught (a failed Stealth action, a lost police fight or raid, a dawn pick-up at high Heat) or a crew member
// is arrested: an interview room, an officer with their own personality and a Belief meter (0-100). Each answer is
// judged against the case file, the evidence the run itself built (acts seen, members who talked, a Racket's books);
// contradicting it drops the meter hard, and some of it lies face down. After the last answer: Released, On bail or Held,
// and always some consequences, scaled by how low the meter went (Kice 2026-11-18).
//
// Rotom (Claude) may judge a typed answer and voice the officer's reply; the judge arrives inside the action, is checked
// here (the evidence id must be in the case) and the rules decide the rest. Every roll is on this slice's own streams:
// `dominion-q::<n>::<turn>` (answers), `dominion-q::<n>` (officer, face-down card), `dominion-release::<n>`,
// `dominion-evidence::<rolls>`, `dominion-pickup::<day>`. No old stream moves.

import type { Content } from '../contentSchema';
import { hashSeed, Rng } from '../rng';
import type { RunState } from '../state';
import { wrapPlayerText } from '../ai/rules';
import { endNight } from './clock';
import { addLoyalty, addMorale, crewOf, leave, monName } from './crew';
import { DOMINION_DATA } from './data';
import { addCaughtHook, addHeat, districtDef, syncHeat, targetDef, wanted, type CaughtEv } from './field';
import { buildingDef, spend } from './hqFx';
import {
  JudgeSchema, type AnswerKind, type DominionBlock, type Evidence, type EvidenceKind, type Judge, type Member, type Officer, type Outcome, type PoliceState,
  type QTurn, type Questioning, type ReleaseLine, type Stance,
} from './schema';
import { addWorldStep, fill } from './worldTurn';

const P = () => DOMINION_DATA.police;
const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, Math.round(n)));
const rngOf = (seed: string, ...key: (string | number)[]): Rng => new Rng(hashSeed([seed, ...key].join('::')));

export const freshPolice = (): PoliceState => ({ n: 0, q: null, last: null, evidence: [], rolls: 0, pickedUp: 0, floor: null, watched: [], held: [], raid: null, informant: null });
/** The block's police state, filled in place for an older block. */
export function policeOf(b: DominionBlock): PoliceState {
  return (b.police ??= freshPolice());
}
export const officerById = (id: string): Officer => P().officers.find((o) => o.id === id) ?? P().officers[0]!;
/** The region's rival team as the mockup's button says it ("Blame Rocket"). */
const rival = (): string => DOMINION_DATA.field.rivalTeam;
const dName = (id: string): string => districtDef(id)?.name ?? id;
/** A quick answer's button label (Blame takes the region's rival team). */
export const answerLabel = (k: AnswerKind): string => fill(P().answers[k].label, { rival: rival() });
export const answerSay = (k: AnswerKind): string => fill(P().answers[k].say ?? '', { rival: rival(), cost: P().answers[k].cost ?? 0 });

// ---------- the evidence log ----------

function addEvidence(p: PoliceState, e: Evidence, day: number): void {
  if (p.evidence.some((x) => x.id === e.id)) return;
  p.evidence.push(e);
  const E = P().evidence;
  p.evidence = p.evidence.filter((x) => day - x.day <= E.maxAge).slice(-E.keep);
}
function evText(kind: EvidenceKind, v: Record<string, string | number>): string {
  return fill(P().evidence.kinds[kind].text, v);
}
const clock = (r: Rng, phase: DominionBlock['phase']): string => {
  const h = phase === 'night' ? [21, 22, 23, 0, 1, 2][r.int(0, 5)]! : phase === 'evening' ? r.int(18, 20) : r.int(9, 17);
  const m = r.int(0, 59);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const GUARDED = new Set(['shop', 'center', 'site', 'dock', 'police', 'gym']);

/**
 * An act the Boss just made raised a district's Heat by `gained`: someone may have seen it (stream
 * `dominion-evidence::<rolls>`). `mon` is the Boss's lead Pokémon (what a witness remembers). Mutates `b`.
 */
export function noteAct(b: DominionBlock, seed: string, district: string, target: string | null, gained: number, mon: string | null): void {
  if (gained <= 0) return;
  const p = policeOf(b), E = P().evidence;
  p.rolls += 1;
  const r = rngOf(seed, 'dominion-evidence', p.rolls);
  if (r.int(1, 100) > E.actChance + gained * E.heatPer) return;
  const t = targetDef(target)?.target;
  const kind: EvidenceKind = b.phase !== 'night' && t && GUARDED.has(t.kind) ? 'cctv' : 'witness';
  const place = t?.name ?? dName(district);
  addEvidence(p, { id: `e${p.rolls}`, kind, day: b.day, district, text: evText(kind, { place, time: clock(r, b.phase), mon: mon ? monName(mon) : 'Pokémon' }), ...(mon ? { mon } : {}) }, b.day);
}

// ---------- opening a questioning ----------

function charmOf(b: DominionBlock, who: string): number {
  return who === 'boss' ? b.field.edge.stats.charm : b.members.find((m) => m.id === who)?.stats.charm ?? P().start.charmMid;
}

/** Opens a questioning (one at a time). False when one is already open. Mutates `b`. */
export function openQ(b: DominionBlock, seed: string, who: string, why: Questioning['why'], district: string, catchEv: Omit<Evidence, 'id' | 'day'> | null): boolean {
  const p = policeOf(b);
  if (p.q) return false;
  p.n += 1;
  const n = p.n, r = rngOf(seed, 'dominion-q', n), S = P().start;
  const heat = wanted(b.field);
  const pool = P().officers.filter((o) => heat >= o.minHeat && heat <= o.maxHeat);
  const officer = pool.length ? pool[r.int(0, pool.length - 1)]! : P().officers[0]!;
  if (catchEv) addEvidence(p, { ...catchEv, id: `c${n}`, day: b.day }, b.day);
  // The case: this district's evidence first, then the newest; the catch itself always in.
  const pick = [...p.evidence].sort((a, c) => Number(c.district === district) - Number(a.district === district) || c.day - a.day || p.evidence.indexOf(c) - p.evidence.indexOf(a));
  const own = p.evidence.find((e) => e.id === `c${n}`);
  const evidence = [...(own ? [own] : []), ...pick.filter((e) => e !== own)].slice(0, P().evidence.perCase).map((e) => ({ ...e }));
  const others = evidence.filter((e) => e !== evidence[0] || !own);
  const down = evidence.length >= P().evidence.faceDownFrom && others.length ? [others[r.int(0, others.length - 1)]!.id] : [];
  const belief = clamp(S.base - heat * S.heatPer + (charmOf(b, who) - S.charmMid) * S.charmPer + officer.start, 5, 95);
  const name = who === 'boss' ? 'The Boss' : b.members.find((m) => m.id === who)?.name ?? who;
  p.q = { n, who, name, officer: officer.id, district, day: b.day, why, belief, start: belief, evidence, down, turns: [] };
  return true;
}

addCaughtHook((b: DominionBlock, ev: CaughtEv): string[] => {
  const L = P().lines, C = P().caught;
  if (policeOf(b).q) return [];
  if (ev.why === 'stealth') {
    // A failed Stealth action: seen and grabbed (stream `dominion-caught::<act roll count>`).
    if (ev.action?.stat !== 'stealth') return [];
    const r = rngOf(ev.seed, 'dominion-caught', b.field.rolls);
    if (r.int(1, 100) > C.stealthBase + wanted(b.field) * C.stealthHeatPer) return [];
  }
  const place = ev.place ?? dName(ev.district);
  const catchEv = ev.why === 'stealth'
    ? { kind: 'witness' as const, district: ev.district, text: fill(L.seenBoss, { place }) }
    : { kind: 'report' as const, district: ev.district, text: evText('report', { officer: officerById('jenny').name, district: dName(ev.district) }) };
  if (!openQ(b, ev.seed, 'boss', ev.why, ev.district, catchEv)) return [];
  return [fill(ev.why === 'stealth' ? L.caughtStealth : ev.why === 'raid' ? L.caughtRaid : L.caughtFight, { place, district: dName(ev.district) })];
});

// ---------- the World Turn: statements, Racket books, the informant, the dawn pick-up, what the police still hold ----------

/** Hide in the Warehouse (D2) is read before the police's own step clears it: the sweep (and a pick-up) finds nothing. */
const hiding = new WeakMap<DominionBlock, boolean>();
addWorldStep('crew', (b) => {
  hiding.set(b, b.field.hidden);
  return [];
});

addWorldStep('police', (b, seed) => {
  const p = policeOf(b), L = P().lines, C = P().caught;
  const lines: string[] = [];
  const hq = DOMINION_DATA.field.hq;
  // A member caught or arrested tonight talked; an arrested one is questioned in the morning.
  for (const m of b.members) {
    const c = crewOf(m);
    if (c.last !== 'caught' && c.last !== 'arrested') continue;
    addEvidence(p, { id: `s${b.day}-${m.id}`, kind: 'statement', day: b.day, district: hq, text: evText('statement', { who: m.name }) }, b.day);
    if (c.last === 'arrested' && C.crew && c.out?.why === 'jail' && openQ(b, seed, m.id, 'crew', hq, null)) {
      lines.push(fill(L.crew, { name: m.name, district: dName(hq) }));
    }
  }
  if (b.day % DOMINION_DATA.start.clock.weekLength === 0 && b.field.rackets.length) {
    const rk = b.field.rackets[0]!;
    addEvidence(p, { id: `l${b.day}`, kind: 'ledger', day: b.day, district: rk.district, text: evText('ledger', { place: targetDef(rk.target)?.target.name ?? dName(rk.district) }) }, b.day);
  }
  if (p.informant) {
    const m = b.members.find((x) => x.id === p.informant);
    if (!m) {
      p.informant = null;
    } else {
      addHeat(b, hq, P().release.informantHeat);
      syncHeat(b);
      addEvidence(p, { id: `i${b.day}`, kind: 'statement', day: b.day, district: hq, text: evText('statement', { who: m.name }) }, b.day);
      lines.push(fill(L.informantNight, { name: m.name, n: P().release.informantHeat }));
    }
  }
  const heat = wanted(b.field);
  if (!p.q && !hiding.get(b) && heat >= C.pickupAt && (!p.pickedUp || b.day - p.pickedUp >= C.pickupGapDays)) {
    const r = rngOf(seed, 'dominion-pickup', b.day);
    if (r.int(1, 100) <= C.pickupBase + (heat - C.pickupAt) * C.pickupPer) {
      p.pickedUp = b.day;
      if (openQ(b, seed, 'boss', 'pickup', hq, null)) lines.push(fill(L.pickup, { heat, district: dName(hq) }));
    }
  }
  return lines;
});

addWorldStep('world', (b) => {
  const p = policeOf(b), R = P().release, L = P().lines, f = b.field;
  const lines: string[] = [];
  p.watched = p.watched.filter((w) => w.until > b.day);
  for (const w of p.watched) {
    const d = f.districts[w.district];
    if (d && d.heat < R.watchHeat) d.heat = R.watchHeat;
  }
  if (p.floor && p.floor.until <= b.day) p.floor = null;
  syncHeat(b);
  if (p.floor) {
    const now = wanted(f);
    if (now < p.floor.heat) f.wanted = Math.min(100, f.wanted + p.floor.heat - now);
    syncHeat(b);
  }
  if (p.raid && b.hq) {
    const room = b.hq.rooms.find((x) => x.uid === p.raid!.room);
    if (!room) p.raid = null;
    else if (p.raid.until <= b.day) {
      if (!b.hq.broke) room.shut = false;
      lines.push(fill(L.roomBack, { room: buildingDef(room.id)?.name ?? room.id }));
      p.raid = null;
    } else room.shut = true;
  }
  return lines;
});

/** Pokémon the police held come back on their day (the run's party, a member's team or the Reserve). Mutates `run`. */
export function returnHeld(content: Content, run: RunState): string[] {
  const b = run.expansion?.dominion;
  const p = b?.police;
  if (!b || !p?.held.length) return [];
  const lines: string[] = [];
  const keep: PoliceState['held'] = [];
  for (const h of p.held) {
    if (h.until > b.day) {
      keep.push(h);
      continue;
    }
    const m = b.members.find((x) => x.id === h.from);
    if (m && m.team.length < 6) m.team.push(h.mon);
    else if (h.from === 'party' && run.party.length < 6) run.party = [...run.party, h.mon];
    else if (b.reserve) b.reserve.box.push(h.mon);
    else run.box = [...(run.box ?? []), h.mon];
    lines.push(fill(P().lines.monBack, { mon: content.species.get(h.mon.speciesId)?.name ?? monName(h.mon.speciesId) }));
  }
  p.held = keep;
  return lines;
}

// ---------- answering ----------

/** The rules' reading of a typed answer (also the offline answer when Rotom can't judge). */
export function offlineJudge(q: Questioning, text: string): Judge {
  const t = text.toLowerCase(), T = P().typed;
  const stance: Stance = (['alibi', 'deny', 'blame'] as const).find((k) => T.keywords[k].some((w) => t.includes(w))) ?? 'other';
  const persuasive = Math.min(3, (text.length >= 30 ? 1 : 0) + (T.detail.some((w) => t.includes(w)) ? 1 : 0) + (text.length >= 80 ? 1 : 0));
  return { stance, contradicts: stance === 'other' ? null : contradiction(q, stance), consistent: true, persuasive, reply: '' };
}

/** The case evidence a story contradicts: face-up first, then what lies face down. */
function contradiction(q: Questioning, stance: Exclude<Stance, 'other'>): string | null {
  const hits = q.evidence.filter((e) => P().evidence.kinds[e.kind].contradicts.includes(stance));
  return (hits.find((e) => !q.down.includes(e.id)) ?? hits[0])?.id ?? null;
}

/** The story the questioned person first told (alibi, deny or blame); changing it later is inconsistent. */
const storyOf = (q: Questioning): Stance | null => q.turns.find((t) => t.stance !== 'other')?.stance ?? null;

/** What a Rotom call for a typed answer needs (the scene asks; the rules check what comes back). */
export function judgeAsk(b: DominionBlock, text: string): { id: string; system: string; context: string; input: string; schema: typeof JudgeSchema; offline: () => Judge } | null {
  const q = b.police?.q;
  if (!q) return null;
  const o = officerById(q.officer);
  const system = [
    `You play ${o.name}, a police officer questioning a suspect in a cartoon-villain Pokémon crime game. ${o.sheet}`,
    'Judge the suspect\'s latest answer against the evidence list only. Return JSON:',
    'stance: "alibi" (claims to be elsewhere), "deny" (knows nothing), "blame" (blames another team) or "other";',
    'contradicts: the id of one listed evidence item the answer clearly contradicts, or null;',
    'consistent: false only if it contradicts what the suspect said earlier in this questioning;',
    'persuasive: 0-3, how convincing it sounds; reply: the officer\'s spoken reply, one or two short sentences, in character, no stage directions.',
  ].join('\n');
  const context = [
    `Suspect: ${q.name}. Questioned at the ${dName(q.district)} station.`,
    'Evidence the police hold (the suspect has not seen the ones marked hidden):',
    ...q.evidence.map((e) => `- ${e.id} [${P().evidence.kinds[e.kind].label}${q.down.includes(e.id) ? ', hidden' : ''}]: ${e.text}`),
  ].join('\n');
  const said = q.turns.map((t, i) => `${i + 1}. Suspect: ${t.text} / Officer: ${t.reply}`).join('\n');
  return {
    id: `police:q${q.n}:t${q.turns.length + 1}`,
    system,
    context,
    input: `${said ? `So far:\n${said}\n` : ''}Latest answer: ${wrapPlayerText(text)}`,
    schema: JudgeSchema,
    offline: () => offlineJudge(q, text),
  };
}

export interface AnswerOut { ok: boolean; block: DominionBlock; notice: string | null; over: boolean }

/** One answer in the interview room. Mutates a copy; `over` when the questioning has ended (release follows). */
export function answerQ(block: DominionBlock, a: { kind: AnswerKind; text?: string; judge?: Judge; rotom?: boolean }, seed: string): AnswerOut {
  const no = (notice: string | null): AnswerOut => ({ ok: false, block, notice, over: false });
  if (!block.police?.q) return no(P().lines.noQ);
  const b = structuredClone(block);
  const p = b.police!, q = p.q!, A = P().answers, J = P().judge, o = officerById(q.officer), Ln = o.lines;
  const def = A[a.kind];
  if ((a.kind === 'lawyer' || a.kind === 'bribe') && b.funds < (def.cost ?? 0)) return no(fill(P().lines.noMoney, { cost: def.cost ?? 0 }));
  const r = rngOf(seed, 'dominion-q', q.n, q.turns.length + 1);
  const noise = r.int(-J.noise, J.noise);
  const text = a.kind === 'typed' ? (a.text ?? '').trim().slice(0, J.maxText) : answerSay(a.kind);
  if (a.kind === 'typed' && !text) return no(null);
  // The judge: the rules' for quick answers; Rotom's (checked) or the rules' for typed words.
  let judge: Judge;
  let rotom = false;
  if (a.kind === 'typed') {
    const got = a.judge ? JudgeSchema.safeParse(a.judge) : null;
    const fallback = offlineJudge(q, text);
    if (got?.success) {
      const ok = got.data.contradicts === null || q.evidence.some((e) => e.id === got.data.contradicts);
      judge = { ...got.data, contradicts: ok ? got.data.contradicts : fallback.contradicts, reply: got.data.reply.trim().slice(0, J.maxReply) };
      rotom = !!a.rotom && !!judge.reply;
    } else judge = fallback;
  } else if (a.kind === 'alibi' || a.kind === 'deny' || a.kind === 'blame') {
    judge = { stance: a.kind, contradicts: contradiction(q, a.kind), consistent: true, persuasive: J.quick, reply: '' };
  } else judge = { stance: 'other', contradicts: null, consistent: true, persuasive: 0, reply: '' };
  const story = storyOf(q);
  const consistent = judge.consistent && (story === null || judge.stance === 'other' || judge.stance === story);
  const repeat = a.kind !== 'typed' && a.kind !== 'silent' && q.turns.some((t) => t.kind === a.kind);
  const ev = judge.contradicts ? q.evidence.find((e) => e.id === judge.contradicts) ?? null : null;
  const wasDown = !!ev && q.down.includes(ev.id);
  let delta = def.base;
  let line: string;
  if (a.kind === 'lawyer') {
    spend(b, def.cost ?? 0);
    line = Ln.lawyer;
  } else if (a.kind === 'bribe') {
    const odds = o.bribe + (charmOf(b, q.who) - P().start.charmMid) * 2;
    if (o.bribe > 0 && r.int(1, 100) <= odds) {
      spend(b, def.cost ?? 0);
      delta = def.win ?? 0;
      line = Ln.bribeYes;
    } else {
      delta = -(def.lose ?? 0);
      line = Ln.bribeNo;
    }
  } else if (a.kind === 'silent') {
    delta += noise;
    line = Ln.silent;
  } else {
    delta += Math.round(judge.persuasive * J.persuadePer * o.persuade) + noise;
    if (ev) delta -= Math.round((J.contradict + (wasDown ? J.faceDown : 0)) * o.hard);
    if (!consistent) delta -= J.inconsistent;
    if (repeat) delta -= J.repeat;
    const label = ev ? P().evidence.kinds[ev.kind].label : '';
    line = ev ? fill(wasDown ? Ln.flip : Ln.contradict, { evidence: wasDown ? `${label}: ${ev.text}` : label }) : !consistent ? Ln.inconsistent : repeat ? Ln.repeat : delta >= 6 ? Ln.good : Ln.bad;
  }
  if (wasDown) q.down = q.down.filter((x) => x !== ev!.id);
  const reply = rotom ? judge.reply : fill(line, { district: dName(q.district), rival: rival() });
  const before = q.belief;
  q.belief = clamp(q.belief + delta);
  const turn: QTurn = { kind: a.kind, text: text.slice(0, 200), stance: judge.stance, contradicts: ev?.id ?? null, consistent, persuasive: judge.persuasive, delta: q.belief - before, reply: reply.slice(0, 400), rotom };
  q.turns.push(turn);
  const over = a.kind === 'lawyer' || q.turns.length >= P().turns || q.belief <= 0 || q.belief >= 100;
  return { ok: true, block: b, notice: null, over };
}

// ---------- the release and its consequences ----------

export function outcomeOf(q: Questioning): Outcome {
  const B = P().bands;
  const o: Outcome = q.belief >= B.free ? 'free' : q.belief >= B.bail ? 'bail' : 'held';
  return o === 'free' && q.turns.some((t) => t.kind === 'lawyer') ? 'bail' : o;
}
export function weightOf(belief: number, outcome: Outcome): number {
  const R = P().release;
  const w = clamp((100 - belief) / R.weightPer, 1, R.maxWeight);
  return outcome === 'held' ? Math.min(R.maxWeight, w + R.heldAdds) : w;
}

/** The questioning is over: Released, On bail or Held, and the consequences (always some). Mutates `run` (its block). */
export function releaseQ(content: Content, run: RunState, seed: string): void {
  let b = run.expansion!.dominion!;
  const p = policeOf(b), q = p.q!, R = P().release, L = P().lines, Sy = L.say;
  const outcome = outcomeOf(q), w = weightOf(q.belief, outcome);
  const r = rngOf(seed, 'dominion-release', q.n);
  const out: ReleaseLine[] = [];
  const add = (tag: ReleaseLine['tag'], group: ReleaseLine['group'], tone: ReleaseLine['tone'], v: Record<string, string | number>, extra: Partial<ReleaseLine> = {}): void => {
    out.push({ tag, group, tone, text: fill(Sy[tag], v), ...extra });
  };
  const suspect = q.who === 'boss' ? null : b.members.find((m) => m.id === q.who) ?? null;
  // The crew.
  const morale = R.morale * w;
  for (const m of b.members) addMorale(m, -morale);
  add('morale', 'crew', 'r', { n: morale });
  if (w >= R.min.trust) {
    for (const m of b.members) addLoyalty(b, m, -R.trust * w);
    add('trust', 'crew', 'r', { n: R.trust * w });
  }
  const byLoyalty = (xs: Member[]): Member[] => [...xs].sort((x, y) => x.loyalty - y.loyalty || b.members.indexOf(x) - b.members.indexOf(y));
  if (w >= R.min.informant && !p.informant) {
    const m = byLoyalty(b.members.filter((x) => x.id !== q.who))[0];
    if (m) {
      p.informant = m.id;
      add('informant', 'crew', 'r', { name: m.name }, { face: m.look });
    }
  }
  if (w >= R.min.leave) {
    const m = byLoyalty(b.members.filter((x) => x.id !== p.informant))[0];
    if (m) {
      add('leave', 'crew', 'r', { name: m.name }, { face: m.look });
      leave(b, m, 'police', null, '');
    }
  }
  if (w >= R.min.mon) {
    const pool: { from: string; take: () => RunState['party'][number] }[] = [];
    run.party.forEach((mon, i) => { if (i > 0) pool.push({ from: 'party', take: () => (run.party = run.party.filter((x) => x !== mon), mon) }); });
    if (!pool.length) b.reserve?.box.forEach((mon) => pool.push({ from: 'reserve', take: () => (b.reserve!.box = b.reserve!.box.filter((x) => x !== mon), mon) }));
    if (!pool.length) for (const m of b.members) if (m.team.length > 1) m.team.slice(1).forEach((mon) => pool.push({ from: m.id, take: () => (m.team = m.team.filter((x) => x !== mon), mon) }));
    if (pool.length) {
      const pick = pool[r.int(0, pool.length - 1)]!;
      const mon = pick.take();
      const days = w + R.monExtra;
      p.held.push({ mon, from: pick.from, until: b.day + days + (q.who === 'boss' ? (outcome === 'held' ? 2 : 1) : 0) });
      add('mon', 'crew', 'y', { mon: content.species.get(mon.speciesId)?.name ?? monName(mon.speciesId), n: days }, { mon: mon.speciesId });
    }
  }
  // A member still in a cell (not bailed out meanwhile) stays one night, or two more when Held.
  const c = suspect ? crewOf(suspect) : null;
  if (suspect && c?.out?.why === 'jail') {
    const days = outcome === 'held' ? c.out.days + 2 : 1;
    c.out = { why: 'jail', days };
    add('jail', 'crew', outcome === 'held' ? 'r' : 'y', { name: suspect.name, n: days });
  }
  // The HQ.
  if (w >= R.min.raid && b.hq && !p.raid) {
    const rooms = b.hq.rooms.filter((x) => x.at === null && !x.building && !x.ruined && !x.shut);
    if (rooms.length) {
      const room = rooms[r.int(0, rooms.length - 1)]!;
      room.shut = true;
      p.raid = { room: room.uid, until: b.day + w + (q.who === 'boss' ? (outcome === 'held' ? 2 : 1) : 0) };
      add('raid', 'hq', 'r', { room: buildingDef(room.id)?.name ?? room.id, n: w });
    }
  }
  if (w >= R.min.seized) {
    const n = Math.min(Math.max(0, b.funds), Math.max(R.seizeMin, Math.round((Math.max(0, b.funds) * R.seizePct * w) / 100)));
    if (n > 0) {
      spend(b, n);
      add('seized', 'hq', 'r', { n: n.toLocaleString('en-US') });
    }
  }
  if (outcome === 'bail') {
    const n = Math.min(Math.max(0, b.funds), R.bail * w);
    if (n > 0) spend(b, n);
    add('bail', 'hq', 'y', { n: n.toLocaleString('en-US') });
  }
  const lawyer = q.turns.find((t) => t.kind === 'lawyer');
  if (lawyer) add('lawyer', 'hq', 'y', { n: P().answers.lawyer.cost ?? 0 });
  if (w >= R.min.floor) {
    const heat = R.floorBase + R.floorPer * w;
    p.floor = { heat: Math.max(heat, p.floor?.heat ?? 0), until: b.day + R.floorDays };
    add('floor', 'hq', 'y', { n: heat });
  }
  if (w >= R.min.watched) {
    p.watched = [...p.watched.filter((x) => x.district !== q.district), { district: q.district, until: b.day + R.watchDays }];
    const d = b.field.districts[q.district];
    if (d && d.heat < R.watchHeat) d.heat = R.watchHeat;
    add('watched', 'hq', 'y', { district: dName(q.district) });
  }
  syncHeat(b);
  const o = officerById(q.officer);
  const parting = fill(o.lines.parting, { district: dName(q.district) });
  let cell: string;
  // The Boss loses the rest of the day and the night in a cell (Held: one more); a member's night is their own.
  if (q.who === 'boss') {
    const first = b.day;
    p.q = null;
    p.pickedUp = Math.max(p.pickedUp, b.day);
    b = endNight(b, seed, false);
    if (outcome === 'held') b = endNight(b, seed, false);
    cell = outcome === 'held' ? fill(L.cellHeld, { day: first, next: first + 1 }) : fill(L.cell, { day: first });
    b.report = [cell, ...b.report];
  } else {
    p.q = null;
    cell = fill(L.cellMember, { name: q.name });
  }
  policeOf(b).last = { n: q.n, who: q.who, name: q.name, officer: q.officer, district: q.district, outcome, belief: q.belief, weight: w, day: b.day, lines: out, cell, parting, seen: false };
  run.expansion = { ...(run.expansion ?? {}), dominion: b };
}

/** The release page was read. */
export function releasedSeen(block: DominionBlock): DominionBlock | null {
  if (!block.police?.last || block.police.last.seen) return null;
  const b = structuredClone(block);
  b.police!.last!.seen = true;
  return b;
}

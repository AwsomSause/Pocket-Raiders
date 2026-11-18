// Evil Mode's Night (design Part 24a sections 1-2, Part 24c section 7, Part 25a section 4, Part 30 section 3.10): the
// knock picker's eleven rules, an answer and its echoes, "(Not tonight.)", Hear someone out, and the Wall.
// Pure: new blocks are returned. The only draw is on `evil-people`, one a Night, taken even when nobody knocks.

import { EVIL_DATA, type EvilData } from './data';
import { appendLog, fill } from './ledger';
import { districtKey, inRoster, moveLoyalty, peopleRoll, teamLoyalty } from './people';
import { MOODS, type Crew, type Echo, type EvilModeBlock, type Knock, type KnockDef, type Mood } from './schema';

type Out = { block: EvilModeBlock; problem: string | null; line: string; moved: string };
const no = (block: EvilModeBlock, problem: string): Out => ({ block, problem, line: '', moved: '' });

export const knockDef = (n: number, data: EvilData = EVIL_DATA): KnockDef | undefined => data.night.knocks.find((k) => k.n === n);
export const nightText = (k: string, data: EvilData = EVIL_DATA): string => data.night.text[k] ?? '';
const person = (block: EvilModeBlock, id: string | null): Crew | undefined => (id ? block.crew.find((c) => c.id === id) : undefined);

// ---- Needs (night.json `needs`): the live ones read the block; the rest wait on a later slice and are never met ----

const LIVE_NEEDS: Record<string, (b: EvilModeBlock) => boolean> = {
  voicePersuaded: (b) => b.sheets.some((s) => s.method === 'persuade' && s.won && s.squad.some((id) => person(b, id)?.talent === 'voice')),
  lead: (b) => inRoster(b).some((c) => c.rank === 'lead'),
  minor: (b) => inRoster(b).some((c) => c.minor),
  heldLocal: (b) => !!b.district?.holdings.some((h) => h.kind === 'local' && h.owner === 'team'),
  heat5: (b) => b.team.heat >= 5,
  heat6: (b) => b.team.heat >= 6,
  regard4: (b) => b.team.regard >= 4,
  loyalty9: (b) => inRoster(b).length > 0 && teamLoyalty(b) >= 9,
};
/** The live needs that have code behind them (a test checks night.json's live list matches). */
export const LIVE_NEED_IDS = [...Object.keys(LIVE_NEEDS), 'flag:*'];

export function needMet(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA): boolean {
  const def = data.night.needs.find((x) => x.id === id);
  if (!def?.live) return false;
  if (id.startsWith('flag:')) return block.night.flags.includes(id.slice(5));
  return LIVE_NEEDS[id]?.(block) ?? false;
}

// ---- Who knocks: the Roster member who fits best (the spec), then the quietest, then Roster order ----

const outsider = (k: KnockDef): boolean => !!(k.who.outside || k.who.nobody);

/** Everyone who could say this knock tonight, quietest first. Empty for a knock from outside (it has no speaker). */
export function speakers(block: EvilModeBlock, k: KnockDef): Crew[] {
  if (outsider(k)) return [];
  const w = k.who;
  const region = block.here.region;
  let list = inRoster(block).filter((p) => block.night.hushed[p.id] !== region);
  if (w.first) list = list.slice(0, 1);
  if (w.oldest) list = list.filter((p) => p.age !== null).sort((a, b) => b.age! - a.age!).slice(0, 1);
  list = list.filter((p) => (w.talent === undefined || p.talent === w.talent) && (w.flaw === undefined || p.flaw === w.flaw) && (w.rank === undefined || p.rank === w.rank)
    && (w.minLoyalty === undefined || p.loyalty >= w.minLoyalty) && (w.maxLoyalty === undefined || p.loyalty <= w.maxLoyalty)
    && (w.maxAge === undefined || (p.age !== null && p.age <= w.maxAge)) && (w.minor === undefined || p.minor === w.minor));
  return list.map((p, i) => ({ p, i })).sort((a, b) => a.p.knocks - b.p.knocks || a.i - b.i).map((x) => x.p);
}

export type Candidate = { n: number; who: string | null; weight: number };

const isSunday = (block: EvilModeBlock, data: EvilData): boolean => block.here.day % data.night.rules.sunday === 0;
const isFirstNight = (block: EvilModeBlock): boolean => block.here.day === 1 && block.here.region === 0;

/**
 * The deck tonight (Part 24a section 1.3): every knock whose needs hold, not had this run, with someone to say it.
 * The first Night: knock 1 or 2 only. The seventh day: ☼ only. Nobody twice running unless `forced` sends them.
 * Whoever's knocked least is twice as likely.
 */
export function deckTonight(block: EvilModeBlock, forced: string | null = null, data: EvilData = EVIL_DATA): Candidate[] {
  const N = block.night;
  const R = data.night.rules;
  const dk = districtKey(block);
  const ins = inRoster(block);
  const least = ins.length ? Math.min(...ins.map((p) => p.knocks)) : 0;
  const lastNight = N.last && N.last.day === block.here.day - 1 ? N.last.who : null;
  const out: Candidate[] = [];
  for (const k of data.night.knocks) {
    if (k.status === 'disabled' || N.had.includes(k.n) || N.removed.includes(`${dk}:${k.n}`)) continue;
    if (isFirstNight(block) && !R.firstNight.includes(k.n)) continue;
    if (isSunday(block, data) && !k.sun) continue;
    if (!k.needs.every((id) => needMet(block, id, data))) continue;
    if (outsider(k)) {
      if (!forced) out.push({ n: k.n, who: null, weight: 1 });
      continue;
    }
    const sp = speakers(block, k);
    const who = forced ? sp.find((p) => p.id === forced) : sp.find((p) => p.id !== lastNight);
    if (!who) continue;
    out.push({ n: k.n, who: who.id, weight: who.knocks === least ? R.quietWeight : 1 });
  }
  return out;
}

/** One weighted pick from a roll of 1..total. */
const choose = (c: Candidate[], roll: number): Candidate => {
  let at = roll;
  for (const x of c) {
    if (at <= x.weight) return x;
    at -= x.weight;
  }
  return c[c.length - 1]!;
};

/**
 * Who knocks tonight (Part 24a section 1.2), the first rule that applies. Rules 1-3, 5 and 7-10 wait on later slices
 * (no Reckoning, Mutiny, summons due, firing flaws, Executives, Raids, fires or owed scenes yet): their hooks find nobody.
 * Rule 4: someone asked across their line today. Rule 6: passed over yesterday. Rule 11: the deck.
 * The draw on `evil-people` is taken once a Night whatever happens, so a Night with no knock still moves the stream.
 */
export function drawKnock(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  const d = block.district;
  const day = block.here.day;
  const key = `${districtKey(block)}:${day}`;
  if (!d || block.night.drawn === key) return block;
  const n = block.draws['evil-people'] ?? 0;
  let b: EvilModeBlock = { ...block, draws: { ...block.draws, 'evil-people': n + 1 }, night: { ...block.night, drawn: key } };
  // Corruption 2 or more: one ☼ knock a district is taken out of the deck.
  const dk = districtKey(b);
  if (b.team.corruption >= data.night.rules.corruptionSun && !b.night.removed.some((r) => r.startsWith(`${dk}:`))) {
    const sun = data.night.knocks.find((k) => k.sun && k.status !== 'disabled' && !b.night.had.includes(k.n));
    if (sun) b = { ...b, night: { ...b.night, removed: [...b.night.removed, `${dk}:${sun.n}`] } };
  }
  const asked = b.log.filter((e) => e.kind === 'asked' && e.day === day && e.region === d.region && e.district === d.n).flatMap((e) => e.who);
  const passed = b.night.passed.filter((x) => x.day === day - 1).map((x) => x.id);
  const forcedRules: [number, string[]][] = [[4, asked], [6, passed]];
  let pick: { c: Candidate; rule: number } | null = null;
  for (const [rule, ids] of forcedRules) {
    for (const id of ids) {
      if (pick || !person(b, id) || person(b, id)!.where !== 'in') continue;
      const c = deckTonight(b, id, data);
      if (c.length) pick = { c: choose(c, peopleRoll(d.seed, n, c.reduce((s, x) => s + x.weight, 0))), rule };
    }
  }
  if (!pick) {
    const c = deckTonight(b, null, data);
    const total = Math.max(1, c.reduce((s, x) => s + x.weight, 0));
    const roll = peopleRoll(d.seed, n, total);
    if (c.length) pick = { c: choose(c, roll), rule: 11 };
  }
  const knock: Knock | null = pick ? { n: pick.c.n, who: pick.c.who, day, rule: pick.rule } : null;
  return { ...b, night: { ...b.night, knock } };
}

// ---- Answers and echoes ----

const stepMood = (m: Mood, by: number): Mood => MOODS[Math.max(0, Math.min(MOODS.length - 1, MOODS.indexOf(m) - by))]!;
const moodName = (m: Mood): string => m.charAt(0).toUpperCase() + m.slice(1);
const STAT: Record<'regard' | 'dread' | 'heat', string> = { regard: 'Regard', dread: 'Dread', heat: 'Heat' };

/** The words a knock is said in: the speaker's name and age, the team, the Creed's line. */
export function knockVars(block: EvilModeBlock, k: Knock | { who: string | null }, data: EvilData = EVIL_DATA): Record<string, string | number> {
  const p = person(block, k.who);
  return { name: p?.name ?? '', age: p?.age ?? '', team: block.team.name, creedLine: data.creeds.find((c) => c.id === block.team.creed)?.line ?? '' };
}

/** Who's at the door, as the Office names them. */
export function knockerName(block: EvilModeBlock, k: Knock, data: EvilData = EVIL_DATA): string {
  const def = knockDef(k.n, data)!;
  return person(block, k.who)?.name ?? def.who.outside ?? 'Nobody';
}

/** Applies one echo; returns the new block and the one-line "what moved" for it (empty when nothing shows). */
function applyEcho(block: EvilModeBlock, e: Echo, whoId: string | null, data: EvilData): { block: EvilModeBlock; line: string } {
  const p = person(block, whoId);
  const T = (k: string, v: Record<string, string | number> = {}) => fill(nightText(k, data), { name: p?.name ?? '', ...v });
  const setP = (b: EvilModeBlock, q: Crew): EvilModeBlock => ({ ...b, crew: b.crew.map((c) => (c.id === q.id ? q : c)) });
  const team = (stat: 'regard' | 'dread' | 'heat', by: number) => ({ block: { ...block, team: { ...block.team, [stat]: Math.max(0, Math.min(10, block.team[stat] + by)) } }, line: T(by > 0 ? 'statUp' : 'statDown', { stat: STAT[stat] }) });
  switch (e.t) {
    case 'mood': {
      if (!p) return { block, line: '' };
      const mood = stepMood(p.mood, e.by);
      return { block: setP(block, { ...p, mood }), line: T('moodTo', { mood: moodName(mood) }) };
    }
    case 'loyalty':
      if (!p) return { block, line: '' };
      return { block: setP(block, moveLoyalty(p, e.by, data)), line: T(e.by > 0 ? 'loyaltyUp' : 'loyaltyDown') };
    case 'team':
      return team(e.stat, e.by);
    case 'regardOrDread':
      // Part 24a knock 26: by what's said next. The racket waived somewhere: Regard; otherwise Dread.
      return team(Object.values(block.rates).includes('waived') ? 'regard' : 'dread', 1);
    case 'localMood': {
      const h = block.district?.holdings.find((x) => x.kind === 'local' && x.owner === 'team');
      if (!h || !h.mood || !block.district) return { block, line: '' };
      const mood = stepMood(h.mood, e.by);
      return { block: { ...block, district: { ...block.district, holdings: block.district.holdings.map((x) => (x.id === h.id ? { ...x, mood } : x)) } }, line: `That holding: ${moodName(mood)}.` };
    }
    case 'wall': {
      const item = data.night.wall.find((w) => w.id === e.item)!;
      return { block: { ...block, night: { ...block.night, wall: [...block.night.wall, { item: e.item, day: block.here.day, down: null }] } }, line: T('onWall', { what: item.what }) };
    }
    case 'flag': {
      const f = data.night.flags.find((x) => x.id === e.id)!;
      const flags = block.night.flags.includes(e.id) ? block.night.flags : [...block.night.flags, e.id];
      return { block: { ...block, night: { ...block.night, flags } }, line: fill(f.shown, { name: p?.name ?? '' }) };
    }
    case 'hush':
      if (!p) return { block, line: '' };
      return { block: { ...block, night: { ...block.night, hushed: { ...block.night.hushed, [p.id]: block.here.region } } }, line: T('hushed') };
    case 'leave':
      if (!p) return { block, line: '' };
      return { block: setP(block, { ...p, where: 'left', left: { day: block.here.day, how: e.how } }), line: T('left') };
  }
}

/** Why an answer can't be given tonight (its own needs), or null. */
export function answerProblem(block: EvilModeBlock, i: number, data: EvilData = EVIL_DATA): string | null {
  const k = block.night.knock;
  if (!k) return "Nobody's at the door.";
  const def = knockDef(k.n, data)!;
  if (i === 3) return def.shut ? null : nightText('cantShut', data);
  const a = def.answers[i];
  if (!a) return 'No such answer.';
  const miss = (a.needs ?? []).find((id) => !needMet(block, id, data));
  return miss ? `Needs ${data.night.needs.find((x) => x.id === miss)?.says ?? miss}.` : null;
}

/**
 * The Boss answers (0..2), or doesn't open the door (3). One answer, one Log entry, every answer kept. "(Not tonight.)":
 * the knock returns once, then it's gone; their mood a step down if it was their own business; one more knock slept through.
 */
export function answerKnock(block: EvilModeBlock, i: number, data: EvilData = EVIL_DATA): Out {
  if (block.here.beat !== 'night') return no(block, 'The door only goes at Night.');
  const k = block.night.knock;
  const problem = answerProblem(block, i, data);
  if (problem || !k) return no(block, problem ?? "Nobody's at the door.");
  const def = knockDef(k.n, data)!;
  const vars = knockVars(block, k, data);
  const who = knockerName(block, k, data);
  const p = person(block, k.who);
  let b: EvilModeBlock = { ...block, crew: block.crew.map((c) => (c.id === k.who ? { ...c, knocks: c.knocks + 1 } : c)) };
  const last = k.who ? { who: k.who, day: k.day } : block.night.last;
  const echo = { n: k.n, who: k.who, answer: i, day: block.here.day };
  if (i === 3) {
    const count = (block.night.shut[String(k.n)] ?? 0) + 1;
    const gone = count > data.night.rules.shutReturns;
    b = { ...b, night: { ...b.night, knock: null, last, sleptThrough: b.night.sleptThrough + 1, shut: { ...b.night.shut, [String(k.n)]: count }, had: gone ? [...b.night.had, k.n] : b.night.had, doorOn: block.here.day } };
    let moved = '';
    if (p && !def.report) {
      const r = applyEcho(b, { t: 'mood', by: -1 }, p.id, data);
      b = r.block;
      moved = r.line;
    }
    b = appendLog(b, { kind: 'knock', who: k.who ? [k.who] : [], text: fill(nightText('logShut', data), { who }) });
    return { block: b, problem: null, line: nightText('notTonightGone', data), moved };
  }
  const a = def.answers[i]!;
  b = { ...b, night: { ...b.night, knock: null, last, had: [...b.night.had, k.n], echoes: [...b.night.echoes, echo], doorOn: block.here.day } };
  const lines: string[] = [];
  for (const e of a.echo) {
    const r = applyEcho(b, e, k.who, data);
    b = r.block;
    if (r.line) lines.push(r.line);
  }
  const moved = lines.join(' ') || nightText('nothingMoved', data);
  b = appendLog(b, { kind: 'knock', who: k.who ? [k.who] : [], text: fill(nightText('logKnock', data), { who, says: fill(def.says, vars), answer: fill(a.say, vars) }) });
  return { block: b, problem: null, line: fill(a.reply, vars), moved };
}

// ---- The Night's one action ----

export type NightAction = 'hear' | 'sleep';

/** Why the one action can't be taken now, or null. The knock comes first; one action a Night. */
export function actionProblem(block: EvilModeBlock, data: EvilData = EVIL_DATA): string | null {
  if (block.here.beat !== 'night') return 'That waits for the Night.';
  if (block.night.knock) return nightText('noAction', data);
  if (block.night.actedOn === block.here.day) return nightText('acted', data);
  return null;
}

const sentences = (t: string): string[] => t.match(/[^.!?…]+[.!?…]+[”"]?\s*|[^.!?…]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [t];

/**
 * What someone says when heard out (Part 24c section 7): the topic (ordered across their line this region, else their
 * talent and something they noticed), wrapped by their mood. Warm says more, Wary half, Sullen the fact, Shut nothing.
 */
export function hearLine(block: EvilModeBlock, p: Crew, data: EvilData = EVIL_DATA): string {
  if (p.mood === 'shut') return nightText('hearShut', data);
  const H = data.night.hear;
  const askedThisRegion = block.log.some((e) => e.kind === 'asked' && e.region === block.here.region && e.who.includes(p.id));
  const topic = askedThisRegion ? nightText('hearAsked', data) : (p.ref ? H.byPerson[p.ref] : undefined) ?? (p.talent ? H.byTalent[p.talent] : undefined) ?? nightText('hearPlain', data);
  const s = sentences(topic);
  if (p.mood === 'warm') return p.talent ? `${topic} ${H.warmExtra[p.talent]}` : topic;
  if (p.mood === 'wary') return `${s.slice(0, Math.max(1, Math.ceil(s.length / 2))).join(' ')} ${nightText('hearWary', data)}`;
  if (p.mood === 'sullen') return `${s[0]} ${nightText('hearSullen', data)}`;
  return topic;
}

/** Hear someone out: it moves nothing (but the Log keeps that they were heard). Or sleep. Either is the Night's one action. */
export function nightAction(block: EvilModeBlock, action: NightAction, id: string | null, data: EvilData = EVIL_DATA): Out {
  const problem = actionProblem(block, data);
  if (problem) return no(block, problem);
  const b0: EvilModeBlock = { ...block, night: { ...block.night, actedOn: block.here.day } };
  if (action === 'sleep') return { block: b0, problem: null, line: nightText('sleep', data), moved: '' };
  const p = person(block, id);
  if (!p || p.where !== 'in') return no(block, 'Not on the Roster.');
  const line = hearLine(block, p, data);
  return { block: appendLog(b0, { kind: 'heard', who: [p.id], text: fill(nightText('logHear', data), { who: p.name }) }), problem: null, line: `${p.name}: ${line}`, moved: '' };
}

// ---- The Wall (Part 25a section 4, Part 29 section 11.3) ----

/** Taking something down: a confirm on screen; the gap stays. Desk things don't come down. Any beat. */
export function takeDown(block: EvilModeBlock, index: number, data: EvilData = EVIL_DATA): Out {
  const w = block.night.wall[index];
  if (!w || w.down !== null) return no(block, "It's not up.");
  const item = data.night.wall.find((x) => x.id === w.item)!;
  if (item.kind === 'desk') return no(block, "That's not on the Wall.");
  const wall = block.night.wall.map((x, i) => (i === index ? { ...x, down: block.here.day } : x));
  const b = appendLog({ ...block, night: { ...block.night, wall } }, { kind: 'wall', who: [], text: fill(nightText('logDown', data), { what: item.what.charAt(0).toLowerCase() + item.what.slice(1) }) });
  return { block: b, problem: null, line: nightText('takeDownGap', data), moved: '' };
}

export type WallState = 'kept' | 'kind' | 'edited' | 'bare';

/** The Wall's state as the end reads it: "Kept all of it", "Took down the kind ones", "Edited", or "Bare". */
export function wallState(block: EvilModeBlock, data: EvilData = EVIL_DATA): WallState {
  const up = block.night.wall.filter((w) => data.night.wall.find((x) => x.id === w.item)?.kind !== 'desk');
  const down = up.filter((w) => w.down !== null);
  if (!down.length) return 'kept';
  if (down.length === up.length) return 'bare';
  const kinds = new Set(down.map((w) => data.night.wall.find((x) => x.id === w.item)!.kind));
  return kinds.size === 1 && kinds.has('thanks') ? 'kind' : 'edited';
}

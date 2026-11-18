// Evil Mode slice 18, the voice (design Part 25a: the Radio, the paper, barks, the Ledger's margins; Part 25b: the post).
// Pure. Each Morning: the Radio says one thing from yesterday, the paper prints one headline, and at most one piece of
// post reaches the Board (the older first). Letters are answered here; a reply moves nothing by more than one.
// Barks are presentation only: they hash the seed (never a gameplay stream), are never saved, and change nothing.

import voiceRaw from '../../data/evilMode/voice.json';
import { hashSeed } from '../rng';
import { appendLog, fill, money } from './ledger';
import { inRoster, moveLoyalty, teamLoyalty } from './people';
import { dayIn, runIndex, stageKind } from './region';
import { stageRow } from './board';
import { EVIL_DATA, type EvilData } from './data';
import type { Crew, EvilModeBlock } from './schema';
import { emptyVoice, VoiceFileSchema, type OfficerLetter, type Piece, type PostChoice, type PostFx, type Said, type VoiceFile, type VoiceState } from './voiceSchema';

export const VOICE: VoiceFile = VoiceFileSchema.parse(voiceRaw);

const W = (k: string): string => (VOICE.words as Record<string, unknown>)[k] as string;
const cap = (n: number): number => Math.max(0, Math.min(10, n));
/** How many Radio items and headlines are kept (the last week). */
const KEEP = 7;

export const voiceOf = (block: EvilModeBlock): VoiceState => block.voice ?? emptyVoice();
const setVoice = (block: EvilModeBlock, v: VoiceState): EvilModeBlock => ({ ...block, voice: v });

/** A flag from the Night (slice 7), read without depending on it: the Night's flags, or a reply's own. */
export function nightFlag(block: EvilModeBlock, id: string): boolean {
  const night = (block as unknown as { night?: { flags?: unknown } }).night;
  return (Array.isArray(night?.flags) && night!.flags.includes(id)) || voiceOf(block).flags.includes(id);
}

const regionId = (block: EvilModeBlock, data: EvilData): string => data.region.regions.find((r) => r.index === block.here.region)?.id ?? 'kanto';
const townOf = (d: { region: number; n: number }, data: EvilData): string => stageRow(d.region, d.n, data)?.town ?? `District ${d.n}`;

// ---- What happened yesterday ----

function countsOf(block: EvilModeBlock): Record<string, number> {
  const ticks = block.neighbour?.ticks ?? [];
  return {
    badges: block.hero?.badges.length ?? 0,
    works: block.economy.running.filter((v) => v.kind === 'work' && v.done).length,
    fronts: block.economy.running.filter((v) => v.kind === 'front').length,
    fired: ticks.filter((t) => t.state === 'fired').length,
    stopped: ticks.filter((t) => t.state === 'stopped').length,
    heists: block.scheme.heists.length,
    digs: block.scheme.digs.length,
  };
}

export function markOf(block: EvilModeBlock): NonNullable<VoiceState['mark']> {
  return { day: block.here.day, heat: block.team.heat, regard: block.team.regard, dread: block.team.dread, log: block.log.length, stance: block.neighbour?.stance ?? null, nb: block.neighbour?.id ?? null, counts: countsOf(block) };
}

/** Yesterday's events, in the Radio's order (Part 25a section 2.2). Each is an id and its fill-ins. */
export function yesterday(block: EvilModeBlock, data: EvilData = EVIL_DATA): { id: string; args: Record<string, string> }[] {
  const m = voiceOf(block).mark;
  if (!m) return [];
  const now = countsOf(block);
  const out: { id: string; args: Record<string, string> }[] = [];
  const nb = block.neighbour;
  const day = block.here.day - 1;
  // 1. The neighbour's clock ticked (or a tick was stopped).
  if (nb && nb.id === m.nb) {
    for (const t of nb.ticks) {
      if (t.state === 'fired' && t.day === day) out.push({ id: `tick:${nb.id}:${t.n}`, args: {} });
    }
    if ((now.stopped ?? 0) > (m.counts.stopped ?? 0)) {
      const t = [...nb.ticks].reverse().find((x) => x.state === 'stopped');
      if (t) out.push({ id: `stopped:${nb.id}:${t.n}`, args: {} });
    }
  }
  // 2. The Hero won a Badge.
  const badge = block.hero?.badges.find((b) => b.day === day);
  if (badge && (now.badges ?? 0) > (m.counts.badges ?? 0)) {
    const n = block.hero!.badges.filter((b) => b.region === badge.region).indexOf(badge);
    const leader = data.gym.leaders.find((l) => l.region === badge.region && l.n === n && l.id !== 'janine');
    if (leader) out.push({ id: `badge:${leader.id}`, args: { town: leader.town, leader: leader.name, count: String(block.hero!.badges.length) } });
  }
  // 3. A job loud enough to hear (Heat +2 or more in a day).
  if (block.team.heat - m.heat >= VOICE.rules.loudHeat) {
    const job = block.log.slice(m.log).find((e) => e.kind === 'job' && e.result === 'went' && e.method);
    const h = job?.to ? block.district?.holdings.find((x) => x.id === job.to) : undefined;
    const what = (now.heists ?? 0) > (m.counts.heists ?? 0) ? 'heist' : job?.method ?? 'other';
    out.push({ id: `loud:${what}`, args: { place: h ? (data.district.locals.find((l) => l.id === h.ref)?.who ?? h.ref) : townOf({ region: block.here.region, n: block.district?.n ?? 1 }, data) } });
  }
  // 4. A Work finished.
  const work = block.economy.running.find((v) => v.kind === 'work' && v.done && v.doneOn === day);
  if (work) out.push({ id: `work:${work.cardId}`, args: { name: cardName(work.cardId, data) } });
  // 5. A Front opened.
  const front = block.economy.running.find((v) => v.kind === 'front' && v.since === day);
  if (front) out.push({ id: `front:${front.cardId}`, args: { name: cardName(front.cardId, data) } });
  // The paper's own: a waiver, a Dig, a stance moved.
  if (block.log.slice(m.log).some((e) => e.kind === 'waive')) out.push({ id: 'waive', args: {} });
  if ((now.digs ?? 0) > (m.counts.digs ?? 0)) out.push({ id: 'dig', args: {} });
  if (nb && nb.id === m.nb && nb.stance !== m.stance) out.push({ id: `stance:${nb.stance}`, args: {} });
  return out;
}

const cardName = (id: string, data: EvilData): string => data.economy.cards.find((c) => c.id === id)?.name ?? id;

// ---- The Radio (Part 25a section 2) ----

/** What the Radio calls the team (Part 25a section 2.5). */
export function radioName(block: EvilModeBlock): string {
  const { regard: r, dread: d } = block.team;
  const N = VOICE.radio.names;
  const team = block.team.name;
  if (r >= 7 && d >= 7) return fill(N.bothHigh, { team });
  if (r >= 7) return fill(N.regardHigh, { team, spelled: team.toUpperCase().split('').filter((ch) => ch !== ' ').join('-') });
  if (d >= 7) return fill(N.dreadHigh, { team });
  if (r >= 3 && d >= 3) return N.both;
  if (r >= 3) return N.regard;
  if (d >= 3) return N.dread;
  return N.unknown;
}

/** The Radio's one item for this Morning: the first rule that applies. Never a guess: everything on it happened. */
export function pickRadio(block: EvilModeBlock, data: EvilData = EVIL_DATA): { id: string; args: Record<string, string> } {
  const v = voiceOf(block);
  const ev = yesterday(block, data);
  const first = (p: string) => ev.find((e) => e.id.startsWith(p));
  const tick = first('tick:') ?? first('stopped:');
  if (tick) return tick;
  const badge = first('badge:');
  if (badge) return badge;
  const loud = first('loud:');
  if (loud) return { id: loud.id, args: { ...loud.args, who: Math.max(block.team.regard, block.team.dread) >= VOICE.rules.paperKnows ? radioName(block) : VOICE.radio.names.unknown } };
  const work = first('work:');
  if (work) return work;
  const front = first('front:');
  if (front) return front;
  if (block.team.heat >= VOICE.rules.radioHeat) return { id: `heat:${block.here.day % VOICE.radio.heatGuess.length}`, args: { n: String(inRoster(block).length + 1), wrong: block.team.name.charAt(0) === 'Z' ? 'A' : String.fromCharCode(block.team.name.charCodeAt(0) + 1) } };
  // 7. A request (once each a region): the Late Shift for a Boss they've clubbed together for; Mum, for the Hero; G.
  const R = runIndex(block);
  const once = (k: string) => !v.sent.includes(`request:${k}:${R}`);
  if (teamLoyalty(block, data) >= 9 && once('4')) return { id: 'request:4', args: {} };
  if (block.hero && block.here.stage >= 4 && once('3')) return { id: 'request:3', args: { hero: block.hero.name } };
  if (block.neighbour?.id === 'giovanni' && VOICE.rules.basketStances.includes(block.neighbour.stance) && once('2')) return { id: 'request:2', args: {} };
  if (block.economy.running.some((x) => x.kind === 'work' && x.done && x.region === block.here.region) && once('1')) return { id: 'request:1', args: {} };
  if (nightFlag(block, 'birthdays') && once('0')) {
    const who = inRoster(block)[block.here.day % Math.max(1, inRoster(block).length)];
    if (who) return { id: 'request:0', args: { name: who.name, song: VOICE.radio.songs[block.here.day % VOICE.radio.songs.length]! } };
  }
  return { id: `quiet:${block.here.day % VOICE.radio.quiet.length}`, args: {} };
}

/** The sentence for a Radio item (the presenter's way in, then the item). */
export function radioText(s: Pick<Said, 'id' | 'args'>, block: EvilModeBlock, data: EvilData = EVIL_DATA): string {
  const P = VOICE.radio.presenters[regionId(block, data)] ?? VOICE.radio.presenters.kanto!;
  const [k, a, b] = s.id.split(':');
  const R = VOICE.radio;
  let body: string;
  if (k === 'tick') body = R.ticks[a!]?.[Number(b) - 1] ?? '';
  else if (k === 'stopped') body = R.stopped[a!]?.[Number(b) - 1] ?? '';
  else if (k === 'badge') body = fill(R.badge, { ...s.args, badge: R.leaders[a!]?.badge ?? 'Badge', quote: R.leaders[a!]?.quote ?? '' });
  else if (k === 'loud') body = fill(R.loud, { ...s.args, what: R.loudWhat[a!] ?? R.loudWhat.other! });
  else if (k === 'work') body = fill(R.work, s.args);
  else if (k === 'front') body = fill(R.front, s.args);
  else if (k === 'heat') body = fill(R.heat, { guess: fill(R.heatGuess[Number(a)] ?? R.heatGuess[0]!, s.args) });
  else if (k === 'request') {
    const q = R.requests[Number(a)]!;
    body = Number(a) === 0 ? fill(R.birthday, s.args) : fill(R.requestLine, { from: q.from, for: fill(q.for, s.args), what: q.what });
  } else body = R.quiet[Number(a)] ?? R.quiet[0]!;
  return `${P.says} ${body}`.trim();
}

// ---- The paper (Part 25a section 3) ----

const band = (n: number): 'low' | 'mid' | 'high' | 'top' => (n >= 10 ? 'top' : n >= 7 ? 'high' : n >= 4 ? 'mid' : 'low');

/** The day's headline. Below standing 5 the paper doesn't know who the team is and prints a guess. It moves nothing. */
export function pickPaper(block: EvilModeBlock, data: EvilData = EVIL_DATA): { id: string; args: Record<string, string> } {
  const v = voiceOf(block);
  const ev = yesterday(block, data);
  const has = (p: string) => ev.find((e) => e.id.startsWith(p));
  const R = runIndex(block);
  // Knock 2 answered "Tell her nothing": the region's first headline is a guess whatever the standing.
  if (nightFlag(block, 'headlineGuess') && !v.sent.includes(`ferry:${R}`)) return { id: 'ferry', args: {} };
  const badge = has('badge:');
  if (badge && (badge.args.count === '1' || badge.args.count === '3')) return { id: badge.args.count === '1' ? 'hero:first' : 'hero:third', args: {} };
  if (has('stopped:')) return { id: 'hero:tick', args: {} };
  const st = has('stance:');
  const stance = st?.id.split(':')[1];
  if (stance && stance in VOICE.paper.neighbour) return { id: `nb:${stance}`, args: { them: (block.neighbour ? data.neighbour.neighbours.find((n) => n.id === block.neighbour!.id)?.teamName ?? 'THEM' : 'THEM').toUpperCase() } };
  const { regard: r, dread: d } = block.team;
  const K = VOICE.rules.paperKnows;
  if (r < K && d < K) {
    const g = has('waive') ? 'waive' : has('work:') ? 'work' : has('loud:heist') ? 'heist' : has('front:') ? 'front' : has('dig') ? 'dig' : block.base?.rooms.some((x) => x.type === 'pen') && block.here.day % 5 === 0 ? 'pen' : 'nothing';
    return { id: `guess:${g}`, args: {} };
  }
  if (r >= VOICE.rules.bothAt && d >= VOICE.rules.bothAt) return { id: nightFlag(block, 'interview') ? 'both' : 'bothNo', args: {} };
  const side = r >= d ? 'regard' : 'dread';
  const lines = VOICE.paper[side][band(Math.max(r, d))];
  return { id: `${side}:${band(Math.max(r, d))}:${block.here.day % lines.length}`, args: {} };
}

export function paperText(s: Pick<Said, 'id' | 'args'>): string {
  const P = VOICE.paper;
  const [k, a, b] = s.id.split(':');
  if (k === 'ferry') return P.ferry;
  if (k === 'hero') return P.hero[a as keyof typeof P.hero];
  if (k === 'nb') return fill(P.neighbour[a as keyof typeof P.neighbour], s.args);
  if (k === 'guess') return P.guesses[a as keyof typeof P.guesses];
  if (k === 'both') return P.both;
  if (k === 'bothNo') return P.bothNoInterview;
  if (k === 'coldly') return P.letGoColdly;
  return P[k as 'regard' | 'dread'][a as 'low']![Number(b)] ?? '';
}

/** Whether a headline names the team (it never does below standing 5). */
export const paperNames = (block: EvilModeBlock): boolean => Math.max(block.team.regard, block.team.dread) >= VOICE.rules.paperKnows;

// ---- The post (Part 25b) ----

const fromWord = (k: string, args: Record<string, string>): string => fill(W(k), args);

/** A piece to send: queued now, due on `due` (a day late and opened at Heat 7 or more). */
function queue(block: EvilModeBlock, what: string, who: string | null, args: Record<string, string>, onceKey: string): EvilModeBlock {
  const v = voiceOf(block);
  if (v.sent.includes(onceKey)) return block;
  const steamed = block.team.heat >= VOICE.rules.steamHeat;
  const p: Piece = { id: `P${v.inbox.reduce((n, x) => Math.max(n, Number(x.id.slice(1)) || 0), 0) + 1}`, what, who, args, made: block.here.day, due: block.here.day + (steamed ? VOICE.rules.steamDelay : 0), day: null, opened: false, steamed, pinned: false, answer: null, left: false };
  return setVoice(block, { ...v, inbox: [...v.inbox, p], sent: [...v.sent, onceKey] });
}

/** The letter an Officer away writes this district (Part 25b section 2), or null. */
export function officerLetter(block: EvilModeBlock, c: Crew, sinceStage: number): OfficerLetter | null {
  const v = voiceOf(block);
  const used = (n: number) => v.sent.includes(`officer:${c.id}:${n}`) || v.sent.includes(`officer:any:${n}`);
  const L = (n: number) => VOICE.officer.find((x) => x.n === n)!;
  const ok = (x: OfficerLetter) => x.status !== 'disabled' && !used(x.n);
  if (stageKind(block.here.stage) === 'reckoning' && ok(L(40))) return L(40);
  if (c.flaw && c.flawFound) {
    const f = VOICE.officer.find((x) => x.flaw === c.flaw);
    if (f && ok(f)) return f;
  }
  if (c.loyalty >= VOICE.rules.comeBackLoyalty && block.here.stage - sinceStage >= VOICE.rules.comeBackDistricts && ok(L(39))) return L(39);
  if (block.here.stage === 7 && ok(L(37))) return L(37);
  if (!c.talent) return null;
  const mine = VOICE.officer.filter((x) => x.talent === c.talent);
  const trouble = mine.find((x) => x.kind === 'trouble')!;
  if (block.team.heat >= 5 && ok(trouble)) return trouble;
  for (const kind of ['quiet', 'fourth', 'third', 'trouble'] as const) {
    const x = mine.find((y) => y.kind === kind)!;
    if (x.straight && !block.economy.running.some((f) => f.kind === 'front' && f.backRoom !== true)) continue;
    if (ok(x)) return x;
  }
  return null;
}

/** Whether someone left the run in a way that writes, and the letter's key (Part 25b section 5). */
function leaverKey(c: Crew): string | null {
  const how = c.left?.how;
  if (!how) return null;
  if (how === 'letGo') return c.left!.kindly ? 'letGoKindly' : null;
  if (how === 'line' || how === 'lineMoved' || how === 'hero' || how === 'stayed') return how;
  return null;
}

/**
 * What the Morning sends (Part 25b): every letter now owed is queued once; then at most one reaches the Board, the
 * oldest first. Read from the block; no gameplay roll.
 */
export function postMorning(block0: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  let b = block0;
  if (!b.district || b.ending) return b;
  const dist = b.district;
  const R = runIndex(b);
  const reg = b.here.region;
  const st = b.here.stage;
  const di = dayIn(b);
  const key = `${R}:${st}`;
  // Officers away, holding a district behind (one a district each, from the second day).
  if (di >= 2) {
    for (const p of b.region.past) {
      const c = b.crew.find((x) => x.id === p.leftWith && x.where === 'away' && !x.cell);
      if (!c || voiceOf(b).sent.includes(`officerAt:${c.id}:${key}`)) continue;
      const l = officerLetter(b, c, p.district.n + 1);
      if (!l) continue;
      b = queue(b, `officer:${l.n}`, c.id, { name: c.name, town: townOf(p.district, data) }, `officerAt:${c.id}:${key}`);
      const v = voiceOf(b);
      b = setVoice(b, { ...v, sent: [...v.sent, l.any ? `officer:any:${l.n}` : `officer:${c.id}:${l.n}`] });
    }
  }
  // The garrison: people away across the water (an earlier region), one letter a district.
  const home = new Set(b.region.past.map((p) => p.leftWith));
  const garrison = b.crew.filter((c) => c.where === 'away' && !c.cell && !home.has(c.id));
  if (garrison.length && di >= 3) {
    const done = voiceOf(b).sent.filter((s) => s.startsWith('garrison:')).length;
    const pen = !!b.base?.rooms.some((x) => x.type === 'pen');
    const g = VOICE.garrison.filter((x) => !x.needs || pen)[done % VOICE.garrison.filter((x) => !x.needs || pen).length];
    if (g) b = queue(b, `garrison:${g.id}`, garrison[0]!.id, { town: 'across the water' }, `garrison:${key}`);
  }
  // The cells: whoever was left writes once a district (never anyone bailed: they've no cell).
  for (const c of b.crew.filter((x) => x.cell)) {
    if (di < 2) continue;
    const n = voiceOf(b).sent.filter((s) => s.startsWith(`cell:${c.id}:`)).length;
    const pool = c.cell!.how === 'aside' ? 'aside' : c.cell!.how === 'slow' ? 'slow' : 'holds';
    const list = VOICE.cells[pool];
    const what = n < list.length ? `cell:${pool}:${n}` : c.flaw && n === list.length ? `cell:flaw:${c.flaw}` : null;
    if (what) b = queue(b, what, c.id, { name: c.name }, `cell:${c.id}:${key}`);
  }
  // People who left: one letter, a district after they went.
  for (const c of b.crew.filter((x) => x.where === 'left' && x.left)) {
    const k = leaverKey(c);
    if (!k || (dist.from ?? 1) <= c.left!.day) continue;
    b = queue(b, `leaver:${k}`, c.id, { name: c.name }, `leaver:${c.id}`);
  }
  // Let go coldly: no letter to the Boss. A letter in the paper, unsigned (once each).
  // Mothers, aunts and daughters, unprompted, one a region (Part 25b section 6).
  if (di === 2) {
    const m = VOICE.mothers.unprompted.find((x) => b.crew.some((c) => c.ref === x.id && c.where === 'in') && !voiceOf(b).sent.includes(`mother:${x.id}`));
    const c = m && b.crew.find((x) => x.ref === m.id);
    if (m && c && !voiceOf(b).sent.includes(`mothers:${R}`)) {
      b = queue(b, `mother:${m.id}`, c.id, { name: c.name, from: m.from }, `mother:${m.id}`);
      const v = voiceOf(b);
      b = setVoice(b, { ...v, sent: [...v.sent, `mothers:${R}`] });
    }
  }
  // The town: one a district, from a held holding's mood (a Shut holding sends nothing). The empty envelope, once a run.
  if (di === 3 && stageKind(st) === 'district') {
    if (b.team.dread >= VOICE.rules.emptyDread && dist.holdings.some((h) => h.owner === 'team' && h.mood === 'shut')) b = queue(b, 'town:empty', null, { town: townOf(dist, data) }, 'empty');
    else {
      const h = dist.holdings.find((x) => x.owner === 'team' && x.mood && x.mood !== 'shut' && x.kind === 'local');
      if (h) b = queue(b, `town:${h.mood}`, null, { town: townOf(dist, data) }, `town:${key}`);
    }
  }
  // A child, when a Day-Care's among the Fronts. Erika, Befriended. The detective, a whole region under Heat 3.
  if (b.economy.running.some((x) => x.kind === 'front' && x.cardId === 'daycare') && di >= 2) b = queue(b, 'town:child', null, {}, 'child');
  if (b.gyms.some((g) => g.leaderId === 'erika' && g.way === 'befriend')) b = queue(b, 'town:erika', null, { name: 'Erika' }, 'erika');
  if (stageKind(st) === 'reckoning' && di === 1 && voiceOf(b).hotMax < VOICE.rules.detectiveHeat) b = queue(b, 'town:detective', null, {}, `detective:${R}`);
  // Giovanni's fruit basket: one a region at Truce or better, for as long as the run goes on; none at War; after a War, a big one.
  const gs = voiceOf(b).giovanni;
  if (st >= 2 && gs && R < VOICE.baskets.cards.length) {
    if (VOICE.rules.basketStances.includes(gs)) b = queue(b, voiceOf(b).war ? 'basket:big' : `basket:${R}`, null, {}, `basket:${R}`);
  }
  // The other neighbours' unasked cards, once each (Hoenn's two today; the rest wait on their regions).
  const nb = b.neighbour;
  const other = nb ? VOICE.baskets.others[nb.id] : undefined;
  if (nb && other?.live && st >= 3 && nb.opinion >= 0) b = queue(b, `card:${nb.id}`, null, {}, `card:${nb.id}`);
  // A Grunt on leave sends a postcard, once a run (Loyalty 8 or more).
  if (st >= 5 && di === 2) {
    const c = inRoster(b).find((x) => x.loyalty >= VOICE.rules.postcardLoyalty);
    if (c) b = queue(b, 'postcard:leave', c.id, { name: c.name }, 'postcard:leave');
  }
  // One a day: the oldest that's due.
  const v = voiceOf(b);
  if (v.inbox.some((p) => p.day === b.here.day)) return b;
  const next = v.inbox.find((p) => p.day === null && p.due <= b.here.day);
  if (!next) return b;
  return setVoice(b, { ...v, inbox: v.inbox.map((p) => (p === next ? { ...p, day: b.here.day } : p)) });
}

/** The sentence a piece holds. */
export function pieceText(p: Pick<Piece, 'what' | 'args'>): string {
  const [k, a, b] = p.what.split(':');
  const V = VOICE;
  switch (k) {
    case 'officer': return V.officer.find((x) => x.n === Number(a))!.text;
    case 'garrison': return V.garrison.find((x) => x.id === a)!.text;
    case 'cell': return a === 'flaw' ? V.cells.flaw[b as keyof typeof V.cells.flaw] : V.cells[a as 'holds'][Number(b)]!;
    case 'leaver': return (V.leavers as Record<string, unknown>)[a!] as string;
    case 'mother': return V.mothers.unprompted.find((x) => x.id === a)!.text;
    case 'town': return a === 'empty' ? V.town.empty : V.town[a as 'warm'];
    case 'basket': return a === 'big' ? V.baskets.big : fill(V.baskets.basket, { card: V.baskets.cards[Number(a)]! });
    case 'card': return V.baskets.others[a!]!.text;
    case 'postcard': return (V.postcards as Record<string, unknown>)[a!] as string;
    default: return '';
  }
}

/** Who it's from, as the envelope says. */
export function pieceFrom(p: Pick<Piece, 'what' | 'args'>): string {
  const [k, a] = p.what.split(':');
  const args = p.args;
  switch (k) {
    case 'officer': return fromWord('fromOfficer', args);
    case 'garrison': return fromWord('fromGarrison', args);
    case 'cell': return fromWord('fromCell', args);
    case 'leaver': return fromWord('fromLeaver', args);
    case 'mother': return fromWord(args.from ?? 'fromMother', args);
    case 'town': return a === 'empty' ? W('fromNobody') : a === 'child' ? W('fromChild') : a === 'erika' ? fromWord('fromLeader', args) : a === 'detective' ? W('fromDetective') : fromWord('fromTown', args);
    case 'basket': return fromWord('fromNeighbour', { name: 'Giovanni' });
    case 'card': return fromWord('fromNeighbour', { name: EVIL_DATA.neighbour.neighbours.find((n) => n.id === a)?.boss ?? a! });
    case 'postcard': return W('fromPostcard');
    default: return '';
  }
}

/** The three answers a piece takes, or none. */
export function pieceChoices(p: Pick<Piece, 'what'>): PostChoice[] {
  const [k, a, b] = p.what.split(':');
  if (k === 'officer') return VOICE.officer.find((x) => x.n === Number(a))?.choices ?? [];
  if (k === 'garrison') return VOICE.garrison.find((x) => x.id === a)?.choices ?? [];
  if (k === 'cell' && a === 'flaw' && b === 'kind') return VOICE.cells.kindChoices;
  return [];
}

/** Today's piece, if one reached the Board this Morning. */
export const todaysPost = (block: EvilModeBlock): Piece | null => voiceOf(block).inbox.find((p) => p.day === block.here.day) ?? null;

export type PostAct = { what: 'open' | 'leave' | 'pin' } | { what: 'answer'; i: number };

/** Opening, leaving, pinning or answering a piece. Nothing moves by more than one; a piece is answered once. */
export function postAct(block: EvilModeBlock, id: string, act: PostAct, data: EvilData = EVIL_DATA): { block: EvilModeBlock; problem: string | null; lines: string[] } {
  const no = (problem: string) => ({ block, problem, lines: [] as string[] });
  const v = voiceOf(block);
  const p = v.inbox.find((x) => x.id === id);
  if (!p || p.day === null) return no('There is no such letter.');
  const put = (q: Piece, extra: Partial<VoiceState> = {}) => setVoice(block, { ...v, ...extra, inbox: v.inbox.map((x) => (x.id === id ? q : x)) });
  if (act.what === 'leave') return { block: put(p), problem: null, lines: [W('left')] };
  if (act.what === 'open') return { block: put({ ...p, opened: true }), problem: null, lines: [pieceText(p)] };
  if (act.what === 'pin') {
    if (!p.opened) return no('Open it first.');
    return { block: put({ ...p, pinned: true }), problem: null, lines: [W('pinned')] };
  }
  if (act.what !== 'answer') return no('Unknown.');
  const ch = pieceChoices(p);
  if (!p.opened) return no('Open it first.');
  if (!ch.length) return no('There is nothing to answer.');
  if (p.answer !== null) return no('It has been answered.');
  const c = ch[act.i];
  if (!c) return no('There is no such answer.');
  let out = put({ ...p, answer: act.i });
  const r = applyFx(out, c.fx, p.who, data);
  out = appendLog(r.block, { kind: 'post', who: p.who ? [p.who] : [], text: `Day ${block.here.day}. ${pieceFrom(p)}: “${c.say}”${c.fx.taken ? ' (On instruction.)' : ''}`, ...(c.fx.given ? { given: 1 } : {}), ...(c.fx.taken ? { taken: 1 } : {}) });
  return { block: out, problem: null, lines: [c.reply, ...r.lines] };
}

/** A reply's effects. Each number moves by one at most (money aside). */
export function applyFx(block: EvilModeBlock, fx: PostFx, who: string | null, data: EvilData = EVIL_DATA): { block: EvilModeBlock; lines: string[] } {
  const F = (VOICE.words.fx as Record<string, string>);
  const sign = (n: number) => (n > 0 ? `+${n}` : `−${-n}`);
  let b = block;
  const lines: string[] = [];
  const c = who ? b.crew.find((x) => x.id === who) : undefined;
  if (fx.loyalty && c) { b = { ...b, crew: b.crew.map((x) => (x.id === c.id ? moveLoyalty(x, fx.loyalty!, data) : x)) }; lines.push(fill(F.loyalty!, { name: c.name, by: sign(fx.loyalty) })); }
  if (fx.teamLoyalty) { b = { ...b, crew: b.crew.map((x) => (x.where === 'in' ? moveLoyalty(x, fx.teamLoyalty!, data) : x)) }; lines.push(fill(F.teamLoyalty!, { by: sign(fx.teamLoyalty) })); }
  const team = { ...b.team };
  for (const k of ['heat', 'regard', 'dread'] as const) {
    if (fx[k]) { team[k] = cap(team[k] + fx[k]!); lines.push(fill(F[k]!, { by: sign(fx[k]!) })); }
  }
  if (fx.funds) { team.funds = Math.max(0, team.funds + fx.funds); lines.push(fill(F.funds!, { money: `${fx.funds > 0 ? '+' : '−'}${money(Math.abs(fx.funds))}` })); }
  b = { ...b, team };
  if (fx.given) lines.push(F.given!);
  if (fx.opinion && b.neighbour) {
    b = { ...b, neighbour: { ...b.neighbour, opinion: Math.max(-3, Math.min(3, b.neighbour.opinion + fx.opinion)) } };
    lines.push(fill(F.opinion!, { boss: data.neighbour.neighbours.find((n) => n.id === b.neighbour!.id)?.boss ?? '', by: sign(fx.opinion) }));
  }
  if (fx.flag) { const v = voiceOf(b); b = setVoice(b, { ...v, flags: v.flags.includes(fx.flag) ? v.flags : [...v.flags, fx.flag] }); }
  if (fx.recall && c && c.where === 'away' && !c.cell) {
    b = { ...b, crew: b.crew.map((x) => (x.id === c.id ? { ...x, where: 'in' as const } : x)), region: { ...b.region, past: b.region.past.map((p) => (p.leftWith === c.id ? { ...p, leftWith: null } : p)) } };
    lines.push(fill(F.recall!, { name: c.name }));
  }
  return { block: b, lines };
}

// ---- The Morning ----

/**
 * Called once each time a new day's Morning is reached: the Radio's item and the paper's headline (kept, the last week),
 * the post, the marks for tomorrow. Hortense switches the set back on. The block's numbers never move here.
 */
export function voiceMorning(block0: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  if (!VOICE.on || !block0.district || block0.ending) return block0;
  let b = block0;
  let v = voiceOf(b);
  if (v.mark?.day === b.here.day) return b;
  // Giovanni's stance, carried across the water; a War remembered till the next Truce.
  if (b.neighbour?.id === 'giovanni') v = { ...v, giovanni: b.neighbour.stance, war: b.neighbour.stance === 'war' ? true : v.war };
  const R = runIndex(b);
  const firstOfRegion = !v.sent.includes(`region:${R}`);
  v = { ...v, hotMax: firstOfRegion ? b.team.heat : Math.max(v.hotMax, b.team.heat), sent: firstOfRegion ? [...v.sent, `region:${R}`] : v.sent };
  b = setVoice(b, v);
  if (v.mark) {
    const radio = pickRadio(b, data);
    const paper = pickPaper(b, data);
    const sent = [...v.sent];
    if (radio.id.startsWith('request:')) sent.push(`${radio.id}:${R}`);
    if (paper.id === 'ferry') sent.push(`ferry:${R}`);
    v = { ...v, radio: [...v.radio, { day: b.here.day, ...radio }].slice(-KEEP), paper: [...v.paper, { day: b.here.day, ...paper }].slice(-KEEP), sent };
    // Hortense switches the set back on (Part 25a section 2.1).
    if (v.radioOff && b.crew.some((c) => c.ref === 'hortense' && c.where === 'in')) v = { ...v, radioOff: false, flags: [...v.flags.filter((f) => f !== 'hortenseRadio'), 'hortenseRadio'] };
    b = setVoice(b, v);
  }
  // A held district's letter left unopened through the district counts as "left to them".
  v = voiceOf(b);
  if (dayIn(b) === 1) b = setVoice(b, { ...v, inbox: v.inbox.map((p) => (p.day !== null && !p.opened && p.day < b.here.day ? { ...p, left: true } : p)) });
  // Let go coldly: a letter in the paper, unsigned, the next Morning (once each).
  for (const c of b.crew.filter((x) => x.left?.how === 'letGo' && !x.left.kindly && !voiceOf(b).sent.includes(`coldly:${x.id}`))) {
    const w = voiceOf(b);
    b = setVoice(b, { ...w, paper: [...w.paper, { day: b.here.day, id: 'coldly', args: {} }].slice(-KEEP), sent: [...w.sent, `coldly:${c.id}`] });
  }
  b = postMorning(b, data);
  // The drawer keeps the last dozen letters (and any on the Wall); older ones are in the Log, so the save stays small. The
  // newest piece is always kept, so the next id is still one more than the highest.
  const w = voiceOf(b);
  const got = w.inbox.filter((x) => x.day !== null && !x.pinned);
  const drop = new Set(got.slice(0, Math.max(0, got.length - VOICE.rules.drawer)).map((x) => x.id));
  return setVoice(b, { ...w, inbox: drop.size ? w.inbox.filter((x) => !drop.has(x.id)) : w.inbox, mark: markOf(b) });
}

/** The set switched off or on (a Night action; off once a run). Loyalty's unchanged. */
export function setRadio(block: EvilModeBlock, on: boolean): { block: EvilModeBlock; problem: string | null; lines: string[] } {
  const v = voiceOf(block);
  if (!on && v.radioWasOff) return { block, problem: 'Nobody switches it off twice.', lines: [] };
  if (on === !v.radioOff) return { block, problem: null, lines: [] };
  return { block: setVoice(block, { ...v, radioOff: !on, radioWasOff: v.radioWasOff || !on }), problem: null, lines: [on ? W('radioOn') : W('radioOff')] };
}

/** Today's Radio item and headline, as sentences (or null before the first Morning has one). */
export function todaysRadio(block: EvilModeBlock, data: EvilData = EVIL_DATA): string | null {
  const s = voiceOf(block).radio.find((x) => x.day === block.here.day);
  return s ? radioText(s, block, data) : null;
}
export function todaysPaper(block: EvilModeBlock): string | null {
  const s = [...voiceOf(block).paper].reverse().find((x) => x.day === block.here.day);
  return s ? paperText(s) : null;
}

/** What the Hero heard at the Centre today: the same item (Part 25a section 2.1). The set's being off doesn't stop it. */
export function heroHeard(block: EvilModeBlock, data: EvilData = EVIL_DATA): string | null {
  const t = todaysRadio(block, data);
  return t ? fill(W('heroHeard'), { item: t }) : null;
}

// ---- The Ledger's margin (Part 25a section 5.4) ----

/** A Books at Loyalty 6 or more writes in the margin, once a district. Read only. */
export function margin(block: EvilModeBlock): { who: string; text: string } | null {
  const books = inRoster(block).filter((c) => c.talent === 'books' && c.loyalty >= VOICE.rules.marginLoyalty);
  if (!books.length || !block.district) return null;
  const d = block.district;
  const here = block.log.filter((e) => e.region === d.region && e.district === d.n);
  const leans = here.filter((e) => e.method === 'lean' && e.kind === 'job' && e.result === 'went').length;
  const taken = here.reduce((n, e) => n + (e.taken ?? 0), 0);
  const M = VOICE.margins;
  const by = (ref: string) => books.find((c) => c.ref === ref);
  if (by('ngozi') && leans >= 4) return { who: by('ngozi')!.name, text: M.ngozi };
  if (by('obadiah') && taken >= 3) return { who: by('obadiah')!.name, text: M.obadiah };
  if (by('priya') && here.some((e) => e.day < block.here.day - 1 && e.kind === 'card')) return { who: by('priya')!.name, text: M.priya };
  const c = books[0]!;
  return { who: c.name, text: taken === 0 ? M.any : fill(M.anyBusy, { n: here.length }) };
}

// ---- Barks (Part 25a section 1) ----

export type BarkMoment = 'board' | 'dispatchGo' | 'dispatchStay' | 'jobWon' | 'jobLost' | 'mess' | 'door' | 'heroNear' | 'raidNear' | 'crossing';

const bandOf = (l: number): 'leaving' | 'distant' | 'steady' | 'easy' | 'devoted' => [...VOICE.barks.bands].reverse().find((b) => l >= b.min)!.id;

/** Every line a person might bark at a moment, most specific first (named, flaw, talent, mood, Loyalty band). */
export function barkPool(block: EvilModeBlock, c: Crew, moment: BarkMoment, ctx: { method?: string } = {}): string[] {
  const B = VOICE.barks;
  const mood = (c as Crew & { mood?: string }).mood;
  if (mood === 'shut') return [];
  const out: string[] = [];
  if (c.ref && B.named[c.ref]) out.push(...B.named[c.ref]!);
  const lb = B.loyalty[bandOf(c.loyalty)];
  switch (moment) {
    case 'board':
      if (dayIn(block) === 1) out.push(B.creed[block.team.creed] ?? '');
      out.push(lb.board);
      break;
    case 'dispatchGo':
      if (c.flaw && !c.flawFound) out.push(B.flaw[c.flaw]!.dispatchGo);
      out.push(B.doctrine[block.team.doctrine] ?? '', lb.dispatchGo);
      break;
    case 'dispatchStay':
    case 'mess':
      if (c.flaw && !c.flawFound && moment === 'mess') out.push(B.flaw[c.flaw]!.mess);
      if (mood) out.push(...(B.mood[mood as 'warm'] ?? []));
      out.push(moment === 'mess' ? lb.mess : lb.board);
      break;
    case 'jobWon': {
      const line = ctx.method && (B.line as Record<string, Record<string, string>>)[ctx.method]?.[block.team.line];
      if (line) out.push(line);
      if (c.talent) out.push(B.talent[c.talent]!);
      out.push(lb.jobWon);
      break;
    }
    case 'jobLost': out.push(lb.jobLost); break;
    case 'door': if (c.flaw) out.push(B.flaw[c.flaw]!.door); out.push(lb.door); break;
    case 'heroNear': {
      const h = block.hero;
      if (h) out.push(B.hero[(['curious', 'uneasy', 'set', 'angry', 'past'] as const)[Math.max(0, Math.min(4, h.temper))]!]);
      break;
    }
    case 'raidNear': out.push(...(B.raid[String(Math.min(10, block.team.heat))] ?? [])); break;
    case 'crossing':
      if (c.ref === 'obadiah' || c.ref === 'beatriz' || c.ref === 'hortense') out.push(B.crossing[c.ref]);
      out.push(c.loyalty >= 7 ? B.crossing.glad : B.crossing.notGlad);
      break;
  }
  return out.filter((x) => x && !x.startsWith('(Nothing'));
}

/**
 * One bark for a moment, or null. Presentation only: picked by a hash of the seed, day, beat and moment (never a gameplay
 * stream), never during a fire, the last room or a knock, and never a line already said in this district (`said`, kept
 * by the screen, not the save).
 */
export function bark(block: EvilModeBlock, moment: BarkMoment, said: ReadonlySet<string> = new Set(), ctx: { method?: string; who?: string[] } = {}): { who: string; name: string; line: string } | null {
  if (!VOICE.on || block.fire || (block.reck?.room && !block.reck.room.outcome) || (block as unknown as { night?: { knock?: unknown } }).night?.knock) return null;
  if (moment === 'raidNear' && block.team.heat < 8) return null;
  const people = inRoster(block).filter((c) => !ctx.who || ctx.who.includes(c.id));
  if (!people.length) return null;
  const h = hashSeed(`${block.district?.seed ?? ''}|bark|${block.here.day}|${block.here.beat}|${moment}`);
  const start = (h.a >>> 0) % people.length;
  for (let i = 0; i < people.length; i++) {
    const c = people[(start + i) % people.length]!;
    const pool = barkPool(block, c, moment, ctx).filter((l) => !said.has(l));
    if (pool.length) return { who: c.id, name: c.name, line: pool[(h.b >>> 0) % pool.length]! };
  }
  return null;
}

// ---- The endings' paper and notebook (Part 25a section 3.6, Part 25b section 10) ----

/** The front page an ending makes (Part 25a section 3.6). */
export function endingFront(block: EvilModeBlock): string | null {
  const e = block.ending;
  if (!e) return null;
  const P = VOICE.paper.endings;
  if (e.id === 'scheme' && block.team.creed === 'cause') return P.schemeCause;
  return P[e.id as keyof typeof P] ?? null;
}

/** The last line of the detective's notebook, by detective and by whether the team was caught; never blank. */
export function notebookLine(block: EvilModeBlock, data: EvilData = EVIL_DATA): { name: string; line: string } {
  const N = VOICE.notebook as Record<string, unknown> & { straight: string };
  const d = (N[regionId(block, data)] ?? N.kanto) as { name: string; free: string; caught: string };
  if (block.ending?.id === 'straight') return { name: d.name, line: N.straight };
  return { name: d.name, line: block.ending?.id === 'caught' ? d.caught : d.free };
}

// DOMINION slice D25: chatter, news, Hero and betrayal lines (Claude API draft §5.2; mockup a10 "Chatter, news and the
// Hero"). Extra beats around the authored text, never in place of it:
// - Crew chatter: up to three members talk in the Evening, from their personality card (D19) and the run's memory.
// - The weekly Ledger news: a World Turn end step keeps this week's police, rival, Hero and Legendary report lines and,
//   on every 7th morning, prints the paper from them (the actions themselves stay rule-based).
// - The Hero's call (taunt by stage, a hint of the hidden Disillusion) and a traitor's parting line.
// Every line here is written offline (voices.json). Rotom may add its own voice on top: `rotomAsks` builds the calls
// (the scene sends them with askClaude) and the models read answers already stored in `run.ai`.
// Text picks use their own keys (`dominion-chatter`, `dominion-news`, `dominion-voice`) on fresh Rngs: they never read or
// move a gameplay stream, and the same state always shows the same lines. Pure: no Phaser, no network.

import { z } from 'zod';
import raw from '../../data/dominion/voices.json';
import { storedAnswer } from '../ai/rules';
import type { AiLog } from '../ai/schema';
import { hashSeed, Rng } from '../rng';
import { DOMINION_DATA } from './data';
import { heroAt, heroDefOf, stageIndex } from './hero';
import { cardFor, cardPrompt, sheet, voice } from './personality';
import { teamsHere } from './rivals';
import { NEWS_KINDS, type DominionBlock, type Member, type NewsKind, type Paper, type VoicesState } from './schema';
import { addWorldEnd, fill, type WorldStepId } from './worldTurn';

// ---------- data ----------

const Lines = z.array(z.string().min(1)).min(1);
const TOPICS = ['quiet', 'win', 'loss', 'gone', 'hero', 'heat'] as const;
export type Topic = (typeof TOPICS)[number] | 'memory';
const TRAITOR_WHYS = ['quit', 'stole', 'stripped', 'poached'] as const;
const STAGES = ['ignores', 'foils', 'attacks', 'raids', 'allies'] as const;

export const VoicesFileSchema = z.object({
  _source: z.string(),
  chatter: z.object({
    max: z.number().int().min(1).max(3),
    goneDays: z.number().int().min(1),
    heatAt: z.number().int().min(0).max(100),
    topics: z.record(z.string(), z.object(Object.fromEntries(TOPICS.map((t) => [t, Lines])) as Record<(typeof TOPICS)[number], typeof Lines>).strict()),
    reply: z.record(z.string(), Lines),
    aside: z.record(z.string(), z.string().min(1)),
    memory: Lines,
  }).strict(),
  news: z.object({
    masthead: z.string(), price: z.string(), keep: z.number().int().min(1), lines: z.number().int().min(1).max(3),
    order: z.array(z.enum(NEWS_KINDS)).length(NEWS_KINDS.length),
    heads: z.object({ ...Object.fromEntries(NEWS_KINDS.map((k) => [k, Lines])), quiet: Lines } as Record<NewsKind | 'quiet', typeof Lines>).strict(),
    gone: z.record(z.enum(TRAITOR_WHYS), z.string()),
    quietBody: z.string(), photo: z.string(), photoUnknown: z.string(), empty: z.string(), out: z.string(),
  }).strict(),
  hero: z.object({
    taunt: z.object(Object.fromEntries(STAGES.map((s) => [s, Lines])) as Record<(typeof STAGES)[number], typeof Lines>).strict(),
    disillusion: z.object({ low: Lines, mid: Lines, high: Lines }).strict(),
    bands: z.object({ mid: z.number().int(), high: z.number().int() }).strict(),
    call: z.string(), joined: z.string(),
  }).strict(),
  traitor: z.object({ head: z.string(), lines: z.record(z.enum(TRAITOR_WHYS), Lines), boss: z.string() }).strict(),
  rotom: z.object({ chip: z.string(), chipOff: z.string(), chatter: z.string(), news: z.string(), hero: z.string(), traitor: z.string() }).strict(),
}).strict().superRefine((v, ctx) => {
  // Every trait in personality.json has its chatter, reply and aside lines.
  for (const t of DOMINION_DATA.personality.traits) {
    for (const [k, bank] of [['topics', v.chatter.topics], ['reply', v.chatter.reply], ['aside', v.chatter.aside]] as const) {
      if (!bank[t.id]) ctx.addIssue({ code: 'custom', message: `chatter.${k} has no lines for trait ${t.id}` });
    }
  }
});
export type VoicesFile = z.infer<typeof VoicesFileSchema>;
export const VOICES: VoicesFile = VoicesFileSchema.parse(raw);
const V = () => VOICES;

const WEEK = () => DOMINION_DATA.start.clock.weekLength;
const regionName = (): string => { const r = DOMINION_DATA.start.start.region; return r[0]!.toUpperCase() + r.slice(1).toLowerCase(); };
const pickOf = (r: Rng, xs: readonly string[]): string => r.pick(xs);
const rngOf = (...key: (string | number)[]): Rng => new Rng(hashSeed(key.join('::')));
const cap = (s: string): string => s.split('-').map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w)).join(' ');
const isTraitor = (why: string): why is (typeof TRAITOR_WHYS)[number] => (TRAITOR_WHYS as readonly string[]).includes(why);
const first = (name: string): string => name.split(' ')[0]!;
const nice = (name: string): string => (name === name.toUpperCase() ? name[0]! + name.slice(1).toLowerCase() : name);

export function voicesOf(b: DominionBlock): VoicesState {
  return (b.voices ??= { week: [], papers: [] });
}

// ---------- the weekly Ledger news (a World Turn end step) ----------

const STEP_KIND: Partial<Record<WorldStepId, NewsKind>> = { police: 'police', rivals: 'rivals', hero: 'hero', legends: 'legends' };

/** Keeps tonight's news-worthy lines; on the week's last morning prints the paper. Lines go nowhere else (no report line). */
export function newsEnd(b: DominionBlock, seed: string, byStep: Partial<Record<WorldStepId, string[]>> = {}): string[] {
  const v = voicesOf(b);
  for (const [step, kind] of Object.entries(STEP_KIND) as [WorldStepId, NewsKind][]) {
    for (const l of byStep[step] ?? []) v.week.push({ k: kind, d: b.day, l });
  }
  // A traitor who left last night makes the paper too.
  for (const g of b.crew?.gone ?? []) {
    if (g.day === b.day && isTraitor(g.why)) v.week.push({ k: 'crew', d: b.day, l: fill(V().news.gone[g.why]!, { name: nice(g.name) }) });
  }
  if (b.day % WEEK() !== 0) return [];
  v.papers.push(printPaper(b, seed, b.day / WEEK(), v.week));
  v.papers = v.papers.slice(-V().news.keep);
  v.week = [];
  return [];
}
addWorldEnd(newsEnd);

/** The paper for week `w` from that week's lines. The busiest kind leads (ties by `order`); one more story under it. */
export function printPaper(b: DominionBlock, seed: string, w: number, week: VoicesState['week']): Paper {
  const r = rngOf(seed, 'dominion-news', w);
  const N = V().news;
  const by = new Map<NewsKind, string[]>();
  for (const e of week) by.set(e.k, [...(by.get(e.k) ?? []), e.l]);
  const kinds = N.order.filter((k) => by.has(k)).sort((a, c) => by.get(c)!.length - by.get(a)!.length || N.order.indexOf(a) - N.order.indexOf(c));
  const hero = b.hero ? heroDefOf(b.hero.id).name : 'The Hero';
  const rivalLines = by.get('rivals') ?? [];
  const team = teamsHere().find((t) => rivalLines.some((l) => l.includes(t.name)))?.name ?? teamsHere()[0]?.name ?? 'A rival gang';
  const vars = { hero, region: regionName().toUpperCase(), team: team.toUpperCase() };
  const items: Paper['items'] = kinds.slice(0, 2).map((k) => ({ k, head: fill(pickOf(r, N.heads[k]), vars), body: by.get(k)!.slice(-N.lines) }));
  if (!items.length) items.push({ k: 'quiet' as const, head: fill(pickOf(r, N.heads.quiet), vars), body: [N.quietBody] });
  const seen = !!b.hero && (b.hero.met || b.hero.intel >= b.day || stageIndex(b.hero.threat) >= 1);
  const photo = b.hero ? { text: seen ? fill(N.photo, { hero, at: districtName(heroAt(b)) }) : N.photoUnknown, look: heroDefOf(b.hero.id).look } : null;
  return { w, day: b.day, items, photo };
}

const districtName = (id: string): string => DOMINION_DATA.field.districts.find((d) => d.id === id)?.name ?? cap(id);

/** The newest paper, or null before the first week ends. */
export const latestPaper = (b: DominionBlock): Paper | null => b.voices?.papers.at(-1) ?? null;

// ---------- crew chatter ----------

export interface ChatLine { who: string; id: string; look: string; text: string; topic: Topic | 'reply' | 'aside'; rotom: string | null }

const present = (b: DominionBlock): Member[] => b.members.filter((m) => !m.crew?.out);

/** Tonight's topics, most pressing first. */
export function topicsOf(b: DominionBlock): Topic[] {
  const out: Topic[] = [];
  const gone = traitorGone(b);
  if (gone) out.push('gone');
  const last = b.members.map((m) => m.crew?.last ?? 'none');
  if (last.some((l) => l === 'caught' || l === 'arrested' || l === 'fail')) out.push('loss');
  if (last.some((l) => l === 'success' || l === 'big')) out.push('win');
  if (b.hero && (b.hero.met || stageIndex(b.hero.threat) >= 1)) out.push('hero');
  if (b.heat >= V().chatter.heatAt) out.push('heat');
  if (b.members.some((m) => m.crew?.memory.some((x) => x.day < b.day))) out.push('memory');
  out.push('quiet');
  return out;
}

/** The traitor who left most recently (quit, stole, walked out with a Pokémon, joined a rival), within `goneDays`. */
export function traitorGone(b: DominionBlock): { id: string; name: string; day: number; why: (typeof TRAITOR_WHYS)[number] } | null {
  const g = [...(b.crew?.gone ?? [])].reverse().find((x) => isTraitor(x.why) && b.day - x.day < V().chatter.goneDays);
  return g && isTraitor(g.why) ? { ...g, why: g.why } : null;
}

/** Tonight's chatter: the first speaker on the topic, the second answers, the third has an aside. Same state = same lines. */
export function chatter(b: DominionBlock, seed: string, log?: AiLog): { topic: Topic; lines: ChatLine[] } {
  const C = V().chatter;
  const r = rngOf(seed, 'dominion-chatter', b.day);
  const topics = topicsOf(b);
  // The most pressing topic leads; on even days a second one (if any) gets its turn, so nights don't all sound alike.
  const topic = topics[topics.length > 2 && b.day % 2 === 0 ? 1 : 0]!;
  const pool = [...present(b)];
  const who: Member[] = [];
  while (pool.length && who.length < C.max) who.push(pool.splice(r.int(0, pool.length - 1), 1)[0]!);
  const gone = traitorGone(b);
  const vars = (m: Member, other?: Member) => ({
    name: nice(m.name), other: other ? first(nice(other.name)) : '', gone: gone ? first(nice(gone.name)) : 'Someone', region: regionName(),
    hero: b.hero ? heroDefOf(b.hero.id).name : 'the Hero',
  });
  const lines: ChatLine[] = who.map((m, i) => {
    const card = cardFor(seed, m);
    const s = sheet(card);
    const trait = s.traits[(b.day + i) % s.traits.length]!.id;
    let text: string, t: ChatLine['topic'];
    if (i === 0) {
      t = topic;
      const mem = [...(m.crew?.memory ?? [])].reverse().find((x) => x.day < b.day);
      if (topic === 'memory' && mem) text = fill(pickOf(r, C.memory), { day: mem.day, memory: mem.line });
      else text = fill(pickOf(r, C.topics[trait]![topic === 'memory' ? 'quiet' : topic]), vars(m));
    } else if (i === 1) {
      t = 'reply';
      text = fill(pickOf(r, C.reply[trait]!), vars(m, who[0]));
    } else {
      t = 'aside';
      text = C.aside[trait]!;
    }
    const id = `chatter:d${b.day}:${m.id}`;
    // An aside trails off ("..."): said as is, without the quirk's opener.
    return { who: nice(m.name), id, look: m.look, text: t === 'aside' ? text : voice(s.quirk, text), topic: t, rotom: rotomText(log, id) };
  });
  return { topic, lines };
}

// ---------- the Hero's call and a traitor's parting line ----------

export interface HeroCall { hero: string; look: string; head: string; text: string; hint: string | null; id: string; rotom: string | null }

/** The Hero's call tonight: once they've noticed the Boss (met, or Threat at FOILS). Null before that, or once they joined. */
export function heroCall(b: DominionBlock, seed: string, log?: AiLog): HeroCall | null {
  const h = b.hero;
  if (!h || h.stand?.outcome === 'joined') return null;
  const st = stageIndex(h.threat);
  if (!h.met && st < 1) return null;
  const H = V().hero;
  const def = heroDefOf(h.id);
  const r = rngOf(seed, 'dominion-voice', 'hero', b.day);
  const ace = cap(def.lines[0]?.at(-1) ?? def.partner ?? 'my partner');
  const text = fill(pickOf(r, H.taunt[STAGES[st]!]), { ace, region: regionName(), hero: def.name });
  // A8: Disillusion stays hidden (no number anywhere); once they've met the Boss, how they talk gives a hint.
  const band = h.disill >= H.bands.high ? 'high' : h.disill >= H.bands.mid ? 'mid' : 'low';
  const hint = h.met && b.day % 2 === 1 ? pickOf(r, H.disillusion[band]) : null;
  const id = `hero:d${b.day}`;
  return { hero: def.name, look: def.look, head: fill(H.call, { hero: def.name }), text, hint, id, rotom: rotomText(log, id) };
}

export interface TraitorLine { name: string; head: string; text: string; boss: string; id: string; rotom: string | null }

/** A traitor's parting shot (said in their own voice), for `goneDays` after they leave. */
export function traitorLine(b: DominionBlock, seed: string, log?: AiLog): TraitorLine | null {
  const g = traitorGone(b);
  if (!g) return null;
  const T = V().traitor;
  const s = sheet(cardFor(seed, { name: g.name }));
  const text = voice(s.quirk, pickOf(rngOf(seed, 'dominion-voice', 'traitor', g.id), T.lines[g.why]!));
  const id = `traitor:${g.id}`;
  return { name: nice(g.name), head: fill(T.head, { name: nice(g.name) }), text, boss: T.boss, id, rotom: rotomText(log, id) };
}

// ---------- Rotom (D18): the calls the scene may send, and answers already stored ----------

/** A Rotom answer stored for this id (only Rotom's own words; `off` and missing read as null). */
export function rotomText(log: AiLog | undefined, id: string): string | null {
  const e = storedAnswer(log, id);
  return e?.s === 'ai' && typeof e.v === 'string' && e.v.trim() ? e.v.trim() : null;
}

/** One Rotom call: the scene sends it with askClaude (role `line`). `offline` is '' (no extra line: the written one stays). */
export interface RotomAsk { id: string; use: 'chatter' | 'news'; system: string; context: string; input: string }

/** The calls for the Evening scene; ones already answered (or played offline) are left out. */
export function rotomAsks(b: DominionBlock, seed: string, log: AiLog | undefined): RotomAsk[] {
  const R = V().rotom;
  const out: RotomAsk[] = [];
  const asked = (id: string) => !!storedAnswer(log, id);
  const facts = `Region: ${regionName()}. Day ${b.day}. The Boss runs a new crew.`;
  const talk = chatter(b, seed);
  for (const l of talk.lines) {
    const m = b.members.find((x) => `chatter:d${b.day}:${x.id}` === l.id);
    if (!m || asked(l.id)) continue;
    const mem = (m.crew?.memory ?? []).slice(-3).map((x) => `Day ${x.day}: ${x.line}`).join(' | ');
    out.push({
      id: l.id, use: 'chatter', system: `${cardPrompt(nice(m.name), m.rank, cardFor(seed, m))}\n${R.chatter}`,
      context: `${facts} Tonight's topic: ${talk.topic}.${mem ? ` Their memories this run: ${mem}.` : ''}`,
      input: `Their written line: "${l.text}". Say your own line.`,
    });
  }
  const call = heroCall(b, seed);
  if (call && !asked(call.id)) out.push({ id: call.id, use: 'chatter', system: `Character: ${call.hero}, the region's grown-up Hero, calling the Boss on an X-transceiver.\n${R.hero}`, context: facts, input: `The written call: "${call.text}"${call.hint ? ` "${call.hint}"` : ''}` });
  const tr = traitorLine(b, seed);
  if (tr) {
    const g = traitorGone(b)!;
    if (!asked(tr.id)) out.push({ id: tr.id, use: 'chatter', system: `${cardPrompt(tr.name, 'a crew member walking out', cardFor(seed, { name: g.name }))}\n${R.traitor}`, context: facts, input: `Why they left: ${g.why}. Their written line: "${tr.text}"` });
  }
  const p = latestPaper(b);
  const pid = p ? `news:w${p.w}` : '';
  if (p && !asked(pid)) out.push({ id: pid, use: 'news', system: `You write for ${fill(V().news.masthead, { region: regionName() })}, a local paper.\n${R.news}`, context: facts, input: p.items.map((i) => `${i.head}: ${i.body.join(' ')}`).join('\n') });
  return out;
}

// ---------- the Evening scene's model (mockup a10) ----------

export interface VoicesModel {
  title: string;
  sub: string;
  chatter: ChatLine[];
  paper: (Paper & { masthead: string; price: string; rotom: string | null }) | null;
  empty: string;
  call: HeroCall | null;
  traitor: TraitorLine | null;
  chip: string;
  rotomLines: number;
}

export function voicesModel(b: DominionBlock, seed: string, log?: AiLog): VoicesModel {
  const N = V().news;
  const talk = chatter(b, seed, log);
  const p = latestPaper(b);
  const paper = p ? { ...p, masthead: fill(N.masthead, { region: regionName() }), price: N.price, rotom: rotomText(log, `news:w${p.w}`) } : null;
  const call = heroCall(b, seed, log);
  const traitor = traitorLine(b, seed, log);
  const rotomLines = talk.lines.filter((l) => l.rotom).length + (paper?.rotom ? 1 : 0) + (call?.rotom ? 1 : 0) + (traitor?.rotom ? 1 : 0);
  return {
    title: b.phase === 'evening' ? 'Evening' : cap(b.phase), sub: `· HQ, Day ${b.day}`, chatter: talk.lines, paper, empty: N.empty, call, traitor,
    chip: rotomLines ? V().rotom.chip : V().rotom.chipOff, rotomLines,
  };
}

/** The HQ chip's line: a new paper this week reads as "out". */
export function paperNote(b: DominionBlock): string | null {
  const p = latestPaper(b);
  if (!p || b.day - p.day >= WEEK()) return null;
  return fill(V().news.out, { masthead: fill(V().news.masthead, { region: regionName() }), head: p.items[0]!.head });
}

/** D19's card: the member's newest Rotom chatter line kept with the run (for the ✦ line), or null. */
export function lastRotomFor(log: AiLog | undefined, memberId: string): { text: string; meta: string } | null {
  let best: { day: number; text: string } | null = null;
  for (const id of Object.keys(log ?? {})) {
    const m = /^chatter:d(\d+):(.+)$/.exec(id);
    if (!m || m[2] !== memberId) continue;
    const text = rotomText(log, id);
    if (text && (!best || Number(m[1]) > best.day)) best = { day: Number(m[1]), text };
  }
  return best ? { text: best.text, meta: `✦ Rotom · crew talk, Day ${best.day}` } : null;
}

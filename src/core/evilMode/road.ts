// Evil Mode slice 12: the other three on the road, and the Hero's mother (design Part 20). Pure. Made from the run's
// seed with their own generator (never a gameplay stream); each day's line is hashed from the seed and the day. Every
// lock that covers the Hero covers all four: no job, post, hire or battle targets them. Discouraged means home; the
// record stays (four, always; none discarded). The mother is a local without a holding on the Board: she can't be Leaned
// or Taken from. She writes once a district, from stored state only: her mood, the street's news, the Hero's last reply.

import { hashSeed, Rng } from '../rng';
import { EVIL_DATA, type EvilData } from './data';
import { fill } from './ledger';
import { moveTemper } from './temper';
import type { District, EvilModeBlock, Hero, Letter, Personality, RoadTrainer } from './schema';
import { logOf } from './pack';

const MOODS = ['warm', 'easy', 'wary', 'sullen', 'shut'] as const;
type Mood = (typeof MOODS)[number];
export type RoadRole = RoadTrainer['role'];
export type RoadWhat = 'help' | 'talk' | 'mislead';
export const ROAD_WHATS: readonly RoadWhat[] = ['help', 'talk', 'mislead'];
export const ROAD_IDS = ['evil-rival', 'evil-friend', 'evil-stray'] as const;

/** The three, from the run's seed: personalities never the Hero's (Part 20 section 2), Kanto's canon Rival, two generated. */
export function makeRoad(seed: string, hero: Hero, district: District, bossId: string, data: EvilData = EVIL_DATA): { road: RoadTrainer[]; traits: Record<string, number>[] } {
  const rng = new Rng(hashSeed(`${seed}::evil-road`));
  const R = data.road;
  const used = new Set<Personality>([hero.personality]);
  const names = rng.shuffle(R.names.filter((n) => n.name !== hero.name));
  const home = hero.home.holdings;
  const road: RoadTrainer[] = (['rival', 'friend', 'stray'] as const).map((role, i) => {
    const def = R.roles[role];
    const p = def.personalities.find((x) => !used.has(x)) ?? (['protector', 'champion-chaser', 'strategist', 'bitter-challenger', 'enthusiast', 'idealist', 'prodigy', 'underdog'] as const).find((x) => !used.has(x))!;
    used.add(p);
    const canon = role === 'rival' ? def.canon?.[data.hero.homeRegion] : undefined;
    const pickName = canon && bossId.toLowerCase() !== canon.name.toLowerCase() ? canon : names[i]!;
    return {
      id: def.ids, role, name: pickName.name, look: pickName.look, personality: p, minor: true, state: 'on',
      reason: null, family: role === 'friend' ? (home.length ? home[rng.int(0, home.length - 1)]! : null) : null,
      today: null, helped: [], talked: [], misled: false,
    };
  });
  void district;
  const traits = road.map(() => ({ ambition: rng.int(20, 80), pride: rng.int(20, 80), empathy: rng.int(20, 80), adaptability: rng.int(20, 80), vindictiveness: rng.int(20, 80), resilience: rng.int(20, 80) }));
  return { road, traits };
}

/** Their reasons: the Rival's by what the team did to a Gym; the Stray's by a Take; the Friend's by who was hired. */
function reasonOf(block: EvilModeBlock, t: RoadTrainer, data: EvilData): string {
  const r = data.road.roles[t.role].reasons;
  if (t.role === 'rival') {
    const way = block.gyms.find((g) => g.way)?.way;
    return (way && r[way]) || r.none!;
  }
  if (t.role === 'stray') return logOf(block).some((e) => e.kind === 'job' && e.method === 'take' && e.result === 'went') ? r.take! : r.none!;
  return block.crew.some((c) => c.ref) ? r.cousin! : r.none!;
}

/** The day's one line each (at the Hero beat), hashed from the seed, the day and the role: no stream moves. */
export function roadDay(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  if (!block.road.length || !data.road.on) return block;
  const seed = block.district?.seed ?? '';
  const has = (when?: string): boolean => {
    if (!when) return true;
    if (when === 'badge') return !!block.hero?.badges.length;
    if (when === 'replaced') return block.gyms.some((g) => g.way === 'replace');
    if (when === 'mess') return !!block.base?.rooms.some((r) => r.type === 'mess');
    return logOf(block).some((e) => e.kind === 'job' && e.method === when && e.result === 'went');
  };
  const road = block.road.map((t) => {
    if (t.state === 'home') return { ...t, today: data.road.roles[t.role].home };
    const pool = data.road.roles[t.role].lines.filter((l) => has(l.when));
    const i = new Rng(hashSeed(`${seed}::evil-road-line::${block.here.day}::${t.role}`)).int(0, pool.length - 1);
    return { ...t, today: pool[i]!.text, reason: t.reason ?? reasonOf(block, t, data) };
  });
  return { ...block, road };
}

/** A Lean that went on the Friend's family's holding sends them home; all four hear it (a temper step for the Hero). */
export function friendCheck(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  const f = block.road.find((t) => t.role === 'friend' && t.state === 'on' && t.family);
  if (!f || !logOf(block).some((e) => e.kind === 'job' && e.method === 'lean' && e.result === 'went' && e.to === f.family)) return block;
  const road = block.road.map((t) => (t.id === f.id ? { ...t, state: 'home' as const, today: data.road.roles.friend.home } : t));
  return { ...block, road, hero: block.hero ? moveTemper(block.hero, 1, 'friendHome', data) : block.hero };
}

/** What the Boss can do to one of the three: help, talk, mislead. Once a day each. Nothing else exists for them. */
export function roadDo(block: EvilModeBlock, id: string, what: RoadWhat, data: EvilData = EVIL_DATA): { block: EvilModeBlock; problem: string | null; line: string } {
  const t = block.road.find((x) => x.id === id);
  const no = (problem: string) => ({ block, problem, line: '' });
  if (!t) return no('Nobody by that name on the road.');
  if (!ROAD_WHATS.includes(what)) return no('Not to a child.');
  if (t.state === 'home') return no(`${t.name}'s gone home.`);
  const day = block.here.day;
  if (t.helped.includes(day) || t.talked.includes(day)) return no(`You've seen ${t.name} today already.`);
  const def = data.road.roles[t.role];
  if (what === 'help') return { block: { ...block, road: block.road.map((x) => (x.id === id ? { ...x, helped: [...x.helped, day] } : x)) }, problem: null, line: def.help };
  if (what === 'talk') return { block: { ...block, road: block.road.map((x) => (x.id === id ? { ...x, talked: [...x.talked, day] } : x)) }, problem: null, line: `${def.talk.where} ${def.talk.says}` };
  if (t.misled) return no(`${t.name}'s been misled once. They'd see it now.`);
  const road = block.road.map((x) => (x.id === id ? { ...x, misled: true, talked: [...x.talked, day] } : x));
  // A Mislead sets the lie for the Hero too: they'll tell (Part 20 section 4.4). Not the Stray: they weren't following.
  const hero = block.hero && t.role !== 'stray' ? { ...block.hero, lies: [...block.hero.lies, { kind: 'mislead' as const, day, region: block.here.region }] } : block.hero;
  return { block: { ...block, road, hero }, problem: null, line: def.mislead };
}

// ---- The mother (Part 20 section 7) ----

const shift = (m: Mood, by: number): Mood => MOODS[Math.max(0, Math.min(4, MOODS.indexOf(m) + by))]!;

/** Her mood after a district on her street: a Lean, Take or Expose that went cools it; a Persuade, Pay or waiver warms it. */
function moodAfter(block: EvilModeBlock, region: number, n: number): { mood: Mood; news: string | null } {
  const hero = block.hero!;
  let mood = hero.mother.mood as Mood;
  let news: string | null = null;
  if (hero.home.region !== region || hero.home.district !== n) {
    // She hears of the team's district, not her street's: the mood holds; the news is the district's loudest line.
    const loud = logOf(block).filter((e) => e.region === region && e.district === n && e.kind === 'job' && e.result === 'went' && (e.method === 'lean' || e.method === 'take'));
    return { mood, news: loud.length ? 'I hear they were hard on people, where you are.' : null };
  }
  for (const e of logOf(block)) {
    if (e.region !== region || e.district !== n || !hero.home.holdings.includes(e.to ?? '')) continue;
    if (e.kind === 'job' && e.result === 'went' && (e.method === 'lean' || e.method === 'take' || e.method === 'expose')) { mood = shift(mood, 1); news = e.text.replace(/^Day \d+\. /, ''); }
    else if ((e.kind === 'job' && e.result === 'went' && (e.method === 'persuade' || e.method === 'pay')) || e.kind === 'waive') { mood = shift(mood, -1); news ??= e.text.replace(/^Day \d+\. /, ''); }
  }
  return { mood, news };
}

/**
 * Her letter for the district just ended, made once (on the Road). Read by the Hero at the next rest stop: Warm −1,
 * Sullen +1; none (Shut, or kept back) +1 and a day lost. Stored whole: never re-rolled.
 */
export function motherWrites(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  const hero0 = block.hero;
  const d = block.district;
  if (!hero0 || !d || !data.road.on) return block;
  const id = `letter:${d.region}:${d.n}`;
  if (hero0.mother.letters.some((l) => l.id === id)) return block;
  const { mood, news } = moodAfter(block, d.region, d.n);
  const kept = hero0.mother.keepNext;
  const none = kept || mood === 'shut';
  const letter: Letter = { id, region: d.region, district: d.n, day: block.here.day, mood: none ? 'none' : mood, news, reply: hero0.temper, read: false, keptBack: kept, steamedNote: hero0.mother.steamed && !none && !hero0.mother.letters.some((l) => l.steamedNote) };
  let hero: Hero = { ...hero0, mother: { ...hero0.mother, mood, keepNext: false, letters: [...hero0.mother.letters, letter] } };
  if (none) hero = { ...moveTemper(hero, 1, 'noLetter', data), lostDays: hero.lostDays + 1, learned: [...hero.learned, data.road.mother.none] };
  else if (mood === 'warm') hero = moveTemper(hero, -1, 'warm', data);
  else if (mood === 'sullen') hero = moveTemper(hero, 1, 'sullen', data);
  return { ...block, hero };
}

/** A letter's text, built from what was stored when it was written. */
export function letterText(hero: Hero, l: Letter, data: EvilData = EVIL_DATA): string[] {
  const M = data.road.mother;
  if (l.mood === 'none') return [M.none];
  const out = [M.lines[l.mood as 'warm']];
  out.push(l.news ? fill(M.news, { news: l.news }) : M.noNews);
  if (l.steamedNote) out.push(fill(M.steamed, { they: 'They' }));
  out.push(M.reply[String(l.reply) as '0']);
  void hero;
  return out;
}

/** Reading one needs a Large Listening Post (Part 20 section 7.3). The first steamed flap: temper +1; a young line −1. */
export function openLetter(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA): { block: EvilModeBlock; problem: string | null; line: string } {
  const hero = block.hero;
  const l = hero?.mother.letters.find((x) => x.id === id);
  if (!hero || !l) return { block, problem: 'No such letter.', line: '' };
  if (l.mood === 'none') return { block, problem: 'There was no letter.', line: '' };
  if (l.read) return { block, problem: null, line: letterText(hero, l, data).join(' ') };
  if (!block.base?.rooms.some((r) => r.type === 'listening' && r.size >= 3)) return { block, problem: data.road.mother.open.need!, line: '' };
  let h: Hero = { ...hero, mother: { ...hero.mother, letters: hero.mother.letters.map((x) => (x.id === id ? { ...x, read: true } : x)) } };
  let crew = block.crew;
  const lines = [data.road.mother.readBy];
  if (!hero.mother.steamed) {
    h = { ...moveTemper(h, 1, 'steamed', data), mother: { ...h.mother, steamed: true } };
    crew = crew.map((c) => (c.where === 'in' && YOUNG.includes(c.line ?? 0) ? { ...c, loyalty: Math.max(0, c.loyalty - 1) } : c));
    const who = block.crew.find((c) => c.where === 'in' && YOUNG.includes(c.line ?? 0));
    if (who) lines.push(fill(data.road.mother.young, { name: who.name }));
  }
  return { block: { ...block, hero: h, crew }, problem: null, line: [...letterText(h, l, data), ...lines].join(' ') };
}

/** People's lines about the young (people.json 1, 30, 31). */
export const YOUNG = [1, 30, 31];

/** Keep the next one back: a Night job, Grey or darker. It never pays (the same as no letter, and worse). */
export function keepLetter(block: EvilModeBlock, data: EvilData = EVIL_DATA): { block: EvilModeBlock; problem: string | null; line: string } {
  const hero = block.hero;
  if (!hero) return { block, problem: "Nobody's on the road.", line: '' };
  if (block.here.beat !== 'night') return { block, problem: data.road.mother.write.night, line: '' };
  if (block.team.line === 'clean') return { block, problem: data.road.mother.keep.need!, line: '' };
  if (hero.mother.keepNext) return { block, problem: 'The next one is already being kept back.', line: '' };
  return { block: { ...block, hero: { ...hero, mother: { ...hero.mother, keepNext: true } } }, problem: null, line: data.road.mother.keep.done! };
}

/** Write to her: once a region, at Night. Her reply's by her mood (Easy reads as Warm, Shut as Sullen). */
export function writeMother(block: EvilModeBlock, opening: number, data: EvilData = EVIL_DATA): { block: EvilModeBlock; problem: string | null; line: string } {
  const hero = block.hero;
  const W = data.road.mother.write;
  if (!hero) return { block, problem: "Nobody's on the road.", line: '' };
  if (block.here.beat !== 'night') return { block, problem: W.night, line: '' };
  if (hero.mother.written.includes(block.here.region)) return { block, problem: W.once, line: '' };
  if (!Number.isInteger(opening) || opening < 0 || opening > 3) return { block, problem: 'Pick an opening.', line: '' };
  const m = hero.mother.mood;
  const col = m === 'warm' || m === 'easy' ? W.warm : m === 'wary' ? W.wary : W.sullen;
  const reply = col[opening]!;
  const mother = { ...hero.mother, written: [...hero.mother.written, block.here.region], replies: [...hero.mother.replies, reply], hot: hero.mother.hot || (opening === 3 && col === W.warm) };
  return { block: { ...block, hero: { ...hero, mother } }, problem: null, line: `${W.openings[opening]} ${reply}` };
}

// Evil Mode slice 15: the endings (design Part 23) and the six Finales (Part 22). Six endings, checked in a fixed order;
// only one starts, and once it has, only it moves. Each is a list of scenes built from the block and the picks made so
// far (nothing else is stored), so a save made on any scene reloads into it. Pure: no stream is drawn, no profile is read.
// Every ending pays the same for the same distance (section 9.3): the pay reads the distance and never the ending.

import { runRegions } from './runLength';
import { loanVested } from './lastThree';
import { EVIL_DATA, type EvilData } from './data';
import { appendLog, fill } from './ledger';
import { inRoster, teamLoyalty } from './people';
import { liedToHero, monName } from './fires';
import { homeCount, regionsWritten, schemePct } from './scheme';
import { backWayWing, detectiveOf } from './raid';
import { defOf } from './neighbour';
import { runIndex } from './region';
import type { Crew, EndingId, EndingState, EvilModeBlock, PartId } from './schema';
import { logOf } from './pack';

// ---- The data's shapes (endings.json is checked by EndingsFileSchema; these are the views the code reads) ----

type Txt = Record<string, string>;
interface ChoiceDef { id: string; label: string; kind?: string; says?: string; saysShut?: string; typed?: boolean; fight?: string; detective?: string; passes?: string; fails?: string; sioned?: string; needsFronts?: boolean }
interface FinaleDef {
  title: string; room: string; intro: string[]; dirtyIntro: string[]; prompt: string; choices: ChoiceDef[]; dirtyChoices?: ChoiceDef[]; upOnly?: string[];
  stamps: Record<PartId, string>; won?: string; wonDirty?: string; lost?: string; looked?: Txt;
  count?: { arrive: string; who: string; high: string; mid: string; low: string; highAt: number; midAt: number }; stands?: string[];
}
const D = (data: EvilData) => data.endings;
const finaleOf = (creed: string, data: EvilData): FinaleDef => ((D(data).scheme.finales as unknown as Record<string, FinaleDef>)[creed] ?? (D(data).scheme.finales.profit as unknown as FinaleDef));
const pick = <T>(o: unknown, k: string): T | undefined => (o as Record<string, T>)[k];

// ---- What every scene is ----

export interface EndChoice { id: string; label: string }
export interface EndScene {
  key: string;
  title: string;
  lines: string[];
  choices: EndChoice[];
  /** A typed line is asked for (120 letters); "(Say nothing.)" is always a choice beside it. */
  typed?: string;
  /** Shown with no text box (the Hero's minute). */
  still?: boolean;
  /** The battle this scene offers (the "battle" choice starts it): 'hero', 'champion' or 'elite:n'. */
  fight?: string;
}
type Picks = Record<string, string>;
const NEXT: EndChoice[] = [];

// ---- Where the run is ----

/** The last region this run can reach: its length (three or six), or the last one written, whichever's first. */
export const lastRegion = (block: Pick<EvilModeBlock, 'settings'>, data: EvilData = EVIL_DATA): number =>
  Math.min(runRegions(block), regionsWritten(data)) - 1;
export const inLastRegion = (block: EvilModeBlock, data: EvilData = EVIL_DATA): boolean => runIndex(block) >= lastRegion(block, data);
export const endingsOn = (data: EvilData = EVIL_DATA): boolean => D(data).on;

const heroName = (block: EvilModeBlock): string => block.hero?.name ?? 'The kid';
const vars = (block: EvilModeBlock, extra: Record<string, string | number> = {}): Record<string, string | number> => ({
  hero: heroName(block), boss: 'the Boss', team: block.team.name, mon: monName(block.hero?.starter ?? ''), day: block.here.day, ...extra,
});
const say = (block: EvilModeBlock, t: string, extra: Record<string, string | number> = {}): string => fill(t, vars(block, extra));

/** How the Finale went, by the stamps (Part 22 section 1.2): none not clean, one or two, three, or all four. */
export type SchemeClass = 'clean' | 'cracked' | 'wrong' | 'dirty';
export function schemeClass(block: EvilModeBlock): SchemeClass {
  const parts = Object.values(block.scheme.parts);
  const notClean = parts.filter((p) => p.state === 'inHand' && p.clean === false).length;
  return notClean >= 4 ? 'dirty' : notClean === 3 ? 'wrong' : notClean >= 1 ? 'cracked' : 'clean';
}
const notCleanParts = (block: EvilModeBlock): PartId[] => (Object.entries(block.scheme.parts) as [PartId, { state: string; clean: boolean | null }][]).filter(([, p]) => p.state === 'inHand' && p.clean === false).map(([k]) => k);

/** Fronts that turned a profit for a whole district with the back room shut throughout (Part 13), and aren't open now. */
export const straightFronts = (block: EvilModeBlock) => block.economy.running.filter((v) => v.kind === 'front' && v.straight.length > 0 && v.backRoom !== true);
/** Times each person was ordered across their line anyway (the Log's 'asked'). */
const crossedOf = (block: EvilModeBlock, id: string): number => logOf(block).filter((e) => e.kind === 'asked' && e.who.includes(id)).length;
const historyOf = (block: EvilModeBlock, id: string): number => logOf(block).filter((e) => e.who.includes(id)).length;
const hasRoom = (block: EvilModeBlock, type: string): boolean => !!block.base?.rooms.some((r) => r.type === type);
const rankIx = (c: Crew, data: EvilData): number => data.people.ranks.findIndex((r) => r.id === c.rank);

// ---- What's open (the player usually has two or three) ----

export function straightProblem(block: EvilModeBlock, data: EvilData = EVIL_DATA): string | null {
  const R = D(data).rules;
  const N = D(data).straight.not;
  if (block.team.line === 'whatever') return N.line;
  if (block.team.corruption > 0) return N.corruption;
  // Slice 20 (Galar): the clause took the Fronts, and Going Straight with them (Part 15b section 4.3).
  if (loanVested(block)) return data.region.lastThree?.loan.straightShut ?? N.line;
  const n = straightFronts(block).length;
  if (n < R.straightFronts) return fill(N.fronts, { n });
  if (block.team.regard < R.straightRegard) return N.regard;
  if (runIndex(block) < lastRegion(block, data) - 1) return N.region;
  return null;
}

/** The heir list (Part 23 section 5.1): the first hire first, then Executives and Officers by Loyalty. Never a minor, nor anyone under 5. */
export function heirs(block: EvilModeBlock, data: EvilData = EVIL_DATA): Crew[] {
  const R = D(data).rules;
  const ok = (c: Crew) => !c.minor && c.loyalty >= R.heirLoyalty;
  const roster = inRoster(block);
  const first = roster.find((c) => c.ref !== null) ?? null;
  const ranked = roster.filter((c) => c !== first && (c.rank === 'executive' || c.rank === 'officer')).sort((a, b) => rankIx(b, data) - rankIx(a, data) || b.loyalty - a.loyalty);
  return [...(first ? [first] : []), ...ranked].filter(ok);
}

export function handOffProblem(block: EvilModeBlock, data: EvilData = EVIL_DATA): string | null {
  const N = D(data).handOff.not;
  if (runIndex(block) < 1) return N.region;
  if (teamLoyalty(block, data) < D(data).rules.handOffLoyalty) return N.loyalty;
  if (!inRoster(block).some((c) => c.rank === 'officer' || c.rank === 'executive')) return N.officer;
  return null;
}

export const walkInProblem = (block: EvilModeBlock, data: EvilData = EVIL_DATA): string | null =>
  block.team.heat >= D(data).rules.walkInHeat ? null : `From Heat ${D(data).rules.walkInHeat}.`;

/** The three things the Hero names (section 6.2): kind entries in the Ledger, from districts they walked. */
export function threeThings(block: EvilModeBlock): string[] {
  const walked = new Set((block.hero?.badges ?? []).map((b) => `${b.region}:${b.district}`));
  return logOf(block).filter((e) => (e.given ?? 0) > 0 && e.kind !== 'pay' && walked.has(`${e.region}:${e.district}`)).slice(0, 3).map((e) => e.text.replace(/^Day \d+\. /, ''));
}

/** The Recruit's conditions (section 6.1), each a File line; null when they all hold. */
export function recruitProblem(block: EvilModeBlock, data: EvilData = EVIL_DATA): string | null {
  const N = D(data).recruit.not;
  const hero = block.hero;
  if (!hero || !inLastRegion(block, data)) return N.region;
  if (block.team.line === 'whatever') return N.line;
  if (block.team.corruption >= D(data).rules.recruitCorruption) return N.corruption;
  if (liedToHero(block)) return N.lied;
  if (hero.temper >= 4) return N.temper;
  if (hero.personality === 'champion-chaser') return N.temper;
  if (hero.personality !== 'prodigy' && threeThings(block).length < 3) return N.three;
  return null;
}

export interface Pressable { what: 'straight' | 'handOff' | 'walkIn'; label: string; problem: string | null }
/** The endings a player can press (on the Night list, or the Board from Heat 6), with why not. */
export function pressable(block: EvilModeBlock, data: EvilData = EVIL_DATA): Pressable[] {
  if (!endingsOn(data) || block.ending) return [];
  const night = block.here.beat === 'night' ? null : 'At Night.';
  return [
    { what: 'straight', label: 'Close the back rooms', problem: straightProblem(block, data) ?? night },
    { what: 'handOff', label: 'Hand it on', problem: handOffProblem(block, data) ?? night },
    { what: 'walkIn', label: 'Walk into the station', problem: walkInProblem(block, data) },
  ];
}

// ---- Starting one ----

export function startEnding(block: EvilModeBlock, id: EndingId, via: string, sub: string | null, heir: string | null = null, picks: Picks = {}): EvilModeBlock {
  const ending: EndingState = { id, sub, via, day: block.here.day, region: block.here.region, step: 0, picks, heir, done: false };
  const out: EvilModeBlock = { ...block, fight: null, ending, applied: [...block.applied, `ending:${id}`] };
  return appendLog(out, { kind: 'ending', who: heir ? [heir] : [], text: `Day ${block.here.day}. ${EVIL_DATA.endings.names[id]}${sub ? `. ${EVIL_DATA.endings.subs[sub as 'window'] ?? ''}` : '.'}` });
}

/** A last room's outcome as an ending's colour; an empty Roster's always "Alone". */
function roomSub(block: EvilModeBlock): string {
  if (!inRoster(block).length) return 'alone';
  const o = block.reck?.room?.outcome ?? 'away';
  const h = block.hero;
  if (o === 'talked' && h?.personality === 'champion-chaser' && h.temper === 0 && !block.gyms.some((g) => g.way) && block.posted.length === 0) return 'letPast';
  return o;
}

/**
 * The order the game checks them in (section 1.1), after every step: Caught (a Raid that takes the Boss), then the Scheme
 * (the Moment's morning, ready), then the Last Room (the day's last beat). Pressed endings start where they're pressed.
 * The Scheme and the Last Room only in the last region; Caught anywhere.
 */
export function checkEndings(before: EvilModeBlock, after: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  if (!endingsOn(data) || after.ending || after.applied.some((a) => a.startsWith('ending:'))) return after;
  const r = after.raid;
  // Heat 10, a Raid, and no back way (section 7): the Boss taken from a base that had none.
  if (r?.state === 'done' && before.raid?.state !== 'done' && (r.end === 'lost' || r.end === 'charge' || r.end === 'pen') && before.base && backWayWing(before.base, data) === null) return startEnding(after, 'caught', 'raid', 'raided');
  if (!inLastRegion(after, data)) return after;
  if (after.scheme?.moment.came === 'ready' && before.scheme?.moment.came !== 'ready') return startEnding(after, 'scheme', 'moment', null);
  // The last room's day ends the region (Part 21): once its tally is read and the region's over, the Last Room (or the
  // Recruit, when the Hero was talked with and offered) begins, coloured by how the room went; no room met is "Away".
  if (after.region.phase === 'over' && before.region.phase !== 'over') {
    const room = after.reck?.room?.outcome ? after.reck.room : null;
    if (!room) return startEnding(after, 'lastRoom', 'over', inRoster(after).length ? 'away' : 'alone');
    const sub = roomSub(after);
    if (sub === 'talked' && room.offered && !recruitProblem(after, data)) return startEnding(after, 'recruit', 'room', after.hero?.personality === 'prodigy' ? 'postcard' : null);
    return startEnding(after, 'lastRoom', 'room', sub);
  }
  return after;
}

// ---- The scenes, by ending ----

const scene = (key: string, title: string, lines: string[], choices: EndChoice[] = NEXT, more: Partial<EndScene> = {}): EndScene => ({ key, title, lines: lines.filter(Boolean), choices, ...more });
const typedOf = (picks: Picks, key: string): string | null => (picks[key]?.startsWith('t:') ? picks[key]!.slice(2) : null);

function schemeScenes(block: EvilModeBlock, picks: Picks, data: EvilData): EndScene[] {
  const E = D(data);
  const creed = E.scheme.finales[block.scheme.family as 'profit'] ? block.scheme.family : block.team.creed;
  const F = finaleOf(creed, data);
  const cls = schemeClass(block);
  const dirty = cls === 'dirty';
  const stampLines = notCleanParts(block).map((p) => say(block, F.stamps[p]));
  let choices = dirty ? F.dirtyChoices ?? F.choices.filter((c) => (F.upOnly ?? []).includes(c.id)) : F.choices;
  if (!choices.length) choices = F.choices;
  const hero = block.hero;
  const out: EndScene[] = [];
  const intro = [F.room + '.', ...(dirty ? F.dirtyIntro : F.intro).map((l) => say(block, l)), ...stampLines];
  // Belonging's count is shown before the road's watched: the forty with the most history, one line each.
  if (creed === 'belonging' && F.count) {
    const c = homeCount(block, data);
    const shown = c.names.slice(0, 12).map((h, i) => fill(F.count!.arrive, { n: Math.min(c.n, (i + 1) * Math.max(1, Math.floor(c.n / 12))), name: `${h.who}: ${h.why}` }));
    intro.push(...(picks.finale ? shown : []), ...(picks.finale ? [F.count.who] : []));
  }
  const fightChoice = choices.find((c) => c.fight);
  out.push(scene('finale', F.title, [...intro, F.prompt], choices.map((c) => ({ id: c.fight ? 'battle' : c.id, label: c.label })), fightChoice ? { fight: fightChoice.fight } : {}));
  const p = picks.finale;
  if (!p) return out;
  const ch = choices.find((c) => c.id === p) ?? (p === 'won' || p === 'lost' ? fightChoice : undefined);
  const said: string[] = [];
  if (creed === 'power' && (p === 'won' || p === 'lost')) said.push(p === 'lost' ? F.lost! : cls === 'clean' ? F.won! : F.wonDirty!);
  else if (ch?.says) said.push(say(block, (block.scheme.eye === 'shut' || dirty) && ch.saysShut ? ch.saysShut : ch.says));
  if (ch?.id === 'all') said.push(block.given >= block.taken ? ch.passes! : ch.fails!, ch.sioned!);
  if (ch?.detective) said.push(`The detective's notebook: "${ch.detective}"`);
  if (creed === 'wonder' && ch?.id === 'nothing' && F.looked) for (const c of inRoster(block).slice(0, 6)) said.push(`${c.name}: "${F.looked[c.flaw ?? 'none'] ?? F.looked.none}"`);
  if (creed === 'belonging' && F.count) {
    const n = homeCount(block, data).n;
    said.push(n >= F.count.highAt ? F.count.high : n >= F.count.midAt ? F.count.mid : F.count.low);
    if (hero && F.stands) said.push(`${hero.name}: ${F.stands[hero.temper]}`);
  }
  out.push(scene('finaleSaid', F.title, said));
  if (ch?.typed) out.push(scene('finaleTyped', F.title, [], [{ id: 'skip', label: E.words.skipType }], { typed: E.words.typePrompt }));
  // One Evening: the Creed's own room, and Monday.
  const room = pick<{ room: string; who: string; line: string; dirty?: string }>(E.scheme.room, creed)!;
  const fronts = straightFronts(block).length >= E.rules.straightFronts;
  const monday = (E.scheme.monday.choices as ChoiceDef[]).filter((c) => !c.needsFronts || fronts);
  out.push(scene('evening', 'That Evening', [room.room, dirty && room.dirty ? room.dirty : room.line, E.scheme.monday.prompt], monday.map((c) => ({ id: c.id, label: c.label }))));
  if (!picks.evening) return out;
  const m = monday.find((c) => c.id === picks.evening);
  const mondayLines = [m?.says ?? ''];
  if (picks.evening === 'ask') {
    const top = [...inRoster(block)].sort((a, b) => rankIx(b, data) - rankIx(a, data) || b.loyalty - a.loyalty)[0];
    if (top) mondayLines.push(`${top.name}: ${E.handOff.question[(top.talent ?? 'none') as 'voice'] ?? E.handOff.question.none}`);
  }
  out.push(scene('monday', 'Monday', mondayLines));
  // The Hero arrives. Late.
  const L = E.scheme.late;
  const findsOut = pick<string>(E.scheme.findsOut, creed) ?? '';
  out.push(scene('findsOut', heroName(block), [say(block, findsOut), L.doors, say(block, L.doorway)]));
  const C = pick<{ hero: string; boss: string[] }>(L.classes, cls)!;
  const battle = (hero?.temper ?? 0) >= E.rules.battleTemper;
  out.push(scene('late', 'The last room, late', [say(block, `{hero}: ${C.hero}`)], [...C.boss.map((b, i) => ({ id: `b${i}`, label: b })), ...(battle ? [{ id: 'battle', label: L.battle }] : [])], battle ? { fight: 'hero' } : {}));
  if (!picks.late) return out;
  const lateLines: string[] = [];
  if (picks.late === 'won' || picks.late === 'lost') lateLines.push(say(block, picks.late === 'won' ? L.battleLost : L.battleWon));
  else if (picks.late.startsWith('b')) {
    const i = Number(picks.late.slice(1));
    lateLines.push(`You: ${C.boss[i] ?? ''}`);
    if (cls === 'cracked' && i === 2) lateLines.push(fill(L.whichBit, { line: stampLines[0] ?? '' }));
  }
  if (lateLines.length) out.push(scene('lateSaid', 'The last room, late', lateLines));
  // The Hero's minute: the place by the Creed and the Finale, what they do by their personality, with no text box.
  const M = E.scheme.minute;
  const kindWorld = (cls === 'clean' || cls === 'cracked') && (ch?.kind ?? 'clean') !== 'wrong';
  const placeKey = dirty ? 'dirty' : kindWorld ? 'clean' : 'wrong';
  const place = pick<Txt>(M.places, creed)![placeKey]!;
  const minute = [say(block, place)];
  if (hero) minute.push(say(block, pick<string[]>(M.hands, hero.personality)![kindWorld ? 0 : 1]!));
  for (const t of block.road.filter((r) => r.state === 'on')) minute.push(say(block, pick<string>(M.road, t.role)!, { name: t.name }));
  if (creed === 'profit' && p === 'bear') minute.push(M.mother);
  minute.push(say(block, M.last));
  out.push(scene('minute', `${heroName(block)}'s minute`, minute, NEXT, { still: true }));
  return out;
}

/** The walk out's line for one person (section 3.2): the first rule that applies. */
export function walkOutLine(block: EvilModeBlock, c: Crew, data: EvilData = EVIL_DATA): string {
  const W = D(data).walkOut;
  const R = D(data).rules;
  const named = c.ref ? pick<{ hero: string; yes?: string; no?: string; needs?: string }>(W.named, c.ref) : undefined;
  const ok = (n: { needs?: string }) => !n.needs || (n.needs === 'refused' ? c.asked > 0 : n.needs === 'infirmary' ? hasRoom(block, 'infirmary') : true);
  const line = (says: string, reply?: string) => say(block, W.line, { name: c.name, says }) + (reply ? ` ${reply}` : '');
  if (named && ok(named)) {
    if (c.ref === 'tomasz') return line(named.hero, hasRoom(block, 'infirmary') ? named.yes : named.no);
    if (c.ref === 'hortense') return say(block, `{hero} to ${c.name}: ${named.hero}`);
    return line(named.hero, named.yes);
  }
  if (crossedOf(block, c.id) > 0) return line(W.crossed);
  if (c.loyalty >= 9) return line(W.loyal);
  if (c.loyalty <= 4 && c.loyalty >= R.talkerMin) return line(W.low);
  if (c.minor) return line(W.minor);
  return line(pick<string>(W.talents, c.talent ?? 'none') ?? W.talents.none);
}

function lastRoomScenes(block: EvilModeBlock, picks: Picks, sub: string, data: EvilData): EndScene[] {
  const E = D(data);
  const L = E.lastRoom;
  const title = E.names.lastRoom;
  const roster = inRoster(block);
  const out: EndScene[] = [];
  if (sub === 'bossWon') {
    const B = L.bossWon;
    const byLoyalty = [...roster].sort((a, b) => b.loyalty - a.loyalty);
    const tellers: Crew[] = [];
    for (const c of [byLoyalty[0], roster.find((x) => x.flaw === 'talks'), ...byLoyalty]) if (c && !tellers.includes(c) && tellers.length < 3) tellers.push(c);
    out.push(scene('leaving', title, [say(block, B.leaving)]));
    B.tellings.forEach((t, i) => out.push(scene(`tell${i}`, 'The story', [say(block, t, { name: tellers[i]?.name ?? 'A Grunt' })])));
    out.push(scene('after', title, [say(block, (block.hero?.temper ?? 0) <= 1 ? B.calm : B.angry), B.last], NEXT, { still: true }));
    return out;
  }
  if (sub === 'heroWon') {
    const H = L.heroWon;
    out.push(scene('door', title, [say(block, H.door)]));
    roster.forEach((c, i) => out.push(scene(`walk${i}`, 'The walk out', [walkOutLine(block, c, data)])));
    const loy = teamLoyalty(block, data);
    out.push(scene('front', 'The front door', [loy >= 7 ? say(block, H.front.high) : loy >= 3 ? H.front.mid : H.front.low]));
    out.push(scene('sign', 'The Office', [H.alone], H.sign));
    if (picks.sign) out.push(scene('signSaid', 'The Office', [pick<string>(H.signSaid, picks.sign) ?? ''], NEXT, { still: true }));
    return out;
  }
  if (sub === 'talked' || sub === 'letPast') {
    const T = L.talked;
    if (picks.offer === 'dont') out.push(scene('dont', title, [say(block, E.recruit.dont)]));
    if (sub === 'letPast') {
      out.push(scene('letPast', title, T.letPast));
      return out;
    }
    out.push(scene('sit', title, [T.sit]));
    out.push(scene('stay', title, [T.stay]));
    out.push(scene('leave', title, [say(block, T.leave), block.given >= block.taken ? T.league.given : T.league.taken], NEXT, { still: true }));
    return out;
  }
  if (sub === 'draw') {
    const R = L.draw;
    const who = block.crew.find((c) => c.id === block.reck?.room?.stepped) ?? roster[0];
    const name = who?.name ?? 'Somebody';
    out.push(scene('why', title, [say(block, R.why, { name })]));
    out.push(scene('answer', title, [`${name}: ${pick<string>(R.answers, who?.flaw ?? 'none') ?? R.answers.none}`]));
    out.push(scene('last', title, [say(block, R.last, { name })], NEXT, { still: true }));
    return out;
  }
  if (sub === 'window') {
    const W = L.window;
    out.push(scene('ask', title, [say(block, W.ask)].filter(Boolean)));
    const yes = windowYes(block, data);
    out.push(scene('answers', title, roster.map((c) => fill(yes.includes(c) ? (c.loyalty >= W.yesAt ? W.yes : W.maybe) : c.loyalty < W.noUnder ? W.no : W.stay, { name: c.name }))));
    out.push(scene('last', title, [yes.length ? fill(W.last, { n: yes.length === 1 ? yes[0]!.name : `${yes.length} of them` }) : W.lastNone], NEXT, { still: true }));
    return out;
  }
  if (sub === 'alone') {
    const A = L.alone;
    const plates = block.crew.map((c) => c.name);
    const worst = [...logOf(block)].filter((e) => (e.taken ?? 0) > 0).sort((a, b) => (b.taken ?? 0) - (a.taken ?? 0)).slice(0, 3).map((e) => fill(A.worst, { line: e.text }));
    out.push(scene('plates', title, [say(block, A.plates, { names: plates.length ? plates.join('. ') : 'Nobody' })]));
    out.push(scene('office', title, [say(block, A.office, { n: plates.length }), ...worst]));
    out.push(scene('last', title, [A.last], NEXT, { still: true }));
    return out;
  }
  // Nobody home: the Boss wasn't there, or no room was met.
  out.push(scene('away', title, [say(block, data.lastRoom.outcomes.away.hero), say(block, L.away.last)], NEXT, { still: true }));
  return out;
}

/** Who goes after the Boss (section 3.5): Loyalty 8 or more; under 5, no; between, by flaw (the Kind and the Loves do). */
export function windowYes(block: EvilModeBlock, data: EvilData = EVIL_DATA): Crew[] {
  const W = D(data).lastRoom.window;
  return inRoster(block).filter((c) => c.loyalty >= W.yesAt || (c.loyalty >= W.noUnder && (c.flaw === 'kind' || c.flaw === 'loves' || c.flaw === 'proud')));
}

/** Who stays when the back rooms close (section 4.3): at Loyalty 7, everyone whose flaw isn't Skims or Proud; else those at 5 or more. */
export function whoStays(block: EvilModeBlock, data: EvilData = EVIL_DATA): Crew[] {
  const high = teamLoyalty(block, data) >= 7;
  return inRoster(block).filter((c) => (high ? c.flaw !== 'skims' && c.flaw !== 'proud' : c.loyalty >= 5));
}

/** The name on the door after the sign (section 4.4): the Creed's word swapped, or the typed word in its place. */
export function signName(block: EvilModeBlock, picks: Picks, data: EvilData = EVIL_DATA): string | null {
  const w = pick<string[]>(D(data).straight.words, block.team.creed) ?? ['', ''];
  const typed = typedOf(picks, 'signTyped');
  if (picks.sign === 'swap' && w[0] && block.team.name.includes(w[0])) return block.team.name.replace(w[0], w[1]!);
  if (picks.sign === 'swap' && w[1]) return `${block.team.name} ${w[1]}`;
  if (typed) return w[0] && block.team.name.includes(w[0]) ? block.team.name.replace(w[0], typed) : `${block.team.name} ${typed}`;
  return null;
}

function straightScenes(block: EvilModeBlock, picks: Picks, data: EvilData): EndScene[] {
  const E = D(data);
  const S = E.straight;
  const title = E.names.straight;
  const fronts = straightFronts(block).map((v) => block.economy.cards.find((c) => c.id === v.cardId) ? v.cardId : v.cardId);
  const names = fronts.map((id) => data.economy.cards.find((c) => c.id === id)?.name ?? id).slice(0, 3);
  const seen = S.answers.filter((a) => (a.id === 'show' || a.id === 'who') && picks[`knock:${a.id}`]).map((a) => a.says);
  const out: EndScene[] = [scene('knock', 'A knock', [...S.knock.map((l) => fill(l, { fronts: names.join('. ') })), ...seen], S.answers.filter((a) => !picks[`knock:${a.id}`]).map((a) => ({ id: a.id, label: a.label })))];
  if (picks.knock !== 'close') return out;
  const rackets = block.economy.running.filter((v) => v.kind === 'racket');
  const holdingName = (v: (typeof rackets)[number]) => (v.street !== null ? `Street ${v.street + 1}` : 'the docks');
  out.push(scene('close', title, [...S.day, ...(rackets.length ? rackets.slice(0, 6).map((v) => fill(S.racket, { name: 'Somebody', place: holdingName(v) })) : [S.noRackets])]));
  const O = S.objections as Txt;
  const roster = inRoster(block);
  const obj: string[] = [];
  for (const c of roster) {
    if (c.ref === 'otis' || c.ref === 'vikram' || c.ref === 'kwabena') obj.push(O[c.ref]!);
    else if (c.ref === 'junseo') obj.push(c.loyalty >= 8 ? O.junseoStays! : O.junseo!);
    else if (c.flaw === 'proud' && c.loyalty < 5) obj.push(fill(O.proud!, { name: c.name }));
  }
  out.push(scene('objections', 'That Evening', [...obj, fill(S.staying, { n: whoStays(block, data).length, of: roster.length })]));
  const w = pick<string[]>(S.words, block.team.creed) ?? ['', ''];
  const signChoices: EndChoice[] = [...(w[1] ? [{ id: 'swap', label: w[0] ? `"${w[0]}" to "${w[1]}"` : `Add "${w[1]}"` }] : []), { id: 'keep', label: S.sign.keep }, { id: 'type', label: S.sign.type }];
  out.push(scene('sign', 'The sign', [S.sign.prompt, block.team.name], signChoices));
  if (picks.sign === 'type') out.push(scene('signTyped', 'The sign', [block.team.name], [{ id: 'skip', label: E.words.skipType }], { typed: S.sign.type }));
  if (!picks.sign) return out;
  const hero = block.hero;
  const after = [...S.after.map((l) => say(block, l)), S.detective];
  if (hero) after.push(say(block, pick<string>(S.heroAnswers, hero.personality) ?? ''));
  if (hero?.mother && hero.mother.mood !== 'shut') after.push(S.mother);
  if (block.neighbour && ['truce', 'front', 'understanding', 'merger'].includes(block.neighbour.stance) && block.neighbour.id === 'giovanni') after.push(S.basket);
  const sign = signName(block, picks, data);
  if (sign) after.push(`The sign: ${sign}.`);
  out.push(scene('after', 'A year on', after, NEXT, { still: true }));
  return out;
}

/** The first day, six beats (section 5.3), from the Log. After a Mutiny each row reads reversed (not built: no Mutiny yet). */
export function firstDay(block: EvilModeBlock, heir: Crew, oathKept: boolean | null, data: EvilData = EVIL_DATA): string[] {
  const H = D(data).handOff;
  const d = H.day;
  const has = (k: string) => logOf(block).some((e) => e.kind === k);
  const dispatch = has('waive') ? d.waived : logOf(block).some((e) => e.kind === 'job' && e.result === 'went' && (e.method === 'lean' || e.method === 'take')) && block.inPerson ? d.wentBad
    : !has('asked') ? d.noCross : block.economy.broke === 0 && !block.crew.some((c) => c.unpaid > 0) ? d.paid : block.base?.walked ? d.walked : d.none;
  const beats = [
    Object.keys(block.rates).length ? d.readLedger : d.readBoard,
    oathKept === false ? d.none : dispatch,
    logOf(block).some((e) => e.kind === 'gym') ? d.goes : d.stays,
    teamLoyalty(block, data) >= 7 ? d.eatsSquad : d.eatsOffice,
    block.crew.filter((c) => c.lineHeard).length * 2 >= Math.max(1, inRoster(block).length) ? d.opens : d.sleeps,
    `${H.question[(heir.talent ?? 'none') as 'voice'] ?? H.question.none}`,
  ];
  return [...H.beats.map((b, i) => `${b}: ${beats[i]}`), `The day's one mistake: ${H.mistake[(heir.flaw ?? 'none') as 'talks'] ?? H.mistake.none}`];
}

function handOffScenes(block: EvilModeBlock, ending: EndingState, data: EvilData): EndScene[] {
  const E = D(data);
  const H = E.handOff;
  const picks = ending.picks;
  const heir = block.crew.find((c) => c.id === ending.heir);
  if (!heir) return [];
  const title = E.names.handOff;
  const line = typedOf(picks, 'line') ?? '';
  const yes = crossedOf(block, heir.id) > 0 ? H.yes.crossed : heir.flaw === 'doubts' ? H.yes.doubts : heir.flaw === 'freezes' ? H.yes.freezes : H.yes.plain;
  const out: EndScene[] = [scene('ask', title, [fill(H.ask, { name: heir.name, line: line ? `"${line}"` : '(Nothing.)' }), fill(H.heir, { name: heir.name }), `${heir.name}: ${yes}`])];
  if (block.team.creed === 'power') {
    out.push(scene('oath', 'The Oath, read back', [H.oath.read], [{ id: 'yes', label: '"Yes."' }, { id: 'no', label: '"No."' }]));
    if (!picks.oath) return out;
    out.push(scene('oathSaid', 'The Oath, read back', [picks.oath === 'yes' ? H.oath.yes : H.oath.no]));
  }
  out.push(scene('day', `${heir.name}'s first day`, firstDay(block, heir, picks.oath ? picks.oath === 'yes' : null, data)));
  const best = [...inRoster(block)].filter((c) => c.id !== heir.id).sort((a, b) => b.loyalty - a.loyalty)[0];
  out.push(scene('where', 'Where the Boss goes', [H.where.prompt], H.where.choices.map((c) => ({ id: c.id, label: c.label }))));
  const w = H.where.choices.find((c) => c.id === picks.where);
  if (w) out.push(scene('whereSaid', 'Where the Boss goes', [fill(w.says, { name: best?.name ?? heir.name })], NEXT, { still: true }));
  return out;
}

/** A Plateau room's signature (section 6.4): Persuade and Expose need the Ledger's entry; Scout, the eight Badges; Outplay, the battle. */
function roomSigned(block: EvilModeBlock, i: number, method: string, result: string | undefined): boolean {
  if (method === 'outplay') return result === 'won';
  if (method === 'persuade') return logOf(block).filter((e) => (e.given ?? 0) > 0).length > i;
  if (method === 'expose') return logOf(block).filter((e) => (e.taken ?? 0) > 0).length > i;
  return (block.hero?.badges.filter((b) => b.region === block.here.region).length ?? 0) >= 8;
}

function recruitScenes(block: EvilModeBlock, ending: EndingState, data: EvilData): EndScene[] {
  const E = D(data);
  const R = E.recruit;
  const picks = ending.picks;
  const hero = block.hero;
  const title = E.names.recruit;
  if (!hero) return [];
  const out: EndScene[] = [scene('fire', title, [say(block, R.fire)])];
  const seen = hero.learned.slice(-3).join('; ') || 'the team';
  out.push(scene('file', 'The File', R.file.map((l) => fill(l, { seen, temper: E.tempers[hero.temper] ?? '' }))));
  const three = threeThings(block);
  out.push(scene('room', title, [say(block, R.room, { badges: hero.badges.filter((b) => b.region === block.here.region).length, three: three.length ? three.join('; ') : 'what it knew' }), say(block, `{hero}: ${pick<string>(R.says, hero.personality) ?? ''}`)]));
  if (hero.personality === 'prodigy') {
    const firstLine = hero.fires.find((f) => f.own)?.own ?? '"See you."';
    out.push(scene('postcard', 'A postcard', R.prodigy.map((l) => say(block, l, { line: firstLine })), NEXT, { still: true }));
    return out;
  }
  out.push(scene('offer', title, [], hero.personality === 'underdog' ? R.underdog : R.offer));
  if (!picks.offer) return out;
  if (picks.offer === 'no') {
    out.push(scene('hall', 'A seventh name', [say(block, R.underdogNo)], NEXT, { still: true }));
    return out;
  }
  const P = R.plateau;
  out.push(scene('plateau', 'The Plateau', [say(block, P.intro)]));
  const L = E.league;
  let signed = 0;
  for (let i = 0; i < 4; i++) {
    const name = L.elite[i]!.name;
    const key = `room${i}`;
    const m = picks[key];
    const method = m === 'won' || m === 'lost' ? 'outplay' : m;
    out.push(scene(key, name, [fill(P.together, { name })], P.methods.map((x) => ({ id: x.id === 'outplay' ? 'battle' : x.id, label: x.label })), { fight: `elite:${i}` }));
    if (!m) return out;
    const ok = roomSigned(block, i, method ?? 'scout', m);
    if (ok) signed += 1;
    out.push(scene(`${key}Said`, name, [fill(ok ? P.signed : P.unsigned, { name })]));
  }
  out.push(scene('champion', L.champion.name, [...P.champion.map((l) => say(block, l)), `Signatures: ${signed}.`], [...(signed >= 4 ? [{ id: 'read', label: P.read }] : []), { id: 'battle', label: P.battle }], { fight: 'champion' }));
  const c = picks.champion;
  if (!c) return out;
  out.push(scene('end', 'The Plateau', [say(block, c === 'read' ? P.heard : c === 'won' ? P.won : P.lost), ...(signed === 3 && c !== 'read' ? [P.corridor] : [])], NEXT, { still: true }));
  return out;
}

// ---- Caught: the count (section 7) ----

export interface CountStep { line: string; delta: number }
/** How a person stands in court (section 7.3), in order; minors aren't called. Returns the line and +1/−1/0/+2. */
function witness(block: EvilModeBlock, c: Crew, data: EvilData): CountStep | null {
  const W = D(data).caught.witness;
  const R = D(data).rules;
  if (c.minor) return null;
  const moment = c.jobs > 0 ? fill(D(data).caught.moments.job, { n: c.jobs }) : c.unpaid === 0 && logOf(block).some((e) => e.kind === 'pay' && e.who.includes(c.id)) ? D(data).caught.moments.pay : D(data).caught.moments.none;
  if (c.cell && c.where === 'away') return { line: fill(W.cells, { name: c.name }), delta: 2 };
  const crossed = crossedOf(block, c.id);
  if (crossed > 0) return { line: fill(W.crossed, { name: c.name, times: crossed }), delta: 1 };
  if (c.left?.kindly) return { line: fill(W.handshake, { name: c.name }), delta: -1 };
  if (c.loyalty >= R.witnessFor) return { line: fill(W.loyal, { name: c.name, moment }), delta: -1 };
  if (c.loyalty <= R.witnessAgainst) return { line: fill(W.low, { name: c.name, moment }), delta: 1 };
  if (c.lineHeard) return { line: fill(W.heard, { name: c.name }), delta: -1 };
  return { line: fill(W.unsure, { name: c.name }), delta: 0 };
}

/** The list (Part 17): what the detective can prove, from the Log. */
export const listItems = (block: EvilModeBlock): string[] =>
  logOf(block).filter((e) => e.kind === 'job' && e.result === 'went' && (e.method === 'lean' || e.method === 'take' || e.method === 'expose')).map((e) => e.text);

/**
 * The count, line by line (sections 7.2 and 7.6): one per list item, minus two for walking in and two more for the Ledger;
 * one per racket still running; minus a half per Work done and per Front run honestly for a district; minus one per Dig put
 * back; the plates read (no count); the Roster, one each for or against (minors aren't called); the Hero; Old Obadiah last.
 */
export function countSteps(block: EvilModeBlock, sub: string | null, data: EvilData = EVIL_DATA): CountStep[] {
  const C = D(data).caught;
  const S = C.steps;
  const R = D(data).rules;
  const out: CountStep[] = [];
  const list = listItems(block);
  if (!list.length) out.push({ line: S.noList, delta: 0 });
  for (const l of list) out.push({ line: fill(S.listItem, { line: l }), delta: 1 });
  if (sub === 'walkedIn' || sub === 'walkedInLedger') out.push({ line: S.walkIn, delta: -R.walkInOff });
  if (sub === 'walkedInLedger') out.push({ line: S.ledger, delta: -R.ledgerOff });
  if (block.hero && block.hero.temper <= 2 && block.hero.temper >= 1) out.push({ line: S.column, delta: 0 });
  for (const v of block.economy.running.filter((x) => x.kind === 'racket' && !x.honest)) out.push({ line: fill(S.racket, { place: v.street !== null ? `Street ${v.street + 1}` : 'the docks' }), delta: 1 });
  const cardName = (id: string) => data.economy.cards.find((c) => c.id === id)?.name ?? id;
  for (const v of block.economy.running.filter((x) => x.kind === 'work' && x.done)) out.push({ line: fill(S.work, { name: cardName(v.cardId) }), delta: -0.5 });
  for (const v of straightFronts(block)) out.push({ line: fill(S.front, { name: cardName(v.cardId) }), delta: -0.5 });
  for (const _d of block.scheme.digs.filter((x) => x.ended === 'back')) out.push({ line: S.dig, delta: -1 });
  out.push({ line: fill(S.plates, { n: block.crew.length }), delta: 0 });
  // The Roster, in the Log's order; Otis last but one, Old Obadiah last, when both were hired.
  const people = block.crew.filter((c) => c.ref !== 'otis' && c.ref !== 'obadiah');
  for (const c of people) {
    if (c.minor) { out.push({ line: fill(S.minorLetter, { name: c.name }), delta: 0 }); continue; }
    const w = witness(block, c, data);
    if (w) out.push(w);
  }
  const otis = block.crew.find((c) => c.ref === 'otis');
  // The Hero, called by whoever asks first.
  const hero = block.hero;
  const H = C.hero;
  if (!hero || !hero.met) out.push({ line: say(block, H.never), delta: 0 });
  else if (liedToHero(block)) out.push({ line: say(block, H.lied), delta: 2 });
  else if (hero.temper <= 1) out.push({ line: say(block, H.calm), delta: -1 });
  else if (hero.temper === 2) out.push({ line: say(block, H.set), delta: 0 });
  else out.push({ line: say(block, H.angry), delta: 1 });
  if (otis) {
    const w = witness(block, otis, data);
    out.push({ line: w && w.delta > 0 ? C.witness.otisAgainst : C.witness.otis, delta: w && w.delta > 0 ? 1 : -1 });
  }
  const oba = block.crew.find((c) => c.ref === 'obadiah');
  if (oba) {
    const missed = logOf(block).filter((e) => e.kind === 'pay' && !e.given).length;
    if (missed === 0) out.push({ line: C.obadiah.paid, delta: -1 });
    else if (missed < 3) out.push({ line: C.obadiah.missed, delta: -1 });
    else out.push({ line: C.obadiah.sits, delta: 0 });
  }
  return out;
}
export const countTotal = (steps: readonly CountStep[]): number => steps.reduce((n, s) => n + s.delta, 0);
/** The band (section 7.6): 0 or less, 1–3, 4–7, 8–12, 13+. A half rounds up: the court counts a half as one. */
export function bandOf(total: number, data: EvilData = EVIL_DATA) {
  const n = Math.ceil(total);
  return D(data).caught.bands.find((b) => n <= b.max) ?? D(data).caught.bands.at(-1)!;
}
const fmt = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function caughtScenes(block: EvilModeBlock, ending: EndingState, data: EvilData): EndScene[] {
  const E = D(data);
  const C = E.caught;
  const title = E.names.caught;
  const sub = ending.sub;
  const how = pick<string>(C.how, sub ?? 'raided') ?? C.how.raided;
  const out: EndScene[] = [scene('court', 'The courtroom', [how])];
  const steps = countSteps(block, sub, data);
  let n = 0;
  steps.forEach((s, i) => {
    n += s.delta;
    out.push(scene(`c${i}`, 'The count', [s.line, fill(C.total, { n: fmt(n) })]));
  });
  const band = bandOf(n, data);
  const regular = [...inRoster(block)].sort((a, b) => b.loyalty - a.loyalty)[0];
  out.push(scene('band', title, [fill(C.total, { n: fmt(n) }), band.sentence, fill(band.after, { name: regular?.name ?? 'Hortense' }), C.nobodyHurt]));
  if (sub === 'raided') {
    const charged = block.crew.filter((c) => c.cell || c.where === 'in').filter((c) => !c.minor);
    const items = listItems(block).length;
    out.push(scene('own', 'The cells', charged.map((c) => {
      const own = Math.max(0, items - c.asked);
      return fill(C.own, { name: c.name, n: own, walks: own === 0 ? C.walksOut : C.stays });
    })));
  }
  out.push(scene('detective', detectiveOf(block, data).name, [C.detective], [{ id: 'skip', label: E.words.skipType }], { typed: E.words.typePrompt }));
  return out;
}

// ---- The scenes of the ending under way ----

export function endingScenes(block: EvilModeBlock, data: EvilData = EVIL_DATA): EndScene[] {
  const e = block.ending;
  if (!e) return [];
  if (e.id === 'scheme') return schemeScenes(block, e.picks, data);
  if (e.id === 'lastRoom') return lastRoomScenes(block, e.picks, e.sub ?? 'away', data);
  if (e.id === 'straight') return straightScenes(block, e.picks, data);
  if (e.id === 'handOff') return handOffScenes(block, e, data);
  if (e.id === 'recruit') return recruitScenes(block, e, data);
  return caughtScenes(block, e, data);
}
export const currentScene = (block: EvilModeBlock, data: EvilData = EVIL_DATA): EndScene | null => (block.ending && !block.ending.done ? endingScenes(block, data)[block.ending.step] ?? null : null);

export interface EndOut { block: EvilModeBlock; problem: string | null; lines: string[]; fight?: boolean }
const refuse = (block: EvilModeBlock, problem: string): EndOut => ({ block, problem, lines: [] });

/** Moves the ending on one scene (or starts its battle), and marks it done after its last. */
function advance(block: EvilModeBlock, picks: Picks, data: EvilData): EndOut {
  const e = block.ending!;
  let next: EvilModeBlock = { ...block, ending: { ...e, picks, step: e.step + 1 } };
  const all = endingScenes(next, data);
  if (next.ending!.step >= all.length) next = { ...next, ending: { ...next.ending!, done: true } };
  return { block: next, problem: null, lines: [] };
}

/** One answer to the scene on screen: a choice, a typed line, or "Go on" (no choice). The step refuses what isn't offered. */
export function endAct(block: EvilModeBlock, choice: string | null, text: string | null, data: EvilData = EVIL_DATA): EndOut {
  const e = block.ending;
  if (!e) return refuse(block, 'No ending has begun.');
  if (e.done) return refuse(block, "The run's over.");
  if (block.fight) return refuse(block, 'A battle is waiting.');
  const s = currentScene(block, data);
  if (!s) return refuse(block, 'Nothing to answer.');
  const picks: Picks = { ...e.picks };
  if (s.typed && text !== null) {
    const t = text.trim();
    if (t.length > 120) return refuse(block, 'Shorter: 120 letters at most.');
    picks[s.key] = `t:${t}`;
    return advance(block, picks, data);
  }
  if (!s.choices.length) return advance(block, { ...picks, [s.key]: 'next' }, data);
  const c = s.choices.find((x) => x.id === choice);
  if (!c) return refuse(block, "That isn't offered here.");
  if (c.id === 'battle' && s.fight) return { block: { ...block, fight: { kind: 'ending', holdingId: s.fight, begun: false } }, problem: null, lines: [], fight: true };
  // Going Straight's knock: "Show me" and "Who else knows?" are answered and the knock waits; "Not yet" puts it off.
  if (s.key === 'knock' && (c.id === 'show' || c.id === 'who')) return { block: { ...block, ending: { ...e, picks: { ...picks, [`knock:${c.id}`]: 'yes' } } }, problem: null, lines: [] };
  if (s.key === 'knock' && c.id === 'notYet') return { block: { ...block, ending: null, applied: [...block.applied.filter((a) => a !== 'ending:straight'), `straight:notYet:${block.here.region}:${block.here.day}`] }, problem: null, lines: [D(data).straight.answers.find((a) => a.id === 'notYet')!.says] };
  // The Recruit's "Don't." is a real answer: the run ends as the Last Room, nobody fights.
  if (s.key === 'offer' && c.id === 'dont') return { block: { ...block, ending: { ...e, id: 'lastRoom', sub: 'talked', step: 0, picks: { ...picks, offer: 'dont' } } }, problem: null, lines: [] };
  picks[s.key] = c.id;
  return advance(block, picks, data);
}

/** The ending's battle is over: its result is the scene's answer. */
export function endBattle(block: EvilModeBlock, won: boolean, data: EvilData = EVIL_DATA): EndOut {
  const e = block.ending;
  const s = currentScene(block, data);
  if (!e || !s || block.fight?.kind !== 'ending') return refuse(block, 'No battle is waiting.');
  const cleared: EvilModeBlock = { ...block, fight: null };
  return advance(cleared, { ...e.picks, [s.key]: won ? 'won' : 'lost' }, data);
}

/** A pressed ending (section 1.1, row 3): the back rooms closed, the Hand-Off, or walking in. Refused here, not only on screen. */
export function pressEnding(block: EvilModeBlock, what: 'straight' | 'handOff' | 'walkIn', o: { heir?: string; line?: string; ledger?: boolean } = {}, data: EvilData = EVIL_DATA): EndOut {
  if (!endingsOn(data)) return refuse(block, 'Not yet.');
  if (block.ending || block.applied.some((a) => a.startsWith('ending:'))) return refuse(block, D(data).words.pressed);
  if (block.fight) return refuse(block, 'A battle is waiting.');
  const p = pressable(block, data).find((x) => x.what === what)!;
  if (p.problem) return refuse(block, p.problem);
  if (what === 'walkIn') return { block: startEnding(block, 'caught', 'walkIn', o.ledger ? 'walkedInLedger' : 'walkedIn'), problem: null, lines: [] };
  if (what === 'straight') return { block: startEnding(block, 'straight', 'button', null), problem: null, lines: [] };
  const heir = heirs(block, data).find((c) => c.id === o.heir);
  if (!heir) {
    const asked = block.crew.find((c) => c.id === o.heir);
    const no = asked?.ref ? pick<string>(D(data).handOff.refuse, asked.ref) : undefined;
    return refuse(block, no ?? D(data).handOff.not.heir);
  }
  const no = heir.ref === 'otis' || heir.ref === 'obadiah' ? pick<string>(D(data).handOff.refuse, heir.ref) : undefined;
  if (no) return { block: { ...block, applied: [...block.applied, `handOff:no:${heir.id}:${block.here.day}`] }, problem: null, lines: [no] };
  const line = (o.line ?? '').trim();
  if (line.length > 120) return refuse(block, 'Shorter: 120 letters at most.');
  return { block: startEnding(block, 'handOff', 'night', null, heir.id, { line: `t:${line}` }), problem: null, lines: [] };
}

// ---- What every ending has: the Ledger's last page, the cards, the pay ----

/** The last thing typed (section 1.3): in the ending if anything was, else the last line said at a fire. */
export function lastTyped(block: EvilModeBlock): string | null {
  const e = block.ending;
  const inEnding = e ? Object.values(e.picks).filter((v) => v.startsWith('t:') && v.length > 2).map((v) => v.slice(2)) : [];
  if (inEnding.length) return inEnding.at(-1)!;
  const fires = (block.hero?.fires ?? []).filter((f) => f.own);
  return fires.at(-1)?.own ?? null;
}

/** What the team did most, by Creed (section 8.3): each job that went and each thing run leans one way. */
export function ledgerSays(block: EvilModeBlock, data: EvilData = EVIL_DATA): string {
  const map = D(data).creedOf as Txt;
  const tally: Record<string, number> = {};
  const add = (k: string | undefined) => { const c = k ? map[k] : undefined; if (c) tally[c] = (tally[c] ?? 0) + 1; };
  for (const e of logOf(block)) if (e.kind === 'job' && e.result === 'went') add(e.method);
  for (const v of block.economy.running) add(v.kind);
  for (const _h of block.scheme.heists) add('heist');
  for (const _d of block.scheme.digs) add('dig');
  const best = Object.entries(tally).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? block.team.creed;
  return pick<string>(D(data).creedName, best) ?? best;
}

/** The Ledger's last page (section 8): the same lines in every ending, and a line only if it happened. No sum, no grade. */
export function ledgerPage(block: EvilModeBlock, data: EvilData = EVIL_DATA): string[] {
  const P = D(data).ledgerPage;
  const out: string[] = [];
  const sign = block.ending ? signName(block, block.ending.picks, data) : null;
  out.push(sign ? fill(P.signChanged, { team: block.team.name, to: sign }) : fill(P.name, { team: block.team.name }));
  out.push(fill(P.creed, { creed: pick<string>(D(data).creedName, block.team.creed) ?? block.team.creed, says: ledgerSays(block, data) }));
  const run = block.economy.running;
  const fam: string[] = [];
  const count = (n: number, one: string, many: string) => (n ? `${n === 1 ? 'One' : n} ${n === 1 ? one : many}` : '');
  fam.push(count(run.filter((v) => v.kind === 'racket').length, 'racket', 'rackets'), count(run.filter((v) => v.kind === 'work').length, 'Work', 'Works'), count(run.filter((v) => v.kind === 'front').length, 'Front', 'Fronts'), count(block.scheme.heists.length, 'heist', 'heists'), count(block.scheme.digs.length, 'Dig', 'Digs'));
  const famList = fam.filter(Boolean);
  if (famList.length) out.push(fill(P.family, { list: famList.join(', ') }));
  out.push(fill(P.totals, { given: block.given, taken: block.taken }));
  const left = block.crew.filter((c) => c.where === 'left');
  const ways: Record<string, number> = {};
  for (const c of left) ways[c.left?.kindly ? 'Handshakes' : 'Left'] = (ways[c.left?.kindly ? 'Handshakes' : 'Left'] ?? 0) + 1;
  const cells = block.crew.filter((c) => c.cell).length;
  if (cells) ways['In the cells'] = cells;
  out.push(fill(P.roster, { hired: block.crew.length, ways: Object.entries(ways).map(([k, n]) => ` ${k}: ${n}.`).join(''), here: inRoster(block).length }));
  const crossed = logOf(block).filter((e) => e.kind === 'asked').length;
  if (crossed || block.crew.some((c) => c.asked)) out.push(fill(P.lines, { crossed }));
  const missed = logOf(block).filter((e) => e.kind === 'pay' && !e.given).length;
  if (logOf(block).some((e) => e.kind === 'pay')) out.push(missed ? fill(P.wage.missed, { n: missed }) : P.wage.all);
  if (block.base || block.applied.some((a) => a.startsWith('base:'))) out.push(block.base?.walked || logOf(block).some((e) => e.kind === 'base' && /[Ww]alk/.test(e.text)) ? P.base.walked : P.base.not);
  const hero = block.hero;
  if (hero && hero.fires.length) {
    const lies = hero.lies.length;
    out.push(fill(P.hero, { fires: hero.fires.filter((f) => !f.missed).length, truth: lies ? fill(P.lies, { n: lies }) : P.truth }));
  }
  if (hero && hero.mother.letters.length) out.push(fill(P.letters, { n: hero.mother.letters.length, read: hero.mother.letters.filter((l) => l.read).length }));
  if (block.neighbour) out.push(fill(P.neighbour, { stance: block.neighbour.stance.charAt(0).toUpperCase() + block.neighbour.stance.slice(1) }));
  const pct = schemePct(block.scheme, data);
  if (pct > 0) out.push(fill(P.scheme, { pct, stamps: (['means', 'place', 'key', 'moment'] as PartId[]).map((k) => { const p = block.scheme.parts[k]; return p.state !== 'inHand' ? '—' : p.clean ? 'clean' : 'not clean'; }).join(', ') }));
  if (block.ending) out.push(fill(P.detective, { line: pick<string>(D(data).cards.detectiveLines, block.ending.id) ?? '' }));
  if (block.ending?.sub === 'letPast') out.push(say(block, D(data).lastRoom.talked.letPastPage));
  const typed = lastTyped(block);
  if (typed) out.push(fill(P.typed, { line: typed }));
  return out;
}

export interface EndCard { title: string; line: string; kind: 'name' | 'scene' | 'person' | 'hero' | 'road' | 'neighbour' | 'detective' | 'page' | 'typed' }

/** One person, a year on (section 9.2): a minor's always Home, whatever the ending. */
export function yearOn(block: EvilModeBlock, c: Crew, data: EvilData = EVIL_DATA): string {
  const Y = D(data).cards.yearOn;
  if (c.minor) return fill(Y.minor, { name: c.name });
  if (c.cell) return fill(Y.cells, { name: c.name });
  if (c.where === 'left') return fill(Y.left, { name: c.name });
  if (c.loyalty >= 7) return fill(Y.high, { name: c.name, doing: pick<string>(D(data).cards.doing, c.talent ?? 'none') ?? D(data).cards.doing.none });
  if (c.loyalty >= 4) return fill(Y.mid, { name: c.name });
  return fill(Y.low, { name: c.name });
}

/** Knocks at Night, as the Log has them: questions asked and lines heard. The first person card's whoever knocked most. */
const knocks = (block: EvilModeBlock, id: string): number => logOf(block).filter((e) => (e.kind === 'ask' || e.kind === 'asked') && e.who.includes(id)).length;

/** The run-end page's cards (section 9.1): up to fourteen, each left out when there's nothing true to put on it. */
export function endingCards(block: EvilModeBlock, data: EvilData = EVIL_DATA): EndCard[] {
  const e = block.ending;
  if (!e) return [];
  const E = D(data);
  const out: EndCard[] = [];
  const sub = e.sub ? pick<string>(E.subs, e.sub) : undefined;
  out.push({ title: E.names[e.id], line: sub ?? E.asks[e.id], kind: 'name' });
  const scenes = endingScenes(block, data);
  const still = [...scenes].reverse().find((s) => s.still) ?? scenes.at(-1);
  if (still) out.push({ title: still.title, line: still.lines.join(' '), kind: 'scene' });
  const everyone = [...block.crew].sort((a, b) => knocks(block, b.id) - knocks(block, a.id) || historyOf(block, b.id) - historyOf(block, a.id));
  const first = everyone[0];
  const rest = [...block.crew].filter((c) => c !== first).sort((a, b) => historyOf(block, b.id) - historyOf(block, a.id));
  for (const c of [first, ...rest].filter((x): x is Crew => !!x).slice(0, 6)) out.push({ title: c.name, line: yearOn(block, c, data), kind: 'person' });
  if (block.hero) out.push({ title: block.hero.name, line: say(block, pick<string>(E.cards.hero, e.id) ?? ''), kind: 'hero' });
  const road = block.road;
  if (road.length) out.push({ title: road.map((r) => r.name).join(', '), line: fill(E.cards.road, { names: road.map((r) => `${r.name}: ${r.state === 'home' ? 'home' : 'still on the road'}`).join('. '), stray: E.cards.strayFound }), kind: 'road' });
  if (block.neighbour) out.push({ title: defOf(block.neighbour, data).boss, line: pick<string>(E.cards.neighbour, block.neighbour.stance) ?? '', kind: 'neighbour' });
  out.push({ title: detectiveOf(block, data).name, line: fill(E.cards.detective, { line: pick<string>(E.cards.detectiveLines, e.id) ?? '' }), kind: 'detective' });
  out.push({ title: E.words.page, line: ledgerPage(block, data).join('\n'), kind: 'page' });
  const typed = lastTyped(block);
  if (typed) out.push({ title: block.team.name, line: typed, kind: 'typed' });
  return out.slice(0, 14);
}

/** The pay (section 9.3): by how far the run got, never by which ending. Regions crossed, districts played and held. */
export function endingPay(block: EvilModeBlock, data: EvilData = EVIL_DATA): { total: number; rows: [string, number][] } {
  const P = D(data).pay;
  const districts = [...block.region.past.map((p) => p.district), ...(block.district && block.district.n >= 1 ? [block.district] : [])];
  const played = districts.filter((d) => d.n >= 1).length;
  const held = districts.reduce((n, d) => n + d.holdings.filter((h) => h.owner === 'team' && h.holds && h.kind !== 'gym').length, 0);
  const rows: [string, number][] = [['The run', P.perRun], ['Regions crossed', runIndex(block) * P.perRegion], ['Districts played', played * P.perDistrict], ['Holdings held', held * P.perHeld]];
  return { total: rows.reduce((n, [, v]) => n + v, 0), rows };
}

/** The Hall of Fame card (Part 1, B6): the one thing this mode writes to the profile, once, at the ending. */
export interface HallCard { runId: string; date: string; team: string; creed: string; ending: EndingId; sub: string | null; day: number; regions: number }
export function hallCard(block: EvilModeBlock, runId: string, date: string): HallCard | null {
  const e = block.ending;
  if (!e?.done) return null;
  return { runId, date, team: block.team.name, creed: block.team.creed, ending: e.id, sub: e.sub, day: block.here.day, regions: runIndex(block) + 1 };
}

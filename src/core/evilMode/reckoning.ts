// Evil Mode slice 12: the Reckoning's rooms and the last room (design Part 21). Pure; no stream is drawn.
// Day 1: the eighth Badge and what the eighth Leader says. Day 2: the approach and one last day; the night before.
// Day 3: the gate, the walk (watched, room by room: it can't be failed by the Hero, only lengthened), the last room.
// The Hero's speech is assembled from the save: an opening by how they know the Boss, then what they've seen, what they
// came for, what you said at a fire, what they were told; every part has a written fallback. In Regions 1 and 2 the last
// room ends the region and never the run (recruitment's refused kindly there).

import { EVIL_DATA, type EvilData } from './data';
import { appendLog, fill } from './ledger';
import { heroReason } from './hero';
import { layoutOf } from './base';
import { routeOf, gridOf } from './baseGrid';
import { roomDef } from './baseFx';
import { bandOf, peopleAt } from './walk';
import { detectiveOf } from './raid';
import { liedToHero, monName, strategistNotebook } from './fires';
import { letterText, YOUNG } from './road';
import { moveTemper } from './temper';
import type { Crew, EvilModeBlock, Hero, ReckState, RoomType, WallState } from './schema';

type Out = { block: EvilModeBlock; problem: string | null; lines: string[]; fight?: boolean };
const no = (block: EvilModeBlock, problem: string): Out => ({ block, problem, lines: [] });
const L = (data: EvilData) => data.lastRoom;

export const reckOn = (data: EvilData = EVIL_DATA): boolean => data.lastRoom.on;
export const newReck = (region: number): ReckState => ({ region, lastDay: null, gone: 0, night: [], gate: [], walk: [], seen: [], room: null });
const reckOf = (block: EvilModeBlock): ReckState => (block.reck && block.reck.region === block.here.region ? block.reck : newReck(block.here.region));

/** The Wall (Part 16 section 7.1), as the last room reads it until its pin-board comes: by Regard and Dread at 5. */
export function wallState(block: Pick<EvilModeBlock, 'team'>): WallState {
  const r = block.team.regard >= 5;
  const d = block.team.dread >= 5;
  return r && d ? 'both' : r ? 'drawings' : d ? 'posters' : 'bare';
}

// ---- Day 1: the eighth Badge (Part 21 section 2) ----

export function eighthLines(block: EvilModeBlock, data: EvilData = EVIL_DATA): string[] {
  const hero = block.hero;
  if (!hero || !reckOn(data)) return [];
  const G = L(data).eighth.giovanni;
  const t = block.team;
  const leader = t.regard > t.dread ? G.regard : t.dread > t.regard ? G.dread : G.level;
  const out = [`Giovanni, to the Hero: "${leader}"`, `${hero.name}: ${L(data).eighth.answers[hero.personality]}`];
  // The street: a holding Leaned on and then waived speaks as they pass (read from the Ledger; nobody, if none).
  const lean = block.log.find((e) => e.kind === 'job' && e.method === 'lean' && e.result === 'went' && e.to && block.rates[e.to] === 'waived');
  const h = lean ? block.district?.holdings.find((x) => x.id === lean.to) : undefined;
  if (h) out.push(fill(L(data).eighth.baker, { where: h.ref }));
  return out;
}

// ---- Day 2: the approach, one last day, the night before (Part 21 section 3; Part 20 section 10) ----

export function approachLines(block: EvilModeBlock, data: EvilData = EVIL_DATA): string[] {
  return block.road.map((t) => (t.state === 'on' ? data.road.approach[t.role] : fill(data.road.board.gap!, { name: t.name })));
}

export type LastDay = NonNullable<ReckState['lastDay']>;

export function lastDay(block: EvilModeBlock, what: LastDay, data: EvilData = EVIL_DATA): Out {
  const D = L(data).lastDay;
  if (!reckOn(data) || block.here.stage < 8 || block.here.beat !== 'inPerson' || dayOfReck(block) !== 2) return no(block, D.notNow);
  if (block.inPerson?.day === block.here.day) return no(block, 'The Boss has already been out today.');
  const r = reckOf(block);
  if (r.lastDay) return no(block, D.used);
  const o = D.options[what];
  if (!o) return no(block, 'Pick one.');
  let out: EvilModeBlock = { ...block, inPerson: { day: block.here.day, holdingId: 'base' } };
  let line = o.said!;
  let gone = 0;
  if (what === 'go') {
    const inn = [...out.crew].filter((c) => c.where === 'in' && c.rank !== 'executive').sort((a, b) => a.loyalty - b.loyalty || a.id.localeCompare(b.id));
    const leaving = new Set(inn.slice(0, Math.floor(inn.length / 5)).map((c) => c.id));
    gone = leaving.size;
    out = { ...out, crew: out.crew.map((c) => (leaving.has(c.id) ? { ...c, where: 'left' as const, left: { day: block.here.day, how: 'reckoning' as const, kindly: true } } : c)) };
    line = fill(line, { n: gone, s: gone === 1 ? '' : 's' });
  }
  if (what === 'soup') line = block.road.some((t) => t.role === 'friend' && t.state === 'on') ? o.taken! : o.left!;
  out = { ...out, reck: { ...r, lastDay: what, gone } };
  return { block: appendLog(out, { kind: 'base', who: [], text: `Day ${block.here.day}. ${line}` }), problem: null, lines: [line] };
}

/** The Reckoning's day (1..3, more if the base delays them). */
export const dayOfReck = (block: EvilModeBlock): number => block.here.day - (block.district?.from ?? 1) + 1;

/** The night before (Part 21 section 3.2): forty seconds, no choices, built from the Roster's bands. Then the knock. */
export function nightBefore(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  if (!reckOn(data) || block.here.stage < 8 || !block.hero) return block;
  const r = reckOf(block);
  if (r.night.length) return block;
  const N = L(data).night;
  const lines = [N.title];
  for (const c of block.crew.filter((x) => x.where === 'in').slice(0, 8)) lines.push(fill(N.bands[bandOf(c.loyalty, data).word] ?? N.bands.Steady!, { name: c.name }));
  if (block.hero.mother.hot) lines.push(N.hot);
  const exec = block.crew.find((c) => c.where === 'in' && c.rank === 'executive');
  lines.push(exec ? fill(N.knockExec, { name: exec.name }) : N.knock);
  return { ...block, reck: { ...r, night: lines } };
}

// ---- Day 3: the gate, the walk (Part 21 sections 4 and 5) ----

export function gateLines(block: EvilModeBlock, data: EvilData = EVIL_DATA): string[] {
  const G = L(data).gate;
  const out: string[] = [];
  const leaders = (block.gyms ?? []).filter((g) => g.region === block.here.region && g.way);
  let bent = 0;
  for (const g of leaders) {
    const def = data.gym.leaders.find((l) => l.id === g.leaderId);
    const leader = def?.name ?? g.leaderId;
    if (g.way === 'bend' && bent++ < 3) out.push(def?.gate ? fill(G.bend!, { leader, line: def.gate }) : fill(G.bendNone!, { leader }));
    else if (g.way === 'befriend') out.push(fill(G.befriend!, { leader }));
    else if (g.way === 'buy') out.push(fill(G.buy!, { leader }));
    else if (g.way === 'beat') out.push(fill(G.beat!, { leader }));
    else if (g.way === 'replace') out.push(fill(G.replace!, { leader }));
  }
  const hs = block.district?.holdings ?? [];
  if (hs.some((h) => h.owner === 'team' && h.mood === 'warm')) out.push(G.warm!);
  if (hs.some((h) => h.mood === 'shut')) out.push(G.shut!);
  if (block.team.heat >= 5) out.push(fill(G.detective!, { name: detectiveOf(block, data).name }));
  return out.length ? out : [G.nobody!];
}

/** The walk, watched: every room writes a line; every door is a fight or a step aside. It can only be lengthened. */
export function reckWalk(block: EvilModeBlock, data: EvilData = EVIL_DATA): { block: EvilModeBlock; lines: string[]; seen: string[] } {
  const W = L(data).walk as Record<string, string> & { exec: Record<string, string>; priority: string[] };
  const lines = [W.start!];
  const b = block.base;
  let hero = block.hero!;
  if (!b) return { block, lines: [...lines, W.noBase!], seen: [] };
  const route = routeOf(layoutOf(b), data);
  const g = gridOf(b.site, data);
  const bump = block.reck?.lastDay === 'go' ? 2 : 0;
  const passed: RoomType[] = [];
  let fights = 0;
  for (const sq of route) {
    const r = b.rooms.find((x) => x.at === sq);
    if (r && r.type !== 'office') {
      passed.push(r.type);
      lines.push(`${roomDef(r.type, data).name}. ${r.type === 'pen' && !b.latch ? W.penOpen : roomDef(r.type, data).says}`);
    }
    if (sq === g.office) break;
    for (const c of peopleAt(block, b, sq, data)) {
      const band = bandOf(Math.min(10, c.loyalty + bump), data);
      if (band.does === 'opened') lines.push(fill(W.opened!, { name: c.name }));
      else if (band.does === 'aside') lines.push(fill(W.aside!, { name: c.name, says: band.says }));
      else {
        if (c.flaw === 'kind') lines.push(fill(W.kind!, { name: c.name }));
        lines.push(fill(W.fight!, { name: c.name }), fill(W.won!, { name: c.name }));
        fights++;
        if (band.does === 'again') { lines.push(fill(W.again!, { name: c.name })); fights++; }
      }
    }
  }
  if (!fights) lines.push(W.nobody!);
  // The Pen, seen: +1; seen with the latch off: −1. No Pen at all is a line of its own.
  if (passed.includes('pen')) hero = moveTemper(hero, b.latch ? 1 : -1, b.latch ? 'pen' : 'penOpen', data);
  else lines.push(W.noPen!);
  const exec = block.crew.find((c) => c.where === 'in' && c.rank === 'executive');
  if (exec) lines.push(fill(W.exec[exec.loyalty >= 9 ? '9' : exec.loyalty >= 7 ? '7' : '0']!, { name: exec.name }));
  lines.push(W.office!);
  hero = { ...hero, marks: Math.min(data.hero.marks.max, hero.marks + fights), battlesWithTeam: hero.battlesWithTeam + fights };
  const order = W.priority as string[];
  const seen = [...new Set(passed)].sort((a, b2) => (order.indexOf(a) + 99) % 99 - (order.indexOf(b2) + 99) % 99).slice(0, 2).map((t) => (t === 'pen' && !b.latch ? W.penOpen! : roomDef(t, data).says));
  if (!passed.includes('pen')) seen.push(W.noPen!);
  return { block: { ...block, hero }, lines, seen: seen.slice(0, 3) };
}

// ---- The last room (Part 21 section 6) ----

/** How it opens: by how they know the Boss (Part 21 section 6.1). A fire missed is gone and this changes. */
export function openingLine(block: EvilModeBlock, data: EvilData = EVIL_DATA): string {
  const O = L(data).open;
  const hero = block.hero!;
  const fires = hero.fires.filter((f) => !f.missed);
  if (block.reck?.lastDay === 'leave') return O.away;
  if (hero.told) return O.told;
  if (liedToHero(block) && hero.lies.some((l) => l.kind === 'justWork')) return O.lied;
  if (fires.some((f) => f.n === 'third' || f.n === 'last')) return O.knew;
  return fires.length ? O.fire : O.noFire;
}

/** What they say next, from the whole run (section 6.2): seen, came for, what you said, what they were told. */
export function assembleSpeech(block: EvilModeBlock, seen: readonly string[], gate: readonly string[], data: EvilData = EVIL_DATA): string[] {
  const P = L(data).parts;
  const hero = block.hero!;
  const reason = heroReason(block, data);
  const out: string[] = [];
  out.push(seen.length ? fill(P.seen!, { seen: seen.join(' ') }) : P.seenNone!);
  out.push(L(data).wall[wallState(block)]);
  out.push(L(data).creed[block.team.creed as 'profit']?.door ?? '');
  out.push(reason ? fill(P.came!, { reason: reason.reason.says }) : P.cameNone!);
  const fire = hero.fires.filter((f) => !f.missed).at(-1);
  const Q = data.fires.quoted;
  out.push(!fire ? Q.none : fire.own ? fill(Q.said, { own: fire.own }) : Q.silence);
  if (hero.heroLine) out.push(fill(L(data).heroLine, { line: hero.heroLine }));
  const leaderAtGate = gate.find((g) => g.includes('"'));
  const letter = [...hero.mother.letters].reverse().find((l) => l.mood !== 'none' && l.read);
  if (leaderAtGate) out.push(fill(P.told!, { told: leaderAtGate }));
  else if (letter) out.push(fill(P.letter!, { letter: letterText(hero, letter, data)[0]! }));
  else out.push(P.toldNone!);
  out.push(P.ask!);
  return out.filter(Boolean);
}

/** Day 3: down off the wall. The gate, the walk, and the room opens. */
export function openLastRoom(block: EvilModeBlock, data: EvilData = EVIL_DATA): { block: EvilModeBlock; lines: string[] } {
  const r = reckOf(block);
  const gate = gateLines(block, data);
  const w = reckWalk(block, data);
  let out = w.block;
  const open = openingLine(out, data);
  const away = r.lastDay === 'leave';
  const speech = away ? [L(data).awayLeaves[out.hero!.personality]] : assembleSpeech(out, w.seen, gate, data);
  const room: NonNullable<ReckState['room']> = { open, speech, lines: [], asked: false, offered: false, shown: [], answer: null, outcome: null, stepped: null };
  out = { ...out, reck: { ...r, gate, walk: w.lines, seen: w.seen, room } };
  if (away) out = finishRoom(out, 'away', data);
  return { block: out, lines: [...gate, ...w.lines] };
}

export interface RoomOption { what: 'answer' | 'show' | 'battle' | 'ask' | 'window' | 'offer' | 'nothing'; kind?: string; who?: string; name: string }

const avgLoyalty = (crew: readonly Crew[]) => { const inn = crew.filter((c) => c.where === 'in'); return inn.length ? inn.reduce((n, c) => n + c.loyalty, 0) / inn.length : 0; };
const largeOffice = (block: EvilModeBlock) => !!block.base?.rooms.some((r) => r.type === 'office' && r.size >= 3);

/** What the player can do in the room (section 6.3), each gated by the run's state. Battle's first at Angry or above. */
export function roomOptions(block: EvilModeBlock, data: EvilData = EVIL_DATA): RoomOption[] {
  const room = block.reck?.room;
  const hero = block.hero;
  if (!room || room.outcome || !hero || block.fight) return [];
  const C = L(data).choices;
  const A = L(data).answers;
  const S = L(data).show;
  const out: RoomOption[] = [];
  const given = block.given;
  const taken = block.taken;
  const answers: [string, boolean][] = [['creed', true], ['first', true], ['dontKnow', Math.abs(given - taken) <= Math.max(given, taken) / 5], ['forThem', avgLoyalty(block.crew) >= 7], ['scheme', false], ['lie', true]];
  for (const [k, ok] of answers) if (ok) out.push({ what: 'answer', kind: k, name: `${C.answer}: ${A[k as 'creed'].name}` });
  const shows: [string, boolean][] = [['ledger', true], ['pen', !!block.base?.rooms.some((r) => r.type === 'pen')], ['wall', true], ['window', largeOffice(block)], ['notebook', hero.personality === 'strategist']];
  for (const [k, ok] of shows) if (ok && !room.shown.includes(k)) out.push({ what: 'show', kind: k, name: `${C.show}: ${S[k as 'ledger'].name}` });
  for (const c of block.crew.filter((x) => x.where === 'in').slice(0, 6)) out.push({ what: 'show', kind: 'someone', who: c.id, name: `${C.show}: ${c.name}` });
  if (hero.temper <= 2 && !room.asked) out.push({ what: 'ask', name: C.ask });
  if (largeOffice(block)) out.push({ what: 'window', name: C.window });
  if (!room.offered) out.push({ what: 'offer', name: C.offer });
  out.push({ what: 'nothing', name: C.nothing });
  const battle: RoomOption = { what: 'battle', name: C.battle };
  return hero.temper >= 3 ? [battle, ...out] : [...out, battle];
}

/** Recruitment's gates (Part 21 section 6.3): Clean hands or Grey; never lied to; and in Regions 1 and 2 they say no, kindly. */
function offerWhy(block: EvilModeBlock): string | null {
  if (block.team.line === 'whatever') return 'Clean hands or Grey only.';
  if (liedToHero(block)) return 'You lied to them.';
  return null;
}

/** One thing done in the room. Ends it (with an outcome) or leaves it open (asked, offered). */
export function roomAct(block: EvilModeBlock, o: { what: RoomOption['what']; kind?: string; who?: string }, data: EvilData = EVIL_DATA): Out {
  const room = block.reck?.room;
  const hero = block.hero;
  if (!room || !hero || room.outcome) return no(block, 'The room is closed.');
  if (block.fight) return no(block, 'A battle is waiting.');
  const opt = roomOptions(block, data).find((x) => x.what === o.what && (x.kind ?? '') === (o.kind ?? '') && (x.who ?? '') === (o.who ?? ''));
  if (!opt) return no(block, "That isn't open here.");
  const R = L(data);
  const set = (b: EvilModeBlock, patch: Partial<NonNullable<ReckState['room']>>) => ({ ...b, reck: { ...b.reck!, room: { ...b.reck!.room!, ...patch } } });
  const said = (lines: string[]) => [...room.lines, ...lines];
  const battle = (b: EvilModeBlock, lines: string[]): Out => ({ block: { ...set(b, { lines: said([...lines, fill(R.battleFirst, { mon: monName(hero.starter) })]) }), fight: { kind: 'room', holdingId: 'base', begun: false } }, problem: null, lines, fight: true });
  if (o.what === 'battle') return battle(block, []);
  if (o.what === 'ask') { const l = R.ask[hero.personality]; return { block: set(block, { asked: true, lines: said([l]) }), problem: null, lines: [l] }; }
  if (o.what === 'offer') {
    const why = offerWhy(block);
    const l = why ? fill(R.offerShut, { why }) : R.offerRefused;
    return { block: set(block, { offered: true, lines: said([l]) }), problem: null, lines: [l] };
  }
  if (o.what === 'window') return { block: finishRoom(set(block, { lines: said([R.outcomes.window.hero]) }), 'window', data), problem: null, lines: [R.outcomes.window.hero] };
  if (o.what === 'answer') {
    const k = o.kind as keyof typeof R.answers;
    const a = R.answers[k];
    const cr = R.creed[block.team.creed as 'profit'];
    let lines = [`You: ${a.say}`];
    let h: Hero = hero;
    if (k === 'creed') lines = [`You: "${data.creeds.find((c) => c.id === block.team.creed)?.line ?? ''}"`, block.given >= block.taken ? cr.held : cr.not];
    else if (k === 'first') { lines = [`You: ${cr.first}`, a.hero!]; h = moveTemper(h, -1, 'fire', data); }
    else lines.push(a.hero!);
    let b: EvilModeBlock = { ...set(block, { answer: k === 'creed' || k === 'first' ? lines[0]!.replace(/^You: /, '') : a.say }), hero: h };
    if (k === 'lie') { b = { ...b, hero: { ...h, lies: [...h.lies, { kind: 'room', day: block.here.day, region: block.here.region }] } }; return battle(b, lines); }
    if (h.temper >= 3) return battle(b, lines);
    b = set(b, { lines: said(lines) });
    return { block: finishRoom(b, 'talked', data), problem: null, lines };
  }
  // Showing (section 6.5) and saying nothing.
  const S = R.show;
  let lines: string[];
  let b = block;
  if (o.what === 'nothing') lines = [S.nothing.hero, ...(block.reck?.seen.slice(0, 1) ?? [])];
  else if (o.kind === 'wall') lines = [S.wall.hero, R.wall[wallState(block)]];
  else if (o.kind === 'notebook') lines = [S.notebook.hero, ...strategistNotebook(block, data).rows.map(([w]) => `${w} — Why? (written in)`)];
  else if (o.kind === 'someone') {
    const c = block.crew.find((x) => x.id === o.who)!;
    lines = [fill(S.someone.hero, { name: c.name, says: R.someone[bandOf(c.loyalty, data).word] ?? R.someone.Steady! })];
  } else lines = [S[o.kind as 'ledger'].hero];
  b = set(b, { shown: [...room.shown, o.kind ?? 'nothing'], lines: said(lines) });
  return { block: finishRoom(b, 'talked', data, o.kind), problem: null, lines };
}

/** The room's battle is over. The Boss won: if anyone with line 31's on the Roster, it's a draw (they stepped in). */
export function roomResult(block: EvilModeBlock, bossWon: boolean, data: EvilData = EVIL_DATA): { block: EvilModeBlock; lines: string[] } {
  const room = block.reck?.room;
  if (!room) return { block: { ...block, fight: null }, lines: [] };
  const b0 = { ...block, fight: null };
  const O = L(data).outcomes;
  if (bossWon) {
    const stepper = block.crew.find((c) => c.where === 'in' && c.line === 31);
    if (stepper) {
      const lines = [fill(O.draw.stepIn!, { name: stepper.name }), fill(O.draw.hero, { name: stepper.name })];
      const b = { ...b0, reck: { ...b0.reck!, room: { ...room, stepped: stepper.id, lines: [...room.lines, ...lines] } } };
      return { block: finishRoom(b, 'draw', data), lines };
    }
    const l = fill(O.bossWon.hero, { mon: monName(block.hero!.starter) });
    return { block: finishRoom({ ...b0, reck: { ...b0.reck!, room: { ...room, lines: [...room.lines, l] } } }, 'bossWon', data), lines: [l] };
  }
  const l = O.heroWon.hero;
  return { block: finishRoom({ ...b0, reck: { ...b0.reck!, room: { ...room, lines: [...room.lines, l] } } }, 'heroWon', data), lines: [l] };
}

const bump = (c: Crew, by: number): Crew => ({ ...c, loyalty: Math.max(0, Math.min(10, c.loyalty + by)) });

/**
 * The room's over (section 6.7), the same night (section 8): the Roster's Loyalty, the File's new page, the Evening's one
 * screen, and the region ends. Never the run: a lost base is the base and the district, half the Funds outside a Counting
 * Room, and whoever's under 4 goes home.
 */
export function finishRoom(block: EvilModeBlock, outcome: NonNullable<NonNullable<ReckState['room']>['outcome']>, data: EvilData = EVIL_DATA, shown?: string): EvilModeBlock {
  const R = L(data);
  const room = block.reck!.room!;
  const hero0 = block.hero!;
  const inn = (c: Crew) => c.where === 'in';
  let crew = block.crew;
  let team = block.team;
  let base = block.base;
  const notes: string[] = [];
  if (outcome === 'talked') { crew = crew.map((c) => (inn(c) && c.talent === 'heart' ? bump(c, 1) : c)); notes.push(R.roster.talked!); }
  if (outcome === 'bossWon') { crew = crew.map((c) => (!inn(c) ? c : c.talent === 'nerve' || c.flaw === 'proud' ? bump(c, 1) : c.flaw === 'kind' ? bump(c, -1) : c)); notes.push(R.roster.bossWon!); }
  if (outcome === 'heroWon') {
    const counting = !!base?.rooms.some((r) => r.type === 'counting');
    base = null;
    team = { ...team, funds: counting ? team.funds : Math.floor(team.funds / 2) };
    crew = crew.map((c) => (inn(c) && c.loyalty < 4 ? { ...c, where: 'left' as const, left: { day: block.here.day, how: 'reckoning' as const } } : c));
    notes.push(R.roster.heroWon!);
  }
  if (outcome === 'draw') {
    const s = room.stepped;
    crew = crew.map((c) => (!inn(c) ? c : c.id === s ? { ...c, loyalty: 10 } : bump(c, YOUNG.includes(c.line ?? 0) ? 1 : -1)));
    notes.push(fill(R.roster.draw!, { name: block.crew.find((c) => c.id === s)?.name ?? '' }));
  }
  if (outcome === 'away') { crew = crew.map((c) => (inn(c) ? bump(c, -1) : c)); notes.push(R.roster.away!); }
  if (outcome === 'window') { crew = crew.map((c) => (inn(c) ? bump(c, -2) : c)); notes.push(R.roster.window!); }
  if (shown === 'ledger') { crew = crew.map((c) => (inn(c) && c.talent === 'books' ? bump(c, 1) : c)); notes.push(R.roster.ledger!); }
  if (shown === 'pen') { crew = crew.map((c) => (inn(c) && c.flaw === 'kind' ? bump(c, 2) : c)); notes.push(R.roster.pen!); }
  const hero: Hero = { ...hero0, pages: [...hero0.pages, pageOf(block, outcome, data)] };
  const leaving = R.outcomes[outcome].hero;
  const d = block.district!;
  const count = d.holdings.filter((h) => h.owner === 'team' && h.kind !== 'gym').length;
  const regionName = data.region.regions.find((r) => r.index === block.here.region)?.name ?? 'The region';
  const evening = [...block.evening, fill(leaving, { mon: monName(hero0.starter), name: block.crew.find((c) => c.id === room.stepped)?.name ?? '' }), R.evening, ...notes, fill(R.regionOver, { region: regionName })];
  let out: EvilModeBlock = { ...block, crew, team, base, hero, reck: { ...block.reck!, room: { ...room, outcome } }, district: { ...d, end: { how: 'reckoning', day: block.here.day, count } }, evening };
  out = appendLog(out, { kind: 'hero', who: room.stepped ? [room.stepped] : [], text: `Day ${block.here.day}. The last room: ${R.outcomes[outcome].page}` });
  return out;
}

/** The File's new page (section 8.2): the last room from the other side, in the Hero's hand. */
export function pageOf(block: EvilModeBlock, outcome: NonNullable<NonNullable<ReckState['room']>['outcome']>, data: EvilData = EVIL_DATA): string[] {
  const P = L(data).page;
  const hero = block.hero!;
  const room = block.reck?.room;
  const reason = heroReason(block, data);
  const out = [hero.fires.some((f) => !f.missed) ? P.fire : P.noFire];
  out.push(room?.answer ? fill(P.asked, { answer: `They said: ${room.answer}` }) : P.noAnswer);
  out.push(L(data).outcomes[outcome].page);
  if (reason) out.push(fill(P.reason, { reason: reason.reason.says }));
  out.push(P.close[hero.personality]);
  if (block.reck?.lastDay === 'soup' && block.road.some((t) => t.role === 'friend' && t.state === 'on')) out.push(P.soup);
  return out;
}

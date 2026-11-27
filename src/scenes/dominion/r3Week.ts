// DOMINION redesign R3: the live data for the six pages with R3's own rules (theDay.ts): Rotom's forecast, Travel,
// the Timetable, the Flooded tunnel, the Newsstand and the Scrapbook. Reads the block and the run; never changes them.

import type Phaser from 'phaser';
import { DOMINION_DATA } from '../../core/dominion/data';
import { districtDef, statusOf, travel } from '../../core/dominion/field';
import { teamColours } from '../../core/dominion/founding';
import { paperModel } from '../../core/dominion/moments';
import type { DominionBlock } from '../../core/dominion/schema';
import {
  interviewDue, knowsMove, pathOf, rivalName, routeOf, ROUTES, skyDef, skyOf, storyAt, THE_DAY, tollsOn, floodedOn, waysTo, weatherOn, wetOf, WETS, type Sky,
} from '../../core/dominion/theDay';
import { fill } from '../../core/dominion/worldTurn';
import type { RunState } from '../../core/state';
import { SP, type R5Speaker } from '../../ui/redux/screens/dominion/r50/kit';
import type { R5Flood, R5Forecast, R5Papers, R5Scrap, R5Timetable, R5Travel } from '../../ui/redux/screens/dominion/r50/day4';
import { memberPic } from '../../ui/redux/screens/dominion/teamPic';
import { facePic } from './r50Bridge';
import { monPic } from './r4Bridge';

const ROTOM: R5Speaker = { name: 'Rotom', k: 'p-rotom' };
const T = () => THE_DAY.travel;
const P = () => THE_DAY.papers;
const name = (id: string): string => districtDef(id)?.name ?? id;
const region = (): string => DOMINION_DATA.field.region.replace(/^./, (c) => c.toUpperCase());
const team = (b: DominionBlock): string => b.team?.name ?? b.teamName ?? 'Your crew';
/** A paper's deck on the stand: a long one keeps its first clause (the morning paper prints it whole). */
const short = (t: string): string => (t.length <= 44 ? t : t.split(/[;,:]\s/)[0]!.replace(/[.]$/, ''));
const plural = (n: number, w: string): string => `${n} ${w}${n === 1 ? '' : 's'}`;

// ---------- the forecast ----------

export function forecastModel(b: DominionBlock, run: RunState, at: number): R5Forecast {
  const n = THE_DAY.weather.forecast, Wd = THE_DAY.weather.words;
  const skies: Sky[] = Array.from({ length: n }, (_, i) => (i === 0 ? skyOf(b) : weatherOn(run.seed, b.day + i)));
  const days = skies.map((s, i) => ({ d: b.day + i, icon: skyDef(s).icon, word: skyDef(s).word }));
  const k = Math.max(0, Math.min(n - 1, at)), def = skyDef(skies[k]!);
  const best = Object.entries(def.odds).sort((x, y) => (y[1] ?? 0) - (x[1] ?? 0))[0];
  const tip = best && (best[1] ?? 0) > 0 ? fill(Wd.tipGood, { stat: best[0] }) : def.heat > 0 || def.flood || Object.values(def.odds).some((v) => (v ?? 0) < 0) ? Wd.tipBad : Wd.tipNone;
  return {
    region: region(), days, at: k,
    head: `Day ${b.day + k} · ${def.word}${k === 0 ? ` · ${Wd.today}` : ''}`,
    fx: def.fx.map(([cls, label, line]) => ({ cls, label, line })),
    line: fill(Wd.rotom, { day: k === 0 ? Wd.today : `Day ${b.day + k}`, word: def.word, tip }),
  };
}

// ---------- travel ----------

const ICON: Record<(typeof ROUTES)[number], string> = { road: 'g-bicycle', back: 'g-dark-gem', train: 'g-member-card' };

function holderColour(b: DominionBlock, id: string): string {
  const d = b.field.districts[id];
  const st = d ? statusOf(d) : 'out';
  return st === 'owned' || st === 'held' ? teamColours(b)?.primary ?? '#e0294a' : st === 'rival' ? '#6a6f86' : st === 'contested' || st === 'foot' ? '#f2b632' : '#3d4256';
}

export function travelModel(b: DominionBlock, run: RunState, to: string, at: number, notice: string | null): R5Travel {
  const path = pathOf(b, b.field.at, to) ?? [b.field.at, to];
  const tolls = new Set(tollsOn(b, path));
  const walk = travel(b, run, to).cost;
  const ways = waysTo(b, run, to, walk);
  const m = b.members[0];
  const now = Math.max(0, ROUTES.indexOf(routeOf(b)));
  const flooded = floodedOn(b, path);
  return {
    from: name(b.field.at), to: name(to),
    stops: path.slice(0, 6).map((id) => ({ name: name(id), colour: holderColour(b, id), toll: tolls.has(id) })),
    walker: m ? memberPic(m.look, 56, 'width:40px;height:56px;object-fit:contain;object-position:bottom', teamColours(b)) : SP('c-rook', 56),
    ways: ways.map((w) => ({
      name: w.name, what: [w.what, ...w.notes].join(' · '), icon: ICON[w.id], why: w.why,
      big: w.id === 'train' ? `₽${w.money}` : plural(w.actions, 'action'),
      small: w.id === 'train' ? (w.heat ? `police · Heat +${w.heat}` : 'no actions') : w.money ? `toll · ₽${w.money}` : 'no toll',
    })),
    at: Math.max(0, Math.min(ways.length - 1, at)), now,
    who: null,
    line: notice ?? '',
    flooded,
  };
}

// ---------- the Timetable ----------

/** Where each station sits on the metro map (mockup `timetable`). */
const XY: Record<string, [number, number]> = {
  pewter: [90, 60], viridian: [90, 170], cerulean: [330, 60], celadon: [210, 170], saffron: [330, 170], lavender: [450, 170], vermilion: [330, 260], fuchsia: [210, 260],
};
const clock = (min: number): string => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** The trains from the Boss's station today, one to each other station: [district id, row]. */
export function departures(b: DominionBlock): { id: string; time: string; to: string; pl: number; status: string; cls: '' | 'd-bad' | 'd-warn' }[] {
  const Tr = T(), at = b.field.at;
  if (!Tr.stations.includes(at)) return [];
  const sky = skyDef(skyOf(b)), W = Tr.ways.train;
  return Tr.stations.filter((s) => s !== at).map((id, i) => {
    const li = Tr.lines.findIndex((l) => l.stops.includes(id) && l.stops.includes(at));
    const pl = (li >= 0 ? li : Tr.lines.findIndex((l) => l.stops.includes(id))) + 1;
    const hot = (b.field.districts[id]?.heat ?? 0) >= (W.policeAt ?? 101);
    const d = b.field.districts[id];
    const status = !sky.trains ? Tr.lines2.cancelled! : hot ? fill(Tr.lines2.police!, { n: W.policeHeat ?? 0 }) : d && statusOf(d) === 'rival' ? `${rivalName()} turf` : Tr.lines2.onTime!;
    const cls = !sky.trains || hot ? 'd-bad' as const : d && statusOf(d) === 'rival' ? 'd-warn' as const : '' as const;
    return { id, time: clock(Tr.first * 60 + 10 + i * Tr.every), to: name(id), pl, status, cls };
  });
}

export function timetableModel(b: DominionBlock, at: number, notice: string | null): R5Timetable {
  const Tr = T(), rows = departures(b);
  const k = Math.max(0, Math.min(rows.length - 1, at));
  const o = (id: string): 'own' | 'foe' | 'none' => { const d = b.field.districts[id]; const st = d ? statusOf(d) : 'out'; return st === 'owned' || st === 'held' ? 'own' : st === 'rival' ? 'foe' : 'none'; };
  const sky = skyDef(skyOf(b));
  const r = rows[k];
  return {
    stations: Tr.stations.filter((s) => XY[s]).map((id) => ({ id, name: name(id), x: XY[id]![0], y: XY[id]![1], o: o(id), here: id === b.field.at })),
    lines: Tr.lines.map((l) => ({ colour: l.colour, d: l.stops.filter((s) => XY[s]).map((s, i) => `${i ? 'L' : 'M'}${XY[s]![0]},${XY[s]![1]}`).join(' ') })),
    rows, at: k,
    sub: `${team(b)} Magnet Line · ${sky.trains ? 'today' : 'storm'}`,
    legend: [team(b), rivalName(), 'Nobody yet'],
    who: notice ? null : ROTOM,
    line: notice ?? (!rows.length ? `Bzzt! ${Tr.lines2.noStation!} in ${name(b.field.at)}.` : !sky.trains ? `Bzzt! ${Tr.lines2.cancelled!}. Walk today.` : `Bzzt! The ${r!.time} to ${r!.to}: ${r!.status}. Fare ₽${Tr.ways.train.fare ?? 0}.`),
  };
}

// ---------- the Flooded tunnel ----------

export function floodModel(scene: Phaser.Scene, b: DominionBlock, run: RunState, at: number, notice: string | null): R5Flood {
  const Fl = T().flood, move = Fl.ride.move ?? 'surf';
  const surfer = run.party.find((m) => m.moves.some((x) => x.id === move));
  const k = Math.max(0, Math.min(2, at));
  const lead = b.members[0];
  return {
    sub: 'Underground Path · 5 ↔ 6',
    people: [
      ...b.members.slice(0, 3).map((m) => memberPic(m.look, 70, 'width:46px;height:70px;object-fit:contain;object-position:bottom', teamColours(b))),
    ],
    rider: surfer ? monPic(scene, surfer.speciesId, 70) : null,
    ways: WETS.map((w) => ({
      name: w === 'ride' && surfer ? `Ride ${surfer.speciesId.replace(/^./, (c) => c.toUpperCase())}` : Fl[w].name,
      what: Fl[w].what, cost: Fl[w].cost, cls: w === 'ride' ? 'ok' as const : w === 'wade' ? 'mid' as const : 'bad' as const,
      why: w === 'ride' && !knowsMove(run, move) ? T().lines2.noSurf! : null,
    })),
    at: k, now: WETS.indexOf(wetOf(b)),
    who: notice ? null : lead ? { name: lead.name, pic: facePic(lead.look, b, 40), colour: '#3f7fd9' } : ROTOM,
    line: notice ?? `“${T().lines2.flooded!} Water’s up to my knees, Boss. Which way?”`,
  };
}

// ---------- the Newsstand and the Scrapbook ----------

export function papersModel(b: DominionBlock, run: RunState, at: number, asking: boolean, notice: string | null): R5Papers {
  const m = paperModel(b, run.seed, run.ai);
  const jobs = (b.paper?.jobs ?? []).filter((j) => j.d === b.day - 1);
  const where = storyAt(b), d = b.field.districts[where];
  const quiet = !jobs.length;
  const Pp = P(), L = Pp.lines;
  const vars = { district: name(where), DISTRICT: name(where).toUpperCase(), team: team(b), TEAM: team(b).toUpperCase(), colour: (b.team?.primary ?? 'purple').toUpperCase(), region: region() };
  const pick = (a: readonly string[], salt: number): string => fill(a[(b.day + salt) % a.length]!, vars);
  const heat = jobs.reduce((a, j) => a + j.heat, 0);
  const lead = b.members[0];
  const photo = lead ? memberPic(lead.look, 90, 'height:90px;width:56px;object-fit:contain;object-position:bottom', teamColours(b)) : SP('p-rotom', 90);
  const papers: R5Papers['papers'] = [
    { mast: m.masthead, head: m.head, deck: short(m.deck), pic: photo, fx: quiet ? '' : fill(L.plainFx!, { n: `${heat >= 0 ? '+' : ''}${heat}` }), cls: 'plain' },
    { mast: fill(Pp.city, vars), head: quiet ? pick(Pp.heads.quiet, 1) : pick(Pp.heads.fear, 0), deck: quiet ? Pp.decks.quiet : Pp.decks.fear, pic: SP('t-grunt', 90), fx: fill(L.fearFx!, { n: d?.dread ?? 0 }), cls: 'fear' },
    { mast: Pp.gazette, head: quiet ? pick(Pp.heads.quiet, 2) : pick(Pp.heads.kind, 0), deck: quiet ? Pp.decks.quiet : Pp.decks.kind, pic: SP('p-growlithe', 90), fx: fill(L.kindFx!, { n: d?.regard ?? 0 }), cls: 'kind' },
  ];
  const due = interviewDue(b);
  const A = Pp.ask, I = Pp.interview;
  return {
    day: b.day, papers, at: Math.max(0, Math.min(2, at)),
    who: notice ? null : ROTOM,
    line: notice ?? (quiet ? `Bzzt! ${L.quiet!}` : `Bzzt! ${fill((d?.dread ?? 0) > (d?.regard ?? 0) ? L.fear! : L.kind!, vars)}`),
    ask: asking ? { who: { name: 'Reporter', k: 't-clerk' }, line: fill(A.line, vars), choices: [`${fill(A.kind, vars)} · Regard +${I.kind.regard}`, `${fill(A.fear, vars)} · Dread +${I.fear.dread}`, A.walk] } : null,
    press: due !== null ? `Interview: Day ${due}` : b.phase !== 'day' || b.actions < 1 ? 'Interview (by day)' : null,
  };
}

export function scrapModel(b: DominionBlock): R5Scrap {
  const clips = (b.paper?.book ?? []).slice(-6);
  const lead = b.members[0];
  return {
    sub: `${plural(b.day, 'day')} of ${team(b)}`,
    clips,
    who: lead ? { name: lead.name, pic: facePic(lead.look, b, 40), colour: '#3f7fd9' } : ROTOM,
    line: clips.length ? `“${fill(P().lines.book!, { n: (b.paper?.book ?? []).length, region: region() }).replace(/^1 headlines/, 'One headline')}”` : `“${P().lines.bookNone!}”`,
  };
}

// A region played whole (design Part 2 sections 2, 4, 5 and 6; Part 26a section 2): the Arrival, six districts in order,
// the Road between them with an Officer left behind, drift, the tally, and a soft Reckoning that ends the region and never
// the run. Pure: new blocks are returned. Drift draws on its own stream (`evil-drift`), so no other roll moves.

import { hashSeed, Rng } from '../rng';
import { EVIL_DATA, type EvilData } from './data';
import { holdingName, layDistrict, stageRow, takings } from './board';
import { appendLog, fill, money } from './ledger';
import { inRoster, teamLoyalty, wageOf } from './people';
import { patronOf, PATRON_ID, regionOf } from './regionRule';
import { arriveApplicants } from './roster';
import type { Crew, District, EvilModeBlock, Holding, PastDistrict, RegionState } from './schema';

export type StageKind = 'arrival' | 'district' | 'reckoning';

/** Stage 1 is the Arrival, 8 the Reckoning, 2 to 7 the six districts (Part 2 section 2). The district's `n` is stage − 1. */
export const stageKind = (stage: number): StageKind => (stage <= 1 ? 'arrival' : stage >= 8 ? 'reckoning' : 'district');
export const regionOn = (data: EvilData = EVIL_DATA): boolean => data.region.on;

/** The day of this district (1 on its first Morning); days before slice 9 count from the run's first. */
export const dayIn = (block: Pick<EvilModeBlock, 'here' | 'district'>): number => block.here.day - (block.district?.from ?? 1) + 1;

/** How many days this stage lasts at most: the Arrival until the first Badge (3 or 4), the Reckoning 3, a district 7. */
export function stageDays(block: Pick<EvilModeBlock, 'here' | 'region'>, data: EvilData = EVIL_DATA): number {
  const k = regionOn(data) ? stageKind(block.here.stage) : 'district';
  return k === 'arrival' ? block.region.badgeDay : k === 'reckoning' ? data.region.reckoning.days : data.district.rules.days;
}

/** The stage's name: "The Arrival", "District 3", "The Reckoning". */
export const stageName = (stage: number, data: EvilData = EVIL_DATA): string => data.region.stages.names[stage - 1] ?? `District ${stage - 1}`;

/** The Arrival's Badge day: 3 or 4, drawn once from the seed with its own generator (no gameplay stream). */
export function badgeDayFor(seed: string, data: EvilData = EVIL_DATA): number {
  const [a, b] = data.region.arrival.days;
  return new Rng(hashSeed(`${seed}::evil-arrival`)).int(a, b);
}

/** The numbers a district starts from, for its tally. */
export function markOf(block: Pick<EvilModeBlock, 'team' | 'crew' | 'log' | 'here'>, data: EvilData = EVIL_DATA): RegionState['mark'] {
  const t = block.team;
  return { funds: t.funds, heat: t.heat, loyalty: teamLoyalty(block as EvilModeBlock, data), regard: t.regard, dread: t.dread, log: block.log.length, crew: inRoster(block as EvilModeBlock).map((c) => c.id), day: block.here.day };
}

/** A new region's state (the first Morning of its Arrival). */
export function newRegion(block: Pick<EvilModeBlock, 'team' | 'crew' | 'log' | 'here'>, seed: string, data: EvilData = EVIL_DATA): RegionState {
  const def = data.region.regions.find((r) => r.index === block.here.region);
  return { id: def?.id ?? 'kanto', phase: 'day', past: [], mark: markOf(block, data), tallies: [], badgeDay: badgeDayFor(seed, data), doubledBack: false, notes: [] };
}

// ---- The districts behind (Part 2 section 4.1) ----

const town = (d: { region: number; n: number }, data: EvilData): string => stageRow(d.region, d.n, data)?.town ?? `District ${d.n}`;

/** What one district behind pays tonight: full from what holds with an Officer there (less their wage); half without, or if it was the Hero's. */
export function pastPays(block: EvilModeBlock, p: PastDistrict, data: EvilData = EVIL_DATA): number {
  const holds = p.district.holdings.filter((h) => h.owner === 'team' && h.holds && h.kind !== 'gym');
  const sum = holds.reduce((n, h) => n + takings(h, data), 0);
  const officer = p.leftWith ? block.crew.find((c) => c.id === p.leftWith && c.where === 'away') : undefined;
  if (officer && p.district.end?.how !== 'taken') return sum - wageOf(block, officer, sum, data);
  return Math.floor((sum * data.region.drift.share) / 100);
}

/** Tonight's takings from every district behind, and the line the Evening prints (none when there's nothing). */
export function pastTakings(block: EvilModeBlock, data: EvilData = EVIL_DATA): { amount: number; lines: string[] } {
  const amount = block.region.past.reduce((n, p) => n + pastPays(block, p, data), 0);
  return { amount, lines: block.region.past.length ? [fill(data.region.drift.takings, { amount: money(amount).replace(/^₽/, '') })] : [] };
}

/** The roll for the n-th number `evil-drift` gives out: 1..max. The count is stored, so a reload drifts the same. */
export const driftRoll = (seed: string, n: number, max: number): number => new Rng(hashSeed(`${seed}::evil-drift::${n}`)).int(1, max);

/**
 * Drift (Part 2 section 4.1): each holding the team still has in a district held with nobody left has a one-in-six chance
 * an Evening of drifting back to its owner. One draw a holding, in district order then step order.
 */
export function drift(block: EvilModeBlock, data: EvilData = EVIL_DATA): { block: EvilModeBlock; lines: string[] } {
  let n = block.draws['evil-drift'] ?? 0;
  const lines: string[] = [];
  const seed = block.district?.seed ?? '';
  const past = block.region.past.map((p): PastDistrict => {
    if (p.leftWith || p.district.end?.how === 'taken') return p;
    const holdings = p.district.holdings.map((h): Holding => {
      if (h.owner !== 'team' || h.kind === 'gym' || h.kind === 'town') return h;
      const r = driftRoll(seed, n++, data.region.drift.oneIn);
      if (r !== 1) return h;
      lines.push(fill(data.region.drift.line, { where: holdingName({ ...h, scouted: Math.max(1, h.scouted) }, data), town: town(p.district, data) }));
      const { method: _m, since: _s, ...rest } = h;
      return { ...rest, owner: 'nobody', holds: false };
    });
    return { ...p, district: { ...p.district, holdings } };
  });
  let out: EvilModeBlock = { ...block, region: { ...block.region, past }, draws: { ...block.draws, 'evil-drift': n } };
  for (const l of lines) out = appendLog(out, { kind: 'law', who: [], text: `Day ${block.here.day}. ${l}` });
  return { block: out, lines };
}

// ---- The tally (Part 2 section 4.2) ----

/** The district's tally: holdings, the Gym, the numbers and their change, people, the Hero, the Log, one thing said. */
export function tallyOf(block: EvilModeBlock, data: EvilData = EVIL_DATA): RegionState['tallies'][number] {
  const d = block.district!;
  const m = block.region.mark;
  const L = data.region.tally.labels;
  const ours = d.holdings.filter((h) => h.owner === 'team' && h.kind !== 'gym');
  const holds = ours.filter((h) => h.holds).length;
  const g = block.gyms.find((x) => x.region === d.region && x.district === d.n);
  const leader = data.gym.leaders.find((l) => l.id === g?.leaderId) ?? data.gym.leaders.find((l) => l.region === d.region && l.n === d.n && l.role !== 'heir');
  const gymLine = g?.way ? `${data.gym.names[g.way]}. ${leader?.name ?? ''}` : `${leader?.name ?? 'The Leader'}: never dealt with.`;
  const t = block.team;
  const delta = (a: number, b: number) => (a === b ? 'no change' : a > b ? `+${a - b}` : `${a - b}`);
  const loyalty = teamLoyalty(block, data);
  const numbers = `Funds ${money(t.funds)} (${t.funds >= m.funds ? '+' : '−'}${money(Math.abs(t.funds - m.funds))}) · Heat ${t.heat} (${delta(t.heat, m.heat)}) · Loyalty ${loyalty} (${delta(loyalty, m.loyalty)}) · Regard ${t.regard} (${delta(t.regard, m.regard)}) · Dread ${t.dread} (${delta(t.dread, m.dread)})`;
  const log = block.log.slice(m.log);
  const hired = log.filter((e) => e.kind === 'hire').length;
  const left = log.filter((e) => e.kind === 'leave').length;
  const promoted = log.filter((e) => e.kind === 'promote').length;
  const cards = log.filter((e) => e.kind === 'card').length;
  const waived = log.filter((e) => e.kind === 'waive').length;
  const crossed = log.filter((e) => e.kind === 'card' && block.cards.find((c) => c.id === e.cardId)?.fields[7]?.text.match(/won't|refus/i)).length;
  const hero = block.hero;
  const badges = hero ? hero.badges.length : 0;
  const heroLine = hero ? `${badges === 0 ? 'No Badges' : badges === 1 ? 'One Badge' : `${badges} Badges`}. Step ${hero.at} of 20.${hero.battlesWithTeam ? ` ${hero.battlesWithTeam} battle${hero.battlesWithTeam === 1 ? '' : 's'} with the team.` : ''}` : '—';
  const said = [...log].reverse().find((e) => /"[^"]{8,}"/.test(e.text))?.text.match(/"[^"]+"/)?.[0] ?? data.region.tally.said;
  const title = `${stageName(block.here.stage, data)}: ${town(d, data)}. ${d.end?.how === 'held' ? 'Held.' : d.end?.how === 'taken' ? 'Taken by the Hero.' : d.end?.how === 'arrival' ? 'The Arrival.' : 'The Reckoning.'}`;
  return {
    n: d.n, title, said,
    rows: [
      [L.holdings!, `${ours.length} held. ${holds} hold. ${ours.length - holds} would turn.`],
      [L.gym!, gymLine],
      [L.numbers!, numbers],
      [L.people!, `Hired: ${hired}. Left: ${left}. Promoted: ${promoted}.`],
      [L.hero!, heroLine],
      [L.log!, `${cards} Card${cards === 1 ? '' : 's'} confirmed. ${waived} line${waived === 1 ? '' : 's'} waived. ${crossed ? `${crossed} line${crossed === 1 ? '' : 's'} crossed.` : 'No line crossed.'}`],
    ],
  };
}

// ---- After a district: the tally, then the Road (Part 2 section 5) ----

/** Who may be left to hold a district: an Officer or Executive on the Roster (Part 2 section 5). */
export const mayStay = (block: EvilModeBlock, data: EvilData = EVIL_DATA): Crew[] => inRoster(block).filter((c) => data.region.road.minRank.includes(c.rank) && !c.minor);

/** The district's over and its tally's been read: on to the Road; or, after the Reckoning, the region's over. */
export function toRoad(block: EvilModeBlock, data: EvilData = EVIL_DATA): { block: EvilModeBlock; problem: string | null } {
  if (!block.district?.end || block.region.phase !== 'tally') return { block, problem: 'Nothing to tally yet.' };
  const phase = stageKind(block.here.stage) === 'reckoning' ? 'over' : 'road';
  return { block: { ...block, region: { ...block.region, phase } }, problem: null };
}

/** What's heard from the district left behind (Part 2 section 5): by Regard and Dread. Fixed by the day, no draw. */
export function heardOf(block: EvilModeBlock, data: EvilData = EVIL_DATA): string {
  const H = data.region.road.heard;
  const list = block.team.regard > block.team.dread ? H.regard : block.team.dread > block.team.regard ? H.dread : H.plain;
  return list[block.here.day % list.length]!;
}

/**
 * Go on to the next district (Part 2 section 5). `stay` is the Officer left to hold the one behind (or null). The district
 * goes behind, kept; the next is laid from the seed with the locals already met set aside; the Hero's already on the new
 * map at its first step; the next day's Morning begins. Once a region, if a district behind was left with nobody, one of
 * the Hero's friends walks back through it and what would turn, turns (a note at the next Morning).
 */
export function goOn(block: EvilModeBlock, stay: string | null, data: EvilData = EVIL_DATA): { block: EvilModeBlock; problem: string | null } {
  const d = block.district;
  if (!d?.end || block.region.phase !== 'road') return { block, problem: 'The district isn\'t over.' };
  if (stay && !mayStay(block, data).some((c) => c.id === stay)) return { block, problem: 'Only an Officer can be left to hold a district.' };
  if (block.here.stage >= 8) return { block, problem: 'The region is over.' };
  const crew = block.crew.map((c) => (c.id === stay ? { ...c, where: 'away' as const } : c));
  let past: PastDistrict[] = [...block.region.past, { district: d, leftWith: stay }];
  const notes = [heardOf(block, data)];
  let doubledBack = block.region.doubledBack;
  // The double-back: once a region, a district behind (not the one just left) that nobody holds.
  const back = doubledBack ? -1 : past.findIndex((p, i) => i < past.length - 1 && !p.leftWith && p.district.end?.how !== 'taken' && p.district.holdings.some((h) => h.owner === 'team'));
  if (back >= 0) {
    const p = past[back]!;
    const turned = p.district.holdings.filter((h) => h.owner === 'team' && !h.holds && h.kind !== 'gym').length;
    const holdings = p.district.holdings.map((h): Holding => {
      if (h.owner !== 'team' || h.holds || h.kind === 'gym') return h;
      const { method: _m, since: _s, ...rest } = h;
      return { ...rest, owner: 'nobody', holds: false };
    });
    past = past.map((x, i) => (i === back ? { ...x, district: { ...x.district, holdings } } : x));
    notes.push(fill(turned ? data.region.road.doubleBack : data.region.road.doubleBackNone, { town: town(p.district, data), n: turned }));
    doubledBack = true;
  }
  const day = block.here.day + 1;
  const stage = block.here.stage + 1;
  const used = [...past.flatMap((p) => p.district.holdings), ...d.holdings].filter((h) => h.kind === 'local').map((h) => h.ref);
  const next: District = layDistrict(d.seed, d.region, stage - 1, block.team, data, { used, from: day });
  const hero = block.hero ? { ...block.hero, at: 1, walked: block.hero.walked, restOn: 0, today: [data.region.road.heroAhead] } : null;
  let out: EvilModeBlock = {
    ...block, crew, district: next, hero,
    here: { ...block.here, stage, day, beat: 'morning' },
    queue: [], sheets: [], evening: [], posted: [], inPerson: null, fight: null, rates: {}, proof: [],
    region: { ...block.region, phase: 'day', past, notes, doubledBack, mark: { ...markOf({ ...block, crew }, data), day } },
  };
  if (stay) out = appendLog(out, { kind: 'line', who: [stay], text: `Day ${block.here.day}. ${fill(data.region.road.stay, { name: block.crew.find((c) => c.id === stay)!.name })}` });
  return { block: arriveApplicants(out, data), problem: null };
}

/** Bring an Officer back from a district behind (at the Road). The district's then held by nobody. */
export function recall(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA): { block: EvilModeBlock; problem: string | null; line: string } {
  if (block.region.phase !== 'road') return { block, problem: 'Officers are recalled on the Road.', line: '' };
  const p = block.region.past.find((x) => x.leftWith === id);
  const c = block.crew.find((x) => x.id === id && x.where === 'away');
  if (!p || !c) return { block, problem: 'Nobody by that name is away.', line: '' };
  const line = fill(data.region.road.recall, { name: c.name, town: town(p.district, data) });
  return {
    block: { ...block, crew: block.crew.map((x) => (x.id === id ? { ...x, where: 'in' as const } : x)), region: { ...block.region, past: block.region.past.map((x) => (x === p ? { ...x, leftWith: null } : x)) } },
    problem: null, line,
  };
}

// ---- Morning notes ----

/**
 * What the Morning shows from the region (Part 2 sections 2.1 and 5.1): the Arrival's lesson (from the Patron, or a note on
 * the door from Nobody), letters from Officers away (every other day), and anything the Road left. Read only.
 */
export function morningNotes(block: EvilModeBlock, data: EvilData = EVIL_DATA): string[] {
  if (!regionOn(data)) return [];
  const out: string[] = [];
  const k = stageKind(block.here.stage);
  const di = dayIn(block);
  if (k === 'arrival' && block.here.region === 0 && di <= 4) {
    const patron = patronOf(block, data);
    const lessons = !patron || patron.id === 'nobody' ? data.region.arrival.lessons.nobody : data.region.arrival.lessons.patron;
    const who = patron && patron.id !== 'nobody' ? `${patron.who}: ` : '';
    out.push(`${who}${lessons[di - 1]}`);
  }
  if (k === 'reckoning') out.push(data.region.reckoning.day[Math.min(2, di - 1)]!);
  if (di === 1) out.push(...block.region.notes);
  for (const p of block.region.past) {
    if (!p.leftWith || (block.here.day - (p.district.from ?? 1)) % 2 !== 0) continue;
    const c = block.crew.find((x) => x.id === p.leftWith && x.where === 'away');
    if (c) out.push(`${c.name}, from ${town(p.district, data)}: ${data.region.road.letters[(block.here.day >> 1) % data.region.road.letters.length]}`);
  }
  return out;
}

// ---- The ways forward (Part 2 section 6) ----

export interface WayForward { id: string; state: string; way: string; status: string; waits?: string }

/** Every way the run can go wrong that this block is in now, with its way forward. Read only: the Board shows them at Morning. */
export function waysForward(block: EvilModeBlock, data: EvilData = EVIL_DATA): WayForward[] {
  const W = (id: string) => data.region.waysForward.find((w) => w.id === id)!;
  const out: WayForward[] = [];
  const roster = inRoster(block);
  if (roster.some((c) => c.unpaid > 0)) out.push(W('bankrupt'));
  if (!roster.length) out.push(W('nobody'));
  if (!block.district?.holdings.some((h) => h.kind === 'safehouse' && h.owner === 'team') && stageKind(block.here.stage) !== 'arrival' && dayIn(block) >= 3) out.push(W('noBase'));
  if (block.hero && block.hero.badges.length >= block.here.stage) out.push(W('heroAhead'));
  const lost = block.region.past.filter((p) => p.district.end?.how === 'taken').length;
  if (block.region.past.length >= 2 && lost === block.region.past.length) out.push(W('everyLost'));
  return out;
}

/** Whether the Patron is someone on the Roster (all but the Champion who quit and Nobody). */
export const patronPerson = (block: EvilModeBlock): Crew | undefined => block.crew.find((c) => c.id === PATRON_ID);
export { regionOf };

// Evil Mode slice 16: the Crossing (design Part 2 section 9; Part 26a section 1.1; Part 30 section 1's `crossing.ts`).
// After a region's Reckoning, when it isn't the run's last: two tickets, who comes, the base, the quay's question about
// forms, and the boats. Then what carries and what halves, and the next region's Arrival. Also Hoenn's letters and its
// second clock (Part 26a sections 1.7 and 4.6). Pure: new blocks are returned. Nothing here draws from a gameplay stream:
// the tickets, who stays and the reasons are hashed from the seed and the region, so they're the same on every reload.

import { hashSeed, Rng } from '../rng';
import { archiveOld } from './pack';
import { layDistrict, shiftMood } from './board';
import { EVIL_DATA, type EvilData } from './data';
import { appendLog, fill, money } from './ledger';
import { inRoster } from './people';
import { dayIn, markOf, mayStay, newRegion, pastPays, runIndex, stageKind } from './region';
import { arriveApplicants } from './roster';
import { packField, type ClockState, type CrossingState, type Crew, type EvilModeBlock, type Holding } from './schema';

const C = (data: EvilData) => data.region.crossing;
/** Slice 19: the second clock written for the region being played (Hoenn's weather, Sinnoh's mountain, Kalos's light), or undefined. */
export const clockOf = (block: Pick<EvilModeBlock, 'region'>, data: EvilData = EVIL_DATA) =>
  data.region.on ? [data.region.clock, ...(data.region.clocks ?? [])].find((c) => c.region === block.region.id) : undefined;
const K = (data: EvilData, block: Pick<EvilModeBlock, 'region'>) => clockOf(block, data) ?? data.region.clock;
type R = { block: EvilModeBlock; problem: string | null; lines: string[] };
const no = (block: EvilModeBlock, problem: string): R => ({ block, problem, lines: [] });
const ok = (block: EvilModeBlock, lines: string[] = []): R => ({ block, problem: null, lines });

/** The run's last region (its length, three or six, or the last one written), from 0. */
export function lastRun(block: Pick<EvilModeBlock, 'settings'>, data: EvilData = EVIL_DATA): number {
  const written = data.region.regions.filter((r) => r.status === 'supported' || r.status === 'limited').length;
  return Math.min(block.settings.length === 'six' ? 6 : 3, Math.max(1, written)) - 1;
}

/** Regions open for a ticket: written, and not played this run. */
export function openRegions(block: EvilModeBlock, data: EvilData = EVIL_DATA): string[] {
  const played = new Set([...block.region.crossed, block.region.id]);
  return data.region.regions.filter((r) => (r.status === 'supported' || r.status === 'limited') && !played.has(r.id)).map((r) => r.id);
}

/** The two tickets the seed offers (Part 2 section 9.1): hashed from the seed and the region left, so a reload shows the same two. */
export function ticketsFor(block: EvilModeBlock, data: EvilData = EVIL_DATA): string[] {
  const open = openRegions(block, data);
  const rng = new Rng(hashSeed(`${block.district?.seed ?? ''}::evil-tickets::${block.region.id}`));
  return rng.shuffle(open).slice(0, 2);
}

/** A ticket's four lines, with the team's own count of home districts filled in. */
export function ticketLines(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA): string[] {
  const def = data.region.regions.find((r) => r.id === id)!;
  const homes = (def.homes?.[block.team.doctrine] ?? []).filter((n) => n >= 1 && n <= 6).length;
  return def.ticket.map((l) => fill(l, { homes }));
}

/** Who stays (Part 2 section 9.2): a third of the Roster, rounded down; the ones with most to stay for (a Front of their own, then the most work done). Never the Patron. */
export function whoStays(block: EvilModeBlock, data: EvilData = EVIL_DATA): Crew[] {
  const roster = inRoster(block).filter((c) => c.id !== 'patron');
  const n = Math.floor(inRoster(block).length / C(data).stayShare);
  const fronts = new Set(block.economy.running.filter((v) => v.kind === 'front' && v.person).map((v) => v.person));
  const score = (c: Crew) => (fronts.has(c.id) ? 1000 : 0) + c.jobs * 10 + c.loyalty;
  return [...roster].sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id)).slice(0, n);
}

/** Each one's reason, from the written list, hashed from their id (same on every reload). */
export function stayReason(c: Crew, data: EvilData = EVIL_DATA): string {
  const list = C(data).reasons;
  return list[new Rng(hashSeed(`evil-stay::${c.id}`)).int(0, list.length - 1)]!;
}

/** Where the Hero lands (Part 2 section 9.5), by how the last room went. */
export function boatsOf(block: EvilModeBlock): CrossingState['boats'] {
  const o = block.reck?.room?.outcome ?? null;
  return o === 'heroWon' ? 'ahead' : o === 'bossWon' ? 'behind' : 'beside';
}

/** Whether a Crossing is due: the region's over, and this isn't the run's last. */
export const crossingDue = (block: EvilModeBlock, data: EvilData = EVIL_DATA): boolean =>
  data.region.on && block.region.phase === 'over' && !block.ending && runIndex(block) < lastRun(block, data);

/** Starts the Crossing once the region's over (called after every step; does nothing twice). */
export function beginCrossing(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  if (!crossingDue(block, data) || block.region.crossing) return block;
  const offer = ticketsFor(block, data);
  if (!offer.length) return block;
  const crossing: CrossingState = {
    step: 'tickets', offer, pick: offer.length === 1 ? null : null, staying: whoStays(block, data).map((c) => c.id), asked: null,
    base: block.base ? null : 'none', baseOfficer: null, forms: null, boats: boatsOf(block), lines: [],
  };
  return { ...block, region: { ...block.region, crossing } };
}

export type CrossAct = { what: 'ticket'; id: string } | { what: 'ask'; id: string } | { what: 'next' } | { what: 'base'; choice: 'hand' | 'sell' | 'leave' | 'burn'; officer?: string } | { what: 'forms'; yes: boolean } | { what: 'go' };

/** One answer at the Crossing, in order: a ticket; who comes (one asked, then on); the base; the quay; the boats. */
export function cross(block: EvilModeBlock, act: CrossAct, data: EvilData = EVIL_DATA): R {
  const x = block.region.crossing;
  if (!x) return no(block, crossingDue(block, data) ? 'The Crossing hasn\'t begun.' : C(data).last);
  const put = (c: Partial<CrossingState>, lines: string[] = []): R => ok({ ...block, region: { ...block.region, crossing: { ...x, ...c, lines: [...x.lines, ...lines] } } }, lines);
  switch (act.what) {
    case 'ticket':
      if (x.step !== 'tickets') return no(block, 'The ticket\'s been picked.');
      if (!x.offer.includes(act.id)) return no(block, 'That ticket isn\'t on the table.');
      return put({ pick: act.id, step: 'who' }, [C(data).heroFollows]);
    case 'ask': {
      if (x.step !== 'who') return no(block, 'Not now.');
      if (x.asked) return no(block, 'You\'ve asked once. It\'s the only thing the Boss can do about the list.');
      const c = block.crew.find((p) => p.id === act.id);
      if (!c || !x.staying.includes(c.id)) return no(block, 'They\'re coming anyway.');
      if (c.loyalty >= C(data).askLoyalty) return put({ asked: c.id, staying: x.staying.filter((s) => s !== c.id) }, [fill(C(data).asked, { name: c.name })]);
      return put({ asked: c.id }, [C(data).askNo]);
    }
    case 'next':
      if (x.step !== 'who') return no(block, 'Not now.');
      return put({ step: x.base === 'none' ? 'forms' : 'base' }, x.base === 'none' ? [C(data).base.none] : []);
    case 'base': {
      if (x.step !== 'base') return no(block, 'Not now.');
      if (act.choice === 'leave') {
        const off = act.officer ?? mayStay(block, data).find((c) => !x.staying.includes(c.id))?.id;
        if (!off || !mayStay(block, data).some((c) => c.id === off) || x.staying.includes(off)) return no(block, 'Only an Officer who\'s coming can be left in the base.');
        return put({ base: 'leave', baseOfficer: off, step: 'forms' });
      }
      return put({ base: act.choice, step: 'forms' });
    }
    case 'forms':
      if (x.step !== 'forms') return no(block, 'Not now.');
      return put({ forms: act.yes, step: 'boats' }, [act.yes ? C(data).forms.yes : C(data).forms.no]);
    case 'go':
      if (x.step !== 'boats' || !x.pick) return no(block, 'Not yet.');
      return leave(block, x, data);
  }
}

/** What the old base sells for: the low price, ₽1,000 more a room past the three fixed squares, at most the high. */
export function sellPrice(block: EvilModeBlock, data: EvilData = EVIL_DATA): number {
  const [lo, hi] = C(data).base.sell;
  return Math.min(hi, lo + (block.base?.rooms.length ?? 0) * 1000);
}

/**
 * The boats leave (Part 2 sections 9.2 to 9.5). Who stays leaves the Roster (kindly); garrisons stay and pay half across
 * the water; the base is handed, sold, left or burned; Heat halves; Regard and Dread halve unless the base says otherwise;
 * the neighbour's a new one; the Hero lands ahead, beside or behind. The next region's Arrival begins the next morning.
 */
function leave(block: EvilModeBlock, x: CrossingState, data: EvilData): R {
  const key = `crossing:${block.region.id}`;
  if (block.applied.includes(key)) return no(block, 'The boats have gone.');
  const def = data.region.regions.find((r) => r.id === x.pick)!;
  const B = C(data).base;
  const day = block.here.day + 1;
  const lines: string[] = [C(data).boats.night];
  let crew = block.crew.map((c): Crew => (x.staying.includes(c.id) && c.where === 'in' ? { ...c, where: 'left', left: { day: block.here.day, how: 'stayed', kindly: true } } : c));
  for (const id of x.staying) {
    const c = block.crew.find((p) => p.id === id);
    if (c) lines.push(fill(C(data).stays, { name: c.name, why: stayReason(c, data) }));
  }
  // Garrisons: what they hold pays on, at half, from across the water.
  const garrisons = block.region.past.filter((p) => p.leftWith && block.crew.some((c) => c.id === p.leftWith && c.where === 'away'));
  let abroad = block.region.abroad + garrisons.reduce((n, p) => n + Math.floor(pastPays(block, p, data) / 2), 0);
  let t = { ...block.team };
  if (x.base === 'leave' && x.baseOfficer) {
    crew = crew.map((c) => (c.id === x.baseOfficer ? { ...c, where: 'away' as const } : c));
    abroad += Math.floor(B.leavePays / 2);
  }
  if (x.base === 'sell') t = { ...t, funds: t.funds + sellPrice(block, data) };
  if (x.base === 'burn') t = { ...t, heat: Math.max(0, t.heat + B.burnHeat) };
  t = {
    ...t,
    heat: Math.floor(t.heat / 2),
    regard: x.base === 'hand' ? t.regard : Math.floor(t.regard / 2),
    dread: x.base === 'burn' ? t.dread : Math.floor(t.dread / 2),
  };
  // Slice 19 (Kalos): nobody here trusts a logo. A coat with no symbol lands with Regard +1 (Part 26b section 3.1).
  const plain = t.look?.symbol === data.region.look.symbols[data.region.look.symbols.length - 1];
  const logo = plain ? (def.rule?.mods ?? []).filter((m) => m.kind === 'arrivalRegard').reduce((n, m) => n + (m.add ?? 0), 0) : 0;
  if (logo) { t = { ...t, regard: Math.min(10, t.regard + logo) }; lines.push(fill(C(data).noLogo, { region: def.name })); }
  if (garrisons.length || x.base === 'leave') lines.push(C(data).garrisons);
  lines.push(C(data).boats[x.boats]);
  const steps = C(data).boats.steps[x.boats];
  const badgeDay = x.boats === 'ahead' ? 2 : x.boats === 'beside' ? 3 : 4;
  const seed = block.district?.seed ?? '';
  const crossed = [...block.region.crossed, block.region.id];
  const here = { region: def.index, stage: 1, day, beat: 'morning' as const };
  const district = layDistrict(seed, def.index, 0, t, data, { from: day });
  const hero = block.hero ? { ...block.hero, at: steps, restOn: 0, today: [C(data).boats[x.boats]] } : null;
  // The save's budget (Part 30 sections 3.11 and 7.4): every Card kept so far is packed (same fields, tighter), never dropped.
  const pack = <C extends { fields: readonly unknown[] }>(c: C): C => ({ ...c, fields: (c.fields as Parameters<typeof packField>[0][]).map(packField) });
  let out: EvilModeBlock = {
    ...block, team: t, crew, here, district, hero,
    cards: block.cards.map(pack), economy: { ...block.economy, cards: block.economy.cards.map(pack) }, scheme: { ...block.scheme, cards: block.scheme.cards.map(pack) },
    queue: [], sheets: [], evening: [], posted: [], inPerson: null, fight: null, rates: {}, proof: [],
    base: null, raid: null, neighbour: null, fire: null, reck: null,
    applied: [...block.applied, key],
  };
  // Slice 19: what's older than two regions is packed (Part 30 section 7.4): a six-region save stays under budget.
  const idx = (id: string) => data.region.regions.find((r) => r.id === id)?.index ?? -1;
  out = archiveOld(out, new Set([def.index, ...crossed.slice(-2).map(idx)]));
  const region = newRegion({ ...out, region: { ...block.region, crossed } } as EvilModeBlock, seed, data);
  out = { ...out, region: { ...region, crossed, abroad, forms: x.forms, badgeDay, mark: markOf(out, data), notes: lines.slice(1).filter((l) => l !== C(data).boats[x.boats]) } };
  out = appendLog(out, { kind: 'line', who: [], text: `Day ${block.here.day}. ${fill(C(data).intro, { region: data.region.regions.find((r) => r.id === crossed[crossed.length - 1])?.name ?? '' })} The team crossed to ${def.name}.` });
  return ok(arriveApplicants(out, data), lines);
}

/** The pay from across the water, each Evening (garrisons and an Officer in the old base). */
export function abroadLine(block: EvilModeBlock, data: EvilData = EVIL_DATA): string | null {
  return block.region.abroad ? fill(C(data).abroad, { amount: money(block.region.abroad) }) : null;
}

/** A Hero's Badges in this region (a new eight each region; Part 2 section 9.4). */
export const badgesHere = (block: EvilModeBlock): number => (block.hero?.badges ?? []).filter((b) => b.region === block.here.region).length;

// ---- Hoenn: the letters and the second clock (Part 26a sections 1.7 and 4.6; Part 15a section 8.2) ----

/** The applied keys for a region's clock (Hoenn's keep slice 16's names, so a save made then reads the same). */
const ck = (block: Pick<EvilModeBlock, 'region'>, what: 'start' | 'met'): string => (block.region.id === 'hoenn' ? `clock:${what}` : `clock:${what}:${block.region.id}`);

export const clockRegion = (block: EvilModeBlock, data: EvilData = EVIL_DATA): boolean => !!clockOf(block, data);

/** Carry a letter between the two Bosses (In person, once a day, before tick 3). Three stop tick 3: the Orbs stay on Mt. Pyre. */
export function carryLetter(block: EvilModeBlock, data: EvilData = EVIL_DATA): R {
  const k = K(data, block);
  if (!clockRegion(block, data) || !k.letters) return no(block, data.region.clock.notRegion);
  if (block.here.beat !== 'inPerson') return no(block, k.letterWhy!);
  if (block.inPerson?.day === block.here.day) return no(block, 'The Boss has already been out today.');
  if (block.region.letters >= k.letters) return no(block, k.letterDone!);
  const t3 = block.neighbour?.ticks.find((t) => t.n === 3);
  if (t3 && t3.state !== 'waiting') return no(block, k.letterWhy!);
  const letters = block.region.letters + 1;
  let out: EvilModeBlock = { ...block, region: { ...block.region, letters }, inPerson: { day: block.here.day, holdingId: 'letter' } };
  const lines = [fill(k.letterLine!, { n: letters, more: letters < k.letters ? '' : '' })];
  if (letters >= k.letters) {
    if (out.neighbour) out = { ...out, neighbour: { ...out.neighbour, ticks: out.neighbour.ticks.map((t) => (t.n === 3 && t.state === 'waiting' ? { ...t, state: 'stopped' as const } : t)) } };
    lines.push(k.letterDone!);
  }
  out = appendLog(out, { kind: 'neighbour', who: [], text: `Day ${block.here.day}. ${lines.join(' ')}` });
  return ok(out, lines);
}

/** Whether someone stopped the neighbour before the Reckoning: the letters, an Understanding, or their fall before it began. */
export function clockStoppedBefore(block: EvilModeBlock, data: EvilData = EVIL_DATA): boolean {
  const k = K(data, block);
  if (k.letters && block.region.letters >= k.letters) return true;
  // Slice 19: Sinnoh's bomb stopped by day 4, Kalos's room reached: the neighbour's tick never fired (Part 26b sections 1.6, 3.6).
  if (k.before && block.neighbour?.ticks.some((t) => t.n === k.before && t.state === 'stopped')) return true;
  const nb = block.neighbour;
  if (!nb) return true;
  if (nb.understanding) return true;
  return !!nb.fallen && nb.fellDay !== null && nb.fellDay < (block.district?.from ?? block.here.day);
}

/**
 * The second clock, each Morning of a Hoenn Reckoning: on the first it starts at three (or never, if somebody stopped them);
 * then it counts down by the day. It never ends a run. When the Reckoning ends with it still running, they meet (`clockMet`).
 */
export function clockMorning(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  if (!clockRegion(block, data) || block.here.beat !== 'morning' || stageKind(block.here.stage) !== 'reckoning' || block.district?.end) return block;
  const k = K(data, block);
  const di = dayIn(block);
  const c = block.region.clock;
  if (!c) {
    if (di !== 1 || block.applied.includes(ck(block, 'start'))) return block;
    const applied = [...block.applied, ck(block, 'start')];
    if (clockStoppedBefore(block, data)) return { ...block, applied, region: { ...block.region, clock: { left: 3, day: block.here.day, stopped: k.letters ? 'letters' : 'before' }, notes: [...block.region.notes, k.stopLetters] } };
    const clock: ClockState = { left: 3, day: block.here.day, stopped: null };
    return { ...block, applied, region: { ...block.region, clock, notes: [...block.region.notes, k.starts, k.days[0]!] } };
  }
  if (c.stopped) return block;
  const left = Math.max(1, 3 - (block.here.day - c.day));
  if (left === c.left) return block;
  return { ...block, region: { ...block.region, clock: { ...c, left }, notes: [...block.region.notes, k.days[3 - left]!] } };
}

/** The clock reaches nought (the Reckoning ended with it running): the Reckoning's interrupted where it is; half the tide and hot holdings go Free; a scale on the step. Soft: the run goes on. */
export function clockMet(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  const c = block.region.clock;
  if (!c || c.stopped || !block.district?.end || block.applied.includes(ck(block, 'met'))) return block;
  const k = K(data, block);
  let i = 0;
  const holdings = block.district.holdings.map((h): Holding => {
    if (h.owner !== 'team' || h.kind === 'gym' || (k.freeTags ? !h.tags?.some((t) => k.freeTags!.includes(t)) : false)) return h;
    if (i++ % 2 === 1) return h;
    const { method: _m, since: _s, ...rest } = h;
    return { ...rest, owner: 'nobody', holds: false };
  });
  const out: EvilModeBlock = { ...block, applied: [...block.applied, ck(block, 'met')], district: { ...block.district, holdings }, region: { ...block.region, clock: { ...c, left: 0, stopped: 'met' }, notes: [...block.region.notes, k.met, k.scale] }, evening: [...block.evening, k.met] };
  return appendLog(out, { kind: 'law', who: [], text: `Day ${block.here.day}. ${k.met}` });
}

/** Stop the clock during the Reckoning: the Boss goes to the cave (In person; a Reckoning day; the Hero a step nearer), or the Hero turns at the gate (their temper moves by one). */
export function stopClock(block: EvilModeBlock, how: 'boss' | 'hero', data: EvilData = EVIL_DATA): R {
  const k = K(data, block);
  const c = block.region.clock;
  if (!clockRegion(block, data) || !c) return no(block, k.notRegion);
  if (c.stopped) return no(block, 'The clock\'s already stopped.');
  if (how === 'boss') {
    if (block.here.beat !== 'inPerson') return no(block, k.bossWhy);
    if (block.inPerson?.day === block.here.day) return no(block, 'The Boss has already been out today.');
    const hero = block.hero ? { ...block.hero, at: Math.min(20, block.hero.at + 1) } : null;
    const out = { ...block, hero, inPerson: { day: block.here.day, holdingId: 'cave' }, region: { ...block.region, clock: { ...c, stopped: 'boss' as const } } };
    return ok(appendLog(out, { kind: 'neighbour', who: [], text: `Day ${block.here.day}. ${k.stopBoss}` }), [k.stopBoss]);
  }
  if (!block.hero) return no(block, 'There\'s no Hero to turn round.');
  const hero = { ...block.hero, temper: Math.max(0, Math.min(4, block.hero.temper + k.heroTemper)) };
  const out = { ...block, hero, region: { ...block.region, clock: { ...c, stopped: 'hero' as const } } };
  return ok(appendLog(out, { kind: 'neighbour', who: [], text: `Day ${block.here.day}. ${k.stopHero}` }), [k.stopHero]);
}

/** For the frame: the clock's chip, or null. */
export function clockChip(block: EvilModeBlock, data: EvilData = EVIL_DATA): string | null {
  const c = block.region.clock;
  if (!clockRegion(block, data)) return null;
  const k = K(data, block);
  if (!c) return k.letters && k.letterLine && stageKind(block.here.stage) !== 'reckoning' && block.region.letters < k.letters ? fill(k.letterLine, { n: block.region.letters, more: '' }) : null;
  return c.stopped ? null : fill(k.open, { left: c.left });
}

// ---- Johto's kept places (Part 26a section 3.3) ----

/** A kept place newly held warms every holding in its district by one mood, once (it pays in what the district thinks). */
export function keptWarmth(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  const d = block.district;
  if (!d || !data.region.on) return block;
  let out = block;
  for (const k of d.holdings.filter((h) => h.kind === 'kept' && h.owner === 'team')) {
    const key = `kept:${d.region}:${d.n}:${k.id}`;
    if (out.applied.includes(key)) continue;
    const holdings = out.district!.holdings.map((h) => (h.mood ? { ...h, mood: shiftMood(h.mood, 1) ?? h.mood } : h));
    const line = fill(C(data).keptWarm, { where: k.ref });
    out = { ...out, applied: [...out.applied, key], district: { ...out.district!, holdings }, evening: [...out.evening, line] };
  }
  return out;
}

// ---- The Crossing's screen (New UI): one step at a time, every choice a button with an act code ----

export interface CrossingModel {
  title: string;
  intro: string;
  step: CrossingState['step'];
  heading: string;
  info: string[];
  /** `code` is what the screen sends back: ticket:<id>, ask:<id>, next, base:<choice>, forms:yes|no, go. The first is Enter's. */
  choices: { code: string; text: string; sub: string; off?: boolean }[];
  /** What's been said so far at the quay. */
  said: string[];
}

export function crossingModel(block: EvilModeBlock, data: EvilData = EVIL_DATA): CrossingModel | null {
  const x = block.region.crossing;
  if (!x) return null;
  const c = C(data);
  const left = data.region.regions.find((r) => r.id === block.region.id)?.name ?? '';
  const name = (id: string) => data.region.regions.find((r) => r.id === id)?.name ?? id;
  const base = { title: c.title, intro: fill(c.intro, { region: left }), step: x.step, said: x.lines };
  switch (x.step) {
    case 'tickets':
      return { ...base, heading: c.tickets, info: [], choices: x.offer.map((id) => ({ code: `ticket:${id}`, text: name(id), sub: ticketLines(block, id, data).join(' ') })) };
    case 'who': {
      const staying = x.staying.map((id) => block.crew.find((p) => p.id === id)).filter((p): p is Crew => !!p);
      const garrisons = block.region.past.some((p) => p.leftWith && block.crew.some((q) => q.id === p.leftWith && q.where === 'away'));
      const info = [...staying.map((p) => fill(c.stays, { name: p.name, why: stayReason(p, data) })), c.comes, ...(garrisons ? [c.garrisons] : []), ...(x.asked ? [] : staying.length ? [c.ask] : [])];
      const asks = x.asked ? [] : staying.map((p) => ({ code: `ask:${p.id}`, text: `Ask ${p.name}: "We need you."`, sub: `Loyalty ${p.loyalty}` }));
      return { ...base, heading: c.who, info, choices: [{ code: 'next', text: 'On to the quay', sub: x.base === 'none' ? c.base.none : c.base.title }, ...asks] };
    }
    case 'base': {
      const officer = mayStay(block, data).some((p) => !x.staying.includes(p.id));
      return { ...base, heading: c.base.title, info: c.carries.filter(([a]) => a !== 'Corruption' || (block.settings.shadow && !!block.edges.shadow)).map(([a, b]) => `${a}: ${b}`), choices: c.base.choices.map((b) => ({
        code: `base:${b.id}`, text: b.id === 'sell' ? `${b.name} (${money(sellPrice(block, data))})` : b.name, sub: `${b.gives} ${b.and}`, off: b.id === 'leave' && !officer,
      })) };
    }
    case 'forms':
      return { ...base, heading: c.forms.ask, info: [c.forms.none], choices: [{ code: 'forms:no', text: 'Leave them', sub: c.forms.no }, { code: 'forms:yes', text: 'Take them', sub: c.forms.yes }] };
    case 'boats':
      return { ...base, heading: c.boats.night, info: [c.boats[x.boats]], choices: [{ code: 'go', text: `${c.leave} to ${name(x.pick ?? '')}`, sub: c.heroFollows }] };
  }
}

/** Turns a screen's act code back into a Crossing answer. */
export function crossActOf(code: string): CrossAct | null {
  const [what, arg] = code.split(':');
  if (what === 'ticket' && arg) return { what: 'ticket', id: arg };
  if (what === 'ask' && arg) return { what: 'ask', id: arg };
  if (what === 'next') return { what: 'next' };
  if (what === 'base' && (arg === 'hand' || arg === 'sell' || arg === 'leave' || arg === 'burn')) return { what: 'base', choice: arg };
  if (what === 'forms') return { what: 'forms', yes: arg === 'yes' };
  if (what === 'go') return { what: 'go' };
  return null;
}

/** Hoenn's In-person buttons: carry a letter (before the Reckoning), or stop the clock while it runs. */
export function clockActs(block: EvilModeBlock, data: EvilData = EVIL_DATA): { code: string; text: string }[] {
  if (!clockRegion(block, data) || block.inPerson?.day === block.here.day) return [];
  const k = K(data, block);
  const c = block.region.clock;
  if (c) return c.stopped ? [] : [{ code: 'stop:boss', text: k.acts?.boss ?? 'Go to the cave yourself (stops the clock; the kid gets a step)' }, { code: 'stop:hero', text: k.acts?.hero ?? 'Let the kid turn back at the gate (stops the clock)' }];
  if (!k.letters) return [];
  const t3 = block.neighbour?.ticks.find((t) => t.n === 3);
  if (stageKind(block.here.stage) === 'reckoning' || block.region.letters >= k.letters || (t3 && t3.state !== 'waiting')) return [];
  return [{ code: 'letter', text: `Carry a letter between Archie and Maxie (${block.region.letters} of ${k.letters})` }];
}

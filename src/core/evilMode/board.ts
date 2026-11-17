// Evil Mode's district (design Part 6): twenty steps laid from the run's seed, who holds what, and the count to eleven.
// Pure. Laying a district uses its own generator made from the seed and the district's number, so it never draws from
// any gameplay stream (a new stream never changes existing rolls).

import { hashSeed, Rng } from '../rng';
import { EVIL_DATA, type EvilData } from './data';
import type { District, EvilModeBlock, Holding, HoldingKind, JobMethod, LocalDef, Mood } from './schema';

/** What laying a district needs to know about the team: Regard and Dread, and (slice 9) the Look. */
export type LayTeam = { regard: number; dread: number; look?: { a: string; b: string; cut?: string } };

/**
 * Lays District `n` of region `region`: step 20 the Gym; the rest shuffled from the stage's layout counts. Slice 9: a
 * stage's own streets, places and floors; the region's own locals in their own district; locals already met this region
 * (`opts.used`) aren't drawn again while the deck lasts; the region rule's deeds on their own generator.
 */
export function layDistrict(seed: string, region: number, n: number, team: LayTeam, data: EvilData = EVIL_DATA, opts: { used?: readonly string[]; from?: number } = {}): District {
  const d = data.district;
  const row = stageRow(region, n, data);
  const rng = new Rng(hashSeed(`${seed}::evil-district::${region}::${n}`));
  const L = row?.layout ? { ...row.layout, steps: d.layout.steps } : { ...d.layout, floor: 0 };
  const pool: HoldingKind[] = [
    ...Array<HoldingKind>(L.local).fill('local'), ...Array<HoldingKind>(L.wild).fill('wild'), ...Array<HoldingKind>(L.alpha).fill('alpha'),
    ...Array<HoldingKind>(L.safehouse).fill('safehouse'), ...Array<HoldingKind>(L.opportunity).fill('opportunity'), ...Array<HoldingKind>(L.floor).fill('floor'), 'town',
  ];
  if (pool.length !== L.steps - 1) throw new Error(`Evil Mode district layout has ${pool.length} holdings before the Gym, not ${L.steps - 1}`);
  const kinds = rng.shuffle(pool);
  const pinned = data.district.locals.filter((l) => l.region === region && l.home === n);
  const generic = data.district.locals.filter((l) => l.region === undefined);
  const fresh = generic.filter((l) => !(opts.used ?? []).includes(l.id));
  const deck = rng.shuffle(fresh.length >= L.local - pinned.length ? fresh : generic);
  const locals = [...deck.slice(0, Math.max(0, L.local - pinned.length)), ...pinned];
  const places: Record<string, string[]> = {};
  for (const k of data.district.kinds) places[k.id] = rng.shuffle(row?.places?.[k.id] ?? k.places ?? []);
  const used: Record<string, number> = {};
  let li = 0;
  let floor = 0;
  const floors = row?.floors ?? [];
  const holdings: Holding[] = [...kinds, 'gym' as const].map((kind, i) => {
    const step = i + 1;
    let ref: string;
    if (kind === 'local') ref = locals[li++]!.id;
    else if (kind === 'floor') ref = floors[floor++]?.name ?? `Floor ${floor}`;
    else {
      const list = places[kind]!;
      const k = used[kind] ?? 0;
      used[kind] = k + 1;
      ref = list[k % Math.max(1, list.length)] ?? kindDef(kind, data).name;
    }
    const h: Holding = { id: `s${step}`, step, kind, ref, mood: firstMood(kind, ref, team, data), scouted: 0, owner: 'nobody', holds: false, tried: [] };
    return kind === 'floor' ? { ...h, floor } : h;
  });
  return { region, n, seed, holdings: deeds(seed, region, n, holdings, data), regardStreets: [], ...(opts.from && opts.from > 1 ? { from: opts.from } : {}) };
}

/** A region's stage row (district.json `districts`), or undefined for a stage this build hasn't written. */
export const stageRow = (region: number, n: number, data: EvilData = EVIL_DATA) => data.district.districts.find((x) => x.region === region && x.n === n);

/** The region rule's deeds (Part 26a section 1.2, Kanto: half the holdings), drawn on their own generator from the seed. */
function deeds(seed: string, region: number, n: number, holdings: Holding[], data: EvilData): Holding[] {
  const def = data.region.on ? data.region.regions.find((r) => r.index === region)?.deeds : undefined;
  if (!def) return holdings;
  const rng = new Rng(hashSeed(`${seed}::evil-deeds::${region}::${n}`));
  return holdings.map((h) => (def.kinds.includes(h.kind) && rng.int(1, 100) <= def.share ? { ...h, tags: [def.tag] } : h));
}

/** A floor's row in its district (a tower's floors, numbered from the bottom). */
export const floorOf = (h: Holding, data: EvilData = EVIL_DATA) => (h.kind === 'floor' ? data.district.districts.flatMap((r) => r.floors ?? []).find((f) => f.name === h.ref) : undefined);

/** A street's name in this district (the stage's own four, else the file's). */
export function streetName(district: { region: number; n: number }, i: number, data: EvilData = EVIL_DATA): string {
  return stageRow(district.region, district.n, data)?.streets?.[i] ?? data.district.streets[i]?.name ?? '';
}

export const kindDef = (kind: HoldingKind, data: EvilData = EVIL_DATA) => data.district.kinds.find((k) => k.id === kind)!;
export const localOf = (h: Holding, data: EvilData = EVIL_DATA): LocalDef | undefined => {
  if (h.kind === 'local') return data.district.locals.find((l) => l.id === h.ref);
  // Slice 9: a floor's tenant reads as a local (a lease, a price, a mood), so Pay, Persuade and Take work the same way.
  const f = floorOf(h, data);
  return f ? { id: h.ref, who: f.tenant, trade: f.name, earns: f.take * 3, take: f.take, want: 'A lease that doesn\'t go up', fear: 'The building\'s owners', mood: 'wary', says: f.says } : undefined;
};
export const districtDef = (district: District, data: EvilData = EVIL_DATA) => data.district.districts.find((x) => x.region === district.region && x.n === district.n) ?? data.district.districts[0]!;

/** A local's first mood (design Part 6 section 3.3): their own, then Regard 4+ Easy, Dread 4+ Sullen. Shut never starts. */
function firstMood(kind: HoldingKind, ref: string, team: LayTeam, data: EvilData): Mood | null {
  const base = kind === 'local' ? data.district.locals.find((l) => l.id === ref)?.mood ?? 'wary' : kindDef(kind, data).mood ?? null;
  if (!base) return null;
  let m: Mood = base;
  if (team.dread >= 4) m = 'sullen';
  else if (team.regard >= 4 && (base === 'wary' || base === 'sullen')) m = 'easy';
  // Slice 9: the Look (Part 3 section 8). Black and red: one colder. "Whatever they came in": one warmer. Shut stays shut.
  if (team.look && kind === 'local' && m !== 'shut') m = shiftMood(m, lookMood(team.look, data)) ?? m;
  return m;
}

/** What the Look does to a local's first mood: -1, 0 or +1 (Part 3 section 8). */
export function lookMood(look: { a: string; b: string; cut?: string }, data: EvilData = EVIL_DATA): number {
  const L = data.region.look;
  const hex = (list: [string, string][], name: string) => list.find(([n]) => n === name)?.[1]?.toLowerCase();
  let by = 0;
  if (look.a.toLowerCase() === hex(L.a, L.cold.a) && look.b.toLowerCase() === hex(L.b, L.cold.b)) by -= 1;
  if (look.cut === L.warm.cut) by += 1;
  return by;
}

const MOOD_ORDER: Mood[] = ['shut', 'sullen', 'wary', 'easy', 'warm'];
/** One warmer (+1) or colder (-1); Warm and Shut are the ends. */
export function shiftMood(m: Mood | null, by: number): Mood | null {
  if (!m) return m;
  const i = Math.max(0, Math.min(MOOD_ORDER.length - 1, MOOD_ORDER.indexOf(m) + by));
  return MOOD_ORDER[i]!;
}

/** Which street (by index) a step is on. */
export const streetOf = (step: number, data: EvilData = EVIL_DATA): number => Math.max(0, data.district.streets.findIndex((s) => step >= s.from && step <= s.to));

/** The Town's street: its nearest locals by step (design Part 6 section 2.6). */
export function townStreet(district: District, data: EvilData = EVIL_DATA): Holding[] {
  const town = district.holdings.find((h) => h.kind === 'town')!;
  return district.holdings.filter((h) => h.kind === 'local').sort((a, b) => Math.abs(a.step - town.step) - Math.abs(b.step - town.step) || a.step - b.step).slice(0, data.district.rules.townStreet);
}

/** The Town is held while more of its street is the team's than isn't. Returns a new district. */
export function settleTown(district: District, day: number, data: EvilData = EVIL_DATA): District {
  const street = townStreet(district, data);
  const ours = street.filter((h) => h.owner === 'team');
  const held = ours.length * 2 > street.length;
  return {
    ...district,
    holdings: district.holdings.map((h) => {
      if (h.kind !== 'town') return h;
      if (held && h.owner !== 'team') return { ...h, owner: 'team', since: day, holds: ours.every((x) => x.holds) };
      if (!held && h.owner === 'team') return { ...h, owner: 'nobody', since: undefined, holds: false };
      if (held) return { ...h, holds: ours.every((x) => x.holds) };
      return h;
    }),
  };
}

/** How much a held holding counts toward the eleven (Part 6 section 1.1): the Town double; Outplay double under Power. */
export function countsFor(h: Holding, creed: string): number {
  if (h.owner !== 'team' || h.kind === 'gym') return 0;
  if (h.kind === 'town') return 2;
  if (h.method === 'outplay' && creed === 'power') return 2;
  return 1;
}

export const heldCount = (block: EvilModeBlock): number => (block.district ? block.district.holdings.reduce((n, h) => n + countsFor(h, block.team.creed), 0) : 0);

/** A local's fair price: six days of the team's share (or a third of what they earn, for a favour), a fifth lower if they fear the bank or the landlord. */
export function fairPrice(h: Holding, data: EvilData = EVIL_DATA): number | null {
  if (h.kind === 'safehouse') return kindDef('safehouse', data).price ?? null;
  const l = localOf(h, data);
  if (!l || l.noPrice || l.earns <= 0) return null;
  const share = l.take > 0 ? l.take : Math.round(l.earns / 3);
  let price = share * data.district.rules.fairDays * (l.priceTimes ?? 1);
  if (/^the (bank|landlord)$/i.test(l.fear)) price = Math.round((price * 4) / 5);
  return Math.round(price / 50) * 50;
}

/** What a Pay offer costs: the offer's percent of the fair price, to the nearest ₽50. */
export function payAmount(h: Holding, offer: number | undefined, data: EvilData = EVIL_DATA): number {
  const fair = fairPrice(h, data) ?? 0;
  return Math.round((fair * (offer ?? 100)) / 100 / 50) * 50;
}

/** What a held holding pays the team each Evening (a safehouse costs its rent). */
export function takings(h: Holding, data: EvilData = EVIL_DATA): number {
  if (h.owner !== 'team') return 0;
  if (h.kind === 'town') return data.district.rules.townTakings;
  if (h.kind === 'safehouse') return -data.district.rules.safehouseRent;
  const t = localOf(h, data)?.take ?? 0;
  // Slice 6: a Leaned holding pays half as much again (Part 7 section 6).
  return h.method === 'lean' ? Math.floor((t * data.line.lean.takings) / 100) : t;
}

/** The name on a holding's row: the local's name once scouted, else the kind; places are always named. */
export function holdingName(h: Holding, data: EvilData = EVIL_DATA): string {
  if (h.kind === 'floor') return h.ref;
  if (h.kind === 'local') return h.scouted > 0 ? localOf(h, data)!.who : `A local (step ${h.step})`;
  return h.ref;
}

export const methodsFor = (h: Holding, data: EvilData = EVIL_DATA): JobMethod[] => kindDef(h.kind, data).methods;

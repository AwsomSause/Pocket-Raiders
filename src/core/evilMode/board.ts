// Evil Mode's district (design Part 6): twenty steps laid from the run's seed, who holds what, and the count to eleven.
// Pure. Laying a district uses its own generator made from the seed and the district's number, so it never draws from
// any gameplay stream (a new stream never changes existing rolls).

import { hashSeed, Rng } from '../rng';
import { EVIL_DATA, type EvilData } from './data';
import type { District, EvilModeBlock, Holding, HoldingKind, JobMethod, LocalDef, Mood } from './schema';

/** Lays District `n` of region `region`: step 20 the Gym; the rest shuffled from the layout's counts. */
export function layDistrict(seed: string, region: number, n: number, team: { regard: number; dread: number }, data: EvilData = EVIL_DATA): District {
  const d = data.district;
  const rng = new Rng(hashSeed(`${seed}::evil-district::${region}::${n}`));
  const L = d.layout;
  const pool: HoldingKind[] = [
    ...Array<HoldingKind>(L.local).fill('local'), ...Array<HoldingKind>(L.wild).fill('wild'), ...Array<HoldingKind>(L.alpha).fill('alpha'),
    ...Array<HoldingKind>(L.safehouse).fill('safehouse'), ...Array<HoldingKind>(L.opportunity).fill('opportunity'), 'town',
  ];
  if (pool.length !== L.steps - 1) throw new Error(`Evil Mode district layout has ${pool.length} holdings before the Gym, not ${L.steps - 1}`);
  const kinds = rng.shuffle(pool);
  const locals = rng.shuffle(data.district.locals).slice(0, L.local);
  const places: Record<string, string[]> = {};
  for (const k of data.district.kinds) places[k.id] = rng.shuffle(k.places ?? []);
  const used: Record<string, number> = {};
  let li = 0;
  const holdings: Holding[] = [...kinds, 'gym' as const].map((kind, i) => {
    const step = i + 1;
    let ref: string;
    if (kind === 'local') ref = locals[li++]!.id;
    else {
      const list = places[kind]!;
      const k = used[kind] ?? 0;
      used[kind] = k + 1;
      ref = list[k % Math.max(1, list.length)] ?? kindDef(kind, data).name;
    }
    return { id: `s${step}`, step, kind, ref, mood: firstMood(kind, ref, team, data), scouted: 0, owner: 'nobody', holds: false, tried: [] };
  });
  return { region, n, seed, holdings, regardStreets: [] };
}

export const kindDef = (kind: HoldingKind, data: EvilData = EVIL_DATA) => data.district.kinds.find((k) => k.id === kind)!;
export const localOf = (h: Holding, data: EvilData = EVIL_DATA): LocalDef | undefined => (h.kind === 'local' ? data.district.locals.find((l) => l.id === h.ref) : undefined);
export const districtDef = (district: District, data: EvilData = EVIL_DATA) => data.district.districts.find((x) => x.region === district.region && x.n === district.n) ?? data.district.districts[0]!;

/** A local's first mood (design Part 6 section 3.3): their own, then Regard 4+ Easy, Dread 4+ Sullen. Shut never starts. */
function firstMood(kind: HoldingKind, ref: string, team: { regard: number; dread: number }, data: EvilData): Mood | null {
  const base = kind === 'local' ? data.district.locals.find((l) => l.id === ref)?.mood ?? 'wary' : kindDef(kind, data).mood ?? null;
  if (!base) return null;
  if (team.dread >= 4) return 'sullen';
  if (team.regard >= 4 && (base === 'wary' || base === 'sullen')) return 'easy';
  return base;
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

/** What a held holding pays the team each Evening (a safehouse costs its rent). */
export function takings(h: Holding, data: EvilData = EVIL_DATA): number {
  if (h.owner !== 'team') return 0;
  if (h.kind === 'town') return data.district.rules.townTakings;
  if (h.kind === 'safehouse') return -data.district.rules.safehouseRent;
  return localOf(h, data)?.take ?? 0;
}

/** The name on a holding's row: the local's name once scouted, else the kind; places are always named. */
export function holdingName(h: Holding, data: EvilData = EVIL_DATA): string {
  if (h.kind === 'local') return h.scouted > 0 ? localOf(h, data)!.who : `A local (step ${h.step})`;
  return h.ref;
}

export const methodsFor = (h: Holding, data: EvilData = EVIL_DATA): JobMethod[] => kindDef(h.kind, data).methods;

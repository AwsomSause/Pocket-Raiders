// DOMINION slice D3: new people (Part 2 §6, Part 6 §3 Hire Grunt, Part 9 A16 Patrons and A24 refusals).
// Leads come from the Recruit task; the Boss closes the deal with an Approach and a Pitch (a Day action, stream
// `dominion-recruit`). Hire Grunt sells two or three generated Grunts a day from grunt-types.md (stream `dominion-hire`).
// Making a member's Pokémon needs the run, so `joinMember` takes the content and the run and returns both.

import type { Content } from '../contentSchema';
import { newMon } from '../run';
import type { PokemonInstance, RunState } from '../state';
import { addCrewHook, addLoyalty, crewOf, freshCrew, freshCrewState, gruntType, rankN, rng, setLeadMaker, taskById, withCrew } from './crew';
import { DOMINION_DATA } from './data';
import type { DominionBlock, GruntType, Hire, Lead, Member, StatId } from './schema';
import { STAT_IDS } from './schema';
import { memberMonPool } from './start';
import { fill } from './worldTurn';

const C = () => DOMINION_DATA.crew;
const RC = () => DOMINION_DATA.crew.recruit;
const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, Math.round(n)));

/**
 * Notoriety (Part 9 A14) as far as D3 can count it: +1 per member. D6 adds Regard, Dread and holdings, and with them
 * the Patrons' "after Crew" (50) gate opens.
 */
export const notoriety = (b: DominionBlock): number => b.members.length;

/** A24: the one Gym Leader and one Elite Four member per region who never join. */
export function alwaysRefuses(region: string, personId: string): boolean {
  const r = C().refusals[region.toLowerCase()];
  return !!r && (r.leader === personId || r.e4 === personId);
}
/** What their File says once they're scouted. */
export const refusalLine = (region: string, personId: string): string | null => (alwaysRefuses(region, personId) ? C().refusalLine : null);

// ---------- stats ----------

function rollStats(r: ReturnType<typeof rng>, lean: StatId): Member['stats'] {
  const s = { brawn: 1, nerve: 1, wits: 1, charm: 1, stealth: 1 };
  for (const k of STAT_IDS) s[k] = r.int(1, 3);
  s[lean] = Math.min(10, s[lean] + 2);
  return s;
}
const pick = <T>(r: ReturnType<typeof rng>, a: readonly T[]): T => a[r.int(0, a.length - 1)]!;
function nameFor(b: DominionBlock, r: ReturnType<typeof rng>, gender: 'm' | 'f'): string {
  const used = new Set([...b.members.map((m) => m.name), ...(b.crew?.leads ?? []).map((l) => l.name), ...(b.crew?.hires ?? []).map((h) => h.name)]);
  const free = RC().names[gender].filter((x) => !used.has(x));
  return free.length ? pick(r, free) : `${pick(r, RC().names[gender])} ${b.members.length + 1}`;
}

// ---------- leads (the Recruit task) ----------

/** A lead for the finder (called by the crew step on a Recruit success). At most five open leads. */
export function makeLead(b: DominionBlock, finder: Member, seed: string): Lead | null {
  const st = (b.crew ??= freshCrewState());
  if (st.leads.filter((l) => !l.waiting).length >= C().rules.maxLeads) return null;
  const r = rng(seed, 'dominion-recruit', b.day, finder.id, 'lead');
  const cls = pick(r, RC().classes);
  const kind = RC().kinds.find((k) => k.id === cls.kind)!;
  const greens = C().greens;
  const motive = pick(r, C().motives);
  const hates = pick(r, RC().pitches.filter((p) => p.id !== motive.pitch)).id;
  const id = `L${b.day}-${finder.id}`;
  const lead: Lead = {
    id, name: nameFor(b, r, cls.gender), cls: cls.cls, kind: cls.kind, look: cls.look, gender: cls.gender, role: cls.role ?? null,
    stats: rollStats(r, cls.lean), green: pick(r, greens).id, motive: motive.id, hates,
    chance: r.int(kind.chance[0], kind.chance[1]), foundBy: finder.id, day: b.day, notBefore: 0, bonus: 0, waiting: false, pitch: null,
  };
  st.leads.push(lead);
  return lead;
}
setLeadMaker(makeLead);

/** The odds a pitch lands (Part 2 §6.2): their base + pitch match + the finder's Charm + HQ tier + Notoriety. */
export function pitchOdds(b: DominionBlock, lead: Lead, pitch: string): number {
  const rc = RC();
  const motive = C().motives.find((x) => x.id === lead.motive);
  const finder = b.members.find((m) => m.id === lead.foundBy);
  let p = lead.chance + lead.bonus + b.hqLevel * rc.hqPer + (finder ? finder.stats.charm * rc.charmPer : 0) + notoriety(b);
  if (motive?.pitch === pitch) p += rc.matchBonus;
  if (lead.hates === pitch) p -= rc.hatePenalty;
  if (pitch === 'cause' && !b.teamName) p -= rc.noCausePenalty;
  for (const m of b.members) for (const id of crewOf(m).formed) p += DOMINION_DATA.crew.formed.find((f) => f.id === id && f.live)?.mods.pitch ?? 0;
  return clamp(p, 5, 95);
}

export interface PitchOut { ok: boolean; run: RunState; notice: string | null; joined: boolean }

/** The Boss's Recruit action on a lead: a Day action, Heat +1, then the answer (Part 1 §3 Recruit, Part 2 §6.2). */
export function approach(content: Content, run: RunState, leadId: string, pitch: string): PitchOut {
  const no = (notice: string | null = null): PitchOut => ({ ok: false, run, notice, joined: false });
  const block = run.expansion?.dominion;
  if (!block) return no();
  const b = withCrew(block);
  const lead = b.crew!.leads.find((l) => l.id === leadId);
  if (!lead || lead.waiting || !RC().pitches.some((p) => p.id === pitch)) return no();
  if (b.phase !== 'day') return no('Recruiting is a Day action.');
  if (b.actions < 1) return no('No actions left today.');
  if (lead.notBefore > b.day) return no(`Not yet. Come back on Day ${lead.notBefore}.`);
  b.actions -= 1;
  b.heat = clamp(b.heat + RC().approachHeat);
  const p = pitchOdds(b, lead, pitch);
  const roll = rng(run.seed, 'dominion-recruit', b.day, lead.id, pitch).int(1, 100);
  const says = RC().says;
  if (roll > p) {
    if (roll > p + C().rules.neverMargin) {
      b.crew!.leads = b.crew!.leads.filter((l) => l !== lead);
      return { ok: true, run: put(run, b), notice: `${lead.name}: ${says.never}`, joined: false };
    }
    lead.notBefore = b.day + RC().notYetDays;
    lead.bonus += RC().notYetBonus;
    return { ok: true, run: put(run, b), notice: `${lead.name}: ${says.notYet}`, joined: false };
  }
  lead.pitch = pitch;
  if (b.members.length >= b.rosterCap) {
    lead.waiting = true;
    lead.day = b.day;
    return { ok: true, run: put(run, b), notice: `${lead.name}: ${says.yes} ${fill(says.full, { days: RC().waitDays })}`, joined: false };
  }
  const out = joinLead(content, put(run, b), lead.id);
  return { ok: true, run: out, notice: `${lead.name}: ${says.yes}`, joined: true };
}

/** A lead on the waiting list joins once there's room. */
export function admit(content: Content, run: RunState, leadId: string): PitchOut {
  const b = run.expansion?.dominion;
  const lead = b?.crew?.leads.find((l) => l.id === leadId && l.waiting);
  if (!b || !lead) return { ok: false, run, notice: null, joined: false };
  if (b.members.length >= b.rosterCap) return { ok: false, run, notice: 'The HQ is full.', joined: false };
  return { ok: true, run: joinLead(content, run, leadId), notice: `${lead.name} joined.`, joined: true };
}

function joinLead(content: Content, run: RunState, leadId: string): RunState {
  let out = structuredClone(run);
  const b = withCrew(out.expansion!.dominion!);
  const lead = b.crew!.leads.find((l) => l.id === leadId)!;
  b.crew!.leads = b.crew!.leads.filter((l) => l !== lead);
  const rc = RC();
  const rank = rc.kinds.find((k) => k.id === lead.kind)?.rank ?? 'recruit';
  const wage0 = C().ranks.find((r) => r.id === rank)!.wage;
  const r = rng(run.seed, 'dominion-recruit', b.day, lead.id, 'join');
  const id = `m${b.crew!.next++}`;
  const temperament = C().greens.find((g) => g.id === lead.green)!.temperaments[0]!;
  const member: Member = {
    id, name: lead.name, rank, gender: lead.gender, look: lead.look, level: 1, stats: lead.stats,
    loyalty: lead.pitch === 'fear' ? rc.fearLoyalty : C().rules.joinLoyalty, morale: 50, traitPoints: 2, untrained: true,
    wage: lead.pitch === 'money' ? Math.round((wage0 * rc.moneyWage) / 10) * 10 : wage0, team: [], joinedDay: b.day, unpaid: 0,
    crew: { ...freshCrew(lead.green, temperament, 'guard-hq', b.day), cls: lead.cls, kind: lead.kind, role: lead.role, motive: lead.motive, ambition: lead.pitch === 'power' ? 10 + rc.powerAmbition : 10 },
  };
  if (lead.pitch === 'fear') b.heat = clamp(b.heat + rc.fearHeat);
  // Charismatic recruiters bring people with an extra trait point (Part 2 §4.2).
  const finder = b.members.find((m) => m.id === lead.foundBy);
  if (finder) member.traitPoints += crewOf(finder).formed.reduce((a, f) => a + (DOMINION_DATA.crew.formed.find((x) => x.id === f)?.mods.recruitPoints ?? 0), 0);
  out = { ...out, expansion: { ...out.expansion, dominion: b } };
  const mon = typeMon(content, out, b, r, DOMINION_DATA.crew.hire.monLevel, [], rank);
  member.team = [mon];
  b.members.push(member);
  if (finder) addLoyalty(b, finder, C().rules.finderLoyalty);
  return out;
}

/** A Pokémon of a Team Type for a new member (Part 7: every Grunt's Pokémon has one). */
function typeMon(content: Content, run: RunState, b: DominionBlock, r: ReturnType<typeof rng>, lv: [number, number], prefer: readonly string[] = [], rank = 'recruit'): PokemonInstance {
  const onType = prefer.filter((s) => content.species.get(s)?.types.some((t) => b.types.includes(t)));
  const pool = onType.length ? onType : memberMonPool(content, b.types);
  // D4: never over the new member's own level cap (their rank's share of the HQ cap, Part 8 §2).
  const pct = DOMINION_DATA.pyramid.ranks.find((x) => x.id === rank)?.lvPct ?? 100;
  const cap = Math.max(1, Math.floor((b.levelCap * pct) / 100));
  return newMon(content, run, pick(r, pool), Math.min(cap, r.int(lv[0], lv[1])), 'p');
}

// ---------- Hire Grunt (Part 6 §3) ----------

/** Species from a Grunt type's "Favours" that the content knows (three are rules, not species: they get the type pool). */
export const favourIds = (t: GruntType): string[] => t.favours.map((f) => f.toLowerCase().replace(/[.'’]/g, '').replace(/é/g, 'e').replace(/[^a-z0-9]+/g, '-'));

/** Today's hire list: rolled once a day on `dominion-hire` (C 60%, U 30%, R 10% from the second week; region types only in their region). */
export function hireList(b: DominionBlock, seed: string): Hire[] {
  if (b.crew?.hireDay === b.day) return b.crew.hires;
  const h = C().hire;
  const r = rng(seed, 'dominion-hire', b.day);
  const region = DOMINION_DATA.start.start.region.toLowerCase();
  const used = new Set(b.crew?.used ?? []);
  const fits = (t: GruntType): boolean => (!t.region || t.region === region) && !(t.once && (used.has(t.id) || b.day < h.onceFromDay)) && !(t.rarity === 'R' && b.day < h.rareFromDay);
  const out: Hire[] = [];
  const taken = new Set<string>();
  for (let i = 0; i < h.count; i++) {
    const w = h.rarityWeights;
    const roll = r.int(1, w.C + w.U + (b.day >= h.rareFromDay ? w.R : 0));
    const rarity = roll <= w.C ? 'C' : roll <= w.C + w.U ? 'U' : 'R';
    const pool = DOMINION_DATA.gruntTypes.filter((t) => t.rarity === rarity && fits(t) && !taken.has(t.id));
    if (!pool.length) continue;
    const t = pick(r, pool);
    taken.add(t.id);
    const name = nameFor({ ...b, crew: { ...(b.crew ?? freshCrewState()), hires: out } } as DominionBlock, r, 'm');
    out.push({ type: t.id, name, price: h.price[t.rarity], temperament: C().greens.find((g) => g.id === t.green)!.temperaments[0]!, green: t.green, sold: false });
  }
  return out;
}

/** Hires one Grunt from today's list. Returns why not, or the run with him in the crew. */
export function hire(content: Content, run: RunState, index: number): { run: RunState; notice: string | null; ok: boolean } {
  const block = run.expansion?.dominion;
  if (!block) return { run, notice: null, ok: false };
  const b = withCrew(block);
  const st = b.crew!;
  if (st.hireDay !== b.day) {
    st.hires = hireList(b, run.seed);
    st.hireDay = b.day;
  }
  const hr = st.hires[index];
  if (!hr || hr.sold) return { run, notice: null, ok: false };
  if (b.members.length >= b.rosterCap) return { run, notice: `The HQ is full (${b.members.length}/${b.rosterCap}).`, ok: false };
  if (b.funds < hr.price) return { run, notice: `Not enough money: ₽${hr.price}.`, ok: false };
  const t = gruntType(hr.type)!;
  const h = C().hire;
  const r = rng(run.seed, 'dominion-hire', b.day, index, 'join');
  b.funds -= hr.price;
  hr.sold = true;
  if (t.once) st.used.push(t.id);
  const id = `m${st.next++}`;
  let out: RunState = { ...structuredClone(run), expansion: { ...run.expansion, dominion: b } };
  const favours = favourIds(t).filter((s) => content.species.has(s));
  const mon = typeMon(content, out, b, r, h.monLevel, favours, h.rank);
  // Off-type favours go to the stores, which the Reserve takes in at the next step (Q6: off-type catches go to the Reserve).
  const off = favours.filter((s) => !content.species.get(s)!.types.some((ty) => b.types.includes(ty)));
  for (const s of off.slice(0, 1)) st.stores.push(newMon(content, out, s, Math.min(b.levelCap, r.int(h.monLevel[0], h.monLevel[1])), 'p'));
  const motive = pick(r, C().motives).id;
  b.members.push({
    id, name: hr.name, rank: h.rank, gender: 'm', look: 'dominion/c-rook0.png', level: 1, stats: rollStats(r, t.lean),
    loyalty: h.loyalty, morale: h.morale, traitPoints: 2, untrained: true, wage: h.wage, team: [mon], joinedDay: b.day, unpaid: 0,
    crew: { ...freshCrew(t.green, hr.temperament, startTask(t.bestAt, h.rank), b.day), type: t.id, motive },
  });
  out = { ...out, expansion: { ...out.expansion, dominion: b } };
  return { run: out, notice: `${hr.name} the ${t.name} joined. −₽${hr.price}.`, ok: true };
}

/** A new member starts on the task their type is best at, when their rank may take it; else Guard. */
function startTask(best: string, rank: string): string {
  const t = taskById(best);
  return t && t.status !== 'disabled' && rankN(rank) >= rankN(t.min) ? t.id : 'guard-hq';
}

// ---------- Patrons (A16) ----------

/** Pays a Patron's money job once they're found. */
export function payPatron(block: DominionBlock, patronId: string): { ok: boolean; block: DominionBlock; notice: string | null } {
  const b = withCrew(block);
  const p = C().patrons.find((x) => x.id === patronId);
  const st = b.crew!.patrons[patronId];
  if (!p || st?.state !== 'found' || p.job.kind !== 'funds') return { ok: false, block, notice: null };
  if (b.funds < p.job.amount) return { ok: false, block, notice: `Not enough money: ₽${p.job.amount}.` };
  b.funds -= p.job.amount;
  st.state = 'won';
  return { ok: true, block: b, notice: fill(C().report.patronWon!, { patron: p.name, perk: p.perk }) };
}

// Nightly upkeep: leads and the waiting list leave after 7 days; Patron rumours (once a region, after Crew); task-job Patrons won.
addCrewHook((b, _seed, n) => {
  const st = (b.crew ??= freshCrewState());
  const rc = RC();
  const rep = C().report;
  for (const l of [...st.leads]) {
    if (b.day - l.day < (l.waiting ? rc.waitDays : rc.leadDays)) continue;
    st.leads = st.leads.filter((x) => x !== l);
    n.say('crew', fill(l.waiting ? rep.waitGone! : rep.leadGone!, { cand: l.name }));
  }
  const open = Object.values(st.patrons).some((x) => x.state !== 'won');
  const last = Math.max(0, ...Object.values(st.patrons).map((x) => x.day));
  const next = C().patrons.find((p) => !st.patrons[p.id]);
  if (next && !open && notoriety(b) >= C().patronNotoriety && b.day - last >= 7) {
    st.patrons[next.id] = { state: 'rumour', progress: 0, day: b.day };
    n.say('world', fill(rep.patronRumour!, { rumour: next.rumour }));
  }
  for (const p of C().patrons) {
    const s = st.patrons[p.id];
    if (s?.state === 'found' && p.job.kind === 'tasks' && s.progress >= p.job.n) {
      s.state = 'won';
      n.say('crew', fill(rep.patronWon!, { patron: p.name, perk: p.perk }));
    }
  }
});

function put(run: RunState, b: DominionBlock): RunState {
  return { ...run, expansion: { ...run.expansion, dominion: b } };
}

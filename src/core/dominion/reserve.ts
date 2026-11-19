// DOMINION slice D4: the Pokémon Reserve (Part 7 §2-4) and Pokémon Trust (Part 9 A19). The team's shared box; the Boss
// hands each member their Pokémon by hand; caps and Team Types decide what fits; stolen Pokémon cool off in the Pens.
// Pure rules. The run-side parts (making a caught Pokémon, the Boss's own team) take the run and change a copy.

import type { Content } from '../contentSchema';
import { evolutionTarget, evolve } from '../evolution';
import { newMon } from '../run';
import type { PokemonInstance, RunState } from '../state';
import {
  addCrewHook, addLoyalty, addMorale, addOddsHook, addTaskKind, crewOf, familyOf, gruntType, leave, monName, rng, withCrew, type TaskCtx,
} from './crew';
import { DOMINION_DATA } from './data';
import { hqFx } from './hqFx';
import { acesOf, demote, fitFor, freshReserve, promote, readyFor, seatsOpen, strip, teamSizeOf, type Fit } from './pyramid';
import { favourIds } from './recruit';
import type { DominionAction, DominionBlock, Member, MonMeta, ReserveState } from './schema';
import { memberMonPool } from './start';
import { fill } from './worldTurn';

const P = () => DOMINION_DATA.pyramid;
const RS = () => DOMINION_DATA.pyramid.reserve;
const T = () => DOMINION_DATA.pyramid.trust;
const L = () => DOMINION_DATA.pyramid.lines;
const clampTrust = (n: number): number => Math.max(0, Math.min(T().max, Math.round(n)));
type Src = MonMeta['src'];

/** The block's Reserve book (made empty if a save predates D4). */
export const book = (b: DominionBlock): ReserveState => (b.reserve ??= freshReserve());
/** How many Pokémon the Reserve holds: the Warehouse's 20 (each Pokémon Storage room adds 60 with the HQ, D5). */
export const reserveSize = (b: DominionBlock): number => RS().size + hqFx(b).storage;

const bstOf = (s: { baseStats: Record<string, number> }): number => Object.values(s.baseStats).reduce((a, x) => a + x, 0);

/** What the team keeps about a Pokémon: Trust by how it came, its BST and types (for the caps), whether it's never for crew. */
export function metaFor(content: Content, speciesId: string, src: Src, by: string | null, day: number, trust?: number): MonMeta {
  const sp = content.species.get(speciesId);
  const rare = !!sp && (sp.tags.some((t) => P().caps.neverTags.includes(t)) || P().caps.never.includes(speciesId));
  return {
    trust: clampTrust(trust ?? T().start[src]), src, by, pens: src === 'stolen' ? day + RS().pensDays : 0, ace: false,
    bst: sp ? bstOf(sp) : 0, types: sp ? sp.types.slice(0, 2) : [], rare,
  };
}

/** After an evolution: the new species' BST and types (Trust and the rest stay). */
function refreshMeta(content: Content, meta: MonMeta, speciesId: string): void {
  const fresh = metaFor(content, speciesId, meta.src, meta.by, 1);
  meta.bst = fresh.bst;
  meta.types = fresh.types;
  meta.rare = fresh.rare;
}

/**
 * Brings the Reserve up to date on a block (runs at every step): D3's stores move into the Reserve, any Pokémon the team
 * holds without a record gets one ("own" for members' Pokémon), and records of Pokémon that are gone are dropped.
 */
export function withReserve(content: Content, b: DominionBlock): DominionBlock {
  const r = book(b);
  const st = b.crew;
  if (st?.stores.length) {
    // D5's rule: the Reserve holds 20 (more with Pokémon Storage); the newest over the cap are let go, and the report says so.
    let lost = 0;
    for (const mon of st.stores) {
      if (r.box.length < reserveSize(b)) {
        r.box.push(mon);
        r.meta[mon.uid] ??= metaFor(content, mon.speciesId, 'caught', null, b.day);
      } else lost++;
    }
    st.stores = [];
    if (lost) b.report = [...b.report, fill(DOMINION_DATA.hq.lines.storageFull!, { cap: reserveSize(b), n: lost })];
  }
  const seen = new Set<string>();
  for (const mon of r.box) {
    seen.add(mon.uid);
    r.meta[mon.uid] ??= metaFor(content, mon.speciesId, 'caught', null, b.day);
  }
  for (const m of b.members) {
    for (const mon of m.team) {
      seen.add(mon.uid);
      r.meta[mon.uid] ??= metaFor(content, mon.speciesId, 'own', m.id, b.day);
    }
  }
  for (const uid of Object.keys(r.meta)) if (!seen.has(uid)) delete r.meta[uid];
  for (const id of Object.keys(r.hunt)) if (!b.members.some((m) => m.id === id)) delete r.hunt[id];
  return b;
}

/** Day 1 (Part 7 §2.3): one Pokémon of each Team Type. The first member holds the first; the other waits in the Reserve. */
export function seedStart(content: Content, run: RunState, b: DominionBlock): void {
  const r = book(b);
  const first = b.members[0]?.team[0];
  const firstTypes: readonly string[] = first ? content.species.get(first.speciesId)?.types ?? [] : [];
  const type = b.types.find((t) => !firstTypes.includes(t)) ?? b.types[1];
  const pool = memberMonPool(content, [type]).filter((id) => {
    const sp = content.species.get(id)!;
    return bstOf(sp) <= RS().startMaxBst && (sp.types as readonly string[]).includes(type);
  });
  if (!pool.length) return;
  const g = rng(run.seed, 'dominion-reserve-start', b.types.join('-'));
  const [lo, hi] = RS().startLevel;
  const mon = newMon(content, run, pool[g.int(0, pool.length - 1)]!, g.int(lo, hi), 'p');
  r.box.push(mon);
  r.meta[mon.uid] = metaFor(content, mon.speciesId, 'caught', null, b.day);
}

// ---------- what fits whom ----------

const metaOf = (b: DominionBlock, mon: PokemonInstance): MonMeta | undefined => b.reserve?.meta[mon.uid];
const acesUsed = (b: DominionBlock, m: Member, except?: string): number => m.team.filter((x) => x.uid !== except && metaOf(b, x)?.ace).length;

/** A Pokémon a member holds can be sent out: it fits their caps now (Part 7 §4.3: over a cap it stays but sits out). */
export function usable(b: DominionBlock, m: Member, mon: PokemonInstance): boolean {
  const meta = metaOf(b, mon);
  if (!meta) return true;
  return fitFor(b, m, mon.level, meta, meta.ace).ok;
}
export const usableMons = (b: DominionBlock, m: Member): PokemonInstance[] => m.team.filter((x) => usable(b, m, x));

/** Whether a Reserve Pokémon can go to this member now: a free slot, and Team Type + caps, or a free Ace slot. */
export function fitsMember(b: DominionBlock, m: Member, mon: PokemonInstance): Fit {
  const meta = metaOf(b, mon);
  if (!meta) return { ok: false, ace: false, why: null };
  if (m.team.length >= teamSizeOf(m)) return { ok: false, ace: false, why: P().why.full };
  return fitFor(b, m, mon.level, meta, acesUsed(b, m) < acesOf(m));
}

// ---------- the player's moves ----------

type Out = { ok: boolean; run: RunState; notice: string | null };
const blockOf = (run: RunState): DominionBlock => run.expansion!.dominion!;
/** The run's block with the crew filled in (withCrew copies), put back on the run so changes to it stick. */
function ownBlock(run: RunState): DominionBlock {
  const b = withCrew(blockOf(run));
  run.expansion = { ...run.expansion, dominion: b };
  return b;
}

/** Give a Reserve Pokémon to a member (or to the Boss: 'boss'). */
export function give(content: Content, run: RunState, uid: string, to: string): Out {
  const out = structuredClone(run);
  const b = ownBlock(out);
  const r = book(b);
  const at = r.box.findIndex((x) => x.uid === uid);
  if (at < 0) return { ok: false, run, notice: null };
  const mon = r.box[at]!;
  if (to === 'boss') {
    r.box.splice(at, 1);
    delete r.meta[uid];
    if (out.party.length < 6) out.party.push(mon);
    else out.box = [...(out.box ?? []), mon];
    return { ok: true, run: out, notice: fill(L().givenBoss!, { mon: monName(mon.speciesId) }) };
  }
  const m = b.members.find((x) => x.id === to);
  if (!m) return { ok: false, run, notice: null };
  const fit = fitsMember(b, m, mon);
  if (!fit.ok) return { ok: false, run, notice: fit.why ? `${monName(mon.speciesId)}: ${fit.why}.` : null };
  r.box.splice(at, 1);
  r.meta[uid]!.ace = fit.ace;
  m.team.push(mon);
  const lines = [fill(L().given!, { mon: monName(mon.speciesId), name: m.name })];
  const t = gruntType(crewOf(m).type);
  if (t && favourIds(t).includes(mon.speciesId)) {
    addMorale(m, RS().favourMorale);
    lines.push(fill(L().favour!, { name: m.name, mon: monName(mon.speciesId), n: RS().favourMorale }));
  }
  crewOf(m).memory.push({ day: b.day, line: `The Boss gave me a ${monName(mon.speciesId)}.` });
  return { ok: true, run: out, notice: lines.join(' ') };
}

/** Take a Pokémon back into the Reserve (any Evening): Loyalty −5, −10 for their Ace or one they caught themselves. */
export function takeBack(b: DominionBlock, memberId: string, uid: string): { ok: boolean; notice: string | null } {
  const r = book(b);
  const m = b.members.find((x) => x.id === memberId);
  const mon = m?.team.find((x) => x.uid === uid);
  if (!m || !mon) return { ok: false, notice: null };
  if (b.phase !== 'evening') return { ok: false, notice: 'Pokémon are taken back in the Evening.' };
  if (r.box.length >= reserveSize(b)) return { ok: false, notice: `The Reserve is full (${reserveSize(b)}).` };
  const meta = r.meta[uid];
  const n = meta && (meta.ace || meta.by === m.id) ? RS().takeAceLoyalty : RS().takeLoyalty;
  m.team = m.team.filter((x) => x.uid !== uid);
  r.box.push(mon);
  if (meta) meta.ace = false;
  addLoyalty(b, m, n);
  crewOf(m).memory.push({ day: b.day, line: `The Boss took my ${monName(mon.speciesId)} back.` });
  return { ok: true, notice: fill(L().taken!, { mon: monName(mon.speciesId), name: m.name, n }) };
}

/** Auto-fill (Part 7 §2.2): each member's empty slots get the best fitting Pokémon in the Reserve. Returns how many went. */
export function autoFill(b: DominionBlock): number {
  const r = book(b);
  let n = 0;
  for (const m of b.members) {
    while (m.team.length < teamSizeOf(m)) {
      const pick = [...r.box]
        .filter((x) => fitsMember(b, m, x).ok)
        .sort((a, x) => (r.meta[x.uid]?.bst ?? 0) - (r.meta[a.uid]?.bst ?? 0) || x.level - a.level || a.uid.localeCompare(x.uid))[0];
      if (!pick) break;
      r.meta[pick.uid]!.ace = fitsMember(b, m, pick).ace;
      r.box = r.box.filter((x) => x.uid !== pick.uid);
      m.team.push(pick);
      n += 1;
    }
  }
  return n;
}

/** Offer a Reserve Pokémon its freedom (A19): it may choose to stay (Trust 10), rolled on `dominion-trust`. */
export function offerFreedom(b: DominionBlock, uid: string, seed: string): { ok: boolean; notice: string | null } {
  const r = book(b);
  const mon = r.box.find((x) => x.uid === uid);
  const meta = r.meta[uid];
  if (!mon || !meta) return { ok: false, notice: null };
  const stay = rng(seed, 'dominion-trust', 'free', b.day, uid).int(1, 100) <= meta.trust * T().freedomStayPer;
  if (stay) {
    meta.trust = T().max;
    return { ok: true, notice: fill(L().freeStay!, { mon: monName(mon.speciesId) }) };
  }
  r.box = r.box.filter((x) => x.uid !== uid);
  delete r.meta[uid];
  return { ok: true, notice: fill(L().freeGone!, { mon: monName(mon.speciesId) }) };
}

/** A caught, stolen or rescued Pokémon arrives: kept "for themselves" if it fits, else the Reserve (or let go when full). */
export function placeMon(content: Content, run: RunState, b: DominionBlock, p: { species: string; level: number; by?: string; src?: Src; self?: boolean; trust?: number }): string | null {
  if (!content.species.has(p.species)) return null;
  const r = book(b);
  const mon = newMon(content, run, p.species, p.level, 'p');
  const src = p.src ?? 'caught';
  const finder = p.by ? b.members.find((x) => x.id === p.by) : undefined;
  // Gentle Hands (a Formed trait): what they catch trusts the team a little more.
  const gentle = finder?.crew?.formed.includes('gentle-hands') ? RS().gentleTrust : 0;
  const meta = metaFor(content, p.species, src, p.by ?? null, b.day, (p.trust ?? T().start[src]) + gentle);
  r.meta[mon.uid] = meta;
  const name = monName(p.species);
  const m = p.self ? finder : undefined;
  if (m) {
    const fit = fitsMember(b, m, mon);
    // "For themselves": only a Team Type Pokémon under their caps (Q6: off-type finds go to the Reserve).
    if (fit.ok && !fit.ace) {
      m.team.push(mon);
      addLoyalty(b, m, RS().selfLoyalty);
      return fill(L().kept!, { name: m.name, mon: name, self: m.gender === 'f' ? 'herself' : 'himself', n: RS().selfLoyalty });
    }
  }
  if (r.box.length >= reserveSize(b)) {
    delete r.meta[mon.uid];
    return fill(L().full!, { size: reserveSize(b), mon: name });
  }
  r.box.push(mon);
  return src === 'stolen' ? fill(L().pens!, { mon: name, days: RS().pensDays }) : fill(L().toReserve!, { mon: name });
}

/** Evolve in Peace: the first crew Pokémon ready to evolve (Trust 7+ counts as friendship), else the Boss's. */
export function evolveOne(content: Content, run: RunState, b: DominionBlock): string {
  const r = book(b);
  for (const m of b.members) {
    for (const mon of m.team) {
      const meta = r.meta[mon.uid];
      const to = evolutionTarget(content, mon, undefined, 0, (meta?.trust ?? 0) >= T().loyalFrom);
      if (!to) continue;
      const from = mon.speciesId;
      evolve(content, mon, to);
      if (meta) refreshMeta(content, meta, to);
      return fill(L().evolved!, { name: m.name, from: monName(from), to: monName(to) });
    }
  }
  for (const mon of run.party) {
    const to = evolutionTarget(content, mon);
    if (!to) continue;
    const from = mon.speciesId;
    evolve(content, mon, to);
    return fill(L().evolvedBoss!, { from: monName(from), to: monName(to) });
  }
  return L().noEvolve!;
}

/** The D4 actions on the run (the Reserve, the pyramid). Null for anything else. */
export function reserveInRun(content: Content, run: RunState, a: DominionAction): Out | null {
  const simple = (f: (b: DominionBlock) => { ok: boolean; notice: string | null }): Out => {
    const out = structuredClone(run);
    const b = withReserve(content, ownBlock(out));
    const res = f(b);
    return res.ok ? { ok: true, run: out, notice: res.notice } : { ok: false, run, notice: res.notice };
  };
  switch (a.t) {
    case 'give': {
      const out = structuredClone(run);
      withReserve(content, ownBlock(out));
      return give(content, out, a.uid, a.to);
    }
    case 'takeBack':
      return simple((b) => takeBack(b, a.member, a.uid));
    case 'autoFill':
      return simple((b) => {
        const r = book(b);
        r.auto = !r.auto;
        if (!r.auto) return { ok: true, notice: 'Auto-fill is off.' };
        const n = autoFill(b);
        return { ok: true, notice: n ? fill(L().auto!, { n }) : L().autoNone! };
      });
    case 'hunt':
      return simple((b) => {
        if (!b.members.some((m) => m.id === a.member)) return { ok: false, notice: null };
        book(b).hunt[a.member] = a.mode;
        return { ok: true, notice: null };
      });
    case 'free':
      return simple((b) => offerFreedom(b, a.uid, run.seed));
    case 'promote':
      return simple((b) => promote(b, a.member));
    case 'demote':
      return simple((b) => demote(b, a.member));
    case 'strip':
      return simple((b) => strip(b, a.member));
    default:
      return null;
  }
}

// ---------- the night (crew World Turn hooks) and the odds ----------

const battleTask = (taskId: string | null): boolean => !!taskId && RS().battleFamilies.includes(familyOf(taskId) ?? '');
const won = (m: Member): boolean => crewOf(m).last === 'success' || crewOf(m).last === 'big';

addOddsHook((b, m, task) => {
  if (!b.reserve) return 0;
  const mons = usableMons(b, m);
  let p = 0;
  if (!mons.length && battleTask(task.id)) p -= RS().emptyPenalty;
  for (const mon of mons) {
    const t = b.reserve.meta[mon.uid]?.trust;
    if (t === undefined) continue;
    if (t >= T().loyalFrom) p += T().jobBonus;
    else if (t < T().disobeyBelow) p -= T().disobeyPenalty;
  }
  return p;
});

addCrewHook((b, seed, n) => {
  if (!b.reserve) return;
  const r = b.reserve;
  // The Pens: stolen Pokémon cool off; a scared one (Trust 0-3) may slip out unless someone guarded the Pens.
  const guarded = b.members.some((m) => crewOf(m).lastTask === 'guard-the-pens' && won(m));
  for (const mon of [...r.box]) {
    const meta = r.meta[mon.uid];
    if (!meta?.pens) continue;
    if (meta.pens <= b.day) {
      meta.pens = 0;
      n.say('crew', fill(L().pensOut!, { mon: monName(mon.speciesId) }));
    } else if (!guarded && meta.trust < T().disobeyBelow && rng(seed, 'dominion-trust', b.day, mon.uid, 'escape').int(1, 100) <= RS().escapeChance) {
      r.box = r.box.filter((x) => x.uid !== mon.uid);
      delete r.meta[mon.uid];
      n.say('crew', fill(L().escaped!, { mon: monName(mon.speciesId) }));
    }
  }
  for (const m of b.members) {
    for (const mon of m.team) {
      const meta = r.meta[mon.uid];
      if (meta?.pens && meta.pens <= b.day) meta.pens = 0;
    }
    const c = crewOf(m);
    if (!battleTask(c.lastTask) || c.last === 'none') continue;
    const mons = usableMons(b, m);
    if (!mons.length) {
      n.say('crew', fill(L().broom!, { name: m.name, he: m.gender === 'f' ? 'She' : 'He' }));
      continue;
    }
    // A stolen Pokémon fighting before its cool-off is over: personal Heat +2.
    if (mons.some((x) => (r.meta[x.uid]?.pens ?? 0) > 0)) c.pHeat = Math.min(100, c.pHeat + RS().pensHeat);
    // Wins together raise Trust (A19).
    const lead = mons[0]!;
    const meta = r.meta[lead.uid];
    if (won(m) && meta && meta.trust < T().max && rng(seed, 'dominion-trust', b.day, lead.uid, 'win').int(1, 100) <= T().winChance) {
      meta.trust += 1;
      n.say('crew', fill(L().trustUp!, { mon: monName(lead.speciesId), name: m.name, n: meta.trust }));
    }
  }
  // Stripped today: they may walk out tonight, taking one Pokémon.
  for (const id of r.stripped) {
    const m = b.members.find((x) => x.id === id);
    if (!m || rng(seed, 'dominion-rank', b.day, id, 'strip').int(1, 100) > P().moves.stripQuitChance) continue;
    const mon = m.team[0];
    leave(b, m, 'stripped', null, '');
    n.say('crew', fill(L().strippedQuit!, { name: m.name, mon: mon ? monName(mon.speciesId) : 'nothing' }));
  }
  r.stripped = [];
  r.promoted = [];
  // Nurturer (a Formed trait): while he rests, the lowest Reserve Pokémon gains a level.
  for (const m of b.members) {
    if (!crewOf(m).formed.includes('nurturer') || crewOf(m).lastTask !== 'rest') continue;
    const low = [...r.box].filter((x) => x.level < b.levelCap).sort((a, x) => a.level - x.level || a.uid.localeCompare(x.uid))[0];
    if (low) b.crew!.pending.push({ k: 'level', member: m.id, uid: low.uid, level: low.level + 1 });
  }
  const week = DOMINION_DATA.start.clock.weekLength;
  if (b.day > 1 && (b.day - 1) % week === 0) {
    for (const m of b.members) {
      // A Gentle or Calm member: their Pokémon trust them +1 a week.
      if (T().gentle.includes(crewOf(m).temperament)) for (const mon of m.team) { const meta = r.meta[mon.uid]; if (meta) meta.trust = clampTrust(meta.trust + T().gentleWeekly); }
      // Ready, but the seat is full: Ambition +2 a week.
      const next = readyFor(b, m);
      if (next && !seatsOpen(b, next.id)) {
        crewOf(m).ambition = Math.min(100, crewOf(m).ambition + P().moves.readyAmbition);
        n.say('crew', fill(L().ready!, { name: m.name, rank: rankName(next.id) }));
      }
    }
    // "We look like a team": every member's Pokémon on-type (Aces aside).
    const onType = b.members.length > 0 && b.members.every((m) => m.team.length > 0 && m.team.every((x) => { const meta = r.meta[x.uid]; return !meta || meta.ace || meta.types.some((t) => b.types.includes(t)); }));
    if (onType) {
      for (const m of b.members) addMorale(m, RS().onTypeMorale);
      n.lines.push(fill(L().onType!, { n: RS().onTypeMorale }));
    }
  }
  // A seat that's open with someone Ready for it: a line in the Morning Report.
  const want = new Map<string, string[]>();
  for (const m of b.members) {
    const next = readyFor(b, m);
    if (next && seatsOpen(b, next.id) && next.seats) want.set(next.id, [...(want.get(next.id) ?? []), m.name]);
  }
  for (const [id, names] of want) n.lines.push(fill(L().seatOpen!, { rank: rankName(id), names: names.join(', ') }));
});

const rankName = (id: string): string => DOMINION_DATA.crew.ranks.find((x) => x.id === id)?.word ?? id;

// ---------- the D4 crew tasks ----------

interface TaskRun { b: DominionBlock; m: Member; ok: boolean; lv: number; r: TaskCtx['r']; label: string; say: TaskCtx['say'] }
const kind = (k: string, f: (x: TaskRun) => void): void => addTaskKind(k, (b, m, ok, c) => f({ b, m, ok, lv: c.lv, r: c.r, label: c.label, say: c.say }));

kind('pens', (x) => {
  if (x.ok) x.say('crew', fill(L().penWatch!, { name: x.m.name }));
  else x.say('crew', fill(DOMINION_DATA.crew.report.fail!, { name: x.m.name, task: x.label }));
});

kind('tend', (x) => {
  const r = book(x.b);
  const low = [...r.box].filter((m) => (r.meta[m.uid]?.trust ?? T().max) < T().max).sort((a, m) => r.meta[a.uid]!.trust - r.meta[m.uid]!.trust || a.uid.localeCompare(m.uid));
  if (!x.ok || !low.length) return x.say('crew', fill(DOMINION_DATA.crew.report.fail!, { name: x.m.name, task: x.label }));
  for (const mon of low.slice(0, x.lv >= 3 ? 2 : 1)) {
    const meta = r.meta[mon.uid]!;
    meta.trust = clampTrust(meta.trust + 1);
    x.say('crew', fill(L().tend!, { name: x.m.name, mon: monName(mon.speciesId), n: meta.trust }));
  }
});

kind('feed', (x) => {
  if (!x.ok) return x.say('crew', fill(DOMINION_DATA.crew.report.fail!, { name: x.m.name, task: x.label }));
  const k = x.lv >= 2 ? 2 : 1;
  for (const m of x.b.members) addMorale(m, k);
  x.say('crew', fill(L().feed!, { name: x.m.name, n: k }));
});

kind('release', (x) => {
  const r = book(x.b);
  const weak = [...r.box].filter((m) => !r.meta[m.uid]?.pens).sort((a, m) => (r.meta[a.uid]?.bst ?? 0) - (r.meta[m.uid]?.bst ?? 0) || a.level - m.level || a.uid.localeCompare(m.uid))[0];
  if (!x.ok) return x.say('crew', fill(DOMINION_DATA.crew.report.fail!, { name: x.m.name, task: x.label }));
  if (!weak) return x.say('crew', fill(L().releaseNone!, { name: x.m.name }));
  const pay = RS().releasePay[x.lv - 1] ?? RS().releasePay[0]!;
  r.box = r.box.filter((m) => m.uid !== weak.uid);
  delete r.meta[weak.uid];
  x.b.funds += pay;
  x.b.earned += pay;
  x.say('money', fill(L().release!, { name: x.m.name, mon: monName(weak.speciesId), pay }));
});

kind('rehab', (x) => {
  if (!x.ok) return x.say('crew', fill(DOMINION_DATA.crew.report.fail!, { name: x.m.name, task: x.label }));
  const region = DOMINION_DATA.start.start.region.toLowerCase();
  const pool = (DOMINION_DATA.crew.pools[region] ?? DOMINION_DATA.crew.pools.kanto!).catch;
  const species = pool[x.r.int(0, pool.length - 1)]!;
  const R = DOMINION_DATA.crew.rules;
  const level = Math.min(x.b.levelCap, x.r.int(R.catchLevel[0], R.catchLevel[1]));
  x.b.crew!.pending.push({ k: 'mon', species, level, by: x.m.id, src: 'rescued' });
  x.say('crew', fill(L().rehab!, { name: x.m.name, mon: monName(species), n: T().start.rescued }));
});

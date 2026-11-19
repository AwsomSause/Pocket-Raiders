// DOMINION slice D5: the HQ (Part 3 §3, Part 6 §3, Part 9 A21-A22; lists/buildings.md and buildings-pokemon-and-grunt.md).
// Six HQ levels (level cap, crew cap, room slots, Defense), rooms and outside buildings with eight tiers each, Condition
// and upkeep, clean money and laundering, going broke and a Fence's loan, letting members go. Pure: each function takes a
// private copy of the block and returns it with a notice. The HQ's World Turn step finishes works, pays the buildings and
// the bills, and runs the loan.

import { rankN, withCrew } from './crew';
import { DOMINION_DATA } from './data';
import { addHeat, districtDef, statusOf, syncHeat } from './field';
import { addClean, buildingDef, clampClean, cleanOf, spend, dirtyOf, hqFx, hqOf, levelDef, scaled, withHq, working } from './hqFx';
import type { Building, DominionBlock, HqState, Room } from './schema';
import { addWorldStep, fill } from './worldTurn';

const H = () => DOMINION_DATA.hq;
const Ln = () => DOMINION_DATA.hq.lines;
const F = () => DOMINION_DATA.field;

export interface HqOut {
  ok: boolean;
  block: DominionBlock;
  notice: string | null;
}
const no = (block: DominionBlock, notice: string | null): HqOut => ({ ok: false, block, notice });
const yes = (block: DominionBlock, notice: string | null): HqOut => ({ ok: true, block, notice });
const money = (n: number): string => `₽${n.toLocaleString('en-US')}`;
const s = (n: number): string => (n === 1 ? '' : 's');

/** A private copy with `hq` and the crew filled in. */
function copy(block: DominionBlock): DominionBlock & { hq: HqState } {
  return withHq(withCrew(structuredClone(block))) as DominionBlock & { hq: HqState };
}

// ---------- counts ----------

/** Districts you hold (Part 3 §2: Held or Owned). */
export const heldDistricts = (b: DominionBlock): string[] =>
  F().districts.filter((d) => {
    const st = b.field.districts[d.id];
    return !!st && (statusOf(st) === 'held' || statusOf(st) === 'owned');
  }).map((d) => d.id);

/** Gyms come with D10: a flag `gym-taken` or `gym-beaten` marks one. */
export const gymDone = (b: DominionBlock): boolean => b.flags.includes('gym-taken') || b.flags.includes('gym-beaten');
/** The Notoriety ladder (D6) sets `feared`. */
export const feared = (b: DominionBlock): boolean => b.flags.includes('feared');
/** Regions reached in the run (Part 5: D15 adds more; Dominion is Kanto only until then). */
export const regionsReached = (_b: DominionBlock): number => 1;

export const slotsOf = (b: DominionBlock): number => levelDef(b.hqLevel).slots;
/** HQ slots taken: rooms inside (outside buildings use none), works included, ruined ones too (rebuild or sell them). */
export const slotsUsed = (b: DominionBlock): number =>
  hqOf(b).rooms.filter((r) => !r.at).reduce((a, r) => a + (buildingDef(r.id)?.slots ?? 1), 0);
export const slotsFree = (b: DominionBlock): number => Math.max(0, slotsOf(b) - slotsUsed(b));
export const storageCap = (b: DominionBlock): number => H().rules.storageBase + hqFx(b).storage;

/** A21: Defense (Lv. 1: 1, then 2, 4, 6, 8, 10) plus the rooms; halved while the HQ is upgraded, −1 while a room is being worked on, −1 when broke. */
export function defense(b: DominionBlock): number {
  const h = hqOf(b);
  let d = levelDef(b.hqLevel).defense + hqFx(b).defense;
  if (h.upgrade) d = Math.floor(d / 2);
  if (h.rooms.some((r) => r.building || r.up)) d -= 1;
  if (h.broke) d -= H().rules.brokeDefense;
  return Math.max(0, d);
}

/** Crew cap = the HQ level's + the rooms'. Called after anything that changes the HQ. */
export function recompute(b: DominionBlock): void {
  b.rosterCap = levelDef(b.hqLevel).crewCap + hqFx(b).crewCap;
  clampClean(b);
}

/** The HQ's own name ("THE WAREHOUSE", "HIDEOUT"...) for the top bar. */
export const hqName = (b: DominionBlock): string => {
  const n = levelDef(b.hqLevel).name.toUpperCase();
  return n.startsWith('THE ') ? n : `THE ${n}`;
};

// ---------- the upgrade (Part 3 §3.1, A21) ----------

export interface Need { label: string; have: number; need: number; ok: boolean }
export interface UpgradeInfo {
  to: number | null;
  name: string;
  cost: number;
  needs: Need[];
  /** What it raises: level cap, crew cap, room slots. */
  raises: { cap: [number | null, number | null]; crew: [number, number]; slots: [number, number] };
  ready: number | null;
  why: string | null;
}

export function upgradeInfo(b: DominionBlock, regionCap: number): UpgradeInfo {
  const h = hqOf(b);
  const cur = levelDef(b.hqLevel);
  if (b.hqLevel >= 6) return { to: null, name: cur.name, cost: 0, needs: [], raises: { cap: [b.levelCap, null], crew: [cur.crewCap, cur.crewCap], slots: [cur.slots, cur.slots] }, ready: null, why: Ln().top! };
  const nx = levelDef(b.hqLevel + 1);
  const held = heldDistricts(b).length;
  const clean = cleanOf(b);
  const needs: Need[] = [{ label: `${money(clean)} clean of ${money(nx.cost)}`, have: clean, need: nx.cost, ok: clean >= nx.cost }];
  const n = nx.needs;
  if (n.districts) needs.push({ label: `Districts ${held} of ${n.districts}`, have: held, need: n.districts, ok: held >= n.districts });
  if (n.crew) needs.push({ label: `Crew ${b.members.length} of ${n.crew}`, have: b.members.length, need: n.crew, ok: b.members.length >= n.crew });
  if (n.gym) needs.push({ label: 'A Gym taken or beaten', have: gymDone(b) ? 1 : 0, need: 1, ok: gymDone(b) });
  if (n.admin) {
    const a = b.members.some((m) => rankN(m.rank) >= rankN('admin'));
    needs.push({ label: 'An Admin', have: a ? 1 : 0, need: 1, ok: a });
  }
  if (n.half) {
    const half = Math.ceil(F().districts.length / 2);
    needs.push({ label: `Half the region: ${held} of ${half}`, have: held, need: half, ok: held >= half });
  }
  if (n.feared) needs.push({ label: 'Feared (Notoriety)', have: feared(b) ? 1 : 0, need: 1, ok: feared(b) });
  const cap = nx.levelCap ?? regionCap;
  const why = h.upgrade ? Ln().upgrading! : needs.find((x) => !x.ok && x !== needs[0])?.label ?? (needs[0]!.ok ? null : fill(Ln().noClean!, { clean, cost: nx.cost }));
  return {
    to: nx.lv, name: nx.name, cost: nx.cost, needs,
    raises: { cap: [b.levelCap, cap], crew: [cur.crewCap, nx.crewCap], slots: [cur.slots, nx.slots] },
    ready: h.upgrade?.ready ?? null, why,
  };
}

/** Starts the upgrade: clean money only, three days of work, Defense halved meanwhile. */
export function upgrade(block: DominionBlock, regionCap: number): HqOut {
  const info = upgradeInfo(block, regionCap);
  if (!info.to || info.why) return no(block, info.why);
  const b = copy(block);
  b.hq.clean = cleanOf(b) - info.cost;
  spend(b, info.cost);
  b.hq.upgrade = { to: info.to, ready: b.day + H().upgradeDays, cap: info.raises.cap[1] ?? b.levelCap };
  recompute(b);
  return yes(b, fill(Ln().upgradeStart!, { name: info.name }));
}

function finishUpgrade(b: DominionBlock & { hq: HqState }): string[] {
  const up = b.hq.upgrade;
  if (!up || b.day < up.ready) return [];
  b.hqLevel = up.to;
  b.levelCap = Math.max(b.levelCap, up.cap);
  b.hq.upgrade = null;
  recompute(b);
  const L = levelDef(b.hqLevel);
  return [fill(Ln().upgradeDone!, { name: L.name, lv: L.lv, cap: b.levelCap, crew: b.rosterCap, slots: L.slots })];
}

// ---------- rooms and buildings ----------

/** The highest tier a building can reach now (lists §1: the HQ level and the regions reached cap it; T4 needs a Gym in region 1). */
export function maxTier(b: DominionBlock): number {
  let t = 0;
  for (const row of H().tiers) {
    if (row.hq > b.hqLevel || row.region > regionsReached(b) || (row.gym && regionsReached(b) <= 1 && !gymDone(b))) break;
    t = row.t;
  }
  return t;
}
/** ₽ to raise a building from tier t-1 to t (T1 is the base price). */
export const tierCost = (def: Building, t: number): number => Math.round(def.cost * H().tiers[t - 1]!.cost);

export interface BuildRow { def: Building; cost: number; ok: boolean; why: string | null; outside: boolean; where: string | null }

/** Why a building can't be bought now (null when it can). `district` for outside buildings. */
export function buildWhy(b: DominionBlock, def: Building, district: string | null): string | null {
  if (def.status === 'disabled') return fill(Ln().waits!, { slice: def.waits ?? 'later' });
  if (b.field.fight) return 'A fight is waiting.';
  const need = def.minTier + 1;
  if (b.hqLevel < need) return fill(Ln().needsTier!, { lv: need });
  if (def.outside) {
    if (!district || !heldDistricts(b).includes(district)) return Ln().needsHeld!;
    if (hqOf(b).rooms.some((r) => r.id === def.id && r.at === district)) return 'You have one there.';
  } else if (def.slots > slotsFree(b)) return Ln().noSlot!;
  if (b.funds < def.cost) return fill(Ln().noMoney!, { cost: def.cost });
  return null;
}

/** The Buy Room list: the poster's seven first, then the rest in list order; disabled ones last. */
export function buildRows(b: DominionBlock, district: string | null): BuildRow[] {
  const all = DOMINION_DATA.buildings;
  const poster = H().poster.map((id) => all.find((x) => x.id === id)!);
  const rest = all.filter((x) => !H().poster.includes(x.id));
  const order = [...poster, ...rest.filter((x) => x.status !== 'disabled'), ...rest.filter((x) => x.status === 'disabled')];
  const held = heldDistricts(b);
  return order.map((def) => {
    const where = def.outside ? (district && held.includes(district) ? district : held[0] ?? null) : null;
    const why = buildWhy(b, def, where);
    return { def, cost: def.cost, ok: !why, why, outside: def.outside, where };
  });
}

/** Buys a building's T1: inside it takes slots, outside it stands in a held district. Ready after the T1 build days. */
export function build(block: DominionBlock, id: string, district: string | null): HqOut {
  const def = buildingDef(id);
  if (!def) return no(block, null);
  const where = def.outside ? district : null;
  const why = buildWhy(block, def, where);
  if (why) return no(block, why);
  const b = copy(block);
  const days = H().tiers[0]!.days;
  spend(b, def.cost);
  b.hq.rooms.push({ uid: `r${b.hq.next++}`, id, tier: 1, cond: 100, spent: def.cost, building: true, up: false, ready: b.day + days, shut: false, ruined: false, at: where });
  recompute(b);
  return yes(b, fill(Ln().building!, { name: def.name, days, s: s(days) }));
}

const roomOf = (b: DominionBlock, uid: string): Room | undefined => hqOf(b).rooms.find((r) => r.uid === uid);
export const roomName = (r: Room): string => {
  const def = buildingDef(r.id);
  return def ? def.name : r.id;
};

/** Raises a building one tier (cost T1 x the tier's multiplier); it keeps working at the old tier until the work is done. */
export function tierUp(block: DominionBlock, uid: string): HqOut {
  const r0 = roomOf(block, uid);
  const def = r0 && buildingDef(r0.id);
  if (!r0 || !def) return no(block, null);
  if (r0.building || r0.up) return no(block, Ln().busy!);
  if (r0.ruined) return no(block, 'Rebuild it first.');
  const t = r0.tier + 1;
  const top = maxTier(block);
  if (t > 8 || t > top) return no(block, fill(Ln().maxTier!, { name: def.name, lv: block.hqLevel, region: regionsReached(block), t: Math.min(8, Math.max(1, top)) }));
  const cost = tierCost(def, t);
  if (block.funds < cost) return no(block, fill(Ln().noMoney!, { cost }));
  const b = copy(block);
  const r = roomOf(b, uid)!;
  const days = H().tiers[t - 1]!.days;
  spend(b, cost);
  r.spent += cost;
  r.up = true;
  r.ready = b.day + days;
  recompute(b);
  return yes(b, fill(Ln().building!, { name: `${def.name} T${t}`, days, s: s(days) }));
}

/** Sells a building for 60% of what it cost (clean money: it's a legal sale). */
export function sell(block: DominionBlock, uid: string): HqOut {
  const r0 = roomOf(block, uid);
  if (!r0) return no(block, null);
  const b = copy(block);
  const pay = Math.round((r0.spent * H().rules.sellPct) / 100);
  b.hq.rooms = b.hq.rooms.filter((r) => r.uid !== uid);
  addClean(b, pay);
  recompute(b);
  return yes(b, fill(Ln().sold!, { name: roomName(r0), pay }));
}

/** A ruined building is rebuilt at 60% of what it cost, one tier lower (lists §1). */
export function rebuild(block: DominionBlock, uid: string): HqOut {
  const r0 = roomOf(block, uid);
  if (!r0?.ruined) return no(block, null);
  const cost = Math.round((r0.spent * H().rules.rebuildPct) / 100);
  if (block.funds < cost) return no(block, fill(Ln().noMoney!, { cost }));
  const b = copy(block);
  const r = roomOf(b, uid)!;
  spend(b, cost);
  r.ruined = false;
  r.cond = 100;
  r.building = true;
  r.ready = b.day + H().tiers[0]!.days;
  recompute(b);
  return yes(b, fill(Ln().building!, { name: roomName(r), days: 1, s: '' }));
}

/** Lowers a building's Condition (unpaid upkeep now; D9 raids, sabotage and D11's Hero later). At 0 it's ruined, one tier lower. */
export function wear(b: DominionBlock, r: Room, n: number): string | null {
  if (r.ruined) return null;
  r.cond = Math.max(0, r.cond - n);
  if (r.cond > 0) return null;
  r.ruined = true;
  r.up = false;
  r.tier = Math.max(1, r.tier - 1);
  return fill(Ln().destroyed!, { name: roomName(r), pct: H().rules.rebuildPct });
}

// ---------- money: laundering, loans, letting go (A21-A22) ----------

/** The Front laundering would go through: the best fee and its name, or null. */
export function front(b: DominionBlock): { fee: number; name: string } | null {
  let best: { fee: number; name: string } | null = null;
  for (const r of hqOf(b).rooms) {
    if (!working(r)) continue;
    const def = buildingDef(r.id)!;
    const fee = def.fx.launder !== undefined ? scaled('launder', def.fx.launder, r.tier) : r.at && def.fx.clean ? 10 : null;
    if (fee !== null && (!best || fee < best.fee)) best = { fee, name: def.name };
  }
  return best;
}

/** Puts dirty money through a Front: it leaves now and comes back clean (less the fee) the next morning. */
export function launder(block: DominionBlock, amount: number): HqOut {
  const fr = front(block);
  if (!fr) return no(block, Ln().noFront!);
  const n = Math.min(Math.floor(amount), dirtyOf(block));
  if (n < 1) return no(block, Ln().noDirty!);
  const b = copy(block);
  const net = Math.max(1, Math.floor((n * (100 - fr.fee)) / 100));
  const days = H().rules.launderDays;
  spend(b, n);
  clampClean(b);
  b.hq.wash.push({ net, ready: b.day + days, front: fr.name });
  return yes(b, fill(Ln().launder!, { amount: n, front: fr.name, fee: fr.fee, net, when: days === 1 ? 'tomorrow' : `in ${days} days` }));
}

export const loanMax = (b: DominionBlock): number => H().rules.loanPer * b.hqLevel;

/** A Fence's loan (A22): up to ₽5,000 x HQ level owed at once, 20% a week; after 4 weeks unpaid they take a business. */
export function loan(block: DominionBlock, amount: number): HqOut {
  const owed = hqOf(block).loan?.owed ?? 0;
  const max = loanMax(block);
  const n = Math.min(Math.floor(amount), max - owed);
  if (n < 1) return no(block, fill(Ln().loanMax!, { max, lv: block.hqLevel }));
  const b = copy(block);
  b.funds += n;
  b.hq.loan = { owed: owed + n, weeks: b.hq.loan?.weeks ?? 0 };
  return yes(b, fill(Ln().loanTaken!, { amount: n, rate: H().rules.loanRate, weeks: H().rules.loanWeeks }));
}

export function repay(block: DominionBlock, amount: number): HqOut {
  const l = hqOf(block).loan;
  if (!l) return no(block, Ln().noLoan!);
  const n = Math.min(Math.floor(amount), l.owed, Math.max(0, block.funds));
  if (n < 1) return no(block, fill(Ln().noMoney!, { cost: l.owed }));
  const b = copy(block);
  spend(b, n);
  clampClean(b);
  const left = l.owed - n;
  b.hq.loan = left > 0 ? { owed: left, weeks: l.weeks } : null;
  return yes(b, left > 0 ? fill(Ln().loanPart!, { pay: n, owed: left }) : Ln().loanPaid!);
}

/** A22: let a member go; they leave with their own Pokémon. The last member stays. */
export function letGo(block: DominionBlock, memberId: string): HqOut {
  const m0 = block.members.find((m) => m.id === memberId);
  if (!m0) return no(block, null);
  if (block.members.length <= 1) return no(block, Ln().lastMember!);
  const b = copy(block);
  b.members = b.members.filter((m) => m.id !== memberId);
  b.crew!.gone.push({ id: m0.id, name: m0.name, day: b.day, why: 'let go' });
  b.crew!.talks = b.crew!.talks.filter((t) => t.member !== memberId);
  recompute(b);
  return yes(b, fill(Ln().letGo!, { name: m0.name, wage: m0.wage }));
}

// ---------- the World Turn step ----------

/** The HQ's part of the night: works finish, the wash comes back, the buildings pay and make things; weekly: upkeep, the loan, going broke. */
export function hqStep(block: DominionBlock): string[] {
  if (!block.hq) return [];
  const b = block as DominionBlock & { hq: HqState };
  const h = b.hq, out: string[] = [];
  out.push(...finishUpgrade(b));
  for (const r of h.rooms) {
    if (r.ready > b.day || (!r.building && !r.up)) continue;
    const def = buildingDef(r.id)!;
    if (r.up) {
      r.tier += 1;
      out.push(fill(Ln().tierUp!, { name: def.name, ladder: def.ladder[r.tier - 1]!, t: r.tier }));
    } else {
      out.push(fill(Ln().built!, { name: def.name }));
      if (def.fx.heatOnce) {
        const where = r.at ?? F().hq;
        addHeat(b, where, -def.fx.heatOnce);
        out.push(fill(Ln().safehouse!, { district: districtDef(where)?.name ?? where, n: def.fx.heatOnce }));
      }
    }
    r.building = false;
    r.up = false;
  }
  for (const w of h.wash.filter((x) => x.ready <= b.day)) {
    addClean(b, w.net);
    b.earned += w.net;
    out.push(fill(Ln().laundered!, { net: w.net, front: w.front }));
  }
  h.wash = h.wash.filter((x) => x.ready > b.day);
  recompute(b);
  const fx = hqFx(b);
  // Every night: income, Heat at the HQ, things made.
  const k = (n: number): number => Math.round((n * (100 + fx.incomePct)) / 100);
  const dirty = k(fx.income), clean = k(fx.clean);
  if (dirty || clean) {
    b.funds += dirty;
    b.earned += dirty + clean;
    addClean(b, clean);
    out.push(fill(Ln().income!, { dirty: dirty.toLocaleString('en-US'), clean: clean ? ` and ₽${clean.toLocaleString('en-US')} clean` : '' }));
  }
  if (fx.heatDay) addHeat(b, F().hq, -fx.heatDay);
  const made = Object.entries(fx.items);
  const week = b.day % DOMINION_DATA.start.clock.weekLength === 0;
  if (week) made.push(...Object.entries(fx.weeklyItems));
  if (made.length) {
    for (const [id, n] of made) b.crew!.pending.push({ k: 'item', id, n });
    out.push(fill(Ln().items!, { list: made.map(([id, n]) => `${n} ${id.replace(/-/g, ' ')}`).join(', ') }));
  }
  if (h.broke && b.funds >= 0) {
    h.broke = false;
    const shut = h.rooms.find((r) => r.shut);
    for (const r of h.rooms) r.shut = false;
    if (shut) out.push(fill(Ln().unbroke!, { name: roomName(shut) }));
  }
  if (week) out.push(...weekly(b, fx));
  recompute(b);
  syncHeat(b);
  return out;
}

function weekly(b: DominionBlock & { hq: HqState }, fx: ReturnType<typeof hqFx>): string[] {
  const h = b.hq, R = H().rules, out: string[] = [];
  if (fx.weekly) {
    b.funds += fx.weekly;
    b.earned += fx.weekly;
  }
  if (fx.morale || fx.loyalty) {
    for (const m of b.members) {
      m.morale = Math.min(100, m.morale + fx.morale);
      m.loyalty = Math.min(100, m.loyalty + fx.loyalty);
    }
    out.push(fill(Ln().morale!, { morale: fx.morale, loyalty: fx.loyalty }));
  }
  // Control from buildings: an outside building holds its own district, a room holds the HQ's.
  const ctl: Record<string, number> = {};
  for (const r of h.rooms) {
    const c = buildingDef(r.id)?.fx.control;
    if (c && working(r)) ctl[r.at ?? F().hq] = (ctl[r.at ?? F().hq] ?? 0) + scaled('control', c, r.tier);
  }
  for (const [d, n] of Object.entries(ctl)) {
    const st = b.field.districts[d];
    if (st) st.control = Math.min(100, st.control + n);
    out.push(fill(Ln().control!, { n, where: districtDef(d)?.name ?? d }));
  }
  if (fx.heatWeek) addHeat(b, F().hq, -fx.heatWeek);
  if (fx.repair) {
    for (const r of h.rooms) if (!r.ruined) r.cond = Math.min(100, r.cond + fx.repair);
    out.push(fill(Ln().repair!, { n: fx.repair }));
  }
  // Upkeep: 4% of what each building cost, every week; unpaid, every building loses Condition.
  const upkeep = Math.round(h.rooms.filter((r) => !r.ruined).reduce((a, r) => a + r.spent, 0) * R.upkeepPct / 100);
  if (upkeep) {
    if (b.funds >= upkeep) {
      spend(b, upkeep);
      out.push(fill(Ln().upkeep!, { pay: upkeep }));
    } else {
      out.push(fill(Ln().unpaid!, { n: R.unpaidCondition }));
      for (const r of h.rooms) {
        const l = wear(b, r, R.unpaidCondition);
        if (l) out.push(l);
      }
    }
  }
  // The Fence's loan: 20% a week; after 4 weeks they take a business (a Front first, else the costliest building).
  if (h.loan) {
    h.loan.weeks += 1;
    h.loan.owed = Math.round((h.loan.owed * (100 + R.loanRate)) / 100);
    if (h.loan.weeks >= R.loanWeeks) {
      const pick = [...h.rooms].sort((x, y) => Number(!!buildingDef(y.id)?.fx.clean && !!y.at) - Number(!!buildingDef(x.id)?.fx.clean && !!x.at) || y.spent - x.spent)[0];
      if (pick) {
        h.rooms = h.rooms.filter((r) => r.uid !== pick.uid);
        out.push(fill(Ln().loanTakes!, { name: roomName(pick) }));
      } else {
        addHeat(b, F().hq, 10);
        out.push(Ln().loanTakesNothing!);
      }
      h.loan = null;
    } else out.push(fill(Ln().loanGrows!, { rate: R.loanRate, owed: h.loan.owed, week: h.loan.weeks, weeks: R.loanWeeks }));
  }
  // Going broke (A22): below ₽0 after the bills, the costliest working room shuts until paid, and Defense drops.
  if (b.funds < 0 && !h.broke) {
    h.broke = true;
    const top = h.rooms.filter((r) => working(r)).sort((x, y) => y.spent - x.spent)[0];
    if (top) top.shut = true;
    out.push(top ? fill(Ln().broke!, { name: roomName(top), n: R.brokeDefense }) : fill(Ln().brokeNoRoom!, { n: R.brokeDefense }));
  }
  return out;
}

addWorldStep('world', (b) => hqStep(b));

/** Members over the crew cap? Nobody is thrown out; hiring just stops (recruit.ts checks the cap). */
export const overCap = (b: DominionBlock): boolean => b.members.length > b.rosterCap;

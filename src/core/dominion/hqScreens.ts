// DOMINION slice D5: view models for the HQ menu (mockup 6, "The HQ, three weeks later"): the building cut open with
// its rooms, the next upgrade, the Buy Room list, and the View Assets and Money overlays. Plain data; no rolls.

import { DOMINION_DATA } from './data';
import { districtDef } from './field';
import {
  buildRows, defense, front, heldDistricts, hqName, loanMax, maxTier, regionsReached, roomName, slotsFree, slotsOf, storageCap,
  tierCost, upgradeInfo, type BuildRow, type UpgradeInfo,
} from './hq';
import { buildingDef, cleanOf, dirtyOf, hqOf, scaled, working } from './hqFx';
import type { Building, DominionBlock, Room } from './schema';
import { topModel, type TopModel } from './screens';

const H = () => DOMINION_DATA.hq;
const money = (n: number): string => `₽${n.toLocaleString('en-US')}`;
const k = (n: number): string => (n >= 1000 && n % 1000 === 0 ? `₽${n / 1000}k` : money(n));

export const iconOf = (def: Building): string => H().icons.ids[def.id] ?? H().icons.groups[def.group] ?? 'g-letter';
export const coloursOf = (def: Building): [string, string] => (H().icons.colours[def.group] ?? ['#3a3550', '#2a2640']) as [string, string];

/** A room's short effect line ("2 slots · crew +6", "+1 action · Raid", "₽30k safe"), as on mockup 6. */
export function shortFx(def: Building, tier: number): string {
  const f = def.fx, bits: string[] = [];
  if (def.slots > 1) bits.push(`${def.slots} slots`);
  const v = (key: keyof typeof f, n: number): number => scaled(key, n, tier);
  if (f.crewCap) bits.push(`crew +${v('crewCap', f.crewCap)}`);
  if (f.dayActions) bits.push(`+${v('dayActions', f.dayActions)} action`);
  if (f.nightActions) bits.push(`+${v('nightActions', f.nightActions)} night`);
  if (f.restBonus) bits.push('rest +1 action');
  if (f.treasury) bits.push(`${k(v('treasury', f.treasury))} safe`);
  if (f.trainXp) bits.push(`Train +${v('trainXp', f.trainXp)} XP`);
  if (f.launder !== undefined) bits.push(`launder ${v('launder', f.launder)}%`);
  if (f.income) bits.push(`₽${v('income', f.income)}/day`);
  if (f.clean) bits.push(`₽${v('clean', f.clean)}/day clean`);
  if (f.weekly) bits.push(`₽${v('weekly', f.weekly)}/wk`);
  if (f.storage) bits.push(`+${v('storage', f.storage)} Pokémon`);
  if (f.defense) bits.push(`Defense +${v('defense', f.defense)}`);
  if (f.injury) bits.push('free healing');
  if (f.morale && bits.length < 2) bits.push(`Morale +${v('morale', f.morale)}`);
  if (f.loyalty && bits.length < 2) bits.push(`Loyalty +${v('loyalty', f.loyalty)}`);
  if (f.heatDay) bits.push(`Heat −${v('heatDay', f.heatDay)}/day`);
  if (f.control) bits.push(`Control +${v('control', f.control)}/wk`);
  if (f.recruit) bits.push(`recruit +${v('recruit', f.recruit)}%`);
  if (f.items) bits.push(Object.entries(f.items).map(([id, n]) => `${v('income', n)} ${id.replace(/-/g, ' ')}/day`).join(', '));
  if (f.unlock && bits.length < 2) bits.push(UNLOCK_WORD[def.id] ?? 'new actions');
  if (!bits.length || (bits.length === 1 && def.slots > 1)) bits.push(def.t1.split(/[;,(]/)[0]!.trim());
  return bits.slice(0, 2).join(' · ');
}
const UNLOCK_WORD: Record<string, string> = {
  'front-office': 'Launder, Bribe', 'workshop': 'Safe-crack', 'operations-room': 'Raid', 'radio-room': 'Charity', 'print-shop': 'Flyers',
  'holding-pens': 'cools in 5 days', 'holding-cell': 'cells', 'garage': 'Smuggle', 'research-lab': 'Hit a Lab', 'library': 'Study',
  'dojo': 'classes', 'night-shift': '+1 night',
};

export interface CellModel {
  uid: string | null;
  name: string;
  icon: string | null;
  sprite: string | null;
  fx: string;
  col: number;
  row: number;
  span: number;
  w1: string;
  w2: string;
  state: 'ok' | 'work' | 'up' | 'shut' | 'ruined' | 'empty' | 'blueprint';
  crew: boolean;
}

export interface BaseModel {
  top: TopModel;
  level: number;
  name: string;
  look: string;
  wall: [string, string];
  roof: [string, string];
  initial: string;
  cols: number;
  rows: number;
  cells: CellModel[];
  dogs: boolean;
  upgrading: { to: string; ready: number } | null;
  next: UpgradeInfo;
  free: number;
  build: { rows: (BuildRow & { idx: number; on: boolean; sub: string; where: string | null })[]; at: number; total: number };
  menu: { id: string; label: string; key: string }[];
  defense: number;
  notice: string | null;
}

/** How many columns the building is drawn with at each slot count (mockup 6: 10 slots = 5 x 2). */
export const colsFor = (slots: number): number => (slots <= 3 ? 3 : slots <= 6 ? 3 : slots <= 15 ? 5 : 7);

/** Rooms packed into the grid in order; a 2-slot room spans two cells (wrapping to the next row when it doesn't fit). */
export function cellsOf(b: DominionBlock, pick: Building | null): { cells: CellModel[]; cols: number; rows: number } {
  const slots = slotsOf(b);
  const cols = colsFor(slots);
  const cells: CellModel[] = [];
  let col = 0, row = 0;
  const place = (span: number): [number, number] => {
    if (col + span > cols) {
      col = 0;
      row += 1;
    }
    const at: [number, number] = [col, row];
    col += span;
    return at;
  };
  const stores = (b.crew?.stores.length ?? 0) > 0;
  for (const r of hqOf(b).rooms.filter((x) => !x.at)) {
    const def = buildingDef(r.id);
    if (!def) continue;
    const span = Math.min(cols, def.slots);
    const [c, rr] = place(span);
    const [w1, w2] = coloursOf(def);
    cells.push({
      uid: r.uid, name: (r.tier > 1 ? def.ladder[r.tier - 1]! : def.name).toUpperCase(), icon: def.id === 'holding-pens' && stores ? null : iconOf(def),
      sprite: def.id === 'holding-pens' && stores ? 'p-growlithe' : null, fx: stateLine(b, r, def), col: c, row: rr, span, w1, w2, state: stateOf(r),
      crew: !!def.fx.crewCap && b.members.length > 0,
    });
  }
  const used = cells.reduce((a, c) => a + c.span, 0);
  let left = Math.max(0, slots - used);
  let first = true;
  while (left > 0) {
    const [c, rr] = place(1);
    const bp = first && pick && !pick.outside && pick.status !== 'disabled';
    cells.push({
      uid: null, name: bp ? pick!.name.toUpperCase() : 'EMPTY', icon: bp ? iconOf(pick!) : null, sprite: null,
      fx: bp ? `${money(pick!.cost)} · build?` : 'free slot', col: c, row: rr, span: 1, w1: '', w2: '', state: bp ? 'blueprint' : 'empty', crew: false,
    });
    first = false;
    left -= 1;
  }
  return { cells, cols, rows: Math.max(1, row + 1) };
}

const stateOf = (r: Room): CellModel['state'] => (r.ruined ? 'ruined' : r.building ? 'work' : r.up ? 'up' : r.shut ? 'shut' : 'ok');
function stateLine(b: DominionBlock, r: Room, def: Building): string {
  if (r.ruined) return 'RUINED · rebuild?';
  if (r.building) return `building · Day ${r.ready}`;
  if (r.up) return `T${r.tier + 1} · Day ${r.ready}`;
  if (r.shut) return 'SHUT · broke';
  return shortFx(def, r.tier);
}

/** The Buy Room list shows four rows at a time around the cursor. */
export const BUILD_ROWS = 4;

export function baseModel(b: DominionBlock, regionCap: number, at: number, district: string | null, notice: string | null): BaseModel {
  const L = DOMINION_DATA.hq.levels[b.hqLevel - 1]!;
  const all = buildRows(b, district);
  const i = Math.max(0, Math.min(at, all.length - 1));
  const start = Math.max(0, Math.min(i - 1, all.length - BUILD_ROWS));
  const pick = all[i]?.def ?? null;
  const { cells, cols, rows } = cellsOf(b, pick);
  const h = hqOf(b);
  const top = topModel(b, `${hqName(b)} · LV. ${b.hqLevel}`);
  return {
    top: { ...top, region: String(b.levelCap), regionLabel: 'LV CAP' },
    level: b.hqLevel, name: L.name, look: L.look, wall: L.wall as [string, string], roof: L.roof as [string, string],
    initial: b.teamName ? b.teamName[0]!.toUpperCase() : '',
    cols, rows, cells,
    dogs: b.hqLevel >= 3 || h.rooms.some((r) => r.id === 'kennel' && working(r)),
    upgrading: h.upgrade ? { to: DOMINION_DATA.hq.levels[h.upgrade.to - 1]!.name, ready: h.upgrade.ready } : null,
    next: upgradeInfo(b, regionCap),
    free: slotsFree(b),
    build: {
      rows: all.slice(start, start + BUILD_ROWS).map((r, j) => ({
        ...r, idx: start + j, on: start + j === i,
        sub: r.def.status === 'disabled' ? r.why ?? '' : `${r.def.t1}${r.why ? ` · ${r.why}` : ''}`,
        where: r.where ? districtDef(r.where)?.name ?? r.where : null,
      })),
      at: i, total: all.length,
    },
    menu: H().menu,
    defense: defense(b),
    notice,
  };
}

// ---------- View Assets (Part 6 §3: the Ledger's Empire side, for the HQ) ----------

export interface AssetRow { uid: string; name: string; tier: string; cond: number; where: string; state: string; up: string | null; sell: number; rebuild: number | null }
export interface AssetsModel {
  summary: [string, string][];
  rows: AssetRow[];
  at: number;
}

export function assetsModel(b: DominionBlock, at: number): AssetsModel {
  const h = hqOf(b);
  const top = maxTier(b);
  const rows = h.rooms.map((r): AssetRow => {
    const def = buildingDef(r.id)!;
    const t = r.tier + 1;
    const up = r.ruined || r.building || r.up ? null : t > 8 ? 'top tier' : t > top ? `T${t} needs more HQ/regions` : `T${t} ${def.ladder[t - 1]} · ${money(tierCost(def, t))}`;
    return {
      uid: r.uid, name: roomName(r), tier: `T${r.tier} ${def.ladder[r.tier - 1]}`, cond: r.cond,
      where: r.at ? districtDef(r.at)?.name ?? r.at : 'HQ', state: stateLine(b, r, def), up,
      sell: Math.round((r.spent * H().rules.sellPct) / 100), rebuild: r.ruined ? Math.round((r.spent * H().rules.rebuildPct) / 100) : null,
    };
  });
  return {
    summary: [
      ['FUNDS', money(b.funds)], ['CLEAN', money(cleanOf(b))], ['TEAM', `${b.members.length}/${b.rosterCap}`],
      ['GRUNTS', String(b.members.filter((m) => m.rank.includes('grunt') || m.rank === 'recruit' || m.rank === 'hopeful').length)],
      ['REGIONS HELD', `${heldDistricts(b).length} districts · ${regionsReached(b)} region`], ['DEFENSE', String(defense(b))],
      ['STORES', `${b.crew?.stores.length ?? 0}/${storageCap(b)}`],
    ],
    rows, at: Math.max(0, Math.min(at, rows.length - 1)),
  };
}

// ---------- Money (A21-A22: laundering, loans, letting go) ----------

export type MoneyRowId = 'wash500' | 'wash2000' | 'washAll' | 'borrow' | 'borrowMax' | 'repay' | 'repayAll' | 'letGo';
export interface MoneyModel {
  clean: number;
  dirty: number;
  front: string;
  wash: string[];
  loan: string;
  broke: boolean;
  rows: { id: MoneyRowId; label: string; ok: boolean }[];
  at: number;
  member: { id: string; name: string } | null;
}

export function moneyModel(b: DominionBlock, at: number, memberAt: number): MoneyModel {
  const h = hqOf(b);
  const fr = front(b);
  const dirty = dirtyOf(b);
  const max = loanMax(b);
  const owed = h.loan?.owed ?? 0;
  const m = b.members[Math.max(0, Math.min(memberAt, b.members.length - 1))];
  const rows: MoneyModel['rows'] = [
    { id: 'wash500', label: `Launder ${money(dirty ? Math.min(500, dirty) : 500)}`, ok: !!fr && dirty > 0 },
    { id: 'wash2000', label: `Launder ${money(dirty ? Math.min(2000, dirty) : 2000)}`, ok: !!fr && dirty > 0 },
    { id: 'washAll', label: `Launder all dirty (${money(dirty)})`, ok: !!fr && dirty > 0 },
    { id: 'borrow', label: `Borrow ${money(Math.min(1000, max - owed))} from a Fence`, ok: max - owed > 0 },
    { id: 'borrowMax', label: `Borrow the most (${money(Math.max(0, max - owed))})`, ok: max - owed > 0 },
    { id: 'repay', label: `Repay ${money(owed ? Math.min(1000, owed) : 1000)}`, ok: owed > 0 && b.funds > 0 },
    { id: 'repayAll', label: `Repay all (${money(owed)})`, ok: owed > 0 && b.funds > 0 },
    { id: 'letGo', label: m ? `Let ${m.name} go ◀ ▶` : 'Let a member go', ok: b.members.length > 1 },
  ];
  return {
    clean: cleanOf(b), dirty, front: fr ? `${fr.name} (${fr.fee}% fee)` : 'No Front yet',
    wash: h.wash.map((w) => `${money(w.net)} from ${w.front}, Day ${w.ready}`),
    loan: h.loan ? `Owed to a Fence: ${money(h.loan.owed)} (week ${h.loan.weeks} of ${H().rules.loanWeeks}, ${H().rules.loanRate}% a week)` : `No loan. A Fence lends up to ${money(max)}.`,
    broke: h.broke, rows, at: Math.max(0, Math.min(at, rows.length - 1)), member: m ? { id: m.id, name: m.name } : null,
  };
}

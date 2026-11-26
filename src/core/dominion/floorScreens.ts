// DOMINION redesign R2 (HQ, pass 50 of plans/evil-mode-rework/redesign-50): view models for the HQ's own pages: one
// page per floor (mockups floor, floorg, floorb), Buy a plot, Build a room, the Staff Office, a post's file (auto),
// Staff gear, the New floor reveal, the Laundromat, At a glance and Lights out. Plain data from the block; no rolls,
// nothing changed. The views live in src/ui/redux/screens/dominion/r50/hqPages.ts.

import { DOMINION_DATA } from './data';
import { boughtOn, floorDef, floorDue, floorsOpen, freeOn, layout, plotPrice, plotsOn, usedOn } from './floors';
import { buildRows, front, hqName, loanMax, maxTier, roomName, tierCost } from './hq';
import { buildPrice, buildingDef, cleanOf, dirtyOf, hqOf } from './hqFx';
import { iconOf, shortFx } from './hqScreens';
import { postHolder, roleDef, skillOf, staffOf } from './staff';
import { STAFF_ROLES, type Building, type DominionBlock, type Member, type Room, type StaffRole, type StatId } from './schema';

const H = () => DOMINION_DATA.hq;
export const money = (n: number): string => `₽${Math.round(n).toLocaleString('en-US')}`;
const s = (n: number): string => (n === 1 ? '' : 's');
const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);
export const STAT_NAME: Record<StatId, string> = { brawn: 'Brawn', nerve: 'Nerve', wits: 'Wits', charm: 'Charm', stealth: 'Stealth' };

/** Floors top to bottom as the building stands (TOP, 4F, 3F, 2F, G, B1). */
export const FLOOR_ORDER = [6, 5, 4, 3, 1, 2] as const;
/** The icon for each floor (Ground Floor .. Throne Floor), from the pass-50 sprites. */
export const FLOOR_ICON = ['g-storage-key', 'g-secret-key', 'g-card-key', 'g-black-belt', 'g-xtransceiver', 'g-relic-crown'] as const;
/** The floor the Staff Office desk stands on: the Upper Floor once it's open, else the Ground Floor. */
export const staffFloor = (b: DominionBlock): number => (floorsOpen(b) >= 3 ? 3 : 1);

export interface FloorRail { f: number; tag: string; name: string; locked: boolean; lv: number }

/** The lift's buttons: every open floor top to bottom, and the next one (locked) where it will go. */
export function railOf(b: DominionBlock): FloorRail[] {
  const open = floorsOpen(b);
  return FLOOR_ORDER.filter((f) => f <= Math.min(6, open + 1)).map((f) => ({ f, tag: floorDef(f).tag, name: floorDef(f).name, locked: f > open, lv: floorDef(f).lv }));
}

export type TileKind = 'fix' | 'room' | 'staff' | 'free' | 'sale';
export type TileOp = 'tierUp' | 'sell' | 'rebuild' | 'build' | 'plot' | 'staff' | 'gear' | 'launder';
export interface FloorTile {
  kind: TileKind;
  /** The room's uid (rooms only). */
  uid: string | null;
  /** The building id (rooms only), for the scene's picture of who works there. */
  id: string | null;
  name: string;
  sub: string;
  icon: string;
  /** The tag in the detail panel (Lv 2, Fixture, ₽5,000). */
  tag: string;
  lines: string[];
  ctas: [label: string, op: TileOp, arg: string][];
  state: 'ok' | 'work' | 'up' | 'shut' | 'ruined' | null;
}

const stateOf = (r: Room): FloorTile['state'] => (r.ruined ? 'ruined' : r.building ? 'work' : r.up ? 'up' : r.shut ? 'shut' : 'ok');

function roomTile(b: DominionBlock, r: Room, def: Building): FloorTile {
  const t = r.tier + 1;
  const top = maxTier(b);
  const st = stateOf(r);
  const sub = st === 'work' ? `Building · Day ${r.ready}` : st === 'up' ? `T${t} · Day ${r.ready}` : st === 'ruined' ? 'Ruined' : st === 'shut' ? 'Shut · broke' : r.tier > 1 ? `Lv ${r.tier} · ${shortFx(def, r.tier)}` : shortFx(def, r.tier);
  const lines = [def.t1.split(/[;(]/)[0]!.trim(), `${def.ladder[r.tier - 1]} · Condition ${r.cond}%`];
  const ctas: FloorTile['ctas'] = [];
  const sellFor = Math.round((r.spent * H().rules.sellPct) / 100);
  if (st === 'ruined') {
    ctas.push([`Sell · ${money(sellFor)}`, 'sell', r.uid], [`Rebuild · ${money(Math.round((r.spent * H().rules.rebuildPct) / 100))}`, 'rebuild', r.uid]);
  } else {
    if (st === 'ok' || st === 'shut') ctas.push([`Sell · ${money(sellFor)}`, 'sell', r.uid]);
    if (def.fx.launder !== undefined && st === 'ok') ctas.push(['Wash money', 'launder', '']);
    else if ((st === 'ok' || st === 'shut') && t <= 8 && t <= top) ctas.push([`Upgrade · ${money(buildPrice(b, tierCost(def, t), def.id))}`, 'tierUp', r.uid]);
    if (st === 'work' || st === 'up') lines[1] = `Ready Day ${r.ready}`;
    else if (t > 8) lines[1] = `${def.ladder[r.tier - 1]} · top tier`;
    else if (t > top) lines[1] = `T${t} ${def.ladder[t - 1]} needs a bigger HQ`;
  }
  return { kind: 'room', uid: r.uid, id: def.id, name: def.name, sub, icon: iconOf(def), tag: `Lv ${r.tier}`, lines, ctas, state: st };
}

export interface FloorModel {
  f: number;
  tag: string;
  name: string;
  head: string;
  rail: FloorRail[];
  tiles: FloorTile[];
  at: number;
  /** The Staff Office's holder ids by post, for the scene's pictures. */
  staff: Record<StaffRole, string | null>;
}

/** One floor of the HQ: its fixture, the rooms on it, the Staff Office desk, free plots and a plot for sale. */
export function floorModel(b: DominionBlock, f0: number, at: number): FloorModel {
  const f = Math.max(1, Math.min(floorsOpen(b), f0));
  const d = floorDef(f);
  const at0 = layout(b);
  const tiles: FloorTile[] = [{ kind: 'fix', uid: null, id: null, name: d.fixture.name, sub: cap(d.fixture.does), icon: FLOOR_ICON[f - 1]!, tag: 'Fixture', lines: ['Comes with the floor and works at once.', cap(d.fixture.does)], ctas: [], state: null }];
  for (const r of hqOf(b).rooms) {
    if (r.at || at0.get(r.uid) !== f) continue;
    const def = buildingDef(r.id);
    if (def) tiles.push(roomTile(b, r, def));
  }
  if (f === staffFloor(b)) {
    const on = STAFF_ROLES.filter((r) => postHolder(b, r)).length;
    tiles.push({ kind: 'staff', uid: null, id: null, name: 'Staff Office', sub: `${on} of 3 posts`, icon: 'g-idcard', tag: '3 posts', lines: ['Auto-Checker hires, Bookkeeper launders, Caretaker repairs', 'Skill = gear level + half the stat'], ctas: [['Staff gear', 'gear', ''], ['Open the office', 'staff', '']], state: null });
  }
  const free = freeOn(b, f);
  for (let i = 0; i < free; i++) tiles.push({ kind: 'free', uid: null, id: null, name: 'Free plot', sub: 'Build here', icon: 'g-card-key', tag: 'Free', lines: [`A plot on ${d.name.startsWith('The ') ? d.name : `the ${d.name}`}, ready for a room.`, 'Pick what goes here.'], ctas: [['Build a room', 'build', String(f)]], state: null });
  const price = plotPrice(b, f);
  if (price !== null) tiles.push({ kind: 'sale', uid: null, id: null, name: 'Plot for sale', sub: money(price), icon: 'g-card-key', tag: money(price), lines: ['Buy it to build one more room here.', 'Dirty money is spent first.'], ctas: [[`Buy for ${money(price)}`, 'plot', String(f)]], state: null });
  const plots = plotsOn(b, f);
  const left = d.forSale - boughtOn(b, f);
  const staff = { checker: staffOf(b).checker.member, books: staffOf(b).books.member, care: staffOf(b).care.member };
  return {
    f, tag: d.tag, name: d.name,
    head: `${d.name} · ${usedOn(b, f)} of ${plots} plot${s(plots)} used · ${left > 0 ? `${left} for sale` : 'none for sale'}`,
    rail: railOf(b), tiles, at: Math.max(0, Math.min(at, tiles.length - 1)), staff,
  };
}

// ---------- Buy a plot ----------

export interface PlotRow { f: number; title: string; sub: string; tag: string; ok: boolean; locked: boolean; icon: string }
export interface PlotModel { head: string; rows: PlotRow[]; at: number; det: { f: number; title: string; icon: string; lines: string[]; cta: string | null } }

export function plotModel(b: DominionBlock, at: number): PlotModel {
  const open = floorsOpen(b);
  const rows: PlotRow[] = [];
  for (let f = 1; f <= Math.min(6, open + 1); f++) {
    const d = floorDef(f);
    const title = `${d.name} · ${d.tag}`;
    if (f > open) {
      rows.push({ f, title, sub: `Opens at HQ Lv ${d.lv}, ${H().levels[d.lv - 1]!.name.replace(/^The /, 'the ')}`, tag: 'Locked', ok: false, locked: true, icon: FLOOR_ICON[f - 1]! });
      continue;
    }
    const price = plotPrice(b, f);
    const left = d.forSale - boughtOn(b, f);
    const free = freeOn(b, f);
    const freeTxt = free ? `${free} free plot${s(free)}` : `${plotsOn(b, f)} plots · all used`;
    if (price === null) rows.push({ f, title, sub: `${freeTxt} · none left for sale`, tag: 'Sold out', ok: false, locked: false, icon: FLOOR_ICON[f - 1]! });
    else {
      const then = left > 1 ? Math.round((d.plotCost * (100 + H().plotStepPct * (boughtOn(b, f) + 1))) / 100) : null;
      rows.push({ f, title, sub: `${freeTxt} · ${left} for sale${then ? ` · then ${money(then)}` : ''}`, tag: money(price), ok: b.funds >= price, locked: false, icon: FLOOR_ICON[f - 1]! });
    }
  }
  const i = Math.max(0, Math.min(at, rows.length - 1));
  const r = rows[i]!;
  const d = floorDef(r.f);
  const price = plotPrice(b, r.f);
  const lines = r.locked
    ? [`${d.fixture.name}: ${d.fixture.does}.`, `${d.plots} free plots when it opens, ${d.forSale} more for sale.`, `Upgrade the HQ to Lv ${d.lv} first.`]
    : [`${d.fixture.name}: ${d.fixture.does}.`, 'A two-plot room needs two free plots on one floor.', 'Dirty money is spent first.'];
  return {
    head: `Plots for sale · ${money(b.funds)} to spend`, rows, at: i,
    det: { f: r.f, title: r.title, icon: r.icon, lines, cta: price !== null && !r.locked ? `Buy for ${money(price)}` : null },
  };
}

// ---------- Build a room ----------

export interface BuildCell { id: string; name: string; sub: string; icon: string; stars: number; ok: boolean; why: string | null; outside: boolean }

/** A refusal cut to a few words for a card (the full line stays as the card's title and in the notice). */
export function shortWhy(why: string): string {
  if (why.startsWith('No room on')) return 'no free plot here';
  if (why.startsWith('Not enough money')) return 'not enough money';
  if (why.startsWith('No free room slot')) return 'no free plot';
  const m = /^Needs HQ Lv\. (\d+)/.exec(why);
  if (m) return `needs HQ Lv ${m[1]}`;
  return why.replace(/[.:(].*$/, '').toLowerCase();
}
export interface BuildModel { head: string; cells: BuildCell[]; at: number; page: number; pages: number; total: number; floor: number }
export const BUILD_PAGE = 6;

/** The rooms that can go on a floor's plot (and the outside buildings for a held district after them), six to a page. */
export function buildModel(b: DominionBlock, f0: number, at: number): BuildModel {
  const f = Math.max(1, Math.min(floorsOpen(b), f0));
  // Rooms you can put up now first (the mockup's page opens on them), the rest after, each in list order.
  const rows = buildRows(b, null, f).filter((r) => r.def.status !== 'disabled' && !r.def.deal);
  const all = [...rows.filter((r) => r.ok), ...rows.filter((r) => !r.ok)];
  const i = Math.max(0, Math.min(at, all.length - 1));
  const page = Math.floor(i / BUILD_PAGE);
  const d = floorDef(f);
  const cells = all.slice(page * BUILD_PAGE, page * BUILD_PAGE + BUILD_PAGE).map((r): BuildCell => ({
    id: r.def.id, name: r.def.name, icon: iconOf(r.def), outside: r.outside,
    sub: `${money(r.cost)} · ${r.why ? shortWhy(r.why) : r.outside ? `outside${r.where ? ` · ${r.where}` : ''}` : shortFx(r.def, 1)}`,
    stars: r.cost < 1500 ? 1 : r.cost < 5000 ? 2 : 3, ok: r.ok, why: r.why,
  }));
  return { head: `What goes on the new ${d.name.replace(/^The /, '')} plot? · ${page + 1}/${Math.max(1, Math.ceil(all.length / BUILD_PAGE))}`, cells, at: i - page * BUILD_PAGE, page, pages: Math.ceil(all.length / BUILD_PAGE), total: all.length, floor: f };
}

// ---------- the Staff Office, a post's file and Staff gear ----------

export interface PostCard { role: StaffRole; name: string; stat: string; holder: Member | null; gear: number; skill: number; on: boolean; sub: string }

const roleWord = (b: DominionBlock, role: StaffRole): string => {
  const g = staffOf(b)[role].gear;
  if (role === 'checker') return g ? `hires ${roleDef('checker').perDay[g - 1]} a morning` : 'hires Grunts every morning';
  if (role === 'books') return g ? `launders ${money(roleDef('books').wash[g - 1]!)} a night` : 'launders every night';
  return g ? `repairs ${roleDef('care').repair[g - 1]} a night` : 'repairs every night';
};

export function postCards(b: DominionBlock): PostCard[] {
  return STAFF_ROLES.map((role) => {
    const def = roleDef(role);
    const p = staffOf(b)[role];
    const holder = postHolder(b, role);
    return { role, name: def.name, stat: STAT_NAME[def.stat as StatId], holder, gear: p.gear, skill: skillOf(b, role), on: p.on, sub: `${STAT_NAME[def.stat as StatId]} · ${roleWord(b, role)} · Gear ${p.gear}` };
  });
}

export interface PostFact { key: 'member' | 'want' | 'budget' | 'beds' | 'on'; label: string; value: string }
export interface PostModel {
  role: StaffRole;
  name: string;
  holder: Member | null;
  rank: string;
  bars: [string, number, number][];
  traits: [string, string][];
  facts: PostFact[];
  factAt: number;
  quote: string;
  buy: string | null;
  gearName: string | null;
}

const gearLine = (role: StaffRole, g: number): string => {
  const d = roleDef(role);
  if (role === 'checker') {
    const c = roleDef('checker');
    const rar = c.rarities[g - 1]!.replace('C', 'Common, ').replace('U', 'Uncommon, ').replace('R', 'Rare, ').replace(/, $/, '');
    const extra = [g >= c.wantFrom ? 'follows your Wanted stat' : '', c.haggle[g - 1] ? `haggles ${c.haggle[g - 1]}% off` : '', c.scouts[g - 1] ? `+${c.scouts[g - 1]} on the hire list` : '', c.trained[g - 1] ? `hires arrive +${c.trained[g - 1]} in their best stat` : ''].filter(Boolean);
    return `${c.perDay[g - 1]} hire${s(c.perDay[g - 1]!)} a day, ${rar}${extra.length ? `, ${extra.join(', ')}` : ''}`;
  }
  if (role === 'books') {
    const k = roleDef('books');
    return `Washes ${money(k.wash[g - 1]!)} a night (+${k.washPerSkill}% a skill point)${g >= k.repayFrom ? ', pays the Fence' : ''}`;
  }
  const c = roleDef('care');
  return `Repairs ${c.repair[g - 1]} Condition a night (+ skill), ${money(c.pointCost)} a point${c.upkeepOff[g - 1] ? `, upkeep −${c.upkeepOff[g - 1]}%` : ''}`;
  void d;
};

/** A post's file (mockup `auto`): who holds it, its numbers, this gear and the next, and the rules you set. */
export function postModel(b: DominionBlock, role: StaffRole, factAt: number): PostModel {
  const def = roleDef(role);
  const p = staffOf(b)[role];
  const st = staffOf(b);
  const holder = postHolder(b, role);
  const skill = skillOf(b, role);
  const stat = def.stat as StatId;
  const bars: [string, number, number][] = [['Gear', p.gear, 5], ['Skill', skill, H().staff.skillCap]];
  if (role === 'checker') {
    const c = roleDef('checker');
    bars.push(['Hires a day', p.gear ? c.perDay[p.gear - 1]! : 0, c.perDay[4]!], ['Misjudges %', Math.max(0, c.misjudge.base - c.misjudge.perSkill * skill), c.misjudge.base]);
  } else if (role === 'books') {
    const k = roleDef('books');
    const wash = p.gear ? Math.round((k.wash[p.gear - 1]! * (100 + k.washPerSkill * skill)) / 100) : 0;
    bars.push([`Washes ${money(wash)}`, wash, Math.round((k.wash[4]! * (100 + k.washPerSkill * H().staff.skillCap)) / 100)]);
  } else {
    const c = roleDef('care');
    bars.push(['Repairs a night', p.gear ? c.repair[p.gear - 1]! + skill : 0, c.repair[4]! + H().staff.skillCap], ['Upkeep off %', p.gear ? c.upkeepOff[p.gear - 1]! : 0, c.upkeepOff[4]!]);
  }
  const traits: [string, string][] = [];
  traits.push(p.gear ? [`Gear ${p.gear} · ${def.gear[p.gear - 1]}`, gearLine(role, p.gear)] : ['No gear yet', def.does]);
  if (p.gear < 5) traits.push([`Next · ${def.gear[p.gear]}`, `${money(def.costs[p.gear]!)} · ${gearLine(role, p.gear + 1)}`]);
  const facts: PostFact[] = [{ key: 'member', label: 'On the post', value: holder ? holder.name : 'Nobody' }];
  if (role === 'checker') {
    facts.push(
      { key: 'want', label: 'Wanted stat', value: p.gear >= roleDef('checker').wantFrom ? (st.want ? STAT_NAME[st.want] : 'Any') : `Any (gear ${roleDef('checker').wantFrom})` },
      { key: 'budget', label: 'Daily budget', value: H().staff.budgets[st.budget] ? money(H().staff.budgets[st.budget]!) : 'No limit' },
      { key: 'beds', label: 'Beds kept free', value: String(H().staff.beds[st.beds] ?? 0) },
    );
  }
  facts.push({ key: 'on', label: 'Post', value: p.on ? 'On' : 'Off' });
  const last = st.log.find((l) => l.includes(def.name) || (holder && l.startsWith(holder.name)));
  return {
    role, name: def.name, holder,
    rank: holder ? `${holder.name} on the post · ${STAT_NAME[stat]} ${holder.stats[stat]} · Skill ${skill}` : `Nobody on the post · needs ${STAT_NAME[stat]}`,
    bars, traits, facts, factAt: Math.max(0, Math.min(factAt, facts.length - 1)),
    quote: last ?? def.does, buy: p.gear < 5 ? `Buy ${def.gear[p.gear]} · ${money(def.costs[p.gear]!)}` : null, gearName: p.gear < 5 ? def.gear[p.gear]! : null,
  };
}

export interface GearCol { role: StaffRole; name: string; holder: Member | null; who: string; own: number; rows: { name: string; line: string; price: string }[] }

/** Staff gear (mockup `staffgear`): a ladder of five for each post. */
export function gearModel(b: DominionBlock): GearCol[] {
  return STAFF_ROLES.map((role) => {
    const def = roleDef(role);
    const holder = postHolder(b, role);
    const stat = def.stat as StatId;
    return {
      role, name: def.name, holder, own: staffOf(b)[role].gear,
      who: holder ? `${holder.name} · ${STAT_NAME[stat]} ${holder.stats[stat]} · skill ${skillOf(b, role)}` : `Nobody yet · ${STAT_NAME[stat]}`,
      rows: def.gear.map((n, i) => ({ name: n, line: gearShort(role, i + 1), price: money(def.costs[i]!) })),
    };
  });
}
function gearShort(role: StaffRole, g: number): string {
  if (role === 'checker') {
    const c = roleDef('checker');
    if (c.trained[g - 1]) return `Hires arrive +${c.trained[g - 1]} in best stat`;
    if (c.scouts[g - 1]) return `${c.perDay[g - 1]} a day · every rarity`;
    if (c.haggle[g - 1] && !c.haggle[g - 2]) return `Haggles ${c.haggle[g - 1]}% off`;
    if (g >= c.wantFrom) return `${c.perDay[g - 1]} a day · follows Wanted stat`;
    return `${c.perDay[g - 1]} hire a day · Common`;
  }
  if (role === 'books') {
    const k = roleDef('books');
    return g === k.repayFrom ? `${money(k.wash[g - 1]!)} · pays the Fence` : `Washes ${money(k.wash[g - 1]!)} a night`;
  }
  const c = roleDef('care');
  return c.upkeepOff[g - 1] && c.upkeepOff[g - 1] !== c.upkeepOff[g - 2] ? `${c.repair[g - 1]} a night · upkeep −${c.upkeepOff[g - 1]}%` : `Repairs ${c.repair[g - 1]} a night`;
}

// ---------- the New floor reveal ----------

export interface NewFloorModel { f: number; lv: number; level: string; title: string; stack: { f: number; tag: string; isNew: boolean; under: boolean; rooms: string[] }[]; cards: [string, string, string][] }

/** The page after an upgrade opens a floor (null when none is waiting). */
export function newFloorModel(b: DominionBlock): NewFloorModel | null {
  const f = floorDue(b);
  if (f === null) return null;
  const d = floorDef(f);
  const at = layout(b);
  const stack = FLOOR_ORDER.filter((x) => x <= floorsOpen(b)).map((x) => ({
    f: x, tag: floorDef(x).tag, isNew: x === f, under: x === 2,
    rooms: hqOf(b).rooms.filter((r) => !r.at && at.get(r.uid) === x).map((r) => r.id).slice(0, 3),
  }));
  const L = H().levels[b.hqLevel - 1]!;
  const cards: [string, string, string][] = [
    [FLOOR_ICON[f - 1]!, d.fixture.name, `Comes with the floor · ${cap(d.fixture.does)}, works now`],
    ['g-card-key', `${d.plots} free plots`, d.forSale ? `${d.forSale} more for sale, from ${money(d.plotCost)}` : 'None for sale'],
    f === staffFloor(b) && f !== 1 ? ['g-idcard', 'Staff Office', 'Moves up here · three posts that work at night'] : ['g-relic-crown', `HQ Lv ${b.hqLevel} · ${L.name.replace(/^The /, '')}`, `Crew cap ${b.rosterCap} · level cap ${b.levelCap}`],
  ];
  return { f, lv: b.hqLevel, level: `HQ Lv ${b.hqLevel} · ${L.name}`, title: `${d.name} · ${d.tag}`, stack, cards };
}

// ---------- the Laundromat (and the Fence) ----------

export type WashOpt = 'w500' | 'w2000' | 'wall' | 'borrow' | 'borrowMax' | 'repay' | 'repayAll';
export const WASH_OPTS: readonly WashOpt[] = ['w500', 'w2000', 'wall', 'borrow', 'borrowMax', 'repay', 'repayAll'];
export interface LaunderModel {
  opt: WashOpt;
  label: string;
  from: [string, string];
  to: [string, string];
  rate: [string, string];
  note: [string, string];
  amount: number;
  ok: boolean;
  front: string | null;
  pending: string[];
}

export function launderModel(b: DominionBlock, at: number): LaunderModel {
  const opt = WASH_OPTS[((at % WASH_OPTS.length) + WASH_OPTS.length) % WASH_OPTS.length]!;
  const fr = front(b);
  const dirty = dirtyOf(b);
  const h = hqOf(b);
  const owed = h.loan?.owed ?? 0;
  const max = loanMax(b);
  const pending = h.wash.map((w) => `${money(w.net)} from the ${w.front.replace(/^the /, '')} · Day ${w.ready}`);
  const books = postHolder(b, 'books');
  const bk = staffOf(b).books;
  const nightly = books && bk.gear ? `${books.name} (Bookkeeper) washes ${money(Math.round((roleDef('books').wash[bk.gear - 1]! * (100 + roleDef('books').washPerSkill * skillOf(b, 'books'))) / 100))} a night` : 'No Bookkeeper on staff (Staff Office, K)';
  if (opt === 'w500' || opt === 'w2000' || opt === 'wall') {
    const amount = Math.min(dirty, opt === 'w500' ? 500 : opt === 'w2000' ? 2000 : dirty);
    const net = fr ? Math.max(amount ? 1 : 0, Math.floor((amount * (100 - fr.fee)) / 100)) : 0;
    const days = H().rules.launderDays;
    return {
      opt, label: `Wash ${money(amount)}`, from: ['Dirty', money(amount)], to: ['Clean', money(net)], amount, ok: !!fr && amount > 0, front: fr?.name ?? null,
      rate: fr ? [`Rate ${100 - fr.fee}%`, `Through the ${fr.name.replace(/^the /, '')} · back ${days === 1 ? 'tomorrow' : `in ${days} days`}`] : ['No Front yet', 'Build a Front room to wash money'],
      note: [`${money(dirty)} dirty · ${money(cleanOf(b))} clean`, nightly], pending,
    };
  }
  if (opt === 'borrow' || opt === 'borrowMax') {
    const n = Math.max(0, opt === 'borrow' ? Math.min(1000, max - owed) : max - owed);
    return {
      opt, label: `Borrow ${money(n)}`, from: ['Owed', money(owed)], to: ['Owed after', money(owed + n)], amount: n, ok: n > 0, front: fr?.name ?? null,
      rate: [`A Fence lends up to ${money(max)}`, `${H().rules.loanRate}% a week · ${H().rules.loanWeeks} weeks to pay`], note: [`Funds ${money(b.funds)}`, h.loan ? `Week ${h.loan.weeks} of ${H().rules.loanWeeks}` : 'No loan yet'], pending,
    };
  }
  const n = Math.max(0, Math.min(owed, b.funds, opt === 'repay' ? 1000 : owed));
  return {
    opt, label: `Repay ${money(n)}`, from: ['Owed', money(owed)], to: ['Owed after', money(owed - n)], amount: n, ok: n > 0, front: fr?.name ?? null,
    rate: [owed ? `Owed to a Fence: ${money(owed)}` : 'No loan', owed ? `${H().rules.loanRate}% a week` : 'Nothing to repay'], note: [`Funds ${money(b.funds)}`, h.loan ? `Week ${h.loan.weeks} of ${H().rules.loanWeeks}` : ''], pending,
  };
}

// ---------- Lights out ----------

export interface RestModel { day: number; rows: [string, string][]; free: boolean }

/** The Rest page at night (mockup `rest`): the Day's numbers and what tomorrow brings. */
export function restModel(b: DominionBlock, rival: { side: string; war: number; foe: string }): RestModel {
  const rows: [string, string][] = [
    ['Funds', `${money(b.funds)} · ${money(dirtyOf(b))} dirty`],
    ['Heat', `${b.heat}%`],
    [rival.foe, `${rival.side} ${rival.war} · ${rival.foe} ${100 - rival.war}`],
    ['Tomorrow', `Day ${b.day + 1} · ${b.nightActions > 0 ? '+1 action' : 'no Rest bonus'}`],
  ];
  return { day: b.day, rows, free: b.nightActions > 0 };
}

export { hqName };

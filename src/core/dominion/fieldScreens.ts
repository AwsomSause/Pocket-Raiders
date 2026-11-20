// DOMINION D2 view models: the Region Map (mockup 3) and the Card (mockup 4). Plain data for the redux screens. Pure:
// no Phaser, no RNG (the Card is the same numbers `act` uses, never a roll).

import { heroAt, heroDefOf } from './hero';
import type { RunState } from '../state';
import { DOMINION_DATA } from './data';
import { hasRoom } from './hqFx';
import { actionDef, actionStatus, bandOf, card, districtDef, masteryLevel, openDay, playOf, statusOf, type Card, type DistrictStatus } from './field';
import type { DominionBlock, Slot } from './schema';
import { topModel, type TopModel } from './screens';

const F = () => DOMINION_DATA.field;

/** The map's cursor: a district, a target in it, an action on the grid's page. Kept by the scene. */
export interface MapCursor {
  district: string;
  target: number;
  page: number;
  /** Grid slot 0-8 on the page. */
  at: number;
  focus: 'map' | 'grid';
  bring: string[];
}

export const newCursor = (b: DominionBlock): MapCursor => ({ district: b.field.at, target: 0, page: pageFor(b), at: 0, focus: 'map', bring: [] });

/** The grid's pages: the starting nine (mockup 3's order), then every other action D2 plays, by list number, for this phase. */
export function gridPages(b: DominionBlock): string[][] {
  const start = F().starting;
  const slot: Slot = b.phase === 'night' ? 'night' : b.phase === 'evening' ? 'evening' : 'day';
  const rest = DOMINION_DATA.actions.actions.filter((a) => !start.includes(a.id) && playOf(a.id) && a.slot === slot).map((a) => a.id);
  const pages = [start];
  for (let i = 0; i < rest.length; i += 9) pages.push(rest.slice(i, i + 9));
  return pages;
}

/** Evening opens on the evening page; Day and Night on the starting nine. */
export function pageFor(b: DominionBlock): number {
  return b.phase === 'evening' ? Math.min(1, gridPages(b).length - 1) : 0;
}

export interface MapDistrict {
  id: string; name: string; x: number; y: number; w: number | null;
  cls: string; pill: { text: string; cls: string } | null; home: boolean; sel: boolean; flag: boolean; boss: boolean; closed: boolean;
}

export interface GridButton { id: string; label: string; on: boolean; dim: boolean; night: boolean }

export interface MapModel {
  top: TopModel;
  districts: MapDistrict[];
  /** Held, foothold (and contested), rival, outsider: the Siege-style tally bar. */
  tally: [number, number, number, number];
  file: {
    name: string;
    stamp: { word: string; colour: string };
    control: number; heat: number; rival: number; rivalName: string;
    /** D6: the town's Regard and Dread (never netted). */
    regard: number; dread: number;
    alert: { text: string; cls: string } | null;
    targets: { id: string; name: string; on: boolean }[];
  };
  grid: GridButton[];
  page: number;
  pages: number;
  focus: 'map' | 'grid';
  cta: string | null;
  phase: string;
  note: string;
  wanted: { value: number; word: string };
  vehicles: { id: string; name: string; price: string; does: string; owned: boolean }[];
}

const STAMP: Record<DistrictStatus, { word: string; colour: string; pill: string; cls: string }> = {
  owned: { word: 'OWNED', colour: '#4fd17d', pill: 'Owned', cls: 'held' },
  held: { word: 'HELD', colour: '#4fd17d', pill: 'Held', cls: 'held' },
  contested: { word: 'CONTESTED', colour: '#f2c230', pill: 'Contested', cls: 'foot' },
  foot: { word: 'FOOTHOLD', colour: '#f2c230', pill: 'Foothold', cls: 'foot' },
  out: { word: 'OUTSIDER', colour: '#9aa3c0', pill: 'Outsider', cls: 'out' },
  rival: { word: 'RIVAL', colour: '#ef4a3a', pill: 'Rocket', cls: 'rival' },
};

const label = (id: string): string => actionDef(id)?.name.replace(/\s*\(.*\)/, '') ?? id;

export function mapModel(b: DominionBlock, run: Pick<RunState, 'party'>, c: MapCursor): MapModel {
  const f = b.field;
  const tally: [number, number, number, number] = [0, 0, 0, 0];
  const districts = F().districts.map((d) => {
    const ds = f.districts[d.id]!;
    const st = statusOf(ds);
    tally[st === 'held' || st === 'owned' ? 0 : st === 'foot' || st === 'contested' ? 1 : st === 'rival' ? 2 : 3] += 1;
    const home = d.id === F().hq;
    const s = STAMP[st];
    let pill: MapDistrict['pill'] = null;
    if (home) pill = { text: `HQ · ${s.pill}`, cls: 'y' };
    else if (st === 'rival') pill = { text: d.rivalNote ?? F().rivalTeam, cls: 'r' };
    else if (st === 'held' || st === 'owned') pill = { text: s.pill, cls: 'g' };
    else if (st === 'foot' || st === 'contested') pill = { text: `${s.pill}${d.id === c.district ? ` ${ds.control}` : ''}`, cls: 'y' };
    else if (d.police) pill = { text: 'Police', cls: 'k' };
    else if (d.w) pill = { text: s.pill, cls: 'k' };
    return { id: d.id, name: d.name, x: d.x, y: d.y, w: d.w ?? null, cls: s.cls, pill, home, sel: d.id === c.district, flag: st === 'held' || st === 'owned', boss: f.at === d.id, closed: f.closed === d.id };
  });
  const d = districtDef(c.district) ?? districtDef(F().hq)!;
  const ds = f.districts[d.id]!;
  const st = statusOf(ds);
  const band = bandOf(b.heat);
  const P = F().police.lines;
  let alert: MapModel['file']['alert'] = null;
  if (f.fight && !f.fight.begun) alert = { text: f.fight.why === 'looker' ? 'Looker is waiting at the door.' : f.fight.why === 'raid' ? 'The International Police are at the door.' : f.fight.why === 'heroRaid' || f.fight.why === 'stand' ? 'The Hero is at the door.' : 'A fight is waiting.', cls: 'r' };
  else if (f.closed === d.id) alert = { text: P.closed!.replace('{district}', d.name), cls: 'r' };
  else if (f.patrol === d.id) alert = { text: `Officer Jenny patrols ${d.name} today.`, cls: 'r' };
  // D11: the Hero's town, once you've met them or tracked their route.
  else if (b.hero && (b.hero.met || b.hero.intel >= b.day) && heroAt(b) === d.id) alert = { text: `${heroDefOf(b.hero.id).name}, the Hero, is in ${d.name}.`, cls: 'b' };
  else if (d.police) alert = { text: P.seeStation!, cls: 'b' };
  else if (band.id !== 'unknown') alert = { text: `Wanted: ${band.word} (${b.heat}%).`, cls: 'y' };
  else if (f.at === d.id) alert = { text: 'You are here.', cls: 'g' };
  const targets = d.targets.map((t, i) => ({ id: t.id, name: t.name, on: i === c.target }));
  const pages = gridPages(b);
  const page = Math.min(c.page, pages.length - 1);
  const phase: Slot = b.phase === 'night' ? 'night' : b.phase === 'evening' ? 'evening' : 'day';
  const grid = pages[page]!.map((id, i) => {
    const def = actionDef(id)!;
    const st2 = actionStatus(def);
    const dim = !st2.play || def.slot !== phase || b.day < openDay(def) || (!!st2.room && !hasRoom(b, st2.room));
    return { id, label: label(id), on: c.focus === 'grid' && i === c.at, dim, night: def.slot === 'night' };
  });
  const sel = grid[c.at];
  const t = d.targets[c.target];
  let cta: string | null = null;
  if (sel) {
    const p = playOf(sel.id);
    cta = p?.kinds && t && !p.kinds.includes('any') ? `${sel.label} the ${t.name}` : p?.where === 'hq' ? sel.label : p?.kinds ? `${sel.label} in ${d.name}` : sel.label;
  }
  const note = b.phase === 'day' ? `${b.actions} action${b.actions === 1 ? '' : 's'} left today` : b.phase === 'night' ? (b.nightActions ? 'One Night action, or Rest at the HQ' : "Tonight's action is done") : b.phase === 'evening' ? 'Evening: menu actions, once each' : 'Morning: start the day at the HQ';
  return {
    top: topModel(b, 'REGION MAP'),
    districts,
    tally,
    file: { name: d.name, stamp: { word: STAMP[st].word, colour: STAMP[st].colour }, control: ds.control, heat: ds.heat, rival: ds.rival, rivalName: F().rivalTeam, regard: ds.regard, dread: ds.dread, alert, targets },
    grid,
    page,
    pages: pages.length,
    focus: c.focus,
    cta,
    phase: b.phase,
    note,
    wanted: { value: b.heat, word: band.word },
    vehicles: F().travel.vehicles.map((v) => ({ id: v.id, name: v.name, price: `₽${v.price.toLocaleString('en-US')}`, does: v.does, owned: f.vehicles.includes(v.id) })),
  };
}

export interface CardModel {
  title: string;
  sub: string;
  slotLine: string;
  /** The pay line under the title ("Pays ₽300–550, then ₽120/wk"). */
  pays: string;
  roll: boolean;
  chance: number;
  dial: string;
  /** The success bar's share: the exact odds when known, else the middle of the range (never leaks the hidden number). */
  bar: number;
  exact: boolean;
  parts: [string, number][];
  heat: number;
  failHeat: number;
  regard: number;
  dread: number;
  hurt: { name: string; look: string; line: string } | null;
  see: { name: string; look: string; line: string };
  battle: { chance: number; always: boolean; species: string; line: string } | null;
  win: string;
  lose: string;
  travel: string;
  level: string;
  blocked: string | null;
  brought: string[];
}

const signed = (n: number): string => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');
const money = (n: number): string => `₽${n.toLocaleString('en-US')}`;

export function cardModel(b: DominionBlock, run: Pick<RunState, 'party'>, actionId: string, targetId: string | null, districtId: string, bring: readonly string[] = []): CardModel | null {
  const c: Card | null = card(b, run, actionId, targetId, districtId, bring);
  if (!c) return null;
  const p = c.play;
  const slotLine = c.def.slot === 'day' ? `Action ${Math.min(b.field.today, Math.max(1, b.field.today - b.actions + 1))} of ${b.field.today}` : c.def.slot === 'night' ? 'Night action' : 'Evening';
  let pays = '';
  if (c.pay && p?.wager) pays = `Stake ${money(c.pay[0])}–${money(c.pay[1])}`;
  else if (c.pay) pays = `Pays <b>${c.pay[0] === c.pay[1] ? money(c.pay[0]) : `${money(c.pay[0])}–${c.pay[1].toLocaleString('en-US')}`}</b>`;
  else if (c.crate) pays = 'Pays <b>a crate</b> (items and cash)';
  else if (p?.effect === 'catch') pays = 'A wild Pokémon';
  else if (p?.effect === 'scout' || p?.effect === 'count' || p?.effect === 'scoutDistrict' || p?.effect === 'paper') pays = 'Pays <b>intel</b>';
  else if (p?.cost) pays = `Costs <b>${money(p.cost)}</b>`;
  else pays = 'No pay';
  if (c.weekly) pays += `, then <b>${money(c.weekly)}/wk</b>`;
  const P = F().police;
  const see = c.police > 0 || c.district.police || b.field.patrol === c.district.id
    ? { name: P.jenny.name, look: 'dominion/t-policeman.png', line: c.district.police ? P.lines.seeStation! : b.field.patrol === c.district.id ? `${P.lines.see!} She's here today.` : P.lines.see! }
    : { name: 'Who might see', look: '', line: P.lines.seeNone! };
  let battle: CardModel['battle'] = null;
  if (c.battle) {
    const f = c.battle.foe;
    const sp = f.species ? f.species.replace(/-/g, ' ').replace(/\b\w/g, (x) => x.toUpperCase()) : 'something wild';
    battle = { chance: c.battle.chance, always: c.battle.on === 'always', species: f.species, line: f.wild ? `${f.species ? sp : 'A wild Pokémon'}, Lv ${f.level}.` : `${f.name}'s ${sp}, Lv ${f.level}.` };
  }
  const winBits: string[] = [];
  if (c.pay && !p?.wager) winBits.push(`${money(c.pay[0])}${c.pay[1] !== c.pay[0] ? `–${c.pay[1].toLocaleString('en-US')}` : ''}`);
  if (p?.wager && c.pay) winBits.push('the stake');
  if (c.crate) winBits.push('a crate');
  if (c.dread > 0) winBits.push(`Dread +${c.dread}`);
  if (c.weekly && p?.weekly) winBits.push('the shop pays weekly');
  if (c.weekly && p?.toll) winBits.push('maybe a weekly toll');
  if (c.heat < 0) winBits.push(`Heat ${c.heat}`);
  if (!winBits.length) winBits.push(p?.win.split('.')[0] ?? 'it works');
  const loseBits: string[] = [];
  if (c.failHeat) loseBits.push(`Heat +${c.failHeat}`);
  if (c.battle?.on === 'fail' || c.police) loseBits.push('maybe a fight');
  if (c.battle?.on === 'always') loseBits.push('lose the battle, lose the job');
  const lvl = masteryLevel(b.field.mastery[c.def.id] ?? 0);
  return {
    title: c.def.name.replace(/\s*\(.*\)/, ''),
    sub: c.target ? `${c.district.name} ${c.target.name}` : c.district.name,
    slotLine,
    pays,
    roll: c.roll,
    chance: c.chance,
    dial: c.roll ? (c.exact ? `${c.chance}%` : `${c.range[0]}–${c.range[1]}`) : '100%',
    bar: c.exact ? c.chance : Math.round((c.range[0] + c.range[1]) / 2),
    exact: c.exact,
    // Like mockup 4, the base odds stay hidden: the parts plus the range are what the Boss can see (Scout narrows it to exact).
    parts: c.roll ? c.parts : [],
    heat: c.heat,
    failHeat: c.failHeat,
    regard: c.regard,
    dread: c.dread,
    hurt: c.target && c.play?.kinds && !c.play.kinds.includes('any') ? { name: "Who's hurt", look: c.target.owner.look, line: `${c.target.owner.name}. ${c.target.owner.line}` } : null,
    see,
    battle,
    win: winBits.join(', '),
    lose: loseBits.join(', ') || 'nothing much',
    travel: c.travel.line,
    level: `${DOMINION_DATA.field.mastery.names[lvl - 1]} · Lv ${lvl} of 5`,
    blocked: c.blocked,
    brought: bring.map((id) => b.members.find((m) => m.id === id)?.name ?? id),
  };
}

export { signed };

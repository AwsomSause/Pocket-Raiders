// DOMINION redesign R6: the rules behind the pass-50 pages that had none (Kice's director answer, 2026-11-21: build
// every page, with simple real rules). Data in life.json.
// - The back-alley Clinic: pay to heal the Boss's Pokémon, priced by the HP missing (fainted and status cost extra).
// - Care time: once a day each Pokémon gets a Brush, a Poké Puff (costs money) or Play; it raises the game's own
//   friendship (core/friendship.ts), which already drives hearts, loafing, Return and friendship evolutions.
// - Region Events (01_START_AND_THE_DAY.md §2.2): every `every` days from `first`, a Festival Night or a Blackout opens
//   one special action for `lasts` days: a job or a target, rolled like a street meeting's check.
// - The Prize Corner: buy coins, trade them for prizes, or swap a prize out (a Stealth check, once a day).
// - Chapters: the run's chapter follows what it has done (founded, Notoriety); the card shows once per new chapter.
// Randomness: the new stream 'dominion-life' only, so no existing roll moves.

import type { Content } from '../contentSchema';
import { changeFriendship, friendshipHearts } from '../friendship';
import { NATURES } from '../natures';
import { maxHp, maxPp } from '../pokemon';
import type { PokemonInstance, RunState } from '../state';
import { crewOf, rng } from './crew';
import { DOMINION_DATA } from './data';
import { withBlock } from './debate';
import { peakOf } from './empire';
import { addHeat, districtDef, syncHeat } from './field';
import { spend } from './hqFx';
import { realmOf, regionName } from './regions';
import { placeMon, withReserve } from './reserve';
import { DominionBlockSchema, type DominionAction, type DominionBlock, type LifeState, type Member, type StatId } from './schema';

const D = () => DOMINION_DATA.life;
const fill = (t: string, v: Record<string, string | number>): string => t.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ''));
const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, Math.round(n)));
const money = (n: number): string => n.toLocaleString('en-US');

export function lifeOf(b: DominionBlock): LifeState {
  return (b.life ??= { care: {}, coins: 0, swapDay: 0, done: [], seen: [], chapter: 0 });
}

// ---------- the Clinic ----------

/** What healing one Pokémon costs (0 when it needs nothing). */
export function clinicCost(content: Content, mon: PokemonInstance): number {
  const C = D().clinic;
  const max = maxHp(content, mon);
  const missing = max > 0 ? (1 - mon.hp / max) * 100 : 0;
  const hurt = missing > 0 ? Math.ceil((missing * C.perPct) / C.round) * C.round : 0;
  return hurt + (mon.hp <= 0 ? C.fainted : 0) + (mon.status ? C.status : 0);
}

function healOne(content: Content, mon: PokemonInstance): void {
  mon.hp = maxHp(content, mon);
  mon.status = null;
  for (const slot of mon.moves) slot.pp = maxPp(content, slot);
}

// ---------- Care time ----------

export interface CareModel {
  hearts: number;
  mood: string;
  fed: string;
  bonus: string;
  favourite: string;
  caredToday: boolean;
}

export function careModel(content: Content, b: DominionBlock, mon: PokemonInstance): CareModel {
  const L = D().care.lines;
  const c = b.life?.care[mon.uid];
  const caredToday = c?.day === b.day;
  const max = maxHp(content, mon);
  const mood = caredToday ? L.moodCared! : mon.hp <= 0 ? L.moodFainted! : mon.hp < max / 2 ? L.moodHurt! : L.moodFine!;
  const fedAgo = c?.fed === null || c?.fed === undefined ? null : b.day - c.fed;
  const fed = fedAgo === null ? L.fedNever! : fedAgo <= 0 ? L.fedToday! : fedAgo === 1 ? L.fedYesterday! : fill(L.fedDays!, { n: fedAgo });
  const F = content.balance.friendship;
  const bonus = mon.friendship >= F.evolveAt ? L.bonusTop! : mon.friendship < F.loafBelow ? L.bonusLoaf! : L.bonusMid!;
  const n = mon.nature ? NATURES[mon.nature] : null;
  const flavour = n && n[0] !== n[1] ? D().care.flavours[n[0]] : undefined;
  return { hearts: friendshipHearts(content, mon), mood, fed, bonus, favourite: flavour ? fill(L.favourite!, { flavour }) : L.favouriteAny!, caredToday };
}

// ---------- Region Events ----------

export type RegionEventKind = 'festival' | 'blackout';
export interface RegionEvent { kind: RegionEventKind; key: string; start: number; end: number; district: string; name: string; daysLeft: number }

/** The Region Event on today, if any (the same for the same day: no randomness). */
export function regionEvent(b: DominionBlock): RegionEvent | null {
  const E = D().events;
  if (b.day < E.first) return null;
  const since = b.day - E.first;
  if (since % E.every >= E.lasts) return null;
  const idx = Math.floor(since / E.every);
  const kind = E.list[idx % E.list.length]!;
  const start = E.first + idx * E.every;
  const def = D()[kind];
  const district = def.districts.find((d) => b.field.districts[d]) ?? Object.keys(b.field.districts)[0] ?? def.districts[0]!;
  return { kind, key: `${realmOf(b).at}:${kind}@${start}`, start, end: start + E.lasts - 1, district, name: def.name, daysLeft: start + E.lasts - b.day };
}

/** Whether the event's one special action is still open. */
export const eventOpen = (b: DominionBlock, ev: RegionEvent | null): ev is RegionEvent => !!ev && !(b.life?.done ?? []).includes(ev.key);

/** One pick on the event page: a festival job or a blackout target, with who would do it and the real odds. */
export interface EventPick { id: string; name: string; note: string; stat: StatId; member: Member | null; chance: number; money: number; mon: string | null; dark: boolean | null; sprite: string | null }

const placeName = (district: string): string => districtDef(district)?.name ?? district.charAt(0).toUpperCase() + district.slice(1);
const bestAt = (b: DominionBlock, stat: StatId): Member | null =>
  [...b.members].filter((m) => !crewOf(m).out).sort((x, y) => y.stats[stat] - x.stats[stat])[0] ?? null;
const odds = (b: DominionBlock, stat: StatId, bonus: number): { member: Member | null; chance: number } => {
  const member = bestAt(b, stat);
  return { member, chance: clamp(D().events.checkBase + (member?.stats[stat] ?? 0) * D().events.checkPer + bonus, 5, 95) };
};

export function eventPicks(b: DominionBlock, ev: RegionEvent): EventPick[] {
  const where = placeName(ev.district);
  if (ev.kind === 'festival') {
    return D().festival.jobs.map((j) => ({ id: j.id, name: j.name, note: j.note, stat: j.stat, ...odds(b, j.stat, j.bonus), money: j.money ?? 0, mon: j.mon ?? null, dark: null, sprite: null }));
  }
  const B = D().blackout;
  return B.targets.map((t) => ({ id: t.id, name: fill(t.name, { district: where }), note: t.note, stat: t.stat, ...odds(b, t.stat, t.dark ? B.darkBonus : 0), money: t.money, mon: null, dark: t.dark, sprite: t.sprite }));
}

/** Marks the event page as opened (it opens on its own once per event). */
export function seeEvent(b: DominionBlock, ev: RegionEvent): void {
  const l = lifeOf(b);
  if (!l.seen.includes(ev.key)) l.seen.push(ev.key);
}

// ---------- the Prize Corner ----------

export const prizes = () => D().coins.prizes;
const prizeById = (id: string | undefined) => D().coins.prizes.find((p) => p.id === id);
export const swapOdds = (b: DominionBlock): { member: Member | null; chance: number } => odds(b, D().coins.swapStat, D().coins.swapBonus);

// ---------- chapters ----------

/** The chapter the run is in now (the highest whose condition holds). */
export function chapterNow(b: DominionBlock): LifeFile_Chapter {
  const peak = peakOf(b);
  let at = D().chapters[0]!;
  for (const c of D().chapters) {
    const ok = c.when === 'start' || (c.when === 'founded' && !!b.teamName) || (c.when === 'peak' && peak >= c.at);
    if (ok && c.n > at.n) at = c;
  }
  return { ...at, line: fill(at.line, { region: regionName(realmOf(b).at) }) };
}
type LifeFile_Chapter = (typeof DOMINION_DATA.life.chapters)[number];
/** The chapter card waiting to be shown, if any. Chapter 1 is the opening scene itself, so its card never waits. */
export const chapterDue = (b: DominionBlock): LifeFile_Chapter | null => {
  const c = chapterNow(b);
  return c.n > Math.max(1, b.life?.chapter ?? 0) ? c : null;
};

// ---------- the actions ----------

export interface LifeOut { ok: boolean; run: RunState; notice: string | null; roll?: { r: number; chance: number; rolled: boolean } | null; bits?: string[] }

/** The R6 actions on the run (the party and the bag live on the run, not the block). Null for anything else. */
export function lifeInRun(content: Content, run: RunState, a: DominionAction): LifeOut | null {
  if (a.t !== 'clinic' && a.t !== 'care' && a.t !== 'regionEv' && a.t !== 'prize' && a.t !== 'chapter') return null;
  const no = (notice: string | null = null): LifeOut => ({ ok: false, run, notice });
  if (!run.expansion?.dominion) return no();
  const work = structuredClone(run);
  const b = work.expansion!.dominion!;
  const l = lifeOf(b);
  const done = (notice: string | null, extra: Partial<LifeOut> = {}): LifeOut => {
    syncHeat(b);
    return { ok: true, run: withBlock(work, DominionBlockSchema.parse(b)), notice, ...extra };
  };
  switch (a.t) {
    case 'clinic': {
      const L = D().clinic.lines;
      const mons = a.uid === null ? work.party : work.party.filter((m) => m.uid === a.uid);
      if (!mons.length) return no();
      const cost = mons.reduce((s, m) => s + clinicCost(content, m), 0);
      if (cost <= 0) return no(L.allFine!);
      if (b.funds < cost) return no(fill(L.broke!, { cost: money(cost) }));
      for (const m of mons) healOne(content, m);
      spend(b, cost);
      const who = mons.length === 1 ? (content.species.get(mons[0]!.speciesId)?.name ?? mons[0]!.speciesId) : 'the team';
      return done(fill(L.healed!, { who, cost: money(cost) }), { bits: [`−₽${money(cost)}`] });
    }
    case 'care': {
      const L = D().care.lines;
      const mon = work.party.find((m) => m.uid === a.uid);
      const tool = D().care.tools.find((t) => t.id === a.tool);
      if (!mon || !tool) return no();
      const name = content.species.get(mon.speciesId)?.name ?? mon.speciesId;
      const c = l.care[mon.uid];
      if (c?.day === b.day) return no(fill(L.already!, { mon: name }));
      if (mon.hp <= 0) return no(fill(L.fainted!, { mon: name }));
      if (tool.cost && b.funds < tool.cost) return no(fill(L.broke!, { cost: money(tool.cost) }));
      if (tool.cost) spend(b, tool.cost);
      const was = mon.friendship;
      changeFriendship(content, mon, tool.friendship);
      l.care[mon.uid] = { day: b.day, fed: tool.id === 'puff' ? b.day : (c?.fed ?? null) };
      return done(fill(L.done!, { mon: name, n: mon.friendship - was }), { bits: [`Friendship +${mon.friendship - was}`, ...(tool.cost ? [`−₽${money(tool.cost)}`] : [])] });
    }
    case 'regionEv': {
      const J = D().jobLines;
      const ev = regionEvent(b);
      if (!ev) return no(J.notNow!);
      if (!eventOpen(b, ev)) return no(J.over!);
      if (a.id === null) {
        l.done.push(ev.key);
        seeEvent(b, ev);
        return done(null);
      }
      const pick = eventPicks(b, ev).find((p) => p.id === a.id);
      if (!pick) return no();
      if (!pick.member) return no(J.nobody!);
      const r = rng(work.seed, 'dominion-life', b.day, ev.key, pick.id).int(1, 100);
      const pass = r <= pick.chance;
      const def = ev.kind === 'festival' ? D().festival.jobs.find((j) => j.id === pick.id)! : D().blackout.targets.find((t) => t.id === pick.id)!;
      const bits: string[] = [];
      if (pass && pick.money) {
        b.funds += pick.money;
        b.earned += pick.money;
        bits.push(`+₽${money(pick.money)}`);
      }
      if (pass && pick.mon) {
        const line = placeMon(content, work, withReserve(content, b), { species: pick.mon, level: ('level' in def ? def.level : undefined) ?? 10, by: pick.member.id, src: 'stolen' });
        bits.push(content.species.get(pick.mon)?.name ?? pick.mon);
        if (line) bits.push(line);
      }
      const heat = pass ? def.heat : def.failHeat;
      if (heat) (addHeat(b, ev.district, heat), bits.push(`Heat +${heat}`));
      l.done.push(ev.key);
      seeEvent(b, ev);
      const head = `${pick.name}: ${pass ? J.passed : J.missed}`;
      return done(`${head} ${bits.join(', ')}.`, { roll: { r, chance: pick.chance, rolled: true }, bits });
    }
    case 'prize': {
      const C = D().coins;
      const L = C.lines;
      if (a.op === 'buy') {
        if (b.funds < C.price) return no(fill(L.broke!, { n: C.pack, cost: money(C.price) }));
        spend(b, C.price);
        l.coins += C.pack;
        return done(fill(L.bought!, { n: C.pack, cost: money(C.price) }), { bits: [`+${C.pack} coins`, `−₽${money(C.price)}`] });
      }
      const p = prizeById(a.id);
      if (!p) return no();
      if (a.op === 'trade') {
        if (l.coins < p.coins) return no(fill(L.few!, { prize: p.name, coins: money(p.coins) }));
        l.coins -= p.coins;
        const got = givePrize(content, work, b, p);
        return done([fill(L.traded!, { coins: money(p.coins), prize: p.name }), got].filter(Boolean).join(' '), { bits: [p.name] });
      }
      if (l.swapDay === b.day) return no(L.swapDone!);
      const o = swapOdds(b);
      if (!o.member) return no(D().jobLines.nobody!);
      const r = rng(work.seed, 'dominion-life', b.day, 'swap', p.id).int(1, 100);
      l.swapDay = b.day;
      const roll = { r, chance: o.chance, rolled: true };
      if (r > o.chance) {
        const district = b.field.districts[C.district] ? C.district : Object.keys(b.field.districts)[0]!;
        addHeat(b, district, C.swapHeat);
        return done(fill(L.caught!, { heat: C.swapHeat }), { roll, bits: [`Heat +${C.swapHeat}`] });
      }
      const got = givePrize(content, work, b, p);
      return done([fill(L.swapped!, { prize: p.name }), got].filter(Boolean).join(' '), { roll, bits: [p.name] });
    }
    case 'chapter': {
      const c = chapterDue(b);
      if (!c) return no();
      l.chapter = c.n;
      return done(null);
    }
  }
}

/** A prize to the run: a Pokémon goes where a caught one goes (team or Reserve), an item into the Bag. */
function givePrize(content: Content, run: RunState, b: DominionBlock, p: ReturnType<typeof prizes>[number]): string | null {
  if (p.species) return placeMon(content, run, withReserve(content, b), { species: p.species, level: p.level ?? 10 });
  if (p.item) run.inventory[p.item] = (run.inventory[p.item] ?? 0) + 1;
  return null;
}

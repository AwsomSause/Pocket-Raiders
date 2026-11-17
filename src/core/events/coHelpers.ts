// Catalog Overhaul, families-c, second batch: Nix's barter board (SF55), spending "a Berry" or "a Potion" from the bag,
// a given Pokémon remembered and won back (SF61), a gift copy of a held item (SF60), and the helped Pokémon that come
// back once a region at the worst moment (SF63). Same rules as coToolkit.ts: no save change (run.story.flags), and no
// gameplay dice (seeded hashes of the run, the stage and the uid).

import data from '../../data/catalogOverhaul/familiesC.json';
import type { Content } from '../contentSchema';
import { fnv1a } from '../expansion/hash';
import { getSpecies, maxHp } from '../pokemon';
import { currentRegion } from '../regions';
import type { PokemonInstance, RunState } from '../state';
import type { BattleEvent } from '../battle/engine';

type Run = RunState;
type Tier = 'common' | 'uncommon' | 'rare';
const BARTER: { tiers: Record<string, Tier>; stock: Record<Tier, string[]> } = data.barter as never;
const HELPED: { strike: number; raiders: string[] } = data.helped;
const num = (run: Pick<Run, 'story'>, key: string): number => Number(run.story.flags[`ev:${key}`] ?? 0);
const put = (run: Run, key: string, value: number): void => { run.story.flags[`ev:${key}`] = Math.max(0, Math.round(value)); };
const str = (run: Pick<Run, 'story'>, key: string): string => { const v = run.story.flags[`co:${key}`]; return typeof v === 'string' ? v : ''; };
const itemName = (content: Content, id: string): string => content.items.get(id)?.name ?? content.catalog.get(id)?.name ?? id;
const speciesName = (content: Content, id: string): string => content.species.get(id)?.name ?? id;

// ---------- the bag: "a Berry", "a Potion" ----------

/** Bag items matching `ids` or ending with `suffix` (`-berry`), most copies first, then by id. */
export function bagMatches(run: Pick<Run, 'inventory'>, ids: readonly string[], suffix?: string): string[] {
  return Object.keys(run.inventory)
    .filter((id) => (run.inventory[id] ?? 0) > 0 && (ids.includes(id) || (!!suffix && id.endsWith(suffix))))
    .sort((a, b) => (run.inventory[b]! - run.inventory[a]!) || a.localeCompare(b));
}
export const bagCount = (run: Pick<Run, 'inventory'>, ids: readonly string[], suffix?: string): number => bagMatches(run, ids, suffix).reduce((s, id) => s + (run.inventory[id] ?? 0), 0);

/** Spends up to `count` matching items (at least one must be there). Returns what went, in words. */
export function spendFromBag(content: Content, run: Run, ids: readonly string[], suffix: string | undefined, count: number): string {
  const spent: string[] = [];
  for (let i = 0; i < count; i++) {
    const id = bagMatches(run, ids, suffix)[0];
    if (!id) break;
    run.inventory[id]! -= 1;
    if (run.inventory[id] === 0) delete run.inventory[id];
    spent.push(itemName(content, id));
  }
  return spent.length === 0 ? '' : `Gave ${spent.join(', ')}`;
}

// ---------- SF55 Nix's barter board ----------

/** A bag item's tier: Nix's own table first, then the catalog's rarity. Epic items and key items are not traded. */
export function tierOf(content: Content, id: string): Tier | null {
  const fixed = BARTER.tiers[id];
  if (fixed) return fixed;
  const entry = content.catalog.get(id);
  if (!entry || (entry.family ?? '').startsWith('Key items')) return null;
  return entry.rarity === 'common' || entry.rarity === 'uncommon' || entry.rarity === 'rare' ? entry.rarity : null;
}
/** What the player would put on the table for a tier: the item of that tier they hold most of. Stolen goods they kept (`honest-kept-<id>`) are not offered: "That one's not yours to trade." */
export function barterGive(content: Content, run: Pick<Run, 'inventory' | 'story'>, tier: Tier): string | null {
  const ids = Object.keys(run.inventory).filter((id) => (run.inventory[id] ?? 0) > 0 && tierOf(content, id) === tier && num(run, `honest-kept-${id}`) === 0);
  ids.sort((a, b) => (run.inventory[b]! - run.inventory[a]!) || a.localeCompare(b));
  return ids[0] ?? null;
}
/** Nix's board: one item per tier, the same all stage long (seeded by the run, region and stage). */
export function barterStock(run: Pick<Run, 'seed' | 'regionIndex' | 'stage'>, tier: Tier): string {
  const list = BARTER.stock[tier];
  return list[fnv1a(`${run.seed}::co-barter::${run.regionIndex}::${run.stage?.index ?? 0}::${tier}`) % list.length]!;
}
export const barterHas = (content: Content, run: Pick<Run, 'inventory' | 'story'>, tier: Tier, berry: boolean): boolean =>
  barterGive(content, run, tier) !== null && (!berry || bagCount(run, [], '-berry') > 0);

/** One trade on the board. Without `give` it is free (the keepsake's thanks). `berry` adds a Berry to the player's side. */
export function barter(content: Content, run: Run, give: Tier | undefined, get: Tier, berry: boolean, gift: (id: string) => string): string {
  const parts: string[] = [];
  if (give) {
    const id = barterGive(content, run, give);
    if (!id) return '';
    run.inventory[id]! -= 1;
    if (run.inventory[id] === 0) delete run.inventory[id];
    parts.push(`your ${itemName(content, id)}`);
  }
  if (berry) {
    const b = bagMatches(run, [], '-berry')[0];
    if (!b) return '';
    run.inventory[b]! -= 1;
    if (run.inventory[b] === 0) delete run.inventory[b];
    parts.push(`a ${itemName(content, b)}`);
  }
  const got = gift(barterStock(run, get));
  return parts.length > 0 ? `Traded ${parts.join(' and ')} for ${got}` : `Nix gives you ${got}`;
}

// ---------- SF61 a given Pokémon, remembered ----------

/** Keeps the picked Pokémon (the whole Pokémon) under `key`; with `take` it leaves the party. */
export function notePicked(content: Content, run: Run, key: string, pickedUid: string | undefined, take: boolean): string {
  const mon = run.party.find((m) => m.uid === pickedUid) ?? run.party[run.party.length - 1];
  if (!mon || (take && run.party.length < 2)) return '';
  run.story.flags[`co:note-${key}`] = JSON.stringify(mon);
  if (!take) return '';
  run.party.splice(run.party.indexOf(mon), 1);
  return `${mon.care?.nickname || speciesName(content, mon.speciesId)} is gone`;
}
/** The noted Pokémon itself, or null. */
export function noted(run: Pick<Run, 'story'>, key: string): PokemonInstance | null {
  const raw = str(run, `note-${key}`);
  if (!raw) return null;
  try { return JSON.parse(raw) as PokemonInstance; } catch { return null; }
}
/** Won back: the very Pokémon the player gave comes home (through the usual "wants to join" step). */
export function rejoin(content: Content, run: Run, key: string): string {
  const mon = noted(run, key);
  if (!mon) return '';
  delete run.story.flags[`co:note-${key}`];
  mon.hp = maxHp(content, mon);
  mon.status = null;
  run.pending.push({ kind: 'caught', mon });
  return `${mon.care?.nickname || speciesName(content, mon.speciesId)} comes home`;
}

// ---------- SF60 the poncho trainer's gift ----------

/** A copy of an item the chosen Pokémon holds (the first by id); a Leftovers-class gift from the list when it holds nothing. */
export function copyHeld(content: Content, run: Run, who: 'starter' | 'lead', gift: (id: string) => string): string {
  const mon = who === 'starter' ? run.party.find((m) => m.uid === run.log.starterUid) ?? run.party[0] : run.party.find((m) => m.hp > 0);
  const held = Object.keys(mon?.held ?? {}).sort()[0];
  const fallback: string[] = data.strangerGift;
  return gift(held ?? fallback[fnv1a(`${run.seed}::co-stranger-gift`) % fallback.length]!);
}

// ---------- SF63 the one you helped comes back ----------

const helpedList = (run: Pick<Run, 'story'>): string[] => str(run, 'helped').split(',').filter(Boolean);

/** Remembers a Pokémon the player helped (SF63). `rare`: SF63.8's rare one, which is the one that comes back. */
export function noteHelped(run: Run, species: string, rare: boolean): void {
  const list = helpedList(run).filter((s) => s !== species);
  run.story.flags['co:helped'] = [...list, species].join(',');
  if (rare) run.story.flags['co:helped-rare'] = species;
}

/** The worst moment: a boss fight with the lead already fainted, or a raider's ambush. */
function worstMoment(run: Run): boolean {
  const b = run.battle;
  if (!b || b.kind !== 'trainer' || !b.trainer) return false;
  const boss = b.trainer.classId === 'gym-leader' || b.trainer.classId === 'elite-four' || b.trainer.classId === 'champion';
  if (boss && (run.party[0]?.hp ?? 0) <= 0) return true;
  return !!b.event && HELPED.raiders.some((r) => b.trainer!.name.toLowerCase().includes(r));
}

/** A battle has started. Once a region, at the worst moment, a Pokémon the player helped arrives and strikes on turn one. */
export function helpedReturn(content: Content, run: Run): BattleEvent[] {
  const list = helpedList(run);
  const b = run.battle;
  if (list.length === 0 || !b || num(run, 'helped-return-at') === run.regionIndex + 1 || !worstMoment(run)) return [];
  const rare = str(run, 'helped-rare');
  const species = rare && list.includes(rare) ? rare : list[list.length - 1]!;
  const foe = b.enemyTeam[b.enemyIndex];
  if (!foe || foe.hp <= 1) return [];
  put(run, 'helped-return-at', run.regionIndex + 1);
  put(run, 'helped-returned', num(run, 'helped-returned') + 1);
  const amount = Math.min(foe.hp - 1, Math.max(1, Math.floor(maxHp(content, foe) * HELPED.strike)));
  foe.hp -= amount;
  if (species === rare) {
    put(run, 'helped-rare-returned', 1);
    run.story.flags['co:soon'] = 'wounded-rare-thanks';
  }
  return [
    { type: 'raid', tone: 'phase', text: `A ${speciesName(content, species)} bursts out of nowhere! It's the one you helped, and it strikes first!` },
    { type: 'damage', side: 'enemy', amount, hpAfter: foe.hp, effectiveness: 1, crit: false },
  ] as BattleEvent[];
}

/** A queued scene for the next step on the map (`co:soon`), taken once. */
export function takeSoon(run: Run): string | null {
  const id = str(run, 'soon');
  if (!id) return null;
  delete run.story.flags['co:soon'];
  return id;
}

// ---------- SF62 the Ditto, SF58.4 the valley's wild Pokémon ----------

/** A battle is about to begin. SF62: a Ditto the player failed to spot joins the foe's side as a copy of the lead, once. SF58.4: this region, wild Pokémon start at +1 Attack. */
export function sideBattleBegin(content: Content, run: Run): BattleEvent[] {
  const b = run.battle;
  if (!b) return [];
  const out: BattleEvent[] = [];
  if (b.kind === 'wild' && num(run, 'valley-wild-angry') > 0 && num(run, 'valley-wild-angry-at') === run.regionIndex + 1) {
    b.enemyStages.atk = Math.max(b.enemyStages.atk, 1);
    out.push({ type: 'raid', tone: 'info', text: 'The wild Pokémon here know your face. It comes at you angry!' } as BattleEvent);
  }
  if (num(run, 'ditto-lurking') > 0 && b.enemyTeam.length < 6) {
    put(run, 'ditto-lurking', 0);
    const lead = run.party[b.activeIndex] ?? run.party.find((m) => m.hp > 0);
    if (lead) {
      const copy = structuredClone(lead);
      copy.uid = `e-ditto-${fnv1a(`${run.seed}::co-ditto::${lead.uid}`).toString(36)}`;
      copy.held = undefined;
      copy.hp = maxHp(content, copy);
      copy.status = null;
      b.enemyTeam.push(copy);
      out.push({ type: 'raid', tone: 'phase', text: `Something on the other side looks exactly like your ${getSpecies(content, lead.speciesId).name}. The Ditto you missed has picked a side.` } as BattleEvent);
    }
  }
  return out;
}

// ---------- SF59 the taken egg ----------

/** The newest unhatched Egg of this species the player carries. */
const eggOf = (run: Pick<Run, 'eggs'>, species: string) => [...run.eggs].reverse().find((e) => e.speciesId === species);
export const hasEgg = (run: Pick<Run, 'eggs'>, species: string): boolean => !!eggOf(run, species);
/** Gives the Egg back (it leaves the party), or with `hatch` lets the story hatch it now (it joins through the usual step). */
export function returnEgg(content: Content, run: Run, species: string, hatch: boolean, hatchMon: (speciesId: string, level: number, shiny: boolean) => PokemonInstance): string {
  const egg = eggOf(run, species);
  if (!egg) return '';
  run.eggs.splice(run.eggs.indexOf(egg), 1);
  if (!hatch) return `The ${speciesName(content, species)} Egg goes home`;
  const mon = hatchMon(egg.speciesId, egg.level, egg.shiny);
  run.pending.push({ kind: 'caught', mon });
  return `The Egg hatched into ${speciesName(content, egg.speciesId)}!`;
}

// ---------- SF69: a follower that evolves only if it never sees the PC ----------

/** Binds the newest party Pokémon to `key` (its uid is remembered this run). */
export function boxBond(run: Run, key: string): void {
  const mon = run.party[run.party.length - 1];
  if (mon) run.story.flags[`co:boxbond-${key}`] = mon.uid;
}
/** Called when a Pokémon goes into the PC: a bound one is marked as boxed for the rest of the run. */
export function noteBoxed(run: Run, mon: Pick<PokemonInstance, 'uid'>): void {
  for (const [k, v] of Object.entries(run.story.flags)) if (k.startsWith('co:boxbond-') && v === mon.uid) run.story.flags[`co:boxed-${k.slice('co:boxbond-'.length)}`] = mon.uid;
}
/** True when this Pokémon was bound and has been in the PC: it does not evolve. */
export function boxedNoEvolve(run: Pick<Run, 'story'>, mon: Pick<PokemonInstance, 'uid'>): boolean {
  return Object.entries(run.story.flags).some(([k, v]) => k.startsWith('co:boxed-') && v === mon.uid);
}

// ---------- GL2: the Gym whose floor the janitor sweeps ----------

/** The type of this region's Gym: the last one beaten here (or, unless `beatenOnly`, the first not met yet). Null if none. */
export function hereGymType(content: Content, run: Run, beatenOnly: boolean): string | null {
  const leaders = currentRegion(content, run).gymLeaders.filter((id) => content.bosses.has(id));
  const beaten = [...run.usedLeaders].reverse().find((id) => leaders.includes(id));
  const id = beaten ?? (beatenOnly ? undefined : leaders.find((l) => !run.usedLeaders.includes(l)) ?? leaders[0]);
  return id ? (content.bosses.get(id)!.types[0] ?? null) : null;
}

// ---------- SF85 / SF81: run-long pays and favours ----------

/** SF85, the Oath of Speed kept and paid: the lead starts every battle at +1 Speed. */
export function oathSpeedStart(run: Run): BattleEvent[] {
  if (num(run, 'oath-speed-paid') <= 0 || !run.battle) return [];
  const before = run.battle.playerStages.spe ?? 0;
  const after = Math.min(6, before + 1);
  if (after === before) return [];
  run.battle.playerStages.spe = after;
  return [{ type: 'stat', side: 'player', stat: 'spe', change: after - before } as BattleEvent];
}

/** SF81, the Rangers' favour: once, a Pokémon that fainted in a lost battle is carried to safety at full HP. Returns its name, or ''. */
export function rangerRescue(content: Content, run: Run, lost: boolean): string {
  if (!lost || num(run, 'ranger-favour') <= 0) return '';
  const mon = run.party.find((m) => m.hp <= 0);
  if (!mon) return '';
  mon.hp = maxHp(content, mon);
  put(run, 'ranger-favour', 0);
  return speciesName(content, mon.speciesId);
}

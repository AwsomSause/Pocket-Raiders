// Catalog Overhaul Pack, Kanto Canon Spaces (category `kanto-canon`): the small rules the placed scripts need that no
// general event effect covers. One effect kind (`kc`) and one condition kind (`kc`), so the event schema grows by two
// rows only. No Phaser, no RNG stream of its own: every roll here is derived from the run seed and a fixed label.
// Docs: /mnt/project-files/catalog_overhaul_pack/kanto_canon_spaces/KANTO_PLACED_1..6.md.

import type { Content } from '../contentSchema';
import { addLevels, maxHp } from '../pokemon';
import { Rng, hashSeed } from '../rng';
import type { RunState } from '../state';

import { type KcCondition, type KcEffect } from './canonKantoSchema';
export { KcConditionSchema, KcEffectSchema } from './canonKantoSchema';

const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
type Stat = (typeof STATS)[number];

/** What a fossil is worth to the Pewter Museum ("pays in coins by rarity"). Anything not listed pays the common rate. */
const FOSSIL_PAY: Record<string, number> = { 'old-amber': 800, 'helix-fossil': 300, 'dome-fossil': 300 };
const FOSSIL_PAY_OTHER = 500;
/** A completed Fossil Fragment becomes one of these. */
const FRAGMENT_FOSSILS = ['helix-fossil', 'dome-fossil'];
const DAYCARE_LEVELS = 3;
/** The Memorial Wall answers at most this many flowers (and never more than the names the run has lost). */
const PARTING_GIFTS_MAX = 3;
/** "+1 Bond" on one Pokémon (the pack's shared scale: friendship +5). */
const BOND_STEP = 5;

const flagOf = (run: RunState, key: string) => Number(run.story.flags[`ev:${key}`] ?? 0);
const setFlag = (run: RunState, key: string, value: number) => { run.story.flags[`ev:${key}`] = Math.max(0, value); };
const held = (run: RunState, id: string) => (run.inventory[id] ?? 0) > 0;
const rollFor = (run: RunState, label: string) => new Rng(hashSeed(`${run.seed}::kanto-canon::${label}::${run.regionIndex}:${run.stage?.kind === 'stage' ? run.stage.index : 0}`));

interface Daycare { mons: RunState['party']; pair: boolean }
type CanonBag = { daycare?: Daycare } & Record<string, unknown>;
const bag = (run: RunState): CanonBag | undefined => run.expansion?.canon as CanonBag | undefined;
const setBag = (run: RunState, next: CanonBag) => { (run as { expansion?: object }).expansion = { ...run.expansion, canon: next }; };

/** Pokémon waiting at the Route 5 Day-Care (returned at the start of the next stage by core/expansion/canonRun.ts). */
export const daycareWaiting = (run: RunState): number => bag(run)?.daycare?.mons.length ?? 0;

export function kcHolds(_content: Content, run: RunState, c: KcCondition): boolean {
  switch (c.act) {
    case 'holdsAny': return c.ids.some((id) => held(run, id));
    case 'holdsNone': return !c.ids.some((id) => held(run, id));
    case 'fainted': return run.party.some((m) => m.hp <= 0);
    case 'daycare': return daycareWaiting(run) > 0;
    case 'giftLeft': return flagOf(run, 'kanto-tower-gifts') < Math.min(PARTING_GIFTS_MAX, run.nuzlocke?.memorial.length ?? 0);
  }
}

export function kcConditionWords(c: KcCondition): string {
  switch (c.act) {
    case 'holdsAny': return 'Needs a certain item';
    case 'holdsNone': return 'Only without a certain item';
    case 'fainted': return 'Needs a fainted Pokémon in your party';
    case 'daycare': return 'Needs a Pokémon waiting at the Day-Care';
    case 'giftLeft': return 'Needs a name of your own on the wall';
  }
}

export function kcWords(e: KcEffect): string {
  switch (e.act) {
    case 'statUp': return `${e.stat && e.stat !== 'random' && e.stat !== 'best' ? e.stat.toUpperCase() : 'a stat'} +${e.count ?? 1}`;
    case 'museumRegister': return 'the museum pays for the entry';
    case 'fossilFragment': return 'a Fossil Fragment';
    case 'daycareLeave': return (e.count ?? 1) > 1 ? 'two Pokémon stay at the Day-Care' : 'a Pokémon stays at the Day-Care';
    case 'daycareReturn': return `your Pokémon come back +${DAYCARE_LEVELS} levels`;
    case 'reviveOne': return 'a fainted Pokémon is revived';
    case 'partingGift': return 'a Parting Gift from the tower\'s ghosts';
    case 'bond': return `Bond +${e.count ?? 1}`;
  }
}

export interface KcCtx {
  /** The run's level cap (no event lifts it). */
  cap: number;
  /** The Pokémon a pick-a-Pokémon choice named, or the lead. */
  picked: RunState['party'];
  /** Adds an Egg of one of these species (the event `egg` effect). */
  egg: (species: string[], types?: string[]) => string;
}

/** The Pokémon that just joined: the newest catch waiting for a party slot, else the last party member. */
function newest(run: RunState): RunState['party'] {
  const waiting = [...run.pending].reverse().find((p) => p.kind === 'caught') as { mon: RunState['party'][number] } | undefined;
  const mon = waiting?.mon ?? run.party[run.party.length - 1];
  return mon ? [mon] : [];
}

/** Applies one `kc` effect (mutates `run`) and says what changed, or '' when nothing did. */
export function applyKc(content: Content, run: RunState, e: KcEffect, ctx: KcCtx): string {
  switch (e.act) {
    case 'statUp': {
      const mon = (e.who === 'newest' ? newest(run) : ctx.picked)[0];
      if (!mon) return '';
      const species = content.species.get(mon.speciesId);
      const rng = rollFor(run, `stat:${mon.uid}:${flagOf(run, 'kc-stat-rolls')}`);
      setFlag(run, 'kc-stat-rolls', flagOf(run, 'kc-stat-rolls') + 1);
      const stat: Stat = !e.stat || e.stat === 'random' ? STATS[rng.int(0, STATS.length - 1)]!
        : e.stat === 'best' ? [...STATS].sort((a, b) => (species?.baseStats[b] ?? 0) - (species?.baseStats[a] ?? 0))[0]! : e.stat;
      mon.statBoosts = { ...mon.statBoosts, [stat]: (mon.statBoosts?.[stat] ?? 0) + (e.count ?? 1) };
      return `${species?.name ?? mon.speciesId}: ${stat.toUpperCase()} +${e.count ?? 1}`;
    }
    case 'museumRegister': {
      const id = (e.ids ?? []).find((x) => held(run, x));
      if (!id) return '';
      const pay = FOSSIL_PAY[id] ?? FOSSIL_PAY_OTHER;
      run.money += pay;
      return `+₽${pay}`;
    }
    case 'fossilFragment': {
      const have = flagOf(run, 'kanto-fossil-fragment') + 1;
      if (have < 2) { setFlag(run, 'kanto-fossil-fragment', have); return 'a Fossil Fragment (half a fossil)'; }
      setFlag(run, 'kanto-fossil-fragment', 0);
      const fossil = FRAGMENT_FOSSILS[rollFor(run, 'fragment').int(0, FRAGMENT_FOSSILS.length - 1)]!;
      run.inventory[fossil] = (run.inventory[fossil] ?? 0) + 1;
      return `the two fragments fit: ${content.catalog.get(fossil)?.name ?? fossil}`;
    }
    case 'daycareLeave': {
      const st = bag(run);
      const n = e.count ?? 1;
      // The lead always stays; the Pokémon at the back of the party go. Never leaves the player without a Pokémon able to fight.
      if (!st || st.daycare || run.party.length <= n) return '';
      const going = run.party.slice(-n);
      if (!run.party.slice(0, -n).some((m) => m.hp > 0)) return '';
      run.party = run.party.slice(0, -n);
      setBag(run, { ...st, daycare: { mons: structuredClone(going), pair: n === 2 } });
      return kcWords(e);
    }
    case 'daycareReturn': {
      const st = bag(run);
      const dc = st?.daycare;
      if (!st || !dc) return '';
      const words: string[] = [];
      for (const m of dc.mons) { addLevels(content, m, DAYCARE_LEVELS, ctx.cap); m.hp = maxHp(content, m); m.status = null; }
      const room = Math.max(0, 6 - run.party.length);
      run.party.push(...dc.mons.slice(0, room));
      // A full party: the ones that do not fit wait in the pending list like any catch would (the player picks who stays).
      for (const m of dc.mons.slice(room)) run.pending.push({ kind: 'caught', mon: m });
      words.push(kcWords(e));
      if (dc.pair && dc.mons.length === 2) {
        const [a, b] = dc.mons.map((m) => content.species.get(m.speciesId));
        const groups = (x?: { eggGroups: string[] }) => (x?.eggGroups ?? []).filter((g) => g !== 'no-eggs');
        const ok = a && b && (groups(a).includes('ditto') || groups(b).includes('ditto') || groups(a).some((g) => groups(b).includes(g))) && groups(a).length > 0 && groups(b).length > 0;
        if (ok) words.push(ctx.egg([babyOf(content, a.id)]) || 'an Egg');
      }
      const { daycare: _gone, ...rest } = st;
      setBag(run, rest);
      return words.join(', ');
    }
    case 'partingGift': {
      const given = flagOf(run, 'kanto-tower-gifts');
      if (given >= Math.min(PARTING_GIFTS_MAX, run.nuzlocke?.memorial.length ?? 0)) return '';
      setFlag(run, 'kanto-tower-gifts', given + 1);
      const pick = rollFor(run, `parting:${given}`).int(0, 2);
      if (pick === 2) return ctx.egg([], ['ghost']) || 'a Ghost-type Egg';
      const id = pick === 0 ? 'spell-tag' : 'soul-dew-shard';
      run.inventory[id] = (run.inventory[id] ?? 0) + 1;
      return content.catalog.get(id)?.name ?? id;
    }
    case 'bond': {
      const mon = (e.who === 'newest' ? newest(run) : ctx.picked)[0];
      if (!mon) return '';
      mon.friendship = Math.min(255, mon.friendship + BOND_STEP * (e.count ?? 1));
      return kcWords(e);
    }
    case 'reviveOne': {
      const mon = run.party.find((m) => m.hp <= 0);
      if (!mon) return '';
      mon.hp = Math.max(1, Math.floor(maxHp(content, mon) / 2));
      mon.status = null;
      return `${content.species.get(mon.speciesId)?.name ?? mon.speciesId} is revived`;
    }
  }
}

/** The first stage of a species' line (an Egg hatches into it). */
function babyOf(content: Content, id: string): string {
  let cur = content.species.get(id);
  for (let i = 0; cur?.evolvesFrom && i < 4; i++) cur = content.species.get(cur.evolvesFrom) ?? cur;
  return cur?.id ?? id;
}

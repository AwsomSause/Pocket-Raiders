// DOMINION start (Part 1 §1, Part 7 §1.1, Part 9 A15): the Boss, two Team Types and one First Member, then Day 1's
// Evening in the rainy warehouse. Pure: the member's Pokémon is rolled on its own stream `dominion-start`.

import type { Content } from '../contentSchema';
import { newMon } from '../run';
import { hashSeed, Rng } from '../rng';
import type { RunState } from '../state';
import { DOMINION_DATA } from './data';
import type { DominionBlock, DominionSetup, Member } from './schema';
import { newField } from './migrate';

const D = () => DOMINION_DATA.start;

/** Why a pair of Team Types can't be taken, or null. */
export function typesProblem(types: readonly string[]): string | null {
  const t = D().types;
  if (types.length !== 2) return 'Pick two Team Types.';
  if (types.some((x) => t.banned.includes(x))) return t.bannedLine;
  if (types.some((x) => !t.allowed.includes(x))) return 'Pick from the sixteen types.';
  if (types[0] === types[1]) return 'Pick two different types.';
  return null;
}

const bstOf = (s: { baseStats: Record<string, number> }): number => Object.values(s.baseStats).reduce((a, b) => a + b, 0);

/** Species a first member can start with: unevolved, not Legendary or Mythical, from the first generation, under the BST line, and of a Team Type. */
export function memberMonPool(content: Content, types: readonly string[]): string[] {
  const r = D().members.monRules;
  const out: string[] = [];
  for (const s of content.species.values()) {
    if (s.generation > r.maxGeneration || s.evolvesFrom || bstOf(s) > r.maxBst) continue;
    if (s.tags.some((t) => t === 'legendary' || t === 'mythical')) continue;
    if (!s.types.some((t) => types.includes(t))) continue;
    out.push(s.id);
  }
  return out.sort();
}

/** The first member, made from the setup. */
export function firstMember(content: Content, run: RunState, setup: DominionSetup): Member {
  const m = D().members;
  const pool = memberMonPool(content, setup.types);
  if (!pool.length) throw new Error(`No first-member Pokémon for ${setup.types.join('/')}`);
  const rng = new Rng(hashSeed(`${run.seed}::dominion-start::${setup.types.join('-')}::${setup.member}`));
  const species = pool[rng.int(0, pool.length - 1)]!;
  const base = setup.member === 'grunt' ? m.grunt : m.admin;
  const look = setup.member === 'admin' ? m.admin.looks[setup.look] ?? m.admin.looks[0]! : null;
  const mon = newMon(content, run, species, base.monLevel, 'p');
  return {
    id: 'm1',
    name: look ? look.name : m.grunt.name,
    rank: base.rank,
    gender: look ? look.gender : m.grunt.gender,
    look: look ? look.file : m.grunt.look,
    level: 1,
    stats: { ...base.stats },
    loyalty: base.loyalty,
    morale: base.morale,
    traitPoints: base.traitPoints,
    untrained: true,
    wage: base.wage,
    team: [mon],
    joinedDay: 1,
    unpaid: 0,
  };
}

/** Day 1, Evening: the warehouse, one member, ₽1,000, Heat 5% (Part 1 §1.2). */
export function newBlock(content: Content, run: RunState, setup: DominionSetup): DominionBlock {
  const s = D().start;
  const c = D().clock;
  return {
    v: 2,
    day: 1,
    phase: 'evening',
    actions: 0,
    nightActions: c.nightActions,
    noRest: 0,
    rested: false,
    funds: s.funds,
    earned: 0,
    heat: s.heat,
    hqLevel: s.hqLevel,
    rosterCap: s.rosterCap,
    levelCap: s.levelCap,
    teamName: null,
    types: [setup.types[0], setup.types[1]],
    members: [firstMember(content, run, setup)],
    keyItems: [...s.keyItems],
    orders: [],
    ordersDone: [],
    flags: [],
    stepsDone: [],
    report: [],
    opened: false,
    field: newField(s.heat) as DominionBlock['field'],
  };
}

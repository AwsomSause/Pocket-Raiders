// Beta 0.5 (doc section 2.7, M5): a Pokémon you defeated comes back after a few nodes and asks to be the protégé of the one that
// beat it. Defeats are kept in `run.story.mentoring.defeated` (added to the existing knockout events, no second tracker).
// Rules: only a surviving party member that really knocked it out can be asked; each (species, mentor) pair returns once;
// rare Pokémon need a proven mentor; there is a cooldown and a per-run cap; the dice come from a stream derived from the run
// seed and the battle number, never from the run's own streams. The scene is unskippable; the mentor's answer follows its bond.

import type { Content } from '../contentSchema';
import { bondMood, bondOf } from '../bond';
import { createPokemon, getSpecies, isUsableMove } from '../pokemon';
import { Rng, hashSeed } from '../rng';
import type { PokemonInstance, RunState } from '../state';
import { MENTOR_CFG, TYPE_NAMES, chemistryLevel, mentorTypesFor, openBond } from './mentorBond';
import { emit, openHistory, openRelationship } from './record';
import type { DefeatedFoe, MentorType } from './schema';

const key = (species: string, byUid: string) => `${species}:${byUid}`;
const nm = (content: Content, id: string) => content.species.get(id)?.name ?? id;

/** After a won battle: keep the foes your Pokémon knocked out (the ones still alive in your party). */
export function recordDefeats(content: Content, run: RunState): void {
  const battle = run.battle;
  if (!content.balance.mentorRework || !battle || battle.outcome !== 'win') return;
  const index = run.encountersCompleted;
  const m = run.story.mentoring;
  for (const k of run.story.events) {
    if (k.type !== 'knockout' || k.where.battle !== index || k.data.side !== 'enemy' || !k.actors[1]) continue;
    const foe = battle.enemyTeam.find((e) => e.uid === k.actors[0]);
    const by = k.actors[1];
    if (!foe || !run.party.some((p) => p.uid === by)) continue;
    const species = foe.speciesId;
    if (m.defeated.some((d) => d.foeSpecies === species && d.byUid === by) || m.returned.includes(key(species, by))) continue;
    m.defeated.push({ foeSpecies: species, level: foe.level, byUid: by, battle: index, boss: !!battle.trainer?.leaderId, trainerId: battle.trainer?.classId ?? null, moves: foe.moves.map((s) => s.id).slice(0, 4) });
  }
  if (m.defeated.length > MENTOR_CFG.return.keep) m.defeated.splice(0, m.defeated.length - MENTOR_CFG.return.keep);
}

const isRare = (content: Content, id: string) => (content.species.get(id)?.tags ?? []).some((t) => t === 'legendary' || t === 'mythical');

function reasonFor(content: Content, run: RunState, d: DefeatedFoe, killer: PokemonInstance): string {
  const h = run.story.histories[killer.uid];
  const fs = getSpecies(content, d.foeSpecies);
  const ks = getSpecies(content, killer.speciesId);
  const k = nm(content, killer.speciesId);
  if ((h?.foes[d.foeSpecies] ?? 0) >= 2) return `${nm(content, d.foeSpecies)} has faced ${k} again and again, and wants to finally learn how it does it.`;
  if (fs.types.some((t) => ks.types.includes(t))) return `${nm(content, d.foeSpecies)} fights the way ${k} does, and saw a teacher in it.`;
  if (d.boss) return `${nm(content, d.foeSpecies)} was beaten by ${k} in front of its trainer, and could not forget it.`;
  return `${nm(content, d.foeSpecies)} has not forgotten the Pokémon that beat it.`;
}

export interface ReturnOffer { foe: DefeatedFoe; mentorUid: string; reason: string }

/** After a node: is there a defeated Pokémon ready to come back? Rare, spaced out and capped; never twice for the same pair. */
export function planReturn(content: Content, run: RunState): ReturnOffer | null {
  const m = run.story.mentoring;
  const cfg = MENTOR_CFG.return;
  const index = run.encountersCompleted;
  if (!content.balance.mentorRework || run.victory || m.returns >= cfg.maxReturns || run.pending.some((p) => p.kind === 'returnProtege')) return null;
  if (m.lastReturnBattle !== null && index - m.lastReturnBattle < cfg.cooldownBattles) return null;
  const open = run.story.relationships.filter((r) => r.open && r.kind === 'mentorship');
  const busy = new Set(open.flatMap((r) => [r.a.id, r.b.id]));
  const candidates = m.defeated.filter((d) => {
    const killer = run.party.find((p) => p.uid === d.byUid);
    const h = run.story.histories[d.byUid];
    if (!killer || killer.hp <= 0 || busy.has(killer.uid) || !h || m.returned.includes(key(d.foeSpecies, d.byUid))) return false;
    if (index - d.battle < cfg.minBattlesAfter) return false;
    if (isRare(content, d.foeSpecies) && h.bossesBeaten < cfg.rareMinBosses) return false;
    return killer.level >= d.level;
  });
  if (candidates.length === 0 || open.length >= 2) return null;
  if (!new Rng(hashSeed(`${run.seed}::return::${index}`)).chance(cfg.chance)) return null;
  // Prefer the pair with the longest history; the oldest defeat breaks ties.
  const best = [...candidates].sort((a, b) => (run.story.histories[b.byUid]?.foes[b.foeSpecies] ?? 0) - (run.story.histories[a.byUid]?.foes[a.foeSpecies] ?? 0) || a.battle - b.battle || a.foeSpecies.localeCompare(b.foeSpecies))[0]!;
  const killer = run.party.find((p) => p.uid === best.byUid)!;
  return { foe: best, mentorUid: killer.uid, reason: reasonFor(content, run, best, killer) };
}

/** Builds the returning Pokémon: a little grown, with moves it remembers from the fight. */
export function returningPokemon(content: Content, run: RunState, offer: ReturnOffer, uid: string): PokemonInstance {
  const killer = run.party.find((p) => p.uid === offer.mentorUid)!;
  const level = Math.max(1, Math.min(killer.level - 1, offer.foe.level + 3));
  const mon = createPokemon(content, offer.foe.foeSpecies, level, uid);
  const known = offer.foe.moves.filter((id) => isUsableMove(content, id) && !mon.moves.some((s) => s.id === id));
  for (const id of known.slice(0, 2)) {
    if (mon.moves.length >= 4) mon.moves.pop();
    mon.moves.push({ id, pp: content.moves.get(id)!.pp });
  }
  return mon;
}

/** How the mentor answers (from its bond with you and its history with this foe): accept, or send it away. */
export function mentorAccepts(run: RunState, mentorUid: string, foeSpecies: string): boolean {
  const h = run.story.histories[mentorUid];
  if (!h) return true;
  const b = bondOf(run, mentorUid);
  return bondMood(b) !== 'wary' && b.strain < 70 && (h.foes[foeSpecies] ?? 0) < 8;
}

/** Applies the cutscene's outcome. Returns the line to show. */
export function answerReturn(content: Content, run: RunState, offer: { mon: PokemonInstance; mentorUid: string; reason: string }): string {
  const m = run.story.mentoring;
  const mentor = run.party.find((p) => p.uid === offer.mentorUid);
  const species = offer.mon.speciesId;
  m.returned.push(key(species, offer.mentorUid));
  m.defeated = m.defeated.filter((d) => !(d.foeSpecies === species && d.byUid === offer.mentorUid));
  m.returns += 1;
  m.lastReturnBattle = run.encountersCompleted;
  const fn = nm(content, species);
  if (!mentor || !mentorAccepts(run, offer.mentorUid, species)) return `${fn} bowed and went on its way. Maybe another time.`;
  const mon = offer.mon;
  if (run.party.length < 6) run.party.push(mon);
  else run.box.push(mon);
  openHistory(content, run, mon.uid, species, 'gift');
  const mn = nm(content, mentor.speciesId);
  const cause = emit(content, run, 'storyMoment', { actors: [mentor.uid, mon.uid], data: { def: 'return-protege', suppressed: false }, importance: 80, text: `${fn} came back and asked ${mn} to teach it`, emotions: ['perseverance'] });
  const rel = openRelationship(content, run, 'mentorship', { kind: 'pokemon', id: mentor.uid }, { kind: 'pokemon', id: mon.uid }, cause);
  if (rel) {
    const found = mentorTypesFor(content, run, mentor, mon);
    const types: MentorType[] = ['formerEnemy', ...found.filter((t) => t !== 'formerEnemy')];
    const seen = run.story.histories[mentor.uid]?.foes[species] ?? 0;
    const bond = openBond(content, run, rel, types, mentor, mon, Math.min(40, 10 + 5 * seen));
    bond.trait = seen >= 2 ? 'heatedRivalry' : 'mutualRespect';
    run.story.flags[`mentor:path:${rel.id}`] = 'challenger';
    return `${fn} joined your team as ${mn}'s protégé (${types.map((t) => TYPE_NAMES[t]).join(', ')}; chemistry level ${chemistryLevel(bond.chemistry)}).`;
  }
  return `${fn} joined your team.`;
}

// Pokémon moments outside battle (Beta 0.6 batch 6): "rest" (a healing stop) and "catch" (a Pokémon joins the party).
// Rolls are stateless and seeded like the battle ones; a once-per-run moment is claimed only when it plays, so a failed roll
// at one rest does not use up the chance at the next. No new RNG stream: nothing else's rolls move.

import { displayName } from '../care';
import { TYPE_NAMES, type Content } from '../contentSchema';
import { bondFriendship } from '../co/who';
import { changeFriendship } from '../friendship';
import { addItem } from '../items';
import { typeEffectiveness } from '../battle/damage';
import { gainXp, getSpecies, xpForLevel } from '../pokemon';
import { bossInfo, runLevelCap } from '../regions';
import { hashSeed, Rng } from '../rng';
import type { PokemonInstance, RunState } from '../state';
import { momentMatches, momentRoll, momentsFor, runClaimKey, type PokemonMoment } from './pokemonMoments';

const BERRIES = ['oran-berry', 'sitrus-berry'];
const TALENT_STATS = ['atk', 'def', 'spa', 'spd', 'spe'] as const;

const nameOf = (content: Content, mon: PokemonInstance): string => displayName(content, mon);

/** A region-limited moment's claim for this Pokémon (Mythicals bring a gift once per region). */
const regionKey = (run: RunState, m: PokemonMoment, mon: PokemonInstance): string => `${runClaimKey(m)}@${mon.uid}:r${run.regionIndex}`;

/** One moment's roll at this point in the run: the run seed, the moment, the Pokémon and how many fights are behind it. */
function plays(run: RunState, m: PokemonMoment, mon: PokemonInstance): boolean {
  if (m.limit === 'run' && run.story.flags[runClaimKey(m)] !== undefined) return false;
  if (m.limit === 'region' && run.story.flags[regionKey(run, m, mon)] !== undefined) return false;
  if (!momentRoll(run.seed, m.id, mon.uid, run.encountersCompleted, m.chance)) return false;
  if (m.limit === 'run') run.story.flags[runClaimKey(m)] = 1;
  if (m.limit === 'region') run.story.flags[regionKey(run, m, mon)] = 1;
  return true;
}

/** A rest or evolution moment's extra conditions. */
function restRequirements(content: Content, run: RunState, m: PokemonMoment, mon: PokemonInstance, from?: string): boolean {
  const r = m.requires;
  if (!r) return true;
  if (r.promiseKept && !((run.story.histories[mon.uid]?.hyper['promise-kept'] ?? 0) > 0)) return false;
  if (r.flagBelow && !(Number(run.story.flags[r.flagBelow.key.replace('{uid}', mon.uid)] ?? 0) < r.flagBelow.n)) return false;
  if (r.flagAtLeast && !(Number(run.story.flags[r.flagAtLeast.key.replace('{uid}', mon.uid)] ?? 0) >= r.flagAtLeast.n)) return false;
  if (r.partyMatching && run.party.filter((p) => p.hp > 0 && momentMatches(content, m, p.speciesId)).length < r.partyMatching) return false;
  if (r.finalForm && getSpecies(content, mon.speciesId).evolutions.length > 0) return false;
  if (r.fromCocoon) {
    const at = run.story.flags[`${COCOON}${mon.uid}`];
    if (!from || !COCOONS.includes(from) || typeof at !== 'number' || stageAt(run) < at + 1) return false;
  }
  return true;
}

/** Cocoon species (PA9): the stage a Pokémon became one is stamped so its emergence can tell how long it waited. */
const COCOONS = ['metapod', 'kakuna', 'silcoon', 'cascoon', 'spewpa'];
const COCOON = 'pm-cocoon:';
const stageAt = (run: RunState): number => run.regionIndex * 100 + (run.stage?.index ?? 0);
export function noteCocoon(run: RunState, mon: PokemonInstance): void {
  if (COCOONS.includes(mon.speciesId) && run.story.flags[`${COCOON}${mon.uid}`] === undefined) run.story.flags[`${COCOON}${mon.uid}`] = stageAt(run);
}

/** A Pokémon has just evolved (from `from`): its evolution moments get one roll. Returns the lines to show. */
export function evolveMoments(content: Content, run: RunState, mon: PokemonInstance, from: string): string[] {
  if (content.balance.pokemonMoments === false) return [];
  noteCocoon(run, mon);
  const lines: string[] = [];
  for (const m of momentsFor(content, mon, 'evolve')) {
    if (!m.effect || !restRequirements(content, run, m, mon, from)) continue;
    // Once per Pokémon: the claim carries its uid.
    const key = `${runClaimKey(m)}@${mon.uid}`;
    if (run.story.flags[key] !== undefined) continue;
    run.story.flags[key] = 1;
    if (!momentRoll(run.seed, m.id, mon.uid, run.encountersCompleted, m.chance)) continue;
    const fx = m.effect;
    if (fx.bond) changeFriendship(content, mon, bondFriendship(content, fx.bond, 'picked'));
    if (fx.evAll) {
      const evs = (mon.evs ??= {});
      for (const st of ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const) evs[st] = Math.min(255, (evs[st] ?? 0) + fx.evAll);
    }
    lines.push(`${nameOf(content, mon)}: ${m.name}. ${m.effectText}`);
  }
  return lines;
}

/** Ghost Story: the types that hit this stage's leader hardest, told as a tale. */
function weaknessLine(content: Content, run: RunState): string {
  const stage = run.stage!;
  const leader = bossInfo(content, stage.kind === 'league' ? 'champion' : 'gym', stage.leaderId);
  const hits = TYPE_NAMES.map((t) => ({ t, x: typeEffectiveness(content.typeChart, t, leader.types) })).filter((e) => e.x > 1).sort((a, b) => b.x - a.x || a.t.localeCompare(b.t)).slice(0, 3);
  return hits.length === 0 ? `${leader.title} has no common weakness.` : `${leader.title} is weak to ${hits.map((e) => e.t.toUpperCase()).join(', ')}.`;
}

/** A healing stop: each party member's rest moments get one roll. Returns the lines to show. */
export function restMoments(content: Content, run: RunState): string[] {
  if (content.balance.pokemonMoments === false) return [];
  const lines: string[] = [];
  for (const mon of [...run.party]) {
    for (const m of momentsFor(content, mon, 'rest')) {
      if (!m.effect || !restRequirements(content, run, m, mon)) continue;
      // A gift that this species has none of does nothing, so it is neither played nor claimed.
      if (m.effect.giveItem && !m.effect.giveItem[mon.speciesId]) continue;
      // Dream Walk does nothing for a Pokémon already at the level cap, so it is neither played nor claimed.
      if (m.effect.xpPct && mon.xp >= xpForLevel(getSpecies(content, mon.speciesId).growthRate, Math.min(content.balance.difficulty.maxLevel, runLevelCap(content, run)), content.balance.difficulty.highLevelXp)) continue;
      if (!plays(run, m, mon)) continue;
      const fx = m.effect;
      if (fx.friendship) changeFriendship(content, mon, fx.friendship);
      if (fx.bond) changeFriendship(content, mon, bondFriendship(content, fx.bond, 'picked'));
      if (fx.cure) mon.status = null;
      if (fx.giveItem?.[mon.speciesId]) addItem(run.inventory, fx.giveItem[mon.speciesId]!, 1);
      if (fx.teamFriendship) for (const p of run.party) changeFriendship(content, p, fx.teamFriendship);
      if (fx.freeBerry) addItem(run.inventory, BERRIES[Math.floor(new Rng(hashSeed(`${run.seed}:pmoment:${m.id}:${mon.uid}:berry`)).float() * BERRIES.length)]!, 1);
      let extra = '';
      if (fx.xpPct) {
        const rate = getSpecies(content, mon.speciesId).growthRate;
        const hl = content.balance.difficulty.highLevelXp;
        const gap = xpForLevel(rate, mon.level + 1, hl) - xpForLevel(rate, mon.level, hl);
        gainXp(content, mon, Math.max(1, Math.floor((gap * fx.xpPct) / 100)), runLevelCap(content, run));
      }
      if (fx.weaknessHint && run.stage) extra = ` ${weaknessLine(content, run)}`;
      // A scene with choices opens as a stop beside this one.
      if (fx.openEvent && run.stage && content.events.has(fx.openEvent)) {
        const here = run.stage.map.nodes.find((n) => n.id === run.stage!.current);
        if (here && !here.sides.some((x) => x.kind === 'event' && x.eventId === fx.openEvent && !x.used)) here.sides.push({ id: `event-room-${here.sides.length + 1}-${here.id}`, kind: 'event', used: false, eventId: fx.openEvent });
      }
      lines.push(`${nameOf(content, mon)}: ${m.name}. ${m.effectText}${extra}`);
      break;
    }
  }
  return lines;
}

/** A Pokémon has just joined the party: its catch moments get one roll. `healParty` is passed in (run.ts owns it). */
export function joinMoments(content: Content, run: RunState, joined: PokemonInstance, healParty: () => void): string[] {
  if (content.balance.pokemonMoments === false) return [];
  const lines: string[] = [];
  for (const m of momentsFor(content, joined, 'catch')) {
    if (!m.effect) continue;
    const fx = m.effect;
    // A talent it already has is kept: the moment does nothing, so it is not claimed.
    if (fx.talentRoll && joined.care?.talent) continue;
    if (!plays(run, m, joined)) continue;
    if (fx.healTeam) healParty();
    if (fx.friendship) changeFriendship(content, joined, fx.friendship);
    if (fx.talentRoll) {
      const care = (joined.care ??= {} as NonNullable<PokemonInstance['care']>);
      care.talent = TALENT_STATS[Math.floor(new Rng(hashSeed(`${run.seed}:pmoment:${m.id}:${joined.uid}:talent`)).float() * TALENT_STATS.length)]!;
    }
    lines.push(`${nameOf(content, joined)}: ${m.name}. ${m.effectText}`);
  }
  return lines;
}

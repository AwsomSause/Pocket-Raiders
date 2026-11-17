// Evil Mode: starting a battle the day's waiting on (design Part 7 section 5.3 and Part 18 section 7.3). Real battles,
// in the battle engine as it is: Outplay in person is the Boss's own party against the local's; a Hold is the posted
// person's Doctrine kit against the Hero's party, read from the rival record. Levels are offsets from the stage's own
// level (Part 2 section 1.1). No gameplay stream is drawn: the teams come from the seed and the holding.

import type { Content } from '../contentSchema';
import { createBattle } from '../battle/engine';
import { bossTeamIndex, curveLevel, createPlannedPokemon, GYM_LEADER_CLASS, levelScale, remixMembers, type PlannedMember } from '../encounters';
import { gearTeam, playerItemsPer } from '../bossGear';
import { giveBossItems } from '../battle/held';
import { gimmickSlots, planBossGimmicks } from '../battle/bossGimmicks';
import { currentLeader, leaderById } from './gym';
import { defOf } from './neighbour';
import { getBoss, getCampaign } from '../regions';
import { hashSeed, Rng } from '../rng';
import { newMon, nextUid } from '../run';
import { rivalFightTeam } from '../rivals/living';
import type { PokemonInstance, RunState } from '../state';
import { localOf } from './board';
import { EVIL_DATA, type EvilData } from './data';
import { heroRival } from './fightEnd';
import { heroTier } from './hero';
import type { EvilModeBlock, Holding } from './schema';

/** The stage's own level, `A` (Part 2 section 1.1): the main game's curve at this region and stage. */
export function stageLevel(content: Content, run: RunState, block: EvilModeBlock): number {
  return curveLevel(content, levelScale(content, getCampaign(content, run.campaignId), block.here.region, Math.max(0, block.here.stage - 1), 1));
}

/** Species ids (as content has them) from a Doctrine kit's display names. */
export function kitSpecies(content: Content, names: readonly string[]): string[] {
  const id = (n: string) => n.toLowerCase().replace('♂', '-m').replace('♀', '-f').replace(/[^a-z0-9-]/g, '');
  return names.map(id).filter((s) => content.species.has(s));
}

/** The kit a posted person carries: one of the Doctrine's three, fixed by who they are. */
export function kitFor(block: EvilModeBlock, personId: string, data: EvilData = EVIL_DATA): string[] {
  const d = data.doctrines.find((x) => x.id === block.team.doctrine) ?? data.doctrines[0]!;
  const k = new Rng(hashSeed(`${block.district?.seed ?? ''}::evil-kit::${personId}`)).int(0, d.kits.length - 1);
  return d.kits[k]!;
}

/** The team a holding fields in an Outplay: a local's own, a wild ground's, an Alpha. Fixed by the seed and the holding. */
export function holdingTeam(block: EvilModeBlock, h: Holding, data: EvilData = EVIL_DATA): { species: string[]; offset: number } {
  const F = data.hero.fights;
  const L = data.hero.levels;
  const rng = new Rng(hashSeed(`${block.district?.seed ?? ''}::evil-outplay::${h.id}`));
  const l = localOf(h, data);
  if (l && F.locals[l.id]) return { species: F.locals[l.id]!, offset: L.local };
  if (h.kind === 'alpha') return { species: [rng.pick(F.alpha)], offset: L.alpha };
  return { species: [rng.pick(F.wild), rng.pick(F.wild)], offset: L.wild };
}

/** The Hero's party for a fight: the rival record's team, cut to the tier's size, at the tier's level (Part 18 section 7.1). */
export function heroParty(content: Content, run: RunState, block: EvilModeBlock): { species: string; level: number }[] {
  const rival = heroRival(run, block);
  if (!rival || !block.hero) return [];
  const tier = heroTier(block.hero);
  const A = stageLevel(content, run, block);
  return rivalFightTeam(content, rival).slice(0, tier.party).map((species, i) => ({ species, level: Math.max(1, A + tier.level + (i === 0 ? tier.ace : 0)) }));
}


/**
 * A Gym Leader's team for an Evil Mode Gym battle (Part 8a section 2): the main game's own team for that Gym (species,
 * moves, training), at A + `offset`, with boss gear (held items, trained stats) by the main game's rules. A Leader who's
 * already beaten the Boss leads differently (the order turns). No gameplay stream: the items' generator is hashed.
 */
export function leaderTeam(content: Content, run: RunState, block: EvilModeBlock, bossId: string, n: number, offset: number, tried: number): { team: PokemonInstance[]; ai: number } {
  const boss = getBoss(content, bossId);
  const authored = boss.teams.gym[bossTeamIndex('gym', block.here.region * 8 + n)]!;
  const A = stageLevel(content, run, block);
  const level = Math.max(1, A + offset);
  let members: PlannedMember[] = remixMembers(authored.members, tried > 0, `evil-gym:${bossId}:${tried}`).map((m) => ({ speciesId: m.speciesId, level, moves: m.moves, training: m.training }));
  if (content.balance.bossGear) members = gearTeam(content, members, 'gym', playerItemsPer(run.party));
  const team = members.filter((m) => content.species.has(m.speciesId)).map((m) => {
    const uid = nextUid(run, 'e');
    return createPlannedPokemon(content, m, uid, `${run.seed}:${uid}`);
  });
  giveBossItems(content, team, 'gym', block.here.region, new Rng(hashSeed(`${block.district?.seed ?? ''}::evil-gym-items::${bossId}::${tried}`)));
  return { team, ai: authored.ai };
}

/**
 * Starts the battle `block.fight` describes and marks it begun. Returns null when there's nothing to start. A Hold lends
 * the posted person's kit to the player for the fight: the Boss's party waits in the box (`fight.lent`) and comes back
 * however it ends (fightEnd.ts).
 */
export function beginEvilFight(content: Content, current: RunState): RunState | null {
  const block = current.expansion?.evilMode;
  const f = block?.fight;
  const h = f ? block!.district?.holdings.find((x) => x.id === f.holdingId) : undefined;
  if (!block || !f || f.begun || !h || current.battle) return null;
  const run = structuredClone(current);
  const A = stageLevel(content, run, block);
  let lent: string[] = [];
  if ((f.kind === 'chair' || f.kind === 'legend') && block.neighbour) {
    // Slice 13: the Chair is the neighbour's Boss with their own Gym team at A+2, boss gear and the region's gimmicks;
    // the Legend is their team's `legendary`, alone, at A+3, wild (so a ball can be thrown).
    const def = defOf(block.neighbour);
    const N = EVIL_DATA.neighbour.numbers;
    const active = Math.max(0, run.party.findIndex((m) => m.hp > 0));
    if (!run.party[active]) return null;
    if (f.kind === 'chair') {
      const L = leaderById(def.id);
      if (!L) return null;
      const { team, ai } = leaderTeam(content, run, block, L.boss, L.n, N.chairOffset, block.neighbour.chair.tries);
      if (!team.length) return null;
      run.battle = createBattle('trainer', team, active, run.party[active]!.uid, { classId: GYM_LEADER_CLASS, name: def.boss, leaderId: L.boss });
      run.battle.ai = ai;
      const plan = planBossGimmicks(content, L.boss, run.battle.enemyTeam, gimmickSlots(block.here.region, Math.max(1, block.here.stage - 1), content.balance.transformations.bossGimmickAfterStage), run.disabledMechanics);
      run.battle.transform.bossPlan = plan;
      run.battle.transform.enemyMechanics = [...new Set(Object.values(plan))];
    } else {
      if (!content.species.has(def.legend)) return null;
      run.battle = createBattle('wild', [newMon(content, run, def.legend, Math.max(1, A + N.legendOffset), 'e')], active, run.party[active]!.uid);
    }
    run.phase = 'battle';
    run.expansion = { ...(run.expansion ?? {}), evilMode: { ...block, fight: { ...f, begun: true } } };
    return run;
  }
  if (f.kind === 'heist') {
    // Slice 14: a heist's room: a watchman's one Pokémon, the dog, or the other crew's two, at the stage's level, drawn by the seed (no stream).
    const hs = block.scheme?.heist;
    const room = hs?.rooms[hs.at];
    if (!hs || !room) return null;
    const F = EVIL_DATA.scheme.heists.foes;
    const pool = (room === 'dog' ? F.dog : room === 'crew' ? F.crew : F.guard).filter((x) => content.species.has(x));
    if (!pool.length) return null;
    const r = new Rng(hashSeed(`${block.district?.seed ?? 'heist'}::heist::${hs.id}::${hs.at}`));
    const n = room === 'crew' ? 2 : 1;
    const enemy = Array.from({ length: n }, () => newMon(content, run, pool[r.int(0, pool.length - 1)]!, Math.max(1, A), 'e'));
    const active = Math.max(0, run.party.findIndex((m) => m.hp > 0));
    if (!run.party[active]) return null;
    const name = room === 'crew' ? `${block.neighbour ? defOf(block.neighbour).teamName : 'The other'} crew` : room === 'dog' ? 'Biscuit' : 'The watchman';
    run.battle = createBattle('trainer', enemy, active, run.party[active]!.uid, { classId: EVIL_DATA.hero.classes.local, name, leaderId: null });
    run.phase = 'battle';
    run.expansion = { ...(run.expansion ?? {}), evilMode: { ...block, fight: { ...f, begun: true } } };
    return run;
  }
  if (f.kind === 'gym' || f.kind === 'challenge') {
    // Slice 8: Beat (the Boss's party) or the Officer's challenge (their kit, the Boss's party in the box), against the
    // Leader at A+2 with the main game's gimmick count (one after Stage 5 of Region 1, one more a region, to four).
    const L = currentLeader(block);
    if (!L) return null;
    const N = EVIL_DATA.gym.numbers;
    const g = (block.gyms ?? []).find((x) => x.region === block.district?.region && x.district === block.district?.n);
    const { team, ai } = leaderTeam(content, run, block, L.boss, L.n, f.kind === 'gym' ? N.beat.offset : N.replace.offset, g?.tried ?? 0);
    if (f.kind === 'challenge') {
      const kit = kitSpecies(content, kitFor(block, f.personId!)).map((s) => newMon(content, run, s, Math.max(1, A + N.replace.offset), 'p'));
      if (!kit.length) return null;
      lent = run.party.map((m) => m.uid);
      run.box = [...(run.box ?? []), ...run.party];
      run.party = kit;
    }
    const active = Math.max(0, run.party.findIndex((m) => m.hp > 0));
    if (!team.length || !run.party[active]) return null;
    run.battle = createBattle('trainer', team, active, run.party[active]!.uid, { classId: GYM_LEADER_CLASS, name: L.name, leaderId: L.boss });
    run.battle.ai = ai;
    const plan = planBossGimmicks(content, L.boss, run.battle.enemyTeam, gimmickSlots(block.here.region, L.n + 1, content.balance.transformations.bossGimmickAfterStage), run.disabledMechanics);
    run.battle.transform.bossPlan = plan;
    run.battle.transform.enemyMechanics = [...new Set(Object.values(plan))];
    run.phase = 'battle';
    run.expansion = { ...(run.expansion ?? {}), evilMode: { ...block, fight: { ...f, begun: true, ...(lent.length ? { lent } : {}) } } };
    return run;
  }
  let foes: { species: string; level: number }[];
  let trainer: { classId: string; name: string };
  if (f.kind === 'hold') {
    foes = heroParty(content, run, block);
    trainer = { classId: EVIL_DATA.hero.classes.hero, name: block.hero!.name };
    const kit = kitSpecies(content, kitFor(block, f.personId!)).map((s) => newMon(content, run, s, Math.max(1, A + EVIL_DATA.hero.levels.kit), 'p'));
    if (!kit.length || !foes.length) return null;
    lent = run.party.map((m) => m.uid);
    run.box = [...(run.box ?? []), ...run.party];
    run.party = kit;
  } else {
    const t = holdingTeam(block, h);
    foes = t.species.filter((s) => content.species.has(s)).map((species) => ({ species, level: Math.max(1, A + t.offset) }));
    const l = localOf(h);
    trainer = { classId: l ? EVIL_DATA.hero.classes.local : h.kind === 'alpha' ? EVIL_DATA.hero.classes.alpha : EVIL_DATA.hero.classes.wild, name: l ? l.who.replace(/,.*$/, '') : h.ref };
  }
  const enemy = foes.map((x) => newMon(content, run, x.species, x.level, 'e'));
  const active = Math.max(0, run.party.findIndex((m) => m.hp > 0));
  if (!enemy.length || !run.party[active]) return null;
  run.battle = createBattle('trainer', enemy, active, run.party[active]!.uid, { ...trainer, leaderId: null });
  run.phase = 'battle';
  run.expansion = { ...(run.expansion ?? {}), evilMode: { ...block, fight: { ...f, begun: true, ...(lent.length ? { lent } : {}) } } };
  return run;
}

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
import { walkRound } from './walk';
import { detectiveOf } from './raid';

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
  // Slice 10: Walk it (the player's own base, with a Hero-built party) and the Raid's Office battle (the detective's six).
  if (block && f && !f.begun && !current.battle && (f.kind === 'walk' || f.kind === 'raid')) return beginBaseFight(content, current, block);
  if (block && f && !f.begun && !current.battle && (f.kind === 'room' || f.kind === 'practice' || f.kind === 'ending')) return beginRoadFight(content, current, block);
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

/**
 * Walk it: the player is the intruder, with the Hero's party as the rival record builds it (the same starter line, the
 * counters learned), lent for the walk while the Boss's waits in the box. The person at the door fights with their own
 * kit at the stage's level, an Officer a level up, an Executive two, a Proud one more; a Devoted Grunt's second fight is
 * one Pokémon at 1 HP. The Raid's Office: the Boss's own party against the detective's six at A+1.
 */
function beginBaseFight(content: Content, current: RunState, block: EvilModeBlock): RunState | null {
  const f = block.fight!;
  const run = structuredClone(current);
  const A = stageLevel(content, run, block);
  const P = EVIL_DATA.base.people;
  let lent: string[] = [];
  let enemy: PokemonInstance[];
  let trainer: { classId: string; name: string };
  if (f.kind === 'walk') {
    const c = block.crew.find((x) => x.id === f.personId);
    const party = heroParty(content, run, block);
    if (!c || !party.length) return null;
    const round = walkRound(block, c.id);
    const lvl = Math.max(1, A + (P.levels[c.rank] ?? 0) + (c.flaw === 'proud' ? 1 : 0));
    const kit = kitSpecies(content, kitFor(block, c.id)).slice(0, round > 1 ? 1 : undefined);
    enemy = kit.map((s) => newMon(content, run, s, lvl, 'e'));
    if (round > 1) for (const m of enemy) m.hp = 1;
    trainer = { classId: c.rank === 'officer' || c.rank === 'executive' ? P.classes.officer : P.classes.grunt, name: c.name };
    lent = run.party.map((m) => m.uid);
    run.box = [...(run.box ?? []), ...run.party];
    run.party = party.map((m) => newMon(content, run, m.species, m.level, 'p'));
  } else {
    const d = detectiveOf(block);
    enemy = kitSpecies(content, d.team).map((s) => newMon(content, run, s, Math.max(1, A + 1), 'e'));
    trainer = { classId: P.classes.detective, name: d.name };
  }
  const active = Math.max(0, run.party.findIndex((m) => m.hp > 0));
  if (!enemy.length || !run.party[active]) return null;
  run.battle = createBattle('trainer', enemy, active, run.party[active]!.uid, { ...trainer, leaderId: null });
  run.phase = 'battle';
  run.expansion = { ...(run.expansion ?? {}), evilMode: { ...block, fight: { ...f, begun: true, ...(lent.length ? { lent } : {}) } } };
  return run;
}

/**
 * Slice 12. The last room's battle (Part 21 section 6.6): the Boss's own party against the Hero's six (four for an
 * Idealist at Curious or Uneasy), by the rival rules: their ace at the Boss's level +2, the rest at the tier's level; at
 * ten marks their AI goes up a tier. The fire's practice battle (Part 19 section 10.1): the Boss's weakest, lent alone,
 * against their starter. No stakes; healed after.
 */
function beginRoadFight(content: Content, current: RunState, block: EvilModeBlock): RunState | null {
  const f = block.fight!;
  // Slice 15: an ending's battle. The Plateau's four and its Champion (the Recruit), or the Hero's six as in the last room.
  if (f.kind === 'ending' && f.holdingId !== 'hero') return beginLeagueFight(content, current, block);
  const hero = block.hero;
  const rival = heroRival(current, block);
  if (!hero || !rival) return null;
  const run = structuredClone(current);
  const A = stageLevel(content, run, block);
  const tier = heroTier(hero);
  let lent: string[] = [];
  let enemy: PokemonInstance[];
  if (f.kind === 'practice') {
    const weakest = [...run.party].filter((m) => m.hp > 0).sort((a, b) => a.level - b.level)[0];
    const starter = rivalFightTeam(content, rival)[0];
    if (!weakest || !starter) return null;
    lent = run.party.map((m) => m.uid);
    run.box = [...(run.box ?? []), ...run.party];
    run.party = [newMon(content, run, weakest.speciesId, weakest.level, 'p')];
    enemy = [newMon(content, run, starter, Math.max(1, A + tier.level), 'e')];
  } else {
    const size = hero.personality === 'idealist' && hero.temper <= 1 ? 4 : 6;
    const top = Math.max(1, ...run.party.map((m) => m.level));
    enemy = rivalFightTeam(content, rival).slice(0, size).filter((s) => content.species.has(s)).map((s, i) => newMon(content, run, s, i === 0 ? top + 2 : Math.max(1, A + tier.level), 'e'));
  }
  const active = Math.max(0, run.party.findIndex((m) => m.hp > 0));
  if (!enemy.length || !run.party[active]) return null;
  run.battle = createBattle('trainer', enemy, active, run.party[active]!.uid, { classId: EVIL_DATA.hero.classes.hero, name: hero.name, leaderId: null });
  if (f.kind === 'room' || f.kind === 'ending') run.battle.ai = hero.marks >= 10 ? 1 : 0.5;
  run.phase = 'battle';
  run.expansion = { ...(run.expansion ?? {}), evilMode: { ...block, fight: { ...f, begun: true, ...(lent.length ? { lent } : {}) } } };
  return run;
}

/** Slice 15: the Recruit's Plateau (Part 23 section 6): an Elite (`elite:0`..`elite:3`) or the Champion, at the stage's level plus an offset. */
function beginLeagueFight(content: Content, current: RunState, block: EvilModeBlock): RunState | null {
  const f = block.fight!;
  const L = EVIL_DATA.endings.league;
  const champ = f.holdingId === 'champion';
  const who = champ ? L.champion : L.elite[Number(f.holdingId.split(':')[1] ?? 0)];
  if (!who) return null;
  const run = structuredClone(current);
  const A = stageLevel(content, run, block);
  const enemy = who.team.filter((s) => content.species.has(s)).map((s) => newMon(content, run, s, Math.max(1, A + (champ ? L.championOffset : L.eliteOffset)), 'e'));
  const active = Math.max(0, run.party.findIndex((m) => m.hp > 0));
  if (!enemy.length || !run.party[active]) return null;
  run.battle = createBattle('trainer', enemy, active, run.party[active]!.uid, { classId: GYM_LEADER_CLASS, name: who.name, leaderId: null });
  run.battle.ai = 1;
  run.phase = 'battle';
  run.expansion = { ...(run.expansion ?? {}), evilMode: { ...block, fight: { ...f, begun: true } } };
  return run;
}

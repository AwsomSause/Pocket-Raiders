// Raid rules (pure, no Phaser). The battle engine calls the hooks here: `absorbHit` when the boss takes
// damage (shields), `chargedDamage` when the boss hits the player (telegraphed attack), `advanceRaid`
// at the end of each turn (phases, telegraph countdown, timer), `takeExtraAction` for bonus attacks.
// Nothing here uses randomness during a fight; the boss and den are picked from seeded generators.

import { Rng, hashSeed } from '../rng';
import { createPokemon, maxHp } from '../pokemon';
import type { Content } from '../contentSchema';
import type { BattleState, PokemonInstance, RaidBattle, RunState } from '../state';
import { focusDenBonus } from '../campaign/director';
import { grandRaidFor } from '../story/grandEnemy';
import type { TypeName, Weather } from '../contentSchema';
import type { BattleEvent } from '../battle/engine';
import { isUnlockedAt } from '../availability';
import { levelCap } from '../regions';
import type { DenTrigger, RaidApproach, RaidBot, RaidDef, RaidModifiers, RaidPhase, RaidTalk } from './schema';
import { badgeLevelBonus, raidTierName, scaledRaid, tierOpenAtBadges } from './scaling';

export function getRaid(content: Content, id: string): RaidDef {
  const raid = content.raids.raids.find((r) => r.id === id);
  if (!raid) throw new Error(`Unknown raid "${id}"`);
  return raid;
}

/** The raid as it is in this fight: the definition scaled for the badge count the fight started with. */
export function raidDef(content: Content, raid: Pick<RaidBattle, 'id' | 'badges'> & Partial<Pick<RaidBattle, 'gimmick'>>): RaidDef {
  const def = scaledRaid(content, getRaid(content, raid.id), raid.badges);
  // S401: the gimmick card in play adds its rules to the boss.
  const card = raid.gimmick ? content.raids.gimmickCards.find((c) => c.id === raid.gimmick) : undefined;
  if (!card) return def;
  return { ...def, modifiers: { ...def.modifiers, ...(card.modifiers ?? {}) }, enrage: def.enrage ?? card.enrage ?? null };
}

/** The raid tiers a den can have in a region (the last list covers later regions). */
export function tiersForRegion(content: Content, regionIndex: number): number[] {
  const lists = content.raids.tiersByRegion;
  return lists[Math.min(regionIndex, lists.length - 1)]!;
}

/** The highest raid tier a den can have: the open tiers, or one above the best tier won before (earlier runs or this one). */
export function highestOpenTier(content: Content, run: Partial<Pick<RunState, 'raids'>>): number {
  const raids = run.raids;
  if (!raids) return 6;
  return Math.min(6, Math.max(content.raids.openTiers, raids.unlockedTier + 1, raids.bestTier + 1));
}

/**
 * The den triggers that hold right now (spec 31 "Integration"): evil team operations, Legendary omens, the calendar,
 * regional progress and the player's own choices. Pure: reads the run, rolls nothing.
 */
export function activeDenTriggers(content: Content, run: Pick<RunState, 'story' | 'legendary' | 'calendar' | 'regionIndex'>): DenTrigger[] {
  const today = run.calendar?.today ? new Date(`${run.calendar.today}T12:00:00Z`) : null;
  const valid = today !== null && !Number.isNaN(today.getTime());
  return content.raids.denTriggers.filter((t) => {
    if (t.flag && Number(run.story.flags[`ev:${t.flag.key}`] ?? 0) < t.flag.min) return false;
    if (t.legendary && !(run.legendary?.offered.length)) return false;
    if (t.weekend && !(valid && [0, 6].includes(today!.getUTCDay()))) return false;
    if (t.months && !(valid && t.months.includes(today!.getUTCMonth() + 1))) return false;
    if (t.minRegion !== undefined && run.regionIndex < t.minRegion) return false;
    return true;
  });
}

/** The den chance the active triggers add (capped by raids.json maxTriggerBonus). */
export function triggerChanceBonus(content: Content, triggers: DenTrigger[]): number {
  return Math.min(content.raids.maxTriggerBonus, triggers.reduce((n, t) => n + t.chanceBonus, 0));
}

/** Which raid sits in a den: a seeded pick among the raids of the allowed tiers (stable for a given run, stage and den). */
export function pickRaidFor(content: Content, run: Pick<RunState, 'seed' | 'regionIndex'> & Partial<Pick<RunState, 'raids' | 'badges'>>, key: string, prefer?: RaidDef['kind']): RaidDef {
  const open = highestOpenTier(content, run);
  // Badges open the tiers one by one (spec 31): a tier needs its badge count as well as its region.
  const badges = run.badges?.length ?? Infinity;
  const regionOpen = tiersForRegion(content, run.regionIndex).filter((t) => t <= open);
  const region = regionOpen.filter((t) => tierOpenAtBadges(content.raids.badgeScaling, t, badges));
  // A region whose tiers are all still closed gets the highest open tier instead (the badge gate still applies when the region has open tiers).
  const usable = content.raids.raids.filter((r) => !r.grand && !r.gang && !r.legendary && !r.special && !r.canon && r.tier <= open && (regionOpen.length === 0 || tierOpenAtBadges(content.raids.badgeScaling, r.tier, badges)));
  const tiers = region.length > 0 ? region : [Math.max(1, ...usable.map((r) => r.tier))];
  const tiered = content.raids.raids.filter((r) => tiers.includes(r.tier) && !r.grand && !r.gang && !r.legendary && !r.special && !r.canon);
  // Spreadsheet availability: a den's boss must be unlocked at the level it would fight at (else the tier's dens stay as they were).
  const cap = levelCap(content, run.regionIndex);
  const end = Math.max(1, cap - content.balance.difficulty.capMargin);
  const unlocked = tiered.filter((r) => r.species.every((id) => isUnlockedAt(content, id, raidLevel(r, end, cap) + (Number.isFinite(badges) ? Math.min(cap - raidLevel(r, end, cap), badgeLevelBonus(content.raids.badgeScaling, r, badges)) : 0))));
  const base = unlocked.length > 0 ? unlocked : tiered;
  // A world trigger steers the den to the kind it calls for, when that kind exists among the allowed raids.
  const preferred = prefer ? base.filter((r) => r.kind === prefer) : [];
  const pool = preferred.length > 0 ? preferred : base;
  const rng = new Rng(hashSeed(`${run.seed}::raid-pick::${key}`));
  return rng.pick(pool.length > 0 ? pool : content.raids.raids.filter((r) => !r.gang && !r.legendary && !r.special && !r.canon));
}

/** Which species the boss is, from a seeded generator (so reloading never changes it). */
export function raidSpecies(def: RaidDef, run: Pick<RunState, 'seed'>, key: string): string {
  return new Rng(hashSeed(`${run.seed}::raid-species::${key}`)).pick(def.species);
}

/** Boss level: the top of the region's wild curve plus the raid's bonus, never above the region's level cap. */
export function raidLevel(def: RaidDef, scaleEnd: number, cap: number): number {
  return Math.max(2, Math.min(cap, Math.round(scaleEnd) + def.levelBonus));
}

export function freshRaidBattle(def: RaidDef, badges = 0): RaidBattle {
  return {
    id: def.id,
    badges,
    summonsUsed: 0,
    minionUid: null,
    bossUid: null,
    pendingShields: def.shield ? [...def.shield.at].sort((a, b) => b - a) : [],
    shieldHp: 0,
    shieldMax: 0,
    phasesDone: [],
    nextCharge: def.telegraph ? def.telegraph.everyTurns : null,
    charging: false,
    extraUsed: 0,
    timerLeft: def.timerTurns,
    notes: [],
    cheersLeft: 3,
    cheerOffense: 0,
    cheerDefense: 0,
    cheerLevel: 1,
    lead: null,
    breaker: null,
    tank: null,
    survivor: null,
    rivalHelped: false,
    rival: null,
    rivalFinished: false,
    returning: false,
    rewardPercent: 100,
    draftDelta: 0,
    practice: null,
    damageBy: {},
    healedBy: {},
    crowd: 0,
    roused: false,
    bot: null,
    gimmick: null,
    puzzleStep: 0,
    puzzleSolved: false,
    formIndex: 0,
    aim: null,
    featured: false,
    formNote: null,
    coop: null,
  };
}

/** The boss's extra max HP (a stat boost on the instance, so the HP bar and Dynamax maths just work). */
export function applyBossHp(def: RaidDef, boss: PokemonInstance): void {
  boss.statBoosts = { ...boss.statBoosts, hp: def.hpBoostPercent };
}

/**
 * The boss is about to lose `amount` HP. A shield soaks the damage first (overflow is lost); a threshold
 * that would be crossed stops the boss there and raises the next shield. Returns the damage that goes through.
 */
export function absorbHit(content: Content, battle: BattleState, boss: PokemonInstance, amount: number): number {
  const raid = battle.raid;
  if (!raid || amount <= 0) return amount;
  // A called minion has no shield: only the boss does.
  if (raid.minionUid !== null && boss.uid === raid.minionUid) return amount;
  const def = raidDef(content, raid);
  // S406 Titan Mode: a braced giant shrugs off most of every hit until it is toppled.
  const titan = def.modifiers.titan;
  if (titan && !titanToppled(battle, boss, titan)) {
    const cap = Math.max(1, Math.floor((maxHp(content, boss) * titan.hitCapPercent) / 100));
    if (amount > cap) {
      amount = cap;
      if (!raid.notes.some((n) => n.text === titan.text)) raid.notes.push({ tone: 'warn', text: titan.text });
    }
  }
  if (raid.shieldHp > 0) {
    raid.shieldHp = Math.max(0, raid.shieldHp - amount);
    if (raid.shieldHp === 0) {
      raid.charging = false;
      raid.notes.push({ tone: 'shield', text: 'The shield shattered!' });
    }
    return 0;
  }
  const next = raid.pendingShields[0];
  if (next !== undefined && def.shield) {
    const floorHp = Math.ceil(maxHp(content, boss) * next);
    if (boss.hp - amount < floorHp) {
      raid.pendingShields.shift();
      raid.shieldMax = Math.max(1, Math.ceil(maxHp(content, boss) * def.shield.points));
      raid.shieldHp = raid.shieldMax;
      raid.notes.push({ tone: 'shield', text: 'A shield surrounds the boss! Break it to keep going.' });
      return Math.max(0, boss.hp - floorHp);
    }
  }
  // S407 Gauntlet Bosses: a blow that would end the boss makes it rise in its next form instead.
  if (def.gauntlet && raid.formIndex < def.gauntlet.forms.length && amount >= boss.hp) {
    riseInNextForm(content, battle, boss, def);
    return 0;
  }
  return amount;
}

/** S406: the titan is toppled (its hit cap is off) while it is asleep, paralysed, frozen, or its Defense is down. */
export function titanToppled(battle: BattleState, boss: PokemonInstance, titan: NonNullable<RaidModifiers['titan']>): boolean {
  const status = boss.status?.id;
  if (status && (titan.openedBy as string[]).includes(status)) return true;
  return battle.enemyStages.def <= -titan.defDrop;
}

/** S407: the boss rises in its next form: new species and moves, full HP, a fresh set of shields and phases. */
function riseInNextForm(content: Content, battle: BattleState, boss: PokemonInstance, def: RaidDef): void {
  const raid = battle.raid!;
  const form = def.gauntlet!.forms[raid.formIndex]!;
  const from = boss.speciesId;
  if (!battle.transform.forms[boss.uid]) battle.transform.forms[boss.uid] = { kind: 'ability', from };
  const fresh = createPokemon(content, form.species, boss.level, boss.uid);
  boss.speciesId = form.species;
  boss.moves = fresh.moves;
  boss.abilitySlot = fresh.abilitySlot;
  boss.status = null;
  boss.hp = maxHp(content, boss);
  for (const k of Object.keys(battle.enemyStages) as (keyof typeof battle.enemyStages)[]) battle.enemyStages[k] = 0;
  raid.formIndex += 1;
  raid.phasesDone = [];
  raid.charging = false;
  raid.nextCharge = def.telegraph ? def.telegraph.everyTurns : null;
  raid.pendingShields = def.shield ? [...def.shield.at].sort((a, b) => b - a) : [];
  raid.shieldHp = 0;
  raid.formNote = { from, to: form.species, text: form.text };
}

/** The type the boss is weak to right now (rotating weakness), or null. Stateless: it follows the turn number. */
export function rotatingWeakness(content: Content, battle: BattleState, turn = battle.turn): { type: TypeName; boost: number } | null {
  const rot = battle.raid ? raidDef(content, battle.raid).modifiers.rotatingWeakness : undefined;
  if (!rot) return null;
  return { type: rot.types[Math.floor(turn / rot.everyTurns) % rot.types.length]!, boost: rot.boost };
}

/** S397: the zone of the boss that is exposed now ('body' takes physical hits harder, 'core' special), or null. Stateless: follows the turn number. */
export function exposedWeakSpot(content: Content, battle: BattleState, turn = battle.turn): { zone: 'body' | 'core'; boost: number } | null {
  const ws = battle.raid ? raidDef(content, battle.raid).modifiers.weakSpots : undefined;
  if (!ws) return null;
  return { zone: Math.floor(turn / ws.everyTurns) % 2 === 0 ? 'body' : 'core', boost: ws.boost };
}

/**
 * Damage multiplier from raid field rules and cheers for one hit: your Offense cheer and the rotating weakness
 * on your hits; the elemental surge and your Defense cheer on the boss's hits.
 */
export function raidFieldMultiplier(content: Content, battle: BattleState, attacker: 'player' | 'enemy', moveType: TypeName, physical?: boolean): number {
  const raid = battle.raid;
  if (!raid) return 1;
  const mods = raidDef(content, raid).modifiers;
  let m = 1;
  if (attacker === 'player') {
    if (raid.cheerOffense > 0) m *= OFFENSE_CHEER[raid.cheerLevel - 1]!;
    const weak = rotatingWeakness(content, battle);
    if (weak && weak.type === moveType) m *= weak.boost;
    const spot = physical === undefined ? null : exposedWeakSpot(content, battle);
    // S397: with a target picked you hit the exposed zone whatever the move; without one the move's kind decides.
    if (spot && (raid.aim ? raid.aim === spot.zone : (spot.zone === 'body') === physical)) m *= spot.boost;
    // S411: the defence holds until the pattern is solved.
    if (mods.puzzle && !raid.puzzleSolved) m *= mods.puzzle.guard;
  } else {
    const bot = raidBot(content, raid);
    if (bot?.kind === 'guard') m *= 1 - bot.power;
    if (mods.surge && mods.surge.type === moveType) m *= mods.surge.boost;
    m *= 1 + enrageStacks(content, battle) * enrageStep(content, battle);
    if (raid.cheerDefense > 0) m *= DEFENSE_CHEER[raid.cheerLevel - 1]!;
  }
  return m;
}

/** S396: how many enrage steps the boss has reached (stateless: follows the turn number). */
export function enrageStacks(content: Content, battle: BattleState, turn = battle.turn): number {
  const e = battle.raid ? raidDef(content, battle.raid).enrage : null;
  if (!e || turn < e.afterTurn) return 0;
  return Math.min(e.maxStacks, Math.floor((turn - e.afterTurn) / e.everyTurns) + 1);
}
const enrageStep = (content: Content, battle: BattleState): number => (battle.raid ? (raidDef(content, battle.raid).enrage?.boostPercent ?? 0) / 100 : 0);

export type RaidRole = 'striker' | 'tank' | 'support';

/** S391: a Pokémon's raid role from its base stats. Tank when its bulk (HP, Def, Sp. Def) tops its attack, Striker when it hits clearly harder than it is bulky, else Support. */
export function raidRole(content: Content, mon: PokemonInstance): RaidRole {
  const s = content.species.get(mon.speciesId)?.baseStats;
  if (!s) return 'support';
  const off = Math.max(s.atk, s.spa);
  const bulk = (s.hp + s.def + s.spd) / 3;
  if (bulk >= off + 5) return 'tank';
  return off > bulk + 15 ? 'striker' : 'support';
}

/** Role bonus for one hit in a raid: your Strikers hit harder, your Tanks take less. */
export function raidRoleMultiplier(content: Content, battle: BattleState, user: { side: 'player' | 'enemy'; mon: PokemonInstance }, target: { side: 'player' | 'enemy'; mon: PokemonInstance }): number {
  if (!battle.raid) return 1;
  const r = content.raids.roles;
  if (user.side === 'player' && raidRole(content, user.mon) === 'striker') return r.strikerDamage;
  if (target.side === 'player' && raidRole(content, target.mon) === 'tank') return r.tankDamageTaken;
  return 1;
}

/** HP a Support Pokémon on the field restores at the end of a turn (0 when it isn't one, or the raid restricts healing). */
export function supportHeal(content: Content, battle: BattleState, mon: PokemonInstance): number {
  if (!battle.raid || mon.hp <= 0 || raidRole(content, mon) !== 'support' || raidDef(content, battle.raid).modifiers.noHealing) return 0;
  return Math.max(1, Math.floor(maxHp(content, mon) * content.raids.roles.supportHeal));
}

/** Cheer strengths (Raid Battles pack: Offense, Defense, Healing). */
export const OFFENSE_CHEER = [1.3, 1.45, 1.6];
export const DEFENSE_CHEER = [0.7, 0.6, 0.5];
export const HEALING_CHEER = [0.3, 0.45, 0.6];
/** Cheer level from the raids won so far: 0 wins = 1, 1 to 2 = 2, 3 or more = 3. */
export const cheerLevelFor = (raidsWon: number): number => (raidsWon >= 3 ? 3 : raidsWon >= 1 ? 2 : 1);
export const CHEER_TURNS = 3;
export type Cheer = 'offense' | 'defense' | 'healing' | 'counter';

/** Why a cheer can't be used now, or null. */
export function cheerProblem(content: Content, battle: BattleState, cheer: Cheer, activeUid?: string): string | null {
  const raid = battle.raid;
  if (!raid) return 'Only raid fights have cheers.';
  if (raid.cheersLeft <= 0) return 'No cheers left.';
  if (raid.coop && activeUid !== undefined && raid.coop.cheers[coopOwner(raid, activeUid)]! <= 0) return `Player ${coopOwner(raid, activeUid) + 1} has no cheers left.`;
  if (cheer === 'healing' && raidDef(content, raid).modifiers.noHealing) return 'Healing is restricted in this raid.';
  return null;
}

/** Why a healing item can't be used in this raid, or null. */
export function raidItemProblem(content: Content, battle: BattleState, isHealing: boolean): string | null {
  const raid = battle.raid;
  return raid && isHealing && raidDef(content, raid).modifiers.noHealing ? 'Healing is restricted in this raid.' : null;
}

/** A charged (telegraphed) attack hits harder; returns the damage after the boost. */
export function chargedDamage(content: Content, battle: BattleState, amount: number): number {
  const raid = battle.raid;
  if (!raid || !raid.charging) return amount;
  const tele = raidDef(content, raid).telegraph;
  // Counterplay: a boss under sleep, paralysis or freeze loses its charge.
  const boss = battle.enemyTeam[battle.enemyIndex];
  const status = boss?.status?.id;
  if (tele && status && (tele.interruptedBy as string[]).includes(status)) {
    raid.charging = false;
    raid.nextCharge = tele.everyTurns;
    raid.notes.push({ tone: 'info', text: 'The charged attack was interrupted!' });
    return amount;
  }
  return Math.floor(amount * (tele?.boost ?? 1));
}

export type RaidAction =
  | { kind: 'note'; tone: 'shield' | 'phase' | 'warn' | 'info'; text: string }
  | { kind: 'phase'; phase: RaidPhase }
  | { kind: 'timeout' };

/** End of turn: flushes notes, starts phases, counts down the telegraph and the timer. */
export function advanceRaid(content: Content, battle: BattleState, boss: PokemonInstance): RaidAction[] {
  const raid = battle.raid;
  if (!raid) return [];
  const def = raidDef(content, raid);
  const actions: RaidAction[] = raid.notes.map((n) => ({ kind: 'note', tone: n.tone, text: n.text }));
  raid.notes = [];
  if (raid.cheerOffense > 0) raid.cheerOffense -= 1;
  if (raid.cheerDefense > 0) raid.cheerDefense -= 1;
  const onMinion = raid.minionUid !== null && boss.uid === raid.minionUid;
  if (onMinion) {
    // Only the timer runs while a minion is in front: the boss's phases and charge wait for it to return.
    if (raid.timerLeft !== null) {
      raid.timerLeft -= 1;
      if (raid.timerLeft <= 0) actions.push({ kind: 'timeout' });
    }
    return actions;
  }
  if (boss.hp <= 0) return actions;
  const rot = def.modifiers.rotatingWeakness;
  if (rot) {
    const next = rotatingWeakness(content, battle, battle.turn + 1)!;
    if (next.type !== rotatingWeakness(content, battle)!.type) actions.push({ kind: 'note', tone: 'info', text: `The boss is now weak to ${next.type}-type moves!` });
  }
  if (def.modifiers.weakSpots) {
    const next = exposedWeakSpot(content, battle, battle.turn + 1)!;
    if (next.zone !== exposedWeakSpot(content, battle)!.zone) actions.push({ kind: 'note', tone: 'info', text: next.zone === 'body' ? "The boss's body is exposed! Physical moves hit harder." : "The boss's core is exposed! Special moves hit harder." });
  }
  const share = boss.hp / maxHp(content, boss);
  def.phases.forEach((phase, i) => {
    if (raid.phasesDone.includes(i) || share > phase.atHp) return;
    raid.phasesDone.push(i);
    if (phase.shield) {
      raid.shieldMax = Math.max(1, Math.ceil(maxHp(content, boss) * phase.shield));
      raid.shieldHp = raid.shieldMax;
      raid.charging = false;
      actions.push({ kind: 'note', tone: 'shield', text: 'The phase change raises a new shield! Break it to keep going.' });
    }
    actions.push({ kind: 'phase', phase });
  });
  if (def.telegraph) {
    if (raid.charging) {
      raid.charging = false;
      raid.nextCharge = def.telegraph.everyTurns;
    } else if (raid.nextCharge !== null) {
      raid.nextCharge -= 1;
      if (raid.nextCharge <= 0) {
        raid.charging = true;
        raid.nextCharge = null;
        actions.push({ kind: 'note', tone: 'warn', text: def.telegraph.text });
      }
    }
  }
  if (def.enrage && enrageStacks(content, battle, battle.turn + 1) > enrageStacks(content, battle)) {
    actions.push({ kind: 'note', tone: 'warn', text: 'The boss grows enraged! Its attacks hit harder.' });
  }
  if (raid.timerLeft !== null) {
    raid.timerLeft -= 1;
    if (raid.timerLeft <= 0) actions.push({ kind: 'timeout' });
    else if (raid.timerLeft === 10 || raid.timerLeft === 5) actions.push({ kind: 'note', tone: 'warn', text: `${raid.timerLeft} turns left!` });
  }
  return actions;
}

/** True (and counted) when the boss may take a bonus attack now: under the HP line, within its limit. */
export function takeExtraAction(content: Content, battle: BattleState, boss: PokemonInstance): boolean {
  const raid = battle.raid;
  if (!raid || boss.hp <= 0 || (raid.minionUid !== null && boss.uid === raid.minionUid)) return false;
  const extra = raidDef(content, raid).extraActions;
  if (!extra || raid.extraUsed >= extra.max || boss.hp / maxHp(content, boss) > extra.belowHp) return false;
  raid.extraUsed += 1;
  return true;
}

/** A reinforcement the boss calls now (checked at the start of a turn, while the boss itself is in front): the minion's species and level. */
export function reinforcementDue(content: Content, battle: BattleState): { speciesId: string; level: number; uid: string; text: string } | null {
  const raid = battle.raid;
  const boss = raid?.bossUid ? battle.enemyTeam.find((e) => e.uid === raid.bossUid) : undefined;
  if (!raid || !boss || boss.hp <= 0 || battle.enemyTeam[battle.enemyIndex]?.uid !== boss.uid) return null;
  const lines = raidDef(content, raid).summons;
  const line = lines[raid.summonsUsed];
  if (line === undefined || boss.hp / maxHp(content, boss) > line) return null;
  const type = content.species.get(boss.speciesId)?.types[0];
  const speciesId = type ? content.raids.badgeScaling.minionByType[type] : undefined;
  if (!speciesId || !content.species.has(speciesId)) return null;
  return {
    speciesId,
    level: Math.max(2, boss.level + content.raids.badgeScaling.minionLevelOffset),
    uid: `${boss.uid}-minion${raid.summonsUsed + 1}`,
    text: `The boss calls for help: ${content.species.get(speciesId)!.name} joins the fight!`,
  };
}

/** What the player sees about a raid before and during the fight. */
export interface RaidPreview {
  id: string;
  name: string;
  tier: number;
  blurb: string;
  speciesId: string;
  level: number;
  entryCost: number;
  mechanics: string[];
  rewards: string[];
  kind: RaidDef['kind'];
  returning: boolean;
  /** True for story raids (Grand-Enemy, gang, Legendary), which have no practice fight. */
  noPractice: boolean;
  approaches: { id: string; label: string; text: string; cost: number; leave: boolean }[];
  /** S405: the sky over this den (null = the raid's own weather or none). S394: this is the raid of the week. S398: the prize list by likelihood. */
  denWeather: string | null;
  featured: boolean;
  loot: { tier: string; items: string[] }[];
  /** S409: a ball works below this share of the boss's HP. */
  capture: number | null;
  /** S401, S402, S393: what you can prepare before going in (none for story raids and in practice). */
  cards: { id: string; label: string; text: string }[];
  talk: RaidTalk | null;
  bots: { id: string; label: string; text: string; cost: number }[];
}

export function describeMechanics(def: RaidDef, scale?: { content: Content; badges: number }): string[] {
  const out = scale ? [`${raidTierName(scale.content.raids.badgeScaling, def)} raid, scaled for ${scale.badges} badge${scale.badges === 1 ? '' : 's'}`] : [];
  out.push(`HP pool ×${(1 + def.hpBoostPercent / 100).toFixed(1)}`);
  if (def.shield) out.push(`${def.shield.at.length} shield${def.shield.at.length > 1 ? 's' : ''}`);
  if (def.phases.length > 0) out.push(`${def.phases.length} phase${def.phases.length > 1 ? 's' : ''}`);
  if (def.telegraph) out.push(`charged attack (${def.telegraph.interruptedBy.map((s) => ({ slp: "sleep", par: "paralysis", frz: "freeze" })[s]).join(', ')} interrupts it)`);
  if (def.extraActions) out.push('bonus attacks');
  if (def.timerTurns) out.push(`${def.timerTurns}-turn timer`);
  out.push('roles: Striker hits harder, Tank takes less, Support heals');
  if (def.enrage) out.push(`enrages after turn ${def.enrage.afterTurn}`);
  if (def.phases.some((p) => p.shield)) out.push('phase shields');
  if (def.weather) out.push(`${def.weather} field`);
  const m = def.modifiers;
  if (m.terrain) out.push(`${m.terrain} terrain`);
  if (m.surge) out.push(`${m.surge.type} surge`);
  if (m.noHealing) out.push('no healing');
  if (m.rotatingWeakness) out.push('rotating weakness');
  if (m.weakSpots) out.push('weak spots (body / core: pick where to aim)');
  if (m.hazard) out.push(`arena hazard: ${m.hazard.text}${m.hazard.immune.length > 0 ? ` (${m.hazard.immune.join(', ')} types are safe)` : ''}`);
  if (m.titan) out.push(`titan: hits are capped at ${m.titan.hitCapPercent}% of its HP until it is toppled (${m.titan.openedBy.map((x) => ({ slp: 'sleep', par: 'paralysis', frz: 'freeze' })[x]).join(', ')}, or Defense -${m.titan.defDrop})`);
  if (m.puzzle) out.push(`puzzle: hit it with ${m.puzzle.steps} types in the right order to break its defence`);
  if (def.gauntlet) out.push(`gauntlet: ${def.gauntlet.forms.length + 1} forms in a row`);
  if (def.capture) out.push(`can be caught below ${Math.round(def.capture * 100)}% HP`);
  if (def.extraMoves.length > 0) out.push(`${4 + def.extraMoves.length} moves`);
  if (def.summons.length > 0) out.push(`${def.summons.length} reinforcement${def.summons.length > 1 ? 's' : ''}`);
  return out;
}

export function describeRewards(def: RaidDef): string[] {
  const out = [`₽${def.rewards.moneyPerLevel} × level`];
  for (const g of lootTiers(def)) out.push(`${g.tier}: ${g.items.join(', ')}`);
  if (def.rewards.draftExtra > 0) out.push(`+${def.rewards.draftExtra} draft choice${def.rewards.draftExtra > 1 ? 's' : ''}`);
  if (def.rewards.joinChance > 0) out.push(`${Math.round(def.rewards.joinChance * 100)}% the boss joins you`);
  if (def.rewards.megaStones > 0) out.push(`up to ${def.rewards.megaStones} Mega Stone${def.rewards.megaStones > 1 ? 's' : ''} for your team`);
  if (def.rewards.rareEncounters > 0) out.push(`${def.rewards.rareEncounters} rare-encounter token${def.rewards.rareEncounters > 1 ? 's' : ''}`);
  return out;
}

/**
 * When a stage starts: maybe one raid den, beside a node picked by a generator of its own (the stage map
 * and every other stream stay unchanged). Not in the Pokémon League, not at the gym column. Mutates `run`.
 */
export function placeRaidDens(content: Content, run: RunState): void {
  placeOrdinaryDens(content, run);
  placeExtraDens(content, run);
}

function placeOrdinaryDens(content: Content, run: RunState): void {
  const stage = run.stage;
  if (!stage || stage.kind !== 'stage') return;
  const rng = new Rng(hashSeed(`${run.seed}::raid-den::${run.regionIndex}:${stage.index}`));
  placeGrandEnemy(content, run, rng);
  if (placeReturning(content, run, rng)) return;
  const triggers = activeDenTriggers(content, run);
  if (!rng.chance(content.raids.denChance + focusDenBonus(run, 'raids') + triggerChanceBonus(content, triggers))) return;
  const candidates = stage.map.nodes.filter((n) => n.column < stage.map.columns && !n.sides.some((s) => s.kind === 'raid'));
  if (candidates.length === 0) return;
  const node = rng.pick(candidates);
  const prefer = triggers.find((t) => t.prefer)?.prefer;
  const def = pickRaidFor(content, run, `${run.regionIndex}:${stage.index}`, prefer);
  node.sides.push({ id: `raid-${stage.index}`, kind: 'raid', raidId: def.id, used: false, ...(triggers.length > 0 ? { triggers: triggers.map((t) => t.id) } : {}) });
}

/** The Grand-Enemy's fight for this stage, if the campaign calls for one: a den beside a node of its own pick. */
function placeGrandEnemy(content: Content, run: RunState, rng: Rng): void {
  const stage = run.stage!;
  const kind = grandRaidFor(content, run);
  if (!kind) return;
  const def = content.raids.raids.find((r) => r.grand === kind);
  if (!def) return;
  const candidates = stage.map.nodes.filter((n) => n.column < stage.map.columns && !n.sides.some((s) => s.kind === 'raid'));
  if (candidates.length === 0) return;
  const node = rng.pick(candidates);
  node.sides.push({ id: `raid-grand-${stage.index}`, kind: 'raid', raidId: def.id, used: false });
}

/** A Pokémon-specific raid memory earned by what it did (Overdrive §3 "Raid memories"). */
export interface RaidMemory {
  uid: string;
  key: 'lead' | 'breaker' | 'tank' | 'finisher' | 'survivor' | 'striker' | 'medic';
  title: string;
  text: (name: string, boss: string) => string;
}

/**
 * The memories a won raid hands out: contribution, not only the last hit. A Pokémon can earn more than one;
 * the same Pokémon is not listed twice for the same memory.
 */
export function raidMemories(battle: BattleState, finisherUid: string | undefined): RaidMemory[] {
  const raid = battle.raid;
  if (!raid) return [];
  const out: RaidMemory[] = [];
  if (raid.lead) out.push({ uid: raid.lead, key: 'lead', title: 'First to Face the Beast', text: (n, b) => `${n} was first to face ${b}.` });
  if (raid.breaker) out.push({ uid: raid.breaker, key: 'breaker', title: 'The One Who Broke Its Guard', text: (n, b) => `${n} broke ${b}'s guard.` });
  if (raid.tank) out.push({ uid: raid.tank, key: 'tank', title: 'It Took the Hit for Everyone', text: (n, b) => `${n} took ${b}'s charged attack for the whole team.` });
  if (raid.survivor) out.push({ uid: raid.survivor, key: 'survivor', title: 'The One That Survived', text: (n, b) => `${n} survived ${b}'s signature attack.` });
  // S404 medals: the most damage dealt, and the most HP mended by a Support.
  const top = (rec: Record<string, number>): string | null => Object.entries(rec).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const striker = top(raid.damageBy);
  if (striker) out.push({ uid: striker, key: 'striker', title: 'Hit the Hardest', text: (n, b) => `${n} dealt the most damage to ${b}.` });
  const medic = top(raid.healedBy);
  if (medic) out.push({ uid: medic, key: 'medic', title: 'Kept the Team Going', text: (n) => `${n} mended the team through the whole fight.` });
  if (finisherUid) out.push({ uid: finisherUid, key: 'finisher', title: 'The Final Blow Belonged to...', text: (n, b) => `${n} landed the final blow on ${b}.` });
  return out;
}

/** Friendship each distinct contributor gets for a won raid (a share of it per memory, so contribution counts). */
export const RAID_MEMORY_FRIENDSHIP = 4;

/** A boss that escaped earlier comes back as a den in this stage (one per stage, stronger); returns true when it did. */
function placeReturning(content: Content, run: RunState, rng: Rng): boolean {
  const stage = run.stage!;
  const raidId = run.raids.escaped[0];
  if (!raidId || !content.raids.raids.some((r) => r.id === raidId)) {
    run.raids.escaped.shift();
    return false;
  }
  const candidates = stage.map.nodes.filter((n) => n.column < stage.map.columns && !n.sides.some((s) => s.kind === 'raid'));
  if (candidates.length === 0) return false;
  run.raids.escaped.shift();
  rng.pick(candidates).sides.push({ id: `raid-return-${stage.index}`, kind: 'raid', raidId, used: false, returning: true });
  return true;
}

/** The approach a player picked at a den: the one named, else the first (so older callers and bots still work). */
export function pickApproach(def: RaidDef, approachId: string | undefined): RaidApproach | null {
  if (def.approaches.length === 0) return null;
  const found = approachId ? def.approaches.find((a) => a.id === approachId) : def.approaches.find((a) => !a.leave);
  if (!found) throw new Error(`Unknown approach "${approachId}"`);
  return found;
}

/** Stat and reward changes of a returning boss ("the one that got away", back and changed). */
export const RETURNING_LEVEL_BONUS = 3;
export const RETURNING_HP_PERCENT = 50;

// ---------- S393 bots, S403 crowd, S411 puzzle, S412 hazard ----------

/** The lobby bot beside you, or null. */
export function raidBot(content: Content, raid: Pick<RaidBattle, 'bot'>): RaidBot | null {
  return raid.bot ? content.raids.bots.find((b) => b.id === raid.bot) ?? null : null;
}

/** S393: the HP a striker bot takes off the boss this turn (never the last HP), 0 for other bots. */
export function botStrike(content: Content, battle: BattleState, boss: PokemonInstance): number {
  const bot = battle.raid ? raidBot(content, battle.raid) : null;
  if (!bot || bot.kind !== 'striker' || boss.hp <= 1) return 0;
  return Math.min(boss.hp - 1, absorbHit(content, battle, boss, Math.max(1, Math.floor(maxHp(content, boss) * bot.power))));
}

/** S393: the HP a medic bot mends on your lead this turn (0 when it isn't a medic, or the raid restricts healing). */
export function botMend(content: Content, battle: BattleState, mon: PokemonInstance): number {
  const bot = battle.raid ? raidBot(content, battle.raid) : null;
  if (!bot || bot.kind !== 'medic' || mon.hp <= 0 || raidDef(content, battle.raid!).modifiers.noHealing) return 0;
  return Math.min(maxHp(content, mon) - mon.hp, Math.max(1, Math.floor(maxHp(content, mon) * bot.power)));
}

/** S403: the crowd meter after a turn. Returns what the crowd does now: 'roused' (your lead is pumped up), 'roar' (it mends your lead and the meter starts over) or null. */
export function crowdStep(content: Content, battle: BattleState): 'roused' | 'roar' | null {
  const raid = battle.raid;
  if (!raid) return null;
  const c = content.raids.crowd;
  raid.crowd = Math.min(100, raid.crowd + c.perTurn + (raid.coop ? content.raids.coop.crowdBonus : 0));
  if (raid.crowd >= 100) {
    raid.crowd = 0;
    raid.roused = false;
    return 'roar';
  }
  if (raid.crowd >= c.roused && !raid.roused) {
    raid.roused = true;
    return 'roused';
  }
  return null;
}

/** S411: the pattern of types for this fight (the same every time for one boss: it comes from the boss's uid). */
export function puzzlePattern(content: Content, battle: BattleState): TypeName[] {
  const raid = battle.raid;
  const puzzle = raid ? raidDef(content, raid).modifiers.puzzle : undefined;
  if (!raid || !puzzle) return [];
  const rng = new Rng(hashSeed(`${raid.id}::puzzle::${raid.bossUid ?? ''}`));
  const pool = [...puzzle.pool];
  const out: TypeName[] = [];
  while (out.length < puzzle.steps && pool.length > 0) out.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]!);
  return out;
}

/** The damaging moves your side landed on the boss this turn, in order (from the turn's events). Used by the puzzle. */
export function playerHits(content: Content, events: readonly BattleEvent[]): { moveId: string; type: TypeName; physical: boolean }[] {
  const out: { moveId: string; type: TypeName; physical: boolean }[] = [];
  let current: string | null = null;
  for (const e of events) {
    if (e.type === 'move') current = e.side === 'player' ? e.moveId : null;
    else if (e.type === 'damage' && e.side === 'enemy' && current) {
      const mv = content.moves.get(current);
      if (mv) out.push({ moveId: current, type: mv.type, physical: mv.category === 'physical' });
      current = null;
    }
  }
  return out;
}

/** S411: feeds this turn's hits into the puzzle. Returns the notes to show; the defence breaks when the whole pattern is hit in order. */
export function puzzleProgress(content: Content, battle: BattleState, hits: readonly { type: TypeName }[]): string[] {
  const raid = battle.raid;
  const puzzle = raid ? raidDef(content, raid).modifiers.puzzle : undefined;
  if (!raid || !puzzle || raid.puzzleSolved) return [];
  const pattern = puzzlePattern(content, battle);
  const notes: string[] = [];
  for (const h of hits) {
    if (h.type === pattern[raid.puzzleStep]) raid.puzzleStep += 1;
    else if (raid.puzzleStep > 0) {
      notes.push(`The pattern slipped! It reacted to a ${pattern[raid.puzzleStep]}-type hit next. Start again.`);
      raid.puzzleStep = h.type === pattern[0] ? 1 : 0;
    }
    if (raid.puzzleStep >= pattern.length) {
      raid.puzzleSolved = true;
      notes.push('The pattern is solved! The boss\'s defence breaks open.');
      break;
    }
  }
  return notes;
}

/** S412: what the boss's arena takes from your Pokémon in front this turn (never to 0 HP), or 0 when it is immune or there is no hazard. */
export function hazardDamage(content: Content, battle: BattleState, mon: PokemonInstance, types: readonly TypeName[]): number {
  const hz = battle.raid ? raidDef(content, battle.raid).modifiers.hazard : undefined;
  if (!hz || mon.hp <= 1 || types.some((t) => hz.immune.includes(t))) return 0;
  return Math.min(mon.hp - 1, Math.max(1, Math.floor(maxHp(content, mon) * hz.percent)));
}

// ---------- S398 loot, S405 den weather, S394 weekly, special dens ----------

/** S398 Boss Loot Tables Preview: the prize list, grouped by how likely each drop is. */
export function lootTiers(def: RaidDef): { tier: 'Common' | 'Uncommon' | 'Rare'; items: string[] }[] {
  const groups: Record<'Common' | 'Uncommon' | 'Rare', string[]> = { Common: [], Uncommon: [], Rare: [] };
  for (const i of def.rewards.items) groups[i.chance >= 0.75 ? 'Common' : i.chance >= 0.4 ? 'Uncommon' : 'Rare'].push(`${i.item.replace(/-/g, ' ')} (${Math.round(i.chance * 100)}%)`);
  return (['Common', 'Uncommon', 'Rare'] as const).filter((t) => groups[t].length > 0).map((tier) => ({ tier, items: groups[tier] }));
}

/** S405 Raid Dens Map: the weather over a den that has none of its own. It rotates with the region and stage, so the same stage always has the same sky. */
export function denWeather(content: Content, run: Pick<RunState, 'regionIndex' | 'stage'>, def: RaidDef): Weather | null {
  const list = content.raids.denWeathers;
  if (def.weather || list.length === 0 || def.grand || def.gang || def.legendary || def.modifiers.terrain) return null;
  return list[(run.regionIndex * 2 + (run.stage?.index ?? 0)) % list.length]!;
}

/** S394 Raid Weekly Rotation: the featured raid of the week (a plain den raid). The week comes from the run's calendar day, else it moves on with each region. */
export function weeklyRaidId(content: Content, run: Pick<RunState, 'calendar' | 'seed' | 'regionIndex'>): string | null {
  const pool = content.raids.raids.filter((r) => !r.grand && !r.gang && !r.legendary && !r.special && !r.canon && r.kind === 'wild');
  if (pool.length === 0) return null;
  const today = run.calendar?.today ? Date.parse(`${run.calendar.today}T12:00:00Z`) : Number.NaN;
  const week = Number.isNaN(today) ? run.regionIndex + new Rng(hashSeed(run.seed)).int(0, 96) : Math.floor(today / 86_400_000 / 7);
  return pool[week % pool.length]!.id;
}

/** The tiers that can have a den right now (region and badges), for the extra dens below. */
function openTiersNow(content: Content, run: Pick<RunState, 'regionIndex' | 'badges' | 'raids'>): number[] {
  const open = highestOpenTier(content, run);
  const badges = run.badges?.length ?? Infinity;
  return tiersForRegion(content, run.regionIndex).filter((t) => t <= open && tierOpenAtBadges(content.raids.badgeScaling, t, badges));
}

/**
 * Extra dens a stage may hold besides the ordinary one, from a generator of their own (so no other roll changes):
 * a den for the featured raid of the week (S394), and one special den (S399 mini-boss, S406 titan, S407 gauntlet).
 */
function placeExtraDens(content: Content, run: RunState): void {
  const stage = run.stage;
  if (!stage || stage.kind !== 'stage') return;
  const weekly = weeklyRaidId(content, run);
  for (const node of stage.map.nodes) for (const side of node.sides) if (side.kind === 'raid' && side.raidId === weekly) side.featured = true;
  const rng = new Rng(hashSeed(`${run.seed}::raid-extra::${run.regionIndex}:${stage.index}`));
  const tiers = openTiersNow(content, run);
  const free = () => stage.map.nodes.filter((n) => n.column < stage.map.columns && !n.sides.some((s) => s.kind === 'raid'));
  const weekly1 = weekly ? content.raids.raids.find((r) => r.id === weekly) : undefined;
  if (weekly1 && tiers.includes(weekly1.tier) && !stage.map.nodes.some((n) => n.sides.some((s) => s.kind === 'raid' && s.raidId === weekly)) && rng.chance(content.raids.weekly.extraDenChance)) {
    const candidates = free();
    if (candidates.length > 0) rng.pick(candidates).sides.push({ id: `raid-week-${stage.index}`, kind: 'raid', raidId: weekly1.id, used: false, featured: true });
  }
  const specials = content.raids.raids.filter((r) => r.special && tiers.includes(r.tier));
  if (specials.length > 0 && rng.chance(content.raids.specialDenChance)) {
    const def = rng.pick(specials);
    // A mini-boss waits in the middle of the map; the giants and gauntlets can be anywhere before the gym.
    const mid = (n: { column: number }) => n.column >= Math.ceil(stage.map.columns / 3) && n.column <= Math.floor((stage.map.columns * 2) / 3);
    const candidates = free().filter((n) => def.special !== 'mini' || mid(n));
    if (candidates.length > 0) rng.pick(candidates).sides.push({ id: `raid-special-${stage.index}`, kind: 'raid', raidId: def.id, used: false });
  }
}

/** S402: follows a path of talk choice ids ("greet>offer") and returns the lines said and the effects, or null when the path is not in the tree. */
export function talkOutcome(talk: RaidTalk, path: readonly string[]): { replies: string[]; boss: Record<string, number>; player: Record<string, number>; hpPercent: number; label: string } | null {
  let level = talk.choices;
  const out = { replies: [] as string[], boss: {} as Record<string, number>, player: {} as Record<string, number>, hpPercent: 0, label: '' };
  for (const id of path) {
    const choice = level.find((c) => c.id === id);
    if (!choice) return null;
    out.replies.push(choice.reply);
    out.label = choice.label;
    for (const [k, v] of Object.entries(choice.boss ?? {})) out.boss[k] = (out.boss[k] ?? 0) + (v ?? 0);
    for (const [k, v] of Object.entries(choice.player ?? {})) out.player[k] = (out.player[k] ?? 0) + (v ?? 0);
    out.hpPercent += choice.hpPercent ?? 0;
    level = choice.next ?? [];
  }
  return out;
}

// ---------- S410 Team Co-op Raids ----------

/** Which player (0 or 1) plays this Pokémon in a co-op raid (0 when the raid is single-player). */
export function coopOwner(raid: Pick<RaidBattle, 'coop'>, uid: string): 0 | 1 {
  return (raid.coop?.owners[uid] ?? 0) as 0 | 1;
}

/** Splits the party between two players by slot (1st, 3rd, 5th and 2nd, 4th, 6th). */
export function coopSplit(party: readonly { uid: string }[]): Record<string, 0 | 1> {
  return Object.fromEntries(party.map((m, i) => [m.uid, (i % 2) as 0 | 1]));
}

/** Damage each player's Pokémon dealt to the boss, from the raid's record. */
export function coopDamage(raid: Pick<RaidBattle, 'coop' | 'damageBy'>): [number, number] {
  const out: [number, number] = [0, 0];
  for (const [uid, n] of Object.entries(raid.damageBy)) out[coopOwner(raid, uid)] += n;
  return out;
}

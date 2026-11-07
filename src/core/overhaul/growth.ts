// Overhaul slice 25 (growth paths, first cut): a Pokémon that has proved itself over the run settles into a
// growth path, a small permanent damage edge. The pack lists 106 paths with free-text rules; this first cut plays
// the ones the game can measure from what it already counts per Pokémon (knockouts, close calls) and the types:
//   last-stand  >= 2 close calls            +5% damage while under a quarter HP
//   striker     most KOs in the party (>=8)  +5% damage on super-effective hits
//   <type> path a Pokémon of that type with >= 8 KOs: +5% damage with moves of its own type (first pack path of the type)
// A Pokémon holds one path (`growthPath` on the instance, optional so no save bump). The other pack paths stay
// unplayed. No RNG, no cross-run memory. Switch and numbers: balance.overhaulGrowth.

import { overhaulCatalogs } from './catalogs';
import type { PokemonInstance } from '../state';
import type { Content } from '../contentSchema';

export interface GrowthConfig { enabled: boolean; bonus: number; minKos: number; minCloseCalls: number; minRoleKos: number }
export const DEFAULT_GROWTH_CONFIG: GrowthConfig = { enabled: true, bonus: 0.05, minKos: 8, minCloseCalls: 2, minRoleKos: 4 };

interface History { uid: string; moves?: Record<string, number>; knockoutsDealt: number; closeCalls: number; battles?: number; evolutions?: readonly unknown[]; bond?: { trust?: number; affection?: number } | undefined; growth?: Record<string, number> | undefined }

/** Counter-based paths: pack id, the counter it reads, and the plain-words bonus. All give +bonus damage in the stated case. */
export const COUNTER_PATHS: Record<string, { counter: string; words: string; min?: number; cap?: number; type?: string }> = {
  'rival-breaker': { counter: 'koRival', words: 'damage against rival Pokémon' },
  'gym-slayer': { counter: 'koGym', words: 'damage against Gym Leader Pokémon' },
  'elite-slayer': { counter: 'koElite', words: 'damage against Elite Four Pokémon' },
  'champion-slayer': { counter: 'koChampion', words: 'damage against Champion Pokémon' },
  loner: { counter: 'koSolo', words: 'damage when it is the last one standing' },
  'deep-swimmer': { counter: 'koWaterVsFRG', words: 'Water damage against Fire, Rock and Ground foes' },
  'forge-born': { counter: 'koSteelVsIRF', words: 'Steel damage against Ice, Rock and Fairy foes' },
  // Batch 3: counted from the moves it uses and the hits it lands.
  steady: { counter: 'useSure', words: 'damage with 100%-accuracy moves', min: 30, cap: 0.03 },
  gambler: { counter: 'useRisky', words: 'accuracy with moves of 80% accuracy or less', min: 8 },
  'chorus-lead': { counter: 'useSound', words: 'damage with sound moves', min: 10, cap: 0.03 },
  support: { counter: 'useStatus', words: 'accuracy with status moves', min: 15 },
  'tank-buster': { counter: 'hitHigh', words: 'damage against foes above 75% HP', min: 12 },
  'bond-breaker': { counter: 'koFull', words: 'damage against foes at full HP' },
  closer: { counter: 'koLast', words: 'damage while it is the last Pokémon in the party order still standing', min: 4 },
  'shield-sibling': { counter: 'koPair', words: 'damage while its best friend is still standing (3% at most)', min: 4, cap: 0.03 },
  'fossil-memory': { counter: 'surviveOne', words: 'less weather chip damage (hail, or sandstorm if it ever bites it)', min: 2, type: 'rock' },
  burrower: { counter: 'underground', words: 'lower chance of being stopped by paralysis or confusion in the middle of a two-turn move', min: 4, type: 'ground' },
  scout: { counter: 'scoutFirst', words: 'accuracy on its first move against a foe that has just appeared', min: 5, cap: 0.03 },
  pivot: { counter: 'pivotOut', words: 'damage on its first turn out after a teammate pivoted out with a U-turn-style move', min: 4 },
  tidy: { counter: 'tidyHazard', words: 'less damage from entry hazards (it has swept or dodged them)', min: 6 },
  'thorn-warden': { counter: 'thornHit', words: 'damage against foes that made contact last turn (it punishes touching)', min: 5, type: 'grass' },
  'ember-heart': { counter: 'useFireLow', words: 'Fire damage while under 50% HP', min: 6 },
  // Run-map paths: counted where the run happens (nodes, shops, eggs, berries, field items). The lead Pokémon is credited
  // for node events. They give a flat +bonus damage, since the pack's own bonuses (XP, shop prices) are not battle rules.
  pathfinder: { counter: 'nodeClean', words: 'damage (it has led the party through nodes with no one fainting)', min: 10 },
  'frontline-pet': { counter: 'shopVisit', words: 'damage (it has been to many shops with you)', min: 4 },
  'egg-warm': { counter: 'eggHatch', words: 'damage (it was in front when eggs hatched)', min: 2 },
  caretaker: { counter: 'berryFeed', words: 'damage (it has been fed many berries)', min: 5 },
  'treasure-nose': { counter: 'fieldItem', words: 'damage (it was in front when field items turned up)', min: 5 },
  'move-collector': { counter: 'tmLearned', words: 'damage (it has learned many TM and tutor moves)', min: 3 },
  // Batch 6: status and setup moves. Counters come from the moves a Pokémon uses (`moveRoleCounters`) and what they inflict.
  'live-wire': { counter: 'inflictPar', words: 'chance to paralyse with its moves', min: 3, type: 'electric' },
  'glacial-mind': { counter: 'inflictFrz', words: 'chance to freeze with its moves', min: 2, cap: 0.03, type: 'ice' },
  'dream-weaver': { counter: 'inflictSleepConf', words: 'chance to confuse or put to sleep with its moves', min: 3, cap: 0.03, type: 'psychic' },
  'toxic-weaver': { counter: 'useToxic', words: 'on Toxic: the poison starts one step stronger', min: 4, type: 'poison' },
  'rain-dancer': { counter: 'setWeather', words: 'on weather it sets: lasts 1 turn longer (once per battle)', min: 3 },
  'terrain-master': { counter: 'setTerrain', words: 'on terrain it sets: lasts 1 turn longer (once per battle)', min: 3 },
  'trick-roomer': { counter: 'useRoom', words: 'on Trick Room it sets: lasts 1 turn longer (once per battle)', min: 3 },
  'screen-keeper': { counter: 'useScreen', words: 'on screens it sets: last 1 turn longer (once per battle)', min: 4 },
  'hazard-setter': { counter: 'setHazard', words: 'of max HP extra from the hazards it sets (1/32)', min: 4 },
  cleaner: { counter: 'useClean', words: 'of max HP restored by hazard removal moves (1/16)', min: 3 },
  disruptor: { counter: 'dropFoe', words: 'accuracy with stat-lowering moves', min: 6 },
  buffer: { counter: 'raiseSelf', words: 'of max HP restored by stat-raising moves (1/32)', min: 6 },
  'tricky-feet': { counter: 'dodge', words: 'Protect success chance (once per battle)', min: 3, cap: 0.03 },
  // Batch 4: time of day and weather (the run clock's period and the battle's weather).
  'night-owl-path': { counter: 'winNight', words: 'damage in night battles', min: 3 },
  sunbather: { counter: 'winDay', words: 'damage in daytime battles (morning and afternoon)', min: 3 },
  'dawn-runner': { counter: 'winFirst', words: 'Speed in the first battle of a day', min: 2, cap: 0.03 },
  moonlit: { counter: 'useFairyNight', words: 'Fairy damage in night battles', min: 6, type: 'fairy' },
  'weather-wise': { counter: 'battleWeather', words: 'accuracy in any weather', min: 3, cap: 0.03 },
  'storm-chaser': { counter: 'battleChange', words: 'Speed in rain and snow', min: 3, cap: 0.03 },
  windrunner: { counter: 'turnTailwind', words: 'Speed under its own Tailwind', min: 5, cap: 0.03, type: 'flying' },
  // Batch 5: counted turn by turn in battle (turnCounters), singles battles.
  'lead-out': { counter: 'leadBattle', words: 'damage in the first two turns of a battle', min: 5 },
  opener: { counter: 'koFirst', words: 'damage on its first turn out' },
  'quiet-strength': { counter: 'quietTurn', words: 'damage after a turn where it was not hit', min: 20, cap: 0.03 },
  'steady-hand': { counter: 'healthyTurn', words: 'accuracy with Normal moves', min: 40, cap: 0.03, type: 'normal' },
  patient: { counter: 'waitTurn', words: 'damage when attacking after a turn spent waiting', min: 12 },
  wall: { counter: 'absorbed', words: 'Defense while above 50% HP', min: 300 },
  bruiser: { counter: 'tradeTurn', words: 'Attack and Defense while at full HP', min: 15, cap: 0.03 },
  anchor: { counter: 'bossTurn', words: 'more HP restored by held-item and move healing', min: 20 },
  dodger: { counter: 'forcedMiss', words: 'evasion while above 75% HP', min: 10, cap: 0.03 },
  // Batch 7: battle facts (KO situations and a few move kinds), counted in story/hooks.ts.
  hunter: { counter: 'koLow', words: 'damage against foes below 50% HP' },
  sweeper: { counter: 'koChain', words: 'damage after it has scored a KO in the same battle' },
  comeback: { counter: 'koBehind', words: 'damage when your party has fewer Pokémon left than the foe' },
  duelist: { counter: 'koDuel', words: 'damage when both sides are down to their last Pokémon' },
  'glass-cannon': { counter: 'koHealthy', words: 'damage at full HP (but -3% Defense)', min: 6 },
  speedster: { counter: 'movedFirst', words: 'Speed on the turn after its first KO of a battle', min: 15, cap: 0.03 },
  scarfer: { counter: 'koScarf', words: 'Speed on the turn after its first KO of a battle', cap: 0.03 },
  'legend-hunter': { counter: 'hitLegend', words: 'damage against Legendary Pokémon', min: 100 },
  'rival-mirror': { counter: 'mirrorBattle', words: 'damage against foes sharing one of its types', min: 5, cap: 0.03 },
  'grudge-keeper': { counter: 'koGrudge', words: 'damage against foes that knocked out one of your Pokémon before' },
  'silk-spinner': { counter: 'dropSpe', words: 'accuracy with moves that lower the foe\'s Speed', min: 4, type: 'bug' },
  'haunt-keeper': { counter: 'hauntMove', words: 'accuracy with Ghost status moves (curses, hauntings)', min: 4, type: 'ghost' },
  medic: { counter: 'healAlly', words: 'more HP restored by healing moves', min: 3, },
  bodyguard: { counter: 'guardAlly', words: 'success chance on repeated Protect-type moves (once per battle)', min: 3 },
  trapper: { counter: 'useTrap', words: 'turns bound by its binding moves (once per battle)', min: 3 },
  'berry-friend': { counter: 'berryEaten', words: 'more HP restored by the Berries it holds', min: 4 },
  vanguard: { counter: 'vanguardHit', words: 'Defense and Sp. Def on the turn it switches in', min: 4 },
  lucky: { counter: 'critLucky', words: 'critical-hit chance', min: 3, cap: 0.01 },
  'scale-guard': { counter: 'resistHit', words: 'less damage from Dragon, Ice and Fairy moves', min: 8, cap: 0.03, type: 'dragon' },
  trickster: { counter: 'useTrick', words: 'accuracy with Taunt, Torment and Fake Out', min: 4, type: 'dark' },

};

/** What a turn of singles battle tells the counters. Works on battle events and run events alike. */
export interface TurnFacts { switched: boolean; hitFoe: boolean; tookHit: boolean; missed: boolean; moved: boolean; foeMisses: number; absorbed: number }
export function turnFacts(events: readonly { type: string; side?: string; amount?: number }[]): TurnFacts {
  const f: TurnFacts = { switched: false, hitFoe: false, tookHit: false, missed: false, moved: false, foeMisses: 0, absorbed: 0 };
  for (const e of events) {
    if (e.type === 'switchOut' && e.side === 'player') f.switched = true;
    else if (e.type === 'damage' && e.side === 'enemy') f.hitFoe = true;
    else if (e.type === 'damage' && e.side === 'player') { f.tookHit = true; f.absorbed += e.amount ?? 0; }
    else if (e.type === 'miss' && e.side === 'player') f.missed = true;
    else if (e.type === 'miss' && e.side === 'enemy') f.foeMisses += 1;
    else if (e.type === 'move' && e.side === 'player') f.moved = true;
  }
  return f;
}
/**
 * Doubles: the same facts per player Pokémon on the field. `start` are the player Pokémon that begin the turn and the foe
 * focus; `focus` events say which Pokémon the following events are about. A hit is credited to whoever moved last.
 * Foe misses are not counted (the target of a miss is not known), so Dodger stays a singles path.
 */
export function doublesTurnFacts(events: readonly { type: string; side?: string; uid?: string; amount?: number }[], start: { player: string; enemy: string | undefined }): Map<string, TurnFacts> {
  const out = new Map<string, TurnFacts>();
  const facts = (uid: string | undefined): TurnFacts | null => {
    if (!uid) return null;
    let f = out.get(uid);
    if (!f) { f = { switched: false, hitFoe: false, tookHit: false, missed: false, moved: false, foeMisses: 0, absorbed: 0 }; out.set(uid, f); }
    return f;
  };
  const cur: { player: string | undefined; enemy: string | undefined } = { ...start };
  let mover: string | undefined;
  for (const e of events) {
    if ((e.type === 'focus' || e.type === 'switchIn') && (e.side === 'player' || e.side === 'enemy')) cur[e.side] = e.uid;
    else if (e.type === 'switchOut' && e.side === 'player') { const f = facts(e.uid); if (f) f.switched = true; }
    else if (e.type === 'move' && e.side === 'player') { mover = cur.player; const f = facts(mover); if (f) f.moved = true; }
    else if (e.type === 'move') mover = undefined;
    else if (e.type === 'damage' && e.side === 'enemy') { const f = facts(mover); if (f) f.hitFoe = true; }
    else if (e.type === 'damage' && e.side === 'player') { const f = facts(cur.player); if (f) { f.tookHit = true; f.absorbed += e.amount ?? 0; } }
    else if (e.type === 'miss' && e.side === 'player') { const f = facts(cur.player); if (f) f.missed = true; }
  }
  return out;
}
/** A turn spent waiting: it used a move that did no damage and did not miss (a status move, Protect...). */
export const waitedTurn = (f: TurnFacts): boolean => !f.switched && f.moved && !f.hitFoe && !f.missed;

/** The counters the player's Pokémon earns from one turn. `turn` is the battle turn, `maxHp` and `hpAfter` are its own HP. */
export function turnCounters(f: TurnFacts, o: { turn: number; lead: boolean; boss: boolean; maxHp: number; hpAfter: number }): Array<[string, number]> {
  if (f.switched) return [];
  const out: Array<[string, number]> = [];
  if (o.turn === 1 && o.lead) out.push(['leadBattle', 1]);
  if (!f.tookHit) out.push(['quietTurn', 1]);
  if (waitedTurn(f)) out.push(['waitTurn', 1]);
  if (o.hpAfter > 0 && o.hpAfter * 2 > o.maxHp) out.push(['healthyTurn', 1]);
  if (o.hpAfter > 0 && f.absorbed > 0) out.push(['absorbed', Math.round((f.absorbed / Math.max(1, o.maxHp)) * 100)]);
  if (f.hitFoe && f.tookHit) out.push(['tradeTurn', 1]);
  if (o.boss && o.hpAfter > 0) out.push(['bossTurn', 1]);
  if (f.foeMisses > 0) out.push(['forcedMiss', f.foeMisses]);
  return out;
}
export function addGrowth(cfg: GrowthConfig, history: { growth?: Record<string, number> | undefined } | undefined, counts: ReadonlyArray<readonly [string, number]>): void {
  if (!cfg.enabled || !history) return;
  for (const [c, n] of counts) { history.growth ??= {}; history.growth[c] = (history.growth[c] ?? 0) + n; }
}

/** Defense multiplier for the defender's path (Wall above half HP, Bruiser at full HP; physical Defense only). */
export function growthDefenseMultiplier(cfg: GrowthConfig, mon: Pick<PokemonInstance, 'growthPath'>, hpFrac: number): number {
  if (!cfg.enabled) return 1;
  if (mon.growthPath === 'glass-cannon') return 0.97;
  if (mon.growthPath === 'wall' && hpFrac > 0.5) return 1 + cfg.bonus;
  if (mon.growthPath === 'bruiser' && hpFrac >= 1) return 1 + Math.min(cfg.bonus, 0.03);
  return 1;
}
/** Held Berries restore a little more for Berry Friend. */
export const growthBerryMultiplier = (cfg: GrowthConfig, mon: Pick<PokemonInstance, 'growthPath'>): number => (cfg.enabled && mon.growthPath === 'berry-friend' ? 1 + cfg.bonus : 1);
/** Vanguard: Defense and Sp. Def on the turn it switches in. */
export const growthVanguardMultiplier = (cfg: GrowthConfig, mon: Pick<PokemonInstance, 'growthPath'>, turnsOut: number): number => (cfg.enabled && mon.growthPath === 'vanguard' && turnsOut === 0 ? 1 + cfg.bonus : 1);
/** Damage taken from a move of this type: Scale Guard shrugs off 3% of Dragon, Ice and Fairy moves. */
export const growthIncomingMultiplier = (cfg: GrowthConfig, mon: Pick<PokemonInstance, 'growthPath'>, moveType: string): number => (cfg.enabled && mon.growthPath === 'scale-guard' && ['dragon', 'ice', 'fairy'].includes(moveType.toLowerCase()) ? 1 - Math.min(cfg.bonus, 0.03) : 1);
/** Fossil Memory: weather chip (hail, sandstorm) bites 5% less. */
export const growthWeatherChipMultiplier = (cfg: GrowthConfig, mon: Pick<PokemonInstance, 'growthPath'>): number => (cfg.enabled && mon.growthPath === 'fossil-memory' ? 1 - cfg.bonus : 1);
/** Burrower: in the middle of a two-turn move, paralysis and confusion stop it 5% less often (relative). */
export const growthChargeHoldMultiplier = (cfg: GrowthConfig, mon: Pick<PokemonInstance, 'growthPath'>, charging: boolean): number => (cfg.enabled && charging && mon.growthPath === 'burrower' ? 1 - cfg.bonus : 1);
/** Tidy: entry hazards bite a little less. */
export const growthHazardMultiplier = (cfg: GrowthConfig, mon: Pick<PokemonInstance, 'growthPath'>): number => (cfg.enabled && mon.growthPath === 'tidy' ? 1 - cfg.bonus : 1);
/** Lucky: a flat extra critical-hit chance. */
export const growthCritBonus = (cfg: GrowthConfig, mon: Pick<PokemonInstance, 'growthPath'>): number => (cfg.enabled && mon.growthPath === 'lucky' ? Math.min(cfg.bonus, 0.01) : 0);
/** Evasion multiplier (>1 makes foes miss more): Dodger above 75% HP. */
export function growthEvasionMultiplier(cfg: GrowthConfig, mon: Pick<PokemonInstance, 'growthPath'>, hpFrac: number): number {
  return cfg.enabled && mon.growthPath === 'dodger' && hpFrac > 0.75 ? 1 + Math.min(cfg.bonus, 0.03) : 1;
}
/** Healing multiplier (Anchor: held-item and move healing restore a little more). */
export function growthHealMultiplier(cfg: GrowthConfig, mon: Pick<PokemonInstance, 'growthPath'>): number {
  return cfg.enabled && (mon.growthPath === 'anchor' || mon.growthPath === 'medic') ? 1 + cfg.bonus : 1;
}

/** Run-map counter paths whose edge is a flat bonus on every hit. */
export const STAT_FLAT: ReadonlySet<string> = new Set(['shiny-glint', 'elder', 'late-bloomer', 'trainer-pet', 'prodigy']);
export const FLAT_PATHS: ReadonlySet<string> = new Set(['pathfinder', 'frontline-pet', 'egg-warm', 'caretaker', 'treasure-nose', 'move-collector']);

/** Credit one run-map event (a node, shop, hatch, berry, item, TM) to a Pokémon's growth counter. Does nothing when the switch is off. */
export function noteMapGrowth(content: Content, run: { story: { histories: Record<string, { growth?: Record<string, number> | undefined } | undefined> } }, uid: string | undefined, counter: string, by = 1): void {
  if (!uid || !content.balance.overhaulGrowth.enabled) return;
  const h = run.story.histories[uid];
  if (!h) return;
  h.growth ??= {};
  h.growth[counter] = (h.growth[counter] ?? 0) + by;
}

/** What one move use tells the growth counters. `hpFrac` is the user's HP share before it moved. */
export interface MoveFacts { accuracy: number | null; category: string; type: string; flags: readonly string[]; hpFrac: number; night?: boolean }
/** What the move itself is, for the setup-move paths. */
export interface MoveRoleFacts { id: string; category: string; type?: string; bind?: unknown; trap?: unknown; weather?: unknown; terrain?: unknown; field?: string; wonderRoom?: unknown; sideMove?: string; clearHazards?: unknown; statChanges?: readonly { stages: number; target: string; stat?: string }[] }
export function moveRoleCounters(m: MoveRoleFacts): string[] {
  const out: string[] = [];
  if (m.weather) out.push('setWeather');
  if (m.terrain) out.push('setTerrain');
  if (m.field === 'trickRoom' || m.wonderRoom) out.push('useRoom');
  if (m.sideMove === 'reflect' || m.sideMove === 'lightScreen' || m.sideMove === 'auroraVeil') out.push('useScreen');
  if (m.sideMove === 'spikes' || m.sideMove === 'toxicSpikes' || m.sideMove === 'stealthRock' || m.sideMove === 'stickyWeb') out.push('setHazard');
  if (m.id === 'toxic' || m.id === 'toxic-spikes') out.push('useToxic');
  if (m.clearHazards) out.push('useClean', 'tidyHazard');
  if (m.statChanges?.some((c) => c.target === 'enemy' && c.stages < 0)) out.push('dropFoe');
  if (m.category === 'status' && m.statChanges?.some((c) => c.target === 'self' && c.stages > 0)) out.push('raiseSelf');
  if (m.statChanges?.some((c) => c.target === 'enemy' && c.stages < 0 && c.stat === 'spe')) out.push('dropSpe');
  if (m.category === 'status' && m.type?.toLowerCase() === 'ghost') out.push('hauntMove');
  if (m.bind || m.trap) out.push('useTrap');
  if (m.id === 'taunt' || m.id === 'torment' || m.id === 'fake-out') out.push('useTrick');
  return out;
}
/** True the first time per battle for this key (`marks` is the battle's `growthMarks`). */
export function growthOnce(marks: string[], key: string): boolean {
  if (marks.includes(key)) return false;
  marks.push(key);
  return true;
}
/** Paths whose edge is not damage (status chances, durations, healing, accuracy, Protect). */
const NON_DAMAGE: ReadonlySet<string> = new Set(['dojo-student', 'fast-learner', 'medic', 'bodyguard', 'trapper', 'berry-friend', 'vanguard', 'lucky', 'scale-guard', 'speedster', 'scarfer', 'silk-spinner', 'haunt-keeper', 'trickster', 'live-wire', 'glacial-mind', 'dream-weaver', 'toxic-weaver', 'rain-dancer', 'terrain-master', 'trick-roomer', 'screen-keeper', 'hazard-setter', 'cleaner', 'tidy', 'scout', 'fossil-memory', 'burrower', 'disruptor', 'buffer', 'tricky-feet']);
export function moveCounters(f: MoveFacts): string[] {
  const out: string[] = [];
  if (f.category === 'status') out.push('useStatus');
  if (f.accuracy === 100 && f.category !== 'status') out.push('useSure');
  if (f.accuracy !== null && f.accuracy < 80) out.push('useRisky');
  if (f.flags.includes('sound')) out.push('useSound');
  if (f.type.toLowerCase() === 'fire' && f.category !== 'status' && f.hpFrac < 0.5) out.push('useFireLow');
  if (f.night && f.type.toLowerCase() === 'fairy' && f.category !== 'status') out.push('useFairyNight');
  return out;
}
/** What one damaging hit tells the counters: `before` and `max` are the foe's HP around the hit; `ko` when it fainted. */
export function hitCounters(before: number, max: number, ko: boolean): string[] {
  const out: string[] = [];
  if (before > max * 0.75) out.push('hitHigh');
  if (ko && before >= max) out.push('koFull');
  return out;
}
/** Add a counter once per battle for one Pokémon (`marks` is the battle's `growthMarks`). */
export function bumpGrowthOnce(cfg: GrowthConfig, history: { growth?: Record<string, number> | undefined } | undefined, marks: string[], uid: string, counter: string): void {
  const key = `${counter}:${uid}`;
  if (marks.includes(key)) return;
  marks.push(key);
  bumpGrowth(cfg, history, [counter]);
}
export function bumpGrowth(cfg: GrowthConfig, history: { growth?: Record<string, number> | undefined } | undefined, counters: readonly string[]): void {
  if (!cfg.enabled || !history) return;
  for (const c of counters) { history.growth ??= {}; history.growth[c] = (history.growth[c] ?? 0) + 1; }
}

/** What a KO tells the growth counters. `by` are the winner's types, `foe` the fallen foe's types. */
export interface KoFacts { by: readonly string[]; foe: readonly string[]; rival: boolean; trainerClass: string | null; solo: boolean; firstTurn?: boolean; foeLow?: boolean; chain?: boolean; behind?: boolean; duel?: boolean; healthy?: boolean; scarf?: boolean; grudge?: boolean; last?: boolean; pair?: boolean }

/** The counters one KO adds to (names from COUNTER_PATHS). */
export function koCounters(f: KoFacts): string[] {
  const low = (a: readonly string[]) => a.map((x) => x.toLowerCase());
  const by = low(f.by);
  const foe = low(f.foe);
  const out: string[] = [];
  if (f.rival) out.push('koRival');
  if (f.trainerClass === 'gym-leader') out.push('koGym');
  if (f.trainerClass === 'elite-four') out.push('koElite');
  if (f.trainerClass === 'champion') out.push('koChampion');
  if (f.solo) out.push('koSolo');
  if (f.firstTurn) out.push('koFirst');
  if (f.foeLow) out.push('koLow');
  if (f.chain) out.push('koChain');
  if (f.behind) out.push('koBehind');
  if (f.duel) out.push('koDuel');
  if (f.healthy) out.push('koHealthy');
  if (f.scarf) out.push('koScarf');
  if (f.grudge) out.push('koGrudge');
  if (f.last) out.push('koLast');
  if (f.pair) out.push('koPair');
  if (by.includes('water') && foe.some((t) => ['fire', 'rock', 'ground'].includes(t))) out.push('koWaterVsFRG');
  if (by.includes('steel') && foe.some((t) => ['ice', 'rock', 'fairy'].includes(t))) out.push('koSteelVsIRF');
  return out;
}

/** Add a KO to the winner's history counters (does nothing when the switch is off). */
export function noteGrowthKo(cfg: GrowthConfig, history: { growth?: Record<string, number> | undefined } | undefined, facts: KoFacts): void {
  if (!cfg.enabled || !history) return;
  for (const c of koCounters(facts)) { history.growth ??= {}; history.growth[c] = (history.growth[c] ?? 0) + 1; }
}

/** Pack path id for a type's first path ("type:Fire" -> the first entry gated on it), or null. */
export function typePathId(type: string): string | null {
  const gate = `type:${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()}`;
  return overhaulCatalogs().growth_paths.entries.find((p) => p.gate === gate)?.id ?? null;
}

const bondScore = (h: History): number => (h.bond?.trust ?? 0) + (h.bond?.affection ?? 0);
const onlyTop = (party: readonly History[], score: (h: History) => number, mon: History, min: number): boolean => {
  const n = score(mon);
  const top = Math.max(...party.map(score));
  return n >= min && n === top && party.filter((h) => score(h) === top).length === 1;
};

/** Paths read straight from what the run already keeps per Pokémon (no new counter needed). */
function statPath(cfg: GrowthConfig, mon: History, party: readonly History[], shiny: boolean): string | null {
  if (shiny && (mon.battles ?? 0) >= 10) return 'shiny-glint';
  if (onlyTop(party, (h) => h.battles ?? 0, mon, 20)) return 'elder';
  if (onlyTop(party, (h) => h.evolutions?.length ?? 0, mon, 2)) return 'late-bloomer';
  if (onlyTop(party, bondScore, mon, 200)) return 'trainer-pet';
  // Prodigy: the lowest battle count at level 30 (`lv30`), alone in the party.
  const at = mon.growth?.['lv30'];
  if (at !== undefined && party.every((h) => h === mon || h.growth?.['lv30'] === undefined || h.growth['lv30'] > at) && !party.some((h) => h !== mon && h.growth?.['lv30'] === at)) return 'prodigy';
  return null;
}

/** Uses of one move in this run that count as a mastery (the Bronze rank of Move Mastery). */
export const MASTERY_USES = 10;
/** How many of a Pokémon's moves it has used often enough to master this run. */
export const masteriesOf = (h: Pick<History, 'moves'>): number => Object.values(h.moves ?? {}).filter((n) => n >= MASTERY_USES).length;
/** Dojo Student: its most-used Fighting move and how often it used it. */
export function topFightingMove(h: Pick<History, 'moves'>, isFighting: (moveId: string) => boolean): { id: string; uses: number } | null {
  let best: { id: string; uses: number } | null = null;
  for (const [id, uses] of Object.entries(h.moves ?? {})) if (isFighting(id) && (!best || uses > best.uses || (uses === best.uses && id < best.id))) best = { id, uses };
  return best;
}
/** Paths read from the per-move use counts the run already keeps. */
function moveHistoryPath(mon: History, types: readonly string[], party: readonly History[], isFighting: (moveId: string) => boolean): string | null {
  if (onlyTop(party, masteriesOf, mon, 2)) return 'fast-learner';
  if (types.some((t) => t.toLowerCase() === 'fighting') && onlyTop(party, (h) => topFightingMove(h, isFighting)?.uses ?? 0, mon, 15)) return 'dojo-student';
  return null;
}

/** The path this Pokémon qualifies for now, or null. `party` are the histories of the whole party (for "most KOs"). */
export function pathFor(cfg: GrowthConfig, mon: History, types: readonly string[], party: readonly History[], shiny = false, isFighting: (moveId: string) => boolean = () => false): string | null {
  // A counter path needs enough of its kind of KO, and the most of it in the party (a tie goes to nobody).
  let best: { id: string; n: number } | null = null;
  for (const [id, def] of Object.entries(COUNTER_PATHS)) {
    const n = mon.growth?.[def.counter] ?? 0;
    if (n < (def.min ?? cfg.minRoleKos)) continue;
    if (def.type && !types.some((t) => t.toLowerCase() === def.type)) continue;
    const top = Math.max(...party.map((h) => h.growth?.[def.counter] ?? 0));
    if (n === top && party.filter((h) => (h.growth?.[def.counter] ?? 0) === top).length === 1 && (!best || n / (def.min ?? cfg.minRoleKos) > best.n)) best = { id, n: n / (def.min ?? cfg.minRoleKos) };
  }
  if (best) return best.id;
  const stat = statPath(cfg, mon, party, shiny);
  if (stat) return stat;
  const moved = moveHistoryPath(mon, types, party, isFighting);
  if (moved) return moved;
  if (mon.closeCalls >= cfg.minCloseCalls) return 'last-stand';
  const top = Math.max(0, ...party.map((h) => h.knockoutsDealt));
  if (mon.knockoutsDealt >= cfg.minKos && mon.knockoutsDealt === top && party.filter((h) => h.knockoutsDealt === top).length === 1) return 'striker';
  if (mon.knockoutsDealt >= cfg.minKos) for (const t of types) { const id = typePathId(t); if (id) return id; }
  return null;
}

/** Give paths to party members that earned one. Returns a line per new path. Safe to call often: a Pokémon keeps its first path. */
export function assignGrowthPaths(content: Content, party: PokemonInstance[], histories: Record<string, History | undefined>): string[] {
  const cfg = content.balance.overhaulGrowth;
  if (!cfg.enabled) return [];
  const hs = party.map((m) => histories[m.uid]).filter((h): h is History => h !== undefined);
  const names = new Map(overhaulCatalogs().growth_paths.entries.map((p) => [p.id, p.name]));
  const out: string[] = [];
  for (const mon of party) {
    if (mon.growthPath) continue;
    const h = histories[mon.uid];
    if (!h) continue;
    const id = pathFor(cfg, h, content.species.get(mon.speciesId)?.types ?? [], hs, mon.shiny, (m) => content.moves.get(m)?.type === 'fighting');
    if (id === 'dojo-student') mon.growthMove = topFightingMove(h, (m) => content.moves.get(m)?.type === 'fighting')?.id;
    if (!id || !names.has(id)) continue;
    mon.growthPath = id;
    out.push(`${content.species.get(mon.speciesId)?.name ?? mon.speciesId} found its way: ${names.get(id)}.`);
  }
  return out;
}

/** Damage multiplier from the attacker's path for one hit. `hpFrac` is the attacker's HP share (0..1). */
export interface HitFacts { foeTypes?: readonly string[]; rival?: boolean; trainerClass?: string | null; solo?: boolean; accuracy?: number | null; sound?: boolean; foeHpFrac?: number; period?: string; behind?: boolean; duel?: boolean; chain?: boolean; legend?: boolean; grudge?: boolean; mirror?: boolean; last?: boolean; pair?: boolean; turn?: number; turnsOut?: number; waited?: boolean; unhit?: boolean; contacted?: boolean; pivoted?: boolean }
export function growthDamageMultiplier(cfg: GrowthConfig, mon: Pick<PokemonInstance, 'growthPath'>, moveType: string, effectiveness: number, hpFrac: number, monTypes: readonly string[], hit: HitFacts = {}): number {
  const id = mon.growthPath;
  if (!cfg.enabled || !id) return 1;
  if (STAT_FLAT.has(id)) return 1 + cfg.bonus;
  if (id === 'last-stand') return hpFrac < 0.25 ? 1 + cfg.bonus : 1;
  if (id === 'striker') return effectiveness > 1 ? 1 + cfg.bonus : 1;
  if (id in COUNTER_PATHS) {
    const foe = (hit.foeTypes ?? []).map((t) => t.toLowerCase());
    const ok = id === 'rival-breaker' ? hit.rival === true
      : id === 'gym-slayer' ? hit.trainerClass === 'gym-leader'
      : id === 'elite-slayer' ? hit.trainerClass === 'elite-four'
      : id === 'champion-slayer' ? hit.trainerClass === 'champion'
      : id === 'loner' ? hit.solo === true
      : id === 'steady' ? hit.accuracy === 100
      : id === 'chorus-lead' ? hit.sound === true
      : id === 'tank-buster' ? (hit.foeHpFrac ?? 0) > 0.75
      : id === 'bond-breaker' ? (hit.foeHpFrac ?? 0) >= 1
      : id === 'hunter' ? (hit.foeHpFrac ?? 1) < 0.5
      : id === 'sweeper' ? hit.chain === true
      : id === 'comeback' ? hit.behind === true
      : id === 'duelist' ? hit.duel === true
      : id === 'glass-cannon' ? hpFrac >= 1
      : id === 'legend-hunter' ? hit.legend === true
      : id === 'rival-mirror' ? hit.mirror === true
      : id === 'grudge-keeper' ? hit.grudge === true
      : id === 'night-owl-path' ? hit.period === 'night'
      : id === 'sunbather' ? hit.period === 'morning' || hit.period === 'afternoon'
      : id === 'moonlit' ? moveType.toLowerCase() === 'fairy' && hit.period === 'night'
      : NON_DAMAGE.has(id) ? false
      : id === 'dawn-runner' || id === 'weather-wise' || id === 'storm-chaser' || id === 'windrunner' ? false
      : id === 'lead-out' ? (hit.turn ?? 99) <= 2
      : id === 'opener' ? hit.turnsOut === 0
      : id === 'patient' ? hit.waited === true
      : id === 'closer' ? hit.last === true
      : id === 'shield-sibling' ? hit.pair === true
      : id === 'pivot' ? hit.pivoted === true
      : id === 'thorn-warden' ? hit.contacted === true
      : id === 'quiet-strength' ? hit.unhit === true
      : id === 'bruiser' ? hpFrac >= 1
      : id === 'ember-heart' ? moveType.toLowerCase() === 'fire' && hpFrac < 0.5
      : id === 'gambler' || id === 'support' || id === 'wall' || id === 'dodger' || id === 'anchor' || id === 'steady-hand' ? false
      : FLAT_PATHS.has(id) ? true
      : id === 'deep-swimmer' ? moveType.toLowerCase() === 'water' && foe.some((t) => ['fire', 'rock', 'ground'].includes(t))
      : moveType.toLowerCase() === 'steel' && foe.some((t) => ['ice', 'rock', 'fairy'].includes(t));
    const amount = Math.min(cfg.bonus, COUNTER_PATHS[id]?.cap ?? cfg.bonus);
    return ok ? 1 + amount : 1;
  }
  const gate = overhaulCatalogs().growth_paths.entries.find((p) => p.id === id)?.gate;
  if (gate?.startsWith('type:')) {
    const t = gate.slice(5).toLowerCase();
    return moveType.toLowerCase() === t && monTypes.some((x) => x.toLowerCase() === t) ? 1 + cfg.bonus : 1;
  }
  return 1;
}

const TRICKS: ReadonlySet<string> = new Set(['taunt', 'torment', 'fake-out']);
/** Accuracy multiplier for the two accuracy paths (Gambler: moves under 80%; Support: status moves). */
export function growthAccuracyMultiplier(cfg: GrowthConfig, mon: Pick<PokemonInstance, 'growthPath'>, accuracy: number | null, category: string, weather: string | null = null, moveType = '', lowersFoe = false, extra: { moveId?: string; lowersSpe?: boolean; growthMove?: string; scout?: boolean } = {}): number {
  if (!cfg.enabled || accuracy === null) return 1;
  if (mon.growthPath === 'steady-hand' && moveType.toLowerCase() === 'normal') return 1 + Math.min(cfg.bonus, 0.03);
  if (mon.growthPath === 'weather-wise' && weather) return 1 + Math.min(cfg.bonus, 0.03);
  if (mon.growthPath === 'disruptor' && lowersFoe) return 1 + cfg.bonus;
  if (mon.growthPath === 'silk-spinner' && extra.lowersSpe) return 1 + cfg.bonus;
  if (mon.growthPath === 'haunt-keeper' && category === 'status' && moveType.toLowerCase() === 'ghost') return 1 + cfg.bonus;
  if (mon.growthPath === 'scout' && extra.scout) return 1 + Math.min(cfg.bonus, 0.03);
  if (mon.growthPath === 'dojo-student' && extra.moveId !== undefined && extra.moveId === extra.growthMove) return 1 + Math.min(cfg.bonus, 0.03);
  if (mon.growthPath === 'trickster' && TRICKS.has(extra.moveId ?? '')) return 1 + cfg.bonus;
  if (mon.growthPath === 'gambler' && accuracy < 80) return 1 + cfg.bonus;
  if (mon.growthPath === 'support' && category === 'status') return 1 + cfg.bonus;
  return 1;
}

/** Extra percentage points on a status or confusion chance from the attacker's path (Live Wire, Glacial Mind, Dream Weaver). */
export function growthStatusChance(cfg: GrowthConfig, mon: Pick<PokemonInstance, 'growthPath'>, statusId: string | undefined): number {
  if (!cfg.enabled) return 0;
  if (mon.growthPath === 'live-wire' && statusId === 'par') return cfg.bonus * 100;
  if (mon.growthPath === 'glacial-mind' && statusId === 'frz') return Math.min(cfg.bonus, 0.03) * 100;
  if (mon.growthPath === 'dream-weaver' && (statusId === 'slp' || statusId === 'confusion')) return Math.min(cfg.bonus, 0.03) * 100;
  return 0;
}

/** Speed multiplier for the Speed paths: Dawn Runner (first battle of a day), Storm Chaser (rain, snow), Windrunner (own Tailwind). */
export function growthSpeedMultiplier(cfg: GrowthConfig, mon: Pick<PokemonInstance, 'growthPath'>, facts: { firstOfDay: boolean; weather: string | null; tailwind: boolean; koed?: boolean }): number {
  if (!cfg.enabled) return 1;
  const up = 1 + Math.min(cfg.bonus, 0.03);
  switch (mon.growthPath) {
    case 'dawn-runner': return facts.firstOfDay ? up : 1;
    case 'storm-chaser': return facts.weather === 'rain' || facts.weather === 'snow' ? up : 1;
    case 'windrunner': return facts.tailwind ? up : 1;
    case 'speedster': case 'scarfer': return facts.koed ? up : 1;
    default: return 1;
  }
}

/** Plain words for the Pokémon info page, or null. */
export function growthLine(mon: Pick<PokemonInstance, 'growthPath'>, cfg: GrowthConfig): string | null {
  if (!mon.growthPath) return null;
  const p = overhaulCatalogs().growth_paths.entries.find((e) => e.id === mon.growthPath);
  if (!p) return null;
  const pct = Math.round(cfg.bonus * 100);
  const counter = COUNTER_PATHS[p.id];
  const effect = STAT_FLAT.has(p.id) ? `+${pct}% damage (earned over the run)` : counter ? `+${Math.min(pct, Math.round((counter.cap ?? cfg.bonus) * 100))}% ${counter.words}` : p.id === 'last-stand' ? `+${pct}% damage under a quarter HP` : p.id === 'striker' ? `+${pct}% on super-effective hits` : `+${pct}% damage with its own type`;
  return `Growth path, ${p.name}: ${effect}. ${p.flavor}`;
}

/** Fast Learner: Move Mastery needs 5% fewer uses, so each use counts a little more (rounded up). */
export const masteryCredit = (cfg: GrowthConfig, mon: Pick<PokemonInstance, 'growthPath'> | undefined, uses: number): number => (cfg.enabled && mon?.growthPath === 'fast-learner' ? Math.ceil(uses / (1 - Math.min(cfg.bonus, 0.05))) : uses);

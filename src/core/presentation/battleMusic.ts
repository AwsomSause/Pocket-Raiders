// Which music track a battle plays, and which victory fanfare follows a win. Pure and presentation-only:
// the track never changes the battle.

/** Who the player faces; picks the battle song and the win fanfare. */
export type BattleRole = 'wild' | 'trainer' | 'rival' | 'gym' | 'elite' | 'champion' | 'final';

/** Battle songs per role: ORAS Gym Leader, B2W2 PWT Final Round, EBDX Low HP Battle; the champion and final boss borrow raid songs. */
const ROLE_TRACKS: Record<'rival' | 'gym' | 'elite' | 'champion' | 'final', string> = {
  rival: 'bgm.battle_rival',
  gym: 'bgm.battle_leader',
  elite: 'bgm.battle_elite',
  champion: 'bgm.raid.ultra3',
  final: 'bgm.raid.tera3',
};
export const ROLE_TRACK_IDS: readonly string[] = Object.values(ROLE_TRACKS);

export interface BattleMusicInput {
  /** Set for rivals and bosses; wild and ordinary trainer fights leave it off. */
  role?: BattleRole;
  /** The raid arena's track (bgm.raid.*), if this is a raid. */
  raidTrack: string | null;
  trainer: boolean;
  /** The GB Sounds item: battles play the Game Boy style stand-in loop. */
  gbSounds: boolean;
  /** A stable string for this battle (run seed + battles won): ordinary fights then pick one of the extra songs by hash. Left off, the default song plays. */
  variantKey?: string;
  /** The region being played: wild and ordinary trainer fights then lean on that region's own era songs. */
  regionId?: string;
}

/** Extra songs from Pokemon Decades (ORAS, DPPT, HGSS, B2W2 battle themes), picked per battle by string hash (never the gameplay RNG). */
export const WILD_TRACKS = ['bgm.battle', 'bgm.battle_wild_oras', 'bgm.battle_wild_dppt', 'bgm.battle_wild_hgss', 'bgm.battle_wild_bw2'] as const;
export const TRAINER_TRACKS = ['bgm.battle_trainer', 'bgm.battle_trainer_oras', 'bgm.battle_trainer_dppt', 'bgm.battle_trainer_hgss', 'bgm.battle_trainer_bw2'] as const;
const GYM_TRACKS = ['bgm.battle_leader', 'bgm.battle_gym_oras', 'bgm.battle_gym_dppt', 'bgm.battle_gym_hgss'] as const;
const ELITE_TRACKS = ['bgm.battle_elite', 'bgm.battle_elite_oras', 'bgm.battle_elite_dppt'] as const;
/** Every song a battle can pick, besides the always-loaded wild and trainer defaults. */
export const BATTLE_VARIANT_IDS: readonly string[] = [...WILD_TRACKS, ...TRAINER_TRACKS, ...GYM_TRACKS, ...ELITE_TRACKS].filter((id) => id !== 'bgm.battle' && id !== 'bgm.battle_trainer');

function hashPick<T>(list: readonly T[], key: string): T {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return list[h % list.length]!;
}

/** A region's own song for a boss role (gym, Elite Four, champion, rival); regions not listed keep the shared one. From Pokemon Decades. */
const REGION_ROLE_TRACK: Record<string, Partial<Record<'gym' | 'elite' | 'champion' | 'rival', string>>> = {
  johto: { champion: 'bgm.champion_hgss', rival: 'bgm.rival_hgss' },
  sinnoh: { champion: 'bgm.champion_dppt', rival: 'bgm.rival_dppt' },
  unova: { elite: 'bgm.elite_bw', champion: 'bgm.champion_bw', rival: 'bgm.rival_bw2' },
  kalos: { gym: 'bgm.gym_xy', elite: 'bgm.elite_xy', champion: 'bgm.champion_xy' },
  alola: { gym: 'bgm.gym_sm', elite: 'bgm.elite_sm' },
  galar: { gym: 'bgm.gym_swsh', champion: 'bgm.champion_swsh' },
  paldea: { gym: 'bgm.gym_sv', champion: 'bgm.champion_sv' },
};
export const REGION_ROLE_TRACK_IDS: readonly string[] = [...new Set(Object.values(REGION_ROLE_TRACK).flatMap((r) => Object.values(r)))];

export function battleTrack(i: BattleMusicInput): string {
  if (i.raidTrack) return i.raidTrack;
  if (i.gbSounds) return 'bgm.battle_gb';
  const key = i.variantKey;
  if (i.role && i.role !== 'wild' && i.role !== 'trainer') {
    const regional = REGION_ROLE_TRACK[i.regionId ?? '']?.[i.role as 'gym' | 'elite' | 'champion' | 'rival'];
    if (regional && i.role !== 'final') return regional;
    const base = ROLE_TRACKS[i.role];
    if (key !== undefined && i.role === 'gym') return hashPick(GYM_TRACKS, key);
    if (key !== undefined && i.role === 'elite') return hashPick(ELITE_TRACKS, key);
    return base;
  }
  if (key !== undefined) {
    const list = i.trainer ? TRAINER_TRACKS : WILD_TRACKS;
    const era = REGION_ERA[i.regionId ?? ''];
    // A region with an era keeps its own song for most fights (3 in 4) and still mixes in the others.
    if (era && hashPick([0, 1, 2, 3], `${key}:era`) !== 0) return list.find((t) => t.endsWith(`_${era}`)) ?? hashPick(list, key);
    return hashPick(list, key);
  }
  return i.trainer ? 'bgm.battle_trainer' : 'bgm.battle';
}

/** The Deluxe Battle Kit's low-HP song. */
export const LOW_HP_TRACK = 'bgm.battle_lowhp';

/**
 * Ordinary wild and trainer fights swap to the low-HP song while your lead is in danger (under a fifth of its HP).
 * Boss, rival, raid and GB Sounds songs stay. Presentation only: it never touches the battle.
 */
export function lowHpTrack(base: string, hpShare: number): string {
  return hpShare < 0.2 && ((WILD_TRACKS as readonly string[]).includes(base) || (TRAINER_TRACKS as readonly string[]).includes(base)) ? LOW_HP_TRACK : base;
}

/** The victory fanfare: the big one for bosses (gym leaders, Elite Four, champions), then trainers, then wild. */
export function victoryTrack(i: { trainer: boolean; boss: boolean; role?: BattleRole }): string {
  if (i.role === 'elite') return 'bgm.victory_elite';
  if (i.boss) return 'bgm.victory_leader';
  return i.trainer ? 'bgm.victory_trainer' : 'bgm.victory_wild';
}

export const VICTORY_TRACKS = ['bgm.victory_wild', 'bgm.victory_trainer', 'bgm.victory_leader', 'bgm.victory_elite'] as const;

/** Raid battle tracks per tier group: the first is always loaded, the rest load lazily with the battle. */
const RAID_TRACKS = {
  basic: ['bgm.raid.basic', 'bgm.raid.basic2'],
  ultra: ['bgm.raid.ultra', 'bgm.raid.ultra2', 'bgm.raid.ultra3'],
  max: ['bgm.raid.max', 'bgm.raid.max2', 'bgm.raid.max3'],
  tera: ['bgm.raid.tera', 'bgm.raid.tera2', 'bgm.raid.tera3'],
} as const;
export const RAID_TRACK_IDS: readonly string[] = Object.values(RAID_TRACKS).flat();

/**
 * The music for a raid or Totem fight: the tier picks the set (1-2 Basic, 3 Ultra, 4 Max, 5+ and Totems Tera) and the
 * raid's id picks the variant. A string hash, never the gameplay RNG, so the same raid always plays the same song.
 */
export function raidMusic(tier: number | null, totem: boolean, key: string): string | null {
  if (tier === null && !totem) return null;
  const set = totem || (tier ?? 1) >= 5 ? RAID_TRACKS.tera : tier! >= 4 ? RAID_TRACKS.max : tier! >= 3 ? RAID_TRACKS.ultra : RAID_TRACKS.basic;
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return set[h % set.length]!;
}

/** The jingle for a beaten raid boss that offers to join, by raid tier (Raid Battles pack capture songs). */
export function raidCaptureTrack(tier: number): string {
  return `bgm.raid.capture.${tier >= 5 ? 'tera' : tier >= 4 ? 'max' : tier >= 3 ? 'ultra' : 'basic'}`;
}

/** Expedition route music by expedition tier (1-4): the Raid Battles pack's adventure songs. */
export function expeditionTrack(tier: number): string {
  return `bgm.raid.adventure.${(['basic', 'ultra', 'max', 'tera'] as const)[Math.min(3, Math.max(0, tier - 1))]}`;
}
export const EXPEDITION_TRACK_IDS: readonly string[] = [1, 2, 3, 4].map(expeditionTrack);

/** Which Decades era each region sounds like (battle songs end in _oras, _dppt, _hgss, _bw2). Kanto, Alola and the rest keep the plain mix. */
const REGION_ERA: Record<string, 'oras' | 'dppt' | 'hgss' | 'bw2'> = { johto: 'hgss', hoenn: 'oras', sinnoh: 'dppt', unova: 'bw2' };

/** Map songs: Route 101 plus the pack's Bicycle and Surfing themes, and five route songs from Pokemon Decades. A region keeps one (string hash, never the gameplay RNG). */
export const MAP_TRACKS = ['bgm.map', 'bgm.map_bike', 'bgm.map_surf', 'bgm.map_bw', 'bgm.map_oras', 'bgm.map_dppt', 'bgm.map_dppt2', 'bgm.map_hgss', 'bgm.map_xy', 'bgm.map_bw2', 'bgm.forest_dppt', 'bgm.forest_oras', 'bgm.forest_swsh', 'bgm.town_dppt', 'bgm.town_xy', 'bgm.city_xy', 'bgm.city_bw', 'bgm.sky_oras'] as const;
/** Each region's own map song (12 regions share 8 songs; every region keeps the same one every run). Story regions use their story route theme instead, see `regionMapMusic`. */
const REGION_MAP_TRACK: Record<string, (typeof MAP_TRACKS)[number]> = {
  kanto: 'bgm.map', johto: 'bgm.map_hgss', hoenn: 'bgm.map_oras', sinnoh: 'bgm.map_dppt', unova: 'bgm.map_bw2', kalos: 'bgm.map_xy',
  alola: 'bgm.map_surf', galar: 'bgm.forest_swsh', paldea: 'bgm.map_bike', torren: 'bgm.forest_dppt', 'frontier-isles': 'bgm.sky_oras', 'trial-archipelago': 'bgm.forest_oras', grand: 'bgm.city_xy',
};
/** Story region id to the slug used in story audio ids (mu_region_<slug>_town / _route / _tension). */
const STORY_REGION_SLUG: Record<string, string> = { cairnmoor: 'cairnmoor', 'tidewrack-reaches': 'tidewrack', 'orrery-basin': 'orrery_basin' };

/** The story music id for a region mood, or null when the region has no story theme. */
export function storyRegionMusic(regionId: string, mood: 'town' | 'route' | 'tension'): string | null {
  const slug = STORY_REGION_SLUG[regionId];
  return slug ? `mu_region_${slug}_${mood}` : null;
}

/** Rival, gym leader, Elite Four and champion story songs (two arrangements each, picked by hash). */
export function storyBattleMusic(role: BattleRole | undefined, key: string): string | null {
  const name = role === 'rival' ? 'rival' : role === 'gym' ? 'leader' : role === 'elite' ? 'elite' : role === 'champion' ? 'champion' : null;
  return name ? `mu_battle_${name}_${hashPick(['a', 'b'], key)}` : null;
}

export function mapTrack(regionId: string): string {
  const own = REGION_MAP_TRACK[regionId];
  if (own) return own;
  let h = 0;
  for (const c of regionId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return MAP_TRACKS[h % MAP_TRACKS.length]!;
}

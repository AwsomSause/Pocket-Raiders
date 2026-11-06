// Player trainer art registry (Story Overhaul slice P1). Pure data, no Phaser.
// Files come from tools/mc/build-player-art.py: public/assets/images/packs/mc/<look>/<anim>.{png,json}, one strip per animation.
// Asset id: `player_<look>_<anim>` (e.g. `player_a_throw`). Frames are bottom-centre aligned, so use origin (0.5, 1).

export type PlayerLook = 'a' | 'b';
export type PlayerAnimView = 'back' | 'front';

export interface PlayerAnimDef {
  /** Number of frames in the strip. */
  frames: number;
  /** Playback speed for the preview and for later slices (P2 may override). */
  fps: number;
  /** True for a looping idle-style animation. */
  loop: boolean;
  /** `back` = seen from behind (battle field), `front` = front/side (hub, story, pet scenes). */
  view: PlayerAnimView;
  /** Battle moment this animation is meant for (used by P2), if any. */
  moment?: 'sendOut' | 'recall' | 'win' | 'hit' | 'defeat' | 'command' | 'idle';
}

const back = (frames: number, moment: PlayerAnimDef['moment'], fps = 10, loop = false): PlayerAnimDef => ({ frames, fps, loop, view: 'back', moment });
const front = (frames: number, fps = 4, loop = false): PlayerAnimDef => ({ frames, fps, loop, view: 'front' });

/** Look A (female MC): complete. 79 animation frames, plus the portrait and the Pidgey scene. */
export const PLAYER_ANIMS_A = {
  throw: back(9, 'sendOut'),
  celebrate: back(9, 'win'),
  command: back(9, 'command'),
  disappointment: back(9, 'defeat'),
  hit: back(9, 'hit', 14),
  recall: back(9, 'recall'),
  back_idle: back(1, 'idle'),
  angry: front(2),
  pissed: front(2),
  sad: front(2),
  looking_up: front(2),
  item_offer: front(4),
  petting: front(2),
  excited: front(1),
  happy: front(1),
  hunger: front(1),
  laughing: front(1),
  walk_mid: front(1),
  nervous: front(1),
  read_letter: front(1),
  shock: front(1),
  disappointed: front(1),
  flinch: front(1),
  portrait: front(1),
  pidgey: front(9, 6, true),
} as const satisfies Record<string, PlayerAnimDef>;

/** Look B (male MC) is a stub: the male trainer stays COMING SOON, so only the throw sheet and portrait exist. */
export const PLAYER_ANIMS_B = {
  throw: back(9, 'sendOut'),
  portrait: front(1),
} as const satisfies Record<string, PlayerAnimDef>;

export const PLAYER_ANIMS: Record<PlayerLook, Record<string, PlayerAnimDef>> = { a: PLAYER_ANIMS_A, b: PLAYER_ANIMS_B };

export type PlayerAnimNameA = keyof typeof PLAYER_ANIMS_A;

export const playerAnimId = (look: PlayerLook, anim: string): string => `player_${look}_${anim}`;
export const playerAnimBase = (look: PlayerLook, anim: string): string => `images/packs/mc/look_${look}/${anim}`;
export const playerAnimDef = (look: PlayerLook, anim: string): PlayerAnimDef | undefined => PLAYER_ANIMS[look][anim];

/** Every registered animation as `[look, anim]`, in a stable order. */
export function allPlayerAnims(): [PlayerLook, string][] {
  return (Object.keys(PLAYER_ANIMS) as PlayerLook[]).flatMap((look) => Object.keys(PLAYER_ANIMS[look]).map((anim): [PlayerLook, string] => [look, anim]));
}

/** Frame names of an animation's atlas, in play order ("0001.png"...). */
export const playerFrameNames = (def: PlayerAnimDef): string[] => Array.from({ length: def.frames }, (_, i) => `${String(i + 1).padStart(4, '0')}.png`);

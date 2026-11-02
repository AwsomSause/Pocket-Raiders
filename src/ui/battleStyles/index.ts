// The battle styles Kice picked (core/presentation/screenStyles.ts, screen 'battle').
import type { ScreenStyleId } from '../../core/presentation/screenStyles';
import { arcade } from './arcade';
import { cards } from './cards';
import { classic } from './classic';
import { cinematic } from './cinematic';
import { cyber } from './cyber';
import { ink } from './ink';
import { ringSkin as ring } from './ring';
import { shonen } from './shonen';
import { stadium } from './stadium';
import type { BattleSkin } from './types';
import { wii } from './wii';

export type { BattleFrameInfo, BattleHud, BattleLayout, BattleSkin, BoxSpec, MenuLayout, MenuSpec, MoveView, Rect } from './types';

export const BATTLE_SKINS: Partial<Record<ScreenStyleId<'battle'>, BattleSkin>> = { wii, classic, cyber, arcade, cards, ring, stadium, cinematic, shonen, ink };

/** The skin for a style id, or null for the original look. */
export function battleSkinFor(id: string): BattleSkin | null {
  return BATTLE_SKINS[id as ScreenStyleId<'battle'>] ?? null;
}

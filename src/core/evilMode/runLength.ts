// Evil Mode slice 19: the Run length setting (Kice's answer 2: "make a setting for Six"). Six regions can be chosen only once
// six are written (`supported` or `limited` in region.json). Small on purpose: the settings list reads it without the
// mode's other data.

import regionRaw from '../../data/evilMode/region.json';
import type { RunLength } from './schema';

type Row = { status: string };
/** How many regions are written and switched on. */
export const regionsOpen = (regions: readonly Row[] = (regionRaw as { regions: Row[] }).regions): number =>
  regions.filter((r) => r.status === 'supported' || r.status === 'limited').length;

/** Whether "Six regions" can be picked: six regions' data is present. */
export const sixOpen = (regions?: readonly Row[]): boolean => regionsOpen(regions) >= 6;

/** The length a team's founded with: Six only when six regions exist; otherwise Three. */
export const lengthFor = (asked: RunLength, regions?: readonly Row[]): RunLength => (asked === 'six' && sixOpen(regions) ? 'six' : 'three');

/** Slice 22: how many regions this run plays: a Turned run's own count, else three or six. */
export const runRegions = (block: { settings: { length: RunLength; regions?: number } }): number => block.settings.regions ?? (block.settings.length === 'six' ? 6 : 3);

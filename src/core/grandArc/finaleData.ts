// Beta 0.7 finale and Region of Doom data (src/data/finale.json), validated once. Pure data + Zod, no Phaser.

import raw from '../../data/finale.json';
import { z } from 'zod';

const text = z.string().min(1);
const DataSchema = z.object({
  companions: z.array(z.object({ id: z.string().regex(/^[a-z]+$/), name: text, who: text, flag: text, role: text, postcards: z.array(text).min(1) })).length(6),
  approaches: z.array(z.object({ id: z.string(), name: text, heldBy: z.array(z.string().regex(/^(companion|flag):/)).min(1), ifLost: text })).length(4),
  apexFlags: z.array(text),
  doom: z.object({
    districts: z.array(z.object({ id: z.string(), name: text, theme: text, teams: z.array(z.string()) })).length(14),
    gyms: z.array(z.object({ slot: z.number().int().min(1).max(8), source: z.enum(['executive', 'specialist', 'pardoned', 'exposed', 'defector', 'rival', 'leader', 'chair']), district: z.string(), rule: text, types: z.array(z.string()).min(1) })).length(8),
    leaders: z.array(z.object({ name: text, title: text })).length(8),
    levelsPerDoomLevel: z.number().int().min(0),
    districtDrop: z.number().min(0).max(1),
    ambushBase: z.number().int(), ambushPerLevel: z.number().int(), ambushCap: z.number().int(),
  }),
});
export const finaleData = DataSchema.parse(raw);
export type CompanionDef = (typeof finaleData.companions)[number];

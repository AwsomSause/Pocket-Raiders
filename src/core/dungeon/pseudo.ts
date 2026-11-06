// Pseudo stages and regions (Story Overhaul W7, design 14.17): chains of 3 to 6 rooms opened from a map event, run by the
// dungeon machinery (compile.ts). Rules P1 to P6 are enforced in code: no stage index / badge / region clear (rooms are
// events), a Leave option before the first fight, caps and bans, one reward item, and a loss ejects to the map.

import { z } from 'zod';
import json from '../../data/pseudoStages.json';
import { room, type RoomDef } from './compile';
import { DUNGEON_NODE_KINDS, DUNGEONS, validateDungeon, type DungeonDef } from './schema';

const Id = z.string().regex(/^[a-z][a-z0-9_]*$/);
export const PseudoRecordSchema = z.object({
  id: z.string().regex(/^ps_[a-z0-9_]+$/),
  name: z.string().min(1),
  class: z.enum(['stage', 'region']),
  tier: z.number().int().min(1).max(4),
  mood: z.string(),
  tint: z.string().regex(/^#[0-9a-f]{6}$/i),
  entry: z.string(),
  wild: z.array(z.string()).min(2),
  nodes: z.array(z.object({ id: Id, kind: z.enum(DUNGEON_NODE_KINDS), next: z.array(Id) })).min(3).max(6),
  reward: z.object({ item: z.string(), count: z.number().int().min(1) }),
  exit: z.string(),
  countsAsStage: z.boolean(),
  status: z.enum(['supported', 'limited', 'disabled']),
  trainerClass: z.string(),
  boss: z.object({ classId: z.string(), name: z.string(), size: z.number().int().min(1).max(6) }).optional(),
  intro: z.string(),
});
export type PseudoRecord = z.infer<typeof PseudoRecordSchema>;
export const PseudoFileSchema = z.object({
  note: z.string(),
  rules: z.object({ perRegion: z.number().int().min(1), perRun: z.number().int().min(1), blockedCampaigns: z.array(z.string()), failureHeal: z.number().min(0).max(1) }),
  records: z.array(PseudoRecordSchema).length(10),
});
export const PSEUDO = PseudoFileSchema.parse(json);

const asDungeon = (r: PseudoRecord): DungeonDef => ({
  id: r.id, name: r.name, kind: 'themed', tier: r.tier, theme: r.mood, types: [], wild: r.wild, nodes: r.nodes,
  supply: { item: DUNGEONS.config.potion[String(r.tier)]!, count: 1 }, reward: r.reward, ...(r.boss ? { boss: r.boss } : {}), intro: r.intro,
});

/** Problems with one record: the dungeon graph rules (sized 3 to 6 here), a boss when it has a boss room, reward count. */
export function validatePseudo(r: PseudoRecord): string[] {
  const d = asDungeon(r);
  const problems = validateDungeon({ ...d, kind: 'basic' }).filter((p) => !/^basic dungeons have/.test(p));
  if (r.nodes.some((n) => n.kind === 'boss') && !r.boss) problems.push('a boss room needs a boss');
  if (r.reward.count > 3) problems.push('reward over 3 items (P4: one relic or one rare item)');
  if (r.countsAsStage && r.id !== 'ps_evil_hideout') problems.push('only the evil hideout counts as a stage (P1)');
  return problems;
}
export const validateAllPseudo = (records: readonly PseudoRecord[] = PSEUDO.records): string[] => records.flatMap((r) => validatePseudo(r).map((p) => `${r.id}: ${p}`));

const roomDef = (r: PseudoRecord): RoomDef => ({ ...asDungeon(r), pseudo: { tint: r.tint } });
const gateId = (r: PseudoRecord) => `${r.id.replace(/_/g, '-')}-gate`;
/** The event a map event opens to enter this pseudo stage (offers Enter or Leave: rule P2). */
export const pseudoGateId = gateId;

/** The gate and all rooms of every record, as raw events. The gate is what the entry events open. */
export function pseudoEvents(records: readonly PseudoRecord[] = PSEUDO.records): Record<string, unknown>[] {
  return records.flatMap((r) => {
    const def = roomDef(r);
    const first = `${r.id.replace(/_/g, '-')}-${r.nodes[0]!.id}`;
    const gate = {
      id: gateId(r), name: r.name, group: 'Pseudo Stages', stop: 'dungeon', rarity: 'rare', tags: ['Dungeon', 'Exploration'], minStage: 1, room: true,
      types: [], requires: [], scene: { cast: [], effect: 'none', tint: r.tint }, intro: `${r.intro} (${r.mood}.) Ends: ${r.exit}.`,
      choices: [
        { label: `Enter ${r.name}`, success: { text: 'You step in.', effects: [{ kind: 'addEvent', eventId: first }] } },
        { label: 'Leave', success: { text: 'You turn back. Nothing here is forced.', effects: [] } },
      ],
    };
    return [gate, ...r.nodes.map((_, i) => room(def, i))];
  });
}

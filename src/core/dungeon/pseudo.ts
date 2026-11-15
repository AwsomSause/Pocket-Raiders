// Pseudo stages (Story Overhaul W7, design 14.17; rebuilt in Beta 0.7 per Kice): a pseudo-stage plays exactly like a stage, with its own
// drawn node map, but lives inside ONE node of the parent stage and is always opened by an event. It never adds to the node or stage
// count (no stage index, badge or region clear). Each map node plays a room event (compile.ts). Rules: a Leave option before the first
// fight, caps and bans, one reward item, and a loss ejects back to the parent stage.

import { z } from 'zod';
import json from '../../data/pseudoStages.json';
import type { Content, EventDef } from '../contentSchema';
import type { MapNode, RunState, StageState } from '../state';
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
  /** The stage theme whose background art and arena this pseudo-stage's map and fights use (themes.json). */
  themeId: z.string(),
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
/** A pseudo-stage made from an existing chain of story events (Flight North, Sabrina's Labyrinth, Route 25, the Fighting Tournament): the map is drawn from the events' own links, so none of their text, fights or rules change. */
export const ChainSchema = z.object({ id: z.string().regex(/^ps_[a-z0-9_]+$/), name: z.string().min(1), entry: z.string().min(1), themeId: z.string(), tint: z.string().regex(/^#[0-9a-f]{6}$/i), mood: z.string(), /** `opened`: the player starts on the room the entry's chosen choice opened (a questline whose first choice picks the route). Without it the map lets the player pick among every room the entry opens. */ start: z.enum(['opened']).optional(), /** Evil Team hideouts (evil-story): the team this chain belongs to. */ team: z.string().optional() });
export type PseudoChain = z.infer<typeof ChainSchema>;
export const PseudoFileSchema = z.object({
  chains: z.array(ChainSchema).default([]),
  note: z.string(),
  rules: z.object({ perRegion: z.number().int().min(1), perRun: z.number().int().min(1), blockedCampaigns: z.array(z.string()), failureHeal: z.number().min(0).max(1) }),
  records: z.array(PseudoRecordSchema).length(10),
});
export const PSEUDO = PseudoFileSchema.parse(json);
/** Catalog Overhaul Pack: each category adds its own chain pseudo-stages in src/data/catalogOverhaul/pseudo/<category>.json, so threads never share a file. */
export const PseudoExtraFileSchema = z.object({ category: z.string().optional(), note: z.string().optional(), chains: z.array(ChainSchema) });
const extraChainFiles = Object.values(import.meta.glob<unknown>('../../data/catalogOverhaul/pseudo/*.json', { eager: true, import: 'default' }));
/** Every chain pseudo-stage: the four Kanto lines, then each category's own. */
export const PSEUDO_CHAINS: readonly PseudoChain[] = [...PSEUDO.chains, ...extraChainFiles.flatMap((f) => PseudoExtraFileSchema.parse(f).chains)];

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
  if (r.countsAsStage) problems.push('a pseudo-stage never counts as a stage (P1)');
  return problems;
}
export const validateAllPseudo = (records: readonly PseudoRecord[] = PSEUDO.records): string[] => records.flatMap((r) => validatePseudo(r).map((p) => `${r.id}: ${p}`));

const roomDef = (r: PseudoRecord): RoomDef => ({ ...asDungeon(r), pseudo: { tint: r.tint } });
const gateId = (r: PseudoRecord) => `${r.id.replace(/_/g, '-')}-gate`;
/** The event a map event opens to enter this pseudo stage (offers Enter or Leave: rule P2). */
export const pseudoGateId = gateId;

/** The gate and all rooms of every record, as raw events. The gate is what the entry events open. */
export function pseudoEvents(records: readonly PseudoRecord[] = PSEUDO.records): Record<string, unknown>[] {
  // A disabled record has no event that opens it yet, so it builds no rooms (a room nothing opens is a content error).
  return records.filter((r) => r.status !== 'disabled').flatMap((r) => {
    const def = roomDef(r);
    const gate = {
      id: gateId(r), name: r.name, group: 'Pseudo Stages', stop: 'delve', rarity: 'rare', tags: ['Dungeon', 'Exploration'], minStage: 1, room: true,
      types: [], requires: [], scene: { cast: [], effect: 'none', tint: r.tint }, intro: `${r.intro} (${r.mood}.) Ends: ${r.exit}.`,
      choices: [
        { label: `Enter ${r.name}`, success: { text: 'You step in.', effects: [{ kind: 'enterPseudo', id: r.id }] } },
        { label: 'Leave', success: { text: 'You turn back. Nothing here is forced.', effects: [] } },
      ],
    };
    return [gate, ...r.nodes.map((_, i) => room(def, i))];
  });
}

const roomEventId = (r: PseudoRecord, node: string) => `${r.id.replace(/_/g, '-')}-${node}`;
const BOSSY = new Set(['trainer', 'boss']);

/** The stage map of a pseudo-stage: the record's room graph, one column per step (longest path), drawn by the normal stage map screen. */
export function buildPseudoStage(r: PseudoRecord, parent: StageState): StageState {
  const depth = new Map<string, number>();
  const visit = (id: string, d: number): void => {
    if ((depth.get(id) ?? 0) >= d) return;
    depth.set(id, d);
    for (const next of r.nodes.find((n) => n.id === id)!.next) visit(next, d + 1);
  };
  visit(r.nodes[0]!.id, 1);
  const columns = Math.max(...depth.values());
  const rows = new Map<number, number>();
  const idOf = new Map<string, string>();
  const placed = r.nodes.map((n) => {
    const column = depth.get(n.id)!;
    const row = rows.get(column) ?? 0;
    rows.set(column, row + 1);
    idOf.set(n.id, `p${column}r${row}`);
    return { n, column, row };
  });
  const nodes: MapNode[] = placed.map(({ n, column, row }) => ({
    id: idOf.get(n.id)!, column, row, kind: BOSSY.has(n.kind) ? 'trainer' : 'wild', harder: n.kind === 'boss', next: n.next.map((x) => idOf.get(x)!),
    sides: [], ...(n.kind === 'boss' ? { ace: true } : {}), roomEvent: roomEventId(r, n.id), roomKind: n.kind, note: `pseudo ${r.id} ${n.kind}`,
  }));
  const trainerColumns = [...new Set(nodes.map((x) => x.column))].filter((c) => nodes.filter((x) => x.column === c).every((x) => x.kind === 'trainer'));
  return {
    kind: 'stage', index: parent.index, themeId: r.themeId, leaderId: parent.leaderId, eliteFour: [], map: { columns, nodes, trainerColumns }, current: null, visited: [],
    scoutedTo: columns, foresight: 0, extraFronts: [], roamers: [], convoy: null, pseudo: { id: r.id, name: r.name },
  };
}

/** Steps into a pseudo-stage from the current node: the parent stage is kept aside and the pseudo-stage's map takes its place. */
export function enterPseudoStage(_content: Content, run: RunState, id: string): void {
  const rec = PSEUDO.records.find((r) => r.id === id);
  if (!rec) throw new Error(`Unknown pseudo-stage "${id}"`);
  if (!run.stage || run.stage.pseudo) return;
  run.pseudoParent = structuredClone(run.stage);
  run.stage = buildPseudoStage(rec, run.stage);
}

/** Back to the parent stage, standing on the node the pseudo-stage was opened from. A no-op when no pseudo-stage is being played. */
export function leavePseudoStage(run: RunState): void {
  if (!run.stage?.pseudo || !run.pseudoParent) return;
  run.stage = run.pseudoParent;
  delete run.pseudoParent;
}

// ---------- chain pseudo-stages ----------

/** Every event id an event can open next (`addEvent` / `addEventFrom` anywhere in its choices, battle wins and losses included). */
export function opensNext(event: Pick<EventDef, 'choices'>): string[] {
  const out: string[] = [];
  const walk = (o: unknown): void => {
    if (!o || typeof o !== 'object') return;
    const x = o as Record<string, unknown>;
    if (x.kind === 'addEvent' && typeof x.eventId === 'string') out.push(x.eventId);
    if (x.kind === 'addEventFrom' && Array.isArray(x.ids)) out.push(...(x.ids as string[]));
    for (const v of Object.values(x)) walk(v);
  };
  walk(event.choices);
  // A remembered variant's added choices can open rooms too (Greenneedle).
  walk((event as { remembers?: unknown }).remembers);
  return [...new Set(out)];
}

const chainOfEntry = (event: string) => PSEUDO_CHAINS.find((c) => c.entry === event);
export const chainById = (id: string): PseudoChain | undefined => PSEUDO_CHAINS.find((c) => c.id === id);

/** The chain's rooms: the events its entry opens (column 1) and everything they open, by shortest distance from the entry. */
export function chainRooms(content: Content, chain: PseudoChain): { event: string; depth: number; next: string[]; battle: 'trainer' | 'wild' | null }[] {
  const entry = content.events.get(chain.entry);
  if (!entry) return [];
  const depth = new Map<string, number>();
  const order: string[] = [];
  // A room is never another chain's entry, nor a canon space's gate (a gate stands on the map: Route 25's last rooms open the Tournament's).
  const stops = (id: string): boolean => !!chainOfEntry(id) || !!content.events.get(id)?.canon;
  let level = opensNext(entry).filter((id) => content.events.has(id) && !stops(id));
  for (let d = 1; level.length > 0; d++) {
    const nextLevel: string[] = [];
    for (const id of level) {
      if (depth.has(id)) continue;
      depth.set(id, d);
      order.push(id);
      nextLevel.push(...opensNext(content.events.get(id)!).filter((x) => content.events.has(x) && !stops(x) && !depth.has(x)));
    }
    level = nextLevel;
  }
  const battleOf = (id: string): 'trainer' | 'wild' | null => {
    let found: 'trainer' | 'wild' | null = null;
    for (const c of content.events.get(id)!.choices) for (const o of [c.success, c.failure]) if (o?.battle) found = found === 'trainer' || o.battle.kind === 'trainer' ? 'trainer' : 'wild';
    return found;
  };
  return order.map((event) => ({ event, depth: depth.get(event)!, battle: battleOf(event), next: opensNext(content.events.get(event)!).filter((x) => depth.get(x) === depth.get(event)! + 1) }));
}

/** The stage map of a chain pseudo-stage, drawn like any stage. Rooms are the chain's own events, so the story plays exactly as written. */
export function buildChainStage(content: Content, chain: PseudoChain, parent: StageState): StageState {
  const rooms = chainRooms(content, chain);
  const columns = Math.max(1, ...rooms.map((r) => r.depth));
  const rows = new Map<number, number>();
  const idOf = new Map<string, string>();
  for (const r of rooms) {
    const row = rows.get(r.depth) ?? 0;
    rows.set(r.depth, row + 1);
    idOf.set(r.event, `p${r.depth}r${row}`);
  }
  const nodes: MapNode[] = rooms.map((r) => ({
    id: idOf.get(r.event)!, column: r.depth, row: Number(idOf.get(r.event)!.split('r')[1]), kind: r.battle === 'trainer' ? 'trainer' : 'wild', harder: false, next: r.next.map((x) => idOf.get(x)!), sides: [],
    roomEvent: r.event, roomKind: r.battle ?? 'story', note: `pseudo ${chain.id}`,
  }));
  const trainerColumns = [...new Set(nodes.map((x) => x.column))].filter((c) => nodes.filter((x) => x.column === c).every((x) => x.kind === 'trainer'));
  return {
    kind: 'stage', index: parent.index, themeId: chain.themeId, leaderId: parent.leaderId, eliteFour: [], map: { columns, nodes, trainerColumns }, current: null, visited: [],
    scoutedTo: columns, foresight: 0, extraFronts: [], roamers: [], convoy: null, pseudo: { id: chain.id, name: chain.name, chain: true },
  };
}

/**
 * An `addEvent` while a chain pseudo-stage is involved. Opening the chain's first room from its entry event steps into the stage (the map then
 * lets the player pick the start); inside the stage, a room opening the next room walks the player to that node. Returns true when handled here.
 */
export function routeChainEvent(content: Content, run: RunState, eventId: string): boolean {
  const st = run.stage;
  if (!st) return false;
  if (!st.pseudo) {
    const chain = PSEUDO_CHAINS.find((c) => chainRooms(content, c).some((r) => r.depth === 1 && r.event === eventId));
    // Only the entry's own targets step in; the entry event stays on the parent node.
    if (!chain || !opensNext(content.events.get(chain.entry)!).includes(eventId)) return false;
    run.pseudoParent = structuredClone(st);
    run.stage = buildChainStage(content, chain, st);
    if (chain.start === 'opened') {
      // The entry's choice picked the route: stand on that room at once, and the map opens it.
      const first = run.stage.map.nodes.find((n) => n.roomEvent === eventId)!;
      run.stage.current = first.id;
      run.stage.visited.push(first.id);
      first.sides.push({ id: `event-room-1-${first.id}`, kind: 'event', used: false, eventId });
      if (run.itemCounters) delete run.itemCounters[`event-seen:${eventId}`];
    }
    return true;
  }
  if (!st.pseudo.chain) return false;
  if (chainOfEntry(eventId)) {
    // The chain leads into another chain (Route 25 into the Tournament): back to the parent, where the next one opens as usual.
    leavePseudoStage(run);
    return false;
  }
  const node = st.map.nodes.find((n) => n.roomEvent === eventId);
  if (!node) return false;
  if (st.current === null) return true; // still choosing where to start (the entry's other targets)
  st.current = node.id;
  if (!st.visited.includes(node.id)) st.visited.push(node.id);
  if (!node.sides.some((x) => x.eventId === eventId && !x.used)) node.sides.push({ id: `event-room-${node.sides.length + 1}-${node.id}`, kind: 'event', used: false, eventId });
  if (run.itemCounters) delete run.itemCounters[`event-seen:${eventId}`];
  return true;
}

/** A chain pseudo-stage whose last room is done walks back out (called when the player is back on the map). */
export function settleChain(run: RunState): void {
  const st = run.stage;
  if (!st?.pseudo?.chain || st.current === null) return;
  const here = st.map.nodes.find((n) => n.id === st.current);
  if (here && here.sides.every((x) => x.used) && here.next.length === 0) leavePseudoStage(run);
}

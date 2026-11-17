// Legendary Blessings (Beta 0.7, workstream 5: INSTRUMENTALITY L1 + L2). One blessing per run, rolled once at run start
// from its own hashed stream (`::blessing-tier::` / `::blessing-pick::`), so no existing roll changes. In-run only: nothing here
// is saved to the profile. Pure rules + Zod, no Phaser. Data: src/data/blessings.json (hand-written; status per entry).

import { z } from 'zod';
import raw from '../../data/blessings.json';
import { ArchetypeModifierSchema, type Content } from '../contentSchema';
import type { Perks } from '../archetypes';
import { isBossClass } from '../trainerPerks';
import { hashSeed, Rng } from '../rng';
import { maxHp } from '../pokemon';
import { giveItem } from '../events';
import { grantRewinds, jsonCopy, rewindStage, stageRewindReady } from '../rewind';
import type { MapNode, RunState } from '../state';

import { BLESSING_TIERS, BlessingStateSchema, type BlessingState, type BlessingTier } from './schema';
export { BLESSING_TIERS, type BlessingTier };

const BlessingDefSchema = z.object({
  id: z.string().min(1), name: z.string().min(1), legendary: z.string().min(1), speciesId: z.string().min(1),
  tier: z.enum(BLESSING_TIERS), item: z.string().min(1), objectText: z.string().min(1), passage: z.string().min(1),
  headline: z.string().min(1), summary: z.string().min(1),
  effect: z.object({ kind: z.enum(['none', 'healMostHurt', 'shopDiscount', 'sacredAsh', 'perks', 'rewinds', 'reverseSide', 'calm', 'sight', 'insight', 'vow', 'vessel', 'bolt', 'fold']) }),
  /** Perks used instead of `perks` once the blessing is in Communion (omitted: the same perks). */
  communionPerks: z.array(ArchetypeModifierSchema).optional(),
  /** One of the blessings a new save can draw from (LEGENDARY_BLESSINGS.md section 3, Discovery). */
  known: z.boolean().default(false),
  /** A Price that stays on even in Communion (Kyogre and Groudon are hostile to each other). A matching starter may waive it for its first regions. */
  pricePerks: z.array(ArchetypeModifierSchema).optional(),
  /** Section 7: the starter that changes something, and what. */
  starterNote: z.object({
    types: z.array(z.string()).default([]), species: z.array(z.string()).default([]), line: z.string().min(1),
    influence: z.number().int().min(0).optional(), perks: z.array(ArchetypeModifierSchema).optional(), noPriceRegions: z.number().int().min(1).optional(),
  }).optional(),
  /** false: never rolled at run start; only an event offers it (`takeBlessing`), so adding it moves no seed's roll. */
  pool: z.boolean().default(true),
  /** Battle perks (the same rules trainers use) that this blessing adds. */
  perks: z.array(ArchetypeModifierSchema).default([]),
  /** The perks apply only to the first battle of each stage. */
  firstBattleOfStage: z.boolean().default(false),
  /** In Communion the perks apply to every battle, not only the first of each stage. */
  communionAllBattles: z.boolean().default(false),
  /**
   * A Rite written as data (once per run, after Communion). With perks it is armed and waits for the next battle of kind `on`,
   * whose battle gets the perks; without perks it acts at once (heal the party, give items).
   */
  /** Run-level perks (Bond, experience, money, encounters): they act outside battle, through the run's perk list (see runPerks.ts). */
  runPerks: z.array(ArchetypeModifierSchema).optional(),
  communionRunPerks: z.array(ArchetypeModifierSchema).optional(),
  /** On the map, battles ahead show their lead (or whole team) before the player picks them. */
  sight: z.object({ kinds: z.array(z.enum(['wild', 'trainer'])).min(1), word: z.string().min(1), team: z.boolean().default(false), communionTeam: z.boolean().default(false) }).optional(),
  /** Once (or more) per stage on the map: move to any node of the next level, whatever the paths. */
  ride: z.object({ label: z.string().min(1), perStage: z.number().int().min(1), communionPerStage: z.number().int().min(1) }).optional(),
  /** Every stat (not HP) of the party rises by `step` per badge, up to `max` (`communionMax` in Communion). */
  badgeGrowth: z.object({ step: z.number().positive(), max: z.number().positive(), communionMax: z.number().positive() }).optional(),
  /** In Communion the blessing grows into another from this region on (0-based region index). */
  grows: z.array(z.object({ region: z.number().int().min(0), into: z.string().min(1) })).optional(),
  rite: z.object({
    label: z.string().min(1), hint: z.string().min(1), armedHint: z.string().optional(), message: z.string().min(1),
    on: z.enum(['any', 'trainer', 'wild', 'boss']).default('any'),
    perks: z.array(ArchetypeModifierSchema).default([]),
    heal: z.boolean().optional(),
    items: z.array(z.object({ id: z.string().min(1), count: z.number().int().positive() })).optional(),
  }).optional(),
  status: z.enum(['supported', 'limited', 'disabled']), limits: z.string(),
});
export type BlessingDef = z.infer<typeof BlessingDefSchema>;

const FileSchema = z.object({
  tiers: z.record(z.enum(BLESSING_TIERS), z.object({ chance: z.number().positive(), influence: z.number().int().min(0) })),
  /** Discovery on: a save draws only from the blessings it knows (the `known` ones and those it found Signs of). */
  discovery: z.boolean().default(true),
  balance: z.object({ lele: z.object({ healPercent: z.number(), communionPartyPercent: z.number() }), fezandipiti: z.object({ discountPercent: z.number(), communionDiscountPercent: z.number() }), renegade: z.object({ ghostEncounterWeight: z.number().positive() }), zekrom: z.object({ vowStatPercent: z.number(), communionVowStatPercent: z.number() }) }),
  blessings: z.array(BlessingDefSchema).min(1),
});
const data = FileSchema.parse(raw);
export const BLESSINGS: readonly BlessingDef[] = data.blessings;
export const BLESSING_TIER_ODDS = data.tiers;

export { BlessingStateSchema, type BlessingState };

export const getBlessing = (id: string): BlessingDef | undefined => BLESSINGS.find((b) => b.id === id);
const playable = (b: BlessingDef): boolean => b.status !== 'disabled';

/**
 * Rolls the tier (45/30/17/6.5/1.5), then a blessing inside it. A tier with no playable blessing is left out of the roll, so its
 * share spreads over the other tiers in proportion (it never all lands on one neighbour). Pure: same seed, same answer.
 */
export function rollBlessing(seed: string, deck?: BlessingDeck): BlessingState | null {
  const pool = BLESSINGS.filter((b) => playable(b) && b.pool && (!deck || !data.discovery || b.known || deck.found.includes(b.id)));
  if (pool.length === 0) return null;
  const tiers = BLESSING_TIERS.filter((t) => pool.some((b) => b.tier === t));
  const tierRng = new Rng(hashSeed(`${seed}::blessing-tier`));
  const total = tiers.reduce((s, t) => s + data.tiers[t]!.chance, 0);
  let roll = tierRng.float() * total;
  let useTier: BlessingTier = tiers[tiers.length - 1]!;
  for (const t of tiers) {
    roll -= data.tiers[t]!.chance;
    if (roll < 0) { useTier = t; break; }
  }
  // Evenness: within a tier, blessings are dealt from a shuffled bag (the save remembers what it dealt), so each is seen before any repeats.
  const tierAll = pool.filter((b) => b.tier === useTier);
  const fresh = deck ? tierAll.filter((b) => !deck.dealt.includes(b.id)) : [];
  const inTier = fresh.length > 0 ? fresh : tierAll;
  const pick = inTier[new Rng(hashSeed(`${seed}::blessing-pick`)).int(0, inTier.length - 1)]!;
  return { id: pick.id, tier: pick.tier, influence: data.tiers[pick.tier]!.influence, seen: false, ashRegions: [], communion: false, riteUsed: false, stagesDone: [] };
}

/** What the save remembers of blessings across runs: which it has found (Discovery) and which it has dealt (the shuffled bag). */
export interface BlessingDeck { found: readonly string[]; dealt: readonly string[] }

/** Run end: the save's deck after this run. The run's blessing is dealt (a tier's bag starts over once every blessing it holds was dealt), and every Legendary whose Sign was found, and the run's own, is found. */
export function nextBlessingDeck(deck: BlessingDeck | undefined, run: RunState): { found: string[]; dealt: string[] } {
  const state = run.expansion?.blessing;
  const found = [...new Set([...(deck?.found ?? []), ...(state ? [state.id, ...(state.signs ?? [])] : [])])].filter((id) => getBlessing(id));
  let dealt = [...(deck?.dealt ?? [])];
  const def = state ? getBlessing(state.id) : undefined;
  if (def?.pool) {
    dealt = [...new Set([...dealt, def.id])];
    const known = BLESSINGS.filter((b) => b.tier === def.tier && playable(b) && b.pool && (!data.discovery || b.known || found.includes(b.id)));
    if (known.every((b) => dealt.includes(b.id))) dealt = dealt.filter((id) => getBlessing(id)?.tier !== def.tier);
  }
  return { found, dealt };
}

/** The hub's Reliquary: every playable blessing, tier by tier; the found ones (known from the start, or found in a run) show their words, the rest are blank plinths. */
export function reliquary(deck: BlessingDeck | undefined): { id: string; found: boolean; name: string; legendary: string; tier: BlessingTier; text: string }[] {
  return BLESSING_TIERS.flatMap((t) => BLESSINGS.filter((b) => b.tier === t && playable(b))).map((b) => ({
    id: b.id, found: !data.discovery || !!b.known || !!deck?.found.includes(b.id), name: b.name, legendary: b.legendary, tier: b.tier, text: b.summary,
  }));
}

/** A Sign of another Legendary was found this run (Discovery). */
export function noteSign(run: RunState, ids: readonly string[]): void {
  const state = run.expansion?.blessing;
  if (!state) return;
  const add = [...new Set(ids)].filter((id) => getBlessing(id) && !(state.signs ?? []).includes(id));
  if (add.length > 0) state.signs = [...(state.signs ?? []), ...add];
}

/** Section 7: the starter changes something for a few blessings (Influence, a perk, a Price waived). Once, when the starter is chosen. Returns the line to show. */
export function applyStarterNote(content: Content, run: RunState): string | null {
  const state = run.expansion?.blessing;
  const def = runBlessing(run);
  const starter = run.party[0];
  if (!state || !def?.starterNote || !starter || state.starterNote) return null;
  const note = def.starterNote;
  const types = content.species.get(starter.speciesId)?.types ?? [];
  if (!note.species.includes(starter.speciesId) && !note.types.some((t) => types.includes(t as never))) return null;
  state.starterNote = true;
  if (note.influence) state.influence += note.influence;
  return note.line;
}

/** Run start: gives the run its blessing when the setting was on (stored once; never changes). */
export function assignBlessing(run: RunState, deck?: BlessingDeck): void {
  const b = rollBlessing(run.seed, deck);
  if (b) run.expansion = { ...run.expansion, blessing: b };
  // Dialga's blessing is the Rewinds system, switched on for this run.
  if (b && getBlessing(b.id)?.effect.kind === 'rewinds') grantRewinds(run, 'blessing');
}

/**
 * A blessing offered mid-run (The Rift Whisper offers Giratina's): it takes the place of the run's blessing. Only when the run has one
 * (Blessings on); returns false otherwise. A blessing given up leaves nothing behind: Dialga's rewinds go with it. The Renegade's Price
 * (Ghost-types a step more common) joins the run's perks. Mutates `run`.
 */
export function takeBlessing(run: RunState, id: string): boolean {
  const def = getBlessing(id);
  const old = run.expansion?.blessing;
  if (!def || !playable(def) || !old || old.id === id) return false;
  const oldDef = getBlessing(old.id);
  if (oldDef?.effect.kind === 'rewinds' && run.expansion?.rewind?.source === 'blessing') {
    const { rewind: _gone, ...rest } = run.expansion;
    run.expansion = rest;
  }
  // The read-only mirror flags of the old blessing go quiet (syncLegendFlags sets the new ones).
  for (const k of Object.keys(run.story.flags)) if (k.startsWith('ev:blessing-')) delete run.story.flags[k];
  run.expansion = { ...run.expansion, blessing: { id: def.id, tier: def.tier, influence: data.tiers[def.tier]!.influence, seen: true, ashRegions: [], communion: false, riteUsed: false, stagesDone: [] } };
  if (def.effect.kind === 'reverseSide') run.perkEffects = [...(run.perkEffects ?? []), { kind: 'typeEncounterWeight', type: 'ghost', value: data.balance.renegade.ghostEncounterWeight }];
  return true;
}

/** The run's blessing definition, or undefined (setting off, old save, or disabled entry). */
export function runBlessing(run: RunState): BlessingDef | undefined {
  const id = run.expansion?.blessing?.id;
  const def = id ? getBlessing(id) : undefined;
  return def && playable(def) ? def : undefined;
}

/** A perk's bonus halved toward no change (1.15 -> 1.075, 0.5 -> 0.75; a Tailwind of 2 turns -> 1): The Empty Vessel's weaker copy. */
function weakerPerk<T extends Perks[number]>(p: T): T {
  const half = (v: number) => Math.round((1 + (v - 1) / 2) * 1000) / 1000;
  const out: Record<string, unknown> = { ...p };
  if (typeof out.value === 'number' && !Number.isInteger(out.value)) out.value = half(out.value);
  if (typeof out.first === 'number') out.first = half(out.first);
  if (p.kind === 'battleStart' && typeof out.turns === 'number') out.turns = Math.max(1, Math.floor(out.turns / 2));
  return out as T;
}

/** Blessings The Empty Vessel may copy: every playable rolled blessing except itself and Zekrom's (a vow is sworn at the opening). */
export const vesselCanCopy = (def: BlessingDef): boolean => playable(def) && def.pool && !['vessel', 'vow', 'reverseSide'].includes(def.effect.kind);

/**
 * The blessing whose effect the run has now. Usually the run's own; The Empty Vessel (Kyurem) has none until it copies one,
 * then a weaker copy of it (perk bonuses halved). The copy never reaches its own Communion form (see `inCommunionForm`).
 */
export function effectBlessing(run: RunState): BlessingDef | undefined {
  const def = runBlessing(run);
  if (def?.grows && inCommunionForm(run)) {
    const step = [...def.grows].reverse().find((g) => run.regionIndex >= g.region);
    const grown = step ? getBlessing(step.into) : undefined;
    if (grown && playable(grown)) return grown;
  }
  if (def?.effect.kind !== 'vessel') return def;
  const copy = run.expansion?.blessing?.copy ? getBlessing(run.expansion.blessing.copy) : undefined;
  if (!copy || !vesselCanCopy(copy)) return undefined;
  return { ...copy, perks: copy.perks.map(weakerPerk), communionPerks: undefined };
}

/** The blessing's Communion form is on (Kyurem's copy never has it: its Communion only gives the copy's Rite). */
export const inCommunionForm = (run: RunState): boolean => !!run.expansion?.blessing?.communion && !run.expansion.blessing.copy;

/** Price factor for shops (Fezandipiti): 0.9 with the blessing, otherwise 1. */
export function blessingShopFactor(run: RunState): number {
  if (effectBlessing(run)?.effect.kind !== 'shopDiscount') return 1;
  const pct = inCommunionForm(run) ? data.balance.fezandipiti.communionDiscountPercent : data.balance.fezandipiti.discountPercent;
  return 1 - pct / 100;
}

/** Zekrom: the vow is sworn and still kept (or held by the Rite). */
export const vowKept = (run: RunState): boolean => !!run.expansion?.blessing?.vow && !run.expansion.blessing.vowBroken;

/** Battle perks this blessing adds right now (empty for most). First-battle blessings drop out once the stage's first battle is done. */
export function blessingPerks(run: RunState): Perks {
  const def = effectBlessing(run);
  if (!def) return [];
  const state = run.expansion!.blessing!;
  const extra: Perks[number][] = [];
  // Zekrom: +10% to every stat (15% in Communion) while the vow is kept.
  if (def.effect.kind === 'vow' && vowKept(run)) {
    const pct = inCommunionForm(run) ? data.balance.zekrom.communionVowStatPercent : data.balance.zekrom.vowStatPercent;
    for (const stat of ['atk', 'def', 'spa', 'spd', 'spe'] as const) extra.push({ kind: 'statMultiplier', stat, value: 1 + pct / 100 });
  }
  // An armed Rite waits for its battle: Thundurus's the next trainer battle, Lugia's the next wild one, Heatran's the next boss.
  if (state.riteArmed && def.effect.kind === 'bolt') extra.push({ kind: 'foeLeadParalysed' });
  if (state.riteArmed && def.effect.kind === 'calm') extra.push({ kind: 'peacefulWild' });
  if (state.riteArmed && def.id === 'heatran') extra.push({ kind: 'eruptArena' });
  if (state.riteArmed && def.rite && riteBattle(def.rite.on, run)) extra.push(...def.rite.perks);
  if (def.badgeGrowth) {
    const g = def.badgeGrowth;
    const pct = Math.min(inCommunionForm(run) ? g.communionMax : g.max, g.step * run.badges.length);
    if (pct > 0) for (const stat of ['atk', 'def', 'spa', 'spd', 'spe'] as const) extra.push({ kind: 'statMultiplier', stat, value: Math.round((1 + pct) * 1000) / 1000 });
  }
  // A Price that stays (Kyogre, Groudon); a matching starter waives it for the first regions.
  if (def.pricePerks && !(state.starterNote && def.starterNote?.noPriceRegions && run.regionIndex < def.starterNote.noPriceRegions)) extra.push(...def.pricePerks);
  if (state.starterNote && def.starterNote?.perks) extra.push(...def.starterNote.perks);
  const own = inCommunionForm(run) && def.communionPerks ? def.communionPerks : def.perks;
  if (own.length === 0) return extra;
  if (def.firstBattleOfStage && !(def.communionAllBattles && inCommunionForm(run)) && run.stage && state.stagesDone.includes(`${run.regionIndex}:${run.stage.index}`)) return extra;
  return [...own, ...extra];
}

/** The battle running now is the kind a data Rite waits for. */
function riteBattle(on: NonNullable<BlessingDef['rite']>['on'], run: RunState): boolean {
  const b = run.battle;
  if (!b) return false;
  if (on === 'any') return true;
  if (on === 'boss') return isBossClass(b.trainer?.classId);
  return b.kind === on;
}

/** Communion: obtaining the blessing's own Legendary (party or PC) turns the blessing into its stronger form. Returns true the moment it happens. */
export function syncCommunion(run: RunState): boolean {
  const state = run.expansion?.blessing;
  const def = runBlessing(run);
  if (!state || !def || state.communion) return false;
  if (![...run.party, ...run.box].some((m) => m.speciesId === def.speciesId)) return false;
  state.communion = true;
  run.journal = [...(run.journal ?? []), `${def.legendary} answered: the ${def.name} blessing is now in Communion.`];
  return true;
}

/** The Rite (once per run, after Communion): what it is and whether it can be used. Tapu Lele's heals the party; Dialga's goes back a stage; Thundurus's bolt waits for the next trainer battle. */
export function blessingRite(run: RunState): { label: string; hint: string; ready: boolean } | null {
  const def = effectBlessing(run);
  const state = run.expansion?.blessing;
  if (!def || !state?.communion) return null;
  // A Rite written in the data comes first (it may sit on a blessing whose effect has a built-in Rite, like Uxie's insight).
  if (def.rite) return { label: def.rite.label, hint: state.riteArmed && def.rite.armedHint ? def.rite.armedHint : def.rite.hint, ready: !state.riteUsed };
  if (def.effect.kind === 'healMostHurt') return { label: 'Rite of Healing', hint: 'Restore the whole party fully, once this run.', ready: !state.riteUsed };
  if (def.effect.kind === 'rewinds') return { label: 'Rite of Time', hint: 'Go back to the start of this stage. Levels, moves and species are kept; items and events of the stage are not. Once this run, from the map.', ready: !state.riteUsed && run.phase === 'map' && stageRewindReady(run) };
  if (def.effect.kind === 'bolt') return { label: 'A Bolt on Request', hint: state.riteArmed ? 'Armed: the lead of your next trainer battle starts paralysed.' : 'The lead of your next trainer battle starts paralysed (not a boss\'s last Pokémon, not an Electric-type). Once this run.', ready: !state.riteUsed };
  if (def.effect.kind === 'calm') return { label: 'The Song', hint: state.riteArmed ? 'Armed: your next wild battle ends in peace, with full rewards.' : 'Your next wild battle (single) ends in peace before anyone moves, with full rewards. Once this run.', ready: !state.riteUsed };
  if (def.id === 'heatran') return { label: 'Erupt', hint: state.riteArmed ? 'Armed: your next boss battle starts with the arena burned clean.' : 'Your next boss battle starts with every hazard on your side, the weather and the terrain burned away. Once this run.', ready: !state.riteUsed };
  if (def.effect.kind === 'sight') return { label: 'Shared Sight', hint: 'For the rest of this stage, see every battle ahead (the whole team) and the Gym Leader\'s team. Once this run, from the map.', ready: !state.riteUsed && run.phase === 'map' && !!run.stage };
  if (def.id === 'landorus') return { label: 'Fertile Ground', hint: 'Where you stand, a shop opens and a Berry grove gives three Sitrus Berries. Once this run, from the map.', ready: !state.riteUsed && run.phase === 'map' && run.stage?.current != null };
  if (def.effect.kind === 'insight') return { label: 'The Real Plan', hint: 'Your rival\'s plan is shown, and for the rest of this stage the Gym Leader\'s team. Once this run, from the map.', ready: !state.riteUsed && run.phase === 'map' && !!run.stage };
  if (def.effect.kind === 'fold') return { label: 'Design the Road', hint: 'Rearrange this stage now, even after you have set out: any two nodes ahead of you may change places. Once this run, from the map.', ready: !state.riteUsed && run.phase === 'map' && run.stage?.kind === 'stage' };
  if (def.effect.kind === 'vow') return { label: 'The Vow Holds', hint: state.riteUsed ? 'Used: the vow held once when it would have broken.' : 'Once, when your vow would break, it holds instead. It works by itself.', ready: false };
  return null;
}

/** Uses the Rite. Returns the run to carry on with (Dialga's is a rebuilt run, the others the same one, mutated) and a message, or null when it can't be used. */
export function useBlessingRite(content: Content, run: RunState): { run: RunState; message: string } | null {
  const rite = blessingRite(run);
  if (!rite?.ready) return null;
  const dataRite = effectBlessing(run)!.rite;
  if (dataRite) {
    const state = run.expansion!.blessing!;
    state.riteUsed = true;
    if (dataRite.perks.length > 0) state.riteArmed = true;
    if (dataRite.heal) for (const m of run.party) { m.hp = maxHp(content, m); m.status = null; }
    if (dataRite.items) {
      const rng = new Rng(hashSeed(`${run.seed}::blessing-rite`));
      for (const it of dataRite.items) giveItem(content, run, it.id, it.count, rng);
    }
    run.journal = [...(run.journal ?? []), dataRite.message];
    return { run, message: dataRite.message };
  }
  const kind = effectBlessing(run)!.effect.kind;
  if (kind === 'rewinds') {
    const back = rewindStage(content, run, { keepTeam: true });
    if (!back) return null;
    // The blessing's own state is live, not the stage-start copy: no second Rite, no second Sacred Ash.
    back.expansion = { ...back.expansion, blessing: { ...jsonCopy(run.expansion!.blessing!), riteUsed: true } };
    return { run: back, message: 'Dialga turns the hourglass: the stage begins again.' };
  }
  const def = effectBlessing(run)!;
  const state = run.expansion!.blessing!;
  if (kind === 'bolt' || kind === 'calm' || def.id === 'heatran') {
    state.riteUsed = true;
    state.riteArmed = true;
    const message = kind === 'bolt' ? 'Thundurus laughs somewhere above the clouds. The next trainer you meet will feel it first.'
      : kind === 'calm' ? 'Lugia\'s song waits under the sea. The next wild Pokémon you meet will hear it.'
      : 'Deep below, the mountain gathers itself. The next boss\'s arena will burn clean.';
    return { run, message };
  }
  if (kind === 'fold') {
    state.riteUsed = true;
    state.folds = [...(state.folds ?? []), `rite:${run.regionIndex}:${run.stage!.index}`];
    return { run, message: 'Palkia opens its hand: the road ahead is yours to arrange. Choose "Rearrange the road".' };
  }
  const stageKey = `${run.regionIndex ?? 0}:${run.stage!.kind}:${run.stage!.index}`;
  if (kind === 'sight') {
    state.riteUsed = true;
    run.itemCounters = { ...run.itemCounters, [`rift-preview:${stageKey}`]: 1, [`gym-preview:${stageKey}`]: 1 };
    return { run, message: 'Latias folds the light around you: every battle on this stage is in plain sight.' };
  }
  if (def.id === 'landorus') {
    state.riteUsed = true;
    const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
    here.sides.push({ id: `event-stop-${here.sides.length + 1}-${here.id}`, kind: 'shop', used: false });
    giveItem(content, run, 'sitrus-berry', 3, new Rng(hashSeed(`${run.seed}::blessing-grove`)));
    return { run, message: 'Rain falls on dry earth. Where you stand, a market springs up, and a Berry grove gives you three Sitrus Berries.' };
  }
  if (kind === 'insight') {
    state.riteUsed = true;
    run.itemCounters = { ...run.itemCounters, [`gym-preview:${stageKey}`]: 1 };
    const rival = run.story.rivals.find((r) => run.expansion?.rival?.[r.id]?.role === 'main') ?? run.story.rivals.find((r) => r.state !== 'retired');
    const plan = rival ? ` ${rival.name} will not tell you, but the white fire does: ${rival.identity ? `their team is being rebuilt around ${rival.identity.type}-types` : `they fight in the ${rival.style} style`}${rival.ace ? `, and everything rests on ${content.species.get(rival.ace)?.name ?? rival.ace}` : ''}.` : '';
    const line = `Reshiram's fire shows the truth. The Gym Leader's team is plain to see.${plan}`;
    run.journal = [...(run.journal ?? []), line];
    return { run, message: line };
  }
  for (const m of run.party) { m.hp = maxHp(content, m); m.status = null; }
  run.expansion!.blessing!.riteUsed = true;
  return { run, message: 'Tapu Lele scatters its petals: the whole party is restored.' };
}

/** Ride (Koraidon) or warp (Cosmog): the map action is open now (uses left this stage, on the map, not already riding). */
export function rideReady(run: RunState): { label: string; left: number } | null {
  const def = effectBlessing(run);
  const state = run.expansion?.blessing;
  const stage = run.stage;
  if (!def?.ride || !state || run.phase !== 'map' || !stage || stage.pseudo || run.moveMode) return null;
  const key = `${run.regionIndex}:${stage.kind}:${stage.index}`;
  const used = (state.rides ?? []).filter((r) => r === key).length;
  const left = (inCommunionForm(run) ? def.ride.communionPerStage : def.ride.perStage) - used;
  return left > 0 ? { label: def.ride.label, left } : null;
}

/** Takes the ride: the next move may go to any node of the next level, whatever the paths. Returns the message, or null. */
export function takeRide(run: RunState): string | null {
  const ready = rideReady(run);
  if (!ready) return null;
  const stage = run.stage!;
  const state = run.expansion!.blessing!;
  state.rides = [...(state.rides ?? []), `${run.regionIndex}:${stage.kind}:${stage.index}`];
  run.moveMode = 'acroBike';
  return `${ready.label}: pick any node of the next level, whatever the paths.`;
}

/**
 * Palkia, The Space Traveller: the nodes of this stage that may change places now, or [] when folding is closed.
 * Open once per region, on one stage, before its first node is entered (as often as the player likes until then); the Rite
 * opens the current stage again even after setting out. Never the final node, nor one already reached.
 */
export function foldNodes(run: RunState): MapNode[] {
  const def = effectBlessing(run);
  const state = run.expansion?.blessing;
  const stage = run.stage;
  if (def?.effect.kind !== 'fold' || !state || run.phase !== 'map' || !stage || stage.kind !== 'stage') return [];
  const key = `${run.regionIndex}:${stage.index}`;
  const folds = state.folds ?? [];
  const byRite = folds.includes(`rite:${key}`);
  const thisRegion = folds.some((f) => !f.startsWith('rite:') && f.split(':')[0] === String(run.regionIndex));
  if (!byRite && (stage.current !== null || (thisRegion && !folds.includes(key)))) return [];
  const here = stage.current ? stage.map.nodes.find((n) => n.id === stage.current)?.column ?? 0 : 0;
  return stage.map.nodes.filter((n) => n.column > here && n.column < stage.map.columns && !stage.visited.includes(n.id) && n.kind !== 'gym');
}

/** Palkia: two nodes change places. The paths stay where they are; what waits at each node moves. Returns the message, or null. */
export function foldSwap(run: RunState, a: string, b: string): string | null {
  const open = foldNodes(run);
  const x = open.find((n) => n.id === a);
  const y = open.find((n) => n.id === b);
  if (!x || !y || a === b) return null;
  const moved = ['kind', 'harder', 'sides', 'name', 'storyStops', 'ace', 'doubles', 'roomEvent', 'roomKind', 'note'] as const;
  const xr = x as Record<string, unknown>;
  const yr = y as Record<string, unknown>;
  for (const f of moved) {
    const keep = xr[f];
    if (yr[f] === undefined) delete xr[f]; else xr[f] = yr[f];
    if (keep === undefined) delete yr[f]; else yr[f] = keep;
  }
  const state = run.expansion!.blessing!;
  const key = `${run.regionIndex}:${run.stage!.index}`;
  if (!(state.folds ?? []).includes(key) && !(state.folds ?? []).includes(`rite:${key}`)) state.folds = [...(state.folds ?? []), key];
  return `Palkia folds the road: level ${x.column} and level ${y.column} change places.`;
}

/**
 * Zekrom: the vow breaks (once broken, the bonus is gone). In Communion the Rite holds it the first time instead. Returns the journal line.
 * `vow` names which vow the act breaks; nothing happens for a different vow, another blessing, or a vow already broken.
 */
export function breakVow(run: RunState, vow: NonNullable<BlessingState['vow']>): string | null {
  const state = run.expansion?.blessing;
  if (effectBlessing(run)?.effect.kind !== 'vow' || !state || state.vow !== vow || state.vowBroken) return null;
  if (state.communion && !state.riteUsed) {
    state.riteUsed = true;
    const line = 'The vow should have broken. Zekrom would not let it: the vow holds.';
    run.journal = [...(run.journal ?? []), line];
    return line;
  }
  state.vowBroken = true;
  const line = 'The vow is broken. The black stone goes quiet.';
  run.journal = [...(run.journal ?? []), line];
  return line;
}

/** Zekrom's vow Strike no one first: the first damage of a trainer battle must not be yours. Reads one turn's engine events (mutates `run`). */
export function noteFirstBlood(run: RunState, events: readonly { type: string; side?: string }[]): string | null {
  const b = run.battle;
  if (!b || b.kind !== 'trainer' || run.expansion?.blessing?.vow !== 'strike-no-one-first' || b.storyEffects.includes('first-blood')) return null;
  const first = events.find((e) => e.type === 'damage');
  if (!first) return null;
  b.storyEffects.push('first-blood');
  return first.side === 'enemy' ? breakVow(run, 'strike-no-one-first') : null;
}

/** Zekrom: the three vows of the opening (two are built; see the blessing's limits). */
export const VOWS: ReadonlyArray<{ id: NonNullable<BlessingState['vow']>; label: string; text: string }> = [
  { id: 'no-one-behind', label: 'Leave no Pokémon behind', text: 'Release or trade away no Pokémon this run.' },
  { id: 'strike-no-one-first', label: 'Strike no one first', text: 'In trainer battles, never be the first to deal damage.' },
];

/** Zekrom's opening: swears the vow (once). Returns false when there is nothing to swear. */
export function swearVow(run: RunState, vow: NonNullable<BlessingState['vow']>): boolean {
  const state = run.expansion?.blessing;
  if (runBlessing(run)?.effect.kind !== 'vow' || !state || state.vow) return false;
  state.vow = vow;
  return true;
}

/** Lugia, The Guardian of the Sea: why the Calm can't be called in this battle now, or null when it can. Once per stage, single battles. */
export function calmProblem(run: RunState): string | null {
  const b = run.battle;
  if (run.phase !== 'battle' || !b || b.outcome) return 'Not in a battle.';
  if (effectBlessing(run)?.effect.kind !== 'calm') return 'Only Lugia\'s blessing calls the Calm.';
  if (b.doubles) return 'Not in a double battle.';
  if (run.expansion!.blessing!.calmStages?.includes(calmKey(run))) return 'Once per stage.';
  return null;
}
const calmKey = (run: RunState): string => `${run.regionIndex}:${run.stage?.index ?? 0}`;

/**
 * Calls the Calm: weather, terrain and every stat change on both sides are cleared (in Communion the player's own boosts stay).
 * Uses no random number and does not take the turn. Mutates `run`; returns the message, or null when it can't be used.
 */
export function callCalm(run: RunState): string | null {
  if (calmProblem(run)) return null;
  const b = run.battle!;
  const state = run.expansion!.blessing!;
  state.calmStages = [...(state.calmStages ?? []), calmKey(run)];
  b.weather = null;
  b.terrain = null;
  const keepMine = inCommunionForm(run);
  for (const k of Object.keys(b.enemyStages) as (keyof typeof b.enemyStages)[]) b.enemyStages[k] = 0;
  for (const k of Object.keys(b.playerStages) as (keyof typeof b.playerStages)[]) if (!keepMine || b.playerStages[k] < 0) b.playerStages[k] = 0;
  return keepMine ? 'Lugia\'s Calm: the sea goes flat. The storm and every trick of the foe are gone; your own strength stays.' : 'Lugia\'s Calm: the sea goes flat. Weather, terrain and every stat change are gone.';
}

/**
 * The Empty Vessel (Kyurem): the first Sign of another Legendary that has a blessing fills it; it becomes a weaker copy of that
 * blessing for the rest of the run. `who` is a species id or a Sign group (the first member with a blessing). Returns the journal line.
 */
export function fillVessel(run: RunState, who: string, groups: Readonly<Record<string, readonly string[]>>): string | null {
  const state = run.expansion?.blessing;
  if (runBlessing(run)?.effect.kind !== 'vessel' || !state || state.copy) return null;
  const names = groups[who] ?? [who];
  const pick = names.map((sp) => BLESSINGS.find((b) => b.speciesId === sp && vesselCanCopy(b))).find(Boolean);
  if (!pick) return null;
  state.copy = pick.id;
  if (pick.effect.kind === 'rewinds') grantRewinds(run, 'blessing');
  const line = `The Empty Vessel fills: it takes the shape of ${pick.legendary}'s blessing, ${pick.name} (a weaker copy).`;
  run.journal = [...(run.journal ?? []), line];
  return line;
}

/**
 * After a fight that was not lost (mutates `run`, runs before a Nuzlocke burial):
 * Sacred Ash revives every fainted Pokémon once per region; Tapu Lele heals the most hurt living Pokémon 10%.
 * Returns the names' uids it touched (for tests and the journal).
 */
export function blessingAfterBattle(content: Content, run: RunState): string[] {
  const state = run.expansion?.blessing;
  if (!runBlessing(run) || !state) return [];
  const touched: string[] = [];
  syncCommunion(run);
  const def = effectBlessing(run);
  if (!def) return touched;
  // An armed Rite is spent by the battle it waited for.
  const fx = run.battle?.storyEffects ?? [];
  if (state.riteArmed && ((def.effect.kind === 'bolt' && run.battle?.kind === 'trainer') || (def.effect.kind === 'calm' && fx.includes('song-of-peace')) || (def.id === 'heatran' && fx.includes('erupt')) || (def.rite && riteBattle(def.rite.on, run)))) state.riteArmed = false;
  if (def.firstBattleOfStage && run.stage) {
    const key = `${run.regionIndex}:${run.stage.index}`;
    if (!state.stagesDone.includes(key)) state.stagesDone = [...state.stagesDone, key];
  }
  if (def.effect.kind === 'sacredAsh' && !state.ashRegions.includes(run.regionIndex)) {
    const fallen = run.party.filter((m) => m.hp <= 0 && m.uid !== run.battle?.loaner);
    if (fallen.length > 0) {
      for (const m of fallen) { m.hp = maxHp(content, m); m.status = null; touched.push(m.uid); }
      state.ashRegions = [...state.ashRegions, run.regionIndex];
    }
  }
  if (def.effect.kind === 'healMostHurt') {
    let worst: { uid: string; missing: number } | null = null;
    for (const m of run.party) {
      if (m.hp <= 0 || m.uid === run.battle?.loaner) continue;
      const missing = maxHp(content, m) - m.hp;
      if (missing > 0 && (!worst || missing > worst.missing)) worst = { uid: m.uid, missing };
    }
    if (worst) {
      const m = run.party.find((p) => p.uid === worst!.uid)!;
      m.hp = Math.min(maxHp(content, m), m.hp + Math.max(1, Math.ceil(maxHp(content, m) * data.balance.lele.healPercent / 100)));
      touched.push(m.uid);
    }
    // Communion: the rest of the party recovers a little too.
    if (inCommunionForm(run)) {
      for (const m of run.party) {
        if (m.hp <= 0 || m.uid === run.battle?.loaner || m.uid === worst?.uid) continue;
        m.hp = Math.min(maxHp(content, m), m.hp + Math.ceil(maxHp(content, m) * data.balance.lele.communionPartyPercent / 100));
      }
    }
  }
  // Ho-Oh in Communion: after a boss battle the first fainted Pokémon (party order) rises at half HP.
  if (def.effect.kind === 'sacredAsh' && inCommunionForm(run) && run.battle && isBossClass(run.battle.trainer?.classId)) {
    const m = run.party.find((p) => p.hp <= 0 && p.uid !== run.battle?.loaner);
    if (m) { m.hp = Math.max(1, Math.floor(maxHp(content, m) / 2)); touched.push(m.uid); }
  }
  return touched;
}

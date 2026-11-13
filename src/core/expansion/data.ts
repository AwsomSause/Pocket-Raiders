// Beta 0.6 INSTRUMENTALITY data pipeline (slice F4/E0): the shape of src/data/expansion/*.json.
// The files are built by `npm run data:expansion` (tools/build-expansion.ts) from the ten expanded scripts in
// tools/sources/expansion/. Never edit them by hand. Pure data + Zod, no Phaser.

import { z } from 'zod';

const id = (prefix: string) => z.string().regex(new RegExp(`^${prefix}\\.[a-z0-9-]+\\.[a-z0-9-]+$`));
const text = z.string().min(1);

/** Which script a row came from: 'any' is the roaming cast (script 00), the rest are the nine regions. */
export const EXPANSION_REGIONS = ['any', 'kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'paldea'] as const;
export const ExpansionRegionSchema = z.enum(EXPANSION_REGIONS);
export type ExpansionRegion = z.infer<typeof ExpansionRegionSchema>;

export const SHADOW_TIERS = ['1 Veiled', '2 Bound', '3 Gripped', '4 Fallen'] as const;

export const ExpansionCharacterSchema = z.object({
  id: id('sc'), team: z.string(), region: ExpansionRegionSchema, name: text, rank: text, basedOn: text, role: text, ace: text, voice: text,
});
export const SpecialPokemonSchema = z.object({
  id: id('sv'), team: z.string(), region: ExpansionRegionSchema, name: text, species: z.array(text).min(1), trait: text, where: text, obtainable: text,
});
export const SpecialShadowSchema = z.object({
  id: id('ss'), team: z.string(), region: ExpansionRegionSchema,
  /** XD001 to XD012 for Apex Shadows, otherwise null. */
  code: z.string().regex(/^XD\d{3}$/).nullable(), apex: z.boolean(),
  name: text, species: z.array(text).min(1), tier: z.enum(SHADOW_TIERS), ability: text, moves: z.array(text).min(1), purification: text, where: text,
});
export const VariantLineSchema = z.object({ rule: text, text, region: ExpansionRegionSchema });
export const SignatureMoveSchema = z.object({ name: text, text, region: ExpansionRegionSchema });
export const ExpansionEventRefSchema = z.object({ id: z.string().regex(/^xe\.[a-z0-9-]+\.[a-z0-9-]+$/), region: ExpansionRegionSchema });
export const ExpansionRaidRefSchema = z.object({ id: z.string().regex(/^pr\.[a-z0-9-]+\.[a-z0-9-]+$/), region: ExpansionRegionSchema });

/** The five counts the content gate holds the data to (plan F4). */
export const EXPANSION_COUNTS = { characters: 143, specialPokemon: 110, specialShadows: 58, events: 80, raids: 20 } as const;
export const EXPANSION_APEX_COUNT = 12;

/** E2: one world-state track per script, steps 1 to 5. */
export const TrackStepSchema = z.object({
  /** The row label as written: "1" to "5", or "3a/3b/3c" where one step has parts (Sinnoh's three lakes). */
  step: z.string().regex(/^[1-5][a-c]?$/), name: text,
  /** The regional rule (or, for the finale, the effect at the Finale). */
  rule: text,
  /** Civilian mood, or when the step is gained (finale). */
  note: text,
});
export const TrackSchema = z.object({
  id: z.string().regex(/^track\.[a-z]+$/), region: ExpansionRegionSchema, name: text,
  /** What the script says about gaining and losing steps. */
  gain: text.nullable(),
  steps: z.array(TrackStepSchema).min(5).max(7),
});

/** E4/E5: the Phase 0b Siege Map (districts, gates, bridges, stadiums or bases, depending on the region). */
export const SiegeDistrictSchema = z.object({ name: text, location: z.string().nullable(), heldIf: text, ifLost: text });
export const SiegeMapSchema = z.object({
  id: z.string().regex(/^siege\.[a-z]+$/), region: ExpansionRegionSchema, title: text,
  /** What the first column is called in the script: District, Bridge, Stadium, Base, Approach. */
  unit: text, rules: z.array(text), districts: z.array(SiegeDistrictSchema).min(3),
});

/** E5: the Extended Cut phase list. */
export const ClimaxPhaseSchema = z.object({
  phase: z.string().regex(/^\d+b?$|^—$/), name: text, format: text, source: text, battles: text,
  /** The script heading for the phase's own section (null for the breather and for base phases without one). */
  heading: text.nullable(),
});
export const ClimaxExtendedSchema = z.object({
  id: z.string().regex(/^climax\.[a-z]+$/), region: ExpansionRegionSchema, title: text, intro: text.nullable(), phases: z.array(ClimaxPhaseSchema).min(8),
});

/** E6: Apex Shadows XD001 to XD012, with the Phase 6 Colossus (or Finale) they appear in. */
export const ApexSchema = z.object({
  id: id('ss'), code: z.string().regex(/^XD\d{3}$/), team: z.string(), region: ExpansionRegionSchema,
  name: text, species: z.array(text).min(1), tier: z.enum(SHADOW_TIERS), ability: text, moves: z.array(text).min(1), purification: text, where: text,
  phase: z.object({ heading: text, format: text.nullable(), timer: text.nullable() }),
});

export type ExpansionCharacter = z.infer<typeof ExpansionCharacterSchema>;
export type SpecialPokemon = z.infer<typeof SpecialPokemonSchema>;
export type SpecialShadow = z.infer<typeof SpecialShadowSchema>;
export type Track = z.infer<typeof TrackSchema>;
export type SiegeMap = z.infer<typeof SiegeMapSchema>;
export type ClimaxExtended = z.infer<typeof ClimaxExtendedSchema>;
export type Apex = z.infer<typeof ApexSchema>;

/** One file per kind under src/data/expansion/. */
export const ExpansionFileSchemas = {
  characters: z.array(ExpansionCharacterSchema),
  specialPokemon: z.array(SpecialPokemonSchema),
  specialShadows: z.array(SpecialShadowSchema),
  variantLines: z.array(VariantLineSchema),
  signatureMoves: z.array(SignatureMoveSchema),
  events: z.array(ExpansionEventRefSchema),
  raids: z.array(ExpansionRaidRefSchema),
  tracks: z.array(TrackSchema),
  siege_maps: z.array(SiegeMapSchema),
  climax_extended: z.array(ClimaxExtendedSchema),
  apex: z.array(ApexSchema),
} as const;
export type ExpansionFileName = keyof typeof ExpansionFileSchemas;
export type ExpansionData = { [K in ExpansionFileName]: z.infer<(typeof ExpansionFileSchemas)[K]> };

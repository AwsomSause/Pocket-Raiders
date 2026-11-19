// Claude AI (Dominion slice D18): shapes of the data file and of the run's AI log (`run.ai`, run v47).
// Pure Zod; no network, no Phaser, no key. Design: plans/claude-api/CLAUDE_API_DRAFT.md sections 0, 1, 8, 9.

import { z } from 'zod';

/** Settings row "Claude AI": Off / Light (dialogue only) / Standard (default, Kice 2026-11-18) / Rich (bigger models for big moments). */
export const AI_TIERS = ['off', 'light', 'standard', 'rich'] as const;
export const AiTierSchema = z.enum(AI_TIERS);
export type AiTier = z.infer<typeof AiTierSchema>;

export const AI_MODELS = ['haiku', 'sonnet', 'opus'] as const;
export const AiModelKeySchema = z.enum(AI_MODELS);
export type AiModelKey = z.infer<typeof AiModelKeySchema>;

/** What kind of call: a spoken line, a structured judgement/pick, or a big moment. Each picks its model per tier. */
export const AI_ROLES = ['line', 'judge', 'big'] as const;
export const AiRoleSchema = z.enum(AI_ROLES);
export type AiRole = z.infer<typeof AiRoleSchema>;

/**
 * "Use Claude for" (Settings > Claude AI, mockup a1): single uses switched on or off. Each later slice reads its own:
 * battle choices and rival teams (campaign, CLAUDE_API_DRAFT sections 2-3), battle quips (section 4), typed arguments
 * (D20 the Debate), crew chatter and Ledger news (D25). A use that is off plays offline.
 */
export const CLAUDE_USES = ['battle', 'teams', 'quips', 'typed', 'chatter', 'news'] as const;
export type ClaudeUse = (typeof CLAUDE_USES)[number];
export const CLAUDE_USE_LABELS: Record<ClaudeUse, string> = { battle: 'Battle choices', teams: 'Rival teams', quips: 'Battle quips', typed: 'Typed arguments', chatter: 'Crew chatter', news: 'Ledger news' };
export const ClaudeUsesSchema = z.object({
  /** Battle choices: Off, Rivals only (the mockup's default) or every trainer. */
  battle: z.enum(['off', 'rivals', 'all']),
  teams: z.boolean(),
  quips: z.boolean(),
  typed: z.boolean(),
  chatter: z.boolean(),
  news: z.boolean(),
});
export type ClaudeUses = z.infer<typeof ClaudeUsesSchema>;
export const CLAUDE_USES_DEFAULT: ClaudeUses = { battle: 'rivals', teams: true, quips: true, typed: true, chatter: true, news: false };
export const useOn = (uses: ClaudeUses, use: ClaudeUse): boolean => (use === 'battle' ? uses.battle !== 'off' : uses[use]);

const Usd = z.number().min(0);
const ModelSchema = z.object({
  id: z.string().regex(/^claude-[a-z0-9-]+$/),
  label: z.string(),
  /** List prices per million tokens. */
  input: Usd,
  output: Usd,
  cacheRead: Usd,
  cacheWrite: Usd,
  effort: z.enum(['low', 'medium', 'high']),
  /** Turn thinking off for speed (only models that accept it: Haiku 5.5 at effort high or below). */
  thinkingOff: z.boolean(),
});

/** A role's model at each tier; a tier left out means that role plays offline at that tier. */
const RoleSchema = z.object({ doc: z.string(), light: AiModelKeySchema.optional(), standard: AiModelKeySchema.optional(), rich: AiModelKeySchema.optional() });

/** A Key-Card: its code name, foil colours, and the Legendary and orb drawn on it (art in images/dominion/). */
const KeyCardSchema = z.object({ id: z.string().regex(/^[a-z]+$/), name: z.string(), k1: z.string(), k2: z.string(), legend: z.string(), orb: z.string() });
export type KeyCard = z.infer<typeof KeyCardSchema>;

const PerCall = z.object({ line: z.number().int().positive(), judge: z.number().int().positive(), big: z.number().int().positive(), test: z.number().int().positive() });

export const AiFileSchema = z.object({
  _doc: z.string(),
  /** Kice 2026-11-18: $10 per key for the whole game (the friendly counter; the real guard is the key's Console workspace limit). */
  spendCapUsd: z.number().positive(),
  models: z.record(AiModelKeySchema, ModelSchema),
  roles: z.record(AiRoleSchema, RoleSchema),
  timeoutMs: PerCall,
  maxTokens: PerCall,
  /** Size guard for `run.ai`: one stored answer, and the whole log, in characters of JSON. */
  log: z.object({ maxEntryChars: z.number().int().positive(), maxLogChars: z.number().int().positive() }),
  /** Typed player text is clamped to this many characters before it goes in a prompt. */
  playerText: z.object({ maxChars: z.number().int().positive() }),
  keyCards: z.array(KeyCardSchema).length(5),
  /** The Settings page's four tier tiles (mockup a1): what each turns on and a rough cost per Dominion run. `|` breaks a line. */
  tiers: z.record(AiTierSchema, z.object({ label: z.string(), blurb: z.string(), runUsd: z.number().min(0), note: z.string(), c: z.string() })),
});
export type AiFile = z.infer<typeof AiFileSchema>;

/**
 * One stored AI answer, keyed by call id in `run.ai`.
 * - `s: 'ai'`: Claude answered; `v` is the validated answer (a string or the structured object) and `m` the model key.
 * - `s: 'off'`: the offline answer is used (no key, tier off, spend used up, failure, timeout, refusal, invalid JSON).
 *   The offline answer comes from the game's own written data and state, so it isn't copied into the save.
 * - `s: 'wait'`: a call was in flight when the run was saved. A reload treats it as `off` and never calls again.
 */
export const AiEntrySchema = z.object({
  s: z.enum(['ai', 'off', 'wait']),
  v: z.unknown().optional(),
  m: AiModelKeySchema.optional(),
});
export type AiEntry = z.infer<typeof AiEntrySchema>;

export const AiLogSchema = z.record(z.string(), AiEntrySchema);
export type AiLog = z.infer<typeof AiLogSchema>;

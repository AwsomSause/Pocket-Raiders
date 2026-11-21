// Claude AI rules (Dominion slice D18). Pure: which model a call uses, what it cost, the spend line, the key's
// shape, typed-text wrapping, and reading/writing the run's AI log. No network, no key storage, no gameplay RNG.

import raw from '../../data/ai/claude.json';
import { AiFileSchema, type AiEntry, type AiFile, type AiLog, type AiModelKey, type AiRole, type AiTier } from './schema';

export const AI_DATA: AiFile = AiFileSchema.parse(raw);

/**
 * The tier that really applies: Off without a key or once the key's $10 is used up, else the setting.
 * (The setting defaults to Standard; with no Key-Card the game simply plays offline.)
 */
export function effectiveTier(setting: AiTier, hasKey: boolean, usedUp: boolean): AiTier {
  return !hasKey || usedUp ? 'off' : setting;
}

/** The model a role uses at a tier, or null when that role plays offline at that tier (always at Off). */
export function modelFor(role: AiRole, tier: AiTier, data: AiFile = AI_DATA): AiModelKey | null {
  if (tier === 'off') return null;
  return data.roles[role][tier] ?? null;
}

export interface AiUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

/** What one response cost in US dollars, from its usage and the model's list prices. */
export function costOf(model: AiModelKey, usage: AiUsage, data: AiFile = AI_DATA): number {
  const p = data.models[model];
  const m = 1_000_000;
  return (usage.input_tokens * p.input + usage.output_tokens * p.output + (usage.cache_read_input_tokens ?? 0) * p.cacheRead + (usage.cache_creation_input_tokens ?? 0) * p.cacheWrite) / m;
}

export function usedUp(spentUsd: number, data: AiFile = AI_DATA): boolean {
  return spentUsd >= data.spendCapUsd;
}

/** "Rotom used: $3.20 of $10" (never shows more than the cap). */
export function spendLine(spentUsd: number, data: AiFile = AI_DATA): string {
  const shown = Math.min(Math.max(spentUsd, 0), data.spendCapUsd);
  return `Rotom used: $${shown.toFixed(2)} of $${data.spendCapUsd}`;
}

export const USED_UP_LINE = 'This key is used up. Ask for a new one. The game plays offline until then.';

/** The shape check before any call: an Anthropic API key starts `sk-ant-`. An admin key is refused. */
export function keyShapeOk(key: string): boolean {
  const k = key.trim();
  return /^sk-ant-[A-Za-z0-9_-]{20,300}$/.test(k) && !k.startsWith('sk-ant-admin');
}

/**
 * Typed player text is data, not instructions: trimmed, clamped, angle brackets escaped, and wrapped in a tag the
 * system prompt names. Control characters are dropped.
 */
export function wrapPlayerText(text: string, tag = 'player_text', data: AiFile = AI_DATA): string {
  // eslint-disable-next-line no-control-regex
  const clean = text.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim().slice(0, data.playerText.maxChars);
  const safe = clean.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<${tag}>${safe}</${tag}>`;
}

/** A stored answer for this call id, if any. `wait` (in flight at save time) reads as offline. */
export function storedAnswer(log: AiLog | undefined, id: string): AiEntry | null {
  const e = log?.[id];
  if (!e) return null;
  return e.s === 'wait' ? { s: 'off' } : e;
}

/**
 * Puts an answer in the log. An answer too big for one entry, or one that would push the log past its budget,
 * is stored as `off` (the offline answer), so the save stays small and a reload never calls again.
 */
export function putAnswer(log: AiLog, id: string, entry: AiEntry, data: AiFile = AI_DATA): AiEntry {
  let e = entry;
  if (e.s === 'ai') {
    const size = JSON.stringify(e).length;
    const total = JSON.stringify(log).length - JSON.stringify(log[id] ?? {}).length + size + id.length + 4;
    if (size > data.log.maxEntryChars || total > data.log.maxLogChars) e = { s: 'off' };
  }
  log[id] = e;
  return e;
}

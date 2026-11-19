// The wire to Claude (Dominion slice D18). One small interface with two makers:
// - `sdkTransport()`: the official @anthropic-ai/sdk, loaded only when a call is made (its own file in the build), called
//   straight from the browser with the player's own key (`dangerouslyAllowBrowser`). Requests go only to api.anthropic.com.
// - `fakeTransport()`: canned answers, no network. Unit tests, CI and `?aifake=1` use it.

import type { z } from 'zod';
import type { AiModelKey } from '../core/ai/schema';
import type { AiUsage } from '../core/ai/rules';

export interface WireRequest {
  /** What the call is (a call id or 'test'); the fake transport looks its answer up by this. */
  tag: string;
  model: string;
  modelKey: AiModelKey;
  /** Stable part first (rules, character sheet, legal lists), cached. */
  system: string;
  /** A second stable part (this scene's facts), cached too. */
  context?: string;
  /** This turn's changing part. */
  input: string;
  maxTokens: number;
  effort: 'low' | 'medium' | 'high';
  thinkingOff: boolean;
  /** A structured answer: the reply is JSON for this schema. */
  schema?: z.ZodType;
  /** Second try after an answer that didn't fit the schema. */
  repair?: { bad: string; error: string };
  timeoutMs: number;
}

export interface WireResult {
  text: string;
  /** end_turn, max_tokens, refusal, ... */
  stop: string | null;
  usage: AiUsage;
}

export type WireFailure = 'auth' | 'rate' | 'timeout' | 'network' | 'bad-request' | 'server';

export class AiCallError extends Error {
  constructor(readonly kind: WireFailure, message: string) {
    super(message);
    this.name = 'AiCallError';
  }
}

export interface ClaudeTransport {
  send(key: string, req: WireRequest): Promise<WireResult>;
}

/** The real thing: the official SDK, imported on first use. */
export function sdkTransport(): ClaudeTransport {
  let sdk: Promise<[typeof import('@anthropic-ai/sdk'), typeof import('@anthropic-ai/sdk/helpers/zod')]> | null = null;
  const clients = new Map<string, InstanceType<typeof import('@anthropic-ai/sdk').default>>();
  return {
    async send(key, req) {
      sdk ??= Promise.all([import('@anthropic-ai/sdk'), import('@anthropic-ai/sdk/helpers/zod')]);
      const [mod, zodHelper] = await sdk;
      const Anthropic = mod.default;
      let client = clients.get(key);
      if (!client) {
        client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true, maxRetries: 0 });
        clients.clear(); // only the current key's client is kept
        clients.set(key, client);
      }
      const cached = { type: 'ephemeral' as const };
      const system = [{ type: 'text' as const, text: req.system, cache_control: cached }];
      if (req.context) system.push({ type: 'text' as const, text: req.context, cache_control: cached });
      const messages: { role: 'user' | 'assistant'; content: string }[] = [{ role: 'user', content: req.input }];
      if (req.repair) {
        messages.push({ role: 'assistant', content: req.repair.bad || '(empty)' });
        messages.push({ role: 'user', content: `That answer did not fit the required format (${req.repair.error}). Answer again, fitting it exactly.` });
      }
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), req.timeoutMs);
      try {
        const res = await client.messages.create(
          {
            model: req.model,
            max_tokens: req.maxTokens,
            system,
            messages,
            ...(req.thinkingOff ? { thinking: { type: 'disabled' as const } } : {}),
            output_config: { effort: req.effort, ...(req.schema ? { format: zodOutputFormat(zodHelper, req.schema) } : {}) },
          },
          { signal: ctrl.signal, timeout: req.timeoutMs, maxRetries: 0 },
        );
        const text = res.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
        return { text, stop: res.stop_reason ?? null, usage: res.usage };
      } catch (err) {
        throw toCallError(mod, err, ctrl.signal.aborted);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

function zodOutputFormat(helper: typeof import('@anthropic-ai/sdk/helpers/zod'), schema: z.ZodType): ReturnType<typeof helper.zodOutputFormat> {
  return helper.zodOutputFormat(schema as Parameters<typeof helper.zodOutputFormat>[0]);
}

function toCallError(mod: typeof import('@anthropic-ai/sdk'), err: unknown, aborted: boolean): AiCallError {
  const A = mod.default;
  if (aborted || err instanceof A.APIConnectionTimeoutError) return new AiCallError('timeout', 'The call took too long.');
  if (err instanceof A.AuthenticationError || err instanceof A.PermissionDeniedError) return new AiCallError('auth', 'The key was refused.');
  if (err instanceof A.RateLimitError) return new AiCallError('rate', 'Too many calls just now.');
  if (err instanceof A.BadRequestError || err instanceof A.NotFoundError) return new AiCallError('bad-request', 'The request was refused.');
  if (err instanceof A.APIConnectionError) return new AiCallError('network', 'Rotom could not be reached.');
  if (err instanceof A.APIError) return new AiCallError('server', 'Rotom had a problem.');
  return new AiCallError('network', 'Rotom could not be reached.');
}

/** A canned answer: text (or a failure) for a tag. `usage` defaults to a tiny call. */
export type FakeAnswer = string | { text?: string; stop?: string; fail?: WireFailure; usage?: Partial<AiUsage> } | ((req: WireRequest) => string);

/**
 * No network: answers by tag (exact, then the part before the first ':'), else `fallback`. Records every request in
 * `calls` so tests can check prompts (and that the key went nowhere but the transport).
 */
export function fakeTransport(answers: Record<string, FakeAnswer | FakeAnswer[]> = {}, fallback: FakeAnswer = 'OK'): ClaudeTransport & { calls: WireRequest[]; keys: string[] } {
  const calls: WireRequest[] = [];
  const keys: string[] = [];
  const used = new Map<string, number>();
  return {
    calls,
    keys,
    async send(key, req) {
      calls.push(req);
      keys.push(key);
      if (/^sk-ant-api03-fake-refused/.test(key)) throw new AiCallError('auth', 'The key was refused.');
      const head = req.tag.split(':')[0]!;
      const found = answers[req.tag] ?? answers[head] ?? fallback;
      let a: FakeAnswer;
      if (Array.isArray(found)) {
        const n = used.get(req.tag) ?? 0;
        used.set(req.tag, n + 1);
        a = found[Math.min(n, found.length - 1)]!;
      } else a = found;
      if (typeof a === 'function') a = a(req);
      const o = typeof a === 'string' ? { text: a } : a;
      if (o.fail) throw new AiCallError(o.fail, `fake ${o.fail}`);
      return { text: o.text ?? '', stop: o.stop ?? 'end_turn', usage: { input_tokens: 40, output_tokens: 8, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, ...o.usage } };
    },
  };
}

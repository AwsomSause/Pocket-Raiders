// The game's one Key-Card store and Claude transport (Dominion slice D18).
// `?aifake=1` swaps in the no-network fake (browser tests, trying screens without a key); it can't spend anything.

import { fakeTransport, sdkTransport, type ClaudeTransport, type FakeAnswer } from './client';
import { KeyStore } from './keyStore';

let keys: KeyStore | null = null;

/** Canned answers for `?aifake=1`, by call-id head (D21: the applications desk). */
const FAKE_ANSWERS: Record<string, FakeAnswer> = {
  desk: JSON.stringify({ reply: 'Top floor? Uh... the radio. The big radio. Everyone knows that.', tell: 'nervous' }),
  // D20: the Debate's judge (structured) and the Boss's streamed reply (text), as in Rotom mockup a4.
  debate: (req) => req.schema
    ? JSON.stringify({ stance: 'partnership', values: [8, 9, 4, 6, 5], insult: false, claim: null })
    : 'Celadon. You want my city split like a dinner bill. Persian has eaten better men than you for less... and yet the offer is not stupid. Tell me what you bring that I cannot simply take.',
};
let transport: ClaudeTransport | null = null;

export function aiFake(): boolean {
  try {
    return new URLSearchParams(globalThis.location?.search ?? '').get('aifake') === '1';
  } catch {
    return false;
  }
}

export function aiRuntime(): { keys: KeyStore; transport: ClaudeTransport } {
  keys ??= new KeyStore();
  transport ??= aiFake() ? fakeTransport(FAKE_ANSWERS, 'OK', 30) : sdkTransport();
  return { keys, transport };
}

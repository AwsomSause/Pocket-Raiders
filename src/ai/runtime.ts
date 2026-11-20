// The game's one Key-Card store and Claude transport (Dominion slice D18).
// `?aifake=1` swaps in the no-network fake (browser tests, trying screens without a key); it can't spend anything.

import { fakeTransport, sdkTransport, type ClaudeTransport } from './client';
import { KeyStore } from './keyStore';

let keys: KeyStore | null = null;

/** Canned answers for `?aifake=1`, by call-id head (D21: the applications desk). */
const FAKE_ANSWERS = {
  desk: JSON.stringify({ reply: 'Top floor? Uh... the radio. The big radio. Everyone knows that.', tell: 'nervous' }),
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
  transport ??= aiFake() ? fakeTransport(FAKE_ANSWERS) : sdkTransport();
  return { keys, transport };
}

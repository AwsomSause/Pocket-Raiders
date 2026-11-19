// The game's one Key-Card store and Claude transport (Dominion slice D18).
// `?aifake=1` swaps in the no-network fake (browser tests, trying screens without a key); it can't spend anything.

import { fakeTransport, sdkTransport, type ClaudeTransport } from './client';
import { KeyStore } from './keyStore';

let keys: KeyStore | null = null;
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
  transport ??= aiFake() ? fakeTransport() : sdkTransport();
  return { keys, transport };
}

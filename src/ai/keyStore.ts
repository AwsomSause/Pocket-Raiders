// The player's Key-Card (Dominion slice D18; design CLAUDE_API_DRAFT.md sections 1 and 8).
// The key the player pastes lives only in this browser: sessionStorage by default (gone when the tab closes), or
// localStorage when they tick "Remember on this device". It is never in a save record, an export, a log or the repo.
// The spend counter is kept per key under a hash of the key (never the key itself), for the whole game.

import { AI_DATA, usedUp } from '../core/ai/rules';

/** A small storage surface (the browser's Storage fits it; tests pass a Map-backed one). */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface ActiveCard {
  card: string;
  key: string;
  remembered: boolean;
}

const CARD = 'pkr.ai.card';
const SPEND = 'pkr.ai.spend.';
/** Which card each key was sealed into, as card id -> key hash (never the key), so the vault can show a card's spend. */
const CARDS = 'pkr.ai.cards';

function browserStore(kind: 'session' | 'local'): KeyValueStore | null {
  try {
    const s = kind === 'session' ? globalThis.sessionStorage : globalThis.localStorage;
    return s ?? null;
  } catch {
    return null; // private window or blocked site data
  }
}

function read(store: KeyValueStore | null, key: string): string | null {
  try { return store?.getItem(key) ?? null; } catch { return null; }
}

function parseCard(text: string | null, remembered: boolean): ActiveCard | null {
  if (!text) return null;
  try {
    const o = JSON.parse(text) as { card?: unknown; key?: unknown };
    if (typeof o.card !== 'string' || typeof o.key !== 'string') return null;
    if (!AI_DATA.keyCards.some((c) => c.id === o.card)) return null;
    return { card: o.card, key: o.key, remembered };
  } catch {
    return null;
  }
}

/** A short hex hash of the key (SHA-256 where the browser has it; a plain FNV-1a pair otherwise). */
export async function keyHash(key: string): Promise<string> {
  const bytes = new TextEncoder().encode(key.trim());
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const d = new Uint8Array(await subtle.digest('SHA-256', bytes));
    return Array.from(d.slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (const b of bytes) { h1 = Math.imul(h1 ^ b, 0x01000193) >>> 0; h2 = Math.imul(h2 ^ b, 0x811c9dc5) >>> 0; }
  return `f${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}

export class KeyStore {
  constructor(
    private readonly session: KeyValueStore | null = browserStore('session'),
    private readonly local: KeyValueStore | null = browserStore('local'),
  ) {}

  /** The Key-Card in use, if one is set (this tab's first, then a remembered one). */
  active(): ActiveCard | null {
    return parseCard(read(this.session, CARD), false) ?? parseCard(read(this.local, CARD), true);
  }

  /** Sets the Key-Card. The other storage is cleared so only one copy of a key ever exists. */
  async set(card: string, key: string, remember: boolean): Promise<void> {
    const text = JSON.stringify({ card, key: key.trim() });
    const [keep, drop] = remember ? [this.local, this.session] : [this.session, this.local];
    try { drop?.removeItem(CARD); } catch { /* blocked */ }
    if (!keep) throw new Error('This browser blocks site storage, so the key can\'t be kept.');
    keep.setItem(CARD, text);
    const h = await keyHash(key);
    // A key lives on one card: sealing it into another moves it.
    const map = Object.fromEntries(Object.entries(this.cards()).filter(([, v]) => v !== h));
    this.writeCards({ ...map, [card]: h });
  }

  /** Forget: the key is removed from both storages and its card shows empty. Its spend counter stays (per key, whole game). */
  forget(): void {
    const was = this.active()?.card;
    for (const s of [this.session, this.local]) { try { s?.removeItem(CARD); } catch { /* blocked */ } }
    if (was) { const map = this.cards(); delete map[was]; this.writeCards(map); }
  }

  /** card id -> key hash for every card a key was sealed into on this device. */
  cards(): Record<string, string> {
    try {
      const o = JSON.parse(read(this.local, CARDS) ?? '{}') as Record<string, unknown>;
      return Object.fromEntries(Object.entries(o).filter((e): e is [string, string] => typeof e[1] === 'string'));
    } catch {
      return {};
    }
  }

  private writeCards(map: Record<string, string>): void {
    try { this.local?.setItem(CARDS, JSON.stringify(map)); } catch { /* blocked */ }
  }

  /** What a card's key has used, or null when no key was sealed into it here. */
  cardSpent(card: string): number | null {
    const h = this.cards()[card];
    if (!h) return null;
    const n = Number(read(this.local, SPEND + h) ?? '0');
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  /** The last cost added this session (the "+$0.0004 just now" tag). */
  last: { usd: number; at: number } | null = null;

  /** Dollars this key has used, ever, on this device. */
  async spent(key: string): Promise<number> {
    const n = Number(read(this.local, SPEND + (await keyHash(key))) ?? '0');
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  async addSpend(key: string, usd: number): Promise<number> {
    const h = await keyHash(key);
    const now = (Number(read(this.local, SPEND + h) ?? '0') || 0) + Math.max(usd, 0);
    try { this.local?.setItem(SPEND + h, String(Math.round(now * 1e6) / 1e6)); } catch { /* blocked: the Console limit still guards */ }
    this.last = { usd: Math.max(usd, 0), at: Date.now() };
    return now;
  }

  async isUsedUp(key: string): Promise<boolean> {
    return usedUp(await this.spent(key));
  }
}

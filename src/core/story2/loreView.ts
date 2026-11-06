// What the Lore Archive shows: the lore data crossed with the profile's lore states. Pure; no Phaser.
// Entries the player has not found show as "???" (name and text hidden). With the spoiler guard on, spoiler entries
// stay masked until they are Known.

import type { StoryData } from './schema';

export const LORE_CATEGORIES = [
  'Regions', 'Characters', 'Legendary Pokémon', 'Mythical Pokémon', 'Historical Events', 'Organizations',
  'Evil Teams', 'Ancient Civilizations', 'Pokémon Forms', 'Unsolved Mysteries', 'Run Chronicles',
] as const;

export type LoreState = 'hidden' | 'rumor' | 'known' | 'verified' | 'contested';
export interface LoreRow { id: string; name: string; state: LoreState; stateLabel: string; text: string; sources: number }
export interface LoreCategory { index: number; name: string; found: number; total: number; rows: LoreRow[] }

const LABEL: Record<LoreState, string> = { hidden: '???', rumor: 'Rumor', known: 'Known', verified: 'Verified', contested: 'Contested' };
const MASK = '???';

export function loreArchive(data: StoryData, lore: Record<string, { state: string; sources: string[] }>, spoilerGuard: boolean): LoreCategory[] {
  const out: LoreCategory[] = LORE_CATEGORIES.map((name, i) => ({ index: i + 1, name, found: 0, total: 0, rows: [] }));
  for (const e of data.lore) {
    const cat = out[e.category - 1];
    if (!cat) continue;
    cat.total += 1;
    const have = lore[e.id];
    const state: LoreState = have && (['rumor', 'known', 'verified', 'contested'] as string[]).includes(have.state) ? (have.state as LoreState) : 'hidden';
    if (state !== 'hidden') cat.found += 1;
    const masked = state === 'hidden' || (spoilerGuard && e.spoiler && state === 'rumor');
    const texts = e.interpretations.map((i) => data.text[i.textKey] ?? '').filter(Boolean);
    const text = masked ? MASK
      : state === 'rumor' ? (texts[0]?.split(/(?<=[.!?])\s/)[0] ?? MASK)
      : state === 'contested' ? texts.map((t, i) => `${i + 1}. ${t}`).join('  ')
      : (texts[0] ?? MASK);
    cat.rows.push({ id: e.id, name: masked && state === 'hidden' ? MASK : data.text[e.nameKey] ?? e.id, state, stateLabel: LABEL[state], text, sources: have?.sources.length ?? 0 });
  }
  return out;
}

export const loreTotals = (cats: LoreCategory[]): { found: number; total: number } => ({ found: cats.reduce((n, c) => n + c.found, 0), total: cats.reduce((n, c) => n + c.total, 0) });

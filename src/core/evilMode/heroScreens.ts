// Evil Mode's File (design Part 18 section 11, Part 29): what the Boss knows about the Hero, as plain data in three
// panels, the main game's Rival Report, Notebook and Dossier turned round. Never padded: what isn't known is shown blank.

import { EVIL_DATA, type EvilData } from './data';
import { heroReason, likelyRoad, marksWord, personalityDef } from './hero';
import type { EvilModeBlock } from './schema';

export interface FileModel {
  tab: number;
  tabs: { name: string; sel: boolean }[];
  name: string;
  look: string;
  rows: { label: string; text: string; blank: boolean; strike?: boolean; mark?: string }[];
  /** The Notebook: six slots, a row of marks and eight Badges. */
  slots: { species: string | null; name: string; line: string }[] | null;
  marks: { filled: number; max: number; word: string } | null;
  badges: { how: 'full' | 'half' | null }[] | null;
  lists: { title: string; lines: string[]; empty: string }[];
}

/**
 * The File. `party` is the Hero's team as the rival record has it (species ids, starter first); `names` turns a species
 * id into its name. Slots fill only for species a Grunt has seen; everything else is a blank line.
 */
export function fileModel(block: EvilModeBlock, tab: number, party: readonly string[], names: (id: string) => string, data: EvilData = EVIL_DATA): FileModel | null {
  const hero = block.hero;
  if (!hero) return null;
  const F = data.hero.file;
  const t = Math.max(0, Math.min(2, tab));
  const m: FileModel = { tab: t, tabs: F.tabs.map((name, i) => ({ name, sel: i === t })), name: hero.name, look: hero.look, rows: [], slots: null, marks: null, badges: null, lists: [] };
  const blank = (label: string, text: string | null, extra: Partial<FileModel['rows'][number]> = {}) => m.rows.push({ label, text: text ?? F.unknown, blank: !text, ...extra });
  if (t === 0) {
    const reason = heroReason(block, data);
    const road = likelyRoad(block, data);
    blank('Who', `${hero.name}. ${hero.home.street}. Raised by ${hero.raisedBy}.`);
    blank('Personality', hero.met ? personalityDef(hero.personality, data).word : null);
    blank('The reason', reason ? `"${reason.reason.says}"` : null, reason ? { mark: data.hero.kinds[reason.reason.kind] } : {});
    blank('Temper', null, { text: F.temper });
    blank('Where', `Step ${hero.at}.${road.length ? ` Likely tomorrow: step ${road[0]}${road.length > 1 ? ` to ${road.at(-1)}` : ''}.` : ' Resting tomorrow.'}`);
  } else if (t === 1) {
    const origin = (i: number): string => {
      const O = (data.hero.lines.origins ?? {}) as Record<string, string>;
      return i === 0 ? (O.starter ?? '').replace('{region}', hero.starterRegion) : i === 1 ? O.opener ?? '' : i === 2 ? O.counter ?? '' : '';
    };
    m.slots = Array.from({ length: 6 }, (_, i) => {
      const s = party[i];
      const known = s && hero.seen.includes(s) ? s : null;
      return { species: known, name: known ? names(known) : F.blank, line: known ? origin(i) : '' };
    });
    m.marks = { filled: hero.marks, max: data.hero.marks.max, word: hero.marks ? marksWord(hero.marks, data) : '' };
    m.badges = Array.from({ length: 8 }, (_, i) => ({ how: hero.badges[i]?.how ?? null }));
    m.lists.push({ title: "What they've seen", lines: hero.learned, empty: F.seenNone });
  } else {
    const reason = heroReason(block, data);
    m.lists.push({ title: "What they've said about you", lines: [...(reason ? [`"${reason.reason.says}"`] : []), ...hero.said], empty: F.saidNone });
    m.lists.push({ title: "What you've said to them", lines: [], empty: F.fires });
    m.lists.push({ title: "Their mother's letters", lines: [], empty: F.letters });
    m.lists.push({ title: 'The other three', lines: [], empty: F.others });
  }
  return m;
}

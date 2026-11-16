// New UI for the shared Picker list: what a list is called in the header band, which mock-up template it uses and
// which band colour it wears, all read from its title. Pure (no Phaser), so the rules can be unit-tested.

import type { Area } from './kit';

/** `window` is the battle's small Party or Item window over the field; the rest are full screens. */
export type PickerKind = 'menu' | 'grid' | 'board' | 'bag' | 'window';

/** Which template a list uses, by its title: the mock-ups' own rule for hub rooms (redux-07.js `kind`). */
const KIND_BY_NAME: [RegExp, PickerKind][] = [
  [/^bag$/i, 'bag'],
  [/^bonds?$/i, 'board'],
  // The mock-up catalogue names these screens outright (redux-explorer.js SETS); the rule below covers the rest.
  [/^(lore|story|remembrance) archive|^tales|^run history|^trainer quests|^event hall|^content status|^seed board|run journal|memory lane|fallen trainers|battle replays|leaderboard|^bonds|story journal|^rival|^people|relationships|field notes|^notes/i, 'board'],
  [/^bank|^mentors|^mod packs|district|preparation desk|^camp|in this run|raid prep|^menu$/i, 'menu'],
  [/^trainer (archive|select)|species mastery|keepsakes|character database|moment codex|wardrobe|legacy gallery|berry bestiary|hall of memories|heirlooms|pok[eé]dex|^pc\b|^album/i, 'grid'],
];

/**
 * What the header band says. "Bank · 0 credits · 0 candies": the name goes in the band, the rest becomes chips beside
 * it. A count written into the name ("Lore Archive 3 / 24 known", "Moment Codex (2/20)") is a chip too, and the Cast
 * list is the mock-ups' Character Database.
 */
export function pickerBand(title: string): { name: string; chips: string[] } {
  const [head = '', ...extra] = title.split(/\s+·\s+/);
  const cast = /^Cast\b:?\s*(.*)$/.exec(head);
  if (cast) return { name: 'Character Database', chips: [...cast[1]!.split(/\s{2,}/).filter(Boolean), ...extra] };
  const m = /^((?:Lore|Story|Remembrance) Archive|Moment Codex)\s+\(?(.+?)\)?$/.exec(head);
  return m ? { name: m[1]!, chips: [m[2]!, ...extra] } : { name: head, chips: extra };
}

export function pickerKind(title: string): PickerKind {
  for (const [re, kind] of KIND_BY_NAME) if (re.test(title)) return kind;
  if (/archive|gallery|museum|wardrobe|album|codex|dex|mastery|keepsake|heirloom|bestiary|database|legacy/i.test(title)) return 'grid';
  if (/achiev|quest|history|journal|news|event|leader|status|replay|memor|fallen|seed|hall|contract|bounty|mentor/i.test(title)) return 'board';
  return 'menu';
}

/** Header colour by title, as the mock-up catalogue bands each page: run menus teal, party green, shops orange, story pages purple, the rest hub blue. */
export function areaOf(title: string): Area {
  if (/^bag$/i.test(title)) return 'shop';
  // The Memories pages are story pages; the replays are battles (the mock-up catalogue's own bands).
  if (/^memories/i.test(title)) return /battle replays/i.test(title) ? 'battle' : 'story';
  // The story's own archives (Tales & News) and the Moment Codex wear the story's purple.
  if (/^(lore|story|remembrance) archive|^character (database|profile)|^moment codex/i.test(title)) return 'story';
  // The Legacy Gallery and the Hall of Fame keep finished runs: the run end's gold band.
  if (/^(legacy gallery|hall of fame)/i.test(title)) return 'end';
  // Seeds, timers and brackets are about a run: teal.
  if (/^(seed board|seed leaderboard|speedrun timer|tournament bracket)/i.test(title)) return 'run';
  if (/party|pok[eé]mon|pok[eé]dex|team|summary|bond/i.test(title)) return 'party';
  if (/shop|mart|merchant|exchange/i.test(title)) return 'shop';
  if (/bag|item|camp|map|route|journal|notes/i.test(title)) return 'run';
  return 'hub';
}

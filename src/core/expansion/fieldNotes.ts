// Beta 0.6 (Field Notes): the Notebook's compendium of special Pokémon, special Shadows, Data ROMs and purification keys met THIS run.
// Pure rules + a view-model; no Phaser. Nothing here touches the RNG or changes a battle: it only records what the player has been shown.
// Kice's pick: Bestiary Book (list left, entry right) with four Type Tabs. There is no cross-run memory: the record lives in the run.

import { expansionData } from '../../data/expansion';
import { grandArcData, grandArcOf, romsHeld, stockLevel } from '../grandArc';
import type { Content } from '../contentSchema';
import { keyOf } from '../shadow2/data';
import { currentRegion } from '../regions';
import type { RunState } from '../state';

export const FIELD_TABS = ['special', 'shadow', 'rom', 'key'] as const;
export type FieldTab = (typeof FIELD_TABS)[number];
export const FIELD_TAB_NAMES: Record<FieldTab, string> = { special: 'Special Pokémon', shadow: 'Shadow Pokémon', rom: 'Data ROMs', key: 'Keys' };

type NotesRun = Pick<RunState, 'expansion'>;
type NotesPartyRun = Pick<RunState, 'expansion' | 'party' | 'box'>;

const KEY_SYMBOL: Record<string, string> = { person: '☺', place: '⌖', object: '◆', act: '☀', story: '✦' };
export const keySymbol = (type: string): string => KEY_SYMBOL[type] ?? '?';
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Records that a special Pokémon (`sv.*`) was met this run. False if the id is unknown or already noted. */
export function noteSpecial(run: NotesRun, id: string): boolean {
  if (!expansionData.specialPokemon.some((s) => s.id === id)) return false;
  const cur = run.expansion?.fieldNotes ?? { special: [], shadow: {} };
  if (cur.special.includes(id)) return false;
  run.expansion = { ...run.expansion, fieldNotes: { ...cur, special: [...cur.special, id] } };
  return true;
}

/** Records how many of a special Shadow's three key hints the player has been given (never goes down). False if unknown or no news. */
export function noteShadow(run: NotesRun, id: string, hints: number): boolean {
  if (!expansionData.specialShadows.some((s) => s.id === id)) return false;
  const stage = Math.max(1, Math.min(3, Math.floor(hints)));
  const cur = run.expansion?.fieldNotes ?? { special: [], shadow: {} };
  if ((cur.shadow[id] ?? 0) >= stage) return false;
  run.expansion = { ...run.expansion, fieldNotes: { ...cur, shadow: { ...cur.shadow, [id]: stage } } };
  return true;
}

/** Notes every Named Shadow currently in the party or the box, at the hints it has earned. */
export function syncFieldNotes(run: NotesPartyRun): void {
  for (const m of [...run.party, ...run.box]) if (m.shadow?.named) noteShadow(run, m.shadow.named, m.shadow.hints ?? 1);
}

export interface FieldEntry {
  id: string;
  tab: FieldTab;
  /** "???" until met. */
  name: string;
  /** Species name for the sprite and the sub-title (null until met). */
  species: string | null;
  /** The one-word line in the list ("Black-Label", "Tier 3 Gripped", "Held"). */
  badge: string;
  known: boolean;
  /** Detail lines, already hidden or shown by what the player has reached. */
  lines: string[];
  /** Hint pips (Shadows and keys): filled count out of 3, or null. */
  pips: number | null;
  /** The last line: whether it can be obtained / whether it is held. */
  obtain: string;
}
export interface FieldNotesView {
  region: string;
  counts: Record<FieldTab, { have: number; total: number }>;
  tabs: Record<FieldTab, FieldEntry[]>;
  /** One line that says what the open tab teaches, for its footer. */
  help: Record<FieldTab, string>;
  grandArcOn: boolean;
}

/** Builds the Field Notes. Unmet entries show only if they belong to the region the run is in; met ones always show. */
export function fieldNotesView(content: Content, run: Pick<RunState, 'expansion' | 'party' | 'box' | 'regionIndex' | 'regionOrder'>): FieldNotesView {
  syncFieldNotes(run);
  const here = currentRegion(content, run as RunState).id;
  const notes = run.expansion?.fieldNotes ?? { special: [], shadow: {} };
  const speciesName = (s: string): string => content.species.get(s.toLowerCase().replace(/[^a-z0-9]+/g, '-'))?.name ?? s;

  const special: FieldEntry[] = expansionData.specialPokemon
    .filter((s) => notes.special.includes(s.id) || s.region === here)
    .map((s) => {
      const known = notes.special.includes(s.id);
      return {
        id: s.id, tab: 'special' as const, name: known ? s.name : '???', species: known ? speciesName(s.species[0]!) : null,
        badge: known ? (s.team === 'rocket' ? 'Black-Label' : cap(s.team.replace(/-/g, ' '))) : 'Special',
        known,
        lines: known ? [`Trait: ${s.trait}`, `Seen with: ${s.where}`] : ['Not met yet. Its trait shows once you have met it.'],
        pips: null,
        obtain: known ? (/^yes/i.test(s.obtainable) ? `Yes: ${s.obtainable.replace(/^yes:?\s*/i, '') || 'it can be yours'}` : s.obtainable.startsWith('No') ? 'Cannot be obtained' : s.obtainable) : '',
      };
    });

  const shadowEntries = expansionData.specialShadows.filter((s) => (notes.shadow[s.id] ?? 0) > 0 || s.region === here);
  const shadow: FieldEntry[] = shadowEntries.map((s) => {
    const stage = notes.shadow[s.id] ?? 0;
    const key = keyOf(s.id);
    const lines: string[] = [];
    if (stage === 0) lines.push('Not met yet.');
    else if (!key) lines.push(`Ability: ${s.ability}`, 'Its purification key is not written down yet.');
    else {
      lines.push(`Key type: ${keySymbol(key.type)} ${cap(key.type)}`);
      for (const h of key.hints.slice(0, stage)) lines.push(h);
    }
    return {
      id: s.id, tab: 'shadow' as const, name: stage ? s.name : '???', species: stage ? speciesName(s.species[0]!) : null,
      badge: stage ? (s.apex ? `Apex · Tier ${s.tier}` : `Tier ${s.tier}`) : 'Shadow', known: stage > 0, lines,
      pips: key ? stage : null,
      obtain: stage ? (s.apex ? 'Story only' : key ? 'Yes, with the key' : `Purification: ${s.purification}`) : '',
    };
  });

  const arc = grandArcOf(run);
  const held = arc ? romsHeld(arc) : [];
  const rom: FieldEntry[] = arc
    ? grandArcData.roms.map((r) => {
        const have = held.includes(r.id);
        return {
          id: `rom.${r.id}`, tab: 'rom' as const, name: have ? `ROM ${r.id} · ${r.name}` : `ROM ${r.id} · ???`, species: null, badge: have ? (arc.late.includes(r.id) ? 'Taken late' : 'Held') : 'Missing', known: have,
          lines: have ? [`${cap(r.region)} · ${r.liaison}`, `Method: ${r.method}`, `Proves: ${r.proves}`] : [`${cap(r.region)}. Beat or read the liaison there to earn it.`],
          pips: null, obtain: have ? 'In your Notebook' : 'Not held',
        };
      })
    : [];

  const keyEntries: FieldEntry[] = shadowEntries.flatMap((s) => {
    const stage = notes.shadow[s.id] ?? 0;
    const key = keyOf(s.id);
    if (!key || stage === 0) return [];
    return [{
      id: `key.${s.id}`, tab: 'key' as const, name: `${keySymbol(key.type)} ${cap(key.type)} key`, species: s.name, badge: stage >= 3 ? 'Known' : stage === 2 ? 'Clue' : 'Type only',
      known: true, lines: [`For: ${s.name}`, stage >= 2 ? key.hints[stage - 1]! : 'Fight beside it for the next clue.', `Reward: the ${key.scar.replace(/-/g, ' ')} scar`], pips: stage, obtain: stage >= 3 ? 'Key is known' : 'Hints still to come',
    }];
  });

  const counts = {
    special: { have: special.filter((e) => e.known).length, total: special.length },
    shadow: { have: shadow.filter((e) => e.known).length, total: shadow.length },
    rom: { have: held.length, total: grandArcData.roms.length },
    key: { have: keyEntries.length, total: keyEntries.length },
  };
  return {
    region: here, counts, tabs: { special, shadow, rom, key: keyEntries },
    help: {
      special: 'A trait shows once you have met the Pokémon.',
      shadow: 'Hint 1 shows the key type, 2 adds a clue, 3 shows the full key.',
      rom: arc ? `Stock ${stockLevel(run)} of ${grandArcData.maxStock}. Every ${grandArcData.romsPerStep} ROMs remove one Stock step.` : 'The Grand Arc is off for this run.',
      key: 'Keys you have been told about. A clue appears after a battle won with the Shadow in your party.',
    },
    grandArcOn: Boolean(arc),
  };
}

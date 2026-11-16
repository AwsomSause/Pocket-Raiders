// New UI: the small Beta 0.6 pieces that show over the battle field (the mock-ups' item budget, Rally line, Foresight
// Tax banner, variant hint, signature-trait callout and Shadow line). These helpers only read a finished turn's events
// or the battle's state and say what to write; nothing here changes the battle or uses a random stream.

import { TRAIT_IDS } from '../../core/expansion/traits';

/** What a turn's event needs for these: its type, and the few fields the callouts read. */
export interface CalloutEvent { type: string; side?: string; kind?: string; text?: string; stat?: string; change?: number }

const STAT_WORDS: Record<string, string> = { atk: 'Attack', def: 'Def', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed', acc: 'Accuracy', eva: 'Evasion' };

/**
 * A boss or rival braces against a sweep (`battle/rally.ts`): the line is "RALLY · the foe braces: Def and Sp. Def +1",
 * built from the stat rises that follow the brace in the same turn. Null for any other event (the player's own
 * Momentum "rally" lines included).
 */
export function rallyLine(events: readonly CalloutEvent[], index: number): string | null {
  const e = events[index];
  if (!e || e.type !== 'spectacle' || e.kind !== 'rally' || e.side !== 'enemy' || !/steels itself/.test(e.text ?? '')) return null;
  const rises: { stat: string; change: number }[] = [];
  for (let k = index + 1; k < events.length; k++) {
    const s = events[k]!;
    if (s.type !== 'stat' || s.side !== 'enemy' || !s.stat || !((s.change ?? 0) > 0)) break;
    rises.push({ stat: STAT_WORDS[s.stat] ?? s.stat, change: s.change! });
  }
  if (!rises.length) return 'RALLY · the foe braces';
  const same = rises.every((r) => r.change === rises[0]!.change);
  const list = (words: string[]): string => (words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}` : words[0]!);
  return `RALLY · the foe braces: ${same ? `${list(rises.map((r) => r.stat))} +${rises[0]!.change}` : list(rises.map((r) => `${r.stat} +${r.change}`))}`;
}

/** A stat line that belongs to the callout before it (the brace's rises, the boosts a trait swept away). */
export const keepsCallout = (e: CalloutEvent): boolean => e.type === 'stat';

const TRAIT_NAMES = TRAIT_IDS.map((id) => id.replace(/-/g, ' '));

/**
 * A special Pokémon's signature trait goes off: its lines read "Seat at the Table: the foe's boosts are swept away."
 * Gives the trait's name and the sentence; null for any other line.
 */
export function traitLine(text: string): { name: string; text: string } | null {
  const m = /^([^:]{3,40}):\s+(.+)$/s.exec(text);
  if (!m || !TRAIT_NAMES.includes(m[1]!.toLowerCase())) return null;
  const said = m[2]!.trim();
  return { name: m[1]!, text: `${said.charAt(0).toUpperCase()}${said.slice(1)}` };
}

/** "Shadow · Fallen (tier 4) · Sealed 100/100\nThe shadow tightens: …" as the window's two lines. */
export function shadowLines(preview: string | null): { head: string; plan: string } | null {
  if (!preview) return null;
  const [head = '', ...rest] = preview.split('\n');
  return head ? { head, plan: rest.join(' ').trim() } : null;
}

/** The rule a boss holds over the turn while you choose (Sabrina's Foresight Tax). */
export function foresightRule(on: boolean, trainer: string | null | undefined): { name: string; text: string } | null {
  return on ? { name: 'Foresight Tax', text: `${trainer?.trim() || 'Sabrina'} sees the first move you choose this turn.` } : null;
}

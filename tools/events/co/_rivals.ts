// Shared vocabulary for the rival questline modules (tools/events/co/rivals-*.ts). Not built on its own ("_" prefix).
// Scripts are plain strings: a blank line ("\n\n") is a page, "\n" a line, `Name: "words"` a speaker line.
// Tokens ({rival}, {say ...}) are filled by core/rivals/questlines.ts questText.
import { ev, type EventOpts, type Json } from '../dsl.ts';

export const G = 'Rival questline';
export const TAGS = ['Rival', 'Relationship', 'Story'];

/** Lines of one page joined by "\n"; pages joined by a blank line. */
export const page = (...lines: string[]): string => lines.join('\n');
export const script = (...pages: string[]): string => pages.join('\n\n');
/** A remembered variant's added lines: they start on a new page after the intro. */
export const note = (...pages: string[]): string => `\n\n${pages.join('\n\n')}`;
/** A speaker line. */
export const R = (words: string): string => `{rival}: "${words}"`;
export const who = (name: string, words: string): string => `${name}: "${words}"`;
/** A [by personality] line: the doc's own line for the personalities it names, else a bank line of this context. */
export const say = (ctx: string, lines: Record<string, string> = {}): string => `{say ${ctx}${Object.entries(lines).map(([k, v]) => `||${k}::${v}`).join('')}}`;
export const RS = (ctx: string, lines: Record<string, string> = {}): string => `{rival}: "${say(ctx, lines)}"`;

// ---------- conditions ----------
export const rq = (o: Json): Json => ({ kind: 'rivalQuest', ...o });
/** This beat is due now (the schedule, the run's budget and the stage's rival slot). */
export const due = (beat: string, o: Json = {}): Json => rq({ beat, ...o });
export const met = (atLeast = 1): Json => ({ kind: 'rivalMet', atLeast });
export const no = (key: string): Json => ({ kind: 'flag', key, atLeast: 0, atMost: 0 });
export const yes = (key: string, atLeast = 1): Json => ({ kind: 'flag', key, atLeast, atMost: 99 });
export const feels = (key: string, atLeast?: number, atMost?: number, who2: 'main' | 'second' = 'main'): Json => rq({ feeling: { who: who2, key, ...(atLeast !== undefined ? { atLeast } : {}), ...(atMost !== undefined ? { atMost } : {}) } });

// ---------- effects ----------
/** The beat was played (its stage, the rival slot, the line's start and end). */
export const done = (beat: string, o: Json = {}): Json => ({ kind: 'rivalQuest', done: beat, ...o });
export const quest = (o: Json): Json => ({ kind: 'rivalQuest', ...o });
/** Moves the main rival's feelings (and Lead, and a mark). */
export const feel = (feelings: Record<string, number>, o: { lead?: number; mark?: string } = {}): Json => ({ kind: 'rivalChange', feelings, lead: o.lead ?? 0, ...(o.mark ? { mark: o.mark } : {}) });
export const mark = (m: string): Json => ({ kind: 'rivalChange', feelings: {}, lead: 0, mark: m });
export const feel2 = (feelings: Record<string, number>): Json => ({ kind: 'rivalQuest', who: 'second', feelings });
export const set = (key: string, value: number): Json => ({ kind: 'rivalQuest', set: { key, value } });

// ---------- battles ----------
/** A fight against the rival. A loss never ends the run (`friendly`); `lose` effects apply then. */
export const rival = (o: { lv?: number; size?: number; quest?: Json; format?: 'doubles'; rule?: Json; win?: Json[]; lose?: Json[]; weather?: string } = {}): Json => ({
  kind: 'trainer', name: 'Rival', rival: true, friendly: true, size: o.size ?? 6, types: [], levelBonus: o.lv ?? 1,
  ...(o.quest ? { quest: o.quest } : {}), ...(o.format ? { format: o.format } : {}), ...(o.rule ? { rule: o.rule } : {}), ...(o.weather ? { weather: o.weather } : {}),
  win: o.win ?? [], ...(o.lose ? { lose: o.lose } : {}),
});
/** A friendly fight against a named trainer. */
export const foe = (name: string, o: { lv?: number; size?: number; cls?: string; types?: string[]; lineup?: string[]; sprite?: string; format?: 'doubles'; rule?: Json; ally?: string; mirror?: boolean; win?: Json[]; lose?: Json[] } = {}): Json => ({
  kind: 'trainer', name, friendly: true, size: o.size ?? 3, types: o.types ?? [], levelBonus: o.lv ?? 0,
  ...(o.cls ? { classId: o.cls } : {}), ...(o.lineup ? { lineup: o.lineup } : {}), ...(o.sprite ? { sprite: o.sprite } : {}), ...(o.format ? { format: o.format } : {}),
  ...(o.rule ? { rule: o.rule } : {}), ...(o.ally ? { ally: o.ally } : {}), ...(o.mirror ? { mirror: true } : {}),
  win: o.win ?? [], ...(o.lose ? { lose: o.lose } : {}),
});

// ---------- events ----------
type Opts = EventOpts & { tags?: string[]; forced?: boolean; priority?: number; pseudo?: boolean; rarity?: 'common' | 'uncommon' | 'rare' | 'epic' };
/** A questline beat that gets its stop when it is due (`callback`). */
export function beat(id: string, name: string, o: Opts, intro: string, choices: Json[]): Json {
  return { ...ev(id, name, G, { rarity: 'rare', callback: true, ...o }, intro, choices), tags: o.tags ?? TAGS, stop: o.stop ?? 'event', types: o.types ?? [], minStage: o.minStage ?? 1, requires: o.requires ?? [], callback: o.callback ?? true, room: o.room ?? false, remembers: o.remembers ?? [] };
}
/** A scene that only opens from another scene (the next part of the same node). */
export function part(id: string, name: string, o: Opts, intro: string, choices: Json[]): Json {
  return beat(id, name, { ...o, callback: false, room: true }, intro, choices);
}

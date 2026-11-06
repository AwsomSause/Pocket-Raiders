// Story Overhaul S11: themes. A theme card is data (`themes.json`): a beat sheet, exclusive events pinned to named beats, twist cards,
// an ending table (first match wins) and a Journal tab. This file reads the ending table, and audits a theme: structure, fair-play
// clues, and "every ending can be reached" by playing the theme's own events (a search over every choice, no RNG).
import type { StoryData } from './schema';

type Theme = StoryData['themes'][number];
type Cond = Theme['endingGrid'][number]['when'][number];
type Flags = Record<string, boolean | number>;

/** Fair play: every twist plants at least this many clues before its reveal (design Part V-B). */
export const MIN_TWIST_CLUES = 3;
export const MIN_THEME_EVENTS = 6;
export const MAX_THEME_EVENTS = 10;
export const THEME_JOURNAL_TEMPLATES = 3;
export const MIN_THEME_TWISTS = 2;

const THEME_TAG = (id: string): string => `theme_${id}`;

function passes(c: Cond, flags: Flags): boolean {
  const actual = flags[String(c.key)];
  if (actual === undefined) return false;
  const want = c.value as boolean | number | string;
  switch ((c.op as string | undefined) ?? '==') {
    case '==': return actual === want;
    case '!=': return actual !== want;
    case '>=': return Number(actual) >= Number(want);
    case '<=': return Number(actual) <= Number(want);
    case '>': return Number(actual) > Number(want);
    case '<': return Number(actual) < Number(want);
    default: return false;
  }
}

/** Every flag the ending table reads, with the value a run that never touched it has (0 for a number test, false for a yes/no test). */
export function endingFlagDefaults(theme: Theme): Flags {
  const out: Flags = {};
  for (const row of theme.endingGrid) for (const c of row.when) out[String(c.key)] = typeof c.value === 'number' ? 0 : false;
  return out;
}

/** The ending a run's flags and counters land on. First matching row wins; flags nobody set count as 0 / false. */
export function resolveThemeEnding(theme: Theme, flags: Flags): string {
  const all = { ...endingFlagDefaults(theme), ...flags };
  for (const row of theme.endingGrid) if (row.when.every((c) => passes(c, all))) return row.ending;
  return theme.endingGrid[theme.endingGrid.length - 1]?.ending ?? '';
}

interface Fx { kind: string; key?: unknown; counter?: unknown; amount?: unknown; value?: unknown }

/** What one choice does to the flags that matter (add_counter adds, set_flag sets). */
function applyEffects(flags: Flags, effects: readonly Fx[]): Flags {
  const next = { ...flags };
  for (const e of effects) {
    if (e.kind === 'set_flag') next[String(e.key)] = e.value === undefined ? true : (e.value as boolean | number);
    else if (e.kind === 'add_counter') next[String(e.counter)] = Number(next[String(e.counter)] ?? 0) + Number(e.amount ?? 1);
  }
  return next;
}

/** One way to play a theme to an ending: the choice taken in each event it used, and the flags a fight or scene would set. */
export interface EndingWitness { ending: string; choices: Record<string, string>; battle: Flags }

/**
 * Plays the theme's own events to see which endings a run can reach. Each event may be skipped or resolved with any one of its choices;
 * the theme's battle flags can end up at any value. An ending is reachable when some play-through satisfies its row and none of the
 * rows above it (so a row hidden behind an easier row above it is reported as unreachable). Returns one witness per reachable ending.
 */
export function reachableEndings(data: StoryData, themeId: string): Map<string, EndingWitness> {
  const theme = data.themes.find((t) => t.id === themeId);
  const found = new Map<string, EndingWitness>();
  if (!theme) return found;
  const events = theme.events.map((id) => data.events.find((e) => e.id === id)).filter((e): e is StoryData['events'][number] => !!e);
  const keys = Object.keys(endingFlagDefaults(theme));
  const battleKeys = keys.filter((k) => theme.battleFlags.includes(k));
  const caps: Record<string, number> = {};
  for (const row of theme.endingGrid) for (const c of row.when) if (typeof c.value === 'number') caps[String(c.key)] = Math.max(caps[String(c.key)] ?? 0, c.value + 1);
  const norm = (f: Flags): Flags => {
    const o: Flags = {};
    for (const k of keys) { const v = f[k] ?? (k in caps ? 0 : false); o[k] = typeof v === 'number' ? Math.min(v, caps[k] ?? 1) : v; }
    return o;
  };
  const sig = (f: Flags): string => keys.map((k) => String(f[k])).join('|');
  type Node = { flags: Flags; choices: Record<string, string> };
  let layer = new Map<string, Node>([[sig(norm({})), { flags: norm({}), choices: {} }]]);
  for (const ev of events) {
    const next = new Map(layer);
    for (const n of layer.values()) {
      for (const ch of ev.choices) {
        const flags = norm(applyEffects(n.flags, ch.effects as Fx[]));
        const s = sig(flags);
        if (!next.has(s)) next.set(s, { flags, choices: { ...n.choices, [ev.id]: ch.id } });
      }
    }
    layer = next;
  }
  // Battle flags: try 0 / 1 for yes-no flags and 0 / cap for counters.
  const options = battleKeys.map((k) => (k in caps ? [0, caps[k]!] : [false, true]));
  const combos: Flags[] = [{}];
  battleKeys.forEach((k, i) => { const prev = combos.splice(0); for (const c of prev) for (const o of options[i]!) combos.push({ ...c, [k]: o as boolean | number }); });
  for (const n of layer.values()) {
    for (const b of combos) {
      const all = { ...endingFlagDefaults(theme), ...n.flags, ...b };
      const ending = resolveThemeEnding(theme, all);
      if (!found.has(ending)) found.set(ending, { ending, choices: n.choices, battle: b });
    }
  }
  return found;
}

/** Problems with one theme card; an empty list means it is complete and playable to every ending. */
export function validateTheme(data: StoryData, themeId: string): string[] {
  const theme = data.themes.find((t) => t.id === themeId);
  if (!theme) return [`theme "${themeId}" does not exist`];
  const problems: string[] = [];
  const text = (k: string, what: string) => { if (!(k in data.text)) problems.push(`${what}: missing text "${k}"`); };
  text(theme.nameKey, 'theme name');
  const slots = theme.beatSheet.map((b) => b.slot);
  if (new Set(slots).size !== slots.length) problems.push('beat sheet repeats a beat name');
  for (const act of [1, 2, 3, 4, 5, 6, 7, 8]) if (!theme.beatSheet.some((b) => b.act === act)) problems.push(`beat sheet has no beats in act ${act}`);
  // Exclusive events: 6 to 10, tagged theme_<id>, each pinned to a real beat, with text.
  if (theme.events.length < MIN_THEME_EVENTS || theme.events.length > MAX_THEME_EVENTS) problems.push(`needs ${MIN_THEME_EVENTS} to ${MAX_THEME_EVENTS} exclusive events (has ${theme.events.length})`);
  for (const id of theme.events) {
    const ev = data.events.find((e) => e.id === id);
    if (!ev) { problems.push(`unknown event "${id}"`); continue; }
    if (!ev.tags.includes(THEME_TAG(themeId))) problems.push(`event ${id} lacks tag ${THEME_TAG(themeId)}`);
    if (!theme.slotRules.some((r) => (r as { event?: unknown }).event === id)) problems.push(`event ${id} has no slot rule`);
    for (const b of ev.beats) if (typeof (b as { textKey?: unknown }).textKey === 'string') text((b as unknown as { textKey: string }).textKey, id);
  }
  for (const e of data.events) if (e.tags.includes(THEME_TAG(themeId)) && !theme.events.includes(e.id)) problems.push(`event ${e.id} is tagged for this theme but not listed`);
  for (const r of theme.slotRules) if (!slots.includes(r.slot)) problems.push(`slot rule names unknown beat "${r.slot}"`);
  // Twists: 2 or more, 3 or more clues planted on earlier beats than the reveal.
  if (theme.twists.length < MIN_THEME_TWISTS) problems.push(`needs ${MIN_THEME_TWISTS} twist cards (has ${theme.twists.length})`);
  for (const w of theme.twists) {
    const reveal = slots.indexOf(w.revealSlot);
    if (reveal < 0) { problems.push(`twist ${w.id}: unknown reveal beat "${w.revealSlot}"`); continue; }
    const early = w.clues.filter((c) => slots.indexOf(c.slot) >= 0 && slots.indexOf(c.slot) < reveal);
    if (early.length < MIN_TWIST_CLUES) problems.push(`twist ${w.id}: ${early.length} clue(s) before the reveal, needs ${MIN_TWIST_CLUES}`);
    if (early.length !== w.clues.length) problems.push(`twist ${w.id}: a clue sits on an unknown beat or after the reveal`);
    if (new Set(w.clues.map((c) => c.slot)).size !== w.clues.length) problems.push(`twist ${w.id}: two clues share a beat`);
    for (const k of [w.revealKey, w.motiveKey, w.consequenceKey, ...w.clues.map((c) => c.textKey)]) text(k, `twist ${w.id}`);
  }
  // Journal tab.
  if (!theme.journal) problems.push('no Journal tab');
  else {
    text(theme.journal.nameKey, 'journal name');
    if (theme.journal.templates.length !== THEME_JOURNAL_TEMPLATES) problems.push(`Journal tab needs ${THEME_JOURNAL_TEMPLATES} templates`);
    for (const k of theme.journal.templates) text(k, 'journal template');
  }
  const rivalRow = data.rivalThemes.find((r) => r.theme === themeId);
  if (!rivalRow) problems.push('no rival row in rivalThemes.json');
  else for (const id of [rivalRow.primary, rivalRow.secondary, rivalRow.friendly]) if (!data.rivals.some((r) => r.id === id)) problems.push(`rival "${id}" does not exist`);
  if (Object.keys(theme.backstoryFit).length === 0) problems.push('no backstory fit');
  // Ending table: a catch-all last row, every listed ending has a row, text for each.
  const grid = theme.endingGrid;
  if (grid.length === 0) problems.push('ending table is empty');
  else {
    if (grid[grid.length - 1]!.when.length > 0) problems.push('ending table has no catch-all last row');
    if (grid.slice(0, -1).some((r) => r.when.length === 0)) problems.push('a catch-all row sits above the last row');
    for (const e of theme.endings) if (!grid.some((r) => r.ending === e)) problems.push(`ending "${e}" is in no row`);
    for (const r of grid) { if (!theme.endings.includes(r.ending)) problems.push(`row names unlisted ending "${r.ending}"`); text(r.nameKey, r.ending); text(r.sceneKey, r.ending); }
    // Every flag an ending reads has a source: an event choice, a battle flag, or the default of 0 / false.
    const settable = new Set(theme.battleFlags);
    for (const id of theme.events) for (const ch of data.events.find((e) => e.id === id)?.choices ?? []) for (const fx of ch.effects as Fx[]) settable.add(String(fx.kind === 'add_counter' ? fx.counter : fx.key));
    for (const row of grid) for (const c of row.when) {
      const positive = c.value === true || (typeof c.value === 'number' && ((c.op === '>=' && c.value > 0) || (c.op === '>' ))) ;
      if (positive && !settable.has(String(c.key))) problems.push(`${row.ending}: nothing sets "${String(c.key)}"`);
    }
    const reach = reachableEndings(data, themeId);
    for (const e of theme.endings) if (!reach.has(e)) problems.push(`ending "${e}" cannot be reached`);
  }
  return problems;
}

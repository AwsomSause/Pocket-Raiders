// Choice memory (Beta 0.6): what events remember across a run, and how a remembered flag changes a scene.
// Pure: no RNG. Flags live in `run.story.flags` as `ev:<key>` (the existing `flag` condition and effect), so no save change.
// The pack's flag ids (`kind.helped_stranger`) become keys with `memoryKey`. The registry is src/data/overhaul/memoryFlags.json.

import type { Content, EventChoice, EventDef, EventVariant } from './contentSchema';
import { conditionMet } from './events';
import { gnTokens } from './greenneedle';
import { fillEventText } from './evil/text';
import type { RunState } from './state';

/** `kind.helped_stranger` -> `kind-helped-stranger` (the key format the `flag` effect accepts). */
export const memoryKey = (id: string): string => id.toLowerCase().replace(/[._/]+/g, '-');

/** A remembered flag's current value (0 when never set). */
export function memoryValue(run: Pick<RunState, 'story'>, id: string): number {
  return Number(run.story.flags[`ev:${memoryKey(id)}`] ?? 0);
}
export const remembered = (run: Pick<RunState, 'story'>, id: string): boolean => memoryValue(run, id) > 0;

/** The one variant that applies now: the first whose conditions all hold (or null). */
export function activeVariant(content: Content, run: RunState, event: EventDef): EventVariant | null {
  return event.remembers.find((v) => v.when.every((c) => conditionMet(content, run, c))) ?? null;
}

/** Every choice an event can ever show: the base choices, then each variant's added choices in order. The index is stable. */
export function allChoices(event: EventDef): EventChoice[] {
  return [...event.choices, ...event.remembers.flatMap((v) => v.addChoices)];
}

/** The choice at a stored index (base choices keep theirs; added ones follow). */
export const choiceAt = (event: EventDef | undefined, index: number): EventChoice | undefined => (event ? allChoices(event)[index] : undefined);

/** What the player sees: the variant's intro and the visible choices, each with its stable index. */
export function visibleChoices(content: Content, run: RunState, event: EventDef): { index: number; choice: EventChoice }[] {
  const v = activeVariant(content, run, event);
  const shown = (c: { choice: EventChoice }): boolean => !c.choice.showIf || c.choice.showIf.every((x) => conditionMet(content, run, x));
  const base = event.choices.map((choice, index) => ({ index, choice })).filter((c) => (!v || !v.hide.includes(c.index)) && shown(c));
  if (!v) return base;
  let at = event.choices.length;
  for (const other of event.remembers) {
    if (other.id === v.id) return [...base, ...v.addChoices.map((choice, i) => ({ index: at + i, choice })).filter(shown)];
    at += other.addChoices.length;
  }
  return base;
}

/** The event as the player sees it now: remembered intro, hidden and added choices applied (indices are positions in the view), and the region's team named where a scene uses tokens (core/evil/text.ts). */
export function effectiveEvent(content: Content, run: RunState, event: EventDef): EventDef {
  const v = activeVariant(content, run, event);
  // Greenneedle gn.24: `{petname}` / `{partner}` name the partner Pokémon.
  const say = (text: string): string => gnTokens(content, run, fillEventText(content, run, text));
  const tokens = event.intro.includes('{') || event.choices.some((c) => c.label.includes('{')) || event.remembers.some((r) => JSON.stringify(r).includes('{'));
  // Greenneedle: a choice with `showIf` is shown only while its conditions hold, variant or not.
  const showIf = event.choices.some((c) => c.showIf);
  if (!v && !showIf) return tokens ? { ...event, intro: say(event.intro), choices: event.choices.map((c) => ({ ...c, label: say(c.label) })) } : event;
  const intro = say(v ? [v.intro ?? event.intro, v.notice].filter(Boolean).join(' ') : event.intro);
  return { ...event, intro, choices: visibleChoices(content, run, event).map((c) => ({ ...c.choice, label: say(c.choice.label) })) };
}

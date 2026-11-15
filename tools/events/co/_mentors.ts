// Kit for the mentor scenes (STORY_FAMILIES_5.md). Files starting with "_" are not built. Guide: docs/status/co-people.md, "Mentors".
//
// How the arc runs in a run (one mentor per run, `run.mentor`, the existing mentor system):
//   Lesson (first region it can be met)  -> sets `mentor-lesson` (stamped with the region)
//   Recruit (one region after the Lesson at the earliest) -> sets `mentor-recruit` when a Pokémon is taken
//   Story (two regions after the Lesson at the earliest)  -> sets `mentor-story` plus the decision flag (`brook-mother`)
//   Nothing Left to Teach (MS12: a region after the Story, in the run's last two regions) -> the mentor's Final Lesson room, then the farewell room
// Shared scenes are one event for all twelve mentors: write `{mentor}` for the mentor's name and `{mentorDrill}` for their Training drill.
// Every scene also moves the old trust/loyalty meters (`trust(...)`), so the mentor HUD and run summary keep working.
import { ch, flagAgo, flagAt, out, type Json } from '../dsl.ts';
import { is, not, oldOf, variant, type Scene } from './_people.ts';

/** The twelve mentors (src/data/mentors.json ids) and the name they go by in scenes. */
export const MENTORS: Record<string, string> = {
  'brook-tidewater': 'Brook', 'celeste-ribbon': 'Celeste', 'dax-corvane': 'Dax', 'fenwick-eon': 'Fenwick', 'juno-trailwind': 'Juno', 'linden-vale': 'Linden',
  'marigold-hatch': 'Marigold', 'ravi-ironhand': 'Ravi', 'sable-oakridge': 'Sable', 'tobias-satchel': 'Tobias', 'vesper-nox': 'Vesper', 'ysolde-marrow': 'Ysolde',
};

/** The run has this mentor (or any mentor). */
export const mentorIs = (id?: string): Json => ({ kind: 'mentor', ...(id ? { id } : {}) });
/** The mentor's Lesson bonus for the run; `again` = once more (the Training Session drill). */
export const lesson = (again = false): Json => ({ kind: 'mentorLesson', again });
/** Opens this run's mentor's own scene `mentor-<id>-<part>` here (`story`, `final`, `recruit`). */
export const mentorScene = (part: string): Json => ({ kind: 'mentorScene', part });
/** The existing mentor meters: trust, loyalty, rivalry with the fellow apprentice. */
export const trust = (t: number, loyalty = 0, rivalry = 0): Json => ({ kind: 'mentor', trust: t, loyalty, rivalry });
/** At most this many regions of the run left after this one. */
export const regionsLeft = (atMost: number): Json => ({ kind: 'regionsLeft', atMost });
/** A Pokémon joins, fonder of you: "at Bond 3" = `bondJoin(3, ...)` (5 friendship a Bond point). */
export const bondJoin = (bondLevel: number, o: { species?: string[]; types?: string[]; starterType?: boolean; lv?: number }): Json => ({
  kind: 'join', species: o.species ?? [], types: o.types ?? [], levelBonus: o.lv ?? 0, friendship: 5 * bondLevel, ...(o.starterType ? { starterType: true } : {}),
});

/** Arc flags shared by every mentor: `mentor-lesson`, `mentor-recruit`, `mentor-story`, `mentor-graduated`, and the shared scenes' own. */
export const M = {
  set: (name: string, amount = 1): Json => flagAt(`mentor-${name}`, amount),
  is: (name: string, n = 1): Json => is(`mentor-${name}`, n),
  not: (name: string): Json => not(`mentor-${name}`),
  ago: (name: string, regions = 1): Json => flagAgo(`mentor-${name}`, regions),
};
/** Ressa's flags (`ressa.showdown` -> `ressa-showdown`). */
export const R = {
  set: (name: string, amount = 1): Json => flagAt(`ressa-${name}`, amount),
  is: (name: string, n = 1): Json => is(`ressa-${name}`, n),
  not: (name: string): Json => not(`ressa-${name}`),
};

const sceneOf = (id: string, fallback?: string): Json => (oldOf(id).scene as Json | undefined) ?? (fallback ? (oldOf(fallback).scene as Json | undefined) : undefined) ?? { cast: [], effect: 'none' };

/** A shared mentor scene (MS1-MS12) at an old catalog id. Shown by the mentor stop (group "Mentors"). */
export function shared(id: string, s: Scene & { callback?: boolean; rarity?: string }): Json {
  return {
    id, name: `Mentor: ${s.title}`, group: 'Mentors', rarity: s.rarity ?? 'uncommon', minStage: s.minStage ?? 1, requires: s.requires ?? [mentorIs()],
    ...(s.callback ? { callback: true } : {}), scene: s.scene ?? sceneOf(id), intro: s.intro, choices: s.choices, ...(s.remembers ? { remembers: s.remembers } : {}),
  };
}

/** A side scene of a shared scene (`<id>-<name>`), opened with `room(...)`. */
export function sharedRoom(id: string, name: string, s: Scene): Json {
  return {
    id: `${id}-${name}`, name: `Mentor: ${s.title}`, group: 'Mentors', rarity: 'uncommon', room: true, requires: s.requires ?? [],
    scene: s.scene ?? sceneOf(id), intro: s.intro, choices: s.choices, ...(s.remembers ? { remembers: s.remembers } : {}),
  };
}

/**
 * One mentor's scenes (Part B of STORY_FAMILIES_5.md): `lesson`, `recruit`, `story` at the catalog ids `mentor-<id>-lesson/-recruit/-story`,
 * and the rooms `final` (the Final Lesson battle, opened by MS12) and `farewell` (the last line and the gift, opened by the battle).
 * `set('mother')` sets the doc's `brook.mother` as `brook-mother` (the short name, lower case).
 */
export function mentorKit(mentorId: string) {
  const who = MENTORS[mentorId];
  if (!who) throw new Error(`unknown mentor ${mentorId}`);
  const short = who.toLowerCase();
  const id = (part: string) => `mentor-${mentorId}-${part}`;
  const lessonScene = sceneOf(id('lesson'));
  const base = { group: 'Mentors', rarity: 'uncommon' };
  const make = (part: string, gate: Json[], s: Scene): Json => ({
    id: id(part), name: `${who}: ${s.title}`, ...base, minStage: s.minStage ?? 1, requires: [mentorIs(mentorId), ...gate, ...(s.requires ?? [])],
    scene: s.scene ?? sceneOf(id(part), id('lesson')), intro: s.intro, choices: s.choices, ...(s.remembers ? { remembers: s.remembers } : {}),
  });
  return {
    who,
    id,
    set: (name: string, amount = 1): Json => flagAt(`${short}-${name}`, amount),
    is: (name: string, n = 1): Json => is(`${short}-${name}`, n),
    not: (name: string): Json => not(`${short}-${name}`),
    key: (name: string) => `${short}-${name}`,
    lesson: (s: Scene): Json => make('lesson', [M.not('lesson')], s),
    recruit: (s: Scene): Json => make('recruit', [M.ago('lesson', 1), M.not('recruit')], s),
    story: (s: Scene): Json => make('story', [M.ago('lesson', 2), M.not('story')], s),
    /** A side scene of this mentor (`mentor-<id>-<name>`): the Final Lesson, the farewell, a search node, a "choose again". */
    room(name: string, s: Scene): Json {
      return {
        id: id(name), name: `${who}: ${s.title}`, ...base, room: true, requires: s.requires ?? [],
        scene: s.scene ?? lessonScene, intro: s.intro, choices: s.choices, ...(s.remembers ? { remembers: s.remembers } : {}),
      };
    },
  };
}

/** The farewell room's one choice: graduation (`mentor-graduated`), the gift, and trust enough for the old meter to count it as graduated. */
export const graduate = (text: string, ...gift: Json[]): Json => ch('"Thank you."', out(text, M.set('graduated'), ...gift, trust(40, 5)));
/** MS4's "Forty times?": the mentor's next scene has the line "Bram told you. Of course he did." (a Remembers variant for a Story). */
export const bramLine = (who: string): Json => variant('bram', [M.is('bram-told')], { notice: `${who} gives you a narrow look. ${who}: "Bram told you. Of course he did."` });

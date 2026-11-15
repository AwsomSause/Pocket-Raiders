// Catalog Overhaul, people (STORY_FAMILIES_5.md): what a mentor's Lesson gives for the run, and the mentor words in shared scenes.
// The shared scenes (Training Session, The Shortcut, Nothing Left to Teach...) are one event for all twelve mentors: `{mentor}` and
// `{mentorDrill}` in their text become this run's mentor, and `mentorScene` opens this run's mentor's own scene (`mentor-<id>-<part>`).
import type { ArchetypeModifier, Content, TypeName } from '../contentSchema';
import { getSpecies } from '../pokemon';
import type { RunState } from '../state';
import { getMentor } from './index';

const flag = (run: Pick<RunState, 'story'>, key: string): number => Number(run.story.flags[`ev:${key}`] ?? 0);

/** The type Brook's apprentice picked: Water, or the starter's first type (fixed when the lesson is taken). */
function brookType(content: Content, run: RunState): TypeName {
  if (flag(run, 'brook-starter') > 0) {
    const starter = run.party.find((m) => m.uid === run.log.starterUid) ?? run.party[0];
    if (starter) return getSpecies(content, starter.speciesId).types[0]!;
  }
  return 'water';
}

/** The modifiers each mentor's Lesson adds for the run (the Lesson table of STORY_FAMILIES_5.md, Part B). Ysolde's is a Legendary Sign bonus, kept as a flag. */
export function lessonModifiers(content: Content, run: RunState): ArchetypeModifier[] {
  switch (run.mentor?.id) {
    case 'brook-tidewater': return [{ kind: 'stabDamageMultiplier', type: brookType(content, run), value: 1.05 }];
    case 'celeste-ribbon': return [{ kind: 'statusMoveAccuracy', value: 1.1 }];
    case 'dax-corvane': return [{ kind: 'lostBattleXp', value: 1.5 }];
    case 'fenwick-eon': return [{ kind: 'declinedEvolutionBoost', step: 2, max: 10 }];
    case 'juno-trailwind': return [{ kind: 'hiddenItemSight', nodes: 2 }];
    case 'linden-vale': return [{ kind: 'foeMovePreview' }];
    case 'marigold-hatch': return [{ kind: 'friendshipMultiplier', value: 1.25 }];
    case 'ravi-ironhand': return [{ kind: 'turnOneKoSpeed', stages: 1 }];
    case 'sable-oakridge': return [{ kind: 'noFlinchTurnOne' }];
    case 'tobias-satchel': return [{ kind: 'shopWorthIt' }, { kind: 'shopDeal', value: 0.8 }];
    case 'vesper-nox': return [{ kind: 'foeMissBoost', stages: 1 }];
    default: return [];
  }
}

/**
 * The `mentorLesson` effect: the run's mentor's Lesson bonus, once (`again`: the Training Session's specialism drill, which applies it
 * once more). Ysolde's Lesson adds +1 to the run flag `ysolde-sign-influence` (Legendary Signs read it). Returns what changed, or ''.
 */
export function applyMentorLesson(content: Content, run: RunState, again: boolean): string {
  const mentor = getMentor(run.mentor?.id);
  if (!mentor) return '';
  const id = again ? 'mentor-lesson-again' : 'mentor-lesson';
  if (run.story.flags[`relic:${id}`]) return '';
  run.story.flags[`relic:${id}`] = true;
  if (mentor.id === 'ysolde-marrow') {
    run.story.flags['ev:ysolde-sign-influence'] = flag(run, 'ysolde-sign-influence') + 1;
    return `${mentor.short ?? mentor.name}'s lesson: every Legendary Sign is worth +1 Influence`;
  }
  const mods = lessonModifiers(content, run);
  if (mods.length === 0) return '';
  run.perkEffects = [...(run.perkEffects ?? []), ...mods];
  return `${mentor.short ?? mentor.name}'s lesson${again ? ', once more' : ''}, for the run`;
}

/** The id of this run's mentor's own scene (`mentor-<id>-<part>`), when it exists. */
export function mentorSceneId(content: Content, run: Pick<RunState, 'mentor'>, part: string): string | null {
  const id = run.mentor ? `mentor-${run.mentor.id}-${part}` : null;
  return id && content.events.has(id) ? id : null;
}

/** Fills `{mentor}` (the name the mentor goes by) and `{mentorDrill}` (their Training Session drill) in event text. */
export function fillMentorText(run: Pick<RunState, 'mentor'>, text: string): string {
  if (!text.includes('{mentor')) return text;
  const m = getMentor(run.mentor?.id);
  return text.replace(/\{mentor\}/g, m?.short ?? m?.name ?? 'Your mentor').replace(/\{mentorDrill\}/g, m?.drill ?? 'Your way');
}

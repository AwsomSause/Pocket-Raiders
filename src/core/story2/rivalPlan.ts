// Story Overhaul S10 wiring: a Story Run's rivals fight with the written teams. Pure over (content, run); the only writes are Pip's draw history
// (a flag) and a sparked rival's story id. Classic runs never reach any of this, so no Classic roll moves.
import type { Content } from '../contentSchema';
import type { PlannedMember, TrainerPlan } from '../encounters';
import { runLevelCap } from '../regions';
import type { RunState } from '../state';
import type { Rival } from '../story/schema';
import { actForStage, pipDraw, pipTeamKey, rivalById, storyRoleOf, teamFor, type RivalBands } from './storyRivals';
import type { RivalRole, StoryRival } from './schema';

const PIP_HISTORY = 'rvpip:history';

/** The run's story rival ids by role, or undefined outside a Story Run. */
export const storyRoles = (run: RunState) => run.story.v2?.blueprint?.rivals;

export function storyRivalName(content: Content, id: string): string | null {
  const r = rivalById(content.storyData, id);
  const ch = r && content.storyData.characters.find((c) => c.id === r.character);
  return (ch && content.storyData.text[ch.nameKey]) || null;
}

/** The text of one of a story rival's battle lines (intro, mid, win, lose, aceOut, rematch, rematchAfter), or null. */
export function storyRivalLine(content: Content, id: string, kind: keyof StoryRival['lines']): string | null {
  const key = rivalById(content.storyData, id)?.lines[kind];
  return (key && content.storyData.text[key]) || null;
}

const bandsOf = (content: Content): RivalBands => content.balance.story.rivalBands;

function breakdown(level: number, base: number) {
  return { base, progress: 0, variance: 0, archetypeOffset: 0, bonus: level - base, unclamped: level, level };
}

/** Marisol has Bastion back once the Act 4 cage scene set either freed flag. */
const bastionFreed = (run: RunState): boolean => Boolean(run.story.flags.bastion_freed || run.story.v2?.facts.bastion_freed);

function planFromTeam(content: Content, run: RunState, def: StoryRival, base: TrainerPlan, act: number, role: RivalRole, floor: number[] = []): TrainerPlan {
  const history = String(run.story.flags[PIP_HISTORY] ?? '').split('|').filter(Boolean);
  const fight = history.length;
  const drawn = def.drawPool.length > 0 ? pipDraw(def, act, run.seed, fight, history) : [];
  const team = teamFor(def, act, { role, cap: runLevelCap(content, run), bands: bandsOf(content), freed: bastionFreed(run), drawn }).filter((m) => content.species.has(m.species));
  if (team.length === 0) return base;
  if (def.drawPool.length > 0) run.story.flags[PIP_HISTORY] = [...history, pipTeamKey(def.teams[act - 1]!.slots.map((s) => s.species), drawn)].join('|');
  // Never weaker than the plan it replaces (the harder-rival rule: the ace stays at your level +2).
  const members: PlannedMember[] = team.map((m, i) => ({ speciesId: m.species, level: Math.max(m.level, floor[i] ?? 0) }));
  return { ...base, name: storyRivalName(content, def.id) ?? base.name, members, levelInfo: members.map((m) => breakdown(m.level, content.balance.rival.level)) };
}

/** Story Run, stage-2 slot (rule R3): the Primary rival's Act 1 team replaces the scripted starter pair. Null outside a Story Run. */
export function storyFirstRivalPlan(content: Content, run: RunState, base: TrainerPlan): TrainerPlan | null {
  const primary = storyRoles(run)?.primary;
  const def = primary ? rivalById(content.storyData, primary) : undefined;
  if (!def) return null;
  // The scripted plan has the opener first and the ace last; the story Ace is its own slot, so only the ace slot keeps the old floor.
  const aceIndex = Math.max(0, def.teams[0]!.slots.findIndex((s) => s.ace));
  const floor = def.teams[0]!.slots.map((_, i) => (i === aceIndex ? base.members[base.members.length - 1]?.level ?? 0 : base.members[0]?.level ?? 0));
  return planFromTeam(content, run, def, base, 1, 'primary', floor);
}

/** A returning story rival fights with the written team of the current Act. Other rivals (and Classic) get the plan unchanged. */
export function storyRivalPlan(content: Content, run: RunState, rival: Rival, base: TrainerPlan, stageNumber: number): TrainerPlan {
  const def = rival.storyRival ? rivalById(content.storyData, rival.storyRival) : undefined;
  const role = rival.storyRival ? storyRoleOf(storyRoles(run), rival.storyRival) : null;
  if (!def || !role) return base;
  return planFromTeam(content, run, def, base, actForStage(content.balance.story.actEndStages, stageNumber), role);
}

/** The first rival of a Story Run is the Primary: tag the new record with its story id and name. */
export function tagPrimary(content: Content, run: RunState, rival: Rival): void {
  const id = storyRoles(run)?.primary;
  if (!id || !rivalById(content.storyData, id)) return;
  rival.storyRival = id;
  rival.name = storyRivalName(content, id) ?? rival.name;
}

/** Sparked rivals of a Story Run become the Secondary, then the Friendly rival, in list order (rule R1). Extra sparks stay ordinary. */
export function assignStoryRole(content: Content, run: RunState, rival: Rival): void {
  const roles = storyRoles(run);
  if (!roles || rival.major || rival.storyRival) return;
  const taken = run.story.rivals.filter((r) => r !== rival && !r.major && r.storyRival).length;
  const id = taken === 0 ? roles.secondary : taken === 1 ? roles.friendly : null;
  if (!id || !rivalById(content.storyData, id) || run.story.rivals.some((r) => r.storyRival === id)) return;
  rival.storyRival = id;
  rival.name = storyRivalName(content, id) ?? rival.name;
}

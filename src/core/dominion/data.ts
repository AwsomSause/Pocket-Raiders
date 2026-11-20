// DOMINION data, validated once at load. A file that fails throws and names the field.

import startRaw from '../../data/dominion/start.json';
import actionsRaw from '../../data/dominion/actions.json';
import crewRaw from '../../data/dominion/crew.json';
import fieldRaw from '../../data/dominion/field.json';
import gruntTypesRaw from '../../data/dominion/gruntTypes.json';
import personalityRaw from '../../data/dominion/personality.json';
import tasksRaw from '../../data/dominion/tasks.json';
import empireRaw from '../../data/dominion/empire.json';
import heroRaw from '../../data/dominion/hero.json';
import hqRaw from '../../data/dominion/hq.json';
import buildingsRaw from '../../data/dominion/buildings.json';
import pyramidRaw from '../../data/dominion/pyramid.json';
import rivalsRaw from '../../data/dominion/rivals.json';
import rivalActionsRaw from '../../data/dominion/rivalActions.json';
import outsideRaw from '../../data/dominion/outside.json';
import growthRaw from '../../data/dominion/growth.json';
import growthActionsRaw from '../../data/dominion/growthActions.json';
import {
  GrowthActionsSchema, GrowthFileSchema, type FieldFile as FieldFileT, type GrowthActions, type GrowthFile,
  ActionsFileSchema, BuildingsFileSchema, EmpireFileSchema, OutsideFileSchema, RivalActionsFileSchema, RivalsFileSchema, CrewFileSchema, HqFileSchema, PyramidFileSchema, FieldFileSchema, GruntTypesFileSchema, HeroFileSchema, PersonalityFileSchema, StartFileSchema, TasksFileSchema,
  type ActionsFile, type Building, type EmpireFile, type OutsideRow, type RivalActionsFile, type RivalsFile, type CrewFile, type HqFile, type PyramidFile, type FieldFile, type GruntType, type HeroFile, type PersonalityFile, type StartFile, type Task,
} from './schema';

const growth = GrowthFileSchema.parse(growthRaw);
const growthActions = GrowthActionsSchema.parse(growthActionsRaw);
/** D10: Growth's plays (its own rows 1-150 and the list's rows 151-600) and crates join the field data; the rows that wait name their slice. */
function withGrowth(f: FieldFileT): FieldFileT {
  return {
    ...f,
    play: { ...f.play, ...growthActions.play, ...growth.play },
    crates: { ...f.crates, ...growth.crates },
    later: { ...f.later, byAction: { ...f.later.byAction, ...growthActions.later, ...growth.later } },
  };
}

export const DOMINION_DATA: { growth: GrowthFile; growthActions: GrowthActions; start: StartFile; actions: ActionsFile; field: FieldFile; crew: CrewFile; tasks: Task[]; gruntTypes: GruntType[]; empire: EmpireFile; hq: HqFile; buildings: Building[]; pyramid: PyramidFile; rivals: RivalsFile; rivalActions: RivalActionsFile; outside: OutsideRow[]; personality: PersonalityFile; hero: HeroFile } = {
  start: StartFileSchema.parse(startRaw),
  actions: ActionsFileSchema.parse(actionsRaw),
  field: withGrowth(FieldFileSchema.parse(fieldRaw)),
  growth,
  growthActions,
  crew: CrewFileSchema.parse(crewRaw),
  tasks: TasksFileSchema.parse(tasksRaw).tasks,
  gruntTypes: GruntTypesFileSchema.parse(gruntTypesRaw).types,
  empire: EmpireFileSchema.parse(empireRaw),
  pyramid: PyramidFileSchema.parse(pyramidRaw),
  hero: HeroFileSchema.parse(heroRaw),
  hq: HqFileSchema.parse(hqRaw),
  buildings: BuildingsFileSchema.parse(buildingsRaw).buildings,
  rivals: RivalsFileSchema.parse(rivalsRaw),
  rivalActions: RivalActionsFileSchema.parse(rivalActionsRaw),
  outside: OutsideFileSchema.parse(outsideRaw).rows,
  personality: PersonalityFileSchema.parse(personalityRaw),
};

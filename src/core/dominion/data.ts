// DOMINION data, validated once at load. A file that fails throws and names the field.

import startRaw from '../../data/dominion/start.json';
import actionsRaw from '../../data/dominion/actions.json';
import crewRaw from '../../data/dominion/crew.json';
import fieldRaw from '../../data/dominion/field.json';
import gruntTypesRaw from '../../data/dominion/gruntTypes.json';
import personalityRaw from '../../data/dominion/personality.json';
import tasksRaw from '../../data/dominion/tasks.json';
import hqRaw from '../../data/dominion/hq.json';
import buildingsRaw from '../../data/dominion/buildings.json';
import pyramidRaw from '../../data/dominion/pyramid.json';
import rivalsRaw from '../../data/dominion/rivals.json';
import rivalActionsRaw from '../../data/dominion/rivalActions.json';
import outsideRaw from '../../data/dominion/outside.json';
import {
  ActionsFileSchema, BuildingsFileSchema, OutsideFileSchema, RivalActionsFileSchema, RivalsFileSchema, CrewFileSchema, HqFileSchema, PyramidFileSchema, FieldFileSchema, GruntTypesFileSchema, PersonalityFileSchema, StartFileSchema, TasksFileSchema,
  type ActionsFile, type Building, type OutsideRow, type RivalActionsFile, type RivalsFile, type CrewFile, type HqFile, type PyramidFile, type FieldFile, type GruntType, type PersonalityFile, type StartFile, type Task,
} from './schema';

export const DOMINION_DATA: { start: StartFile; actions: ActionsFile; field: FieldFile; crew: CrewFile; tasks: Task[]; gruntTypes: GruntType[]; hq: HqFile; buildings: Building[]; pyramid: PyramidFile; rivals: RivalsFile; rivalActions: RivalActionsFile; outside: OutsideRow[]; personality: PersonalityFile } = {
  start: StartFileSchema.parse(startRaw),
  actions: ActionsFileSchema.parse(actionsRaw),
  field: FieldFileSchema.parse(fieldRaw),
  crew: CrewFileSchema.parse(crewRaw),
  tasks: TasksFileSchema.parse(tasksRaw).tasks,
  gruntTypes: GruntTypesFileSchema.parse(gruntTypesRaw).types,
  pyramid: PyramidFileSchema.parse(pyramidRaw),
  hq: HqFileSchema.parse(hqRaw),
  buildings: BuildingsFileSchema.parse(buildingsRaw).buildings,
  rivals: RivalsFileSchema.parse(rivalsRaw),
  rivalActions: RivalActionsFileSchema.parse(rivalActionsRaw),
  outside: OutsideFileSchema.parse(outsideRaw).rows,
  personality: PersonalityFileSchema.parse(personalityRaw),
};

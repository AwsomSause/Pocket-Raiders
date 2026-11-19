// DOMINION data, validated once at load. A file that fails throws and names the field.

import startRaw from '../../data/dominion/start.json';
import actionsRaw from '../../data/dominion/actions.json';
import crewRaw from '../../data/dominion/crew.json';
import fieldRaw from '../../data/dominion/field.json';
import gruntTypesRaw from '../../data/dominion/gruntTypes.json';
import tasksRaw from '../../data/dominion/tasks.json';
import empireRaw from '../../data/dominion/empire.json';
import {
  ActionsFileSchema, CrewFileSchema, EmpireFileSchema, FieldFileSchema, GruntTypesFileSchema, StartFileSchema, TasksFileSchema,
  type ActionsFile, type CrewFile, type EmpireFile, type FieldFile, type GruntType, type StartFile, type Task,
} from './schema';

export const DOMINION_DATA: { start: StartFile; actions: ActionsFile; field: FieldFile; crew: CrewFile; tasks: Task[]; gruntTypes: GruntType[]; empire: EmpireFile } = {
  start: StartFileSchema.parse(startRaw),
  actions: ActionsFileSchema.parse(actionsRaw),
  field: FieldFileSchema.parse(fieldRaw),
  crew: CrewFileSchema.parse(crewRaw),
  tasks: TasksFileSchema.parse(tasksRaw).tasks,
  gruntTypes: GruntTypesFileSchema.parse(gruntTypesRaw).types,
  empire: EmpireFileSchema.parse(empireRaw),
};

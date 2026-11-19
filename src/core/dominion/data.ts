// DOMINION data, validated once at load. A file that fails throws and names the field.

import startRaw from '../../data/dominion/start.json';
import actionsRaw from '../../data/dominion/actions.json';
import crewRaw from '../../data/dominion/crew.json';
import deskRaw from '../../data/dominion/desk.json';
import fieldRaw from '../../data/dominion/field.json';
import gruntTypesRaw from '../../data/dominion/gruntTypes.json';
import personalityRaw from '../../data/dominion/personality.json';
import tasksRaw from '../../data/dominion/tasks.json';
import {
  ActionsFileSchema, CrewFileSchema, DeskFileSchema, FieldFileSchema, GruntTypesFileSchema, PersonalityFileSchema, StartFileSchema, TasksFileSchema,
  type ActionsFile, type CrewFile, type DeskFile, type FieldFile, type GruntType, type PersonalityFile, type StartFile, type Task,
} from './schema';

export const DOMINION_DATA: { start: StartFile; actions: ActionsFile; field: FieldFile; crew: CrewFile; tasks: Task[]; gruntTypes: GruntType[]; personality: PersonalityFile; desk: DeskFile } = {
  start: StartFileSchema.parse(startRaw),
  actions: ActionsFileSchema.parse(actionsRaw),
  field: FieldFileSchema.parse(fieldRaw),
  crew: CrewFileSchema.parse(crewRaw),
  tasks: TasksFileSchema.parse(tasksRaw).tasks,
  gruntTypes: GruntTypesFileSchema.parse(gruntTypesRaw).types,
  personality: PersonalityFileSchema.parse(personalityRaw),
  desk: DeskFileSchema.parse(deskRaw),
};

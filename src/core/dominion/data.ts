// DOMINION data, validated once at load. A file that fails throws and names the field.

import startRaw from '../../data/dominion/start.json';
import crewRaw from '../../data/dominion/crew.json';
import tasksRaw from '../../data/dominion/tasks.json';
import gruntTypesRaw from '../../data/dominion/gruntTypes.json';
import { CrewFileSchema, GruntTypesFileSchema, StartFileSchema, TasksFileSchema, type CrewFile, type GruntType, type StartFile, type Task } from './schema';

export const DOMINION_DATA: { start: StartFile; crew: CrewFile; tasks: Task[]; gruntTypes: GruntType[] } = {
  start: StartFileSchema.parse(startRaw),
  crew: CrewFileSchema.parse(crewRaw),
  tasks: TasksFileSchema.parse(tasksRaw).tasks,
  gruntTypes: GruntTypesFileSchema.parse(gruntTypesRaw).types,
};

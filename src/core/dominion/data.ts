// DOMINION data, validated once at load. A file that fails throws and names the field.

import startRaw from '../../data/dominion/start.json';
import actionsRaw from '../../data/dominion/actions.json';
import crewRaw from '../../data/dominion/crew.json';
import deskRaw from '../../data/dominion/desk.json';
import fieldRaw from '../../data/dominion/field.json';
import gruntTypesRaw from '../../data/dominion/gruntTypes.json';
import personalityRaw from '../../data/dominion/personality.json';
import tasksRaw from '../../data/dominion/tasks.json';
import empireRaw from '../../data/dominion/empire.json';
import foundingRaw from '../../data/dominion/founding.json';
import armbandsRaw from '../../data/dominion/armbands.json';
import heroRaw from '../../data/dominion/hero.json';
import hqRaw from '../../data/dominion/hq.json';
import buildingsRaw from '../../data/dominion/buildings.json';
import pyramidRaw from '../../data/dominion/pyramid.json';
import rivalsRaw from '../../data/dominion/rivals.json';
import rivalActionsRaw from '../../data/dominion/rivalActions.json';
import outsideRaw from '../../data/dominion/outside.json';
import townRaw from '../../data/dominion/town.json';
import {
  ActionsFileSchema, ArmbandsFileSchema, BuildingsFileSchema, FoundingFileSchema, EmpireFileSchema, OutsideFileSchema, RivalActionsFileSchema, RivalsFileSchema, CrewFileSchema, DeskFileSchema, HqFileSchema, PyramidFileSchema, FieldFileSchema, GruntTypesFileSchema, HeroFileSchema, PersonalityFileSchema, StartFileSchema, TasksFileSchema, TownFileSchema,
  type ActionsFile, type ArmbandLook, type Building, type FoundingFile, type EmpireFile, type OutsideRow, type RivalActionsFile, type RivalsFile, type CrewFile, type DeskFile, type HqFile, type PyramidFile, type FieldFile, type GruntType, type HeroFile, type PersonalityFile, type StartFile, type Task, type TownFile,
} from './schema';

export const DOMINION_DATA: { start: StartFile; actions: ActionsFile; field: FieldFile; crew: CrewFile; tasks: Task[]; gruntTypes: GruntType[]; empire: EmpireFile; hq: HqFile; buildings: Building[]; pyramid: PyramidFile; rivals: RivalsFile; rivalActions: RivalActionsFile; outside: OutsideRow[]; personality: PersonalityFile; hero: HeroFile; desk: DeskFile ; founding: FoundingFile; armbands: Record<string, ArmbandLook>; town: TownFile } = {
  start: StartFileSchema.parse(startRaw),
  actions: ActionsFileSchema.parse(actionsRaw),
  field: FieldFileSchema.parse(fieldRaw),
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
  town: TownFileSchema.parse(townRaw),
  founding: FoundingFileSchema.parse(foundingRaw),
  armbands: ArmbandsFileSchema.parse(armbandsRaw).looks,
  desk: DeskFileSchema.parse(deskRaw),
};

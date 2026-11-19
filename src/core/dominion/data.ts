// DOMINION data, validated once at load. A file that fails throws and names the field.

import startRaw from '../../data/dominion/start.json';
import actionsRaw from '../../data/dominion/actions.json';
import fieldRaw from '../../data/dominion/field.json';
import { ActionsFileSchema, FieldFileSchema, StartFileSchema, type ActionsFile, type FieldFile, type StartFile } from './schema';

export const DOMINION_DATA: { start: StartFile; actions: ActionsFile; field: FieldFile } = {
  start: StartFileSchema.parse(startRaw),
  actions: ActionsFileSchema.parse(actionsRaw),
  field: FieldFileSchema.parse(fieldRaw),
};

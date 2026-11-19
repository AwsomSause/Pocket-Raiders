// DOMINION data, validated once at load. A file that fails throws and names the field.

import startRaw from '../../data/dominion/start.json';
import { StartFileSchema, type StartFile } from './schema';

export const DOMINION_DATA: { start: StartFile } = {
  start: StartFileSchema.parse(startRaw),
};

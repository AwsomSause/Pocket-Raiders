// Beta 0.6 INSTRUMENTALITY data (slice F4/E0): the generated files in this folder, parsed once with their Zod schemas.
// Built by `npm run data:expansion` from tools/sources/expansion/. Never edit the JSON by hand.

import { ExpansionFileSchemas } from '../../core/expansion/data';
import type { ExpansionData } from '../../core/expansion/data';
import apex from './apex.json';
import characters from './characters.json';
import climaxExtended from './climax_extended.json';
import events from './events.json';
import raids from './raids.json';
import siegeMaps from './siege_maps.json';
import signatureMoves from './signatureMoves.json';
import specialPokemon from './specialPokemon.json';
import specialShadows from './specialShadows.json';
import tracks from './tracks.json';
import variantLines from './variantLines.json';

export const expansionData: ExpansionData = {
  characters: ExpansionFileSchemas.characters.parse(characters),
  specialPokemon: ExpansionFileSchemas.specialPokemon.parse(specialPokemon),
  specialShadows: ExpansionFileSchemas.specialShadows.parse(specialShadows),
  variantLines: ExpansionFileSchemas.variantLines.parse(variantLines),
  signatureMoves: ExpansionFileSchemas.signatureMoves.parse(signatureMoves),
  events: ExpansionFileSchemas.events.parse(events),
  raids: ExpansionFileSchemas.raids.parse(raids),
  tracks: ExpansionFileSchemas.tracks.parse(tracks),
  siege_maps: ExpansionFileSchemas.siege_maps.parse(siegeMaps),
  climax_extended: ExpansionFileSchemas.climax_extended.parse(climaxExtended),
  apex: ExpansionFileSchemas.apex.parse(apex),
};

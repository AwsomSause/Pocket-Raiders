// Evil Mode data, validated once at load (design Part 30 section 2.2). A file that fails throws and names the field.

import creedsRaw from '../../data/evilMode/creeds.json';
import doctrinesRaw from '../../data/evilMode/doctrines.json';
import methodsRaw from '../../data/evilMode/methods.json';
import foundingRaw from '../../data/evilMode/founding.json';
import districtRaw from '../../data/evilMode/district.json';
import ledgerRaw from '../../data/evilMode/ledger.json';
import peopleRaw from '../../data/evilMode/people.json';
import facesRaw from '../../data/evilMode/faces.json';
import heroRaw from '../../data/evilMode/hero.json';
import nightRaw from '../../data/evilMode/night.json';
import lineRaw from '../../data/evilMode/line.json';
import gymRaw from '../../data/evilMode/gym.json';
import regionRaw from '../../data/evilMode/region.json';
import economyRaw from '../../data/evilMode/economy.json';
import neighbourRaw from '../../data/evilMode/neighbour.json';
import schemeRaw from '../../data/evilMode/scheme.json';
import { CreedsFileSchema, DistrictFileSchema, DoctrinesFileSchema, FacesFileSchema, GymFileSchema, FoundingFileSchema, HeroFileSchema, LedgerFileSchema, LineFileSchema, MethodsFileSchema, NeighbourFileSchema, NightFileSchema, PeopleFileSchema, RegionFileSchema, EconomyFileSchema, SchemeFileSchema, BaseFileSchema } from './schema';
import baseRaw from '../../data/evilMode/base.json';
import firesRaw from '../../data/evilMode/fires.json';
import roadRaw from '../../data/evilMode/road.json';
import lastRoomRaw from '../../data/evilMode/lastRoom.json';
import endingsRaw from '../../data/evilMode/endings.json';
import { FiresFileSchema, RoadFileSchema, LastRoomFileSchema, EndingsFileSchema } from './schema';

/** Parses `raw` (throws when it's wrong) and hands it back with the JSON's own types. */
const checked = <T>(schema: { parse: (x: unknown) => unknown }, raw: T): T => {
  schema.parse(raw);
  return raw;
};

export const EVIL_DATA = {
  creeds: CreedsFileSchema.parse(creedsRaw).creeds,
  doctrines: DoctrinesFileSchema.parse(doctrinesRaw).doctrines,
  methods: MethodsFileSchema.parse(methodsRaw).methods,
  founding: FoundingFileSchema.parse(foundingRaw),
  district: DistrictFileSchema.parse(districtRaw),
  ledger: LedgerFileSchema.parse(ledgerRaw),
  people: PeopleFileSchema.parse(peopleRaw),
  faces: FacesFileSchema.parse(facesRaw).faces,
  hero: HeroFileSchema.parse(heroRaw),
  night: NightFileSchema.parse(nightRaw),
  line: LineFileSchema.parse(lineRaw),
  gym: GymFileSchema.parse(gymRaw),
  region: RegionFileSchema.parse(regionRaw),
  economy: EconomyFileSchema.parse(economyRaw),
  neighbour: NeighbourFileSchema.parse(neighbourRaw),
  scheme: SchemeFileSchema.parse(schemeRaw),
  base: BaseFileSchema.parse(baseRaw),
  fires: FiresFileSchema.parse(firesRaw),
  road: RoadFileSchema.parse(roadRaw),
  lastRoom: LastRoomFileSchema.parse(lastRoomRaw),
  /** Slice 15: checked by its schema; read with the JSON's own types (its lines are many and plain). */
  endings: checked(EndingsFileSchema, endingsRaw),
};
export type EvilData = typeof EVIL_DATA;
export type Creed = EvilData['creeds'][number];
export type Doctrine = EvilData['doctrines'][number];
export type Method = EvilData['methods'][number];

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
import lineRaw from '../../data/evilMode/line.json';
import gymRaw from '../../data/evilMode/gym.json';
import regionRaw from '../../data/evilMode/region.json';
import neighbourRaw from '../../data/evilMode/neighbour.json';
import economyRaw from '../../data/evilMode/economy.json';
import baseRaw from '../../data/evilMode/base.json';
import { CreedsFileSchema, DistrictFileSchema, DoctrinesFileSchema, FacesFileSchema, GymFileSchema, FoundingFileSchema, HeroFileSchema, LedgerFileSchema, BaseFileSchema, EconomyFileSchema, LineFileSchema, MethodsFileSchema, NeighbourFileSchema, PeopleFileSchema, RegionFileSchema } from './schema';

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
  line: LineFileSchema.parse(lineRaw),
  gym: GymFileSchema.parse(gymRaw),
  region: RegionFileSchema.parse(regionRaw),
  neighbour: NeighbourFileSchema.parse(neighbourRaw),
  economy: EconomyFileSchema.parse(economyRaw),
  base: BaseFileSchema.parse(baseRaw),
};
export type EvilData = typeof EVIL_DATA;
export type Creed = EvilData['creeds'][number];
export type Doctrine = EvilData['doctrines'][number];
export type Method = EvilData['methods'][number];

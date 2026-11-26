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
import courtRaw from '../../data/dominion/court.json';
import courtRulesRaw from '../../data/dominion/courtRules.json';
import foundingRaw from '../../data/dominion/founding.json';
import armbandsRaw from '../../data/dominion/armbands.json';
import heroRaw from '../../data/dominion/hero.json';
import hqRaw from '../../data/dominion/hq.json';
import buildingsRaw from '../../data/dominion/buildings.json';
import pyramidRaw from '../../data/dominion/pyramid.json';
import squadsRaw from '../../data/dominion/squads.json';
import rivalsRaw from '../../data/dominion/rivals.json';
import spiesRaw from '../../data/dominion/spies.json';
import rivalActionsRaw from '../../data/dominion/rivalActions.json';
import outsideRaw from '../../data/dominion/outside.json';
import townRaw from '../../data/dominion/town.json';
import lifeRaw from '../../data/dominion/life.json';
import debateRaw from '../../data/dominion/debate.json';
import policeRaw from '../../data/dominion/police.json';
import growthRaw from '../../data/dominion/growth.json';
import growthActionsRaw from '../../data/dominion/growthActions.json';
import snatchRaw from '../../data/dominion/snatch.json';
import takeoverRaw from '../../data/dominion/takeover.json';
import regionsRaw from '../../data/dominion/regions.json';
import partnersRaw from '../../data/dominion/partners.json';
import chartersRaw from '../../data/dominion/charters.json';
import johtoRaw from '../../data/dominion/regions/johto.json';
import hoennRaw from '../../data/dominion/regions/hoenn.json';
import sinnohRaw from '../../data/dominion/regions/sinnoh.json';
import unovaRaw from '../../data/dominion/regions/unova.json';
import kalosRaw from '../../data/dominion/regions/kalos.json';
import alolaRaw from '../../data/dominion/regions/alola.json';
import galarRaw from '../../data/dominion/regions/galar.json';
import paldeaRaw from '../../data/dominion/regions/paldea.json';
import {
  PartnersFileSchema, DomChartersFileSchema, type PartnersFile, type DomChartersFile,
  RegionsFileSchema, RegionPackSchema, type RegionsFile, type RegionPack,
  GrowthActionsSchema, GrowthFileSchema, SnatchFileSchema, TakeoverFileSchema, type TakeoverFile, type FieldFile as FieldFileT, type GrowthActions, type GrowthFile, type SnatchFile,
  ActionsFileSchema, ArmbandsFileSchema, BuildingsFileSchema, CourtFileSchema, CourtRulesSchema, DebateFileSchema, FoundingFileSchema, EmpireFileSchema, PoliceFileSchema, OutsideFileSchema, RivalActionsFileSchema, RivalsFileSchema, CrewFileSchema, DeskFileSchema, HqFileSchema, PyramidFileSchema, SquadsFileSchema, FieldFileSchema, GruntTypesFileSchema, HeroFileSchema, PersonalityFileSchema, SpiesFileSchema, StartFileSchema, TasksFileSchema, TownFileSchema, LifeFileSchema,
  type ActionsFile, type ArmbandLook, type Building, type CourtCard, type CourtRules, type DebateFile, type FoundingFile, type EmpireFile, type PoliceFile, type OutsideRow, type RivalActionsFile, type RivalsFile, type CrewFile, type DeskFile, type HqFile, type PyramidFile, type SquadsFile, type FieldFile, type GruntType, type HeroFile, type PersonalityFile, type SpiesFile, type StartFile, type Task, type TownFile, type LifeFile,
} from './schema';

const growth = GrowthFileSchema.parse(growthRaw);
const takeover = TakeoverFileSchema.parse(takeoverRaw);
/** D14: the 30 League and Plan actions the list left waiting for D14 are played now; their honest statuses replace the waiting ones. */
const growthActionsRawParsed = GrowthActionsSchema.parse(growthActionsRaw);
/** D16: the fifteen Snagem and Cipher actions (section AC) the list left waiting for D16 are played by partners.json. */
const partners: PartnersFile = PartnersFileSchema.parse(partnersRaw);
const charters: DomChartersFile = DomChartersFileSchema.parse(chartersRaw);
const growthActions: GrowthActions = {
  ...growthActionsRawParsed,
  later: Object.fromEntries(Object.entries(growthActionsRawParsed.later).filter(([id]) => !takeover.play[id] && !partners.play[id])),
  status: {
    ...growthActionsRawParsed.status,
    ...Object.fromEntries(Object.entries(takeover.status).filter(([id]) => id in growthActionsRawParsed.status)),
    ...Object.fromEntries(Object.entries(partners.status).filter(([id]) => id in growthActionsRawParsed.status)),
  },
};
const snatch = SnatchFileSchema.parse(snatchRaw);
/** D10: Growth's plays (its own rows 1-150 and the list's rows 151-600) and crates join the field data; the rows that wait name their slice.
 * D23: Interrogate (the Snatch Operation) and Hostage Trade join too. */
function withGrowth(f: FieldFileT): FieldFileT {
  return {
    ...f,
    play: { ...f.play, ...growthActions.play, ...growth.play, ...snatch.play, ...takeover.play, ...partners.play },
    crates: { ...f.crates, ...growth.crates },
    later: { ...f.later, byAction: { ...f.later.byAction, ...growthActions.later, ...growth.later } },
  };
}

type Data = { snatch: SnatchFile; takeover: TakeoverFile; growth: GrowthFile; growthActions: GrowthActions; start: StartFile; actions: ActionsFile; field: FieldFile; crew: CrewFile; tasks: Task[]; gruntTypes: GruntType[]; empire: EmpireFile; hq: HqFile; buildings: Building[]; pyramid: PyramidFile; rivals: RivalsFile; rivalActions: RivalActionsFile; outside: OutsideRow[]; personality: PersonalityFile; court: CourtCard[]; courtRules: CourtRules; hero: HeroFile; desk: DeskFile; squads: SquadsFile; founding: FoundingFile; armbands: Record<string, ArmbandLook>; police: PoliceFile; debate: DebateFile; spies: SpiesFile; town: TownFile; life: LifeFile };
const KANTO: Data = {
  start: StartFileSchema.parse(startRaw),
  actions: ActionsFileSchema.parse(actionsRaw),
  field: withGrowth(FieldFileSchema.parse(fieldRaw)),
  growth,
  growthActions,
  snatch,
  takeover,
  crew: CrewFileSchema.parse(crewRaw),
  tasks: TasksFileSchema.parse(tasksRaw).tasks,
  gruntTypes: GruntTypesFileSchema.parse(gruntTypesRaw).types,
  empire: EmpireFileSchema.parse(empireRaw),
  court: CourtFileSchema.parse(courtRaw).cards,
  courtRules: CourtRulesSchema.parse(courtRulesRaw),
  pyramid: PyramidFileSchema.parse(pyramidRaw),
  hero: HeroFileSchema.parse(heroRaw),
  hq: HqFileSchema.parse(hqRaw),
  buildings: BuildingsFileSchema.parse(buildingsRaw).buildings,
  rivals: RivalsFileSchema.parse(rivalsRaw),
  rivalActions: RivalActionsFileSchema.parse(rivalActionsRaw),
  outside: OutsideFileSchema.parse(outsideRaw).rows,
  debate: DebateFileSchema.parse(debateRaw),
  personality: PersonalityFileSchema.parse(personalityRaw),
  town: TownFileSchema.parse(townRaw),
  life: LifeFileSchema.parse(lifeRaw),
  police: PoliceFileSchema.parse(policeRaw),
  founding: FoundingFileSchema.parse(foundingRaw),
  armbands: ArmbandsFileSchema.parse(armbandsRaw).looks,
  desk: DeskFileSchema.parse(deskRaw),
  squads: SquadsFileSchema.parse(squadsRaw),
  spies: SpiesFileSchema.parse(spiesRaw),
};

// ---------- D15: many regions ----------
// Kanto's data is the D2-D14 files. Another region overlays its own places and people (regions/<id>.json) on them:
// towns, routes, the rival team's sites, Gyms, businesses, the Hero's path and allies, the League, Holdings, the desk.
// Every module reads DOMINION_DATA lazily, so the overlay follows the region being played (`useRegion`).

const regions: RegionsFile = RegionsFileSchema.parse(regionsRaw);
const packs: Record<string, RegionPack> = Object.fromEntries(
  [johtoRaw, hoennRaw, sinnohRaw, unovaRaw, kalosRaw, alolaRaw, galarRaw, paldeaRaw].map((raw) => {
    const p = RegionPackSchema.parse(raw);
    return [p.id, p];
  }),
);

function overlay(id: string): Data {
  const p = packs[id];
  if (!p) return KANTO;
  const K = KANTO;
  const teams = K.rivals.teams.map((t) => (t.region === id ? { ...t, on: true, sites: p.rivals[t.id] ?? t.sites } : t));
  const here = K.hero.regions[id]!;
  const held = (h: TakeoverFile['holdings'][number]): TakeoverFile['holdings'][number] => {
    const at = h.region === id ? p.holdings[h.id] : undefined;
    if (!at) return h;
    const { needs: _n, ...rest } = h;
    return { ...rest, district: at.district, fx: at.fx, status: 'limited', ...(at.via ? { via: at.via } : {}), ...(at.note ? { note: at.note } : {}) };
  };
  const setFx = (s: TakeoverFile['sets'][number]): TakeoverFile['sets'][number] =>
    s.region === id && s.status === 'disabled'
      ? { ...s, status: 'limited', fx: [{ k: 'regard', n: 1, where: 'region' }], note: `Read as Regard +1 in every town each week; the rest of "${s.text}" waits for a battle hook.` }
      : s;
  return {
    ...K,
    start: { ...K.start, start: { ...K.start.start, region: p.label } },
    field: { ...K.field, region: id, hq: p.hq, rivalTeam: teams.find((t) => t.region === id)?.tag ?? K.field.rivalTeam, districts: p.districts, routes: p.routes, water: p.water },
    growth: { ...K.growth, gyms: p.gyms, business: p.business, lab: { rare: p.lab } },
    rivals: { ...K.rivals, region: id, teams },
    hero: {
      ...K.hero,
      regions: {
        ...K.hero.regions,
        [id]: {
          ...here, path: p.hero.path, allies: p.hero.allies, mentor: p.hero.mentor, parent: p.hero.parent, sidekick: p.hero.sidekick,
          legends: here.legends.map((l) => ({ ...l, ...(p.hero.homes[l.id] ?? {}) })),
        },
      },
    },
    takeover: {
      ...K.takeover,
      need: { ...K.takeover.need, pillars: p.pillars },
      league: { ...K.takeover.league, ...p.league },
      holdings: K.takeover.holdings.map(held),
      sets: K.takeover.sets.map(setFx),
    },
    crew: { ...K.crew, pools: { ...K.crew.pools, [id]: p.pools } },
    desk: { ...K.desk, regions: { ...K.desk.regions, [id]: p.desk } },
  };
}

let active = 'kanto';
const views: Record<string, Data> = { kanto: KANTO };
const view = (): Data => (views[active] ??= overlay(active));

/** The region played now ('kanto' until the Boss leaves it). */
export const activeRegion = (): string => active;
/** Switches the data to a region's overlay. Unknown ids fall back to Kanto. */
export function setActiveRegion(id: string): void {
  active = id === 'kanto' || packs[id] ? id : 'kanto';
}
/** Switches the data to the region a block is playing (no `realm` = Kanto). Call at every entry point that reads a block. */
export function useRegion(b: { realm?: { at: string } | undefined } | null | undefined): void {
  setActiveRegion(b?.realm?.at ?? 'kanto');
}

const REGIONAL = ['start', 'field', 'growth', 'rivals', 'hero', 'takeover', 'crew', 'desk'] as const;
export const DOMINION_DATA: Data & { regions: RegionsFile; packs: Record<string, RegionPack>; partners: PartnersFile; charters: DomChartersFile } = { ...KANTO, regions, packs, partners, charters };
for (const k of REGIONAL) Object.defineProperty(DOMINION_DATA, k, { get: () => view()[k], enumerable: true });

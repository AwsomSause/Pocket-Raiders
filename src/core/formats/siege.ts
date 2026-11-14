// Wide format 4: the Siege Map (plan E4; Extended Cut Phase 0b). Before the climax the city's districts are each Held,
// Contested or Lost, by what the run has earned. The player picks a gate: a Held gate is a free entry; a Contested or Lost
// gate costs one battle (a lost fight heals the party and the player may try again or pick another gate). Every Lost district's
// effect applies (announced on the map) and is written to `run.expansion.siege.lost` for the later phases to read: the Breather
// reads it (West Gate, Cliff Stair). Statuses are worked out once at setup and kept in the state, so a reload shows the same map.
// Kanto, Sinnoh and Hoenn have maps (the other regions' rules come with their saga slices). No RNG here.
// The screen is the picked "Rocket Ledger" (Siege Map 7): src/scenes/SiegeScene.ts.

import { expansionData } from '../../data/expansion';
import { raidRecord } from '../raid/storyRaids';
import type { RunState } from '../state';
import { launchFormatBattle } from './battle';
import { climaxRegion, markCheckpoint, markDone } from './store';
import type { TypeName } from '../contentSchema';
import type { FormatCard, FormatCtx, WideFormat } from './types';


export type DistrictStatus = 'held' | 'contested' | 'lost';

export interface District {
  id: string;
  name: string;
  place: string | null;
  status: DistrictStatus;
  /** Who holds it, for the sticky notes ('' = nobody). */
  heldBy: string;
  ifLost: string;
  /** A gate the player can enter by (the Center is not one). */
  gate: boolean;
}

export interface SiegeState {
  region: string;
  districts: District[];
  /** The gate the player went in by. */
  entered: string | null;
  pending: string | null;
  /** Gate fights lost so far. */
  tries: number;
}

const slug = (name: string): string => name.toLowerCase().replace(/^the /, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/** A Rocket flag counts when a format wrote it (`rocket.x.wire`) or a Kanto run event did (`ev:rocket-wire`). */
const flag = (run: RunState, key: string): boolean => Boolean(run.story.flags[key] ?? run.story.flags[`ev:${key.replace('rocket.x.', 'rocket-')}`]);
const good = (r?: string): boolean => r === 'triumph' || r === 'success';
const bad = (r?: string): boolean => r === 'failure' || r === 'declined';

/** Held when what the run earned holds it; Lost when the raid for it was failed or declined (or the rival beat you to it); otherwise Contested. */
export function kantoStatuses(run: RunState): Record<string, { status: DistrictStatus; heldBy: string }> {
  const r = (n: number) => raidRecord(run, n)?.result;
  const role = run.expansion?.cut?.rivalRole;
  return {
    'north-gate': role === 'help' ? { status: 'held', heldBy: 'Your rival' } : { status: role === 'beat' ? 'lost' : 'contested', heldBy: '' },
    'east-gate':
      r(3) === 'triumph' || flag(run, 'rocket.x.wire')
        ? { status: 'held', heldBy: flag(run, 'rocket.x.wire') ? 'Officer Jenny' : 'The ghosts of the Tower' }
        : { status: bad(r(3)) ? 'lost' : 'contested', heldBy: '' },
    'south-gate':
      good(r(4)) || flag(run, 'rocket.x.surge-down')
        ? { status: 'held', heldBy: 'The Celadon resistance' }
        : { status: bad(r(4)) ? 'lost' : 'contested', heldBy: '' },
    'west-gate': good(r(5)) ? { status: 'held', heldBy: 'The Fuchsia wardens' } : { status: bad(r(5)) ? 'lost' : 'contested', heldBy: '' },
    center: { status: 'contested', heldBy: 'Oracle Sabrina' },
  };
}

type Statuses = Record<string, { status: DistrictStatus; heldBy: string }>;
const evNum = (run: RunState, key: string): number => Number(run.story.flags[`ev:${key}`] ?? 0);
const st = (status: DistrictStatus, heldBy = ''): { status: DistrictStatus; heldBy: string } => ({ status, heldBy });

/** Sinnoh's four approaches: held by what the run earned (Raid 1, Looker, Cynthia, Raid 4); the Summit is Cyrus's. */
export function sinnohStatuses(run: RunState): Statuses {
  const r = (n: number) => raidRecord(run, n)?.result;
  return {
    'oreburgh-gate': good(r(1)) ? st('held', 'The Oreburgh miners') : st(bad(r(1)) ? 'lost' : 'contested'),
    'hearthome-road': evFlag(run, 'galactic-looker-ally') && r(5) !== 'failure' ? st('held', 'Looker') : st(r(5) === 'failure' ? 'lost' : 'contested'),
    'celestic-path': evFlag(run, 'galactic-cynthia-ally') ? st('held', 'Cynthia') : st('contested'),
    'snowpoint-trail': good(r(4)) ? st('held', 'Buck') : st(bad(r(4)) ? 'lost' : 'contested'),
    summit: st('contested', 'Cyrus'),
  };
}

/** Hoenn's Sootopolis: the ledges follow the tilt (which team is behind), the tunnel and the White Rock what the run earned. */
export function hoennStatuses(run: RunState): Statuses {
  const r = (n: number) => raidRecord(run, n)?.result;
  const aqua = evNum(run, 'aqua-ahead');
  const magma = evNum(run, 'magma-ahead');
  return {
    'harbor-tunnel': good(r(2)) || evFlag(run, 'hoenn-stern-or-cozmo-turned') ? st('held', 'The turned officer') : st(bad(r(2)) ? 'lost' : 'contested'),
    'west-ledge': magma > aqua ? st('held', 'Aqua, falling behind') : st('contested'),
    'east-ledge': aqua > magma ? st('held', 'Magma, falling behind') : st('contested'),
    'white-rock': evFlag(run, 'hoenn-steven-lamp') || evFlag(run, 'hoenn-keepers-promise') ? st('held', 'Steven and the Keepers') : st('contested'),
    'cave-mouth': st('contested', 'Both teams'),
  };
}

/** An event story flag (`ev:<key>`) the run holds. */
const evFlag = (run: RunState, key: string): boolean => Number(run.story.flags[`ev:${key}`] ?? 0) >= 1;
const heldBy = (held: boolean, by: string, lostIf: boolean): { status: DistrictStatus; heldBy: string } => (held ? { status: 'held', heldBy: by } : { status: lostIf ? 'lost' : 'contested', heldBy: '' });

/** Alola's four islands (Beta 0.7 E9): the story events' flags and Raid 4 decide. Aether Paradise is never held and has no gate. */
export function alolaStatuses(run: RunState): Statuses {
  const r4 = raidRecord(run, 4)?.result;
  return {
    melemele: heldBy(evFlag(run, 'alola-bars') || evFlag(run, 'alola-bus-waited'), 'The bus stop', false),
    akala: heldBy(good(r4), 'Olivia and Tapu Lele', bad(r4)),
    'ula-ula': heldBy(evFlag(run, 'alola-nanu-ally'), 'Kahuna Nanu', false),
    poni: heldBy(evFlag(run, 'alola-lightthief-lead') || evFlag(run, 'alola-ball-shown') || evFlag(run, 'alola-beans-joined'), 'Dulse and Zossie', false),
    'aether-paradise': { status: 'contested', heldBy: 'Lusamine' },
  };
}

/** Paldea's five Bases: each Base's raid, or the story event that won its squad over. */
export function paldeaStatuses(run: RunState): Statuses {
  const r = (n: number) => raidRecord(run, n)?.result;
  return {
    segin: heldBy(good(r(1)), 'Giacomo\'s squad', bad(r(1))),
    schedar: heldBy(good(r(2)) || evFlag(run, 'star-mela-ally'), 'Mela\'s squad', bad(r(2))),
    navi: heldBy(good(r(3)), 'Atticus\'s squad', bad(r(3))),
    ruchbah: heldBy(good(r(4)) || evFlag(run, 'star-zeb-ally'), 'Ortega\'s squad', bad(r(4))),
    caph: heldBy(evFlag(run, 'star-kieran-star') || evFlag(run, 'star-arven-cook'), 'Eri\'s squad', false),
  };
}

/** Per region: the map id, the statuses, which districts are not gates, the screen title, and the cordon that guards a gate. */
const SIEGE_REGIONS: Record<string, { statuses: (run: RunState) => Statuses; noGate: readonly string[]; title: string; cordon: string; classId: string; types: TypeName[] }> = {
  kanto: { statuses: kantoStatuses, noGate: ['center'], title: 'THE LONG LEDGER · SAFFRON', cordon: 'Rocket Cordon', classId: 'roughneck', types: ['poison', 'normal'] },
  alola: { statuses: alolaStatuses, noGate: ['aether-paradise'], title: 'FOUR ISLANDS · ALOLA', cordon: 'Skull Blockade', classId: 'roughneck', types: ['dark', 'poison'] },
  sinnoh: { statuses: sinnohStatuses, noGate: ['summit'], title: 'THE MOUNTAIN UNDER SIEGE · CORONET', cordon: 'Galactic Cordon', classId: 'roughneck', types: ['poison', 'dark'] },
  hoenn: { statuses: hoennStatuses, noGate: ['cave-mouth'], title: 'SOOTOPOLIS DIVIDED · THE CRATER', cordon: 'Crater Cordon', classId: 'roughneck', types: ['water', 'fire'] },
  paldea: { statuses: paldeaStatuses, noGate: [], title: 'THE FIVE BASES · PALDEA', cordon: 'Star Picket', classId: 'roughneck', types: ['dark', 'fighting'] },
};
export const SIEGE_REGION_IDS = Object.keys(SIEGE_REGIONS);
/** Alola and Paldea districts show their effects but the Phase rules that read them are not built; the text says so. */
const EFFECT_NOT_WIRED = ' (not applied in this region yet)';

/** Districts that count as Lost (their effect applies). The Center is never Lost: Sabrina holds it by design. */
export const lostIds = (s: SiegeState): string[] => s.districts.filter((d) => d.status === 'lost').map((d) => `${s.region}.${d.id}`);

function setup({ run }: FormatCtx, input?: unknown): SiegeState {
  const region = input && typeof input === 'object' && 'region' in input && typeof (input as { region: unknown }).region === 'string' ? (input as { region: string }).region : climaxRegion(run);
  const rule = SIEGE_REGIONS[region] ?? SIEGE_REGIONS.kanto!;
  const map = expansionData.siege_maps.find((m) => m.id === `siege.${SIEGE_REGIONS[region] ? region : 'kanto'}`)!;
  const st = rule.statuses(run);
  const districts: District[] = map.districts.map((d) => {
    const id = slug(d.name);
    const s = st[id] ?? { status: 'contested' as const, heldBy: '' };
    return { id, name: d.name, place: d.location, status: s.status, heldBy: s.heldBy, ifLost: region === 'kanto' ? d.ifLost : d.ifLost + EFFECT_NOT_WIRED, gate: !rule.noGate.includes(id) };
  });
  return { region: SIEGE_REGIONS[region] ? region : 'kanto', districts, entered: null, pending: null, tries: 0 };
}

export interface SiegeRow {
  id: string;
  name: string;
  place: string | null;
  status: DistrictStatus;
  heldBy: string;
  ifHeld: string;
  ifLost: string;
  gate: boolean;
}
export interface SiegeView {
  title: string;
  subtitle: string;
  rows: SiegeRow[];
  /** "Lost effects n / m". */
  lostCount: number;
  gateCount: number;
  entered: string | null;
  tries: number;
}

/** What the Rocket Ledger screen shows. Nothing is hidden: the effects of a Lost district are all on the page. */
export function siegeView(s: SiegeState): SiegeView {
  const rule = SIEGE_REGIONS[s.region] ?? SIEGE_REGIONS.kanto!;
  return {
    title: rule.title,
    subtitle: 'Who holds what. Nothing here is hidden.',
    rows: s.districts.map((d) => ({ id: d.id, name: d.name, place: d.place, status: d.status, heldBy: d.heldBy, ifHeld: d.gate ? 'Free entry' : 'Never held', ifLost: d.ifLost, gate: d.gate })),
    lostCount: s.districts.filter((d) => d.status === 'lost').length,
    gateCount: s.districts.filter((d) => d.gate).length,
    entered: s.entered,
    tries: s.tries,
  };
}

const gateCost = (d: District): string => (d.status === 'held' ? 'free entry' : 'one battle');

function describe(s: SiegeState): FormatCard {
  const v = siegeView(s);
  const lines = [v.title, ...v.rows.map((r) => `${r.name}: ${r.status.toUpperCase()}${r.heldBy ? ` (${r.heldBy})` : ''}. If lost: ${r.ifLost}`)];
  if (s.entered) return { title: 'The Sealed City', lines: [...lines, `You went in by the ${s.districts.find((d) => d.id === s.entered)!.name}.`], options: [], over: true };
  return {
    title: 'The Sealed City',
    lines,
    options: s.districts.filter((d) => d.gate).map((d) => ({ id: d.id, label: `Enter by the ${d.name} (${gateCost(d)})`, enabled: true })),
    over: false,
  };
}

function enter(s: SiegeState, id: string, run: RunState): SiegeState {
  const next = { ...s, entered: id, pending: null };
  const siege = { ...(run.expansion?.siege ?? {}) } as Record<string, unknown>;
  siege.lost = lostIds(s);
  siege.contested = s.districts.filter((d) => d.status === 'contested' && d.gate).map((d) => `${s.region}.${d.id}`);
  siege.entered = `${s.region}.${id}`;
  run.expansion = { ...(run.expansion ?? {}), siege };
  markCheckpoint(run, 'siege');
  markDone(run, 'siege');
  return next;
}

function choose(s: SiegeState, id: string, ctx: FormatCtx): SiegeState {
  const d = s.districts.find((x) => x.id === id && x.gate);
  if (s.entered || s.pending || !d) return s;
  if (d.status === 'held') return enter(s, id, ctx.run);
  const ok = launchFormatBattle(ctx.content, ctx.run, 'siege', {
    key: d.id,
    name: `${(SIEGE_REGIONS[s.region] ?? SIEGE_REGIONS.kanto!).cordon} (${d.name})`,
    classId: (SIEGE_REGIONS[s.region] ?? SIEGE_REGIONS.kanto!).classId,
    types: (SIEGE_REGIONS[s.region] ?? SIEGE_REGIONS.kanto!).types,
    size: 3,
    levelBonus: d.status === 'lost' ? 1 : 0,
  });
  return ok ? { ...s, pending: id } : s;
}

function onBattleEnd(s: SiegeState, won: boolean, { run }: FormatCtx): SiegeState {
  if (!s.pending) return s;
  return won ? enter(s, s.pending, run) : { ...s, pending: null, tries: s.tries + 1 };
}

export const siege: WideFormat<SiegeState> = {
  id: 'siege',
  canStart: (ctx, input) => SIEGE_REGION_IDS.includes(!input || typeof input !== 'object' || !('region' in input) ? climaxRegion(ctx.run) : String((input as { region: unknown }).region)),
  setup,
  describe: (s) => describe(s),
  choose,
  onBattleEnd,
  isOver: (s) => s.entered !== null,
};

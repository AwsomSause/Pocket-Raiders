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
import type { FormatCard, FormatCtx, WideFormat } from './types';

export type SiegeRegion = 'kanto' | 'sinnoh' | 'hoenn';
export const SIEGE_REGIONS: readonly string[] = ['kanto', 'sinnoh', 'hoenn'];

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
  region: SiegeRegion;
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

const evFlag = (run: RunState, key: string): boolean => Number(run.story.flags[`ev:${key}`] ?? 0) >= 1;
const evNum = (run: RunState, key: string): number => Number(run.story.flags[`ev:${key}`] ?? 0);
const st = (status: DistrictStatus, heldBy = ''): { status: DistrictStatus; heldBy: string } => ({ status, heldBy });

/** Sinnoh's four approaches: held by what the run earned (Raid 1, Looker, Cynthia, Raid 4); the Summit is Cyrus's. */
export function sinnohStatuses(run: RunState): Record<string, { status: DistrictStatus; heldBy: string }> {
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
export function hoennStatuses(run: RunState): Record<string, { status: DistrictStatus; heldBy: string }> {
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

const NON_GATES = ['center', 'summit', 'cave-mouth'];
const SIEGE_TEXT: Record<SiegeRegion, { title: string; foe: string; types: string[] }> = {
  kanto: { title: 'THE LONG LEDGER · SAFFRON', foe: 'Rocket Cordon', types: ['poison', 'normal'] },
  sinnoh: { title: 'THE MOUNTAIN UNDER SIEGE · CORONET', foe: 'Galactic Cordon', types: ['poison', 'dark'] },
  hoenn: { title: 'SOOTOPOLIS DIVIDED · THE CRATER', foe: 'Crater Cordon', types: ['water', 'fire'] },
};
const siegeRegionOf = (run: RunState): SiegeRegion => {
  const r = climaxRegion(run);
  return r === 'sinnoh' || r === 'hoenn' ? r : 'kanto';
};

/** Districts that count as Lost (their effect applies). The Center is never Lost: Sabrina holds it by design. */
export const lostIds = (s: SiegeState): string[] => s.districts.filter((d) => d.status === 'lost').map((d) => `${s.region}.${d.id}`);

function setup({ run }: FormatCtx, input?: unknown): SiegeState {
  const asked = input && typeof input === 'object' && 'region' in input ? String((input as { region: unknown }).region) : '';
  const region: SiegeRegion = asked === 'sinnoh' || asked === 'hoenn' || asked === 'kanto' ? asked : siegeRegionOf(run);
  const map = expansionData.siege_maps.find((m) => m.id === `siege.${region}`)!;
  const found = region === 'sinnoh' ? sinnohStatuses(run) : region === 'hoenn' ? hoennStatuses(run) : kantoStatuses(run);
  const districts: District[] = map.districts.map((d) => {
    const id = slug(d.name);
    const s = found[id] ?? { status: 'contested' as const, heldBy: '' };
    return { id, name: d.name, place: d.location, status: s.status, heldBy: s.heldBy, ifLost: d.ifLost, gate: !NON_GATES.includes(id) };
  });
  return { region, districts, entered: null, pending: null, tries: 0 };
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
  const map = expansionData.siege_maps.find((m) => m.id === `siege.${s.region}`)!;
  return {
    title: SIEGE_TEXT[s.region].title,
    subtitle: 'Who holds what. Nothing here is hidden.',
    rows: s.districts.map((d) => ({ id: d.id, name: d.name, place: d.place, status: d.status, heldBy: d.heldBy, ifHeld: d.gate ? 'Free entry' : 'Never held', ifLost: d.ifLost, gate: d.gate })),
    lostCount: s.districts.filter((d) => d.status === 'lost').length,
    gateCount: map.districts.length - 1,
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
    name: `${SIEGE_TEXT[s.region].foe} (${d.name})`,
    classId: 'roughneck',
    types: SIEGE_TEXT[s.region].types as never,
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
  canStart: (ctx, input) => (!input || typeof input !== 'object' || !('region' in input) ? SIEGE_REGIONS.includes(climaxRegion(ctx.run)) : SIEGE_REGIONS.includes(String((input as { region: unknown }).region))),
  setup: (ctx, input) => setup(ctx, input),
  describe: (s) => describe(s),
  choose,
  onBattleEnd,
  isOver: (s) => s.entered !== null,
};

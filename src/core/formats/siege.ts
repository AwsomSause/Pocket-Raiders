// Wide format 4: the Siege Map (plan E4; Extended Cut Phase 0b). Before the climax the city's districts are each Held,
// Contested or Lost, by what the run has earned. The player picks a gate: a Held gate is a free entry; a Contested or Lost
// gate costs one battle (a lost fight heals the party and the player may try again or pick another gate). Every Lost district's
// effect applies (announced on the map) and is written to `run.expansion.siege.lost` for the later phases to read: the Breather
// reads it (West Gate, Cliff Stair). Statuses are worked out once at setup and kept in the state, so a reload shows the same map.
// Kanto only for now (the other regions' rules come with their saga slices). No RNG here.
// The screen is the picked "Rocket Ledger" (Siege Map 7): src/scenes/SiegeScene.ts.

import { expansionData } from '../../data/expansion';
import { raidRecord } from '../raid/storyRaids';
import type { RunState } from '../state';
import { launchFormatBattle } from './battle';
import { markCheckpoint, markDone } from './store';
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
  region: 'kanto';
  districts: District[];
  /** The gate the player went in by. */
  entered: string | null;
  pending: string | null;
  /** Gate fights lost so far. */
  tries: number;
}

const slug = (name: string): string => name.toLowerCase().replace(/^the /, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const flag = (run: RunState, key: string): boolean => Boolean(run.story.flags[key]);
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

/** Districts that count as Lost (their effect applies). The Center is never Lost: Sabrina holds it by design. */
export const lostIds = (s: SiegeState): string[] => s.districts.filter((d) => d.status === 'lost').map((d) => `${s.region}.${d.id}`);

function setup({ run }: FormatCtx): SiegeState {
  const map = expansionData.siege_maps.find((m) => m.id === 'siege.kanto')!;
  const st = kantoStatuses(run);
  const districts: District[] = map.districts.map((d) => {
    const id = slug(d.name);
    const s = st[id] ?? { status: 'contested' as const, heldBy: '' };
    return { id, name: d.name, place: d.location, status: s.status, heldBy: s.heldBy, ifLost: d.ifLost, gate: id !== 'center' };
  });
  return { region: 'kanto', districts, entered: null, pending: null, tries: 0 };
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
  const map = expansionData.siege_maps.find((m) => m.id === 'siege.kanto')!;
  return {
    title: 'THE LONG LEDGER · SAFFRON',
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
    name: `Rocket Cordon (${d.name})`,
    types: ['poison', 'normal'],
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
  canStart: (_ctx, input) => !input || typeof input !== 'object' || !('region' in input) || (input as { region: unknown }).region === 'kanto',
  setup,
  describe: (s) => describe(s),
  choose,
  onBattleEnd,
  isOver: (s) => s.entered !== null,
};

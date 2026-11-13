// Wide format 6: the Front (plan E4; the Rainbow Door, Phase 7 of the cross-region finale, and the Alola beasts). One lane per
// region whose Apex was lost, up to four; each lane holds one foe (the leader's Apex). Built on Triple Battles (decision I):
// three lanes are one triple battle, two are a double, one is a plain battle, and a fourth lane WAITS and steps into the first
// lane that is beaten (the engine's left-to-right refill). The lane rule (`eventRule.lanes`): each of your Pokémon fights the foe
// in its own lane; when its lane is empty it may help the others. Triple battles run only while the triple battle is switched on
// (`balance.triples.enabled` or the Triples Only rule); until the triple battle screen exists the fight falls back to a double
// battle with the third lane waiting. With no lane at all, Giovanni steps through alone and leaves: no battle.
// Result written once to `run.story.flags['finale.x.front']`: 'none', 'held' (every lane beaten), 'lost'. A lost fight is a
// story loss (the party is healed and the run goes on). No RNG here; the battle uses the `format-battle` stream.
// Only Kanto's lane (M2 taken) has content so far: the other regions' lanes come with their saga slices as rows of `LANE_TABLE`.

import { launchFormatBattle } from './battle';
import { markDone } from './store';
import type { FormatCard, FormatCtx, WideFormat } from './types';

export interface FrontLane {
  id: string;
  region: string;
  /** Who stands in the lane, as they would have been had they won. */
  leader: string;
  /** The Apex in the lane (a species id). */
  species: string;
  apex: string;
}

/** A region's lane exists when its Apex was lost: the flag holds that value. */
export const LANE_TABLE: { region: string; flag: string; lostValue: string; lane: Omit<FrontLane, 'region'> }[] = [
  { region: 'kanto', flag: 'rocket.x.m2', lostValue: 'taken', lane: { id: 'kanto', leader: 'Giovanni', species: 'mewtwo', apex: 'M2' } },
];

export type FrontResult = 'none' | 'held' | 'lost';

export interface FrontState {
  lanes: FrontLane[];
  pending: boolean;
  result: FrontResult | null;
}

export const MAX_LANES = 4;

function lanesFor({ content, run }: FormatCtx, input?: unknown): FrontLane[] {
  const given = typeof input === 'object' && input && 'lanes' in input ? (input as { lanes: FrontLane[] }).lanes : null;
  const lanes = given ?? LANE_TABLE.filter((r) => run.story.flags[r.flag] === r.lostValue).map((r) => ({ ...r.lane, region: r.region }));
  return lanes.filter((l) => content.species.has(l.species)).slice(0, MAX_LANES);
}

/** How the lanes fight: three or four = a triple battle (the fourth waits), two = doubles, one = a plain fight. */
export const formatForLanes = (n: number): 'triples' | 'doubles' | undefined => (n >= 3 ? 'triples' : n === 2 ? 'doubles' : undefined);

function setup(ctx: FormatCtx, input?: unknown): FrontState {
  const lanes = lanesFor(ctx, input);
  return { lanes, pending: false, result: lanes.length === 0 ? 'none' : null };
}

function describe(s: FrontState): FormatCard {
  if (s.result === 'none') {
    return {
      title: 'The Rainbow Door',
      lines: ['Giovanni steps through alone, looks around an empty hall, and looks at you for some time.', '"Nobody. In nine worlds I could always find at least one of them who\'d won. My compliments. I shan\'t come back to this one."'],
      options: [],
      over: true,
    };
  }
  if (s.result) {
    return {
      title: 'The Rainbow Door',
      lines: [s.result === 'held' ? 'Every lane held. The door closes.' : 'The lanes broke. You fall back.'],
      options: [],
      over: true,
    };
  }
  const n = s.lanes.length;
  const how = n >= 4 ? 'Three lanes are fought at once; the fourth waits and steps in when a lane falls.' : n === 3 ? 'The three lanes are fought at once.' : n === 2 ? 'The two lanes are fought at once.' : 'One lane.';
  return {
    title: 'The Rainbow Door',
    lines: [
      'The air opens like a door. Giovanni of Rainbow Rocket steps through with colleagues, each from a world where you were not there.',
      ...s.lanes.map((l, i) => `Lane ${i + 1}: ${l.leader}, with ${l.apex} at their side and nothing in their eyes.`),
      `${how} Each of your Pokémon fights the foe in its own lane. When its lane is clear it may help the others.`,
    ],
    options: [{ id: 'begin', label: 'Hold the lanes', enabled: true }],
    over: false,
  };
}

function choose(s: FrontState, id: string, ctx: FormatCtx): FrontState {
  if (s.pending || s.result || id !== 'begin') return s;
  const format = formatForLanes(s.lanes.length);
  const ok = launchFormatBattle(ctx.content, ctx.run, 'front', {
    key: 'lanes',
    name: 'Giovanni of Rainbow Rocket',
    classId: 'veteran',
    sprite: 'giovanni',
    lineup: s.lanes.map((l) => l.species),
    size: s.lanes.length,
    levelBonus: 3,
    ...(format ? { format } : {}),
    rule: { lanes: true },
  });
  return ok ? { ...s, pending: true } : s;
}

function onBattleEnd(s: FrontState, won: boolean, { run }: FormatCtx): FrontState {
  if (!s.pending) return s;
  const result: FrontResult = won ? 'held' : 'lost';
  run.story.flags['finale.x.front'] = result;
  markDone(run, 'front');
  return { ...s, pending: false, result };
}

export const front: WideFormat<FrontState> = {
  id: 'front',
  setup,
  describe: (s) => describe(s),
  choose,
  onBattleEnd,
  isOver: (s) => s.result !== null,
};

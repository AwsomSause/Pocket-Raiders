// Wide format 5: the Colossus (plan E4; Kanto Phase 6 "The Roof: Project M2", XD002). Kice's change: a Colossus is now a normal,
// multi-phase RAID on the game's own raid system (raids.json `ss-rocket-m2`, rules in core/raid): M2 has three shields (right
// shoulder, left shoulder, chest) and phases at 75%, 50% and 25% of its HP, a charged attack every 3 turns, an extra action when
// low, and a 10 turn timer. The armor seals, their shield bars and the custom plate are gone; the ordinary raid screen is used.
// The timer is +1 turn with `rocket.x.madame`, and the Seal Diagram (`rocket.x.seal-diagram`) leaves the right shoulder
// shield already cracked (the first shield never rises). Results are written once to `run.story.flags['rocket.x.m2']`:
// 'broken' (M2 was beaten; the `legend-cerulean-cave` flag is planted), 'taken' (the timer ran out: the helicopter takes it, it
// enters the Region of Doom, the climax still counts), 'lost' (the party fell: the director's Second Shot applies). A lost
// raid is a story loss, so the party is healed and the run goes on.
// Not built: the Rig Room shutdown lowering M2 a tier, the trio's debt delaying Giovanni's first order, and M2's signature
// moves (Mind Vault, Null Pulse, Heart Eclipse are not real moves yet).

import { launchFormatBattle } from './battle';
import { markDone, climaxRegion } from './store';
import { paldeaStatuses } from './siege';
import { raidRecord } from '../raid/storyRaids';
import type { FormatCard, FormatCtx, WideFormat } from './types';

export const M2_RAID = 'ss-rocket-m2';

/** Per-region Colossus content (Beta 0.7 E9). Kanto's M2 stays below in the default branches. */
export const COLOSSUS_REGIONS: Record<string, { apex: { id: string; name: string; code: string }; raidId: string; species: string; place: string; flag: string; intro: string[]; result: Record<ColossusResult, string> }> = {
  alola: {
    apex: { id: 'ss.aether.mother-beast', name: 'The Mother Beast', code: 'XD010' }, raidId: 'ss-aether-mother-beast', species: 'nihilego', place: 'The Deep', flag: 'alola.x.mother-beast',
    intro: ['Nebby carries you and Lillie through the gate into a sea with no water in it: black rock, glass threads, a hundred pale drifting bells. At the center, the largest, and inside it a woman\'s shape, smiling.', 'This is a raid in three veils (the Collection, the Children, the Husband). You have twelve turns before the gate collapses.'],
    result: {
      broken: 'The largest bell goes dark. The woman inside it is only a woman, floating, and very tired. Nihilego lets go; it was never holding her.',
      taken: 'Nebby pulls everyone out and the gate collapses with her on the far side. The climax is still won if she was beaten, but the Mother Beast enters the Region of Doom.',
      lost: 'The threads close around your team. You fall back.',
    },
  },
  paldea: {
    apex: { id: 'ss.star.cassiopeia-engine', name: 'The Cassiopeia Engine', code: 'XD012' }, raidId: 'ss-star-cassiopeia-engine', species: 'revavroom', place: 'Starfall Street', flag: 'star.x.engine',
    intro: ['The five Starmobiles lock nose to tail under the Academy clock. The ring starts to turn. The light coming off it is every Tera color at once, and then it is none of them.', 'This is a raid with three core stages, fought beside Team Star. Every Base you hold pulls its core without help, so the fight has fewer stages. You have twelve turns.'],
    result: {
      broken: 'The last core is pulled and the ring falls apart into five battered, ordinary Revavroom, each nosing at its own Boss like a dog that has had a fright.',
      taken: 'The Engine fires once. The Academy clock stops. Nobody is hurt: Penny built in a governor years ago. But Cipher has its recording, and the Engine\'s design enters the Region of Doom.',
      lost: 'The Engine tears through the line. You fall back.',
    },
  },
};

export type ColossusResult = 'broken' | 'taken' | 'lost';

export interface ColossusState {
  /** The region whose Colossus this is (absent in older saves: Kanto). */
  region?: string;
  /** The Apex's species and the fight's name (the plate title). */
  apex: { id: string; name: string; code: string };
  pending: boolean;
  result: ColossusResult | null;
}

/** A Rocket flag counts when a format wrote it (`rocket.x.wire`) or a Kanto run event did (`ev:rocket-wire`). */
const flag = (run: FormatCtx['run'], key: string): boolean => Boolean(run.story.flags[key] ?? run.story.flags[`ev:${key.replace('rocket.x.', 'rocket-')}`]);

function describe(s: ColossusState): FormatCard {
  const rc = s.region ? COLOSSUS_REGIONS[s.region] : undefined;
  if (rc) {
    return s.result
      ? { title: `${s.apex.code} · ${rc.place}`, lines: [rc.result[s.result]], options: [], over: true }
      : { title: `${s.apex.code} · ${rc.place}`, lines: rc.intro, options: [{ id: 'fight', label: `Face ${s.apex.name}`, enabled: true }], over: false };
  }
  if (s.result) {
    const lines: Record<ColossusResult, string> = {
      broken: 'The armor falls away and M2 stands. "You broke the cage and not the thing in it. I will remember that this happened." It is gone.',
      taken: 'The helicopter lifts with M2 slung beneath it. The climax is still won if Giovanni was beaten, but M2 is taken to the Region of Doom.',
      lost: 'M2 tears through the line. You fall back.',
    };
    return { title: `${s.apex.code} · The Roof`, lines: [lines[s.result]], options: [], over: true };
  }
  return {
    title: `${s.apex.code} · The Roof`,
    lines: [
      'The helipad. Rain. A shape in grey armor kneels at the center, cabled to a generator.',
      'This is a raid: M2 raises a shield at three-quarters, half and a quarter of its health, and a new phase begins each time. You have ten turns before the helicopter lifts it away.',
    ],
    options: [{ id: 'fight', label: `Face ${s.apex.name}`, enabled: true }],
    over: false,
  };
}

/** How the region's earlier choices change the fight: fewer or more shields (veils, cores). Pure thresholds; at least two stay. */
export function adjustShields(region: string, run: FormatCtx['run'], shields: number[]): number[] {
  const out = [...shields];
  const ev = (k: string) => Number(run.story.flags[`ev:${k}`] ?? 0) >= 1;
  if (region === 'alola' && ev('alola-mohn-found')) out.shift();
  if (region === 'paldea') {
    const r4 = raidRecord(run, 4)?.result;
    if (r4 === 'triumph') out.shift();
    else if (r4 === 'failure') out.unshift(0.9);
    const held = Object.values(paldeaStatuses(run)).filter((x) => x.status === 'held').length;
    for (let i = 0; i < held && out.length > 2; i++) out.pop();
  }
  return out;
}

function choose(s: ColossusState, id: string, ctx: FormatCtx): ColossusState {
  if (s.pending || s.result || id !== 'fight') return s;
  const rc = s.region ? COLOSSUS_REGIONS[s.region] : undefined;
  if (rc && s.region) {
    if (!ctx.content.species.has(rc.species) || !ctx.content.raids.raids.some((r) => r.id === rc.raidId)) return s;
    const ok = launchFormatBattle(ctx.content, ctx.run, 'colossus', { key: s.apex.id, name: s.apex.name, size: 1, raid: { raidId: rc.raidId } });
    const raid = ok ? ctx.run.battle?.raid : null;
    if (!ok || !raid) return s;
    raid.pendingShields = adjustShields(s.region, ctx.run, raid.pendingShields);
    return { ...s, pending: true };
  }
  if (!ctx.content.species.has('mewtwo') || !ctx.content.raids.raids.some((r) => r.id === M2_RAID)) return s;
  const ok = launchFormatBattle(ctx.content, ctx.run, 'colossus', { key: s.apex.id, name: s.apex.name, size: 1, raid: { raidId: M2_RAID } });
  const raid = ok ? ctx.run.battle?.raid : null;
  if (!ok || !raid) return s;
  if (flag(ctx.run, 'rocket.x.madame') && raid.timerLeft !== null) raid.timerLeft += 1;
  if (flag(ctx.run, 'rocket.x.seal-diagram')) raid.pendingShields = raid.pendingShields.slice(1);
  return { ...s, pending: true };
}

function onBattleEnd(s: ColossusState, won: boolean, { run }: FormatCtx): ColossusState {
  if (!s.pending) return s;
  const raid = run.battle?.raid;
  const escaped = Boolean(raid && raid.timerLeft !== null && raid.timerLeft <= 0);
  const result: ColossusResult = won ? 'broken' : escaped ? 'taken' : 'lost';
  const rc = s.region ? COLOSSUS_REGIONS[s.region] : undefined;
  run.story.flags[rc ? rc.flag : 'rocket.x.m2'] = result;
  if (!rc && result === 'broken') run.story.flags['legend-cerulean-cave'] = 1;
  markDone(run, 'colossus');
  return { ...s, pending: false, result };
}

export const colossus: WideFormat<ColossusState> = {
  canStart: (ctx, input) => input !== undefined || climaxRegion(ctx.run) === 'kanto' || climaxRegion(ctx.run) in COLOSSUS_REGIONS,
  id: 'colossus',
  setup: (ctx) => {
    const region = climaxRegion(ctx.run);
    const rc = COLOSSUS_REGIONS[region];
    return rc ? { region, apex: rc.apex, pending: false, result: null } : { apex: { id: 'ss.rocket.m2', name: 'M2', code: 'XD002' }, pending: false, result: null };
  },
  describe: (s) => describe(s),
  choose,
  onBattleEnd,
  isOver: (s) => s.result !== null,
};

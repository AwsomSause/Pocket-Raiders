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
import { markDone } from './store';
import type { FormatCard, FormatCtx, WideFormat } from './types';

export const M2_RAID = 'ss-rocket-m2';

export type ColossusResult = 'broken' | 'taken' | 'lost';

export interface ColossusState {
  /** The Apex's species and the fight's name (the plate title). */
  apex: { id: string; name: string; code: string };
  pending: boolean;
  result: ColossusResult | null;
}

/** A Rocket flag counts when a format wrote it (`rocket.x.wire`) or a Kanto run event did (`ev:rocket-wire`). */
const flag = (run: FormatCtx['run'], key: string): boolean => Boolean(run.story.flags[key] ?? run.story.flags[`ev:${key.replace('rocket.x.', 'rocket-')}`]);

function describe(s: ColossusState): FormatCard {
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

function choose(s: ColossusState, id: string, ctx: FormatCtx): ColossusState {
  if (s.pending || s.result || id !== 'fight') return s;
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
  run.story.flags['rocket.x.m2'] = result;
  if (result === 'broken') run.story.flags['legend-cerulean-cave'] = 1;
  markDone(run, 'colossus');
  return { ...s, pending: false, result };
}

export const colossus: WideFormat<ColossusState> = {
  id: 'colossus',
  setup: () => ({ apex: { id: 'ss.rocket.m2', name: 'M2', code: 'XD002' }, pending: false, result: null }),
  describe: (s) => describe(s),
  choose,
  onBattleEnd,
  isOver: (s) => s.result !== null,
};

// Wide format 5: the Colossus (plan E4; Kanto Phase 6 "The Roof: Project M2", XD002). One Apex fight with four armor
// seals (right shoulder, left shoulder, chest, crown), each with its own shield bar, drained in that order. The Apex cannot be
// knocked out while a seal remains (rules in core/battle/colossus.ts). The timer is 10 turns, +1 with `rocket.x.madame`. The
// Seal Diagram (`rocket.x.seal-diagram`) starts the first seal half broken. Results are written once to
// `run.story.flags['rocket.x.m2']`: 'broken' (the armor fell and M2 was beaten; the `legend-cerulean-cave` flag is planted),
// 'taken' (the timer ran out: the helicopter takes it, it enters the Region of Doom, the climax still counts), 'lost' (the
// party fell: the director's Second Shot applies). A lost fight is a story loss, so the party is healed and the run goes on.
// The screen is the picked Blueprint plate (Colossus 5): src/scenes/ColossusPlateScene.ts, shown beside the battle.
// Not built: the Rig Room shutdown lowering M2 a tier, the trio's debt delaying Giovanni's first order, the one idle turn
// after the armor falls (all need Shadow tiers / Giovanni's battle, which belong to the Kanto saga slices).

import type { ColossusConfig } from '../battle/colossus';
import { launchFormatBattle } from './battle';
import { markDone } from './store';
import type { FormatCard, FormatCtx, WideFormat } from './types';

export type ColossusResult = 'broken' | 'taken' | 'lost';

export interface ColossusState {
  /** The Apex's species and the fight's name (the plate title). */
  apex: { id: string; name: string; code: string };
  pending: boolean;
  result: ColossusResult | null;
}

/** A Rocket flag counts when a format wrote it (`rocket.x.wire`) or a Kanto run event did (`ev:rocket-wire`). */
const flag = (run: FormatCtx['run'], key: string): boolean => Boolean(run.story.flags[key] ?? run.story.flags[`ev:${key.replace('rocket.x.', 'rocket-')}`]);

/** The M2 fight's seals, timer and bar size, from the balance numbers and what the run has earned. */
export function m2Config({ content, run }: FormatCtx): ColossusConfig {
  const { shieldPct, timerM2 } = content.balance.colossus;
  return {
    id: 'ss.rocket.m2',
    shieldPct,
    timer: timerM2 + (flag(run, 'rocket.x.madame') ? 1 : 0),
    seals: [
      { name: 'Right Shoulder', removes: 'mind-vault', removesLabel: 'Mind Vault (signature)', crackedPct: flag(run, 'rocket.x.seal-diagram') ? 50 : 0 },
      { name: 'Left Shoulder', removes: 'null-pulse', removesLabel: 'Null Pulse' },
      { name: 'Chest', removes: 'heart-eclipse', removesLabel: 'Heart Eclipse' },
      { name: 'Crown', removes: '', removesLabel: 'Obedience' },
    ],
  };
}

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
      'M2 has four armor seals, each with its own shield bar. It cannot be knocked out while a seal remains. Breaking a seal takes one of its moves. You have a few turns before the helicopter lifts it away.',
    ],
    options: [{ id: 'fight', label: `Face ${s.apex.name}`, enabled: true }],
    over: false,
  };
}

function choose(s: ColossusState, id: string, ctx: FormatCtx): ColossusState {
  if (s.pending || s.result || id !== 'fight') return s;
  const species = ['mewtwo'].filter((x) => ctx.content.species.has(x));
  const ok = launchFormatBattle(ctx.content, ctx.run, 'colossus', {
    key: s.apex.id,
    name: s.apex.name,
    types: ['psychic'],
    species,
    size: 1,
    levelBonus: 4,
    colossus: m2Config(ctx),
  });
  return ok ? { ...s, pending: true } : s;
}

function onBattleEnd(s: ColossusState, won: boolean, { run }: FormatCtx): ColossusState {
  if (!s.pending) return s;
  const escaped = run.battle?.colossus?.escaped === true;
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

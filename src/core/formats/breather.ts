// Wide format 1: the Breather (plan E4/E5). A quiet room between the Duels and the set piece: every Pokémon that is still
// up heals 50% of its max HP, the player picks ONE fallen Pokémon to bring back (at the same share), and the run
// checkpoints. No shop. The share drops to 35% when the Siege Map lost the gate that poisons it (Kanto West Gate, the
// Cliff Stair elsewhere). It applies once: choosing finishes it, and a reload cannot repeat it. No RNG.

import { maxHp } from '../pokemon';
import type { RunState } from '../state';
import { markCheckpoint, markDone } from './store';
import type { FormatCard, FormatCtx, WideFormat } from './types';

export const BREATHER_HEAL = 0.5;
export const BREATHER_HEAL_LOST = 0.35;
/** Siege Map districts whose loss poisons the Breather (ids are written by the Siege Map format into `siege.lost`). */
export const BREATHER_POISON_DISTRICTS = ['kanto.west-gate', 'any.cliff-stair'] as const;

export interface BreatherState {
  healPct: number;
  /** 'choose' until the player picks; then 'done'. */
  step: 'choose' | 'done';
  /** The uid that was brought back (null = nobody was down, or revives are not allowed). */
  revived: string | null;
  /** How many Pokémon that were up got healed. */
  healed: number;
}

/** The share of max HP the Breather restores, from the districts the Siege Map lost. */
export function breatherShare(lost: readonly string[]): number {
  return lost.some((d) => (BREATHER_POISON_DISTRICTS as readonly string[]).includes(d)) ? BREATHER_HEAL_LOST : BREATHER_HEAL;
}

function lostDistricts(run: Pick<RunState, 'expansion'>): string[] {
  const l = run.expansion?.siege?.lost;
  return Array.isArray(l) ? l.filter((x): x is string => typeof x === 'string') : [];
}

function fallen(run: RunState): RunState['party'] {
  return run.party.filter((m) => m.hp <= 0 && m.uid !== run.battle?.loaner);
}

/** Applies the heal and the one revive (mutates the run). Idempotent: a finished Breather does nothing. */
function apply(state: BreatherState, reviveUid: string | null, { content, run }: FormatCtx): BreatherState {
  if (state.step === 'done') return state;
  let healed = 0;
  for (const mon of run.party) {
    if (mon.hp <= 0) continue;
    const max = maxHp(content, mon);
    const next = Math.min(max, mon.hp + Math.ceil(max * state.healPct));
    if (next > mon.hp) healed += 1;
    mon.hp = next;
  }
  let revived: string | null = null;
  const target = reviveUid ? fallen(run).find((m) => m.uid === reviveUid) : undefined;
  if (target) {
    target.hp = Math.max(1, Math.ceil(maxHp(content, target) * state.healPct));
    target.status = null;
    revived = target.uid;
  }
  markCheckpoint(run, 'breather');
  markDone(run, 'breather');
  return { ...state, step: 'done', revived, healed };
}

export const breather: WideFormat<BreatherState> = {
  id: 'breather',
  setup({ run }) {
    return { healPct: breatherShare(lostDistricts(run)), step: 'choose', revived: null, healed: 0 };
  },
  describe(state, { content, run }): FormatCard {
    const pct = Math.round(state.healPct * 100);
    if (state.step === 'done') {
      const name = state.revived ? run.party.find((m) => m.uid === state.revived) : null;
      const who = name ? content.species.get(name.speciesId)?.name ?? 'a Pokémon' : null;
      return {
        title: 'Breather',
        lines: [`Your team rested. The ones still up got back ${pct}% of their health${who ? `, and ${who} got back up` : ''}.`, 'The run is saved here.'],
        options: [],
        over: true,
      };
    }
    const down = fallen(run);
    const lines = [
      'The secretary pulls you into a quiet room. "Sit. Eat something. You look like the stock price."',
      `Every Pokémon that is still up heals ${pct}%. You can bring back one that fainted. No shop. The run saves here.`,
    ];
    if (state.healPct < BREATHER_HEAL) lines.push('The gate you lost let the poison in, so the rest helps less.');
    const options = down.length
      ? down.map((m) => ({ id: m.uid, label: `Bring back ${content.species.get(m.speciesId)?.name ?? m.speciesId} (Lv ${m.level})`, enabled: true }))
      : [{ id: 'rest', label: 'Rest', enabled: true, note: 'Nobody is down.' }];
    return { title: 'Breather', lines, options, over: false };
  },
  choose(state, optionId, ctx) {
    return apply(state, optionId === 'rest' ? null : optionId, ctx);
  },
  isOver: (s) => s.step === 'done',
};

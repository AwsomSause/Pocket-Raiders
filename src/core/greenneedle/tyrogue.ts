// Greenneedle gn.new.04, The Tyrogue Who Wanted All Three (doc GREENNEEDLE_PLACED_1.md lines 161–195).
// A Tyrogue thrown out of three dojos asks to travel with you for the stage. In every battle it fights, the game counts how it won:
// kicks, punches, or staying on its feet (turns survived, spins included). At the stage's end the lead decides what it becomes.
import type { Content } from '../contentSchema';
import type { PokemonInstance, RunState } from '../state';
import { evolve } from '../evolution';
import { fnv1a } from '../expansion/hash';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
/** The mark on the Tyrogue. */
export const TYROGUE = 'tyrogue-three';
/** The three schools: the flag each is counted in, the form it becomes, the tutor move that comes with it. */
export const STYLES = [
  { id: 'kick', flag: 'tyr-kick', form: 'hitmonlee', move: 'high-jump-kick' },
  { id: 'punch', flag: 'tyr-punch', form: 'hitmonchan', move: 'sky-uppercut' },
  { id: 'stand', flag: 'tyr-stand', form: 'hitmontop', move: 'gyro-ball' },
] as const;
export const KICKS = new Set(['low-kick', 'double-kick', 'rolling-kick', 'mega-kick', 'jump-kick', 'high-jump-kick', 'triple-kick', 'blaze-kick', 'low-sweep', 'triple-axel', 'stomp', 'axe-kick', 'trop-kick', 'thunderous-kick', 'tripping-kick']);
export const PUNCHES = new Set(['mach-punch', 'comet-punch', 'mega-punch', 'drain-punch', 'fire-punch', 'thunder-punch', 'ice-punch', 'bullet-punch', 'dynamic-punch', 'focus-punch', 'sky-uppercut', 'power-up-punch', 'meteor-mash', 'shadow-punch', 'hammer-arm', 'plasma-fists', 'jet-punch', 'surging-strikes', 'wicked-blow']);
/** It trained at all three dojos: it arrives knowing one kick, one punch and one spin, so its battles can go any of the three ways. */
export const TYROGUE_MOVES = ['low-kick', 'mach-punch', 'rapid-spin', 'fake-out'] as const;
export const SPINS = new Set(['rapid-spin', 'gyro-ball', 'spin-out']);

const everyone = (run: RunState): PokemonInstance[] => [...run.party, ...run.box];
export const tyrogueMon = (run: RunState): PokemonInstance | undefined => everyone(run).find((m) => m.gn?.includes(TYROGUE));
/** The three counts: kicks, punches, stands. */
export const tally = (run: Pick<RunState, 'story'>): [number, number, number] => [f(run, 'tyr-kick'), f(run, 'tyr-punch'), f(run, 'tyr-stand')];
/** The leading style (0 kick, 1 punch, 2 stand) when it is ahead of the next by two or more; -1 when the schools are even. */
export function leadOf(run: Pick<RunState, 'story'>): number {
  const t = tally(run);
  const order = [0, 1, 2].sort((a, b) => t[b]! - t[a]!);
  return t[order[0]!]! - t[order[1]!]! >= 2 ? order[0]! : -1;
}
/** Condition `tyrLead` (key kick, punch or stand): that school is clearly ahead. `tyrEven`: none is. */
export const tyrLead = (run: Pick<RunState, 'story'>, key: string): boolean => {
  const l = leadOf(run);
  return l >= 0 && STYLES[l]!.id === key;
};
export const tyrEven = (run: Pick<RunState, 'story'>): boolean => leadOf(run) < 0;

/** Adds `n` to a school's count. `key` is kick, punch or stand. */
export function tyrTally(run: RunState, key: string, n: number): string {
  const s = STYLES.find((x) => x.id === key);
  if (s) set(run, s.flag, f(run, s.flag) + n);
  return '';
}

/** It travels with you. `how` 1: "Travel with me for the stage." `how` 2: "Pick one, kid." (it picks a school, and starts three ahead in it). */
export function tyrogueJoin(run: RunState, how: number, stage: number, host: { apply: (e: unknown) => string }): string {
  for (const k of ['tyr-kick', 'tyr-punch', 'tyr-stand', 'tyr-now-kick', 'tyr-now-punch', 'tyr-now-stand', 'tyr-picked', 'tyr-result']) delete run.story.flags[`ev:${k}`];
  set(run, 'tyr-on', 1);
  set(run, 'tyr-region', run.regionIndex + 1);
  set(run, 'tyr-stage', stage);
  const words = host.apply({ kind: 'join', recall: false, species: ['tyrogue'], types: [], levelBonus: -1, shinyMultiplier: 1, shadow: false, blissful: false, hiddenAbility: false, moves: [...TYROGUE_MOVES], direct: true, alpha: false, starterType: false, asIs: true, mark: TYROGUE });
  if (how !== 2) return words;
  const pick = fnv1a(`${run.seed}:tyrogue-three`) % 3;
  set(run, 'tyr-picked', pick + 1);
  set(run, STYLES[pick]!.flag.replace('ev:', ''), 3);
  const door = ['Sensei Oyelowo\'s door: the kicks', 'Sensei Brannigan\'s door: the punches', 'Sensei Tachibana\'s door: the stance'][pick]!;
  return [words, `It picks ${door}.`].filter(Boolean).join(' ');
}

/** After each turn of a battle (run.ts takeTurn): while it travels this stage and is the one fighting, it counts how it is winning. */
export function tyrogueTurn(run: RunState, events: readonly { type: string; side?: string; moveId?: string | null }[]): void {
  if (f(run, 'tyr-on') !== 1 || !run.battle || !run.stage) return;
  if (f(run, 'tyr-region') !== run.regionIndex + 1 || f(run, 'tyr-stage') !== (run.stage.index ?? 0) + 1) return;
  const mon = run.party[run.battle.activeIndex];
  // A turn it did not fight (or fell in) adds nothing, but a battle decided on that turn is still settled.
  if (!mon?.gn?.includes(TYROGUE) || mon.hp <= 0) return tyrogueSettle(run);
  let stood = false;
  // "How it won": the count is kept for this battle only, and joins the tally when the battle is won (a lost battle counts for nothing).
  const now = (key: string): void => set(run, `tyr-now-${key}`, f(run, `tyr-now-${key}`) + 1);
  for (const e of events) {
    if (e.type === 'move' && e.side === 'player' && e.moveId) {
      if (KICKS.has(e.moveId)) now('kick');
      else if (PUNCHES.has(e.moveId)) now('punch');
      else if (SPINS.has(e.moveId)) stood = true;
    }
    if (e.type === 'damage' && e.side === 'player') stood = true;
  }
  if (stood) now('stand');
  tyrogueSettle(run);
}

/** The battle is decided: a win (or a catch) adds this battle's kicks, punches and stands to the tally; a loss drops them. */
export function tyrogueSettle(run: RunState): void {
  const outcome = run.battle?.outcome;
  if (!outcome) return;
  for (const st of STYLES) {
    const n = f(run, `tyr-now-${st.id}`);
    if (n > 0 && outcome !== 'lose') tyrTally(run, st.id, n);
    delete run.story.flags[`ev:tyr-now-${st.id}`];
  }
}

/** The ending (step 19): flag `tyr-result` becomes 0 (it's gone), 1 kick, 2 punch, 3 stand, 4 even. */
export function tyrResult(run: RunState): string {
  const l = leadOf(run);
  set(run, 'tyr-result', !tyrogueMon(run) ? 0 : l >= 0 ? l + 1 : 4);
  set(run, 'tyr-on', 2);
  return '';
}

/** It becomes Hitmonlee, Hitmonchan or Hitmontop (`key` kick, punch or stand). */
export function tyrEvolve(content: Content, run: RunState, key: string): string {
  const mon = tyrogueMon(run);
  const s = STYLES.find((x) => x.id === key);
  if (!mon || !s || !content.species.has(s.form) || mon.speciesId !== 'tyrogue') return '';
  evolve(content, mon, s.form);
  return '';
}

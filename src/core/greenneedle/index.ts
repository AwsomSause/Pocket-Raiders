// Greenneedle events (Catalog Overhaul Pack): the rules that only these events use. Pure functions; events.ts and run.ts call
// them at their hook points, the battle engine reads two tokens from `battle.storyEffects`. No random numbers anywhere, so
// previews, saves and replays agree. State is run flags (`ev:gn-*`) plus the optional `gn` marks on a Pokémon: no save change.

import type { Content } from '../contentSchema';
import type { PlayerAction } from '../battle/engine';
import type { BattleState, PokemonInstance, RunState } from '../state';
import type { GnEffect } from './schema';

type Cue = { type: 'spectacle'; kind: 'arena'; side: 'player' | 'enemy'; text: string; uid?: string };
const cue = (side: 'player' | 'enemy', text: string, uid?: string): Cue => ({ type: 'spectacle', kind: 'arena', side, text, ...(uid ? { uid } : {}) });

const key = (k: string): string => `ev:${k}`;
export const gnFlag = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[key(k)] ?? 0);
export const setGnFlag = (run: Pick<RunState, 'story'>, k: string, v: number): void => {
  run.story.flags[key(k)] = Math.max(0, v);
};

const nameOf = (content: Content, mon: PokemonInstance): string => content.species.get(mon.speciesId)?.name ?? mon.speciesId;

/** The party Pokémon carrying a mark (`duelist`), and the species it had when it was marked. */
export function markedMon(run: Pick<RunState, 'party'>, mark: string): { mon: PokemonInstance; was: string } | undefined {
  for (const mon of run.party) {
    const tag = mon.gn?.find((t) => t === mark || t.startsWith(`${mark}:`));
    if (tag) return { mon, was: tag.split(':')[1] ?? mon.speciesId };
  }
  return undefined;
}

/** Friendship at which a Pokémon counts as "Bond 3 or more" in the pack's words (STANDARDS.md: Bond +1 is friendship +5; the base is 70). */
export const BOND_THREE = 85;

/** Token on `battle.storyEffects`: the foe gives up its next attack, with this line (the battle engine reads and removes it). */
export const FOE_WAITS = 'gn-foe-waits:';

export const FOREST = { inside: 'gn-forest-in', battles: 'gn-forest-battles', fought: 'gn-forest-fought', rank: 'gn-forest-rank', evolved: 'gn-forest-evolved', fog: 'gn-forest-fog' } as const;

/** What a step needs from events.ts: the stop's seeded stream and the ordinary effect applier (passed in, so this folder imports no engine code). */
export interface GnHost {
  float: () => number;
  apply: (effect: unknown) => string;
}

/** One Greenneedle story step. Returns the line the outcome shows (may be empty). */
export function applyGnEffect(content: Content, run: RunState, e: GnEffect, host: GnHost): string {
  switch (e.op) {
    case 'duelist': {
      if (markedMon(run, 'duelist')) return '';
      const fits = run.party.filter((m) => m.hp > 0 && (content.species.get(m.speciesId)?.types as string[] | undefined)?.includes(e.type ?? 'bug'));
      const mon = fits[fits.length - 1];
      if (!mon) return '';
      mon.gn = [...(mon.gn ?? []), `duelist:${mon.speciesId}`];
      for (const k of [FOREST.battles, FOREST.fought, FOREST.rank, FOREST.evolved]) setGnFlag(run, k, 0);
      return `${nameOf(content, mon)} walks beside you now. It is your duelist.`;
    }
    case 'capFlag':
      if (gnFlag(run, e.key!) > e.n!) setGnFlag(run, e.key!, e.n!);
      return '';
    case 'setFlag':
      setGnFlag(run, e.key!, e.n!);
      return '';
    case 'unmark':
      for (const mon of run.party) if (mon.gn) mon.gn = mon.gn.filter((t) => t !== e.key && !t.startsWith(`${e.key}:`));
      return '';
    case 'roll':
      setGnFlag(run, e.key!, host.float() * 100 < e.n! ? 1 : 0);
      return '';
    case 'pick': {
      const total = e.weights!.reduce((a, b) => a + b, 0);
      let at = host.float() * total;
      let index = e.weights!.length;
      for (let i = 0; i < e.weights!.length; i++) {
        at -= e.weights![i]!;
        if (at < 0) {
          index = i + 1;
          break;
        }
      }
      setGnFlag(run, e.key!, index);
      return '';
    }
    case 'when': {
      const v = gnFlag(run, e.key!);
      if (v < (e.min ?? 1) || v > (e.max ?? 99)) return '';
      const lines = (e.then ?? []).map((x) => host.apply(x)).filter(Boolean);
      return [e.text, ...lines].filter(Boolean).join(' · ');
    }
    case 'route': {
      const ids = e.to!.ids;
      return host.apply({ kind: 'addEvent', eventId: ids[Math.min(gnFlag(run, e.key!), ids.length - 1)]! });
    }
  }
}

/** Moves that turn a Pokémon away from the foe (the Samurai's Pinsir will not strike it that turn). */
const guards = (content: Content, mon: PokemonInstance, index: number): boolean => {
  const move = content.moves.get(mon.moves[index]?.id ?? '');
  return !!move && (move.effects.protect !== undefined || move.id === 'endure');
};

/** When an event fight begins: the forest's fog dulls everyone's aim, and a trusting duelist moves first on its first move (the token Kindness uses). */
export function gnBattleStart(_content: Content, run: RunState): void {
  const battle = run.battle;
  if (!battle) return;
  if (gnFlag(run, FOREST.inside) > 0 && gnFlag(run, FOREST.fog) > 0) battle.accuracyMult = 0.9;
  const lead = run.party[battle.activeIndex];
  if (battle.eventRule?.gn === 'samurai' && lead && lead.friendship >= BOND_THREE) battle.storyEffects.push(`kind:${lead.uid}`);
}

/** Before the player's command is played: a Greenneedle rule may answer it. Returns the action to play and lines to show first. */
export function gnShape(content: Content, run: RunState, action: PlayerAction): { action: PlayerAction; events: Cue[] } {
  const battle = run.battle;
  const rule = battle?.eventRule?.gn;
  const mon = battle ? run.party[battle.activeIndex] : undefined;
  if (!battle || !rule || !mon || battle.needsSwitch) return { action, events: [] };
  const foe = battle.enemyTeam[battle.enemyIndex];
  if (rule === 'samurai' && foe?.speciesId === 'pinsir' && foe.hp > 0 && action.kind === 'move' && guards(content, mon, action.index)) {
    battle.storyEffects.push(`${FOE_WAITS}Pinsir lowers its horns. It will not strike a foe that is not looking at it.`);
  }
  return { action, events: [] };
}

/** The forest counts (gn.03): battles won inside, and how many of them the duelist fought in; 2 = most, 1 = some, 0 = none. */
function countForest(run: RunState, battle: BattleState): void {
  if (gnFlag(run, FOREST.inside) < 1) return;
  const duelist = markedMon(run, 'duelist');
  if (!duelist) return;
  const battles = gnFlag(run, FOREST.battles) + 1;
  const fought = gnFlag(run, FOREST.fought) + (battle.participants.includes(duelist.mon.uid) ? 1 : 0);
  setGnFlag(run, FOREST.battles, battles);
  setGnFlag(run, FOREST.fought, fought);
  setGnFlag(run, FOREST.rank, fought * 2 > battles ? 2 : fought > 0 ? 1 : 0);
  if (duelist.mon.speciesId !== duelist.was) setGnFlag(run, FOREST.evolved, 1);
}

/** After a turn: once a fight is won, the stories that count fights take their count (once per fight). */
export function gnAfterTurn(_content: Content, run: RunState): Cue[] {
  const battle = run.battle;
  if (!battle || battle.outcome !== 'win' || battle.storyEffects.includes('gn-counted')) return [];
  battle.storyEffects.push('gn-counted');
  countForest(run, battle);
  return [];
}

export { cue as gnCue };

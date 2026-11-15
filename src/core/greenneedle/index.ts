// Greenneedle events (Catalog Overhaul Pack): the rules that only these events use. Pure functions; events.ts and run.ts call
// them at their hook points, the battle engine reads two tokens from `battle.storyEffects`. No random numbers anywhere, so
// previews, saves and replays agree. State is run flags (`ev:gn-*`) plus the optional `gn` marks on a Pokémon: no save change.

import type { Content } from '../contentSchema';
import type { PlayerAction } from '../battle/engine';
import type { BattleState, PokemonInstance, RunState } from '../state';
import type { GnCond, GnEffect } from './schema';
import { addLevels, isUsableMove, maxHp } from '../pokemon';
import { addItem } from '../items';
import { typeEffectiveness } from '../battle/damage';
import type { TypeName } from '../contentSchema';

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

export const FOREST = { inside: 'gn-forest-in', battles: 'gn-forest-battles', fought: 'gn-forest-fought', rank: 'gn-forest-rank', evolved: 'gn-forest-evolved', fog: 'gn-forest-fog', duelist: 'gn-forest-duelist', big: 'gn-forest-big' } as const;

/** The newest conscious party Pokémon of the type becomes the forest's duelist (once; later calls do nothing). */
export function markDuelist(content: Content, run: RunState, type: string): string {
  if (markedMon(run, 'duelist')) return '';
  const fits = run.party.filter((m) => m.hp > 0 && (content.species.get(m.speciesId)?.types as string[] | undefined)?.includes(type));
  const mon = fits[fits.length - 1];
  if (!mon) return '';
  mon.gn = [...(mon.gn ?? []), `duelist:${mon.speciesId}`];
  for (const k of [FOREST.battles, FOREST.fought, FOREST.rank, FOREST.evolved]) setGnFlag(run, k, 0);
  setGnFlag(run, FOREST.duelist, 1);
  setGnFlag(run, FOREST.big, ['pinsir', 'scyther', 'heracross'].includes(mon.speciesId) ? 1 : 0);
  // The pack's own flag name for "a Bug-type walks with the player" (kanto.forest.bug).
  setGnFlag(run, 'kanto-forest-bug', 1);
  return `${nameOf(content, mon)} walks beside you now. It is your duelist.`;
}

/** What a step needs from events.ts: the stop's seeded stream and the ordinary effect applier (passed in, so this folder imports no engine code). */
export interface GnHost {
  float: () => number;
  apply: (effect: unknown) => string;
  /** The stage number counted from the start of the run (1 = the first stage). */
  stage: number;
  /** The run's current region id. */
  region: string;
}

/** A Greenneedle condition. */
export function gnConditionMet(content: Content, run: RunState, c: GnCond, stage: number): boolean {
  if (c.test === 'lookAtLevel') return run.party.some((m) => m.look === c.types![0] && m.level >= gnFlag(run, c.key!));
  if (c.test === 'notRegion') return !c.types!.includes(run.regionOrder[run.regionIndex] ?? '');
  if (c.test === 'holdsBerry') return run.party.some((m) => Object.entries(m.held ?? {}).some(([id, n]) => n > 0 && id.endsWith('-berry')));
  if (c.test === 'cutter') return run.party.some((m) => m.hp > 0 && m.moves.some((s) => { const mv = content.moves.get(s.id); return !!mv && mv.category !== 'status' && (mv.flags.includes('slicing') || s.id.includes('claw')); }));
  if (c.test === 'moveType') return run.party.some((m) => m.hp > 0 && m.moves.some((s) => { const mv = content.moves.get(s.id); return !!mv && mv.category !== 'status' && c.types!.includes(mv.type); }));
  if (c.test === 'noMoveType') return !run.party.some((m) => m.moves.some((s) => c.types!.includes(content.moves.get(s.id)?.type ?? '')));
  const stamped = gnFlag(run, c.key!);
  if (c.test === 'laterStage') return stamped > 0 && stamped < stage;
  if (c.test === 'sameStage') return stamped === stage;
  if (c.test === 'notThisStage') return stamped !== stage;
  if (c.test === 'notThisRegion') return stamped !== run.regionIndex + 1;
  if (c.test === 'thisRegion') return stamped === run.regionIndex + 1;
  return stamped > 0 && stamped < run.regionIndex + 1;
}

/** Fossils by region (gn.04 Fossil Recovery). A region with none of its own digs up the Kanto three. */
export const REGION_FOSSILS: Record<string, string[]> = {
  kanto: ['helix-fossil', 'dome-fossil', 'old-amber'],
  hoenn: ['root-fossil', 'claw-fossil'],
  sinnoh: ['skull-fossil', 'armor-fossil'],
  unova: ['cover-fossil', 'plume-fossil'],
  kalos: ['jaw-fossil', 'sail-fossil'],
  galar: ['fossilized-bird', 'fossilized-fish', 'fossilized-drake', 'fossilized-dino'],
};
const fossilsOf = (region: string): string[] => REGION_FOSSILS[region] ?? REGION_FOSSILS.kanto!;
const fossilsElsewhere = (region: string): string[] => {
  const own = new Set(fossilsOf(region));
  return [...new Set(Object.values(REGION_FOSSILS).flat())].filter((id) => !own.has(id));
};

/** One Greenneedle story step. Returns the line the outcome shows (may be empty). */
export function applyGnEffect(content: Content, run: RunState, e: GnEffect, host: GnHost): string {
  switch (e.op) {
    case 'duelist':
      return markDuelist(content, run, e.type ?? 'bug');
    case 'capFlag':
      if (gnFlag(run, e.key!) > e.n!) setGnFlag(run, e.key!, e.n!);
      return '';
    case 'setFlag':
      setGnFlag(run, e.key!, e.n!);
      return '';
    case 'unmark':
      if (e.key === 'duelist') setGnFlag(run, FOREST.duelist, 0);
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
    case 'scene': {
      const here = run.stage?.map.nodes.find((n) => n.id === run.stage!.current);
      if (!here || !content.events.has(e.key!)) return '';
      here.sides.push({ id: `event-room-${here.sides.length + 1}-${here.id}`, kind: 'event', used: false, eventId: e.key! });
      if (run.itemCounters) delete run.itemCounters[`event-seen:${e.key!}`];
      return '';
    }
    case 'stampRegion':
      setGnFlag(run, e.key!, run.regionIndex + 1);
      return '';
    case 'stampStage':
      setGnFlag(run, e.key!, host.stage);
      return '';
    case 'leadBoost': {
      const lead = run.party.find((m) => m.hp > 0) ?? run.party[0];
      if (lead) lead.boosts = [...(lead.boosts ?? []), { kind: 'stage', stat: e.type as 'spe', stages: e.n!, turns: 99 }];
      return '';
    }
    // A Pokémon fights alone for a while (the rain's Fire-type, Flame 5): the team waits in the canon stash, and comes back after.
    // Unlike Flight North's restore, whoever stood in for them simply leaves; nothing is remembered.
    case 'stash': {
      const ex = (run.expansion ?? {}) as NonNullable<RunState['expansion']>;
      const canon = ex.canon ?? { flags: [], completed: [], menus: {} };
      if (canon.stash || run.party.length === 0) return '';
      (run as { expansion?: object }).expansion = { ...ex, canon: { ...canon, stash: structuredClone(run.party) } };
      run.party = [];
      return 'Your team steps back';
    }
    case 'unstash': {
      const canon = run.expansion?.canon;
      if (!canon?.stash || canon.solo) return '';
      run.party = canon.stash as PokemonInstance[];
      delete canon.stash;
      return 'Your team comes back';
    }
    case 'markLook':
      for (const mon of run.party) if (mon.look === e.type) mon.gn = [...(mon.gn ?? []).filter((t) => t !== e.key), e.key!];
      return '';
    case 'setLook':
      for (const mon of run.party) if (mon.gn?.includes(e.key!)) mon.look = e.type as PokemonInstance['look'];
      return '';
    case 'noFaint':
      if (run.party.every((m) => m.hp > 0)) setGnFlag(run, e.key!, gnFlag(run, e.key!) + e.n!);
      return '';
    case 'clampFlag':
      setGnFlag(run, e.key!, Math.max(e.min!, Math.min(e.max!, gnFlag(run, e.key!))));
      return '';
    case 'itemEach':
      addItem(run.inventory, e.key!, Math.max(1, run.party.length));
      return '';
    case 'payBerry': {
      // gn.12: one held Berry is handed over (the first party Pokémon holding one, the first Berry by name).
      for (const m of run.party) {
        const id = Object.keys(m.held ?? {}).sort().find((k) => k.endsWith('-berry') && (m.held![k] ?? 0) > 0);
        if (!id) continue;
        m.held![id]! -= 1;
        if (m.held![id] === 0) delete m.held![id];
        return `Paid a ${content.catalog.get(id)?.name ?? id}`;
      }
      return '';
    }
    case 'partyHas':
      setGnFlag(run, e.key!, run.party.some((m) => e.species!.includes(m.speciesId)) ? 1 : 0);
      return '';
    case 'stageMod':
      setGnFlag(run, e.key!, host.stage % e.n!);
      return '';
    case 'fossil': {
      const far = e.key === 'far' || (e.key === 'local' && host.float() >= 0.7);
      const table = (far ? fossilsElsewhere(host.region) : fossilsOf(host.region)).filter((id) => content.catalog.has(id) || content.items.has(id));
      if (table.length === 0) return '';
      return host.apply({ kind: 'item', id: table[Math.min(table.length - 1, Math.floor(host.float() * table.length))]!, count: 1 });
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
export function gnBattleStart(content: Content, run: RunState): void {
  const battle = run.battle;
  if (!battle) return;
  if (gnFlag(run, FOREST.inside) > 0 && gnFlag(run, FOREST.fog) > 0) battle.accuracyMult = 0.9;
  // A Weedle duelist: the swarm's Beedrill will not strike first at one of their own.
  if (battle.event?.eventId === 'gn-03-oak' && battle.kind === 'wild' && ['weedle', 'kakuna', 'beedrill'].includes(markedMon(run, 'duelist')?.was ?? '')) {
    battle.storyEffects.push(`${FOE_WAITS}The swarm hangs back. They will not strike first at one of their own.`);
  }
  // Damian's friends (gn.05): Tully uses Splash twice, on purpose; Bex spends a turn finding the attack button.
  if (battle.eventRule?.gn === 'tully') battle.storyEffects.push(`${FOE_WAITS}Tully's Pokémon uses Splash! On purpose.`, `${FOE_WAITS}Tully's Pokémon uses Splash again! Tully looks very pleased.`);
  if (battle.eventRule?.gn === 'bex') battle.storyEffects.push(`${FOE_WAITS}Bex is looking for the attack one. "TOP LEFT!" shouts Damian, from the back.`);
  if (battle.eventRule?.gn === 'damian') trainAce(content, battle.enemyTeam[battle.enemyTeam.length - 1], battle.eventRule.ace ?? 1);
  const lead = run.party[battle.activeIndex];
  // The Squirtle Squad (gn.08): the Leader's level is what a Lesser recruit has to reach before it may go back and challenge it.
  if (battle.event?.eventId === 'gn-08-leader' && battle.enemyTeam[0]) setGnFlag(run, 'squad-leader-level', battle.enemyTeam[0].level);
  // Cold Night's Rain (gn.07), Flame 5: the Fire-type fights the owner's last Pokémon itself, worn down already, with one move. It is enough.
  if (battle.eventRule?.gn === 'lastflame' && lead) {
    const foe = battle.enemyTeam[battle.enemyTeam.length - 1];
    if (foe) foe.hp = 1;
    const fire = lead.moves.find((m) => content.moves.get(m.id)?.type === 'fire' && (content.moves.get(m.id)?.power ?? 0) > 0);
    lead.moves = [fire ?? { id: 'ember', pp: content.moves.get('ember')?.pp ?? 25 }];
  }
  if (battle.eventRule?.gn === 'samurai' && lead && lead.friendship >= BOND_THREE) battle.storyEffects.push(`kind:${lead.uid}`);
}

/** A type's own boosting item: what a trainer who thought about it would give the ace to hold. */
const TYPE_HELD: Record<string, string> = {
  normal: 'silk-scarf', fighting: 'black-belt', flying: 'sharp-beak', poison: 'poison-barb', ground: 'soft-sand', rock: 'hard-stone', bug: 'silver-powder',
  ghost: 'spell-tag', steel: 'metal-coat', fire: 'charcoal', water: 'mystic-water', grass: 'miracle-seed', electric: 'magnet', psychic: 'twistedspoon',
  ice: 'nevermeltice', dragon: 'dragon-fang', dark: 'blackglasses', fairy: 'fairy-feather',
};

/**
 * Damian's ace (gn.05): "This one I actually trained." It stands `plus` levels above the team, holds its type's booster, and keeps its first two
 * moves while the last two answer its two worst weaknesses (the strongest damaging move it can learn of a type that hits each one hard).
 */
/** Every move the species can learn (level-up, TM/tutor, egg), as rivals/coverage.ts counts it (not imported: it would load rivals before events). */
function learnPool(content: Content, speciesId: string): string[] {
  const sp = content.species.get(speciesId);
  if (!sp) return [];
  const base = sp.form?.base;
  return [...new Set([...sp.learnset.map((e) => e.move), ...(content.learnables.get(speciesId) ?? (base ? content.learnables.get(base) : undefined) ?? []), ...(content.eggMoves.get(speciesId) ?? [])])];
}

export function trainAce(content: Content, ace: PokemonInstance | undefined, plus: number): void {
  if (!ace) return;
  if (plus > 0) {
    addLevels(content, ace, plus);
    ace.hp = maxHp(content, ace);
  }
  const species = content.species.get(ace.speciesId);
  const held = species?.types[0] ? TYPE_HELD[species.types[0]] : undefined;
  if (held && content.catalog.get(held)?.status === 'supported') ace.held = { [held]: 1 };
  const pool = learnPool(content, ace.speciesId).filter((id) => isUsableMove(content, id) && (content.moves.get(id)?.power ?? 0) > 0);
  const types = Object.keys(content.typeChart) as TypeName[];
  const hits = (moveId: string, target: TypeName): boolean => typeEffectiveness(content.typeChart, content.moves.get(moveId)!.type as TypeName, [target]) >= 2;
  const weak = species ? types.filter((t) => typeEffectiveness(content.typeChart, t, species.types as TypeName[]) >= 2) : [];
  const picked: string[] = [];
  for (const w of weak) {
    if (picked.length >= 2) break;
    const best = pool
      .filter((id) => !picked.includes(id) && !ace.moves.slice(0, 2).some((m) => m.id === id) && hits(id, w))
      .sort((a, b) => (content.moves.get(b)!.power ?? 0) - (content.moves.get(a)!.power ?? 0) || a.localeCompare(b))[0];
    if (best) picked.push(best);
  }
  if (picked.length === 0) return;
  const kept = ace.moves.slice(0, 4 - picked.length);
  ace.moves = [...kept, ...picked.map((id) => ({ id, pp: content.moves.get(id)!.pp }))];
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
function countForest(content: Content, run: RunState, battle: BattleState): void {
  if (gnFlag(run, FOREST.inside) < 1) return;
  // A Bug-type caught in the last room has joined by now: it is marked before this fight is counted.
  markDuelist(content, run, 'bug');
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
export function gnAfterTurn(content: Content, run: RunState): Cue[] {
  const battle = run.battle;
  if (!battle || (battle.outcome !== 'win' && battle.outcome !== 'caught') || battle.storyEffects.includes('gn-counted')) return [];
  battle.storyEffects.push('gn-counted');
  countForest(content, run, battle);
  return [];
}

export { cue as gnCue };

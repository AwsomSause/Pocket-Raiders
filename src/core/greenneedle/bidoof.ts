// Greenneedle gn.55, The Angry Bidoof (doc GREENNEEDLE_REWORKED_PLACED_12.md lines 93–172).
// A trainer laughed at it. Its stats are a Bidoof's, tripled; it knows Superpower, Aqua Tail, Return at full power and Curse,
// with Simple; it never flinches. Its trainer explains, throughout, that it's a perfectly ordinary Bidoof.
import type { Content } from '../contentSchema';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { maxHp } from '../pokemon';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
export const BIDOOF_MOVES = ['superpower', 'aqua-tail', 'return', 'curse'];
/** Tripled: +200% to every stat. Once it joins: a fixed +30%. */
const TRIPLED = 200;
const JOINED = 30;
export const NO_FLINCH = 'no-flinch:';
/** Its mood when the fight starts (`bidoof-mood`): 1 "I wasn't laughing", 2 "It's a Bidoof" (+1 Attack), 3 "very fine" (it bows first). */
export function bidoofStart(content: Content, run: RunState, battle: BattleState): void {
  const foe = battle.enemyTeam[0];
  if (!foe) return;
  foe.eventBoosts = Object.fromEntries(STATS.map((s) => [s, TRIPLED]));
  foe.hp = maxHp(content, foe);
  foe.fixedAbility = 'simple';
  foe.friendship = 255;
  foe.moves = BIDOOF_MOVES.filter((id) => content.moves.has(id)).map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  // It knows you broke the Bibarel dam (gn.new.20): +2 Attack whatever you say. "It's a Bidoof": +1.
  const atk = f(run, 'bibarel-dam-broken') > 0 ? 2 : f(run, 'bidoof-mood') === 2 ? 1 : 0;
  if (atk > 0) battle.enemyStages.atk = Math.min(6, battle.enemyStages.atk + atk);
  battle.storyEffects.push(`${NO_FLINCH}${foe.uid}`);
}

const LINES = {
  first: '**Mr. Applewhite:** "You see, people assume. But a Bidoof\'s a rodent, and rodents are terribly determined."',
  curse: '**Mr. Applewhite:** "That\'s just its way of settling in. They\'re homebodies, Bidoof."',
  sturdy: '**Mr. Applewhite:** "Sturdy little things. The teeth never stop growing, did you know? It\'s really quite sad."',
  second: '**Mr. Applewhite:** "I\'ve always said it\'s a matter of *confidence.* I bought it at a fair."',
  winning: '**Mr. Applewhite:** "Oh, now you\'ve upset it."',
  losing: '**Mr. Applewhite:** "I\'m so sorry. It\'s normally very gentle. It likes turnips."',
} as const;
type Said = keyof typeof LINES;

/** gn rule `bidoof`, at each turn's end: what Mr. Applewhite says (each line once a fight). */
export function bidoofTurn(content: Content, battle: BattleState, party: PokemonInstance[] | undefined, events: { type: string; side?: string; moveId?: string; effectiveness?: number }[], push: (text: string) => void): void {
  const say = (k: Said): void => {
    const tag = `bidoof-said:${k}`;
    if (battle.storyEffects.includes(tag)) return;
    battle.storyEffects.push(tag);
    push(LINES[k]);
  };
  const foe = battle.enemyTeam[0];
  const down = (party ?? []).filter((m) => m.hp <= 0).length;
  const standing = (party ?? []).filter((m) => m.hp > 0).length;
  if (down >= 1) say('first');
  if (down >= 2) say('second');
  if (events.some((e) => e.type === 'move' && e.side === 'enemy' && e.moveId === 'curse')) say('curse');
  if (foe && foe.hp > 0 && events.some((e) => e.type === 'damage' && e.side === 'enemy' && (e.effectiveness ?? 1) > 1)) say('sturdy');
  if (foe && foe.hp > 0 && foe.hp * 3 <= maxHp(content, foe)) say('winning');
  if (standing === 1 && down >= 1) say('losing');
}

/** It sits on your foot: it joins, with Unbothered and a fixed +30% (a perfectly ordinary Bidoof). */
export function bidoofJoin(content: Content, run: RunState, host: { apply: (e: unknown) => string }): string {
  if (f(run, 'bidoof-end') > 0) return '';
  run.story.flags['ev:bidoof-end'] = 1;
  const before = new Set([...run.party, ...run.box].map((m) => m.uid));
  const words = host.apply({ kind: 'join', recall: false, species: ['bidoof'], types: [], levelBonus: 0, shinyMultiplier: 1, shadow: false, blissful: false, hiddenAbility: false, moves: [], direct: true, alpha: false, starterType: false, asIs: true, ability: 'unbothered', mark: 'just-a-bidoof' });
  const mon = [...run.party, ...run.box].find((m) => !before.has(m.uid) && m.speciesId === 'bidoof');
  if (mon) {
    mon.eventBoosts = { ...mon.eventBoosts, ...Object.fromEntries(STATS.map((s) => [s, (mon.eventBoosts?.[s] ?? 0) + JOINED])) };
    mon.hp = maxHp(content, mon);
  }
  return [words, 'It\'s a perfectly ordinary Bidoof.'].filter(Boolean).join(' ');
}

/** After the bow: no wild Bidoof or Bibarel attacks first for the rest of the run (it waits its first turn). */
export function bidoofPeace(run: RunState, waits: string): void {
  const b = run.battle;
  if (!b || b.kind !== 'wild' || f(run, 'bidoof-end') !== 2) return;
  const foe = b.enemyTeam[b.enemyIndex];
  if (!foe || (foe.speciesId !== 'bidoof' && foe.speciesId !== 'bibarel')) return;
  b.storyEffects.push(`${waits}The ${foe.speciesId === 'bidoof' ? 'Bidoof' : 'Bibarel'} looks at you for a long moment, and nods. It won't be the one to start this.`);
}

// Greenneedle gn.49, The Sleeping Snorlax (doc GREENNEEDLE_REWORKED_PLACED_11.md lines 8–85).
// A Snorlax asleep across the only road. Music, food or a fight wakes it, and how it wakes decides who it is.
// The fight: double HP, half asleep for three turns (Snore only), then properly. Heavy Sleeper is in battle/engine.ts.
import type { Content } from '../contentSchema';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { maxHp } from '../pokemon';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
const COOKED = ['sandwich', 'precooked-burger', 'packaged-curry'];
/** Your Pokémon, and the ones just met that you haven't said yes to yet (a join or a catch waits in `pending`). */
const everyone = (run: RunState): PokemonInstance[] => [...run.party, ...run.box, ...run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))];

/** The Poké Flute: in Kanto you need your own (Mr. Fuji's); elsewhere a hiker in the queue lends one. */
export const fluteReady = (run: RunState, region: string): boolean => region !== 'kanto' || (run.passives?.['poke-flute'] ?? 0) > 0;
const berriesHeld = (run: RunState): number => run.party.reduce((a, m) => a + Object.entries(m.held ?? {}).reduce((x, [id, n]) => x + (id.endsWith('-berry') ? n : 0), 0), 0);
/** Three Berries, or any cooked food. */
export const foodReady = (run: RunState): boolean => berriesHeld(run) >= 3 || COOKED.some((id) => (run.passives?.[id] ?? 0) > 0);

/** Sets food under its nose: three Berries (or one cooked food), or `n` more Berries (up to what you hold). */
export function snorlaxFeed(content: Content, run: RunState, n: number, first: boolean): string {
  if (first && berriesHeld(run) < 3) {
    const id = COOKED.find((c) => (run.passives?.[c] ?? 0) > 0);
    if (id) {
      run.passives = { ...run.passives, [id]: (run.passives?.[id] ?? 1) - 1 };
      set(run, 'snorlax-fed', 3);
      return `You set down the ${content.catalog.get(id)?.name ?? 'food'}.`;
    }
  }
  let fed = 0;
  for (const m of run.party) {
    for (const id of Object.keys(m.held ?? {}).sort()) {
      while (fed < n && id.endsWith('-berry') && (m.held![id] ?? 0) > 0) {
        m.held![id]! -= 1;
        if (m.held![id] === 0) delete m.held![id];
        fed += 1;
      }
    }
  }
  set(run, 'snorlax-fed', f(run, 'snorlax-fed') + fed);
  return fed > 0 ? `${fed} Berr${fed === 1 ? 'y' : 'ies'}, gone.` : 'You have nothing left to give it.';
}

/** A Snorlax that woke to your bag and joined: it's very fond of you (by how much it ate). */
export function snorlaxFond(content: Content, run: RunState): string {
  const mon = everyone(run).find((m) => m.speciesId === 'snorlax' && m.gn?.includes('snorlax-woke'));
  if (!mon) return '';
  mon.friendship = Math.min(content.balance.friendship.max, mon.friendship + 10 * f(run, 'snorlax-fed'));
  return '';
}

const MOVES = ['body-slam', 'rest', 'snore', 'heavy-slam'];
/** gn rule `snorlax`: double HP, Body Slam / Rest / Snore / Heavy Slam, and half asleep for the first three turns (Snore only). */
export function snorlaxStart(content: Content, battle: BattleState): void {
  const foe = battle.enemyTeam[battle.enemyIndex];
  if (!foe || foe.speciesId !== 'snorlax') return;
  foe.eventBoosts = { ...foe.eventBoosts, hp: (foe.eventBoosts?.hp ?? 0) + 100 };
  foe.hp = maxHp(content, foe);
  foe.moves = [{ id: 'snore', pp: content.moves.get('snore')?.pp ?? 15 }];
  foe.status = { id: 'slp', turns: 3 };
  battle.storyEffects.push('snorlax-dozing');
}
/** After the third turn it's properly awake. */
export function snorlaxTurn(content: Content, battle: BattleState, push: (text: string) => void): void {
  if (!battle.storyEffects.includes('snorlax-dozing')) return;
  // `turn` counts from 1 and has already moved on: after the third turn it reads 4.
  if (battle.turn <= 3) {
    // Half asleep: it stays asleep (so Snore works) until the third turn is over.
    const dozer = battle.enemyTeam.find((m) => m.speciesId === 'snorlax' && m.hp > 0);
    if (dozer && dozer.status?.id !== 'slp') dozer.status = { id: 'slp', turns: 3 };
    return;
  }
  battle.storyEffects = battle.storyEffects.filter((s) => s !== 'snorlax-dozing');
  const foe = battle.enemyTeam.find((m) => m.speciesId === 'snorlax');
  if (!foe || foe.hp <= 0) return;
  foe.moves = MOVES.filter((id) => content.moves.has(id)).map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  if (foe.status?.id === 'slp') foe.status = null;
  push('The Snorlax shakes its head, and opens both eyes. It\'s properly awake now. It isn\'t pleased.');
}
export const SNORLAX_MOVES = MOVES;

const joined = (run: RunState): boolean => everyone(run).some((m) => m.speciesId === 'snorlax' && m.gn?.includes('snorlax-woke'));
/** Woken by food and not asked along: it follows the smell of your bag for the rest of this stage. */
export function snorlaxFollow(run: RunState, stage: number): string {
  set(run, 'snorlax-following', stage);
  return '';
}
const following = (run: RunState, stage: number): boolean => f(run, 'snorlax-following') === stage && stage > 0 && !joined(run);
/** At each rest while it follows: one Berry's missing. */
export function snorlaxRest(run: RunState, stage: number): string {
  if (!following(run, stage)) return '';
  for (const m of run.party) {
    const id = Object.keys(m.held ?? {}).sort().find((k) => k.endsWith('-berry') && (m.held![k] ?? 0) > 0);
    if (!id) continue;
    m.held![id]! -= 1;
    if (m.held![id] === 0) delete m.held![id];
    return 'The Snorlax from the road is one step behind you, as ever. When you count your Berries, one is missing. It looks innocent.';
  }
  return 'The Snorlax from the road is one step behind you, as ever. It sniffs your bag, finds nothing, and sighs like a bellows.';
}
/** While it follows, each rest stop opens its scene beside the stop: it can still be asked to join, any time before the stage ends. */
export function snorlaxAsk(content: Content, run: RunState, stage: number): void {
  if (!following(run, stage) || !content.events.has('gn-49-follower')) return;
  const here = run.stage?.map.nodes.find((n) => n.id === run.stage!.current);
  if (!here || here.sides.some((s) => s.kind === 'event' && !s.used && s.eventId === 'gn-49-follower')) return;
  here.sides.push({ id: `gn-49-follower-${here.sides.length + 1}`, kind: 'event', used: false, eventId: 'gn-49-follower' });
}
/** It followed and wasn't asked to join: at the Gym door it sits down, and waves you in. Once. */
export function snorlaxGym(run: RunState, stage: number): string {
  const battle = run.battle;
  if (!battle?.trainer?.leaderId || !following(run, stage) || f(run, 'snorlax-gym-door') > 0) return '';
  set(run, 'snorlax-gym-door', 1);
  return 'At the Gym door, the Snorlax that followed you all this way sits down, heavily. It waves you in with one huge paw. It will be here when you come out.';
}
/** Caught after a fight: angry. Bond starts at 0, and rises at half speed for the rest of this region. */
export function snorlaxCaught(run: RunState): string {
  const mon = everyone(run).filter((m) => m.speciesId === 'snorlax' && !m.gn?.includes('snorlax-woke')).sort((a, b) => b.uid.localeCompare(a.uid, undefined, { numeric: true }))[0];
  if (!mon) return '';
  mon.friendship = 0;
  mon.gn = [...(mon.gn ?? []), 'snorlax-woke', 'snorlax-grudge'];
  return '';
}
/** A new region: the grudge is over (Bond rises at the normal speed again). */
export function snorlaxForgives(run: Pick<RunState, 'party' | 'box'>): void {
  for (const m of [...run.party, ...run.box]) if (m.gn?.includes('snorlax-grudge')) m.gn = m.gn.filter((t) => t !== 'snorlax-grudge');
}

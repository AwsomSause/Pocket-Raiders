// Greenneedle gn.53, The Region Under Siege (doc GREENNEEDLE_REWORKED_PLACED_11.md lines 371–470).
// A city, four districts, a clock of eight turns. Each turn the player is in one district doing one thing; allies the run has
// earned hold the others, slowly losing ground; nobody loses it fast. Reinforcements at turns 5 and 7 unless the Gate's held; the
// Rangers at 7 if the Hall is. The commander at 8. The result sets the region's next stage: celebration, repair or occupation.
import type { Content } from '../contentSchema';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { overhaulOf } from '../rivals/overhaul';
import { featuredRival } from '../rivals/living';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
export const DISTRICTS = ['market', 'homes', 'gate', 'hall'] as const;
export type DistrictId = (typeof DISTRICTS)[number];
export const DISTRICT_NAME: Record<DistrictId, string> = { market: 'the Market', homes: 'the Homes', gate: 'the Gate', hall: 'the Hall' };
/** Bars run 0 to 6; a district is held at 2 or more. */
export const BAR_START = 4;
export const BAR_MAX = 6;
export const HELD = 2;
export const TURNS = 8;
/** Who the city can call on (name, strength, district or '' while unassigned). */
export interface Ally { n: string; s: number; d: DistrictId | '' }
const ALLIES = 'sg:allies';
export const alliesOf = (run: Pick<RunState, 'story'>): Ally[] => {
  try {
    return JSON.parse(String(run.story.flags[ALLIES] ?? '[]')) as Ally[];
  } catch {
    return [];
  }
};
const saveAllies = (run: Pick<RunState, 'story'>, a: Ally[]): void => {
  run.story.flags[ALLIES] = JSON.stringify(a);
};
/** Gym Leaders take a district by their type. */
const BY_TYPE: Record<string, DistrictId> = {
  water: 'gate', ice: 'gate', flying: 'gate', dragon: 'gate',
  electric: 'hall', steel: 'hall', psychic: 'hall', ghost: 'hall',
  grass: 'market', normal: 'market', bug: 'market', poison: 'market', fairy: 'market',
  fire: 'homes', fighting: 'homes', rock: 'homes', ground: 'homes', dark: 'homes',
};
/** People from finished events, and the flag that says their event ended well. */
const FRIENDS: [string, string][] = [
  ['Damian', 'damian-visit-done'], ['The Squirtle Squad', 'squad-done'], ['The Samurai', 'kanto-forest-samurai-won'],
  ['The Frontier\'s Brains', 'frontier-symbols'], ['The Day-Care\'s Old Dog', 'daycare-visits'],
];
export const bar = (run: Pick<RunState, 'story'>, d: DistrictId): number => f(run, `sg-bar-${d}`);
export const held = (run: Pick<RunState, 'story'>, d: DistrictId): boolean => bar(run, d) >= HELD;
const strength = (run: Pick<RunState, 'story'>, d: DistrictId): number => alliesOf(run).filter((a) => a.d === d).reduce((x, a) => x + a.s, 0);

/** Turn 1, the alarm: everyone the run's history has earned is called. Gym Leaders take their districts; the rest wait for orders. */
export function sgStart(content: Content, run: RunState): string {
  for (const k of Object.keys(run.story.flags)) if (k.startsWith('ev:sg-')) delete run.story.flags[k];
  const allies: Ally[] = [];
  const rival = featuredRival(run);
  if (rival && (overhaulOf(run, rival.id)?.feelings.trust ?? 0) >= 2) allies.push({ n: rival.name, s: 2, d: '' });
  const gyms = new Set((run.roleCast ?? []).filter((c) => c.role === 'gym' && c.regionIndex === run.regionIndex).map((c) => c.id));
  for (const id of run.badges ?? []) {
    const b = content.bosses.get(id);
    if (!b || !gyms.has(id)) continue;
    allies.push({ n: b.name, s: 2, d: BY_TYPE[b.types[0] ?? ''] ?? 'market' });
  }
  for (const [n, flag] of FRIENDS) if (f(run, flag) > 0) allies.push({ n, s: 1, d: '' });
  if (f(run, 'defector-files') >= 2 && f(run, 'defector-at') === run.regionIndex + 1) allies.push({ n: 'The fourteen ex-Grunts', s: 2, d: '' });
  // Reputation brought down to 0 or below (Fear): fewer come, and they don't take orders (they pick a district themselves).
  const feared = f(run, 'rep-lost') > 0 && f(run, 'rep') - f(run, 'rep-lost') <= 0;
  const called = feared ? allies.filter((a, i) => a.d !== '' || i % 2 === 0) : allies;
  if (feared) called.forEach((a, i) => { if (a.d === '') a.d = DISTRICTS[(i + run.regionIndex) % DISTRICTS.length]!; });
  saveAllies(run, called);
  for (const d of DISTRICTS) set(run, `sg-bar-${d}`, BAR_START);
  set(run, 'sg-turn', 1);
  set(run, 'sg-orders', feared ? 0 : 1);
  return '';
}

/** The next ally waiting for orders (by index), or -1. */
export const waiting = (run: Pick<RunState, 'story'>): number => alliesOf(run).findIndex((a) => a.d === '');
/** Sends the next waiting ally to district `n` (0 market, 1 homes, 2 gate, 3 hall). */
export function sgAssign(run: RunState, n: number): string {
  const a = alliesOf(run);
  const i = a.findIndex((x) => x.d === '');
  if (i < 0) return '';
  a[i]!.d = DISTRICTS[n] ?? 'market';
  saveAllies(run, a);
  return '';
}

/**
 * One action in district `d` this turn. `what`: 1 fight won, 2 fight lost, 3 rescue, 4 repair, 5 the Homes choice (turn 6).
 * Then the turn ends: the other districts lose ground (slowly with allies, fast with nobody), reinforcements and Rangers come.
 */
export function sgAct(run: RunState, d: DistrictId, what: number): string {
  const turn = f(run, 'sg-turn');
  if (turn < 1 || turn >= TURNS) return '';
  const words: string[] = [];
  if (what === 1) set(run, `sg-bar-${d}`, Math.min(BAR_MAX, bar(run, d) + 2));
  if (what === 4) set(run, `sg-hold-${d}`, turn + 1);
  for (const o of DISTRICTS) {
    if (o === d || f(run, `sg-hold-${o}`) === turn) continue;
    const s = strength(run, o);
    const loss = s === 0 ? 1 : s >= 3 ? (turn % 3 === 0 ? 1 : 0) : turn % 2 === 0 ? 1 : 0;
    if (loss > 0) set(run, `sg-bar-${o}`, Math.max(0, bar(run, o) - loss));
  }
  const next = turn + 1;
  if ((next === 5 || next === 7) && !held(run, 'gate')) {
    set(run, 'sg-reinforced', f(run, 'sg-reinforced') + 1);
    for (const o of DISTRICTS) set(run, `sg-bar-${o}`, Math.max(0, bar(run, o) - 1));
    words.push('Lorries at the Gate. Reinforcements pour into the city, and every district gives a little ground.');
  }
  if (next === 7 && held(run, 'hall') && f(run, 'sg-rangers') === 0) {
    set(run, 'sg-rangers', 1);
    for (const o of DISTRICTS) set(run, `sg-bar-${o}`, Math.min(BAR_MAX, bar(run, o) + 1));
    words.push('The radio mast holds. The Rangers arrive, in a line of jeeps down the hill.');
  }
  set(run, 'sg-turn', next);
  return words.join(' ');
}

/** The rescue in a district: its civilian first (Market: the shopkeeper; Homes: the child; Hall: your rival's mum), then the Gate's trapped Pokémon. */
export function sgRescue(run: RunState, d: DistrictId, float: () => number): string {
  if (d === 'gate') {
    if (f(run, 'sg-pokemon') === 0) {
      set(run, 'sg-pokemon', 1);
      const pool = ['growlithe', 'eevee', 'pikachu', 'vulpix', 'ponyta', 'houndour', 'snubbull', 'skitty'];
      const sp = pool[Math.floor(float() * pool.length)]!;
      for (const k of Object.keys(run.story.flags)) if (k.startsWith('ev:cast-sg-pokemon:')) delete run.story.flags[k];
      run.story.flags[`ev:cast-sg-pokemon:${sp}`] = 1;
    }
  } else set(run, `sg-civ-${d}`, 1);
  return sgAct(run, d, 3);
}

/** Turn 6: the school, the hospital (1 or 2), or both with half the team each (3: set by the two battles). */
export function sgHomes(run: RunState, which: number): string {
  if (which === 1 || which === 3) set(run, 'sg-school', 1);
  if (which === 2 || which === 3) set(run, 'sg-hospital', 1);
  return '';
}
const SPLIT = 'sg-split';
/** Splitting the team: half `n` (1 the first half, 2 the rest) fights; the other half waits. */
export function sgHalf(run: RunState, n: number): string {
  sgWhole(run);
  const cut = Math.ceil(run.party.length / 2);
  const keep = n === 1 ? run.party.slice(0, cut) : run.party.slice(cut);
  if (keep.length === 0) return '';
  const away = run.party.filter((m) => !keep.includes(m));
  for (const m of away) m.gn = [...(m.gn ?? []), SPLIT];
  run.party = keep;
  run.box = [...away, ...run.box];
  return '';
}
export function sgWhole(run: RunState): string {
  const back = run.box.filter((m) => m.gn?.includes(SPLIT));
  if (back.length === 0) return '';
  for (const m of back) m.gn = (m.gn ?? []).filter((t) => t !== SPLIT);
  run.box = run.box.filter((m) => !back.includes(m));
  const order = (m: PokemonInstance): number => Number(m.uid.replace(/\D+/g, '')) || 0;
  run.party = [...run.party, ...back].sort((a, b) => order(a) - order(b)).slice(0, 6);
  return '';
}

/** gn rule `siege-commander`: four Pokémon (tired) if no reinforcements came, five or six if they did; Hall allies hold one turn each. */
export function sgCommanderStart(run: RunState, battle: BattleState, waits: string): void {
  const size = 4 + Math.min(2, f(run, 'sg-reinforced'));
  battle.enemyTeam = battle.enemyTeam.slice(0, size);
  if (f(run, 'sg-reinforced') === 0) for (const m of battle.enemyTeam) m.hp = Math.max(1, Math.floor(m.hp * 0.75));
  for (const a of alliesOf(run).filter((x) => x.d === 'hall' && held(run, 'hall')).slice(0, 3)) battle.storyEffects.push(`${waits}${a.n} steps in from the Hall's doors and holds the commander's Pokémon back for a turn.`);
}

/** The end: districts held and the commander decide the region's next stage (1 celebration, 2 repair, 3 occupation). */
export function sgEnd(content: Content, run: RunState, beaten: number, stage: number): string {
  const n = DISTRICTS.filter((d) => held(run, d)).length;
  const fainted = run.party.filter((m) => m.hp <= 0).length;
  const heavy = fainted * 2 >= run.party.length;
  const result = !beaten || n <= 1 ? 3 : n >= 3 && !heavy ? 1 : 2;
  set(run, 'sg-held', n);
  set(run, 'sg-result', result);
  set(run, 'sg-next', stage + 1);
  set(run, 'sg-turn', TURNS + 1);
  for (const d of DISTRICTS) if (!held(run, d)) set(run, `sg-lost-${d}`, 1);
  if (n < DISTRICTS.length) set(run, 'sg-fell', 1);
  // Civilians not reached are missing from later scenes (their chair at the Long Table is empty).
  for (const d of ['market', 'homes', 'hall'] as const) if (f(run, `sg-civ-${d}`) === 0) set(run, `siege-missing-${d}`, 1);
  const names = alliesOf(run).filter((a) => a.d !== '' && held(run, a.d)).map((a) => a.n);
  run.story.flags['sg:plaque'] = names.join(', ');
  void content;
  return '';
}
const mode = (run: Pick<RunState, 'story'>, stage: number): number => (f(run, 'sg-next') === stage ? f(run, 'sg-result') : 0);
/** The next stage's shops: half price in celebration, shut under occupation or with the Market fallen (null = shut). */
export const sgPriceFactor = (run: Pick<RunState, 'story'>, stage: number): number | null => {
  const m = mode(run, stage);
  if (m === 3 || (m > 0 && f(run, 'sg-lost-market') > 0)) return null;
  return m === 1 ? 0.5 : 1;
};
export const SHOP_SHUT = 'The shops are shuttered. Through a gap, a hand passes you a bread roll, and the shutter comes down again.';
/** The Market fell: there's no Center in this city for the next stage. */
export const sgCenterShut = (run: Pick<RunState, 'story'>, stage: number): boolean => mode(run, stage) > 0 && f(run, 'sg-lost-market') > 0;
export const CENTER_SHUT = 'Where the Pokémon Center was, there\'s a shell, and a sign in chalk: GONE TO THE NEXT TOWN.';
/** The next stage's Centers: a city in repair heals half. */
export const sgHealShare = (run: Pick<RunState, 'story'>, stage: number): number => (mode(run, stage) === 2 ? 0.5 : 1);
/** A line for the next stage's Center. */
export function sgCenterLine(run: Pick<RunState, 'story'>, stage: number): string {
  const m = mode(run, stage);
  if (m === 1) return 'The Center\'s free, and so is everything else: the nurse knows your name, and so does the queue.';
  if (m === 2) return 'The Center\'s in a tent. The nurse is tired and kind, and some of the machines are missing.';
  if (m === 3) return 'A patrol walks past the Center\'s door. Through a shutter, someone passes you a bread roll, and doesn\'t say a word.';
  return '';
}

/** The rescued Pokémon waits at the next rest stop: its scene opens beside the stop, once. */
export function sgRest(content: Content, run: RunState): void {
  if (f(run, 'sg-pokemon') !== 1 || f(run, 'sg-turn') <= TURNS || !content.events.has('gn-53-waiting')) return;
  const here = run.stage?.map.nodes.find((n) => n.id === run.stage!.current);
  if (!here || here.sides.some((s) => s.kind === 'event' && s.eventId === 'gn-53-waiting')) return;
  set(run, 'sg-pokemon', 2);
  here.sides.push({ id: `gn-53-waiting-${here.sides.length + 1}`, kind: 'event', used: false, eventId: 'gn-53-waiting' });
}
/** It comes with you, by its own choice. */
export function sgJoin(run: RunState, host: { apply: (e: unknown) => string }): string {
  const hit = Object.keys(run.story.flags).find((k) => k.startsWith('ev:cast-sg-pokemon:'));
  if (!hit || f(run, 'sg-pokemon') >= 3) return '';
  set(run, 'sg-pokemon', 3);
  return host.apply({ kind: 'join', recall: false, species: [hit.slice('ev:cast-sg-pokemon:'.length)], types: [], levelBonus: 0, shinyMultiplier: 1, shadow: false, blissful: false, hiddenAbility: false, moves: [], direct: true, alpha: false, starterType: false, asIs: true, mark: 'siege-rescued' });
}

/** Tokens: {siege:turn}, {siege:bars}, {siege:ally} (the next one waiting for orders), {siege:allies}, {siege:plaque}, {siege:held}. */
export function siegeTokens(content: Content, run: RunState, text: string): string {
  const bars = DISTRICTS.map((d) => {
    const b = bar(run, d);
    const who = alliesOf(run).filter((a) => a.d === d).map((a) => a.n).join(', ');
    return `${DISTRICT_NAME[d].replace('the ', 'The ')}: ${'▮'.repeat(b)}${'▯'.repeat(BAR_MAX - b)}${who ? ` (held by ${who})` : ' (nobody)'}`;
  }).join('\n\n');
  const next = alliesOf(run)[waiting(run)];
  void content;
  return text
    .replaceAll('{siege:turn}', String(Math.min(TURNS, f(run, 'sg-turn'))))
    .replaceAll('{siege:bars}', bars)
    .replaceAll('{siege:ally}', next ? `${next.n} (strength ${next.s})` : 'nobody')
    .replaceAll('{siege:allies}', alliesOf(run).map((a) => a.n).join(', ') || 'nobody')
    .replaceAll('{siege:plaque}', String(run.story.flags['sg:plaque'] ?? '') || 'nobody, in the end')
    .replaceAll('{siege:held}', String(f(run, 'sg-held')));
}

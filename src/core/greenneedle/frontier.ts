// Greenneedle gn.42, the Battle Frontier: seven buildings, seven Brains, and a rank (the run's; nothing carries between runs).
//  - Palace (battle rule `palace`): your Pokémon choose their own moves, by nature. Bold, brave, adamant attack, even when they shouldn't;
//    timid, careful, calm protect and use status first; jolly, hasty, naive use whatever's fastest; quirky, hardy, serious use something
//    different every turn; the rest pick sensibly. Bond 4 or more: it picks well (your pick), and glances at you first, except one turn in four.
//  - Arena (battle rule `arena`, with `surviveTurns: 3`): after three turns the judges decide, on damage dealt, hits landed and accuracy.
//  - Brains (battle rule `brain`): a Brain who has met you brings one Pokémon to answer the ace you brought last time; at Platinum they've
//    prepared for you anyway. gn op `brainRecord` (`key` the building, `n` 1 won / 2 lost) remembers the ace and the result.
//  - Factory: gn op `swapIn` (the picked Pokémon, `species`) trades a rental for the loser's. Dome: gn ops `bench` / `unbench` keep the three
//    you bring. Pyramid: gn ops `bagLeave` / `bagBack` leave the bag at the door (held in `itemCounters`, `pyramid-bag:<id>`).
import type { Content, TypeName } from '../contentSchema';
import type { PlayerAction } from '../battle/engine';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { BOND_RULES } from '../bond/schema';
import { heldPick } from '../bossGear';

export const BUILDINGS = ['tower', 'factory', 'arena', 'pike', 'dome', 'palace', 'pyramid'] as const;
export type Building = (typeof BUILDINGS)[number];

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = Math.max(0, n);
};

/** Rank by buildings cleared this run: 1 Bronze (0-2), 2 Silver (3-6), 3 Gold (7-13), 4 Platinum (14+). */
export const rankOf = (cleared: number): number => (cleared >= 14 ? 4 : cleared >= 7 ? 3 : cleared >= 3 ? 2 : 1);
/** A building cleared: the count, the rank, and the Frontier points. */
export function frontierClear(run: RunState, b: string, points: number): string {
  set(run, 'frontier-cleared', f(run, 'frontier-cleared') + 1);
  set(run, `frontier-cleared-${b}`, f(run, `frontier-cleared-${b}`) + 1);
  const before = f(run, 'frontier-rank') || 1;
  const rank = rankOf(f(run, 'frontier-cleared'));
  set(run, 'frontier-rank', rank);
  set(run, 'frontier-points', f(run, 'frontier-points') + points);
  const up = rank > before ? ` Your rank rises: ${['Bronze', 'Silver', 'Gold', 'Platinum'][rank - 1]}.` : '';
  return `+${points} Frontier points.${up}`;
}

// ---------- The Palace ----------
const ATTACK = ['bold', 'brave', 'adamant'];
const SUPPORT = ['timid', 'careful', 'calm'];
const FAST = ['jolly', 'hasty', 'naive'];
const FICKLE = ['quirky', 'hardy', 'serious'];
export type PalaceStyle = 'attack' | 'support' | 'fast' | 'fickle' | 'sensible';
export const palaceStyleOf = (nature: string | undefined): PalaceStyle =>
  ATTACK.includes(nature ?? '') ? 'attack' : SUPPORT.includes(nature ?? '') ? 'support' : FAST.includes(nature ?? '') ? 'fast' : FICKLE.includes(nature ?? '') ? 'fickle' : 'sensible';

/** The move it chooses for itself (a move index), or -1 when it has nothing to use. */
export function palaceMove(content: Content, mon: PokemonInstance, foe: PokemonInstance | undefined, turn: number, effectiveness: (type: string) => number): number {
  const usable = mon.moves.map((m, i) => ({ i, def: content.moves.get(m.id), pp: m.pp })).filter((m) => m.def && m.pp > 0);
  if (usable.length === 0) return -1;
  const power = (m: (typeof usable)[number]): number => (m.def!.category === 'status' ? 0 : m.def!.power ?? 0);
  const strongest = (scored: (m: (typeof usable)[number]) => number): number => usable.reduce((a, b) => (scored(b) > scored(a) ? b : a)).i;
  const style = palaceStyleOf(mon.nature);
  if (style === 'attack') return strongest(power);
  if (style === 'support') {
    const protect = usable.find((m) => m.def!.effects.protect !== undefined);
    if (protect && turn % 2 === 1) return protect.i;
    const status = usable.find((m) => m.def!.category === 'status' && m.def!.effects.protect === undefined);
    return status ? status.i : strongest(power);
  }
  if (style === 'fast') return strongest((m) => (m.def!.priority ?? 0) * 1000 + power(m));
  if (style === 'fickle') return usable[((turn % usable.length) + usable.length) % usable.length]!.i;
  return foe ? strongest((m) => power(m) * effectiveness(m.def!.type)) : strongest(power);
}

/** Bond 4 or more: friendship at 4 Bond levels. */
const bondFour = (content: Content, mon: PokemonInstance): boolean => Math.floor(mon.friendship / content.balance.co.bondLevelStep) >= 4;

/** The Palace's rule on your action: a move order becomes the Pokémon's own choice. Switching stays yours. Returns the line to show. */
export function palaceShape(content: Content, run: RunState, battle: BattleState, action: PlayerAction, effectiveness: (type: string) => number, initiative: boolean): { action: PlayerAction; line: string | null } {
  if (action.kind !== 'move') return { action, line: null };
  const mon = run.party[battle.activeIndex];
  if (!mon) return { action, line: null };
  const name = content.species.get(mon.speciesId)?.name ?? mon.speciesId;
  if ((bondFour(content, mon) || (initiative && battle.activeIndex === 0)) && battle.turn % 4 !== 0) return { action, line: battle.turn % 4 === 1 ? `${name} glances at you first. Then it picks well.` : null };
  const index = palaceMove(content, mon, battle.enemyTeam[battle.enemyIndex], battle.turn, effectiveness);
  if (index < 0 || index === action.index) return { action, line: null };
  const move = content.moves.get(mon.moves[index]!.id)?.name ?? 'something else';
  return { action: { ...action, index }, line: `${name} chooses for itself: ${move}.` };
}

// ---------- The Arena ----------
/** Tallies one turn for each side: damage dealt (share of the target's HP), hits landed, moves used, misses. */
export interface ArenaTally { dmg: number; hits: number; moves: number; misses: number }
const TALLY = 'arena:';
const parse = (battle: BattleState, side: 'player' | 'enemy'): ArenaTally => {
  const tag = battle.storyEffects.find((s) => s.startsWith(`${TALLY}${side}:`));
  const [dmg, hits, moves, misses] = (tag?.split(':').slice(2) ?? ['0', '0', '0', '0']).map(Number);
  return { dmg: dmg ?? 0, hits: hits ?? 0, moves: moves ?? 0, misses: misses ?? 0 };
};
export function arenaTurn(battle: BattleState, events: readonly { type: string; side?: string; amount?: number }[], maxOf: (side: 'player' | 'enemy') => number): void {
  for (const side of ['player', 'enemy'] as const) {
    const other = side === 'player' ? 'enemy' : 'player';
    const t = parse(battle, side);
    for (const e of events) {
      if (e.type === 'move' && e.side === side) t.moves += 1;
      if (e.type === 'miss' && e.side === side) t.misses += 1;
      if (e.type === 'damage' && e.side === other && (e.amount ?? 0) > 0) {
        t.hits += 1;
        t.dmg += Math.round((100 * (e.amount ?? 0)) / Math.max(1, maxOf(other)));
      }
    }
    battle.storyEffects = [...battle.storyEffects.filter((s) => !s.startsWith(`${TALLY}${side}:`)), `${TALLY}${side}:${t.dmg}:${t.hits}:${t.moves}:${t.misses}`];
  }
}
/** The judges' marks out of ten, for one side: damage, hits, accuracy. */
export function arenaMarks(battle: BattleState, side: 'player' | 'enemy'): { damage: number; hits: number; accuracy: number; total: number } {
  const t = parse(battle, side);
  const damage = Math.min(10, Math.round(t.dmg / 15));
  const hits = Math.min(10, t.hits * 3);
  const accuracy = t.moves === 0 ? 0 : Math.round((10 * (t.moves - t.misses)) / t.moves);
  return { damage, hits, accuracy, total: damage + hits + accuracy };
}
/** After the third turn: the judges' decision (a tie goes to the challenger). */
export function arenaVerdict(battle: BattleState): { outcome: 'win' | 'lose'; line: string } {
  const p = arenaMarks(battle, 'player');
  const e = arenaMarks(battle, 'enemy');
  const win = p.total >= e.total;
  return { outcome: win ? 'win' : 'lose', line: `The judges confer. Damage ${p.damage}, hits ${p.hits}, accuracy ${p.accuracy}: ${p.total} out of thirty, against ${e.total}. ${win ? 'The decision is yours.' : 'The decision goes against you.'}` };
}

// ---------- The Brains ----------
/** One Pokémon to answer an ace of each type. */
export const ANSWER: Record<string, string> = {
  normal: 'lucario', fire: 'gyarados', water: 'jolteon', electric: 'garchomp', grass: 'arcanine', ice: 'metagross', fighting: 'alakazam', poison: 'mamoswine', ground: 'starmie',
  flying: 'magnezone', psychic: 'tyranitar', bug: 'talonflame', rock: 'swampert', ghost: 'houndoom', dragon: 'togekiss', dark: 'conkeldurr', steel: 'infernape', fairy: 'scizor',
};
/** The ace: the strongest Pokémon in the party (highest level, then the first). */
export const aceOf = (run: Pick<RunState, 'party'>): PokemonInstance | undefined => run.party.reduce<PokemonInstance | undefined>((a, m) => (!a || m.level > a.level ? m : a), undefined);

/** After a Brain's battle: the ace you brought (cast as `brain-ace-<b>`) and whether you won. */
export function brainRecord(run: RunState, b: string, result: number): string {
  const ace = aceOf(run);
  for (const k of Object.keys(run.story.flags)) if (k.startsWith(`ev:cast-brain-ace-${b}:`)) delete run.story.flags[k];
  if (ace) run.story.flags[`ev:cast-brain-ace-${b}:${ace.speciesId}`] = 1;
  // The last team, by species (the Brain names it next time).
  for (const k of Object.keys(run.story.flags)) if (k.startsWith(`ev:brain-team-${b}:`)) delete run.story.flags[k];
  run.party.forEach((m, i) => {
    run.story.flags[`ev:brain-team-${b}:${i}:${m.speciesId}`] = 1;
  });
  set(run, `brain-${b}-met`, 1);
  set(run, `brain-${b}-won`, result);
  // The Arena's judge remembers the marks she gave you (out of thirty), to quote them next time.
  if (b === 'arena' && run.battle?.storyEffects.some((s) => s.startsWith(`${TALLY}player:`))) set(run, 'brain-arena-marks', arenaMarks(run.battle, 'player').total);
  return '';
}
/** The team you brought to this Brain last time, by species, in the order you brought it. */
export const lastTeam = (run: Pick<RunState, 'story'>, b: string): string[] =>
  Object.keys(run.story.flags).filter((k) => k.startsWith(`ev:brain-team-${b}:`)).map((k) => k.slice(`ev:brain-team-${b}:`.length).split(':')).sort((x, y) => Number(x[0]) - Number(y[0])).map((x) => x[1]!);
/** Text token `{brainteam:<building>}`: "the Arcanine, the Lapras and the Gengar". */
export function lastTeamToken(content: Content, run: Pick<RunState, 'story'>, b: string): string {
  const names = lastTeam(run, b).map((id) => `the ${content.species.get(id)?.name ?? id}`);
  if (names.length === 0) return 'your team';
  return names.length === 1 ? names[0]! : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
/** Whether last time's ace is in the party now (the Brain's answer has something to answer). */
export const aceHere = (run: Pick<RunState, 'story' | 'party'>, b: string): boolean => {
  const k = Object.keys(run.story.flags).find((x) => x.startsWith(`ev:cast-brain-ace-${b}:`));
  return !!k && run.party.some((m) => m.speciesId === k.slice(`ev:cast-brain-ace-${b}:`.length));
};

/** At a Brain's battle: their last Pokémon becomes the answer to your old ace (or, at Platinum, to your ace now). */
export function brainStart(content: Content, run: RunState, battle: BattleState, b: string, make: (speciesId: string, level: number, uid: string) => PokemonInstance): void {
  const k = Object.keys(run.story.flags).find((x) => x.startsWith(`ev:cast-brain-ace-${b}:`));
  const old = k ? k.slice(`ev:cast-brain-ace-${b}:`.length) : undefined;
  const target = old ?? (f(run, 'frontier-rank') >= 4 ? aceOf(run)?.speciesId : undefined);
  const type = target ? (content.species.get(target)?.types[0] as TypeName | undefined) : undefined;
  const answer = type ? ANSWER[type] : undefined;
  const last = battle.enemyTeam[battle.enemyTeam.length - 1];
  if (answer && last && content.species.has(answer) && !battle.enemyTeam.some((m) => m.speciesId === answer)) battle.enemyTeam[battle.enemyTeam.length - 1] = make(answer, last.level, last.uid);
  // Gold and above: held items that fit.
  if (f(run, 'frontier-rank') >= 3) {
    battle.enemyTeam.forEach((m, i) => {
      const id = heldPick(content, { speciesId: m.speciesId, level: m.level, moves: m.moves.map((x) => x.id) }, i === 0, i === battle.enemyTeam.length - 1);
      if (id && content.catalog.has(id)) m.held = { ...(m.held ?? {}), [id]: 1 };
    });
  }
}

/** SF161: the lead is one that takes the initiative (its bond meets the Takes Initiative bar). Read only: no bond is created. */
export function leadInitiative(run: Pick<RunState, 'story' | 'party'>): boolean {
  const lead = run.party.find((m) => m.hp > 0);
  const bond = lead ? run.story.histories[lead.uid]?.bond : undefined;
  return !!bond && bond.synchronization >= BOND_RULES.initiative.minSynchronization && bond.trust >= BOND_RULES.initiative.minTrust;
}

// ---------- Factory, Dome, Pyramid ----------
export const BENCH = 'frontier-benched';
export const BRING = 'dome-bring';
/** Dome: the Pokémon not marked to bring go to the bench (the box) for the match. */
export function bench(run: RunState): string {
  const keep = run.party.filter((m) => m.gn?.includes(BRING));
  if (keep.length === 0) return '';
  const benched = run.party.filter((m) => !m.gn?.includes(BRING));
  for (const m of benched) m.gn = [...(m.gn ?? []), BENCH];
  run.party = keep;
  run.box = [...run.box, ...benched];
  return '';
}
export function unbench(run: RunState): string {
  const back = run.box.filter((m) => m.gn?.includes(BENCH));
  for (const m of [...run.party, ...back]) m.gn = (m.gn ?? []).filter((t) => t !== BENCH && t !== BRING);
  set(run, 'dome-picked', 0);
  const all = [...run.party, ...back];
  run.box = [...run.box.filter((m) => !back.includes(m)), ...all.slice(6)];
  run.party = all.slice(0, 6);
  return '';
}
/** Factory: the picked rental is traded for the loser's (same level). */
export function swapIn(content: Content, run: RunState, uid: string | undefined, species: string, make: (speciesId: string, level: number, uid: string) => PokemonInstance): string {
  const i = run.party.findIndex((m) => m.uid === uid);
  if (i < 0 || !content.species.has(species)) return '';
  const old = run.party[i]!;
  const mon = make(species, old.level, old.uid);
  mon.gn = [...(old.gn ?? [])];
  run.party[i] = mon;
  return `${content.species.get(old.speciesId)?.name ?? old.speciesId} goes back to the rack. ${content.species.get(species)?.name ?? species} is yours for now.`;
}
/** Factory: a rental joins the (stashed-away) team, at the level of the team you left at the door. Marked, so nothing keeps it after. */
export const RENTAL = 'frontier-rental';
export function rent(content: Content, run: RunState, species: string, level: number, make: (speciesId: string, level: number, uid: string) => PokemonInstance): string {
  if (!content.species.has(species) || run.party.length >= 3) return '';
  const mon = make(species, Math.max(1, level), `p${run.nextUid}`);
  run.nextUid += 1;
  mon.gn = [RENTAL];
  run.party = [...run.party, mon];
  return `${content.species.get(species)?.name ?? species}, from the rack.`;
}
/** Dome: the picked Pokémon will be brought to the next match. */
export function bring(content: Content, run: RunState, uid: string | undefined): string {
  const mon = run.party.find((m) => m.uid === uid);
  if (!mon || mon.gn?.includes(BRING) || run.party.filter((m) => m.gn?.includes(BRING)).length >= 3) return '';
  mon.gn = [...(mon.gn ?? []), BRING];
  set(run, 'dome-picked', run.party.filter((m) => m.gn?.includes(BRING)).length);
  return `${content.species.get(mon.speciesId)?.name ?? mon.speciesId} will go in.`;
}
/** Pyramid: the bag stays at the door. */
export function bagLeave(run: RunState): string {
  const counters = { ...run.itemCounters };
  for (const [id, n] of Object.entries(run.inventory)) if (n > 0) counters[`pyramid-bag:${id}`] = (counters[`pyramid-bag:${id}`] ?? 0) + n;
  run.itemCounters = counters;
  run.inventory = {};
  return 'You leave your bag at the door.';
}
export function bagBack(run: RunState): string {
  const counters = { ...run.itemCounters };
  for (const [k, n] of Object.entries(counters)) {
    if (!k.startsWith('pyramid-bag:')) continue;
    const id = k.slice('pyramid-bag:'.length);
    run.inventory[id] = (run.inventory[id] ?? 0) + n;
    delete counters[k];
  }
  run.itemCounters = counters;
  return 'Your bag is where you left it.';
}

// Greenneedle gn.new.06, The Duelist (doc GREENNEEDLE_PLACED_1.md lines 228–269).
// The first critical hit a party Pokémon lands marks it as "the chosen one". A Farfetch'd then asks it for up to five duels, one on one,
// one a stage, at exactly the chosen one's level (+1 after each of its losses, and an answer to the move that beat it).
//  - `duelistMark` (run.ts finishBattle): the first critical hit, from the second stage on, starts the series (once a run).
//  - gn tests `duelDue` (`n` the duel, 1-5): this duel is next, its stage has come, and the chosen one can stand; `duelistLeft`.
//  - gn ops `duelEnter` (the chosen one alone, the rest on the bench), `duelWin` / `duelLoss` (`n` the duel; `duelEnd` is the same bookkeeping),
//    `duelWorthy` (the chosen one gains Worthy Opponent), `duelLeave` (the Duelist went; it will be in the crowd).
//  - Battle rule `duelist`: the Duelist at the chosen one's level plus its losses, with its answers.
//  - Worthy Opponent (a mark on the chosen one; rule in worthy.ts): +1 to its highest stat on entry when the foe's active Pokémon is at full HP.
//  - The afterstory (`duelAfterstory`, run.ts beginBattle): the first Champion fight after the Duelist left, a Sirfetch'd in the crowd.
import type { Content } from '../contentSchema';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { fnv1a } from '../expansion/hash';
import { WORTHY, worthyStat } from './worthy';
import { BRING, bench, unbench } from './frontier';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = Math.max(0, n);
};
const cast = (run: RunState, name: string, id: string): void => {
  for (const k of Object.keys(run.story.flags)) if (k.startsWith(`ev:cast-${name}:`)) delete run.story.flags[k];
  if (id) run.story.flags[`ev:cast-${name}:${id}`] = 1;
};
const castOf = (run: Pick<RunState, 'story'>, name: string): string | undefined =>
  Object.keys(run.story.flags).find((k) => k.startsWith(`ev:cast-${name}:`))?.slice(`ev:cast-${name}:`.length);

export const CHOSEN = 'duel-chosen';
export { WORTHY } from './worthy';
/** The first stage (absolute) a series may start in ("A2"). */
const EARLIEST = 2;
const DUELS = 5;
const NEEDED = 3;

export const chosenOf = (run: Pick<RunState, 'party' | 'box'>): PokemonInstance | undefined => [...run.party, ...run.box].find((m) => m.gn?.includes(CHOSEN));
const nameOf = (content: Content, mon: PokemonInstance): string => mon.care?.nickname || (content.species.get(mon.speciesId)?.name ?? mon.speciesId);

/** After a battle: the first critical hit a party Pokémon landed (from the second stage on) marks the chosen one. Returns whether it started. */
export function duelistMark(content: Content, run: RunState, stage: number): boolean {
  const uid = run.battle?.critBy;
  if (!uid || f(run, 'duelist-at') > 0 || stage < EARLIEST) return false;
  const mon = run.party.find((m) => m.uid === uid);
  if (!mon) return false;
  mon.gn = [...(mon.gn ?? []), CHOSEN];
  set(run, 'duelist-at', stage);
  set(run, 'duelist-region', run.regionIndex + 1);
  void content;
  return true;
}

/** Duel `n` is the next one: the series is on in this region, the stage has come, and the chosen one is standing in the party. */
export function duelDue(run: RunState, n: number, stage: number): boolean {
  const at = f(run, 'duelist-at');
  if (at <= 0 || f(run, 'duelist-over') > 0 || f(run, 'duelist-region') !== run.regionIndex + 1) return false;
  if (f(run, 'duelist-duels') !== n - 1 || stage < at + (n - 1)) return false;
  return run.party.some((m) => m.gn?.includes(CHOSEN) && m.hp > 0);
}

/** The chosen one is in the party and standing: accepting needs it (gn test `duelReady`). */
export function duelReady(run: RunState): boolean {
  return run.party.some((m) => m.gn?.includes(CHOSEN) && m.hp > 0);
}

/** The chosen one goes in alone; the rest wait on the bench. */
export function duelEnter(run: RunState): string {
  const mon = run.party.find((m) => m.gn?.includes(CHOSEN));
  if (!mon) return '';
  for (const m of run.party) m.gn = (m.gn ?? []).filter((t) => t !== BRING);
  mon.gn = [...(mon.gn ?? []), BRING];
  bench(run);
  return '';
}

/** A duel is over: the bench comes back, and the count moves. `won` is whether the chosen one won. Three wins either way ends it. */
export function duelEnd(run: RunState, n: number, won: boolean, stage: number): string {
  unbench(run);
  const hit = run.battle?.lastHit;
  set(run, 'duelist-duels', Math.max(f(run, 'duelist-duels'), n));
  set(run, 'duelist-late', 0);
  set(run, 'duelist-last', stage);
  if (won) {
    set(run, 'duelist-wins', f(run, 'duelist-wins') + 1);
    // What beat the Duelist: its next answer is to this move.
    cast(run, `duel-hit-${f(run, 'duelist-wins')}`, hit ?? '');
  } else set(run, 'duelist-losses', f(run, 'duelist-losses') + 1);
  if (f(run, 'duelist-wins') >= NEEDED) {
    set(run, 'duelist-over', 1);
    set(run, 'gn-new-06-won', 1);
  } else if (f(run, 'duelist-losses') >= NEEDED) {
    set(run, 'duelist-over', 2);
    set(run, 'duelist-left', 1);
  } else if (n >= DUELS) set(run, 'duelist-over', 3);
  return '';
}

/** The chosen one gains Worthy Opponent (the leek stays with it). The Duelist is gone, and will be in the crowd. */
export function duelWorthy(run: RunState): string {
  const mon = chosenOf(run);
  if (mon) mon.marks = [...(mon.marks ?? []).filter((m) => m !== WORTHY), WORTHY].slice(-8);
  set(run, 'duelist-left', 1);
  return '';
}

/** The text token `{duelist}`: the chosen one's name. */
export function duelName(content: Content, run: RunState): string {
  const mon = chosenOf(run);
  return mon ? nameOf(content, mon) : 'your Pokémon';
}

// ---------- the Duelist, and what it practised ----------
/** The Berry that halves a type's hit. */
const RESIST: Record<string, string> = {
  normal: 'chilan-berry', fire: 'occa-berry', water: 'passho-berry', electric: 'wacan-berry', grass: 'rindo-berry', ice: 'yache-berry', fighting: 'chople-berry',
  poison: 'kebia-berry', ground: 'shuca-berry', flying: 'coba-berry', psychic: 'payapa-berry', bug: 'tanga-berry', rock: 'charti-berry', ghost: 'kasib-berry',
  dragon: 'haban-berry', dark: 'colbur-berry', steel: 'babiri-berry', fairy: 'roseli-berry',
};
export type Answer = 'berry' | 'move' | 'stance';
const ANSWERS: Answer[] = ['berry', 'move', 'stance'];
/** After its `loss`th loss, how it answered: a Berry, a new move, or a different stance (never the same twice running). */
export const answerKind = (run: Pick<RunState, 'seed'>, loss: number): Answer => ANSWERS[(fnv1a(`${run.seed}::duelist`) + loss) % 3]!;

export const BOW = "The Farfetch'd bows, leek flat across both wings. It waits for yours to bow back.";
export const PRACTISED = " It's been practising.";

/** gn rule `duelist`: the Farfetch'd, at the chosen one's level plus its losses, carrying an answer to each move that beat it. */
export function duelistStart(content: Content, run: RunState, battle: BattleState, waits: string, make: (speciesId: string, level: number, uid: string) => PokemonInstance): void {
  const chosen = chosenOf(run);
  const foe = battle.enemyTeam[0];
  if (!chosen || !foe) return;
  const wins = f(run, 'duelist-wins');
  const mon = make('farfetchd', Math.min(500, chosen.level + wins), foe.uid);
  const said: string[] = [];
  for (let i = 1; i <= wins; i++) {
    const hit = castOf(run, `duel-hit-${i}`);
    const mv = hit ? content.moves.get(hit) : undefined;
    const physical = mv?.category === 'physical';
    const kind = answerKind(run, i);
    if (kind === 'berry') {
      const berry = RESIST[mv?.type ?? 'normal'];
      if (berry && content.catalog.has(berry)) {
        mon.held = { [berry]: 1 };
        said.push(`a ${content.catalog.get(berry)?.name ?? 'Berry'} in its feathers`);
      }
    } else if (kind === 'move') {
      const id = !mv || mv.category === 'status' ? 'protect' : physical ? 'counter' : 'mirror-coat';
      const m = content.moves.get(id);
      if (m && !mon.moves.some((s) => s.id === id)) {
        if (mon.moves.length < 4) mon.moves.push({ id, pp: m.pp });
        else mon.moves[mon.moves.length - 1] = { id, pp: m.pp };
        said.push(`${m.name}, new`);
      }
    } else {
      const stat = !mv || mv.category === 'status' ? 'spe' : physical ? 'def' : 'spd';
      battle.enemyStages[stat] = Math.min(6, battle.enemyStages[stat] + 1);
      said.push('a different stance');
    }
  }
  battle.enemyTeam = [mon];
  battle.enemyIndex = 0;
  battle.storyEffects.push(`${waits}${BOW}${wins > 0 ? `${PRACTISED}${said.length ? ` (${said.join('; ')}.)` : ''}` : ''}`);
}

/** Worthy Opponent at the start of a battle: the lead enters against a foe at full HP, so its highest stat starts one stage up. */
export function worthyStart(content: Content, run: RunState, battle: BattleState): void {
  const lead = run.party[battle.activeIndex] ?? run.party.find((m) => m.hp > 0);
  const foe = battle.enemyTeam[battle.enemyIndex];
  const stat = lead && foe ? worthyStat(content, lead, foe) : null;
  if (stat) battle.playerStages[stat] = Math.min(6, battle.playerStages[stat] + 1);
}

/** The first Champion fight after the Duelist went: a Sirfetch'd in the crowd, with a worn leek. It nods once. */
export function duelAfterstory(run: RunState): string {
  const b = run.battle;
  if (!b || b.kind !== 'trainer' || b.trainer?.classId !== 'champion' || b.eventRule) return '';
  if (f(run, 'duelist-left') <= 0 || f(run, 'duelist-nodded') > 0) return '';
  set(run, 'duelist-nodded', 1);
  return "In the crowd, a Sirfetch'd with a worn leek. It finds your eyes, and nods once.";
}

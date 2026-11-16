// Greenneedle gn.new.27, The Little Cup: four rounds, first-stage Pokémon only, everyone at level 5.
//  - gn op `lcBring`: a first-stage party Pokémon joins the three entrants (an evolved one is turned away). Reuses the Dome's BRING mark.
//  - gn op `lcStart`: the entrants are set to level 5 (their real level and experience are kept in run flags) and healed.
//  - Battle rule `littlecup` (`slot` 1-4): the round's opponent, all at level 5. The final's Sunkern: Sunny Day, then Solar Beam.
//  - Conditions `lcEligible` (a first-stage Pokémon in the party), `lcEvolver` (an entrant that is ready to evolve at its real level and has
//    not been told to stay), `lcMany` (more than one entrant is still in).
//  - gn ops `lcStay` (cancelled: Bond +2, sets `littlecup-cancelled`), `lcWithdraw` (evolved: leaves the Cup, goes to the bench), `lcEnd` (real level back).
//  No experience is earned in the Cup (run.ts awardExperience), so nothing evolves or levels by accident.
import type { Content } from '../contentSchema';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { changeFriendship } from '../friendship';
import { evolutionTarget, evolve } from '../evolution';
import { getSpecies, levelFromXp, maxHp, xpForLevel } from '../pokemon';
import { BENCH, BRING } from './frontier';

export const CUP_LEVEL = 5;
export const IN = 'lc-in';
export const STAY = 'lc-stay';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
const drop = (run: Pick<RunState, 'story'>, k: string): void => {
  delete run.story.flags[`ev:${k}`];
};

const firstStageCache = new WeakMap<Content, Set<string>>();
/** Species that are not the evolution of anything (the Cup's "no evolved Pokémon"). */
export function isFirstStage(content: Content, speciesId: string): boolean {
  let evolved = firstStageCache.get(content);
  if (!evolved) {
    evolved = new Set();
    for (const sp of content.species.values()) for (const e of sp.evolutions) evolved.add(e.to);
    firstStageCache.set(content, evolved);
  }
  return !evolved.has(speciesId);
}

export const lcEligible = (content: Content, run: Pick<RunState, 'party'>): boolean => run.party.some((m) => m.hp > 0 && isFirstStage(content, m.speciesId));
const entrants = (run: Pick<RunState, 'party'>): PokemonInstance[] => run.party.filter((m) => m.gn?.includes(IN));

/** An entrant picked at the desk. An evolved one is turned away (nothing changes). */
export function lcBring(content: Content, run: RunState, uid: string | undefined): string {
  const mon = run.party.find((m) => m.uid === uid);
  if (!mon) return '';
  if (!isFirstStage(content, mon.speciesId)) return 'Mr. Prendergast weighs it, frowns, and writes "EVOLVED" on his clipboard. Not eligible';
  if (mon.gn?.includes(BRING) || run.party.filter((m) => m.gn?.includes(BRING)).length >= 3) return '';
  mon.gn = [...(mon.gn ?? []), BRING];
  set(run, 'lc-picked', run.party.filter((m) => m.gn?.includes(BRING)).length);
  return '';
}

/** The bench has the rest: the entrants go down to level 5, healed. Their real level and experience wait in run flags. */
export function lcStart(content: Content, run: RunState): string {
  for (const m of run.party) {
    if (!m.gn?.includes(BRING)) continue;
    set(run, `lc-lv:${m.uid}`, m.level);
    set(run, `lc-xp:${m.uid}`, m.xp);
    m.gn = [...(m.gn ?? []).filter((t) => t !== IN && t !== STAY), IN];
    m.level = CUP_LEVEL;
    m.xp = xpForLevel(getSpecies(content, m.speciesId).growthRate, CUP_LEVEL, content.balance.difficulty.highLevelXp);
    m.hp = maxHp(content, m);
  }
  set(run, 'lc-picked', 0);
  return 'Everyone is set to level 5';
}

/** The real level and experience come back (a Pokémon that was hurt keeps the same share of its health). */
function restore(content: Content, run: RunState, m: PokemonInstance): void {
  const lv = f(run, `lc-lv:${m.uid}`);
  if (lv > 0) {
    const share = m.hp / Math.max(1, maxHp(content, m));
    m.level = lv;
    m.xp = f(run, `lc-xp:${m.uid}`);
    m.hp = m.hp > 0 ? Math.max(1, Math.round(share * maxHp(content, m))) : 0;
  }
  drop(run, `lc-lv:${m.uid}`);
  drop(run, `lc-xp:${m.uid}`);
  m.gn = (m.gn ?? []).filter((t) => t !== IN && t !== STAY);
}

/** The Cup is over (won, lost or left): everyone is their real level again. */
export function lcEnd(content: Content, run: RunState, result: number): string {
  for (const m of [...run.party, ...run.box]) if (m.gn?.includes(IN) || f(run, `lc-lv:${m.uid}`) > 0) restore(content, run, m);
  set(run, 'lc-result', result);
  return '';
}

/** What the entrant would become if it were its real level. */
function targetAtRealLevel(content: Content, run: RunState, m: PokemonInstance): string | null {
  const real = f(run, `lc-lv:${m.uid}`);
  if (real <= 0) return null;
  const was = m.level;
  m.level = real;
  const to = evolutionTarget(content, m);
  m.level = was;
  return to;
}
const evolver = (content: Content, run: RunState): PokemonInstance | undefined => entrants(run).find((m) => !m.gn?.includes(STAY) && m.hp > 0 && targetAtRealLevel(content, run, m));
export const lcEvolver = (content: Content, run: RunState): boolean => !!evolver(content, run);
export const lcMany = (run: Pick<RunState, 'party'>): boolean => entrants(run).length > 1;

/** "Cancel it. Stay in.": Bond +2 and the Pokémon does not ask again. `littlecup-cancelled` is for the Linus event (gn.21). */
export function lcStay(content: Content, run: RunState): string {
  const m = evolver(content, run);
  if (!m) return '';
  m.gn = [...(m.gn ?? []), STAY];
  changeFriendship(content, m, 10, 1);
  set(run, 'littlecup-cancelled', 1);
  return `${m.care?.nickname || getSpecies(content, m.speciesId).name} wanted to. It looked at you first`;
}

/** "Evolve. Withdraw.": it evolves at its real level and sits out the rest on the bench. */
export function lcWithdraw(content: Content, run: RunState): string {
  const m = evolver(content, run);
  if (!m) return '';
  const to = targetAtRealLevel(content, run, m)!;
  const name = m.care?.nickname || getSpecies(content, m.speciesId).name;
  restore(content, run, m);
  evolve(content, m, to);
  m.gn = [...(m.gn ?? []).filter((t) => t !== BRING), BENCH];
  run.party = run.party.filter((p) => p !== m);
  run.box = [...run.box, m];
  return `${name} becomes ${getSpecies(content, to).name}, and leaves the Cup`;
}

/** The round's opponent, at level 5. */
export function lcStartBattle(content: Content, battle: BattleState, slot: number, make: (speciesId: string, level: number, uid: string) => PokemonInstance): void {
  const pools: Record<number, { sp: string; moves?: string[]; held?: string }[]> = {
    // A child with a Caterpie that has only Tackle and total faith.
    1: [{ sp: 'caterpie', moves: ['tackle'] }],
    // A grandmother with a Wooper she's had for thirty years.
    2: [{ sp: 'wooper' }],
    // Mr. Prendergast: three perfectly bred, perfectly dull.
    3: [{ sp: 'rattata' }, { sp: 'pidgey' }, { sp: 'geodude' }],
    // Tansy-Jane's Sunkern: Sunny Day, then Solar Beam. Only that. Perfectly.
    4: [{ sp: 'sunkern', moves: ['sunny-day', 'solar-beam'], held: 'power-herb' }],
  };
  const team = (pools[slot] ?? []).filter((p) => content.species.has(p.sp)).map((p, i) => {
    const mon = make(p.sp, CUP_LEVEL, battle.enemyTeam[i]?.uid ?? `lc-${slot}-${i}`);
    if (p.moves) mon.moves = p.moves.filter((id) => content.moves.has(id)).map((id) => ({ id, pp: content.moves.get(id)!.pp }));
    if (p.held && content.catalog.has(p.held)) mon.held = { [p.held]: 1 };
    return mon;
  });
  if (team.length === 0) return;
  battle.enemyTeam = team;
  battle.enemyIndex = 0;
}

void levelFromXp;

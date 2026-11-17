// Greenneedle gn.new.10, The Mirror Lake (doc GREENNEEDLE_PLACED_1.md lines 382–411).
// A battle the player lost, or nearly lost (one Pokémon left standing), is remembered as a team: species, level and moves.
// The lake's reflections are that team, with those moves. Pure rules: no RNG, nothing here depends on animation.
import type { Content } from '../contentSchema';
import type { BattleState, PokemonInstance, RunState } from '../state';

/** One Pokémon of the remembered team. */
export interface Reflection { s: string; l: number; m: string[] }
const KEY = 'mirror:team';
const MAX = 6;

export function mirrorTeam(run: Pick<RunState, 'story'>): Reflection[] {
  const raw = run.story.flags[KEY];
  if (typeof raw !== 'string') return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? (v as Reflection[]).filter((r) => typeof r?.s === 'string' && typeof r.l === 'number' && Array.isArray(r.m)) : [];
  } catch {
    return [];
  }
}
/** The lake has a team to show: a fight was lost, or all but one of the party fell. */
export const mirrorReady = (run: Pick<RunState, 'story'>): boolean => mirrorTeam(run).length > 0;

/** At the end of a fight (run.ts finishBattle): a loss, or a win with one Pokémon left of two or more, is remembered (the latest one). */
export function mirrorRecord(run: Pick<RunState, 'story' | 'party'>, battle: Pick<BattleState, 'outcome' | 'eventRule'>): void {
  if (battle.outcome !== 'win' && battle.outcome !== 'lose') return;
  if (battle.eventRule?.gn === 'mirror') return;
  const standing = run.party.filter((m) => m.hp > 0).length;
  const lost = battle.outcome === 'lose';
  if (!lost && !(run.party.length >= 2 && standing === 1)) return;
  const team: Reflection[] = run.party.slice(0, MAX).map((m) => ({ s: m.speciesId, l: m.level, m: m.moves.map((x) => x.id) }));
  if (team.length > 0) run.story.flags[KEY] = JSON.stringify(team);
}

/** gn rule `mirror`: the foe is the remembered team, at full HP, with the moves it had. */
export function mirrorStart(content: Content, run: RunState, battle: BattleState, make: (speciesId: string, level: number, uid: string) => PokemonInstance): void {
  const team: PokemonInstance[] = [];
  mirrorTeam(run).forEach((r, i) => {
    if (!content.species.has(r.s)) return;
    const mon = make(r.s, r.l, `e-mirror-${i}`);
    const moves = r.m.filter((id) => content.moves.has(id)).map((id) => ({ id, pp: content.moves.get(id)!.pp }));
    if (moves.length > 0) mon.moves = moves;
    team.push(mon);
  });
  if (team.length === 0) return;
  battle.enemyTeam = team;
  battle.enemyIndex = 0;
}

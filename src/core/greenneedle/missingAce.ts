// Greenneedle gn.new.26, The Rival's Missing Ace (doc GREENNEEDLE_PLACED_2.md lines 215–249).
// Pure rules, no RNG. The event writes `rival-ace-found` (the player saw the ace again); in the rival's next battle the ace
// is sent out first and bows. A bow costs nobody a turn: it is a line on the battle's rival note, and it happens once.
import type { Content } from '../contentSchema';
import type { BattleState, RunState } from '../state';
import { familyId } from '../mastery';
import { rivalBeaten } from '../rivals/living';

const get = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);

/** The rival has lost to the player at least once (the event's gate). */
export const rivalBeatenOnce = (run: RunState): boolean => rivalBeaten(run);

/** In a real rival battle: if the ace was found, it leads and bows (once). `aceFamily` is the rival's ace, else its strongest Pokémon leads. */
export function aceBows(content: Content, run: RunState, battle: BattleState, rivalName: string, aceFamily?: string): void {
  if (get(run, 'rival-ace-found') <= 0 || get(run, 'rival-ace-bowed') > 0) return;
  const team = battle.enemyTeam;
  if (team.length === 0 || battle.doubles) return;
  let at = aceFamily ? team.findIndex((m) => familyId(content, m.speciesId) === aceFamily) : -1;
  if (at < 0) at = team.reduce((best, m, i) => (m.level > team[best]!.level ? i : best), 0);
  if (at > 0) {
    [team[0], team[at]] = [team[at]!, team[0]!];
    if (battle.levelInfo.length === team.length) [battle.levelInfo[0], battle.levelInfo[at]] = [battle.levelInfo[at]!, battle.levelInfo[0]!];
  }
  const name = content.species.get(team[0]!.speciesId)?.name ?? 'Their ace';
  const line = `${rivalName}'s ${name} is sent out first. It looks at you, and it bows.`;
  battle.rivalNote = [battle.rivalNote, line].filter(Boolean).join(' ');
  run.story.flags['ev:rival-ace-bowed'] = 1;
}

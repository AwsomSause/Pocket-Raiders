// Greenneedle gn.57, The Pokémon Impersonator (doc GREENNEEDLE_REWORKED_PLACED_12.md lines 283–368).
// A Zoroark as a famous Champion. Exposed, its Illusion opens as the player's own lead. Beaten and caught, or befriended, it joins
// with Many Faces (an ability that forms its Illusion on entry and re-forms it once per battle on a switch back in: engine.ts).
import type { BattleState, PokemonInstance, RunState } from '../state';

export const MANY_FACES = 'many-faces';
export const FACE_MARK = 'many-faces';
const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);

/** gn rule `impersonator`: the foe's Illusion is the player's lead (first Pokémon able to fight). */
export function impersonatorStart(run: RunState, battle: BattleState): void {
  const foe = battle.enemyTeam[0];
  const lead = run.party.find((m) => m.hp > 0);
  if (!foe || !lead) return;
  foe.fixedAbility = 'illusion';
  battle.enemyVolatile.illusion = lead.speciesId;
}

const claim = (mon: PokemonInstance): void => {
  mon.fixedAbility = MANY_FACES;
  mon.gn = [...(mon.gn ?? []).filter((t) => t !== FACE_MARK), FACE_MARK];
};

/** A Zoroark that came into the party or box without Many Faces (caught after the fight) takes it. Once. */
export function impClaim(run: RunState): string {
  if (f(run, 'impersonator-joined') > 0) return '';
  // A catch waits in `pending` until the player takes it, so look there too.
  const waiting = run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []));
  const mon = [...run.party, ...run.box, ...waiting].find((m) => m.speciesId === 'zoroark' && !m.gn?.includes(FACE_MARK));
  if (!mon) return '';
  claim(mon);
  mon.friendship = Math.min(255, mon.friendship + 20);
  run.story.flags['ev:impersonator-joined'] = 1;
  return 'It joins. It is sulky about it, and for a region its Illusion will pick embarrassing shapes.';
}

/** It stays: a Zoroark joins with Many Faces. */
export function impJoin(run: RunState, host: { apply: (e: unknown) => string }): string {
  if (f(run, 'impersonator-joined') > 0) return '';
  run.story.flags['ev:impersonator-joined'] = 1;
  const before = new Set([...run.party, ...run.box].map((m) => m.uid));
  const words = host.apply({ kind: 'join', recall: false, species: ['zoroark'], types: [], levelBonus: 1, shinyMultiplier: 1, shadow: false, blissful: false, hiddenAbility: false, moves: [], direct: true, alpha: false, starterType: false, asIs: true, ability: MANY_FACES, mark: FACE_MARK });
  const mon = [...run.party, ...run.box].find((m) => !before.has(m.uid) && m.speciesId === 'zoroark');
  if (mon) claim(mon);
  return words;
}

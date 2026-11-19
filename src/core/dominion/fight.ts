// DOMINION D2: starting the battle an action (or the police) waits on, through the battle engine as it is (the old
// Evil Mode's fight bridge, core/evilMode/fight.ts, does the same). The Boss fights with their own team; teams are
// built from the field data at levels around the Boss's team. A wild foe is drawn by the main game's own wild picker
// (themes) on a derived generator, so no gameplay stream moves.

import type { Content } from '../contentSchema';
import { createBattle } from '../battle/engine';
import { hashSeed, Rng } from '../rng';
import { newMon } from '../run';
import type { PokemonInstance, RunState } from '../state';
import { pickThemeSpecies } from '../themes';
import { DOMINION_DATA } from './data';
import { districtDef, foeOf, targetDef } from './field';
import { heroTeam, sawTypes } from './hero';

/** Starts `field.fight` and marks it begun. Returns null when there's nothing to start or nobody can fight. */
export function beginDominionFight(content: Content, current: RunState): RunState | null {
  const block = current.expansion?.dominion;
  const f = block?.field.fight;
  if (!block || !f || f.begun || current.battle) return null;
  const active = current.party.findIndex((m) => m.hp > 0);
  if (active < 0) return null;
  const run = structuredClone(current);
  const b = run.expansion!.dominion!;
  const fight = b.field.fight!;
  const district = districtDef(fight.district)!;
  const td = targetDef(fight.target);
  const P = DOMINION_DATA.field.police;
  const foe = foeOf(b, run, fight.foe, district, td?.target ?? null);
  const rng = new Rng(hashSeed(`${run.seed}::dominion-foe::${b.field.rolls}::${fight.foe}`));
  const make = (species: string, level: number): PokemonInstance | null => (content.species.has(species) ? newMon(content, run, species, level, 'e') : null);
  let team: PokemonInstance[] = [];
  let trainer: { classId: string; name: string; leaderId: null } | null = null;
  if (fight.foe === 'hero' || fight.foe === 'sidekick' || fight.foe === 'legend') {
    // D11: the Hero (or their sidekick) as a trainer; a Heroic Legendary as a wild battle that can't be caught.
    const t = heroTeam(b, run, fight.foe, fight.why);
    team = t.team.map((x) => make(x.species, x.level)).filter((m): m is PokemonInstance => !!m);
    trainer = t.cls ? { classId: t.cls, name: t.name, leaderId: null } : null;
    if (fight.foe === 'hero') sawTypes(b, run.party.flatMap((m) => content.species.get(m.speciesId)?.types ?? []));
  } else if (fight.foe === 'wild' || fight.foe === 'ghost') {

    const theme = content.themes.get(district.wild);
    const species = fight.foe === 'ghost' ? DOMINION_DATA.field.foes.ghost[rng.int(0, DOMINION_DATA.field.foes.ghost.length - 1)]! : theme ? pickThemeSpecies(content, theme, rng, undefined, DOMINION_DATA.field.region, undefined, foe.level) : 'rattata';
    team = [make(species, foe.level)].filter((m): m is PokemonInstance => !!m);
  } else if (fight.foe === 'member') {
    const m = b.members[0];
    team = (m?.team ?? []).map((x) => ({ ...structuredClone(x), uid: `${x.uid}-spar` }));
    trainer = { classId: DOMINION_DATA.field.foes.member, name: m?.name ?? 'Crew', leaderId: null };
  } else {
    const def = fight.foe === 'police' ? P.jenny : fight.foe === 'looker' ? P.looker : fight.foe === 'raid' ? P.raid : td?.target.foe;
    if (!def) return null;
    team = def.species.map((s, i) => make(s, Math.max(2, foe.level - i))).filter((m): m is PokemonInstance => !!m);
    trainer = { classId: def.cls, name: def.name, leaderId: null };
  }
  if (!team.length) return null;
  run.battle = createBattle(trainer ? 'trainer' : 'wild', team, active, run.party[active]!.uid, trainer);
  run.phase = 'battle';
  fight.begun = true;
  return run;
}

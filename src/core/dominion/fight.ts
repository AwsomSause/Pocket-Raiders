// DOMINION D2: starting the battle an action (or the police) waits on, through the battle engine as it is. The Boss
// fights with their own team; teams are built from the field data at levels around the Boss's team. A wild foe is drawn by the main game's own wild picker
// (themes) on a derived generator, so no gameplay stream moves.

import type { Content } from '../contentSchema';
import { createBattle } from '../battle/engine';
import { hashSeed, Rng } from '../rng';
import { newMon } from '../run';
import type { PokemonInstance, RunState } from '../state';
import { pickThemeSpecies } from '../themes';
import { DOMINION_DATA } from './data';
import { districtDef, foeOf, targetDef, townFoe } from './field';
import { heroTeam, sawTypes } from './hero';
import { rivalSide } from './rivals';
import { growthSide } from './growth';
import { snatchSide } from './snatch';
import { takeoverSide } from './takeover';
import { realmSide } from './regions';
import { partnerSide, snagsThisFight } from './partners';

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
  const foe = foeOf(b, run, fight.foe, district, td?.target ?? null, fight.target);
  const rng = new Rng(hashSeed(`${run.seed}::dominion-foe::${b.field.rolls}::${fight.foe}`));
  const make = (species: string, level: number): PokemonInstance | null => (content.species.has(species) ? newMon(content, run, species, level, 'e') : null);
  let team: PokemonInstance[] = [];
  let trainer: { classId: string; name: string; leaderId: string | null } | null = null;
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
  } else if (fight.foe === 'rival') {
    // D9: a rival Grunt squad, an Admin, or the Boss at the door (rivals.ts).
    const side = rivalSide(b, run, fight);
    team = side.species.map((s, i) => make(s, Math.max(2, side.level - (i ? 1 : 0)))).filter((m): m is PokemonInstance => !!m);
    trainer = { classId: side.classId, name: side.name, leaderId: side.leaderId };
  } else if (fight.foe === 'growth' || fight.foe === 'takeover' || fight.foe === 'realm' || fight.foe === 'partner') {
    // D10: a Raid's, a Gym's or the Gauntlet's next fight (growth.ts); D14: a Takeover's (takeover.ts); D15: the Long Trip's traitor (regions.ts); D16: the purge (partners.ts).
    const side = fight.foe === 'growth' ? growthSide(b, run) : fight.foe === 'realm' ? realmSide(b, run) : fight.foe === 'partner' ? partnerSide(b, run) : takeoverSide(b, run);
    if (!side) return null;
    team = side.species.map((s, i) => make(s, Math.max(2, side.level - (i ? 1 : 0)))).filter((m): m is PokemonInstance => !!m);
    trainer = { classId: side.classId, name: side.name, leaderId: side.leaderId };
  } else if (fight.foe === 'snatch') {
    // D23: the person a Snatch Operation goes after (snatch.ts).
    const side = snatchSide(b, run);
    if (!side) return null;
    team = side.species.map((s, i) => make(s, Math.max(2, side.level - (i ? 1 : 0)))).filter((m): m is PokemonInstance => !!m);
    trainer = { classId: side.classId, name: side.name, leaderId: null };
  } else if (fight.foe === 'member') {
    // A spar with the first member, or (D22) a confronted spy's own team.
    const m = (fight.target && b.members.find((x) => x.id === fight.target)) || b.members[0];
    team = (m?.team ?? []).map((x) => ({ ...structuredClone(x), uid: `${x.uid}-spar` }));
    trainer = { classId: DOMINION_DATA.field.foes.member, name: m?.name ?? 'Crew', leaderId: null };
  } else {
    const court = fight.foe === 'court' ? DOMINION_DATA.court.find((c) => String(c.id) === fight.target)?.foe : undefined;
    // D10 follow-up: a street meeting's named foe, or a Gym Leader met in town.
    const town = fight.foe === 'town' ? townFoe(fight.target) : null;
    const def = court ?? town ?? (fight.foe === 'police' ? P.jenny : fight.foe === 'looker' ? P.looker : fight.foe === 'raid' ? P.raid : td?.target.foe);
    if (!def) return null;
    team = def.species.map((s, i) => make(s, Math.max(2, foe.level - i))).filter((m): m is PokemonInstance => !!m);
    trainer = town?.wild ? null : { classId: def.cls, name: def.name, leaderId: town?.leaderId ?? null };
  }
  if (!team.length) return null;
  run.battle = createBattle(trainer ? 'trainer' : 'wild', team, active, run.party[active]!.uid, trainer);
  // D16: Snagem's Snag Machine: a Snag Ball takes any of an adult trainer's Pokémon (never the Hero's, a Legend, or a minor's).
  if (trainer && snagsThisFight(b, fight.foe, trainer.classId)) run.battle.snagAny = true;
  run.phase = 'battle';
  fight.begun = true;
  fight.lead = team[0]!.speciesId;
  return run;
}

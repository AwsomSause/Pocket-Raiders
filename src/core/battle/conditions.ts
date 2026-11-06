// What is going on in a battle, as short lines for the battle Info panel (spec §23): field, your Pokémon, the foe.
// Pure and RNG-free; only things the player can already see.

import { catchProbability } from '../capture';
import { shinyMeterText } from '../wildLuck';
import { TYPE_NAMES, type Content, type TypeName } from '../contentSchema';
import { typeEffectiveness } from './damage';
import { abilityOf, calcStats, getSpecies } from '../pokemon';
import { currentEnemy, type PokemonInstance, type RunState, type SideEffects, type Stages } from '../state';
import { emotionOf } from '../story/emotions';
import { STANCE_INFO, autoProfile, stanceOf } from './autoBattle';
import { awakeningLevel, focusOf } from './growthStats';

export interface Conditions {
  field: string[];
  yours: string[];
  foe: string[];
  /** Overhaul slice 8: how each of your moves fares against the foe's type (empty while the foe is hidden). */
  moves: string[];
}

/** What the player has seen the foe show this battle (an ability that triggered, a held item that acted). Nothing else is ever told. */
export interface FoeReveals {
  ability?: string;
  items?: string[];
}

const TRANSFORM_NAMES: Record<string, string> = { mega: 'Mega Evolved', primal: 'Primal Reversion', gigantamax: 'Gigantamax', tera: 'Terastallized', zmove: 'Z-Move used', dynamax: 'Dynamaxed', ability: 'Ability form' };
const KIND_NAMES: Record<string, string> = { mega: 'Mega Evolution', primal: 'Primal Reversion', gigantamax: 'Gigantamax', tera: 'Terastallization', zmove: 'Z-Move', dynamax: 'Dynamax', ability: 'Ability form' };

/** The foe's identity is hidden until it has moved (Blindfold Bout, Misdirection) or while an Illusion holds. */
export function foeIdentityHidden(battle: NonNullable<RunState['battle']>): boolean {
  return Boolean((battle.eventRule?.hiddenFoe || battle.eventRule?.decoyFoe) && !battle.enemyVolatile?.lastMove);
}

/** Types a Pokémon has right now: its Tera type once Terastallized, plus any extra type a boss carries. */
function currentTypes(content: Content, battle: NonNullable<RunState['battle']>, mon: PokemonInstance): TypeName[] {
  const tera = battle.transform.teraTypes[mon.uid];
  const base = tera ? [tera] : [...getSpecies(content, mon.speciesId).types];
  const extra = battle.transform.bonusTypes[mon.uid];
  return extra && !base.includes(extra) ? [...base, extra] : base;
}

function transformLines(battle: NonNullable<RunState['battle']>, mon: PokemonInstance, side: 'player' | 'enemy'): string[] {
  const out: string[] = [];
  const form = battle.transform.forms[mon.uid];
  const tera = battle.transform.teraTypes[mon.uid];
  if (form && form.kind !== 'tera' && form.kind !== 'dynamax') out.push(TRANSFORM_NAMES[form.kind] ?? form.kind);
  if (tera) out.push(`Terastallized: ${cap(tera)}`);
  const dyn = battle.transform.dynamax[mon.uid];
  if (dyn !== undefined) out.push(`Dynamaxed: ${dyn} turn${dyn === 1 ? '' : 's'} left`);
  if (battle.transform.mechanics[mon.uid] === 'zmove') out.push('Z-Move used');
  const used = battle.transform.used[side];
  if (used.length) out.push(`${side === 'player' ? 'You have used' : 'Foe has used'}: ${[...new Set(used)].map((k) => KIND_NAMES[k] ?? k).join(', ')} (once per battle)`);
  return out;
}

const STAT: Record<string, string> = { atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe', acc: 'Acc', eva: 'Eva' };
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);

function stageLine(stages: Stages): string | null {
  const parts = Object.entries(stages).filter(([, n]) => n !== 0).map(([k, n]) => `${STAT[k] ?? k} ${n > 0 ? '+' : ''}${n}`);
  return parts.length ? `Stats: ${parts.join(' · ')}` : null;
}

function sideLine(side: SideEffects, who: string): string | null {
  const parts: string[] = [];
  if (side.reflect) parts.push(`Reflect ${side.reflect}`);
  if (side.lightScreen) parts.push(`Light Screen ${side.lightScreen}`);
  if (side.auroraVeil) parts.push(`Aurora Veil ${side.auroraVeil}`);
  if (side.tailwind) parts.push(`Tailwind ${side.tailwind}`);
  if (side.safeguard) parts.push(`Safeguard ${side.safeguard}`);
  if (side.mist) parts.push(`Mist ${side.mist}`);
  if (side.spikes) parts.push(`Spikes ×${side.spikes}`);
  if (side.toxicSpikes) parts.push(`Toxic Spikes ×${side.toxicSpikes}`);
  if (side.stealthRock) parts.push('Stealth Rock');
  if (side.stickyWeb) parts.push('Sticky Web');
  return parts.length ? `${who}: ${parts.join(', ')}` : null;
}

const statusWord = (m: PokemonInstance) => (m.status ? ({ brn: 'Burned', psn: 'Poisoned', par: 'Paralyzed', slp: 'Asleep', frz: 'Frozen' } as Record<string, string>)[m.status.id] ?? m.status.id : null);

export function battleConditions(content: Content, run: RunState, reveals: FoeReveals = {}): Conditions {
  const battle = run.battle;
  const out: Conditions = { field: [], yours: [], foe: [], moves: [] };
  if (!battle) return out;
  const f = out.field;
  if (battle.weather) f.push(`Weather: ${cap(battle.weather.id)}${battle.weather.turns ? ` (${battle.weather.turns} turns)` : ''}`);
  if (battle.terrain) f.push(`Terrain: ${cap(battle.terrain.id)} (${battle.terrain.turns} turns)`);
  if (battle.field.gravity) f.push(`Gravity (${battle.field.gravity})`);
  if (battle.field.trickRoom) f.push(`Trick Room (${battle.field.trickRoom})`);
  const mine = sideLine(battle.sideEffects.player, 'Your side');
  const theirs = sideLine(battle.sideEffects.enemy, 'Foe side');
  if (mine) f.push(mine);
  if (theirs) f.push(theirs);
  const sp = battle.spectacle;
  if (sp) f.push(`Momentum ${sp.momentum}${sp.streak ? ` · streak ${sp.streak}` : ''}`);
  if (battle.kind === 'wild' && run.itemCounters?.['shiny-meter'] !== undefined) f.push(shinyMeterText(content, run, currentEnemy(battle).speciesId));
  if (battle.raid) f.push(`Raid: ${battle.raid.cheersLeft} cheers left`);
  if (battle.rivalId) f.push(battle.rivalNote ? `Rival: ${battle.rivalNote}` : 'A rival is watching');
  if (battle.nemesisNote) f.push(battle.nemesisNote);
  if (battle.memoryNote) f.push(battle.memoryNote);
  if (f.length === 0) f.push('Nothing special on the field.');

  const mon = run.party[battle.activeIndex];
  if (mon) {
    const species = getSpecies(content, mon.speciesId);
    const emotion = emotionOf(content, run, mon.uid);
    const { stance, taught } = stanceOf(run, mon.uid);
    const profile = autoProfile(content, run, mon);
    out.yours.push(`${species.name} Lv.${mon.level}${mon.nature ? ` · ${cap(mon.nature)}` : ''}`);
    out.yours.push(`Mood: ${emotion ? emotion.name : 'steady'} · ${profile.style}`);
    out.yours.push(`Stance: ${STANCE_INFO[stance].name}${taught ? ' (taught)' : ''}`);
    const ownAbility = abilityOf(content, mon);
    if (ownAbility) out.yours.push(`Ability: ${content.abilities.get(ownAbility)?.name ?? ownAbility}`);
    out.yours.push(...transformLines(battle, mon, 'player'));
    const hyperMove = mon.moves.find((m) => m.hyper);
    if (hyperMove) out.yours.push(`Hyper move ready: ${content.moves.get(hyperMove.id)?.name ?? hyperMove.id}`);
    // S157 Focus and S158 Ability Awakening.
    const awake = awakeningLevel(content, mon.abilityUses);
    out.yours.push(`Focus ${focusOf(mon)}/100${awake > 0 ? ` · Ability Awakening ${awake}` : ''}`);
    const status = statusWord(mon);
    if (status) out.yours.push(status);
    const stages = stageLine(battle.playerStages);
    if (stages) out.yours.push(stages);
    const held = Object.entries(mon.held ?? {}).map(([id, n]) => `${content.items.get(id)?.name ?? id}${n > 1 ? ` ×${n}` : ''}`);
    if (held.length) out.yours.push(`Holding: ${held.join(', ')}`);
    const s = calcStats(content, mon);
    out.yours.push(`HP ${mon.hp}/${s.hp}`);
    const hyper = battle.hyper;
    const bond = run.story.histories[mon.uid]?.bond;
    if (bond && bond.hyperReadiness >= 40) out.yours.push(`Hyper readiness ${Math.round(bond.hyperReadiness)}%${bond.hyperReadiness >= 60 ? ' (Overdrive is near)' : ''}`);
    if (hyper?.guard[mon.uid]) out.yours.push(`Guarded by teammates for ${hyper.guard[mon.uid]} more turn(s)`);
    if (hyper?.outdo.includes(mon.uid)) out.yours.push('Out to outdo a teammate rival (hits harder)');
    const rival = Object.entries(hyper?.rivals ?? {}).find(([key]) => key.startsWith(`${mon.uid}|`));
    if (rival) out.yours.push(`Rival of the foe's kind: ${rival[1] === 'reckless' ? 'turning reckless' : 'calm'}`);
  }
  if (battle.playerVolatile?.bleed) out.yours.push(`Bleeding x${battle.playerVolatile.bleed}`);
  if (battle.playerVolatile?.curseTag) out.yours.push('Curse-tagged: Ghost and Dark moves hit harder');
  const foe = currentEnemy(battle);
  // What the player can see: an Illusion shows the species it copies, and a hidden foe shows nothing until it has moved.
  const hidden = foeIdentityHidden(battle);
  const seen = battle.enemyVolatile?.illusion ? { ...foe, speciesId: battle.enemyVolatile.illusion } : foe;
  const foeSpecies = getSpecies(content, seen.speciesId);
  const foeTypes = battle.enemyVolatile?.illusion ? [...foeSpecies.types] : currentTypes(content, battle, foe);
  if (hidden) out.foe.push('???  Its identity stays hidden until it moves.');
  else {
    out.foe.push(`${foeSpecies.name} Lv.${foe.level}`);
    out.foe.push(`Type: ${foeTypes.map(cap).join(' / ')}`);
    out.foe.push(...transformLines(battle, foe, 'enemy'));
    out.foe.push(`Ability: ${reveals.ability ? content.abilities.get(reveals.ability)?.name ?? reveals.ability : 'not shown yet'}`);
    if (reveals.items?.length) out.foe.push(`Held item seen: ${reveals.items.map((id) => content.catalog.get(id)?.name ?? id).join(', ')}`);
    // Overhaul slice 8: each of your moves against what you can see.
    const mon0 = run.party[battle.activeIndex];
    for (const slot of mon0?.moves ?? []) {
      const move = content.moves.get(slot.id);
      if (!move) continue;
      if (move.category === 'status') continue;
      const m = typeEffectiveness(content.typeChart, move.type as TypeName, foeTypes);
      out.moves.push(`${move.name}: ${m === 0 ? 'no effect' : m > 1 ? `super effective ×${m}` : m < 1 ? `not very effective ×${m}` : 'normal damage'}${slot.pp <= 0 ? ' (no PP)' : ''}`);
    }
  }
  if (battle.kind === 'wild' && !hidden) {
    // Weakened capture bonus: show the numbers (a plain ball; HP and status both raise the odds).
    const maxHp = calcStats(content, foe).hp;
    const base = { maxHp, catchRate: foeSpecies.catchRate, ballMultiplier: 1, finalMultiplier: 1 };
    const full = catchProbability({ ...base, hp: maxHp, statusMultiplier: 1 });
    const now = catchProbability({ ...base, hp: foe.hp, statusMultiplier: foe.status ? content.ruleset.catchStatusMultipliers[foe.status.id] ?? 1 : 1 });
    out.foe.push(`Catch odds (plain ball): ${Math.round(now * 100)}% now, ${Math.round(full * 100)}% at full health${foe.status ? ' (status helps)' : ''}`);
  }
  if (battle.scanned === 'ok' && !hidden) {
    const weak = TYPE_NAMES.filter((t) => typeEffectiveness(content.typeChart, t, foeSpecies.types) > 1);
    out.foe.push(`Scanned: weak to ${weak.map(cap).join(', ') || 'nothing special'}`);
  } else if (battle.scanned === 'fail') out.foe.push('Scan unclear');
  if (battle.mindRead) out.foe.push(`Mind-read: likely to use ${content.moves.get(battle.mindRead)?.name ?? battle.mindRead}`);
  if (battle.spectator) out.field.push(`${battle.spectator.name} is watching${battle.spectator.used ? ' (already cheered)' : ''}`);
  if (battle.arena) out.field.push(`Arena: ${battle.arena.kind}${battle.arena.spent ? ' (smashed)' : ' hazard every few turns; Smash it'}`);
  if (battle.alpha) out.foe.push('ALPHA: oversized and stronger, with a bigger prize');
  const foeStatus = statusWord(foe);
  if (foeStatus) out.foe.push(foeStatus);
  const foeStages = stageLine(battle.enemyStages);
  if (foeStages) out.foe.push(foeStages);
  const rage = battle.hyper?.rage[foe.uid];
  if (rage?.state === 'warned') out.foe.push('Riled up: about to unleash its rage (Brace to calm it)');
  else if (rage && rage.hits > 0 && rage.state === 'calm') out.foe.push(`Getting riled up (${rage.hits} hit${rage.hits > 1 ? 's' : ''} taken)`);
  if (battle.enemyVolatile?.bleed) out.foe.push(`Bleeding x${battle.enemyVolatile.bleed}`);
  if (battle.enemyVolatile?.curseTag) out.foe.push('Curse-tagged: Ghost and Dark moves hit harder');
  if (battle.autoUsed) out.foe.push('Auto-Battle was used: EXP and prize money at 35%');
  return out;
}

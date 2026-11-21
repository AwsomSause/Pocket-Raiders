// The Pocket look's Battle Info page (mock-up `b-info`) as data: the foe and your lead side by side (types, Ability,
// held item, status, stat stages) and four cards between them (weather, field, your side, the foe's side). Pure and
// RNG-free; only what the player can already see (the foe's Ability and items only once shown). Looking never changes
// the battle.

import { catchProbability } from '../capture';
import type { Content, TypeName } from '../contentSchema';
import { typeEffectiveness } from '../battle/damage';
import { abilityOf, calcStats, getSpecies } from '../pokemon';
import { currentEnemy, type PokemonInstance, type RunState, type SideEffects, type Stages } from '../state';
import { foeIdentityHidden, type FoeReveals } from '../battle/conditions';
import { ownTypes } from '../co/typeShift';

export interface InfoSide {
  speciesId: string;
  shiny: boolean;
  name: string;
  /** "Lv 38 · Rival Blue", "Lv 36 · Your lead". */
  sub: string;
  types: string[];
  ability: string;
  held: string;
  status: string;
  /** Atk, Def, Sp. Atk, Sp. Def, Speed stages (-6 to +6). */
  stages: [string, number][];
  /** One line at the foot ("Mega Evolution is ready"), or ''. */
  note: string;
}
export interface InfoCard { em: string; b: string; span: string }
export interface BattleInfo { foe: InfoSide | null; me: InfoSide | null; mid: InfoCard[] }

const cap = (s: string): string => (s ? s[0]!.toUpperCase() + s.slice(1) : s);
const STAGES: [keyof Stages, string][] = [['atk', 'Atk'], ['def', 'Def'], ['spa', 'Sp. Atk'], ['spd', 'Sp. Def'], ['spe', 'Speed']];
const STATUS: Record<string, string> = { brn: 'Burned', psn: 'Poisoned', tox: 'Badly poisoned', par: 'Paralyzed', slp: 'Asleep', frz: 'Frozen' };
const WEATHER: Record<string, string> = {
  rain: 'Water moves hit harder, Fire moves hit softer.', sun: 'Fire moves hit harder, Water moves hit softer.',
  sand: 'Rock, Ground and Steel Pokémon are spared the sand.', hail: 'Only Ice Pokémon are spared the hail.', snow: 'Ice Pokémon guard better in the snow.',
};

function sideParts(side: SideEffects): string[] {
  const p: string[] = [];
  if (side.reflect) p.push(`Reflect ${side.reflect}`);
  if (side.lightScreen) p.push(`Light Screen ${side.lightScreen}`);
  if (side.auroraVeil) p.push(`Aurora Veil ${side.auroraVeil}`);
  if (side.tailwind) p.push(`Tailwind ${side.tailwind}`);
  if (side.safeguard) p.push(`Safeguard ${side.safeguard}`);
  if (side.mist) p.push(`Mist ${side.mist}`);
  if (side.spikes) p.push(`Spikes ×${side.spikes}`);
  if (side.toxicSpikes) p.push(`Toxic Spikes ×${side.toxicSpikes}`);
  if (side.stealthRock) p.push('Stealth Rock');
  if (side.stickyWeb) p.push('Sticky Web');
  return p;
}

const statusOf = (m: PokemonInstance): string => (m.status ? STATUS[m.status.id] ?? cap(m.status.id) : 'Healthy');

export function battleInfo(content: Content, run: RunState, reveals: FoeReveals = {}): BattleInfo {
  const battle = run.battle;
  if (!battle) return { foe: null, me: null, mid: [] };
  const stages = (s: Stages): [string, number][] => STAGES.map(([k, w]) => [w, s[k] ?? 0]);
  const who = battle.trainer?.name ?? '';
  const foeMon = currentEnemy(battle);
  const hidden = foeIdentityHidden(battle);
  const seenId = battle.enemyVolatile?.illusion ?? foeMon.speciesId;
  const foeTypes = battle.transform.teraTypes[foeMon.uid] ? [battle.transform.teraTypes[foeMon.uid]!] : battle.enemyVolatile?.illusion ? [...getSpecies(content, seenId).types] : [...ownTypes(content, foeMon)];
  const last = battle.enemyVolatile?.lastMove ? content.moves.get(battle.enemyVolatile.lastMove)?.name ?? '' : '';
  const foe: InfoSide | null = hidden ? null : {
    speciesId: seenId, shiny: !!foeMon.shiny, name: getSpecies(content, seenId).name,
    sub: `Lv ${foeMon.level} · ${battle.kind === 'wild' ? (battle.alpha ? 'Wild Alpha' : 'Wild') : who || 'Trainer'}`,
    types: foeTypes, ability: reveals.ability ? content.abilities.get(reveals.ability)?.name ?? reveals.ability : 'Not shown yet',
    held: reveals.items?.length ? reveals.items.map((id) => content.catalog.get(id)?.name ?? id).join(', ') : 'Not seen yet',
    status: statusOf(foeMon), stages: stages(battle.enemyStages), note: last ? `Last move: ${last}` : '',
  };
  const mon = run.party[battle.activeIndex];
  const ab = mon ? abilityOf(content, mon) : null;
  const held = mon ? Object.keys(mon.held ?? {}).map((id) => content.items.get(id)?.name ?? id) : [];
  const ready = battle.transform.used.player.length === 0 && mon ? (mon.moves.find((m) => m.hyper) ? `Hyper move ready: ${content.moves.get(mon.moves.find((m) => m.hyper)!.id)?.name ?? ''}` : '') : '';
  const me: InfoSide | null = mon ? {
    speciesId: mon.speciesId, shiny: !!mon.shiny, name: getSpecies(content, mon.speciesId).name,
    sub: `Lv ${mon.level} · ${battle.activeIndex === 0 ? 'Your lead' : 'In battle'}`,
    types: [...(battle.transform.teraTypes[mon.uid] ? [battle.transform.teraTypes[mon.uid]!] : ownTypes(content, mon))],
    ability: ab ? content.abilities.get(ab)?.name ?? ab : 'None', held: held.join(', ') || 'Nothing', status: statusOf(mon),
    stages: stages(battle.playerStages), note: ready || `HP ${mon.hp} of ${calcStats(content, mon).hp}`,
  } : null;
  const w = battle.weather;
  const t = battle.terrain;
  const mine = sideParts(battle.sideEffects.player), theirs = sideParts(battle.sideEffects.enemy);
  const fieldOther = [battle.field.trickRoom ? `Trick Room ${battle.field.trickRoom}` : '', battle.field.gravity ? `Gravity ${battle.field.gravity}` : ''].filter(Boolean);
  const mid: InfoCard[] = [
    { em: 'Weather', b: w ? cap(w.id) : 'Clear', span: w ? `${w.turns ? `${w.turns} ${w.turns === 1 ? 'turn' : 'turns'} left. ` : ''}${WEATHER[w.id] ?? ''}`.trim() : 'No weather.' },
    { em: 'Field', b: t ? cap(t.id) : 'None', span: [t ? `${t.turns} ${t.turns === 1 ? 'turn' : 'turns'} left.` : 'No terrain is up.', ...fieldOther.map((x) => `${x} turns.`)].join(' ') },
    { em: 'Your side', b: mine.length ? `${mine.length} in play` : 'Clear', span: mine.length ? `${mine.join(', ')}.` : 'No traps on the ground.' },
  ];
  if (battle.kind === 'wild') {
    if (hidden) mid.push({ em: 'Catch odds', b: '?', span: 'Its identity stays hidden until it moves.' });
    else {
      const max = calcStats(content, foeMon).hp, sp = getSpecies(content, foeMon.speciesId);
      const now = catchProbability({ maxHp: max, catchRate: sp.catchRate, ballMultiplier: 1, finalMultiplier: 1, hp: foeMon.hp, statusMultiplier: foeMon.status ? content.ruleset.catchStatusMultipliers[foeMon.status.id] ?? 1 : 1 });
      mid.push({ em: 'Catch odds', b: `${Math.round(now * 100)}%`, span: 'With a plain Poké Ball, right now.' });
    }
  } else {
    const most = content.balance.trainerAi.maxHealItems, left = Math.max(0, most - battle.enemyItemsUsed);
    mid.push({ em: `${who || 'Foe'}'s side`, b: `${left} of ${most}`, span: `Healing items ${who || 'the foe'} may still use.${theirs.length ? ` ${theirs.join(', ')}.` : ''}` });
  }
  return { foe, me, mid };
}

export interface MoveInfo {
  name: string;
  type: string;
  category: string;
  contact: boolean;
  power: string;
  accuracy: string;
  pp: string;
  text: string;
  /** Against the foe you face (null while it is hidden or for a status move). */
  vs: { foe: string; foeTypes: string[]; mult: number; stab: boolean; user: string; word: string } | null;
}

const WORD = (m: number): string => (m === 0 ? 'It has no effect.' : m >= 4 ? 'Extremely effective.' : m > 1 ? 'Super effective.' : m < 1 ? 'Not very effective.' : 'Normal damage.');

/** The Pocket look's move card (mock-up `moveinfo`): the move's numbers and how it fares against the foe. */
export function moveInfo(content: Content, run: RunState, slot: number, describe: (moveId: string) => string): MoveInfo | null {
  const battle = run.battle, mon = battle ? run.party[battle.activeIndex] : undefined;
  const s = mon?.moves[slot], move = s ? content.moves.get(s.id) : undefined;
  if (!battle || !mon || !s || !move) return null;
  const foe = currentEnemy(battle);
  const hidden = foeIdentityHidden(battle);
  const seenId = battle.enemyVolatile?.illusion ?? foe.speciesId;
  const foeTypes = battle.enemyVolatile?.illusion ? [...getSpecies(content, seenId).types] : [...ownTypes(content, foe)];
  const userTypes: string[] = [...ownTypes(content, mon)];
  const mult = typeEffectiveness(content.typeChart, move.type as TypeName, foeTypes as TypeName[]);
  const ppMax = Math.max(s.pp, move.pp);
  return {
    name: move.name, type: move.type, category: cap(move.category), contact: move.flags.includes('contact'),
    power: move.power ? `${move.power}` : '—', accuracy: move.accuracy ? `${move.accuracy}` : '—', pp: `${s.pp}/${ppMax}`,
    text: describe(move.id),
    vs: hidden || move.category === 'status' ? null : { foe: getSpecies(content, seenId).name, foeTypes, mult, stab: userTypes.includes(move.type), user: getSpecies(content, mon.speciesId).name, word: WORD(mult) },
  };
}

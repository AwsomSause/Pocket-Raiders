// Battle/AI batch 3. S159 Signature Passives: every ordinary trainer class gives its whole team one passive trait for the
// battle (bosses keep their own perks). Told at the start of the battle; pure numbers, no random numbers.
// Off with balance `opponentAi.classPassives: false`.

import type { Content, TypeName } from '../contentSchema';
import type { BattleState } from '../state';

export type PassiveKind = 'power' | 'guard' | 'crit';
export interface ClassPassive {
  name: string;
  /** power: the team's moves of `types` hit harder by `amount`; guard: the team takes `amount` less damage; crit: + `amount` crit chance. */
  kind: PassiveKind;
  amount: number;
  /** For power: the boosted types (default: the class's own types). */
  types?: TypeName[];
}

export const CLASS_PASSIVES: Record<string, ClassPassive> = {
  youngster: { name: 'Shorts Power', kind: 'power', amount: 0.1 },
  'bug-catcher': { name: 'Swarm Net', kind: 'power', amount: 0.1 },
  hiker: { name: 'Sturdy Boots', kind: 'guard', amount: 0.1 },
  fisherman: { name: 'Patient Line', kind: 'guard', amount: 0.08 },
  'bird-keeper': { name: 'Tailwind Whistle', kind: 'crit', amount: 0.05 },
  'black-belt': { name: 'Dojo Discipline', kind: 'power', amount: 0.15 },
  firebreather: { name: 'Fire Breath', kind: 'power', amount: 0.1 },
  guitarist: { name: 'Amped Up', kind: 'power', amount: 0.1 },
  'aroma-lady': { name: 'Soothing Aroma', kind: 'guard', amount: 0.08 },
  'snow-worker': { name: 'Thick Coats', kind: 'guard', amount: 0.1 },
  biker: { name: 'Road Rash', kind: 'crit', amount: 0.05 },
  psychic: { name: 'Keen Mind', kind: 'crit', amount: 0.05 },
  'hex-maniac': { name: 'Hex Charm', kind: 'power', amount: 0.1 },
  'dragon-tamer': { name: 'Dragon Pride', kind: 'power', amount: 0.12 },
  roughneck: { name: 'Dirty Tricks', kind: 'crit', amount: 0.06 },
  worker: { name: 'Hard Hats', kind: 'guard', amount: 0.12 },
  'fairy-tale-girl': { name: 'Storybook Charm', kind: 'guard', amount: 0.08 },
  lass: { name: 'Cheer Squad', kind: 'power', amount: 0.08 },
  camper: { name: 'Campfire Grit', kind: 'guard', amount: 0.08 },
  picnicker: { name: 'Packed Lunch', kind: 'guard', amount: 0.08 },
  swimmer: { name: 'Swim Training', kind: 'power', amount: 0.1 },
  breeder: { name: 'Well Raised', kind: 'guard', amount: 0.1 },
  'battle-girl': { name: 'Combo Training', kind: 'power', amount: 0.12 },
  ranger: { name: 'Field Craft', kind: 'crit', amount: 0.05 },
  'ace-trainer': { name: 'Ace Focus', kind: 'crit', amount: 0.06 },
  veteran: { name: 'Old Guard', kind: 'guard', amount: 0.12 },
  reporter: { name: 'Scoop Hunter', kind: 'crit', amount: 0.05 },
  rival: { name: 'Rival Spirit', kind: 'power', amount: 0.08 },
};

/** The enemy team's passive for this battle, or null (wild, raids, Totems, bosses, unknown classes, switched off). */
export function classPassiveOf(content: Content, battle: Pick<BattleState, 'trainer' | 'raid' | 'totem'>): ClassPassive | null {
  const t = battle.trainer;
  if (!t || t.leaderId || battle.raid || battle.totem || !content.balance.opponentAi.classPassives) return null;
  return CLASS_PASSIVES[t.classId] ?? null;
}

/** The boosted types for a power passive (its own list, or the class's types). */
export function passiveTypes(content: Content, classId: string, p: ClassPassive): readonly string[] {
  return p.types ?? content.trainers.get(classId)?.types ?? [];
}

/** One line for the battle start. */
export function passiveLine(trainerName: string, p: ClassPassive): string {
  const what = p.kind === 'power' ? `its team's signature-type moves hit ${Math.round(p.amount * 100)}% harder` : p.kind === 'guard' ? `its team takes ${Math.round(p.amount * 100)}% less damage` : `its team lands critical hits more often`;
  return `${trainerName}'s trait, ${p.name}: ${what}.`;
}

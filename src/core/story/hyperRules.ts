// Overhaul slice 9: Hyper and Overdrive, two different states with rules that must add up.
//
//   Hyper     = bond and defence: it protects, it saves (Toughened It Out, Felt a Bond, Protective Instinct...).
//   Overdrive = aggressive and volatile: it hits harder and costs something (Defiance, Pushed Beyond Limits...).
//
// Pure and RNG-free. `activationFactor` only scales the chance the engine then rolls on the "hyper" stream,
// so the same seed and actions always give the same result. `explainMoment` builds the first-time explanation
// from the moment's own data, so it can only say what the engine really does.

import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import type { StoryEventDefinition } from './schema';

export type MomentFamily = 'hyper' | 'overdrive';

export const FAMILY_NAMES: Record<MomentFamily, string> = { hyper: 'Hyper', overdrive: 'Overdrive' };

/** The one-line identity shown in the explanation. */
export const FAMILY_IDENTITY: Record<MomentFamily, string> = {
  hyper: 'Hyper is a bond state: your Pokémon digs deep to protect itself or a teammate. It saves and shields; it does not make you stronger.',
  overdrive: 'Overdrive is a volatile state: your Pokémon throws everything into the fight. It hits harder or hits back, and it always costs something.',
};

export function familyOf(def: StoryEventDefinition): MomentFamily | null {
  return def.family ?? null;
}

/** What the rules know about the moment of a roll. */
export interface ActivationInput {
  /** Turns the Pokémon has been on the field in this battle (1 on the turn it came in). */
  turnsOnField: number;
  /** Earlier moments of this family for this Pokémon in this run. */
  previousUses: number;
  /** A boss, rival or raid fight. */
  intense: boolean;
}

/** The chance multiplier for a moment: 0 while the Pokémon is too fresh, below 1 for repeats, above 1 in a big fight. Moments with no family are never changed. */
export function activationFactor(content: Content, def: StoryEventDefinition, input: ActivationInput): number {
  const family = familyOf(def);
  if (!family) return 1;
  const rules = content.story.rarity.hyperRules;
  if (input.turnsOnField < rules.minTurnsOnField[family]) return 0;
  const repeat = Math.max(rules.repeatFloor, rules.repeatPenalty ** Math.max(0, input.previousUses));
  return repeat * (input.intense ? rules.intenseBoost : 1);
}

/**
 * Turns `uid` has been on the field in the current battle (1 on the turn it came in), from the battle's own
 * `turnsOut` counter (a switch resets it). A Pokémon that is not the active one (a doubles partner, a bench
 * teammate) is never held back by this rule.
 */
export function turnsOnField(run: RunState, uid: string): number {
  const battle = run.battle;
  if (!battle) return 0;
  if (run.party[battle.activeIndex]?.uid !== uid) return Number.MAX_SAFE_INTEGER;
  return battle.playerVolatile.turnsOut + 1;
}

/**
 * Moments of this family this Pokémon has had this run (from its history), not counting `exceptId`: a repeat of the
 * same moment already has its own "again" halving in the moment's chance rule, so it is not penalised twice.
 */
export function previousUses(content: Content, run: RunState, uid: string, family: MomentFamily, exceptId?: string): number {
  const history = run.story.histories[uid]?.hyper ?? {};
  let n = 0;
  for (const def of content.story.definitions) if (def.family === family && def.id !== exceptId) n += history[def.id] ?? 0;
  return n;
}

// ---------- the explanation ----------

export interface MomentExplanation {
  family: MomentFamily;
  title: string;
  /** Why it happened: the real trigger, in words. */
  why: string;
  /** What it does, only effects the engine really applies. */
  effects: string[];
  /** What it costs. */
  risks: string[];
  /** How long it lasts and how often it can happen. */
  limits: string[];
  /** The profile keys this explanation covers: the family and the kind of effect. */
  keys: string[];
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
const STAT_NAME: Record<string, string> = { atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed', acc: 'Accuracy', eva: 'Evasion' };
const costText = (cost: Record<string, number>) => Object.entries(cost).map(([s, n]) => `${STAT_NAME[s] ?? s} ${n > 0 ? '+' : ''}${n}`).join(', ');

/** Why it happened, per trigger. The numbers come from the definition so they can't drift from the engine's data. */
function whyText(def: StoryEventDefinition): string {
  const c = def.triggerConditions;
  switch (c.trigger) {
    case 'toughenedItOut':
      return `A hit that would have knocked it out landed while it still had at least ${pct(c.minHpShare ?? 0)} of its HP. After everything you have been through together, it refuses to go down.`;
    case 'feltABond':
      return `A fatal hit came, and your bond held: it has been through close calls with you before and it trusts you (friendship ${c.minFriendship}+).`;
    case 'pushedBackUp':
      return 'It was knocked out, but the memory of surviving with you before pulled it back to its feet.';
    case 'hungInThere':
      return `It has stayed at ${pct(c.lowHpShare ?? 0)} HP or less for ${c.turns} turns and survived ${c.superEffectiveHits} super-effective hits. It is digging in.`;
    case 'protectiveInstinct':
      return `A teammate was about to take a fatal hit, and with a friendship of ${c.minFriendship}+ it stepped in front.`;
    case 'emotionalAwakening':
      return `Badly hurt (${pct(c.lowHpShare ?? 0)} HP or less) and carrying a strong feeling from this run, it awakened: its feeling decides which ability it gains.`;
    case 'defiance':
      return `It has been hit ${def.effect?.kind === 'defy' ? def.effect.minHits : 'many'} times and is overwhelmed. Rather than fall, it turns on its attacker.`;
    case 'limitBreak':
      return `Pushed to the edge with a bond of ${c.minFriendship}+, it breaks its own limits and attacks with everything it has.`;
    case 'heatedRivalry':
      return `It has fought this kind of Pokémon ${c.battles} times and the rivalry has caught fire.`;
    default:
      return def.displayName;
  }
}

/** What it really does, from the effect spec. */
function effectLines(def: StoryEventDefinition): { effects: string[]; risks: string[] } {
  const e = def.effect;
  const effects: string[] = [];
  const risks: string[] = [];
  if (!e) return { effects, risks };
  switch (e.kind) {
    case 'endure':
      effects.push('It survives the hit with 1 HP.');
      break;
    case 'endureOrCure':
      effects.push('It survives the hit with 1 HP, or shakes off a status problem.');
      break;
    case 'revive':
      effects.push(`It gets back up with ${pct(e.hpShare)} of its HP.`);
      break;
    case 'boost':
      effects.push(`${Object.entries(e.stats).map(([s, n]) => `${STAT_NAME[s] ?? s} +${n}`).join(', ')}, and it heals a little.`);
      break;
    case 'intercept':
      effects.push(`It takes ${pct(e.takeShare)} of the hit for its teammate.`, `The teammate is guarded for ${e.guardTurns} turns (${pct(e.guardReduction)} less damage).`);
      break;
    case 'awaken':
      effects.push('It gains an ability that matches its feeling for the rest of the battle.');
      risks.push('Awakening costs it a stat stage (for example Sp. Def -1).');
      break;
    case 'defy':
      effects.push('It holds on at 1 HP.', `It strikes back for ${pct(e.retaliateShare)} of the attacker's max HP (never a knockout).`);
      risks.push(`It pays for the stand: ${costText(e.cost)}.`);
      break;
    case 'limitBreak':
      effects.push(`Its next attack hits ${pct(e.damage)} harder and may use a stronger move of its type.`);
      risks.push(`The strain costs it ${pct(e.strain)} of its max HP.`);
      break;
    case 'rivalry':
      effects.push(`It hits ${pct(e.damage)} harder against this rival.`);
      risks.push(`If it turns reckless it hits ${pct(e.recklessDamage)} harder but ${costText(e.reckless ?? {})}.`);
      break;
    default:
      break;
  }
  return { effects, risks };
}

export function explanationKeys(def: StoryEventDefinition): string[] {
  const family = familyOf(def);
  if (!family) return [];
  return [`family:${family}`, `kind:${def.effect?.kind ?? def.id}`];
}

/** The first-time explanation for a moment, or null for ordinary story moments. */
export function explainMoment(content: Content, def: StoryEventDefinition): MomentExplanation | null {
  const family = familyOf(def);
  if (!family) return null;
  const { effects, risks } = effectLines(def);
  const rules = content.story.rarity.hyperRules;
  const limits = [
    def.cooldown === 'oncePerBattlePerPokemon' ? 'Once per battle for each Pokémon.' : def.cooldown === 'oncePerBattle' ? 'Once per battle.' : '',
    def.duration === 'battle' ? 'It ends when the battle ends.' : '',
    rules.minTurnsOnField[family] > 0 ? `A Pokémon must have been on the field ${rules.minTurnsOnField[family]} turns first.` : '',
    `Each earlier ${FAMILY_NAMES[family]} moment makes the next one less likely.`,
  ].filter(Boolean);
  return { family, title: def.displayName, why: whyText(def), effects, risks, limits, keys: explanationKeys(def) };
}

/** The explanation text as one block for the Continue screen. */
export function explanationText(x: MomentExplanation): string {
  return [
    FAMILY_IDENTITY[x.family],
    '',
    `Why: ${x.why}`,
    ...(x.effects.length ? ['', 'What it does:', ...x.effects.map((l) => `  ${l}`)] : []),
    ...(x.risks.length ? ['', 'The cost:', ...x.risks.map((l) => `  ${l}`)] : []),
    ...(x.limits.length ? ['', ...x.limits] : []),
  ].join('\n');
}

/** Which explanation keys the player still has not seen (empty: show the short notice only). */
export function unseenKeys(seen: readonly string[], x: MomentExplanation): string[] {
  return x.keys.filter((k) => !seen.includes(k));
}

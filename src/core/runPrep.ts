// Run-Prep (GAME_DESIGN.md §14.5, §14.7): starter pools and the Starter
// Laboratory, draft rules, preparation tokens, Bank licenses, loadout presets
// and the Run Build Summary. These choices open up options; none of them
// makes the player's Pokémon stronger.

import { isSpecialForm } from './specialForms';
import { directiveText } from './directive';
import { getMentor } from './mentors';
import { getArchetype } from './archetypes';
import { attributesLine, readAttributes } from './attributes';
import type { Archetype, Content, License, PrepToken, TypeName } from './contentSchema';
import { requirementProgress } from './progress';
import { masteredStarters } from './mastery';
import type { Rng } from './rng';
import { baseStatTotal, isNative, isWildEligible, wildEligibleSpecies } from './themes';
import { candyStart } from './candyShop';
import { bankTier, presetSlotCount } from './bank';
import type { LoadoutPreset, Profile, RunPrep } from './state';

// ---------- licenses ----------

export type LicenseStatus = 'owned' | 'buyable' | 'locked';

export function licenseStatus(profile: Profile, license: License): LicenseStatus {
  if (profile.licenses.includes(license.id)) return 'owned';
  if (license.unlock && !requirementProgress(profile, license.unlock).met) return 'locked';
  return 'buyable';
}

export function licenseProblem(profile: Profile, license: License): string | null {
  const status = licenseStatus(profile, license);
  if (status === 'owned') return `You already own the ${license.name}.`;
  if (status === 'locked') return `Not yet: ${license.unlockText}.`;
  if (bankTier(profile) < license.tier) return `Needs Bank tier ${license.tier}.`;
  if (profile.bankCredits < license.cost) return `You need ${license.cost} Bank Credits (you have ${profile.bankCredits}).`;
  return null;
}

/** Buys a license with Bank Credits. Returns a new profile. */
export function buyLicense(content: Content, current: Profile, licenseId: string): Profile {
  const license = content.licenses.get(licenseId);
  if (!license) throw new Error(`Unknown license "${licenseId}"`);
  const problem = licenseProblem(current, license);
  if (problem) throw new Error(problem);
  const profile = structuredClone(current);
  profile.bankCredits -= license.cost;
  profile.licenses.push(license.id);
  return profile;
}

// ---------- draft rules and preparation tokens ----------

export function tokenAvailable(profile: Profile, token: PrepToken): boolean {
  if (token.license !== null && !profile.licenses.includes(token.license)) return false;
  return !token.unlock || requirementProgress(profile, token.unlock).met;
}

/** Why a token can't be chosen yet, in plain words. */
export function tokenLockText(content: Content, token: PrepToken): string {
  if (token.license !== null) return `needs the ${content.licenses.get(token.license)?.name ?? token.license}`;
  return token.unlockText ? token.unlockText.charAt(0).toLowerCase() + token.unlockText.slice(1) : 'locked';
}

/** The choices a brand-new player gets: the full campaign, no token. */
export function defaultPrep(_content: Content): RunPrep {
  return { campaignId: 'full', tokenId: null, directive: null, license: null, loan: false, vaultItem: null, mentorId: null };
}

export interface ResolvedPrep {
  archetypeId: string;
  prep: RunPrep;
  /** Every choice that was no longer available and what replaced it. */
  problems: string[];
}

/**
 * Checks a trainer and preparation against what the profile has unlocked.
 * Anything no longer available (a missing trainer, pool, rule, type or token)
 * is replaced by the default and reported, so the player sees it before the run starts.
 */
export function resolvePrep(content: Content, profile: Profile, archetypeId: string, wanted: RunPrep): ResolvedPrep {
  const problems: string[] = [];
  const base = defaultPrep(content);
  const prep: RunPrep = { ...wanted };

  const archetype = content.archetypes.get(archetypeId);
  const trainerOk = archetype && archetype.available && (archetype.unlockedByDefault || profile.unlockedArchetypes.includes(archetype.id));
  const fallbackTrainer = [...content.archetypes.values()].find((a) => a.unlockedByDefault)!;
  if (!trainerOk) problems.push(`Trainer "${archetype?.name ?? archetypeId}" isn't available; using ${fallbackTrainer.name}.`);

  if (!content.campaigns.has(prep.campaignId)) {
    problems.push(`Campaign "${prep.campaignId}" doesn't exist; using the full campaign.`);
    prep.campaignId = base.campaignId;
  }
  if (prep.tokenId !== null) {
    const token = content.prepTokens.get(prep.tokenId);
    if (!token || !tokenAvailable(profile, token)) {
      problems.push(`The ${token?.name ?? prep.tokenId} preparation isn't available; going without.`);
      prep.tokenId = null;
    }
  }
  return { archetypeId: trainerOk ? archetypeId : fallbackTrainer.id, prep, problems };
}

// ---------- starting resources and the build summary ----------

/** A token's small attribute bonus, added to the run's starting modifiers. */
export function withTokenAttribute<T extends Record<string, number>>(content: Content, prep: RunPrep, mods: T): T {
  const a = prep.tokenId ? content.prepTokens.get(prep.tokenId)?.attribute : null;
  return a ? { ...mods, [a.key]: (mods[a.key] ?? 0) + a.amount } : mods;
}

export interface StartingResources {
  money: number;
  items: Record<string, number>;
}

/** Money and items at the start of a run: the base Bag, the trainer's signature items and the preparation token. */
export function startingResources(content: Content, archetype: Archetype, prep: RunPrep, candyPerks: readonly string[] = []): StartingResources {
  const items: Record<string, number> = { ...content.balance.startingItems };
  const add = (from: Record<string, number>) => {
    for (const [id, n] of Object.entries(from)) items[id] = (items[id] ?? 0) + n;
  };
  add(archetype.startingItems);
  const token = prep.tokenId ? content.prepTokens.get(prep.tokenId) : undefined;
  if (token) add(token.items);
  if (prep.vaultItem) add({ [prep.vaultItem]: 1 });
  const candy = candyStart(content, candyPerks);
  add(candy.items);
  const loan = prep.loan ? content.balance.bank.loan.money : 0;
  return { money: content.balance.money.startingMoney + (token?.money ?? 0) + loan + candy.money, items };
}

export function itemsText(content: Content, items: Record<string, number>): string {
  return Object.entries(items)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => `${content.items.get(id)?.name ?? id} ×${n}`)
    .join(', ');
}

/** The Run Build Summary: what this trainer and these choices add up to, in plain lines. */
export function buildSummary(content: Content, archetypeId: string, prep: RunPrep, attributes?: Record<string, number>): string[] {
  const archetype = getArchetype(content, archetypeId);
  const token = prep.tokenId ? content.prepTokens.get(prep.tokenId) : undefined;
  const campaign = content.campaigns.get(prep.campaignId);
  const res = startingResources(content, archetype, prep);
  const lines = [
    `Trainer: ${archetype.name}${archetype.title ? ` (${archetype.title})` : ''}`,
    ...archetype.pros.map((p) => `  + ${p}`),
    ...archetype.cons.map((c) => `  − ${c}`),
    ...signatureLines(content, archetype),
    `Campaign: ${campaign?.name ?? prep.campaignId}`,
    'Starters: your Remembrance quiz picks, three regions',
    `Preparation: ${token ? `${token.name}, ${token.description.charAt(0).toLowerCase()}${token.description.slice(1)}` : 'none'}`,
    `Start with: ₽${res.money}; ${itemsText(content, res.items) || 'an empty Bag'}`,
    ...(prep.mentorId && getMentor(prep.mentorId) ? [`Mentor: ${getMentor(prep.mentorId)!.name}, ${getMentor(prep.mentorId)!.teaching.charAt(0).toLowerCase()}${getMentor(prep.mentorId)!.teaching.slice(1)}`] : []),
    ...(prep.directive ? [directiveText(content, prep.directive)] : []),
    ...(prep.loan ? [`Bank loan: +₽${content.balance.bank.loan.money}; finish with ${content.balance.bank.loan.badges}+ badges or the Bank takes ${content.balance.bank.loan.penalty} credits.`] : []),
    ...(prep.vaultItem ? [`From the Vault: ${content.items.get(prep.vaultItem)?.name ?? prep.vaultItem}`] : []),
  ];
  if (attributes) lines.push(`Attributes: ${attributesLine(readAttributes(content, attributes))}`);
  return lines;
}

/** The trainer's identity in words: signature types and Pokémon. Empty for trainers without one (Red). */
export function signatureLines(content: Content, archetype: Archetype): string[] {
  const parts: string[] = [];
  if (archetype.signatureTypes.length > 0) parts.push(archetype.signatureTypes.map(typeName).join('/'));
  const names = archetype.signatureSpecies.map((id) => content.species.get(id)?.name ?? id);
  if (names.length > 0) parts.push(names.join(', '));
  return parts.length > 0 ? [`Signature: ${parts.join(' · ')}`] : [];
}

/** "fire" → "Fire". */
export function typeName(type: TypeName): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// ---------- loadout presets ----------

/** Stores a loadout in a preset slot. Returns a new profile. */
export function savePreset(content: Content, current: Profile, slot: number, preset: LoadoutPreset): Profile {
  if (slot < 0 || slot >= presetSlotCount(content, current)) throw new Error(`There is no preset slot ${slot + 1}`);
  const profile = structuredClone(current);
  while (profile.presets.length <= slot) profile.presets.push(null);
  profile.presets[slot] = structuredClone(preset);
  return profile;
}

export function presetIn(profile: Profile, slot: number): LoadoutPreset | null {
  return profile.presets[slot] ?? null;
}

/** A preset's trainer and preparation, split apart. */
export function presetParts(preset: LoadoutPreset): { archetypeId: string; prep: RunPrep } {
  const { name: _name, archetypeId, ...prep } = preset;
  return { archetypeId, prep };
}

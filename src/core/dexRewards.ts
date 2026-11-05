// Dex Completion Rewards (S239): tiered one-time rewards for species caught across all runs.
import type { Content } from './contentSchema';
import type { Profile } from './state';

/** Species caught at least once across all runs. */
export function dexCaughtCount(profile: Pick<Profile, 'mastery'>): number {
  return Object.values(profile.mastery).filter((m) => m.caught > 0).length;
}

/** Pays every tier reached and not yet claimed (mutates `profile`, once each through the claim ledger). Returns the titles gained. */
export function claimDexRewards(content: Content, profile: Profile, now: string): string[] {
  const dex = dexCaughtCount(profile);
  const gained: string[] = [];
  for (const r of content.balance.dexRewards) {
    const key = `dex:${r.dex}`;
    if (dex < r.dex || profile.claims[key]) continue;
    profile.claims[key] = { at: now };
    profile.bankCredits += r.credits;
    profile.lifetimeBankCredits += r.credits;
    profile.researchPoints += r.rp;
    if (!profile.titles.includes(r.title)) profile.titles.push(r.title);
    gained.push(r.title);
  }
  return gained;
}

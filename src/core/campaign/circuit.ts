// Story Overhaul S4: campaign-level rules the Orrery Circuit needs (Appendix S.7). Pure helpers, no RNG.
import type { Campaign, Content } from '../contentSchema';
import type { RunState } from '../state';

/** `evil.nextAt` while beat 7 waits for League entry (hideoutAtLeague): no stage count reaches it. */
export const HIDEOUT_AT_LEAGUE = 9999;

/** True when this region ends in a Pokémon League (every region, unless the campaign lists `leagueRegions`). */
export function leagueAfterRegion(campaign: Campaign, regionIndex: number): boolean {
  return !campaign.leagueRegions || campaign.leagueRegions.includes(regionIndex);
}

/** The Evil Team storyline config for this run: the campaign's override over the global evilTeams.json config. */
export function evilConfig(content: Content, run: Pick<RunState, 'campaignId'>): Content['evilTeams']['config'] & { hideoutAtLeague: boolean } {
  const override = content.campaigns.get(run.campaignId)?.evil;
  return { ...content.evilTeams.config, hideoutAtLeague: false, ...(override ?? {}) };
}

/** True for a Story Run campaign (mode 'story'). */
export function isStoryCampaign(content: Content, campaignId: string): boolean {
  return content.campaigns.get(campaignId)?.mode === 'story';
}

# Stage length (30 nodes default, setting −10 to +20)

- New setting `expansion.stageLength` (−10..+20, default 0): a run plays 30 + setting nodes per stage (20 to 50). Read when a run starts and stored as `run.expansion.stageCols`. Runs saved before this have no `stageCols` and keep 20, so no save version bump (the new fields are optional/defaulted). Short test campaigns and Story campaigns keep their own length.
- `runCampaign(content, run)` (core/regions.ts) replaces `getCampaign(content, run.campaignId)` everywhere a run is in hand; it carries the run's length and stretched trainer-column ranges. The level curve (`levelScale`, `stageLevelCap`) already spreads across `campaign.columns`, so it follows.
- Stage pacing: windows and trainer-column counts stretch (4–5 on 20 nodes, 6–8 on 30). The first rival's column, event placement steps, and the rival questline steps scale by `scaleColumn` / `stepColumn`.
- Per-stage, per-region and per-run limits stretch with `scaledCap` (core/stageLength.ts): story-event quota, event stops per stage, obstacles, moment caps, heated moves, vows, nemeses, legendary gates, rival step-ins, interference, rival news, node-menu spoils. Per-node odds (heal/shop side stops, step-in chances) are unchanged, so longer stages simply have more of them.
- Not scaled on purpose: per-battle caps (heals 10, revives 6), blessing powers per stage, the level range per region.
- Tests: tests/unit/stageLength.test.ts.

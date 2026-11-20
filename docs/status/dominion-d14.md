- **DOMINION slice D14, "four takeover paths + Goals"** (Evil Mode rework, 2026-11-20; build plan `/mnt/project-files/plans/evil-mode-rework/BUILD_SLICES.md`, design Part 5 §1-2, list `lists/takeover-bonuses.md`, Goals from Part 35 (`goals/evil-mode` in the director's upload), mockups v4 s9 and m13): the Boss can now actually take Kanto, four ways, and the region hears about it on every TV.

## What's built
- **Data** `src/data/dominion/takeover.json` (shape `TakeoverFileSchema` in `schema.ts`), made by `tools/dominion/takeover-to-json.py` from the lists and the Goals doc:
  - The four paths with Kanto's numbers (Part 5 §1), the League (Lorelei, Bruno, Agatha, Lance, Champion Blue; when Blue is the Hero, Lance is Champion and Karen joins the Four).
  - 483 Holdings from takeover-bonuses.md: Kanto's 51 are live (14 supported, 37 limited with a note each); the other 8 regions' 432 are listed, disabled, waiting for D15. 14 sets (Kanto's 4 live).
  - The 14 Goals: Track name, 5 stages with Turning Point scenes, endings (kept for D17), Cost, Opposition and its fight, and what feeds the Track.
  - 32 Boss actions that waited for D14 now play (485 of 600 with the other slices): the League rows (study, sway, duel the Elite Four and the Champion), the four Plans, Final Stand Prep, Takeover Speech, Pirate Radio (87) and Meet the Champion (128). 485 of 600 actions play now.
  - 6 crew tasks of kind `takeover` (Plan the Heist of the Year, The Quiet Coup, Project Lead, Region Plan, Crew Council, Carry the Torch) in `tasks.json` (via `lists-to-json.py`).
- **Rules** `src/core/dominion/takeover.ts` (World Turn end step and `field.ts` hooks, no import cycles):
  - **Paths**: Wipe Out (every Rocket site, Admins gone, Giovanni beaten at his HQ), Shadow (Regard 60, 5 businesses with Silph Co. and the Game Corner, Wanted at 39 or lower, 4 Gym Leaders in pocket, Champion bought), Monarch (8 Gyms or 75% held, the League beaten, a Citadel HQ, Dread 70), Goal (Track 100 and the Moment won). The first finished path wins: the Hero's final stand is called (D11); beating it leaves the region **Taken**. The Shadow cracks if Wanted passes 60 afterwards.
  - **Goal Track**: each night the empire's gains (Gyms, businesses, held towns, Holdings, sites, the League, crew, Pens, Regard, Dread) feed the Track by the Goal's weights, capped per night. 20/40/60/80 are Turning Points (a card on the Takeover page). The **Cost** rises with the Goal's own costs, warns at 8 (Heat), and at 10 the Opposition strikes (Track −5). At 100 the **Moment**: a battle against the Opposition (win: done; lose: Track −10). Pure Hate has no finish line.
  - **Holdings**: Buy out, Buy, Infiltrate (3 scouts first), Seize (a fight, then hold for days while rivals may hit it), Raid (3-6 fights), Annex a town (after its other places). Upkeep 3% of price a week; unpaid ones lose Condition; angry rivals hit one a week; 0 Condition loses it. Weekly bonuses (income, Regard, Dread, cooling, Loyalty, healing the hurt, recruits, Pokémon and items to the Reserve, training, intel, +odds on jobs) and set bonuses.
  - **Storm the rival HQ**: once all but the HQ site are yours, every Admin left and then the Boss, one fight after another.
  - **Plans**: each Plan point takes one Pokémon off the Hero's final stand (6 down to 4).
  - **Broadcast**: a town reaching Owned, an Annex, the region Taken and Pirate Radio queue the hijacked broadcast.
- **Screens** `src/ui/redux/screens/dominion/takeover.ts`, models `src/core/dominion/takeoverScreens.ts`, controller `src/scenes/dominion/takeoverController.ts`:
  - **s9 Takeover** (K from the HQ, map or Ledger): the four path cards with dials and what's left, the lead card crowned, the rib, alerts (Cost, seizures, attacks, the Moment), the CTA (next fight / face the Moment (M) / storm the HQ (S) / Holdings (P)), the Hero's file pinned up (shared with the Hero page), and the Turning Point card.
  - **Holdings** (P): every Kanto place, yours first, with why one can't be taken yet; Enter or a click takes it.
  - **m13 the hijacked broadcast**: plays once per town (or the region) the next time the Boss looks in; Enter skips.
  - Fights come back to the Takeover page; a chain's next fight waits on Enter (also on the map for League fights started from the Card).

## Limited (honest list)
- Holdings marked limited name what's simplified in their note (battle-only bonuses like type damage, shop prices, fast travel, legendary rumours wait for D15/D17).
- Goal endings are stored but the ending scenes are D17. Each Goal shares one frame (Track, Cost, Moment); Goal-specific screens (Org Chart, Ledger of Tides etc.) are not built.
- Pirate Radio levels all play the same clip; Meet the Champion's stand-down offer isn't acted on.

## Saves
No version bump: `block.takeover` is optional and made on first need (tested with a save without it). New streams: `dominion-holding::<day>`, `dominion-holding-catch::<id>::<day>`. No existing roll moved.

## Tests
- `tests/unit/dominionTakeover.test.ts` (19): data and statuses, every line written and no "Claude"/"AI" in game text, paths (Wipe Out to Taken, broadcast queued), Plan points on the stand, Goal Track feeding and Turning Points, the Moment won and lost, Cost strike, Holdings (buy, seize over days, every refusal), broadcast once, saves old and new, damaged block fails, determinism.
- Updated counts in `dominionField`, `dominionEmpire`, `dominionGrowth` (more actions play).
- `tests/e2e/dominionTakeover.spec.ts`: K opens s9, Turning Point, Holdings buy, broadcast shown and skipped, three window sizes, the Moment starts a trainer battle; no console errors.

## Next
D15 (other regions: their Holdings switch on), D17 (Goal endings and balance).

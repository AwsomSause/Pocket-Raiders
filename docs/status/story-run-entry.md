# Story Run entry on the title menu

- Title menu "Story Prologue" is now **Story Run**. It plays the prologue (or, once finished, Vance's Short Intake with a new "Begin the Story Run" option), then Trainer Select, then the Preparation Desk with the new **Story Run** mode (`runRules.json` `story-run`, `campaignId: orrery-circuit`). The mode forces the Orrery Circuit and counts for progress (`campaignCounts` via the mode), so no debug URL is needed. Story Run also shows in the Desk's Mode list. Replaying the prologue stays in the Short Intake.
- Prologue departure no longer says the rest "arrives in later updates"; Beats 5-9 are still skipped (next slices).
- No save changes. Tests: `tests/unit/storyRunMode.test.ts` (3), `tests/e2e/prologue.spec.ts` (Story Run chain), title labels in `runPrepSlots.spec.ts`.

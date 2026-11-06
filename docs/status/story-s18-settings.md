# Story Overhaul S18: Story settings section

- New **Story** category in Settings (data-driven, so the title screen and Hub both show it): Story intensity, Dramatic moments, Pokémon autonomy, Romance (greyed: "Off (not available yet)", cannot change), Camp activities, Reduce motion (a shortcut that sets Animation intensity to Reduced and Reduced flash on, and shows their state), Subtitle size, Subtitle style (also listed under Accessibility), Spoiler guard, Journal voice. They read and write `settings.story` (settings v39 from F0). Story settings never change the accessibility profile.
- The settings are stored only; the story systems that read them (Moment Director gate, autonomy offers, subtitles, camp scenes) arrive with their own slices. Quick Start is a per-save prologue record, not a setting (`profile.story.prologue.mode`).
- Tests: `tests/unit/storySettings.test.ts`; `settingsRegistry.test.ts` maps `story*` ids to the `story` object. Playwright `milestone9` and `optionsBackdrop` pass.
- Not done: the long-string layout test (needs story text on screen) and color-blind cues for the story screens.

# Story S13 (2 of 8): Lore Archive

- `core/story2/loreView.ts`: 11 categories, found/total counts from the data, entry states (hidden/rumor/known/verified/contested) from `profile.story.lore`; unfound entries show "???"; a rumor shows its first sentence; contested shows every reading; spoiler entries stay masked on a rumor while the Spoiler guard setting is on.
- `ui/loreArchiveMenu.ts`: category list, then entry list (details in the footer). Opens from the Hub "Tales & News" room as a first row "Lore Archive n/m"; the old tales list is unchanged below it.
- Limits: category names follow the design doc's list order; no search or region filter; no side-by-side view for contested entries (readings joined in the footer); the old `npcMemory.lore` array is not yet merged into `profile.story.lore`; nothing writes lore states yet (comes with events and news).
- Tests: `tests/unit/storyLoreView.test.ts`.

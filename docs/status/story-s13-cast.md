# Story S13 (3 of 8): Character Database

- `core/story2/castView.ts`: characters with a `profile.story.cast` record and at least one run. Name, role/age/home, "seen N runs", your win/loss count against them (a statistic, not rival memory), tellings seen plus "??? (n left)", and bio tiers (tier N shows after N runs, otherwise "???"). Complete = all tiers earned and no tellings left. Records for unknown ids are skipped.
- `ui/castMenu.ts`: list with details in the footer. Opens from the Hub "Tales & News" room as a second row under the Lore Archive row (no new Hub room, so the room list and its tests are untouched).
- Limits: no filter, tab strip or character links; the unlocksLore reward for a complete entry isn't wired; nothing writes cast records yet except the end-of-run fold helper (S8, not yet called).
- Tests: `tests/unit/storyCastView.test.ts`.

# Story S13 (1 of 8): Relationships page

- `core/story2/relationshipView.ts`: rows for met characters only (name, stage, 5-pip bars for non-zero attributes, newest 4 memories, consequence ids as words), sorted by stage. The [!] pulse uses `run.story.flags['sv2:rel_seen:<id>']` (stage rank + 10); opening the page clears it. No save bump.
- `ui/relationshipsMenu.ts`: Picker list; the focused row's footer shows bars, memories and what it could lead to. A "People" button appears in the map menu only when `run.story.v2` exists (Story Run).
- Memory text comes from `mem.<tag>` text keys when present, otherwise the tag in plain words.
- Limits: single list with details in the footer (not the two-pane wireframe); no "Open in Cast DB" until the Character Database exists; no Playwright test yet (needs a Story Run to start, S4/S5).
- Tests: `tests/unit/storyRelationshipView.test.ts`.

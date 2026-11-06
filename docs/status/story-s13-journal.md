# S13: Story Journal (Field Notebook)

- New **Notes** button on the map menu in a Story Run (Classic runs don't see it). It lists: the route (stops done / planned), each story arc with its state (paused arcs say "Arc Paused"), and the scenes seen this run, newest first. The footer hint shows the detail.
- Reads `run.story.v2` only (stops, arcs, module snapshots). Display only; no save bump.
- Files: `core/story2/journalView.ts`, `ui/journalMenu.ts`, MapScene option + button. Not browser-checked.
- Not built yet: the nine design tabs, current-quest line, Retrospective Replay annotations after the rival reveal, "Replay opening".

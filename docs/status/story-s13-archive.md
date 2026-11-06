# S13: Story Archive screen

- Hub "Tales & News" now has a **Story Archive** row (only once a scene has been saved). It lists scenes from past Story Runs, newest first (the profile keeps 60). The footer hint shows the scene text and what you chose.
- Reads `profile.story.sceneSnapshots` (written by S5). Broken records are skipped. Display only; no save bump.
- Files: `core/story2/archiveView.ts`, `ui/storyArchiveMenu.ts`, HubScene row. Not browser-checked.
- Story Journal still to do (needs the run's arcs and facts, not just snapshots).

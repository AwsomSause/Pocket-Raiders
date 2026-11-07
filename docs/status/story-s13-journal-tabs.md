# Story S13: Journal tabs

Field Notebook now opens a tab list: Main Story, Character Quests, Rival Story, Backstory, Route Changes. Only tabs with something to show appear (Main Story always does). Main Story starts with a "Now" line (active arc, else next stop).

- `src/core/story2/journalView.ts` (`journalTabs`, `currentObjective`), `src/ui/journalMenu.ts`.
- Display only, no save change.
- Not built (no data in the run yet): Pokémon Story, Optional, Mysteries board, News, Adaptation Log, Retrospective Replay, "Replay opening". Tabs for these come with their systems (S7/S11/W).
- Not browser-checked.

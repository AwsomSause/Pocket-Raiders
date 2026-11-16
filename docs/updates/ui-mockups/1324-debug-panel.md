# #1324 New UI: the debug panel (F2)

**Player gets:** (a developer tool: it only exists in dev mode or with `?debug=1` in the address)
- In the New look, **F2 opens the mock-up's debug window** at the top left: Scene, Seed, RNG stream and FPS, then six tags (Scene jump, Story log, Asset viewer, Moment viewer, Save creator, Extended Cut).
- A click on a tag unfolds that tool under the tags; a click on the open tag folds it again. All the old tools are there: the run summary and jumps, heal, add a Pokémon, give an item, new run with a seed, the story log, the icon gallery and asset problems, the moment viewer and "force an event".
- Two tools are new buttons: **Save creator** opens the Save Creator page in its own tab, and **Extended Cut** jumps the run into the Extended Cut climax (before, that was a console command).
- The Scene and FPS lines stay current while the window is open, so the small frame meter in the corner steps aside until it closes.
- Fixed: a random stream's state could print as a negative number.

**Save:** none.

**Limits:**
- The game keeps each random stream's state, not a count of its rolls. So "RNG stream" shows the stream that rolled last and the start of its state (for example `battle #1a2b3c4d`) where the mock-up shows a roll count.
- The Old look keeps its long panel at the right, unchanged.

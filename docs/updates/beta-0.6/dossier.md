# Dossier (E1)

## Player gets
- A Dossier on the map: press **D** (or click "D: dossier") once the run has met someone from the cast. Kice's pick: Case Folders (8) with the Org Pyramid (4).
- One folder tab per team. Each case file shows the person's sprite (a dark shape where the game has no sprite yet), a mark (canon / what-if / original), a status (at large / beaten / turned / ally), rank and tier, the "Overheard" voice line, a note, and their ace (shown as ??? until you have beaten, turned or befriended them).
- The chain of command (T0 to T7) for the open folder; click a name to open that file. Left/Right changes folder, Up/Down changes person, D or Esc closes.

## Save
- None bumped. New optional `run.expansion.dossier` (`sc.*` id to status and when first met). Older runs have none and load untouched. No RNG used.
- New event effect `{ "kind": "cast", "id": "sc.…", "status"?: … }` meets a character or changes their status; meeting twice changes nothing, an unknown id does nothing.

## Who gets met (a normal Kanto run fills several files)
- Kanto story events: The Appointment (Matori), Harbor Export (Major Surge), The Riddle Without a Joke (Blaine, an ally), The Phone in the Basement (Madame Boss), Growlie (the Trio). Also the Cinnabar lab (Namba), the Ein scene and the Rainbow Rocket scene.
- Kanto canon spaces: Mt. Moon (Griggs), S.S. Anne (Surge), Game Corner (Vesper), Celadon Mansion (Matori), Safari (Rudd, Koga), Silph and the Labyrinth (Sabrina), Cinnabar Lab (Namba, Blaine).
- Kanto's Rocket Ledger: step 1 Matori, 2 Vesper, 3 Surge, 4 Rudd, 5 Madame Boss.
- A story raid (any result but declined) meets the team's Executives and above. Joining Rocket as the Inside Man adds your own file; an Inside Job with a Side-with rival adds the rival's.
- Beaten: winning a gym, Elite Four or Champion fight against Sabrina, Koga, Lt. Surge or Blaine; a won story raid (triumph or success) beats the team's Executives and Seconds; winning a climax fight beats the run's team's Executives and Seconds. An ally or a turned character is never changed by a win. The team's Leader is beaten when the story's last beat arrives (after the final climax fight is won).
- Tables live in `src/core/expansion/cast/meet.ts`; a test checks every id is a real character.

## Limits
- Only Rocket's Kanto cast is wired; other regions' characters are added as their slices land (use the `cast` event effect or the tables above).
- "Turned" is set only by the `cast` effect so far; everyone starts at large (Blaine starts as an ally). A climax win marks the heads beaten on the first won climax fight, not only the last.
- A story raid now also writes `run.expansion.dossier` (its own block, not one of the lever blocks); the raid test was updated to say so. Raids are still not offered on the live map.
- Sprites exist for only a few characters; the rest show a dark shape.
- Checked by unit tests (`tests/unit/dossier.test.ts`, raids, rescue, canon, track, content) and the browser test `tests/e2e/dossier.spec.ts` with a screenshot.

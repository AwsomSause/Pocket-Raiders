- **DOMINION slice D7, "the Founding and team colours"** (Evil Mode rework, 2026-11-19; build plan `/mnt/project-files/plans/evil-mode-rework/BUILD_SLICES.md`, design Part 9 A15, Part 6 §8, Part 11, Goals from Parts 35a-c): the crew starts as Unnamed Crew with plain grey armbands. Once both First Steps are done and the town calls them a Street Gang, the HQ shows **THE FOUNDING** (key O, or tap). The player names the team, picks two colours, an initial and a mark, a motto and a Goal; the sign goes up on the door and every member wears the team's colours and armband.

## What's built
- **Data** (validated in `schema.ts`, loaded in `data.ts`):
  - `src/data/dominion/founding.json`: name rules (14 letters, canon team names taken), the words for the six suggested names, 14 colours, 6 marks, motto ideas, the **fourteen Goals** of Part 35 (name, one line, quote) plus "Rule" (no Goal), band colours and every line.
  - `src/data/dominion/armbands.json`: for all 28 crew pictures (Rook and the 27 trainer classes recruits use), the outfit's primary and secondary colours, the shoulder line, and the armband's 7 rows on the upper arm. Made by `tools/dominion/armbands/build.py` (the Part 11 tool, `armband.py`, plus the build script). Every anchor was placed by hand on a zoomed grid and checked on a proof sheet (`/mnt/project-files/plans/evil-mode-rework/armbands/proof-dominion-crew.png`).
- **Rules** in `src/core/dominion/`:
  - `founding.ts`: when the Founding opens (both First Steps + Street Gang reached; stays open if Notoriety dips), six names from the run's record (the two Team Types, the Boss's best Edge stat, the Boss's lead Pokémon, the HQ town, Dread or Regard), the draft checks, the `found` action, the scene's lines. No random stream.
  - `teamLook.ts`: the colour swap (each outfit shade keeps its place in the shading and takes the team colour's hue: Part 11 §3; hair above the shoulder line kept) and the armband painted into the sleeve's own pixels (dark cuff rows, 3x5 letter). Primary band with the initial in the secondary (Part 6 §8); when the sleeve is already the primary after the swap, the band flips to the secondary so it shows. Before the Founding: grey band, no letter, own colours.
  - The step that opens the Founding says so (once).
- **Screens** (`src/ui/redux/screens/dominion/founding.ts`, round-4 skin, form built from mockup 13's "new squad" panel: field with letter counter, ideas line, mark picker, armband preview with rays): the Founding page (Name, Primary, Secondary, Initial, Mark, Motto, Goal, Found the team) with a live preview of the door, the armband and Rook in the new colours; the scene when the sign goes up (Rook ties his armband on: "...Huh. It's on the door now. That's real, then."; an Admin has their own line).
  - Keys: ↑ ↓ row, ◀ ▶ change, Enter types into Name or Motto (letters, space, ' and -; Backspace; Enter or Esc to finish), Enter on Found the team, Esc = later. No Q (the wheel's).
  - `teamPic.ts` builds each crew picture in the team's colours on a canvas (cached; the plain picture shows until it's ready or if anything fails). Used on the HQ (Rook and his card), the Morning (strip and Grunt Info), the Crew File and the opening.
  - The emblem on the top bar (team colours, the chosen mark's shape) and on the title card's tower; the armband chip on member cards.

- **Fix (all screens):** Phaser hands every key event still queued in a frame over again each time a new one arrives, so two quick presses inside one frame counted three times (seen when typing the name and stepping rows). `onInputAction` (`src/ui/input.ts`) and the Dominion scene's own key handler now count each DOM key event once.

## Saves
No version bump: `block.team` is optional (absent until the Founding), `teamName` keeps the name as before. A D6 save loads unchanged and can still found (tested).

## Tests
- `tests/unit/dominionFounding.test.ts` (21): the data (14 Goals, colours, armband data for every crew picture, anchors inside the picture); when the Founding opens (shut on Day 1, with only the steps, with only Street Gang, one step below; open with both) and the line said once; founding refused before it opens; the six names (deterministic, none taken or too long); every draft check (normal, boundary, failure); founding sets team, top bar, emblem, armband, only once; a bad draft changes nothing; the scene's lines (Rook, Admin); HLS maths matching Python; shading order kept; hair and skin kept; grey band before; letter and the flip after; no anchor = no band; pure; save/reload, pre-D7 save, damaged team refused, determinism.
- Browser `tests/e2e/dominionFounding.spec.ts`: grey band and blank emblem before, O says why it's shut, the banner at Street Gang, the page (ideas, ▶ name, typing a name, colours by key and tap, Goal), a taken name refused, three window sizes, the sign goes up, the HQ in the new colours, reload and the title tower.

## Limits
- **Armband on the sprite: 6 of 28 pictures** (Rook, whom every hired Grunt uses, plus Ace Trainer ♂, Beauty, Veteran ♂, Depot Agent, Waiter). The other 22 trainer pictures hold their arm out, up, folded or hidden in the frame the game shows, so the finder put bands on hair and chests; they get the colour swap and the armband chip on their card, and no band on the picture rather than a floating one (Part 11 §4.5). Kice's PixelLab "Arm-Band" sprites (still to be exported) replace this.
- Only frame 0 of a trainer atlas is drawn on these screens, so only it is recoloured.
- The Boss isn't drawn as a member on any Dominion screen yet, so the Boss's armband waits for a screen that shows the Boss.
- Squad Marks on the band are D8's (Part 10). Goals are stored; the Goal tracks, costs and endings are D14.
- The colour swap is automatic per sprite; a few small props in the outfit colours change too (the Waiter's tray). Kice can mark any of them for a hand fix in `ROLE_FIX` in the tool.

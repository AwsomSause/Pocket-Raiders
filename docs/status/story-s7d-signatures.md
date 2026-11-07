# Story S7d: signature moves for all 74 starter lines

Status: supported (Story Run only).

## What it does
- Every Remembrance line (74) has a Signature I, a Signature II and a Keystone upgrade of Signature I: 222 moves.
  Source table `tools/story/signature-roster.tsv`; `npm run data:story-sigs` builds `src/data/storySignatureMoves.json`
  (flag `storysig`, kept out of Metronome and random move pools) and gives each move a battle animation donor in `moveAnims.json`.
- Only the run's partner learns them (`src/core/story2/signature.ts`):
  - Signature I: Heartbond 3 latched and a won boss, Gym, Elite, Champion or rival fight the partner fought in.
  - Signature II: Heartbond 7 latched and the line's Starter arc (`arc_<Remembrance id>`) done; learned at a Recovery stop.
    No Starter arcs are written yet, so for now Heartbond 7 alone unlocks it; the arc check turns on once an arc exists.
  - Keystone: when the Keystone Memory is ready, Signature I turns into its upgrade (keeps the player's name for it).
- Learned moves are stored in `story.v2.sigMoves`. Each battle they join the partner in extra slots (`storySig`, marked ✦ in the
  move menu) and leave when it ends, so the four normal moves are never touched. PP refills every battle.
- Naming: Pokémon menu > Care > "Name its move" (a text prompt, like Nickname). 3 to 20 characters, bad-word filter, no official
  move or Pokémon names. First name free, then one rename a run. Battle text shows the chosen name for your side.
- Balance: power 40 to 95 (Keystone up to 105, multi-hit counted in total), accuracy 85 to 100, 5 PP (a Keystone with nothing else
  to improve gets 8 PP).

## Tests
`tests/unit/storySignature.test.ts`: data for all 74 lines, caps, each unlock, the Keystone swap and name carry, slots added and
removed (and a save round trip), a real boss win teaching Signature I, every one of the 222 moves used for a turn, naming rules and
the battle line.

## Limits
- No save bump: `sigMoves` and `sigNames` default to empty in older saves.
- No Starter arcs exist yet (Signature II falls back to Heartbond 7 alone until they do).
- The naming prompt is the browser text prompt, not a custom keyboard screen.
- Move menu can hold 8 moves (4 + Hyper + Mega + 2 signature); with 7 or 8 the buttons get smaller.

# Player characters: Nate and Hilda only

- Trainer select now shows only Nate and Hilda (both unlocked from the start). Other trainers stay in the data for old stats and saves but can't be picked.
- A run saved as any other trainer loads as Nate or Hilda (fixed by the old id, so it never flips). New runs asked for another trainer (seed codes, debug) do the same.
- Player ball-throw sprites are back on send-outs (singles and doubles); reverts "Send-outs: no player throw animation". Nate and Hilda use their own back sprites.
- Removed the "Look B coming soon" text and menu entry in the prologue, and the "Look wanted" profile line.
- Tests: `tests/unit/playerTrainers.test.ts`; `trainerSprites.spec.ts` waits for the Hilda throw pose again.

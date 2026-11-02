# Run events K (R506-R560): run-wide modifiers and meta

Data: `tools/events/rk.ts` -> `npm run data:rk-events` -> `src/data/eventsRK.json` (merged into `events` in `src/data/index.ts`). Test: `tests/unit/eventsRK.test.ts`. No new assets (no provenance rows).

## Built (67 event defs, incl. rooms and callbacks)
R506 Lucky Streak (3 rooms), R507 Curse Lottery, R508 Pact Booth, R509 Rule Board, R510 Lucky Number, R513 Risk Dial, R515 Fate Cards, R516 Mood Swing, R518 Shadow Boon, R519 Echo Item, R520 Crowd Poll, R521 Chaos Dial, R522 Hidden Quest Giver (+callback), R523 Sealed Letter (+callback), R524 Reversing Mirror, R525 Rest Day, R526 Birthday, R527 Holiday Surprise, R528 Free Pick Altar, R529 Altar of Swaps, R530 Draft Pool, R531 Reroll Shrine, R532 Skip Token, R533 Redo Ticket, R534 Probability Mage, R535 Team Banners, R536 Anniversary Archive, R538 Coin Vault, R539 Legacy Pedestal, R540 Hall of Records, R541 Memory Lane, R542 Pocket Closet (+3 callbacks), R543 Bounty Hunter, R544 Third Wheel, R545 Crossroads of Four (4 rooms), R546 Sunk Cost, R547 Perfect Day, R548 Terrible Day, R549 Twin Nodes (2 rooms), R550 Counting Sheep, R551 Reverse Fountain, R552 Interview, R553 Census, R554 Daily Puzzle, R555 Elevator (4 rooms), R556 Treasure vs Trap, R557 Stranger's Dice, R558 Shifting Map, R559 Mastery Echo, R560 Final Curtain.

## Already existed (skipped)
R511 `oath-shrine`, R512 `debt-collector`, R514 `insurance-agent`, R517 `time-capsule`, R537 `contract-desk`.

## Limited (closest existing run effect; documented, not faked)
- R510 Lucky Number: one roll for a lasting luck relic (not a per-hit bonus).
- R513/R521/R548 "next fight / next event" effects are in-event (a fight, random doors, a reward) since no "next node" hook exists.
- R524 Mirror: reverses health and gold, does not replay the previous event.
- R531 Reroll Shrine: opens a random side room and reveals stops; it does not re-roll the map.
- R532 Skip Token: `express` (jump two columns), one use per event.
- R533 Redo Ticket: a Survival relic (a chance a fainting Pokemon stays up), not a battle retry.
- R534 Probability Mage: previews only (preview relics, gym team); never touches gameplay RNG.
- R538/R539/R540: pay Research Points (paid at run end) or recover a keepsake; no new cross-run store.
- R527 Holiday: uses the run calendar's season, not the real-world date. R554: skill prompt, not a date seed. R559: Clarity blessing plus Research.
- R558 Shifting Map: `stopShuffle` every 3 nodes.
- R526 Birthday needs a milestone day; R536 needs stage 4+.

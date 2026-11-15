# Part 2 re-read (NE26 to NE50), 2026-11-15

Built in `tools/events/co/new-events-2.ts` (50 scenes). Checked every choice, Remembers, reward and Afterstory against NEW_EVENTS_2.md.
Old rival ids kept and overridden: NE36 `rq-empty-slot`; NE37 `rq-help-wanted` + `rq-old-man-sign`; NE38 `rq-letter` + `rq-letter-read` + `rq-old-man-stands`; NE39 `rq-swap-day` + `rq-swap-day-handback`; NE40 `rq-asks-you-to-lose` + `rq-dont-you-dare` + `rq-hand-sewn-jersey`. NE36 to NE40 use the stage's rival slot (`rivalQuest` `slotFree` / `takeSlot`).

Fixed in this pass: NE39 Swap Day is a real swap now (new `teamSwap` effect and `swapReady` condition, core/co/swap.ts): the rival's team fights for you until the hand-back scene, and the teams always go back before a Gym, Elite Four or Champion and at a new stage; a fainted rival Pokémon sets `swap-fainted` (Trust −1 instead of +2 and the ace's fondness). NE31 and NE35 no longer need an earlier run (Kice: no memory across runs); NE31 "Come with me" gives a tag partner for 3 battles. NE41's last case names the final region (`{finalRegion}`). NE44 no longer names 18 types by branch (only a later run used the type). NE32 item id `nevermeltice`. NE50 tag fixed.

All built, except (needs engine, not faked):
- NE27 your lent Pokémon as her Gym ace, Gym changes by answer; NE28 Champions notice the kept trophy; NE29 the wedding battle is one-on-one with a Leader at your side in text (no ally slot in event battles), and the double-battle days; NE36 the Stone on the Hill's second stone (rivals); NE38 burnt letter's new ace move; NE39 the rival's ace hesitating; NE40 rival home for a stage; NE46 Ghost-types stay away for the region, not the run; NE47 sending an item ahead; NE49 +5% PA1 chance.
- Cross-run (left out by Kice's rule): NE26 Swimmer, NE31 last run's held item and the coat in later runs, NE34 Youngsters, NE43 next-run gift, NE44 real Gym, NE45 earlier runs' notes.
- Remembers with no flag to read: NE30 `starter.home`, NE33 `kind.walked_past`, NE41 "robbed a trainer". NE27's SF8 line left out (SF8 is "The Old Ranger").
- Needs art: Caoimhe, the two wedding Leaders, Roderigo, Perpetua (casts use stand-in trainer classes that exist).

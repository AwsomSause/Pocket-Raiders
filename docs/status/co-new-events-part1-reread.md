# Part 1 re-read (NE1 to NE25), second pass 2026-11-15

Fixed in this pass: rewards the doc doesn't give removed (NE4, NE7, NE8, NE10, NE12, NE13, NE16, NE18, NE21 Fire Bond, NE22 Rare Candy, NE23, NE24); NE3 beats kept in one region (`flagAt`/`flagThisRegion`) and Sienna joins as an Alpha (`alpha: true`, pending legends); NE6 Rosamund's ace is Mega Ampharos; NE8 crystal stays for the region it was first left in (new: a flag check with `atLeast: 0` passes while unset) and the old man appears after the run's first Z-Move (new engine flag `z-move-used`); NE9 waiting ends the storm for the stage (new effect `clearSky`), battle in rain; NE13/14/15 gate on `blessing-company`/`blessing-solitary`; NE13's afterstory dropped (legends shows it at the encounter from `anselmo-believed`); NE15 Sign only on "Why", "Come yourself" sets `zebedee-travels`; NE17 Plant gives no Telling, Weed tells the next region's name (`{nextRegion}` token) instead of scouting; NE19 bad dream heals everyone but the lead (heal `who: 'others'`); NE22 Truth also gives the Beast Ball and sweets; NE23 is a strict one-on-one (`oneOnOne` rule), "Send everyone" always marks `kartana-dishonoured`, no run loss; NE24 Track can be lost safely, the dog-door afterstory comes for every choice. Kit: the done flag goes into choice branches too (test added), `{say ...}` lines are never split.

Handled by legends (they read our flags; LEGENDS_PIECES section 6): NE9 Raikou Sign site (`mega-grounded`), NE11 bell under the legend's music (`bell-oighrig`), NE13 chalk drawing at the encounter, NE15 "The bench is still here" (`zebedee-message`; told them about `zebedee-travels`), NE21/NE24/NE25 Incursion Remembers and NE21's wave (`beast-sent-home`, `guzzlord-found`, `nihilego-touched`).

Still open (needs engine or another thread; not faked):
- NE1: "lead is a calmed Alpha's gift" variant waits for legends' `partyAlpha` condition in our base; "honey picked up this stage: balm is free" needs an item-picked-this-stage record. Hush header is presentation.
- NE5: the hatchling Bond goes to the newest Pokémon (the hatchling when it hatched last).
- NE6: the Remembers checks "no Pokémon at Bond 2"; the "and a Mega Stone" half needs a has-any-Mega-Stone condition.
- NE10: "five nodes after the first Ditto meeting" needs a node count (flags count stages).
- NE11: bell at every node (presentation). NE13: drawn detail in a later node's background (presentation). NE20: green hillside on the region map (presentation).
- NE18: "every third rest" needs a rest counter; the afterstory plays once.

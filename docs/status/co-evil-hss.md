# Catalog Overhaul Pack: evil-hoenn-sinnoh-unova (row 9)

Source: `HOENN_TEAMS.md` (parts 0 to 5, 8), `TEAM_GALACTIC_SINNOH_FULL_1-3`, `TEAM_PLASMA_UNOVA_FULL_1-3`, and the Hoenn, Sinnoh and Unova parts of `EVIL_TEAMS_VOLUME_3_A-D`. Built on row 8's inside-route engine (`core/evil/inside.ts`, PR #1336). Save: none (everything lives in run flags). No ledger ids are owned by this category.

## What's built
- **Sinnoh, Team Galactic** (`evil-hoenn-sinnoh-unova-1/2/3`): the Offer (Saturn, after The Files; yes / yes and tell Looker / no), Acts 1 to 5 (Act 3 is the `ps_gx_lab` map), six Operations, Lights Out, Inspection, Seen, Next of Kin, the four officers alone, the loyalty test (Suspicion 7) and found out (10), the Final Choice at the Spear Pillar, four endings (`ps_gx_plan/turn/charon/own`), **Team Lantern** (founding, three Rounds, Three Hundred Lanterns), and twelve scenes for any player.
- **Unova, Team Plasma** (`-4/5/6`): N's Offer (for himself), Acts 1 to 5 (Act 3 is the Dreamyard map `ps_px_dreamyard`; Act 4 needs Rank 3 and night), the officers alone (Zinzolin, Colress with his sparring match, the Shadow Triad, Ghetsis), the loyalty test and found out, **the Coronation** with its four endings (`ps_px_asking/turn/ghetsis/own`; the third is warned and confirmed twice), **Team Open Hand** (founding, three Inspections, All Night), the Watch, Collections, the King's Room, the Table, six Operations, and U1 to U12 for any player.
- **Hoenn, Magma and Aqua** (`-7/8`): both recruiters on the road (hooked to The Files of whichever team the run drew). Taking the other uniform makes it the region's team. Acts 1 to 4 written once per team (`mg-*`, `aq-*`): Initiation, the Bunkmate (Ottoway or Marisca), the Errand, three missions, the Rival, Norman, the Counter-Offer (cross over one rank lower, double agent, report, no), the Weather Institute, the Squad, Mt. Pyre, the Leader Confides (40 Standing, Rank 6), the Bunkmate's Request. The Direct Question (Suspicion 6), Marked (9), handing in the uniform, six new Operations (Volume III C), and the Seafloor Cavern's four endings (`ps_mg_*`, `ps_aq_*`).
- **Team Sky** (`-9`): the Draconid at the fire, the Founding (emblem, creed, the first three), Acts S2 to S4 played in person (Mt. Pyre is `ps_sky_pyre`), the Zenith, the Sky's Choice and its four endings (`ps_sky_choice`).
- **Engine pieces**: route fields in `evilTeams.json` (`steps`, `max`, `test`, `out`: Hoenn ranks rise at Standing 3/8/15/25, max 60, the Direct Question at 6, Marked at 9); `routeOf()`; `evil` effect `side` (+ `demote`) moves the player to the region's other team (`crossInside`, its running Operations carried over one for one) and `leave` (hand in the uniform: the inside meters go and the outside story resumes). Standing condition max is 60.
- **Placement**: `placement/evil-hoenn-sinnoh-unova.json` for the scenes any player meets (Galactic S1 to S12, Plasma U1 to U12). The Acts, Operations and endings follow the team's beats, as row 8's do.
- Tests: `tests/unit/evilInsideHsu.test.ts`.

## Known limits
- Barks (each FULL_3 part D) aren't built. Galactic's Lights Out whispers and some officers' answers that the docs leave unwritten are short fill-ins.
- Keepsakes are cut (Kice): the brass tag, the urn's tea, the Schedule, Three Names, the July Snowball and the like are run flags.
- World state, region weather (Desolate Land, Primordial Sea), the redrawn Hoenn map, Reputation by town, pay, the team shop and the uniform's costs outside are said in the text and kept as flags; they don't change other systems yet.
- "Take it all" ends each team story as allied; Evil Mode is on hold, so its decisions are flags only (`evil-start-<team>`).
- Team Sky's management (hire, promote, assign, dispatch, base screens: HOENN_TEAMS parts 6 and 7) isn't built: it's Evil Mode's management. Renown and Loyalty are run flags. "Seen both teams' damage" reads as the region's story four beats in. "Two Rayquaza Signs" isn't read for "Call it for everyone" (the promise is).
- Quiet missions roll their shown notice chance (20 to 30%). Not built: the other team's Suspicion starting at 1 after the Offer, the leader noticing the wrong orb (40%), the double agent's "Tip them off" button, and the "later runs" carry-overs (run memory stays within a run).
- The W6 King's Errand Shadow row isn't read (no condition for an unpurified lead).
- Cast stand-ins: Saturn, Jupiter, Charon, Padraig, Sister Ianthe and other new faces use NPC sprites; Plasma Sages share one Sage sprite.
- Built on #1336's branch, which isn't merged into ui-mockups yet.

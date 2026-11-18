# New UI + Catalog Overhaul (update log)

This ships to `main` as ONE PR from the shared branch `ui-mockups`. Each piece has its own note: the New UI in `docs/updates/ui-mockups/` (one file per PR) and the event rebuild in `docs/updates/catalog-overhaul/` (one file per row). This page is the summary.

## Save versions
- **Run 44** (Catalog Overhaul, new events): Pokémon can carry an optional quirk, marks, original trainer and quirk line. Old Pokémon have none, so nothing changes.
- **Run 46** (evolution scene): an evolution earned in battle waits as a decision until its scene ends, so B can stop it. Old runs have none waiting, so nothing changes.
- **Settings 43** (New UI): the New look becomes the default for everyone; "Old" in Settings brings the earlier look back.
- **Settings 44** (Catalog Overhaul, legends): Legendary Blessings and Ultra Beast Incursions are on by default (Kice), so they switch on once for everyone.
- Profile stays at 20. Each bump has its migration test.

## What players get

**The New UI (Settings > UI style: New, the default)**
- Every screen drawn the way the mock-ups show it: title, save slots, settings, trainer select, the Preparation Desk, starter select, briefing, the stage map and its menus, events, shops, trades, the Hub dock and its boards, Party, Summary, Bag, the run end, Memories and the Hall of Fame (#1311, #1319, #1320, #1324).
- The battle screen from the mock-ups over the live field: data boxes, the command menu, the target picker, notifications, item budget and Rally lines (#1321, #1333).
- Big moments as cutscene cards (Gym Leaders, Champions, the Betrayal), the pause menu, the debug panel (F2), the wide climax pages (Breather, Blackout, Convoy, Front, Debate) with a phase list (#1324, #1333).
- Typed text asks on the mock-up's code entry page instead of the browser's own box; the Pokédex, the Department Store floors, the node event menu and the Second Shot box follow the mock-ups (#1333, #1385).
- "Old" in Settings keeps the earlier look for anyone who prefers it.

**The Catalog Overhaul: every event rebuilt from Kice's pack**
- **Single events (singles):** map stops, rests, road people, secrets, shops, puzzles, famous faces, seasons and battle moments rewritten with fuller text; small kindnesses come back later in the run.
- **Questline families (families A, B, C):** the Apprentice, the Circuit and contests, the convoy, the Last Train, the One That Beat You, eight one-stage chains, the Frenzied Nobles, the Tower of Legends and 100+ two-step stories whose second step remembers the first.
- **Places (places):** twelve Delves and the Celestial Observatory as walkable pseudo-stages, Safari Land, the Battle Frontier, six Legendary stages, calendar weeks, Relics and run events.
- **People (people):** all 51 Road Roster trainers with a three-meeting story, twelve mentors with a Lesson, a Story and a Final Lesson.
- **Markets (markets):** the Honest Market (29 stalls), the Honest Trade Card on every trade, cons with visible tells, the Fairground.
- **Evil Teams (evil-story, rows 9 and 10):** The Plan with four Operations, the Hideout as a full map, the Holding Pen, 47 Operation scenes, and joining every team from the inside (Rocket Kanto and Johto, Magma, Aqua, Galactic, Plasma, Flare, Skull, Aether, Yell, Star), each with its own Acts, endings and open scenes.
- **Rivals (rivals):** the rival questlines R1 to R24 with new fight rules (Kieran's "Wants to Stop", the midnight clock fight).
- **Legends (legends):** Alphas you can calm, Mega and Z Anomalies, Linden's Delta Study, the Island Trials, and Legendary questlines L2 to L15.
- **Anime and Ash (anime):** 95 questlines and 597 scenes, companion stories that follow one Pokémon, and eight full chain pseudo-stages.
- **Greenneedle:** story places (Mt. Moon, the S.S. Anne, Bill's Lighthouse, the Safari Zone park), Pokémon with their own stories (the Eevee who can't choose, the angry Bidoof) and region-long stories that pay off later in the same run.
- **Kanto canon spaces:** Viridian to Indigo as placed spaces, with Pokémon Tower, Rock Tunnel and the Power Plant as pseudo-stages.
- **100 new events and Pokémon Moments:** including The Road Home, which plays at the run end after the final battle, win or lose.
- **Placement:** events now sit where the pack places them (must-see stops on every path, before or after a node's battle, at a step window).
- Losing an event or questline fight never ends a run. Event text stays until you move on; rewards show after it.

**Fixes found on the way**
- The map could fail to open while an event placed before your node's battle was waiting (#1388).

## Known limits
- **Run memory (Kice):** scenes remember only what happened in the same run. Anything the pack wrote to carry across runs (PAST ALLIES, photos from other runs, carry-over to the next run) is kept inside the run or left out.
- **Evil Mode** (row 11) is on hold by Kice and not built.
- **Open catalog ids:** 2,691 of 2,821 ledger ids are done. The 130 left are 118 legends system lines (odds weeks, event tickets as keys, Communion upgrades, the four pseudo-stage worlds, PAST ALLIES), the Plush Workshop (5) and 7 bookkeeping lines. Full list: `/mnt/project-files/reports/catalog-overhaul-final-check.md`.
- Each row's own limits are in its note under `docs/updates/catalog-overhaul/` and `docs/status/co-*.md`; the New UI's in `docs/updates/ui-mockups/`.

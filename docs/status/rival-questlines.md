# Rival questline events (Beta 0.6)

Sources: `/mnt/project-files/catalog_overhaul_pack_2/catalog_overhaul/NEW_EVENTS_2.md` (NE36-40) and `QUESTLINES_RIVALS.md` (R2, R4), intake reports in `/mnt/project-files/reports/`. Built on the choice-memory framework (`docs/status/choice-memory.md`).

## What is built
- Engine: condition `rivalState` (featured rival's feeling at least N, Lead range, a held mark; false with no rival) and effect `rivalChange` (feelings, Lead, one mark, all clamped; no-op with no rival). Both use the existing rival overhaul record (`run.expansion.rival`), so no save change.
- Data: `src/data/events/rivalQuestlines.json` (auto-discovered, 14 events, ids `rq-*`). All need a met rival. Callbacks open only from their flag.
- NE36 `rq-empty-slot`, NE37 `rq-help-wanted` (+ `rq-old-man-sign`), NE38 `rq-letter` (+ `rq-old-man-stands`), NE39 `rq-swap-day`, NE40 `rq-asks-you-to-lose`.
- R2 `rq-rival-in-trouble` + `rq-favour-returned`, `rq-someone-helped`, `rq-bitter-rival`, `rq-in-trouble-again` (amends). R4 `rq-stone-on-the-hill` (second stone if `rival-knows-lost`) + `rq-the-young-one`.

## Batch 2 (rivalQuestlines2.json, rivalQuestlines3.json, 28 more events)
R3 promise (make, training, kept/broken), R5 mentor (battle; apology and train-together variants), R6 post-mortem + folded page, R7 colours, R8 fake lead + straight battle, R9 bad day + badge photo, R10 photograph + album, R12 fellow apprentice + final lesson, R13 follower + why, R14 emptied shelves + confrontation, R15 gift + sponsor truth, R16 Kieran (3 meetings + finale), R21 inn night, R22 one for the road, R24 what they call you.

## Decisions
No cross-run lines (R3's "across runs" memory, NE "once per save") and no Keepsakes. Heals are out of battle only (one super potion, full heal at a Center), inside the 10 heals / 6 revives budget. No new teams.

## Limits (not built)
- Not built from the pack: R1 (the Circuit; the existing rival tournament covers it), R11 (the existing feud event covers it), R17 (merged into SF6), R18 (real-date holiday), R19 (Champion rival finale, needs the League hook), R20 (starter rivalry stat does not exist), R23 (pseudo-stage race). Also R2/R4/R3 finales that change the rival's team (counter slot, young Pokémon of the lost species).
- NE39 is a friendly 3v3 spar plus a new egg move; the true team swap is not built. NE40 "throw it" does not skip a round; "don't you dare do that again" in the last battle is not wired. NE38 burnt-letter ace move is not built. NE37 "rival is broke" variant waits for R14.
- NE36 "a Pokémon I lost" is approximated by "a wild foe once beat one of your Pokémon" (`oldFoe`).
- Pack arcs (The Fall, The Truce...) differ from the engine's arc ids, so events gate on feelings, not arc.
- Rival questline events are drawn like other events; there is no per-rival quest scheduler yet.
- Batch 2 simplifications: R5 mentor battle has no lose-scouting; R6 notes are not generated from the lost battle; R7 swap is a plain 3v3 (no borrowed-team rule, no jacket); R8 has one trap, not three; R9 has no repeated Gym losses; R10 is one photo event, not one per region; R12 outcomes (title, nurse, third rival) are flags only; R13's answer does not set the next arc; R14 detour is not a map node; R15 tracker/ambush is not wired (items only); R16 Kieran's Pokémon items are 3 potions; R21 clues are collapsed into one choice; R24 shows only the finale line.

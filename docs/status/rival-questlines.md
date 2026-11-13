# Rival questline events (Beta 0.6)

Sources: `/mnt/project-files/catalog_overhaul_pack_2/catalog_overhaul/NEW_EVENTS_2.md` (NE36-40) and `QUESTLINES_RIVALS.md` (R2, R4), intake reports in `/mnt/project-files/reports/`. Built on the choice-memory framework (`docs/status/choice-memory.md`).

## What is built
- Engine: condition `rivalState` (featured rival's feeling at least N, Lead range, a held mark; false with no rival) and effect `rivalChange` (feelings, Lead, one mark, all clamped; no-op with no rival). Both use the existing rival overhaul record (`run.expansion.rival`), so no save change.
- Data: `src/data/events/rivalQuestlines.json` (auto-discovered, 14 events, ids `rq-*`). All need a met rival. Callbacks open only from their flag.
- NE36 `rq-empty-slot`, NE37 `rq-help-wanted` (+ `rq-old-man-sign`), NE38 `rq-letter` (+ `rq-old-man-stands`), NE39 `rq-swap-day`, NE40 `rq-asks-you-to-lose`.
- R2 `rq-rival-in-trouble` + `rq-favour-returned`, `rq-someone-helped`, `rq-bitter-rival`, `rq-in-trouble-again` (amends). R4 `rq-stone-on-the-hill` (second stone if `rival-knows-lost`) + `rq-the-young-one`.

## Decisions
No cross-run lines (R3's "across runs" memory, NE "once per save") and no Keepsakes. Heals are out of battle only (one super potion, full heal at a Center), inside the 10 heals / 6 revives budget. No new teams.

## Limits (not built)
- Questlines R1, R3, R5-R24 and R2/R4 finales that change the rival's team (counter slot, young Pokémon of the lost species).
- NE39 is a friendly 3v3 spar plus a new egg move; the true team swap is not built. NE40 "throw it" does not skip a round; "don't you dare do that again" in the last battle is not wired. NE38 burnt-letter ace move is not built. NE37 "rival is broke" variant waits for R14.
- NE36 "a Pokémon I lost" is approximated by "a wild foe once beat one of your Pokémon" (`oldFoe`).
- Pack arcs (The Fall, The Truce...) differ from the engine's arc ids, so events gate on feelings, not arc.
- Rival questline events are drawn like other events; there is no per-rival quest scheduler yet.

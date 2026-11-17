# Mythical Tellings variety (2026-11-17)

Problem (100k sim): the automatic stage Telling only picked `supported` Mythicals, and only Zarude is, so every run heard Zarude (40% of runs) and almost nothing else.

Fix (Stage 1): `hearTelling` now picks from every non-disabled Mythical (19), the same pool as the Telling stops (`tellAny`). Each of them has a Visit scene (`vow-<id>`) that reads the believed flag, so believing now leads somewhere. Random Visit rolls stay supported-only (Zarude) until a Mythical's Wonder is built.

Still open (Stage 2): the 18 limited Mythicals have no random-visit trigger or built Wonder; Arceus, Marshadow (need cross-run memory), Manaphy and Melmetal (need Phione / Meltan) stay disabled. Only the `faint` Promise event is wired in run.ts; the other 20 Promise events are tested rules with no game hook yet.

Known: `blueprintBalance` gn-arcade / gn-jigsaw payout tests fail on ui-mockups before this change too.

## Stage 2, batch A (Mew, Darkrai, Genesect now `supported`)
- Infra: `promise.track` (optional counters, no save bump), Promise events from real actions in run.ts: catch, rest used, TM taught, party changed (joins, deposit, withdraw), rests passed per stage. Wonder hook at battle start. Lines go to the story record (`promiseSay`).
- Mew: trigger 20 species caught; Wonder: each catch learns one extra seeded move. Limit: the stand-in for a fainted member is not built.
- Darkrai: trigger two rests passed; Wonder: foe lead loses 1/8 HP at battle start. Limit: the long night is not built.
- Genesect: trigger a revived fossil Pokémon; Wonder: +1 to lead's stronger attack stat each battle. Limit: no Drive at rests.
- `MythicalDef.limits` states these honestly. Still limited: Celebi, Jirachi, Deoxys, Phione, Shaymin, Victini, Keldeo, Meloetta, Diancie, Hoopa, Volcanion, Magearna, Zeraora, Meltan, Pecharunt. Disabled: Manaphy, Arceus, Marshadow, Melmetal.

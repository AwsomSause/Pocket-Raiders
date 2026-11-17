# Mythical Tellings variety (2026-11-17)

Problem (100k sim): the automatic stage Telling only picked `supported` Mythicals, and only Zarude is, so every run heard Zarude (40% of runs) and almost nothing else.

Fix (Stage 1): `hearTelling` now picks from every non-disabled Mythical (19), the same pool as the Telling stops (`tellAny`). Each of them has a Visit scene (`vow-<id>`) that reads the believed flag, so believing now leads somewhere. Random Visit rolls stay supported-only (Zarude) until a Mythical's Wonder is built.

Still open (Stage 2): the 18 limited Mythicals have no random-visit trigger or built Wonder; Arceus, Marshadow (need cross-run memory), Manaphy and Melmetal (need Phione / Meltan) stay disabled. Only the `faint` Promise event is wired in run.ts; the other 20 Promise events are tested rules with no game hook yet.

Known: `blueprintBalance` gn-arcade / gn-jigsaw payout tests fail on ui-mockups before this change too.

# Catalog Overhaul: markets (row 7) — status

Branch `claude/project-thread-uvwqv1` (PR into `ui-mockups` not opened yet). Paused 2026-11-15 4:20 AM PT (Kice: five threads at a time).

## Built (built, re-read against the doc, unit tests pass)
| File | Doc section | Events | Checked |
|---|---|---|---|
| `tools/events/co/markets-1.ts` | STORY_FAMILIES_11 SF87 Honest Market (29 sellers) | 36 | 2026-11-15 |
| `tools/events/co/markets-2.ts` | SF88 Services, SF89 Training Ground (27 drills) | 49 | 2026-11-15 |
| `tools/events/co/markets-3.ts` | SF90 Cons, 10 front-company booths | 18 | 2026-11-15 |
| `tools/events/co/markets-4.ts` | STORY_FAMILIES_12 SF91 Game Corner | 26 | 2026-11-15 |
| `tools/events/co/markets-5.ts` | SF92 Fairground | 31 | 2026-11-15 |

## Where I stopped
- `tools/events/co/_markets-6-wip.ts` (leading `_` = not built): STORY_FAMILIES_16 SF104–SF109 and SF112 (48 events), written but not passing yet. Rename to `markets-6.ts` and fix: `repel` is not a tempEffect modifier (guide quiet way); `insurance` is not an event effect (insurance agent); `addStop` has no `pseudo` stop (ticket tout: use the Glass Forest's own entry); two remembers variants hide every base choice (bank returns: keep one base choice).
- Core for it is in and typechecks: `market` actions `payItem`, `rent`, `returnRent`, `brew`, `advise key best`; condition `holdsAny`.
- Not started: SF103, SF105 Sandstorm Camp, SF110 Collectors, SF111 Swaps (markets-7), TRADES.md (Honest Trade Card core `honestTrade` + `tradeCard`, pools, 110 trades; quirks come from new-events, run save 44 is theirs).
- Still to do at the end: status/placement JSON files, update fragment, market.ts unit tests, one Playwright spec, `npm run check`, PR.

## Known limits so far
- Voltorb Flip opens the Puzzle Slots mini-game (no Voltorb Flip board exists yet).
- Slot machine pays ₽550 (doc "5×") and dice pays ₽205 (doc "double") so the printed house edge stays at or under 10%.
- Fake nurse is a man (grunts are male only).
- "One per region" (Meloetta nature, breeder) is once per run until region stamps are used here.
- Fairground comes back with `comeBack`, not strictly once per region; Poppet's ribbon counts three finds, not three in a row.
- Pawn Sharks' small (Berry) buyback is not yet queued separately.

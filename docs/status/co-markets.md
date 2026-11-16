# Catalog Overhaul: markets (row 7) — status

All 199 catalog ids in the markets category are built (`npm run co:status`: markets 199 / 199, + 156 from its own docs: rooms, the 110 trades, the trade chains). Branch `claude/project-thread-uvwqv1`, PR into `ui-mockups`.

## Built (built, re-read against the doc, unit tests pass)
| File | Doc section | Events | Checked |
|---|---|---|---|
| `tools/events/co/markets-1.ts` | STORY_FAMILIES_11 SF87 Honest Market (29 sellers) | 36 | 2026-11-15 |
| `tools/events/co/markets-2.ts` | SF88 Services, SF89 Training Ground (27 drills) | 49 | 2026-11-15 |
| `tools/events/co/markets-3.ts` | SF90 Cons, 10 front-company booths | 18 | 2026-11-15 |
| `tools/events/co/markets-4.ts` | STORY_FAMILIES_12 SF91 Game Corner | 26 | 2026-11-15 |
| `tools/events/co/markets-5.ts` | SF92 Fairground | 31 | 2026-11-15 |
| `tools/events/co/markets-6.ts` | STORY_FAMILIES_16 SF104 Tolls, SF105 Oasis, SF106 Guides/Insurance, SF107 Loans/Bank, SF108 Pawn/Rentals, SF109 Wagers, SF112 Fossils/Tutors | 49 | 2026-11-15 |
| `tools/events/co/markets-7.ts` | SF103 Trading Post, SF105 Sandstorm Camp, SF110 Collectors + Rich Kid, SF111 Swaps and Altars | 24 | 2026-11-15 |
| `tools/events/co/markets-8.ts` | TRADES.md Part 3 (T001–T110) and 4.3 (the trade-back service) | 113 | 2026-11-15 |
| `tools/events/co/markets-9.ts` | TRADES.md 4.1 Long Chain, 4.2 Short Chain | 9 | 2026-11-15 |

## Engine pieces this row added
- `honestTrade` effect and the Honest Trade Card (`src/core/co/tradeCard.ts`; card view: `tradeCard()` in `core/events.ts`, per pick `ChoiceView.tradePicks[].card`). Fair value (TRADES.md 1.2), the trader's warning (`warn`), Bond 2 / 3 on arrival, OT, quirk, marks, trade evolutions on arrival. Pools: `src/data/catalogOverhaul/tradePools/markets.json` (8 terrain pools + Trading Post, Global Trade, four Collectors). Trade quirks: `quirks/markets.json`.
- `tradeBack` effect (Ivo's trade-back service). TradeWant: `types`, `notTypes`, `natures`, `bond`, `moveFlag`, `shiny`, `minTier`, `regional`.
- `market` actions (`core/market.ts`): stash, stolen, payItem, rent, returnRent, brew, advise best; pawn remembers a Berry. Condition `holdsAny`.
- The quirk fields (quirk, marks, ot; run save 44) are the new-events thread's commit 397ad1cb3, cherry-picked unchanged.
- The UI thread draws the card on the event screen: New look, `src/ui/redux/screens/honest.ts` (the mock-ups' Trade page; T reads the card before choosing; a worse deal is asked once more in both looks). Done 2026-11-15, PR #1333.

## Tests
`tests/unit/coMarkets.test.ts` (content rules), `coMarketActions.test.ts` (market actions), `coTradeCard.test.ts` (the card, pools, gifts, warnings, trade-back); `tests/e2e/coMarkets.spec.ts` (Bank with reload, Toll Bridge, New UI).

## Not built (honest status)
- T025 Ranger Willa (a two-way temporary trade that returns both Pokémon next region: needs a "lend" mechanic).
- T097–T100 (Pokémon from past runs) and the "later run" returns of T057 and T082: Kice's rule keeps memory inside one run.
- T101 (the rival's spare Pokémon): needs the rival team to accept a traded Pokémon.

## Known limits
- Voltorb Flip opens the Puzzle Slots mini-game (no Voltorb Flip board exists yet).
- Slot machine pays ₽550 (doc "5×") and dice pays ₽205 (doc "double") so the printed house edge stays at or under 10%.
- Fake nurse is a man (grunts are male only).
- "One per region" (Meloetta nature, breeder) is once per run; the Fairground comes back with `comeBack`; Poppet's ribbon counts three finds, not three in a row.
- Ticket Tout sets `glass-forest-ticket`; the Glass Forest itself (SF41.4, `ovc-glass-forest-s1`) belongs to the families row and should open for that flag.
- The Bank can be robbed only when another row sets `bank-robbed` (the evil team's crisis strand).
- Insurance pays out (a Revive) when a party Pokémon fainted in the last few battles; the memorial plaque is in the text only (no Keepsakes).
- Quirks with no engine hook yet show their line only: Won't lead, Always leads, Steals Berries, Sings at night, Afraid of Balls, Collector. Old grows Bond faster but does not lose Speed. Grudge is +10% against every trainer, not one named one. Homesick reuses new-events' quirk (-1 to stats until Bond 3), not "until it sees its home terrain".
- Trade wants the engine can't check are approximated and labelled honestly on the card: "caught inland" (not Water), "from another region" (any), "a nicknamed Pokémon" (any), "beat a Champion" (Bond 4), "won a badge with" (Bond 3), "two Pikachu" / "three Grimer" / "two of the same species" (one).
- Collectors' "by region" offers (Bagon, Axew) are a seeded draw, not chosen by region. Delta Snorlax is the base Delta form, not the season's.
- Roster "counts as a meeting" lines (Wade, Baxter, Hadrian, Delia, Hester) and the "If SF… is done" Remembers lines of the trades are not wired yet (their flags belong to other rows).
- Altar of Swaps shows the card's warning instead of refusing a worse offer.
- Photo Contest: the two prize photos need at least one camp photo (the camp album), so the old camp-photo hook still matters; the blurry action shot needs none.
- Machine Parts are the real `machine-part` item (Wex hands one back; other events' parts count too). The coupons are gift-only, so they never join random draws.

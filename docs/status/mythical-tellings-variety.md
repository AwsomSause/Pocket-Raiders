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

## Stage 2, batch B (Victini, Hoopa now `supported`)
- Victini: trigger ten wins in a row without a faint; Wonder: moves cannot miss in the first battle of each stage (engine reads `storyEffects` `promise:sure-hit`). Limits: declaring three fights fated is not built; declining a rival's challenge is not checked (no fleeing exists).
- Hoopa: at each stage its ring takes one random item (own stream); fewer than three left breaks the Promise. Wonder: once a region its ring brings a strong non-legendary Pokémon of a party type (keep/box/release offer). Limit: the type is seeded, not named by the player.

## Stage 2, batch C (Zeraora, Keldeo now `supported`)
- Engine reads per-battle `storyEffects` flags: `promise:zeraora` (first damaging move becomes Electric, +20%, once a battle), `promise:keldeo` (one move hits the weaker defense, once a battle).
- Promise hooks: Zeraora, a catch; Keldeo, a friend's or shadow's assist at battle start. Both come through their Visit scenes (no random trigger yet).

## Stage 2, batches D to J: screens, items, engine (21 supported of 23, plus Zarude)
- **Wonder menu:** a Guest's usable Wonders are rows in the map Items menu (`wonder:<id>`, no catalog item needed); a pick opens the existing option screen as a `wonderChoice` decision (new optional decision kind, no save bump). Deoxys stance, Diancie copy, Meltan feed, Melmetal give, Phione current, Magearna bouquet, Meloetta retune (two questions), Celebi recover and revisit. Revisit (Kice: "no new badge, but fight the leader again"): pick an earlier Gym of this region (leaders are recorded as `stage-leader:<region>:<index>:<leader>` in itemCounters); the leader is fought on the current map with a seeded team (`battle.revisit`), the badge, aftermath and gym-win bonuses are skipped, and play carries on where it was. Once a run; older runs list only stages begun after this version.
- **Reward screen:** Jirachi's Wishes are two buttons (redraw the whole node; name one reward of a card's tier via a picker).
- **Engine (per-battle `storyEffects` flags):** Zeraora arc, Keldeo secret sword, Victini sure-hit, Deoxys stances, Meltan Defense, Melmetal double strike, Volcanion steam, Magearna faint boost.
- **Same-run chains:** Phione's kept Promise ends at the next region and Manaphy visits (counts as two Tellings); eight fed Meltan merge into Melmetal. A Visit scene cannot vow either unless the earlier one was kept.
- **Event hooks (label-based, documented limit):** refusals = choices beginning Decline/Refuse/No thanks/Turn it down/Reject (Jirachi, Pecharunt); generous = begin Give/Share/Donate/Hand over/Gift (Shaymin). Minigame quit (Meloetta), release (Manaphy), sell/cash-in (Diancie), lost rescue (Volcanion), wild Grass/Bug KO (Celebi).
- **Not built:** Shaymin's re-opened ruined place, Mew's stand-in, Darkrai's long night, Genesect's Drive, Victini's fated fights, Hoopa's named type, Manaphy's Heart Swap, Zeraora's raid joining, Pecharunt/Keldeo/etc. have no random trigger (their Visit scenes work). Arceus and Marshadow stay disabled (cross-run memory, cut by the director).
- Browser tests could not run in this sandbox (the existing blessings spec fails the same way here at the Hub), so the new screens are covered by unit tests only; CI runs the real Playwright.

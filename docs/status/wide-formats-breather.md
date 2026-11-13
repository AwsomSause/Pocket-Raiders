# Wide formats: shared interface + Breather (E4, 1 of 7)

- `src/core/formats/types.ts`: the thin `WideFormat` interface (setup, describe → card, choose, onBattleEnd, onTurn, isOver). `registry.ts` is the one entry point (`startFormat`, `cardOf`, `chooseOption`, `battleEnded`, `turnPassed`, `closeFormat`). One file per format.
- State lives in `run.expansion.cut.format` (`{id, state}`), finished one-shots in `cut.done`, save points in `cut.checkpoint`. `cut` is already a loose record in run v43, so no save bump. A damaged slot reads as "no format", never throws.
- Breather (`breather.ts`): the Extended Cut's rest room. Every Pokémon still up heals 50% of max HP, the player picks ONE fallen Pokémon to bring back (same share, status cleared), checkpoint, no shop. 35% when the Siege Map's `siege.lost` holds `kanto.west-gate` or `any.cliff-stair`. Applies once. No RNG.
- `FormatScene` ('Format') is the plain screen; `MapScene` launches it when a format is running (`formats/glue.ts`). Siege Map and Colossus get their own picked screens (Siege Map 7 Rocket Ledger, Colossus 5 Blueprint) in their PRs; the other HUDs stay plain (Format HUDs were scrapped).
- Nothing starts the Breather by itself yet: the Extended Cut director (E5, depends on workstreams 14 and 15) calls `startFormat('breather', ctx)`.
- Tests: `tests/unit/formats.test.ts`, `tests/e2e/wideFormats.spec.ts`.

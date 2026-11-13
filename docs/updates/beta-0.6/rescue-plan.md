# Rival Rescue Plan (R9)

## Player gets
- When a raid failure impounds your Pokémon, the team leaves a receipt (a different one per team; Team Snag'em leaves none). A holding clock runs: Logged (0-4 nodes), Processed (5-9, a cosmetic mark), Assigned (10+, a small effect for 5 nodes after return).
- About 10 nodes later (9, 10 or 11, fixed by the seed), or at the last quiet node before the climax, your rival comes with a plan and 14 lines in their own voice. Second offer 5 nodes after a decline; a guaranteed Late Plan after a stay-out; never a third.
- Five plans: Quiet Extraction, Loud Grab, The Deal (money only, no roll), The Inside Job (only with someone inside), The Exchange (only if you hold something they want). Each has a hint-style readiness word (Risky / Even / Likely / Safe), never a number.
- A 12-card complication deck (one card per plan, from the seed), 14 holding sites with jailers, cellmates (20%), the Balloon / Warrant / Snag-back shortcuts, the Pound in the Extended Cut, and the reunion on return.
- Declined twice, or still held at the climax: they return Veiled where the team binds Pokémon (Team Yell and the Remnants never). Climax victory returns everything; a lost climax records `lost-with-impounded`.

## Save
- No version bump. State is `run.expansion.rescue` (tightened from a loose record to `RescueStateSchema`); old runs load untouched. Run 44 stays free.
- Held Pokémon are stored whole in the hold and restored exactly (party, or box when the party has 6).
- Rolls are hashed from seed + region + label (`rescue-wait`, `rescue-roll`, `rescue-complication`, `rescue-cellmate`), so no shared RNG stream moves.

## Limits
- Core rules only (`src/core/evil/rescue.ts`, data `src/data/rivalRescue.json`). No scene, party-screen icon or PS-RESCUE map yet; the screens call `offerDue`, `planOptions`, `acceptOffer`, `answerBeat`, `answerComplication`, `exchangeLine`, `finishPlan`.
- Intel, Operational Strength, insider flags and trade items belong to other workstreams: they are passed in (`RescueCtx`) and the outcome returns `intelDelta`, `osDelta`, `heatDelta` (heat is applied to `story.evil` when it exists).
- The Veiled taint is returned as a flag (`veiled`, `climaxVictory().veiled`); the Shadow workstream applies Corruption 10. Assigned effects and bond +1 are returned (`activeEffects`, `bondGain`) for the battle and party-life code to apply.
- The rival's rescue attitude is stored in `rescue.attitude` and combined with the rival's feelings; Full also raises the main rival's `keptPromise` feelings.
- Not built: the 8 base per-archetype *Side-with* tells, the second rival lookout bonus, and Complication 7's extra trainer (needs the second rival and civilian systems).

# Rival Rescue Plan screens (R9, part 2)

## Player gets
- A Rescue screen (`RescueScene`) for the rival's offer: the rival's lines in their own voice, the receipt, the holding site and jailer, the clock (Logged / Processed / Assigned / Held too long), five plans with a readiness word (Risky / Even / Likely / Safe, never a number), the preferred plan starred, greyed-out plans with the reason, and "Not now".
- The three beats (Approach, Door, Cage; two for the Inside Job), the drawn complication with the rival's hint, the three Exchange lines, then the result and the reunion text (and a cellmate when one follows you out).
- Esc on the offer is "not now" (counts as a decline); Esc mid-plan abandons it and the offer comes back.

## Save
- No change. The scene only calls the core rescue rules and saves the run.

## Limits
- Not yet wired to a map node: the quiet-node scheduler (E3) should call `offerDue` and then `this.scene.launch('Rescue', { offer, ctx, node, names, from })`. `RescueCtx` (Intel, Operational Strength, insider, trade item, rival archetype) comes from the systems that own them.
- The screen resolves a plan by its roll. The one or two Door/Cage battles of PS-RESCUE and the annex raid map (`pr.*` ids in `rivalRescue.json`) are not built; they need the raid-map workstream.
- The party-screen cage icon is not drawn; the view gives `cageFill` (0 to 1) for it.
- Not checked in a browser yet (typecheck and unit tests only): needs a screenshot pass once a node launches it.

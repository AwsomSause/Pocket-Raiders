# Rival Rescue: map wiring (R9, part 3)

## Player gets
- When the rival's plan is due, the Rescue screen opens on top of the map at a quiet moment (map phase, no battle). Declining, finishing or abandoning the plan returns to a fresh map.
- The rival speaks in the voice of its personality (Champion Chaser = Hotshot, Bitter Challenger = Bitter, Enthusiast = Friendly, Idealist = Heir, Strategist = Scholar, Protector = Mirror, Prodigy, Underdog = Lone Wolf).

## Save
- No change.

## Limits
- The rescue clock counts stages: `rescueNode()` = region x stages per region + stage index. Whoever applies an Impound (the raid-failure workstream) must call `impound()` with that node and `lastQuietNodeOfRegion()`; nothing impounds yet, so no offer appears in a normal run today.
- Intel, Operational Strength, insiders and trade items read as none until their systems exist (`rescueCtxFor`), so only Quiet, Loud and Deal are offered for now.
- The offer needs a registered main rival. Not checked in a browser yet (typecheck and unit tests only).
- Screens PR content (`RescueScene`, `rescueView.ts`) already landed inside #1152.

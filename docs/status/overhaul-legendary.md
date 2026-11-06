# Overhaul slice 12: Legendary and Mythical

- Battle roles: every Legendary and Mythical base species has one of five roles (striker, powerhouse, wall, support, controller) in `src/data/legendaryRoles.json`, read by `legendRoleOf` (`src/core/legendary/roles.ts`; forms use their base). The test checks each role against the base stats and that no role holds more than 40% of them.
- Rare chains: every Mythical (except Phione and Meltan, who come from Manaphy's and Melmetal's lines) has only Very Rare Legendary events, from region 3 on (Keldeo was region 2; fixed), and none is in ordinary wild pools.
- Boss phases: all 101 Legendary events end in a raid or totem boss with 2-3 phases; the test checks they get tougher as HP falls. `RaidPhaseSchema` is now strict, so a phase can raise stats, set weather or add a shield but can never carry a heal or hide-stats field.
- Presentation: every event already had an omen, lore, intro and both endings, music and route layout; the test now keeps it that way.
- Limits: roles are data only (no battle effect and no screen shows them yet). A multi-form raid gauntlet still refills HP when the boss rises in its next form; that is a new bar, not a phase. No save change.

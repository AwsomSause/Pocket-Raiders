# Story S6: Keepsakes

20 cosmetic accessories (design Part II-E), five slots, no stat effect.

- `core/story2/keepsakes.ts`: catalog (id, slot, rule, status), `keepsakesEarned(run)`, `foldKeepsakes` (called from `foldModuleIntoProfile` at run end), `wearKeepsake`.
- Profile: `story.keepsakes` (unlocked ids) and `story.worn` (one per slot), both defaulted, no save bump.
- Hub Tales & News: "Keepsakes" screen (`ui/keepsakesMenu.ts`): locked ones show the rule; unlocked ones can be worn or taken off (`GameSession.wearKeepsake`).
- Earnable now (5): Charm Necklace (latch 5), Star Pin (latch 7), Bell Collar (latch 3, Playful/Mischievous), Ribbon Bow (latch 6, Affectionate/Playful), Tiny Hat (Keystone earned).
- Limited, not earnable yet (15): their events are not tracked in a run (gym wins and no-faint tracking, snacks given count, weather/snow/nature events, Gift beat, League win, Lore read count, Tuftin egg, bird line, Grass line). The screen says so on each.
- Not built: drawing the worn Keepsake on the Hub follower, party menu and camp scenes.
- Test: `tests/unit/storyKeepsakes.test.ts` (6).

# Story S6: Embrace

- New care action `embrace` for the Heartbond partner once Level 7 (Trusted Partner) has latched (`embraceUnlocked` in `story2/heartbond.ts`). Once per stop. Effects in `src/data/care.json` (`embrace`: friendship +4, affection +4, strain -4, mood +2, 3 quip lines); it also pays the normal care touch to the Heartbond ledger.
- The Embrace button appears in the Pokémon menu's care list only for an unlocked partner; for anyone else the action reports "Only a Trusted Partner (Heartbond Level 7) will embrace you." (`careProblem`).
- No save change. Tests: `tests/unit/storyHeartbond.test.ts` (`embrace`, 3).
- Not built: the player's Embrace body animation. Look A has no `embrace` clip yet (design asset gap AS-1); it is a text line until the clip exists. Not browser-checked.

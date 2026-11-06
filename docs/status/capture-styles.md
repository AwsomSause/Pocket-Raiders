# Capture Styles (S224)

Three new ways to win a catch besides the Poké Ball: Friend Treat (befriend), Peace Offering (negotiate), Snare Trap (trap). Each is a normal item, crafted at the Workshop.

- Off by default: `balance.captureStyles.enabled` is false, so the ball flow is unchanged, the items refuse to work, and the recipes are hidden.
- Odds (`src/core/captureStyles.ts`, numbers in `balance.json`/schema defaults): befriend likes easy species and sleeping/paralysed foes; negotiate follows your lead's level vs the foe's; trap needs the foe under 50% HP or with a status.
- Uses the battle's capture RNG stream and the skill-throw factor; no new stream.
- No save version bump (items and balance only).

Limits: no dedicated minigame screens for the styles; they roll like a ball. Switch on by setting `captureStyles.enabled` true.

Tests: `tests/unit/captureStyles.test.ts`.

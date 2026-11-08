# Gigantamax gets its own finish (#1085)
**Player gets:** Gigantamax now ends with a gold ring, rising sparks and a G-MAX banner, so it no longer looks like plain Dynamax (works on the enemy side too). Mega, Primal, Tera, Z-Move and Dynamax already had separate scenes.
**Save:** none.
**Limits:** per-species G-Max colours not done.

## Rival REUNION (same PR)
**Player gets:** a rival you met in an earlier run greets you with a REUNION card the first time you fight them in a new run.
**Save:** none. "Runs since" is read from the existing `profile.legacyRuns` records (`runsSinceMet`), so no counter or migration was needed. Unit tests in `tests/unit/cinematicMoments.test.ts`.

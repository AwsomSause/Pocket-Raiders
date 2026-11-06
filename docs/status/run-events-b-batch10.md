# Run events B, batch 10 (R62, R78, R84, R94)

Four trainer events in `src/data/events/trainer-b10.json` (built from `tools/events/trainerB10.ts`).

- **Sky Duel (R84)**: rule `sky`. Nobody is grounded, and Ground moves miss (except against a semi-invulnerable target).
- **Sniper Ambush (R94)**: rule `sniper`. In doubles the foe targets your lowest defence (special moves use Sp. Def). Gives you a loaner ally.
- **Contest Judge's Challenge (R62)**: rule `contest: 4`. Nobody can be knocked out. Use 4 different moves to win. Styles are tracked in `battle.storyEffects` as `style:<move>`.
- **Dream Team Draft (R78)**: three choices, each lends a different ally (Pikachu, Machop, Gastly).

Limits: contest has no judge scoring screen; sniper only matters in doubles.
No save bump (the new rule fields are optional).

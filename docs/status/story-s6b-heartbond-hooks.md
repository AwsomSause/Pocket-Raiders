# S6b: Heartbond battle hooks (part 1 of the wiring)

- `heartbondTurn` (after each battle turn) pays the partner for a Hyper moment and charges a faint; `heartbondVictory` pays a milestone win after a leader, elite, champion, rematch or rival fight. Both go through the ledger, so replays and reloads never pay twice.
- The old direct Hyper bond bump is skipped for the partner (it would double pay); other Pokémon keep it.
- No save bump. Classic runs (no `story.v2`) are untouched.
- Not built yet: Feat, clutch, guard and underdog hooks, camp and care hooks, party-menu actions, snack and keepsake use, override cost, the Heartbond meter, temperament beats, Autonomy Off behaviour.

## S6d addition
- The partner guarding an ally (the `sacrifice` battle event) pays `guard_ally`, at most twice a battle. Clutch survive, Feat and underdog hooks still need their own event sources.

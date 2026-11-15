# Event text and rewards wait for input

Rule (Kice, all events): text never disappears until the player gives an input; rewards appear only after the text is dismissed; rewards disappear only on input.

- `EventScene`: outcome text panel stays until Enter/click; then it slides away and the reward chips appear; Enter/click again leaves.
- `DecisionScene` result message and `RewardScene` pick result no longer auto-close after 1.3 s / 1.5 s; they wait for Enter/click (300 ms beat first so the choosing key does not skip them).
- Test: `tests/e2e/events.spec.ts` (outcome text, no chips, then chips, then leave).
- Not covered: per-event story scenes (separate threads); other scenes with timed auto-advance (Blessing, Siege, Rescue) were not changed.

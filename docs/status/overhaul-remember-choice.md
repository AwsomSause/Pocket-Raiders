# Overhaul slice 6: Remember battle choices

The move menu now starts on the move each of your Pokémon used last this battle (remembered per Pokémon). If that move is blocked (no PP, Disable, Choice lock, Taunt, Torment...) the cursor goes to the next usable move. It only moves the cursor: you still confirm every move, and a forgotten or replaced move falls back to the normal first-usable start. New setting `rememberChoices` ("Remember battle choices", controls tab, on by default). Settings v33 -> v34 (migration sets it on); test in `tests/unit/rememberChoice.test.ts`, browser test `tests/e2e/rememberChoice.spec.ts`. Code: `src/core/battle/rememberChoice.ts`, `Menu` `initialIndex`, `BattleScene.showMoveMenu`.

Limits: only the move menu is remembered (not root action, bag category, party pick or target); the memory lasts for the battle, not across battles.

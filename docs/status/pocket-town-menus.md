# Pocket Town menus (Appendix S.5, slice 2 of 2)

Each Pocket Town building opens a themed panel instead of the generic list.

- **Panel:** `src/ui/townPanel.ts` (`TownPanel`): district-coloured frame (Training red, Culture blue, Home green, Play purple, plaza gold), the building's icon, name, header line (the blurb, or the last result in gold) and the action buttons. Keyboard, mouse/touch (tap picks) and gamepad via the shared input actions; Esc goes back. Lists of more than 5 actions scroll.
- **Own layouts:** Library = shelf of books, Shrine = offering slots on an altar, Capsule Corner = machine with a crank, Training Dojo = belt roster. Every other building = the framed button list.
- **Theme data:** `src/core/hubTown/panelTheme.ts` (pure; district of a building comes from its door on the Pocket Town map).
- **Unchanged:** all rules and actions (`core/town`), the sub-screens opened by actions (pick lists, quizzes, mini games still use the shared Picker), saves.
- **Tests:** `tests/unit/pocketPanels.test.ts`; `tests/e2e/town.spec.ts` opens the four special buildings and a plain one, moves focus, closes.
- **Limits:** sub-screens inside an action are still the generic list (not themed). Panels are fixed 700x440, not re-laid-out for narrow phones (they scale with the game canvas).

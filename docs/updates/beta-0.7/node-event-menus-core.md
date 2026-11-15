# Node Event Menus core (P1-P4)

- **Player gets:** a new Settings switch, **Node menus** (on by default since #1287). With it on, each map stop has a **Here** button that opens a menu of 2 to 5 cards: that stop's side stops plus small repeatable "micro" entries (Forage, Catnap, Odd job, Light spar, Scout ahead, Field notes, Something shiny). You get up to three picks per stop (Kice, 2026-11-14); the other optional cards lock. Story stops are always open. A required story card must be done before you move on. Off in Boss Rush, Speed Clear and Time Attack.
- **Save:** none. `settings.expansion.nodeMenus` has a default; `run.expansion.nodeMenus` is optional.
- **Limits:** off by default until the P7 sims pass. The bot sim never passes region 1, so late-game pacing is unmeasured. Menus show over today's stops only; Rival Takes It, forks and escorts come from the special-entries PR. Side stops past the menu size are hidden. Shops count as the pick when opened, even if you buy nothing.

# Dominion redesign R9: Rotom, the Boss Menu's Settings and the command wheel

Kice, 2026-11-21: "BUILD EVERYTHING AS CLOSE TO THE MOCKUPS AS YOU CAN. Keep redoing and remaking things until they look exactly like the mockups." Target: pass 50 of `plans/evil-mode-rework/redesign-50/`. Slice row R9 in `/mnt/project-files/plans/dominion-redesign-build/BUILD_SLICES.md`. Built on R0's kit (`docs/status/dominion-r0.md`).

## What R9 built

- **Settings home** (`set`): Esc then S. Eight tiles (Dominion, Rotom, Effects, Sound, Access, Controls, Save data, Lessons), arrows move on the grid, Enter opens. Each tile says what is set now.
- **Settings categories** (`setdom`, `rotom`, `seteff`, `setsnd`, `access`, `hud`, plus Display, Battle, Runs and Controls with the game's own rows): the left rail, five rows at a time (segments, switches, sliders), the Preview panel. Tab walks the categories, D resets one, Esc goes back to the home.
- **Pages around them:** Save and quit (`save`), Controls (`controls`, every action by keyboard, pad and touch), Options (`options`, with the six window frames), Calm mode (`calm`, one switch for every effect), Colour assist (`colours`, shapes on every colour), Read aloud (`readaloud`, the browser's own voice reads the text box; the word being read is marked), Button feel (`feel`, the cursor and press bounce), Region skin (`skins`, Kanto or Johto), Ambience (`ambience`).
- **Rotom's Key-Card vault** (`vault`): the five cards with their Legendary; Enter opens the card in the Key-Card window.
- **The command wheel** (`wheel`, hold Q): the Nova Dial over the page you are on, with Last pages and Pinned beside it. Every D28 test id kept.
- **The look settings reach every Dominion page:** heat warnings, status capsule, news ticker (on, quiet, off), key hints (full, icons, off), colour assist (shapes, high contrast), cursor, press bounce, window frame, page change (blade, fade, cut), region skin, skyline, glints, ambience and lightning. They are presentation only: the run never changes.

## Save change

Settings **v48** (`dominionPrefs.look`, `src/core/dominion/schema.ts`). v46 and v47 are identity steps (the Phantom UI versions on `ui-mockups`); v47 to v48 adds the default look to an older record and keeps everything else. Next free settings version: 49.

## Mockup vs game (960x540; game on top, mockup under)

| | | |
|---|---|---|
| Settings home ![](dominion-r9/set.jpg) | Dominion ![](dominion-r9/setdom.jpg) | Rotom ![](dominion-r9/rotom.jpg) |
| Effects ![](dominion-r9/seteff.jpg) | Sound ![](dominion-r9/setsnd.jpg) | Access ![](dominion-r9/access.jpg) |
| Screen ![](dominion-r9/hud.jpg) | Save and quit ![](dominion-r9/save.jpg) | Controls ![](dominion-r9/controls.jpg) |
| Options ![](dominion-r9/options.jpg) | Calm mode ![](dominion-r9/calm.jpg) | Colour assist ![](dominion-r9/colours.jpg) |
| Read aloud ![](dominion-r9/readaloud.jpg) | Button feel ![](dominion-r9/feel.jpg) | Region skin ![](dominion-r9/skins.jpg) |
| Ambience ![](dominion-r9/ambience.jpg) | Key-Card vault ![](dominion-r9/vault.jpg) | Command wheel ![](dominion-r9/wheel.jpg) |

Differences left on purpose: numbers, names and the HQ are the run's (a new run on day 1); the wheel's places are D28's real ones; the wheel keeps D28's Last pages and Pinned lists.

## Needs a mechanic (not built, no placeholder)

- Pages: `chatter`, `ask`, `rplan`, `rdiary` (Rotom's crew chatter, questions, plans and diary), `msgs`, `inbox`, `jukebox`, `radio`, `journal`, `chapters`, `photo`, `captions`, `portrait`.
- Rows the mockups show that the game has nothing behind: Auto-Checker (HQ floors are not in this release), Stage length (Dominion has no nodes), Crew banter, Voices volume, Mute when away, Focus view (V is taken), Spend cap (fixed at $10), Palette, Voice choice (Read aloud uses the browser's voice), Button sounds, Menus wrap round, Locked skins.
- Region skins Hoenn and Sinnoh show as locked ("Not drawn yet").

## Tests

- `tests/unit/dominionR9.test.ts` (10): v45 and v47 records migrate to v48 (boundary: half a look), a record with no Dominion prefs is left alone, a changed look round-trips, a bad look value fails; the look reaches the page root; pages keep their test ids; no page says Claude or AI; the wheel's ids and pointer.
- `tests/e2e/dominionR9.spec.ts`: the whole tour (home grid, every category by Tab, every page, Calm, Colour assist shapes on the Heat chip, a frame by tap, the cursor, Johto skin, Save and quit, the wheel); the run block is unchanged and the look survives a reload; no console errors. Shots in its output folder (`R5_WAIT`, `R5_DUMP`).
- `tests/e2e/dominionBossMenu.spec.ts` and `tests/e2e/dominionNav.spec.ts`: updated for the home and the new row order (Tutorial 0, Run length 1, Day pace 2, ... Show odds 6, End day 7, the Chair 9).
- `tests/unit/storyFoundation.test.ts`: settings 48.

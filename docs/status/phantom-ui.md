# Phantom UI (the Persona-style look, built for real)

Kice, 2026-11-19: "all looks good. I want you to actually implement this nearly exact, just more animated with the references still in mind" and "DO NOT CUT ANYTHING! IF YOU ADDED A MENU THAT ISN'T ALREADY IN THE GAME, ADD IT YOURSELF". The mock-ups are in `plans/ui-redesign-persona/` (83 pages, five versions).

## What it is

A third UI style next to New and Old: **Settings > Display > UI style > Phantom**. It has five versions (**Phantom version**: Red · Phantom, Blue · Midnight, Yellow · Channel, Green · Fantasia, Gold · Velvet), each with its own colours, shapes and trainer on the menus. It never changes a rule or an outcome. Main game only for now.

## How it is built

- It uses the New UI's HTML layer and the same scenes: a scene still owns the state and the keys, and its view draws a Phantom page when `ReduxCtx.ph` is set (`src/ui/redux/stage.ts`). A view's HTML that starts with the Phantom mark is drawn on its own layer `#phx` (1280 x 720, scaled onto the 960 x 540 game), so neither look's CSS reaches the other.
- The rules are the mock-ups' own CSS: `tools/build-phantom-css.mjs` turns `plans/ui-redesign-persona/src/css` into `src/ui/phantom/phantom.gen.css` (scoped under `.phx`, pass classes folded into `.phs`, every animation renamed `ph-...`). Hand additions go in `src/ui/phantom/phantom.css`; give new classes a `ph-` name (short names already mean something in the mock-up rules).
- Pages are in `src/ui/phantom/screens/`, built with `src/ui/phantom/kit.ts` (`page(id, html)`, sprites, cut-out letters, key hints). A Phantom view is redrawn by changing only what differs (`morph.ts`), so entrances play once and the cursor glides.
- The rules and fonts (`public/assets/fonts/phantom/`, the mock-ups' Google Fonts, all under the Open Font License) load the first time the style is used.
- A screen that has no Phantom page yet shows its New page in Phantom colours (`.phfb` in `phantom.css`), so the whole game is playable in the style from the first slice.
- `?ui=phantom` in the address forces the style for one page load (the browser tests use it; an automated browser gets Old otherwise).

## Slices

| Slice | Pages | State |
|---|---|---|
| 1 | The style and version settings (settings v46), shared kit, Title splash, main menu, Settings (three presets, ten pages with a live screen, Phone page) | done |
| 2 | Shared pages (menu, option rows, picture wall, board, number tiles, confirm), save files, Version Select (new page), and a new run: Trainer, Rules, Partner, Plan, name keys | done |
| 3 | Party, Summary (every tab, the action menu, the move tooltip), Bag, Pokédex entry (both pages), the town dock (Hub Town and a Plaza), the PC | done |
| 4a | Stage map (legend, stage banner, node menu), its pause menu, events (talk, choice, outcome, reward), the reward draft, the shop | done |
| 4b | Talk pages (prologue, story, tutorial, the partner quiz), heal, department store, trades, the map's pop pages, quick wheel, log, Seed & Codes | |
| 5 | Battle screens and cut-ins | |
| 6 | Ceremonies, rivals, phone, ending pages, and the menus the game does not have yet | |

## Slice 1 notes

- Settings: the game's own nine groups under the mock-ups' short names (Game, Battle, Look, Sound, Controls, Access, Text, Story, Save) plus **Phone**, a new page that gathers the settings that matter on a phone. Nothing was dropped: Game Summary, Search, Reset and Back are buttons under the tiles. Q and E turn the page, R (pressed twice) puts the open page back to its defaults, P uses the next preset.
- Presets (new): Showtime, Standard, Calm set the same motion, flash and reading settings together (`src/core/presentation/phantomPresets.ts`); keys, sound, look and gameplay are left alone.
- The live screen on a Settings page shows the main menu for now; it will show the page each setting belongs to as those pages are built.
- Title: "Press any button" shows once per page load; V opens Version Select.

## Slice 2 notes

- **Shared pages** (`src/ui/phantom/templates.ts`, `shared.css`): the New UI's shared views (`menuView`, `settingsView`, `gridView`, `boardView`, `statsView`, `savesView`, the confirm card) hand over to a Phantom page with the same model, so every hub room, archive and run menu built on them is in the style at once. The Phantom style always steers by layout A (`stage.ts` fixes `v` to 0): one column of rows, a wall six wide.
- **Version Select** (`VersionSelectScene`, new): five cards; V on the title, or Settings > Version Select. It only changes the `phantomVersion` setting.
- **A new run** (`screens/run.ts`, `run.css`): the step ribbon follows the game's real order (Trainer, Rules, Partner, Plan), not the mock-up's. Run rules is the Preparation Desk (its last row, Depart, is the big blade); the Plan is the Campaign Briefing.
- A key hint that says Esc is a button on every Phantom page (it presses Esc for the scene).
- Still in the stand-in look after this slice: Seed & Codes (its text box is a real input laid over the page) and the talk pages (prologue, story, tutorial), which come with the event pages in slice 4.

## Slice 3 notes

- **Party and Summary** (`screens/party.ts`, `party.css`): the Party is two cards wide (`partyCols` says 2 in Phantom), with the lit Pokémon's ability, nature, item and moves beside it. The Summary keeps every tab the game has; Stats draws the mock-up's six-point chart with the IV and EV rows next to it.
- **Bag** (`screens/bag.ts`): pockets, seven rows, the item card and who in the team the lit item would help. The card shows what the game's line adds ("No Pokémon needs it right now") once, under the description.
- **Pokédex entry** (`screens/dex.ts`): the mock-up's entry page plus the six base stats; the second page (facts and level-up moves) keeps the left side.
- **Town dock** (`screens/town.ts`): Hub Town's menu and a Plaza's districts as slanted words beside the version's trainer, the crowd at their feet. In Phantom, Up and Down move and Left and Right change the tab.
- **PC** (`screens/box.ts`): the mock-up's Reserve page with the game's one action per slot (move to the party, or put a party Pokémon in an empty slot).
- **Around a Picker** (`picker.ts`): the chips beside a title, page tabs, the "more" sheet (I) and an empty list are drawn inside the Phantom page.
- Still to come for these pages: the mock-up's Town Map directory and Summary / Give item buttons on the PC (slice 6), and the pause menu, which belongs to the map (slice 4).

## Slice 4a notes

- **Stage map** (`screens/map.ts`, `map.css`): six stops across, the window following the trainer. The mock-up's card at the right shows the lit stop (or the lit button) and under it every line the New map's header carries. Every chip, egg, side stop, mark, button and key of the New map is on the page. A column of four or more stops is drawn closer with smaller diamonds so none touch.
- **Pause** is a page of its own (the mock-up's pause): the game's six choices as slanted words, money, badges, level cap and the team. A click beside the words resumes.
- **Node menu**: one card per thing to do at a stop, the required one marked.
- **Events** (`screens/event.ts`, `event.css`): the mock-ups' steps as Talk, Choose, Outcome, Reward ("Side stage" is the battle itself, slice 5). The event director's drawn scene is the backdrop; the speaker is the big bust, everyone else, the Pokémon and the named things stand beside. The text box waits (ALL EVENTS rule), choices are dealt as cards (up to four with their text; five or more in two rows with the lit one read out underneath), the outcome's text comes first with "What changed" sealed, then the changes open as cards and stay until Enter. Kept from the New page: tag, money, countdown and its bar, Trade card (T), Their team (R), tournament rounds (B), the big title, the standing panel, the trade picker, the black-screen scare. New in Phantom: number keys light a choice card (Enter still chooses).
- **Reward draft and shop** (`screens/stops.ts`): "PICK ONE" cards with who each helps, Party/Bag as gold tabs, the result card that stays until Enter. The shop has the clerk (the overworld Mart clerk; Kecleon and Meowth keep their own shops), the shelf, the lit good's card with Buy 1 / Buy 5 / Add to basket, Sell, the Depot's basket and checkout, and who can use the good.
- Still in the stand-in look after 4a: the team's own event screens (briefing, table, final, rank up), the Honest Trade Card, the bracket, the code-name card, a department store floor, and the map's pop pages (report, dossier, book, roll, track).

## Known limits

- The Phone page's rows from the mock-up that the game has no setting for yet (touch button size, swipe to switch, hold for details) come with slice 6.
- Evil Mode pages of the mock-ups are not started (Evil Mode lives on its own branch).

## Tests

- `tests/unit/phantomUi.test.ts`: the settings upgrade to v46, the style and version rows, the presets, the Title and Settings pages, the generated rules file.
- `tests/unit/phantomTemplates.test.ts`: the shared pages and the run pages (windows that follow the cursor, nothing cut with an ellipsis, the hand-over only while Phantom is on).
- `tests/unit/phantomPages.test.ts` and `tests/e2e/phantomTeam.spec.ts`: the slice 3 pages (models to HTML; in the browser from a run's map and from the hub, all five versions, four window sizes, text-fit check).
- `tests/unit/phantomMap.test.ts`, `tests/unit/phantomEvent.test.ts` and `tests/e2e/phantomRoad.spec.ts`: the slice 4a pages (map, legend, pause in five versions at five sizes; an event from its first line to its reward with nothing given before its text is closed; shop buying; the reward draft and its result).
- `tests/e2e/phantomRun.spec.ts`: save files, a whole new run from Trainer to Depart, and the shared pages in the other four versions at four window sizes, each with the text-fit check.
- `tests/e2e/phantomUi.spec.ts`: splash, main menu by keys and mouse, Settings (presets, pages, changing a value, Phone, all five versions) with a check that no text is cut off or off the screen, and the stand-in look for a screen without a Phantom page.

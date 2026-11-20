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
| 4b | Talk pages (prologue, story, tutorial), healing spot, the map's five pop pages, trades (quick trade and Honest Trade Card), tournament bracket, a rival's team page, department store floors, the card page (run card, hub Trainer Card, code-name card, Trainer card in the pause menu), the team's own event screens (briefing, Leader's Table, Final Choice, filed result, rank up), the partner quiz, the quick wheel, the run log, Seed & Codes | done (PR #1523) |
| 5 | The battle page (fan, move cards, lists, info papers, log), the versus card, boss / ace / transformation cards, the Mega, Tera, Dynamax and Z-Move cut-ins, the wild, send-out, hit, knock-out, win, result and rival-loss cards, the gimmick page, the phase card, the side stage card, and the decision pages (a new move, a caught Pokémon, a plain choice, the yes/no box) | done |
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
- Seed & Codes and the talk pages (prologue, story, tutorial) were left in the stand-in look by this slice; both are Phantom pages since slice 4.

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
- Still in the stand-in look after 4a (see the 4b notes for what has since been built): the run end's first page is a stand-in until slice 6; its Run card button already opens the Phantom card.

## Slice 4b notes
- Talk pages: the prologue, story chapters and the tutorial draw the event page without the step strip. A lone "Continue" keeps the text box as the button. Left and right move along the cards (the tutorial's left still turns back a lesson page).
- Healing spot (`phHeal`, page `heal`): the rules heal at once; the page then shows each Pokémon's ball lighting and its HP filling from what it was, then "ALL BETTER!". It stays until Enter, Esc or a click, then the map shows the same notice as before.
- Map pop pages (`screens/pops.ts`, `pops.css`): Rival Report (R), Dossier (D), Field Notes (F), Notebook (T) and the Town Roll, each a full page that closes on the same keys as before. Unknown rows stay hidden as "???".
- Trades (`screens/trade.ts`): the quick trade (your Pokémon, theirs, what it costs, Accept / Decline, arrows step through offers) and the Honest Trade Card. The "TRADED!" result stays until Enter.
- Tournament bracket and a rival's team (`phBracket`, `phScout` in `pops.ts`): the bracket pages by round with the winner's card at the end; the team page shows the rival's bust and each Pokémon's level and types.
- Department store floor (`phStore` in `stops.ts`): while choosing, a floor is the shop page: the directory with this floor marked, goods with prices split from their names, "left after", who a good helps, and the reason a locked good can't be bought. Its talk and outcome stay the event page (text first, then what changed).
- Card page (`phCard` in `screens/ending.ts`, mock-up `card`): one page for the run card at a run's end (click or Enter saves it as a picture), the hub's Trainer Card and the code-name card a team hands you (its welcome line stays beside the card until Enter). Five facts sit on the card, the rest stand beside it. **New in Phantom:** the pause menu has "Trainer card" as in the mock-up, with this run, the rival and the blessing beside it (the New and Old looks keep their six pause buttons).
- The team's own moments (`screens/teams.ts`, `teams.css`): the Mission Briefing as cards with every number, the Leader's Table (seats, the map with the plans as pins, your chair), the Final Choice (black page, the orb, four corners, a ring of faces, a ring that fills while you hold), the filed report, and the Rank-Up on the mock-up's RANK UP page with the team in rows. Press-and-hold by mouse works on both layers now (the press is heard on its way down).
- Partner quiz (`phQuiz` in `screens/run.ts`, mock-up `quiz`): Prof. Vance beside the question, the dots for where you are, the answers as numbered cards two to a row (a lone last one centred; more than six in one column). Number keys light an answer, up and down move a row, Esc goes back a question. The professor's opening words stand smaller above the first question. Found on the way and fixed: a story portrait (`Art.k` above 1) stood about 880px tall on Phantom talk pages, so `tall()`/`tallSize()` in `screens/event.ts` keep its frame to the page; a choice page whose question is many short lines sets it smaller, and past 15px deals the cards lower.
- Quick wheel (`phWheel` in `screens/system.ts`, mock-up `wheel`; **new menu, Phantom only**): hold TAB on the map, point with the arrows or the mouse, let go to open; a quick tap (or the Tab key hint) leaves it up for Enter, a click or Esc. Slots: Party, Bag, Rivals, Log, Trainer card, Reserve, Save, Settings (Rivals and Reserve are dimmed until the run has them). The mock-up's Phone and Pokédex slots join when those pages are built (slice 6); the slots space themselves for any count. Limit: the map only, not inside an event or a battle.
- Run log (`phLog` in `screens/system.ts`, mock-up `log`): in Phantom, L (Shift+L on the map) and the wheel open a whole page that reads the run back: a heading per stage and event, who said what, "You chose", and what changed. It is drawn over any screen by the overlay layer (`mountOverlay`'s `page`) and takes every plain key while open, so nothing reaches the screen under it. The store is `InteractionLog` in `core/presentation/uiPrefs.ts`: `tell()` lines go to the run log only (160 kept, never saved, emptied when another run starts: the RUN MEMORY rule); the New and Old log window is unchanged. Events feed it from `EventScene` (pages as read, the choice, the outcome); battles will in slice 5.
- Seed & Codes (`phSeed` in `screens/run.ts`): the letter keys of the name page with digits, dot and dash, the three buttons, the four kinds of code the old page lists, and the note that turns into what went wrong. The value window (`.rx-field`) is empty: `RunSeedScene` lays its real text box over it, as in the New look, so typing, paste and a phone's keyboard work.
- Gotchas for later pages: the mock-up's `.dim` is a full-screen cover, never use it as a modifier; `.tabs` only has a place on the Settings page, use `pockets ph-tabs`.

## Slice 5 notes
- Battle page (`phBattle`, `phBattleList` in `screens/battle.ts`, `battle.css`): see-through over the live field. The command fan stands round the Pokémon that is choosing (its place comes from the scene, `BattleModel.me`); keys shown are the game's real ones (Q/E pages, T Auto, I Info). Moves are cards with type, power and PP; Party and Item are tilted paper lists; the info papers, the log and the level-up window are Phantom too. The battle styles setting is untouched.
- Versus and cutscene cards (`screens/cutin.ts`): `phVersus` (both sides, the cut-out VS, the foe's line once, what is at stake: a rival card says a loss never ends the run), `phCut` in three cuts (a boss with what they bring, an ace or a Legendary under its star, a transformation), each with the five-beat strip and its skip key.
- Transformation cut-ins (`phGimmick`): Mega / Primal, Terastallize (the Tera type, the word letter by letter), Dynamax / Gigantamax (turns and HP before and after) and a Z-Move (name, type, power, crystal). They play instead of the long reference scenes while Phantom is on, motion is full and that mechanic's Fast setting is off; the short canvas cinematic still swaps the form.
- Battle moments (`screens/moments.ts`, played by `BattleScene.phMoment`): a wild Pokémon steps out (`wild`: name, level, types, new to the Pokédex or shiny, whether a ball works and which balls are in the Bag; raids, Totems and Legendaries keep their own cards), both sides send out (`send`, with the party order), a hard hit you land (`hit`: super effective or critical, the damage, the bar draining), a knock-out (`ko`: one-hit line, how many the Trainer has left), the win (`win`: the Trainer class's losing line), the tally (`result`: Exp bars from before to after, level-ups, prize money, turns, items; it waits for an input and stands in for the "You got" lines) and a loss to a rival (`rloss`: the run goes on).
- When the short cards play: only with motion full. The hit and knock-out cards are also left out while Auto-Battle plays or Battle speed is Fast or Quick. Every card ends on a click or the confirm key; none of them reads or changes battle state (they are drawn from the finished turn).
- Decisions (`screens/decide.ts`, `decisionView` hands over): a new move (`learn`: the move on its card, the known moves as the list, the way out as a blade; a long TM list goes to two columns), a caught, hatched or returning Pokémon (`capture`: the cut-out word, its card, where it goes, the party, the facts; I opens every detail), and a choice with no Pokémon (`choice`). The result line stays on a sheet until an input. The scene's yes/no box (`mountConfirm`) is the Phantom dialog and lies over the page.
- Gimmick page (`gimmick`, `phGimmickPick`): G in the move menu, or the "G Gimmicks" chip over the moves, opens all four gimmicks: which are ready (and with what: the stone, the Tera type, the turns, how many moves can become a Z-Move) and, for the others, the game's own reason (no ring, already used, still charging...). Z on a ready one arms it for the next move and goes back to the moves; Z on an armed one takes it off. "The other side" says how many gimmicks the Trainer still has (a count only, never which). It uses the scene's input actions, so rebound keys work. New to the game: before, the only way to see why a gimmick was missing was that its button was not there.
- Phase card (`phase`, `phPhase`): stands in for the pink phase banner when a boss's last Pokémon crosses an HP line (LAST STAND), a raid or a Totem moves to its next phase (PHASE n, with the meter) or another rule turns the fight (IT CHANGES). Inside a turn it follows the hit card's rule (motion full, not in Auto-Battle or Fast/Quick) and ends by itself; when the final boss rises for its second phase it waits for the player.
- Side stage card (`side`, `phSide`): a fight inside an event (a pseudo-stage fight) opens on it: the event's name and step strip, the rule that it uses no stage up, the stage the run is still on, and who waits (a wild Pokémon with level, types and whether a ball works, or the Trainer and their team size). It stands in for the wild card.
- Run log: a battle adds a heading ("Battle: who"), what Trainers say, and how it ended.

## Known limits
- The mock-up's "Change who leads" key on the send-out card is not there: the game has no rule for changing the lead once a battle has begun (the lead is set on the map), and this slice changes no rules.
- The mock-up's Pokédex key on the wild card waits for the Pokédex page of slice 6.
- The side stage card has Z Fight only: the mock-up's Party and Back out keys would need a rule for leaving a fight that has already begun, which the game does not have.
- The phase card does not say "the music changes": it only states what is true in the battle.
- Screens still on the stand-in look (to do in slice 6): League counter-pick, jigsaw, mini-games, ops, rival panels, Safari, Spirit Market, the tree and the wide pages.

- The Phone page's rows from the mock-up that the game has no setting for yet (touch button size, swipe to switch, hold for details) come with slice 6.
- Evil Mode pages of the mock-ups are not started (Evil Mode lives on its own branch).

## Tests

- `tests/unit/phantomBattle.test.ts` (10 tests), `tests/unit/phantomCutin.test.ts` (14 tests), `tests/unit/phantomMoments.test.ts` (12 tests), `tests/unit/phantomStages.test.ts` (8 tests): the battle page, the cards, the cut-ins, the moments and the decision pages as pure pages (what is shown, what is left out, escaping, limits).
- `tests/e2e/phantomBattle.spec.ts` (5 tests; the fifth: the gimmick page by keys and clicks with and without a Tera Orb, that the press which arms one does not also pick a move, the phase card and the side stage card, in five versions with the text-fit check): the battle page by keys and clicks in five versions at five sizes; the ace, boss and transformation cards; a Trainer's versus card and a Gym Leader's boss card; a wild battle from the wild card through the send-out, then the hit, knock-out, win, result and rival-loss cards, each with the text-fit check.
- `tests/e2e/phantomDecision.spec.ts` (2 tests): learning a move (list, confirm, the answer that stays), a caught Pokémon (details sheet, joining the party) and a plain choice, across the versions and sizes.

- `tests/unit/phantomUi.test.ts`: the settings upgrade to v46, the style and version rows, the presets, the Title and Settings pages, the generated rules file.
- `tests/unit/phantomTemplates.test.ts`: the shared pages and the run pages (windows that follow the cursor, nothing cut with an ellipsis, the hand-over only while Phantom is on).
- `tests/unit/phantomPages.test.ts` and `tests/e2e/phantomTeam.spec.ts`: the slice 3 pages (models to HTML; in the browser from a run's map and from the hub, all five versions, four window sizes, text-fit check).
- `tests/unit/phantomMap.test.ts`, `tests/unit/phantomEvent.test.ts` and `tests/e2e/phantomRoad.spec.ts`: the slice 4a pages (map, legend, pause in five versions at five sizes; an event from its first line to its reward with nothing given before its text is closed; shop buying; the reward draft and its result).
- `tests/unit/phantomStops.test.ts`: the reward draft, the shop, the healing spot and a department store floor as pure pages (10 tests). `phantomRoad.spec.ts` also plays a healing spot, the tutorial's talk pages and buying a Fire Stone on a store floor.
- `tests/unit/phantomPops.test.ts` (13 tests) and `tests/e2e/phantomPops.spec.ts`: the pop pages, the Town Roll, the bracket and a rival's team. `tests/unit/phantomTrade.test.ts` (7 tests) and `tests/e2e/phantomTrade.spec.ts`: both trade pages, accept and decline.
- `tests/unit/phantomEnding.test.ts` (4 tests) and `tests/e2e/phantomCards.spec.ts`: the card page as the code-name card, the run card (saving it) and the hub's Trainer Card; `phantomRoad.spec.ts` opens the Trainer card from the pause menu.
- `tests/unit/phantomTeams.test.ts` (8 tests) and `tests/e2e/phantomTeams.spec.ts` (4 tests): the team's own pages, the report that waits, the rank-up, the pins that move, and the hold by key and by mouse.
- `tests/unit/phantomQuiz.test.ts` (7 tests) and `tests/e2e/phantomQuiz.spec.ts`: the quiz page, its keys, clicks and way back, all twelve questions fitting across the versions and four window sizes, the portrait's size, the question that is set smaller, and Seed & Codes as a pure page. `phantomRun.spec.ts` plays Seed & Codes (keys, Clear, a bad code, Confirm, the box inside its window at five sizes).
- `tests/unit/phantomSystem.test.ts` (10 tests) and `tests/e2e/phantomWheel.spec.ts` (2 tests): the run log's store, which rows fit, the Log page, the wheel's steps and slots; in the browser the wheel by hold, tap, mouse and Esc in five versions, and the log filled by a real event, read back over the event without its keys leaking.
- `tests/e2e/phantomRun.spec.ts`: save files, a whole new run from Trainer to Depart, and the shared pages in the other four versions at four window sizes, each with the text-fit check.
- `tests/e2e/phantomUi.spec.ts`: splash, main menu by keys and mouse, Settings (presets, pages, changing a value, Phone, all five versions) with a check that no text is cut off or off the screen, and the stand-in look for a screen without a Phantom page.

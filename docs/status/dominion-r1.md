# Dominion redesign R1: the Start and Guide pages

Kice, 2026-11-21 12:25 PM PT: "BUILD EVERYTHING AS CLOSE TO THE MOCKUPS AS YOU CAN. Keep redoing and remaking things until they look exactly like the mockups." Target: pass 50 of `plans/evil-mode-rework/redesign-50/`, slice R1 of `/mnt/project-files/plans/dominion-redesign-build/BUILD_SLICES.md`. Built on R0's kit (`src/ui/redux/screens/dominion/r50/kit.ts`).

## What R1 built

- **Start pages** (`r50/start.ts`): the title (Continue card with the Boss, day, money, party and goal ring; New Dominion, Tutorial, Settings, Back to Pocket Raiders; the crew on the skyline), the Boss (portrait, the run's three Pokémon, notes, the Charters row), the Team Types (one scrolling list of all eighteen types, the picked pair's Pokémon in the detail), the first member (Grunt or Admin, five skills), the Charters page (`nextrun`: what carries over, four Charter cards, locked until one run is finished), the opening talk (`cold`: Rook and the Boss on the street, one line at a time), the Founding (name, colours, mark, motto, goal, with the door and armband preview) and the sign going up (`sign`).
- **Guide pages** (`r50/guide.ts`): How much help? (`tut`), the Lesson Book (5-wide grid, the Tutorial setting and links to the Guide pages beside Rotom), the Style sheet (K), the Motion sheet (Enter on the Style sheet, or M), Rotom's X-ray over the HQ in two parts (I), and How pages connect (hold Q, press M; Tab turns to the back rooms).
- The title's Tutorial row opens the Lesson Book; Settings opens the Boss Menu's settings; Esc comes back to the title.
- Every `data-testid` older specs use is kept. Pages are display only: no state change, no RNG.
- Small shared additions: `data-scrollrow` in `src/ui/redux/stage.ts` (a list scrolls so the cursor row shows), `boardPins`/`boardStep` in `src/core/dominion/nav.ts`, the atlas-sprite rules in `r50/game.css`.

## Mockup vs game (960x540, mockup left)

| Page | Mockup | Game |
|---|---|---|
| Title | ![](dominion-r1/mock-title.jpg) | ![](dominion-r1/game-title.jpg) |
| How much help? | ![](dominion-r1/mock-tut.jpg) | ![](dominion-r1/game-tut.jpg) |
| The Boss | ![](dominion-r1/mock-boss.jpg) | ![](dominion-r1/game-boss.jpg) |
| Team Types | ![](dominion-r1/mock-setup.jpg) | ![](dominion-r1/game-setup.jpg) |
| Charters | ![](dominion-r1/mock-nextrun.jpg) | ![](dominion-r1/game-nextrun.jpg) |
| Opening talk | ![](dominion-r1/mock-cold.jpg) | ![](dominion-r1/game-cold.jpg) |
| The Founding | ![](dominion-r1/mock-found.jpg) | ![](dominion-r1/game-found.jpg) |
| The sign | ![](dominion-r1/mock-sign.jpg) | ![](dominion-r1/game-sign.jpg) |
| Lesson Book | ![](dominion-r1/mock-lessons.jpg) | ![](dominion-r1/game-lessons.jpg) |
| Style sheet | ![](dominion-r1/mock-style.jpg) | ![](dominion-r1/game-style.jpg) |
| Motion sheet | ![](dominion-r1/mock-motion.jpg) | ![](dominion-r1/game-motion.jpg) |
| X-ray | ![](dominion-r1/mock-xray.jpg) | ![](dominion-r1/game-xray.jpg) |
| How pages connect | ![](dominion-r1/mock-board.jpg) | ![](dominion-r1/game-board.jpg) |
| First member (no mockup; file layout) | | ![](dominion-r1/game-member.jpg) |

Differences left on purpose (live data, not looks): a new profile has no Continue card and the Charters are locked; the Boss is the run's trainer with the run's three Pokémon; numbers, names and lessons are the run's; the game asks Boss, then types, then member (the mockup numbers types as step 1).

## Follow-up rules (built 2026-11-27, director answer: simple real rules for the left-out bits)

- **Boss stats and traits** (`src/data/dominion/start.json` `boss`, `src/core/dominion/bossTraits.ts`): each trainer starts with its own Edge spread (always 10 points: Brawn, Nerve, Wits, Charm, Stealth) and two traits. Traits act for real: Silver Tongue +10 and Champion's Pride +5 Conviction when the Boss (not an Admin) starts a Debate; Old Grudge +5 Tension on every rival team at the start; Loud Mouth +5 Heat, Clean Record -5 Heat at the start; the learn traits (Quiet Type, Bookworm, People Person, Hard Hitter, Steady Nerves) add 1 XP to their stat each time it grows. Red: Quiet Type and Steady Nerves; Blue: Champion's Pride and Loud Mouth; Green: Bookworm and Clean Record; Hilda: People Person and Hard Hitter; Nate: Silver Tongue and Old Grudge. The block keeps `boss` (optional, so runs started before keep their Edge and have no traits).
- **Hall of Infamy and the Boss title** (`src/core/dominion/hall.ts`, profile `dominionHall`, optional with default `[]`, no version bump): a finished run (last region Taken) is kept once, newest first, at most ten: team, region, day, Boss, right hand and two more crew, Ace. The newest gives the title ("Boss of Kanto") on the Boss page. Next Dominion lists the Hall and the title; H opens the Hall (R8's Hall of Infamy page), Esc comes back.
- **Opening talk Log and Auto**: L opens the talk log (every line so far, by speaker), L, Esc or Enter closes it without skipping a line; the Auto chip turns auto-advance on or off (one line every 2.6 s, `boss.autoMs`; off by default). A is not used for Auto because A is a move key.
- **The paper on the sign** (`founding.json` `paper`): the Founding runs the story in the Ledger and really moves the HQ district's Dread +3 and Regard -1; the sign shows the clipping and a "<district> talks" row.

| Page | Game |
|---|---|
| Boss: stats and traits | ![](dominion-r1/game-fu-boss.jpg) |
| Opening talk: Log | ![](dominion-r1/game-fu-cold-log.jpg) |
| The sign: the paper | ![](dominion-r1/game-fu-sign.jpg) |
| Hall of Infamy (from Next Dominion) | ![](dominion-r1/game-fu-infamy.jpg) |

Still not built: **Your own team** as a Charter card (New Dominion already does this from the title), Rocket's Tension line on the sign, and page counts on How pages connect (the board lists the real routes).

## Tests

- New `tests/unit/dominionBossTraits.test.ts` (8 tests): Edge sums, the run start's traits, Silver Tongue, learn XP, clamps, the Hall (once, newest first, ten), old profiles, the Founding paper.
- New `tests/e2e/dominionR1.spec.ts`: walks every Start and Guide page by keys and taps; checks the run is unchanged by the Guide pages; Boss stats and traits, the talk Log and Auto, the sign's paper, and the Hall from Next Dominion. `R5_DUMP=1` also saves a shot and the page HTML of each page for the side-by-side.
- `dominionTutorial.spec.ts`: the Lesson Book's Tutorial setting is now a tap (arrows walk the grid, as in the mockup).

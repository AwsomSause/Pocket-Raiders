# Evil Mode slice 22: other beginnings

- **Evil Mode slice 22, "other beginnings"** (2026-11-18, build plan `/mnt/project-files/plans/evil-mode/31_THE_BUILD_PLAN.md`; design Part 28 and Part 29 sections 17 and 22). Built on slice 20 (PR #1479).

## What the player can do
- **Take a Charter.** On the Founding screen, the Charters tab (tap it, or press C) lists nine ready-made teams: Rocket, Rocket's Return, the Joint Command, Galactic, Plasma, Flare, the Two Boards, the Group and the Staff Room. Each prints every page: name, Creed, Line, Doctrine, motto, first region, the house, starting numbers, the first Morning, the desk (three dated things), the house rule, the Old Guard and the trouble on day three. "Take it" twice takes it. The Boss and the starter stay the player's. All nine are open from the first play; nothing unlocks them.
- **House rules that play** (the Board's title row shows the rule, and its button, also key U):
  - Rocket, *the Ledger pays back*: any Evening, return one thing for Carrow's valuation (a fixed list), Regard +1; never Funds, never cools Heat. Counted on the Ledger's last-page line.
  - Rocket's Return, *the roll's called*: answer the roll each Morning; seven running pay Loyalty +1, once a region; a missed day breaks the run and drops the roll by ten.
  - The Joint Command, *one of each*: everyone's red or blue; team Loyalty is the lower half; the Hall votes on a name once both halves are Steady (6). Loyalty is shown as band words, never a figure.
  - Flare, *members*: dues ₽400 a member every seven days.
  - The Staff Room, *the register*: Take and Lean are absent from Dispatch (not dark); the Line control is absent and a move is refused; Dread stays 0; Heat stops at 3; no minor on the Roster.
  - Every Charter: inherited Loyalty 4 (Staff Room 6), and Loyalty moves count double for the first seven days.
  - The roll (Rocket's Return, Galactic, Plasma): a display figure, full roll × Loyalty ÷ 10.
- **The Turn.** A main-game run whose takeover after "Take it all" was won (`evil-start-<team>` set; Rocket's and Rocket's Return's routes now set `evil-start-rocket` and `evil-start-rocket-return`) sees one card on returning to the map: four fields, "Take the chair." (with a confirm) or "Take it all, and walk away." Not shown after a lost takeover, any other route ending, in the last region, or with Evil Mode off. Walking away changes nothing but noting the answer. Taking it converts the run by a table (no roll, no run stream touched): money to Funds up to ₽10,000 (the rest stays the Boss's), Regard +1 per two badges up to 4, Loyalty 4, Dread 2, pages 2 to 8 the matching Charter's, the first region the next one on the map (if written), the run's own region count (up to six), the Ledger's first page the inside route and the Old Guard's Turn line; the run's four rivals take the Hero, Rival, Friend and Stray roles (Hero: most meetings; Rival: beaten most; Friend: least wants to win; Stray: the fourth), their records kept. The Hero starts at temper 1 with a mark per meeting (max 5). With the Old look selected the New layer is mounted and the card says so in one line.
- **Phone.** A narrow window (under 820 px wide, a phone in landscape) gets thumb-sized buttons, and on Dispatch tapping a method with somebody picked opens the Card at once: where, who, how, confirm, four taps.
- **Settings** (Gameplay): Evil Mode dispatch rolls (Shown / Shown, with the seed), Evil Mode fire reminder (On / Off, a Morning line while a fire's lit on the road), Evil Mode Card speed (shown greyed: the Card always scrolls to its end).

## Saves
No block version bump: `charter`, `turn` and `settings.regions` are optional; a block without them reads unchanged. Log kind `charter` added. Two settings keys added with defaults (no settings version bump, as slice 1).

## Tests
`tests/unit/evilModeCharters.test.ts` (20): Part 28's tests 1-6, 8, 9, 12, 15, 17-21; the tab model; charterInRun; the settings. Browser `tests/e2e/evilModeCharters.spec.ts` (4): the Charters tab and the Staff Room by taps (four sizes, no sideways scroll); the Turn taken and reloaded; walking away; a job in four taps at 740×360.

## Limits
- **Limited Charters** (house rule printed on the tab, not played): Galactic (moods are shown as on any team), Plasma (the sentence isn't written in play; Cause is limited, so Plasma uses Belonging), the Two Boards (one purse), the Group (spends aren't held for the board). Flare's seats and the table's length aren't played (every member is laid for). The Joint Command uses Power (Cause is limited) and draws one Doctrine.
- The Old Guard is named on the tab and in the Ledger's first lines; the neighbour itself is still the region's canon neighbour (no two-district grab, no "house is whole" scene). The desk items are Ledger lines, not dated Board items. The first Morning's choices (Saturn's title, Yarborough's tray...) are printed, not asked.
- The Turn: Loyalty ± and Dread + by route flags, the moods of the people met, the first meeting after (day 2), names for a day, lending the pocket at a Crossing, the chronicle as the File's first pages: not built. The Turn's evil run starts at once at the next region's Arrival (the rest of the main region isn't played).
- Phone: the rails as slide-in tabs, two Roster cards a row and the Ledger one page at a time are not built; the layout scales as before with larger tap targets.
- Settings not built here: the Hero's pace, the mole (slice 17), Letters (slice 18), Names, Shadow branch and Incursions (slice 21).
- Undo: set `"on": false` in `src/data/evilMode/charters.json` (no tab, no Turn card).

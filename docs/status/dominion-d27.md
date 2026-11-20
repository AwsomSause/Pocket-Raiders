# Dominion D27: Boss Menu + Dominion settings

Plan: BUILD_SLICES.md row D27. Mockups: `plans/evil-mode-rework/mockups-v4/` m1 (Boss Menu) and m2 (Settings · Dominion).

## What the player can do
- **Esc on the HQ opens the Boss Menu** (m1): the Boss on the crimson throne with Persian, nine slanted blades (Back to work Esc, Empire · HQ 1, Crew Roster 3, Pokémon Reserve 4, Operations 5, Ledger 6, Rotom R, Settings S, Go into hiding End), Empire at a glance (day, funds, Heat, Regard · Dread, Goal and district Control %, the Hero's Threat, the rival alert), the save slot and a Boss quote. Esc on any other page still goes back first; at the top of a run page the menu opens instead of quitting (End still saves and quits from anywhere). The menu changes nothing in the run.
- **Settings** (m2), one list of nine categories: **Dominion** (Your run: Run length, Day pace, Hero pressure, Betrayals, Show odds on the Card, End the day when no actions are left, Charters locked; the Effects & motion block beside it), **Effects & motion** (Full show / Lighter / Calm tiles, Particles, Cut-ins, Screen shake, Flashes, a live preview, why the game's settings hold anything down), and the game's own Display, Audio, Rotom, Battle, Runs, Accessibility rows (same registry as the title's Settings, ◀ ▶ changes), plus Saves (Save now, Go into hiding). Keys: ▲ ▼ pick, ◀ ▶ change, Enter toggles, Tab next category, D resets the tab, Esc back. Every row is tappable.

## Rules
- The run rules are saved in the settings record (`settings.expansion.dominionPrefs`, optional with defaults, no settings bump) and **stamped on the block when a Dominion starts** (`block.rules`, optional, no block bump): a run keeps the rules it began with; a block without them (every run before D27) plays at Normal with factors of exactly 1, so old saves and seeds decide the same.
- **Day pace** (Calm ×0.75, Normal, Ruthless ×1.3, `src/data/dominion/settings.json`) scales every rise in district Heat (`addHeat`) and rival Tension (`addTension`); falls are never scaled.
- **Hero pressure** (Low ×0.8, Normal, High ×1.25) scales the Hero's Threat (`threatOf`), so stages and the Hero's visits come sooner or later.
- **Show odds on the Card** off draws the dial as "?" and hides "how the odds are made" (drawing only; the roll is the same).
- **End the day when no actions are left**: after the Day's last action (an order, a Card action, or the battle it led to) the Day ends by itself (same `endDay` step as pressing it).
- **Effects & motion** is presentation only (`src/core/dominion/fx.ts` `fxOf`, `fx.css`): every Dominion page is wrapped in `.domfx` with `fx-full|lighter|calm`, `fx-nopart`, `fx-noshake`, `fx-flash-soft|off`. It follows the game: animations off, menu animations off, battle animations Off or the Reduced Motion profile force Calm; Reduced battle motion caps at Lighter; Reduced flashing keeps flashes Soft; Reduce particles and 0% shake turn those off (the LINKED pill says why). `fxOf(settings).cutIns` is the switch D30's cut-ins read.

## Limits (documented, not hidden)
- **Run length**: Six is shown locked ("Only Kanto plays until the Crossing opens"); a run is Kanto's until D16. `SIX_OPEN` in `rules.ts` opens it.
- **Betrayals** is saved on the block (`rules.betrayals`, factor 0 / 0.5 / 1 via `betrayalFactor`) for D15's Holder betrayal checks; no Holders exist before D14-D16, so nothing rolls yet.
- **Charters** stay locked until a finished Dominion run exists (D17).
- **Operations** (blade 5) shows the same "not open yet" line as tab 5.

## Tests
- `tests/unit/dominionBossMenu.test.ts`: rules default and stamped, save round trip, Day pace on Heat and Tension (rises only), Hero pressure on Threat (cap 100), Six locked, bad values rejected, old settings record loads with defaults, Effects presets and every game-setting link, the menu's nine blades and keys, the menu never changes the block, the Card with odds hidden. `tests/unit/milestone9.test.ts` default settings include `dominionPrefs`.
- `tests/e2e/dominionBossMenu.spec.ts`: Esc opens the menu, arrows, Q does nothing, S opens Settings · Dominion, row changes by key and tap, Six locked, the running block keeps its rules, Calm stops animation, Tab to Effects & motion, D resets, the game's categories, Rotom (never "Claude"), number keys, three window sizes, Go into hiding, reload keeps settings and block, no console errors.

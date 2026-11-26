# Dominion redesign R2: the HQ (floors, plots, rooms, the Staff Office and the HQ pages)

Kice, 2026-11-21: "BUILD EVERYTHING AS CLOSE TO THE MOCKUPS AS YOU CAN. Keep redoing and remaking things until they look exactly like the mockups." Target: pass 50 of `plans/evil-mode-rework/redesign-50/`, R2 row of `/mnt/project-files/plans/dominion-redesign-build/BUILD_SLICES.md`. The director's stand-in said yes to building the paused HQ floors work inside R2 (from `backups/hq-floors/wip.patch`); R2 now owns it.

## What the player can do now

- **Floors.** The HQ has one floor per HQ level: Ground Floor (Loading Dock, storage +5), The Cellar (Bolt Hole, Heat −1 a day), Upper Floor (Lookout Post, Defense +1), Arena Deck, Sky Offices, Throne Floor. Each comes with free plots (3, 3, 4, 5, 6, 7) and a fixture that works at once. **B** opens the floor page (mockups `floor`, `floorg`, `floorb`): the lift on the left (F or ▲▼ change floor), five tiles at a time (← → move, they wrap), the detail panel, Esc back to the HQ.
- **Buy a plot** (**P**, mockup `plot`): each floor sells a few extra plots, each 50% dearer than the last; refused with the reason when locked, sold out or short of money. A bought plot opens Build a room on it.
- **Build a room** (a free plot, mockup `build`): six cards a page, rooms you can put up now first, the rest with a few-word reason ("not enough money", "no free plot here", "needs HQ Lv 3"). The room goes up on that floor.
- **The Staff Office** (**K**, mockups `staff`, `auto`, `staffgear`): three posts (Auto-Checker hires by your rules each morning, Bookkeeper launders each night, Caretaker repairs). Post a member (← → on the first rule), buy gear (five levels), set the rules (Wanted stat, budget, beds kept free). Skill = gear + half the post's stat. The Auto-Checker rolls on its own stream (`dominion-checker`), so no old roll moves.
- **New floor** (mockup `newfloor`): shows once when an upgrade opens a floor (Enter: see the floor, Esc: later). Old saves never see it for floors they already had.
- **Laundromat** (**L**, mockup `launder`): wash ₽500 / ₽2,000 / all, borrow and repay, with what it costs in Heat and fees.
- **At a glance** (tap the money capsule, mockup `glance`), **The Mark** (**M**, mockup `mark`, read-only), **Lights out** (the night's Rest row, mockup `rest`), and the **arrival** page in a later region on Day 1 (mockup `goldenrod`).
- **The applications desk** (**I**, mockup `apps`): now the mockup's talk scene. The applicant on the left, who's on the desk on the right (the Auto-Checker, else the first of the crew), the calls (Hire, Check the papers, Send away, Detain) and the applicant's last words with their tell in the text box. "Check the papers" (or Tab) opens the D21 paperwork, where the questions, Inspect and the stamps stay as they were.

## Mockup vs game (960x540)

Mockup above, game below. The game shots draw a Compound set by hand like the mockups' (HQ Lv 3, three floors, the Staff Office staffed); numbers and rooms are the run's, not the mockup's.

GALLERY

Differences left on purpose (live data, not looks): room names and counts, the crew on each tile (the run's crew in roster order), the Laundromat's numbers, the glance "Needs you" list, the New floor's rooms.

## Needs a mechanic (not built, no placeholder)

- **The Mark: re-picking colours and emblem** after founding (no rebrand rule exists). The page shows the Mark read-only.
- **Arrival page (`goldenrod`)**: shutters to buy, squatters to clear and card keys for locked rooms (no rules); the page shows the base and the region's facts.
- **The Laundromat's Heat line** in the mockup (laundering has no Heat cost in the rules); the page shows the fee only.
- **"Let go"** (the `letGo` rule) sat in the old D5 money overlay; no pass-50 HQ page draws it, so no page reaches it now. It belongs on the Crew file (R5's pages) as a follow-up.
- **HQ lesson (`lessonhq`)**: drawn by the tutorial's lesson layer, which R1 owns; R2 adds nothing separate.
- **Number keys 1-3** for the desk's calls (the digits are the rail tabs); ↑↓ and Enter pick.

## Tests

- `tests/unit/dominionFloors.test.ts` (13): floors and plots per level, old rooms packed from the ground up, plot prices and refusals (locked, sold out, no money, bad floor), New floor once, building on a full floor refused; posts, gear (cost, cap, skill), rules wrap both ways, nothing at night without a geared post; the floor, plot, build, post, gear and Laundromat view models (and that they never change the block).
- `tests/unit/dominionHq.test.ts`, `dominionReserve.test.ts`: storage 25 (the Loading Dock's +5).
- `tests/e2e/dominionR2.spec.ts` (new): real play (B, a free plot, the Bunk Room, P refused, K posts Rook), then every page shot; Lights out; New floor; the desk's talk scene; reload keeps the real run; no console errors.
- `tests/e2e/dominionHq.spec.ts` (rewritten for the floor page) and `dominionDesk.spec.ts` (opens on the talk scene, then the papers).

No save version change: `Room.floor`, `hq.plots`, `hq.floorSeen` and `hq.staff` are optional, and old saves read as before (rooms packed from the ground up, floors counted as seen).

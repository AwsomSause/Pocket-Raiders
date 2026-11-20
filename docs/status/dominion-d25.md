- **DOMINION slice D25, "chatter, news, Hero and betrayal lines"** (Rotom slices, 2026-11-20; build plan `/mnt/project-files/plans/evil-mode-rework/BUILD_SLICES.md` row D25, design `/mnt/project-files/plans/claude-api/CLAUDE_API_DRAFT.md` §5.2, mockup a10 in `plans/claude-api/mockups/index.html` #k10). Players see **Rotom**, never "Claude" or "AI".

## What the player can do
- On the HQ, **V** (or the "V Crew talk" link under Rivals) opens the **Evening voices** scene (mockup a10): the crew talking under the warm bulb, the taped **Ledger** paper with a grainy photo of the Hero, the **Hero's call** on a shaking X-transceiver (red glow), and a **traitor's parting line**. V, Esc or Enter close it. It changes nothing in the run; other keys are eaten while it is open.
- The link says **NEW LEDGER** for the week after a paper comes out.

## How it works
- Data `src/data/dominion/voices.json` (checked by `VoicesFileSchema` in `voices.ts`; every personality trait must have its lines): chatter for 12 traits x 6 topics (quiet, win, loss, gone, hero, heat) plus replies, asides and memory lines; the Ledger's headlines; Hero taunts for the five Threat stages and Disillusion hints in three bands; traitors' lines (quit, stole, walked out with a Pokémon, joined a rival); the Rotom texts.
- Rules `src/core/dominion/voices.ts` (pure):
  - **Chatter**: up to three members who aren't out talk. Topic, most pressing first: a traitor left (3 days), a bad night, a good night, the Hero, Heat 60+, a memory from this run, quiet. The first speaks on it, the second answers them, the third has an aside; all in their card's quirk.
  - **Ledger news**: a World Turn end step (`newsEnd`; `runWorldTurn` now hands end steps tonight's lines by step) keeps the police, rival, Hero and Legendary lines and traitors leaving; every 7th morning it prints the paper (the busiest kind leads, one more story, the Hero's photo) and keeps the last 4. The report lines are the authored text; no new report line is added.
  - **The Hero's call**: once they've met the Boss or reached FOILS; a taunt by stage; on odd days after meeting, a hint of the hidden Disillusion in their words (never a number). None once the Hero joined.
  - Text picks use fresh Rngs keyed `dominion-chatter`, `dominion-news`, `dominion-voice`: no gameplay stream moves.
- **Rotom on top** (D18): opening the scene sends the calls not answered yet (`rotomAsks`: each member's line with their character sheet and memories, the Hero's call, the traitor, and the paper) through `askClaude` (role `line`; uses "Crew chatter" and "Ledger news", the latter off by default). Answers are stored in `run.ai` (`chatter:d<day>:<member>`, `hero:d<day>`, `traitor:<id>`, `news:w<week>`) and show as **✦ lines under the written ones**; a reload shows them again and never calls twice. Without a Key-Card nothing is sent and the chip says "Rotom stays quiet tonight".
- D19's card (C on the Crew File) now shows the member's newest stored Rotom chatter line as its ✦ line.
- Screen `src/ui/redux/screens/dominion/voicesViews.ts`, controller `src/scenes/dominion/voicesController.ts` (an overlay on the HQ, so the other controllers' screen lists are untouched).

## Saves
No block bump: `block.voices` (this week's lines, the last papers) is optional and filled by the first World Turn after loading. Tested: a block without it loads; a damaged paper is refused.

## Tests
- `tests/unit/dominionVoices.test.ts` (19): data coverage; no "Claude"/"AI" in player text; chatter (three speakers, one, none, topics, determinism, the block untouched); traitors (all four kinds, not dismissed, fades after 3 days); the Hero's call (none before FOILS, taunt, joined, Disillusion bands, no number on screen); the paper (kinds, day 7, clears the week, quiet week, keeps 4, traitor column, same seed same paper, a week played through the World Turn, save and reload); Rotom (stored ✦ lines, off/wait ignored, the calls and their sheets, none once stored, the card's ✦ line).
- All 11 Dominion unit files pass (289 tests). Browser `tests/e2e/dominionVoices.spec.ts` (2): the scene on V with three sizes, nothing changes by looking, V / Esc close; with a Key-Card (no-network fake) every ✦ line shows and is saved with the run.

## Limits
- The chip doesn't show the evening's cost: stored answers don't keep their price (D18's log). It shows how many ✦ lines Rotom added.
- Recruit interviews (§5.2's last row) belong to the applications desk (D21).
- Informants (D24) and region betrayals (Part 5 §4) add their own traitor kinds when those slices land; the line banks take new kinds in `traitor.lines`.
- The morning paper on the Morning screen is D30's; it can read `latestPaper`.

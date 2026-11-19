- **DOMINION slice D19, "personality cards"** (Rotom slices, 2026-11-19; build plan `/mnt/project-files/plans/evil-mode-rework/BUILD_SLICES.md` row D19, design `/mnt/project-files/plans/claude-api/CLAUDE_API_DRAFT.md` §5.3 A, mockup a3 in `plans/claude-api/mockups/index.html` #k3): every crew member, applicant and enemy grunt has a personality card. On the Crew File, **C** (Card) opens the member's card; **Q / E** flip members; **Esc** goes back to the file. (P was taken by D4's rank Pyramid.)

## What's built
- **Data** `src/data/dominion/personality.json` (Zod shape in `schema.ts`, D19 section): 12 traits (Loyal, Greedy, Joker, Hothead, Coward, Zealot, Proud, Cautious, Gossip, Lone Wolf, Kind, Schemer), each with two effects and offline lines for hello / done / fail / scared / pay; 6 pairs that never roll together; 24 speech quirks; 30 wants; 30 fears; ten home towns for each of the nine regions; canon sheets for 11 Bosses (Giovanni, Archer, Maxie, Archie, Cyrus, Ghetsis, Lysandre, Lusamine, Guzma, Rose, Penny); report lines; the Rotom texts.
- **Rules** `src/core/dominion/personality.ts`: `rollCard(seed, name)` on its own stream `dominion-card::<name>` (no old roll moves); `canonCard(id)` for Bosses; `sheet`, `voice` (the quirk), `cardLine` (offline line by last night's result), `cardFor`, `fillCards`, `cardPrompt` (the character sheet a Rotom call will start with, same text every time so it caches).
- **Traits are live rules** (crew.ts): their modifiers join `modsOf` (odds by stat or family, Heat per job, Loyalty floor/cap, quit chance), and `cardNight` adds squad Morale (Joker, Kind: +1 to everyone else a night, once) and pay-day effects (Greedy: pay Loyalty ×2; Proud: −15 more when unpaid; Zealot: 10 less). Bribe and spy effects (Loyal, Greedy, Gossip) say "(from D22)" and do nothing until D22.
- Every line a member says on the Crew File now carries their quirk (`memberLine`).
- Applicants (recruit leads) show their two traits on the Leads list; a lead who joins keeps the same card (it is rolled from their name).
- **Screen** `src/ui/redux/screens/dominion/persona.ts`, ported from mockup a3 (manila dossier, desk-lamp pool, photo with their first Pokémon bobbing, red-pen ring on the trait pills, CREW stamp, paper clip and tape, "What his traits do" slip, memory of this run, "How he talks" with the offline line and the ✦ Rotom line, others on file). Matches the **round-3 mockups** (`plans/evil-mode-rework/mockups-v3`, PR #1494): `dominion.css` is now the tool's port of v3 (all 27 screens' CSS, so other slices get the v3 classes too), and the card carries k3's overlays (haze, bokeh, motes, grade, lamp spotlight, edge glow, gold frame, sunburst, glints) and the warm key light. `tools/dominion/port-mockup-css.py` now keeps `@property` rules and points `url(sprites/...)` at `public/assets/images/dominion/`. `g-mic.png` and `p-rotom.png` added (PROVENANCE.md).

## Saves
No block bump: `member.crew.card` is optional. New members get theirs at once (`startInRun`, every `stepInRun`, the crew step); a D3 save's members get theirs on the next step, the same card the screen already showed (tested).

## Tests
- `tests/unit/dominionPersonality.test.ts` (18): the data; no "Claude"/"AI" in data or screen; rolling (same seed + name = same card, no clashes, region towns, seed matters); canon sheets; unknown ids fall back; applicants keep their card; quirks; lines; Hothead odds, Schemer cap, Loyal floor, squad Morale, pay day (Greedy, Proud, Zealot); determinism; save/reload, D3 save without cards, damaged card refused; the Crew File card model and view.
- `tests/unit/dominionCrew.test.ts` updated for the quirk in member lines and cards filled on the next step (30 pass). `dominionStart`, `dominionField` pass unchanged.
- Browser `tests/e2e/dominionPersonality.spec.ts`: hire a Grunt, P opens Rook's card, traits and home town match the save, E/Q flip, three window sizes, Esc back, reload keeps the cards.

## Limits
- The ✦ Rotom line shows "Rotom stays quiet" for now: D18 (key + client) isn't in `evil-mode` yet, and the slices that make Rotom talk (D20-D25) fill `PersonaModel.rotom` from lines saved with the run.
- Enemy grunts appear with D9 (rival teams) and use `rollCard(seed, name)`; Bosses' canon sheets are used once D9 brings the rival Bosses.
- The CREW stamp shows the region until the Founding (D7) names the team.

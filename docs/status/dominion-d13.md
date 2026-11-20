- **DOMINION slice D13, "the Debate" (offline)** (Evil Mode rework, 2026-11-19; build plan `/mnt/project-files/plans/evil-mode-rework/BUILD_SLICES.md`, design Part 4 §3, Part 9 A2-A4 and A6, Part 0 §6.1 Q2): instead of crushing Team Rocket, the Boss can talk it into joining. Three rounds at the Leader's Table, two turns each; each turn the player picks a stance and one of its three set lines. The game scores the line and moves the Conviction bar. The Rotom (typed argument) path is D20; no key is involved here.

## What's built
- **Data** `src/data/dominion/debate.json` (Zod in `schema.ts`, D13 section): 3 rounds, 4 stances (Partnership, Merger, Recruit them, Threaten), 12 set lines (3 per stance) with fixed marks on the five marks (Values, Record, Substance, Respect, Honesty), 5 claims the Ledger checks, 17 "sins" (the worst Ledger line), 4 results, 4 demands, 5 Branch Directives, and every rival Boss's creed, price, judging line, leanings, demands and replies (all 10 teams; only Kanto's Rocket is on).
- **Rules** `src/core/dominion/debate.ts`:
  - When (Part 4 §3.1): the Boss's **Debate** action (day, from the HQ) needs Tension 40+ and a win over one of their Admins or their Boss (wins now leave a `beat:<team>:admin|boss` flag). Invitations skip that: rival action 119 **Neutral ground summit** (Giovanni), rival action 118 **Break a coalition** (an Admin, two rounds: Values and The Future), and street meeting O162 "Ask for a Debate". One Debate a Boss a week; three failed (or one Offended) and they never talk again this region.
  - Start (A2): ±20 from Tension (65+ −10, under 35 +5), a win (+10 Boss / +5 Admin), +5 per Admin already gone, +2 per manifesto page (Write a Manifesto, an Evening action, max 5), +2 per Debate mastery level, and rooms (Luxury Suite, Ballroom +5).
  - A turn: marks from the line, the Boss's leaning on Values (Giovanni +1 Partnership and Merger), a claim the Ledger can't back scores 0 Record and 0 Honesty (+1 Record when it can) and the Boss calls it out; `move = (sum − 10) × 2`, Threaten −5 unless your Dread is twice their Fear, Merger −5 unless you're stronger, an insult (Respect 0) sours the next turn (−5); capped −15..+20. Each line once per Debate. Round II opens on your worst Ledger line, Round III on their price. Replies are picked on stream `dominion-debate` and stored in the save.
  - Results (A4): +60 Convinced (Merger or loyal Branch, the player picks; risk halved), +25 Persuaded (Branch with one demand: keep two towns or never touch their old HQ), −24..+24 Unmoved (Tension −10), −25 Offended (Tension +15, closed).
  - Merger: their sites are yours, their rival Control moves to you, Giovanni (Executive) and the standing Admins join while the HQ has room. Branch: tribute every Monday, the Branch Directive card on the Rival File (Expand, Defend, Recruit, Pressure the Hero, Hold a town; the Head's own pick if you don't answer). A broken demand: risk +25, a 50% chance the Branch walks (Tension back to 50). A Branch or merged team stops acting against you.
- **Screen** (mockup 8, round 4): `src/ui/redux/screens/dominion/debate.ts` (the Nova sigil sits left, through D26's `stage(..., 'l')`), model `src/core/dominion/debateScreens.ts`, controller `src/scenes/dominion/debateController.ts`. Keys: 1-4 or ◀▶ stance, ▲▼ line, Enter Argue, Esc walk out (asks first). Results overlay with Merger / Branch. A Debate on the table takes the screen after a reload. The Rival File shows the Branch and its order; the HQ threat row says "Team Rocket is your Branch".
- 3 new pictures in `public/assets/images/dominion/` (v-nate, v-giovanni, p-persian; PROVENANCE.md).

## Lists and statuses
- Rival actions: 136 live now (121 supported, 15 limited), 14 disabled (was 16; 118 and 119 are D13's).
- Boss actions played: 64 (Debate and Write a Manifesto added; the manifesto still needs a Print Shop).
- Buildings: 96 live (Debate Hall limited: first argument lands at least +5; Briefing Theater limited: shows each line's marks before you pick; Luxury Suite and Ballroom +5 Conviction).
- Demands: "pursue their Goal" (D14) and "never use Shadow Pokémon" (D16) are limited: kept until those slices can check them. Directive "Pressure the Hero" is counted for D11.

## Saves
- No block bump: `debate` is a new optional field on the v2 block; a save without it reads as no Debates yet.

## Tests
- `tests/unit/dominionDebate.test.ts`: 20 tests (data, who can talk, start, line scoring, the Debate Hall, a whole Debate, Merger, Branch with tribute and Directive, broken demand, Unmoved/Offended, invitations, a refused card, the screen model, old saves, save and reload mid-Debate, broken blocks).
- `tests/e2e/dominionDebate.spec.ts`: summit card on the Rival File, the table at 1280x720, 960x540 and 800x600, keys and clicks, the walk-out guard, reload mid-Debate, the result.
- Changed counts in `dominionField` (64 played), `dominionHq` (96 live), `dominionRivals` (121/15/14).

## Known limits
- The Boss's side always shows the mockup's Nate art, whatever the Boss looks like.
- Joiners from a Merger get a stock look and one Pokémon from their canon team; "fight beside you" for Branches waits for D14 takeovers; betrayal itself is D15 (`deal.risk` is kept for it).
- No Q command wheel on this screen (the wheel isn't built yet); End-to-quit is D26's re-key.
- D12's court card that waits on D13 is in PR #1502 (not merged); that thread flips it.

## Follow-up: Chair cards
The Chair's card 81 (the Rival Boss's assistant: "the Debate opens early") is live: answer A puts a Debate card for the rival Boss in the Rival File at once, plus Tension −5. D9's two waiting cards came with it (56 insurance, 74 double agent). See `docs/status/dominion-d12.md`, Card status.

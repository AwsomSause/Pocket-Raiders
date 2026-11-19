- **DOMINION slice D11, "the Hero"** (Evil Mode rework, 2026-11-19; build plan `/mnt/project-files/plans/evil-mode-rework/BUILD_SLICES.md`, design Part 4 §7-8 and Part 9 A8-A9, mockups s9 and v4 m11, outside list section G O166-O185): the region's Hero now watches the Boss. Their Threat climbs with what the Boss does, and each stage brings them closer: they foil jobs, hunt the crew, break Rackets, gather allies and raid the HQ. The region's Legendaries wake when the Boss gets loud.

## What's built
- **Data** `src/data/dominion/hero.json` (shape `HeroFileSchema` in `schema.ts`): 9 regions (Kanto in full: path, Gym Leader allies with aces, mentor, family, sidekick, Moltres / Zapdos / Articuno), 23 Heroes with looks and lines, 8 archetypes, Threat weights and stages, 8 reasons, type counters, Disillusion numbers, foil / attack / raid / ally / final stand / Legendary numbers, the 20 encounter cards (O166-O185), and the lines.
- **Who** (Q1, Q5): a region's canon protagonist. If the Boss's trainer is that Hero, the rival plays them (Red -> Blue, Hilda -> Cheren).
- **Rules** `src/core/dominion/hero.ts`, as two World Turn steps (`hero`, `legends`) and hooks in `field.ts` (no import cycles):
  - Threat = Wanted, Dread, stolen Pokémon, HQ level and harm. Stages: 0 IGNORES, 25 FOILS, 45 ATTACKS, 65 RAIDS, 80 ALLIES (each announced once).
  - FOILS: once a week the Hero steps into a job **before** any battle (m11): Battle (win to finish the job), Run (job lost, Heat +2) or Smoke Ball (45% clean escape with the take).
  - ATTACKS: hunts a member on a task (hurt 2 days); frees Pokémon from the stores weekly. RAIDS: breaks the biggest Racket weekly. ALLIES: one ally a week (Leaders, Champion, then a Legendary) and a weekly raid on the HQ.
  - Badges along the story path (the Hero moves town to town); ambushes and items delay them.
  - A9: the first job seen in their town gives the Hero a **reason**; after two battles they **adapt** to the type they saw most.
  - A8: **Disillusion** is hidden (never on screen). Bribes, good deeds, fair fights and proving their reason wrong raise it; hurting their reason and ruling by fear lower it.
  - **Encounter cards**: about a 30% chance a day from Day 5, one at a time, gone after two days; night cards wait for the night; Challenge choices are no-stakes battles.
  - **Legendaries**: wake when Wanted or a town's Dread reaches 70; strike every 7 days (wreck a Racket, scatter Control, or empty the stores); a Day action fights one from the Hero file (a wild battle that can't be caught); beating it drives it off for 28 days.
  - **The final stand**: `callFinalStand` (D14 calls it when a takeover path finishes). Win, then choose Leave (Dread up, Regard down) or Recruit (chance = Disillusion, max 80%; a recruited Hero joins as an Executive with their own six). Lose: the three strongest towns drop to 45 Control, and a rematch comes in 7 days.
- **Boss actions**: 5 more played (47 of 150): Shame the Hero, Duel the Hero (needs ATTACKS, or a Hunt at level 5), Recruit a Hero's Friend, Ambush the Hero's Route, Steal the Hero's Item. All need the Hero's town, and Shame / Ambush / Steal / Friend need a meeting first.
- **Crew tasks**: Track the Hero, Counter the Hero's Story and Hunt the Hero are live. Patrol can meet the Hero. Tame an Alpha and Weatherwise now wait for D15.
- **Screens** `src/ui/redux/screens/dominion/heroViews.ts`, models in `src/core/dominion/heroScreens.ts`:
  - **s9, the Hero's file**: the Hero card and three Legendary cards with dials, the file (level, badges, allies, Threat, archetype, reason, counters, last news), alerts, and the encounter card with choices.
  - **m11, the Hero interrupt**: the cracked split screen with three choices.
  - Keys and clicks:
    - **H** opens or closes the file from the HQ, map or Ledger. On the Crew File, H still hires. There's also a "THE HERO" chip on the HQ.
    - On the file: **1-3** answer a card, **F** fights a Legendary, **L/R** choose after the stand. On m11: **1-3**, the arrows and Enter.
    - Esc never leaves the run from m11.
  - The Ledger's Hero row and the HQ door ("Face the Hero") use the real Threat. The map says where the Hero is once you know.

## Saves
No version bump: `block.hero` is optional, and the first step after loading adds it (tested with a save that has no `hero`). New streams: `dominion-hero::<day>` (and `::meet` / `::row`), `dominion-legends::<day>`, `dominion-hero-pick`, `dominion-hero-smoke::<rolls>`, `dominion-hero-join::<day>`. No existing roll moved.

## Tests
- `tests/unit/dominionHero.test.ts` (23): data; Q5; a D6 save loads; save/reload; stage edges (24/25, 44/45, 64/65, 79/80); Threat and the stage line; the path; the interrupt (Run, Smoke Ball refused and used, Battle win); no interrupt below FOILS; adapting; encounter cards (Watch, Challenge, night card, bad choice); Disillusion never shown; Legendaries (wake, warn, fight, can't catch, driven off, refused when not out); the final stand (lose, win, Leave, Recruit at 0 and capped at 80, joins as an Executive); the five actions' gates; the three tasks; determinism.
- Two D2/D6 tests were updated: 47 played actions.
- Browser `tests/e2e/dominionHero.spec.ts`: the file on H, a card answered with 2, the interrupt on a job (Esc stays, Run), and a Legendary fought from the file.

## Limits (by plan)
- The final stand is only called by D14 (takeover paths). The rules and screens are ready.
- HQ raids and Hero raids break Rackets and take stores; building wrecks and machines wait for D5.
- Encounter choices tagged with Tension with the rival team only say so; D9 brings Tension.
- Recruiting uses the A8 Disillusion chance; the Debate (Rotom) comes with the Rotom slices.
- Only Kanto has full region data. The other eight regions list their Heroes and Legendaries but stay off until their region opens.

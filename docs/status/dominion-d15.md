- **DOMINION slice D15, "many regions"** (Evil Mode rework, 2026-11-21; build plan `/mnt/project-files/plans/evil-mode-rework/BUILD_SLICES.md`, design Part 5 §2-6, Part 9 A11-A13, Q3 and Q7; mockup v4 s10): once a region is Taken, the Boss leaves for the next one and the old region keeps running under a Holder.

## What's built
- **Data**
  - `src/data/dominion/regions.json` (shape `RegionsFileSchema`): the nine regions in order, the run lengths (three or six), which are open (first release: Kanto, Johto, Hoenn; the other six stay off), crests and colours, the nine boons, arrival rules (₽1,000, ace Lv 15, Notoriety capped at Street Gang), Holders, Stability bands, betrayal odds and the three kinds, tribute steps, the Empire answers, standing orders (4 groups × 5 options), lines.
  - `src/data/dominion/regions/<id>.json` for Johto to Paldea (shape `RegionPackSchema`), made by `tools/dominion/regions-to-json.py`: towns, routes, water, HQ, rival teams and sites, Gyms, businesses, the lab, Hero homes, pillars, the League, crew pools, the desk's papers, and every one of the 432 Holdings placed (johto 43, hoenn 60, sinnoh 57, unova 53, kalos 50, alola 57, galar 49, paldea 63).
  - `data.ts` lays the active region's pack over Kanto's files (`setActiveRegion`/`useRegion`), so D2-D14 code reads the right towns without changes.
- **Rules** `src/core/dominion/regions.ts` (no save bump: a new optional `realm` on the block; a Kanto block without it loads unchanged):
  - **Leaving (A13, Q3, Q7)**: pick a Holder (yourself, an Admin or higher, or the beaten rival Boss after a Wipe Out), set standing orders, bring one member (they keep everything). Only the ace comes, pre-evolved one step at Lv 15 with its moves and IVs; money stays behind (₽1,000). The new region rolls on its own seed (`…::realm::<id>`), so Kanto's rolls never move.
  - **Held regions (Part 5 §3)**: each week Stability moves by orders, Holder, grievances and visits; tribute (a share of the region's income by the tribute rate and orders) lands in the Ledger's new "Tribute from held regions" line; unrest takes towns, a Revolt stops tribute, Monarch regions risk Uprisings, new Heroes rise.
  - **Betrayals (A11)**: odds from risk and low Stability, scaled by D27's Betrayals rule (off / rare / normal), capped at 40%; rolled on their own stream. Three kinds: secession, selling out to a rival, a coup; tells as the odds climb.
  - **Empire answers**: Visit (the Boss is away for the rest of the Day and the next; the crew runs them), Pay, Replace (Evening), Spy, Talk, Orders, Tribute rate, the Long Trip (a fight to take a lost region back), Let go.
  - **Boons**: one per held region (Silph tech: a Garage and 10 Ultra Balls; Radio Tower: a free Spread the Word; Weather Institute: fair skies; science labs, Lumiose, Aether price cuts; and the rest), each live from the week after leaving.
- **Screens**: the Empire page (G from the HQ, map or Ledger; mockup s10): three region cards (held / here / ahead) with crests, Holder, Stability bar, betrayal odds, towns and tribute, the answer buttons, the standing-orders sheet; L in the key strip opens the Leaving page (holder, orders, who comes; "Sail for X"), also the Takeover page's CTA once Taken. G and L no longer open the game's interaction log on these pages.

## Hand-offs from other slices
- Done here: the Chair's owed **Stability** (D12) moves every held region's Stability; before anything is held it waits and lands on the first held region. Court cards 80 (Hoenn: Magma or Aqua stands down), 126 (two of the lowest ranks go to the held region), 127 (tribute −20%), 128 (a smuggling line: tribute +10%), 129 (Uprising odds −50% / +25%) and 132 now play (Chair: 129 of 150 live). Their lasting answers travel with the Boss to each new region. D27's Betrayals rule scales the checks.
- Still waiting for a later follow-up (named so nothing is lost): 41 Boss actions, 27 crew tasks and 25 outside interactions that mention other regions; buildings Revival Chamber, Tribute Bureau, Hall of Law, Regional Seat, Legend Shrine, Pokémon Radio Tower; the crew trait Weatherwise; the rival action Cut the Road; two field notes. They still show their D15 note.

## Limited (honest list)
- The region map art stays Kanto's drawing for now; the towns, routes and names are the new region's.
- Region packs are starting numbers, none playtested. Holdings outside Kanto are "limited" (their bonus kinds play; place-specific extras are notes).
- The six later regions (Sinnoh to Paldea) are built as data but switched off for the first release.

## Tests
- `tests/unit/dominionRegions.test.ts` (20): packs validate, no Claude/AI text, overlay follows the region, holders, leaving (ace, money, brought member, Holder), refusals, weeks with betrayals off, odds cap and rules, deterministic betrayal, every Empire answer, the Long Trip, boons, the Chair hand-offs, saves (no realm, round trip, damaged).
- `tests/e2e/dominionRegions.spec.ts`: G opens the Empire page, L the Leaving page, sailing opens Johto's first morning (₽1,000, ace Lv 15, Rosa holding Kanto), the orders sheet, two window sizes, no console errors.

# Kanto story events and the quiet-node scheduler (E3)

## Player gets
- Eight Kanto story events (`xe.kanto.*`): Small Print (a bike shop and a Rocket Collector), The Appointment (Matori's envelope), The Roadblock (a Snorlax and a food truck), Harbor Export (crates, Major Surge and Ein), The Riddle Without a Joke (Blaine), The Phone in the Basement (Madame Boss), Growlie (the trio frees a Growlithe) and Orphan (a Cubone outside the Tower). Each has two to four choices; none is required to finish the region.
- A scheduler that decides how many of them a region shows: Low 3, Normal 5, Full 8 (the existing `eventsDensity` setting). Small Print is the anchor: it always occurs. No two story events sit in neighbouring columns, and none is ever placed twice in a run.
- The Roadblock appears only once the Kanto Ledger reaches step 3, and stopping the food truck turns the Ledger back one step.

## Save
- None bumped. New optional run fields `run.expansion.density` and `run.expansion.xe`; `eventsSeen` now records placed story events. Runs without the density flag never see these events and their stage placement is unchanged (tested).

## Limits
- Intel, Operational Strength and the Siege Map do not exist yet, so an event writes a story flag (`rocket-receipt-book`, `rocket-bought`, `rocket-seal-diagram`...) for the slices that will read them. Heat is the Evil Team's heat; money is scaled to this game's prices (₽4,000 and ₽5,000, not 50,000).
- Triggers that name raids ("after Raid 2", "before Raid 3") use stage minimums for now; Vermilion, Lavender and Cinnabar are not separate stages yet, so those events can appear in any Kanto stage.
- The scheduler places story events only. Rescue offers, rival scenes, the Friend and roaming beats keep their own hooks and are not yet ordered by it.
- Roadblock, Harbor Export and the Orphan's walker use the existing battle and companion effects (no new Snorlax roadblock map node, no Convoy format yet).

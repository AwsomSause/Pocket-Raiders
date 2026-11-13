# Pokémon moments pack 2: merge and dedupe plan

Source: Kice's second events pack, `POKEMON_MOMENTS.md` (126 entries: 18 type, 31 archetype, 18 group, 45 species, 14 individual). Compared with the 129 moments in our catalog (`pokemon-moments-catalog.md`) and what is built (batches 1 to 3).

Standing rules applied: no cross-run memory, no Keepsakes, Souvenirs, Shards or new currencies, no romance. Anything too big for 0.6 goes to 0.7.

## 1. Already covered (keep ours, fold in the pack's wording)
These match a moment we already have or have designed. Nothing new is built; the pack's flavour lines can be reused later.
- Type: PT1 (normal-courage, normal-resolve), PT3 (water-rebound), PT4 (grass-sprout), PT5 (elec-overload), PT6 (ice-shell), PT7 (fighting-fuel), PT8 (poison-defiant), PT9 (ground-dig-in), PT11 (psychic-foresight), PT12 (bug-swarm), PT13 (rock-hold), PT15 (dragon-pride), PT17 (steel-resolve), PT18 (fairy-wish).
- Archetype: PA1 (failure-not-tolerated, built), PA4 (baby-cry, baby-bravery), PA5 (fossil-roar, fossil-awaken), PA6 (pseudo-pride, pseudo-presence), PA8 (hunter-pack), PA10 (starter-*), PA11 (ultra-*), PA12 (paradox-*), PA13 (legend-duty), PA14 (mythical-*), PA16 (pikachu-*).
- Group: PG1 (eevee-bond), PG3 (legendary-birds), PG5 (lake-guardians), PG6 (swords-justice), PG7 (regis), PG10 (tapu-guardians).
- Species: PS3 (ditto-copy), PS4 (cubone-mourn), PS5 (lucario-aura), PS8 (snorlax-nap, snorlax-rest), PS17 (gastly-grin).

**One conflict to decide (coordinator or Kice):** PA1 in the pack is 10% (plus Bond steps, cap 30%). Kice's original text and our build are 50%. We kept 50%. The pack also makes all revivals (PA1, PA17 to PA31, PS6, PS9, PS13, PA13, PA16, PI1, PI12) share one "revival use" per run. Ours are separate once-per-run claims. A shared claim is a small change (one flag) and is planned for batch 4.

## 2. Good for 0.6 (small, uses hooks we already have or one new trigger)
New trigger "Faint" (this Pokémon is knocked out) is the main hook needed.
- Faint: PT2 (Embers Left, with a small Kindled status) and PS2 Shedinja (Ninjask +2 Speed).
- Battle start or face-off boosts: PT16, PA8-style pack bonus, PG4, PG7, PG11, PG13, PG14, PG16, PS11, PS12 (Illusion), PS19, PS24, PS25, PS29, PS30, PS40.
- Low HP or hit: PT10, PS14, PS38 (Wishiwashi school form), PS32.
- Status "Resolute" (small: cannot fall below 1 HP for a turn): PT7, PG6.
These are about 30 entries. They get a batch of their own (batch 5) after the Ditto, Smeargle, Mew, Darkrai and Sneasel mechanics.

## 3. Move to 0.7 (too big for 0.6)
- The revival family PA17 to PA31 (15 entries), each with its own new status and full-screen scene (Revenant, Wrathborn, Overgrown, Alpha's Howl, Collected, Critical Mass, Transcendent, Oathbound, Swarm, Crushing Depth, Spiteful, Primal, Supernova, Absolute Zero, Eclipsed). Eight of them need new turn or targeting logic. They also need custom art and audio from Kice.
- Haunting and Guarded statuses and their moments: PT14, PA2, PA3, PS18, PG9.
- Mechanics that need new engine work: PA7 Playing Dead (faint revive in battle), PA15 Sleeping Giants (switch in to take a hit), PS6, PS9, PS13 (Run End revives with special rules).
- Map or story hooks that belong to the events and quest layers: PS7 Absol warning, PS10, PS22, PS27, PS31, PS34, PS35, PS36, PS37, PS39, PS41, PS42, PS43, PS44, PS45, PG2, PG8, PG12, PG15, PG17, PG18, PS1, PS20, PS21, PS28 (evolution and node effects).

## 4. Dropped by the standing rules
- Cross-run memory: PI14 The Machine Returns (needs an earlier run), and the PA28 and PA1 lines that look back at earlier runs.
- Keepsakes or new item types: PS3's sticker, PS26 Berry Juice, PI2's cosmetic badge.
- Individual (PI) moments that depend on a long per-run history (PI3, PI5, PI6, PI7, PI8, PI9, PI10, PI11, PI13) wait for 0.7, where the run history work lives; PI1, PI4 and PI12 (revive priority and nickname bonus) come with the shared-claim change in batch 4.

## Counts (from the pack)
126 entries. By flag: 25 revives, 32 need a new status, 33 need a full-screen scene or custom audio, 14 need a new battle mechanic, 3 use cross-run memory, 3 use new item types.

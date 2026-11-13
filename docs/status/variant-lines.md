# Variant lines as battle hooks (Beta 0.6 slice E1)

State: `battle.extra.variants` (uid -> line + counters, saved with the battle; old battles load with `{}`). Rules: `src/core/expansion/variantLines.ts`. Engine hooks (`engine.ts`): entry (`enterExtras`), damage taken, forced switch (`forceOut`), status (`tryInflictStatus`, `canGetStatus`), accuracy, end of turn (`endTurnMon`), item moves. Whoever spawns a special Pokémon calls `assignVariant(battle.extra.variants, uid, line)`; nothing spawns them yet (the Kanto event/track/climax slices do).

| Line | Region | Status |
|---|---|---|
| Tagged | Kanto | wired, tested |
| Spiritless | Sinnoh | wired, tested (the purify/Mesprit removal comes with Shadow II) |
| Overclocked | Unova | wired, tested (overheat is -1 Speed, see decisions) |
| Tagged-Up | Alola | wired, tested |
| Dark Ball | Johto | wired, tested |
| Tidebound, Cinderborn | Hoenn | wired, tested |
| Preserved | Alola | wired, tested |
| Patchwork | Rocket Remnants | wired, tested (gadget fixed per Pokémon by its uid, shown on entry; net/smoke last 2 turns; spring only moves trainer Pokémon) |
| Snagged | Team Snag'em | wired, tested (refusal rolls come from a throwaway generator seeded by uid + turn + battle RNG position, so no stream moves) |
| Loud | Team Yell | wired, tested (+20% sound moves; Speed cheer only if the builder passes `crowd`; first-turn shame only if it passes `marnie`; cheer capped at +1) |
| Couture | any | wired, tested (accessory is a second held item from `COUTURE_ACCESSORIES`; Knock Off/Thief take it first, once) |
| Overcharged | Macro Cosmos | wired, tested (fires by itself on its 2nd turn out; Dynamax for one turn, then loses a turn) |
| Tuned | any | wired, tested (fires by itself on its 2nd turn out; Tera for 2 turns, then -1 Speed once) |

**Balance sim** (`node tools/variant-sim.ts`, 5,000 mirror battles each, identical Blastoise, the line on either side, weather a third rain / a third sun / a third none; gate 60%): baseline 50.0%; Tagged 53.3%; Dark Ball 45.4%; Tidebound 51.4%; Cinderborn 51.2%; Preserved 57.1%; Spiritless 47.7%; Overclocked 44.5%; Tagged-Up 57.9%; Patchwork 48.5%; Snagged 14.0% (a drawback line: the plain side's ceiling is 90%, the line side's stays 60%); Loud 59.3% with the crowd cheering. (Spiritless is simmed half the time with a stat move in place of Earthquake: attacks alone made it 63%, setup alone 31%.)

**Director decisions (via coordinator, 2026-11-13):** Cinderborn gives +1 Special Defense in sun (the script says +1 Defense; that measured 61.3%). Preserved's first-hit cut is 20% (the script says 25%; the plan's 20% cap wins). Overclocked's overheat is -1 Speed (the script says -1 to every stat, which measured 12% in the mirror sim; Speed alone measures 44.5%) — decided by the thread under the coordinator's "tune if over" rule, flag for the director.

Kanto's nine signature traits (Seat at the Table, Drill Through, ...) are not built yet.

**Part 4 decisions (thread, for the director to confirm):** Loud's Speed cheer is capped at +1 in total (+3 and uncapped both measured 61.5%; the script says +1 each cheer). Snagged is the script's own 20% +10% per turn and measures 14% for the carrier, so the sim treats it as a drawback line (plain side may reach 90%); if the director wants it nearer 40% the chance should drop. Nothing in a run sets `crowd` or `marnie` yet: the event that builds a Yell battle must pass them to `assignVariant`.

**Part 5 (all 14 wired):** Sim (5,000 mirror battles): Couture 49.5% (with Focus Sash; the plain side also holds Leftovers because an accessory is a second item), Overcharged 40.8%, Tuned 46.5%. Couture accessories are limited to `COUTURE_ACCESSORIES` (Focus Sash, Expert Belt, Wide Lens, Muscle Band, Scope Lens, Black Belt, Silk Scarf, Choice Band): every one measured 42-58% in the sim, while Choice Specs (60.7%), Rocky Helmet (83%) and Life Orb (6%) did not fit the 60% gate. Overcharged/Tuned have no player choice yet: they fire on their second turn out, with no Band or Orb, and do not use up the side's own Dynamax/Tera. Tuned's type is the Pokémon's own Tera type (the script says its squad's type; no squad type is carried yet) and its stall is a single -1 Speed stage. Which accessory a Couture Pokémon wears is chosen by whatever builds the battle.

**Part 6 (reachable in a run):** `src/core/expansion/variantAssign.ts` gives an Evil Team fight's special Pokémon their team's line, called from `startEventBattle` right after the battle is built (so rescue and format fights get it too). Slots: Grunt 0, Specialist 1, Executive and Leader 2, always the last Pokémon in the lineup (the ace). Team → line: Rocket (Tagged in Kanto, Dark Ball in Johto), Aqua Tidebound, Magma Cinderborn, Galactic Spiritless, Plasma Overclocked, Flare Couture (accessory by uid hash), Skull Tagged-Up, Aether Preserved, Yell Loud (crowd always on, as the Grunts watch from the stands), Star Tuned, Rocket Remnants Patchwork, Snag'em Snagged. **Gaps:** Overcharged has no route (no Macro Cosmos Evil Team in the game); Marnie's League Card does not exist as an item, so Loud's first-turn shame is wired to the inventory key `marnies-league-card` and is off in every run until an item or story event grants it; the Kanto *special Pokémon* (the 110-row dossier) still do not spawn by name, so lines go on the team's own Pokémon until the traits slice places them.

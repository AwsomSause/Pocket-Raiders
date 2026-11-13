# Pokémon moments, batch 4: the five mechanics, a shared revival use, fuller effects

**What the player gets.** The five moments that were waiting on new mechanics now work: Ditto copies the foe's types, Smeargle sketches one of the foe's moves, Mew picks up a random TM move, Darkrai's nightmares drain a sleeping foe, and Sneasel ambushes (it goes first on turn 1). Mewtwo is no longer flinched, Dark types get an extra crit stage for the battle, and starters gain a little friendship.

**Rules.**
- Ditto: the foe's types are copied for the battle (both types), using the existing type-list state.
- Smeargle and Mew: the move goes in the last move slot and the old move is backed up with the same record Mimic uses, so it comes back at the end of the fight (an added slot is removed again). Mew's pick is seeded and only from moves it can learn by TM with real power.
- Darkrai: the foe loses 12% max HP at the end of each turn while it sleeps, never below 1 HP.
- Sneasel: +1 priority on turn 1 only.
- Mewtwo: a battle tag stops flinching for it.
- All run-end revivals now share one use per run (`pm:runend-used`), as the pack 2 design asks. The 50% chance of Failure Will (NOT) Be Tolerated is unchanged (Kice's text wins over the pack).
- No save version bump. State used: battle story effects, the run's story flags, the battle's Mimic record.

**Still limited.**
- Lucario Aura: Accuracy +1 only (seeing the foe's moves needs a UI hook).
- Growlithe Loyal: the lead only, not the whole team (the engine tracks stat stages for one Pokémon).
- Fire Last Stand, Steel Adamant: boosts only, no status or stat-drop immunity yet.
- Magikarp Splash: the first foe loses 10% (single battles have one foe at a time).

**Tests.** `tests/unit/pokemonMoments.test.ts` (31 pass): each of the five mechanics, the backed-up move, the nightmare floor, Sneasel going first against a much faster foe, the flinch tag, and the shared revival claim.

# Battle system, moves/abilities and opponent AI (systems)

Approved ideas: 38. Rejected (do not build): S23, S24, S25, S27, S28, S29, S30, S31, S33, S34, S35, S36, S37, S38, S39, S40, S41, S42, S163, S165, S166, S172, S173, S268, S276, S279.

Source of answers: `docs/ideas/review-2026-11-02.md`. Status and order: `docs/ideas/roadmap.md`.

## Already in the game / notes (keyword scan, verify before building)
Advanced AI (aai), trainer item use (`battle/autoBattle.ts`), auto-battle, weather/terrain exist. Gaps: Combo Moves, Focus stat, Elemental Reactions, Move Fusion. Comment S271: ALL trainers use items.

## Kice comments
- S271: "All trainers should use items"

## Approved ideas
- S26 Combo Moves: two allies using paired moves in one turn make a fusion attack.
- S32 Spectator Crowd: an audience reacts to style, giving small buffs for variety.
- S43 Pace Controls: auto-battle with a rule list (use super-effective, heal under 30%).
- S44 Environmental Interactables: burn the grass, flood the floor, shock the water.
- S154 Move Mastery: using a move enough unlocks a mastered form.
- S155 Move Fusion: combine two known moves into a new hybrid at a tutor.
- S156 Type Charts per Region: regional rule tweaks on effectiveness.
- S157 Fourth Stat Layer: add Focus stat controlling crit and accuracy.
- S158 Ability Awakening: abilities level up with use.
- S159 Signature Passives: each trainer class has one passive team trait.
- S160 Crit Scaling Tiers: stacked crit modifiers with diminishing returns.
- S161 Status Stacking Rules: statuses stack intensity instead of being binary.
- S162 Elemental Reactions: Water + Electric, Fire + Grass produce field reactions.
- S164 Charge-Up Moves: skip turns to bank power for one big move.
- S167 Combo Ability Pairs: two allies' abilities trigger a joint effect.
- S168 Weather Resistance Scale: mons gain tolerance to a weather they endure.
- S169 Type Immunity Breakers: rare moves that ignore a single immunity.
- S170 Counter Types: custom move categories like Trap, Aura, Song.
- S171 Evolution by Condition Variety: evolve by weather, bond, move use or quest.
- S174 Z-Crystal Bonding: Z-moves need paired trainer training.
- S175 Tera Shard Crafting: build a Tera Type from collected shards.
- S262 Trainer Archetypes AI: bait, rush, stall, setup behaviours.
- S263 Adaptive Opponents: AI weights counters to your last team.
- S264 Boss Phase Scripts: dialogue and move sets change per phase.
- S265 Wild Behaviour Types: flee, ambush, guard, group.
- S266 Rival Learning: rival remembers which moves hurt it.
- S267 Predictable Telegraphs: some bosses show the next move icon.
- S269 Trainer Taunts: AI uses speech to reveal intent.
- S270 Weather-Aware AI: opponents plan around the field.
- S271 Item-Using AI: trainers heal at sensible thresholds.
- S272 Team Composition Rules: AI builds balanced teams with roles.
- S273 Gauntlet AI Fatigue: AI plays worse after long gauntlets.
- S274 Mirror Match Mode: fight a copy of your team with AI.
- S275 Elite Duelist Mode: pure skill, no randomness enabled.
- S277 Dynamic Team Scaling: enemy levels scale with your party average.
- S278 Adaptive Shop AI: shops adjust offers to your build.
- S280 Trap Setting AI: opponents prepare hazards before fights.
- S281 Sabotage Events: rivals tamper with your items between nodes.

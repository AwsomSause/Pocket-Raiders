# Run events B: trainer battles and challenges

Category: `docs/ideas/categories/r-b-trainer-battles-and-challenges.md` (R51-R103, all approved).

## Batch 1 (13 events, `tools/events/trainerB.ts` -> `src/data/eventsRB.json`, `npm run data:rb-events`)
R51 Hot Dog Duelists, R52 Umbrella Squad (forced rain), R53 Night Shift Guards (night only), R54 Retired Gym Leader Spar, R63 Double Date Doubles (loaner ally), R65 Rookie Hazing, R66 Speed-Dating Trainers, R70 Relay Battle (10% heal between fights), R71 Boss Rush Mini, R72 Collector's Test, R98 The Gambler's Gauntlet, R100 School Yard Skirmish, R102 Rival's Friend.

New trainer-battle fields (event data): `weather`, `terrain` (forced for the whole fight), `chainHeal` (share of max HP restored between chained fights). No save change. No new assets.

## Still to build (need engine rules)
R55-R62, R64, R67-R69, R73-R97, R99, R101, R103+ (reversed order, handicap, hidden team, no-switching, no-attack wins, shared HP bar, turn limits, mini-games...).
Limited in batch 1: R54 gives party levels instead of a literal "XP share"; R65 has no extra twist; R100 is two waves of kids.

## Batch 2 (9 events, `tools/events/trainerB2.ts` -> `src/data/events/trainer-b2.json`, `npm run data:rb2-events`)
R55 Trainer on a Bike (win the race, strike first), R68 Held-Item Gauntlet, R80 Ranked Ladder (3 rungs by flag), R86 Slippery Slope Duel (hail + Trick Room), R87 Duel on the Train (evasion up), R101 Midnight Cafe Duel (pick a tea), R103 Lifeguard Test. Uses `tempEffect` (run events J).
Limited: R86's shuffling speed order is Trick Room for 5 turns; R87's motion blur helps only your side.
Still needs new modifier kinds: reversed party order, handicap start, no switching, turn limit, hidden foe team, no attack moves.

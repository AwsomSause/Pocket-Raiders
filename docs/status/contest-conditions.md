# Contest conditions, Poffins and curry (S487, S488, S489, S503)

Run save v37 (`minigames.contest`: Cool, Beauty, Cute, Smart, Tough per Pokémon uid; migration 36 to 37 + test in `tests/unit/contest.test.ts`).
- Berry Blending is the Poffin kitchen: the flavour that dominates the finished pot raises the matching condition of your lead (Spicy Cool, Dry Beauty, Sweet Cute, Bitter Smart, Sour Tough; +1/+2/+3 by medal, cap 30). This is the feeding step (S488, S489).
- New game `pokemon-contest` (S487): judges name a condition each round; your lead's conditions add to every appeal; the judged one scores a bonus; repeating an appeal halves it.
- Camp Cooking (S503) now pays a party heal (25% silver, 40% gold) as the curry buff.

Limits: conditions are tracked per run (no Pokéblock items, no profile storage); the lead is the first Pokémon able to fight; no separate Pokéblock bag item. Sandwich picnic buffs (S500) are not separate from Camp Cooking.

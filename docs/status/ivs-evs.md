# IVs and EVs (W5, Kice 2026-11-07: "IV's + EVs need to be implemented properly")

Design (revisits D2, which said no IVs/EVs):
- **IVs:** every Pokémon has 0–31 in each stat, rolled once when it is made from a generator of its own (`iv:<key>`, like natures), so no gameplay random stream moves. Enemies get them too, so both sides gain the same on average.
- **EVs:** earned by every Pokémon that shares the experience for a knockout or catch (participants and Exp. Share). At most 252 in a stat and 510 in all (`balance.evs`). The species data has no official EV yields, so each species gives its best base stat: 1 point below 330 base stat total, 2 below 480, 3 from there up, times `balance.evs.gainMultiplier` (2, because runs are much shorter than the main games). Enemies have no EVs.
- **Stat formula:** main-series `floor((2 × base + IV + floor(EV/4)) × level / 100)`, then +level+10 (HP, plus the existing `hpPerLevel`) or +5 and nature (others), then vitamins, Wings and care as before.
- **Bottle Cap** (rare): hyper trains the Pokémon's lowest IV (counts as 31). **Gold Bottle Cap** (epic): all six. Real IVs are kept for Hidden Power, as in the main games.
- **Respec:** Pomeg, Kelpsy, Qualot, Hondew, Grepa and Tamato Berries now also lower HP/Atk/Def/SpA/SpD/Spe EVs by 10 (friendship and attribute effects unchanged).
- **Hidden Power:** type now comes from the real IVs (main-series formula), not a hash of the uid. Existing Pokémon may show a different Hidden Power type after the update.
- **Summary screen:** the Stats tab shows each stat's IV (★ = hyper trained, gold = 31) and EVs, plus the EV total; the Pokémon info lines list IVs with a judge rating and the Hidden Power type.
- **Vitamins** stay the game's +10%-per-stack boost (decision card to Kice; they are balanced into rewards, the dojo and elite perks).

Done: `src/core/ivs.ts`, `calcStats`, `createPokemon`, EV gain in `run.ts awardExperience`, catalog `hyperTrain` effect and berry `evs`, engine Hidden Power, UI. **Save: run v40 → v41** (every Pokémon in the run gets its IVs written down, the same roll the game falls back to, and empty EVs). Profile Pokémon need no bump: a missing `ivs` falls back to the uid roll. Tests: `tests/unit/ivs.test.ts`.

Limits: EV yields are derived, not the official table. No Power items, Macho Brace EV doubling, Pokérus, IV breeding or Destiny Knot. Bottle Cap picks the lowest IV for you (no stat picker). Bosses and trainers have no EVs.

Balance re-sim (`npm run report:balance`, boss fights with a no-item, no-EV player): average player win rate 11.7% on main, 11.5% with IVs (per region within ±2 points), so IVs alone do not move the curve. EVs then make the player's team stronger over a run; one autoplay seed in `rivalSimReport.test.ts` now survives far longer, so that test plays 3000 steps instead of 20000.

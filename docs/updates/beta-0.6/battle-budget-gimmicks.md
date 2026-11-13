# Battle item budget and gimmick rules (B5, B8)

## Player gets
- Each battle allows 10 healing items (any kind) plus 6 revives. The 11th heal is refused with a message.
- Bosses, rivals, Elite Four members and Champions get the same budget from their own bag: they heal up to 10 times and revive fallen teammates (strongest first, to half HP) up to 6 times. They revive only when down to their last two Pokémon and only on their own turn.
- One of each gimmick (Mega, Tera, Z-Move, Dynamax) per side per battle. This already worked per gimmick in the code; a test now pins it, including that a second Mega is refused.

## Save
No version bump. Two new battle counters (`healsUsed`, `enemyRevivesUsed`) default to 0, so older saves load. Cap lives in `balance.json` `itemCaps.healsPerBattle: 10`.

## Limits
- Rally (B4) is not changed here: the existing boss sweep guard from #1135 stays as is. The +2 stacking and level ceiling are not built yet.
- Ordinary trainers keep their old item rules.
- No sim run yet for how tanky bosses are with 10 heals.

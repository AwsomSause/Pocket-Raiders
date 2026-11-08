Boss gimmicks: every Gym Leader, Elite Four member and Champion has a designated Mega, Tera, Z-Move and Dynamax order, each tied to one Pokémon (`src/data/bossGimmicks.json`, built by `npm run data:boss-gimmicks`).

- Count (`core/battle/bossGimmicks.ts`, `gimmickSlots`): none through Stage 5 of Region 1, one after it, one more after Stage 5 of each later region, max four. Elite Four and Champion count as past Stage 5 (Region 1 = 1 ... Region 4 = 4). `balance.transformations.bossGimmickAfterStage` replaces `bossGymFrom`.
- A boss's kinds go to its designated species if on the team, else the best other member (ace first); one gimmick per Pokémon. The plan is stored in `battle.transform.bossPlan` (optional in saves, defaults `{}`, so no save bump) and fires when that Pokémon is out (Mega at once; Tera/Z/Dynamax use the existing AI timing).
- Replaces the old "ace only: Mega then Tera/Z/Dynamax" rule (`bossMechanics` removed). Expeditions still use the old ace-Mega path.
- Visual: `/mnt/project-files/reports/boss-gimmick-dex/` (build: `node tools/build-boss-gimmick-dex.ts out.json` then `python3 -I tools/boss-gimmick-dex.py out.json out.html`). Mega drawn Mega, Z-Move glows in its type, Tera unchanged, Dynamax gigantic.
- Limit: a late team with no Mega-capable (or Z-capable) member skips that kind, so about 640 Elite/Champion teams show 3 gimmicks at 4 allowed.

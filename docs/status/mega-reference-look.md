# Mega Evolution reference look

Mega Evolution now plays the full scene from Kice's reference clip, ported from the Bogard "Deluxe Battle Kit" Mega Evolution animation (`src/ui/battleFx/megaScene.ts`, called from `BattleScene` for a Mega transform): fade to the battle's own backdrop, the Pokémon turns round to face you, the trainer slides in and raises the Mega Ring, the Mega Stone floats over the Pokémon, the stage darkens while the Pokémon goes black then white and particles stream in, a white ball grows round it (sized from the Pokémon's visible shape so it always covers all of it) and the cracked red crystal fades in over it and shakes, the crystal bursts in a white-out, the Mega form is revealed as a silhouette over blue light rays that colours in with a white outline, the Mega symbol fades in, the Pokémon shakes and the scene fades out. About 9 s (one original frame = 45 ms). The SKIP button (art from the kit) slides up and ends the scene early.

Setting **Fast Mega** (settings v38, off by default, migration + test in `tests/unit/fastMega.test.ts`) plays the earlier short cinematic (`cinematics.ts`, `megaReference`). Reduced motion and Off keep the short or no scene as before. Primal Reversion keeps its old scene. Presentation only.

**Action button:** in player-controlled battles Mega Evolution is now chosen from the move menu's ACTION tab / fourth option ("Mega: OFF/ON", `megaOption` + a `mega` transform request); it is still once per battle and still needs the Mega Ring and stone. Auto-battle and simulations still Mega Evolve by themselves (`TransformContext.manualMega` is only set for real run battles).

New art (Deluxe Battle Kit, from the director's Drive pack): `dbk/mega/orb_2.png` (cracked crystal), `dbk/mega/icon.png` (Mega symbol), `dbk/skip_button.png`.

Limits: the trainer is a still picture; foe Megas show the Pokémon without a trainer unless it is a trainer battle; bases are look-alike ellipses.

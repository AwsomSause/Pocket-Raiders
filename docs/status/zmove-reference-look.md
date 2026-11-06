# Z-Move reference look

Z-Move now plays the full scene from Kice's reference clips, built from the Bogard "Z-Move Animation" script (`src/ui/battleFx/zMoveScene.ts`, called from `BattleScene` for a Z-Move transform): fade to a stage, the Pokémon faces you, the trainer slides in and raises the Z-Ring, the Z-Crystal rises, particles stream in, the stage turns the move's colour while the Pokémon goes white and shakes, white-out, outlined Pokémon, title zooms in, shakes and pulses, fade out. About 5.5 s (one original frame = 40 ms).

Setting **Fast Z-Move** (settings v34, off by default, migration + test in `tests/unit/fastZMove.test.ts`) plays the earlier short cinematic (`cinematics.ts`). Reduced motion and Off keep the short or no scene as before. Presentation only.

Limits: the stage is a striped look-alike, not the pack's arena art; the trainer is a still picture; foe Z-Moves show the Pokémon without a trainer.

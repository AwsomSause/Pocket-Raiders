# Z-Move reference look

Z-Move now plays the full scene from Kice's reference clips, built from the Bogard "Z-Move Animation" script (`src/ui/battleFx/zMoveScene.ts`, called from `BattleScene` for a Z-Move transform): fade to a stage, the Pokémon faces you, the trainer slides in and raises the Z-Ring, the Z-Crystal rises, particles stream in, the stage turns the move's colour while the Pokémon goes white and shakes, white-out, outlined Pokémon, title zooms in, shakes and pulses, fade out. About 5.5 s (one original frame = 40 ms).

Setting **Fast Z-Move** (settings v35, off by default, migration + test in `tests/unit/fastZMove.test.ts`) plays the earlier short cinematic (`cinematics.ts`). Reduced motion and Off keep the short or no scene as before. Presentation only.

Limits: the stage is the battle's own arena backdrop (as in the reference script) and its own platforms; the trainer plays its normal intro animation when it has one, else a still; foe Z-Moves show the Pokémon without a trainer.

Sizes (follow-up): the Pokémon's visible feet sit on the middle of its platform, drawn to canon height (`src/core/heights.ts`) and nearer the camera; the trainer stands further back (higher, smaller, own platform) at canon trainer height. Tiny Pokémon are not enlarged, so a Pikachu is small next to a trainer.

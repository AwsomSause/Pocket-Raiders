# Z-Move reference look

The Z-Move cinematic (`src/ui/battleFx/cinematics.ts`, `zPower()`) now follows Kice's reference GIFs: field dims, the Pokémon turns into a white shape with the Z-Crystal over it, blue speed lines and a white-out, then a dark move screen with the rainbow Z-ring and the Z-Move's name. Uses the game's own art only. Presentation only; no battle state or RNG touched.

Limits: the ACTION tab above the move menu comes from the Tera PR (#762); the Z toggle there is not changed here. Reduced motion still uses the short glow.

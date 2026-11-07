# Battle opening (Gen 5 style)

Plain trainer and wild battles now open like the director's reference video (0:27-0:46): black, a low sweep over the arena that pulls back, the foe trainer as a black shape that lights up, party-ball rows sliding in, "X would like to battle!" typing in the bar, the trainer's ball arcing up and bursting in light, the Pokémon dropping onto its platform, the camera looking across to your side while "Go!" types and your trainer throws.
Code: `src/ui/battleFx/opening.ts`, wired in `BattleScene.introShow`. Presentation only; motion off skips it, reduced motion shortens it. Boss and rival fights keep their VS screens, then use the same reveal.
Known limits: no perspective warp (zoom and pan only); the opening lines now advance by themselves (a key press still skips).

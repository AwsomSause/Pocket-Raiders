# Mega Evolution reference look

Mega Evolution (not Primal) now follows Kice's reference clip: scene goes dark, Pokémon turns into a black silhouette while the key stone, Mega Stone and a pink spark float in, it turns white, a white ball grows round it and cracks into a crystal that deepens white -> red, white-flash burst, then the Mega form is revealed (silhouette colours in) over blue light rays with the Mega symbol. Total 4.3 s, swap at 2.9 s. Presentation only; outcome never depends on it. Reduced motion and "off" paths unchanged. Primal Reversion keeps the old crystal scene.

Not done: the reference's "Action" button to choose Mega on the move menu (Mega still happens by itself, per the PokeRogue-style rule in milestone8_5).
Files: `src/ui/battleFx/cinematics.ts` (`megaReference`), `cineLook.ts`, `transformAnims.ts`, `BattleScene.ts` (swapForm returns the new sprite).

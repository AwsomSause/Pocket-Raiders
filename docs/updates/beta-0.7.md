# Beta 0.7: Node Event Menus + INSTRUMENTALITY 3.0 and 3.0+1.0 (update log)

This ships to `main` as ONE PR from branch `beta-0.7`. Each piece has its own fragment in `docs/updates/beta-0.7/` (Player gets, Save, Limits); this page is the summary. Scope and the decisions made for Kice: `docs/updates/beta-0.7/README.md`.

## Save versions
- No version bump. Everything new lives in optional fields inside `settings.expansion` and `run.expansion` (node menus, special entries, blessing, rewind, tremors, story traits and so on), so old saves load unchanged.
- Settings cleanup: the 11 placeholder settings that nothing read were removed (Zod drops unknown keys; tested). Systems that now need one (Blessings, Ultra Beasts, Mythicals, Second Chance) added theirs back with a real meaning.
- No cross-run progression (Kice). Profile 21 stays unused.

## What players get

**Node Event Menus (headline)**
- Settings > Node menus: each map stop opens a menu of 2 to 5 cards (its side stops plus small repeatable entries like Forage, Catnap, Odd job). One optional pick per stop, two before a gym, at a plaza or on a 5-card menu; required story cards must be done first. Off in Boss Rush, Speed Clear and Time Attack. (node-event-menus-core)
- Special cards: Fork, Linked follow-ups, Escort and Rival Takes It. (1265)

**INSTRUMENTALITY 3.0** (each behind its own setting)
- Legendary Blessings with the Side Plinth screen, Communion and a Rite (1271, Dialga follow-up).
- Rewinds: take a singles battle back 1 to 5 turns, once a stage; exact state, fresh dice. Off by default (1279).
- Second Chance, rarer heated-moment moves and the 23 Mythical Promises (second-chance-heated-promises).
- Ultra Beast Incursions: hidden Appetites, Static, Tear and Incursion, Beast Balls from Looker and Anabel (1280).

**INSTRUMENTALITY 3.0+1.0: the other regions**
- Evil Team sagas in Johto, Unova, Sinnoh, Hoenn, Kalos, Galar, Alola and Paldea: 8 story events each, world-state tracks that change shops, wilds and roads, Dossier entries (e9-johto-unova-saga, sinnoh-hoenn-saga, kalos-galar-saga, e9-alola-paldea).
- Extended Cut climaxes and wide formats for Alola, Paldea, Kalos, Galar and Johto/Unova; Paldea's Debate; Galar Dynamax tremors; Guzma's forced switch; story traits (e9b, e9c, e9d, e9e, kalos-galar-followup, Johto/Unova Extended Cut).
- Story bosses can field a 7th Pokémon (7-foe-boss-battles).
- Companions, the Citadark finale against XD001, and the Region of Doom as an in-run epilogue (companions-finale-doom).

**0.6 follow-ups**
- Settings rows for the Extended Cut (off by default), story event density and Kanto story spaces; raid doors for Raids 1, 3, 4 and 5; the Sleeping Snorlax shout (mic or button) (1270).
- Squirtle Squad and Champion Primeape use Kice's Anime Forms art (1264, 1269).
- The test bot can play the whole 9-region campaign, so late-game balance can be measured (x1-bot-late-game).

## Known limits
See each fragment's Limits. The biggest: Blessings ship 8 of the 71 planned; raid doors are short fight chains, not the full raid format; the Extended Cut is not balanced yet (off by default); several region signature traits are still unbuilt.

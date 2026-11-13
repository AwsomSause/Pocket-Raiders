# Kanto canon: Viridian, Indigo Plateau, road events, cast cameos (workstream 18)

**Player gets:** In a Kanto run with Kanto Canon on:
- **Viridian, before Stage 1:** the Old Man's Lesson (a Weedle, 5 Poké Balls and a Catching Charm; 20% he has not had his coffee and you fight the Weedle first), Route 22 (the first rival fight; a guard turns you back), and two rolled extras: Oak's Parcel (deliver it for a Devon Scope; 25% a Rattata or Meowth steals it), the Trainer School quiz (three questions, each right answer trains your lead's weakest stat), or Diglett's Cave (3 nodes, Sandshrew den 20%, Dugtrio duel, 5% a special Dugtrio).
- **Viridian, Stage 8:** the final Route 22 rematch (rival at +4, four Pokémon).
- **Indigo Plateau:** Victory Road is a stop on the first League fight: 7 nodes (fights, boulder checks, the rival's last stand, then Moltres 35% or Arcanine). Winning opens Cerulean Cave: Mewtwo (uncatchable the first time, then a second chance to bond with it or leave it).
- **Road events (up to 2 per Kanto stage):** Snorlax, Charizard Valley, Pidgeotto's Farewell, Bulbasaur's Gathering, Haunter's party, the Pikachu who hates evolving, Lapras's Song, the Tournament Poster, Pidgey Rush, the Cut Tree, the Tough Junior, Fishing Contest, the Stone Seller, Cycling Road, the Biker Gang and the Route 23 Badge Check (six Badges = a shortcut). Release a Pidgeotto and a Pidgeot can fight beside you at Victory Road.
- **Roaming cast:** the balloon motto (Stage 1, 10%) and the Safari net mock fight (Stage 5, 25%).

**Save:** no version bump. Everything uses `run.expansion.canon` (menus for `interlude-0` and `finale`) and story flags. Road events are rolled from a derived seed (`canon-routes`), so no existing roll changes.

**Limits:**
- The Rival Token is only a rival mark (`route22-token`); the pack defines no item. Heat has no system in the game, so the Biker Gang's Heat-1 is left out.
- The Catching Charm lasts for the next wild battle; the Pokédex Upgrade is a Devon Scope (the map shows wild Pokémon) because Ability reveal is not built. The School quiz trains the lead, not a chosen Pokémon.
- Cerulean Cave's "second visit" is the same cave later in the same run; a visit in a later run would need a profile save bump. The "Kanto Secret title" is a Chronicle line, there is no title system.
- Not built here, because other towns own them: Jessie, James and Meowth at the S.S. Anne, Flight North and the Perfume Heist; Butch and Cassidy at the Tower; the Snag Test; Sabrina's lament and Erika's perfume. The Tournament Poster writes `ev:kanto-tournament-poster` for the Saffron thread.

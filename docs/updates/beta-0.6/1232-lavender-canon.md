# Kanto Canon Spaces: Lavender Town (workstream 18)

**Player gets:** In a Kanto run (Kanto setting on), the start of **Stage 4** now opens the Lavender interlude on the map. **Pokémon Tower** is always there: seven floors. Without a Silph Scope the ghosts show as "???" and you can only fight Channelers; with it you fight wild ghosts. A 25% Haunter prank on the stairs (laugh along for a Spell Tag, or chase it). On the top floors a ghost Marowak you cannot catch; beat it and it is at peace. A **Memorial Wall** gives up to three gifts (Spell Tag, Ghost Gem or a Ghost Egg) for Pokémon lost for good. At the top you free Mr. Fuji: Silph Scope, the **Pokémon Tower Scroll** (Ghost-types +10% Attack and Sp. Atk), and a **Cubone with Lightning Rod and Bone Rush** if the Marowak was freed.
Rolled (at most two Pseudo Stages): **Mr. Fuji's House** (adopt Pichu, Cleffa or Togepi, +3 levels, Poké Flute, +1 friendship), **Pokémon Fan Club** (patience prompt for a Bike Voucher, or interrupt for a Poké Doll), **Rock Tunnel Blackout** (5 nodes, accuracy -10%; a Flashlight or Flash lets you choose the encounter; ends with an Onix with Sturdy, a Rock Slide and a Flashlight), **Abandoned Power Plant** (6 nodes, Voltorb "items", then 40% Zapdos or an Electrode horde, then a Magnet and a Thunder Stone) and the **Lavender Volunteers** (up to three purchases of Spell Tag / Ghost Gem / Escape Rope, and a Revive for ₽500 once).

**Save:** no version bump. New data: item `flashlight`, event condition `memorial`. The Lavender menu is kept at `run.expansion.canon.menus["interlude-3"]`. The interlude hook is generic: `interlude-N` (N above 0) rolls at the start of stage N+1.

**Limits:**
- The Rocket-raid version of Pokémon Tower (`pr.kanto.pokemon-tower`) is not built; only the ordinary tower.
- The Memorial Wall only has names in Nuzlocke-style runs (the only runs where Pokémon are lost for good); otherwise it is empty. The gifts are a Spell Tag, Ghost Gem or Ghost Egg (no Soul Dew shard item exists).
- Rock Tunnel's "hidden" encounters: without light you take a random one; the Flashlight also shows wild Pokémon on the map (Devon Scope effect). Accuracy -10% applies to every fight in the tunnel.
- Zapdos is a normal wild fight (the game's usual catch odds), not a special low-odds catch.
- The Volunteers' Revive is a Revive item you use later, not an instant revive; the stall is a short chain of counters (three purchases), not a Mart.
- Fuji's "stat bonus" is +3 levels on the adopted baby.

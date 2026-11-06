# Plan: using the Google Drive packs

Drive folder: `1jStJbc-dcs70vn1GLySO-HBrn7nf0_oq` (15 packs). Surveyed 2026-11-06. Nothing gets built until Kice says go, except trainers: Kice asked for every trainer, 2026-11-06.

## What's in the Drive (short)

| Pack | What's useful |
|---|---|
| Animated Pokemon Sprites | Animated strip sprites for about 1,028 species and 510 forms (front, back, some shiny), plus icons and footprints |
| Animated Trainer Intros | 283 animated trainer strips, 32 player back sprites, 88 VS screens |
| Graphics (fan game) | 586 trainer sprites, 1,076 item icons (48px), Pokémon sprites |
| Pokemon-Decades-main | Full fan game: 808 trainer sprites, 438 ready-made trainer teams, 276 battle backgrounds, 527 music tracks, 629 overworld sprites, rule ideas |
| pokerogue-assets-beta | Newer PokeRogue art: 534 item icons (32px, same style as ours), trainers, variant sprites, arenas, music |
| Essentials + EBDX | Item, Pokémon and move lists (Gen 9 pack), battle backgrounds, UI |
| Roguelike Collection | Reward-screen rules: rarity tiers, Lucky Charm, type-based reward pools |
| Terastallization, Z-Power, Deluxe Battle Kit | Icons and effects (we already have most), low-HP battle music |
| Lmigi's Nature & Stat Balls | 31 new Poké Balls (25 nature balls, 6 EV balls) with icons and throw sprites |
| Gen 9 Learnsets Compendium | Full move pools for every family, Gen 1 to 9 |
| Pokedex Data Page | Design idea for a Pokédex data screen |
| Assets | Fan sprites (Alolan Dratini, Paldean Golett, Maliceye, extra Megas). Nobody has recorded where they came from |
| Data, Plugins | Map files and Ruby plugins. We only read the plugins for ideas |

## 1. Trainers (Kice: add every one) — STARTING NOW

The game has 28 trainer classes, 229 bosses, and 57 animated bosses. The Drive has about 1,700 trainer sprites in 4 folders, and many of them repeat across folders.

1. **List.** Merge the 4 trainer folders into one list without repeats. Each sprite is either a class (Hiker, Lass, Pokéstar…) or a named person (Cynthia, Archer…).
2. **Animate the ones we have.** Any boss or class that's a still picture now gets the Drive's animated strip. The existing importer `tools/memories/import-trainer-anims.ts` does this.
3. **New classes.** Each one goes in `trainers.json` with its types, names, intro/win/lose lines and sprite, and joins the normal trainer pools.
4. **New named trainers.** Each one goes in `bosses.json`. Their teams come from Decades' 438 ready-made teams where a match exists. Otherwise the team comes from their known type.
5. **Extras.** Player back sprites go in the throwing pose, and the 88 VS screens become boss intros.
6. **Size.** Sprites load only when needed. One PR per batch of about 150 trainers, each with provenance rows and tests.

## 2. New items and Pokémon

- **About 80 to 100 real items the game lacks.** Some examples:
  - Heavy-Duty Boots, Weakness Policy, Blunder Policy, Throat Spray, Eject Pack
  - Booster Energy, Mirror Herb, Covert Cloak, Loaded Dice, Punching Glove, Clear Amulet, Ability Shield
  - Exp. Candies, Mochi, Feathers, Sweets, 16 Hyper berries, Max Honey
  - Adamant Crystal, Lustrous Globe and Griseous Core, Rusted Sword/Shield
  - Each one gets a real effect, or it doesn't ship.
- **31 Nature and EV balls.** A nature ball sets the caught Pokémon's nature. An EV ball maxes one stat.
- **PokeRogue's newer items.** That pack has 262 icons with no item in the game, such as ribbons, Mini Black Hole and Golden Mystic Ticket. I'll pick the ones that make sense as run items.
- **Item icon upgrades.** All 719 items show small 24px icons:
  - 167 can switch to PokeRogue's 32px icons, which are the same style as ours.
  - 3 borrowed icons get their real art.
  - The Lantern gets an icon.
  - 53 items still need new art, because the Drive doesn't have it.
- **New Pokémon.** The Assets folder has fan sprites like Alolan Dratini, Paldean Golett, Maliceye and extra Megas. **Question for Kice:** did you make these, or where are they from? We need a source before adding them.

## 3. Animated Pokémon sprites

- 129 front sprites in the game are still pictures, mostly Megas, Gigantamax and other forms. The Drive has animated strips for about 99 of them. The other 30 are Galar forms, Pumpkaboo sizes and similar, and need a check by hand.
- 330 custom sprites are still too: Delta forms, Z forms and fan Megas. The Drive has no animated versions of these.
- Steps: convert each Drive strip to the game's atlas format (same tool as trainers), swap it in for front, back and shiny, then screenshot-test a few.

## 4. Mechanics and features (check what we have first)

- **Reward screen.** Roguelike Collection uses rarity tiers (50/30/15/5), a Lucky Charm that shifts the odds, and rewards that match your party's types. Use what our reward screen lacks.
- **Decades rule ideas, as optional run rules.** Kice picks which:
  - Normal-type moves use the user's own type
  - Frostbite in place of Freeze, Drowsy in place of Sleep
  - Pick 1 of 6 abilities
- **Battle music.** DBK's low-HP music plays when your Pokémon is in danger.
- **Learnsets.** Use the Gen 9 compendium to fill move pools that are missing or thin.
- **Pokédex data page.** Use it as a design idea for our Pokédex.

## 5. Everything else

- 276 battle backgrounds from Decades, plus PokeRogue's newer arenas
- 527 music tracks from Decades, plus PokeRogue's music and its loop points
- 629 overworld sprites, for Hub Town NPCs
- 1,039 footprints, for the Pokédex

## Rules kept

- Capture Styles stay off.
- The Overhaul (Beta 4.4 2) is not touched.
- `manifest.json` is never committed.
- Any save change gets a migration test (run save is v38).
- Every imported file gets a provenance row.
- **Licence note:** the PokeRogue assets README says the art is CC-BY-NC-SA-4.0 (non-commercial), not AGPL. That's fine for a free game, but the credits must say it.

## Order once Kice says go

1. Trainers (already approved)
2. Animated Pokémon sprites
3. New items, balls and icons
4. Mechanics
5. Everything else

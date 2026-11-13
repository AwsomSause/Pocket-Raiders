# Field Notes screen

## Player gets
- Press **F** on the map (or click "F: field notes") to open Field Notes, the Bestiary Book Kice picked (book layout with Type Tabs): **Special Pokémon**, **Shadow Pokémon**, **Data ROMs** and **Keys**. ←/→ change tab, ↑/↓ pick an entry, F, Esc or Enter close it.
- Special Pokémon: unmet ones show as "???" (only for the region you are in); once met they show name, species, signature trait, where, and whether you can get it.
- Shadow Pokémon: three hint pips. Hint 1 shows the key type, hint 2 adds a clue, hint 3 shows the whole key. The Keys tab collects the keys you have been told about and the heart scar each one earns.
- Data ROMs: nine slots, held ROMs shown in full, the rest "???". The footer shows the Stock step.
- The Roadblock (Kanto) is the first event that writes a Field Notes entry: any choice that meets it notes it.
- New event effect `fieldNote` (`{ kind: 'fieldNote', special: 'sv.…' }`) so other story events can note the special Pokémon they field.

## Save
- None. New optional `run.expansion.fieldNotes` (special Pokémon met; hints given per Shadow). Old runs simply have none. It is per run: nothing carries to the next run.

## How it fills in play
- Battle start: a foe carrying its Evil Team's variant line (Black-Label) whose species is on the region's special list is noted; a Named Shadow on the foe's side is noted at its hints; a Colossus Apex (M2) is noted.
- Events: The Roadblock and the Jessie and James event (Meowth) note their special Pokémon. Other events can use the `fieldNote` effect.
- Shadows: noted when granted, and again when a battle earns the next hint. LEDGER is noted when the Convoy's last leg is won or joined. Data ROMs are read from the Grand Arc state, so every ROM you earn shows. Keys are read from the Shadow hints you have been given.
- Pokémon icons are the game's real icons (they load on first use; a missing one falls back to a letter badge).

## Limits
- Special Pokémon that no event or variant fight reaches yet (for example Jackpot at the Game Corner) stay "???" until their scenes are built. Only 7 Shadows have purification keys in the data, so the others show their ability and "key not written down yet".
- Unmet entries of other regions stay hidden until met, so the page does not spoil later regions.

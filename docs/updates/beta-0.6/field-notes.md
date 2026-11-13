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

## Limits
- Only the Roadblock writes a special-Pokémon note today; the other 109 fill as their events are built (each uses the `fieldNote` effect). Named Shadows are noted when granted or when a battle earns the next hint; only 7 Shadows have purification keys in the data so far, so the others show their ability and "key not written down yet".
- Entries use letter badges as in the picked mock-up; Pokémon sprites are not drawn yet.
- Unmet entries of other regions stay hidden until met, so the page does not spoil later regions.

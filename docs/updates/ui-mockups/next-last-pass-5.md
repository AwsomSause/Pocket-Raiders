# New UI: last pass against the mock-ups, part 5 (Galar broadcast, the stage map's menus and cards)

**Player gets:** (New look)
- **Galar stadium:** the reporter, the interview and the round introductions are the mock-up's talk page over the field (a name plate, the line, Go on).
- **Map keys:** L opens only the Legend. The interaction log used to open on top of it; it is now on Shift+L while you are on the map.
- **Camp:** opens on the mock-up's five rows (Gadgets with how many you own, Kitchen, Workshop, Market, Campsite) with a card that says what each is for. A row opens that part of camp; Esc comes back to the five rows.
- **Album:** the scrapbook is the mock-up's wall of pictures. Each photo or big moment shows who it is about; the card says the stage and the caption. Enter on any page takes the team photo (once a stage).
- **Story Journal:** the Story list is the mock-up's board: each line has a tag (Title, Rival, Choice, Tale, Memory and so on) and a rival's quest shows as a bar.
- **PC:** the mock-up's wall of slots. Enter on a boxed Pokémon brings it into the party; Enter on an empty slot asks which party Pokémon to send. The bar counts the slots in use.
- **Rivals and People:** boards on the story's purple band. A rival shows its record and state; a person shows what they are to the story, a bar for their strongest feeling and their stage as the tag.
- **Notes:** the Field Notebook wears the run's teal band; each tab shows its count at the right and its newest note on the card.
- **Totem Pokémon:** a Totem battle opens on the mock-up's cutscene card with its aura as the line. Raid and Totem pages wear the battle's red band.
- **Champion Tournament bracket:** your own slot shows your lead Pokémon.
- **Microphone prompt:** a shout prompt dims the screen and shows twelve level bars that rise with the microphone; Enter shouts.

**Save:** none.

**Limits:**
- The game's camp has no "Rest" that heals the party, so the fifth Camp row is the Campsite (mentors, the Nursery, training and odd finds) where the mock-up shows Rest.
- The Album has no fixed number of pages; it shows 18 and grows by rows of six.
- The Rivals board has a bar only for a rival with a quest; the mock-up draws one on every row.
- The Old look keeps its Camp tabs, Scrapbook list, Story list, PC list, Rival Notebook and Relationships pages, and L still opens the log there.

**Tests:** unit tests for the page names and bands, a person's role, the bracket's player slot; browser tests in `tests/e2e/worldNewUi.spec.ts` (Galar interview; Camp, Album, Story Journal, Legend and the microphone prompt; PC, Rivals, People and Notes on a story run; the Totem card). The Tools browser test is split in two because one long test ran out of time on a slow test machine.

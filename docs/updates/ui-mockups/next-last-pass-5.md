# New UI: last pass against the mock-ups, part 5 (Galar broadcast, the stage map's menus and cards, stops, battle, Beta 0.6 pieces)

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
- **Pokémon Moments:** a moment about one of your own Pokémon (an Eevee moment, a starter moment) puts that Pokémon in the scene beside you, as the mock-up does.
- **Shop:** the clerk speaks in the text box ("Welcome! Take your time.", then what the item is for, who can use it and how many you have). The card has Buy 1 and Buy 5; Left and Right switch between them and Buy 5 buys five at once.
- **Fishing:** a bite opens the mock-up's small "! A bite !" window in the middle of the water, with each Pokémon's picture and level.
- **Minigames:** the windows across the top end with "Best", your best medal in this game so far.
- **Choosing a target (double and triple battles):** the list ends with Back, which returns to the moves.
- **Camp rests:** the scene shows one of your Pokémon by the fire (the second one still standing; the lead when you have one).
- **Stand With Them:** the job offer shows the team's leader and the chip "Reputation +30 if you join". Joining shows the mock-up's code-name card (your code name, team, reputation, uniform and standing) while the welcome line is read.
- **Rival battles:** a rival with a plan says it on the versus card ("Rival · plans to sweep", "set the weather" or "stall").
- **Minigame stops:** the difficulty list is the mock-up's tier list: each tier with the money it pays, and a card with the medals, whether an item can drop, and your best.
- **Research Tree (hub):** the mock-up's tree page: a row for each branch (Field Craft, Archive, Command), bought nodes plain, the cursor lit, the rest dimmed; the card says what the node does, its cost and what you have, over Unlock. The arrows walk the tree; Enter researches.
- **Strange Merchant (hub):** each ware shows its price (or Sold out) at the right of its row.
- **Apex raids (the Colossus):** the raid opens on the Apex card: the team's leader beside the Apex, its name and one line.

**Save:** none.

**Limits:**
- The game's camp has no "Rest" that heals the party, so the fifth Camp row is the Campsite (mentors, the Nursery, training and odd finds) where the mock-up shows Rest.
- The Album has no fixed number of pages; it shows 18 and grows by rows of six.
- The Rivals board has a bar only for a rival with a quest; the mock-up draws one on every row.
- The battle has no Run command (the game has no running away); the cut cards show your trainer's front picture (there are no back pictures); the shop shows no stock count; the reward draft keeps Party and Bag where the mock-up has Reroll and Skip; the fishing bar is decoration (the game's fishing is a pick of bites). These follow the game's rules.
- Story raids are told as event pages, so there is no separate "story raid card"; a Pokémon Moment in battle is told in the text box (the director's full-screen moment scene stays as it is); Ein and the other Grand Arc figures appear on the event page.
- The other hub rooms keep the mock-up template that fits their content: Attributes, Research Room, Prestige and Move Research are lists (the mock-up draws them with placeholder tree nodes); Bank stays a list of licenses.
- The Old look keeps its Camp tabs, Scrapbook list, Story list, PC list, Rival Notebook and Relationships pages, and L still opens the log there.

**Tests:** unit tests for the page names and bands, a person's role, the bracket's player slot; browser tests in `tests/e2e/worldNewUi.spec.ts` (Galar interview; Camp, Album, Story Journal, Legend and the microphone prompt; PC, Rivals, People and Notes on a story run; the Totem card), `tests/e2e/fieldNewUi.spec.ts` (Buy 5 and fishing; a Pokémon Moment and the minigame Best window; the triple battle's target Back; Stand With Them's code-name card, a camp rest and the minigame tier list; the Research Tree and the merchant's prices). Many New UI browser tests now also save a screenshot for the mock-up check. Unit tests for the tree page, the code-name card, the camp rest Pokémon, the tier pay, the rival's plan words, the Apex line, the moment's star, the shop's words, the fishing window and the Best window. The Tools browser test is split in two because one long test ran out of time on a slow test machine.

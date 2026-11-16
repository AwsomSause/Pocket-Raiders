# New UI: last pass against the mock-ups, part 3 (typed text, Preparation Desk, Honest Trade Card)

**Player gets:** (New look)
- **Typed text:** every place that asked in the browser's own box now asks on the mock-up's code entry page (letter keys, Paste / Confirm / Clear, Esc leaves): the poster code and the note to your next run in the Corner Nook, the seed code on the Seed board, the Tools pages (trade and vote codes, photo captions, bug report note, co-op and hot-seat names, replay notes), naming a place on the map (N), and a Pokémon's nickname or signature move name. The Old look keeps the browser's box.
- **Preparation Desk:** the mock-up's menu of seven rows with what each is set to: Campaign, Mode, Preparation, Modifiers, Seed & Codes, Loadout presets, Depart. Enter opens the row's page and coming back lands on the same row; left and right still change Campaign, Mode and Preparation in place. The card beside the list says what the row changes; on Depart it shows the whole run overview. The cursor starts on Depart, so Enter alone still starts. The page tabs are gone (Q and E still jump to the pages). Loadout presets is one row: its list starts with "Save this setup in a slot…".
- **Honest Trade Card (the catalog's trades):** a trade that uses the card opens the mock-up's Trade page. Your Pokémon is at the left and the trader's at the right, each with level, nature, ability, its moves, quirk, history and one fair value; between them a line says how the values compare, with Trade and Back under it; left and right step through your Pokémon that fit. The trader's reason is in the text box. If yours is worth more, the first Enter does not trade: the trader says "Mine's worth less than yours. You sure?" and a second Enter trades (in the Old look too, in the pick list's heading). Before choosing, the tag "T Trade card" on the event (or the T key) opens the card to read, for the first of your Pokémon that fits.

**Save:** none.

**Limits:**
- The Old look shows the trade's pick list and the trader's warning, not the full card.
- A gift (nothing asked) shows its card with T only; it has no pick step.
- The mock-up's "Draft rule" row has no rule behind it in the game (starters come from the Remembrance picks), so the desk shows Mode there.

**Checked against the mock-ups and left as they are:** the Memories pages (Run Journal, Hall of Memories, Memory Lane, Fallen Trainers, Battle Replays, Heirlooms), Trainer Select, Run Setup, Modifiers, Seed & Codes, Starter Select, Campaign Briefing.

**Tests:** the New UI browser spec is split into six files with names spread over the alphabet (`newUi`, `battleNewUi`, `menusNewUi`, `runNewUi`, `storyNewUi`, `worldNewUi`; no test changed) and CI runs 8 browser shards (was 6): after batch 2 two shards ran out of their 30 minutes while every test was passing, and four New UI files side by side in one shard timed out.

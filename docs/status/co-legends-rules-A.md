# Catalog Overhaul, batch 5 row A: Legendary keys, Communion upgrades, reactions (26 legends ids)

Built 2026-11-16 on `claude/project-thread-fn5dda` (PR into `ui-mockups`; the catalog lead combines batch 5).
Content: `tools/events/co/legends-13.ts` -> `src/data/events/co-legends-13.json` (26 events). Engine: `src/core/legends/keys.ts`, data `src/data/catalogOverhaul/legendKeys.json`. Tests: `tests/unit/coLegendsKeys.test.ts` (8).

## How it works
- **Earned, never bought.** At each stage start (`syncLegendKeys`, before the event stops are placed) every key whose earn conditions hold is given once and sets run flag `key-<item>`. Its place (the old event id, `keyItem`) requires that flag, so a key from a reward draft, a shop or the Lost Property opens nothing. All 21 key items are `giftOnly` (never in reward drafts).
- **Engine change:** a key-item stop is now placed only when the event's own `requires` holds (`events.ts`, key stops), so a place waits in the bag until its Trial is done.
- **Legendary keys = the Trial:** the questline Trial (L2 birds, L3 Ho-Oh, L4 Lugia, L7 Eon, L10 Tao) or the run's blessing at Influence 5. Oak's Letter: Three Birds passed. Works Key: Zapdos's Trial. Secret Key: Moltres's Trial. Magma Stone: Heatran blessing at 5, or Heatran Signs 3, or fire Signs 5. MysticTicket: after one wing's place (or Lugia / Ho-Oh blessing at Recognition). The place: a pseudo fight with the Legendary (catchable; a loss never ends the run); Recognition (its blessing at Influence 7) lets it offer itself; if it is already with you, it goes on alone (Signs +2, heal, Bond).
- **Mythical keys = the Visit condition:** three Tellings (believed) and no Mythical visited yet: AuroraTicket (Deoxys), Old Sea Map (Mew), Liberty Pass (Victini). The place is a Visit door that ends in that Mythical's Promise room. Azure Flute (Arceus, same-run): a Guest kept true to the last region opens the Hall of Origin into the MY11 pedestals.
- **Flute Maker, Old Collector, Ruins Dig** sell and hand out nothing now: they tell how each key is earned (a Telling or a Sign), and react to a key you carry.
- **Communion upgrades:** Reveal Glass (Tornadus, Thundurus, Landorus) when the run's Forces of Nature blessing is in Communion and that Pokémon is in the party. Kyurem fusion (DNA Splicers): Kyurem and Zekrom/Reshiram in the party after the Tao Trial, or the Kyurem blessing in Communion. Meteorite: once per region while Deoxys is the Guest; Deoxys's Wonder stance for the region (Attack +15% damage, Defense -15% taken, Speed x1.5 Speed, Normal +5%/-5%), and a party Deoxys changes Forme. Odd Keystone: given at the first Ghost-type knocked out in a won battle (`odd-spirits`); at 108 spirits Spiritomb, or set them free.
- **Reactions:** a researcher reacts to a Legendary in the party (extra choice in Communion) and to a Mythical Guest (new mirror flag `guest-any`).

## Known limits
- The Empty Vessel, Thundurus, Landorus, Lugia, Reshiram, Zekrom, Heatran and Latias blessings are not in the blessing roster yet; their "blessing at Influence 5" routes start working when they are added. The questline routes work today.
- Speed Forme is a Speed x1.5 stance, not a literal "acts first on turn one". 108 spirits is the doc's number and is rare in one run.
- Keys are only live when the row A file is loaded (old-seed fingerprints unchanged).

## Re-read table (doc: ledger SYSTEM rules, LEGENDARY_BLESSINGS.md Part 4, MYTHICAL_PROMISES.md Part 5)
| Ids | Doc rule | Checked |
|---|---|---|
| 17 key ids (auroraticket-island ... works-key-plant, flute-maker, old-collector, ruins-dig) | tickets become keys earned as the Trial or Visit condition; Flute Maker and Old Collector tell, never sell | 2026-11-16 |
| kyurem-black, kyurem-white, tornadus-/thundurus-/landorus-mirror, meteorite-deoxys, odd-keystone-spiritomb | form items become Communion upgrades; Odd Keystone gathers 108 spirits (one per Ghost knocked out) | 2026-11-16 |
| researcher-recognizes-legendary, -mythical | a reaction to a Legendary in the party or a Mythical Guest | 2026-11-16 |

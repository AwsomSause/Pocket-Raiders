# Overhaul slice 7: Item screen with a party preview

Choosing a Pokémon for an item (in battle and between battles) now shows, on every party row: HP and HP percent, status, held item name, and a coloured mark with the exact effect ("✔ HP 1 → 18", "✖ Fainted", "● HP full", "✔ Evolves", "✔ Nature → Jolly"). The footer shows the item card (name, rarity, how many you own, description) plus the exact effect on the focused Pokémon ("Restores 17 HP: 1/18 → 18/18"). Press I (or click "I Summary") for a quick Pokémon summary (types, ability, nature, stats, moves with PP, held items, status, HP, evolution, run record) without leaving the list; I, Enter or Esc closes it and the list is as you left it.

Code: `src/core/itemPreview.ts` (pure, uses the same heal multiplier as the real use via `runHealMultiplier`), `src/ui/itemScreen.ts` (summary text), `Picker` `inspect` and `partyRow` `preview` in `src/ui/partyPanel.ts`. Tests: `tests/unit/itemPreview.test.ts` (preview matches the real rules for every item kind), `tests/e2e/itemPreview.spec.ts`. No save change.

Limits: only the Pokémon-target item list got the preview (not the Bag list or held-item gifting); the summary is text, not artwork; "Already has the effect" is shown for full HP/PP, no status, same nature or Tera Type.

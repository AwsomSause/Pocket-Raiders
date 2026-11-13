# Variant lines part 4: Patchwork, Snagged, Loud

**Player gets:** three more special-Pokémon rules in battle. Patchwork shows its gadget (net, smoke ball or spring) and sets it off once on the first hit. Snagged sometimes refuses to act. Loud hits 20% harder with sound moves, and can cheer itself faster or lose its first turn.

**Save:** no version bump. Battles gain an optional `variantTimed` list (net and smoke wear-off); old battles load with an empty one. Migration-style test included.

**Limits:** Couture, Overcharged and Tuned are still not wired. Loud's Speed cheer is capped at +1 (balance). Snagged is a heavy drawback by the script (carrier wins 14% of mirror fights). Spring does nothing to a wild Pokémon. No event sets the Loud crowd or the League Card flag yet. Sim: Patchwork 48.5%, Snagged 14.0%, Loud 59.3%.

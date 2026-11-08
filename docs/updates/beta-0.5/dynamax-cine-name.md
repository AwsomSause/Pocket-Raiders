# Dynamax scene objects keep the `cine-<kind>` name

- The remade Dynamax scene named its objects `cine-dynamax` even for Gigantamax, so the browser test "Gigantamax from the battle menu" (milestone8_5) never saw `cine-gigantamax` and timed out. The scene now names objects `cine-dynamax` or `cine-gigantamax` by kind.
- Checked: that spec passes locally. No gameplay or save change.

# Default to original designs (2026-11-02)

Kice: every menu or visual with selectable looks now starts on its original, pre-rework design. Redesigned looks stay as Settings options.

- Screen styles (`screenStyles`): an unset screen is now `original` (was `random`). `random`, a pinned style, and `original` all still work; an unknown/unbuilt saved style falls back to `original`.
- Hub style: default is Arena Lobby (the old tile hub). Hub Town is a Settings option.
- Settings v20: migration sets `hubStyle` to `lobby`. Old saves had no `screenStyles` key set, so they pick up `original` without a migration; an explicit `random` or pinned look is kept.
- Unchanged: event style (Diorama is the only event look that existed first), plaza style (new screen, no original), battle UI plates.
- Known limit: a player who picked Hub Town before this lands is moved back to Arena Lobby once (the old save cannot tell a pick from the default).

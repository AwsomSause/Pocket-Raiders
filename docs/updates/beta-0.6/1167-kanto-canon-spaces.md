# Kanto Canon Spaces (workstream 18, slice 1: catalog + Town Roll)

**Player gets:** nothing you can see yet. The 71 Kanto Canon Spaces (19 Pseudo Stages, events, checks, shops, hubs, cutscenes, 8 route events) are now checked data, with the 11 stage slots and the Town Roll that picks which optional spaces each town offers (2 early, 3 later, at most 2 Pseudo Stages, Always spaces first, triggers only when their flag is set, one-time rewards retire a space). Each space's behaviour (beats, odds, rewards) comes in the next slices.

**Save:** none. The menu is worked out from the run seed, the slot and the `kanto.*` flags, so nothing is stored. It uses its own derived seed (`canon.townroll`), so no existing roll changes.

**Limits:** "Haunter's Prank" (Lavender) is in the pack's table but has no id or spec, so it is left out until written. The 12 game route moments in section 13.2 have no ids and are left out. Sevii spaces are not in the Kanto pack file. Nothing reads the menu yet. Rebuild with `npm run data:canon-spaces`; new gate `canon-spaces-gaps`. Source: `tools/sources/expansion/CANON_SPACES_KANTO.md`.

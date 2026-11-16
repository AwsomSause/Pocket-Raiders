# Rival pool +16 (2026-11-16, Kice)

- Added to `majorRivals.json` (secondary, never the main slot) and `trainers.json` rival names: Red, Manga Red, Ethan, Manga Gold, Dawn, Lucas, Hilbert, Rosa, Serena, Marnie, Tracey Sketchit, Alain, Kris, Lyra, Green. ("Callem" = Calem, already in.)
- Signatures: Red Pikachu, Tracey Scyther (`rivalHome.json`). Old-seed test unchanged (names appended after the first 13).
- A player who picks Red (also Champion/Masters Red), Kris, Lyra or Green never meets that rival (`rivalNamesExcluded` in `core/encounters.ts`, used by the first-rival plan).
- Sprites: `rivalBossFor` (core/rivals/major.ts) uses the character's boss entry, else the `sprite` stand-in field (Manga Red = Red, Manga Gold = Ethan).
- Missing art: Manga Red, Manga Gold (use Red/Ethan stand-ins), Tracey Sketchit (class default sprite). No boss entries added for them (boss tests need forms, Legendaries and gimmicks).

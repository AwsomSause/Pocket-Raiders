# Kalos and Galar Evil Team saga (Beta 0.7, workstream 10, E9)

**Player gets:**
- **Kalos (Team Flare, "The Guest List")** and **Galar (Macro Cosmos and Team Yell, "The Forecast")** each get the Standard Cut saga Kanto already has: 8 story events per region on quiet map nodes (`xe.kalos.*`, `xe.galar.*`), a world-state track with a Notebook page (key T), and Dossier entries that fill as you meet the cast.
- Kalos events: Not Stylish Enough (anchor, always occurs), The Corner Table, The Tall Man, The Courier, Under Time, The Factory Floor, Essentia, Something in the Bag.
- Galar events: Have a Ball (anchor), Road Closed, Darkest Day Cover, For Immediate Release, The Old Seam, Their Majesties, The Partner Firm, The Gig.
- Track effects in play: Kalos step 1 one shop +10%, step 2 first Center shut at night, step 3 Centers give back 85% HP (a Flare Key from the boutique lifts it), step 4 and 5 the Holo Caster banner. Galar step 1 one partner shop −5%, step 4 that shop +10% (supply issues), step 5 the red-sky banner.
- Same rules as Kanto: no random rolls, never raises an enemy level, no effect with the saga off, density low 3 / normal 5 / full 8.

**Save:** none. Events, flags and track steps use the existing optional `run.expansion` fields. No new save version.

**Limits:**
- Standard Cut only. Kalos and Galar Raids 4 and 5, the Extended Cut, Stand With Them, liaison and ROM are not wired for these regions (the data is imported; the Kanto-only code paths are untouched).
- Not built because the engine has no hook yet: Kalos Couture second held item, "half of each city is dark", "reserved for members" shop lines, wild Dynamax tremors, Red Cloud den rules, rail/air extra step, Encore chant and Dynamax Overload Shadows. The matching events set story flags (`ev:flare-*`, `ev:galar-*`) for the slices that will read them; Intel is a flag, not a meter.
- Kalos and Galar Evil Team variant lines (Couture, Loud) were already wired in 0.6; the Overcharged line stays unrouted.
- Squishy joins nobody; Mimi (Essentia) and Peony are flags plus a companion; no sprites added (art is not needed now).
- Tests: `tests/unit/xeKalosGalar.test.ts`, `worldTrack.test.ts` (new Kalos/Galar rows).

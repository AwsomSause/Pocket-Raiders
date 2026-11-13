# Kanto Canon Spaces: Pewter events (workstream 18, slice 2)

**Player gets:** in a Kanto run with the Kanto setting on (`kantoSevii`), Pewter City's stage now rolls its Town Roll menu and places up to 2 of its 4 optional events on the map: Brock's Rest Stop (stew heals 15%; a second stop lets you pick a stat for a x1.5 boost in the next boss fight), the Pewter Museum (register a Helix or Dome fossil for 300 coins, or win the Old Amber with the fossil quiz), the Magikarp Salesman (500 coins; 35% a strong Magikarp) and The Flock (a 3-wave Spearow fight; win and a Pidgey joins). Finishing one marks the space done and sets its `kanto.*` flag.

**Save:** no version bump. State is in `run.expansion.canon` (flags, finished spaces, rolled menus); old runs have none and are untouched. The run's timeline record now carries `kantoCanon` so replays roll the same menus.

**Limits:**
- Veridian Forest and Mt. Moon (Pewter's two always-on Pseudo Stages) are not built yet, so they take no map stop yet. Stages after Pewter roll a menu but only spaces with an event are shown, so nothing else appears yet.
- Numbers the pack leaves open are mine: museum pays 300 coins, a "good" Magikarp is level +3 (IVs are not modelled; Swift Swim is its normal ability).
- Brock's "+1 stage at the start of the boss fight" is modelled as a x1.5 stat boost for the next boss fight (four stats offered: Attack, Defense, Sp. Atk, Speed). The 50/40/10 stew odds are exact (two rolls).
- The museum's "Fossil Fragment" for players with no fossil is left out: no such item exists yet.
- The Flock's Pidgey does not yet feed Flight North or Pidgeotto's Farewell (those spaces are not built).

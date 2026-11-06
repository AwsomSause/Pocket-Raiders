# Key item upgrade levels (S414)

Two new uncommon events, "Key Item Workshop: Rods" and "Key Item Workshop: Bikes" (`src/data/events/keyItemWorkshop.json`): trade Old Rod to Good Rod (₽600), Good Rod to Super Rod (₽1200), Bicycle to Mach Bike (₽1500), Mach Bike to Acro Bike (₽2000). The lower item is used up. Choices lock without the item or the money.

- Limits: rods and bikes only. The scanner has no level items in the game, so it has no upgrade yet.
- No save change. Test: `tests/unit/keyItemWorkshop.test.ts`; the old-seed story test leaves the event out.

# X1: late bosses toned down (data only)

- **Player gets:** late Gym Leaders, Elite Four and Champions past level 100 hit a little softer: no Life Orb on boss teams in the level bands or the competitive gyms, boss AI sharpness halved-ish, and one less training stack per band from level 201 up.
- **Save:** none (balance data only).
- **Limits:** the sim does NOT show a measurable change. Same 24 Full-campaign runs at +40 levels (`node tools/playtest.ts 0 24 out.jsonl --deep --heal --full --par=40`, deterministic): runs reaching region 5+ went 4 to 2, runs ended in region 4 stayed 9 and 9. The deep bot plays with boss gear off, so only the bands and competitive gyms were measured. The wall (bosses hit for 100%+ of a Pokémon's HP even 44 levels behind) comes from the damage and HP formula plus setup moves like Dragon Dance, not from gear; fixing it means a damage-formula or stat-scale change for every late fight, which needs Kice's call.

## Changes (`src/data/balance.json`)
- `competitiveGyms`: ai 0.1 to 0.05, Life Orb removed.
- `bossBands`: ai 0.05/0.1/0.15/0.2 to 0.03/0.06/0.09/0.12; training 1/2/3/4 to 1/1/2/3; Life Orb removed from every band.

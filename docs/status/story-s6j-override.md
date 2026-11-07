# S6j: Personality Autonomy and Override

- **Autonomy Off or Flavor** (Settings > Story): a Pokémon never refuses a command in a Story Run. The setting is copied onto the run (`story.v2.autonomy`) before each turn. Classic runs are unchanged.
- **Full**: the existing refusal becomes an offer. Picking a move the Pokémon would refuse shows "Insist / Let it decline / Pick another move". Insist sends the command through and costs Heartbond (trust -2, respect -2). Only the first two overrides in a battle cost; the third and later are free (Part II-C). `v2.heartbondOverrides` counts them. After an override or a refusal it will not be offered again that battle.
- Your last conscious Pokémon never refuses.
- Not built: the hardcore-challenge rule (offers visible, overrides free) because that mode does not exist yet; offers for switch/recall (Brave, Stubborn) beyond the existing reckless-move refusal.
- No save bump (`autonomy` has a default). Not browser-checked.

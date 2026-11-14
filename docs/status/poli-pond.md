# Poli-Pond, "The Little Pokémon That Could" (Beta 0.7 miniature episode)

Done: a run-wide companion story, built exactly to Kice's spec with the text expanded. Source of the text: `tools/episodes/build-poli-pond.mjs` (writes `src/data/events/poli-pond.json`, 9 events); rules: `src/core/episodes/poliPond.ts`.

- **Cold open** (`pp-cold-open`, forced, from stage 2): a Poliwag joins (3 choices, all start the story). The three lessons and the pond visit are placed on later nodes of the same stage; anything unplayed comes back at the next stage start.
- **Shy first battle:** the Poliwag will not attack until its first battle is over.
- **Three lessons at rests** (aim, footing, standing its ground): each starts with a failed first try, then a retry (attribute check). A lesson taught on the first retry counts; all three first-retry = Exceptional. Each lesson not yet taught is one nerve in normal fights (wild swing every third turn, flinch on its first turn out, tries to run under half HP once) and the same thing as one of the lead bully's tricks in the rematch.
- **The pond** (`pp-pond-visit`): the Poliwhirl who hangs back; talking to it sets `pp-guilty` (needed for Reconcile).
- **Rematch** (`pp-rematch`, next stage): one-on-one duel (rule `pondDuel`: the Poliwag leads, no switching, the foe is its level +7, a loss is a pseudo loss and it comes back). Exceptional version (`pp-rematch-exceptional`) evolves the Poliwag mid-fight (`evolveMid`).
- **Endings** (`pp-ending`): Keep (ability Kindness), Release (founds a pond), Reconcile (needs the guilty Poliwhirl found).
- **Kindness** (new ability): when its bearer switches out alive, the Pokémon coming in has +1 priority on its first move, twice per battle.
- **The return** (Release or Reconcile): in an Evil Team leader, Champion or climax fight, the first time the lead drops under 40% HP, Poliwrath plus 3 Poliwhirl (Reconcile: 4) strike at the end of each turn for 3 turns (Reconcile: 4). Never announced beforehand; each hit is 8% plus 3% per Poliwhirl of the foe's max HP and never knocks it out. Afterwards `pp-return-join` offers Poliwrath at the party's average level with Kindness.

State: story flags `ev:pp-*` and one optional `pond` mark on the Poliwag. No save version bump (optional field; old saves load as they are). No random numbers anywhere.

Limits: the afterstory "familiar cry" is text only (no new sound); numbers (8%/3%, 40%, +7) are constants in `poliPond.ts` rather than `balance.json`; the old Kanto canon spaces are untouched (retired by another PR). Tests: `tests/unit/poliPond.test.ts`.

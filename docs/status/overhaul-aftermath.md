# Overhaul slice 26 (part): boss aftermath

When you beat a gym leader, Elite Four member or champion that the pack knows (about 200 matched by boss id), the run keeps one aftermath line for that boss, picked by the run seed from the boss's voice (gruff, boastful, formal, menacing, eccentric, cheerful, poetic, nervous). A won run's epilogue shows the newest three.

- Kept in `run.story.flags["after:<bossId>"]`: no save change, once per boss per run, run-only (no cross-run memory), no RNG stream.
- Code: `core/overhaul/aftermath.ts`, one call in `run.ts` where a boss win is counted, one line in `ending.ts`. Tests: `tests/unit/overhaulAftermath.test.ts`.

Limits: the lines are short and presentation-only (they change no rewards or fights). The collection journal and encounter history are not built as new screens: the game already has Run History, per-stage journal lines, dex tallies and nemeses. A profile journal would be profile v20 and waits for Kice's go.

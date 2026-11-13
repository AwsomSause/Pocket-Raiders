# Wide formats: Debate (E4, 7 of 7)

- `src/core/formats/debate.ts`: three exchanges. Each has one claim and a list of evidence that wins it (a story flag or a Key Item in the bag). The player puts forward a piece of evidence they hold, or answers plainly (never wins). Evidence is never used up. The card says how many pieces are held, never which win.
- Result: 3 wins = `clean`, 2 = `objection` (one line, no battle), fewer = one battle against the opponent (4 Pokémon, +2 levels, tagged `format:debate`): `settled` if won, `lost` if not. Written once to `run.story.flags['star.x.debate']`. A lost battle is a story loss: party healed, run goes on.
- Content: Paldea's Assembly (Harrow) in `DEBATE_TABLE`. Evidence flags used: `star.x.deletion-log`, `star.x.tully-stood`, `star.x.wrong-boots`, `star.x.navi-drum`, `star.x.first-engine`, and Key Item `nascour-brochure`. Those are not set by anything yet: the Paldea raids and events must set them (a player with none can only reach the battle).
- Not built: a Debate screen (plain Format card), Harrow's own team (the battle uses a Veteran class team), other regions' debates.
- Tests: `tests/unit/formats.test.ts` (Debate block).

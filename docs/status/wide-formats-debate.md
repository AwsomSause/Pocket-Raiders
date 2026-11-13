# Wide formats: Debate (E4, 7 of 7)

- `src/core/formats/debate.ts`: a real argument in rounds. Three exchanges; in each the opponent makes a claim, you choose an ARGUMENT (evidence you hold, the apt reasoned argument, a weak one, or bluster), the opponent REBUTS with a tactic (denial, smear, appeal to authority), and you choose a REBUTTAL (three answers, one per tactic).
- Scoring (`POINTS`): evidence that bears on the claim 3, apt argument 1, weak 0, bluster -1; the rebuttal that answers the opponent's tactic +2. An exchange is won at 3 or more. Evidence carries an exchange alone; reasoning wins it only with the right rebuttal. Evidence is never used up. The card says how many pieces you hold, never which win.
- Result: 3 wins = `clean`, 2 = `objection` (no battle), fewer = one battle against the opponent (4 Pokemon, +2 levels, tagged `format:debate`): `settled` if won, `lost` if not. Flag `star.x.debate`. A lost battle is a story loss: run goes on.
- Content: Paldea's Assembly (Harrow) in `DEBATE_TABLE`, with written arguments and replies. Evidence flags used: `star.x.deletion-log`, `star.x.tully-stood`, `star.x.wrong-boots`, `star.x.navi-drum`, `star.x.first-engine`, Key Item `nascour-brochure`. Nothing sets them yet: the Paldea slices must. A player without evidence can still win exchanges by reasoning.
- Not built: a Debate screen (plain Format card), Harrow's own team, other regions' debates.
- Tests: `tests/unit/formats.test.ts` (Debate block).

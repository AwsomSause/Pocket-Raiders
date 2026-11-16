# New UI: the event screen, remade so every event draws in its own way

**Player gets:** (New look)
- **A new event screen.** The four old event layouts are replaced by one stage. Each event gets its own picture, decided from its own name and text: where it is (33 places, from a road or a lake to a market, a ship's deck, ruins or the void), the hour (the text's own "midnight" or "sunset", else the run's clock), the mood (calm, warm, tense, eerie, sad, festive, grand, mystery, playful), the weather and what drifts in the air (leaves, embers, fireflies, snow, confetti).
- **Places that had no picture are drawn.** Towns, rooms, halls, shops, ruins, snowfields, harbours, fairs and the void are drawn from the event's own number, so no two events share a skyline, a shelf of goods or a row of pillars. Places with art (routes, forests, caves, lakes, labs and more) use it, at dusk and at night where the art has it.
- **Its own mark.** Every event has a small 5 x 5 mark beside its name that is its alone.
- **Everyone the event names is in the scene.** Up to three people stand in it (whoever speaks steps forward, the others dim), with the Pokémon and items the text names. A scene with nobody in it shows your lead Pokémon looking on from the near corner.
- **Choices are cards that say what they are.** Each has an icon (fight, catch, trade, pay, leave, help, give, take, talk, look, rest, train, go) and a colour, and a chance shows as a meter (green, gold or red). The scene reacts to the card under the cursor: a fight turns it red and the figures brace, walking away cools it, a kind choice warms it.
- **Text is said the way it is written.** A shout is heavy and jolts the box, a whisper is small, and a mark pops over the speaker (a laugh, tears, a question, a shock).
- **Outcomes land.** Each result line has an icon, bad news is red, and the scene bursts with what happened (coins, hearts, a healing glow, a new Pokémon). A failure or a fight shows with the text; anything won shows only after the text is read, as before.
- **The old scene effects all work now.** Shake, float, rattle, spin, confetti and net were not drawn in the New look before; a sparkle is now a few twinkles, not a sheet of dots.
- **Legendary Blessing opening:** the spotlight and the podium are gone (Kice, Nov 16). The blessing's item floats on plain black. Both looks.
- **Battle:** a long move name ("Struggle Bug", "Parabolic Charge") fits its button beside the PP.

**Save:** none.

**Limits:**
- The Old look keeps its eight event styles as they were. The prologue, story, tutorial and stadium broadcast pages keep the mock-ups' talk page.
- A department store floor, the tournament bracket, the Honest Trade Card, the code-name card, a rival's team page and the Team Magma/Aqua team screens keep their own pages.
- People are added from the text only when the event pictures nobody, and only for trades the game has art for (a Hiker, a Fisherman, a nurse and so on).
- With animations turned down the scene is a still picture (no weather, drift or camera).

**Tests:** unit `eventVisuals.test.ts` (22, with the check over all 9,118 events: every one resolves, no two alike, every choice has an icon), `eventScenery.test.ts` (7), `reduxEventView.test.ts` (45), `reduxBattle.test.ts`; browser `newUi.spec.ts` (new: the remade screen draws a road event and a drawn town, reacts to the cursor, and keeps animations across redraws). Report: `docs/quality/EVENT_VISUALS.md`.

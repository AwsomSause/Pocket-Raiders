# Look picker and opening fix

- Look B can now be picked in the prologue. Both Looks show a portrait preview above the menu (Look A and Look B).
- The opening (prologue) is no longer forced on every launch: it auto-plays on a brand-new profile, and not again once the player has reached the Look screen or set a name. It stays on the title menu ("Story Prologue"). The Hub and save slots still stay closed until it is finished once.
- The update log and tutorial offer were already saved once per player; checked in a real browser, they do not repeat.
- Tests: `storyIdentity.test.ts`, `playerTrainers.test.ts`, `prologue.spec.ts`.

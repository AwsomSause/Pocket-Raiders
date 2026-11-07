# Story sounds and icons wired (S17 audio ids, P7 icon pack)

- `ui/audio.ts`: `playStorySfx` / `playStoryMusic` play a story audio id through `storyAssetId` (made file, else its reuse sound).
- `ui/storyIcon.ts`: draws a story icon, loading it on demand.
- In use: Story screen (page flip, choice hover/confirm), Field Trial (rival battle music, error, Heartbond tick and heart, Feat stinger and emote, tip stinger), prologue quiz music, a keepsake icon on every row of the Keepsakes list.
- Test: `tests/unit/storyAudioIconsWired.test.ts`.
- Limits: badge, snack, tone and most emote icons, leitmotifs, region and team music are still unused.

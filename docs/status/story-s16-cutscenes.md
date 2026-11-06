# Story S16: Cutscene Manager and Trainer Introductions

(Pose cards and emote bubbles were already built in #891; this adds the rest of S16.)

- `core/story2/cutscene.ts`: `CutsceneSchema` (6 tracks, tiers S/A/B, 6 templates), `planCutscene` (time order; Reduce motion drops camera/vfx/character steps; Disable all animations keeps dialogue, audio and flag steps), `skipCutscene` (recap card, flags still set), `subtitleKeys`, and the 10 Trainer Introduction templates with their text (`intro.*`).
- `ui/cutscene/cutsceneRunner.ts`: `playCutscene(scene, cutscene, env)` plays a plan with the Story Portrait line, fades and waits; hold Esc/Space for 0.6 s to skip with a recap. It returns the story flags to set; it never changes game state itself and a presentation error ends the scene instead of blocking the story.
- New template tokens: speaker, pokemon, title.
- Not built / limits: no caller yet (no cutscene data is authored; each content slice adds its own), no long-press touch skip, no camera/vfx/audio playback in the runner (those steps are planned but only dialogue, fade and wait are played), cold-open montage not built (needs the 8-shot art), no subtitle styling for non-dialogue audio.
- Tests: `tests/unit/storyCutscene.test.ts`.

# Title backdrop clips and springy buttons (2026-11-16)

Kice's ask: the title screen switches and fades between six animated pictures, and every button bounces.

- **Title clips.** The six GIFs became small H.264 clips in `public/assets/video/title/` (provenance beside them). Order, hold (9 s) and fade (1.5 s) are in `src/core/presentation/titleClips.ts`; `src/ui/titleClips.ts` draws them. Old look: Phaser videos on the canvas over the arena. New look: `<video>` tags in a second view (`MainMenuBack`) under the menu view, whose markup never changes, so the clips keep playing while the menu redraws. They start on a random clip (plain `Math.random`, never gameplay RNG), cover the screen and scale with nearest-neighbour.
- **Springy buttons, New look.** `stage.ts` marks a button-sized `[data-act]` (at most 420 x 300) with `.sp` when the pointer reaches it; `redux.css` springs it on hover and squashes it on press. Every `.btn` pops in when its screen opens (on the view's clock, so a redraw does not replay it).
- **Springy buttons, Old look.** The existing hover/press/release motion (`wiiMotion.ts`, `uiMotion.ts`) got a back-ease hover, a deeper press and an elastic release.
- **Motion settings.** Menu animations off, Disable All and the device's "reduce motion" switch stop the bounces; the title clips then show paused and only fade.

Known limits
- A browser without H.264 (Playwright's test Chromium) keeps the old title picture: arena in Old, splash art in New. The clips themselves are checked by hand, not by CI.
- Old look with a picked title screen style keeps that style's own backdrop (no clips).
- Battle screen: no new styles, only the shared hover/press motion.

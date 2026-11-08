# Update splash
**Player gets:** the first time you load the game after the update, a full-screen "Beta 0.5 – You Are Not Alone" picture fades in over birdsong, holds about 15 seconds, then fades out. It covers the loading screen, and the main menu is skipped: you go straight into your latest saved run, or the hub if you have none. Click or any key skips it. It shows once per update (stored as `pkr.splashSeen`); muted sound is respected.
**Save:** none (a browser-side "seen" flag only).
**Dev:** `?splash=1` forces it, `?splash=0` hides it; automated browsers skip it by default. For the next update, change `SPLASH_ID` and the image in `src/ui/updateSplash.ts`.
**Limits:** uses the existing `amb-birds.mp3` loop. New players still get the Welcome/prologue screens first.

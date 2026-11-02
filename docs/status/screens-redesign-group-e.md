# Screens redesign, group E: hub and collection

Built from Kice's picks (2026-11-02). One shared module, `src/ui/screenSkins.ts`, paints the look; scenes keep all state, input and outcomes. Look chosen by `screenStyleOf(screen, settings.screenStyles, salt)`; Settings gets one "<Screen> style" entry per screen (Random / each look / Original). No save bump (settings v16).

| Screen | Looks built | Where it shows | Salt (stable per visit) |
|---|---|---|---|
| dex | aero, ds, sticker, wii, ink | Hub Research Room, Moment Codex, Mastery, Item Museum lists | runs ended |
| settings | aero, wii, shoujo, ink, notebook, rotom, sticker | Settings scene backdrop and its pickers | runs ended |
| hubmenus | aero, wii, shonen, sticker, ink, achievements, album | every other Hub room list and the place pages | runs ended |
| legacy | museum, polaroids, manga, timeline, cards, previously, bloom, aero, ink, wii, hall | Legacy Gallery and Memories | runs ended |
| loading | aero, ball, terminal, wiihealth, ds, ink, shuffle, sparkle, region | Boot loading screen (spinning ball, fanned cards, sparkles and boot text are animated) | tip counter |
| expedition | aero, manga, depth | Expedition route screen backdrop | run seed + expedition id |
| minigame | wii | Minigame screen backdrop | run seed + minigame id |

## Known limits
- A look restyles the backdrop, header band, row and message-box colours and ambient drift; the list layouts are the existing ones (mock-up layouts such as the museum frames or timeline branches are drawn as backdrop art, not new layouts). Row text colours are unchanged, so every backdrop is kept dark enough to read.
- Ambient drift plays only with full motion; reduced/off draws it still.
- Not built: raid (maxden, shonen, tera) and totem (ink). Those screens are battle-scene formats owned by the Battle group; they can reuse `SKINS` once that group exposes a backdrop hook.
- Hub Town overworld, Plaza, shops and trade stops are other threads.
- Loading screens must not slow loading: the backdrop is drawn from graphics only, no assets.

## Tests
`tests/unit/screenSkins.test.ts` (every ready look has a skin, pin/original/rotation); `tests/e2e/screenSkinsE.spec.ts` (pins looks, opens Settings, Legacy, Hub rooms, no console errors).

## Update: Legacy gallery layouts (PR 2)
Kice asked for every look to match its mock-up layout, not only the backdrop. The Legacy Gallery run list now draws each look's own layout (`src/ui/legacyGallery.ts`): museum frames, tilted polaroids, manga panels (2x2), timeline nodes on a line, binder cards, "Previously on" trio, bond bloom (one big bubble plus a dot row), aero shelf, ink list with the 伝説 heading, Wii photo grid (5x2), hall of legends duo. Arrows move the focus, Enter or a click opens the run's record, Esc goes back. With a revisited timeline in play the original list is used (it needs its Continue/Abandon rows). The Memories pages still use the skinned list. Still to do the same way: Pokédex, hub menus, Settings, loading, expedition, minigame, raid and totem.

## Update: Pokédex and loading layouts
Pokédex set list: `src/ui/dexBrowser.ts` (aero, wii, sticker grid plus detail card; ds detail-left; ink scroll list). Loading: `src/ui/loadingLooks.ts` draws each of the nine loading looks as its own composition (logo, bar, tip, spinning ball, card shuffle, boot terminal, region preview). Loading looks were checked for no console errors and reaching the title; their visuals could not be screenshotted mid-load in the test (assets are cached on a restart), so compare them by eye on a cold load.

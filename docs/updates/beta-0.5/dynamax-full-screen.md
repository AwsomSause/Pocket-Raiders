# Dynamax screen reaches the top again

- When the battle camera was zoomed or panned (Galar stadium close-ups), the Dynamax scene did not cover the top of the screen. The scene now stops any camera move and shows the whole arena for its length (`dynamaxScene.ts`, using `cameraReset`).
- Checked in a browser with the camera pre-zoomed to 1.5: the scene fills the screen from top to bottom.
- Mega, Tera, Z-Move and the short Dynamax/evolution scenes get the same camera reset (`cameraForScene` in `opening.ts`). Checked in a browser with a 1.5x zoomed camera: all fill the screen.
- Presentation only.

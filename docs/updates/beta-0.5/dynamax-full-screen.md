# Dynamax screen reaches the top again

- When the battle camera was zoomed or panned (Galar stadium close-ups), the Dynamax scene did not cover the top of the screen. The scene now stops any camera move and shows the whole arena for its length (`dynamaxScene.ts`, using `cameraReset`).
- Checked in a browser with the camera pre-zoomed to 1.5: the scene fills the screen from top to bottom.
- Presentation only. Other gimmick scenes are unchanged.

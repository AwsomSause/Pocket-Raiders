# Hub Town glitch fix (2026-11-06)

Kice: random assets in Hub Town look cut off or layered over others.

Cause found: the tileset bakes a hard-edged dark shadow rectangle into every building/prop stamp, so each building had a box laid over the ground and its neighbours; and the lamp glow disc was drawn on top of the lamp.

Fix: `tools/hubtown/build.py` now drops those baked shadow pixels (trees keep their soft shadow) and the committed `hubtown_props.png` was cleaned the same way; lamp glow is drawn behind the lamp at lower strength (`townTime.ts`).

Known limit: buildings now have no ground shadow. Before/after: project files `shots/hubtown-glitch/`.

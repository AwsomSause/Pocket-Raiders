# New UI: the Leader's Table is a war room, the Siege Map is a war map

Kice, 2026-11-16: "Make Evil-Leaders table and Siege-Map more Extravagant and eye-catching".

**Player gets:** (New look)
- **Leader's Table (Team Magma / Team Aqua).** A dark war room in the team's colours: banners with the team's mark, wall lamps, a rug, the Leader in a tall seat at the head with a glowing plaque, the two Admins at the sides and your own chair pulsing at the foot. The table carries a paper map of Hoenn with a pin for every plan. The plan under the cursor lifts its pin and a dotted line marches it out to the empty hills. Candles flicker and sparks drift.
- **The choices are cards.** Each plan shows its chance of being noticed as a gauge with the number, read from the choice's own words.
- **Siege Map.** The grid of boxes is now a map of the city: a wall with towers, city blocks, a radar sweep and a road from every gate to the middle. Each gate sits on its own side (North Gate at the top, West on the left). A Held district flies a flag, a Contested one shows crossed swords, a Lost one burns and smokes. The road from the gate under the cursor lights up and marches inward.
- A bar at the top shows how much of the city is held, contested and lost. The side window stamps the district's status, and each lost district's effect is a red warning strip. The button to go in glows when the way is open.
- Arrow keys on the map go to the nearest district in that direction.

**Save:** none. Rules, odds and costs are unchanged; only the drawing changed.

**Limits:**
- The Old look, and the Siege Map's list layout, are as they were.
- The second Admin still has no picture, so a shadow sits in that seat.
- With animations turned down both screens are still pictures.
- The city on the war map is drawn from the siege's name; it is not a real map of that city.

**Tests:** unit `reduxEvilTable.test.ts` (7, new), `reduxOps.test.ts` (38; new checks: gates on their own sides, no district off the board or on another from 1 to 12, flag/swords/fire, the marching road); browser `coEvilHsu.spec.ts` (Leader's Table), `storyNewUi.spec.ts` (Siege: keys, clicks, free gate), `wideFormats.spec.ts` (Siege, Old look). Shots: `/mnt/project-files/shots/evil-new-ui/after-*.png`.

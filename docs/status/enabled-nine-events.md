# The nine disabled run events are on

- All nine W5 catalogue events that were `disabled` now play: Trainer Reunion, Rival Emergency, Evil Team Raid, Legendary Disturbance, Rival's Victory, Rival's Defeat, Forgotten Research Lab, Treasure Expedition, Dimensional Collision (`src/data/events/run-catalogue.json`).
- New small systems, no save bump: conditions `rivalLast` (how the last rival meeting ended) and `disturbance` (W8 world sim has an unsettled Legendary disturbance), effect `calmDisturbance`.
- Reunion: rematch after the Unexpected Challenge (size depends on whether you beat or refused them). Rival events set flags `rival-rescued`, `rival-abandoned`, `rival-respect`. Evil Raid needs the Evil Team story past beat 1.
- Two new dungeons (`dungeons.json`): Forgotten Research Lab (themed, boss) and Treasure Dig (basic, 3 rooms). Dimensional Collision opens the Distortion World pseudo stage (now `limited`, was disabled).
- Limits: no memory ladder beyond the one reunion (an event plays once per run); rival "condition" is the last-meeting result plus flags, not a separate state; Collision is gated on a disturbance, so it is rare.
- Tests: `tests/unit/disabledEventsEnabled.test.ts`.

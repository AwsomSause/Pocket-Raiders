# Free Reward Wheel (S83)

Run event `reward-wheel` (`src/data/events/rewardWheel.json`): a free wheel with its odds written on each choice. Small wheel 80% ₽300 else a Dire Hit; Gold wheel 25% a Rare Candy else ₽100. Never costs money and nothing is paid with real money. The odds are the event's plain `chance`, and a test checks the printed percent matches. Test: `tests/unit/rewardWheel.test.ts`. No save change.
Not done: a custom wheel graphic (it uses the shared event screen and the "spin" scene effect).

# Galar polish, round 2

Galar gym, tournament and Champion battles only.

- **Reporter opens every match** with the news-people sprite, shown as trainer text. The leader/opponent then speaks their own lines.
- **Camera fix:** a safety check on the real clock puts the camera back to the wide view if it is stuck off it; every turn also resets it.
- **Camera no longer lingers** after a send-out; the whole Pokémon is always kept in frame.
- **Scenes are slower** (intro cards and cuts stay longer).
- **Closing text** after a gym fight now loads the right trainer and art.
- **Tournament info screen** rebuilt: five centered cards with sprite, style, types, known team, field strength, crowd line, upset chance.
- **Crowd in the tournament** too, and far more often (cuts 70% of eligible beats, up to 8 per battle).
- **After turn 1** the battle always cuts to a crowd member (rival, future leader, future tournament goer, reporter) with a relevant line.
- **71 hype moments** in `src/data/galarHype.json` (gym, tournament, Champion).
- **Crowd favour bar** at the top (YOU vs FOE). When the crowd favours you, Hyper/Overdrive chances rise up to 1.6x.
- **Champion last stand:** once per Champion battle, when the Champion's last Pokémon falls, one more steps out that counters your strongest Pokémon and Mega Evolves ("pure bond"). Works in singles and doubles. No save change (flag in `run.story.flags`).

Limits: only the favoured *player* gets a mechanical boost. The Dynamax max-screen item belongs to the Dynamax thread.

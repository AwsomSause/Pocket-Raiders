# Event visuals: every event on the remade event screen

Made by `npm run report:event-visuals -- --write`. The event director (`src/core/presentation/eventVisuals.ts`) reads each event's own name, text and data and decides its picture; this page counts what every event in the game gets.

- Events checked: **9118** (every event in the game data). Events that failed to resolve: **0**.
- Events with a picture of their own: **9118** distinct pictures for 9118 events (each event has its own seed, so no two share a skyline, a room or a mark).
- Backdrop: 5383 events stand in one of the game's place pictures, 3735 in a place drawn for them (town, room, hall, shop, ruins, snow, ship, fair, the void).
- Someone or something in the scene: 5868 events show a person or a Pokémon from their own data or text (496 of them only because the text names a trade such as "a Hiker"). In the rest, the map stop's own picture or the event's party Pokémon stands in where the game has one (Pokémon Moments, camp rests), and otherwise the player's lead Pokémon looks on from the near corner, so no scene is empty.
- Choices: 21456 choices, every one with an icon and a tone; 4.7% fall back to the plain star.

## How the place was found

| By | Events | Share |
|---|---:|---:|
| The event's own words | 5515 | 60.5% |
| Its event group | 1731 | 19.0% |
| The stage's type (changes with the stage in play) | 1274 | 14.0% |
| Its map stop | 598 | 6.6% |

## Places

| Place | Events | Share |
|---|---:|---:|
| route | 2123 | 23.3% |
| hall | 1520 | 16.7% |
| cave | 478 | 5.2% |
| shop | 461 | 5.1% |
| gym | 439 | 4.8% |
| house | 352 | 3.9% |
| fair | 348 | 3.8% |
| city | 333 | 3.7% |
| sea | 270 | 3.0% |
| meadow | 252 | 2.8% |
| mountain | 230 | 2.5% |
| ruins | 217 | 2.4% |
| forest | 215 | 2.4% |
| camp | 211 | 2.3% |
| beach | 189 | 2.1% |
| lake | 152 | 1.7% |
| lab | 148 | 1.6% |
| garden | 148 | 1.6% |
| factory | 138 | 1.5% |
| sky | 126 | 1.4% |
| graveyard | 113 | 1.2% |
| void | 96 | 1.1% |
| mine | 93 | 1.0% |
| snow | 87 | 1.0% |
| space | 53 | 0.6% |
| volcano | 51 | 0.6% |
| center | 51 | 0.6% |
| desert | 47 | 0.5% |
| waterfall | 43 | 0.5% |
| underwater | 40 | 0.4% |
| safari | 38 | 0.4% |
| swamp | 29 | 0.3% |
| crystal | 27 | 0.3% |

## Moods

| Mood | Events | Share |
|---|---:|---:|
| calm | 3551 | 38.9% |
| tense | 2802 | 30.7% |
| warm | 748 | 8.2% |
| eerie | 674 | 7.4% |
| festive | 383 | 4.2% |
| grand | 361 | 4.0% |
| sad | 342 | 3.8% |
| mystery | 173 | 1.9% |
| playful | 84 | 0.9% |

## Weather and effects kept from the event data

| Weather | Events | Share |
|---|---:|---:|
| none | 6218 | 68.2% |
| sparkle | 767 | 8.4% |
| glint | 667 | 7.3% |
| fog | 399 | 4.4% |
| rain | 339 | 3.7% |
| fire | 248 | 2.7% |
| flicker | 184 | 2.0% |
| snow | 128 | 1.4% |
| hearts | 94 | 1.0% |
| confetti | 47 | 0.5% |
| net | 27 | 0.3% |

| Subject effect | Events | Share |
|---|---:|---:|
| none | 8631 | 94.7% |
| shake | 232 | 2.5% |
| float | 154 | 1.7% |
| rattle | 56 | 0.6% |
| spin | 45 | 0.5% |

## Shots (how the scene is framed)

| Shot | Events | Share |
|---|---:|---:|
| talk | 2386 | 26.2% |
| clash | 2354 | 25.8% |
| vista | 2264 | 24.8% |
| moment | 1505 | 16.5% |
| deal | 609 | 6.7% |

## Choice icons

| Icon | Choices | Share |
|---|---:|---:|
| battle | 3046 | 14.2% |
| talk | 3032 | 14.1% |
| pick | 2780 | 13.0% |
| leave | 2702 | 12.6% |
| go | 2025 | 9.4% |
| take | 1470 | 6.9% |
| coin | 1420 | 6.6% |
| look | 1209 | 5.6% |
| star | 1015 | 4.7% |
| care | 770 | 3.6% |
| rest | 620 | 2.9% |
| give | 561 | 2.6% |
| trade | 374 | 1.7% |
| dice | 246 | 1.1% |
| train | 120 | 0.6% |
| catch | 66 | 0.3% |

## Known limits

- The hour in this report is the afternoon for every event; in play it follows the run's clock unless the text names an hour.
- The stage type here is the event's own first type, or Normal; in play it is the stage the player is on.
- The Old look keeps its eight event styles as they were. The team screens of Team Magma/Aqua (table, briefing, final) and a department store floor keep their own pages.

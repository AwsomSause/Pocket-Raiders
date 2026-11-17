# Event visuals: every event on the remade event screen

Made by `npm run report:event-visuals -- --write`. The event director (`src/core/presentation/eventVisuals.ts`) reads each event's own name, text and data and decides its picture; this page counts what every event in the game gets.

- Events checked: **9135** (every event in the game data). Events that failed to resolve: **0**.
- Events with a picture of their own: **9135** distinct pictures for 9135 events (each event has its own seed, so no two share a skyline, a room or a mark).
- Backdrop: 5280 events stand in one of the game's place pictures, 3855 in a place drawn for them (town, room, hall, shop, ruins, snow, ship, fair, the void).
- Someone or something in the scene: 5879 events show a person or a Pokémon from their own data or text (503 of them only because the text names a trade such as "a Hiker"). In the rest, the map stop's own picture or the event's party Pokémon stands in where the game has one (Pokémon Moments, camp rests), and otherwise the player's lead Pokémon looks on from the near corner, so no scene is empty.
- Choices: 21513 choices, every one with an icon and a tone; 4.7% fall back to the plain star.

## How the place was found

| By | Events | Share |
|---|---:|---:|
| The event's own words | 5374 | 58.8% |
| Its event group | 1799 | 19.7% |
| The stage's type (changes with the stage in play) | 941 | 10.3% |
| Its map stop | 702 | 7.7% |
| Its storyline (the events that share the start of its id) | 319 | 3.5% |

## Places

| Place | Events | Share |
|---|---:|---:|
| route | 1920 | 21.0% |
| hall | 1629 | 17.8% |
| cave | 566 | 6.2% |
| shop | 450 | 4.9% |
| city | 419 | 4.6% |
| meadow | 390 | 4.3% |
| house | 382 | 4.2% |
| gym | 373 | 4.1% |
| forest | 319 | 3.5% |
| sea | 285 | 3.1% |
| fair | 279 | 3.1% |
| mountain | 233 | 2.6% |
| ruins | 204 | 2.2% |
| camp | 201 | 2.2% |
| beach | 200 | 2.2% |
| lake | 167 | 1.8% |
| lab | 151 | 1.7% |
| garden | 132 | 1.4% |
| factory | 115 | 1.3% |
| void | 96 | 1.1% |
| graveyard | 89 | 1.0% |
| mine | 59 | 0.6% |
| snow | 59 | 0.6% |
| sky | 53 | 0.6% |
| center | 52 | 0.6% |
| space | 49 | 0.5% |
| desert | 47 | 0.5% |
| underwater | 41 | 0.4% |
| safari | 39 | 0.4% |
| crystal | 37 | 0.4% |
| waterfall | 35 | 0.4% |
| volcano | 33 | 0.4% |
| swamp | 31 | 0.3% |

## Moods

| Mood | Events | Share |
|---|---:|---:|
| calm | 3549 | 38.9% |
| tense | 2815 | 30.8% |
| warm | 770 | 8.4% |
| eerie | 667 | 7.3% |
| festive | 373 | 4.1% |
| grand | 366 | 4.0% |
| sad | 341 | 3.7% |
| mystery | 171 | 1.9% |
| playful | 83 | 0.9% |

## Weather and effects kept from the event data

| Weather | Events | Share |
|---|---:|---:|
| none | 6214 | 68.0% |
| sparkle | 768 | 8.4% |
| glint | 668 | 7.3% |
| fog | 401 | 4.4% |
| rain | 342 | 3.7% |
| fire | 254 | 2.8% |
| flicker | 186 | 2.0% |
| snow | 128 | 1.4% |
| hearts | 98 | 1.1% |
| confetti | 49 | 0.5% |
| net | 27 | 0.3% |

| Subject effect | Events | Share |
|---|---:|---:|
| none | 8648 | 94.7% |
| shake | 232 | 2.5% |
| float | 154 | 1.7% |
| rattle | 56 | 0.6% |
| spin | 45 | 0.5% |

## Shots (how the scene is framed)

| Shot | Events | Share |
|---|---:|---:|
| talk | 2405 | 26.3% |
| clash | 2351 | 25.7% |
| vista | 2273 | 24.9% |
| moment | 1510 | 16.5% |
| deal | 596 | 6.5% |

## Choice icons

| Icon | Choices | Share |
|---|---:|---:|
| talk | 3064 | 14.2% |
| battle | 3053 | 14.2% |
| pick | 2778 | 12.9% |
| leave | 2702 | 12.6% |
| go | 2044 | 9.5% |
| take | 1473 | 6.8% |
| coin | 1412 | 6.6% |
| look | 1210 | 5.6% |
| star | 1021 | 4.7% |
| care | 772 | 3.6% |
| rest | 622 | 2.9% |
| give | 561 | 2.6% |
| trade | 374 | 1.7% |
| dice | 243 | 1.1% |
| train | 118 | 0.5% |
| catch | 66 | 0.3% |

## Known limits

- The hour in this report is the afternoon for every event; in play it follows the run's clock unless the text names an hour.
- The stage type here is the event's own first type, or Normal; in play it is the stage the player is on.
- The Old look keeps its eight event styles as they were. The team screens of Team Magma/Aqua (table, briefing, final) and a department store floor keep their own pages.

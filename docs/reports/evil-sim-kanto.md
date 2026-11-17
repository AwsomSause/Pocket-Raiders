# Evil Mode simulator: Kanto (slice 9)

1000 seeded Kantos per policy (Creed, Line, Doctrine and Patron rotate with the seed). Made by `npm run sim:evil -- 1000` in 25 s. Numbers are starting values; none are playtested. The economy (Rackets, Fronts, upkeep, bankruptcy) is slice 11: until then Funds only grow.

Policies: **persuade** scouts, then always Persuades (Outplay where it can't). **richest** works locals and floors first and Pays the fair price when it can. **mix** alternates, and leaves an Officer behind on the Road. Every battle is lost (the soft-loss path).

## persuade

Finished the region: 1000 of 1000. Days: mean 41.3, 10th–90th 35–48. Actions: mean 369.5. People who left: mean 0.9. Ended with somebody unpaid: 192.

| Stage | Funds (mean) | Funds (10th) | Heat (mean) | Held (mean) | How it ended |
| --- | --- | --- | --- | --- | --- |
| The Arrival | ₽1983.8 | ₽650 | 1.3 | 2.0 | arrival 1000 |
| District 1 | ₽2142.1 | ₽0 | 1.9 | 10.9 | taken 272, held 728 |
| District 2 | ₽4444.3 | ₽524 | 2.2 | 9.8 | held 664, taken 336 |
| District 3 | ₽9414.2 | ₽2360 | 1.0 | 10.5 | held 756, taken 244 |
| District 4 | ₽15301.4 | ₽4777 | 1.5 | 10.5 | held 751, taken 249 |
| District 5 | ₽22888.3 | ₽10534 | 0.1 | 10.8 | held 888, taken 112 |
| District 6 | ₽31290.7 | ₽16502 | 0.8 | 10.7 | taken 218, held 782 |
| The Reckoning | ₽35343.9 | ₽18848 | 2.2 | 4.8 | reckoning 1000 |

## richest

Finished the region: 1000 of 1000. Days: mean 37.1, 10th–90th 32–43. Actions: mean 349.7. People who left: mean 0.0. Ended with somebody unpaid: 8.

| Stage | Funds (mean) | Funds (10th) | Heat (mean) | Held (mean) | How it ended |
| --- | --- | --- | --- | --- | --- |
| The Arrival | ₽1061.6 | ₽155 | 0.0 | 2.0 | arrival 1000 |
| District 1 | ₽3027.9 | ₽1755 | 0.0 | 11.6 | held 913, taken 87 |
| District 2 | ₽4299.6 | ₽2600 | 0.0 | 11.7 | held 971, taken 29 |
| District 3 | ₽4337.7 | ₽2883 | 0.0 | 11.7 | held 998, taken 2 |
| District 4 | ₽6846.6 | ₽3875 | 0.0 | 11.9 | held 988, taken 12 |
| District 5 | ₽7850.0 | ₽3326 | 0.0 | 11.6 | held 998, taken 2 |
| District 6 | ₽10263.3 | ₽4565 | 0.0 | 11.7 | held 984, taken 16 |
| The Reckoning | ₽9157.0 | ₽3572 | 0.0 | 6.3 | reckoning 1000 |

## mix

Finished the region: 1000 of 1000. Days: mean 44.6, 10th–90th 41–48. Actions: mean 388.1. People who left: mean 0.3. Ended with somebody unpaid: 56.

| Stage | Funds (mean) | Funds (10th) | Heat (mean) | Held (mean) | How it ended |
| --- | --- | --- | --- | --- | --- |
| The Arrival | ₽2259.3 | ₽1000 | 0.9 | 1.6 | arrival 1000 |
| District 1 | ₽5353.4 | ₽1100 | 1.5 | 9.5 | held 500, taken 500 |
| District 2 | ₽12869.3 | ₽4300 | 1.7 | 9.4 | held 518, taken 482 |
| District 3 | ₽24981.3 | ₽12845 | 0.9 | 10.5 | held 724, taken 276 |
| District 4 | ₽40277.2 | ₽24345 | 1.6 | 10.0 | held 602, taken 398 |
| District 5 | ₽56992.3 | ₽34803 | 0.4 | 11.1 | taken 150, held 850 |
| District 6 | ₽76703.4 | ₽46300 | 1.4 | 10.0 | taken 397, held 603 |
| The Reckoning | ₽85619.2 | ₽51653 | 2.0 | 3.8 | reckoning 1000 |


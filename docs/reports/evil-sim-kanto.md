# Evil Mode simulator: Kanto (slices 9 and 11)

1000 seeded Kantos per policy (Creed, Line, Doctrine and Patron rotate with the seed). Made by `npm run sim:evil -- 1000` in 34 s. Numbers are starting values; none are playtested. Slice 11 added the economy: each policy also trades (a way out when bankrupt, a Sullen racket made honest, a racket unless it only Persuades, a Front and a Work when there's money to spare).

Policies: **persuade** scouts, then always Persuades (Outplay where it can't). **richest** works locals and floors first and Pays the fair price when it can. **mix** alternates, and leaves an Officer behind on the Road. Every battle is lost (the soft-loss path).

## persuade

Finished the region: 1000 of 1000. Days: mean 42.8, 10th–90th 36–48. Actions: mean 370.2. People who left: mean 0.3. Ended with somebody unpaid: 72.

Economy: rackets started 0.0, Shut 0.0, made honest 0.0; Fronts opened 1.6; Works 1.0; ways out of bankruptcy taken 0.3. Evenings bankrupt: mean 1.9 (runs with any: 420). Lowest Funds after an Evening: mean ₽676.9, 10th ₽0.

| Stage | Funds (mean) | Funds (10th) | Heat (mean) | Held (mean) | How it ended |
| --- | --- | --- | --- | --- | --- |
| The Arrival | ₽1884.6 | ₽650 | 1.3 | 2.0 | arrival 1000 |
| District 1 | ₽2093.2 | ₽153 | 1.7 | 10.7 | taken 299, held 701 |
| District 2 | ₽4179.9 | ₽485 | 2.2 | 10.3 | taken 330, held 670 |
| District 3 | ₽9235.5 | ₽2927 | 0.9 | 10.2 | taken 329, held 671 |
| District 4 | ₽15422.2 | ₽6222 | 1.2 | 9.4 | taken 411, held 589 |
| District 5 | ₽23680.2 | ₽8835 | 0.1 | 9.5 | taken 325, held 675 |
| District 6 | ₽33192.8 | ₽11771 | 0.6 | 8.7 | taken 489, held 511 |
| The Reckoning | ₽37486.3 | ₽11349 | 1.6 | 3.6 | reckoning 1000 |

## richest

Finished the region: 1000 of 1000. Days: mean 39.4, 10th–90th 33–46. Actions: mean 353.9. People who left: mean 0.0. Ended with somebody unpaid: 0.

Economy: rackets started 0.5, Shut 0.0, made honest 0.1; Fronts opened 1.9; Works 0.7; ways out of bankruptcy taken 0.1. Evenings bankrupt: mean 0.7 (runs with any: 328). Lowest Funds after an Evening: mean ₽520.1, 10th ₽0.

| Stage | Funds (mean) | Funds (10th) | Heat (mean) | Held (mean) | How it ended |
| --- | --- | --- | --- | --- | --- |
| The Arrival | ₽1104.3 | ₽200 | 0.0 | 2.0 | arrival 1000 |
| District 1 | ₽4047.5 | ₽1900 | 0.1 | 11.6 | held 929, taken 71 |
| District 2 | ₽4745.1 | ₽2652 | 0.0 | 11.6 | held 949, taken 51 |
| District 3 | ₽5429.6 | ₽2928 | 0.0 | 11.2 | held 917, taken 83 |
| District 4 | ₽8903.5 | ₽4010 | 0.0 | 11.1 | held 869, taken 131 |
| District 5 | ₽12357.4 | ₽3395 | 0.0 | 10.2 | taken 212, held 788 |
| District 6 | ₽18050.1 | ₽4637 | 0.0 | 9.6 | taken 358, held 642 |
| The Reckoning | ₽19221.2 | ₽3669 | 0.0 | 4.0 | reckoning 1000 |

## mix

Finished the region: 1000 of 1000. Days: mean 47.2, 10th–90th 44–49. Actions: mean 363.3. People who left: mean 0.0. Ended with somebody unpaid: 13.

Economy: rackets started 0.7, Shut 0.0, made honest 0.3; Fronts opened 2.6; Works 3.8; ways out of bankruptcy taken 0.1. Evenings bankrupt: mean 0.4 (runs with any: 159). Lowest Funds after an Evening: mean ₽1256.7, 10th ₽0.

| Stage | Funds (mean) | Funds (10th) | Heat (mean) | Held (mean) | How it ended |
| --- | --- | --- | --- | --- | --- |
| The Arrival | ₽2150.2 | ₽1000 | 0.9 | 1.6 | arrival 1000 |
| District 1 | ₽6678.1 | ₽2400 | 1.7 | 8.5 | taken 611, held 389 |
| District 2 | ₽12587.0 | ₽5745 | 1.2 | 6.3 | taken 752, held 248 |
| District 3 | ₽23564.4 | ₽7180 | 0.5 | 5.4 | taken 750, held 250 |
| District 4 | ₽37307.8 | ₽7300 | 0.6 | 4.7 | taken 825, held 175 |
| District 5 | ₽53743.4 | ₽7639 | 0.1 | 5.0 | taken 768, held 232 |
| District 6 | ₽72485.2 | ₽7774 | 0.4 | 4.4 | taken 876, held 124 |
| The Reckoning | ₽79901.9 | ₽7300 | 0.8 | 1.5 | reckoning 1000 |


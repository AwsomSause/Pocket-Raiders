# Evil Mode economy: the simulator read against Part 5's model (slice 11)

Build plan Part 31, slice 11: "The simulator's table's read against Part 5's model, and the differences are written down."
The simulator's table is `docs/reports/evil-sim-kanto.md` (`npm run sim:evil -- 1000 docs/reports/evil-sim-kanto.md`,
1,000 Kantos per policy). The model is Part 5 section 3.5, "Second pass: with the fixes"
(`/mnt/project-files/plans/evil-mode/05_THE_NUMBERS.md`). Neither is a playtest.

## Side by side: Funds at the region's end

| | Part 5 model (second pass) | Simulator, slice 11 |
| --- | --- | --- |
| Where most styles end | ₽12,000 to ₽26,000 (five of six styles) | persuade ₽37,486 · richest ₽19,221 · mix ₽79,902 |
| Days below ₽0 | 0 for four styles; 7 (Profit, Pay); 8 (Power, loud) | Evenings bankrupt, mean: persuade 1.9 · richest 0.7 · mix 0.4 (runs with any: 420 · 328 · 159 of 1,000) |
| Lowest point | −₽1,737 to −₽7,045 for the styles that dip | ₽0 (Funds stop at ₽0 in this build; a short Evening counts a bankrupt day instead) |
| Rackets | The Grey racketeer runs one racket and one Front; richest by a little | Rackets started per run: 0.0 · 0.5 · 0.7. None reached Shut in 3,000 runs |
| Raids | 0 to 8 | None (the Raid is slice 10) |

## The differences, and why

| # | Difference | Why | What to do |
| --- | --- | --- | --- |
| 1 | **The `mix` policy ends four times richer than the model** (₽80k against ₽12–26k) | Not slice 11: slice 9's table already had it at ₽85,619. `mix` leaves an Officer in every district, and a district with an Officer pays its full takings for the rest of the region. The model allowed one Officer per eight on the Roster | Slice 10's Raid and the Scheme's prices (slice 14) are the sinks the model counts on. Re-read after both |
| 2 | **`persuade` ends richer than the model's Clean styles** (₽37k against ₽16–24k) | The model stops at thirteen holdings a district and has no Fronts paying on after a district's left. Here Fronts pay every Evening wherever they are, and `persuade` opens about 1.6 | Left alone for now: the Fronts' figures are the design's own (Part 13 section 1.2). Watch it once rooms have upkeep |
| 3 | **Rackets are rare and never Shut in the simulator** | A racket needs a Grey-or-darker Line (a third of the runs), not Belonging, a held street that isn't Warm, and a free squad after the day's jobs. It ends with its district ("nobody's there to collect"), and the policy makes it honest once its street is Sullen. So no street ran out of patience. Shutting is covered by the unit tests, not the simulator | A racket-first policy belongs in the simulator when the Scheme gives rackets a reason to run longer (slice 14) |
| 4 | **Bankruptcy is short and early** | Most bankrupt Evenings are in the Arrival and District 1, when a Front or a Work is bought with the float. Wages are halved in the model's Arrival; here the Arrival pays full wages (Part 5 section 2.2's "In an Arrival, wages are half" isn't built) | Build the half wages in an Arrival with the next numbers pass |
| 5 | **Funds never go below ₽0** | The block keeps Funds at ₽0 or more (its save shape since slice 1). A day that can't be paid counts as a bankrupt day (Short, Broke, Bust) and the shortfall is written on the Ledger | Kept: the three stages read the count, not a negative number |
| 6 | **No Heat costs money** | Bribes and the Raid (half the Funds) aren't built; the model's Power style is in debt because of eight Raids | Re-run after slice 10 |
| 7 | **Upkeep is only Feed the District** | Rooms are slice 10. `econEvening`'s upkeep line is where a room's ₽100/₽200/₽300 a day goes when the base lands | Slice 10 adds its rooms to the same line |

**Nothing here changed a number.** Every figure on a Card is the design's (Part 12 section 2.3, Part 13 sections 1.2 and 2.2,
Part 5 section 2.4). The differences above are what to try first when someone plays it.

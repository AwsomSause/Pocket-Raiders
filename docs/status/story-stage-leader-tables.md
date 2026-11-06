# Story stage and leader tables (design rewrite)

Date: 2026-11-06. Docs only, no code, no save change.

- Rewrote the stage, region map, Act, Stop and badge-gate tables in `plans/Story_Overhaul_Design_v2.md` (Parts IV-D, V-B, theme Stop map, knobs) and two lines in the Implementation Plan, per Appendix S.2 and S.3.
- New shape: 3 regions x 8 gym towns x 2 leaders, 6 of 8 badges required (18), 24 max. 26 map stages (24 gym + Elite Four + Champion). 44 Stops kept. Crossing stage removed; Region Gate scene ends each region.
- 9 authored towns (18 leaders) keep their order; 15 towns take 2 pool leaders each (30 slots).
- Evil beats now `beatEvery 4`, `firstStage 2` (stages 2, 6, 10, 14, 18, 22; beat 7 at stage 25). Needs a `core/evil` check.
- The repo holds no copy of the design doc or leader table data (only F0 schemas), so nothing in `src/` changed.
- Open: names of the 15 pool towns; "pass up to 2 towns per region" is my reading of S.2/S.3; theme cards still cite old Stop numbers.

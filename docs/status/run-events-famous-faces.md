# Run events I: Famous faces, rivals and cameos (R436-R470)

27 new map events in `src/data/eventsFaces.json` (group "Famous Faces"), merged into `events` in `src/data/index.ts`. Tests: content gate (`report:check`), `run.test.ts`. No new assets, no save change.

Already existed, skipped: R436 photo (living-rival-photo-*), R438 montage, R442 quiz (quiz-master), R458 photographer (photo-contest), R461 rival duo (rival-feud), R462 bad day, R463 old friend (ng-plus-old-friends), R468 ghost reunion.

Limits (use the nearest existing effect, no new mechanic):
- R437 rival gift sets flag `rival-gift`; the rival's next fight does not use it yet.
- R438/R452 doctor "reveal hidden stats" = cure, heal and Research + a Chronicle line.
- R448 ranger escort = `wandererFriend` for 2 stages (not exactly 2 nodes).
- R455 whistle: event has a countdown; "time pressure on next fight" not built.
- R456/R454/R459 buffs are run-long relics (crit, price) not next-fight only.
- R466 badge collector shows the next gym's team; no hidden badge unlock.
- R457 mascot: Express (skip a column); no battle ban.

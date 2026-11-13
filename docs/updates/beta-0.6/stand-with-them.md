# Stand With Them (E8)

## Player gets
- A recruiter ("A Job Offer") can offer you a place on the team working in your run's world. Join and you get that team's code name (Kanto Rocket: Provisional Agent 000, "House Card"; all 11 code names are in `src/data/standWith.json`), the uniform, and reputation +30. Teams without a code name (for example Team Yell) never offer it.
- A reputation ladder: +30 Recognized, +45 Respected, +60 Trusted, +70 Allied. Each rung gives access and information only (shop, runner, the real plan, a borrowed tool, the Throne), never statistics. Your standing shows in the team's Evil Team summary ("People keep talking...").
- Reputation moves from a data table (Loyalty Jobs, missions, refusing an order, defectors, shadows...). Refusing an order never drops you below the band you hold. A small mercy counts even if noticed (-2).
- "A Small Job for the Team" event: run the errand (+8), refuse (-4, floor at your band), or do a small mercy.
- [Stand with them] is hidden if you never joined, locked with the reason below +45, after Turn, or after betraying the team.
- Verdicts: Rise, Take the Throne (+70, and not after the Apex was let go) and Turn (always open, remembered for the rest of the run). Each writes the Apex ledger (`taken` or `freed`).
- Two shots: the first lost Stand-with climax retries, the second gives the worst ending (`allied-defeat` in the ledger) and the run goes on.
- A rival handed over to the team is freed when the run ends (never held in the Region of Doom). Handing one over also impounds 1 to 3 bench Pokémon through the Rival Rescue code (`impoundFor`), so the rival's offer to get them back can open.

## Save
- No version bump. New optional `run.expansion.standWith` (team, region, reputation, mercies, betrayed, losses, verdict, turned, apex ledger, handed-over rival, ledger). Old runs load as before.

## Limits
- The Stand-with climax itself (phases 0-6, Loyalty Job raids, Duty Roster, Audit, the Apex-from-inside fights) comes with the Extended Cut work (workstream 16); this PR is the route's rules, state, events and ledger. `standWithStatus`, `verdictsOpen`, `resolveVerdict`, `lostStandWithClimax` and `officersSide` in `src/core/arc/standWithExtended.ts` are what it will call. Nothing in play reaches the verdict yet, so Rise, Throne and Turn are tested but not reachable.
- Only reputation rows that events or raids can trigger are applied by play today: join, team mission, refuse, mercy. The rest of the table is data that the Loyalty Job and raid slices call by name.
- Rocket Returns and Macro Cosmos have code names but no team in `evilTeams.json`, so they cannot be joined yet. The Throne's first three orders, the runner's ending, and Allied-Occupied regions are not built.
- Impound takes bench Pokémon (never your last two) and gives nothing if the party is too small; the rival-handed-over flag is set either way.

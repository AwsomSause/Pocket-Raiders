# Rival presentation wiring (follow-up to the rival presentation PR)

## Player gets
- A registered rival now says its bank lines when a battle starts: one Pokémon line about your lead Pokémon (nickname if its Friendship is 5+), the pity advice line when pity is active, and a Gym / Elite Four / Champion line. No line repeats until its set is used up.
- Counter-picks follow the pack's limits: none on the first fight, one mid-region, never above the old cap, never beyond what the rival has seen.
- Every rival fight counts as a meeting (shown in the Rival Report).

## Save
- No version bump. Uses the optional `bankUsed` and `presence` fields from the presentation PR.

## Limits
- Still not scheduled in live stages: the third meeting, Pseudo Stage forms (Race / Team-Up / Already There / Ambush), the catch step-in roll, and the Friend's four scenes and postcards. Their rules are in `presence.ts` and `friend.ts` and tested; they need the story2 world-scene hook.
- The won/lost reaction line exists (`rivalResultLine`) but no scene shows it yet.

## Added in the scheduling slice
- **Friend scenes** play in regions that have the Friend (about half): one of Meet, Mid, Errand, Eve at every second stage start, with a line in their voice; a postcard arrives at the start of the next region. The Friend registers in the friend slot the first time (needs the main rival).
- **Pseudo Stage beats**: entering a Pseudo Stage, the main rival (65%) or the Friend (30% of the rest) may appear as Race / Team-Up / Already There / Ambush (never under 50% party HP). Text and feelings only.
- **Catch step-in** for a registered rival is now 3%, once per region (was the old per-stage 20% for rivals without overhaul records). Planning stays pure; the region is marked when the step-in actually happens.

Limits: Race, Team-Up and Ambush are text only (no first-pick reward, partner or forced fight yet). The Friend's optional spar and extra Assist are not offered in a live fight yet (`friendAssist` is ready). The third guaranteed meeting is counted but not placed on a stage map.

## Added in the mechanics slice
- **Race**: whoever reaches the end first takes the first pick. The rival wins 35% of the time, +5% per Lead point it has. If you win, you get one extra of the stage's reward item; if it wins, only feelings change.
- **Team-Up** (main rival): it joins your next eligible fight as a step-in Assist (not in doubles). **Ambush** (main rival): it challenges you at the next fight (the existing duel step-in). Both clear after one use. Neither happens at under 50% party HP (Ambush) and neither applies to the Friend.
- **Friend finale Assist**: in the final-boss fight the Friend adds at most 1 strike to the rival Assist (total capped at 4 Standard), or stands in alone with 1 strike and a partner (Eevee, Pikachu...) when no other rival can assist. Level is 6 under the boss.

- **Friend spar** ("A Friendly Spar", event `friend-spar`): once your Friend exists, an optional event offers a 3-Pokémon match using the Friend's own team (by personality), at 2 levels under you. It uses the Pseudo Stage fight rules: a loss heals you partway and the run goes on, there is no money or item prize, and nothing changes Lead or pity. New event condition `friendHere`.

Limits: the Friend's spar team is a generic Ace Trainer team (the Friend has no fixed team yet) and is named "Your Friend". Extended-mode cap (6) is not read here; Standard is used.

## Added: the Friend's real team and Extended cap
- The Friend's team follows their personality (pack archetypes hotshot, prodigy, friendly, bitter, scholar, heir, lone wolf, mirror; three base Pokémon each, `src/data/friendTeams.json`). The spar fights with it, and the finale partner is its first Pokémon.
- Meet and Mid scenes use the pack's own lines (`src/data/friendLines.json`, from second_rival.json).
- The Assist cap is 4 Standard, 6 Extended. The run reads `run.expansion.cut.climaxCut === 'extended'`; the Extended Cut workstream must set that at run start (nothing sets it yet, so runs are Standard today).
- New fight field `friend: true` for event trainer fights.

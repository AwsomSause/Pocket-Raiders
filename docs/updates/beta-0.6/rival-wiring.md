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

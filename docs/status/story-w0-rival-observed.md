# W0: Rival observed-information fix

A rival now counters only what it has watched you use. `usedTypes()` no longer reads your live party.

- `rival.seen` (optional, max 40, newest last): `{ signal: 'moveType', value, source: 'fought', at, uses }`. No save bump (optional field).
- The battle counts your damaging moves in `battle.playerMovesSeen`; when a rival battle ends, `recordSeenMoves` (story/hooks.ts) writes them to `rival.seen` by attack type.
- `usedTypes` / `mostUsedType` take the rival. A rival with no fights yet counters nothing. Rival world "grudge" type and path facts (`pathContext`) use the same list.
- Limit: only `fought` is recorded. `witnessed` and `public` sources (exhibitions, headlines) come with W2/W4.
- Tests: `tests/unit/rivals.test.ts` (never counters an unseen move; counters watched types in order; a real battle records `seen`).

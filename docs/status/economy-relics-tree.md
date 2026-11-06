# Relics Tree (S373)

Seven run events in `src/data/events/relicsTree.json` (group Relics). The Relic Tree (stage 3+) offers three branches, Ember, Tide or Leaf; you can take only one branch per run. The same branch can later offer a Bough (stage 5+) and a Crown (stage 7+). Each tier is a relic (rule modifier, same system as the Relic Shrine) that stacks on the last, and some carry a cost. Progress is kept in story flags (`ev:tree-<branch>`, `ev:tree-branch`), so there is no save change. Test: `tests/unit/relicsTree.test.ts`.
Not done: a custom tree picture, and mixing branches (by design only one).

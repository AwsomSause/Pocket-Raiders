// Example module for the Catalog Overhaul Pack rebuild (files starting with "_" are not built).
// Copy to tools/events/co/<category>-<n>.ts, then: npm run co:build -- <category>-<n>
import { ch, flag, flagIs, item, leave, out, type Json } from '../dsl.ts';

export const CATEGORY = 'singles';

// `berry-tree` was an old event, so name, group, stop, types and scene are copied from where it sat (oldPlacement.json).
// A brand new event needs the full ev(id, name, group, opts, intro, choices) from dsl.ts.
export const EVENTS: Json[] = [
  {
    id: 'berry-tree',
    intro: 'A lone Berry tree, heavy with fruit.',
    choices: [
      ch('Strip it.', out('You take everything the branches will give.', item('oran-berry', 4))),
      ch('Take a few, leave the rest.', out('You take two and leave the rest for whoever comes next.', item('oran-berry', 2), flag('berrytree-left'))),
    ],
    // Up to 3 variants; the first whose `when` holds applies (docs/status/choice-memory.md).
    remembers: [{ when: [flagIs('berrytree-left')], notice: 'You left fruit on a tree like this one.', addChoices: [ch('Walk on.', leave())] }],
  },
];

// Old ids this module retires (MERGE, SCRAP, RULE): never drawn again, still loadable by saved runs.
export const REMOVE: string[] = [];

# Auto-discovered run events

Put new event data in `src/data/events/<name>.json` as `{ "events": [ ... ] }`
(same shape as `eventsW5.json`). It is loaded automatically by `src/data/index.ts`;
do not add an import or a registry line. This keeps event PRs from conflicting.

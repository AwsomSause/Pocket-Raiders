# Story S14: News, lore and chronicle text

- `src/data/story/news.json`: 40 news templates over three outlets (Meridian Courier, Reaches Herald, The Wire), each with category, act condition, declared tokens and per-outlet text keys. Texts in `text/en.json` as `news.<id>.<outlet>`.
- Chronicle templates: `chron.*` text keys (opener "In this telling,", title, header, cast, timeline, decisions, quests, legends, team, moments, "what might have been", 8 highlight tags).
- Field Notes: 6 new lore entries (`lore_fn_*`, category 9, source Professor Vance).
- `src/core/story2/templates.ts`: `TEMPLATE_TOKENS`, `tokensIn`, `renderTemplate` (a missing value leaves the token visible).
- New gate `story-template-tokens` (20 story gates now): unknown tokens in any story text, or a news template using an undeclared token.
- Not built: the News tab / newspaper props that show these, the fact-ledger picker, and the 6-Node foreshadow payoff rule (needs the Director). Only 40 of the planned ~120 templates.
- Tests: `tests/unit/storyTemplates.test.ts`, `storyGates.test.ts` updated.

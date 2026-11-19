- **DOMINION slice D18, "Rotom key + client"** (Claude AI slices, 2026-11-18; build plan `/mnt/project-files/plans/evil-mode-rework/BUILD_SLICES.md` D18 row, design `/mnt/project-files/plans/claude-api/CLAUDE_API_DRAFT.md` §0, §1, §8, §9, §11; mockups a1 + a2 at https://claude.ai/artifact/LEFrzZyJrVo7kyA3Rk59hg). Players see **"Rotom"**, never "Claude" or "AI" (Kice 2026-11-18 4:57 PM PT); code names stay `claude*`/`ai*`.

## What the player can do
- **Settings > Rotom** (New look: mockup a1; Old look: a row list; also a Settings home row and a tab after the categories): the tier (Off / Light / **Standard, default** / Rich) as four tiles with a rough cost per Dominion run, the Key-Card in use with "Rotom used $x of $10" as a big number and meter, "≈ N more runs", Change card / Forget key, and six "Use Rotom for" switches (Battle choices: Rivals only; Rival teams, Battle quips, Typed arguments, Crew chatter: on; Ledger news: off). A box counter shows the 9 presses.
- **The hidden Key-Card vault** (mockup a2): on any Settings page press 9 eight times in a row (or Change card). Five cards: Diamond, Pearl, Platinum, Ruby, Sapphire, each with its Legendary and orb. Pick with ← → or a click, paste the key, Test & seal: the `sk-ant-` shape tick, then one tiny Haiku call. A card whose key used $10 is stamped USED UP. Remember on this device is opt-in.
- Without a Key-Card (or at Off) nothing is sent anywhere and the game is the same as before.

## How it works
- `src/core/ai/` (pure): `schema.ts` (tiers, uses, data file shape, the `run.ai` log), `rules.ts` (tier and model per role, cost from usage and list prices, the $10 line, key shape, `wrapPlayerText`, log read/write with a size budget). Data `src/data/ai/claude.json` (models, prices, roles, timeouts, token caps, log budget, cards, tier tiles). Never a key.
- `src/ai/`: `keyStore.ts` (sessionStorage by default, localStorage with Remember, one copy only; spend per key under a SHA-256 hash; card -> hash map so cards show their spend; Forget keeps the spend), `client.ts` (the official `@anthropic-ai/sdk` 1.10.0, imported only on the first call (own 380 KB chunk), `dangerouslyAllowBrowser`, timeout by AbortController, no retries; structured output via `zodOutputFormat`; both system blocks cached; plus `fakeTransport` with no network), `ask.ts` (`askClaude`: stored answer first, then key/tier/use/spend checks, a `wait` mark, the call, Zod check with one repair try, refusal/timeout/failure/invalid/too-big store `off`; `testKey`), `runtime.ts` (`?aifake=1` uses the fake). `GameSession.aiEnv()` hands a slice the setting, the uses, `run.ai` and a save.
- Screens: `src/ui/redux/screens/dominion/claudeViews.ts` (a1, a2), `claude.css` (the Claude mockups' extra rules, ported by `tools/dominion/port-mockup-css.py`), `src/ui/keyVault.ts` (the vault: own layer in the Old look; a window capture listener keeps every key press in the vault). Art: 16 new files in `public/assets/images/dominion/` (PROVENANCE.md).
- `index.html` CSP: `connect-src 'self' data: blob: https://api.anthropic.com; script-src 'self' 'unsafe-eval'` (eval kept so Zod's fast path doesn't log CSP errors).

## For later slices (D19-D25)
Call `askClaude({ id, role: 'line' | 'judge' | 'big', use?, system, context?, input, schema?, offline }, session.aiEnv()!)`. Ids must be stable for the moment (a reload asks the same id and gets the stored answer). Wrap typed text with `wrapPlayerText`. Decide results with your own rules and streams; the answer only voices or picks from your list. With no key nothing is stored (offline is rebuilt from the run).

## Saves
Run **v47** (`run.ai`, optional). v46 is held for the evolution scene on `ui-mockups` (identity here). Migration tests load v45 and v46 runs; a damaged log entry is refused. Settings stay v45 (new keys have defaults). The key and spend never enter a save record.

## Tests
`tests/unit/dominionClaude.test.ts` (32): data, tiers, models, cost, $10 boundary, key shape (admin key refused), typed-text wrapping, log budget, key store (session/remember/forget/hash/cards/blocked storage), askClaude (no key, tier, use off, stored replay, request shape and caching blocks, repair then offline, refusal/timeout/auth/empty, reload `wait`, one call for two asks, spend to used up, stale stored answer), testKey, run v45/v46/v47 saves, no "Claude"/"AI" in player text. Browser `tests/e2e/dominionClaudeKey.spec.ts` (3): vault in the Old look (8 presses in a row, shape fail, keys don't leak to Settings, seal, storage, USED UP stamp, Remember, refused key), Settings > Rotom in the New look (tiers, uses, counter, seal, Forget), phone size.

## Limits
- Nothing calls `askClaude` yet: D19-D25 add the calls. The "Use Rotom for" switches are stored now; each later slice reads its own (battle choices and rival teams are campaign features from the draft, not yet a slice).
- No streaming yet (D20 adds it for the Debate). No server-side fallback model: a refusal plays offline, as the draft says.
- The spend counter is a friendly display per device; the real limit is the key's Anthropic Console workspace limit.
- Every AwsomSause Pages project shares the origin, so keep them free of outside scripts (draft §8).

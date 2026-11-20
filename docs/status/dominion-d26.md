# Dominion D26: round-4 polish + re-key

Plan: BUILD_SLICES.md row D26. Mockups: `plans/evil-mode-rework/mockups-v4/` (README, intervals 2, 3 and 5 for old screens).

## What changed
- `dominion.css` re-generated with `python3 tools/dominion/port-mockup-css.py plans/evil-mode-rework/mockups-v4/index.html src/ui/redux/screens/dominion/dominion.css` (tool unchanged). Every v4 rule is in: the Nova livery (lacquer top bar and tabs, crimson seams, Nova eye on titles, blood-gold buttons, red lock-on ring) restyles D1-D6, D18, D19 screens through the classes they already use (`.top`, `.tabs`, `.pnl`, `.hd`, `.ttl`, `.cta`, `.ch`, `.tile`, `.kcard`). The classes for D27-D30 pages (`.blade`, `.wheel`, `.shut`, `.order`, `.paper`, `.tv`...) are ready for those slices.
- `stage()` (views.ts) ends every screen with the Nova sigil `.sig4` and the crimson underlight `.vl4` (both `pointer-events:none`, `aria-hidden`). Sigil side as in the mockup: centre on the title card (s0), left on Rotom Settings (k1), right elsewhere.
- Keys: every Dominion key strip starts with `Q Wheel` (`WHEEL_KEY`): Card (s4), Crew File (s5), Ledger (s7), Hero file (s9, D11), the applications desk (k5, D21; its own sigil layers removed, stage() draws them), the police interview and release pages (k8, k9, D24; `police.css` deleted, its own sigil layers removed), the Evening voices page (k10, D25), Reserve (s11), Pyramid (s12), personality card (k3). No Dominion page reads Q (the D4 Reserve already used W/E, the D19 card already paged on the arrows; the Crew File pages on ◀ ▶). C, G, H, R, P, T, B, M keep their Crew File jobs. **End** saves and quits to the title from any Dominion page (DominionScene raw handler, before any screen reads keys), except the Hero interrupt (D11), whose three choices must be answered first, and while the desk's Type box (D21) is open.
- No rule, data or save changes; no block bump.

## Tests
- `tests/unit/dominionPolish.test.ts`: stage markup, sigil sides, the CSS is the v4 port (Nova vars, v4 classes, `dm-` keyframes, looping effects under reduced-motion no-preference), the wheel key.
- `tests/e2e/dominionPolish.spec.ts`: sigil and underlight on title and HQ, `--blood` var live, Q does nothing on HQ and Crew File, arrows page the Crew File, Q chip on the card, three window sizes, End to the title and Continue gives back the same block.

## Known limits
- Q only shows the chip: the hold-Q wheel itself is D28. Until then a Q press does nothing (on purpose; nothing else may take Q).
- Esc on the HQ still saves and quits (D27 turns it into the Boss Menu).
- Rotom Settings (k1) and the Key-Card vault (k2) live in the game's Settings, not in Dominion, so they get the livery but no Q chip; v4's two extra categories on k1 (Dominion, Effects & motion) come with D27's Settings tabs (adding them now would be rows that lead nowhere).
- D7's Founding pages (key O) and D25's voices page (key V) take the livery through stage(); the Founding pages have no key strip, so no Q chip.
- Settings > motion: the game's Calm setting (`.rx.calm`) stops every animation, and OS reduced motion stops the v4 loops.

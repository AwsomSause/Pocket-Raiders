# Rival Notebook

New "Rivals" button on the map (shown once a rival has been met) opens a Notebook: one page per rival with its fights, the attack types it has watched you use, moves it studied, counters it trained and other changes (`core/rivals/notebook.ts`, `openRivalNotebook` in `ui/fieldMenus.ts`). Read-only; it shows only what the rival recorded (`rival.seen`, `studied`, `counters`, `adaptations`), never your live party. No save change.

Limits: this run only (rival memory is not kept between runs); no hub entry; list rows show the first two lines, the full text is the row hint. Tests: `tests/unit/rivalNotebook.test.ts`.

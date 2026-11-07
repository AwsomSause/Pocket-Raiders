# Per-slice status notes

One file per finished slice: `docs/status/<slice-name>.md`, a single bullet like the ones in STATUS.md "Done". Never edit the same file as another thread, so PRs don't conflict.

Do NOT add a line to `INDEX.md` any more (it is frozen; every PR editing it caused a merge conflict). Make the note's first line a one-sentence summary instead, and find notes with `npm run status:find -- word` (searches INDEX.md-era notes and new ones). Same idea for assets: add rows in `docs/quality/provenance/<slice>.md`, not in `asset-provenance.md`.

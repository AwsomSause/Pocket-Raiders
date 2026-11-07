# Provenance fragments

Add the rows for your PR's assets in your own file here (`docs/quality/provenance/<your-slice>.md`), in the same table format as `../asset-provenance.md` (a line starting with `| \`path\` |`, or a `## heading` and a paragraph). Do not edit `asset-provenance.md` itself: two PRs adding rows to one table is what caused a merge conflict on nearly every PR. `npm run report:assets`, the in-game Asset sources page and the provenance dashboard read the main file plus every fragment.

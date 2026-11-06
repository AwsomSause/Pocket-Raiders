// Asset Provenance Dashboard (idea S334): reads the provenance table (docs/quality/asset-provenance.md) and counts
// rows per source pack, with the credits each pack asks for. Pure: the markdown text is passed in.

export interface SourceRow { source: string; credits: string; files: number; usedBy: string[] }

/** Table rows look like `| \`path\` | Source pack | Original path | Credits | Used by | Added |`. "same" repeats the row above. */
export function provenanceSources(markdown: string): SourceRow[] {
  const by = new Map<string, SourceRow>();
  let lastSource = '';
  let lastCredits = '';
  for (const line of markdown.split('\n')) {
    if (!/^\| `/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 5) continue;
    const source = cells[1] === 'same' ? lastSource : cells[1]!;
    const credits = cells[3] === 'same' ? lastCredits : cells[3]!;
    lastSource = source;
    lastCredits = credits;
    const row = by.get(source) ?? { source, credits, files: 0, usedBy: [] };
    // A brace group such as `{a,b,c}` stands for several files.
    const group = cells[0]!.match(/\{([^{}]*)\}/);
    row.files += group ? group[1]!.split(',').length : 1;
    const used = cells[4]!;
    if (used && !row.usedBy.includes(used) && row.usedBy.length < 3) row.usedBy.push(used);
    by.set(source, row);
  }
  return [...by.values()].sort((a, b) => b.files - a.files || a.source.localeCompare(b.source));
}

export function provenanceLines(rows: SourceRow[]): string[] {
  if (!rows.length) return ['No provenance rows found.'];
  return [`${rows.reduce((n, r) => n + r.files, 0)} files from ${rows.length} sources.`, ...rows.map((r) => `${r.source}: ${r.files} files. Credits: ${r.credits}`)];
}

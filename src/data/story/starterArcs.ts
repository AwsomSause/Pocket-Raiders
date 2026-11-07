// Story Run Starter arcs: one short arc per Remembrance line (`arc_rm_<line>`, Design v2 "Pokémon Story" and Part II-D).
// starterArcs.json only lists the lines (tools/story/build-starter-arcs.mjs); this file expands each into three events
// and an arc, so events.json stays small. The text is in text/starterArcs.en.json.
//  1. Act 2+: what the partner struggles with.   2. Act 3+: the turning point (stand beside it, or trust it alone).
//  3. Act 4+: its own answer. Finishing the arc is what Signature II waits for (core/story2/signature.ts).
// Each event plays only when the run's starter is that line (condition `starterLine`). Pure.

type Json = Record<string, unknown>;

export function starterArcContent(lines: readonly string[]): { events: Json[]; arcs: Json[] } {
  const events: Json[] = [];
  const arcs: Json[] = [];
  for (const line of lines) {
    const arc = `arc_rm_${line}`;
    const ev = (n: number) => `ev_sa_${line}_${n}`;
    const base = (n: number, extra: string[]) => ({
      id: ev(n), v: 1, tags: ['arc', arc, 'starter_arc', ...extra],
      requires: [{ kind: 'starter_line', op: '==', value: `rm_${line}` }], roles: {},
      beats: [1, 2].map((b) => ({ id: `${ev(n)}_b${b}`, kind: 'narration', textKey: `sa.${line}.${n}.b${b}` })),
      choices: [] as Json[], outputs: [] as Json[], variants: [], cost: 1, tier: 'B',
    });
    events.push({ ...base(1, []), moment: 'minor' });
    events.push({
      ...base(2, ['act3']), moment: 'minor',
      choices: [
        { id: 'together', textKey: 'sa.choice.together', effects: [{ id: `${ev(2)}_together`, kind: 'set_flag', key: `sa_${line}`, value: 'together' }] },
        { id: 'trust', textKey: 'sa.choice.trust', effects: [{ id: `${ev(2)}_trust`, kind: 'set_flag', key: `sa_${line}`, value: 'trusted' }] },
      ],
    });
    events.push({ ...base(3, ['act4']), moment: 'major', outputs: [{ id: `${ev(3)}_mem`, kind: 'add_memory', memory: `sa_${line}` }] });
    arcs.push({ id: arc, v: 1, steps: [1, 2, 3].map((n) => ({ event: ev(n) })), nodeCost: 3, branches: [], effects: [], exits: [`sa_${line}_done`] });
  }
  return { events, arcs };
}

/** Adds the expanded Starter arcs to raw story files (`starterArcs` holds `{ lines }`); a no-op without them. */
export function withStarterArcs(raw: Record<string, unknown>): Record<string, unknown> {
  const sa = raw.starterArcs as { lines?: string[] } | undefined;
  if (!sa?.lines) return raw;
  const { events, arcs } = starterArcContent(sa.lines);
  const { starterArcs: _drop, ...rest } = raw;
  return { ...rest, events: [...(raw.events as Json[]), ...events], arcs: [...(raw.arcs as Json[]), ...arcs] };
}

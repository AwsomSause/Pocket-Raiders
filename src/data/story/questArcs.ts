// Quest arcs that unlock Rare and Exceptional Remembrance lines (Design v2 Part II "Rarity categories" and the roster's unlock
// routes: rescue the stranded Dragonair, hatch the lucky egg, keep the lantern vigil...). questArcs.json lists each arc's lines and
// the Act of each scene (tools/story/build-quest-arcs.mjs); this file expands them into events (`ev_qa_<arc>_<n>`) and arcs
// (`arc_qa_<arc>`). The last scene unlocks its lines for the profile (`unlock` effect, folded at the run's end). Text is in
// text/questArcs.en.json. Any backstory can meet them (core/story2/module.ts picks them at free Stops). Pure.

type Json = Record<string, unknown>;
export interface QuestArcRow { id: string; unlocks: string[]; acts: number[] }

export function questArcContent(rows: readonly QuestArcRow[]): { events: Json[]; arcs: Json[] } {
  const events: Json[] = [];
  const arcs: Json[] = [];
  for (const q of rows) {
    const ev = (n: number) => `ev_qa_${q.id}_${n}`;
    q.acts.forEach((act, i) => {
      const n = i + 1;
      const last = n === q.acts.length;
      events.push({
        id: ev(n), v: 1, tags: ['arc', `arc_qa_${q.id}`, 'quest_arc', `act${act}`], requires: [], roles: {},
        beats: [1, 2].map((b) => ({ id: `${ev(n)}_b${b}`, kind: 'narration', textKey: `qa.${q.id}.${n}.b${b}` })),
        choices: [], outputs: last ? q.unlocks.map((u, k) => ({ id: `${ev(n)}_unlock_${k + 1}`, kind: 'unlock', what: 'remembrance', target: u })) : [],
        variants: [], cost: 1, tier: 'B', moment: last ? 'major' : 'minor',
      });
    });
    arcs.push({ id: `arc_qa_${q.id}`, v: 1, steps: q.acts.map((_, i) => ({ event: ev(i + 1) })), nodeCost: q.acts.length, branches: [], effects: [], exits: [`qa_${q.id}_done`] });
  }
  return { events, arcs };
}

/** Adds the expanded quest arcs to raw story files (`questArcs` holds `{ arcs }`); a no-op without them. */
export function withQuestArcs(raw: Record<string, unknown>): Record<string, unknown> {
  const qa = raw.questArcs as { arcs?: QuestArcRow[] } | undefined;
  if (!qa?.arcs) return raw;
  const { events, arcs } = questArcContent(qa.arcs);
  const { questArcs: _drop, ...rest } = raw;
  return { ...rest, events: [...(raw.events as Json[]), ...events], arcs: [...(raw.arcs as Json[]), ...arcs] };
}

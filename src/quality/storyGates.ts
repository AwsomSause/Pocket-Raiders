// Story Overhaul v2: the named content gates over src/data/story/*.json. Each returns the offending records, so
// `npm run report:check` shows a count and tests/unit/storyGates.test.ts can seed one bad record per gate.
// Empty story data passes every gate.
import { JET_UNLOCK } from '../core/story2/jetBlessing';
import type { Content } from '../core/contentSchema';
import type { StoryData } from '../core/story2/schema';
import { rivalAudit } from '../core/story2/storyRivals';
import { TEMPLATE_TOKENS, tokensIn } from '../core/story2/templates';
import { MIN_TWIST_CLUES, validateTheme } from '../core/story2/themes';

export interface StoryGateContext {
  fileExists?: (path: string) => boolean;
  /** Size in bytes of each story data file, by name (e.g. "events"). */
  fileSizes?: Record<string, number>;
  /** Species ids over the power budget (from the existing over-power-budget check). */
  overBudgetIds?: ReadonlySet<string>;
  /** Whether hash.json matches the data (two builds of unchanged data give the same hash). */
  hashFresh?: boolean;
  /** Look B must stay locked until its animation checklist is signed off. */
  lookB?: { enabled: boolean; checklistDone: boolean };
}

export interface StoryGate { id: string; title: string; explain: string; offenders: string[] }

const TYPES = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
export const PARITY_ITEMS = ['intro_scene', 'event_pool', 'unique_encounters', 'modifiers', 'endings', 'starter_hooks'] as const;
const POSES_FOR_TIER: Record<number, number> = { 1: 4, 2: 2, 3: 1 };

const walk = (v: unknown, visit: (o: Record<string, unknown>) => void): void => {
  if (Array.isArray(v)) v.forEach((x) => walk(x, visit));
  else if (v && typeof v === 'object') {
    visit(v as Record<string, unknown>);
    Object.values(v).forEach((x) => walk(x, visit));
  }
};

export function storyGates(data: StoryData, content: Pick<Content, 'species' | 'moves'> | null, ctx: StoryGateContext = {}): StoryGate[] {
  const gates: StoryGate[] = [];
  const add = (id: string, title: string, explain: string, offenders: string[]) => gates.push({ id, title, explain, offenders });
  const ids = (xs: { id: string }[]) => new Set(xs.map((x) => x.id));
  const characters = ids(data.characters), events = ids(data.events), arcs = ids(data.arcs), backstories = ids(data.backstories);
  const speciesOk = (id: string) => !content || content.species.has(id);
  const moveOk = (id: string) => !content || content.moves.has(id);

  const unresolved: string[] = [];
  const need = (ok: boolean, where: string, what: string, id: string) => { if (!ok) unresolved.push(`${where}: unknown ${what} "${id}"`); };
  for (const e of data.events) for (const [role, spec] of Object.entries(e.roles)) if (spec.character) need(characters.has(spec.character), `event ${e.id} role ${role}`, 'character', spec.character);
  for (const a of data.arcs) a.steps.forEach((s) => { need(events.has(s.event), `arc ${a.id}`, 'event', s.event); if (s.onFail) need(events.has(s.onFail) || arcs.has(s.onFail), `arc ${a.id}`, 'event', s.onFail); });
  for (const c of data.characters) { c.party.forEach((sp) => need(speciesOk(sp), `character ${c.id}`, 'species', sp)); }
  for (const r of data.remembrances) { r.line.forEach((sp) => need(speciesOk(sp), `remembrance ${r.id}`, 'species', sp)); r.moves.forEach((m) => need(moveOk(m), `remembrance ${r.id}`, 'move', m)); }
  for (const d of data.dialogue) need(characters.has(d.speaker), `dialogue ${d.id}`, 'character', d.speaker);
  for (const t of data.themes) t.needs.forEach((n) => need(backstories.has(n) || characters.has(n), `theme ${t.id}`, 'need', n));
  add('story-unresolved-ids', 'Story references to nothing', 'References to a missing character, event, arc, species, move or item.', unresolved);

  add('story-event-variants', 'Story events with too few variants', 'Speaking roles with fewer than 3 variants.',
    data.events.flatMap((e) => Object.keys(e.roles).filter((role) => e.variants.filter((v) => v.role === role).length < 3).map((role) => `${e.id}: role ${role}`)));

  add('story-branch-no-exit', 'Story branches with no exit', 'Arc branches with no exit, or an exit the arc does not list.',
    data.arcs.flatMap((a) => a.branches.filter((b) => !b.exit || !a.exits.includes(b.exit)).map((b) => `${a.id}: branch ${b.id}`)));

  const reachable = new Set(data.backstories.flatMap((b) => b.endings));
  add('story-unreachable-ending', 'Story endings nobody can reach', 'Endings no backstory can reach, and backstories with no catch-all ending.', [
    ...data.themes.flatMap((t) => t.endings.filter((e) => !reachable.has(e) && !t.endingGrid.some((r) => r.ending === e)).map((e) => `theme ${t.id}: ending ${e}`)),
    ...data.backstories.filter((b) => !b.catchAllEnding || !b.endings.includes(b.catchAllEnding)).map((b) => `backstory ${b.id}: no catch-all ending`),
  ]);

  const canon: string[] = [];
  walk([data.events.map((e) => ({ id: e.id, o: [e.outputs, e.choices] })), data.arcs.map((a) => ({ id: a.id, o: a.effects }))], (o) => {
    if (typeof o.kind === 'string' && (o.kind === 'canonWrite' || String(o.target ?? '').startsWith('canon'))) canon.push(`effect ${String(o.id ?? o.kind)}`);
  });
  add('story-canon-write', 'Story events that write to canon', 'Effects that target a canon record.', canon);

  add('story-backstory-parity', 'Backstories missing parity items', `Backstory modules missing a parity item (${PARITY_ITEMS.join(', ')}).`,
    data.backstories.flatMap((b) => PARITY_ITEMS.filter((p) => !b.parity.includes(p)).map((p) => `${b.id}: ${p}`)));

  const quizBad: string[] = [];
  const full = data.quiz.filter((q) => !q.quick);
  if (full.length > 0) {
    // Every trait's total weight over all answers is 18 +/- 1, and the most a player can score in each trait (best answer per question)
    // is within 10 percent of every other trait.
    const totals: Record<string, number> = {};
    const maxes: Record<string, number> = {};
    for (const q of full) {
      const traits = new Set(q.answers.flatMap((a) => Object.keys(a.weights)));
      for (const t of traits) maxes[t] = (maxes[t] ?? 0) + Math.max(...q.answers.map((a) => a.weights[t] ?? 0));
      for (const a of q.answers) for (const [t, w] of Object.entries(a.weights)) totals[t] = (totals[t] ?? 0) + w;
    }
    for (const [t, total] of Object.entries(totals)) if (Math.abs(total - 18) > 1) quizBad.push(`trait ${t}: total weight ${total}`);
    const hi = Math.max(...Object.values(maxes)), lo = Math.min(...Object.values(maxes));
    if (hi > lo * 1.1) quizBad.push(`most-available weight per trait ranges ${lo} to ${hi} (more than 10 percent apart)`);
  }
  add('story-quiz-balance', 'Quiz weights out of balance', 'Traits whose total weight is outside 18 +/- 1, or whose best-case score is more than 10 percent from another trait\'s.', quizBad);

  add('story-remembrance-unlock', 'Remembrances nobody can unlock', 'Remembrances whose unlock route needs an event or backstory that does not exist.',
    data.remembrances.filter((r) => (r.unlock.kind === 'event' && r.unlock.arg !== JET_UNLOCK && !events.has(r.unlock.arg ?? '')) || (r.unlock.kind === 'backstory' && !backstories.has(r.unlock.arg ?? '')) || (r.unlock.kind === 'quiz' && !r.unlock.arg)).map((r) => `${r.id}: ${r.unlock.kind} ${r.unlock.arg ?? '(none)'}`));

  add('story-romance-age', 'Romanceable characters under 18', 'Characters marked romanceable whose age is under 18.', data.characters.filter((c) => c.romanceable && c.age < 18).map((c) => `${c.id} (age ${c.age})`));

  const twist: string[] = [];
  for (const t of data.themes) {
    const order = t.beatSheet.map((b) => b.slot);
    const checks = [...(t.twist ? [{ id: t.id, reveal: t.twist.revealSlot, slots: t.twist.clueSlots, min: t.twist.minClues }] : []),
      ...t.twists.map((w) => ({ id: `${t.id}/${w.id}`, reveal: w.revealSlot, slots: w.clues.map((c) => c.slot), min: MIN_TWIST_CLUES }))];
    for (const c of checks) {
      const reveal = order.indexOf(c.reveal);
      const clues = c.slots.filter((s) => order.indexOf(s) >= 0 && order.indexOf(s) < reveal);
      if (clues.length < c.min) twist.push(`${c.id}: ${clues.length} clue(s) before the reveal, needs ${c.min}`);
    }
  }
  add('story-twist-clues', 'Twists with too few clues', 'Twist cards below the required clue count, or with clues scheduled after the reveal.', twist);

  add('story-theme-audit', 'Story themes that are incomplete', 'Theme cards that break the card rules: event count, slot rules, twist clues, Journal tab, ending table, or an ending nobody can reach.',
    data.themes.filter((t) => t.events.length > 0 || t.endingGrid.length > 0).flatMap((t) => validateTheme(data, t.id).map((p) => `${t.id}: ${p}`)));

  add('story-movemoment-types', 'Move Moments missing types', 'Move Moments with no line for one of the 18 types.', data.moveMoments.flatMap((m) => TYPES.filter((t) => !m.typeMap[t]).map((t) => `${m.id}: ${t}`)));

  add('story-character-sheet', 'Incomplete character sheets', 'Characters missing a bio or any pose.', data.characters.filter((c) => c.bio.length === 0 || Object.keys(c.poses).length === 0).map((c) => c.id));

  const used = new Set<string>();
  walk({ ...data, text: undefined }, (o) => {
    for (const [k, v] of Object.entries(o)) {
      if ((k === 'nameKey' || k === 'textKey' || k === 'templateKey') && typeof v === 'string') used.add(v);
      if ((k === 'typeMap' || k === 'outlets') && v && typeof v === 'object') for (const x of Object.values(v)) if (typeof x === 'string') used.add(x);
    }
  });
  add('story-string-keys', 'Story text keys with no text', 'Text keys used in story data but missing from text/en.json.', [...used].filter((k) => !(k in data.text)).map((k) => `missing text key "${k}"`));

  const tokenBad: string[] = [];
  const known = new Set<string>(TEMPLATE_TOKENS);
  for (const [k, v] of Object.entries(data.text)) for (const t of tokensIn(v)) if (!known.has(t)) tokenBad.push(`${k}: unknown token {${t}}`);
  for (const n of data.news) {
    const declared = new Set(n.tokens);
    for (const key of Object.values(n.outlets)) for (const t of tokensIn(data.text[key] ?? '')) if (!declared.has(t)) tokenBad.push(`${n.id}: ${key} uses {${t}} but does not declare it`);
    for (const t of n.tokens) if (!known.has(t)) tokenBad.push(`${n.id}: declares unknown token {${t}}`);
  }
  add('story-template-tokens', 'Story text with unresolvable tokens', 'A {token} in story text that is not on the known list, or a news template that uses a token it does not declare.', tokenBad);

  add('story-pose-set', 'Characters missing poses', 'Characters with fewer poses than their tier needs (Tier 1: 4, Tier 2: 2, Tier 3: 1).', data.characters.filter((c) => Object.keys(c.poses).length < POSES_FOR_TIER[c.tier]!).map((c) => `${c.id}: ${Object.keys(c.poses).length} of ${POSES_FOR_TIER[c.tier]}`));

  add('story-look-lock', 'Look B unlocked too early', 'Look B enabled before its animation checklist is signed off.', ctx.lookB?.enabled && !ctx.lookB.checklistDone ? ['look_b is enabled but its checklist is not done'] : []);

  add('story-species-budget', 'Story species over the power budget', 'Remembrance species over the power class caps (extends over-power-budget).', ctx.overBudgetIds ? data.remembrances.flatMap((r) => r.line.filter((s) => ctx.overBudgetIds!.has(s)).map((s) => `${r.id}: ${s}`)) : []);

  const exists = ctx.fileExists;
  add('story-asset-files', 'Story art files not on disk', 'Sprite files named in story data that do not exist.', exists ? data.characters.flatMap((c) => Object.values(c.poses).filter((f) => !exists(f)).map((f) => `${c.id}: ${f}`)) : []);

  const MB = 1_000_000;
  const sizes = ctx.fileSizes ?? {};
  add('story-bundle-budget', 'Story data over its size budget', 'A story data file over 0.6 MB, or text/en.json over 0.1 MB in the main bundle.', Object.entries(sizes).filter(([name, n]) => n > (name.startsWith('text') ? 0.1 * MB : 0.6 * MB)).map(([name, n]) => `${name}: ${n} bytes`));

  add('story-rival-audit', 'Story rivals failing the fair-play audit', 'Rival data with a missing reference, a bad team, a clue ledger below the fair-play rules, or a theme row that breaks the role rules.', rivalAudit(data, content?.species));

  add('story-hash-stable', 'Story content hash out of date', 'hash.json differs from the hash of the data (run npm run data:story).', ctx.hashFresh === false ? ['src/data/story/hash.json is stale'] : []);
  return gates;
}

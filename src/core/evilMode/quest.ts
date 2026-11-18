// Evil Mode's personal quests and the people who come only when (design Part 10c, Part 10b section 6). Pure: new blocks
// are returned. A quest is a short chain of steps a district or more apart; each costs the person (and, at its Boss step,
// the Boss's In person beat) a day for nothing the Board counts. Rolls (Ask them to stay) come from `evil-mole`, the
// slice's own stream, so no earlier stream's draws move.

import { hashSeed, Rng } from '../rng';
import { EVIL_DATA, type EvilData } from './data';
import { appendLog, fill, money } from './ledger';
import { logOf } from './pack';
import { deckPerson, inRoster, moveLoyalty, type DeckPerson } from './people';
import { LINE_IDS, type Crew, type EvilModeBlock, type QuestState } from './schema';

type Out = { block: EvilModeBlock; problem: string | null; lines: string[] };
const no = (block: EvilModeBlock, problem: string): Out => ({ block, problem, lines: [] });
const Q = (data: EvilData) => data.quests;
const qt = (k: string, data: EvilData = EVIL_DATA): string => Q(data).text[k] ?? '';

/** The run's region (0 for the first), read without importing region.ts. */
export const runOf = (block: Pick<EvilModeBlock, 'region'>): number => block.region?.crossed?.length ?? 0;
/** The district key quests (and the mole) are kept against: "run:n". */
export const districtAt = (block: EvilModeBlock): string => `${runOf(block)}:${block.district?.n ?? block.here.stage}`;

/** The n-th number `evil-mole` gives out in this run, 1..max. */
export const moleRoll = (seed: string, n: number, max: number): number => new Rng(hashSeed(`${seed}::evil-mole::${n}`)).int(1, max);
/** One draw from `evil-mole` (the count is stored, so a reload draws the same). */
export function drawMole(block: EvilModeBlock, max: number): { block: EvilModeBlock; r: number } {
  const n = block.draws['evil-mole'] ?? 0;
  const r = moleRoll(block.district?.seed ?? 'evil', n, Math.max(1, max));
  return { block: { ...block, draws: { ...block.draws, 'evil-mole': n + 1 } }, r };
}

export type QuestDef = { thread: string | null; steps: { text: string; boss?: boolean }[]; endings: EvilData['quests']['shapes']['owed']['endings'] };

/** A person's quest as written (the Founders and three from the regions), or cut from their shape (Part 10c section 4). */
export function questDef(ref: string | null, data: EvilData = EVIL_DATA): QuestDef | null {
  const p = deckPerson(ref, data);
  if (!p) return null;
  const own = Q(data).quests[p.id];
  if (own) return { thread: own.thread, steps: own.steps, endings: own.endings };
  const s = Q(data).shapes[p.shape];
  return { thread: null, steps: s.steps, endings: s.endings };
}

const questOn = (data: EvilData) => Q(data).on;
const crewOf = (block: EvilModeBlock, id: string) => block.crew.find((c) => c.id === id);
const setQuest = (block: EvilModeBlock, id: string, q: QuestState): EvilModeBlock => ({ ...block, quests: { ...block.quests, [id]: q } });

/** Opens a person's quest (Loyalty 7, or "Why us?" at hiring). Its field fills on their card; nothing else changes. */
export function openQuest(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA): Out {
  const p = crewOf(block, id);
  if (!questOn(data) || !p || p.where !== 'in' || block.quests[id] || !questDef(p.ref, data)) return { block, problem: null, lines: [] };
  const b = appendLog(setQuest(block, id, { step: 0, at: districtAt(block), run: runOf(block), state: 'open', ending: null, busy: 0, goes: false }), { kind: 'quest', who: [id], text: `Day ${block.here.day}. ${fill(qt('open', data), { name: p.name })}` });
  return { block: b, problem: null, lines: [fill(qt('open', data), { name: p.name })] };
}

/** Morning: everyone in at Loyalty 7 or more whose quest isn't open yet opens it (Part 10c section 1). */
export function openQuests(block: EvilModeBlock, data: EvilData = EVIL_DATA): { block: EvilModeBlock; lines: string[] } {
  let b = block;
  const lines: string[] = [];
  for (const p of inRoster(block)) {
    if (p.loyalty < Q(data).rules.openAt || b.quests[p.id]) continue;
    const r = openQuest(b, p.id, data);
    b = r.block;
    lines.push(...r.lines);
  }
  return { block: b, lines };
}

/** Why the next step can't be taken now, or null. The last step needs an ending picked (`questStep` with `ending`). */
export function stepProblem(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA): string | null {
  const p = crewOf(block, id);
  const q = block.quests[id];
  const def = p ? questDef(p.ref, data) : null;
  if (!p || p.where !== 'in' || !q || !def) return 'No quest open.';
  if (q.state !== 'open') return q.state === 'done' ? qt('doneCard', data) : qt('failedCard', data);
  if (block.district?.end) return "The district's over.";
  const next = def.steps[q.step]!;
  const beat = block.here.beat;
  if (next.boss && beat !== 'inPerson') return qt('bossBeat', data);
  if (!next.boss && beat !== 'dispatch') return qt('notBossBeat', data);
  if (q.step > 0 && q.at === districtAt(block)) return qt('notYet', data);
  if (q.busy === block.here.day) return fill(qt('busy', data), { name: p.name });
  if (block.queue.some((j) => j.squad.includes(id)) || block.posted.some((x) => x.id === id)) return `${p.name} is already going somewhere today.`;
  if (p.outOn === block.here.day) return `${p.name} is resting after yesterday's battle.`;
  if (next.boss && block.inPerson?.day === block.here.day) return 'The Boss has already been out today.';
  return null;
}

/** Why a person's out on their own business today (dispatch.ts reads this, so they can't be queued). */
export const questBusy = (block: EvilModeBlock, id: string): string | null =>
  block.quests?.[id]?.busy === block.here.day ? fill(qt('busy'), { name: crewOf(block, id)?.name ?? 'They' }) : null;

/**
 * One step of a person's quest (Part 10c section 1): their day, for nothing ("Gives: Nothing"). The last step ends it,
 * by the ending the Boss picks: Loyalty 10 for good, the flaw greyed, and what the ending does.
 */
export function questStep(block: EvilModeBlock, id: string, ending: string | null = null, data: EvilData = EVIL_DATA): Out {
  const problem = stepProblem(block, id, data);
  if (problem) return no(block, problem);
  const p = crewOf(block, id)!;
  const q = block.quests[id]!;
  const def = questDef(p.ref, data)!;
  const n = q.step + 1;
  const last = n >= def.steps.length;
  const end = last ? def.endings.find((e) => e.id === ending) : undefined;
  if (last && !end) return no(block, qt('chooseEnd', data));
  if (end?.effect.funds && block.team.funds + end.effect.funds < 0) return no(block, fill(qt('notEnough', data), { amount: money(-end.effect.funds) }));
  const step = def.steps[q.step]!;
  const line = fill(qt('stepDone', data), { name: p.name, n, text: step.text });
  let b = setQuest(block, id, { ...q, step: n, at: districtAt(block), run: runOf(block), busy: block.here.day });
  if (step.boss) b = { ...b, applied: [...b.applied, `inPerson:quest:${block.here.day}`] };
  b = appendLog(b, { kind: 'quest', who: [id], text: `Day ${block.here.day}. ${line}` });
  const lines = [line];
  if (end) {
    const r = finish(b, id, end, data);
    b = r.block;
    lines.push(...r.lines);
  }
  return { block: b, problem: null, lines };
}

const cap = (n: number) => Math.max(0, Math.min(10, n));

/** A quest done (Part 10c section 1): Loyalty 10, for good; the ending's effects; and, if it leaves, they go. */
function finish(block: EvilModeBlock, id: string, end: QuestDef['endings'][number], data: EvilData): Out {
  const p = crewOf(block, id)!;
  const e = end.effect;
  let b: EvilModeBlock = {
    ...block,
    team: { ...block.team, funds: block.team.funds + (e.funds ?? 0), regard: cap(block.team.regard + (e.regard ?? 0)), dread: cap(block.team.dread + (e.dread ?? 0)), heat: cap(block.team.heat + (e.heat ?? 0)) },
    crew: block.crew.map((c) => (c.id === id ? { ...c, loyalty: Q(data).rules.done, ...(e.rank ? { rank: e.rank } : {}) } : c.where === 'in' && e.loyaltyAll ? moveLoyalty(c, e.loyaltyAll, data) : c)),
  };
  b = setQuest(b, id, { ...b.quests[id]!, state: 'done', ending: end.id, goes: !!end.leaves });
  const said = fill(qt('done', data), { name: p.name, text: end.text });
  b = appendLog(b, { kind: 'quest', who: [id], text: `Day ${block.here.day}. ${said}` });
  const lines = [said];
  if (end.leaves) lines.push(fill(qt('leaves', data), { name: p.name }));
  if (end.leavesNow) {
    b = { ...b, crew: b.crew.map((c) => (c.id === id ? { ...c, where: 'left' as const, left: { day: block.here.day, how: 'quest' as const, kindly: true } } : c)) };
    b = appendLog(b, { kind: 'leave', who: [id], text: `Day ${block.here.day}. ${fill(qt('leftQuest', data), { name: p.name })}` });
  }
  return { block: b, problem: null, lines };
}

/**
 * After every step: a finished quest pins Loyalty at 10 (it can't fall); a failed one never rises above 7; and after a
 * second wrong accusation the Roster's ceiling is 8 for the region (Part 11 section 6.2). Nothing changes if nothing needs to.
 */
export function pinLoyalty(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  const R = Q(data).rules;
  const ceiling = block.mole?.ceiling !== null && block.mole?.ceiling === runOf(block) ? data.mole.rules.wrong.ceiling : 10;
  let changed = false;
  const crew = block.crew.map((c) => {
    const q = block.quests?.[c.id];
    let l = c.loyalty;
    if (q?.state === 'done') l = R.done;
    else {
      if (q?.state === 'failed') l = Math.min(l, R.failCap);
      if (c.where === 'in') l = Math.min(l, ceiling);
    }
    if (l === c.loyalty) return c;
    changed = true;
    return { ...c, loyalty: l };
  });
  return changed ? { ...block, crew } : block;
}

/**
 * At a Crossing (Part 10c section 1): a quest left the whole region closes ("It's all right. It was a long shot.",
 * Loyalty −2, never above 7 again); and everyone whose ending sent them off goes, happily (the seventh way to leave).
 */
export function questsAtCrossing(block: EvilModeBlock, data: EvilData = EVIL_DATA): { block: EvilModeBlock; lines: string[] } {
  let b = block;
  const lines: string[] = [];
  const run = runOf(block);
  for (const [id, q] of Object.entries(block.quests)) {
    const p = crewOf(b, id);
    if (!p || p.where !== 'in') continue;
    if (q.state === 'open' && q.run < run) {
      b = setQuest(b, id, { ...q, state: 'failed' });
      b = { ...b, crew: b.crew.map((c) => (c.id === id ? moveLoyalty(c, Q(data).rules.failLoyalty, data) : c)) };
      const line = fill(qt('failed', data), { name: p.name });
      b = appendLog(b, { kind: 'quest', who: [id], text: `Day ${block.here.day}. ${line}` });
      lines.push(line);
    }
  }
  for (const p of inRoster(b)) {
    if (!b.quests[p.id]?.goes && !b.applied.includes(`stay:crossing:${p.id}`)) continue;
    const viaQuest = !!b.quests[p.id]?.goes;
    b = { ...b, crew: b.crew.map((c) => (c.id === p.id ? { ...c, where: 'left' as const, left: { day: block.here.day, how: viaQuest ? ('quest' as const) : ('stayed' as const), kindly: true } } : c)) };
    const line = viaQuest ? fill(qt('leftQuest', data), { name: p.name }) : `${p.name} goes at the Crossing, as agreed, and shakes hands.`;
    b = appendLog(b, { kind: 'leave', who: [p.id], text: `Day ${block.here.day}. ${line}` });
    lines.push(line);
  }
  return { block: b, lines };
}

/** What a person's card says under "Quest" (empty until it opens; it never says "locked"). */
export function questLine(block: EvilModeBlock, p: Crew, data: EvilData = EVIL_DATA): string | null {
  const q = block.quests?.[p.id];
  const d = deckPerson(p.ref, data);
  const def = questDef(p.ref, data);
  if (!q || !d || !def) return null;
  if (q.state === 'done') return `${d.quest}. ${qt('doneCard', data)}`;
  if (q.state === 'failed') return `${d.quest}. ${qt('failedCard', data)}`;
  const next = def.steps[q.step];
  return next ? `${d.quest}. ${fill(qt('card', data), { name: p.name.split(' ')[0]!, n: q.step + 1, of: def.steps.length, text: next.text })}` : d.quest;
}

// ---- Ask them to stay (Part 10c section 5) ----

export type StayReason = EvilData['quests']['stay']['reasons'][number]['id'];

/** Whether the button shows: on anyone at Leaving (Loyalty 1-2). */
export const canAskStay = (p: Crew): boolean => p.where === 'in' && p.loyalty >= 1 && p.loyalty <= 2;

/** Each reason, and why it's greyed (checked against the Ledger), or null when it's true. */
export function stayReasons(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA): { id: StayReason; say: string; why: string | null }[] {
  const p = crewOf(block, id);
  if (!p) return [];
  const ins = inRoster(block);
  const deck = deckPerson(p.ref, data)?.deck;
  const lineAt = (l: string) => (LINE_IDS as readonly string[]).indexOf(l);
  const check: Record<StayReason, boolean> = {
    need: !!p.talent && ins.filter((c) => c.talent === p.talent).length === 1,
    wrong: p.asked > 0 && block.given > 0,
    miss: !!deck && ins.some((c) => c.id !== id && deckPerson(c.ref, data)?.deck === deck),
    different: !!block.lineMove && lineAt(block.lineMove.to) < lineAt(block.lineMove.from),
    crossing: true,
  };
  return Q(data).stay.reasons.map((r) => ({ id: r.id, say: r.say, why: check[r.id] ? null : r.grey }));
}

/**
 * Ask them to stay (Part 10c section 5): once a person, a run. With a reason that's true it works by the reason and by
 * them (`evil-mole`); agreed, Loyalty 4; refused, they go, Warm. With no true reason left the button still presses: they go.
 */
export function askStay(block: EvilModeBlock, id: string, reason: StayReason | null, data: EvilData = EVIL_DATA): Out {
  const p = crewOf(block, id);
  const S = Q(data).stay;
  if (!p || !canAskStay(p)) return no(block, 'Only someone who is leaving can be asked to stay.');
  const key = `stay:${id}`;
  if (block.applied.includes(key)) return no(block, S.asked);
  const reasons = stayReasons(block, id, data);
  const go = (b0: EvilModeBlock, line: string): Out => {
    let b = { ...b0, crew: b0.crew.map((c) => (c.id === id ? { ...c, where: 'left' as const, left: { day: block.here.day, how: 'loyalty' as const, kindly: true } } : c)) };
    b = appendLog(b, { kind: 'leave', who: [id], text: `Day ${block.here.day}. ${line}` });
    return { block: b, problem: null, lines: [line] };
  };
  const base: EvilModeBlock = { ...block, applied: [...block.applied, key] };
  if (reason === null) {
    if (reasons.some((r) => !r.why)) return no(block, 'Pick a reason.');
    return go(base, fill(S.noneGo, { name: p.name }));
  }
  const r = reasons.find((x) => x.id === reason);
  if (!r || r.why) return no(block, r?.why ?? 'Pick a reason.');
  const def = S.reasons.find((x) => x.id === reason)!;
  const fits = def.works.length === 0 || def.works.includes(p.talent ?? '') || def.works.includes(p.flaw ?? '');
  const [a, of] = fits ? def.chance : def.else;
  const d = drawMole(base, of);
  if (d.r > a) return go(d.block, fill(S.refused, { name: p.name }));
  let b: EvilModeBlock = { ...d.block, crew: d.block.crew.map((c) => (c.id === id ? { ...c, loyalty: 4 } : c)) };
  if (reason === 'crossing') b = { ...b, applied: [...b.applied, `stay:crossing:${id}`] };
  const line = fill(S.agreed, { name: p.name });
  b = appendLog(b, { kind: 'quest', who: [id], text: `Day ${block.here.day}. ${def.say} ${line}` });
  return { block: b, problem: null, lines: [`${def.say}`, line] };
}

// ---- The ones who come only when (Part 10b section 6) ----

/** Whether what brings a person has happened (read from the block; never a roll). */
export function hasHappened(block: EvilModeBlock, when: NonNullable<DeckPerson['when']>): boolean {
  const jobs = logOf(block).filter((e) => e.kind === 'job');
  switch (when) {
    case 'firstTake': return jobs.some((e) => e.method === 'take' && e.result === 'went');
    case 'leanFailed': return jobs.some((e) => e.method === 'lean' && e.result === 'didnt');
    case 'raidSurvived': return (block.law?.raids.length ?? 0) > 0 && !block.raid;
    case 'gaveBack': return block.given > 0;
    case 'gymFriend': return block.gyms.some((g) => g.standing === 'warm');
    case 'neighbourBeaten': return !!block.neighbour?.fallen;
    case 'regard8': return block.team.regard >= 8;
    case 'dread8': return block.team.dread >= 8;
    case 'broke3': return block.economy.broke >= 3;
    case 'workDone': return block.economy.worksIn.length > 0;
    case 'heroBeaten': return (block.hero?.lostDays ?? 0) > 0;
    // A detective replaced needs the detective (Part 17), which isn't built: he never comes yet. Status 'limited'.
    case 'detectiveGone': return false;
    case 'sameSix': return runOf(block) >= 2 && !block.crew.some((c) => c.where === 'left');
  }
}

/** Morning: each who comes only when, whose thing has happened, is at the notice board (once a run, in whatever region). */
export function specialArrivals(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  if (!block.district) return block;
  const fresh = data.people.people.filter((p) => p.deck === 'special' && p.when && p.status !== 'disabled' && p.status !== 'invalid' && !block.drawn.includes(p.id) && hasHappened(block, p.when));
  if (!fresh.length) return block;
  return { ...block, drawn: [...block.drawn, ...fresh.map((p) => p.id)], applicants: [...block.applicants, ...fresh.map((p) => ({ ref: p.id, day: block.here.day, q: null }))] };
}

/** The note on the board (Part 10b section 6, the twelfth): someone left over a line, insisted on, in this district. */
export function boardNote(block: EvilModeBlock, data: EvilData = EVIL_DATA): string | null {
  const from = block.district?.from ?? 1;
  const gone = block.crew.find((c) => c.left?.how === 'line' && c.left.day >= from);
  return gone ? fill(data.people.text.noteFaye as string, { name: gone.name.split(' ')[0]! }) : null;
}

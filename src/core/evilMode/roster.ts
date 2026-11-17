// The Roster's actions (design Part 10a sections 1-1.3, Part 9 sections 5 and 10, Part 5 section 5): applicants at the
// notice board, the one question, hiring and saying no, Grunt to Lead, letting go, and leaving at Loyalty 0.
// Pure: new blocks are returned. Draws come only from `evil-people`, and its count is stored.

import { fxTotal, rosterCap } from './baseFx';
import { EVIL_DATA, type EvilData } from './data';
import { appendLog, fill, money } from './ledger';
import { bandOf, deckFor, deckPerson, drawOne, flawDef, inRoster, lineText, moveLoyalty, peopleText, personFrom, rankDef, saysName, talentDef, wageOf } from './people';
import type { Crew, EvilModeBlock, Question } from './schema';

type Out = { block: EvilModeBlock; problem: string | null; line: string };
const no = (block: EvilModeBlock, problem: string): Out => ({ block, problem, line: '' });

const startLoyalty = (block: EvilModeBlock, data: EvilData): number => data.creeds.find((c) => c.id === block.team.creed)?.start.loyalty ?? 5;

/**
 * The Morning's applicants (Part 10a section 1): a held Town brings three, a Town not held one. Those who've waited their
 * two days are gone. Drawn once a day, on `evil-people`; an empty deck sends nobody.
 */
export function arriveApplicants(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  const d = block.district;
  const day = block.here.day;
  const key = `applicants:${block.here.region}:${d?.n ?? 0}:${day}`;
  if (!d || block.applied.includes(key)) return block;
  const R = data.people.rules;
  const stay = block.applicants.filter((a) => day < a.day + R.waitDays);
  const town = d.holdings.find((h) => h.kind === 'town');
  const count = (town?.owner === 'team' ? R.applicantsHeld : R.applicantsNotHeld) + fxTotal(block, 'applicants', data);
  let draws = block.draws['evil-people'] ?? 0;
  const drawn = [...block.drawn];
  const fresh: EvilModeBlock['applicants'] = [];
  for (let i = 0; i < count; i++) {
    const p = drawOne(deckFor(block.here.region, drawn, data), block.team.creed, d.seed, draws, data);
    if (!p) break;
    draws += 1;
    drawn.push(p.id);
    fresh.push({ ref: p.id, day, q: null });
  }
  return { ...block, applicants: [...stay, ...fresh], drawn, draws: { ...block.draws, 'evil-people': draws }, applied: [...block.applied, key] };
}

/** The one question (Part 10a section 1.2). One per applicant; "Who sent you?" always gets "Nobody." */
export function askQuestion(block: EvilModeBlock, ref: string, q: Question, data: EvilData = EVIL_DATA): Out {
  const a = block.applicants.find((x) => x.ref === ref);
  const p = deckPerson(ref, data);
  if (!a || !p) return no(block, "They're not at the notice board.");
  if (a.q) return no(block, 'One question each. The rest the run tells you.');
  const def = data.people.questions.find((x) => x.id === q)!;
  const line = `${p.name}: ${fill(def.answer, { flaw: flawDef(p.flaw, data).name, line: deckPerson(ref, data)?.lineText ?? data.people.lines.find((l) => l.n === p.line)!.text, why: p.why, quest: p.quest })}`;
  return { block: { ...block, applicants: block.applicants.map((x) => (x.ref === ref ? { ...x, q } : x)) }, problem: null, line };
}

/** Hiring (Part 10a section 1): the armband goes on; they say the team's name their own way. The Roster's capped. */
export function hire(block: EvilModeBlock, ref: string, data: EvilData = EVIL_DATA): Out {
  // Slice 13: a fallen neighbour's betrayer can't be hired by any path: the slot refuses him (Part 15a section 7.9).
  if (data.neighbour.neighbours.some((n) => n.fall.admins.some((a) => a.never && (a.id === ref || `nb-${a.id}` === ref)))) return no(block, 'The slot refuses him. His card has no line at all.');
  const a = block.applicants.find((x) => x.ref === ref);
  const d = deckPerson(ref, data);
  if (!a || !d) return no(block, "They're not at the notice board.");
  const cap = rosterCap(block, data);
  if (inRoster(block).length >= cap) return no(block, fill(peopleText('noBunk', data), { cap }));
  const person = personFrom(d, startLoyalty(block, data), { line: a.q === 'wont' });
  const line = fill(peopleText('hired', data), { name: d.name, says: saysName(person, block.team.name, data) });
  let b: EvilModeBlock = { ...block, crew: [...block.crew, person], applicants: block.applicants.filter((x) => x.ref !== ref) };
  b = appendLog(b, { kind: 'hire', who: [person.id], text: `Day ${block.here.day}. Hired ${d.name}, ${d.age}.` });
  return { block: b, problem: null, line };
}

/** Saying no (Part 10a section 1.3): where they go is by who they are. Turned away rudely, the Town hears: Regard −1. */
export function turnAway(block: EvilModeBlock, ref: string, rude: boolean, data: EvilData = EVIL_DATA): Out {
  const d = deckPerson(ref, data);
  if (!d || !block.applicants.some((x) => x.ref === ref)) return no(block, "They're not at the notice board.");
  const W = data.people.rules.weights;
  const kind = data.people.text.turnedKind as Record<string, string>;
  const line = fill(rude ? peopleText('turnedRude', data) : kind[d.age < W.youngUnder ? 'young' : d.age > W.oldOver ? 'old' : 'other']!, { name: d.name });
  let b: EvilModeBlock = { ...block, applicants: block.applicants.filter((x) => x.ref !== ref) };
  if (rude) b = { ...b, team: { ...b.team, regard: Math.max(0, Math.min(10, b.team.regard + data.people.rules.rudeRegard)) } };
  b = appendLog(b, { kind: 'turned', who: [], text: `Day ${block.here.day}. Turned away ${d.name}, ${d.age}${rude ? ', rudely' : ''}.` });
  return { block: b, problem: null, line };
}

/** Why this person can't be promoted, or null (Part 9 section 5). Only Grunt to Lead is open in this build. */
export function promoteProblem(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA): string | null {
  const p = block.crew.find((c) => c.id === id);
  if (!p || p.where !== 'in') return 'Not on the Roster.';
  const R = data.people.rules;
  if (p.rank === 'grunt') return p.jobs >= R.leadJobs ? null : `Needs ${R.leadJobs} jobs done (${p.jobs} so far).`;
  const next = data.people.ranks[data.people.ranks.findIndex((r) => r.id === p.rank) + 1];
  return next ? `${next.title}: ${next.needs}.` : 'There is nothing above Executive.';
}

/** What they say when they're called into the Office (Part 9 section 5.1), by talent. */
export const promoteLine = (p: Crew, data: EvilData = EVIL_DATA): string => (p.talent ? talentDef(p.talent, data).lead : 'Right, Boss.');

/**
 * Grunt to Lead (Part 9 section 5.1): Loyalty +1. Anyone at the same rank who'd done more jobs is passed over: −1.
 * The Boss answers from two; either way it's done.
 */
export function promote(block: EvilModeBlock, id: string, answer: number, data: EvilData = EVIL_DATA): Out {
  const problem = promoteProblem(block, id, data);
  if (problem) return no(block, problem);
  const p = block.crew.find((c) => c.id === id)!;
  const L = data.people.rules.loyalty;
  const said = (data.people.text.promoteAnswers as string[])[answer] ?? (data.people.text.promoteAnswers as string[])[0]!;
  const crew = block.crew.map((c) => {
    if (c.id === id) return moveLoyalty({ ...c, rank: 'lead' }, L.promoted, data);
    if (c.where === 'in' && c.rank === p.rank && c.jobs > p.jobs) return moveLoyalty(c, L.passedOver, data);
    return c;
  });
  let b: EvilModeBlock = { ...block, crew };
  b = appendLog(b, { kind: 'promote', who: [id], text: `Day ${block.here.day}. ${p.name} made ${rankDef('lead', data).title}. "${promoteLine(p, data)}" The Boss: "${said}"` });
  return { block: b, problem: null, line: `${p.name}: "${promoteLine(p, data)}"` };
}

/**
 * Let go, in the Office (Part 9 section 10, way 9). Kindly, with a month's wage: they're Warm, as a local. Coldly: they
 * talk, Heat +1. They stay on the list, as left.
 */
export function letGo(block: EvilModeBlock, id: string, kindly: boolean, data: EvilData = EVIL_DATA): Out {
  const p = block.crew.find((c) => c.id === id);
  if (!p || p.where !== 'in') return no(block, 'Not on the Roster.');
  if (block.queue.some((j) => j.squad.includes(id))) return no(block, `${p.name}'s on a job today. Clear it first.`);
  const cost = kindly ? severance(block, p, data) : 0;
  if (cost > block.team.funds) return no(block, `Not enough Funds for ${money(cost)}.`);
  const team = { ...block.team, funds: block.team.funds - cost, heat: kindly ? block.team.heat : Math.min(10, block.team.heat + 1) };
  let b: EvilModeBlock = { ...block, team, crew: block.crew.map((c) => (c.id === id ? { ...c, where: 'left' as const, left: { day: block.here.day, how: 'letGo' as const, kindly } } : c)) };
  const line = fill(peopleText(kindly ? 'letGoneKind' : 'letGoneCold', data), { name: p.name });
  b = appendLog(b, { kind: 'leave', who: [id], text: `Day ${block.here.day}. ${p.name} let go${kindly ? `, with ${money(cost)}` : ''}.` });
  return { block: b, problem: null, line };
}

/** A month's wage, at their rank. */
export const severance = (block: EvilModeBlock, p: Crew, data: EvilData = EVIL_DATA): number => wageOf(block, p, 0, data) * data.people.rules.letGoKindDays;

/** Morning: anyone at Loyalty 0 was gone by morning, with a note on the bunk by flaw (Part 9 section 10, way 2). */
export function leaveAtZero(block: EvilModeBlock, data: EvilData = EVIL_DATA): { block: EvilModeBlock; notes: string[] } {
  const gone = inRoster(block).filter((c) => c.loyalty === 0);
  if (!gone.length) return { block, notes: [] };
  let b: EvilModeBlock = { ...block, crew: block.crew.map((c) => (gone.some((g) => g.id === c.id) ? { ...c, where: 'left' as const, left: { day: block.here.day, how: 'loyalty' as const } } : c)) };
  const notes: string[] = [];
  for (const p of gone) {
    const note = p.flaw ? flawDef(p.flaw, data).note : 'Nothing written.';
    const line = fill(peopleText('leftLoyalty', data), { name: p.name, note });
    notes.push(line);
    b = appendLog(b, { kind: 'leave', who: [p.id], text: `Day ${block.here.day}. ${line}` });
  }
  return { block: b, notes };
}

/** A person's card as the Roster shows it (Part 9 section 1): no number but age and wage. */
export function cardOf(block: EvilModeBlock, p: Crew, data: EvilData = EVIL_DATA) {
  const band = bandOf(p.loyalty, data);
  return {
    talent: p.talent ? talentDef(p.talent, data) : null,
    flaw: p.flaw && p.flawFound ? flawDef(p.flaw, data).name : p.flaw ? '?' : null,
    line: p.line !== null && p.lineHeard ? lineText(p, data) : p.line !== null ? peopleText('unheard', data) : null,
    rank: rankDef(p.rank, data).title,
    band,
  };
}

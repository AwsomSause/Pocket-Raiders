// Evil Mode slice 21: Incursions for a Boss (design Part 27 section 4; Part 30 section 2 `tear.ts`). The main game's flow,
// read for a team: ten Appetites fed by what the Roster does, a Static day, a Tear in a held district (its Ultra Rule in
// every battle there; the holding pays nothing, its street half; Heat can't rise), three things to do and a fourth, the
// Incursion, and a caught Beast in the building. The Beasts and their rules are core/ultra's, unchanged. Nothing here is
// remembered between runs. Pure; no stream is drawn (the Beast is whichever Appetite crossed first).

import { BEAST_BY_ID, INVADERS, ULTRA_BEASTS, type UltraBeast } from '../ultra/beasts';
import { holdingName, streetOf } from './board';
import { EVIL_DATA, type EvilData } from './data';
import { appendLog, fill } from './ledger';
import { runIndex } from './region';
import { MOODS, type CardField, type EvilModeBlock, type EdgesState, type Holding, type TearChoice, type TearState } from './schema';

export interface TearOut { block: EvilModeBlock; problem: string | null; lines: string[]; fight?: boolean }
const I = (data: EvilData) => data.edges.incursions;
const no = (block: EvilModeBlock, problem: string): TearOut => ({ block, problem, lines: [] });
const withEdges = (block: EvilModeBlock, e: Partial<EdgesState>): EvilModeBlock => ({ ...block, edges: { ...block.edges, ...e } });

/** Incursions run in this run (Settings > Ultra Beast Incursions, copied at founding; and the data's switch). */
export const incursionsOn = (block: EvilModeBlock, data: EvilData = EVIL_DATA): boolean => block.settings.incursions && I(data).on;

/** The Tear open now in the district being played, or null. */
export function openTear(block: EvilModeBlock): TearState | null {
  const t = block.edges.tear;
  return t && !t.over && block.district && t.region === block.here.region && t.district === block.district.n ? t : null;
}

export const beastOf = (id: string): UltraBeast => BEAST_BY_ID.get(id)!;
const regionId = (block: EvilModeBlock, data: EvilData) => data.region.regions.find((r) => r.index === block.here.region)?.id ?? '';
const regardBy = (block: EvilModeBlock, data: EvilData) => (regionId(block, data) === 'unova' ? I(data).numbers.regardUnova : I(data).numbers.regard);

// ---- Appetites (Part 27 section 4.2): each counts something the Roster does ----

/** What changed between two blocks, counted into the ten tallies. Called after every step. */
export function tally(before: EvilModeBlock, block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  const N = I(data).numbers;
  const e = block.edges;
  const add: Record<string, number> = {};
  const inc = (k: string, n = 1) => { if (n > 0) add[k] = (add[k] ?? 0) + n; };
  const day = block.here.day;
  // Dependence: the Boss went out in person today (a Purify is the Lab's business, not a job).
  if (block.inPerson && block.inPerson.day === day && block.inPerson.holdingId !== 'lab' && before.inPerson?.day !== day) inc('dependence');
  let squads = e.squads;
  let heatAtMorning = e.heatAtMorning;
  // The Evening: Outplay wins, Takes, luck that looks like skill, Funds sat on, a quiet day, a standing squad.
  if (before.here.beat !== 'evening' && block.here.beat === 'evening') {
    for (const s of block.sheets) {
      if (s.method === 'outplay' && s.won) inc('strength');
      if (s.method === 'take' && s.won) inc('consumption');
      if (s.won && !s.certain && s.odds < N.lowOdds) inc('precision');
      const key = [...s.squad].sort().join('+');
      if (s.squad.length > 1) {
        const n = (squads[key] ?? 0) + 1;
        squads = { ...squads, [key]: n };
        if (n === N.squadDays) inc('formation');
      }
    }
    if (block.team.funds > N.fundsSat) inc('charge');
    if (!before.queue.length) inc('patience');
  }
  // A loud day: Heat +2 or more since the last Morning.
  if (before.here.beat !== 'morning' && block.here.beat === 'morning') {
    if (block.team.heat - heatAtMorning >= N.loudHeat) inc('spectacle');
    heatAtMorning = block.team.heat;
  }
  // A district with no failed job.
  if (!before.district?.end && block.district?.end) {
    const d = block.district;
    if (!block.log.some((l) => l.kind === 'job' && l.result === 'didnt' && l.region === d.region && l.district === d.n)) inc('flawlessness');
    squads = {};
  }
  // People who left (nobody writes to them: the mode has no letters to the gone).
  for (const c of block.crew) if (c.where === 'left' && before.crew.find((x) => x.id === c.id)?.where === 'in') inc('longing');
  if (!Object.keys(add).length && squads === e.squads && heatAtMorning === e.heatAtMorning) return block;
  const appetites = { ...e.appetites };
  for (const [k, n] of Object.entries(add)) appetites[k] = (appetites[k] ?? 0) + n;
  return withEdges(block, { appetites, squads, heatAtMorning });
}

/** The Meteor's stone put back (Part 27 section 4.7): every tally −2, never below nought. */
export function stoneBack(block: EvilModeBlock): EvilModeBlock {
  return withEdges(block, { appetites: Object.fromEntries(Object.entries(block.edges.appetites).map(([k, n]) => [k, Math.max(0, n - 2)])) });
}

/** The first Beast whose Appetite has crossed and that hasn't come this run (one at a time; Poipole follows instead). */
export function beastToCall(block: EvilModeBlock): UltraBeast | null {
  const e = block.edges;
  if (e.static || openTear(block) || e.incursion) return null;
  return INVADERS.find((b) => b.appetite && !e.met.includes(b.id) && (e.appetites[b.appetite] ?? 0) >= b.threshold) ?? null;
}

// ---- Static, the Tear, the Incursion ----

/** Static's lines (Part 27 section 4.3): the Radio, a bark from an Eyes, a kit, the cat, the Night's knock, the Hero's File. */
export function staticLines(block: EvilModeBlock, data: EvilData = EVIL_DATA): string[] {
  const S = I(data).static;
  const inn = block.crew.filter((c) => c.where === 'in');
  const eyes = inn.find((c) => c.talent === 'eyes') ?? inn[0];
  const grunt = inn.find((c) => c.rank === 'grunt') ?? inn[0];
  const kiele = inn.find((c) => c.ref === 'kiele');
  return [S.lead, S.radio, ...(eyes ? [fill(S.bark, { name: eyes.name })] : []), ...(grunt ? [fill(S.kit, { name: grunt.name })] : []), S.cat, kiele ? S.knockKiele : fill(S.knock, { name: inn.at(-1)?.name ?? 'Whoever was on the roof' })];
}

/** Where a Tear opens: the held holding whose person is fondest of the team (mood first; the earliest step on a tie). */
export function tearHolding(block: EvilModeBlock): Holding | null {
  const held = (block.district?.holdings ?? []).filter((h) => h.owner === 'team');
  const rank = (h: Holding) => (h.mood ? MOODS.indexOf(h.mood) : MOODS.length);
  return [...held].sort((a, b) => rank(a) - rank(b) || a.step - b.step)[0] ?? null;
}

/** Who comes to look (Part 27 section 4.4). */
export function whoComes(block: EvilModeBlock, data: EvilData = EVIL_DATA): string[] {
  const W = I(data).tear.who;
  const nb = block.neighbour?.id;
  return [W.district, W.detective, ...(nb ? [W.neighbour[nb] ?? W.neighbour.other!] : []), ...(block.hero ? [W.hero] : []), ...(runIndex(block) >= I(data).numbers.lookerFromRegion ? [W.looker] : [])];
}

/** The Morning: Static comes the day after a tally crosses; the Tear opens the Morning after that, over a held holding. */
export function edgesMorning(block: EvilModeBlock, data: EvilData = EVIL_DATA): { block: EvilModeBlock; lines: string[] } {
  let b = block;
  const lines: string[] = [];
  const e = b.edges;
  // Poipole follows; it doesn't invade (Part 27 section 4.6).
  const pp = ULTRA_BEASTS.find((x) => x.id === 'ub-adhesive');
  if (pp && !e.poipole && (e.appetites.longing ?? 0) >= pp.threshold) {
    b = withEdges(b, { poipole: { day: b.here.day, plates: 0 } });
    lines.push(I(data).beast.poipole);
  }
  const call = beastToCall(b);
  if (call && !b.district?.end) b = withEdges(b, { static: { beastId: call.id, day: b.here.day + 1 } });
  const st = b.edges.static;
  if (st && st.day === b.here.day) {
    lines.push(...staticLines(b, data));
    if (b.hero && !b.hero.learned.includes(I(data).static.hero)) b = { ...b, hero: { ...b.hero, learned: [...b.hero.learned, I(data).static.hero] } };
  } else if (st && st.day < b.here.day && !b.district?.end) {
    const h = tearHolding(b);
    if (h && b.district) {
      const beast = beastOf(st.beastId);
      const tear: TearState = { beastId: beast.id, rule: beast.ultraRule, holdingId: h.id, region: b.here.region, district: b.district.n, openedDay: b.here.day, choice: null, holdBy: [], cardId: null, over: null };
      b = withEdges(b, { static: null, tear, met: [...b.edges.met, beast.id] });
      const T = I(data).tear;
      const name = holdingName(h, data);
      const opens = fill(T.opens, { holding: name, who: 'Half the street' });
      lines.push(opens, fill(T.rule, { rule: `${beast.ruleName}: ${beast.ruleText}` }), fill(T.pays, { holding: name }), ...whoComes(b, data));
      b = appendLog(b, { kind: 'tear', who: [], to: h.id, text: `Day ${b.here.day}. ${opens}` });
    }
  }
  // Three days: then it comes out by itself.
  const t = openTear(b);
  if (t && b.here.day >= t.openedDay + I(data).numbers.tearDays) {
    const held = t.choice === 'hold';
    b = withEdges(b, { tear: { ...t, over: 'out', holdBy: [] }, incursion: held ? null : { beastId: t.beastId, empty: false } });
    const line = held ? I(data).tear.heldOut : I(data).tear.comesOut;
    lines.push(line);
    b = appendLog(b, { kind: 'tear', who: [], to: t.holdingId, text: `Day ${b.here.day}. ${line}` });
  }
  // A Beast in the building: Homesick falls while the team does what drew it, and rises when it doesn't.
  const kept = b.edges.beast;
  if (kept) {
    const beast = beastOf(kept.beastId);
    const now = beast.appetite ? b.edges.appetites[beast.appetite] ?? 0 : 0;
    const homesick = Math.max(0, Math.min(10, kept.homesick + (now > kept.lastTally ? -1 : 1)));
    if (homesick >= I(data).numbers.homesickLeave) {
      b = withEdges(b, { beast: null });
      b = { ...b, applied: [...b.applied, `beast-left:${kept.uid}`] };
      lines.push(fill(I(data).beast.leaves, { beast: beast.name }));
    } else b = withEdges(b, { beast: { ...kept, homesick, lastTally: now } });
  }
  return { block: b, lines };
}

/** A district that ends with a Tear open closes it; an Incursion still waiting goes with it. */
export function edgesDistrictEnd(block: EvilModeBlock): EvilModeBlock {
  const t = block.edges.tear;
  if (!t || t.over) return block.edges.incursion ? withEdges(block, { incursion: null }) : block;
  return withEdges(block, { tear: { ...t, over: 'ended', holdBy: [] }, incursion: null });
}

/** Six on the street are on nothing else. */
export function tearBusy(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA): string | null {
  const t = openTear(block);
  if (!t || !t.holdBy.includes(id)) return null;
  return fill(I(data).tear.holding, { name: block.crew.find((c) => c.id === id)?.name ?? id });
}

/** What a Tear pays (Part 27 section 4.4): the holding nothing, its street half. `stripped`: a Rig's ground pays nothing. */
export function tearPay(block: EvilModeBlock, data: EvilData = EVIL_DATA): { zero: string[]; half: string[] } {
  const zero = [...(block.edges.shadow?.rigged ?? [])];
  const t = openTear(block);
  if (!t) return { zero, half: [] };
  const hs = block.district?.holdings ?? [];
  const at = hs.find((h) => h.id === t.holdingId);
  const st = at ? streetOf(at.step, data) : -1;
  return { zero: [...zero, t.holdingId], half: hs.filter((h) => h.id !== t.holdingId && streetOf(h.step, data) === st).map((h) => h.id) };
}

// ---- The Card ("We don't know." three times) and the four choices ----

/** Why a choice can't be taken now, or null. */
export function choiceProblem(block: EvilModeBlock, choice: TearChoice, data: EvilData = EVIL_DATA): string | null {
  const W = I(data).tear.why;
  const t = openTear(block);
  if (!t) return W.none;
  if (t.choice) return W.chosen;
  if (choice === 'together' && (!block.hero || block.hero.temper < I(data).numbers.togetherTemper)) return W.together;
  if (choice === 'through' || choice === 'together') {
    if (block.here.beat !== 'inPerson') return W.inPerson;
    if (block.inPerson?.day === block.here.day) return W.used;
  }
  if (choice === 'hold' && freeForStreet(block).length < I(data).numbers.holdGrunts) return W.six;
  return null;
}

/** Grown, in, not on a job or posted today. */
function freeForStreet(block: EvilModeBlock) {
  return block.crew.filter((c) => c.where === 'in' && !c.minor && !block.queue.some((j) => j.squad.includes(c.id)) && !block.posted.some((p) => p.id === c.id));
}

/** The Tear's Honest Card. Takes, Gives and Not known read "We don't know."; CONFIRM's still there. */
export function tearCard(block: EvilModeBlock, choice: TearChoice, data: EvilData = EVIL_DATA): CardField[] {
  const T = I(data).tear;
  const C = T.card;
  const t = openTear(block) ?? block.edges.tear!;
  const h = block.district?.holdings.find((x) => x.id === t.holdingId);
  const name = h ? holdingName(h, data) : t.holdingId;
  const labels = data.ledger.fields;
  const going = choice === 'hold' ? freeForStreet(block).slice(0, I(data).numbers.holdGrunts).map((c) => c.name).join(', ') : choice === 'leave' ? 'Nobody.' : choice === 'together' ? 'The Boss, and the kid.' : 'The Boss.';
  const region = data.region.regions.find((r) => r.index === block.here.region)?.name ?? '';
  const texts: [string, boolean][] = [
    [fill(C.name, { holding: name.toUpperCase() }), false],
    [T.unknown, true],
    [fill(C.from, { holding: name }), false],
    [T.unknown, true],
    [fill(C.moves, { n: regardBy(block, data), region, days: I(data).numbers.tearDays }), false],
    [C.odds, false],
    [fill(C.going, { going }), false],
    [C.wont, false],
    [fill(C.holds, { days: I(data).numbers.tearDays }), false],
    [C.hero, false],
    [T.unknown, true],
    [fill(C.written, { day: block.here.day, holding: name, did: T.choices[choice].did }), false],
    [C.other, false],
  ];
  return texts.map(([text, unknown], i) => ({ label: labels[i]!, text, unknown }));
}

/** Confirm a choice on the Tear's Card (Part 27 section 4.5). Going through starts the fight; holding takes six off jobs. */
export function chooseTear(block: EvilModeBlock, choice: TearChoice, data: EvilData = EVIL_DATA): TearOut {
  const p = choiceProblem(block, choice, data);
  if (p) return no(block, p);
  const t = openTear(block)!;
  const card = tearCard(block, choice, data);
  const cardId = `E${block.edges.cards.length + 1}`;
  const holdBy = choice === 'hold' ? freeForStreet(block).slice(0, I(data).numbers.holdGrunts).map((c) => c.id) : [];
  const by = regardBy(block, data);
  const regard = Math.max(0, Math.min(10, block.team.regard + (choice === 'leave' ? -by : by)));
  let b = withEdges(block, { tear: { ...t, choice, holdBy, cardId }, cards: [...block.edges.cards, { id: cardId, day: block.here.day, kind: 'tear', fields: card.map((f) => (f.unknown ? f : f.text)) }] });
  b = { ...b, team: { ...b.team, regard } };
  b = appendLog(b, { kind: 'tear', who: holdBy, to: t.holdingId, cardId, text: card[11]!.text, unknowns: card.filter((f) => f.unknown).length });
  if (choice === 'through' || choice === 'together') {
    b = { ...b, inPerson: { day: b.here.day, holdingId: t.holdingId }, fight: { kind: 'tear', holdingId: t.holdingId, begun: false } };
    return { block: b, problem: null, lines: [I(data).tear.choices[choice].sub], fight: true };
  }
  return { block: b, problem: null, lines: [I(data).tear.choices[choice].sub] };
}

/** The fight through the Tear, or the Incursion's, is over. Caught: it's the team's, Homesick at nought. */
export function tearResult(block: EvilModeBlock, won: boolean, caught: string | null, data: EvilData = EVIL_DATA): TearOut {
  const f = block.fight!;
  const T = I(data).tear;
  let b: EvilModeBlock = { ...block, fight: null };
  const t = b.edges.tear;
  const lines: string[] = [];
  const beastId = f.kind === 'incursion' ? b.edges.incursion?.beastId ?? t?.beastId : t?.beastId;
  if (f.kind === 'tear' && t) {
    if (won || caught) {
      b = withEdges(b, { tear: { ...t, over: 'closed', holdBy: [] } });
      lines.push(fill(T.won, { holding: holdingName(b.district!.holdings.find((h) => h.id === t.holdingId)!, data) }));
    } else lines.push(T.lost);
    if (t.choice === 'together' && b.hero) {
      b = withEdges(b, { together: true });
      if (!b.hero!.learned.includes(T.togetherFile)) b = { ...b, hero: { ...b.hero!, learned: [...b.hero!.learned, T.togetherFile], marks: b.hero!.marks + 1 } };
      lines.push(T.together);
    }
  }
  if (f.kind === 'incursion') {
    b = withEdges(b, { incursion: null });
    lines.push(T.fought);
  }
  if (caught && beastId) {
    const beast = beastOf(beastId);
    b = withEdges(b, { beast: { uid: caught, beastId, homesick: 0, lastTally: beast.appetite ? b.edges.appetites[beast.appetite] ?? 0 : 0 } });
    lines.push(T.caught);
  }
  b = appendLog(b, { kind: 'tear', who: [], to: f.holdingId, text: `Day ${b.here.day}. ${lines[0] ?? T.fought}` });
  return { block: b, problem: null, lines };
}

/** At Send, an Incursion waiting meets the first squad going out: nobody wins; it goes back. */
export function incursionAtSend(block: EvilModeBlock, data: EvilData = EVIL_DATA): { block: EvilModeBlock; lines: string[] } {
  const inc = block.edges.incursion;
  const j = block.queue[0];
  if (!inc || !j || !block.district) return { block, lines: [] };
  const h = block.district.holdings.find((x) => x.id === j.holdingId);
  const names = j.squad.map((id) => block.crew.find((c) => c.id === id)?.name ?? id).join(', ');
  const line = fill(I(data).tear.metSquad, { squad: names, holding: h ? holdingName(h, data) : j.holdingId });
  let b: EvilModeBlock = withEdges({ ...block, queue: block.queue.slice(1) }, { incursion: null });
  b = appendLog(b, { kind: 'job', who: [...j.squad], to: j.holdingId, method: j.method, ...(j.cardId ? { cardId: j.cardId } : {}), result: 'didnt', text: `Day ${b.here.day}. ${line}` });
  return { block: b, lines: [line] };
}

/** A plate for Poipole. It can't be sent on a job. */
export function givePlate(block: EvilModeBlock, data: EvilData = EVIL_DATA): TearOut {
  const p = block.edges.poipole;
  if (!p) return no(block, 'There is nothing to put a plate out for.');
  return { block: withEdges(block, { poipole: { ...p, plates: p.plates + 1 } }), problem: null, lines: [I(data).beast.plated] };
}

/** The Roster on the Beast in the building, by flaw (Part 27 section 4.6). */
export function beastLines(block: EvilModeBlock, data: EvilData = EVIL_DATA): string[] {
  const kept = block.edges.beast;
  if (!kept) return [];
  const B = I(data).beast;
  const beast = beastOf(kept.beastId);
  const key = beast.name.toLowerCase();
  const out = [fill(B.home, { beast: beast.name, room: B.rooms[key] ?? '', n: kept.homesick }), B.falls];
  for (const c of block.crew.filter((x) => x.where === 'in' && x.flaw && x.flawFound).slice(0, 3)) out.push(fill(B.flaws[c.flaw!] ?? B.flaws.other!, { name: c.name }));
  return out;
}

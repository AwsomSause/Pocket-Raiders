// Evil Mode's mole (design Part 11). Pure: new blocks are returned. Every roll is on `evil-mole`; with the mole switched
// off (mole.json `on`) each draw is still taken and nothing it decides is used, so the streets are the same. The mole is
// a field of the block's hidden state (`block.mole`): no card, face, sort order or screen model reads it until they're
// found (tests/unit/evilModeLongCast.test.ts checks the Roster and Board models byte for byte).

import { EVIL_DATA, type EvilData } from './data';
import { appendLog, fill } from './ledger';
import { inRoster, moveLoyalty } from './people';
import { streetOf } from './board';
import { districtAt, drawMole, runOf } from './quest';
import { HANDLERS, type Crew, type EvilModeBlock, type Handler, type Holding, type JobMethod, type MoleState, type OddsTerm } from './schema';

type Out = { block: EvilModeBlock; problem: string | null; lines: string[] };
const no = (block: EvilModeBlock, problem: string): Out => ({ block, problem, lines: [] });
const M = (data: EvilData) => data.mole;
const setMole = (block: EvilModeBlock, m: Partial<MoleState>): EvilModeBlock => ({ ...block, mole: { ...block.mole, ...m } });
const cap = (n: number) => Math.max(0, Math.min(10, n));

export const moleOn = (data: EvilData = EVIL_DATA): boolean => M(data).on;
/** The mole, if hired and still on the Roster. */
export const moleCrew = (block: EvilModeBlock): Crew | undefined => (block.mole.who ? block.crew.find((c) => c.id === block.mole.who && c.where === 'in') : undefined);

/** Reporting now: switched on, hired, in, and neither quiet this district, stopped nor turned. */
export function reporting(block: EvilModeBlock, data: EvilData = EVIL_DATA): boolean {
  if (!moleOn(data) || block.mole.state !== 'reporting' || !moleCrew(block)) return false;
  return block.mole.quietUntil !== districtAt(block);
}

/**
 * The handler (Part 11 section 2), rolled once on `evil-mole` the first time the team has a district. Weights: the police
 * 3 in 10 (5 from Heat 7), the neighbour 3, a local 2, the Hero's mother 2.
 */
export function ensureHandler(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  if (block.mole.handler || !block.district) return block;
  const R = M(data).rules;
  const w = HANDLERS.map((h) => (h === 'police' && block.team.heat >= R.hotHeat ? R.policeHot : R.weights[h]));
  const d = drawMole(block, w.reduce((a, b) => a + b, 0));
  let r = d.r;
  let handler: Handler = 'mother';
  for (let i = 0; i < HANDLERS.length; i++) {
    r -= w[i]!;
    if (r <= 0) { handler = HANDLERS[i]!; break; }
  }
  const s = drawMole(d.block, 4);
  return setMole(s.block, { handler, street: handler === 'local' ? s.r - 1 : null });
}

/** Whether a mark can be made today: from District 2 of the first region; a second a district on; a third a region on. */
function markDue(block: EvilModeBlock, data: EvilData): boolean {
  const m = block.mole;
  if (m.marked || m.who || m.marks >= 3 || m.state !== 'none' || !block.district) return false;
  if (m.marks === 0) return runOf(block) > 0 || block.district.n >= M(data).rules.firstDistrict;
  const [run] = (m.markedAt ?? '0:0').split(':').map(Number);
  if (m.marks === 1) return m.markedAt !== districtAt(block);
  return run! < runOf(block);
}

/** After the Morning's applicants arrive: one of today's is marked (never a minor), drawn on `evil-mole`. Nothing on their card changes. */
export function markApplicant(block: EvilModeBlock, fresh: readonly string[], data: EvilData = EVIL_DATA): EvilModeBlock {
  const b0 = ensureHandler(block, data);
  const pool = fresh.filter((ref) => !data.people.people.find((p) => p.id === ref)?.minor);
  if (!pool.length || !markDue(b0, data)) return b0;
  const d = drawMole(b0, pool.length);
  return setMole(d.block, { marked: pool[d.r - 1]!, markedAt: districtAt(d.block), marks: b0.mole.marks + 1 });
}

/** Hired: the marked applicant is the mole, from today. */
export function onHire(block: EvilModeBlock, ref: string, crewId: string): EvilModeBlock {
  return block.mole.marked === ref ? setMole(block, { marked: null, who: crewId, state: 'reporting' }) : block;
}

/** Turned away, or gone after waiting: never the mole afterward. Three refused and the handler works from outside. */
export function onRefuse(block: EvilModeBlock, ref: string): EvilModeBlock {
  if (block.mole.marked !== ref) return block;
  return setMole(block, { marked: null, markedAt: districtAt(block), state: block.mole.marks >= 3 ? 'outside' : 'none' });
}

/** The street (0..3) a local's mole warns. */
const moleStreet = (block: EvilModeBlock): number | null => (block.mole.handler === 'local' ? block.mole.street : null);

/** Odds terms the mole adds (Part 11 section 2): the neighbour's expects every Take; a local's street is ready for a Lean. A fed neighbour's off elsewhere. */
export function moleTerms(block: EvilModeBlock, h: Holding, method: JobMethod, data: EvilData = EVIL_DATA): OddsTerm[] {
  const out: OddsTerm[] = [];
  if (moleOn(data) && block.mole.boost === block.here.day && method !== 'scout') out.push({ label: M(data).fedLabel, value: M(data).rules.feedBoost });
  if (!block.mole || !reporting(block, data)) return out;
  if (block.mole.handler === 'neighbour' && method === 'take') out.push({ label: M(data).knownLabel, value: M(data).rules.odds });
  if (block.mole.handler === 'local' && method === 'lean' && streetOf(h.step, data) === moleStreet(block)) out.push({ label: M(data).streetLabel, value: M(data).rules.odds });
  return out;
}

/** A method the police's mole asked the Boss to stop, for the region (Part 11 section 7.3): refused by Dispatch. */
export function moleStops(block: EvilModeBlock, method: JobMethod): string | null {
  const s = block.mole?.stopped;
  return s && s.method === method && s.run === runOf(block) && block.mole.state === 'turned' && block.mole.handler === 'police' ? "You said you'd stop that one. For this region." : null;
}

// ---- The district's end: reports, tells, the police's heat, the neighbour's wage, a poach (Part 11 sections 3-5) ----

const fairness = (block: EvilModeBlock): 'fair' | 'mixed' | 'hard' => (block.team.regard > block.team.dread + 1 ? 'fair' : block.team.dread > block.team.regard + 1 ? 'hard' : 'mixed');

/** Adds a slip (tell n, about a person) once. */
function slip(m: MoleState, day: number, tell: number, about: string): MoleState {
  return m.slips.some((s) => s.tell === tell && s.about === about) ? m : { ...m, slips: [...m.slips, { day, tell, about }] };
}

/** The district's jobs, by person: went and didn't. */
function districtJobs(block: EvilModeBlock): { who: string[]; went: boolean }[] {
  const d = block.district;
  if (!d) return [];
  return block.log.filter((e) => e.kind === 'job' && e.region === d.region && e.district === d.n && (e.result === 'went' || e.result === 'didnt')).map((e) => ({ who: e.who, went: e.result === 'went' }));
}

/** Whether a Medium Listening Post, run by an Eyes who isn't the mole, catches one report a district. */
function postCatches(block: EvilModeBlock, data: EvilData): boolean {
  const R = M(data).rules;
  return !!block.base?.rooms.some((r) => r.type === R.postRoom && r.size >= R.postSize && !!r.staff && r.staff !== block.mole.who && block.crew.some((c) => c.id === r.staff && c.where === 'in' && c.talent === 'eyes'));
}

/**
 * Once a district, at its end. The mole (when reporting) writes one report; the police's is Heat +1 "reason not known"
 * (+2 if they've soured); a found report reaches the post. Tells are pinned, for the mole and for the innocents who show
 * the same. Turned: the police's file reads well (Heat −1 to 3), the neighbour's is paid. Anyone Leaving may be poached.
 */
export function moleDistrictEnd(block: EvilModeBlock, data: EvilData = EVIL_DATA): { block: EvilModeBlock; lines: string[] } {
  const d = block.district;
  if (!d?.end) return { block, lines: [] };
  const key = `mole:end:${districtAt(block)}`;
  if (block.applied.includes(key)) return { block, lines: [] };
  let b: EvilModeBlock = ensureHandler({ ...block, applied: [...block.applied, key] }, data);
  const R = M(data).rules;
  const lines: string[] = [];
  const day = b.here.day;
  const mole = moleCrew(b);
  const on = reporting(b, data);
  // The report.
  if (on && b.mole.handler) {
    const leaned = b.log.some((e) => e.kind === 'job' && e.method === 'lean' && e.region === d.region && e.district === d.n);
    const i = leaned && b.mole.handler !== 'neighbour' ? M(data).leanReport : Math.min(5, b.mole.reports);
    const text = M(data).reports[b.mole.handler][i]!;
    b = setMole(b, { reports: b.mole.reports + 1, post: postCatches(b, data) ? [...b.mole.post, { day, text }] : b.mole.post });
    if (b.mole.handler === 'police') {
      const up = (mole?.loyalty ?? 5) < R.sourBelow ? R.policeHeatSour : R.policeHeat;
      b = { ...b, team: { ...b.team, heat: cap(b.team.heat + up) } };
      b = appendLog(b, { kind: 'law', who: [], text: `Day ${day}. ${M(data).heatLine}` });
    }
  }
  // Quiet for a district after being fed: it ends with the district.
  if (b.mole.quietUntil === districtAt(b)) b = setMole(b, { quietUntil: null });
  // Turned.
  if (moleOn(data) && b.mole.state === 'turned' && mole) {
    if (b.mole.handler === 'police') b = { ...b, team: { ...b.team, heat: Math.max(Math.min(b.team.heat, R.turnHeatFloor), b.team.heat - 1) } };
    if (b.mole.handler === 'neighbour') {
      const days = Math.max(1, day - (d.from ?? 1) + 1);
      const pay = R.turnPay * days;
      if (b.team.funds >= pay) b = { ...b, team: { ...b.team, funds: b.team.funds - pay } };
      else b = setMole(b, { state: 'reporting' });
      // A region on, the other lot offer more: one in three, unless they're at Loyalty 7 or more.
      const rk = `mole:rebuy:${runOf(b)}`;
      if (runOf(b) > 0 && !b.applied.includes(rk)) {
        const r = drawMole({ ...b, applied: [...b.applied, rk] }, R.rebuy[1]);
        b = r.block;
        if (r.r <= R.rebuy[0]) {
          if (mole.loyalty >= R.rebuyLoyalty) lines.push(fill(M(data).turn.refusedOffer, { name: mole.name }));
          else { b = setMole(b, { state: 'reporting' }); lines.push(fill(M(data).turn.rebought, { name: mole.name })); }
        }
      }
    }
  }
  // A local's: turned by stopping. Asked, and a district with no Lean on that street.
  if (moleOn(data) && b.mole.handler === 'local' && b.mole.stopped?.method === 'street' && b.mole.state === 'reporting') {
    const leanedThere = b.log.some((e) => e.kind === 'job' && e.method === 'lean' && e.region === d.region && e.district === d.n && streetOf(d.holdings.find((h) => h.id === e.to)?.step ?? 1, data) === b.mole.street);
    if (!leanedThere) b = setMole(b, { state: 'turned' });
  }
  // A quest done stops the reporting, found or not (Part 11 section 11).
  if (mole && b.quests[mole.id]?.state === 'done' && (b.mole.state === 'reporting')) b = setMole(b, { state: 'stopped' });
  b = { ...b, mole: tells(b, data) };
  const p = poach(b, data);
  return { block: p.block, lines: [...lines, ...p.lines] };
}

/** The six tells (Part 11 section 5), pinned as slips: the mole's (only while they report) and the innocents' who show the same. */
function tells(block: EvilModeBlock, data: EvilData): MoleState {
  let m = block.mole;
  const day = block.here.day;
  const ins = inRoster(block);
  const mole = reporting(block, data) || (moleOn(data) && block.mole.state === 'quiet') ? moleCrew(block) : undefined;
  const jobs = districtJobs(block);
  // 1: a job failed with them on it (innocents: anyone who Doubts).
  for (const j of jobs) if (!j.went) for (const id of j.who) {
    const c = ins.find((x) => x.id === id);
    if (c && (c.id === mole?.id || c.flaw === 'doubts')) m = slip(m, day, 1, id);
  }
  // 5: asked for the Post (every Eyes; the mole).
  for (const c of ins) if (c.talent === 'eyes' || c.id === mole?.id) m = slip(m, day, 5, c.id);
  // 2: a question at Night (the first Eyes; the mole).
  const eyes = ins.find((c) => c.talent === 'eyes');
  if (eyes) m = slip(m, day, 2, eyes.id);
  if (mole) m = slip(m, day, 2, mole.id);
  // 4: wages not spent (anyone saving for a quest of something owed; the mole).
  for (const c of ins) if ((block.quests[c.id]?.state === 'open' && data.people.people.find((p) => p.id === c.ref)?.shape === 'owed') || c.id === mole?.id) m = slip(m, day, 4, c.id);
  // 3 and 6, at the region's last district: never hurt (a Nerve who's good), too good (a quest done).
  if ((block.district?.n ?? 0) >= 6) {
    for (const c of ins) if ((c.talent === 'nerve' && c.jobs >= 2) || c.id === mole?.id) m = slip(m, day, 3, c.id);
    for (const c of ins) if (block.quests[c.id]?.state === 'done' || c.id === mole?.id) m = slip(m, day, 6, c.id);
  }
  return m;
}

/** Anyone Leaving (Loyalty under 3) may be poached by a standing neighbour: one in three (the fifth way to leave). */
function poach(block: EvilModeBlock, data: EvilData): { block: EvilModeBlock; lines: string[] } {
  const R = M(data).rules;
  if (!block.neighbour || block.neighbour.fallen) return { block, lines: [] };
  let b = block;
  const lines: string[] = [];
  for (const c of inRoster(block)) {
    if (c.loyalty >= R.poachBelow || c.minor || c.id === 'patron') continue;
    const d = drawMole(b, R.poach[1]);
    b = d.block;
    if (d.r > R.poach[0]) continue;
    const line = fill(M(data).poached, { name: c.name });
    b = { ...b, crew: b.crew.map((x) => (x.id === c.id ? { ...x, where: 'left' as const, left: { day: b.here.day, how: 'poached' as const } } : x)) };
    b = appendLog(b, { kind: 'leave', who: [c.id], text: `Day ${b.here.day}. ${line}` });
    lines.push(line);
  }
  return { block: b, lines };
}

/** Night: a mole at Loyalty 8 or more, not found, comes to the Office on their own. Once. */
export function moleNight(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  const mole = moleCrew(block);
  if (!moleOn(data) || !mole || block.mole.knocked || block.mole.found || block.mole.scene || mole.loyalty < M(data).rules.knockAt) return block;
  if (!['reporting', 'quiet', 'stopped'].includes(block.mole.state)) return block;
  return setMole(block, { knocked: true, scene: { kind: 'knock', about: mole.id, lines: M(data).knock.lines } });
}

/** The Patron's line, once, at the first Arrival's first Morning (Part 11 section 1). Then never again by the game. */
export function patronWarns(block: EvilModeBlock, data: EvilData = EVIL_DATA): { block: EvilModeBlock; line: string | null } {
  if (!moleOn(data) || !block.team.patron || runOf(block) > 0 || block.applied.includes('mole:patron')) return { block, line: null };
  return { block: { ...block, applied: [...block.applied, 'mole:patron'] }, line: M(data).patron };
}

// ---- What the Boss can do (Part 11 sections 6 and 7) ----

const leave = (block: EvilModeBlock, id: string, how: 'sent' | 'loyalty', line: string): EvilModeBlock => {
  const b = { ...block, crew: block.crew.map((c) => (c.id === id ? { ...c, where: 'left' as const, left: { day: block.here.day, how } } : c)) };
  return appendLog(b, { kind: 'leave', who: [id], text: `Day ${block.here.day}. ${line}` });
};

/**
 * Name them (Part 11 section 6), at Night. Right: they're called to the Office and say who sent them. Wrong: an innocent
 * remembers (Loyalty −4 to a floor of 1, every Heart −2; a minor goes by morning), and a second wrong guess puts the
 * Roster's ceiling at 8 for the region. The real mole's state never changes by a wrong guess.
 */
export function nameThem(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA): Out {
  if (block.here.beat !== 'night') return no(block, 'At Night, in the Office.');
  if (block.mole.scene) return no(block, 'Somebody is in the Office already.');
  const c = block.crew.find((x) => x.id === id && x.where === 'in');
  if (!c) return no(block, 'Not on the Roster.');
  if (moleOn(data) && id === block.mole.who && !block.mole.found && block.mole.handler) {
    const lines = [M(data).found[block.mole.handler]];
    return { block: setMole(block, { found: true, scene: { kind: 'found', about: id, lines } }), problem: null, lines };
  }
  const W = M(data).rules.wrong;
  const scene = fill(M(data).wrong.scene, { name: c.name });
  let b: EvilModeBlock = { ...block, crew: block.crew.map((x) => (x.id === id ? { ...x, loyalty: Math.max(W.floor, x.loyalty + W.loyalty) } : x)) };
  b = appendLog(b, { kind: 'office', who: [id], text: `Day ${block.here.day}. ${c.name}: ${M(data).wrong.history}` });
  const lines = [scene];
  if (c.minor) {
    const gone = fill(M(data).wrong.minor, { name: c.name });
    b = leave(b, id, 'loyalty', gone);
    b = { ...b, crew: b.crew.map((x) => (x.where === 'in' && x.talent === 'heart' ? moveLoyalty(x, W.hearts, data) : x)) };
    lines.push(gone);
  }
  const wrong = [...b.mole.wrong, id];
  b = setMole(b, { wrong, ceiling: wrong.length >= 2 ? runOf(b) : b.mole.ceiling, scene: { kind: 'wrong', about: id, lines } });
  if (wrong.length >= 2) lines.push(M(data).wrong.ceiling);
  return { block: b, problem: null, lines };
}

/**
 * Feed them (Part 11 section 7.1): a false job with one suspect named, once a district, from Dispatch. It works if the
 * suspect's the mole, or two in three if not (they heard it in the Common Room). The roll's taken either way.
 */
export function feed(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA): Out {
  const S = M(data).screen;
  const c = block.crew.find((x) => x.id === id && x.where === 'in');
  if (!c) return no(block, 'Not on the Roster.');
  if (block.here.beat !== 'dispatch') return no(block, 'At Dispatch, with the Board.');
  if (c.line === 35) return no(block, fill(S.feedRefuses!, { name: c.name }));
  if (block.mole.fedAt === districtAt(block)) return no(block, S.fedOnce!);
  const R = M(data).rules;
  const d = drawMole(setMole(block, { fedAt: districtAt(block) }), R.feedHits[1]);
  let b = d.block;
  const mole = moleCrew(b);
  const hit = reporting(b, data) && !!mole && (id === mole.id || d.r <= R.feedHits[0]);
  b = appendLog(b, { kind: 'office', who: [id], text: `Day ${b.here.day}. A false job on the Board, ${c.name} named on it. Nobody sent.` });
  if (!hit || !mole || !b.mole.handler) return { block: b, problem: null, lines: [M(data).fed.nothing] };
  const h = b.mole.handler;
  const lines = [M(data).fed[h]];
  if (h === 'police') b = { ...b, team: { ...b.team, heat: cap(b.team.heat + R.feedHeat) } };
  if (h === 'neighbour') b = setMole(b, { boost: b.here.day });
  if (h === 'local') b = { ...b, team: { ...b.team, regard: cap(b.team.regard - 1) } };
  // They know they've been made: under 4 they run; 4 to 7 they go quiet for a district; 8 or more they knock.
  if (mole.loyalty < 4) {
    const line = fill(M(data).ran, { name: mole.name });
    b = setMole(leave(b, mole.id, 'sent', line), { state: 'gone' });
    lines.push(line);
  } else if (mole.loyalty < R.knockAt) b = setMole(b, { state: 'quiet', quietUntil: districtAt(b) });
  else if (!b.mole.knocked) b = setMole(b, { knocked: true, scene: { kind: 'knock', about: mole.id, lines: M(data).knock.lines } });
  return { block: b, problem: null, lines };
}

/** The dark method this region has used most (the police's "stop one thing"), or Lean. */
function mostUsedDark(block: EvilModeBlock): JobMethod {
  const n: Record<string, number> = { lean: 0, take: 0, expose: 0 };
  for (const e of block.log) if (e.kind === 'job' && e.method && e.method in n && e.result === 'went') n[e.method]! += 1;
  return (Object.entries(n).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]![1] > 0 ? Object.entries(n).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]![0] : 'lean') as JobMethod;
}

/** What the Boss does with somebody found, or with the knock. */
export type MoleAnswer = 'turn' | 'letGo' | 'keep' | 'stay' | 'tell' | 'go' | 'nothing';

export function moleAnswer(block: EvilModeBlock, a: MoleAnswer, data: EvilData = EVIL_DATA): Out {
  const sc = block.mole.scene;
  if (!sc) return no(block, 'Nobody is in the Office.');
  const close = (b: EvilModeBlock) => setMole(b, { scene: null });
  if (sc.kind === 'wrong' || sc.kind === 'turned' || sc.kind === 'gone') return { block: close(block), problem: null, lines: [] };
  const mole = moleCrew(block);
  const h = block.mole.handler;
  if (!mole || !h) return { block: close(block), problem: null, lines: [] };
  const T = M(data).turn;
  const letGoLine = () => `${fill(M(data).sentLeft, { name: mole.name })} ${M(data).letGo[h][fairness(block)]}`;
  if (sc.kind === 'knock') {
    if (a === 'stay') {
      const b = { ...block, crew: block.crew.map((c) => (c.id === mole.id ? { ...c, loyalty: 10 } : c)), quests: { ...block.quests, [mole.id]: { step: 0, at: districtAt(block), run: runOf(block), state: 'done' as const, ending: 'stayed', busy: 0, goes: false } } };
      return { block: close(setMole(b, { found: true, state: 'stopped' })), problem: null, lines: [M(data).knock.stay] };
    }
    if (a === 'tell') return { block: close(setMole(block, { found: true, state: 'stopped' })), problem: null, lines: [M(data).knock.tell] };
    if (a === 'go') {
      const line = letGoLine();
      return { block: close(setMole(leave(block, mole.id, 'sent', line), { found: true, state: 'gone' })), problem: null, lines: [M(data).knock.go, line] };
    }
    if (a === 'nothing') return { block: close(setMole(block, { found: true, state: 'stopped' })), problem: null, lines: [M(data).knock.nothing] };
    return no(block, 'Answer them.');
  }
  // Found.
  if (a === 'keep') return { block: close(block), problem: null, lines: [] };
  if (a === 'letGo') {
    const line = letGoLine();
    return { block: close(setMole(leave(block, mole.id, 'sent', line), { state: 'gone' })), problem: null, lines: [line] };
  }
  if (a !== 'turn') return no(block, 'Turn them, open the door, or say nothing.');
  if (block.mole.state === 'turned') return no(block, 'Already turned.');
  if (h === 'mother') return { block: close(block), problem: null, lines: [T.mother.no!] };
  if (h === 'neighbour') {
    if (block.team.funds < M(data).rules.turnPay) return no(block, T.neighbour.no!);
    return { block: close(setMole(block, { state: 'turned' })), problem: null, lines: [T.neighbour.yes!] };
  }
  if (h === 'local') return { block: close(setMole(block, { stopped: { method: 'street', run: runOf(block) } })), problem: null, lines: [T.local.yes!] };
  // The police's: three exchanges; under Profit, Power or Spite, or with Dread over Regard, it ends at the first.
  if (['profit', 'power', 'spite'].includes(block.team.creed) || block.team.dread > block.team.regard) {
    const line = T.police.no!;
    return { block: close(setMole(leave(block, mole.id, 'sent', `${mole.name}: ${line}`), { state: 'gone' })), problem: null, lines: [T.police.ask!, line] };
  }
  const method = mostUsedDark(block);
  const name = data.methods.find((m) => m.id === method)?.name ?? method;
  return { block: close(setMole(block, { state: 'turned', stopped: { method, run: runOf(block) } })), problem: null, lines: [T.police.ask!, fill(T.police.yes!, { method: name })] };
}

// ---- The Suspicions page (Part 11 section 6): plain data; nothing on it reads who the mole is ----

export function suspicionsModel(block: EvilModeBlock, sel: number, data: EvilData = EVIL_DATA) {
  const S = M(data).screen;
  const ins = inRoster(block);
  const table = new Map<string, { went: number; didnt: number }>();
  for (const e of block.log) if (e.kind === 'job' && (e.result === 'went' || e.result === 'didnt')) for (const id of e.who) {
    const t = table.get(id) ?? { went: 0, didnt: 0 };
    table.set(id, e.result === 'went' ? { ...t, went: t.went + 1 } : { ...t, didnt: t.didnt + 1 });
  }
  const at = Math.max(0, Math.min(ins.length - 1, sel));
  const night = block.here.beat === 'night';
  const pick = ins[at];
  return {
    title: S.title!, help: S.help!,
    people: ins.map((c, i) => ({ id: c.id, name: c.name, talent: c.talent ?? '—', sel: i === at, went: table.get(c.id)?.went ?? 0, didnt: table.get(c.id)?.didnt ?? 0, slips: block.mole.slips.filter((s) => s.about === c.id).map((s) => `Day ${s.day}: ${M(data).tells[String(s.tell) as '1']}`) })),
    tableTitle: S.table!, slipsTitle: S.slips!, postTitle: S.post!,
    noSlips: block.mole.slips.length ? null : S.noSlips!,
    post: block.mole.post.map((p) => `Day ${p.day}: "${p.text}"`),
    noPost: block.mole.post.length ? null : S.noPost!,
    acts: [
      { id: 'name', name: S.name!, on: night && !!pick && !block.mole.scene, why: night ? null : 'At Night, in the Office.' },
      { id: 'feed', name: S.feed!, on: !!pick && block.here.beat === 'dispatch' && block.mole.fedAt !== districtAt(block), why: block.here.beat !== 'dispatch' ? 'At Dispatch.' : block.mole.fedAt === districtAt(block) ? S.fedOnce! : null },
    ],
  };
}
export type SuspicionsModel = ReturnType<typeof suspicionsModel>;

/** A scene in the Office (found, a wrong guess, the knock), with its answers. */
export function moleSceneModel(block: EvilModeBlock, data: EvilData = EVIL_DATA) {
  const sc = block.mole?.scene;
  if (!sc) return null;
  const c = block.crew.find((x) => x.id === sc.about);
  const A = M(data).acts;
  const answers: { id: MoleAnswer; name: string }[] = sc.kind === 'knock' ? [{ id: 'stay', name: A.stay! }, { id: 'tell', name: A.tell! }, { id: 'go', name: A.go! }, { id: 'nothing', name: A.nothing! }]
    : sc.kind === 'found' ? [{ id: 'turn', name: A.turn! }, { id: 'letGo', name: A.letGo! }, { id: 'keep', name: A.keep! }]
    : [{ id: 'keep', name: 'Go on' }];
  return { name: c?.name ?? '', ref: c?.ref ?? null, lines: sc.lines, answers };
}
export type MoleSceneModel = NonNullable<ReturnType<typeof moleSceneModel>>;

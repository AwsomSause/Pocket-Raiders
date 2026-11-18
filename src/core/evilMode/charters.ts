// Evil Mode slice 22: the nine Charters (design Part 28 sections 2 to 13). A Charter is a fixed page of data: it reads
// nothing but charters.json and the seed, never the profile and never an earlier run. Pure: no Phaser, no new stream
// (the Roster is drawn on `evil-people`, as a founded team's is).

import { z } from 'zod';
import chartersRaw from '../../data/evilMode/charters.json';
import { EVIL_DATA, type EvilData } from './data';
import { foundTeam } from './start';
import { bandOf, foundingRoster, teamLoyalty } from './people';
import { appendLog } from './ledger';
import { EvilModeBlockSchema, LINE_IDS, PERSONALITIES, type CharterState, type Crew, type EvilModeBlock, type RunLength } from './schema';

const S = z.string().min(1);
const N = z.number().int();
const CharterSchema = z.object({
  id: S, name: S, teamName: S, question: S, status: z.enum(['supported', 'limited', 'disabled']),
  creed: S, line: z.enum(LINE_IDS), lineFixed: z.boolean().optional(), doctrine: S, region: S,
  look: z.object({ a: S, b: S, motto: z.string() }).strict(),
  patron: z.object({ name: S, age: N.min(18), talent: S, flaw: S, note: S }).strict(),
  start: z.object({ funds: N.min(0), heat: N.min(0).max(10), loyalty: N.min(0).max(10), regard: N.min(0).max(10), dread: N.min(0).max(10), corruption: N.min(0).max(10) }).strict(),
  roster: N.min(1).max(10), rooms: z.array(S).min(1), roll: N.min(1).optional(),
  methodsOff: z.array(S).optional(), heatCeiling: N.min(0).max(10).optional(), dreadFixed: z.boolean().optional(), noMinors: z.boolean().optional(),
  morning: z.array(S).min(1),
  desk: z.array(z.object({ day: N.min(1), title: S, text: S }).strict()).length(3),
  rule: z.object({ id: S, name: S, text: S }).strict(),
  oldGuard: z.object({ name: S, text: S, turnLine: S }).strict(),
  dayThree: S, figure: S, limits: S.optional(),
}).strict();
export const ChartersFileSchema = z.object({
  note: z.string(), on: z.boolean(), loyaltyDoubleDays: N.min(0), returnCosts: z.array(N.min(1)).min(1), rollPerDay: N.min(1),
  staffHeatCeiling: N.min(0), flareDues: N.min(0), flareMembers: N.min(1),
  jointName: z.object({ atLeast: N.min(0).max(10), names: z.array(S).min(1) }).strict(),
  tab: S, tabLine: S, lastPage: S,
  turn: z.object({
    title: S, fields: z.array(z.tuple([S, S])).length(4), staffChanges: S, take: S, walk: S, confirm: S, oldLookLine: S,
    fundsCap: N.min(0), regardPerBadges: N.min(1), regardCeiling: N.min(0).max(10), loyalty: N.min(0).max(10), dread: N.min(0).max(10), ledgerFirst: S, meetingDay: N.min(1),
    route: z.object({ kindFlag: S, kindPer: N.min(1), evilAttribute: S, evilPer: N.min(1), swing: N.min(0).max(5), victims: z.array(S) }).strict(),
    meeting: z.object({
      title: S, lines: z.record(z.enum(PERSONALITIES), S),
      answers: z.object({ lie: S, true: S, silent: S }).strict(), after: z.object({ lie: S, true: S, silent: S }).strict(),
    }).strict(),
  }).strict(),
  houseRules: z.object({
    ask: z.object({ rollsAs: S, line: S }).strict(),
    plasma: z.object({ who: S, wrong: S, do: z.array(S).length(4), wont: S, before: N.min(0), after: N.min(0), returnLine: S }).strict(),
    twoBoards: z.object({ aether: N.min(0), form: N.min(1), regard: N, formLine: S }).strict(),
    group: z.object({ limit: N.min(0), spends: z.array(S), makesMoney: z.array(S), held: S, yes: S, no: S, memo: S }).strict(),
    flare: z.object({ unseatedLoyalty: N, seat: S, unseat: S }).strict(),
  }).strict(),
  teams: z.record(z.string(), S),
  charters: z.array(CharterSchema).length(9),
}).strict();
export type Charter = z.infer<typeof CharterSchema>;
export type ChartersFile = z.infer<typeof ChartersFileSchema>;
export const CHARTERS: ChartersFile = ChartersFileSchema.parse(chartersRaw);
const H = CHARTERS.houseRules;

export const charterDef = (id: string | undefined, file: ChartersFile = CHARTERS): Charter | undefined => file.charters.find((c) => c.id === id);
export const charterOf = (block: Pick<EvilModeBlock, 'charter'>, file: ChartersFile = CHARTERS): Charter | undefined => charterDef(block.charter?.id, file);
/** Every Charter that can be taken (supported or limited): all nine, from the first play. Nothing unlocks them. */
export const chartersOpen = (file: ChartersFile = CHARTERS): Charter[] => (file.on ? file.charters.filter((c) => c.status !== 'disabled') : []);

const freshState = (c: Charter, crew: Crew[], file: ChartersFile): CharterState => ({
  id: c.id, rule: c.rule.id, returned: 0, returnedOn: 0, answered: 0, read: 0, streak: 0, answeredOn: 0, paidIn: [], missed: 0,
  // The Joint Command: every second person's blue (the Patron, first, is red), so both halves start the same size.
  blue: c.rule.id === 'two-colours' ? crew.filter((_, i) => i % 2 === 1).map((p) => p.id) : [],
  named: c.rule.id !== 'two-colours', dues: 0, duesOn: [], doubleTo: file.loyaltyDoubleDays,
  ...(c.rule.id === 'ask-first' ? { asked: [], askedOn: 0 } : {}),
  ...(c.rule.id === 'written-sentence' ? { sentence: { who: null, wrong: null, do: null, wont: null }, causeDue: false, wholeIn: null } : {}),
  ...(c.rule.id === 'members' ? { unseated: [] } : {}),
  ...(c.rule.id === 'two-purses' ? { aether: file.houseRules.twoBoards.aether, formOn: 0 } : {}),
  ...(c.rule.id === 'signature' ? { pending: null, approved: [], memoIn: [] } : {}),
});

/**
 * Takes a Charter (Part 28 section 2): founding's pages 2 to 8 filled by the Charter, page 1 (the Boss, the starter)
 * the player's. Same Charter and seed: the same first Morning, desk and Roster, on any profile.
 */
export function takeCharter(id: string, opts: { boss: string; length: RunLength; seed?: string }, data: EvilData = EVIL_DATA, file: ChartersFile = CHARTERS): { ok: true; block: EvilModeBlock } | { ok: false; problem: string } {
  const c = charterDef(id, file);
  if (!file.on || !c || c.status === 'disabled') return { ok: false, problem: 'Choose a Charter.' };
  const region = data.region.on ? data.region.regions.find((r) => r.id === c.region && r.status !== 'disabled' && r.status !== 'invalid') : undefined;
  const choice = { name: 'Charter', creed: c.creed, line: c.line, doctrine: c.doctrine, ...(data.region.on ? { patron: 'nobody', region: region?.id ?? 'kanto' } : {}) };
  const out = foundTeam(choice, opts, data);
  if (!out.ok) return out;
  const seed = opts.seed ?? opts.boss;
  // The house is nearly full: the Charter's Patron, then the Founders drawn on `evil-people` (no minor: Part 28 12.2).
  const seats = Math.min(c.roster, data.people.rules.rosterCap) - 1;
  const roster = foundingRoster(seed, c.creed, { ...data, creeds: data.creeds.map((x) => (x.id === c.creed ? { ...x, start: { ...x.start, roster: seats } } : x)) });
  const patron: Crew = { id: 'charter-patron', ref: null, name: c.patron.name, age: c.patron.age, minor: false, talent: c.patron.talent as Crew['talent'], flaw: c.patron.flaw as Crew['flaw'], flawFound: true, line: null, lineHeard: false, rank: 'officer', loyalty: c.start.loyalty, where: 'in', outOn: null, jobs: 0, asked: 0, unpaid: 0, fitIn: null };
  const crew = [patron, ...roster.crew.filter((p) => !(c.noMinors && p.minor)).map((p) => ({ ...p, loyalty: c.start.loyalty }))];
  const b0 = out.block;
  let block: EvilModeBlock = {
    ...b0,
    from: 'charter',
    team: { ...b0.team, name: c.teamName, funds: c.start.funds, heat: c.start.heat, regard: c.start.regard, dread: c.start.dread, corruption: c.start.corruption, look: { ...b0.team.look, a: c.look.a, b: c.look.b } },
    crew,
    drawn: roster.crew.map((p) => p.id),
    draws: { ...b0.draws, 'evil-people': roster.draws },
    charter: freshState(c, crew, file),
  };
  // The first Morning and the desk are the Ledger's first lines (Part 28 sections 4.1, 4.2): the Charter's own, printed.
  block = appendLog(block, { kind: 'charter', who: [], text: `Day 1. ${c.morning.join(' ')}` });
  for (const d of c.desk) block = appendLog(block, { kind: 'charter', who: [], text: `On the desk, day ${d.day}: ${d.title}. ${d.text}` });
  block = appendLog(block, { kind: 'charter', who: [], text: `Across the line: ${c.oldGuard.name}. ${c.oldGuard.text}` });
  return { ok: true, block: EvilModeBlockSchema.parse(block) };
}

// ---- The house rules (Part 28 sections 4.3 to 12.4) ----

/** The roll (Part 28 section 2.3): a display figure, full roll × Loyalty ÷ 10, rounded down. It changes nothing. */
export const rollFigure = (full: number, loyalty: number): number => Math.floor((full * loyalty) / 10);

/** The Joint Command's two halves (Part 28 section 6.3): red and blue Loyalty, each the mean of its people in, rounded down. */
export function halves(block: Pick<EvilModeBlock, 'crew' | 'charter'>): { red: number; blue: number } | null {
  if (block.charter?.rule !== 'two-colours') return null;
  const blue = new Set(block.charter.blue);
  const ins = block.crew.filter((c) => c.where === 'in');
  const mean = (xs: Crew[]) => (xs.length ? Math.floor(xs.reduce((n, c) => n + c.loyalty, 0) / xs.length) : 0);
  return { red: mean(ins.filter((c) => !blue.has(c.id))), blue: mean(ins.filter((c) => blue.has(c.id))) };
}

/** Methods a Charter never offers (the Staff Room: Take and Lean). Absent from Dispatch, not dark. */
export const methodsOff = (block: Pick<EvilModeBlock, 'charter'>, file: ChartersFile = CHARTERS): string[] => charterOf(block, file)?.methodsOff ?? [];

export type CharterAct =
  | { what: 'return' } | { what: 'answer' } | { what: 'name'; name: string }
  /** Galactic: go and ask a holding's local, in person. Plasma: Bronius says who it's for; the Boss says what we do. */
  | { what: 'ask'; holdingId: string } | { what: 'who' } | { what: 'cause'; pick: number }
  /** Flare: lay a member's place, or don't. The Two Boards: Faba's form. The Group: the Books talent's memo. */
  | { what: 'seat'; who: string } | { what: 'form' } | { what: 'memo' };

/** The district a once-a-district rule is counted in. */
const districtKey = (block: Pick<EvilModeBlock, 'here' | 'district'>): string => `${block.here.region}:${block.district?.n ?? 0}`;
type R = { block: EvilModeBlock; problem: string | null; lines: string[] };

/** The next thing Carrow's valued: a fixed list, in order, so a return's price is known before it's paid. */
export const returnCost = (block: Pick<EvilModeBlock, 'charter'>, file: ChartersFile = CHARTERS): number => file.returnCosts[(block.charter?.returned ?? 0) % file.returnCosts.length]!;

/** A house rule's own act. */
export function charterAct(block: EvilModeBlock, act: CharterAct, file: ChartersFile = CHARTERS): R {
  const st = block.charter;
  const H = file.houseRules;
  const no = (problem: string): R => ({ block, problem, lines: [] });
  if (!st) return no('This team took no Charter.');
  const put = (b: EvilModeBlock, charter: CharterState, line: string, given = 0): R => ({ block: appendLog({ ...b, charter }, { kind: 'charter', who: [], text: `Day ${b.here.day}. ${line}`, ...(given ? { given } : {}) }), problem: null, lines: [line] });
  switch (act.what) {
    case 'return': {
      // Plasma (8.3): the cellar's labels are a Ledger; giving one back is Rocket's rule, for nothing but a day.
      if (st.rule === 'written-sentence') {
        if (block.here.beat !== 'evening') return no('Things go back at the Evening.');
        if (st.returnedOn === block.here.day) return no('One a day. Somebody\'s already at the gate with today\'s.');
        return put({ ...block, team: { ...block.team, regard: Math.min(10, block.team.regard + 1) } }, { ...st, returned: st.returned + 1, returnedOn: block.here.day }, H.plasma.returnLine);
      }
      // Rocket (4.3): any Evening, one thing; it costs the valuation, pays Regard +1, never Funds, never cools Heat.
      if (st.rule !== 'ledger-returns') return no('Nothing here is returned.');
      if (block.here.beat !== 'evening') return no('Things go back at the Evening.');
      if (st.returnedOn === block.here.day) return no('One thing an Evening. Faye\'s already out with today\'s.');
      const cost = returnCost(block, file);
      if (block.team.funds < cost) return no(`It's valued at ₽${cost}. The team hasn't got it.`);
      const team = { ...block.team, funds: block.team.funds - cost, regard: Math.min(10, block.team.regard + 1) };
      return put({ ...block, team }, { ...st, returned: st.returned + 1, returnedOn: block.here.day }, `Returned: one thing, valued at ₽${cost}. Faye carries it. Regard +1.`, cost);
    }
    case 'answer': {
      // Rocket's Return (5.3): the register, every Morning. Seven running: Loyalty +1, once a region.
      if (st.rule !== 'roll-call') return no('Nobody here calls a roll.');
      if (block.here.beat !== 'morning') return no('The roll is called at the Morning.');
      if (st.answeredOn === block.here.day) return no('Already marked present.');
      const streak = st.streak + 1;
      const pay = streak >= 7 && !st.paidIn.includes(block.here.region);
      const crew = pay ? block.crew.map((c) => (c.where === 'in' ? { ...c, loyalty: Math.min(10, c.loyalty + 1) } : c)) : block.crew;
      return put({ ...block, crew }, { ...st, answered: st.answered + 1, streak, answeredOn: block.here.day, paidIn: pay ? [...st.paidIn, block.here.region] : st.paidIn }, pay ? 'Sabela: "Seven. That\'s the record." Loyalty +1.' : 'Sabela marks the register: present.');
    }
    case 'name': {
      // The Joint Command (6.3): offered once both halves reach 6; the Hall's vote names it.
      if (st.rule !== 'two-colours') return no('This team has its name.');
      if (st.named) return no('The Hall has named the team.');
      const h = halves(block)!;
      if (h.red < file.jointName.atLeast || h.blue < file.jointName.atLeast) return no(`The Hall won't vote until both halves are at ${file.jointName.atLeast}.`);
      if (!file.jointName.names.includes(act.name)) return no('That name isn\'t on the Hall\'s list.');
      return put({ ...block, team: { ...block.team, name: act.name.replace(/^Team /, '') } }, { ...st, named: true }, `The Hall votes. ${act.name}. Lior repaints the corridor that night, in green.`);
    }
    case 'ask': {
      // Galactic (7.3): a day, no roll; the local says one line and the mood's on the Board from then on.
      if (st.rule !== 'ask-first') return no('Everybody here has been asked.');
      if (block.here.beat !== 'morning' && block.here.beat !== 'dispatch') return no('Asking takes the day: go in the Morning or at Dispatch.');
      const h = block.district?.holdings.find((x) => x.id === act.holdingId);
      if (!h || !h.mood) return no('Nobody lives there to ask.');
      if ((st.asked ?? []).includes(h.id)) return no('They were asked. They answered.');
      if (st.askedOn === block.here.day) return no('One street a day. Somebody\'s already out asking.');
      const mood = EVIL_DATA.district.moods.find((m) => m.id === h.mood)?.name ?? h.mood;
      return put(block, { ...st, asked: [...(st.asked ?? []), h.id], askedOn: block.here.day }, H.ask.line.replace('{step}', String(h.step)).replace('{mood}', mood));
    }
    case 'who': {
      // Plasma (8.3): Bronius puts forward who it's for, at any Evening, if asked.
      if (st.rule !== 'written-sentence' || !st.sentence) return no('There\'s no sentence to write here.');
      if (st.sentence.who) return no('Bronius has said who it\'s for.');
      if (block.here.beat !== 'evening') return no('Bronius is asked at the Evening.');
      return put(block, { ...st, sentence: { ...st.sentence, who: H.plasma.who } }, H.plasma.who);
    }
    case 'cause': {
      // Plasma (8.3): the Boss alone says what we do, after the first job that goes wrong: one of four.
      if (st.rule !== 'written-sentence' || !st.sentence) return no('There\'s no sentence to write here.');
      if (!st.causeDue || st.sentence.do) return no('Nothing has gone wrong yet to say it about.');
      const line = H.plasma.do[act.pick];
      if (!line) return no('Choose one of the four.');
      return put(block, { ...st, causeDue: false, sentence: { ...st.sentence, do: line } }, `The Boss: "${line}"`);
    }
    case 'seat': {
      // Flare (9.3): who's laid for at the dinner. A member who isn't doesn't pay, and minds.
      if (st.rule !== 'members') return no('Nobody here is laid for.');
      const p = block.crew.find((c) => c.id === act.who && c.where === 'in');
      if (!p) return no('They aren\'t in the house.');
      const off = st.unseated ?? [];
      const seated = off.includes(p.id);
      return put(block, { ...st, unseated: seated ? off.filter((x) => x !== p.id) : [...off, p.id] }, (seated ? H.flare.seat : H.flare.unseat).replace('{name}', p.name));
    }
    case 'form': {
      // The Two Boards (10.3): white to wet, a form a day, Faba's countersignature for a price that's never money.
      if (st.rule !== 'two-purses') return no('There\'s one purse here.');
      if (st.formOn === block.here.day) return no('Faba signs one form a day.');
      const amount = Math.min(st.aether ?? 0, H.twoBoards.form);
      if (amount <= 0) return no('Aether\'s purse is empty.');
      const team = { ...block.team, funds: block.team.funds + amount, regard: Math.max(0, block.team.regard + H.twoBoards.regard) };
      return put({ ...block, team }, { ...st, aether: (st.aether ?? 0) - amount, formOn: block.here.day }, H.twoBoards.formLine.replace('{amount}', amount.toLocaleString('en-GB')).replace('{regard}', String(H.twoBoards.regard)));
    }
    case 'memo': {
      // The Group (11.3): whoever has Books writes the memo; one spend a district goes through as whatever it needs to be called.
      if (st.rule !== 'signature') return no('Nobody here needs a signature.');
      if (!st.pending) return no('Nothing is waiting on the board.');
      const writer = block.crew.find((c) => c.where === 'in' && c.talent === 'books');
      if (!writer) return no('Nobody in the house has Books.');
      const key = districtKey(block);
      if ((st.memoIn ?? []).includes(key)) return no('One memo a district. The board has read this district\'s.');
      const line = H.group.memo.replace('{name}', writer.name).replace('{what}', st.pending.what);
      return put(block, { ...st, pending: null, approved: [...(st.approved ?? []), st.pending.key], memoIn: [...(st.memoIn ?? []), key] }, line);
    }
  }
}

/** Plasma (8.3): when the first three parts are in, the Hall says the fourth at the Evening; the sentence is then whole for the rest of the region. */
function settleSentence(block: EvilModeBlock, st: CharterState): CharterState {
  const s = st.sentence;
  if (!s || s.wont || !s.who || !s.wrong || !s.do || block.here.beat !== 'evening') return st;
  return { ...st, sentence: { ...s, wont: H.plasma.wont }, wholeIn: block.here.region };
}

/** The key a spend is approved under: the action, and the room for a build. */
const spendKey = (action: { type: string; room?: string }): string => (action.type === 'build' && action.room ? `build:${action.room}` : action.type);

/**
 * The Group (11.3): a spend over ₽2,000 goes to the board. The step is refused, the spend is held, and the answer comes
 * next Morning: yes if it makes money (and the same spend is free from then on), no otherwise. A beat's own end (wages,
 * the Evening's sums) isn't a spend.
 */
export function signatureHold(before: EvilModeBlock, action: { type: string; room?: string }, after: EvilModeBlock, file: ChartersFile = CHARTERS): { block: EvilModeBlock; reason: string } | null {
  const st = before.charter;
  const G = file.houseRules.group;
  if (st?.rule !== 'signature' || !G.spends.includes(action.type)) return null;
  const spent = before.team.funds - after.team.funds;
  const key = spendKey(action);
  if (spent <= G.limit || (st.approved ?? []).includes(key)) return null;
  const reason = G.held.replace('{amount}', spent.toLocaleString('en-GB'));
  if (st.pending?.key === key) return { block: before, reason };
  const what = `${action.type === 'build' && action.room ? `Build: ${action.room}` : action.type}, ₽${spent.toLocaleString('en-GB')}`;
  const block = appendLog({ ...before, charter: { ...st, pending: { key, what, amount: spent, day: before.here.day } } }, { kind: 'charter', who: [], text: `Day ${before.here.day}. ${reason}` });
  return { block, reason };
}

/** Refusals a Charter adds before any step (the Staff Room's locks, Part 28 section 12.2). Null: go ahead. */
export function charterRefuses(block: EvilModeBlock, action: { type: string; job?: { method?: string }; to?: string; ref?: string }, data: EvilData = EVIL_DATA, file: ChartersFile = CHARTERS): string | null {
  // The Turn (15.2): the Hero's standing in the road; the day doesn't go on past them unanswered.
  if ((action.type === 'stayIn' || action.type === 'goYourself') && meetingDue(block, file)) return `${block.hero!.name} is standing in the road. Answer them first.`;
  const c = charterOf(block, file);
  if (!c) return null;
  if (c.lineFixed && action.type === 'moveLine') return "The Line doesn't move here.";
  const off = c.methodsOff ?? [];
  if (off.length && (action.type === 'queueJob' || action.type === 'confirmCard' || action.type === 'askAnyway') && off.includes(action.job?.method ?? '')) return 'That was never offered.';
  if (c.noMinors && action.type === 'hire') {
    const a = block.applicants.find((x) => x.ref === action.ref);
    const p = a ? data.people.people.find((x) => x.id === a.ref) : undefined;
    if (p?.minor) return 'No child goes on this Roster.';
  }
  return null;
}

/**
 * After every step (Part 28 sections 2.3 and 9 to 12): the first week's Loyalty moves count double; the Staff Room's
 * Dread stays 0 and Heat stops at its ceiling; the roll-call's missed days and Flare's dues are counted on each new day.
 */
export function charterMoves(before: EvilModeBlock, after: EvilModeBlock, file: ChartersFile = CHARTERS): EvilModeBlock {
  const st = after.charter;
  const c = charterOf(after, file);
  if (!st || !c) return after;
  let out = after;
  if (before.here.day <= st.doubleTo && before.here.region === after.here.region) {
    const was = new Map(before.crew.map((p) => [p.id, p.loyalty]));
    let moved = false;
    const crew = out.crew.map((p) => {
      const w = was.get(p.id);
      if (w === undefined || w === p.loyalty) return p;
      moved = true;
      return { ...p, loyalty: Math.max(0, Math.min(10, w + 2 * (p.loyalty - w))) };
    });
    if (moved) out = { ...out, crew };
  }
  if (c.dreadFixed && out.team.dread !== 0) out = { ...out, team: { ...out.team, dread: 0 } };
  const ceiling = c.heatCeiling;
  if (ceiling !== undefined && out.team.heat > ceiling) out = { ...out, team: { ...out.team, heat: ceiling } };
  if (after.here.day > before.here.day) {
    const s = out.charter!;
    if (s.rule === 'roll-call') {
      const missed = s.answeredOn !== before.here.day;
      out = { ...out, charter: { ...s, read: s.read + 1, missed: s.missed + (missed ? 1 : 0), streak: missed ? 0 : s.streak } };
    }
    if (s.rule === 'members' && before.here.day % 7 === 0 && !s.duesOn.includes(before.here.day)) {
      // Flare (9.3): a member who isn't laid for doesn't pay, and their Loyalty falls 2.
      const off = new Set(s.unseated ?? []);
      const members = Math.min(file.flareMembers, out.crew.filter((p) => p.where === 'in' && !off.has(p.id)).length);
      const left = out.crew.filter((p) => p.where === 'in' && off.has(p.id));
      const paid = members * file.flareDues;
      const crew = out.crew.map((p) => (p.where === 'in' && off.has(p.id) ? { ...p, loyalty: Math.max(0, Math.min(10, p.loyalty + file.houseRules.flare.unseatedLoyalty)) } : p));
      const unlaid = left.length ? ` Not laid for: ${left.map((p) => p.name).join(', ')}.` : '';
      out = appendLog({ ...out, crew, team: { ...out.team, funds: out.team.funds + paid }, charter: { ...s, dues: s.dues + paid, duesOn: [...s.duesOn, before.here.day] } }, { kind: 'charter', who: left.map((p) => p.id), text: `Day ${before.here.day}. Dinner. ${members} members laid for; dues ₽${paid}.${unlaid}` });
    }
    if (s.rule === 'signature' && s.pending) {
      // The Group (11.3): the board's answer comes the next Morning.
      const G = file.houseRules.group;
      const yes = G.makesMoney.includes(s.pending.key);
      const line = (yes ? G.yes : G.no).replace('{what}', s.pending.what);
      out = appendLog({ ...out, charter: { ...s, pending: null, approved: yes ? [...(s.approved ?? []), s.pending.key] : s.approved ?? [] } }, { kind: 'charter', who: [], text: `Day ${after.here.day}. ${line}` });
    }
  }
  // Plasma (8.3): the first job that goes right brings "what's wrong" from the most loyal; the first that goes wrong asks the Boss "what we do".
  const p = out.charter!;
  if (p.rule === 'written-sentence' && p.sentence && after.log.length > before.log.length) {
    const jobs = after.log.slice(before.log.length).filter((e) => e.kind === 'job');
    let next = p;
    if (!p.sentence.wrong && jobs.some((e) => e.result === 'went')) {
      const top = out.crew.filter((c) => c.where === 'in').sort((a, b) => b.loyalty - a.loyalty || (a.id < b.id ? -1 : 1))[0];
      if (top) next = { ...next, sentence: { ...next.sentence!, wrong: file.houseRules.plasma.wrong.replace('{name}', top.name) } };
    }
    if (!p.sentence.do && !p.causeDue && jobs.some((e) => e.result === 'didnt')) next = { ...next, causeDue: true };
    if (next !== p) {
      out = { ...out, charter: next };
      if (next.sentence!.wrong !== p.sentence.wrong) out = appendLog(out, { kind: 'charter', who: [], text: `Day ${out.here.day}. ${next.sentence!.wrong}` });
    }
  }
  if (out.charter!.rule === 'written-sentence') {
    const st2 = settleSentence(out, out.charter!);
    if (st2 !== out.charter) out = appendLog({ ...out, charter: st2 }, { kind: 'charter', who: [], text: `Day ${out.here.day}. ${file.houseRules.plasma.wont}` });
  }
  return out;
}

/** The line the Ledger's last page gains on a Charter (Part 28 section 13): the question, and the run's figure. */
export function questionLine(block: EvilModeBlock, bossName: string, file: ChartersFile = CHARTERS): string | null {
  const c = charterOf(block, file);
  const s = block.charter;
  if (!c || !s) return null;
  const h = halves(block);
  const figure = c.figure
    .replace('{taken}', block.taken.toLocaleString('en-GB')).replace('{given}', block.given.toLocaleString('en-GB'))
    .replace('{returned}', String(s.returned)).replace('{answered}', String(s.answered)).replace('{days}', String(s.read))
    .replace('{red}', bandOf(h?.red ?? 0).name).replace('{blue}', bandOf(h?.blue ?? 0).name).replace('{dues}', s.dues.toLocaleString('en-GB'))
    .replace('{boss}', bossName);
  return file.lastPage.replace('{question}', c.question).replace('{figure}', figure);
}

/** A Morning line for the house (the roll's figure, the register's count, the two halves), or null. */
export function houseLine(block: EvilModeBlock, file: ChartersFile = CHARTERS): string | null {
  const c = charterOf(block, file);
  const s = block.charter;
  if (!c || !s) return null;
  const loyalty = teamLoyalty(block);
  const parts = [c.rule.name];
  if (c.roll) parts.push(`The roll: ${rollFigure(Math.max(0, c.roll - 10 * s.missed), loyalty)}`);
  if (s.rule === 'ledger-returns') parts.push(`Returned: ${s.returned}`);
  if (s.rule === 'roll-call') parts.push(`Answered ${s.answered} of ${s.read + 1}`);
  if (s.rule === 'ask-first') parts.push(`Asked: ${(s.asked ?? []).length} of ${(block.district?.holdings ?? []).filter((h) => h.mood).length}`);
  if (s.rule === 'written-sentence' && s.sentence) {
    const n = [s.sentence.who, s.sentence.wrong, s.sentence.do, s.sentence.wont].filter(Boolean).length;
    parts.push(n === 4 ? (s.wholeIn === block.here.region ? 'The sentence is whole: takings double this region' : 'The sentence is whole') : `The sentence: ${n} of 4 (takings pay nothing until it's whole)`);
    if (s.returned) parts.push(`Given back: ${s.returned}`);
  }
  if (s.rule === 'members') parts.push(`At the table: ${block.crew.filter((p) => p.where === 'in' && !(s.unseated ?? []).includes(p.id)).length}`);
  if (s.rule === 'two-purses') parts.push(`Skull ₽${block.team.funds.toLocaleString('en-GB')} · Aether ₽${(s.aether ?? 0).toLocaleString('en-GB')}`);
  if (s.rule === 'signature' && s.pending) parts.push(`With the board: ${s.pending.what}`);
  const h = halves(block);
  // Loyalty is never shown as a figure (Part 29 test 3): each half's band word.
  if (h) parts.push(`Red: ${bandOf(h.red).name}. Blue: ${bandOf(h.blue).name}`);
  return parts.join(' · ');
}

/** The house rule's buttons for this beat (each also on the U key, first that can be pressed). */
export function houseActs(block: EvilModeBlock, file: ChartersFile = CHARTERS, opts: { at?: string } = {}): { label: string; act: CharterAct; problem: string | null }[] {
  const s = block.charter;
  if (!s || block.ending) return [];
  const test = (act: CharterAct) => charterAct(block, act, file).problem;
  const one = (label: string, act: CharterAct) => [{ label, act, problem: test(act) }];
  if (s.rule === 'ask-first' && (block.here.beat === 'morning' || block.here.beat === 'dispatch')) {
    // The holding chosen on the Board, else the nearest nobody's asked.
    const hs = block.district?.holdings ?? [];
    const h = hs.find((x) => x.id === opts.at && x.mood && !(s.asked ?? []).includes(x.id)) ?? hs.filter((x) => x.mood && !(s.asked ?? []).includes(x.id)).sort((a, b) => a.step - b.step)[0];
    return h ? one(`Go and ask, at step ${h.step}`, { what: 'ask', holdingId: h.id }) : [];
  }
  if (s.rule === 'written-sentence' && s.sentence) {
    if (s.causeDue && !s.sentence.do) return file.houseRules.plasma.do.map((d, i) => ({ label: `What we do: ${d}`, act: { what: 'cause' as const, pick: i }, problem: test({ what: 'cause', pick: i }) }));
    if (block.here.beat === 'evening') return [...(!s.sentence.who ? one('Ask Bronius who it\'s for', { what: 'who' }) : []), ...one('Give one back from the cellar', { what: 'return' })];
    return [];
  }
  if (s.rule === 'two-purses') return (s.aether ?? 0) > 0 ? one(`Faba's form (₽${Math.min(s.aether ?? 0, file.houseRules.twoBoards.form).toLocaleString('en-GB')})`, { what: 'form' }) : [];
  if (s.rule === 'signature') return s.pending ? one('Write the memo (Books)', { what: 'memo' }) : [];
  if (s.rule === 'members' && block.here.beat === 'evening') {
    const off = new Set(s.unseated ?? []);
    return block.crew.filter((c) => c.where === 'in').map((c) => ({ label: `${off.has(c.id) ? 'Lay for' : 'Unseat'} ${c.name}`, act: { what: 'seat' as const, who: c.id }, problem: null }));
  }
  if (s.rule === 'ledger-returns' && block.here.beat === 'evening') return [{ label: `Return one thing (₽${returnCost(block, file)})`, act: { what: 'return' }, problem: test({ what: 'return' }) }];
  if (s.rule === 'roll-call' && block.here.beat === 'morning') return [{ label: 'Answer the roll: "Present."', act: { what: 'answer' }, problem: test({ what: 'answer' }) }];
  if (s.rule === 'two-colours' && !s.named) {
    const acts = file.jointName.names.map((name) => ({ label: `Vote: ${name}`, act: { what: 'name' as const, name }, problem: test({ what: 'name', name }) }));
    return acts[0]!.problem ? [] : acts;
  }
  return [];
}

/** The Founding screen's Charters tab (Part 29 section 3.2): nine tabs down the left; the chosen Charter's pages, its five things, and the trouble on day three, printed. */
export interface CharterTabModel {
  line: string;
  tabs: { id: string; name: string; sel: boolean; limited: boolean }[];
  sel: {
    id: string; name: string; question: string; rows: [string, string][]; desk: string[]; rule: string; oldGuard: string; dayThree: string; morning: string[]; limits: string | null;
    patron: string;
  };
  confirming: boolean;
  confirmLine: string;
}

export function charterTabModel(at: number, confirming: boolean, data: EvilData = EVIL_DATA, file: ChartersFile = CHARTERS): CharterTabModel {
  const open = chartersOpen(file);
  const c = open[Math.max(0, Math.min(open.length - 1, at))]!;
  const name = (list: { id: string; name: string }[], id: string) => list.find((x) => x.id === id)?.name ?? id;
  const lineName = data.founding.lines.find((l) => l.id === c.line)?.name ?? c.line;
  const s = c.start;
  return {
    line: file.tabLine,
    tabs: open.map((x, i) => ({ id: x.id, name: x.name, sel: i === at, limited: x.status === 'limited' })),
    sel: {
      id: c.id, name: c.name, question: c.question,
      rows: [
        ['Name', `Team ${c.teamName}`],
        ['Creed', name(data.creeds, c.creed)],
        ['Line', `${lineName}${c.lineFixed ? " (it can't be moved)" : ''}`],
        ['Doctrine', name(data.doctrines, c.doctrine)],
        ['Motto', c.look.motto ? `"${c.look.motto}"` : 'None. The field is empty.'],
        ['First region', data.region.regions.find((r) => r.id === c.region)?.name ?? c.region],
        ['The house', `${c.rooms.join(', ')}. A Roster of ${Math.min(c.roster, data.people.rules.rosterCap)}.`],
        ['Starts at', `₽${s.funds.toLocaleString('en-GB')} · Heat ${s.heat} · Regard ${s.regard} · Dread ${s.dread}`],
      ],
      desk: c.desk.map((d) => `Day ${d.day}: ${d.title}. ${d.text}`),
      rule: `${c.rule.name}. ${c.rule.text}`,
      oldGuard: `${c.oldGuard.name}. ${c.oldGuard.text}`,
      dayThree: c.dayThree,
      morning: c.morning,
      limits: c.status === 'limited' ? c.limits ?? null : null,
      patron: `${c.patron.name}, ${c.patron.note}`,
    },
    confirming,
    confirmLine: 'All of this is permanent except the Line. Press Take it again to take it.',
  };
}

// ---- The Turn's first meeting (Part 28 section 15.2) ----

export type MeetAnswer = 'lie' | 'true' | 'silent';
export const MEET_ANSWERS: MeetAnswer[] = ['lie', 'true', 'silent'];

/** Day 2 of the first Evil Mode district, wherever the Boss goes in person: the Hero is standing there. Once. */
export const meetingDue = (block: EvilModeBlock, file: ChartersFile = CHARTERS): boolean =>
  !!block.turn && block.turn.met === null && !!block.hero && !block.ending && block.here.beat === 'inPerson' && block.here.day >= file.turn.meetingDay;

/** What the meeting card shows: the Hero's one line by personality, and the three answers, always the same three. */
export function meetingModel(block: EvilModeBlock, file: ChartersFile = CHARTERS): { title: string; who: string; line: string; answers: { key: MeetAnswer; label: string }[] } | null {
  if (!meetingDue(block, file)) return null;
  const M = file.turn.meeting;
  return { title: M.title, who: block.hero!.name, line: M.lines[block.hero!.personality], answers: MEET_ANSWERS.map((key) => ({ key, label: M.answers[key] })) };
}

/** The answer. "It's not what it looks like." is kept as a lie (read at the end, Part 23: the Recruit); no battle is offered. */
export function meetHero(block: EvilModeBlock, answer: MeetAnswer, file: ChartersFile = CHARTERS): R {
  if (!meetingDue(block, file)) return { block, problem: 'Nobody is standing in the road.', lines: [] };
  const M = file.turn.meeting;
  const hero = block.hero!;
  const lies = answer === 'lie' ? [...hero.lies, { kind: 'justWork' as const, day: block.here.day, region: block.here.region }] : hero.lies;
  const after = M.after[answer].replace('{hero}', hero.name);
  const text = `Day ${block.here.day}. ${hero.name}, on the road: ${M.lines[hero.personality]} You: ${M.answers[answer]} ${after}`;
  const out = appendLog({ ...block, hero: { ...hero, lies }, turn: { ...block.turn!, met: answer } }, { kind: 'hero', who: [], text });
  return { block: out, problem: null, lines: [M.lines[hero.personality], after] };
}

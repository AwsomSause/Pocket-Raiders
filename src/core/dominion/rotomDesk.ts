// DOMINION redesign R9 follow-up: the Rotom Phone's own pages (pass 50 mockups radio, inbox, msgs, journal, rdiary,
// ask, rplan, chapters, chatter). Each page reads the run and never changes it: these are views over what the save
// already holds (the week's news, the papers, the desk, the rivals, the Hero, the job board). No RNG; where a line is
// picked from a list, it is picked by the day, so the same day always reads the same.

import { DOMINION_DATA } from './data';
import { heroModel } from './heroScreens';
import { hasRoom } from './hqFx';
import { bestFor, jobBoard, type BoardJob } from './jobs';
import { rivalsOf, teamDef, teamsHere } from './rivals';
import type { DominionBlock, NewsKind } from './schema';
import type { RunState } from '../state';

type Run = Pick<RunState, 'party'>;
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const money = (n: number): string => `₽${Math.round(n).toLocaleString('en-US')}`;
const regionName = (): string => cap(DOMINION_DATA.field.region || 'kanto');
const pick = <T>(xs: readonly T[], n: number): T => xs[((n % xs.length) + xs.length) % xs.length]!;
const week = (b: DominionBlock) => b.voices?.week ?? [];
const papers = (b: DominionBlock) => b.voices?.papers ?? [];
const rivalName = (): string => teamsHere()[0]?.name ?? 'Team Rocket';
const safe = <T>(f: () => T, or: T): T => { try { return f(); } catch { return or; } };
const hero = (b: DominionBlock, run: Run) => safe(() => heroModel(b, run).hero, null);
const districtName = (id: string): string => DOMINION_DATA.field.districts.find((d) => d.id === id)?.name ?? cap(id);

// ---------- the Radio (mockup `radio`) ----------

export interface Station { freq: string; name: string; now: string; lines: string[]; locked: boolean; kinds: NewsKind[] }

/** Four stations, each playing this week's lines of its kind (newest first); the Nova pirate station needs a Radio Room. */
export function radioModel(b: DominionBlock): Station[] {
  const w = [...week(b)].sort((x, y) => y.d - x.d);
  const st = (freq: string, name: string, kinds: NewsKind[], quiet: string, locked = false): Station => {
    const lines = w.filter((x) => kinds.includes(x.k)).map((x) => `Day ${x.d} · ${x.l}`);
    return { freq, name, kinds, lines, locked, now: locked ? 'Build a Radio Room to broadcast' : lines[0]?.replace(/^Day \d+ · /, '') ?? quiet };
  };
  const team = b.teamName ?? 'Nova';
  return [
    st('88.1', `${regionName()} News`, ['hero', 'legends'], 'Nothing new on the news'),
    st('91.5', `${rivalName()} Radio`, ['rivals'], 'Static. They are quiet tonight'),
    st('95.0', 'Police band', ['police'], 'All quiet on the police band'),
    st('103.2', `${team} Pirate`, ['crew'], 'Your crew, on the air', !hasRoom(b, 'radio-room')),
  ];
}

// ---------- the Inbox and Messages (mockups `inbox`, `msgs`) ----------

export type InboxKind = 'call' | 'alert' | 'letter' | 'job' | 'news';
export interface InboxItem { kind: InboxKind; who: string; look: string | null; text: string; when: string; go: string }

/** What is waiting for the Boss: applicants at the desk, the Hero closing in, a rival at boiling point, a job on the
 *  board, and the newest paper. Nothing here pops up over a page; Start shows the count. */
export function inboxModel(b: DominionBlock, run: Run): InboxItem[] {
  const out: InboxItem[] = [];
  const q = b.desk?.queue ?? [];
  if (q.length) out.push({ kind: 'call', who: 'Front desk', look: null, text: `${q.length} applicant${q.length === 1 ? '' : 's'} waiting to be stamped`, when: 'today', go: 'desk' });
  const h = hero(b, run);
  if (h && h.threat >= 40) out.push({ kind: 'alert', who: h.name, look: h.look, text: `${h.word} · ${h.place}`, when: 'now', go: 'hero' });
  const rs = rivalsOf(b).teams;
  const hot = Object.entries(rs).sort((x, y) => y[1].tension - x[1].tension || x[0].localeCompare(y[0]))[0];
  if (hot && hot[1].tension >= 30) out.push({ kind: 'letter', who: teamDef(hot[0])?.name ?? cap(hot[0]), look: teamDef(hot[0])?.boss.look ?? null, text: `Tension at ${hot[1].tension}%. They want a word.`, when: `Day ${b.day}`, go: 'rivals' });
  const job = safe(() => jobBoard(b, run)[0], undefined);
  if (job) { const m = bestFor(b, job.card); out.push({ kind: 'job', who: m?.name ?? 'The board', look: m?.look ?? null, text: `${job.card.def.name} in ${job.card.district.name} is ready`, when: 'today', go: 'jobs' }); }
  const p = papers(b).at(-1);
  if (p) out.push({ kind: 'news', who: `${regionName()} News`, look: null, text: p.items[0]!.head, when: `Day ${p.day}`, go: 'papers' });
  return out;
}

export interface Chat { who: string; look: string | null; last: string; unread: number; lines: { me: boolean; text: string }[]; replies: { label: string; go: string }[] }

/** Messages: one chat per sender in the Inbox, with the week's lines that sender would send, then one per crew member
 *  (what they would text the Boss, from their loyalty and morale). */
export function msgsModel(b: DominionBlock, run: Run): Chat[] {
  const crew: Chat[] = b.members.filter((m) => !m.crew?.out).slice(0, 5).map((m) => {
    const low = m.morale < 40 || m.loyalty < 40;
    const text = low ? `Boss, can we talk? Things have been rough.` : m.morale >= 70 ? `Ready when you are, Boss.` : `All quiet here. Anything for me tonight?`;
    return { who: m.name, look: m.look, last: text, unread: low ? 1 : 0, lines: [{ me: false, text }, { me: true, text: 'How are you holding up?' }, { me: false, text: `Loyalty ${m.loyalty}, morale ${m.morale}. ${low ? 'Could be better.' : 'Not bad.'}` }], replies: [{ label: 'Crew file', go: 'crew' }, { label: 'Talk later', go: '' }] };
  });
  return [...inboxModel(b, run).map((it) => {
    const lines: { me: boolean; text: string }[] = [{ me: false, text: it.text }];
    if (it.kind === 'news') for (const x of week(b).filter((w) => w.k === 'hero' || w.k === 'legends').slice(-2)) lines.push({ me: false, text: x.l });
    if (it.kind === 'alert') lines.push({ me: true, text: 'Where are they now?' }, { me: false, text: it.text.split(' · ').pop() ?? '' });
    if (it.kind === 'job') lines.push({ me: true, text: 'Odds?' }, { me: false, text: it.text });
    const replies = ({ call: [['Open the desk', 'desk']], alert: [['Hero file', 'hero']], letter: [['Rival file', 'rivals']], job: [['Job board', 'jobs']], news: [['Read the paper', 'papers']] } as const)[it.kind];
    return { who: it.who, look: it.look, last: it.text, unread: it.kind === 'news' ? 0 : 1, lines, replies: [...replies.map(([label, go]) => ({ label, go })), { label: 'Tell them to wait', go: '' }] };
  }), ...crew];
}

// ---------- the Adventure log (mockup `journal`) ----------

export interface LogEntry { day: number; text: string; good: boolean }
const GOOD: ReadonlySet<NewsKind> = new Set(['crew', 'legends']);

/** The Boss's log: one line a day, newest first, from the week's report lines and the papers' headlines. */
export function journalModel(b: DominionBlock): LogEntry[] {
  const by = new Map<number, LogEntry>();
  for (const p of papers(b)) by.set(p.day, { day: p.day, text: p.items[0]!.head, good: p.items[0]!.k !== 'police' && p.items[0]!.k !== 'hero' });
  for (const x of week(b)) if (!by.has(x.d) || x.k === 'crew') by.set(x.d, { day: x.d, text: x.l, good: GOOD.has(x.k) });
  if (!by.has(1)) by.set(1, { day: 1, text: `${b.teamName ?? 'The crew'} moved into HQ.`, good: true });
  return [...by.values()].sort((x, y) => y.day - x.day);
}

// ---------- Rotom's diary (mockup `rdiary`) ----------

const DIARY = {
  morning: ['The Boss counted the money twice. I counted three times. Bzzt.', 'Morning. The coffee machine and I are both buzzing.', 'I polished my screen. Nobody noticed. Again.'],
  noon: ['Funds at {funds}. I checked my maths. Zzt.', 'Heat is {heat}%. I hid behind the vending machine just in case.', '{crew} on the crew today. I said hello to every one of them.'],
  evening: ['{rival} were loud on the radio. I turned them down.', 'Evening. I tried to look like a firework. Nobody noticed.', 'The crew argued about dinner. I voted for batteries.'],
  night: ['{hero} is in {place}. I am watching for the Boss. Watching is my favourite.', 'Night. I dreamed in static.', 'The lights are off. I am the light now. Bzzt.'],
} as const;

/** Four lines for a day, from the run's numbers; the same day reads the same (picked by the day, no RNG). */
export function diaryModel(b: DominionBlock, run: Run, day = b.day): { day: number; parts: [string, string][] } {
  const h = hero(b, run);
  const fill = (s: string): string => s.replace('{funds}', money(b.funds)).replace('{heat}', String(b.heat)).replace('{crew}', String(b.members.length)).replace('{rival}', rivalName()).replace('{hero}', h?.name ?? 'The Hero').replace('{place}', h?.place ?? regionName());
  const d = Math.max(1, Math.min(b.day, day));
  return { day: d, parts: [['Morning', fill(pick(DIARY.morning, d))], ['Noon', fill(pick(DIARY.noon, d + 1))], ['Evening', fill(pick(DIARY.evening, d + 2))], ['Night', fill(pick(DIARY.night, d))]] };
}

// ---------- Ask Rotom (mockup `ask`) ----------

export interface Ask { q: string; a: string; go: string }

/** Five questions Rotom answers from the run as it stands. */
export function askModel(b: DominionBlock, run: Run): Ask[] {
  const jobs = safe(() => jobBoard(b, run), [] as BoardJob[]);
  const j = jobs[0];
  const m = j ? bestFor(b, j.card) : null;
  const sad = [...b.members].sort((x, y) => x.loyalty + x.morale - (y.loyalty + y.morale) || x.id.localeCompare(y.id))[0];
  const h = hero(b, run);
  const rv = teamsHere()[0];
  const tension = rv ? rivalsOf(b).teams[rv.id]?.tension ?? 0 : 0;
  return [
    { q: 'Tonight’s best job', go: 'jobs', a: j ? `Bzzt! ${j.card.def.name} in ${j.card.district.name}: ${j.card.chance}% to land${j.card.pay ? `, ${money(j.card.pay[0])} to ${money(j.card.pay[1])}` : ''}.${m ? ` Send ${m.name}.` : ''}` : 'Bzzt! Nothing on the board right now. Rest, or look at the map.' },
    { q: 'Who is unhappy', go: 'crew', a: sad ? `${sad.name}. Loyalty ${sad.loyalty}, morale ${sad.morale}. A day off or a raise would help. Zzt.` : 'Nobody yet. You have no crew to upset!' },
    { q: `Where ${h?.name ?? 'the Hero'} is`, go: 'hero', a: h ? `${h.name} is in ${h.place}, ${h.badges} badge${h.badges === 1 ? '' : 's'}, threat ${h.threat}%. ${h.does}` : 'No Hero has noticed you yet. Keep it that way.' },
    { q: `How to beat ${rv?.boss.name ?? 'the rivals'}`, go: 'rivals', a: rv ? `${rv.name} sit at ${tension}% tension. ${rv.boss.name} leads with ${rv.boss.species.slice(0, 2).map(cap).join(' and ')}. Hit their sites at night, not their boss.` : 'No rival team in this region. Lucky you.' },
    { q: 'What to buy', go: 'market', a: b.funds >= 3000 ? `You have ${money(b.funds)}. Build the next HQ room before anything shiny.` : `${money(b.funds)} is not much. Save it, or one quick job tonight.` },
  ];
}

// ---------- Rotom's plan (mockup `rplan`) ----------

export interface Plan { letter: string; name: string; about: string; chance: number; money: string; go: string; pick: boolean }

/** Three ways to spend tonight: the board's safest job, two jobs at once, or lying low. Rotom picks one by Heat. */
export function planModel(b: DominionBlock, run: Run): { plans: Plan[]; why: string } {
  const jobs = safe(() => jobBoard(b, run), [] as BoardJob[]);
  const safest = [...jobs].sort((x, y) => y.card.chance - x.card.chance || y.score - x.score)[0];
  const two = jobs.slice(0, 2);
  const pay = (j: BoardJob): number => (j.card.pay ? (j.card.pay[0] + j.card.pay[1]) / 2 : 0);
  const plans: Plan[] = [
    safest ? { letter: 'A', name: 'Quiet night', about: `${bestFor(b, safest.card)?.name ?? 'One squad'} on ${safest.card.def.name} · everyone else rests`, chance: safest.card.chance, money: `+${money(pay(safest))}`, go: 'jobs', pick: false }
      : { letter: 'A', name: 'Quiet night', about: 'No job on the board · the crew trains', chance: 100, money: money(0), go: 'crew', pick: false },
    two.length === 2 ? { letter: 'B', name: 'Big night', about: `${two[0]!.card.def.name} and ${two[1]!.card.def.name}, two squads`, chance: Math.round((two[0]!.card.chance * two[1]!.card.chance) / 100), money: `+${money(pay(two[0]!) + pay(two[1]!))}`, go: 'jobs', pick: false }
      : { letter: 'B', name: 'Big night', about: 'Needs two jobs on the board', chance: 0, money: money(0), go: 'jobs', pick: false },
    { letter: 'C', name: 'Lie low', about: `No jobs · Heat cools from ${b.heat}%`, chance: 100, money: money(0), go: 'hq', pick: false },
  ];
  const k = b.heat >= 60 ? 2 : safest ? 0 : 2;
  plans[k]!.pick = true;
  const why = k === 2 ? `Heat is ${b.heat}%. One more job and the police come knocking. Rest tonight.` : `Heat is ${b.heat}%. One clean job keeps the money coming without giving the police a reason. B pays more, but two squads at once is how crews get caught.`;
  return { plans, why };
}

// ---------- The road so far (mockup `chapters`) ----------

export interface Chapter { n: number; name: string; days: string; icon: string; state: 'done' | 'now' | 'next' | 'lock'; about: string }

/** The run as chapters: the Founding, the first job, the HQ growing, the Siege of the rival HQ, then the next region. */
export function chaptersModel(b: DominionBlock): Chapter[] {
  const firstJob = b.flags.includes('first-job') || b.earned > 0 || (b.annals?.funds.length ?? 0) > 3;
  const grown = b.hqLevel >= 2;
  const siege = !!b.takeover?.goal.done;
  const rv = rivalName();
  const raw: Omit<Chapter, 'state'>[] = [
    { n: 1, name: 'The Founding', days: 'Days 1–3', icon: 'g-relic-crown', about: `${b.teamName ?? 'The crew'} moves into HQ` },
    { n: 2, name: 'First Blood', days: firstJob ? 'Done' : 'Next', icon: 'g-smoke-ball', about: 'The first job and the first raid' },
    { n: 3, name: 'Moving Up', days: grown ? `HQ Lv ${b.hqLevel}` : 'HQ Lv 2', icon: 'g-star-piece', about: 'A bigger HQ, a bigger crew' },
    { n: 4, name: 'The Siege', days: 'When ready', icon: 'g-dark-gem', about: `${rv}’s hideout, floor by floor` },
    { n: 5, name: 'The Next Region', days: `After ${regionName()}`, icon: 'g-red-orb', about: 'New streets, new rivals' },
  ];
  const doneN = [b.opened, firstJob, grown, siege, false];
  const nowAt = doneN.findIndex((d) => !d);
  return raw.map((c, i) => ({ ...c, state: doneN[i] ? 'done' : i === nowAt ? 'now' : i === nowAt + 1 ? 'next' : 'lock' }));
}

// ---------- Rotom chatter (mockup `chatter`) ----------

export interface Chatter { who: string; look: string; rank: string; line: string }

/** A line about one crew member, picked by the page count (the Chatter setting says how often it shows). */
export function chatterModel(b: DominionBlock, n: number): Chatter | null {
  const ms = b.members.filter((m) => !m.crew?.out);
  if (!ms.length) return null;
  const m = pick(ms, n);
  const lines = [
    `${m.name} has loyalty ${m.loyalty} and morale ${m.morale}. Want me to keep an eye on them?`,
    `${m.name} is level ${m.level}. Their best stat is ${Object.entries(m.stats).sort((x, y) => y[1] - x[1])[0]?.[0] ?? 'heart'}. Bzzt!`,
    `${m.name} asked me what a Rotom eats. I said secrets.`,
  ];
  return { who: m.name, look: m.look, rank: cap(m.rank), line: `Bzzt! ${pick(lines, n + b.day)}` };
}

/** Whether chatter shows after this many page changes: Some every eighth page, Lots every fourth. */
export const chatterDue = (level: 'off' | 'some' | 'lots', pages: number): boolean => level !== 'off' && pages > 0 && pages % (level === 'lots' ? 4 : 8) === 0;

export { districtName };

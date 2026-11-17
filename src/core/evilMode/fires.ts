// Evil Mode slice 12: the fires (design Part 19). Once a region, at a rest stop, out of uniform: three exchanges, then one
// thing of the player's own, kept word for word. Pure. Nothing here draws from a stream: the player's typed words are
// shown and stored and decide nothing. `liedToHero` is never a stored flag: it's read from the lies kept, at the end.

import { EVIL_DATA, type EvilData } from './data';
import { appendLog, fill } from './ledger';
import { heroReason } from './hero';
import { dayIn, stageKind } from './region';
import { monName, moveTemper } from './temper';
import type { EvilModeBlock, FireN, FireState, Hero } from './schema';

type Choice = EvilData['fires']['andYou']['answers'][number];

export { monName };
const bare = (t: string) => t.replace(/^Day \d+\. /, '');

/** Which fire a region has (Part 19 section 2.4): first, second, third; the run's last region the last; between, middles. */
export function fireN(block: Pick<EvilModeBlock, 'here' | 'settings'>): FireN {
  const r = block.here.region;
  const last = (block.settings.length === 'six' ? 6 : 3) - 1;
  if (r === 0) return 'first';
  if (r === 1) return 'second';
  if (r === last) return 'last';
  return r === 2 ? 'third' : 'middle';
}

/** True once the Boss has said "I'm the one in charge": the last fire doesn't happen (that one was it). */
const fireHad = (hero: Hero, region: number) => hero.fires.some((f) => f.region === region);

/** The flame on the Board (Part 19 section 1.1): the fire's district, its day (and the day after, if they're resting), never at Past talking, once a region. */
export function flameAt(block: EvilModeBlock, data: EvilData = EVIL_DATA): number | null {
  const F = data.fires;
  const hero = block.hero;
  const d = block.district;
  if (!F.on || !hero || !d || d.end || block.fire || stageKind(block.here.stage) !== 'district' || d.n !== F.rules.district) return null;
  if (hero.temper >= F.rules.noFlameAt || fireHad(hero, block.here.region)) return null;
  if (fireN(block) === 'last' && hero.told) return null;
  const day = dayIn(block);
  const lit = day === F.rules.day || (day === F.rules.day + 1 && (hero.restOn === block.here.day || hero.restOn === block.here.day - 1));
  return lit ? hero.at : null;
}

/** Sit at the fire: the day's in-person slot. */
export function sitFire(block: EvilModeBlock, data: EvilData = EVIL_DATA): { block: EvilModeBlock; problem: string | null } {
  if (block.here.beat !== 'inPerson') return { block, problem: 'The fire is lit at the In person beat.' };
  if (block.inPerson?.day === block.here.day) return { block, problem: 'The Boss has already been out today.' };
  if (block.fight) return { block, problem: 'A battle is waiting.' };
  const at = flameAt(block, data);
  if (at === null) return { block, problem: block.hero && block.hero.temper >= data.fires.rules.noFlameAt ? data.fires.flame.pastTalking! : 'There\'s no fire on the road today.' };
  const n = fireN(block);
  const mid = n === 'middle' ? block.here.region % data.fires.middle.length : null;
  const P = data.fires.personalities[block.hero!.personality];
  const one = n === 'middle' ? null : P[n];
  const ctx = slots(block, data);
  const awake = !!one?.awake;
  const opening = one ? (one.openNo && !hasSlots(one.open, ctx) ? one.openNo : one.open) : [data.fires.middle[mid!]!.open];
  const lines = [fill(awake ? data.fires.scene.setAwake! : data.fires.scene.set!, ctx), ...opening.map((x) => fill(x, ctx))];
  const fire: FireState = { n, mid, step: 'ex1', lines, picks: [], listened: 0, talked: 0, down: false, notebook: false };
  return { block: { ...block, fire, inPerson: { day: block.here.day, holdingId: 'fire' } }, problem: null };
}

/** The slots the fires read from the run, each with a written fallback (Part 19, "Ledger-fed slots"). */
export function slots(block: EvilModeBlock, data: EvilData = EVIL_DATA): Record<string, string> {
  const S = data.fires.slots;
  const hero = block.hero!;
  const reason = heroReason(block, data);
  const region = block.here.region;
  const went = block.log.filter((e) => e.region === region && e.kind === 'job' && e.result === 'went');
  const kindest = went.find((e) => e.method === 'pay' || e.method === 'persuade') ?? block.log.find((e) => e.region === region && e.kind === 'waive');
  const worst = went.find((e) => e.method === 'lean' || e.method === 'take');
  const held = block.log.find((e) => e.kind === 'hero' && e.who.length && block.district?.holdings.find((h) => h.id === e.to)?.owner === 'team');
  const grunt = held ? block.crew.find((c) => c.id === held.who[0])?.name : undefined;
  const met = block.crew.find((c) => c.ref && block.log.some((e) => e.kind === 'hero' && e.who.includes(c.id))) ?? block.crew.find((c) => c.ref && c.where === 'in');
  const mline = met?.line ? data.people.lines.find((l) => l.n === met.line)?.text : undefined;
  const creed = data.creeds.find((c) => c.id === block.team.creed);
  const lastOwn = hero.fires.filter((f) => !f.missed && f.own).at(-1)?.own;
  const softer = block.lineMove && ['clean', 'grey', 'whatever'].indexOf(block.lineMove.to) < ['clean', 'grey', 'whatever'].indexOf(block.lineMove.from);
  return {
    name: hero.name, mon: monName(hero.starter),
    reason: reason ? reason.reason.says : S.reasonNone!,
    ...(kindest && worst ? { kind: bare(kindest.text), worst: bare(worst.text) } : {}),
    ledger: S.ledgerNone!,
    ...(grunt ? { grunt } : {}),
    person: met?.name ?? S.personNone!,
    personLine: mline ? `They said: "I ${mline.charAt(0).toLowerCase()}${mline.slice(1)}"` : S.personLineNone!,
    sentence: creed?.line ?? '',
    doing: data.fires.idealistDoing[(block.team.creed as 'profit')] ?? data.fires.idealistDoing.cause,
    changed: softer || block.base?.latch === false ? data.fires.idealistChanged.yes : data.fires.idealistChanged.no,
    ...(lastOwn ? { own: lastOwn } : {}),
    met: String(Math.max(1, block.crew.filter((c) => c.ref).length)),
  };
}

const hasSlots = (lines: readonly string[], ctx: Record<string, string>): boolean => lines.every((l) => [...l.matchAll(/\{(\w+)\}/g)].every((m) => ctx[m[1]!] !== undefined));

/** The choices open at this step, as the screen shows them (no hint which are listening). */
export function fireChoices(block: EvilModeBlock, data: EvilData = EVIL_DATA): { id: string; say: string }[] {
  const f = block.fire;
  const hero = block.hero;
  if (!f || !hero) return [];
  const ctx = slots(block, data);
  const F = data.fires;
  const P = F.personalities[hero.personality];
  const one = f.n === 'middle' ? null : P[f.n];
  const list = (cs: readonly { say: string }[], pre: string) => cs.map((c, i) => ({ id: `${pre}:${i}`, say: fill(c.say, ctx) }));
  if (f.step === 'ex1') return list(one ? one.ex1 : F.middle[f.mid!]!.ex1, 'ex1');
  if (f.step === 'andYou') return [...list(F.andYou.answers, 'andYou'), { id: 'andYou:creed', say: F.andYou.creed[block.team.creed as 'profit']?.say ?? '' }].filter((c) => c.say);
  if (f.step === 'justWork') return list(F.andYou.justWorkThen, 'justWork');
  if (f.step === 'third') return list(F.third.answers, 'third');
  if (f.step === 'ex3' && one) return list(one.ex3, 'ex3');
  if (f.step === 'own') return [...ownList(block, data).map((say, i) => ({ id: `own:${i}`, say })), { id: 'own:silence', say: F.scene.silence! }];
  return [];
}

/** "From a list by Creed": three always there, six by Creed, six by Line (Part 19 section 2.3). */
export function ownList(block: EvilModeBlock, data: EvilData = EVIL_DATA): string[] {
  const O = data.fires.own;
  return [...O.always, ...(O.creed[block.team.creed as 'profit'] ?? []), ...O.line[block.team.line]];
}

/** The typed line's filter: the team name's rules, for a sentence: printable, one line, up to 120 letters. */
export function checkOwn(raw: string, data: EvilData = EVIL_DATA): { ok: boolean; text: string; problem: string | null } {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (text.length > data.fires.rules.ownMax) return { ok: false, text, problem: `Keep it to ${data.fires.rules.ownMax} letters or fewer.` };
  if (/[<>{}\\]|[\u0000-\u001f]/.test(text)) return { ok: false, text, problem: 'Words and ordinary punctuation, please.' };
  return { ok: true, text, problem: null };
}

const pickOf = (block: EvilModeBlock, id: string, data: EvilData): Choice | undefined => {
  const f = block.fire!;
  const F = data.fires;
  const [step, i] = id.split(':');
  const P = F.personalities[block.hero!.personality];
  const one = f.n === 'middle' ? null : P[f.n];
  if (step === 'ex1') return (one ? one.ex1 : F.middle[f.mid!]!.ex1)[Number(i)];
  if (step === 'andYou') return i === 'creed' ? (() => { const c = F.andYou.creed[block.team.creed as 'profit']; return c ? { ...c, kind: 'talk' as const, id: 'creed' } : undefined; })() : F.andYou.answers[Number(i)];
  if (step === 'justWork') return F.andYou.justWorkThen[Number(i)];
  if (step === 'third') return F.third.answers[Number(i)];
  if (step === 'ex3') return one?.ex3[Number(i)];
  return undefined;
};

/** Answer the exchange that's open. Refuses anything not offered. */
export function fireAnswer(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA): { block: EvilModeBlock; problem: string | null; fight: boolean } {
  const f0 = block.fire;
  const hero0 = block.hero;
  if (!f0 || !hero0 || f0.step === 'own' || f0.step === 'done' || f0.step === 'practice') return { block, problem: 'Nothing to answer.', fight: false };
  if (!fireChoices(block, data).some((c) => c.id === id)) return { block, problem: 'That isn\'t one of the answers.', fight: false };
  const c = pickOf(block, id, data)!;
  const ctx = slots(block, data);
  const F = data.fires;
  let f: FireState = { ...f0, picks: [...f0.picks, id], listened: f0.listened + (c.kind === 'listen' ? 1 : 0), talked: f0.talked + (c.kind === 'talk' ? 1 : 0), lines: [...f0.lines, `You: ${fill(c.say, ctx)}`, ...c.reply.map((r) => fill(r, ctx))] };
  let hero: Hero = hero0;
  let crew = block.crew;
  let fight = false;
  let out: EvilModeBlock = block;
  if (c.file) hero = { ...hero, learned: [...hero.learned, c.file] };
  if (c.lie) hero = { ...hero, lies: [...hero.lies, { kind: 'justWork', day: block.here.day, region: block.here.region }] };
  if (c.fx === 'temperDown') f = { ...f, down: true };
  if (c.fx === 'notebook') f = { ...f, notebook: true };
  if (c.fx === 'heroLine') hero = { ...hero, heroLine: fill(c.say, ctx) };
  if (c.fx === 'loyalty') {
    const met = block.crew.find((x) => x.name === ctx.person);
    if (met) { crew = crew.map((x) => (x.id === met.id ? { ...x, loyalty: Math.min(10, x.loyalty + 1) } : x)); out = { ...out, evening: [...out.evening, fill(F.loyalty, { name: met.name })] }; }
  }
  const step = id.split(':')[0];
  const P = F.personalities[hero.personality];
  if (step === 'third') {
    const tid = (c as { id?: string }).id;
    if (tid === 'charge') {
      hero = { ...hero, told: true };
      const told = f.n === 'middle' ? undefined : P[f.n].told;
      if (told) f = { ...f, lines: [...f.lines, told] };
    }
    if (tid === 'oneOf') {
      if (hero.temper >= 2) return { block: { ...out, crew, hero: endFire(hero, { ...f, lines: [...f.lines, F.third.leave], step: 'done' }, block, null, data), fire: { ...f, lines: [...f.lines, F.third.leave], step: 'done' } }, problem: null, fight: false };
      f = { ...f, lines: [...f.lines, F.third.sitBack] };
    }
  }
  // The order: exchange 1, "And you?" (and "Is it all right? Working there?" after the lie), the third fire's extra, their question, then the line of your own.
  const next: FireState['step'] = f.n === 'middle' && step === 'ex1' ? 'own'
    : step === 'ex1' ? 'andYou'
    : step === 'andYou' ? (c.lie ? 'justWork' : f.n === 'third' ? 'third' : 'ex3')
    : step === 'justWork' ? (f.n === 'third' ? 'third' : 'ex3')
    : step === 'third' ? 'ex3'
    : c.fx === 'practice' ? 'practice' : 'own';
  if (next === 'ex3' && f.n !== 'middle') f = { ...f, lines: [...f.lines, fill(P[f.n].ask, ctx)] };
  if (next === 'andYou') f = { ...f, lines: [...f.lines, F.andYou.ask] };
  if (next === 'own') f = { ...f, lines: [...f.lines, F.scene.own!] };
  if (next === 'practice') {
    f = { ...f, lines: [...f.lines, fill(F.practice.begin!, ctx)] };
    fight = true;
    out = { ...out, fight: { kind: 'practice', holdingId: 'fire', begun: false } };
  }
  return { block: { ...out, crew, hero, fire: { ...f, step: next } }, problem: null, fight };
}

/** The practice battle's over: one mark, whoever won (Part 19 section 10.1). Then the line of your own. */
export function practiceResult(block: EvilModeBlock, data: EvilData = EVIL_DATA): { block: EvilModeBlock; lines: string[] } {
  const f = block.fire;
  const hero = block.hero;
  if (!f || !hero || f.step !== 'practice') return { block: { ...block, fight: null }, lines: [] };
  const ctx = slots(block, data);
  const lines = [fill(data.fires.practice.after!, ctx), data.fires.practice.mark!];
  return { block: { ...block, fight: null, hero: { ...hero, practiced: true, marks: Math.min(data.hero.marks.max, hero.marks + 1) }, fire: { ...f, step: 'own', lines: [...f.lines, ...lines, data.fires.scene.own!] } }, lines };
}

/** One thing of the player's own: typed (filtered, kept whole), one from the list, or silence (''). Ends the fire. */
export function fireOwn(block: EvilModeBlock, own: { text?: string; pick?: number; silence?: boolean }, data: EvilData = EVIL_DATA): { block: EvilModeBlock; problem: string | null } {
  const f = block.fire;
  const hero = block.hero;
  if (!f || !hero || f.step !== 'own') return { block, problem: 'Not yet.' };
  let text: string;
  if (own.silence) text = '';
  else if (own.pick !== undefined) {
    const l = ownList(block, data)[own.pick];
    if (l === undefined) return { block, problem: 'Pick one of the lines.' };
    text = l;
  } else {
    const c = checkOwn(own.text ?? '', data);
    if (!c.ok) return { block, problem: c.problem };
    text = c.text;
  }
  const said = text ? `You: ${text}` : data.fires.scene.silence!;
  const done: FireState = { ...f, step: 'done', lines: [...f.lines, said, data.fires.scene.end!] };
  let out: EvilModeBlock = { ...block, fire: done, hero: endFire(hero, done, block, text, data) };
  out = appendLog(out, { kind: 'hero', who: [], text: `Day ${block.here.day}. ${fill(data.fires.flame.had!, { name: hero.name })}` });
  return { block: out, problem: null };
}

/** The fire's kept: the temper by the count, the picks, the player's words word for word. */
function endFire(hero: Hero, f: FireState, block: EvilModeBlock, own: string | null, data: EvilData): Hero {
  let h: Hero = { ...hero, met: true, fires: [...hero.fires, { region: block.here.region, district: block.district?.n ?? 0, day: block.here.day, n: f.n, picks: f.picks, own, listened: f.listened, talked: f.talked, missed: false }] };
  if (f.down) h = moveTemper(h, -1, 'ask', data);
  else if (f.listened > f.talked) h = moveTemper(h, -1, 'fire', data);
  return h;
}

/** Leave the fire (its text stays until this). */
export const closeFire = (block: EvilModeBlock): { block: EvilModeBlock; problem: string | null } =>
  (block.fire?.step === 'done' ? { block: { ...block, fire: null }, problem: null } : { block, problem: block.fire ? 'Not yet.' : 'No fire.' });

/** The region's fire district is over with no fire sat at: it's gone (Part 19 section 1.1), and the File says so. */
export function fireMissed(block: EvilModeBlock, leftDistrict: number, data: EvilData = EVIL_DATA): EvilModeBlock {
  const hero = block.hero;
  if (!hero || !data.fires.on || leftDistrict !== data.fires.rules.district || fireHad(hero, block.here.region)) return block;
  if (fireN(block) === 'last' && hero.told) return block;
  return { ...block, hero: { ...hero, learned: [...hero.learned, data.fires.flame.missed!], fires: [...hero.fires, { region: block.here.region, district: leftDistrict, day: block.here.day, n: fireN(block), picks: [], own: null, listened: 0, talked: 0, missed: true }] } };
}

/** The Office notebook, on the Night after a fire: one line, 120 letters, kept (Part 2; Part 30 `writeNotebook`). */
export function writeNotebook(block: EvilModeBlock, raw: string, data: EvilData = EVIL_DATA): { block: EvilModeBlock; problem: string | null; line: string } {
  const hero = block.hero;
  const F = data.fires;
  if (!hero || block.here.beat !== 'night' || !hero.fires.some((f) => !f.missed && f.day === block.here.day && f.region === block.here.region)) return { block, problem: F.flame.noteNone!, line: '' };
  const key = `notebook:${block.here.region}:${block.here.day}`;
  if (block.applied.includes(key)) return { block, problem: 'One line. It\'s written.', line: '' };
  const c = checkOwn(raw, data);
  if (!c.ok || !c.text) return { block, problem: c.problem ?? 'Write something, or leave it.', line: '' };
  return { block: { ...block, applied: [...block.applied, key], hero: { ...hero, notebook: [...hero.notebook, c.text] } }, problem: null, line: fill(F.flame.kept!, { text: c.text }) };
}

/** The Strategist's notebook: the File from the other side. What the team did on the road, a blank "Why?", the prices. */
export function strategistNotebook(block: EvilModeBlock, data: EvilData = EVIL_DATA): { rows: [string, string][]; foot: string[] } {
  const N = data.fires.notebook as Record<string, string>;
  const rows = block.log.filter((e) => e.kind === 'job' && e.result === 'went' && e.region === block.here.region).slice(-10).map((e): [string, string] => [bare(e.text), '']);
  return { rows, foot: rows.length ? [N.prices!, N.total!] : [N.none!] };
}

/**
 * Whether the Boss lied to the Hero, read at the end, not when said (Part 30 section 8: "if it's still untrue at the
 * run's end"). "I just work there" is a lie unless the Boss has lost the Chair and serves (that comes with slice 13's
 * Chair; until then it's always untrue). A Mislead and a lie in the last room are always lies. Never unset.
 */
export function liedToHero(block: EvilModeBlock): boolean {
  const hero = block.hero;
  if (!hero) return false;
  const servesNow = false;
  return hero.lies.some((l) => (l.kind === 'justWork' ? !servesNow : true));
}

// DOMINION slice D3: internal interactions, the first batch (internal-interactions.md section A, "Boss and Grunt",
// 1-30; the other 270 come with later slices). A talk is a small card with two or three choices. Morning talks are
// dealt by the crew step (stream `dominion-internal`); Evening talks are asked for by the Boss. At most two a day, never
// the same one twice in seven days, each member in at most one a day, "once" talks once per member. The card waits for
// an answer; the answer is saved the moment it's picked.

import { addLoyalty, addMorale, addCrewHook, crewOf, freshCrewState, leave, rankN, rng, taskById, treat, withCrew } from './crew';
import { DOMINION_DATA } from './data';
import type { DominionBlock, Member, Talk, TalkChoice } from './schema';
import { STAT_IDS } from './schema';
import { fill } from './worldTurn';
import { promote, readyFor, seatsOpen } from './pyramid';

const C = () => DOMINION_DATA.crew;
const R = () => DOMINION_DATA.crew.rules;
const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, Math.round(n)));

export const talkById = (id: string): Talk | undefined => C().talks.find((t) => t.id === id);
const flagDay = (flags: string[], key: string): number | null => {
  const f = flags.find((x) => x.startsWith(`${key}:`));
  return f ? Number(f.slice(key.length + 1)) : null;
};

export interface TalkCtx { held?: boolean }

/** Does this talk fit this member right now? */
export function fits(b: DominionBlock, m: Member, t: Talk, when: 'morning' | 'evening', roll: () => number, ctx: TalkCtx = {}): boolean {
  if (t.needs || t.when !== when || !t.trigger) return false;
  const c = crewOf(m);
  const last = c.talked[t.id];
  if (last !== undefined && (t.once || b.day - last < R().talkRepeatDays)) return false;
  const g = t.trigger;
  if (g.newMember && b.day - m.joinedDay > 1) return false;
  if (g.moraleBelow !== undefined && m.morale >= g.moraleBelow) return false;
  if (g.loyaltyAtLeast !== undefined && m.loyalty < g.loyaltyAtLeast) return false;
  if (g.loyaltyBelow !== undefined && m.loyalty >= g.loyaltyBelow) return false;
  if (g.loyaltyBetween && (m.loyalty < g.loyaltyBetween[0] || m.loyalty > g.loyaltyBetween[1])) return false;
  if (g.wageStaleDays !== undefined && b.day - c.wageDay < g.wageStaleDays) return false;
  if (g.lastTask === 'success' && c.last !== 'success' && c.last !== 'big') return false;
  if (g.lastTask && g.lastTask !== 'success' && c.last !== g.lastTask) return false;
  if (g.bigSuccess && c.last !== 'big') return false;
  if (g.pHeatAtLeast !== undefined && c.pHeat < g.pHeatAtLeast) return false;
  if (g.hasHeldItem && !ctx.held) return false;
  if (g.rested && !b.rested) return false;
  if (g.workedDays !== undefined && c.worked < g.workedDays) return false;
  if (g.kind && c.kind !== g.kind) return false;
  if (g.green && (c.green !== g.green || c.formed.length)) return false;
  if (g.brokePromise !== undefined) {
    const d = flagDay(c.flags, 'promised-raise');
    if (d === null || b.day - d < g.brokePromise) return false;
  }
  if (g.refused && c.last !== 'refused') return false;
  if (g.fundsAtLeast !== undefined && b.funds < g.fundsAtLeast) return false;
  if (g.rankAtLeast && rankN(m.rank) < rankN(g.rankAtLeast)) return false;
  if (g.ready) {
    const next = readyFor(b, m);
    if (!next || !seatsOpen(b, next.id)) return false;
  }
  if (g.passedOver && (flagDay(c.flags, 'passed') ?? -9) < b.day - 1) return false;
  if (c.out && g.lastTask !== 'arrested') return false;
  if (g.chance !== undefined && roll() > g.chance) return false;
  return true;
}

function deal(b: DominionBlock, m: Member, t: Talk): void {
  const st = (b.crew ??= freshCrewState());
  crewOf(m).talked[t.id] = b.day;
  st.talks.push({ member: m.id, talk: t.id, task: crewOf(m).lastTask });
  st.talksToday += 1;
}

/** Morning talks, dealt after the night's tasks (the crew step's hook). */
addCrewHook((b, seed) => {
  const st = (b.crew ??= freshCrewState());
  st.talkDay = b.day;
  st.talksToday = st.talks.length;
  const r = rng(seed, 'dominion-internal', b.day);
  const roll = (): number => r.int(1, 100);
  const pairs: [Member, Talk][] = [];
  for (const m of b.members) {
    if (st.talks.some((x) => x.member === m.id)) continue;
    const t = C().talks.find((x) => fits(b, m, x, 'morning', roll));
    if (t) pairs.push([m, t]);
  }
  // Crises first (arrests, refusals, heat), then the rest in a rolled order.
  const crisis = (t: Talk): number => (['second-chance', 'draw-a-line', 'cover-for-me', 'confession-of-doubt'].includes(t.id) ? 0 : 1);
  pairs.sort((a, x) => crisis(a[1]) - crisis(x[1]) || r.int(-1, 1));
  for (const [m, t] of pairs) {
    if (st.talksToday >= R().talksPerDay) break;
    deal(b, m, t);
  }
  for (const g of st.gone.filter((x) => x.day === b.day)) st.talks.push({ member: g.id, talk: 'goodbye', task: null });
  // Map walks wear off after 14 days (talk 21).
  for (const m of b.members) {
    const c = crewOf(m);
    const until = flagDay(c.flags, 'map');
    if (until !== null && b.day > until) c.flags = c.flags.filter((f) => !f.startsWith('map:'));
  }
});

/** The Boss asks a member for an Evening talk: the first one that fits them, if today has room. */
export function eveningTalk(block: DominionBlock, memberId: string, seed: string, ctx: TalkCtx = {}): { ok: boolean; block: DominionBlock; notice: string | null } {
  const b = withCrew(block);
  const st = b.crew!;
  if (st.talkDay !== b.day) {
    st.talkDay = b.day;
    st.talksToday = 0;
  }
  const m = b.members.find((x) => x.id === memberId);
  if (!m || b.phase !== 'evening') return { ok: false, block, notice: null };
  if (st.talks.length) return { ok: false, block, notice: 'Answer the talk that\'s waiting first.' };
  if (st.talksToday >= R().talksPerDay) return { ok: false, block, notice: 'Enough talking for one day.' };
  const r = rng(seed, 'dominion-internal', b.day, m.id, 'evening');
  const t = C().talks.find((x) => fits(b, m, x, 'evening', () => r.int(1, 100), ctx));
  if (!t) return { ok: false, block, notice: `${m.name} has nothing to say tonight.` };
  deal(b, m, t);
  return { ok: true, block: b, notice: null };
}

export interface TalkCard { member: string; name: string; talk: Talk; text: string }

/** The card on top, for the screen. */
export function topTalk(b: DominionBlock): TalkCard | null {
  const card = b.crew?.talks[0];
  if (!card) return null;
  const t = talkById(card.talk);
  const m = b.members.find((x) => x.id === card.member);
  const name = m?.name ?? b.crew!.gone.find((g) => g.id === card.member)?.name ?? '?';
  if (!t) return null;
  const label = card.task ? (C().quickLabels[card.task] ?? taskById(card.task)?.name ?? card.task).toLowerCase() : '';
  return { member: card.member, name, talk: t, text: fill(t.text ?? '', { name, task: label }) };
}

/** Answers the card on top. `gift` asks the session to hand over a held item (talk 15). */
export function answer(block: DominionBlock, choice: number, seed: string): { ok: boolean; block: DominionBlock; notice: string | null; gift: string | null } {
  const b = withCrew(block);
  const st = b.crew!;
  const card = st.talks[0];
  const t = card ? talkById(card.talk) : undefined;
  const ch = t?.choices?.[choice];
  if (!card || !t || !ch) return { ok: false, block, notice: null, gift: null };
  st.talks.shift();
  const m = b.members.find((x) => x.id === card.member);
  if (!m) {
    // Goodbye: the member has gone; the crew watches how you treat leavers.
    apply(b, null, ch, card.task, seed, t);
    return { ok: true, block: b, notice: null, gift: null };
  }
  const notice = apply(b, m, ch, card.task, seed, t);
  return { ok: true, block: b, notice, gift: ch.gift ? m.id : null };
}

function apply(b: DominionBlock, m: Member | null, ch: TalkChoice, task: string | null, seed: string, t: Talk): string | null {
  const others = b.members.filter((x) => x !== m);
  if (ch.crewMor) for (const x of others) addMorale(x, ch.crewMor);
  if (ch.crewLoy) for (const x of others) addLoyalty(b, x, ch.crewLoy);
  if (ch.funds) b.funds += ch.funds;
  if (ch.heat) b.heat = clamp(b.heat + ch.heat);
  if (!m) return null;
  const c = crewOf(m);
  let notice: string | null = null;
  let mor = ch.mor ?? 0;
  if (ch.loudmouthMor !== undefined && c.green === 'loudmouth' && !c.formed.length && rng(seed, 'dominion-internal', b.day, m.id, t.id).int(1, 100) <= R().loudmouthBackfire) {
    mor = ch.loudmouthMor;
    notice = `It lands badly. ${m.name} talks over you.`;
  }
  if (ch.loy) addLoyalty(b, m, ch.loy);
  if (mor) addMorale(m, mor);
  if (ch.amb) c.ambition = clamp(c.ambition + ch.amb);
  if (ch.pHeat) c.pHeat = clamp(c.pHeat + ch.pHeat);
  if (ch.wage) {
    m.wage += ch.wage;
    c.wageDay = b.day;
    c.flags = c.flags.filter((f) => !f.startsWith('promised-raise:'));
  }
  if (ch.stat) for (const k of STAT_IDS) if (ch.stat[k]) m.stats[k] = Math.max(1, Math.min(10, m.stats[k] + ch.stat[k]!));
  if (ch.treat) treat(m, ch.treat);
  if (ch.unpunish) c.treat.punish = Math.max(0, (c.treat.punish ?? 0) - 1);
  if (ch.flag === 'promised-raise') c.flags.push(`promised-raise:${b.day}`);
  else if (ch.flag === 'map-14') c.flags.push(`map:${b.day + 14}`);
  else if (ch.flag) c.flags.push(ch.flag);
  if (ch.promiseAgain) c.flags = [...c.flags.filter((f) => !f.startsWith('promised-raise:')), `promised-raise:${b.day - 7}`];
  if (ch.memory) c.memory.push({ day: b.day, line: ch.memory });
  if (ch.promote) {
    const p = promote(b, m.id);
    notice = p.notice;
  }
  if (ch.nick) c.nick = ch.nick;
  if (ch.action) b.crew!.saved += ch.action;
  if (ch.task) c.flags.push(`once:${ch.task}`);
  if (ch.half) c.flags.push('half');
  if (ch.saveLine && task) c.line.push(task);
  if (ch.force && task) c.flags.push(`forced:${task}`);
  if (ch.nerveTest) {
    const ok = rng(seed, 'dominion-internal', b.day, m.id, 'nerve').int(1, 100) <= m.stats.nerve * R().oddsPerStat + R().nerveTestBase;
    if (ok) {
      c.flags.push('nervous-fading');
      notice = `${m.name} came back shaking, and grinning. The nerves are fading.`;
    } else {
      addMorale(m, -8);
      notice = `${m.name} ran. Morale −8.`;
    }
  }
  if (ch.leave) leave(b, m, 'dismissed', null, '');
  return notice;
}

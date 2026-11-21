// DOMINION D10 follow-up: the Chair's visitors whose answers need Growth (court cards 29, 32, 37, 39, 45, 46, 51, 53, 65,
// 66, 78, 79, 98, 99, 100, 101, 130, 131). Each answer is a `hook:` in tools/dominion/court-to-json.py's SPEC; this file
// registers what it does. Answers only touch the block; what needs the run (the Bag: selling hot goods, a heist's crate)
// waits in `growth.court` and is settled right after by `settleCourt` (session.ts). Numbers live in growth.json "court".
import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { chairOf, setChairHook } from './chair';
import { DOMINION_DATA } from './data';
import { addActAfter, addActionGate, addHeat, addOddsPartHook } from './field';
import { growthOf, gymDef, openLoot, sellHot } from './growth';
import { buildingDef, withHq } from './hqFx';
import { maxTier, recompute, slotsFree } from './hq';
import { addPickupShare } from './police';
import type { DominionBlock, GrowthCourt } from './schema';
import { addWorldStep, fill } from './worldTurn';
import { rng } from './crew';

const C = () => DOMINION_DATA.growth.court;
const Ln = (k: string): string => DOMINION_DATA.growth.lines[k] ?? k;
const money = (n: number): string => n.toLocaleString('en-US');

const freshCourt = (): GrowthCourt => ({
  union: false, strike: 0, fence: false, sell: [], heist: 0, judge: 0, tip: 0, council: false, koga: 0, accountant: false, architect: false, weak: false,
});
/** The block's court state (filled the same way every time: a save from before it loads unchanged). */
export const courtOf = (b: DominionBlock): GrowthCourt => (growthOf(b).court ??= freshCourt());
const peek = (b: DominionBlock): GrowthCourt | null => b.growth?.court ?? null;

// ---------- the answers ----------

setChairHook('union', (b) => {
  courtOf(b).union = true;
  return fill(Ln('union'), { cut: C().unionCut });
});
setChairHook('strike', (b) => {
  courtOf(b).strike = b.day + C().strikeDays;
  return fill(Ln('strike'), { days: C().strikeDays });
});
setChairHook('fence-now', (b) => {
  if (!Object.keys(growthOf(b).hot).length) return Ln('courtFenceNone');
  courtOf(b).sell.push(C().fenceNow);
  return fill(Ln('courtFence'), { pct: C().fenceNow });
});
setChairHook('fence-last', (b) => {
  if (!Object.keys(growthOf(b).hot).length) return Ln('courtFenceNone');
  courtOf(b).sell.push(C().fenceLast);
  return fill(Ln('courtFence'), { pct: C().fenceLast });
});
setChairHook('fence-week', (b) => {
  courtOf(b).fence = true;
  return fill(Ln('courtFenceWeek'), { pct: C().fenceWeek });
});
setChairHook('judge', (b) => {
  courtOf(b).judge = b.day + C().judgeDays;
  return fill(Ln('judge'), { pct: C().judge, days: C().judgeDays });
});
// Dirt on the judge: Blackmail him (his two weeks, without the donation).
setChairHook('judge-dirt', (b) => {
  const g = growthOf(b);
  if (!g.dirt.includes('judge')) g.dirt.push('judge');
  courtOf(b).judge = b.day + C().judgeDays;
  return `${Ln('judgeDirt')} ${fill(Ln('judge'), { pct: C().judge, days: C().judgeDays })}`;
});
setChairHook('informant', (b) => {
  courtOf(b).tip = b.day + C().tipDays;
  return fill(Ln('informant'), { days: C().tipDays });
});
setChairHook('council', (b) => {
  courtOf(b).council = true;
  return fill(Ln('council'), { pct: C().council });
});
setChairHook('heist', (b) => {
  courtOf(b).heist += 1;
  return Ln('heist');
});
setChairHook('koga', (b) => {
  courtOf(b).koga = b.day + C().kogaDays;
  return fill(Ln('koga'), { n: C().koga, days: C().kogaDays });
});
// A bought Leader goes public: the Gym is lost (the first one bought).
setChairHook('gym-lost', (b) => {
  const g = growthOf(b);
  const id = Object.keys(g.gyms).sort().find((k) => g.gyms[k]!.way === 'buy');
  if (!id) return null;
  delete g.gyms[id];
  const def = gymDef(id);
  return fill(Ln('gymLost'), { gym: def ? `${def.leader}'s Gym` : 'The Gym' });
});
setChairHook('accountant', (b) => {
  courtOf(b).accountant = true;
  return fill(Ln('accountant'), { fee: C().accountantFee });
});
setChairHook('architect', (b) => {
  courtOf(b).architect = true;
  return fill(Ln('architect'), { pct: C().architect });
});
setChairHook('weak-spot', (b) => {
  courtOf(b).weak = true;
  return fill(Ln('weakSpot'), { n: C().weakDefense });
});

/** A building given by a visitor: ready now, tier 1, free. With no slot left, it is sold on at its price (clean). */
function gift(b: DominionBlock, id: string): string | null {
  const def = buildingDef(id);
  if (!def) return null;
  withHq(b);
  if (!b.hq) return null;
  const at = def.outside ? DOMINION_DATA.field.hq : null;
  const full = def.outside ? b.hq.rooms.some((r) => r.id === def.id && r.at === at) : def.slots > slotsFree(b);
  if (full) {
    b.hq.clean += def.cost;
    return fill(Ln('giftFull'), { name: def.name, n: money(def.cost) });
  }
  b.hq.rooms.push({ uid: `r${b.hq.next++}`, id, tier: 1, cond: 100, spent: 0, building: false, up: false, ready: b.day, shut: false, ruined: false, at });
  recompute(b as Parameters<typeof recompute>[0]);
  return fill(Ln('gift'), { name: def.name });
}
setChairHook('gift-shop', (b) => gift(b, C().gifts.shop));
setChairHook('gift-cafe', (b) => gift(b, C().gifts.cafe));
setChairHook('gift-house', (b) => gift(b, C().gifts.house));

// The rival scientist's lab machine: the first working room that can go one tier higher does, now.
setChairHook('machine', (b) => {
  withHq(b);
  const top = maxTier(b);
  const room = b.hq?.rooms.find((r) => !r.building && !r.up && !r.ruined && r.tier < top);
  if (!room) return Ln('machineNone');
  room.tier += 1;
  recompute(b as Parameters<typeof recompute>[0]);
  return fill(Ln('machine'), { room: buildingDef(room.id)?.name ?? room.id });
});

// Blaine's quiz: three riddles, each answered right on the Boss's Wits; enough right wins his prize. The list says a TM;
// the game's TMs teach a move on the spot (an item-catalog entry, not a Bag item), so he pays a Fire Stone.
setChairHook('quiz', (b, r) => {
  const q = C().quiz;
  const pool = q.riddles.map((_, i) => i);
  const asked: number[] = [];
  while (asked.length < 3 && pool.length) asked.push(pool.splice(r.int(0, pool.length - 1), 1)[0]!);
  const odds = Math.min(q.cap, q.base + b.field.edge.stats.wits * q.perWits);
  let right = 0;
  const said = asked.map((i) => {
    const [question, answer] = q.riddles[i]!;
    const ok = r.int(1, 100) <= odds;
    if (ok) right += 1;
    return fill(Ln('quizQ'), { q: question, a: ok ? answer : 'no idea', ok: ok ? 'right' : `wrong (it's ${answer})` });
  });
  if (right >= q.right) {
    chairOf(b).give.push({ k: 'item', id: q.prize, n: 1, held: false });
    said.push(fill(Ln('quizWon'), { prize: q.prizeName }));
  } else said.push(Ln('quizLost'));
  return said.join(' ');
});

// ---------- what the answers change ----------

// The cab driver (while his weekly deal stands) and Koga's training show on the Card as odds.
addOddsPartHook((b, actionId) => {
  const parts: [string, number][] = [];
  if (b.chair?.deals.some((d) => d.card === 29)) parts.push([Ln('cab'), C().cab]);
  const c = peek(b);
  if (c && c.koga >= b.day && (actionId === 'steal' || actionId === 'thieve')) parts.push([Ln('kogaOdds'), C().koga]);
  return parts;
});

// A dock strike stops Smuggle; paid off, the docks halve its Heat.
addActionGate((b, def) => {
  const c = peek(b);
  return def.id === 'smuggle' && c && c.strike >= b.day ? fill(Ln('struck'), { day: c.strike }) : null;
});
addActAfter((b, x, play) => {
  if (x.action !== 'smuggle' || !peek(b)?.union) return [];
  const off = Math.floor(((play.heat ?? 0) * C().unionHeat) / 100);
  if (off > 0) addHeat(b, x.district, -off);
  return [];
});

// The judge's weeks, the informant's tip and the council seat: the police pick-up is less likely, or off.
addPickupShare((b) => {
  const c = peek(b);
  if (!c) return 100;
  if (c.tip >= b.day) return 0;
  let n = 100;
  if (c.judge >= b.day) n = (n * (100 - C().judge)) / 100;
  if (c.council) n = (n * (100 - C().council)) / 100;
  return n;
});

// Every week: the Fence's regular deal takes the hot goods; the accountant may talk.
addWorldStep('world', (b, seed) => {
  const c = peek(b);
  if (!c || b.day % DOMINION_DATA.start.clock.weekLength !== 0) return [];
  const lines: string[] = [];
  if (c.fence && Object.keys(b.growth!.hot).length) c.sell.push(C().fenceWeek);
  if (c.accountant && rng(seed, 'dominion-court-week', b.day).int(1, 100) <= C().accountantTalk) {
    addHeat(b, DOMINION_DATA.field.hq, C().accountantHeat);
    lines.push(fill(Ln('accountantTalk'), { n: C().accountantHeat }));
  }
  return lines;
});

/** Settles what the Chair's answers left for the run: hot goods sold, a joint heist's crate. Called by session.ts after each step. */
export function settleCourt(content: Content, run: RunState): RunState {
  const c = run.expansion?.dominion?.growth?.court;
  if (!c || (!c.sell.length && !c.heist)) return run;
  const out = structuredClone(run);
  const b = out.expansion!.dominion!;
  const ct = b.growth!.court!;
  const lines: string[] = [];
  for (const rate of ct.sell) {
    const { total, count } = sellHot(b, out, content, rate);
    if (count) lines.push(fill(Ln('fenced'), { n: money(total), items: `${count} item${count === 1 ? '' : 's'}`, pct: rate }));
  }
  ct.sell = [];
  for (let i = 0; i < ct.heist; i++) {
    const got = openLoot(content, b, out, C().heistCrate, `court-heist-${b.day}-${i}`);
    b.funds += C().heistCash;
    b.earned += C().heistCash;
    lines.push(fill(Ln('heistDone'), { got: `${got}, and ₽${money(C().heistCash)} more for your share` }));
  }
  ct.heist = 0;
  if (lines.length) b.report = [...b.report, ...lines];
  return out;
}

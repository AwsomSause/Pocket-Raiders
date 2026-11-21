// DOMINION slice D6b: what D5, D9 and D4 handed to D6 (the town's side of districts and Notoriety).
// - Hold a Rally (Radio Room) and Chant Night (after a rally): Boss actions with their own effects.
// - Pay the Wages (crew task 23): the member who runs payday (worldTurn's bill step asks `setPayroll`).
// - Street meetings: outside-interactions.md sections A (Street and Townsfolk) and J (Media, Politics and Public
//   Opinion), met on a Boss action in a district and answered on the Region Map. Text in outside.json, effects in town.json.
// Randomness: the new stream 'dominion-town' for meetings, fights and checks; new leads use the recruit rules on
// their own new seed keys, so no existing roll moves.

import { addActEffect, addActionGate, addFightSettler, addHeat, districtDef, masteryLevel, syncHeat } from './field';
import { addLoyalty, addMorale, addTaskKind, crewOf, rng, taskLevel } from './crew';
import { makeLead } from './recruit';
import { DOMINION_DATA } from './data';
import { empireOf } from './book';
import { peakOf } from './empire';
import { hasRoom, spend, withHq } from './hqFx';
import { addTension, learnPlan, priorityName, teamsHere, withRivals } from './rivals';
import { addWorldStep, setPayroll } from './worldTurn';
import type { DominionBlock, FieldFight, Member, OutsideRow, StatId, TownChoice, TownFx } from './schema';

const T = () => DOMINION_DATA.town;
const L = () => DOMINION_DATA.town.lines;
const fill = (t: string, v: Record<string, string | number>): string => t.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ''));
const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, Math.round(n)));
const sign = (n: number): string => (n > 0 ? `+${n}` : `−${Math.abs(n)}`);
const RALLY_FLAG = 'rallied';

// ---------- Hold a Rally and Chant Night ----------

/** New leads from a crowd (makeLead keeps the cap of open leads). Returns how many came. */
function crowdLeads(b: DominionBlock, n: number, seed: string): number {
  const finder = b.members.find((m) => !crewOf(m).out) ?? b.members[0];
  if (!finder) return 0;
  let got = 0;
  for (let i = 0; i < n; i++) {
    const lead = makeLead(b, finder, `${seed}::town::${i}`);
    if (!lead) break;
    lead.id = `${lead.id}-t${b.day}-${i}`;
    lead.name = lead.name || 'Someone';
    got += 1;
  }
  return got;
}

/** Hold a Rally (action 44): +3 leads (+5 from Lv 3), donations from Lv 2 (clean), no police from Lv 4, flyers everywhere at Lv 5. */
addActEffect('rally', (b, x) => {
  const lv = masteryLevel(b.field.mastery['hold-a-rally'] ?? 0);
  const out: string[] = [];
  const n = crowdLeads(b, lv >= 3 ? 5 : 3, `${b.day}::${x.district}::rally`);
  out.push(n ? `${n} of them want in: new leads (Crew File).` : 'Your Leads list is full.');
  if (lv >= 2) {
    const gift = 50 * lv;
    b.funds += gift;
    b.earned += gift;
    withHq(b).hq!.clean += gift;
    out.push(`The crowd passes a hat: ₽${gift}, clean.`);
  }
  if (lv >= 4) {
    const heat = DOMINION_DATA.field.play['hold-a-rally']?.heat ?? 0;
    if (heat) addHeat(b, x.district, -heat);
    out.push('The local police leave the rally alone.');
  }
  if (lv >= 5) {
    for (const d of Object.values(b.field.districts)) d.regard += 1;
    out.push('Every district gets a rally flyer: Regard +1 everywhere.');
  }
  if (!b.flags.includes(RALLY_FLAG)) {
    b.flags.push(RALLY_FLAG);
    out.push('Chant Night is open now.');
  }
  return out;
});

/** Chant Night (action 95): more Regard from Lv 2, a lead from Lv 3, bonus Regard at Lv 4, a regional following at Lv 5. */
addActEffect('chant', (b, x) => {
  const lv = masteryLevel(b.field.mastery['chant-night'] ?? 0);
  const ds = b.field.districts[x.district];
  const out: string[] = [];
  const extra = (lv >= 2 ? 1 : 0) + (lv >= 4 ? 2 : 0);
  if (ds && extra) {
    ds.regard += extra;
    out.push(`The torches draw more of them: Regard +${extra} more.`);
  }
  if (lv >= 3) out.push(crowdLeads(b, 1, `${b.day}::${x.district}::chant`) ? 'Someone from the crowd asks to join: a new lead.' : 'Your Leads list is full.');
  if (lv >= 5) {
    for (const d of Object.values(b.field.districts)) d.regard += 1;
    out.push('A regional following: Regard +1 everywhere.');
  }
  return out;
});

// "Rally event" (Chant Night): opens after your first rally.
addActionGate((b, def) => (def.unlock.includes('Rally') && !b.flags.includes(RALLY_FLAG) ? L().needRally! : null));

// ---------- Pay the Wages (crew task 23) ----------

const WAGES = 'pay-the-wages';

/** The paymaster: the best-levelled member on Pay the Wages who is in today. */
function paymaster(b: DominionBlock): { m: Member; lv: number } | null {
  let best: { m: Member; lv: number } | null = null;
  for (const m of b.members) {
    const c = crewOf(m);
    if (c.task !== WAGES || c.out) continue;
    const lv = taskLevel(m, WAGES);
    if (!best || lv > best.lv) best = { m, lv };
  }
  return best;
}

// Lv 1 no missed pay (cheapest first, so the most get paid), Lv 2 Loyalty +1 on payday, Lv 3 wages −5%,
// Lv 4 a bonus for the loyal (Loyalty 70+: ₽ a tenth of their wage, Loyalty +3), Lv 5 no late-pay penalty.
setPayroll((b) => {
  const p = paymaster(b);
  if (!p) return null;
  const { m: who, lv } = p;
  return {
    lowFirst: true,
    cut: lv >= 3 ? 5 : 0,
    loyalty: lv >= 2 ? 1 : 0,
    noPenalty: lv >= 5,
    after: (blk) => {
      const out = [`${who.name} ran payday${lv >= 3 ? ' (wages −5%)' : ''}.`];
      if (lv >= 4) {
        const loyal = blk.members.filter((m) => m.loyalty >= 70 && m.unpaid === 0);
        let paid = 0;
        for (const m of loyal) {
          const bonus = Math.max(10, Math.round(m.wage / 10));
          if (blk.funds < bonus) break;
          spend(blk, bonus);
          m.loyalty = Math.min(100, m.loyalty + 3);
          paid += 1;
        }
        if (paid) out.push(`${paid} loyal member${paid > 1 ? 's' : ''} got a bonus: Loyalty +3.`);
      }
      return out;
    },
  };
});

// The task itself each day: keeping the pay book. A slip ("Mistakes anger crew") costs someone Loyalty.
addTaskKind('wages', (b, m, ok, ctx) => {
  if (ok) return ctx.say('money', `${m.name} keeps the pay book straight.`);
  const others = b.members.filter((x) => x.id !== m.id);
  const hurt = others.length ? others[ctx.r.int(0, others.length - 1)]! : null;
  if (hurt) addLoyalty(b, hurt, -3);
  ctx.say('crew', hurt ? `${m.name} got ${hurt.name}'s pay wrong. ${hurt.name}: Loyalty −3.` : `${m.name} lost a page of the pay book.`);
});

// ---------- the Recruitment Center's weekly walk-in ----------

// Every 7th morning a working Recruitment Center brings one walk-in recruit candidate (a lead).
addWorldStep('world', (b, seed) => {
  if (b.day % DOMINION_DATA.start.clock.weekLength !== 0 || !hasRoom(b, 'recruitment-center')) return [];
  return [crowdLeads(b, 1, `${seed}::${b.day}::walkin`) ? 'Someone walked into the Recruitment Center asking for work: a new lead.' : 'A walk-in at the Recruitment Center, but your Leads list is full.'];
});

// ---------- street meetings (sections A and J; B-E, H, I and K since the D10 follow-up, growthOutside.ts) ----------

/** What the growth keys of a choice do (growthOutside.ts registers it, so this file doesn't import growth). */
type ExtraFx = (b: DominionBlock, fx: TownFx, district: string, seed: string) => string[];
let EXTRA_FX: ExtraFx | null = null;
export function setTownFx(fn: ExtraFx): void {
  EXTRA_FX = fn;
}
const gymHere = (district: string) => DOMINION_DATA.growth.gyms.find((g) => g.district === district);

export const townRow = (id: string): OutsideRow | undefined => DOMINION_DATA.outside.find((r) => r.id === id);
const choicesOf = (id: string): TownChoice[] => T().rows[id] ?? [];

/** Rows that can come up here now: live, not met this run, the right time of day, and their needs met. */
function eligible(b: DominionBlock, district: string, night: boolean): OutsideRow[] {
  const met = new Set(empireOf(b).met ?? []);
  const ds = b.field.districts[district];
  return DOMINION_DATA.outside.filter((r) => {
    if (r.status === 'disabled' || met.has(r.id) || !T().rows[r.id]) return false;
    if (r.marks.includes('night') && !night) return false;
    if (r.marks.includes('day') && night) return false;
    const need = T().needs[r.id];
    if (need?.wanted !== undefined && b.heat < need.wanted) return false;
    if (need?.rival && (!teamsHere().length || !ds || ds.rival <= 0)) return false;
    if (need?.gym && !gymHere(district)) return false;
    if (need?.jailed && !b.members.some((m) => crewOf(m).out?.why === 'jail')) return false;
    return true;
  });
}

/** After a Boss action (no fight waiting): maybe a meeting on the street. Once a day at most. */
export function maybeMeet(block: DominionBlock, district: string, seed: string, night: boolean): { block: DominionBlock; line: string | null } {
  const e0 = block.empire;
  if (peakOf(block) < T().meet.minStep || e0?.meet || block.field.fight || e0?.metDay === block.day) return { block, line: null };
  const b = structuredClone(block);
  const e = empireOf(b);
  const r = rng(seed, 'dominion-town', b.day, district, b.actions, b.phase);
  if (r.int(1, 100) > (night ? T().meet.night : T().meet.chance)) return { block, line: null };
  const rows = eligible(b, district, night);
  if (!rows.length) return { block, line: null };
  const row = rows[r.int(0, rows.length - 1)]!;
  e.meet = { row: row.id, district, day: b.day };
  e.metDay = b.day;
  (e.met ??= []).push(row.id);
  return { block: b, line: fill(L().meet!, { district: districtDef(district)?.name ?? district, what: row.what.replace(/\*\*/g, ''), who: row.who }) };
}

/** R6: how one answer is decided, for the event's Choose page (display only: the same numbers answerMeet rolls against).
 *  `chance` is the check's (or the fight's) odds in %, null when nothing is rolled. */
export interface MeetOdds { chance: number | null; stat: StatId | null; best: number; fight: boolean; money: number }

/** What the map's street panel shows. */
export interface MeetModel { what: string; who: string; district: string; choices: string[]; odds: MeetOdds[]; row: string }
export function meetModel(b: DominionBlock): MeetModel | null {
  const m = b.empire?.meet;
  const row = m ? townRow(m.row) : undefined;
  if (!m || !row) return null;
  const odds = row.choices.map((_, i): MeetOdds => {
    const c = choicesOf(m.row)[i];
    if (!c) return { chance: null, stat: null, best: 0, fight: false, money: 0 };
    if (c.fight) return { chance: c.fightChance ?? 100, stat: null, best: 0, fight: true, money: c.money ?? 0 };
    if (c.check) return { chance: checkOdds(b, c.check), stat: c.check, best: bestStat(b, c.check), fight: false, money: c.money ?? 0 };
    return { chance: null, stat: null, best: 0, fight: false, money: c.money ?? 0 };
  });
  return { what: row.what.replace(/\*\*/g, ''), who: row.who, district: districtDef(m.district)?.name ?? m.district, choices: row.choices, odds, row: m.row };
}

/** The best member's stat (the Boss's crew does the talking). */
const bestStat = (b: DominionBlock, stat: StatId): number => Math.max(0, ...b.members.filter((m) => !crewOf(m).out).map((m) => m.stats[stat]));
/** A check's odds in % (5-95). */
const checkOdds = (b: DominionBlock, stat: StatId): number => clamp(T().meet.checkBase + bestStat(b, stat) * T().meet.checkPer, 5, 95);

/** Applies one set of effects in the district; returns the words for the line. */
function apply(b: DominionBlock, fx: TownFx, district: string, seed: string): string[] {
  const ds = b.field.districts[district];
  const bits: string[] = [];
  if (fx.money) {
    if (fx.money > 0) {
      b.funds += fx.money;
      b.earned += fx.money;
      bits.push(`+₽${fx.money}`);
    } else {
      spend(b, -fx.money);
      bits.push(`−₽${-fx.money}`);
    }
  }
  if (ds && fx.rg) (ds.regard += fx.rg, bits.push(`Regard ${sign(fx.rg)}`));
  if (ds && fx.dr) (ds.dread += fx.dr, bits.push(`Dread ${sign(fx.dr)}`));
  if (fx.h) (addHeat(b, district, fx.h), bits.push(`Heat ${sign(fx.h)}`));
  if (ds && fx.control) (ds.control = clamp(ds.control + fx.control), bits.push(`Control ${sign(fx.control)}`));
  if (fx.wanted) (b.field.wanted = clamp(b.field.wanted + fx.wanted), bits.push(`Wanted ${sign(fx.wanted)}`));
  if (fx.hero) (b.field.hero = Math.max(0, b.field.hero + fx.hero), bits.push(`the Hero's attention ${sign(fx.hero)}`));
  if (fx.mor) {
    for (const m of b.members) addMorale(m, fx.mor);
    bits.push(`crew Morale ${sign(fx.mor)}`);
  }
  const team = teamsHere()[0];
  if (fx.ten && team) bits.push(`${team.name} Tension ${sign(addTension(b, team.id, fx.ten) || fx.ten)}`);
  if (fx.intel || fx.foil) {
    if (!team) bits.push(L().noRival!);
    else {
      const t = withRivals(b).rivals.teams[team.id]!;
      if (fx.intel) {
        t.intel = clamp(t.intel - 5);
        learnPlan(b, team.id);
        bits.push(fill(L().plan!, { team: team.name, plan: t.plan.map(priorityName).join(' · ') || 'not set yet' }));
      }
      if (fx.foil) {
        t.intel = clamp(t.intel - 5);
        bits.push(L().spyGone!);
      }
    }
  }
  if (fx.scout) {
    const def = districtDef(district);
    for (const tg of def?.targets ?? []) b.field.scouted[tg.id] = b.day + DOMINION_DATA.field.odds.scoutDays;
    bits.push(L().scouted!);
  }
  if (fx.lead) bits.push(crowdLeads(b, 1, `${seed}::meet`) ? L().newLead! : L().leadsFull!);
  if (EXTRA_FX) bits.push(...EXTRA_FX(b, fx, district, seed));
  return bits;
}

const effectsOf = (c: TownChoice): TownFx => {
  const { fight: _f, fightChance: _c, lose: _l, check: _k, fail: _x, ...fx } = c;
  return fx;
};

/** R6: `roll` is the check's roll (for the Result page), `bits` what the answer changed (the Reward page). */
export interface MeetOut { ok: boolean; block: DominionBlock; notice: string | null; fight?: boolean; roll?: { r: number; chance: number; rolled: boolean } | null; bits?: string[] }

/** Answers the waiting street meeting with `choice`. A fight leaves `field.fight` (why 'town') for the session to start. */
export function answerMeet(block: DominionBlock, choice: number, seed: string): MeetOut {
  const no = (notice: string | null = null): MeetOut => ({ ok: false, block, notice });
  const m = block.empire?.meet;
  const row = m ? townRow(m.row) : undefined;
  const c = m ? choicesOf(m.row)[choice] : undefined;
  if (!m || !row || !c) return no();
  if (c.money && c.money < 0 && block.funds < -c.money) return no(fill(L().noMoney!, { cost: -c.money }));
  if (block.field.fight) return no();
  const b = structuredClone(block);
  const e = empireOf(b);
  e.meet = null;
  const label = row.choices[choice]!.replace(/\s*\(.*$/, '').replace(/;.*$/, '').trim();
  const r = rng(seed, 'dominion-town', b.day, m.row, choice);
  if (c.fight && r.int(1, 100) <= (c.fightChance ?? 100)) {
    const district = districtDef(m.district);
    const target = c.fight === 'target' ? (district?.targets.find((t) => t.kind === 'street' || t.kind === 'crowd') ?? district?.targets[0]) : undefined;
    // A named foe (town.json foes) or the district's Gym Leader: foe 'town' (field.ts townFoe).
    const gym = c.fight === 'leader' ? gymHere(m.district) : undefined;
    const named = c.fight === 'leader' ? (gym ? `leader:${gym.id}` : null) : T().foes[c.fight] ? c.fight : null;
    const foe = c.fight === 'target' ? (target ? 'target' : 'wild') : c.fight === 'police' || c.fight === 'wild' ? c.fight : named ? 'town' : 'wild';
    b.field.fight = {
      why: 'town', foe, begun: false, action: m.row, target: foe === 'town' ? named : (target?.id ?? null),
      district: m.district, pass: false, big: false, wager: 0, racket: String(choice),
    };
    return { ok: true, block: b, notice: fill(L().fightNow!, { who: row.who }), fight: true };
  }
  let fx = effectsOf(c);
  let head = label;
  let roll: MeetOut['roll'] = null;
  if (c.check) {
    const chance = checkOdds(b, c.check);
    const n = r.int(1, 100);
    const pass = n <= chance;
    roll = { r: n, chance, rolled: true };
    head = `${label}: ${pass ? L().passed : L().missed}`;
    if (!pass) fx = c.fail ?? {};
  }
  const bits = apply(b, fx, m.district, `${seed}::${m.row}`);
  syncHeat(b);
  return { ok: true, block: b, notice: fill(L().done!, { choice: head, bits: bits.join(', ') || L().nothing! }), roll, bits };
}

// A street fight has ended (fightEnd -> field.settle -> here): a win applies the choice, a loss its `lose` (or the default).
addFightSettler('town', (_content, b, _run, fight: FieldFight, outcome) => {
  const c = fight.action ? choicesOf(fight.action)[Number(fight.racket ?? 0)] : undefined;
  if (!c) return [];
  const won = outcome === 'win';
  const fx = won ? effectsOf(c) : (c.lose ?? T().meet.fightLose);
  const bits = apply(b, fx, fight.district, `${fight.action}::fight`);
  return [`${won ? L().won : L().lost} ${bits.length ? `${bits.join(', ')}.` : ''}`.trim()];
});

/** For tests and the Ledger: whether the Boss has held a rally (Chant Night open). */
export const hasRallied = (b: DominionBlock): boolean => b.flags.includes(RALLY_FLAG);

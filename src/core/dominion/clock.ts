// The clock (Part 1 §2): Morning (read the Night Report), Day (the Boss's actions), Evening (plan, menus), Night (one
// action or Rest), then the World Turn and the next Morning. A day only passes when the player chooses. Pure.

import { DOMINION_DATA } from './data';
import type { DominionAction, DominionBlock } from './schema';
import { addHeat, scoutHome, syncHeat } from './field';
import { fill, runWorldTurn } from './worldTurn';
import { addClean, hqFx } from './hqFx';
import { assign, bail } from './crew';
import { payPatron } from './recruit';
import { answer, eveningTalk } from './talk';

export interface StepOut {
  ok: boolean;
  block: DominionBlock;
  /** One line to show for what just happened (an order's result, odd jobs, a First Step). */
  notice: string | null;
  /** The Boss rested: the session heals the Boss's team. */
  heal: boolean;
}

const C = () => DOMINION_DATA.start.clock;
const no = (block: DominionBlock): StepOut => ({ ok: false, block, notice: null, heal: false });

/** Orders still open (the starting three are one-time; D2 adds the Boss's real actions). */
export const openOrders = (b: DominionBlock): string[] => DOMINION_DATA.start.orders.map((o) => o.id).filter((id) => !b.ordersDone.includes(id));

/** Day actions the Boss gets when the Day starts. */
export function dayActions(b: DominionBlock): number {
  const c = C();
  // D3: a scout's success saves the Boss an action; a promised favour spends one. D5: rooms add actions (Operations
  // Room, Executive Office) and the Luxury Suite makes a rest worth one more.
  const fx = hqFx(b);
  return Math.max(1, c.dayActions + fx.dayActions + (b.rested ? c.restBonus + fx.restBonus : 0) - (b.noRest >= c.exhaustedAfter ? 1 : 0) + (b.crew?.saved ?? 0));
}

/** Marks First Steps whose goal is met and pays their reward. Returns the lines for the ones just done. */
export function checkSteps(b: DominionBlock): string[] {
  const out: string[] = [];
  for (const s of DOMINION_DATA.start.firstSteps) {
    if (b.stepsDone.includes(s.id)) continue;
    const met = (s.earned !== undefined && b.earned >= s.earned) || (s.flag !== undefined && b.flags.includes(s.flag));
    if (!met) continue;
    b.stepsDone.push(s.id);
    b.funds += s.reward;
    out.push(fill(DOMINION_DATA.start.report.step, { label: s.label, reward: s.reward }));
  }
  return out;
}

/** The First Steps panel shows for the first week only (Part 1 §1.3). */
export const stepsShown = (b: DominionBlock): boolean => b.day <= DOMINION_DATA.start.firstStepsDays;

/** The night is over: rested or not, the day turns, the world moves, and it's Morning. */
export function endNight(block: DominionBlock, seed: string, rested: boolean): DominionBlock {
  const b = structuredClone(block);
  const r = DOMINION_DATA.start.report;
  b.rested = rested;
  b.noRest = rested ? 0 : b.noRest + 1;
  b.day += 1;
  b.phase = 'morning';
  const lines = runWorldTurn(b, seed);
  // D5: the Night Shift adds a Night action (counted after the World Turn, which finishes the night's works).
  b.nightActions = C().nightActions + hqFx(b).nightActions;
  if (rested) {
    for (const m of b.members) m.morale = Math.min(100, m.morale + 5);
    lines.unshift(r.rest);
  } else {
    lines.unshift(fill(r.tired, { n: b.noRest }));
    if (b.noRest >= C().exhaustedAfter) lines.push(r.exhausted);
  }
  b.report = lines;
  return b;
}

export function step(block: DominionBlock, action: DominionAction, seed: string): StepOut {
  const ok = (b: DominionBlock, notice: string | null = null, heal = false): StepOut => ({ ok: true, block: b, notice, heal });
  switch (action.t) {
    case 'open': {
      if (block.opened) return no(block);
      return ok({ ...block, opened: true });
    }
    case 'plan': {
      // Evening: put an open order on tomorrow's list, or take it off. No more than tomorrow's actions.
      if (block.phase !== 'evening' || !openOrders(block).includes(action.order)) return no(block);
      if (block.orders.includes(action.order)) return ok({ ...block, orders: block.orders.filter((o) => o !== action.order) });
      if (block.orders.length >= C().dayActions + C().restBonus) return no(block);
      return ok({ ...block, orders: [...block.orders, action.order] });
    }
    case 'do': {
      const o = DOMINION_DATA.start.orders.find((x) => x.id === action.order);
      if (block.phase !== 'day' || block.actions < 1 || !o || block.ordersDone.includes(o.id)) return no(block);
      if (o.funds < 0 && block.funds + o.funds < 0) return { ...no(block), notice: `Not enough money: it costs ₽${-o.funds}.` };
      const b = structuredClone(block);
      b.actions -= 1;
      b.funds += o.funds;
      if (o.funds > 0) b.earned += o.funds;
      addHeat(b, DOMINION_DATA.field.hq, o.heat);
      syncHeat(b);
      if (o.flag === 'scouted-home') scoutHome(b);
      b.ordersDone.push(o.id);
      b.orders = b.orders.filter((x) => x !== o.id);
      if (!b.flags.includes(o.flag)) b.flags.push(o.flag);
      return ok(b, [o.report, ...checkSteps(b)].join(' '));
    }
    case 'toNight': {
      if (block.phase !== 'evening') return no(block);
      return ok({ ...block, phase: 'night' });
    }
    case 'rest': {
      if (block.phase !== 'night') return no(block);
      return ok(endNight(block, seed, true), null, true);
    }
    case 'skipNight': {
      // A Night action was spent (D2 builds them): the night ends without Rest.
      if (block.phase !== 'night' || block.nightActions > 0) return no(block);
      return ok(endNight(block, seed, false));
    }
    case 'act':
    case 'buy':
    // D5: the HQ menu (hq.ts), sent there by session.ts.
    case 'upgrade':
    case 'build':
    case 'tierUp':
    case 'sell':
    case 'rebuild':
    case 'launder':
    case 'loan':
    case 'repay':
    case 'letGo':
    case 'truce':
    case 'breakTruce':
    case 'card':
    case 'ransom':
    case 'spyStart':
    case 'spyAsk':
    case 'spyAccuse':
    case 'spyDrop':
      // The Boss's hands need the run (party, bag): session.ts sends them to field.ts.
      return no(block);
    case 'toDay': {
      // D2: a fight at the door (Looker, a raid) comes first.
      if (block.phase !== 'morning' || block.field.fight) return no(block);
      const n = dayActions(block);
      return ok({ ...block, phase: 'day', actions: n, rested: false, field: { ...block.field, today: n } });
    }
    case 'endDay': {
      // Unused actions become odd jobs (Part 1 §2.3).
      if (block.phase !== 'day') return no(block);
      const b = structuredClone(block);
      const pay = b.actions * C().oddJobPay;
      // D5: odd jobs are honest work, so the money is clean (A21).
      addClean(b, pay);
      b.earned += pay;
      b.actions = 0;
      b.phase = 'evening';
      const lines = [pay ? `Odd jobs: +₽${pay}.` : 'The day is done.', ...checkSteps(b)];
      return ok(b, lines.join(' '));
    }
    // D3, the crew (crew.ts, talk.ts, recruit.ts). Hiring, recruiting and gifts need the run: session.ts runs them.
    case 'assign': {
      const out = assign(block, action.member, action.task);
      return out.ok ? ok(out.block) : { ...no(block), notice: out.notice };
    }
    case 'talk': {
      const out = answer(block, action.choice, seed);
      return out.ok ? ok(out.block, out.notice) : no(block);
    }
    case 'evTalk': {
      const out = eveningTalk(block, action.member, seed);
      return out.ok ? ok(out.block) : { ...no(block), notice: out.notice };
    }
    case 'bail': {
      const out = bail(block, action.member);
      return out.ok ? ok(out.block, out.notice) : { ...no(block), notice: out.notice };
    }
    case 'patron': {
      const out = payPatron(block, action.patron);
      return out.ok ? ok(out.block, out.notice) : { ...no(block), notice: out.notice };
    }
    case 'hire':
    case 'approach':
    case 'admit':
    case 'gift':
      return no(block);
  }
}

// DOMINION slice D16 view model: the Partnership page (key J). One page for both partners (Part 9 A23): each partner's
// terms (what they give, take and raise), this week's cut in ₽ and Pokémon, the next renegotiation, and the three ways
// out (cancel, buy out, purge); the Shadow Machine's picker when Cipher's machine is in. Plain data for
// ui/redux/screens/dominion/partners.ts. Pure: no Phaser, no RNG.

import type { RunState } from '../state';
import { monName } from './crew';
import { DOMINION_DATA } from './data';
import { peakOf, stepById } from './empire';
import { buyoutPrice, machineMons, machineOn, machineProblem, purgeNext, signProblem } from './partners';
import { PARTNER_IDS, type DominionAction, type DominionBlock, type PartnerId } from './schema';
import { topModel, type TopModel } from './screens';
import { fill } from './worldTurn';

const D = () => DOMINION_DATA.partners;
const S = (k: string, v: Record<string, string | number> = {}): string => fill(D().screen[k] ?? k, v);
const money = (n: number): string => `₽${n.toLocaleString('en-US')}`;

export type PartnerState = 'locked' | 'offered' | 'active' | 'gone' | 'closed';
export interface PartnerCard {
  id: PartnerId; name: string; crest: string; colour: string; glow: string; glowSoft: string; shade: string;
  leader: string; look: string; leaderLook: string;
  state: PartnerState; tag: string;
  gives: string; takes: string; raises: string;
  /** The cut now (%), the line under it, this week's take, the next renegotiation. Null without a deal. */
  cut: number | null; since: string | null; week: string | null; mons: string | null; next: string | null;
  /** The purge under way: who waits next. */
  purge: string | null;
}
export interface PartnerRow { id: string; label: string; sub: string; act: DominionAction | null; on: boolean; team: PartnerId | null; off: boolean }
export interface PartnersModel {
  top: TopModel;
  cards: PartnerCard[];
  /** Both deals at once: the warning line (A23). */
  both: string | null;
  feud: string | null;
  rows: PartnerRow[];
  /** The Shadow Machine's picker is open: its title. */
  picking: boolean;
  balls: number;
  notice: string | null;
}

const stateOf = (b: DominionBlock, id: PartnerId): PartnerState => {
  const p = b.partners;
  if (p?.deals[id]) return 'active';
  if (p?.closed) return 'closed';
  if (p?.ended.includes(id)) return 'gone';
  return peakOf(b) >= stepById(D().opensAt) ? 'offered' : 'locked';
};
const TAG: Record<PartnerState, string> = { locked: 'none', offered: 'offered', active: 'active', gone: 'gone', closed: 'closedTag' };

/** The Partnership page's open/closed test: the page exists once a partner has been offered (or a deal is kept). */
export const partnersOpen = (b: DominionBlock): boolean => !!b.partners || peakOf(b) >= stepById(D().opensAt);

function cardOf(b: DominionBlock, id: PartnerId): PartnerCard {
  const t = D().teams[id], p = b.partners, d = p?.deals[id], state = stateOf(b, id);
  const last = p?.last;
  const took = d && last && last.day > 0 ? last.money[id] : undefined;
  const mons = d && last ? last.mons[id] : undefined;
  const pg = purgeNext(b);
  return {
    id, name: t.name, crest: t.crest, colour: t.colour, glow: `rgb(${t.glow})`, glowSoft: `rgba(${t.glow},.55)`, shade: t.shade, leader: t.leader, look: t.look, leaderLook: t.leaderLook,
    state, tag: S(TAG[state]),
    gives: t.gives, takes: t.takes, raises: t.raises,
    cut: d ? d.cut : null,
    since: d ? S('since', { day: d.since }) : null,
    week: d ? (took === undefined ? 'Nothing yet.' : money(took)) : null,
    mons: d ? (mons?.length ? mons.join(', ') : 'None yet.') : null,
    next: d ? `Day ${d.next}` : null,
    purge: pg && pg.id === id ? pg.name : null,
  };
}

/** The choice rows: sign (offered), the three ways out (active), the purge's next fight, the Shadow Machine. */
function rowsOf(b: DominionBlock, run: Pick<RunState, 'party'>, picking: boolean): Omit<PartnerRow, 'on'>[] {
  if (picking) {
    return machineMons(b, run).map(({ mon, where }) => ({
      id: `mon-${mon.uid}`, label: `${monName(mon.speciesId)} · Lv ${mon.level}`, sub: where === 'party' ? 'Your team' : 'The Reserve',
      act: { t: 'partner', op: 'shadow', id: 'cipher', uid: mon.uid }, team: 'cipher', off: false,
    }));
  }
  const out: Omit<PartnerRow, 'on'>[] = [];
  const W = D().ways;
  for (const id of D().order) {
    const t = D().teams[id], d = b.partners?.deals[id];
    if (!d) {
      const why = signProblem(b, id);
      if (stateOf(b, id) === 'offered') out.push({ id: `sign-${id}`, label: `${S('sign')}: ${t.name}`, sub: why ?? `${t.cut}% of income. ${t.gives}`, act: { t: 'partner', op: 'sign', id }, team: id, off: !!why });
      continue;
    }
    const pg = purgeNext(b);
    out.push({ id: `buyout-${id}`, label: `${W.buyout.name}: ${t.name} (${money(buyoutPrice(b, id))})`, sub: W.buyout.text, act: { t: 'partner', op: 'buyout', id }, team: id, off: b.funds < buyoutPrice(b, id) });
    out.push({ id: `cancel-${id}`, label: `${W.cancel.name}: ${t.name}`, sub: W.cancel.text, act: { t: 'partner', op: 'cancel', id }, team: id, off: false });
    out.push({
      id: `purge-${id}`, label: pg?.id === id ? `${W.purge.name}: fight ${pg.name} next` : `${W.purge.name}: ${t.name}`, sub: W.purge.text,
      act: { t: 'partner', op: 'purge', id }, team: id, off: !!b.field.fight,
    });
  }
  if (machineOn(b)) out.push({ id: 'machine', label: `${S('machine')}: ${S('machinePick')}`, sub: machineProblem(b) ?? 'Once a week. Trust 0 until it is purified.', act: null, team: 'cipher', off: !!machineProblem(b) });
  return out;
}

export function partnerRows(b: DominionBlock, run: Pick<RunState, 'party'>, picking: boolean): Omit<PartnerRow, 'on'>[] {
  return rowsOf(b, run, picking);
}

export function partnersModel(b: DominionBlock, run: Pick<RunState, 'party' | 'inventory'>, at: number, picking: boolean, notice: string | null = null): PartnersModel {
  const rows = rowsOf(b, run, picking).map((r, i) => ({ ...r, on: i === at }));
  const deals = PARTNER_IDS.filter((id) => !!b.partners?.deals[id]);
  const pct = deals.reduce((a, id) => a + (b.partners!.deals[id]!.cut), 0);
  return {
    top: topModel(b, S('title')),
    cards: D().order.map((id) => cardOf(b, id)),
    both: deals.length === 2 ? S('both', { pct }) : null,
    feud: deals.length === 2 ? b.partners?.last.feud ?? null : null,
    rows,
    picking,
    balls: run.inventory['snag-ball'] ?? 0,
    notice,
  };
}

// DOMINION D15 screen models: s10 "The Empire across regions" (one card per region of the run: the held ones with
// their Holder, Stability, betrayal chance and Boon; the one played now; the ones still ahead) and the Leaving pages
// (who holds the region, standing orders, who comes along). Pure: reads the block, never rolls.

import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { DOMINION_DATA } from './data';
import { crewOf } from './crew';
import { heroDefOf, heroOf } from './hero';
import {
  aceOf, bandOf, betrayalChance, defaultOrders, holderPicks, leaveProblem, nextRegion, policyOf, regionName, regionsInRun, riskBand, riskOf,
  runDay, type HolderPick, type Orders,
} from './regions';
import { teamsHere } from './rivals';
import { POLICY_KEYS, type DominionBlock, type HeldRegion } from './schema';
import { topModel, type TopModel } from './screens';
import { fill } from './worldTurn';

const RG = () => DOMINION_DATA.regions;
const money = (n: number): string => `₽${n.toLocaleString('en-US')}`;
const rankName = (id: string): string => DOMINION_DATA.crew.ranks.find((r) => r.id === id)?.word ?? id;

export interface RealmButton { op: 'visit' | 'pay' | 'replace' | 'spy' | 'talk' | 'orders' | 'tribute' | 'trip' | 'letGo'; label: string; tone: '' | 'y' | 'r' }
export interface RealmCard {
  id: string; name: string; crest: string; colour: string; glow: string; shade: string;
  state: 'held' | 'seceded' | 'sellout' | 'lost' | 'here' | 'next' | 'later';
  pill: string; pillTone: 'g' | 'y' | 'r' | 'b' | 'k' | 'v';
  /** HOLDER (a held region) or BROUGHT (the region played now). */
  who: { label: string; name: string; look: string | null; rank: string | null; line: string; lineTone: '' | 'rd' } | null;
  rows: { label: string; value: string; tone: '' | 'gn' | 'rd' | 'y'; blink?: boolean; meter?: number; icons?: string[] }[];
  boon: { name: string; icon: string; weak: boolean } | null;
  buttons: RealmButton[];
  rib: string | null;
}
export interface EmpireModel {
  top: TopModel; title: string; sub: string; tribute: string; hereName: string; hereDay: string;
  cards: RealmCard[]; at: number; buttonAt: number;
  tbox: { who: string; text: string };
  leave: { ok: boolean; label: string; why: string | null };
  orders: { region: string; rows: { key: string; name: string; options: { id: string; name: string }[]; at: number; on: boolean }[] } | null;
}

const PILL: Record<string, RealmCard['pillTone']> = { wipe: 'r', shadow: 'g', monarch: 'y', goal: 'v' };

function heldCard(b: DominionBlock, h: HeldRegion): RealmCard {
  const def = RG().regions[h.id]!, S = RG().screen;
  const pathName = DOMINION_DATA.takeover.paths.find((p) => p.id === h.path)?.name.toUpperCase() ?? h.path.toUpperCase();
  const chance = betrayalChance(b, h);
  const m = h.holder.member;
  const boonDef = RG().boons.find((x) => x.region === h.id);
  const band = bandOf(h.stability);
  const lineFor = (): { line: string; tone: '' | 'rd' } => {
    if (h.status === 'seceded') return { line: `Turned: ${h.traitor ?? h.holder.name}`, tone: 'rd' };
    if (h.status === 'sellout') return { line: 'Sold you to the police', tone: 'rd' };
    if (h.status === 'lost') return { line: 'Gone', tone: 'rd' };
    if (h.holder.kind === 'self') return { line: `Visit every ${RG().holders.self.visitEvery} days`, tone: '' };
    if (chance >= 15 || h.tells > 0) return { line: RG().lines.reportsLate!, tone: 'rd' };
    return { line: m ? `Loyalty ${m.loyalty} · Ambition ${crewOf(m).ambition}` : 'The old Boss, on a leash', tone: '' };
  };
  const ln = lineFor();
  const buttons: RealmButton[] = [];
  const B = S.buttons;
  if (h.status === 'held') {
    buttons.push({ op: 'visit', label: B.visit!, tone: '' });
    if (h.holder.kind !== 'self') {
      buttons.push({ op: 'pay', label: B.pay!, tone: '' }, { op: 'replace', label: B.replace!, tone: '' }, { op: 'spy', label: B.spy!, tone: chance >= 15 ? 'y' : '' });
      if (riskOf(b, h) >= RG().betrayal.longTalkAt) buttons.push({ op: 'talk', label: B.talk!, tone: 'r' });
    }
    buttons.push({ op: 'orders', label: B.orders!, tone: '' }, { op: 'tribute', label: `${h.tribute}%`, tone: '' });
  } else if (h.status === 'sellout') {
    buttons.push({ op: 'visit', label: B.visit!, tone: '' }, { op: 'replace', label: B.replace!, tone: 'y' }, { op: 'letGo', label: B.letGo!, tone: '' });
  } else if (h.status === 'seceded') {
    buttons.push({ op: 'trip', label: B.trip!, tone: 'y' }, { op: 'letGo', label: B.letGo!, tone: '' });
  }
  const pill = h.status === 'held' ? fill(S.taken!, { path: pathName }) : h.status === 'lost' ? S.lostTag! : h.status === 'seceded' ? S.secededTag! : 'SOLD OUT';
  return {
    id: h.id, name: def.name.toUpperCase(), crest: def.crest, colour: def.colour, glow: def.glow, shade: def.shade,
    state: h.status, pill, pillTone: h.status === 'held' ? PILL[h.path] ?? 'g' : 'r',
    who: { label: S.holder!, name: h.holder.name, look: m?.look ?? (h.holder.kind === 'self' ? null : null), rank: m ? rankName(m.rank).toUpperCase() : h.holder.kind === 'usurped' ? 'USURPED' : h.holder.kind === 'self' ? 'THE BOSS' : null, line: ln.line, lineTone: ln.tone },
    rows: h.status === 'lost' ? [] : [
      { label: S.stability!, value: `${h.stability}`, tone: h.stability >= 60 ? 'gn' : h.stability >= 40 ? 'y' : 'rd', meter: h.stability },
      { label: S.betrayal!, value: `${chance}% / week`, tone: chance >= 15 ? 'rd' : '', blink: chance >= 15 },
      { label: 'Towns · tribute', value: `${h.towns} · ${money(h.last)} · ${band.word}`, tone: band.id === 'calm' || band.id === 'grumbling' ? '' : 'rd' },
    ],
    boon: boonDef ? { name: boonDef.name, icon: boonDef.icon, weak: band.boon < 100 } : null,
    buttons, rib: null,
  };
}

function hereCard(b: DominionBlock, run: Pick<RunState, 'party'> | null): RealmCard {
  const id = b.realm?.at ?? 'kanto', def = RG().regions[id]!, S = RG().screen;
  const R = b.realm;
  const brought = R?.brought ? b.members.find((m) => m.id === R.brought) : undefined;
  const rivals = teamsHere().map((t) => `${t.name.replace(/^Team /, '')} ${b.rivals?.teams[t.id]?.tension ?? 0}`).join(' · ') || 'None';
  const hero = b.hero ? heroDefOf(heroOf(b).id) : null;
  const ace = run ? aceOf(run) : undefined;
  return {
    id, name: def.name.toUpperCase(), crest: def.crest, colour: def.colour, glow: def.glow, shade: def.shade,
    state: 'here', pill: S.here!, pillTone: 'b',
    who: brought
      ? { label: S.brought!, name: brought.name, look: brought.look, rank: rankName(brought.rank).toUpperCase(), line: RG().lines.kept!, lineTone: '' }
      : { label: 'THE BOSS', name: b.teamName ?? 'Unnamed crew', look: null, rank: null, line: ace ? `Ace Lv ${ace.level}` : '', lineTone: '' },
    rows: [
      { label: R && R.held.length ? S.warehouse! : 'The Warehouse', value: money(b.funds), tone: 'y' },
      { label: S.crew!, value: `${b.members.length} / ${b.rosterCap}`, tone: '' },
      { label: S.rivals!, value: rivals, tone: '' },
      { label: S.hero!, value: hero ? `${hero.name} · Threat ${heroOf(b).threat}` : 'Not yet', tone: '' },
    ],
    boon: null, buttons: [], rib: R && R.held.length ? S.newStart! : null,
  };
}

function aheadCard(id: string, first: boolean): RealmCard {
  const def = RG().regions[id]!, S = RG().screen, boon = RG().boons.find((x) => x.region === id);
  return {
    id, name: def.name.toUpperCase(), crest: def.crest, colour: def.colour, glow: def.glow, shade: def.shade,
    state: first ? 'next' : 'later', pill: first ? S.next! : S.later!, pillTone: 'k', who: null,
    rows: [{ label: 'Rivals', value: DOMINION_DATA.rivals.teams.filter((t) => t.region === id).map((t) => t.name).join(' · ') || '?', tone: '' }],
    boon: boon ? { name: boon.name, icon: boon.icon, weak: true } : null, buttons: [], rib: null,
  };
}

export function empireModel(b: DominionBlock, run: Pick<RunState, 'party'> | null, at = -1, buttonAt = 0, ordersFor: string | null = null, orderAt = 0, draft: Orders | null = null): EmpireModel {
  const R = b.realm, S = RG().screen;
  const here = R?.at ?? 'kanto';
  const inRun = regionsInRun(b);
  const cards: RealmCard[] = [];
  for (const id of inRun) {
    const h = R?.held.find((x) => x.id === id);
    if (h) cards.push(heldCard(b, h));
    else if (id === here) cards.push(hereCard(b, run));
    else cards.push(aheadCard(id, id === nextRegion(b)));
  }
  const tribute = (R?.held ?? []).reduce((a, h) => a + (h.status === 'held' ? h.last : 0), 0);
  const hereIdx = cards.findIndex((c) => c.state === 'here');
  const sel = at >= 0 && at < cards.length ? at : Math.max(0, hereIdx);
  const why = leaveProblem(b);
  const next = nextRegion(b);
  const hq = DOMINION_DATA.field.districts.find((d) => d.id === DOMINION_DATA.field.hq)?.name ?? '';
  // The text box: the brought member's latest words, or the region's arrival, or how the empire stands.
  const said = R?.brought ? [...b.report].reverse().find((l) => l.startsWith(`${b.members.find((m) => m.id === R.brought)?.name ?? '§'}:`)) : undefined;
  const pack = DOMINION_DATA.packs[here];
  const text = said ?? (pack && b.day <= 7 ? pack.arrive[0]! : b.takeover?.taken && next ? fill(S.boxTaken!, { region: regionName(here), next: regionName(next) })
    : R?.held.length ? fill(S.boxHeld!, { n: R.held.filter((h) => h.status === 'held').length }) : fill(S.boxFirst!, { region: regionName(here) }));
  const ordersHeld = ordersFor ? R?.held.find((h) => h.id === ordersFor) : undefined;
  const cur = draft ?? (ordersHeld?.orders as Orders | undefined) ?? defaultOrders();
  return {
    top: topModel(b, 'EMPIRE'),
    title: S.title!, sub: fill(S.sub!, { day: runDay(b) }),
    tribute: tribute ? fill(S.tributeTop!, { n: tribute.toLocaleString('en-US') }) : S.noTribute!,
    hereName: regionName(here), hereDay: `Day ${b.day}`,
    cards, at: sel, buttonAt: Math.max(0, Math.min(buttonAt, (cards[sel]?.buttons.length ?? 1) - 1)),
    tbox: { who: hq.toUpperCase(), text },
    leave: { ok: !why, label: next ? fill(RG().screen.leave.cta!, { next: regionName(next) }) : RG().screen.leave.ctaLast!, why },
    orders: ordersHeld ? {
      region: regionName(ordersHeld.id),
      rows: POLICY_KEYS.map((k, i) => ({ key: k, name: RG().policies[k].name, options: RG().policies[k].options.map((o) => ({ id: o.id, name: o.name })), at: Math.max(0, RG().policies[k].options.findIndex((o) => o.id === cur[k])), on: i === orderAt })),
    } : null,
  };
}

// ---------- the Leaving pages ----------

export interface LeaveModel {
  top: TopModel; title: string; region: string; next: string;
  holders: (HolderPick & { look: string | null })[]; holderAt: number;
  orders: { key: string; name: string; pick: string; text: string }[]; orderAt: number;
  bring: { id: string; name: string; rank: string; look: string; note: string }[]; bringAt: number;
  col: 0 | 1 | 2; why: string | null; notes: string[]; go: string;
}

export function leaveModel(b: DominionBlock, run: Pick<RunState, 'party'>, content: Content, s: { holder: number; orders: Orders; orderAt: number; bring: number; col: 0 | 1 | 2 }): LeaveModel {
  const L = RG().screen.leave, here = regionName(b.realm?.at ?? 'kanto'), next = nextRegion(b);
  const holders = holderPicks(b).map((p) => ({ ...p, look: b.members.find((m) => m.id === p.id)?.look ?? null }));
  const holder = holders[Math.min(s.holder, holders.length - 1)];
  const bring = [{ id: '', name: 'Nobody', rank: '', look: '', note: RG().arrive.lines.nobody! },
    ...b.members.filter((m) => m.id !== holder?.id).map((m) => ({ id: m.id, name: m.name, rank: rankName(m.rank), look: m.look, note: `Lv ${m.level} · Loyalty ${m.loyalty}` }))];
  const ace = aceOf(run);
  const aceName = ace ? ace.care?.nickname || (content.species.get(ace.speciesId)?.name ?? ace.speciesId) : null;
  const pre = ace ? content.species.get(content.species.get(ace.speciesId)?.evolvesFrom ?? ace.speciesId)?.name ?? aceName : null;
  return {
    top: topModel(b, 'LEAVING'),
    title: fill(L.title!, { region: here }), region: here, next: next ? regionName(next) : '',
    holders, holderAt: Math.min(s.holder, holders.length - 1),
    orders: POLICY_KEYS.map((k) => {
      const o = policyOf(k, s.orders[k]) ?? RG().policies[k].options[0]!;
      return { key: k, name: RG().policies[k].name, pick: o.name, text: [o.tribute !== undefined ? `tribute ${o.tribute}%` : '', o.stab ? `Stability ${o.stab > 0 ? '+' : ''}${o.stab}` : '', o.risk ? `risk ${o.risk > 0 ? '+' : ''}${o.risk}` : ''].filter(Boolean).join(' · ') };
    }),
    orderAt: s.orderAt,
    bring, bringAt: Math.min(s.bring, bring.length - 1),
    col: s.col, why: leaveProblem(b),
    notes: [ace ? fill(pre && pre !== aceName && pre !== content.species.get(ace.speciesId)?.name ? L.aceNote! : L.aceNoteSame!, { ace: aceName!, pre: pre!, level: RG().arrive.aceLevel }) : RG().arrive.lines.noAce!, L.noMoney!, holder ? holder.note : ''],
    go: next ? fill(L.go!, { next: regionName(next) }) : RG().screen.leave.ctaLast!,
  };
}

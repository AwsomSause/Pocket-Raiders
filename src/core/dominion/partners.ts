// DOMINION slice D16: Team Snagem and Team Cipher (Part 4 §9, Part 9 A23, A14 "Syndicate: Snagem and Cipher deals").
// Two optional partners, offered once the team reaches Syndicate, agreed again in each region. Snagem gives the Snag
// Machine and Snag Balls (an adult trainer's Pokémon can be taken in battle) and takes 15% of the week's income and the
// Reserve's best Pokémon every week; Cipher builds a Shadow Lab with the Shadow Machine and takes 15% and a Shadow
// Pokémon every two weeks. Both raise Heat, Threat, Dread and the Legendaries as partners.json says. With both deals
// they sabotage each other every week (rolled on `evil-partners`). Three ways out: cancel, buy out, purge.
// Pure: no Phaser. The World Turn's `rivals` step runs the weekly business (before the bills, so the cut comes first).

import type { Content } from '../contentSchema';
import { teachEggMove } from '../mastery';
import { hashSeed, Rng } from '../rng';
import { makeShadow, soothe } from '../shadow';
import type { PokemonInstance, RunState } from '../state';
import { book, empireOf } from './book';
import { setChairHook } from './chair';
import { monName } from './crew';
import { DOMINION_DATA } from './data';
import { heldIds, peakOf, stepById } from './empire';
import { addActEffect, addActionGate, addCardGate, addFightSettler, addHeat, addPlayEffect, foeLevel, setPartnerFoe, syncHeat } from './field';
import { book as reserveBook, placeMon } from './reserve';
import { PARTNER_IDS, type PartnerDeal, type DominionBlock, type FieldFight, type PartnerDef, type PartnerId, type PartnersState } from './schema';
import { addWorldStep, fill } from './worldTurn';

const D = () => DOMINION_DATA.partners;
const L = (k: string, v: Record<string, string | number> = {}): string => fill(D().lines[k] ?? k, v);
const T = (id: PartnerId): PartnerDef => D().teams[id];
const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));
const weekLen = (): number => DOMINION_DATA.start.clock.weekLength;
const weekNo = (day: number): number => Math.floor((day - 1) / weekLen());
const rngOf = (seed: string, ...key: (string | number)[]): Rng => new Rng(hashSeed([seed, ...key].join('::')));
const teamLevel = (run: Pick<RunState, 'party'>): number => (run.party.length ? Math.round(run.party.reduce((a, m) => a + m.level, 0) / run.party.length) : 5);

// ---------- state ----------

export const freshPartners = (): PartnersState => ({
  deals: {}, offered: [], ended: [], kept: [], met: {}, inv: {}, used: 0, closed: false, purge: null, last: { day: 0, money: {}, mons: {}, feud: null }, due: [],
});
export const partnersOf = (b: DominionBlock): PartnersState => (b.partners ??= freshPartners());
export const dealOf = (b: DominionBlock, id: PartnerId): PartnerDeal | undefined => b.partners?.deals[id];
export const activeIds = (b: DominionBlock): PartnerId[] => PARTNER_IDS.filter((id) => !!b.partners?.deals[id]);
/** The Snag Machine works: a Snagem deal, or the machine kept after a buy-out or a won purge. */
export const snagOn = (b: DominionBlock): boolean => !!b.partners?.deals.snagem || !!b.partners?.kept.includes('snagem');
/** The Shadow Machine works: a Cipher deal, or the Shadow Lab won in the purge. */
export const machineOn = (b: DominionBlock): boolean => !!b.partners?.deals.cipher || !!b.partners?.kept.includes('cipher');

/** Why a partner can't be signed now (null when it can). */
export function signProblem(b: DominionBlock, id: PartnerId): string | null {
  const p = b.partners;
  const team = T(id).name;
  if (p?.closed) return L('closed');
  if (p?.deals[id]) return L('already', { team });
  if (p?.ended.includes(id)) return L('ended', { team });
  if (peakOf(b) < stepById(D().opensAt)) return L('notYet', { team });
  if (b.field.fight) return 'A fight is waiting.';
  return null;
}

/** The cut a deal starts or renegotiates at, after the meetings (Snagem Meet, Cipher Offer). */
const withMet = (b: DominionBlock, id: PartnerId, cut: number): number => {
  const p = partnersOf(b), n = p.met[id] ?? 0;
  delete p.met[id];
  return clamp(cut - n * D().renegotiate.met, D().renegotiate.min, D().renegotiate.max);
};

const roomOf = (b: DominionBlock, id: PartnerId) => b.hq?.rooms.find((r) => r.id === T(id).room);
function addRoom(b: DominionBlock, id: PartnerId): void {
  const hq = b.hq;
  if (!hq || roomOf(b, id)) return;
  hq.rooms.push({ uid: `r${hq.next++}`, id: T(id).room, tier: 1, cond: 100, spent: 0, building: false, up: false, ready: b.day, shut: false, ruined: false, at: null });
}
function dropRoom(b: DominionBlock, id: PartnerId): void {
  if (b.hq) b.hq.rooms = b.hq.rooms.filter((r) => r.id !== T(id).room);
}
const invAdd = (b: DominionBlock, item: string, n: number): void => {
  const p = partnersOf(b);
  p.inv[item] = (p.inv[item] ?? 0) + n;
};

/** Make the deal (the Partnership page's "Make the deal"). */
export function sign(b: DominionBlock, id: PartnerId): { ok: boolean; notice: string } {
  const why = signProblem(b, id);
  if (why) return { ok: false, notice: why };
  const p = partnersOf(b), t = T(id), R = D().renegotiate;
  p.deals[id] = { since: b.day, cut: withMet(b, id, t.cut), next: b.day + R.every, due: b.day + t.every, anger: 0, broken: 0, skip: false };
  if (!p.offered.includes(id)) p.offered.push(id);
  addRoom(b, id);
  let gift = '';
  if (id === 'snagem') {
    invAdd(b, 'snag-ball', t.balls?.sign ?? 0);
    gift = L('giftSnagem', { n: t.balls?.sign ?? 0 });
  } else gift = L('giftCipher');
  return { ok: true, notice: L('signed', { team: t.name, cut: p.deals[id]!.cut, gift }) };
}

// ---------- the weekly business (the World Turn's rivals step) ----------

/** This week's income so far: every ₽ in on the Ledger's page (costs aren't netted off). */
const weekIncome = (b: DominionBlock): number => Object.values(empireOf(b).week).reduce((a, n) => a + Math.max(0, n), 0);

/** The Reserve Pokémon a partner would take: Snagem the best (BST x level), Cipher a Shadow one. Aces stay. */
function titheMon(b: DominionBlock, kind: PartnerDef['tithe']): PokemonInstance | null {
  const r = b.reserve;
  if (!r) return null;
  const pool = r.box.filter((m) => !r.meta[m.uid]?.ace && (kind === 'best' || !!m.shadow));
  return [...pool].sort((x, y) => (r.meta[y.uid]?.bst ?? 0) * y.level - (r.meta[x.uid]?.bst ?? 0) * x.level || x.uid.localeCompare(y.uid))[0] ?? null;
}
function takeMon(b: DominionBlock, mon: PokemonInstance): void {
  const r = reserveBook(b);
  r.box = r.box.filter((m) => m.uid !== mon.uid);
  delete r.meta[mon.uid];
}

function weekly(b: DominionBlock, seed: string): string[] {
  // Nothing is written for a team that never reached Syndicate (old saves and small crews stay as they were).
  const p = b.partners ?? (peakOf(b) >= stepById(D().opensAt) ? partnersOf(b) : null);
  if (!p) return [];
  const out: string[] = [];
  // The offer, once, the first night the team is a Syndicate.
  for (const id of PARTNER_IDS) {
    if (!p.offered.includes(id) && !p.closed && !p.ended.includes(id) && !p.deals[id] && peakOf(b) >= stepById(D().opensAt)) {
      p.offered.push(id);
      out.push(L('offer', { team: T(id).name }));
    }
  }
  const ids = activeIds(b);
  if (!ids.length) return out;
  const payday = b.day % weekLen() === 0;
  const R = D().renegotiate;
  const extra: Partial<Record<PartnerId, number>> = {};
  const mons: Record<string, string[]> = {};
  // The Pokémon they're owed (Snagem weekly, Cipher every two weeks): none they like = a bigger cut that payday.
  for (const id of ids) {
    const d = p.deals[id]!, t = T(id);
    if (b.day < d.due) continue;
    d.due = b.day + t.every;
    if (id === 'cipher' && d.skip) {
      d.skip = false;
      continue;
    }
    const mon = titheMon(b, t.tithe);
    if (mon) {
      takeMon(b, mon);
      const name = monName(mon.speciesId);
      (mons[id] ??= []).push(name);
      out.push(t.tithe === 'shadow' ? L('tookShadow', { mon: name }) : L('tookMon', { team: t.name, mon: name }));
    } else {
      extra[id] = t.noMon;
      out.push(L('noMon', { team: t.name, n: t.noMon }));
    }
  }
  if (payday) {
    // The cut, before wages (this step runs before the bills in the World Turn's fixed order).
    const income = weekIncome(b);
    const money: Record<string, number> = {};
    for (const id of ids) {
      const d = p.deals[id]!, t = T(id);
      const pct = d.cut + (extra[id] ?? 0);
      const n = Math.min(Math.max(0, b.funds), Math.round((income * pct) / 100));
      money[id] = n;
      if (n > 0) {
        b.funds -= n;
        book(b, 'partners', -n);
        out.push(L('cut', { team: t.name, cut: pct, n: n.toLocaleString('en-US') }));
      } else out.push(L('cutNone', { team: t.name }));
      if (id === 'snagem' && t.balls?.week) {
        invAdd(b, 'snag-ball', t.balls.week);
        out.push(L('balls', { n: t.balls.week }));
      }
      if (t.dread) {
        const towns = heldIds(b);
        for (const town of towns) b.field.districts[town]!.dread += t.dread;
        if (towns.length) out.push(L('dread', { n: t.dread }));
      }
    }
    // A23: with both deals, one sabotages the other every week (rolled on its own stream).
    let feud: string | null = null;
    if (ids.length === 2) {
      const r = rngOf(seed, 'evil-partners', b.day);
      if (r.int(0, 1) === 0) {
        p.deals.cipher!.broken = b.day + D().feud.snagem.days;
        feud = fill(D().feud.snagem.text, { days: D().feud.snagem.days });
      } else {
        invAdd(b, 'snag-ball', -D().feud.cipher.balls);
        feud = fill(D().feud.cipher.text, { n: D().feud.cipher.balls });
      }
      out.push(feud);
    }
    p.last = { day: b.day, money, mons, feud };
  } else if (Object.keys(mons).length) p.last = { ...p.last, mons: { ...p.last.mons, ...mons } };
  // Renegotiation: afraid of you (enough Dread in your towns), the cut drops; otherwise it climbs, more with grudges.
  for (const id of ids) {
    const d = p.deals[id]!, t = T(id);
    if (b.day < d.next) continue;
    const dread = heldIds(b).reduce((a, town) => a + Math.max(0, b.field.districts[town]!.dread), 0);
    const scared = dread >= R.dreadAt;
    const base = scared ? d.cut - R.down : d.cut + R.up + d.anger * R.angerUp;
    d.cut = withMet(b, id, base);
    d.anger = 0;
    d.next = b.day + R.every;
    out.push(L(scared ? 'renegDown' : 'reneg', { team: t.name, cut: d.cut }));
  }
  return out;
}
addWorldStep('rivals', weekly);

// ---------- the three ways out ----------

export const buyoutPrice = (b: DominionBlock, id: PartnerId): number => {
  const d = dealOf(b, id), t = T(id);
  return t.buyout.base + t.buyout.perWeek * (d ? Math.floor((b.day - d.since) / weekLen()) : 0);
};

function end(b: DominionBlock, id: PartnerId, keep: boolean): void {
  const p = partnersOf(b);
  delete p.deals[id];
  if (!p.ended.includes(id)) p.ended.push(id);
  if (p.purge?.id === id) p.purge = null;
  if (keep) {
    if (!p.kept.includes(id)) p.kept.push(id);
  } else {
    dropRoom(b, id);
    if (id === 'snagem') invAdd(b, 'snag-ball', -999);
  }
}

export function cancel(b: DominionBlock, id: PartnerId): { ok: boolean; notice: string } {
  if (!dealOf(b, id)) return { ok: false, notice: L('needsDeal', { team: T(id).name }) };
  const mon = titheMon(b, 'best');
  if (mon) takeMon(b, mon);
  end(b, id, false);
  addHeat(b, DOMINION_DATA.field.hq, D().ways.cancel.heat);
  syncHeat(b);
  const what = L(id === 'snagem' ? 'cancelSnagem' : 'cancelCipher', { mon: mon ? monName(mon.speciesId) : 'nothing more' });
  return { ok: true, notice: L('cancelled', { team: T(id).name, what }) };
}

export function buyout(b: DominionBlock, id: PartnerId): { ok: boolean; notice: string } {
  if (!dealOf(b, id)) return { ok: false, notice: L('needsDeal', { team: T(id).name }) };
  const n = buyoutPrice(b, id);
  if (b.funds < n) return { ok: false, notice: L('noMoney', { n: n.toLocaleString('en-US') }) };
  b.funds -= n;
  book(b, 'partners', -n);
  const keep = T(id).buyout.keeps;
  end(b, id, keep);
  return { ok: true, notice: `${L('boughtOut', { team: T(id).name, n: n.toLocaleString('en-US') })} ${L(keep ? 'keepsDesk' : 'noKeep')}` };
}

/** The purge (or a Betray action): the next of their fighters waits at the HQ's door. */
export function purge(b: DominionBlock, id: PartnerId): { ok: boolean; notice: string; fight: boolean } {
  if (!dealOf(b, id)) return { ok: false, notice: L('needsDeal', { team: T(id).name }), fight: false };
  if (b.field.fight) return { ok: false, notice: 'A fight is waiting.', fight: false };
  const p = partnersOf(b);
  if (!p.purge || p.purge.id !== id) p.purge = { id, at: 0 };
  const foe = T(id).purge[p.purge.at]!;
  b.field.fight = { why: 'partner', foe: 'partner', begun: false, action: null, target: id, district: DOMINION_DATA.field.hq, pass: false, big: false, wager: 0, racket: null } as FieldFight;
  return { ok: true, notice: L('purgeStart', { team: T(id).name, name: foe.name }), fight: true };
}

setPartnerFoe((b, run) => {
  const s = partnerSide(b, run);
  return s ? { name: s.name, species: s.species[0]!, level: s.level, wild: false } : { name: 'A Snagem thug', species: 'machop', level: foeLevel(b, run, 1), wild: false };
});

/** The side for the purge's next fight (fight.ts builds it). */
export function partnerSide(b: DominionBlock, run: Pick<RunState, 'party'>): { name: string; classId: string; leaderId: null; species: string[]; level: number } | null {
  const pg = b.partners?.purge;
  if (!pg) return null;
  const f = T(pg.id).purge[pg.at];
  return f ? { name: f.name, classId: f.cls, leaderId: null, species: f.species, level: foeLevel(b, run, f.offset) } : null;
}

addFightSettler('partner', (_content, b, _run, _fight, outcome) => {
  const p = partnersOf(b), pg = p.purge;
  if (!pg) return [];
  const t = T(pg.id), foe = t.purge[pg.at]!;
  if (outcome !== 'win') {
    p.purge = null;
    const d = p.deals[pg.id];
    if (d) d.cut = clamp(d.cut + D().ways.purge.lose, D().renegotiate.min, D().renegotiate.max);
    return [L('purgeLost', { name: foe.name, team: t.name, n: D().ways.purge.lose })];
  }
  pg.at += 1;
  const next = t.purge[pg.at];
  if (next) return [L('purgeNext', { name: foe.name, who: next.name })];
  end(b, pg.id, true);
  const hq = b.field.districts[DOMINION_DATA.field.hq];
  if (hq) hq.dread += D().ways.purge.dread;
  return [L('purgeWon', { leader: foe.name, team: t.name })];
});

/** A purge is half done: the next fighter waits (the Partnership page's button says who). */
export const purgeNext = (b: DominionBlock): { id: PartnerId; name: string } | null => {
  const pg = b.partners?.purge;
  const f = pg ? T(pg.id).purge[pg.at] : undefined;
  return pg && f ? { id: pg.id, name: f.name } : null;
};

// ---------- the Shadow Machine (Cipher) ----------

/** Every Pokémon the machine could take: the Boss's team and the Reserve (not a Shadow Pokémon already). */
export function machineMons(b: DominionBlock, run: Pick<RunState, 'party'>): { mon: PokemonInstance; where: 'party' | 'reserve' }[] {
  return [
    ...run.party.filter((m) => !m.shadow).map((mon) => ({ mon, where: 'party' as const })),
    ...(b.reserve?.box ?? []).filter((m) => !m.shadow).map((mon) => ({ mon, where: 'reserve' as const })),
  ];
}
export function machineProblem(b: DominionBlock): string | null {
  if (!machineOn(b)) return L('needsDeal', { team: T('cipher').name });
  const d = b.partners?.deals.cipher;
  if (d && d.broken > b.day) return L('machineBroken', { day: d.broken });
  if (b.partners?.used === weekNo(b.day) + 1) return L('machineUsed');
  return null;
}
/** Closes a Pokémon's heart (Trust 0 until purified, A19). Mutates `b` and `run`. */
export function shadowOne(b: DominionBlock, run: RunState, uid: string): { ok: boolean; notice: string } {
  const why = machineProblem(b);
  if (why) return { ok: false, notice: why };
  const hit = machineMons(b, run).find((x) => x.mon.uid === uid);
  if (!hit) return { ok: false, notice: L('machineNone') };
  makeShadow(hit.mon, T('cipher').machine?.heart ?? 100);
  const meta = b.reserve?.meta[uid];
  if (meta) {
    meta.trust = 0;
    meta.src = 'shadow';
  }
  partnersOf(b).used = weekNo(b.day) + 1;
  return { ok: true, notice: L('shadowed', { mon: monName(hit.mon.speciesId) }) };
}

/** Shadow Pokémon the team holds (the Boss's first, then the Reserve), most closed heart first. */
function shadowMons(b: DominionBlock, run: Pick<RunState, 'party'>): PokemonInstance[] {
  return [...run.party, ...(b.reserve?.box ?? [])].filter((m) => !!m.shadow).sort((x, y) => (y.shadow!.heart - x.shadow!.heart) || x.uid.localeCompare(y.uid));
}

// ---------- the fifteen actions (section AC) ----------

const NEEDS: Record<string, PartnerId> = { 'Snagem deal': 'snagem', 'Cipher deal': 'cipher' };
addActionGate((b, def) => {
  const id = NEEDS[def.unlock];
  if (!id) return null;
  // Black Market Snag and Snag Ball Use work on a kept Snag Machine too; the rest need the deal itself.
  const ok = id === 'snagem' && (def.id === 'black-market-snag' || def.id === 'snag-ball-use') ? snagOn(b) : id === 'cipher' && (def.id === 'purify-rite' || def.id === 'shadow-tutor') ? machineOn(b) || !!dealOf(b, id) : !!dealOf(b, id);
  return ok ? null : L('needsDeal', { team: T(id).name });
});
addCardGate((b, run, c) => {
  if (c.def.id === 'purify-rite' && !shadowMons(b, run).length) return L('noShadow');
  if (c.def.id === 'black-market-snag' && !(b.reserve?.box ?? []).some((m) => b.reserve?.meta[m.uid]?.src === 'snagged')) return L('soldNone');
  if (c.def.id === 'shadow-tutor' && !shadowMons(b, run).length) return L('noShadow');
  return null;
});

const partnerOfAction = (action: string): PartnerId => (action.includes('snagem') || action.includes('snag') ? 'snagem' : 'cipher');

addActEffect('partnerMeet', (b, x) => {
  const id = partnerOfAction(x.action), p = partnersOf(b);
  p.met[id] = (p.met[id] ?? 0) + 1;
  return [L('meet', { team: T(id).name, n: (p.met[id] ?? 0) * D().renegotiate.met })];
});
addActEffect('snagBall', (b) => {
  invAdd(b, 'snag-ball', 1);
  return [L('snagFight')];
});
addActEffect('snagemHit', (b) => {
  const n = 2;
  invAdd(b, 'snag-ball', n);
  const d = dealOf(b, 'snagem');
  if (d) d.anger += 1;
  return [L('snagHit', { n })];
});
addActEffect('shadowSabotage', (b) => {
  const d = dealOf(b, 'cipher');
  if (d) {
    d.skip = true;
    d.anger += 1;
  }
  return [L('sabotage')];
});
addActEffect('betrayPartner', (b, x) => {
  const id: PartnerId = x.action === 'betray-snagem' ? 'snagem' : 'cipher';
  return [purge(b, id).notice];
});

addPlayEffect('shadowTrade', ({ content, b, run, level, rng }) => {
  const pool = D().shadow.trade[clamp(level, 1, 5) - 1]!.filter((s) => content.species.has(s));
  if (!pool.length) return [L('machineNone')];
  const species = pool[rng.int(0, pool.length - 1)]!;
  const lv = Math.max(2, Math.min(b.levelCap, teamLevel(run)));
  const heart = T('cipher').machine?.heart ?? 100;
  const said = placeMon(content, run, b, { species, level: lv, src: 'shadow', trust: 0, shape: (m) => makeShadow(m, heart) });
  return [L('traded', { mon: monName(species), level: lv }), ...(said && said.includes('full') ? [said] : [])];
});
addPlayEffect('purify', ({ content, b, run, level }) => {
  const mon = shadowMons(b, run)[0];
  if (!mon) return [L('noShadow')];
  const amount = D().shadow.purify[clamp(level, 1, 5) - 1]!;
  if (soothe(content, mon, amount)) {
    const meta = b.reserve?.meta[mon.uid];
    if (meta) meta.trust = Math.max(meta.trust, D().shadow.trustAfter);
    return [L('purified', { mon: monName(mon.speciesId), n: D().shadow.trustAfter })];
  }
  return [L('soothed', { mon: monName(mon.speciesId), heart: mon.shadow!.heart })];
});
addPlayEffect('shadowTutor', ({ content, b, run, level }) => {
  const moves = D().shadow.tutor.slice(0, clamp(level, 1, 5));
  for (const mon of shadowMons(b, run)) {
    for (const id of moves) {
      if (!content.moves.has(id) || mon.moves.some((m) => m.id === id)) continue;
      if (teachEggMove(content, mon, id, [])) return [L('tutor', { mon: monName(mon.speciesId), move: content.moves.get(id)!.name })];
    }
  }
  return [L('tutorNone')];
});
addPlayEffect('snagSell', ({ b, level }) => {
  const r = b.reserve;
  const mon = r?.box.filter((m) => r.meta[m.uid]?.src === 'snagged').sort((x, y) => x.level - y.level || x.uid.localeCompare(y.uid))[0];
  if (!r || !mon) return [L('soldNone')];
  const n = D().shadow.sell[clamp(level, 1, 5) - 1]!;
  takeMon(b, mon);
  b.funds += n;
  return [L('sold', { mon: monName(mon.speciesId), n: n.toLocaleString('en-US') })];
});

// ---------- the Chair (cards 63 and 119) ----------

setChairHook('close-deals', (b) => {
  const p = partnersOf(b);
  for (const id of activeIds(b)) end(b, id, false);
  p.closed = true;
  return L('looker');
});
setChairHook('shadow-buy', (b) => {
  const pool = D().shadow.trade[2]!;
  const species = pool[b.day % pool.length]!;
  partnersOf(b).due.push({ species, level: Math.max(2, b.levelCap - 3) });
  return L('dealerShadow', { mon: monName(species) });
});

// ---------- the session's settling (it has the content and the run) ----------

/** Applies the Snag Balls the step moved, and makes the Shadow Pokémon a Chair dealer sold. Mutates `run` and `b`. */
export function settlePartners(content: Content, run: RunState, b: DominionBlock): string[] {
  const p = b.partners;
  if (!p) return [];
  const out: string[] = [];
  for (const [item, n] of Object.entries(p.inv)) {
    if (!n) continue;
    const have = run.inventory[item] ?? 0;
    const next = Math.max(0, have + n);
    if (next) run.inventory = { ...run.inventory, [item]: next };
    else {
      const { [item]: _gone, ...rest } = run.inventory;
      run.inventory = rest;
    }
  }
  p.inv = {};
  for (const due of p.due) {
    const said = placeMon(content, run, b, { species: due.species, level: due.level, src: 'shadow', trust: 0, shape: (m) => makeShadow(m, T('cipher').machine?.heart ?? 100) });
    if (said) out.push(said);
  }
  p.due = [];
  return out;
}

/** The Snag Machine reaches this fight: not the Hero's team, a Heroic Legendary, your own crew, or anyone underage. */
export function snagsThisFight(b: DominionBlock, foe: FieldFight['foe'], classId: string | null): boolean {
  if (!snagOn(b) || !classId) return false;
  if (['hero', 'sidekick', 'legend', 'member', 'wild', 'ghost'].includes(foe)) return false;
  return !DOMINION_DATA.snatch.minorClasses.includes(classId);
}

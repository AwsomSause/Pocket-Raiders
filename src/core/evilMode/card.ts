// The Honest Card (design Part 12 section 1, Part 29 section 6): thirteen fields assembled from a job, always in the
// same order, and the gate that lights CONFIRM. Pure: no number is drawn; a Card is arithmetic over the block.
// Field 12 is the Ledger's sentence, from ledger.ts, so the line filed is the line the player read.

import { acrossLine } from './neighbour';
import { fairPrice, holdingName, localOf, payAmount, streetName, streetOf, takings } from './board';
import { heroField } from './hero';
import { EVIL_DATA, type EvilData } from './data';
import { crewNames, fill, holdingTo, money, sentenceFor } from './ledger';
import { oddsFor, oddsText, type JobDraft } from './odds';
import type { CardField, EvilModeBlock, StoredCard } from './schema';
import { crossers, peopleText, wontText } from './people';
import { heatIfSent, proofFor } from './line';
import { modify } from './regionRule';

/** A Card as it's made (every field whole); stored, a field may later be packed (slice 16). */
export type CardDraft = Omit<StoredCard, 'id' | 'fields'> & { fields: CardField[] };

/** The Card for a job. Callers check the job can be queued first (dispatch.ts `jobProblem`). */
/** `asked`: the Boss is asking anyway, across a line; field 12 says who was asked (Part 29 section 5.4). */
export function cardFor(block: EvilModeBlock, job: JobDraft, data: EvilData = EVIL_DATA, asked = false): CardDraft {
  const d = block.district!;
  const h = d.holdings.find((x) => x.id === job.holdingId)!;
  const L = data.ledger.card;
  const l = localOf(h, data);
  const blind = h.kind === 'local' && h.scouted === 0;
  const to = holdingTo(h, data, block.district);
  const m = job.method;
  const offer = m === 'pay' ? data.district.methods.pay.offers.find((o) => o.pct === (job.offer ?? 100)) : undefined;
  const dark = m === 'lean' || m === 'take' || m === 'expose';
  const C = data.line.card;
  const thing = m === 'take' ? data.line.things.find((t) => t.id === (job.thing ?? 'stock'))! : undefined;
  const clean = !(offer && !offer.fair) && m !== 'lean' && m !== 'take';
  const daily = takings({ ...h, owner: 'team' }, data);
  const street = streetName(d, streetOf(h.step, data), data);
  const o = oddsFor(block, job, data);
  const methodName = data.methods.find((x) => x.id === m)!.name;

  const f: [string, boolean][] = [];
  // 1 The name: plainly.
  f.push([`${methodName.toUpperCase()} · ${holdingName(h, data).toUpperCase()} · ${L.day}`, false]);
  // 2 Takes
  if (m === 'lean') f.push([blind ? fill(C.lean!.takes!, { amount: '?' }) : l && l.take > 0 ? fill(C.lean!.takes!, { amount: money(l.take) }) : C.lean!.takesNothing!, blind]);
  else if (thing) f.push([fill(C.take!.takes!, { thing: thing.name }), false]);
  else if (m === 'expose') f.push([C.expose!.takes!, false]);
  else if (m === 'scout') f.push([L.takes.scout, false]);
  else if (m === 'pay') f.push([fill(L.takes.pay, { amount: money(payAmount(h, job.offer, data)) }), false]);
  else if (m === 'outplay') f.push([h.kind === 'local' ? L.takes.outplayLocal : L.takes.outplay, false]);
  else if (h.kind === 'safehouse') f.push([L.takes.persuadeRooms, false]);
  else if (blind) f.push([fill(L.takes.persuade, { amount: '?' }), true]);
  else if (l && l.take > 0) f.push([fill(L.takes.persuade, { amount: money(l.take) }), false]);
  else if (l && l.earns > 0) f.push([L.takes.persuadeFavour, false]);
  else f.push([L.takes.persuadeNothing, false]);
  // 3 From: by name, once scouted.
  if (m === 'scout') f.push([L.from.nobody, false]);
  else if (blind) f.push([fill(L.from.notScouted, { step: h.step }), true]);
  else if (l) f.push([fill(l.earns > 0 ? L.from.local : L.from.localNothing, { to, earns: money(l.earns) }), false]);
  else f.push([fill(L.from.place, { to: h.ref }), false]);
  // 4 Gives
  const stock = (l?.take ?? 0) * data.line.take.stockDays;
  if (m === 'lean') f.push([blind ? L.gives.notKnown : fill(C.lean!.gives!, { amount: money(daily) }), blind]);
  else if (thing) f.push([fill(thing.gives, { amount: money(stock) }), false]);
  else if (m === 'expose') f.push([fill(C.expose!.gives!, { street }), false]);
  else if (m === 'scout') f.push([fill(L.gives.scout, { step: h.step, reach: modify(block, 'scoutReach', {}, data.district.rules.scoutReach, data) }), false]);
  else if (blind) f.push([L.gives.notKnown, true]);
  else if (h.kind === 'safehouse') f.push([fill(L.gives.rooms, { rent: money(data.district.rules.safehouseRent) }), false]);
  else if (daily > 0) f.push([fill(L.gives.money, { amount: money(daily) }), false]);
  else if (l) f.push([L.gives.favour, false]);
  else f.push([L.gives.ground, false]);
  // 5 Moves: the five numbers, each drawn; a dash where it doesn't move.
  // Slice 9: the region's rule shows here too (a deeded Take's Heat), from the same hook the Evening uses.
  const heat = modify(block, 'heat', { method: m, tags: h.tags }, heatIfSent(m, data), data);
  const leanDaily = m === 'lean' ? Math.floor((daily * data.line.lean.takings) / 100) : daily;
  const funds = m === 'expose' ? '—' : thing ? (thing.id === 'stock' ? `↑ ${money(stock)} once` : thing.id === 'deed' && daily > 0 ? `↑ ${money(daily)} a day` : '—') : m === 'lean' ? (blind ? '?' : leanDaily > 0 ? `↑ ${money(leanDaily)} a day` : '—') : m === 'pay' ? `↓ ${money(payAmount(h, job.offer, data))}` : blind && m !== 'scout' ? '?' : m !== 'scout' && daily > 0 ? `↑ ${money(daily)} a day` : m !== 'scout' && daily < 0 ? `↓ ${money(-daily)} a day` : '—';
  const heatText = heat > 0 ? `↑ ${heat} if the day's loudest` : heat < 0 ? `↓ ${-heat} if nothing louder goes today` : '—';
  const proof = m === 'expose' ? proofFor(block, h, data) : null;
  const dread = m === 'lean' ? `↑ ${data.line.lean.dread}` : m === 'take' ? `↑ ${data.line.take.dread}` : '—';
  const regard = m === 'expose' ? (proof?.how === 'witness' ? `↑ ${data.line.expose.regard} if it's printed: clean hands` : '—') : m === 'persuade' && !d.regardStreets.includes(streetOf(h.step, data)) ? `↑ ${data.district.methods.persuade.regard} if the first on ${street}` : m === 'outplay' ? `↑ ${data.district.methods.outplay.regard} if won` : '—';
  f.push([`Funds ${funds} · Heat ${heatText} · Loyalty ${m === 'lean' ? '↓ 1 each if it fails' : '—'} · Regard ${regard} · Dread ${dread}`, funds === '?']);
  // 6 Odds: the same function the Evening rolls against.
  f.push([oddsText(o), o.lo !== o.hi]);
  // 7 Who's going
  f.push([job.squad.map((id, i) => `${crewNames(block, [id])}${i === 0 ? ` ${L.lead}` : ''}`).join(', '), false]);
  // 8 Who won't: every person on the squad whose line this job crosses, and nobody else (Part 7 section 11).
  const wont = crossers(block, job, data);
  f.push([wontText(block, job, data), false]);
  // 9 Holds or turns
  if (dark) f.push([m === 'lean' ? C.lean!.holds! : thing ? thing.holds : C.expose!.holds!, false]);
  else f.push([m === 'scout' ? L.holds.nothing : offer && !offer.fair ? L.holds.turns : L.holds.holds, false]);
  // 10 The Hero (slice 5)
  f.push([heroField(block, h, data), false]);
  // 11 Not known: every field that's a guess, listed.
  const unknown = f.map(([, u], i) => (u ? data.ledger.fields[i]! : null)).filter((x): x is string => !!x);
  f.push([unknown.length ? unknown.map((n) => `${n}: not scouted.`).join(' ') : L.notKnownNone, unknown.length > 0]);
  // 12 How it's written down: the Ledger's sentence, exactly.
  f.push([`${sentenceFor(block, job, data)}${acrossLine(block, h.id, data) ? ` ${data.neighbour.lines.broke}` : ''}${asked && wont.length ? fill(peopleText('askedAnyway', data), { names: wont.map((p) => p.name).join(' and ') }) : ''}`, false]);
  // 13 The other way: never empty.
  const fair = fairPrice(h, data);
  const persuadeOdds = () => oddsFor(block, { holdingId: h.id, method: 'persuade', squad: job.squad }, data);
  if (m === 'lean') f.push([fill(C.lean!.other!, { odds: oddsText(persuadeOdds()).split(' · ')[0]!.replace('%', ''), fair: money(fair ?? 0) }), false]);
  else if (m === 'take') f.push([fill(C.take!.other!, { odds: oddsText(persuadeOdds()).split(' · ')[0]!.replace('%', ''), fair: money(fair ?? 0) }), false]);
  else if (m === 'expose') f.push([`${C.expose!.other!} ${proof?.how === 'witness' ? fill(data.line.proof.witness!, { who: proof.who ?? '' }) : data.line.proof.ledger!}`, false]);
  else f.push([clean ? L.clean : fill(L.underPrice, { fair: money(fair ?? 0) }), false]);

  const fields: CardField[] = f.map(([text, u], i) => ({ label: data.ledger.fields[i]!, text, unknown: u }));
  return { day: block.here.day, region: d.region, district: d.n, holdingId: h.id, method: m, ...(m === 'pay' ? { offer: job.offer ?? 100 } : {}), ...(thing ? { thing: thing.id } : {}), clean, fields };
}

/** How many fields are still red ink (field 11's own count). */
export const unknownCount = (c: Pick<CardDraft, 'fields'>): number => c.fields.slice(0, 10).filter((x) => x.unknown).length;

/** The job field 13's button swaps to, where there is one: a Pay under the price swaps to the fair price. */
export function otherWay(job: JobDraft, data: EvilData = EVIL_DATA): JobDraft | null {
  // Slice 6: a Lean or a Take swaps to asking them (Part 12 section 1: "The other way").
  if (job.method === 'lean' || job.method === 'take') return { holdingId: job.holdingId, method: 'persuade', squad: job.squad };
  if (job.method !== 'pay') return null;
  const offer = data.district.methods.pay.offers.find((o) => o.pct === (job.offer ?? 100));
  if (!offer || offer.fair) return null;
  const fair = data.district.methods.pay.offers.find((o) => o.fair)!;
  return { ...job, offer: fair.pct };
}

// ---- The gate (Part 29 section 6.2): CONFIRM's lit only once field 13 has been on screen; a held key never confirms ----

export interface CardGate {
  /** Field 13 has been on screen. */
  seen: boolean;
  /** A key has been released since the Card opened, so the next press is a press of its own. */
  released: boolean;
}

/** Opening a Card. `allFit`: all thirteen fields are on screen at once (the button's lit at once). `byKey`: the press that opened it is still down. */
export const openGate = (allFit: boolean, byKey: boolean): CardGate => ({ seen: allFit, released: !byKey });

export const gateSeen = (g: CardGate): CardGate => (g.seen ? g : { ...g, seen: true });

/** CONFIRM is lit once field 13 has been seen. There's no setting that turns this off. */
export const confirmLit = (g: CardGate): boolean => g.seen;

/**
 * A confirm key on an open Card. A held key (a repeat) scrolls and never confirms; before field 13's been seen, a press
 * scrolls; the press that opened the Card does nothing until it's released. Confirm wants its own press, after a release.
 */
export function gateKey(g: CardGate, e: { type: 'down' | 'up'; repeat?: boolean }): { gate: CardGate; act: 'confirm' | 'scroll' | 'none' } {
  if (e.type === 'up') return { gate: g.released ? g : { ...g, released: true }, act: 'none' };
  if (e.repeat || !g.seen) return { gate: g, act: 'scroll' };
  if (!g.released) return { gate: g, act: 'none' };
  return { gate: g, act: 'confirm' };
}

// The Scheme page (design Part 22 section 1.3; Part 29 section 10.2; New look): a drawing of the thing in four pieces that
// fill in as the parts arrive, each with its stamp, who got it and the day; groundwork as small ticks; a bar with a notch at
// 80; the sentence that gets plainer as the number rises; and behind it, fainter, the clean version. Every choice is a row
// (Up/Down picks, Enter does it); the chosen row's Honest Card shows on the right. Decides nothing: `step` checks again.

import { EVIL_DATA, type EvilData } from './data';
import type { EvilAction } from './day';
import { digDef, digsHere, familyOf, heistDef, heistsHere, homeCount, inheritProblem, ledgerProblem, momentWhere, partName, planOptions, roomChoices, schemeCard, schemeOn, schemePct, sentenceAt, wayOf, wayProblem, digProblem, heistOfferProblem, type PlanSlot, type WayKey } from './scheme';
import { stageName } from './region';
import { PARTS, type CardField, type EvilModeBlock } from './schema';
import { money } from './ledger';

export interface SchemeRow { label: string; open: boolean; why: string | null; action: EvilAction; sel: boolean; testid: string; card: CardField[] | null }
export interface SchemeSlot { part: string; piece: string; state: 'empty' | 'inHand' | 'lost'; stamp: string | null; clean: boolean | null; line: string }

export interface SchemeModel {
  title: string;
  says: string;
  pct: number;
  readyAt: number;
  sentence: string;
  slots: SchemeSlot[];
  ground: { n: number; cap: number; text: string };
  faint: string;
  /** The clean version, piece by piece: the ghost drawn behind the four pieces. */
  ghost: string[];
  moment: string;
  eye: string | null;
  home: { n: number; need: number; names: string[] } | null;
  /** The Scheme's own Card: one line a stamped part, growing. */
  own: string[];
  heist: { name: string; stage: string; noise: string; lines: string[] } | null;
  digs: string[];
  rows: SchemeRow[];
  card: CardField[] | null;
  hint: string;
}

const STAMP_WORD = (clean: boolean | null, data: EvilData) => (clean === null ? null : clean ? data.scheme.words.clean! : data.scheme.words.notClean!);

export function schemeModel(block: EvilModeBlock, sel: number, data: EvilData = EVIL_DATA): SchemeModel | null {
  if (!schemeOn(data) || !block.scheme) return null;
  const s = block.scheme;
  const f = familyOf(block, data);
  const fallen = s.inherited ? block.neighbour?.scheme ?? null : null;
  const rows: Omit<SchemeRow, 'sel'>[] = [];
  const hs = s.heist;
  if (hs && hs.stage === 'rooms') {
    for (const c of roomChoices(block, data)) rows.push({ label: c.label, open: !c.why, why: c.why, action: { type: 'heistRoom', choice: c.id }, testid: `evil-sc-room-${c.id}`, card: null });
  } else {
    if (hs && hs.stage === 'plan') {
      const slots: [PlanSlot, string][] = [['in', 'A way in'], ['out', 'A way out'], ['watcher', 'A watcher'], ['inside', 'An inside word']];
      for (const [slot, name] of slots) {
        const opts = planOptions(block, slot, data);
        const cur = slot === 'inside' ? (hs.plan.inside ? 'yes' : null) : hs.plan[slot];
        const at = Math.max(0, opts.findIndex((o) => o.id === cur));
        const next = opts.slice(at + 1).find((o) => !o.why) ?? opts[0]!;
        rows.push({ label: `${name}: ${opts[at]?.name ?? 'Empty'}`, open: true, why: null, action: { type: 'heistPlan', slot, value: next.id }, testid: `evil-sc-plan-${slot}`, card: null });
      }
      rows.push({ label: 'Go in, in person', open: block.here.beat === 'inPerson', why: block.here.beat === 'inPerson' ? null : 'At the In person beat.', action: { type: 'heistGo' }, testid: 'evil-sc-go', card: null });
      rows.push({ label: 'Call it off', open: true, why: null, action: { type: 'heistOff' }, testid: 'evil-sc-off', card: null });
    }
    if (f) {
      for (const part of PARTS) {
        const slot = s.parts[part];
        if (slot.state === 'inHand') continue;
        for (const key of ['dirty', 'clean', 'second'] as WayKey[]) {
          const way = wayOf(f, part, key);
          if (!way || (key === 'second') !== (slot.state === 'lost')) continue;
          const why = wayProblem(block, part, key, data);
          const card = way.how === 'wait' || way.how === 'gyms' ? null : schemeCard(block, part, key, data);
          rows.push({ label: `${partName(part)}: ${way.name}${key === 'dirty' ? ' (not clean)' : ''}`, open: !why, why, action: { type: 'schemeWay', part, key }, testid: `evil-sc-${part}-${key}`, card });
        }
      }
    }
    const L = data.scheme.ledger;
    if (block.district?.region === L.region && s.ledger.step < 4) {
      const step = L.steps[s.ledger.step]!;
      for (const key of ['clean', 'dirty'] as const) {
        const why = ledgerProblem(block, key, data);
        rows.push({ label: `${L.name}, ${step.n}. ${step.name}: ${step[key].name}`, open: !why, why, action: { type: 'ledgerStep', key }, testid: `evil-sc-ledger-${key}`, card: null });
      }
    }
    if (!hs || hs.stage === 'done' || hs.stage === 'failed') {
      const partHeists = new Set(f ? PARTS.filter((p) => s.parts[p].state === 'empty').map((p) => f.parts[p].dirty?.heist) : []);
      for (const h of heistsHere(block, data)) {
        if (partHeists.has(h.id)) continue;
        const why = heistOfferProblem(block, h.id, data);
        rows.push({ label: `A heist: ${h.name}${h.gives ? ` (${money(h.gives)})` : ''}`, open: !why, why, action: { type: 'heist', id: h.id }, testid: `evil-sc-heist-${h.id}`, card: null });
      }
    }
    for (const d of digsHere(block, data)) {
      if (d.part) continue;
      const why = digProblem(block, d.id, data);
      rows.push({ label: `A Dig: ${d.name}`, open: !why, why, action: { type: 'dig', id: d.id }, testid: `evil-sc-dig-${d.id}`, card: null });
    }
    for (const g of s.digs.filter((x) => x.ended === 'choose')) {
      const name = digDef(g.id, data)?.name ?? g.id;
      rows.push({ label: `${name}: put it back`, open: true, why: null, action: { type: 'digEnd', holdingId: g.holdingId, back: true }, testid: `evil-sc-digback-${g.id}`, card: null });
      rows.push({ label: `${name}: keep it open`, open: true, why: null, action: { type: 'digEnd', holdingId: g.holdingId, back: false }, testid: `evil-sc-digopen-${g.id}`, card: null });
    }
    for (const t of s.takes.filter((x) => !x.back)) rows.push({ label: `Give back ${money(t.amount)} (day ${t.day})`, open: block.here.beat === 'night', why: block.here.beat === 'night' ? null : 'At Night.', action: { type: 'giveBack', id: t.id }, testid: `evil-sc-back-${t.id}`, card: null });
    if (block.neighbour?.scheme && !s.inherited) {
      const why = inheritProblem(block, data);
      rows.push({ label: data.scheme.words.inherit!.replace('{name}', block.neighbour.scheme.name), open: !why, why, action: { type: 'takeUpScheme' }, testid: 'evil-sc-inherit', card: null });
    }
  }
  const at = rows.length ? Math.max(0, Math.min(rows.length - 1, sel)) : 0;
  const pct = schemePct(s, data);
  const slots: SchemeSlot[] = PARTS.map((part) => {
    const x = s.parts[part];
    const piece = f ? f.pieces[part] : fallen?.parts[PARTS.indexOf(part)]?.part ?? part;
    const who = x.by ? block.crew.find((c) => c.id === x.by)?.name ?? null : null;
    const line = x.state === 'inHand' ? [who ? `${who}` : 'The team', x.day ? `day ${x.day}` : '', x.cardId ? `Card ${x.cardId}` : ''].filter(Boolean).join(' · ') : x.state === 'lost' ? data.scheme.words.lost! : data.scheme.words.empty!;
    return { part: partName(part), piece, state: x.state, stamp: STAMP_WORD(x.clean, data), clean: x.clean, line };
  });
  const m = momentWhere(data);
  const mo = s.moment;
  const moment = mo.came === 'ready' ? 'The Moment came: the team was ready.' : mo.came === 'passed' ? 'The Moment passed.' : mo.day ? `The Moment: day ${mo.day}${mo.caused ? ' (caused)' : ''}.` : `The Moment comes in ${stageName(m.n + 1, data)}${m.region ? `, Region ${m.region + 1}` : ''}.`;
  const home = s.family === 'belonging' ? homeCount(block, data) : null;
  const H = hs ? heistDef(hs.id, data) : null;
  const sel0 = rows[at];
  return {
    title: f ? f.name : fallen?.name ?? s.family,
    says: f ? f.says : `${fallen?.from ?? ''}'s, taken up.`,
    pct,
    readyAt: data.scheme.rules.readyAt,
    sentence: sentenceAt(block, data),
    slots,
    ground: { n: s.groundwork, cap: data.scheme.rules.groundCap, text: f?.ground.text ?? '' },
    faint: f ? f.faint : data.scheme.words.inheritOther!,
    ghost: PARTS.map((p) => (f ? f.parts[p].clean.name : data.scheme.words.inheritOther!)),
    moment,
    eye: s.family === 'wonder' ? `${s.legend ? s.legend.charAt(0).toUpperCase() + s.legend.slice(1) : 'The Legend'}'s eye: ${data.scheme.words[s.eye === 'open' ? 'eyeOpen' : s.eye === 'narrowed' ? 'eyeNarrowed' : 'eyeShut']}` : null,
    home: home ? { n: home.n, need: data.scheme.rules.homeNeed, names: home.names.map((x) => `${x.who}: ${x.why}`) } : null,
    own: PARTS.filter((p) => s.parts[p].state === 'inHand').map((p) => `${partName(p)}: ${s.parts[p].way ?? ''}, stamped ${STAMP_WORD(s.parts[p].clean, data)}${s.parts[p].day ? `, day ${s.parts[p].day}` : ''}.`),
    heist: hs && H ? { name: H.name, stage: hs.stage === 'plan' ? 'Planned' : hs.stage === 'rooms' ? `Inside: room ${Math.min(hs.at + 1, hs.rooms.length + 1)} of ${hs.rooms.length + 1}` : hs.stage === 'done' ? 'Done' : 'Failed', noise: `Noise ${hs.noise} of ${data.scheme.heists.noise}`, lines: hs.lines.slice(-6) } : null,
    digs: s.digs.filter((g) => g.ended === 'running' || g.ended === 'choose').map((g) => `${digDef(g.id, data)?.name ?? g.id}: ${g.notes.at(-1) ?? 'begun'}`),
    rows: rows.map((r, i) => ({ ...r, sel: i === at })),
    card: sel0?.card ?? null,
    hint: data.scheme.words.pick!,
  };
}

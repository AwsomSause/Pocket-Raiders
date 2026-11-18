// Evil Mode slice 21: the Edges page (J), in the New look (design Part 29 sections 6 and 16): a Tear's Honest Card ("We
// don't know." three times, CONFIRM still there) with its choices, Static's lines, a Beast in the building, Poipole's plate,
// and, only with the Shadow branch in the run, Rigs, the Lab and the Corruption figure. Works out what to draw; decides nothing.

import { holdingName } from './board';
import { EVIL_DATA, type EvilData } from './data';
import type { EvilAction } from './day';
import { shadowOn } from './edges';
import { fill } from './ledger';
import { TEAR_CHOICES, unpackField, type CardField, type EvilModeBlock } from './schema';
import { beastLines, beastOf, choiceProblem, incursionsOn, openTear, staticLines, tearCard } from './tear';

export interface EdgesRow { label: string; sub: string; why: string | null; action: EvilAction; testid: string; sel: boolean }
export interface EdgesModel { title: string; lines: string[]; card: CardField[] | null; rows: EdgesRow[]; hint: string }

export function edgesModel(block: EvilModeBlock, sel: number, data: EvilData = EVIL_DATA): EdgesModel {
  const I = data.edges.incursions;
  const lines: string[] = [];
  const rows: Omit<EdgesRow, 'sel'>[] = [];
  let card: CardField[] | null = null;
  const t = incursionsOn(block, data) ? openTear(block) : null;
  if (incursionsOn(block, data)) {
    if (block.edges.static?.day === block.here.day) lines.push(I.static.title, ...staticLines(block, data));
    if (t) {
      const beast = beastOf(t.beastId);
      const h = block.district?.holdings.find((x) => x.id === t.holdingId);
      lines.push(fill(I.tear.rule, { rule: `${beast.ruleName}: ${beast.ruleText}` }), fill(I.tear.pays, { holding: h ? holdingName(h, data) : t.holdingId }));
      if (!t.choice) {
        for (const c of TEAR_CHOICES) {
          if (c === 'together' && choiceProblem(block, c, data) === I.tear.why.together) continue;
          rows.push({ label: I.tear.choices[c].label, sub: I.tear.choices[c].sub, why: choiceProblem(block, c, data), action: { type: 'tear', choice: c }, testid: `evil-edge-${c}` });
        }
      } else {
        lines.push(`The team ${I.tear.choices[t.choice].did}.`);
        const kept = block.edges.cards.find((x) => x.id === t.cardId);
        if (kept) card = kept.fields.map((f, i) => unpackField(f, i, data.ledger.fields));
      }
    } else if (block.edges.incursion) lines.push(fill(I.tear.incursion, { holding: 'the next battle' }));
    lines.push(...beastLines(block, data));
    if (block.edges.poipole) rows.push({ label: I.beast.plate, sub: `${block.edges.poipole.plates} so far.`, why: null, action: { type: 'plate' }, testid: 'evil-edge-plate' });
  }
  if (shadowOn(block, data)) {
    const S = data.edges.shadow;
    const s = block.edges.shadow!;
    if (block.team.corruption > 0) lines.push(fill(S.figure, { n: block.team.corruption }), S.never);
    for (const h of block.district?.holdings ?? []) {
      if ((h.kind !== 'wild' && h.kind !== 'alpha') || s.rigged.includes(h.id)) continue;
      const why = block.team.line !== 'whatever' ? S.rig.whatever : block.here.beat !== 'dispatch' ? S.rig.beat : null;
      rows.push({ label: fill(S.rig.label, { holding: holdingName(h, data) }), sub: `${S.rig.sub} ${S.rig.card}`, why, action: { type: 'rig', holdingId: h.id }, testid: `evil-edge-rig-${h.id}` });
    }
    if (block.base?.rooms.some((r) => r.type === 'lab')) {
      const keeper = s.labBy ? block.crew.find((c) => c.id === s.labBy) : undefined;
      if (!s.shut) rows.push({ label: S.lab.shut, sub: S.lab.shutSub, why: null, action: { type: 'labShut' }, testid: 'evil-edge-labshut' });
      if (keeper && !s.relieved.includes(keeper.id)) rows.push({ label: fill(S.lab.relieve, { name: keeper.name }), sub: S.lab.relieveSub, why: null, action: { type: 'labRelieve' }, testid: 'evil-edge-relieve' });
      rows.push({ label: S.lab.purify, sub: S.lab.purifySub, why: s.purified >= s.through ? S.lab.noneLeft : block.here.beat !== 'inPerson' ? I.tear.why.inPerson : null, action: { type: 'purify' }, testid: 'evil-edge-purify' });
    }
  }
  const at = rows.length ? Math.max(0, Math.min(rows.length - 1, sel)) : 0;
  const chosen = rows[at];
  if (!card && t && !t.choice && chosen?.action.type === 'tear') card = tearCard(block, chosen.action.choice, data);
  return {
    title: t ? I.tear.title : 'The edges',
    lines: lines.length ? lines : ['Nothing at the edges. The sky is the sky.'],
    card,
    rows: rows.map((r, i) => ({ ...r, sel: i === at })),
    hint: 'Up/Down picks; Enter confirms; Esc closes.',
  };
}

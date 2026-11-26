// DOMINION redesign R8: Call it in. A Favour someone owes the Boss (a Chair tag, chair.ts) can be spent once from the
// favour ledger: it pays back money and cools the HQ's Heat (courtRules.json `callIn`), and the tag is gone. Grudges
// and weekly deals can't be called in. No rolls.

import { cardById } from './chair';
import { face } from './chairScreens';
import { DOMINION_DATA } from './data';
import { addHeat, syncHeat } from './field';
import type { DominionBlock } from './schema';
import { fill } from './worldTurn';

const R = () => DOMINION_DATA.courtRules;

/** The name a tag goes by: the member, else the face of the last card that tagged them. */
function nameOf(b: DominionBlock, who: string): string {
  const m = b.members.find((x) => x.id === who);
  if (m) return m.name;
  for (const id of Object.keys(b.chair?.seen ?? {})) {
    const c = cardById(Number(id));
    if (c && c.who === who) return face(b, c, null).name;
  }
  return who;
}

export function callIn(block: DominionBlock, who: string): { ok: boolean; block: DominionBlock; notice: string | null } {
  const ch = block.chair;
  if (!ch?.open || ch.tags[who] !== 'favour') return { ok: false, block, notice: String(R().lines.noFavour) };
  const b = structuredClone(block);
  const C = R().callIn;
  delete b.chair!.tags[who];
  b.funds += C.funds;
  const hq = DOMINION_DATA.field.hq;
  const before = b.field.districts[hq]?.heat ?? 0;
  addHeat(b, hq, -C.heat);
  syncHeat(b);
  const cooled = before - (b.field.districts[hq]?.heat ?? 0);
  return { ok: true, block: b, notice: fill(String(R().lines.calledIn), { name: nameOf(b, who), funds: C.funds.toLocaleString('en-US'), heat: cooled }) };
}

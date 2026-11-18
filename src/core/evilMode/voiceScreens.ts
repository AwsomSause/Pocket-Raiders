// Evil Mode slice 18 screens: the Morning's Radio, paper and envelope, and the post page (P). Plain data for the New look
// (design Part 25a sections 2-3, Part 25b section 1, Part 29). Read only: every act goes through `step`.

import type { EvilAction } from './day';
import { EVIL_DATA, type EvilData } from './data';
import { fill } from './ledger';
import type { EvilModeBlock } from './schema';
import { margin, pieceChoices, pieceFrom, pieceText, todaysPaper, todaysPost, todaysRadio, VOICE, voiceOf } from './voice';

const W = (k: string): string => (VOICE.words as Record<string, unknown>)[k] as string;

/** The Morning's voice blocks: the Radio (unless it's off), the paper, and an envelope if one came. */
export function voiceBlocks(block: EvilModeBlock, data: EvilData = EVIL_DATA): { title: string; lines: string[] }[] {
  if (!VOICE.on) return [];
  const v = voiceOf(block);
  const out: { title: string; lines: string[] }[] = [];
  const radio = todaysRadio(block, data);
  if (radio) out.push({ title: W('radio'), lines: [v.radioOff ? W('radioIsOff') : radio, ...(v.flags.includes('hortenseRadio') && !v.radioOff && v.radioWasOff ? [W('radioBackOn')] : [])] });
  const paper = todaysPaper(block);
  if (paper) out.push({ title: W('paper'), lines: [paper] });
  const p = todaysPost(block);
  if (p) out.push({ title: W('page'), lines: [fill(block.base?.rooms.some((r) => r.type === 'listening') ? W('envelopeDesk') : W('envelope'), { from: pieceFrom(p) }), ...(p.steamed ? [W('steamed')] : [])] });
  return out;
}

export interface PostAction { code: string; label: string }
export interface PostModel {
  title: string;
  /** Today's piece: who from, the text once opened, the answers while unanswered. */
  today: null | { id: string; from: string; steamed: boolean; opened: boolean; text: string | null; answered: string | null; pinned: boolean };
  radio: string | null;
  paper: string | null;
  margin: string | null;
  drawer: { id: string; day: number; from: string; text: string; pinned: boolean }[];
  /** Every button, in order (Up/Down and Enter walk them; each is a tap target). */
  acts: PostAction[];
  empty: string;
}

export function postModel(block: EvilModeBlock, data: EvilData = EVIL_DATA): PostModel {
  const v = voiceOf(block);
  const p = todaysPost(block);
  const acts: PostAction[] = [];
  let today: PostModel['today'] = null;
  if (p) {
    const ch = pieceChoices(p);
    today = { id: p.id, from: pieceFrom(p), steamed: p.steamed, opened: p.opened, text: p.opened ? pieceText(p) : null, answered: p.answer !== null ? ch[p.answer]?.say ?? null : null, pinned: p.pinned };
    if (!p.opened) acts.push({ code: `open:${p.id}`, label: W('open') }, { code: `leave:${p.id}`, label: W('leave') });
    else {
      if (p.answer === null) ch.forEach((c, i) => acts.push({ code: `answer:${p.id}:${i}`, label: `${W('reply')}: ${c.say}` }));
      if (!p.pinned) acts.push({ code: `pin:${p.id}`, label: W('pin') });
    }
  }
  // Letters from earlier days, still unopened, can be opened from the drawer.
  for (const q of v.inbox.filter((x) => x.day !== null && x.day < block.here.day && !x.opened)) acts.push({ code: `open:${q.id}`, label: `${W('open')}: ${pieceFrom(q)} (Day ${q.day})` });
  if (block.here.beat === 'night' && !v.radioOff && !v.radioWasOff) acts.push({ code: 'radio:off', label: W('radioOff') });
  if (v.radioOff) acts.push({ code: 'radio:on', label: W('radioOn') });
  acts.push({ code: 'close', label: W('close') });
  const m = margin(block);
  return {
    title: W('page'),
    today,
    radio: v.radioOff ? W('radioIsOff') : todaysRadio(block, data),
    paper: todaysPaper(block),
    margin: m ? `${W('margin')} (${m.who}): ${m.text}` : null,
    drawer: v.inbox.filter((x) => x.day !== null && x.day < block.here.day).reverse().map((x) => ({ id: x.id, day: x.day!, from: pieceFrom(x), text: x.opened ? pieceText(x) : `(${W('unread')})`, pinned: x.pinned })),
    acts,
    empty: W('noPost'),
  };
}

/** A post-page button as an action (null for Close). */
export function postAction(code: string): EvilAction | null {
  const [k, id, i] = code.split(':');
  if (k === 'radio') return { type: 'radio', on: id === 'on' };
  if (k === 'open' || k === 'leave' || k === 'pin') return { type: 'postAct', id: id!, act: { what: k } };
  if (k === 'answer') return { type: 'postAct', id: id!, act: { what: 'answer', i: Number(i) } };
  return null;
}

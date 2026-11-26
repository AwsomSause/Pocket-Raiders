// DOMINION redesign R2 (HQ, pass 50 page `apps`): the applications desk as a talk scene. The applicant stands on the
// left, the crew member on the desk on the right, the calls on the right-hand list (hire, check the papers, send away,
// detain) and the applicant's last words in the text box with their tell. "Check the papers" opens the k5 paperwork
// (desk.ts), where the questions, Inspect and the stamps live. Plain data in from core/dominion/desk.ts deskModel.

import type { DeskModel } from '../../../../../core/dominion/desk';
import { bg, esc, keys, map, page, type R5Key, type R5Run } from './kit';
import './hq.css';

const act = (name: string, arg: string | number = ''): string => `data-act="${esc(name)}" data-arg="${esc(String(arg))}"`;

/** One call on the right: its label, the act it sends, a test id, and whether it can be taken now. */
export interface TalkCall { label: string; act: string; arg: string; testid: string; ok: boolean }

/** The talk scene's calls, in order (the mockup's three, and Detain after them). */
export function talkCalls(m: DeskModel): TalkCall[] {
  if (m.state !== 'open' || !m.a) return [];
  const first = m.a.name.split(' ')[0] ?? m.a.name;
  return [
    { label: m.rosterFull ? `Hire ${first} · barracks full` : `Hire ${first}`, act: 'deskStamp', arg: 'accept', testid: 'desk-stamp-accept', ok: !m.rosterFull },
    { label: m.fields.some((f) => f.checked) || m.questions.some((q) => q.asked) ? 'Check the papers again' : 'Check the papers', act: 'deskPapers', arg: '', testid: 'desk-papers', ok: true },
    { label: `Send ${first} away`, act: 'deskStamp', arg: 'reject', testid: 'desk-stamp-reject', ok: true },
    { label: 'Detain them', act: 'deskStamp', arg: 'detain', testid: 'desk-stamp-detain', ok: true },
  ];
}

export interface DeskTalkPics {
  /** The applicant, full height, and as a round face. */
  applicant(h: number): string;
  /** Who sits on the desk (the Auto-Checker, else the first of the crew): figure, name, colour. */
  clerk: { fig: string; name: string; colour: string } | null;
}

export function r5DeskTalk(m: DeskModel, at: number, pics: DeskTalkPics, run: R5Run, notice: string | null): string {
  const a = m.state === 'open' ? m.a : null;
  const calls = talkCalls(m);
  const left = a
    ? `<div class="act l" style="--pc:#3aa86a" data-testid="desk-applicant">${pics.applicant(250)}<span class="plate vs17"><b data-testid="desk-talk-name">${esc(a.name)}</b><em>${esc(`${a.cls} · ${a.homeShown}`)}</em></span></div>`
    : '';
  const c = pics.clerk;
  const right = c ? `<div class="act r" style="--pc:${c.colour}">${c.fig}<span class="plate vs17"><b>${esc(c.name)}</b><em>On the desk</em></span></div>` : '';
  const chs = calls.length
    ? `<nav class="chs" data-testid="desk-calls">${map(calls, (x, i) => `<button class="ch${i === at ? ' on' : ''}" ${act(x.act, x.arg)} data-testid="${x.testid}" style="--i:${i};--d:${i * 90}ms${x.ok ? '' : ';opacity:.55'}"><kbd>${i + 1}</kbd><b>${esc(x.label)}</b></button>`)}</nav>`
    : '';
  // The text box: a notice first, else the applicant's last reply (with its tell), else why they want in.
  const l = a ? m.last : null;
  const think = l?.from === 'thinking';
  const closed = m.closedLine + (m.doneToday.length ? ` Today: ${m.doneToday.map((x) => `${x.name} (${x.verdict})`).join(', ')}.` : '');
  const line = !a ? (notice ? `${notice} ${closed}` : closed) : notice ?? (l ? (think ? l.reply : `“${l.reply}”`) : `“${a.reason}”`);
  const lineId = !a ? 'desk-closed' : notice ? 'desk-notice' : l ? 'desk-reply' : 'desk-talk-line';
  const from = a && !notice && l ? ` data-from="${l.from}"` : '';
  const spk = a ? `<span class="spk6" style="--pc:#3aa86a"><span class="face" data-nocheck="" style="--c:#3aa86a;width:62px;height:62px">${pics.applicant(155)}</span><b>Applicant</b></span>`
    : c ? `<span class="spk6" style="--pc:${c.colour}"><b>${esc(c.name)}</b></span>` : '';
  const chips = a && l && !think && !notice
    ? `<span class="tb-chips"><i data-testid="desk-tell" data-tell="${l.tell.id}" style="color:${l.tell.c}">${esc(l.tell.label)}</i>${l.chip ? `<i data-testid="desk-chip">${esc(l.chip)}</i>` : ''}</span>`
    : `<span class="tb-chips"><i>${esc(`Day ${m.day}${a ? ` · ${m.place}` : ''}`)}</i></span>`;
  const box = `<section class="tbox" data-m="box">${spk}<p data-testid="${lineId}"${from}>${esc(line)}</p>${chips}<i class="more">▼</i></section>`;
  const ks: R5Key[] = a ? [['↑↓', 'choose'], ['Enter', 'your call'], ['Tab', 'papers', 'deskPapers'], ['Esc', 'HQ', 'back']] : [['Esc', 'HQ', 'back']];
  return page({ id: 'apps', g: 'HQ', kind: 'scene sm-talk many', body: `${bg('hq', 'HQ', run)}\n  <span data-testid="desk-sub" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Day ${m.day}${a ? ` · ${m.place}` : ''}</span>${left}${right}${chs}\n  ${box}\n  ${keys(ks, 'HQ', run)}` });
}

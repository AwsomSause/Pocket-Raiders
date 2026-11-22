// DOMINION redesign R8: the Chair at pass 50 of plans/evil-mode-rework/redesign-50. A visitor at the Chair (mockup
// `chair`, kind ch19), Hand it off (`handoff`, a card grid), the Tally (`tally`, a result page), the Night (`night`,
// kind nt15), the waiting room (`queue`, kind q19) and the favour ledger (`favours`, kind fv19). Live data in from
// core/dominion/chairScreens.ts and r8Pages.ts; ChairController keeps the cursors and does the acts.

import './r8.css';
import type { Chip, HandModel, TallyModel, VisitorModel } from '../../../../../core/dominion/chairScreens';
import type { FavourRow, FavoursModel, NightRow, QueueModel } from '../../../../../core/dominion/r8Pages';
import { esc, faceOf, foot, frame, go, keys, map, page, bg, pn, SP, spr, type R5Cta, type R5Key, type R5Run } from './kit';

/** How the scene draws people: a look (png, trainer atlas or `mon:species`) at a height, a round face, a Pokémon. */
export interface R5Pics {
  body(look: string, h: number): string;
  face(look: string, sz: number): string;
  mon(species: string, h: number): string;
}

/** Straight quote pairs as curly ones, and a quoted line that already ends a sentence keeps one full stop. */
const smart = (t: string): string => t.replace(/([.!?])"\./g, '$1"').replace(/"([^"]*)"/g, '“$1”');
/** A spoken line in curly quotes, unless it already carries its own. */
const quoted = (t: string): string => (/["“]/.test(t) ? smart(t) : `“${t}”`);
const said = (t: string): string => (t.startsWith('"') ? `“${t.replace(/^"|"$/g, '')}”` : t);
const chipText = (cs: readonly Chip[]): string => cs.map((c) => c.text).join(' · ');
/** The answer's lean word (the mockup's coloured pill): the number it moves most. */
function lean(cs: readonly Chip[]): [string, string] {
  const t = chipText(cs);
  if (/✊/.test(t)) return ['dread', 'Dread'];
  if (/♥/.test(t)) return ['regard', 'Regard'];
  if (/₽/.test(t)) return ['', 'Money'];
  if (/Heat/.test(t)) return ['', 'Heat'];
  return ['', cs.length ? 'Other' : 'Quiet'];
}
const ICONS = ['g-town-map', 'g-dark-gem'];

/** The Chair settings (length, numbers, speed): a panel over the page (O). */
function optsCard(o: VisitorModel['opts']): string {
  const rows: [string, string, string, string][] = [
    ['length', 'Chair length', o.length, 'Off skips the Chair. Short brings fewer visitors, Long brings more.'],
    ['numbers', 'Chair numbers', o.numbers, 'Arrows show which way a number moves. Exact shows how much.'],
    ['speed', 'Chair speed', o.speed, 'Fast drops the walk-in and the reactions.'],
  ];
  return `<i class="dim8" data-nocheck=""></i><section class="pn op8" data-testid="dom-chair-opts"><h3><i>Chair settings</i></h3>${map(rows, ([k, l, v, why], i) => `<button class="row" ${go('chairOpt', k)} data-testid="dom-chair-opt-${k}" style="--i:${i};--d:${i * 60}ms"><kbd>${i + 1}</kbd><span class="row-t"><b>${esc(l)}</b><em>${esc(why)}</em></span><b class="tag">${esc(v[0]!.toUpperCase() + v.slice(1))}</b></button>`)}<p class="nt8"><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> change · <kbd>O</kbd> close</p></section>`;
}

// ---------- a visitor at the Chair (mockup `chair`) ----------

export function r5Visitor(m: VisitorModel, x: { pics: R5Pics; team: string; notice: string | null; opts: boolean; queue: number }, run: R5Run): string {
  const v = m.visitor;
  const fig = v.look.startsWith('mon:') ? x.pics.mon(v.look.slice(4), 170) : x.pics.body(v.look, 250);
  const role = `${v.role}${v.tag ? ` · came with a ${v.tag === 'grudge' ? 'Grudge' : 'Favour'}` : ''}`;
  const head = `Visitor ${m.sub}${m.openHouse ? ' · Open House' : ''}${m.crisis ? ' · Crisis' : ''}`;
  const done = !!m.result;
  const ans = map(m.answers, (a, i) => {
    const [lc, lw] = lean(a.chips);
    return `<button class="evc-c a19${a.on && !done ? ' on' : ''}" ${go('court', i)} data-over="courtOver" data-testid="dom-chair-a${i}" title="${esc(a.does)}" style="--d:${400 + i * 120}ms${done ? ';opacity:.5' : ''}">${SP(ICONS[i]!, 30)}<span class="row-t"><b>${esc(a.label)}</b><em>${esc(chipText(a.chips) || a.does)}</em></span><span class="evc-r"><kbd>${i + 1}</kbd><i class="ln19 ${lc}">${esc(lw)}</i></span></button>`;
  });
  const hand = m.hand.can && !done
    ? `<button class="evc-c a19${m.hand.on ? ' on' : ''}" ${go('court', 2)} data-over="courtOver" data-testid="dom-chair-hand" style="--d:640ms">${SP('g-idcard', 30)}<span class="row-t"><b>Hand it off · ${m.hand.left} left tonight</b><em>${esc(m.whisper ? `${m.whisper.name} answers for you` : 'A crew member answers for you')}</em></span><span class="evc-r"><kbd>3</kbd><i class="ln19 staff">Staff</i></span></button>`
    : `<button class="evc-c a19" data-testid="dom-chair-hand" style="--d:640ms;opacity:.5">${SP('g-idcard', 30)}<span class="row-t"><b>Hand it off</b><em>${esc(m.crisis ? 'Not for a crisis' : m.hand.left ? 'Nobody can take this one' : 'Used tonight')}</em></span><span class="evc-r"><i class="ln19 staff">Staff</i></span></button>`;
  const bubble = done
    ? `<section class="ask19" data-m="box"><small>What happened</small><p data-testid="dom-chair-result">${esc(m.result!.join(' '))}</p></section>`
    : `<section class="ask19" data-m="box"><small data-testid="dom-chair">${esc(head)}</small><p data-testid="dom-chair-ask">${esc(said(m.ask))}</p></section>`;
  const whisper = m.whisper ? `<div class="dale19" data-nocheck="">${x.pics.body(m.whisper.look, 150).replace('class="px', 'class="px flip')}</div>${done ? '' : `<p class="wh8" data-testid="dom-chair-whisper"><b>${esc(m.whisper.name)}</b> ${esc(smart(m.whisper.text))}</p>`}` : '';
  const lead = m.lead ? x.pics.mon(m.lead.species, 96) : '';
  const react = done && m.lead?.react && m.opts.speed !== 'fast' ? `<p class="re8" data-testid="dom-chair-react">${esc(m.lead.react.replace('{mon}', m.lead.species))}</p>` : '';
  const ks: R5Key[] = done ? [['Enter', 'next', 'toNight']] : [['1-3', 'answer'], ['Enter', 'seal it'], ['V', 'queue', 'r8Queue'], ...(m.canClose ? [['C', 'close doors', 'closeDoors', 'dom-chair-close'] as R5Key] : []), ['Q', 'Wheel']];
  return page({ id: 'chair', g: 'The Chair', kind: 'ch19', body: `${bg('chair', 'The Chair', run)}<div class="lamp19" data-nocheck=""></div>
  <div class="vis19" data-nocheck="">${fig}</div>
  <div class="desk19" data-nocheck=""><span class="per19">${lead}</span><span class="led19">${SP('g-journal', 40)}</span><span class="cig19"></span><b class="np19" title="${esc(m.chair)}">${esc(x.team.toUpperCase())} · THE BOSS</b></div>
  <div class="plq19" data-testid="dom-chair-visitor"><b>${esc(v.name.toUpperCase())}</b><em>${esc(role)}</em></div>
  ${bubble}
  <nav class="ans19" data-testid="dom-chair-answers">${ans}${hand}</nav>
  ${whisper}${react}
  ${x.notice ? `<p class="nc8" ${go('dismiss')} data-testid="dom-notice">${esc(x.notice)}</p>` : ''}
  ${keys(ks, 'The Chair', run, { testid: 'dom-chair-top' })}${x.opts ? optsCard(m.opts) : ''}` });
}

// ---------- Hand it off (mockup `handoff`) ----------

const LEAN_C: Record<string, string> = { Money: '#e0901c', Regard: '#6f9a3a', Dread: '#25b3c7' };

export function r5Hand(m: HandModel, x: { pics: R5Pics; notice: string | null }, run: R5Run): string {
  const at = Math.max(0, m.rows.findIndex((r) => r.on));
  const n = Math.min(4, m.rows.length);
  const from = Math.max(0, Math.min(m.rows.length - n, at - 1));
  const cells = map(m.rows.slice(from, from + n), (r, j) => {
    const i = from + j;
    const stars = '★'.repeat(Math.max(1, Math.min(3, Math.round(r.loyalty / 34) + 1)));
    const em = r.can ? `${r.traits[0] ?? r.rank} · leans ${r.lean}` : `${r.rank} · can’t take this one`;
    return `<button class="cell${r.on ? ' on' : ''}" ${go('handPick', i)} data-over="handOver" data-testid="dom-hand-${i}" style="--pc:${LEAN_C[r.lean] ?? '#a25fe0'};--i:${j};--d:${j * 50}ms${r.can ? '' : ';filter:grayscale(1);opacity:.6'}" title="${esc(r.likely ? `Will likely pick “${r.likely}”` : '')}"><i class="rr14">${stars}</i><span class="cs">${x.pics.body(r.look, 64)}</span><b>${esc(r.name)}</b><em>${esc(em)}</em>${r.why ? `<i class="tag">${esc(r.why)}</i>` : ''}</button>`;
  });
  const body = pn('g-main', `Who answers ${esc(m.visitor.name)} for you?`, `<div class="cells n${Math.max(3, n)}" data-testid="dom-hand">${cells}</div>`, 'panel')
    + (x.notice ? `<p class="nc8" data-testid="dom-notice">${esc(x.notice)}</p>` : '');
  return frame({ id: 'handoff', g: 'The Chair', kind: 'grid g-cards', bg: 'hq', top: { title: 'Hand it off', icon: 'g-card-key' }, body, run, keys: [['Enter', 'Choose'], ['Esc', 'Back'], ['Q', 'Wheel']] });
}

// ---------- the Tally (mockup `tally`) ----------

export function r5Tally(m: TallyModel, x: { who: { name: string; pic: string; colour: string } | null }, run: R5Run): string {
  const funds = m.net.find((c) => c.text.includes('₽') && !c.text.endsWith('/wk'));
  const big = `NET ${funds ? funds.text : '₽0'}`;
  const rest = m.net.filter((c) => c !== funds).map((c) => c.text).join(' · ');
  const rows = map(m.rows.slice(-5), (r, i) => {
    const up = r.chips.reduce((s, c) => s + (c.cls === 'up' ? 1 : c.cls === 'dn' ? -1 : 0), 0) >= 0;
    return `<div class="chg ${up ? 'up' : 'dn'}" style="--i:${i};--d:${i * 110}ms" data-testid="dom-tally-row"><i>${up ? '▲' : '▼'}</i><b>${esc(r.face.name)}</b><em>${esc([r.answer, ...(r.face.tag ? [r.face.tag === 'grudge' ? 'Grudge' : 'Favour'] : []), chipText(r.chips)].filter(Boolean).join(' · '))}</em></div>`;
  }) || '<div class="chg"><i>·</i><b>Nobody came</b><em>The doors were closed early.</em></div>';
  const coins = map([0, 26, 52, 78, 104, 130, 156, 182, 208, 234, 260, 286, 312, 338], (a, i) => `<i style="--a:${a}deg;--r:${120 + (i % 4) * 40}px;--d:${(i % 5) * 60}ms"></i>`);
  const body = `<ol class="rail7" data-m="rail"><li class="on"><i>1</i>The take</li><li><i>2</i>Visitors</li><li><i>3</i>The Night</li></ol>
  <div class="r-l r7"><small>The take</small><b class="r-big${big.length > 9 ? ' long' : ''}" data-m="funds" data-testid="dom-tally-net">${esc(big)}</b><p data-testid="dom-tally">Day ${m.day} · ${m.count} visitor${m.count === 1 ? '' : 's'}${m.back ? ' · someone will be back' : ''}</p>${rest ? `<p class="nt8">${esc(rest)}</p>` : ''}<div class="coins" data-nocheck="">${coins}</div><div class="stamp" data-m="ttl">THE TALLY</div></div>
  ${pn('r-lines', 'What changed', rows, 'panel')}`;
  return frame({ id: 'tally', g: 'The Chair', kind: 'res', bg: 'gold', top: { title: 'The Tally', icon: 'g-card-key' }, body, run, noTabs: true,
    who: x.who ? { name: x.who.name, pic: x.who.pic, colour: x.who.colour } : null, line: quoted(m.lock), ctas: [['To the Night', 'toNight', '', 'dom-tally-night']], keys: [['Enter', 'next']] });
}

// ---------- the Night (mockup `night`) ----------

/** 26 towers, as the mockup lays them out. */
const CITY = Array.from({ length: 26 }, (_, i) => `<i style="--x:${i * 37}px;--h:${50 + ((i * 53) % 120)}px;--d:${(i * 137) % 1600}ms"></i>`).join('');

export function r5Night(x: { day: number; phase: string; rows: readonly NightRow[]; says: string; who: { name: string; pic: string; colour: string } | null; next: string; pics: R5Pics; notice: string | null }, run: R5Run): string {
  const rows = map(x.rows, (r, i) => `<div class="nfx" style="--d:${600 + i * 220}ms">${faceOf(x.pics.face(r.look, 40), 40, '#3f7fd9')}<span><b>${esc(r.task)}</b><em>${esc(`${r.name} · ${r.does}`)}</em></span></div>`);
  const sr = `<span data-testid="dom-phase" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">${esc(x.phase)}</span>`;
  const ctas: R5Cta[] = [[x.next, 'next', '', 'dom-next']];
  return page({ id: 'night', g: 'The Chair', kind: 'nt15', body: `${bg('roof', 'The Chair', run)}<div class="city15" data-nocheck="">${CITY}</div><i class="moon15" data-nocheck=""></i>
  <div class="nh15" data-m="ttl"><small>Day ${x.day} · Night</small><b>NIGHT FALLS</b><em>The night shift gets to work</em>${sr}</div>
  <div class="ns15" data-testid="r8-night-rows">${rows}</div>
  ${foot(x.notice ? null : x.who, x.notice ?? quoted(x.says), ctas, 'The Chair', run, { testid: x.notice ? 'dom-notice' : 'dom-says', lineAct: x.notice ? 'dismiss' : undefined })}
  ${keys([['Enter', 'sleep'], ['Esc', 'stay up', 'r8StayUp']], 'The Chair', run)}` });
}

// ---------- the waiting room (mockup `queue`) ----------

const MOOD_C: Record<string, string> = { Grudge: '#9a4fd0', Favour: '#4caf50', Crisis: '#e0294a', Money: '#c9a24a', 'The law': '#3a6fd0', Rival: '#9a4fd0', Hero: '#ef3b2c', Gyms: '#4caf50' };

export function r5Queue(m: QueueModel, x: { at: number; pics: R5Pics; who: { name: string; pic: string; colour: string } | null; team: string }, run: R5Run): string {
  const n = Math.min(3, m.rows.length);
  const from = Math.max(0, Math.min(m.rows.length - n, x.at - 1));
  const vq = map(m.rows.slice(from, from + n), (r, j) => {
    const i = from + j;
    const fig = r.face.look.startsWith('mon:') ? x.pics.mon(r.face.look.slice(4), 130) : x.pics.body(r.face.look, 170);
    return `<button class="vq${i === x.at ? ' on' : ''}" ${go('r8QueuePick', i)} data-testid="r8-queue-${i}" style="--pc:${MOOD_C[r.mood] ?? '#c9a24a'};--d:${j * 140}ms"><i class="num">${i + 1}</i><span class="vs">${fig}</span><b>${esc(r.face.name)}</b><em>${esc(r.face.role)}</em><span class="want">${esc(r.wants)}</span><i class="mood">${esc(r.door ? `${r.mood} · at the door` : r.mood)}</i></button>`;
  });
  const first = m.rows[0]?.face.name ?? '';
  const line = m.rows.length ? `“${first} first, Boss. ${m.left > 1 ? `${m.left - 1} more wait${m.left === 2 ? 's' : ''} after.` : 'Nobody else tonight.'}”` : '“The bench is empty, Boss.”';
  return frame({ id: 'queue', g: 'The Chair', kind: 'q19', bg: 'chair', top: { title: 'Waiting room', icon: 'g-card-key', sub: `Day ${m.day} · ${m.left} visitor${m.left === 1 ? '' : 's'}`, crumb: ['HQ', 'hq'] },
    body: `<div class="bench19" data-m="panel" data-testid="r8-queue">${vq}</div>`, run,
    who: x.who, line, ctas: [['Favour ledger', 'r8Favours', '', 'r8-favours-open'], ['Call them in', 'r8QueueClose', '', 'r8-queue-close']], keys: [['←→', 'visitor'], ['Enter', 'call in'], ['F', 'favours']] });
}

// ---------- the favour ledger (mockup `favours`) ----------

function fv(r: FavourRow, i: number, pics: R5Pics): string {
  const cls = r.size === 'Grudge' ? 'grudge' : r.size === 'Deal' ? 'big' : 'small';
  return `<div class="fv" style="--i:${i};--d:${i * 60}ms" data-testid="r8-favour">${faceOf(pics.face(r.look, 38), 38, r.colour)}<span class="row-t"><b>${esc(r.name)}</b><em>${esc(r.why)}</em></span><i class="sz ${cls}">${esc(r.size)}</i></div>`;
}

export function r5Favours(m: FavoursModel, x: { pics: R5Pics; who: { name: string; pic: string; colour: string } | null }, run: R5Run): string {
  const none = (t: string): string => `<div class="fv"><span class="row-t"><b>Nobody yet</b><em>${esc(t)}</em></span></div>`;
  const body = pn('fo19', 'They owe you', map(m.owe.slice(0, 5), (r, i) => fv(r, i, x.pics)) || none('Grant a favour at the Chair and they will owe you.'), 'panel')
    + pn('fd19', 'You owe them', map(m.owed.slice(0, 5), (r, i) => fv(r, i, x.pics)) || none('Nobody holds a Grudge. Yet.'), 'det');
  const big = m.owe[0];
  const line = big ? `“${big.name} owes us. Save it for when the Hero comes.”` : m.owed[0] ? `“${m.owed[0].name} won’t forget, Boss. Watch your back.”` : '“Nobody owes anybody yet, Boss.”';
  return frame({ id: 'favours', g: 'The Chair', kind: 'fv19', bg: 'chair', top: { title: 'Favour ledger', icon: 'g-card-key', sub: 'Who owes whom', crumb: ['HQ', 'hq'] }, body, run,
    who: x.who, line, ctas: [['Back', 'r8FavoursBack', '', 'r8-favours-back']], keys: [['↑↓', 'favour'], ['Esc', 'back']] });
}

export { spr };

// DOMINION redesign R3 (pass 50): The Day, part two. The Morning report (mockup `morning`), Assign a task (`assign`),
// the morning paper (`paper`), the Evening wrap-up (`evening`) and the Empire Ledger (`ledger`). Live data in, HTML out;
// the controllers keep the cursors and do the acts (D3, D6, D29 and D30's, unchanged). Old data-testids are kept.

import type { AssignModel } from '../../../../../core/dominion/assignScreen';
import type { MorningModel, TalkModel } from '../../../../../core/dominion/crewScreens';
import type { LedgerModel } from '../../../../../core/dominion/ledgerScreens';
import type { PaperModel } from '../../../../../core/dominion/moments';
import { esc, faceOf, go, map, NAV, pn, rep, SP, st, type R5Cta, type R5Key, type R5Run, type R5Speaker } from './kit';
import { frame } from './day';

/** Where a row of the Morning report goes, and its picture: [sprite, tag, page]. */
const ALERT: Record<string, [string, string, string]> = {
  crew: ['g-idcard', 'Crew', 'roster'], money: ['g-amulet-coin', 'Money', 'ledger'], rival: ['t-giovanni', 'Rival', 'rival'],
  police: ['t-policeman', 'Police', ''], hero: ['t-red', 'Hero', 'herotrack'], world: ['g-journal', 'News', 'papers'],
};
const ico = (k: string): string => (k.startsWith('t-') || k.startsWith('c-') ? SP(k, 40, 'ico') : SP(k, 30, 'ico'));

/** Marks the `at`-th choice in the text box as the one Enter takes (the kit marks the last). */
function onAt(html: string, at: number): string {
  let i = 0;
  return html.replace(/class="cta rc13( on)?"/g, () => `class="cta rc13${i++ === at ? ' on' : ''}"`);
}

/** A crew member wants a word (D3's talk): their line in the text box, the answers as its choices. */
export interface R5Talk { t: TalkModel; at: number; pic: string; colour: string }

// ---------- the Morning report (mockup `morning`) ----------

/** A report line as the mockup's title and line: the first sentence, then the rest (or nothing: the time goes there). */
export function split(text: string): [string, string | null] {
  const m = /^(.+?)[.!?]\s+(.+)$/.exec(text);
  return m && m[1]!.length <= 34 ? [m[1]!, m[2]!] : [text.replace(/\.$/, ''), null];
}

export interface R5MorningExtras {
  /** Face pictures of the crew, in the strip's order. */
  faces: readonly string[];
  /** The selected member, full length, for the plinth. */
  pic: string;
  colour: string;
  /** The row under the cursor (-1: none, Enter starts the day). */
  at: number;
  talk: R5Talk | null;
  notice: string | null;
  /** Actions today (Day phase) and the Heat word, for the Today lines. */
  today: readonly string[];
}

export function r5Morning(m: MorningModel, x: R5MorningExtras, run: R5Run): string {
  const all = m.alerts.length ? m.alerts : [{ kind: 'world' as const, time: 'overnight', text: 'A quiet night.' }];
  const rows = all.slice(0, x.talk || x.notice ? 3 : 4);
  const items = map(rows, (a, i) => {
    const [k, tag, page] = ALERT[a.kind] ?? ALERT.world!;
    return `<button class="row${i === x.at ? ' on' : ''}" ${page ? go(NAV, page) : ''} ${st(i)}>${ico(k)}<span class="row-t"><b>${esc(split(a.text)[0])}</b><em>${esc(split(a.text)[1] ?? a.time)}</em></span><i class="tag">${esc(a.kind === 'rival' ? m.rivalTag : tag)}</i></button>`;
  });
  const badge = `<button class="row bdg50${m.badge.hot ? ' hot' : ''}" ${go(NAV, 'rival')} ${st(rows.length)}>${SP('t-giovanni', 40, 'ico')}<span class="row-t"><b data-testid="dom-badge">${esc(m.badge.label)}: ${esc(m.badge.word)}</b><em>${m.more + all.length - rows.length ? `+${m.more + all.length - rows.length} more in the Night Report` : 'The Rival File (R)'}</em></span><i class="tag">${esc(m.rivalTag)}</i></button>`;
  const n = rows.length + 1;
  const list = pn(`l-main${n > 5 ? ' tight' : ''}`, `Day ${m.top.day.replace(/\D+/g, '')} · Morning · ${all.length + m.more} thing${all.length + m.more === 1 ? '' : 's'} need${all.length + m.more === 1 ? 's' : ''} you`, items + badge, 'panel').replace('<section ', '<section data-testid="dom-morning-report" ');
  const i = m.member;
  const strip = `<div class="cs50" data-testid="dom-strip">${map(m.strip, (s, k) => `<button class="${s.sel ? 'on' : ''}${s.out ? ' out' : ''}" ${go('crewMember', k)} data-testid="dom-strip-${s.id}" title="${esc(s.name)} · ${esc(s.task)}">${faceOf(x.faces[k] ?? '', 28, x.colour)}${s.sel ? `<em>${esc(s.task)}</em>` : ''}</button>`)}</div>`;
  const det = pn('l-det', '', `<div class="plinth">${x.pic}</div><b class="det-t" data-testid="dom-info-name">${esc(i.name.toUpperCase())}</b>${map(x.today, (l) => `<p>${esc(l)}</p>`)}${m.where ? `<p class="wh50" data-testid="dom-where">${esc(i.name)} works in <b>${esc(m.where)}</b> <kbd>P</kbd></p>` : ''}${strip}<div class="cb50"><button class="cta" ${go('morningAssign')} data-testid="dom-morning-assign">Assign tasks</button>${x.talk ? '' : `<button class="cta on" ${go('next')} data-testid="dom-next">${m.phase === 'morning' ? 'Start the day' : 'Done'}</button>`}</div>`, 'det').replace('<section ', '<section data-testid="dom-assign" ');
  const talk = x.talk;
  const box = talk
    ? { who: { name: talk.t.name, pic: talk.pic, colour: talk.colour } as R5Speaker, line: talk.t.text, ctas: talk.t.choices.map((c, k) => [c, 'talk', k, `dom-talk-${k}`] as R5Cta), footOpts: { testid: 'dom-talk' } }
    : x.notice ? { who: null, line: x.notice, ctas: [] as R5Cta[], footOpts: { testid: 'dom-notice', lineAct: 'dismiss' } } : null;
  const html = frame({
    id: 'morning', g: 'The Day', kind: 'list', bg: 'hq', run,
    top: { title: 'Morning report', crumb: null },
    body: list + '\n  ' + det,
    ...(box ?? {}),
    keys: [['◀▶', 'crew'], ['↑↓', 'report'], ['M', 'assign'], ['Enter', 'start the day']],
  });
  return talk ? onAt(html, talk.at) : html;
}

// ---------- Assign a task (mockup `assign`) ----------

export function r5Assign(m: AssignModel, pic: string, faces: Record<string, string>, colour: string, notice: string | null, run: R5Run): string {
  const i = m.member;
  const rows = map(m.cards, (c, k) => {
    const tag = c.locked ? '—' : c.odds === 'sure' ? 'Safe' : c.odds;
    const flag = c.current ? ' · on it' : c.best ? ' · best fit' : '';
    return `<button class="row${c.on ? ' on' : ''}${c.locked ? ' no' : ''}" ${go('asTask', k)} data-over="asOver" ${st(k)} data-testid="dom-as-task-${c.id}" title="${esc(c.locked ?? '')}">${c.icon ? SP(c.icon, 30, 'ico') : SP('g-card-key', 30, 'ico')}<span class="row-t"><b>${esc(c.label)}${c.current ? ' <u class="on50">ON IT</u>' : c.best ? ' <u>BEST FIT</u>' : ''}</b><em>${esc(c.locked ?? `${c.uses} · ${c.pay}, ${c.heat}`)}${esc(c.locked ? '' : flag ? '' : '')}</em></span><i class="tag${/^\d/.test(tag) ? ' num' : ''}" data-testid="dom-as-odds-${c.id}">${esc(tag)}</i></button>`;
  });
  const head = `${i.name} · ${i.rank} · ${i.out ?? (m.cards.find((c) => c.current)?.label ?? 'free today')}`;
  const list = pn(`l-main${m.cards.length > 5 ? ' tight' : ''}`, head, rows, 'panel').replace('<section ', '<section data-testid="dom-as-grid" ');
  const others = `<div class="cs50" data-testid="dom-as-others">${map(m.others.slice(0, 5), (o) => `<button ${go('asMember', o.i)} data-testid="dom-as-other-${o.id}" title="${esc(o.name)}">${faceOf(faces[o.id] ?? '', 30, colour)}<em>${esc(o.name)}</em></button>`)}</div>`;
  const lines = [`${i.rank} · ${m.member.role}`, `Loyalty ${i.loyalty} · Skill ${i.skill} · ${i.stat.label} ${i.stat.value}`];
  const det = pn('l-det', '', `<div class="plinth" data-testid="dom-as-pic">${pic}</div><b class="det-t" data-testid="dom-as-name">${esc(i.name.toUpperCase())}</b><p data-testid="dom-as-line">“${esc(i.line)}”</p>${map(lines, (l) => `<p>${esc(l)}</p>`)}${others}<button class="cta on" ${go('asGive')} data-testid="dom-as-give">${esc(m.cta)}</button>`, 'det').replace('<section ', '<section data-testid="dom-as-member" ');
  const more = `<span ${go('asAll')} data-testid="dom-as-more"><kbd>M</kbd>${m.all ? 'Quick six' : 'More…'}</span>${m.where ? `<span ${go('asWhere')} data-testid="dom-as-where"><kbd>P</kbd>${esc(m.where)}</span>` : ''}${m.pages > 1 ? `<span><kbd>▲▼</kbd><b data-testid="dom-as-page">${m.page + 1}/${m.pages}</b></span>` : ''}`;
  return frame({
    id: 'assign', g: 'The Day', kind: 'list', bg: 'hq', run,
    top: { title: 'Assign a task', crumb: null },
    body: list + '\n  ' + det,
    ...(notice ? { who: null, line: notice, footOpts: { testid: 'dom-notice', lineAct: 'dismiss' } } : {}),
    keys: [['Enter', 'give'], ['Esc', 'back']],
    keysOpts: { pre: more },
  });
}

// ---------- the morning paper (mockup `paper`) ----------

const STARS = (n: number): string => `${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i>`;

export function r5Paper(m: PaperModel, photo: string, glance: readonly [string, string][], run: R5Run): string {
  const sheet = `<section class="sheet" data-m="panel" data-testid="dom-paper"><div class="mast" data-m="ttl" data-testid="dom-paper-name">${esc(m.masthead)}</div><p class="dl50"><span data-testid="dom-paper-date">${esc(m.dateline[0])}</span><span>${esc(m.dateline[1])}</span><span>${esc(m.dateline[2])}</span></p><h2 data-testid="dom-paper-head">${esc(m.head)}</h2><p class="sub">${esc(m.deck)}</p><div class="sh-b"><div class="photo" data-testid="dom-paper-photo">${photo}</div><div class="cols"><p data-testid="dom-paper-column">${esc(m.column)}${m.rotom ? ` <b data-testid="dom-paper-rotom">✦ ${esc(m.rotom)}</b>` : ''}</p>${map(m.side, (s, i) => `<p data-testid="dom-paper-side-${i}"><b>${esc(s.head)}.</b> ${esc(s.body)}</p>`)}</div></div></section>`;
  const parts = map(m.rows, (r, i) => `<div class="part" ${st(i)}><span>${esc(r.label)}</span><b class="${r.stars !== undefined ? 'st50' : r.cls === 'dn' ? 'dn50' : ''}">${r.stars !== undefined ? STARS(r.stars) : esc(r.d)}</b></div>`);
  const wanted = `<div class="part wt50" data-testid="dom-paper-wanted"><span>${esc(m.wanted.title)} · ${esc(m.wanted.who)}</span><b data-testid="dom-paper-bounty">${esc(m.wanted.bounty)}</b><em>${esc(m.wanted.by)}</em></div>`;
  const top = map(glance, ([k, v], i) => `<div class="part" ${st(i)}><span>${esc(k)}</span><b>${esc(v)}</b></div>`);
  const side = pn('p-side', 'At a glance', `${top}<div data-testid="dom-paper-news">${parts}${m.rows.length < 2 ? `<p class="nr50">${esc(m.noRows)}</p>` : ''}</div>${wanted}`, 'det');
  return frame({
    id: 'paper', g: 'The Day', kind: 'paper', bg: 'hq', run,
    top: { title: 'The morning paper', crumb: null },
    body: sheet + '\n  ' + side,
    keys: [['Enter', 'turn the page', 'paperFold', 'dom-paper-fold'], ['Esc', 'back', 'paperFold']],
  });
}

// ---------- the Evening wrap-up (mockup `evening`) ----------

export interface R5Evening {
  day: number;
  take: string;
  sub: string;
  lines: readonly { who: string; what: string; up: boolean }[];
  clip: { mast: string; head: string; note: string } | null;
  line: string;
  who: R5Speaker | null;
}

export function r5Evening(e: R5Evening, run: R5Run): string {
  const coins = rep(14, (i) => `<i style="--a:${i * 26}deg;--r:${120 + (i % 4) * 40}px;--d:${(i % 5) * 60}ms"></i>`);
  const left = `<div class="r-l"><small>The take</small><b class="r-big" data-m="funds" data-testid="dom-eve-take">${esc(e.take)}</b><p>${esc(e.sub)}</p><div class="coins" data-nocheck="">${coins}</div><div class="stamp" data-m="ttl">DAY ${e.day} DONE</div></div>`;
  const lines = pn('r-lines', 'What changed', e.lines.length ? map(e.lines, (l, i) => `<div class="chg ${l.up ? 'up' : 'dn'}" style="--i:${i};--d:${i * 110}ms"><i>${l.up ? '▲' : '▼'}</i><b>${esc(l.who)}</b><em>${esc(l.what)}</em></div>`) : '<div class="chg"><i>·</i><b>A quiet day</b><em>No jobs today.</em></div>', 'panel').replace('<section ', '<section data-testid="dom-eve-lines" ');
  const clip = e.clip ? `<div class="clip50"><small>${esc(e.clip.mast)}</small><b>${esc(e.clip.head)}</b><em>${esc(e.clip.note)}</em></div>` : '';
  return frame({
    id: 'evening', g: 'The Day', kind: 'res', bg: 'gold', run, noTabs: true,
    top: { title: 'Evening wrap-up', crumb: null },
    body: left + '\n  ' + lines + clip,
    who: e.who, line: e.line,
    ctas: [['Back to the HQ', NAV, 'hq', 'dom-eve-close']],
    keys: [['Enter', 'next']],
  });
}

// ---------- the Empire Ledger (mockup `ledger`) ----------

export function r5Ledger(m: LedgerModel, x: { line: string; who: R5Speaker | null; notice: string | null; barsIn: readonly number[]; barsOut: readonly number[]; labels: readonly string[]; inSum: string; outSum: string; inNote: string; outNote: string; dirtyPct: number }, run: R5Run): string {
  const tabs = `<span class="lt50">${map(m.tabs, (t, i) => `<b class="${t.on ? 'on' : ''}" ${go('ledgerTab', i)} data-testid="dom-ledger-tab-${i}">${esc(t.word)}</b>`)}</span>`;
  const head = `<div class="lh40"><b>Week ${m.week}</b><em>${esc(m.money.scribble ?? (m.spread === 0 ? 'Money in and out' : m.spread === 1 ? 'Territory and Notoriety' : 'Crew and stores'))}</em>${tabs}</div>`;
  const M = m.money;
  let sheet: string, side: string;
  if (m.spread === 0) {
    const top = Math.max(1, ...x.barsIn, ...x.barsOut);
    const bars = map(x.labels, (l, i) => `<span style="--a:${Math.round((168 * (x.barsIn[i] ?? 0)) / top)}px;--b:${Math.round((168 * (x.barsOut[i] ?? 0)) / top)}px;--d:${i * 70}ms"><i class="in"></i><i class="out"></i><u>${esc(l)}</u></span>`);
    sheet = `${head}<div class="ch40" data-testid="dom-ledger-money">${bars}</div><div class="tt40" data-testid="dom-ledger-lines"><div class="t40 in" ${st(0, 90)}><small>In</small><b>${esc(x.inSum)}</b><em>${esc(x.inNote)}</em></div><div class="t40 out" ${st(1, 90)}><small>Out</small><b>${esc(x.outSum)}</b><em>${esc(x.outNote)}</em></div><div class="t40 net" ${st(2, 90)}><small>Net</small><b data-testid="dom-ledger-net">${esc(M.net)}</b><em>${esc(M.netPlus ? 'This week so far' : 'Bills still due')}</em></div></div>`;
    const E = m.empire;
    side = `<div class="sp40"><i class="dt" style="--w:${x.dirtyPct}%"></i><i class="cl"></i></div><div class="sl40"><span><b data-testid="dom-ledger-dirty">${esc(M.dirty)}</b><em>Dirty · needs washing</em></span><span><b data-testid="dom-ledger-clean">${esc(M.clean)}</b><em>Clean · safe to spend</em></span></div><div data-testid="dom-ledger-empire">${map([['Districts', E.held], ['Rackets', E.rackets], ['Regard · Dread', `${E.regard} · ${E.dread}`], ['Wanted', `${E.wanted.word} · ${E.wanted.n}%`]], ([k, v], i) => `<div class="row40" ${st(i, 80)}><b>${esc(k)}</b><i>${esc(v)}</i></div>`)}</div>`;
  } else if (m.spread === 1) {
    sheet = `${head}<div class="ltb3" data-testid="dom-ledger-territory">${map(m.territory, (t, i) => `<div class="ltr3${t.here ? ' here' : ''}" ${st(i, 40)}><b>${esc(t.name)}</b><i class="c-${t.cls}">${esc(t.word)}</i><span><u style="width:${t.control}%"></u></span><em>${t.control} · ♥${t.regard} · ✊${t.dread} · Heat ${t.heat}</em></div>`)}</div>`;
    side = `<div data-testid="dom-ledger-ladder">${map(m.ladder.steps.slice(0, 7), (s, i) => `<div class="row40${s.on ? ' on' : ''}" ${st(i, 60)}><b>${esc(s.word)}</b><i>${s.done ? '✓' : s.min}</i></div>`)}</div>${m.ladder.next ? `<p class="nx50">${esc(m.ladder.next.word)} in ${m.ladder.next.need}</p>` : ''}`;
  } else {
    sheet = `${head}<div class="ltb3" data-testid="dom-ledger-crew">${map(m.crew.members, (c, i) => `<div class="ltr3" ${st(i, 40)}><b>${esc(c.name)}</b><i>${esc(c.rank)}</i><span><u style="width:${c.loyalty}%"></u></span><em>${esc(c.task)} · Loyalty ${c.loyalty}</em></div>`)}<div class="ltr3 ft"><b>Crew ${esc(m.crew.count)}</b><em>Wages ${esc(m.crew.wages)} a week</em></div></div>`;
    side = `<div data-testid="dom-ledger-stores">${map(m.stores.rows, ([k, v], i) => `<div class="row40" ${st(i, 60)}><b>${esc(k)}</b><i>${esc(v)}</i></div>`)}</div>${m.stores.keyItems.length ? `<p class="nx50">${esc(m.stores.keyItems.join(', '))}</p>` : ''}`;
  }
  const sideHead = m.spread === 0 ? 'Clean and dirty' : m.spread === 1 ? 'Notoriety' : 'Stores';
  return frame({
    id: 'ledger', g: 'The Day', kind: 'lg40', bg: 'hq', run,
    top: { title: 'Empire Ledger', sub: `Week ${m.week} · ${m.tabs[m.spread]?.word ?? ''}`, crumb: ['Map', 'map'] },
    body: `<section class="lg40${m.spread ? ' s50' : ''}" data-m="panel" data-testid="dom-ledger">${sheet}<i class="lsk3" data-testid="dom-ledger-stamp">${esc(m.stamp)}</i></section>\n  ${pn('ls40', sideHead, side, 'det')}`,
    who: x.notice ? null : x.who, line: x.notice ?? x.line,
    ctas: [['Back', 'ledgerBack', '', 'dom-ledger-back']],
    footOpts: x.notice ? { testid: 'dom-notice', lineAct: 'dismiss' } : {},
    keys: [['←→', 'page'], ['Esc', 'back']],
  });
}

export type { R5Key };

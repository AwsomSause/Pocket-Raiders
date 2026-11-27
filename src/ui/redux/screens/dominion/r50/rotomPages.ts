// DOMINION redesign R9 follow-up: the Rotom Phone's own pages at pass 50 (mockups radio, inbox, msgs, journal,
// rdiary, ask, rplan, chapters, chatter, jukebox, photo, portrait). Each copies the mockup's markup and fills it with
// the run's numbers from core/dominion/rotomDesk; the Boss Menu controller keeps the cursors and does the acts.
// `r9at` moves the cursor, `r9enter` presses a row, `r9go` opens a Settings page and `r5go` a game page.

import type { Ask, Chapter, Chat, Chatter, InboxItem, LogEntry, Plan, Station } from '../../../../../core/dominion/rotomDesk';
import { scene } from './jobs';
import { bg, esc, foot, go, keys, map, NAV, page, pn, rep, SP, spr, st, tabs, top, type R5Run } from './kit';

export type Pic = (look: string | null, sz: number) => string;
const at = (i: number): string => go('r9at', i);
const enter = (i: number): string => go('r9enter', i);
const ROTOM = { name: 'Rotom', k: 'p-rotom' } as const;

// ---------- the Radio (mockup `radio`, kind rd27) ----------

export function r5Radio(ss: readonly Station[], on: number, line: number, run: R5Run): string {
  const s = ss[on]!;
  const said = s.locked ? s.now : s.lines[line % Math.max(1, s.lines.length)]?.replace(/^Day \d+ · /, '') ?? s.now;
  return page({ id: 'radio', g: 'Menu', kind: 'rd27', body: `${bg('night', 'Menu', run)}${top('Menu', { title: 'Radio', sub: s.name, id: 'radio' }, run)}
  <div class="pg27" data-m="card"><div class="scl"><i class="ndl" data-nocheck="" style="left:${8 + on * 28}%"></i>${map(ss, (x, i) => `<b style="left:${8 + i * 28}%">${esc(x.freq)}</b>`)}</div><div class="spk27x"><i></i><i></i><i></i></div><div class="cast" data-testid="r9-radio-cast"><small>${esc(s.freq)} · ${esc(s.name)}</small><p>“${esc(said)}”</p></div></div>
  ${pn('st27', 'Stations', map(ss, (x, i) => `<button class="sn27${i === on ? ' on' : ''}${x.locked ? ' lk' : ''}" ${at(i)} data-testid="r9-station-${i}" ${st(i, 70)}><kbd>${esc(x.freq)}</kbd><span><b>${esc(x.name)}</b><em>${esc(x.now)}</em></span></button>`), 'det')}
  ${foot(ROTOM, s.lines.length > 1 ? `“Bzzt! ${s.lines.length} lines on ${s.name} this week. Enter for the next.”` : '“Bzzt! Tune with the arrows. Enter listens.”', [['Back', NAV, 'start'], ['Plan around it', NAV, 'map']], 'Menu', run)}${tabs('Menu', run)}${keys([['←→', 'tune'], ['Enter', 'listen'], ['Esc', 'back']], 'Menu', run)}` });
}

// ---------- the Inbox (mockup `inbox`, kind ib35) ----------

export function r5Inbox(items: readonly InboxItem[], on: number, pic: Pic, run: R5Run): string {
  const n = items.length;
  const rows = n ? map(items, (x, i) => `<button class="im35 t-${x.kind}${i === on ? ' on' : ''}" ${at(i)} data-testid="r9-inbox-${i}" ${st(i, 70)}>${pic(x.look, 40)}<span><b>${esc(x.who)}</b><em>${esc(x.text)}</em></span><small>${esc(x.when)}</small><i>${x.kind}</i></button>`) : '<p class="ip35t">Nothing is waiting. Enjoy it.</p>';
  const first = items[on];
  return page({ id: 'inbox', g: 'Menu', kind: 'ib35', body: `${bg('hq', 'Menu', run)}${top('Menu', { title: 'Inbox', sub: `${n} waiting · nothing pops up`, id: 'inbox' }, run)}
  ${pn('il35', 'Waiting for you', rows, 'panel')}
  ${pn('ip35', 'Why an Inbox?', '<p class="ip35t">Calls, letters and alerts used to pop up over whatever you were doing. Now they wait here, with a red count on Start, until you are ready.</p>', 'det')}
  ${foot(ROTOM, n ? `“Bzzt! ${n === 1 ? 'One thing is' : `${n} things are`} waiting. None of them is on fire. Yet.”` : '“Bzzt! Inbox zero. I am so proud.”', [['Back', NAV, 'start'], ...(first ? [[`Open: ${first.who}`, 'r9enter', on] as const] : [])], 'Menu', run)}${keys([['↑↓', 'item'], ['Enter', 'open'], ['Esc', 'back']], 'Menu', run)}` });
}

// ---------- Messages (mockup `msgs`, kind msgs13) ----------

export function r5Msgs(chats: readonly Chat[], on: number, reply: number, pic: Pic, run: R5Run): string {
  const c = chats[on];
  const th = chats.length ? map(chats, (x, i) => `<button class="row sm th${i === on ? ' on' : ''}" ${at(i)} data-testid="r9-chat-${i}" ${st(i)}>${pic(x.look, 38)}<span class="row-t"><b>${esc(x.who)}</b><em>${esc(x.last)}</em></span>${x.unread ? `<i class="ph-b">${x.unread}</i>` : ''}</button>`) : '<p class="ip35t">No messages yet.</p>';
  const cv = c ? `<div class="bub13">${map(c.lines, (l, i) => `<p class="bb ${l.me ? 'me' : 'them'}" style="--d:${200 + i * 260}ms">${esc(l.text)}</p>`)}</div><div class="rep13">${map(c.replies, (r, i) => `<button class="cta rc13${i === reply ? ' on' : ''}" ${go('r9enter', i)} data-testid="r9-reply-${i}">${esc(r.label)}</button>`)}</div>` : '';
  return page({ id: 'msgs', g: 'Menu', kind: 'msg13', body: `${bg('hq', 'Menu', run)}${top('Menu', { title: 'Messages', sub: 'Rotom Phone', id: 'msgs' }, run)}
  ${pn('th13', 'Chats', th, 'rail')}
  ${pn('cv13', c ? `${pic(c.look, 30)} ${esc(c.who)}` : 'Chat', cv, 'panel')}
  ${keys([['↑↓', 'chat'], ['←→', 'reply'], ['Enter', 'send'], ['Esc', 'phone']], 'Menu', run)}` }).replace('k-msgs13', 'k-msg13');
}

// ---------- the Adventure log (mockup `journal`, kind jl30) ----------

export function r5Journal(es: readonly LogEntry[], pageNo: number, boss: string, run: R5Run): string {
  const per = 5, pages = Math.max(1, Math.ceil(es.length / per)), p = Math.min(pageNo, pages - 1);
  const mine = es.slice(p * per, p * per + per);
  const en = (x: LogEntry, i: number): string => `<p class="en30" style="--d:${i * 200}ms"><b>Day ${x.day}</b>${esc(x.text)}${x.good ? '<i>✦</i>' : ''}</p>`;
  return page({ id: 'journal', g: 'Menu', kind: 'jl30', body: `${bg('hq', 'Menu', run)}${top('Menu', { title: 'Adventure log', sub: 'Written by the Boss', id: 'journal' }, run)}
  <div class="bk30" data-m="card" data-testid="r9-journal"><div class="pg l">${map(mine.slice(0, 3), en)}</div><div class="pg r">${map(mine.slice(3), (x, i) => en(x, i + 3))}<span class="sig30">— ${esc(boss)}</span></div></div>
  ${foot(ROTOM, `“Bzzt! Page ${p + 1} of ${pages}. You write in that every night? Boss, you’re soft.”`, [['Back', NAV, 'start'], ...(p + 1 < pages ? [['Older pages', 'r9enter', 1] as const] : [])], 'Menu', run)}${keys([['←→', 'page'], ['Esc', 'back']], 'Menu', run)}` });
}

// ---------- Rotom's diary (mockup `rdiary`, kind rd46) ----------

export function r5Diary(d: { day: number; parts: readonly (readonly [string, string])[] }, run: R5Run): string {
  return page({ id: 'rdiary', g: 'Rotom', kind: 'rd46', body: `${bg('night', 'Rotom', run)}${top('Rotom', { title: 'Rotom’s diary', sub: `Day ${d.day}`, id: 'rdiary' }, run)}
  <section class="dy46" data-m="panel" data-testid="r9-diary"><i class="spine" data-nocheck=""></i><div class="pg">${map(d.parts, ([t, l], i) => `<p style="--d:${i * 220}ms"><b>${esc(t)}</b>${esc(l)}</p>`)}</div><div class="pg r"><span class="dd46" data-nocheck="">${SP('p-rotom', 90)}<i></i></span><p class="sig">— Rotom ⚡</p></div></section>
  ${foot(ROTOM, '“Bzzt! Do not read my diary, Boss. …You are reading it.”', [['Close', 'r9go', 'ask'], ...(d.day > 1 ? [[`Day ${d.day - 1}`, 'r9enter', -1] as const] : [])], 'Rotom', run)}${keys([['←→', 'day'], ['Esc', 'close']], 'Rotom', run)}` });
}

// ---------- Ask Rotom (mockup `ask`, kind ak46) ----------

export function r5Ask(qs: readonly Ask[], on: number, asked: readonly number[], run: R5Run): string {
  const av = `<span class="av">${SP('p-rotom', 34)}</span>`;
  const chat = asked.length ? map(asked, (k, i) => `<div class="m46 me" style="--d:${i * 350}ms"><p>${esc(qs[k]!.q)}?</p></div><div class="m46 ro" style="--d:${i * 350 + 175}ms">${av}<p>${esc(qs[k]!.a)}</p></div>`)
    : `<div class="m46 ro">${av}<p>Bzzt! Ask me anything on the right. I know the whole run.</p></div>`;
  return page({ id: 'ask', g: 'Rotom', kind: 'ak46', body: `${bg('hq', 'Rotom', run)}${top('Rotom', { title: 'Ask Rotom', sub: 'It knows the whole run', id: 'ask' }, run)}
  <section class="ch46" data-m="panel" data-testid="r9-ask-chat">${chat}</section>
  ${pn('sq46', 'Ask about', map(qs, (x, i) => `<button class="o29${i === on ? ' on' : ''}" ${enter(i)} data-testid="r9-ask-${i}" ${st(i, 70)}><b>${esc(x.q)}</b></button>`) + `<button class="o29" ${go('r9go', 'rplan')} data-testid="r9-ask-plan"><b>Plan tonight</b></button><button class="o29" ${go('r9go', 'rdiary')} data-testid="r9-ask-diary"><b>Rotom’s diary</b></button>`, 'det')}
  ${keys([['↑↓', 'question'], ['Enter', 'ask'], ['Esc', 'close']], 'Rotom', run)}` });
}

// ---------- Rotom's plan (mockup `rplan`, kind rp46) ----------

export function r5Plan(m: { plans: readonly Plan[]; why: string }, on: number, run: R5Run): string {
  const p = m.plans[on]!;
  return page({ id: 'rplan', g: 'Rotom', kind: 'rp46', body: `${bg('night', 'Rotom', run)}${top('Rotom', { title: 'Rotom’s plan', sub: 'Three ways to spend tonight', id: 'rplan' }, run)}
  <section class="pl46" data-m="panel">${map(m.plans, (x, i) => `<button class="pc46${i === on ? ' on' : ''}${x.pick ? ' rec' : ''}" ${enter(i)} data-testid="r9-plan-${i}" style="--d:${i * 130}ms"><i class="lt">${x.letter}</i><b>${esc(x.name)}</b><em>${esc(x.about)}</em><span><u>${x.chance}%</u><small>chance</small></span><span><u>${esc(x.money)}</u><small>money</small></span>${x.pick ? `<i class="st46">${SP('p-rotom', 22)}Rotom picks this</i>` : ''}</button>`)}</section>
  <div class="why46" data-m="box"><b>Why ${esc(m.plans.find((x) => x.pick)?.letter ?? p.letter)}?</b> ${esc(m.why)}</div>
  ${keys([['←→', 'plan'], ['Enter', 'use this plan'], ['Esc', 'I’ll decide']], 'Rotom', run)}` });
}

// ---------- The road so far (mockup `chapters`, kind cp40) ----------

export function r5Chapters(cs: readonly Chapter[], on: number, run: R5Run): string {
  const now = cs.findIndex((c) => c.state === 'now');
  const label = { done: 'Cleared', now: 'Now', next: 'Next', lock: 'Locked' } as const;
  return page({ id: 'chapters', g: 'Menu', kind: 'cp40', body: `${bg('night', 'Menu', run)}${top('Menu', { title: 'The road so far', sub: `Chapter ${now + 1} of ${cs.length}`, id: 'chapters' }, run)}
  <section class="cp40" data-m="panel"><i class="film" data-nocheck=""></i>${map(cs, (c, i) => `<button class="cc40 c-${c.state}${i === on ? ' on' : ''}" ${at(i)} data-testid="r9-chapter-${i}" style="--d:${i * 110}ms"><small>Chapter ${c.n}</small><span class="art">${spr(c.icon, 2, '')}</span><b>${esc(c.name)}</b><em>${esc(c.days)}</em><u>${esc(c.about)}</u><i class="stp">${label[c.state]}</i></button>`)}</section>
  ${foot(ROTOM, `“Bzzt! ${now} chapter${now === 1 ? '' : 's'} down. ${cs[now] ? `Now: ${cs[now]!.name}.` : 'Every chapter cleared!'}”`, [['Back', NAV, 'start']], 'Menu', run)}${keys([['←→', 'chapter'], ['Esc', 'back']], 'Menu', run)}` });
}

// ---------- the Jukebox (mockup `jukebox`, kind jb27) ----------

export interface Track { id: string; name: string; where: string; heard: boolean }

export function r5Jukebox(ts: readonly Track[], on: number, playing: string | null, run: R5Run): string {
  const got = ts.filter((t) => t.heard).length;
  // Five tracks show at a time (the mockup's panel), the cursor's window scrolling through the rest.
  const from = Math.max(0, Math.min(ts.length - 5, on - 2));
  const win = ts.slice(from, from + 5);
  return page({ id: 'jukebox', g: 'Menu', kind: 'jb27', body: `${bg('hq', 'Menu', run)}${top('Menu', { title: 'Jukebox', sub: `${got} of ${ts.length} tracks heard`, id: 'jukebox' }, run)}
  <div class="vin27${playing ? ' play' : ''}" data-nocheck=""><i class="disc"><i class="lbl">N</i></i><i class="arm"></i></div>
  ${pn('tl27', 'Tracks', map(win, (t, j) => { const i = from + j; return `<button class="tk27${i === on ? ' on' : ''}${t.heard ? '' : ' lk'}" ${enter(i)} data-testid="r9-track-${i}" ${st(j, 60)}><b>${t.heard ? esc(t.name) : '???'}</b><em>${t.heard ? esc(t.where) : 'Not heard yet'}</em><kbd>${playing === t.id ? '♪' : t.heard ? '▶' : '·'}</kbd></button>`; }), 'panel')}
  <div class="wv27" data-nocheck="">${rep(26, (i) => `<i style="--d:${(i * 53) % 700}ms;--h:${20 + ((i * 37) % 70)}%"></i>`)}</div>
  ${foot(ROTOM, '“Bzzt! Tracks join the Jukebox the first time you hear them.”', [['Back', NAV, 'start'], ['Play', 'r9enter', on]], 'Menu', run)}${keys([['↑↓', 'track'], ['Enter', 'play'], ['Esc', 'back']], 'Menu', run)}` });
}

// ---------- Photo mode (mockup `photo`, kind ph49) ----------

export interface Shot { rows: readonly [string, string][]; who: readonly { pic: string; h: number }[]; caption: string; album: number; filter: string; frame: string; stickers: number }

export function r5Photo(s: Shot, on: number, run: R5Run): string {
  const xs = s.who.map((_, i) => Math.round(70 + (i * 380) / Math.max(1, s.who.length - 1 || 1)));
  const stk = ['<i class="sk n">N</i>', '<i class="sk st">★</i>', '<b class="sk bb">SMILE!</b>'].slice(0, s.stickers).join('');
  return page({ id: 'photo', g: 'Menu', kind: 'ph49', body: `${bg('roof', 'Menu', run)}${top('Menu', { title: 'Photo mode', sub: 'The HQ roof', id: 'photo' }, run)}
  <section class="vf49 f-${esc(s.frame)} fl-${esc(s.filter)}" data-m="panel" data-testid="r9-photo"><div class="pic" data-nocheck=""><i class="sun"></i><i class="cty">${rep(12, (i) => `<u style="--h:${[40, 70, 52, 90, 34, 62, 80, 46, 74, 38, 58, 66][i]}px"></u>`)}</i>
    ${map(s.who, (w, i) => `<span class="sp" style="left:${xs[i]}px;--d:${i * 90 + 300}ms">${w.pic}</span>`)}
    ${stk}<i class="g3"></i><i class="cn"></i><i class="fl49"></i></div>
    <p class="cap">${esc(s.caption)}</p></section>
  ${pn('po49', 'Shot', map(s.rows, ([a, b], i) => `<div class="srow${i === on ? ' on' : ''}" ${at(i)} data-testid="dom-set-row-${i}" ${st(i, 60)}><b>${esc(a)}</b><i><span ${go('setLeft', i)}>‹</span> ${esc(b)} <span ${go('setRight', i)}>›</span></i></div>`) + `<div class="sn49"><button class="shut" ${go('r9snap')} data-testid="r9-snap"><i></i></button><span><b>Snap</b><em data-testid="r9-album">Album · ${s.album} photo${s.album === 1 ? '' : 's'}</em></span></div>`, 'det')}
  ${foot(ROTOM, '“Bzzt! Hold still, Boss. Snap saves a picture to your device.”', [['Back', NAV, 'menu'], ['Snap', 'r9snap']], 'Menu', run)}${tabs('Menu', run)}${keys([['←→', 'change'], ['P', 'snap'], ['Esc', 'back']], 'Menu', run)}` });
}

// ---------- On a phone (mockup `portrait`, kind port20) ----------

export function r5Portrait(m: { hq: string; funds: string; heat: number; news: string; floors: readonly string[][]; todo: readonly string[]; says: string; tall: boolean }, run: R5Run): string {
  return page({ id: 'portrait', g: 'Settings', kind: 'port20', body: `${bg('hq', 'Settings', run)}${top('Settings', { title: 'On a phone', sub: 'Same game, tall screen', id: 'portrait', crumb: ['Settings', 'hud'] }, run)}
  <div class="pf20" data-nocheck=""><div class="pf-top"><b>${esc(m.hq.toUpperCase())}</b><span>${esc(m.funds)} · ${m.heat}%</span></div><div class="pf-tk">${esc(m.news.toUpperCase())}</div>
    <div class="pf-bld">${map(m.floors, (f, i) => `<div class="pf-fl"><b>${i === 0 ? 'G' : `${i + 1}F`}</b>${map(f.slice(0, 4), (k) => `<i>${k ? spr(k, 1, '') : ''}</i>`)}</div>`)}</div>
    <div class="pf-list">${map(m.todo, (l, i) => `<span class="${i === 0 ? 'on' : ''}">${esc(l)}</span>`)}</div><div class="pf-bub">${esc(m.says)}</div></div>
  ${pn('pt20', 'What moves on a tall screen', map([['Tabs drop to the bottom', 'Thumbs reach the lift console'], ['The building stacks', 'One floor per row, people still in their rooms'], ['Panels become sheets', 'Side panels slide under the page'], ['Nothing is cut', 'Every page passes the same fit check']], ([a, b], i) => `<div class="chg up" ${st(i)}><i>▲</i><b>${a}</b><em>${b}</em></div>`) + `<button class="cta${m.tall ? ' on' : ''}" ${go('r9tall')} data-testid="r9-tall">Tall screens: ${m.tall ? 'Phone layout' : 'Same as wide'}</button>`, 'det')}
  ${keys([['Enter', 'switch'], ['Esc', 'back']], 'Settings', run)}` });
}

// ---------- Rotom chatter (mockup `chatter`, a talk scene) ----------

/** Rotom and one of the crew, with Rotom's line about them; both answers close the scene (it only talks). */
export function r5Chatter(c: Chatter, pic: Pic, body: string, on: number, run: R5Run): string {
  const rotom = { pic: SP('p-rotom', 220), face: (sz: number) => SP('p-rotom', sz), name: 'Rotom', role: 'Your guide', colour: '#ff8a1c' };
  const them = { pic: body, face: (sz: number) => pic(c.look, sz), name: c.who, role: c.rank, colour: '#8e2bd1' };
  return scene({
    id: 'chatter', g: 'Rotom', mode: 'talk', bg: 'hq', left: rotom, right: them,
    chs: [{ label: 'Keep counting', act: 'r9enter', arg: 0, on: on === 0, testid: 'r9-chatter-0' }, { label: 'Leave it', act: 'r9enter', arg: 1, on: on === 1, testid: 'r9-chatter-1' }],
    box: { who: rotom, line: c.line, testid: 'r9-chatter-line' },
    keys: [['1-2', 'answer'], ['Enter', 'your call']],
    run,
  });
}

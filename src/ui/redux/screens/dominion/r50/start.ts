// DOMINION redesign R1 (pass 50 of plans/evil-mode-rework/redesign-50): the Start group. The title (mockup `title`),
// the setup pages (`boss`, `setup` for the team types, the first member in the same file layout, the Charters as
// `nextrun`), the opening talk (`cold`), the Founding (`found`) and the sign going up (`sign`). Live data in, HTML out;
// the scene keeps every cursor and does the acts. Every data-testid the old views had is kept.

import { DOMINION_DATA } from '../../../../../core/dominion/data';
import { colourDef, draftColours, goalDef } from '../../../../../core/dominion/founding';
import type { TeamDraft } from '../../../../../core/dominion/schema';
import { act } from '../../../kit';
import { armbandIcon, emblem } from '../views';
import { bg, esc, faceOf, foot, keys, map, page, pn, rep, SP, spr, st, top, type R5Cta, type R5Key, type R5Run } from './kit';

const cap = (t: string): string => t[0]!.toUpperCase() + t.slice(1);
/** The 18 type colours (the mockups' type badges, .tyb --t). */
export const R5_TYPE: Record<string, string> = {
  normal: '#9fa19f', fire: '#e8452b', water: '#2980ef', grass: '#3fa129', electric: '#fac000', ice: '#3dcef3', fighting: '#ff8000', poison: '#9141cb',
  ground: '#915121', flying: '#81b9ef', psychic: '#ef4179', bug: '#91a119', rock: '#afa981', ghost: '#704170', dark: '#624d4e', steel: '#60a1b8',
  dragon: '#5060e1', fairy: '#ef70ef',
};
const tyb = (t: string): string => `<span class="tyb" style="--t:${R5_TYPE[t] ?? '#888'}">${esc(cap(t))}</span>`;

/** A list that keeps its cursor row in view (the redux stage scrolls `data-scrollrow` after each draw). */
const scroller = (rows: string, at: number, show: number, n: number): string =>
  `<div class="r5sc" data-scrollrow="${Math.max(0, Math.min(at - Math.floor(show / 2), n - show))}">${rows}</div>`;

// ---------- the title ----------

export interface R5TitleRow { id: string; label: string; sub: string; on: boolean; testid: string }
export interface R5TitleModel {
  at: number;
  rows: readonly R5TitleRow[];
  /** The run to continue: the Boss's face, its line, the party's icons and the Goal's progress. */
  cont: { pic: string; line: string; party: readonly string[]; goal: number } | null;
  /** The crest: the team's initial and the Goal ring. */
  initial: string;
  goal: number;
  /** The figures on the street (the Boss, the first member, the lead Pokémon). */
  crew: readonly string[];
}

export function r5Title(m: R5TitleModel, run: R5Run): string {
  const rows = map(m.rows, (r, i) => {
    const on = i === m.at ? ' on' : '';
    const dim = r.on ? '' : ' style="opacity:.55"';
    if (r.id === 'continue' && m.cont) {
      const c = m.cont;
      return `<button class="cn50${on}" ${act('title', i)} data-over="titleOver" data-testid="${r.testid}"${dim}><span class="fc">${faceOf(c.pic, 58, '#e0294a')}</span><span class="tx"><b>${esc(r.label)}</b><em>${esc(c.line)}</em><span class="pt">${c.party.join('')}</span></span><i class="gl"><b>${c.goal}%</b>Goal</i></button>`;
    }
    return `<button class="wm50${on}" ${act('title', i)} data-over="titleOver" data-testid="${r.testid}" style="--i:${i};--d:${i * 80}ms${r.on ? '' : ';opacity:.55'}"><b>${esc(r.label)}</b>${r.sub ? `<em>${esc(r.sub)}</em>` : ''}</button>`;
  });
  const city = rep(16, (i) => `<i style="--h:${[60, 110, 80, 140, 56, 100, 74, 130, 90, 150, 64, 120, 84, 104, 70, 96][i]}px"></i>`);
  const ks: R5Key[] = [['↑↓', 'move'], ['Enter', 'choose']];
  return page({ id: 'title', g: 'Start', kind: 'ti50', body: `${bg('night', 'Start', run)}<i class="sk50" data-nocheck=""></i>
  <div class="city48" data-nocheck="">${city}</div><i class="rf50" data-nocheck=""></i>
  <div class="lg50" data-m="ttl" data-testid="dom-logo"><span class="cr50" style="--g:${m.goal}%" data-testid="dom-tower">${esc(m.initial)}<i class="kw50">${SP('g-relic-crown', 22)}</i></span><span class="tx"><small>Pocket Raiders</small><b>DOMINION</b><em>An evil team rises in Kanto</em></span></div>
  <nav class="mn50" data-testid="dom-title">${rows}</nav>
  <div class="cw50" data-nocheck="">${map(m.crew, (h, i) => `<span style="--d:${500 + i * 140}ms">${h}</span>`)}</div>
  ${keys(ks, 'Start', run)}` });
}

// ---------- the setup ----------

export interface R5SetupBoss { name: string; pic: string }
export interface R5Starter { name: string; pic: string; level: number }
export interface R5SetupModel {
  page: 'boss' | 'types' | 'member' | 'charter';
  problem: string | null;
  boss: R5SetupBoss;
  starters: readonly R5Starter[];
  funds: string;
  home: string;
  /** Types: the eighteen rows (the banned two last), the cursor, the picked two, example Pokémon per type and the
   *  detail's picture (a Pokémon of the picked types). */
  types: { rows: readonly string[]; banned: readonly string[]; at: number; picked: readonly string[]; mons: Record<string, string>; pic: string; hint: readonly string[] };
  /** The first member: Grunt or Admin, the picture, the five skills and the facts. */
  member: { which: 'grunt' | 'admin'; name: string; rank: string; pic: string; stats: readonly [string, number][]; facts: readonly string[]; pitch: string; wage: number; lv: number; loyalty: number; look: number; looks: number };
  /** The Charters page (`nextrun`): open or locked, the rows, the cursor. */
  charters: { open: boolean; lockLine: string; pickLine: string; at: number; rows: readonly { id: string; team: string; initial: string; colours: readonly string[]; question: string; patron: string; motto: string; from: string }[] };
}

const SETUP_KEYS: R5Key[] = [['Enter', 'Choose'], ['Esc', 'Back']];

function typesPage(m: R5SetupModel, run: R5Run): string {
  const t = m.types;
  const rows = map(t.rows, (ty, i) => {
    const banned = t.banned.includes(ty), picked = t.picked.includes(ty);
    const tag = picked ? '<i class="tag">Picked</i>' : banned ? '<i class="tag">Can’t pick</i>' : '';
    return `<button class="row${i === t.at ? ' on' : ''}" ${act('type', i)} data-over="typeOver" data-testid="dom-type-${ty}" ${st(i)}${banned ? ' data-off=""' : ''}>${tyb(ty)}<span class="row-t"><b>${esc(cap(ty))}</b><em>${esc(t.mons[ty] ?? '')}</em></span>${tag}</button>`;
  });
  const shown = t.picked.length ? t.picked : [t.rows[t.at] ?? 'poison'];
  const lines = t.picked.length === 2
    ? ['Grunts may only carry these two types.', 'Off-type catches go to the Reserve.', 'An Admin’s one Ace can be any type.']
    : ['Pick two. Every Grunt’s Pokémon must have one of them.', ...t.hint.slice(0, 2)];
  const det = `<div class="plinth">${t.pic}</div><b class="det-t">${esc(shown.map(cap).join(' · '))}</b>${map(lines, (l) => `<p>${esc(l)}</p>`)}`
    + (m.problem ? `<p class="r5bad" data-testid="dom-problem">${esc(m.problem)}</p>` : '')
    + `<button class="cta on" ${act('next')} data-testid="dom-next">Next: your first member</button>`;
  return page({ id: 'setup', g: 'Start', kind: 'list', body: bg('hq', 'Start', run) + top('Start', { title: 'Pick your team types', id: 'setup' }, run)
    + `\n  <section class="pn l-main" data-m="panel" data-testid="dom-setup-types"><h3><i>Step 2 of 3 · Two types your crew will run</i></h3>${scroller(rows, t.at, 5, t.rows.length)}</section>`
    + `\n  <section class="pn l-det" data-m="det">${det}</section>\n  ` + keys(SETUP_KEYS, 'Start', run) });
}

/** The mockups' file layout (k-file): the portrait, the middle panel, the notes, and the text box. */
function filePage(id: string, o: { pic: string; name: string; rank: string; mid: [string, string]; notes: string; line: string; ctas: R5Cta[]; testid: string; title: string; boxTestid?: string; pc?: string }, run: R5Run, ks: R5Key[]): string {
  return page({ id, g: 'Start', kind: 'file f6', body: bg('hq', 'Start', run) + top('Start', { title: o.title, id }, run)
    + `\n  <section class="pn f-por" data-m="det" data-testid="${o.testid}" style="--pc:${o.pc ?? '#e0294a'}"><div class="plinth big">${o.pic}</div><b class="f-name" data-m="name">${esc(o.name)}</b><em class="f-rank">${esc(o.rank)}</em></section>`
    + `\n  <section class="pn f-st" data-m="panel"><h3><i>${esc(o.mid[0])}</i></h3>${o.mid[1]}</section>`
    + `\n  <section class="pn f-tr"><h3><i>Notes</i></h3>${o.notes}</section>\n  `
    + foot(null, o.line, o.ctas, 'Start', run, { testid: o.boxTestid }) + keys(ks, 'Start', run) });
}

const trait = (i: number, b: string, e: string): string => `<div class="trait" ${st(i)}><b>${esc(b)}</b><em>${esc(e)}</em></div>`;
const facts = (rows: readonly [string, string][]): string => `<dl class="facts">${map(rows, ([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`)}</dl>`;

function bossPage(m: R5SetupModel, run: R5Run): string {
  const mons = `<div class="mons r5m3">${map(m.starters, (s, i) => `<span ${st(i)}>${s.pic}<b>${esc(s.name)}</b><em>Lv ${s.level}</em></span>`)}</div>`;
  const ch = m.charters.open ? 'Start from a Charter · C' : 'Charters · locked';
  const chLine = m.charters.open ? 'An established team, its Patron and its debts' : m.charters.lockLine;
  const notes = trait(0, 'Your own battles', 'You fight every battle yourself')
    + trait(1, 'No uniform, no type rule', 'Any Pokémon under the level cap')
    + `<button class="trait r5tr" ${act('charters')} data-testid="dom-setup-charter-chip" ${st(2)}><b>${m.charters.open ? '' : '🔒 '}${esc(ch)}</b><em>${esc(chLine)}</em></button>`
    + facts([['Starting cash', m.funds], ['Partner', m.starters[0]?.name ?? '—'], ['Home', m.home]]);
  const ctas: R5Cta[] = [['Back', 'setupBack'], ['This is me', 'next', '', 'dom-next']];
  const line = m.problem ?? '“Kanto doesn’t need a hero. It needs a landlord.”';
  return filePage('boss', { pic: m.boss.pic, name: m.boss.name, rank: 'The Boss', mid: ['Your Pokémon', mons], notes, line, ctas, testid: 'dom-setup-boss', title: 'Choose the Boss', boxTestid: m.problem ? 'dom-problem' : undefined }, run, [['C', 'Charters'], ...SETUP_KEYS]);
}

function memberPage(m: R5SetupModel, run: R5Run): string {
  const x = m.member;
  const bars = map(x.stats, ([k, v], i) => `<div class="bar" ${st(i)}><span>${esc(cap(k))}</span><i><u style="width:${v * 10}%"></u></i><b>${v}</b></div>`);
  const notes = map(x.facts.slice(0, 2), (f, i) => trait(i, f.split(',')[0]!, f.includes(',') ? f.slice(f.indexOf(',') + 1).trim() : ''))
    + facts([['Wage', `₽${x.wage} a week`], ['Loyalty', String(x.loyalty)], ['Pokémon', `Lv ${x.lv}, a Team Type`]]);
  const ctas: R5Cta[] = [['A Grunt', 'member', 0, 'dom-member-grunt'], ['An Admin', 'member', 1, 'dom-member-admin'], ['Begin', 'next', '', 'dom-next']];
  const rank = x.which === 'grunt' ? 'Your only Grunt' : `Admin · ${x.rank} · ${x.look + 1} of ${x.looks}`;
  const line = m.problem ?? `“${x.pitch}”`;
  return filePage('member', { pic: x.pic, name: x.name, rank, mid: ['Skills', bars], notes, line, ctas, testid: `dom-setup-member`, title: 'Your first member', boxTestid: m.problem ? 'dom-problem' : undefined, pc: '#3f7fd9' }, run,
    [['←→', 'Grunt or Admin'], ...(x.which === 'admin' ? [['↑↓', 'another Admin'] as R5Key] : []), ...SETUP_KEYS]);
}

/** A Charter card's circle: its first colour that isn't black or white (Rocket is black and crimson: crimson). */
const cardHex = (ids: readonly string[]): string => {
  const hex = ids.map((id) => colourDef(id)?.hex).filter((h): h is string => !!h);
  return hex.find((h) => !/^#(0|1|2)[0-9a-f](0|1|2)[0-9a-f](0|1|2)[0-9a-f]$|^#(e|f)[0-9a-f](e|f)[0-9a-f](e|f)[0-9a-f]$/i.test(h)) ?? hex[0] ?? '#5a6488';
};

function charterPage(m: R5SetupModel, run: R5Run): string {
  const c = m.charters;
  const own = [
    ['up', 'Charters', c.open ? `${c.rows.length} ready-made teams, now open` : c.lockLine],
    ['up', 'The Boss', 'The same trainer, the same three Pokémon'],
    ['dn', 'Money', 'Back to the start'],
    ['dn', 'Crew and Pokémon', 'You found a new team'],
  ] as const;
  const left = map(own, ([k, b, e], i) => `<div class="chg ${k}" style="--i:${i};--d:${i * 70}ms"><i>${k === 'up' ? '▲' : '▼'}</i><b>${esc(b)}</b><em>${esc(e)}</em></div>`);
  const first = Math.max(0, Math.min(c.at - 1, c.rows.length - 4)) & ~1;
  const cards = map(c.rows.slice(first, first + 4), (r, j) => {
    const i = first + j;
    return `<button class="cx48${i === c.at ? ' on' : ''}" ${act('charterRow', i)} data-over="charterOver" data-testid="dom-charter-${esc(r.id)}" style="--d:${j * 120}ms;--k:${cardHex(r.colours)}"><i>${esc(r.initial)}</i><b>${esc(r.team)}</b><em>“${esc(r.question)}”</em><small>Patron: ${esc(r.patron)}</small></button>`;
  });
  const more = c.rows.length > 4 ? `+ ${c.rows.length - 4} more Charters · ↑↓ to see them` : c.pickLine;
  const cur = c.rows[c.at];
  const line = m.problem ?? (cur ? `${cur.team}, from ${cur.from}. “${cur.motto}”` : c.pickLine);
  return page({ id: 'nextrun', g: 'Start', kind: 'nr48', body: bg('street', 'Start', run) + top('Start', { title: 'A Charter', sub: c.open ? 'An established start · optional' : 'Locked', crumb: null, id: 'nextrun' }, run)
    + `\n  <section class="pn kp48" data-m="det"><h3><i>What carries over</i></h3>${left}</section>`
    + `\n  <section class="pn ch48${c.open ? '' : ' r5off'}" data-m="panel" data-testid="dom-setup-charters"><h3><i>Found a new team</i></h3><div class="cs48">${cards}</div>${c.open ? `<p class="mr48">${esc(more)}</p>` : `<p class="mr48 r5lock" data-testid="dom-charter-lock">🔒 ${esc(c.lockLine)} · ↑↓ to read them</p>`}</section>\n  `
    + foot({ name: 'Rotom', k: 'p-rotom' }, line, [['Back', 'setupBack'], ['Read the Charter', 'next', '', 'dom-next']], 'Start', run, { testid: m.problem ? 'dom-problem' : 'dom-charter-detail' })
    + keys([['↑↓', 'team'], ['Enter', 'begin'], ['Esc', 'back']], 'Start', run) });
}

export function r5Setup(m: R5SetupModel, run: R5Run): string {
  if (m.page === 'types') return typesPage(m, run);
  if (m.page === 'member') return memberPage(m, run);
  if (m.page === 'charter') return charterPage(m, run);
  return bossPage(m, run);
}

// ---------- the opening talk (`cold`) ----------

export interface R5Actor { name: string; role: string; pic: string; face: string; colour: string }

/** The opening: the first member on the left, the Boss on the right, one line at a time. Quoted lines are spoken
 *  (the member first, then the Boss, in turn); the rest is narration. */
export function r5Cold(lines: readonly string[], shown: number, member: R5Actor, boss: R5Actor, run: R5Run): string {
  const i = Math.max(0, Math.min(shown, lines.length) - 1);
  const line = lines[i] ?? '';
  let said = 0;
  for (let k = 0; k < i; k++) if (/^["“]/.test(lines[k]!)) said++;
  const who = /^["“]/.test(line) ? (said % 2 === 0 ? member : boss) : null;
  const last = shown >= lines.length;
  const spk = who ? `<span class="spk6" style="--pc:${who.colour}">${faceOf(who.face, 62, who.colour)}<b>${esc(who.name)}</b></span>` : '';
  return page({ id: 'cold', g: 'Start', kind: 'scene sm-talk pg-cold', body: `${bg('rain', 'Start', run)}
  <div class="act l" style="--pc:${member.colour}">${member.pic}<span class="plate vs17"><b>${esc(member.name)}</b><em>${esc(member.role)}</em></span></div>
  <div class="act r" style="--pc:${boss.colour}">${boss.pic}<span class="plate vs17"><b>${esc(boss.name)}</b><em>${esc(boss.role)}</em></span></div>
  <section class="tbox${who ? '' : ' r5nar'}" data-m="box" data-testid="dom-opening" ${act('more')}>${spk}<p>${esc(line)}</p><button class="cta on">${last ? 'To the HQ ▶' : 'Go on'}</button><span class="tb-chips"><i>${i + 1} of ${lines.length}</i></span><i class="more">▼</i></section>
  ${keys([['Enter', 'next']], 'Start', run)}` });
}

// ---------- the Founding (`found`) ----------

export interface R5FoundingModel {
  /** The visible rows (Name, Colours, Mark, Motto, Goal), which is on, and the found button's state. */
  rows: readonly { id: string; label: string; ico: string; value: string; tag: string; testid: string; act: number }[];
  at: number;
  found: boolean;
  typing: boolean;
  /** The detail panel for the row under the cursor (HTML: the door, the swatches, the marks or the goal). */
  det: string;
  problem: string | null;
}

export function r5Founding(m: R5FoundingModel, run: R5Run): string {
  const rows = map(m.rows, (r, i) => `<button class="row${i === m.at && !m.found ? ' on' : ''}" ${act('fRow', r.act)} data-testid="${r.testid}" ${st(i)}>${SP(r.ico, 30, 'ico')}<span class="row-t"><b>${esc(r.label)}</b><em>${r.value}</em></span><i class="tag">${esc(r.tag)}</i></button>`);
  const ks: R5Key[] = m.typing ? [['Type', 'letters'], ['Enter', 'done']] : [['←→', 'change'], ['Enter', 'choose'], ['Esc', 'later']];
  return page({ id: 'found', g: 'Start', kind: 'list', body: bg('hq', 'Start', run) + top('Start', { title: 'The Founding', crumb: null, id: 'found' }, run)
    + `\n  <section class="pn l-main" data-m="panel" data-testid="dom-founding"><h3><i>Make it official</i></h3>${rows}</section>`
    + `\n  <section class="pn l-det r5fd" data-m="det" data-testid="dom-door">${m.det}${m.problem ? `<p class="r5bad" data-testid="dom-problem">${esc(m.problem)}</p>` : ''}<button class="cta${m.found ? ' on' : ''}" ${act('fFound')} data-testid="dom-f-found">Raise the sign</button></section>\n  `
    + keys(ks, 'Start', run, { testid: 'dom-f-keys' }) });
}

// ---------- the sign goes up (`sign`) ----------

export interface R5SignModel { name: string; where: string; changes: readonly { up: boolean; b: string; e: string }[]; line: string; last: boolean; emblem: string }

export function r5Sign(m: R5SignModel, run: R5Run): string {
  const coins = rep(14, (i) => `<i style="--a:${i * 26}deg;--r:${120 + (i % 4) * 40}px;--d:${(i % 5) * 60}ms"></i>`);
  const chg = map(m.changes, (c, i) => `<div class="chg ${c.up ? 'up' : 'dn'}" style="--i:${i};--d:${i * 110}ms"><i>${c.up ? '▲' : '▼'}</i><b>${esc(c.b)}</b><em>${esc(c.e)}</em></div>`);
  return page({ id: 'sign', g: 'Start', kind: 'res', body: bg('gold', 'Start', run) + top('Start', { title: 'The sign goes up', crumb: null, id: 'sign' }, run)
    + `\n  <div class="r-l" data-testid="dom-sign"><small>The Founding</small><b class="r-big${m.name.length > 9 ? ' long' : ''}" data-m="funds" data-testid="dom-sign-name">${esc(m.name.toUpperCase())}</b><p>${esc(m.where)}</p><div class="coins" data-nocheck="">${coins}</div><div class="stamp" data-m="ttl">FOUNDED</div><span class="r5emb">${m.emblem}</span></div>`
    + `\n  ${pn('r-lines', 'What changed', chg, 'panel')}\n  `
    + foot(null, m.line, [[m.last ? 'To the HQ' : 'Go on', 'more']], 'Start', run, { testid: 'dom-founded', lineAct: 'more' })
    + keys([['Enter', 'next']], 'Start', run) });
}

const lc1 = (t: string): string => t.charAt(0).toLowerCase() + t.slice(1);

/** The Founding's rows and the detail for the row under the cursor, from the draft (`row` is FOUNDING_ROWS' index). */
export function foundingModel(d: TeamDraft, row: number, typing: 'name' | 'motto' | null, ideas: readonly string[], problem: string | null): R5FoundingModel {
  const F = DOMINION_DATA.founding;
  const c = draftColours(d);
  const caret = '<b class="r5car">▌</b>';
  const field = (text: string, on: boolean, max: number, id: string): string => `<span class="r5fld${on ? ' on' : ''}" data-testid="dom-f-${id}-text">${esc(text)}${on ? caret : ''}<small>${text.length}/${max}</small></span>`;
  const goal = goalDef(d.goal);
  const logo = F.logos.find((l) => l.id === d.logo);
  const sw = (pick: string, other: string, which: 'p' | 's'): string => map(F.colours, (x) => `<i class="${x.id === pick ? 'on' : ''}${x.id === other ? ' off' : ''}" title="${esc(x.name)}" style="--c:${x.hex}" ${act(which === 'p' ? 'fPrimary' : 'fSecondary', x.id)}></i>`);
  const rows = [
    { id: 'name', label: 'Name', ico: 'g-idcard', value: field(d.name, typing === 'name', F.name.max, 'name'), tag: typing === 'name' ? 'Typing' : 'Type', testid: 'dom-f-name', act: 0 },
    { id: 'colours', label: 'Colours', ico: 'g-dark-gem', value: `<i class="r5dot" style="--c:${colourDef(d.primary)?.hex ?? '#888'}"></i><i class="r5dot" style="--c:${colourDef(d.secondary)?.hex ?? '#888'}"></i>${esc(`${colourDef(d.primary)?.name ?? ''} and ${colourDef(d.secondary)?.name ?? ''}`)}`, tag: '◀ ▶', testid: 'dom-f-primary', act: 1 },
    { id: 'mark', label: 'Mark', ico: 'g-star-piece', value: `<span data-testid="dom-f-letter">${esc(d.initial)}</span> · ${esc(logo?.name ?? d.logo)}`, tag: '◀ ▶', testid: 'dom-f-initial', act: 3 },
    { id: 'motto', label: 'Motto', ico: 'g-letter', value: field(d.motto, typing === 'motto', F.motto.max, 'motto'), tag: typing === 'motto' ? 'Typing' : 'Type', testid: 'dom-f-motto', act: 5 },
    { id: 'goal', label: 'Goal', ico: 'g-relic-crown', value: `<span data-testid="dom-f-goal-name">${esc(goal?.name ?? F.noGoal.name)}</span>: ${esc(lc1((goal?.line ?? F.noGoal.line).split(/[.:]/)[0]!))}`, tag: 'Pick', testid: 'dom-f-goal', act: 6 },
  ];
  const at = [0, 1, 1, 2, 2, 3, 4, -1][row] ?? 0;
  const band = armbandIcon(c, 2) ?? `<i class="r5gb" style="--c:${c.primary}">${esc(c.initial)}</i>`;
  const kind = rows[at]?.id ?? 'found';
  const title = kind === 'goal' ? `<b class="det-t">Goal · ${esc(goal?.name ?? F.noGoal.name)}</b>` : `<b class="det-t" data-testid="dom-f-door-name">${esc((d.name.trim() || '…').toUpperCase())}</b>`;
  const head = `<div class="plinth r5door">${kind === 'goal' ? SP('g-relic-crown', 72) : ''}${emblem(c, 76, 68, 48)}<span class="r5band" data-testid="dom-armband">${band}</span></div>${title}`;
  let det = '';
  if (kind === 'name') det = `<p data-testid="dom-f-ideas">Ideas from your record: ${map(ideas, (x, i) => `${i ? ' · ' : ''}<b${x === d.name ? ' class="y"' : ''}>${esc(x)}</b>`)}</p><p>◀ ▶ the next idea · Enter to type your own</p>`;
  else if (kind === 'colours') det = `<div class="r5sw${row === 1 ? ' on' : ''}"><b>Primary</b>${sw(d.primary, d.secondary, 'p')}</div><div class="r5sw${row === 2 ? ' on' : ''}"><b>Second</b>${sw(d.secondary, d.primary, 's')}</div><p>Every armband and outfit turns these two colours.</p>`;
  else if (kind === 'mark') det = `<div class="r5sw${row === 3 ? ' on' : ''}"><b>Letter</b><span class="r5let">◀ ${esc(d.initial)} ▶</span></div><div class="r5sw${row === 4 ? ' on' : ''}"><b>Mark</b>${map(F.logos, (l) => `<span class="r5lg${l.id === d.logo ? ' on' : ''}" ${act('fLogo', l.id)} title="${esc(l.name)}">${emblem({ ...c, logo: l.id }, 26, 24, 15)}</span>`)}</div>`;
  else if (kind === 'motto') det = `<p>“${esc(d.motto || '…')}”</p><p>◀ ▶ an idea · Enter to type your own</p>`;
  else det = `<p>${esc(goal?.line ?? F.noGoal.line)}</p><p>“${esc(goal?.quote ?? F.noGoal.quote)}”</p>`;
  return { rows, at, found: row === 7, typing: !!typing, det: head + det, problem };
}

export { spr };

// DOMINION redesign R5: the seven Crew pages that got their rules in core/dominion/crewPages.ts (binder, bonds, downtime,
// shelter, disguise, skills, graffiti), plus the Crew pages list (M) that reaches every Crew page from the keyboard.
// Markup from the pass-50 mockups; data is the run's. Display only: taps send acts, the controller sends the steps.

import { bondsOf, binderOf, offIn, outfitOf, pagesOf, skillPoints, sprayIn, ownedDistricts, cantLearn, strayFriend, type BinderPage } from '../../../../../core/dominion/crewPages';
import { DOMINION_DATA } from '../../../../../core/dominion/data';
import type { DominionBlock } from '../../../../../core/dominion/schema';
import { crewFace, crewPic, KO, memberColour, money, speaker, sr, titleName, type R5CrewCtx } from './crew';
import { esc, frame, go, map, SP } from './kit';
import { R5_SIZES } from './sizes';

const P = () => DOMINION_DATA.crewPages;
const notice = (c: R5CrewCtx) => (c.notice ? { line: c.notice, footOpts: { testid: 'dom-notice', lineAct: 'dismiss' } } : {});

// ---------- the Crew pages list (M) ----------

export interface R5MoreRow { id: string; label: string; sub: string; icon: string; off: string | null }

export function r5CrewMenu(rows: readonly R5MoreRow[], at: number, c: R5CrewCtx): string {
  const cur = Math.max(0, Math.min(at, rows.length - 1));
  const start = Math.max(0, Math.min(cur - 2, rows.length - 6));
  const list = map(rows.slice(start, start + 6), (r, k) => {
    const i = start + k;
    return `<button class="row${i === cur ? ' on' : ''}" ${go('r5more', i)} data-testid="r5m-${esc(r.id)}" style="--i:${k};--d:${k * 50}ms${r.off ? ';opacity:.55' : ''}">${SP(r.icon, 30, 'ico')}<span class="row-t"><b>${esc(r.label)}</b><em>${esc(r.off ?? r.sub)}</em></span><i class="tag num">${i + 1}/${rows.length}</i></button>`;
  });
  const r = rows[cur];
  const det = r ? `<section class="pn l-det" data-m="det"><div class="plinth">${SP(r.icon, 72)}</div><b class="det-t">${esc(r.label)}</b><p>${esc(r.sub)}</p>${r.off ? `<p>${esc(r.off)}</p>` : `<button class="cta on" ${go('r5more', cur)}>Open</button>`}</section>` : '';
  return frame({
    id: 'crewmenu', g: 'Crew', kind: 'list', top: { title: 'Crew pages', sub: `${rows.length} pages` }, run: c.run,
    body: `<section class="pn l-main" data-m="panel"><h3><i>The Crew tab</i></h3>${list}</section>\n  ${det}`,
    ...notice(c), keys: [['↑↓', 'page'], ['Enter', 'open'], ['Esc', 'Back']], keysOpts: KO(),
  });
}

// ---------- Card binder (mockup `binder`, kind bind14) ----------

const PAGE_COLOUR: Record<string, string> = { crew: '#25b3c7', heroes: '#ef3b2c', law: '#3f7fd9' };

export function r5Binder(pages: readonly BinderPage[], pg: number, at: number, c: R5CrewCtx): string {
  const p = pages[Math.max(0, Math.min(pg, pages.length - 1))]!;
  const cards = p.cards.slice(0, 8);
  const cur = Math.max(0, Math.min(at, cards.length - 1));
  const pic = (k: (typeof cards)[number]): string => {
    if (k.member !== null) return crewPic(k.sprite, 96, c.team);
    return k.sprite && R5_SIZES[k.sprite] ? SP(k.sprite, 96) : `<b style="font:800 40px var(--fd);color:#fff;opacity:.8">${esc(k.name[0] ?? '?')}</b>`;
  };
  const slots = map(cards, (k, i) => k.met
    ? `<span class="slv${i === cur ? ' on' : ''}" ${go('r5bind', i)} data-testid="r5b-card-${i}" style="--d:${i * 60}ms"><div class="cd14 mini" style="--pc:${k.member !== null ? memberColour(k.member) : PAGE_COLOUR[p.id] ?? '#7d8298'}"><div class="cd-h"><b>${esc(titleName(k.name))}</b>${k.lv !== null ? `<em>Lv ${k.lv}</em>` : ''}</div><div class="cd-a">${pic(k)}<i class="foil" data-nocheck=""></i></div><div class="cd-r">${esc(k.sub)}</div><div class="cd-f"><i>${'★'.repeat(k.stars)}</i></div></div></span>`
    : `<span class="slv${i === cur ? ' on' : ''}" ${go('r5bind', i)} data-testid="r5b-card-${i}" style="--d:${i * 60}ms"><b class="nm14">?</b><em>Not met yet</em></span>`);
  const total = pages.reduce((a, x) => a + x.cards.length, 0);
  const got = pages.reduce((a, x) => a + x.cards.filter((k) => k.met).length, 0);
  const bars = map(pages.slice(0, 3), (x, i) => {
    const n = x.cards.filter((k) => k.met).length;
    return `<div class="bar" style="--i:${i};--d:${i * 60}ms"><span>${esc(x.title.replace(/^Team /, ''))}</span><i><u style="width:${x.cards.length ? Math.round((100 * n) / x.cards.length) : 0}%"></u></i><b>${n}</b></div>`;
  });
  const sets = map(pages.filter((x) => x.set), (x) => `<p${x.set!.done ? ' style="color:var(--yel)"' : ''}>${esc(x.set!.label)} (${esc(x.title)}): ${esc(x.set!.says)}${x.set!.done ? ' ✓' : ''}</p>`);
  const body = `<section class="bnd14" data-m="panel"><nav class="btab14">${map(pages, (x, i) => `<i class="${x === p ? 'on' : ''}" ${go('r5bindPg', i)} data-testid="r5b-tab-${esc(x.id)}">${esc(x.title.replace(/^Team /, ''))}</i>`)}</nav>
    <div class="sl14">${slots}</div></section>
  <section class="pn bx14" data-m="det"><h3><i>Collection</i></h3><div class="cc14"><b>${got}</b><em>of ${total} cards</em></div>${bars}
    <div class="set14"><b>Set bonus</b>${sets}</div></section>`;
  return frame({
    id: 'binder', g: 'Crew', kind: 'bind14', top: { title: 'Card binder', sub: `Page ${pages.indexOf(p) + 1} of ${pages.length}` }, run: c.run,
    body, ...notice(c), keys: [['←→', 'card'], ['↑↓', 'page'], ['Enter', 'open']], keysOpts: KO(),
  });
}

// ---------- Bonds (mockup `bonds`, kind bd28) ----------

const RING = [[436, 80], [596, 140], [596, 252], [436, 306], [276, 252], [276, 140], [356, 30], [516, 356]] as const;

function bondLine(mine: readonly { kind: string; other: string }[]): string {
  const best = mine.find((x) => x.kind === 'best'), bad = mine.find((x) => x.kind === 'clash'), good = mine.find((x) => x.kind === 'good');
  if (best && bad) return `“${best.other}’s got my back. ${bad.other}, though… keep us apart.”`;
  if (best) return `“${best.other}’s got my back, Boss.”`;
  if (bad) return `“Keep ${bad.other} away from me, Boss.”`;
  if (good) return `“${good.other}’s all right. We get the job done.”`;
  return '“Nobody’s close yet, Boss. Put us on a squad.”';
}

export function r5Bonds(b: DominionBlock, sel: number, c: R5CrewCtx): string {
  const ms = b.members.slice(0, RING.length);
  const cur = Math.max(0, Math.min(sel, ms.length - 1));
  const pos = new Map(ms.map((m, i) => [m.id, RING[i]!]));
  const bonds = bondsOf(b).filter((x) => pos.has(x.a) && pos.has(x.b));
  const lines = map(bonds, (x, i) => {
    const [x1, y1] = pos.get(x.a)!, [x2, y2] = pos.get(x.b)!;
    return `<line class="${x.kind === 'best' ? 'strong' : x.kind === 'clash' ? 'bad' : ''}" x1="${x1 + 44}" y1="${y1 + 44}" x2="${x2 + 44}" y2="${y2 + 44}" style="stroke-width:${x.kind === 'best' ? 7 : x.kind === 'clash' ? 3 : 5};--d:${i * 120}ms"></line>`;
  });
  const faces = map(ms, (m, i) => {
    const [l, t] = RING[i]!;
    return `<button class="bn28${i === cur ? ' on' : ''}" ${go('r5cSel', i)} data-testid="r5-bond-${i}" style="left:${l}px;top:${t}px;--d:${i * 90}ms">${crewFace(m.look, 64, memberColour(i), c.team)}<b>${esc(titleName(m.name))}</b></button>`;
  });
  const m = ms[cur];
  const name = (id: string): string => titleName(b.members.find((x) => x.id === id)?.name ?? id);
  const mine = m ? bonds.filter((x) => x.a === m.id || x.b === m.id).map((x) => ({ ...x, other: name(x.a === m.id ? x.b : x.a) })) : [];
  const list = (k: string): string => mine.filter((x) => x.kind === k).map((x) => x.other).join(', ') || 'nobody yet';
  const det = m ? `<section class="pn bk28" data-m="det" data-testid="r5-bond-detail"><h3><i>${esc(titleName(m.name))}</i></h3><div class="bk25" style="--i:0;--d:0ms"><b>Best friends</b><em>${esc(list('best'))}</em></div><div class="bk25" style="--i:1;--d:70ms"><b>Gets on with</b><em>${esc(list('good'))}</em></div><div class="bk25" style="--i:2;--d:140ms"><b>Clashes with</b><em>${esc(list('clash'))}</em></div><p class="bt28">Squad mates share their squad’s Cohesion; a shared job helps; some personalities clash.</p></section>` : '';
  return frame({
    id: 'bonds', g: 'Crew', kind: 'bd28', top: { title: 'Bonds', sub: 'Who likes whom' }, run: c.run,
    body: `<svg class="bl28" viewBox="0 0 960 540" data-nocheck="">${lines}</svg>\n  ${faces}\n  ${det}`,
    who: m ? speaker(m, memberColour(cur), c.team) : null, line: c.notice ?? (m ? bondLine(mine) : ''), footOpts: c.notice ? { testid: 'dom-notice' } : {},
    ctas: [['Back', 'r5c', 'roster'], ['Full file', 'r5c', 'file']], keys: [['←→', 'crew'], ['Enter', 'file'], ['Esc', 'back']], keysOpts: KO(),
  });
}

// ---------- Evening off (mockup `downtime`, kind dt28) ----------

export function r5Downtime(b: DominionBlock, sel: number, at: number, c: R5CrewCtx): string {
  const D = P().downtime;
  const m = b.members[Math.max(0, Math.min(sel, b.members.length - 1))]!;
  const cur = Math.max(0, Math.min(at, D.places.length - 1));
  const off = pagesOf(b).off;
  const cards = map(D.places, (p, i) => {
    const who = b.members.filter((x) => off[x.id]?.day === b.day && off[x.id]?.place === p.id).map((x) => titleName(x.name)).join(', ');
    const fx = [p.stat && p.tenths ? `${p.stat[0]!.toUpperCase()}${p.stat.slice(1)} +${p.tenths / 10}` : '', p.morale ? `Morale +${p.morale}` : '', p.loyalty ? `Loyalty +${p.loyalty}` : '', p.heat ? `Heat ${p.heat}` : '', p.cost ? `Funds −${money(p.cost)}` : 'free'].filter(Boolean).join(' · ');
    return `<button class="ds28${i === cur ? ' on' : ''}" ${go('r5off', i)} data-testid="r5-off-${esc(p.id)}" style="--d:${i * 100}ms"><span class="ic">${SP(p.icon, 64)}</span><small>${esc(p.where)}</small><b>${esc(p.name)}</b><em>${esc(who || 'nobody tonight')}</em><i>${esc(fx)}</i></button>`;
  });
  const wait = offIn(b, m.id);
  const name = titleName(m.name);
  const line = c.notice ?? (b.phase !== 'evening' ? 'Evenings off start in the Evening.' : wait ? `${name} had an evening off lately. Again in ${wait} day${wait === 1 ? '' : 's'}.` : `Where does ${name} go tonight? ◀ ▶ picks the place; ↑↓ the member.`);
  return frame({
    id: 'downtime', g: 'Crew', kind: 'dt28', top: { title: 'Evening off', sub: `${name} · one evening off` }, run: c.run,
    body: `<section class="dg28" data-m="panel">${cards}</section>`,
    who: speaker(m, memberColour(b.members.indexOf(m)), c.team), line, footOpts: c.notice ? { testid: 'dom-notice' } : {},
    ctas: [['Not tonight', 'r5c', 'roster'], [`Send ${name}`, 'r5off', 'send', 'r5-off-send']],
    keys: [['←→', 'place'], ['↑↓', 'member'], ['Enter', 'send'], ['Esc', 'back']], keysOpts: KO(),
  });
}

// ---------- Storm night (mockup `shelter`, kind sh39) ----------

export function r5Shelter(b: DominionBlock, at: number, c: R5CrewCtx): string {
  const S = P().shelter;
  const m = strayFriend(b);
  const name = m ? titleName(m.name) : 'the crew';
  const cur = Math.max(0, Math.min(at, S.choices.length - 1));
  const crew = map(b.members.slice(0, 4), (x, i) => `<i style="--i:${i}">${crewPic(x.look, 120, c.team)}</i>`);
  const opts = map(S.choices, (o, i) => `<button class="o29${i === cur ? ' on' : ''}" ${go('r5storm', i)} data-testid="r5-storm-${esc(o.id)}" style="--i:${i};--d:${i * 100}ms"><b>${esc(o.label)}</b><em>${esc(o.says.replaceAll('{name}', name))}</em></button>`);
  const body = `<section class="sl39" data-m="panel"><i class="wnd" data-nocheck=""><u></u></i><i class="fire" data-nocheck=""></i><span class="crew" data-nocheck="">${crew}</span><i class="pup" data-nocheck="">${SP('p-poochyena', 40)}<u>?</u></i></section>
  <section class="pn ch39" data-m="det"><h3><i>${esc(S.title)}</i></h3><p class="ch39t">${esc(S.text.replaceAll('{name}', name))}</p>${opts}</section>`;
  return frame({
    id: 'shelter', g: 'Crew', kind: 'sh39', bg: 'night', top: { title: 'Storm night', sub: 'The HQ · storm night' }, run: c.run,
    body, who: m ? speaker(m, memberColour(b.members.indexOf(m)), c.team) : null, line: c.notice ?? `“${S.line}”`, footOpts: c.notice ? { testid: 'dom-notice' } : {},
    ctas: [[S.choices.at(-1)!.label, 'r5storm', S.choices.length - 1], [S.choices[0]!.label, 'r5storm', 0]],
    keys: [['↑↓', 'choice'], ['Enter', 'choose'], ['Esc', 'later']], keysOpts: KO(),
  });
}

// ---------- Dressing room (mockup `disguise`, kind dg42) ----------

export function r5Disguise(b: DominionBlock, sel: number, at: number, c: R5CrewCtx): string {
  const O = P().outfits;
  const cur = Math.max(0, Math.min(sel, b.members.length - 1));
  const start = Math.max(0, Math.min(cur - 1, b.members.length - 4));
  const dressed = b.members.filter((m) => outfitOf(b, m.id) !== 'colours').length;
  const pick = O[Math.max(0, Math.min(at, O.length - 1))]!;
  const cards = map(b.members.slice(start, start + 4), (m, k) => {
    const i = start + k;
    const o = O.find((x) => x.id === (i === cur ? pick.id : outfitOf(b, m.id)))!;
    return `<button class="dm42${i === cur ? ' on' : ''}" ${go('r5cSel', i)} data-testid="r5-dress-${i}" style="--d:${k * 110}ms"><span class="mir" data-nocheck="">${crewPic(m.look, 150, c.team)}<i class="cur"></i></span><b>${esc(titleName(m.name))}</b><em>${o.id === 'colours' ? 'in team colours' : `as a ${esc(o.name)}`}</em><small>${esc(o.says)}</small></button>`;
  });
  const m = b.members[cur]!;
  const now = outfitOf(b, m.id);
  const line = c.notice ?? (pick.id === now ? `${titleName(m.name)} is wearing this. ↑↓ tries another outfit.` : `${pick.name}${pick.cost ? ` · ${money(pick.cost)}` : ''}: ${pick.says}. Each kind counts once.`);
  return frame({
    id: 'disguise', g: 'Crew', kind: 'dg42', top: { title: 'Dressing room', sub: `${dressed} of ${b.members.length} dressed` }, run: c.run,
    body: `<section class="dr42" data-m="panel">${cards}</section>`,
    who: speaker(m, memberColour(cur), c.team), line, footOpts: c.notice ? { testid: 'dom-notice' } : {},
    ctas: [['Back', 'r5c', 'roster'], [pick.id === now ? 'Wearing it' : `Wear it${pick.cost ? ` · ${money(pick.cost)}` : ''}`, 'r5dress', 'wear', 'r5-dress-wear']],
    keys: [['←→', 'crew'], ['↑↓', 'outfit'], ['Enter', 'wear']], keysOpts: KO(),
  });
}

// ---------- Boss skills (mockup `skills`, kind sk43) ----------

export function r5Skills(b: DominionBlock, br: number, nd: number, boss: { name: string }, c: R5CrewCtx): string {
  const B = P().skills.branches;
  const got = pagesOf(b).skills;
  const pts = skillPoints(b);
  const bi = Math.max(0, Math.min(br, B.length - 1));
  const ni = Math.max(0, Math.min(nd, B[bi]!.nodes.length - 1));
  let d = 0;
  const tree = map(B, (x, i) => `<div class="br43" style="--c:${x.colour};--b:${i}"><b class="bh">${esc(x.name)}</b>${map(x.nodes, (n, k) => `<i class="nd43${got.includes(n.id) ? ' on' : ''}${i === bi && k === ni ? ' sel' : ''}" ${go('r5skill', `${i}.${k}`)} data-testid="r5-skill-${esc(n.id)}" style="--d:${d++ * 70}ms"><u><span>${k + 1}</span></u><em>${esc(n.name)}</em></i>`)}</div>`);
  const n = B[bi]!.nodes[ni]!;
  const why = cantLearn(b, n.id);
  const det = `<section class="pn sd43" data-m="det"><h3><i>${esc(n.name)}</i></h3><p class="sd43t">${esc(n.says)}</p><div class="row40" style="--i:0;--d:0ms"><b>Needs</b><i>${esc(ni ? B[bi]!.nodes[ni - 1]!.name : 'nothing')}</i></div><div class="row40" style="--i:1;--d:80ms"><b>Cost</b><i>1 point</i></div><div class="row40" style="--i:2;--d:160ms"><b>Path</b><i>${esc(B[bi]!.name)} ${ni + 1} of ${B[bi]!.nodes.length}</i></div></section>`;
  const line = c.notice ?? (why === 'Learned.' ? `${boss.name} already has ${n.name}.` : why ?? `${n.name}: ${n.says}.`);
  return frame({
    id: 'skills', g: 'Crew', kind: 'sk43', top: { title: 'Boss skills', sub: `${pts.free} point${pts.free === 1 ? '' : 's'} to spend` }, run: c.run,
    body: `<section class="st43" data-m="panel">${tree}</section>\n  ${det}` + sr('r5-skill-points', `${pts.free} of ${pts.earned}`),
    who: { name: 'Rotom', k: 'p-rotom' }, line, footOpts: c.notice ? { testid: 'dom-notice' } : {},
    ctas: [['Back', 'r5c', 'roster'], [why ? (why === 'Learned.' ? 'Learned' : 'Locked') : 'Learn it', 'r5skill', 'learn', 'r5-skill-learn']],
    keys: [['←→', 'branch'], ['↑↓', 'skill'], ['Enter', 'learn']], keysOpts: KO(),
  });
}

// ---------- Team tag (mockup `graffiti`, kind gf49) ----------

export interface R5TagPick { symbol: number; colour: number; slogan: number }

export function r5TagColours(b: DominionBlock): string[] {
  const t = b.team;
  const named = [t?.primary, t?.secondary].map((k) => (k ? DOMINION_DATA.founding.colours.find((x) => x.id === k)?.hex : undefined)).filter((x): x is string => !!x);
  return [...new Set([...named, '#e0294a', '#ffd75a', '#5ad1ff', '#7dff9a', '#b98aff'])].slice(0, 5);
}
export function r5TagSlogans(b: DominionBlock): string[] {
  return [...new Set([...(b.team?.motto ? [b.team.motto] : []), ...P().graffiti.slogans])];
}

/** The tag's letter as one spray stroke (the mockup's N), in a 160x200 box at (120,60); other characters fall back to text. */
const STROKES: Record<string, string> = {
  A: 'M0,200 L80,0 L160,200 M30,125 L130,125', B: 'M0,200 L0,0 L110,0 Q150,0 150,50 Q150,95 100,95 L0,95 M100,95 Q160,95 160,148 Q160,200 100,200 L0,200',
  C: 'M160,20 Q130,0 90,0 Q0,0 0,100 Q0,200 90,200 Q130,200 160,180', D: 'M0,200 L0,0 L70,0 Q160,0 160,100 Q160,200 70,200 Z',
  E: 'M160,0 L0,0 L0,200 L160,200 M0,100 L120,100', F: 'M160,0 L0,0 L0,200 M0,100 L120,100',
  G: 'M160,20 Q130,0 90,0 Q0,0 0,100 Q0,200 90,200 Q160,200 160,120 L90,120', H: 'M0,0 L0,200 M160,0 L160,200 M0,100 L160,100',
  I: 'M80,0 L80,200 M30,0 L130,0 M30,200 L130,200', J: 'M160,0 L160,140 Q160,200 90,200 Q20,200 10,150', K: 'M0,0 L0,200 M160,0 L0,120 M50,80 L160,200',
  L: 'M0,0 L0,200 L160,200', M: 'M0,200 L0,0 L80,120 L160,0 L160,200', N: 'M0,200 L30,10 L130,170 L160,0',
  O: 'M80,0 Q0,0 0,100 Q0,200 80,200 Q160,200 160,100 Q160,0 80,0 Z', P: 'M0,200 L0,0 L100,0 Q160,0 160,55 Q160,110 100,110 L0,110',
  Q: 'M80,0 Q0,0 0,100 Q0,200 80,200 Q160,200 160,100 Q160,0 80,0 Z M100,150 L170,215', R: 'M0,200 L0,0 L100,0 Q160,0 160,55 Q160,110 100,110 L0,110 M80,110 L160,200',
  S: 'M160,20 Q130,0 80,0 Q0,0 0,50 Q0,100 80,100 Q160,100 160,150 Q160,200 80,200 Q30,200 0,180', T: 'M0,0 L160,0 M80,0 L80,200',
  U: 'M0,0 L0,130 Q0,200 80,200 Q160,200 160,130 L160,0', V: 'M0,0 L80,200 L160,0', W: 'M0,0 L40,200 L80,80 L120,200 L160,0',
  X: 'M0,0 L160,200 M160,0 L0,200', Y: 'M0,0 L80,100 L160,0 M80,100 L80,200', Z: 'M0,0 L160,0 L0,200 L160,200',
};
const SYMBOL_PATH: Record<string, string> = {
  bolt: 'M300,120 L350,60 L330,118 L380,110 L320,190 L340,130 Z',
  crown: 'M300,185 L300,95 L325,135 L340,70 L355,135 L380,95 L380,185 Z',
  fang: 'M300,80 L380,80 L340,190 Z',
  eye: 'M295,130 Q340,70 385,130 Q340,190 295,130 Z M340,112 L358,130 L340,148 L322,130 Z',
};
/** r50.css resets every property on the page (all: revert), and in SVG 2 `d`, sizes and fills are properties: an SVG
 *  shape carries them in its style as well as its attributes. */
const dp = (d: string, more = ''): string => `d="${d}" style="d:path('${d}')${more ? `;${more}` : ''}"`;
function letter(ch: string, col: string): string {
  const d = STROKES[ch.toUpperCase()];
  if (!d) return `<text class="ln" x="110" y="250" style="x:110px;y:250px;font:900 210px var(--fd);fill:${col};stroke:#000;stroke-width:6px;paint-order:stroke;stroke-dasharray:none">${esc(ch)}</text>`;
  return `<g transform="translate(120 60)" style="transform:translate(120px,60px)"><path class="ol" ${dp(d)}></path><path class="ln" ${dp(d, `stroke:${col}`)}></path></g>`;
}

export function r5Graffiti(b: DominionBlock, pick: R5TagPick, c: R5CrewCtx): string {
  const G = P().graffiti;
  const cols = r5TagColours(b), slos = r5TagSlogans(b);
  const sy = G.symbols[pick.symbol % G.symbols.length]!, col = cols[pick.colour % cols.length]!, slo = slos[pick.slogan % slos.length]!;
  const name = (b.team?.name ?? b.teamName ?? 'Team').replace(/^Team /, '').toUpperCase();
  const initial = b.team?.initial ?? name[0] ?? 'N';
  const wall = `<svg viewBox="0 0 600 328" data-nocheck=""><defs><pattern id="br49" width="56" height="52" patternUnits="userSpaceOnUse"><rect width="56" height="52" style="width:56px;height:52px;fill:#7a3b32"></rect><path ${dp('M0 1.5H56M0 27.5H56M1.5 0V26M29.5 26V52', 'fill:none;stroke:#4a221c;stroke-width:3')}></path></pattern></defs><rect width="600" height="328" style="width:600px;height:328px;fill:url(#br49)"></rect><g class="mist"><circle cx="180" cy="160" r="90" style="cx:180px;cy:160px;r:90px"></circle><circle cx="380" cy="150" r="80" style="cx:380px;cy:150px;r:80px"></circle></g>
    ${letter(initial, col)}<path class="ol bl" ${dp(SYMBOL_PATH[sy.id] ?? SYMBOL_PATH.bolt!)}></path><path class="ln bl" ${dp(SYMBOL_PATH[sy.id] ?? SYMBOL_PATH.bolt!)}></path>
    <g class="dr">${map([[116, 258, 8, 34, 4], [246, 228, 8, 46, 4], [146, 74, 7, 22, 3]], ([x, y, w, h, r]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" style="x:${x}px;y:${y}px;width:${w}px;height:${h}px;rx:${r}px;fill:${col}"></rect>`)}</g>
    <text class="nv" x="330" y="250">${esc(name)}</text><text class="sl" x="122" y="306">${esc(slo.toUpperCase())}</text></svg>`;
  const tagged = pagesOf(b).tag;
  const det = `<section class="pn to49" data-m="det"><h3><i>Your tag</i></h3><small class="lb49">Symbol</small><div class="sy49">${map(G.symbols.slice(0, 3), (s, i) => `<button class="${s === sy ? 'on' : ''}" ${go('r5tag', `s${i}`)} style="--d:${i * 80}ms"><i>${esc(s.glyph)}</i><em>${esc(s.name)}</em></button>`)}</div>
    <small class="lb49">Colour</small><div class="co49">${map(cols, (x, i) => `<i class="${x === col ? 'on' : ''}" ${go('r5tag', `c${i}`)} style="--c:${x};--d:${200 + i * 60}ms"></i>`)}</div>
    <small class="lb49">Slogan</small>${map(slos.slice(0, 3), (s, i) => `<div class="srow${s === slo ? ' on' : ''}" ${go('r5tag', `l${i}`)} style="--i:${3 + i};--d:${180 + i * 60}ms"><b>${esc(s)}</b>${s === slo ? '<i>✓</i>' : ''}</div>`)}</section>`;
  const owned = ownedDistricts(b).length;
  const wait = sprayIn(b);
  const line = c.notice ?? (wait ? `The tag went up lately. Again in ${wait} day${wait === 1 ? '' : 's'}.` : owned ? `Spray it on your ${owned} district${owned === 1 ? '' : 's'}: Dread +${G.dread} each, ${money(owned * G.costPer)} of paint.` : `No district is yours yet: the tag is saved and goes up when you take one.`);
  return frame({
    id: 'graffiti', g: 'Crew', kind: 'gf49', top: { title: 'Team tag', sub: tagged ? 'Sprayed on every district you take' : 'Pick your mark' }, run: c.run,
    body: `<section class="wl49" data-m="panel">${wall}\n    <i class="can49" data-nocheck=""><u></u></i></section>\n  ${det}`,
    who: { name: 'Rotom', k: 'p-rotom' }, line, footOpts: c.notice ? { testid: 'dom-notice' } : {},
    ctas: [['Back', 'r5c', 'roster'], ['Spray it', 'r5tag', 'spray', 'r5-tag-spray']],
    keys: [['←→', 'symbol'], ['↑↓', 'slogan'], ['C', 'colour'], ['Enter', 'spray']], keysOpts: KO(),
  });
}

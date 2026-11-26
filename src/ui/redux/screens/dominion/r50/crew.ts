// DOMINION redesign R5 (pass 50, the Crew group): the roster (mockup `roster`, kind hand14), the Crew File (`file`),
// the personality card (`person`), the Crew ID (`idcard`), Loyalty (`loyalty`), Payday (`payday`) and Uniforms
// (`uniform`). Each page copies its pass-50 markup from plans/evil-mode-rework/redesign-50 and feeds it live data.
// Members wear the team's colours and armband (teamPic, #1553). Live data in, HTML out; the scene keeps the cursors.

import { monName } from '../../../../../core/dominion/crew';
import type { FileModel, PersonaModel } from '../../../../../core/dominion/crewScreens';
import type { R5Band, R5Member, R5Payday } from '../../../../../core/dominion/crewR50';
import type { TeamColours } from '../../../../../core/dominion/founding';
import { DOMINION_DATA } from '../../../../../core/dominion/data';
import { mini } from '../../../kit';
import { R5_SIZES } from './sizes';
import { WHEEL_KEY } from '../views';
import { pngSrc, tallTeam } from '../teamPic';
import { bg, esc, faceOf, foot, frame, go, keys, map, page, rep, SP, type R5Cta, type R5Key, type R5Run, type R5Speaker } from './kit';

/** What every crew page needs from the scene besides its model. */
export interface R5CrewCtx {
  run: R5Run;
  team: TeamColours | null;
  /** A Pokémon's sprite file (the game's atlas), or null. */
  monFile: (species: string) => string | null;
  notice: string | null;
}

/** Ring colours for members (the mockups give each person one); by place on the roster, display only. */
const PAL = ['#3f7fd9', '#6f9a3a', '#e0901c', '#8a6ad9', '#25b3c7', '#a25fe0', '#e0294a', '#3aa86a', '#c9a24a', '#4a8ab0'];
export const memberColour = (i: number): string => PAL[((i % PAL.length) + PAL.length) % PAL.length]!;

/** Hidden from sight, read by screen readers and tests. */
const SR = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
export const sr = (testid: string, text: string): string => `<span${testid ? ` data-testid="${testid}"` : ''} style="${SR}">${esc(text)}</span>`;
/** The command wheel's Q chip at the head of every Crew key strip (as R0's hub; the Nav spec taps it). */
const QCHIP = `<span>${WHEEL_KEY.replace('<span>Wheel</span>', '')}</span>`;
export const KO = (o: { testid?: string; pre?: string } = {}): { testid?: string; pre: string } => ({ ...o, pre: QCHIP + (o.pre ?? '') });
export const money = (n: number): string => `₽${n.toLocaleString('en-US')}`;

/** A member's picture `h` px tall in the team's colours with the armband (a png look or a trainer atlas). */
export function crewPic(look: string, h: number, team: TeamColours | null, cls = '', extra = ''): string {
  if (look.endsWith('.png')) {
    const e = DOMINION_DATA.armbands[look];
    const w = e ? `${Math.round((e.w * h) / e.h)}px` : 'auto';
    return `<img class="px ${cls}" src="${pngSrc(look, team)}" alt="" draggable="false" style="width:${w};height:${h}px"${extra}>`;
  }
  return tallTeam(look, h, team, cls);
}

/** The picture inside a round face of `sz` px (head and shoulders, as the mockups' face()). */
export function crewFaceInner(look: string, sz: number, team: TeamColours | null): string {
  const e = DOMINION_DATA.armbands[look];
  // Scale by where the chin is (headY), so a trainer atlas with room above the head still shows the face.
  const h = e?.headY ? Math.round((sz * 0.78 * e.h) / e.headY) : Math.round(sz * 2.5);
  const w = e ? Math.round((e.w * h) / e.h) : Math.round(h * 0.6);
  const top = e?.headY ? 0 : -Math.round(sz * 0.08);
  return `<span style="position:absolute;left:${-Math.round((w - sz) / 2)}px;top:${top}px;width:${w}px;height:${h}px">${crewPic(look, h, team)}</span>`;
}
export const crewFace = (look: string, sz: number, colour: string, team: TeamColours | null): string => faceOf(crewFaceInner(look, sz, team), sz, colour);

/** A member speaking in the text box. */
export const speaker = (m: { name: string; look: string }, colour: string, team: TeamColours | null): R5Speaker => ({ name: titleName(m.name), pic: crewFaceInner(m.look, 40, team), colour });
export const titleName = (s: string): string => (s === s.toUpperCase() ? s[0] + s.slice(1).toLowerCase() : s);

const bar = (l: string, v: number, max: number, i: number): string =>
  `<div class="bar" style="--i:${i};--d:${i * 60}ms"><span>${esc(l)}</span><i><u style="width:${Math.round((Math.max(0, Math.min(max, v)) / max) * 100)}%"></u></i><b>${v}</b></div>`;

const CREW_KEYS: readonly R5Key[] = [['Enter', 'Choose'], ['Esc', 'Back'], ['Q', 'Wheel']];

// ---------- the roster (pass 14 hand of cards, kind hand14) ----------

export interface R5RosterView { members: readonly R5Member[]; sel: number; head: string }

/** The six cards around the cursor (more members page with ←→). */
function windowOf(n: number, sel: number, size = 6): number[] {
  const start = Math.max(0, Math.min(sel - Math.floor(size / 2) + 1, n - size));
  return Array.from({ length: Math.min(size, n) }, (_, i) => start + i);
}

export function r5Roster(v: R5RosterView, x: R5CrewCtx): string {
  const sel = Math.max(0, Math.min(v.sel, v.members.length - 1));
  const m = v.members[sel];
  const cards = map(windowOf(v.members.length, sel), (i, k) => {
    const c = v.members[i]!;
    return `<button class="hc14${i === sel ? ' on' : ''}" ${go('r5cSel', i)} style="--d:${k * 80}ms" data-testid="r5-card-${i}">${c.word ? '<i class="ph-b hb14">!</i>' : ''}<div class="cd14 " style="--pc:${memberColour(i)}"><div class="cd-h"><b>${esc(titleName(c.name))}</b><em>Lv ${c.level}</em></div><div class="cd-a">${crewPic(c.look, 96, x.team)}<i class="foil" data-nocheck=""></i></div><div class="cd-r">${esc(c.rank)} · rank ${c.rankN}</div><div class="cd-f"><i>${'★'.repeat(c.stars)}</i><em>${esc(c.out ?? c.trait.name)}</em></div></div></button>`;
  });
  const det = m
    ? `<section class="pn hd14" data-m="det"><h3><i>${esc(titleName(m.name))} · ${esc(m.rank)}</i></h3><div class="hs14">${map(m.stats, (s, i) => bar(s.label, s.value, 10, i))}</div><div class="hx14"><p><b>Loyalty</b> ${m.loyalty} · <b>Morale</b> ${m.morale}</p><p><b>${esc(m.trait.name)}</b> ${esc(m.trait.text)}</p><div class="hb"><button class="cta" ${go('r5c', 'school')} data-testid="r5-train">Train</button><button class="cta" ${go('r5c', 'idcard')}>ID card</button><button class="cta" ${go('r5c', 'people')} data-testid="r5-people-btn">People</button><button class="cta on" ${go('r5c', 'file')} data-testid="r5-full-file">Full file</button></div></div></section>`
    : '';
  return frame({
    id: 'roster', g: 'Crew', kind: 'hand14', top: { title: 'Crew roster', crumb: null }, run: x.run,
    body: `<div class="hand14" data-m="panel">${sr('r5-roster-head', v.head)}${cards}</div>\n  ${det}`,
    ...(x.notice ? { who: null, line: x.notice } : {}),
    keys: [['←→', 'card'], ['Enter', 'full file'], ['C', 'card'], ['Y', 'loyalty']],
    keysOpts: KO(),
  });
}

// ---------- the Crew File (kind file, f6) ----------

export function r5File(f: FileModel, m: R5Member, i: number, x: R5CrewCtx, letGoArmed = false): string {
  const tc = f.colours;
  const mons = f.team.slice(0, 3);
  const ace = f.team.reduce<FileModel['team'][number] | null>((a, t) => (!a || t.level > a.level ? t : a), null);
  const first = f.formed[0];
  const traits = first
    ? f.formed.slice(0, 2).map((t, k) => `<div class="trait" style="--i:${k};--d:${k * 60}ms"><b${k === 0 ? ' data-testid="dom-formed"' : ''}>${k === 0 ? esc(t.name) : `Grew: ${esc(t.name)}`}</b><em>${esc(t.text)}${t.live ? '' : ` (works from ${esc(t.needs ?? 'later')})`}</em></div>`).join('')
      + (f.grew ? `<i data-testid="dom-grew" style="${SR}">GREW!</i>` : '')
    : `<div class="trait" style="--i:0;--d:0ms"><b data-testid="dom-green">${esc(f.green)}</b><em>${esc(m.trait.text || `${f.temperament}? Grows at Grunt rank, member Lv 4.`)}</em></div>`;
  const sus = f.double
    ? `<div class="trait" style="--i:2;--d:120ms"><b data-testid="dom-file-double">Double agent</b><em>Feeds the rival what you choose</em></div>`
    : f.suspicion ? `<div class="trait" style="--i:2;--d:120ms"><b data-testid="dom-file-suspicion" style="color:${f.suspicion >= 70 ? '#ff6a7a' : '#ffb238'}">Suspicion ${f.suspicion}</b><em>F confronts ${f.name[0]}${f.name.slice(1).toLowerCase()}</em></div>` : '';
  const big = crewPic(f.look, 190, tc, 'fspr', ' data-testid="dom-file-pic"');
  const body = `<section class="pn f-por" data-m="det" data-testid="dom-file-plate"><div class="plinth big">${big}</div><b class="f-name" data-m="name" data-testid="dom-file-name">${esc(f.name)}</b><em class="f-rank">${esc(m.rank)} · rank ${f.rankN} of 15</em></section>
  <section class="pn f-st" data-m="panel" data-testid="dom-file-stats"><h3><i>Stats</i></h3>${map(f.stats, (s, k) => bar(s.label, s.value, 10, k))}<div class="mons">${map(mons, (t, k) => {
    const file = x.monFile(t.species);
    return `<span style="--i:${k};--d:${k * 60}ms${t.dim ? ';opacity:.45;filter:grayscale(.8)' : ''}">${file ? mini(file, 44) : ''}<b>${esc(monName(t.species))}</b></span>`;
  })}</div></section>
  <section class="pn f-tr"><h3><i>Notes</i></h3><div data-testid="dom-file-personality">${traits}${sus}</div><dl class="facts" data-testid="dom-file-a17"><dt>Loyalty</dt><dd>${f.loyalty}</dd><dt>Morale</dt><dd>${f.morale}</dd><dt>Wage</dt><dd>${money(f.wage)} / week</dd><dt>${ace ? 'Ace' : 'Task'}</dt><dd>${ace ? `${esc(monName(ace.species))} Lv ${ace.level}` : esc(f.out ?? f.task)}</dd></dl>${sr('', `Motive: ${f.motive} · Fatigue ${f.fatigue} · Heat ${f.pHeat} · ${f.xp}`)}</section>`;
  const allKeys = f.keys.map((k) => `${k.key} ${k.label}`).join(' · ');
  return frame({
    id: 'file', g: 'Crew', kind: 'file f6', style: `--pc:${memberColour(i)}`, top: { title: `Crew file · ${titleName(f.name)}`, crumb: null }, run: x.run,
    body,
    who: x.notice ? null : speaker({ name: f.name, look: f.look }, memberColour(i), tc), line: x.notice ?? (f.out ? f.out : f.now.line.replace(/^"|"$/g, '')),
    footOpts: { testid: x.notice ? 'dom-notice' : 'dom-file-now' },
    ctas: [['Back', 'r5c', 'roster'], [letGoArmed ? `Yes, let ${titleName(f.name)} go` : 'Let go', 'r5letgo', '', 'r5-letgo'], ['Assign', 'r5c', 'assign']],
    keys: [['←→', 'member'], ...f.keys.slice(0, 3).map((k) => [k.key, k.label] as const), ['Esc', 'Back']],
    keysOpts: KO({ testid: 'dom-file-keys', pre: sr('', allKeys) }),
  });
}

// ---------- the personality card (kind file, f6) ----------

export function r5Person(p: PersonaModel, m: R5Member, i: number, x: R5CrewCtx): string {
  const tc = x.team;
  const body = `<section class="pn f-por" data-m="det" data-testid="dom-persona-card"><div class="plinth big" data-testid="dom-persona-photo">${crewPic(p.look, 190, tc, 'fspr')}</div><b class="f-name" data-m="name" data-testid="dom-persona-name">${esc(p.name.toUpperCase())}</b><em class="f-rank">${esc(m.rank)} · the ${esc(p.traits[1]?.name ?? p.traits[0]?.name ?? '')}</em>${sr('', `${p.name.toUpperCase()} · ${p.rank}`)}</section>
  <section class="pn f-st" data-m="panel"><h3><i>Stats</i></h3>${bar('Loyalty', m.loyalty, 100, 0)}${bar('Morale', m.morale, 100, 1)}${bar('Suspicion', m.suspicion, 100, 2)}<div data-testid="dom-persona-memory" style="margin-top:14px;font-size:12px;line-height:1.35;color:var(--mut)">${map(p.memory, (r) => `<p>Day ${r.day}: ${esc(r.line)}</p>`)}</div></section>
  <section class="pn f-tr"><h3><i>Notes</i></h3><div data-testid="dom-persona-effects">${sr('', `What ${p.his} traits do`)}${map(p.traits, (t, k) => {
    const fx = p.effects.filter((e) => e.trait === t.name).map((e) => e.text + (e.needs ? ` (${e.needs})` : '')).join(' · ');
    return `<div class="trait" style="--i:${k};--d:${k * 60}ms"><b data-testid="dom-persona-trait">${esc(t.name)}</b><em>${esc(fx || p.quirk)}</em></div>`;
  })}</div><dl class="facts"><dt>Wants</dt><dd>${esc(p.want)}</dd><dt>Fears</dt><dd>${esc(p.fear)}</dd><dt>Home town</dt><dd data-testid="dom-persona-home">${esc(p.home)}</dd></dl>${p.rotom ? `<p data-testid="dom-persona-rotom" style="${SR}">Rotom: ${esc(p.rotom.text)}</p>` : `<p data-testid="dom-persona-rotom" style="${SR}">${esc(p.rotomOff)}</p>`}</section>`;
  return frame({
    id: 'person', g: 'Crew', kind: 'file f6', style: `--pc:${memberColour(i)}`, top: { title: 'Personality card', crumb: null }, run: x.run,
    body,
    who: x.notice ? null : speaker({ name: p.name, look: p.look }, memberColour(i), tc), line: x.notice ?? (p.rotom ? p.rotom.text : p.offline),
    footOpts: { testid: 'dom-persona-line' },
    ctas: [['Back', 'r5c', 'file']],
    keys: CREW_KEYS,
  });
}

// ---------- the Crew ID (kind id) ----------

export function r5Id(m: R5Member, i: number, band: R5Band, x: R5CrewCtx, line: string): string {
  const col = band.colours?.primary ?? '#6d6d78';
  const team = band.team ? band.team.toUpperCase() : 'NO TEAM YET';
  const body = `<section class="idc" style="--pc:${memberColour(i)}" data-m="panel"><div class="idc-h"><span class="nb-sig">${esc(band.initial || '?')}</span><b>${esc(team)} · CREW ID</b><em>No. ${String(i + 1).padStart(4, '0')}</em></div>
    <div class="idc-b"><div class="idc-ph">${crewPic(m.look, 150, x.team)}${band.initial ? `<i class="idc-arm" data-nocheck="" style="background:${col}">${esc(band.initial)}</i>` : ''}</div><div class="idc-t"><b class="idc-n">${esc(titleName(m.name))}</b><em>${esc(m.rank)} · rank ${m.rankN} of 15 · Lv ${m.level}</em>
    <div class="idc-stripes">${rep(15, (k) => `<i class="${k < m.rankN ? 'on' : ''}"></i>`)}</div>${map(m.stats, (s, k) => bar(s.label, s.value, 10, k))}<p class="idc-tr"><b>${esc(m.trait.name)}</b> · Loyalty ${m.loyalty} · Morale ${m.morale}</p></div></div></section>
  <section class="pn idc-side" data-m="det"><h3><i>Armband</i></h3><div class="arm6" style="--c:${col};background:${col}"><i>${esc(band.initial || '?')}</i></div><p>${band.colours ? `${esc(band.colourName)}, with the ${esc(band.team || 'team')} mark. Rank stripes show under it: ${esc(titleName(m.name))} has ${band.stripes === 1 ? 'one' : band.stripes}.` : 'Grey for now. The team’s colours go on at the Founding (O).'}</p><p>${m.gender === 'm' ? 'Male Grunts only, like every team.' : 'Admins and up wear the band on the left arm.'}</p></section>`;
  return frame({
    id: 'idcard', g: 'Crew', kind: 'id', top: { title: `Crew ID · ${titleName(m.name)}`, crumb: null }, run: x.run,
    body,
    who: x.notice ? null : speaker(m, memberColour(i), x.team), line: x.notice ?? line,
    ctas: [['Full file', 'r5c', 'file']],
    keys: [['←→', 'next member'], ['Enter', 'full file']],
    keysOpts: KO(),
  });
}

// ---------- Loyalty (kind ly33) ----------

export function r5Loyalty(rows: readonly { id: string; name: string; look: string; loyalty: number; i: number }[], sel: number, x: R5CrewCtx, voice: { m: { name: string; look: string }; i: number; line: string } | null): string {
  const low = DOMINION_DATA.crew.rules.disloyalAt;
  const body = `<section class="lb33" data-m="panel">${map(rows, (r, k) => `<div class="lr33 ${r.loyalty >= 80 ? 'hi' : r.loyalty >= 60 ? 'ok' : 'lo'}${k === sel ? ' on' : ''}" style="--l:${r.loyalty}%;--d:${k * 80}ms" ${go('r5cSel', r.i)}>${crewFace(r.look, 40, memberColour(r.i), x.team)}<b>${esc(titleName(r.name))}</b><span class="lb33b"><i></i></span><em>${r.loyalty}</em></div>`)}</section>
  <section class="pn lw33" data-m="det"><h3><i>What moves it</i></h3>${map([['up', 'Paying on time, raises and gifts'], ['up', 'Promoting them, hearing them out'], ['dn', 'Late wages, cuts, being passed over'], ['dn', `Under ${low}: they may quit, steal or sell you out`]] as const, ([d, t], k) => `<div class="chg ${d}" style="--i:${k};--d:${k * 60}ms"><i>${d === 'up' ? '▲' : '▼'}</i><b>${esc(t)}</b></div>`)}</section>`;
  const sub = rows.length && rows[rows.length - 1]!.loyalty < low ? `${titleName(rows[rows.length - 1]!.name)} could walk` : 'Who would stay';
  return frame({
    id: 'loyalty', g: 'Crew', kind: 'ly33', top: { title: 'Loyalty', sub }, run: x.run,
    body,
    who: x.notice || !voice ? null : speaker(voice.m, memberColour(voice.i), x.team), line: x.notice ?? voice?.line ?? '',
    ctas: [['Back', 'r5c', 'roster'], ['Payday', 'r5c', 'payday']],
    keys: [['↑↓', 'crew'], ['Enter', 'file'], ['Esc', 'back']],
    keysOpts: KO(),
  });
}

// ---------- Payday (kind pd32) ----------

const MOOD_EMO: Record<string, [string, string]> = { Thrilled: ['love', '♥'], Fair: ['joy', '♪'], Expected: ['dots', '…'], 'Wants more': ['mad', '#'], 'Unpaid rank': ['dots', '…'] };

export function r5Payday(p: R5Payday, idx: (id: string) => number, sel: number, x: R5CrewCtx, voice: { m: { name: string; look: string }; i: number; line: string } | null): string {
  const rows = p.rows.slice(0, 6);
  const body = `<section class="pay32" data-m="panel">${map(rows, (r, k) => {
    const e = MOOD_EMO[r.mood] ?? ['mad', '!'];
    return `<div class="pc32${k === sel ? ' on' : ''}" style="--d:${k * 90}ms" ${go('r5cPay', k)}>${crewFace(r.look, 56, memberColour(idx(r.id)), x.team)}<span class="tx"><b>${esc(titleName(r.name))}</b><em>${esc(r.mood)}</em></span><span class="env"><i>${money(r.wage)}</i></span><i class="em32 e-${e[0]}">${e[1]}</i></div>`;
  })}</section>`;
  return frame({
    id: 'payday', g: 'Crew', kind: 'pd32', top: { title: 'Payday', sub: `Week ${p.week} · ${money(p.total)} total` }, run: x.run,
    body,
    who: x.notice || !voice ? null : speaker(voice.m, memberColour(voice.i), x.team), line: x.notice ?? voice?.line ?? '',
    ctas: [['Back', 'r5c', 'loyalty'], [p.today ? 'Paid tonight' : `Next pay Day ${p.nextDay}`, 'r5c', 'roster']],
    keys: [['↑↓', 'crew'], ['Esc', 'back']],
    keysOpts: KO(),
  });
}

// ---------- Uniforms (kind uni24) ----------

export function r5Uniform(ms: readonly R5Member[], sel: number, band: { initial: string; colour: string | null }, x: R5CrewCtx, voice: { m: { name: string; look: string }; i: number; line: string } | null): string {
  const win = windowOf(ms.length, sel);
  const body = `<div class="line24" data-nocheck=""></div>
  <section class="par24" data-m="panel">${map(win, (i, k) => {
    const m = ms[i]!;
    return `<button class="pu24${i === sel ? ' on' : ''}" style="--d:${k * 110}ms" ${go('r5cSel', i)}><span class="sp">${crewPic(m.look, 108, x.team)}</span><i class="ab24"${band.colour ? ` style="--c:${band.colour}"` : ''}><u>${esc(band.initial || '?')}</u>${esc(m.rank)}</i><b>${esc(titleName(m.name))}</b></button>`;
  })}</section>`;
  const worn = band.colour ? `${ms.length} crew in armbands` : 'Grey bands until the Founding';
  return frame({
    id: 'uniform', g: 'Crew', kind: 'uni24', top: { title: 'Uniforms', sub: worn }, run: x.run,
    body,
    who: x.notice || !voice ? null : speaker(voice.m, memberColour(voice.i), x.team), line: x.notice ?? voice?.line ?? '',
    ctas: [['Back', 'r5c', 'roster'], ['Full file', 'r5c', 'file']],
    keys: [['←→', 'crew'], ['Enter', 'inspect'], ['Esc', 'back']],
    keysOpts: KO(),
  });
}

export const r5CrewCta = (l: string, page: string): R5Cta => [l, 'r5c', page];
export { SP };

// ---------- the Rank Pyramid (kind grid, g-pyr) ----------

export interface R5PyramidExtras {
  /** Members in pyramid order (the cursor walks it) and the one under the cursor. */
  order: readonly R5Member[]; sel: number;
  /** The Boss's cell picture and name. */
  boss: { pic: string; name: string };
  /** Index of each member on the roster (their ring colour). */
  idx: (id: string) => number;
}

export function r5Pyramid(m: import('../../../../../core/dominion/reserveScreens').PyramidModel, x: R5PyramidExtras, c: R5CrewCtx): string {
  const P = DOMINION_DATA.pyramid.ranks;
  const cur = x.order[Math.min(x.sel, x.order.length - 1)];
  type Cell = { html: string };
  let d = 0;
  const cell = (inner: string, cls: string, colour: string, extra = ''): Cell => ({ html: `<button class="cell${cls}" style="--pc:${colour};--i:${d};--d:${d++ * 50}ms"${extra}>${inner}</button>` });
  const memberCell = (mm: R5Member): Cell => cell(`<i class="rr14">${'★'.repeat(mm.stars)}</i><span class="cs">${crewPic(mm.look, 40, c.team)}</span><b>${esc(mm.rank)}</b><em>${esc(titleName(mm.name))}</em>`, mm.id === cur?.id ? ' on' : '', memberColour(x.idx(mm.id)), ` ${go('r5pyr', x.order.indexOf(mm))}`);
  const open = (label: string): Cell => cell(`<i class="plus">+</i><b>${esc(label)}</b><em>open</em>`, ' empty', '#3a2a34');
  // Tiers top-down: a tier shows when someone holds it, it's the next rank for the cursor, or it has an open seat.
  const rows: { n: number; hot: boolean; cells: Cell[] }[] = [];
  for (const t of m.tiers) {
    if (t.n === 16) continue;
    const ids = t.n === 2 ? ['recruit', 'hopeful'] : [P[t.n - 1]!.id];
    const who = x.order.filter((mm) => ids.includes(mm.rankId));
    const opens = t.seats.filter((s) => s !== 'f').length;
    if (!who.length && !t.hot) continue;
    const label = titleName(t.n === 2 ? 'Recruit' : t.label);
    const shown = who.slice(0, opens && who.length >= 4 ? 3 : 4).map(memberCell);
    if (who.length > shown.length) shown.push(cell(`<i class="plus">+${who.length - shown.length}</i><b>${esc(label)}</b><em>more</em>`, ' empty', '#3a2a34'));
    else if (opens && !t.locked && shown.length < 4) shown.push(open(label));
    rows.push({ n: t.n, hot: t.hot, cells: shown });
  }
  // Five rows fit (the Boss and four): when more ranks are held, keep the ones nearest the cursor's rank.
  const near = rows.length > 4 ? [...rows].sort((a, z) => Math.abs(a.n - (cur?.rankN ?? 3)) - Math.abs(z.n - (cur?.rankN ?? 3)) || z.n - a.n).slice(0, 4).sort((a, z) => z.n - a.n) : rows;
  d = 0;
  const bossRow = `<div class="pyr-r" data-testid="dom-tier-16">${cell(`<i class="rr14">★★</i><span class="cs">${x.boss.pic}</span><b>Boss</b><em>${esc(x.boss.name)}</em>`, '', '#e0294a', ` ${go('r5edge', 'on')} title="Boss Edge (E)"`).html}<span style="${SR}">THE BOSS</span></div>`;
  const filled = x.order.length;
  const head = `15 ranks · ${filled} seat${filled === 1 ? '' : 's'} filled`;
  const seat = m.head ? `${m.head} · ${m.headRight}. ${m.alert ?? m.info[0] ?? ''}` : 'No crew yet.';
  const body = `<section class="pn g-main" data-m="panel"><h3><i>${esc(head)}</i></h3>${bossRow}${map(near, (r) => `<div class="pyr-r${r.hot ? ' hot' : ''}" data-testid="dom-tier-${r.n}">${r.cells.map((q) => q.html).join('')}</div>`)}${map(m.tiers.filter((t) => t.n !== 16 && !near.some((r) => r.n === t.n)), (t) => `<span data-testid="dom-tier-${t.n}" class="${t.hot ? 'hot' : ''}" style="${SR}">${esc(t.label)}</span>`)}</section>`;
  // The mockup's page has no text box: the seat line is read out, the promotion is the Enter key; a notice opens the box.
  return frame({
    id: 'pyramid', g: 'Crew', kind: 'grid g-pyr', top: { title: 'Rank Pyramid', crumb: null }, run: c.run,
    body: body + sr('dom-crew-count', m.crew) + sr('dom-seat', seat) + (m.cta.ok ? '' : sr('dom-promote', m.cta.text)),
    ...(c.notice ? { who: null, line: c.notice, footOpts: { testid: 'dom-notice' } } : {}),
    keys: [['↑↓', 'member'], m.cta.ok ? ['Enter', m.cta.text, 'promoteIt', 'dom-promote'] : ['Enter', 'Choose'], ['Esc', 'Back']],
    keysOpts: KO(),
  });
}

// ---------- Promotion night (kind pm43) ----------

export interface R5Promo { m: R5Member; i: number; from: string; to: string; unlocks: string; crowd: readonly R5Member[]; boss: string; line: string }

export function r5Promo(p: R5Promo, c: R5CrewCtx): string {
  const cnf = rep(14, (k) => `<i style="--x:${(k * 33) % 72}%;--d:${(k % 7) * 0.25}s;--c:${['#ffd75a', '#e0294a', '#fff', '#5ab4ff'][k % 4]}"></i>`);
  const body = `<i class="hb42" data-nocheck=""></i><i class="sp43" data-nocheck=""></i>
  <div class="stg43" data-nocheck=""><span class="crowd">${map(p.crowd.slice(0, 4), (mm, k) => `<i style="--i:${k}">${crewPic(mm.look, 80, c.team)}</i>`)}</span><span class="hero">${crewPic(p.m.look, 150, c.team)}<i class="medal"></i></span><span class="boss">${p.boss}</span><span class="cnf">${cnf}</span></div>
  <div class="rk43" data-m="card" data-testid="r5-promo-card"><small>Promotion</small><b>${esc(p.m.name.toUpperCase())}</b><span><i>${esc(p.from)}</i><u>▶</u><i class="n">${esc(p.to)}</i></span><em>${esc(p.unlocks)}</em></div>${c.notice ? sr('dom-notice', c.notice) : ''}`;
  // A full-screen moment: no top bar and no tabs (mockup), only the text box and the key strip.
  return page({ id: 'promo', g: 'Crew', kind: 'pm43', body: bg('night', 'Crew', c.run) + body + foot(speaker(p.m, memberColour(p.i), c.team), p.line, [['Back', 'r5promo', 'pyramid'], ['Applause', 'r5promo', 'roster']], 'Crew', c.run) + keys([['Enter', 'applause']], 'Crew', c.run, KO()) });
}

// ---------- Squads (kind grid, g-cards) ----------

/** The squad cards (the builder and the order picker keep the D8 page: the mockups have no page for them). */
export function r5Squads(m: import('../../../../../core/dominion/squadScreens').SquadsModel, c: R5CrewCtx, sel: number): string {
  const cards = m.cards;
  const n = cards.length + (m.locked ? 0 : 1);
  let d = 0;
  const cells = map(cards, (q, i) => {
    const stars = q.cohesion >= 60 ? 3 : q.cohesion >= 30 ? 2 : 1;
    return `<button class="cell${q.sel || i === sel ? ' on' : ''}" style="--pc:${q.color || '#25b3c7'};--i:${d};--d:${d++ * 50}ms" ${go('sqCard', i)} data-testid="dom-squad-${esc(q.id)}"><i class="rr14">${'★'.repeat(stars)}</i><span class="cs">${q.leader ? crewPic(q.leader.look, 64, c.team) : ''}</span><b>${esc(q.codeName.toUpperCase())}</b><em>${esc(q.leader ? titleName(q.leader.name) : 'No leader')} · ${esc(q.n)} · ${esc(q.band)} · Cohesion ${q.cohesion}</em>${sr('', `${q.today.text} · ${q.trait}`)}</button>`;
  });
  const add = m.locked ? '' : `<button class="cell empty" style="--pc:#3a2a34;--i:${d};--d:${d * 50}ms" ${go('sqRow', 'name')}><i class="plus">+</i><b>New squad</b><em>Needs a leader of Sergeant rank</em></button>`;
  const body = `<section class="pn g-main" data-m="panel"><h3><i>${esc(m.count)}</i></h3><div class="cells n${Math.max(3, n)}">${cells}${add}</div>${m.locked ? `<p style="margin:8px 4px 0;color:var(--mut)">${esc(m.locked)}</p>` : ''}</section>`;
  return frame({
    id: 'squads', g: 'Crew', kind: 'grid g-cards', top: { title: 'Squads', crumb: null }, run: c.run,
    body: body + sr('dom-sq-count', m.count),
    ...(c.notice ? { who: null, line: c.notice, footOpts: { testid: 'dom-notice' } } : {}),
    keys: [['←→', 'squad'], ['Enter', 'orders'], ['N', 'new'], ['E', 'edit'], ['Esc', 'Back'], ['Q', 'Wheel']],
    keysOpts: KO(),
  });
}

// ---------- Confront: the spy in the crew (mockups `interro` and `spy`, kind scene sm-talk) ----------

export interface R5ConfrontExtras { boss: { pic: string; name: string }; at: number; draft: string; colour: string }

/** The D22 Confront room as a pass-50 talk scene: the Boss and the member face to face, the questions (and Accuse /
 *  Drop it) as the choices, the line you type under them, the member's answer in the text box, the tell and the turns
 *  left as chips. The four endings are the rules' to pick; they are read out with the clues and the intercepted note. */
export function r5Confront(m: import('../../../../../core/dominion/spyScreens').SpyModel, x: R5ConfrontExtras, c: R5CrewCtx): string {
  const U = m.ui;
  const n = m.questions.length;
  const row = (i: number, label: string, off: boolean, testid: string, title: string): string =>
    `<button class="ch${x.at === i ? ' on' : ''}" ${go('spyRow', i)} data-over="spyOver" data-testid="${testid}" title="${esc(title)}" style="--i:${i};--d:${i * 90}ms;padding:4px 14px${off ? ';opacity:.5' : ''}"><kbd>${i + 1}</kbd><b>${esc(label)}</b></button>`;
  const chs = m.questions.map((q, i) => row(i, q.short, q.off, `dom-spy-q-${q.id}`, `${q.label}: ${q.sub}`)).join('')
    + row(n, U.accuse!, false, 'dom-spy-accuse', U.truth!) + row(n + 1, U.drop!, false, 'dom-spy-drop', `${U.drop!}: Suspicion −15`);
  const type = `<label class="ch" style="--i:${n + 2};--d:${(n + 2) * 90}ms;padding:2px 8px 2px 14px;cursor:text"><kbd>⌨</kbd><input data-testid="dom-spy-type" maxlength="120" autocomplete="off" spellcheck="false" placeholder="${esc(U.typeHint!)}" value="${esc(x.draft)}" style="flex:1;min-width:0;height:30px;border:0;outline:none;background:transparent;color:var(--cr);font:600 15px var(--fb)"><b ${go('spySay')} data-testid="dom-spy-say" style="flex:none;white-space:nowrap;padding-right:6px;font-size:15px;color:var(--yel);cursor:pointer">${esc(U.say!)}</b></label>`;
  const last = m.turns.at(-1);
  const pick = x.at < n ? m.questions[x.at]! : null;
  const line = c.notice ?? (last ? last.them : m.clues.at(-1)?.text ?? U.empty!);
  const chips = `<span class="tb-chips">${m.tell ? `<i data-testid="dom-spy-tell" style="color:${m.tell.colour};border-color:${m.tell.colour}">${esc(m.tell.word)}</i>` : ''}${m.chip ? `<i data-testid="dom-spy-chip">✦ ${esc(m.chip)}</i>` : ''}${m.waiting ? `<i data-testid="dom-spy-wait">✦ ${esc(U.thinking!)}</i>` : ''}<i>${m.left} left</i></span>`;
  const memberPic = crewPic(m.look, 250, c.team, 'flip');
  const body = `<i class="hb42" data-nocheck=""></i>
  <div class="act l" style="--pc:#e0294a"><span style="display:block;height:250px;display:flex;align-items:flex-end">${x.boss.pic}</span><span class="plate vs17"><b>${esc(x.boss.name)}</b><em>The Boss</em></span></div>
  <div class="act r" style="--pc:${x.colour}"><span data-testid="dom-spy-member" style="display:flex;align-items:flex-end;height:250px">${memberPic}</span><span class="plate vs17"><b>${esc(titleName(m.name))}</b><em>Suspicion ${m.sus} · ${esc(m.levelWord.toLowerCase())}</em></span></div>
  <nav class="chs" style="gap:5px">${chs}${type}</nav>
  <section class="tbox" data-m="box" data-testid="dom-spy-talk"><span class="spk6" style="--pc:${x.colour}">${faceOf(crewFaceInner(m.look, 62, c.team), 62, x.colour)}<b>${esc(titleName(m.name))}</b></span><p${c.notice ? ` data-testid="dom-notice" ${go('dismiss')}` : last ? ' data-testid="dom-spy-reply"' : ''}>${esc(line)}</p>${last ? sr('', `${U.you!}: “${last.you}”`) : ''}${sr('', `${m.left} left`)}${chips}<i class="more">▼</i></section>`
    + sr('dom-spy-title', `${U.title!} · ${m.name}`) + sr('dom-spy-sus', String(m.sus)) + `<span data-testid="dom-spy-suspicion" style="${SR}">${map(m.clues, (q) => `<span data-testid="dom-spy-clue">D${q.day} ${esc(q.text)}</span>`)}</span>`
    + sr('dom-spy-note', m.note) + sr('dom-spy-photo', `${m.name} beside the rival Boss`) + sr('dom-spy-hint', pick ? `${pick.label} · ${pick.sub}` : U.truth!)
    + map(m.ends, (e) => sr(`dom-spy-end-${e.id}`, `${e.label}: ${e.sub}`));
  return page({ id: 'interro', g: 'Crew', kind: 'scene sm-talk many pg-interro', body: bg('cell', 'Crew', c.run) + body + keys([['↑↓', 'choose'], ['Enter', 'ask'], ['Esc', 'end'], ['Q', 'Wheel']], 'Crew', c.run) });
}

// ---------- Training (mockup `school`, kind list) ----------

export function r5Train(t: import('../../../../../core/dominion/crewR50').R5Training, at: number, i: number, c: R5CrewCtx): string {
  const cur = Math.max(0, Math.min(at, t.rows.length - 1));
  const r = t.rows[cur];
  const rows = map(windowOf(t.rows.length, cur, 5), (k, d) => {
    const q = t.rows[k]!;
    return `<button class="row${k === cur ? ' on' : ''}" ${go('r5train', k)} data-testid="r5t-row-${esc(q.id)}" style="--i:${d};--d:${d * 60}ms${q.locked ? ';opacity:.55' : ''}">${SP(q.icon, 30, 'ico')}<span class="row-t"><b>${esc(q.label)}${q.current ? ' · now' : ''}</b><em>${esc(q.sub)}</em></span><i class="tag num">${esc(q.tag)}</i></button>`;
  });
  const name = titleName(t.member);
  const det = r
    ? `<section class="pn l-det" data-m="det"><div class="plinth">${crewPic(t.look, 110, c.team, 'dspr')}</div><b class="det-t">${esc(r.label)}</b><p>${esc(r.level)}</p><p>${esc(r.locked ?? `${r.uses} · ${r.risk}`)}</p>${r.locked ? '' : `<button class="cta on" ${go('r5train', 'send')} data-testid="r5t-send">${esc(r.current ? `${name} is on it` : `Send ${name}`)}</button>`}</section>`
    : '';
  return frame({
    id: 'school', g: 'Crew', kind: 'list', style: `--pc:${memberColour(i)}`, top: { title: 'Training', sub: name }, run: c.run,
    body: `<section class="pn l-main" data-m="panel"><h3><i>${esc(t.count)}</i></h3>${rows}</section>\n  ${det}`,
    ...(c.notice ? { who: null, line: c.notice, footOpts: { testid: 'dom-notice', lineAct: 'dismiss' } } : {}),
    keys: [['↑↓', 'task'], ['Enter', `send ${name}`], ['Esc', 'Back']],
    keysOpts: KO(),
  });
}

// ---------- Mole hunt (mockup `mole`, kind mo33): the clue wall ----------

const POL = [[70, 120, -3], [300, 100, 2], [520, 130, -2]] as const;
const PINS = [[150, 170], [380, 150], [600, 180]] as const;

export function r5Mole(w: import('../../../../../core/dominion/crewR50').R5Mole, sel: number, c: R5CrewCtx, voice: { m: { name: string; look: string }; i: number } | null): string {
  const n = w.suspects.length;
  const cur = Math.max(0, Math.min(sel, n - 1));
  const s = w.suspects[cur];
  const pols = map(w.suspects, (q, k) => {
    const [x, y, r] = POL[k]!;
    return `<button class="pol33${k === cur ? ' on' : ''}" ${go('r5mole', k)} data-testid="r5-suspect-${k}" style="left:${x}px;top:${y}px;--r:${r}deg;--d:${k * 200}ms;border:0;font:inherit;cursor:pointer"><i class="pin" data-nocheck=""></i>${crewFace(q.look, 96, memberColour(q.i), c.team)}<b>${esc(titleName(q.name))}</b><em>${esc(q.clue)}</em>${sr('', `Suspicion ${q.sus}`)}</button>`;
  });
  const pts = PINS.slice(0, n);
  const paths = n > 1 ? `<path d="M${pts.map((p) => p.join(',')).join(' L')}"></path>` + (w.note ? `<path d="M${pts[0]!.join(',')} C300,330 520,330 760,300"></path><path d="M${pts[n - 1]!.join(',')} L760,300"></path>` : '') : '';
  const note = w.note ? `<div class="clue33" style="left:735px;top:262px" data-nocheck="">${esc(w.note.text)}, Day ${w.note.day}</div>` : '';
  const line = c.notice ?? (n ? `${n === 1 ? 'One name' : `${['', '', 'Two', 'Three'][n]} names`} on the wall. Questioning needs Suspicion ${w.confrontAt}.` : 'No names on the wall yet. Clues turn up as the days go by.');
  const ctas: R5Cta[] = [['Back', 'r5c', 'roster'], ...(s ? [[`Question ${titleName(s.name)}`, 'r5mole', 'ask', 'r5-mole-ask'] as R5Cta] : [])];
  return frame({
    id: 'mole', g: 'Crew', kind: 'mo33', top: { title: 'Mole hunt', sub: 'The clue wall' }, run: c.run, noTabs: true,
    body: `<div class="cork33" data-nocheck=""></div>\n  <svg class="str33" viewBox="0 0 960 540" data-nocheck="">${paths}</svg>\n  ${pols}\n  ${note}`,
    who: voice ? speaker(voice.m, memberColour(voice.i), c.team) : null, line, ctas, ...(c.notice ? { footOpts: { testid: 'dom-notice' } } : {}),
    keys: [['←→', 'suspect'], ['Enter', 'question'], ['Esc', 'back']],
    keysOpts: KO(),
  });
}

// ---------- New card (mockup `pull`, kind pull14): a member who just joined ----------

export function r5Pull(p: import('../../../../../core/dominion/crewR50').R5Pull, i: number, c: R5CrewCtx): string {
  const m = p.m;
  const body = `<i class="hb42" data-nocheck=""></i><div class="rw-burst" data-nocheck=""></div><div class="pk14" data-nocheck=""><i></i><i></i></div>
  <div class="pl14" data-m="ttl"><small>Applications desk · hired</small><b>NEW CARD!</b></div>
  <div class="big14" data-testid="r5-pull-card"><div class="cd14 big" style="--pc:${memberColour(i)}"><div class="cd-h"><b>${esc(titleName(m.name))}</b><em>Lv ${m.level}</em></div><div class="cd-a">${crewPic(m.look, 150, c.team)}<i class="foil" data-nocheck=""></i></div><div class="cd-r">${esc(m.rank)} · rank ${m.rankN}</div><div class="cd-f"><i>${'★'.repeat(m.stars)}</i><em>${esc(m.trait.name)}</em></div></div></div>
  <div class="pi14"><div class="nfx" style="--d:900ms">${SP('g-idcard', 30)}<span><b>Joins the crew</b><em>${esc(p.beds)}</em></span></div><div class="nfx" style="--d:1050ms">${SP('g-black-belt', 30)}<span><b>Best stat: ${esc(p.best.label)} ${p.best.value}</b><em>${esc(m.trait.text)}</em></span></div><div class="nfx" style="--d:1200ms">${SP('g-amulet-coin', 30)}<span><b>${p.wage ? `Wage ${money(p.wage)} a week` : 'No wage yet'}</b><em>${p.wage ? 'Paid on Payday' : 'Wages start at a paid rank'}</em></span></div></div>`;
  const line = c.notice ?? `${titleName(m.name)} joined the crew.`;
  return page({ id: 'pull', g: 'Crew', kind: 'pull14', body: bg('night', 'Crew', c.run) + body + foot(speaker(m, memberColour(i), c.team), line, [['Open file', 'r5c', 'file'], ['To the roster', 'r5c', 'roster']], 'Crew', c.run, { testid: 'dom-notice' }) + keys([['Enter', 'to the roster'], ['Esc', 'back']], 'Crew', c.run, KO()) });
}

// ---------- Boss Edge (mockup `levelup`, kind lu43) ----------

export function r5Edge(e: import('../../../../../core/dominion/crewR50').R5Edge, boss: { pic: string; name: string }, c: R5CrewCtx): string {
  const rows = map(e.rows, (r, k) => `<div class="sr43" style="--d:${k * 120}ms"><b>${esc(r.label)}</b><i>${r.value}</i><em class="${r.max ? '' : 'up'}">${r.max ? 'max' : `${r.xp}/${r.need}`}</em></div>`);
  const body = `<div class="bn43" data-nocheck="">${boss.pic}<i class="ring"></i></div>
  <div class="lv43w" data-m="card" data-testid="r5-edge"><b class="h">${esc(boss.name.toUpperCase())}’s Edge</b>${rows}<p class="ul43">Each point: <b>+${e.perPoint}% on jobs you play yourself</b></p></div>`;
  const line = c.notice ?? `Edge grows on the jobs you play yourself. Each stat stops at ${e.cap}.`;
  return frame({
    id: 'levelup', g: 'Crew', kind: 'lu43', bg: 'night', top: { title: 'Boss Edge', sub: 'XP to the next point' }, run: c.run, noTabs: true,
    body, who: { name: 'Rotom', k: 'p-rotom' }, line, ctas: [['Back', 'r5edge', 'off', 'r5-edge-back']],
    keys: [['Enter', 'back'], ['Esc', 'back']],
    keysOpts: KO(),
  });
}

// ---------- People you know (mockup `people`, kind people) ----------

export function r5People(sides: readonly import('../../../../../core/dominion/crewR50').R5PeopleSide[], sel: number, c: R5CrewCtx): string {
  let d = 0;
  const face = (p: import('../../../../../core/dominion/crewR50').R5Person, colour: string): string => {
    if (p.i !== null) return crewFace(p.sprite, 56, memberColour(p.i), c.team);
    const z = p.sprite ? R5_SIZES[p.sprite] : undefined;
    if (z) {
      // As the mockup: the picture 140px tall, centred, its head in the 56px ring (`.face img` sits at 0,0 of its box).
      const w = Math.round((z[0] * 140) / z[1]);
      return `<span class="face" data-nocheck="" style="--c:${colour};width:56px;height:56px"><span style="position:absolute;left:${Math.round((56 - w) / 2)}px;top:-4px;width:${w}px;height:140px">${SP(p.sprite, 140)}</span></span>`;
    }
    return `<span class="face" data-nocheck="" style="--c:${colour};width:56px;height:56px;display:flex;align-items:center;justify-content:center;font:700 26px var(--fd);color:#fff">${esc(p.name[0] ?? '?')}</span>`;
  };
  const html = map(sides, (s, k) => `<div class="pp-side" style="--pc:${s.colour};--d:${k * 120}ms"><h4>${esc(s.title)}</h4><div class="pp-row">${map(s.people.slice(0, 6), (p) => {
    const dd = d++ * 50;
    return p.i !== null
      ? `<button class="pp-f${p.i === sel ? ' on' : ''}" ${go('r5cSel', p.i)} data-testid="r5-pp-${p.i}" style="--d:${dd}ms">${face(p, s.colour)}<b>${esc(titleName(p.name))}</b></button>`
      : `<span class="pp-f" style="--d:${dd}ms">${face(p, s.colour)}<b>${esc(p.name)}</b></span>`;
  })}</div></div>`);
  return frame({
    id: 'people', g: 'Crew', kind: 'people', top: { title: 'People you know', crumb: null }, run: c.run,
    body: `<section class="pp-wrap" data-m="panel">${html}</section>`,
    ...(c.notice ? { who: null, line: c.notice, footOpts: { testid: 'dom-notice' } } : {}),
    keys: [['←→', 'person'], ['Enter', 'open file'], ['Esc', 'Back']],
    keysOpts: KO(),
  });
}

// ---------- A heart-to-heart (mockup `heart`, kind scene sm-talk): a crew talk card waiting for an answer ----------

/** The crew's talk cards (internal interactions, D3) as the pass-50 talk scene: the Boss and the member face to face,
 *  the answers as the choices, the member's words in the text box. The rules pick what each answer does. */
export function r5Heart(t: import('../../../../../core/dominion/crewScreens').TalkModel, who: { look: string; i: number; sub: string } | null, boss: { pic: string; name: string }, at: number, c: R5CrewCtx): string {
  const colour = who ? memberColour(who.i) : '#25b3c7';
  const chs = map(t.choices, (q, i) => `<button class="ch${i === at ? ' on' : ''}" ${go('talk', i)} data-over="talkOver" data-testid="dom-talk-${i}" style="--i:${i};--d:${i * 90}ms"><kbd>${i + 1}</kbd><b>${esc(q)}</b></button>`);
  const body = `<i class="hb42" data-nocheck=""></i>
  <div class="act l" style="--pc:#e0294a"><span style="display:flex;align-items:flex-end;height:250px">${boss.pic}</span><span class="plate vs17"><b>${esc(boss.name)}</b><em>The Boss</em></span></div>
  <div class="act r" style="--pc:${colour}">${who ? `<span style="display:flex;align-items:flex-end;height:250px">${crewPic(who.look, 250, c.team, 'flip')}</span>` : ''}<span class="plate vs17"><b>${esc(titleName(t.name))}</b><em>${esc(who?.sub ?? t.title)}</em></span></div>
  <nav class="chs">${chs}</nav>
  <section class="tbox" data-m="box" data-testid="dom-talk"><span class="spk6" style="--pc:${colour}">${who ? faceOf(crewFaceInner(who.look, 62, c.team), 62, colour) : ''}<b>${esc(titleName(t.name))}</b></span><p>${esc(t.text)}</p><span class="tb-chips"><i>${esc(t.title)}</i></span><i class="more">▼</i></section>`;
  return page({ id: 'heart', g: 'Crew', kind: 'scene sm-talk', body: bg('night', 'Crew', c.run) + body + keys([['↑↓', 'choose'], ['Enter', 'your call']], 'Crew', c.run, KO()) });
}

// The Pocket look's Summary (mock-up pages `summary`, `summary-moves`, `summary-bond`): the Pokémon's trading card on
// the left, the tabs over one panel. Stats is a radar with the nature, ability, held item and weaknesses beside it;
// Moves is the four move cards with the lit one's numbers and words; Bond is the big hearts and what it remembers.
// The game's other tabs (Overview, Items, History, Traits) are drawn in the same pieces. It draws what
// ui/pokemonMenu.ts hands it (ui/redux/screens/party.ts); the menu keeps the state and the keys. Presentation only.

import type { SummaryBody, SummaryModel } from '../../redux/screens/party';
import { badgeArt, itemArt } from '../art';
import { act, esc, hdr, keys, page, type PkKey, typeColour } from '../kit';
import { fit, fitBody, fitPic, pkArtOf } from '../templates';
import { pkMonCard, tyChip } from './party';

const RADAR = [[120, 24], [196.2, 68], [196.2, 156], [120, 200], [43.8, 156], [43.8, 68]] as const;
const LABEL_AT = [[120, 2, ''], [203, 64, 'rt'], [203, 160, 'rt'], [120, 222, ''], [37, 160, 'lf'], [37, 64, 'lf']] as const;
/** The game lists HP, Atk, Def, SpA, SpD, Spe; the radar goes round HP, Attack, Defense, Speed, Sp. Def, Sp. Atk. */
const ROUND = [0, 1, 2, 5, 4, 3];
const ring = (f: number): string => RADAR.map(([x, y]) => `${(120 + (x - 120) * f).toFixed(1)},${(112 + (y - 112) * f).toFixed(1)}`).join(' ');

/** The stats radar: each stat's reach is its bar (its base stat against the scale), never past the edge. */
export function radar(rows: readonly { label: string; value: number; pct: number; up: boolean; down?: boolean }[]): string {
  const at = ROUND.map((i) => rows[i]).filter((r): r is NonNullable<typeof r> => !!r);
  const pts = at.map((r, k) => { const f = Math.max(0.12, Math.min(1, r.pct / 100)), [x, y] = RADAR[k]!; return `${(120 + (x - 120) * f).toFixed(1)},${(112 + (y - 112) * f).toFixed(1)}`; }).join(' ');
  const spokes = RADAR.map(([x, y]) => `<line x1="120" y1="112" x2="${x}" y2="${y}" class="rg2"></line>`).join('');
  const labels = at.map((r, k) => { const [x, y, side] = LABEL_AT[k]!; return `<span style="left:${x}px;top:${y}px" class="${r.up ? 'up' : r.down ? 'dn' : ''} ${side}">${esc(r.label)}<b>${r.value}</b></span>`; }).join('');
  return `<div class="radar" data-key="sm-radar"><svg viewBox="0 0 240 224" width="240" height="224"><polygon points="${ring(1)}" class="rg1"></polygon><polygon points="${ring(0.67)}" class="rg2"></polygon><polygon points="${ring(0.34)}" class="rg2"></polygon>${spokes}${at.length === 6 ? `<polygon points="${pts}" class="rv"></polygon>` : ''}</svg>${labels}</div>`;
}

const box = (label: string, title: string, text: string, pic = ''): string =>
  `<div><span>${esc(label)}</span><b style="font-size:${fit(title, 300, 17, 13, 0.55)}px">${pic}${esc(title)}</b>${text ? `<em style="font-size:${fitBody(text, 300, 34, [13, 12, 11], 1.3)}px">${esc(text)}</em>` : ''}</div>`;
const pips = (pp: string): string => {
  const [a, b] = pp.split('/').map((x) => Number(x.trim()));
  const on = b ? Math.ceil(((a ?? 0) / b) * 5) : 5;
  return `<i class="pp">${Array.from({ length: 5 }, (_, i) => `<u class="${i < on ? 'on' : ''}"></u>`).join('')}</i>`;
};

function body(d: SummaryModel, b: SummaryBody): string {
  const x = d.extra;
  if (b.kind === 'stats') {
    const side = [x ? box('Nature', x.nature[0], x.nature[1]) : '', x?.ability ? box('Ability', x.ability[0], x.ability[1]) : '', x?.held ? box('Held item', x.held[0], x.held[1], x.held[2] ? fitPic(itemArt(x.held[2]), 16, 16, '', 1) : '') : '',
      x && x.weak.length ? `<div><span>Weak to</span><b class="tyrow">${x.weak.map(tyChip).join('')}</b></div>` : ''].join('');
    const iv = b.rows.map((r) => r.iv).join(' / '), ev = b.rows.map((r) => r.ev).join(' / ');
    const foot = [`IV ${iv}`, `EV ${ev}`, b.foot, b.versus].filter(Boolean).join(' · ');
    return `<div class="gx-sm-stats">${radar(b.rows.map((r, k) => ({ ...r, down: x?.down === k })))}<small class="gx-sm-foot" style="font-size:${fitBody(foot, 300, 52, [11.5, 10.5, 10], 1.3)}px">${esc(foot)}</small></div><div class="fx12">${side}</div>`;
  }
  if (b.kind === 'moves') {
    if (!b.moves.length) return '<div class="fx12"><div><b>No moves.</b></div></div>';
    const cur = b.moves[b.cursor] ?? b.moves[0]!;
    const kinds = x?.moveKinds ?? [];
    const [type, kind] = (b.facts.find(([k]) => k.startsWith('Type'))?.[1] ?? '').split(' · ');
    const [power, acc] = (b.facts.find(([k]) => k.startsWith('Power'))?.[1] ?? '').split(' / ');
    const text = [x?.moveText ?? '', ...b.lines.map((l) => l.replace(/^• /, ''))].filter(Boolean).join(' ');
    const stab = x?.types && kind && kind.toLowerCase() !== 'status' && x.types.some((t) => t.toLowerCase() === cur.type.toLowerCase()) ? `Same type as ${x.name}: 1.5× power` : '';
    return `<div class="mv12" data-key="sm-moves">${b.moves.map((m, k) => `<div class="mr${k === b.cursor ? ' on' : ''}" style="--t:${typeColour(m.type)}"${act('cursor', k)}>${fitPic(badgeArt(m.type), 24, 24, '', 2)}<b style="font-size:${fit(m.name, 150, 17, 13, 0.56)}px">${esc(m.name)}</b><span>${esc(kinds[k] ?? '')}</span>${pips(m.pp)}<em>PP ${esc(m.pp)}</em></div>`).join('')}</div>`
      + `<div class="mv12-d" style="--t:${typeColour(cur.type)}" data-key="sm-move"><b style="font-size:${fit(cur.name, 300, 32, 20, 0.5)}px">${esc(cur.name)}</b><div class="mv12-n"><span><b>${esc(power || '—')}</b>Power</span><span><b>${esc(acc || '—')}</b>Accuracy</span><span><b>${esc(kind || '—')}</b>Kind</span></div><p style="font-size:${fitBody(text, 300, 150, [14.5, 13.5, 12.5, 11.5], 1.45)}px">${esc(text)}</p><div class="tyrow">${tyChip(type || cur.type)}${stab ? `<em>${esc(stab)}</em>` : ''}</div></div>`;
  }
  if (b.kind === 'items') {
    if (!b.items.length) return `<div class="bd-log"><b>Held items</b><p><em>None</em><span>${esc(b.summary)} Held items come from drafts, shops and events.</span></p></div>`;
    const from = Math.max(0, Math.min(b.items.length - 4, b.cursor - 1)), cur = b.items[b.cursor] ?? b.items[0]!;
    const text = b.lines.join(' ');
    return `<div class="mv12" data-key="sm-items">${b.items.slice(from, from + 4).map((it, q) => { const k = from + q; return `<div class="mr${k === b.cursor ? ' on' : ''}" style="--t:#f2a900"${act('cursor', k)}>${fitPic(pkArtOf(it.art), 28, 28, '', 2)}<b style="font-size:${fit(it.name, 200, 17, 12, 0.56)}px">${esc(it.name)}</b><span>${esc(it.mode)}</span></div>`; }).join('')}${b.items.length > 4 ? `<small class="gx-sm-more">${from + 1}–${Math.min(b.items.length, from + 4)} of ${b.items.length}</small>` : ''}</div>`
      + `<div class="mv12-d" style="--t:#f2a900" data-key="sm-item"><b style="font-size:${fit(cur.name, 300, 32, 18, 0.5)}px">${esc(cur.name)}</b><p style="font-size:${fitBody(text, 300, 220, [14.5, 13, 12, 11, 10], 1.4)}px">${esc(text)}</p><div class="tyrow"><em>${esc(b.summary)}</em>${b.takeOff ? `<i class="gx-sm-take"${act('takeoff')}>Take off</i>` : ''}</div></div>`;
  }
  if (b.kind === 'overview') {
    const facts = b.facts.slice(0, 7).map(([k, v]) => `<p><em>${esc(k)}</em><span style="font-size:${fitBody(v, 250, 36, [13.5, 12.5, 11.5], 1.3)}px">${esc(v)}</span></p>`).join('');
    return `<div class="fx12 gx-sm-ov">${b.ability ? box('Ability', b.ability.name, b.ability.text) : ''}${b.note ? box('Now', d.face.name, b.note) : ''}<div><span>Moves</span><b class="tyrow">${b.moves.map((m) => `<span class="ty" style="--t:${typeColour(m.type)}">${fitPic(badgeArt(m.type), 16, 16, 'ty-i', 1)}${esc(m.name)}</span>`).join('')}</b></div></div><div class="bd-log gx-sm-facts">${facts}</div>`;
  }
  // Bond, History, Traits: the big hearts when it is the Bond tab, and the rest as the mock-up's log of lines.
  const bond = x?.bond && b.bars.length ? `<div class="bd12" data-key="sm-bond"><div class="bd-big">${Array.from({ length: 5 }, (_, i) => `<u${i < x.bond!.hearts ? '' : ' class="gx-off"'}>♥</u>`).join('')}</div><b style="font-size:${fit(x.bond.mood, 260, 30, 18, 0.5)}px">${esc(x.bond.mood)}</b><span style="font-size:${fitBody(x.bond.hint, 260, 40, [14, 13, 12], 1.35)}px">${esc(x.bond.hint)}</span><div class="gx-sm-bars">${b.bars.map((r) => `<p><span>${esc(r.label)}</span><i><u style="width:${Math.max(0, Math.min(100, r.value))}%"></u></i><b>${r.value}</b></p>`).join('')}</div></div>` : '';
  const rows = b.sections.flatMap((s) => s.lines.map((l, i) => `<p><em>${i ? '' : esc(s.title)}</em><span>${esc(l.replace(/^[•→★] /, ''))}</span></p>`));
  const room = bond ? 10 : 12, shown = rows.slice(0, room);
  const all = b.sections.flatMap((s) => s.lines).join(' ');
  return `${bond}<div class="bd-log${bond ? '' : ' gx-wide'}" data-key="sm-log"><b>${esc(b.head || d.tabs[d.tab] || '')}</b><div class="gx-sm-rows" style="font-size:${fitBody(all, bond ? 420 : 640, 300, [14, 13, 12, 11], 1.3)}px">${shown.join('')}</div>${rows.length > room ? `<small>…and ${rows.length - room} more</small>` : ''}</div>`;
}

export function pkSummary(d: SummaryModel): string {
  const f = d.face, card = d.card ? pkMonCard(d.card, -1, false) : '';
  const t1 = typeColour(f.types[0]), t2 = typeColour(f.types[1] ?? f.types[0]);
  const ks: PkKey[] = d.hints.map(([k, t]) => [k, t] as const);
  const menu = d.menu
    ? `<i class="gx-shade"${act('menuBack')}></i><div class="gx-sm-menu pn" data-key="sm-menu">${d.menu.options.map((o, k) => `<div class="btn sm${k === d.menu!.index ? ' on' : ''}${o.off ? ' gx-dim' : ''}"${act('menu', k, 'menuOver')}><b>${esc(o.label)}</b></div>`).join('')}<p style="font-size:${fitBody(d.text, 240, 60, [13, 12, 11], 1.3)}px">${esc(d.text)}</p></div>`
    : '';
  // The Moves and Bond tabs are mock-up pages of their own (`summary-moves`, `summary-bond`).
  const tabName = (d.tabs[d.tab] ?? '').toLowerCase(), id = tabName === 'moves' ? 'summary-moves' : tabName === 'bond' ? 'summary-bond' : 'summary';
  return page(id, 26, `<div class="scr summary sm12" style="--t:${t1};--t2:${t2}" data-key="summary">${hdr(d.title, { area: 'party', crumb: ['Party', f.name], pills: d.count ? [d.count] : [] })}`
    + `<div class="sm-card">${card}</div><div class="tabs t12">${d.tabs.map((t, k) => `<span class="tab${k === d.tab ? ' on' : ''}"${act('tab', k)}>${esc(t)}</span>`).join('')}</div>`
    + `<div class="sm12-b pn" data-key="sm-body">${body(d, d.body)}</div>${keys(ks)}${menu}</div>`);
}

// The Pocket look's pages after a win (mock-ups `victory`, `exp` and `levelup`): the Victory page (the MVP, who you
// beat, the prize and a star rating), the Team EXP page (a card per Pokémon with its bar) and the Level Up page (the
// stat table, old to new). BattleScene hands them what the battle already decided. Presentation only.

import type { Art } from '../../redux/templates';
import { rxUrl } from '../../redux/assets';
import { badgeArt, ballArt, itemArt, monArt } from '../art';
import { act, esc, page, sprH, stars, typeColour } from '../kit';
import { fit, fitBody, fitPic, pkArtOf } from '../templates';

const bold = (t: string): string => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const bar = (say: string, go: string, word = 'Next', key = 'res-say'): string =>
  `<div class="vs-say" data-key="${key}"><p style="font-size:${fitBody(say.replace(/\*\*/g, ''), 700, 52, [18, 16, 14], 1.35)}px">${bold(say)}</p><div class="btn on nx"${act(go)}><b>${esc(word)}</b></div></div>`;
const bg = (file: string | null | undefined): string => (file ? `<img class="px ar-bg dim" src="${esc(rxUrl(file))}" alt="" data-key="res-bg">` : '');
const coin = (h: number): string => sprH(itemArt('amulet_coin'), h, 'coin');

export interface PkVictoryModel {
  /** The battle's arena picture (dimmed behind the page), or null. */
  backdrop: string | null;
  /** The Pokémon that did the most (its picture and name under the MVP rosette). */
  mvp: { file: string | null; name: string; type: string } | null;
  /** Who was beaten: a Trainer's picture (or the wild Pokémon's), the name, what they said. */
  foe: { trainer: Art | null; mon: string | null; name: string; line: string; type: string };
  /** The rows: what, how much, and a small note ("96", "Thunder Punch"). */
  rows: readonly (readonly [string, string, string?])[];
  /** The prize total ("₽ 2,480"), or null when there was none. */
  total: string | null;
  stars: number;
  rate: string;
  /** The bar's line; ** ** marks bold. */
  say: string;
}

export function pkVictory(d: PkVictoryModel): string {
  const mvp = d.mvp ? `<div class="vic-mon" data-key="vic-mon">${d.mvp.file ? fitPic(monArt(d.mvp.file), 222, 243, '', 4) : ''}<i class="rosette"><b data-nocheck>MVP</b><span style="font-size:${fit(d.mvp.name, 80, 12, 9, 0.6)}px">${esc(d.mvp.name)}</span></i></div>` : '';
  const pic = d.foe.trainer ? sprH(pkArtOf(d.foe.trainer), 148) : d.foe.mon ? fitPic(monArt(d.foe.mon), 106, 120, '', 3) : '';
  const foe = `<div class="vp-foe"><i class="ab-por" style="--t:${typeColour(d.foe.type)}">${pic}</i><div><small>You defeated</small><b style="font-size:${fit(d.foe.name, 300, 30, 18, 0.6)}px">${esc(d.foe.name)}</b>${d.foe.line ? `<span style="font-size:${fitBody(d.foe.line, 300, 44, [15, 13, 12], 1.3)}px">"${esc(d.foe.line)}"</span>` : ''}</div></div>`;
  const rows = d.rows.map(([k, v, s], i) => `<div class="vp-r"><span>${esc(k)}</span><b>${i === 0 && d.total ? coin(16) : ''}${esc(v)}${s ? ` <small>${esc(s)}</small>` : ''}</b></div>`).join('');
  const tot = d.total ? `<div class="vp-tot"><span>Total</span><b>${coin(32)}${esc(d.total)}</b></div>` : '';
  const rate = `<div class="vp-rate">${stars(d.stars)}<b>${esc(d.rate)}</b></div>`;
  return page('victory', 26, `<div class="scr res vic" style="--c:#ffcb05" data-key="victory">${bg(d.backdrop)}<i class="ct-rays"></i><div class="vic-t"><b>Victory!</b></div>${mvp}<div class="vic-p pn" data-key="vic-p">${foe}${rows}${tot}${rate}</div>${bar(d.say, 'next')}</div>`);
}

export interface PkExpRow {
  file: string | null;
  name: string;
  types: readonly string[];
  level: number;
  /** The level it reached, when it grew. */
  to: number | null;
  /** Its bar before and after, 0 to 100. */
  from: number;
  now: number;
  gain: number | null;
  fainted: boolean;
}

export interface PkExpModel {
  rows: readonly PkExpRow[];
  say: string;
}

export function pkExp(d: PkExpModel): string {
  const card = (r: PkExpRow, i: number): string => {
    const up = r.to !== null && r.to > r.level;
    const t = typeColour(r.types[0]), t2 = typeColour(r.types[1] ?? r.types[0]);
    const note = r.fainted ? '<span>Fainted. No EXP this time.</span>' : r.gain ? `<b>+ ${r.gain.toLocaleString('en-US')} EXP</b><span>${up ? 'Level up!' : `${Math.max(0, Math.round(100 - r.now))}% to next level`}</span>` : '<span>No EXP this time.</span>';
    return `<div class="xc${up ? ' up' : ''}${r.fainted ? ' fnt' : ''}" style="--t:${t};--t2:${t2}" data-key="xc-${i}"><span class="xc-s">${r.file ? fitPic(monArt(r.file), 74, 81, '', 3) : ''}</span><div class="xc-b"><div class="xc-1"><b style="font-size:${fit(r.name, 110, 18, 12, 0.6)}px">${esc(r.name)}</b><span class="lv">Lv ${r.level}</span>${up ? `<em class="up">▲ Lv ${r.to}</em>` : ''}</div><span class="xpb"><u style="width:${up ? 100 : r.from}%"></u><i style="width:${r.now}%"></i></span><div class="xc-3">${note}</div></div></div>`;
  };
  return page('exp', 26, `<div class="scr res expp" style="--c:#59b7ff" data-key="exp"><i class="glow"></i><div class="rs-h"><b>Team EXP</b><span>Everyone who is still standing shares it.</span></div><div class="xc-grid" data-key="xc-grid">${d.rows.slice(0, 6).map(card).join('')}</div>${bar(d.say, 'next')}</div>`);
}

export interface PkLevelModel {
  file: string | null;
  name: string;
  types: readonly string[];
  from: number;
  to: number;
  /** Each stat: its name, its new value and how much it grew. */
  stats: readonly (readonly [string, number, number])[];
  /** The battle's words under the page (its text box). */
  say: string;
  /** The Next button's action. */
  go: string;
}

export function pkLevel(d: PkLevelModel): string {
  const t = typeColour(d.types[0]), t2 = typeColour(d.types[1] ?? d.types[0]);
  const top = Math.max(10, Math.ceil((Math.max(0, ...d.stats.map((s) => s[1])) * 1.15) / 10) * 10);
  const rows = d.stats.map(([k, n, p]) => `<div class="lr"><b>${esc(k)}</b><span class="old">${n - p}</span><i class="lr-bar"><u style="width:${(100 * (n - p)) / top}%"></u><i style="width:${(100 * n) / top}%"></i></i><span class="new">${n}</span><em>${p >= 0 ? '+' : ''}${p}</em></div>`).join('');
  const stage = `<div class="stagec" style="--t:${t};--t2:${t2}" data-key="lv-stage"><i class="cone"></i><i class="floor"></i>${d.file ? fitPic(monArt(d.file), 296, 324, 'st-mon', 5) : ''}<div class="lv-stamp"><small>Lv ${d.from}</small><b>Lv ${d.to}</b></div></div>`;
  return page('levelup', 26, `<div class="scr res lvl" style="--c:${t}" data-key="levelup"><i class="glow"></i>${stage}<div class="rs-h"><b>Level Up</b><span>${esc(d.name)} got stronger.</span></div><div class="lv-table" data-key="lv-table">${rows}</div>${d.say ? bar(d.say, d.go, 'Next', 'lv-say') : ''}</div>`);
}

export interface PkCatch {
  file: string | null;
  name: string;
  level: number;
  types: readonly string[];
  /** "Calm nature · Insomnia". */
  about: string;
  /** The ball's picture id ("pb") and the line beside it ("Caught in a Poké Ball · Kanto, stage 12"). */
  ball: string;
  where: string;
  /** The first of its kind this run. */
  fresh: boolean;
}

/** The capture page's pieces over the battle (mock-up `capture`): the ball with its stars, the three shakes and Click!, and the catch card. */
export function pkCatchParts(d: PkCatch): string {
  const t = typeColour(d.types[0]), t2 = typeColour(d.types[1] ?? d.types[0]);
  const chip = (x: string): string => `<span class="ty" style="--t:${typeColour(x)}">${sprH(badgeArt(x), 16, 'ty-i')}${esc(x.charAt(0).toUpperCase() + x.slice(1))}</span>`;
  return `<div class="cap-ball" data-key="cap-ball">${sprH(ballArt(d.ball), 60)}<i class="cap-st">★</i><i class="cap-st s2">★</i><i class="cap-st s3">★</i></div>`
    + '<div class="cap-shk" data-key="cap-shk"><u></u><u></u><u></u><b>Click!</b></div>'
    + `<div class="catchc" style="--t:${t};--t2:${t2}" data-key="catchc"><span class="xc-s">${d.file ? fitPic(monArt(d.file), 86, 86, '', 3) : ''}</span><div class="cc-b"><div class="cc-1"><b style="font-size:${fit(d.name, 170, 28, 16, 0.5)}px">${esc(d.name)}</b><span class="lv">Lv ${d.level}</span>${d.fresh ? '<em class="new">New!</em>' : ''}</div><div class="cc-2">${d.types.map(chip).join('')}${d.about ? `<span>${esc(d.about)}</span>` : ''}</div><div class="cc-3">${sprH(ballArt(d.ball), 18)}<span style="font-size:${fitBody(d.where, 330, 20, [13, 12, 11], 1.3)}px">${esc(d.where)}</span></div></div></div>`;
}

export interface PkLearnMove { name: string; type: string; category: string; pp: string }
export interface PkLearnModel {
  mon: string;
  /** How many moves it knows now. */
  count: number;
  next: PkLearnMove & { power: string; accuracy: string; text: string };
  /** The moves it knows (the rows to forget). */
  moves: readonly PkLearnMove[];
  /** A free slot: the first option learns it without forgetting anything. */
  room: boolean;
  /** The lit option (the scene's menu index: the free slot first when there is one, then the moves, then "don't learn"). */
  index: number;
  /** The answer once chosen ("Turtwig learned Razor Leaf!"): it stays until the next input. */
  result?: string | null;
}

/** The New Move page (mock-up `movelearn`): the new move's card, the four it knows, and Keep old moves / Learn it. */
export function pkLearn(d: PkLearnModel): string {
  const room = d.room ? 1 : 0, last = room + d.moves.length, at = d.index;
  const cat = (c: string): string => c.charAt(0).toUpperCase() + c.slice(1);
  const chip = (x: string): string => `<span class="ty" style="--t:${typeColour(x)}">${sprH(badgeArt(x), 16, 'ty-i')}${esc(cat(x))}</span>`;
  const n = d.next;
  const card = `<div class="ml-new" style="--t:${typeColour(n.type)}" data-key="ml-new">${sprH(badgeArt(n.type), 160, 'mv-m')}<small>Wants to learn</small><b style="font-size:${fit(n.name, 350, 58, 30, 0.5)}px">${esc(n.name)}</b><div class="ml-r">${chip(n.type)}<em>${esc(cat(n.category))}</em></div><div class="ml-s"><span>Power<b>${esc(n.power)}</b></span><span>Accuracy<b>${esc(n.accuracy)}</b></span><span>PP<b>${esc(n.pp)}</b></span></div><p style="font-size:${fitBody(n.text, 250, 60, [14, 13, 12, 11], 1.3)}px">${esc(n.text)}</p></div>`;
  const row = (m: PkLearnMove, i: number): string => `<div class="mv3${i === at ? ' on' : ''}" style="--t:${typeColour(m.type)}" data-key="ml-${i}"${act('pick', i, 'over')}>${sprH(badgeArt(m.type), 80, 'mv-m')}<b style="font-size:${fit(m.name, 190, 26, 16, 0.5)}px">${esc(m.name)}</b><span class="mv-r"><i>${esc(cat(m.category))}</i><i>PP ${esc(m.pp)}</i></span></div>`;
  const free = room ? `<div class="mv3 gx-ml-free${at === 0 ? ' on' : ''}" style="--t:${typeColour(n.type)}" data-key="ml-free"${act('pick', 0, 'over')}><b>Free slot</b><span class="mv-r"><i>Learn it, forget nothing</i></span></div>` : '';
  const old = at >= room && at < last ? d.moves[at - room] : null;
  const cmp = old ? `<b>${esc(old.name)}</b> out, <b>${esc(n.name)}</b> in.` : at < room ? `<b>${esc(n.name)}</b> goes in the free slot. Nothing is forgotten.` : `Keep the ${d.moves.length} moves ${esc(d.mon)} knows.`;
  const list = `<div class="ml-list" data-key="ml-list"><small>${room ? 'Learn it, or forget one?' : 'Forget which one?'}</small>${free}${d.moves.map((m, k) => row(m, k + room)).join('')}<div class="ml-cmp">${cmp}</div></div>`;
  const say = old ? `Forget **${old.name}** and learn **${n.name}**?` : at < room ? `Learn **${n.name}** in the free slot?` : `Give up on **${n.name}** and keep the old moves?`;
  const head = `<div class="rs-h"><b>New Move</b><span>${esc(room ? `${d.mon} knows ${d.count} ${d.count === 1 ? 'move' : 'moves'}. There is room for one more.` : `${d.mon} already knows ${d.count} moves. Swap one out?`)}</span></div>`;
  const bar = d.result ? `<div class="vs-say" data-key="ml-say"><p>${esc(d.result)}</p><div class="btn on nx"${act('done')}><b>Next</b></div></div>` : `<div class="vs-say" data-key="ml-say"><p>${bold(say)}</p><div class="btn nx2"${act('pick', last)}><b>Keep old moves</b></div>${at < last ? `<div class="btn on nx"${act('pick', at)}><b>Learn it</b></div>` : ''}</div>`;
  return page('movelearn', 26, `<div class="scr res mlearn" style="--c:${typeColour(n.type)}" data-key="movelearn"><i class="glow"></i>${head}${card}${list}${bar}</div>`);
}

export interface PkEvolveModel {
  from: { file: string | null; name: string };
  to: { file: string | null; name: string; types: readonly string[] };
  /** The stats that grow most ("Defense", "Sp. Def"). */
  ups: readonly string[];
  /** The old form is glowing (its shape only); B can stop it. */
  sil: boolean;
  /** The new form is out. */
  done: boolean;
  /** B stops it (your own Pokémon, while it glows). */
  stoppable: boolean;
  text: string;
}

/** The Evolution page (mock-up `evolve`): the form in the middle, the old one small once the new is out, the facts as chips. */
export function pkEvolve(d: PkEvolveModel): string {
  const t = typeColour(d.to.types[0]);
  const now = d.done ? d.to.file : d.from.file;
  const big = now ? `<div class="ct-mon${d.sil ? ' gx-sil' : ''}" data-key="ct-mon">${fitPic(monArt(now), 210, 255, '', 5)}</div>` : '';
  const from = d.done && d.from.file ? `<div class="ct-from" data-key="ct-from">${fitPic(monArt(d.from.file), 111, 141, '', 3)}<i>➜</i></div>` : '';
  const chips = d.done
    ? [`<span>${esc(d.from.name)} became <b>${esc(d.to.name)}</b></span>`, d.to.types.length ? `<span>Type: <b>${esc(d.to.types.map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' / '))}</b></span>` : '', d.ups.length ? `<span>${esc(d.ups.map((u) => `${u} ▲`).join(' · '))}</span>` : '']
    : [d.stoppable ? '<span>Hold <b>B</b> during the glow to stop it</span>' : ''];
  const say = d.text ? `<div class="vs-say" data-key="evo-say"><p style="font-size:${fitBody(d.text, 700, 52, [18, 16, 14], 1.35)}px">${esc(d.text)}</p><div class="btn on nx"${act('next')}><b>Next</b></div></div>` : '';
  return page('evolve', 26, `<div class="scr cut cevo" style="--c:${d.done ? t : '#b06cff'}" data-key="evolve"><i class="ct-rays"></i>${from}${big}<div class="ct-title"><small>${esc(d.from.name)}</small><b>Evolution</b></div><div class="ct-chips" data-key="ct-chips">${chips.join('')}</div>${say}</div>`);
}

// The Pocket look's Party (mock-up page `party`, Final Cut): the team as a hand of trading cards, the lit one raised
// with a gold rim, under them what the lit one knows with its PP, then the coming Gym's matchups (each Pokémon weak,
// strong, even or resisting against the Gym's type) and Rotom's tip. It draws what ui/pokemonMenu.ts hands it
// (ui/redux/screens/party.ts); the menu keeps the state and the keys. Presentation only.

import type { PartyCard, PartyModel } from '../../redux/screens/party';
import { badgeArt, itemArt, monArt, typeArt } from '../art';
import { act, esc, frontRotom, hdr, hp, keys, page, type PkKey, spr, typeColour } from '../kit';
import { fit, fitPic } from '../templates';

const pctOf = (p: { hp: number; maxHp: number }): number => (p.maxHp > 0 ? Math.max(0, Math.min(100, Math.round((p.hp / p.maxHp) * 100))) : 0);
const hearts = (n: number): string => `<i class="bond">${Array.from({ length: 5 }, (_, i) => `<u class="${i < n ? 'on' : ''}">♥</u>`).join('')}</i>`;
/** A type as the mock-up's chip: its badge, then its name. */
export const tyChip = (t: string): string => `<span class="ty" style="--t:${typeColour(t)}">${fitPic(badgeArt(t), 16, 16, 'ty-i', 1)}${esc(t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())}</span>`;

/** One Pokémon as the mock-ups' trading card (the Party hand, and the Summary's left card when `k` is -1). */
export function pkMonCard(p: PartyCard, k: number, on: boolean): string {
  const t1 = typeColour(p.types[0]), t2 = typeColour(p.types[1] ?? p.types[0]);
  const fainted = p.line === undefined && p.hp <= 0;
  const st = fainted ? 'FNT' : p.status ?? '';
  const lead = p.tag === 'LEAD';
  return `<div class="pkc${on ? ' on' : ''}${fainted ? ' fnt' : ''}${p.off ? ' gx-off' : ''}" style="--t:${t1};--t2:${t2}"${k >= 0 ? ` data-key="party-${k}"${act('pick', k, 'over')}` : ' data-key="sm-card"'}>`
    + `<div class="kc-h"><b style="font-size:${fit(p.name, on ? 92 : 84, 15, 11, 0.58)}px">${esc(p.name)}</b><span class="lv">Lv ${p.level}</span></div>`
    + `<div class="kc-art"><i class="kc-foil"></i>${p.file ? fitPic(monArt(p.file), 92, 92, '', 2) : ''}${lead ? '<u class="kc-lead">Lead</u>' : ''}${st ? `<u class="kc-st">${esc(st)}</u>` : ''}<span class="kc-g">${p.types.map((t) => spr(typeArt(t), 0.5)).join('')}</span></div>`
    + (p.hearts !== undefined ? hearts(p.hearts) : '')
    + `<div class="kc-hp">${hp(pctOf(p))}<span class="num">${p.line !== undefined ? esc(p.line) : `${p.hp}/${p.maxHp}`}</span></div>`
    + (p.xpPct !== undefined ? `<div class="kc-xp"><span class="xp"><i style="width:${Math.round(Math.max(0, Math.min(100, p.xpPct)))}%"></i></span><em>${esc(p.xpText ?? '')}</em></div>` : '')
    + `<div class="kc-ty">${p.types.map(tyChip).join('')}</div>`
    + `<div class="kc-f">${p.heldId ? fitPic(itemArt(p.heldId), 16, 16, '', 1) : ''}<span style="font-size:${fit(p.held || 'No item', 110, 11.5, 9, 0.55)}px">${esc(p.held || 'No item')}</span></div></div>`;
}

export function pkParty(d: PartyModel): string {
  const n = d.mons.length, lit = d.mons[Math.max(0, Math.min(n - 1, d.index))];
  const pills = [`${n} of 6`, ...(d.money !== undefined ? [`₽ ${d.money.toLocaleString('en-US')}`] : [])];
  const head = hdr(d.title, { area: d.area === 'end' ? 'card' : 'party', crumb: [d.area === 'end' ? 'Records' : 'Menu', d.title], pills });
  const ks: PkKey[] = d.hints.map(([k, t]) => [k, t] as const);
  if (!n) return page('party', 26, `<div class="scr pk25 pk24 pk23 pk22 pk21 pk18 pk17 pk16 pk14 pk13 party pk12">${head}<div class="pk-rot">${spr(frontRotom, 1, 'rot')}<p><b>Rotom</b>${esc(d.text)}</p></div>${keys(ks)}</div>`);
  const table = lit && lit.moves.length
    ? `<div class="pk-table" data-key="party-moves"><b>${esc(lit.name)} knows</b>${lit.moves.map((m) => `<span style="--t:${typeColour(m.type)}">${fitPic(badgeArt(m.type), 16, 16, '', 1)}${esc(m.name)}${m.pp ? `<em>${esc(m.pp)}</em>` : ''}</span>`).join('')}${d.reserve ? `<i${act('key', 'R')}><kbd>R</kbd> Reserve · ${d.reserve}</i>` : ''}</div>`
    : '';
  const g = d.gym;
  const gym = g
    ? `<div class="pk-boss" data-key="party-gym">${g.file ? `<i class="pb-f">${fitPic({ file: g.file, atlas: true }, 32, 56, '', 1)}</i>` : ''}<b>${esc(g.when)}</b><span>${esc(g.who)}</span>${g.rows.map((r) => `<u class="${r.cls}"><i>${r.file ? fitPic(monArt(r.file), 30, 26, '', 1) : ''}</i>${esc(r.word)}</u>`).join('')}</div>`
    : '';
  return page('party', 26, `<div class="scr pk25 pk24 pk23 pk22 pk21 pk18 pk17 pk16 pk14 pk13 party pk12" data-key="party">${head}`
    + `<div class="hand" data-key="party-hand">${d.mons.map((p, k) => pkMonCard(p, k, k === d.index)).join('')}</div>${table}`
    + `${keys(ks)}<div class="pk-rot${gym ? '' : ' gx-show'}" data-key="party-rotom">${spr(frontRotom, 1, 'rot')}<p style="font-size:${fit(d.text, 700, 14, 11, 0.5)}px"><b>Rotom</b>${esc(d.text)}</p></div><i class="spot16"></i>${gym}`
    + '<i class="stars21" data-nocheck></i><i class="fire21" data-nocheck></i><i class="cf22 pk" data-nocheck></i><i class="em24 bgp" data-nocheck style="--z:430px"></i><i class="belt25" data-nocheck></i></div>');
}

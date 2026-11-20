// Phantom UI: the stops of a run. The reward draft as the mock-ups' `reward` page: "PICK ONE" in cut-out letters, the
// rewards dealt as tilted cards with the lit one lifted, the run's buttons as gold tabs and the team along the bottom.
// It draws the New UI stop's model (ui/redux/screens/stops.ts) and calls the same handlers. Presentation only.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import type { PartyChip } from '../../redux/game';
import type { EventModel } from '../../redux/screens/event';
import type { RewardModel } from '../../redux/screens/stops';
import { priceOf } from '../../redux/storeFloors';
import type { ConfirmModel } from '../../redux/screens/saves';
import { rxAtlas } from '../../redux/assets';
import { figure, pic as rxPic, scrollStart, type Art } from '../../redux/templates';
import { act, esc, keys, mon, page, pic, ransom } from '../kit';
import { phConfirm, phKeys } from '../templates';
import { useOn } from './bag';

/** The team along the bottom edge, each with its HP. */
export const phTeam = (party: readonly PartyChip[], cls = ''): string =>
  `<div class="mini ${cls}">${party.map((p) => `<div class="u" title="${esc(p.name)} Lv ${p.level}"><div class="pic">${p.file ? mon(p.file, 0.6, '', p.fainted ? 'filter:grayscale(1)' : '') : ''}</div><span class="slash ${p.hp <= 20 ? 'low' : p.hp <= 50 ? 'mid' : ''}"><i style="width:${Math.max(0, Math.min(100, p.hp))}%"></i></span></div>`).join('')}</div>`;

/** The reward draft. */
export function phReward(_ph: PhantomVersion, d: RewardModel): string {
  const R = d.cards, n = R.length, inCards = d.index < n, mid = (n - 1) / 2;
  const gap = n <= 3 ? 26 : n === 4 ? 14 : 8, w = n <= 3 ? 260 : Math.floor((852 - (n - 1) * gap) / n);
  const cards = R.map((r, k) => {
    const on = inCards && k === d.index, long = r.text.length + r.notes.join(' ').length;
    const name = Math.max(15, Math.min(32, Math.floor(((w - 32) * 2) / Math.max(1, r.name.length) / 0.5)));
    return `<div class="rc ph-rw${on ? ' on' : ''}${n > 4 ? ' slim' : ''}" data-key="rw${k}" style="--r:${((k - mid) * (n <= 3 ? 7 : n <= 5 ? 3 : 1.5)).toFixed(1)}deg;--i:${k};position:relative;width:${w}px"${act('pick', k, 'over')}><small>${esc(r.kind.toUpperCase())}</small><div class="pic">${rxPic(r.art, n > 4 ? 64 : 96)}</div><h4 style="font-size:${n > 4 ? Math.min(22, name) : name}px">${esc(r.name)}</h4><p style="font-size:${long > 150 ? 13 : long > 100 ? 15 : n > 3 ? 16 : 19}px">${esc(r.text)}${r.notes.map((t) => `<span class="ph-rw-n">${esc(t)}</span>`).join('')}</p>${on && !d.result ? `<div class="take"${act('take')}>↵ · TAKE IT</div>` : ''}</div>`;
  }).join('');
  const buttons = d.buttons.map((b, k) => `<div class="gim ph-gim${d.index === n + k ? ' on' : ''}" style="--i:${k}"${act('pick', n + k, 'over')}>${esc(b)}</div>`).join('');
  const result = d.result
    ? `<div class="ph-shade" data-key="rwdone"${act('done')}></div><div class="ph-rw-res" data-key="rwres"${act('done')}><div class="ph-rw-yt">${ransom('YOURS', 9)}</div><div class="pn lt"><span class="lab">${esc(d.title)}</span>${d.result.filter(Boolean).map((t) => `<p class="txt">${esc(t)}</p>`).join('')}</div><div class="sy-wait"><i aria-hidden="true"></i><kbd>↵</kbd><span>Stays until you press Enter</span></div></div>`
    : '';
  return page('reward', '<div class="bgr"></div><div class="burst" style="--x:60%;--y:55%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div><div class="shard" style="--cp:polygon(0 0,34% 0,16% 100%,0 100%);inset:0" aria-hidden="true"></div>'
    + `<div class="ttl ph-rw-ttl">${ransom(n === 1 ? 'YOUR PRIZE' : 'PICK ONE', 3)}<small>${esc(d.title)}</small></div>`
    + `<div class="rcs ph-rcs" style="gap:${gap}px">${cards}</div>`
    + (d.text ? `<div class="pn ph-rw-say"><p class="txt" style="font-size:${d.text.length > 170 ? 14 : d.text.length > 110 ? 16 : 18}px">${esc(d.text)}</p></div>` : '')
    + `<div class="ph-gims">${buttons}</div>` + phTeam(d.party, 'ph-rw-team') + result
    + keys(['◀▶', 'Look'], ['Enter', d.result ? 'Continue' : 'Take', d.result ? 'done' : 'take']));
}

/** A good on the shop's shelf. */
export interface PhShopRow { label: string; /** null: this row is not for sale (a way out, a talk); `note` shows in its place. */ price: number | null; note?: string; was: number | null; off: boolean; art: Art | null }
export interface PhShopModel {
  title: string;
  /** The small word over the title, and the chips beside it (the hour, "New stock at 3 badges"). */
  small: string;
  chips: readonly string[];
  money: number;
  /** What the clerk says. */
  text: string;
  rows: readonly PhShopRow[];
  /** The cursor: goods first, then `extras`. */
  index: number;
  /** The lit good (the last one while the cursor is on a button), or null when the shelf is empty. */
  lit: { name: string; owned: number; pocket: string; about: string; art: Art | null; /** Shown in place of "IN BAG n" and the pocket (a store floor's goods are event choices, not bag items). */ tags?: readonly string[]; /** Drawn large in the picture frame when the good has no picture (a store floor's "5F"). */ mark?: string } | null;
  /** The buttons that buy the lit good: label, the handler it calls, lit, dimmed. */
  buy: readonly { label: string; act: string; arg?: number; on: boolean; dim?: boolean }[];
  /** Cursor stops after the goods (Sell, Checkout, Empty basket). */
  extras: readonly string[];
  /** The Depot's basket, one line per good, and what it comes to. */
  basket: readonly string[];
  total: number | null;
  party: readonly PartyChip[];
  notes: readonly string[];
  ask: ConfirmModel | null;
  hints: readonly (readonly [string, string])[];
  /** Who keeps the shop: a Pokémon (Kecleon's Bazaar, the Night Market's Meowth) or the clerk. */
  keeper: string | null;
  clerk: Art | null;
}
/** The Mart clerk: the first frame of the overworld sheet the mock-ups drew theirs from. */
export const SHOP_CLERK: Art = { file: 'overworld/trainers/NPC_113_Mart_M.png', atlas: false, crop: [0, 0, 64, 64] };

/** The shop: the mock-ups' `shop` page. The clerk and what they say, the shelf, the lit good's card and the till. */
export function phShop(_ph: PhantomVersion, d: PhShopModel): string {
  const n = d.rows.length, at = Math.min(d.index, n - 1), size = 6, s = scrollStart(n, Math.max(0, at), size);
  const cash = (v: number): string => `₽${v.toLocaleString('en-US')}`;
  const rows = d.rows.slice(s, s + size).map((r, q) => {
    const k = s + q;
    return `<div class="it ph-bi ph-si${k === d.index ? ' on' : ''}${r.off ? ' off' : ''}" style="--i:${q};font-size:${Math.max(16, Math.min(32, Math.floor(300 / Math.max(1, r.label.length * 0.56))))}px" data-key="s${k}"${act('pick', k, 'over')}>${rxPic(r.art, 44) || '<i></i>'}<div>${esc(r.label)}</div><span>${r.was !== null ? `<s>${cash(r.was)}</s> ` : ''}${r.price === null ? esc(r.note ?? '') : cash(r.price)}</span></div>`;
  }).join('');
  const where = n > size ? `<div class="ph-more2" style="left:320px;top:${126 + size * 68}px">${s > 0 ? '▲ ' : ''}${s + 1}–${Math.min(n, s + size)} of ${n}${s + size < n ? ' ▼' : ''}</div>` : '';
  const L = d.lit, price = n ? d.rows[Math.max(0, at)]!.price : 0, free = price === null;
  const buttons = [...d.buy.map((b) => `<div class="blade${b.on ? ' on' : ''}${b.dim ? ' off' : ''}" style="--sh:#000"${act(b.act, b.arg ?? '')}>${esc(b.label)}</div>`), ...d.extras.map((t, k) => `<div class="blade${d.index === n + k ? ' on' : ''}" style="--sh:#000"${act('pick', n + k, 'over')}>${esc(t)}</div>`)].join('');
  const card = `<div class="idet ph-idet ph-sdet" data-key="sd${L ? at : -1}">${L
    ? `<div class="big">${rxPic(L.art, 132) || (L.mark ? `<b class="ph-smark">${esc(L.mark)}</b>` : '')}</div><h3 style="font-size:${Math.max(24, Math.min(46, Math.floor(300 / Math.max(1, L.name.length * 0.5))))}px">${esc(L.name)}</h3><p${L.about.length > 190 ? ' class="xs"' : L.about.length > 110 ? ' class="sm"' : ''}>${esc(L.about)}</p><div class="lim">${L.tags ? L.tags.map((t) => `<span>${esc(t.toUpperCase())}</span>`).join('') : `<span>IN BAG ${L.owned}</span><span>${esc(L.pocket.toUpperCase())}</span>`}</div>`
    : '<h3 style="position:static">Sold out</h3>'}${d.basket.length ? `<div class="ph-basket"><b>Basket</b>${d.basket.map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}<div class="ph-sbtn">${buttons}</div></div>`;
  const till = d.total !== null
    ? `<span>IN BASKET <b>${d.basket.length}</b></span><span>TOTAL <b>${cash(d.total)}</b></span><span>LEFT AFTER <b>${cash(d.money - d.total)}</b></span>`
    : L && !free ? `${L.tags ? '' : `<span>IN BAG <b>${L.owned}</b></span>`}<span>PRICE <b>${cash(price ?? 0)}</b></span><span>LEFT AFTER <b>${cash(d.money - (price ?? 0))}</b></span>` : '';
  return page('shop', '<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 0,26% 0,18% 100%,0 100%);inset:0" aria-hidden="true"></div><div class="shard" style="--c:var(--red);--cp:polygon(62% 100%,100% 60%,100% 100%);inset:0" aria-hidden="true"></div>'
    + `<div class="hd" style="top:14px${d.title.length > 18 ? ';font-size:40px' : ''}"><small>${esc(d.small)}</small>${esc(d.title)}</div><div class="wallet"><small>MONEY</small>${cash(d.money)}</div>`
    + (d.chips.length ? `<div class="ph-xchips ph-schips">${d.chips.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : '')
    + `<div class="bub ph-bub" data-key="bub:${esc(d.text)}" style="font-size:${d.text.length > 150 ? 15 : d.text.length > 90 ? 18 : 23}px">${esc(d.text)}</div><div class="clerk ph-clerk" aria-hidden="true">${d.keeper ? mon(d.keeper, 4.2, 'ol', '', true) : figure(d.clerk, 400)}</div>`
    + `<div class="items">${rows}</div>${where}${card}${useOn(d.party, d.notes, 'Can use')}<div class="cart ph-cart">${till}</div>`
    + (d.ask ? phConfirm(d.ask) : '') + phKeys(d.hints));
}

/** The nurse of a healing spot: the first frame of the overworld sheet the mock-ups drew theirs from. */
export const HEAL_NURSE: Art = { file: 'overworld/trainers/NPC_B2W2_Nurse.png', atlas: false, crop: [0, 0, 64, 64] };
export interface PhHealModel {
  title: string;
  small: string;
  /** Each team member: its sprite, its HP as it walked in (0 to 100) and its HP now as "236/236". */
  party: readonly { file: string | null; name: string; from: number; hp: string }[];
  /** What the game says about the heal; it stays until the player presses. */
  text: string;
}

/** A healing spot: the mock-ups' `heal` page. One ball per Pokémon lights in turn as its HP fills, then "ALL BETTER!". */
export function phHeal(_ph: PhantomVersion, d: PhHealModel): string {
  const n = d.party.length;
  // Each Pokémon is fitted to its slot: a small one is drawn larger, a tall one smaller.
  const fit = (file: string): number => { const f = rxAtlas(file)?.f[0]; return f ? Math.round(Math.min(1.5, 84 / Math.max(1, f[3]), 110 / Math.max(1, f[2])) * 100) / 100 : 1; };
  const slots = d.party.map((p, i) => `<div class="hc-s" style="--i:${i}" title="${esc(p.name)}"><div class="hc-p">${p.file ? mon(p.file, fit(p.file)) : ''}</div><div class="hc-b">${pic('pokeball/pb.png', 3)}</div><div class="hc-hp"><i style="--from:${Math.max(0, Math.min(100, Math.round(p.from)))}%"></i></div><small>${esc(p.hp)}</small></div>`).join('');
  return page('heal', '<div class="bgk"></div><div class="burst" style="--x:70%;--y:40%" aria-hidden="true"></div><div class="dim" style="background:color-mix(in srgb,var(--k) 55%,transparent)"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 0,36% 0,22% 100%,0 100%);inset:0" aria-hidden="true"></div>'
    + `<div class="hd"><small>${esc(d.small)}</small>${esc(d.title)}</div><div class="hc-n" aria-hidden="true">${figure(HEAL_NURSE, 474)}</div>`
    + `<div class="pn hc-m"><span class="lab">Healing</span><div class="hc-row">${slots}</div></div>`
    + `<div class="hc-t" style="animation-delay:${(n * 0.28 + 0.6).toFixed(2)}s">${ransom('ALL', 4)}${ransom('BETTER!', 12)}</div>`
    + `<div class="pn lt hc-say ph-hc-say tilt" style="--r:-2deg"${act('heal')}><p class="txt" style="font-size:${d.text.length > 200 ? 16 : d.text.length > 120 ? 19 : 24}px">${esc(d.text)}</p><i class="nx" aria-hidden="true">▼</i></div>`
    + keys(['Enter', 'Thank you', 'heal']));
}

/**
 * A department store floor: an event whose choices are the goods on the shelf. While the player is choosing it is drawn
 * as the shop page (the shelf, the lit good's card, who it helps) with the floor directory as chips; its talk and its
 * outcome are the event's own pages, so the words still come first and what changed after them.
 */
export function phStore(ph: PhantomVersion, d: EventModel): string {
  const S = d.store!, n = d.choices.length, at = Math.max(0, Math.min(n - 1, d.index)), cur = d.choices[at];
  const good = cur ? priceOf(cur.label) : null;
  const line = d.lines.map((l) => l.text).join(' ');
  return phShop(ph, {
    title: S.title, small: S.floors.find((f) => f.on)?.name ?? d.tag, chips: S.floors.map((f) => (f.on ? `▶ ${f.tag}` : f.tag)), money: d.money ?? 0,
    text: cur?.locked && cur.sub ? `${line} ${cur.sub}`.trim() : line,
    rows: d.choices.map((x) => { const g = priceOf(x.label); return { label: g ? g.name : x.label, price: g ? Number(g.price.replace(/\D/g, '')) || 0 : null, note: x.chance, was: null, off: x.locked, art: null }; }),
    index: at,
    lit: cur ? { name: good ? good.name : cur.label, owned: 0, pocket: '', about: cur.sub, art: null, tags: [d.tag, ...(cur.locked ? ['Locked'] : [])], mark: S.floors.find((f) => f.on)?.tag ?? '' } : null,
    buy: cur ? [{ label: good ? 'Buy' : 'Choose', act: 'pick', arg: at, on: true, dim: cur.locked }] : [],
    extras: [], basket: [], total: null, party: S.party, notes: S.notes[at] ?? [], ask: null,
    hints: [['Enter', good ? 'buy' : 'choose'], ['▲▼', 'goods']], keeper: null, clerk: SHOP_CLERK,
  });
}

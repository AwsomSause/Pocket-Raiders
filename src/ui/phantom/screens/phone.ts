// Phantom UI: the Rotom Phone (mock-up `phone`): the chats at the left, the picked chat's last lines in the middle and
// the replies at the right. core/presentation/phone.ts says who wrote what (all of it from this run); this only draws.

import type { PhoneMsg } from '../../../core/presentation/phone';
import type { PhantomVersion } from '../../../core/presentation/phantom';
import { pic as rxPic, type Art } from '../../redux/templates';
import { act, esc, keys, mon, page } from '../kit';
import { phHead } from '../templates';

export interface PhoneModel {
  /** "Stage 14 of 30 · Johto". */
  where: string;
  chats: readonly { name: string; last: string; unread: number; art: Art | null; rotom: boolean }[];
  chat: number;
  msgs: readonly PhoneMsg[];
  replies: readonly { label: string; small: string }[];
  reply: number;
  /** The player's own picture beside what they wrote. */
  me: Art | null;
  /** Rotom's own picture (the Pokémon), when the game has it. */
  rotom?: string | null;
}

const fit = (t: string, room: number, big: number, small: number): number => Math.max(small, Math.min(big, Math.floor(room / Math.max(1, t.length * 0.56))));
/** The line under a name is one line: a longer one is cut to the row. */
const short = (t: string, n: number): string => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);
/** A face for the list and the bubbles: the person's picture, Rotom's bolt, or the first letter of the name. */
const face = (art: Art | null, name: string, rotom: boolean, file?: string | null): string => `<span class="av ph-ph-av${rotom ? ' rotom' : ''}${!(rotom && file) && art ? ' pic' : ''}">${rotom && file ? mon(file, 0.55) : art ? rxPic(art, 96) : `<i>${rotom ? '⚡' : esc(name.trim().charAt(0).toUpperCase() || '?')}</i>`}</span>`;

export function phPhone(_ph: PhantomVersion, d: PhoneModel): string {
  const on = d.chats[d.chat];
  const list = d.chats.map((c, i) => `<div class="pn${i === d.chat ? ' lt on' : ''}" data-key="c${i}" style="--i:${i}"${act('phoneChat', i)}>${face(c.art, c.name, c.rotom, d.rotom)}<b style="font-size:${fit(c.name, 150, 22, 13)}px">${esc(c.name)}</b><span>${esc(short(c.last, c.unread > 0 ? 21 : 26))}</span>${c.unread > 0 ? `<em>${Math.min(9, c.unread)}</em>` : ''}</div>`).join('');
  const long = d.msgs.reduce((n, m) => n + m.text.length, 0);
  const bubble = (m: PhoneMsg, i: number): string => {
    if (m.from === 'me') return `<div class="im me" style="--i:${i}"><div class="pn"><p class="txt">${esc(m.text)}</p></div>${face(d.me, 'You', false)}</div>`;
    if (m.from === 'rotom') return `<div class="im sys" style="--i:${i}"><div class="pn ac"><span class="lab">Rotom</span><p class="txt">${esc(m.text)}</p></div></div>`;
    return `<div class="im" style="--i:${i}">${face(on?.art ?? null, on?.name ?? '', false)}<div class="pn lt"><p class="txt">${esc(m.text)}</p></div></div>`;
  };
  const replies = d.replies.map((r, i) => `<div class="ch${i === d.reply ? ' on' : ''}" data-key="r${i}" style="--i:${i}"${act('phoneReply', i, 'phoneOver')}><kbd>${i + 1}</kbd><b style="font-size:${fit(r.label, 300, 25, 16)}px">${esc(r.label)}</b><span>${esc(r.small)}</span></div>`).join('');
  return page('phone', '<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 0,26% 0,20% 100%,0 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:90%;--y:20%" aria-hidden="true"></div>'
    + phHead('Messages', `Rotom Phone · ${d.where}`)
    + `<div class="ph-list ph-ph-list${d.chats.length > 6 ? ' many' : ''}">${list}</div>`
    + `<div class="ph-chat ph-ph-chat${long > 420 ? ' xs' : long > 260 ? ' sm' : ''}" data-key="chat${d.chat}">${d.msgs.map(bubble).join('')}</div>`
    + `<div class="ph-reply ph-ph-reply">${replies}</div>`
    + '<p class="ph-ph-note">A line you send is only talk: it changes nothing in the run.</p>'
    + keys(['▲▼', 'Reply'], ['Z', d.replies[d.reply]?.small === 'Send' ? 'Send' : 'Open', 'phoneReply', d.reply], ...(d.chats.length > 1 ? [['Q E', 'Chat', 'phoneChat', (d.chat + 1) % d.chats.length] as const] : []), ['X', 'Close', 'pop']));
}

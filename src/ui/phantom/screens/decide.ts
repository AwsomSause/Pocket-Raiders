// Phantom UI: the decisions the run stops for. A Pokémon that wants a move (mock-up `learn`): the new move on a
// tilted card, the moves it knows as a list, what the swap would change. A Pokémon that was caught, hatched or came
// back (mock-up `capture`): the cut-out word, its card, and where it goes. A choice with no Pokémon in it (a
// signature pick, a modifier, a fork in the road) uses the same answers on a plain page. DecisionScene keeps the
// state and the input; this only draws.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import type { DecisionModel, DecisionOption } from '../../redux/screens/decision';
import { figure } from '../../redux/templates';
import { rxUrl } from '../../redux/assets';
import { act, esc, page, ransom, TYC, ty } from '../kit';
import { phHead, phKeys } from '../templates';

const tc = (t: string | null | undefined): string => TYC[(t ?? '').toLowerCase()] ?? '#888';
const cine = (word: string): string => { const run = `${esc(word.toUpperCase())} · `.repeat(Math.max(8, Math.ceil(220 / (word.length + 3)))); return `<div class="cine" aria-hidden="true"><i><u>${run}</u></i><i><u>${run}</u></i></div>`; };
const pick = (i: number): string => act('pick', i, 'over');
const fit = (t: string, room: number, big: number, small: number): number => Math.max(small, Math.min(big, Math.floor(room / Math.max(1, t.length * 0.58))));
/** The sheet over the page: the full details (I), or the result line that stays until the next input. */
const sheet = (label: string, lines: readonly string[], name: 'more' | 'done', foot: string): string => {
  const text = lines.join('\n');
  return `<div class="ph-shade" data-key="${name}"${act(name)}></div><div class="pn lt ph-sheet${text.length > 900 ? ' xs' : text.length > 520 ? ' sm' : ''}" data-key="${name}p"${act(name)}><span class="lab">${esc(label)}</span><p class="txt">${esc(text)}</p><span class="ph-sheet-k">${esc(foot)}</span></div>`;
};
const over = (d: DecisionModel): string =>
  (d.more ? sheet('Details', d.more, 'more', 'Press I, Enter or Esc to go back') : '') + (d.result !== null ? sheet(d.title, [d.result], 'done', 'Press Enter to go on') : '');
/** The word a big card is announced with. */
const shout = (title: string): string => (/^caught/i.test(title) ? 'GOTCHA!' : title.toUpperCase());

/** One answer as the mock-ups' slanted choice. */
const choice = (o: DecisionOption, i: number, on: boolean, n: number): string =>
  `<div class="ch${on ? ' on' : ''}${o.off ? ' off' : ''}" data-key="c${i}" style="--i:${i}"${pick(i)}><kbd>${i + 1}</kbd><b style="font-size:${fit(o.label, on ? 370 : 340, n > 5 ? 18 : 22, 13)}px">${esc(o.label)}</b>${o.small ? `<span>${esc(o.small)}</span>` : ''}</div>`;

function learn(d: DecisionModel): string {
  const k = d.card!;
  const art = k.art ?? k.file;
  // The moves it knows are the list; an answer after them ("Do not learn") is the blade under it.
  const lastTyped = d.options.reduce((at, o, i) => (o.type ? i : at), -1);
  const rows = d.options.map((o, i) => ({ o, i })).filter(({ o, i }) => o.type || i < lastTyped || lastTyped < 0);
  const blades = d.options.map((o, i) => ({ o, i })).filter(({ o, i }) => !o.type && i > lastTyped && lastTyped >= 0);
  const n = rows.length, lit = d.options[d.index];
  const row = ({ o, i }: { o: DecisionOption; i: number }): string =>
    `<div class="lm pn${i === d.index ? ' lt on' : ''}${o.off ? ' off' : ''}" data-key="m${i}" style="--i:${i};--tc:${tc(o.type)}"${pick(i)}><span class="t">${o.type ? `<img class="px" src="${rxUrl(`packs/story/badge/${o.type.toLowerCase()}.png`)}" alt="">` : ''}</span><b style="font-size:${fit(o.label, n > 6 ? 200 : 380, n > 6 ? 20 : n > 4 ? 24 : 30, 13)}px">${esc(o.label)}</b><span class="s">${esc(o.type ? `${o.type.toUpperCase()} · ${o.small}` : o.small)}</span>${i === d.index ? '<em>Z</em>' : ''}</div>`;
  const asks = /wants to learn/i.test(k.sub) ? 'Forget which one?' : 'Which one?';
  return page('learn', '<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 0,44% 0,30% 100%,0 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:20%;--y:60%" aria-hidden="true"></div>'
    + phHead(d.title, [k.name, k.level].filter(Boolean).join(' · ').toUpperCase(), 'onred')
    + `<div class="ln-mon ph-ln-mon">${art ? figure({ file: art, atlas: true }, 250) : ''}</div>`
    + `<div class="pn lt ln-new tilt" style="--r:-3deg;--tc:${tc(k.types[0])}"><span class="lab">${esc(k.sub)}</span><h3 class="tl1" style="font-size:${fit(k.accent, 320, 40, 22)}px">${esc(k.accent)}</h3>${k.types.length ? `<div class="ph-ln-ty">${k.types.map(ty).join('')}</div>` : ''}${k.lines.length ? `<p class="txt">${k.lines.map(esc).join('<br>')}</p>` : ''}</div>`
    + `<div class="ln-q">${asks}</div>`
    + `<div class="ln-list ph-ln-list${n > 6 ? ' two' : n > 4 ? ' six' : ''}">${rows.map(row).join('')}</div>`
    + (d.text || d.details.length ? `<div class="pn ln-cmp ph-ln-cmp${n > 4 ? ' low' : ''}">${lit ? `<span class="lab">${esc(lit.label)}</span>` : ''}<p class="txt">${esc([d.text, ...d.details].filter(Boolean).join(' '))}</p></div>` : '')
    + blades.map(({ o, i }, b) => `<div class="blade ln-keep ph-ln-keep${i === d.index ? ' on' : ''}${n > 4 ? ' low' : ''}" data-key="b${i}" style="--r:-2deg;--b:${b}"${pick(i)}>${esc(o.label)}</div>`).join('')
    + phKeys(d.hints) + over(d));
}

function caught(d: DecisionModel): string {
  const k = d.card!;
  const word = shout(d.title), gotcha = word === 'GOTCHA!';
  const n = d.options.length;
  const notes = [k.sub, ...k.lines].filter(Boolean);
  return page('capture', '<div class="bgr"></div><div class="burst" style="--x:24%;--y:52%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div><div class="shard" style="--cp:polygon(52% 0,100% 0,100% 100%,62% 100%);inset:0" aria-hidden="true"></div>'
    + cine(word.replace(/!+$/, ''))
    + `<div class="cp-ball" aria-hidden="true"><i class="ph-cp-ball"></i></div>${gotcha ? '<div class="cp-pips" aria-label="three shakes"><i></i><i></i><i></i></div>' : ''}`
    + `<div class="cp-t" style="font-size:${fit(word, 620, 92, 44)}px">${ransom(word, 51)}</div>`
    + `<div class="pn lt cp-card tilt" style="--r:3deg"><span class="lab">${k.tag ? esc(k.tag === 'NEW' ? 'New in your Pokédex' : k.tag) : esc(d.title)}</span><div class="cp-pic ph-cp-pic">${k.file ? figure({ file: k.file, atlas: true }, 200) : ''}${k.second ? `<span class="ph-cp-2">${figure({ file: k.second, atlas: true }, 70)}</span>` : ''}</div>`
    + `<h3 class="tl1" style="font-size:${fit(k.name, 280, 36, 20)}px">${esc(k.name)}</h3><div class="cp-ty">${k.level ? `<b>${esc(k.level.replace(/^Lv\s*/, 'Lv.'))}</b>` : ''}${k.types.map(ty).join('')}</div>${notes.length ? `<p class="txt">${notes.map(esc).join('<br>')}</p>` : ''}</div>`
    + `<div class="cp-ch ph-cp-ch${n > 5 ? ' many' : n > 3 ? ' some' : ''}">${d.options.map((o, i) => choice(o, i, i === d.index, n)).join('')}</div>`
    + (d.details.length ? `<div class="pn ph-cp-facts"><p class="txt">${d.details.map(esc).join('<br>')}</p></div>` : '')
    + (d.party ? `<div class="ph-cp-party">${d.party.slice(0, 6).map((p) => `<i class="${p.fainted ? 'ko' : ''}" title="${esc(p.name)}">${p.file ? figure({ file: p.file, atlas: true }, 40) : ''}<u style="--hp:${Math.round(Math.max(0, Math.min(1, p.hp)) * 100)}%"></u></i>`).join('')}</div>` : '')
    + (d.text ? `<div class="pn ph-say ph-cp-say"><p class="txt">${esc(d.text)}</p></div>` : '')
    + phKeys(d.hints) + over(d));
}

function plain(d: DecisionModel): string {
  const n = d.options.length;
  const row = (o: DecisionOption, i: number): string =>
    `<div class="ch ph-dc-ch${i === d.index ? ' on' : ''}${o.off ? ' off' : ''}" data-key="c${i}" style="--i:${i}"${pick(i)}><kbd>${i + 1}</kbd><b style="font-size:${fit(o.label, 620, n > 5 ? 22 : n > 3 ? 26 : 32, 14)}px">${esc(o.label)}</b>${o.small ? `<span${o.small.length > 150 ? ' style="font-size:14px"' : o.small.length > 90 || n > 4 ? ' style="font-size:16px"' : ''}>${esc(o.small)}</span>` : ''}</div>`;
  return page('choice', '<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(48% 0,100% 0,100% 100%,56% 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:85%;--y:40%" aria-hidden="true"></div>'
    + phHead(d.title, 'Your call')
    + `<div class="ph-dc-list${n > 5 ? ' many' : n > 3 ? ' some' : ''}">${d.options.map(row).join('')}</div>`
    + (d.details.length ? `<div class="pn ph-dc-facts"><p class="txt">${d.details.map(esc).join('<br>')}</p></div>` : '')
    + (d.text ? `<div class="pn ph-say ph-dc-say"><p class="txt">${esc(d.text)}</p></div>` : '')
    + phKeys(d.hints) + over(d));
}

export function phDecision(_ph: PhantomVersion, d: DecisionModel): string {
  return d.card?.big ? caught(d) : d.card ? learn(d) : plain(d);
}

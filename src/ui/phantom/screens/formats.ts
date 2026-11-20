// Phantom UI: the wide-format pages, which the mock-ups had no page for (the Breather, the Blackout's anchors, the
// Convoy's road, the Front's lanes, the Debate, the Colossus plate and the plain card). Each takes the New UI's
// model (ui/redux/screens/wide.ts), so FormatScene keeps the cursor and core/formats the rules. Presentation only.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import { rxAtlas, rxUrl } from '../../redux/assets';
import type { BlackoutBody, BreatherBody, ConvoyBody, DebateBody, FrontBody, PlainBody, PlateBody, WideChip, WideModel } from '../../redux/screens/wide';
import { figure } from '../../redux/templates';
import { act, esc, keys, mon, page } from '../kit';
import { factRows, fit, phHead } from '../templates';

type Base = Pick<WideModel, 'options' | 'index'>;
const KIND_WORD: Record<WideModel['body']['kind'], string> = { breather: 'Breather', blackout: 'Blackout', convoy: 'Convoy', front: 'The Front', debate: 'Debate', plate: 'Colossus', plain: 'Interlude' };

/** A Pokémon fitted into a square of `size` (by its drawn frame). `out`: a black shape (fainted, or beaten). */
function fitMon(file: string | null, size: number, out = false): string {
  const f = file ? rxAtlas(file)?.f[0] : undefined;
  return file && f ? `<span class="ph-wd-m${out ? ' out' : ''}">${mon(file, size / Math.max(1, f[2], f[3]))}</span>` : `<span class="ph-wd-m" style="width:${size}px;height:${size}px"></span>`;
}
const bar = (pct: number, cls = ''): string => `<span class="ph-wd-hp ${cls}${pct <= 20 ? ' low' : pct <= 50 ? ' mid' : ''}"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></span>`;
/** A choice as a slanted tile: its hint under the name; a closed one is dimmed. */
function opt(d: Base, k: number, room = 300, big = 28): string {
  const o = d.options[k]!;
  return `<div class="pn ph-wd-o${k === d.index ? ' lt on' : ''}${o.locked ? ' off' : ''}" data-key="o${k}"${act('pick', k, 'over')}><b style="font-size:${fit(o.label, room, big, 13)}px">${esc(o.label)}</b>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</div>`;
}
/** The choices in a row (a format with one or two things to do). */
const row = (d: Base, top: number): string => (d.options.length ? `<div class="ph-wd-row" style="top:${top}px">${d.options.map((_, k) => opt(d, k, Math.floor(1000 / Math.max(2, d.options.length)))).join('')}</div>` : '');
const strip = (party: readonly WideChip[], top: number, notes: boolean): string =>
  `<div class="ph-wd-strip" style="top:${top}px">${party.map((p, i) => `<div class="pn ph-wd-chip" style="--i:${i}">${fitMon(p.file, 48, p.hp <= 0)}<div><b style="font-size:${fit(p.name, 110, 19, 12)}px">${esc(p.name)}</b>${bar(p.hp)}${notes ? `<small class="${p.note ? 'on' : ''}">${esc(p.note || '–')}</small>` : ''}</div></div>`).join('')}</div>`;

function breather(d: Base, b: BreatherBody): string {
  const small = b.down.length > 1;
  const rows = b.down.map((m, k) => `<div class="ph-wd-down">${fitMon(m.file, small ? 44 : 72, true)}<div><b>${esc(m.name)}</b><small>${esc(m.sub)}</small></div>${small && d.options[k] ? opt(d, k, 190, 22) : ''}</div>`).join('');
  const rest = small ? '' : d.options.map((_, k) => opt(d, k, 420)).join('');
  return strip(b.party, 132, true)
    + `<div class="ph-wd-two" style="top:232px"><div class="pn ph-wd-p"><span class="lab">Bring one back</span>${rows || `<p class="txt">${esc(b.note)}</p>`}${rest}</div>`
    + `<div class="pn lt ph-wd-p"><span class="lab">${esc(b.room.title)}</span><p class="txt" style="font-size:${b.room.text.length > 260 ? 16 : 19}px">${esc(b.room.text)}</p>${factRows(b.room.facts)}</div></div>`;
}

function blackout(d: Base, b: BlackoutBody): string {
  const cards = b.anchors.map((a, i) => `<div class="pn ph-wd-card${a.fallen ? ' off' : a.option !== null && a.option === d.index ? ' lt on' : ''}" style="--i:${i}"${a.option !== null ? `${act('pick', a.option, 'over')} data-key="o${a.option}"` : ''}><div class="ph-wd-fig${a.dark ? ' out' : ''}">${a.art ? figure(a.art, 150) : ''}</div><b style="font-size:${fit(a.name, 250, 24, 13)}px">${esc(a.name)}</b><small>${esc(a.state)}</small></div>`).join('');
  // Once the streets are open the only choice left has no anchor: it gets a tile beside the Seal.
  const loose = d.options.map((_, k) => k).filter((k) => !b.anchors.some((a) => a.option === k));
  return `<div class="ph-wd-cards" style="top:132px">${cards}</div>`
    + `<div class="ph-wd-seal" style="top:402px"><div class="pn ph-wd-p"><div class="ph-wd-sealrow"><span class="lab">${esc(b.seal.title)}</span><b>${esc(b.seal.count)}</b></div>${b.seal.text ? `<p class="txt" style="font-size:${b.seal.text.length > 200 ? 15 : 18}px">${esc(b.seal.text)}</p>` : ''}</div>${loose.length ? `<div class="ph-wd-loose">${loose.map((k) => opt(d, k, 280)).join('')}</div>` : ''}</div>`;
}

function convoy(d: Base, b: ConvoyBody): string {
  const trucks = b.legs.map((l, i) => `<div class="ph-wd-leg ${l.state}" style="--i:${i}"><i class="ph-wd-truck"></i><b style="font-size:${fit(l.name, 190, 22, 12)}px">${esc(l.name)}</b><small>${esc(l.note)}</small></div>`).join('');
  return (b.caption ? `<p class="ph-wd-cap" style="top:134px">${esc(b.caption)}</p>` : '')
    + `<div class="ph-wd-road" style="top:178px"><i class="ph-wd-lane"></i><div class="ph-wd-legs">${trucks}</div></div>` + row(d, 370) + strip(b.party, 462, false);
}

function front(d: Base, b: FrontBody): string {
  const lanes = b.lanes.map((l, i) => `<div class="pn ph-wd-lane2${l.won ? ' won' : ''}" style="--i:${i}"><div class="ph-wd-sealrow"><b style="font-size:${fit(l.name, 150, 26, 14)}px">${esc(l.name)}</b>${l.won ? '<span class="ph-wd-tag">Lane won</span>' : ''}</div>${l.sub ? `<small>${esc(l.sub)}</small>` : ''}`
    + `<div class="ph-wd-side">${fitMon(l.foe, 96, l.won)}${bar(l.foeHp, 'w')}</div><i class="ph-wd-vs"></i><div class="ph-wd-side">${bar(l.youHp, 'w')}${fitMon(l.you, 96, l.youHp <= 0)}</div></div>`).join('');
  return `<div class="ph-wd-cards" style="top:126px">${lanes}</div>` + row(d, 500);
}

function debate(d: Base, b: DebateBody): string {
  const many = d.options.length > 4;
  const pips = Array.from({ length: b.who.of }, (_, k) => `<i class="${k < b.who.won ? 'on' : ''}"></i>`).join('');
  const who = `<div class="pn ph-wd-who"><div class="ph-wd-fig">${figure(b.who.art, 170)}</div><b style="font-size:${fit(b.who.name, 230, 28, 14)}px">${esc(b.who.name)}</b><small>${esc(b.who.sub)}</small><div class="ph-wd-pips">${pips}<span>${esc(b.who.score)}</span></div></div>`;
  const claim = `<div class="pn lt ph-wd-p ph-wd-claim"><span class="lab">${esc(b.claim.tag)}</span><p class="txt" style="font-size:${b.claim.text.length > 260 ? 15 : b.claim.text.length > 160 ? 17 : 20}px">${esc(b.claim.text)}</p></div>`;
  const next = b.next && !many ? `<div class="pn ph-wd-p ph-wd-next"><span class="lab">${esc(b.next.tag)}</span><p class="txt">${esc(b.next.text)}</p></div>` : '';
  return `<div class="ph-wd-deb" style="top:128px">${who}<div class="ph-wd-args${many ? ' many' : ''}">${claim}${d.options.map((_, k) => opt(d, k, 620, many ? 20 : 24)).join('')}${next}</div></div>`;
}

function plate(d: Base, b: PlateBody): string {
  const bare = !b.plate.rows.length && !b.plate.note;
  const sheet = bare ? '' : `<div class="ph-wd-blue"><span class="lab">${esc(b.plate.title)}</span>${b.plate.rows.map(([n, p]) => `<div class="ph-wd-brow"><span>${esc(n)}</span>${bar(p, 'gold')}</div>`).join('')}${b.plate.note ? `<small>${esc(b.plate.note)}</small>` : ''}</div>`;
  const words = b.lines.length ? `<div class="pn lt ph-wd-p ph-wd-words">${b.lines.map((l) => `<p class="txt" style="font-size:${b.lines.join(' ').length > 420 ? 15 : 18}px">${esc(l)}</p>`).join('')}</div>` : '';
  return `<div class="ph-wd-plate${bare ? ' bare' : ''}" style="top:130px"><div class="pn ph-wd-apex">${fitMon(b.mon, 200)}<b style="font-size:${fit(b.name, 250, 30, 15)}px">${esc(b.name)}</b></div>${words}${sheet}</div>` + row(d, 478);
}

function plain(d: Base, b: PlainBody): string {
  const n = b.lines.join(' ').length;
  return `<div class="ph-wd-plain" style="top:132px">${b.lines.length ? `<div class="pn lt ph-wd-p">${b.lines.map((l) => `<p class="txt" style="font-size:${n > 520 ? 15 : n > 320 ? 17 : 20}px">${esc(l)}</p>`).join('')}</div>` : ''}<div class="ph-wd-col">${d.options.map((_, k) => opt(d, k, 900, d.options.length > 4 ? 22 : 26)).join('')}</div></div>`;
}

/** `phases`: the run is in an Extended Cut climax, so the keys also offer its phase list (P, or a click on the key). */
export function phWide(_ph: PhantomVersion, d: WideModel, phases = false): string {
  const b = d.body;
  const body = b.kind === 'breather' ? breather(d, b) : b.kind === 'blackout' ? blackout(d, b) : b.kind === 'convoy' ? convoy(d, b) : b.kind === 'front' ? front(d, b) : b.kind === 'debate' ? debate(d, b) : b.kind === 'plate' ? plate(d, b) : plain(d, b);
  return page('wide', '<div class="bgk"></div>' + (d.art ? `<div class="ph-wd-art" style="background-image:url(${rxUrl(d.art)})" aria-hidden="true"></div>` : '') + (d.shade ? `<div class="ph-wd-shade" style="background:${d.shade}" aria-hidden="true"></div>` : '')
    + '<div class="shard" style="--c:var(--red);--cp:polygon(0 0,24% 0,9% 100%,0 100%);inset:0;opacity:.85" aria-hidden="true"></div>'
    + phHead(d.title, KIND_WORD[b.kind].toLowerCase() === d.title.toLowerCase() ? 'Interlude' : KIND_WORD[b.kind]) + `<div class="ph-wd ${b.kind}">${body}</div>`
    + (d.text ? `<div class="pn lt ph-wd-say"><p class="txt" style="font-size:${d.text.length > 330 ? 14 : d.text.length > 220 ? 16 : d.text.length > 120 ? 18 : 21}px">${esc(d.text)}</p></div>` : '')
    + (phases ? keys(['P', 'Phases', 'phases'], ['Enter', 'Choose']) : keys(['Enter', 'Choose'])));
}

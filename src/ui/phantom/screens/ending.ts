// Phantom UI: the card page (mock-up `card`). One page for the three cards of the game: the run card at a run's end
// (it can be saved as a picture), the hub's Trainer Card, and the code-name card a team hands you when you join.
// Pure functions from the New UI's own models to HTML: the scenes keep their state and their input.
// The run's end is here too: a lost run (mock-up `runover`) and a won one (mock-up `record`), both from the same model.

import { type Art, figure } from '../../redux/templates';
import type { OverModel, RunCardModel } from '../../redux/screens/over';
import type { CreditsModel } from '../../redux/screens/boot';
import { rxUrl } from '../../redux/assets';
import type { PhantomVersion } from '../../../core/presentation/phantom';
import { act, esc, keys, mon, page, ransom, TYC } from '../kit';

/** Facts on the card itself; any more stand beside it. */
export const PH_CARD_FACTS = 5;

const AREA_WORD: Record<string, string> = { end: 'Run end', hub: 'Hub', story: 'Story' };

/** The name's letter size: a long name shrinks so it never runs under the picture. */
const nameSize = (name: string): number => (name.length <= 6 ? 96 : Math.max(46, Math.round((96 * 6.4) / name.length)));

export function phCard(_ph: PhantomVersion, d: RunCardModel): string {
  const lit = Math.max(0, Math.min(8, Math.floor(d.badges)));
  const tap = d.tap ?? 'back';
  const can = d.save !== false;
  const on = d.facts.slice(0, PH_CARD_FACTS), beside = d.facts.slice(PH_CARD_FACTS);
  const back = '<div class="bgk"></div><div class="burst" style="--x:30%;--y:50%;background:repeating-conic-gradient(color-mix(in srgb,var(--red) 50%,transparent) 0 5deg,transparent 5deg 10deg)" aria-hidden="true"></div>'
    + `<div class="ph-fill"${act(tap)}></div>`;
  const head = `<div class="hd"><small>${esc(d.small ?? AREA_WORD[d.area ?? 'end'] ?? 'Run end')}</small>${esc(d.title)}</div>`;
  const card = `<div class="tcard ph-tcard${can ? ' can' : ''}"${act(can ? 'save' : tap)}>`
    + (d.trainer ? `<div class="pic ph-tc-pic" aria-hidden="true">${figure(d.trainer, 330)}</div>` : '')
    + `<h3 style="font-size:${nameSize(d.name)}px">${ransom(d.name.toUpperCase(), d.name.length + 3)}</h3>`
    + `<div class="id">${esc(d.rank)}</div>`
    + `<dl>${on.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`
    + `<div class="badges ph-tc-badges" aria-label="${lit} of 8 badges">${Array.from({ length: 8 }, (_, k) => `<i class="${k < lit ? 'f' : ''}" style="--i:${k}"></i>`).join('')}</div>`
    + (can ? '<span class="ph-tc-stamp" aria-hidden="true">Save as picture</span>' : '')
    + '</div>';
  const team = d.team.filter((f): f is string => !!f).slice(0, 6);
  let i = 0;
  const kv = (small: string, body: string, cls = ''): string => `<div class="kv ${cls}" style="--i:${i++}"><small>${esc(small)}</small>${body}</div>`;
  const side = '<div class="tside ph-tside">'
    + beside.map(([k, v]) => kv(k, `<b>${esc(v)}</b>`)).join('')
    + (d.side ?? []).map((x) => kv(x.small, `<b>${esc(x.title)}</b>${x.text ? `<p>${esc(x.text)}</p>` : ''}`)).join('')
    + (team.length ? kv('Final team', `<div class="ph-tc-team">${team.map((f) => mon(f, 0.9)).join('')}</div>`) : '')
    + (d.text ? kv(can ? 'Share' : 'Note', `<p>${esc(d.text)}</p>`, 'ph-tc-note') : '')
    + '</div>';
  const hint = keys(...d.hints.map(([k, t]) => [k, t, /esc/i.test(k) ? tap : can ? 'save' : tap] as const));
  return page('card', back + head + card + side + hint);
}

/** The fallen team as small pictures the player can tap, as on the New UI's page. */
const overTeam = (d: OverModel): string =>
  d.team.length ? `<div class="ph-ov-team">${d.team.slice(0, 6).map((p, k) => `<i class="${p.down && !d.win ? 'ko' : ''}${d.poked === k ? ' poked' : ''}" data-key="t${k}" title="${esc(p.name)}"${act('poke', k)}>${p.file ? figure({ file: p.file, atlas: true }, 56) : ''}${d.poked === k ? `<u>${d.win ? '♥' : '…'}</u>` : ''}</i>`).join('')}</div>` : '';
const overGo = (d: OverModel, cls: string): string =>
  `<div class="${cls}">${d.buttons.map((t, k) => `<div class="blade${k === d.index ? ' on' : ''}" data-key="b${k}" style="--i:${k}"${act('pick', k, 'over')}>${esc(t)}</div>`).join('')}</div>`;
const overKeys = (d: OverModel): string =>
  keys(['▲▼', 'Choose'], ['Z', 'Confirm', 'pick', d.index], ...d.extras.map(([k, t, a]) => [k, t[0]!.toUpperCase() + t.slice(1), a] as const));
const overMvp = (d: OverModel, px: number): string => (d.mvp?.file ? `<i class="ph-ov-mvp">${figure({ file: d.mvp.file, atlas: true }, px)}</i>` : '');
/** A number or a short word, sized to its box. */
const big = (v: string, room: number, top: number): number => Math.max(20, Math.min(top, Math.floor(room / Math.max(1, v.length * 0.5))));
const CF = ['var(--red)', 'var(--gold)', 'var(--w)', 'var(--cyan)', 'var(--k)'];

/** The full report as a sheet over the page: one page of lines, turned with the confirm key. */
const overReport = (d: OverModel): string => {
  const r = d.report;
  if (!r) return '';
  const text = r.lines.join('\n');
  return `<div class="ph-shade"${act('back')}></div><div class="pn lt ph-sheet ph-ov-report${text.length > 1100 ? ' xs' : text.length > 600 ? ' sm' : ''}" data-key="report"${act('page')}><span class="lab">${esc(r.title)} · page ${r.page + 1} of ${r.pages}</span><p class="txt">${esc(text)}</p><span class="ph-sheet-k">${r.page + 1 < r.pages ? 'Enter: next page' : 'Enter: close'} · Esc: back</span></div>`;
};

/** A run that ended in a loss (mock-up `runover`): where it stopped, the road, the run in numbers, and what stays. */
function runOver(d: OverModel): string {
  const road = d.road && d.road.of > 1 ? `<div class="ro-road${d.road.of > 34 ? ' ph-ro-long' : ''}" aria-label="${d.road.done} of ${d.road.of} stages">${Array.from({ length: Math.min(60, d.road.of) }, (_, k) => `<i class="${k < d.road!.done ? 'd' : k === d.road!.done ? 'x' : ''}"></i>`).join('')}</div>` : '';
  return page('runover', `${d.backdrop ? `<div class="art" style="background-image:url(${rxUrl(d.backdrop)})"></div>` : '<div class="bgk"></div>'}<div class="ro-veil" aria-hidden="true"></div>`
    + `<div class="ro-t ph-ro-t"><span class="lab">${esc(d.where || d.sub)}</span><h2>The run<br>ends here</h2><p>${esc(d.line || d.sub)}</p></div>`
    + road
    + `<div class="pn ro-st ph-ro-st"${act('report')}><span class="lab">This run</span>${d.facts.map(([k, v]) => `<div class="ro-r"><span>${esc(k)}</span><b style="font-size:${v.length > 16 ? 16 : v.length > 11 ? 20 : 24}px">${esc(v)}</b></div>`).join('')}</div>`
    + (d.mvp ? `<div class="pn lt ro-mvp ph-ro-mvp"><span class="lab">Most valuable</span><div class="ro-m">${overMvp(d, 96)}<div><h3 class="tl1" style="font-size:${d.mvp.name.length > 12 ? 24 : 32}px">${esc(d.mvp.name)}</h3><p class="txt">${esc(d.mvp.text)}</p></div></div></div>` : '')
    + (d.payouts.length ? `<div class="pn ro-keep ph-ro-keep"><span class="lab">You keep</span><p class="txt">${d.payouts.map(([k, v]) => `${esc(k)} <b>${esc(v)}</b>`).join(' · ')}</p></div>` : '')
    + overGo(d, 'ro-go ph-ro-go') + overTeam(d) + overKeys(d) + overReport(d));
}

/** A run that was won (mock-up `record`): the run in six numbers, the badges, the most valuable Pokémon and what it earned. */
function runRecord(d: OverModel): string {
  const badges = d.facts.find(([k]) => /badge/i.test(k));
  const tiles = d.facts.filter((f) => f !== badges).slice(0, 6);
  return page('record', '<div class="bgr"></div><div class="burst" style="--x:72%;--y:38%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div><div class="shard" style="--cp:polygon(0 0,40% 0,26% 100%,0 100%);inset:0" aria-hidden="true"></div>'
    + `<div class="hd"><small>${esc(d.sub.toUpperCase())}</small>Run record</div>`
    + `<div class="rc-g ph-rc-g">${tiles.map(([k, v], i) => `<div class="rc-s" style="--i:${i}"><small>${esc(k)}</small><b style="font-size:${big(v, 180, 56)}px">${esc(v)}</b><span></span></div>`).join('')}</div>`
    + (badges ? `<div class="rc-gr ph-rc-gr" aria-label="${esc(badges[1])} badges"><i style="font-size:${badges[1].length > 2 ? 90 : 150}px">${esc(badges[1])}</i><small>${esc(badges[0])}</small></div>` : '')
    + (d.mvp ? `<div class="rc-mvp ph-rc-mvp">${overMvp(d, 120)}<div><small>Most valuable</small><b style="font-size:${d.mvp.name.length > 12 ? 36 : 54}px">${esc(d.mvp.name)}</b><span>${esc(d.mvp.text)}</span></div></div>` : '')
    + (d.payouts.length ? `<div class="pn lt rc-new ph-rc-new tilt" style="--r:2deg"${act('report')}><span class="lab">What this run earned</span>${d.payouts.map(([k, v]) => `<div class="dm-fr"><span>${esc(k)}</span><b style="font-size:${v.length > 22 ? 15 : v.length > 14 ? 18 : 22}px">${esc(v)}</b></div>`).join('')}</div>` : '')
    + `<div class="cf" aria-hidden="true">${Array.from({ length: 14 }, (_, k) => `<i style="--x:${(k * 37 + 11) % 100};--y:${(k * 29 + 7) % 100};--d:${k * 13};--c:${CF[k % CF.length]};--r:${(k * 47) % 180}deg"></i>`).join('')}</div>`
    + `<div class="fn-st" aria-label="ending, step 1 of 3"><span class="on"><i></i>Run record</span><span><i></i>Credits</span><span><i></i>Hub Town</span></div>`
    + overGo(d, 'ro-go ph-rc-go') + overTeam(d) + overKeys(d) + overReport(d));
}

/** The run's end: `record` for a win, `runover` for a loss. */
export function phOver(_ph: PhantomVersion, d: OverModel): string {
  return d.win ? runRecord(d) : runOver(d);
}

export interface HallModel {
  /** The winning team, lead first. `tag` is its Legacy title or its place; `note` what it is remembered for. */
  mons: readonly { file: string | null; name: string; level: number; tag: string; note: string; shiny: boolean; /** Its first type: the banner's colour. */ type?: string }[];
  index: number;
  trainer: Art | null;
  /** "Champion Red". */
  name: string;
  /** "Johto · 8 badges · 2026-11-20". */
  sub: string;
}

/** The banners lean in turn, as the mock-up hangs them. */
const HF_TILT = [-3, 2, -2, 3, -2, 2];

/** A champion run's winning team (mock-up `hall`): six banners, the cut-out title and the champion under them. */
export function phHall(_ph: PhantomVersion, d: HallModel): string {
  const n = Math.max(1, Math.min(6, d.mons.length));
  const banner = (m: HallModel['mons'][number], i: number): string =>
    `<div class="hf-b ph-hf-b${i === d.index ? ' on' : ''}" data-key="h${i}" style="--i:${i};--r:${HF_TILT[i % HF_TILT.length]}deg${m.type ? `;--tc:${TYC[m.type.toLowerCase()] ?? '#888'}` : ''}"${act('pick', i, 'over')}><small>${esc(m.tag)}</small><div class="hf-m">${m.file ? figure({ file: m.file, atlas: true }, 140) : ''}</div><b style="font-size:${m.name.length > 11 ? 19 : m.name.length > 8 ? 23 : 27}px">${esc(m.name)}</b><em>Lv.${m.level}${m.shiny ? ' · Shiny' : ''}</em><p>${esc(m.note)}</p></div>`;
  return page('hall', '<div class="bgk"></div><div class="burst" style="--x:50%;--y:120%;background:repeating-conic-gradient(color-mix(in srgb,var(--gold) 26%,transparent) 0 4deg,transparent 4deg 10deg)" aria-hidden="true"></div>'
    + `<div class="hf-row ph-hf-row" style="left:${Math.round((1280 - (n * 188 + (n - 1) * 12)) / 2)}px">${d.mons.slice(0, 6).map(banner).join('')}</div>`
    + `<div class="hf-t">${ransom('HALL OF FAME', 51)}</div>`
    + (d.trainer ? `<div class="hf-me ph-hf-me">${figure(d.trainer, 170)}</div>` : '')
    + `<div class="hf-cap${d.trainer ? '' : ' ph-hf-solo'}"><b>${esc(d.name)}</b><span>${esc(d.sub)}</span></div>`
    + `<div class="cf" aria-hidden="true">${Array.from({ length: 14 }, (_, k) => `<i style="--x:${(k * 37 + 11) % 100};--y:${(k * 29 + 7) % 100};--d:${k * 13};--c:${CF[k % CF.length]};--r:${(k * 47) % 180}deg"></i>`).join('')}</div>`
    + keys(['◀▶', 'Look'], ['X', 'Back', 'back']));
}

/** The credits (mock-up `credits`): the roll down the left, the run's moments as photos, and the team walking along the bottom. */
export function phCredits(_ph: PhantomVersion, d: CreditsModel): string {
  const still = d.roll === null;
  let first = true;
  const rows = d.rows.map((r) => {
    if (r.kind === 'gap') return '<p class="g"></p>';
    if (r.kind === 'title') { const big = first; first = false; return big ? `<h2>${esc(r.text)}</h2>` : `<h3>${esc(r.text)}</h3>`; }
    if (r.kind === 'heading') return `<h4>${esc(r.text)}</h4>`;
    if (r.kind === 'mons') return `<p class="m">${(r.mons ?? []).map((f) => `<i>${figure({ file: f, atlas: true }, 44)}</i>`).join('')}</p>`;
    return `<p>${esc(r.text)}</p>`;
  }).join('');
  const photos = (d.photos ?? []).slice(0, 3);
  return page('credits', '<div class="bgk"></div><div class="cr-grad" aria-hidden="true"></div>'
    + `<div class="cr-roll rx-credits ph-cr-roll${still ? ' still' : ''}${photos.length || d.party.length ? '' : ' wide'}"${act('next')}><div class="rx-roll"${still ? '' : ` style="transform:translateY(${Math.round(d.roll!)}px)"`}>${d.lead ? `<p class="s">${esc(d.lead)}</p>` : ''}${rows}</div></div>`
    + (photos.length ? `<div class="cr-ph ph-cr-ph">${photos.map((p, i) => `<figure style="--r:${[-4, 3, -2][i]}deg;--i:${i}"><div class="ph-cr-shot" style="--c:${['var(--red)', 'var(--gold)', 'var(--cyan)'][i]}">${p.file ? figure({ file: p.file, atlas: true }, 130) : ''}</div><figcaption>${esc(p.cap)}</figcaption></figure>`).join('')}</div>` : '')
    + (d.party.length ? `<div class="cr-walk ph-cr-walk" aria-hidden="true">${d.party.slice(0, 8).map((f, i) => `<span style="--i:${i}">${figure({ file: f, atlas: true }, 72)}</span>`).join('')}</div>` : '')
    + (photos.length || d.party.length ? '<div class="fn-st" aria-label="ending, step 2 of 3"><span class="d"><i></i>Run record</span><span class="on"><i></i>Credits</span><span><i></i>Hub Town</span></div>' : '')
    + keys(...(still ? [['▲▼', 'Read'] as const] : []), ['Z', still ? 'Back' : 'Go on', 'next']));
}

export interface BlessingModel {
  /** "Greater". */
  tier: string;
  name: string;
  legendary: string;
  /** The Legendary's picture (an atlas file), or null. */
  mon: string | null;
  /** Its place among the blessings, as on the mock-up's card ("XVII"). */
  number: string;
  passage: string;
  headline: string;
  summary: string;
  /** How far the opening has played: 0 the dark, 1 the Legendary, 2 its name, 3 the passage, 4 the gift, 5 everything (it waits). */
  step: number;
  /** A vow to swear before going on, with the one under the cursor. */
  vows: readonly { label: string; text: string }[] | null;
  vowAt: number;
  /** "See all blessings": one page of the Reliquary. */
  book: { rows: readonly { name: string; legendary: string; tier: string; text: string; found: boolean; mine: boolean }[]; page: number; pages: number; found: number; of: number } | null;
}
/** Rows on one page of the blessing list. */
export const BLESSING_ROWS = 8;

/** The blessing's shouted headline as a spoken line ("THE WORLD IS KINDER TO THE LOVELY" -> "The world is kinder to the lovely."). */
const calm = (t: string): string => {
  const low = t === t.toUpperCase() ? t.toLowerCase() : t;
  const s = low.charAt(0).toUpperCase() + low.slice(1);
  return /[.!?…]$/.test(s) ? s : `${s}.`;
};

/** A Legendary blesses the run (mock-up `blessing`): no stage and no light on it, only the dark, the ring and the card. The card says what the blessing does, in plain words; once it is yours, the line under it gives the Legendary's words. */
export function phBlessing(_ph: PhantomVersion, d: BlessingModel): string {
  const at = (n: number): string => (d.step >= n ? '' : ' ph-bl-wait');
  // A long gift (a few run 300 letters) takes room from the picture, so the whole of it fits on the card.
  const long = d.summary.length > 200 ? ' ph-bl-l2' : d.summary.length > 110 ? ' ph-bl-l1' : '';
  const word = `${esc('BLESSING')} · `.repeat(14);
  const say = d.vows
    ? `<div class="bl-say ph-bl-vows"><span class="lab">Swear one vow for the run</span>${d.vows.map((v, i) => `<div class="ch${i === d.vowAt ? ' on' : ''}" data-key="v${i}" style="--i:${i}"${act('vow', i, 'over')}><kbd>${i + 1}</kbd><b>${esc(v.label)}</b><span>${esc(v.text)}</span></div>`).join('')}</div>`
    : `<div class="pn bl-say ph-bl-say${at(3)}"${act('next')}><p class="txt">${d.step >= 4 ? `<b>${esc(d.legendary)} has blessed your journey.</b><br>${esc(calm(d.headline))}` : `“${esc(d.passage)}”`}</p><em aria-hidden="true">▼</em></div>`;
  const book = d.book
    ? `<div class="ph-shade"${act('book')}></div><div class="pn lt ph-sheet ph-bl-book" data-key="book"><span class="lab">Blessings · ${d.book.found} of ${d.book.of} found</span>${d.book.rows.map((r) => `<div class="ph-bl-row${r.found ? '' : ' no'}${r.mine ? ' mine' : ''}"><small>${esc(r.tier)}</small><b>${r.found ? esc(r.name) : '? ? ?'}</b><span>${r.found ? `${esc(r.legendary)} · ${esc(r.text)}` : 'Not found yet.'}</span></div>`).join('')}<span class="ph-sheet-k">Page ${d.book.page + 1} of ${d.book.pages} · ◀▶ turn · C or Esc to close</span></div>`
    : '';
  return page('blessing', '<div class="bl-bg"></div>'
    + `<div class="bl-ghost ph-bl-ghost${at(1)}" aria-hidden="true">${d.mon ? figure({ file: d.mon, atlas: true }, 620) : ''}</div><div class="bl-ring" aria-hidden="true"></div>`
    + `<div class="cine" aria-hidden="true"><i><u>${word}</u></i><i><u>${word}</u></i></div>`
    + `<div class="bl-t${at(2)}">${ransom('BLESSING', 23)}</div>`
    + `<div class="bl-card ph-bl-card${at(2)}${long}"><span class="lab">${esc(d.tier)} Blessing</span><em>${esc(d.number)}</em><div class="bl-pic ph-bl-pic">${d.mon ? figure({ file: d.mon, atlas: true }, d.summary.length > 200 ? 100 : d.summary.length > 110 ? 135 : 170) : `<b>${esc(d.legendary.charAt(0).toUpperCase())}</b>`}</div><h3 class="tl1" style="font-size:${d.name.length > 18 ? 20 : d.name.length > 13 ? 24 : 30}px">${esc(d.name)}</h3><p class="txt${at(4)}">${esc(d.summary)}</p><small>LASTS THIS RUN</small></div>`
    + say
    + keys(...(d.vows ? [['▲▼', 'Choose'] as const, ['Z', 'Swear', 'next'] as const] : [['Z', d.step >= 5 ? 'Accept' : 'Show all', 'next'] as const]), ['C', 'See all blessings', 'book'])
    + book);
}

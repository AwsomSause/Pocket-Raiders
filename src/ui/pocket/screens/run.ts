// The Pocket look's run start pages: Starter Pick (mock-up `starter`): three cards, each Pokémon in a Poké Ball's
// circle with its home region's stamp, the steps of starting a run along the header, and the professor's line.
// It draws what StarterSelectScene hands it. Presentation only.

import type { BriefModel, StarterModel } from '../../redux/screens/run';
import type { Art } from '../../redux/templates';
import { monArt, type PkArt } from '../art';
import { act, back, esc, hdr, keys, page, sprH, typeColour } from '../kit';
import { fit, fitBody, fitPic, pkArtOf } from '../templates';
import { tyChip } from './party';

/** A species' home region by its generation, and the colour of that region's stamp. */
const REGIONS: readonly (readonly [string, string])[] = [
  ['Kanto', '#e3350d'], ['Johto', '#c99700'], ['Hoenn', '#c9302c'], ['Sinnoh', '#5a5fc8'], ['Unova', '#3a3a46'],
  ['Kalos', '#2f66c8'], ['Alola', '#e8791a'], ['Galar', '#9b2c8f'], ['Paldea', '#b8462f'],
];
export const regionOfGen = (gen: number | undefined): { name: string; no: number; colour: string } | null => {
  const r = gen ? REGIONS[gen - 1] : undefined;
  return r ? { name: r[0], no: gen!, colour: r[1] } : null;
};

/** The steps of starting a run, the one you are on lit. */
export const RUN_STEPS = ['Trainer', 'Starter', 'Blessing', 'Set off'] as const;
export const runSteps = (on: number): string => `<div class="steps">${RUN_STEPS.map((s, k) => `<i class="${k < on ? 'past' : k === on ? 'on' : ''}"><b>${k + 1}</b>${s}</i>`).join('')}</div>`;

export function pkStarter(d: StarterModel): string {
  const n = d.picks.length, on = Math.max(0, Math.min(n - 1, d.on)), cur = d.picks[on];
  const blind = !!d.blind;
  const head = hdr('Starter Pick', { area: 'map', crumb: ['Hub', 'New Run', 'Starter'], pills: [blind ? 'Blind Draft' : 'One from three regions'] });
  const cards = d.picks.map((p, k) => {
    const r = regionOfGen(p.gen), t = typeColour(p.types[0]);
    const stamp = r && !blind ? `<i class="stamp sm" style="--c:${r.colour}"><b data-nocheck>${esc(r.name)}</b><u data-nocheck>Region ${r.no}</u></i>` : '';
    return `<div class="spc${k === on ? ' on' : ''}${blind ? ' gx-sp-sil' : ''}" style="--t:${t}" data-key="sp-${k}"${act('pick', k, 'over')}><i class="sp-ball"></i>${p.file ? fitPic(monArt(p.file), 170, 170, 'sp-mon', 3) : ''}${stamp}<b style="font-size:${fit(blind ? '???' : p.name, 220, 24, 15, 0.6)}px">${esc(blind ? '???' : p.name)}</b>${blind ? '<span class="gx-sp-q">Revealed after you choose</span>' : `<span class="gx-sp-ty">${p.types.map(tyChip).join('')}</span>`}<em>${esc(p.tag ?? 'Starter Remembrance')}</em></div>`;
  }).join('');
  const kind = cur ? cur.types.map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' and ') : '';
  const say = blind ? 'Three hidden partners in three Poké Balls. Trust your gut.' : cur ? `${cur.name}, the ${kind} Pokémon. ${cur.moves}. Will you take this one?` : '';
  return page('starter', 26, `<div class="scr startp" data-key="starter">${head}${runSteps(1)}<div class="sp-row" data-key="sp-row">${cards}</div><div class="tb"><p>${esc(say)}</p></div>${keys([['←→', 'starter'], ['Enter', 'choose', 'yes'], ['Esc', 'menu', 'back']])}</div>`);
}

/** What the Pocket Briefing (mock-up `pd-brief`) shows beside the plan: the first region, its stops and cap, the first Gym. */
export interface PkBriefExtra {
  region: string;
  /** The region's place in this run's order (1 for the first). */
  regionNo: number;
  stops: number;
  cap: number;
  leader: { name: string; art: Art | null; types: readonly string[]; weak: readonly string[] } | null;
}

const capWord = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
/** "Rock type. Water and Grass moves hit hard." */
export function leaderLine(types: readonly string[], weak: readonly string[]): string {
  const t = types.length ? `${types.map(capWord).join(' / ')} type.` : '';
  const w = weak.slice(0, 2).map(capWord);
  return [t, w.length ? `${w.join(' and ')} moves hit hard.` : ''].filter(Boolean).join(' ');
}

/** The Briefing (mock-up `pd-brief`): the first region's map, its stops, the level cap and the first Gym, then Set off. */
export function pkBrief(d: BriefModel, x: PkBriefExtra): string {
  const head = hdr('Briefing', { area: 'map', crumb: ['New Run', 'Briefing'], pills: [`Region ${x.regionNo}`, `Seed ${d.seed}`] });
  const map = `<div class="bfm38 pn" data-key="bf-map">${back(/kanto/i.test(x.region) ? 'packs/memories/townmap/region1.png' : 'packs/memories/townmap/region0.png', '')}<b style="font-size:${fit(x.region, 360, 44, 24, 0.62)}px">${esc(x.region)}</b></div>`;
  const L = x.leader;
  const gym = L ? `<p class="pn gym" data-key="bf-gym"><i>${L.art ? sprH(pkArtOf(L.art), 77) : ''}</i><b style="font-size:${fit(`First Gym: ${L.name}`, 300, 18, 13, 0.6)}px">First Gym: ${esc(L.name)}</b><span>${esc(leaderLine(L.types, L.weak))}</span></p>` : '';
  const facts = `<div class="bff38" data-key="bf-facts"><p class="pn"><u>${x.stops}</u><b>stops</b><span>Then the Gym, then the next region.</span></p><p class="pn"><u>${x.cap}</u><b>level cap</b><span>The most your Pokémon can reach for now.</span></p>${gym}</div>`;
  const go = `<div class="bfg38"><div class="btn${d.index === 0 ? ' on' : ''}"${act('go')}><b>Set off</b></div><div class="btn sm gx-bf-copy${d.index === 1 ? ' on' : ''}"${act('copy')}><b>Copy seed</b></div></div>`;
  const note = d.text && !/^Check the plan/.test(d.text) ? `<div class="pn gx-bf-note">${esc(d.text)}</div>` : '';
  return page('pd-brief', 51, `<div class="scr nrun pd38 bf38" data-key="brief">${head}${map}${facts}${go}${note}${keys([['Enter', d.index === 1 ? 'copy seed' : 'set off', d.index === 1 ? 'copy' : 'go'], ['←→', 'set off · copy seed']])}</div>`);
}

/** The Preparation Desk's four pages, as the tabs down the left (mock-ups `pd-setup`, `pd-bring`, `pd-mods`, `pd-desk`). */
export const PREP_TABS: readonly (readonly [string, string])[] = [['Run Setup', 'Mode, region, difficulty'], ['Trainer', 'Who you are, what you bring'], ['Modifiers', 'Special rules'], ['Overview', 'Check it, then roll']];
export const prepTabs = (on: number): string => `<div class="pdt38" data-key="pd-tabs">${PREP_TABS.map(([b, s], k) => `<div class="${k === on ? 'on' : ''}" data-key="pd-tab-${k}"${act('tab', k)}><u>${k + 1}</u><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join('')}</div>`;

export interface PkDeskModel {
  /** "Run 13". */
  run: string;
  /** "Red's run". */
  name: string;
  art: Art | null;
  /** The facts: label, value and the act a click on it runs (its page). */
  facts: readonly (readonly [string, string, string])[];
}

/** The Overview (mock-up `pd-desk`): the Trainer, the run's card, Roll the starters, Save and Load preset. */
export function pkDesk(d: PkDeskModel): string {
  const head = hdr('Preparation Desk', { area: 'map', crumb: ['Hub', 'New Run', 'Desk'], pills: [d.run] });
  const who = `<i class="who" data-key="pd-who">${d.art ? fitPic(pkArtOf(d.art), 180, 320, '', 4) : ''}</i>`;
  const facts = d.facts.map(([u, v, a]) => `<p class="gx-pd-fact"${act(a)}><u>${esc(u)}</u><span style="font-size:${fit(v, 330, 16, 11, 0.55)}px">${esc(v)}</span></p>`).join('');
  const tk = `<div class="tk"><em>${esc(d.run)}</em><b style="font-size:${fit(d.name, 400, 40, 24, 0.62)}px">${esc(d.name)}</b>${facts}</div>`;
  const go = `<div class="go"><div class="btn on"${act('start')}><b>Roll the starters</b></div><div class="btn sm"${act('save')}><b>Save preset</b></div><div class="btn sm"${act('load')}><b>Load preset</b></div></div>`;
  return page('pd-desk', 51, `<div class="scr nrun pd38" data-key="pd-desk">${head}${prepTabs(3)}<div class="pdk38 pn" data-key="pd-card">${who}${tk}${go}</div>${keys([['←→', 'page'], ['Enter', 'roll the starters', 'start'], ['S', 'save preset', 'save'], ['Esc', 'back to the street', 'back']])}</div>`);
}

/** Rows the Run Setup page shows at a time (the mock-up's five); the rest are named on the More bar. */
export const PREP_SETUP_ROWS = 5;

export interface PkPrepSetupModel {
  rows: readonly { label: string; help: string; disabled: boolean; opts: readonly { label: string; on: boolean; locked: boolean }[] }[];
  index: number;
}

/** A row's choices as the mock-up's segments: all of them when four or fewer, else three around the chosen one. */
export function segWindow<T extends { on: boolean }>(opts: readonly T[]): { opt: T; at: number }[] {
  const all = opts.map((opt, at) => ({ opt, at }));
  if (all.length <= 4) return all;
  const on = Math.max(0, opts.findIndex((o) => o.on)), first = Math.max(0, Math.min(all.length - 3, on - 1));
  return all.slice(first, first + 3);
}

/** Run Setup (mock-up `pd-setup`): each row's choices as segments, ←→ change the lit row, the rest named on More. */
export function pkPrepSetup(d: PkPrepSetupModel): string {
  const n = d.rows.length, index = Math.max(0, Math.min(n - 1, d.index));
  const first = Math.max(0, Math.min(n - PREP_SETUP_ROWS, index - PREP_SETUP_ROWS + 1));
  const head = hdr('Preparation Desk', { area: 'map', crumb: ['New Run', 'Desk', 'Run Setup'], pills: ['Page 1 of 4'] });
  const rows = d.rows.slice(first, first + PREP_SETUP_ROWS).map((r, k) => {
    const i = first + k;
    const seg = segWindow(r.opts).map(({ opt, at }) => `<i class="${opt.on ? 'on' : ''}${opt.locked ? ' gx-pd-lock' : ''}"${act('opt', `${i}:${at}`)}>${esc(opt.label)}</i>`).join('');
    return `<div class="srow${i === index ? ' on' : ''}${r.disabled ? ' gx-pd-off' : ''}" data-key="pd-row-${i}"${act('row', i)}><div><b>${esc(r.label)}</b><span style="font-size:${fit(r.help, 380, 12, 10, 0.5)}px">${esc(r.help)}</span></div><span class="seg">${seg}</span></div>`;
  }).join('');
  const hidden = d.rows.filter((_, i) => i < first || i >= first + PREP_SETUP_ROWS).map((r) => r.label);
  const more = hidden.length ? `<div class="more38" data-key="pd-more"><b>More</b>${esc(hidden.join(' · '))}<kbd>↑↓</kbd></div>` : '';
  return page('pd-setup', 51, `<div class="scr nrun pd38" data-key="pd-setup">${head}${prepTabs(0)}<div class="set-rows pn pds38" data-key="pd-rows">${rows}</div>${more}${keys([['↑↓', 'move'], ['←→', 'change'], ['Tab', 'next page', 'tab', 1], ['Esc', 'back', 'back']])}</div>`);
}

export interface PkPrepBringModel {
  cards: readonly { label: string; value: string; art: PkArt | null; none: boolean }[];
  index: number;
  /** What the lit card does. */
  help: string;
}

/** Trainer (mock-up `pd-bring`): who you are and what you bring as cards, the lit one's line in the last card. */
export function pkPrepBring(d: PkPrepBringModel): string {
  const n = d.cards.length, index = Math.max(0, Math.min(n - 1, d.index)), cur = d.cards[index];
  const head = hdr('Preparation Desk', { area: 'map', crumb: ['New Run', 'Desk', 'Trainer'], pills: ['Page 2 of 4'] });
  const cards = d.cards.map((x, i) => `<div class="pn${i === index ? ' on' : ''}${x.none ? ' none' : ''}" data-key="pd-b-${i}"${act('card', i, 'over')}><i>${x.art ? fitPic(x.art, 70, 70, '', 3) : '<s></s>'}</i><em>${esc(x.label)}</em><b style="font-size:${fit(x.value, 150, 22, 13, 0.6)}px">${esc(x.value)}</b></div>`).join('');
  const help = `<div class="pn help" data-key="pd-help"><em>${esc(cur?.label ?? '')}</em><p style="font-size:${fitBody(d.help, 150, 110, [14, 13, 12, 11], 1.3)}px">${esc(d.help)}</p><span><kbd>Enter</kbd> change</span></div>`;
  return page('pd-bring', 51, `<div class="scr nrun pd38" data-key="pd-bring">${head}${prepTabs(1)}<div class="pdb38" data-key="pd-cards">${cards}${help}</div>${keys([['←→↑↓', 'move'], ['Enter', 'change', 'card', index], ['Tab', 'next page', 'tab', 2], ['Esc', 'back', 'back']])}</div>`);
}

/** Rules on one Modifiers page (the mock-up's three across, two down). */
export const PREP_MODS_PAGE = 6;

export interface PkPrepModsModel {
  mods: readonly { name: string; text: string; on: boolean; soon: boolean }[];
  /** The lit card (mods.length: the Death-Block bar). */
  index: number;
  deathBlock: { text: string; on: boolean };
  /** The category showing ("All", "Party"). */
  category: string;
  /** What the lit rule does to the rewards. */
  note: string;
}

/** Modifiers (mock-up `pd-mods`): the rules as cards with On or Off, six a page, and the Death-Block bar. */
export function pkPrepMods(d: PkPrepModsModel): string {
  const n = d.mods.length, index = Math.max(0, Math.min(n, d.index));
  const at = Math.floor(Math.min(index, Math.max(0, n - 1)) / PREP_MODS_PAGE), first = at * PREP_MODS_PAGE;
  const head = hdr('Preparation Desk', { area: 'map', crumb: ['New Run', 'Desk', 'Modifiers'], pills: ['Page 3 of 4'] });
  const cards = d.mods.slice(first, first + PREP_MODS_PAGE).map((m, k) => {
    const i = first + k;
    return `<div class="pn${m.on ? ' act' : ''}${i === index ? ' on' : ''}${m.soon ? ' gx-pd-off' : ''}" data-key="pd-m-${i}"${act('mod', i, 'over')}><b style="font-size:${fit(m.name, 200, 20, 13, 0.6)}px">${esc(m.name)}</b><p style="font-size:${fitBody(m.text, 200, 64, [13, 12, 11, 10], 1.35)}px">${esc(m.text)}</p><u>${m.soon ? 'Soon' : m.on ? 'On' : 'Off'}</u></div>`;
  }).join('');
  const db = `<div class="more38 db${index === n ? ' gx-pd-dbon' : ''}${d.deathBlock.on ? '' : ' gx-pd-dboff'}" data-key="pd-db"${act('mod', n, 'over')}><b>Death-Block</b><span style="font-size:${fit(d.deathBlock.text, 520, 13, 10, 0.5)}px">${esc(d.deathBlock.text)}</span><u>${d.deathBlock.on ? 'On' : 'Off'}</u></div>`;
  const where = n > PREP_MODS_PAGE ? `${first + 1}–${Math.min(n, first + PREP_MODS_PAGE)} of ${n} rules` : `${n} rules`;
  const note = d.note ? `<div class="gx-pd-note" data-key="pd-note">${esc(d.note)}</div>` : '';
  return page('pd-mods', 51, `<div class="scr nrun pd38" data-key="pd-mods">${head}${prepTabs(2)}<div class="pdm38" data-key="pd-mods-grid">${cards}</div>${db}${note}${keys([['←→↑↓', 'move'], ['Enter', 'switch on or off', 'mod', index], ['Q E', `${d.category} · ${where}`, 'cat', 1], ['Esc', 'back', 'back']])}</div>`);
}

/** Letter boxes the Seed page draws before a long code goes on one line. */
export const SEED_BOXES = 8;

export interface PkSeedModel {
  value: string;
  /** The typing point (the lit box). */
  at: number;
  text: string;
}

/** The Seed page (mock-up `pd-seed`): the seed in letter boxes, Random or Type one, then Use this seed or Copy. */
export function pkSeed(d: PkSeedModel): string {
  const v = d.value, head = hdr('Seed', { area: 'map', crumb: ['Desk', 'Seed'], pills: [v ? 'Fixed seed' : 'Random'] });
  const boxes = v.length > SEED_BOXES
    ? `<b class="gx-sd-long" style="font-size:${fit(v, 600, 30, 13, 0.62)}px">${esc(v)}</b>`
    : Array.from({ length: Math.min(SEED_BOXES + 1, Math.max(SEED_BOXES, v.length + 1)) }, (_, k) => (k < v.length ? `<i class="${k === Math.min(d.at, v.length) - 1 ? 'on' : ''}">${esc(v[k]!)}</i>` : `<i class="e${k === v.length ? ' on' : ''}"></i>`)).join('');
  const seg = `<span class="seg"><i class="${v ? '' : 'on'}"${act('btn', 'clear')}>Random</i><i class="${v ? 'on' : ''}"${act('btn', 'focus')}>Type one</i><i${act('btn', 'paste')}>Paste</i></span>`;
  const go = `<div class="go"><div class="btn on"${act('btn', 'apply')}><b>Use this seed</b></div><div class="btn sm"${act('btn', 'copy')}><b>Copy</b></div></div>`;
  return page('pd-seed', 51, `<div class="scr nrun pd38" data-key="pd-seed">${head}<div class="sdp38 pn" data-key="sd-card"><em>This run's seed</em><div class="sdc38 rx-field" data-key="sd-boxes">${boxes}</div>${seg}<p style="font-size:${fitBody(d.text, 460, 64, [14, 13, 12], 1.45)}px">${esc(d.text)}</p>${go}</div>${keys([['A to Z, 0 to 9', 'type'], ['Enter', 'use it', 'btn', 'apply'], ['Esc', 'back', 'back']])}</div>`);
}

const TIER_COLOUR: Record<string, string> = { lesser: '#e8791a', greater: '#4f7fe0', divine: '#f2a900' };

export interface PkBlessingModel {
  tier: string;
  name: string;
  legendary: string;
  mon: string | null;
  headline: string;
  summary: string;
  passage: string;
  /** The Vow to swear before going on (null: none asked yet). */
  vows: readonly { label: string; text: string }[] | null;
  vowAt: number;
  /** The Reliquary (C): every blessing, the found ones named. */
  book: { rows: readonly { name: string; tier: string; text: string; found: boolean; mine: boolean }[]; page: number; pages: number; found: number; of: number } | null;
}

/** The Blessing (mock-up `blessing`): the run's blessing as a card in its tier's colour, its passage under it; a Vow
 *  to swear as two cards; C opens the Reliquary of every blessing found. */
export function pkBlessing(d: PkBlessingModel): string {
  const head = hdr('Blessing', { area: 'map', crumb: ['Hub', 'New Run', 'Blessing'], pills: [d.book ? `${d.book.found} of ${d.book.of} found` : d.tier] });
  const card = `<div class="blc on" style="--c:${TIER_COLOUR[d.tier.toLowerCase()] ?? '#4f7fe0'}" data-key="bl-card"${act('next')}><em>${esc(d.tier)}</em><i>${d.mon ? fitPic(monArt(d.mon), 200, 118, '', 3) : ''}</i><b style="font-size:${fit(d.name, 230, 24, 15, 0.6)}px">${esc(d.name)}</b><u>${esc(d.headline)}</u><p style="font-size:${fitBody(d.summary, 230, 110, [14, 13, 12, 11], 1.4)}px">${esc(d.summary)}</p><small class="gx-bs-who">${esc(d.legendary)}</small></div>`;
  const vows = d.vows ? d.vows.map((v, i) => `<div class="blc${i === d.vowAt ? ' on' : ''} gx-bs-vow" style="--c:#7a4fc8" data-key="bl-vow-${i}"${act('vow', i, 'over')}><em>Vow</em><b style="font-size:${fit(v.label, 230, 24, 15, 0.6)}px">${esc(v.label)}</b><p>${esc(v.text)}</p></div>`).join('') : '';
  const row = `<div class="bl-row" data-key="bl-row">${d.vows ? vows : card}</div>`;
  const pass = `<div class="bl-pass"><i>${esc(d.vows ? 'Swear a Vow before you set off. It holds for this run.' : `"${d.passage}"`)}</i></div>`;
  const B = d.book;
  const book = B ? `<i class="gx-bs-dim" data-nocheck${act('book')}></i><div class="pn gx-bs-book" data-key="bl-book"><b>Reliquary</b><span>Page ${B.page + 1} of ${B.pages}</span>${B.rows.map((r) => `<p class="${r.mine ? 'on' : ''}${r.found ? '' : ' gx-bs-unk'}"><em style="--c:${TIER_COLOUR[r.tier] ?? '#8b96b0'}">${esc(r.tier)}</em><b>${esc(r.found ? r.name : '???')}</b><span>${esc(r.found ? r.text : 'Not found yet.')}</span></p>`).join('')}</div>` : '';
  const ks = B ? keys([['←→', 'page'], ['Esc', 'close', 'book']]) : d.vows ? keys([['↑↓', 'vow'], ['Enter', 'swear', 'vow', d.vowAt]]) : keys([['Enter', 'accept', 'next'], ['C', 'reliquary', 'book']]);
  return page('blessing', 26, `<div class="scr blessp" data-key="blessing">${head}${runSteps(2)}${row}${pass}${book}${ks}</div>`);
}

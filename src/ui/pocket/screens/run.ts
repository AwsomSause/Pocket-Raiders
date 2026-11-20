// The Pocket look's run start pages: Starter Pick (mock-up `starter`): three cards, each Pokémon in a Poké Ball's
// circle with its home region's stamp, the steps of starting a run along the header, and the professor's line.
// It draws what StarterSelectScene hands it. Presentation only.

import type { BriefModel, StarterModel } from '../../redux/screens/run';
import type { Art } from '../../redux/templates';
import { monArt } from '../art';
import { act, back, esc, hdr, keys, page, sprH, typeColour } from '../kit';
import { fit, fitPic, pkArtOf } from '../templates';
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

// The Pocket look's Forecast (mock-up `forecast`, Y on the stage map): the next six stops as cards, each with what waits
// there, the time of day and its weather (as far as fog and the forecast reach), Rotom's line on what is coming, and
// Fix my team (the Party). It draws what MapScene hands it. Presentation only.

import { act, esc, frontRotom, hdr, keys, page, spr } from '../kit';
import type { PocketRoad } from '../../../core/presentation/pocket';
import { fit } from '../templates';

export interface PkForecastStop { stop: number; kind: string | null; sub: string; time: 'day' | 'eve' | 'night'; weather: string | null; gym: boolean }
export interface PkForecastModel { region: string; stage: string; road: PocketRoad | null; stops: readonly PkForecastStop[]; index: number; say: string }

const TIME: Record<PkForecastStop['time'], string> = { day: 'Day', eve: 'Evening', night: 'Night' };
const WX: Record<string, [string, string]> = { clear: ['clear', 'Clear'], rain: ['rain', 'Rain'], sun: ['sun', 'Harsh Sun'], sand: ['sand', 'Sandstorm'], snow: ['snow', 'Snow'], hail: ['snow', 'Hail'] };

export function pkForecast(d: PkForecastModel): string {
  const head = hdr('Forecast', { area: 'map', crumb: ['Map', 'Forecast'], pills: [d.region, d.stage], road: d.road });
  const cards = d.stops.map((s, k) => {
    const wx = s.weather ? WX[s.weather] ?? ['clear', s.weather] : null;
    const kind = s.kind ?? '???';
    return `<div class="fc ${s.time}${s.gym ? ' gym' : ''}${k === d.index ? ' on' : ''}" data-key="fc-${k}"${act('popPick', k)}><em>Stop ${s.stop}</em><b style="font-size:${fit(kind, 120, 17, 12, 0.6)}px">${esc(kind)}</b><span style="font-size:${fit(s.sub, 120, 12, 9, 0.5)}px">${esc(s.sub)}</span><div class="fc-i"><i class="wxi ${s.time}" data-nocheck></i>${wx ? `<i class="wxi ${wx[0]}" data-nocheck></i>` : '<i class="wxi gx-wx-q" data-nocheck>?</i>'}</div><u>${TIME[s.time]}</u><u>${esc(wx ? wx[1] : 'Too far to tell')}</u></div>`;
  }).join('');
  const rot = `<div class="fc-rot" data-key="fc-rot">${spr(frontRotom, 1, 'rot')}<p><b>Rotom</b>${esc(d.say)}</p><div class="btn on nx"${act('popOpen')}><b>Fix my team</b></div></div>`;
  return page('forecast', 26, `<div class="scr lw21" data-key="forecast">${head}<div class="fcs" data-key="fcs">${cards}</div>${rot}${keys([['←→', 'pick a stop'], ['Enter', 'fix my team', 'popOpen'], ['Esc', 'back', 'pop']])}</div>`);
}

// The Pocket look's Time of Day and Weather guides (mock-ups `time` and `weather`): a card per time or weather with a
// picture of how it looks, what it does, the one in play marked Now, and (Time) the run's stages as a strip of dots.
// Opened from the stage map (K, and the Forecast) and from battle (the weather card). Presentation only.

import { act, back, esc, hdr, keys, page, STREET } from '../kit';
import type { PocketRoad } from '../../../core/presentation/pocket';

export type PkTime = 'day' | 'eve' | 'night';
export interface PkTimeModel { now: PkTime | null; index: number; run: readonly PkTime[]; at: number; crumb: readonly string[]; road: PocketRoad | null }
export interface PkWeatherModel { now: string | null; turns: number | null; index: number; crumb: readonly string[]; road: PocketRoad | null }

const TIMES: readonly [PkTime, string, readonly string[]][] = [
  ['day', 'Day', ['Clear light on every screen.', 'The town is open, banners are up.', 'Daytime evolutions can happen.']],
  ['eve', 'Evening', ['A low sun. Lamps come on.', 'Menus sit over a sunset.', 'Long shadows in battle.']],
  ['night', 'Night', ['Stars, lit windows, lantern glow.', 'Menus dim to night blue.', 'Night-time evolutions can happen.']],
];
export const WEATHERS: readonly [string, string, string, readonly string[]][] = [
  ['clear', 'Clear', 'arenas/grass_bg.png', ['No effect.', 'The arena looks as the time of day paints it.']],
  ['sun', 'Harsh Sun', 'arenas/desert_bg.png', ['Fire moves hit harder.', 'Water moves hit softer.']],
  ['rain', 'Rain', 'arenas/sea_bg.png', ['Water moves hit harder.', 'Fire moves hit softer.']],
  ['sand', 'Sandstorm', 'arenas/mountain_bg.png', ['Hurts every Pokémon each turn,', 'except Rock, Ground and Steel.']],
  ['snow', 'Snow', 'arenas/ice_cave_bg.png', ['Ice types take less', 'damage from physical moves.']],
];
/** Hail shows on the Snow card (the same icy arena). */
export const weatherCard = (id: string | null): number => Math.max(0, WEATHERS.findIndex(([w]) => w === (id === 'hail' ? 'snow' : id ?? 'clear')));

export function pkTime(d: PkTimeModel): string {
  const now = d.now ? TIMES.find(([t]) => t === d.now)?.[1] ?? '' : '';
  const head = hdr('Time of Day', { area: 'guide', crumb: d.crumb, pills: now ? [`Now: ${now}`] : [], road: d.road });
  const cards = TIMES.map(([t, name, lines], k) => `<div class="tod-c ${t}${k === d.index ? ' on' : ''}" data-key="tod-${t}"${act('popPick', k)}><div class="tod-v">${back(STREET, '')}<i class="tod-s" data-nocheck></i>${t === 'night' ? '<i class="stars21" data-nocheck></i>' : ''}<i class="wxi ${t}" data-nocheck></i>${t === d.now ? '<em>Now</em>' : ''}</div><b>${name}</b>${lines.map((l) => `<p>${l}</p>`).join('')}</div>`).join('');
  const dots = d.run.map((t, k) => `<i class="${t}${k === d.at ? ' on' : ''}"></i>`).join('');
  const run = d.run.length ? `<div class="tod-run" data-key="tod-run"><b>This run</b><span class="tod-dots">${dots}</span><span>Every stage has its own time, set by the run's seed. The same seed always gives the same days.</span></div>` : '';
  return page('time', 26, `<div class="scr lw21" data-key="time">${head}<div class="tod" data-key="tod">${cards}</div>${run}<div class="tod-n" data-key="tod-n"><i>Stone rule</i>An evolution that needs a time of day can also use a stone at any time.</div>${keys([['←→', 'look at a time'], ['Enter', 'weather', 'popOpen'], ['Esc', 'back', 'pop']])}</div>`);
}

export function pkWeather(d: PkWeatherModel, acts: { pick: string; back: string } = { pick: 'popPick', back: 'pop' }): string {
  const nowAt = d.now ? weatherCard(d.now) : -1;
  const name = nowAt >= 0 ? (d.now === 'hail' ? 'Hail' : WEATHERS[nowAt]![1]) : '';
  const head = hdr('Weather', { area: 'guide', crumb: d.crumb, pills: [...(name ? [`Now: ${name}`] : []), ...(d.turns ? [`${d.turns} ${d.turns === 1 ? 'turn' : 'turns'} left`] : [])], road: d.road });
  const cards = WEATHERS.map(([w, n, bg, lines], k) => `<div class="wx-c ${w}${k === d.index ? ' on' : ''}" data-key="wx-${w}"${act(acts.pick, k)}><div class="wx-v">${back(bg, '')}<i class="wx-fx" data-nocheck></i>${k === nowAt ? '<em>Now</em>' : ''}</div><b><i class="wxi ${w}" data-nocheck></i>${esc(k === nowAt ? name : n)}</b>${lines.map((l) => `<p>${l}</p>`).join('')}</div>`).join('');
  const how = '<div class="wx-how" data-key="wx-how"><b>How the screen tells you</b><p><i>1</i>A chip by the turn counter names the weather and counts its turns.</p><p><i>2</i>The whole arena changes: streaks, glare, grit or flakes.</p><p><i>3</i><span>Move buttons show <u class="up">▲</u> or <u class="dn">▼</u> when the weather changes their power.</span></p></div>';
  return page('weather', 26, `<div class="scr lw21" data-key="weather">${head}<div class="wxs" data-key="wxs">${cards}</div>${how}${keys([['←→', 'look at a weather'], ['Esc', 'back', acts.back]])}</div>`);
}

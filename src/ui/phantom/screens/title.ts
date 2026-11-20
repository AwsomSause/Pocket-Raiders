// Phantom UI: the Title (mock-up pages "title" and "menu"). First the splash that waits for any button, then the
// main menu as a stack of blades beside the version's trainer. The scene owns the menu and the choices.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import type { TitleModel } from '../../redux/screens/title';
import { act, esc, hero, keys, mon, page, ransom } from '../kit';

/** The Pokémon that stands behind each version's trainer on the splash. */
const PARTNER: Record<string, string> = { phantom: 'pokemon/6', midnight: 'pokemon/130', channel: 'pokemon/25', fantasia: 'pokemon/3', velvet: 'pokemon/94' };

function splash(ph: PhantomVersion, d: TitleModel): string {
  const cast = ph.id === 'phantom'
    ? `<div class="shard" style="--cp:polygon(0 0,46% 0,30% 100%,0 100%);inset:0" aria-hidden="true"></div><div class="shard" style="--cp:polygon(58% 100%,100% 38%,100% 100%);inset:0" aria-hidden="true"></div>
<div class="heroes">${mon(PARTNER.phantom!, 6, 'ol', 'position:absolute;right:0;bottom:110px', true)}${hero(ph.hero, 6, 'ol', 'position:absolute;left:40px;bottom:-30px')}${mon('pokemon/25', 4, 'ol', 'position:absolute;left:250px;bottom:10px', true)}</div>`
    : `<div class="t10d" aria-hidden="true"><i></i><i></i><i></i></div><div class="t10c"><div class="mon">${mon(PARTNER[ph.id]!, 6, 'ol', '', true)}</div><div class="me">${hero(ph.hero, 6, 'ol')}</div><div class="pal">${mon('pokemon/25', 5, 'ol', '', true)}</div></div>`;
  return page('title', `<div class="bgr"></div><div class="burst" style="--x:${ph.id === 'phantom' ? 78 : 50}%;--y:60%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div>${cast}
<div class="logo">${ransom('POCKET')}${ransom('RAIDERS')}</div><div class="tag">a Pokémon roguelike</div>
<div class="blade on press"${act('start')} style="--sh:#000">Press any button</div>
<div class="ver vv"${act('version')}><b>${esc(ph.colour)} VERSION</b>${esc(d.version.toUpperCase())} · FAN PROJECT<kbd>V</kbd>CHANGE VERSION</div>${keys(['Enter', 'Start', 'start'], ['V', 'Version', 'version'])}`);
}

function menu(ph: PhantomVersion, d: TitleModel): string {
  const rows = d.options.map((o, k) => `<div class="blade${k === d.index ? ' on' : ''}${o.disabled ? ' off' : ''}" style="--i:${k}"${act('pick', k, 'over')}>${esc(o.label)}${k === d.index && d.subs?.[k] ? `<small>${esc(d.subs[k])}</small>` : ''}</div>`).join('');
  const card = d.notes.length
    ? `<div class="card warn"><b>Heads up</b>${d.notes.map(esc).join('<br>')}</div>`
    : d.save ? `<div class="card"><b>${esc(d.save.title)}</b>${d.save.lines.filter(Boolean).map(esc).join('<br>')}</div>` : '';
  return page('menu', `<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(52% 0,100% 0,100% 100%,30% 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:80%;--y:70%" aria-hidden="true"></div>
<div class="hd"><small>POCKET RAIDERS</small>Main menu</div><div class="list${d.options.length > 6 ? ' many' : ''}">${rows}</div>
<div class="who">${hero(ph.hero, 8, 'sh', 'position:absolute;left:26px;top:22px')}${hero(ph.hero, 8, 'ol', 'position:relative')}</div>${card}
${keys(['Enter', 'Confirm', 'pick', d.index], ['V', 'Version', 'version'])}`);
}

export const phTitle = (ph: PhantomVersion, d: TitleModel): string => (d.press ? splash(ph, d) : menu(ph, d));

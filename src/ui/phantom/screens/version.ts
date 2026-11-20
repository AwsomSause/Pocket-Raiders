// Phantom UI: Version Select, built from the mock-ups' `version` page: five tall cards, the lit one opened with what
// the version changes. A new page (the game had none): VersionSelectScene owns the cursor. Presentation only.

import { PHANTOM_VERSIONS, type PhantomVersion, type PhantomVersionId } from '../../../core/presentation/phantom';
import { act, esc, hero, keys, page } from '../kit';
import { phHead } from '../templates';

/** The Pokémon on each version's title page. */
export const VERSION_COVER: Record<PhantomVersionId, string> = { phantom: 'Charizard', midnight: 'Gyarados', channel: 'Pikachu', fantasia: 'Venusaur', velvet: 'Gengar' };

/** What each version feels like, in the mock-ups' own words. */
const VERSION_ABOUT: Record<PhantomVersionId, string> = {
  phantom: 'Loud, sharp and fast. Every menu cuts in at an angle.',
  midnight: 'Cool and deep. Menus drift up like bubbles under a full moon.',
  channel: 'Bright and friendly. Every screen is a show on late-night TV.',
  fantasia: 'Painted and grand. Ink, gold lines and old star charts.',
  velvet: 'Quiet and rich. Blue curtains, gold trim and a deck of cards.',
};

export interface VersionModel {
  /** The card the cursor is on, and the version in use now. */
  on: number;
  now: PhantomVersionId;
}

export function phVersion(_ph: PhantomVersion, d: VersionModel): string {
  const cards = PHANTOM_VERSIONS.map((v, k) => {
    const on = k === d.on;
    return `<div class="vc v-${v.id}${on ? ' on' : ''}" style="--i:${k}" data-key="v${k}${on ? 'o' : ''}"${act('pick', k, 'over')}><div class="in"><div class="pat" aria-hidden="true"></div><div class="who${on ? ' ph-breathe' : ''}">${hero(v.hero, 5, 'ol')}</div><h3>${esc(v.colour)}<small>VERSION${v.id === d.now ? ' · IN USE' : ''}</small></h3><div class="more"><em>${esc(v.n)} style</em><p>${VERSION_ABOUT[v.id]}</p><dl><dt>Trainer</dt><dd>${esc(v.heroName)}</dd><dt>Cover Pokémon</dt><dd>${VERSION_COVER[v.id]}</dd></dl><span class="go"${act('play', k)}>Enter · ${v.id === d.now ? 'Keep' : 'Play'} this version</span></div></div></div>`;
  }).join('');
  return page('version', '<div class="bgk"></div><div class="burst" style="--x:50%;--y:110%" aria-hidden="true"></div>'
    + phHead('Choose your version', 'Phantom style · five versions') + `<div class="vsel">${cards}</div>`
    + '<div class="vnote">A version changes the look, the menu shapes and the trainer on the title page. Rules, saves and Pokémon are the same in all five, and you can switch any time in Settings.</div>'
    + keys(['◀▶', 'Version'], ['Enter', 'Play', 'play', d.on], ['Esc', 'Back', 'back']));
}

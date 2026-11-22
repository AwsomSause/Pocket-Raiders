// DOMINION redesign R4: the scene's side of the Jobs pages (pass 50). Draws the people (members in team colours, the
// Boss, the Hero) for the pages in screens/dominion/r50/jobs.ts and keeps the Pick the crew cursor. Display only:
// picking crew changes the Card's cursor (what Do it will bring), never the run.

import type Phaser from 'phaser';
import { DOMINION_DATA } from '../../core/dominion/data';
import { teamColours } from '../../core/dominion/founding';
import type { DominionBlock, Member } from '../../core/dominion/schema';
import { rxUrl } from '../../ui/redux/assets';
import { monFile } from '../../ui/redux/game';
import { tall } from '../../ui/redux/kit';
import { pngSrc, tallTeam } from '../../ui/redux/screens/dominion/teamPic';
import { R5_SIZES } from '../../ui/redux/screens/dominion/r50/sizes';
import { PCOL, SP, type R5Speaker } from '../../ui/redux/screens/dominion/r50/kit';
import type { R5Person } from '../../ui/redux/screens/dominion/r50/jobs';
import { bossPic, facePic } from './r50Bridge';

const keyOf = (look: string): string => look.replace(/^dominion\//, '').replace(/\.png$/, '');

/** A png look's size in pixels (the r50 folder's table, else the armband sheet's, else a standing grunt). */
function pngSize(look: string): [number, number] {
  const s = R5_SIZES[keyOf(look)];
  if (s) return [s[0], s[1]];
  const e = DOMINION_DATA.armbands[look];
  return e ? [e.w, e.h] : [32, 64];
}

/** A member standing `h` px tall, in the team's colours. */
export function memberBig(look: string, b: DominionBlock | null, h: number, flip = false): string {
  const tc = b ? teamColours(b) : null;
  if (look.endsWith('.png')) {
    const [w, hh] = pngSize(look);
    return `<img class="px${flip ? ' flip' : ''}" src="${pngSrc(look, tc)}" alt="" draggable="false" style="width:${Math.round((w * h) / hh)}px;height:${h}px">`;
  }
  return `<span class="${flip ? 'flip' : ''}" style="display:block${flip ? ';transform:scaleX(-1)' : ''}">${tallTeam(look, h, tc)}</span>`;
}

/** A member's ring colour: the mockups' colour for the faces they drew, else the team's main colour. */
export function memberColour(look: string, b: DominionBlock | null): string {
  return PCOL[keyOf(look)] ?? (b ? teamColours(b)?.primary : undefined) ?? '#3f7fd9';
}

export function memberPerson(m: Pick<Member, 'name' | 'look' | 'rank'>, b: DominionBlock | null, h = 250, flip = false): R5Person {
  const rank = DOMINION_DATA.pyramid.ranks.find((r) => r.id === m.rank)?.id ?? m.rank;
  return {
    pic: memberBig(m.look, b, h, flip),
    face: (sz) => facePic(m.look, b, sz),
    name: m.name,
    role: rank.replace(/-/g, ' ').replace(/(^|\s)\S/g, (x) => x.toUpperCase()),
    colour: memberColour(m.look, b),
  };
}

export const memberSpeaker = (m: Pick<Member, 'name' | 'look'>, b: DominionBlock | null): R5Speaker => ({ name: m.name, colour: memberColour(m.look, b), pic: facePic(m.look, b, 40) });

/** The Boss (the run's trainer) standing `h` px tall, and in a face ring. */
export function bossPerson(name: string, file: string | null, h = 250): R5Person {
  return {
    pic: bossPic(file, h),
    face: (sz) => `<span style="display:block;margin-left:${-Math.round(sz * 0.15)}px;margin-top:${-Math.round(sz * 0.08)}px">${bossPic(file, Math.round(sz * 2.5))}</span>`,
    name, role: 'The Boss', colour: '#e0294a',
  };
}

/** A Hero (bosses/red.png): the mockups' big sprite for the ones they drew, else the game's picture. */
export function heroPerson(name: string, look: string, h = 250, flip = true): R5Person {
  const base = look.split('/').pop()!.replace(/\.png$/, '');
  const k = base === 'red' ? 't-redbig' : base === 'blue' ? 't-blue' : base === 'ethan' ? 't-ethan' : null;
  const pic = (px: number, f: boolean): string => (k ? SP(k, px, f ? 'flip' : '') : `<img class="px${f ? ' flip' : ''}" src="${rxUrl(look)}" alt="" draggable="false" style="height:${px}px;width:auto">`);
  return {
    pic: pic(h, flip),
    face: (sz) => `<span style="display:block;margin-left:${-Math.round(sz * 0.2)}px;margin-top:${-Math.round(sz * 0.08)}px">${pic(Math.round(sz * 2.5), false)}</span>`,
    name, role: 'The Hero', colour: PCOL[k ?? ''] ?? '#ef3b2c',
  };
}

/** A Pokémon's front picture `h` px tall (empty when the art isn't loaded). */
export function monPic(scene: Phaser.Scene, speciesId: string, h: number): string {
  const f = monFile(scene, speciesId, 'front');
  return f ? tall(f, h) : '';
}

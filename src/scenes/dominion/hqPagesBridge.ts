// DOMINION redesign R2 (HQ): the scene's side of the HQ pages' pictures. Who works in each room (the crew, in their
// team colours), a post holder's figure and face, and the member who speaks. Presentation only: reads the block.

import { teamColours } from '../../core/dominion/founding';
import { FLOOR_ICON, type FloorTile } from '../../core/dominion/floorScreens';
import { postHolder } from '../../core/dominion/staff';
import type { DominionBlock, Member } from '../../core/dominion/schema';
import { esc } from '../../ui/redux/kit';
import { PCOL } from '../../ui/redux/screens/dominion/r50/kit';
import type { R5Pics, R5Voice } from '../../ui/redux/screens/dominion/r50/hqPages';
import { pngSrc, tallTeam } from '../../ui/redux/screens/dominion/teamPic';
import { facePic } from './r50Bridge';

/** Ring colours for the crew, in roster order (the mockups' Rook, Dale, Gus, Bram, Rosa, Mina). */
const RING = [PCOL['c-rook']!, PCOL['c-dale']!, PCOL['c-gus']!, PCOL['c-gruntb']!, PCOL['c-rosa']!, PCOL['c-mina']!];

export function memberFig(m: Member, b: DominionBlock, h: number, cls = 'who11'): string {
  const tc = teamColours(b);
  if (m.look.endsWith('.png')) return `<img class="px ${cls}" src="${pngSrc(m.look, tc)}" alt="" draggable="false" style="height:${h}px;width:auto">`;
  return tallTeam(m.look, h, tc, cls);
}

export function r5Pics(b: DominionBlock): R5Pics {
  const by = (id: string | null): Member | null => (id ? b.members.find((m) => m.id === id) ?? null : null);
  const colour = (id: string | null): string => {
    const i = id ? b.members.findIndex((m) => m.id === id) : -1;
    return i < 0 ? '#6d6d78' : RING[i % RING.length]!;
  };
  // The rooms take turns being looked after by the crew, in roster order (a picture, not a rule).
  const rooms = (b.hq?.rooms ?? []).filter((r) => !r.at).map((r) => r.uid);
  const worker = (t: FloorTile): Member | null => {
    if (!b.members.length) return null;
    if (t.kind === 'staff') return postHolder(b, 'checker') ?? postHolder(b, 'books') ?? postHolder(b, 'care') ?? b.members[0]!;
    // The floor's fixture is minded by the crew member after the rooms' last one (a picture, not a rule).
    if (t.kind === 'fix') return b.members[(rooms.length + Math.max(0, (FLOOR_ICON as readonly string[]).indexOf(t.icon))) % b.members.length]!;
    if (t.kind !== 'room' || !t.uid) return null;
    return b.members[Math.max(0, rooms.indexOf(t.uid)) % b.members.length]!;
  };
  const face = (id: string | null, sz: number): string => {
    const m = by(id);
    return `<span class="face" data-nocheck="" style="--c:${colour(id)};width:${sz}px;height:${sz}px">${m ? facePic(m.look, b, sz) : ''}</span>`;
  };
  return {
    tileFace: (t, sz) => {
      const m = worker(t);
      return m ? face(m.id, sz) : '';
    },
    tile: (t, h) => {
      const m = worker(t);
      return m ? memberFig(m, b, h || 70) : '';
    },
    member: (id, h) => {
      const m = by(id);
      return m ? memberFig(m, b, h, 'fspr') : '';
    },
    face,
    colour,
  };
}

/** The member who speaks on an HQ page: a post's holder, else the first of the crew. */
export function r5Voice(b: DominionBlock, id: string | null = null): R5Voice | null {
  const m = (id ? b.members.find((x) => x.id === id) : null) ?? b.members[0];
  if (!m) return null;
  const i = b.members.indexOf(m);
  return { name: m.name.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\B\w+/g, (w) => w.toLowerCase()), pic: facePic(m.look, b, 40), colour: RING[i % RING.length]! };
}

export const sleeperFigs = (b: DominionBlock): string[] => b.members.slice(0, 4).map((m) => memberFig(m, b, 70, ''));
export { esc };

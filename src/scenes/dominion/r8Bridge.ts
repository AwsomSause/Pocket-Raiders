// DOMINION redesign R8: the scene's side of the Empire and Chair pages at pass 50. How people are drawn (a member's
// look in the team's colours, a visitor's trainer sprite, a Pokémon) and who speaks in a text box. Display only.

import type Phaser from 'phaser';
import { rightHand } from '../../core/dominion/chair';
import { DOMINION_DATA } from '../../core/dominion/data';
import { monName } from '../../core/dominion/crew';
import { teamColours } from '../../core/dominion/founding';
import type { DominionBlock, Member } from '../../core/dominion/schema';
import { monFile } from '../../ui/redux/game';
import { mini } from '../../ui/redux/kit';
import { pngSrc, tallTeam } from '../../ui/redux/screens/dominion/teamPic';
import type { R5Pics } from '../../ui/redux/screens/dominion/r50/chairR8';
import { face, PCOL, SP, type R5Run } from '../../ui/redux/screens/dominion/r50/kit';
import { R5_SIZES } from '../../ui/redux/screens/dominion/r50/sizes';
import type { ArrivalX } from '../../ui/redux/screens/dominion/r50/empireR8';
import { facePic } from './r50Bridge';

export function r5Pics(scene: Phaser.Scene, b: DominionBlock): R5Pics {
  const tc = teamColours(b);
  const mon = (species: string, h: number): string => {
    const f = monFile(scene, species, 'front');
    return f ? mini(f, h) : '';
  };
  return {
    body: (look, h) => {
      if (look.startsWith('mon:')) return mon(look.slice(4), h);
      if (look.endsWith('.png')) return `<img class="px" src="${pngSrc(look, tc)}" alt="" style="height:${h}px;width:auto">`;
      return tallTeam(look, h, tc);
    },
    face: (look, sz) => {
      if (look.startsWith('mon:')) return `<span style="display:block;margin-top:2px">${mon(look.slice(4), sz)}</span>`;
      return look ? facePic(look, b, sz).replace(' data-testid="dom-hq-pic"', '') : '';
    },
    mon,
  };
}

/** A member as a text box speaker: their name, their face picture and a ring colour. */
export function speaker(b: DominionBlock, m: Member | null | undefined): { name: string; pic: string; colour: string } | null {
  if (!m) return null;
  const k = `c-${m.name.toLowerCase()}`;
  return { name: m.name, pic: facePic(m.look, b).replace(' data-testid="dom-hq-pic"', ''), colour: PCOL[k] ?? '#3f7fd9' };
}

/** The Chair's speaker: the right hand, else the first member. */
export const chairVoice = (b: DominionBlock) => speaker(b, rightHand(b) ?? b.members[0]);

/** A canon person's sprite in the mockups (c-<name>, else t-<name>), or null. */
function personKey(name: string): string | null {
  const slug = name.toLowerCase().replace(/[^a-z]/g, '');
  for (const k of [`c-${slug}`, `t-${slug}`]) if (R5_SIZES[k]) return k;
  return null;
}
/** A canon person's picture at a height, or ''. */
export function personPic(name: string, h: number): string {
  const k = personKey(name);
  return k ? SP(k, h) : '';
}
/** A canon person's face in a ring, or an empty ring. */
const personFace = (name: string, colour: string): string => {
  const k = personKey(name);
  return k ? face(k, 42, colour) : `<span class="face" data-nocheck="" style="--c:${colour};width:42px;height:42px"></span>`;
};

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Redesign R8 (mockup `johto`): a region after the first opens on its arrival page. Null in Kanto. */
export function arrival(scene: Phaser.Scene, b: DominionBlock, run: R5Run, x: { lines: string[]; shown: number; boss: string; ace: string | null }): ArrivalX | null {
  const id = b.realm?.at;
  if (!id || id === 'kanto') return null;
  const D = DOMINION_DATA;
  const region = D.regions.regions[id]?.name ?? cap(id);
  const pics = r5Pics(scene, b);
  const crew = b.members.slice(0, 3).map((m) => pics.body(m.look, 86));
  crew.splice(Math.min(2, crew.length), 0, x.boss);
  const runs: ArrivalX['runs'] = [];
  const team = D.rivals.teams.find((t) => t.region === id);
  const hq = team?.sites.find((s) => s.hq);
  const dname = (d: string | undefined): string => D.field.districts.find((z) => z.id === d)?.name ?? cap(d ?? '');
  if (team) runs.push({ face: personFace(team.boss.name, '#4a5fa0'), name: team.boss.name, role: `${team.name}'s boss in ${region}${hq ? ` · ${dname(hq.district)}` : ''}`, tag: 'Rival' });
  const H = D.hero.regions[id];
  const hero = H?.heroes[0];
  if (hero) runs.push({ face: personFace(hero, '#c1121f'), name: cap(hero), role: `${region}'s Hero`, tag: 'Hero' });
  const stand = hero ? H?.standIn[hero] : undefined;
  if (stand) runs.push({ face: personFace(stand, '#c1121f'), name: cap(stand), role: 'Steals from everyone, you too', tag: 'Wild card' });
  const gym = D.growth.gyms.find((g) => g.district === hq?.district) ?? D.growth.gyms[0];
  if (gym) runs.push({ face: personFace(gym.leader, '#c1121f'), name: gym.leader, role: `${dname(gym.district)} Gym · runs the city`, tag: 'Leader' });
  const w = speaker(b, b.members[0]);
  const shown = x.lines.slice(0, x.shown);
  return {
    region, id, place: `${D.packs[id]?.warehouse ?? region} harbour`, day: b.day, crew, ace: x.ace ? pics.mon(x.ace, 40) : '', aceName: x.ace ? monName(x.ace) : '',
    funds: run.funds, heat: Math.round(run.heat), size: `${b.members.length} + Boss`, runs, who: w, line: shown[shown.length - 1] ?? '', more: x.shown < x.lines.length,
  };
}

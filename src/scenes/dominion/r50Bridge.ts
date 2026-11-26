// DOMINION redesign R0: the scene's side of the pass-50 pages. Builds the hub's live data (rooms, the member on duty,
// the Boss), the key strip's party, and keeps the Start menu (a panel over the HQ, mockup `start`). The chrome's
// links (`r5go` with a mockup page id) go to the screens the game already has; ids with no screen yet do nothing.

import type Phaser from 'phaser';
import { DOMINION_DATA } from '../../core/dominion/data';
import { cellsOf, baseModel } from '../../core/dominion/hqScreens';
import { hqName } from '../../core/dominion/hq';
import { teamColours } from '../../core/dominion/founding';
import { maxHp } from '../../core/pokemon';
import { levelCap } from '../../core/regions';
import type { DominionBlock } from '../../core/dominion/schema';
import { services } from '../../game/services';
import { monFile } from '../../ui/redux/game';
import { mini, tall } from '../../ui/redux/kit';
import { pngSrc, tallTeam } from '../../ui/redux/screens/dominion/teamPic';
import { START_ITEMS, type R5HubExtras } from '../../ui/redux/screens/dominion/r50/hub';
import { R5_SIZES } from '../../ui/redux/screens/dominion/r50/sizes';
import { r5RunOf, type R5PartyMon } from '../../ui/redux/screens/dominion/r50/run';
import { eventOpen, regionEvent } from '../../core/dominion/life';
import { SP, type R5Run } from '../../ui/redux/screens/dominion/r50/kit';

/** Tabs open on the HQ (Jobs opens the Job board, redesign R4). */
export const R5_OPEN_TABS = [0, 1, 2, 3, 4, 5] as const;

/** The key strip's party: each Pokémon's icon and HP. */
export function r5Party(scene: Phaser.Scene): R5PartyMon[] {
  const { content, run } = services().session;
  return (run?.party ?? []).slice(0, 6).map((m) => {
    const f = monFile(scene, m.speciesId, 'icon', !!m.shiny);
    return { html: f ? mini(f, 18) : '', hp: Math.round((m.hp / Math.max(1, maxHp(content, m))) * 100) };
  });
}

export function r5Run(scene: Phaser.Scene, b: DominionBlock): R5Run {
  // R6: the top bar's festival lantern while a Region Event's action is open.
  const ev = regionEvent(b);
  return { ...r5RunOf(b, r5Party(scene), { open: R5_OPEN_TABS }), ...(eventOpen(b, ev) ? { festival: ev.name } : {}) };
}

/** A face picture: a png look (team-coloured when the team is founded) or a trainer atlas, cropped to the head. */
export function facePic(look: string, b: DominionBlock | null, sz = 40): string {
  const tc = b ? teamColours(b) : null;
  if (look.endsWith('.png')) {
    const k = look.replace(/^dominion\//, '').replace(/\.png$/, '');
    const s = R5_SIZES[k] ?? [32, 64];
    const sc = (sz * 2.5) / s[1];
    const w = Math.round(s[0] * sc), h = Math.round(s[1] * sc);
    return `<img class="px" src="${pngSrc(look, tc)}" alt="" data-testid="dom-hq-pic" style="width:${w}px;height:${h}px;margin-left:${-Math.round((w - sz) / 2)}px;margin-top:${-Math.round(sz * 0.08)}px">`;
  }
  return `<span style="display:block;margin-left:${-Math.round(sz * 0.25)}px;margin-top:${-Math.round(sz * 0.08)}px">${tallTeam(look, sz * 2.5, tc)}</span>`;
}

/** The Boss (the run's trainer atlas) at a height; Nate's mockup sprite when the atlas isn't there. */
/** The run's trainer as the Boss: the mockups' big sprite for the trainers they drew (Nate, Red, Blue), else the
 *  trainer atlas scaled to `h`. */
export function bossPic(file: string | null, h: number): string {
  const base = (file ?? '').split('/').pop()!.toLowerCase();
  const k = /nate/.test(base) ? 't-natebig' : /^red|[^a-z]red/.test(base) ? 't-redbig' : /blue/.test(base) ? 't-blue' : null;
  if (k) return SP(k, h);
  return (file ? tall(file, h) : '') || SP('t-natebig', h);
}

export function r5Hub(b: DominionBlock, o: { look: string; bossFile: string | null; notice: string | null; at: number; threat: R5HubExtras['threat']; desk: number | null; paper: string | null }): R5HubExtras {
  const run = services().session.run!;
  const cap = levelCap(services().session.content, run.regionIndex);
  const bm = baseModel(b, cap, 0, null, null);
  const { cells, rows } = cellsOf(b, null);
  const nx = bm.upgrading ? { name: bm.upgrading.to, cost: 0, ready: bm.upgrading.ready, building: true } : bm.next.to ? { name: bm.next.name, cost: bm.next.cost, ready: null, building: false } : null;
  const m = b.members[0];
  return {
    rooms: cells.map((c) => ({ name: c.name, icon: c.icon, sprite: c.sprite, fx: c.fx, row: c.row, span: c.span, state: c.state })),
    rows,
    level: b.hqLevel,
    levelName: DOMINION_DATA.hq.levels[b.hqLevel - 1]?.name ?? '',
    hqName: hqName(b),
    next: nx,
    member: { name: m?.name ?? '', pic: facePic(o.look, b), colour: '#3f7fd9', band: teamColours(b) && b.teamName ? `${b.teamName} armband` : 'blank armband' },
    boss: `<span style="display:block;margin-left:-6px;margin-top:-2px">${bossPic(o.bossFile, 75)}</span>`,
    threat: o.threat,
    desk: o.desk,
    paper: o.paper,
    notice: o.notice,
    at: o.at,
  };
}

// ---------- the Start menu ----------

export class R5StartMenu {
  on = false;
  at = 0;
  constructor(private go: (id: string) => void, private refresh: () => void) {}

  open(): void { this.on = true; this.at = 0; this.refresh(); }
  close(): void { this.on = false; this.refresh(); }

  pick(i: number): void {
    const it = START_ITEMS[i];
    if (!it) return;
    this.on = false;
    if (it.id !== 'close') this.go(it.id);
    this.refresh();
  }

  /** Keys while the menu is up: up/down move, confirm opens, back closes. Every key is the menu's. */
  key(a: 'up' | 'down' | 'left' | 'right' | 'confirm' | 'back'): boolean {
    if (!this.on) return false;
    if (a === 'down') this.at = (this.at + 1) % START_ITEMS.length;
    else if (a === 'up') this.at = (this.at + START_ITEMS.length - 1) % START_ITEMS.length;
    else if (a === 'confirm') return this.pick(this.at), true;
    else if (a === 'back') return this.close(), true;
    this.refresh();
    return true;
  }
}

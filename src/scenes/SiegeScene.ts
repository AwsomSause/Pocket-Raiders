// The Siege Map screen (Beta 0.6 E4): Kice's pick, Siege Map 7 "Rocket Ledger". A ledger page with one row per district
// (stamp: Held / Contested / Lost, who holds it, what it gives, what it costs if lost), sticky notes for the allies, and a
// footer. The player picks a gate; a Held gate is free, the others cost one battle. It only shows core/formats/siege.ts
// and passes the choice back: it decides nothing.

import Phaser from 'phaser';
import { chooseOption, closeFormat, formatOver } from '../core/formats/registry';
import { siegeView, type DistrictStatus, type SiegeState } from '../core/formats/siege';
import { currentFormat } from '../core/formats/store';
import { services } from '../game/services';
import { onInputAction } from '../ui/input';
import { fitBlock } from '../ui/fitText';
import { GAME_WIDTH, textStyle } from '../ui/theme';
import { Menu } from '../ui/widgets';

export interface SiegeSceneData {
  from: string;
  onDone?: () => void;
}

const INK = '#222018';
const PAPER = 0xefe6d0;
const STAMP: Record<DistrictStatus, { label: string; color: string; hex: number }> = {
  held: { label: 'HELD', color: '#1f9d55', hex: 0x1f9d55 },
  contested: { label: 'CONTESTED', color: '#d98a1a', hex: 0xd98a1a },
  lost: { label: 'LOST', color: '#d64545', hex: 0xd64545 },
};
const COLS = { district: 64, status: 190, heldBy: 330, ifHeld: 450, ifLost: 560 };

export class SiegeScene extends Phaser.Scene {
  private data0!: SiegeSceneData;
  private layer: Phaser.GameObjects.GameObject[] = [];
  private menu: Menu | null = null;

  constructor() {
    super('Siege');
  }

  init(data: SiegeSceneData): void {
    this.data0 = data;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#141414');
    onInputAction(this, (a) => this.menu?.handle(a));
    this.render();
  }

  private ctx() {
    const s = services();
    return { content: s.session.content, run: s.session.run! };
  }

  private clear(): void {
    this.menu?.destroy();
    this.menu = null;
    for (const o of this.layer) o.destroy();
    this.layer = [];
  }

  private state(): SiegeState | null {
    const slot = currentFormat(this.ctx().run);
    return slot?.id === 'siege' ? (slot.state as unknown as SiegeState) : null;
  }

  private render(): void {
    this.clear();
    const s = this.state();
    if (!s) return this.finish();
    const v = siegeView(s);
    const paper = this.add.rectangle(GAME_WIDTH / 2, 270, 880, 524, PAPER);
    this.layer.push(paper);
    this.layer.push(this.add.text(64, 22, v.title, textStyle(26, INK)));
    this.layer.push(this.add.text(64, 54, v.subtitle, textStyle(13, '#5a5546')));
    const hy = 80;
    for (const [label, x] of [['District', COLS.district], ['Status', COLS.status], ['Held by', COLS.heldBy], ['If held', COLS.ifHeld], ['If lost', COLS.ifLost]] as const) {
      this.layer.push(this.add.text(x, hy, label, textStyle(13, INK)));
    }
    this.layer.push(this.add.rectangle(GAME_WIDTH / 2, hy + 20, 832, 2, 0x222018));
    v.rows.forEach((r, i) => {
      const y = hy + 28 + i * 46;
      this.layer.push(this.add.text(COLS.district, y + 2, r.name, textStyle(15, INK)));
      if (r.place) this.layer.push(this.add.text(COLS.district, y + 22, r.place, textStyle(11, '#5a5546')));
      const st = STAMP[r.status];
      const stamp = this.add.text(COLS.status + 38, y + 18, st.label, textStyle(13, st.color, { fontStyle: 'bold' })).setOrigin(0.5).setAngle(-3);
      const box = this.add.rectangle(stamp.x, stamp.y, stamp.width + 14, stamp.height + 8).setStrokeStyle(2, st.hex).setAngle(-3);
      this.layer.push(box, stamp);
      this.layer.push(this.add.text(COLS.heldBy, y + 8, r.heldBy, textStyle(12, INK, { wordWrap: { width: 112 } })));
      this.layer.push(this.add.text(COLS.ifHeld, y + 8, r.ifHeld, textStyle(12, INK)));
      const lost = this.add.text(COLS.ifLost, y + 4, r.ifLost, textStyle(12, INK, { wordWrap: { width: 300 } }));
      fitBlock(lost, 300, 40);
      this.layer.push(lost);
      this.layer.push(this.add.rectangle(GAME_WIDTH / 2, y + 40, 832, 1, 0x8a8470));
    });
    // Sticky notes: who is holding what for you.
    const allies = v.rows.filter((r) => r.heldBy && r.id !== 'center');
    allies.forEach((r, i) => {
      const x = 64 + i * 200;
      this.layer.push(this.add.rectangle(x + 90, 357, 184, 40, 0xffe27a).setAngle(i % 2 ? 1 : -1));
      this.layer.push(this.add.text(x + 8, 344, r.heldBy, textStyle(13, INK, { wordWrap: { width: 170 } })));
    });
    // Footer.
    this.layer.push(this.add.rectangle(GAME_WIDTH / 2, 410, 832, 44, 0xf8f4e8).setStrokeStyle(2, 0xbbb5a2));
    this.layer.push(this.add.text(80, 398, `Lost effects ${v.lostCount} / ${v.gateCount}${v.tries ? `   Gate fights lost: ${v.tries}` : ''}`, textStyle(14, INK)));
    const ctx = this.ctx();
    const over = s.entered !== null || formatOver(ctx);
    const gates = s.districts.filter((d) => d.gate);
    const options = over
      ? [{ label: 'Begin Phase 1: The Streets' }]
      : gates.map((d) => ({ label: `${d.name} (${d.status === 'held' ? 'free entry' : 'one battle'})` }));
    this.menu = new Menu(this, {
      x: 64, y: 440, options, columns: over ? 1 : 2, itemWidth: over ? 360 : 410, itemHeight: 32, fontSize: 15, color: INK,
      onSelect: (i) => {
        if (over) return this.finish();
        chooseOption(ctx, gates[i]!.id);
        services().session.saveRunNow();
        if (ctx.run.phase === 'battle') {
          this.clear();
          this.scene.stop(this.data0.from);
          this.scene.start('Battle');
          return;
        }
        this.render();
      },
    });
  }

  private finish(): void {
    const ctx = this.ctx();
    if (!this.state() || formatOver(ctx)) closeFormat(ctx);
    services().session.saveRunNow();
    this.clear();
    this.scene.stop(this.data0.from);
    this.scene.start(this.data0.from);
    this.data0.onDone?.();
  }
}

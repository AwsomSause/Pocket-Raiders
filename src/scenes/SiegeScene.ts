// The Siege Map screen (Beta 0.6 E4): Kice's pick, Siege Map 7 "Rocket Ledger". A ledger page with one row per district
// (stamp: Held / Contested / Lost, who holds it, what it gives, what it costs if lost), sticky notes for the allies, and a
// footer. The player picks a gate; a Held gate is free, the others cost one battle. It only shows core/formats/siege.ts
// and passes the choice back: it decides nothing.

import Phaser from 'phaser';
import { chooseOption, closeFormat, formatOver } from '../core/formats/registry';
import { siegeView, type DistrictStatus, type SiegeState } from '../core/formats/siege';
import { currentFormat } from '../core/formats/store';
import { services } from '../game/services';
import { onInputAction, type InputAction } from '../ui/input';
import { fitBlock } from '../ui/fitText';
import { siegeMapView, type SiegeMapModel } from '../ui/redux/screens/ops';
import { mountRedux, reduxOn, type ReduxView } from '../ui/redux/stage';
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
  /** New UI: the mock-ups' Siege page over the canvas, the district under the cursor and the columns the page draws. */
  private rx: ReduxView | null = null;
  private at = 0;
  private cols = 3;

  constructor() {
    super('Siege');
  }

  init(data: SiegeSceneData): void {
    this.data0 = data;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#141414');
    this.rx = null;
    if (reduxOn()) {
      const s = this.state();
      if (!s) return this.finish();
      // The cursor starts on the gate gone through, else a free gate, else the first gate.
      const first = [s.districts.findIndex((d) => d.id === s.entered), s.districts.findIndex((d) => d.gate && d.status === 'held'), s.districts.findIndex((d) => d.gate)].find((k) => k >= 0);
      this.at = first ?? 0;
      this.rx = mountRedux(this, {
        render: (c) => {
          this.cols = c.v(2) ? 1 : 3;
          return siegeMapView(c, this.model());
        },
        acts: {
          // A click (or a tap) on a district only moves the cursor there; the button goes in, so a battle is never one slip away.
          district: (k) => this.focus(Number(k)),
          enter: () => this.enter(),
        },
        overs: { over: (k) => this.focus(Number(k)) },
      });
      onInputAction(this, (a) => this.key(a));
      return;
    }
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

  // ---- New UI ----

  private over(s: SiegeState): boolean {
    return s.entered !== null || formatOver(this.ctx());
  }

  private model(): SiegeMapModel {
    const s = this.state();
    if (!s) return { header: 'Siege', title: '', rows: [], index: 0, entered: null, tries: 0, button: 'Continue', ready: true, text: '' };
    const v = siegeView(s), over = this.over(s), cur = v.rows[this.at];
    // The ledger's title is written in capitals for the old page; the mock-up page writes it as a name.
    const named = (t: string): string => t.toLowerCase().replace(/(^|[\s·])\p{L}/gu, (m) => m.toUpperCase());
    const entered = v.rows.findIndex((r) => r.id === s.entered);
    return {
      header: `Siege · ${named(v.title.split(' · ')[0] ?? '')}`,
      title: named(v.title),
      rows: v.rows.map((r) => ({ name: r.name, status: r.status, gate: r.gate, heldBy: r.heldBy, ifLost: r.ifLost })),
      index: this.at,
      entered: entered < 0 ? null : entered,
      tries: v.tries,
      button: over ? 'Begin Phase 1: The Streets' : cur?.gate ? `Enter by ${cur.name}` : 'No gate here',
      ready: over || !!cur?.gate,
      text: over && entered >= 0
        ? `You went in by the ${v.rows[entered]!.name}. Lost districts apply their effects.`
        : 'Each district is Held, Contested or Lost. Held gates are free. The rest cost one battle. Lost districts apply their effects.',
    };
  }

  private focus(k: number): void {
    const n = this.state()?.districts.length ?? 0;
    if (!(k >= 0 && k < n) || k === this.at) return;
    this.at = k;
    this.rx?.refresh();
  }

  private key(a: InputAction): void {
    if (a === 'confirm') return this.enter();
    const step = a === 'left' ? -1 : a === 'right' ? 1 : a === 'up' ? -this.cols : a === 'down' ? this.cols : 0;
    if (!step) return;
    const n = this.state()?.districts.length ?? 0, to = this.at + step;
    // Down from above a short last row lands on that row's last district.
    const short = a === 'down' && to >= n && Math.floor(this.at / this.cols) < Math.floor((n - 1) / this.cols);
    this.focus(short ? n - 1 : to);
  }

  private enter(): void {
    const s = this.state();
    if (!s || this.over(s)) return this.finish();
    const d = s.districts[this.at];
    if (!d?.gate) return;
    const ctx = this.ctx();
    chooseOption(ctx, d.id);
    services().session.saveRunNow();
    if (ctx.run.phase === 'battle') {
      this.scene.stop(this.data0.from);
      this.scene.start('Battle');
      return;
    }
    this.rx?.refresh();
  }

  // ---- Old UI ----

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

// Kecleon's Bazaar (mock-up 07, "with many improvements"): an outdoor market stall under a striped
// awning in town. Kecleon bobs behind the counter and changes colour to match the good you look at,
// talks about it, and haggles once per visit (Charisma sets the odds, shown on the friendly-price
// meter). Goods sit on a carpet with hand-written price tags; the focused one lifts and sparkles.
import Phaser from 'phaser';
import { paintLightGlass } from '../eventStyles/common';
import { fitBlock, fitLine } from '../fitText';
import { GAME_HEIGHT, GAME_WIDTH, mixColor, textStyle } from '../theme';
import type { ShopRow, ShopView } from '../shopLook';
import { categoryColor, countMoney, gridMove, partyStrip, plusOne, priceText } from './common';
import { backdrop, keeper, mat, speech } from './stall';
import type { ShopLayout } from './types';

const AWNING = { x: 70, y: 18, w: 820, h: 70 };
const TABLE_Y = 300;
const PANEL_Y = 438;

/** What Kecleon says about a good. */
function chatter(row: ShopRow | undefined, haggled: boolean): string {
  if (!row) return 'Kek! Selling something? Kecleon buys anything!';
  if (row.haggle === 'won') return `Kek... fine, fine. The ${row.name}, cheaper. Just for you.`;
  if (row.haggle === 'lost') return `Hmph! The ${row.name} costs more now. Kek.`;
  if (row.users && row.users.length > 0) return `Kek! The ${row.name}? One of your friends would love that!`;
  if (row.users) return `The ${row.name}... nobody in your party can use it. Kek?`;
  if (!row.affordable) return `Kek kek. The ${row.name} is ${priceText(row)}. Come back richer!`;
  if (!haggled) return `The ${row.name}, ${priceText(row)}. Want to haggle? Kek!`;
  return `The ${row.name}, ${priceText(row)}. Good choice, kek!`;
}

export const bazaar: ShopLayout = (ctx, hooks) => {
  const { scene, motion } = ctx;
  let view = ctx.view;
  const sky = scene.add.graphics().setDepth(-60);
  sky.fillGradientStyle(0x9ad8ff, 0x9ad8ff, 0xffe2b0, 0xffe2b0, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  backdrop(ctx, 'pack.memories.eventbg.city');
  scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffc070, 0.12).setOrigin(0);

  // Awning: red and cream stripes with a scalloped edge, and the sign.
  const aw = scene.add.graphics();
  aw.fillStyle(0x000000, 0.18).fillRect(AWNING.x + 6, AWNING.y + 8, AWNING.w, AWNING.h);
  for (let x = 0, k = 0; x < AWNING.w; x += 52, k++) aw.fillStyle(k % 2 ? 0xfff3e0 : 0xf05a4a, 1).fillRect(AWNING.x + x, AWNING.y, Math.min(52, AWNING.w - x), AWNING.h);
  for (let x = 0, k = 0; x < AWNING.w; x += 52, k++) aw.fillStyle(k % 2 ? 0xfff3e0 : 0xf05a4a, 1).fillCircle(AWNING.x + x + 26, AWNING.y + AWNING.h, 26);
  aw.fillStyle(0x8a5a30, 1).fillRect(AWNING.x + 10, AWNING.y + AWNING.h, 10, 230).fillRect(AWNING.x + AWNING.w - 20, AWNING.y + AWNING.h, 10, 230);
  scene.add.text(GAME_WIDTH / 2, AWNING.y + 34, ctx.title.toUpperCase(), textStyle(32, '#ffffff', { stroke: '#a02a20', strokeThickness: 6 })).setOrigin(0.5).setName('shop-title');

  // Kecleon behind the counter, and its speech bubble.
  const kec = keeper(ctx, 'kecleon', 300, 214, 2) as Phaser.GameObjects.Sprite | null;
  const bubble = speech(ctx, 420, 120, 330, 66);

  // Table and carpet.
  const table = scene.add.graphics();
  table.fillStyle(0x5a3a20, 1).fillRoundedRect(96, TABLE_Y - 34, 768, 140, 10);
  table.fillGradientStyle(0xc08a50, 0xc08a50, 0x8a5a30, 0x8a5a30, 1).fillRoundedRect(96, TABLE_Y - 40, 768, 130, 10);
  for (let x = 0, k = 0; x < 740; x += 26, k++) table.fillStyle(k % 2 ? 0xa85ac8 : 0x7a3a9a, 0.9).fillRect(110 + x, TABLE_Y - 30, Math.min(26, 740 - x), 46);
  const cols = Math.max(1, Math.min(8, view.rows.length));
  const goods = mat(ctx, hooks, { x: 110, y: TABLE_Y - 12, w: 740, rowH: 120, rows: 1, columns: cols }, { tag: 0xfff6e6, tagText: '#3a2a10', glow: 0xffd84a });

  // Money and the Sell pill (top corners).
  const pills = scene.add.graphics();
  paintLightGlass(pills, 12, 12, 150, 38, { radius: 19 });
  const money = scene.add.text(87, 31, `₽${view.money}`, textStyle(24, '#2a2a3a')).setOrigin(0.5).setName('shop-money');
  const sellG = scene.add.graphics();
  const paintSell = (on: boolean) => {
    sellG.clear();
    if (!view.canSell) return;
    if (on) sellG.fillStyle(0xffd84a, 0.4).fillRoundedRect(GAME_WIDTH - 166, 8, 158, 46, 23);
    paintLightGlass(sellG, GAME_WIDTH - 162, 12, 150, 38, { radius: 19 });
  };
  if (view.canSell) {
    scene.add.text(GAME_WIDTH - 87, 31, 'Sell items…', textStyle(16, '#8a5a00')).setOrigin(0.5).setName('shop-sell').setDepth(1);
    scene.add.zone(GAME_WIDTH - 162, 12, 150, 38).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerdown', () => hooks.pick(view.rows.length)).on('pointerover', () => hooks.focus(view.rows.length));
  }
  scene.add.text(12, 62, ctx.clock, textStyle(16, '#ffffff', { stroke: '#3a2a10', strokeThickness: 3 })).setOrigin(0, 0.5);

  // Bottom panels: friendly price meter, the focused good, the haggle stamp.
  const panels = scene.add.graphics();
  paintLightGlass(panels, 12, PANEL_Y, 296, 90, { radius: 18 });
  paintLightGlass(panels, 318, PANEL_Y, 344, 90, { radius: 18 });
  const charisma = ctx.haggle?.charisma ?? 0;
  const chance = ctx.haggle?.chance ?? 0;
  scene.add.text(28, PANEL_Y + 18, `Friendly price (Charisma ${charisma})`, textStyle(16, '#2a2a3a')).setOrigin(0, 0.5);
  const meter = scene.add.graphics();
  meter.fillStyle(0xd9e6f2, 1).fillRoundedRect(28, PANEL_Y + 36, 264, 16, 8);
  meter.fillGradientStyle(0xffd84a, 0xff9a3a, 0xffd84a, 0xff9a3a, 1).fillRoundedRect(28, PANEL_Y + 36, Math.max(16, 264 * (charisma / 100)), 16, 8);
  scene.add.text(28, PANEL_Y + 70, `Haggle odds ${Math.round(chance * 100)}%`, textStyle(16, '#4a6a8a')).setOrigin(0, 0.5).setName('shop-haggle-odds');
  const name = scene.add.text(334, PANEL_Y + 18, '', textStyle(16, '#2a2a3a')).setOrigin(0, 0.5).setName('shop-item-name');
  const info = scene.add.text(334, PANEL_Y + 44, '', textStyle(16, '#4a5a6a', { wordWrap: { width: 312 } })).setOrigin(0, 0.5).setName('shop-hint');
  const party = partyStrip(ctx, 348, PANEL_Y + 72, { gap: 34 });
  const stamp = scene.add.graphics();
  const stampText = scene.add.text(803, PANEL_Y + 45, '', textStyle(16, '#6a4a00', { align: 'center', wordWrap: { width: 250 } })).setOrigin(0.5).setName('shop-haggle');
  const paintStamp = () => {
    const h = view.rows.find((r) => r.haggle);
    stamp.clear().fillStyle(h ? (h.haggle === 'won' ? 0xc8f0c8 : 0xf8c8c0) : 0xfff3c0, 1).fillRoundedRect(672, PANEL_Y, 276, 90, 16);
    stamp.lineStyle(3, h ? (h.haggle === 'won' ? 0x2a9a4a : 0xc04030) : 0xc08a20, 1).strokeRoundedRect(672, PANEL_Y, 276, 90, 16);
    stampText.setText(h ? (h.haggle === 'won' ? `Haggled! ${h.name} is cheaper this visit` : `Kecleon is offended: ${h.name} costs more`) : 'Haggle! Pick a good and choose Haggle (once per visit)');
    fitBlock(stampText, 250, 80);
  };
  paintStamp();

  let current = -1;
  const focus = (i: number) => {
    current = i;
    goods.focus(i);
    paintSell(i >= view.rows.length);
    const r = view.rows[i];
    party.show(r ?? null);
    bubble.say(ctx.notice && current === -2 ? ctx.notice : chatter(r, view.rows.some((x) => x.haggle)));
    // Kecleon takes on the colour of the good it is showing.
    if (kec && 'setTint' in kec) {
      const tint = r ? mixColor(categoryColor(r), 0xffffff, 0.45) : 0xffffff;
      if (motion === 'off') kec.setTint(tint);
      else {
        const from = Phaser.Display.Color.ValueToColor((kec as Phaser.GameObjects.Sprite).tintTopLeft);
        const to = Phaser.Display.Color.ValueToColor(tint);
        const box = { t: 0 };
        scene.tweens.add({ targets: box, t: 100, duration: motion === 'full' ? 260 : 80, onUpdate: () => {
          const c = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, 100, box.t);
          kec.setTint(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
        } });
      }
    }
    if (r) {
      fitLine(name.setText(`${r.label}  ·  ${priceText(r)}`), 312, 10);
      fitBlock(info, 312, 32, r.description);
    } else {
      name.setText('Sell items');
      fitBlock(info, 312, 32, 'The stall buys from your Bag.');
    }
  };

  return {
    move: (action, from) => gridMove(action, from, view.rows.length + (view.canSell ? 1 : 0), cols),
    focus,
    refresh(next: ShopView, bought, message) {
      const before = view.money;
      view = next;
      goods.rebuild(view.rows);
      countMoney(ctx, money, before, view.money);
      paintStamp();
      const keep = current;
      current = -1;
      focus(Math.min(keep, view.rows.length - (view.canSell ? 0 : 1)));
      if (message) bubble.say(message);
      if (bought === null) return;
      const at = goods.at(bought);
      plusOne(ctx, at.x, at.y - 40, undefined, '#1d6a2a');
    },
    haggled(next, i, won, message) {
      this.refresh(next, null, message);
      bubble.say(message);
      if (!kec || motion === 'off') return;
      // A happy hop on a win, an offended shake on a loss.
      const s = kec as Phaser.GameObjects.Sprite;
      if (won) scene.tweens.add({ targets: s, scaleY: s.scaleY * 1.08, duration: 120, yoyo: true, repeat: 2 });
      else scene.tweens.add({ targets: s, x: s.x + 8, duration: 60, yoyo: true, repeat: 4 });
      void i;
    },
  };
};

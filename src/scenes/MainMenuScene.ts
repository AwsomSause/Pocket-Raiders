// Title screen: Continue, the Hub (start a run, Bank, trainers, achievements), sound toggle, and any save warnings.

import { dailyChest } from '../ui/overlays';
import { pokemonIcon } from '../ui/sprites';
import Phaser from 'phaser';
import { prologueGateActive } from '../core/story2/prologue';
import { shouldWelcome } from './TutorialScene';
import { services } from '../game/services';
import { playMusic, stopMusic } from '../ui/audio';
import { onInputAction } from '../ui/input';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, PIXEL_SCALE, textStyle } from '../ui/theme';
import { drawPanel, Menu, type MenuOption } from '../ui/widgets';
import { ArenaBackdrop, drawLogo, ShowcaseMon } from '../ui/showcase';
import { loadAssets } from '../ui/lazyAssets';
import { pokemonAssetIds } from '../assets/catalog';
import { sceneForRun } from './routing';
import { screenStyleOf } from '../core/presentation/screenStyles';
import { dressScreen } from '../ui/screenDress';
import { TITLE_LAYOUTS } from '../ui/titleLayouts';
import { slotCard } from '../core/presentation/slotLines';

export class MainMenuScene extends Phaser.Scene {
  private menu!: Menu;
  private pressWait = false;
  private copyNote: Phaser.GameObjects.Text | null = null;

  constructor() {
    super('MainMenu');
  }

  create(data?: { focus?: number; afterSplash?: boolean }): void {
    const { session } = services();
    session.closeRun();
    // First visit to this version: patch notes, then the optional tutorial (skipped in automated browsers so tests reach the menu; ?welcome=1 forces it).
    if (shouldWelcome(session.settings)) {
      this.scene.start('Welcome', { phase: 'log', returnTo: 'MainMenu' });
      return;
    }
    if (prologueGateActive(session.profile.story)) {
      this.scene.start('Prologue');
      return;
    }
    if (data?.afterSplash && session.savedRun.status !== 'corrupt' && session.savedRun.status !== 'incompatible') {
      // Update splash just ended: skip the menu, resume the latest run or enter the hub.
      if (session.latestRunSlot() !== null) this.continueRun();
      else this.scene.start('Hub');
      return;
    }
    playMusic(this, 'bgm.menu');

    // A battlefield that cycles through the arenas, with a Pokémon on show.
    // A built screen style (Settings > Display) paints its own backdrop; 'original' keeps the arenas.
    const look = screenStyleOf('title', session.settings.screenStyles, session.profile.stats.runsEnded);
    if (look === 'original') {
      new ArenaBackdrop(this, { platformAt: { x: 740, y: 330 }, only: session.profile.menuArena });
      const shade = this.add.graphics().setDepth(-20);
      for (let i = 0; i < 20; i++) {
        shade.fillStyle(0x0e0b12, 0.6 * (1 - i / 20));
        shade.fillRect(i * 24, 0, 24, GAME_HEIGHT);
      }
    } else dressScreen(this, 'title', look, session.settings.battleAnimations);
    const lay = look === 'original' ? undefined : TITLE_LAYOUTS[look];
    // Continue picks the slot saved most recently (this one, unless another slot has a newer run).
    const latest = session.latestRunSlot();
    const species = [...session.content.species.values()].filter((sp) => !sp.id.includes('-'));
    const mon = new ShowcaseMon(this, lay?.mon.x ?? 740, lay?.mon.y ?? 336, PIXEL_SCALE, lay?.mon.size ?? 230);
    const pick = () => {
      const sp = Phaser.Utils.Array.GetRandom(species);
      if (sp) void loadAssets(this, [pokemonAssetIds(sp.assets).front]).then(() => this.scene.isActive() && mon.show(sp));
    };
    if (!lay?.carousel) {
      pick();
      this.time.addEvent({ delay: 6500, loop: true, callback: pick });
    }

    drawLogo(this, lay?.logo.x ?? 48, lay?.logo.y ?? 18, lay?.logo.size ?? 60, lay?.logo.origin ?? 0, session.settings.battleAnimations);
    // Pet-the-logo easter egg (I477): tapping the logo makes a Pokémon peek in from the edge.
    const pet = this.add.zone(lay?.logo.x ?? 48, lay?.logo.y ?? 18, 420, 130).setOrigin(0).setInteractive({ useHandCursor: true });
    pet.on('pointerdown', () => {
      const sp = Phaser.Utils.Array.GetRandom(species);
      if (!sp) return;
      void loadAssets(this, [pokemonAssetIds(sp.assets).icon]).then(() => {
        if (!this.scene.isActive()) return;
        const icon = pokemonIcon(this, sp, GAME_WIDTH + 40, 90 + Math.random() * 40, 2.4);
        (icon as Phaser.GameObjects.Image).setDepth(50);
        this.tweens.add({ targets: icon, x: GAME_WIDTH - 60, duration: 260, ease: 'Back.easeOut', yoyo: true, hold: 900, onComplete: () => icon.destroy() });
      });
    });
    dailyChest(this, lay ? (lay.carousel ? 910 : 900) : 530, lay ? (lay.carousel ? 410 : 440) : 462, new Date().toISOString().slice(0, 10));
    if (!lay) this.add.text(64, 158, 'Raid. Collect. Rise.', textStyle(16, COLORS.textMuted));
    if (!lay) drawPanel(this, 48, 186, 400, 300, { alpha: 0.95 });
    else if (lay.panel) this.drawLookPanel(lay.panel);

    const saved = session.savedRun;
    const damaged = saved.status === 'corrupt' || saved.status === 'incompatible';
    const options: { option: MenuOption; action: () => void }[] = [];
    if (latest !== null && !damaged) {
      options.push({ option: { label: `Continue (Slot ${latest})` }, action: () => this.continueRun() });
    } else if (damaged) {
      options.push({ option: { label: 'Discard damaged save' }, action: () => this.discardDamaged() });
    } else {
      options.push({ option: { label: 'Continue', disabled: true }, action: () => undefined });
    }
    options.push({ option: { label: 'Enter the Hub', disabled: damaged }, action: () => this.scene.start('Hub') });
    options.push({ option: { label: 'New Run', disabled: damaged }, action: () => this.newRun() });
    options.push({ option: { label: 'Story Run', disabled: damaged }, action: () => this.storyRun() });
    options.push({ option: { label: 'Save Slots' }, action: () => this.scene.start('SaveSlots') });
    options.push({ option: { label: 'Settings' }, action: () => this.scene.start('Settings', { from: 'MainMenu' }) });
    // Save Carousel look: Copy puts this slot into the first empty one.
    if (lay?.carousel) {
      options.push({
        option: { label: 'Copy slot' },
        action: () => {
          const r = services().session.copySlot();
          this.copyNote?.setText(r.ok ? `Slot ${services().session.slot} copied to slot ${r.to}.` : r.reason);
          if (r.ok) this.time.delayedCall(900, () => this.scene.restart({}));
        },
      });
    }

    const rowH = Math.min(46, Math.floor(272 / options.length));
    if (lay?.tiles) this.drawTiles(lay, options.length);
    if (lay?.carousel) {
      this.drawCarousel();
      this.copyNote = this.add.text(GAME_WIDTH / 2, 420, '', textStyle(16, '#8a5a00')).setOrigin(0.5);
    }
    this.menu = new Menu(this, {
      x: lay?.menu.x ?? 78,
      y: lay?.menu.y ?? 206,
      options: options.map((o) => o.option),
      // Fit every option inside the panel (186–486), however many settings there are.
      itemHeight: lay?.menu.itemHeight ?? rowH,
      ...(lay ? { columns: lay.menu.columns, itemWidth: lay.menu.itemWidth, color: lay.menu.color } : {}),
      fontSize: lay?.menu.fontSize ?? (rowH >= 40 ? 28 : rowH >= 34 ? 24 : 20),
      onSelect: (i) => options[i]!.action(),
    });
    // Classic look: a blinking PRESS START first; the menu appears on confirm or a click.
    if (lay?.press) {
      this.pressWait = true;
      this.menu.container.setVisible(false);
      const press = this.add.text(GAME_WIDTH / 2, 470, '— PRESS START —', textStyle(24, '#ffffff')).setOrigin(0.5);
      this.tweens.add({ targets: press, alpha: 0.2, duration: 650, yoyo: true, repeat: -1 });
      const start = () => {
        if (!this.pressWait) return;
        this.pressWait = false;
        press.destroy();
        this.menu.container.setVisible(true);
      };
      this.input.once('pointerdown', start);
      this.events.once('pressStart', start);
    }
    if (lay?.caption && lay.captionAt) this.add.text(lay.captionAt.x, lay.captionAt.y, lay.caption(session.profile.stats.runsEnded), textStyle(16, lay.captionAt.color));
    if (data?.focus) this.menu.focus(data.focus, false);
    onInputAction(this, (a) => {
      if (this.pressWait) {
        if (a === 'confirm') this.events.emit('pressStart');
        return;
      }
      this.menu.handle(a);
    });

    // Messages: damaged saves, storage problems, save failures.
    const notes: string[] = [...session.warnings];
    if (damaged) notes.push(`Your saved run could not be loaded: ${saved.reason} Choose "Discard damaged save" to keep a backup copy and start fresh.`);
    if (saved.status === 'unavailable') notes.push(saved.reason);
    if (session.lastSaveError) notes.push(`Last save failed: ${session.lastSaveError}`);
    if (notes.length > 0) {
      this.add
        .text(48, 482, notes.join('\n'), textStyle(16, COLORS.bad, { wordWrap: { width: 560 } }));
    }

    const s = session.profile.stats;
    this.add
      .text(GAME_WIDTH - 16, GAME_HEIGHT - 16, `Runs ${s.runsEnded}  ·  Battles won ${s.battlesWon}  ·  Bank Credits ${session.profile.bankCredits}  ·  Research ${session.profile.researchPoints}  ·  Candies ${session.profile.candies}`, textStyle(16, COLORS.textMuted))
      .setOrigin(1, 1);
    this.add.text(16, GAME_HEIGHT - 16, 'Arrows: move  ·  Enter: select  ·  Esc: back', textStyle(14, COLORS.textMuted)).setOrigin(0, 1);
  }

  private drawLookPanel(p: NonNullable<(typeof TITLE_LAYOUTS)[string]['panel']>): void {
    const g = this.add.graphics().setDepth(-10);
    g.fillStyle(0xffffff, 0.9).fillRoundedRect(p.x, p.y, p.w, p.h, 14);
    g.lineStyle(4, 0x2a5cb0, 1).strokeRoundedRect(p.x, p.y, p.w, p.h, 14);
  }

  /** Save Carousel look: the three slots as cards, the focused one raised; a click switches slot. */
  private drawCarousel(): void {
    const { session } = services();
    const cards = session.slotPeeks().map((p) => slotCard(session.content, p));
    const w = 280, h = 300, gap = 28;
    const x0 = (GAME_WIDTH - (w * 3 + gap * 2)) / 2;
    cards.forEach((card, i) => {
      const active = card.slot === session.slot;
      const x = x0 + i * (w + gap), y = active ? 96 : 120;
      const g = this.add.graphics().setDepth(-5);
      g.fillStyle(0x000000, 0.12).fillRoundedRect(x + 4, y + 8, w, h, 18);
      g.fillStyle(active ? 0xffffff : 0xf0f3f7, active ? 0.95 : 0.7).fillRoundedRect(x, y, w, h, 18);
      g.lineStyle(active ? 4 : 2, active ? 0xd8505a : 0xc9d3de, 1).strokeRoundedRect(x, y, w, h, 18);
      this.add.text(x + 16, y + 12, card.title, textStyle(22, '#33404c')).setDepth(-4);
      this.add.text(x + 16, y + 48, card.lines.join('\n') || 'Empty slot', textStyle(14, '#5a6672', { wordWrap: { width: w - 32 }, lineSpacing: 2 })).setDepth(-4);
      const ids = card.party.slice(0, 6);
      const species = ids.flatMap((id) => session.content.species.get(id) ?? []);
      void loadAssets(this, species.map((sp) => pokemonAssetIds(sp.assets).icon)).then(() => {
        if (!this.scene.isActive()) return;
        species.forEach((sp, k) => (pokemonIcon(this, sp, x + 40 + (k % 3) * 56, y + h - 76 + Math.floor(k / 3) * 44, 1.4) as Phaser.GameObjects.Image).setDepth(-3));
      });
      const hit = this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        if (!active) {
          session.switchSlot(card.slot as 1 | 2 | 3);
          this.scene.restart({});
        }
      });
    });
  }

  /** One glass tile per menu option (the Wii channel grid). */
  private drawTiles(lay: (typeof TITLE_LAYOUTS)[string], count: number): void {
    const g = this.add.graphics().setDepth(-10);
    for (let i = 0; i < count; i++) {
      const x = lay.menu.x + (i % lay.menu.columns) * lay.menu.itemWidth;
      const y = lay.menu.y - 52 + Math.floor(i / lay.menu.columns) * lay.menu.itemHeight;
      g.fillStyle(0x000000, 0.12).fillRoundedRect(x + 4, y + 6, lay.menu.itemWidth - 20, lay.menu.itemHeight - 16, 14);
      g.fillStyle(0xffffff, 1).fillRoundedRect(x, y, lay.menu.itemWidth - 20, lay.menu.itemHeight - 16, 14);
      g.lineStyle(2, 0xc9d3de, 1).strokeRoundedRect(x, y, lay.menu.itemWidth - 20, lay.menu.itemHeight - 16, 14);
    }
  }

  private continueRun(): void {
    const { session } = services();
    const latest = session.latestRunSlot();
    if (latest !== null && latest !== session.slot) session.switchSlot(latest);
    const run = session.continueRun();
    stopMusic();
    this.scene.start(sceneForRun(run));
  }

  /** Straight to choosing a trainer; a run in progress in this slot is only replaced after a yes. */
  private newRun(): void {
    const { session } = services();
    if (session.canContinue && !window.confirm(`Slot ${session.slot} has a run in progress. Starting a new run replaces it. Start anyway?`)) return;
    this.scene.start('TrainerSelect');
  }

  /** Story Run: the prologue (or its Short Intake) first, then trainer choice with the Story Run mode set. */
  private storyRun(): void {
    const { session } = services();
    if (session.canContinue && !window.confirm(`Slot ${session.slot} has a run in progress. Starting a new run replaces it. Start anyway?`)) return;
    this.scene.start('Prologue', { thenRun: true });
  }

  private discardDamaged(): void {
    services().session.discardDamagedRun();
    this.scene.restart({});
  }
}

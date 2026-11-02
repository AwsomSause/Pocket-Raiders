// Title screen: Continue, the Hub (start a run, Bank, trainers, achievements), sound toggle, and any save warnings.

import { dailyChest } from '../ui/overlays';
import { pokemonIcon } from '../ui/sprites';
import Phaser from 'phaser';
import { services } from '../game/services';
import { playMusic, stopMusic } from '../ui/audio';
import { onInputAction } from '../ui/input';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, PIXEL_SCALE, textStyle } from '../ui/theme';
import { drawPanel, Menu, type MenuOption } from '../ui/widgets';
import { ArenaBackdrop, drawLogo, ShowcaseMon } from '../ui/showcase';
import { loadAssets, queueAssets } from '../ui/lazyAssets';
import { continueCard } from '../ui/loadCard';
import { pokemonAssetIds } from '../assets/catalog';
import { sceneForRun } from './routing';
import { screenStyleOf } from '../core/presentation/screenStyles';
import { dressScreen } from '../ui/screenDress';
import { TITLE_LAYOUTS } from '../ui/titleLayouts';

export class MainMenuScene extends Phaser.Scene {
  private menu!: Menu;
  private pressWait = false;

  constructor() {
    super('MainMenu');
  }

  preload(): void {
    queueAssets(this, ['ui.load.card']);
  }

  create(data?: { focus?: number }): void {
    const { session } = services();
    session.closeRun();
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
    // With a saved run, the UIE Load card shows it (trainer, stage, party) where the random Pokémon would stand.
    // Continue picks the slot saved most recently (this one, unless another slot has a newer run).
    const latest = session.latestRunSlot();
    const latestPeek = latest ? session.slotPeeks().find((p) => p.slot === latest) : undefined;
    const card = latestPeek?.run.status === 'ok' ? continueCard(this, session.content, latestPeek.run.data, 470, 130) : null;
    const species = [...session.content.species.values()].filter((sp) => !sp.id.includes('-'));
    const mon = new ShowcaseMon(this, lay?.mon.x ?? 740, lay?.mon.y ?? 336, PIXEL_SCALE, lay?.mon.size ?? 230);
    const pick = () => {
      const sp = Phaser.Utils.Array.GetRandom(species);
      if (sp) void loadAssets(this, [pokemonAssetIds(sp.assets).front]).then(() => this.scene.isActive() && mon.show(sp));
    };
    if (!card) {
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
    dailyChest(this, lay ? 900 : 420, lay ? 440 : 460, new Date().toISOString().slice(0, 10));
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
    options.push({ option: { label: 'Save Slots' }, action: () => this.scene.start('SaveSlots') });
    options.push({ option: { label: 'Settings' }, action: () => this.scene.start('Settings', { from: 'MainMenu' }) });

    const rowH = Math.min(46, Math.floor(272 / options.length));
    if (lay?.tiles) this.drawTiles(lay, options.length);
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

  private discardDamaged(): void {
    services().session.discardDamagedRun();
    this.scene.restart({});
  }
}

// The one Settings screen. The title screen and the Hub both open it, so they always show the same
// settings from the same registry (core/settingsRegistry.ts). It is never reachable from inside a battle.

import { fitLine } from '../ui/fitText';
import Phaser from 'phaser';
import { DEFAULT_SETTINGS } from '../save/saveManager';
import { changeSetting, resetSettings, searchSettings, settingsIn, SETTINGS, SETTING_CATEGORIES, type SettingCategory, type SettingDef } from '../core/settingsRegistry';
import { services } from '../game/services';
import { refreshMusicVolume, stopMusic } from '../ui/audio';
import { downloadText, pickTextFile } from '../ui/files';
import { queueAssets } from '../ui/lazyAssets';
import { onInputAction } from '../ui/input';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, textStyle } from '../ui/theme';
import { listenForButton } from '../ui/gamepad';
import { PAD_ACTIONS, PAD_ACTION_LABEL, remapPad } from '../core/presentation/uiPrefs';
import { holdToConfirm } from '../ui/pointerFx';
import { framedScreenshot, runShareCard } from '../ui/shareCard';
import { UI_THEMES, themeIsLight, FONT_SCALE } from '../core/presentation/uiPrefs';
import { paintSkinBackdrop, skinFor } from '../ui/screenSkins';
import { drawSettingsTabs, hasSettingsLook, SETTINGS_LOOKS, type SettingsLook } from '../ui/settingsLooks';
import { pokemonVisual } from '../ui/sprites';
import { screenStyleOf } from '../core/presentation/screenStyles';
import { drawBackdrop, drawPanel, Menu, type MenuOption } from '../ui/widgets';
import { Picker } from '../ui/partyPanel';
import { gameSummary, type SummaryTopic } from '../core/encyclopedia';
import { mountRedux, reduxOn, type ReduxView } from '../ui/redux/stage';
import { menuView, settingsView } from '../ui/redux/templates';
import { confirmBox } from '../ui/redux/screens/saves';
import { openKeyVault } from '../ui/keyVault';
import { aiRuntime } from '../ai/runtime';
import { AI_DATA, usedUp } from '../core/ai/rules';
import { AI_TIERS, CLAUDE_USES, CLAUDE_USE_LABELS } from '../core/ai/schema';
import { claudeSettingsView, type ClaudeSettingsModel } from '../ui/redux/screens/dominion/claudeViews';

type Page = 'home' | 'search' | 'confirmReset' | 'summary' | 'claude' | SettingCategory;
interface Row {
  option: MenuOption;
  hint: string;
  action: () => void;
  /** New UI: the setting's name and value apart (the row draws `name ◀ value ▶`), and its id for stepping back. */
  name?: string;
  value?: string;
  id?: string;
}

/** New UI tab names, in SETTING_CATEGORIES order (the mock-ups' short forms). */

const APPLIES_TAG = { now: '', nextBattle: '  · next battle', restart: '  · restart needed' } as const;

/** Settings > Claude AI's left list (mockup a1): every category, with Claude AI before Save & Data. */
const CAT_ICONS: Record<SettingCategory, string> = { display: 'g-scope-lens', audio: 'g-tea', gameplay: 'g-choice-band', animations: 'g-star-piece', text: 'g-letter', accessibility: 'g-soothe-bell', controls: 'g-machine-part', story: 'g-journal', data: 'g-storage-key' };
const CLAUDE_CATS: { id: SettingCategory | 'claude'; label: string; icon: string }[] = [
  ...SETTING_CATEGORIES.filter((c) => c.id !== 'data').map((c) => ({ id: c.id, label: c.label, icon: CAT_ICONS[c.id] })),
  { id: 'claude', label: 'Rotom', icon: '' },
  ...SETTING_CATEGORIES.filter((c) => c.id === 'data').map((c) => ({ id: c.id, label: c.label, icon: CAT_ICONS[c.id] })),
];

/** Rows of the Data page that are not offered while a run is open. */
const IN_RUN_HIDDEN: ReadonlySet<string> = new Set(['Import save from a file', 'Replay the tutorial', 'Asset credits', 'Read the update log']);

export class SettingsScene extends Phaser.Scene {
  private page: Page = 'home';
  /** True until the current page's menu has been built once (its options slide in only then). */
  private entering = true;
  /** Where Back leads: the title, the Hub, or the stage map (the New UI's pause menu opens Settings in a run). */
  private from: 'MainMenu' | 'Hub' | 'Map' = 'MainMenu';
  private query = '';
  private notice = '';
  /** The redesigned look when one is picked (replaces the Options art). */
  private skinned: ReturnType<typeof skinFor> = null;
  /** The picked look's tabs, row pills and colours (null for the original). */
  private look: SettingsLook | null = null;
  private menu?: Menu;
  private picker: Picker | null = null;
  private topics: SummaryTopic[] | null = null;
  private ui?: Phaser.GameObjects.Container;
  private hintText?: Phaser.GameObjects.Text;
  private view: ReduxView | null = null;
  private shown: Row[] = [];
  /** Nine presses of 9 in a row so far (eight open the hidden Key-Card slot; Dominion slice D18). */
  private nines = 0;

  constructor() {
    super('Settings');
  }

  preload(): void {
    queueAssets(this, ['ui.optionsbg']);
  }

  create(data?: { from?: 'MainMenu' | 'Hub' | 'Map'; page?: Page; focus?: number }): void {
    this.from = data?.from ?? 'MainMenu';
    this.page = data?.page ?? 'home';
    this.entering = true;
    this.query = '';
    this.notice = '';
    this.nines = 0;
    this.skinned = skinFor('settings');
    const sid = screenStyleOf('settings', services().session.settings.screenStyles, services().session.profile.stats.runsEnded);
    this.look = sid !== 'original' && hasSettingsLook(sid) ? SETTINGS_LOOKS[sid]! : null;
    if (this.skinned) paintSkinBackdrop(this, this.skinned, services().session.settings.battleAnimations);
    else if (this.textures.exists('ui.optionsbg')) {
      this.add.image(0, 0, 'ui.optionsbg').setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setAlpha(0.94).setName('options-bg');
    } else drawBackdrop(this);
    this.view = reduxOn() ? mountRedux(this, {
      render: (c) => this.reduxHtml(c),
      acts: {
        pick: (i) => { this.menu?.focus(Number(i), false); this.menu?.confirm(); },
        tab: (k) => this.go(SETTING_CATEGORIES[Number(k)]?.id ?? 'claude'),
        // Settings > Claude AI (mockup a1): a category in the left list, a tier tile.
        cat: (k) => this.go(CLAUDE_CATS[Number(k)]?.id ?? 'claude'),
        tier: (k) => this.setTier(AI_TIERS[Number(k)] ?? 'standard'),
      },
      overs: { over: (i) => { if (!this.shown[Number(i)]?.option.disabled) this.menu?.focus(Number(i), false); } },
    }) : null;
    onInputAction(this, (a) => {
      if (this.picker) return this.picker.handle(a);
      if (this.page === 'search') return; // typing is handled by the key listener below
      if (a === 'back') this.back();
      // New UI: on a settings page, right steps a value forward and left steps it back (the row shows both arrows).
      else if (this.view && this.page === 'claude' && (a === 'left' || a === 'right')) this.change('claudeAi', a === 'left');
      else if (this.view && (a === 'left' || a === 'right') && this.shown[this.menu?.index ?? -1]?.id) this.change(this.shown[this.menu!.index]!.id!, a === 'left');
      else this.menu?.handle(a);
    });
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => this.typed(e));
    this.render(data?.focus ?? 0);
  }

  private back(): void {
    if (this.remapping) {
      this.stopListening?.();
      this.remapping = false;
      return this.render(this.menu?.index ?? 0);
    }
    if (this.page === 'home') this.scene.start(this.from);
    else if (this.page === 'confirmReset') this.go('home');
    else this.go('home');
  }

  private go(page: Page, focus = 0): void {
    this.entering = true;
    this.page = page;
    this.query = '';
    this.notice = '';
    this.render(focus);
  }

  /** Types into the search box while the search page is open. */
  private typed(e: KeyboardEvent): void {
    // The hidden Key-Card slot (Kice 2026-11-18): press 9 eight times on any Settings page.
    if (e.code === 'Digit9' || e.code === 'Numpad9') {
      if (++this.nines >= 8) {
        this.nines = 0;
        const st = services().session.settings;
        openKeyVault({ calm: !st.menuAnimations || st.disableAllAnimations, onClose: () => this.afterVault() });
        this.view?.refresh();
        return;
      }
      if (this.page === 'claude') this.view?.refresh();
    } else if (this.nines) {
      this.nines = 0;
      if (this.page === 'claude') this.view?.refresh();
    }
    if (this.page !== 'search') return;
    if (e.code === 'Escape') return this.go('home', 8);
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown') return this.menu?.handle(e.code === 'ArrowUp' ? 'up' : 'down');
    if (e.code === 'Enter' || e.code === 'NumpadEnter') return this.menu?.handle('confirm');
    if (e.code === 'Backspace') this.query = this.query.slice(0, -1);
    else if (e.key.length === 1 && this.query.length < 24) this.query += e.key;
    else return;
    this.render(0);
  }

  private rows(): Row[] {
    const { session } = services();
    const s = session.settings;
    const toggleRow = (d: SettingDef, withCategory = false): Row => {
      const cat = SETTING_CATEGORIES.find((c) => c.id === d.category)!.label;
      return {
        option: { label: `${d.label}: ${d.show(s)}${APPLIES_TAG[d.applies]}${d.advanced ? '  (advanced)' : ''}${withCategory ? `  [${cat}]` : ''}`, disabled: d.disabled?.(s) ?? false, tip: d.description },
        hint: d.description,
        action: () => this.change(d.id),
        name: d.label,
        value: `${d.show(s)}${APPLIES_TAG[d.applies]}`,
        id: d.id,
      };
    };
    const back: Row = { option: { label: 'Back' }, hint: '', action: () => this.back() };
    if (this.page === 'home') {
      return [
        ...SETTING_CATEGORIES.map((c): Row => ({ option: { label: c.label }, hint: c.blurb, action: () => this.go(c.id) })),
        { option: { label: 'Game Summary' }, hint: 'A readable summary of everything in the game: Pokémon, moves, items, trainers, events, modes and systems.', action: () => this.go('summary') },
        { option: { label: 'Search settings…' }, hint: 'Type to find a setting by name.', action: () => this.go('search') },
        { option: { label: 'Reset to defaults' }, hint: 'Puts every setting back to how it started. Your saves are not touched.', action: () => this.go('confirmReset') },
        { option: { label: 'Rotom' }, hint: 'Extra lines from Rotom with your own Key-Card, and how much it has used. The game is complete without it.', action: () => this.go('claude') },
        { option: { label: this.from === 'Hub' ? 'Back to the Hub' : this.from === 'Map' ? 'Back to the map' : 'Back to the title screen' }, hint: '', action: () => this.back() },
      ];
    }
    if (this.page === 'claude') {
      const byId = (id: string): SettingDef => SETTINGS.find((d) => d.id === id)!;
      const card = aiRuntime().keys.active();
      return [
        toggleRow(byId('claudeAi')),
        ...CLAUDE_USES.map((u) => toggleRow(byId(`claudeUse.${u}`))),
        { option: { label: card ? 'Change card (open the Key-Card vault)' : 'Add a card (open the Key-Card vault)' }, hint: 'Pick a Key-Card and paste the key you were sent. It stays in this browser, never in a save.', action: () => this.openVault() },
        { option: { label: 'Forget key', disabled: !card }, hint: 'Removes the key from this browser. Its spend count stays, so it can never pass $10.', action: () => { aiRuntime().keys.forget(); this.notice = 'Key forgotten. The game plays offline.'; this.render(8); } },
        back,
      ];
    }
    if (this.page === 'summary') {
      this.topics ??= gameSummary(session.content);
      return [...this.topics.map((t): Row => ({ option: { label: t.label }, hint: t.blurb, action: () => this.openTopic(t) })), back];
    }
    if (this.page === 'search') {
      const found = searchSettings(this.query).map((d) => toggleRow(d, true));
      return [...found, back];
    }
    if (this.page === 'confirmReset') {
      return [
        { option: { label: 'Yes, reset every setting' }, hint: 'Audio, display, animations and text all go back to their starting values.', action: () => holdToConfirm(this, services().session.settings, { title: 'Reset every setting?', onConfirm: () => this.reset() }) },
        { option: { label: 'No, keep my settings' }, hint: '', action: () => this.go('home') },
      ];
    }
    if (this.page === 'data') {
      return [
        { option: { label: 'Export save to a file' }, hint: 'Downloads your profile and settings as a .json file.', action: () => downloadText(`pkmn-save-${new Date().toISOString().slice(0, 10)}.json`, session.exportSave()) },
        { option: { label: 'Import save from a file' }, hint: 'Replaces your profile with one from a file. Your current profile is kept as a backup.', action: () => pickTextFile((t) => { this.notice = session.importSave(t); this.render(1); }) },
        { option: { label: 'Save a framed screenshot' }, hint: 'Saves the game screen as a PNG with a frame. Also F9 anywhere.', action: () => framedScreenshot(this.game) },
        { option: { label: 'Save a run share card' }, hint: 'Saves a PNG card with your current run’s trainer and team. Also F10.', action: () => { this.notice = runShareCard(session) ? 'Share card saved.' : 'Start a run first.'; this.render(this.menu?.index ?? 0); } },
        { option: { label: 'Replay the tutorial' }, hint: 'Nine professors explain the game, one area each. Skip any time.', action: () => this.scene.start('Tutorial', { returnTo: 'Settings', from: this.from }) },
        { option: { label: 'Asset credits' }, hint: 'Who made the art, music, packs and code in this game.', action: () => this.scene.start('Credits', { assets: true, from: this.from }) },
        { option: { label: 'Read the update log' }, hint: 'The patch notes for this version.', action: () => this.scene.start('Welcome', { phase: 'log', returnTo: 'Settings', from: this.from, replay: true }) },
        { option: { label: 'Reset settings to defaults' }, hint: 'Asks first. Run and profile data are not touched.', action: () => this.go('confirmReset') },
        back,
        // Opened from a run (the pause menu): nothing that swaps the profile or leaves for another screen.
      ].filter((r) => this.from !== 'Map' || !IN_RUN_HIDDEN.has(r.option.label));
    }
    const rows = settingsIn(this.page).map((d) => toggleRow(d));
    if (this.page === 'controls') rows.push({ option: { label: this.remapping ? `Press a button for: ${PAD_ACTION_LABEL[PAD_ACTIONS[this.remapStep]!]}…` : 'Remap by pressing buttons…' }, hint: 'Press the controller button you want for each action in turn (Up, Down, Left, Right, Confirm, Back). A button already in use swaps.', action: () => this.startRemap() });
    return [...rows, back];
  }

  /** A topic's entries in a scrolling list; the focused entry's full text shows below. */
  private openTopic(topic: SummaryTopic): void {
    const picker: Picker = new Picker(this, {
      screen: 'settings',
      glass: true,
      title: topic.label,
      columns: 1,
      rowHeight: 34,
      rows: topic.entries.map((e) => ({
        problem: null,
        hint: e.text,
        draw: (scene: Phaser.Scene, box: Phaser.GameObjects.Container, w: number) => {
          box.add(fitLine(scene.add.text(12, 4, `${e.name}  ·  ${e.short}`, textStyle(18, '#ffffff')), w - 24));
        },
      })),
      onSelect: () => undefined,
      onBack: () => {
        picker.close();
        this.picker = null;
        this.view?.visible(true);
      },
    });
    this.picker = picker;
    // The topic reader is still the earlier picture: show it while it is open.
    this.view?.visible(false);
  }

  private remapping = false;
  private remapStep = 0;
  private stopListening: (() => void) | null = null;

  /** Sets every gamepad action by pressing the wanted button on the controller, one action at a time. */
  private startRemap(): void {
    if (this.remapping) return;
    this.remapping = true;
    this.remapStep = 0;
    this.listenNext();
  }

  private listenNext(): void {
    this.render(this.menu?.index ?? 0);
    this.stopListening = listenForButton((n) => {
      const { session } = services();
      const action = PAD_ACTIONS[this.remapStep]!;
      session.saveSettings({ ...session.settings, gamepadMap: remapPad(session.settings.gamepadMap, action, n) });
      this.remapStep += 1;
      if (this.remapStep >= PAD_ACTIONS.length) {
        this.remapping = false;
        this.stopListening = null;
        this.notice = 'Gamepad buttons remapped.';
        this.render(this.menu?.index ?? 0);
      } else this.listenNext();
    });
    this.events.once('shutdown', () => this.stopListening?.());
  }

  private change(id: string, backwards = false): void {
    const { session } = services();
    const before = session.settings;
    let after = changeSetting(before, id);
    if (after === before) return;
    if (backwards) {
      // One step back = going forward round the whole cycle but one. Values repeat within a few dozen presses.
      const def = SETTINGS.find((d) => d.id === id);
      const seen = [after];
      for (let n = 0; def && n < 64 && def.show(seen[seen.length - 1]!) !== def.show(before); n++) seen.push(changeSetting(seen[seen.length - 1]!, id));
      after = seen[Math.max(0, seen.length - 2)]!;
    }
    session.saveSettings(after);
    this.sideEffects(before, after);
    // New / Old swaps the whole picture: open this page again in the chosen style, on the same row.
    if (before.uiStyle !== after.uiStyle) return void this.scene.restart({ from: this.from, page: this.page, focus: this.menu?.index ?? 0 });
    this.render(this.menu?.index ?? 0);
    this.previewAnim(id, after);
  }

  /** Setting sliders answer with a small demo (I486): shake, flash, speed or popup size, in the box at the right. */
  private previewAnim(id: string, s: typeof DEFAULT_SETTINGS): void {
    if (s.disableAllAnimations) return;
    const x = 770;
    const y = 360;
    const box = this.add.rectangle(x, y, 60, 60, COLORS.accent, 1).setDepth(50).setData('noJuice', true).setName('setting-preview');
    const done = (): void => void box.destroy();
    if (id === 'shakeIntensity') this.tweens.add({ targets: box, x: x + 14 * s.shakeIntensity, yoyo: true, repeat: 5, duration: 45, onComplete: done });
    else if (id === 'effectIntensity' || id === 'reducedFlash') this.tweens.add({ targets: box, alpha: { from: 0.1, to: 1 }, scale: 1 + (s.reducedFlash ? 0.2 : s.effectIntensity) * 0.5, yoyo: true, duration: 220, onComplete: done });
    else if (id === 'popupScale') this.tweens.add({ targets: box, scale: s.popupScale, yoyo: true, duration: 300, onComplete: done });
    else if (id === 'animationSpeed' || id === 'animationIntensity' || id === 'battleSpeed') this.tweens.add({ targets: box, x: x + 80 * ({ reduced: 0.5, normal: 1, enhanced: 1.4 }[s.animationIntensity]), duration: { slow: 900, normal: 600, fast: 360 }[s.animationSpeed], yoyo: true, ease: 'Back.easeOut', onComplete: done });
    else done();
  }

  private reset(): void {
    const { session } = services();
    const before = session.settings;
    const after = resetSettings(DEFAULT_SETTINGS, before);
    session.saveSettings(after);
    this.sideEffects(before, after);
    this.go('home', 0);
    this.notice = 'Settings reset to defaults.';
    this.render(0);
  }

  private sideEffects(before: typeof DEFAULT_SETTINGS, after: typeof DEFAULT_SETTINGS): void {
    if (before.musicVolume !== after.musicVolume) refreshMusicVolume();
    if (!before.muted && after.muted) stopMusic();
  }

  private render(focus: number): void {
    this.menu?.destroy();
    this.ui?.destroy(true);
    const ui = (this.ui = this.add.container(0, 0));
    const rows = this.rows();
    this.shown = rows;
    const cat = SETTING_CATEGORIES.find((c) => c.id === this.page)?.label;
    const title = this.page === 'claude' ? 'Settings · Rotom' : this.page === 'home' ? 'Settings' : this.page === 'summary' ? 'Game Summary' : this.page === 'search' ? 'Search settings' : this.page === 'confirmReset' ? 'Reset to defaults?' : `Settings · ${cat}`;
    // The UIE Options backdrop already has the word "Options" in its corner: the home page leaves the title to the art,
    // and sub-pages put theirs beside it, so the two never print over each other.
    const art = !this.skinned && this.textures.exists('ui.optionsbg');
    const heading = art ? (this.page === 'home' ? '' : title.replace(/^Settings · /, '')) : title;
    const isCategory = SETTING_CATEGORIES.some((c) => c.id === this.page);
    const look = this.look && isCategory ? this.look : null;
    const headInk = this.look?.ink && this.skinned?.light ? this.look.ink : COLORS.textLight;
    if (heading) ui.add(fitLine(this.add.text(art ? 150 : 48, 22, heading, textStyle(34, headInk)), 760 - (art ? 102 : 0)));
    if (this.look?.kanji && this.page === 'home') ui.add(this.add.text(48, 70, this.look.kanji, textStyle(64, this.look.ink)));
    if (this.page === 'search') ui.add(this.add.text(48, 70, `Find: ${this.query}▍`, textStyle(24, '#ffb745')));
    if (this.page === 'search' && this.query && rows.length === 1) ui.add(this.add.text(48, 110, 'No setting matches.', textStyle(20, COLORS.textMuted)));
    const top = this.page === 'search' ? 108 : 78;
    let area = { x: 60, y: top, w: 520 };
    if (look) {
      const cat = this.page as SettingCategory;
      area = drawSettingsTabs(this, ui, look, cat, (id) => this.go(id as Page));
      if (look.card) {
        const gc = this.add.graphics();
        gc.fillStyle(look.card.fill, 1).fillRoundedRect(36, 106, 570, 380, 14).lineStyle(2, look.card.rim, 1).strokeRoundedRect(36, 106, 570, 380, 14);
        ui.add(gc);
      }
    } else ui.add(drawPanel(this, 40, top - 8, 560, 400 - (top - 78), { alpha: 0.95 }));
    const cols = look?.columns && rows.length >= 6 ? look.columns : 1;
    if (cols > 1) area = { ...area, w: Math.floor(area.w / cols) };
    const rowH = Math.min(40, Math.floor((380 - (top - 78)) / Math.max(Math.ceil(rows.length / cols), 1)));
    const mascot = look?.mascot ? services().session.content.species.get(look.mascot) : undefined;
    if (mascot) {
      const v = pokemonVisual(this, mascot, 'front', 820, 440, 3, false);
      ui.add(v as unknown as Phaser.GameObjects.GameObject);
      if (services().session.settings.battleAnimations !== 'off') this.tweens.add({ targets: v, y: 428, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.hintText = this.add.text(48, 474, '', textStyle(18, this.look && this.skinned?.light ? this.look.ink : COLORS.textLight, { wordWrap: { width: 800 } }));
    ui.add(this.hintText);
    ui.add(this.add.text(GAME_WIDTH - 16, GAME_HEIGHT - 12, this.page === 'search' ? 'Type to search  ·  Up/Down  ·  Enter: change  ·  Esc: back' : 'Arrows: move  ·  Enter: change  ·  Esc: back', textStyle(14, COLORS.textMuted)).setOrigin(1, 1));
    if (this.notice) ui.add(this.add.text(48, 508, this.notice, textStyle(16, COLORS.good)));
    this.menu = new Menu(this, {
      x: area.x,
      y: look ? area.y + (look.tabs === 'top' ? 8 : 0) : top,
      options: rows.map((r) => r.option),
      ...(look ? { color: look.ink, glass: { motion: services().session.settings.battleAnimations, paint: rowH >= 30 ? look.painter : look.thin } } : this.look && this.skinned?.light ? { color: this.look.ink } : {}),
      itemWidth: area.w,
      itemHeight: rowH,
      ...(cols > 1 ? { columns: cols } : {}),
      fontSize: rowH >= 36 ? 24 : rowH >= 30 ? 20 : rowH >= 24 ? 18 : 17,
      onSelect: (i) => rows[i]!.action(),
      onFocus: (i) => this.hintText?.setText(rows[i]?.hint ?? ''),
      // Options slide in on a new page only, not each time a setting changes.
      animateIn: this.entering,
    });
    this.entering = false;
    if (this.page === 'display' || this.page === 'text' || this.page === 'accessibility') this.preview(ui);
    this.menu.focus(Math.min(focus, rows.length - 1), false);
    this.hintText.setText(rows[this.menu.index]?.hint ?? '');
    this.menu.onFocus = () => this.view?.refresh();
    this.view?.refresh();
  }

  /** New UI: the page as the mock-ups draw it. The home list is a menu; a category is the tabbed Settings screen. */
  private reduxHtml(c: Parameters<typeof menuView>[0]): string {
    const rows = this.shown, index = this.menu?.index ?? 0;
    const text = this.notice || rows[index]?.hint || 'Changes apply at once. Looks never change battle results.';
    const hints = [['Enter', 'choose'], ['Esc', 'back']] as const;
    if (this.page === 'claude') return claudeSettingsView(this.claudeModel(index));
    const cats = SETTING_CATEGORIES.map((x) => x.id);
    if (cats.includes(this.page as SettingCategory) || this.page === 'search') {
      const search = this.page === 'search';
      return settingsView(c, {
        title: search ? 'Search settings' : 'Settings',
        // The mock-up's tabs carry each category's whole name ("Animations & Effects", "Save & Data"), two lines where it is long.
        tabs: search ? [`Find: ${this.query}▌`] : [...SETTING_CATEGORIES.map((x) => x.label), 'Rotom'],
        tab: search ? 0 : cats.indexOf(this.page as SettingCategory),
        rows: rows.map((r) => ({ label: r.name ?? r.option.label, value: r.value ?? '', disabled: r.option.disabled })),
        index,
        text: search && this.query && rows.length === 1 ? 'No setting matches.' : text,
        hints: search ? [['Type', 'search'], ['Enter', 'change'], ['Esc', 'back']] : [['←→', 'change'], ['Enter', 'choose'], ['Esc', 'back']],
      });
    }
    const home = this.page === 'confirmReset' ? this.homeItems : rows.map((r) => ({ label: r.option.label, note: '', disabled: r.option.disabled, hint: r.hint }));
    if (this.page === 'home') this.homeItems = home;
    const at = this.page === 'confirmReset' ? 11 : index;
    const base = menuView(c, { title: this.page === 'summary' ? 'Game Summary' : 'Settings', hints, items: home, index: Math.min(at, home.length - 1), detail: { body: home[Math.min(at, home.length - 1)]?.hint ?? '' }, text: this.page === 'confirmReset' ? '' : text });
    if (this.page !== 'confirmReset') return base;
    return base + confirmBox({ title: 'Reset to defaults?', body: rows[index]?.hint || 'Audio, display, animations and text all go back to their starting values. Your saves are not touched.', options: rows.map((r) => r.option.label), index }).replaceAll('data-act="confirm"', 'data-act="pick"').replaceAll('data-over="confirmOver"', 'data-over="over"');
  }

  private homeItems: { label: string; note: string; disabled?: boolean; hint: string }[] = [];

  /** Mockup a1's numbers: the tier, the Key-Card in use and its spend, the "Use Claude for" switches. */
  private claudeModel(focus: number): ClaudeSettingsModel {
    const settings = services().session.settings;
    const s = settings.expansion;
    const keys = aiRuntime().keys;
    const now = keys.active();
    const face = now ? AI_DATA.keyCards.find((c) => c.id === now.card) : undefined;
    const spent = now ? keys.cardSpent(now.card) ?? 0 : 0;
    const run = AI_DATA.tiers[s.claudeAi].runUsd;
    const left = Math.max(0, AI_DATA.spendCapUsd - spent);
    const pill = (v: string): 'g' | 'k' | 'b' | 'y' => (v === 'On' ? 'g' : v === 'Off' ? 'k' : v === 'Rivals only' ? 'b' : 'y');
    return {
      cats: CLAUDE_CATS.map((c) => ({ label: c.label, icon: c.icon, ...(c.id === 'claude' ? { on: true } : {}) })),
      tiers: AI_TIERS.map((t) => ({ id: t, label: AI_DATA.tiers[t].label, blurb: AI_DATA.tiers[t].blurb, price: AI_DATA.tiers[t].runUsd ? `~$${AI_DATA.tiers[t].runUsd.toFixed(2)}` : '$0', note: AI_DATA.tiers[t].note, c: AI_DATA.tiers[t].c })),
      tier: s.claudeAi,
      focus,
      nines: this.nines,
      card: face ? { ...face, spent, usedUp: usedUp(spent), last: keys.last && Date.now() - keys.last.at < 60_000 ? keys.last.usd : null } : null,
      runsLeft: run ? `≈ ${Math.floor(left / run)} more ${AI_DATA.tiers[s.claudeAi].label} runs` : null,
      cap: AI_DATA.spendCapUsd,
      uses: CLAUDE_USES.map((u) => {
        const v = SETTINGS.find((d) => d.id === `claudeUse.${u}`)!.show(settings);
        return { label: CLAUDE_USE_LABELS[u], value: v === 'On' ? 'ON' : v === 'Off' ? 'OFF' : v, cls: pill(v) };
      }),
      notice: this.notice,
    };
  }

  private setTier(tier: (typeof AI_TIERS)[number]): void {
    const { session } = services();
    session.saveSettings({ ...session.settings, expansion: { ...session.settings.expansion, claudeAi: tier } });
    this.render(this.menu?.index ?? 0);
  }

  private openVault(): void {
    const st = services().session.settings;
    this.nines = 0;
    openKeyVault({ calm: !st.menuAnimations || st.disableAllAnimations, onClose: () => this.afterVault() });
  }

  private afterVault(): void {
    if (this.scene.isActive()) this.render(this.menu?.index ?? 0);
  }

  /** A live sample of the chosen theme, text size and popup size, drawn from the saved settings on the right. */
  private preview(ui: Phaser.GameObjects.Container): void {
    const { session } = services();
    const s = session.settings;
    const t = UI_THEMES[s.uiTheme];
    const light = themeIsLight(s.uiTheme);
    const ink = light ? '#2a2431' : '#f8f8f8';
    const x = 620;
    const y = 78;
    ui.add(this.add.rectangle(x, y, 300, 200, t.background).setOrigin(0).setStrokeStyle(2, t.borderMuted));
    ui.add(drawPanel(this, x + 14, y + 14, 272, 120, { fill: t.panel, border: t.border }));
    ui.add(this.add.text(x + 26, y + 24, t.label, textStyle(Math.round(20 * FONT_SCALE[s.fontSize]), ink, { wordWrap: { width: 250 } })).setName('preview-label'));
    ui.add(this.add.text(x + 26, y + 64, 'Sample text 123', textStyle(Math.round(16 * FONT_SCALE[s.fontSize]), ink)));
    ui.add(this.add.rectangle(x + 26, y + 100, 80, 20, t.accent).setOrigin(0));
    ui.add(this.add.circle(x + 270, y + 70, 16, t.rim, 0.8));
    ui.add(this.add.text(x + 150, y + 150, '-42', textStyle(24, light ? '#b03020' : '#ffe9a8')).setOrigin(0.5).setScale(s.popupScale).setStroke('#201020', 4));
    ui.add(this.add.text(x, y + 210, 'Preview of the theme, text size\nand damage popup size.', textStyle(16, COLORS.textMuted)));
  }
}

// DOMINION slice D27: the Boss Menu (v4 mockup m1, Esc from the HQ) and Settings (m2), kept beside DominionScene so the
// scene only forwards to it. The menu changes nothing in the run; Settings changes the settings record only (the run
// rules are read when a Dominion starts; Effects & motion is presentation). Q is never read here (D28's wheel).

import { bossMenuModel, BLADES, regionName } from '../../core/dominion/bossMenu';
import { fxOf, presetFx } from '../../core/dominion/fx';
import { SIX_OPEN } from '../../core/dominion/rules';
import { DominionPrefsSchema, type DominionFx, type DominionPrefs } from '../../core/dominion/schema';
import { dominionBlock } from '../../core/dominion/session';
import { DOMINION_DATA } from '../../core/dominion/data';
import { changeSetting, settingsIn, SETTINGS, type SettingDef } from '../../core/settingsRegistry';
import type { Settings } from '../../core/state';
import { AI_DATA } from '../../core/ai/rules';
import { aiRuntime } from '../../ai/runtime';
import { DEFAULT_SETTINGS } from '../../save/saveManager';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { openKeyVault } from '../../ui/keyVault';
import { refreshMusicVolume, stopMusic } from '../../ui/audio';
import { bossMenuView, settingsPageView, type SetRowView, type SettingsCat, type SettingsPageModel } from '../../ui/redux/screens/dominion/bossMenu';

interface Host {
  refresh(): void;
  /** Goes to one of the six tabs (0-5) from the HQ. */
  tabTo(i: number): void;
  /** Saves and quits to the title. */
  hide(): void;
  bossFile(): string | null;
  /** D28: the Boss's board (page map, mockup m5), the Controls tab's help page. */
  openBoard(): void;
}

export const SETTINGS_CATS: SettingsCat[] = [
  { id: 'dominion', label: 'Dominion', icon: 'g-relic-crown' },
  { id: 'fx', label: 'Effects & motion', icon: 'g-star-piece' },
  { id: 'display', label: 'Display', icon: 'g-scope-lens' },
  { id: 'audio', label: 'Audio', icon: 'g-tea' },
  { id: 'rotom', label: 'Rotom', icon: 'p-rotom' },
  { id: 'battle', label: 'Battle', icon: 'g-choice-band' },
  { id: 'runs', label: 'Runs', icon: 'g-town-map' },
  { id: 'access', label: 'Accessibility', icon: 'g-soothe-bell' },
  { id: 'saves', label: 'Saves', icon: 'g-storage-key' },
  // D28 (m5: the board "doubles as an in-game help page under Boss Menu, then Settings, then Controls").
  { id: 'controls', label: 'Controls', icon: 'g-xtransceiver' },
];

const BATTLE_IDS = ['battleSpeed', 'autoBattle', 'autoExplain', 'skillPrompts', 'damageDetails', 'battleAnimations', 'battleCamera', 'textSpeed', 'speechSpeed', 'dialogueFrequency'];
const RUN_SKIP = new Set(['autoBattle', 'autoExplain', 'battleSpeed', 'skillPrompts', 'damageDetails', 'claudeAi']);

/** The game's own settings shown under a category (one list: the same rows as the title's Settings). */
function registryRows(cat: string): SettingDef[] {
  if (cat === 'display') return settingsIn('display');
  if (cat === 'audio') return settingsIn('audio');
  if (cat === 'access') return settingsIn('accessibility');
  if (cat === 'battle') return BATTLE_IDS.map((id) => SETTINGS.find((d) => d.id === id)).filter((d): d is SettingDef => !!d);
  if (cat === 'runs') return settingsIn('gameplay').filter((d) => !RUN_SKIP.has(d.id));
  if (cat === 'rotom') return SETTINGS.filter((d) => d.id === 'claudeAi' || d.id.startsWith('claudeUse.'));
  if (cat === 'controls') return settingsIn('controls');
  return [];
}

/** One row of the page: how it looks and what ◀ ▶ / Enter / a click do. */
interface Row {
  view: SetRowView;
  /** ◀ (-1) or ▶ (+1). */
  change?: (dir: number) => void;
  /** A click on option `j` of a segmented row. */
  pick?: (j: number) => void;
  /** Enter on the row. */
  press?: () => void;
}

const RUN_OPTS = {
  pace: [['calm', 'Calm'], ['normal', 'Normal'], ['ruthless', 'Ruthless']],
  hero: [['low', 'Low'], ['normal', 'Normal'], ['high', 'High']],
  betrayals: [['off', 'Off'], ['rare', 'Rare'], ['normal', 'Normal']],
} as const;

export class BossMenuController {
  /** Open over the page Esc was pressed on (the scene's own screen is left as it was). */
  private mode: 'menu' | 'settings' | null = null;
  private at = 0;
  private notice: string | null = null;
  private cat = 0;
  private focus: 'cats' | 'rows' = 'cats';
  private row = 0;
  private setNotice: string | null = null;

  constructor(private readonly host: Host) {}

  owns(): boolean {
    return this.mode !== null;
  }
  get page(): 'menu' | 'settings' | null {
    return this.mode;
  }

  /** Esc at the top of a run page: the Boss Menu opens over it. */
  open(): void {
    this.mode = 'menu';
    this.at = 0;
    this.notice = null;
  }

  close(): void {
    this.mode = null;
  }

  openSettings(cat = 0): void {
    this.mode = 'settings';
    this.cat = cat;
    this.focus = 'rows';
    this.row = 0;
    this.setNotice = null;
  }

  // ---------- the Boss Menu ----------

  private cardLine(): string | null {
    try {
      const keys = aiRuntime().keys;
      const now = keys.active();
      const face = now ? AI_DATA.keyCards.find((c) => c.id === now.card) : undefined;
      if (!now || !face) return null;
      const spent = keys.cardSpent(now.card) ?? 0;
      return `Key-Card: ${face.name} · $${spent.toFixed(2)} of $${AI_DATA.spendCapUsd}`;
    } catch {
      return null;
    }
  }

  private pickBlade(i: number): void {
    const id = BLADES[i];
    if (!id) return;
    this.at = i;
    if (id === 'back') return this.close();
    if (id === 'hide') return this.host.hide();
    if (id === 'settings') return this.openSettings(0);
    if (id === 'rotom') return this.openSettings(SETTINGS_CATS.findIndex((c) => c.id === 'rotom'));
    if (id === 'ops') {
      this.notice = DOMINION_DATA.start.lockedTab;
      return;
    }
    const tab = { hq: 0, roster: 2, reserve: 3, ledger: 5 }[id];
    this.mode = null;
    this.host.tabTo(tab);
  }

  // ---------- Settings ----------

  private settings(): Settings {
    return services().session.settings;
  }
  private save(after: Settings): void {
    const before = this.settings();
    services().session.saveSettings(after);
    if (before.musicVolume !== after.musicVolume) refreshMusicVolume();
    if (!before.muted && after.muted) stopMusic();
  }
  private prefs(): DominionPrefs {
    return this.settings().expansion.dominionPrefs;
  }
  private setPrefs(p: DominionPrefs): void {
    const s = this.settings();
    this.save({ ...s, expansion: { ...s.expansion, dominionPrefs: p } });
  }
  private setFx(f: Partial<DominionFx>): void {
    const p = this.prefs();
    this.setPrefs({ ...p, fx: { ...p.fx, ...f } });
  }

  private seg<T extends string>(label: string, sub: string, opts: readonly (readonly [T, string])[], now: T, set: (v: T) => void, locked: (v: T) => boolean = () => false): Row {
    const ids = opts.map(([id]) => id);
    const open = ids.filter((v) => !locked(v));
    return {
      view: { label, sub, kind: 'seg', opts: opts.map(([id, l]) => ({ label: l, on: id === now, lock: locked(id) })) },
      change: (dir) => {
        const i = open.indexOf(now);
        const next = open[Math.max(0, Math.min(open.length - 1, i + dir))];
        if (next !== undefined && next !== now) set(next);
      },
      pick: (j) => { const v = ids[j]; if (v !== undefined && !locked(v)) set(v); },
    };
  }
  private toggle(label: string, sub: string | undefined, on: boolean, set: (v: boolean) => void): Row {
    return { view: { label, ...(sub ? { sub } : {}), kind: 'tg', on }, change: () => set(!on), press: () => set(!on) };
  }

  private runRows(): Row[] {
    const p = this.prefs();
    const setRun = (k: keyof DominionPrefs['run'], v: string): void => this.setPrefs({ ...p, run: { ...p.run, [k]: v } });
    return [
      this.seg('Run length', SIX_OPEN ? 'Regions to take before the end' : 'Only Kanto plays until the Crossing opens', [['three', 'Three'], ['six', 'Six']] as const, SIX_OPEN ? p.run.length : 'three', (v) => setRun('length', v), (v) => v === 'six' && !SIX_OPEN),
      this.seg('Day pace', 'How fast Heat and rivals push back', RUN_OPTS.pace, p.run.pace, (v) => setRun('pace', v)),
      this.seg('Hero pressure', 'How often the Hero comes for you', RUN_OPTS.hero, p.run.hero, (v) => setRun('hero', v)),
      this.seg('Betrayals', 'Holders may turn on you', RUN_OPTS.betrayals, p.run.betrayals, (v) => setRun('betrayals', v)),
      this.toggle('Show odds on the Card', 'The chance dial before every action', p.showOdds, (v) => this.setPrefs({ ...p, showOdds: v })),
      this.toggle('End the day when no actions are left', undefined, p.autoEndDay, (v) => this.setPrefs({ ...p, autoEndDay: v })),
      { view: { label: 'Charters 🔒', sub: 'Unlocks after you finish one run', kind: 'seg', opts: [{ label: 'Off', on: true }], lock: true }, press: () => { this.setNotice = 'Charters open once you finish one Dominion run.'; } },
    ];
  }

  private fxRows(): Row[] {
    const f = this.prefs().fx;
    const levels = ['full', 'lighter', 'calm'] as const;
    return [
      {
        view: { label: 'Show', kind: 'pill', value: f.level },
        change: (dir) => { const i = levels.indexOf(f.level); const n = levels[Math.max(0, Math.min(2, i + dir))]!; if (n !== f.level) this.setFx(presetFx(n)); },
      },
      this.toggle('Particles', 'coins, sparks, confetti', f.particles, (v) => this.setFx({ particles: v })),
      this.seg('Cut-ins', 'Boss orders and big results', [['show', 'Show'], ['skip', 'Skip']] as const, f.cutIns, (v) => this.setFx({ cutIns: v })),
      this.toggle('Screen shake', undefined, f.shake, (v) => this.setFx({ shake: v })),
      this.seg('Flashes', 'lightning, sirens', [['on', 'On'], ['soft', 'Soft'], ['off', 'Off']] as const, f.flashes, (v) => this.setFx({ flashes: v })),
    ];
  }

  private gameRow(d: SettingDef): Row {
    const s = this.settings();
    const lock = !!d.disabled?.(s);
    const step = (dir: number): void => {
      const before = this.settings();
      let after = changeSetting(before, d.id);
      if (after === before) return;
      if (dir < 0) {
        const seen = [after];
        for (let n = 0; n < 64 && d.show(seen[seen.length - 1]!) !== d.show(before); n++) seen.push(changeSetting(seen[seen.length - 1]!, d.id));
        after = seen[Math.max(0, seen.length - 2)]!;
      }
      this.save(after);
    };
    return { view: { label: d.label, sub: d.description, kind: 'val', value: d.show(s), lock }, change: step, press: () => step(1) };
  }

  private catRows(): Row[] {
    const id = SETTINGS_CATS[this.cat]!.id;
    if (id === 'dominion') return [...this.runRows(), ...this.fxRows()];
    if (id === 'fx') return this.fxRows();
    if (id === 'saves') {
      return [
        { view: { label: 'Save now', sub: 'The run also saves after every step', kind: 'btn', value: 'Enter' }, press: () => { this.setNotice = services().session.saveRunNow() ? 'Saved.' : 'The run could not be saved.'; } },
        { view: { label: 'Go into hiding', sub: 'Save and quit to the title (End)', kind: 'btn', value: 'End' }, press: () => this.host.hide() },
      ];
    }
    const rows = registryRows(id).map((d) => this.gameRow(d));
    if (id === 'controls') {
      // D28: the page map and how to open the command wheel, above the game's own control settings.
      rows.unshift(
        { view: { label: 'The Board', sub: 'How every page connects: a photo for each, Enter to go there', kind: 'btn', value: 'Open' }, press: () => this.host.openBoard() },
        { view: { label: 'Command wheel', sub: 'Hold Q, or hold Select on a controller; point, then let go to jump', kind: 'pill', value: 'Q · Select' } },
      );
    }
    if (id === 'rotom') {
      rows.push({ view: { label: 'Key-Card', sub: this.cardLine() ?? 'No card: every line is the game\'s own and nothing is sent anywhere.', kind: 'btn', value: 'Open the vault' }, press: () => { const st = this.settings(); openKeyVault({ calm: !st.menuAnimations || st.disableAllAnimations, onClose: () => this.host.refresh() }); } });
    }
    return rows;
  }

  /** D resets the open tab to the game's starting values. */
  private resetTab(): void {
    const id = SETTINGS_CATS[this.cat]!.id;
    const fresh = DominionPrefsSchema.parse({});
    if (id === 'dominion') this.setPrefs({ ...fresh, fx: this.prefs().fx });
    else if (id === 'fx') this.setFx(fresh.fx);
    else {
      let s = this.settings();
      for (const d of registryRows(id)) {
        for (let n = 0; n < 64 && d.show(s) !== d.show(DEFAULT_SETTINGS) && !d.disabled?.(s); n++) {
          const next = changeSetting(s, d.id);
          if (next === s) break;
          s = next;
        }
      }
      this.save(s);
    }
    this.setNotice = `${SETTINGS_CATS[this.cat]!.label} is back to its starting values.`;
  }

  private pageModel(): SettingsPageModel {
    const cat = SETTINGS_CATS[this.cat]!;
    const s = this.settings();
    const now = fxOf(s);
    const why: string[] = [];
    if (now.level !== s.expansion.dominionPrefs.fx.level) why.push(`The game's Motion settings hold this at ${now.level === 'calm' ? 'Calm' : 'Lighter'}.`);
    if (s.reducedFlash) why.push('Reduced flashing keeps flashes Soft at most.');
    if (s.reduceParticles) why.push('Reduce particles is on in the game.');
    if (s.shakeIntensity <= 0) why.push('Screen shake is at 0% in the game.');
    const fxRows = this.fxRows().map((r) => r.view);
    const rows = this.catRows().map((r) => r.view);
    const m: SettingsPageModel = {
      cats: SETTINGS_CATS,
      cat: this.cat,
      focus: this.focus,
      row: this.row,
      fx: { level: s.expansion.dominionPrefs.fx.level, rows: fxRows, linked: now.linked, why, now: `now: ${now.level === 'full' ? 'Full show' : now.level === 'lighter' ? 'Lighter' : 'Calm'}` },
      head: cat.label,
      headNote: cat.id === 'saves' ? 'this slot' : 'the whole game',
      notice: this.setNotice,
    };
    if (cat.id === 'dominion') m.run = rows.slice(0, 7);
    else if (cat.id !== 'fx') m.rows = rows;
    if (cat.id === 'saves') {
      const b = dominionBlock(services().session.run);
      m.side = [`Slot ${services().session.slot}`, b ? `${b.teamName ?? 'Unnamed Crew'} · ${regionName()} · Day ${b.day}` : '', 'The run saves after every step, so quitting never loses a day.', 'Export and import live on the title screen\'s Settings, under Save & Data.'].filter(Boolean);
    }
    if (cat.id === 'rotom') m.side = ['Rotom', 'Extra lines, smarter rivals, typed talks. The game is complete without it.', 'Without a Key-Card, or at Off, every line is the game\'s own and nothing is sent anywhere.'];
    return m;
  }

  // ---------- drawing and input ----------

  render(): string {
    const s = this.mode;
    if (s === 'settings') return settingsPageView(this.pageModel());
    const b = dominionBlock(services().session.run);
    if (!b) return '';
    return bossMenuView(bossMenuModel(b, this.at, { card: this.cardLine(), slot: services().session.slot, notice: this.notice }), this.host.bossFile());
  }

  private moveRow(d: number): void {
    const n = this.catRows().length;
    if (n) this.row = (this.row + d + n) % n;
  }
  private setCat(i: number): void {
    this.cat = (i + SETTINGS_CATS.length) % SETTINGS_CATS.length;
    this.row = 0;
    this.setNotice = null;
  }

  acts(): Record<string, (arg: string) => void> {
    const done = (): void => this.host.refresh();
    return {
      menuBlade: (i) => { this.pickBlade(Number(i)); done(); },
      setCat: (i) => { this.setCat(Number(i)); this.focus = 'rows'; done(); },
      setAt: (i) => { this.focus = 'rows'; this.row = Number(i); done(); },
      setRow: (i) => { this.focus = 'rows'; this.row = Number(i); const r = this.catRows()[this.row]; (r?.press ?? (() => r?.change?.(1)))(); done(); },
      setLeft: (i) => { this.row = Number(i); this.catRows()[this.row]?.change?.(-1); done(); },
      setRight: (i) => { this.row = Number(i); this.catRows()[this.row]?.change?.(1); done(); },
      setPick: (ij) => { const [i, j] = ij.split(':').map(Number); this.focus = 'rows'; this.row = i!; this.catRows()[i!]?.pick?.(j!); done(); },
      fxLevel: (lv) => { if (lv === 'full' || lv === 'lighter' || lv === 'calm') this.setFx(presetFx(lv)); done(); },
    };
  }
  overs(): Record<string, (arg: string) => void> {
    return { menuOver: (i) => { this.at = Number(i); this.host.refresh(); } };
  }

  /** Letter and number keys (before the input layer). True when handled. */
  raw(code: string): boolean {
    const s = this.mode;
    if (s === 'menu') {
      const blade: Record<string, number> = { Digit1: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5, KeyR: 6, KeyS: 7 };
      if (code in blade) { this.pickBlade(blade[code]!); this.host.refresh(); return true; }
      // The other tab keys and letters do nothing here (Q is the wheel's).
      return code.startsWith('Digit') || (code.startsWith('Key') && !['KeyW', 'KeyA', 'KeyD', 'KeyZ', 'KeyX'].includes(code));
    }
    if (s === 'settings') {
      if (code === 'KeyD') { this.resetTab(); this.host.refresh(); return true; }
      if (code === 'Tab') { this.setCat(this.cat + 1); this.host.refresh(); return true; }
      if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space') return false;
      return code.startsWith('Key') && !['KeyW', 'KeyA', 'KeyS', 'KeyZ', 'KeyX'].includes(code);
    }
    return false;
  }

  /** Arrows, Enter, Esc. True when handled. */
  key(a: InputAction): boolean {
    const s = this.mode;
    if (s === 'menu') {
      if (this.notice && (a === 'confirm' || a === 'back')) this.notice = null;
      else if (a === 'up' || a === 'down') this.at = (this.at + (a === 'up' ? -1 : 1) + BLADES.length) % BLADES.length;
      else if (a === 'confirm') this.pickBlade(this.at);
      else if (a === 'back') this.close();
      return true;
    }
    if (s !== 'settings') return false;
    this.setNotice = null;
    if (this.focus === 'cats') {
      if (a === 'up' || a === 'down') this.setCat(this.cat + (a === 'up' ? -1 : 1));
      else if (a === 'right' || a === 'confirm') { this.focus = 'rows'; this.row = 0; }
      else if (a === 'back') this.mode = 'menu';
      return true;
    }
    const row = this.catRows()[this.row];
    if (a === 'up' || a === 'down') this.moveRow(a === 'up' ? -1 : 1);
    else if (a === 'left' || a === 'right') row?.change?.(a === 'left' ? -1 : 1);
    else if (a === 'confirm') (row?.press ?? (() => row?.change?.(1)))();
    else if (a === 'back') this.focus = 'cats';
    return true;
  }
}

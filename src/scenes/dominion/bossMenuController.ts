// DOMINION slice D27: the Boss Menu (v4 mockup m1, Esc from the HQ) and Settings (m2), kept beside DominionScene so the
// scene only forwards to it. The menu changes nothing in the run; Settings changes the settings record only (the run
// rules are read when a Dominion starts; Effects & motion and the look are presentation). Q is never read here (D28's
// wheel). Redesign R9 (pass 50): Settings is a home of tiles, one page per category and the pages around them (Save and
// quit, Controls, Options, Calm mode, Colour assist, Read aloud, Button feel, Region skin, Ambience, the Key-Card vault).

import { bossMenuModel, BLADES, phoneMove } from '../../core/dominion/bossMenu';
import { fxOf, presetFx } from '../../core/dominion/fx';
import { SIX_OPEN } from '../../core/dominion/rules';
import { DominionPrefsSchema, type DominionFx, type DominionLook, type DominionPrefs } from '../../core/dominion/schema';
import { dominionBlock } from '../../core/dominion/session';
import { DOMINION_DATA } from '../../core/dominion/data';
import { changeSetting, settingsIn, SETTINGS, type SettingDef } from '../../core/settingsRegistry';
import type { Settings } from '../../core/state';
import { AI_DATA, usedUp } from '../../core/ai/rules';
import { aiRuntime } from '../../ai/runtime';
import { DEFAULT_SETTINGS } from '../../save/saveManager';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { openKeyVault } from '../../ui/keyVault';
import { refreshMusicVolume, stopMusic } from '../../ui/audio';
import { TUT, type TutMode } from '../../core/dominion/tutorial';
import { TutorialController } from './tutorialController';
import { r5BossMenu } from '../../ui/redux/screens/dominion/r50/hub';
import { r5Lessons, r5Motion, r5Style, r5Xray, XRAY } from '../../ui/redux/screens/dominion/r50/guide';
import type { R5Run } from '../../ui/redux/screens/dominion/r50/kit';
import { PREVIEW, r5Ambience, r5Calm, r5Colours, r5Controls, r5Feel, r5Options, r5ReadAloud, r5Save, r5SetHome, r5SetPage, r5Skins, r5Vault, CONTROLS, FRAMES, SAVE_ROWS, type R5Cat, type R5Ctl, type R5Row, type R5Tile } from '../../ui/redux/screens/dominion/r50/settings';
import { WHEEL_KEY } from '../../ui/redux/screens/dominion/views';
import { bossPic } from './r50Bridge';
import { isPhonePage, PHONE_APPS } from './rotomController';
import { voices } from './phone';

interface Host {
  refresh(): void;
  /** Goes to one of the six tabs (0-5) from the HQ. */
  tabTo(i: number): void;
  /** Saves and quits to the title. */
  hide(): void;
  bossFile(): string | null;
  /** D28: the Boss's board (page map, mockup m5), the Controls tab's help page. */
  openBoard(): void;
  /** Tutorial e9: plays a lesson's tips again over the page Esc was pressed on. */
  replay(lesson: string): void;
  /** Redesign R0: the pass-50 chrome's live data (party, funds, heat) for the phone page. */
  r5run(): R5Run | null;
  /** Redesign R9: the HQ hub's page (Read aloud draws over it), the member on duty and their line, the crew's faces and
   *  the Boss's name for Save and quit. */
  r9hub?(): string;
  r9says?(): { name: string; line: string; colour: string };
  r9crew?(): string[];
  r9boss?(): string;
  /** Read aloud: reads the text box on screen now (R on the Read aloud page). */
  r9read?(): void;
  /** Redesign R1: the chrome's data before a run has a Dominion block (the title). */
  r5pre(): R5Run;
  /** Redesign R1: the HQ hub's page, for Rotom's X-ray over it (null before the run opens). */
  hubHtml(): string | null;
  /** Redesign R9 follow-up: opens one of the Rotom Phone's own pages (radio, inbox, ...); Back returns to `back`. */
  phone?(id: string, back: string): void;
}

/** The Guide's own pages (redesign R1, pass 50): Rotom's X-ray, the Style sheet and the Motion sheet. */
type GuidePage = 'xray' | 'style' | 'motion';

/** A Settings category: its page id in the mockups and its rail icon. */
interface Cat extends R5Cat { pid: string }

export const SETTINGS_CATS: readonly Cat[] = [
  { id: 'dominion', name: 'Dominion', icon: 'g-dark-gem', pid: 'setdom' },
  { id: 'rotom', name: 'Rotom', icon: 'g-xtransceiver', pid: 'rotom' },
  { id: 'fx', name: 'Effects', icon: 'g-scope-lens', pid: 'seteff' },
  { id: 'audio', name: 'Sound', icon: 'g-mic', pid: 'setsnd' },
  { id: 'captions', name: 'Captions', icon: '', pid: 'captions' },
  { id: 'access', name: 'Access', icon: 'g-town-map', pid: 'access' },
  { id: 'screen', name: 'Screen', icon: '', pid: 'hud' },
  { id: 'display', name: 'Display', icon: '', pid: 'setdisplay' },
  { id: 'battle', name: 'Battle', icon: '', pid: 'setbattle' },
  { id: 'runs', name: 'Runs', icon: '', pid: 'setruns' },
  // D28 (m5: the board "doubles as an in-game help page under Boss Menu, then Settings, then Controls").
  { id: 'controls', name: 'Controls', icon: '', pid: 'setcontrols' },
];
const catAt = (id: string): number => SETTINGS_CATS.findIndex((c) => c.id === id);

/** The Settings home's eight tiles (mockup `set`, pass 20): where each goes. */
const TILES: readonly { id: string; name: string; icon: string; to: string }[] = [
  { id: 'dominion', name: 'Dominion', icon: 'g-dark-gem', to: 'setdom' },
  { id: 'rotom', name: 'Rotom', icon: 'g-xtransceiver', to: 'rotom' },
  { id: 'fx', name: 'Effects', icon: 'g-scope-lens', to: 'seteff' },
  { id: 'audio', name: 'Sound', icon: 'g-mic', to: 'setsnd' },
  { id: 'access', name: 'Access', icon: 'g-town-map', to: 'access' },
  { id: 'controls', name: 'Controls', icon: 'g-card-key', to: 'controls' },
  { id: 'save', name: 'Save data', icon: 'g-letter', to: 'save' },
  { id: 'lessons', name: 'Lessons', icon: 'g-journal', to: 'lessons' },
];

/** The pages around the categories, and where Esc goes from each. */
type Sub = 'home' | 'save' | 'controls' | 'options' | 'calm' | 'colours' | 'readaloud' | 'feel' | 'skins' | 'ambience' | 'vault';
const BACK: Record<Sub, string> = { home: 'menu', save: 'set', controls: 'set', options: 'close', calm: 'access', colours: 'access', readaloud: 'access', feel: 'hud', skins: 'hud', ambience: 'hud', vault: 'rotom' };

const BATTLE_IDS = ['battleSpeed', 'autoBattle', 'autoExplain', 'skillPrompts', 'damageDetails', 'battleAnimations', 'battleCamera', 'textSpeed', 'speechSpeed', 'dialogueFrequency'];
const RUN_SKIP = new Set(['autoBattle', 'autoExplain', 'battleSpeed', 'skillPrompts', 'damageDetails', 'claudeAi']);
/** Rows the redesigned categories draw themselves (so the game's list under them doesn't repeat them). */
const OWN = new Set(['fontSize', 'oneHanded', 'holdToConfirm', 'musicVolume', 'sfxVolume', 'muted', 'textSpeed', 'speechSpeed', 'soundPack', 'adaptiveMusic', 'haptics', 'battleAnimations']);

/** The game's own settings shown under a category (the same rows as the title's Settings). */
function registryRows(cat: string): SettingDef[] {
  if (cat === 'display') return settingsIn('display');
  if (cat === 'access') return settingsIn('accessibility').filter((d) => !OWN.has(d.id));
  if (cat === 'battle') return BATTLE_IDS.map((id) => SETTINGS.find((d) => d.id === id)).filter((d): d is SettingDef => !!d);
  if (cat === 'runs') return settingsIn('gameplay').filter((d) => !RUN_SKIP.has(d.id));
  if (cat === 'rotom') return SETTINGS.filter((d) => d.id === 'claudeAi' || d.id.startsWith('claudeUse.'));
  if (cat === 'controls') return settingsIn('controls');
  return [];
}
const def = (id: string): SettingDef | undefined => SETTINGS.find((d) => d.id === id);

/** A row's one-line help (the mockups keep it to a short line): the description's first sentence, or its first clause
 *  when that is still long. Never cut mid-word. */
export function brief(text: string): string {
  const first = (text.match(/^[^.!?]*[.!?]?/)?.[0] ?? text).trim().replace(/[.]$/, '');
  if (first.length <= 56) return first;
  const clause = first.split(/[:;(,–—]/)[0]!.trim();
  return clause.length <= 56 ? clause : first;
}

/** One row of a page: how it looks and what ◀ ▶ / Enter / a click do. */
interface Row {
  view: R5Row;
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
  private mode: 'menu' | 'settings' | 'replay' | Sub | GuidePage | null = null;
  /** Where Esc goes from the Lesson Book or Settings: the Boss Menu, or nothing (opened from the title). */
  private home: 'menu' | null = 'menu';
  /** Rotom's X-ray: which set of labels. */
  private xPart = 0;
  /** The Replay a lesson page's row (tutorial e9). */
  private rAt = 0;
  private at = 0;
  private notice: string | null = null;
  private cat = 0;
  private row = 0;
  /** The home's tile, Save's row, the Controls row and the vault's card. */
  private tile = 0;
  private setNotice: string | null = null;
  /** Options opened from the Start menu goes back to the page under it; from Settings, to the home. */
  private optBack = 'close';

  constructor(private readonly host: Host) {}

  owns(): boolean {
    return this.mode !== null;
  }
  /** What the board and the wheel call the page: the menu, Settings (every Settings page), a lesson replay or a Guide page. */
  get page(): 'menu' | 'settings' | 'replay' | GuidePage | null {
    const m = this.mode;
    return m === null || m === 'menu' || m === 'replay' || m === 'xray' || m === 'style' || m === 'motion' ? m : 'settings';
  }
  /** Redesign R9: the page shown, by the mockups' id (tests and the read-aloud page). */
  get r9(): string | null {
    const m = this.mode;
    if (m === 'settings') return SETTINGS_CATS[this.cat]!.pid;
    return m === 'menu' || m === 'replay' ? null : m;
  }

  /** Esc at the top of a run page: the Boss Menu opens over it. */
  open(): void {
    this.mode = 'menu';
    this.home = 'menu';
    this.at = 0;
    this.notice = null;
  }

  close(): void {
    this.mode = null;
  }

  /** The title's Settings and Tutorial rows: Esc goes back to the title. */
  openFromTitle(page: 'settings' | 'replay'): void {
    if (page === 'settings') this.openSettings(0);
    else { this.mode = 'replay'; this.rAt = 0; }
    this.home = null;
  }

  /** A Settings category (D27's entry point; the Rotom blade opens Rotom's). */
  openSettings(cat = 0): void {
    this.mode = 'settings';
    this.cat = cat;
    this.row = 0;
    this.setNotice = null;
  }

  /** Redesign R9: any Settings page by its mockup id (set, setdom, options, calm, vault, ...); 'close' shuts it all. */
  go(id: string): void {
    this.setNotice = null;
    this.row = 0;
    if (id === 'close') return this.close();
    if (id === 'menu') return this.open();
    if (id === 'set') { this.mode = 'home'; return; }
    if (id === 'lessons') { this.mode = 'replay'; this.rAt = 0; return; }
    if (isPhonePage(id) && this.host.phone) {
      const back = this.mode === 'settings' ? `set:${SETTINGS_CATS[this.cat]!.pid}` : this.mode && this.mode !== 'menu' ? `set:${this.mode}` : 'menu';
      this.mode = null;
      return this.host.phone(id, back);
    }
    // A page's mockup id first (so 'controls' is the key page, not the Controls category), then a category's own id.
    const byPid = SETTINGS_CATS.findIndex((x) => x.pid === id);
    if (byPid >= 0) return this.openSettings(byPid);
    if (['save', 'controls', 'options', 'calm', 'colours', 'readaloud', 'feel', 'skins', 'ambience', 'vault'].includes(id)) {
      if (id === 'options') this.optBack = this.mode === null ? 'close' : 'set';
      this.mode = id as Sub;
      this.tile = id === 'vault' ? Math.max(0, AI_DATA.keyCards.findIndex((k) => k.id === this.activeCard())) : 0;
      return;
    }
    const c = SETTINGS_CATS.findIndex((x) => x.id === id);
    if (c >= 0) this.openSettings(c);
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
    if (id === 'settings') return this.go('set');
    if (id === 'lessons') { this.mode = 'replay'; this.rAt = 0; return; }
    if (id === 'rotom') return this.openSettings(catAt('rotom'));
    if (id === 'ops') {
      this.notice = DOMINION_DATA.start.lockedTab;
      return;
    }
    const tab = { hq: 0, roster: 2, reserve: 3, ledger: 5 }[id];
    this.mode = null;
    this.host.tabTo(tab);
  }

  // ---------- Settings: the record ----------

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
  private look(): DominionLook {
    return this.prefs().look;
  }
  private setLook(l: Partial<DominionLook>): void {
    const p = this.prefs();
    this.setPrefs({ ...p, look: { ...p.look, ...l } });
  }

  // ---------- rows ----------

  private seg<T extends string>(label: string, sub: string, opts: readonly (readonly [T, string])[], now: T, set: (v: T) => void, locked: (v: T) => boolean = () => false, testid?: (v: T) => string): Row {
    const ids = opts.map(([id]) => id);
    const open = ids.filter((v) => !locked(v));
    return {
      view: { label, sub, ctl: { k: 'seg', opts: opts.map(([id, l]) => ({ label: l, on: id === now, lock: locked(id), ...(testid ? { testid: testid(id) } : {}) })) } },
      change: (dir) => {
        const i = open.indexOf(now);
        const next = open[Math.max(0, Math.min(open.length - 1, i + dir))];
        if (next !== undefined && next !== now) set(next);
      },
      pick: (j) => { const v = ids[j]; if (v !== undefined && !locked(v)) set(v); },
    };
  }
  private toggle(label: string, sub: string | undefined, on: boolean, set: (v: boolean) => void): Row {
    return { view: { label, ...(sub ? { sub } : {}), ctl: { k: 'sw', on } }, change: () => set(!on), press: () => set(!on), pick: () => set(!on) };
  }
  private link(label: string, sub: string, to: string, text = 'Open'): Row {
    return { view: { label, sub, ctl: { k: 'btn', text } }, press: () => this.go(to), change: (d) => { if (d > 0) this.go(to); } };
  }

  /** A row for one of the game's own settings. Up to four values are drawn as a segmented choice (found by pressing the
   *  setting round once), more as ‹ value ›; the volumes as a slider. */
  private gameRow(d: SettingDef, label = d.label, sub = brief(d.description)): Row {
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
    const cycle: string[] = [];
    for (let x = s, n = 0; n < 8; n++) {
      const v = d.show(x);
      if (cycle.includes(v)) break;
      cycle.push(v);
      const y = changeSetting(x, d.id);
      if (y === x) break;
      x = y;
    }
    const now = d.show(s);
    let ctl: R5Ctl = { k: 'val', text: now };
    if (d.id === 'musicVolume' || d.id === 'sfxVolume') ctl = { k: 'sld', v: s[d.id], text: String(Math.round(s[d.id] * 100)) };
    else if (cycle.length >= 2 && (cycle.length <= 4 || (cycle.length === 5 && cycle.join('').length <= 30)) && !lock) {
      // The cycle starts at the current value; draw it in the setting's own order (starting from its first value).
      let order = [...cycle].sort((a, b) => cycleOrder(d, a) - cycleOrder(d, b));
      // A three-plus choice with an Off reads Off first, then upward (Off · Light · Standard · Rich), as the mockups do.
      const off = order.indexOf('Off');
      if (order.length >= 3 && off > 0) order = [...order.slice(off), ...order.slice(0, off)];
      ctl = { k: 'seg', opts: order.map((l) => ({ label: l, on: l === now })) };
    }
    const pick = (j: number): void => {
      if (ctl.k !== 'seg') return;
      const want = ctl.opts[j]?.label;
      let x = this.settings();
      for (let n = 0; n < 8 && want !== undefined && d.show(x) !== want; n++) x = changeSetting(x, d.id);
      if (want !== undefined && d.show(x) === want) this.save(x);
    };
    return { view: { label, sub, ctl, lock }, change: lock ? undefined : step, press: lock ? undefined : () => step(1), pick: lock ? undefined : pick };
  }

  /** The Tutorial setting (tutorial mockups a2, e9): the default for new runs, and this run's help level. */
  private tutNow(): TutMode {
    return dominionBlock(services().session.run)?.tut?.mode ?? this.prefs().tutorial;
  }
  private setTut(v: TutMode): void {
    this.setPrefs({ ...this.prefs(), tutorial: v });
    if (dominionBlock(services().session.run)) services().session.dominionStep({ t: 'tut', op: 'mode', arg: v });
  }

  private runRows(): Row[] {
    const p = this.prefs();
    const setRun = (k: keyof DominionPrefs['run'], v: string): void => this.setPrefs({ ...p, run: { ...p.run, [k]: v } });
    return [
      this.seg('Tutorial', 'Rotom’s 15 lessons', TUT.replay.modes as unknown as readonly (readonly [TutMode, string])[], this.tutNow(), (v) => this.setTut(v)),
      this.seg('Run length', SIX_OPEN ? 'Regions to take before the end' : 'Only Kanto plays until the Crossing opens', [['three', 'Three'], ['six', 'Six']] as const, SIX_OPEN ? p.run.length : 'three', (v) => setRun('length', v), (v) => v === 'six' && !SIX_OPEN),
      this.seg('Day pace', 'How fast Heat and rivals push back · new runs', RUN_OPTS.pace, p.run.pace, (v) => setRun('pace', v)),
      this.seg('Hero pressure', 'How often the Hero comes for you · new runs', RUN_OPTS.hero, p.run.hero, (v) => setRun('hero', v)),
      this.seg('Betrayals', 'Holders may turn on you · new runs', RUN_OPTS.betrayals, p.run.betrayals, (v) => setRun('betrayals', v)),
      this.toggle('Heat warnings', 'A siren and beating edges at 70%', p.look.heatWarn, (v) => this.setLook({ heatWarn: v })),
      this.toggle('Show odds on the Card', 'The chance dial before every action', p.showOdds, (v) => this.setPrefs({ ...p, showOdds: v })),
      this.toggle('End the day by itself', 'When no actions are left', p.autoEndDay, (v) => this.setPrefs({ ...p, autoEndDay: v })),
      { view: { label: 'Charters 🔒', sub: 'Unlocks after you finish one run', ctl: { k: 'seg', opts: [{ label: 'Off', on: true }] }, lock: true }, press: () => { this.setNotice = 'Charters open once you finish one Dominion run.'; } },
      ...this.chairRows(),
    ];
  }

  /** D12's Chair settings (end-of-day-court.md §9), moved here from the Chair's O card (which still works). They belong
   *  to this run: each change is a saved clock step (`chairOpt`), so they come back with the run. */
  private chairRows(): Row[] {
    const b = dominionBlock(services().session.run);
    if (!b) return [];
    const o = b.chair?.opts ?? { length: 'normal', numbers: 'arrows', speed: 'normal' };
    const setTo = <K extends 'length' | 'numbers' | 'speed'>(key: K, want: string): void => {
      for (let n = 0; n < 4; n++) {
        const now = dominionBlock(services().session.run)?.chair?.opts[key] ?? null;
        if (now === want) return;
        if (!services().session.dominionStep({ t: 'chairOpt', key }).ok) return;
      }
    };
    return [
      this.seg('The Chair', 'This run: Off skips it; Short fewer visitors, Long more', [['off', 'Off'], ['short', 'Short'], ['normal', 'Normal'], ['long', 'Long']] as const, o.length, (v) => setTo('length', v)),
      this.seg('Chair numbers', 'This run: Arrows or Exact numbers', [['arrows', 'Arrows'], ['exact', 'Exact']] as const, o.numbers, (v) => setTo('numbers', v)),
      this.seg('Chair speed', 'This run: Fast drops the walk-in', [['normal', 'Normal'], ['fast', 'Fast']] as const, o.speed, (v) => setTo('speed', v)),
    ];
  }

  private levelRow(label: string, sub: string, names: readonly [string, string, string]): Row {
    const f = this.prefs().fx;
    return this.seg(label, sub, [['full', names[0]], ['lighter', names[1]], ['calm', names[2]]] as const, f.level, (v) => this.setFx(presetFx(v)), () => false, (v) => `dom-fx-${v}`);
  }

  private fxRows(): Row[] {
    const f = this.prefs().fx;
    return [
      this.levelRow('Show', 'One switch for all the spectacle', ['Full show', 'Lighter', 'Calm']),
      this.seg('Page change', 'How pages swap (Calm: none)', [['blade', 'Blade'], ['fade', 'Fade'], ['cut', 'Cut']] as const, this.look().wipe, (v) => this.setLook({ wipe: v })),
      this.toggle('Particles', 'Coins, sparks, confetti', f.particles, (v) => this.setFx({ particles: v })),
      this.seg('Cut-ins', 'Boss orders and big results', [['show', 'Show'], ['skip', 'Skip']] as const, f.cutIns, (v) => this.setFx({ cutIns: v })),
      this.toggle('Screen shake', 'Slams, stamps and VS', f.shake, (v) => this.setFx({ shake: v })),
      this.seg('Flashing', 'Sirens and lightning', [['on', 'On'], ['soft', 'Soft'], ['off', 'Off']] as const, f.flashes, (v) => this.setFx({ flashes: v })),
      ...(def('textSpeed') ? [this.gameRow(def('textSpeed')!, 'Text speed', 'Text always waits for a key')] : []),
    ];
  }

  private soundRows(): Row[] {
    const g = (id: string, label?: string, sub?: string): Row[] => (def(id) ? [this.gameRow(def(id)!, label, sub)] : []);
    return [
      ...g('musicVolume', 'Music', 'The Nova theme on the HQ'),
      ...g('sfxVolume', 'Effects', 'Stamps, coins, slams'),
      this.toggle('Sound', 'All music and effects', !this.settings().muted, () => this.save({ ...this.settings(), muted: !this.settings().muted })),
      this.toggle('Sirens', 'Police at Heat 70%', this.look().heatWarn, (v) => this.setLook({ heatWarn: v })),
      this.volRow(),
      this.toggle('Mute when away', 'Quiet while the tab is hidden', this.look().awayMute, (v) => this.setLook({ awayMute: v })),
      ...g('soundPack'),
      ...g('adaptiveMusic'),
    ];
  }

  private accessRows(): Row[] {
    const g = (id: string, label?: string, sub?: string): Row[] => (def(id) ? [this.gameRow(def(id)!, label, sub)] : []);
    return [
      ...g('fontSize', 'Text size', 'Every page grows with it'),
      this.seg('Colour help', 'Owners get shapes, not just colours', [['off', 'Off'], ['shapes', 'Shapes'], ['contrast', 'High contrast']] as const, this.look().colour, (v) => this.setLook({ colour: v })),
      this.levelRow('Motion', 'Less keeps the story, drops the shake', ['Full', 'Less', 'None']),
      ...g('oneHanded', 'One-handed play', 'On-screen buttons to one edge'),
      ...g('holdToConfirm', 'Hold to confirm', 'Risky choices need a held press'),
      this.link('Colour assist', 'Every colour has a shape', 'colours'),
      this.link('Read aloud', this.look().readAloud ? 'On · the text box is read to you' : 'Off', 'readaloud'),
      this.link('Calm mode', 'One switch for every effect', 'calm'),
      ...registryRows('access').map((d) => this.gameRow(d)),
    ];
  }

  private screenRows(): Row[] {
    const l = this.look();
    return [
      this.seg('Status', 'Funds, Heat and Day in one pill', [['capsule', 'Capsule'], ['chips', 'Full chips'], ['hidden', 'Hidden']] as const, l.status, (v) => this.setLook({ status: v })),
      this.seg('News ticker', 'Quiet shows it only when news breaks', [['on', 'On'], ['quiet', 'Quiet'], ['off', 'Off']] as const, l.ticker, (v) => this.setLook({ ticker: v })),
      this.seg('Key hints', 'The strip along the bottom', [['full', 'Full'], ['icons', 'Icons'], ['off', 'Off']] as const, l.keyHints, (v) => this.setLook({ keyHints: v })),
      ...(def('speechSpeed') ? [this.gameRow(def('speechSpeed')!, 'Talk speed', 'How fast the text box types')] : []),
      this.link('Options', 'The quick ones, and the window frame', 'options'),
      this.link('Region skin', l.skin === 'region' ? 'Follows the region' : `Always ${l.skin === 'johto' ? 'Johto' : 'Kanto'}`, 'skins'),
      this.link('Ambience', l.ambience === 'full' ? 'Moving layers behind pages' : 'Off', 'ambience'),
      this.link('Button feel', 'How every press answers back', 'feel'),
      this.toggle('Focus view', 'Hides the tabs, keys and ticker', l.focus, (v) => this.setLook({ focus: v })),
      this.link('On a phone', l.tall ? 'Pages stack on a tall screen' : 'Off: a tall screen keeps the wide layout', 'portrait'),
    ];
  }

  private rotomRows(): Row[] {
    const rows = registryRows('rotom').map((d) => d.id === 'claudeAi'
      ? this.gameRow(d, 'Rotom level', 'How much Rotom does with a Key-Card')
      : this.gameRow(d, d.label.replace(/^Rotom for /, '').replace(/^./, (c) => c.toUpperCase()), d.id === 'claudeUse.battle' ? 'Whose moves Rotom picks · needs a Key-Card' : 'Rotom writes these · needs a Key-Card'));
    rows.splice(1, 0, this.link('Key-Card', this.cardLine() ?? 'No card: every line is the game’s own', 'vault', 'Vault'));
    rows.push(this.seg('Crew banter', 'Rotom chats about the crew (T)', [['off', 'Off'], ['some', 'Some'], ['lots', 'Lots']] as const, this.look().chatter, (v) => this.setLook({ chatter: v })));
    rows.push(...PHONE_APPS.map(([label, about, to]) => this.link(label, about, to)));
    return rows;
  }

  private catRows(): Row[] {
    const id = SETTINGS_CATS[this.cat]!.id;
    if (id === 'dominion') return this.runRows();
    if (id === 'fx') return this.fxRows();
    if (id === 'audio') return this.soundRows();
    if (id === 'captions') return this.captionRows();
    if (id === 'access') return this.accessRows();
    if (id === 'screen') return this.screenRows();
    if (id === 'rotom') return this.rotomRows();
    const rows = registryRows(id).map((d) => this.gameRow(d));
    if (id === 'controls') {
      // D28: the page map and how to open the command wheel, above the game's own control settings.
      rows.unshift(
        { view: { label: 'The Board', sub: 'How every page connects: a photo for each, Enter to go there', ctl: { k: 'btn', text: 'Open' } }, press: () => this.host.openBoard() },
        { view: { label: 'Command wheel', sub: 'Hold Q, or hold Select on a controller; point, then let go', ctl: { k: 'seg', opts: [{ label: 'Q · Select', on: true }] } } },
        this.link('Every key', 'Keyboard, pad and touch side by side', 'controls'),
      );
    }
    return rows;
  }

  /** D resets the open tab to the game's starting values. */
  private resetTab(): void {
    const id = SETTINGS_CATS[this.cat]!.id;
    const fresh = DominionPrefsSchema.parse({});
    if (id === 'dominion') this.setPrefs({ ...fresh, fx: this.prefs().fx, look: { ...this.look(), heatWarn: fresh.look.heatWarn } });
    else if (id === 'fx') { this.setPrefs({ ...this.prefs(), fx: fresh.fx, look: { ...this.look(), wipe: fresh.look.wipe } }); }
    else if (id === 'screen') this.setLook({ status: fresh.look.status, ticker: fresh.look.ticker, keyHints: fresh.look.keyHints, focus: fresh.look.focus, tall: fresh.look.tall });
    else if (id === 'captions') this.setLook({ captions: fresh.look.captions, capSize: fresh.look.capSize, musicNames: fresh.look.musicNames });
    else if (id === 'rotom') this.setLook({ chatter: fresh.look.chatter });
    else {
      let s = this.settings();
      const ids = id === 'audio' ? ['musicVolume', 'sfxVolume', 'muted', 'soundPack', 'adaptiveMusic'] : id === 'access' ? ['fontSize', 'oneHanded', 'holdToConfirm'] : [];
      for (const d of [...registryRows(id), ...ids.map(def).filter((x): x is SettingDef => !!x)]) {
        for (let n = 0; n < 64 && d.show(s) !== d.show(DEFAULT_SETTINGS) && !d.disabled?.(s); n++) {
          const next = changeSetting(s, d.id);
          if (next === s) break;
          s = next;
        }
      }
      this.save(s);
      if (id === 'audio') this.setLook({ heatWarn: fresh.look.heatWarn, voiceVol: fresh.look.voiceVol, awayMute: fresh.look.awayMute });
      if (id === 'access') this.setLook({ colour: fresh.look.colour });
    }
    this.setNotice = `${SETTINGS_CATS[this.cat]!.name} is back to its starting values.`;
  }

  // ---------- the pages around the categories ----------

  private optionRows(): Row[] {
    const g = (id: string, label: string): Row[] => (def(id) ? [this.gameRow(def(id)!, label, '')] : []);
    const l = this.look();
    return [
      ...g('textSpeed', 'Text speed'),
      this.seg('Page opener', '', [['blade', 'Nova star'], ['fade', 'Fade'], ['cut', 'Cut']] as const, l.wipe, (v) => this.setLook({ wipe: v })),
      ...g('battleAnimations', 'Battle scene'),
      this.seg('Sound', '', [['on', 'On'], ['off', 'Off']] as const, this.settings().muted ? 'off' : 'on', (v) => this.save({ ...this.settings(), muted: v === 'off' })),
      ...g('oneHanded', 'Button mode'),
      this.seg('Frame', '', FRAMES.map(([id, n]) => [id, n] as const), l.frame, (v) => this.setLook({ frame: v as DominionLook['frame'] })),
    ];
  }
  private colourRows(): Row[] {
    return [
      this.seg('Colour assist', '', [['off', 'Off'], ['shapes', 'Shapes on'], ['contrast', 'High contrast']] as const, this.look().colour, (v) => this.setLook({ colour: v })),
      this.seg('Palette', '', [['standard', 'Standard'], ['rg', 'Red-green safe']] as const, this.look().palette, (v) => this.setLook({ palette: v })),
    ];
  }
  private readRows(): Row[] {
    const l = this.look();
    return [
      this.toggle('Read aloud', undefined, l.readAloud, (v) => { this.setLook({ readAloud: v }); if (v) this.host.r9read?.(); }),
      this.seg('Speed', '', [['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast']] as const, l.voiceRate, (v) => this.setLook({ voiceRate: v })),
      this.toggle('Highlight words', undefined, l.highlight, (v) => this.setLook({ highlight: v })),
      this.voiceRow(),
      this.volRow(),
    ];
  }
  private feelRows(): Row[] {
    const l = this.look();
    const g = (id: string, label: string): Row[] => (def(id) ? [this.gameRow(def(id)!, label, '')] : []);
    return [
      ...g('haptics', 'Rumble'),
      this.seg('Cursor', '', [['arrow', 'Arrow'], ['ball', 'Poké Ball'], ['badge', 'N badge']] as const, l.cursor, (v) => this.setLook({ cursor: v })),
      ...g('holdToConfirm', 'Hold to confirm'),
      this.toggle('Press bounce', undefined, l.press, (v) => this.setLook({ press: v })),
      this.toggle('Button sounds', undefined, l.clicks, (v) => this.setLook({ clicks: v })),
      this.toggle('Menus wrap round', undefined, l.wrap, (v) => this.setLook({ wrap: v })),
    ];
  }
  private skinRows(): Row[] {
    const l = this.look();
    return [
      this.toggle('Follow the region', undefined, l.skin === 'region', (v) => this.setLook({ skin: v ? 'region' : this.regionSkin() })),
      this.seg('Skin', '', [['kanto', 'Kanto'], ['johto', 'Johto']] as const, l.skin === 'region' ? this.regionSkin() : l.skin, (v) => this.setLook({ skin: v })),
      this.toggle('Skyline behind pages', undefined, l.skyline, (v) => this.setLook({ skyline: v })),
      this.toggle('Panel glints', undefined, l.glints, (v) => this.setLook({ glints: v })),
      this.seg('Locked skins', '', [['preview', 'Show'], ['hide', 'Hide']] as const, l.lockedSkins, (v) => this.setLook({ lockedSkins: v })),
    ];
  }
  /** Captions (mockup `captions`): sounds in words over the page, their size, the music's name. */
  private captionRows(): Row[] {
    const l = this.look();
    return [
      this.toggle('Captions', 'Every sound gets words', l.captions, (v) => this.setLook({ captions: v })),
      this.seg('Caption size', 'Grows with Text size too', [['s', 'S'], ['m', 'M'], ['l', 'L']] as const, l.capSize, (v) => this.setLook({ capSize: v })),
      this.toggle('Music names', 'Now playing card', l.musicNames, (v) => this.setLook({ musicNames: v })),
    ];
  }
  /** Read aloud's voice: the browser's voices by name ('' is the browser's own pick). */
  private voiceRow(): Row {
    const names = ['', ...voices()];
    const now = Math.max(0, names.indexOf(this.look().voice));
    return { view: { label: 'Voice', ctl: { k: 'val', text: names[now] || 'Default' } }, change: (d) => { if (names.length > 1) this.setLook({ voice: names[(now + d + names.length) % names.length]! }); } };
  }
  /** Voices volume (Read aloud), in tenths. */
  private volRow(): Row {
    const v = this.look().voiceVol;
    return { view: { label: 'Voices volume', sub: 'Read aloud', ctl: { k: 'sld', v, text: `${Math.round(v * 100)}%` } }, change: (d) => this.setLook({ voiceVol: Math.round(Math.max(0, Math.min(1, v + d * 0.1)) * 10) / 10 }) };
  }
  private ambienceRows(): Row[] {
    const l = this.look();
    return [
      this.seg('Ambience', '', [['full', 'Full'], ['off', 'Off']] as const, l.ambience, (v) => this.setLook({ ambience: v })),
      this.toggle('Lightning flashes', undefined, l.lightning, (v) => this.setLook({ lightning: v })),
    ];
  }
  private regionSkin(): 'kanto' | 'johto' {
    return dominionBlock(services().session.run)?.realm?.at === 'johto' ? 'johto' : 'kanto';
  }

  /** The rows of the page shown (a category, or one of the pages around them). */
  private rows(): Row[] {
    switch (this.mode) {
      case 'settings': return this.catRows();
      case 'options': return this.optionRows();
      case 'colours': return this.colourRows();
      case 'readaloud': return this.readRows();
      case 'feel': return this.feelRows();
      case 'skins': return this.skinRows();
      case 'ambience': return this.ambienceRows();
      default: return [];
    }
  }

  private calmOn(): boolean {
    return this.prefs().fx.level === 'calm';
  }
  private flipCalm(): void {
    this.setFx(presetFx(this.calmOn() ? 'full' : 'calm'));
  }

  private activeCard(): string | null {
    try { return aiRuntime().keys.active()?.card ?? null; } catch { return null; }
  }

  private saveRow(i: number): void {
    if (i === 0) return this.host.hide();
    if (i === 1) {
      const ok = services().session.saveRunNow();
      this.setNotice = ok ? 'Saved.' : 'The run could not be saved.';
      if (ok) this.close();
      return;
    }
    this.open();
  }

  private openVault(i: number): void {
    const st = this.settings();
    const card = AI_DATA.keyCards[i]?.id;
    openKeyVault({ calm: !st.menuAnimations || st.disableAllAnimations || this.calmOn(), card, onClose: () => this.host.refresh() });
  }

  // ---------- drawing ----------

  private tiles(): R5Tile[] {
    const s = this.settings();
    const p = this.prefs();
    const lvl = { full: 'Full show', lighter: 'Lighter', calm: 'Calm' }[p.fx.level];
    const wipe = { blade: 'blade', fade: 'fade', cut: 'cut' }[p.look.wipe];
    const tut = TUT.replay.modes.find(([id]) => id === this.tutNow())?.[1] ?? '';
    const about: Record<string, string> = {
      dominion: `Tutorial ${tut.toLowerCase()} · ${p.run.pace} pace`,
      rotom: `${def('claudeAi')?.show(s) ?? ''} · ${this.cardLine() ? 'Key-Card set' : 'no Key-Card'}`,
      fx: `${lvl} · ${wipe} wipe`,
      audio: s.muted ? 'Sound off' : `Music ${Math.round(s.musicVolume * 100)} · Sirens ${p.look.heatWarn ? 'on' : 'off'}`,
      access: `Text ${def('fontSize')?.show(s) ?? ''} · Shapes ${p.look.colour === 'shapes' ? 'on' : 'off'}`,
      controls: 'Keys, pad and touch',
      save: `Slot ${services().session.slot} · saves every step`,
      lessons: 'Replay a lesson',
    };
    return TILES.map((t) => ({ id: t.id, name: t.name, icon: t.icon, about: about[t.id] ?? '' }));
  }

  private preview(): string {
    const id = SETTINGS_CATS[this.cat]!.id;
    const s = this.settings();
    const p = this.prefs();
    const run = this.host.r5run();
    const says = this.host.r9says?.() ?? { name: 'Rotom', line: 'Bzzt! All quiet for now.', colour: '#ff8a1c' };
    if (id === 'dominion') {
      const b = dominionBlock(services().session.run);
      const r = b?.rules;
      const rules: [string, string][] = r ? [['Day pace', r.pace], ['Hero', r.hero], ['Betrayals', r.betrayals], ['Tutorial', this.tutNow()]] : [['Day pace', p.run.pace], ['Hero', p.run.hero]];
      return PREVIEW.dom(rules.map(([a, v]) => [a, v[0]!.toUpperCase() + v.slice(1)] as [string, string]), p.look.heatWarn);
    }
    if (id === 'rotom') return PREVIEW.rotom('Bzzt! I keep count of every take, Boss.', `${def('claudeAi')?.show(s) ?? 'Off'}: ${this.cardLine() ? 'crew talk back and the judge reads your words.' : 'without a Key-Card every line is the game’s own.'}`);
    if (id === 'fx') {
      const now = fxOf(s).level;
      return PREVIEW.eff(now === 'calm' ? 'Calm: pages change with no wipe and nothing moves.' : p.look.wipe === 'cut' ? 'Cut: pages change at once.' : p.look.wipe === 'fade' || now === 'lighter' ? 'Fade: a quick fade between pages.' : 'Blade wipe at Full show. Calm swaps it for no wipe.')
        + `<p data-testid="dom-fx-linked">${fxOf(s).linked ? 'The game’s own Motion settings hold some effects down.' : 'Follows the game’s Motion setting.'}</p>`;
    }
    if (id === 'audio') return PREVIEW.snd('Nova theme (HQ)', !s.muted);
    if (id === 'captions') return PREVIEW.cap(p.look.captions, p.look.capSize, p.look.musicNames);
    if (id === 'access') return PREVIEW.acc(says.name, says.line, p.look.colour === 'shapes');
    if (id === 'screen' && run) return PREVIEW.hud(run, p.look.status, says.name, says.line);
    if (id === 'controls') return PREVIEW.game(['Controls', 'The game’s own control settings, the Board and the wheel.', 'Every key, side by side: Settings › Controls.']);
    return PREVIEW.game([SETTINGS_CATS[this.cat]!.name, 'The same settings as the main game’s Settings.', 'Changes save at once. D resets this tab.']);
  }

  render(): string {
    const s = this.mode;
    const b = dominionBlock(services().session.run);
    const pre = (): R5Run => this.host.r5run() ?? this.host.r5pre();
    // Redesign R1 (pass 50): the Lesson Book and the Guide's pages.
    if (s === 'replay') {
      const done = TutorialController.doneRows(b ?? null);
      return r5Lessons({ lessons: TUT.lessons.map((l, i) => ({ id: l.id, name: l.name, seen: !!done[i] })), at: this.rAt, mode: this.tutNow(), modes: TUT.replay.modes, xray: !!b?.opened }, pre());
    }
    if (s === 'xray') { const hub = this.host.hubHtml(); return hub ? r5Xray(hub, this.xPart, pre()) : ''; }
    if (s === 'style') return r5Style(pre());
    if (s === 'motion') return r5Motion(pre());
    if (!b) return '';
    const run = this.host.r5run();
    if (!run) return '';
    if (s === 'menu') {
      const m = bossMenuModel(b, this.at, { card: this.cardLine(), slot: services().session.slot, notice: this.notice });
      // Redesign R0 (pass 50, mockup `menu`): the Boss Menu is Rotom's phone.
      return r5BossMenu(m, bossPic(this.host.bossFile(), 300), run, WHEEL_KEY);
    }
    const rows = this.rows().map((r) => r.view);
    const at = Math.min(this.row, Math.max(0, rows.length - 1));
    const says = this.host.r9says?.() ?? { name: 'Rotom', line: 'Bzzt!', colour: '#ff8a1c' };
    switch (s) {
      case 'settings': return r5SetPage({ cats: SETTINGS_CATS, cat: this.cat, rows, row: at, preview: this.preview(), pid: SETTINGS_CATS[this.cat]!.pid, notice: this.setNotice }, run);
      case 'home': return r5SetHome(this.tiles(), this.tile, run);
      case 'save': {
        const name = this.host.r9boss?.() ?? 'Boss';
        return r5Save({ boss: bossPic(this.host.bossFile(), 120), team: b.teamName ?? 'Unnamed Crew', lines: [`${name} · ${(b.realm?.at ?? 'kanto')[0]!.toUpperCase()}${(b.realm?.at ?? 'kanto').slice(1)} · Day ${b.day} ${DOMINION_DATA.start.clock.phases.find((x) => x.id === b.phase)?.word.toLowerCase() ?? ''}`, `${run.funds} · Heat ${b.heat}% · Goal ${run.goalPct}%`, 'Saved after every step'], crew: (this.host.r9crew?.() ?? []).slice(0, 6), slot: services().session.slot, at: this.tile, notice: this.setNotice }, run);
      }
      case 'controls': return r5Controls(this.tile, run);
      case 'options': return r5Options(rows, at, this.look().frame, says, run);
      case 'calm': {
        const on = this.calmOn();
        const c: [string, string][] = on
          ? [['Page wipes', 'None'], ['Moving layers', 'Still'], ['Cut-ins', 'Skipped'], ['Screen shake', 'Off'], ['Flashes', 'Off'], ['Particles', 'Off'], ['What happens', 'The same']]
          : [['Page wipes', 'Blade'], ['Moving layers', 'Moving'], ['Cut-ins', 'Shown'], ['Screen shake', 'On'], ['Flashes', 'On'], ['Particles', 'On'], ['What happens', 'The same']];
        return r5Calm(on, c, run);
      }
      case 'colours': {
        const m = b.members[0];
        const samples: [string, string, string][] = [[m?.name ?? 'Crew', 'c-ok', 'held'], ['Heat', 'c-bad', `${b.heat}%`], ['Funds', 'c-warn', run.funds], ['Hero', 'c-info', run.hero ? run.hero.where : 'not yet']];
        return r5Colours(rows, at, samples, this.look().colour === 'shapes', run);
      }
      case 'readaloud': return r5ReadAloud(rows, at, this.host.r9hub?.() ?? '', says, run);
      case 'feel': return r5Feel(rows, at, this.look().cursor, run);
      case 'skins': {
        const l = this.look();
        const on = l.skin === 'region' ? this.regionSkin() : l.skin;
        return r5Skins([
          { id: 'kanto', name: 'Kanto', icon: 'g-relic-crown', about: 'Red and cream · Poké Ball red', sky: 'Silph Co. skyline', open: true, on: on === 'kanto' },
          { id: 'johto', name: 'Johto', icon: 'g-red-orb', about: 'Gold and silver · lantern gold', sky: 'Bell Tower skyline', open: true, on: on === 'johto' },
          { id: 'hoenn', name: 'Hoenn', icon: 'g-blue-orb', about: 'Sea blue and emerald', sky: '', open: false, on: false },
          { id: 'sinnoh', name: 'Sinnoh', icon: 'g-adamant-orb', about: 'Pearl pink and diamond blue', sky: '', open: false, on: false },
        ], rows, at, run);
      }
      case 'ambience': return r5Ambience(rows, at, this.look().ambience === 'full', run);
      case 'vault': {
        let keys: ReturnType<typeof aiRuntime>['keys'] | null = null;
        try { keys = aiRuntime().keys; } catch { keys = null; }
        const now = this.activeCard();
        const orbName = (o: string): string => o.split('-').map((w) => w[0]!.toUpperCase() + w.slice(1)).join(' ');
        return r5Vault(AI_DATA.keyCards.map((c) => {
          const spent = keys?.cardSpent(c.id) ?? null;
          const done = spent !== null && usedUp(spent);
          return { id: c.id, name: c.name, orb: c.orb, legend: c.legend, inUse: now === c.id, usedUp: done, state: done ? `${orbName(c.orb)} · used up` : now === c.id ? `${orbName(c.orb)} · in use` : spent === null ? `${orbName(c.orb)} · empty` : `${orbName(c.orb)} · $${spent.toFixed(2)} of $${AI_DATA.spendCapUsd}` };
        }), this.tile, run);
      }
    }
    return '';
  }

  // ---------- input ----------

  private moveRow(d: number): void {
    const n = this.rows().length;
    if (n) this.row = this.look().wrap ? (this.row + d + n) % n : Math.max(0, Math.min(n - 1, this.row + d));
  }
  private setCat(i: number): void {
    this.cat = (i + SETTINGS_CATS.length) % SETTINGS_CATS.length;
    this.row = 0;
    this.setNotice = null;
  }
  private back(): void {
    const s = this.mode;
    if (s === 'settings') return this.go('set');
    if (s === 'options') return this.go(this.optBack);
    if (s === 'xray' || s === 'style' || s === 'motion') return this.guideBack();
    if (s && s !== 'menu' && s !== 'replay') return this.go(BACK[s]);
  }

  acts(): Record<string, (arg: string) => void> {
    const done = (): void => this.host.refresh();
    const r = (i: string): Row | undefined => this.rows()[Number(i)];
    return {
      menuBlade: (i) => { this.pickBlade(Number(i)); done(); },
      setCat: (i) => { this.setCat(Number(i)); done(); },
      setAt: (i) => { this.row = Number(i); done(); },
      setRow: (i) => { this.row = Number(i); const x = r(i); (x?.press ?? (() => x?.change?.(1)))(); done(); },
      setLeft: (i) => { this.row = Number(i); r(i)?.change?.(-1); done(); },
      setRight: (i) => { this.row = Number(i); r(i)?.change?.(1); done(); },
      setPick: (ij) => { const [i, j] = ij.split(':').map(Number); this.row = i!; this.rows()[i!]?.pick?.(j!); done(); },
      setNoticeOff: () => { this.setNotice = null; done(); },
      setTile: (i) => { this.tile = Number(i); this.go(TILES[this.tile]!.to); done(); },
      r9go: (id) => { this.go(id); done(); },
      saveRow: (i) => { this.tile = Number(i); this.saveRow(this.tile); done(); },
      calmFlip: () => { this.flipCalm(); done(); },
      feelCursor: (id) => { if (id === 'arrow' || id === 'ball' || id === 'badge') this.setLook({ cursor: id }); done(); },
      skinPick: (id) => { if (id === 'kanto' || id === 'johto') this.setLook({ skin: id }); done(); },
      vaultCard: (i) => { if (this.tile === Number(i)) this.openVault(this.tile); else this.tile = Number(i); done(); },
      readAgain: () => { this.host.r9read?.(); },
      guideBack: () => { this.guideBack(); done(); },
      guideXray: () => { if (this.mode === 'xray') this.xPart = (this.xPart + 1) % XRAY.length; else this.guide('xray'); done(); },
      guideStyle: () => { this.guide('style'); done(); },
      guideMotion: () => { this.guide('motion'); done(); },
      tutReplay: (i) => { if (this.rAt === Number(i)) this.playLesson(); else this.rAt = Number(i); done(); },
      tutMode: (id) => { if (id === 'full' || id === 'tips' || id === 'off') this.setTut(id); done(); },
      fxLevel: (lv) => { if (lv === 'full' || lv === 'lighter' || lv === 'calm') this.setFx(presetFx(lv)); done(); },
    };
  }
  overs(): Record<string, (arg: string) => void> {
    const at = (f: (i: number) => void) => (i: string) => { f(Number(i)); this.host.refresh(); };
    return {
      menuOver: at((i) => { this.at = i; }),
      tutReplayOver: at((i) => { this.rAt = i; }),
      setTileOver: at((i) => { this.tile = i; }),
      saveOver: at((i) => { this.tile = i; }),
      vaultOver: at((i) => { this.tile = i; }),
    };
  }

  /** Opens a Guide page from the Lesson Book (the X-ray only once the run's HQ is open). */
  private guide(p: GuidePage): void {
    if (p === 'xray') {
      if (!this.host.hubHtml()) return;
      this.xPart = 0;
    }
    this.mode = p;
  }
  private guideBack(): void {
    if (this.mode === 'xray' || this.mode === 'style' || this.mode === 'motion') this.mode = 'replay';
    else if (this.mode === 'replay') this.mode = this.home;
  }

  private playLesson(): void {
    const l = TUT.lessons[this.rAt];
    if (!l) return;
    this.mode = null;
    this.host.replay(l.id);
  }

  /** Letter and number keys (before the input layer). True when handled. */
  raw(code: string): boolean {
    const s = this.mode;
    if (s === 'menu') {
      const blade: Record<string, number> = { Digit1: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5, KeyR: 6, KeyS: 7, KeyT: 8 };
      if (code in blade) { this.pickBlade(blade[code]!); this.host.refresh(); return true; }
      // The other tab keys and letters do nothing here (Q is the wheel's).
      return code.startsWith('Digit') || (code.startsWith('Key') && !['KeyW', 'KeyA', 'KeyD', 'KeyZ', 'KeyX'].includes(code));
    }
    if (s === 'replay') {
      const g: Record<string, GuidePage> = { KeyI: 'xray', KeyK: 'style', KeyM: 'motion' };
      if (code in g) { this.guide(g[code]!); this.host.refresh(); return true; }
    }
    if (s === 'xray' || s === 'style' || s === 'motion') return code.startsWith('Digit') || code.startsWith('Key');
    if (s === 'replay') return code.startsWith('Digit') || (code.startsWith('Key') && !['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyZ', 'KeyX'].includes(code));
    if (s === null) return false;
    if (s === 'settings') {
      if (code === 'KeyD') { this.resetTab(); this.host.refresh(); return true; }
      if (code === 'Tab') { this.setCat(this.cat + 1); this.host.refresh(); return true; }
    }
    if (s === 'readaloud' && code === 'KeyR') { this.host.r9read?.(); return true; }
    if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space') return false;
    return code === 'Tab' || (code.startsWith('Key') && !['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyZ', 'KeyX'].includes(code));
  }

  /** Arrows, Enter, Esc. True when handled. */
  key(a: InputAction): boolean {
    const s = this.mode;
    if (s === null) return false;
    if (s === 'menu') {
      if (this.notice && (a === 'confirm' || a === 'back')) this.notice = null;
      else if (a === 'up' || a === 'down' || a === 'left' || a === 'right') this.at = phoneMove(this.at, a, BLADES.length);
      else if (a === 'confirm') this.pickBlade(this.at);
      else if (a === 'back') this.close();
      return true;
    }
    if (s === 'replay') {
      // The Lesson Book (pass 50): five lessons a row; arrows walk the grid.
      const n = TUT.lessons.length;
      if (a === 'left' || a === 'right') this.rAt = (this.rAt + (a === 'left' ? -1 : 1) + n) % n;
      else if (a === 'up' || a === 'down') { const j = this.rAt + (a === 'up' ? -5 : 5); if (j >= 0 && j < n) this.rAt = j; }
      else if (a === 'confirm') this.playLesson();
      else if (a === 'back') this.mode = this.home;
      return true;
    }
    if (s === 'xray' || s === 'style' || s === 'motion') {
      if (a === 'confirm' && s === 'xray') this.xPart = (this.xPart + 1) % XRAY.length;
      else if (a === 'confirm' && s === 'style') this.mode = 'motion';
      else if (a === 'back') this.guideBack();
      return true;
    }
    if (a === 'back') { this.back(); return true; }
    if (s === 'home') {
      const cols = 4, n = TILES.length;
      if (a === 'left' || a === 'right') this.tile = (this.tile + (a === 'left' ? -1 : 1) + n) % n;
      else if (a === 'up' || a === 'down') this.tile = (this.tile + cols) % n;
      else if (a === 'confirm') this.go(TILES[this.tile]!.to);
      return true;
    }
    if (s === 'save' || s === 'controls') {
      const n = s === 'save' ? SAVE_ROWS.length : CONTROLS.length;
      if (a === 'up' || a === 'down') this.tile = (this.tile + (a === 'up' ? -1 : 1) + n) % n;
      else if (a === 'confirm') { if (s === 'save') this.saveRow(this.tile); else this.go('setcontrols'); }
      return true;
    }
    if (s === 'vault') {
      const n = AI_DATA.keyCards.length;
      if (a === 'left' || a === 'right' || a === 'up' || a === 'down') this.tile = (this.tile + (a === 'left' || a === 'up' ? -1 : 1) + n) % n;
      else if (a === 'confirm') this.openVault(this.tile);
      return true;
    }
    if (s === 'calm') {
      if (a === 'confirm' || a === 'left' || a === 'right') this.flipCalm();
      return true;
    }
    this.setNotice = null;
    const row = this.rows()[this.row];
    if (a === 'up' || a === 'down') this.moveRow(a === 'up' ? -1 : 1);
    else if (a === 'left' || a === 'right') row?.change?.(a === 'left' ? -1 : 1);
    else if (a === 'confirm') (row?.press ?? (() => row?.change?.(1)))();
    return true;
  }
}

/** Where a value sits in a setting's own cycle from the starting settings (so a segmented row keeps one order). */
function cycleOrder(d: SettingDef, label: string): number {
  let x: Settings = DEFAULT_SETTINGS;
  for (let n = 0; n < 8; n++) {
    if (d.show(x) === label) return n;
    const y = changeSetting(x, d.id);
    if (y === x) break;
    x = y;
  }
  return 99;
}

// DOMINION tutorial and opening (plans/evil-mode-rework/tutorial-mockups, a1-e9). Kept beside DominionScene so the
// scene only forwards to it: the help choice and the cold open before the setup, Rotom's setup tips, the lesson
// overlays, the first week's pages and a replayed lesson. What the run remembers (the help level, which lessons were
// shown, the Day 2 Rattata) is a saved clock step (`{ t: 'tut' }`); the rest (the cursor, which beat of the cold open,
// a replayed lesson) is drawn only and changes nothing.

import { DOMINION_DATA } from '../../core/dominion/data';
import { districtDef } from '../../core/dominion/field';
import { colourDef } from '../../core/dominion/founding';
import { topModel } from '../../core/dominion/screens';
import type { DominionBlock } from '../../core/dominion/schema';
import { dominionBlock } from '../../core/dominion/session';
import { lessonDue, pageDue, seen, TUT, tutMode, weekOne, type Due, type TutMode, type TutPage, type TutWhere } from '../../core/dominion/tutorial';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { pngSrc } from '../../ui/redux/screens/dominion/teamPic';
import {
  billsView, coldRewardView, coldView, doneOverlay, fill, foundedRewardView, gangView, giftView, helpView, kitView, lessonOverlay,
  lessonSteps, nightView, replayOverlay, replayView, rivalView, setupTip, stepView, titleTip, weekView,
} from '../../ui/redux/screens/dominion/tutorial';

/**
 * The tutorial is on. A browser driven by automation (the Playwright tests) keeps the older flow unless it asks with
 * `?tutorial=1` (the older Dominion specs press straight from New run into the setup), as `?moments=1` does.
 */
export function tutorialOn(): boolean {
  if (typeof location === 'undefined') return true;
  const q = new URLSearchParams(location.search).get('tutorial');
  if (q === '1' || q === '0') return q === '1';
  return !(typeof navigator !== 'undefined' && navigator.webdriver);
}

export interface TutHost {
  refresh(): void;
  /** Where the player is (the HQ only when nothing else owns it). */
  where(): TutWhere;
  /** The Founding page's row, as a lesson-15 step (0-3). */
  foundingStep(): number;
  member(): { look: string; atlas: boolean; name: string; grunt: boolean };
  /** The setup pages, fresh. */
  startSetup(): void;
  toTitle(): void;
  /** Plans the HQ order under the cursor (lesson 3's Enter). */
  planHere(): void;
  /** The HQ's own Enter at Night (lesson 6's Rest). */
  hqNext(): void;
  /** The setup page, its type count and whether it shows a problem (B1-B3). */
  setupState(): { page: string; types: number; problem: boolean } | null;
  /** The title, a profile that has never finished or started a Dominion (A1). */
  firstTitle(): boolean;
}

/** Lessons that never hold the page: the tip shows and the next key goes through. */
const PASS = new Set(['wheel', 'menu', 'founding']);
const EMITS = new Set(['Enter', 'NumpadEnter', 'Space', 'KeyZ', 'Escape', 'KeyX', 'Backspace', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD']);

export class TutorialController {
  /** Before the run: the help choice, the cold open, its reward. */
  private pre: 'help' | 'cold' | 'reward' | null = null;
  private helpAt = 0;
  private beat = 0;
  /** The help level picked for the run being set up (null: the tutorial was never offered, e.g. automated). */
  private chosen: TutMode | null = null;
  private setupStop = false;
  /** Which page or lesson `sub` belongs to, and how far into it (the gift's two parts, lesson 3's presses). */
  private subFor = '';
  private sub = 0;
  private replaying: { lesson: string; step: number } | null = null;
  /** The non-blocking tip last drawn (a key closes it). */
  private toast: Due | null = null;

  constructor(private readonly host: TutHost) {}

  private block(): DominionBlock | null {
    return dominionBlock(services().session.run) ?? null;
  }
  private save(op: 'seen' | 'mode' | 'gift', arg: string): void {
    services().session.dominionStep({ t: 'tut', op, arg });
  }
  private vars(b: DominionBlock | null): Record<string, string> {
    return { name: b?.members[0]?.name ?? DOMINION_DATA.start.members.grunt.name, home: districtDef(DOMINION_DATA.field.hq)?.name ?? 'Pewter', team: b?.teamName ?? 'Unnamed Crew' };
  }
  private subOf(key: string): number {
    if (this.subFor !== key) { this.subFor = key; this.sub = 0; }
    return this.sub;
  }

  /** New run on the title: the help choice comes first. False when the tutorial is off for this browser. */
  begin(): boolean {
    if (!tutorialOn()) return false;
    this.pre = 'help';
    const p = services().session.settings.expansion.dominionPrefs.tutorial;
    this.helpAt = Math.max(0, TUT.help.options.findIndex((o) => o.id === p));
    this.chosen = null;
    this.setupStop = false;
    return true;
  }
  /** The help level for `dominionStart` (undefined: no tutorial block, the old flow). */
  mode(): TutMode | undefined {
    return this.chosen ?? undefined;
  }
  /** A run left (End): nothing drawn carries over. */
  reset(): void {
    this.pre = null;
    this.replaying = null;
    this.toast = null;
    this.subFor = '';
  }

  /** Boss Menu › Replay a lesson: its tips again over this page (drawn only). */
  replay(lesson: string): void {
    if (TUT.lessons.some((l) => l.id === lesson)) this.replaying = { lesson, step: 0 };
  }

  private page(): TutPage | null {
    const b = this.block();
    return b && this.host.where() === 'hq' ? pageDue(b, true) : null;
  }
  private due(): Due | null {
    const b = this.block();
    if (!b || this.page()) return null;
    const w = this.host.where();
    return lessonDue(b, w, w === 'founding' ? this.host.foundingStep() : 0);
  }
  private full(): boolean {
    return tutMode(this.block()) === 'full';
  }
  /** The lesson holds the page until Enter (Full mode; not the wheel, the Boss Menu or the Founding). */
  private holds(d: Due | null): boolean {
    return !!d && this.full() && !PASS.has(d.lesson);
  }
  /** Lesson 6 in Full is its own page (the four-phase dial). */
  private nightPage(d: Due | null): boolean {
    return !!d && d.lesson === 'night' && this.full();
  }

  /** The tutorial draws the whole page now (before the run, a first-week page, the night). */
  ownsPage(): boolean {
    if (this.pre) return true;
    const p = this.page();
    return (!!p && p.kind !== 'done') || this.nightPage(this.due());
  }

  /** The tutorial reads the keys now. */
  owns(): boolean {
    return !!this.pre || !!this.replaying || !!this.page() || this.holds(this.due());
  }

  // ---------- drawing ----------

  renderPage(): string {
    if (this.pre === 'help') return helpView(this.helpAt);
    if (this.pre === 'cold') return coldView(this.beat);
    if (this.pre === 'reward') return coldRewardView();
    const b = this.block();
    if (!b) return '';
    const p = this.page(), m = this.host.member(), top = topModel(b);
    if (p?.kind === 'kit') return kitView(m);
    if (p?.kind === 'gift') return giftView(top, m, this.subOf('gift') ? 1 : 0, this.full());
    if (p?.kind === 'step') return stepView(top, this.stepRows(b), p.id === 'contact' ? TUT.step.stamp : TUT.step.stampEarn);
    if (p?.kind === 'bills') return billsView(top, m, this.billRows(b), TUT.bills.lines.map((l) => fill(l, { ...this.vars(b), ...this.billNums(b) })), this.full());
    if (p?.kind === 'rival') return rivalView();
    if (p?.kind === 'week') return weekView(weekOne(b), DOMINION_DATA.start.firstSteps.length);
    if (p?.kind === 'gang') return gangView();
    if (p?.kind === 'founded') return foundedRewardView(top, b.teamName ?? 'Unnamed Crew', this.foundedRows(b));
    return nightView(top, top.day, this.full());
  }

  /** What lies over the page: the title tag, the setup tips, a lesson, the end, a replayed lesson. */
  overlay(screen: string): string {
    if (this.pre) return '';
    if (this.replaying) return replayOverlay(this.replaying.lesson, this.replaying.step, this.vars(this.block()));
    if (screen === 'title') return this.host.firstTitle() && tutorialOn() ? titleTip() : '';
    if (screen === 'setup') {
      const s = this.host.setupState();
      return s && this.chosen === 'full' ? setupTip(s.page, s.types, s.problem, !this.setupStop) : '';
    }
    if (this.setupStop && screen === 'opening') this.setupStop = false;
    const b = this.block();
    const p = this.page();
    if (p?.kind === 'done') return doneOverlay(b?.teamName ?? 'Unnamed Crew');
    if (p) return '';
    const d = this.due();
    this.toast = d && !this.holds(d) ? d : null;
    if (!d || this.nightPage(d)) return '';
    const step = d.lesson === 'orders' ? (b && (b.orders.length >= 2 || this.subOf('orders') >= 2) ? 1 : 0) : d.step;
    return lessonOverlay({ id: d.id, lesson: d.lesson, step, full: this.full(), vars: this.vars(b) });
  }

  private stepRows(b: DominionBlock): { label: string; done: boolean; reward: number; progress: string }[] {
    return DOMINION_DATA.start.firstSteps.map((s) => ({
      label: s.label, done: b.stepsDone.includes(s.id), reward: s.reward,
      progress: 'earned' in s && s.earned ? `₽${Math.min(b.funds, s.earned)} / ₽${s.earned}` : '—',
    }));
  }
  private billNums(b: DominionBlock): { rent: string; wages: string } {
    const line = [...b.report].reverse().find((l) => /^Week \d+ bills/.test(l)) ?? '';
    const n = [...line.matchAll(/₽(\d[\d,]*\d|\d)/g)].map((m) => m[1]!);
    return { rent: n[0] ?? String(DOMINION_DATA.start.clock.rent), wages: n[1] ?? String(b.members.reduce((t, m) => t + m.wage, 0)) };
  }
  private billRows(b: DominionBlock): [string, number][] {
    const rent = Number(this.billNums(b).rent.replace(/,/g, ''));
    return [[TUT.bills.rent, rent], ...b.members.map((m) => [fill(TUT.bills.wage, { name: m.name }), m.wage] as [string, number])];
  }
  private foundedRows(b: DominionBlock): [string, string, string][] {
    const t = b.team, f = TUT.founded, m = b.members[0];
    const logo = t ? t.logo[0]!.toUpperCase() + t.logo.slice(1) : '';
    const pic = m && m.look.endsWith('.png') ? pngSrc(m.look, null) : 'g-fame-checker';
    return [
      [pic, fill(f.band, { member: m?.name ?? '' }), `${colourDef(t?.primary ?? '')?.name ?? ''} · ${t?.initial ?? ''}`],
      ['g-relic-crown', fill(f.mark, { logo }), f.door],
      ['g-star-piece', f.noto, TUT.gang.stamp[0] + TUT.gang.stamp.slice(1).toLowerCase().replace(/ (\w)/g, (_, c: string) => ` ${c.toUpperCase()}`)],
    ];
  }

  // ---------- input ----------

  /** A key before the input layer. 'eat': handled, and the action that follows is not read; 'done': handled. */
  raw(code: string, screen: string): 'eat' | 'done' | false {
    if (this.pre === 'help') {
      const i = { Digit1: 0, Digit2: 1, Digit3: 2 }[code];
      if (i !== undefined) { this.pick(i); this.host.refresh(); return 'done'; }
      return EMITS.has(code) ? false : 'done';
    }
    if (this.pre) return EMITS.has(code) ? false : 'done';
    if (screen === 'setup' && this.chosen === 'full' && !this.setupStop && code === 'KeyX') {
      this.setupStop = true;
      this.host.refresh();
      return 'eat';
    }
    if (this.replaying || this.page()) return EMITS.has(code) ? false : 'done';
    const d = this.due();
    if (this.holds(d)) {
      if (code === 'KeyX') { this.save('mode', 'off'); this.host.refresh(); return 'eat'; }
      return EMITS.has(code) ? false : 'done';
    }
    this.closeToast();
    return false;
  }

  /** The wheel closed (Q let go): its tip has been read. */
  keyup(): void {
    if (this.toast?.lesson === 'wheel' && this.host.where() !== 'wheel') this.closeToast();
  }

  private closeToast(): void {
    const t = this.toast;
    if (!t || t.lesson === 'founding') return;
    this.toast = null;
    const b = this.block();
    if (b && !seen(b, t.id)) this.save('seen', t.id);
  }

  private pick(i: number): void {
    const o = TUT.help.options[i];
    if (!o) return;
    this.helpAt = i;
    this.chosen = o.id;
    const s = services().session.settings;
    if (s.expansion.dominionPrefs.tutorial !== o.id) services().session.saveSettings({ ...s, expansion: { ...s.expansion, dominionPrefs: { ...s.expansion.dominionPrefs, tutorial: o.id } } });
    if (o.id === 'off') {
      this.pre = null;
      this.host.startSetup();
    } else {
      this.pre = 'cold';
      this.beat = 0;
    }
  }

  /** Arrows, Enter, Esc. True when handled. */
  key(a: InputAction): boolean {
    if (this.pre === 'help') {
      if (a === 'up' || a === 'down') this.helpAt = (this.helpAt + (a === 'up' ? -1 : 1) + 3) % 3;
      else if (a === 'confirm') this.pick(this.helpAt);
      else if (a === 'back') { this.pre = null; this.host.toTitle(); }
      return true;
    }
    if (this.pre === 'cold') {
      if (a === 'confirm') { if (++this.beat >= TUT.cold.beats.length) this.pre = 'reward'; }
      else if (a === 'back') { this.pre = null; this.host.startSetup(); }
      return true;
    }
    if (this.pre === 'reward') {
      if (a === 'confirm') { this.pre = null; this.host.startSetup(); }
      return true;
    }
    if (this.replaying) {
      if (a === 'confirm') {
        const n = lessonSteps(this.replaying.lesson, this.vars(this.block())).length;
        if (++this.replaying.step >= n) this.replaying = null;
      } else if (a === 'back') this.replaying = null;
      return true;
    }
    const b = this.block();
    const p = this.page();
    if (p && b) {
      if (a === 'confirm') this.pageNext(p);
      return true;
    }
    const d = this.due();
    if (b && d && this.holds(d)) {
      if (d.lesson === 'orders' && (a === 'up' || a === 'down')) return false;
      if (a !== 'confirm') return true;
      if (d.lesson === 'orders' && b.orders.length < 2 && this.subOf('orders') < 2) {
        this.sub += 1;
        this.host.planHere();
        return true;
      }
      this.save('seen', d.id);
      if (d.lesson === 'night') this.host.hqNext();
      return true;
    }
    if (d && !this.holds(d) && d.lesson !== 'founding' && d.lesson !== 'wheel') {
      // A tip in Tips mode (or the Boss Menu's): the first key closes it and still does its own thing.
      this.toast = d;
      this.closeToast();
    }
    return false;
  }

  private pageNext(p: TutPage): void {
    switch (p.kind) {
      case 'kit': return this.save('seen', 'kit');
      case 'gift':
        if (this.subOf('gift') === 0) { this.sub = 1; return; }
        this.subFor = '';
        return this.save('gift', '');
      case 'step': return this.save('seen', `step:${p.id}`);
      case 'bills': this.save('seen', 'bills-page'); return this.save('seen', 'bills');
      case 'rival': return this.save('seen', 'rival-note');
      case 'week': return this.save('seen', 'week');
      case 'gang': return this.save('seen', 'gang');
      case 'founded': this.save('seen', 'founded'); return this.save('seen', 'founding');
      case 'done': return this.save('seen', 'done');
    }
  }

  /** Clicks and taps (the tip, the reward's button, the help rows, Skip). */
  acts(): Record<string, (arg: string) => void> {
    return {
      tutNext: () => { this.key('confirm'); this.host.refresh(); },
      tutSkip: () => { this.key('back'); this.host.refresh(); },
      tutHelp: (i) => { const n = Number(i); if (this.helpAt === n) this.pick(n); else this.helpAt = n; this.host.refresh(); },
    };
  }

  /** The Replay page's rows: which lessons this run has shown. */
  static doneRows(b: DominionBlock | null): boolean[] {
    return TUT.lessons.map((l) => !!b && (l.id === 'setup' ? !!b.opened : seen(b, l.id)));
  }
  static replayPage(at: number, mode: TutMode, b: DominionBlock | null): string {
    return replayView(at, mode, TutorialController.doneRows(b));
  }
}

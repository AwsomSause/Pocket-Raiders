// First-visit screens in the original look: the update log (patch notes) and the optional tutorial.
// WelcomeScene shows the log once per version, then offers the tutorial once; TutorialScene lists nine
// professors (one area each) and can be replayed from Settings > Save & Data. Nothing here touches run state.

import Phaser from 'phaser';
import { GAME_UPDATE_ID, TUTORIAL_CATEGORIES, latestUpdate, markTutorialDone, markTutorialOffered, markUpdateSeen, tutorialOfferPending, updateLogPending } from '../core/tutorial';
import type { Settings } from '../core/state';
import { services } from '../game/services';
import { onInputAction } from '../ui/input';
import { COLORS, GAME_WIDTH, textStyle } from '../ui/theme';
import { drawBackdrop, drawPanel, Menu, type MenuOption } from '../ui/widgets';

interface Handoff {
  returnTo: string;
  /** Settings remembers which screen it came from. */
  from?: 'MainMenu' | 'Hub';
}

/** True when the title screen should open the welcome flow. Automated browsers skip it unless the URL has ?welcome=1. */
export function shouldWelcome(s: Settings): boolean {
  if (!updateLogPending(s) && !tutorialOfferPending(s)) return false;
  if (typeof navigator !== 'undefined' && navigator.webdriver && !location.search.includes('welcome=1')) return false;
  return true;
}

function leave(scene: Phaser.Scene, h: Handoff): void {
  scene.scene.start(h.returnTo, h.returnTo === 'Settings' ? { from: h.from ?? 'MainMenu' } : undefined);
}

abstract class PagedScene extends Phaser.Scene {
  protected ui!: Phaser.GameObjects.Container;
  protected menu: Menu | null = null;

  protected frame(): void {
    drawBackdrop(this);
    this.add.text(GAME_WIDTH / 2, 28, '', textStyle(12, COLORS.textMuted));
  }

  /** Rebuilds the visible page: a title, a body, and a menu. */
  protected show(title: string, sub: string, body: string, options: { option: MenuOption; action: () => void }[], focus = 0, onBack?: () => void, left?: () => void): void {
    this.menu?.destroy();
    this.ui?.destroy();
    this.ui = this.add.container(0, 0);
    this.ui.add(drawPanel(this, 40, 20, GAME_WIDTH - 80, 500, { alpha: 0.95 }));
    this.ui.add(this.add.text(64, 38, title, textStyle(30, COLORS.text)));
    if (sub) this.ui.add(this.add.text(64, 82, sub, textStyle(18, COLORS.textMuted)));
    this.ui.add(this.add.text(64, 118, body, textStyle(20, COLORS.text, { wordWrap: { width: GAME_WIDTH - 130 }, lineSpacing: 6 })));
    this.menu = new Menu(this, { x: 64, y: 524 - options.length * 38, options: options.map((o) => o.option), itemWidth: 420, itemHeight: 38, fontSize: 22, onSelect: (i) => options[i]!.action(), ...(onBack ? { onBack } : {}) });
    this.menu.focus(focus, false);
    this.handlers = { left };
  }

  private handlers: { left?: (() => void) | undefined } = {};

  protected wire(): void {
    onInputAction(this, (a) => {
      if (!this.menu) return;
      if (a === 'left') this.handlers.left?.();
      else this.menu.handle(a);
    });
  }
}

export class WelcomeScene extends PagedScene {
  private h: Handoff = { returnTo: 'MainMenu' };
  private page = 0;
  private replay = false;

  constructor() {
    super('Welcome');
  }

  create(data?: Partial<Handoff> & { phase?: 'log' | 'offer'; replay?: boolean }): void {
    this.h = { returnTo: data?.returnTo ?? 'MainMenu', ...(data?.from ? { from: data.from } : {}) };
    this.replay = Boolean(data?.replay);
    this.page = 0;
    this.frame();
    this.wire();
    if (data?.phase === 'offer') this.offer();
    else this.log();
  }

  private log(): void {
    const { session } = services();
    // Seen as soon as it opens, so a crash or a reload never traps the player in a loop.
    if (!this.replay) session.saveSettings(markUpdateSeen(session.settings));
    const entry = latestUpdate();
    const last = entry.sections.length;
    const next = () => (this.page >= last ? this.done() : (this.page++, this.log()));
    const options = [
      { option: { label: this.page >= last ? 'Done' : 'Next' }, action: next },
      { option: { label: 'Skip the update log' }, action: () => this.done() },
    ];
    if (this.page === 0) {
      this.show(`What's new: ${entry.title}`, `Update ${GAME_UPDATE_ID}`, entry.intro, options, 0, () => this.done());
      return;
    }
    const sec = entry.sections[this.page - 1]!;
    this.show(sec.heading, `${this.page} / ${last}`, sec.lines.map((l) => `• ${l}`).join('\n\n'), options, 0, () => this.done(), () => this.page > 0 && (this.page--, this.log()));
  }

  private done(): void {
    const { session } = services();
    if (!this.replay && tutorialOfferPending(session.settings)) this.offer();
    else leave(this, this.h);
  }

  private offer(): void {
    const { session } = services();
    session.saveSettings(markTutorialOffered(session.settings));
    this.show('Welcome, trainer!', 'Optional tutorial', 'Nine professors can walk you through the game, one area each. It is short, and you can replay it any time from Settings > Save & Data.\n\nWould you like to meet them?', [
      { option: { label: 'Yes, start the tutorial' }, action: () => this.scene.start('Tutorial', this.h) },
      { option: { label: 'No thanks, skip it' }, action: () => leave(this, this.h) },
    ], 0, () => leave(this, this.h));
  }
}

export class TutorialScene extends PagedScene {
  private h: Handoff = { returnTo: 'MainMenu' };

  constructor() {
    super('Tutorial');
  }

  create(data?: Partial<Handoff>): void {
    this.h = { returnTo: data?.returnTo ?? 'MainMenu', ...(data?.from ? { from: data.from } : {}) };
    this.frame();
    this.wire();
    // Seen by opening it, so it is never offered again unasked.
    const { session } = services();
    session.saveSettings(markTutorialOffered(session.settings));
    this.list(0);
  }

  private list(focus: number): void {
    const done = services().session.settings.tutorialDone;
    const options = TUTORIAL_CATEGORIES.map((c, i) => ({
      option: { label: `${done.includes(c.id) ? '✓ ' : ''}${c.professor}: ${c.title}`, detail: undefined as string | undefined },
      action: () => this.talk(i, 0),
    }));
    const finished = TUTORIAL_CATEGORIES.every((c) => done.includes(c.id));
    options.push({ option: { label: 'Leave the tutorial', detail: undefined }, action: () => leave(this, this.h) });
    const body = TUTORIAL_CATEGORIES.map((c, i) => `${i + 1}. ${c.professor}: ${c.blurb}`).join('\n');
    this.show('Meet the Professors', finished ? 'All nine lessons finished!' : `${done.length} of ${TUTORIAL_CATEGORIES.length} lessons finished. Pick any, in any order.`, '', options, focus, () => leave(this, this.h));
    this.menu?.container.setY(110);
    // The blurbs sit to the right of the list.
    this.ui.add(this.add.text(500, 118, body, textStyle(16, COLORS.textMuted, { wordWrap: { width: 410 }, lineSpacing: 10 })));
  }

  private talk(i: number, page: number): void {
    const cat = TUTORIAL_CATEGORIES[i]!;
    const lastPage = page >= cat.pages.length - 1;
    const finish = () => {
      const { session } = services();
      session.saveSettings(markTutorialDone(session.settings, cat.id));
      this.list(Math.min(i + 1, TUTORIAL_CATEGORIES.length));
    };
    this.show(cat.professor, `${cat.title} · ${page + 1} / ${cat.pages.length}`, cat.pages[page]!, [
      { option: { label: lastPage ? 'Finish this lesson' : 'Next' }, action: lastPage ? finish : () => this.talk(i, page + 1) },
      { option: { label: 'Skip this lesson' }, action: () => this.list(i) },
    ], 0, () => this.list(i), () => page > 0 && this.talk(i, page - 1));
  }
}

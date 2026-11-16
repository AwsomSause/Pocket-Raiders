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
import { mountRedux, reduxOn, type ReduxView } from '../ui/redux/stage';
import { eventView } from '../ui/redux/screens/event';
import { pageLines, pageSpeaker, type ScriptPage } from '../ui/redux/script';
import { artOf } from '../ui/redux/game';
import { playerPortrait, type Art } from '../ui/redux/templates';

/** New UI: how a page looks as the mock-ups' talk page: the tag, who speaks (null: the page's title is the plate) and their picture. */
interface RxFace { tag: string; speaker: string | null; cast: Art | null; lines?: string[] }
/** New UI: the room behind the welcome log and the lessons. */
const RX_ROOM = 'packs/memories/eventbg/indoor.png';

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

/** New UI: a professor's picture ("Prof. Oak" is the art "boss.oak"), or null when the game has none of them. */
function professorArt(scene: Phaser.Scene, professor: string): Art | null {
  return artOf(scene, `boss.${professor.replace(/^Prof\.\s*/, '').split(/[\s&]/)[0]!.toLowerCase()}`);
}

/** New UI: the player's picture beside the log, in the Look the profile chose (Look A before any choice, as the mock-up). */
function playerArt(): Art {
  const look = services().session.profile.story?.protagonist?.look === 'look_b' ? 'b' : 'a';
  return playerPortrait(look);
}

function leave(scene: Phaser.Scene, h: Handoff): void {
  scene.scene.start(h.returnTo, h.returnTo === 'Settings' ? { from: h.from ?? 'MainMenu' } : undefined);
}

abstract class PagedScene extends Phaser.Scene {
  protected ui!: Phaser.GameObjects.Container;
  protected menu: Menu | null = null;
  /** New UI: the mock-up layer; the page being shown; which page of its text is up; how the page looks for an option. */
  protected rx: ReduxView | null = null;
  private rxPage = { title: '', body: '', options: [] as MenuOption[] };
  private rxAt = 0;
  private rxSig = '';
  protected rxFace: (index: number) => RxFace = () => ({ tag: '', speaker: null, cast: null });

  protected frame(): void {
    drawBackdrop(this);
    this.add.text(GAME_WIDTH / 2, 28, '', textStyle(12, COLORS.textMuted));
    this.rx = null;
    this.rxAt = 0;
    this.rxSig = '';
    if (!reduxOn()) return;
    // New UI: every page here is the mock-ups' talk page (the event look): the words in the text box under a name
    // plate, the choices at the side, the tag at the top. The pages above stay the controller.
    this.rx = mountRedux(this, {
      render: (c) => {
        const index = this.menu?.index ?? 0, face = this.rxFace(index), pages = this.rxPages(face), at = Math.min(this.rxAt, pages.length - 1), page = pages[at]!;
        return eventView(c, {
          name: this.rxPage.title, tag: face.tag, lines: page, speaker: pageSpeaker(page), page: { at, of: pages.length },
          art: RX_ROOM, tint: null, fx: null, cast: face.cast, mon: null,
          choices: this.rxPage.options.map((o) => ({ label: o.label, sub: '', chance: '', locked: !!o.disabled })), index,
          money: null, outcome: null, pick: null, countdown: '', timer: null,
        });
      },
      acts: {
        pick: (i) => { this.menu?.focus(Number(i), false); this.menu?.confirm(); },
        page: () => this.rxTurn(1),
      },
      overs: { over: (i) => this.menu?.focus(Number(i), false) },
    });
  }

  /** The page's words as pages of at most 240 letters; a speaker's words go under their name. */
  private rxPages(face: RxFace): ScriptPage[] {
    const lines = (face.lines ?? this.rxPage.body.split(/\n+/)).map((t) => t.trim()).filter(Boolean).map((text) => ({ who: face.speaker, text }));
    const pages = pageLines(lines, 240);
    return pages.length ? pages : [[{ who: null, text: '' }]];
  }

  /** Turns the text's page; true when it moved. */
  private rxTurn(by: number): boolean {
    const to = this.rxAt + by;
    if (to < 0 || to >= this.rxPages(this.rxFace(this.menu?.index ?? 0)).length) return false;
    this.rxAt = to;
    return true;
  }

  override update(): void {
    if (!this.rx) return;
    const sig = `${this.menu?.index ?? -1}|${this.rxAt}|${this.rxPage.title}|${this.rxPage.body.length}|${this.rxPage.options.map((o) => o.label).join('|')}`;
    if (sig === this.rxSig) return;
    this.rxSig = sig;
    this.rx.refresh();
  }

  /** Rebuilds the visible page: a title, a body, and a menu. */
  protected show(title: string, sub: string, body: string, options: { option: MenuOption; action: () => void }[], focus = 0, onBack?: () => void, left?: () => void): void {
    this.menu?.destroy();
    this.ui?.destroy();
    this.ui = this.add.container(0, 0);
    this.ui.add(drawPanel(this, 40, 20, GAME_WIDTH - 80, 500, { alpha: 0.95 }));
    this.ui.add(this.add.text(64, 38, title, textStyle(30, COLORS.text)));
    if (sub) this.ui.add(this.add.text(64, 82, sub, textStyle(18, COLORS.textMuted)));
    // The menu ends 10 px inside the panel's bottom edge; the body shrinks (down to 14 px) so it never runs under it.
    const menuY = 510 - options.length * 38;
    const text = this.add.text(64, 118, body, textStyle(20, COLORS.text, { wordWrap: { width: GAME_WIDTH - 130 }, lineSpacing: 6 }));
    for (let size = 20; text.height > menuY - 126 && size > 14; ) text.setFontSize(--size);
    this.ui.add(text);
    this.menu = new Menu(this, { x: 64, y: menuY, options: options.map((o) => o.option), itemWidth: 420, itemHeight: 38, fontSize: 22, onSelect: (i) => options[i]!.action(), ...(onBack ? { onBack } : {}) });
    this.menu.focus(focus, false);
    this.handlers = { left };
    this.rxPage = { title, body, options: options.map((o) => o.option) };
    this.rxAt = 0;
  }

  private handlers: { left?: (() => void) | undefined } = {};

  protected wire(): void {
    onInputAction(this, (a) => {
      if (!this.menu) return;
      // New UI: while the text has more pages, Enter turns the page before the menu takes it.
      if (this.rx && a === 'confirm' && this.rxTurn(1)) return;
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
    this.rxFace = () => ({ tag: this.page === 0 ? 'First launch' : `Update log ${this.page}/${last}`, speaker: null, cast: playerArt() });
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
    this.rxFace = () => ({ tag: 'Optional tutorial', speaker: null, cast: playerArt() });
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
    // New UI: the lesson under the pointer is the one whose professor and blurb show.
    this.rxFace = (index) => {
      const c = TUTORIAL_CATEGORIES[index];
      return { tag: `Tutorial ${done.length}/${TUTORIAL_CATEGORIES.length}`, speaker: c?.professor ?? null, cast: c ? professorArt(this, c.professor) : null, lines: [c ? `${c.title}. ${c.blurb}` : 'Back to where you were. The lessons stay in Settings > Save & Data.'] };
    };
    this.show('Meet the Professors', finished ? 'All nine lessons finished!' : `${done.length} of ${TUTORIAL_CATEGORIES.length} lessons finished. Pick any, in any order.`, '', options, focus, () => leave(this, this.h));
    this.menu?.container.setY(118);
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
    this.rxFace = () => ({ tag: `Tutorial ${page + 1}/${cat.pages.length}`, speaker: cat.professor, cast: professorArt(this, cat.professor) });
    this.show(cat.professor, `${cat.title} · ${page + 1} / ${cat.pages.length}`, cat.pages[page]!, [
      { option: { label: lastPage ? 'Finish this lesson' : 'Next' }, action: lastPage ? finish : () => this.talk(i, page + 1) },
      { option: { label: 'Skip this lesson' }, action: () => this.list(i) },
    ], 0, () => this.list(i), () => page > 0 && this.talk(i, page - 1));
  }
}

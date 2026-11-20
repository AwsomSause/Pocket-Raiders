// DOMINION D28 (mockups m5-m7): the hold-Q command wheel, the Boss's board and the shutter between pages, for the
// Dominion scene. The scene still owns every page: this controller only remembers what is open, what is pointed at and
// the last pages, and asks the scene to jump. Nothing here is saved or rolled.

import type Phaser from 'phaser';
import { boardMove, hubLine, jumpable, PAGE_NAMES, PINS, pinned, pushLast, spotOf, SPOTS, turn, type PageId } from '../../core/dominion/nav';
import { DOMINION_DATA } from '../../core/dominion/data';
import type { DominionBlock } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { boardView, ghostOf, SHUTTER_MS, shutterMode, wheelView, withShutter, type Shutter } from '../../ui/redux/screens/dominion/navViews';

/** The page the scene is showing: a Dominion page, the board, or null before the run opens (title, setup, opening). */
export type Here = PageId | 'board' | null;

export interface NavHost {
  readonly time: Phaser.Time.Clock;
  refresh(): void;
  navBlock(): DominionBlock | null;
  /** The page under the board and the wheel. */
  navHere(): PageId | null;
  /** Whether the wheel may open now (not on a page the game forces: the Hero stepping in, questioning, a Debate...). */
  navFree(): boolean;
  /** Go to a page the way its own key would. */
  navJump(p: PageId): void;
  setNotice(n: string | null): void;
}

const DIGITS: Record<string, number> = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5 };

export class NavController {
  /** The wheel is up; `held` while Q is down (letting go jumps), false when it was opened with a tap on the Q chip. */
  wheel = false;
  private held = false;
  private at: number | null = null;
  private board: { sheet: 0 | 1; at: number } | null = null;
  private last: PageId[] = [];
  private prev: { here: Here; html: string } | null = null;
  private shutter: Shutter | null = null;
  private n = 0;

  constructor(private readonly host: NavHost) {}

  /** The board is the page (it draws instead of the scene's own page). */
  boardOn(): boolean {
    return !!this.board;
  }
  boardRender(): string {
    return boardView({ sheet: this.board!.sheet, at: this.board!.at });
  }

  /** Every draw passes through here: a new page starts the shutter, and the wheel draws over the page. */
  wrap(html: string, here: Here, level: 'full' | 'lighter' | 'calm'): string {
    const was = this.prev;
    if (was && was.here !== here) {
      if (was.here && was.here !== 'board' && here && here !== 'board') this.last = pushLast(this.last, was.here, here);
      if (was.here && here) this.startShutter(was, here, level);
    }
    if (!was || was.here !== here) this.prev = { here, html };
    else was.html = html;
    if (here === null) this.close();
    let out = this.shutter ? withShutter(html, this.shutter) : html;
    if (this.wheel) out += this.wheelRender();
    return out;
  }

  private startShutter(was: { here: Here; html: string }, here: Exclude<Here, null>, level: 'full' | 'lighter' | 'calm'): void {
    const os = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const mode = shutterMode(level, os || services().session.settings.animationIntensity === 'reduced');
    if (mode === 'off') return void (this.shutter = null);
    const name = (h: Exclude<Here, null>): string => (h === 'board' ? 'The Board' : PAGE_NAMES[h]);
    const n = ++this.n;
    this.shutter = { n, mode, from: name(was.here!), to: name(here), ghost: ghostOf(was.html) };
    this.host.time.delayedCall(SHUTTER_MS + 40, () => {
      if (this.shutter?.n !== n) return;
      this.shutter = null;
      this.host.refresh();
    });
  }

  private wheelRender(): string {
    const b = this.host.navBlock();
    const here = this.host.navHere();
    const spot = this.at === null ? null : SPOTS[this.at]!;
    return wheelView({
      at: this.at,
      hubName: spot ? spot.name : here ? PAGE_NAMES[here] : 'Dominion',
      hubLine: spot && b ? hubLine(b, spot) : 'Point at a place, then let go of Q.',
      last: this.last.map((id) => ({ id, name: PAGE_NAMES[id] })),
      pins: b ? pinned(b) : [],
      shut: SPOTS.map((s, i) => (s.id === 'ops' ? i : -1)).filter((i) => i >= 0),
    });
  }

  // ---------- opening and closing ----------

  openWheel(held: boolean): boolean {
    if (!this.host.navFree()) return false;
    this.wheel = true;
    this.held = held;
    this.at = null;
    this.host.refresh();
    return true;
  }
  close(): void {
    if (!this.wheel) return;
    this.wheel = false;
    this.held = false;
    this.at = null;
  }
  openBoard(): void {
    this.close();
    const here = this.host.navHere();
    const pins = PINS.filter((p) => p.sheet === 0);
    const at = Math.max(0, pins.findIndex((p) => p.id === here));
    this.board = { sheet: 0, at };
    this.host.setNotice(null);
    this.host.refresh();
  }
  closeBoard(): void {
    this.board = null;
    this.host.refresh();
  }

  /** Go to a wheel place (0-7). */
  spot(i: number): void {
    const s = SPOTS[i];
    this.close();
    if (!s) return this.host.refresh();
    if (s.id === 'ops') return this.say(DOMINION_DATA.start.lockedTab);
    this.go(s.id);
  }

  /** Go to a page (a board photo, a last page, a pinned line). */
  go(p: PageId): void {
    this.close();
    this.board = null;
    if (!jumpable(p)) return this.say('That page comes to you: nobody walks into it.');
    this.host.navJump(p);
    this.host.refresh();
  }

  private say(n: string): void {
    this.host.setNotice(n);
    this.host.refresh();
  }

  // ---------- keys ----------

  /** Raw keys (before any page reads them). True when the wheel or the board took the key. */
  raw(e: KeyboardEvent): boolean {
    if (this.wheel) {
      if (e.code === 'KeyQ') return true; // auto-repeat while held
      if (e.code in DIGITS) this.spot(DIGITS[e.code]!);
      else if (e.code === 'KeyR') this.spot(6);
      else if (e.code === 'Backspace') { if (this.last[0]) this.go(this.last[0]); }
      else if (e.code === 'KeyM') this.openBoard();
      return true;
    }
    if (e.code === 'KeyQ' && !e.repeat) {
      if (this.openWheel(true)) return true;
      return false;
    }
    if (this.board) {
      if (e.code === 'Tab') {
        e.preventDefault();
        this.sheet(this.board.sheet ? 0 : 1);
      } else if (e.code === 'KeyM') this.closeBoard();
      return true;
    }
    return false;
  }

  /** Q let go: jump to the place pointed at, or just close when nothing is. */
  up(e: KeyboardEvent): void {
    if (e.code === 'KeyQ') this.release();
  }

  /** A controller's Select (D28): held opens the wheel like Q, let go jumps like letting go of Q. */
  pad(down: boolean): void {
    if (down) {
      if (!this.wheel) this.openWheel(true);
    } else this.release();
  }

  private release(): void {
    if (!this.wheel || !this.held) return;
    if (this.at === null) {
      this.close();
      return this.host.refresh();
    }
    this.spot(this.at);
  }

  /** Moves and confirm/back. True when taken. */
  key(a: InputAction): boolean {
    if (this.wheel) {
      if (a === 'left' || a === 'up' || a === 'right' || a === 'down') {
        this.at = turn(this.at, a === 'left' || a === 'up' ? -1 : 1, spotOf(this.host.navHere()));
        this.host.refresh();
      } else if (a === 'confirm') {
        if (this.at === null) { this.close(); this.host.refresh(); } else this.spot(this.at);
      } else if (a === 'back') this.spot(7);
      return true;
    }
    if (this.board) {
      if (a === 'left' || a === 'right' || a === 'up' || a === 'down') {
        this.board.at = boardMove(this.board.sheet, this.board.at, a);
        this.host.refresh();
      } else if (a === 'confirm') this.pin(this.board.at);
      else if (a === 'back') this.closeBoard();
      return true;
    }
    return false;
  }

  sheet(s: number): void {
    if (!this.board) return;
    this.board = { sheet: s ? 1 : 0, at: 0 };
    this.host.refresh();
  }
  pin(i: number): void {
    const p = this.board ? PINS.filter((x) => x.sheet === this.board!.sheet)[i] : undefined;
    if (p) this.go(p.id);
  }

  /** Click and hover handlers for the views. */
  acts(): Record<string, (arg: string) => void> {
    return {
      wheel: () => (this.wheel ? (this.close(), this.host.refresh()) : void this.openWheel(false)),
      navSpot: (i) => this.spot(Number(i)),
      navClose: () => { this.close(); this.host.refresh(); },
      navGo: (p) => this.go(p as PageId),
      navBoard: () => this.openBoard(),
      navPin: (i) => this.pin(Number(i)),
      navSheet: (s) => this.sheet(Number(s)),
      navBoardClose: () => this.closeBoard(),
    };
  }
  overs(): Record<string, (arg: string) => void> {
    return {
      navPoint: (i) => { if (this.wheel && this.at !== Number(i)) { this.at = Number(i); this.host.refresh(); } },
      navPinOver: (i) => { if (this.board && this.board.at !== Number(i)) { this.board.at = Number(i); this.host.refresh(); } },
    };
  }
}

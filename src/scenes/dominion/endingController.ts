// DOMINION D17: the controller for the ending page, kept beside DominionScene so the scene only forwards to it. The page
// opens by itself the first time the run is complete (and from L on the Empire or Takeover page); ◀ ▶ turn the crew
// pages, Enter closes the books (GameSession.dominionFinish: the run ends and the run-end page pays it), Esc goes back.

import { completion, endingModel, endingNotYet } from '../../core/dominion/ending';
import { dominionBlock } from '../../core/dominion/session';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { endingView } from '../../ui/redux/screens/dominion/ending';

interface Host {
  readonly screenName: string;
  setNotice(n: string | null): void;
  refresh(): void;
  /** The books are closed: the run is over (the scene goes to the run-end page). */
  closeBooks(): void;
}

export class EndingController {
  private page = 0;
  private notice: string | null = null;
  /** Shown once by itself per visit to the scene; L brings it back. */
  private seen = false;
  /** The page is up (over whatever page the scene was on). */
  private on = false;

  constructor(private readonly host: Host) {}

  owns(): boolean {
    return this.on;
  }
  private block() {
    return dominionBlock(services().session.run);
  }

  /** Opens the page. False (with the "not yet" line) when the run isn't complete. */
  open(): boolean {
    const b = this.block();
    if (!b || !completion(b)) {
      this.host.setNotice(endingNotYet());
      return false;
    }
    this.on = true;
    this.page = 0;
    this.notice = null;
    this.seen = true;
    this.host.setNotice(null);
    return true;
  }

  /** The first time a hub page is drawn with the run complete, the ending opens over it. */
  maybeOpen(): boolean {
    if (this.seen || this.owns()) return false;
    const b = this.block();
    if (!b || !completion(b) || b.field.fight) return false;
    if (!['hq', 'map', 'takeover', 'empire', 'ledger'].includes(this.host.screenName)) return false;
    return this.open();
  }

  render(notice: string | null): string {
    const b = this.block(), run = services().session.run;
    return b && run ? endingView(endingModel(b, run, this.page), this.notice ?? notice) : '';
  }

  private turn(d: number): void {
    const b = this.block(), run = services().session.run;
    if (!b || !run) return;
    const pages = endingModel(b, run, 0).pages;
    this.page = (this.page + d + pages) % pages;
    this.host.refresh();
  }

  private close(): void {
    if (!this.on) return;
    if (!services().session.dominionFinish()) {
      this.notice = endingNotYet();
      return this.host.refresh();
    }
    this.on = false;
    this.host.closeBooks();
  }

  acts(): Record<string, (arg: string) => void> {
    return {
      endPage: (d) => this.turn(Number(d) || 1),
      endClose: () => this.close(),
    };
  }

  key(a: InputAction): boolean {
    if (!this.owns()) return false;
    if (this.notice && (a === 'confirm' || a === 'back')) {
      this.notice = null;
      this.host.refresh();
      return true;
    }
    if (a === 'left' || a === 'right') this.turn(a === 'left' ? -1 : 1);
    else if (a === 'confirm') this.close();
    else if (a === 'back') {
      this.on = false;
      this.host.refresh();
    }
    return true;
  }
}

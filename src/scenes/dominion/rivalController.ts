// DOMINION slice D9: the controller for the Rival File, kept beside DominionScene so the scene only forwards to it.
// It keeps the cursor; every answer goes through GameSession.dominionStep (saved). A challenge answered with Fight
// starts the battle at once (the scene's fight bridge).

import { rivalFileModel } from '../../core/dominion/rivalScreens';
import { dominionBlock } from '../../core/dominion/session';
import type { DominionAction } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { rivalFileView } from '../../ui/redux/screens/dominion/rival';

type Screen = 'title' | 'setup' | 'opening' | 'hq' | 'map' | 'card' | 'crew' | 'reserve' | 'pyramid' | 'base' | 'rival' | 'squads';
interface Host {
  screenName: Screen;
  setNotice(n: string | null): void;
  refresh(): void;
  /** Steps the clock; true when it worked. `fight` is set when the answer leaves a battle waiting. */
  rivalStep(a: DominionAction): { ok: boolean; fight: boolean; notice: string | null };
  startFight(): void;
}

export class RivalController {
  private at = 0;
  private notice: string | null = null;

  constructor(private readonly host: Host) {}

  private block() {
    return dominionBlock(services().session.run);
  }
  private active(): boolean {
    return this.host.screenName === 'rival';
  }

  /** Opens the Rival File (key R on the HQ or the Morning; a click on the Tension badge or the threat row). */
  open(): boolean {
    const b = this.block();
    if (!b || !rivalFileModel(b, 0)) return false;
    this.host.screenName = 'rival';
    this.at = 0;
    this.notice = null;
    this.host.setNotice(null);
    return true;
  }

  render(): string {
    const b = this.block();
    const m = b ? rivalFileModel(b, this.at, this.notice) : null;
    return m ? rivalFileView(m) : '';
  }

  private rows() {
    const b = this.block();
    return b ? rivalFileModel(b, this.at)?.rows ?? [] : [];
  }

  private answer(i: number): void {
    const row = this.rows()[i];
    if (!row) return;
    this.at = i;
    const out = this.host.rivalStep(row.act);
    this.notice = out.notice;
    if (out.ok && out.fight) return this.host.startFight();
    this.at = Math.min(this.at, Math.max(0, this.rows().length - 1));
    this.host.refresh();
  }

  acts(): Record<string, (arg: string) => void> {
    return {
      rivalFile: () => { if (this.open()) this.host.refresh(); },
      rivalRow: (i) => this.answer(Number(i)),
    };
  }
  overs(): Record<string, (arg: string) => void> {
    return { rivalOver: (i) => { this.at = Number(i); this.host.refresh(); } };
  }

  /** Arrow keys, Enter and Esc. Returns true when handled. */
  key(a: InputAction): boolean {
    if (!this.active()) return false;
    const n = this.rows().length;
    if (this.notice && (a === 'confirm' || a === 'back')) {
      this.notice = null;
      return true;
    }
    if ((a === 'up' || a === 'down') && n) this.at = (this.at + (a === 'up' ? -1 : 1) + n) % n;
    else if (a === 'confirm') this.answer(this.at);
    else if (a === 'back') this.close();
    return true;
  }

  /** Letter keys: R (or Esc) closes it again. */
  raw(code: string): boolean {
    if (!this.active()) return false;
    if (code === 'KeyR') {
      this.close();
      this.host.refresh();
      return true;
    }
    return false;
  }

  close(): void {
    this.host.screenName = 'hq';
    this.notice = null;
  }

  dismiss(): void {
    this.notice = null;
  }
}

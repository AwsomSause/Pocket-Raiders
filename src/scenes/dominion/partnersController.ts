// DOMINION slice D16: the controller for the Partnership page (key J), kept beside DominionScene so the scene only
// forwards to it. It keeps the cursor and the Shadow Machine picker; every answer goes through GameSession.dominionStep
// (saved). A purge starts its fight at once (the scene's fight bridge) and comes back to this page. J or Esc goes to the HQ.

import { DOMINION_DATA } from '../../core/dominion/data';
import { partnerRows, partnersModel, partnersOpen } from '../../core/dominion/partnersScreens';
import { dominionBlock } from '../../core/dominion/session';
import type { DominionAction } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { partnersView } from '../../ui/redux/screens/dominion/partners';

type Screen = 'title' | 'setup' | 'opening' | 'hq' | 'map' | 'card' | 'crew' | 'reserve' | 'pyramid' | 'base' | 'rival' | 'ledger' | 'hero' | 'interrupt' | 'desk' | 'squads' | 'founding' | 'founded' | 'debate' | 'spy' | 'takeover' | 'broadcast' | 'assign' | 'district' | 'empire' | 'partners';
interface Host {
  screenName: Screen;
  setNotice(n: string | null): void;
  refresh(): void;
  partnerStep(a: DominionAction): { ok: boolean; fight: boolean; notice: string | null };
  startFightFrom(from: Screen): void;
}

export class PartnersController {
  private at = 0;
  private picking = false;
  private notice: string | null = null;

  constructor(private readonly host: Host) {}

  private block() {
    return dominionBlock(services().session.run);
  }
  owns(): boolean {
    return this.host.screenName === 'partners';
  }

  /** Opens the page (J on the HQ, the map, the Ledger or the Empire page; the board's pin). False before Syndicate. */
  open(): boolean {
    const b = this.block();
    if (!b?.opened) return false;
    if (!partnersOpen(b)) {
      this.host.setNotice(DOMINION_DATA.partners.screen.locked ?? null);
      return true;
    }
    this.host.screenName = 'partners';
    this.at = 0;
    this.picking = false;
    this.notice = null;
    this.host.setNotice(null);
    return true;
  }

  render(notice: string | null): string {
    const b = this.block(), run = services().session.run;
    return b && run ? partnersView(partnersModel(b, run, this.at, this.picking, this.notice ?? notice)) : '';
  }

  private rows() {
    const b = this.block(), run = services().session.run;
    return b && run ? partnerRows(b, run, this.picking) : [];
  }

  private answer(i: number): void {
    const row = this.rows()[i];
    if (!row) return;
    this.at = i;
    if (row.id === 'machine') {
      if (row.off) this.notice = row.sub;
      else {
        this.picking = true;
        this.at = 0;
      }
      return this.host.refresh();
    }
    if (!row.act) return;
    const out = this.host.partnerStep(row.act);
    this.notice = out.notice;
    if (out.ok && this.picking) this.picking = false;
    if (out.ok && out.fight) {
      this.notice = null;
      return this.host.startFightFrom('partners');
    }
    this.at = Math.min(this.at, Math.max(0, this.rows().length - 1));
    this.host.refresh();
  }

  acts(): Record<string, (arg: string) => void> {
    return {
      partners: () => { if (this.open()) this.host.refresh(); },
      partnerRow: (i) => this.answer(Number(i)),
    };
  }
  overs(): Record<string, (arg: string) => void> {
    return { partnerOver: (i) => { this.at = Number(i); this.host.refresh(); } };
  }

  /** Arrow keys, Enter and Esc. Returns true when handled. */
  key(a: InputAction): boolean {
    if (!this.owns()) return false;
    const n = this.rows().length;
    if (this.notice && (a === 'confirm' || a === 'back')) {
      this.notice = null;
      return true;
    }
    if ((a === 'up' || a === 'down') && n) this.at = (this.at + (a === 'up' ? -1 : 1) + n) % n;
    else if (a === 'confirm') this.answer(this.at);
    else if (a === 'back') {
      if (this.picking) {
        this.picking = false;
        this.at = 0;
      } else this.close();
    }
    return true;
  }

  /** Letter keys: J closes it again. */
  raw(code: string): boolean {
    if (!this.owns() || code !== 'KeyJ') return false;
    this.close();
    return true;
  }

  close(): void {
    this.host.screenName = 'hq';
    this.picking = false;
    this.notice = null;
  }

  /** Back from the purge's fight: the page is open again, at the top. */
  resume(notice: string | null): void {
    this.at = 0;
    this.picking = false;
    this.notice = notice;
  }

  dismiss(): void {
    this.notice = null;
  }
}

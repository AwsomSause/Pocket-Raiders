// DOMINION slice D5: the controller for the HQ menu (mockup 6), kept beside DominionScene so the scene only forwards to
// it. It keeps the cursors (the Buy Room row, the district for an outside building, the overlays); every change goes
// through GameSession.dominionStep (saved).

import { buildRows, heldDistricts, loanMax } from '../../core/dominion/hq';
import { assetsModel, baseModel, moneyModel, type MoneyRowId } from '../../core/dominion/hqScreens';
import { dirtyOf, hqOf } from '../../core/dominion/hqFx';
import { levelCap } from '../../core/regions';
import { dominionBlock } from '../../core/dominion/session';
import type { DominionAction } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { assetsOverlay, baseView, moneyOverlay } from '../../ui/redux/screens/dominion/hq';

type Screen = 'title' | 'setup' | 'opening' | 'hq' | 'map' | 'card' | 'crew' | 'reserve' | 'pyramid' | 'base' | 'rival' | 'ledger';
interface Host {
  screenName: Screen;
  setNotice(n: string | null): void;
  refresh(): void;
  step(a: DominionAction): boolean;
  /** Opens the Crew File, with the hire list when `hire`. */
  openCrew(hire: boolean): void;
}

export class HqController {
  private at = 0;
  private district: string | null = null;
  private overlay: 'assets' | 'money' | null = null;
  private pick = 0;
  private memberAt = 0;
  private notice: string | null = null;

  constructor(private readonly host: Host) {}

  private block() {
    return dominionBlock(services().session.run);
  }
  private active(): boolean {
    return this.host.screenName === 'base';
  }

  /** Opens the HQ menu (key B on the HQ, or a click on the building). */
  open(): void {
    this.host.screenName = 'base';
    this.overlay = null;
    this.notice = null;
    this.host.setNotice(null);
  }

  render(notice: string | null): string {
    const b = this.block();
    if (!b) return '';
    const run = services().session.run!;
    const cap = levelCap(services().session.content, run.regionIndex);
    const overlay = this.overlay === 'assets' ? assetsOverlay(assetsModel(b, this.pick)) : this.overlay === 'money' ? moneyOverlay(moneyModel(b, this.pick, this.memberAt)) : '';
    return baseView(baseModel(b, cap, this.at, this.district, notice ?? this.notice), overlay);
  }

  private say(n: string | null): void {
    this.notice = n;
    this.host.setNotice(null);
  }
  private go(a: DominionAction): boolean {
    this.host.setNotice(null);
    const ok = this.host.step(a);
    return ok;
  }

  /** Builds the room under the cursor (or the blueprint). */
  private buildPicked(): void {
    const b = this.block();
    if (!b) return;
    const row = buildRows(b, this.district)[this.at];
    if (!row) return;
    this.go({ t: 'build', building: row.def.id, district: row.outside ? row.where : null });
  }

  private moveDistrict(d: number): void {
    const b = this.block();
    if (!b) return;
    const held = heldDistricts(b);
    if (!held.length) return;
    const i = this.district ? held.indexOf(this.district) : 0;
    this.district = held[(Math.max(0, i) + d + held.length) % held.length]!;
  }

  private moneyDo(i: number): void {
    const b = this.block();
    if (!b) return;
    const m = moneyModel(b, i, this.memberAt);
    const row = m.rows[m.at];
    if (!row) return;
    const owed = hqOf(b).loan?.owed ?? 0;
    const by: Record<MoneyRowId, DominionAction> = {
      wash500: { t: 'launder', amount: 500 }, wash2000: { t: 'launder', amount: 2000 }, washAll: { t: 'launder', amount: dirtyOf(b) },
      borrow: { t: 'loan', amount: 1000 }, borrowMax: { t: 'loan', amount: loanMax(b) }, repay: { t: 'repay', amount: 1000 },
      repayAll: { t: 'repay', amount: owed }, letGo: { t: 'letGo', member: m.member?.id ?? '' },
    };
    this.pick = m.at;
    this.go(by[row.id]);
  }

  private assetDo(code: 'U' | 'S' | 'R'): void {
    const b = this.block();
    if (!b) return;
    const m = assetsModel(b, this.pick);
    const row = m.rows[m.at];
    if (!row) return;
    this.go(code === 'U' ? { t: 'tierUp', room: row.uid } : code === 'S' ? { t: 'sell', room: row.uid } : { t: 'rebuild', room: row.uid });
  }

  private menu(id: string): void {
    switch (id) {
      case 'upgrade':
        this.go({ t: 'upgrade' });
        return;
      case 'hire':
        return this.host.openCrew(true);
      case 'team':
        return this.host.openCrew(false);
      case 'assets':
      case 'money':
        this.overlay = this.overlay === id ? null : id;
        this.pick = 0;
        this.say(null);
        return this.host.refresh();
      case 'leave':
        this.overlay = null;
        this.host.screenName = 'hq';
        this.say(null);
        return this.host.refresh();
      case 'build':
        this.overlay = null;
        return this.host.refresh();
    }
  }

  /** Tap targets (data-act). */
  acts(): Record<string, (arg: string) => void> {
    return {
      menu: (id) => this.menu(id),
      upgrade: () => this.menu('upgrade'),
      pickRoom: (i) => {
        const again = this.at === Number(i);
        this.at = Number(i);
        if (again) this.buildPicked();
        else this.host.refresh();
      },
      room: (uid) => {
        const b = this.block();
        if (!b || !uid) return;
        this.overlay = 'assets';
        this.pick = Math.max(0, hqOf(b).rooms.findIndex((r) => r.uid === uid));
        this.host.refresh();
      },
      asset: (i) => { this.pick = Number(i); this.host.refresh(); },
      money: (i) => { this.pick = Number(i); this.moneyDo(Number(i)); },
      dismissHq: () => { this.say(null); this.host.refresh(); },
    };
  }

  /** Letter keys on the HQ menu. Returns true when handled. */
  raw(code: string): boolean {
    if (!this.active()) return false;
    const keys: Record<string, string> = { KeyU: 'upgrade', KeyH: 'hire', KeyM: 'team', KeyA: 'assets', KeyL: 'money', KeyB: 'build' };
    if (this.overlay === 'assets' && (code === 'KeyU' || code === 'KeyS' || code === 'KeyR')) {
      this.assetDo(code === 'KeyU' ? 'U' : code === 'KeyS' ? 'S' : 'R');
      return true;
    }
    const id = keys[code];
    if (!id) return false;
    this.menu(id);
    return true;
  }

  /** Arrows, Enter and Esc. Returns true when handled. */
  key(a: InputAction): boolean {
    if (!this.active()) return false;
    const b = this.block();
    if (!b) return false;
    if (this.overlay) {
      const n = this.overlay === 'assets' ? hqOf(b).rooms.length : moneyModel(b, 0, 0).rows.length;
      if (a === 'back') this.overlay = null;
      else if ((a === 'up' || a === 'down') && n) this.pick = (this.pick + (a === 'up' ? -1 : 1) + n) % n;
      else if (this.overlay === 'money' && (a === 'left' || a === 'right')) {
        const k = b.members.length || 1;
        this.memberAt = (this.memberAt + (a === 'left' ? -1 : 1) + k) % k;
      } else if (a === 'confirm' && this.overlay === 'money') this.moneyDo(this.pick);
      else if (a === 'confirm' && this.overlay === 'assets') this.assetDo('U');
      return true;
    }
    const n = buildRows(b, this.district).length;
    if (a === 'up' || a === 'down') this.at = (this.at + (a === 'up' ? -1 : 1) + n) % n;
    else if (a === 'left' || a === 'right') this.moveDistrict(a === 'left' ? -1 : 1);
    else if (a === 'confirm') this.buildPicked();
    else if (a === 'back') {
      this.host.screenName = 'hq';
      this.say(null);
    }
    return true;
  }

  /** The last notice the HQ menu showed (tests). */
  get shown(): string | null {
    return this.notice;
  }
  /** Cursor on the Buy Room list (tests). */
  get cursor(): number {
    return this.at;
  }
}

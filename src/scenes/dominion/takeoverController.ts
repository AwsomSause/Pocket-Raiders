// DOMINION slice D14: the controller for the Takeover page (K from the HQ, the map or the Ledger), its Holdings list
// (P), and the hijacked broadcast that plays once per town taken. Every choice goes through GameSession.dominionStep
// (saved); a Moment, a storm or a Holding's fight starts the battle at once and comes back here.

import { heroModel } from '../../core/dominion/heroScreens';
import { dominionBlock } from '../../core/dominion/session';
import type { DominionAction } from '../../core/dominion/schema';
import { broadcastModel, holdingsModel, takeoverModel } from '../../core/dominion/takeoverScreens';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import type { MonFiles } from '../../ui/redux/screens/dominion/heroViews';
import { broadcastView, holdingsView, takeoverView } from '../../ui/redux/screens/dominion/takeover';

type Screen = 'title' | 'setup' | 'opening' | 'hq' | 'map' | 'card' | 'crew' | 'reserve' | 'pyramid' | 'base' | 'rival' | 'ledger' | 'hero' | 'interrupt' | 'desk' | 'squads' | 'founding' | 'founded' | 'debate' | 'spy' | 'takeover' | 'broadcast';
interface Host {
  screenName: Screen;
  setNotice(n: string | null): void;
  refresh(): void;
  takeoverStep(a: DominionAction): { ok: boolean; fight: boolean; notice: string | null };
  /** Starts the waiting battle; the scene comes back to `from`. */
  startFightFrom(from: Screen): void;
  monFilesOf(ids: string[]): MonFiles;
  bossLook(): string | null;
}

export class TakeoverController {
  private from: Screen = 'hq';
  private page: 'paths' | 'holdings' = 'paths';
  private at = 0;
  private notice: string | null = null;
  /** Where the broadcast returns to. */
  private after: Screen = 'hq';

  constructor(private readonly host: Host) {}

  private block() {
    return dominionBlock(services().session.run);
  }
  owns(): boolean {
    return this.host.screenName === 'takeover' || this.host.screenName === 'broadcast';
  }

  /** K: the Takeover page (from the HQ, the map or the Ledger). */
  open(from: Screen): boolean {
    const b = this.block();
    if (!b?.opened) return false;
    this.from = from === 'card' ? 'map' : from;
    this.host.screenName = 'takeover';
    this.page = 'paths';
    this.notice = null;
    this.host.setNotice(null);
    return true;
  }
  /** Back from a battle that started here. */
  resume(notice: string | null): void {
    this.host.screenName = 'takeover';
    this.notice = notice;
  }

  /** A town taken (or the whole region) is announced on every TV, once: called when a screen settles. */
  maybeBroadcast(): boolean {
    const b = this.block();
    if (!b?.opened || !['hq', 'map', 'ledger', 'takeover'].includes(this.host.screenName) || !b.takeover?.bcast.queue.length) return false;
    if (b.field.fight && !b.field.fight.begun) return false;
    this.after = this.host.screenName;
    this.host.screenName = 'broadcast';
    return true;
  }

  render(notice: string | null): string {
    const b = this.block();
    if (!b) return '';
    if (this.host.screenName === 'broadcast') {
      const m = broadcastModel(b);
      return m ? broadcastView(m, this.host.bossLook()) : '';
    }
    if (this.page === 'holdings') return holdingsView(holdingsModel(b, this.at, this.notice ?? notice));
    const run = services().session.run!;
    const hero = b.hero ? heroModel(b, run) : null;
    return takeoverView(takeoverModel(b), hero, hero ? this.host.monFilesOf(hero.legends.map((l) => l.id)) : {}, this.notice ?? notice);
  }

  private step(a: DominionAction, back = true): void {
    const out = this.host.takeoverStep(a);
    this.notice = out.notice;
    if (out.ok && out.fight) return this.host.startFightFrom('takeover');
    if (back) this.host.refresh();
  }

  private cta(): void {
    const b = this.block();
    if (!b) return;
    const m = takeoverModel(b);
    switch (m.cta.act) {
      case 'fight': return this.host.startFightFrom('takeover');
      case 'moment': return this.step({ t: 'takeover', op: 'moment' });
      case 'storm': return this.step({ t: 'takeover', op: 'storm' });
      default: return this.openHoldings();
    }
  }
  private openHoldings(): void {
    this.page = 'holdings';
    this.at = 0;
    this.notice = null;
    this.host.refresh();
  }
  private takeRow(i: number): void {
    const b = this.block();
    if (!b) return;
    const row = holdingsModel(b, i).rows[i];
    if (!row) return;
    this.at = i;
    if (row.state !== 'open') {
      this.notice = row.why;
      return this.host.refresh();
    }
    const out = this.host.takeoverStep({ t: 'takeover', op: 'take', id: row.id });
    this.notice = out.notice;
    if (out.ok && out.fight) return this.host.startFightFrom('takeover');
    const nb = this.block();
    if (nb) this.at = Math.max(0, holdingsModel(nb, 0).rows.findIndex((r) => r.id === row.id));
    this.host.refresh();
  }

  acts(): Record<string, (arg: string) => void> {
    return {
      tkCta: () => this.cta(),
      tkHoldings: () => this.openHoldings(),
      tkRow: (i) => this.takeRow(Number(i)),
      tkSkip: () => this.skip(),
      tpSeen: () => this.step({ t: 'takeover', op: 'seen' }),
    };
  }
  overs(): Record<string, (arg: string) => void> {
    return { tkOver: (i) => { this.at = Number(i); this.host.refresh(); } };
  }

  private skip(): void {
    const out = this.host.takeoverStep({ t: 'takeover', op: 'bcast' });
    if (!out.ok) return;
    if (!this.block()?.takeover?.bcast.queue.length) this.host.screenName = this.after === 'broadcast' ? 'hq' : this.after;
    this.host.refresh();
  }

  /** Arrows, Enter and Esc. Returns true when handled. */
  key(a: InputAction): boolean {
    if (!this.owns()) return false;
    if (this.host.screenName === 'broadcast') {
      if (a === 'confirm' || a === 'back') this.skip();
      return true;
    }
    const b = this.block();
    if (this.notice && (a === 'confirm' || a === 'back')) {
      this.notice = null;
      return true;
    }
    if (this.page === 'paths' && b?.takeover?.goal.tp != null && a === 'confirm') {
      this.step({ t: 'takeover', op: 'seen' }, false);
      return true;
    }
    if (this.page === 'holdings') {
      const n = b ? holdingsModel(b, 0).rows.length : 0;
      const per = 8;
      if ((a === 'up' || a === 'down') && n) this.at = (this.at + (a === 'up' ? -1 : 1) + n) % n;
      else if ((a === 'left' || a === 'right') && n) this.at = Math.max(0, Math.min(n - 1, this.at + (a === 'left' ? -per : per)));
      else if (a === 'confirm') this.takeRow(this.at);
      else if (a === 'back') this.page = 'paths';
      return true;
    }
    if (a === 'confirm') this.cta();
    else if (a === 'back') this.close();
    return true;
  }

  /** Letter keys: K closes, P the Holdings, M the Moment, S the storm. */
  raw(code: string): boolean {
    if (!this.owns()) return false;
    if (this.host.screenName === 'broadcast') return true;
    const m = this.block() ? takeoverModel(this.block()!) : null;
    if (code === 'KeyK') this.close();
    else if (code === 'KeyP') return this.page === 'holdings' ? ((this.page = 'paths'), this.host.refresh(), true) : (this.openHoldings(), true);
    else if (code === 'KeyM' && m?.cta.act === 'moment') return this.cta(), true;
    else if (code === 'KeyS' && m?.cta.act === 'storm') return this.cta(), true;
    else return true;
    this.host.refresh();
    return true;
  }

  close(): void {
    this.host.screenName = this.from;
    this.page = 'paths';
    this.notice = null;
  }

  dismiss(): void {
    this.notice = null;
  }
}

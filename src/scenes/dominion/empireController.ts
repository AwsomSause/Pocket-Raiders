// DOMINION slice D15: the controller for the Empire page (G from the HQ, the map, the Ledger or the Takeover page, or
// the wheel's board), its standing-orders sheet, and the Leaving page (L once the region is Taken). Every choice goes
// through GameSession.dominionStep (saved); the Long Trip's fight starts the battle at once and comes back here.

import { defaultOrders, holderPicks, policyOf, type Orders, type PolicyKey } from '../../core/dominion/regions';
import { empireModel, leaveModel } from '../../core/dominion/regionsScreens';
import { dominionBlock } from '../../core/dominion/session';
import { POLICY_KEYS, type DominionAction } from '../../core/dominion/schema';
import { DOMINION_DATA } from '../../core/dominion/data';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { empireView, leaveView } from '../../ui/redux/screens/dominion/regions';

type Screen = 'title' | 'setup' | 'opening' | 'hq' | 'map' | 'card' | 'crew' | 'reserve' | 'pyramid' | 'base' | 'rival' | 'ledger' | 'hero' | 'interrupt' | 'desk' | 'squads' | 'founding' | 'founded' | 'debate' | 'spy' | 'takeover' | 'broadcast' | 'assign' | 'district' | 'empire';
interface Host {
  screenName: Screen;
  setNotice(n: string | null): void;
  refresh(): void;
  takeoverStep(a: DominionAction): { ok: boolean; fight: boolean; notice: string | null };
  /** Starts the waiting battle; the scene comes back to `from`. */
  startFightFrom(from: Screen): void;
  bossLook(): string | null;
  /** After leaving: the new region's opening scene. */
  openOpening(): void;
}

export class EmpireController {
  private from: Screen = 'hq';
  private page: 'cards' | 'orders' | 'leave' = 'cards';
  private at = -1;
  private btn = 0;
  private notice: string | null = null;
  private orderFor: string | null = null;
  private orderAt = 0;
  private draft: Orders = defaultOrders();
  private lv = { holder: 0, orders: defaultOrders(), orderAt: 0, bring: 0, col: 0 as 0 | 1 | 2 };

  constructor(private readonly host: Host) {}

  private block() {
    return dominionBlock(services().session.run);
  }
  owns(): boolean {
    return this.host.screenName === 'empire';
  }

  /** G: the Empire page. `leave` opens the Leaving page straight away (the Takeover page's CTA once Taken). */
  open(from: Screen, leave = false): boolean {
    const b = this.block();
    if (!b?.opened) return false;
    this.from = from === 'card' ? 'map' : from === 'empire' ? 'hq' : from;
    this.host.screenName = 'empire';
    this.page = 'cards';
    this.at = -1;
    this.btn = 0;
    this.notice = null;
    this.host.setNotice(null);
    if (leave) this.openLeave();
    return true;
  }
  resume(notice: string | null): void {
    this.host.screenName = 'empire';
    this.page = 'cards';
    this.notice = notice;
  }

  private model() {
    const b = this.block()!;
    return empireModel(b, services().session.run, this.at, this.btn, this.page === 'orders' ? this.orderFor : null, this.orderAt, this.page === 'orders' ? this.draft : null);
  }

  render(notice: string | null): string {
    const b = this.block();
    if (!b) return '';
    const run = services().session.run!;
    if (this.page === 'leave') return leaveView(leaveModel(b, run, services().session.content, this.lv), this.notice ?? notice);
    return empireView(this.model(), this.host.bossLook(), this.notice ?? notice);
  }

  private step(a: DominionAction): void {
    const out = this.host.takeoverStep(a);
    this.notice = out.notice;
    if (out.ok && out.fight) return this.host.startFightFrom('empire');
    this.host.refresh();
  }

  private press(i: number, k: number): void {
    const m = this.model();
    const c = m.cards[i], b = c?.buttons[k];
    this.at = i;
    this.btn = k;
    if (!c || !b) return this.host.refresh();
    if (b.op === 'orders') {
      const h = this.block()?.realm?.held.find((x) => x.id === c.id);
      this.orderFor = c.id;
      this.draft = { ...(h?.orders as Orders | undefined ?? defaultOrders()) };
      this.orderAt = 0;
      this.page = 'orders';
      return this.host.refresh();
    }
    if (b.op === 'tribute') {
      const h = this.block()?.realm?.held.find((x) => x.id === c.id);
      const steps = DOMINION_DATA.regions.tribute.steps;
      const next = steps[(steps.indexOf(h?.tribute ?? steps[0]!) + 1) % steps.length]!;
      return this.step({ t: 'realm', op: 'tribute', region: c.id, tribute: next });
    }
    if (b.op === 'replace') {
      const h = this.block()?.realm?.held.find((x) => x.id === c.id);
      const pick = holderPicks(this.block()!).find((p) => p.kind !== 'self' && p.id !== 'usurped' && p.name !== h?.holder.name);
      if (!pick) {
        this.notice = 'Nobody here can hold a region: an Admin or higher.';
        return this.host.refresh();
      }
      return this.step({ t: 'realm', op: 'replace', region: c.id, member: pick.id });
    }
    this.step({ t: 'realm', op: b.op, region: c.id });
  }

  private cycleOrder(key: PolicyKey, dir: 1 | -1, o: Orders): void {
    const opts = DOMINION_DATA.regions.policies[key].options;
    const i = Math.max(0, opts.findIndex((x) => x.id === o[key]));
    o[key] = opts[(i + dir + opts.length) % opts.length]!.id;
  }

  private openLeave(): void {
    const b = this.block();
    if (!b) return;
    this.page = 'leave';
    this.lv = { holder: Math.min(1, holderPicks(b).length - 1), orders: defaultOrders(), orderAt: 0, bring: 0, col: 0 };
    this.host.refresh();
  }
  private sail(): void {
    const b = this.block();
    if (!b) return;
    const holder = holderPicks(b)[this.lv.holder];
    const others = b.members.filter((m) => m.id !== holder?.id);
    const bring = this.lv.bring > 0 ? others[this.lv.bring - 1]?.id ?? null : null;
    if (!holder) return;
    const out = this.host.takeoverStep({ t: 'leave', holder: holder.id, orders: { ...this.lv.orders }, bring });
    if (!out.ok) {
      this.notice = out.notice;
      return this.host.refresh();
    }
    this.page = 'cards';
    this.notice = null;
    this.host.openOpening();
  }

  acts(): Record<string, (arg: string) => void> {
    return {
      emCard: (i) => { this.at = Number(i); this.btn = 0; this.host.refresh(); },
      emBtn: (a) => { const [i, k] = a.split(':').map(Number); this.press(i!, k!); },
      emLeave: () => this.leaveKey(),
      emOrderRow: (k) => { this.orderAt = Math.max(0, POLICY_KEYS.indexOf(k as PolicyKey)); this.host.refresh(); },
      emOrderPrev: (k) => { this.cycleOrder(k as PolicyKey, -1, this.draft); this.host.refresh(); },
      emOrderNext: (k) => { this.cycleOrder(k as PolicyKey, 1, this.draft); this.host.refresh(); },
      emOrdersSave: () => this.saveOrders(),
      emOrdersClose: () => { this.page = 'cards'; this.host.refresh(); },
      empire: () => { if (this.open(this.host.screenName)) this.host.refresh(); },
      lvHolder: (i) => { this.lv.col = 0; this.lv.holder = Number(i); this.lv.bring = 0; this.host.refresh(); },
      lvOrder: (i) => { this.lv.col = 1; this.lv.orderAt = Number(i); this.cycleOrder(POLICY_KEYS[Number(i)]!, 1, this.lv.orders); this.host.refresh(); },
      lvBring: (i) => { this.lv.col = 2; this.lv.bring = Number(i); this.host.refresh(); },
      lvGo: () => this.sail(),
    };
  }

  private saveOrders(): void {
    if (!this.orderFor) return;
    this.page = 'cards';
    this.step({ t: 'realm', op: 'orders', region: this.orderFor, orders: { ...this.draft } });
  }
  private leaveKey(): void {
    const b = this.block();
    if (!b) return;
    const m = this.model();
    if (!m.leave.ok) {
      this.notice = m.leave.why;
      return this.host.refresh();
    }
    this.openLeave();
  }

  /** Arrows, Enter and Esc. Returns true when handled. */
  key(a: InputAction): boolean {
    if (!this.owns()) return false;
    if (this.notice && (a === 'confirm' || a === 'back')) {
      this.notice = null;
      return true;
    }
    const b = this.block();
    if (!b) return true;
    if (this.page === 'orders') {
      const k = POLICY_KEYS[this.orderAt]!;
      if (a === 'up' || a === 'down') this.orderAt = (this.orderAt + (a === 'up' ? 3 : 1)) % 4;
      else if (a === 'left' || a === 'right') this.cycleOrder(k, a === 'left' ? -1 : 1, this.draft);
      else if (a === 'confirm') this.saveOrders();
      else if (a === 'back') this.page = 'cards';
      return true;
    }
    if (this.page === 'leave') {
      const lv = this.lv;
      if (a === 'left' || a === 'right') lv.col = ((lv.col + (a === 'left' ? 2 : 1)) % 3) as 0 | 1 | 2;
      else if (a === 'up' || a === 'down') {
        const d = a === 'up' ? -1 : 1;
        if (lv.col === 0) { const n = holderPicks(b).length; lv.holder = (lv.holder + d + n) % n; lv.bring = 0; }
        else if (lv.col === 1) lv.orderAt = (lv.orderAt + d + 4) % 4;
        else { const n = b.members.filter((m) => m.id !== holderPicks(b)[lv.holder]?.id).length + 1; lv.bring = (lv.bring + d + n) % n; }
      } else if (a === 'confirm') {
        if (lv.col === 1) this.cycleOrder(POLICY_KEYS[lv.orderAt]!, 1, lv.orders);
        else lv.col = ((lv.col + 1) % 3) as 0 | 1 | 2;
      } else if (a === 'back') this.page = 'cards';
      return true;
    }
    const m = this.model();
    const n = Math.min(3, m.cards.length);
    const cur = m.at;
    if (a === 'left' || a === 'right') { this.at = (cur + (a === 'left' ? n - 1 : 1)) % n; this.btn = 0; }
    else if (a === 'up' || a === 'down') {
      const nb = m.cards[cur]?.buttons.length ?? 0;
      if (nb) this.btn = (m.buttonAt + (a === 'up' ? nb - 1 : 1)) % nb;
    } else if (a === 'confirm') {
      if (m.cards[cur]?.buttons.length) this.press(cur, m.buttonAt);
      else if (m.leave.ok) this.openLeave();
    } else if (a === 'back') this.close();
    return true;
  }

  /** Letter keys: G closes, L opens the Leaving page (and sails from it). */
  raw(code: string): boolean {
    if (!this.owns()) return false;
    if (code === 'KeyG') {
      if (this.page === 'cards') this.close();
      else this.page = 'cards';
    } else if (code === 'KeyL') {
      if (this.page === 'leave') return this.sail(), true;
      this.leaveKey();
      return true;
    } else return true;
    this.host.refresh();
    return true;
  }

  close(): void {
    this.host.screenName = this.from;
    this.page = 'cards';
    this.notice = null;
  }
  dismiss(): void {
    this.notice = null;
  }
  /** A pick on the standing-orders sheet reads as its name (for tests and the Ledger). */
  static orderName(key: PolicyKey, id: string): string {
    return policyOf(key, id)?.name ?? id;
  }
}

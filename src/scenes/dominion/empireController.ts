// DOMINION slice D15: the controller for the Empire page (G from the HQ, the map, the Ledger or the Takeover page, or
// the wheel's board), its standing-orders sheet, and the Leaving page (L once the region is Taken). Every choice goes
// through GameSession.dominionStep (saved); the Long Trip's fight starts the battle at once and comes back here.

import { defaultOrders, holderPicks, policyOf, type Orders, type PolicyKey } from '../../core/dominion/regions';
import { gymCaseModel, underworldModel } from '../../core/dominion/r8Pages';
import { empireModel, leaveModel } from '../../core/dominion/regionsScreens';
import { dominionBlock } from '../../core/dominion/session';
import { POLICY_KEYS, type DominionAction } from '../../core/dominion/schema';
import { DOMINION_DATA } from '../../core/dominion/data';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import type { R5Pics } from '../../ui/redux/screens/dominion/r50/chairR8';
import type { R5Run } from '../../ui/redux/screens/dominion/r50/kit';
import { r5GymCase, r5Holder, r5Magnet, r5Orders, r5Realm, r5Regions, r5Sail, r5Underworld, r5World, regionCards } from '../../ui/redux/screens/dominion/r50/empireR8';
import { chairVoice } from './r8Bridge';

/** Redesign R8: the Empire's pages. `cards` is the mockup's `regions` grid; `realm` a held region's own page. */
type Page = 'cards' | 'realm' | 'orders' | 'world' | 'holder' | 'sail' | 'underworld' | 'gymcase' | 'magnet';

type Screen = 'title' | 'setup' | 'opening' | 'hq' | 'map' | 'card' | 'crew' | 'reserve' | 'pyramid' | 'base' | 'rival' | 'ledger' | 'hero' | 'interrupt' | 'desk' | 'squads' | 'founding' | 'founded' | 'debate' | 'spy' | 'takeover' | 'broadcast' | 'assign' | 'district' | 'empire' | 'partners';
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
  /** Redesign R8: the pass-50 chrome's run data, how people are drawn, and the Boss's picture at a height. */
  r8(): { run: R5Run; pics: R5Pics } | null;
  r8Boss(h: number): string;
  /** Redesign R8: the Gym case's "Plan" opens that Gym's district on the map. */
  planDistrict(id: string): void;
  /** The day's harbour (where the boat leaves from). */
  harbour(): string;
}

export class EmpireController {
  private from: Screen = 'hq';
  private page: Page = 'cards';
  /** Where `orders` goes back to. */
  private ordersFrom: Page = 'realm';
  /** The World's, the Underworld's and the Gym case's cursors. */
  private wAt = 0;
  /** A Holder was tapped since the page opened (a second tap on them goes on to Sail). */
  private tapped = false;
  private uAt = 0;
  private gAt = 0;
  /** The held region the Magnet Train page rides to. */
  private magnetFor: string | null = null;
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
    const r = this.host.r8();
    if (!b || !r) return '';
    const run = services().session.run!;
    const { run: rr, pics } = r;
    const n = this.notice ?? notice;
    const who = chairVoice(b);
    if (this.page === 'holder' || this.page === 'sail') {
      const lm = leaveModel(b, run, services().session.content, this.lv);
      if (this.page === 'holder') return r5Holder(lm, { pics, boss: this.host.r8Boss(64), notice: n }, rr);
      return r5Sail(lm, { pics, boss: this.host.r8Boss(64), who, harbour: this.host.harbour(), day: b.day, notice: n }, rr);
    }
    if (this.page === 'underworld') {
      const m = underworldModel(b);
      const t = m.teams[this.uAt];
      return r5Underworld(m, { at: this.uAt, who, line: t ? `“${t.name}. ${t.where}. ${t.line}.”` : '“Nobody down here yet.”' }, rr);
    }
    if (this.page === 'gymcase') return r5GymCase(gymCaseModel(b), { at: this.gAt, who }, rr);
    if (this.page === 'magnet' && this.magnetFor) {
      const M = DOMINION_DATA.regions.magnet, here = b.realm?.at ?? 'kanto', to = this.magnetFor;
      const people = [...b.members.slice(0, M.seats).map((x) => pics.body(x.look, 70)), this.host.r8Boss(70)];
      return r5Magnet({ from: M.stations[here] ?? here, to: M.stations[to] ?? to, toRegion: DOMINION_DATA.regions.regions[to]?.name ?? to, region: to, team: b.teamName ?? 'Your crew',
        seats: Math.min(M.seats, b.members.length), leaves: M.leaves, arrives: M.arrives, fare: M.fare, people, line: M.lines.conductor, notice: n, can: true }, rr);
    }
    const m = this.model();
    if (this.page === 'orders' && m.orders) {
      const o = { region: m.orders.region, rows: m.orders.rows.map((x) => { const pick = x.options[x.at]; return { key: x.key, name: x.name, pick: pick?.name ?? '', text: pick ? policyOf(x.key as PolicyKey, pick.id)?.line ?? '' : '', on: x.on }; }) };
      return r5Orders(o, { prev: 'emOrderPrev', next: 'emOrderNext', save: 'emOrdersSave', back: 'emOrdersClose' }, rr);
    }
    if (this.page === 'world') return r5World(m, { order: DOMINION_DATA.regions.order, at: this.wAt, who, notice: n }, rr);
    const c = m.cards[m.at];
    if (this.page === 'realm' && c) {
      const holder = c.who?.look ? pics.body(c.who.look, 110) : this.host.r8Boss(110);
      return r5Realm(c, { at: m.buttonAt, i: m.at, holder, notice: n }, rr);
    }
    return r5Regions(m, { more: DOMINION_DATA.regions.order, notice: n }, rr);
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
      this.ordersFrom = this.page === 'orders' ? 'realm' : this.page;
      this.page = 'orders';
      return this.host.refresh();
    }
    if (b.op === 'magnet') {
      this.magnetFor = c.id;
      this.page = 'magnet';
      this.notice = null;
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
    this.page = 'holder';
    this.tapped = false;
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

  /** A region card: a first tap picks it, a second opens it (a held region's page, else the World at it). */
  private card(i: number): void {
    const m = this.model();
    const again = this.at === i;
    this.at = i;
    this.btn = 0;
    if (again) {
      const c = m.cards[i];
      if (c?.state === 'held') this.page = 'realm';
      else if (c) { this.page = 'world'; this.wAt = i; }
    }
    this.host.refresh();
  }
  private island(i: number): void {
    const m = this.model();
    const again = this.wAt === i;
    this.wAt = i;
    if (again && m.cards[i]?.state === 'held') { this.at = i; this.btn = 0; this.page = 'realm'; }
    this.host.refresh();
  }
  private goPage(p: Page): void {
    this.page = p;
    this.notice = null;
    if (p === 'underworld') this.uAt = Math.max(0, underworldModel(this.block()!).teams.findIndex((t) => t.here));
    if (p === 'gymcase') this.gAt = Math.max(0, gymCaseModel(this.block()!).gyms.findIndex((g) => g.who === 'next'));
    this.host.refresh();
  }
  private planGym(i: number): void {
    const g = gymCaseModel(this.block()!).gyms[i];
    if (!g) return;
    this.host.screenName = this.from === 'empire' ? 'hq' : this.from;
    this.page = 'cards';
    this.host.planDistrict(g.district);
  }

  acts(): Record<string, (arg: string) => void> {
    return {
      emCard: (i) => this.card(Number(i)),
      emBtn: (a) => { const [i, k] = a.split(':').map(Number); this.press(i!, k!); },
      emLeave: () => this.leaveKey(),
      emOrderRow: (k) => { this.orderAt = Math.max(0, POLICY_KEYS.indexOf(k as PolicyKey)); this.host.refresh(); },
      emOrderPrev: (k) => { this.orderAt = Math.max(0, POLICY_KEYS.indexOf(k as PolicyKey)); this.cycleOrder(k as PolicyKey, -1, this.draft); this.host.refresh(); },
      emOrderNext: (k) => { this.orderAt = Math.max(0, POLICY_KEYS.indexOf(k as PolicyKey)); this.cycleOrder(k as PolicyKey, 1, this.draft); this.host.refresh(); },
      emOrdersSave: () => this.saveOrders(),
      emOrdersClose: () => { this.page = this.ordersFrom; this.host.refresh(); },
      empire: () => { if (this.open(this.host.screenName)) this.host.refresh(); },
      lvHolder: (i) => { const again = this.tapped && this.lv.holder === Number(i); this.tapped = true; this.lv.col = 0; this.lv.holder = Number(i); this.lv.bring = 0; if (again) this.page = 'sail'; this.host.refresh(); },
      lvOrder: (i) => { this.lv.col = 1; this.lv.orderAt = Number(i); this.cycleOrder(POLICY_KEYS[Number(i)]!, 1, this.lv.orders); this.host.refresh(); },
      lvBring: (i) => { this.lv.col = 2; this.lv.bring = Number(i); this.host.refresh(); },
      r8OrderRow: () => { this.lv.orderAt = (this.lv.orderAt + 1) % POLICY_KEYS.length; this.host.refresh(); },
      lvGo: () => (this.page === 'holder' ? ((this.page = 'sail'), this.host.refresh()) : this.sail()),
      r8Holder: () => { this.page = 'holder'; this.host.refresh(); },
      r8Island: (i) => this.island(Number(i)),
      r8Regions: () => this.goPage('cards'),
      r8World: () => { this.wAt = Math.max(0, this.model().at); this.goPage('world'); },
      r8Under: () => this.goPage('underworld'),
      r8Gyms: () => this.goPage('gymcase'),
      r8Team: (i) => { this.uAt = Number(i); this.host.refresh(); },
      r8Gym: (i) => { const again = this.gAt === Number(i); this.gAt = Number(i); if (again) this.planGym(this.gAt); else this.host.refresh(); },
      r8GymPlan: (i) => this.planGym(Number(i)),
      r8MagnetGo: () => this.ride(),
      r8MagnetBack: () => { this.page = 'realm'; this.notice = null; this.host.refresh(); },
    };
  }

  /** Redesign R8: open the Empire straight on one of its pages (the chrome's links to the mockup ids). */
  openAt(from: Screen, p: Page): boolean {
    if (!this.open(from)) return false;
    if (p === 'holder') this.leaveKey();
    else if (p !== 'cards') this.goPage(p);
    if (p === 'world') this.wAt = Math.max(0, this.model().at);
    return true;
  }

  /** The Magnet Train: ride to the held region (a short visit by rail); back on its page with the result. */
  private ride(): void {
    if (!this.magnetFor) return;
    const out = this.host.takeoverStep({ t: 'realm', op: 'magnet', region: this.magnetFor });
    this.notice = out.notice;
    if (out.ok) this.page = 'realm';
    this.host.refresh();
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
      else if (a === 'back') this.page = this.ordersFrom;
      return true;
    }
    if (this.page === 'holder') {
      const n = holderPicks(b).length;
      if ((a === 'left' || a === 'right' || a === 'up' || a === 'down') && n) { this.lv.holder = (this.lv.holder + (a === 'left' || a === 'up' ? n - 1 : 1)) % n; this.lv.bring = 0; }
      else if (a === 'confirm') this.page = 'sail';
      else if (a === 'back') this.page = 'cards';
      return true;
    }
    if (this.page === 'sail') {
      const lv = this.lv;
      if (a === 'up' || a === 'down') {
        const n = b.members.filter((m) => m.id !== holderPicks(b)[lv.holder]?.id).length + 1;
        lv.bring = (lv.bring + (a === 'up' ? n - 1 : 1)) % n;
      } else if (a === 'left' || a === 'right') this.cycleOrder(POLICY_KEYS[lv.orderAt]!, a === 'left' ? -1 : 1, lv.orders);
      else if (a === 'confirm') this.sail();
      else if (a === 'back') this.page = 'holder';
      return true;
    }
    if (this.page === 'magnet') {
      if (a === 'confirm') this.ride();
      else if (a === 'back') this.page = 'realm';
      return true;
    }
    if (this.page === 'underworld' || this.page === 'gymcase') {
      const n = this.page === 'underworld' ? underworldModel(b).teams.length : gymCaseModel(b).gyms.length;
      const d = a === 'left' || a === 'up' ? n - 1 : 1;
      if ((a === 'left' || a === 'right' || a === 'up' || a === 'down') && n) {
        if (this.page === 'underworld') this.uAt = (this.uAt + d) % n;
        else this.gAt = (this.gAt + d) % n;
      } else if (a === 'confirm' && this.page === 'gymcase') this.planGym(this.gAt);
      else if (a === 'back') this.page = 'cards';
      return true;
    }
    const m = this.model();
    if (this.page === 'world') {
      const n = Math.min(4, regionCards(m, DOMINION_DATA.regions.order).length);
      if ((a === 'left' || a === 'right' || a === 'up' || a === 'down') && n) this.wAt = (this.wAt + (a === 'left' || a === 'up' ? n - 1 : 1)) % n;
      else if (a === 'confirm' && m.cards[this.wAt]?.state === 'held') { this.at = this.wAt; this.btn = 0; this.page = 'realm'; }
      else if (a === 'back') this.page = 'cards';
      return true;
    }
    const cur = m.at;
    if (this.page === 'realm') {
      const nb = m.cards[cur]?.buttons.length ?? 0;
      if ((a === 'up' || a === 'down') && nb) this.btn = (m.buttonAt + (a === 'up' ? nb - 1 : 1)) % nb;
      else if (a === 'confirm' && nb) this.press(cur, m.buttonAt);
      else if (a === 'back') this.page = 'cards';
      return true;
    }
    const n = m.cards.length;
    if ((a === 'left' || a === 'right') && n) { this.at = (cur + (a === 'left' ? n - 1 : 1)) % n; this.btn = 0; }
    else if (a === 'confirm') {
      const c = m.cards[cur];
      if (c?.state === 'held') this.page = 'realm';
      else if (c) { this.wAt = cur; this.page = 'world'; }
    } else if (a === 'back') this.close();
    return true;
  }

  /** Letter keys: G closes, L opens the Leaving page (and sails from it), W the World, U the Underworld, Y the Gym case. */
  raw(code: string): boolean {
    if (!this.owns()) return false;
    if (code === 'KeyG') {
      if (this.page === 'cards') this.close();
      else this.page = 'cards';
    } else if (code === 'KeyL') {
      if (this.page === 'sail') return this.sail(), true;
      if (this.page === 'holder') { this.page = 'sail'; this.host.refresh(); return true; }
      this.leaveKey();
      return true;
    } else if (code === 'KeyW' && this.page === 'cards') { this.wAt = Math.max(0, this.model().at); this.goPage('world'); return true; }
    else if (code === 'KeyU' && this.page === 'cards') return this.goPage('underworld'), true;
    else if (code === 'KeyY' && this.page === 'cards') return this.goPage('gymcase'), true;
    else if (code === 'KeyO' && this.page === 'sail') this.lv.orderAt = (this.lv.orderAt + 1) % POLICY_KEYS.length;
    else return true;
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

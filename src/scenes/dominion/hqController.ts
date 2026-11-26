// DOMINION redesign R2 (HQ, pass 50): the controller for the HQ's own pages (mockups floor, floorg, floorb, plot, build,
// staff, auto, staffgear, newfloor, launder, glance, mark, rest, goldenrod). It replaces the D5 HQ menu: B (or a tap on
// the building) opens the floor you're on. It keeps the cursors and which page is up; every change goes through
// GameSession.dominionStep (saved). Pages are drawn by ui/redux/screens/dominion/r50/hqPages.ts.

import { bossMenuModel } from '../../core/dominion/bossMenu';
import { DOMINION_DATA } from '../../core/dominion/data';
import { deskOpen } from '../../core/dominion/desk';
import {
  buildModel, floorModel, FLOOR_ORDER, gearModel, launderModel, money, newFloorModel, plotModel, postCards, postModel, restModel,
  staffFloor, WASH_OPTS, type TileOp,
} from '../../core/dominion/floorScreens';
import { floorDef, floorDue, floorsOpen, freeOn, plotPrice } from '../../core/dominion/floors';
import { teamColours } from '../../core/dominion/founding';
import { hqName, loanMax } from '../../core/dominion/hq';
import { dirtyOf, hqOf } from '../../core/dominion/hqFx';
import { regionName } from '../../core/dominion/regions';
import { hqModel } from '../../core/dominion/screens';
import { dominionBlock } from '../../core/dominion/session';
import { STAFF_ROLES, type DominionAction, type DominionBlock, type StaffRole } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import type { R5Run } from '../../ui/redux/screens/dominion/r50/kit';
import {
  r5Arrive, r5Build, r5Gear, r5Glance, r5Launder, r5Mark, r5NewFloor, r5Plot, r5Post, r5Rest, r5Staff, r5Floor,
  type GlanceNeed, type GlanceTile, type MarkModel,
} from '../../ui/redux/screens/dominion/r50/hqPages';
import { memberFig, r5Pics, r5Voice, sleeperFigs } from './hqPagesBridge';

export type HqPage = 'floor' | 'plot' | 'build' | 'staff' | 'post' | 'gear' | 'newfloor' | 'launder' | 'glance' | 'mark' | 'rest' | 'arrive';

type Screen = 'title' | 'setup' | 'opening' | 'hq' | 'map' | 'card' | 'crew' | 'reserve' | 'pyramid' | 'base' | 'rival' | 'ledger' | 'hero' | 'interrupt' | 'desk' | 'squads' | 'founding' | 'founded' | 'debate' | 'spy' | 'takeover' | 'broadcast' | 'assign' | 'district' | 'empire' | 'partners';
interface Host {
  screenName: Screen;
  setNotice(n: string | null): void;
  refresh(): void;
  step(a: DominionAction): boolean;
  /** Opens the Crew File, with the hire list when `hire`. */
  openCrew(hire: boolean): void;
  /** The pass-50 chrome's live data. */
  r5run(): R5Run | null;
  /** A chrome link (a mockup page id) for a page the HQ doesn't own. */
  r5go(id: string): void;
}

const LOGO_GLYPH: Record<string, string> = { shield: '⛉', diamond: '◆', ring: '◯', fang: '▼', star: '✦', eye: '◉' };
/** HQ page ids the chrome links to (mockup ids), and the page each opens. */
export const HQ_PAGE_IDS: Record<string, HqPage> = {
  floor: 'floor', floorg: 'floor', floorb: 'floor', plot: 'plot', build: 'build', staff: 'staff', auto: 'post', staffgear: 'gear',
  newfloor: 'newfloor', launder: 'launder', glance: 'glance', mark: 'mark', rest: 'rest', goldenrod: 'arrive', arrive: 'arrive', base: 'floor',
};

export class HqController {
  private page: HqPage = 'floor';
  private trail: HqPage[] = [];
  private floor = 1;
  private tileAt = 0;
  private plotAt = 0;
  private buildAt = 0;
  private buildFloor = 1;
  private staffAt = 0;
  private role: StaffRole = 'checker';
  private factAt = 0;
  private gearAt = 0;
  private washAt = 0;
  private glanceAt = 0;
  private notice: string | null = null;
  /** Regions whose "starting over" page was shown this session (presentation only). */
  private arrived = new Set<string>();

  constructor(private readonly host: Host) {}

  private block(): DominionBlock | null {
    return dominionBlock(services().session.run) ?? null;
  }
  private active(): boolean {
    return this.host.screenName === 'base';
  }
  /** Which page is up (tests and the scene's log key). */
  get current(): HqPage {
    return this.page;
  }

  /** Opens the HQ pages: the floor you're on (B on the HQ, or a tap on the building), or one page by name. */
  open(p: HqPage = 'floor', arg: number | null = null): void {
    const b = this.block();
    this.host.screenName = 'base';
    this.trail = [];
    this.notice = null;
    this.host.setNotice(null);
    if (b && arg !== null && p === 'floor') this.floor = Math.max(1, Math.min(floorsOpen(b), arg));
    if (b && p === 'floor' && arg === null) this.floor = Math.min(this.floor, floorsOpen(b));
    if (p === 'floor') this.tileAt = 0;
    this.page = p;
  }

  /** Opens a mockup page id the HQ owns (r5go). Returns false when the id isn't the HQ's. */
  openId(id: string): boolean {
    const fl = /^floor-([1-6])$/.exec(id);
    if (fl && this.block()) return this.open('floor', Number(fl[1])), true;
    const p = HQ_PAGE_IDS[id];
    if (!p) return false;
    const b = this.block();
    if (!b) return false;
    if (p === 'newfloor' && floorDue(b) === null) return false;
    if (p === 'arrive' && !(b.realm?.held.length)) return false;
    this.open(p, id === 'floorg' ? 1 : id === 'floorb' ? 2 : id === 'floor' ? (floorsOpen(b) >= 3 ? 3 : 1) : null);
    if (p === 'build') this.buildFloor = this.floor;
    return true;
  }

  /** The New floor page waits after an upgrade opens a floor; the starting-over page in a new region. */
  due(b: DominionBlock): HqPage | null {
    if (floorDue(b) !== null) return 'newfloor';
    const at = b.realm?.at;
    if (at && b.realm!.held.length && b.day === 1 && b.phase === 'evening' && !this.arrived.has(at)) return 'arrive';
    return null;
  }

  private go(p: HqPage): void {
    if (this.page !== p) this.trail.push(this.page);
    this.page = p;
    this.say(null);
  }
  private back(): void {
    const p = this.trail.pop();
    this.say(null);
    if (p) this.page = p;
    else {
      this.host.screenName = 'hq';
      this.page = 'floor';
    }
  }
  private say(n: string | null): void {
    this.notice = n;
    this.host.setNotice(null);
  }
  private step(a: DominionAction): boolean {
    this.host.setNotice(null);
    this.notice = null;
    return this.host.step(a);
  }

  // ---------- drawing ----------

  render(notice: string | null): string {
    const b = this.block();
    const run = this.host.r5run();
    if (!b || !run) return '';
    const n = notice ?? this.notice;
    const pics = r5Pics(b);
    switch (this.page) {
      case 'floor': {
        const m = floorModel(b, this.floor, this.tileAt);
        this.tileAt = m.at;
        const t = m.tiles[m.at]!;
        const holder = t.kind === 'staff' ? m.staff.checker : null;
        const v = r5Voice(b, holder);
        return r5Floor(m, run, pics, { voice: v, line: floorLine(b, m.f), notice: n });
      }
      case 'plot': return r5Plot(plotModel(b, this.plotAt), run, { notice: n });
      case 'build': return r5Build(buildModel(b, this.buildFloor, this.buildAt), run, { notice: n });
      case 'staff': return r5Staff(postCards(b), this.staffAt, run, pics, { notice: n, floor: floorDef(staffFloor(b)).name });
      case 'post': return r5Post(postModel(b, this.role, this.factAt), run, pics, { notice: n });
      case 'gear': {
        const cols = gearModel(b);
        return r5Gear(cols, this.gearAt, run, pics, { notice: n, voice: r5Voice(b, cols[this.gearAt]?.holder?.id ?? null), floor: floorDef(staffFloor(b)).tag });
      }
      case 'newfloor': {
        const m = newFloorModel(b);
        if (!m) return (this.page = 'floor'), this.render(notice);
        const byId = (id: string, h: number): string => {
          const i = (b.hq?.rooms ?? []).findIndex((r) => r.id === id);
          const mem = b.members.length ? b.members[Math.max(0, i) % b.members.length]! : null;
          return mem ? memberFig(mem, b, h, '') : '';
        };
        return r5NewFloor(m, run, { room: byId }, { voice: r5Voice(b) });
      }
      case 'launder': {
        const m = launderModel(b, this.washAt);
        const fr = m.front ? `${m.front}` : 'No Front yet';
        return r5Launder(m, run, { notice: n, voice: r5Voice(b, b.hq?.staff?.books.member ?? null), sub: fr });
      }
      case 'glance': return this.glance(b, run);
      case 'mark': return r5Mark(markModel(b), run, { voice: r5Voice(b) });
      case 'rest': return r5Rest(restModel(b, { side: run.side ?? 'Your crew', war: run.war, foe: run.foe }), run, sleeperFigs(b), { voice: r5Voice(b) });
      case 'arrive': return r5Arrive(arriveModel(b), run, { voice: r5Voice(b), skin: b.realm?.at === 'johto' ? 'johto' : 'kanto' });
    }
  }

  private glance(b: DominionBlock, run: R5Run): string {
    const g = bossMenuModel(b, 0, { card: null, slot: 1 }).glance;
    const m = hqModel(b);
    const [used, max] = run.orders;
    const tiles: GlanceTile[] = [
      { icon: 'i-coin_case', label: 'Funds', value: run.funds, line: `${money(dirtyOf(b))} dirty · money stays in this region`, pct: run.cleanPct },
      { icon: 'bd-fire', label: 'Heat', value: `${b.heat}%`, line: 'Police walk the districts you hit', pct: b.heat },
      { icon: 'g-town-map', label: 'Day', value: g.when, line: `${used} of ${max} orders used today`, pct: max ? Math.round((100 * used) / max) : 0 },
      { icon: 'g-relic-crown', label: 'Goal', value: `${g.goal.replace(/^Goal · /, '')} ${g.goalPct}%`, line: m.top.team, pct: g.goalPct },
    ];
    const needs: GlanceNeed[] = [];
    if (g.alert) needs.push({ title: g.alert.tag, line: g.alert.text, tone: 'bad', go: 'rival' });
    if (b.crew?.talks.length) needs.push({ title: `${b.crew.talks.length} crew want a word`, line: 'Answer them on the HQ', tone: '', go: 'hq' });
    if (deskOpen(b) && b.desk?.queue.length) needs.push({ title: `${b.desk.queue.length} waiting at the desk`, line: 'Applications', tone: '', go: 'apps' });
    if (floorDue(b) !== null) needs.push({ title: 'A new floor is open', line: floorDef(floorDue(b)!).name, tone: 'gold', go: 'newfloor' });
    if (g.hero) needs.push({ title: `The Hero · ${g.hero.name}`, line: `Threat ${g.hero.threat}`, tone: 'bad', go: 'herotrack' });
    const free = Array.from({ length: floorsOpen(b) }, (_, i) => freeOn(b, i + 1)).reduce((a, x) => a + x, 0);
    if (free) needs.push({ title: `${free} free plot${free === 1 ? '' : 's'}`, line: 'Build a room on them', tone: '', go: 'floor' });
    if (hqOf(b).loan) needs.push({ title: `${money(hqOf(b).loan!.owed)} owed to a Fence`, line: `Up to ${money(loanMax(b))}`, tone: 'bad', go: 'launder' });
    this.glanceAt = Math.max(0, Math.min(this.glanceAt, needs.length - 1));
    return r5Glance(tiles, needs.slice(0, 4), this.glanceAt, run);
  }

  // ---------- doing ----------

  private tileDo(op: TileOp, arg: string): void {
    switch (op) {
      case 'tierUp': this.step({ t: 'tierUp', room: arg }); return;
      case 'sell': this.step({ t: 'sell', room: arg }); return;
      case 'rebuild': this.step({ t: 'rebuild', room: arg }); return;
      case 'build':
        this.buildFloor = Number(arg) || this.floor;
        this.buildAt = 0;
        return this.go('build'), this.host.refresh();
      case 'plot': {
        const b = this.block();
        this.plotAt = b ? Math.max(0, Number(arg) - 1) : 0;
        return this.go('plot'), this.host.refresh();
      }
      case 'staff': return this.go('staff'), this.host.refresh();
      case 'gear': return this.go('gear'), this.host.refresh();
      case 'launder': return this.go('launder'), this.host.refresh();
    }
  }

  /** The picked tile's main button (its last). */
  private tileMain(): void {
    const b = this.block();
    if (!b) return;
    const t = floorModel(b, this.floor, this.tileAt).tiles[this.tileAt];
    const c = t?.ctas[t.ctas.length - 1];
    if (c) this.tileDo(c[1], c[2]);
  }

  private floorStep(d: number): void {
    const b = this.block();
    if (!b) return;
    const order = FLOOR_ORDER.filter((f) => f <= floorsOpen(b));
    const i = Math.max(0, order.indexOf(this.floor as (typeof FLOOR_ORDER)[number]));
    this.floor = order[(i + d + order.length) % order.length]!;
    this.tileAt = 0;
    this.say(null);
  }
  private floorNext(): void {
    const b = this.block();
    if (!b) return;
    this.floor = (this.floor % floorsOpen(b)) + 1;
    this.tileAt = 0;
    this.say(null);
  }

  private buyPlot(f: number): void {
    if (this.step({ t: 'buyPlot', floor: f })) {
      this.buildFloor = f;
      this.floor = f;
      this.buildAt = 0;
      const n = this.notice;
      this.go('build');
      this.notice = n;
    }
  }

  private buildPicked(i: number): void {
    const b = this.block();
    if (!b) return;
    const m = buildModel(b, this.buildFloor, i);
    const c = m.cells[m.at];
    if (!c) return;
    if (c.outside) {
      this.step({ t: 'build', building: c.id, district: null });
      return;
    }
    if (this.step({ t: 'build', building: c.id, district: null, floor: m.floor })) {
      this.floor = m.floor;
      this.page = 'floor';
      this.trail = [];
      this.tileAt = 1;
    }
  }

  private fact(i: number, d: number): void {
    const b = this.block();
    if (!b) return;
    const m = postModel(b, this.role, i);
    const f = m.facts[m.factAt];
    if (!f) return;
    if (f.key === 'member') {
      const ids = [null, ...b.members.map((x) => x.id)];
      const cur = ids.indexOf(m.holder?.id ?? null);
      this.step({ t: 'staffPost', role: this.role, member: ids[(cur + d + ids.length) % ids.length] ?? null });
    } else this.step({ t: 'staffSet', key: f.key, role: f.key === 'on' ? this.role : undefined, d });
  }

  private wash(): void {
    const b = this.block();
    if (!b) return;
    const m = launderModel(b, this.washAt);
    const by: Record<(typeof WASH_OPTS)[number], DominionAction> = {
      w500: { t: 'launder', amount: m.amount }, w2000: { t: 'launder', amount: m.amount }, wall: { t: 'launder', amount: m.amount },
      borrow: { t: 'loan', amount: m.amount }, borrowMax: { t: 'loan', amount: m.amount }, repay: { t: 'repay', amount: m.amount }, repayAll: { t: 'repay', amount: m.amount },
    };
    this.step(by[m.opt]);
  }

  /** Tap targets (data-act). */
  acts(): Record<string, (arg: string) => void> {
    const r = (): void => this.host.refresh();
    return {
      tile: (i) => {
        const again = this.tileAt === Number(i);
        this.tileAt = Number(i);
        if (again) this.tileMain();
        else this.say(null);
        r();
      },
      tileDo: (x) => {
        const [op, arg] = x.split(':') as [TileOp, string];
        this.tileDo(op, arg ?? '');
        r();
      },
      floorTo: (f) => { this.floor = Number(f); this.tileAt = 0; this.say(null); r(); },
      floorStep: (d) => { this.floorStep(Number(d)); r(); },
      floorNext: () => { this.floorNext(); r(); },
      upgrade: () => { this.step({ t: 'upgrade' }); r(); },
      plotRow: (i) => {
        const again = this.plotAt === Number(i);
        this.plotAt = Number(i);
        const b = this.block();
        if (again && b) this.buyPlot(plotModel(b, this.plotAt).det.f);
        r();
      },
      buyPlot: (f) => { this.buyPlot(Number(f)); r(); },
      buildCell: (i) => {
        const again = this.buildAt === Number(i);
        this.buildAt = Number(i);
        if (again) this.buildPicked(this.buildAt);
        r();
      },
      staffCell: (i) => { this.staffAt = Number(i); this.role = STAFF_ROLES[this.staffAt]!; this.factAt = 0; this.go('post'); r(); },
      staffOpen: () => { this.back(); r(); },
      staffBuy: (role) => { this.step({ t: 'staffGear', role: (STAFF_ROLES as readonly string[]).includes(role) ? (role as StaffRole) : this.role }); r(); },
      factRow: (i) => { this.factAt = Number(i); r(); },
      factChange: (i) => { this.factAt = Number(i); this.fact(this.factAt, 1); r(); },
      gearCol: (i) => { this.gearAt = Number(i); r(); },
      floorSee: () => {
        const b = this.block();
        const f = b ? floorDue(b) : null;
        this.step({ t: 'floorSeen' });
        if (f) this.floor = f;
        this.page = 'floor';
        this.trail = [];
        this.tileAt = 0;
        this.host.screenName = 'base';
        r();
      },
      floorLater: () => { this.step({ t: 'floorSeen' }); this.page = 'floor'; this.host.screenName = 'hq'; r(); },
      washDo: () => { this.wash(); r(); },
      restSleep: () => { this.page = 'floor'; this.host.screenName = 'hq'; this.trail = []; this.host.step({ t: 'rest' }); },
      hqBack: () => {
        if (this.page === 'arrive') {
          const at = this.block()?.realm?.at;
          if (at) this.arrived.add(at);
        }
        this.back();
        r();
      },
      dismissHq: () => { this.say(null); r(); },
    };
  }
  overs(): Record<string, (arg: string) => void> {
    return {
      tileOver: (i) => { if (this.tileAt !== Number(i)) { this.tileAt = Number(i); this.host.refresh(); } },
      plotOver: (i) => { if (this.plotAt !== Number(i)) { this.plotAt = Number(i); this.host.refresh(); } },
      buildOver: (i) => { if (this.buildAt !== Number(i)) { this.buildAt = Number(i); this.host.refresh(); } },
      staffOver: (i) => { if (this.staffAt !== Number(i)) { this.staffAt = Number(i); this.host.refresh(); } },
    };
  }

  /** Letter keys on the HQ pages. Returns true when handled. */
  raw(code: string): boolean {
    if (!this.active()) return false;
    const b = this.block();
    if (!b) return false;
    const r = (): true => (this.host.refresh(), true);
    // A letter jumps from any HQ page: Esc then goes back to the floor, and from there to the HQ.
    if (['KeyP', 'KeyK', 'KeyB', 'KeyL'].includes(code)) {
      this.trail = [];
      this.page = 'floor';
    }
    switch (code) {
      case 'KeyF': if (this.page === 'floor') this.floorNext(); else { this.page = 'floor'; this.trail = []; } return r();
      case 'KeyP': this.plotAt = this.floor - 1; this.go('plot'); return r();
      case 'KeyK': this.go('staff'); return r();
      case 'KeyB': this.buildFloor = this.floor; this.buildAt = 0; this.go('build'); return r();
      case 'KeyL': this.go('launder'); return r();
      case 'KeyU': this.step({ t: 'upgrade' }); return r();
      case 'KeyH': this.host.openCrew(true); return true;
      case 'KeyM': this.host.openCrew(false); return true;
      case 'KeyS': {
        if (this.page !== 'floor') return false;
        const t = floorModel(b, this.floor, this.tileAt).tiles[this.tileAt];
        if (t?.uid) this.step({ t: 'sell', room: t.uid });
        return r();
      }
    }
    return false;
  }

  /** Arrows, Enter and Esc. Returns true when handled. */
  key(a: InputAction): boolean {
    if (!this.active()) return false;
    const b = this.block();
    if (!b) return false;
    const r = (): true => (this.host.refresh(), true);
    const cyc = (i: number, d: number, n: number): number => (n ? (i + d + n) % n : 0);
    if (a === 'back') {
      if (this.page === 'newfloor') return this.acts().floorLater!(''), true;
      if (this.page === 'arrive') return this.acts().hqBack!(''), true;
      this.back();
      return r();
    }
    switch (this.page) {
      case 'floor': {
        const n = floorModel(b, this.floor, 0).tiles.length;
        if (a === 'left' || a === 'right') this.tileAt = cyc(this.tileAt, a === 'left' ? -1 : 1, n);
        else if (a === 'up' || a === 'down') this.floorStep(a === 'up' ? -1 : 1);
        else if (a === 'confirm') this.tileMain();
        this.notice = a === 'confirm' ? this.notice : null;
        return r();
      }
      case 'plot': {
        const n = plotModel(b, 0).rows.length;
        if (a === 'up' || a === 'down') this.plotAt = cyc(this.plotAt, a === 'up' ? -1 : 1, n);
        else if (a === 'confirm') this.buyPlot(plotModel(b, this.plotAt).det.f);
        return r();
      }
      case 'build': {
        const n = buildModel(b, this.buildFloor, 0).total;
        const d = a === 'left' ? -1 : a === 'right' ? 1 : a === 'up' ? -3 : a === 'down' ? 3 : 0;
        if (d) this.buildAt = Math.max(0, Math.min(n - 1, this.buildAt + d));
        else if (a === 'confirm') this.buildPicked(this.buildAt);
        return r();
      }
      case 'staff':
        if (a === 'left' || a === 'right' || a === 'up' || a === 'down') this.staffAt = cyc(this.staffAt, a === 'left' || a === 'up' ? -1 : 1, 3);
        else if (a === 'confirm') { this.role = STAFF_ROLES[this.staffAt]!; this.factAt = 0; this.go('post'); }
        return r();
      case 'post': {
        const n = postModel(b, this.role, 0).facts.length;
        if (a === 'up' || a === 'down') this.factAt = cyc(this.factAt, a === 'up' ? -1 : 1, n);
        else if (a === 'left' || a === 'right') this.fact(this.factAt, a === 'left' ? -1 : 1);
        else if (a === 'confirm') this.step({ t: 'staffGear', role: this.role });
        return r();
      }
      case 'gear':
        if (a === 'left' || a === 'right') this.gearAt = cyc(this.gearAt, a === 'left' ? -1 : 1, 3);
        else if (a === 'confirm') this.step({ t: 'staffGear', role: STAFF_ROLES[this.gearAt]! });
        return r();
      case 'launder':
        if (a === 'left' || a === 'right' || a === 'up' || a === 'down') this.washAt = cyc(this.washAt, a === 'left' || a === 'up' ? -1 : 1, WASH_OPTS.length);
        else if (a === 'confirm') this.wash();
        return r();
      case 'glance':
        if (a === 'up' || a === 'down') this.glanceAt += a === 'up' ? -1 : 1;
        else if (a === 'confirm') {
          const m = this.glanceTargets(b);
          const go = m[Math.max(0, Math.min(this.glanceAt, m.length - 1))];
          if (go) this.host.r5go(go);
        }
        return r();
      case 'newfloor':
        if (a === 'confirm') this.acts().floorSee!('');
        return true;
      case 'rest':
        if (a === 'confirm') this.acts().restSleep!('');
        return true;
      case 'arrive':
        if (a === 'confirm') { const at = b.realm?.at; if (at) this.arrived.add(at); this.open('floor', 1); }
        return r();
      case 'mark':
        if (a === 'confirm') this.back();
        return r();
    }
    return true;
  }

  /** The Needs you rows' targets (as drawn), for Enter on the glance page. */
  private glanceTargets(b: DominionBlock): string[] {
    const html = this.glance(b, this.host.r5run()!);
    return [...html.matchAll(/data-act="r5go" data-arg="([^"]*)" data-testid="r5-need-/g)].map((x) => x[1]!);
  }
}

/** The line the floor's keeper says (the mockups' Mina, Rosa, Gus). */
function floorLine(b: DominionBlock, f: number): string {
  const free = freeOn(b, f);
  const price = plotPrice(b, f);
  if (free) return `“${free} free plot${free === 1 ? '' : 's'} on this floor, Boss. What do we build?”`;
  if (price !== null) return `“Floor’s full. There’s a plot for sale, ${money(price)}.”`;
  return '“Every plot on this floor is working, Boss.”';
}

/** The Mark: the team's colours and emblem from the Founding (picked once; nothing here changes them). */
function markModel(b: DominionBlock): MarkModel {
  const F = DOMINION_DATA.founding;
  const tc = teamColours(b);
  const cols = F.colours;
  const i = Math.max(0, cols.findIndex((c) => c.hex.toLowerCase() === (tc?.primary ?? '').toLowerCase()));
  const start = Math.max(0, Math.min(i - 2, cols.length - 5));
  return {
    name: b.team?.name ?? b.teamName ?? 'Unnamed Crew', initial: tc?.initial ?? (b.teamName?.[0]?.toUpperCase() ?? '?'), colour: tc?.primary ?? '#6d6d78', founded: !!tc,
    colours: cols.slice(start, start + 5).map((c) => ({ name: c.name, hex: c.hex, on: !!tc && c.hex.toLowerCase() === tc.primary.toLowerCase() })),
    emblems: F.logos.slice(0, 4).concat(tc && !F.logos.slice(0, 4).some((l) => l.id === tc.logo) ? F.logos.filter((l) => l.id === tc.logo) : []).slice(-4).map((l) => ({ name: l.name, glyph: LOGO_GLYPH[l.id] ?? '✦', on: !!tc && l.id === tc.logo })),
  };
}

/** Starting over in a new region (mockup `goldenrod`): the new base's Ground Floor and what came along. */
function arriveModel(b: DominionBlock) {
  const g = floorDef(1);
  const shutters: { icon: string; name: string; line: string; kind: 'own' | 'buy' | 'lock' | 'foe' }[] = [{ icon: 'g-storage-key', name: g.fixture.name, line: `Yours · ${g.fixture.does}`, kind: 'own' }];
  for (let i = 0; i < Math.min(2, freeOn(b, 1)); i++) shutters.push({ icon: 'g-card-key', name: `Plot ${i + 1}`, line: 'Yours · free to build', kind: 'own' });
  const price = plotPrice(b, 1);
  if (price !== null) shutters.push({ icon: 'g-secret-key', name: 'Plot for sale', line: `For sale · ${money(price)}`, kind: 'buy' });
  if (floorsOpen(b) < 6) shutters.push({ icon: 'g-machine-part', name: floorDef(floorsOpen(b) + 1).name, line: `Locked · HQ Lv ${floorsOpen(b) + 1}`, kind: 'lock' });
  const last = b.realm?.held[b.realm.held.length - 1];
  const glance = bossMenuModel(b, 0, { card: null, slot: 1 }).glance;
  const here = b.realm?.at ? regionName(b.realm.at) : 'here';
  return {
    title: hqName(b).toLowerCase().replace(/(^|\s)\S/g, (x) => x.toUpperCase()),
    sub: `New base · ${hqOf(b).rooms.length} room${hqOf(b).rooms.length === 1 ? '' : 's'}`,
    shutters: shutters.slice(0, 5),
    rows: [
      ['Funds', money(b.funds), 'Money doesn’t cross regions'],
      [last ? regionName(last.id) : 'Before', last ? `${last.holder.name} holds it` : 'Nothing held', last ? `Stability ${last.stability}` : ''],
      ['Heat', `${b.heat}%`, 'Nobody is looking. Yet.'],
      ['Goal', `${glance.goal.replace(/^Goal · /, '')} ${here}`, `${glance.goalPct}% so far`],
    ] as [string, string, string][],
  };
}

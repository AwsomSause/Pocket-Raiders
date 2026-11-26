// DOMINION slice D4: the controller for the Pokémon Reserve (mockup 11, tab 4) and the Rank Pyramid (mockup 12, P on the
// Crew File), kept beside DominionScene so the scene only forwards to it. It keeps the cursors; every change goes through
// GameSession.dominionStep (saved).

import { DOMINION_DATA } from '../../core/dominion/data';
import { giveTargets, pyramidModel, pyramidOrder, reserveModel, RESERVE_PAGE } from '../../core/dominion/reserveScreens';
import { dominionBlock } from '../../core/dominion/session';
import type { DominionAction } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { r5Reserve } from '../../ui/redux/screens/dominion/r50/pokemon';
import { giveData, PokemonPages, r5Give, reserveData } from './r6Pokemon';
import { r5Run } from './r50Bridge';
import type Phaser from 'phaser';

/** Columns of the Reserve's box grid (mockup `reserve`: 6 x 2). */
const COLS = 6;
import { r5Edge as r5EdgeModel, r5Member, r5Members, titleWord } from '../../core/dominion/crewR50';
import { rankWord, withCrew } from '../../core/dominion/crew';
import { teamColours } from '../../core/dominion/founding';
import type { R5Run } from '../../ui/redux/screens/dominion/r50/kit';
import { r5Edge, r5Promo, r5Pyramid } from '../../ui/redux/screens/dominion/r50/crew';

type ScreenName = 'title' | 'setup' | 'opening' | 'hq' | 'map' | 'card' | 'crew' | 'reserve' | 'pyramid' | 'base' | 'rival' | 'ledger' | 'hero' | 'interrupt' | 'desk' | 'squads' | 'founding' | 'founded' | 'debate' | 'spy' | 'takeover' | 'broadcast' | 'assign' | 'district' | 'empire' | 'partners';
interface Host {
  screenName: ScreenName;
  setNotice(n: string | null): void;
  refresh(): void;
  step(a: DominionAction): boolean;
  cache: { json: { get(k: string): unknown } };
  /** Redesign R5: the pass-50 chrome's live data, and the Boss's picture and name. */
  r5run(): R5Run | null;
  r5boss(h: number): { pic: string; name: string };
}

export class ReserveController {
  private who = 0;
  private at = 0;
  private page = 0;
  private fitsOnly = false;
  private focus: 'box' | 'team' = 'box';
  private slotAt = 0;
  private sel = 0;
  private stripArmed = false;
  private notice: string | null = null;
  /** R6: the Card (mockup `give`) for the picked Pokémon is open over the box. */
  private card = false;
  /** R6: the notice the Reserve shows now (Enter or Esc closes it first). */
  private shown: string | null = null;
  /** R6: the Party, Summary and Bag pages of the Pokémon tab. */
  readonly pages: PokemonPages;
  /** Redesign R5: the promotion just given (Promotion night, mockup `promo`): who and the rank they left. */
  private promo: { id: string; from: string } | null = null;
  /** Redesign R5: the Boss Edge page (mockup `levelup`) is up over the Pyramid (E, or a tap on the Boss). */
  private edge = false;

  constructor(private readonly host: Host) {
    this.pages = new PokemonPages(this.scene(), { refresh: () => host.refresh(), toReserve: () => { host.screenName = 'reserve'; this.card = false; }, block: () => this.block() ?? null });
  }

  private scene(): Phaser.Scene {
    return this.host as unknown as Phaser.Scene;
  }

  /** R6: a tap on the notice closes it. */
  dismiss(): void {
    this.notice = null;
    this.pages.dismiss();
  }

  /** R6: opens a page of the Pokémon tab (from the chrome: the party chip, the Start menu's Bag). */
  openPage(p: 'party' | 'summary' | 'bag'): void {
    this.host.screenName = 'reserve';
    this.card = false;
    this.pages.open(p);
  }

  private block() {
    return dominionBlock(services().session.run);
  }
  owns(): boolean {
    return this.host.screenName === 'reserve' || this.host.screenName === 'pyramid';
  }

  private whoId(): string {
    const b = this.block();
    if (!b) return 'boss';
    const t = giveTargets(b);
    this.who = Math.min(this.who, t.length - 1);
    return t[this.who]!;
  }

  private model() {
    const b = this.block()!;
    const run = services().session.run!;
    const lead = run.party[0];
    return reserveModel(b, this.whoId(), this.at, this.page, this.fitsOnly, { party: run.party.length, look: lead?.speciesId ?? '' });
  }

  render(notice: string | null): string {
    const b = this.block();
    if (!b) return '';
    const n = notice ?? this.notice;
    this.shown = this.host.screenName === 'reserve' && !this.pages.page ? n : null;
    if (this.host.screenName === 'pyramid') {
      this.sel = Math.min(this.sel, Math.max(0, b.members.length - 1));
      const hq = DOMINION_DATA.start.start.hqName.replace(/^THE /, '');
      const run = this.host.r5run();
      if (!run) return '';
      const ctx = { run, team: teamColours(b), monFile: () => null, notice: n };
      const idx = (id: string): number => b.members.findIndex((m) => m.id === id);
      const wb = withCrew(b);
      if (this.edge) return r5Edge(r5EdgeModel(b), this.host.r5boss(230), ctx);
      if (this.promo) {
        const who = wb.members.find((m) => m.id === this.promo!.id);
        if (who) {
          const pm = r5Member(wb, who);
          const row = DOMINION_DATA.pyramid.ranks[pm.rankN - 1];
          const unlocks = `${row?.unlocks ?? ''}${pm.wage ? ` · wage ₽${pm.wage} a week` : ''}`;
          return r5Promo({ m: pm, i: idx(pm.id), from: titleWord(this.promo.from), to: pm.rank, unlocks, crowd: r5Members(b).filter((x) => x.id !== pm.id), boss: this.host.r5boss(150).pic, line: `${pm.rank}. They'll be talking about tonight for weeks, Boss.` }, ctx);
        }
        this.promo = null;
      }
      const order = pyramidOrder(b).map((m) => r5Member(wb, wb.members.find((x) => x.id === m.id)!));
      return r5Pyramid(pyramidModel(b, this.sel, hq[0] + hq.slice(1).toLowerCase()), { order, sel: this.sel, boss: this.host.r5boss(40), idx }, ctx);
    }
    if (this.pages.page) return this.pages.render();
    const m = this.model();
    this.page = m.page;
    const run = r5Run(this.scene(), b);
    // R6 (pass 50): the box grid, and the Card for the picked Pokémon.
    const give = this.card ? giveData(this.scene(), b, m, this.focus === 'team' ? this.slotAt : null, n) : null;
    if (give) return r5Give(give, run);
    this.card = false;
    return r5Reserve(reserveData(this.scene(), b, m, n), run);
  }

  private say(n: string | null): void {
    this.notice = n;
    this.host.setNotice(null);
  }
  private go(a: DominionAction): void {
    this.notice = null;
    const before = a.t === 'promote' ? this.block()?.members.find((m) => m.id === a.member)?.rank ?? null : null;
    this.host.step(a);
    // Redesign R5: a promotion that went through plays Promotion night (presentation only; the step already saved).
    if (a.t === 'promote' && before) {
      const now = this.block()?.members.find((m) => m.id === a.member)?.rank;
      if (now && now !== before) this.promo = { id: a.member, from: rankWord(before) };
    }
  }
  /** Redesign R5: the Boss Edge page from elsewhere (the emblem's level badge). */
  openEdge(): void {
    this.host.screenName = 'pyramid';
    this.promo = null;
    this.edge = true;
    this.say(null);
    this.host.refresh();
  }
  /** Leave Promotion night: back to the Pyramid, or (applause) to the roster. */
  private endPromo(to: string): void {
    this.promo = null;
    if (to === 'roster') this.host.screenName = 'crew';
    this.host.refresh();
  }

  // ---------- the Reserve ----------

  private give(): void {
    const m = this.model();
    if (!m.pick) return;
    this.go({ t: 'give', uid: m.pick.uid, to: m.who.id });
    this.card = false;
    this.focus = 'box';
    this.at = Math.max(0, Math.min(this.at, this.model().tiles.length - 1));
  }
  private takeBack(i: number): void {
    const b = this.block();
    const id = this.whoId();
    const mon = b?.members.find((x) => x.id === id)?.team[i];
    if (!mon) return;
    this.go({ t: 'takeBack', member: id, uid: mon.uid });
  }
  private flipWho(d: number): void {
    const b = this.block();
    if (!b) return;
    const n = giveTargets(b).length;
    this.who = (this.who + d + n) % n;
    this.focus = 'box';
    this.slotAt = 0;
    this.say(null);
  }
  private moveTile(a: InputAction): void {
    const n = this.model().tiles.length;
    if (!n) return;
    const d = a === 'left' ? -1 : a === 'right' ? 1 : a === 'up' ? -COLS : COLS;
    const next = this.at + d;
    if (next < 0 || next >= n) {
      if (a === 'left' || a === 'up') this.turn(-1);
      else this.turn(1);
      return;
    }
    this.at = next;
  }
  private turn(d: number): void {
    const m = this.model();
    this.page = (m.page + d + m.pages) % m.pages;
    this.at = 0;
  }

  // ---------- the pyramid ----------

  private member(): string | null {
    const b = this.block();
    return b ? pyramidOrder(b)[this.sel]?.id ?? null : null;
  }

  /** Tap targets (data-act). */
  acts(): Record<string, (arg: string) => void> {
    return {
      ...this.pages.acts(),
      tile: (i) => { const again = this.at === Number(i) && this.focus === 'box'; this.at = Number(i); this.focus = 'box'; if (again && this.model().pick) this.card = true; this.host.refresh(); },
      who: (d) => { this.flipWho(Number(d)); this.host.refresh(); },
      whoBack: () => { this.flipWho(-1); this.host.refresh(); },
      fitsToggle: () => { this.fitsOnly = !this.fitsOnly; this.at = 0; this.page = 0; this.host.refresh(); },
      boxPage: (d) => { this.turn(Number(d)); this.host.refresh(); },
      fitsOnly: (v) => { this.fitsOnly = v === '1'; this.at = 0; this.page = 0; this.host.refresh(); },
      autoFill: () => this.go({ t: 'autoFill' }),
      giveIt: () => this.give(),
      takeSlot: (i) => { if (Number(i) >= 100) return; if (this.focus === 'team' && this.slotAt === Number(i)) this.takeBack(Number(i)); else { this.focus = 'team'; this.slotAt = Number(i); this.host.refresh(); } },
      r5promo: (to) => this.endPromo(to),
      r5edge: (on) => { this.edge = on === 'on' && this.host.screenName === 'pyramid'; this.say(null); this.host.refresh(); },
      r5pyr: (i) => { const k = Number(i); if (k === this.sel) { const id = this.member(); if (id) this.go({ t: 'promote', member: id }); } else this.sel = k; this.stripArmed = false; this.host.refresh(); },
      promoteIt: () => { const id = this.member(); if (id) this.go({ t: 'promote', member: id }); },
    };
  }
  overs(): Record<string, (arg: string) => void> {
    return {
      ...this.pages.overs(),
      tileOver: (i) => { if (this.card) return; this.at = Number(i); this.focus = 'box'; this.host.refresh(); },
    };
  }

  /** Tab 4 opens the Reserve; tab 1 goes back to the HQ from either screen. Returns true when handled. */
  tab(i: number): boolean {
    if (i === 3) {
      this.host.screenName = 'reserve';
      this.pages.close();
      this.card = false;
      this.focus = 'box';
      this.say(null);
      return true;
    }
    if (i === 0 && this.owns()) {
      this.pages.close();
      this.card = false;
      this.host.screenName = 'hq';
      this.say(null);
      return true;
    }
    return false;
  }

  /** Letter keys. P on the Crew File opens the Pyramid. On these two screens every letter key but Q is theirs. */
  raw(code: string): boolean {
    if (this.host.screenName === 'crew' && code === 'KeyP') {
      this.host.screenName = 'pyramid';
      this.promo = null;
      this.edge = false;
      this.say(null);
      this.host.refresh();
      return true;
    }
    // Q (hold: the command wheel) and End (quit to title) belong to the whole scene, never to these screens.
    if (!this.owns() || code.startsWith('Digit') || code === 'KeyQ' || code === 'End') return false;
    if (this.host.screenName === 'reserve' && this.pages.raw(code)) return this.host.refresh(), true;
    if (this.promo && this.host.screenName === 'pyramid') return true;
    if (this.host.screenName === 'pyramid' && code === 'KeyE') { this.edge = !this.edge; this.say(null); this.host.refresh(); return true; }
    if (this.edge && this.host.screenName === 'pyramid') return true;
    const b = this.block();
    if (!b) return true;
    if (this.host.screenName === 'pyramid') {
      const id = this.member();
      if (code === 'KeyD' && id) this.go({ t: 'demote', member: id });
      else if (code === 'KeyS' && id) {
        if (this.stripArmed) {
          this.stripArmed = false;
          this.go({ t: 'strip', member: id });
        } else {
          this.stripArmed = true;
          this.say('Strip them back to Recruit? Loyalty −40, and they may walk out tonight. Press S again.');
        }
      }
      this.host.refresh();
      return true;
    }
    const m = this.model();
    switch (code) {
      case 'KeyW': this.flipWho(-1); break;
      case 'KeyE': this.flipWho(1); break;
      case 'KeyF': this.fitsOnly = !this.fitsOnly; this.at = 0; this.page = 0; break;
      case 'KeyA': this.go({ t: 'autoFill' }); break;
      case 'BracketLeft': this.turn(-1); break;
      case 'BracketRight': this.turn(1); break;
      case 'KeyH': if (m.who.id !== 'boss') this.go({ t: 'hunt', member: m.who.id, mode: m.who.hunt === 'Hunts for themselves' ? 'reserve' : 'self' }); break;
      case 'KeyX': if (m.pick) this.go({ t: 'free', uid: m.pick.uid }); break;
      case 'Tab': if (this.card && m.who.id !== 'boss' && m.who.slots.length) { this.focus = this.focus === 'box' ? 'team' : 'box'; this.slotAt = 0; } break;
      default: break;
    }
    this.host.refresh();
    return true;
  }

  /** Arrow keys, Enter and Esc on these screens. Returns true when handled. */
  key(a: InputAction): boolean {
    if (!this.owns()) return false;
    const b = this.block();
    if (!b) return false;
    if (this.host.screenName === 'reserve' && this.pages.key(a)) return true;
    if (this.host.screenName === 'reserve' && this.shown && (a === 'confirm' || a === 'back')) {
      this.shown = null;
      this.say(null);
      return true;
    }
    if (this.promo && this.host.screenName === 'pyramid') {
      if (a === 'confirm') this.endPromo('roster');
      else if (a === 'back') this.endPromo('pyramid');
      return true;
    }
    if (this.edge && this.host.screenName === 'pyramid') {
      if (a === 'confirm' || a === 'back') this.edge = false;
      return true;
    }
    if (a === 'back') {
      if (this.focus === 'team') this.focus = 'box';
      else if (this.card) this.card = false;
      else this.host.screenName = this.host.screenName === 'pyramid' ? 'crew' : 'hq';
      this.say(null);
      return true;
    }
    if (this.host.screenName === 'pyramid') {
      const n = Math.max(1, b.members.length);
      if (a === 'up' || a === 'left') this.sel = (this.sel - 1 + n) % n;
      else if (a === 'down' || a === 'right') this.sel = (this.sel + 1) % n;
      else if (a === 'confirm') {
        const id = this.member();
        if (id) this.go({ t: 'promote', member: id });
      }
      this.stripArmed = false;
      return true;
    }
    if (this.focus === 'team') {
      const n = this.model().who.slots.length;
      if ((a === 'left' || a === 'right') && n) this.slotAt = (this.slotAt + (a === 'left' ? -1 : 1) + n) % n;
      else if (a === 'confirm') this.takeBack(this.slotAt);
      return true;
    }
    if (this.card) {
      // The Card: Enter gives; left/right change who it goes to (the Change crew button).
      if (a === 'confirm') this.give();
      else if (a === 'left' || a === 'right') this.flipWho(a === 'left' ? -1 : 1), (this.card = true);
      return true;
    }
    if (a === 'confirm') { if (this.model().pick) this.card = true; }
    else this.moveTile(a);
    return true;
  }

  /** Test hooks. */
  state(): { who: string; at: number; page: number; perPage: number; card: boolean; pages: ReturnType<PokemonPages['state']> } {
    return { who: this.whoId(), at: this.at, page: this.page, perPage: RESERVE_PAGE, card: this.card, pages: this.pages.state() };
  }
}

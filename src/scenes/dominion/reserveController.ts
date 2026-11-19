// DOMINION slice D4: the controller for the Pokémon Reserve (mockup 11, tab 4) and the Rank Pyramid (mockup 12, P on the
// Crew File), kept beside DominionScene so the scene only forwards to it. It keeps the cursors; every change goes through
// GameSession.dominionStep (saved).

import { pokemonAssetIds, type AssetManifest } from '../../assets/catalog';
import { DOMINION_DATA } from '../../core/dominion/data';
import { giveTargets, pyramidModel, pyramidOrder, reserveModel, RESERVE_PAGE } from '../../core/dominion/reserveScreens';
import { dominionBlock } from '../../core/dominion/session';
import type { DominionAction } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { rxFileOf } from '../../ui/redux/assets';
import { pyramidView, reserveView } from '../../ui/redux/screens/dominion/reserve';

type ScreenName = 'title' | 'setup' | 'opening' | 'hq' | 'map' | 'card' | 'crew' | 'reserve' | 'pyramid' | 'base';
interface Host {
  screenName: ScreenName;
  setNotice(n: string | null): void;
  refresh(): void;
  step(a: DominionAction): boolean;
  cache: { json: { get(k: string): unknown } };
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

  constructor(private readonly host: Host) {}

  private block() {
    return dominionBlock(services().session.run);
  }
  owns(): boolean {
    return this.host.screenName === 'reserve' || this.host.screenName === 'pyramid';
  }

  private monFile(species: string): string | null {
    const manifest = this.host.cache.json.get('manifest') as AssetManifest | undefined;
    const sp = services().session.content.species.get(species);
    return sp ? rxFileOf(manifest, pokemonAssetIds(sp.assets).front)?.file ?? null : null;
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
    if (this.host.screenName === 'pyramid') {
      this.sel = Math.min(this.sel, Math.max(0, b.members.length - 1));
      const hq = DOMINION_DATA.start.start.hqName.replace(/^THE /, '');
      return pyramidView(pyramidModel(b, this.sel, hq[0] + hq.slice(1).toLowerCase()), n);
    }
    const m = this.model();
    this.page = m.page;
    return reserveView(m, (s) => this.monFile(s), n, this.focus, this.slotAt);
  }

  private say(n: string | null): void {
    this.notice = n;
    this.host.setNotice(null);
  }
  private go(a: DominionAction): void {
    this.notice = null;
    this.host.step(a);
  }

  // ---------- the Reserve ----------

  private give(): void {
    const m = this.model();
    if (!m.pick) return;
    this.go({ t: 'give', uid: m.pick.uid, to: m.who.id });
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
    const d = a === 'left' ? -1 : a === 'right' ? 1 : a === 'up' ? -4 : 4;
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
      tile: (i) => { const again = this.at === Number(i) && this.focus === 'box'; this.at = Number(i); this.focus = 'box'; if (again) this.give(); else this.host.refresh(); },
      who: (d) => { this.flipWho(Number(d)); this.host.refresh(); },
      boxPage: (d) => { this.turn(Number(d)); this.host.refresh(); },
      fitsOnly: (v) => { this.fitsOnly = v === '1'; this.at = 0; this.page = 0; this.host.refresh(); },
      autoFill: () => this.go({ t: 'autoFill' }),
      giveIt: () => this.give(),
      takeSlot: (i) => { if (Number(i) < 100) this.takeBack(Number(i)); },
      promoteIt: () => { const id = this.member(); if (id) this.go({ t: 'promote', member: id }); },
    };
  }
  overs(): Record<string, (arg: string) => void> {
    return {
      tileOver: (i) => { this.at = Number(i); this.focus = 'box'; this.host.refresh(); },
    };
  }

  /** Tab 4 opens the Reserve; tab 1 goes back to the HQ from either screen. Returns true when handled. */
  tab(i: number): boolean {
    if (i === 3) {
      this.host.screenName = 'reserve';
      this.focus = 'box';
      this.say(null);
      return true;
    }
    if (i === 0 && this.owns()) {
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
      this.say(null);
      this.host.refresh();
      return true;
    }
    // Q (hold: the command wheel) and End (quit to title) belong to the whole scene, never to these screens.
    if (!this.owns() || code.startsWith('Digit') || code === 'KeyQ' || code === 'End') return false;
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
      case 'Tab': if (m.who.id !== 'boss' && m.who.slots.length) { this.focus = this.focus === 'box' ? 'team' : 'box'; this.slotAt = 0; } break;
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
    if (a === 'back') {
      if (this.focus === 'team') this.focus = 'box';
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
    if (a === 'confirm') this.give();
    else this.moveTile(a);
    return true;
  }

  /** Test hooks. */
  state(): { who: string; at: number; page: number; perPage: number } {
    return { who: this.whoId(), at: this.at, page: this.page, perPage: RESERVE_PAGE };
  }
}

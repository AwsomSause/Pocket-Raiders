// DOMINION slice D12: the controller for the Chair (mockups c1 a visitor, c2 Hand it off, c3 the Tally), kept beside
// DominionScene so the scene only forwards to it. It keeps the cursors; every change goes through
// GameSession.dominionStep (saved at every step, so a reload lands on the same visitor).
// Keys: 1 / 2 answer, 3 (or ◀▶ then Enter) Hand it off, C close the doors, O the Chair settings, Enter next / the Night.

import { pokemonAssetIds, type AssetManifest } from '../../assets/catalog';
import { chairModel } from '../../core/dominion/chairScreens';
import { dominionBlock } from '../../core/dominion/session';
import type { DominionAction } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { rxFileOf } from '../../ui/redux/assets';
import { handView, tallyView, visitorView } from '../../ui/redux/screens/dominion/chair';

interface Host {
  screenName: string;
  setNotice(n: string | null): void;
  refresh(): void;
  step(a: DominionAction): boolean;
  cache: { json: { get(k: string): unknown } };
}

const DIGITS: Record<string, number> = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5, Digit7: 6, Digit8: 7, Digit9: 8 };
const OPT_KEYS = ['length', 'numbers', 'speed'] as const;

export class ChairController {
  /** 0 / 1 the answers, 2 Hand it off. */
  private at = 0;
  /** The Hand it off list's cursor, or null when the visitor is shown. */
  private hand: number | null = null;
  private opts = false;

  constructor(private readonly host: Host) {}

  private block() {
    return dominionBlock(services().session.run);
  }
  /** The HQ draws the Chair while a sitting is open (the Evening, before the Night). */
  owns(): boolean {
    return this.host.screenName === 'hq' && !!this.block()?.chair?.open;
  }
  private model() {
    const b = this.block()!;
    return chairModel(b, services().session.run!, this.at, this.hand);
  }

  render(notice: string | null): string {
    const b = this.block();
    if (!b) return '';
    const m = this.model();
    const mon = (s: string): string | null => this.monFile(s);
    if (m.kind === 'visitor') return visitorView(m, mon, b.teamName?.[0]?.toUpperCase() ?? 'N', notice, this.opts);
    if (m.kind === 'hand') return handView(m, mon, notice);
    if (m.kind === 'tally') return tallyView(m, mon);
    return '';
  }

  private monFile(species: string): string | null {
    const manifest = this.host.cache.json.get('manifest') as AssetManifest | undefined;
    const sp = services().session.content.species.get(species);
    return sp ? rxFileOf(manifest, pokemonAssetIds(sp.assets).front)?.file ?? null : null;
  }

  private go(a: DominionAction): void {
    this.host.step(a);
  }
  private answer(i: number): void {
    const m = this.model();
    if (m.kind !== 'visitor' || m.result) return;
    if (i === 2) return this.openHand();
    this.at = i;
    if (this.host.step({ t: 'court', choice: i })) this.at = 0;
  }
  private openHand(): void {
    const m = this.model();
    if (m.kind !== 'visitor' || !m.hand.can || m.result) return;
    this.hand = 0;
    const h = this.model();
    if (h.kind === 'hand') this.hand = Math.max(0, h.rows.findIndex((r) => r.can));
    this.host.setNotice(null);
    this.host.refresh();
  }
  private pick(i: number): void {
    const h = this.model();
    if (h.kind !== 'hand') return;
    const row = h.rows[i];
    if (!row) return;
    this.hand = i;
    if (!row.can) return this.host.refresh();
    if (this.host.step({ t: 'handOff', member: row.id })) {
      this.hand = null;
      this.at = 0;
      this.host.refresh();
    }
  }
  private next(): void {
    const m = this.model();
    if (m.kind === 'tally') return this.go({ t: 'toNight' });
    if (m.kind === 'visitor' && m.result) {
      this.at = 0;
      this.go({ t: 'courtNext' });
    }
  }

  /** Tap targets (data-act). */
  acts(): Record<string, (arg: string) => void> {
    return {
      court: (i) => this.answer(Number(i)),
      handPick: (i) => this.pick(Number(i)),
      closeDoors: () => this.go({ t: 'closeDoors' }),
      chairOpts: () => { this.opts = !this.opts; this.host.refresh(); },
      chairOpt: (k) => this.go({ t: 'chairOpt', key: k as (typeof OPT_KEYS)[number] }),
      toNight: () => this.next(),
    };
  }
  overs(): Record<string, (arg: string) => void> {
    return {
      courtOver: (i) => { this.at = Number(i); this.host.refresh(); },
      handOver: (i) => { this.hand = Number(i); this.host.refresh(); },
    };
  }

  /** Letter and number keys while the Chair is open. Returns true when handled (every key is the Chair's then). */
  raw(code: string): boolean {
    if (!this.owns()) return false;
    const m = this.model();
    if (this.opts) {
      if (code in DIGITS && DIGITS[code]! < 3) this.go({ t: 'chairOpt', key: OPT_KEYS[DIGITS[code]!]! });
      else if (code === 'KeyO') { this.opts = false; this.host.refresh(); }
      return true;
    }
    if (m.kind === 'hand') {
      if (code in DIGITS) this.pick(DIGITS[code]!);
      return true;
    }
    if (m.kind === 'visitor') {
      if (code === 'KeyO') { this.opts = true; this.host.refresh(); }
      else if (code === 'KeyC' && m.canClose) this.go({ t: 'closeDoors' });
      else if (code in DIGITS && DIGITS[code]! < 3) this.answer(DIGITS[code]!);
    }
    return true;
  }

  /** Arrow keys, Enter and Esc. Returns true when handled. */
  key(a: InputAction): boolean {
    if (!this.owns()) return false;
    if (this.opts) {
      if (a === 'back') this.opts = false;
      return true;
    }
    const m = this.model();
    if (m.kind === 'hand') {
      const n = m.rows.length;
      if (a === 'up' || a === 'down') this.hand = ((this.hand ?? 0) + (a === 'up' ? -1 : 1) + n) % n;
      else if (a === 'confirm') this.pick(this.hand ?? 0);
      else if (a === 'back') { this.hand = null; this.host.setNotice(null); }
      return true;
    }
    if (m.kind === 'tally') {
      if (a === 'confirm') this.next();
      return true;
    }
    if (m.kind !== 'visitor') return true;
    if (m.result) {
      if (a === 'confirm') this.next();
      return true;
    }
    const n = m.hand.can ? 3 : 2;
    if (this.at >= n) this.at = 0;
    if (a === 'left' || a === 'right') this.at = (this.at + (a === 'left' ? -1 : 1) + n) % n;
    else if (a === 'confirm') this.answer(this.at);
    return true;
  }
}

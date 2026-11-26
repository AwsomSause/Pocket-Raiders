// DOMINION slice D12: the controller for the Chair (mockups c1 a visitor, c2 Hand it off, c3 the Tally), kept beside
// DominionScene so the scene only forwards to it. It keeps the cursors; every change goes through
// GameSession.dominionStep (saved at every step, so a reload lands on the same visitor).
// Keys: 1 / 2 answer, 3 (or ◀▶ then Enter) Hand it off, C close the doors, O the Chair settings, Enter next / the Night.

import { chairModel } from '../../core/dominion/chairScreens';
import { dominionBlock } from '../../core/dominion/session';
import type { DominionAction } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { favoursModel, queueModel } from '../../core/dominion/r8Pages';
import { monName } from '../../core/dominion/crew';
import type { R5Pics } from '../../ui/redux/screens/dominion/r50/chairR8';
import { r5Favours, r5Hand, r5Queue, r5Tally, r5Visitor } from '../../ui/redux/screens/dominion/r50/chairR8';
import type { R5Run } from '../../ui/redux/screens/dominion/r50/kit';
import { chairVoice } from './r8Bridge';

interface Host {
  screenName: string;
  setNotice(n: string | null): void;
  refresh(): void;
  step(a: DominionAction): boolean;
  cache: { json: { get(k: string): unknown } };
  /** Redesign R8: the pass-50 chrome's run data and how people are drawn. */
  r8(): { run: R5Run; pics: R5Pics } | null;
}

const DIGITS: Record<string, number> = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5, Digit7: 6, Digit8: 7, Digit9: 8 };
const OPT_KEYS = ['length', 'numbers', 'speed'] as const;

export class ChairController {
  /** 0 / 1 the answers, 2 Hand it off. */
  private at = 0;
  /** The Hand it off list's cursor, or null when the visitor is shown. */
  private hand: number | null = null;
  private opts = false;
  /** Redesign R8: the waiting room (V) or the favour ledger (F) over the visitor, and the bench's cursor. */
  private side: 'queue' | 'favours' | null = null;
  private qAt = 0;
  /** The favour ledger's cursor (a row of "They owe you"). */
  private fAt = 0;

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
    const r = this.host.r8();
    if (!r) return '';
    const { run, pics } = r;
    const who = chairVoice(b);
    if (m.kind !== 'visitor' || m.result) this.side = null;
    if (this.side === 'favours') return r5Favours(favoursModel(b), { pics, who, at: this.fAt, notice }, run);
    if (this.side === 'queue') {
      const q = queueModel(b);
      if (q) return r5Queue(q, { at: this.qAt, pics, who, team: b.teamName ?? 'Your crew' }, run);
    }
    if (m.kind === 'visitor') {
      const v = m.lead ? { ...m, lead: { ...m.lead, react: m.lead.react.replace('{mon}', monName(m.lead.species)) } } : m;
      return r5Visitor(v, { pics, team: b.teamName ?? 'Your crew', notice, opts: this.opts, queue: queueModel(b)?.left ?? 0 }, run);
    }
    if (m.kind === 'hand') return r5Hand(m, { pics, notice }, run);
    if (m.kind === 'tally') return r5Tally(m, { who }, run);
    return '';
  }

  /** Redesign R8: V the waiting room, F the favour ledger (from the bench), Esc or Enter back to the visitor. */
  private openSide(s: 'queue' | 'favours' | null): void {
    this.side = s;
    if (s === 'queue') this.qAt = 0;
    if (s === 'favours') this.fAt = Math.max(0, favoursModel(this.block()!).owe.findIndex((r) => r.who));
    this.host.setNotice(null);
    this.host.refresh();
  }

  /** Call it in: spend the Favour on that row of the ledger (it stays open to show what came back). */
  private callIn(i: number): void {
    const row = favoursModel(this.block()!).owe[i];
    this.fAt = i;
    if (!row?.who) return this.host.refresh();
    this.host.step({ t: 'callIn', who: row.who });
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
      r8Queue: () => this.openSide('queue'),
      r8QueuePick: (i) => { this.qAt = Number(i); this.host.refresh(); },
      r8QueueClose: () => this.openSide(null),
      r8Favours: () => this.openSide('favours'),
      r8FavoursBack: () => this.openSide('queue'),
      r8CallIn: (i) => this.callIn(Number(i)),
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
    if (this.side) {
      if (code === 'KeyF' && this.side === 'queue') this.openSide('favours');
      else if (code === 'KeyV' || (code === 'KeyF' && this.side === 'favours')) this.openSide(this.side === 'favours' ? 'queue' : null);
      return true;
    }
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
      else if (code === 'KeyV') this.openSide('queue');
      else if (code === 'KeyC' && m.canClose) this.go({ t: 'closeDoors' });
      else if (code in DIGITS && DIGITS[code]! < 3) this.answer(DIGITS[code]!);
    }
    return true;
  }

  /** Arrow keys, Enter and Esc. Returns true when handled. */
  key(a: InputAction): boolean {
    if (!this.owns()) return false;
    if (this.side === 'favours') {
      const owe = favoursModel(this.block()!).owe;
      const n = owe.length;
      if ((a === 'up' || a === 'down') && n) this.fAt = (this.fAt + (a === 'up' ? n - 1 : 1)) % n;
      else if (a === 'confirm' && owe[this.fAt]?.who) this.callIn(this.fAt);
      else if (a === 'confirm' || a === 'back') this.openSide('queue');
      return true;
    }
    if (this.side === 'queue') {
      const n = queueModel(this.block()!)?.left ?? 0;
      if ((a === 'left' || a === 'right') && n) this.qAt = (this.qAt + (a === 'left' ? n - 1 : 1)) % n;
      else if (a === 'confirm' || a === 'back') this.side = null;
      return true;
    }
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

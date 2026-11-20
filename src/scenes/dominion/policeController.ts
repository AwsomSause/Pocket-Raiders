// DOMINION slice D24: the controller for the interview room and the release page, kept beside DominionScene so the
// scene only forwards to it. While a questioning is open (or its release page is unread) it owns the screen, whatever
// page the Boss was on. It keeps the typing box; every answer goes through GameSession.dominionStep (saved). A typed
// answer is judged by Rotom when a Key-Card is in (askClaude: stored in the run, so a reload never asks again) or by
// the rules; either way the rules decide what it does.

import { askClaude } from '../../ai/ask';
import { judgeAsk } from '../../core/dominion/police';
import { questionModel, QUICK, releaseModel, tagOf } from '../../core/dominion/policeScreens';
import { dominionBlock } from '../../core/dominion/session';
import type { AnswerKind, DominionAction, Judge } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { questionView, releaseView } from '../../ui/redux/screens/dominion/police';

interface Host {
  refresh(): void;
  /** The release page is read: back to the HQ. */
  toHq(): void;
  policeStep(a: DominionAction): { ok: boolean; notice: string | null };
  monFile(species: string): string | null;
  /** The Boss's sprite (an atlas or a png), or null while it loads. */
  bossLook(): string | null;
}

/** Keys the input layer also reads as actions: when the typing box takes one, its action is dropped. */
const ACTION_CODES = new Set(['Enter', 'NumpadEnter', 'Space', 'KeyZ', 'Escape', 'KeyX', 'Backspace', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD']);
const DIGITS: Record<string, number> = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3, Numpad5: 4 };
const MAX = 140;

export class PoliceController {
  private typing = false;
  private text = '';
  private busy = false;
  private notice: string | null = null;
  /** When the typing box took a key the input layer also reads (its action is dropped). */
  private tookAt = -1;
  /** Phaser can hand the same key event over twice in one frame (D13): each is read once. */
  private seen = new WeakSet<KeyboardEvent>();

  constructor(private readonly host: Host) {}

  private block() {
    return dominionBlock(services().session.run);
  }

  /** True while a questioning is open or its release page is unread. */
  owns(): boolean {
    const p = this.block()?.police;
    return !!p && (!!p.q || (!!p.last && !p.last.seen));
  }

  render(): string {
    const b = this.block();
    if (!b) return '';
    const mon = (s: string): string | null => this.host.monFile(s);
    const q = questionModel(b);
    if (q) return questionView(q, { on: this.typing, text: this.text, busy: this.busy, notice: this.notice }, mon);
    const r = releaseModel(b);
    if (!r) return '';
    const m = r.boss ? null : b.members.find((x) => x.id === b.police!.last!.who);
    return releaseView(r, { look: r.boss ? this.host.bossLook() : m?.look ?? null, name: r.name }, tagOf, mon);
  }

  acts(): Record<string, (arg: string) => void> {
    return {
      policeAnswer: (k) => this.answer(k as AnswerKind),
      policeType: () => { if (this.block()?.police?.q && !this.busy) { this.typing = true; this.notice = null; this.host.refresh(); } },
      policeDone: () => this.done(),
    };
  }

  private answer(kind: AnswerKind): void {
    if (this.busy || !this.block()?.police?.q) return;
    this.typing = false;
    const out = this.host.policeStep({ t: 'answer', kind });
    this.notice = out.ok ? null : out.notice;
    this.host.refresh();
  }

  private done(): void {
    if (!this.block()?.police?.last || this.block()!.police!.q) return;
    this.host.policeStep({ t: 'released' });
    this.host.toHq();
  }

  /** A typed answer: Rotom judges it when it can (the answer is stored with the run), else the rules do. */
  private async submit(): Promise<void> {
    const text = this.text.trim();
    const b = this.block();
    if (!text || !b?.police?.q || this.busy) return;
    const ask = judgeAsk(b, text);
    if (!ask) return;
    const at = { n: b.police.q.n, turn: b.police.q.turns.length };
    this.busy = true;
    this.host.refresh();
    let judge: Judge = ask.offline();
    let rotom = false;
    const env = services().session.aiEnv();
    if (env) {
      try {
        const got = await askClaude({ id: ask.id, role: 'judge', use: 'typed', system: ask.system, context: ask.context, input: ask.input, schema: ask.schema, offline: ask.offline }, env);
        judge = got.value;
        rotom = got.source !== 'offline';
      } catch {
        // The rules' judge stands.
      }
    }
    this.busy = false;
    this.typing = false;
    this.text = '';
    // The run moved on while Rotom thought (a reload, the scene left): the answer belongs to that moment only.
    const q = this.block()?.police?.q;
    if (!q || q.n !== at.n || q.turns.length !== at.turn) return this.host.refresh();
    const out = this.host.policeStep({ t: 'answer', kind: 'typed', text, judge, rotom });
    this.notice = out.ok ? null : out.notice;
    this.host.refresh();
  }

  /** Raw keys first: digits answer, T opens the typing box, and while it's open every printable key is typed. */
  raw(e: KeyboardEvent): boolean {
    if (!this.owns()) return false;
    if (this.seen.has(e)) return true;
    this.seen.add(e);
    const q = this.block()?.police?.q;
    // The release page reads Enter / Esc through key(); every other key is the page's (nothing else moves).
    if (!q) return true;
    if (this.busy) return this.took(e.code);
    if (this.typing) {
      if (e.code === 'Enter' || e.code === 'NumpadEnter') void this.submit();
      else if (e.code === 'Escape') this.typing = false;
      else if (e.code === 'Backspace') this.text = this.text.slice(0, -1);
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && this.text.length < MAX) this.text += e.key;
      else return this.took(e.code);
      if (e.code === 'Space' || e.code === 'Backspace') e.preventDefault();
      this.host.refresh();
      return this.took(e.code);
    }
    if (e.code in DIGITS) {
      const kind = QUICK[DIGITS[e.code]!];
      if (kind) this.answer(kind);
      return true;
    }
    if (e.code === 'KeyT') {
      this.typing = true;
      this.notice = null;
      this.host.refresh();
    }
    return true;
  }

  private took(code: string): true {
    if (ACTION_CODES.has(code)) this.tookAt = performance.now();
    return true;
  }

  /** Arrows, Enter and Esc. Esc stays silent in the room; Enter goes back to the HQ from the release page. */
  key(a: InputAction): boolean {
    if (!this.owns()) return false;
    if (this.tookAt >= 0 && performance.now() - this.tookAt < 50) {
      this.tookAt = -1;
      return true;
    }
    if (this.busy || this.typing) return true;
    const b = this.block();
    if (b?.police?.q) {
      if (a === 'back') this.answer('silent');
      else if (a === 'confirm' && this.notice) {
        this.notice = null;
        this.host.refresh();
      }
      return true;
    }
    if (a === 'confirm' || a === 'back') this.done();
    return true;
  }
}

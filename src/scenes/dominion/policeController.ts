// DOMINION slice D24: the controller for the interview room and the release page, kept beside DominionScene so the
// scene only forwards to it. While a questioning is open (or its release page is unread) it owns the screen, whatever
// page the Boss was on. Typed answers use the shared typing box (src/ui/typeBox.ts, D21); every answer goes through GameSession.dominionStep (saved). A typed
// answer is judged by Rotom when a Key-Card is in (askClaude: stored in the run, so a reload never asks again) or by
// the rules; either way the rules decide what it does.

import { askClaude } from '../../ai/ask';
import { DOMINION_DATA } from '../../core/dominion/data';
import { judgeAsk, officerById } from '../../core/dominion/police';
import { questionModel, QUICK, releaseModel, tagOf } from '../../core/dominion/policeScreens';
import { dominionBlock } from '../../core/dominion/session';
import type { AnswerKind, DominionAction, Judge } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { closeTypeBox, openTypeBox, typeBoxOpen } from '../../ui/typeBox';
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

const DIGITS: Record<string, number> = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3, Numpad5: 4 };
/** The typed answer's limit (police.json `judge.maxText`). */
const MAX = DOMINION_DATA.police.judge.maxText;

export class PoliceController {
  private busy = false;
  private alive = true;
  private notice: string | null = null;
  /** Phaser can hand the same key event over twice in one frame (D13): each is read once. */
  private seen = new WeakSet<KeyboardEvent>();

  constructor(private readonly host: Host) {}

  /** The scene shuts down: a typing box still open is closed without sending. */
  shutdown(): void {
    this.alive = false;
    closeTypeBox();
  }

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
    if (q) return questionView(q, { on: typeBoxOpen(), text: '', busy: this.busy, notice: this.notice }, mon);
    const r = releaseModel(b);
    if (!r) return '';
    const m = r.boss ? null : b.members.find((x) => x.id === b.police!.last!.who);
    return releaseView(r, { look: r.boss ? this.host.bossLook() : m?.look ?? null, name: r.name }, tagOf, mon);
  }

  acts(): Record<string, (arg: string) => void> {
    return {
      policeAnswer: (k) => this.answer(k as AnswerKind),
      policeType: () => this.openBox(),
      policeDone: () => this.done(),
    };
  }

  private answer(kind: AnswerKind): void {
    if (this.busy || typeBoxOpen() || !this.block()?.police?.q) return;
    const out = this.host.policeStep({ t: 'answer', kind });
    this.notice = out.ok ? null : out.notice;
    this.host.refresh();
  }

  private done(): void {
    if (!this.block()?.police?.last || this.block()!.police!.q) return;
    this.host.policeStep({ t: 'released' });
    this.host.toHq();
  }

  /** T: the shared typing box, clamped to the data's limit. Enter sends, Esc cancels. */
  private openBox(): void {
    const q = this.block()?.police?.q;
    if (!q || this.busy || typeBoxOpen()) return;
    this.notice = null;
    openTypeBox({
      title: `Your own words to ${officerById(q.officer).name}`,
      placeholder: "I was at the Game Corner all night. Ask anyone.",
      maxChars: MAX,
      onSend: (text) => { if (this.alive) void this.submit(text); },
      onClose: () => { if (this.alive) this.host.refresh(); },
    });
    this.host.refresh();
  }

  /** A typed answer: Rotom judges it when it can (the answer is stored with the run), else the rules do. */
  private async submit(typed: string): Promise<void> {
    const text = typed.trim().slice(0, MAX);
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
    if (!this.alive) return;
    // The run moved on while Rotom thought (a reload, the scene left): the answer belongs to that moment only.
    const q = this.block()?.police?.q;
    if (!q || q.n !== at.n || q.turns.length !== at.turn) return this.host.refresh();
    const out = this.host.policeStep({ t: 'answer', kind: 'typed', text, judge, rotom });
    this.notice = out.ok ? null : out.notice;
    this.host.refresh();
  }

  /** Raw keys first: digits answer and T opens the typing box (which then takes every key itself). */
  raw(e: KeyboardEvent): boolean {
    if (!this.owns()) return false;
    if (this.seen.has(e)) return true;
    this.seen.add(e);
    const q = this.block()?.police?.q;
    // The release page reads Enter / Esc through key(); every other key is the page's (nothing else moves).
    if (!q || this.busy || typeBoxOpen()) return true;
    if (e.code in DIGITS) {
      const kind = QUICK[DIGITS[e.code]!];
      if (kind) this.answer(kind);
      return true;
    }
    if (e.code === 'KeyT') {
      // Stopped so its letter doesn't land in the box it opens.
      e.preventDefault();
      if (!e.repeat) this.openBox();
    }
    return true;
  }

  /** Arrows, Enter and Esc. Esc stays silent in the room; Enter goes back to the HQ from the release page. */
  key(a: InputAction): boolean {
    if (!this.owns()) return false;
    if (this.busy || typeBoxOpen()) return true;
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
